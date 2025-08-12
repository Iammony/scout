'use client';

import React from 'react';
import { Plus, Minus, Baby, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { TravelType, TravelerDetailsStep } from '@/lib/types/travel';

interface TravelerDetailsProps {
  travelType: TravelType;
  data: TravelerDetailsStep;
  onChange: (data: TravelerDetailsStep) => void;
}

export default function TravelerDetails({
  travelType,
  data,
  onChange,
}: TravelerDetailsProps) {
  const updateFamilyMembers = (field: string, value: number | number[]) => {
    const familyMembers = data.familyMembers || { adults: 1, children: 0 };
    onChange({
      ...data,
      familyMembers: {
        ...familyMembers,
        [field]: value,
      },
    });
  };

  const handleChildAgeChange = (index: number, age: number) => {
    const childrenAges = data.familyMembers?.childrenAges || [];
    const newAges = [...childrenAges];
    newAges[index] = age;
    updateFamilyMembers('childrenAges', newAges);
  };

  const generateAgeOptions = () => {
    return Array.from({ length: 18 }, (_, i) => (
      <option key={i} value={i}>
        {i === 0 ? 'Under 1' : `${i} year${i > 1 ? 's' : ''}`}
      </option>
    ));
  };

  const generateAdultAgeOptions = () => {
    return Array.from({ length: 83 }, (_, i) => i + 18).map(age => (
      <option key={age} value={age}>
        {age} years
      </option>
    ));
  };

  if (travelType === 'single') {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-web3-violet-600 to-web3-purple-600 dark:from-web3-violet-400 dark:to-web3-pink-400 bg-clip-text text-transparent">Tell us about yourself</h2>
          <p className="text-gray-600 dark:text-gray-400">
            This helps us recommend age-appropriate activities
          </p>
        </div>

        <Card className="p-6 glass dark:glass-dark border-web3-violet-200 dark:border-web3-violet-800/30 shadow-web3">
          <div className="space-y-4">
            <Label htmlFor="travelerAge" className="text-base font-medium text-gray-900 dark:text-white">
              Your Age
            </Label>
            <select
              id="travelerAge"
              value={data.travelerAge || ''}
              onChange={(e) => onChange({ ...data, travelerAge: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-web3-violet-300 dark:border-web3-violet-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-web3-violet-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-300"
              required
            >
              <option value="">Select your age</option>
              {generateAdultAgeOptions()}
            </select>
          </div>
        </Card>
      </div>
    );
  }

  if (travelType === 'family') {
    const familyMembers = data.familyMembers || { adults: 1, children: 0 };
    const childrenAges = familyMembers.childrenAges || [];

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-web3-violet-600 to-web3-purple-600 dark:from-web3-violet-400 dark:to-web3-pink-400 bg-clip-text text-transparent">Family Details</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Tell us about your family members for better recommendations
          </p>
        </div>

        <Card className="p-6 space-y-6 glass dark:glass-dark border-web3-violet-200 dark:border-web3-violet-800/30 shadow-web3">
          {/* Adults */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-web3-violet-600 dark:text-web3-violet-400" />
              <div>
                <Label className="text-base font-medium text-gray-900 dark:text-white">Adults</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ages 18 and above</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                className="border-web3-violet-300 dark:border-web3-violet-700 text-web3-violet-700 dark:text-web3-violet-400 hover:bg-web3-violet-50 dark:hover:bg-web3-violet-900/20 transition-all duration-300"
                onClick={() =>
                  updateFamilyMembers('adults', Math.max(1, familyMembers.adults - 1))
                }
                disabled={familyMembers.adults <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-8 text-center font-medium">
                {familyMembers.adults}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="border-web3-violet-300 dark:border-web3-violet-700 text-web3-violet-700 dark:text-web3-violet-400 hover:bg-web3-violet-50 dark:hover:bg-web3-violet-900/20 transition-all duration-300"
                onClick={() =>
                  updateFamilyMembers('adults', Math.min(10, familyMembers.adults + 1))
                }
                disabled={familyMembers.adults >= 10}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Children */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Baby className="w-5 h-5 text-web3-purple-600 dark:text-web3-purple-400" />
              <div>
                <Label className="text-base font-medium text-gray-900 dark:text-white">Children</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ages 0-17</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                className="border-web3-violet-300 dark:border-web3-violet-700 text-web3-violet-700 dark:text-web3-violet-400 hover:bg-web3-violet-50 dark:hover:bg-web3-violet-900/20 transition-all duration-300"
                onClick={() => {
                  const newCount = Math.max(0, familyMembers.children - 1);
                  updateFamilyMembers('children', newCount);
                  if (newCount < childrenAges.length) {
                    updateFamilyMembers('childrenAges', childrenAges.slice(0, newCount));
                  }
                }}
                disabled={familyMembers.children <= 0}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-8 text-center font-medium">
                {familyMembers.children}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="border-web3-violet-300 dark:border-web3-violet-700 text-web3-violet-700 dark:text-web3-violet-400 hover:bg-web3-violet-50 dark:hover:bg-web3-violet-900/20 transition-all duration-300"
                onClick={() => {
                  const newCount = Math.min(8, familyMembers.children + 1);
                  updateFamilyMembers('children', newCount);
                }}
                disabled={familyMembers.children >= 8}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Children Ages */}
          {familyMembers.children > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-medium text-gray-900 dark:text-white">Children&apos;s Ages</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Array.from({ length: familyMembers.children }, (_, index) => (
                  <div key={index}>
                    <Label className="text-sm text-gray-600 dark:text-gray-400">
                      Child {index + 1}
                    </Label>
                    <select
                      value={childrenAges[index] || ''}
                      onChange={(e) =>
                        handleChildAgeChange(index, parseInt(e.target.value))
                      }
                      className="w-full mt-1 px-3 py-2 text-sm border border-web3-violet-300 dark:border-web3-violet-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-web3-violet-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-300"
                      required
                    >
                      <option value="">Age</option>
                      {generateAgeOptions()}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seniors */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-web3-pink-600 dark:text-web3-pink-400" />
              <div>
                <Label className="text-base font-medium text-gray-900 dark:text-white">Seniors (Optional)</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ages 60 and above</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                className="border-web3-violet-300 dark:border-web3-violet-700 text-web3-violet-700 dark:text-web3-violet-400 hover:bg-web3-violet-50 dark:hover:bg-web3-violet-900/20 transition-all duration-300"
                onClick={() =>
                  updateFamilyMembers('seniors', Math.max(0, (familyMembers.seniors || 0) - 1))
                }
                disabled={(familyMembers.seniors || 0) <= 0}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-8 text-center font-medium">
                {familyMembers.seniors || 0}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="border-web3-violet-300 dark:border-web3-violet-700 text-web3-violet-700 dark:text-web3-violet-400 hover:bg-web3-violet-50 dark:hover:bg-web3-violet-900/20 transition-all duration-300"
                onClick={() =>
                  updateFamilyMembers('seniors', Math.min(5, (familyMembers.seniors || 0) + 1))
                }
                disabled={(familyMembers.seniors || 0) >= 5}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Family Summary */}
        <div className="glass dark:glass-dark border border-web3-violet-200 dark:border-web3-violet-800/30 rounded-xl p-4 shadow-web3">
          <h3 className="font-medium bg-gradient-to-r from-web3-violet-600 to-web3-purple-600 dark:from-web3-violet-400 dark:to-web3-pink-400 bg-clip-text text-transparent mb-2">Family Summary</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {familyMembers.adults} adult{familyMembers.adults > 1 ? 's' : ''}
            {familyMembers.children > 0 && 
              `, ${familyMembers.children} child${familyMembers.children > 1 ? 'ren' : ''}`
            }
            {(familyMembers.seniors || 0) > 0 && 
              `, ${familyMembers.seniors} senior${(familyMembers.seniors || 0) > 1 ? 's' : ''}`
            }
          </p>
        </div>
      </div>
    );
  }

  if (travelType === 'group') {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-web3-violet-600 to-web3-purple-600 dark:from-web3-violet-400 dark:to-web3-pink-400 bg-clip-text text-transparent">Group Details</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Tell us about your group for better planning
          </p>
        </div>

        <Card className="p-6 space-y-6 glass dark:glass-dark border-web3-violet-200 dark:border-web3-violet-800/30 shadow-web3">
          {/* Group Size */}
          <div className="space-y-3">
            <Label className="text-base font-medium text-gray-900 dark:text-white">Total Group Size</Label>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() =>
                  onChange({ ...data, groupSize: Math.max(3, (data.groupSize || 3) - 1) })
                }
                disabled={(data.groupSize || 3) <= 3}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                type="number"
                min="3"
                max="50"
                value={data.groupSize || ''}
                onChange={(e) =>
                  onChange({ ...data, groupSize: parseInt(e.target.value) })
                }
                className="w-20 text-center border-web3-violet-300 dark:border-web3-violet-700 rounded-xl focus:ring-web3-violet-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-300"
                placeholder="Size"
              />
              <Button
                variant="outline"
                onClick={() =>
                  onChange({ ...data, groupSize: Math.min(50, (data.groupSize || 3) + 1) })
                }
                disabled={(data.groupSize || 3) >= 50}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Minimum 3 people for group travel</p>
          </div>

          {/* Group Composition */}
          <div className="space-y-3">
            <Label className="text-base font-medium text-gray-900 dark:text-white">Group Composition</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { value: 'friends', label: 'Friends' },
                { value: 'colleagues', label: 'Colleagues' },
                { value: 'mixed', label: 'Mixed Group' },
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={data.groupComposition === option.value ? "default" : "outline"}
                  onClick={() =>
                    onChange({ ...data, groupComposition: option.value as any })
                  }
                  className={`h-12 transition-all duration-300 ${
                    data.groupComposition === option.value 
                      ? 'bg-gradient-to-r from-web3-violet-600 to-web3-purple-600 text-white shadow-web3 border-0' 
                      : 'border-web3-violet-300 dark:border-web3-violet-700 text-web3-violet-700 dark:text-web3-violet-400 hover:bg-web3-violet-50 dark:hover:bg-web3-violet-900/20'
                  }`}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Number of Families (for family groups) */}
          {data.groupComposition && (
            <div className="space-y-3">
              <Label className="text-base font-medium text-gray-900 dark:text-white">
                Number of Units 
                (Optional)
              </Label>
              <Input
                type="number"
                min="2"
                max="20"
                value={data.groupFamilies || ''}
                onChange={(e) =>
                  onChange({ ...data, groupFamilies: parseInt(e.target.value) })
                }
                placeholder="Number of units in your group"
                className="max-w-xs border-web3-violet-300 dark:border-web3-violet-700 rounded-xl focus:ring-web3-violet-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-300"
              />
            </div>
          )}
        </Card>

        {/* Group Summary */}
        {data.groupSize && (
          <div className="glass dark:glass-dark border border-web3-violet-200 dark:border-web3-violet-800/30 rounded-xl p-4 shadow-web3">
            <h3 className="font-medium bg-gradient-to-r from-web3-violet-600 to-web3-purple-600 dark:from-web3-violet-400 dark:to-web3-pink-400 bg-clip-text text-transparent mb-2">Group Summary</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {data.groupSize} people total
              {data.groupComposition && ` • ${data.groupComposition}`}
              {data.groupFamilies && ` • ${data.groupFamilies} units`}
            </p>
          </div>
        )}
      </div>
    );
  }

  return null;
}