// Enhanced Content Generator with Multi-LLM Strategy and Quality Assurance
import { openRouterClient } from './openrouter';
import { getModelForCard, CONTENT_STRATEGIES, ContentStrategy, TravelDeckType } from './openrouter-config';
import { dataQualityAssessor, ValidatedApiData, DataQualityScore } from './data-quality';
import { TravelCaptureInput } from '@/lib/types/travel';
import { v4 as uuidv4 } from 'uuid';

export interface EnhancedContentRequest {
  cardType: TravelDeckType;
  input: TravelCaptureInput;
  validatedApiData: ValidatedApiData;
  strategy: ContentStrategy;
  qualityScore: number;
}

export interface GeneratedContent {
  content: any;
  confidence: number;
  dataSource: 'api' | 'llm_enhanced' | 'llm_generated';
  model: string;
  processingTime: number;
  qualityIndicators: {
    completeness: number;
    accuracy: number;
    relevance: number;
    actionability: number;
  };
}

export class EnhancedContentGenerator {
  /**
   * Generate high-quality travel card content using the optimal strategy
   */
  async generateCardContent(request: EnhancedContentRequest): Promise<GeneratedContent> {
    const startTime = Date.now();
    console.log(`🎯 Generating ${request.cardType} content with ${request.strategy} strategy`);
    
    let content: any;
    let confidence: number;
    let dataSource: 'api' | 'llm_enhanced' | 'llm_generated';
    
    try {
      switch (request.strategy) {
        case CONTENT_STRATEGIES.API_FIRST:
          ({ content, confidence, dataSource } = await this.generateApiFirstContent(request));
          break;
        
        case CONTENT_STRATEGIES.API_ENHANCED:
          ({ content, confidence, dataSource } = await this.generateApiEnhancedContent(request));
          break;
        
        case CONTENT_STRATEGIES.LLM_WITH_CONTEXT:
          ({ content, confidence, dataSource } = await this.generateLLMWithContextContent(request));
          break;
        
        case CONTENT_STRATEGIES.LLM_FALLBACK:
          ({ content, confidence, dataSource } = await this.generateLLMFallbackContent(request));
          break;
        
        default:
          ({ content, confidence, dataSource } = await this.generateLLMFallbackContent(request));
      }
      
      // Quality assessment
      const qualityIndicators = this.assessContentQuality(content, request.cardType);
      
      // If quality is too low, try enhanced generation
      if (qualityIndicators.completeness < 0.6 && request.strategy !== CONTENT_STRATEGIES.LLM_FALLBACK) {
        console.log(`⚡ Content quality below threshold, trying enhanced generation...`);
        const enhancedResult = await this.generateApiEnhancedContent(request);
        if (enhancedResult.confidence > confidence) {
          content = enhancedResult.content;
          confidence = enhancedResult.confidence;
          dataSource = enhancedResult.dataSource;
        }
      }
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ Generated ${request.cardType} content in ${processingTime}ms with confidence ${(confidence * 100).toFixed(1)}%`);
      
      return {
        content,
        confidence,
        dataSource,
        model: getModelForCard(request.cardType).model,
        processingTime,
        qualityIndicators
      };
      
    } catch (error) {
      console.error(`❌ Failed to generate ${request.cardType} content:`, error);
      
      // Emergency fallback
      const fallbackResult = await this.generateEmergencyFallback(request);
      const processingTime = Date.now() - startTime;
      
      return {
        ...fallbackResult,
        processingTime,
        qualityIndicators: this.assessContentQuality(fallbackResult.content, request.cardType)
      };
    }
  }

  /**
   * API-first strategy: Use high-quality API data with minimal LLM processing
   */
  private async generateApiFirstContent(request: EnhancedContentRequest): Promise<{content: any, confidence: number, dataSource: 'api' | 'llm_enhanced' | 'llm_generated'}> {
    const { cardType, validatedApiData } = request;
    const apiData = this.extractRelevantApiData(cardType, validatedApiData);
    
    if (!apiData || Object.keys(apiData).length === 0) {
      // Fall back to enhanced strategy if no API data
      return this.generateApiEnhancedContent(request);
    }
    
    // Structure API data with minimal processing
    const content = await this.structureApiData(cardType, apiData, request.input);
    
    return {
      content,
      confidence: 0.9,
      dataSource: 'api'
    };
  }

  /**
   * API-enhanced strategy: Combine API data with LLM enhancement
   */
  private async generateApiEnhancedContent(request: EnhancedContentRequest): Promise<{content: any, confidence: number, dataSource: 'api' | 'llm_enhanced' | 'llm_generated'}> {
    const { cardType, input, validatedApiData } = request;
    const modelConfig = getModelForCard(cardType);
    const apiData = this.extractRelevantApiData(cardType, validatedApiData);
    
    const systemPrompt = this.buildEnhancedSystemPrompt(cardType, validatedApiData);
    const userPrompt = this.buildApiEnhancedUserPrompt(cardType, input, apiData);
    
    console.log(`🤖 Using ${modelConfig.model} for ${cardType} API-enhanced generation`);
    
    const response = await openRouterClient.generateContent([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], modelConfig);
    
    const content = this.parseAndValidateContent(response.content, cardType);
    
    return {
      content,
      confidence: 0.85,
      dataSource: 'llm_enhanced'
    };
  }

  /**
   * LLM with context strategy: Use LLM with API context but don't rely on API data structure
   */
  private async generateLLMWithContextContent(request: EnhancedContentRequest): Promise<{content: any, confidence: number, dataSource: 'api' | 'llm_enhanced' | 'llm_generated'}> {
    const { cardType, input, validatedApiData } = request;
    const modelConfig = getModelForCard(cardType);
    
    const systemPrompt = this.buildContextualSystemPrompt(cardType, validatedApiData);
    const userPrompt = this.buildContextualUserPrompt(cardType, input, validatedApiData);
    
    console.log(`🤖 Using ${modelConfig.model} for ${cardType} contextual generation`);
    
    const response = await openRouterClient.generateContent([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], modelConfig);
    
    const content = this.parseAndValidateContent(response.content, cardType);
    
    return {
      content,
      confidence: 0.75,
      dataSource: 'llm_generated'
    };
  }

  /**
   * LLM fallback strategy: Pure LLM generation without API data
   */
  private async generateLLMFallbackContent(request: EnhancedContentRequest): Promise<{content: any, confidence: number, dataSource: 'api' | 'llm_enhanced' | 'llm_generated'}> {
    const { cardType, input } = request;
    const modelConfig = getModelForCard(cardType);
    
    const systemPrompt = this.buildFallbackSystemPrompt(cardType);
    const userPrompt = this.buildFallbackUserPrompt(cardType, input);
    
    console.log(`🤖 Using ${modelConfig.model} for ${cardType} fallback generation`);
    
    const response = await openRouterClient.generateContent([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], modelConfig);
    
    const content = this.parseAndValidateContent(response.content, cardType);
    
    return {
      content,
      confidence: 0.65,
      dataSource: 'llm_generated'
    };
  }

  /**
   * Emergency fallback for when all strategies fail
   */
  private async generateEmergencyFallback(request: EnhancedContentRequest): Promise<{content: any, confidence: number, dataSource: 'api' | 'llm_enhanced' | 'llm_generated', model: string}> {
    console.log(`🚨 Emergency fallback for ${request.cardType}`);
    
    // Use the most basic structured content
    const content = this.generateBasicStructuredContent(request.cardType, request.input);
    
    return {
      content,
      confidence: 0.4,
      dataSource: 'llm_generated',
      model: 'fallback'
    };
  }

  /**
   * Extract relevant API data for specific card type
   */
  private extractRelevantApiData(cardType: TravelDeckType, validatedData: ValidatedApiData): any {
    switch (cardType) {
      case 'trip-summary':
        return {
          travelGuide: validatedData.travelGuide.usable ? validatedData.travelGuide.data : null,
          flights: validatedData.flights.usable ? validatedData.flights.data : null,
          hotels: validatedData.hotels.usable ? validatedData.hotels.data : null,
          currency: validatedData.currency.usable ? validatedData.currency.data : null,
          destination: validatedData.travelGuide.data?.region || validatedData.travelGuide.data?.destination
        };
      
      case 'transport':
        return {
          flights: validatedData.flights.usable ? validatedData.flights.data : null,
          trains: validatedData.trains?.usable ? validatedData.trains.data : null
        };
      
      case 'accommodation':
        return {
          hotels: validatedData.hotels.usable ? validatedData.hotels.data : null
        };
      
      case 'attractions':
        return {
          attractions: validatedData.travelGuide.usable ? validatedData.travelGuide.data?.attractions : null
        };
      
      case 'budget':
        return {
          flights: validatedData.flights.usable ? validatedData.flights.data : null,
          hotels: validatedData.hotels.usable ? validatedData.hotels.data : null,
          currency: validatedData.currency.usable ? validatedData.currency.data : null
        };
      
      case 'visa':
        return {
          visa: validatedData.visa.usable ? validatedData.visa.data : null
        };
      
      default:
        return {
          travelGuide: validatedData.travelGuide.usable ? validatedData.travelGuide.data : null
        };
    }
  }

  /**
   * Build enhanced system prompt with API data quality information
   */
  private buildEnhancedSystemPrompt(cardType: TravelDeckType, validatedData: ValidatedApiData): string {
    const dataQualityInfo = this.summarizeDataQuality(validatedData);
    
    return `You are an expert travel planner creating high-quality ${cardType} cards for Indian travelers.

DATA QUALITY CONTEXT:
${dataQualityInfo}

CRITICAL REQUIREMENTS:
1. Use provided API data as PRIMARY source when available and high-quality
2. Write in natural, conversational, human-friendly language - NO raw data dumps
3. Convert lists into flowing sentences (e.g., "The highlights include beautiful temples, delicious street food, and historic architecture" instead of "highlights: ['temples', 'food', 'architecture']")
4. Format pricing information clearly with context (e.g., "Flight tickets cost around ₹8,500-12,000 per person" instead of "price: 8500")
5. Focus on Indian traveler needs (vegetarian options, visa for Indian passport, INR pricing)
6. Provide specific, actionable advice with exact timings, costs, and locations in readable format
7. Return ONLY valid JSON with human-readable content, not structured data lists
8. Never mention API limitations or data quality in the output
9. FOR FAMILY TRAVEL: Consider children's ages for activity recommendations, family rooms in hotels, child-friendly restaurants, safety considerations, and age-appropriate attractions

WRITING STYLE: Write as if you're personally recommending to a friend - warm, informative, and conversational.

OUTPUT FORMAT: Return only JSON content with human-readable text suitable for direct display in the travel card UI.`;
  }

  /**
   * Build API-enhanced user prompt
   */
  private buildApiEnhancedUserPrompt(cardType: TravelDeckType, input: TravelCaptureInput, apiData: any): string {
    const apiDataStr = apiData ? JSON.stringify(apiData, null, 2) : 'No API data available';
    
    // Add pricing analysis if this is transport or accommodation card
    let pricingAnalysis = '';
    if (cardType === 'transport' && apiData?.flights) {
      const flights = Array.isArray(apiData.flights) ? apiData.flights : [];
      if (flights.length > 0) {
        const prices = flights.map((f: any) => f.price || 0).filter((p: number) => p > 0);
        if (prices.length > 0) {
          const avg = Math.round(prices.reduce((sum: number, p: number) => sum + p, 0) / prices.length);
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          pricingAnalysis = `\nFLIGHT PRICING ANALYSIS: Average flight cost is ₹${avg.toLocaleString()}, ranging from ₹${min.toLocaleString()} to ₹${max.toLocaleString()}. Use this for budget recommendations.`;
        }
      }
    } else if (cardType === 'accommodation' && apiData?.hotels) {
      const hotels = Array.isArray(apiData.hotels) ? apiData.hotels : [];
      if (hotels.length > 0) {
        const prices = hotels.map((h: any) => h.pricePerNight || h.price_per_night || 0).filter((p: number) => p > 0);
        if (prices.length > 0) {
          const avg = Math.round(prices.reduce((sum: number, p: number) => sum + p, 0) / prices.length);
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          pricingAnalysis = `\nHOTEL PRICING ANALYSIS: Average hotel cost is ₹${avg.toLocaleString()} per night, ranging from ₹${min.toLocaleString()} to ₹${max.toLocaleString()}. Use this for accommodation recommendations.`;
        }
      }
    }
    
    return `Create a comprehensive ${cardType} card for this travel request:

TRAVEL REQUEST:
- Destination: ${input.destination}
- Origin: ${input.origin}  
- Duration: ${input.duration}
- Budget: ${input.budget}
- Travel Type: ${input.travelType}
- Travel Style: ${input.travelStyle}
- Dietary: ${input.dietary}
- Season: ${input.season}
- Motivation: ${input.motivation}
${input.travelType === 'family' && input.travelerDetails.familyMembers ? 
`- Family: ${input.travelerDetails.familyMembers.adults} adult(s), ${input.travelerDetails.familyMembers.children} child(ren)${input.travelerDetails.familyMembers.childrenAges?.length ? ` (ages: ${input.travelerDetails.familyMembers.childrenAges.join(', ')})` : ''}${input.travelerDetails.familyMembers.seniors ? `, ${input.travelerDetails.familyMembers.seniors} senior(s)` : ''}` : ''}${input.travelType === 'single' && input.travelerDetails.travelerAge ? 
`- Traveler Age: ${input.travelerDetails.travelerAge} years` : ''}${input.travelType === 'group' && input.travelerDetails.groupSize ? 
`- Group Size: ${input.travelerDetails.groupSize} people` : ''}

AVAILABLE API DATA:
${apiDataStr}${pricingAnalysis}

TASK: Create a detailed, actionable ${cardType} card that:
1. Integrates ALL useful information from the API data
2. Converts pricing data into conversational, readable text (e.g., "Flight tickets typically cost around ₹8,500-12,000 per person for this route")
3. Writes in natural, friendly language that's easy to read
4. Includes specific costs, timings, and booking information in readable format
5. Addresses Indian traveler concerns in conversational style
6. Makes recommendations sound personal and helpful

WRITING STYLE: Write as if you're giving advice to a close friend who's planning this trip.

Generate the JSON content now:`;
  }

  /**
   * Build contextual system prompt for medium-quality data
   */
  private buildContextualSystemPrompt(cardType: TravelDeckType, validatedData: ValidatedApiData): string {
    return `You are an expert travel planner creating a ${cardType} card with limited but useful API context.

APPROACH:
- Use any available API insights as reference points
- Generate comprehensive content using your travel expertise
- Write in natural, conversational, human-friendly language
- Focus on practical, actionable information for Indian travelers
- Ensure all costs are realistic and properly formatted with context

REQUIREMENTS:
1. Write content in flowing, readable paragraphs and sentences
2. Convert pricing data into clear statements (e.g., "Hotels typically cost ₹3,500-6,000 per night for good mid-range options")
3. Make lists conversational (e.g., "You'll love exploring the vibrant markets, trying authentic local cuisine, and visiting historic temples")
4. Provide specific timings, locations, and booking advice in readable format
5. Address Indian traveler needs (vegetarian food, visa requirements, cultural considerations)
6. Return only valid JSON with human-readable text content

WRITING STYLE: Write as a knowledgeable travel friend giving personalized advice.

The API data provides some context but your expertise should fill all gaps with conversational, human-readable content.`;
  }

  /**
   * Build contextual user prompt
   */
  private buildContextualUserPrompt(cardType: TravelDeckType, input: TravelCaptureInput, validatedData: ValidatedApiData): string {
    const contextSummary = this.buildContextSummary(validatedData);
    
    return `Create a ${cardType} card for this travel request:

TRAVEL DETAILS:
- Destination: ${input.destination}
- Origin: ${input.origin}
- Duration: ${input.duration} 
- Budget: ${input.budget}
- Travelers: ${input.travelType}
- Style: ${input.travelStyle}
- Dietary Needs: ${input.dietary}
- Season: ${input.season}
- Purpose: ${input.motivation}

AVAILABLE CONTEXT:
${contextSummary}

Generate comprehensive ${cardType} content with:
- Specific locations, costs, and timings
- Practical booking and travel advice  
- Indian traveler considerations
- Realistic budget information
- Actionable recommendations

Return the JSON content:`;
  }

  /**
   * Build fallback system prompt for no API data
   */
  private buildFallbackSystemPrompt(cardType: TravelDeckType): string {
    return `You are an expert travel planner creating a comprehensive ${cardType} card using your extensive travel knowledge.

EXPERTISE FOCUS:
- Indian travelers' specific needs and preferences
- Realistic pricing for both domestic and international travel
- Practical, actionable travel advice written in conversational style
- Cultural and practical considerations explained clearly
- Budget-conscious recommendations with premium options

CARD REQUIREMENTS:
1. Write in natural, flowing language that's easy to read and understand
2. Convert pricing into readable statements with context (e.g., "You can expect to spend around ₹2,500-4,000 per night for comfortable hotels")
3. Transform lists into conversational text (e.g., "The best time to visit is from October to March when the weather is pleasant and perfect for sightseeing")
4. Provide specific locations, timings, and booking strategies in readable paragraphs
5. Address visa requirements for Indian passport holders in clear, actionable language
6. Include vegetarian/dietary options and cultural tips in friendly tone
7. Focus on practical, actionable information written as personal recommendations

WRITING STYLE: Write as if you're a trusted travel advisor giving personalized suggestions to a friend.

OUTPUT: Return only JSON content with human-readable, conversational text formatted for immediate display in the travel card interface.`;
  }

  /**
   * Build fallback user prompt
   */
  private buildFallbackUserPrompt(cardType: TravelDeckType, input: TravelCaptureInput): string {
    return `Create a detailed ${cardType} card for this travel request:

TRAVELER PROFILE:
- From: ${input.origin}
- Going to: ${input.destination}
- Duration: ${input.duration}
- Budget Level: ${input.budget}
- Travel Type: ${input.travelType}
- Preferred Style: ${input.travelStyle}
- Dietary Requirements: ${input.dietary}
- Travel Season: ${input.season}
- Travel Motivation: ${input.motivation}
${input.travelType === 'family' && input.travelerDetails.familyMembers ? 
`- Family Composition: ${input.travelerDetails.familyMembers.adults} adult(s), ${input.travelerDetails.familyMembers.children} child(ren)${input.travelerDetails.familyMembers.childrenAges?.length ? ` (ages: ${input.travelerDetails.familyMembers.childrenAges.join(', ')})` : ''}${input.travelerDetails.familyMembers.seniors ? `, ${input.travelerDetails.familyMembers.seniors} senior(s)` : ''}` : ''}${input.travelType === 'single' && input.travelerDetails.travelerAge ? 
`- Age: ${input.travelerDetails.travelerAge} years` : ''}${input.travelType === 'group' && input.travelerDetails.groupSize ? 
`- Group Size: ${input.travelerDetails.groupSize} people` : ''}

Using your travel expertise, create comprehensive ${cardType} content that includes:
- Specific recommendations with exact costs and locations
- Practical booking and timing advice
- Indian traveler considerations (visas, food, culture)
- Realistic budget estimates
${input.travelType === 'family' && input.travelerDetails.familyMembers?.children ? '- Family-friendly recommendations considering children\'s ages, safety, and comfort' : ''}
- Actionable next steps

Generate the JSON content:`;
  }

  /**
   * Parse and validate LLM-generated content
   */
  private parseAndValidateContent(response: string, cardType: TravelDeckType): any {
    try {
      // Clean the response
      const cleaned = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      // Find JSON content
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON content found in response');
      }
      
      const content = JSON.parse(jsonMatch[0]);
      
      // Validate content structure for card type
      this.validateContentStructure(content, cardType);
      
      return content;
      
    } catch (error) {
      console.warn(`Failed to parse ${cardType} content, using fallback:`, error);
      return this.generateBasicStructuredContent(cardType, {} as TravelCaptureInput);
    }
  }

  /**
   * Validate content has required structure for card type
   */
  private validateContentStructure(content: any, cardType: TravelDeckType): void {
    if (!content || typeof content !== 'object') {
      throw new Error('Content must be an object');
    }
    
    // Card-specific validation
    switch (cardType) {
      case 'budget':
        if (!content.budget || !content.currency) {
          throw new Error('Budget card must have budget and currency fields');
        }
        break;
      
      case 'attractions':
        if (!content.attractions || !Array.isArray(content.attractions)) {
          throw new Error('Attractions card must have attractions array');
        }
        break;
      
      case 'itinerary':
        if (!content.days || !Array.isArray(content.days)) {
          throw new Error('Itinerary card must have days array');
        }
        break;
    }
  }

  /**
   * Assess the quality of generated content
   */
  private assessContentQuality(content: any, cardType: TravelDeckType): {
    completeness: number;
    accuracy: number;
    relevance: number;
    actionability: number;
  } {
    if (!content) {
      return { completeness: 0, accuracy: 0, relevance: 0, actionability: 0 };
    }
    
    const fields = Object.keys(content).length;
    const expectedFields = this.getExpectedFieldCount(cardType);
    const completeness = Math.min(fields / expectedFields, 1);
    
    // Heuristic quality assessment
    const hasSpecificData = this.hasSpecificData(content);
    const hasActionableInfo = this.hasActionableInfo(content);
    const hasRealisticCosts = this.hasRealisticCosts(content);
    
    return {
      completeness,
      accuracy: hasRealisticCosts ? 0.8 : 0.6,
      relevance: hasSpecificData ? 0.9 : 0.7,
      actionability: hasActionableInfo ? 0.85 : 0.6
    };
  }

  /**
   * Helper methods for content quality assessment
   */
  private getExpectedFieldCount(cardType: TravelDeckType): number {
    const counts: Record<TravelDeckType, number> = {
      'trip-summary': 8,
      itinerary: 4,
      transport: 5,
      accommodation: 4,
      attractions: 3,
      dining: 4,
      budget: 6,
      visa: 5,
      weather: 3,
      culture: 3,
      emergency: 4,
      shopping: 3
    };
    return counts[cardType] || 4;
  }

  private hasSpecificData(content: any): boolean {
    const stringContent = JSON.stringify(content);
    return /\$\d+|\₹\d+|\d+:\d+|[A-Z][a-z]+ \d+/.test(stringContent);
  }

  private hasActionableInfo(content: any): boolean {
    const stringContent = JSON.stringify(content).toLowerCase();
    return /(book|visit|try|avoid|check|bring|carry)/i.test(stringContent);
  }

  private hasRealisticCosts(content: any): boolean {
    const stringContent = JSON.stringify(content);
    const costs = stringContent.match(/[\$₹]\d+/g);
    return costs ? costs.length > 0 : false;
  }

  /**
   * Structure API data with minimal processing
   */
  private async structureApiData(cardType: TravelDeckType, apiData: any, input: TravelCaptureInput): Promise<any> {
    // Direct structuring of high-quality API data
    switch (cardType) {
      case 'attractions':
        if (apiData.attractions) {
          return {
            destination: input.destination,
            attractions: apiData.attractions.map((attr: any) => ({
              name: attr.name,
              description: attr.description,
              rating: attr.rating,
              type: attr.type || 'Attraction',
              cost: attr.entryFee || 'Free',
              tips: attr.tips || 'Visit during off-peak hours'
            }))
          };
        }
        break;
      
      case 'transport':
        return {
          destination: input.destination,
          origin: input.origin,
          flights: apiData.flights,
          trains: apiData.trains
        };
    }
    
    // For complex structuring, still use minimal LLM processing
    return apiData;
  }

  private generateBasicStructuredContent(cardType: TravelDeckType, input: TravelCaptureInput): any {
    // Emergency fallback content
    const basicContent: Record<TravelDeckType, any> = {
      'trip-summary': {
        destination: input.destination || 'Travel Destination',
        highlights: ['Explore local culture', 'Try authentic cuisine', 'Visit famous landmarks'],
        totalBudget: { 
          formatted: '₹25,000', 
          formattedPerPerson: '₹12,500' 
        },
        budgetBreakdown: {
          flights: { formatted: '₹10,000' },
          accommodation: { formatted: '₹8,000', perNight: '₹2,500' },
          dailyExpenses: { formatted: '₹7,000', perDay: '₹2,000' }
        },
        quickTips: ['Book in advance', 'Check weather', 'Carry essentials', 'Plan activities'],
        bestTime: 'October to March',
        duration: input.duration || '3-5 days'
      },
      itinerary: {
        days: [
          {
            day: 1,
            title: 'Arrival and Exploration',
            activities: [
              { time: '10:00', title: 'Arrive and check-in', description: 'Get settled and explore nearby area' }
            ]
          }
        ]
      },
      transport: {
        flights: { available: false, message: 'Transportation options will be updated shortly' },
        localTransport: ['Taxi', 'Public Transport', 'Rental Car']
      },
      accommodation: {
        options: [
          { type: 'Budget', price: '₹2,000-3,000/night' },
          { type: 'Mid-range', price: '₹4,000-6,000/night' },
          { type: 'Luxury', price: '₹8,000+/night' }
        ]
      },
      attractions: {
        attractions: [
          { name: 'Popular Tourist Attraction', description: 'Must-visit destination', rating: 4.5 }
        ]
      },
      dining: {
        restaurants: [
          { type: 'Local Cuisine', price: '₹500-800 per person' },
          { type: 'Fine Dining', price: '₹1,500-2,500 per person' }
        ]
      },
      budget: {
        budget: { level: input.budget || 'comfortable', total: 25000, daily: 4000 },
        currency: 'INR',
        breakdown: { accommodation: 12000, food: 6000, transport: 4000, activities: 3000 }
      },
      visa: {
        required: false,
        documents: ['Valid ID proof'],
        notes: 'Visa information will be updated based on your travel destination'
      },
      weather: {
        climate: 'Pleasant weather expected',
        temperature: '20-30°C',
        recommendations: ['Comfortable clothing', 'Light jacket for evenings']
      },
      culture: {
        customs: ['Respect local traditions', 'Dress modestly at religious places'],
        tips: ['Learn basic local phrases', 'Be mindful of cultural differences']
      },
      emergency: {
        numbers: { police: '100', ambulance: '102', fire: '101' },
        tips: ['Keep emergency contacts handy', 'Carry important documents']
      },
      shopping: {
        markets: ['Local markets', 'Shopping malls', 'Street vendors'],
        tips: ['Bargain at local markets', 'Check authenticity of products']
      }
    };
    
    return basicContent[cardType];
  }

  private summarizeDataQuality(validatedData: ValidatedApiData): string {
    const summaries: string[] = [];
    
    Object.entries(validatedData).forEach(([key, data]) => {
      const quality = data.quality.overall;
      const status = quality >= 0.8 ? 'HIGH' : quality >= 0.6 ? 'MEDIUM' : quality >= 0.4 ? 'LOW' : 'POOR';
      summaries.push(`${key}: ${status} quality (${(quality * 100).toFixed(0)}%)`);
    });
    
    return summaries.join('\n');
  }

  private buildContextSummary(validatedData: ValidatedApiData): string {
    const usableData: string[] = [];
    
    if (validatedData.travelGuide.usable) {
      const data = validatedData.travelGuide.data;
      usableData.push(`Travel Guide: ${data?.attractions?.length || 0} attractions found for ${data?.region || 'destination'}`);
    }
    
    if (validatedData.flights.usable) {
      const data = validatedData.flights.data;
      usableData.push(`Flights: ${Array.isArray(data) ? data.length : 'Some'} flight options available`);
    }
    
    if (validatedData.hotels.usable) {
      const data = validatedData.hotels.data;
      usableData.push(`Hotels: ${Array.isArray(data) ? data.length : 'Some'} accommodation options found`);
    }
    
    if (validatedData.currency.usable) {
      const data = validatedData.currency.data;
      usableData.push(`Currency: Exchange rate available (${data?.from} → ${data?.to})`);
    }
    
    return usableData.length > 0 ? usableData.join('\n') : 'Limited API data available - using travel expertise';
  }
}

export const enhancedContentGenerator = new EnhancedContentGenerator();