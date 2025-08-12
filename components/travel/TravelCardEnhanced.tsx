'use client';

import React, { useState } from 'react';
import { Calendar, MapPin, User, Users, Clock, Eye, Star, ArrowRight, Sparkles, Globe2, Share, Globe } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import MakePublicModal from './MakePublicModal';

interface TravelCard {
  id: string;
  destination: string;
  origin: string;
  travelType: string;
  createdAt: string;
  expiresAt?: string;
  isGuestCard: boolean;
  deck?: any;
  isPublic?: boolean;
}

interface TravelCardEnhancedProps {
  card: TravelCard;
  onClick: () => void;
  onPublicSuccess?: () => void;
  className?: string;
}

const getTravelTypeInfo = (travelType: string) => {
  switch (travelType) {
    case 'single':
      return { icon: User, label: 'Solo Travel', color: 'web3-violet' };
    case 'family':
      return { icon: Users, label: 'Family Trip', color: 'web3-purple' };
    case 'group':
      return { icon: Users, label: 'Group Adventure', color: 'web3-pink' };
    default:
      return { icon: User, label: 'Travel', color: 'web3-violet' };
  }
};

const getDestinationGradient = (destination: string) => {
  const gradients = [
    'from-blue-500 to-purple-600',
    'from-purple-500 to-pink-600',
    'from-green-500 to-blue-600',
    'from-yellow-500 to-red-600',
    'from-indigo-500 to-purple-600',
    'from-pink-500 to-rose-600',
  ];
  
  const hash = destination.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return gradients[Math.abs(hash) % gradients.length];
};

export function TravelCardEnhanced({ card, onClick, onPublicSuccess, className }: TravelCardEnhancedProps) {
  const { user, isAuthenticated } = useAuth();
  const [showMakePublic, setShowMakePublic] = useState(false);
  
  const typeInfo = getTravelTypeInfo(card.travelType);
  const TypeIcon = typeInfo.icon;
  const destinationGradient = getDestinationGradient(card.destination);
  const createdDate = new Date(card.createdAt);
  const isExpiring = card.expiresAt && new Date(card.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const canMakePublic = isAuthenticated && !card.isGuestCard && card.deck && !card.isPublic;

  const handleMakePublic = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      // Could show login modal here
      return;
    }

    setShowMakePublic(true);
  };


  const handlePublicSuccess = () => {
    setShowMakePublic(false);
    onPublicSuccess?.();
  };

  return (
    <Card
      className={cn(
        'group relative overflow-hidden',
        'bg-gradient-to-br from-white to-gray-50/50',
        'dark:from-gray-900 dark:to-gray-800/50',
        'border border-gray-200/50 dark:border-gray-700/50',
        'hover:border-web3-violet-300 dark:hover:border-web3-violet-600',
        'shadow-lg hover:shadow-2xl hover:shadow-web3-violet-500/20',
        'transition-all duration-500 ease-out',
        'cursor-pointer transform hover:scale-[1.02]',
        'backdrop-blur-sm',
        className
      )}
      onClick={onClick}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-web3-violet-500/5 via-transparent to-web3-purple-500/5 dark:from-web3-violet-500/10 dark:to-web3-purple-500/10" />
      
      {/* Header with Destination */}
      <div className="relative p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div className={cn(
                'w-2 h-2 rounded-full bg-gradient-to-r',
                destinationGradient,
                'shadow-sm animate-pulse'
              )} />
              <Badge 
                variant="secondary" 
                className={cn(
                  'text-xs font-medium',
                  `bg-${typeInfo.color}-100 text-${typeInfo.color}-700`,
                  `dark:bg-${typeInfo.color}-900/30 dark:text-${typeInfo.color}-400`,
                  'border-0'
                )}
              >
                <TypeIcon className="w-3 h-3 mr-1" />
                {typeInfo.label}
              </Badge>
            </div>
            
            <h3 className={cn(
              'text-xl font-bold mb-1',
              'bg-gradient-to-r from-gray-900 to-gray-700',
              'dark:from-white dark:to-gray-300',
              'bg-clip-text text-transparent',
              'group-hover:from-web3-violet-600 group-hover:to-web3-purple-600',
              'dark:group-hover:from-web3-violet-400 dark:group-hover:to-web3-pink-400',
              'transition-all duration-300'
            )}>
              {card.destination}
            </h3>
            
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="w-4 h-4 mr-1" />
              <span>From {card.origin}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            {card.isPublic && (
              <Badge 
                className="bg-web3-violet-100 text-web3-violet-700 dark:bg-web3-violet-900/30 dark:text-web3-violet-400 border-0"
              >
                <Globe className="w-3 h-3 mr-1" />
                Public
              </Badge>
            )}
            
            {card.deck && (
              <Badge 
                className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0"
              >
                <Eye className="w-3 h-3 mr-1" />
                Ready
              </Badge>
            )}
            
            {isExpiring && (
              <Badge 
                className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0"
              >
                <Clock className="w-3 h-3 mr-1" />
                Expiring
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative px-6 pb-6">
        <div className="space-y-4">
          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="w-4 h-4 text-web3-violet-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {createdDate.toLocaleDateString()}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm">
              <Sparkles className="w-4 h-4 text-web3-purple-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {card.isGuestCard ? 'Guest' : 'Saved'}
              </span>
            </div>
          </div>

          {/* Preview Content */}
          {card.deck ? (
            <div className="bg-gradient-to-r from-web3-violet-50 to-web3-purple-50 dark:from-web3-violet-900/20 dark:to-web3-purple-900/20 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-sm">
                <Star className="w-4 h-4 text-web3-violet-600 dark:text-web3-violet-400" />
                <span className="text-web3-violet-700 dark:text-web3-violet-300 font-medium">
                  Complete travel guide available
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  Processing travel information...
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              className={cn(
                'w-full group/btn',
                'bg-gradient-to-r from-web3-violet-600 to-web3-purple-600',
                'hover:from-web3-violet-500 hover:to-web3-purple-500',
                'dark:from-web3-violet-500 dark:to-web3-purple-500',
                'dark:hover:from-web3-violet-400 dark:hover:to-web3-purple-400',
                'shadow-lg hover:shadow-xl',
                'border-0 text-white font-semibold',
                'transition-all duration-300'
              )}
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              <span className="flex items-center justify-center space-x-2">
                <Globe2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                <span>{card.deck ? 'View Travel Guide' : 'View Details'}</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </span>
            </Button>

            {/* Make Public Button */}
            {canMakePublic && (
              <Button
                variant="outline"
                className={cn(
                  'w-full group/share',
                  'border-web3-violet-300 dark:border-web3-violet-700',
                  'text-web3-violet-700 dark:text-web3-violet-400',
                  'hover:bg-web3-violet-50 dark:hover:bg-web3-violet-900/20',
                  'transition-all duration-300'
                )}
                onClick={handleMakePublic}
              >
                <span className="flex items-center justify-center space-x-2">
                  <Share className="w-4 h-4 group-hover/share:scale-110 transition-transform" />
                  <span>Make Public</span>
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-web3-violet-500/0 via-web3-purple-500/0 to-web3-pink-500/0 group-hover:from-web3-violet-500/10 group-hover:via-web3-purple-500/10 group-hover:to-web3-pink-500/10 transition-all duration-500 pointer-events-none" />
      
      {/* Corner Decoration */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-web3-violet-500/20 to-transparent rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Modals */}
      <MakePublicModal
        isOpen={showMakePublic}
        onClose={() => setShowMakePublic(false)}
        onSuccess={handlePublicSuccess}
        cardId={card.id}
        destination={card.destination}
        origin={card.origin}
      />
    </Card>
  );
}

export default TravelCardEnhanced;