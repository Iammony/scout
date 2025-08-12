import { NextRequest, NextResponse } from 'next/server';
import { 
  getApiStatus, 
  generateApiDocumentation,
  getApiUsageRecommendations,
  testApiEndpoint,
  generateCurlCommand 
} from '@/lib/utils/rapidapi-helper';
import { RAPIDAPI_ENDPOINTS } from '@/lib/config/rapidapi-endpoints';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const apiName = searchParams.get('api');
    const endpoint = searchParams.get('endpoint');

    switch (action) {
      case 'status':
        return NextResponse.json({
          success: true,
          data: getApiStatus()
        });

      case 'documentation':
        const documentation = generateApiDocumentation();
        return new NextResponse(documentation, {
          headers: {
            'Content-Type': 'text/markdown',
            'Content-Disposition': 'attachment; filename=rapidapi-docs.md'
          }
        });

      case 'recommendations':
        return NextResponse.json({
          success: true,
          data: getApiUsageRecommendations()
        });

      case 'list-apis':
        const category = searchParams.get('category');
        let apis = RAPIDAPI_ENDPOINTS;
        
        if (category) {
          apis = Object.fromEntries(
            Object.entries(RAPIDAPI_ENDPOINTS)
              .filter(([_, api]) => api.category === category)
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            apis: Object.entries(apis).map(([apiName, config]) => ({
              apiName,
              ...config,
              endpoints: Object.keys(config.endpoints)
            }))
          }
        });

      case 'curl':
        if (!apiName || !endpoint) {
          return NextResponse.json(
            { success: false, error: 'API name and endpoint are required for curl generation' },
            { status: 400 }
          );
        }

        try {
          // Parse additional parameters
          const params: Record<string, string> = {};
          searchParams.forEach((value, key) => {
            if (!['action', 'api', 'endpoint'].includes(key)) {
              params[key] = value;
            }
          });

          const curlCommand = generateCurlCommand(apiName, endpoint, Object.keys(params).length > 0 ? params : undefined);
          
          return NextResponse.json({
            success: true,
            data: {
              apiName,
              endpoint,
              params,
              curlCommand
            }
          });
        } catch (error) {
          return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to generate curl command' },
            { status: 400 }
          );
        }

      default:
        return NextResponse.json({
          success: true,
          data: {
            message: 'RapidAPI Management Endpoint',
            availableActions: [
              'status - Get API configuration status',
              'documentation - Download API documentation',
              'recommendations - Get usage recommendations',
              'list-apis - List all configured APIs (optional: ?category=images)',
              'curl - Generate curl command (?api=unsplash&endpoint=getImages&query=travel)'
            ],
            examples: [
              '/api/rapidapi/manage?action=status',
              '/api/rapidapi/manage?action=list-apis&category=images',
              '/api/rapidapi/manage?action=curl&api=unsplash&endpoint=getImages&query=travel&page=1'
            ]
          }
        });
    }

  } catch (error) {
    console.error('RapidAPI management error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'test') {
      const body = await request.json();
      const { apiName, endpoint, params, requestBody } = body;

      if (!apiName || !endpoint) {
        return NextResponse.json(
          { success: false, error: 'API name and endpoint are required' },
          { status: 400 }
        );
      }

      try {
        const result = await testApiEndpoint(apiName, endpoint, params, requestBody);
        return NextResponse.json({
          success: true,
          data: result
        });
      } catch (error) {
        return NextResponse.json(
          { success: false, error: error instanceof Error ? error.message : 'Test failed' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action for POST request' },
      { status: 400 }
    );

  } catch (error) {
    console.error('RapidAPI test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}