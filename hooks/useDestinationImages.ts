import { useState, useEffect, useCallback } from 'react';

interface DestinationImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string;
  user: {
    name: string;
    username: string;
  };
}

interface UseDestinationImagesReturn {
  images: Record<string, DestinationImage | null>;
  loading: Record<string, boolean>;
  fetchImage: (destination: string) => Promise<void>;
}

export function useDestinationImages(): UseDestinationImagesReturn {
  const [images, setImages] = useState<Record<string, DestinationImage | null>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const fetchImage = useCallback(async (destination: string) => {
    // Don't fetch if already loading or already have image
    if (loading[destination] || images[destination]) {
      return;
    }

    setLoading(prev => ({ ...prev, [destination]: true }));

    try {
      const response = await fetch(
        `/api/images/destination?destination=${encodeURIComponent(destination)}&count=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.length > 0) {
          setImages(prev => ({
            ...prev,
            [destination]: data.data[0]
          }));
        } else {
          setImages(prev => ({
            ...prev,
            [destination]: null
          }));
        }
      } else {
        setImages(prev => ({
          ...prev,
          [destination]: null
        }));
      }
    } catch (error) {
      console.error(`Failed to fetch image for ${destination}:`, error);
      setImages(prev => ({
        ...prev,
        [destination]: null
      }));
    } finally {
      setLoading(prev => ({ ...prev, [destination]: false }));
    }
  }, [loading, images]);

  return {
    images,
    loading,
    fetchImage
  };
}