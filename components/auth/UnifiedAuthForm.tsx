'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnifiedAuthFormProps {
  onSuccess: () => void;
}

interface FormData {
  email: string;
  password: string;
  name: string;
  username: string;
}

interface UsernameAvailability {
  available: boolean;
  suggestions?: string[];
}

const UnifiedAuthForm: React.FC<UnifiedAuthFormProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    name: '',
    username: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Username checking states
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailability, setUsernameAvailability] = useState<UsernameAvailability | null>(null);

  // Check username availability with debounce (only for signup mode)
  useEffect(() => {
    if (mode !== 'signup' || !formData.username || formData.username.length < 3) {
      setUsernameAvailability(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsCheckingUsername(true);
      try {
        const response = await fetch(`/api/auth/username/check?username=${encodeURIComponent(formData.username)}`);
        const result = await response.json();
        setUsernameAvailability(result);
      } catch (error) {
        console.error('Failed to check username:', error);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.username, mode]);

  // Generate initial username suggestion from name (alphanumeric only)
  useEffect(() => {
    if (mode === 'signup' && formData.name && !formData.username) {
      const suggestion = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 15); // Limit to 15 chars to leave room for numbers if needed
      setFormData(prev => ({ ...prev, username: suggestion }));
    }
  }, [formData.name, formData.username, mode]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    if (mode === 'signup' && !usernameAvailability?.available) {
      setError('Please choose an available username');
      setIsLoading(false);
      return;
    }

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const payload = mode === 'login' 
        ? { email: formData.email, password: formData.password }
        : { 
            email: formData.email, 
            password: formData.password, 
            name: formData.name,
            username: formData.username 
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || `${mode === 'login' ? 'Login' : 'Signup'} failed`);
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [formData, mode, usernameAvailability, onSuccess]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setFormData(prev => ({ ...prev, username: suggestion }));
  }, []);

  const toggleMode = useCallback(() => {
    setMode(prev => prev === 'login' ? 'signup' : 'login');
    setError('');
    setUsernameAvailability(null);
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto p-6 glass dark:glass-dark border-web3-violet-200 dark:border-web3-violet-800/30 shadow-neon">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-web3-violet-500 to-web3-purple-500 flex items-center justify-center mx-auto shadow-neon mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-web3-violet-600 to-web3-purple-600 dark:from-web3-violet-400 dark:to-web3-pink-400 bg-clip-text text-transparent">
            {mode === 'login' ? 'Welcome Back' : 'Join Scout Travel'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {mode === 'login' 
              ? 'Sign in to access your travel guides' 
              : 'Create an account to save and share your adventures'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name field (signup only) */}
          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-900 dark:text-white">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  className="pl-10 border-web3-violet-300 dark:border-web3-violet-700 rounded-xl focus:ring-web3-violet-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
          )}

          {/* Username field (signup only) */}
          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-900 dark:text-white">Username</Label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400 text-sm">@</span>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a unique username"
                  className="pl-8 pr-10 border-web3-violet-300 dark:border-web3-violet-700 rounded-xl focus:ring-web3-violet-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  value={formData.username}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                    setFormData(prev => ({ ...prev, username: value }));
                  }}
                  disabled={isLoading}
                  required
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {isCheckingUsername && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-web3-violet-600 border-t-transparent"></div>
                  )}
                  {usernameAvailability && !isCheckingUsername && (
                    <div className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center",
                      usernameAvailability.available 
                        ? "bg-green-100 dark:bg-green-900/30" 
                        : "bg-red-100 dark:bg-red-900/30"
                    )}>
                      {usernameAvailability.available ? (
                        <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                3-20 characters, letters and numbers only (alphanumeric)
              </div>

              {/* Username Status */}
              {usernameAvailability && !isCheckingUsername && (
                <div className={cn(
                  "text-sm flex items-center space-x-2",
                  usernameAvailability.available 
                    ? "text-green-600 dark:text-green-400" 
                    : "text-red-600 dark:text-red-400"
                )}>
                  {usernameAvailability.available ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Username is available!</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      <span>Username is not available</span>
                    </>
                  )}
                </div>
              )}

              {/* Username Suggestions */}
              {usernameAvailability?.suggestions && usernameAvailability.suggestions.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm text-gray-700 dark:text-gray-300">Suggestions:</Label>
                  <div className="flex flex-wrap gap-2">
                    {usernameAvailability.suggestions.slice(0, 4).map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-3 py-1 text-xs bg-web3-violet-100 dark:bg-web3-violet-900/30 text-web3-violet-700 dark:text-web3-violet-400 rounded-lg hover:bg-web3-violet-200 dark:hover:bg-web3-violet-900/50 transition-colors"
                      >
                        @{suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Email field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-900 dark:text-white">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="pl-10 border-web3-violet-300 dark:border-web3-violet-700 rounded-xl focus:ring-web3-violet-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-900 dark:text-white">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={mode === 'signup' ? 'Create a password (8+ characters)' : 'Enter your password'}
                className="pl-10 pr-10 border-web3-violet-300 dark:border-web3-violet-700 rounded-xl focus:ring-web3-violet-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {mode === 'signup' && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Must be at least 8 characters with uppercase, lowercase, and number
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm text-red-800 dark:text-red-300">{error}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-web3-violet-600 to-web3-purple-600 hover:from-web3-violet-500 hover:to-web3-purple-500 text-white shadow-web3 hover:shadow-neon transition-all duration-300 border-0"
            disabled={isLoading || (mode === 'signup' && !usernameAvailability?.available)}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </Button>
        </form>

        {/* Mode Toggle */}
        <div className="text-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            type="button"
            className="text-web3-violet-600 dark:text-web3-violet-400 hover:text-web3-violet-700 dark:hover:text-web3-violet-300 font-medium transition-colors"
            onClick={toggleMode}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </div>

        {/* Terms (signup only) */}
        {mode === 'signup' && (
          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </div>
        )}
      </div>
    </Card>
  );
};

export default UnifiedAuthForm;