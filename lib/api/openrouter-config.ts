// OpenRouter model configuration for different use cases
// Reference: https://openrouter.ai/models

export const OPENROUTER_MODELS = {
  // Vision and image analysis
  VISION: 'anthropic/claude-3.5-sonnet',
  
  // Specialized models for different content types
  TRAVEL_PLANNING: 'anthropic/claude-3.5-sonnet',      // Comprehensive itinerary and overview
  FINANCIAL_ANALYSIS: 'openai/gpt-4o',                 // Budget calculations and financial planning
  DATA_PROCESSING: 'anthropic/claude-3.5-sonnet',      // Processing and structuring API data
  CULTURAL_CONTENT: 'anthropic/claude-3-sonnet',       // Cultural insights and local information
  LOGISTICS: 'openai/gpt-4o-mini',                     // Transport, accommodation logistics
  
  // Fast and efficient models
  QUICK_TASKS: 'anthropic/claude-3-haiku',
  VALIDATION: 'anthropic/claude-3-haiku',              // Data validation and quality checks
  
  // Alternative powerful models
  GPT4_VISION: 'openai/gpt-4-vision-preview',
  GPT4_TURBO: 'openai/gpt-4o',
  GEMINI_PRO: 'google/gemini-pro',
  
  // Fallback models
  FALLBACK: 'anthropic/claude-3-sonnet',
} as const;

export const MODEL_CONFIGS = {
  // Vision and image analysis
  VISION_ANALYSIS: {
    model: OPENROUTER_MODELS.VISION,
    temperature: 0.2, // Very low for accurate identification
    maxTokens: 1500,
    description: 'Optimized for image analysis and location identification'
  },
  
  // Travel planning and comprehensive content
  TRAVEL_PLANNING: {
    model: OPENROUTER_MODELS.TRAVEL_PLANNING,
    temperature: 0.7, // Creative but accurate
    maxTokens: 12000, // Large for comprehensive content
    description: 'Optimized for detailed travel planning with real API data integration'
  },
  
  // Financial and budget analysis
  BUDGET_ANALYSIS: {
    model: OPENROUTER_MODELS.FINANCIAL_ANALYSIS,
    temperature: 0.3, // Low for accurate calculations
    maxTokens: 6000,
    description: 'Specialized for budget calculations and financial planning with real costs'
  },
  
  // Data processing and structuring
  DATA_PROCESSING: {
    model: OPENROUTER_MODELS.DATA_PROCESSING,
    temperature: 0.4, // Balanced for data interpretation
    maxTokens: 8000,
    description: 'Optimized for processing and structuring RapidAPI data into travel content'
  },
  
  // Cultural and local insights
  CULTURAL_CONTENT: {
    model: OPENROUTER_MODELS.CULTURAL_CONTENT,
    temperature: 0.8, // Higher for cultural nuance and local insights
    maxTokens: 5000,
    description: 'Specialized for cultural insights, local customs, and regional information'
  },
  
  // Logistics and practical information
  LOGISTICS: {
    model: OPENROUTER_MODELS.LOGISTICS,
    temperature: 0.5, // Balanced for practical accuracy
    maxTokens: 4000,
    description: 'Optimized for transport, accommodation, and practical travel logistics'
  },
  
  // Quick validation and quality checks
  VALIDATION: {
    model: OPENROUTER_MODELS.VALIDATION,
    temperature: 0.2, // Very low for accurate validation
    maxTokens: 2000,
    description: 'Fast validation and quality assurance for generated content'
  },
  
  // Legacy quick response
  QUICK_RESPONSE: {
    model: OPENROUTER_MODELS.QUICK_TASKS,
    temperature: 0.5,
    maxTokens: 1000,
    description: 'Fast responses for simple queries'
  }
};

// Card deck types for comprehensive travel planning
export const TRAVEL_DECK_TYPES = [
  'trip-summary',  // At-a-glance trip overview with key highlights and budget
  'itinerary',     // Day-by-day detailed itinerary
  'transport',     // Flights, trains, local transport
  'accommodation', // Hotels, hostels, stays
  'attractions',   // Places to visit, monuments, activities
  'dining',        // Restaurants, local food, dietary options
  'budget',        // Detailed budget breakdown
  'visa',          // Visa requirements and documentation
  'weather',       // Weather forecast and packing tips
  'culture',       // Cultural tips, dos and don'ts
  'emergency',     // Emergency contacts, medical, safety
  'shopping',      // Shopping areas, local markets, souvenirs
] as const;

export type TravelDeckType = typeof TRAVEL_DECK_TYPES[number];

// API data quality scoring
export const DATA_QUALITY_THRESHOLDS = {
  HIGH_QUALITY: 0.8,
  MEDIUM_QUALITY: 0.6,
  LOW_QUALITY: 0.4,
  USE_FALLBACK: 0.2
} as const;

// Content generation strategies based on data quality
export const CONTENT_STRATEGIES = {
  API_FIRST: 'api_first',           // High-quality API data available
  API_ENHANCED: 'api_enhanced',     // Medium-quality API data + LLM enhancement
  LLM_WITH_CONTEXT: 'llm_context', // Low-quality API data, LLM with context
  LLM_FALLBACK: 'llm_fallback'     // No API data, pure LLM generation
} as const;

export type ContentStrategy = typeof CONTENT_STRATEGIES[keyof typeof CONTENT_STRATEGIES];

// Card-specific model mapping for optimal output quality
export const CARD_MODEL_MAPPING = {
  'trip-summary': MODEL_CONFIGS.TRAVEL_PLANNING,
  itinerary: MODEL_CONFIGS.TRAVEL_PLANNING,
  transport: MODEL_CONFIGS.LOGISTICS,
  accommodation: MODEL_CONFIGS.LOGISTICS,
  attractions: MODEL_CONFIGS.DATA_PROCESSING,
  dining: MODEL_CONFIGS.CULTURAL_CONTENT,
  budget: MODEL_CONFIGS.BUDGET_ANALYSIS,
  visa: MODEL_CONFIGS.DATA_PROCESSING,
  weather: MODEL_CONFIGS.DATA_PROCESSING,
  culture: MODEL_CONFIGS.CULTURAL_CONTENT,
  emergency: MODEL_CONFIGS.DATA_PROCESSING,
  shopping: MODEL_CONFIGS.CULTURAL_CONTENT
} as const;

// Enhanced model selection helper
export function getModelForTask(task: 'vision' | 'travel' | 'budget' | 'data' | 'cultural' | 'logistics' | 'validation' | 'quick'): typeof MODEL_CONFIGS[keyof typeof MODEL_CONFIGS] {
  switch (task) {
    case 'vision':
      return MODEL_CONFIGS.VISION_ANALYSIS;
    case 'travel':
      return MODEL_CONFIGS.TRAVEL_PLANNING;
    case 'budget':
      return MODEL_CONFIGS.BUDGET_ANALYSIS;
    case 'data':
      return MODEL_CONFIGS.DATA_PROCESSING;
    case 'cultural':
      return MODEL_CONFIGS.CULTURAL_CONTENT;
    case 'logistics':
      return MODEL_CONFIGS.LOGISTICS;
    case 'validation':
      return MODEL_CONFIGS.VALIDATION;
    case 'quick':
      return MODEL_CONFIGS.QUICK_RESPONSE;
    default:
      return MODEL_CONFIGS.DATA_PROCESSING;
  }
}

// Get optimal model for specific card type
export function getModelForCard(cardType: TravelDeckType): typeof MODEL_CONFIGS[keyof typeof MODEL_CONFIGS] {
  return CARD_MODEL_MAPPING[cardType] || MODEL_CONFIGS.DATA_PROCESSING;
}