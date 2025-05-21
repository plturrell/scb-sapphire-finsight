import React, { useRef, useState, useEffect } from 'react';
import { useNetworkAwareLoading, useNetworkLazyLoad } from '@/hooks/useNetworkAwareLoading';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import EnhancedLoadingSpinner from './EnhancedLoadingSpinner';
import { ImageOff, WifiOff, Wifi, AlertCircle } from 'lucide-react';

interface ImageSource {
  high: string;
  medium: string;
  low: string;
  placeholder: string;
}

interface EnhancedNetworkAwareImageProps {
  sources: ImageSource;
  alt: string;
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  aspectRatio?: number; // width/height
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  theme?: 'light' | 'dark';
  blur?: boolean;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  showNetworkIndicator?: boolean;
  fallbackText?: string;
  retryOnError?: boolean;
  useNextImage?: boolean;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
}

/**
 * EnhancedNetworkAwareImage Component
 * A network-aware image component with SCB Beautiful UI styling
 * that adapts loading behavior based on network conditions and device capabilities
 */
export default function EnhancedNetworkAwareImage({
  sources,
  alt,
  className = '',
  priority = false,
  onLoad,
  onError,
  aspectRatio,
  objectFit = 'cover',
  theme: propTheme,
  blur = true,
  rounded = 'md',
  showNetworkIndicator = true,
  fallbackText,
  retryOnError = true,
  useNextImage = false,
  loadingComponent,
  errorComponent,
}: EnhancedNetworkAwareImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { getImageSrc, connection, strategy } = useNetworkAwareLoading();
  const { isVisible, isLoaded } = useNetworkLazyLoad(containerRef);
  const { prefersColorScheme, tier } = useDeviceCapabilities();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  // Determine effective theme based on props or system preference
  const theme = propTheme || prefersColorScheme || 'light';
  
  // Define SCB colors based on theme
  const colors = {
    light: {
      primary: 'rgb(var(--scb-honolulu-blue, 0, 114, 170))', // #0072AA
      background: 'white',
      placeholder: '#f0f0f0',
      text: '#333333',
      textLight: '#666666',
      error: 'rgb(var(--scb-persian-red, 204, 0, 0))', // #CC0000
      border: '#e0e0e0',
      networkIndicator: {
        good: 'rgb(var(--scb-american-green, 33, 170, 71))', // Green
        warning: 'rgb(var(--scb-sun, 255, 204, 0))', // Yellow
        bad: 'rgb(var(--scb-persian-red, 204, 0, 0))' // Red
      }
    },
    dark: {
      primary: 'rgb(0, 142, 211)', // Lighter for dark mode
      background: '#121212', 
      placeholder: '#333333',
      text: '#e0e0e0',
      textLight: '#a0a0a0',
      error: 'rgb(255, 99, 99)', // Lighter red for dark mode
      border: '#333333',
      networkIndicator: {
        good: 'rgb(41, 204, 86)', // Lighter green
        warning: 'rgb(255, 214, 51)', // Lighter yellow
        bad: 'rgb(255, 99, 99)' // Lighter red
      }
    }
  };
  
  const currentColors = colors[theme];

  // Border radius based on rounded prop
  const borderRadius = 
    rounded === 'none' ? '0' :
    rounded === 'sm' ? '4px' :
    rounded === 'md' ? '8px' :
    rounded === 'lg' ? '12px' :
    rounded === 'full' ? '9999px' : '8px';

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

  // Handle image error
  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
    
    // Try a lower quality image on error if retry is enabled
    if (retryOnError && retryCount < maxRetries) {
      setRetryCount(prevCount => prevCount + 1);
      
      // Pick a lower quality source based on retry count
      let retrySrc = '';
      if (retryCount === 0 && sources.medium) {
        retrySrc = sources.medium;
      } else if (sources.low) {
        retrySrc = sources.low;
      } else if (sources.placeholder) {
        retrySrc = sources.placeholder;
      }
      
      if (retrySrc) {
        setCurrentSrc(retrySrc);
        setImageError(false);
        setImageLoading(true);
        return;
      }
    }
    
    onError?.(new Error('Failed to load image'));
  };

  // Retry loading the image
  const retryLoading = () => {
    if (imageError) {
      setImageError(false);
      setImageLoading(true);
      
      // Try with original source again
      const src = getImageSrc(sources);
      setCurrentSrc(src);
    }
  };

  // Preload image if priority
  useEffect(() => {
    if (priority && currentSrc) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = currentSrc;
      link.setAttribute('fetchpriority', 'high');
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [priority, currentSrc]);

  const shouldShowImage = priority || isLoaded || connection.saveData;
  const showPlaceholder = !shouldShowImage || imageLoading;

  const containerStyle: React.CSSProperties = {
    borderRadius,
    border: `1px solid ${currentColors.border}`,
    overflow: 'hidden',
    position: 'relative',
    ...(aspectRatio ? { paddingBottom: `${(1 / aspectRatio) * 100}%` } : {})
  };

  // Get network status color
  const getNetworkStatusColor = () => {
    if (connection.type === 'offline') {
      return currentColors.networkIndicator.bad;
    } else if (connection.saveData || connection.type === 'slow-2g' || connection.type === '2g') {
      return currentColors.networkIndicator.warning;
    } else {
      return currentColors.networkIndicator.good;
    }
  };

  // Network status icon
  const NetworkIcon = connection.type === 'offline' ? WifiOff : 
    (connection.type === 'slow-2g' || connection.type === '2g') ? AlertCircle : Wifi;

  return (
    <div
      ref={containerRef}
      className={`scb-image relative overflow-hidden ${className}`}
      style={containerStyle}
      role="img"
      aria-label={alt}
    >
      {/* Loading placeholder */}
      {showPlaceholder && !loadingComponent && (
        <div 
          className={`absolute inset-0 ${blur ? 'backdrop-blur-sm' : ''}`}
          style={{ 
            backgroundColor: currentColors.placeholder,
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        >
          {imageLoading && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <EnhancedLoadingSpinner size="sm" theme={theme} />
            </div>
          )}
        </div>
      )}
      
      {/* Custom loading component */}
      {showPlaceholder && loadingComponent && (
        <div className="absolute inset-0 flex items-center justify-center">
          {loadingComponent}
        </div>
      )}

      {/* Main image */}
      {shouldShowImage && currentSrc && !imageError && !useNextImage && (
        <img
          src={currentSrc}
          alt={alt}
          className="absolute inset-0 w-full h-full horizon-image"
          style={{ 
            objectFit,
            opacity: imageLoading ? 0 : 1,
            transition: 'opacity 0.3s ease-out',
            filter: theme === 'dark' ? 'brightness(0.9)' : 'none',
          }}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleImageLoad}
          onError={handleImageError}
          fetchPriority={priority ? 'high' : 'auto'}
          quality={Math.round(strategy.compressionQuality * 100)}
        />
      )}

      {/* Error state */}
      {imageError && !errorComponent && (
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: currentColors.placeholder }}
        >
          <div className="text-center p-4">
            <ImageOff
              className="w-12 h-12 mx-auto mb-2"
              style={{ color: currentColors.textLight }}
            />
            <p 
              className="text-sm mb-3"
              style={{ color: currentColors.textLight }}
            >
              {fallbackText || 'Image could not be loaded'}
            </p>
            
            {/* Network status indicator */}
            {showNetworkIndicator && (
              <div 
                className="flex items-center justify-center gap-2 text-xs mb-3"
                style={{ color: currentColors.textLight }}
              >
                <NetworkIcon 
                  className="w-3 h-3"
                  style={{ color: getNetworkStatusColor() }}
                />
                <span>
                  {connection.type === 'offline' ? 'You are offline' : 
                    connection.type === 'slow-2g' || connection.type === '2g' ? 'Slow connection' : 
                    ''}
                </span>
              </div>
            )}
            
            {/* Retry button */}
            {retryOnError && (
              <button
                className="px-3 py-1 text-xs rounded-md"
                style={{ 
                  backgroundColor: currentColors.primary,
                  color: 'white'
                }}
                onClick={retryLoading}
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Custom error component */}
      {imageError && errorComponent && (
        <div className="absolute inset-0">
          {errorComponent}
        </div>
      )}

      {/* Network indicator */}
      {showNetworkIndicator && connection.saveData && (
        <div 
          className="absolute top-2 right-2 text-xs px-2 py-1 rounded-sm flex items-center gap-1"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            color: 'white',
          }}
        >
          <WifiOff className="w-3 h-3" />
          <span>Data Saver</span>
        </div>
      )}
    </div>
  );
}

// Export a hook to create image sources from a single URL
export function useImageSources(baseUrl: string, baseName: string, extension = 'jpg'): ImageSource {
  return {
    high: `${baseUrl}/${baseName}_high.${extension}`,
    medium: `${baseUrl}/${baseName}_medium.${extension}`,
    low: `${baseUrl}/${baseName}_low.${extension}`,
    placeholder: `${baseUrl}/${baseName}_placeholder.${extension}`,
  };
}

// Responsive image with srcset for different screen sizes
export function EnhancedResponsiveNetworkImage({
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
  theme?: 'light' | 'dark';
  blur?: boolean;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  showNetworkIndicator?: boolean;
  fallbackText?: string;
  retryOnError?: boolean;
}) {
  const { connection } = useNetworkAwareLoading();
  const { tier } = useDeviceCapabilities();
  
  // Filter srcSet based on network conditions and device capabilities
  const filteredSrcSet = Object.entries(srcSet)
    .filter(([key, _]) => {
      const width = parseInt(key);
      if (connection.saveData || connection.type === 'slow-2g') {
        return width <= 640;
      } else if (connection.type === '2g') {
        return width <= 800;
      } else if (connection.type === '3g' || tier === 'low') {
        return width <= 1280;
      }
      return true;
    })
    .map(([key, value]) => `${value} ${key}`)
    .join(', ');

  // Get the best source for current conditions
  const sources: ImageSource = {
    high: srcSet['1920w'] || srcSet['1280w'] || srcSet['800w'] || srcSet['640w'] || '',
    medium: srcSet['1280w'] || srcSet['800w'] || srcSet['640w'] || srcSet['320w'] || '',
    low: srcSet['640w'] || srcSet['320w'] || '',
    placeholder: srcSet['320w'] || srcSet['640w'] || '',
  };

  return (
    <EnhancedNetworkAwareImage
      sources={sources}
      alt={alt}
      className={className}
      {...props}
    />
  );
}