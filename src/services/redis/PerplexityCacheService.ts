/**
 * Perplexity Cache Service for SCB Sapphire Application
 * Provides specialized caching for Perplexity.ai data and queries
 */

import { CacheService } from './CacheService';
import { getRedisClient } from './RedisClient';
import { RedisConfig } from './RedisConfig';
import crypto from 'crypto';

/**
 * Type for Perplexity query parameters
 */
export interface PerplexityQueryParams {
  query: string;
  options?: Record<string, any>;
}

/**
 * Cache service specialized for Perplexity.ai data
 */
export class PerplexityCacheService {
  // TTL for different types of Perplexity data
  private static readonly TTL = {
    // Market data from Perplexity expires quickly
    MARKET_DATA: 5 * 60, // 5 minutes
    
    // Company information can be cached longer
    COMPANY_INFO: 24 * 60 * 60, // 1 day
    
    // Financial metrics are updated less frequently
    FINANCIAL_METRICS: 12 * 60 * 60, // 12 hours
    
    // News and sentiment analysis
    NEWS: 30 * 60, // 30 minutes
    
    // Default TTL for other queries
    DEFAULT: 60 * 60 // 1 hour
  };
  
  /**
   * Generates a cache key for a Perplexity query
   */
  private static generateQueryKey(params: PerplexityQueryParams): string {
    // Create hash of the query parameters
    const hash = crypto
      .createHash('md5')
      .update(JSON.stringify({
        query: params.query,
        options: params.options || {}
      }))
      .digest('hex');
    
    // Determine query type for better key organization
    const queryLower = params.query.toLowerCase();
    let category = 'general';
    
    if (queryLower.includes('market') || queryLower.includes('stock') || queryLower.includes('price')) {
      category = 'market';
    } else if (queryLower.includes('company') || queryLower.includes('organization')) {
      category = 'company';
    } else if (queryLower.includes('financial') || queryLower.includes('revenue') || 
               queryLower.includes('profit') || queryLower.includes('earnings')) {
      category = 'financial';
    } else if (queryLower.includes('news') || queryLower.includes('announcement') || 
               queryLower.includes('report')) {
      category = 'news';
    }
    
    return `${category}_${hash}`;
  }
  
  /**
   * Determines the appropriate TTL based on query content
   */
  private static getQueryTtl(query: string): number {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('market') || queryLower.includes('stock price') || 
        queryLower.includes('current price') || queryLower.includes('trending')) {
      return this.TTL.MARKET_DATA;
    }
    
    if (queryLower.includes('company') || queryLower.includes('business') || 
        queryLower.includes('corporation') || queryLower.includes('enterprise')) {
      return this.TTL.COMPANY_INFO;
    }
    
    if (queryLower.includes('financial') || queryLower.includes('revenue') || 
        queryLower.includes('profit') || queryLower.includes('earnings') || 
        queryLower.includes('balance sheet')) {
      return this.TTL.FINANCIAL_METRICS;
    }
    
    if (queryLower.includes('news') || queryLower.includes('recent') || 
        queryLower.includes('announcement') || queryLower.includes('published')) {
      return this.TTL.NEWS;
    }
    
    return this.TTL.DEFAULT;
  }
  
  /**
   * Caches a Perplexity query result
   * @param params The query parameters
   * @param result The result to cache
   * @param customTtl Optional custom TTL in seconds
   */
  public static async cacheQueryResult(
    params: PerplexityQueryParams, 
    result: any, 
    customTtl?: number
  ): Promise<void> {
    const key = this.generateQueryKey(params);
    const ttl = customTtl || this.getQueryTtl(params.query);
    
    await CacheService.set(key, result, 'perplexity', ttl);
  }
  
  /**
   * Retrieves a cached Perplexity query result
   * @param params The query parameters
   * @returns The cached result or null if not found
   */
  public static async getCachedQueryResult<T = any>(params: PerplexityQueryParams): Promise<T | null> {
    const key = this.generateQueryKey(params);
    return await CacheService.get<T>(key, 'perplexity');
  }
  
  /**
   * Clears a specific cached query result
   * @param params The query parameters
   */
  public static async clearCachedQuery(params: PerplexityQueryParams): Promise<void> {
    const key = this.generateQueryKey(params);
    await CacheService.delete(key, 'perplexity');
  }
  
  /**
   * Clears all cached Perplexity data
   */
  public static async clearAllCache(): Promise<void> {
    await CacheService.clearType('perplexity');
  }
  
  /**
   * Executes a Perplexity query with caching
   * @param params The query parameters
   * @param queryFn The function that executes the actual query
   * @param bypassCache Whether to bypass the cache
   * @returns The query result
   */
  public static async executeWithCache<T = any>(
    params: PerplexityQueryParams,
    queryFn: () => Promise<T>,
    bypassCache: boolean = false
  ): Promise<T> {
    // Check cache first if not bypassing
    if (!bypassCache) {
      const cachedResult = await this.getCachedQueryResult<T>(params);
      if (cachedResult !== null) {
        return cachedResult;
      }
    }
    
    // Execute the actual query
    const result = await queryFn();
    
    // Cache the result
    await this.cacheQueryResult(params, result);
    
    return result;
  }
  
  /**
   * Clears cached data for a specific company
   * @param companyIdentifier Company name, code, or identifier
   */
  public static async clearCompanyCache(companyIdentifier: string): Promise<void> {
    try {
      const client = getRedisClient();
      const pattern = `${RedisConfig.keyPrefix.perplexity}*${companyIdentifier}*`;
      
      // Scan and delete all keys matching the pattern
      let cursor = '0';
      do {
        const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        
        if (keys.length > 0) {
          await client.del(...keys);
        }
      } while (cursor !== '0');
      
    } catch (error) {
      console.error(`Error clearing company cache for ${companyIdentifier}:`, error);
    }
  }
}