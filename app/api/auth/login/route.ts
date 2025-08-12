import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { userRepository } from '@/lib/db/axiodb-user-repository';
import { LoginCredentials, User } from '@/lib/types/user';
import { authRateLimiter, createRateLimitResponse } from '@/lib/auth/rate-limiter';
import { enhancedSessionManager } from '@/lib/auth/enhanced-session';

export async function POST(request: NextRequest) {
  // Check rate limit first
  if (authRateLimiter.isRateLimited(request)) {
    const info = authRateLimiter.getRateLimitInfo(request);
    return createRateLimitResponse(info.resetTime, info.remaining);
  }

  try {
    const body = await request.json();
    const { email, password }: LoginCredentials = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await userRepository.findByEmail(email);
    
    if (!user) {
      // Record failed attempt
      authRateLimiter.recordAttempt(request, false);
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    
    if (!isMatch) {
      // Record failed attempt
      authRateLimiter.recordAttempt(request, false);
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create enhanced session with device fingerprinting
    const sessionId = await enhancedSessionManager.createSession(user.id, request, false);

    // Record successful attempt (this will reset the counter)
    authRateLimiter.recordAttempt(request, true);

    // Remove password hash from response
    const { passwordHash, ...userResponse } = user;

    const response = NextResponse.json({
      success: true,
      user: userResponse,
      message: 'Logged in successfully'
    });

    // Set session cookie with enhanced security
    response.cookies.set('session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      path: '/',
      ...(process.env.NODE_ENV === 'production' && { domain: process.env.COOKIE_DOMAIN })
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}