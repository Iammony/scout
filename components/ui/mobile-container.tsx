'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface MobileContainerProps {
  children: React.ReactNode;
  className?: string;
  fullHeight?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function MobileContainer({ 
  children, 
  className = '',
  fullHeight = false,
  padding = 'md'
}: MobileContainerProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-2 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  };

  return (
    <div 
      className={cn(
        'w-full mx-auto max-w-lg',
        fullHeight && 'min-h-screen',
        paddingClasses[padding],
        // Mobile-first responsive breakpoints
        'sm:max-w-xl md:max-w-2xl lg:max-w-4xl',
        // Ensure proper touch targets
        'touch-manipulation',
        className
      )}
    >
      {children}
    </div>
  );
}

interface TouchButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export function TouchButton({ 
  children, 
  onClick, 
  disabled = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = ''
}: TouchButtonProps) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white active:bg-blue-800',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white active:bg-gray-800',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-900 active:bg-gray-100',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-900 active:bg-gray-200'
  };

  const sizes = {
    sm: 'h-10 px-4 text-sm',
    md: 'h-12 px-6 text-base',
    lg: 'h-14 px-8 text-lg'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-lg font-medium transition-colors duration-150',
        'touch-manipulation select-none',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        // Larger touch targets for mobile
        'min-h-[44px] min-w-[44px]',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
    >
      {children}
    </button>
  );
}

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg';
}

export function MobileCard({ 
  children, 
  className = '',
  padding = 'md',
  shadow = 'md'
}: MobileCardProps) {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  };

  const shadowClasses = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  };

  return (
    <div 
      className={cn(
        'bg-white rounded-lg border border-gray-200',
        shadowClasses[shadow],
        paddingClasses[padding],
        // Mobile optimizations
        'w-full',
        className
      )}
    >
      {children}
    </div>
  );
}

interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  icon?: React.ReactNode;
}

export function MobileInput({ 
  label,
  error,
  helpText,
  icon,
  className = '',
  ...props
}: MobileInputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-900">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        
        <input
          className={cn(
            'w-full h-12 px-4 rounded-lg border border-gray-300',
            'bg-white text-base text-gray-900 placeholder-gray-500',
            'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'transition-colors duration-150',
            // Mobile optimizations
            'touch-manipulation',
            // Prevent zoom on iOS
            'text-[16px] sm:text-sm',
            icon && 'pl-10',
            error && 'border-red-300 focus:ring-red-500 focus:border-red-500',
            className
          )}
          {...props}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      {helpText && !error && (
        <p className="text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  );
}

export default MobileContainer;