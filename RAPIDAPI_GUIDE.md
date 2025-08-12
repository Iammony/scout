# RapidAPI Configuration & Management Guide

This guide explains how to manage and configure RapidAPI endpoints in Scout Travel application.

## 📁 Configuration Structure

### Main Configuration File
- **Location**: `/lib/config/rapidapi-endpoints.ts`
- **Purpose**: Centralized configuration for all RapidAPI services
- **Environment**: Uses `X_RapidAPI_Key` from Vercel environment variables

### Helper Utilities
- **Location**: `/lib/utils/rapidapi-helper.ts`
- **Purpose**: Testing, validation, and management tools

### Management API
- **Endpoint**: `/api/rapidapi/manage`
- **Purpose**: Runtime API management and testing

## 🔧 Adding New APIs

### Step 1: Add API Configuration

Edit `/lib/config/rapidapi-endpoints.ts` and add your new API:

```typescript
newApiName: {
  name: 'Your API Display Name',
  host: 'your-api.p.rapidapi.com',
  baseUrl: 'https://your-api.p.rapidapi.com',
  purpose: 'Detailed description of what this API does and why we use it',
  category: 'images' | 'travel' | 'flights' | 'hotels' | 'weather' | 'currency' | 'location' | 'translation',
  endpoints: {
    endpointName: {
      method: 'GET',
      path: '/your/endpoint/path',
      description: 'What this endpoint does',
      curlExample: `curl --request GET \\
  --url 'https://your-api.p.rapidapi.com/your/endpoint?param=value' \\
  --header 'x-rapidapi-host: your-api.p.rapidapi.com' \\
  --header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY'`,
      params: ['param1 (required)', 'param2 (optional)'],
      rateLimit: '1000 requests/month (free tier)',
      pricing: 'Free tier available'
    }
  },
  isActive: true,
  alternativeApis: ['backup-api-1', 'backup-api-2'],
  documentation: 'https://rapidapi.com/your-api/api/your-api',
  notes: 'Any special notes about this API'
}
```

### Step 2: Test Your Configuration

Use the management API to test your new endpoint:

```bash
# Test if configuration is valid
curl http://localhost:3000/api/rapidapi/manage?action=status

# Generate curl command for your endpoint
curl "http://localhost:3000/api/rapidapi/manage?action=curl&api=newApiName&endpoint=endpointName&param1=value"

# Test the actual API endpoint
curl -X POST http://localhost:3000/api/rapidapi/manage?action=test \
  -H "Content-Type: application/json" \
  -d '{
    "apiName": "newApiName",
    "endpoint": "endpointName",
    "params": {"param1": "value"}
  }'
```

## 🎯 Using APIs in Code

### Method 1: Using Configuration Helpers

```typescript
import { getApiConfig, getRapidApiHeaders, buildApiUrl } from '@/lib/config/rapidapi-endpoints';

// Get API configuration
const apiConfig = getApiConfig('unsplash');
if (!apiConfig || !apiConfig.isActive) {
  throw new Error('API not available');
}

// Build URL with parameters
const url = buildApiUrl('unsplash', 'getImages', { query: 'travel', page: '1' });

// Get headers
const headers = getRapidApiHeaders(apiConfig.host);

// Make request
const response = await fetch(url, { headers });
```

### Method 2: Using Helper Functions

```typescript
import { generateCurlCommand, testApiEndpoint } from '@/lib/utils/rapidapi-helper';

// Generate curl command for debugging
const curlCommand = generateCurlCommand('unsplash', 'getImages', { query: 'travel' });
console.log(curlCommand);

// Test endpoint programmatically
const result = await testApiEndpoint('unsplash', 'getImages', { query: 'travel' });
if (result.success) {
  console.log('API call successful:', result.data);
} else {
  console.error('API call failed:', result.error);
}
```

## 📊 Management & Monitoring

### Check API Status

```bash
# Get overall status
curl http://localhost:3000/api/rapidapi/manage?action=status

# List all APIs
curl http://localhost:3000/api/rapidapi/manage?action=list-apis

# List APIs by category
curl http://localhost:3000/api/rapidapi/manage?action=list-apis&category=images
```

### Generate Documentation

```bash
# Download complete API documentation
curl http://localhost:3000/api/rapidapi/manage?action=documentation > rapidapi-docs.md

# Get usage recommendations
curl http://localhost:3000/api/rapidapi/manage?action=recommendations
```

### Testing APIs

```bash
# Test specific endpoint
curl -X POST http://localhost:3000/api/rapidapi/manage?action=test \
  -H "Content-Type: application/json" \
  -d '{
    "apiName": "unsplash",
    "endpoint": "getImages",
    "params": {"query": "travel", "page": "1"}
  }'
```

## 🔑 Environment Setup

### Required Environment Variables

Add to your `.env.local` or Vercel environment:

```bash
# RapidAPI Key (same for all APIs)
X_RapidAPI_Key=your_rapidapi_key_here
```

### Getting RapidAPI Key

1. Sign up at [RapidAPI](https://rapidapi.com/)
2. Subscribe to the APIs you want to use
3. Copy your API key from the dashboard
4. Add it to your environment variables

## 📋 Current API Categories

### Images (`category: 'images'`)
- **Unsplash API** - High-quality destination and travel images
- **Pexels API** - Alternative image source (backup)

### Travel (`category: 'travel'`)  
- **Travel Guide API** - Attractions and destination information

### Flights (`category: 'flights'`)
- **Flight Data API** - Flight search and pricing

### Hotels (`category: 'hotels'`)
- **Hotel Search API** - Hotel availability and booking

### Weather (`category: 'weather'`)
- **Weather Forecast API** - Weather conditions and forecasts

### Currency (`category: 'currency'`)
- **Currency Exchange API** - Real-time exchange rates

### Translation (`category: 'translation'`)
- **Translation API** - Multi-language support (future feature)

## 🚀 Best Practices

### 1. Rate Limiting
- Always check rate limits in the configuration
- Implement caching to reduce API calls
- Use fallback APIs when rate limits are reached

### 2. Error Handling
```typescript
try {
  const result = await testApiEndpoint(apiName, endpoint, params);
  if (!result.success) {
    // Try alternative API
    const alternatives = getAlternativeApis(apiName);
    // Implement fallback logic
  }
} catch (error) {
  // Handle network errors
}
```

### 3. Caching Strategy
- Cache image URLs for 24 hours
- Cache travel data for 1 hour
- Cache currency rates for 30 minutes
- Cache weather data for 2 hours

### 4. Configuration Management
- Keep `isActive: false` for backup APIs
- Document the purpose of each API clearly
- Update rate limits and pricing information regularly
- Test APIs regularly using the management endpoint

## 🛠️ Development Console

In development mode, you can access RapidAPI helper functions in the browser console:

```javascript
// Available in development only
rapidApiHelper.getApiStatus()
rapidApiHelper.generateCurlCommand('unsplash', 'getImages', {query: 'travel'})
rapidApiHelper.testApiEndpoint('unsplash', 'getImages', {query: 'travel'})
```

## 🔍 Troubleshooting

### Common Issues

1. **API Key Not Working**
   ```bash
   # Check if key is set
   curl http://localhost:3000/api/rapidapi/manage?action=status
   ```

2. **Rate Limit Exceeded**
   - Check current usage in RapidAPI dashboard
   - Implement caching
   - Switch to alternative API

3. **API Not Responding**
   ```bash
   # Test specific endpoint
   curl -X POST http://localhost:3000/api/rapidapi/manage?action=test \
     -H "Content-Type: application/json" \
     -d '{"apiName": "unsplash", "endpoint": "getImages", "params": {"query": "test"}}'
   ```

### Debugging Steps

1. Verify environment variables are set
2. Check API configuration with `/api/rapidapi/manage?action=status`
3. Test individual endpoints
4. Check RapidAPI dashboard for usage and errors
5. Review API documentation for changes

## 📈 Monitoring & Analytics

### Key Metrics to Track
- API response times
- Success/failure rates
- Rate limit usage
- Cost per API call
- Cache hit rates

### Using Management API
```bash
# Regular health check
curl http://localhost:3000/api/rapidapi/manage?action=status | jq '.data.configValidation'

# Generate usage report
curl http://localhost:3000/api/rapidapi/manage?action=recommendations
```

This configuration system makes it easy to:
- ✅ Add new APIs quickly
- ✅ Test APIs before deployment  
- ✅ Switch between alternatives
- ✅ Monitor API health
- ✅ Generate documentation
- ✅ Debug issues efficiently