// RapidAPI Endpoints Configuration
// Centralized management of all RapidAPI services used in Scout Travel

export interface RapidApiEndpoint {
  name: string;
  host: string;
  baseUrl: string;
  purpose: string;
  category: 'images' | 'travel' | 'flights' | 'hotels' | 'weather' | 'currency' | 'location' | 'translation';
  endpoints: {
    [key: string]: {
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      path: string;
      description: string;
      curlExample: string;
      params?: string[];
      rateLimit?: string;
      pricing?: string;
    };
  };
  isActive: boolean;
  alternativeApis?: string[]; // Other APIs that can serve similar purpose
  documentation?: string;
  notes?: string;
}

export const RAPIDAPI_ENDPOINTS: Record<string, RapidApiEndpoint> = {
  // ================== IMAGE SERVICES ==================
  unsplash: {
    name: 'Royalty Free Images Unsplash API',
    host: 'royalty-free-images-unsplesh-api.p.rapidapi.com',
    baseUrl: 'https://royalty-free-images-unsplesh-api.p.rapidapi.com',
    purpose: 'High-quality destination images, travel photography, and UI backgrounds for enhancing visual appeal of travel cards and destinations',
    category: 'images',
    endpoints: {
      getImages: {
        method: 'GET',
        path: '/getImages',
        description: 'Fetch high-quality images by search query with pagination support',
        curlExample: `curl --request GET \\
  --url 'https://royalty-free-images-unsplesh-api.p.rapidapi.com/getImages?query=garden&page=1' \\
  --header 'x-rapidapi-host: royalty-free-images-unsplesh-api.p.rapidapi.com' \\
  --header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY'`,
        params: ['query (required)', 'page (optional, default: 1)', 'per_page (optional, default: 10)'],
        rateLimit: '1000 requests/month (free tier)',
        pricing: 'Free tier available, paid plans for higher limits'
      }
    },
    isActive: true,
    alternativeApis: ['pexels-api', 'pixabay-api'],
    documentation: 'https://rapidapi.com/royalty-free-images-unsplesh-api/api/royalty-free-images-unsplesh-api',
    notes: 'Perfect for destination images, travel photography, and creating visually appealing travel cards'
  },

  pexels: {
    name: 'Pexels API',
    host: 'pexels-api.p.rapidapi.com',
    baseUrl: 'https://pexels-api.p.rapidapi.com',
    purpose: 'Alternative image source for travel destinations, activities, and general photography',
    category: 'images',
    endpoints: {
      searchPhotos: {
        method: 'GET',
        path: '/v1/search',
        description: 'Search for photos by keyword with high-quality results',
        curlExample: `curl --request GET \\
  --url 'https://pexels-api.p.rapidapi.com/v1/search?query=travel&per_page=10' \\
  --header 'x-rapidapi-host: pexels-api.p.rapidapi.com' \\
  --header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY'`,
        params: ['query (required)', 'per_page (optional)', 'page (optional)'],
        rateLimit: '200 requests/hour (free tier)'
      }
    },
    isActive: false, // Backup option
    alternativeApis: ['unsplash', 'pixabay-api'],
    documentation: 'https://rapidapi.com/pexels-api/api/pexels-api'
  },

  // ================== TRAVEL & LOCATION SERVICES ==================
  travelGuide: {
    name: 'Travel Guide & Attractions API',
    host: 'travel-guide-attractions.p.rapidapi.com',
    baseUrl: 'https://travel-guide-attractions.p.rapidapi.com',
    purpose: 'Comprehensive travel information including attractions, activities, and destination guides for travel planning',
    category: 'travel',
    endpoints: {
      getAttractions: {
        method: 'GET',
        path: '/attractions',
        description: 'Get top attractions and points of interest for a destination',
        curlExample: `curl --request GET \\
  --url 'https://travel-guide-attractions.p.rapidapi.com/attractions?location=Paris&limit=20' \\
  --header 'x-rapidapi-host: travel-guide-attractions.p.rapidapi.com' \\
  --header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY'`,
        params: ['location (required)', 'limit (optional)', 'category (optional)'],
        rateLimit: '500 requests/month (free tier)'
      },
      getDestinationInfo: {
        method: 'GET',
        path: '/destination',
        description: 'Get comprehensive destination information including overview, best time to visit, culture',
        curlExample: `curl --request GET \\
  --url 'https://travel-guide-attractions.p.rapidapi.com/destination?city=Tokyo' \\
  --header 'x-rapidapi-host: travel-guide-attractions.p.rapidapi.com' \\
  --header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY'`,
        params: ['city (required)', 'country (optional)']
      }
    },
    isActive: true,
    alternativeApis: ['tripadvisor-api', 'amadeus-travel'],
    documentation: 'https://rapidapi.com/travel-guide-attractions/api/travel-guide-attractions'
  },

  // ================== FLIGHT SERVICES ==================
  flightData: {
    name: 'Flight Data & Search API',
    host: 'flight-data-search.p.rapidapi.com',
    baseUrl: 'https://flight-data-search.p.rapidapi.com',
    purpose: 'Real-time flight prices, schedules, and booking options for travel planning with price comparison',
    category: 'flights',
    endpoints: {
      searchFlights: {
        method: 'GET',
        path: '/search',
        description: 'Search for flights between origin and destination with price and schedule information',
        curlExample: `curl --request GET \\
  --url 'https://flight-data-search.p.rapidapi.com/search?from=DEL&to=NYC&date=2024-12-01&adults=1' \\
  --header 'x-rapidapi-host: flight-data-search.p.rapidapi.com' \\
  --header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY'`,
        params: ['from (required - IATA code)', 'to (required - IATA code)', 'date (required)', 'adults (optional)', 'children (optional)'],
        rateLimit: '1000 requests/month (free tier)',
        pricing: 'Free tier: 1000 requests/month, Paid: Higher limits + booking features'
      },
      getAirports: {
        method: 'GET',
        path: '/airports',
        description: 'Get airport information and IATA codes for flight search',
        curlExample: `curl --request GET \\
  --url 'https://flight-data-search.p.rapidapi.com/airports?query=Delhi' \\
  --header 'x-rapidapi-host: flight-data-search.p.rapidapi.com' \\
  --header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY'`,
        params: ['query (required)', 'country (optional)']
      }
    },
    isActive: true,
    alternativeApis: ['amadeus-flight', 'skyscanner-api'],
    documentation: 'https://rapidapi.com/flight-data-search/api/flight-data-search',
    notes: 'Essential for providing real-time flight information to users'
  },

  // ================== HOTEL SERVICES ==================
  hotelSearch: {
    name: 'Hotel Search & Booking API',
    host: 'hotel-search-booking.p.rapidapi.com',
    baseUrl: 'https://hotel-search-booking.p.rapidapi.com',
    purpose: 'Hotel availability, pricing, and booking information for accommodation recommendations',
    category: 'hotels',
    endpoints: {
      searchHotels: {
        method: 'GET',
        path: '/search',
        description: 'Search for hotels in a destination with pricing and availability',
        curlExample: `curl --request GET \\
  --url 'https://hotel-search-booking.p.rapidapi.com/search?destination=Paris&checkin=2024-12-01&checkout=2024-12-05&adults=2' \\
  --header 'x-rapidapi-host: hotel-search-booking.p.rapidapi.com' \\
  --header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY'`,
        params: ['destination (required)', 'checkin (required)', 'checkout (required)', 'adults (required)', 'children (optional)'],
        rateLimit: '500 requests/month (free tier)'
      },
      getHotelDetails: {
        method: 'GET',
        path: '/hotel/{hotelId}',
        description: 'Get detailed information about a specific hotel including amenities and reviews',
        curlExample: `curl --request GET \\
  --url 'https://hotel-search-booking.p.rapidapi.com/hotel/12345' \\
  --header 'x-rapidapi-host: hotel-search-booking.p.rapidapi.com' \\
  --header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY'`,
        params: ['hotelId (required - in URL path)']
      }
    },
    isActive: true,
    alternativeApis: ['booking-com-api', 'hotels-com-api'],
    documentation: 'https://rapidapi.com/hotel-search-booking/api/hotel-search-booking'
  },

  // ================== WEATHER SERVICES ==================
  weatherApi: {
    name: 'Weather Forecast API',
    host: 'weather-forecast.p.rapidapi.com',
    baseUrl: 'https://weather-forecast.p.rapidapi.com',
    purpose: 'Current weather conditions and forecasts for travel destinations to help users plan accordingly',
    category: 'weather',
    endpoints: {
      getCurrentWeather: {
        method: 'GET',
        path: '/current',
        description: 'Get current weather conditions for a location',
        curlExample: `curl --request GET \\
  --url 'https://weather-forecast.p.rapidapi.com/current?location=Paris' \\
  --header 'x-rapidapi-host: weather-forecast.p.rapidapi.com' \\
  --header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY'`,
        params: ['location (required)', 'units (optional - metric/imperial)'],
        rateLimit: '1000 requests/month (free tier)'
      },
      getForecast: {
        method: 'GET',
        path: '/forecast',
        description: 'Get 7-day weather forecast for travel planning',
        curlExample: `curl --request GET \\
  --url 'https://weather-forecast.p.rapidapi.com/forecast?location=Tokyo&days=7' \\
  --header 'x-rapidapi-host: weather-forecast.p.rapidapi.com' \\
  --header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY'`,
        params: ['location (required)', 'days (optional, default: 7)', 'units (optional)']
      }
    },
    isActive: true,
    alternativeApis: ['openweather-api', 'weatherapi-com'],
    documentation: 'https://rapidapi.com/weather-forecast/api/weather-forecast',
    notes: 'Critical for travel planning - helps users pack appropriately and plan activities'
  },

  // ================== CURRENCY SERVICES ==================
  currencyExchange: {
    name: 'Currency Exchange Rate API',
    host: 'currency-exchange-rates.p.rapidapi.com',
    baseUrl: 'https://currency-exchange-rates.p.rapidapi.com',
    purpose: 'Real-time currency conversion rates for budget planning and cost estimation in local currencies',
    category: 'currency',
    endpoints: {
      getExchangeRates: {
        method: 'GET',
        path: '/latest',
        description: 'Get latest exchange rates for currency conversion',
        curlExample: `curl --request GET \\
  --url 'https://currency-exchange-rates.p.rapidapi.com/latest?base=INR&symbols=USD,EUR,GBP' \\
  --header 'x-rapidapi-host: currency-exchange-rates.p.rapidapi.com' \\
  --header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY'`,
        params: ['base (required - base currency)', 'symbols (optional - target currencies)'],
        rateLimit: '1000 requests/month (free tier)'
      },
      convertCurrency: {
        method: 'GET',
        path: '/convert',
        description: 'Convert amount from one currency to another',
        curlExample: `curl --request GET \\
  --url 'https://currency-exchange-rates.p.rapidapi.com/convert?from=INR&to=USD&amount=1000' \\
  --header 'x-rapidapi-host: currency-exchange-rates.p.rapidapi.com' \\
  --header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY'`,
        params: ['from (required)', 'to (required)', 'amount (required)']
      }
    },
    isActive: true,
    alternativeApis: ['fixer-io', 'exchangerate-api'],
    documentation: 'https://rapidapi.com/currency-exchange-rates/api/currency-exchange-rates',
    notes: 'Essential for showing costs in user preferred currency and budget planning'
  },

  // ================== TRANSLATION SERVICES ==================
  translation: {
    name: 'Language Translation API',
    host: 'translate-text.p.rapidapi.com',
    baseUrl: 'https://translate-text.p.rapidapi.com',
    purpose: 'Multi-language support for travel content and helping users communicate in foreign destinations',
    category: 'translation',
    endpoints: {
      translateText: {
        method: 'POST',
        path: '/translate',
        description: 'Translate text between different languages',
        curlExample: `curl --request POST \\
  --url 'https://translate-text.p.rapidapi.com/translate' \\
  --header 'x-rapidapi-host: translate-text.p.rapidapi.com' \\
  --header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY' \\
  --header 'Content-Type: application/json' \\
  --data '{"text": "Hello world", "from": "en", "to": "fr"}'`,
        params: ['text (required)', 'from (required - source language)', 'to (required - target language)'],
        rateLimit: '500 requests/month (free tier)'
      },
      detectLanguage: {
        method: 'POST',
        path: '/detect',
        description: 'Detect the language of given text',
        curlExample: `curl --request POST \\
  --url 'https://translate-text.p.rapidapi.com/detect' \\
  --header 'x-rapidapi-host: translate-text.p.rapidapi.com' \\
  --header 'x-rapidapi-key: YOUR_RAPIDAPI_KEY' \\
  --header 'Content-Type: application/json' \\
  --data '{"text": "Bonjour le monde"}'`,
        params: ['text (required)']
      }
    },
    isActive: false, // Future feature
    alternativeApis: ['google-translate', 'microsoft-translator'],
    documentation: 'https://rapidapi.com/translate-text/api/translate-text',
    notes: 'Future feature for multilingual support and travel phrase translation'
  }
};

// ================== CONFIGURATION HELPERS ==================

/**
 * Get all active APIs by category
 */
export function getActiveApisByCategory(category: RapidApiEndpoint['category']): RapidApiEndpoint[] {
  return Object.values(RAPIDAPI_ENDPOINTS)
    .filter(api => api.category === category && api.isActive);
}

/**
 * Get API configuration by name
 */
export function getApiConfig(name: string): RapidApiEndpoint | undefined {
  return RAPIDAPI_ENDPOINTS[name];
}

/**
 * Get all active APIs
 */
export function getActiveApis(): Record<string, RapidApiEndpoint> {
  return Object.fromEntries(
    Object.entries(RAPIDAPI_ENDPOINTS).filter(([_, api]) => api.isActive)
  );
}

/**
 * Get common headers for RapidAPI requests
 */
export function getRapidApiHeaders(host: string): Record<string, string> {
  const apiKey = process.env.X_RapidAPI_Key;
  
  if (!apiKey) {
    console.warn('X_RapidAPI_Key not found in environment variables');
  }

  return {
    'x-rapidapi-host': host,
    'x-rapidapi-key': apiKey || '',
    'Content-Type': 'application/json'
  };
}

/**
 * Build full URL for an API endpoint
 */
export function buildApiUrl(apiName: string, endpointName: string, params?: Record<string, string>): string {
  const api = RAPIDAPI_ENDPOINTS[apiName];
  if (!api) {
    throw new Error(`API '${apiName}' not found in configuration`);
  }

  const endpoint = api.endpoints[endpointName];
  if (!endpoint) {
    throw new Error(`Endpoint '${endpointName}' not found in API '${apiName}'`);
  }

  let url = `${api.baseUrl}${endpoint.path}`;
  
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  return url;
}

/**
 * Get alternative APIs for a given API
 */
export function getAlternativeApis(apiName: string): string[] {
  const api = RAPIDAPI_ENDPOINTS[apiName];
  return api?.alternativeApis || [];
}

/**
 * Validate API configuration
 */
export function validateApiConfig(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if RapidAPI key is available
  if (!process.env.X_RapidAPI_Key) {
    errors.push('X_RapidAPI_Key environment variable is not set');
  }

  // Check for active APIs in each category
  const categories = ['images', 'travel', 'flights', 'hotels', 'weather', 'currency'] as const;
  
  categories.forEach(category => {
    const activeApis = getActiveApisByCategory(category);
    if (activeApis.length === 0) {
      warnings.push(`No active APIs found for category: ${category}`);
    }
  });

  // Check for broken configurations
  Object.entries(RAPIDAPI_ENDPOINTS).forEach(([name, api]) => {
    if (!api.host || !api.baseUrl) {
      errors.push(`API '${name}' has missing host or baseUrl`);
    }
    
    if (Object.keys(api.endpoints).length === 0) {
      warnings.push(`API '${name}' has no defined endpoints`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// Export the configuration
export default RAPIDAPI_ENDPOINTS;