import { NextRequest, NextResponse } from 'next/server';
import { unsplashClient } from '@/lib/api/unsplash';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const theme = searchParams.get('theme') || 'nature landscape travel';
    const count = parseInt(searchParams.get('count') || '5');
    const page = parseInt(searchParams.get('page') || '1');

    const images = await unsplashClient.getBackgroundImages(theme, page, count);

    return NextResponse.json({
      success: true,
      data: images,
      theme,
      count: images.length
    });

  } catch (error) {
    console.error('Error fetching background images:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch background images',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}