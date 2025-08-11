'use client';

import React from 'react';
import { MapPin, Calendar, Users, Globe, MessageCircle, Star } from 'lucide-react';
import { OverviewCard } from '@/lib/types/travel-deck';
import { Badge } from '@/components/ui/badge';

interface OverviewCardViewProps {
  card: OverviewCard;
  isFullscreen?: boolean;
}

export default function OverviewCardView({ card, isFullscreen }: OverviewCardViewProps) {
  const { content } = card;
  
  // Safety check for content
  if (!content) {
    return (
      <div className="space-y-6 p-4 text-center">
        <p className="text-gray-500">No overview data available</p>
        <p className="text-sm text-gray-400">Please try regenerating this card</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Destination Header */}
      <div className="text-center pb-4 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900">{content.destination || 'Unknown Destination'}</h1>
        <p className="text-lg text-gray-600 mt-1">{content.country || 'Unknown Country'}</p>
      </div>

      {/* Key Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-blue-600 mt-1" />
          <div>
            <p className="font-medium text-gray-900">Duration</p>
            <p className="text-gray-600">{content.duration || 'N/A'}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Users className="w-5 h-5 text-green-600 mt-1" />
          <div>
            <p className="font-medium text-gray-900">Travel Type</p>
            <p className="text-gray-600 capitalize">{content.travelType || 'N/A'}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Globe className="w-5 h-5 text-purple-600 mt-1" />
          <div>
            <p className="font-medium text-gray-900">Best Time to Visit</p>
            <p className="text-gray-600">{content.bestTime}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <MessageCircle className="w-5 h-5 text-orange-600 mt-1" />
          <div>
            <p className="font-medium text-gray-900">Languages</p>
            <p className="text-gray-600">{content.languages.join(', ')}</p>
          </div>
        </div>
      </div>

      {/* Highlights Section */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Destination Highlights
        </h3>
        <div className="flex flex-wrap gap-2">
          {content.highlights.map((highlight, index) => (
            <Badge key={index} variant="secondary" className="px-3 py-1">
              {highlight}
            </Badge>
          ))}
        </div>
      </div>

      {/* Currency Info */}
      <div className="bg-blue-50 rounded-lg p-4">
        <p className="text-sm font-medium text-blue-900 mb-1">Currency</p>
        <p className="text-lg font-semibold text-blue-700">{content.currency}</p>
        <p className="text-sm text-blue-600 mt-1">
          Check current exchange rates before travel
        </p>
      </div>

      {/* Quick Tips */}
      {content.quickTips && content.quickTips.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Quick Tips</h3>
          <ul className="space-y-2">
            {content.quickTips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-gray-700">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Visual Appeal - Destination Image Placeholder */}
      <div className="relative h-48 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 rounded-lg overflow-hidden">
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="text-center text-white">
            <MapPin className="w-12 h-12 mx-auto mb-2" />
            <p className="text-xl font-bold">{content.destination}</p>
            <p className="text-sm opacity-90">Your Adventure Awaits</p>
          </div>
        </div>
      </div>
    </div>
  );
}