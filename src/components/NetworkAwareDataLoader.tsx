import React, { useState, useEffect, useCallback } from 'react';
import { useNetworkAwareLoading } from '@/hooks/useNetworkAwareLoading';
import LoadingSpinner from './LoadingSpinner';

interface NetworkAwareDataLoaderProps<T> {
  children: (data: T[], loading: boolean, error: Error | null) => React.ReactNode;
  fetchFunction: (offset: number, limit: number) => Promise<T[]>;
  totalItems?: number;
  itemsPerPage?: number;
  onDataLoad?: (data: T[]) => void;
  cacheKey?: string;
  className?: string;
}

export default function NetworkAwareDataLoader<T>({
  children,
  fetchFunction,
  totalItems,
  itemsPerPage = 20,
  onDataLoad,
  cacheKey,
  className = '',
}: NetworkAwareDataLoaderProps<T>) {
  const { loadDataProgressive, strategy, connection } = useNetworkAwareLoading();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  // Calculate optimal page size based on network
  const getOptimalPageSize = useCallback(() => {
    if (connection.saveData || connection.type === 'slow-2g') {
      return 5;
    } else if (connection.type === '2g') {
      return 10;
    } else if (connection.type === '3g') {
      return 20;
    }
    return itemsPerPage;
  }, [connection, itemsPerPage]);

  // Load data progressively
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      const pageSize = getOptimalPageSize();
      let allData: T[] = [];
      
      if (strategy.chunkSize < 1024 * 1024) {
        // For slow connections, load data in smaller chunks
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

      onDataLoad?.(allData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
      setProgress(100);
    }
  }, [fetchFunction, totalItems, loadDataProgressive, strategy, connection, getOptimalPageSize, onDataLoad]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh function
  const refresh = useCallback(() => {
    setData([]);
    loadData();
  }, [loadData]);

  // Render loading state with progress
  if (loading && data.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <LoadingSpinner size="lg" />
        {progress > 0 && progress < 100 && (
          <div className="mt-4 w-64">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center">
              Loading data... {Math.round(progress)}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            {connection.type === '2g' || connection.type === 'slow-2g' ? (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 text-center">
                Optimizing for slow connection...
              </p>
            ) : null}
          </div>
        )}
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto text-red-500 mb-4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Failed to load data
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error.message}
          </p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render children with data
  return (
    <div className={className}>
      {children(data, loading, error)}
      
      {/* Loading more indicator */}
      {loading && data.length > 0 && (
        <div className="mt-4 text-center">
          <LoadingSpinner size="sm" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Loading more...
          </p>
        </div>
      )}
    </div>
  );
}

// Hook for infinite scrolling with network awareness
export function useNetworkInfiniteScroll<T>(
  fetchFunction: (page: number, pageSize: number) => Promise<T[]>,
  options: {
    initialPage?: number;
    pageSize?: number;
    cacheKey?: string;
  } = {}
) {
  const { connection } = useNetworkAwareLoading();
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(options.initialPage || 0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Determine page size based on network
  const pageSize = connection.saveData ? 5 :
                  connection.type === 'slow-2g' || connection.type === '2g' ? 10 :
                  connection.type === '3g' ? 20 :
                  options.pageSize || 30;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const newItems = await fetchFunction(page, pageSize);
      
      if (newItems.length < pageSize) {
        setHasMore(false);
      }
      
      setItems(prev => [...prev, ...newItems]);
      setPage(prev => prev + 1);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, loading, hasMore, fetchFunction]);

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
        rootMargin: connection.type === '2g' || connection.type === 'slow-2g' ? '500px' : '200px',
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore, loading, hasMore, connection.type]);

  // Initial load
  useEffect(() => {
    loadMore();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    observerRef,
  };
}