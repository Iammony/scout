import { NextRequest, NextResponse } from 'next/server';
import { visionLocationService } from '@/lib/api/vision';

// File upload validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function validateImageData(imageData: string): { isValid: boolean; error?: string } {
  if (!imageData || typeof imageData !== 'string') {
    return { isValid: false, error: 'Invalid image data format' };
  }

  // Check if it's a valid data URL
  if (!imageData.startsWith('data:image/')) {
    return { isValid: false, error: 'Invalid image data URL format' };
  }

  // Extract MIME type
  const mimeTypeMatch = imageData.match(/^data:image\/(\w+);base64,/);
  if (!mimeTypeMatch) {
    return { isValid: false, error: 'Invalid image format' };
  }

  const mimeType = `image/${mimeTypeMatch[1]}`;
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return { isValid: false, error: `Unsupported image type: ${mimeType}. Allowed types: JPEG, PNG, WebP, GIF` };
  }

  // Check file size (approximate from base64)
  const base64Data = imageData.split(',')[1];
  if (!base64Data) {
    return { isValid: false, error: 'Invalid base64 image data' };
  }

  const sizeInBytes = (base64Data.length * 3) / 4;
  if (sizeInBytes > MAX_FILE_SIZE) {
    return { isValid: false, error: `Image too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` };
  }

  return { isValid: true };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, context } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Image data is required' 
        },
        { status: 400 }
      );
    }
    
    // Validate image data
    const validation = validateImageData(imageBase64);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }
    
    // Validate context if provided
    if (context && (typeof context !== 'string' || context.length > 500)) {
      return NextResponse.json(
        { success: false, error: 'Context must be a string under 500 characters' },
        { status: 400 }
      );
    }

    // Processing vision-based location identification (removed sensitive logging)

    // Use enhanced identification with context if provided
    const result = context 
      ? await visionLocationService.identifyWithContext(imageBase64, context)
      : await visionLocationService.identifyLocationFromImage(imageBase64);

    if (result.success && result.location) {
      // Location identified successfully (removed sensitive data from logs)
      
      return NextResponse.json({
        success: true,
        location: result.location,
        confidence: result.location.confidence,
        message: 'Location identified successfully'
      });
    } else {
      // Location identification failed (removed sensitive data from logs)
      
      return NextResponse.json({
        success: false,
        error: result.error || 'Unable to identify location from image',
        message: 'Could not determine location from the provided image'
      }, { status: 422 });
    }

  } catch (error) {
    console.error('Vision location API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: 'An error occurred while processing the image'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Return service status
  const status = visionLocationService.getStatus();
  
  return NextResponse.json({
    success: true,
    status: {
      visionSupported: status.available,
      provider: status.provider,
      endpoint: '/api/vision/location',
      methods: ['POST'],
      description: 'Upload an image to identify location using AI vision'
    }
  });
}