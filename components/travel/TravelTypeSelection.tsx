'use client';

import React from 'react';
import { User, Users, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TravelType, GroupSubType } from '@/lib/types/travel';

interface TravelTypeSelectionProps {
  selectedTravelType?: TravelType;
  selectedGroupSubType?: GroupSubType;
  onTravelTypeChange: (type: TravelType) => void;
  onGroupSubTypeChange: (subType: GroupSubType) => void;
}

export default function TravelTypeSelection({
  selectedTravelType,
  selectedGroupSubType,
  onTravelTypeChange,
  onGroupSubTypeChange,
}: TravelTypeSelectionProps) {
  const travelTypes = [
    {
      type: 'single' as TravelType,
      icon: <User className="w-8 h-8" />,
      title: 'Single',
      description: 'Solo travel adventure',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      selectedColor: 'bg-blue-100 border-blue-500 ring-2 ring-blue-200',
    },
    {
      type: 'family' as TravelType,
      icon: <Users className="w-8 h-8" />,
      title: 'Family',
      description: 'Family vacation with kids',
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
      selectedColor: 'bg-green-100 border-green-500 ring-2 ring-green-200',
    },
    {
      type: 'group' as TravelType,
      icon: <UsersRound className="w-8 h-8" />,
      title: 'Group',
      description: 'Friends or colleague trip',
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      selectedColor: 'bg-purple-100 border-purple-500 ring-2 ring-purple-200',
    },
  ];

  const groupSubTypes = [
    {
      subType: 'individuals' as GroupSubType,
      title: 'Individual Friends',
      description: 'Group of friends or colleagues',
    },
    {
      subType: 'families' as GroupSubType,
      title: 'Multiple Families',
      description: 'Groups of families traveling together',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Who's traveling?</h2>
        <p className="text-gray-600">
          Choose your travel type to get personalized recommendations
        </p>
      </div>

      {/* Travel Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {travelTypes.map((option) => (
          <Card
            key={option.type}
            className={`cursor-pointer transition-all duration-200 ${
              selectedTravelType === option.type
                ? option.selectedColor
                : option.color
            }`}
            onClick={() => onTravelTypeChange(option.type)}
          >
            <div className="p-6 text-center space-y-3">
              <div className="flex justify-center text-gray-700">
                {option.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {option.title}
              </h3>
              <p className="text-sm text-gray-600">{option.description}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Group Sub-type Selection (shown only when Group is selected) */}
      {selectedTravelType === 'group' && (
        <div className="space-y-4 animate-in slide-in-from-top duration-300">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">Group Type</h3>
            <p className="text-gray-600">What kind of group are you?</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
            {groupSubTypes.map((subOption) => (
              <Button
                key={subOption.subType}
                variant={selectedGroupSubType === subOption.subType ? "default" : "outline"}
                className="h-auto p-4 flex flex-col items-center space-y-2"
                onClick={() => onGroupSubTypeChange(subOption.subType)}
              >
                <span className="font-medium">{subOption.title}</span>
                <span className="text-xs text-center opacity-75">
                  {subOption.description}
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Selection Summary */}
      {selectedTravelType && (
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600">
            Selected:{' '}
            <span className="font-medium text-gray-900">
              {selectedTravelType.charAt(0).toUpperCase() + selectedTravelType.slice(1)}
              {selectedTravelType === 'group' && selectedGroupSubType && 
                ` (${selectedGroupSubType === 'individuals' ? 'Individual Friends' : 'Multiple Families'})`
              }
            </span>
          </p>
        </div>
      )}
    </div>
  );
}