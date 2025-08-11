// Currency Converter API for travel budget calculations
import { rateLimiter, extractApiHost } from './rate-limiter';

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol?: string;
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: string;
}

export interface CurrencyConversion {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  convertedAmount: number;
  exchangeRate: number;
  timestamp: string;
}

class CurrencyAPI {
  private apiKey: string;
  private baseHost = 'currency-converter-exchange-rates-foreign-exchange-rates.p.rapidapi.com';
  private cache: Map<string, { data: any; expires: number }> = new Map();
  private readonly cacheTimeout = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.apiKey = process.env.X_RapidAPI_Key || process.env.RAPIDAPI_KEY || '';
    
    if (!this.apiKey) {
      console.warn('RapidAPI key not found for currency converter');
    }
  }

  /**
   * Get all available currencies
   */
  async getCurrencies(): Promise<CurrencyInfo[]> {
    const cacheKey = 'currencies';
    const cached = this.cache.get(cacheKey);
    
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    try {
      await rateLimiter.waitIfNeeded(this.baseHost);
      
      const response = await fetch(`https://${this.baseHost}/currencies`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Host': this.baseHost,
          'X-RapidAPI-Key': this.apiKey,
        },
      });

      rateLimiter.recordRequest(this.baseHost);

      if (!response.ok) {
        throw new Error(`Currency API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        expires: Date.now() + this.cacheTimeout
      });

      return data;

    } catch (error) {
      console.error('Failed to fetch currencies:', error);
      return this.getMockCurrencies();
    }
  }

  /**
   * Get exchange rate between two currencies
   */
  async getExchangeRate(from: string, to: string): Promise<ExchangeRate | null> {
    const cacheKey = `rate_${from}_${to}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    try {
      await rateLimiter.waitIfNeeded(this.baseHost);
      
      const response = await fetch(
        `https://${this.baseHost}/convert?from=${from}&to=${to}&amount=1`,
        {
          method: 'GET',
          headers: {
            'X-RapidAPI-Host': this.baseHost,
            'X-RapidAPI-Key': this.apiKey,
          },
        }
      );

      rateLimiter.recordRequest(this.baseHost);

      if (!response.ok) {
        throw new Error(`Exchange rate API error: ${response.status}`);
      }

      const data = await response.json();
      
      const exchangeRate: ExchangeRate = {
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        rate: data.result || data.convertedAmount || 1,
        lastUpdated: new Date().toISOString()
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: exchangeRate,
        expires: Date.now() + this.cacheTimeout
      });

      return exchangeRate;

    } catch (error) {
      console.error(`Failed to get exchange rate ${from} -> ${to}:`, error);
      return this.getMockExchangeRate(from, to);
    }
  }

  /**
   * Convert amount between currencies
   */
  async convertCurrency(
    amount: number,
    from: string,
    to: string
  ): Promise<CurrencyConversion> {
    const exchangeRate = await this.getExchangeRate(from, to);
    
    if (!exchangeRate) {
      throw new Error(`Unable to get exchange rate for ${from} -> ${to}`);
    }

    return {
      amount,
      fromCurrency: from.toUpperCase(),
      toCurrency: to.toUpperCase(),
      convertedAmount: amount * exchangeRate.rate,
      exchangeRate: exchangeRate.rate,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Convert multiple amounts at once
   */
  async convertMultiple(
    amounts: Array<{ amount: number; from: string; to: string }>
  ): Promise<CurrencyConversion[]> {
    const conversions = await Promise.allSettled(
      amounts.map(({ amount, from, to }) => 
        this.convertCurrency(amount, from, to)
      )
    );

    return conversions
      .filter((result): result is PromiseFulfilledResult<CurrencyConversion> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);
  }

  /**
   * Get popular currencies for travelers
   */
  getPopularCurrencies(): CurrencyInfo[] {
    return [
      { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
      { code: 'THB', name: 'Thai Baht', symbol: '฿' },
      { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' }
    ];
  }

  /**
   * Format currency amount with proper symbol
   */
  formatCurrency(amount: number, currencyCode: string): string {
    const currency = this.getPopularCurrencies().find(c => c.code === currencyCode);
    const symbol = currency?.symbol || currencyCode;
    
    if (currencyCode === 'INR') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    }
    
    return `${symbol} ${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`;
  }

  /**
   * Get currency by country/destination
   */
  getCurrencyByDestination(destination: string): string {
    const destinationMap: Record<string, string> = {
      // India
      'india': 'INR', 'mumbai': 'INR', 'delhi': 'INR', 'bangalore': 'INR',
      'chennai': 'INR', 'kolkata': 'INR', 'goa': 'INR', 'kerala': 'INR',
      
      // Popular international destinations
      'usa': 'USD', 'america': 'USD', 'new york': 'USD', 'california': 'USD',
      'uae': 'AED', 'dubai': 'AED', 'abu dhabi': 'AED',
      'thailand': 'THB', 'bangkok': 'THB', 'phuket': 'THB',
      'singapore': 'SGD',
      'japan': 'JPY', 'tokyo': 'JPY', 'osaka': 'JPY',
      'australia': 'AUD', 'sydney': 'AUD', 'melbourne': 'AUD',
      'canada': 'CAD', 'toronto': 'CAD', 'vancouver': 'CAD',
      'uk': 'GBP', 'britain': 'GBP', 'london': 'GBP', 'england': 'GBP',
      'europe': 'EUR', 'germany': 'EUR', 'france': 'EUR', 'italy': 'EUR', 'spain': 'EUR'
    };

    const key = destination.toLowerCase();
    for (const [dest, currency] of Object.entries(destinationMap)) {
      if (key.includes(dest)) {
        return currency;
      }
    }
    
    return 'USD'; // Default fallback
  }

  /**
   * Check if API is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus() {
    return {
      remaining: rateLimiter.getRemainingRequests(this.baseHost),
      resetIn: rateLimiter.getResetTime(this.baseHost),
      configured: this.isConfigured()
    };
  }

  // Mock data methods for development
  private getMockCurrencies(): CurrencyInfo[] {
    return this.getPopularCurrencies();
  }

  private getMockExchangeRate(from: string, to: string): ExchangeRate {
    const mockRates: Record<string, number> = {
      'USD_INR': 83.25,
      'EUR_INR': 90.15,
      'GBP_INR': 105.50,
      'AED_INR': 22.65,
      'THB_INR': 2.35,
      'SGD_INR': 61.80,
      'JPY_INR': 0.56,
      'AUD_INR': 54.20,
      'CAD_INR': 61.90
    };

    const key = `${from.toUpperCase()}_${to.toUpperCase()}`;
    const reverseKey = `${to.toUpperCase()}_${from.toUpperCase()}`;
    
    let rate = mockRates[key];
    if (!rate && mockRates[reverseKey]) {
      rate = 1 / mockRates[reverseKey];
    }
    if (!rate) rate = 1;

    return {
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      rate,
      lastUpdated: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const currencyAPI = new CurrencyAPI();