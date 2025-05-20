import perplexityAnalytics from '../PerplexityAnalytics';

describe('PerplexityAnalytics', () => {
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
    
    // Reset analytics
    perplexityAnalytics.clearAnalytics();
    
    // Update options for testing
    perplexityAnalytics.updateOptions({
      enabled: true,
      anonymizeData: true,
      debugMode: false
    });
    
    // Mock Date.now and random for consistent event IDs
    jest.spyOn(Date, 'now').mockImplementation(() => 1000);
    jest.spyOn(Math, 'random').mockImplementation(() => 0.5);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('tracks events correctly', () => {
    // Act
    perplexityAnalytics.trackEvent('search:started', {
      query: 'test query',
      searchType: 'companies'
    });
    
    // Assert
    // Get analytics data
    const events = perplexityAnalytics.getAnalyticsData();
    
    // Should have one event
    expect(events).toHaveLength(1);
    
    // Check event properties
    const event = events[0];
    expect(event.type).toBe('search:started');
    expect(event.data.searchType).toBe('companies');
    
    // Verify event was saved to localStorage
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  test('anonymizes sensitive data', () => {
    // Act
    perplexityAnalytics.trackEvent('search:started', {
      query: 'confidential search',
      email: 'user@example.com',
      ip: '192.168.1.1',
      safeKey: 'non-sensitive data'
    });
    
    // Assert
    const events = perplexityAnalytics.getAnalyticsData();
    const event = events[0];
    
    // Sensitive fields should be anonymized
    expect(event.data.query).not.toBe('confidential search');
    expect(event.data.email).not.toBe('user@example.com');
    expect(event.data.ip).not.toBe('192.168.1.1');
    
    // Non-sensitive fields should remain unchanged
    expect(event.data.safeKey).toBe('non-sensitive data');
  });

  test('can disable anonymization', () => {
    // Disable anonymization
    perplexityAnalytics.updateOptions({ anonymizeData: false });
    
    // Act
    perplexityAnalytics.trackEvent('search:started', {
      query: 'test query',
      email: 'user@example.com'
    });
    
    // Assert
    const events = perplexityAnalytics.getAnalyticsData();
    const event = events[0];
    
    // Data should not be anonymized
    expect(event.data.query).toBe('test query');
    expect(event.data.email).toBe('user@example.com');
  });

  test('can disable analytics completely', () => {
    // Disable analytics
    perplexityAnalytics.updateOptions({ enabled: false });
    
    // Act
    perplexityAnalytics.trackEvent('search:started', {
      query: 'test query'
    });
    
    // Assert
    const events = perplexityAnalytics.getAnalyticsData();
    
    // No events should be recorded
    expect(events).toHaveLength(0);
  });

  test('tracks search events with helper methods', () => {
    // Act
    perplexityAnalytics.trackSearch('test query', { type: 'all' });
    perplexityAnalytics.trackSearchCompleted('test query', 5, 350);
    perplexityAnalytics.trackSearchError('another query', 'API error');
    
    // Assert
    const events = perplexityAnalytics.getAnalyticsData();
    
    // Should have three events
    expect(events).toHaveLength(3);
    
    // Check event types
    expect(events[0].type).toBe('search:started');
    expect(events[1].type).toBe('search:completed');
    expect(events[2].type).toBe('search:error');
    
    // Check data
    expect(events[1].data.resultCount).toBe(5);
    expect(events[1].data.durationMs).toBe(350);
    expect(events[2].data.error).toBe('API error');
  });

  test('tracks result selection', () => {
    // Act
    perplexityAnalytics.trackResultSelected('result-123', 2, 'company');
    
    // Assert
    const events = perplexityAnalytics.getAnalyticsData();
    
    // Should have one event
    expect(events).toHaveLength(1);
    
    // Check event properties
    const event = events[0];
    expect(event.type).toBe('search:result_selected');
    expect(event.data.resultId).toBe('result-123');
    expect(event.data.position).toBe(2);
    expect(event.data.resultType).toBe('company');
  });

  test('tracks news interactions', () => {
    // Act
    perplexityAnalytics.trackNewsItemClicked('news-123', 'Markets', 'Financial Times');
    
    // Assert
    const events = perplexityAnalytics.getAnalyticsData();
    
    // Should have one event
    expect(events).toHaveLength(1);
    
    // Check event properties
    const event = events[0];
    expect(event.type).toBe('news:item_clicked');
    expect(event.data.newsId).toBe('news-123');
    expect(event.data.category).toBe('Markets');
    expect(event.data.source).toBe('Financial Times');
  });

  test('tracks user feedback', () => {
    // Act
    perplexityAnalytics.trackFeedback('positive', 'result-123', 'Great result!');
    perplexityAnalytics.trackFeedback('negative', 'result-456', 'Not relevant');
    
    // Assert
    const events = perplexityAnalytics.getAnalyticsData();
    
    // Should have two events
    expect(events).toHaveLength(2);
    
    // Check event properties
    expect(events[0].type).toBe('feedback:positive');
    expect(events[0].data.itemId).toBe('result-123');
    expect(events[0].data.comment).toBe('Great result!');
    
    expect(events[1].type).toBe('feedback:negative');
    expect(events[1].data.itemId).toBe('result-456');
  });

  test('filters analytics data by date range', () => {
    // Create events at different times
    
    // First event at time 1000
    perplexityAnalytics.trackEvent('search:started', { query: 'first query' });
    
    // Second event 2 days later
    jest.spyOn(Date, 'now').mockImplementation(() => 1000 + (2 * 24 * 60 * 60 * 1000));
    const twoDaysLater = new Date(Date.now());
    perplexityAnalytics.trackEvent('search:started', { query: 'second query' });
    
    // Third event 4 days later
    jest.spyOn(Date, 'now').mockImplementation(() => 1000 + (4 * 24 * 60 * 60 * 1000));
    const fourDaysLater = new Date(Date.now());
    perplexityAnalytics.trackEvent('search:started', { query: 'third query' });
    
    // Act - filter for events between day 1 and day 3
    const events = perplexityAnalytics.getAnalyticsData({
      startDate: new Date(1000), // Initial time
      endDate: new Date(1000 + (3 * 24 * 60 * 60 * 1000)) // 3 days later
    });
    
    // Assert
    expect(events).toHaveLength(2); // Should include first two events
  });

  test('filters analytics data by event type', () => {
    // Create events of different types
    perplexityAnalytics.trackEvent('search:started', { query: 'test' });
    perplexityAnalytics.trackEvent('search:completed', { resultCount: 5 });
    perplexityAnalytics.trackEvent('news:item_clicked', { newsId: 'news-123' });
    
    // Act - filter for only search events
    const events = perplexityAnalytics.getAnalyticsData({
      eventTypes: ['search:started', 'search:completed']
    });
    
    // Assert
    expect(events).toHaveLength(2);
    expect(events.every(e => e.type.startsWith('search:'))).toBe(true);
  });

  test('generates analytics summary correctly', () => {
    // Create various events
    perplexityAnalytics.trackSearch('query 1');
    perplexityAnalytics.trackSearch('query 1'); // Duplicate to test counting
    perplexityAnalytics.trackSearch('query 2');
    
    perplexityAnalytics.trackSearchCompleted('query 1', 5, 300);
    perplexityAnalytics.trackSearchCompleted('query 1', 4, 250);
    perplexityAnalytics.trackSearchCompleted('query 2', 6, 400);
    
    perplexityAnalytics.trackSearchError('query 3', 'API error');
    
    perplexityAnalytics.trackResultSelected('result-1', 0, 'company');
    perplexityAnalytics.trackResultSelected('result-2', 1, 'general');
    
    perplexityAnalytics.trackFeedback('positive', 'result-1');
    perplexityAnalytics.trackFeedback('negative', 'result-2');
    
    // Act
    const summary = perplexityAnalytics.getAnalyticsSummary();
    
    // Assert
    expect(summary.totalEvents).toBe(11);
    
    // Event counts by type
    expect(summary.eventsByType['search:started']).toBe(3);
    expect(summary.eventsByType['search:completed']).toBe(3);
    expect(summary.eventsByType['search:error']).toBe(1);
    
    // Search metrics
    expect(summary.searchMetrics.totalSearches).toBe(3);
    expect(summary.searchMetrics.averageResultCount).toBe(5); // (5+4+6)/3
    expect(summary.searchMetrics.errorRate).toBeCloseTo(0.333, 2); // 1/3
    
    // Top queries
    expect(summary.searchMetrics.topQueries[0].query).toBe('query 1');
    expect(summary.searchMetrics.topQueries[0].count).toBe(2);
    
    // User engagement
    expect(summary.userEngagement.clickThroughRate).toBeCloseTo(0.667, 2); // 2/3
    expect(summary.userEngagement.feedbackRate).toBeCloseTo(0.667, 2); // 2/3
    expect(summary.userEngagement.positiveFeedbackRate).toBe(0.5); // 1/2
  });

  test('handles storage cleanup when exceeding maxEventsStored', () => {
    // Update options to allow only 5 events
    perplexityAnalytics.updateOptions({ maxEventsStored: 5 });
    
    // Act - create 10 events
    for (let i = 0; i < 10; i++) {
      perplexityAnalytics.trackEvent('search:started', { query: `query ${i}` });
    }
    
    // Assert
    const events = perplexityAnalytics.getAnalyticsData();
    
    // Should keep only the most recent 5 events
    expect(events).toHaveLength(5);
    
    // The events should be the last 5 we created
    expect(events[0].data.query).toBe('query 5');
    expect(events[4].data.query).toBe('query 9');
  });

  test('removes expired events based on expireDays', () => {
    // Set a shorter expiry time for testing
    perplexityAnalytics.updateOptions({ expireDays: 2 });
    
    // Create an old event
    perplexityAnalytics.trackEvent('search:started', { query: 'old query' });
    
    // Create an event 3 days later (beyond expiry)
    jest.spyOn(Date, 'now').mockImplementation(() => 1000 + (3 * 24 * 60 * 60 * 1000));
    perplexityAnalytics.trackEvent('search:started', { query: 'new query' });
    
    // Assert
    const events = perplexityAnalytics.getAnalyticsData();
    
    // Should only have the new event
    expect(events).toHaveLength(1);
    expect(events[0].data.query).toBe('new query');
  });
});