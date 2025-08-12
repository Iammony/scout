'use client';

import React, { useState } from 'react';
import { 
  Share2, 
  Download, 
  Printer, 
  Bookmark, 
  Heart,
  ExternalLink,
  MapPin,
  Calendar,
  Users,
  Camera,
  Star,
  Clock,
  DollarSign,
  Plane,
  Building,
  Utensils,
  ShoppingBag,
  AlertCircle,
  Sun,
  FileText,
  Globe,
  ChevronRight,
  Copy,
  Check
} from 'lucide-react';
import { TravelDeck, TravelDeckCard } from '@/lib/types/travel-deck';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { SocialShare } from '@/lib/utils/social-share';

interface ComprehensiveTravelGuideProps {
  deck: TravelDeck;
  onClose?: () => void;
  className?: string;
}

interface CategoryConfig {
  title: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  description: string;
}

const categoryConfigs: Record<string, CategoryConfig> = {
  overview: {
    title: 'Trip Overview',
    icon: MapPin,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200',
    description: 'Essential trip information and highlights'
  },
  itinerary: {
    title: 'Daily Itinerary',
    icon: Calendar,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50 border-purple-200',
    description: 'Day-by-day activity schedule'
  },
  transport: {
    title: 'Transportation',
    icon: Plane,
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50 border-cyan-200',
    description: 'Flight details and local transport options'
  },
  accommodation: {
    title: 'Accommodation',
    icon: Building,
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-200',
    description: 'Hotel and lodging recommendations'
  },
  attractions: {
    title: 'Top Attractions',
    icon: Camera,
    color: 'text-green-700',
    bgColor: 'bg-green-50 border-green-200',
    description: 'Must-visit places and experiences'
  },
  dining: {
    title: 'Food & Dining',
    icon: Utensils,
    color: 'text-orange-700',
    bgColor: 'bg-orange-50 border-orange-200',
    description: 'Restaurant recommendations and local cuisine'
  },
  budget: {
    title: 'Budget Planning',
    icon: DollarSign,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50 border-yellow-200',
    description: 'Cost breakdown and money-saving tips'
  },
  visa: {
    title: 'Visa & Documents',
    icon: FileText,
    color: 'text-red-700',
    bgColor: 'bg-red-50 border-red-200',
    description: 'Required documents and entry requirements'
  },
  weather: {
    title: 'Weather Guide',
    icon: Sun,
    color: 'text-sky-700',
    bgColor: 'bg-sky-50 border-sky-200',
    description: 'Weather forecast and packing suggestions'
  },
  culture: {
    title: 'Culture & Customs',
    icon: Globe,
    color: 'text-pink-700',
    bgColor: 'bg-pink-50 border-pink-200',
    description: 'Local customs and cultural insights'
  },
  emergency: {
    title: 'Emergency Info',
    icon: AlertCircle,
    color: 'text-rose-700',
    bgColor: 'bg-rose-50 border-rose-200',
    description: 'Emergency contacts and safety information'
  },
  shopping: {
    title: 'Shopping Guide',
    icon: ShoppingBag,
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50 border-indigo-200',
    description: 'Best shopping areas and local products'
  }
};

export default function ComprehensiveTravelGuide({ deck, onClose, className = '' }: ComprehensiveTravelGuideProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  const getCardIcon = (type: string) => {
    const icons: Record<string, string> = {
      overview: '🗺️',
      itinerary: '📅',
      transport: '✈️',
      accommodation: '🏨',
      attractions: '🎯',
      dining: '🍽️',
      budget: '💰',
      visa: '📄',
      weather: '☀️',
      culture: '🎭',
      emergency: '🚨',
      shopping: '🛍️',
    };
    return icons[type] || '📋';
  };

  // Group cards by category
  const groupedCards = deck.cards.reduce((acc, card) => {
    if (!acc[card.type]) {
      acc[card.type] = [];
    }
    acc[card.type].push(card);
    return acc;
  }, {} as Record<string, TravelDeckCard[]>);

  const handleShare = async (platform: string) => {
    const url = window.location.href;
    const title = `${deck.destination} Travel Guide`;
    const description = SocialShare.generateShareText(
      deck.destination, 
      deck.metadata.duration,
      ['Complete itinerary', 'Budget breakdown', 'Local recommendations']
    );

    const shareOptions = {
      url,
      title,
      description,
      hashtags: ['travel', 'vacation', deck.destination.toLowerCase().replace(/\s+/g, '')],
      via: 'ScoutTravel'
    };

    switch (platform) {
      case 'copy':
        const success = await SocialShare.copyToClipboard(url);
        if (success) {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        }
        break;
      case 'native':
        const nativeSuccess = await SocialShare.shareViaNativeAPI(shareOptions);
        if (!nativeSuccess) {
          // Fallback to copy
          await SocialShare.copyToClipboard(url);
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        }
        break;
      case 'twitter':
        SocialShare.shareToTwitter(shareOptions);
        break;
      case 'facebook':
        SocialShare.shareToFacebook(shareOptions);
        break;
      case 'whatsapp':
        SocialShare.shareToWhatsApp(shareOptions);
        break;
      case 'linkedin':
        SocialShare.shareToLinkedIn(shareOptions);
        break;
      case 'email':
        SocialShare.shareViaEmail(shareOptions);
        break;
    }
    setShareMenuOpen(false);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    // Here you could implement actual save functionality
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Here you could implement PDF export functionality
    alert('PDF download functionality would be implemented here');
  };

  const renderCardContent = (card: TravelDeckCard) => {
    if (!card.content) {
      return <p className="text-gray-500 italic">No content available for this section.</p>;
    }

    // Handle different content types based on card type
    switch (card.type) {
      case 'itinerary':
        const itineraryContent = card.content as any;
        if (itineraryContent.days && Array.isArray(itineraryContent.days)) {
          return (
            <div className="space-y-4">
              {itineraryContent.days.map((day: any, index: number) => (
                <div key={index} className="border-l-4 border-blue-200 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Day {index + 1}</h4>
                  {day.activities?.map((activity: any, actIndex: number) => (
                    <div key={actIndex} className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">{activity.time}</span>
                      </div>
                      <h5 className="font-medium">{activity.title}</h5>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      {activity.location && (
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{activity.location}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          );
        }
        break;
      
      case 'budget':
        const budgetContent = card.content as any;
        if (budgetContent.budget) {
          return (
            <div className="space-y-6">
              {/* Budget Overview */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold text-gray-800">
                    {budgetContent.budget.level} Budget
                  </h4>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">
                      {budgetContent.currencySymbol} {budgetContent.budget.total.toLocaleString()}
                    </div>
                    {budgetContent.inrEquivalent && (
                      <div className="text-sm text-gray-600">
                        ≈ ₹{budgetContent.inrEquivalent.total.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Daily Average: {budgetContent.currencySymbol} {budgetContent.budget.daily.toLocaleString()}
                  {budgetContent.inrEquivalent && (
                    <span> (≈ ₹{budgetContent.inrEquivalent.daily.toLocaleString()})</span>
                  )}
                </div>
              </div>

              {/* Budget Breakdown */}
              <div className="space-y-3">
                <h5 className="font-semibold text-gray-800 mb-3">Budget Breakdown</h5>
                {Object.entries(budgetContent.budget.breakdown).map(([category, amount]: [string, any]) => (
                  <div key={category} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="capitalize font-medium">{category.replace(/([A-Z])/g, ' $1')}</span>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        {budgetContent.currencySymbol} {amount.toLocaleString()}
                      </div>
                      {budgetContent.inrEquivalent && (
                        <div className="text-xs text-gray-500">
                          ≈ ₹{Math.round(amount * budgetContent.exchangeRate).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Money Saving Tips */}
              {budgetContent.tips && (
                <div>
                  <h5 className="font-semibold text-gray-800 mb-3">💡 Money Saving Tips</h5>
                  <ul className="space-y-2">
                    {budgetContent.tips.map((tip: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span className="text-gray-700">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Exchange Rate Info */}
              {!budgetContent.isDomestic && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-blue-800">
                    <DollarSign className="w-4 h-4" />
                    <span>
                      Exchange Rate: 1 {budgetContent.currency} = ₹{budgetContent.exchangeRate} 
                      <span className="text-xs ml-1">(approx.)</span>
                    </span>
                  </div>
                  {budgetContent._metadata && (
                    <div className="mt-2 text-xs text-green-700 bg-green-50 px-2 py-1 rounded flex items-center justify-between">
                      <span>
                        ✓ {budgetContent._metadata.dataSource === 'api' ? 'Real API data' : 
                           budgetContent._metadata.dataSource === 'llm_enhanced' ? 'API + LLM enhanced' :
                           'LLM generated'}
                      </span>
                      <span className="text-xs opacity-75">
                        {(budgetContent._metadata.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                  )}
                  {budgetContent.realData && (
                    <div className="mt-1 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded">
                      ✓ Using real data from {budgetContent.realData.source}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }
        break;
      
      case 'attractions':
        const attractionsContent = card.content as any;
        if (attractionsContent.attractions && Array.isArray(attractionsContent.attractions)) {
          return (
            <div className="grid gap-4">
              {attractionsContent.attractions.map((attraction: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{attraction.name}</h4>
                    {attraction.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{attraction.rating}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{attraction.description}</p>
                  {attraction.location && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      <span>{attraction.location}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        }
        break;
      
      default:
        // Handle generic content
        if (typeof card.content === 'string') {
          return <p className="text-gray-700 whitespace-pre-wrap">{card.content}</p>;
        } else if (typeof card.content === 'object') {
          return (
            <div className="space-y-2">
              {Object.entries(card.content).map(([key, value]: [string, any]) => (
                <div key={key}>
                  <strong className="capitalize">{key.replace(/([A-Z])/g, ' $1')}: </strong>
                  <span>{typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</span>
                </div>
              ))}
            </div>
          );
        }
    }

    return <p className="text-gray-500 italic">Unable to display content for this section.</p>;
  };

  return (
    <div className={cn('min-h-screen bg-gradient-to-br from-gray-50 to-blue-50', className)}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{deck.destination}</h1>
                <p className="text-sm text-gray-600">Complete Travel Guide</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Calendar className="w-3 h-3" />
                  {deck.metadata.duration}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Users className="w-3 h-3" />
                  {deck.metadata.travelerCount} travelers
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-2 no-print">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                className={cn('gap-2', isSaved && 'text-red-600')}
              >
                <Heart className={cn('w-4 h-4', isSaved && 'fill-current')} />
                {isSaved ? 'Saved' : 'Save'}
              </Button>
              
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShareMenuOpen(!shareMenuOpen)}
                  className="gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
                
                {shareMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border z-50">
                    <div className="p-2">
                      {SocialShare.canUseNativeShare() && (
                        <>
                          <button
                            onClick={() => handleShare('native')}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded font-medium"
                          >
                            <Share2 className="w-4 h-4 text-blue-600" />
                            Share...
                          </button>
                          <div className="border-t border-gray-100 my-1" />
                        </>
                      )}
                      <button
                        onClick={() => handleShare('copy')}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded"
                      >
                        {copySuccess ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        {copySuccess ? 'Copied!' : 'Copy Link'}
                      </button>
                      <button
                        onClick={() => handleShare('twitter')}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded"
                      >
                        <span className="w-4 h-4 text-blue-400">𝕏</span>
                        Twitter / X
                      </button>
                      <button
                        onClick={() => handleShare('facebook')}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded"
                      >
                        <span className="w-4 h-4 text-blue-600">f</span>
                        Facebook
                      </button>
                      <button
                        onClick={() => handleShare('whatsapp')}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded"
                      >
                        <span className="w-4 h-4 text-green-600">💬</span>
                        WhatsApp
                      </button>
                      <button
                        onClick={() => handleShare('linkedin')}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded"
                      >
                        <span className="w-4 h-4 text-blue-700">in</span>
                        LinkedIn
                      </button>
                      <button
                        onClick={() => handleShare('email')}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded"
                      >
                        <span className="w-4 h-4">📧</span>
                        Email
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <Button variant="ghost" size="sm" onClick={handlePrint} className="gap-2">
                <Printer className="w-4 h-4" />
                Print
              </Button>
              
              <Button variant="ghost" size="sm" onClick={handleDownload} className="gap-2">
                <Download className="w-4 h-4" />
                PDF
              </Button>

              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  ×
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Table of Contents */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bookmark className="w-5 h-5" />
              Quick Navigation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(groupedCards).map(([type, cards]) => {
                const config = categoryConfigs[type];
                if (!config) return null;
                
                const IconComponent = config.icon;
                return (
                  <button
                    key={type}
                    onClick={() => setActiveSection(activeSection === type ? null : type)}
                    className="flex items-center gap-2 p-3 text-left rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <IconComponent className={cn('w-4 h-4', config.color)} />
                    <span className="text-sm font-medium">{config.title}</span>
                    <ChevronRight className={cn(
                      'w-4 h-4 ml-auto transition-transform',
                      activeSection === type && 'rotate-90'
                    )} />
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Content Sections */}
        <div className="space-y-8">
          {Object.entries(groupedCards).map(([type, cards]) => {
            const config = categoryConfigs[type];
            if (!config) return null;
            
            const IconComponent = config.icon;
            const isExpanded = activeSection === null || activeSection === type;
            
            return (
              <Card 
                key={type} 
                className={cn(
                  'overflow-hidden transition-all duration-300 travel-category',
                  config.bgColor,
                  !isExpanded && 'opacity-50 print:opacity-100'
                )}
                id={type}
              >
                <CardHeader className="cursor-pointer" onClick={() => setActiveSection(activeSection === type ? null : type)}>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IconComponent className={cn('w-6 h-6', config.color)} />
                      <div>
                        <h2 className="text-xl">{config.title}</h2>
                        <p className="text-sm font-normal text-gray-600 mt-1">{config.description}</p>
                      </div>
                    </div>
                    <ChevronRight className={cn(
                      'w-5 h-5 transition-transform',
                      isExpanded && 'rotate-90'
                    )} />
                  </CardTitle>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-6">
                      {(cards as any[]).map((card: any, index: number) => (
                        <div key={card.id} className="bg-white rounded-lg p-6 shadow-sm travel-card border-l-4" style={{borderLeftColor: config.color.replace('text-', '#')}}>
                          {card.title !== config.title && (
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                              <span className="text-2xl">{getCardIcon(card.type)}</span>
                              {card.title}
                            </h3>
                          )}
                          {card.subtitle && (
                            <p className="text-gray-600 mb-4 italic">{card.subtitle}</p>
                          )}
                          <div className="prose max-w-none">
                            {renderCardContent(card)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Generated on {new Date(deck.createdAt).toLocaleDateString()}</p>
          <p className="mt-2">Scout Travel Guide • Made with ❤️ for your perfect trip</p>
        </div>
      </div>

      {/* Click outside to close share menu */}
      {shareMenuOpen && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShareMenuOpen(false)} 
        />
      )}
    </div>
  );
}