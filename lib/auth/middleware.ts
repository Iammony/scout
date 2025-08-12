import { NextRequest } from 'next/server';
import { userRepository } from '@/lib/db/axiodb-user-repository';
import { User } from '@/lib/types/user';
import { enhancedSessionManager } from './enhanced-session';

export async function getAuthenticatedUser(request: NextRequest): Promise<User | null> {
  try {
    const sessionId = request.cookies.get('session')?.value;

    if (!sessionId) {
      return null;
    }

    // Use enhanced session validation with device fingerprinting
    const validationResult = await enhancedSessionManager.validateSession(sessionId, request);
    
    if (!validationResult.valid || !validationResult.session) {
      return null;
    }

    // Log security events for high-risk sessions
    if (validationResult.riskLevel === 'high') {
      console.warn(`🚨 High-risk session access: ${sessionId} (user: ${validationResult.session.userId})`);
    }

    // Find user
    const user = await userRepository.findById(validationResult.session.userId);
    
    if (!user) {
      return null;
    }

    // Remove sensitive data
    const userResponse = { ...user };
    if ('passwordHash' in userResponse) {
      delete (userResponse as any).passwordHash;
    }

    return userResponse;

  } catch (error) {
    console.error('Auth middleware error:', error);
    return null;
  }
}

export async function requireAuth(request: NextRequest): Promise<{ user: User } | { error: string, status: number }> {
  const user = await getAuthenticatedUser(request);
  
  if (!user) {
    return { error: 'Authentication required', status: 401 };
  }
  
  return { user };
}