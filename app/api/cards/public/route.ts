import { NextRequest, NextResponse } from 'next/server';
import { userRepository } from '@/lib/db/axiodb-user-repository';
import { getUserFromSession } from '@/lib/auth/session';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Make a card public
export async function POST(request: NextRequest) {
  try {
    const { cardId, title, description, tags } = await request.json();

    if (!cardId || !title) {
      return NextResponse.json(
        { error: 'Card ID and title are required' },
        { status: 400 }
      );
    }

    // Get current user from session
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // All users now have usernames, so this check is no longer needed

    // Make the card public
    await userRepository.makeCardPublic(cardId, user.id, {
      title,
      description: description || '',
      createdBy: user.username,
      tags: tags || [],
      featured: false
    });

    return NextResponse.json({
      success: true,
      message: 'Card has been made public'
    });
  } catch (error) {
    console.error('Make card public error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to make card public' },
      { status: 500 }
    );
  }
}

// Get public cards with pagination and sorting
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sortBy = (searchParams.get('sortBy') || 'recent') as 'recent' | 'popular' | 'featured';

    const result = await userRepository.getPublicCards(page, limit, sortBy);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get public cards error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch public cards' },
      { status: 500 }
    );
  }
}