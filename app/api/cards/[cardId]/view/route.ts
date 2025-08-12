import { NextRequest, NextResponse } from 'next/server';
import { userRepository } from '@/lib/db/axiodb-user-repository';

interface RouteParams {
  params: {
    cardId: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { cardId } = params;

    await userRepository.incrementCardViews(cardId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Increment card views error:', error);
    return NextResponse.json(
      { error: 'Failed to increment views' },
      { status: 500 }
    );
  }
}