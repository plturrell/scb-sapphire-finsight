/**
 * Cache Service for SCB Sapphire Application
 * Provides caching functionality for application data using Redis
 */

import { getRedisClient } from './RedisClient';
import { RedisConfig } from './RedisConfig';

/**
 * Cache data types
 */
export type CacheDataType = 'financial' | 'market' | 'company' | 'preferences' | 'query' | 'perplexity' | 'default';

/**
 * Cache Service class
 */
export class CacheService {
  /**
   * Generates a cache key with the appropriate prefix based on data type
   */
  private static generateKey(key: string, type: CacheDataType = 'default'): string {
    const prefix = RedisConfig.keyPrefix[type] || RedisConfig.keyPrefix.default;
    return `${prefix}${key}`;
  }
  
  /**
   * Gets the TTL for a specific data type
   */
  private static getTtl(type: CacheDataType = 'default'): number {
    return RedisConfig.ttl[type] || RedisConfig.ttl.default;
  }
  
  /**
   * Stores data in the cache
   * @param key The cache key
   * @param data The data to cache (will be JSON stringified)
   * @param type The type of data being cached
   * @param customTtl Optional custom TTL in seconds
   */
  public static async set(key: string, data: any, type: CacheDataType = 'default', customTtl?: number): Promise<void> {
    try {
      const client = getRedisClient();
      const cacheKey = this.generateKey(key, type);
      const ttl = customTtl || this.getTtl(type);
      const serializedData = JSON.stringify(data);
      
      await client.setex(cacheKey, ttl, serializedData);
    } catch (error) {
      console.error(`Error setting cache for key ${key}:`, error);
      // Allow application to continue even if caching fails
    }
  }
  
  /**
   * Retrieves data from the cache
   * @param key The cache key
   * @param type The type of data being retrieved
   * @returns The cached data or null if not found
   */
  public static async get<T = any>(key: string, type: CacheDataType = 'default'): Promise<T | null> {
    try {
      const client = getRedisClient();
      const cacheKey = this.generateKey(key, type);
      const data = await client.get(cacheKey);
      
      if (!data) {
        return null;
      }
      
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`Error getting cache for key ${key}:`, error);
      return null;
    }
  }
  
  /**
   * Removes data from the cache
   * @param key The cache key
   * @param type The type of data being removed
   */
  public static async delete(key: string, type: CacheDataType = 'default'): Promise<void> {
    try {
      const client = getRedisClient();
      const cacheKey = this.generateKey(key, type);
      await client.del(cacheKey);
    } catch (error) {
      console.error(`Error deleting cache for key ${key}:`, error);
    }
  }
  
  /**
   * Checks if a key exists in the cache
   * @param key The cache key
   * @param type The type of data being checked
   * @returns True if the key exists, false otherwise
   */
  public static async exists(key: string, type: CacheDataType = 'default'): Promise<boolean> {
    try {
      const client = getRedisClient();
      const cacheKey = this.generateKey(key, type);
      const exists = await client.exists(cacheKey);
      return exists === 1;
    } catch (error) {
      console.error(`Error checking existence for key ${key}:`, error);
      return false;
    }
  }
  
  /**
   * Retrieves the TTL of a cached item
   * @param key The cache key
   * @param type The type of data
   * @returns The TTL in seconds or -1 if the key doesn't exist or -2 if the key exists but has no TTL
   */
  public static async getTtlForKey(key: string, type: CacheDataType = 'default'): Promise<number> {
    try {
      const client = getRedisClient();
      const cacheKey = this.generateKey(key, type);
      return await client.ttl(cacheKey);
    } catch (error) {
      console.error(`Error getting TTL for key ${key}:`, error);
      return -1;
    }
  }
  
  /**
   * Updates the TTL of a cached item
   * @param key The cache key
   * @param type The type of data
   * @param ttl The new TTL in seconds
   * @returns True if the TTL was updated, false otherwise
   */
  public static async updateTtl(key: string, type: CacheDataType = 'default', ttl?: number): Promise<boolean> {
    try {
      const client = getRedisClient();
      const cacheKey = this.generateKey(key, type);
      const newTtl = ttl || this.getTtl(type);
      const result = await client.expire(cacheKey, newTtl);
      return result === 1;
    } catch (error) {
      console.error(`Error updating TTL for key ${key}:`, error);
      return false;
    }
  }
  
  /**
   * Clears all cached items of a specific type
   * @param type The type of data to clear
   */
  public static async clearType(type: CacheDataType): Promise<void> {
    try {
      const client = getRedisClient();
      const pattern = `${RedisConfig.keyPrefix[type]}*`;
      
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
      console.error(`Error clearing cache for type ${type}:`, error);
    }
  }
  
  /**
   * Gets cache statistics
   * @returns Object with cache statistics
   */
  public static async getStats(): Promise<Record<string, any>> {
    try {
      const client = getRedisClient();
      const info = await client.info();
      
      // Parse Redis INFO command output
      const infoObj: Record<string, any> = {};
      info.split('\r\n').forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          infoObj[key] = value;
        }
      });
      
      return {
        usedMemory: infoObj.used_memory_human,
        peakMemory: infoObj.used_memory_peak_human,
        clients: infoObj.connected_clients,
        uptime: infoObj.uptime_in_seconds,
        hitRate: infoObj.keyspace_hits && infoObj.keyspace_misses
          ? parseInt(infoObj.keyspace_hits) / (parseInt(infoObj.keyspace_hits) + parseInt(infoObj.keyspace_misses))
          : 0,
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {};
    }
  }
}