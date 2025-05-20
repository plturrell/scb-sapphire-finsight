import perplexityRateLimiter from '../PerplexityRateLimiter';

describe('PerplexityRateLimiter', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: jest.fn((key: string) => { delete store[key]; }),
      clear: jest.fn(() => { store = {}; }),
      store
    };
  })();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    localStorageMock.clear();
    
    // Reset rate limiter by accessing its internal resetMetrics method
    perplexityRateLimiter.resetMetrics();
    
    // Mock Date.now for consistent testing
    jest.spyOn(Date, 'now').mockImplementation(() => 1000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('allows requests when no limits are reached', () => {
    // Act
    const canMake = perplexityRateLimiter.canMakeRequest();
    
    // Assert
    expect(canMake).toBe(true);
  });

  test('records API requests correctly', () => {
    // Act
    perplexityRateLimiter.recordRequest({
      endpoint: 'chat/completions',
      tokens: 100,
      model: 'sonar-small-chat',
      startTime: 500,
      success: true
    });
    
    // Assert
    const metrics = perplexityRateLimiter.getMetrics();
    expect(metrics.requestsLastMinute).toBe(1);
    expect(metrics.tokensUsed24h).toBe(100);
    
    // Verify localStorage was updated
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  test('blocks requests when minute limit is reached', () => {
    // Setup: record enough requests to hit the limit
    const limit = perplexityRateLimiter.getLimits().maxRequestsPerMinute;
    
    for (let i = 0; i < limit; i++) {
      perplexityRateLimiter.recordRequest({
        endpoint: 'chat/completions',
        tokens: 10,
        model: 'test-model',
        startTime: 500,
        success: true
      });
    }
    
    // Act
    const canMake = perplexityRateLimiter.canMakeRequest();
    
    // Assert
    expect(canMake).toBe(false);
  });

  test('calculates correct wait time when rate limited', () => {
    // Setup: record some requests as if they happened 30 seconds ago
    jest.spyOn(Date, 'now').mockImplementation(() => 30000); // 30 seconds from baseline
    
    // Record limit requests
    const limit = perplexityRateLimiter.getLimits().maxRequestsPerMinute;
    
    for (let i = 0; i < limit; i++) {
      perplexityRateLimiter.recordRequest({
        endpoint: 'chat/completions',
        tokens: 10,
        model: 'test-model',
        startTime: 29900,
        success: true
      });
    }
    
    // Act
    const timeToWait = perplexityRateLimiter.getTimeToWaitMs();
    
    // Assert - should be approximately 30 seconds (60s - 30s elapsed)
    expect(timeToWait).toBeGreaterThan(29000);
    expect(timeToWait).toBeLessThan(31000);
  });

  test('cleans up old records', () => {
    // Setup: mock Date.now to return an initial timestamp
    jest.spyOn(Date, 'now').mockImplementation(() => 1000);
    
    // Record a request
    perplexityRateLimiter.recordRequest({
      endpoint: 'chat/completions',
      tokens: 100,
      model: 'test-model',
      startTime: 500,
      success: true
    });
    
    // Fast forward 2 hours
    jest.spyOn(Date, 'now').mockImplementation(() => 1000 + (2 * 60 * 60 * 1000));
    
    // This should trigger cleanup of old records
    const metrics = perplexityRateLimiter.getMetrics();
    
    // Minute and hour counts should be 0, but 24h should still have the request
    expect(metrics.requestsLastMinute).toBe(0);
    expect(metrics.requestsLastHour).toBe(0);
    expect(metrics.requestsLast24h).toBe(1);
  });

  test('tracks token usage correctly', () => {
    // Act - record requests with different token counts
    perplexityRateLimiter.recordRequest({
      endpoint: 'chat/completions',
      tokens: 100,
      model: 'test-model-1',
      startTime: 500,
      success: true
    });
    
    perplexityRateLimiter.recordRequest({
      endpoint: 'chat/completions',
      tokens: 200,
      model: 'test-model-2',
      startTime: 600,
      success: true
    });
    
    // Assert
    const metrics = perplexityRateLimiter.getMetrics();
    expect(metrics.tokensUsed24h).toBe(300);
  });

  test('blocks requests when token limit is reached', () => {
    // Setup: update options with lower token limit for testing
    const originalLimits = perplexityRateLimiter.getLimits();
    perplexityRateLimiter.updateOptions({ maxTokensPerDay: 500 });
    
    // Record requests that exceed the token limit
    perplexityRateLimiter.recordRequest({
      endpoint: 'chat/completions',
      tokens: 300,
      model: 'test-model-1',
      startTime: 500,
      success: true
    });
    
    perplexityRateLimiter.recordRequest({
      endpoint: 'chat/completions',
      tokens: 250,
      model: 'test-model-2',
      startTime: 600,
      success: true
    });
    
    // Act
    const canMake = perplexityRateLimiter.canMakeRequest();
    
    // Assert
    expect(canMake).toBe(false);
    
    // Reset options for other tests
    perplexityRateLimiter.updateOptions({ maxTokensPerDay: originalLimits.maxTokensPerDay });
  });

  test('resets metrics correctly', () => {
    // Setup: record some requests
    perplexityRateLimiter.recordRequest({
      endpoint: 'chat/completions',
      tokens: 100,
      model: 'test-model',
      startTime: 500,
      success: true
    });
    
    // Act
    perplexityRateLimiter.resetMetrics();
    
    // Assert
    const metrics = perplexityRateLimiter.getMetrics();
    expect(metrics.requestsLast24h).toBe(0);
    expect(metrics.tokensUsed24h).toBe(0);
    expect(metrics.history).toHaveLength(0);
  });

  test('handles unsuccessful requests', () => {
    // Record a failed request
    perplexityRateLimiter.recordRequest({
      endpoint: 'chat/completions',
      tokens: 0, // No tokens used for failed request
      model: 'test-model',
      startTime: 500,
      success: false
    });
    
    // Get metrics
    const metrics = perplexityRateLimiter.getMetrics();
    
    // Request count should increment but tokens should not
    expect(metrics.requestsLastMinute).toBe(1);
    expect(metrics.tokensUsed24h).toBe(0);
    
    // History should include the failed request
    expect(metrics.history).toHaveLength(1);
    expect(metrics.history[0].success).toBe(false);
  });
});