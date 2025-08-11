export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: 'local' | 'google' | 'facebook' | 'apple' | 'twitter';
  providerId?: string;
  createdAt: string;
  updatedAt: string;
  isEmailVerified: boolean;
  preferences?: {
    currency: string;
    language: string;
    notifications: boolean;
  };
}

export interface LocalUser extends User {
  provider: 'local';
  passwordHash: string;
}

export interface SocialUser extends User {
  provider: 'google' | 'facebook' | 'apple' | 'twitter';
  providerId: string;
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
}