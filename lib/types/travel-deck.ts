// Travel Deck Type Definitions
import { TravelDeckType } from '@/lib/api/openrouter-config';
import { UnsplashImage } from '@/lib/api/unsplash';

// Base content metadata
export interface ContentMetadata {
  confidence?: number;
  dataSource?: 'api' | 'llm_enhanced' | 'llm_generated';
  model?: string;
  processingTime?: number;
  qualityIndicators?: {
    completeness: number;
    accuracy: number;
    relevance: number;
    actionability: number;
  };
}

// Base card interface
export interface TravelCard {
  id: string;
  type: TravelDeckType;
  title: string;
  subtitle?: string;
  content: any; // Specific content based on card type
  priority: number; // For ordering cards
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  images?: {
    hero?: UnsplashImage;
    gallery?: UnsplashImage[];
    background?: UnsplashImage;
  };
}

// Trip Summary Card
export interface TripSummaryCard extends TravelCard {
  type: 'trip-summary';
  content: {
    destination: string;
    country: string;
    duration: string;
    travelType: string;
    highlights: string[];
    totalBudget: {
      formatted: string;
      formattedPerPerson: string;
    };
    budgetBreakdown: {
      flights: { formatted: string };
      accommodation: { formatted: string; perNight: string };
      dailyExpenses: { formatted: string; perDay: string };
    };
    quickTips: string[];
    bestTime: string;
    currency: string;
    languages: string[];
    weatherHint: string;
    isDomestic: boolean;
    _metadata?: ContentMetadata;
  };
}

// Itinerary Card
export interface ItineraryCard extends TravelCard {
  type: 'itinerary';
  content: {
    days: Array<{
      day: number;
      date?: string;
      title: string;
      activities: Array<{
        time: string;
        activity: string;
        location: string;
        duration?: string;
        cost?: number;
        bookingRequired?: boolean;
        notes?: string;
      }>;
      meals?: Array<{
        type: 'breakfast' | 'lunch' | 'dinner';
        restaurant?: string;
        cuisine?: string;
        cost?: number;
      }>;
      accommodation?: {
        name: string;
        checkIn?: string;
        checkOut?: string;
      };
    }>;
    _metadata?: ContentMetadata;
  };
}

// Transport Card
export interface TransportCard extends TravelCard {
  type: 'transport';
  content: {
    flights?: Array<{
      airline: string;
      flightNumber?: string;
      from: string;
      to: string;
      departure: string;
      arrival: string;
      duration: string;
      class?: string;
      price: number;
      status?: string;
      bookingRef?: string;
    }>;
    trains?: Array<{
      trainNumber: string;
      trainName: string;
      from: string;
      to: string;
      departure: string;
      arrival: string;
      class: string;
      price: number;
      platform?: string;
    }>;
    localTransport?: Array<{
      type: string;
      description: string;
      cost: number;
      tips: string[];
    }>;
    transfers?: Array<{
      from: string;
      to: string;
      method: string;
      duration: string;
      cost: number;
    }>;
    _metadata?: ContentMetadata;
  };
}

// Accommodation Card
export interface AccommodationCard extends TravelCard {
  type: 'accommodation';
  content: {
    hotels: Array<{
      name: string;
      rating: number;
      category: 'budget' | 'mid-range' | 'luxury';
      location: string;
      checkIn: string;
      checkOut: string;
      nights: number;
      roomType: string;
      pricePerNight: number;
      totalPrice: number;
      amenities: string[];
      breakfast?: boolean;
      cancellation?: string;
      contact?: string;
      address?: string;
      bookingRef?: string;
    }>;
    totalCost: number;
    alternativeOptions?: Array<{
      name: string;
      type: string;
      priceRange: string;
    }>;
    _metadata?: ContentMetadata;
  };
}

// Attractions Card
export interface AttractionsCard extends TravelCard {
  type: 'attractions';
  content: {
    mustSee: Array<{
      name: string;
      type: string;
      description: string;
      location: string;
      openingHours: string;
      entryFee: number;
      timeNeeded: string;
      bestTimeToVisit: string;
      bookingRequired: boolean;
      tips?: string[];
    }>;
    activities: Array<{
      name: string;
      type: string;
      duration: string;
      cost: number;
      provider?: string;
      includesTransport?: boolean;
      groupSize?: string;
    }>;
    hiddenGems?: Array<{
      name: string;
      description: string;
      whySpecial: string;
    }>;
    _metadata?: ContentMetadata;
  };
}

// Dining Card
export interface DiningCard extends TravelCard {
  type: 'dining';
  content: {
    restaurants: Array<{
      name: string;
      cuisine: string;
      category: 'street-food' | 'casual' | 'fine-dining';
      location: string;
      priceRange: string;
      vegetarian: boolean;
      veganOptions: boolean;
      specialties: string[];
      rating?: number;
      reservationRequired?: boolean;
      openingHours?: string;
    }>;
    localDishes: Array<{
      name: string;
      description: string;
      whereToTry: string[];
      vegetarian: boolean;
      spiceLevel?: 'mild' | 'medium' | 'hot';
    }>;
    foodMarkets?: Array<{
      name: string;
      location: string;
      bestTime: string;
      mustTry: string[];
    }>;
    dietaryTips: string[];
    _metadata?: ContentMetadata;
  };
}

// Budget Card
export interface BudgetCard extends TravelCard {
  type: 'budget';
  content: {
    currency: string;
    exchangeRate?: number;
    totalBudget: {
      tight: number;
      comfortable: number;
      luxury: number;
    };
    perPerson: {
      tight: number;
      comfortable: number;
      luxury: number;
    };
    breakdown: {
      accommodation: number;
      transportation: number;
      food: number;
      attractions: number;
      shopping: number;
      miscellaneous: number;
    };
    dailyAverage: number;
    savingTips: string[];
    paymentMethods: string[];
    tippingGuide?: string;
    _metadata?: ContentMetadata;
  };
}

// Visa Card
export interface VisaCard extends TravelCard {
  type: 'visa';
  content: {
    required: boolean;
    type?: string;
    validity?: string;
    processingTime?: string;
    cost?: number;
    documents?: string[];
    applicationProcess?: string[];
    onArrival?: boolean;
    eVisa?: boolean;
    embassyAddress?: string;
    embassyContact?: string;
    website?: string;
    additionalRequirements?: string[];
    tips?: string[];
    _metadata?: ContentMetadata;
  };
}

// Weather Card
export interface WeatherCard extends TravelCard {
  type: 'weather';
  content: {
    current?: {
      temperature: number;
      condition: string;
      humidity: number;
      feelsLike?: number;
    };
    forecast?: Array<{
      date: string;
      high: number;
      low: number;
      condition: string;
      rainChance: number;
    }>;
    seasonal: {
      bestMonths: string[];
      avoidMonths: string[];
      currentSeason: string;
      seasonDescription: string;
    };
    packingList: {
      clothing: string[];
      accessories: string[];
      essentials: string[];
      optional: string[];
    };
    _metadata?: ContentMetadata;
  };
}

// Culture Card
export interface CultureCard extends TravelCard {
  type: 'culture';
  content: {
    overview: string;
    customs: Array<{
      category: string;
      description: string;
      importance: 'low' | 'medium' | 'high';
    }>;
    etiquette: {
      dos: string[];
      donts: string[];
    };
    language: {
      officialLanguages: string[];
      commonPhrases: Array<{
        phrase: string;
        translation: string;
        pronunciation?: string;
      }>;
      englishProficiency: string;
    };
    religion?: {
      major: string[];
      considerations: string[];
    };
    festivals?: Array<{
      name: string;
      date: string;
      description: string;
    }>;
    dressCode?: string[];
    _metadata?: ContentMetadata;
  };
}

// Emergency Card
export interface EmergencyCard extends TravelCard {
  type: 'emergency';
  content: {
    emergencyNumbers: Array<{
      service: string;
      number: string;
      description?: string;
    }>;
    embassy: {
      name: string;
      address: string;
      phone: string;
      email?: string;
      website?: string;
      emergencyHotline?: string;
    };
    hospitals: Array<{
      name: string;
      address: string;
      phone: string;
      type: string;
      englishSpeaking?: boolean;
    }>;
    safety: {
      overallSafety: 'very-safe' | 'safe' | 'moderate' | 'caution';
      tips: string[];
      areasToAvoid?: string[];
      commonScams?: string[];
    };
    insurance: {
      recommended: boolean;
      coverage: string[];
      providers?: string[];
    };
    _metadata?: ContentMetadata;
  };
}

// Shopping Card
export interface ShoppingCard extends TravelCard {
  type: 'shopping';
  content: {
    markets: Array<{
      name: string;
      type: string;
      location: string;
      openingHours: string;
      specialties: string[];
      bargaining: boolean;
      paymentMethods: string[];
    }>;
    souvenirs: Array<{
      item: string;
      description: string;
      priceRange: string;
      whereToBuy: string[];
      authentic: boolean;
    }>;
    malls?: Array<{
      name: string;
      location: string;
      brands: string[];
      priceLevel: string;
    }>;
    customsLimits?: {
      dutyFree: string[];
      restricted: string[];
      prohibited: string[];
    };
    tips: string[];
    _metadata?: ContentMetadata;
  };
}

// Union type for all card types
export type TravelDeckCard = 
  | TripSummaryCard
  | ItineraryCard
  | TransportCard
  | AccommodationCard
  | AttractionsCard
  | DiningCard
  | BudgetCard
  | VisaCard
  | WeatherCard
  | CultureCard
  | EmergencyCard
  | ShoppingCard;

// Complete Travel Deck
export interface TravelDeck {
  id: string;
  userId?: string;
  sessionId?: string;
  destination: string;
  origin: string;
  createdAt: string;
  updatedAt: string;
  cards: TravelDeckCard[];
  metadata: {
    travelType: string;
    duration: string;
    budget: string;
    travelerCount: number;
    generatedBy: string;
    version: string;
    processingTime?: number;
    contentStrategy?: string;
    qualityMetrics?: any;
    apiDataSources?: string[];
    averageConfidence?: number;
  };
}