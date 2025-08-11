'use client';

import React, { useState } from 'react';
import { DollarSign, TrendingUp, PiggyBank, CreditCard, Info } from 'lucide-react';
import { BudgetCard } from '@/lib/types/travel-deck';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BudgetCardViewProps {
  card: BudgetCard;
  isFullscreen?: boolean;
}

export default function BudgetCardView({ card, isFullscreen }: BudgetCardViewProps) {
  const { content } = card;
  const [selectedBudgetTier, setSelectedBudgetTier] = useState<'tight' | 'comfortable' | 'luxury'>('comfortable');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPercentage = (value: number, total: number) => {
    return Math.round((value / total) * 100);
  };

  const totalBreakdown = Object.values(content.breakdown).reduce((a, b) => a + b, 0);

  const budgetTiers = [
    { key: 'tight', label: 'Budget', icon: '💰', color: 'text-green-600 bg-green-50' },
    { key: 'comfortable', label: 'Comfort', icon: '✨', color: 'text-blue-600 bg-blue-50' },
    { key: 'luxury', label: 'Luxury', icon: '👑', color: 'text-purple-600 bg-purple-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Budget Tier Selector */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">Select Your Budget Tier</h3>
        <div className="grid grid-cols-3 gap-3">
          {budgetTiers.map((tier) => (
            <Button
              key={tier.key}
              variant={selectedBudgetTier === tier.key ? 'default' : 'outline'}
              onClick={() => setSelectedBudgetTier(tier.key as typeof selectedBudgetTier)}
              className={cn(
                'flex flex-col items-center p-4 h-auto',
                selectedBudgetTier === tier.key && 'bg-blue-600 hover:bg-blue-700'
              )}
            >
              <span className="text-2xl mb-1">{tier.icon}</span>
              <span className="font-medium">{tier.label}</span>
              <span className="text-xs mt-1">
                {formatCurrency(content.perPerson[tier.key as keyof typeof content.perPerson])}
              </span>
            </Button>
          ))}
        </div>
      </div>

      {/* Selected Budget Details */}
      <div className={cn(
        'rounded-lg p-4',
        selectedBudgetTier === 'tight' && 'bg-green-50',
        selectedBudgetTier === 'comfortable' && 'bg-blue-50',
        selectedBudgetTier === 'luxury' && 'bg-purple-50'
      )}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-gray-600">Per Person Budget</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(content.perPerson[selectedBudgetTier])}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-600">Total Budget</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(content.totalBudget[selectedBudgetTier])}
            </p>
          </div>
        </div>
        
        {content.exchangeRate && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Info className="w-4 h-4" />
            <span>Exchange Rate: 1 {content.currency} = ₹{content.exchangeRate}</span>
          </div>
        )}
      </div>

      {/* Budget Breakdown */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">Budget Breakdown</h3>
        <div className="space-y-3">
          {Object.entries(content.breakdown).map(([category, amount]) => {
            const percentage = getPercentage(amount, totalBreakdown);
            const categoryIcons: Record<string, string> = {
              accommodation: '🏨',
              transportation: '✈️',
              food: '🍽️',
              attractions: '🎯',
              shopping: '🛍️',
              miscellaneous: '📦',
            };
            
            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{categoryIcons[category]}</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(amount)}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {percentage}%
                    </Badge>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Average */}
      <div className="bg-yellow-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-yellow-600" />
            <span className="font-medium text-gray-900">Daily Average</span>
          </div>
          <span className="text-xl font-bold text-yellow-700">
            {formatCurrency(content.dailyAverage)}/day
          </span>
        </div>
      </div>

      {/* Payment Methods */}
      {content.paymentMethods && content.paymentMethods.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Accepted Payment Methods</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {content.paymentMethods.map((method, index) => (
              <Badge key={index} variant="outline">
                {method}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Money-Saving Tips */}
      {content.savingTips && content.savingTips.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Money-Saving Tips</h3>
          </div>
          <ul className="space-y-2">
            {content.savingTips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">💡</span>
                <span className="text-gray-700 text-sm">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tipping Guide */}
      {content.tippingGuide && (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="font-medium text-gray-900 mb-2">Tipping Guide</p>
          <p className="text-sm text-gray-600">{content.tippingGuide}</p>
        </div>
      )}
    </div>
  );
}