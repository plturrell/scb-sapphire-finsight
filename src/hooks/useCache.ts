import { useState, useEffect, useCallback } from 'react';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  namespace?: string; // Namespace for cache keys
  storage?: 'localStorage' | 'sessionStorage'; // Storage type
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

/**
 * Hook for client-side caching of data
 * @param key Cache key
 * @param fetchData Function to fetch data if not in cache
 * @param options Caching options
 * @returns [data, loading, error, refetch]
 */
export default function useCache<T>(
  key: string,
  fetchData: () => Promise<T>,
  options: CacheOptions = {}
): [T | null, boolean, Error | null, (forceFresh?: boolean) => Promise<T>] {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default TTL
    namespace = 'perplexity_cache',
    storage = 'localStorage'
  } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Generate namespaced cache key
  const cacheKey = `${namespace}:${key}`;
  
  // Get storage mechanism
  const storageMethod = storage === 'localStorage' ? localStorage : sessionStorage;
  
  // Function to retrieve from cache
  const getFromCache = useCallback((): CacheEntry<T> | null => {
    try {
      const cached = storageMethod.getItem(cacheKey);
      if (!cached) return null;
      
      const parsedCache: CacheEntry<T> = JSON.parse(cached);
      
      // Check if cache is expired
      if (parsedCache.expiry < Date.now()) {
        storageMethod.removeItem(cacheKey);
        return null;
      }
      
      return parsedCache;
    } catch (err) {
      console.error('Error retrieving from cache:', err);
      return null;
    }
  }, [cacheKey, storageMethod]);
  
  // Function to save to cache
  const saveToCache = useCallback((data: T): void => {
    try {
      const cacheEntry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + ttl
      };
      
      storageMethod.setItem(cacheKey, JSON.stringify(cacheEntry));
    } catch (err) {
      console.error('Error saving to cache:', err);
      // If storage is full, clear older items
      if (err instanceof DOMException && (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        clearOldCache(namespace, storageMethod);
      }
    }
  }, [cacheKey, ttl, storageMethod, namespace]);
  
  // Function to fetch and cache data
  const fetchAndCache = useCallback(async (forceFresh: boolean = false): Promise<T> => {
    setLoading(true);
    setError(null);
    
    try {
      // Check cache first if not forcing fresh data
      if (!forceFresh) {
        const cachedData = getFromCache();
        if (cachedData) {
          setData(cachedData.data);
          setLoading(false);
          return cachedData.data;
        }
      }
      
      // Fetch fresh data
      const freshData = await fetchData();
      
      // Save to cache
      saveToCache(freshData);
      
      // Update state
      setData(freshData);
      
      return freshData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error fetching data');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchData, getFromCache, saveToCache]);
  
  // Load initial data
  useEffect(() => {
    let isMounted = true;
    
    const loadInitialData = async () => {
      try {
        // First check cache
        const cachedData = getFromCache();
        
        if (cachedData) {
          // We have cached data, use it immediately
          if (isMounted) {
            setData(cachedData.data);
          }
        } else {
          // No cached data, fetch it
          await fetchAndCache(false);
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
      }
    };
    
    loadInitialData();
    
    return () => {
      isMounted = false;
    };
  }, [getFromCache, fetchAndCache]);
  
  return [data, loading, error, fetchAndCache];
}

/**
 * Clear old cache entries for a namespace
 */
function clearOldCache(namespace: string, storage: Storage): void {
  try {
    // Get all keys for the namespace
    const keys = Object.keys(storage).filter(key => key.startsWith(`${namespace}:`));
    
    // Sort by oldest first
    const entries = keys.map(key => {
      try {
        const value = storage.getItem(key);
        if (!value) return { key, timestamp: 0 };
        
        const parsed = JSON.parse(value);
        return { key, timestamp: parsed.timestamp || 0 };
      } catch {
        return { key, timestamp: 0 };
      }
    }).sort((a, b) => a.timestamp - b.timestamp);
    
    // Remove the oldest 20% of entries
    const toRemove = Math.max(1, Math.floor(entries.length * 0.2));
    entries.slice(0, toRemove).forEach(entry => {
      storage.removeItem(entry.key);
    });
  } catch (err) {
    console.error('Error clearing old cache:', err);
  }
}