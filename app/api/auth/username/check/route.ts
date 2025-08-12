import { NextRequest, NextResponse } from 'next/server';
import { userRepository } from '@/lib/db/axiodb-user-repository';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username is required' },
        { status: 400 }
      );
    }

    // Validate username format - alphanumeric only, 3-20 characters
    const usernameRegex = /^[a-zA-Z0-9]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json({
        success: false,
        available: false,
        error: 'Username must be 3-20 characters long and contain only letters and numbers'
      });
    }

    // Check if username already exists using the repository
    const existingUser = await userRepository.findByUsername(username);

    return NextResponse.json({
      success: true,
      available: !existingUser,
      username: username
    });

  } catch (error) {
    console.error('Username check error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check username availability' },
      { status: 500 }
    );
  }
}