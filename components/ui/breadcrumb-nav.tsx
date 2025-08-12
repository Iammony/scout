'use client';

import React from 'react';
import { ChevronRight, Home, MapPin, Sparkles, User, Settings, CreditCard, Globe2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  isActive?: boolean;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  onNavigate?: (item: BreadcrumbItem, index: number) => void;
  className?: string;
}

const getDefaultIcon = (label: string) => {
  const lowerLabel = label.toLowerCase();
  
  if (lowerLabel.includes('home') || lowerLabel.includes('dashboard')) {
    return <Home className="w-4 h-4" />;
  }
  if (lowerLabel.includes('travel') || lowerLabel.includes('journey') || lowerLabel.includes('card')) {
    return <MapPin className="w-4 h-4" />;
  }
  if (lowerLabel.includes('create') || lowerLabel.includes('new')) {
    return <Sparkles className="w-4 h-4" />;
  }
  if (lowerLabel.includes('profile') || lowerLabel.includes('account')) {
    return <User className="w-4 h-4" />;
  }
  if (lowerLabel.includes('settings')) {
    return <Settings className="w-4 h-4" />;
  }
  if (lowerLabel.includes('destination') || lowerLabel.includes('location')) {
    return <Globe2 className="w-4 h-4" />;
  }
  if (lowerLabel.includes('payment') || lowerLabel.includes('billing')) {
    return <CreditCard className="w-4 h-4" />;
  }
  
  return null;
};

export function BreadcrumbNav({ items, onNavigate, className }: BreadcrumbNavProps) {
  const handleClick = (item: BreadcrumbItem, index: number) => {
    if (!item.isActive && onNavigate) {
      onNavigate(item, index);
    }
  };

  return (
    <nav 
      aria-label="Breadcrumb"
      className={cn(
        'flex items-center space-x-1 text-sm',
        'px-4 py-2',
        'bg-white/50 dark:bg-gray-900/50',
        'backdrop-blur-md',
        'border-b border-gray-200/50 dark:border-gray-800/50',
        className
      )}
    >
      <ol className="flex items-center space-x-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const icon = item.icon || getDefaultIcon(item.label);
          
          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight 
                  className={cn(
                    'w-4 h-4 mx-1',
                    'text-gray-400 dark:text-gray-600'
                  )} 
                />
              )}
              
              <button
                onClick={() => handleClick(item, index)}
                disabled={isLast}
                className={cn(
                  'inline-flex items-center space-x-1.5',
                  'px-2 py-1 rounded-md',
                  'transition-all duration-200',
                  'group',
                  isLast ? [
                    'text-web3-violet-600 dark:text-web3-violet-400',
                    'font-semibold',
                    'cursor-default',
                    'bg-web3-violet-50 dark:bg-web3-violet-900/20',
                    'border border-web3-violet-200 dark:border-web3-violet-800/50'
                  ] : [
                    'text-gray-600 dark:text-gray-400',
                    'hover:text-web3-violet-600 dark:hover:text-web3-violet-400',
                    'hover:bg-gray-100 dark:hover:bg-gray-800/50',
                    'cursor-pointer'
                  ]
                )}
                aria-current={isLast ? 'page' : undefined}
              >
                {icon && (
                  <span className={cn(
                    'transition-transform duration-200',
                    !isLast && 'group-hover:scale-110'
                  )}>
                    {icon}
                  </span>
                )}
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Animated breadcrumb variant with web3 effects
export function AnimatedBreadcrumbNav({ items, onNavigate, className }: BreadcrumbNavProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  
  const handleClick = (item: BreadcrumbItem, index: number) => {
    if (!item.isActive && onNavigate) {
      onNavigate(item, index);
    }
  };

  return (
    <nav 
      aria-label="Breadcrumb"
      className={cn(
        'relative',
        'px-4 py-3',
        'bg-gradient-to-r from-gray-50/90 via-white/90 to-gray-50/90',
        'dark:from-gray-900/90 dark:via-gray-800/90 dark:to-gray-900/90',
        'backdrop-blur-xl',
        'border-b border-gray-200/50 dark:border-gray-700/50',
        'shadow-sm',
        className
      )}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-web3-violet-500/5 via-web3-purple-500/5 to-web3-pink-500/5 dark:from-web3-violet-500/10 dark:via-web3-purple-500/10 dark:to-web3-pink-500/10 animate-pulse" />
      
      <ol className="relative flex items-center space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isHovered = hoveredIndex === index;
          const icon = item.icon || getDefaultIcon(item.label);
          
          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <div className="relative mx-2">
                  <ChevronRight 
                    className={cn(
                      'w-4 h-4',
                      'text-gray-400 dark:text-gray-600',
                      'transition-all duration-300',
                      hoveredIndex !== null && hoveredIndex >= index && 'text-web3-violet-400 dark:text-web3-violet-500'
                    )} 
                  />
                </div>
              )}
              
              <button
                onClick={() => handleClick(item, index)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                disabled={isLast}
                className={cn(
                  'relative inline-flex items-center space-x-2',
                  'px-3 py-1.5 rounded-lg',
                  'transition-all duration-300',
                  'group'
                )}
                aria-current={isLast ? 'page' : undefined}
              >
                {/* Hover effect background */}
                {(isHovered || isLast) && (
                  <div 
                    className={cn(
                      'absolute inset-0 rounded-lg',
                      'transition-all duration-300',
                      isLast ? [
                        'bg-gradient-to-r from-web3-violet-500/20 to-web3-purple-500/20',
                        'dark:from-web3-violet-500/30 dark:to-web3-purple-500/30',
                        'shadow-web3'
                      ] : [
                        'bg-gradient-to-r from-gray-100/80 to-gray-100/60',
                        'dark:from-gray-800/80 dark:to-gray-800/60'
                      ]
                    )}
                  />
                )}
                
                <span className="relative flex items-center space-x-2">
                  {icon && (
                    <span className={cn(
                      'transition-all duration-300',
                      isLast ? 'text-web3-violet-600 dark:text-web3-violet-400' : 
                      isHovered ? 'text-web3-violet-500 dark:text-web3-violet-400 scale-110' :
                      'text-gray-500 dark:text-gray-400'
                    )}>
                      {icon}
                    </span>
                  )}
                  <span className={cn(
                    'font-medium transition-all duration-300',
                    isLast ? [
                      'text-transparent bg-clip-text',
                      'bg-gradient-to-r from-web3-violet-600 to-web3-purple-600',
                      'dark:from-web3-violet-400 dark:to-web3-pink-400'
                    ] : isHovered ? [
                      'text-web3-violet-600 dark:text-web3-violet-400'
                    ] : [
                      'text-gray-600 dark:text-gray-400'
                    ]
                  )}>
                    {item.label}
                  </span>
                </span>
                
                {/* Active indicator */}
                {isLast && (
                  <div className="absolute -bottom-3 left-0 right-0 h-0.5 bg-gradient-to-r from-web3-violet-500 to-web3-purple-500 rounded-full shadow-neon" />
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Compact mobile-friendly breadcrumb
export function CompactBreadcrumb({ items, onNavigate, className }: BreadcrumbNavProps) {
  const displayItems = items.length > 3 
    ? [items[0], { label: '...', isActive: false }, items[items.length - 1]]
    : items;

  return (
    <nav 
      aria-label="Breadcrumb"
      className={cn(
        'flex items-center space-x-1 text-xs sm:text-sm',
        'px-3 py-1.5',
        'bg-white/80 dark:bg-gray-900/80',
        'backdrop-blur-sm',
        'border-b border-gray-200/50 dark:border-gray-800/50',
        className
      )}
    >
      <ol className="flex items-center space-x-1">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const icon = item.label === '...' ? null : (item.icon || getDefaultIcon(item.label));
          
          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="w-3 h-3 mx-1 text-gray-400 dark:text-gray-600" />
              )}
              
              {item.label === '...' ? (
                <span className="px-1 text-gray-400 dark:text-gray-600">...</span>
              ) : (
                <button
                  onClick={() => onNavigate?.(item, items.indexOf(item))}
                  disabled={isLast}
                  className={cn(
                    'inline-flex items-center space-x-1',
                    'px-1.5 py-0.5 rounded',
                    'transition-colors duration-200',
                    isLast ? [
                      'text-web3-violet-600 dark:text-web3-violet-400',
                      'font-semibold'
                    ] : [
                      'text-gray-600 dark:text-gray-400',
                      'hover:text-web3-violet-600 dark:hover:text-web3-violet-400'
                    ]
                  )}
                >
                  {icon && <span>{icon}</span>}
                  <span>{item.label}</span>
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}