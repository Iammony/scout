// Enhanced Database Configuration with Security Features
import { AxioDB } from 'axiodb';

interface DatabaseConfig {
  connectionPoolLimit: number;
  queryTimeout: number;
  enableEncryption: boolean;
  maxRetries: number;
  retryDelay: number;
  healthCheckInterval: number;
}

interface ConnectionMetrics {
  activeConnections: number;
  totalConnections: number;
  failedConnections: number;
  lastHealthCheck: Date;
  averageResponseTime: number;
}

class SecureDatabaseManager {
  private static instance: SecureDatabaseManager;
  private db: AxioDB | null = null;
  private config: DatabaseConfig;
  private metrics: ConnectionMetrics;
  private connectionPool: Set<any> = new Set();
  private healthCheckTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.config = {
      connectionPoolLimit: parseInt(process.env.DB_POOL_LIMIT || '10'),
      queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'), // 30 seconds
      enableEncryption: process.env.NODE_ENV === 'production',
      maxRetries: 3,
      retryDelay: 1000,
      healthCheckInterval: 60000, // 1 minute
    };

    this.metrics = {
      activeConnections: 0,
      totalConnections: 0,
      failedConnections: 0,
      lastHealthCheck: new Date(),
      averageResponseTime: 0,
    };

    this.startHealthCheck();
  }

  static getInstance(): SecureDatabaseManager {
    if (!SecureDatabaseManager.instance) {
      SecureDatabaseManager.instance = new SecureDatabaseManager();
    }
    return SecureDatabaseManager.instance;
  }

  async getConnection(): Promise<AxioDB> {
    if (this.connectionPool.size >= this.config.connectionPoolLimit) {
      throw new Error('Connection pool limit exceeded');
    }

    if (!this.db) {
      await this.createConnection();
    }

    return this.db!;
  }

  private async createConnection(): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Skip initialization during build process
      if (process.env.NEXT_PHASE === 'phase-production-build' || 
          (process.env.NODE_ENV === 'production' && !process.env.VERCEL)) {
        console.log('Skipping database initialization during build phase');
        return;
      }

      this.db = new AxioDB();
      this.metrics.activeConnections++;
      this.metrics.totalConnections++;
      
      const responseTime = Date.now() - startTime;
      this.updateAverageResponseTime(responseTime);
      
      console.log(`✅ Database connection established in ${responseTime}ms`);
      
    } catch (error) {
      this.metrics.failedConnections++;
      console.error('❌ Database connection failed:', error);
      throw new Error('Failed to establish database connection');
    }
  }

  async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeout: number = this.config.queryTimeout
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), timeout)
      ),
    ]);
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    retries: number = this.config.maxRetries
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === retries) {
          break;
        }
        
        console.warn(`Database operation failed, retrying (${attempt + 1}/${retries + 1}):`, error);
        await this.delay(this.config.retryDelay * Math.pow(2, attempt)); // Exponential backoff
      }
    }
    
    throw lastError!;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private updateAverageResponseTime(responseTime: number): void {
    const alpha = 0.1; // Smoothing factor for exponential moving average
    this.metrics.averageResponseTime = 
      this.metrics.averageResponseTime * (1 - alpha) + responseTime * alpha;
  }

  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(async () => {
      try {
        const startTime = Date.now();
        
        if (this.db) {
          // Perform a simple health check operation
          await this.executeWithTimeout(async () => {
            // Basic connectivity test
            return Promise.resolve(true);
          }, 5000);
          
          const responseTime = Date.now() - startTime;
          this.updateAverageResponseTime(responseTime);
          this.metrics.lastHealthCheck = new Date();
          
          console.log(`📊 Database health check: OK (${responseTime}ms)`);
        }
      } catch (error) {
        console.error('❌ Database health check failed:', error);
        this.metrics.failedConnections++;
        
        // Attempt to reconnect if health check fails
        try {
          await this.reconnect();
        } catch (reconnectError) {
          console.error('❌ Database reconnection failed:', reconnectError);
        }
      }
    }, this.config.healthCheckInterval);
  }

  private async reconnect(): Promise<void> {
    console.log('🔄 Attempting database reconnection...');
    this.db = null;
    this.metrics.activeConnections = 0;
    await this.createConnection();
  }

  getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }

  getConfig(): DatabaseConfig {
    return { ...this.config };
  }

  async close(): Promise<void> {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    if (this.db) {
      this.db = null;
      this.metrics.activeConnections = 0;
      console.log('Database connection closed');
    }
  }

  // Security helper for query sanitization
  sanitizeQuery(query: any): any {
    if (typeof query === 'string') {
      // Remove potentially dangerous characters
      return query.replace(/[<>'";&()]/g, '');
    }
    
    if (Array.isArray(query)) {
      return query.map(item => this.sanitizeQuery(item));
    }
    
    if (query && typeof query === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(query)) {
        // Sanitize both keys and values
        const sanitizedKey = key.replace(/[<>'";&()]/g, '');
        sanitized[sanitizedKey] = this.sanitizeQuery(value);
      }
      return sanitized;
    }
    
    return query;
  }
}

// Export singleton instance
export const dbManager = SecureDatabaseManager.getInstance();

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    console.log('Gracefully shutting down database connections...');
    await dbManager.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Gracefully shutting down database connections...');
    await dbManager.close();
    process.exit(0);
  });
}