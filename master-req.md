# Scout - Master Requirements Document

## 📋 Document Overview
**Version**: 2.0  
**Last Updated**: Current  
**Status**: Comprehensive Requirements  
**Purpose**: Single source of truth for Scout development

This master document consolidates all project requirements, technical specifications, user flows, and implementation guidelines for Scout - the travel planning application designed specifically for Indian travelers.

---

## 🇮🇳 Executive Summary

### Product Vision
**"Capture the spark. Plan it later."**

Scout is a 30-second travel planning tool designed exclusively for **Indian travelers** exploring both domestic and international destinations. It transforms spontaneous travel inspirations into comprehensive, actionable travel cards with everything an Indian traveler needs to know.

### Market Position
- **Target Market**: Indian citizens (1.4 billion population)
- **Market Opportunity**: 50M+ Indian travelers annually
- **Travel Split**: 60% Domestic within India, 40% International from India
- **Key Differentiator**: India-first approach with local payment methods, dietary preferences, and Indian passport requirements

### Current State vs Vision Gap
- **Current**: Basic note-taking app with image capture (5% of vision)
- **Required**: Intelligent travel planning assistant with 35+ API integrations
- **Gap**: 95% of intended functionality missing, complete rebuild needed

---

## 👥 Target Users & Personas

### Primary Persona: Priya (Urban Professional)
- **Demographics**: 28, Software Engineer in Bangalore
- **Travel Profile**: 4-5 trips/year (2 international, 3 domestic)
- **Pain Points**: Forgets travel ideas, overwhelmed by planning, visa confusion
- **Needs**: Quick capture, Indian food abroad, budget in INR, direct flights
- **Payment Preference**: UPI, credit cards, EMI options
- **Dietary**: Vegetarian priority

### Secondary Persona: Rajesh (Family Traveler)
- **Demographics**: 45, Business owner in Delhi  
- **Travel Profile**: Family vacations, pilgrimages, business trips
- **Pain Points**: Coordinating family preferences, safety concerns
- **Needs**: Family-friendly places, temple visits, Indian restaurants
- **Payment Preference**: Cash, debit cards, travel insurance
- **Dietary**: Vegetarian/Jain food mandatory

### Tertiary Persona: Ananya (Budget Explorer)
- **Demographics**: 23, Recent graduate in Mumbai
- **Travel Profile**: Backpacking, budget trips, group travel
- **Pain Points**: Limited budget, visa costs, finding cheap options
- **Needs**: Trains over flights, hostels, street food safety
- **Payment Preference**: UPI, student discounts
- **Dietary**: Flexible, street food exploration

---

## 🎯 Core Product Requirements

### 1. Travel Inspiration Capture (Journey-Style Multi-Step Flow)

#### Journey-Style Form Architecture
The capture flow uses a journey-style multi-step form approach with progressive disclosure, making it feel conversational and less overwhelming. Users can start creating travel cards in **guest mode** without registration.

```typescript
// Step 1: Travel Type Selection
interface TravelTypeStep {
  travelType: 'single' | 'family' | 'group';  // Default: 'single'
  groupSubType?: 'individuals' | 'families';   // Only if group selected
}

// Step 2: Traveler Details (conditional based on type)
interface TravelerDetailsStep {
  // For Single
  travelerAge?: number;
  
  // For Family
  familyMembers?: {
    adults: number;
    children: number;
    childrenAges?: number[];  // Important for recommendations
    seniors?: number;          // 60+ for special considerations
  };
  
  // For Group
  groupSize?: number;
  groupComposition?: 'friends' | 'colleagues' | 'mixed';
  groupFamilies?: number;  // If groupSubType is 'families'
}

// Step 3: Destination & Timing
interface DestinationStep {
  destination: string;           // Autocomplete: Indian cities first
  origin: string;               // Default: User's city or Kolkata
  motivation: string;           // Why now? (dropdown + other)
  season: 'Winter' | 'Summer' | 'Monsoon' | 'Flexible';
  duration: '2-3' | '5-7' | '10-14' | 'Flexible';
}

// Step 4: Preferences & Budget
interface PreferencesStep {
  budget: 'Tight' | 'Comfortable' | 'Luxury';
  budgetPerPerson?: boolean;    // For group/family trips
  dietary: 'Veg' | 'Non-veg' | 'Jain' | 'Halal' | 'Flexible';
  travelStyle: 'Adventure' | 'Leisure' | 'Business' | 'Pilgrimage' | 'Educational';
  specialRequirements?: string[];  // Wheelchair, infant needs, etc.
}

// Complete Travel Capture combining all steps
interface TravelCaptureInput {
  // User Mode
  isGuest: boolean;             // Guest mode, no registration required
  sessionId?: string;           // For tracking guest sessions
  
  // Combined from all steps
  travelType: 'single' | 'family' | 'group';
  travelerDetails: TravelerDetailsStep;
  destination: string;
  origin: string;
  motivation: string;
  season: 'Winter' | 'Summer' | 'Monsoon' | 'Flexible';
  duration: '2-3' | '5-7' | '10-14' | 'Flexible';
  budget: 'Tight' | 'Comfortable' | 'Luxury';
  dietary: 'Veg' | 'Non-veg' | 'Jain' | 'Halal' | 'Flexible';
  travelStyle: 'Adventure' | 'Leisure' | 'Business' | 'Pilgrimage' | 'Educational';
  specialRequirements?: string[];
}
```

#### Guest Mode & Registration Flow
```typescript
interface UserModeFlow {
  guestMode: {
    enabled: true;
    features: [
      'Create unlimited travel cards',
      'View and download cards',
      'Basic sharing via link'
    ];
    limitations: [
      'Cards expire after 7 days',
      'No card history',
      'No saved preferences',
      'No personalization'
    ];
    conversionPrompt: 'After 3rd card creation';
  };
  
  registrationTriggers: [
    'Save card permanently',
    'Share with collaboration',
    'Access card history',
    'Save preferences',
    'Export to cloud storage'
  ];
  
  authentication: {
    method: 'Email + Password';  // Using AxioDB for user management
    optional: 'Phone number for OTP';
    social: false;  // Not in initial version
  };
}
```

#### Journey Flow & Validation
```yaml
User Experience Flow:
  Step 1 - Travel Type (5 seconds):
    - Three big buttons: Single, Family, Group
    - Instant selection, no validation needed
    - Shows relevant icon and description
    
  Step 2 - Traveler Details (10 seconds):
    - Dynamic fields based on travel type
    - Family: Add family members with ages
    - Group: Specify size and composition
    - Smart defaults and suggestions
    
  Step 3 - Destination & Timing (10 seconds):
    - Autocomplete with popular destinations
    - Season selector with best time hints
    - Duration with common trip lengths
    
  Step 4 - Preferences & Budget (5 seconds):
    - Quick selection buttons
    - Dietary preferences with icons
    - Travel style with descriptions
    - Optional special requirements

Validation Requirements:
  - Progressive validation per step
  - Destination must exist in places database
  - Origin defaults to user's detected city
  - Family: At least 1 adult required
  - Group: Minimum 3 people
  - Children ages: 0-17 years
  - Form completion target: 30 seconds total
  - Guest users: No email validation required
  - Registered users: Email/password validation

Progress Indicators:
  - Step counter: "Step 2 of 4"
  - Progress bar: Visual completion percentage
  - Back button: Allow editing previous steps
  - Skip option: For optional fields
  - Save & Continue: For registered users only
```

### 2. Data Processing Pipeline

#### Required Processing Steps
```javascript
async function generateTravelCard(input: TravelCaptureInput): Promise<TravelCard> {
  // 1. Validate and parse input
  const validated = await validateInput(input);
  
  // 2. Determine travel type (domestic/international)  
  const travelType = await classifyTravelType(validated.destination, validated.origin);
  
  // 3. Parallel API calls (30+ APIs)
  const [
    flights,
    trains,      // For domestic only
    buses,       // For domestic only  
    visaInfo,    // For international only
    weather,
    attractions, 
    hotels,
    restaurants,
    budget,
    indianContext
  ] = await Promise.allSettled([
    fetchFlightOptions(validated),
    travelType === 'domestic' ? fetchTrainOptions(validated) : null,
    travelType === 'domestic' ? fetchBusOptions(validated) : null, 
    travelType === 'international' ? fetchVisaInfo(validated) : null,
    fetchWeatherData(validated),
    fetchTopAttractions(validated),
    fetchAccommodation(validated),
    fetchFoodOptions(validated),
    calculateBudget(validated),
    fetchIndianTravelerInfo(validated)
  ]);
  
  // 4. Generate comprehensive travel card with LLM
  const enrichedCard = await generateTravelCardWithLLM(validated, processedData);
  return enrichedCard;
}

// LLM Integration for Travel Card Generation
async function generateTravelCardWithLLM(input: TravelCaptureInput, apiData: any): Promise<TravelCard> {
  const prompt = `
  Create a comprehensive travel card for an Indian traveler going to ${input.destination} from ${input.origin}.
  
  Trip Details:
  - Duration: ${input.duration} days
  - Budget: ${input.budget}
  - Dietary: ${input.dietary}
  - Group: ${input.group}
  
  Available Data:
  ${JSON.stringify(apiData, null, 2)}
  
  Generate a detailed travel card including:
  1. Destination overview (why it's famous)
  2. How to reach (3 options: value/speed/comfort)
  3. Visa requirements (for Indian passport)
  4. Best time to visit
  5. Accommodation options by budget tier
  6. Indian food availability and restaurants
  7. Budget breakdown in INR
  8. Top 10 attractions with entry fees
  9. Suggested itineraries
  10. Indian traveler essentials (payments/SIM/language)
  
  Format as JSON with proper structure for web display.
  `;
  
  const response = await openRouterAPI.generate({
    model: 'anthropic/claude-3.5-sonnet', // Best for comprehensive content
    prompt,
    temperature: 0.7,
    maxTokens: 4000
  });
  
  return parseAndValidateTravelCard(response.content);
}
```

### 3. Travel Card Output Specification

#### Required Card Sections
```markdown
DESTINATION TRAVEL CARD
├── Overview & Famous For
├── How to Reach (3 Options)
│   ├── Best Value (Price optimized)
│   ├── Fastest (Time optimized)  
│   └── Most Comfortable (Convenience optimized)
├── Visa & Documentation (International only)
│   ├── Visa requirements for Indian passport
│   ├── Processing time & costs
│   ├── Required documents
│   └── Embassy contacts
├── Best Time to Visit
│   ├── Weather patterns
│   ├── Avoid monsoon/extreme seasons  
│   ├── Festival calendar
│   └── Price seasonality
├── Accommodation Options
│   ├── Budget tier (₹1000-2500/night)
│   ├── Comfortable tier (₹2500-5000/night)
│   └── Luxury tier (₹5000+/night)
├── Indian Food & Dietary
│   ├── Indian restaurants
│   ├── Vegetarian/Jain availability
│   ├── Indian grocery stores
│   └── Food delivery apps status
├── Budget Breakdown (INR)
│   ├── Tight budget calculation
│   ├── Comfortable budget calculation
│   ├── Component breakdown
│   └── Hidden costs warning
├── Top 10 Things to Do
│   ├── Must-see attractions
│   ├── Entry fees in INR
│   ├── Opening hours
│   └── Booking requirements
├── Suggested Itineraries  
│   ├── 2-3 day plan
│   ├── 5-7 day plan
│   └── 10-14 day plan
├── Indian Traveler Essentials
│   ├── Payment methods (UPI/RuPay/Cards)
│   ├── SIM/eSIM options  
│   ├── Language comfort level
│   ├── Uber/Ola availability
│   ├── Indian community groups
│   ├── Emergency contacts
│   └── Cultural tips & customs
└── Sources & Citations
    ├── All data sources listed
    ├── Last updated timestamps  
    └── Reliability indicators
```

---

## 🤖 AI/LLM Integration Strategy

### OpenRouter Model Recommendations

For travel card content generation, we recommend using OpenRouter (https://openrouter.ai) with the following model selection strategy:

```yaml
Primary Model (95% of requests):
  Model: anthropic/claude-3.5-sonnet
  Use Case: Comprehensive travel card generation
  Strengths: 
    - Excellent for structured travel content
    - Great understanding of Indian travel context
    - Reliable JSON formatting
    - Strong factual accuracy
  Cost: ~$3 per 1M input tokens, $15 per 1M output tokens
  
Fallback Model (High volume periods):
  Model: meta-llama/llama-3.1-70b-instruct
  Use Case: Cost-effective content generation
  Strengths:
    - 60% cheaper than Claude
    - Good for basic travel descriptions
    - Fast response times
  Cost: ~$0.50 per 1M input tokens, $0.75 per 1M output tokens
  
Specialized Models:
  Model: google/gemini-pro-1.5
  Use Case: Multi-language content, Indian context
  Strengths:
    - Excellent Hindi/regional language support
    - Good for cultural context
    - Free tier available
  Cost: Free up to limit, then $1.25 per 1M tokens
```

### LLM Integration Architecture

```typescript
// OpenRouter integration for travel card generation
class LLMService {
  private openRouter: OpenRouterAPI;
  
  constructor() {
    this.openRouter = new OpenRouterAPI({
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultModel: 'anthropic/claude-3.5-sonnet'
    });
  }
  
  async generateTravelCard(travelData: TravelData): Promise<TravelCard> {
    const prompt = this.buildTravelCardPrompt(travelData);
    
    try {
      // Primary model attempt
      const response = await this.openRouter.generate({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        maxTokens: 4000
      });
      
      return this.parseAndValidateResponse(response);
      
    } catch (error) {
      // Fallback to cheaper model
      console.log('Claude failed, trying Llama 3.1...');
      
      const fallbackResponse = await this.openRouter.generate({
        model: 'meta-llama/llama-3.1-70b-instruct', 
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        maxTokens: 4000
      });
      
      return this.parseAndValidateResponse(fallbackResponse);
    }
  }
  
  private buildTravelCardPrompt(data: TravelData): string {
    return `
    You are a travel expert creating a comprehensive travel card for Indian travelers.
    
    Input Data:
    ${JSON.stringify(data, null, 2)}
    
    Create a detailed JSON response with:
    - Destination overview and why it's famous
    - 3 travel options (value/speed/comfort) with INR prices
    - Visa requirements for Indian passport holders
    - Best time to visit with weather info
    - Accommodation tiers with budget ranges in INR
    - Indian restaurant availability and vegetarian options
    - Complete budget breakdown in INR
    - Top 10 attractions with entry fees in INR
    - 3 suggested itineraries (2-3, 5-7, 10-14 days)
    - Indian traveler essentials (UPI/cards, SIM, language, customs)
    - All information must be current and cite sources where possible
    
    Format as valid JSON with proper structure for web display.
    Be specific about Indian context (visa processing, embassy contacts, etc.)
    `;
  }
}
```

### Cost Optimization Strategy

```yaml
Monthly API + LLM Costs Estimate (1000 cards/month):

RapidAPI Costs:
  - Basic Plan: $10/month (1000 requests across all APIs)
  - Pro Plan: $50/month (10,000 requests across all APIs) 
  - Mega Plan: $500/month (100,000+ requests)
  
  For 1000 cards: ~6000 total API calls needed
  Recommended: Pro Plan at $50/month

LLM Costs (OpenRouter):
  - Average tokens per card: 3000 input + 2000 output
  - Claude 3.5 Sonnet: $9 + $30 = $39/month
  - Llama 3.1 70B: $1.50 + $1.50 = $3/month (fallback)
  
Total Monthly Cost for 1000 cards:
  RapidAPI: $50
  LLM: $40-50  
  Total: $90-100/month
  Cost per card: ~$0.09-0.10 (₹7-8 per card)

Optimization Techniques:
  - Use RapidAPI caching to reduce duplicate calls
  - Implement AxioDB caching for popular destinations
  - Batch API requests where possible
  - Use fallback models during high-volume periods
  - Cache LLM responses for similar destinations
```

---

## 🔌 External API Requirements (35+ APIs)

### Phase 1: Indian Domestic Essentials (Week 1)
```yaml
Priority: CRITICAL
Target: Indians traveling within India (60% of users)
Purpose: INFORMATION GATHERING ONLY - No booking functionality

RapidAPI Verified APIs (Information Only):
  - Skyscanner Flight API: Flight prices and schedules (display only)
  - Booking.com15 API: Hotel information, prices, reviews (no booking)
  - WeatherAPI.com: Weather forecasts and conditions
  - Airbnb API: Alternative accommodation options and prices
  - World Tourist Attractions API: Destination highlights and information
  - Travel Booking Engine API: Price comparisons (information only)
  - B2B Travel Booking API: Package information (display only)
  - Trawex Hotel API: Hotel details and amenities (no booking)
  - Trawex Flight API: Flight options and timings (information only)
  
Non-RapidAPI Indian Services (Information Only):
  - IRCTC API: Train schedules and availability (no booking)
  - RedBus API: Bus routes and timings (information only)
  - Zomato API: Restaurant listings and reviews (no ordering)
  - OYO API: Budget accommodation information (display only)
  - Google Places API: Destination information and photos
  
Note: All APIs are used for information gathering and display purposes only.
No booking, payment, or transaction functionality is implemented.
Users are provided with information to make informed decisions and book directly.
```

### Phase 2: Indian International Travel (Week 2)
```yaml  
Priority: HIGH
Target: Indians traveling abroad (40% of users)

RapidAPI Verified APIs:
  - Visa List API: Visa requirements for 238+ countries including Indian passport
  - Skyscanner Flight API: International flight search from Indian cities
  - Booking.com15 API: Global hotel inventory with reviews and pricing
  - Currency Converter APIs: Real-time exchange rates for INR conversion
  - WeatherAPI.com: Global weather forecasting for international destinations
  - Amadeus Airport Performance API: AI-powered flight delay predictions
  - Amadeus Trip Purpose API: Travel insights and predictions
  - Travel Booking Engine API: International GDS integration
  
Non-RapidAPI International Services:
  - Indian Embassy API: Embassy contacts (government sources)
  - Airtel/Jio Roaming API: International plans (direct from telcos)
  - HDFC/ICICI Forex API: Travel cards (direct from banks)
  - PolicyBazaar API: Travel insurance (direct integration)
```

### Phase 3: Enhanced Features (Week 3-4)
```yaml
Priority: MEDIUM  
Target: Enhanced user experience

RapidAPI Verified APIs:
  - Trawex Sightseeing API: Attractions and activities booking
  - Trawex Transfer API: Airport transfers and local transportation
  - Trawex Car API: Car rental services globally
  - Travel APIs Collection: Multiple travel service integrations
  - Flight Data APIs: Real-time flight tracking and status
  - Alternative Travel APIs: Backup options for flight/hotel data
  
Non-RapidAPI Enhancement Services:
  - Google Translate API: Multi-language support (direct from Google)
  - BookMyShow API: Local events booking (direct integration)
  - HappyCow API: Vegetarian restaurants (direct from HappyCow)
  - Temple APIs: Religious site bookings (government/temple websites)
  - Uber/Ola APIs: Ride sharing (direct from providers)
  - WhatsApp Business API: Messaging (direct from Meta)
```

### RapidAPI Integration Architecture
```typescript
// RapidAPI-focused client for Scout travel APIs
class ScoutRapidAPIClient {
  private rapidAPIKey: string;
  private rapidAPIHost: string = 'rapidapi.com';
  private timeout: number = 10000; // 10s timeout
  private retries: number = 3;
  private cache: AxioDB; // Using AxioDB for caching
  
  constructor() {
    this.rapidAPIKey = process.env.RAPIDAPI_KEY!;
  }
  
  async callRapidAPI(apiPath: string, params: any): Promise<any> {
    const headers = {
      'X-RapidAPI-Key': this.rapidAPIKey,
      'X-RapidAPI-Host': apiPath,
      'Content-Type': 'application/json'
    };
    
    // Rate limiting: RapidAPI plans (Basic: 1000/month, Pro: 10K/month)
    // Caching: Static data (24h), Dynamic (5-15m)
    // Error handling: Circuit breaker with fallback APIs
    
    return this.makeRequest(apiPath, headers, params);
  }
  
  // Specific RapidAPI integrations
  async getFlights(origin: string, destination: string): Promise<FlightData[]> {
    return this.callRapidAPI('skyscanner-api.rapidapi.com', {
      originPlace: origin,
      destinationPlace: destination,
      outboundDate: new Date().toISOString().split('T')[0]
    });
  }
  
  async getHotels(destination: string): Promise<HotelData[]> {
    return this.callRapidAPI('booking-com15.rapidapi.com', {
      destination: destination,
      checkIn: new Date().toISOString().split('T')[0]
    });
  }
  
  async getVisaInfo(destination: string): Promise<VisaData> {
    return this.callRapidAPI('visa-list.rapidapi.com', {
      destination: destination,
      passportCountry: 'IN' // Indian passport
    });
  }
  
  async getWeather(destination: string): Promise<WeatherData> {
    return this.callRapidAPI('weatherapi-com.rapidapi.com', {
      q: destination,
      days: 7
    });
  }
  
  // Indian-specific data processing
  async processForIndianTravelers(data: any): Promise<any> {
    return {
      ...data,
      pricesINR: this.convertToINR(data.prices),
      vegetarianOptions: this.filterVegetarian(data.restaurants),
      indianPayments: this.checkUPIAcceptance(data.destination),
      embassyContacts: this.getIndianEmbassy(data.destination)
    };
  }
}
```

---

## 🎨 User Experience & Interface Design

### Design Principles
1. **India First**: Default to Indian preferences and contexts
2. **Speed**: 30-second capture target, always
3. **Clarity**: No jargon, simple Hindi/English mix
4. **Trust**: Cite all sources with timestamps
5. **Actionable**: Every card leads to booking possibilities
6. **Inclusive**: Budget to luxury options covered
7. **Mobile First**: Thumb-friendly, offline-ready design

### Interface States & Flows

#### 1. Inspiration Capture Flow
```
Trigger Sources:
├── Social Media (Instagram, YouTube) 
├── Conversations (WhatsApp, calls)
├── Media (Netflix, articles, podcasts)
├── Events (festivals, concerts)  
└── Spontaneous (window views, dreams)

Capture Process:
[Inspiration] → [Open App] → [30s Form] → [Submit] → [Processing] → [Card Ready]
    0s           10s         30s         32s        2m         Complete
```

#### 2. Processing Experience  
```
Processing Screen Messages (Rotated every 5 seconds):
- "🔍 Searching best routes from Bangalore..."
- "📋 Checking visa requirements for Indian passport..."  
- "💰 Converting prices to INR..."
- "🍛 Finding vegetarian restaurants..."
- "✈️ Comparing 47 flight options..."
- "🏨 Analyzing 200+ hotels..."
- "📱 Checking Jio/Airtel roaming..."
- "🏛️ Looking up Indian embassy contacts..."
- "☀️ Checking weather and monsoon patterns..."
- "💳 Verifying UPI/card acceptance..."

Progress Indicator: 0% → 100% over 1-2 minutes
```

#### 3. Travel Card Interface
```
Card Sections (Expandable/Collapsible):
├── 📍 Destination Overview (Always expanded)
├── ✈️ How to Reach (3 options comparison) 
├── 🛂 Visa & Documents (International only)
├── 🏨 Where to Stay (Budget tiers)
├── 🍛 Indian Food (Veg/Non-veg options)
├── 💰 Budget Calculator (INR breakdown)
├── 🗓️ Best Time to Visit (Weather/seasons)
├── 🎯 Top Attractions (Must-see list)
├── 📱 Indian Essentials (Payments/SIM/Language)
└── 🔗 Sources (All citations)

Actions Available:
[Download PDF] [Share Link] [Save to Notebook] [Book Now] [Edit Preferences]
```

---

## 🏗️ Technical Architecture

### Current Technology Stack
```yaml
Frontend:
  Framework: Next.js 14 (App Router)
  Language: TypeScript
  Styling: Tailwind CSS + shadcn/ui  
  Icons: Lucide React
  UI Components: Radix UI primitives
  State: React hooks (local state)
  Storage: localStorage (temporary)

Backend:  
  API: Next.js API routes
  Database: None (localStorage only)
  Authentication: None
  File Storage: Base64 in localStorage
  
Deployment:
  Platform: Vercel
  Domain: Custom domain needed
  CDN: Vercel CDN
  Monitoring: Basic Vercel analytics
```

### Required Architecture Upgrade
```yaml
Frontend (Minimal Changes):
  Current stack suitable for MVP
  Add: Service worker for offline support
  Add: PWA manifest for mobile app feel
  Add: Error boundaries for stability
  Add: Loading skeletons for better UX

Backend (Complete Rebuild Required):
  Database: AxioDB (https://github.com/AnkanSaha/AxioDB) - Primary and only DB
  Authentication: NextAuth.js with Google/phone
  API Layer: RESTful + GraphQL for complex queries
  Queue System: Bull/Agenda for background jobs
  File Storage: AWS S3 or Cloudinary
  Search: AxioDB built-in search capabilities
  
AI/LLM Integration:
  Provider: OpenRouter (https://openrouter.ai)
  Recommended Models for Travel Cards:
    - Claude 3.5 Sonnet: Best for comprehensive travel content generation
    - GPT-4 Turbo: Excellent for destination descriptions and itineraries  
    - Llama 3.1 70B: Cost-effective for basic content generation
    - Gemini Pro: Good for multi-language content and Indian context
  
Infrastructure:
  Cache: AxioDB built-in caching features
  CDN: CloudFlare (global distribution) 
  Monitoring: Sentry (errors), DataDog (metrics)
  Analytics: Mixpanel (user behavior)
  Deployment: Docker containers on AWS/Railway
```

### AxioDB Schema Requirements
```javascript
// AxioDB Collection Definitions for Scout
// Using AxioDB as the primary and only database with built-in authentication

// Users collection with email/password authentication
const UsersSchema = {
  id: { type: 'string', primary: true },
  email: { type: 'string', unique: true, required: true },
  password: { type: 'string', required: true }, // Hashed using AxioDB's built-in bcrypt
  phone: { type: 'string', unique: true, optional: true },
  name: { type: 'string', required: false }, // Optional for guest conversions
  city: { type: 'string', required: false }, // Default origin city
  isGuest: { type: 'boolean', default: false },
  guestConvertedAt: { type: 'date', optional: true },
  preferences: { 
    type: 'object',
    properties: {
      dietary: { type: 'string' }, // Veg/Jain/Halal
      budget: { type: 'string' },  // Tight/Comfortable/Luxury
      travelStyle: { type: 'string' },
      defaultTravelType: { type: 'string', default: 'single' },
      familyComposition: { type: 'object', optional: true }
    }
  },
  subscription: {
    type: 'object',
    properties: {
      plan: { type: 'string', default: 'free' }, // free/pro/family
      validUntil: { type: 'date', optional: true }
    }
  },
  createdAt: { type: 'date', default: 'now' },
  updatedAt: { type: 'date', default: 'now' },
  lastLoginAt: { type: 'date', optional: true }
};

// Guest sessions for temporary users
const GuestSessionsSchema = {
  sessionId: { type: 'string', primary: true },
  ipAddress: { type: 'string' },
  userAgent: { type: 'string' },
  cardsCreated: { type: 'number', default: 0 },
  lastCardAt: { type: 'date' },
  expiresAt: { type: 'date', ttl: true }, // Auto-cleanup after 7 days
  createdAt: { type: 'date', default: 'now' }
};

// Travel cards collection with guest support
const TravelCardsSchema = {
  id: { type: 'string', primary: true },
  userId: { type: 'string', ref: 'users', optional: true }, // Optional for guests
  sessionId: { type: 'string', optional: true }, // For guest cards
  travelType: { type: 'string', required: true }, // single/family/group
  travelerDetails: {
    type: 'object',
    properties: {
      totalTravelers: { type: 'number' },
      adults: { type: 'number' },
      children: { type: 'number' },
      childrenAges: { type: 'array' },
      groupType: { type: 'string' } // individuals/families
    }
  },
  destination: { type: 'string', required: true, searchable: true },
  origin: { type: 'string', required: true },
  cardData: { 
    type: 'object', // Complete travel card JSON with information only
    properties: {
      flights: { type: 'array' }, // Flight information only
      hotels: { type: 'array' }, // Hotel details only
      airbnb: { type: 'array' }, // Airbnb listings information
      attractions: { type: 'array' }, // Tourist attractions info
      restaurants: { type: 'array' }, // Restaurant information
      budget: { type: 'object' }, // Budget calculations
      weather: { type: 'object' }, // Weather information
      visaInfo: { type: 'object' }, // Visa requirements
      bookingLinks: { type: 'object' } // External booking links only
    }
  },
  isGuestCard: { type: 'boolean', default: false },
  expiresAt: { type: 'date', optional: true }, // For guest cards
  llmGenerated: { type: 'boolean', default: false },
  llmModel: { type: 'string' }, // Which model generated the content
  shareToken: { type: 'string', unique: true }, // For sharing cards
  createdAt: { type: 'date', default: 'now' },
  updatedAt: { type: 'date', default: 'now' }
};

// Destinations master data
const DestinationsSchema = {
  id: { type: 'string', primary: true },
  name: { type: 'string', required: true, searchable: true },
  country: { type: 'string', required: true, searchable: true },
  type: { type: 'string' }, // city/state/country
  coordinates: { 
    type: 'object',
    properties: {
      lat: { type: 'number' },
      lng: { type: 'number' }
    }
  },
  popularFrom: { type: 'array' }, // Indian cities array
  bestTime: { type: 'string' },
  createdAt: { type: 'date', default: 'now' }
};

// API cache for performance (using AxioDB's built-in TTL)
const APICacheSchema = {
  key: { type: 'string', primary: true },
  data: { type: 'object' },
  expiresAt: { type: 'date', ttl: true }, // AxioDB auto-cleanup
  createdAt: { type: 'date', default: 'now' }
};
```

---

## 🔥 Critical Implementation Gaps

### Current State Analysis
**Security Score**: 3/10 (Critical vulnerabilities)
- No input validation on API endpoints
- Unencrypted localStorage usage  
- Missing authentication system
- No rate limiting or abuse prevention

**Performance Score**: 6/10 (Good start, poor scaling)
- No image size limits (crash risk)
- Unnecessary re-renders
- ID collision issues (Date.now())
- No caching strategy

**Accessibility Score**: 4/10 (Major gaps)  
- Missing ARIA labels
- No keyboard navigation
- Modal focus management broken
- Color contrast not verified

**Feature Completeness**: 5/10 (Basic prototype only)
- Generic capture vs travel-specific forms
- No API integrations whatsoever  
- No travel card generation
- No Indian-specific features

### Immediate Action Required (Week 1)
```typescript
// 1. Fix critical security issues
- Add Zod schema validation to all API endpoints
- Implement proper error boundaries  
- Replace Date.now() with crypto.randomUUID()
- Add image size limits and compression

// 2. Replace generic form with travel-specific capture  
interface TravelCapture {
  destination: string;    // Autocomplete
  origin: string;        // Default Indian cities
  purpose: string;       // Dropdown options
  season: string;        // Winter/Summer/Flexible  
  duration: string;      // 2-3/5-7/10-14 days
  budget: string;        // Tight/Comfortable/Luxury
  dietary: string;       // Veg/Jain/Non-veg/Halal
}

// 3. Set up basic API integration framework
class APIService {
  async fetchFlightData(request: TravelCapture): Promise<FlightData> {
    // Start with 1-2 flight APIs
  }
  
  async fetchVisaRequirements(destination: string): Promise<VisaInfo> {
    // Indian passport specific
  }
}
```

---

## 📊 Success Metrics & KPIs

### User Engagement Metrics
```yaml
Primary KPIs:
  - Card Creation Time: Target <30 seconds
  - Form Completion Rate: Target >90%
  - User Return Rate: Target >60% in 30 days
  - Cards Created per User: Target 5+ per month
  - PDF Downloads: Target 70% of cards
  - Share Rate: Target 40% of cards

Secondary KPIs:  
  - Time to First Card: Target <2 minutes
  - API Response Time: Target <2 seconds avg
  - Error Rate: Target <1% of all requests
  - Mobile Usage: Target >80% of traffic
  - User Satisfaction: Target 4.5+ stars
```

### Business Metrics
```yaml
Revenue KPIs:
  - User Acquisition Cost (UAC): Target <₹200
  - Conversion to Booking: Target 20% of cards  
  - Revenue per Card: Target ₹50-500
  - Monthly Active Users: Target 10K+ (Month 3)
  - Annual Recurring Revenue: Target ₹10L+ (Year 1)

Partnership KPIs:
  - API Partner Commissions: 3-8% per booking
  - Affiliate Revenue: ₹100-1000 per conversion
  - Premium Subscriptions: Target 5% conversion
  - Enterprise Clients: Target 10+ by Year 1
```

### Technical Performance Metrics
```yaml
Performance Targets:
  - Page Load Time: <2 seconds (95th percentile)
  - API Response Time: <200ms average  
  - Uptime: 99.9% monthly
  - Data Accuracy: 99%+ for all API data
  - Mobile Lighthouse Score: >90
  - Security Score: >95 (No critical issues)
```

---

## 🚀 Development Roadmap & Timeline

### Sprint 1: Foundation (Week 1-2) 
```yaml
Goal: Transform into travel-specific app
Priority: CRITICAL

Week 1 Tasks:
  - Replace generic form with travel capture ✅
  - Add destination autocomplete (Google Places) ✅  
  - Implement Zod validation for all inputs ✅
  - Fix security vulnerabilities (input validation) ✅
  - Add error boundaries and proper error handling ✅

Week 2 Tasks:  
  - Integrate 2-3 core APIs (flights, weather) ✅
  - Create TypeScript interfaces for travel data ✅
  - Implement basic travel card generation ✅
  - Add Indian city defaults and preferences ✅
  - Deploy beta version for testing ✅

Success Criteria:
  - 30-second travel-specific capture working
  - Basic travel card with real API data
  - No critical security issues
  - <2 second page load time
```

### Sprint 2: Intelligence (Week 3-4)
```yaml  
Goal: Add smart travel features
Priority: HIGH

Week 3 Tasks:
  - Integrate IRCTC train API for domestic travel ✅
  - Add visa requirements API for international ✅
  - Implement currency conversion to INR ✅  
  - Add Indian restaurant finder ✅
  - Create budget calculator with INR focus ✅

Week 4 Tasks:
  - Implement PDF generation with citations ✅
  - Add Indian embassy contacts database ✅
  - Integrate Zomato/Swiggy availability check ✅
  - Add UPI/RuPay payment method indicators ✅
  - Implement sharing via WhatsApp/email ✅

Success Criteria:
  - Comprehensive travel cards generated
  - 10+ API integrations functional  
  - PDF export working with sources
  - Indian-specific features complete
```

### Sprint 3: Scale (Week 5-6)
```yaml
Goal: Production readiness  
Priority: HIGH

Week 5 Tasks:
  - Set up PostgreSQL database ✅
  - Implement user authentication (NextAuth) ✅  
  - Create cloud storage for images/PDFs ✅
  - Add comprehensive error monitoring ✅
  - Implement API rate limiting ✅

Week 6 Tasks:
  - Set up CI/CD pipeline ✅
  - Add comprehensive testing suite ✅
  - Implement caching strategy (Redis) ✅
  - Optimize performance (lazy loading) ✅
  - Deploy production infrastructure ✅

Success Criteria:
  - Zero data loss guarantee
  - <1% error rate
  - 99.9% uptime
  - All security audits passed
```

### Sprint 4: Polish (Week 7-8)
```yaml
Goal: Launch preparation
Priority: MEDIUM

Week 7 Tasks:  
  - Add analytics tracking (Mixpanel) ✅
  - Implement A/B testing framework ✅
  - Create user onboarding flow ✅
  - Add customer support chat ✅
  - Optimize for mobile performance ✅

Week 8 Tasks:
  - Launch marketing website ✅
  - Create API documentation ✅  
  - Set up monitoring dashboards ✅
  - Prepare launch campaigns ✅
  - Conduct final load testing ✅

Success Criteria:
  - >95 Lighthouse score
  - WCAG AA accessibility compliance
  - Complete documentation
  - Launch-ready product
```

---

## 💰 Business Model & Monetization

### Revenue Streams
```yaml
Primary Revenue:
  Freemium SaaS Model:
    - Guest/Free: Unlimited cards (expire in 7 days), basic features
    - Pro: ₹299/month, permanent cards, advanced features, no ads
    - Family: ₹499/month, 5 accounts, collaborative planning
    - Group: ₹799/month, 10+ accounts, group travel tools
    - Enterprise: Custom pricing, white-label options

Secondary Revenue:
  Affiliate & Referral (Information-Based):
    - Flight booking referrals: 2-3% commission
    - Hotel booking referrals: 3-5% commission
    - Airbnb referrals: 3-4% commission
    - Travel insurance referrals: 10-15% commission
    - Visa service referrals: ₹500-1500 per lead
    Note: All bookings happen on partner sites, not within Scout

Tertiary Revenue:
  Partnership & Advertising:
    - Featured destinations: ₹50K-200K per month
    - Sponsored travel cards: ₹10K-50K per card
    - API licensing: ₹5L-20L annual contracts
    - Travel gear affiliate: 5-10% commission
```

### Cost Structure
```yaml
Monthly Operating Costs (1000+ Users):
  APIs & External Services: ₹50K-100K
    - Flight APIs: ₹20K-40K
    - Google Places API: ₹10K-20K  
    - Weather APIs: ₹5K-10K
    - Translation APIs: ₹5K-10K
    - Other APIs: ₹10K-20K
    
  Infrastructure: ₹30K-60K
    - Database hosting: ₹10K-20K
    - CDN & storage: ₹5K-10K
    - Server costs: ₹10K-20K  
    - Monitoring tools: ₹5K-10K
    
  Team & Operations: ₹200K-400K
    - Development team: ₹150K-300K
    - Customer support: ₹20K-40K
    - Marketing: ₹20K-40K
    - Legal & compliance: ₹10K-20K

Total Monthly Cost: ₹280K-560K
Break-even: ~2000 Pro subscribers or 10K bookings/month
```

---

## 🔒 Security & Compliance

### Security Requirements
```yaml
Data Protection:
  - End-to-end encryption for sensitive data
  - API keys stored in secure vault (HashiCorp Vault)
  - User passwords hashed via AxioDB's built-in bcrypt
  - Guest sessions with secure random tokens
  - All PII encrypted at rest and in transit
  - Regular security audits and penetration testing

Authentication & Access Control:
  - AxioDB native authentication (email + password)
  - Guest mode with session-based access
  - JWT tokens for authenticated API calls
  - Refresh tokens with secure rotation
  - Rate limiting: 100 requests/minute (guests: 50)
  - Request validation with Zod schemas
  - CSRF protection for state-changing operations

Infrastructure Security:
  - HTTPS everywhere (TLS 1.3)
  - CORS properly configured
  - Security headers (CSP, HSTS, etc.)
  - Regular dependency updates
  - Container security scanning
```

### Compliance Requirements
```yaml
Indian Regulations:
  - IT Act 2000 compliance
  - RBI guidelines for payment processing
  - TRAI regulations for SMS/communication
  - Income Tax Act for financial reporting
  - GST compliance for B2B services

International Standards:
  - GDPR compliance for EU users
  - CCPA compliance for California users  
  - ISO 27001 security standards
  - SOC 2 Type II certification
  - WCAG 2.1 AA accessibility standards
```

---

## 🎯 Optimization Guidelines

### Performance Optimization
```typescript
// 1. API Call Optimization
const optimizationStrategy = {
  caching: {
    static: '24 hours',      // Places, visa requirements
    semiStatic: '1 hour',    // Weather, hotel availability  
    dynamic: '5 minutes',    // Flight prices, currency rates
    realTime: 'no cache'    // Bookings, payments
  },
  
  parallelization: {
    criticalPath: ['destination', 'flights', 'weather'],
    secondary: ['hotels', 'restaurants', 'attractions'],
    optional: ['events', 'shopping', 'nightlife']
  },
  
  fallbackStrategy: {
    primary: 'Amadeus API',
    secondary: 'Skyscanner API', 
    tertiary: 'Cached data',
    emergency: 'Basic card with apology'
  }
};

// 2. Bundle Size Optimization  
const bundleOptimization = {
  codesplitting: 'Route-based + component-based',
  lazyLoading: 'Images, maps, charts, non-critical components',
  treeShaking: 'Remove unused code from all dependencies',
  compression: 'Gzip + Brotli for all text assets'
};
```

### User Experience Optimization
```typescript
// 3. Loading Experience
const loadingStrategy = {
  skeleton: 'Show skeleton UI during API calls',
  progressive: 'Load critical data first, enhance progressively',
  offline: 'Cache essential data for offline viewing',
  feedback: 'Real-time progress indicators with context'
};

// 4. Mobile Optimization
const mobileStrategy = {
  touchTargets: 'Minimum 44px for all interactive elements',
  gestures: 'Swipe for navigation, pinch for zoom',
  performance: 'Target <3s loading on 3G networks',
  offline: 'Essential features work without internet'
};
```

---

## 📞 Support & Documentation

### Developer Resources
```yaml
Documentation:
  - API Reference: OpenAPI 3.0 specification
  - SDK Downloads: Node.js, Python, PHP clients
  - Code Examples: React, Vue, Angular integration guides  
  - Postman Collection: Complete API testing suite
  - Changelog: Detailed version history with breaking changes

Community Support:
  - GitHub Discussions: Public Q&A and feature requests
  - Discord Server: Real-time developer chat
  - Stack Overflow: Tagged questions with official answers
  - YouTube Channel: Video tutorials and demos
  - Blog: Technical articles and case studies
```

### Customer Support
```yaml
Support Channels:
  - In-app Chat: WhatsApp Business API integration
  - Email Support: support@scout.travel (4-hour response)  
  - Phone Support: 1800-XXX-XXXX (Premium users)
  - Knowledge Base: Self-service help articles
  - Video Tutorials: Step-by-step usage guides

SLA Commitments:
  - Free Tier: 48-hour email response
  - Pro Tier: 8-hour email response
  - Enterprise: 2-hour response, dedicated account manager
  - Critical Issues: 1-hour response for paid tiers
```

---

## 🔄 Future Enhancements

### Year 2 Roadmap
```yaml
AI & Machine Learning:
  - Smart destination recommendations based on user history
  - Dynamic pricing predictions for flights and hotels
  - Personalized itinerary generation using ML
  - Image recognition for automatic destination tagging
  - Natural language processing for chat-based planning

Expanded Market:
  - Support for 15+ Indian languages
  - B2B travel management tools
  - Corporate travel policy compliance  
  - Travel agent partnership program
  - White-label solutions for travel companies

Advanced Features:
  - Real-time collaboration for group travel planning
  - Augmented reality for destination exploration
  - Blockchain-based travel credentials
  - Carbon footprint calculation and offsetting
  - Travel insurance claim automation
```

### Innovation Labs
```yaml
Experimental Features:
  - Voice-based travel planning via Alexa/Google
  - VR/AR destination previews
  - Blockchain travel tokens and loyalty programs
  - IoT integration for smart luggage tracking
  - AI travel companion chatbot
```

---

## 📈 Success Measurement

### OKRs (Objectives & Key Results)
```yaml
Q1 2024 Objectives:
  Objective 1: Establish Product-Market Fit
    - KR1: 1000+ monthly active users
    - KR2: 4.5+ app store rating (50+ reviews)
    - KR3: 60%+ user retention after 30 days
    - KR4: 20%+ users create multiple cards

  Objective 2: Achieve Technical Excellence  
    - KR1: <2s average page load time
    - KR2: 99.9% uptime (excluding planned maintenance)
    - KR3: <1% API error rate
    - KR4: Zero critical security vulnerabilities

  Objective 3: Build Sustainable Revenue
    - KR1: ₹5L+ monthly recurring revenue
    - KR2: 15%+ conversion rate from free to paid
    - KR3: 10+ enterprise pilot customers
    - KR4: ₹500+ average revenue per user annually
```

---

## 📋 Quality Checklist

### Pre-Launch Checklist
```yaml
✅ Security:
  - All API endpoints validate inputs with Zod
  - User authentication implemented with NextAuth
  - Rate limiting active on all endpoints  
  - HTTPS enforced everywhere
  - Security headers configured properly

✅ Performance:
  - Lighthouse score >90 on mobile and desktop
  - Core Web Vitals meet Google standards
  - API responses <200ms average
  - Images optimized and compressed
  - Bundle size <500KB initial load

✅ Accessibility:  
  - WCAG 2.1 AA compliance verified
  - Screen reader compatibility tested
  - Keyboard navigation fully functional
  - Color contrast ratios meet standards
  - Alt text for all images provided

✅ Functionality:
  - All user journeys tested end-to-end
  - Error states handled gracefully  
  - Offline functionality working
  - PDF generation producing correct output
  - All API integrations returning expected data

✅ Business:
  - Payment processing tested with real transactions
  - Analytics tracking all critical events
  - Customer support processes documented
  - Legal pages (privacy, terms) reviewed
  - Pricing tiers implemented and tested
```

---

## 🎉 Conclusion

Scout represents a significant opportunity to capture the rapidly growing Indian travel market by providing a uniquely tailored solution. The comprehensive requirements outlined in this document provide a clear roadmap for transforming the current basic prototype into a world-class travel planning assistant.

### Key Success Factors
1. **Indian-First Approach**: Every feature designed for Indian travelers
2. **Speed & Simplicity**: 30-second capture time maintained throughout
3. **Comprehensive Data**: 35+ APIs providing complete travel picture  
4. **Trust & Transparency**: All sources cited, no hidden information
5. **Technical Excellence**: Modern stack with robust security and performance

### Next Steps
1. **Immediate**: Begin Sprint 1 tasks (security fixes, travel-specific forms)
2. **Week 2**: API integration framework and first travel cards
3. **Month 1**: MVP with core features ready for beta testing
4. **Month 3**: Production launch with full feature set
5. **Year 1**: Market leadership in Indian travel planning

With focused execution on these requirements, Scout can become the definitive travel planning tool for India's 50M+ annual travelers.

---

**Document Status**: ✅ Complete  
**Next Review**: After Sprint 1 completion  
**Owner**: Scout Development Team  
**Stakeholders**: Product, Engineering, Design, Business