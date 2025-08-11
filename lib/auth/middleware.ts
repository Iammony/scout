import { NextRequest } from 'next/server';
import { userRepository } from '@/lib/db/axiodb-user-repository';
import { User } from '@/lib/types/user';

export async function getAuthenticatedUser(request: NextRequest): Promise<User | null> {
  try {
    const sessionId = request.cookies.get('session')?.value;

    if (!sessionId) {
      return null;
    }

    // Find session
    const session = await userRepository.findSession(sessionId);
    
    if (!session) {
      return null;
    }

    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      await userRepository.deleteSession(sessionId);
      return null;
    }

    // Find user
    const user = await userRepository.findById(session.userId);
    
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