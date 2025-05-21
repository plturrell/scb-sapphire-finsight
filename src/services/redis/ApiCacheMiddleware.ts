/**
 * API Cache Middleware for SCB Sapphire Application
 * Provides caching middleware for Next.js API routes
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { CacheService } from './CacheService';
import { getRedisClient } from './RedisClient';
import { RedisConfig } from './RedisConfig';
import crypto from 'crypto';

/**
 * Options for the API cache middleware
 */
export interface ApiCacheOptions {
  // TTL in seconds
  ttl?: number;
  // Cache data type
  type?: 'financial' | 'market' | 'company' | 'preferences' | 'query' | 'perplexity' | 'default';
  // Headers to include in cache key generation
  includeHeaders?: string[];
  // Whether to include all query parameters in cache key
  includeQueryParams?: boolean;
  // Specific query parameters to include in cache key
  includeSpecificQueryParams?: string[];
  // Function to determine if request should be cached
  shouldCache?: (req: NextApiRequest) => boolean;
}

/**
 * Generates a cache key for an API request
 */
const generateApiCacheKey = (req: NextApiRequest, options: ApiCacheOptions): string => {
  const url = req.url || '';
  const method = req.method || 'GET';
  const path = url.split('?')[0];
  
  // Start with base components
  const keyComponents: any[] = [method, path];
  
  // Add query parameters if specified
  if (options.includeQueryParams) {
    keyComponents.push(req.query);
  } else if (options.includeSpecificQueryParams && options.includeSpecificQueryParams.length > 0) {
    const filteredQuery = Object.keys(req.query)
      .filter(key => options.includeSpecificQueryParams?.includes(key))
      .reduce((obj, key) => {
        obj[key] = req.query[key];
        return obj;
      }, {} as Record<string, any>);
    
    keyComponents.push(filteredQuery);
  }
  
  // Add specified headers if any
  if (options.includeHeaders && options.includeHeaders.length > 0) {
    const filteredHeaders = options.includeHeaders.reduce((obj, header) => {
      const headerValue = req.headers[header.toLowerCase()];
      if (headerValue) {
        obj[header] = headerValue;
      }
      return obj;
    }, {} as Record<string, any>);
    
    keyComponents.push(filteredHeaders);
  }
  
  // Create a hash of all components
  const hash = crypto
    .createHash('md5')
    .update(JSON.stringify(keyComponents))
    .digest('hex');
  
  return `api_${path.replace(/\//g, '_')}_${hash}`;
};

/**
 * API cache middleware
 * @param handler The API route handler
 * @param options Cache options
 * @returns A wrapped handler with caching
 */
export const withApiCache = (
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  options: ApiCacheOptions = {}
) => {
  return async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    // Only cache GET requests by default
    if (req.method !== 'GET' && !options.shouldCache) {
      return handler(req, res);
    }
    
    // Check if we should cache this request
    if (options.shouldCache && !options.shouldCache(req)) {
      return handler(req, res);
    }
    
    const cacheKey = generateApiCacheKey(req, options);
    const cacheType = options.type || 'default';
    
    // Check if we have a cached response
    const cachedResponse = await CacheService.get(cacheKey, cacheType);
    
    if (cachedResponse) {
      // Return cached response
      const { statusCode, headers, data } = cachedResponse;
      
      // Set headers from cached response
      Object.entries(headers).forEach(([key, value]) => {
        if (key !== 'content-length') { // Skip content-length as it will be set automatically
          res.setHeader(key, value as string);
        }
      });
      
      // Set cache header to indicate cache hit
      res.setHeader('X-Cache', 'HIT');
      
      // Send cached response with correct status code
      return res.status(statusCode).json(data);
    }
    
    // No cache hit, intercept the response to cache it
    const originalJson = res.json;
    
    // Override res.json to capture the response
    res.json = function(data) {
      // Cache the response
      const responseToCache = {
        statusCode: res.statusCode,
        headers: res.getHeaders(),
        data
      };
      
      // Store in cache
      CacheService.set(
        cacheKey, 
        responseToCache, 
        cacheType, 
        options.ttl
      ).catch(err => console.error('Error caching API response:', err));
      
      // Set cache header to indicate cache miss
      res.setHeader('X-Cache', 'MISS');
      
      // Call original json method
      return originalJson.call(this, data);
    };
    
    // Call the original handler
    return handler(req, res);
  };
};

/**
 * Clears cache for a specific API path
 * @param path The API path to clear cache for
 */
export const clearApiCache = async (path: string): Promise<void> => {
  try {
    const client = getRedisClient();
    const pattern = `${RedisConfig.keyPrefix.default}api_${path.replace(/\//g, '_')}*`;
    
    // Scan and delete all keys matching the pattern
    let cursor = '0';
    do {
      const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } while (cursor !== '0');
    
    console.log(`Cleared cache for API path: ${path}`);
  } catch (error) {
    console.error(`Error clearing API cache for path ${path}:`, error);
  }
};