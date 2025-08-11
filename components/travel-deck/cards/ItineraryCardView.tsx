'use client';

import React, { useState } from 'react';
import { Calendar, Clock, MapPin, DollarSign, Coffee, Utensils, Moon } from 'lucide-react';
import { ItineraryCard } from '@/lib/types/travel-deck';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ItineraryCardViewProps {
  card: ItineraryCard;
  isFullscreen?: boolean;
}

export default function ItineraryCardView({ card, isFullscreen }: ItineraryCardViewProps) {
  const { content } = card;
  const [selectedDay, setSelectedDay] = useState(0);
  
  // Safety checks for content structure
  if (!content || !content.days || !Array.isArray(content.days) || content.days.length === 0) {
    return (
      <div className="space-y-4 p-4 text-center">
        <p className="text-gray-500">No itinerary data available</p>
        <p className="text-sm text-gray-400">Please try regenerating this card</p>
      </div>
    );
  }
  
  const currentDay = content.days[selectedDay] || content.days[0];

  const getMealIcon = (type: string) => {
    switch (type) {
      case 'breakfast': return <Coffee className="w-4 h-4" />;
      case 'lunch': return <Utensils className="w-4 h-4" />;
      case 'dinner': return <Moon className="w-4 h-4" />;
      default: return <Utensils className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Day Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {content.days?.map((day, index) => (
          <Button
            key={index}
            variant={selectedDay === index ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDay(index)}
            className={cn(
              'flex-shrink-0',
              selectedDay === index && 'bg-blue-600 hover:bg-blue-700'
            )}
          >
            Day {day.day}
          </Button>
        ))}
      </div>

      {/* Current Day Details */}
      {currentDay && (
        <div className="space-y-4">
          {/* Day Header */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Day {currentDay.day}: {currentDay.title}
                </h3>
                {currentDay.date && (
                  <p className="text-sm text-gray-600 mt-1">{currentDay.date}</p>
                )}
              </div>
              <Badge variant="secondary">
                {currentDay.activities.length} activities
              </Badge>
            </div>
          </div>

          {/* Accommodation Info */}
          {currentDay.accommodation && (
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-sm font-medium text-amber-900 mb-1">Accommodation</p>
              <p className="font-semibold text-amber-800">{currentDay.accommodation.name}</p>
              <div className="flex gap-4 mt-1 text-sm text-amber-700">
                {currentDay.accommodation.checkIn && (
                  <span>Check-in: {currentDay.accommodation.checkIn}</span>
                )}
                {currentDay.accommodation.checkOut && (
                  <span>Check-out: {currentDay.accommodation.checkOut}</span>
                )}
              </div>
            </div>
          )}

          {/* Activities Timeline */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Activities</h4>
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200" />
              
              {/* Activities */}
              <div className="space-y-4">
                {currentDay.activities.map((activity, index) => (
                  <div key={index} className="relative flex gap-4">
                    {/* Timeline Dot */}
                    <div className="relative z-10 flex-shrink-0">
                      <div className="w-8 h-8 bg-white border-2 border-blue-600 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-blue-600 rounded-full" />
                      </div>
                    </div>
                    
                    {/* Activity Card */}
                    <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-900">{activity.time}</span>
                          {activity.duration && (
                            <Badge variant="outline" className="text-xs">
                              {activity.duration}
                            </Badge>
                          )}
                        </div>
                        {activity.cost && (
                          <div className="flex items-center gap-1 text-green-600">
                            <DollarSign className="w-4 h-4" />
                            <span className="font-medium">₹{activity.cost}</span>
                          </div>
                        )}
                      </div>
                      
                      <h5 className="font-semibold text-gray-900 mb-1">
                        {activity.activity}
                      </h5>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <MapPin className="w-3 h-3" />
                        <span>{activity.location}</span>
                      </div>
                      
                      {activity.notes && (
                        <p className="text-sm text-gray-600 italic">
                          💡 {activity.notes}
                        </p>
                      )}
                      
                      {activity.bookingRequired && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          Booking Required
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Meals Section */}
          {currentDay.meals && currentDay.meals.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Meals</h4>
              <div className="grid grid-cols-1 gap-3">
                {currentDay.meals.map((meal, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full">
                      {getMealIcon(meal.type)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 capitalize">{meal.type}</p>
                      {meal.restaurant && (
                        <p className="text-sm text-gray-600">{meal.restaurant}</p>
                      )}
                      {meal.cuisine && (
                        <p className="text-xs text-gray-500">{meal.cuisine}</p>
                      )}
                    </div>
                    {meal.cost && (
                      <Badge variant="secondary" className="text-xs">
                        ₹{meal.cost}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Day Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Total Activities</p>
                <p className="text-lg font-semibold text-gray-900">
                  {currentDay.activities.length}
                </p>
              </div>
              {currentDay.activities.some(a => a.cost) && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Estimated Cost</p>
                  <p className="text-lg font-semibold text-green-600">
                    ₹{currentDay.activities.reduce((sum, a) => sum + (a.cost || 0), 0)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}