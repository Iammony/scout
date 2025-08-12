'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, TrendingUp, PiggyBank, CreditCard, Info, ArrowLeftRight } from 'lucide-react';
import { BudgetCard } from '@/lib/types/travel-deck';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { currencyAPI } from '@/lib/api/currency';

interface BudgetCardViewProps {
  card: BudgetCard;
  isFullscreen?: boolean;
}

export default function BudgetCardView({ card, isFullscreen }: BudgetCardViewProps) {
  const { content } = card;
  const [selectedBudgetTier, setSelectedBudgetTier] = useState<'tight' | 'comfortable' | 'luxury'>('comfortable');
  const [showCurrencyConverter, setShowCurrencyConverter] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [convertedBudgets, setConvertedBudgets] = useState<Record<string, number>>({});
  
  const loadExchangeRate = useCallback(async () => {
    if (!content) return;
    try {
      const rate = await currencyAPI.getExchangeRate(content.currency, selectedCurrency);
      if (rate) {
        setExchangeRate(rate.rate);
        
        // Convert budget amounts
        const converted = {
          tight: content.perPerson.tight * rate.rate,
          comfortable: content.perPerson.comfortable * rate.rate,
          luxury: content.perPerson.luxury * rate.rate
        };
        setConvertedBudgets(converted);
      }
    } catch (error) {
      console.error('Failed to load exchange rate:', error);
    }
  }, [content, selectedCurrency]);

  useEffect(() => {
    if (showCurrencyConverter) {
      loadExchangeRate();
    }
  }, [showCurrencyConverter, loadExchangeRate]);
  
  // Safety check for content
  if (!content) {
    return (
      <div className="space-y-6 p-4 text-center">
        <p className="text-gray-500">No budget data available</p>
        <p className="text-sm text-gray-400">Please try regenerating this card</p>
      </div>
    );
  }
  
  // Get destination currency
  const destinationCurrency = content.currency === 'INR' ? 'USD' : 'INR';

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

      {/* Currency Converter Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCurrencyConverter(!showCurrencyConverter)}
          className="flex items-center gap-2"
        >
          <ArrowLeftRight className="w-4 h-4" />
          Currency Converter
        </Button>
        {content.exchangeRate && (
          <span className="text-xs text-gray-500">
            1 {content.currency} = ₹{content.exchangeRate}
          </span>
        )}
      </div>

      {/* Currency Converter */}
      {showCurrencyConverter && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="AED">AED - UAE Dirham</option>
              <option value="THB">THB - Thai Baht</option>
              <option value="SGD">SGD - Singapore Dollar</option>
              <option value="JPY">JPY - Japanese Yen</option>
            </select>
            {exchangeRate && (
              <Badge variant="secondary" className="text-xs">
                1 {content.currency} = {exchangeRate.toFixed(4)} {selectedCurrency}
              </Badge>
            )}
          </div>
          
          {Object.keys(convertedBudgets).length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {budgetTiers.map((tier) => (
                <div key={tier.key} className="text-center p-2 bg-white rounded border">
                  <p className="text-xs text-gray-600">{tier.label}</p>
                  <p className="font-semibold text-sm">
                    {currencyAPI.formatCurrency(convertedBudgets[tier.key as keyof typeof convertedBudgets], selectedCurrency)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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