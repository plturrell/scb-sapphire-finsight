/**
 * LangGraph Configuration for SCB Sapphire Application
 * Defines configuration settings for LangGraph processing pipeline
 */

export const LangGraphConfig = {
  // OpenAI API settings
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    defaultModel: 'gpt-4-turbo',
    timeout: 60000, // 60 seconds
  },
  
  // Perplexity API settings
  perplexity: {
    apiKey: process.env.PERPLEXITY_API_KEY || '',
    defaultModel: 'sonar-small-online',
    timeout: 45000, // 45 seconds
  },
  
  // Pipeline settings
  pipeline: {
    // Maximum queue size for pipeline tasks
    maxQueueSize: 100,
    
    // Task timeout in milliseconds
    taskTimeout: 300000, // 5 minutes
    
    // Concurrency limits
    maxConcurrentTasks: 5,
    
    // Retry settings for tasks
    retry: {
      maxRetries: 3,
      initialDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      backoffFactor: 2, // Exponential backoff
    },
    
    // Default batch size for processing
    defaultBatchSize: 10,
  },
  
  // Logging configuration
  logging: {
    // Log levels: error, warn, info, debug, trace
    level: process.env.LANGGRAPH_LOG_LEVEL || 'info',
    
    // Whether to log detailed performance metrics
    performanceMetrics: process.env.LANGGRAPH_PERFORMANCE_METRICS === 'true',
    
    // Whether to log intermediate results
    intermediateResults: process.env.LANGGRAPH_INTERMEDIATE_RESULTS === 'true',
  },
  
  // Schema validation settings
  validation: {
    // Whether to validate schemas strictly
    strict: true,
    
    // Whether to automatically coerce types
    coerceTypes: true,
  },
  
  // Storage settings for state and intermediate results
  storage: {
    // Whether to use Redis for state persistence
    useRedis: true,
    
    // Redis key prefix for LangGraph state
    redisKeyPrefix: 'lg:',
    
    // TTL for intermediate results in seconds
    intermediateTtl: 86400, // 1 day
    
    // TTL for completed graph runs in seconds
    completedRunTtl: 604800, // 7 days
  },
};