// RapidAPI Helper Utilities
// Tools for developers to test, validate, and manage RapidAPI endpoints

import { 
  RAPIDAPI_ENDPOINTS, 
  RapidApiEndpoint, 
  getRapidApiHeaders, 
  buildApiUrl,
  validateApiConfig,
  getActiveApis,
  getActiveApisByCategory 
} from '@/lib/config/rapidapi-endpoints';

interface ApiTestResult {
  success: boolean;
  status?: number;
  data?: any;
  error?: string;
  responseTime?: number;
  curlCommand?: string;
}

/**
 * Generate curl command for any API endpoint
 */
export function generateCurlCommand(
  apiName: string, 
  endpointName: string, 
  params?: Record<string, string>,
  body?: any
): string {
  const api = RAPIDAPI_ENDPOINTS[apiName];
  if (!api) {
    throw new Error(`API '${apiName}' not found`);
  }

  const endpoint = api.endpoints[endpointName];
  if (!endpoint) {
    throw new Error(`Endpoint '${endpointName}' not found in API '${apiName}'`);
  }

  const url = buildApiUrl(apiName, endpointName, params);
  const headers = getRapidApiHeaders(api.host);

  let curlCommand = `curl --request ${endpoint.method} \\\n`;
  curlCommand += `  --url '${url}' \\\n`;
  
  Object.entries(headers).forEach(([key, value]) => {
    curlCommand += `  --header '${key}: ${value}' \\\n`;
  });

  if (body && (endpoint.method === 'POST' || endpoint.method === 'PUT')) {
    curlCommand += `  --data '${JSON.stringify(body)}'`;
  } else {
    curlCommand = curlCommand.slice(0, -3); // Remove last backslash and newline
  }

  return curlCommand;
}

/**
 * Test an API endpoint
 */
export async function testApiEndpoint(
  apiName: string,
  endpointName: string,
  params?: Record<string, string>,
  body?: any
): Promise<ApiTestResult> {
  try {
    const startTime = Date.now();
    const api = RAPIDAPI_ENDPOINTS[apiName];
    
    if (!api) {
      throw new Error(`API '${apiName}' not found`);
    }

    if (!api.isActive) {
      throw new Error(`API '${apiName}' is not active`);
    }

    const endpoint = api.endpoints[endpointName];
    if (!endpoint) {
      throw new Error(`Endpoint '${endpointName}' not found`);
    }

    const url = buildApiUrl(apiName, endpointName, params);
    const headers = getRapidApiHeaders(api.host);
    const curlCommand = generateCurlCommand(apiName, endpointName, params, body);

    const options: RequestInit = {
      method: endpoint.method,
      headers
    };

    if (body && (endpoint.method === 'POST' || endpoint.method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const responseTime = Date.now() - startTime;
    const data = await response.json();

    return {
      success: response.ok,
      status: response.status,
      data: response.ok ? data : undefined,
      error: response.ok ? undefined : data.message || `HTTP ${response.status}`,
      responseTime,
      curlCommand
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      curlCommand: generateCurlCommand(apiName, endpointName, params, body)
    };
  }
}

/**
 * Test all active APIs (basic health check)
 */
export async function testAllActiveApis(): Promise<Record<string, ApiTestResult[]>> {
  const results: Record<string, ApiTestResult[]> = {};
  const activeApis = getActiveApis();

  for (const [apiName, api] of Object.entries(activeApis)) {
    results[apiName] = [];
    
    // Test the first endpoint of each API
    const firstEndpointName = Object.keys(api.endpoints)[0];
    if (firstEndpointName) {
      try {
        const result = await testApiEndpoint(apiName, firstEndpointName);
        results[apiName].push(result);
      } catch (error) {
        results[apiName].push({
          success: false,
          error: error instanceof Error ? error.message : 'Test failed'
        });
      }
    }
  }

  return results;
}

/**
 * Get API status and usage information
 */
export function getApiStatus(): {
  totalApis: number;
  activeApis: number;
  inactiveApis: number;
  byCategory: Record<string, { total: number; active: number }>;
  configValidation: ReturnType<typeof validateApiConfig>;
} {
  const totalApis = Object.keys(RAPIDAPI_ENDPOINTS).length;
  const activeApis = Object.values(RAPIDAPI_ENDPOINTS).filter(api => api.isActive).length;
  const inactiveApis = totalApis - activeApis;

  // Group by category
  const byCategory: Record<string, { total: number; active: number }> = {};
  
  Object.values(RAPIDAPI_ENDPOINTS).forEach(api => {
    if (!byCategory[api.category]) {
      byCategory[api.category] = { total: 0, active: 0 };
    }
    byCategory[api.category].total++;
    if (api.isActive) {
      byCategory[api.category].active++;
    }
  });

  return {
    totalApis,
    activeApis,
    inactiveApis,
    byCategory,
    configValidation: validateApiConfig()
  };
}

/**
 * Generate documentation for all APIs
 */
export function generateApiDocumentation(): string {
  let doc = '# RapidAPI Endpoints Documentation\n\n';
  doc += 'This document contains all configured RapidAPI endpoints for Scout Travel application.\n\n';

  // Add validation status
  const validation = validateApiConfig();
  doc += `## Configuration Status\n`;
  doc += `- Valid: ${validation.valid}\n`;
  if (validation.errors.length > 0) {
    doc += `- Errors: ${validation.errors.join(', ')}\n`;
  }
  if (validation.warnings.length > 0) {
    doc += `- Warnings: ${validation.warnings.join(', ')}\n`;
  }
  doc += '\n';

  // Group by category
  const categories = Array.from(new Set(Object.values(RAPIDAPI_ENDPOINTS).map(api => api.category)));
  
  categories.forEach(category => {
    const categoryApis = Object.entries(RAPIDAPI_ENDPOINTS)
      .filter(([_, api]) => api.category === category);

    doc += `## ${category.toUpperCase()} APIs\n\n`;

    categoryApis.forEach(([apiName, api]) => {
      doc += `### ${api.name} ${api.isActive ? '✅' : '❌'}\n\n`;
      doc += `**Purpose:** ${api.purpose}\n\n`;
      doc += `**Host:** \`${api.host}\`\n\n`;
      doc += `**Base URL:** \`${api.baseUrl}\`\n\n`;
      
      if (api.documentation) {
        doc += `**Documentation:** [${api.documentation}](${api.documentation})\n\n`;
      }

      if (api.alternativeApis && api.alternativeApis.length > 0) {
        doc += `**Alternatives:** ${api.alternativeApis.join(', ')}\n\n`;
      }

      if (api.notes) {
        doc += `**Notes:** ${api.notes}\n\n`;
      }

      doc += '**Endpoints:**\n\n';

      Object.entries(api.endpoints).forEach(([endpointName, endpoint]) => {
        doc += `#### ${endpointName}\n\n`;
        doc += `- **Method:** ${endpoint.method}\n`;
        doc += `- **Path:** \`${endpoint.path}\`\n`;
        doc += `- **Description:** ${endpoint.description}\n`;
        
        if (endpoint.params) {
          doc += `- **Parameters:** ${endpoint.params.join(', ')}\n`;
        }
        
        if (endpoint.rateLimit) {
          doc += `- **Rate Limit:** ${endpoint.rateLimit}\n`;
        }

        if (endpoint.pricing) {
          doc += `- **Pricing:** ${endpoint.pricing}\n`;
        }

        doc += '\n**cURL Example:**\n\n';
        doc += '```bash\n';
        doc += endpoint.curlExample;
        doc += '\n```\n\n';
      });

      doc += '---\n\n';
    });
  });

  return doc;
}

/**
 * Get API usage recommendations
 */
export function getApiUsageRecommendations(): {
  category: string;
  recommendations: string[];
}[] {
  const recommendations = [
    {
      category: 'images',
      recommendations: [
        'Use Unsplash API for high-quality destination images',
        'Implement image caching to reduce API calls',
        'Fallback to Pexels if Unsplash rate limit is reached',
        'Optimize image sizes for different use cases (thumb, regular, full)'
      ]
    },
    {
      category: 'travel',
      recommendations: [
        'Cache attraction data for popular destinations',
        'Use destination info API for comprehensive travel guides',
        'Combine multiple APIs for complete destination coverage',
        'Implement retry logic for failed requests'
      ]
    },
    {
      category: 'flights',
      recommendations: [
        'Cache flight search results for 5-10 minutes',
        'Use IATA codes for better search accuracy',
        'Implement price alerts for popular routes',
        'Consider multiple flight APIs for price comparison'
      ]
    },
    {
      category: 'hotels',
      recommendations: [
        'Cache hotel search results during peak booking times',
        'Use detailed hotel info for better recommendations',
        'Implement availability checks before showing options',
        'Consider user location for relevant hotel suggestions'
      ]
    },
    {
      category: 'weather',
      recommendations: [
        'Cache weather data for 1-2 hours',
        'Use 7-day forecasts for travel planning',
        'Show weather alerts for extreme conditions',
        'Include UV index and precipitation for outdoor activities'
      ]
    },
    {
      category: 'currency',
      recommendations: [
        'Cache exchange rates for 1 hour minimum',
        'Show both local and INR prices',
        'Use real-time rates for booking transactions',
        'Implement currency preference settings'
      ]
    }
  ];

  return recommendations;
}

/**
 * Export functions for console testing (development only)
 */
if (process.env.NODE_ENV === 'development') {
  (global as any).rapidApiHelper = {
    generateCurlCommand,
    testApiEndpoint,
    testAllActiveApis,
    getApiStatus,
    generateApiDocumentation,
    getApiUsageRecommendations,
    RAPIDAPI_ENDPOINTS
  };
}