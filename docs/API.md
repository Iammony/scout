# Scout API Documentation

This document provides comprehensive documentation for Scout's API endpoints, including security features, authentication, and usage examples.

## 🔒 Security Overview

Scout implements enterprise-grade security with multiple layers of protection:

- **HMAC Request Signing** for sensitive operations
- **Enhanced Session Management** with device fingerprinting
- **Rate Limiting** with intelligent throttling
- **Input Validation** using Zod schemas
- **CAPTCHA Protection** via ALTCHA

## 🌐 Base URLs

- **Development**: `http://localhost:3000`
- **Production**: `https://your-scout-domain.com`

## 🔐 Authentication

Scout uses session-based authentication with enhanced security features.

### Session Cookie

All authenticated requests use the `session` cookie:

```http
Cookie: session=your-session-id-here
```

### Session Security Features

- **Device Fingerprinting**: Sessions tied to device characteristics
- **Session Rotation**: Automatic rotation on privilege escalation
- **Concurrent Limits**: Maximum 5 sessions per user
- **Risk Assessment**: Real-time suspicious activity detection

## 📝 Request/Response Format

### Standard Response Format

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}
```

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: string;
  details?: {
    code?: string;
    field?: string;
    issues?: ValidationIssue[];
  };
}
```

## 🚀 API Endpoints

### Travel Planning

#### Generate Travel Deck

Generate a comprehensive travel plan with AI-powered recommendations.

```http
POST /api/scout/deck
```

**Security**: HMAC signed in production

**Request Body**:
```typescript
interface TravelDeckRequest {
  // Core travel data
  travelType: 'single' | 'family' | 'group';
  destination: string;
  origin: string;
  duration: string;
  budget: 'Tight' | 'Comfortable' | 'Luxury';
  travelStyle: 'Adventure' | 'Leisure' | 'Business' | 'Pilgrimage' | 'Educational';
  
  // Traveler details
  travelerDetails: {
    age?: number;
    groupSize?: number;
    familyMembers?: {
      adults: number;
      children: number;
      childrenAges: number[];
    };
  };
  
  // Additional preferences
  season: 'Spring' | 'Summer' | 'Monsoon' | 'Winter' | 'Flexible';
  dietary?: string;
  specialRequirements?: string;
  
  // Security (production only)
  signature?: string;
  timestamp?: number;
  nonce?: string;
  
  // CAPTCHA verification
  altcha?: string;
}
```

**Response**:
```typescript
interface TravelDeckResponse {
  success: true;
  deck: {
    id: string;
    destination: string;
    cards: TravelCard[];
    budget: BudgetBreakdown;
    createdAt: string;
    images: DestinationImages;
  };
  metadata: {
    deckId: string;
    destination: string;
    cardCount: number;
    generatedAt: string;
  };
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/scout/deck \
  -H "Content-Type: application/json" \
  -d '{
    "travelType": "family",
    "destination": "Goa",
    "origin": "Mumbai",
    "duration": "5-7",
    "budget": "Comfortable",
    "travelStyle": "Leisure",
    "travelerDetails": {
      "familyMembers": {
        "adults": 2,
        "children": 1,
        "childrenAges": [8]
      }
    }
  }'
```

### Authentication

#### User Login

Authenticate user with enhanced session management.

```http
POST /api/auth/login
```

**Rate Limiting**: 5 attempts per 15 minutes per IP

**Request Body**:
```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

**Response**:
```typescript
interface LoginResponse {
  success: true;
  user: {
    id: string;
    email: string;
    name: string;
    username: string;
    createdAt: string;
  };
  message: string;
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123"
  }'
```

#### User Signup

Create new user account with username validation.

```http
POST /api/auth/signup
```

**Request Body**:
```typescript
interface SignupRequest {
  email: string;
  password: string;
  name: string;
  username: string;
}
```

**Validation Rules**:
- **Email**: Valid email format
- **Password**: 8+ characters, uppercase, lowercase, number
- **Username**: 3-20 alphanumeric characters only
- **Name**: 2+ characters

**Response**:
```typescript
interface SignupResponse {
  success: true;
  user: {
    id: string;
    email: string;
    name: string;
    username: string;
    createdAt: string;
  };
  message: string;
}
```

#### Check Username Availability

Real-time username availability checking.

```http
GET /api/auth/username/check?username={username}
```

**Response**:
```typescript
interface UsernameCheckResponse {
  success: true;
  available: boolean;
  username: string;
  suggestions?: string[];
}
```

**Example**:
```bash
curl "http://localhost:3000/api/auth/username/check?username=johndoe"
```

#### Get Current User

Get current authenticated user with risk assessment.

```http
GET /api/auth/me
```

**Response**:
```typescript
interface CurrentUserResponse {
  success: true;
  user: {
    id: string;
    email: string;
    name: string;
    username: string;
    createdAt: string;
  };
  session: {
    riskLevel: 'low' | 'medium' | 'high';
    deviceFingerprint: string;
    lastAccessed: string;
  };
}
```

#### Logout

Secure logout with session cleanup.

```http
POST /api/auth/logout
```

**Response**:
```typescript
interface LogoutResponse {
  success: true;
  message: string;
}
```

### Security & Monitoring

#### CAPTCHA Challenge

Get ALTCHA challenge for bot protection.

```http
GET /api/captcha/challenge
```

**Response**:
```typescript
interface CaptchaChallenge {
  success: true;
  challenge: {
    algorithm: string;
    challenge: string;
    salt: string;
    signature: string;
  };
  timestamp: string;
}
```

#### CAPTCHA Verification

Verify ALTCHA solution.

```http
POST /api/captcha/verify
```

**Request Body**:
```typescript
interface CaptchaVerifyRequest {
  altcha: string; // ALTCHA solution payload
}
```

**Response**:
```typescript
interface CaptchaVerifyResponse {
  success: true;
  verified: boolean;
  timestamp: string;
}
```

#### Security Status (Admin Only)

Get comprehensive security metrics and system health.

```http
GET /api/security/status
```

**Authorization**: Admin access required

**Response**:
```typescript
interface SecurityStatusResponse {
  success: true;
  data: {
    timestamp: string;
    sessions: {
      totalSessions: number;
      privilegedSessions: number;
      highRiskSessions: number;
      averageRotations: number;
      healthStatus: 'healthy' | 'warning' | 'critical';
    };
    database: {
      activeConnections: number;
      failedConnections: number;
      averageResponseTime: number;
      healthStatus: 'healthy' | 'warning' | 'critical';
    };
    security: {
      environment: string;
      httpsEnabled: boolean;
      captchaEnabled: boolean;
      hmacSigningEnabled: boolean;
      rateLimitingEnabled: boolean;
    };
    recommendations: string[];
  };
}
```

### RapidAPI Management

#### API Configuration Status

Get status of all configured RapidAPI endpoints.

```http
GET /api/rapidapi/manage?action=status
```

**Response**:
```typescript
interface RapidAPIStatusResponse {
  success: true;
  data: {
    totalApis: number;
    activeApis: number;
    inactiveApis: number;
    byCategory: Record<string, {
      total: number;
      active: number;
    }>;
    configValidation: {
      valid: boolean;
      errors: string[];
      warnings: string[];
    };
  };
}
```

#### List Available APIs

Get list of all configured APIs with filtering.

```http
GET /api/rapidapi/manage?action=list-apis&category={category}
```

**Query Parameters**:
- `category` (optional): Filter by category (images, travel, flights, hotels, weather, currency)

**Response**:
```typescript
interface APIListResponse {
  success: true;
  data: {
    apis: {
      apiName: string;
      name: string;
      category: string;
      isActive: boolean;
      endpoints: string[];
      purpose: string;
    }[];
  };
}
```

#### Generate cURL Command

Generate cURL command for testing API endpoints.

```http
GET /api/rapidapi/manage?action=curl&api={apiName}&endpoint={endpointName}&{params}
```

**Query Parameters**:
- `api`: API name (e.g., 'unsplash')
- `endpoint`: Endpoint name (e.g., 'getImages')
- Additional parameters as query params

**Response**:
```typescript
interface CurlGenerateResponse {
  success: true;
  data: {
    apiName: string;
    endpoint: string;
    params: Record<string, string>;
    curlCommand: string;
  };
}
```

#### Test API Endpoint

Test specific API endpoint with parameters.

```http
POST /api/rapidapi/manage?action=test
```

**Request Body**:
```typescript
interface APITestRequest {
  apiName: string;
  endpoint: string;
  params?: Record<string, string>;
  requestBody?: any;
}
```

**Response**:
```typescript
interface APITestResponse {
  success: true;
  data: {
    success: boolean;
    status?: number;
    data?: any;
    error?: string;
    responseTime?: number;
    curlCommand?: string;
  };
}
```

### Image Services

#### Get Destination Images

Get high-quality images for destinations via Unsplash.

```http
GET /api/images/destination?destination={destination}&count={count}
```

**Query Parameters**:
- `destination`: Destination name (required)
- `count`: Number of images (optional, default: 5)

**Response**:
```typescript
interface DestinationImagesResponse {
  success: true;
  images: {
    id: string;
    urls: {
      raw: string;
      full: string;
      regular: string;
      small: string;
      thumb: string;
    };
    alt_description: string;
    user: {
      name: string;
      username: string;
    };
  }[];
  destination: string;
  count: number;
}
```

#### Get Background Images

Get background images for UI elements.

```http
GET /api/images/backgrounds?theme={theme}&count={count}
```

**Query Parameters**:
- `theme`: Image theme (optional, default: 'nature landscape')
- `count`: Number of images (optional, default: 5)

**Response**: Same format as destination images

## 🚦 Rate Limiting

### Rate Limits by Endpoint Type

| Endpoint Type | Limit | Window | Scope |
|---------------|-------|--------|-------|
| Authentication | 5 requests | 15 minutes | per IP |
| Travel Deck Generation | 10 requests | 1 hour | per user |
| RapidAPI Calls | 1000 requests | 1 hour | global |
| Image Services | 100 requests | 1 hour | per IP |
| Public APIs | 100 requests | 1 minute | per IP |

### Rate Limit Headers

Rate-limited endpoints return these headers:

```http
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 2024-01-01T12:00:00Z
Retry-After: 900
```

### Rate Limit Exceeded Response

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "success": false,
  "error": "Too many requests. Please try again later.",
  "retryAfter": 900
}
```

## 🔐 HMAC Request Signing (Production)

For sensitive operations in production, requests must be signed with HMAC-SHA256.

### Signature Generation

1. Create signature data: `timestamp:nonce:payload`
2. Generate HMAC-SHA256 signature using secret key
3. Include signature components in request

### Request Format

```typescript
interface SignedRequest {
  payload: any; // Your actual request data
  timestamp: number; // Unix timestamp
  signature: string; // HMAC-SHA256 signature
  nonce: string; // Cryptographically secure random value
}
```

### Client-Side Signing (JavaScript)

```typescript
import { signTravelDeckRequest } from '@/lib/security/request-signing';

const travelData = {
  destination: 'Goa',
  budget: 'Comfortable',
  // ... other travel data
};

const signedRequest = signTravelDeckRequest(travelData);

// Send signedRequest to server
fetch('/api/scout/deck', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(signedRequest)
});
```

## ❌ Error Codes

### HTTP Status Codes

| Code | Description | Common Causes |
|------|-------------|---------------|
| 400 | Bad Request | Invalid input, validation failed |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Endpoint or resource not found |
| 409 | Conflict | Username already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error, check logs |

### Common Error Responses

#### Validation Error
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "issues": [
      {
        "code": "invalid_string",
        "message": "Username must be alphanumeric",
        "path": ["username"]
      }
    ]
  }
}
```

#### Authentication Error
```json
{
  "success": false,
  "error": "Authentication required"
}
```

#### Rate Limit Error
```json
{
  "success": false,
  "error": "Too many login attempts. Please try again later.",
  "retryAfter": 900
}
```

## 🔧 Development & Testing

### Environment Variables

Required for API functionality:

```bash
# API Keys
X_RapidAPI_Key=your_rapidapi_key
OPENROUTER_API_KEY=your_openrouter_key

# Security
ALTCHA_HMAC_KEY=your_captcha_hmac_key
HMAC_SECRET_KEY=your_request_signing_key

# Database
DB_POOL_LIMIT=10
DB_QUERY_TIMEOUT=30000

# Session Management
MAX_CONCURRENT_SESSIONS=5
```

### Testing with cURL

#### Test Travel Deck Generation (Development)
```bash
curl -X POST http://localhost:3000/api/scout/deck \
  -H "Content-Type: application/json" \
  -d '{
    "travelType": "single",
    "destination": "Kerala",
    "origin": "Mumbai",
    "duration": "7-10",
    "budget": "Comfortable",
    "travelStyle": "Leisure"
  }'
```

#### Test Authentication
```bash
# Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123",
    "name": "Test User",
    "username": "testuser"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123"
  }'
```

#### Test CAPTCHA
```bash
# Get challenge
curl http://localhost:3000/api/captcha/challenge

# Verify (with actual solution)
curl -X POST http://localhost:3000/api/captcha/verify \
  -H "Content-Type: application/json" \
  -d '{"altcha": "your-altcha-solution"}'
```

### API Client Libraries

#### TypeScript/JavaScript
```typescript
// Example API client
class ScoutAPI {
  private baseUrl: string;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  
  async generateTravelDeck(data: TravelDeckRequest): Promise<TravelDeckResponse> {
    const response = await fetch(`${this.baseUrl}/api/scout/deck`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    return response.json();
  }
  
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    
    return response.json();
  }
}
```

## 📊 Performance

### Response Times

| Endpoint | Average | P95 | P99 |
|----------|---------|-----|-----|
| Authentication | 150ms | 300ms | 500ms |
| Travel Deck Generation | 15s | 45s | 60s |
| Image Services | 800ms | 1.5s | 2s |
| API Management | 100ms | 200ms | 300ms |

### Optimization Tips

1. **Caching**: Enable API response caching
2. **Images**: Use appropriate image sizes
3. **Rate Limiting**: Respect rate limits
4. **Parallel Requests**: Use concurrent requests where possible
5. **Error Handling**: Implement proper retry logic

## 🔍 Monitoring

### Health Check Endpoints

- `GET /api/health` - Basic health check
- `GET /api/security/status` - Security metrics (admin)
- `GET /api/rapidapi/manage?action=status` - API status

### Metrics Available

- Request counts and response times
- Error rates and types
- Rate limiting statistics
- Session security metrics
- Database performance
- API integration health

---

**Last Updated**: December 2024  
**API Version**: 1.0  
**Contact**: api-support@scout.app