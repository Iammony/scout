'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Sparkles, ArrowLeft, Calendar, MapPin, User, LogOut, Camera, Zap, Globe2, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SafeThemeToggle } from '@/components/ui/safe-theme-toggle';
import { AnimatedBreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { useBreadcrumbNavigation, useBreadcrumb } from '@/lib/contexts/breadcrumb-context';
import JourneyForm from '@/components/travel/JourneyForm';
import ComprehensiveTravelGuide from '@/components/travel-deck/ComprehensiveTravelGuide';
import AuthModal from '@/components/auth/AuthModal';
import { TravelCaptureInput } from '@/lib/types/travel';
import { TravelDeck } from '@/lib/types/travel-deck';
import { useAuth } from '@/hooks/useAuth';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import MobileImageCapture from '@/components/travel/MobileImageCapture';
import { TravelCardsGrid } from '@/components/travel/TravelCardsGrid';
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
  
  // Breadcrumb navigation
  const { breadcrumbs } = useBreadcrumb();
  const { 
    setHomeBreadcrumb, 
    setCreateJourneyBreadcrumb, 
    setViewCardBreadcrumb, 
    setMobileCaptureBreadcrumb,
    navigateTo 
  } = useBreadcrumbNavigation();

  // Update breadcrumbs based on current view
  useEffect(() => {
    switch (view) {
      case 'home':
        setHomeBreadcrumb();
        break;
      case 'create':
        setCreateJourneyBreadcrumb();
        break;
      case 'mobile-image':
        setMobileCaptureBreadcrumb();
        break;
      case 'card':
        if (currentCard) {
          setViewCardBreadcrumb(currentCard.destination);
        }
        break;
    }
  }, [view, currentCard, setHomeBreadcrumb, setCreateJourneyBreadcrumb, setMobileCaptureBreadcrumb, setViewCardBreadcrumb]);

  // Handle breadcrumb navigation
  const handleBreadcrumbNavigation = (item: any, index: number) => {
    switch (index) {
      case 0: // Home
        setView('home');
        break;
      case 1: // Second level navigation
        if (item.label.includes('Create')) {
          setView('create');
        } else if (item.label.includes('Capture')) {
          setView('mobile-image');
        } else if (item.label.includes('Travel to')) {
          setView('card');
        }
        break;
    }
    navigateTo(index);
  };

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-black transition-colors duration-300">
      {/* Web3 Mesh Background */}
      <div className="fixed inset-0 bg-web3-mesh dark:bg-web3-mesh-dark opacity-20 dark:opacity-10 pointer-events-none" />
      
      {/* Header */}
      <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-web3-violet-500 to-web3-purple-500 flex items-center justify-center shadow-neon">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-web3-violet-600 to-web3-purple-600 dark:from-web3-violet-400 dark:to-web3-pink-400 bg-clip-text text-transparent">Scout Travel</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">AI-Powered Journey Planning</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Authentication Section */}
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-web3-violet-500 to-web3-purple-500 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Hello, <span className="text-web3-violet-600 dark:text-web3-violet-400">@{user.username}</span>
                  </span>
                </div>
                <Button
                  onClick={logout}
                  variant="outline"
                  size="sm"
                  className="border-web3-violet-300 dark:border-web3-violet-700 text-web3-violet-700 dark:text-web3-violet-400 hover:bg-web3-violet-50 dark:hover:bg-web3-violet-900/20"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setShowAuthModal(true)}
                variant="outline"
                size="sm"
                className="border-web3-violet-300 dark:border-web3-violet-700 text-web3-violet-700 dark:text-web3-violet-400 hover:bg-web3-violet-50 dark:hover:bg-web3-violet-900/20 flex items-center space-x-2"
              >
                <User className="w-4 h-4" />
                <span>Sign Up</span>
              </Button>
            )}
            
            <SafeThemeToggle />
            
            <Button
              onClick={() => setView(isMobile ? 'mobile-image' : 'create')}
              className="bg-gradient-to-r from-web3-violet-600 to-web3-purple-600 hover:from-web3-violet-500 hover:to-web3-purple-500 text-white px-6 py-2 rounded-xl shadow-web3 hover:shadow-neon transition-all duration-300 flex items-center space-x-2 border border-white/20"
            >
              {isMobile ? <Camera className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
              <span className="font-semibold">{isMobile ? 'Snap & Go' : 'Create Journey'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <AnimatedBreadcrumbNav 
        items={breadcrumbs} 
        onNavigate={handleBreadcrumbNavigation}
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* User Info Card */}
        <Card className="p-6 mb-8 glass dark:glass-dark border-web3-violet-200 dark:border-web3-violet-800/30 shadow-web3">
          <div className="flex items-center justify-between">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-web3-violet-500 to-web3-purple-500 rounded-full flex items-center justify-center shadow-neon">
                    {user.avatar ? (
                      <Image 
                        src={user.avatar} 
                        alt={user.name} 
                        width={48}
                        height={48}
                        className="rounded-full" 
                      />
                    ) : (
                      <User className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Welcome back, {user.name}!</h2>
                    <p className="text-gray-600 dark:text-gray-400">Your travel cards are saved permanently</p>
                  </div>
                </div>
                <div className="text-right">
                  <Button 
                    variant="outline" 
                    className="border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20"
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
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Guest Session</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    You&apos;ve created {sessionInfo.cardsCreated} travel cards • 
                    {sessionInfo.daysRemaining} days remaining
                  </p>
                </div>
                <div className="text-right space-x-2">
                  <Button 
                    variant="outline" 
                    className="border-web3-violet-300 dark:border-web3-violet-700 text-web3-violet-700 dark:text-web3-violet-400 hover:bg-web3-violet-100 dark:hover:bg-web3-violet-900/20"
                    onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                  >
                    Create Account
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="text-web3-violet-700 dark:text-web3-violet-400 hover:bg-web3-violet-100 dark:hover:bg-web3-violet-900/20"
                    onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                  >
                    Sign In
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Save cards permanently</p>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Travel Cards Grid */}
        <TravelCardsGrid
          cards={travelCards}
          onCardClick={(card) => {
            setCurrentCard(card);
            setView('card');
          }}
          onCreateCard={() => setView(isMobile ? 'mobile-image' : 'create')}
          onMobileCapture={() => setView('mobile-image')}
          isMobile={isMobile}
        />

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
      />
    </div>
  );
};

export default Scout;