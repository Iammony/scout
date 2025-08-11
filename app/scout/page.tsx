'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowLeft, Calendar, MapPin, User, LogOut, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import JourneyForm from '@/components/travel/JourneyForm';
import ComprehensiveTravelGuide from '@/components/travel-deck/ComprehensiveTravelGuide';
import AuthModal from '@/components/auth/AuthModal';
import { TravelCaptureInput } from '@/lib/types/travel';
import { TravelDeck } from '@/lib/types/travel-deck';
import { useAuth } from '@/hooks/useAuth';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import MobileImageCapture from '@/components/travel/MobileImageCapture';
import { getGuestTravelCards, storeGuestTravelCard, getGuestSessionInfo } from '@/lib/utils/session';

interface TravelCard {
  id: string;
  destination: string;
  origin: string;
  travelType: string;
  createdAt: string;
  expiresAt?: string;
  isGuestCard: boolean;
  deck?: TravelDeck; // Add deck data
}

const Scout: React.FC = () => {
  const [view, setView] = useState<'home' | 'create' | 'card' | 'mobile-image'>('home');
  const [isCreating, setIsCreating] = useState(false);
  const [travelCards, setTravelCards] = useState<TravelCard[]>(() => getGuestTravelCards());
  const [currentCard, setCurrentCard] = useState<TravelCard | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [imageData, setImageData] = useState<{image: string, location?: string} | null>(null);
  
  const { user, isAuthenticated, isLoading, logout, refreshAuth } = useAuth();
  const { isMobile } = useDeviceDetection();
  const sessionInfo = getGuestSessionInfo();

  const handleCreateCard = async (travelInput: TravelCaptureInput) => {
    setIsCreating(true);
    
    try {
      console.log('Creating travel deck with:', travelInput);
      
      // Include authentication status in travel input
      const enhancedTravelInput = {
        ...travelInput,
        isGuest: !isAuthenticated,
        userId: isAuthenticated ? user?.id : undefined
      };
      
      // Call the deck generation API instead of the basic travel API
      const response = await fetch('/api/scout/deck', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enhancedTravelInput),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Failed to create travel deck (${response.status})`);
      }

      const result = await response.json();
      console.log('Deck creation result:', result);
      
      if (result.success && result.deck) {
        // Store the card with deck data locally for guest users
        const newCard: TravelCard = {
          id: result.deck.id || `card_${Date.now()}`,
          destination: travelInput.destination,
          origin: travelInput.origin,
          travelType: travelInput.travelType,
          createdAt: new Date().toISOString(),
          expiresAt: !isAuthenticated
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() 
            : undefined,
          isGuestCard: !isAuthenticated,
          deck: result.deck, // Include the full travel deck
        };

        if (!isAuthenticated) {
          // Store with deck data for guest users
          storeGuestTravelCard(newCard);
        }

        setTravelCards(prev => [newCard, ...prev]);
        setCurrentCard(newCard);
        setView('card');
      } else {
        throw new Error(result.error || 'Failed to create travel deck');
      }
    } catch (error) {
      console.error('Error creating travel deck:', error);
      alert(`Failed to create travel deck: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysRemaining = (expiresAt: string) => {
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    return Math.max(0, days);
  };

  // Mobile image capture flow
  if (view === 'mobile-image') {
    return (
      <MobileImageCapture
        onImageCapture={(image, detectedLocation) => {
          setImageData({ image, location: detectedLocation });
          setView('create');
        }}
        onSkip={() => setView('create')}
      />
    );
  }

  if (view === 'create') {
    return (
      <JourneyForm
        onComplete={handleCreateCard}
        isGuest={!isAuthenticated}
        initialData={imageData ? {
          destination: imageData.location || '',
          capturedImage: imageData.image
        } : undefined}
      />
    );
  }

  if (view === 'card' && currentCard) {
    // Show travel deck if available, otherwise show creation success message
    if (currentCard.deck) {
      return (
        <ComprehensiveTravelGuide 
          deck={currentCard.deck} 
          onClose={() => setView('home')}
        />
      );
    }

    // Fallback to success message if deck is not available
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setView('home')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Travel Card</h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="p-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900">
                Travel Deck Created Successfully! 🎉
              </h2>
              
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-2">
                  {currentCard.origin} → {currentCard.destination}
                </h3>
                <p className="text-blue-700 text-sm">
                  Travel Type: {currentCard.travelType.charAt(0).toUpperCase() + currentCard.travelType.slice(1)}
                </p>
                <p className="text-blue-700 text-sm">
                  Created: {formatDate(currentCard.createdAt)}
                </p>
                {currentCard.isGuestCard && currentCard.expiresAt && (
                  <p className="text-blue-700 text-sm">
                    Expires in: {getDaysRemaining(currentCard.expiresAt)} days
                  </p>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Travel deck data is still being generated. Please refresh the page or try again in a moment.
                </p>
              </div>

              {!isAuthenticated && currentCard.isGuestCard && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-800 text-sm">
                    💡 <strong>Guest Mode:</strong> This card will expire in {currentCard.expiresAt ? getDaysRemaining(currentCard.expiresAt) : 7} days.
                  </p>
                  <Button 
                    size="sm" 
                    className="mt-2 bg-blue-600 hover:bg-blue-700"
                    onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                  >
                    Create Account to Save
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Scout Travel</h1>
            <p className="text-sm text-gray-600">Plan your perfect trip in 30 seconds</p>
          </div>
          <Button
            onClick={() => setView(isMobile ? 'mobile-image' : 'create')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
          >
            {isMobile ? <Camera className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            <span>{isMobile ? 'Snap Destination' : 'Create Travel Card'}</span>
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* User Info Card */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <div className="flex items-center justify-between">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full" />
                    ) : (
                      <User className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Welcome back, {user.name}!</h2>
                    <p className="text-gray-600">Your travel cards are saved permanently</p>
                  </div>
                </div>
                <div className="text-right">
                  <Button 
                    variant="outline" 
                    className="border-red-300 text-red-700 hover:bg-red-100"
                    onClick={logout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Guest Session</h2>
                  <p className="text-gray-600">
                    You've created {sessionInfo.cardsCreated} travel cards • 
                    {sessionInfo.daysRemaining} days remaining
                  </p>
                </div>
                <div className="text-right space-x-2">
                  <Button 
                    variant="outline" 
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                  >
                    Create Account
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="text-blue-700 hover:bg-blue-100"
                    onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                  >
                    Sign In
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">Save cards permanently</p>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Travel Cards List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Your Travel Cards</h2>
            {travelCards.length > 0 && (
              <p className="text-gray-600">{travelCards.length} cards created</p>
            )}
          </div>

          {travelCards.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <MapPin className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">No travel cards yet</h3>
                  <p className="text-gray-600 mt-1">
                    Create your first travel card to get comprehensive travel information
                  </p>
                </div>
                <Button
                  onClick={() => setView(isMobile ? 'mobile-image' : 'create')}
                  className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                >
                  {isMobile ? <Camera className="w-4 h-4 mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  {isMobile ? 'Snap Your Destination' : 'Create Your First Card'}
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {travelCards.map((card) => (
                <Card
                  key={card.id}
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    setCurrentCard(card);
                    setView('card');
                  }}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {card.destination}
                        </h3>
                        <p className="text-sm text-gray-600">From {card.origin}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center space-x-1 text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs font-medium">
                          <Calendar className="w-3 h-3" />
                          <span>{card.travelType}</span>
                        </div>
                        {card.deck && (
                          <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                            {card.deck.cards.length} cards
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Created {formatDate(card.createdAt)}</span>
                      {!isAuthenticated && card.isGuestCard && card.expiresAt && (
                        <span className="text-amber-600">
                          {getDaysRemaining(card.expiresAt)}d left
                        </span>
                      )}
                      {isAuthenticated && (
                        <span className="text-green-600 text-xs">
                          Saved
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Features Section */}
        <Card className="p-8 mt-12">
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Everything you need for your perfect trip
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: '✈️', title: 'Flight Options', desc: 'Best routes & prices' },
                { icon: '🏨', title: 'Hotels', desc: 'Curated accommodations' },
                { icon: '🌤️', title: 'Weather', desc: '7-day forecast' },
                { icon: '🎯', title: 'Attractions', desc: 'Top things to do' },
                { icon: '🍛', title: 'Indian Food', desc: 'Veg-friendly options' },
                { icon: '💰', title: 'Budget', desc: 'Complete cost breakdown' },
                { icon: '🛂', title: 'Visa Info', desc: 'Requirements & docs' },
                { icon: '📱', title: 'Travel Essentials', desc: 'UPI, SIM & more' },
              ].map((feature, index) => (
                <div key={index} className="text-center space-y-2">
                  <div className="text-2xl">{feature.icon}</div>
                  <h3 className="font-medium text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
      
      {/* Authentication Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          refreshAuth();
          // Refresh travel cards after login
          setTravelCards(getGuestTravelCards());
        }}
        defaultMode={authMode}
      />
    </div>
  );
};

export default Scout;