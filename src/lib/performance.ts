/**
 * Performance optimization utilities for SCB Beautiful UI
 * 
 * This module provides utilities for optimizing app performance,
 * including component memoization, network-aware loading,
 * iOS/iPadOS optimizations, and bundle size optimization.
 */

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useDeviceCapabilities } from '../hooks/useDeviceCapabilities';

// Connection speed types
export type ConnectionSpeed = 'slow' | 'medium' | 'fast' | 'unknown';

// Device performance tiers
export type DeviceTier = 'low' | 'medium' | 'high';

// Platform-specific feature support
export interface PlatformFeatures {
  supportsHaptics: boolean;
  supportsP3ColorSpace: boolean;
  supportsHDR: boolean;
  supportsPencil: boolean;
  supportsForceTouch: boolean;
  supportsBiometricAuth: boolean;
}

// Enhanced connection quality detection
export function useNetworkStatus() {
  const [connectionSpeed, setConnectionSpeed] = useState<ConnectionSpeed>('unknown');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [saveDataEnabled, setSaveDataEnabled] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [latency, setLatency] = useState<number | null>(null);
  const [bandwidth, setBandwidth] = useState<number | null>(null);
  const [networkType, setNetworkType] = useState<string | null>(null);

  // Detect if we're in low power mode (iOS)
  const [lowPowerMode, setLowPowerMode] = useState<boolean>(false);
  
  useEffect(() => {
    // Check if we have network information API
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      
      // Function to update connection status
      const updateConnectionStatus = () => {
        setIsOnline(navigator.onLine);
        setLastUpdated(new Date());
        
        if (!connection) return;
        
        // Check for save-data mode
        if ('saveData' in connection) {
          setSaveDataEnabled(connection.saveData);
        }
        
        // Store raw network type
        if ('type' in connection) {
          setNetworkType(connection.type);
        }
        
        // Store bandwidth data if available
        if ('downlink' in connection) {
          setBandwidth(connection.downlink);
        }
        
        // Store latency data if available
        if ('rtt' in connection) {
          setLatency(connection.rtt);
        }
        
        // Determine connection speed
        if ('effectiveType' in connection) {
          switch (connection.effectiveType) {
            case 'slow-2g':
            case '2g':
              setConnectionSpeed('slow');
              break;
            case '3g':
              setConnectionSpeed('medium');
              break;
            case '4g':
              setConnectionSpeed('fast');
              break;
            default:
              setConnectionSpeed('unknown');
          }
        } else if ('downlink' in connection) {
          // Fallback to downlink speed in Mbps
          if (connection.downlink < 1) {
            setConnectionSpeed('slow');
          } else if (connection.downlink < 5) {
            setConnectionSpeed('medium');
          } else {
            setConnectionSpeed('fast');
          }
        }
      };
      
      // Initial update
      updateConnectionStatus();
      
      // Detect low power mode on iOS (if available)
      if (typeof window !== 'undefined' && 'webkit' in window) {
        const powerModeMediaQuery = window.matchMedia('(prefers-reduced-power: reduce)');
        setLowPowerMode(powerModeMediaQuery.matches);
        
        // Listen for changes to power mode
        powerModeMediaQuery.addEventListener('change', (e) => {
          setLowPowerMode(e.matches);
        });
      }
      
      // Periodically estimate network latency
      const pingInterval = setInterval(() => {
        if (navigator.onLine) {
          const start = Date.now();
          // Fetch a tiny resource to measure latency
          fetch('/api/ping', { 
            method: 'HEAD',
            cache: 'no-store' 
          })
          .then(() => {
            const latency = Date.now() - start;
            setLatency(latency);
          })
          .catch(() => {
            // Failed ping, might be offline
          });
        }
      }, 60000); // Check every minute
      
      // Add event listeners
      window.addEventListener('online', () => setIsOnline(true));
      window.addEventListener('offline', () => setIsOnline(false));
      
      // Add connection change listener if available
      if (connection) {
        connection.addEventListener('change', updateConnectionStatus);
      }
      
      // Cleanup
      return () => {
        window.removeEventListener('online', () => setIsOnline(true));
        window.removeEventListener('offline', () => setIsOnline(false));
        
        if (connection) {
          connection.removeEventListener('change', updateConnectionStatus);
        }
        
        clearInterval(pingInterval);
      };
    } else {
      // Fallback if we don't have the Network Information API
      setConnectionSpeed('unknown');
      setIsOnline(navigator.onLine);
      
      window.addEventListener('online', () => setIsOnline(true));
      window.addEventListener('offline', () => setIsOnline(false));
      
      return () => {
        window.removeEventListener('online', () => setIsOnline(true));
        window.removeEventListener('offline', () => setIsOnline(false));
      };
    }
  }, []);
  
  return { 
    connectionSpeed, 
    isOnline, 
    saveDataEnabled, 
    lastUpdated,
    latency,
    bandwidth,
    networkType,
    lowPowerMode
  };
}

// Image format types for responsive loading
export type ImageFormat = 'jpg' | 'png' | 'webp' | 'avif' | 'heic';

// Responsive image sizes configuration
export interface ResponsiveImageSizes {
  small: number;  // Small screen size (e.g., 320px)
  medium: number; // Medium screen size (e.g., 768px)
  large: number;  // Large screen size (e.g., 1024px)
  xlarge: number; // Extra large screen size (e.g., 1440px)
  retina: boolean; // Whether to use 2x images for retina displays
}

// Hook for optimizing image loading based on network conditions and device capabilities
export function useOptimizedImageLoading(
  src: string,
  lowQualitySrc?: string,
  options?: {
    preload?: boolean;
    lazyLoad?: boolean;
    priority?: 'high' | 'medium' | 'low';
    formats?: ImageFormat[];
    responsive?: boolean | ResponsiveImageSizes;
    fadeDuration?: number;
    blurhash?: string;
    placeholder?: 'blur' | 'color' | 'none';
    placeholderColor?: string;
    crossOrigin?: 'anonymous' | 'use-credentials';
  }
) {
  const { connectionSpeed, saveDataEnabled, lowPowerMode, bandwidth } = useNetworkStatus();
  const { deviceType, tier, pixelRatio, colorGamut } = useDeviceCapabilities();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [blurDataURL, setBlurDataURL] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const imageRef = useRef<HTMLImageElement | null>(null);
  
  // Default options
  const opts = {
    preload: false,
    lazyLoad: true,
    priority: 'medium',
    formats: ['webp', 'jpg'] as ImageFormat[],
    responsive: true,
    fadeDuration: 200,
    placeholder: 'blur' as 'blur' | 'color' | 'none',
    placeholderColor: '#f0f0f0',
    crossOrigin: undefined as 'anonymous' | 'use-credentials' | undefined,
    ...options
  };
  
  // Determine if we should use the low quality source
  const shouldUseLowQuality = useCallback(() => {
    if (!lowQualitySrc) return false;
    if (saveDataEnabled) return true;
    if (lowPowerMode) return true;
    if (connectionSpeed === 'slow') return true;
    if (connectionSpeed === 'medium' && opts.priority === 'low') return true;
    if (bandwidth && bandwidth < 1.5) return true; // Less than 1.5 Mbps
    if (tier === 'low') return true;
    
    return false;
  }, [
    connectionSpeed, 
    lowQualitySrc, 
    saveDataEnabled, 
    opts.priority, 
    lowPowerMode,
    bandwidth,
    tier
  ]);
  
  // Generate optimized image URL based on device capabilities
  const getOptimizedImageUrl = useCallback((url: string): string => {
    if (!url) return url;
    
    // Skip optimization for data URLs, blob URLs, or SVGs
    if (url.startsWith('data:') || url.startsWith('blob:') || url.endsWith('.svg')) {
      return url;
    }
    
    // Parse URL to modify it
    let optimizedUrl = url;
    const urlObj = new URL(url, window.location.origin);
    const isInternalImage = urlObj.hostname === window.location.hostname;
    
    // For internal images, we can apply our optimization parameters
    if (isInternalImage) {
      // Clear any existing params we might override
      ['width', 'quality', 'format', 'dpr'].forEach(param => {
        urlObj.searchParams.delete(param);
      });
      
      // Apply responsive sizing
      if (opts.responsive) {
        let width: number;
        
        // Calculate width based on device type
        if (typeof opts.responsive === 'object') {
          // Use custom responsive sizes
          switch(deviceType) {
            case 'mobile':
              width = opts.responsive.small;
              break;
            case 'tablet':
              width = opts.responsive.medium;
              break;
            default:
              width = opts.responsive.large;
              break;
          }
          
          // Adjust for retina if requested
          if (opts.responsive.retina && pixelRatio >= 2) {
            width = width * Math.min(pixelRatio, 2); // Cap at 2x
          }
        } else {
          // Use default sizes
          switch(deviceType) {
            case 'mobile':
              width = 640;
              break;
            case 'tablet':
              width = 1024;
              break;
            default:
              width = 1440;
              break;
          }
          
          // Adjust for device pixel ratio (for retina displays)
          if (pixelRatio > 1) {
            width = width * Math.min(pixelRatio, 2); // Cap at 2x
          }
        }
        
        urlObj.searchParams.set('width', width.toString());
      }
      
      // Set quality based on connection and device tier
      let quality: number;
      if (shouldUseLowQuality()) {
        quality = 60; // Lower quality for poor connections or low-power mode
      } else if (tier === 'high' && connectionSpeed === 'fast') {
        quality = 90; // High quality for good devices and connections
      } else {
        quality = 75; // Balanced quality for most cases
      }
      urlObj.searchParams.set('quality', quality.toString());
      
      // Determine best format
      // Check browser support and connection speed
      if (opts.formats.includes('avif') && hasFormatSupport('avif') && 
          (connectionSpeed === 'fast' || !shouldUseLowQuality())) {
        urlObj.searchParams.set('format', 'avif');
      } else if (opts.formats.includes('webp') && hasFormatSupport('webp')) {
        urlObj.searchParams.set('format', 'webp');
      } else if (opts.formats.includes('jpg')) {
        urlObj.searchParams.set('format', 'jpg');
      }
      
      // Set device pixel ratio for responsive images
      if (pixelRatio > 1 && opts.responsive) {
        urlObj.searchParams.set('dpr', Math.min(pixelRatio, 2).toString());
      }
      
      optimizedUrl = urlObj.toString();
      
      // Special handling for iOS devices - add cache buster for improved caching behavior
      const isAppleDevice = /iPhone|iPad|iPod|Mac/.test(navigator.userAgent);
      if (isAppleDevice) {
        // Add a timestamp that changes every hour, to improve caching behavior on iOS
        const hourTimestamp = Math.floor(Date.now() / (1000 * 60 * 60));
        optimizedUrl += (optimizedUrl.includes('?') ? '&' : '?') + '_t=' + hourTimestamp;
      }
    }
    
    return optimizedUrl;
  }, [
    deviceType, 
    pixelRatio, 
    shouldUseLowQuality, 
    opts.responsive, 
    opts.formats,
    tier,
    connectionSpeed
  ]);
  
  // Check if the browser supports a specific image format
  const hasFormatSupport = (format: ImageFormat): boolean => {
    if (typeof document === 'undefined') return false;
    
    switch (format) {
      case 'webp':
        return document.createElement('canvas')
          .toDataURL('image/webp')
          .indexOf('data:image/webp') === 0;
      case 'avif':
        return (self as any).createImageBitmap !== undefined;
      case 'heic':
        // Currently no reliable way to detect HEIC support in browsers
        return false;
      default:
        return true;
    }
  };
  
  // Generate blur hash placeholder if requested
  useEffect(() => {
    if (opts.placeholder === 'blur' && opts.blurhash) {
      import('blurhash').then(({ decode }) => {
        // Decode blurhash to pixels
        const pixels = decode(opts.blurhash as string, 32, 32);
        
        // Create canvas to draw pixels
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Create ImageData and set pixels
          const imageData = ctx.createImageData(32, 32);
          imageData.data.set(pixels);
          ctx.putImageData(imageData, 0, 0);
          
          // Convert to data URL
          setBlurDataURL(canvas.toDataURL());
        }
      }).catch(() => {
        // Failed to load blurhash library
        setBlurDataURL(null);
      });
    }
  }, [opts.placeholder, opts.blurhash]);
  
  // Load the image with progress tracking for iOS devices
  useEffect(() => {
    if (opts.lazyLoad) {
      // Set up intersection observer for lazy loading
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              // When element comes into view, load the appropriate image
              const baseImgSrc = shouldUseLowQuality() ? lowQualitySrc : src;
              const optimizedSrc = getOptimizedImageUrl(baseImgSrc || src);
              setImageSrc(optimizedSrc);
              observer.disconnect();
            }
          });
        },
        { 
          rootMargin: '200px', // Load when within 200px of viewport
          threshold: 0.01 // Trigger when at least 1% is visible
        }
      );
      
      // Create a reference element to observe
      if (imageRef.current) {
        observer.observe(imageRef.current);
      } else {
        const element = document.createElement('div');
        observer.observe(element);
      }
      
      return () => {
        observer.disconnect();
      };
    } else {
      // No lazy loading, load immediately
      const baseImgSrc = shouldUseLowQuality() ? lowQualitySrc : src;
      const optimizedSrc = getOptimizedImageUrl(baseImgSrc || src);
      setImageSrc(optimizedSrc);
    }
  }, [src, lowQualitySrc, shouldUseLowQuality, opts.lazyLoad, getOptimizedImageUrl]);
  
  // Preload high quality version after low quality is loaded
  useEffect(() => {
    if (isLoaded && lowQualitySrc && 
        imageSrc === getOptimizedImageUrl(lowQualitySrc) && 
        opts.preload) {
      // Preload the high quality image after low quality is displayed
      const highQualitySrc = getOptimizedImageUrl(src);
      
      // Support progress tracking on iOS Safari
      const xhr = new XMLHttpRequest();
      xhr.open('GET', highQualitySrc, true);
      xhr.responseType = 'blob';
      
      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setLoadingProgress(progress);
        }
      };
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          const blobUrl = URL.createObjectURL(xhr.response);
          // Load the blob into an image to ensure it's cached
          const img = new Image();
          img.onload = () => {
            // Now set the high quality image
            setImageSrc(highQualitySrc);
            setLoadingProgress(100);
            // Revoke the blob URL to free memory
            URL.revokeObjectURL(blobUrl);
          };
          img.src = blobUrl;
        }
      };
      
      xhr.send();
    }
  }, [isLoaded, imageSrc, lowQualitySrc, src, opts.preload, getOptimizedImageUrl]);
  
  // Handle image load/error
  const handleImageLoad = useCallback(() => {
    setIsLoaded(true);
    setError(null);
    setLoadingProgress(100);
  }, []);
  
  const handleImageError = useCallback((e: any) => {
    setError(new Error('Failed to load image'));
    
    // If optimized image failed, try original source
    if (imageSrc !== src && lowQualitySrc && imageSrc !== lowQualitySrc) {
      setImageSrc(src);
    }
    // If high quality failed, try low quality if available
    else if (imageSrc === src && lowQualitySrc) {
      setImageSrc(lowQualitySrc);
    }
  }, [imageSrc, src, lowQualitySrc]);
  
  // Get image style with placeholder and fade-in effect
  const getImageStyle = useCallback(() => {
    const baseStyle: React.CSSProperties = {
      opacity: isLoaded ? 1 : 0,
      transition: `opacity ${opts.fadeDuration}ms ease-in-out`,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      objectPosition: 'center',
    };
    
    // iOS-specific improvements for image rendering
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    if (isIOS) {
      baseStyle.WebkitBackfaceVisibility = 'hidden';
      baseStyle.transform = 'translateZ(0)';
    }
    
    return baseStyle;
  }, [isLoaded, opts.fadeDuration]);
  
  // Get placeholder style
  const getPlaceholderStyle = useCallback((): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: isLoaded ? 0 : 1,
      transition: `opacity ${opts.fadeDuration}ms ease-in-out`,
    };
    
    if (opts.placeholder === 'blur' && blurDataURL) {
      baseStyle.backgroundImage = `url(${blurDataURL})`;
      baseStyle.backgroundSize = 'cover';
      baseStyle.backgroundPosition = 'center';
      baseStyle.filter = 'blur(20px)';
      baseStyle.transform = 'scale(1.2)';
    } else if (opts.placeholder === 'color') {
      baseStyle.backgroundColor = opts.placeholderColor;
    }
    
    return baseStyle;
  }, [isLoaded, opts.fadeDuration, opts.placeholder, blurDataURL, opts.placeholderColor]);
  
  return { 
    imageSrc, 
    blurDataURL,
    isLoaded, 
    loadingProgress,
    error, 
    imageRef,
    handleImageLoad, 
    handleImageError, 
    getImageStyle,
    getPlaceholderStyle,
    connectionSpeed, 
    saveDataEnabled,
    lowPowerMode,
    deviceType,
    pixelRatio
  };
}

// Hook for data fetching with network awareness
export function useNetworkAwareData<T>(
  fetcher: () => Promise<T>,
  options?: {
    initialData?: T;
    retryCount?: number;
    retryDelay?: number;
    cacheTime?: number;
    revalidateOnFocus?: boolean;
    revalidateOnReconnect?: boolean;
    dedupingInterval?: number;
  }
) {
  const { connectionSpeed, isOnline } = useNetworkStatus();
  const [data, setData] = useState<T | undefined>(options?.initialData);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cacheExpiryRef = useRef<Date | null>(null);
  const lastFetchTimeRef = useRef<Date | null>(null);
  
  // Default options
  const opts = {
    retryCount: 3,
    retryDelay: 1000,
    cacheTime: 5 * 60 * 1000, // 5 minutes
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000, // 2 seconds
    ...options
  };
  
  // Fetch data function with retry logic
  const fetchData = useCallback(async (shouldDedup = true) => {
    // Skip fetch if offline
    if (!isOnline) {
      setError(new Error('You are offline'));
      setIsLoading(false);
      return;
    }
    
    // Skip if we're within the deduping interval
    if (shouldDedup && lastFetchTimeRef.current) {
      const now = new Date();
      const timeSinceLastFetch = now.getTime() - lastFetchTimeRef.current.getTime();
      if (timeSinceLastFetch < opts.dedupingInterval) {
        return;
      }
    }
    
    // Check if cache is still valid
    if (data && cacheExpiryRef.current) {
      const now = new Date();
      if (now < cacheExpiryRef.current) {
        setIsLoading(false);
        return;
      }
    }
    
    // Start loading
    setIsLoading(true);
    lastFetchTimeRef.current = new Date();
    
    try {
      const result = await fetcher();
      setData(result);
      setError(null);
      
      // Set cache expiry
      const expiry = new Date();
      expiry.setTime(expiry.getTime() + opts.cacheTime);
      cacheExpiryRef.current = expiry;
      
      // Reset retry count on success
      retryCountRef.current = 0;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      
      // Retry logic
      if (retryCountRef.current < opts.retryCount) {
        // Exponential backoff
        const delay = opts.retryDelay * Math.pow(2, retryCountRef.current);
        
        // Clear any existing retry timer
        if (retryTimerRef.current) {
          clearTimeout(retryTimerRef.current);
        }
        
        // Set up retry
        retryTimerRef.current = setTimeout(() => {
          retryCountRef.current++;
          fetchData(false); // Skip deduping for retries
        }, delay);
      }
    } finally {
      setIsLoading(false);
    }
  }, [data, fetcher, isOnline, opts.cacheTime, opts.dedupingInterval, opts.retryCount, opts.retryDelay]);
  
  // Initial data fetch
  useEffect(() => {
    fetchData();
    
    // Clean up retry timer
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, [fetchData]);
  
  // Set up revalidation on focus
  useEffect(() => {
    if (!opts.revalidateOnFocus) return;
    
    const handleFocus = () => {
      fetchData();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchData, opts.revalidateOnFocus]);
  
  // Set up revalidation on reconnect
  useEffect(() => {
    if (!opts.revalidateOnReconnect) return;
    
    const handleOnline = () => {
      fetchData();
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [fetchData, opts.revalidateOnReconnect]);
  
  // Function to manually trigger a refetch
  const refetch = useCallback(() => {
    retryCountRef.current = 0; // Reset retry count
    return fetchData(false); // Skip deduping for manual refetch
  }, [fetchData]);
  
  return { 
    data, 
    error, 
    isLoading, 
    connectionSpeed, 
    isOnline,
    refetch 
  };
}

/**
 * Utilities for component optimization
 */

// Throttle function execution
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let lastFunc: NodeJS.Timeout;
  let lastRan: number;
  
  return function(...args: Parameters<T>): ReturnType<T> | undefined {
    if (!lastRan) {
      func(...args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function() {
        if (Date.now() - lastRan >= limit) {
          func(...args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
    return undefined;
  };
}

// Debounce function execution
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function(...args: Parameters<T>): void {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Hook to detect device memory and CPU cores
export function useDeviceCapabilities() {
  const [deviceMemory, setDeviceMemory] = useState<number | null>(null);
  const [cpuCores, setCpuCores] = useState<number | null>(null);
  const [isLowEndDevice, setIsLowEndDevice] = useState<boolean>(false);
  
  useEffect(() => {
    // Check device memory
    if ('deviceMemory' in navigator) {
      setDeviceMemory((navigator as any).deviceMemory);
    }
    
    // Check CPU cores
    if ('hardwareConcurrency' in navigator) {
      setCpuCores(navigator.hardwareConcurrency);
    }
    
    // Determine if it's a low-end device
    if (
      (('deviceMemory' in navigator) && (navigator as any).deviceMemory < 4) ||
      (('hardwareConcurrency' in navigator) && navigator.hardwareConcurrency < 4)
    ) {
      setIsLowEndDevice(true);
    }
  }, []);
  
  return { deviceMemory, cpuCores, isLowEndDevice };
}

// Lazy image observer for automatic lazy loading
export function useLazyImageObserver() {
  const [elements, setElements] = useState<Map<Element, (isVisible: boolean) => void>>(new Map());
  
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const callback = elements.get(entry.target);
          if (callback) {
            callback(entry.isIntersecting);
          }
        });
      },
      { rootMargin: '200px' }
    );
    
    // Observe all elements
    elements.forEach((_, element) => {
      observer.observe(element);
    });
    
    return () => {
      observer.disconnect();
    };
  }, [elements]);
  
  // Function to register an element
  const registerElement = useCallback((element: Element, callback: (isVisible: boolean) => void) => {
    setElements(prev => {
      const newMap = new Map(prev);
      newMap.set(element, callback);
      return newMap;
    });
    
    // Return function to unregister
    return () => {
      setElements(prev => {
        const newMap = new Map(prev);
        newMap.delete(element);
        return newMap;
      });
    };
  }, []);
  
  return { registerElement };
}

/**
 * iOS/iPadOS-specific performance monitoring
 * Provides utilities for tracking iOS-specific metrics and optimizing for Apple devices
 */

// Interface for iOS/iPadOS performance metrics
export interface IOSPerformanceMetrics {
  // Frame rates
  averageFPS: number;
  minFPS: number;
  maxFPS: number;
  
  // Memory usage
  memoryUsage: number;
  memoryLimit: number;
  
  // CPU/GPU usage (estimated)
  cpuUsage: number;
  gpuUsage: number;
  
  // iOS-specific
  thermalState: 'normal' | 'fair' | 'serious' | 'critical' | 'unknown';
  lowPowerModeEnabled: boolean;
  
  // Touch response metrics
  touchResponseTime: number;
  touchToRenderTime: number;
  
  // Safari rendering metrics
  safariRenderingTime: number;
  layoutTime: number;
  paintTime: number;
  
  // Last updated
  timestamp: number;
}

// Hook for monitoring iOS/iPadOS-specific performance
export function useIOSPerformanceMonitoring(
  options?: {
    enableFPSMonitoring?: boolean;
    enableMemoryMonitoring?: boolean;
    enableThermalMonitoring?: boolean;
    sampleInterval?: number;
    historySize?: number;
  }
) {
  const [metrics, setMetrics] = useState<IOSPerformanceMetrics>({
    averageFPS: 60,
    minFPS: 60,
    maxFPS: 60,
    memoryUsage: 0,
    memoryLimit: 0,
    cpuUsage: 0,
    gpuUsage: 0,
    thermalState: 'unknown',
    lowPowerModeEnabled: false,
    touchResponseTime: 0,
    touchToRenderTime: 0,
    safariRenderingTime: 0,
    layoutTime: 0,
    paintTime: 0,
    timestamp: Date.now()
  });
  
  const [history, setHistory] = useState<IOSPerformanceMetrics[]>([]);
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  
  // Frame counting
  const frameCountRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const fpsHistoryRef = useRef<number[]>([]);
  
  // Touch tracking
  const touchStartTimeRef = useRef<number>(0);
  const touchResponseTimeRef = useRef<number[]>([]);
  
  // Default options
  const opts = {
    enableFPSMonitoring: true,
    enableMemoryMonitoring: true,
    enableThermalMonitoring: true,
    sampleInterval: 1000, // 1 second
    historySize: 60, // 1 minute of history at 1s interval
    ...options
  };
  
  // Check if we're running on an iOS/iPadOS device
  const isAppleDevice = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /iPhone|iPad|iPod/.test(navigator.userAgent);
  }, []);
  
  // Monitor FPS using requestAnimationFrame
  useEffect(() => {
    if (!isMonitoring || !isAppleDevice || !opts.enableFPSMonitoring) return;
    
    let rafId: number;
    lastFrameTimeRef.current = performance.now();
    frameCountRef.current = 0;
    
    const countFrame = (timestamp: number) => {
      // Count the frame
      frameCountRef.current++;
      
      // Calculate time since last frame
      const elapsed = timestamp - lastFrameTimeRef.current;
      if (elapsed >= 1000) {
        // Calculate FPS
        const currentFPS = Math.round((frameCountRef.current * 1000) / elapsed);
        
        // Add to history
        fpsHistoryRef.current.push(currentFPS);
        if (fpsHistoryRef.current.length > 10) {
          fpsHistoryRef.current.shift();
        }
        
        // Reset counters
        frameCountRef.current = 0;
        lastFrameTimeRef.current = timestamp;
        
        // Update metrics
        setMetrics(prev => ({
          ...prev,
          averageFPS: Math.round(fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length),
          minFPS: Math.min(...fpsHistoryRef.current),
          maxFPS: Math.max(...fpsHistoryRef.current),
          timestamp: Date.now()
        }));
      }
      
      // Continue monitoring
      rafId = requestAnimationFrame(countFrame);
    };
    
    // Start monitoring
    rafId = requestAnimationFrame(countFrame);
    
    // Clean up
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [isMonitoring, isAppleDevice, opts.enableFPSMonitoring]);
  
  // Monitor memory usage
  useEffect(() => {
    if (!isMonitoring || !isAppleDevice || !opts.enableMemoryMonitoring) return;
    
    const memoryInterval = setInterval(() => {
      if ('performance' in window && 'memory' in (performance as any)) {
        const memoryInfo = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memoryInfo.usedJSHeapSize,
          memoryLimit: memoryInfo.jsHeapSizeLimit,
          timestamp: Date.now()
        }));
      }
    }, opts.sampleInterval);
    
    return () => {
      clearInterval(memoryInterval);
    };
  }, [isMonitoring, isAppleDevice, opts.enableMemoryMonitoring, opts.sampleInterval]);
  
  // Monitor thermal state (iOS only)
  useEffect(() => {
    if (!isMonitoring || !isAppleDevice || !opts.enableThermalMonitoring) return;
    
    // Check for thermal state API (WebKit experimental feature)
    if ('thermal' in navigator && 'addEventListener' in (navigator as any).thermal) {
      const thermalAPI = (navigator as any).thermal;
      
      const updateThermalState = () => {
        let thermalState: 'normal' | 'fair' | 'serious' | 'critical' | 'unknown' = 'unknown';
        
        if (thermalAPI.state === 0) thermalState = 'normal';
        else if (thermalAPI.state === 1) thermalState = 'fair';
        else if (thermalAPI.state === 2) thermalState = 'serious';
        else if (thermalAPI.state === 3) thermalState = 'critical';
        
        setMetrics(prev => ({
          ...prev,
          thermalState,
          timestamp: Date.now()
        }));
      };
      
      // Initial state
      updateThermalState();
      
      // Listen for changes
      thermalAPI.addEventListener('thermalchange', updateThermalState);
      
      return () => {
        thermalAPI.removeEventListener('thermalchange', updateThermalState);
      };
    }
    
    // Alternative: check for low power mode as a proxy for thermal state
    const checkLowPowerMode = () => {
      if (window.matchMedia) {
        const lowPowerMode = window.matchMedia('(prefers-reduced-power: reduce)').matches;
        setMetrics(prev => ({
          ...prev,
          lowPowerModeEnabled: lowPowerMode,
          // Estimate thermal state from low power mode
          thermalState: lowPowerMode ? 'fair' : 'normal',
          timestamp: Date.now()
        }));
      }
    };
    
    // Check initially
    checkLowPowerMode();
    
    // Listen for changes
    const mediaQueryList = window.matchMedia('(prefers-reduced-power: reduce)');
    mediaQueryList.addEventListener('change', checkLowPowerMode);
    
    return () => {
      mediaQueryList.removeEventListener('change', checkLowPowerMode);
    };
  }, [isMonitoring, isAppleDevice, opts.enableThermalMonitoring]);
  
  // Track touch response time
  useEffect(() => {
    if (!isMonitoring || !isAppleDevice) return;
    
    const handleTouchStart = () => {
      touchStartTimeRef.current = performance.now();
    };
    
    const handleTouchEnd = () => {
      if (touchStartTimeRef.current > 0) {
        const responseTime = performance.now() - touchStartTimeRef.current;
        touchResponseTimeRef.current.push(responseTime);
        
        // Keep history limited
        if (touchResponseTimeRef.current.length > 10) {
          touchResponseTimeRef.current.shift();
        }
        
        // Calculate average
        const avgResponseTime = touchResponseTimeRef.current.reduce((a, b) => a + b, 0) / 
                              touchResponseTimeRef.current.length;
        
        setMetrics(prev => ({
          ...prev,
          touchResponseTime: avgResponseTime,
          timestamp: Date.now()
        }));
        
        touchStartTimeRef.current = 0;
      }
    };
    
    // Add event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMonitoring, isAppleDevice]);
  
  // Track layout and paint times using PerformanceObserver
  useEffect(() => {
    if (!isMonitoring || !isAppleDevice) return;
    if (!('PerformanceObserver' in window)) return;
    
    // Track layout and paint times
    const layoutObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'layout-shift') {
          setMetrics(prev => ({
            ...prev,
            layoutTime: entry.duration,
            timestamp: Date.now()
          }));
        } else if (entry.entryType === 'paint' && entry.name === 'first-paint') {
          setMetrics(prev => ({
            ...prev,
            paintTime: entry.startTime,
            timestamp: Date.now()
          }));
        }
      }
    });
    
    try {
      layoutObserver.observe({ entryTypes: ['layout-shift', 'paint'] });
    } catch (e) {
      // Safari might not support all entry types
      console.warn('Some performance metrics may not be available in this browser');
    }
    
    return () => {
      layoutObserver.disconnect();
    };
  }, [isMonitoring, isAppleDevice]);
  
  // Save history periodically
  useEffect(() => {
    if (!isMonitoring) return;
    
    const historyInterval = setInterval(() => {
      setHistory(prev => {
        const newHistory = [...prev, metrics];
        
        // Limit history size
        if (newHistory.length > opts.historySize) {
          return newHistory.slice(newHistory.length - opts.historySize);
        }
        
        return newHistory;
      });
    }, opts.sampleInterval);
    
    return () => {
      clearInterval(historyInterval);
    };
  }, [isMonitoring, metrics, opts.historySize, opts.sampleInterval]);
  
  // Start/stop monitoring
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    fpsHistoryRef.current = [];
    touchResponseTimeRef.current = [];
  }, []);
  
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);
  
  // Reset history and metrics
  const resetMetrics = useCallback(() => {
    setMetrics({
      averageFPS: 60,
      minFPS: 60,
      maxFPS: 60,
      memoryUsage: 0,
      memoryLimit: 0,
      cpuUsage: 0,
      gpuUsage: 0,
      thermalState: 'unknown',
      lowPowerModeEnabled: false,
      touchResponseTime: 0,
      touchToRenderTime: 0,
      safariRenderingTime: 0,
      layoutTime: 0,
      paintTime: 0,
      timestamp: Date.now()
    });
    setHistory([]);
    fpsHistoryRef.current = [];
    touchResponseTimeRef.current = [];
  }, []);
  
  return { 
    metrics, 
    history,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    resetMetrics,
    isIOSDevice: isAppleDevice
  };
}

/**
 * Hook for applying iOS-specific optimizations
 * Automatically optimizes the interface based on the device and its state
 */
export function useIOSOptimizations() {
  const { deviceType, isAppleDevice } = useDeviceCapabilities();
  const { metrics } = useIOSPerformanceMonitoring();
  
  // Optimization states
  const [optimizationsApplied, setOptimizationsApplied] = useState<{
    reducedAnimations: boolean;
    reducedTransparency: boolean;
    reducedBlur: boolean;
    reducedParallax: boolean;
    batchedUpdates: boolean;
    limitParticles: boolean;
    useLowResTextures: boolean;
  }>({
    reducedAnimations: false,
    reducedTransparency: false,
    reducedBlur: false,
    reducedParallax: false,
    batchedUpdates: false,
    limitParticles: false,
    useLowResTextures: false
  });
  
  // Apply optimizations based on device state
  useEffect(() => {
    if (!isAppleDevice) return;
    
    const newOptimizations = { ...optimizationsApplied };
    
    // Thermal throttling
    if (metrics.thermalState === 'serious' || metrics.thermalState === 'critical') {
      newOptimizations.reducedAnimations = true;
      newOptimizations.reducedBlur = true;
      newOptimizations.reducedParallax = true;
      newOptimizations.limitParticles = true;
      newOptimizations.useLowResTextures = true;
    } else if (metrics.thermalState === 'fair') {
      newOptimizations.reducedParallax = true;
      newOptimizations.limitParticles = true;
    }
    
    // Low power mode
    if (metrics.lowPowerModeEnabled) {
      newOptimizations.reducedAnimations = true;
      newOptimizations.reducedTransparency = true;
      newOptimizations.reducedBlur = true;
      newOptimizations.batchedUpdates = true;
      newOptimizations.useLowResTextures = true;
    }
    
    // FPS dropping
    if (metrics.averageFPS < 45) {
      newOptimizations.reducedAnimations = true;
      newOptimizations.reducedBlur = true;
      newOptimizations.limitParticles = true;
      
      if (metrics.averageFPS < 30) {
        newOptimizations.reducedTransparency = true;
        newOptimizations.batchedUpdates = true;
        newOptimizations.useLowResTextures = true;
      }
    }
    
    // Memory pressure
    if (metrics.memoryUsage > 0 && metrics.memoryLimit > 0) {
      const memoryUsageRatio = metrics.memoryUsage / metrics.memoryLimit;
      
      if (memoryUsageRatio > 0.7) {
        newOptimizations.batchedUpdates = true;
        newOptimizations.useLowResTextures = true;
        
        if (memoryUsageRatio > 0.85) {
          newOptimizations.reducedBlur = true;
          newOptimizations.limitParticles = true;
        }
      }
    }
    
    // Update state if changed
    if (JSON.stringify(newOptimizations) !== JSON.stringify(optimizationsApplied)) {
      setOptimizationsApplied(newOptimizations);
    }
  }, [isAppleDevice, metrics, optimizationsApplied]);
  
  return { 
    optimizations: optimizationsApplied,
    isIOSDevice: isAppleDevice,
    deviceType,
    metrics
  };
}

// Export all utilities
export default {
  useNetworkStatus,
  useOptimizedImageLoading,
  useNetworkAwareData,
  throttle,
  debounce,
  useDeviceCapabilities,
  useLazyImageObserver,
  useIOSPerformanceMonitoring,
  useIOSOptimizations
};