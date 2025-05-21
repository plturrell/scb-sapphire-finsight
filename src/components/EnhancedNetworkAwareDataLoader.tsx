import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNetworkAwareLoading } from '@/hooks/useNetworkAwareLoading';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import EnhancedLoadingSpinner from './EnhancedLoadingSpinner';
import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface EnhancedNetworkAwareDataLoaderProps<T> {
  children: (data: T[], loading: boolean, error: Error | null) => React.ReactNode;
  fetchFunction: (offset: number, limit: number) => Promise<T[]>;
  totalItems?: number;
  itemsPerPage?: number;
  onDataLoad?: (data: T[]) => void;
  cacheKey?: string;
  className?: string;
  theme?: 'light' | 'dark';
  skeletonComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  customLoadingMessage?: string;
}

/**
 * EnhancedNetworkAwareDataLoader Component
 * A network-aware data loader with SCB Beautiful UI styling
 * that adapts its loading behavior based on network conditions
 */
export default function EnhancedNetworkAwareDataLoader<T>({
  children,
  fetchFunction,
  totalItems,
  itemsPerPage = 20,
  onDataLoad,
  cacheKey,
  className = '',
  theme: propTheme,
  skeletonComponent,
  errorComponent,
  customLoadingMessage,
}: EnhancedNetworkAwareDataLoaderProps<T>) {
  const { loadDataProgressive, strategy, connection } = useNetworkAwareLoading();
  const { prefersColorScheme, tier } = useDeviceCapabilities();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);
  const retryCount = useRef(0);
  const maxRetries = 3;
  
  // Determine effective theme based on props or system preference
  const theme = propTheme || prefersColorScheme || 'light';
  
  // Define SCB colors based on theme
  const colors = {
    light: {
      honoluluBlue: 'rgb(var(--scb-honolulu-blue, 0, 114, 170))', // #0072AA
      americanGreen: 'rgb(var(--scb-american-green, 33, 170, 71))', // #21AA47
      sun: 'rgb(var(--scb-sun, 255, 204, 0))', // #FFCC00
      persianRed: 'rgb(var(--scb-persian-red, 204, 0, 0))', // #CC0000
      background: 'white',
      cardBackground: 'white',
      text: '#333333',
      textLight: '#666666',
      border: '#e0e0e0',
      progressBackground: '#f0f0f0',
      networkIndicator: {
        good: 'rgb(var(--scb-american-green, 33, 170, 71))', // Green
        warning: 'rgb(var(--scb-sun, 255, 204, 0))', // Yellow
        bad: 'rgb(var(--scb-persian-red, 204, 0, 0))' // Red
      }
    },
    dark: {
      honoluluBlue: 'rgb(0, 142, 211)', // Lighter for dark mode
      americanGreen: 'rgb(41, 204, 86)', // Lighter for dark mode
      sun: 'rgb(255, 214, 51)', // Lighter for dark mode
      persianRed: 'rgb(255, 99, 99)', // Lighter for dark mode
      background: '#121212',
      cardBackground: '#1e1e1e',
      text: '#e0e0e0',
      textLight: '#a0a0a0',
      border: '#333333',
      progressBackground: '#333333',
      networkIndicator: {
        good: 'rgb(41, 204, 86)', // Lighter green
        warning: 'rgb(255, 214, 51)', // Lighter yellow
        bad: 'rgb(255, 99, 99)' // Lighter red
      }
    }
  };
  
  const currentColors = colors[theme];

  // Calculate optimal page size based on network
  const getOptimalPageSize = useCallback(() => {
    if (connection.saveData || connection.type === 'slow-2g') {
      return 5;
    } else if (connection.type === '2g') {
      return 10;
    } else if (connection.type === '3g') {
      return Math.min(15, itemsPerPage);
    } else if (tier === 'low') {
      return Math.min(20, itemsPerPage);
    }
    return itemsPerPage;
  }, [connection, itemsPerPage, tier]);

  // Load data progressively
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      const pageSize = getOptimalPageSize();
      let allData: T[] = [];
      
      if (strategy.chunkSize < 1024 * 1024 || tier === 'low') {
        // For slow connections or low-end devices, load data in smaller chunks
        const totalChunks = totalItems ? Math.ceil(totalItems / pageSize) : 10;
        
        for (let i = 0; i < totalChunks; i++) {
          const chunk = await fetchFunction(i * pageSize, pageSize);
          allData = [...allData, ...chunk];
          
          setData(allData);
          setProgress((i + 1) / totalChunks * 100);
          
          // Break if we got less than requested
          if (chunk.length < pageSize) break;
          
          // Add delay for slow connections
          if (connection.type === '2g' || connection.type === 'slow-2g') {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      } else {
        // For fast connections, use progressive loading
        allData = await loadDataProgressive(fetchFunction, totalItems);
        setData(allData);
      }

      // Reset retry count on success
      retryCount.current = 0;
      onDataLoad?.(allData);
    } catch (err) {
      setError(err as Error);
      
      // If under max retries, try again with backoff
      if (retryCount.current < maxRetries) {
        retryCount.current += 1;
        const backoff = Math.min(1000 * Math.pow(2, retryCount.current - 1), 5000);
        
        setTimeout(() => {
          if (connection.type !== 'offline') {
            loadData();
          }
        }, backoff);
      }
    } finally {
      setLoading(false);
      setProgress(100);
    }
  }, [
    fetchFunction, 
    totalItems, 
    loadDataProgressive, 
    strategy, 
    connection, 
    getOptimalPageSize, 
    onDataLoad,
    tier
  ]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh function
  const refresh = useCallback(() => {
    setData([]);
    retryCount.current = 0;
    loadData();
  }, [loadData]);

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
  const NetworkIcon = connection.type === 'offline' ? WifiOff : Wifi;

  // Render loading state with progress and network info
  if (loading && data.length === 0) {
    return (
      <div 
        className={`flex flex-col items-center justify-center p-6 ${className}`}
        style={{ 
          backgroundColor: currentColors.cardBackground,
          color: currentColors.text,
          border: `1px solid ${currentColors.border}`,
          borderRadius: '8px'
        }}
      >
        {skeletonComponent || (
          <>
            <EnhancedLoadingSpinner size="lg" theme={theme} />
            
            {progress > 0 && progress < 100 && (
              <div className="mt-6 w-64">
                <div 
                  className="text-sm mb-2 text-center"
                  style={{ color: currentColors.textLight }}
                >
                  {customLoadingMessage || 'Loading data...'} {Math.round(progress)}%
                </div>
                <div 
                  className="w-full rounded-full h-2"
                  style={{ backgroundColor: currentColors.progressBackground }}
                >
                  <div
                    className="h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ 
                      width: `${progress}%`,
                      backgroundColor: currentColors.honoluluBlue 
                    }}
                  />
                </div>
                
                {/* Network status indicator */}
                <div 
                  className="flex items-center justify-center gap-2 mt-4 text-xs"
                  style={{ color: currentColors.textLight }}
                >
                  <NetworkIcon 
                    className="w-4 h-4" 
                    style={{ color: getNetworkStatusColor() }} 
                  />
                  <span>
                    {connection.type === 'offline' ? 'Offline' : 
                      connection.type === 'slow-2g' ? 'Very slow connection' :
                      connection.type === '2g' ? 'Slow connection' :
                      connection.type === '3g' ? 'Medium connection' :
                      connection.type === '4g' ? 'Good connection' :
                      connection.type === 'wifi' ? 'Fast connection' : 'Unknown connection'}
                    {connection.saveData ? ' (Data saver)' : ''}
                  </span>
                </div>
                
                {(connection.type === '2g' || connection.type === 'slow-2g' || connection.saveData) && (
                  <p 
                    className="text-xs mt-2 text-center"
                    style={{ color: currentColors.textLight }}
                  >
                    Optimizing for your connection...
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div 
        className={`flex flex-col items-center justify-center p-6 ${className}`}
        style={{ 
          backgroundColor: currentColors.cardBackground,
          color: currentColors.text,
          border: `1px solid ${currentColors.border}`,
          borderRadius: '8px'
        }}
      >
        {errorComponent || (
          <div className="text-center">
            <AlertCircle
              className="w-16 h-16 mx-auto mb-4"
              style={{ color: currentColors.persianRed }}
            />
            <h3 
              className="text-lg font-semibold mb-2 horizon-header"
              style={{ color: currentColors.text }}
            >
              Failed to load data
            </h3>
            <p 
              className="mb-4"
              style={{ color: currentColors.textLight }}
            >
              {error.message}
            </p>
            
            {/* Network status indicator */}
            <div 
              className="flex items-center justify-center gap-2 mb-4 text-sm"
              style={{ color: currentColors.textLight }}
            >
              <NetworkIcon 
                className="w-4 h-4" 
                style={{ color: getNetworkStatusColor() }} 
              />
              <span>
                {connection.type === 'offline' ? 'You are offline' : 
                  connection.type === 'slow-2g' || connection.type === '2g' ? 'Slow connection detected' :
                  ''}
              </span>
            </div>
            
            <button
              onClick={refresh}
              className="px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
              style={{ 
                backgroundColor: currentColors.honoluluBlue,
                color: 'white'
              }}
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}
      </div>
    );
  }

  // Render children with data
  return (
    <div className={className}>
      {children(data, loading, error)}
      
      {/* Loading more indicator */}
      {loading && data.length > 0 && (
        <div 
          className="mt-4 text-center py-4"
          style={{ color: currentColors.textLight }}
        >
          <EnhancedLoadingSpinner size="sm" theme={theme} />
          <p className="text-sm mt-2">
            Loading more...
          </p>
          
          {/* Network status for slow connections */}
          {(connection.type === '2g' || connection.type === 'slow-2g' || connection.saveData) && (
            <div 
              className="flex items-center justify-center gap-2 mt-2 text-xs"
              style={{ color: currentColors.textLight }}
            >
              <NetworkIcon 
                className="w-3 h-3" 
                style={{ color: getNetworkStatusColor() }} 
              />
              <span>
                {connection.saveData ? 'Data saver mode' : 'Slow connection detected'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Hook for infinite scrolling with network awareness and SCB styling
export function useEnhancedNetworkInfiniteScroll<T>(
  fetchFunction: (page: number, pageSize: number) => Promise<T[]>,
  options: {
    initialPage?: number;
    pageSize?: number;
    cacheKey?: string;
    theme?: 'light' | 'dark';
  } = {}
) {
  const { connection } = useNetworkAwareLoading();
  const { tier } = useDeviceCapabilities();
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(options.initialPage || 0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Determine page size based on network and device capabilities
  const pageSize = connection.saveData ? 5 :
                  connection.type === 'slow-2g' ? 5 :
                  connection.type === '2g' ? 10 :
                  connection.type === '3g' ? 15 :
                  tier === 'low' ? Math.min(20, options.pageSize || 30) :
                  options.pageSize || 30;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      // Simulate slower loading for debug purposes
      // await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newItems = await fetchFunction(page, pageSize);
      
      if (newItems.length < pageSize) {
        setHasMore(false);
      }
      
      setItems(prev => [...prev, ...newItems]);
      setPage(prev => prev + 1);
      
      // Reset retry count on success
      retryCount.current = 0;
    } catch (err) {
      setError(err as Error);
      
      // If under max retries and not offline, try again with backoff
      if (retryCount.current < maxRetries && connection.type !== 'offline') {
        retryCount.current += 1;
        const backoff = Math.min(1000 * Math.pow(2, retryCount.current - 1), 5000);
        
        setTimeout(() => loadMore(), backoff);
      }
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, loading, hasMore, fetchFunction, connection.type]);

  // Intersection observer for infinite scrolling
  const observerRef = useCallback((node: HTMLElement | null) => {
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          loadMore();
        }
      },
      {
        // Adjust rootMargin based on network and device capabilities
        rootMargin: tier === 'low' || connection.type === '2g' || connection.type === 'slow-2g' 
          ? '800px' 
          : connection.type === '3g' 
          ? '400px'
          : '200px',
        threshold: 0.1
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore, loading, hasMore, connection.type, tier]);

  // Initial load
  useEffect(() => {
    loadMore();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Manual retry function that resets error state
  const retry = useCallback(() => {
    if (error) {
      setError(null);
      retryCount.current = 0;
      loadMore();
    }
  }, [error, loadMore]);

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    observerRef,
    retry,
    networkType: connection.type,
    saveData: connection.saveData,
    theme: options.theme
  };
}