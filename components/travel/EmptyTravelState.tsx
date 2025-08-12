'use client';

import React from 'react';
import { Camera, Globe2, Sparkles, MapPin, Compass, Plane, Mountain, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EmptyTravelStateProps {
  onCreateCard: () => void;
  onMobileCapture?: () => void;
  isMobile?: boolean;
  className?: string;
}

export function EmptyTravelState({ 
  onCreateCard, 
  onMobileCapture, 
  isMobile = false, 
  className 
}: EmptyTravelStateProps) {
  const floatingIcons = [
    { Icon: Plane, delay: '0s', color: 'text-blue-500' },
    { Icon: Mountain, delay: '1s', color: 'text-green-500' },
    { Icon: Waves, delay: '2s', color: 'text-yellow-500' },
    { Icon: Compass, delay: '0.5s', color: 'text-purple-500' },
  ];

  return (
    <div className={cn('w-full', className)}>
      <Card className="relative overflow-hidden bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-web3-violet-500/5 via-web3-purple-500/5 to-web3-pink-500/5 dark:from-web3-violet-500/10 dark:via-web3-purple-500/10 dark:to-web3-pink-500/10" />
        
        {/* Floating Background Icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {floatingIcons.map(({ Icon, delay, color }, index) => (
            <div
              key={index}
              className={cn(
                'absolute opacity-10 dark:opacity-20',
                index === 0 && 'top-10 left-10 animate-bounce',
                index === 1 && 'top-20 right-16 animate-pulse',
                index === 2 && 'bottom-16 left-20 animate-bounce',
                index === 3 && 'bottom-10 right-10 animate-pulse'
              )}
              style={{ animationDelay: delay }}
            >
              <Icon className={cn('w-16 h-16', color)} />
            </div>
          ))}
        </div>

        <div className="relative px-8 py-16 text-center">
          {/* Main Illustration */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              {/* Central Globe */}
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-web3-violet-500 to-web3-purple-500 flex items-center justify-center shadow-2xl shadow-web3-violet-500/30 animate-pulse">
                <Globe2 className="w-12 h-12 text-white" />
              </div>
              
              {/* Orbiting Icons */}
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: '20s' }}>
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                    <Plane className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                    <Mountain className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                  <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <Waves className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="absolute top-1/2 -left-4 transform -translate-y-1/2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                    <Compass className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4 max-w-md mx-auto">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-web3-violet-600 via-web3-purple-600 to-web3-pink-600 dark:from-web3-violet-400 dark:via-web3-purple-400 dark:to-web3-pink-400 bg-clip-text text-transparent">
              Your Journey Starts Here
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
              Create your first travel card to unlock AI-powered recommendations, 
              real-time pricing, and personalized itineraries
            </p>

            {/* Features List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 text-sm">
              {[
                { icon: Sparkles, text: 'AI-Powered Planning' },
                { icon: MapPin, text: 'Smart Recommendations' },
                { icon: Globe2, text: 'Real-Time Data' },
                { icon: Camera, text: 'Photo Recognition' }
              ].map(({ icon: Icon, text }, index) => (
                <div 
                  key={index}
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-web3-violet-600 dark:hover:text-web3-violet-400 transition-colors"
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 space-y-3">
            {isMobile && onMobileCapture ? (
              <>
                <Button
                  onClick={onMobileCapture}
                  size="lg"
                  className={cn(
                    'w-full max-w-sm mx-auto block',
                    'bg-gradient-to-r from-web3-violet-600 to-web3-purple-600',
                    'hover:from-web3-violet-500 hover:to-web3-purple-500',
                    'dark:from-web3-violet-500 dark:to-web3-purple-500',
                    'dark:hover:from-web3-violet-400 dark:hover:to-web3-purple-400',
                    'shadow-lg hover:shadow-xl hover:shadow-web3-violet-500/30',
                    'transform hover:scale-105 transition-all duration-300',
                    'text-white font-semibold border-0'
                  )}
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Snap Your Destination
                </Button>
                
                <Button
                  onClick={onCreateCard}
                  variant="outline"
                  size="lg"
                  className={cn(
                    'w-full max-w-sm mx-auto block',
                    'border-web3-violet-300 dark:border-web3-violet-600',
                    'text-web3-violet-700 dark:text-web3-violet-400',
                    'hover:bg-web3-violet-50 dark:hover:bg-web3-violet-900/20',
                    'hover:border-web3-violet-400 dark:hover:border-web3-violet-500'
                  )}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Create Manually
                </Button>
              </>
            ) : (
              <Button
                onClick={onCreateCard}
                size="lg"
                className={cn(
                  'w-full max-w-sm mx-auto block',
                  'bg-gradient-to-r from-web3-violet-600 to-web3-purple-600',
                  'hover:from-web3-violet-500 hover:to-web3-purple-500',
                  'dark:from-web3-violet-500 dark:to-web3-purple-500',
                  'dark:hover:from-web3-violet-400 dark:hover:to-web3-purple-400',
                  'shadow-lg hover:shadow-xl hover:shadow-web3-violet-500/30',
                  'transform hover:scale-105 transition-all duration-300',
                  'text-white font-semibold border-0'
                )}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Create Your First Journey
              </Button>
            )}
          </div>

          {/* Bottom decoration */}
          <div className="mt-8 flex justify-center space-x-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-2 h-2 rounded-full bg-gradient-to-r from-web3-violet-400 to-web3-purple-400',
                  'animate-pulse'
                )}
                style={{ animationDelay: `${i * 0.5}s` }}
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}