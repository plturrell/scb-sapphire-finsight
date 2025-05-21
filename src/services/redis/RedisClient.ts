/**
 * Redis Client for SCB Sapphire Application
 * Provides connection and core functionality for Redis caching
 */

import Redis from 'ioredis';
import { RedisConfig } from './RedisConfig';

// Singleton instance of Redis client
let redisClient: Redis.Redis | Redis.Cluster | null = null;

/**
 * Creates and returns a Redis client instance
 * Supports both standalone and cluster mode
 */
export const getRedisClient = (): Redis.Redis | Redis.Cluster => {
  if (redisClient) {
    return redisClient;
  }
  
  // Configure client based on cluster mode
  if (RedisConfig.cluster.enabled && RedisConfig.cluster.nodes.length > 0) {
    redisClient = new Redis.Cluster(RedisConfig.cluster.nodes, {
      redisOptions: {
        password: RedisConfig.password,
        username: RedisConfig.username,
      },
      scaleReads: 'all',
    });
  } else {
    redisClient = new Redis({
      host: RedisConfig.host,
      port: RedisConfig.port,
      password: RedisConfig.password,
      username: RedisConfig.username,
      maxRetriesPerRequest: 3,
    });
  }
  
  // Set up error handling
  redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
  });
  
  // Set up connection events
  redisClient.on('connect', () => {
    console.log('Connected to Redis server');
  });
  
  redisClient.on('ready', () => {
    console.log('Redis client ready');
  });
  
  return redisClient;
};

/**
 * Closes the Redis connection
 */
export const closeRedisConnection = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('Redis connection closed');
  }
};

/**
 * Checks if Redis connection is available
 */
export const pingRedis = async (): Promise<boolean> => {
  try {
    const client = getRedisClient();
    const pong = await client.ping();
    return pong === 'PONG';
  } catch (error) {
    console.error('Redis ping failed:', error);
    return false;
  }
};