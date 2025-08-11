import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  attempts: number;
  resetTime: number;
}

class AuthRateLimiter {
  private attempts: Map<string, RateLimitEntry> = new Map();
  private readonly maxAttempts = 5;
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes

  private getClientKey(request: NextRequest): string {
    // Use IP address as key, fallback to user-agent if no IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 
               request.headers.get('x-real-ip') || 
               request.ip || 
               'unknown';
    return `auth_${ip}`;
  }

  isRateLimited(request: NextRequest): boolean {
    const key = this.getClientKey(request);
    const now = Date.now();
    const entry = this.attempts.get(key);

    if (!entry) {
      return false;
    }

    // Reset if window expired
    if (now > entry.resetTime) {
      this.attempts.delete(key);
      return false;
    }

    return entry.attempts >= this.maxAttempts;
  }

  recordAttempt(request: NextRequest, success: boolean): void {
    const key = this.getClientKey(request);
    const now = Date.now();
    let entry = this.attempts.get(key);

    if (!entry || now > entry.resetTime) {
      entry = {
        attempts: 0,
        resetTime: now + this.windowMs
      };
    }

    if (success) {
      // Reset on successful login
      this.attempts.delete(key);
    } else {
      // Increment failed attempts
      entry.attempts += 1;
      this.attempts.set(key, entry);
    }
  }

  getRateLimitInfo(request: NextRequest): { 
    isLimited: boolean; 
    attempts: number; 
    resetTime: number; 
    remaining: number; 
  } {
    const key = this.getClientKey(request);
    const now = Date.now();
    const entry = this.attempts.get(key);

    if (!entry || now > entry.resetTime) {
      return {
        isLimited: false,
        attempts: 0,
        resetTime: now + this.windowMs,
        remaining: this.maxAttempts
      };
    }

    const remaining = Math.max(0, this.maxAttempts - entry.attempts);
    return {
      isLimited: entry.attempts >= this.maxAttempts,
      attempts: entry.attempts,
      resetTime: entry.resetTime,
      remaining
    };
  }

  // Clean up expired entries periodically
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.attempts.forEach((entry, key) => {
      if (now > entry.resetTime) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      this.attempts.delete(key);
    });
  }
}

export const authRateLimiter = new AuthRateLimiter();

// Clean up every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    authRateLimiter.cleanup();
  }, 5 * 60 * 1000);
}

export function createRateLimitResponse(resetTime: number, remaining: number): NextResponse {
  const resetIn = Math.ceil((resetTime - Date.now()) / 1000);
  
  return NextResponse.json(
    {
      success: false,
      error: 'Too many login attempts. Please try again later.',
      retryAfter: resetIn
    },
    {
      status: 429,
      headers: {
        'Retry-After': resetIn.toString(),
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(resetTime).toISOString()
      }
    }
  );
}