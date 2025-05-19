/**
 * SimulationCache - Intelligent caching system for tariff impact simulation results
 * Addresses the review feedback regarding caching strategy for expensive simulation results
 */

export interface SimulationCacheKey {
  country: string;
  timeHorizon: number;
  tariffRate?: number;
  productCategories?: string[];
  scenarios?: string[];
  confidenceRequired?: number;
  simulationVersion?: string;
  [key: string]: any; // Allow for additional parameters
}

export interface CachedSimulationResult {
  results: any;
  timestamp: number;
  metadata: {
    iterationsRun: number;
    computeTimeMs: number;
    convergenceAchieved: boolean;
    cacheVersion: string;
  };
}

export class SimulationCache {
  private cache: Map<string, CachedSimulationResult> = new Map();
  private maxCacheSize: number;
  private defaultTTL: number; // Time-to-live in milliseconds
  private cacheHits: number = 0;
  private cacheMisses: number = 0;
  private cacheVersion: string = '1.0.0';
  
  constructor(options?: {
    maxCacheSize?: number;
    defaultTTL?: number; // milliseconds
    cacheVersion?: string;
  }) {
    this.maxCacheSize = options?.maxCacheSize || 50;
    this.defaultTTL = options?.defaultTTL || 24 * 60 * 60 * 1000; // 24 hours default
    if (options?.cacheVersion) {
      this.cacheVersion = options.cacheVersion;
    }
    
    // Setup cache cleaning at regular intervals
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanCache(), 3600 * 1000); // Clean every hour
    }
  }
  
  /**
   * Compute a cache key from simulation parameters
   * Uses semantic hashing to group similar simulations together
   */
  private computeCacheKey(params: SimulationCacheKey): string {
    // Extract key parameters
    const {
      country,
      timeHorizon,
      tariffRate,
      productCategories = [],
      scenarios = []
    } = params;
    
    // Sort arrays to ensure consistent ordering
    const sortedCategories = [...productCategories].sort();
    const sortedScenarios = [...scenarios].sort();
    
    // Build key with major parameters
    let key = `${country}:${timeHorizon}:${tariffRate || 'null'}`;
    
    // Add product categories if present
    if (sortedCategories.length > 0) {
      key += `:${sortedCategories.join('+')}`;
    }
    
    // Add scenarios if present
    if (sortedScenarios.length > 0) {
      key += `:${sortedScenarios.join('+')}`;
    }
    
    // Add confidence level if present
    if (params.confidenceRequired) {
      key += `:conf${params.confidenceRequired}`;
    }
    
    // Add simulation version to invalidate cache on algorithm updates
    key += `:v${params.simulationVersion || this.cacheVersion}`;
    
    return key;
  }
  
  /**
   * Store simulation results in cache
   * @returns true if successfully cached, false otherwise
   */
  public cacheResults(
    params: SimulationCacheKey, 
    results: any, 
    metadata: {
      iterationsRun: number;
      computeTimeMs: number;
      convergenceAchieved: boolean;
    }
  ): boolean {
    try {
      const key = this.computeCacheKey(params);
      
      // Check if we need to make room in the cache
      if (this.cache.size >= this.maxCacheSize) {
        this.evictLeastRecentlyUsed();
      }
      
      // Store with metadata and timestamp
      this.cache.set(key, {
        results,
        timestamp: Date.now(),
        metadata: {
          ...metadata,
          cacheVersion: this.cacheVersion
        }
      });
      
      console.log(`Cached simulation results for ${key}`);
      return true;
    } catch (error) {
      console.error('Error caching simulation results:', error);
      return false;
    }
  }
  
  /**
   * Get cached simulation results if available and not expired
   * @returns The cached results or null if not found or expired
   */
  public getCachedResults(params: SimulationCacheKey): CachedSimulationResult | null {
    try {
      const key = this.computeCacheKey(params);
      const cached = this.cache.get(key);
      
      // Check if we have a cache hit
      if (!cached) {
        this.cacheMisses++;
        return null;
      }
      
      // Check if the cache entry has expired
      const now = Date.now();
      if (now - cached.timestamp > this.defaultTTL) {
        // Remove expired entry
        this.cache.delete(key);
        this.cacheMisses++;
        return null;
      }
      
      // Refresh access time by re-storing with updated timestamp
      // Only do this for version compatible results
      if (cached.metadata.cacheVersion === this.cacheVersion) {
        this.cache.set(key, {
          ...cached,
          timestamp: now
        });
        
        this.cacheHits++;
        return cached;
      } else {
        // Version mismatch, treat as cache miss
        this.cache.delete(key);
        this.cacheMisses++;
        return null;
      }
    } catch (error) {
      console.error('Error retrieving cached simulation results:', error);
      return null;
    }
  }
  
  /**
   * Remove the least recently used item from the cache
   * Uses timestamp as a proxy for recency
   */
  private evictLeastRecentlyUsed(): void {
    if (this.cache.size === 0) return;
    
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;
    
    // Find the oldest entry
    for (const [key, value] of this.cache.entries()) {
      if (value.timestamp < oldestTimestamp) {
        oldestTimestamp = value.timestamp;
        oldestKey = key;
      }
    }
    
    // Remove the oldest entry
    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`Evicted oldest cache entry: ${oldestKey}`);
    }
  }
  
  /**
   * Remove expired entries from the cache
   */
  private cleanCache(): void {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.defaultTTL) {
        this.cache.delete(key);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      console.log(`Cleaned ${expiredCount} expired cache entries`);
    }
  }
  
  /**
   * Prefetch simulation results for common parameter sets
   * This can be called during idle times to warm the cache
   */
  public async prefetchCommonSimulations(
    commonParams: SimulationCacheKey[],
    simulatorFn: (params: SimulationCacheKey) => Promise<any>
  ): Promise<void> {
    console.log(`Prefetching ${commonParams.length} common simulations`);
    
    for (const params of commonParams) {
      const key = this.computeCacheKey(params);
      
      // Skip if already cached
      if (this.cache.has(key)) {
        continue;
      }
      
      try {
        // Run the simulation
        const startTime = performance.now();
        const results = await simulatorFn(params);
        const computeTimeMs = performance.now() - startTime;
        
        // Cache the results
        this.cacheResults(params, results, {
          iterationsRun: results.iterationsRun || 5000,
          computeTimeMs,
          convergenceAchieved: results.convergenceAchieved || true
        });
      } catch (error) {
        console.error(`Error prefetching simulation for ${key}:`, error);
      }
    }
    
    console.log(`Prefetching complete. Cache now contains ${this.cache.size} entries.`);
  }
  
  /**
   * Clear all cached results
   */
  public clearCache(): void {
    this.cache.clear();
    console.log('Simulation cache cleared');
  }
  
  /**
   * Clear cached results for a specific country
   */
  public clearCountryCache(country: string): void {
    for (const [key, _] of this.cache.entries()) {
      if (key.startsWith(`${country}:`)) {
        this.cache.delete(key);
      }
    }
    console.log(`Cleared cache entries for ${country}`);
  }
  
  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    size: number;
    hitRate: number;
    totalRequests: number;
    maxSize: number;
  } {
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 ? this.cacheHits / totalRequests : 0;
    
    return {
      size: this.cache.size,
      hitRate,
      totalRequests,
      maxSize: this.maxCacheSize
    };
  }
  
  /**
   * Get list of currently cached keys
   */
  public getCachedKeys(): string[] {
    return Array.from(this.cache.keys());
  }
  
  /**
   * Get all cached data (for debug purposes)
   */
  public getAllCachedData(): Map<string, CachedSimulationResult> {
    return new Map(this.cache);
  }
}

// Export singleton instance
export const globalSimulationCache = new SimulationCache();
export default SimulationCache;
