import { NextRequest, NextResponse } from 'next/server';
import { unsplashClient } from '@/lib/api/unsplash';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const destination = searchParams.get('destination');
    const type = searchParams.get('type') || 'destination';
    const count = parseInt(searchParams.get('count') || '5');
    const page = parseInt(searchParams.get('page') || '1');

    if (!destination) {
      return NextResponse.json(
        { success: false, error: 'Destination parameter is required' },
        { status: 400 }
      );
    }

    let images;

    switch (type) {
      case 'destination':
        images = await unsplashClient.getDestinationImages(destination, page, count);
        break;
      case 'food':
        images = await unsplashClient.getFoodImages('local cuisine', destination, count);
        break;
      case 'accommodation':
        images = await unsplashClient.getAccommodationImages(destination, 'hotel', count);
        break;
      case 'activity':
        const activity = searchParams.get('activity') || 'sightseeing';
        images = await unsplashClient.getActivityImages(activity, destination, count);
        break;
      case 'complete':
        const travelCardImages = await unsplashClient.getTravelCardImages(destination);
        return NextResponse.json({
          success: true,
          data: travelCardImages,
          destination
        });
      default:
        images = await unsplashClient.getDestinationImages(destination, page, count);
    }

    return NextResponse.json({
      success: true,
      data: images,
      destination,
      type,
      count: images.length
    });

  } catch (error) {
    console.error('Error fetching destination images:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch images',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}