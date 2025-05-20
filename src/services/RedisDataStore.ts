import Redis from 'ioredis';
import { createHash } from 'crypto';
import { TariffAlert } from '../types';

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

export interface Notification {
  id: string;
  type: 'alert' | 'success' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority?: string;
  actionUrl?: string;
  data?: any;
}

export class RedisDataStore {
  private redis: Redis | null;
  private static instance: RedisDataStore;
  
  constructor(redisUrl?: string) {
    try {
      this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');
      this.setupEventHandlers();
    } catch (error) {
      console.warn('Redis not available, using in-memory fallback');
      this.redis = null;
    }
  }
  
  private inMemoryStore: Map<string, any> = new Map();

  /**
   * Get singleton instance
   */
  public static getInstance(): RedisDataStore {
    if (!RedisDataStore.instance) {
      RedisDataStore.instance = new RedisDataStore();
    }
    return RedisDataStore.instance;
  }

  /**
   * Set up Redis client event handlers
   */
  private setupEventHandlers() {
    if (!this.redis) return;
    
    this.redis.on('connect', () => {
      console.log('Redis client connected');
    });
    
    this.redis.on('error', (err) => {
      console.error('Redis client error:', err);
    });
    
    this.redis.on('reconnecting', () => {
      console.log('Redis client reconnecting');
    });
  }

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
    if (!this.redis) {
      const key = this.generateKey(namespace, entityName, version);
      return this.inMemoryStore.get(key) || null;
    }
    
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
    if (!this.redis) {
      // In-memory fallback for data products search
      const products: DataProduct[] = [];
      for (const [key, value] of this.inMemoryStore.entries()) {
        if (key.startsWith('dp:')) {
          if (
            (!criteria.namespace || key.includes(`:${criteria.namespace}:`)) &&
            (!criteria.entityName || key.includes(`:${criteria.entityName}:`)) &&
            (!criteria.version || key.includes(`:${criteria.version}`))
          ) {
            products.push(value);
          }
        }
      }
      return products;
    }
    
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
    if (!this.redis) {
      const key = `assoc:${association.from}:${association.to}`;
      this.inMemoryStore.set(key, association);
      return;
    }
    
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
    if (!this.redis) {
      // In-memory fallback for associations
      const associations: string[] = [];
      const prefix = `assoc:${direction}:${entityName}`;
      
      for (const [key, value] of this.inMemoryStore.entries()) {
        if (key.startsWith(prefix)) {
          associations.push(value);
        }
      }
      
      return associations;
    }
    
    const key = `assoc:${direction}:${entityName}`;
    return await this.redis.smembers(key);
  }

  /**
   * Add to index
   */
  private async addToIndex(indexType: string, value: string, key: string): Promise<void> {
    if (!this.redis) return;
    await this.redis.sadd(`idx:${indexType}:${value}`, key);
  }

  /**
   * Get from index
   */
  private async getFromIndex(indexType: string, value: string): Promise<string[]> {
    if (!this.redis) return [];
    return await this.redis.smembers(`idx:${indexType}:${value}`);
  }

  /**
   * Clear all data
   */
  async clear(): Promise<void> {
    if (!this.redis) {
      this.inMemoryStore.clear();
      return;
    }
    
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
    if (this.redis) {
      await this.redis.quit();
    }
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
   * Set raw value in store (compatibility method)
   */
  async set(key: string, value: any, expiry?: number): Promise<boolean> {
    try {
      if (this.redis) {
        const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
        if (expiry) {
          await this.redis.set(key, valueStr, 'EX', expiry);
        } else {
          await this.redis.set(key, valueStr);
        }
        return true;
      }
      this.inMemoryStore.set(key, value);
      return true;
    } catch (error) {
      console.error('Error setting key:', error);
      return false;
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

  /**
   * Store a notification
   */
  async storeNotification(notification: Notification): Promise<string> {
    const id = notification.id || `notification-${Date.now()}`;
    const timestamp = Date.now();

    // Add id if missing
    const notificationToStore = {
      ...notification,
      id,
      timestamp: notification.timestamp || new Date().toISOString()
    };

    try {
      if (this.redis) {
        // Store notification as hash
        await this.redis.hset(`notification:${id}`, notificationToStore as any);
        
        // Add to sorted set for time-based retrieval
        await this.redis.zadd('notifications', timestamp, id);
        
        // If notification has priority, add to priority set
        if (notification.priority) {
          await this.redis.sadd(`notification:priority:${notification.priority.toLowerCase()}`, id);
        }
      } else {
        // Store in memory
        this.inMemoryStore.set(`notification:${id}`, notificationToStore);
      }
      
      return id;
    } catch (error) {
      console.error('Error storing notification:', error);
      throw error;
    }
  }

  /**
   * Get notifications with pagination
   */
  async getNotifications(
    page: number = 1, 
    limit: number = 20,
    filter?: Record<string, any>
  ): Promise<{ notifications: Notification[], total: number, page: number, pages: number }> {
    try {
      if (!this.redis) {
        // In-memory fallback
        const notificationEntries = Array.from(this.inMemoryStore.entries())
          .filter(([key]) => key.startsWith('notification:') && !key.includes(':priority:'))
          .map(([_, value]) => value as Notification)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        // Apply filters if provided
        const filteredNotifications = filter 
          ? notificationEntries.filter(notification => 
              Object.entries(filter).every(([key, value]) => 
                notification[key as keyof Notification] === value
              )
            )
          : notificationEntries;
        
        // Apply pagination
        const start = (page - 1) * limit;
        const end = start + limit;
        const paginatedNotifications = filteredNotifications.slice(start, end);
        
        return {
          notifications: paginatedNotifications,
          total: filteredNotifications.length,
          page,
          pages: Math.ceil(filteredNotifications.length / limit)
        };
      }
      
      // Using Redis
      let total: number;
      let notificationIds: string[] = [];
      
      // If filter is applied, we need to use a different approach
      if (filter && Object.keys(filter).length > 0) {
        // Get all notification IDs from the sorted set
        const allIds = await this.redis.zrevrange('notifications', 0, -1);
        
        // Pipeline to get all notifications
        const pipeline = this.redis.pipeline();
        allIds.forEach(id => {
          pipeline.hgetall(`notification:${id}`);
        });
        
        const results = await pipeline.exec();
        
        // Filter notifications
        const filteredNotifications = results
          .map(result => result[1])
          .filter((notification: any) => {
            return Object.entries(filter).every(([key, value]) => 
              notification[key] === value
            );
          });
        
        total = filteredNotifications.length;
        
        // Apply pagination to filtered results
        const start = (page - 1) * limit;
        const end = Math.min(start + limit, total);
        const paginatedNotifications = filteredNotifications.slice(start, end);
        
        return {
          notifications: paginatedNotifications.map(n => this.convertRedisObjectToNotification(n)),
          total,
          page,
          pages: Math.ceil(total / limit)
        };
      }
      
      // No filter, use standard pagination with sorted set
      total = await this.redis.zcard('notifications');
      
      // Calculate range for pagination
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      
      // Get notification IDs in range (sorted by timestamp desc)
      notificationIds = await this.redis.zrevrange('notifications', start, end);
      
      if (notificationIds.length === 0) {
        return {
          notifications: [],
          total,
          page,
          pages: Math.ceil(total / limit)
        };
      }
      
      // Get notification objects
      const pipeline = this.redis.pipeline();
      notificationIds.forEach(id => {
        pipeline.hgetall(`notification:${id}`);
      });
      
      const results = await pipeline.exec();
      
      // Extract notifications from results
      const notifications = results
        .map(result => result[1])
        .filter(Boolean)
        .map(notification => this.convertRedisObjectToNotification(notification));
      
      return {
        notifications,
        total,
        page,
        pages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error getting notifications:', error);
      return {
        notifications: [],
        total: 0,
        page,
        pages: 0
      };
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(id: string): Promise<boolean> {
    try {
      if (this.redis) {
        // Update notification read status
        await this.redis.hset(`notification:${id}`, 'read', 'true');
      } else {
        // In-memory fallback
        const notification = this.inMemoryStore.get(`notification:${id}`);
        if (notification) {
          notification.read = true;
          this.inMemoryStore.set(`notification:${id}`, notification);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }
  
  /**
   * Update notification
   */
  async updateNotification(id: string, updates: Partial<Notification>): Promise<boolean> {
    try {
      // Special case for marking as read, which is a common operation
      if (updates.read === true && Object.keys(updates).length === 1) {
        return this.markNotificationAsRead(id);
      }
      
      if (this.redis) {
        // First check if notification exists
        const exists = await this.redis.exists(`notification:${id}`);
        if (!exists) {
          return false;
        }
        
        // Get existing notification
        const notification = await this.redis.hgetall(`notification:${id}`);
        
        // Prepare updates, handling special fields
        const updatesForRedis: Record<string, string> = {};
        
        // Process each update
        for (const [key, value] of Object.entries(updates)) {
          if (key === 'data' && value !== undefined) {
            // For data object, store as JSON string
            updatesForRedis[key] = JSON.stringify(value);
          } else if (value === true || value === false) {
            // For boolean values, store as string
            updatesForRedis[key] = value ? 'true' : 'false';
          } else if (value !== undefined) {
            // For all other values, store as string
            updatesForRedis[key] = String(value);
          }
        }
        
        // Apply updates to Redis hash
        if (Object.keys(updatesForRedis).length > 0) {
          await this.redis.hset(`notification:${id}`, updatesForRedis);
        }
      } else {
        // In-memory fallback
        const notification = this.inMemoryStore.get(`notification:${id}`);
        if (!notification) {
          return false;
        }
        
        // Apply updates
        const updatedNotification = {
          ...notification,
          ...updates
        };
        
        this.inMemoryStore.set(`notification:${id}`, updatedNotification);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating notification:', error);
      return false;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(id: string): Promise<boolean> {
    try {
      if (this.redis) {
        // Get notification to find its priority
        const notification = await this.redis.hgetall(`notification:${id}`);
        
        // Remove notification from hash
        await this.redis.del(`notification:${id}`);
        
        // Remove from sorted set
        await this.redis.zrem('notifications', id);
        
        // Remove from priority set if it has one
        if (notification && notification.priority) {
          await this.redis.srem(`notification:priority:${notification.priority.toLowerCase()}`, id);
        }
      } else {
        // In-memory fallback
        this.inMemoryStore.delete(`notification:${id}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  /**
   * Store a tariff alert
   */
  async storeTariffAlert(alert: TariffAlert): Promise<string> {
    const id = alert.id || `alert-${Date.now()}`;
    const timestamp = alert.createdAt?.getTime() || Date.now();
    
    // Create a copy with specific ID
    const alertToStore = {
      ...alert,
      id,
      // Convert Date objects to ISO strings for storage
      createdAt: alert.createdAt?.toISOString() || new Date().toISOString(),
      publishDate: alert.publishDate?.toISOString(),
      effectiveDate: alert.effectiveDate?.toISOString(),
      // Convert arrays to strings for Redis hash
      productCategories: JSON.stringify(alert.productCategories || []),
      tradingPartners: JSON.stringify(alert.tradingPartners || []),
      // Convert boolean to string for Redis hash
      aiEnhanced: alert.aiEnhanced ? 'true' : 'false'
    };
    
    try {
      if (this.redis) {
        // Store alert as hash
        await this.redis.hset(`tariff-alert:${id}`, alertToStore as any);
        
        // Add to sorted set for time-based retrieval
        await this.redis.zadd('tariff-alerts', timestamp, id);
        
        // Add to country set for filtering
        if (alert.country) {
          await this.redis.sadd(`tariff-alerts:country:${alert.country.toLowerCase()}`, id);
        }
        
        // Add to priority set for filtering
        if (alert.priority) {
          await this.redis.sadd(`tariff-alerts:priority:${alert.priority.toLowerCase()}`, id);
        }
      } else {
        // In-memory fallback
        this.inMemoryStore.set(`tariff-alert:${id}`, alertToStore);
        
        // Add to in-memory indices
        if (alert.country) {
          const countryKey = `tariff-alerts:country:${alert.country.toLowerCase()}`;
          const countrySet = this.inMemoryStore.get(countryKey) || new Set();
          countrySet.add(id);
          this.inMemoryStore.set(countryKey, countrySet);
        }
        
        if (alert.priority) {
          const priorityKey = `tariff-alerts:priority:${alert.priority.toLowerCase()}`;
          const prioritySet = this.inMemoryStore.get(priorityKey) || new Set();
          prioritySet.add(id);
          this.inMemoryStore.set(priorityKey, prioritySet);
        }
      }
      
      return id;
    } catch (error) {
      console.error('Error storing tariff alert:', error);
      throw error;
    }
  }

  /**
   * Get all tariff alerts with filtering and pagination
   */
  async getTariffAlerts(
    page: number = 1, 
    limit: number = 20,
    filters?: {
      country?: string | string[];
      priority?: string | string[];
      search?: string;
    }
  ): Promise<{ alerts: TariffAlert[], total: number, page: number, pages: number }> {
    try {
      if (!this.redis) {
        // In-memory fallback
        let alertEntries = Array.from(this.inMemoryStore.entries())
          .filter(([key]) => key.startsWith('tariff-alert:'))
          .map(([_, value]) => this.convertObjectToTariffAlert(value))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        // Apply filters
        if (filters) {
          if (filters.country) {
            const countries = Array.isArray(filters.country) ? filters.country : [filters.country];
            alertEntries = alertEntries.filter(alert => 
              countries.some(country => 
                alert.country.toLowerCase() === country.toLowerCase()
              )
            );
          }
          
          if (filters.priority) {
            const priorities = Array.isArray(filters.priority) ? filters.priority : [filters.priority];
            alertEntries = alertEntries.filter(alert => 
              priorities.some(priority => 
                alert.priority.toLowerCase() === priority.toLowerCase()
              )
            );
          }
          
          if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            alertEntries = alertEntries.filter(alert => 
              alert.title.toLowerCase().includes(searchTerm) ||
              alert.description.toLowerCase().includes(searchTerm) ||
              alert.country.toLowerCase().includes(searchTerm)
            );
          }
        }
        
        // Apply pagination
        const total = alertEntries.length;
        const start = (page - 1) * limit;
        const end = start + limit;
        const paginatedAlerts = alertEntries.slice(start, end);
        
        return {
          alerts: paginatedAlerts,
          total,
          page,
          pages: Math.ceil(total / limit)
        };
      }
    
      // Using Redis
      let ids: string[] = [];
      let total = 0;
      
      // Apply filters if provided
      if (filters) {
        // Country filter
        if (filters.country) {
          const countries = Array.isArray(filters.country) ? filters.country : [filters.country];
          
          // Get alerts for each country and intersect
          const countryIds = await Promise.all(
            countries.map(country => 
              this.redis.smembers(`tariff-alerts:country:${country.toLowerCase()}`)
            )
          );
          
          // Intersect results if multiple countries
          ids = countryIds.length > 1 
            ? this.intersectArrays(countryIds) 
            : countryIds[0] || [];
        }
        
        // Priority filter
        if (filters.priority) {
          const priorities = Array.isArray(filters.priority) ? filters.priority : [filters.priority];
          
          // Get alerts for each priority
          const priorityIds = await Promise.all(
            priorities.map(priority => 
              this.redis.smembers(`tariff-alerts:priority:${priority.toLowerCase()}`)
            )
          );
          
          // Get combined priority IDs
          const priorityResults = priorityIds.length > 1 
            ? this.intersectArrays(priorityIds) 
            : priorityIds[0] || [];
          
          // If we already have country filters, intersect with priority results
          ids = ids.length > 0 
            ? this.intersectArrays([ids, priorityResults])
            : priorityResults;
        }
        
        // No filters applied yet, get all IDs from sorted set
        if (ids.length === 0 && !filters.search) {
          total = await this.redis.zcard('tariff-alerts');
          
          // Calculate range for pagination
          const start = (page - 1) * limit;
          const end = start + limit - 1;
          
          // Get alert IDs in range (sorted by timestamp desc)
          ids = await this.redis.zrevrange('tariff-alerts', start, end);
        } else {
          // We have a filtered set of IDs
          total = ids.length;
          
          // Sort by timestamp (recent first)
          if (ids.length > 0) {
            // Get scores (timestamps) for the IDs
            const pipeline = this.redis.pipeline();
            ids.forEach(id => {
              pipeline.zscore('tariff-alerts', id);
            });
            
            const scores = await pipeline.exec();
            
            // Combine IDs with their scores
            const idsWithScores = ids.map((id, index) => ({
              id,
              score: parseFloat(scores[index][1] as string)
            }));
            
            // Sort by score (timestamp) in descending order
            idsWithScores.sort((a, b) => b.score - a.score);
            
            // Apply pagination to sorted IDs
            const start = (page - 1) * limit;
            const end = Math.min(start + limit, idsWithScores.length);
            
            ids = idsWithScores.slice(start, end).map(item => item.id);
          } else {
            ids = [];
          }
        }
      } else {
        // No filters, get all IDs with pagination
        total = await this.redis.zcard('tariff-alerts');
        
        // Calculate range for pagination
        const start = (page - 1) * limit;
        const end = start + limit - 1;
        
        // Get alert IDs in range (sorted by timestamp desc)
        ids = await this.redis.zrevrange('tariff-alerts', start, end);
      }
      
      if (ids.length === 0) {
        return {
          alerts: [],
          total,
          page,
          pages: Math.ceil(total / limit)
        };
      }
      
      // Get alert objects
      const pipeline = this.redis.pipeline();
      ids.forEach(id => {
        pipeline.hgetall(`tariff-alert:${id}`);
      });
      
      const results = await pipeline.exec();
      
      // Extract alerts from results
      let alerts = results
        .map(result => result[1])
        .filter(Boolean)
        .map(alert => this.convertRedisObjectToTariffAlert(alert));
      
      // Apply search filter if provided
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        alerts = alerts.filter(alert => 
          (alert.title?.toLowerCase() || '').includes(searchTerm) ||
          (alert.description?.toLowerCase() || '').includes(searchTerm) ||
          (alert.country?.toLowerCase() || '').includes(searchTerm)
        );
        
        // Adjust total for search results
        total = alerts.length;
      }
      
      return {
        alerts,
        total,
        page,
        pages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error getting tariff alerts:', error);
      return {
        alerts: [],
        total: 0,
        page,
        pages: 0
      };
    }
  }

  /**
   * Helper: Intersect arrays
   */
  private intersectArrays(arrays: string[][]): string[] {
    if (arrays.length === 0) return [];
    if (arrays.length === 1) return arrays[0] || [];
    
    // Start with the first array
    return arrays.reduce((acc, arr) => {
      // Intersect current result with next array
      return acc.filter(item => arr.includes(item));
    });
  }

  /**
   * Helper: Convert Redis object to Notification
   */
  private convertRedisObjectToNotification(obj: any): Notification {
    return {
      id: obj.id,
      type: obj.type as 'alert' | 'success' | 'warning' | 'info',
      title: obj.title,
      message: obj.message,
      timestamp: obj.timestamp,
      read: obj.read === 'true',
      priority: obj.priority,
      actionUrl: obj.actionUrl,
      data: obj.data ? JSON.parse(obj.data) : undefined
    };
  }

  /**
   * Helper: Convert Redis object to TariffAlert
   */
  private convertRedisObjectToTariffAlert(obj: any): TariffAlert {
    return {
      id: obj.id,
      title: obj.title,
      description: obj.description,
      priority: obj.priority as any,
      country: obj.country,
      impactSeverity: parseFloat(obj.impactSeverity || '0'),
      confidence: parseFloat(obj.confidence || '0'),
      sourceUrl: obj.sourceUrl,
      sourceName: obj.sourceName,
      publishDate: obj.publishDate ? new Date(obj.publishDate) : undefined,
      createdAt: obj.createdAt ? new Date(obj.createdAt) : new Date(),
      effectiveDate: obj.effectiveDate ? new Date(obj.effectiveDate) : undefined,
      tariffRate: obj.tariffRate !== undefined ? parseFloat(obj.tariffRate) : undefined,
      productCategories: obj.productCategories ? JSON.parse(obj.productCategories) : undefined,
      aiEnhanced: obj.aiEnhanced === 'true' || obj.aiEnhanced === true,
      tradingPartners: obj.tradingPartners ? JSON.parse(obj.tradingPartners) : undefined
    };
  }

  /**
   * Helper: Convert Object to TariffAlert
   */
  private convertObjectToTariffAlert(obj: any): TariffAlert {
    // For in-memory store
    return {
      id: obj.id,
      title: obj.title,
      description: obj.description,
      priority: obj.priority,
      country: obj.country,
      impactSeverity: parseFloat(obj.impactSeverity || '0'),
      confidence: parseFloat(obj.confidence || '0'),
      sourceUrl: obj.sourceUrl,
      sourceName: obj.sourceName,
      publishDate: obj.publishDate ? new Date(obj.publishDate) : undefined,
      createdAt: obj.createdAt ? new Date(obj.createdAt) : new Date(),
      effectiveDate: obj.effectiveDate ? new Date(obj.effectiveDate) : undefined,
      tariffRate: obj.tariffRate !== undefined ? parseFloat(obj.tariffRate) : undefined,
      productCategories: typeof obj.productCategories === 'string' 
        ? JSON.parse(obj.productCategories) 
        : obj.productCategories,
      aiEnhanced: obj.aiEnhanced === 'true' || obj.aiEnhanced === true,
      tradingPartners: typeof obj.tradingPartners === 'string'
        ? JSON.parse(obj.tradingPartners)
        : obj.tradingPartners
    };
  }
}

// Export singleton instance and class
export const redisDataStore = RedisDataStore.getInstance();
export default RedisDataStore;