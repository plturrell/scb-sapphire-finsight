import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { TariffAlert, SankeyData, AIInsights } from '../types';
import { SimulationInput, SimulationOutput, SimulationComparison, ParameterHistory } from '../types/MonteCarloTypes';

// Define supported runtime environments
type Environment = 'development' | 'staging' | 'production';

// Define options for API initialization
interface ApiClientOptions {
  apiKey?: string;
  environment?: Environment;
  rateLimitRequestsPerMinute?: number;
  cacheEnabled?: boolean;
  cacheTTL?: {
    [key: string]: number; // TTL in milliseconds for different data types
  };
  maxRetries?: number;
  telemetryEnabled?: boolean;
  baseUrl?: string;
  mockEnabled?: boolean;
}

// Define options for API methods
interface ApiRequestOptions {
  useCache?: boolean;
  forceFresh?: boolean;
  timeoutMs?: number;
}

// Interface for financial data request options
interface FinancialDataOptions extends ApiRequestOptions {
  quarters?: number;
  includeForecast?: boolean;
  metricTypes?: string[];
}

// Interface for simulation request options
interface SimulationRequestOptions extends ApiRequestOptions {
  scenarioId?: string;
  parameterSets?: string[];
  simulationCount?: number;
}

// Define transformation strategy interface
interface TransformStrategy<T> {
  transform(data: any): T;
}

// Define telemetry event structure
interface TelemetryEvent {
  method: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  errorCode?: string;
  parameters?: Record<string, any>;
}

// Define cache item structure
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Define tariff alert options
interface TariffAlertOptions extends ApiRequestOptions {
  countries?: string[];
  priorityLevel?: 'low' | 'medium' | 'high' | 'critical';
  limit?: number;
}

// Define market news options
interface MarketNewsOptions extends ApiRequestOptions {
  topic?: string;
  limit?: number;
  includeAnalysis?: boolean;
}

// Define economic simulation options
interface EconomicSimulationOptions extends ApiRequestOptions {
  scenario: string;
  variables: string[];
  iterations?: number;
}

// Define sankey data options
interface SankeyDataOptions extends ApiRequestOptions {
  entity: string;
  timeframe?: 'monthly' | 'quarterly' | 'annual';
  enhanceWithAI?: boolean;
}

/**
 * PerplexityApiClient
 * 
 * A client for interacting with the Perplexity API with advanced features:
 * - Configurable options for different environments
 * - Error handling with retry logic
 * - Rate limiting to avoid API throttling
 * - Telemetry for tracking API performance
 * - Caching strategy for optimizing data retrieval
 * - Transformation system for custom data processing
 */
class PerplexityApiClient {
  private apiClient: AxiosInstance;
  private options: ApiClientOptions;
  private cache = new Map<string, CacheItem<any>>();
  private telemetryEvents: TelemetryEvent[] = [];
  private tokenBucket: {
    tokens: number;
    lastRefill: number;
    maxTokens: number;
    tokensPerInterval: number;
    intervalMs: number;
  };
  
  // Custom transform strategies
  private transformers = new Map<string, TransformStrategy<any>>();

  /**
   * Constructor for the Perplexity API client
   * @param options Configuration options for the client
   */
  constructor(options: ApiClientOptions = {}) {
    // Set default options
    this.options = {
      apiKey: options.apiKey || process.env.REACT_APP_PERPLEXITY_API_KEY || '',
      environment: options.environment || (process.env.NODE_ENV as Environment) || 'development',
      rateLimitRequestsPerMinute: options.rateLimitRequestsPerMinute || 60,
      cacheEnabled: options.cacheEnabled !== false, // Default to true
      cacheTTL: {
        default: 5 * 60 * 1000, // 5 minutes
        simulationInputs: 15 * 60 * 1000, // 15 minutes
        simulationOutputs: 10 * 60 * 1000, // 10 minutes
        simulationComparisons: 15 * 60 * 1000, // 15 minutes
        tariffAlerts: 3 * 60 * 1000, // 3 minutes
        marketNews: 2 * 60 * 1000, // 2 minutes for news
        financialData: 60 * 1000, // 1 minute for real-time data
        ...(options.cacheTTL || {})
      },
      maxRetries: options.maxRetries || 3,
      telemetryEnabled: options.telemetryEnabled || false,
      baseUrl: options.baseUrl || '',
      mockEnabled: options.mockEnabled || false
    };
    
    // Initialize token bucket for rate limiting
    this.tokenBucket = {
      tokens: this.options.rateLimitRequestsPerMinute || 60,
      lastRefill: Date.now(),
      maxTokens: this.options.rateLimitRequestsPerMinute || 60,
      tokensPerInterval: this.options.rateLimitRequestsPerMinute || 60,
      intervalMs: 60 * 1000 // 1 minute in milliseconds
    };
    
    // Initialize axios client
    this.apiClient = axios.create(this.getBaseConfig());
    
    // Set up request and response interceptors
    this.setupInterceptors();
    
    // Validate API key
    this.validateApiKey();
    
    // Log initialization
    console.info(`PerplexityApiClient initialized in ${this.options.environment} environment`);
  }
  
  /**
   * Get base configuration for API client based on current environment
   */
  private getBaseConfig(): AxiosRequestConfig {
    return {
      baseURL: this.getBaseUrlForEnvironment(),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.options.apiKey}`,
      },
      timeout: 30000,
    };
  }

  /**
   * Get the base URL for the current environment
   */
  private getBaseUrlForEnvironment(): string {
    if (this.options.baseUrl) {
      return this.options.baseUrl;
    }

    switch (this.options.environment) {
      case 'production':
        return 'https://api.perplexity.ai/v1';
      case 'staging':
        return 'https://api-staging.perplexity.ai/v1';
      case 'development':
      default:
        return 'https://api-dev.perplexity.ai/v1';
    }
  }
  
  /**
   * Validate that the API key meets basic requirements
   */
  private validateApiKey(): void {
    if (!this.options.apiKey && !this.options.mockEnabled) {
      console.warn('No API key provided. API calls will likely fail unless mock mode is enabled.');
    } else if (this.options.apiKey && this.options.apiKey.length < 10) {
      console.warn('API key seems too short. Please check your API key.');
    }
  }
  
  /**
   * Set up request and response interceptors for the axios client
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.apiClient.interceptors.request.use(async (config) => {
      // Apply rate limiting
      await this.waitForTokenBucket();
      
      // Start tracking telemetry
      const requestId = Math.random().toString(36).substring(2, 9);
      config.headers['X-Request-ID'] = requestId;
      
      const startTime = Date.now();
      (config as any).metadata = { startTime, requestId };
      
      return config;
    }, (error) => {
      return Promise.reject(error);
    });

    // Response interceptor
    this.apiClient.interceptors.response.use((response) => {
      // Track successful response for telemetry
      const config = response.config as any;
      const startTime = config.metadata?.startTime;
      const requestId = config.metadata?.requestId;
      
      if (startTime && this.options.telemetryEnabled) {
        const endTime = Date.now();
        this.trackTelemetry({
          method: `${config.method?.toUpperCase()} ${config.url}`,
          startTime,
          endTime,
          duration: endTime - startTime,
          success: true,
          parameters: this.redactSensitiveInfo(config.params || {})
        });
      }
      
      return response;
    }, async (error: AxiosError) => {
      // Handle errors and apply retry logic
      const config = error.config as any;
      
      // Track error for telemetry
      if (config?.metadata?.startTime && this.options.telemetryEnabled) {
        const endTime = Date.now();
        this.trackTelemetry({
          method: `${config.method?.toUpperCase()} ${config.url}`,
          startTime: config.metadata.startTime,
          endTime,
          duration: endTime - config.metadata.startTime,
          success: false,
          errorCode: error.code || error.response?.status?.toString(),
          parameters: this.redactSensitiveInfo(config.params || {})
        });
      }
      
      // Apply retry logic if retries are enabled
      if (config && this.options.maxRetries && (!config.retryCount || config.retryCount < this.options.maxRetries)) {
        // Increment retry count
        config.retryCount = config.retryCount ? config.retryCount + 1 : 1;
        
        // Calculate backoff delay using exponential backoff
        const backoffDelay = Math.min(
          Math.pow(2, config.retryCount) * 1000 + Math.random() * 1000,
          10000 // Max 10 seconds delay
        );
        
        // Wait for the backoff delay
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        
        // Retry the request
        return this.apiClient(config);
      }
      
      return Promise.reject(error);
    });
  }
  
  /**
   * Wait for a token from the token bucket to be available
   * @returns {Promise<void>}
   */
  private async waitForTokenBucket(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRefill = now - this.tokenBucket.lastRefill;
    
    // Refill tokens based on time elapsed
    if (timeSinceLastRefill > 0) {
      const tokensToAdd = Math.floor(timeSinceLastRefill / this.tokenBucket.intervalMs) * this.tokenBucket.tokensPerInterval;
      if (tokensToAdd > 0) {
        this.tokenBucket.tokens = Math.min(
          this.tokenBucket.tokens + tokensToAdd,
          this.tokenBucket.maxTokens
        );
        this.tokenBucket.lastRefill = now;
      }
    }
    
    // Wait if no tokens are available
    if (this.tokenBucket.tokens < 1) {
      const timeToNextToken = this.tokenBucket.intervalMs / this.tokenBucket.tokensPerInterval;
      await new Promise(resolve => setTimeout(resolve, timeToNextToken));
      return this.waitForTokenBucket(); // Recursive call to check again
    }
    
    // Take a token
    this.tokenBucket.tokens -= 1;
    return Promise.resolve();
  }
  
  /**
   * Track telemetry event
   * @param {TelemetryEvent} event Telemetry event to track
   */
  private trackTelemetry(event: TelemetryEvent): void {
    if (!this.options.telemetryEnabled) return;
    
    // Add event to the queue
    this.telemetryEvents.push(event);
    
    // Keep only the most recent 100 events
    if (this.telemetryEvents.length > 100) {
      this.telemetryEvents.shift();
    }
  }
  
  /**
   * Redact sensitive information from parameters for telemetry
   * @param {Record<string, any>} params Parameters to redact
   * @returns {Record<string, any>} Redacted parameters
   */
  private redactSensitiveInfo(params: Record<string, any>): Record<string, any> {
    const redacted = { ...params };
    
    // Redact sensitive fields
    const sensitiveFields = ['apiKey', 'key', 'password', 'secret', 'token', 'authorization'];
    for (const field of sensitiveFields) {
      if (field in redacted) {
        redacted[field] = '[REDACTED]';
      }
    }
    
    return redacted;
  }
  
  /**
   * Get a cached value or calculate it using the provided function
   * @param {string} key - Cache key
   * @param {Function} fetchData - Function to fetch data if not cached
   * @param {string} type - Type of data for TTL determination
   * @param {ApiRequestOptions} options - Request options
   * @returns {Promise<T>} The cached or fetched data
   */
  private async getOrSetCache<T>(
    key: string,
    fetchData: () => Promise<T>,
    type: string = 'default',
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const cacheEnabled = options.useCache !== undefined ? options.useCache : this.options.cacheEnabled;
    const forceFresh = options.forceFresh || false;
    
    // If cache is enabled and not forced to refresh, try to get from cache
    if (cacheEnabled && !forceFresh) {
      const cachedItem = this.cache.get(key);
      if (cachedItem && cachedItem.expiresAt > Date.now()) {
        return cachedItem.data;
      }
    }
    
    // If not cached or cache expired, fetch the data
    const data = await fetchData();
    
    // Store in cache if caching is enabled
    if (cacheEnabled) {
      const ttl = this.options.cacheTTL?.[type] || this.options.cacheTTL?.default || 5 * 60 * 1000;
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
      });
    }
    
    return data;
  }

  /**
   * Clear the entire cache or a specific cache key
   * @param {string} key - Optional specific cache key to clear
   */
  public clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
  
  /**
   * Get telemetry events
   * @returns {TelemetryEvent[]} Recent telemetry events
   */
  public getTelemetryEvents(): TelemetryEvent[] {
    return [...this.telemetryEvents];
  }
  
  /**
   * Register a custom transformation strategy
   * @param {string} key - Unique key for the strategy
   * @param {TransformStrategy<T>} strategy - The transformation strategy
   */
  public registerTransformStrategy<T>(key: string, strategy: TransformStrategy<T>): void {
    this.transformers.set(key, strategy);
  }
  
  /**
   * Apply a transformation strategy to data
   * @param {string} strategyKey - Key of the strategy to apply
   * @param {any} data - Data to transform
   * @returns {T} Transformed data
   */
  private applyTransformation<T>(strategyKey: string, data: any): T {
    const strategy = this.transformers.get(strategyKey) as TransformStrategy<T> | undefined;
    if (!strategy) {
      return data as T;
    }
    return strategy.transform(data);
  }
  
  /**
   * Get recent tariff alerts
   * @param {TariffAlertOptions} options - Options for tariff alerts
   * @returns {Promise<TariffAlert[]>} Array of tariff alerts
   */
  public async getTariffAlerts(options: TariffAlertOptions = {}): Promise<TariffAlert[]> {
    const cacheKey = `tariff-alerts:${JSON.stringify(options)}`;
    
    return this.getOrSetCache<TariffAlert[]>(
      cacheKey,
      async () => {
        const response = await this.apiClient.get('/tariff-alerts', {
          params: {
            countries: options.countries?.join(','),
            priority_level: options.priorityLevel,
            limit: options.limit || 50,
          },
          timeout: options.timeoutMs || 30000,
        });
        return response.data.alerts;
      },
      'tariffAlerts',
      options
    );
  }
  
  /**
   * Get Sankey data for entity
   * @param {SankeyDataOptions} options - Options for Sankey data
   * @returns {Promise<SankeyData>} Sankey diagram data
   */
  public async getSankeyData(options: SankeyDataOptions): Promise<SankeyData> {
    const cacheKey = `sankey-data:${options.entity}:${options.timeframe || 'quarterly'}:${options.enhanceWithAI ? 'ai' : 'basic'}`;
    
    return this.getOrSetCache<SankeyData>(
      cacheKey,
      async () => {
        const response = await this.apiClient.get('/sankey-data', {
          params: {
            entity: options.entity,
            timeframe: options.timeframe || 'quarterly',
            enhance_with_ai: options.enhanceWithAI ? 'true' : 'false',
          },
          timeout: options.timeoutMs || 30000,
        });
        return response.data;
      },
      'sankeyData',
      options
    );
  }
  
  /**
   * Get AI insights for a specific entity
   * @param {string} entity - The entity to get insights for
   * @param {ApiRequestOptions} options - Request options
   * @returns {Promise<AIInsights>} AI insights
   */
  public async getAIInsights(entity: string, options: ApiRequestOptions = {}): Promise<AIInsights> {
    const cacheKey = `ai-insights:${entity}`;
    
    return this.getOrSetCache<AIInsights>(
      cacheKey,
      async () => {
        const response = await this.apiClient.get('/ai-insights', {
          params: {
            entity,
          },
          timeout: options.timeoutMs || 45000, // Longer timeout for AI processing
        });
        return response.data;
      },
      'aiInsights',
      options
    );
  }
  
  /**
   * Get simulation inputs
   * @param {SimulationRequestOptions} options - Options for simulation
   * @returns {Promise<SimulationInput[]>} Simulation inputs
   */
  public async getSimulationInputs(options: SimulationRequestOptions = {}): Promise<SimulationInput[]> {
    const cacheKey = `simulation-inputs:${options.scenarioId || 'default'}`;
    
    return this.getOrSetCache<SimulationInput[]>(
      cacheKey,
      async () => {
        const response = await this.apiClient.get('/simulation/inputs', {
          params: {
            scenario_id: options.scenarioId,
            parameter_sets: options.parameterSets?.join(','),
          },
          timeout: options.timeoutMs || 30000,
        });
        return response.data.inputs;
      },
      'simulationInputs',
      options
    );
  }
  
  /**
   * Get simulation outputs
   * @param {SimulationRequestOptions} options - Options for simulation
   * @returns {Promise<SimulationOutput[]>} Simulation outputs
   */
  public async getSimulationOutputs(options: SimulationRequestOptions = {}): Promise<SimulationOutput[]> {
    const cacheKey = `simulation-outputs:${options.scenarioId || 'default'}:${options.simulationCount || 100}`;
    
    return this.getOrSetCache<SimulationOutput[]>(
      cacheKey,
      async () => {
        const response = await this.apiClient.get('/simulation/outputs', {
          params: {
            scenario_id: options.scenarioId,
            simulation_count: options.simulationCount || 100,
          },
          timeout: options.timeoutMs || 60000, // Longer timeout for simulation
        });
        return response.data.outputs;
      },
      'simulationOutputs',
      options
    );
  }
  
  /**
   * Get simulation comparisons
   * @param {SimulationRequestOptions} options - Options for simulation
   * @returns {Promise<SimulationComparison[]>} Simulation comparisons
   */
  public async getSimulationComparisons(options: SimulationRequestOptions = {}): Promise<SimulationComparison[]> {
    const cacheKey = `simulation-comparisons:${options.scenarioId || 'default'}`;
    
    return this.getOrSetCache<SimulationComparison[]>(
      cacheKey,
      async () => {
        const response = await this.apiClient.get('/simulation/comparisons', {
          params: {
            scenario_id: options.scenarioId,
          },
          timeout: options.timeoutMs || 30000,
        });
        return response.data.comparisons;
      },
      'simulationComparisons',
      options
    );
  }
  
  /**
   * Get parameter history
   * @param {string} parameterId - ID of the parameter
   * @param {ApiRequestOptions} options - Request options
   * @returns {Promise<ParameterHistory>} Parameter history
   */
  public async getParameterHistory(parameterId: string, options: ApiRequestOptions = {}): Promise<ParameterHistory> {
    const cacheKey = `parameter-history:${parameterId}`;
    
    return this.getOrSetCache<ParameterHistory>(
      cacheKey,
      async () => {
        const response = await this.apiClient.get(`/parameters/${parameterId}/history`, {
          timeout: options.timeoutMs || 30000,
        });
        return response.data;
      },
      'parameterHistory',
      options
    );
  }
  
  /**
   * Get market news
   * @param {MarketNewsOptions} options - Options for market news
   * @returns {Promise<any[]>} Market news items
   */
  public async getMarketNews(options: MarketNewsOptions = {}): Promise<any[]> {
    const cacheKey = `market-news:${options.topic || 'general'}:${options.limit || 5}`;
    
    return this.getOrSetCache<any[]>(
      cacheKey,
      async () => {
        const response = await this.apiClient.get('/market-news', {
          params: {
            topic: options.topic || 'financial markets',
            limit: options.limit || 5,
            include_analysis: options.includeAnalysis ? 'true' : 'false',
          },
          timeout: options.timeoutMs || 30000,
        });
        return response.data.articles || [];
      },
      'marketNews',
      options
    );
  }

  /**
   * Run an economic simulation
   * @param {EconomicSimulationOptions} options - Options for the economic simulation
   * @returns {Promise<SimulationOutput[]>} Simulation outputs
   */
  public async runEconomicSimulation(options: EconomicSimulationOptions): Promise<SimulationOutput[]> {
    const cacheKey = `economic-simulation:${options.scenario}:${options.variables.join(',')}:${options.iterations || 1000}`;
    
    return this.getOrSetCache<SimulationOutput[]>(
      cacheKey,
      async () => {
        const response = await this.apiClient.post('/economic-simulation', {
          scenario: options.scenario,
          variables: options.variables,
          iterations: options.iterations || 1000,
        }, {
          timeout: options.timeoutMs || 120000, // Longer timeout for complex simulations
        });
        return response.data.results;
      },
      'economicSimulation',
      options
    );
  }
}

// Create a singleton instance
const perplexityApiClient = new PerplexityApiClient();

export default perplexityApiClient;
