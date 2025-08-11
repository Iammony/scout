'use client';

import React, { useState } from 'react';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';
import AltchaCaptcha from '@/components/ui/altcha-captcha';
import { Card } from '@/components/ui/card';

interface CaptchaVerificationProps {
  onVerified: (payload: string) => void;
  isVerified: boolean;
  className?: string;
}

export default function CaptchaVerification({ 
  onVerified, 
  isVerified, 
  className = '' 
}: CaptchaVerificationProps) {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCaptchaVerified = (payload: string) => {
    setError('');
    setIsLoading(false);
    onVerified(payload);
  };

  const handleCaptchaError = (error: Error) => {
    setError(error.message);
    setIsLoading(false);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Security Verification</h2>
        <p className="text-gray-600">
          Please complete the security check to generate your travel plan
        </p>
      </div>

      {/* Captcha Card */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-gray-900">Verify you're human</h3>
          </div>
          
          {/* Development Notice */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-amber-800">
                  Development mode: Captcha verification is optional
                </span>
              </div>
            </div>
          )}

          {/* ALTCHA Captcha Widget */}
          <div className="flex justify-center">
            <AltchaCaptcha
              challengeurl="/api/captcha/challenge"
              onVerified={handleCaptchaVerified}
              onError={handleCaptchaError}
              className="max-w-md"
              disabled={isLoading}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Success Display */}
          {isVerified && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">
                  ✓ Security verification completed successfully
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Info */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          This helps us prevent automated requests and keep Scout secure
        </p>
      </div>
    </div>
  );
}