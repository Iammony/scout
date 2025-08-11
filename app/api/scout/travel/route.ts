import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { validateCompleteTravelInput } from '@/lib/validations/travel';
import { rapidAPIClient } from '@/lib/api/rapidapi';
import { openRouterClient } from '@/lib/api/openrouter';
import { TravelCaptureInput } from '@/lib/types/travel';
import { travelDeckGenerator } from '@/lib/api/travel-deck-generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the travel input
    const validation = validateCompleteTravelInput(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid travel data',
          details: validation.error?.issues 
        },
        { status: 400 }
      );
    }

    const travelInput: TravelCaptureInput = validation.data;
    console.log('Creating travel card for:', {
      destination: travelInput.destination,
      origin: travelInput.origin,
      travelType: travelInput.travelType,
      isGuest: travelInput.isGuest
    });

    // Generate unique card ID
    const cardId = `card_${uuidv4()}`;
    
    // Create basic card structure first (for immediate response)
    const basicCard = {
      id: cardId,
      destination: travelInput.destination,
      origin: travelInput.origin,
      travelType: travelInput.travelType,
      isGuest: travelInput.isGuest,
      sessionId: travelInput.sessionId,
      createdAt: new Date().toISOString(),
      status: 'processing'
    };

    // Start background data fetching (don't await - return immediately)
    fetchTravelDataAsync(travelInput, cardId).catch(error => {
      console.error('Background data fetching failed:', error);
    });

    // Return immediate success response
    return NextResponse.json({
      success: true,
      cardId: cardId,
      message: 'Travel card creation started',
      data: basicCard
    });

  } catch (error) {
    console.error('Travel card creation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create travel card',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Background function to fetch comprehensive travel data
async function fetchTravelDataAsync(travelInput: TravelCaptureInput, cardId: string) {
  try {
    console.log(`[${cardId}] Starting background data fetching...`);
    
    // Step 1: Fetch raw travel data from RapidAPI
    const travelData = await rapidAPIClient.getTravelData(travelInput);
    
    console.log(`[${cardId}] RapidAPI data fetched:`, {
      hasTravelGuide: !!travelData.travelGuide,
      hasFlights: !!travelData.flights,
      hasHotels: !!travelData.hotels,
      hasTrains: !!travelData.trains,
      hasVisa: !!travelData.visa,
      hasInterests: !!travelData.interests,
      isDomestic: travelData.isDomestic,
      travelerCount: travelData.travelerCount,
      errors: travelData.errors?.length || 0
    });

    // Step 2: Generate enhanced content using OpenRouter LLM
    console.log(`[${cardId}] Generating enhanced content with OpenRouter...`);
    
    const llmInput = {
      ...travelInput,
      rawApiData: {
        travelGuide: travelData.travelGuide,
        flights: travelData.flights,
        hotels: travelData.hotels,
        trains: travelData.trains,
        visa: travelData.visa,
        interests: travelData.interests
      }
    };

    // Generate comprehensive travel card using LLM
    const enhancedContent = await generateEnhancedTravelCard(llmInput, cardId);
    
    // Step 3: Combine API data with LLM-enhanced content
    const processedCard = {
      id: cardId,
      ...travelInput,
      cardData: enhancedContent,
      llmGenerated: openRouterClient.isConfigured(),
      llmModel: openRouterClient.isConfigured() ? 'anthropic/claude-3.5-sonnet' : 'mock-data',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'completed'
    };

    // Store the completed card (in a real app, this would go to database)
    console.log(`[${cardId}] Travel card processing completed successfully`);
    
    // Here you would typically:
    // 1. Save to database
    // 2. Send real-time update to user (WebSocket/SSE)
    // 3. Cache for quick retrieval
    
    return processedCard;

  } catch (error) {
    console.error(`[${cardId}] Background processing failed:`, error);
    
    // Update card status to failed
    // In a real app, you'd update the database and notify the user
    return null;
  }
}

// Generate enhanced travel card using OpenRouter LLM
async function generateEnhancedTravelCard(input: any, cardId: string): Promise<any> {
  const isDomestic = isDomesticTravel(input.origin, input.destination);
  
  const systemPrompt = `You are an expert travel planner specializing in creating comprehensive travel cards for Indian travelers. 

CRITICAL REQUIREMENTS:
1. All prices MUST be in Indian Rupees (₹)
2. Focus on Indian traveler needs (visa for Indian passport, vegetarian food, UPI acceptance)
3. Provide 3 budget tiers: Tight (budget), Comfortable (mid-range), Luxury (premium)
4. Include Indian restaurant options and dietary considerations
5. Return ONLY valid JSON, no markdown or additional text
6. Be specific and accurate with practical information

TRAVEL CONTEXT:
- Origin: ${input.origin}  
- Destination: ${input.destination}
- Travel Type: ${input.travelType}
- Duration: ${input.duration} days
- Budget Preference: ${input.budget}
- Dietary: ${input.dietary}
- Travel Style: ${input.travelStyle}
- Domestic Travel: ${isDomestic ? 'Yes (within India)' : 'No (international)'}

${input.rawApiData ? `RAW API DATA FOR REFERENCE:
Travel Guide: ${JSON.stringify(input.rawApiData.travelGuide)}
Flights: ${JSON.stringify(input.rawApiData.flights)}
Hotels: ${JSON.stringify(input.rawApiData.hotels)}
Trains: ${JSON.stringify(input.rawApiData.trains)}
Visa: ${JSON.stringify(input.rawApiData.visa)}
Interests: ${JSON.stringify(input.rawApiData.interests)}` : ''}`;

  const userPrompt = `Create a comprehensive travel card with the following JSON structure:

{
  "overview": {
    "destination": "${input.destination}",
    "country": "country name",
    "famousFor": ["attraction1", "attraction2", "attraction3"],
    "bestTime": "season description",
    "currency": "currency code",
    "languages": ["language1", "language2"]
  },
  "transportation": {
    "flights": [
      {
        "airline": "name",
        "price": rupee_amount,
        "duration": "duration",
        "stops": number,
        "departure": "time",
        "arrival": "time",
        "route": "routing details"
      }
    ],
    ${isDomestic ? '"trains": [{"trainNumber": "number", "trainName": "name", "class": "class", "price": rupee_amount, "duration": "duration", "departure": "time", "arrival": "time"}],' : ''}
    ${isDomestic ? '"buses": [{"operator": "name", "busType": "type", "price": rupee_amount, "duration": "duration", "departure": "time", "arrival": "time"}]' : ''}
  },
  "accommodation": {
    "hotels": [
      {
        "name": "hotel name",
        "rating": rating_number,
        "pricePerNight": rupee_amount,
        "location": "area",
        "amenities": ["amenity1", "amenity2"],
        "category": "budget/mid-range/luxury"
      }
    ]
  },
  "attractions": [
    {
      "name": "attraction name",
      "type": "type",
      "entryFee": rupee_amount,
      "openingHours": "hours",
      "description": "description",
      "rating": rating,
      "timeNeeded": "time needed",
      "bestTimeToVisit": "timing"
    }
  ],
  "dining": {
    "indianRestaurants": [
      {
        "name": "restaurant name",
        "cuisine": "North Indian/South Indian/etc",
        "priceRange": "budget/mid-range/expensive",
        "rating": rating,
        "location": "area",
        "vegetarian": true/false,
        "specialties": ["dish1", "dish2"]
      }
    ],
    "localCuisine": [
      {
        "name": "local restaurant",
        "cuisine": "local cuisine type",
        "priceRange": "price range",
        "vegetarianOptions": true/false,
        "mustTry": ["dish1", "dish2"]
      }
    ]
  },
  "budget": {
    "perPerson": {
      "tight": rupee_amount,
      "comfortable": rupee_amount,
      "luxury": rupee_amount
    },
    "breakdown": {
      "accommodation": rupee_amount,
      "transportation": rupee_amount,
      "food": rupee_amount,
      "attractions": rupee_amount,
      "shopping": rupee_amount,
      "miscellaneous": rupee_amount
    },
    "currency": "INR"
  },
  "weather": {
    "current": {
      "temperature": temperature,
      "condition": "condition",
      "humidity": percentage
    },
    "bestMonths": ["month1", "month2"],
    "avoidMonths": ["month1", "month2"],
    "packingTips": ["tip1", "tip2"]
  },
  ${!isDomestic ? '"visaInfo": {"required": true/false, "type": "visa type", "duration": "duration", "cost": rupee_amount, "processingTime": "time", "documents": ["doc1", "doc2"], "embassyAddress": "address"},' : ''}
  "indianTravelerInfo": {
    "upiAcceptance": true/false,
    "indianBankCards": ["accepted cards"],
    "simCardOptions": ["option1", "option2"],
    ${!isDomestic ? '"embassyContact": "embassy contact details",' : ''}
    "emergencyNumbers": ["number1", "number2"],
    "culturalTips": ["tip1", "tip2"],
    "languageBarrier": "low/medium/high",
    "timeZone": "timezone info"
  },
  "itineraries": [
    {
      "duration": "${input.duration} days",
      "title": "Recommended Itinerary",
      "days": [
        {
          "day": 1,
          "title": "day title",
          "activities": [
            {
              "time": "time",
              "activity": "activity description",
              "location": "location",
              "cost": rupee_amount,
              "notes": "additional notes"
            }
          ]
        }
      ]
    }
  ],
  "practicalInfo": {
    "bestWayToBook": ["platform1", "platform2"],
    "seasonalOffers": "seasonal information",
    "localTransport": ["option1", "option2"],
    "safetyTips": ["tip1", "tip2"],
    "budgetSavingTips": ["tip1", "tip2"]
  }
}

IMPORTANT: Return only the JSON object, no additional text or formatting.`;

  try {
    console.log(`[${cardId}] Calling OpenRouter for content generation...`);
    
    const response = await openRouterClient.generateContent([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      model: 'anthropic/claude-3.5-sonnet',
      temperature: 0.7,
      maxTokens: 4000
    });

    console.log(`[${cardId}] OpenRouter response received, tokens used:`, response.usage);

    // Try to parse the LLM response as JSON
    let parsedContent;
    try {
      // Clean the response content (remove markdown formatting if present)
      const cleanedContent = response.content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      parsedContent = JSON.parse(cleanedContent);
      console.log(`[${cardId}] Successfully parsed LLM response as JSON`);
    } catch (parseError) {
      console.error(`[${cardId}] Failed to parse LLM response as JSON:`, parseError);
      console.log(`[${cardId}] Raw LLM response:`, response.content.substring(0, 500) + '...');
      
      // Fallback to structured mock data
      parsedContent = generateMockTravelCard(input);
    }

    return parsedContent;

  } catch (error) {
    console.error(`[${cardId}] OpenRouter LLM generation failed:`, error);
    
    // Fallback to mock data if LLM fails
    return generateMockTravelCard(input);
  }
}

// Generate structured mock data as fallback
function generateMockTravelCard(input: any): any {
  const isDomestic = isDomesticTravel(input.origin, input.destination);
  
  return {
    overview: {
      destination: input.destination,
      country: isDomestic ? 'India' : getCountryFromDestination(input.destination),
      famousFor: getDestinationHighlights(input.destination),
      bestTime: 'October to March',
      currency: isDomestic ? 'INR' : getCurrency(input.destination),
      languages: isDomestic ? ['Hindi', 'English'] : getLanguages(input.destination)
    },
    transportation: {
      flights: [
        {
          airline: 'IndiGo',
          price: isDomestic ? 8500 : 45000,
          duration: isDomestic ? '2h 15m' : '8h 30m',
          stops: 0,
          departure: '06:00',
          arrival: isDomestic ? '08:15' : '14:30',
          route: `${input.origin} → ${input.destination}`
        }
      ],
      ...(isDomestic && {
        trains: [
          {
            trainNumber: '12345',
            trainName: 'Express Train',
            class: '3A',
            price: 1200,
            duration: '8h 30m',
            departure: '22:00',
            arrival: '06:30'
          }
        ],
        buses: [
          {
            operator: 'Private Bus',
            busType: 'AC Sleeper',
            price: 800,
            duration: '10h 00m',
            departure: '21:00',
            arrival: '07:00'
          }
        ]
      })
    },
    accommodation: {
      hotels: [
        {
          name: 'Grand Palace Hotel',
          rating: 4.2,
          pricePerNight: isDomestic ? 3500 : 8500,
          location: `Central ${input.destination}`,
          amenities: ['WiFi', 'Pool', 'Gym', 'Spa'],
          category: 'mid-range'
        },
        {
          name: 'Budget Inn',
          rating: 3.8,
          pricePerNight: isDomestic ? 1800 : 4500,
          location: `${input.destination} City Center`,
          amenities: ['WiFi', 'AC', 'Restaurant'],
          category: 'budget'
        }
      ]
    },
    attractions: [
      {
        name: `${input.destination} Museum`,
        type: 'Museum',
        entryFee: isDomestic ? 200 : 500,
        openingHours: '9:00 AM - 6:00 PM',
        description: `Famous museum in ${input.destination}`,
        rating: 4.5,
        timeNeeded: '2-3 hours',
        bestTimeToVisit: 'Morning'
      }
    ],
    dining: {
      indianRestaurants: [
        {
          name: 'Maharaja Restaurant',
          cuisine: 'North Indian',
          priceRange: 'mid-range',
          rating: 4.3,
          location: 'City Center',
          vegetarian: true,
          specialties: ['Butter Chicken', 'Dal Makhani', 'Naan']
        }
      ],
      localCuisine: [
        {
          name: 'Local Delights',
          cuisine: `${input.destination} Cuisine`,
          priceRange: 'budget',
          vegetarianOptions: true,
          mustTry: ['Local Dish 1', 'Local Dish 2']
        }
      ]
    },
    budget: calculateDetailedBudget(input, isDomestic),
    weather: {
      current: {
        temperature: 25,
        condition: 'Pleasant',
        humidity: 65
      },
      bestMonths: ['October', 'November', 'December', 'January', 'February'],
      avoidMonths: ['June', 'July', 'August'],
      packingTips: ['Light cotton clothes', 'Comfortable shoes', 'Sunscreen']
    },
    ...((!isDomestic) && {
      visaInfo: {
        required: true,
        type: 'Tourist Visa',
        duration: '30 days',
        cost: 2500,
        processingTime: '3-5 business days',
        documents: ['Passport', 'Photos', 'Travel itinerary', 'Bank statements'],
        embassyAddress: `Indian Embassy, ${input.destination}`
      }
    }),
    indianTravelerInfo: {
      upiAcceptance: isDomestic || ['UAE', 'Singapore'].some(country => input.destination.toLowerCase().includes(country.toLowerCase())),
      indianBankCards: ['RuPay', 'Visa', 'Mastercard'],
      simCardOptions: getSIMOptions(input.destination),
      ...(!isDomestic && { embassyContact: getEmbassyContact(input.destination) }),
      emergencyNumbers: getEmergencyNumbers(input.destination),
      culturalTips: getCulturalTips(input.destination),
      languageBarrier: isDomestic ? 'low' : 'medium',
      timeZone: 'Local timezone'
    },
    itineraries: generateDetailedItinerary(input),
    practicalInfo: {
      bestWayToBook: ['MakeMyTrip', 'Cleartrip', 'Booking.com'],
      seasonalOffers: 'Best deals during off-season',
      localTransport: isDomestic ? ['Auto-rickshaw', 'Ola/Uber', 'Local buses'] : ['Taxi', 'Metro', 'Local transport'],
      safetyTips: ['Keep documents safe', 'Stay in groups', 'Avoid isolated areas'],
      budgetSavingTips: ['Book in advance', 'Travel during weekdays', 'Look for package deals']
    }
  };
}

function isDomesticTravel(origin: string, destination: string): boolean {
  const indianKeywords = ['india', 'mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata', 'pune', 'hyderabad', 
                          'goa', 'kerala', 'rajasthan', 'kashmir', 'himachal', 'uttarakhand', 'gujarat', 
                          'maharashtra', 'karnataka', 'tamil nadu', 'west bengal', 'bihar', 'odisha'];
  
  const isOriginIndian = indianKeywords.some(keyword => origin.toLowerCase().includes(keyword));
  const isDestinationIndian = indianKeywords.some(keyword => destination.toLowerCase().includes(keyword));
  
  return isOriginIndian && isDestinationIndian;
}

function calculateDetailedBudget(input: any, isDomestic: boolean): any {
  const baseDays = parseInt(input.duration.split('-')[0]) || 7;
  const multiplier = isDomestic ? 1 : 2.5;
  
  const tightBudget = {
    accommodation: 1500 * baseDays * multiplier,
    transportation: isDomestic ? 3000 : 35000,
    food: 800 * baseDays * multiplier,
    attractions: 500 * baseDays,
    shopping: 2000,
    miscellaneous: 1000
  };
  
  const comfortableBudget = {
    accommodation: 3500 * baseDays * multiplier,
    transportation: isDomestic ? 8000 : 45000,
    food: 1500 * baseDays * multiplier,
    attractions: 1000 * baseDays,
    shopping: 5000,
    miscellaneous: 2000
  };
  
  const luxuryBudget = {
    accommodation: 8000 * baseDays * multiplier,
    transportation: isDomestic ? 15000 : 65000,
    food: 3000 * baseDays * multiplier,
    attractions: 2000 * baseDays,
    shopping: 10000,
    miscellaneous: 5000
  };
  
  return {
    perPerson: {
      tight: Object.values(tightBudget).reduce((a, b) => a + b, 0),
      comfortable: Object.values(comfortableBudget).reduce((a, b) => a + b, 0),
      luxury: Object.values(luxuryBudget).reduce((a, b) => a + b, 0)
    },
    breakdown: comfortableBudget, // Use comfortable as default breakdown
    currency: 'INR'
  };
}

function generateDetailedItinerary(input: any): any[] {
  const duration = input.duration;
  const days = parseInt(duration.split('-')[0]) || 3;
  
  const activities = [];
  for (let day = 1; day <= days; day++) {
    activities.push({
      day,
      title: day === 1 ? 'Arrival & Exploration' : 
             day === days ? 'Last Day & Departure' : 
             `Day ${day} - Sightseeing`,
      activities: [
        {
          time: '09:00',
          activity: day === 1 ? 'Arrive and check-in' : 'Visit main attraction',
          location: day === 1 ? 'Hotel' : 'Tourist spot',
          cost: day === 1 ? 0 : 500,
          notes: 'Recommended timing'
        },
        {
          time: '13:00',
          activity: 'Lunch at local restaurant',
          location: 'Local restaurant',
          cost: 800,
          notes: 'Try local cuisine'
        },
        {
          time: '15:00',
          activity: day === days ? 'Shopping and departure prep' : 'Explore local market',
          location: day === days ? 'Shopping area' : 'Market',
          cost: 1000,
          notes: day === days ? 'Buy souvenirs' : 'Local shopping'
        }
      ]
    });
  }
  
  return [
    {
      duration: `${days} days`,
      title: 'Recommended Itinerary',
      days: activities
    }
  ];
}

// Helper functions for data processing
function getCountryFromDestination(destination: string): string {
  // Simple mapping - in reality, you'd use a proper location service
  const countryMap: Record<string, string> = {
    'goa': 'India',
    'kerala': 'India', 
    'dubai': 'UAE',
    'thailand': 'Thailand',
    'singapore': 'Singapore',
    'bali': 'Indonesia'
  };
  
  const key = destination.toLowerCase();
  return countryMap[key] || 'Unknown';
}

function getDestinationHighlights(destination: string): string[] {
  const highlights: Record<string, string[]> = {
    'goa': ['Beaches', 'Nightlife', 'Portuguese Heritage', 'Seafood'],
    'kerala': ['Backwaters', 'Hill Stations', 'Spices', 'Ayurveda'],
    'dubai': ['Shopping', 'Architecture', 'Desert Safari', 'Luxury'],
    'thailand': ['Temples', 'Street Food', 'Islands', 'Culture']
  };
  
  return highlights[destination.toLowerCase()] || ['Tourism', 'Culture', 'Food', 'Shopping'];
}

function getBestTimeToVisit(weatherData: any): string {
  if (!weatherData) return 'October to March';
  return weatherData.bestMonths?.join(', ') || 'Year-round';
}

function getCurrency(destination: string): string {
  const currencyMap: Record<string, string> = {
    'india': 'INR',
    'uae': 'AED',
    'thailand': 'THB',
    'singapore': 'SGD',
    'indonesia': 'IDR'
  };
  
  const country = getCountryFromDestination(destination).toLowerCase();
  return currencyMap[country] || 'USD';
}

function getLanguages(destination: string): string[] {
  const languageMap: Record<string, string[]> = {
    'india': ['Hindi', 'English'],
    'uae': ['Arabic', 'English'],
    'thailand': ['Thai', 'English'],
    'singapore': ['English', 'Mandarin', 'Malay', 'Tamil']
  };
  
  const country = getCountryFromDestination(destination).toLowerCase();
  return languageMap[country] || ['English'];
}

function processFlightData(flightData: any): any[] {
  if (!flightData || !Array.isArray(flightData)) return [];
  return flightData.slice(0, 3); // Return top 3 options
}

function processDomesticTransport(travelInput: TravelCaptureInput, type: 'train' | 'bus'): any[] {
  // Only for domestic Indian travel
  const isDomestic = ['india', 'indian'].some(keyword => 
    travelInput.destination.toLowerCase().includes(keyword) ||
    travelInput.origin.toLowerCase().includes(keyword)
  );
  
  if (!isDomestic) return [];
  
  // Mock data for now
  if (type === 'train') {
    return [
      {
        trainNumber: '12345',
        trainName: 'Express Train',
        class: '3A',
        price: 1200,
        duration: '8h 30m',
        departure: '22:00',
        arrival: '06:30'
      }
    ];
  }
  
  return [
    {
      operator: 'Private Bus',
      busType: 'AC Sleeper',
      price: 800,
      duration: '10h 00m',
      departure: '21:00',
      arrival: '07:00'
    }
  ];
}

function processHotelData(hotelData: any): any[] {
  if (!hotelData || !Array.isArray(hotelData)) return [];
  return hotelData.slice(0, 5); // Return top 5 options
}

function processAttractionData(attractionData: any): any[] {
  if (!attractionData || !Array.isArray(attractionData)) return [];
  return attractionData.slice(0, 10); // Return top 10 attractions
}

function calculateBudget(travelInput: TravelCaptureInput, travelData: any): any {
  const baseMultipliers = {
    'Tight': { accommodation: 1500, food: 800, transport: 0.8, activities: 500 },
    'Comfortable': { accommodation: 3500, food: 1500, transport: 1.2, activities: 1200 },
    'Luxury': { accommodation: 8000, food: 3000, transport: 2.0, activities: 3000 }
  };
  
  const multiplier = baseMultipliers[travelInput.budget];
  const days = parseInt(travelInput.duration.split('-')[0]) || 7;
  
  const perPerson = {
    tight: (multiplier.accommodation * days) + (multiplier.food * days) + (multiplier.activities * days),
    comfortable: multiplier.accommodation * days * 1.5,
    luxury: multiplier.accommodation * days * 3
  };
  
  const travelers = getTravelerCount(travelInput);
  
  return {
    perPerson,
    total: {
      tight: perPerson.tight * travelers,
      comfortable: perPerson.comfortable * travelers,  
      luxury: perPerson.luxury * travelers
    },
    breakdown: {
      accommodation: multiplier.accommodation * days,
      transportation: 5000, // Base flight cost
      food: multiplier.food * days,
      attractions: multiplier.activities * days,
      miscellaneous: 2000
    },
    currency: 'INR'
  };
}

function getTravelerCount(travelInput: TravelCaptureInput): number {
  switch (travelInput.travelType) {
    case 'single':
      return 1;
    case 'family':
      const family = travelInput.travelerDetails.familyMembers;
      return (family?.adults || 1) + (family?.children || 0);
    case 'group':
      return travelInput.travelerDetails.groupSize || 4;
    default:
      return 1;
  }
}

function processWeatherData(weatherData: any): any {
  if (!weatherData) {
    return {
      current: { temperature: 25, condition: 'Pleasant', humidity: 60 },
      forecast: [],
      bestMonths: ['October', 'November', 'December', 'January', 'February'],
      avoidMonths: ['June', 'July', 'August']
    };
  }
  return weatherData;
}

function processVisaData(visaData: any): any {
  return visaData;
}

function getUPIAcceptance(destination: string): boolean {
  const upiCountries = ['india', 'uae', 'singapore'];
  return upiCountries.some(country => 
    destination.toLowerCase().includes(country)
  );
}

function getSIMOptions(destination: string): string[] {
  const simOptions: Record<string, string[]> = {
    'india': ['Jio', 'Airtel', 'Vi'],
    'uae': ['Etisalat', 'du'],
    'thailand': ['AIS', 'True', 'dtac'],
    'singapore': ['Singtel', 'StarHub', 'M1']
  };
  
  const country = getCountryFromDestination(destination).toLowerCase();
  return simOptions[country] || ['Local SIM available'];
}

function getEmbassyContact(destination: string): string | undefined {
  const country = getCountryFromDestination(destination);
  if (country === 'India') return undefined;
  
  return `Indian Embassy, ${destination}`;
}

function getEmergencyNumbers(destination: string): string[] {
  const emergencyNumbers: Record<string, string[]> = {
    'india': ['100 (Police)', '101 (Fire)', '102 (Ambulance)'],
    'uae': ['999 (Police)', '997 (Ambulance)', '998 (Fire)'],
    'thailand': ['191 (Police)', '199 (Fire/Ambulance)'],
    'singapore': ['999 (Police)', '995 (Ambulance/Fire)']
  };
  
  const country = getCountryFromDestination(destination).toLowerCase();
  return emergencyNumbers[country] || ['112 (International Emergency)'];
}

function getCulturalTips(destination: string): string[] {
  const tips: Record<string, string[]> = {
    'uae': ['Dress modestly', 'Respect Ramadan timings', 'No public drinking'],
    'thailand': ['Remove shoes in temples', 'Don\'t touch heads', 'Wai greeting'],
    'singapore': ['No chewing gum', 'Don\'t jaywalk', 'Keep right on escalators'],
    'indonesia': ['Dress modestly', 'Use right hand for eating', 'Respect local customs']
  };
  
  const country = getCountryFromDestination(destination).toLowerCase();
  return tips[country] || ['Respect local customs', 'Dress appropriately', 'Be polite'];
}

function generateItineraries(travelInput: TravelCaptureInput, travelData: any): any[] {
  const duration = travelInput.duration;
  const itineraries = [];
  
  // Generate different itinerary options based on duration
  if (duration.includes('2-3')) {
    itineraries.push({
      duration: '3 days',
      title: 'Quick Getaway',
      days: [
        {
          day: 1,
          title: 'Arrival & City Tour',
          activities: [
            { time: '10:00', activity: 'Check-in to hotel', location: 'Hotel' },
            { time: '14:00', activity: 'Local sightseeing', location: 'City center' },
            { time: '19:00', activity: 'Welcome dinner', location: 'Local restaurant' }
          ]
        },
        {
          day: 2,
          title: 'Main Attractions',
          activities: [
            { time: '09:00', activity: 'Visit top attraction', location: 'Main tourist spot' },
            { time: '13:00', activity: 'Lunch & shopping', location: 'Market area' },
            { time: '16:00', activity: 'Cultural experience', location: 'Cultural site' }
          ]
        },
        {
          day: 3,
          title: 'Departure',
          activities: [
            { time: '10:00', activity: 'Check-out & last minute shopping', location: 'Hotel/Shops' },
            { time: '14:00', activity: 'Departure', location: 'Airport/Station' }
          ]
        }
      ]
    });
  }
  
  return itineraries;
}