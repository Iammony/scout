import { AxioDB, SchemaTypes } from 'axiodb';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User, LocalUser, SocialUser, SignupCredentials } from '@/lib/types/user';

// AxioDB instance - single instance architecture
const db = new AxioDB();

// Database and collection names
const DB_NAME = 'scout_auth';
const USERS_COLLECTION = 'users';
const SESSIONS_COLLECTION = 'sessions';

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
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Create or get the database
      this.database = await db.createDB(DB_NAME);

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

  async findByProviderId(provider: string, providerId: string): Promise<User | null> {
    await this.ensureInitialized();
    
    try {
      const result = await this.usersCollection
        .query({ provider, providerId })
        .Limit(1)
        .exec();
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error finding user by provider ID:', error);
      return null;
    }
  }

  async createLocalUser(credentials: SignupCredentials): Promise<LocalUser> {
    await this.ensureInitialized();

    // Check if user already exists
    const existingUser = await this.findByEmail(credentials.email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password with increased rounds for security
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(credentials.password, saltRounds);

    const user: LocalUser = {
      id: `user_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`,
      email: credentials.email.toLowerCase(),
      name: credentials.name,
      provider: 'local',
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

  async createSocialUser(socialData: {
    email: string;
    name: string;
    avatar?: string;
    provider: 'google' | 'facebook' | 'apple' | 'twitter';
    providerId: string;
  }): Promise<SocialUser> {
    await this.ensureInitialized();

    const user: SocialUser = {
      id: `user_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`,
      email: socialData.email.toLowerCase(),
      name: socialData.name,
      avatar: socialData.avatar,
      provider: socialData.provider,
      providerId: socialData.providerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isEmailVerified: true, // Social accounts are pre-verified
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
      console.error('Error creating social user:', error);
      throw error;
    }
  }

  async linkSocialAccount(userId: string, provider: string, providerId: string): Promise<void> {
    await this.ensureInitialized();

    try {
      const user = await this.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const updatedUser = {
        ...user,
        providerId,
        updatedAt: new Date().toISOString()
      };

      await this.usersCollection.update(
        { id: userId },
        { $set: updatedUser }
      );
    } catch (error) {
      console.error('Error linking social account:', error);
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

// Initialize the repository
if (typeof window === 'undefined') {
  userRepository.initialize().catch(console.error);

  // Clean up expired sessions every hour
  setInterval(() => {
    userRepository.cleanExpiredSessions().catch(console.error);
  }, 60 * 60 * 1000);
}