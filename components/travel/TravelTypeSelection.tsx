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
      color: 'glass dark:glass-dark border-web3-violet-200 dark:border-web3-violet-800/30 hover:bg-web3-violet-50 dark:hover:bg-web3-violet-900/20',
      selectedColor: 'bg-gradient-to-br from-web3-violet-100 to-web3-purple-100 dark:from-web3-violet-900/30 dark:to-web3-purple-900/30 border-web3-violet-500 dark:border-web3-violet-400 ring-2 ring-web3-violet-200 dark:ring-web3-violet-800/50 shadow-web3',
    },
    {
      type: 'family' as TravelType,
      icon: <Users className="w-8 h-8" />,
      title: 'Family',
      description: 'Family vacation with kids',
      color: 'glass dark:glass-dark border-web3-violet-200 dark:border-web3-violet-800/30 hover:bg-web3-violet-50 dark:hover:bg-web3-violet-900/20',
      selectedColor: 'bg-gradient-to-br from-web3-purple-100 to-web3-pink-100 dark:from-web3-purple-900/30 dark:to-web3-pink-900/30 border-web3-purple-500 dark:border-web3-purple-400 ring-2 ring-web3-purple-200 dark:ring-web3-purple-800/50 shadow-web3',
    },
    {
      type: 'group' as TravelType,
      icon: <UsersRound className="w-8 h-8" />,
      title: 'Group',
      description: 'Friends or colleague trip',
      color: 'glass dark:glass-dark border-web3-violet-200 dark:border-web3-violet-800/30 hover:bg-web3-violet-50 dark:hover:bg-web3-violet-900/20',
      selectedColor: 'bg-gradient-to-br from-web3-pink-100 to-web3-violet-100 dark:from-web3-pink-900/30 dark:to-web3-violet-900/30 border-web3-pink-500 dark:border-web3-pink-400 ring-2 ring-web3-pink-200 dark:ring-web3-pink-800/50 shadow-web3',
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
        <h2 className="text-2xl font-bold bg-gradient-to-r from-web3-violet-600 to-web3-purple-600 dark:from-web3-violet-400 dark:to-web3-pink-400 bg-clip-text text-transparent">Who&apos;s traveling?</h2>
        <p className="text-gray-600 dark:text-gray-400">
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
              <div className="flex justify-center text-web3-violet-600 dark:text-web3-violet-400">
                {option.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {option.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{option.description}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Group Sub-type Selection (shown only when Group is selected) */}
      {selectedTravelType === 'group' && (
        <div className="space-y-4 animate-in slide-in-from-top duration-300">
          <div className="text-center">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-web3-violet-600 to-web3-purple-600 dark:from-web3-violet-400 dark:to-web3-pink-400 bg-clip-text text-transparent">Group Type</h3>
            <p className="text-gray-600 dark:text-gray-400">What kind of group are you?</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
            {groupSubTypes.map((subOption) => (
              <Button
                key={subOption.subType}
                variant={selectedGroupSubType === subOption.subType ? "default" : "outline"}
                className={`h-auto p-4 flex flex-col items-center space-y-2 transition-all duration-300 ${
                  selectedGroupSubType === subOption.subType 
                    ? 'bg-gradient-to-r from-web3-violet-600 to-web3-purple-600 text-white shadow-web3 border-0' 
                    : 'border-web3-violet-300 dark:border-web3-violet-700 text-web3-violet-700 dark:text-web3-violet-400 hover:bg-web3-violet-50 dark:hover:bg-web3-violet-900/20'
                }`}
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
        <div className="glass dark:glass-dark border border-web3-violet-200 dark:border-web3-violet-800/30 rounded-xl p-4 text-center shadow-web3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Selected:{' '}
            <span className="font-medium bg-gradient-to-r from-web3-violet-600 to-web3-purple-600 dark:from-web3-violet-400 dark:to-web3-pink-400 bg-clip-text text-transparent">
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