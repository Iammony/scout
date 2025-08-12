'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Heart, Eye, Calendar, MapPin, User, Users, Filter, Search, TrendingUp, Sparkles, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PublicTravelCard } from '@/lib/types/travel';
import { useAuth } from '@/hooks/useAuth';
import { useDestinationImages } from '@/hooks/useDestinationImages';
import Image from 'next/image';

interface PublicCardsGridProps {
  onCardClick?: (card: PublicTravelCard) => void;
  className?: string;
}

type SortOption = 'recent' | 'popular' | 'featured';

// Move helper functions outside component to prevent re-creation
const getTravelTypeInfo = (travelType: string) => {
  switch (travelType) {
    case 'single':
      return { icon: User, label: 'Solo', color: 'web3-violet' };
    case 'family':
      return { icon: Users, label: 'Family', color: 'web3-purple' };
    case 'group':
      return { icon: Users, label: 'Group', color: 'web3-pink' };
    default:
      return { icon: User, label: 'Travel', color: 'web3-violet' };
  }
};

const formatDate = (date: Date) => {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
};

// Sort options as constant to prevent re-creation
const SORT_OPTIONS = [
  { key: 'recent', label: 'Recent', icon: Calendar },
  { key: 'popular', label: 'Popular', icon: TrendingUp },
  { key: 'featured', label: 'Featured', icon: Sparkles }
] as const;

export function PublicCardsGrid({ onCardClick, className }: PublicCardsGridProps) {
  const { user } = useAuth();
  const { images, fetchImage } = useDestinationImages();
  const [cards, setCards] = useState<PublicTravelCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchCards = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;
      const response = await fetch(`/api/cards/public?page=${currentPage}&limit=12&sortBy=${sortBy}`);
      const result = await response.json();

      if (result.cards) {
        if (reset) {
          setCards(result.cards);
          setPage(2);
        } else {
          setCards(prev => [...prev, ...result.cards]);
          setPage(prev => prev + 1);
        }
        setHasMore(result.hasMore);
      }
    } catch (error) {
      console.error('Failed to fetch public cards:', error);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy]);

  useEffect(() => {
    fetchCards(true);
  }, [sortBy, fetchCards]);

  // Effect to fetch destination images when cards change
  useEffect(() => {
    cards.forEach(card => {
      if (card.destination && !images[card.destination]) {
        fetchImage(card.destination);
      }
    });
  }, [cards, images, fetchImage]);

  const handleCardLike = async (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      // Could show login modal
      return;
    }

    try {
      const response = await fetch(`/api/cards/${cardId}/like`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const result = await response.json();
        // Update the card in the list
        setCards(prev => prev.map(card => 
          card.id === cardId 
            ? { ...card, likes: result.totalLikes }
            : card
        ));
      }
    } catch (error) {
      console.error('Failed to like card:', error);
    }
  };

  const handleCardView = async (card: PublicTravelCard) => {
    try {
      // Track view
      await fetch(`/api/cards/${card.id}/view`, {
        method: 'POST',
      });
      
      // Update view count locally
      setCards(prev => prev.map(c => 
        c.id === card.id 
          ? { ...c, views: c.views + 1 }
          : c
      ));
      
      onCardClick?.(card);
    } catch (error) {
      console.error('Failed to track view:', error);
      onCardClick?.(card);
    }
  };

  const filteredCards = useMemo(() => {
    if (!searchQuery) return cards;
    const query = searchQuery.toLowerCase();
    return cards.filter(card => 
      card.title.toLowerCase().includes(query) ||
      card.destination.toLowerCase().includes(query) ||
      card.origin.toLowerCase().includes(query) ||
      card.createdBy.toLowerCase().includes(query) ||
      card.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [cards, searchQuery]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-web3-violet-500 to-web3-purple-500 flex items-center justify-center shadow-neon">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-web3-violet-600 to-web3-purple-600 dark:from-web3-violet-400 dark:to-web3-pink-400 bg-clip-text text-transparent">
              Discover Travel Guides
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Explore amazing destinations shared by our community
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search destinations, creators, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-web3-violet-300 dark:border-web3-violet-700 rounded-xl focus:ring-web3-violet-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-300"
          />
        </div>

        {/* Sort Options */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
          {SORT_OPTIONS.map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={sortBy === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy(key as SortOption)}
              className={cn(
                'transition-all duration-300',
                sortBy === key 
                  ? 'bg-gradient-to-r from-web3-violet-600 to-web3-purple-600 text-white shadow-web3 border-0' 
                  : 'border-web3-violet-300 dark:border-web3-violet-700 text-web3-violet-700 dark:text-web3-violet-400 hover:bg-web3-violet-50 dark:hover:bg-web3-violet-900/20'
              )}
            >
              <Icon className="w-3 h-3 mr-1" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      {loading && cards.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.map((card) => {
              const typeInfo = getTravelTypeInfo(card.travelType);
              const TypeIcon = typeInfo.icon;

              return (
                <Card
                  key={card.id}
                  className={cn(
                    'group relative overflow-hidden cursor-pointer',
                    'bg-gradient-to-br from-white to-gray-50/50',
                    'dark:from-gray-900 dark:to-gray-800/50',
                    'border border-gray-200/50 dark:border-gray-700/50',
                    'hover:border-web3-violet-300 dark:hover:border-web3-violet-600',
                    'shadow-lg hover:shadow-2xl hover:shadow-web3-violet-500/20',
                    'transition-all duration-500 ease-out',
                    'transform hover:scale-[1.02]',
                    'backdrop-blur-sm'
                  )}
                  onClick={() => handleCardView(card)}
                >
                  {/* Destination Image */}
                  {images[card.destination] && (
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={images[card.destination]!.urls.regular}
                        alt={images[card.destination]!.alt_description || `${card.destination} travel`}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-lg font-bold text-white shadow-lg">
                          {card.title}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <MapPin className="w-3 h-3 text-white/80" />
                          <span className="text-sm text-white/80">
                            {card.origin} → {card.destination}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Background Pattern for cards without images */}
                  {!images[card.destination] && (
                    <div className="absolute inset-0 bg-gradient-to-br from-web3-violet-500/5 via-transparent to-web3-purple-500/5 dark:from-web3-violet-500/10 dark:to-web3-purple-500/10" />
                  )}
                  
                  <div className={cn(
                    "relative space-y-4",
                    images[card.destination] ? "p-4" : "p-6"
                  )}>
                    {/* Header - only show if no image */}
                    {!images[card.destination] && (
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-web3-violet-600 dark:group-hover:text-web3-violet-400 transition-colors">
                              {card.title}
                            </h3>
                            <div className="flex items-center space-x-2 mt-2">
                              <MapPin className="w-3 h-3 text-gray-500" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {card.origin} → {card.destination}
                              </span>
                            </div>
                          </div>
                        
                          {card.featured && (
                            <Badge className="bg-web3-neon-purple text-white border-0 shadow-neon">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>

                      {/* Description */}
                      {card.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {card.description}
                        </p>
                      )}

                      {/* Tags */}
                      {card.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {card.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-xs bg-web3-violet-100 dark:bg-web3-violet-900/30 text-web3-violet-700 dark:text-web3-violet-400 rounded-lg"
                            >
                              {tag}
                            </span>
                          ))}
                          {card.tags.length > 3 && (
                            <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                              +{card.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                      </div>
                    )}

                    {/* Content for cards with images */}
                    {images[card.destination] && (
                      <div className="space-y-3">
                        {/* Featured badge for image cards */}
                        {card.featured && (
                          <div className="flex justify-end">
                            <Badge className="bg-web3-neon-purple text-white border-0 shadow-neon">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          </div>
                        )}

                        {/* Description */}
                        {card.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {card.description}
                          </p>
                        )}

                        {/* Tags */}
                        {card.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {card.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 text-xs bg-web3-violet-100 dark:bg-web3-violet-900/30 text-web3-violet-700 dark:text-web3-violet-400 rounded-lg"
                              >
                                {tag}
                              </span>
                            ))}
                            {card.tags.length > 3 && (
                              <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                                +{card.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Stats and Creator */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary" className={`bg-${typeInfo.color}-100 text-${typeInfo.color}-700 dark:bg-${typeInfo.color}-900/30 dark:text-${typeInfo.color}-400 border-0`}>
                          <TypeIcon className="w-3 h-3 mr-1" />
                          {typeInfo.label}
                        </Badge>
                        
                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(new Date(card.publishedAt))}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                          <Eye className="w-3 h-3" />
                          <span>{card.views}</span>
                        </div>
                        
                        <button
                          onClick={(e) => handleCardLike(card.id, e)}
                          className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                        >
                          <Heart className="w-3 h-3" />
                          <span>{card.likes}</span>
                        </button>
                      </div>
                    </div>

                    {/* Creator */}
                    <div className="flex items-center space-x-2 pt-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-web3-violet-500 to-web3-purple-500 flex items-center justify-center">
                        <User className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        by <span className="font-medium text-web3-violet-600 dark:text-web3-violet-400">@{card.createdBy}</span>
                      </span>
                    </div>
                  </div>

                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-web3-violet-500/0 via-web3-purple-500/0 to-web3-pink-500/0 group-hover:from-web3-violet-500/10 group-hover:via-web3-purple-500/10 group-hover:to-web3-pink-500/10 transition-all duration-500 pointer-events-none" />
                </Card>
              );
            })}
          </div>

          {/* Load More */}
          {hasMore && !loading && (
            <div className="text-center">
              <Button
                onClick={() => fetchCards()}
                variant="outline"
                className="border-web3-violet-300 dark:border-web3-violet-700 text-web3-violet-700 dark:text-web3-violet-400 hover:bg-web3-violet-50 dark:hover:bg-web3-violet-900/20 transition-all duration-300"
              >
                Load More
              </Button>
            </div>
          )}

          {/* Empty State */}
          {filteredCards.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'No results found' : 'No public cards yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery 
                  ? 'Try adjusting your search terms' 
                  : 'Be the first to share your travel guide with the community!'
                }
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}