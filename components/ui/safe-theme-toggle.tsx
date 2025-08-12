'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

const CompactThemeToggle = dynamic(
  () => import('./theme-toggle').then(mod => ({ default: mod.CompactThemeToggle })),
  { 
    ssr: false,
    loading: () => (
      <button
        className={cn(
          'group relative inline-flex h-10 w-10 items-center justify-center',
          'rounded-lg bg-gradient-to-br',
          'from-violet-500/10 to-purple-500/10',
          'border border-violet-500/20',
          'backdrop-blur-sm'
        )}
        aria-label="Toggle theme"
      >
        <div className="h-5 w-5" />
      </button>
    )
  }
);

interface SafeThemeToggleProps {
  className?: string;
}

export function SafeThemeToggle({ className }: SafeThemeToggleProps) {
  return <CompactThemeToggle className={className} />;
}