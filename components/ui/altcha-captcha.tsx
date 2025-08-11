'use client';

import React, { useEffect, useRef, useState } from 'react';

interface AltchaCaptchaProps {
  challengeurl: string;
  onVerified?: (payload: string) => void;
  onError?: (error: Error) => void;
  className?: string;
  disabled?: boolean;
}

interface AltchaElement extends HTMLElement {
  reset(): void;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'altcha-widget': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          challengeurl?: string;
          hidefooter?: boolean;
          hidelogo?: boolean;
          name?: string;
          strings?: string;
        },
        HTMLElement
      >;
    }
  }
}

export default function AltchaCaptcha({
  challengeurl,
  onVerified,
  onError,
  className = '',
  disabled = false,
}: AltchaCaptchaProps) {
  const widgetRef = useRef<AltchaElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load ALTCHA web component script
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/altcha-lib@latest/dist/altcha.min.js';
    script.type = 'module';
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Cleanup script if component unmounts
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !widgetRef.current) return;

    const widget = widgetRef.current;

    const handleStateChange = (event: CustomEvent) => {
      if (event.detail.state === 'verified' && event.detail.payload) {
        onVerified?.(event.detail.payload);
      } else if (event.detail.state === 'error') {
        onError?.(new Error(event.detail.error || 'Captcha verification failed'));
      }
    };

    // Add event listener with proper typing
    widget.addEventListener('statechange', handleStateChange as EventListener);

    return () => {
      widget.removeEventListener('statechange', handleStateChange as EventListener);
    };
  }, [isLoaded, onVerified, onError]);

  const resetCaptcha = () => {
    if (widgetRef.current && 'reset' in widgetRef.current) {
      (widgetRef.current as AltchaElement).reset();
    }
  };

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center p-4 border border-gray-200 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
          <span className="text-sm text-gray-600">Loading captcha...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`altcha-container ${className}`}>
      <altcha-widget
        ref={widgetRef as any}
        challengeurl={challengeurl}
        hidefooter={false}
        hidelogo={false}
        style={{ 
          opacity: disabled ? 0.5 : 1, 
          pointerEvents: disabled ? 'none' : 'auto' 
        }}
      />
      {process.env.NODE_ENV === 'development' && (
        <button
          type="button"
          onClick={resetCaptcha}
          className="mt-2 text-xs text-gray-500 hover:text-gray-700"
        >
          Reset Captcha (Dev)
        </button>
      )}
    </div>
  );
}