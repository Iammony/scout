'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, SortAsc, SortDesc, Calendar, MapPin, User, Users, Grid3X3, List, Eye, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TravelCardEnhanced } from './TravelCardEnhanced';
import { EmptyTravelState } from './EmptyTravelState';

interface TravelCard {
  id: string;
  destination: string;
  origin: string;
  travelType: string;
  createdAt: string;
  expiresAt?: string;
  isGuestCard: boolean;
  deck?: any;
}

interface TravelCardsGridProps {
  cards: TravelCard[];
  onCardClick: (card: TravelCard) => void;
  onCreateCard: () => void;
  onMobileCapture?: () => void;
  isMobile?: boolean;
  className?: string;
}

type SortField = 'date' | 'destination' | 'type';
type SortOrder = 'asc' | 'desc';
type FilterType = 'all' | 'single' | 'family' | 'group' | 'ready' | 'processing';
type ViewMode = 'grid' | 'list';

export function TravelCardsGrid({
  cards,
  onCardClick,
  onCreateCard,
  onMobileCapture,
  isMobile = false,
  className
}: TravelCardsGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Filter and sort cards
  const filteredAndSortedCards = useMemo(() => {
    let filtered = cards.filter(card => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!card.destination.toLowerCase().includes(query) && 
            !card.origin.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Type filter
      if (filterType !== 'all') {
        if (filterType === 'ready' && !card.deck) return false;
        if (filterType === 'processing' && card.deck) return false;
        if (['single', 'family', 'group'].includes(filterType) && card.travelType !== filterType) return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'destination':
          comparison = a.destination.localeCompare(b.destination);
          break;
        case 'type':
          comparison = a.travelType.localeCompare(b.travelType);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [cards, searchQuery, sortField, sortOrder, filterType]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getFilterCount = (type: FilterType) => {
    if (type === 'all') return cards.length;
    if (type === 'ready') return cards.filter(c => c.deck).length;
    if (type === 'processing') return cards.filter(c => !c.deck).length;
    return cards.filter(c => c.travelType === type).length;
  };

  if (cards.length === 0) {
    return (
      <EmptyTravelState
        onCreateCard={onCreateCard}
        onMobileCapture={onMobileCapture}
        isMobile={isMobile}
        className={className}
      />
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Title and Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-web3-violet-600 to-web3-purple-600 dark:from-web3-violet-400 dark:to-web3-pink-400 bg-clip-text text-transparent">
            Your Travel Cards
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {cards.length} {cards.length === 1 ? 'journey' : 'journeys'} planned
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-web3-violet-100 text-web3-violet-700 dark:bg-web3-violet-900/30 dark:text-web3-violet-400">
            <Eye className="w-3 h-3 mr-1" />
            {cards.filter(c => c.deck).length} ready
          </Badge>
          <Badge variant="secondary" className="bg-web3-purple-100 text-web3-purple-700 dark:bg-web3-purple-900/30 dark:text-web3-purple-400">
            <Clock className="w-3 h-3 mr-1" />
            {cards.filter(c => !c.deck).length} processing
          </Badge>
        </div>
      </div>

      {/* Controls */}
      <Card className="p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
        <div className="space-y-4">
          {/* Search and View Toggle */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search destinations or origins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-web3-violet-600 text-white' : ''}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-web3-violet-600 text-white' : ''}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Filters and Sort */}
          <div className="flex flex-wrap gap-2">
            {/* Filter Buttons */}
            {[
              { key: 'all', label: 'All', icon: Filter },
              { key: 'ready', label: 'Ready', icon: Eye },
              { key: 'processing', label: 'Processing', icon: Clock },
              { key: 'single', label: 'Solo', icon: User },
              { key: 'family', label: 'Family', icon: Users },
              { key: 'group', label: 'Group', icon: Users }
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={filterType === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType(key as FilterType)}
                className={cn(
                  'text-xs',
                  filterType === key ? 'bg-web3-violet-600 text-white' : ''
                )}
              >
                <Icon className="w-3 h-3 mr-1" />
                {label} ({getFilterCount(key as FilterType)})
              </Button>
            ))}

            {/* Sort Buttons */}
            <div className="flex items-center space-x-1 ml-auto">
              <span className="text-xs text-gray-500 mr-2">Sort by:</span>
              {[
                { key: 'date', label: 'Date', icon: Calendar },
                { key: 'destination', label: 'Destination', icon: MapPin },
                { key: 'type', label: 'Type', icon: User }
              ].map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  variant={sortField === key ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => toggleSort(key as SortField)}
                  className={cn(
                    'text-xs',
                    sortField === key ? 'bg-web3-violet-600 text-white' : ''
                  )}
                >
                  <Icon className="w-3 h-3 mr-1" />
                  {label}
                  {sortField === key && (
                    sortOrder === 'asc' ? <SortAsc className="w-3 h-3 ml-1" /> : <SortDesc className="w-3 h-3 ml-1" />
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Results */}
      {filteredAndSortedCards.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No cards found</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Try adjusting your search or filters
              </p>
            </div>
            <Button
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
              }}
              variant="outline"
              className="border-web3-violet-300 text-web3-violet-700 hover:bg-web3-violet-50"
            >
              Clear filters
            </Button>
          </div>
        </Card>
      ) : (
        <div className={cn(
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        )}>
          {filteredAndSortedCards.map((card) => (
            <TravelCardEnhanced
              key={card.id}
              card={card}
              onClick={() => onCardClick(card)}
              className={viewMode === 'list' ? 'w-full' : ''}
            />
          ))}
        </div>
      )}
    </div>
  );
}