import { NextRequest, NextResponse } from 'next/server';
import { userRepository } from '@/lib/db/axiodb-user-repository';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session')?.value;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated', user: null },
        { status: 401 }
      );
    }

    // Find session
    const session = await userRepository.findSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found', user: null },
        { status: 401 }
      );
    }

    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      await userRepository.deleteSession(sessionId);
      return NextResponse.json(
        { success: false, error: 'Session expired', user: null },
        { status: 401 }
      );
    }

    // Find user
    const user = await userRepository.findById(session.userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found', user: null },
        { status: 401 }
      );
    }

    // Remove sensitive data
    const userResponse = { ...user };
    if ('passwordHash' in userResponse) {
      delete (userResponse as any).passwordHash;
    }

    return NextResponse.json({
      success: true,
      user: userResponse
    });

  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication check failed', user: null },
      { status: 500 }
    );
  }
}