'use client';

import React, { Suspense } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className,
  text 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={cn('flex flex-col items-center justify-center space-y-3', className)}>
      <div className="relative">
        <Loader2 className={cn('animate-spin text-web3-violet-600 dark:text-web3-violet-400', sizeClasses[size])} />
        {size === 'lg' && (
          <Sparkles className="absolute inset-0 w-12 h-12 text-web3-purple-500 animate-pulse opacity-50" />
        )}
      </div>
      {text && (
        <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

interface PageLoadingProps {
  text?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({ text = 'Loading...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-black">
    <div className="text-center space-y-6">
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-web3-mesh dark:bg-web3-mesh-dark opacity-20 dark:opacity-10 pointer-events-none" />
      
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-web3-violet-500 to-web3-purple-500 flex items-center justify-center mx-auto shadow-neon mb-6">
          <Sparkles className="w-10 h-10 text-white animate-pulse" />
        </div>
        
        <LoadingSpinner size="lg" text={text} />
        
        <div className="mt-6">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-web3-violet-600 to-web3-purple-600 dark:from-web3-violet-400 dark:to-web3-pink-400 bg-clip-text text-transparent">
            Scout Travel
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            AI-Powered Journey Planning
          </p>
        </div>
      </div>
    </div>
  </div>
);

interface SectionLoadingProps {
  rows?: number;
  className?: string;
}

export const SectionLoading: React.FC<SectionLoadingProps> = ({ 
  rows = 3, 
  className 
}) => (
  <div className={cn('animate-pulse space-y-4', className)}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    ))}
  </div>
);

interface CardLoadingProps {
  count?: number;
  className?: string;
}

export const CardLoading: React.FC<CardLoadingProps> = ({ 
  count = 6, 
  className 
}) => (
  <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg animate-pulse">
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    ))}
  </div>
);

interface LoadingBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export const LoadingBoundary: React.FC<LoadingBoundaryProps> = ({ 
  children, 
  fallback,
  className 
}) => (
  <Suspense fallback={fallback || <PageLoading />}>
    <div className={className}>
      {children}
    </div>
  </Suspense>
);

export default LoadingBoundary;