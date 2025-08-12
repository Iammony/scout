import { AxioDB, SchemaTypes } from 'axiodb';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User, SignupCredentials, UsernameSetupCredentials, UsernameAvailabilityResponse } from '@/lib/types/user';
import { TravelCard, PublicTravelCard, PublicCardMetadata } from '@/lib/types/travel';

// AxioDB instance - single instance architecture (lazy-loaded)
let db: AxioDB | null = null;

const getDB = () => {
  if (!db) {
    db = new AxioDB();
  }
  return db;
};

// Database and collection names
const DB_NAME = 'scout_auth';
const USERS_COLLECTION = 'users';
const SESSIONS_COLLECTION = 'sessions';
const TRAVEL_CARDS_COLLECTION = 'travel_cards';
const PUBLIC_CARDS_COLLECTION = 'public_cards';

// Simplified approach - disable schema validation for now to get AxioDB working
// We can re-enable with proper schema format later
const useSchema = false;

interface SessionRecord {
  sessionId: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

class AxioDBUserRepository {
  private database: any = null;
  private usersCollection: any = null;
  private sessionsCollection: any = null;
  private travelCardsCollection: any = null;
  private publicCardsCollection: any = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Skip initialization during build process
    if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
      console.log('Skipping AxioDB initialization during build phase');
      return;
    }

    try {
      // Create or get the database
      this.database = await getDB().createDB(DB_NAME);

      // Create users collection with encryption (schema disabled for now)
      this.usersCollection = await this.database.createCollection(
        USERS_COLLECTION,
        false // Disable schema validation for now
      );

      // Create sessions collection with encryption (schema disabled for now)
      this.sessionsCollection = await this.database.createCollection(
        SESSIONS_COLLECTION,
        false // Disable schema validation for now
      );

      // Create travel cards collection
      this.travelCardsCollection = await this.database.createCollection(
        TRAVEL_CARDS_COLLECTION,
        false // Disable schema validation for now
      );

      // Create public cards collection
      this.publicCardsCollection = await this.database.createCollection(
        PUBLIC_CARDS_COLLECTION,
        false // Disable schema validation for now
      );

      this.initialized = true;
      console.log('AxioDB User Repository initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AxioDB User Repository:', error);
      throw error;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // If still not initialized (e.g., during build), throw a warning
    if (!this.initialized) {
      throw new Error('AxioDB is not available during build phase');
    }
  }

  async findById(id: string): Promise<User | null> {
    await this.ensureInitialized();
    
    try {
      const result = await this.usersCollection
        .query({ id })
        .Limit(1)
        .exec();
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    await this.ensureInitialized();
    
    try {
      const result = await this.usersCollection
        .query({ email: email.toLowerCase() })
        .Limit(1)
        .exec();
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    await this.ensureInitialized();
    
    try {
      const result = await this.usersCollection
        .query({ username: username.toLowerCase() })
        .Limit(1)
        .exec();
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error finding user by username:', error);
      return null;
    }
  }

  async checkUsernameAvailability(username: string): Promise<UsernameAvailabilityResponse> {
    await this.ensureInitialized();
    
    try {
      const normalizedUsername = username.toLowerCase().trim();
      
      // Basic validation
      if (normalizedUsername.length < 3 || normalizedUsername.length > 20) {
        return {
          available: false,
          username: normalizedUsername,
          suggestions: this.generateUsernameSuggestions(normalizedUsername)
        };
      }

      // Check if username contains only valid characters
      if (!/^[a-zA-Z0-9_]+$/.test(normalizedUsername)) {
        return {
          available: false,
          username: normalizedUsername,
          suggestions: this.generateUsernameSuggestions(normalizedUsername)
        };
      }

      const existingUser = await this.findByUsername(normalizedUsername);
      
      return {
        available: !existingUser,
        username: normalizedUsername,
        suggestions: !existingUser ? [] : this.generateUsernameSuggestions(normalizedUsername)
      };
    } catch (error) {
      console.error('Error checking username availability:', error);
      return {
        available: false,
        username,
        suggestions: []
      };
    }
  }

  private generateUsernameSuggestions(baseUsername: string): string[] {
    const suggestions: string[] = [];
    const cleanBase = baseUsername.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    
    for (let i = 1; i <= 5; i++) {
      suggestions.push(`${cleanBase}${i}`);
      suggestions.push(`${cleanBase}_${i}`);
    }
    
    suggestions.push(`${cleanBase}_travel`);
    suggestions.push(`${cleanBase}_scout`);
    suggestions.push(`travel_${cleanBase}`);
    
    return suggestions.slice(0, 6); // Return top 6 suggestions
  }


  async createLocalUser(credentials: SignupCredentials): Promise<User> {
    await this.ensureInitialized();

    // Check if user already exists
    const existingUser = await this.findByEmail(credentials.email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Check if username already exists
    const existingUsername = await this.findByUsername(credentials.username);
    if (existingUsername) {
      throw new Error('Username is already taken');
    }

    // Hash password with increased rounds for security
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(credentials.password, saltRounds);

    const user: User = {
      id: `user_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`,
      email: credentials.email.toLowerCase(),
      name: credentials.name,
      username: credentials.username.toLowerCase(),
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isEmailVerified: false,
      preferences: {
        currency: 'INR',
        language: 'en',
        notifications: true
      }
    };

    try {
      await this.usersCollection.insert(user);
      return user;
    } catch (error) {
      console.error('Error creating local user:', error);
      throw error;
    }
  }


  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    await this.ensureInitialized();

    try {
      const user = await this.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const updatedUser = {
        ...user,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await this.usersCollection.update(
        { id: userId },
        { $set: updatedUser }
      );

      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }


  async deleteUser(userId: string): Promise<void> {
    await this.ensureInitialized();

    try {
      await this.usersCollection.delete({ id: userId });
      
      // Also delete all sessions for this user
      await this.sessionsCollection.delete({ userId });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async createSession(userId: string, expiresAt: Date): Promise<string> {
    await this.ensureInitialized();

    // Use cryptographically secure session ID generation
    const sessionId = `session_${crypto.randomBytes(32).toString('hex')}`;
    const session: SessionRecord = {
      sessionId,
      userId,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString()
    };

    try {
      await this.sessionsCollection.insert(session);
      return sessionId;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async findSession(sessionId: string): Promise<SessionRecord | null> {
    await this.ensureInitialized();

    try {
      const result = await this.sessionsCollection
        .query({ sessionId })
        .Limit(1)
        .exec();
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error finding session:', error);
      return null;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.ensureInitialized();

    try {
      await this.sessionsCollection.delete({ sessionId });
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  async cleanExpiredSessions(): Promise<void> {
    await this.ensureInitialized();

    try {
      const now = new Date().toISOString();
      
      // Delete sessions where expiresAt < now
      const expiredSessions = await this.sessionsCollection
        .query({})
        .exec();

      for (const session of expiredSessions) {
        if (new Date(session.expiresAt) < new Date(now)) {
          await this.sessionsCollection.delete({ sessionId: session.sessionId });
        }
      }
    } catch (error) {
      console.error('Error cleaning expired sessions:', error);
    }
  }

  // Public Cards Management
  async makeCardPublic(
    cardId: string, 
    userId: string, 
    metadata: Omit<PublicCardMetadata, 'createdByUserId' | 'likes' | 'views' | 'publishedAt'>
  ): Promise<void> {
    await this.ensureInitialized();

    try {
      const user = await this.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const publicCardData: PublicCardMetadata = {
        ...metadata,
        createdByUserId: userId,
        createdBy: user.username,
        likes: 0,
        views: 0,
        publishedAt: new Date()
      };

      await this.publicCardsCollection.insert({
        id: cardId,
        userId,
        metadata: publicCardData,
        createdAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error making card public:', error);
      throw error;
    }
  }

  async getPublicCards(
    page: number = 1, 
    limit: number = 12, 
    sortBy: 'recent' | 'popular' | 'featured' = 'recent'
  ): Promise<{ cards: PublicTravelCard[]; totalCount: number; hasMore: boolean }> {
    await this.ensureInitialized();

    try {
      const allCards = await this.publicCardsCollection
        .query({})
        .exec();

      // Sort cards
      let sortedCards = [...allCards];
      switch (sortBy) {
        case 'popular':
          sortedCards.sort((a, b) => (b.metadata.likes + b.metadata.views) - (a.metadata.likes + a.metadata.views));
          break;
        case 'featured':
          sortedCards.sort((a, b) => {
            if (a.metadata.featured && !b.metadata.featured) return -1;
            if (!a.metadata.featured && b.metadata.featured) return 1;
            return new Date(b.metadata.publishedAt).getTime() - new Date(a.metadata.publishedAt).getTime();
          });
          break;
        case 'recent':
        default:
          sortedCards.sort((a, b) => new Date(b.metadata.publishedAt).getTime() - new Date(a.metadata.publishedAt).getTime());
          break;
      }

      const totalCount = sortedCards.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedCards = sortedCards.slice(startIndex, endIndex);

      // Convert to PublicTravelCard format (simplified for now)
      const publicCards: PublicTravelCard[] = paginatedCards.map(card => ({
        id: card.id,
        title: card.metadata.title,
        description: card.metadata.description,
        destination: 'Unknown', // Would be populated from actual card data
        origin: 'Unknown', // Would be populated from actual card data
        travelType: 'single' as any, // Would be populated from actual card data
        duration: 'Unknown',
        budget: 'Comfortable' as any,
        tags: card.metadata.tags,
        createdBy: card.metadata.createdBy,
        createdByUserId: card.metadata.createdByUserId,
        likes: card.metadata.likes,
        views: card.metadata.views,
        featured: card.metadata.featured,
        publishedAt: card.metadata.publishedAt,
        preview: {
          highlights: [],
          totalCost: 0,
          currency: 'INR'
        }
      }));

      return {
        cards: publicCards,
        totalCount,
        hasMore: endIndex < totalCount
      };
    } catch (error) {
      console.error('Error getting public cards:', error);
      return { cards: [], totalCount: 0, hasMore: false };
    }
  }

  async incrementCardViews(cardId: string): Promise<void> {
    await this.ensureInitialized();

    try {
      const card = await this.publicCardsCollection
        .query({ id: cardId })
        .Limit(1)
        .exec();
      
      if (card.length > 0) {
        const updatedCard = {
          ...card[0],
          metadata: {
            ...card[0].metadata,
            views: card[0].metadata.views + 1
          }
        };

        await this.publicCardsCollection.update(
          { id: cardId },
          { $set: updatedCard }
        );
      }
    } catch (error) {
      console.error('Error incrementing card views:', error);
    }
  }

  async toggleCardLike(cardId: string, userId: string): Promise<{ liked: boolean; totalLikes: number }> {
    await this.ensureInitialized();

    try {
      // This is a simplified implementation
      // In a real app, you'd track which users liked which cards
      const card = await this.publicCardsCollection
        .query({ id: cardId })
        .Limit(1)
        .exec();
      
      if (card.length > 0) {
        const currentLikes = card[0].metadata.likes;
        const newLikes = currentLikes + 1; // Simplified - always increment
        
        const updatedCard = {
          ...card[0],
          metadata: {
            ...card[0].metadata,
            likes: newLikes
          }
        };

        await this.publicCardsCollection.update(
          { id: cardId },
          { $set: updatedCard }
        );

        return { liked: true, totalLikes: newLikes };
      }

      return { liked: false, totalLikes: 0 };
    } catch (error) {
      console.error('Error toggling card like:', error);
      return { liked: false, totalLikes: 0 };
    }
  }

  // Health check method
  async getStats(): Promise<{ users: number; activeSessions: number }> {
    await this.ensureInitialized();

    try {
      const users = await this.usersCollection
        .query({})
        .exec();

      const sessions = await this.sessionsCollection
        .query({})
        .exec();

      const now = new Date();
      const activeSessions = Array.isArray(sessions) 
        ? sessions.filter((session: SessionRecord) => new Date(session.expiresAt) >= now)
        : [];

      return {
        users: Array.isArray(users) ? users.length : 0,
        activeSessions: activeSessions.length
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return { users: 0, activeSessions: 0 };
    }
  }
}

// Create and export the repository instance
export const userRepository = new AxioDBUserRepository();

// Initialize the repository only in runtime, not during build
if (typeof window === 'undefined' && 
    process.env.NEXT_PHASE !== 'phase-production-build' &&
    process.env.NEXT_PHASE !== 'phase-development' &&
    !process.argv.includes('build')) {
  
  userRepository.initialize().catch((error) => {
    console.warn('AxioDB initialization failed (non-critical during build):', error.message);
  });

  // Clean up expired sessions every hour (only in production runtime)
  setInterval(() => {
    userRepository.cleanExpiredSessions().catch(console.error);
  }, 60 * 60 * 1000);
}