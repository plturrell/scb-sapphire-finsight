import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useNetworkAwareLoading, useNetworkLazyLoad } from '@/hooks/useNetworkAwareLoading';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import { useOptimizedImageLoading, useIOSOptimizations } from '@/lib/performance';
import EnhancedLoadingSpinner from './EnhancedLoadingSpinner';
import { ImageOff, WifiOff, Wifi, AlertCircle, LifeBuoy } from 'lucide-react';

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
  
  // Enhanced options
  blurhash?: string;
  fadeInDuration?: number;
  placeholderColor?: string;
  disableAnimation?: boolean;
  quality?: 'low' | 'medium' | 'high' | 'auto';
  optimizationLevel?: 'aggressive' | 'balanced' | 'minimal' | 'none';
  crossOrigin?: 'anonymous' | 'use-credentials';
  draggable?: boolean;
  disableContextMenu?: boolean;
  formats?: ('webp' | 'avif' | 'jpg' | 'png')[];
  loadingStrategy?: 'lazy' | 'eager' | 'progressive' | 'deferred';
  usePlatformOptimizations?: boolean;
}

/**
 * EnhancedNetworkAwareImage Component
 * A network-aware image component with SCB Beautiful UI styling
 * that adapts loading behavior based on network conditions and device capabilities
 * Optimized for iOS/iPadOS with advanced caching, progressive loading, and performance adaptation
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
  // Enhanced options
  blurhash,
  fadeInDuration = 300,
  placeholderColor,
  disableAnimation = false,
  quality = 'auto',
  optimizationLevel = 'balanced',
  crossOrigin,
  draggable = false,
  disableContextMenu = false,
  formats = ['webp', 'jpg'],
  loadingStrategy = 'lazy',
  usePlatformOptimizations = true,
}: EnhancedNetworkAwareImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Basic loading hooks
  const { getImageSrc, connection, strategy } = useNetworkAwareLoading();
  const { isVisible, isLoaded } = useNetworkLazyLoad(containerRef);
  const { deviceType, prefersColorScheme, tier, pixelRatio, colorGamut } = useDeviceCapabilities();
  
  // iOS optimizations
  const { optimizations, isIOSDevice } = useIOSOptimizations();
  
  // Determine effective loading priority based on device and user preference
  const effectivePriority = useMemo(() => {
    if (priority) return 'high';
    return optimizationLevel === 'aggressive' ? 'low' : 
           optimizationLevel === 'balanced' ? 'medium' : 'high';
  }, [priority, optimizationLevel]);
  
  // Determine formats based on device support
  const effectiveFormats = useMemo(() => {
    // iOS 16+ and modern Safari support AVIF
    if (isIOSDevice && formats.includes('avif') && 
        /iPhone OS 16_|iPad OS 16_|Version\/16/.test(navigator.userAgent)) {
      return ['avif', ...formats.filter(f => f !== 'avif')];
    }
    return formats;
  }, [formats, isIOSDevice]);
  
  // Enhanced image loading with iOS optimizations
  const optimizedSrc = useMemo(() => {
    const baseImageSrc = sources.high || sources.medium || sources.low || sources.placeholder;
    
    // Override with specific quality version if available
    const qualityOverride = quality === 'high' ? sources.high : 
                          quality === 'medium' ? sources.medium :
                          quality === 'low' ? sources.low : undefined;
                          
    // If specific quality was requested and available, use it directly                    
    if (qualityOverride) return qualityOverride;
    
    // Otherwise determine best source based on device and network conditions
    if (optimizations.useLowResTextures || connection.saveData) {
      return sources.low || sources.medium || sources.placeholder;
    } else if (tier === 'low' || connection.type === 'slow-2g' || connection.type === '2g') {
      return sources.medium || sources.low || sources.placeholder;
    } else if (pixelRatio >= 2 && tier === 'high') {
      return sources.high || sources.medium;
    }
    
    // Default case
    return baseImageSrc;
  }, [sources, connection, tier, pixelRatio, quality, optimizations]);
  
  // Use enhanced image loading hook
  const { 
    imageSrc, 
    blurDataURL,
    isLoaded: isImageLoaded, 
    loadingProgress,
    error, 
    handleImageLoad: onOptimizedImageLoad, 
    handleImageError: onOptimizedImageError,
    getImageStyle,
    getPlaceholderStyle,
    lowPowerMode
  } = useOptimizedImageLoading(
    optimizedSrc,
    sources.placeholder,
    {
      preload: priority,
      lazyLoad: loadingStrategy === 'lazy',
      priority: effectivePriority,
      formats: effectiveFormats,
      responsive: true,
      fadeDuration,
      blurhash,
      placeholder: blur ? 'blur' : (placeholderColor ? 'color' : 'none'),
      placeholderColor: placeholderColor || 
                       (theme === 'dark' ? '#333333' : '#f0f0f0'),
      crossOrigin
    }
  );
  
  // Main component states
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [loadingPhase, setLoadingPhase] = useState<'placeholder' | 'low-quality' | 'high-quality'>('placeholder');
  const maxRetries = 2;

  // Determine effective theme based on props or system preference
  const theme = propTheme || prefersColorScheme || 'light';
  
  // Define SCB colors based on theme
  const colors = {
    light: {
      primary: 'rgb(var(--scb-honolulu-blue, 0, 114, 170))', // #0072AA
      background: 'white',
      placeholder: placeholderColor || '#f0f0f0',
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
      placeholder: placeholderColor || '#333333',
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

  // Handle image loading
  const handleImageLoad = () => {
    setImageLoading(false);
    setLoadingPhase('high-quality');
    onOptimizedImageLoad();
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
        setLoadingPhase('low-quality');
      } else if (sources.low) {
        retrySrc = sources.low;
        setLoadingPhase('low-quality');
      } else if (sources.placeholder) {
        retrySrc = sources.placeholder;
        setLoadingPhase('placeholder');
      }
      
      if (retrySrc) {
        setImageError(false);
        setImageLoading(true);
        return;
      }
    }
    
    onOptimizedImageError(new Error('Failed to load image'));
    onError?.(new Error('Failed to load image'));
  };

  // Retry loading the image
  const retryLoading = () => {
    if (imageError) {
      setImageError(false);
      setImageLoading(true);
      setLoadingPhase('placeholder');
      setRetryCount(0);
    }
  };

  // Apply iOS-specific optimizations
  useEffect(() => {
    if (!imageRef.current || !isIOSDevice || !usePlatformOptimizations) return;
    
    // Apply iOS Safari-specific optimizations for better performance
    const img = imageRef.current;
    
    // Apply GPU acceleration for smoother animations on iOS
    if (!disableAnimation) {
      img.style.transform = 'translateZ(0)';
      img.style.backfaceVisibility = 'hidden';
    }
    
    // Apply system-level optimizations based on device state
    if (optimizations.reducedAnimations || lowPowerMode) {
      img.style.transition = 'none'; // Disable transitions in low power mode
    }
    
    // Force hardware acceleration for images on iOS
    img.style.willChange = 'transform';
    
    return () => {
      // Clean up styles
      img.style.willChange = 'auto';
    };
  }, [isIOSDevice, optimizations, disableAnimation, lowPowerMode, usePlatformOptimizations]);

  // Determine if we should show image or placeholder
  const shouldShowImage = priority || isLoaded || connection.saveData || loadingStrategy === 'eager';
  const showPlaceholder = !isImageLoaded || imageLoading;

  // Apply iOS optimizations to container style
  const containerStyle: React.CSSProperties = {
    borderRadius,
    border: `1px solid ${currentColors.border}`,
    overflow: 'hidden',
    position: 'relative',
    ...(aspectRatio ? { paddingBottom: `${(1 / aspectRatio) * 100}%` } : {}),
    // iOS optimizations
    ...(isIOSDevice && usePlatformOptimizations ? {
      WebkitTapHighlightColor: 'transparent', // Remove tap highlight on iOS
      WebkitTouchCallout: disableContextMenu ? 'none' : 'default', // Disable context menu if requested
      transform: disableAnimation ? 'none' : 'translateZ(0)', // Force GPU acceleration
    } : {})
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

  // Determine loading indicator based on device capabilities and loading progress
  const LoadingIndicator = () => {
    // Show progress bar on iOS for better UX
    if (isIOSDevice && usePlatformOptimizations && loadingProgress > 0 && loadingProgress < 100) {
      return (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 bg-opacity-30">
          <div 
            className="h-full bg-white"
            style={{ 
              width: `${loadingProgress}%`,
              transition: 'width 0.3s ease-out'
            }}
          />
        </div>
      );
    }
    
    // Default spinner for other devices
    return <EnhancedLoadingSpinner size="sm" theme={theme} />;
  };

  // Power mode indicator for iOS
  const PowerModeIndicator = () => {
    if (!isIOSDevice || !usePlatformOptimizations || !lowPowerMode) return null;
    
    return (
      <div 
        className="absolute bottom-2 left-2 text-xs px-1.5 py-0.5 rounded flex items-center gap-1"
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          color: 'white',
        }}
      >
        <LifeBuoy className="w-2.5 h-2.5" />
        <span className="text-[10px]">Low Power</span>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`scb-image relative overflow-hidden ${className}`}
      style={containerStyle}
      role="img"
      aria-label={alt}
      onContextMenu={disableContextMenu ? e => e.preventDefault() : undefined}
    >
      {/* Blur hash placeholder */}
      {(showPlaceholder || !isImageLoaded) && blurDataURL && (
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${blurDataURL})`,
            filter: 'blur(20px)',
            transform: 'scale(1.2)',
            opacity: isImageLoaded ? 0 : 1,
            transition: `opacity ${fadeInDuration}ms ease-out`,
          }}
        />
      )}
      
      {/* Color placeholder */}
      {(showPlaceholder || !isImageLoaded) && !blurDataURL && (
        <div 
          className={`absolute inset-0 ${blur ? 'backdrop-blur-sm' : ''}`}
          style={{ 
            backgroundColor: currentColors.placeholder,
            opacity: isImageLoaded ? 0 : 1,
            transition: `opacity ${fadeInDuration}ms ease-out`,
            animation: disableAnimation ? 'none' : 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
      )}
      
      {/* Loading indicator */}
      {imageLoading && !imageError && !loadingComponent && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingIndicator />
        </div>
      )}
      
      {/* Custom loading component */}
      {showPlaceholder && loadingComponent && (
        <div className="absolute inset-0 flex items-center justify-center">
          {loadingComponent}
        </div>
      )}

      {/* Main image with iOS optimizations */}
      {shouldShowImage && imageSrc && !imageError && !useNextImage && (
        <img
          ref={imageRef}
          src={imageSrc}
          alt={alt}
          className="absolute inset-0 w-full h-full horizon-image"
          style={{ 
            ...getImageStyle(),
            objectFit,
            filter: theme === 'dark' ? 'brightness(0.9)' : 'none',
            // iOS optimizations
            ...(isIOSDevice && usePlatformOptimizations ? {
              WebkitBackfaceVisibility: 'hidden',
              WebkitPerspective: '1000',
              WebkitTransform: 'translate3d(0,0,0)',
              WebkitTransformStyle: 'preserve-3d',
            } : {})
          }}
          loading={priority ? 'eager' : 'lazy'}
          decoding={isIOSDevice ? 'sync' : 'async'} // Use sync decoding on iOS for better perceived performance
          onLoad={handleImageLoad}
          onError={handleImageError}
          fetchPriority={priority ? 'high' : 'auto'}
          crossOrigin={crossOrigin}
          draggable={draggable}
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

      {/* Network indicators */}
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
      
      {/* Loading progress indicator (when visible) */}
      {shouldShowImage && loadingProgress > 0 && loadingProgress < 100 && !imageLoading && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-200 bg-opacity-30">
          <div 
            className="h-full"
            style={{ 
              width: `${loadingProgress}%`,
              backgroundColor: currentColors.primary,
              transition: 'width 0.3s ease-out'
            }}
          />
        </div>
      )}
      
      {/* iOS low power mode indicator */}
      <PowerModeIndicator />
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