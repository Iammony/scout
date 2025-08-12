'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/contexts/theme-context';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'relative inline-flex h-10 w-20 items-center rounded-full',
        'bg-gradient-to-r from-violet-600 to-indigo-600',
        'dark:from-purple-500 dark:to-pink-500',
        'shadow-lg shadow-violet-500/25 dark:shadow-purple-500/25',
        'transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/30',
        'dark:hover:shadow-purple-500/30',
        'focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-purple-500',
        'focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900',
        className
      )}
      aria-label="Toggle theme"
    >
      <span
        className={cn(
          'absolute left-1 inline-flex h-8 w-8 items-center justify-center',
          'rounded-full bg-white dark:bg-gray-900',
          'shadow-md transition-transform duration-300',
          'transform',
          theme === 'dark' ? 'translate-x-10' : 'translate-x-0'
        )}
      >
        {theme === 'dark' ? (
          <Moon className="h-4 w-4 text-purple-500" />
        ) : (
          <Sun className="h-4 w-4 text-yellow-500" />
        )}
      </span>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}

interface CompactThemeToggleProps {
  className?: string;
}

export function CompactThemeToggle({ className }: CompactThemeToggleProps) {
  const [mounted, setMounted] = React.useState(false);
  const { theme, toggleTheme } = useTheme();
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className={cn(
          'group relative inline-flex h-10 w-10 items-center justify-center',
          'rounded-lg bg-gradient-to-br',
          'from-violet-500/10 to-purple-500/10',
          'border border-violet-500/20',
          'backdrop-blur-sm',
          className
        )}
        aria-label="Toggle theme"
      >
        <div className="h-5 w-5" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'group relative inline-flex h-10 w-10 items-center justify-center',
        'rounded-lg bg-gradient-to-br',
        'from-violet-500/10 to-purple-500/10',
        'dark:from-purple-500/20 dark:to-pink-500/20',
        'border border-violet-500/20 dark:border-purple-500/30',
        'backdrop-blur-sm',
        'transition-all duration-300',
        'hover:from-violet-500/20 hover:to-purple-500/20',
        'dark:hover:from-purple-500/30 dark:hover:to-pink-500/30',
        'hover:border-violet-500/30 dark:hover:border-purple-500/40',
        'hover:shadow-lg hover:shadow-violet-500/20',
        'dark:hover:shadow-purple-500/20',
        'focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-purple-500',
        className
      )}
      aria-label="Toggle theme"
    >
      <div className="relative h-5 w-5">
        <Sun 
          className={cn(
            'absolute inset-0 h-5 w-5 rotate-0 scale-100 transition-all',
            'text-amber-500',
            'dark:-rotate-90 dark:scale-0'
          )} 
        />
        <Moon 
          className={cn(
            'absolute inset-0 h-5 w-5 rotate-90 scale-0 transition-all',
            'text-purple-400',
            'dark:rotate-0 dark:scale-100'
          )} 
        />
      </div>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}