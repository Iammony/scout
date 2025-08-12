'use client';

import React, { useState } from 'react';
import { MapPin, Calendar, Clock, Lightbulb, Camera } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DestinationStep, Season, Duration } from '@/lib/types/travel';
import { ImageLocationCapture } from '@/components/location/ImageLocationCapture';

interface DestinationAndTimingProps {
  data: DestinationStep;
  onChange: (data: DestinationStep) => void;
}

export default function DestinationAndTiming({
  data,
  onChange,
}: DestinationAndTimingProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showImageCapture, setShowImageCapture] = useState(false);

  const popularDestinations = {
    domestic: [
      'Goa', 'Kerala (Backwaters)', 'Rajasthan (Jaipur)', 'Kashmir (Srinagar)',
      'Himachal Pradesh (Manali)', 'Uttarakhand (Rishikesh)', 'Tamil Nadu (Ooty)',
      'Karnataka (Coorg)', 'Maharashtra (Lonavala)', 'West Bengal (Darjeeling)'
    ],
    international: [
      'Dubai, UAE', 'Thailand (Bangkok)', 'Singapore', 'Bali, Indonesia',
      'Maldives', 'Nepal (Kathmandu)', 'Sri Lanka (Colombo)', 'Malaysia (Kuala Lumpur)',
      'Turkey (Istanbul)', 'Vietnam (Ho Chi Minh City)', 'Japan (Tokyo)', 'South Korea (Seoul)'
    ]
  };

  const seasons: { value: Season; label: string; description: string; color: string }[] = [
    {
      value: 'Winter',
      label: 'Winter (Dec-Feb)',
      description: 'Cool weather, peak season',
      color: 'glass dark:glass-dark border-web3-violet-200 dark:border-web3-violet-800/30 hover:bg-web3-violet-50 dark:hover:bg-web3-violet-900/20'
    },
    {
      value: 'Summer',
      label: 'Summer (Mar-May)', 
      description: 'Hot weather, off-season deals',
      color: 'glass dark:glass-dark border-web3-violet-200 dark:border-web3-violet-800/30 hover:bg-web3-violet-50 dark:hover:bg-web3-violet-900/20'
    },
    {
      value: 'Monsoon',
      label: 'Monsoon (Jun-Sep)',
      description: 'Rainy season, lush landscapes',
      color: 'glass dark:glass-dark border-web3-violet-200 dark:border-web3-violet-800/30 hover:bg-web3-violet-50 dark:hover:bg-web3-violet-900/20'
    },
    {
      value: 'Flexible',
      label: 'Flexible',
      description: 'I can travel anytime',
      color: 'glass dark:glass-dark border-web3-violet-200 dark:border-web3-violet-800/30 hover:bg-web3-violet-50 dark:hover:bg-web3-violet-900/20'
    }
  ];

  const durations: { value: Duration; label: string; description: string }[] = [
    {
      value: '2-3',
      label: '2-3 Days',
      description: 'Quick getaway'
    },
    {
      value: '5-7', 
      label: '5-7 Days',
      description: 'Week-long trip'
    },
    {
      value: '10-14',
      label: '10-14 Days',
      description: 'Extended vacation'
    },
    {
      value: 'Flexible',
      label: 'Flexible',
      description: 'Open to suggestions'
    }
  ];

  const motivationOptions = [
    'Relaxation and leisure',
    'Adventure and outdoor activities', 
    'Cultural exploration',
    'Food and culinary experiences',
    'Photography and sightseeing',
    'Spiritual and religious journey',
    'Business or work travel',
    'Celebration (anniversary, birthday)',
    'Family quality time',
    'Educational trip',
  ];

  const indianCities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Hyderabad',
    'Ahmedabad', 'Surat', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore',
    'Thane', 'Bhopal', 'Visakhapatnam', 'Kochi', 'Agra', 'Vadodara'
  ];

  const handleDestinationSuggestion = (destination: string) => {
    onChange({ ...data, destination });
    setShowSuggestions(false);
  };

  const handleImageLocationSelected = (location: string) => {
    onChange({ ...data, destination: location });
    setShowImageCapture(false);
    setShowSuggestions(false);
  };

  const handleShowImageCapture = () => {
    setShowImageCapture(true);
    setShowSuggestions(false);
  };

  const handleSkipImageCapture = () => {
    setShowImageCapture(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-web3-violet-600 to-web3-purple-600 dark:from-web3-violet-400 dark:to-web3-pink-400 bg-clip-text text-transparent">Where & When?</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Tell us your dream destination and preferred timing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Destination Section */}
        <Card className="p-6 space-y-4 glass dark:glass-dark border-web3-violet-200 dark:border-web3-violet-800/30 shadow-web3">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-web3-violet-600 dark:text-web3-violet-400" />
            <Label className="text-base font-medium text-gray-900 dark:text-white">Destination</Label>
          </div>
          
          <div className="space-y-3">
            {showImageCapture ? (
              <ImageLocationCapture
                onLocationSelected={handleImageLocationSelected}
                onSkip={handleSkipImageCapture}
                title="Identify Your Location"
                description="Take a photo of a landmark or location to automatically detect where you are"
                className="w-full"
              />
            ) : (
              <>
                <div className="flex gap-2">
                  <Input
                    value={data.destination}
                    onChange={(e) => onChange({ ...data, destination: e.target.value })}
                    placeholder="e.g., Goa, Dubai, Thailand..."
                    className="text-base flex-1 border-web3-violet-300 dark:border-web3-violet-700 rounded-xl focus:ring-web3-violet-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-300"
                    onFocus={() => setShowSuggestions(true)}
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleShowImageCapture}
                    className="flex-shrink-0 px-3 border-web3-violet-300 dark:border-web3-violet-700 text-web3-violet-700 dark:text-web3-violet-400 hover:bg-web3-violet-50 dark:hover:bg-web3-violet-900/20 transition-all duration-300"
                    title="Take photo to identify location"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  💡 Tap the camera icon to identify location from a photo
                </p>
              </>
            )}

            {showSuggestions && (
              <div className="space-y-3 p-3 glass dark:glass-dark border border-web3-violet-200 dark:border-web3-violet-800/30 rounded-xl shadow-web3">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Popular in India</h4>
                  <div className="flex flex-wrap gap-2">
                    {popularDestinations.domestic.slice(0, 6).map((dest) => (
                      <Button
                        key={dest}
                        variant="outline"
                        size="sm"
                        onClick={() => handleDestinationSuggestion(dest)}
                        className="text-xs h-7 border-web3-violet-300 dark:border-web3-violet-700 text-web3-violet-700 dark:text-web3-violet-400 hover:bg-web3-violet-50 dark:hover:bg-web3-violet-900/20 transition-all duration-300"
                      >
                        {dest}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">International</h4>
                  <div className="flex flex-wrap gap-2">
                    {popularDestinations.international.slice(0, 6).map((dest) => (
                      <Button
                        key={dest}
                        variant="outline"
                        size="sm"
                        onClick={() => handleDestinationSuggestion(dest)}
                        className="text-xs h-7 border-web3-violet-300 dark:border-web3-violet-700 text-web3-violet-700 dark:text-web3-violet-400 hover:bg-web3-violet-50 dark:hover:bg-web3-violet-900/20 transition-all duration-300"
                      >
                        {dest}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSuggestions(false)}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:bg-web3-violet-50 dark:hover:bg-web3-violet-900/20 transition-all duration-300"
                >
                  Close suggestions
                </Button>
              </div>
            )}
          </div>

          {/* Origin */}
          <div className="space-y-3">
            <Label className="text-base font-medium text-gray-900 dark:text-white">From (Your City)</Label>
            <select
              value={data.origin}
              onChange={(e) => onChange({ ...data, origin: e.target.value })}
              className="w-full px-3 py-2 border border-web3-violet-300 dark:border-web3-violet-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-web3-violet-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-300"
              required
            >
              <option value="">Select your city</option>
              {indianCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Motivation Section */}
        <Card className="p-6 space-y-4 glass dark:glass-dark border-web3-violet-200 dark:border-web3-violet-800/30 shadow-web3">
          <div className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-web3-purple-600 dark:text-web3-purple-400" />
            <Label className="text-base font-medium text-gray-900 dark:text-white">Why this trip?</Label>
          </div>
          
          <div className="space-y-3">
            <select
              value={data.motivation}
              onChange={(e) => onChange({ ...data, motivation: e.target.value })}
              className="w-full px-3 py-2 border border-web3-violet-300 dark:border-web3-violet-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-web3-violet-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-300"
              required
            >
              <option value="">Select motivation</option>
              {motivationOptions.map((motivation) => (
                <option key={motivation} value={motivation}>
                  {motivation}
                </option>
              ))}
              <option value="other">Other (specify below)</option>
            </select>

            {data.motivation === 'other' && (
              <Textarea
                placeholder="Please specify your motivation..."
                value={data.motivation === 'other' ? '' : data.motivation}
                onChange={(e) => onChange({ ...data, motivation: e.target.value })}
                className="min-h-[80px]"
                required
              />
            )}
          </div>
        </Card>
      </div>

      {/* Season Selection */}
      <Card className="p-6 space-y-4 glass dark:glass-dark border-web3-violet-200 dark:border-web3-violet-800/30 shadow-web3">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-web3-pink-600 dark:text-web3-pink-400" />
          <Label className="text-base font-medium text-gray-900 dark:text-white">Preferred Season</Label>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {seasons.map((season) => (
            <div
              key={season.value}
              className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 ${
                data.season === season.value
                  ? 'border-web3-violet-500 dark:border-web3-violet-400 bg-gradient-to-br from-web3-violet-100 to-web3-purple-100 dark:from-web3-violet-900/30 dark:to-web3-purple-900/30 ring-2 ring-web3-violet-200 dark:ring-web3-violet-800/50 shadow-web3'
                  : season.color
              }`}
              onClick={() => onChange({ ...data, season: season.value })}
            >
              <h3 className="font-medium text-gray-900 dark:text-white">{season.label}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{season.description}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Duration Selection */}
      <Card className="p-6 space-y-4 glass dark:glass-dark border-web3-violet-200 dark:border-web3-violet-800/30 shadow-web3">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-web3-violet-600 dark:text-web3-violet-400" />
          <Label className="text-base font-medium text-gray-900 dark:text-white">Trip Duration</Label>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {durations.map((duration) => (
            <Button
              key={duration.value}
              variant={data.duration === duration.value ? "default" : "outline"}
              className={`h-auto p-4 flex flex-col items-start space-y-1 transition-all duration-300 ${
                data.duration === duration.value 
                  ? 'bg-gradient-to-r from-web3-violet-600 to-web3-purple-600 text-white shadow-web3 border-0' 
                  : 'border-web3-violet-300 dark:border-web3-violet-700 text-web3-violet-700 dark:text-web3-violet-400 hover:bg-web3-violet-50 dark:hover:bg-web3-violet-900/20'
              }`}
              onClick={() => onChange({ ...data, duration: duration.value })}
            >
              <span className="font-medium">{duration.label}</span>
              <span className="text-xs opacity-75">{duration.description}</span>
            </Button>
          ))}
        </div>
      </Card>

      {/* Summary */}
      {data.destination && data.origin && (
        <div className="glass dark:glass-dark border border-web3-violet-200 dark:border-web3-violet-800/30 rounded-xl p-4 shadow-web3">
          <h3 className="font-medium bg-gradient-to-r from-web3-violet-600 to-web3-purple-600 dark:from-web3-violet-400 dark:to-web3-pink-400 bg-clip-text text-transparent mb-2">Trip Summary</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {data.origin} → {data.destination}
            {data.season && data.season !== 'Flexible' && ` • ${data.season}`}
            {data.duration && data.duration !== 'Flexible' && ` • ${data.duration} days`}
            {data.motivation && ` • ${data.motivation}`}
          </p>
        </div>
      )}
    </div>
  );
}