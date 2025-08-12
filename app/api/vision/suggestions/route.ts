import { NextRequest, NextResponse } from 'next/server';
import { visionLocationService } from '@/lib/api/vision';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, imageBase64 } = body;

    if (!query || query.length < 2) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Query must be at least 2 characters long' 
        },
        { status: 400 }
      );
    }

    console.log('Getting location suggestions for:', query);

    const suggestions = await visionLocationService.getLocationSuggestions(query, imageBase64);

    return NextResponse.json({
      success: true,
      suggestions,
      query,
      count: suggestions.length
    });

  } catch (error) {
    console.error('Location suggestions API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get location suggestions',
        suggestions: []
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query || query.length < 2) {
    return NextResponse.json({
      success: false,
      error: 'Query parameter is required and must be at least 2 characters',
      suggestions: []
    }, { status: 400 });
  }

  try {
    console.log('Getting location suggestions for:', query);

    const suggestions = await visionLocationService.getLocationSuggestions(query);

    return NextResponse.json({
      success: true,
      suggestions,
      query,
      count: suggestions.length
    });

  } catch (error) {
    console.error('Location suggestions API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get location suggestions',
        suggestions: []
      },
      { status: 500 }
    );
  }
}