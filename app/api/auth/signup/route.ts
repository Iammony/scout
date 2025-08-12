import { NextRequest, NextResponse } from 'next/server';
import { userRepository } from '@/lib/db/axiodb-user-repository';
import { SignupCredentials } from '@/lib/types/user';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { email, password, name, username }: SignupCredentials = body;

    // Sanitize inputs
    email = email?.trim().toLowerCase();
    name = name?.trim();
    username = username?.trim().toLowerCase();

    // Validation
    if (!email || !password || !name || !username) {
      return NextResponse.json(
        { success: false, error: 'Email, password, name, and username are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Enhanced password validation
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return NextResponse.json(
        { success: false, error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' },
        { status: 400 }
      );
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Username validation - alphanumeric only
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { success: false, error: 'Username must be between 3 and 20 characters' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      return NextResponse.json(
        { success: false, error: 'Username can only contain letters and numbers (alphanumeric)' },
        { status: 400 }
      );
    }

    // Check username availability using the repository
    const existingUser = await userRepository.findByUsername(username);
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Username is not available' },
        { status: 409 }
      );
    }

    // Create user with username
    const user = await userRepository.createLocalUser({ email, password, name, username });
    
    // Create session with 24-hour expiry for security
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const sessionId = await userRepository.createSession(user.id, expiresAt);

    // Remove password hash from response
    const { passwordHash, ...userResponse } = user;

    const response = NextResponse.json({
      success: true,
      user: userResponse,
      message: 'Account created successfully'
    });

    // Set session cookie
    response.cookies.set('session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt
    });

    return response;

  } catch (error) {
    console.error('Signup error:', error);
    
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create account' },
      { status: 500 }
    );
  }
}