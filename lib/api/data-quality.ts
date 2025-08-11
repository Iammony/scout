// Data Quality Assessment and Validation for RapidAPI responses
import { TravelCaptureInput } from '@/lib/types/travel';
import { DATA_QUALITY_THRESHOLDS, ContentStrategy, CONTENT_STRATEGIES } from './openrouter-config';

export interface DataQualityScore {
  overall: number;
  completeness: number;
  accuracy: number;
  relevance: number;
  freshness: number;
  details: {
    missingFields: string[];
    inconsistencies: string[];
    recommendations: string[];
  };
}

export interface ValidatedApiData {
  travelGuide: {
    data: any;
    quality: DataQualityScore;
    usable: boolean;
  };
  flights: {
    data: any;
    quality: DataQualityScore;
    usable: boolean;
  };
  hotels: {
    data: any;
    quality: DataQualityScore;
    usable: boolean;
  };
  visa: {
    data: any;
    quality: DataQualityScore;
    usable: boolean;
  };
  currency: {
    data: any;
    quality: DataQualityScore;
    usable: boolean;
  };
  trains?: {
    data: any;
    quality: DataQualityScore;
    usable: boolean;
  };
}

export class DataQualityAssessor {
  /**
   * Assess the quality of RapidAPI data for travel card generation
   */
  assessApiData(apiData: any, input: TravelCaptureInput): ValidatedApiData {
    console.log('🔍 Assessing API data quality...');
    
    return {
      travelGuide: this.assessTravelGuideData(apiData?.travelGuide, input),
      flights: this.assessFlightData(apiData?.flights, input),
      hotels: this.assessHotelData(apiData?.hotels, input),
      visa: this.assessVisaData(apiData?.visa, input),
      currency: this.assessCurrencyData(apiData?.currency, input),
      ...(apiData?.trains && {
        trains: this.assessTrainData(apiData.trains, input)
      })
    };
  }

  /**
   * Assess travel guide data quality
   */
  private assessTravelGuideData(data: any, input: TravelCaptureInput): { data: any; quality: DataQualityScore; usable: boolean } {
    if (!data) {
      return {
        data: null,
        quality: this.createLowQualityScore('No travel guide data available'),
        usable: false
      };
    }

    const missingFields: string[] = [];
    const inconsistencies: string[] = [];
    const recommendations: string[] = [];

    // Check for essential fields
    if (!data.region && !data.destination) missingFields.push('destination/region');
    if (!data.attractions || !Array.isArray(data.attractions) || data.attractions.length === 0) {
      missingFields.push('attractions');
    }
    if (!data.localInfo) missingFields.push('localInfo');

    // Check attraction data quality
    let attractionQuality = 0;
    if (data.attractions && Array.isArray(data.attractions)) {
      const qualityAttractions = data.attractions.filter((attr: any) => 
        attr.name && attr.description && (attr.rating !== undefined || attr.type)
      );
      attractionQuality = qualityAttractions.length / Math.max(data.attractions.length, 1);
      
      if (attractionQuality < 0.5) {
        recommendations.push('Enhance attraction descriptions and ratings');
      }
    }

    // Check destination relevance
    const destinationMatch = this.checkDestinationRelevance(
      data.region || data.destination, 
      input.destination
    );
    
    if (destinationMatch < 0.7) {
      inconsistencies.push(`Destination mismatch: expected ${input.destination}, got ${data.region || data.destination}`);
    }

    // Calculate quality scores
    const completeness = 1 - (missingFields.length * 0.25);
    const accuracy = destinationMatch;
    const relevance = attractionQuality;
    const freshness = 0.8; // Assume reasonably fresh for API data
    
    const overall = (completeness + accuracy + relevance + freshness) / 4;

    const quality: DataQualityScore = {
      overall,
      completeness,
      accuracy,
      relevance,
      freshness,
      details: { missingFields, inconsistencies, recommendations }
    };

    return {
      data,
      quality,
      usable: overall >= DATA_QUALITY_THRESHOLDS.LOW_QUALITY
    };
  }

  /**
   * Assess flight data quality
   */
  private assessFlightData(data: any, input: TravelCaptureInput): { data: any; quality: DataQualityScore; usable: boolean } {
    if (!data) {
      return {
        data: null,
        quality: this.createLowQualityScore('No flight data available'),
        usable: false
      };
    }

    const missingFields: string[] = [];
    const inconsistencies: string[] = [];
    const recommendations: string[] = [];

    let flightQuality = 0;
    
    if (Array.isArray(data) && data.length > 0) {
      const validFlights = data.filter((flight: any) => 
        flight.price && flight.airline && (flight.duration || flight.departure)
      );
      flightQuality = validFlights.length / data.length;

      if (flightQuality < 0.5) {
        recommendations.push('Improve flight data completeness (price, airline, timing)');
      }

      // Check price reasonableness
      const avgPrice = validFlights.reduce((sum: number, flight: any) => 
        sum + (typeof flight.price === 'number' ? flight.price : parseFloat(flight.price) || 0), 0
      ) / validFlights.length;

      const isDomestic = this.isDomesticTravel(input.origin, input.destination);
      const expectedPriceRange = isDomestic ? [5000, 25000] : [15000, 100000];
      
      if (avgPrice < expectedPriceRange[0] || avgPrice > expectedPriceRange[1]) {
        inconsistencies.push(`Average flight price ${avgPrice} seems unrealistic for route ${input.origin} → ${input.destination}`);
      }
    } else if (data.available === false) {
      flightQuality = 0.3; // Some information available even if no flights
    } else {
      missingFields.push('flight_options');
    }

    const completeness = flightQuality;
    const accuracy = inconsistencies.length === 0 ? 0.9 : 0.6;
    const relevance = 0.8; // Flight data is generally relevant
    const freshness = 0.9; // Flight data should be fresh
    
    const overall = (completeness + accuracy + relevance + freshness) / 4;

    return {
      data,
      quality: {
        overall,
        completeness,
        accuracy,
        relevance,
        freshness,
        details: { missingFields, inconsistencies, recommendations }
      },
      usable: overall >= DATA_QUALITY_THRESHOLDS.LOW_QUALITY
    };
  }

  /**
   * Assess hotel data quality
   */
  private assessHotelData(data: any, input: TravelCaptureInput): { data: any; quality: DataQualityScore; usable: boolean } {
    if (!data) {
      return {
        data: null,
        quality: this.createLowQualityScore('No hotel data available'),
        usable: false
      };
    }

    const missingFields: string[] = [];
    const inconsistencies: string[] = [];
    const recommendations: string[] = [];

    let hotelQuality = 0;
    
    if (Array.isArray(data) && data.length > 0) {
      const validHotels = data.filter((hotel: any) => 
        hotel.name && (hotel.price_per_night || hotel.pricePerNight) && hotel.rating
      );
      hotelQuality = validHotels.length / data.length;

      if (hotelQuality < 0.5) {
        recommendations.push('Improve hotel data completeness (name, price, rating)');
      }

      // Check rating reasonableness (should be 1-5 scale)
      const invalidRatings = validHotels.filter((hotel: any) => {
        const rating = hotel.rating || 0;
        return rating < 1 || rating > 5;
      });
      
      if (invalidRatings.length > 0) {
        inconsistencies.push(`${invalidRatings.length} hotels have invalid ratings`);
      }
    } else if (data[0]?.message) {
      hotelQuality = 0.2; // Some acknowledgment of no data
    } else {
      missingFields.push('hotel_options');
    }

    const completeness = hotelQuality;
    const accuracy = inconsistencies.length === 0 ? 0.9 : 0.7;
    const relevance = 0.8;
    const freshness = 0.8;
    
    const overall = (completeness + accuracy + relevance + freshness) / 4;

    return {
      data,
      quality: {
        overall,
        completeness,
        accuracy,
        relevance,
        freshness,
        details: { missingFields, inconsistencies, recommendations }
      },
      usable: overall >= DATA_QUALITY_THRESHOLDS.LOW_QUALITY
    };
  }

  /**
   * Assess visa data quality
   */
  private assessVisaData(data: any, input: TravelCaptureInput): { data: any; quality: DataQualityScore; usable: boolean } {
    const isDomestic = this.isDomesticTravel(input.origin, input.destination);
    
    if (isDomestic) {
      return {
        data: { required: false, type: 'domestic' },
        quality: { overall: 1, completeness: 1, accuracy: 1, relevance: 1, freshness: 1, details: { missingFields: [], inconsistencies: [], recommendations: [] }},
        usable: true
      };
    }

    if (!data) {
      return {
        data: null,
        quality: this.createLowQualityScore('No visa data available for international travel'),
        usable: false
      };
    }

    const missingFields: string[] = [];
    const inconsistencies: string[] = [];
    const recommendations: string[] = [];

    // Check essential visa fields
    if (data.required === undefined) missingFields.push('visa_requirement_status');
    if (!data.type && data.required) missingFields.push('visa_type');
    if (!data.documents && !data.requirements && data.required) missingFields.push('required_documents');

    const completeness = 1 - (missingFields.length * 0.3);
    const accuracy = 0.8; // Assume API data is generally accurate
    const relevance = 0.9; // Visa data is highly relevant for international travel
    const freshness = 0.7; // Visa requirements can change, so moderate freshness assumption

    const overall = (completeness + accuracy + relevance + freshness) / 4;

    return {
      data,
      quality: {
        overall,
        completeness,
        accuracy,
        relevance,
        freshness,
        details: { missingFields, inconsistencies, recommendations }
      },
      usable: overall >= DATA_QUALITY_THRESHOLDS.LOW_QUALITY
    };
  }

  /**
   * Assess currency data quality
   */
  private assessCurrencyData(data: any, input: TravelCaptureInput): { data: any; quality: DataQualityScore; usable: boolean } {
    if (!data) {
      return {
        data: null,
        quality: this.createLowQualityScore('No currency data available'),
        usable: false
      };
    }

    const missingFields: string[] = [];
    const inconsistencies: string[] = [];
    const recommendations: string[] = [];

    // Check essential currency fields
    if (!data.rate && !data.convertedAmount) missingFields.push('exchange_rate');
    if (!data.from) missingFields.push('source_currency');
    if (!data.to) missingFields.push('target_currency');

    // Validate exchange rate reasonableness
    const rate = data.rate || data.convertedAmount || 0;
    if (rate <= 0 || rate > 1000) {
      inconsistencies.push(`Exchange rate ${rate} seems unrealistic`);
    }

    const completeness = 1 - (missingFields.length * 0.3);
    const accuracy = inconsistencies.length === 0 ? 0.95 : 0.6;
    const relevance = 0.9; // Currency data is highly relevant
    const freshness = 0.95; // Currency data should be very fresh

    const overall = (completeness + accuracy + relevance + freshness) / 4;

    return {
      data,
      quality: {
        overall,
        completeness,
        accuracy,
        relevance,
        freshness,
        details: { missingFields, inconsistencies, recommendations }
      },
      usable: overall >= DATA_QUALITY_THRESHOLDS.LOW_QUALITY
    };
  }

  /**
   * Assess train data quality (domestic only)
   */
  private assessTrainData(data: any, input: TravelCaptureInput): { data: any; quality: DataQualityScore; usable: boolean } {
    if (!data || !data.trains) {
      return {
        data: null,
        quality: this.createLowQualityScore('No train data available'),
        usable: false
      };
    }

    const missingFields: string[] = [];
    const inconsistencies: string[] = [];
    const recommendations: string[] = [];

    let trainQuality = 0;
    if (Array.isArray(data.trains)) {
      const validTrains = data.trains.filter((train: any) => 
        train.trainNumber && train.trainName && train.price
      );
      trainQuality = validTrains.length / data.trains.length;
    }

    const completeness = trainQuality;
    const accuracy = 0.8;
    const relevance = 0.9; // Train data is very relevant for domestic travel
    const freshness = 0.7;

    const overall = (completeness + accuracy + relevance + freshness) / 4;

    return {
      data,
      quality: {
        overall,
        completeness,
        accuracy,
        relevance,
        freshness,
        details: { missingFields, inconsistencies, recommendations }
      },
      usable: overall >= DATA_QUALITY_THRESHOLDS.LOW_QUALITY
    };
  }

  /**
   * Determine content generation strategy based on data quality
   */
  determineContentStrategy(validatedData: ValidatedApiData): ContentStrategy {
    const avgQuality = this.calculateAverageQuality(validatedData);
    
    console.log(`📊 Average API data quality: ${(avgQuality * 100).toFixed(1)}%`);
    
    if (avgQuality >= DATA_QUALITY_THRESHOLDS.HIGH_QUALITY) {
      console.log('✅ High quality API data - using API-first strategy');
      return CONTENT_STRATEGIES.API_FIRST;
    } else if (avgQuality >= DATA_QUALITY_THRESHOLDS.MEDIUM_QUALITY) {
      console.log('⚡ Medium quality API data - using API-enhanced strategy');
      return CONTENT_STRATEGIES.API_ENHANCED;
    } else if (avgQuality >= DATA_QUALITY_THRESHOLDS.LOW_QUALITY) {
      console.log('🔄 Low quality API data - using LLM with context strategy');
      return CONTENT_STRATEGIES.LLM_WITH_CONTEXT;
    } else {
      console.log('🎯 Poor API data quality - using LLM fallback strategy');
      return CONTENT_STRATEGIES.LLM_FALLBACK;
    }
  }

  /**
   * Calculate average quality across all data sources
   */
  private calculateAverageQuality(validatedData: ValidatedApiData): number {
    const qualities = [
      validatedData.travelGuide.quality.overall,
      validatedData.flights.quality.overall,
      validatedData.hotels.quality.overall,
      validatedData.visa.quality.overall,
      validatedData.currency.quality.overall,
    ];

    if (validatedData.trains) {
      qualities.push(validatedData.trains.quality.overall);
    }

    return qualities.reduce((sum, quality) => sum + quality, 0) / qualities.length;
  }

  /**
   * Helper methods
   */
  private createLowQualityScore(reason: string): DataQualityScore {
    return {
      overall: 0.1,
      completeness: 0.1,
      accuracy: 0.1,
      relevance: 0.1,
      freshness: 0.1,
      details: {
        missingFields: ['all_data'],
        inconsistencies: [],
        recommendations: [`API Error: ${reason}`]
      }
    };
  }

  private checkDestinationRelevance(apiDestination: string, inputDestination: string): number {
    if (!apiDestination || !inputDestination) return 0;
    
    const api = apiDestination.toLowerCase().trim();
    const input = inputDestination.toLowerCase().trim();
    
    if (api === input) return 1.0;
    if (api.includes(input) || input.includes(api)) return 0.8;
    
    // Check for common variations (e.g., "Dubai" vs "UAE")
    const variations: Record<string, string[]> = {
      'dubai': ['uae', 'emirates'],
      'mumbai': ['bombay', 'maharashtra'],
      'bangkok': ['thailand'],
      'singapore': ['sg'],
    };
    
    for (const [key, alts] of Object.entries(variations)) {
      if ((api.includes(key) && alts.some(alt => input.includes(alt))) ||
          (input.includes(key) && alts.some(alt => api.includes(alt)))) {
        return 0.7;
      }
    }
    
    return 0.3;
  }

  private isDomesticTravel(origin: string, destination: string): boolean {
    const indianKeywords = ['india', 'mumbai', 'delhi', 'bangalore', 'chennai', 
                           'kolkata', 'pune', 'hyderabad', 'goa', 'kerala', 
                           'rajasthan', 'kashmir', 'himachal'];
    
    const isOriginIndian = indianKeywords.some(keyword => 
      origin.toLowerCase().includes(keyword)
    );
    const isDestinationIndian = indianKeywords.some(keyword => 
      destination.toLowerCase().includes(keyword)
    );
    
    return isOriginIndian && isDestinationIndian;
  }
}

export const dataQualityAssessor = new DataQualityAssessor();