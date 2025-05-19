import React, { useRef, useState, useEffect } from 'react';
import { useNetworkAwareLoading, useNetworkLazyLoad } from '@/hooks/useNetworkAwareLoading';
import LoadingSpinner from './LoadingSpinner';

interface ImageSource {
  high: string;
  medium: string;
  low: string;
  placeholder: string;
}

interface NetworkAwareImageProps {
  sources: ImageSource;
  alt: string;
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  aspectRatio?: number; // width/height
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export default function NetworkAwareImage({
  sources,
  alt,
  className = '',
  priority = false,
  onLoad,
  onError,
  aspectRatio,
  objectFit = 'cover',
}: NetworkAwareImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { getImageSrc, connection } = useNetworkAwareLoading();
  const { isVisible, isLoaded } = useNetworkLazyLoad(containerRef);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');

  // Determine which image to load
  useEffect(() => {
    const src = getImageSrc(sources);
    setCurrentSrc(src);
  }, [sources, getImageSrc]);

  // Handle image loading
  const handleImageLoad = () => {
    setImageLoading(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
    onError?.(new Error('Failed to load image'));
  };

  // Preload image if priority
  useEffect(() => {
    if (priority && currentSrc) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = currentSrc;
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [priority, currentSrc]);

  const shouldShowImage = priority || isLoaded || connection.saveData;
  const showPlaceholder = !shouldShowImage || imageLoading;

  const containerStyle: React.CSSProperties = aspectRatio
    ? { paddingBottom: `${(1 / aspectRatio) * 100}%` }
    : {};

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={containerStyle}
    >
      {/* Placeholder/Loading state */}
      {showPlaceholder && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse">
          {imageLoading && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <LoadingSpinner size="sm" />
            </div>
          )}
        </div>
      )}

      {/* Main image */}
      {shouldShowImage && currentSrc && !imageError && (
        <img
          src={currentSrc}
          alt={alt}
          className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
            imageLoading ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ objectFit }}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}

      {/* Error state */}
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-center p-4">
            <svg
              className="w-12 h-12 mx-auto text-gray-400 mb-2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-500">Failed to load image</p>
          </div>
        </div>
      )}

      {/* Network indicator */}
      {connection.saveData && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          Data Saver Mode
        </div>
      )}
    </div>
  );
}

// Export a hook to create image sources from a single URL
export function useImageSources(baseUrl: string, baseName: string): ImageSource {
  return {
    high: `${baseUrl}/${baseName}_high.jpg`,
    medium: `${baseUrl}/${baseName}_medium.jpg`,
    low: `${baseUrl}/${baseName}_low.jpg`,
    placeholder: `${baseUrl}/${baseName}_placeholder.jpg`,
  };
}

// Responsive image with srcset for different screen sizes
export function ResponsiveNetworkImage({
  srcSet,
  alt,
  className = '',
  sizes = '100vw',
  ...props
}: {
  srcSet: { [key: string]: string }; // { '320w': 'url', '640w': 'url', etc }
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  aspectRatio?: number;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}) {
  const { connection } = useNetworkAwareLoading();
  
  // Filter srcSet based on network conditions
  const filteredSrcSet = Object.entries(srcSet)
    .filter(([key, _]) => {
      const width = parseInt(key);
      if (connection.saveData || connection.type === 'slow-2g') {
        return width <= 640;
      } else if (connection.type === '2g' || connection.type === '3g') {
        return width <= 1024;
      }
      return true;
    })
    .map(([key, value]) => `${value} ${key}`)
    .join(', ');

  // Get the best source for current conditions
  const sources: ImageSource = {
    high: srcSet['1920w'] || srcSet['1280w'] || srcSet['640w'] || '',
    medium: srcSet['1024w'] || srcSet['640w'] || srcSet['320w'] || '',
    low: srcSet['640w'] || srcSet['320w'] || '',
    placeholder: srcSet['320w'] || srcSet['640w'] || '',
  };

  return (
    <NetworkAwareImage
      sources={sources}
      alt={alt}
      className={className}
      {...props}
    />
  );
}