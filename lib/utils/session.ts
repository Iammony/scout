import { v4 as uuidv4 } from 'uuid';
import { GuestSession } from '@/lib/types/travel';

// Guest session storage key
const GUEST_SESSION_KEY = 'scout_guest_session';
const GUEST_CARDS_KEY = 'scout_guest_cards';

// Session configuration
const GUEST_SESSION_EXPIRY_DAYS = 7;
const MAX_GUEST_CARDS = 50; // Reasonable limit

export interface StoredGuestSession extends GuestSession {
  // Additional client-side fields
  userAgent?: string;
  ipAddress?: string; // Would be set server-side
}

/**
 * Create a new guest session
 */
export function createGuestSession(): StoredGuestSession {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + GUEST_SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  
  const session: StoredGuestSession = {
    sessionId: uuidv4(),
    createdAt: now,
    expiresAt,
    cardsCreated: 0,
    lastActivity: now,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
  };
  
  // Store in localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
  }
  
  return session;
}

/**
 * Get current guest session or create new one
 */
export function getGuestSession(): StoredGuestSession {
  if (typeof window === 'undefined') {
    // Server-side: create temporary session
    return createGuestSession();
  }
  
  try {
    const stored = localStorage.getItem(GUEST_SESSION_KEY);
    if (!stored) {
      return createGuestSession();
    }
    
    const session: StoredGuestSession = JSON.parse(stored);
    
    // Check if session is expired
    if (new Date(session.expiresAt) <= new Date()) {
      console.log('Guest session expired, creating new one');
      clearGuestSession();
      return createGuestSession();
    }
    
    // Update last activity
    session.lastActivity = new Date();
    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
    
    return session;
  } catch (error) {
    console.error('Error loading guest session:', error);
    return createGuestSession();
  }
}

/**
 * Update guest session
 */
export function updateGuestSession(updates: Partial<StoredGuestSession>): StoredGuestSession {
  const session = getGuestSession();
  const updatedSession = { ...session, ...updates, lastActivity: new Date() };
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(updatedSession));
  }
  
  return updatedSession;
}

/**
 * Increment card count for guest session
 */
export function incrementGuestCardCount(): StoredGuestSession {
  const session = getGuestSession();
  return updateGuestSession({
    cardsCreated: session.cardsCreated + 1
  });
}

/**
 * Check if guest has reached card limit
 */
export function hasReachedGuestCardLimit(): boolean {
  const session = getGuestSession();
  return session.cardsCreated >= MAX_GUEST_CARDS;
}

/**
 * Clear guest session
 */
export function clearGuestSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(GUEST_SESSION_KEY);
    localStorage.removeItem(GUEST_CARDS_KEY);
  }
}

/**
 * Get guest session info for display
 */
export function getGuestSessionInfo(): {
  sessionId: string;
  cardsCreated: number;
  daysRemaining: number;
  isExpired: boolean;
} {
  const session = getGuestSession();
  const now = new Date();
  const expiresAt = new Date(session.expiresAt);
  const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  
  return {
    sessionId: session.sessionId,
    cardsCreated: session.cardsCreated,
    daysRemaining: Math.max(0, daysRemaining),
    isExpired: expiresAt <= now
  };
}

/**
 * Store guest travel card
 */
export function storeGuestTravelCard(cardData: any): void {
  if (typeof window === 'undefined') return;
  
  try {
    const existingCards = localStorage.getItem(GUEST_CARDS_KEY);
    const cards = existingCards ? JSON.parse(existingCards) : [];
    
    // Add expiration date to card
    const cardWithExpiry = {
      ...cardData,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + GUEST_SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      isGuestCard: true,
    };
    
    cards.push(cardWithExpiry);
    
    // Keep only recent cards (prevent localStorage bloat)
    const sortedCards = cards
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, MAX_GUEST_CARDS);
    
    localStorage.setItem(GUEST_CARDS_KEY, JSON.stringify(sortedCards));
    
    // Update session card count
    incrementGuestCardCount();
  } catch (error) {
    console.error('Error storing guest travel card:', error);
  }
}

/**
 * Get guest travel cards
 */
export function getGuestTravelCards(): any[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(GUEST_CARDS_KEY);
    if (!stored) return [];
    
    const cards = JSON.parse(stored);
    
    // Filter out expired cards
    const validCards = cards.filter((card: any) => {
      const expiresAt = new Date(card.expiresAt);
      return expiresAt > new Date();
    });
    
    // Update storage if we removed expired cards
    if (validCards.length !== cards.length) {
      localStorage.setItem(GUEST_CARDS_KEY, JSON.stringify(validCards));
    }
    
    return validCards;
  } catch (error) {
    console.error('Error loading guest travel cards:', error);
    return [];
  }
}

/**
 * Delete guest travel card
 */
export function deleteGuestTravelCard(cardId: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const cards = getGuestTravelCards();
    const updatedCards = cards.filter((card: any) => card.id !== cardId);
    
    localStorage.setItem(GUEST_CARDS_KEY, JSON.stringify(updatedCards));
    return true;
  } catch (error) {
    console.error('Error deleting guest travel card:', error);
    return false;
  }
}

/**
 * Generate shareable link for guest card
 */
export function generateGuestCardShareLink(cardId: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://scout.travel';
  return `${baseUrl}/shared/${cardId}`;
}

/**
 * Check if user should be prompted to register
 */
export function shouldPromptRegistration(): boolean {
  const session = getGuestSession();
  const cards = getGuestTravelCards();
  
  // Prompt after 3rd card or if approaching expiry
  const sessionInfo = getGuestSessionInfo();
  return session.cardsCreated >= 3 || sessionInfo.daysRemaining <= 2 || cards.length >= 3;
}

/**
 * Get registration benefits message
 */
export function getRegistrationBenefits(): string[] {
  return [
    'Save unlimited travel cards permanently',
    'Access your cards from any device',
    'Share cards with family and friends',
    'Get personalized travel recommendations',
    'Export cards to PDF with custom branding',
    'Receive travel deals and offers',
    'Priority customer support'
  ];
}