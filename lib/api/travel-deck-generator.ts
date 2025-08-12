// Enhanced Travel Deck Generator with Multi-LLM Strategy and Quality Assurance
import { openRouterClient, LLMMessage } from './openrouter';
import { MODEL_CONFIGS, TRAVEL_DECK_TYPES, getModelForCard } from './openrouter-config';
import { rapidAPIClient } from './rapidapi';
import { currencyAPI } from './currency';
import { dataQualityAssessor, ValidatedApiData } from './data-quality';
import { enhancedContentGenerator, EnhancedContentRequest } from './enhanced-content-generator';
import { unsplashClient } from './unsplash';
import { TravelDeck, TravelDeckCard } from '@/lib/types/travel-deck';
import { TravelCaptureInput } from '@/lib/types/travel';
import { v4 as uuidv4 } from 'uuid';

export class TravelDeckGenerator {
  
  /**
   * Generate a complete travel deck with all card types using real API data
   */
  async generateCompleteDeck(
    input: TravelCaptureInput,
    apiData?: any
  ): Promise<TravelDeck> {
    console.log('🚀 Starting enhanced travel deck generation with multi-LLM strategy...');
    
    const startTime = Date.now();
    const deckId = `deck_${uuidv4()}`;
    const cards: TravelDeckCard[] = [];
    
    // Step 1: Fetch and validate RapidAPI data
    let validatedApiData: ValidatedApiData;
    try {
      console.log('📡 Fetching travel data from RapidAPI...');
      const realApiData = await rapidAPIClient.getTravelData(input);
      console.log('✅ RapidAPI data fetched:', Object.keys(realApiData));
      
      // Merge with any provided API data
      const combinedApiData = {
        ...apiData,
        ...realApiData
      };
      
      // Step 2: Assess data quality and determine strategy
      console.log('🔍 Assessing API data quality...');
      validatedApiData = dataQualityAssessor.assessApiData(combinedApiData, input);
      
    } catch (error) {
      console.error('❌ Failed to fetch/validate RapidAPI data:', error);
      // Create empty validated data structure
      validatedApiData = this.createEmptyValidatedData();
    }
    
    // Step 3: Determine overall content generation strategy
    const contentStrategy = dataQualityAssessor.determineContentStrategy(validatedApiData);
    console.log(`📋 Using content strategy: ${contentStrategy}`);
    
    // Step 4: Generate cards with enhanced multi-LLM approach
    const cardPromises = TRAVEL_DECK_TYPES.map(async (cardType) => {
      try {
        console.log(`🎯 Generating ${cardType} card...`);
        const card = await this.generateEnhancedCard(cardType, input, validatedApiData, contentStrategy);
        return card;
      } catch (error) {
        console.error(`❌ Failed to generate ${cardType} card:`, error);
        // Return a basic card instead of null
        return this.createFallbackCard(cardType, input);
      }
    });
    
    // Wait for all cards to complete
    const generatedCards = await Promise.all(cardPromises);
    cards.push(...generatedCards.filter((card: any) => card !== null));
    
    // Sort cards by priority
    cards.sort((a, b) => a.priority - b.priority);
    
    const processingTime = Date.now() - startTime;
    
    // Calculate overall quality metrics
    const qualityMetrics = this.calculateDeckQualityMetrics(cards, validatedApiData);
    
    const deck: TravelDeck = {
      id: deckId,
      sessionId: input.sessionId,
      destination: input.destination,
      origin: input.origin,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cards,
      metadata: {
        travelType: input.travelType,
        duration: input.duration,
        budget: input.budget,
        travelerCount: this.getTravelerCount(input),
        generatedBy: 'Enhanced Multi-LLM System',
        version: '2.0.0',
        processingTime,
        contentStrategy,
        qualityMetrics,
        apiDataSources: this.getUsedApiSources(validatedApiData),
        averageConfidence: this.calculateAverageConfidence(cards)
      }
    };
    
    console.log(`🎉 Enhanced travel deck generated with ${cards.length} cards in ${processingTime}ms`);
    console.log(`📊 Quality: ${(qualityMetrics.overall * 100).toFixed(1)}%, Strategy: ${contentStrategy}`);
    return deck;
  }

  /**
   * Get appropriate images for specific card type
   */
  private async getCardImages(cardType: string, destination: string): Promise<{
    hero?: any;
    gallery?: any[];
    background?: any;
  } | undefined> {
    if (!unsplashClient.isConfigured()) {
      return undefined;
    }

    try {
      switch (cardType) {
        case 'trip-summary':
        case 'overview':
          const heroImages = await unsplashClient.getDestinationImages(destination, 1, 1);
          return heroImages.length > 0 ? { hero: heroImages[0] } : undefined;

        case 'attractions':
          const attractionImages = await unsplashClient.getActivityImages('attractions sightseeing', destination, 3);
          return attractionImages.length > 0 ? { gallery: attractionImages } : undefined;

        case 'dining':
          const foodImages = await unsplashClient.getFoodImages('local cuisine', destination, 2);
          return foodImages.length > 0 ? { gallery: foodImages } : undefined;

        case 'accommodation':
          const hotelImages = await unsplashClient.getAccommodationImages(destination, 'hotel', 2);
          return hotelImages.length > 0 ? { gallery: hotelImages } : undefined;

        case 'transport':
          const transportImages = await unsplashClient.getActivityImages('transportation airport train', destination, 1);
          return transportImages.length > 0 ? { background: transportImages[0] } : undefined;

        case 'itinerary':
          const itineraryImages = await unsplashClient.getDestinationImages(destination, 1, 2);
          return itineraryImages.length > 0 ? { hero: itineraryImages[0], gallery: itineraryImages.slice(1) } : undefined;

        default:
          // For other card types, get a general destination image
          const generalImages = await unsplashClient.getDestinationImages(destination, 1, 1);
          return generalImages.length > 0 ? { background: generalImages[0] } : undefined;
      }
    } catch (error) {
      console.warn(`Failed to fetch images for card type ${cardType}:`, error);
      return undefined;
    }
  }

  /**
   * Calculate quality for data relevant to specific card type
   */
  private calculateRelevantQuality(cardType: string, validatedData: ValidatedApiData): number {
    const relevantSources = this.getRelevantDataSources(cardType);
    const qualities = relevantSources.map(source => {
      const data = (validatedData as any)[source];
      return data?.quality?.overall || 0;
    });
    
    return qualities.length > 0 ? qualities.reduce((sum, q) => sum + q, 0) / qualities.length : 0;
  }
  
  /**
   * Get data sources relevant to specific card type
   */
  private getRelevantDataSources(cardType: string): string[] {
    const mapping: Record<string, string[]> = {
      overview: ['travelGuide'],
      itinerary: ['travelGuide', 'flights'],
      transport: ['flights', 'trains'],
      accommodation: ['hotels'],
      attractions: ['travelGuide'],
      dining: ['travelGuide'],
      budget: ['flights', 'hotels', 'currency'],
      visa: ['visa'],
      weather: ['travelGuide'],
      culture: ['travelGuide'],
      emergency: ['travelGuide'],
      shopping: ['travelGuide']
    };
    
    return mapping[cardType] || ['travelGuide'];
  }
  
  /**
   * Create empty validated data structure for fallback
   */
  private createEmptyValidatedData(): ValidatedApiData {
    const emptyData = {
      data: null,
      quality: {
        overall: 0.1,
        completeness: 0,
        accuracy: 0,
        relevance: 0,
        freshness: 0,
        details: { missingFields: ['all'], inconsistencies: [], recommendations: [] }
      },
      usable: false
    };
    
    return {
      travelGuide: emptyData,
      flights: emptyData,
      hotels: emptyData,
      visa: emptyData,
      currency: emptyData
    };
  }
  
  /**
   * Create fallback card when enhanced generation fails
   */
  private createFallbackCard(cardType: string, input: TravelCaptureInput): TravelDeckCard {
    const content = this.getMockContent(cardType, input);
    
    return {
      id: `fallback_${uuidv4()}`,
      type: cardType,
      title: this.getCardTitle(cardType, input.destination),
      subtitle: this.getCardSubtitle(cardType, input),
      content: {
        ...content,
        _metadata: {
          dataSource: 'fallback',
          confidence: 0.4,
          model: 'emergency_fallback',
          processingTime: 0,
          qualityScore: 0.3,
          strategy: 'emergency',
          qualityIndicators: {
            completeness: 0.5,
            accuracy: 0.4,
            relevance: 0.6,
            actionability: 0.3
          }
        }
      },
      priority: this.getCardPriority(cardType),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as TravelDeckCard;
  }
  
  /**
   * Calculate deck-wide quality metrics
   */
  private calculateDeckQualityMetrics(cards: TravelDeckCard[], validatedData: ValidatedApiData): any {
    const confidences = cards.map(card => card.content._metadata?.confidence || 0.4);
    const apiSources = cards.filter(card => card.content._metadata?.dataSource === 'api').length;
    const llmEnhanced = cards.filter(card => card.content._metadata?.dataSource === 'llm_enhanced').length;
    const llmGenerated = cards.filter(card => card.content._metadata?.dataSource === 'llm_generated').length;
    
    return {
      overall: confidences.reduce((sum, c) => sum + c, 0) / confidences.length,
      apiDataCards: apiSources,
      llmEnhancedCards: llmEnhanced,
      llmGeneratedCards: llmGenerated,
      totalCards: cards.length,
      dataSourceBreakdown: {
        api: (apiSources / cards.length * 100).toFixed(1) + '%',
        llm_enhanced: (llmEnhanced / cards.length * 100).toFixed(1) + '%',
        llm_generated: (llmGenerated / cards.length * 100).toFixed(1) + '%'
      }
    };
  }
  
  /**
   * Get list of API sources that provided usable data
   */
  private getUsedApiSources(validatedData: ValidatedApiData): string[] {
    const sources: string[] = [];
    
    Object.entries(validatedData).forEach(([key, data]) => {
      if (data.usable) {
        sources.push(key);
      }
    });
    
    return sources;
  }
  
  /**
   * Calculate average confidence across all cards
   */
  private calculateAverageConfidence(cards: TravelDeckCard[]): number {
    const confidences = cards.map(card => card.content._metadata?.confidence || 0.4);
    return confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
  }
  
  /**
   * Generate enhanced card with multi-LLM strategy and quality assurance
   */
  private async generateEnhancedCard(
    cardType: typeof TRAVEL_DECK_TYPES[number],
    input: TravelCaptureInput,
    validatedApiData: ValidatedApiData,
    contentStrategy: string
  ): Promise<TravelDeckCard> {
    // Calculate average quality for this card's relevant data
    const relevantQuality = this.calculateRelevantQuality(cardType, validatedApiData);
    
    // Create enhanced content request
    const contentRequest: EnhancedContentRequest = {
      cardType,
      input,
      validatedApiData,
      strategy: contentStrategy as any,
      qualityScore: relevantQuality
    };
    
    // Generate content using enhanced multi-LLM system
    const generatedContent = await enhancedContentGenerator.generateCardContent(contentRequest);
    
    // Fetch images for the card
    const cardImages = await this.getCardImages(cardType, input.destination).catch(error => {
      console.warn(`Failed to fetch images for ${cardType}:`, error);
      return undefined;
    });

    // Create card with quality metadata
    const card: TravelDeckCard = {
      id: `card_${uuidv4()}`,
      type: cardType,
      title: this.getCardTitle(cardType, input.destination),
      subtitle: this.getCardSubtitle(cardType, input),
      content: {
        ...generatedContent.content,
        _metadata: {
          dataSource: generatedContent.dataSource,
          confidence: generatedContent.confidence,
          model: generatedContent.model,
          processingTime: generatedContent.processingTime,
          qualityScore: relevantQuality,
          strategy: contentStrategy,
          qualityIndicators: generatedContent.qualityIndicators
        }
      },
      priority: this.getCardPriority(cardType),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      images: cardImages
    } as TravelDeckCard;
    
    console.log(`✅ Generated ${cardType} card: ${generatedContent.dataSource} source, ${(generatedContent.confidence * 100).toFixed(1)}% confidence`);
    return card;
  }

  /**
   * Legacy method - Generate a specific card type using real API data
   */
  private async generateCard(
    cardType: typeof TRAVEL_DECK_TYPES[number],
    input: TravelCaptureInput,
    apiData?: any
  ): Promise<TravelDeckCard | null> {
    const isDomestic = this.isDomesticTravel(input.origin, input.destination);
    
    // Try to use real API data first
    let content: any;
    try {
      content = await this.generateRealContent(cardType, input, apiData, isDomestic);
      console.log(`Generated real content for ${cardType}`);
    } catch (error) {
      console.warn(`Failed to generate real content for ${cardType}, falling back to LLM:`, error);
      
      // Fallback to LLM generation with real API data as context
      const systemPrompt = this.getSystemPrompt(cardType, isDomestic);
      const userPrompt = this.getUserPrompt(cardType, input, apiData);
      
      try {
        const response = await openRouterClient.generateContent(
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          MODEL_CONFIGS.TRAVEL_PLANNING
        );
        
        // Parse JSON response
        content = this.parseJsonResponse(response.content);
        
        if (!content) {
          throw new Error('Failed to parse LLM response');
        }
      } catch (llmError) {
        console.error(`LLM fallback failed for ${cardType}:`, llmError);
        // Final fallback to enhanced mock content
        content = this.getMockContent(cardType, input);
      }
    }
    
    // Create card structure
    const card: TravelDeckCard = {
      id: `card_${uuidv4()}`,
      type: cardType,
      title: this.getCardTitle(cardType, input.destination),
      subtitle: this.getCardSubtitle(cardType, input),
      content,
      priority: this.getCardPriority(cardType),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as TravelDeckCard;
    
    return card;
  }
  
  /**
   * Generate real content using API data instead of LLM
   */
  private async generateRealContent(
    cardType: string,
    input: TravelCaptureInput,
    apiData: any,
    isDomestic: boolean
  ): Promise<any> {
    const localCurrency = isDomestic ? 'INR' : this.getDestinationCurrency(input.destination);
    
    switch (cardType) {
      case 'trip-summary':
        return await this.generateTripSummaryFromAPI(input, apiData, isDomestic);
      
      case 'itinerary':
        return this.generateItineraryFromAPI(input, apiData, isDomestic);
      
      case 'transport':
        return this.generateTransportFromAPI(input, apiData, isDomestic);
      
      case 'accommodation':
        return this.generateAccommodationFromAPI(input, apiData, isDomestic);
      
      case 'attractions':
        return this.generateAttractionsFromAPI(input, apiData, isDomestic);
      
      case 'dining':
        return this.generateDiningFromAPI(input, apiData, isDomestic);
      
      case 'budget':
        return await this.generateBudgetFromAPI(input, apiData, isDomestic);
      
      case 'visa':
        return this.generateVisaFromAPI(input, apiData, isDomestic);
      
      case 'weather':
        return this.generateWeatherFromAPI(input, apiData, isDomestic);
      
      case 'culture':
        return this.generateCultureFromAPI(input, apiData, isDomestic);
      
      case 'emergency':
        return this.generateEmergencyFromAPI(input, apiData, isDomestic);
      
      case 'shopping':
        return this.generateShoppingFromAPI(input, apiData, isDomestic);
      
      default:
        throw new Error(`Unknown card type: ${cardType}`);
    }
  }

  private getSystemPrompt(cardType: string, isDomestic: boolean): string {
    const basePrompt = `You are an expert travel planner creating comprehensive travel cards for Indian travelers using real API data.
    
CRITICAL REQUIREMENTS:
1. Use the provided API data as the PRIMARY source of information
2. Format prices in appropriate currency (INR for domestic, local + INR for international)
3. Focus on Indian traveler needs (vegetarian food, visa requirements for Indian passport)
4. Provide practical, actionable information
5. Be specific with timings, costs, and locations from API data
6. Return ONLY valid JSON, no markdown or additional text

TRAVEL TYPE: ${isDomestic ? 'Domestic (within India)' : 'International'}`;

    const cardPrompts: Record<string, string> = {
      overview: `${basePrompt}\nCreate an overview card using the travel guide API data. Include destination highlights, best time to visit, languages, and quick tips.`,
      
      itinerary: `${basePrompt}\nCreate a detailed day-by-day itinerary using attractions and travel guide data. Include activities, timings, locations, and costs from API.`,
      
      transport: `${basePrompt}\nCreate a transport card using flight and train API data. Include real flight prices, timings, and booking information.`,
      
      accommodation: `${basePrompt}\nCreate an accommodation card using hotel API data. Include real hotel prices, ratings, amenities, and booking links.`,
      
      attractions: `${basePrompt}\nCreate an attractions card using attractions API data. Include real entry fees, ratings, timings, and booking requirements.`,
      
      dining: `${basePrompt}\nCreate a dining card using travel guide data. Focus on vegetarian/vegan options and real restaurant recommendations.`,
      
      budget: `${basePrompt}\nCreate a comprehensive budget card using real flight, hotel, and attraction prices from API data.`,
      
      visa: `${basePrompt}\nCreate a visa card using visa API data for Indian passport holders. Include real requirements, costs, and processing times.`,
      
      weather: `${basePrompt}\nCreate a weather card using weather API data. Include real seasonal information and packing recommendations.`,
      
      culture: `${basePrompt}\nCreate a culture card using travel guide API data. Include customs, etiquette, and cultural insights.`,
      
      emergency: `${basePrompt}\nCreate an emergency card with real emergency numbers and embassy information from API data.`,
      
      shopping: `${basePrompt}\nCreate a shopping card using travel guide data. Include real markets, prices, and customs information.`
    };
    
    return cardPrompts[cardType] || basePrompt;
  }
  
  private getUserPrompt(
    cardType: string,
    input: TravelCaptureInput,
    apiData?: any
  ): string {
    const context = `
Destination: ${input.destination}
Origin: ${input.origin}
Duration: ${input.duration}
Budget: ${input.budget}
Travel Type: ${input.travelType}
Travel Style: ${input.travelStyle}
Dietary: ${input.dietary}
Season: ${input.season}
Motivation: ${input.motivation}

${apiData ? `Available API Data:
${JSON.stringify(apiData, null, 2).substring(0, 1000)}...` : ''}`;

    return `${context}

Generate a ${cardType} card with comprehensive, practical information.
Return ONLY the JSON content for the card.`;
  }
  
  private parseJsonResponse(response: string): any {
    try {
      // Clean response
      const cleaned = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      // Find JSON object
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      return null;
    }
  }
  
  private getCardTitle(cardType: string, destination: string): string {
    const titles: Record<string, string> = {
      'trip-summary': `${destination} Trip Overview`,
      itinerary: 'Your Journey Itinerary',
      transport: 'Transportation Guide',
      accommodation: 'Where to Stay',
      attractions: 'Must-See & Do',
      dining: 'Food & Dining',
      budget: 'Detailed Budget Breakdown',
      visa: 'Visa & Documentation',
      weather: 'Weather & Packing',
      culture: 'Culture & Customs',
      emergency: 'Emergency Information',
      shopping: 'Shopping Guide'
    };
    
    return titles[cardType] || cardType;
  }
  
  private getCardSubtitle(cardType: string, input: TravelCaptureInput): string {
    const subtitles: Record<string, string> = {
      'trip-summary': `${input.duration} ${input.budget.toLowerCase()} trip for ${this.getTravelerCount(input)} travelers`,
      itinerary: `Day-by-day plan for your ${input.duration} journey`,
      transport: 'Flights, trains, and local transport',
      accommodation: `${input.budget} tier options`,
      attractions: 'Top places and experiences',
      dining: 'Restaurants and local cuisine',
      budget: `Detailed ${input.budget.toLowerCase()} budget breakdown`,
      visa: 'For Indian passport holders',
      weather: `${input.season} season travel`,
      culture: 'Local customs and etiquette',
      emergency: 'Important contacts and safety',
      shopping: 'Markets and souvenirs'
    };
    
    return subtitles[cardType] || '';
  }
  
  private getCardPriority(cardType: string): number {
    const priorities: Record<string, number> = {
      'trip-summary': 1,
      itinerary: 2,
      transport: 3,
      accommodation: 4,
      attractions: 5,
      dining: 6,
      budget: 7,
      visa: 8,
      weather: 9,
      culture: 10,
      emergency: 11,
      shopping: 12
    };
    
    return priorities[cardType] || 99;
  }
  
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
  
  private getMockCard(cardType: string, input: TravelCaptureInput): TravelDeckCard {
    // Return a basic mock card structure
    return {
      id: `mock_${uuidv4()}`,
      type: cardType,
      title: this.getCardTitle(cardType, input.destination),
      subtitle: this.getCardSubtitle(cardType, input),
      content: this.getMockContent(cardType, input),
      priority: this.getCardPriority(cardType),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as any;
  }
  
  private getMockContent(cardType: string, input: TravelCaptureInput): any {
    const isDomestic = this.isDomesticTravel(input.origin, input.destination);
    const localCurrency = isDomestic ? 'INR' : this.getDestinationCurrency(input.destination);
    
    // Return comprehensive mock content based on card type
    const mockContents: Record<string, any> = {
      'trip-summary': {
        destination: input.destination,
        country: isDomestic ? 'India' : this.getCountryFromDestination(input.destination),
        duration: input.duration,
        travelType: input.travelType,
        travelerCount: this.getTravelerCount(input),
        budget: input.budget,
        highlights: this.getDestinationHighlights(input.destination),
        totalBudget: {
          formatted: isDomestic ? '₹25,000' : '$800 (₹66,000)',
          formattedPerPerson: isDomestic ? '₹12,500' : '$400 (₹33,000)'
        },
        budgetBreakdown: {
          flights: { formatted: isDomestic ? '₹8,000' : '$300 (₹25,000)' },
          accommodation: { 
            formatted: isDomestic ? '₹10,000' : '$200 (₹16,500)', 
            perNight: isDomestic ? '₹3,500' : '$65 (₹5,400)' 
          },
          dailyExpenses: { 
            formatted: isDomestic ? '₹7,000' : '$300 (₹25,000)', 
            perDay: isDomestic ? '₹2,300' : '$100 (₹8,300)' 
          }
        },
        quickTips: [
          'Book flights 2-3 months in advance',
          isDomestic ? 'Budget ₹2,500/day for comfortable travel' : 'Budget $100/day for comfortable travel',
          isDomestic ? 'Carry cash for local vendors' : 'Notify bank about international travel',
          'Check visa requirements early'
        ],
        bestTime: 'October to March',
        currency: localCurrency,
        languages: this.getDestinationLanguages(input.destination),
        weatherHint: 'Pleasant weather expected for your travel season',
        isDomestic
      },
      
      itinerary: {
        duration: input.duration,
        days: this.generateMockItinerary(input.destination, input.duration, isDomestic)
      },
      
      transport: {
        destination: input.destination,
        origin: input.origin,
        flights: this.getMockFlightInfo(input.origin, input.destination, isDomestic),
        localTransport: this.getMockLocalTransport(input.destination, isDomestic),
        tips: ['Book flights early', 'Check visa requirements', 'Download offline maps']
      },
      
      accommodation: {
        destination: input.destination,
        currency: localCurrency,
        options: this.getMockAccommodationOptions(input.destination, isDomestic),
        bookingTips: ['Compare prices on multiple platforms', 'Read recent reviews', 'Check cancellation policy']
      },
      
      attractions: {
        destination: input.destination,
        currency: localCurrency,
        attractions: this.getMockAttractions(input.destination, isDomestic)
      },
      
      dining: {
        destination: input.destination,
        currency: localCurrency,
        restaurants: this.getMockDiningOptions(input.destination, isDomestic),
        localCuisine: this.getMockLocalCuisine(input.destination),
        dietaryOptions: this.getMockDietaryOptions(input.destination, isDomestic)
      },
      
      budget: this.getMockBudgetContent(input.destination, input.budget, isDomestic),
      
      visa: {
        destination: input.destination,
        required: !isDomestic,
        indianPassport: true,
        requirements: this.getMockVisaRequirements(input.destination, isDomestic),
        process: this.getMockVisaProcess(input.destination, isDomestic),
        fees: this.getMockVisaFees(input.destination, isDomestic)
      },
      
      weather: {
        destination: input.destination,
        season: input.season,
        climate: this.getMockWeatherInfo(input.destination),
        packing: this.getMockPackingList(input.destination, input.season)
      },
      
      culture: {
        destination: input.destination,
        customs: this.getMockCulturalInfo(input.destination, isDomestic),
        etiquette: this.getMockEtiquette(input.destination, isDomestic),
        phrases: this.getMockUsefulPhrases(input.destination, isDomestic)
      },
      
      emergency: {
        destination: input.destination,
        indianEmbassy: this.getMockEmbassyInfo(input.destination, isDomestic),
        emergencyNumbers: this.getMockEmergencyNumbers(input.destination, isDomestic),
        hospitals: this.getMockHospitals(input.destination, isDomestic),
        safetyTips: this.getMockSafetyTips(input.destination, isDomestic)
      },
      
      shopping: {
        destination: input.destination,
        currency: localCurrency,
        markets: this.getMockShoppingInfo(input.destination, isDomestic),
        souvenirs: this.getMockSouvenirs(input.destination),
        customsLimits: this.getMockCustomsLimits(isDomestic)
      }
    };
    
    return mockContents[cardType] || { 
      destination: input.destination,
      content: `Comprehensive ${cardType} information for ${input.destination}`,
      tips: ['Plan ahead', 'Check local requirements', 'Book accommodations early'],
      currency: localCurrency
    };
  }

  // Real API content generation methods
  private async generateTripSummaryFromAPI(input: TravelCaptureInput, apiData: any, isDomestic: boolean): Promise<any> {
    const localCurrency = isDomestic ? 'INR' : this.getDestinationCurrency(input.destination);
    const travelGuide = apiData?.travelGuide;
    const flights = apiData?.flights;
    const hotels = apiData?.hotels;
    
    // Use RapidAPI pricing calculations for summary
    const flightPricing = rapidAPIClient.calculateAverageFlightPrice(Array.isArray(flights) ? flights : []);
    const hotelPricing = rapidAPIClient.calculateAverageHotelPrice(Array.isArray(hotels) ? hotels : []);
    
    const duration = parseInt(input.duration) || 3;
    const travelerCount = this.getTravelerCount(input);
    
    // Calculate budget overview
    const flightCostPerPerson = flightPricing.average || (isDomestic ? 8000 : 25000);
    const totalFlightCost = flightCostPerPerson * travelerCount;
    
    let accommodationDaily = hotelPricing.overall.average;
    if (input.budget === 'Tight' && hotelPricing.budget.average > 0) {
      accommodationDaily = hotelPricing.budget.average;
    } else if (input.budget === 'Luxury' && hotelPricing.luxury.average > 0) {
      accommodationDaily = hotelPricing.luxury.average;
    } else if (hotelPricing.midRange.average > 0) {
      accommodationDaily = hotelPricing.midRange.average;
    }
    
    if (!accommodationDaily || accommodationDaily === 0) {
      accommodationDaily = isDomestic ? 
        (input.budget === 'Tight' ? 1800 : input.budget === 'Luxury' ? 8000 : 3500) :
        (input.budget === 'Tight' ? 4500 : input.budget === 'Luxury' ? 18000 : 8500);
    }
    
    const budgetMultiplier = input.budget === 'Tight' ? 0.7 : input.budget === 'Luxury' ? 1.8 : 1.0;
    const foodDaily = Math.round((isDomestic ? 1200 : 2000) * budgetMultiplier);
    const transportDaily = Math.round((isDomestic ? 800 : 1500) * budgetMultiplier);
    const activitiesDaily = Math.round((isDomestic ? 1000 : 2000) * budgetMultiplier);
    
    const dailyTotal = accommodationDaily + foodDaily + transportDaily + activitiesDaily;
    const tripTotal = (dailyTotal * duration) + totalFlightCost;
    const perPersonTotal = Math.round(tripTotal / travelerCount);

    // Exchange rate calculation
    let exchangeRate = null;
    let inrEquivalent = null;
    
    if (!isDomestic) {
      try {
        const rate = await currencyAPI.getExchangeRate(localCurrency, 'INR');
        if (rate) {
          exchangeRate = rate.rate;
          inrEquivalent = {
            total: Math.round(tripTotal * rate.rate),
            perPerson: Math.round(perPersonTotal * rate.rate)
          };
        }
      } catch (error) {
        exchangeRate = this.getMockExchangeRate(localCurrency);
        inrEquivalent = {
          total: Math.round(tripTotal * exchangeRate),
          perPerson: Math.round(perPersonTotal * exchangeRate)
        };
      }
    }

    return {
      destination: input.destination,
      country: isDomestic ? 'India' : this.getCountryFromDestination(input.destination),
      duration: input.duration,
      travelType: input.travelType,
      travelerCount: travelerCount,
      budget: input.budget,
      
      // Trip highlights from API data
      highlights: travelGuide?.attractions?.slice(0, 4).map((attr: any) => attr.name) || 
                 this.getDestinationHighlights(input.destination),
      
      // Budget summary
      totalBudget: {
        amount: tripTotal,
        perPerson: perPersonTotal,
        currency: localCurrency,
        currencySymbol: this.getCurrencySymbol(localCurrency),
        formatted: `${this.getCurrencySymbol(localCurrency)}${tripTotal.toLocaleString()}`,
        formattedPerPerson: `${this.getCurrencySymbol(localCurrency)}${perPersonTotal.toLocaleString()}`
      },
      
      inrEquivalent: inrEquivalent ? {
        total: inrEquivalent.total,
        perPerson: inrEquivalent.perPerson,
        formatted: `₹${inrEquivalent.total.toLocaleString()}`,
        formattedPerPerson: `₹${inrEquivalent.perPerson.toLocaleString()}`
      } : null,
      
      // Quick budget breakdown
      budgetBreakdown: {
        flights: {
          amount: totalFlightCost,
          formatted: `${this.getCurrencySymbol(localCurrency)}${totalFlightCost.toLocaleString()}`
        },
        accommodation: {
          amount: accommodationDaily * duration,
          formatted: `${this.getCurrencySymbol(localCurrency)}${(accommodationDaily * duration).toLocaleString()}`,
          perNight: `${this.getCurrencySymbol(localCurrency)}${accommodationDaily.toLocaleString()}`
        },
        dailyExpenses: {
          amount: (foodDaily + transportDaily + activitiesDaily) * duration,
          formatted: `${this.getCurrencySymbol(localCurrency)}${((foodDaily + transportDaily + activitiesDaily) * duration).toLocaleString()}`,
          perDay: `${this.getCurrencySymbol(localCurrency)}${(foodDaily + transportDaily + activitiesDaily).toLocaleString()}`
        }
      },
      
      // Pricing insights
      pricingInsights: {
        flightRange: flightPricing.formattedRange,
        hotelRange: hotelPricing.overall.formattedRange,
        dataQuality: flightPricing.average > 0 && hotelPricing.overall.average > 0 ? 'Real pricing data' : 'Estimated pricing'
      },
      
      // Key travel info
      bestTime: travelGuide?.localInfo?.bestTimeToVisit || 'October to March',
      currency: localCurrency,
      languages: this.getDestinationLanguages(input.destination),
      
      // Quick tips
      quickTips: [
        `Book ${duration} days in advance for better flight rates`,
        `Budget ${this.getCurrencySymbol(localCurrency)}${(dailyTotal).toLocaleString()} per day for comfortable travel`,
        isDomestic ? 'Carry cash for local vendors' : 'Notify bank about international travel',
        'Check visa requirements and book accommodations early'
      ],
      
      // Weather hint
      weatherHint: travelGuide?.localInfo?.weather || this.getSeasonalWeather(input.destination, input.season),
      
      isDomestic,
      exchangeRate
    };
  }

  private generateOverviewFromAPI(input: TravelCaptureInput, apiData: any, isDomestic: boolean): any {
    const travelGuide = apiData?.travelGuide;
    const localCurrency = isDomestic ? 'INR' : this.getDestinationCurrency(input.destination);
    
    return {
      destination: input.destination,
      country: isDomestic ? 'India' : this.getCountryFromDestination(input.destination),
      duration: input.duration,
      travelType: input.travelType,
      highlights: travelGuide?.attractions?.map((attr: any) => attr.name) || this.getDestinationHighlights(input.destination),
      bestTime: travelGuide?.localInfo?.bestTimeToVisit || 'October to March',
      currency: localCurrency,
      currencySymbol: this.getCurrencySymbol(localCurrency),
      languages: this.getDestinationLanguages(input.destination),
      quickTips: this.getDestinationTips(input.destination, isDomestic),
      localInfo: travelGuide?.localInfo || {
        weather: 'Pleasant',
        culture: 'Rich cultural heritage',
        safety: 'Generally safe for tourists'
      }
    };
  }

  private generateTransportFromAPI(input: TravelCaptureInput, apiData: any, isDomestic: boolean): any {
    const flights = apiData?.flights;
    const trains = apiData?.trains;
    
    return {
      destination: input.destination,
      origin: input.origin,
      flights: this.processFlightData(flights, isDomestic),
      trains: isDomestic ? this.processTrainData(trains) : null,
      localTransport: this.getMockLocalTransport(input.destination, isDomestic),
      tips: ['Book flights early for better rates', 'Check visa requirements', 'Download offline maps', 'Keep transport receipts']
    };
  }

  private generateAccommodationFromAPI(input: TravelCaptureInput, apiData: any, isDomestic: boolean): any {
    const hotels = apiData?.hotels;
    const localCurrency = isDomestic ? 'INR' : this.getDestinationCurrency(input.destination);
    
    return {
      destination: input.destination,
      currency: localCurrency,
      currencySymbol: this.getCurrencySymbol(localCurrency),
      options: this.processHotelData(hotels, isDomestic),
      bookingTips: [
        'Compare prices on multiple platforms',
        'Read recent reviews carefully',
        'Check cancellation policy',
        'Verify location on map',
        'Confirm amenities before booking'
      ]
    };
  }

  private generateAttractionsFromAPI(input: TravelCaptureInput, apiData: any, isDomestic: boolean): any {
    const travelGuide = apiData?.travelGuide;
    const localCurrency = isDomestic ? 'INR' : this.getDestinationCurrency(input.destination);
    
    const attractions = travelGuide?.attractions || [];
    
    return {
      destination: input.destination,
      currency: localCurrency,
      currencySymbol: this.getCurrencySymbol(localCurrency),
      attractions: attractions.map((attr: any) => ({
        name: attr.name,
        type: attr.type || 'Attraction',
        description: attr.description,
        rating: attr.rating || 4.0,
        entryFee: this.estimateAttractionFee(attr, isDomestic),
        tips: attr.tips || 'Best visited early morning',
        timeNeeded: '2-3 hours',
        location: input.destination
      }))
    };
  }

  private generateDiningFromAPI(input: TravelCaptureInput, apiData: any, isDomestic: boolean): any {
    const travelGuide = apiData?.travelGuide;
    const localCurrency = isDomestic ? 'INR' : this.getDestinationCurrency(input.destination);
    
    const foodAttractions = travelGuide?.attractions?.filter((attr: any) => attr.type === 'Food') || [];
    
    return {
      destination: input.destination,
      currency: localCurrency,
      currencySymbol: this.getCurrencySymbol(localCurrency),
      restaurants: this.processFoodData(foodAttractions, isDomestic),
      localCuisine: this.getMockLocalCuisine(input.destination),
      dietaryOptions: this.getMockDietaryOptions(input.destination, isDomestic),
      tips: [
        'Try local specialties',
        'Ask for vegetarian options',
        'Check hygiene standards',
        'Carry hand sanitizer'
      ]
    };
  }

  private async generateBudgetFromAPI(input: TravelCaptureInput, apiData: any, isDomestic: boolean): Promise<any> {
    const localCurrency = isDomestic ? 'INR' : this.getDestinationCurrency(input.destination);
    const flights = apiData?.flights;
    const hotels = apiData?.hotels;
    
    // Use RapidAPI pricing calculations
    const flightPricing = rapidAPIClient.calculateAverageFlightPrice(Array.isArray(flights) ? flights : []);
    const hotelPricing = rapidAPIClient.calculateAverageHotelPrice(Array.isArray(hotels) ? hotels : []);
    
    const duration = parseInt(input.duration) || 3;
    const travelerCount = this.getTravelerCount(input);
    
    // Use averaged pricing from API data
    const flightCostPerPerson = flightPricing.average || (isDomestic ? 8000 : 25000);
    const totalFlightCost = flightCostPerPerson * travelerCount;
    
    // Use hotel category based on budget level
    let accommodationDaily = hotelPricing.overall.average;
    if (input.budget === 'Tight' && hotelPricing.budget.average > 0) {
      accommodationDaily = hotelPricing.budget.average;
    } else if (input.budget === 'Luxury' && hotelPricing.luxury.average > 0) {
      accommodationDaily = hotelPricing.luxury.average;
    } else if (hotelPricing.midRange.average > 0) {
      accommodationDaily = hotelPricing.midRange.average;
    }
    
    // Fallback to reasonable defaults if no API data
    if (!accommodationDaily || accommodationDaily === 0) {
      accommodationDaily = isDomestic ? 
        (input.budget === 'Tight' ? 1800 : input.budget === 'Luxury' ? 8000 : 3500) :
        (input.budget === 'Tight' ? 4500 : input.budget === 'Luxury' ? 18000 : 8500);
    }
    
    // Other daily costs based on budget level and destination
    const budgetMultiplier = input.budget === 'Tight' ? 0.7 : input.budget === 'Luxury' ? 1.8 : 1.0;
    const foodDaily = Math.round((isDomestic ? 1200 : 2000) * budgetMultiplier);
    const transportDaily = Math.round((isDomestic ? 800 : 1500) * budgetMultiplier);
    const activitiesDaily = Math.round((isDomestic ? 1000 : 2000) * budgetMultiplier);
    
    const dailyTotal = accommodationDaily + foodDaily + transportDaily + activitiesDaily;
    const tripTotal = (dailyTotal * duration) + totalFlightCost;
    
    const budget = {
      level: input.budget || 'Comfortable',
      total: tripTotal,
      daily: dailyTotal,
      perPerson: Math.round(tripTotal / travelerCount),
      breakdown: {
        flights: totalFlightCost,
        accommodation: accommodationDaily * duration,
        food: foodDaily * duration,
        transport: transportDaily * duration,
        activities: activitiesDaily * duration,
        shopping: Math.round(dailyTotal * duration * 0.15),
        miscellaneous: Math.round(dailyTotal * duration * 0.1)
      },
      pricingInsights: {
        flightRange: flightPricing.formattedRange,
        hotelRange: hotelPricing.overall.formattedRange,
        hotelByCategory: {
          budget: hotelPricing.budget.formatted,
          midRange: hotelPricing.midRange.formatted,
          luxury: hotelPricing.luxury.formatted
        }
      }
    };

    let exchangeRate = null;
    let inrEquivalent = null;
    
    if (!isDomestic) {
      try {
        const rate = await currencyAPI.getExchangeRate(localCurrency, 'INR');
        if (rate) {
          exchangeRate = rate.rate;
          inrEquivalent = {
            total: Math.round(budget.total * rate.rate),
            daily: Math.round(budget.daily * rate.rate),
            perPerson: Math.round(budget.perPerson * rate.rate)
          };
        }
      } catch (error) {
        console.warn('Failed to get real exchange rate, using mock:', error);
        exchangeRate = this.getMockExchangeRate(localCurrency);
        inrEquivalent = {
          total: Math.round(budget.total * exchangeRate),
          daily: Math.round(budget.daily * exchangeRate),
          perPerson: Math.round(budget.perPerson * exchangeRate)
        };
      }
    }

    return {
      destination: input.destination,
      currency: localCurrency,
      currencySymbol: this.getCurrencySymbol(localCurrency),
      isDomestic,
      exchangeRate,
      budget,
      inrEquivalent,
      travelerCount,
      tips: [
        'Book flights and accommodations in advance for better rates',
        'Consider traveling during off-peak seasons for significant savings',
        isDomestic ? 'Carry cash for small vendors and local transport' : 'Notify your bank about international travel',
        'Compare prices on multiple booking platforms',
        'Keep all receipts for expense tracking'
      ],
      realData: {
        flightPricingUsed: flightPricing.formattedRange,
        hotelPricingUsed: hotelPricing.overall.formattedRange,
        source: 'RapidAPI + Real Exchange Rates',
        dataQuality: flightPricing.average > 0 && hotelPricing.overall.average > 0 ? 'High' : 'Estimated'
      }
    };
  }

  private generateVisaFromAPI(input: TravelCaptureInput, apiData: any, isDomestic: boolean): any {
    if (isDomestic) {
      return {
        destination: input.destination,
        required: false,
        indianPassport: true,
        documents: ['Valid Government Photo ID (Aadhaar, Passport, Driving License)'],
        notes: 'No visa required for domestic travel within India'
      };
    }

    const visa = apiData?.visa;
    
    return {
      destination: input.destination,
      required: true,
      indianPassport: true,
      type: visa?.type || 'Tourist Visa',
      duration: visa?.duration || '30 days',
      cost: visa?.cost || 2500,
      processingTime: visa?.processingTime || '3-5 business days',
      requirements: visa?.requirements || visa?.documents || [
        'Valid Indian Passport (6+ months validity)',
        'Recent passport-size photographs',
        'Travel itinerary',
        'Bank statements (3 months)',
        'Hotel bookings confirmation',
        'Return flight tickets'
      ],
      process: visa?.process || [
        'Fill online visa application',
        'Upload required documents',
        'Pay visa fees online',
        'Schedule appointment if required',
        'Submit passport for processing',
        'Collect passport with visa'
      ],
      fees: {
        visa: visa?.cost || 2500,
        service: 500,
        total: (visa?.cost || 2500) + 500
      },
      embassyInfo: {
        address: visa?.embassyAddress || `${input.destination} Embassy/Consulate, New Delhi`,
        phone: '+91-11-XXXXXXXX',
        email: `visa@${input.destination.toLowerCase().replace(/\s+/g, '')}-embassy.in`
      },
      onArrival: visa?.onArrival || false,
      eVisa: visa?.eVisa || true,
      notes: visa?.notes || `Tourist visa required for Indian passport holders visiting ${input.destination}`
    };
  }

  private generateItineraryFromAPI(input: TravelCaptureInput, apiData: any, isDomestic: boolean): any {
    const travelGuide = apiData?.travelGuide;
    const attractions = travelGuide?.attractions || [];
    const duration = parseInt(input.duration) || 3;
    
    const days = [];
    for (let i = 1; i <= Math.min(duration, 7); i++) {
      const dayAttractions = attractions.slice((i - 1) * 2, i * 2);
      
      days.push({
        day: i,
        title: `Day ${i} - ${this.getDayTitle(input.destination, i)}`,
        activities: [
          {
            time: '09:00',
            title: dayAttractions[0]?.name || `Morning Exploration`,
            description: dayAttractions[0]?.description || `Explore ${input.destination} morning attractions`,
            location: input.destination,
            cost: this.estimateActivityCost(dayAttractions[0], isDomestic),
            rating: dayAttractions[0]?.rating || 4.0,
            tips: dayAttractions[0]?.tips || 'Best visited early morning'
          },
          {
            time: '14:00',
            title: dayAttractions[1]?.name || `Afternoon Activity`,
            description: dayAttractions[1]?.description || `Visit popular ${input.destination} landmarks`,
            location: input.destination,
            cost: this.estimateActivityCost(dayAttractions[1], isDomestic),
            rating: dayAttractions[1]?.rating || 4.2,
            tips: dayAttractions[1]?.tips || 'Good time for photos'
          },
          {
            time: '19:00',
            title: 'Evening Leisure',
            description: `Local dining and evening activities`,
            location: input.destination,
            cost: isDomestic ? '₹800-1500' : this.formatForeignCurrency(35, input.destination),
            tips: 'Try local cuisine'
          }
        ]
      });
    }

    return {
      duration: input.duration,
      days: days,
      totalActivities: days.reduce((sum, day) => sum + day.activities.length, 0),
      estimatedCost: this.calculateItineraryCost(days, isDomestic),
      tips: [
        'Start early to avoid crowds',
        'Keep backup plans for weather',
        'Book popular attractions in advance',
        'Try local food at each location'
      ]
    };
  }

  private generateWeatherFromAPI(input: TravelCaptureInput, apiData: any, isDomestic: boolean): any {
    // Note: We can add weather API integration here later
    return this.getMockWeatherInfo(input.destination);
  }

  private generateCultureFromAPI(input: TravelCaptureInput, apiData: any, isDomestic: boolean): any {
    const travelGuide = apiData?.travelGuide;
    
    return {
      destination: input.destination,
      customs: travelGuide?.localInfo?.culture ? [travelGuide.localInfo.culture] : this.getMockCulturalInfo(input.destination, isDomestic),
      etiquette: this.getMockEtiquette(input.destination, isDomestic),
      phrases: this.getMockUsefulPhrases(input.destination, isDomestic),
      safety: travelGuide?.localInfo?.safety || 'Exercise normal precautions'
    };
  }

  private generateEmergencyFromAPI(input: TravelCaptureInput, apiData: any, isDomestic: boolean): any {
    return {
      destination: input.destination,
      indianEmbassy: this.getMockEmbassyInfo(input.destination, isDomestic),
      emergencyNumbers: this.getMockEmergencyNumbers(input.destination, isDomestic),
      hospitals: this.getMockHospitals(input.destination, isDomestic),
      safetyTips: this.getMockSafetyTips(input.destination, isDomestic)
    };
  }

  private generateShoppingFromAPI(input: TravelCaptureInput, apiData: any, isDomestic: boolean): any {
    const localCurrency = isDomestic ? 'INR' : this.getDestinationCurrency(input.destination);
    
    return {
      destination: input.destination,
      currency: localCurrency,
      currencySymbol: this.getCurrencySymbol(localCurrency),
      markets: this.getMockShoppingInfo(input.destination, isDomestic),
      souvenirs: this.getMockSouvenirs(input.destination),
      customsLimits: this.getMockCustomsLimits(isDomestic)
    };
  }

  // API data processing helpers
  private processFlightData(flights: any, isDomestic: boolean): any {
    if (!flights || !Array.isArray(flights)) {
      return {
        available: false,
        message: 'Flight data not available',
        estimated: isDomestic ? '₹8,000 - ₹15,000' : '$300 - $800'
      };
    }

    return {
      available: true,
      options: flights.slice(0, 3).map((flight: any) => ({
        airline: flight.airline || 'Airline',
        price: this.formatPrice(flight.price, isDomestic),
        duration: flight.duration || '2-3 hours',
        stops: flight.stops || 0,
        departure: flight.departure || '06:00',
        arrival: flight.arrival || '08:30',
        bookingLink: flight.bookingLink
      })),
      tips: ['Book 2-3 months in advance for best prices', 'Check baggage allowance', 'Arrive 2-3 hours early']
    };
  }

  private processTrainData(trains: any): any {
    if (!trains || !trains.trains) {
      return {
        available: false,
        message: 'Train data not available',
        recommendation: 'Check IRCTC website for latest schedules'
      };
    }

    return {
      available: true,
      options: trains.trains.slice(0, 3).map((train: any) => ({
        number: train.trainNumber,
        name: train.trainName,
        class: train.class,
        price: `₹${train.price}`,
        duration: train.duration,
        departure: train.departure,
        arrival: train.arrival,
        availability: train.availability
      })),
      tips: ['Book well in advance', 'Check PNR status regularly', 'Carry ID proof']
    };
  }

  private processHotelData(hotels: any, isDomestic: boolean): any[] {
    if (!hotels || !Array.isArray(hotels)) {
      return [
        {
          name: 'Hotels not available',
          message: 'Hotel data could not be fetched',
          recommendation: 'Check booking platforms directly'
        }
      ];
    }

    return hotels.slice(0, 5).map((hotel: any) => ({
      name: hotel.name || 'Hotel Name',
      rating: hotel.rating || 4.0,
      price: this.formatPrice(hotel.price_per_night || hotel.pricePerNight, isDomestic),
      location: hotel.location || 'City Center',
      amenities: hotel.amenities || ['WiFi', 'AC'],
      bookingLink: hotel.bookingLink,
      availability: hotel.availability || 'Available'
    }));
  }

  private processFoodData(foodAttractions: any[], isDomestic: boolean): any[] {
    if (!foodAttractions.length) {
      return this.getMockDiningOptions('', isDomestic);
    }

    return foodAttractions.map(food => ({
      name: food.name,
      type: 'Restaurant',
      description: food.description,
      rating: food.rating,
      priceRange: this.estimateRestaurantPrice(food, isDomestic),
      tips: food.tips || 'Try local specialties'
    }));
  }

  private extractFlightCost(flights: any, isDomestic: boolean): number | null {
    if (!flights || !Array.isArray(flights) || flights.length === 0) return null;
    
    const avgPrice = flights.reduce((sum: number, flight: any) => {
      return sum + (flight.price || (isDomestic ? 10000 : 30000));
    }, 0) / flights.length;
    
    return Math.round(avgPrice);
  }

  private extractHotelCost(hotels: any, isDomestic: boolean): number | null {
    if (!hotels || !Array.isArray(hotels) || hotels.length === 0) return null;
    
    const avgPrice = hotels.reduce((sum: number, hotel: any) => {
      return sum + (hotel.price_per_night || hotel.pricePerNight || (isDomestic ? 3000 : 5000));
    }, 0) / hotels.length;
    
    return Math.round(avgPrice);
  }

  private estimateAttractionFee(attraction: any, isDomestic: boolean): string {
    if (attraction?.entryFee) return this.formatPrice(attraction.entryFee, isDomestic);
    return isDomestic ? '₹200-500' : '$5-15';
  }

  private estimateActivityCost(activity: any, isDomestic: boolean): string {
    if (activity?.cost) return this.formatPrice(activity.cost, isDomestic);
    return isDomestic ? '₹500-1000' : '$15-30';
  }

  private estimateRestaurantPrice(restaurant: any, isDomestic: boolean): string {
    return isDomestic ? '₹400-800 per person' : '$12-25 per person';
  }

  private formatPrice(price: any, isDomestic: boolean): string {
    if (!price) return isDomestic ? '₹---' : '$---';
    
    if (isDomestic) {
      return `₹${typeof price === 'number' ? price.toLocaleString() : price}`;
    } else {
      // For international, we'll show in original currency + INR equivalent
      const numPrice = typeof price === 'number' ? price : parseFloat(price) || 0;
      return `$${numPrice.toLocaleString()} (≈₹${Math.round(numPrice * 83).toLocaleString()})`;
    }
  }

  private calculateItineraryCost(days: any[], isDomestic: boolean): string {
    const totalDays = days.length;
    const dailyAvg = isDomestic ? 2500 : 4000;
    const total = totalDays * dailyAvg;
    
    if (isDomestic) {
      return `₹${total.toLocaleString()} (₹${dailyAvg.toLocaleString()}/day)`;
    } else {
      const usdTotal = Math.round(total / 83);
      const usdDaily = Math.round(dailyAvg / 83);
      return `$${usdTotal.toLocaleString()} (≈₹${total.toLocaleString()}) - $${usdDaily}/day`;
    }
  }

  // Helper methods for mock content generation
  private getDestinationCurrency(destination: string): string {
    const currencyMap: Record<string, string> = {
      'dubai': 'AED', 'uae': 'AED', 'abu dhabi': 'AED',
      'thailand': 'THB', 'bangkok': 'THB', 'phuket': 'THB',
      'singapore': 'SGD',
      'japan': 'JPY', 'tokyo': 'JPY', 'osaka': 'JPY',
      'usa': 'USD', 'america': 'USD', 'new york': 'USD', 'california': 'USD',
      'uk': 'GBP', 'britain': 'GBP', 'london': 'GBP', 'england': 'GBP',
      'europe': 'EUR', 'germany': 'EUR', 'france': 'EUR', 'italy': 'EUR', 'spain': 'EUR',
      'australia': 'AUD', 'sydney': 'AUD', 'melbourne': 'AUD',
      'canada': 'CAD', 'toronto': 'CAD', 'vancouver': 'CAD'
    };

    const key = destination.toLowerCase();
    for (const [dest, currency] of Object.entries(currencyMap)) {
      if (key.includes(dest)) return currency;
    }
    return 'USD';
  }

  private getCountryFromDestination(destination: string): string {
    const countryMap: Record<string, string> = {
      'dubai': 'UAE', 'abu dhabi': 'UAE',
      'bangkok': 'Thailand', 'phuket': 'Thailand',
      'singapore': 'Singapore',
      'tokyo': 'Japan', 'osaka': 'Japan',
      'new york': 'USA', 'california': 'USA',
      'london': 'UK', 'manchester': 'UK',
      'paris': 'France', 'rome': 'Italy', 'berlin': 'Germany',
      'sydney': 'Australia', 'melbourne': 'Australia',
      'toronto': 'Canada', 'vancouver': 'Canada'
    };

    const key = destination.toLowerCase();
    for (const [dest, country] of Object.entries(countryMap)) {
      if (key.includes(dest)) return country;
    }
    return destination;
  }

  private getDestinationHighlights(destination: string): string[] {
    const highlights: Record<string, string[]> = {
      'dubai': ['Burj Khalifa', 'Gold Souk', 'Desert Safari', 'Luxury Shopping'],
      'thailand': ['Temples', 'Street Food', 'Beaches', 'Thai Massage'],
      'singapore': ['Gardens by the Bay', 'Marina Bay Sands', 'Hawker Centers', 'Clean City'],
      'japan': ['Temples', 'Cherry Blossoms', 'Technology', 'Sushi'],
      'usa': ['Skyscrapers', 'Museums', 'Entertainment', 'Diversity'],
      'uk': ['History', 'Castles', 'Pubs', 'Royal Heritage'],
      'default': ['Culture', 'Local Cuisine', 'Architecture', 'Heritage']
    };

    const key = destination.toLowerCase();
    for (const [dest, items] of Object.entries(highlights)) {
      if (key.includes(dest)) return items;
    }
    return highlights.default;
  }

  private getDestinationLanguages(destination: string): string[] {
    const languageMap: Record<string, string[]> = {
      'dubai': ['Arabic', 'English'],
      'thailand': ['Thai', 'English'],
      'singapore': ['English', 'Mandarin', 'Malay'],
      'japan': ['Japanese', 'English'],
      'usa': ['English'],
      'uk': ['English'],
      'france': ['French', 'English'],
      'germany': ['German', 'English'],
      'default': ['English', 'Local Language']
    };

    const key = destination.toLowerCase();
    for (const [dest, langs] of Object.entries(languageMap)) {
      if (key.includes(dest)) return langs;
    }
    return languageMap.default;
  }

  private getDestinationTips(destination: string, isDomestic: boolean): string[] {
    if (isDomestic) {
      return ['Carry ID proof', 'Book trains early', 'Check weather', 'Carry cash for local vendors'];
    }
    return ['Check visa requirements', 'Get travel insurance', 'Notify bank', 'Download offline maps', 'Carry passport copies'];
  }

  private generateMockItinerary(destination: string, duration: string, isDomestic: boolean): any[] {
    const days = parseInt(duration) || 3;
    const mockDays = [];

    for (let i = 1; i <= Math.min(days, 7); i++) {
      mockDays.push({
        day: i,
        title: `Day ${i} - ${this.getDayTitle(destination, i)}`,
        activities: [
          {
            time: '09:00',
            title: `Morning Activity ${i}`,
            description: `Explore ${destination} morning attractions`,
            location: destination,
            cost: isDomestic ? '₹500' : this.formatForeignCurrency(25, destination)
          },
          {
            time: '14:00',
            title: `Afternoon Activity ${i}`,
            description: `Visit popular ${destination} landmarks`,
            location: destination,
            cost: isDomestic ? '₹800' : this.formatForeignCurrency(40, destination)
          }
        ]
      });
    }

    return mockDays;
  }

  private getDayTitle(destination: string, day: number): string {
    const titles = ['Arrival & Exploration', 'Main Attractions', 'Cultural Immersion', 'Adventure Day', 'Relaxation', 'Shopping & Local Markets', 'Departure'];
    return titles[day - 1] || `Explore ${destination}`;
  }

  private getMockBudgetContent(destination: string, budgetLevel: string, isDomestic: boolean): any {
    const localCurrency = isDomestic ? 'INR' : this.getDestinationCurrency(destination);
    const baseMultiplier = isDomestic ? 1 : this.getCurrencyMultiplier(destination);

    const budgets = {
      tight: {
        total: 30000 * baseMultiplier,
        daily: 5000 * baseMultiplier,
        accommodation: 1500 * baseMultiplier,
        food: 1000 * baseMultiplier,
        transport: 800 * baseMultiplier,
        activities: 700 * baseMultiplier
      },
      comfortable: {
        total: 60000 * baseMultiplier,
        daily: 10000 * baseMultiplier,
        accommodation: 3000 * baseMultiplier,
        food: 2000 * baseMultiplier,
        transport: 1500 * baseMultiplier,
        activities: 1500 * baseMultiplier
      },
      luxury: {
        total: 120000 * baseMultiplier,
        daily: 20000 * baseMultiplier,
        accommodation: 8000 * baseMultiplier,
        food: 5000 * baseMultiplier,
        transport: 3000 * baseMultiplier,
        activities: 4000 * baseMultiplier
      }
    };

    const budget = budgets[budgetLevel as keyof typeof budgets] || budgets.comfortable;

    return {
      destination,
      currency: localCurrency,
      currencySymbol: this.getCurrencySymbol(localCurrency),
      isDomestic,
      exchangeRate: isDomestic ? null : this.getMockExchangeRate(localCurrency),
      budget: {
        level: budgetLevel,
        total: budget.total,
        daily: budget.daily,
        breakdown: {
          accommodation: budget.accommodation,
          food: budget.food,
          transport: budget.transport,
          activities: budget.activities,
          shopping: Math.round(budget.daily * 0.2),
          miscellaneous: Math.round(budget.daily * 0.1)
        }
      },
      inrEquivalent: isDomestic ? null : {
        total: Math.round(budget.total * this.getMockExchangeRate(localCurrency)),
        daily: Math.round(budget.daily * this.getMockExchangeRate(localCurrency))
      },
      tips: [
        'Book accommodations in advance for better rates',
        'Use local transport to save money',
        isDomestic ? 'Carry cash for small vendors' : 'Notify your bank about international travel',
        'Compare prices before making purchases'
      ]
    };
  }

  private getCurrencyMultiplier(destination: string): number {
    const multipliers: Record<string, number> = {
      'dubai': 0.3, 'uae': 0.3,
      'thailand': 0.8, 'bangkok': 0.8,
      'singapore': 0.18,
      'japan': 0.006,
      'usa': 0.012,
      'uk': 0.0095,
      'europe': 0.011,
      'australia': 0.018,
      'canada': 0.015
    };

    const key = destination.toLowerCase();
    for (const [dest, mult] of Object.entries(multipliers)) {
      if (key.includes(dest)) return mult;
    }
    return 0.012; // Default USD multiplier
  }

  private getCurrencySymbol(currency: string): string {
    const symbols: Record<string, string> = {
      'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£',
      'AED': 'د.إ', 'THB': '฿', 'SGD': 'S$', 'JPY': '¥',
      'AUD': 'A$', 'CAD': 'C$'
    };
    return symbols[currency] || currency;
  }

  private getMockExchangeRate(fromCurrency: string): number {
    const rates: Record<string, number> = {
      'USD': 83.25, 'EUR': 90.15, 'GBP': 105.50,
      'AED': 22.65, 'THB': 2.35, 'SGD': 61.80,
      'JPY': 0.56, 'AUD': 54.20, 'CAD': 61.90
    };
    return rates[fromCurrency] || 83.25;
  }

  private formatForeignCurrency(amount: number, destination: string): string {
    const currency = this.getDestinationCurrency(destination);
    const symbol = this.getCurrencySymbol(currency);
    const convertedAmount = amount * this.getCurrencyMultiplier(destination);
    const inrAmount = Math.round(convertedAmount * this.getMockExchangeRate(currency));
    
    return `${symbol} ${convertedAmount.toFixed(2)} (₹${inrAmount})`;
  }

  // Additional mock methods (simplified for brevity)
  private getMockFlightInfo(origin: string, destination: string, isDomestic: boolean): any {
    return {
      type: isDomestic ? 'domestic' : 'international',
      estimatedCost: isDomestic ? '₹8,000 - ₹15,000' : this.formatForeignCurrency(300, destination),
      duration: isDomestic ? '2-3 hours' : '6-8 hours',
      tips: ['Book 2-3 months in advance', 'Check baggage limits', 'Arrive 2 hours early']
    };
  }

  private getMockLocalTransport(destination: string, isDomestic: boolean): any {
    return {
      options: isDomestic ? ['Metro', 'Bus', 'Auto', 'Taxi'] : ['Metro', 'Taxi', 'Bus', 'Ride-sharing'],
      tips: ['Use contactless payment', 'Download local transport apps', 'Keep change ready']
    };
  }

  private getMockAccommodationOptions(destination: string, isDomestic: boolean): any[] {
    return [
      { type: 'Budget', price: isDomestic ? '₹1,500/night' : this.formatForeignCurrency(30, destination) },
      { type: 'Mid-range', price: isDomestic ? '₹4,000/night' : this.formatForeignCurrency(80, destination) },
      { type: 'Luxury', price: isDomestic ? '₹10,000/night' : this.formatForeignCurrency(200, destination) }
    ];
  }

  private getMockAttractions(destination: string, isDomestic: boolean): any[] {
    return [
      { name: `Top attraction in ${destination}`, cost: isDomestic ? '₹500' : this.formatForeignCurrency(15, destination) },
      { name: `Cultural site in ${destination}`, cost: isDomestic ? '₹300' : this.formatForeignCurrency(10, destination) },
      { name: `Adventure activity in ${destination}`, cost: isDomestic ? '₹1,200' : this.formatForeignCurrency(40, destination) }
    ];
  }

  private getMockDiningOptions(destination: string, isDomestic: boolean): any[] {
    return [
      { type: 'Street Food', cost: isDomestic ? '₹200-500' : this.formatForeignCurrency(8, destination) },
      { type: 'Local Restaurant', cost: isDomestic ? '₹800-1,500' : this.formatForeignCurrency(25, destination) },
      { type: 'Fine Dining', cost: isDomestic ? '₹2,500-5,000' : this.formatForeignCurrency(60, destination) }
    ];
  }

  private getMockLocalCuisine(destination: string): string[] {
    const cuisineMap: Record<string, string[]> = {
      'dubai': ['Shawarma', 'Hummus', 'Dates', 'Arabic Coffee'],
      'thailand': ['Pad Thai', 'Tom Yum', 'Green Curry', 'Mango Sticky Rice'],
      'singapore': ['Hainanese Chicken Rice', 'Laksa', 'Satay', 'Kaya Toast'],
      'japan': ['Sushi', 'Ramen', 'Tempura', 'Wagyu Beef'],
      'default': ['Local specialties', 'Traditional dishes', 'Regional cuisine', 'Street food']
    };

    const key = destination.toLowerCase();
    for (const [dest, items] of Object.entries(cuisineMap)) {
      if (key.includes(dest)) return items;
    }
    return cuisineMap.default;
  }

  private getMockDietaryOptions(destination: string, isDomestic: boolean): any {
    return {
      vegetarian: isDomestic ? 'Widely available' : 'Available in most restaurants',
      vegan: isDomestic ? 'Common' : 'Limited but available',
      halal: isDomestic ? 'Available' : 'Check with restaurants',
      glutenFree: isDomestic ? 'Limited' : 'Available on request'
    };
  }

  // Simplified versions of other mock methods
  private getMockVisaRequirements(destination: string, isDomestic: boolean): any {
    return isDomestic ? { required: false, documents: ['Valid ID'] } : 
    { required: true, documents: ['Passport', 'Visa application', 'Photos', 'Bank statements'] };
  }

  private getMockVisaProcess(destination: string, isDomestic: boolean): any {
    return isDomestic ? null : { steps: ['Apply online', 'Submit documents', 'Pay fees', 'Wait for approval'] };
  }

  private getMockVisaFees(destination: string, isDomestic: boolean): any {
    return isDomestic ? null : { fee: this.formatForeignCurrency(50, destination), processing: '3-7 days' };
  }

  private getMockWeatherInfo(destination: string): any {
    return { climate: 'Varies by season', temperature: '15-30°C', rainfall: 'Moderate' };
  }

  private getMockPackingList(destination: string, season: string): string[] {
    return ['Comfortable clothes', 'Walking shoes', 'Sunscreen', 'Medicines', 'Power adapter'];
  }

  private getMockCulturalInfo(destination: string, isDomestic: boolean): string[] {
    return isDomestic ? ['Respect local customs', 'Dress modestly at religious places'] :
    ['Research local customs', 'Learn basic phrases', 'Respect cultural differences'];
  }

  private getMockEtiquette(destination: string, isDomestic: boolean): string[] {
    return ['Be polite', 'Remove shoes when required', 'Ask before photographing people'];
  }

  private getMockUsefulPhrases(destination: string, isDomestic: boolean): any {
    return { hello: 'Hello', thankyou: 'Thank you', help: 'Help', sorry: 'Sorry' };
  }

  private getMockEmbassyInfo(destination: string, isDomestic: boolean): any {
    return isDomestic ? null : { address: `Indian Embassy, ${destination}`, phone: '+123456789' };
  }

  private getMockEmergencyNumbers(destination: string, isDomestic: boolean): any {
    return isDomestic ? { police: '100', ambulance: '102', fire: '101' } :
    { police: '911', ambulance: '911', embassy: '+123456789' };
  }

  private getMockHospitals(destination: string, isDomestic: boolean): any[] {
    return [{ name: `General Hospital, ${destination}`, phone: '+123456789' }];
  }

  private getMockSafetyTips(destination: string, isDomestic: boolean): string[] {
    return ['Keep documents safe', 'Avoid isolated areas', 'Stay alert', 'Keep emergency contacts handy'];
  }

  private getMockShoppingInfo(destination: string, isDomestic: boolean): any[] {
    return [{ name: `Local Market, ${destination}`, specialty: 'Local crafts' }];
  }

  private getMockSouvenirs(destination: string): string[] {
    return ['Local handicrafts', 'Traditional items', 'Regional specialties'];
  }

  private getMockCustomsLimits(isDomestic: boolean): any {
    return isDomestic ? null : { dutyfree: '$800', restrictions: 'No food items' };
  }

  private getSeasonalWeather(destination: string, season: string): string {
    const weatherMap: Record<string, Record<string, string>> = {
      'Winter': {
        'default': 'Cool and pleasant, perfect for sightseeing'
      },
      'Summer': {
        'default': 'Warm weather, ideal for outdoor activities'
      },
      'Monsoon': {
        'default': 'Rainy season, pack waterproof gear'
      },
      'Flexible': {
        'default': 'Variable weather, pack for all conditions'
      }
    };

    return weatherMap[season]?.default || 'Pleasant weather expected';
  }
}

// Export singleton instance
// Export enhanced singleton instance
export const travelDeckGenerator = new TravelDeckGenerator();