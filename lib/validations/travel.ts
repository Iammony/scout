import { z } from 'zod';

// Step 1: Travel Type Validation
export const TravelTypeStepSchema = z.object({
  travelType: z.enum(['single', 'family', 'group']),
  groupSubType: z.enum(['individuals', 'families']).optional(),
});

// Step 2: Traveler Details Validation
export const TravelerDetailsStepSchema = z.object({
  // For Single
  travelerAge: z.number().min(1).max(120).optional(),
  
  // For Family
  familyMembers: z.object({
    adults: z.number().min(1).max(20),
    children: z.number().min(0).max(10),
    childrenAges: z.array(z.number().min(0).max(17)).optional(),
    seniors: z.number().min(0).max(10).optional(),
  }).optional(),
  
  // For Group
  groupSize: z.number().min(3).max(50).optional(),
  groupComposition: z.enum(['friends', 'colleagues', 'mixed']).optional(),
  groupFamilies: z.number().min(2).max(20).optional(),
}).refine(
  (data) => {
    // At least one field should be present
    return data.travelerAge !== undefined || 
           data.familyMembers !== undefined || 
           data.groupSize !== undefined;
  },
  {
    message: "Traveler details are required",
  }
);

// Step 3: Destination & Timing Validation
export const DestinationStepSchema = z.object({
  destination: z.string().min(2).max(100),
  origin: z.string().min(2).max(100),
  motivation: z.string().min(3).max(500),
  season: z.enum(['Winter', 'Summer', 'Monsoon', 'Flexible']),
  duration: z.enum(['2-3', '5-7', '10-14', 'Flexible']),
});

// Step 4: Preferences & Budget Validation
export const PreferencesStepSchema = z.object({
  budget: z.enum(['Tight', 'Comfortable', 'Luxury']),
  budgetPerPerson: z.boolean().optional(),
  dietary: z.enum(['Veg', 'Non-veg', 'Jain', 'Halal', 'Flexible']),
  travelStyle: z.enum(['Adventure', 'Leisure', 'Business', 'Pilgrimage', 'Educational']),
  specialRequirements: z.array(z.string().max(200)).max(10).optional(),
});

// Complete Travel Capture Validation
export const TravelCaptureInputSchema = z.object({
  // User Mode
  isGuest: z.boolean(),
  sessionId: z.string().uuid().optional(),
  userId: z.string().optional(),
  
  // Combined from all steps
  travelType: z.enum(['single', 'family', 'group']),
  groupSubType: z.enum(['individuals', 'families']).optional(),
  travelerDetails: TravelerDetailsStepSchema,
  destination: z.string().min(2).max(100),
  origin: z.string().min(2).max(100),
  motivation: z.string().min(3).max(500),
  season: z.enum(['Winter', 'Summer', 'Monsoon', 'Flexible']),
  duration: z.enum(['2-3', '5-7', '10-14', 'Flexible']),
  budget: z.enum(['Tight', 'Comfortable', 'Luxury']),
  budgetPerPerson: z.boolean().optional(),
  dietary: z.enum(['Veg', 'Non-veg', 'Jain', 'Halal', 'Flexible']),
  travelStyle: z.enum(['Adventure', 'Leisure', 'Business', 'Pilgrimage', 'Educational']),
  specialRequirements: z.array(z.string().max(200)).max(10).optional(),
}).refine(
  (data) => {
    // Group type requires group sub-type
    if (data.travelType === 'group' && !data.groupSubType) {
      return false;
    }
    
    // Family type requires family members
    if (data.travelType === 'family' && !data.travelerDetails.familyMembers) {
      return false;
    }
    
    // Group type requires group size
    if (data.travelType === 'group' && !data.travelerDetails.groupSize) {
      return false;
    }
    
    // Single type requires traveler age
    if (data.travelType === 'single' && !data.travelerDetails.travelerAge) {
      return false;
    }
    
    return true;
  },
  {
    message: "Invalid traveler details for selected travel type",
  }
);

// Guest Session Validation
export const GuestSessionSchema = z.object({
  sessionId: z.string().uuid(),
  createdAt: z.date(),
  expiresAt: z.date(),
  cardsCreated: z.number().min(0),
  lastActivity: z.date(),
});

// API Response Validation (for external API data)
export const FlightInfoSchema = z.object({
  airline: z.string(),
  price: z.number().positive(),
  duration: z.string(),
  stops: z.number().min(0),
  departure: z.string(),
  arrival: z.string(),
  bookingLink: z.string().url().optional(),
});

export const HotelInfoSchema = z.object({
  name: z.string(),
  rating: z.number().min(0).max(5),
  pricePerNight: z.number().positive(),
  location: z.string(),
  amenities: z.array(z.string()),
  images: z.array(z.string().url()).optional(),
  bookingLink: z.string().url().optional(),
});

export const AttractionInfoSchema = z.object({
  name: z.string(),
  type: z.string(),
  entryFee: z.number().min(0),
  openingHours: z.string(),
  description: z.string(),
  rating: z.number().min(0).max(5),
  timeNeeded: z.string(),
  bookingRequired: z.boolean(),
  bookingLink: z.string().url().optional(),
});

export const WeatherInfoSchema = z.object({
  current: z.object({
    temperature: z.number(),
    condition: z.string(),
    humidity: z.number().min(0).max(100),
  }),
  forecast: z.array(z.object({
    date: z.string(),
    high: z.number(),
    low: z.number(),
    condition: z.string(),
    rainChance: z.number().min(0).max(100),
  })),
  bestMonths: z.array(z.string()),
  avoidMonths: z.array(z.string()),
});

// Validation helper functions
export function validateStep1(data: unknown) {
  return TravelTypeStepSchema.safeParse(data);
}

export function validateStep2(data: unknown, travelType: string) {
  const result = TravelerDetailsStepSchema.safeParse(data);
  
  if (!result.success) {
    return result;
  }
  
  // Additional validation based on travel type
  if (travelType === 'single' && !result.data.travelerAge) {
    return {
      success: false,
      error: { message: 'Traveler age is required for single travel' }
    };
  }
  
  if (travelType === 'family' && !result.data.familyMembers) {
    return {
      success: false,
      error: { message: 'Family member details are required for family travel' }
    };
  }
  
  if (travelType === 'group' && !result.data.groupSize) {
    return {
      success: false,
      error: { message: 'Group size is required for group travel' }
    };
  }
  
  return result;
}

export function validateStep3(data: unknown) {
  return DestinationStepSchema.safeParse(data);
}

export function validateStep4(data: unknown) {
  return PreferencesStepSchema.safeParse(data);
}

export function validateCompleteTravelInput(data: unknown) {
  return TravelCaptureInputSchema.safeParse(data);
}