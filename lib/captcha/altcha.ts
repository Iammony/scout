// ALTCHA Captcha Integration
// Import only what we need and handle server-side safely

// Configuration
const ALTCHA_HMAC_KEY = process.env.ALTCHA_HMAC_KEY || 'scout-travel-captcha-secret-key-dev';
const CHALLENGE_EXPIRES_IN = 300000; // 5 minutes in milliseconds
const MAX_NUMBER = 100000; // Maximum number for challenge

export interface AltchaChallenge {
  algorithm: string;
  challenge: string;
  salt: string;
  signature: string;
}

export interface AltchaSolution {
  algorithm: string;
  challenge: string;
  number: number;
  salt: string;
  signature: string;
}

/**
 * Generate a new ALTCHA challenge using crypto
 */
export async function generateAltchaChallenge(): Promise<AltchaChallenge> {
  try {
    const crypto = require('crypto');
    
    // Generate random salt
    const salt = crypto.randomBytes(12).toString('hex');
    
    // Generate challenge number between 1 and MAX_NUMBER
    const number = Math.floor(Math.random() * MAX_NUMBER) + 1;
    
    // Create challenge string
    const challengeData = `${salt}:${number}`;
    const challenge = crypto.createHash('sha256').update(challengeData).digest('hex');
    
    // Create HMAC signature
    const hmac = crypto.createHmac('sha256', ALTCHA_HMAC_KEY);
    hmac.update(challenge);
    const signature = hmac.digest('hex');

    return {
      algorithm: 'SHA-256',
      challenge,
      salt,
      signature,
    };
  } catch (error) {
    console.error('Failed to generate ALTCHA challenge:', error);
    throw new Error('Failed to generate captcha challenge');
  }
}

/**
 * Verify ALTCHA solution
 */
export async function verifyAltchaSolution(payload: string): Promise<boolean> {
  try {
    const solution: AltchaSolution = JSON.parse(payload);
    const crypto = require('crypto');
    
    // Verify the challenge hash
    const challengeData = `${solution.salt}:${solution.number}`;
    const expectedChallenge = crypto.createHash('sha256').update(challengeData).digest('hex');
    
    if (expectedChallenge !== solution.challenge) {
      console.log('❌ ALTCHA challenge hash mismatch');
      return false;
    }
    
    // Verify HMAC signature
    const hmac = crypto.createHmac('sha256', ALTCHA_HMAC_KEY);
    hmac.update(solution.challenge);
    const expectedSignature = hmac.digest('hex');
    
    if (expectedSignature !== solution.signature) {
      console.log('❌ ALTCHA signature verification failed');
      return false;
    }
    
    console.log('✅ ALTCHA captcha verification successful');
    return true;
  } catch (error) {
    console.error('ALTCHA verification error:', error);
    return false;
  }
}

/**
 * Middleware to verify captcha for protected routes
 */
export function requireCaptcha(payload?: string): boolean {
  if (!payload) {
    return false;
  }

  try {
    const solution = JSON.parse(payload);
    
    // Basic structure validation
    if (!solution.algorithm || !solution.challenge || !solution.salt || !solution.signature) {
      console.log('❌ Invalid ALTCHA payload structure');
      return false;
    }

    return true;
  } catch (error) {
    console.error('ALTCHA payload parsing error:', error);
    return false;
  }
}