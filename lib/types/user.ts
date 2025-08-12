export interface User {
  id: string;
  email: string;
  name: string;
  username: string; // Required unique username for all users
  avatar?: string;
  passwordHash: string; // All users now use local authentication
  createdAt: string;
  updatedAt: string;
  isEmailVerified: boolean;
  preferences?: {
    currency: string;
    language: string;
    notifications: boolean;
  };
}

export interface AuthSession {
  user: User;
  sessionId: string;
  expiresAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  name: string;
  username: string; // Required username during signup
}

export interface UsernameSetupCredentials {
  username: string;
}

export interface UsernameAvailabilityResponse {
  available: boolean;
  username: string;
  suggestions?: string[];
}