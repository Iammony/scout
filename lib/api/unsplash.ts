// Unsplash API client using RapidAPI
import { env } from '@/lib/config/env';
import { getApiConfig, getRapidApiHeaders } from '@/lib/config/rapidapi-endpoints';

interface UnsplashImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string;
  description: string;
  user: {
    name: string;
    username: string;
  };
  width: number;
  height: number;
}

interface UnsplashResponse {
  results?: UnsplashImage[];
  images?: UnsplashImage[];
  total?: number;
  total_pages?: number;
}

export class UnsplashClient {
  private apiConfig: any;
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    this.apiConfig = getApiConfig('unsplash');
    
    if (!this.apiConfig) {
      throw new Error('Unsplash API configuration not found');
    }

    this.baseUrl = this.apiConfig.baseUrl;
    this.headers = getRapidApiHeaders(this.apiConfig.host);
  }

  /**
   * Check if Unsplash API is configured
   */
  isConfigured(): boolean {
    return !!(this.apiConfig?.isActive && this.headers['x-rapidapi-key']);
  }

  /**
   * Get images for a destination or city
   */
  async getDestinationImages(
    destination: string, 
    page: number = 1, 
    count: number = 10
  ): Promise<UnsplashImage[]> {
    if (!this.isConfigured()) {
      console.warn('Unsplash API not configured, returning empty results');
      return [];
    }

    try {
      // Create search query for travel destination
      const query = `${destination} travel city landscape`;
      const url = `${this.baseUrl}/getImages?query=${encodeURIComponent(query)}&page=${page}`;
      
      console.log(`Fetching images for destination: ${destination}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`);
      }

      const data: UnsplashResponse = await response.json();
      const images = data.results || data.images || [];
      
      console.log(`Found ${images.length} images for ${destination}`);
      return images.slice(0, count);

    } catch (error) {
      console.error(`Error fetching images for ${destination}:`, error);
      return [];
    }
  }

  /**
   * Get background images for UI elements
   */
  async getBackgroundImages(
    theme: string = 'nature landscape', 
    page: number = 1, 
    count: number = 5
  ): Promise<UnsplashImage[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const url = `${this.baseUrl}/getImages?query=${encodeURIComponent(theme)}&page=${page}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status}`);
      }

      const data: UnsplashResponse = await response.json();
      const images = data.results || data.images || [];
      
      return images.slice(0, count);

    } catch (error) {
      console.error('Error fetching background images:', error);
      return [];
    }
  }

  /**
   * Get images for travel activities
   */
  async getActivityImages(
    activity: string, 
    destination?: string,
    count: number = 5
  ): Promise<UnsplashImage[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const query = destination 
        ? `${activity} ${destination} travel`
        : `${activity} travel adventure`;
      
      const url = `${this.baseUrl}/getImages?query=${encodeURIComponent(query)}&page=1`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status}`);
      }

      const data: UnsplashResponse = await response.json();
      const images = data.results || data.images || [];
      
      return images.slice(0, count);

    } catch (error) {
      console.error(`Error fetching activity images for ${activity}:`, error);
      return [];
    }
  }

  /**
   * Get images for food and dining
   */
  async getFoodImages(
    cuisine: string = 'food restaurant', 
    destination?: string,
    count: number = 5
  ): Promise<UnsplashImage[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const query = destination 
        ? `${cuisine} food ${destination}`
        : `${cuisine} food restaurant dining`;
      
      const url = `${this.baseUrl}/getImages?query=${encodeURIComponent(query)}&page=1`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status}`);
      }

      const data: UnsplashResponse = await response.json();
      const images = data.results || data.images || [];
      
      return images.slice(0, count);

    } catch (error) {
      console.error(`Error fetching food images for ${cuisine}:`, error);
      return [];
    }
  }

  /**
   * Get hotel and accommodation images
   */
  async getAccommodationImages(
    destination: string,
    type: string = 'hotel',
    count: number = 5
  ): Promise<UnsplashImage[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const query = `${type} accommodation ${destination} luxury interior`;
      const url = `${this.baseUrl}/getImages?query=${encodeURIComponent(query)}&page=1`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status}`);
      }

      const data: UnsplashResponse = await response.json();
      const images = data.results || data.images || [];
      
      return images.slice(0, count);

    } catch (error) {
      console.error(`Error fetching accommodation images for ${destination}:`, error);
      return [];
    }
  }

  /**
   * Helper to get optimized image URL for specific use case
   */
  getOptimizedImageUrl(
    image: UnsplashImage, 
    size: 'thumb' | 'small' | 'regular' | 'full' = 'regular',
    width?: number,
    height?: number
  ): string {
    let url = image.urls[size];
    
    // Add parameters for custom sizing if needed
    if (width && height) {
      url += `&w=${width}&h=${height}&fit=crop&crop=center`;
    } else if (width) {
      url += `&w=${width}&fit=crop`;
    } else if (height) {
      url += `&h=${height}&fit=crop`;
    }
    
    return url;
  }

  /**
   * Get attribution text for an image
   */
  getImageAttribution(image: UnsplashImage): string {
    return `Photo by ${image.user.name} on Unsplash`;
  }

  /**
   * Get multiple images for a travel card with different themes
   */
  async getTravelCardImages(destination: string): Promise<{
    hero: UnsplashImage | null;
    attractions: UnsplashImage[];
    food: UnsplashImage[];
    accommodation: UnsplashImage[];
  }> {
    try {
      const [destinationImages, foodImages, accommodationImages] = await Promise.all([
        this.getDestinationImages(destination, 1, 3),
        this.getFoodImages('local cuisine', destination, 2),
        this.getAccommodationImages(destination, 'hotel', 2)
      ]);

      return {
        hero: destinationImages[0] || null,
        attractions: destinationImages.slice(1),
        food: foodImages,
        accommodation: accommodationImages
      };
    } catch (error) {
      console.error(`Error fetching travel card images for ${destination}:`, error);
      return {
        hero: null,
        attractions: [],
        food: [],
        accommodation: []
      };
    }
  }
}

// Export singleton instance
export const unsplashClient = new UnsplashClient();

// Export types
export type { UnsplashImage, UnsplashResponse };