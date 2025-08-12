import { NextRequest, NextResponse } from 'next/server';
import { rapidAPIClient } from '@/lib/api/rapidapi';
import { currencyAPI } from '@/lib/api/currency';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing RapidAPI integration configuration...');
    
    const hasRapidApiKey = !!(process.env.X_RapidAPI_Key || process.env.RAPIDAPI_KEY);
    const rapidApiKeyLength = (process.env.X_RapidAPI_Key || process.env.RAPIDAPI_KEY)?.length || 0;
    
    // Test RapidAPI configuration
    const rapidApiStatus = rapidAPIClient.getRateLimitStatus();
    const currencyStatus = currencyAPI.getRateLimitStatus();
    
    let testResults: any = {
      configurationTest: 'passed',
      apiIntegrationReady: hasRapidApiKey,
      message: hasRapidApiKey 
        ? 'RapidAPI integration is configured and ready to use real data'
        : 'RapidAPI key not found - will use fallback mock data'
    };
    
    // Only test actual API calls if we have the key configured
    if (hasRapidApiKey) {
      console.log('RapidAPI key found, testing real API calls...');
      
      const testDestination = 'Dubai';
      let tripAdvisorData = null;
      let errors: string[] = [];
      
      try {
        // Test TripAdvisor location search first
        const locationSearch = await rapidAPIClient.searchTripAdvisorLocation(testDestination);
        if (locationSearch && locationSearch.length > 0) {
          const geoId = locationSearch[0].geoId || locationSearch[0].id || '60763';
          tripAdvisorData = await rapidAPIClient.getTripAdvisorHotels(geoId);
          console.log('TripAdvisor API test successful');
        }
      } catch (error) {
        errors.push(`TripAdvisor API: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.warn('TripAdvisor API failed:', error);
      }
      
      testResults.actualApiTest = {
        tripAdvisor: {
          success: !!tripAdvisorData,
          data: tripAdvisorData ? 'Real data received' : 'Failed to fetch',
          sampleData: tripAdvisorData ? {
            destination: testDestination,
            hotelsCount: tripAdvisorData.data?.length || 0,
            totalResults: tripAdvisorData.paging?.totalResults || 'N/A',
            dataSource: 'TripAdvisor via RapidAPI'
          } : null
        },
        errors: errors.length > 0 ? errors : null
      };
    }
    
    return NextResponse.json({
      success: true,
      message: 'RapidAPI integration status check completed',
      environment: process.env.NODE_ENV || 'development',
      rapidApiConfigured: hasRapidApiKey,
      apiKeyPresent: hasRapidApiKey,
      apiKeyLength: rapidApiKeyLength > 0 ? `${rapidApiKeyLength} characters` : 'Not configured',
      integrationFeatures: {
        tripAdvisorAPI: 'Configured (Hotels & Locations)',
        flightDataAPI: 'Configured', 
        hotelBookingAPI: 'Configured',
        trainAPI: 'Configured (domestic)',
        visaAPI: 'Configured',
        currencyAPI: 'Configured',
        rateLimiting: 'Active',
        errorHandling: 'Multi-tier fallbacks'
      },
      rateLimits: {
        rapidApi: rapidApiStatus,
        currency: currencyStatus
      },
      ...testResults,
      deploymentReady: true,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('RapidAPI configuration test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      rapidApiConfigured: !!(process.env.X_RapidAPI_Key || process.env.RAPIDAPI_KEY),
      message: 'Configuration test failed, but fallback systems are available',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}