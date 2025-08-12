import { NextRequest } from 'next/server';
import { userRepository } from '@/lib/db/axiodb-user-repository';
import { User } from '@/lib/types/user';

export async function getUserFromSession(request: NextRequest): Promise<User | null> {
  try {
    // Get session ID from cookies
    const sessionId = request.cookies.get('auth-session')?.value;
    
    if (!sessionId) {
      return null;
    }

    // Find the session
    const session = await userRepository.findSession(sessionId);
    
    if (!session) {
      return null;
    }

    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      // Clean up expired session
      await userRepository.deleteSession(sessionId);
      return null;
    }

    // Get the user
    const user = await userRepository.findById(session.userId);
    
    return user;
  } catch (error) {
    console.error('Error getting user from session:', error);
    return null;
  }
}