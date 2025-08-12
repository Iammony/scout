'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Grid3x3, X, Maximize2 } from 'lucide-react';
import { TravelDeck, TravelDeckCard } from '@/lib/types/travel-deck';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Import individual card components
import OverviewCardView from './cards/OverviewCardView';
import ItineraryCardView from './cards/ItineraryCardView';
import TransportCardView from './cards/TransportCardView';
import AccommodationCardView from './cards/AccommodationCardView';
import AttractionsCardView from './cards/AttractionsCardView';
import DiningCardView from './cards/DiningCardView';
import BudgetCardView from './cards/BudgetCardView';
import VisaCardView from './cards/VisaCardView';
import WeatherCardView from './cards/WeatherCardView';
import CultureCardView from './cards/CultureCardView';
import EmergencyCardView from './cards/EmergencyCardView';
import ShoppingCardView from './cards/ShoppingCardView';

interface TravelDeckViewProps {
  deck: TravelDeck;
  onClose?: () => void;
  className?: string;
}

export default function TravelDeckView({ deck, onClose, className = '' }: TravelDeckViewProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  const [selectedGridCard, setSelectedGridCard] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentCard = deck.cards[currentCardIndex];
  const totalCards = deck.cards.length;
  
  console.log(`TravelDeckView - Current index: ${currentCardIndex}, Total cards: ${totalCards}`);
  console.log(`Current card:`, currentCard);

  const goToNext = useCallback(() => {
    setCurrentCardIndex((prev) => (prev + 1) % totalCards);
  }, [totalCards]);

  const goToPrevious = useCallback(() => {
    setCurrentCardIndex((prev) => (prev - 1 + totalCards) % totalCards);
  }, [totalCards]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (viewMode === 'single') {
        if (e.key === 'ArrowLeft') goToPrevious();
        if (e.key === 'ArrowRight') goToNext();
        if (e.key === 'Escape' && onClose) onClose();
        if (e.key === 'g') setViewMode('grid');
      } else if (viewMode === 'grid') {
        if (e.key === 'Escape') setViewMode('single');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [viewMode, goToPrevious, goToNext, onClose]);
  
  // Handle missing or invalid card
  if (!currentCard) {
    console.error(`No card found at index ${currentCardIndex}`);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Error: Card not found</p>
          <p className="text-sm text-gray-500">Index: {currentCardIndex}, Total: {totalCards}</p>
        </div>
      </div>
    );
  }

  const goToCard = (index: number) => {
    setCurrentCardIndex(index);
    setViewMode('single');
    setSelectedGridCard(null);
  };

  const renderCard = (card: TravelDeckCard) => {
    console.log(`Rendering card:`, { type: card.type, id: card.id, hasContent: !!card.content });
    
    try {
      switch (card.type) {
        case 'trip-summary':
          return <OverviewCardView card={card as any} isFullscreen={isFullscreen} />;
        case 'itinerary':
          return <ItineraryCardView card={card as any} isFullscreen={isFullscreen} />;
        case 'transport':
          return <TransportCardView card={card as any} isFullscreen={isFullscreen} />;
        case 'accommodation':
          return <AccommodationCardView card={card as any} isFullscreen={isFullscreen} />;
        case 'attractions':
          return <AttractionsCardView card={card as any} isFullscreen={isFullscreen} />;
        case 'dining':
          return <DiningCardView card={card as any} isFullscreen={isFullscreen} />;
        case 'budget':
          return <BudgetCardView card={card as any} isFullscreen={isFullscreen} />;
        case 'visa':
          return <VisaCardView card={card as any} isFullscreen={isFullscreen} />;
        case 'weather':
          return <WeatherCardView card={card as any} isFullscreen={isFullscreen} />;
        case 'culture':
          return <CultureCardView card={card as any} isFullscreen={isFullscreen} />;
        case 'emergency':
          return <EmergencyCardView card={card as any} isFullscreen={isFullscreen} />;
        case 'shopping':
          return <ShoppingCardView card={card as any} isFullscreen={isFullscreen} />;
        default:
          console.warn(`Unknown card type: ${(card as any).type}`);
          return (
            <div className="p-4 text-center text-gray-500">
              <p>Unknown card type: {(card as any).type}</p>
              <p className="text-sm mt-2">Card ID: {(card as any).id}</p>
            </div>
          );
      }
    } catch (error) {
      console.error(`Error rendering card ${card.type}:`, error);
      return (
        <div className="p-4 text-center text-red-500">
          <p>Error loading {card.type} card</p>
          <p className="text-sm mt-2">Please try again</p>
        </div>
      );
    }
  };

  const getCardIcon = (type: string) => {
    const icons: Record<string, string> = {
      overview: '🗺️',
      itinerary: '📅',
      transport: '✈️',
      accommodation: '🏨',
      attractions: '🎯',
      dining: '🍽️',
      budget: '💰',
      visa: '📄',
      weather: '☀️',
      culture: '🎭',
      emergency: '🚨',
      shopping: '🛍️',
    };
    return icons[type] || '📋';
  };

  const getCardColor = (type: string) => {
    const colors: Record<string, string> = {
      overview: 'bg-blue-100 text-blue-800',
      itinerary: 'bg-purple-100 text-purple-800',
      transport: 'bg-cyan-100 text-cyan-800',
      accommodation: 'bg-amber-100 text-amber-800',
      attractions: 'bg-green-100 text-green-800',
      dining: 'bg-orange-100 text-orange-800',
      budget: 'bg-yellow-100 text-yellow-800',
      visa: 'bg-red-100 text-red-800',
      weather: 'bg-sky-100 text-sky-800',
      culture: 'bg-pink-100 text-pink-800',
      emergency: 'bg-rose-100 text-rose-800',
      shopping: 'bg-indigo-100 text-indigo-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={cn(
      'relative w-full h-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50',
      isFullscreen && 'fixed inset-0 z-50',
      className
    )}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">
              {deck.destination} Travel Deck
            </h2>
            <Badge variant="secondary" className="text-xs">
              {deck.metadata.duration} • {deck.metadata.travelerCount} travelers
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(viewMode === 'single' ? 'grid' : 'single')}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'single' ? (
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Card Navigation Dots */}
          <div className="flex justify-center gap-2 mb-6">
            {deck.cards.map((_, index) => (
              <button
                key={index}
                onClick={() => goToCard(index)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-200',
                  index === currentCardIndex
                    ? 'w-8 bg-blue-600'
                    : 'bg-gray-300 hover:bg-gray-400'
                )}
                aria-label={`Go to card ${index + 1}`}
              />
            ))}
          </div>

          {/* Current Card */}
          <div className="relative">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Card Header */}
              <div className={cn(
                'px-6 py-4 border-b border-gray-100',
                getCardColor(currentCard.type)
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCardIcon(currentCard.type)}</span>
                    <div>
                      <h3 className="text-lg font-semibold">{currentCard.title}</h3>
                      {currentCard.subtitle && (
                        <p className="text-sm opacity-90">{currentCard.subtitle}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {currentCardIndex + 1} of {totalCards}
                  </Badge>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6 max-h-[600px] overflow-y-auto">
                {renderCard(currentCard)}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between pointer-events-none">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrevious}
                className="pointer-events-auto -ml-4 bg-white shadow-lg hover:shadow-xl"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNext}
                className="pointer-events-auto -mr-4 bg-white shadow-lg hover:shadow-xl"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="mt-6 text-center text-xs text-gray-500">
            Use arrow keys to navigate • Press G for grid view • ESC to close
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {deck.cards.map((card, index) => (
              <button
                key={card.id}
                onClick={() => goToCard(index)}
                className={cn(
                  'group relative bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-200 p-4 text-left',
                  'hover:scale-105 cursor-pointer'
                )}
              >
                <div className={cn(
                  'absolute inset-x-0 top-0 h-1 rounded-t-lg',
                  getCardColor(card.type).replace('text-', 'bg-').replace('-800', '-500')
                )} />
                
                <div className="flex items-start gap-3 mt-2">
                  <span className="text-2xl">{getCardIcon(card.type)}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {card.title}
                    </h4>
                    {card.subtitle && (
                      <p className="text-sm text-gray-600 truncate">
                        {card.subtitle}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="mt-3 flex items-center justify-between">
                  <Badge 
                    variant="secondary" 
                    className={cn('text-xs', getCardColor(card.type))}
                  >
                    {card.type}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    Card {index + 1}
                  </span>
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={() => setViewMode('single')}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Card View
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}