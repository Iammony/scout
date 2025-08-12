// Travel Planning Type Definitions
// Journey-style multi-step form interfaces

// Step 1: Travel Type Selection
export type TravelType = 'single' | 'family' | 'group';
export type GroupSubType = 'individuals' | 'families';

export interface TravelTypeStep {
  travelType: TravelType;
  groupSubType?: GroupSubType;
}

// Step 2: Traveler Details
export interface TravelerDetailsStep {
  // For Single
  travelerAge?: number;
  
  // For Family
  familyMembers?: {
    adults: number;
    children: number;
    childrenAges?: number[];
    seniors?: number; // 60+ for special considerations
  };
  
  // For Group
  groupSize?: number;
  groupComposition?: 'friends' | 'colleagues' | 'mixed';
  groupFamilies?: number; // If groupSubType is 'families'
}

// Step 3: Destination & Timing
export type Season = 'Winter' | 'Summer' | 'Monsoon' | 'Flexible';
export type Duration = '2-3' | '5-7' | '10-14' | 'Flexible';

export interface DestinationStep {
  destination: string;
  origin: string;
  motivation: string;
  season: Season;
  duration: Duration;
  detectedFromImage?: boolean;
  capturedImage?: string;
  imageConfidence?: number;
}

// Step 4: Preferences & Budget
export type Budget = 'Tight' | 'Comfortable' | 'Luxury';
export type Dietary = 'Veg' | 'Non-veg' | 'Jain' | 'Halal' | 'Flexible';
export type TravelStyle = 'Adventure' | 'Leisure' | 'Business' | 'Pilgrimage' | 'Educational';

export interface PreferencesStep {
  budget: Budget;
  budgetPerPerson?: boolean;
  dietary: Dietary;
  travelStyle: TravelStyle;
  specialRequirements?: string[];
}

// Complete Travel Capture Input
export interface TravelCaptureInput {
  // User Mode
  isGuest: boolean;
  sessionId?: string;
  userId?: string;
  
  // Combined from all steps
  travelType: TravelType;
  groupSubType?: GroupSubType;
  travelerDetails: TravelerDetailsStep;
  destination: string;
  origin: string;
  motivation: string;
  season: Season;
  duration: Duration;
  budget: Budget;
  budgetPerPerson?: boolean;
  dietary: Dietary;
  travelStyle: TravelStyle;
  specialRequirements?: string[];
}

// Form State Management
export interface JourneyFormState {
  currentStep: 1 | 2 | 3 | 4 | 5;
  completedSteps: number[];
  data: {
    step1?: TravelTypeStep;
    step2?: TravelerDetailsStep;
    step3?: DestinationStep;
    step4?: PreferencesStep;
  };
  isValid: boolean;
}

// Guest Session
export interface GuestSession {
  sessionId: string;
  createdAt: Date;
  expiresAt: Date;
  cardsCreated: number;
  lastActivity: Date;
}

// Travel Card Response
export interface TravelCard {
  id: string;
  userId?: string;
  sessionId?: string;
  isGuestCard: boolean;
  travelType: TravelType;
  destination: string;
  origin: string;
  cardData: TravelCardData;
  createdAt: Date;
  expiresAt?: Date;
  shareToken?: string;
  isPublic?: boolean; // Whether card is public
  publicMetadata?: PublicCardMetadata; // Metadata for public display
}

// Public card metadata for display
export interface PublicCardMetadata {
  title: string; // User-defined title for the card
  description?: string; // Optional description
  createdBy: string; // Username of creator
  createdByUserId: string; // User ID for reference
  tags: string[]; // Tags for categorization
  likes: number; // Number of likes
  views: number; // Number of views
  featured: boolean; // Whether card is featured
  publishedAt: Date; // When card was made public
}

// Public card display interface
export interface PublicTravelCard {
  id: string;
  title: string;
  description?: string;
  destination: string;
  origin: string;
  travelType: TravelType;
  duration: string;
  budget: Budget;
  tags: string[];
  createdBy: string;
  createdByUserId: string;
  likes: number;
  views: number;
  featured: boolean;
  publishedAt: Date;
  thumbnail?: string; // Generated thumbnail
  preview: {
    highlights: string[];
    totalCost: number;
    currency: string;
  };
}

export interface TravelCardData {
  overview: {
    destination: string;
    country: string;
    famousFor: string[];
    bestTime: string;
    currency: string;
    language: string[];
  };
  
  transportation: {
    flights?: FlightInfo[];
    trains?: TrainInfo[];
    buses?: BusInfo[];
  };
  
  accommodation: {
    hotels: HotelInfo[];
    airbnb?: AirbnbInfo[];
    hostels?: HostelInfo[];
  };
  
  attractions: AttractionInfo[];
  
  dining: {
    restaurants: RestaurantInfo[];
    indianRestaurants: RestaurantInfo[];
    vegetarianOptions: boolean;
  };
  
  budget: BudgetBreakdown;
  
  weather: WeatherInfo;
  
  visaInfo?: VisaRequirements;
  
  indianTravelerInfo: {
    upiAcceptance: boolean;
    indianBankCards: string[];
    simCardOptions: string[];
    embassyContact?: string;
    emergencyNumbers: string[];
    culturalTips: string[];
  };
  
  itineraries: Itinerary[];
  
  bookingLinks: {
    flights?: string[];
    hotels?: string[];
    attractions?: string[];
  };
}

// Sub-interfaces for Travel Card Data
export interface FlightInfo {
  airline: string;
  price: number;
  duration: string;
  stops: number;
  departure: string;
  arrival: string;
  bookingLink?: string;
}

export interface TrainInfo {
  trainNumber: string;
  trainName: string;
  class: string;
  price: number;
  duration: string;
  departure: string;
  arrival: string;
  availability?: string;
}

export interface BusInfo {
  operator: string;
  busType: string;
  price: number;
  duration: string;
  departure: string;
  arrival: string;
}

export interface HotelInfo {
  name: string;
  rating: number;
  pricePerNight: number;
  location: string;
  amenities: string[];
  images?: string[];
  bookingLink?: string;
}

export interface AirbnbInfo {
  title: string;
  type: string;
  pricePerNight: number;
  rating: number;
  location: string;
  amenities: string[];
  hostInfo: string;
  bookingLink?: string;
}

export interface HostelInfo {
  name: string;
  pricePerBed: number;
  rating: number;
  location: string;
  facilities: string[];
}

export interface AttractionInfo {
  name: string;
  type: string;
  entryFee: number;
  openingHours: string;
  description: string;
  rating: number;
  timeNeeded: string;
  bookingRequired: boolean;
  bookingLink?: string;
}

export interface RestaurantInfo {
  name: string;
  cuisine: string;
  priceRange: string;
  rating: number;
  location: string;
  vegetarian: boolean;
  specialties: string[];
}

export interface BudgetBreakdown {
  perPerson: {
    tight: number;
    comfortable: number;
    luxury: number;
  };
  total: {
    tight: number;
    comfortable: number;
    luxury: number;
  };
  breakdown: {
    accommodation: number;
    transportation: number;
    food: number;
    attractions: number;
    miscellaneous: number;
  };
  currency: string;
}

export interface WeatherInfo {
  current: {
    temperature: number;
    condition: string;
    humidity: number;
  };
  forecast: Array<{
    date: string;
    high: number;
    low: number;
    condition: string;
    rainChance: number;
  }>;
  bestMonths: string[];
  avoidMonths: string[];
}

export interface VisaRequirements {
  required: boolean;
  type: string;
  duration: string;
  cost: number;
  processingTime: string;
  documents: string[];
  embassyAddress: string;
  onArrival: boolean;
  eVisa: boolean;
  notes: string;
}

export interface Itinerary {
  duration: string;
  title: string;
  days: Array<{
    day: number;
    title: string;
    activities: Array<{
      time: string;
      activity: string;
      location: string;
      cost?: number;
      notes?: string;
    }>;
  }>;
}