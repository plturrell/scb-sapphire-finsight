/**
 * Perplexity Analytics Service
 * 
 * Tracks user interactions with Perplexity features to improve user experience
 * and optimize API usage.
 */

export interface AnalyticsOptions {
  enabled?: boolean;
  anonymizeData?: boolean;
  storageKey?: string;
  maxEventsStored?: number;
  expireDays?: number;
  debugMode?: boolean;
}

export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  timestamp: string;
  data: Record<string, any>;
  sessionId: string;
}

export type AnalyticsEventType = 
  | 'search:started'
  | 'search:completed'
  | 'search:error'
  | 'search:results_viewed'
  | 'search:result_selected'
  | 'search:no_results'
  | 'news:viewed'
  | 'news:item_clicked'
  | 'news:refreshed'
  | 'tariff:search'
  | 'tariff:result_viewed'
  | 'feedback:positive'
  | 'feedback:negative'
  | 'api:rate_limited'
  | 'api:error';

class PerplexityAnalytics {
  private options: Required<AnalyticsOptions>;
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private isInitialized = false;
  
  constructor(options: AnalyticsOptions = {}) {
    // Default options
    this.options = {
      enabled: options.enabled !== false,
      anonymizeData: options.anonymizeData !== false,
      storageKey: options.storageKey || 'perplexity_analytics',
      maxEventsStored: options.maxEventsStored || 1000,
      expireDays: options.expireDays || 30,
      debugMode: options.debugMode || false
    };
    
    // Generate a session ID
    this.sessionId = this.generateSessionId();
    
    // Load existing events if available
    this.loadEvents();
    
    // Log initialization
    if (this.options.debugMode) {
      console.log('Perplexity Analytics initialized:', {
        options: this.options,
        sessionId: this.sessionId,
        eventsLoaded: this.events.length
      });
    }
  }
  
  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  }
  
  /**
   * Generate a unique event ID
   */
  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  }
  
  /**
   * Load events from localStorage (safely)
   */
  private loadEvents(): void {
    try {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedEvents = window.localStorage.getItem(this.options.storageKey);
        if (storedEvents) {
          const parsed = JSON.parse(storedEvents);
          
          // Validate stored events
          if (Array.isArray(parsed)) {
            this.events = parsed;
            this.removeExpiredEvents();
          } else {
            this.events = [];
          }
        }
      }
      
      // Always mark as initialized
      this.isInitialized = true;
    } catch (error) {
      console.error('Error loading analytics events:', error);
      this.events = [];
      this.isInitialized = true;
    }
  }
  
  /**
   * Save events to localStorage (safely)
   */
  private saveEvents(): void {
    // Skip saving if not in browser environment
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    
    try {
      window.localStorage.setItem(this.options.storageKey, JSON.stringify(this.events));
    } catch (error) {
      console.error('Error saving analytics events:', error);
      
      // If storage limit is exceeded, remove oldest events
      if (error instanceof DOMException && 
          (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        // Remove oldest 20% of events
        const toRemove = Math.max(1, Math.floor(this.events.length * 0.2));
        this.events = this.events.slice(toRemove);
        
        // Try saving again
        try {
          window.localStorage.setItem(this.options.storageKey, JSON.stringify(this.events));
        } catch (secondError) {
          console.error('Failed to save events after cleanup:', secondError);
        }
      }
    }
  }
  
  /**
   * Remove expired events
   */
  private removeExpiredEvents(): void {
    const now = new Date();
    const expiryTime = now.getTime() - (this.options.expireDays * 24 * 60 * 60 * 1000);
    
    this.events = this.events.filter(event => {
      const eventTime = new Date(event.timestamp).getTime();
      return eventTime > expiryTime;
    });
    
    // If we have too many events, remove the oldest ones
    if (this.events.length > this.options.maxEventsStored) {
      this.events = this.events.slice(this.events.length - this.options.maxEventsStored);
    }
    
    this.saveEvents();
  }
  
  /**
   * Anonymize data if required
   */
  private anonymizeIfNeeded(data: Record<string, any>): Record<string, any> {
    if (!this.options.anonymizeData) {
      return data;
    }
    
    const anonymized = { ...data };
    
    // Anonymize personal or sensitive information
    const sensitiveKeys = ['email', 'name', 'user', 'query', 'ip', 'location'];
    
    for (const key of Object.keys(anonymized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        if (typeof anonymized[key] === 'string') {
          // Keep length and format but replace with X's and last 4 chars if long enough
          const value = anonymized[key] as string;
          if (value.length > 4) {
            anonymized[key] = 'X'.repeat(value.length - 4) + value.slice(-4);
          } else {
            anonymized[key] = 'X'.repeat(value.length);
          }
        } else {
          // Just indicate type was anonymized
          anonymized[key] = `[${typeof anonymized[key]} anonymized]`;
        }
      }
    }
    
    return anonymized;
  }
  
  /**
   * Track an analytics event
   */
  public trackEvent(type: AnalyticsEventType, data: Record<string, any> = {}): void {
    if (!this.options.enabled) {
      return;
    }
    
    if (!this.isInitialized) {
      this.loadEvents();
    }
    
    const anonymizedData = this.anonymizeIfNeeded(data);
    
    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      type,
      timestamp: new Date().toISOString(),
      data: anonymizedData,
      sessionId: this.sessionId
    };
    
    this.events.push(event);
    
    // If we have too many events, remove the oldest ones
    if (this.events.length > this.options.maxEventsStored) {
      this.events = this.events.slice(1);
    }
    
    this.saveEvents();
    
    if (this.options.debugMode) {
      console.log('Tracked Perplexity analytics event:', event);
    }
  }
  
  /**
   * Track a search event
   */
  public trackSearch(query: string, options: { type?: string } = {}): void {
    this.trackEvent('search:started', {
      query,
      searchType: options.type || 'general'
    });
  }
  
  /**
   * Track search completion
   */
  public trackSearchCompleted(query: string, results: number, durationMs: number): void {
    this.trackEvent('search:completed', {
      query,
      resultCount: results,
      durationMs
    });
  }
  
  /**
   * Track search error
   */
  public trackSearchError(query: string, error: string): void {
    this.trackEvent('search:error', {
      query,
      error
    });
  }
  
  /**
   * Track a search result selection
   */
  public trackResultSelected(resultId: string, position: number, resultType: string): void {
    this.trackEvent('search:result_selected', {
      resultId,
      position,
      resultType
    });
  }
  
  /**
   * Track news item click
   */
  public trackNewsItemClicked(newsId: string, category: string, source: string): void {
    this.trackEvent('news:item_clicked', {
      newsId,
      category,
      source
    });
  }
  
  /**
   * Track user feedback
   */
  public trackFeedback(type: 'positive' | 'negative', itemId: string, comment?: string): void {
    this.trackEvent(`feedback:${type}`, {
      itemId,
      comment
    });
  }
  
  /**
   * Get analytics data for a specific period
   */
  public getAnalyticsData(options: {
    startDate?: Date;
    endDate?: Date;
    eventTypes?: AnalyticsEventType[];
  } = {}): AnalyticsEvent[] {
    if (!this.isInitialized) {
      this.loadEvents();
    }
    
    const { startDate, endDate, eventTypes } = options;
    
    return this.events.filter(event => {
      const eventDate = new Date(event.timestamp);
      
      // Filter by date range if specified
      if (startDate && eventDate < startDate) {
        return false;
      }
      
      if (endDate && eventDate > endDate) {
        return false;
      }
      
      // Filter by event types if specified
      if (eventTypes && !eventTypes.includes(event.type)) {
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * Get analytics summary
   */
  public getAnalyticsSummary(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    searchMetrics: {
      totalSearches: number;
      averageResultCount: number;
      errorRate: number;
      topQueries: Array<{ query: string; count: number }>;
    };
    userEngagement: {
      clickThroughRate: number;
      feedbackRate: number;
      positiveFeedbackRate: number;
    };
  } {
    if (!this.isInitialized) {
      this.loadEvents();
    }
    
    // Count events by type
    const eventsByType: Record<string, number> = {};
    this.events.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    });
    
    // Search metrics
    const searchStartedEvents = this.events.filter(e => e.type === 'search:started');
    const searchCompletedEvents = this.events.filter(e => e.type === 'search:completed');
    const searchErrorEvents = this.events.filter(e => e.type === 'search:error');
    const resultSelectedEvents = this.events.filter(e => e.type === 'search:result_selected');
    
    // Count search queries
    const queryCount: Record<string, number> = {};
    searchStartedEvents.forEach(event => {
      const query = event.data.query || '';
      queryCount[query] = (queryCount[query] || 0) + 1;
    });
    
    // Get top queries
    const topQueries = Object.entries(queryCount)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Calculate metrics
    const totalSearches = searchStartedEvents.length;
    
    // Average result count
    const totalResults = searchCompletedEvents.reduce((sum, event) => sum + (event.data.resultCount || 0), 0);
    const averageResultCount = totalSearches > 0 ? totalResults / searchCompletedEvents.length : 0;
    
    // Error rate
    const errorRate = totalSearches > 0 ? searchErrorEvents.length / totalSearches : 0;
    
    // Click-through rate
    const clickThroughRate = searchCompletedEvents.length > 0 
      ? resultSelectedEvents.length / searchCompletedEvents.length 
      : 0;
    
    // Feedback
    const feedbackEvents = this.events.filter(e => e.type.startsWith('feedback:'));
    const positiveFeedbackEvents = this.events.filter(e => e.type === 'feedback:positive');
    
    const feedbackRate = totalSearches > 0 ? feedbackEvents.length / totalSearches : 0;
    const positiveFeedbackRate = feedbackEvents.length > 0 
      ? positiveFeedbackEvents.length / feedbackEvents.length 
      : 0;
    
    return {
      totalEvents: this.events.length,
      eventsByType,
      searchMetrics: {
        totalSearches,
        averageResultCount,
        errorRate,
        topQueries
      },
      userEngagement: {
        clickThroughRate,
        feedbackRate,
        positiveFeedbackRate
      }
    };
  }
  
  /**
   * Clear all analytics data
   */
  public clearAnalytics(): void {
    this.events = [];
    this.saveEvents();
    
    if (this.options.debugMode) {
      console.log('Cleared Perplexity analytics data');
    }
  }
  
  /**
   * Update analytics options
   */
  public updateOptions(options: Partial<AnalyticsOptions>): void {
    this.options = {
      ...this.options,
      ...options
    };
    
    if (this.options.debugMode) {
      console.log('Updated Perplexity analytics options:', this.options);
    }
  }
}

// Create a singleton instance
const perplexityAnalytics = new PerplexityAnalytics();

export default perplexityAnalytics;