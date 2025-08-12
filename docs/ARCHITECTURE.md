# Scout Architecture Guide

This document provides a comprehensive overview of Scout's architecture, including security layers, data flow, and system design patterns.

## 🏗️ System Overview

Scout is built as a modern, secure web application with enterprise-grade security features and a focus on Indian travelers.

```
┌─────────────────────────────────────────────────────────────┐
│                       Scout Architecture                   │
├─────────────────────────────────────────────────────────────┤
│  🌐 Client Layer (Next.js App Router)                     │
│    ├── React Components (Mobile-first)                    │
│    ├── TypeScript (Strict typing)                         │
│    ├── Tailwind CSS + shadcn/ui                          │
│    └── PWA Capabilities                                   │
├─────────────────────────────────────────────────────────────┤
│  🔒 Security Layer                                        │
│    ├── HMAC Request Signing                              │
│    ├── Enhanced Session Management                        │
│    ├── Device Fingerprinting                             │
│    ├── Rate Limiting                                     │
│    └── ALTCHA CAPTCHA                                    │
├─────────────────────────────────────────────────────────────┤
│  🛡️ API Layer (Next.js API Routes)                       │
│    ├── Authentication & Authorization                     │
│    ├── Input Validation (Zod)                           │
│    ├── Travel Planning APIs                              │
│    └── Monitoring & Health Checks                       │
├─────────────────────────────────────────────────────────────┤
│  📊 Data Layer                                           │
│    ├── AxioDB (Document Database)                        │
│    ├── Connection Pooling                               │
│    ├── Query Optimization                               │
│    └── Health Monitoring                                │
├─────────────────────────────────────────────────────────────┤
│  🌍 External APIs                                        │
│    ├── RapidAPI (Travel Data)                           │
│    ├── OpenRouter (LLM Services)                        │
│    ├── Unsplash (Images)                                │
│    └── Multiple Travel Services                         │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 Security Architecture

### Multi-Layer Security Design

Scout implements a defense-in-depth security model with multiple independent security layers:

#### Layer 1: Request Signing (HMAC-SHA256)
- **Purpose**: Prevent request tampering and replay attacks
- **Implementation**: HMAC signatures for sensitive operations
- **Protection**: Data integrity, replay attack prevention

```typescript
// Request signing flow
Client Request → HMAC Signature → Server Validation → API Processing
```

#### Layer 2: Enhanced Session Management
- **Device Fingerprinting**: Sessions tied to device characteristics
- **Session Rotation**: Automatic rotation on privilege escalation
- **Risk Assessment**: Real-time suspicious activity detection
- **Concurrent Limits**: Maximum 5 sessions per user

```typescript
// Session security flow
Login → Device Fingerprint → Session Creation → Risk Assessment → Access Control
```

#### Layer 3: Database Security
- **Connection Pooling**: Limited concurrent connections (10 max)
- **Query Timeouts**: 30-second maximum execution time
- **Input Sanitization**: SQL injection prevention
- **Health Monitoring**: Automatic connection health checks

#### Layer 4: Rate Limiting & DDoS Protection
- **Authentication**: 5 attempts per 15 minutes per IP
- **API Calls**: 1000 requests per hour global limit
- **Image Services**: 100 requests per hour per IP
- **Intelligent Throttling**: Dynamic rate adjustment

### Security Data Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │────│   HMAC      │────│  Session    │────│  Database   │
│  Request    │    │ Validation  │    │   Check     │    │   Query     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Rate     │    │   Input     │    │    Risk     │    │  Response   │
│  Limiting   │    │ Validation  │    │ Assessment  │    │ Sanitize    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## 📱 Frontend Architecture

### Component Hierarchy

```
App Router (Next.js 14)
├── layout.tsx (Global layout)
├── page.tsx (Home page)
├── scout/
│   └── page.tsx (Travel planning)
├── components/
│   ├── auth/ (Authentication)
│   │   ├── UnifiedAuthForm.tsx
│   │   └── AuthModal.tsx
│   ├── travel/ (Travel planning)
│   │   ├── JourneyForm.tsx
│   │   ├── CaptchaVerification.tsx
│   │   └── TravelCardsGrid.tsx
│   ├── travel-deck/ (Travel results)
│   │   ├── TravelDeckView.tsx
│   │   └── cards/ (Individual cards)
│   └── ui/ (Shared components)
│       ├── altcha-captcha.tsx
│       └── mobile-container.tsx
├── hooks/ (Custom React hooks)
│   ├── useAuth.ts
│   ├── useDeviceDetection.ts
│   └── useDestinationImages.ts
└── lib/ (Utilities & services)
    ├── api/ (API clients)
    ├── auth/ (Authentication)
    ├── security/ (Security utilities)
    └── types/ (TypeScript definitions)
```

### State Management

Scout uses React's built-in state management with custom hooks:

- **useAuth**: Authentication state and user management
- **useDeviceDetection**: Device and browser detection
- **useDestinationImages**: Image loading and caching
- **Context API**: Theme and breadcrumb navigation

### Mobile-First Design

```css
/* Responsive breakpoints */
sm: 640px   /* Mobile */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

## 🛡️ Backend Architecture

### API Route Structure

```
/api/
├── auth/ (Authentication)
│   ├── login/route.ts
│   ├── signup/route.ts
│   ├── logout/route.ts
│   ├── me/route.ts
│   └── username/check/route.ts
├── scout/ (Travel planning)
│   ├── route.ts
│   ├── deck/route.ts
│   └── travel/route.ts
├── captcha/ (Security)
│   ├── challenge/route.ts
│   └── verify/route.ts
├── security/ (Monitoring)
│   └── status/route.ts
├── rapidapi/ (API management)
│   ├── manage/route.ts
│   └── status/route.ts
├── images/ (Image services)
│   ├── destination/route.ts
│   └── backgrounds/route.ts
└── cards/ (Travel cards)
    ├── public/route.ts
    └── [cardId]/
        ├── like/route.ts
        └── view/route.ts
```

### Middleware & Security

```typescript
// Request processing pipeline
Request → Rate Limiting → HMAC Validation → Session Check → Input Validation → Business Logic → Response
```

### Error Handling

```typescript
// Standardized error response
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

## 📊 Data Architecture

### Database Design (AxioDB)

```
scout_auth (Database)
├── users (Collection)
│   ├── id: string
│   ├── email: string
│   ├── username: string
│   ├── passwordHash: string
│   ├── name: string
│   └── createdAt: Date
├── sessions (Collection)
│   ├── sessionId: string
│   ├── userId: string
│   ├── expiresAt: Date
│   ├── deviceFingerprint: object
│   ├── riskScore: number
│   └── rotationCount: number
├── travel_cards (Collection)
│   ├── id: string
│   ├── userId: string
│   ├── destination: string
│   ├── cards: object[]
│   ├── isPublic: boolean
│   └── createdAt: Date
└── public_cards (Collection)
    ├── id: string
    ├── originalCardId: string
    ├── destination: string
    ├── summary: object
    ├── likes: number
    ├── views: number
    └── createdAt: Date
```

### Secure Database Access

```typescript
// Enhanced database manager
class SecureDatabaseManager {
  // Connection pooling (10 max connections)
  // Query timeouts (30 seconds)
  // Retry logic with exponential backoff
  // Health monitoring
  // Input sanitization
}
```

## 🌍 External API Integration

### RapidAPI Ecosystem

Scout integrates with multiple RapidAPI services:

```
Travel Data Flow:
User Input → Scout API → RapidAPI Services → Data Processing → AI Enhancement → User Response

Integrated APIs:
├── Unsplash (Images)
├── Flight Data (Flights)
├── Hotel Search (Accommodations)
├── TripAdvisor (Reviews)
├── Travel Guide (Attractions)
├── Weather Forecast (Weather)
└── Currency Exchange (Rates)
```

### API Management

```typescript
// Centralized API configuration
const RAPIDAPI_ENDPOINTS = {
  unsplash: {
    name: 'Royalty Free Images Unsplash API',
    host: 'royalty-free-images-unsplesh-api.p.rapidapi.com',
    category: 'images',
    endpoints: { /* ... */ }
  },
  // ... other APIs
};
```

### OpenRouter LLM Integration

```
LLM Processing Flow:
Travel Data → Content Generation → Claude/GPT → Enhanced Travel Deck → User
```

## 🔄 Data Flow

### Travel Planning Flow

```
1. User Input (Travel Form)
   ├── Validation (Zod schemas)
   ├── CAPTCHA verification
   └── Session authentication

2. Data Processing
   ├── RapidAPI calls (parallel)
   ├── Image fetching (Unsplash)
   └── LLM enhancement (OpenRouter)

3. Travel Deck Generation
   ├── Content structuring
   ├── Budget calculations
   ├── Image optimization
   └── Card generation

4. Response Delivery
   ├── Data caching
   ├── Image optimization
   └── Client rendering
```

### Authentication Flow

```
1. User Registration/Login
   ├── Input validation
   ├── Rate limiting check
   ├── Password verification
   └── Session creation

2. Enhanced Session Management
   ├── Device fingerprinting
   ├── Risk assessment
   ├── Concurrent session check
   └── Session storage

3. Ongoing Security
   ├── Session validation
   ├── Risk monitoring
   ├── Automatic rotation
   └── Cleanup processes
```

## ⚡ Performance Architecture

### Optimization Strategies

1. **Client-Side**
   - React lazy loading
   - Image optimization (Next.js)
   - Code splitting
   - PWA caching

2. **Server-Side**
   - API response caching
   - Database connection pooling
   - Parallel API calls
   - Request deduplication

3. **Database**
   - Query optimization
   - Connection pooling
   - Health monitoring
   - Automatic cleanup

### Caching Strategy

```
Caching Layers:
├── Browser Cache (Static assets)
├── CDN Cache (Images)
├── API Response Cache (Travel data)
├── Database Query Cache (User data)
└── Session Cache (Authentication)
```

## 🚀 Deployment Architecture

### Vercel Deployment

```
Production Environment:
├── Next.js App (Vercel)
├── Serverless Functions (API routes)
├── Edge Functions (Middleware)
├── Static Assets (CDN)
└── Environment Variables (Secure)
```

### Environment Configuration

```typescript
// Environment validation
Production Requirements:
- HTTPS enforcement
- Security headers
- Rate limiting
- Database encryption
- Session security
- HMAC signing
```

## 📊 Monitoring & Observability

### Health Monitoring

1. **Security Metrics**
   - Session risk levels
   - Authentication failures
   - Rate limit violations
   - Suspicious activity

2. **Performance Metrics**
   - API response times
   - Database query performance
   - Error rates
   - Cache hit rates

3. **Business Metrics**
   - Travel deck generations
   - User registrations
   - API usage patterns
   - Feature adoption

### Logging Strategy

```typescript
// Structured logging
{
  timestamp: "2024-01-01T12:00:00Z",
  level: "warn",
  event: "high_risk_session",
  userId: "user123",
  sessionId: "session456",
  riskScore: 75,
  deviceFingerprint: "fp789"
}
```

## 🔧 Development Architecture

### Development Workflow

```
1. Local Development
   ├── Next.js dev server
   ├── Hot module replacement
   ├── TypeScript checking
   └── Mock API responses

2. Code Quality
   ├── ESLint (Code linting)
   ├── Prettier (Code formatting)
   ├── TypeScript (Type checking)
   └── Git hooks (Pre-commit)

3. Testing Strategy
   ├── Unit tests (Jest)
   ├── Integration tests (API)
   ├── E2E tests (Playwright)
   └── Security testing
```

### Build Process

```
Build Pipeline:
Source Code → TypeScript Compilation → Bundle Optimization → Static Generation → Deployment
```

## 🎯 Scalability Considerations

### Horizontal Scaling

1. **Stateless Design**
   - Session storage in database
   - No in-memory state
   - Load balancer ready

2. **Database Scaling**
   - Connection pooling
   - Read replicas
   - Sharding strategy

3. **API Scaling**
   - Rate limiting
   - Caching layers
   - Circuit breakers

### Performance Bottlenecks

1. **LLM API Calls** (15-45 seconds)
   - Parallel processing
   - Response streaming
   - Caching strategies

2. **Image Processing**
   - CDN optimization
   - Progressive loading
   - Format optimization

3. **Database Queries**
   - Query optimization
   - Connection pooling
   - Health monitoring

---

## 📚 Technical Decisions

### Why Next.js 14?
- **App Router**: Modern routing with layouts
- **Server Components**: Better performance
- **Built-in optimization**: Images, fonts, scripts
- **TypeScript support**: First-class TypeScript
- **Vercel integration**: Seamless deployment

### Why AxioDB?
- **Document-based**: Flexible schema
- **TypeScript support**: Type-safe queries
- **Local development**: No external dependencies
- **Performance**: Fast queries and indexing

### Why ALTCHA?
- **Privacy-focused**: No tracking
- **Lightweight**: Minimal performance impact
- **Accessible**: Screen reader compatible
- **Secure**: Cryptographic proof-of-work

### Why RapidAPI?
- **Unified interface**: Single API key
- **Reliable services**: Vetted providers
- **Comprehensive data**: Travel ecosystem
- **Rate limiting**: Built-in protection

---

**Last Updated**: December 2024  
**Architecture Version**: 2.0  
**Next Review**: March 2025