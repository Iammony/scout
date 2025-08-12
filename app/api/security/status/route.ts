import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { enhancedSessionManager } from '@/lib/auth/enhanced-session';
import { dbManager } from '@/lib/db/db-config';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Security status endpoint - requires authentication
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only allow admin users to view security status (check for admin role)
    if (!(user as any).isAdmin && user.email !== 'admin@scout.app') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Collect security metrics
    const sessionStats = enhancedSessionManager.getSessionStats();
    const dbMetrics = dbManager.getMetrics();
    const dbConfig = dbManager.getConfig();

    const securityStatus = {
      timestamp: new Date().toISOString(),
      sessions: {
        ...sessionStats,
        healthStatus: sessionStats.highRiskSessions > 0 ? 'warning' : 'healthy'
      },
      database: {
        ...dbMetrics,
        configuration: dbConfig,
        healthStatus: dbMetrics.failedConnections > 5 ? 'warning' : 'healthy'
      },
      security: {
        environment: process.env.NODE_ENV,
        httpsEnabled: process.env.NODE_ENV === 'production',
        captchaEnabled: false,
        hmacSigningEnabled: false,
        rateLimitingEnabled: true
      },
      recommendations: generateSecurityRecommendations(sessionStats, dbMetrics)
    };

    return NextResponse.json({
      success: true,
      data: securityStatus
    });

  } catch (error) {
    console.error('Security status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve security status' },
      { status: 500 }
    );
  }
}

function generateSecurityRecommendations(sessionStats: any, dbMetrics: any): string[] {
  const recommendations: string[] = [];

  if (sessionStats.highRiskSessions > 0) {
    recommendations.push('High-risk sessions detected. Consider reviewing authentication logs.');
  }

  if (sessionStats.averageRotations > 5) {
    recommendations.push('High session rotation rate detected. May indicate suspicious activity.');
  }

  if (dbMetrics.failedConnections > 3) {
    recommendations.push('Database connection failures detected. Check database health.');
  }

  if (sessionStats.totalSessions > 100) {
    recommendations.push('High session count. Consider implementing session cleanup policies.');
  }

  if (process.env.NODE_ENV === 'development') {
    recommendations.push('Application is running in development mode. Ensure production settings for deployment.');
  }

  if (recommendations.length === 0) {
    recommendations.push('All security metrics appear healthy.');
  }

  return recommendations;
}