import Redis from 'ioredis';
import { createHash } from 'crypto';

export interface DataProduct {
  id: string;
  namespace: string;
  version: string;
  entityName: string;
  entities: Record<string, any>;
  associations?: Array<{
    from: string;
    to: string;
  }>;
  metadata?: Record<string, any>;
}

export class RedisDataStore {
  private redis: Redis | null;
  
  constructor(redisUrl?: string) {
    try {
      this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');
    } catch (error) {
      console.warn('Redis not available, using in-memory fallback');
      this.redis = null;
    }
  }
  
  private inMemoryStore: Map<string, any> = new Map();

  /**
   * Generate a unique key for a data product
   */
  private generateKey(namespace: string, entityName: string, version: string): string {
    return `dp:${namespace}:${entityName}:${version}`;
  }

  /**
   * Store a data product in Redis
   */
  async storeDataProduct(dataProduct: DataProduct): Promise<void> {
    const key = this.generateKey(dataProduct.namespace, dataProduct.entityName, dataProduct.version);
    
    if (!this.redis) {
      this.inMemoryStore.set(key, dataProduct);
      return;
    }
    
    // Store main data product
    await this.redis.set(key, JSON.stringify(dataProduct), 'EX', 86400); // 24 hour expiry
    
    // Store in indices
    await this.addToIndex('namespace', dataProduct.namespace, key);
    await this.addToIndex('entity', dataProduct.entityName, key);
    await this.addToIndex('version', dataProduct.version, key);
    
    // Store associations if any
    if (dataProduct.associations) {
      for (const association of dataProduct.associations) {
        await this.storeAssociation(association);
      }
    }
  }

  /**
   * Retrieve a data product by key
   */
  async getDataProduct(namespace: string, entityName: string, version: string): Promise<DataProduct | null> {
    const key = this.generateKey(namespace, entityName, version);
    const data = await this.redis.get(key);
    
    return data ? JSON.parse(data) : null;
  }

  /**
   * Search data products by criteria
   */
  async searchDataProducts(criteria: {
    namespace?: string;
    entityName?: string;
    version?: string;
  }): Promise<DataProduct[]> {
    let keys: string[] = [];
    
    if (criteria.namespace) {
      keys = await this.getFromIndex('namespace', criteria.namespace);
    } else if (criteria.entityName) {
      keys = await this.getFromIndex('entity', criteria.entityName);
    } else if (criteria.version) {
      keys = await this.getFromIndex('version', criteria.version);
    } else {
      // Get all data products
      keys = await this.redis.keys('dp:*');
    }
    
    const products: DataProduct[] = [];
    
    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        products.push(JSON.parse(data));
      }
    }
    
    return products;
  }

  /**
   * Store association between entities
   */
  private async storeAssociation(association: { from: string; to: string }): Promise<void> {
    const key = `assoc:${association.from}:${association.to}`;
    await this.redis.set(key, JSON.stringify(association), 'EX', 86400);
    
    // Create bidirectional indices
    await this.redis.sadd(`assoc:from:${association.from}`, association.to);
    await this.redis.sadd(`assoc:to:${association.to}`, association.from);
  }

  /**
   * Get associations for an entity
   */
  async getAssociations(entityName: string, direction: 'from' | 'to' = 'from'): Promise<string[]> {
    const key = `assoc:${direction}:${entityName}`;
    return await this.redis.smembers(key);
  }

  /**
   * Add to index
   */
  private async addToIndex(indexType: string, value: string, key: string): Promise<void> {
    await this.redis.sadd(`idx:${indexType}:${value}`, key);
  }

  /**
   * Get from index
   */
  private async getFromIndex(indexType: string, value: string): Promise<string[]> {
    return await this.redis.smembers(`idx:${indexType}:${value}`);
  }

  /**
   * Clear all data
   */
  async clear(): Promise<void> {
    const keys = await this.redis.keys('dp:*');
    const indexKeys = await this.redis.keys('idx:*');
    const assocKeys = await this.redis.keys('assoc:*');
    
    const allKeys = [...keys, ...indexKeys, ...assocKeys];
    
    if (allKeys.length > 0) {
      await this.redis.del(...allKeys);
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }

  /**
   * Search for keys matching a pattern
   */
  async searchKeys(pattern: string): Promise<string[]> {
    try {
      if (this.redis) {
        const keys = await this.redis.keys(pattern);
        return keys;
      }
      // Fallback to in-memory store
      const keys = Array.from(this.inMemoryStore.keys()).filter(key => 
        key.includes(pattern.replace(/\*/g, ''))
      );
      return keys;
    } catch (error) {
      console.error('Error searching keys:', error);
      return [];
    }
  }

  /**
   * Get raw value from store (compatibility method)
   */
  async get(key: string): Promise<any> {
    try {
      if (this.redis) {
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
      }
      return this.inMemoryStore.get(key) || null;
    } catch (error) {
      console.error('Error getting key:', error);
      return null;
    }
  }

  /**
   * Disconnect from Redis (alias for close)
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (this.redis) {
        await this.redis.ping();
        return true;
      }
      return true; // In-memory store always available
    } catch (error) {
      return false;
    }
  }
}

export default RedisDataStore;