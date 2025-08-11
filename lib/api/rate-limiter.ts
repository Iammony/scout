// Rate limiter for RapidAPI requests
// Implements sliding window rate limiting with 1000 requests per hour

interface RateLimitInfo {
  requests: number[];  // Timestamps of requests
  resetTime: number;   // When the window resets
}

class RateLimiter {
  private limits: Map<string, RateLimitInfo> = new Map();
  private readonly maxRequests = 1000;  // Maximum requests per hour
  private readonly windowMs = 60 * 60 * 1000;  // 1 hour in milliseconds
  
  constructor() {
    // Clean up old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }
  
  /**
   * Check if request can proceed within rate limit
   */
  canProceed(apiHost: string): boolean {
    const now = Date.now();
    const info = this.limits.get(apiHost) || { requests: [], resetTime: now + this.windowMs };
    
    // Remove requests outside the current window
    info.requests = info.requests.filter(timestamp => 
      timestamp > now - this.windowMs
    );
    
    // Check if we're within the limit
    return info.requests.length < this.maxRequests;
  }
  
  /**
   * Record a request
   */
  recordRequest(apiHost: string): void {
    const now = Date.now();
    const info = this.limits.get(apiHost) || { requests: [], resetTime: now + this.windowMs };
    
    // Add current request
    info.requests.push(now);
    
    // Remove old requests
    info.requests = info.requests.filter(timestamp => 
      timestamp > now - this.windowMs
    );
    
    // Update reset time
    if (info.requests.length === 1) {
      info.resetTime = now + this.windowMs;
    }
    
    this.limits.set(apiHost, info);
  }
  
  /**
   * Get remaining requests for an API
   */
  getRemainingRequests(apiHost: string): number {
    const now = Date.now();
    const info = this.limits.get(apiHost);
    
    if (!info) return this.maxRequests;
    
    // Count requests in current window
    const recentRequests = info.requests.filter(timestamp => 
      timestamp > now - this.windowMs
    );
    
    return Math.max(0, this.maxRequests - recentRequests.length);
  }
  
  /**
   * Get time until rate limit resets (in seconds)
   */
  getResetTime(apiHost: string): number {
    const now = Date.now();
    const info = this.limits.get(apiHost);
    
    if (!info || info.requests.length === 0) return 0;
    
    // Find the oldest request in the window
    const oldestRequest = Math.min(...info.requests);
    const resetTime = oldestRequest + this.windowMs;
    
    return Math.max(0, Math.ceil((resetTime - now) / 1000));
  }
  
  /**
   * Wait if rate limit is exceeded
   */
  async waitIfNeeded(apiHost: string): Promise<void> {
    if (this.canProceed(apiHost)) {
      return;
    }
    
    const waitTime = this.getResetTime(apiHost);
    console.log(`Rate limit reached for ${apiHost}. Waiting ${waitTime} seconds...`);
    
    // Wait with exponential backoff
    const backoffMs = Math.min(waitTime * 1000, 60000); // Max 1 minute wait
    await new Promise(resolve => setTimeout(resolve, backoffMs));
  }
  
  /**
   * Clean up old entries
   */
  private cleanup(): void {
    const now = Date.now();
    const hostsToDelete: string[] = [];
    
    this.limits.forEach((info, apiHost) => {
      // Remove entries with no recent requests
      const hasRecentRequests = info.requests.some(timestamp => 
        timestamp > now - this.windowMs * 2  // Keep for 2 hours
      );
      
      if (!hasRecentRequests) {
        hostsToDelete.push(apiHost);
      }
    });
    
    hostsToDelete.forEach(host => this.limits.delete(host));
  }
  
  /**
   * Get rate limit status for all APIs
   */
  getStatus(): Record<string, { used: number; remaining: number; resetIn: number }> {
    const status: Record<string, any> = {};
    
    this.limits.forEach((_, apiHost) => {
      const remaining = this.getRemainingRequests(apiHost);
      const used = this.maxRequests - remaining;
      const resetIn = this.getResetTime(apiHost);
      
      status[apiHost] = { used, remaining, resetIn };
    });
    
    return status;
  }
  
  /**
   * Reset rate limit for an API (for testing)
   */
  reset(apiHost?: string): void {
    if (apiHost) {
      this.limits.delete(apiHost);
    } else {
      this.limits.clear();
    }
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Helper function to extract host from URL
export function extractApiHost(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname;
  } catch {
    return url;
  }
}