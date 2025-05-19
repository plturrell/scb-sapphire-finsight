import { SimulationCache, SimulationCacheKey } from '../SimulationCache';

describe('SimulationCache', () => {
  let cache: SimulationCache;
  
  // Sample simulation parameters
  const sampleParams: SimulationCacheKey = {
    country: 'Vietnam',
    timeHorizon: 24,
    tariffRate: 3.5,
    productCategories: ['electronics', 'textiles'],
    scenarios: ['baseline', 'escalation'],
    confidenceRequired: 0.95,
    simulationVersion: '1.0.0'
  };
  
  // Sample simulation results
  const sampleResults = {
    provincialImpacts: [
      { province: 'hanoi', impactScore: 0.78 },
      { province: 'hochiminh', impactScore: 0.65 }
    ],
    aggregateImpact: 0.71,
    confidenceInterval: [0.68, 0.74],
    iterationsRun: 5000,
    convergenceAchieved: true
  };
  
  // Sample metadata
  const sampleMetadata = {
    iterationsRun: 5000,
    computeTimeMs: 1500,
    convergenceAchieved: true
  };
  
  beforeEach(() => {
    // Create a fresh cache before each test with small size for testing eviction
    cache = new SimulationCache({
      maxCacheSize: 3,
      defaultTTL: 100, // 100ms for easier testing
      cacheVersion: '1.0.0'
    });
    
    // Mock Date.now to control time for tests
    jest.spyOn(Date, 'now').mockImplementation(() => 1000);
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  test('should store and retrieve simulation results', () => {
    // Store results
    const storeResult = cache.cacheResults(sampleParams, sampleResults, sampleMetadata);
    expect(storeResult).toBe(true);
    
    // Retrieve results
    const cachedResults = cache.getCachedResults(sampleParams);
    expect(cachedResults).not.toBeNull();
    expect(cachedResults?.results).toEqual(sampleResults);
    expect(cachedResults?.metadata.iterationsRun).toBe(5000);
  });
  
  test('should use the correct cache key format', () => {
    // Store with one set of parameters
    cache.cacheResults(sampleParams, sampleResults, sampleMetadata);
    
    // Store with a different tariff rate
    const differentParams = { ...sampleParams, tariffRate: 5.0 };
    cache.cacheResults(differentParams, { ...sampleResults, aggregateImpact: 0.85 }, sampleMetadata);
    
    // Both should be cached separately
    expect(cache.getCachedKeys().length).toBe(2);
    
    // Retrieve the correct one
    const cachedResults = cache.getCachedResults(sampleParams);
    expect(cachedResults?.results.aggregateImpact).toBe(0.71);
    
    const differentResults = cache.getCachedResults(differentParams);
    expect(differentResults?.results.aggregateImpact).toBe(0.85);
  });
  
  test('should handle cache misses correctly', () => {
    // Store with one set of parameters
    cache.cacheResults(sampleParams, sampleResults, sampleMetadata);
    
    // Try to retrieve with different parameters
    const differentParams = { ...sampleParams, country: 'Thailand' };
    const cachedResults = cache.getCachedResults(differentParams);
    
    // Should return null for cache miss
    expect(cachedResults).toBeNull();
  });
  
  test('should evict least recently used items when cache is full', () => {
    // Fill the cache (max size = 3)
    cache.cacheResults({ ...sampleParams, country: 'Vietnam' }, sampleResults, sampleMetadata);
    cache.cacheResults({ ...sampleParams, country: 'Thailand' }, sampleResults, sampleMetadata);
    cache.cacheResults({ ...sampleParams, country: 'Singapore' }, sampleResults, sampleMetadata);
    
    // All three should be cached
    expect(cache.getCachedKeys().length).toBe(3);
    
    // Add one more, which should evict the least recently used (Vietnam)
    cache.cacheResults({ ...sampleParams, country: 'Malaysia' }, sampleResults, sampleMetadata);
    
    // Still should have only 3 items
    expect(cache.getCachedKeys().length).toBe(3);
    
    // Vietnam should be evicted
    expect(cache.getCachedResults({ ...sampleParams, country: 'Vietnam' })).toBeNull();
    
    // The others should still be there
    expect(cache.getCachedResults({ ...sampleParams, country: 'Thailand' })).not.toBeNull();
    expect(cache.getCachedResults({ ...sampleParams, country: 'Singapore' })).not.toBeNull();
    expect(cache.getCachedResults({ ...sampleParams, country: 'Malaysia' })).not.toBeNull();
  });
  
  test('should handle expired cache entries', () => {
    // Store a result
    cache.cacheResults(sampleParams, sampleResults, sampleMetadata);
    
    // Check it's there
    expect(cache.getCachedResults(sampleParams)).not.toBeNull();
    
    // Fast forward time beyond TTL
    jest.spyOn(Date, 'now').mockImplementation(() => 2000); // 1000ms later, beyond the 100ms TTL
    
    // Should return null for expired entry
    expect(cache.getCachedResults(sampleParams)).toBeNull();
  });
  
  test('should track cache hit/miss statistics', () => {
    // Starting with empty cache
    const initialStats = cache.getCacheStats();
    expect(initialStats.size).toBe(0);
    expect(initialStats.hitRate).toBe(0);
    expect(initialStats.totalRequests).toBe(0);
    
    // Add an item
    cache.cacheResults(sampleParams, sampleResults, sampleMetadata);
    
    // Hit the cache
    cache.getCachedResults(sampleParams);
    
    // Miss the cache
    cache.getCachedResults({ ...sampleParams, country: 'China' });
    
    // Check updated stats
    const updatedStats = cache.getCacheStats();
    expect(updatedStats.size).toBe(1);
    expect(updatedStats.totalRequests).toBe(2);
    expect(updatedStats.hitRate).toBe(0.5); // 1 hit, 1 miss
  });
  
  test('should clear country-specific cache entries', () => {
    // Add multiple countries
    cache.cacheResults({ ...sampleParams, country: 'Vietnam' }, sampleResults, sampleMetadata);
    cache.cacheResults({ ...sampleParams, country: 'Thailand' }, sampleResults, sampleMetadata);
    cache.cacheResults({ ...sampleParams, country: 'Singapore' }, sampleResults, sampleMetadata);
    
    // Clear only Vietnam entries
    cache.clearCountryCache('Vietnam');
    
    // Vietnam should be gone, others should remain
    expect(cache.getCachedResults({ ...sampleParams, country: 'Vietnam' })).toBeNull();
    expect(cache.getCachedResults({ ...sampleParams, country: 'Thailand' })).not.toBeNull();
    expect(cache.getCachedResults({ ...sampleParams, country: 'Singapore' })).not.toBeNull();
  });
  
  test('should prefetch common simulations', async () => {
    // Mock simulator function
    const mockSimulator = jest.fn().mockImplementation(async (params: SimulationCacheKey) => {
      return {
        provincialImpacts: [],
        aggregateImpact: params.country === 'Vietnam' ? 0.71 : 0.65,
        confidenceInterval: [0.6, 0.8],
        iterationsRun: 5000,
        convergenceAchieved: true
      };
    });
    
    // Common parameters to prefetch
    const commonParams = [
      { ...sampleParams, country: 'Vietnam' },
      { ...sampleParams, country: 'Thailand' }
    ];
    
    // Prefetch simulations
    await cache.prefetchCommonSimulations(commonParams, mockSimulator);
    
    // Simulator should be called twice
    expect(mockSimulator).toHaveBeenCalledTimes(2);
    
    // Both results should be cached
    expect(cache.getCachedResults(commonParams[0])).not.toBeNull();
    expect(cache.getCachedResults(commonParams[1])).not.toBeNull();
  });
});
