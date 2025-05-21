/**
 * Redis Configuration for SCB Sapphire Application
 * Provides connection settings and default configurations for Redis caching
 */

export const RedisConfig = {
  // Connection settings
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || '',
  username: process.env.REDIS_USERNAME || '',
  
  // Default TTL settings (in seconds)
  ttl: {
    // Financial data expires after 1 hour
    financial: 60 * 60,
    // Market data expires after 15 minutes
    market: 15 * 60,
    // Company data expires after 1 day
    company: 24 * 60 * 60,
    // User preferences expire after 7 days
    preferences: 7 * 24 * 60 * 60,
    // Query results expire after 5 minutes
    query: 5 * 60,
    // Default TTL for other data types is 30 minutes
    default: 30 * 60
  },
  
  // Key prefixes for organized cache management
  keyPrefix: {
    financial: 'fin:',
    market: 'mkt:',
    company: 'com:',
    user: 'usr:',
    query: 'qry:',
    perplexity: 'plx:'
  },
  
  // Cache size limits in MB (for monitoring and management)
  maxMemory: parseInt(process.env.REDIS_MAX_MEMORY || '512', 10),
  
  // Eviction policy when memory limit is reached
  evictionPolicy: 'volatile-lru',
  
  // Connection pool settings
  connectionPool: {
    min: parseInt(process.env.REDIS_POOL_MIN || '5', 10),
    max: parseInt(process.env.REDIS_POOL_MAX || '20', 10)
  },
  
  // Cluster mode settings
  cluster: {
    enabled: process.env.REDIS_CLUSTER_ENABLED === 'true',
    nodes: (process.env.REDIS_CLUSTER_NODES || '')
      .split(',')
      .filter(Boolean)
      .map(node => {
        const [host, port] = node.split(':');
        return { host, port: parseInt(port, 10) };
      })
  }
};