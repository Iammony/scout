// OpenRouter API client for LLM integration
// This will be used for generating comprehensive travel card content

import { MODEL_CONFIGS, getModelForTask } from './openrouter-config';

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
      url: string;
    };
  }>;
}

export interface LLMResponse {
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

export class OpenRouterClient {
  private apiKey: string;
  private baseURL: string = 'https://openrouter.ai/api/v1';

  constructor() {
    // Check for both possible environment variable names
    this.apiKey = process.env.Openrouter_API || process.env.OPENROUTER_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('OpenRouter API key not found. LLM features will use mock data.');
    }
  }

  /**
   * Generate content using OpenRouter LLM
   */
  async generateContent(
    messages: LLMMessage[],
    config: Partial<OpenRouterConfig> = {}
  ): Promise<LLMResponse> {
    if (!this.apiKey) {
      // Return mock response for development
      return this.getMockResponse(messages);
    }

    const requestConfig: OpenRouterConfig = {
      apiKey: this.apiKey,
      model: config.model || 'anthropic/claude-3.5-sonnet',
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 4000,
    };

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${requestConfig.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        },
        body: JSON.stringify({
          model: requestConfig.model,
          messages,
          temperature: requestConfig.temperature,
          max_tokens: requestConfig.maxTokens,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        content: data.choices[0]?.message?.content || '',
        usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        model: data.model || requestConfig.model,
      };
    } catch (error) {
      console.error('OpenRouter API error:', error);
      // Fallback to mock response
      return this.getMockResponse(messages);
    }
  }

  /**
   * Generate travel card content using LLM
   */
  async generateTravelCardContent(travelData: any): Promise<any> {
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: `You are a travel expert creating comprehensive travel cards for Indian travelers. 
                 Generate detailed, accurate information with specific focus on Indian traveler needs:
                 - Visa requirements for Indian passport holders
                 - Indian restaurants and vegetarian food options
                 - UPI/RuPay card acceptance
                 - Embassy contacts for international travel
                 - Cultural tips and local customs
                 - Budget calculations in INR`
      },
      {
        role: 'user',
        content: `Create a comprehensive travel card for:
                 Destination: ${travelData.destination}
                 Origin: ${travelData.origin}
                 Travel Type: ${travelData.travelType}
                 Duration: ${travelData.duration}
                 Budget: ${travelData.budget}
                 Dietary: ${travelData.dietary}
                 
                 Include all sections from the master requirements document.
                 Return as valid JSON structure.`
      }
    ];

    const response = await this.generateContent(messages, {
      temperature: 0.7,
      maxTokens: 4000
    });

    try {
      return JSON.parse(response.content);
    } catch (error) {
      console.error('Failed to parse LLM response as JSON:', error);
      return this.getMockTravelCardContent(travelData);
    }
  }

  /**
   * Mock response for development/fallback
   */
  private getMockResponse(messages: LLMMessage[]): LLMResponse {
    return {
      content: 'Mock LLM response - OpenRouter integration will be added here',
      usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      model: 'mock-model'
    };
  }

  /**
   * Mock travel card content for development
   */
  private getMockTravelCardContent(travelData: any): any {
    return {
      overview: {
        destination: travelData.destination,
        country: 'Mock Country',
        famousFor: ['Tourism', 'Culture', 'Food'],
        bestTime: 'October to March',
        currency: 'Local Currency',
        language: ['English', 'Local Language']
      },
      indianTravelerInfo: {
        visaRequired: true,
        embassyContact: `Indian Embassy in ${travelData.destination}`,
        upiAcceptance: false,
        indianRestaurants: ['Mock Indian Restaurant 1', 'Mock Indian Restaurant 2'],
        culturalTips: ['Respect local customs', 'Dress appropriately']
      },
      budget: {
        tight: 15000,
        comfortable: 35000,
        luxury: 80000,
        currency: 'INR'
      }
    };
  }

  /**
   * Check if OpenRouter is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get current configuration status
   */
  getStatus(): { configured: boolean; model: string } {
    return {
      configured: this.isConfigured(),
      model: this.isConfigured() ? 'anthropic/claude-3.5-sonnet' : 'mock-model'
    };
  }
}

// Export singleton instance
export const openRouterClient = new OpenRouterClient();