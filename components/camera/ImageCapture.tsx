'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export interface CapturedImage {
  file: File;
  preview: string;
  timestamp: number;
}

export interface ImageCaptureProps {
  onImageCapture: (image: CapturedImage) => void;
  onCancel?: () => void;
  maxSize?: number; // in MB
  className?: string;
}

export function ImageCapture({ 
  onImageCapture, 
  onCancel, 
  maxSize = 5,
  className = "" 
}: ImageCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<CapturedImage | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [cameraSupported, setCameraSupported] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = useCallback(async () => {
    try {
      setError('');
      setIsCapturing(true);

      // Check if camera is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraSupported(false);
        throw new Error('Camera not supported on this device');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please check permissions.');
      setCameraSupported(false);
      setIsCapturing(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], `photo-${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });

      const preview = canvas.toDataURL('image/jpeg', 0.8);
      
      const capturedImg: CapturedImage = {
        file,
        preview,
        timestamp: Date.now()
      };

      setCapturedImage(capturedImg);
      stopCamera();
    }, 'image/jpeg', 0.8);
  }, [stopCamera]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      
      const capturedImg: CapturedImage = {
        file,
        preview,
        timestamp: Date.now()
      };

      setCapturedImage(capturedImg);
    };

    reader.readAsDataURL(file);
    setError('');
  }, [maxSize]);

  const confirmImage = useCallback(() => {
    if (capturedImage) {
      onImageCapture(capturedImage);
    }
  }, [capturedImage, onImageCapture]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setError('');
    if (cameraSupported) {
      startCamera();
    }
  }, [startCamera, cameraSupported]);

  const handleCancel = useCallback(() => {
    stopCamera();
    setCapturedImage(null);
    setError('');
    onCancel?.();
  }, [stopCamera, onCancel]);

  // Show captured image preview with confirmation
  if (capturedImage) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="relative">
              <img
                src={capturedImage.preview}
                alt="Captured"
                className="w-full h-64 object-cover rounded-lg border border-gray-200"
              />
            </div>
            
            <div className="flex gap-2 justify-center">
              <Button 
                variant="outline" 
                onClick={retakePhoto}
                className="flex-1 h-12"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake
              </Button>
              <Button 
                onClick={confirmImage}
                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Use Photo
              </Button>
            </div>
            
            <Button 
              variant="ghost" 
              onClick={handleCancel}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show camera view during capture
  if (isCapturing && cameraSupported) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-64 object-cover rounded-lg border border-gray-200 bg-black"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              
              <Button
                onClick={handleCancel}
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 bg-white/80 hover:bg-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <Button 
              onClick={capturePhoto}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700"
            >
              <Camera className="w-5 h-5 mr-2" />
              Capture Photo
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show initial options (camera or upload)
  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Add Location Photo
            </h3>
            <p className="text-sm text-gray-600">
              Take a photo or upload an image to identify your location
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            {cameraSupported && (
              <Button
                onClick={startCamera}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700"
              >
                <Camera className="w-5 h-5 mr-2" />
                Take Photo
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-12"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Image
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {onCancel && (
            <Button 
              variant="ghost" 
              onClick={handleCancel}
              className="w-full"
            >
              Skip for now
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}