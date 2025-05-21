/**
 * Rate limiter service for Perplexity API
 * 
 * Tracks API usage and enforces rate limits to prevent quota exhaustion
 */

export interface RateLimiterOptions {
  maxRequestsPerMinute?: number;
  maxRequestsPerHour?: number;
  maxRequestsPerDay?: number;
  maxTokensPerDay?: number;
  storageKey?: string;
  debugMode?: boolean;
}

export interface UsageMetrics {
  requestsLast24h: number;
  requestsLastHour: number;
  requestsLastMinute: number;
  tokensUsed24h: number;
  history: UsageRecord[];
  quotaResets: string; // ISO date string
}

interface UsageRecord {
  timestamp: string;
  endpoint: string;
  tokens: number;
  model: string;
  success: boolean;
  latencyMs: number;
}

class PerplexityRateLimiter {
  private options: Required<RateLimiterOptions>;
  private usageMetrics: UsageMetrics;
  private isInitialized: boolean = false;
  
  constructor(options: RateLimiterOptions = {}) {
    // Default options
    this.options = {
      maxRequestsPerMinute: options.maxRequestsPerMinute || 10,
      maxRequestsPerHour: options.maxRequestsPerHour || 120,
      maxRequestsPerDay: options.maxRequestsPerDay || 1000,
      maxTokensPerDay: options.maxTokensPerDay || 100000,
      storageKey: options.storageKey || 'perplexity_usage_metrics',
      debugMode: options.debugMode || false
    };
    
    // Default usage metrics
    this.usageMetrics = {
      requestsLast24h: 0,
      requestsLastHour: 0,
      requestsLastMinute: 0,
      tokensUsed24h: 0,
      history: [],
      quotaResets: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    // Initialize metrics from storage if available
    this.loadMetrics();
  }
  
  /**
   * Load metrics from localStorage (safely)
   */
  private loadMetrics(): void {
    try {
      // Check if window is defined (client-side only)
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedMetrics = window.localStorage.getItem(this.options.storageKey);
        if (storedMetrics) {
          this.usageMetrics = JSON.parse(storedMetrics);
          
          // Clean up old records and recalculate metrics
          this.cleanupOldRecords();
        }
      }
      
      // Mark as initialized regardless of storage access
      this.isInitialized = true;
    } catch (error) {
      console.error('Error loading rate limiter metrics:', error);
      this.isInitialized = true;
    }
    
    // Log metrics in debug mode (client-side only)
    if (this.options.debugMode && typeof window !== 'undefined') {
      console.log('Perplexity rate limiter initialized with metrics:', this.usageMetrics);
    }
  }
  
  /**
   * Save metrics to localStorage (safely)
   */
  private saveMetrics(): void {
    try {
      // Check if window is defined (client-side only)
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.options.storageKey, JSON.stringify(this.usageMetrics));
      }
    } catch (error) {
      console.error('Error saving rate limiter metrics:', error);
    }
  }
  
  /**
   * Clean up old records and recalculate metrics
   */
  private cleanupOldRecords(): void {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneMinuteAgo = now - 60 * 1000;
    
    // Filter records to keep only those from the last 24 hours
    this.usageMetrics.history = this.usageMetrics.history.filter(record => {
      return new Date(record.timestamp).getTime() > oneDayAgo;
    });
    
    // Recalculate metrics based on filtered history
    this.usageMetrics.requestsLast24h = this.usageMetrics.history.length;
    this.usageMetrics.requestsLastHour = this.usageMetrics.history.filter(record => {
      return new Date(record.timestamp).getTime() > oneHourAgo;
    }).length;
    this.usageMetrics.requestsLastMinute = this.usageMetrics.history.filter(record => {
      return new Date(record.timestamp).getTime() > oneMinuteAgo;
    }).length;
    this.usageMetrics.tokensUsed24h = this.usageMetrics.history.reduce((sum, record) => {
      return sum + record.tokens;
    }, 0);
    
    // Check if the quota reset time has passed
    const quotaResetTime = new Date(this.usageMetrics.quotaResets).getTime();
    if (quotaResetTime < now) {
      // Reset quota and set new reset time
      this.usageMetrics.quotaResets = new Date(now + 24 * 60 * 60 * 1000).toISOString();
    }
    
    // Save updated metrics
    this.saveMetrics();
  }
  
  /**
   * Check if a request can be made without exceeding rate limits
   */
  public canMakeRequest(): boolean {
    if (!this.isInitialized) {
      // If not initialized, load metrics first
      this.loadMetrics();
    }
    
    // Clean up old records and recalculate metrics
    this.cleanupOldRecords();
    
    // Check rate limits
    const exceedsMinuteLimit = this.usageMetrics.requestsLastMinute >= this.options.maxRequestsPerMinute;
    const exceedsHourLimit = this.usageMetrics.requestsLastHour >= this.options.maxRequestsPerHour;
    const exceedsDayLimit = this.usageMetrics.requestsLast24h >= this.options.maxRequestsPerDay;
    const exceedsTokenLimit = this.usageMetrics.tokensUsed24h >= this.options.maxTokensPerDay;
    
    const canMake = !exceedsMinuteLimit && !exceedsHourLimit && !exceedsDayLimit && !exceedsTokenLimit;
    
    if (this.options.debugMode) {
      console.log('Rate limiter check:', { 
        canMake, 
        exceedsMinuteLimit, 
        exceedsHourLimit, 
        exceedsDayLimit, 
        exceedsTokenLimit,
        metrics: {
          requestsLastMinute: this.usageMetrics.requestsLastMinute,
          requestsLastHour: this.usageMetrics.requestsLastHour,
          requestsLast24h: this.usageMetrics.requestsLast24h,
          tokensUsed24h: this.usageMetrics.tokensUsed24h
        },
        limits: {
          maxRequestsPerMinute: this.options.maxRequestsPerMinute,
          maxRequestsPerHour: this.options.maxRequestsPerHour,
          maxRequestsPerDay: this.options.maxRequestsPerDay,
          maxTokensPerDay: this.options.maxTokensPerDay
        }
      });
    }
    
    return canMake;
  }
  
  /**
   * Get the time to wait in milliseconds before making the next request
   */
  public getTimeToWaitMs(): number {
    if (!this.isInitialized) {
      // If not initialized, load metrics first
      this.loadMetrics();
    }
    
    // Clean up old records and recalculate metrics
    this.cleanupOldRecords();
    
    if (this.canMakeRequest()) {
      return 0; // No need to wait
    }
    
    let timeToWait = 0;
    
    // Calculate time to wait based on minute limit
    if (this.usageMetrics.requestsLastMinute >= this.options.maxRequestsPerMinute) {
      // Find the timestamp of the oldest request within the last minute
      const minuteRecords = [...this.usageMetrics.history]
        .filter(record => new Date(record.timestamp).getTime() > Date.now() - 60 * 1000)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      if (minuteRecords.length > 0) {
        const oldestTimestamp = new Date(minuteRecords[0].timestamp).getTime();
        const waitForMinute = (oldestTimestamp + 60 * 1000) - Date.now();
        timeToWait = Math.max(timeToWait, waitForMinute);
      }
    }
    
    // Calculate time to wait based on hour limit
    if (this.usageMetrics.requestsLastHour >= this.options.maxRequestsPerHour) {
      // Find the timestamp of the oldest request within the last hour
      const hourRecords = [...this.usageMetrics.history]
        .filter(record => new Date(record.timestamp).getTime() > Date.now() - 60 * 60 * 1000)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      if (hourRecords.length > 0) {
        const oldestTimestamp = new Date(hourRecords[0].timestamp).getTime();
        const waitForHour = (oldestTimestamp + 60 * 60 * 1000) - Date.now();
        timeToWait = Math.max(timeToWait, waitForHour);
      }
    }
    
    // Calculate time to wait based on day limit
    if (this.usageMetrics.requestsLast24h >= this.options.maxRequestsPerDay ||
        this.usageMetrics.tokensUsed24h >= this.options.maxTokensPerDay) {
      // Find the timestamp of the oldest request within the last 24 hours
      const dayRecords = [...this.usageMetrics.history]
        .filter(record => new Date(record.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      if (dayRecords.length > 0) {
        const oldestTimestamp = new Date(dayRecords[0].timestamp).getTime();
        const waitForDay = (oldestTimestamp + 24 * 60 * 60 * 1000) - Date.now();
        timeToWait = Math.max(timeToWait, waitForDay);
      }
    }
    
    // Add small buffer to avoid immediate retries at the limit edge
    const waitWithBuffer = Math.max(0, timeToWait) + 500; 
    
    if (this.options.debugMode) {
      console.log(`Rate limit waiting time: ${waitWithBuffer}ms`);
    }
    
    return waitWithBuffer;
  }
  
  /**
   * Record a request to the Perplexity API
   */
  public recordRequest(params: {
    endpoint: string;
    tokens: number;
    model: string;
    startTime: number;
    success: boolean;
  }): void {
    if (!this.isInitialized) {
      // If not initialized, load metrics first
      this.loadMetrics();
    }
    
    const { endpoint, tokens, model, startTime, success } = params;
    const latencyMs = Date.now() - startTime;
    
    // Create a new usage record
    const record: UsageRecord = {
      timestamp: new Date().toISOString(),
      endpoint,
      tokens,
      model,
      success,
      latencyMs
    };
    
    // Add record to history
    this.usageMetrics.history.push(record);
    
    // Update metrics
    this.usageMetrics.requestsLast24h += 1;
    this.usageMetrics.requestsLastHour += 1;
    this.usageMetrics.requestsLastMinute += 1;
    this.usageMetrics.tokensUsed24h += tokens;
    
    // Save updated metrics
    this.saveMetrics();
    
    // Log metrics in debug mode
    if (this.options.debugMode) {
      console.log('Recorded Perplexity API request:', record);
      console.log('Updated metrics:', this.usageMetrics);
    }
  }
  
  /**
   * Get current usage metrics
   */
  public getMetrics(): UsageMetrics {
    if (!this.isInitialized) {
      // If not initialized, load metrics first
      this.loadMetrics();
    }
    
    // Clean up old records and recalculate metrics
    this.cleanupOldRecords();
    
    return { ...this.usageMetrics };
  }
  
  /**
   * Get usage limits
   */
  public getLimits(): {
    maxRequestsPerMinute: number;
    maxRequestsPerHour: number;
    maxRequestsPerDay: number;
    maxTokensPerDay: number;
  } {
    return {
      maxRequestsPerMinute: this.options.maxRequestsPerMinute,
      maxRequestsPerHour: this.options.maxRequestsPerHour,
      maxRequestsPerDay: this.options.maxRequestsPerDay,
      maxTokensPerDay: this.options.maxTokensPerDay
    };
  }
  
  /**
   * Reset usage metrics
   */
  public resetMetrics(): void {
    this.usageMetrics = {
      requestsLast24h: 0,
      requestsLastHour: 0,
      requestsLastMinute: 0,
      tokensUsed24h: 0,
      history: [],
      quotaResets: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    this.saveMetrics();
    
    if (this.options.debugMode) {
      console.log('Perplexity rate limiter metrics reset');
    }
  }
  
  /**
   * Update rate limiter options
   */
  public updateOptions(options: Partial<RateLimiterOptions>): void {
    this.options = {
      ...this.options,
      ...options
    };
    
    if (this.options.debugMode) {
      console.log('Perplexity rate limiter options updated:', this.options);
    }
  }
}

// Create a singleton instance
const perplexityRateLimiter = new PerplexityRateLimiter();

export default perplexityRateLimiter;