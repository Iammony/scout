'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, Upload, ArrowRight, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface MobileImageCaptureProps {
  onImageCapture: (imageData: string, detectedLocation?: string) => void;
  onSkip: () => void;
}

const MobileImageCapture: React.FC<MobileImageCaptureProps> = ({ 
  onImageCapture, 
  onSkip 
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [cameraMode, setCameraMode] = useState<'environment' | 'user'>('environment');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: cameraMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCapturing(true);
    } catch (err) {
      setError('Camera access denied. Please use upload instead.');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageData);
      stopCamera();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setCapturedImage(imageData);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async () => {
    if (!capturedImage) return;

    setIsProcessing(true);
    setError('');

    try {
      // Call vision API to detect location
      const response = await fetch('/api/vision/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: capturedImage,
          prompt: 'Identify the location, landmark, or destination in this image. Return just the location name.'
        })
      });

      const result = await response.json();
      
      if (result.success && result.location) {
        onImageCapture(capturedImage, result.location);
      } else {
        onImageCapture(capturedImage);
      }
    } catch (error) {
      console.error('Location detection error:', error);
      onImageCapture(capturedImage);
    } finally {
      setIsProcessing(false);
    }
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const switchCamera = () => {
    setCameraMode(prev => prev === 'environment' ? 'user' : 'environment');
    if (isCapturing) {
      stopCamera();
      setTimeout(startCamera, 100);
    }
  };

  if (capturedImage) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <div className="flex-1 relative">
          <Image 
            src={capturedImage} 
            alt="Captured" 
            fill
            className="object-contain"
          />
          
          {isProcessing && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white rounded-lg p-6 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-900 font-medium">Detecting location...</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-4 space-y-4">
          <div className="flex space-x-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={retake}
              disabled={isProcessing}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Retake
            </Button>
            <Button 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={processImage}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Continue'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            className="w-full text-gray-600"
            onClick={onSkip}
          >
            Skip and enter manually
          </Button>
        </div>
      </div>
    );
  }

  if (isCapturing) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <div className="flex-1 relative overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          
          {/* Camera overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-4 border-2 border-white border-opacity-50 rounded-lg">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>
            </div>
            
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center">
              <p className="text-sm opacity-75">Point camera at your destination</p>
            </div>
          </div>
        </div>

        <div className="bg-black bg-opacity-80 p-4">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-white hover:bg-white hover:bg-opacity-20"
              onClick={stopCamera}
            >
              <X className="w-4 h-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              className="text-white hover:bg-white hover:bg-opacity-20"
              onClick={switchCamera}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-center space-x-8">
            <Button 
              variant="ghost" 
              className="text-white"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-6 h-6" />
            </Button>
            
            <button
              onClick={capturePhoto}
              className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 hover:border-gray-400 transition-colors"
            />
            
            <Button 
              variant="ghost" 
              className="text-white"
              onClick={onSkip}
            >
              Skip
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-md mx-auto pt-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Where are you going?</h1>
          <p className="text-gray-600">Snap a photo of your destination or upload an image</p>
        </div>

        <div className="space-y-4">
          <Card className="p-8 text-center">
            <Camera className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <h3 className="font-semibold text-lg mb-2">Take a Photo</h3>
            <p className="text-gray-600 text-sm mb-4">
              Point your camera at a landmark, sign, or destination
            </p>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={startCamera}
            >
              <Camera className="w-4 h-4 mr-2" />
              Open Camera
            </Button>
          </Card>

          <Card className="p-8 text-center">
            <Upload className="w-16 h-16 mx-auto mb-4 text-purple-600" />
            <h3 className="font-semibold text-lg mb-2">Upload Image</h3>
            <p className="text-gray-600 text-sm mb-4">
              Choose an existing photo from your device
            </p>
            <Button 
              variant="outline"
              className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose File
            </Button>
          </Card>

          {error && (
            <Card className="p-4 bg-red-50 border-red-200">
              <p className="text-red-600 text-sm">{error}</p>
            </Card>
          )}

          <Button 
            variant="ghost" 
            className="w-full text-gray-600"
            onClick={onSkip}
          >
            Skip and enter destination manually
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default MobileImageCapture;