'use client';

import React, { useState, useCallback } from 'react';
import { Camera, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageCapture, CapturedImage } from '@/components/camera/ImageCapture';
import { LocationConfirmation } from '@/components/location/LocationConfirmation';
import { visionLocationService, LocationIdentification } from '@/lib/api/vision';

export interface ImageLocationCaptureProps {
  onLocationSelected: (location: string) => void;
  onSkip?: () => void;
  className?: string;
  title?: string;
  description?: string;
}

type CaptureState = 'initial' | 'capturing' | 'analyzing' | 'confirming';

export function ImageLocationCapture({
  onLocationSelected,
  onSkip,
  className = "",
  title = "Where are you?",
  description = "Take a photo or upload an image to automatically identify your location"
}: ImageLocationCaptureProps) {
  const [captureState, setCaptureState] = useState<CaptureState>('initial');
  const [capturedImage, setCapturedImage] = useState<CapturedImage | null>(null);
  const [detectedLocation, setDetectedLocation] = useState<LocationIdentification | null>(null);
  const [analysisError, setAnalysisError] = useState<string>('');

  const handleStartCapture = useCallback(() => {
    setCaptureState('capturing');
    setAnalysisError('');
  }, []);

  const handleImageCapture = useCallback(async (image: CapturedImage) => {
    setCapturedImage(image);
    setCaptureState('analyzing');
    setAnalysisError('');

    try {
      console.log('Starting image analysis for location detection...');
      
      const analysisResult = await visionLocationService.identifyLocationFromImage(image.preview);
      
      if (analysisResult.success && analysisResult.location) {
        setDetectedLocation(analysisResult.location);
        setCaptureState('confirming');
        console.log('Location detected:', analysisResult.location.location);
      } else {
        setAnalysisError(analysisResult.error || 'Unable to identify location from image');
        setCaptureState('confirming'); // Still show confirmation UI for manual entry
      }
    } catch (error) {
      console.error('Image analysis failed:', error);
      setAnalysisError('Failed to analyze image. Please enter location manually.');
      setCaptureState('confirming');
    }
  }, []);

  const handleLocationConfirm = useCallback((location: string) => {
    onLocationSelected(location);
    resetState();
  }, [onLocationSelected]);

  const handleCancel = useCallback(() => {
    if (captureState === 'capturing') {
      setCaptureState('initial');
    } else {
      resetState();
    }
  }, [captureState]);

  const resetState = useCallback(() => {
    setCaptureState('initial');
    setCapturedImage(null);
    setDetectedLocation(null);
    setAnalysisError('');
  }, []);

  const handleSkip = useCallback(() => {
    onSkip?.();
    resetState();
  }, [onSkip]);

  // Show image capture interface
  if (captureState === 'capturing') {
    return (
      <div className={`w-full ${className}`}>
        <ImageCapture
          onImageCapture={handleImageCapture}
          onCancel={handleCancel}
          maxSize={5}
          className="w-full"
        />
      </div>
    );
  }

  // Show location confirmation/analysis
  if (captureState === 'analyzing' || captureState === 'confirming') {
    return (
      <div className={`w-full ${className}`}>
        <LocationConfirmation
          detectedLocation={detectedLocation || undefined}
          imagePreview={capturedImage?.preview}
          isAnalyzing={captureState === 'analyzing'}
          onLocationConfirm={handleLocationConfirm}
          onCancel={handleCancel}
          className="w-full"
        />
        {analysisError && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">{analysisError}</p>
          </div>
        )}
      </div>
    );
  }

  // Show initial state with options
  return (
    <div className={`w-full ${className}`}>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center pb-4">
          <CardTitle className="flex items-center justify-center gap-2 text-lg">
            <MapPin className="w-5 h-5 text-blue-600" />
            {title}
          </CardTitle>
          {description && (
            <p className="text-sm text-gray-600 mt-2">
              {description}
            </p>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Button
            onClick={handleStartCapture}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            <Camera className="w-5 h-5 mr-2" />
            Take Photo to Identify Location
          </Button>

          {onSkip && (
            <Button
              variant="outline"
              onClick={handleSkip}
              className="w-full h-10"
            >
              Skip - Enter Location Manually
            </Button>
          )}

          <div className="text-center">
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Works best with landmarks or distinctive features</p>
              <p>• Supports monuments, buildings, and natural sites</p>
              <p>• You can edit or correct the identified location</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ImageLocationCapture;