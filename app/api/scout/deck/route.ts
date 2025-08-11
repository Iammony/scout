import { NextRequest, NextResponse } from 'next/server';
import { validateCompleteTravelInput } from '@/lib/validations/travel';
import { rapidAPIClient } from '@/lib/api/rapidapi';
import { travelDeckGenerator } from '@/lib/api/travel-deck-generator';
import { TravelCaptureInput } from '@/lib/types/travel';
import { verifyAltchaSolution } from '@/lib/captcha/altcha';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { altcha, ...travelData } = body;
    
    // Verify ALTCHA captcha for non-development environments
    if (process.env.NODE_ENV === 'production' && !altcha) {
      return NextResponse.json(
        {
          success: false,
          error: 'Captcha verification required',
        },
        { status: 400 }
      );
    }

    if (altcha && process.env.NODE_ENV === 'production') {
      const isCaptchaValid = await verifyAltchaSolution(altcha);
      if (!isCaptchaValid) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid captcha solution',
          },
          { status: 400 }
        );
      }
    }
    
    // Validate the travel input
    const validation = validateCompleteTravelInput(travelData);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid travel data',
          details: validation.error?.issues 
        },
        { status: 400 }
      );
    }

    const travelInput: TravelCaptureInput = validation.data;
    
    // Creating comprehensive travel deck (removed sensitive data from logs)

    // Fetch travel data from RapidAPI
    // Fetching travel data from RapidAPI
    const apiData = await rapidAPIClient.getTravelData(travelInput);
    
    // Generate comprehensive travel deck
    // Generating travel deck with AI
    const deck = await travelDeckGenerator.generateCompleteDeck(travelInput, apiData);
    
    // Return the deck
    return NextResponse.json({
      success: true,
      deck,
      message: `Travel deck created with ${deck.cards.length} cards`,
      metadata: {
        deckId: deck.id,
        destination: deck.destination,
        cardCount: deck.cards.length,
        generatedAt: deck.createdAt
      }
    });

  } catch (error) {
    console.error('Travel deck creation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create travel deck',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    endpoint: '/api/scout/deck',
    description: 'Generate comprehensive travel deck with multiple card types',
    cardTypes: [
      'overview',
      'itinerary', 
      'transport',
      'accommodation',
      'attractions',
      'dining',
      'budget',
      'visa',
      'weather',
      'culture',
      'emergency',
      'shopping'
    ],
    models: {
      vision: 'Claude 3.5 Sonnet (for image analysis)',
      content: 'Claude 3.5 Sonnet (for travel content generation)'
    }
  });
}