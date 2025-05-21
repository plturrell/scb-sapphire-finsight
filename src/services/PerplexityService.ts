/**
 * Centralized Perplexity API Service
 * 
 * This service provides a standardized way to interact with the Perplexity API.
 * It handles authentication, rate limiting, retries, and formatting.
 * 
 * All Perplexity API calls should use this service to ensure consistency.
 * 
 * Updated with improved error handling, retry logic, and timeout management.
 */

import perplexityRateLimiter from './PerplexityRateLimiter';

// API constants
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const MODEL_NAME = 'sonar';
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // ms
const REQUEST_QUEUE_INTERVAL = 300; // ms between queue processing
const FETCH_TIMEOUT = 15000; // 15 seconds timeout for API calls

// Global request queue to prevent concurrent requests
type QueuedRequest = {
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
};

const requestQueue: QueuedRequest[] = [];
let isProcessingQueue = false;

// Types for API interactions
export interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PerplexityRequest {
  model: string;
  messages: PerplexityMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface PerplexityResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: PerplexityMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class PerplexityService {
  private apiKey: string;
  
  constructor() {
    // IMPORTANT: Always use a known working key, ignoring environment variables
    // This is because the environment variable in Vercel has been confirmed to be incorrect
    this.apiKey = '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';
    console.log('Using hardcoded working Perplexity API key for reliability');
    
    // Log a masked version of the API key for debugging
    console.log(`Using Perplexity API key: ${this.apiKey.substring(0, 5)}...${this.apiKey.substring(this.apiKey.length - 4)}`);
  }
  
  /**
   * Get masked API key information for debugging purposes
   * Returns a safe version of the API key with most characters hidden
   */
  getApiKeyInfo(): string {
    return `${this.apiKey.substring(0, 5)}...${this.apiKey.substring(this.apiKey.length - 4)}`;
  }
  
  /**
   * Fetch with timeout to prevent hanging requests
   */
  private async fetchWithTimeout(url: string, options: RequestInit, timeout: number = FETCH_TIMEOUT): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      return response;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeout}ms`);
      }
      throw error;
    } finally {
      clearTimeout(id);
    }
  }

  /**
   * Process the request queue to prevent too many concurrent API calls
   */
  private async processQueue() {
    if (isProcessingQueue || requestQueue.length === 0) {
      return;
    }

    isProcessingQueue = true;

    try {
      // Process one request at a time
      const request = requestQueue.shift();
      if (request) {
        try {
          const result = await request.execute();
          request.resolve(result);
        } catch (error) {
          request.reject(error);
        }
      }
    } finally {
      isProcessingQueue = false;
      
      // Schedule the next request after a delay to prevent flooding
      if (requestQueue.length > 0) {
        setTimeout(() => this.processQueue(), REQUEST_QUEUE_INTERVAL);
      }
    }
  }

  /**
   * Add a request to the queue and process it when ready
   */
  private enqueueRequest<T>(executeFunc: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Add to queue
      requestQueue.push({
        execute: executeFunc,
        resolve,
        reject
      });
      
      // Start processing if not already started
      if (!isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  /**
   * Direct call to the Perplexity API with retries and rate limiting
   * Now uses a queue system to prevent too many concurrent requests
   */
  async callPerplexityAPI(messages: PerplexityMessage[], options: {
    temperature?: number;
    max_tokens?: number;
    model?: string;
  } = {}): Promise<PerplexityResponse> {
    // Add this request to the queue
    return this.enqueueRequest(async () => {
      // Record metrics for rate limiting
      const startTime = Date.now();
      const endpoint = 'perplexity-service';
      
      // Set default options
      const model = options.model || MODEL_NAME;
      const temperature = options.temperature ?? 0.2;
      const max_tokens = options.max_tokens ?? 2000;
      
      // Check if we can make a request based on rate limits
      if (!perplexityRateLimiter.canMakeRequest()) {
        const timeToWait = perplexityRateLimiter.getTimeToWaitMs();
        if (timeToWait > 0) {
          console.warn(`Rate limit reached for Perplexity API. Waiting ${timeToWait}ms before next request.`);
          await new Promise(resolve => setTimeout(resolve, timeToWait));
        }
      }
      
      // Create request body
      const requestBody: PerplexityRequest = {
        model,
        messages,
        temperature,
        max_tokens
      };
      
      // Retry logic
      let retries = 0;
      let lastError: Error | null = null;
      let tokenUsage = 0;
      
      while (retries <= MAX_RETRIES) {
        try {
          console.log(`Making Perplexity API request to model: ${model}`);
          
          // Use the fetchWithTimeout method instead of direct fetch
          const response = await this.fetchWithTimeout(PERPLEXITY_API_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          });
          
          if (!response.ok) {
            const status = response.status;
            const statusText = response.statusText;
            
            // Log detailed error if available
            let errorText = '';
            try {
              errorText = await response.text();
            } catch (e) {
              errorText = 'Could not read error response';
            }
            
            console.error(`Perplexity API error (${status}: ${statusText}):`, errorText);
            
            // Retry if not a fatal error
            if (retries < MAX_RETRIES) {
              retries++;
              console.warn(`Retrying Perplexity API call (${retries}/${MAX_RETRIES})...`);
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
              continue;
            }
            
            throw new Error(`API error: ${status}`);
          }
          
          const data = await response.json();
          tokenUsage = data.usage?.total_tokens || 0;
          
          // Record successful API call in rate limiter
          perplexityRateLimiter.recordRequest({
            endpoint,
            tokens: tokenUsage,
            model,
            startTime,
            success: true
          });
          
          return data;
        } catch (error) {
          lastError = error as Error;
          
          if (retries < MAX_RETRIES) {
            retries++;
            console.warn(`Perplexity API error, retrying (${retries}/${MAX_RETRIES})...`, error);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          } else {
            // Record failed API call
            perplexityRateLimiter.recordRequest({
              endpoint,
              tokens: 0,
              model,
              startTime,
              success: false
            });
            break;
          }
        }
      }
      
      throw lastError || new Error('Failed to get response from Perplexity API');
    });
  }
  
  /**
   * Get general search results
   */
  async search(query: string): Promise<string> {
    const messages: PerplexityMessage[] = [
      {
        role: 'system',
        content: 'You are a financial search assistant helping users find information about companies, financial data, and market insights. Focus on providing relevant, accurate, and up-to-date information with structured data.'
      },
      {
        role: 'user',
        content: query
      }
    ];
    
    try {
      const response = await this.callPerplexityAPI(messages);
      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Perplexity search error:', error);
      throw error;
    }
  }
  
  /**
   * Get company information
   */
  async searchCompanies(query: string): Promise<string> {
    const messages: PerplexityMessage[] = [
      {
        role: 'system',
        content: 'You are a financial analyst specialized in company information. Provide detailed, accurate company profiles including key metrics, recent performance, and market position.'
      },
      {
        role: 'user',
        content: `Provide information about ${query}. Include company overview, key metrics, recent performance, and any relevant news.`
      }
    ];
    
    try {
      const response = await this.callPerplexityAPI(messages);
      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Company search error:', error);
      throw error;
    }
  }
  
  /**
   * Get financial insights
   */
  async getFinancialInsights(query: string): Promise<string> {
    const messages: PerplexityMessage[] = [
      {
        role: 'system',
        content: 'You are a financial advisor providing insights on financial topics. Offer balanced, accurate analysis on market trends, investment opportunities, and financial strategies.'
      },
      {
        role: 'user',
        content: `Provide financial insights about ${query}. Include key metrics, trends, risks, and opportunities.`
      }
    ];
    
    try {
      const response = await this.callPerplexityAPI(messages);
      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Financial insights error:', error);
      throw error;
    }
  }
  
  /**
   * Get market news
   */
  async getMarketNews(topic: string = 'financial markets'): Promise<string> {
    const messages: PerplexityMessage[] = [
      {
        role: 'system',
        content: 'You are a financial news reporter providing concise, accurate summaries of the latest market developments. Focus on factual information and provide a diverse range of important financial news.'
      },
      {
        role: 'user',
        content: `Provide the latest financial market news about ${topic}. Include major market movements, significant events, and relevant information.`
      }
    ];
    
    try {
      const response = await this.callPerplexityAPI(messages, { max_tokens: 1000 });
      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Market news error:', error);
      throw error;
    }
  }
}

// Export a singleton instance for use throughout the application
const perplexityService = new PerplexityService();
export default perplexityService;
