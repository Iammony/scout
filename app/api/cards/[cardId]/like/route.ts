import { NextRequest, NextResponse } from 'next/server';
import { userRepository } from '@/lib/db/axiodb-user-repository';
import { getUserFromSession } from '@/lib/auth/session';

interface RouteParams {
  params: {
    cardId: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { cardId } = params;

    // Get current user from session
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const result = await userRepository.toggleCardLike(cardId, user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Toggle card like error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle card like' },
      { status: 500 }
    );
  }
}