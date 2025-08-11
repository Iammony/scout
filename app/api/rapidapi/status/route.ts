import { NextRequest, NextResponse } from 'next/server';
import { rapidAPIClient } from '@/lib/api/rapidapi';
import { currencyAPI } from '@/lib/api/currency';
import { rateLimiter } from '@/lib/api/rate-limiter';

export async function GET(request: NextRequest) {
  try {
    // Get rate limit status for all APIs
    const rateLimitStatus = rapidAPIClient.getRateLimitStatus();
    
    // Get currency API status
    const currencyStatus = currencyAPI.getRateLimitStatus();
    
    // Calculate total remaining requests
    const totalRemaining = Object.values(rateLimitStatus).reduce(
      (sum, status) => sum + (status.remaining || 0), 
      0
    );
    
    // Get API configurations
    const apiConfigs = {
      rapidAPI: {
        configured: !!process.env.X_RapidAPI_Key || !!process.env.RAPIDAPI_KEY,
        keyFound: !!(process.env.X_RapidAPI_Key || process.env.RAPIDAPI_KEY)
      },
      currency: {
        configured: currencyAPI.isConfigured()
      }
    };
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      rateLimits: {
        hourlyLimit: 1000,
        totalRemaining,
        byAPI: rateLimitStatus,
        currency: currencyStatus
      },
      configuration: apiConfigs,
      apis: {
        rapidAPI: {
          description: 'Multiple travel APIs for flights, hotels, attractions',
          providers: [
            'Travel Guide API',
            'Flight Data28',
            'Booking.com15', 
            'IRCTC Train API',
            'AI Travel Itinerary Generator Pro2'
          ]
        },
        currency: {
          description: 'Currency converter for travel budget calculations',
          provider: 'Currency Converter Exchange Rates'
        }
      },
      tips: [
        'Rate limit is 1000 requests per hour per API',
        'Requests are tracked per API host',
        'Failed requests don\'t count toward rate limit',
        'Rate limit resets on a sliding window basis'
      ]
    });

  } catch (error) {
    console.error('Rate limit status error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get rate limit status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}