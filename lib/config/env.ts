// Environment configuration with validation and defaults

interface Environment {
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_URL?: string;
  NEXT_PUBLIC_APP_URL: string;
  OPENROUTER_API_KEY?: string;
  RAPIDAPI_KEY?: string;
  RAPIDAPI_HOST?: string;
  ALTCHA_API_SECRET?: string;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  
  if (!value && !defaultValue) {
    console.warn(`Environment variable ${key} is not set`);
    return '';
  }
  
  return value || defaultValue || '';
}

function getRequiredEnvVar(key: string): string {
  const value = process.env[key];
  
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  
  return value;
}

export const env: Environment = {
  NODE_ENV: (process.env.NODE_ENV as Environment['NODE_ENV']) || 'development',
  DATABASE_URL: getEnvVar('DATABASE_URL'),
  NEXT_PUBLIC_APP_URL: getEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  OPENROUTER_API_KEY: getEnvVar('OPENROUTER_API_KEY'),
  RAPIDAPI_KEY: getEnvVar('RAPIDAPI_KEY'),
  RAPIDAPI_HOST: getEnvVar('RAPIDAPI_HOST'),
  ALTCHA_API_SECRET: getEnvVar('ALTCHA_API_SECRET'),
};

// Validation helpers
export const isProduction = () => env.NODE_ENV === 'production';
export const isDevelopment = () => env.NODE_ENV === 'development';
export const isTest = () => env.NODE_ENV === 'test';

// Feature flags based on environment
export const features = {
  enableAnalytics: isProduction(),
  enableErrorReporting: isProduction(),
  enableDebugLogs: isDevelopment(),
  enableDevTools: isDevelopment(),
} as const;

// Validate critical environment variables on startup
export function validateEnvironment(): void {
  const errors: string[] = [];

  // Add validation for critical env vars here
  if (isProduction()) {
    if (!env.OPENROUTER_API_KEY) {
      errors.push('OPENROUTER_API_KEY is required in production');
    }
    
    if (!env.RAPIDAPI_KEY) {
      errors.push('RAPIDAPI_KEY is required in production');
    }
  }

  if (errors.length > 0) {
    console.error('Environment validation failed:');
    errors.forEach(error => console.error(`  - ${error}`));
    
    if (isProduction()) {
      throw new Error('Critical environment variables are missing');
    }
  }
}

// Initialize validation
if (typeof window === 'undefined') {
  validateEnvironment();
}

export default env;