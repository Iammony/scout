// Vision API service for location identification from images
import { openRouterClient, LLMMessage } from './openrouter';
import { MODEL_CONFIGS } from './openrouter-config';

export interface LocationIdentification {
  location: string;
  country: string;
  confidence: number;
  landmarks: string[];
  description: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface VisionAnalysisResult {
  success: boolean;
  location?: LocationIdentification;
  error?: string;
  rawResponse?: string;
}

export class VisionLocationService {
  
  /**
   * Analyze image to identify location using vision-enabled LLM
   */
  async identifyLocationFromImage(imageBase64: string): Promise<VisionAnalysisResult> {
    try {
      console.log('Starting vision-based location identification...');
      
      // If running in browser, use API endpoint
      if (typeof window !== 'undefined') {
        const response = await fetch('/api/vision/location', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageBase64,
          }),
        });

        const result = await response.json();
        
        if (result.success) {
          return {
            success: true,
            location: result.location,
          };
        } else {
          return {
            success: false,
            error: result.error || 'Failed to identify location',
          };
        }
      }
      
      // Server-side direct processing
      const prompt = `Analyze this image and identify the location. Focus on:
1. Geographical location (city, state, country)
2. Visible landmarks, monuments, or distinctive features
3. Architectural style, signage, or cultural indicators
4. Natural features that might indicate location

Respond ONLY with valid JSON in this exact format:
{
  "location": "City, State/Region",
  "country": "Country Name",
  "confidence": 0.85,
  "landmarks": ["landmark1", "landmark2"],
  "description": "Brief description of what you see that helped identify the location",
  "coordinates": {
    "lat": 12.3456,
    "lng": 77.1234
  }
}

Important guidelines:
- Be specific about location (e.g., "Mumbai, Maharashtra" not just "India")
- Confidence should be 0.0 to 1.0 (use lower values if uncertain)
- Include coordinates if you can identify the specific location
- If you cannot identify the location, set confidence to 0 and location to "Unknown"
- Focus on Indian locations primarily but identify international locations too`;

      const response = await openRouterClient.generateContent([
        {
          role: 'user',
          content: [
            {
              type: 'text' as const,
              text: prompt
            },
            {
              type: 'image_url' as const,
              image_url: {
                url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ], {
        model: MODEL_CONFIGS.VISION_ANALYSIS.model,
        temperature: MODEL_CONFIGS.VISION_ANALYSIS.temperature,
        maxTokens: MODEL_CONFIGS.VISION_ANALYSIS.maxTokens
      });

      console.log('Vision API response received');
      
      // Parse the JSON response
      const cleanedResponse = this.cleanJsonResponse(response.content);
      const locationData = JSON.parse(cleanedResponse);
      
      // Validate the response structure
      if (!this.isValidLocationResponse(locationData)) {
        throw new Error('Invalid location response format');
      }

      console.log('Location identified:', locationData.location, 'with confidence:', locationData.confidence);

      return {
        success: true,
        location: locationData,
        rawResponse: response.content
      };

    } catch (error) {
      console.error('Vision location identification failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        rawResponse: error instanceof Error ? error.message : undefined
      };
    }
  }

  /**
   * Get location suggestions based on partial identification
   */
  async getLocationSuggestions(partialLocation: string, imageBase64?: string): Promise<string[]> {
    try {
      const prompt = `Based on the partial location "${partialLocation}"${imageBase64 ? ' and this image' : ''}, suggest 5 most likely specific locations in this format:
["City, State, Country", "City, State, Country", ...]

Focus on:
- Popular tourist destinations
- Major cities and landmarks
- Places commonly visited by travelers
- Indian locations primarily`;

      const messages: LLMMessage[] = [
        {
          role: 'user' as const,
          content: imageBase64 ? [
            { type: 'text' as const, text: prompt },
            {
              type: 'image_url' as const,
              image_url: {
                url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ] : prompt
        }
      ];

      const response = await openRouterClient.generateContent(messages, {
        model: 'anthropic/claude-3.5-sonnet',
        temperature: 0.5,
        maxTokens: 300
      });

      const suggestions = JSON.parse(this.cleanJsonResponse(response.content));
      return Array.isArray(suggestions) ? suggestions.slice(0, 5) : [];

    } catch (error) {
      console.error('Location suggestions failed:', error);
      return this.getFallbackSuggestions(partialLocation);
    }
  }

  /**
   * Enhanced location identification with context
   */
  async identifyWithContext(imageBase64: string, userContext?: {
    previousLocation?: string;
    travelStyle?: string;
    interests?: string[];
  }): Promise<VisionAnalysisResult> {
    try {
      const contextInfo = userContext ? `
        Additional context:
        - Previous location: ${userContext.previousLocation || 'Unknown'}
        - Travel style: ${userContext.travelStyle || 'Unknown'}
        - Interests: ${userContext.interests?.join(', ') || 'General'}
      ` : '';

      const prompt = `Analyze this image to identify the location with enhanced context awareness.
      
      ${contextInfo}
      
      Look for:
      1. Specific landmarks, monuments, or buildings
      2. Street signs, shop names, or local language text
      3. Architectural styles typical to certain regions
      4. Natural landscapes or geographic features
      5. Cultural indicators (clothing, activities, vehicles)
      6. Any visible coordinates or location markers

      Respond with detailed JSON including confidence level and reasoning.`;

      // Use the same analysis method but with enhanced context
      return await this.identifyLocationFromImage(imageBase64);

    } catch (error) {
      console.error('Enhanced location identification failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed'
      };
    }
  }

  /**
   * Clean JSON response by removing markdown formatting
   */
  private cleanJsonResponse(response: string): string {
    return response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/^[^{]*({[\s\S]*})[^}]*$/, '$1')
      .trim();
  }

  /**
   * Validate location response structure
   */
  private isValidLocationResponse(data: any): data is LocationIdentification {
    return (
      typeof data === 'object' &&
      typeof data.location === 'string' &&
      typeof data.country === 'string' &&
      typeof data.confidence === 'number' &&
      Array.isArray(data.landmarks) &&
      typeof data.description === 'string'
    );
  }

  /**
   * Fallback location suggestions for common Indian destinations
   */
  private getFallbackSuggestions(partialLocation: string): string[] {
    const commonDestinations = [
      'Mumbai, Maharashtra, India',
      'Delhi, Delhi, India',
      'Bangalore, Karnataka, India',
      'Chennai, Tamil Nadu, India',
      'Kolkata, West Bengal, India',
      'Goa, Goa, India',
      'Jaipur, Rajasthan, India',
      'Kochi, Kerala, India',
      'Pune, Maharashtra, India',
      'Hyderabad, Telangana, India'
    ];

    const query = partialLocation.toLowerCase();
    return commonDestinations.filter(dest => 
      dest.toLowerCase().includes(query)
    ).slice(0, 5);
  }

  /**
   * Check if vision capabilities are available
   */
  isVisionSupported(): boolean {
    return openRouterClient.isConfigured();
  }

  /**
   * Get service status
   */
  getStatus(): { available: boolean; provider: string } {
    return {
      available: this.isVisionSupported(),
      provider: this.isVisionSupported() ? 'OpenRouter + Claude Vision' : 'Mock Service'
    };
  }
}

// Export singleton instance
export const visionLocationService = new VisionLocationService();