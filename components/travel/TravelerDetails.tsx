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
          <h2 className="text-2xl font-bold text-gray-900">Tell us about yourself</h2>
          <p className="text-gray-600">
            This helps us recommend age-appropriate activities
          </p>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <Label htmlFor="travelerAge" className="text-base font-medium">
              Your Age
            </Label>
            <select
              id="travelerAge"
              value={data.travelerAge || ''}
              onChange={(e) => onChange({ ...data, travelerAge: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <h2 className="text-2xl font-bold text-gray-900">Family Details</h2>
          <p className="text-gray-600">
            Tell us about your family members for better recommendations
          </p>
        </div>

        <Card className="p-6 space-y-6">
          {/* Adults */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <Label className="text-base font-medium">Adults</Label>
                <p className="text-sm text-gray-600">Ages 18 and above</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
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
              <Baby className="w-5 h-5 text-green-600" />
              <div>
                <Label className="text-base font-medium">Children</Label>
                <p className="text-sm text-gray-600">Ages 0-17</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
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
              <Label className="text-base font-medium">Children's Ages</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Array.from({ length: familyMembers.children }, (_, index) => (
                  <div key={index}>
                    <Label className="text-sm text-gray-600">
                      Child {index + 1}
                    </Label>
                    <select
                      value={childrenAges[index] || ''}
                      onChange={(e) =>
                        handleChildAgeChange(index, parseInt(e.target.value))
                      }
                      className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <User className="w-5 h-5 text-purple-600" />
              <div>
                <Label className="text-base font-medium">Seniors (Optional)</Label>
                <p className="text-sm text-gray-600">Ages 60 and above</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
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
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">Family Summary</h3>
          <p className="text-sm text-gray-600">
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
          <h2 className="text-2xl font-bold text-gray-900">Group Details</h2>
          <p className="text-gray-600">
            Tell us about your group for better planning
          </p>
        </div>

        <Card className="p-6 space-y-6">
          {/* Group Size */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Total Group Size</Label>
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
                className="w-20 text-center"
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
            <p className="text-sm text-gray-600">Minimum 3 people for group travel</p>
          </div>

          {/* Group Composition */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Group Composition</Label>
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
                  className="h-12"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Number of Families (for family groups) */}
          {data.groupComposition && (
            <div className="space-y-3">
              <Label className="text-base font-medium">
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
                className="max-w-xs"
              />
            </div>
          )}
        </Card>

        {/* Group Summary */}
        {data.groupSize && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Group Summary</h3>
            <p className="text-sm text-gray-600">
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