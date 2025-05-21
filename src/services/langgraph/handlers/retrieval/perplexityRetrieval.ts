/**
 * Perplexity Retrieval Handlers
 * Provides handlers for retrieving data from Perplexity API
 */

import { NodeHandler, GraphState, PerplexityQuery } from '../../types';
import perplexityService from '@/services/PerplexityService';
import { PerplexityCacheService } from '@/services/redis/PerplexityCacheService';
import { LangGraphConfig } from '../../LangGraphConfig';

/**
 * Handler for retrieving general information from Perplexity
 */
export const perplexityGeneralRetrieval: NodeHandler = async (input: any, state: GraphState) => {
  console.log('Running perplexityGeneralRetrieval handler');
  
  // Extract query from input
  const query = typeof input === 'string' ? input : input.query;
  if (!query) {
    throw new Error('No query provided for Perplexity retrieval');
  }
  
  // Create Perplexity query parameters
  const queryParams: PerplexityQuery = {
    query,
    options: {
      model: LangGraphConfig.perplexity.defaultModel,
      temperature: 0.2,
      max_tokens: 2000,
    },
    metadata: {
      type: 'general',
      source: 'perplexity',
    },
  };
  
  // Check cache first
  const cachedResult = await PerplexityCacheService.getCachedQueryResult(queryParams);
  if (cachedResult) {
    console.log('Found cached result for perplexity general query');
    
    // Update metrics in state
    state.nodes[state.currentNode!].metrics = {
      ...state.nodes[state.currentNode!].metrics,
      cacheHit: true,
      source: 'cache',
    };
    
    return cachedResult;
  }
  
  // Not found in cache, make API call
  try {
    const result = await perplexityService.search(query);
    
    // Cache the result for future use
    await PerplexityCacheService.cacheQueryResult(queryParams, result);
    
    // Update metrics in state
    state.nodes[state.currentNode!].metrics = {
      ...state.nodes[state.currentNode!].metrics,
      tokenUsage: {
        // Estimate token usage since Perplexity API doesn't always return this
        promptTokens: query.length / 4, // Rough estimate
        completionTokens: result.length / 4, // Rough estimate
        totalTokens: (query.length + result.length) / 4,
      },
      cacheHit: false,
      source: 'api',
    };
    
    return {
      content: result,
      metadata: {
        type: 'general',
        query,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Error in perplexityGeneralRetrieval:', error);
    throw error;
  }
};

/**
 * Handler for retrieving company information from Perplexity
 */
export const perplexityCompanyRetrieval: NodeHandler = async (input: any, state: GraphState) => {
  console.log('Running perplexityCompanyRetrieval handler');
  
  // Extract company query from input
  const company = typeof input === 'string' ? input : input.company || input.query;
  if (!company) {
    throw new Error('No company provided for company retrieval');
  }
  
  // Create structured query for company information
  const query = `Provide detailed information about ${company}. Include company overview, industry, key financial metrics (revenue, profit margin, market cap, P/E ratio), recent performance, major products/services, key competitors, and recent news. Format the information in a clear, structured way.`;
  
  // Create Perplexity query parameters
  const queryParams: PerplexityQuery = {
    query,
    options: {
      model: LangGraphConfig.perplexity.defaultModel,
      temperature: 0.1, // Lower temperature for more factual responses
      max_tokens: 3000, // Larger context for comprehensive information
    },
    metadata: {
      type: 'company',
      company,
      source: 'perplexity',
    },
  };
  
  // Check cache first
  const cachedResult = await PerplexityCacheService.getCachedQueryResult(queryParams);
  if (cachedResult) {
    console.log(`Found cached result for company: ${company}`);
    
    // Update metrics in state
    state.nodes[state.currentNode!].metrics = {
      ...state.nodes[state.currentNode!].metrics,
      cacheHit: true,
      source: 'cache',
    };
    
    return cachedResult;
  }
  
  // Not found in cache, make API call
  try {
    const result = await perplexityService.searchCompanies(company);
    
    // Cache the result for future use
    await PerplexityCacheService.cacheQueryResult(queryParams, result);
    
    // Update metrics in state
    state.nodes[state.currentNode!].metrics = {
      ...state.nodes[state.currentNode!].metrics,
      tokenUsage: {
        promptTokens: query.length / 4,
        completionTokens: result.length / 4,
        totalTokens: (query.length + result.length) / 4,
      },
      cacheHit: false,
      source: 'api',
    };
    
    return {
      content: result,
      metadata: {
        type: 'company',
        company,
        query,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error(`Error in perplexityCompanyRetrieval for ${company}:`, error);
    throw error;
  }
};

/**
 * Handler for retrieving financial insights from Perplexity
 */
export const perplexityFinancialRetrieval: NodeHandler = async (input: any, state: GraphState) => {
  console.log('Running perplexityFinancialRetrieval handler');
  
  // Extract financial topic from input
  const topic = typeof input === 'string' ? input : input.topic || input.query;
  if (!topic) {
    throw new Error('No topic provided for financial insights retrieval');
  }
  
  // Create structured query for financial insights
  const query = `Provide detailed financial insights about ${topic}. Include current trends, key metrics, investment considerations, risks, and opportunities. Focus on actionable insights and data-driven analysis.`;
  
  // Create Perplexity query parameters
  const queryParams: PerplexityQuery = {
    query,
    options: {
      model: LangGraphConfig.perplexity.defaultModel,
      temperature: 0.2,
      max_tokens: 2500,
    },
    metadata: {
      type: 'financial_insights',
      topic,
      source: 'perplexity',
    },
  };
  
  // Check cache first
  const cachedResult = await PerplexityCacheService.getCachedQueryResult(queryParams);
  if (cachedResult) {
    console.log(`Found cached result for financial insights: ${topic}`);
    
    // Update metrics in state
    state.nodes[state.currentNode!].metrics = {
      ...state.nodes[state.currentNode!].metrics,
      cacheHit: true,
      source: 'cache',
    };
    
    return cachedResult;
  }
  
  // Not found in cache, make API call
  try {
    const result = await perplexityService.getFinancialInsights(topic);
    
    // Cache the result for future use
    await PerplexityCacheService.cacheQueryResult(queryParams, result);
    
    // Update metrics in state
    state.nodes[state.currentNode!].metrics = {
      ...state.nodes[state.currentNode!].metrics,
      tokenUsage: {
        promptTokens: query.length / 4,
        completionTokens: result.length / 4,
        totalTokens: (query.length + result.length) / 4,
      },
      cacheHit: false,
      source: 'api',
    };
    
    return {
      content: result,
      metadata: {
        type: 'financial_insights',
        topic,
        query,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error(`Error in perplexityFinancialRetrieval for ${topic}:`, error);
    throw error;
  }
};

/**
 * Handler for retrieving market news from Perplexity
 */
export const perplexityMarketNewsRetrieval: NodeHandler = async (input: any, state: GraphState) => {
  console.log('Running perplexityMarketNewsRetrieval handler');
  
  // Extract topic and limit from input
  const topic = typeof input === 'string' ? input : input.topic || 'financial markets';
  const limit = typeof input === 'object' && input.limit ? input.limit : 5;
  
  // Create structured query for market news
  const query = `Provide the latest financial market news about ${topic}. Include major market movements, significant events, and relevant information. For each news item, include a concise headline, brief summary, category, and source if available. Provide ${limit} different news items.`;
  
  // Create Perplexity query parameters
  const queryParams: PerplexityQuery = {
    query,
    options: {
      model: LangGraphConfig.perplexity.defaultModel,
      temperature: 0.2,
      max_tokens: 2000,
    },
    metadata: {
      type: 'market_news',
      topic,
      limit,
      source: 'perplexity',
    },
  };
  
  // Check cache first, but use shorter TTL for news
  const cachedResult = await PerplexityCacheService.getCachedQueryResult(queryParams);
  if (cachedResult) {
    console.log(`Found cached result for market news: ${topic}`);
    
    // Update metrics in state
    state.nodes[state.currentNode!].metrics = {
      ...state.nodes[state.currentNode!].metrics,
      cacheHit: true,
      source: 'cache',
    };
    
    return cachedResult;
  }
  
  // Not found in cache, make API call
  try {
    const result = await perplexityService.getMarketNews(topic);
    
    // Cache the result for future use, but with shorter TTL for news (15 minutes)
    await PerplexityCacheService.cacheQueryResult(queryParams, result, 15 * 60);
    
    // Update metrics in state
    state.nodes[state.currentNode!].metrics = {
      ...state.nodes[state.currentNode!].metrics,
      tokenUsage: {
        promptTokens: query.length / 4,
        completionTokens: result.length / 4,
        totalTokens: (query.length + result.length) / 4,
      },
      cacheHit: false,
      source: 'api',
    };
    
    return {
      content: result,
      metadata: {
        type: 'market_news',
        topic,
        limit,
        query,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error(`Error in perplexityMarketNewsRetrieval for ${topic}:`, error);
    throw error;
  }
};