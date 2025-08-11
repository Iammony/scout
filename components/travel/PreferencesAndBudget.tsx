'use client';

import React, { useState } from 'react';
import { IndianRupee, Utensils, Heart, Plus, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PreferencesStep, Budget, Dietary, TravelStyle } from '@/lib/types/travel';

interface PreferencesAndBudgetProps {
  data: PreferencesStep;
  onChange: (data: PreferencesStep) => void;
  isGroupTravel?: boolean;
}

export default function PreferencesAndBudget({
  data,
  onChange,
  isGroupTravel = false,
}: PreferencesAndBudgetProps) {
  const [newRequirement, setNewRequirement] = useState('');

  const budgets: { value: Budget; label: string; description: string; color: string; range: string }[] = [
    {
      value: 'Tight',
      label: 'Budget-Friendly',
      description: 'Economy options, great value',
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
      range: '₹5,000-15,000'
    },
    {
      value: 'Comfortable',
      label: 'Comfortable',
      description: 'Good balance of comfort & cost',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      range: '₹15,000-40,000'
    },
    {
      value: 'Luxury',
      label: 'Premium',
      description: 'Best hotels and experiences',
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      range: '₹40,000+'
    }
  ];

  const dietaryOptions: { value: Dietary; label: string; icon: string; color: string }[] = [
    { value: 'Veg', label: 'Vegetarian', icon: '🥬', color: 'bg-green-100 text-green-800' },
    { value: 'Non-veg', label: 'Non-Vegetarian', icon: '🍗', color: 'bg-red-100 text-red-800' },
    { value: 'Jain', label: 'Jain', icon: '🌱', color: 'bg-orange-100 text-orange-800' },
    { value: 'Halal', label: 'Halal', icon: '🥩', color: 'bg-blue-100 text-blue-800' },
    { value: 'Flexible', label: 'Flexible', icon: '🍽️', color: 'bg-gray-100 text-gray-800' }
  ];

  const travelStyles: { value: TravelStyle; label: string; description: string; icon: string }[] = [
    {
      value: 'Adventure',
      label: 'Adventure',
      description: 'Outdoor activities, trekking, sports',
      icon: '🏔️'
    },
    {
      value: 'Leisure',
      label: 'Leisure',
      description: 'Relaxation, beaches, spa, comfort',
      icon: '🏖️'
    },
    {
      value: 'Business',
      label: 'Business',
      description: 'Work travel, meetings, conferences',
      icon: '💼'
    },
    {
      value: 'Pilgrimage',
      label: 'Pilgrimage',
      description: 'Religious sites, temples, spiritual',
      icon: '🕉️'
    },
    {
      value: 'Educational',
      label: 'Educational',
      description: 'Museums, culture, learning experiences',
      icon: '📚'
    }
  ];

  const commonRequirements = [
    'Wheelchair accessibility',
    'Baby/child-friendly',
    'Pet-friendly accommodation',
    'WiFi essential',
    'Gym/fitness facilities',
    'Swimming pool',
    'Airport transfers',
    'Tour guide services',
    'Photography opportunities',
    'Shopping areas nearby'
  ];

  const addRequirement = () => {
    if (newRequirement.trim()) {
      const requirements = data.specialRequirements || [];
      onChange({
        ...data,
        specialRequirements: [...requirements, newRequirement.trim()]
      });
      setNewRequirement('');
    }
  };

  const removeRequirement = (index: number) => {
    const requirements = data.specialRequirements || [];
    onChange({
      ...data,
      specialRequirements: requirements.filter((_, i) => i !== index)
    });
  };

  const addCommonRequirement = (requirement: string) => {
    const requirements = data.specialRequirements || [];
    if (!requirements.includes(requirement)) {
      onChange({
        ...data,
        specialRequirements: [...requirements, requirement]
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Your Preferences</h2>
        <p className="text-gray-600">
          Let us know your budget and preferences for a personalized experience
        </p>
      </div>

      {/* Budget Selection */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center space-x-2">
          <IndianRupee className="w-5 h-5 text-green-600" />
          <Label className="text-base font-medium">Budget Range {isGroupTravel ? '(Per Person)' : ''}</Label>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {budgets.map((budget) => (
            <div
              key={budget.value}
              className={`cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 ${
                data.budget === budget.value
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : budget.color
              }`}
              onClick={() => onChange({ ...data, budget: budget.value })}
            >
              <h3 className="font-medium text-gray-900">{budget.label}</h3>
              <p className="text-sm text-gray-600 mt-1">{budget.description}</p>
              <p className="text-lg font-semibold text-gray-900 mt-2">{budget.range}</p>
              {isGroupTravel && (
                <p className="text-xs text-gray-500 mt-1">per person</p>
              )}
            </div>
          ))}
        </div>

        {isGroupTravel && (
          <div className="flex items-center space-x-2 mt-4">
            <input
              type="checkbox"
              id="budgetPerPerson"
              checked={data.budgetPerPerson || false}
              onChange={(e) => onChange({ ...data, budgetPerPerson: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <Label htmlFor="budgetPerPerson" className="text-sm text-gray-600">
              This budget is per person (total budget will be calculated automatically)
            </Label>
          </div>
        )}
      </Card>

      {/* Dietary Preferences */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center space-x-2">
          <Utensils className="w-5 h-5 text-orange-600" />
          <Label className="text-base font-medium">Dietary Preferences</Label>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {dietaryOptions.map((option) => (
            <Button
              key={option.value}
              variant={data.dietary === option.value ? "default" : "outline"}
              className="h-auto p-3 flex flex-col items-center space-y-1"
              onClick={() => onChange({ ...data, dietary: option.value })}
            >
              <span className="text-lg">{option.icon}</span>
              <span className="text-xs font-medium">{option.label}</span>
            </Button>
          ))}
        </div>
        
        <p className="text-sm text-gray-600">
          This helps us find restaurants and food options that match your preferences
        </p>
      </Card>

      {/* Travel Style */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center space-x-2">
          <Heart className="w-5 h-5 text-pink-600" />
          <Label className="text-base font-medium">Travel Style</Label>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {travelStyles.map((style) => (
            <div
              key={style.value}
              className={`cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 ${
                data.travelStyle === style.value
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
              onClick={() => onChange({ ...data, travelStyle: style.value })}
            >
              <div className="text-center space-y-2">
                <div className="text-2xl">{style.icon}</div>
                <h3 className="font-medium text-gray-900">{style.label}</h3>
                <p className="text-xs text-gray-600">{style.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Special Requirements */}
      <Card className="p-6 space-y-4">
        <Label className="text-base font-medium">Special Requirements (Optional)</Label>
        
        {/* Common Requirements */}
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Quick add common requirements:</p>
          <div className="flex flex-wrap gap-2">
            {commonRequirements.map((requirement) => (
              <Button
                key={requirement}
                variant="outline"
                size="sm"
                onClick={() => addCommonRequirement(requirement)}
                disabled={data.specialRequirements?.includes(requirement)}
                className="text-xs h-8"
              >
                <Plus className="w-3 h-3 mr-1" />
                {requirement}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Requirement Input */}
        <div className="flex space-x-2">
          <Input
            value={newRequirement}
            onChange={(e) => setNewRequirement(e.target.value)}
            placeholder="Add custom requirement..."
            onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
            className="flex-1"
          />
          <Button onClick={addRequirement} disabled={!newRequirement.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Added Requirements */}
        {data.specialRequirements && data.specialRequirements.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Your requirements:</p>
            <div className="flex flex-wrap gap-2">
              {data.specialRequirements.map((requirement, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center space-x-1"
                >
                  <span>{requirement}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRequirement(index)}
                    className="h-auto p-0 ml-1 hover:bg-transparent"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Preferences Summary */}
      {data.budget && data.dietary && data.travelStyle && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">Preferences Summary</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Budget: {data.budget} {isGroupTravel && data.budgetPerPerson ? '(per person)' : ''}</p>
            <p>Dietary: {data.dietary}</p>
            <p>Style: {data.travelStyle}</p>
            {data.specialRequirements && data.specialRequirements.length > 0 && (
              <p>Special requirements: {data.specialRequirements.length} item{data.specialRequirements.length > 1 ? 's' : ''}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}