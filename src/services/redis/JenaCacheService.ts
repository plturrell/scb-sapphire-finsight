/**
 * Jena Cache Service for SCB Sapphire Application
 * Provides specialized caching for SPARQL queries to the Jena triplestore
 */

import { CacheService } from './CacheService';
import crypto from 'crypto';

/**
 * Type for SPARQL query parameters
 */
export interface SparqlQueryParams {
  query: string;
  dataset?: string;
  [key: string]: any;
}

/**
 * Cache service specialized for Jena SPARQL queries
 */
export class JenaCacheService {
  /**
   * Generates a cache key for a SPARQL query
   * Uses a hash of the query and parameters to ensure uniqueness
   */
  private static generateQueryKey(params: SparqlQueryParams): string {
    // Sort keys for consistent hashing
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, any>);
    
    // Create hash of the query parameters
    const hash = crypto
      .createHash('md5')
      .update(JSON.stringify(sortedParams))
      .digest('hex');
    
    // Create a descriptive prefix based on the query type
    let prefix = 'query';
    
    const query = params.query.toLowerCase();
    if (query.includes('select')) {
      prefix = 'select';
    } else if (query.includes('construct')) {
      prefix = 'construct';
    } else if (query.includes('ask')) {
      prefix = 'ask';
    } else if (query.includes('describe')) {
      prefix = 'describe';
    }
    
    return `${prefix}_${hash}`;
  }
  
  /**
   * Determines the TTL for a query based on its type
   */
  private static getQueryTtl(query: string): number {
    const queryLower = query.toLowerCase();
    
    // Different TTLs based on query type
    if (queryLower.includes('select')) {
      if (queryLower.includes('count') || queryLower.includes('aggregate')) {
        // Aggregate queries have shorter TTL
        return 5 * 60; // 5 minutes
      }
      return 15 * 60; // 15 minutes for most SELECT queries
    }
    
    if (queryLower.includes('ask')) {
      return 10 * 60; // 10 minutes for ASK queries
    }
    
    if (queryLower.includes('construct') || queryLower.includes('describe')) {
      return 30 * 60; // 30 minutes for CONSTRUCT/DESCRIBE queries (graph data)
    }
    
    // Default TTL
    return 15 * 60; // 15 minutes
  }
  
  /**
   * Caches a SPARQL query result
   * @param params The SPARQL query parameters
   * @param result The query result to cache
   * @param customTtl Optional custom TTL in seconds
   */
  public static async cacheQueryResult(
    params: SparqlQueryParams, 
    result: any, 
    customTtl?: number
  ): Promise<void> {
    const key = this.generateQueryKey(params);
    const ttl = customTtl || this.getQueryTtl(params.query);
    
    await CacheService.set(key, result, 'query', ttl);
  }
  
  /**
   * Retrieves a cached SPARQL query result
   * @param params The SPARQL query parameters
   * @returns The cached result or null if not found
   */
  public static async getCachedQueryResult<T = any>(params: SparqlQueryParams): Promise<T | null> {
    const key = this.generateQueryKey(params);
    return await CacheService.get<T>(key, 'query');
  }
  
  /**
   * Clears a specific cached query result
   * @param params The SPARQL query parameters
   */
  public static async clearCachedQuery(params: SparqlQueryParams): Promise<void> {
    const key = this.generateQueryKey(params);
    await CacheService.delete(key, 'query');
  }
  
  /**
   * Clears all cached SPARQL query results
   */
  public static async clearAllQueryCache(): Promise<void> {
    await CacheService.clearType('query');
  }
  
  /**
   * Executes a SPARQL query with caching
   * @param params The SPARQL query parameters
   * @param queryFn The function that executes the actual query
   * @param bypassCache Whether to bypass the cache
   * @returns The query result
   */
  public static async executeWithCache<T = any>(
    params: SparqlQueryParams,
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
}