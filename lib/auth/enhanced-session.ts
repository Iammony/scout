// Enhanced Session Security with Device Fingerprinting and Rotation
import crypto from 'crypto';
import { NextRequest } from 'next/server';

interface DeviceFingerprint {
  userAgent: string;
  acceptLanguage: string;
  acceptEncoding: string;
  ipAddress: string;
  hash: string;
}

interface SessionRecord {
  sessionId: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  lastAccessedAt: Date;
  deviceFingerprint: DeviceFingerprint;
  isPrivileged: boolean;
  rotationCount: number;
  riskScore: number;
}

interface SessionLimits {
  maxConcurrentSessions: number;
  privilegedSessionDuration: number;
  regularSessionDuration: number;
  maxRotations: number;
  suspiciousActivityThreshold: number;
}

class EnhancedSessionManager {
  private sessions = new Map<string, SessionRecord>();
  private userSessions = new Map<string, Set<string>>(); // userId -> sessionIds
  private readonly limits: SessionLimits;

  constructor() {
    this.limits = {
      maxConcurrentSessions: parseInt(process.env.MAX_CONCURRENT_SESSIONS || '5'),
      privilegedSessionDuration: 30 * 60 * 1000, // 30 minutes for privileged operations
      regularSessionDuration: 24 * 60 * 60 * 1000, // 24 hours for regular sessions
      maxRotations: 10, // Maximum session rotations before forcing re-authentication
      suspiciousActivityThreshold: 50 // Risk score threshold for flagging suspicious activity
    };

    // Clean up expired sessions every 15 minutes
    setInterval(() => this.cleanupExpiredSessions(), 15 * 60 * 1000);
  }

  /**
   * Create device fingerprint from request headers
   */
  createDeviceFingerprint(request: NextRequest): DeviceFingerprint {
    const userAgent = request.headers.get('user-agent') || '';
    const acceptLanguage = request.headers.get('accept-language') || '';
    const acceptEncoding = request.headers.get('accept-encoding') || '';
    const ipAddress = this.getClientIP(request);
    
    // Create hash of all fingerprint components
    const fingerprintData = `${userAgent}:${acceptLanguage}:${acceptEncoding}:${ipAddress}`;
    const hash = crypto
      .createHash('sha256')
      .update(fingerprintData)
      .digest('hex');
    
    return {
      userAgent,
      acceptLanguage,
      acceptEncoding,
      ipAddress,
      hash
    };
  }

  /**
   * Create new session with device fingerprinting
   */
  async createSession(
    userId: string, 
    request: NextRequest, 
    isPrivileged: boolean = false
  ): Promise<string> {
    // Check concurrent session limits
    await this.enforceConcurrentSessionLimits(userId);
    
    const sessionId = this.generateSecureSessionId();
    const deviceFingerprint = this.createDeviceFingerprint(request);
    const now = new Date();
    
    const duration = isPrivileged 
      ? this.limits.privilegedSessionDuration 
      : this.limits.regularSessionDuration;
    
    const session: SessionRecord = {
      sessionId,
      userId,
      expiresAt: new Date(now.getTime() + duration),
      createdAt: now,
      lastAccessedAt: now,
      deviceFingerprint,
      isPrivileged,
      rotationCount: 0,
      riskScore: 0
    };
    
    this.sessions.set(sessionId, session);
    this.addUserSession(userId, sessionId);
    
    console.log(`🔐 Created ${isPrivileged ? 'privileged' : 'regular'} session for user ${userId}`);
    return sessionId;
  }

  /**
   * Validate session with security checks
   */
  async validateSession(
    sessionId: string, 
    request: NextRequest
  ): Promise<{ valid: boolean; session?: SessionRecord; riskLevel?: string }> {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return { valid: false };
    }
    
    // Check expiration
    if (new Date() > session.expiresAt) {
      await this.destroySession(sessionId);
      return { valid: false };
    }
    
    // Device fingerprint validation
    const currentFingerprint = this.createDeviceFingerprint(request);
    const riskAssessment = this.assessDeviceRisk(session.deviceFingerprint, currentFingerprint);
    
    // Update session activity
    session.lastAccessedAt = new Date();
    session.riskScore = riskAssessment.riskScore;
    
    // Check if session should be flagged as suspicious
    if (riskAssessment.riskScore > this.limits.suspiciousActivityThreshold) {
      console.warn(`⚠️ Suspicious session activity detected for session ${sessionId} (risk: ${riskAssessment.riskScore})`);
      
      // Force session rotation for high-risk sessions
      if (riskAssessment.riskScore > 75) {
        const newSessionId = await this.rotateSession(sessionId, request);
        const newSession = this.sessions.get(newSessionId);
        return { 
          valid: true, 
          session: newSession, 
          riskLevel: 'high' 
        };
      }
      
      return { 
        valid: true, 
        session, 
        riskLevel: 'medium' 
      };
    }
    
    return { 
      valid: true, 
      session, 
      riskLevel: 'low' 
    };
  }

  /**
   * Rotate session for security (e.g., after privilege escalation)
   */
  async rotateSession(oldSessionId: string, request: NextRequest): Promise<string> {
    const oldSession = this.sessions.get(oldSessionId);
    
    if (!oldSession) {
      throw new Error('Session not found for rotation');
    }
    
    // Check rotation limits
    if (oldSession.rotationCount >= this.limits.maxRotations) {
      await this.destroySession(oldSessionId);
      throw new Error('Maximum session rotations exceeded. Please re-authenticate.');
    }
    
    // Create new session
    const newSessionId = this.generateSecureSessionId();
    const deviceFingerprint = this.createDeviceFingerprint(request);
    
    const newSession: SessionRecord = {
      ...oldSession,
      sessionId: newSessionId,
      deviceFingerprint,
      lastAccessedAt: new Date(),
      rotationCount: oldSession.rotationCount + 1,
      riskScore: Math.max(0, oldSession.riskScore - 10) // Reduce risk score on rotation
    };
    
    // Replace old session with new one
    this.sessions.set(newSessionId, newSession);
    this.sessions.delete(oldSessionId);
    
    // Update user session mapping
    const userSessions = this.userSessions.get(oldSession.userId);
    if (userSessions) {
      userSessions.delete(oldSessionId);
      userSessions.add(newSessionId);
    }
    
    console.log(`🔄 Rotated session ${oldSessionId} -> ${newSessionId} (rotation #${newSession.rotationCount})`);
    return newSessionId;
  }

  /**
   * Escalate session to privileged mode
   */
  async escalatePrivileges(sessionId: string, request: NextRequest): Promise<string> {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    // Force rotation when escalating privileges
    const newSessionId = await this.rotateSession(sessionId, request);
    const privilegedSession = this.sessions.get(newSessionId);
    
    if (privilegedSession) {
      privilegedSession.isPrivileged = true;
      privilegedSession.expiresAt = new Date(Date.now() + this.limits.privilegedSessionDuration);
      console.log(`⬆️ Escalated session ${newSessionId} to privileged mode`);
    }
    
    return newSessionId;
  }

  /**
   * Assess device risk based on fingerprint changes
   */
  private assessDeviceRisk(
    originalFingerprint: DeviceFingerprint, 
    currentFingerprint: DeviceFingerprint
  ): { riskScore: number; reasons: string[] } {
    let riskScore = 0;
    const reasons: string[] = [];
    
    // IP address change
    if (originalFingerprint.ipAddress !== currentFingerprint.ipAddress) {
      riskScore += 30;
      reasons.push('IP address changed');
    }
    
    // User agent change
    if (originalFingerprint.userAgent !== currentFingerprint.userAgent) {
      riskScore += 25;
      reasons.push('User agent changed');
    }
    
    // Accept language change
    if (originalFingerprint.acceptLanguage !== currentFingerprint.acceptLanguage) {
      riskScore += 15;
      reasons.push('Accept language changed');
    }
    
    // Accept encoding change
    if (originalFingerprint.acceptEncoding !== currentFingerprint.acceptEncoding) {
      riskScore += 10;
      reasons.push('Accept encoding changed');
    }
    
    return { riskScore, reasons };
  }

  /**
   * Enforce concurrent session limits
   */
  private async enforceConcurrentSessionLimits(userId: string): Promise<void> {
    const userSessions = this.userSessions.get(userId) || new Set();
    
    if (userSessions.size >= this.limits.maxConcurrentSessions) {
      // Remove oldest session
      const sessionIds = Array.from(userSessions);
      const oldestSessionId = sessionIds
        .map(id => ({ id, session: this.sessions.get(id) }))
        .filter(item => item.session)
        .sort((a, b) => a.session!.lastAccessedAt.getTime() - b.session!.lastAccessedAt.getTime())[0]?.id;
      
      if (oldestSessionId) {
        await this.destroySession(oldestSessionId);
        console.log(`🚫 Removed oldest session ${oldestSessionId} due to concurrent session limit`);
      }
    }
  }

  /**
   * Destroy session and clean up
   */
  async destroySession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    
    if (session) {
      this.removeUserSession(session.userId, sessionId);
      this.sessions.delete(sessionId);
      console.log(`🗑️ Destroyed session ${sessionId}`);
    }
  }

  /**
   * Destroy all sessions for a user
   */
  async destroyAllUserSessions(userId: string): Promise<void> {
    const userSessions = this.userSessions.get(userId);
    
    if (userSessions) {
      const sessionIds = Array.from(userSessions);
      for (const sessionId of sessionIds) {
        this.sessions.delete(sessionId);
      }
      this.userSessions.delete(userId);
      console.log(`🗑️ Destroyed all sessions for user ${userId}`);
    }
  }

  /**
   * Get session statistics for monitoring
   */
  getSessionStats(): {
    totalSessions: number;
    privilegedSessions: number;
    regularSessions: number;
    highRiskSessions: number;
    averageRotations: number;
  } {
    const sessions = Array.from(this.sessions.values());
    
    return {
      totalSessions: sessions.length,
      privilegedSessions: sessions.filter(s => s.isPrivileged).length,
      regularSessions: sessions.filter(s => !s.isPrivileged).length,
      highRiskSessions: sessions.filter(s => s.riskScore > this.limits.suspiciousActivityThreshold).length,
      averageRotations: sessions.reduce((sum, s) => sum + s.rotationCount, 0) / sessions.length || 0
    };
  }

  /**
   * Helper methods
   */
  private generateSecureSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 
               request.headers.get('x-real-ip') || 
               request.ip || 
               'unknown';
    return ip;
  }

  private addUserSession(userId: string, sessionId: string): void {
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId)!.add(sessionId);
  }

  private removeUserSession(userId: string, sessionId: string): void {
    const userSessions = this.userSessions.get(userId);
    if (userSessions) {
      userSessions.delete(sessionId);
      if (userSessions.size === 0) {
        this.userSessions.delete(userId);
      }
    }
  }

  private cleanupExpiredSessions(): void {
    const now = new Date();
    const expiredSessions: string[] = [];
    
    this.sessions.forEach((session, sessionId) => {
      if (now > session.expiresAt) {
        expiredSessions.push(sessionId);
      }
    });
    
    expiredSessions.forEach(sessionId => {
      this.destroySession(sessionId);
    });
    
    if (expiredSessions.length > 0) {
      console.log(`🧹 Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }
}

// Export singleton instance
export const enhancedSessionManager = new EnhancedSessionManager();

// Export types
export type { SessionRecord, DeviceFingerprint, SessionLimits };