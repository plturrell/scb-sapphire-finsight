import { useState, useEffect, useCallback } from 'react';
import { useDeviceCapabilities } from './useDeviceCapabilities';

interface LoadingStrategy {
  imageSizing: 'high' | 'medium' | 'low' | 'placeholder';
  fetchPriority: 'high' | 'low' | 'auto';
  enablePrefetch: boolean;
  chunkSize: number;
  cacheStrategy: 'aggressive' | 'moderate' | 'minimal';
  lazyLoadThreshold: number; // pixels from viewport
  enableServiceWorker: boolean;
  compressionQuality: number; // 0-1
}

interface ResourceLoadOptions {
  type: 'image' | 'data' | 'script' | 'style';
  priority?: 'high' | 'low' | 'auto';
  size?: number; // in KB
  required?: boolean;
}

export function useNetworkAwareLoading() {
  const { connection, tier } = useDeviceCapabilities();
  const [strategy, setStrategy] = useState<LoadingStrategy>({
    imageSizing: 'high',
    fetchPriority: 'auto',
    enablePrefetch: true,
    chunkSize: 1024 * 1024, // 1MB
    cacheStrategy: 'aggressive',
    lazyLoadThreshold: 200,
    enableServiceWorker: true,
    compressionQuality: 0.9,
  });

  // Update strategy based on network conditions
  useEffect(() => {
    const networkType = connection.type;
    const saveData = connection.saveData;
    const downlink = connection.downlink;

    let newStrategy: LoadingStrategy;

    if (saveData || networkType === 'slow-2g' || networkType === '2g') {
      // Data saver mode
      newStrategy = {
        imageSizing: 'placeholder',
        fetchPriority: 'low',
        enablePrefetch: false,
        chunkSize: 64 * 1024, // 64KB
        cacheStrategy: 'aggressive',
        lazyLoadThreshold: 500,
        enableServiceWorker: true,
        compressionQuality: 0.5,
      };
    } else if (networkType === '3g' || (networkType === '4g' && downlink < 2)) {
      // Medium quality mode
      newStrategy = {
        imageSizing: 'medium',
        fetchPriority: 'auto',
        enablePrefetch: false,
        chunkSize: 256 * 1024, // 256KB
        cacheStrategy: 'moderate',
        lazyLoadThreshold: 300,
        enableServiceWorker: true,
        compressionQuality: 0.7,
      };
    } else if (networkType === 'wifi' || (networkType === '4g' && downlink >= 5)) {
      // High quality mode
      newStrategy = {
        imageSizing: 'high',
        fetchPriority: 'high',
        enablePrefetch: true,
        chunkSize: 2 * 1024 * 1024, // 2MB
        cacheStrategy: 'moderate',
        lazyLoadThreshold: 100,
        enableServiceWorker: true,
        compressionQuality: 0.9,
      };
    } else {
      // Default/unknown - be conservative
      newStrategy = {
        imageSizing: 'medium',
        fetchPriority: 'auto',
        enablePrefetch: false,
        chunkSize: 512 * 1024, // 512KB
        cacheStrategy: 'moderate',
        lazyLoadThreshold: 200,
        enableServiceWorker: true,
        compressionQuality: 0.8,
      };
    }

    // Adjust based on device tier
    if (tier === 'low') {
      newStrategy.enablePrefetch = false;
      newStrategy.chunkSize = Math.min(newStrategy.chunkSize, 256 * 1024);
      newStrategy.lazyLoadThreshold = Math.max(newStrategy.lazyLoadThreshold, 300);
    }

    setStrategy(newStrategy);
  }, [connection, tier]);

  // Get appropriate image source based on strategy
  const getImageSrc = useCallback((sources: {
    high: string;
    medium: string;
    low: string;
    placeholder: string;
  }) => {
    return sources[strategy.imageSizing];
  }, [strategy.imageSizing]);

  // Progressive loading for large data sets
  const loadDataProgressive = useCallback(async <T>(
    fetchFunction: (offset: number, limit: number) => Promise<T[]>,
    totalSize?: number
  ): Promise<T[]> => {
    const chunks: T[] = [];
    let offset = 0;
    const chunkSize = Math.floor(strategy.chunkSize / 1024); // Convert to KB for records

    while (true) {
      try {
        const chunk = await fetchFunction(offset, chunkSize);
        chunks.push(...chunk);
        
        if (chunk.length < chunkSize || (totalSize && offset + chunkSize >= totalSize)) {
          break;
        }
        
        offset += chunkSize;
        
        // Add delay for slower connections
        if (connection.type === '2g' || connection.type === 'slow-2g') {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error('Error loading chunk:', error);
        break;
      }
    }

    return chunks;
  }, [strategy.chunkSize, connection.type]);

  // Prefetch resources based on strategy
  const prefetchResource = useCallback((url: string, options: ResourceLoadOptions = { type: 'data' }) => {
    if (!strategy.enablePrefetch) return;

    // Skip prefetch for large resources on slow connections
    if (options.size && options.size > strategy.chunkSize / 1024) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    
    if (options.priority) {
      link.setAttribute('fetchpriority', options.priority);
    }

    document.head.appendChild(link);
  }, [strategy.enablePrefetch, strategy.chunkSize]);

  // Cache with network-aware expiration
  const cacheWithStrategy = useCallback(async <T>(key: string, fetchFunction: () => Promise<T>): Promise<T> => {
    const cacheKey = `nw-cache-${key}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const maxAge = strategy.cacheStrategy === 'aggressive' ? 86400000 : // 24 hours
                     strategy.cacheStrategy === 'moderate' ? 3600000 :   // 1 hour
                     300000; // 5 minutes
      
      if (Date.now() - timestamp < maxAge) {
        return data;
      }
    }

    try {
      const data = await fetchFunction();
      
      // Only cache if it fits within reasonable size
      const dataSize = JSON.stringify(data).length;
      if (dataSize < strategy.chunkSize) {
        localStorage.setItem(cacheKey, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      }
      
      return data;
    } catch (error) {
      // Return cached data even if expired on network error
      if (cached) {
        return JSON.parse(cached).data;
      }
      throw error;
    }
  }, [strategy.cacheStrategy, strategy.chunkSize]);

  // Adaptive video streaming quality
  const getVideoQuality = useCallback(() => {
    if (connection.saveData) return '360p';
    
    switch (connection.type) {
      case 'slow-2g':
      case '2g':
        return '360p';
      case '3g':
        return connection.downlink > 1 ? '480p' : '360p';
      case '4g':
        return connection.downlink > 5 ? '1080p' : '720p';
      case 'wifi':
        return '1080p';
      default:
        return '480p';
    }
  }, [connection]);

  // Batch API requests for slow connections
  const batchRequests = useCallback(async <T>(requests: (() => Promise<T>)[]): Promise<T[]> => {
    const batchSize = connection.type === '2g' || connection.type === 'slow-2g' ? 1 :
                     connection.type === '3g' ? 3 : 5;

    const results: T[] = [];
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(req => req()));
      results.push(...batchResults);
      
      // Add delay between batches for slow connections
      if (connection.type === '2g' || connection.type === 'slow-2g') {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    return results;
  }, [connection.type]);

  return {
    strategy,
    getImageSrc,
    loadDataProgressive,
    prefetchResource,
    cacheWithStrategy,
    getVideoQuality,
    batchRequests,
    connection,
  };
}

// Hook for lazy loading with network awareness
export function useNetworkLazyLoad(ref: React.RefObject<HTMLElement>) {
  const { strategy, connection } = useNetworkAwareLoading();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!ref.current || isLoaded) return;

    // Skip lazy loading on very slow connections to save bandwidth
    if (connection.type === 'slow-2g' || connection.saveData) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: `${strategy.lazyLoadThreshold}px`,
      }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref, strategy.lazyLoadThreshold, connection, isLoaded]);

  useEffect(() => {
    if (isVisible && !isLoaded) {
      // Add delay for animation
      setTimeout(() => setIsLoaded(true), 100);
    }
  }, [isVisible, isLoaded]);

  return { isVisible, isLoaded };
}

// Hook for adaptive data fetching
export function useAdaptiveFetch<T>(
  url: string,
  options?: RequestInit & { size?: number }
) {
  const { strategy, connection, cacheWithStrategy } = useNetworkAwareLoading();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fetchOptions: RequestInit = {
        ...options,
        // Set cache based on network
        cache: strategy.cacheStrategy === 'aggressive' ? 'force-cache' :
               strategy.cacheStrategy === 'moderate' ? 'default' : 'no-cache',
      };

      // Add headers for compression
      if (!fetchOptions.headers) {
        fetchOptions.headers = {};
      }
      (fetchOptions.headers as any)['Accept-Encoding'] = 'gzip, deflate, br';

      // Use cache strategy for data
      const result = await cacheWithStrategy(url, async () => {
        const response = await fetch(url, fetchOptions);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      });

      setData(result as T);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [url, options, strategy.cacheStrategy, cacheWithStrategy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    // Clear cache and refetch
    const cacheKey = `nw-cache-${url}`;
    localStorage.removeItem(cacheKey);
    fetchData();
  }, [url, fetchData]);

  return { data, loading, error, refresh };
}