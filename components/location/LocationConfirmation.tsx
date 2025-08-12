'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { MapPin, Edit3, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LocationIdentification, visionLocationService } from '@/lib/api/vision';

export interface LocationConfirmationProps {
  detectedLocation?: LocationIdentification;
  imagePreview?: string;
  isAnalyzing?: boolean;
  onLocationConfirm: (location: string) => void;
  onCancel?: () => void;
  className?: string;
}

export function LocationConfirmation({
  detectedLocation,
  imagePreview,
  isAnalyzing = false,
  onLocationConfirm,
  onCancel,
  className = ""
}: LocationConfirmationProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLocation, setEditedLocation] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (detectedLocation) {
      setEditedLocation(detectedLocation.location);
    }
  }, [detectedLocation]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedLocation(detectedLocation?.location || '');
  };

  const handleSave = () => {
    if (editedLocation.trim()) {
      onLocationConfirm(editedLocation.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (isEditing) {
      setEditedLocation(detectedLocation?.location || '');
      setIsEditing(false);
    } else {
      onCancel?.();
    }
  };

  const handleLocationInputChange = async (value: string) => {
    setEditedLocation(value);
    
    // Get suggestions when user types
    if (value.length > 2) {
      setLoadingSuggestions(true);
      try {
        const locationSuggestions = await visionLocationService.getLocationSuggestions(
          value, 
          imagePreview
        );
        setSuggestions(locationSuggestions);
      } catch (error) {
        console.error('Failed to get suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setEditedLocation(suggestion);
    setSuggestions([]);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High Confidence';
    if (confidence >= 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  // Show analyzing state
  if (isAnalyzing) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto">
              <Loader2 className="w-16 h-16 animate-spin text-blue-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Analyzing Image...
              </h3>
              <p className="text-sm text-gray-600">
                Identifying location from your photo
              </p>
            </div>
            {imagePreview && (
              <div className="mt-4">
                <Image
                  src={imagePreview}
                  alt="Analyzing"
                  width={400}
                  height={128}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="w-5 h-5 text-blue-600" />
          Location Detected
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {imagePreview && (
          <div className="relative">
            <Image
              src={imagePreview}
              alt="Captured location"
              width={400}
              height={128}
              className="w-full h-32 object-cover rounded-lg border border-gray-200"
            />
          </div>
        )}

        {detectedLocation ? (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className={getConfidenceColor(detectedLocation.confidence)}
                  >
                    {getConfidenceLabel(detectedLocation.confidence)}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {Math.round(detectedLocation.confidence * 100)}%
                  </span>
                </div>
                {!isEditing && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleEdit}
                    className="h-8 px-2"
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <Input
                    value={editedLocation}
                    onChange={(e) => handleLocationInputChange(e.target.value)}
                    placeholder="Enter location manually..."
                    className="w-full"
                    autoFocus
                  />
                  
                  {/* Suggestions */}
                  {suggestions.length > 0 && (
                    <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => selectSuggestion(suggestion)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {suggestion}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {loadingSuggestions && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Loading suggestions...
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="font-medium text-gray-900">
                    {detectedLocation.location}
                  </div>
                  <div className="text-sm text-gray-600">
                    {detectedLocation.country}
                  </div>
                </div>
              )}

              {detectedLocation.landmarks.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">
                    Identified landmarks:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {detectedLocation.landmarks.map((landmark, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {landmark}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {detectedLocation.description && (
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {detectedLocation.description}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              {isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={!editedLocation.trim()}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={() => onLocationConfirm(detectedLocation.location)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Use This Location
                  </Button>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="text-center space-y-3">
              <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="space-y-1">
                <h4 className="font-medium text-gray-900">
                  Unable to identify location
                </h4>
                <p className="text-sm text-gray-600">
                  Please enter the location manually
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Input
                value={editedLocation}
                onChange={(e) => handleLocationInputChange(e.target.value)}
                placeholder="Enter your location..."
                className="w-full"
                autoFocus
              />

              {suggestions.length > 0 && (
                <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => selectSuggestion(suggestion)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {suggestion}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={handleCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={!editedLocation.trim()}
              >
                Continue
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}