import { TravelCaptureInput } from '@/lib/types/travel';
import { rateLimiter, extractApiHost } from './rate-limiter';

// RapidAPI configuration
const RAPIDAPI_BASE_URL = 'https://rapidapi.com';
const RAPIDAPI_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 2;

export interface RapidAPIError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export class RapidAPIClient {
  private apiKey: string;
  private timeout: number;
  private retries: number;

  constructor() {
    this.apiKey = process.env.X_RapidAPI_Key || process.env.RAPIDAPI_KEY || '';
    this.timeout = RAPIDAPI_TIMEOUT;
    this.retries = MAX_RETRIES;

    if (!this.apiKey) {
      console.warn('X_RapidAPI_Key not found in environment variables');
    }
  }

  /**
   * Generic method to call RapidAPI endpoints with rate limiting
   */
  private async callAPI(
    host: string,
    endpoint: string,
    params: Record<string, any> = {},
    method: 'GET' | 'POST' = 'GET'
  ): Promise<any> {
    // Check rate limit before making request
    await rateLimiter.waitIfNeeded(host);
    
    const headers: Record<string, string> = {
      'X-RapidAPI-Key': this.apiKey,
      'X-RapidAPI-Host': host,
      'Accept': 'application/json',
    };

    let url = `https://${host}${endpoint}`;
    const options: RequestInit = {
      method,
      headers,
    };

    // Add query parameters for GET requests
    if (method === 'GET' && Object.keys(params).length > 0) {
      const queryParams = new URLSearchParams(
        Object.entries(params).reduce((acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        }, {} as Record<string, string>)
      ).toString();
      url += `?${queryParams}`;
    } else if (method === 'POST') {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(params);
    }

    let lastError: RapidAPIError | null = null;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        // Record the request for rate limiting
        rateLimiter.recordRequest(host);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          
          // Check for rate limit error
          if (response.status === 429) {
            console.warn(`Rate limit hit for ${host}. Status: ${response.status}`);
            await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
            continue;
          }
          
          throw new Error(
            errorData?.message || `API call failed with status ${response.status}`
          );
        }

        return await response.json();
      } catch (error) {
        lastError = {
          message: error instanceof Error ? error.message : 'Unknown API error',
          status: error instanceof Error && 'status' in error ? (error as any).status : undefined,
          code: error instanceof Error && 'code' in error ? (error as any).code : undefined,
          details: { 
            attempt: attempt + 1, 
            maxRetries: this.retries + 1,
            host,
            rateLimitStatus: rateLimiter.getRemainingRequests(host)
          },
        };

        console.error(`RapidAPI call failed (attempt ${attempt + 1}):`, lastError);

        // Don't retry on final attempt
        if (attempt === this.retries) break;

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw lastError || new Error('API call failed after all retries');
  }

  /**
   * Get travel guide information using Travel Guide API
   */
  async getTravelGuideInfo(destination: string, interests: string[] = ['cultural', 'historical', 'food']): Promise<any> {
    try {
      return await this.callAPI(
        'travel-guide-api-city-guide-top-places.p.rapidapi.com',
        '/check?noqueue=1',
        {
          region: destination,
          language: 'en',
          interests: interests
        },
        'POST'
      );
    } catch (error) {
      console.error('Travel Guide API error:', error);
      return this.getMockTravelGuideData(destination);
    }
  }

  /**
   * Get travel preferences and interests
   */
  async getTravelInterests(): Promise<any> {
    try {
      return await this.callAPI(
        'ai-travel-itinerary-generator-pro2.p.rapidapi.com',
        '/v1/preferences/interests',
        {},
        'GET'
      );
    } catch (error) {
      console.error('Travel Interests API error:', error);
      return this.getMockInterestsData();
    }
  }

  /**
   * Get flight information using Flight Data API
   */
  async getFlightInfo(origin: string, destination: string, departureDate?: string, adults: number = 1): Promise<any> {
    try {
      const dateStr = departureDate || new Date().toISOString().split('T')[0].replace(/-/g, '/');
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      const endDateStr = endDate.toISOString().split('T')[0].replace(/-/g, '/');
      
      // Use Flight Data28 API with POST request
      return await this.callAPI(
        'flight-data28.p.rapidapi.com',
        `/flights/search/summary?fly_from=${origin}&fly_to=${destination}&date_from=${encodeURIComponent(dateStr)}&date_to=${encodeURIComponent(endDateStr)}&adults=${adults}&curr=INR&limit=10`,
        {
          fly_from: origin,
          fly_to: destination,
          date_from: dateStr,
          date_to: endDateStr,
          adults: adults,
          curr: 'INR',
          limit: 10
        },
        'POST'
      );
    } catch (error) {
      console.error('Flight API error:', error);
      return this.getMockFlightData(origin, destination);
    }
  }

  /**
   * Search hotel destinations using Booking.com15 API
   */
  async searchHotelDestinations(query: string): Promise<any> {
    try {
      return await this.callAPI(
        'booking-com15.p.rapidapi.com',
        `/api/v1/hotels/searchDestination?query=${encodeURIComponent(query)}`
      );
    } catch (error) {
      console.error('Hotel destination search error:', error);
      return this.getMockDestinationSearch(query);
    }
  }

  /**
   * Get hotel availability using Booking.com15 API
   */
  async getHotelAvailability(hotelId: string, checkIn?: string, checkOut?: string): Promise<any> {
    try {
      return await this.callAPI(
        'booking-com15.p.rapidapi.com',
        `/api/v1/hotels/getAvailability?hotel_id=${hotelId}&currency_code=INR&location=IN&checkin_date=${checkIn || new Date().toISOString().split('T')[0]}&checkout_date=${checkOut || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`
      );
    } catch (error) {
      console.error('Hotel availability error:', error);
      return this.getMockHotelAvailability(hotelId);
    }
  }

  /**
   * Get comprehensive hotel information for destination
   */
  async getHotelInfo(destination: string, checkIn?: string, checkOut?: string): Promise<any> {
    try {
      // First search for destinations to get hotel IDs
      const destinations = await this.searchHotelDestinations(destination);
      
      // If we have destinations, get availability for some hotels
      if (destinations && destinations.length > 0) {
        const hotelPromises = destinations.slice(0, 5).map((dest: any) => 
          this.getHotelAvailability(dest.hotel_id || dest.id, checkIn, checkOut)
            .catch(() => null) // Don't fail entire request if one hotel fails
        );
        
        const hotelResults = await Promise.all(hotelPromises);
        return hotelResults.filter(Boolean); // Remove null results
      }
      
      return this.getMockHotelData(destination);
    } catch (error) {
      console.error('Hotel API error:', error);
      return this.getMockHotelData(destination);
    }
  }

  /**
   * Get IRCTC train information using IRCTC Train API
   */
  async getTrainInfo(pnrNumber?: string): Promise<any> {
    try {
      if (pnrNumber) {
        // Get PNR status if PNR number provided
        return await this.callAPI(
          'irctc-train-api.p.rapidapi.com',
          `/api/v1/pnr-status?pnrNo=${pnrNumber}`
        );
      } else {
        // For now, return mock train data for route planning
        return this.getMockTrainData();
      }
    } catch (error) {
      console.error('IRCTC Train API error:', error);
      return this.getMockTrainData();
    }
  }

  /**
   * Get visa information for Indian passport holders
   */
  async getVisaInfo(destination: string): Promise<any> {
    try {
      return await this.callAPI(
        'visa-list.rapidapi.com',
        '/visa',
        {
          passport: 'IN', // Indian passport
          destination: destination,
        }
      );
    } catch (error) {
      console.error('Visa API error:', error);
      return this.getMockVisaData(destination);
    }
  }

  /**
   * Get tourist attractions
   */
  async getAttractions(destination: string): Promise<any> {
    try {
      return await this.callAPI(
        'world-tourist-attractions.rapidapi.com',
        '/attractions',
        {
          location: destination,
          limit: 10,
          offset: 0
        }
      );
    } catch (error) {
      console.error('Attractions API error:', error);
      return this.getMockAttractionsData(destination);
    }
  }

  /**
   * Get comprehensive travel data using updated APIs
   */
  async getTravelData(input: TravelCaptureInput): Promise<any> {
    const isDomestic = this.isDomesticTravel(input.origin, input.destination);
    const travelerCount = this.getTravelerCount(input);
    
    // Determine interests based on travel style
    const interests = this.getInterestsFromTravelStyle(input.travelStyle);
    
    // Prepare all API requests
    const requests = [
      this.getTravelGuideInfo(input.destination, interests),
      this.getFlightInfo(input.origin, input.destination, undefined, travelerCount),
      this.getHotelInfo(input.destination),
    ];

    // Add domestic-specific requests
    if (isDomestic) {
      requests.push(this.getTrainInfo()); // IRCTC train info
    } else {
      requests.push(this.getVisaInfo(input.destination)); // Visa info for international
    }

    // Add travel interests
    requests.push(this.getTravelInterests());

    try {
      const results = await Promise.allSettled(requests);
      
      return {
        travelGuide: results[0].status === 'fulfilled' ? results[0].value : null,
        flights: results[1].status === 'fulfilled' ? results[1].value : null,
        hotels: results[2].status === 'fulfilled' ? results[2].value : null,
        trains: isDomestic && results[3]?.status === 'fulfilled' ? results[3].value : null,
        visa: !isDomestic && results[3]?.status === 'fulfilled' ? results[3].value : null,
        interests: results[4]?.status === 'fulfilled' ? results[4].value : null,
        isDomestic: isDomestic,
        travelerCount: travelerCount,
        errors: results.map((result, index) => 
          result.status === 'rejected' ? { index, error: result.reason } : null
        ).filter(Boolean)
      };
    } catch (error) {
      console.error('Error fetching travel data:', error);
      throw error;
    }
  }

  /**
   * Get traveler count from input
   */
  private getTravelerCount(input: TravelCaptureInput): number {
    switch (input.travelType) {
      case 'single':
        return 1;
      case 'family':
        const family = input.travelerDetails.familyMembers;
        return (family?.adults || 1) + (family?.children || 0);
      case 'group':
        return input.travelerDetails.groupSize || 4;
      default:
        return 1;
    }
  }

  /**
   * Map travel style to interests for travel guide API
   */
  private getInterestsFromTravelStyle(travelStyle: string): string[] {
    const styleMap: Record<string, string[]> = {
      'Adventure': ['adventure', 'outdoor', 'sports', 'nature'],
      'Leisure': ['relaxation', 'beaches', 'spa', 'scenic'],
      'Business': ['business', 'networking', 'urban', 'modern'],
      'Pilgrimage': ['religious', 'spiritual', 'cultural', 'historical'],
      'Educational': ['museums', 'historical', 'cultural', 'educational']
    };
    
    return styleMap[travelStyle] || ['cultural', 'historical', 'food'];
  }

  /**
   * Check if travel is domestic (within India)
   */
  private isDomesticTravel(origin: string, destination: string): boolean {
    const indianCities = [
      'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Hyderabad',
      'Ahmedabad', 'Surat', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore',
      'Goa', 'Kerala', 'Rajasthan', 'Kashmir', 'Himachal Pradesh', 'Uttarakhand'
    ];

    const isOriginIndian = indianCities.some(city => origin.toLowerCase().includes(city.toLowerCase()));
    const isDestinationIndian = indianCities.some(city => destination.toLowerCase().includes(city.toLowerCase()));

    return isOriginIndian && isDestinationIndian;
  }

  /**
   * Get rate limit status for all APIs
   */
  getRateLimitStatus() {
    return rateLimiter.getStatus();
  }

  /**
   * Get remaining requests for a specific API
   */
  getRemainingRequests(host: string): number {
    return rateLimiter.getRemainingRequests(host);
  }

  // Mock data methods for development
  private getMockWeatherData(destination: string) {
    return {
      current: {
        temperature: 25,
        condition: 'Partly cloudy',
        humidity: 65,
      },
      forecast: [
        { date: '2024-01-01', high: 28, low: 20, condition: 'Sunny', rainChance: 10 },
        { date: '2024-01-02', high: 26, low: 18, condition: 'Cloudy', rainChance: 30 },
        { date: '2024-01-03', high: 24, low: 16, condition: 'Rainy', rainChance: 80 },
      ],
      bestMonths: ['October', 'November', 'December', 'January', 'February'],
      avoidMonths: ['June', 'July', 'August', 'September'],
    };
  }

  private getMockFlightData(origin: string, destination: string) {
    return [
      {
        airline: 'IndiGo',
        price: 8500,
        duration: '2h 15m',
        stops: 0,
        departure: '06:00',
        arrival: '08:15',
        bookingLink: 'https://example.com/book-flight-1'
      },
      {
        airline: 'Air India',
        price: 9200,
        duration: '2h 30m',
        stops: 0,
        departure: '14:30',
        arrival: '17:00',
        bookingLink: 'https://example.com/book-flight-2'
      }
    ];
  }

  private getMockHotelData(destination: string) {
    return [
      {
        name: 'Grand Palace Hotel',
        rating: 4.2,
        pricePerNight: 3500,
        location: `Central ${destination}`,
        amenities: ['WiFi', 'Pool', 'Gym', 'Spa'],
        bookingLink: 'https://example.com/book-hotel-1'
      },
      {
        name: 'Budget Inn',
        rating: 3.8,
        pricePerNight: 1800,
        location: `${destination} City Center`,
        amenities: ['WiFi', 'AC', 'Restaurant'],
        bookingLink: 'https://example.com/book-hotel-2'
      }
    ];
  }

  private getMockVisaData(destination: string) {
    return {
      required: true,
      type: 'Tourist Visa',
      duration: '30 days',
      cost: 2500,
      processingTime: '3-5 business days',
      documents: ['Passport', 'Photos', 'Travel itinerary'],
      embassyAddress: `${destination} Embassy, New Delhi`,
      onArrival: false,
      eVisa: true,
      notes: 'Tourist visa required for Indian passport holders'
    };
  }

  private getMockAttractionsData(destination: string) {
    return [
      {
        name: `${destination} Museum`,
        type: 'Museum',
        entryFee: 200,
        openingHours: '9:00 AM - 6:00 PM',
        description: `Famous museum in ${destination}`,
        rating: 4.5,
        timeNeeded: '2-3 hours',
        bookingRequired: false
      },
      {
        name: `${destination} Palace`,
        type: 'Historical Site',
        entryFee: 500,
        openingHours: '8:00 AM - 7:00 PM',
        description: `Historic palace in ${destination}`,
        rating: 4.8,
        timeNeeded: '3-4 hours',
        bookingRequired: true,
        bookingLink: 'https://example.com/book-palace'
      }
    ];
  }

  private getMockTravelGuideData(destination: string) {
    return {
      region: destination,
      attractions: [
        {
          name: `Top ${destination} Attraction`,
          type: 'Cultural',
          rating: 4.5,
          description: `Must-visit cultural site in ${destination}`,
          tips: 'Best visited in the morning'
        },
        {
          name: `${destination} Food Street`,
          type: 'Food',
          rating: 4.2,
          description: `Famous food street in ${destination}`,
          tips: 'Try local specialties'
        }
      ],
      localInfo: {
        bestTimeToVisit: 'October to March',
        weather: 'Pleasant',
        culture: 'Rich cultural heritage',
        safety: 'Generally safe for tourists'
      }
    };
  }

  private getMockInterestsData() {
    return {
      categories: [
        { id: 'cultural', name: 'Cultural Sites', description: 'Museums, heritage sites' },
        { id: 'adventure', name: 'Adventure', description: 'Outdoor activities' },
        { id: 'food', name: 'Food & Dining', description: 'Local cuisine experiences' },
        { id: 'relaxation', name: 'Relaxation', description: 'Beaches, spas, leisure' },
        { id: 'historical', name: 'Historical', description: 'Historic monuments' },
        { id: 'religious', name: 'Religious', description: 'Temples, spiritual sites' }
      ]
    };
  }

  private getMockTrainData() {
    return {
      trains: [
        {
          trainNumber: '12345',
          trainName: 'Express Train',
          class: '3A',
          price: 1200,
          duration: '8h 30m',
          departure: '22:00',
          arrival: '06:30',
          availability: 'Available'
        },
        {
          trainNumber: '12346',
          trainName: 'Superfast Express',
          class: '2A',
          price: 2200,
          duration: '7h 45m',
          departure: '14:30',
          arrival: '22:15',
          availability: 'RAC'
        }
      ]
    };
  }

  private getMockDestinationSearch(query: string) {
    return [
      {
        id: '1',
        name: `${query} Hotel District`,
        type: 'area',
        country: 'India',
        region: query,
        hotels_count: 150
      },
      {
        id: '2', 
        name: `${query} City Center`,
        type: 'area',
        country: 'India',
        region: query,
        hotels_count: 89
      }
    ];
  }

  private getMockHotelAvailability(hotelId: string) {
    return {
      hotel_id: hotelId,
      name: 'Sample Hotel',
      rating: 4.2,
      price_per_night: 3500,
      currency: 'INR',
      availability: 'available',
      amenities: ['WiFi', 'AC', 'Restaurant', 'Pool'],
      location: 'City Center'
    };
  }
}

// Export singleton instance
export const rapidAPIClient = new RapidAPIClient();