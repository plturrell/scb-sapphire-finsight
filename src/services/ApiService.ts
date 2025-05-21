/**
 * API Service
 * Provides unified access to all backend API endpoints
 */

import axios from 'axios';

// Base API configuration
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Error handling interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log the error
    console.error('API request failed:', error);
    
    // Enhance error with additional context
    const enhancedError = {
      ...error,
      isApiError: true,
      endpoint: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    };
    
    return Promise.reject(enhancedError);
  }
);

/**
 * Company API Service
 */
export const companyApi = {
  /**
   * Search for companies by name, ticker, or industry
   */
  searchCompanies: async (query: string, options?: { 
    industry?: string; 
    sector?: string; 
    limit?: number; 
    offset?: number;
  }) => {
    const params = {
      q: query,
      ...options,
    };
    
    const response = await api.get('/companies/search', { params });
    return response.data;
  },
  
  /**
   * Get company by ID
   */
  getCompanyById: async (id: string) => {
    const response = await api.get(`/companies/get-by-id`, { params: { id } });
    return response.data.company;
  },
  
  /**
   * Get company by name
   */
  getCompanyByName: async (name: string) => {
    const response = await api.get(`/companies/get-by-name`, { params: { name } });
    return response.data.company;
  },
};

/**
 * Market News API Service
 */
export const marketNewsApi = {
  /**
   * Get latest market news
   */
  getLatestNews: async (options?: {
    topic?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }) => {
    const response = await api.get('/market-news', { params: options });
    return response.data;
  },
  
  /**
   * Get news analysis for a specific topic
   */
  getNewsAnalysis: async (topic: string) => {
    const response = await api.get('/market-news/analysis', { params: { topic } });
    return response.data.analysis;
  },
  
  /**
   * Refresh market news data for a specific topic
   */
  refreshMarketNews: async (topic?: string) => {
    const response = await api.post('/market-news/refresh', { topic });
    return response.data;
  },
};

/**
 * Financial Insights API Service
 */
export const financialInsightsApi = {
  /**
   * Get financial insights by topic
   */
  getInsightsByTopic: async (topic: string, options?: {
    limit?: number;
    offset?: number;
  }) => {
    const params = {
      topic,
      ...options,
    };
    
    const response = await api.get('/financial-insights/get-by-topic', { params });
    return response.data;
  },
  
  /**
   * Get financial recommendations for a specific topic
   */
  getRecommendationsByTopic: async (topic: string, options?: {
    limit?: number;
    offset?: number;
  }) => {
    const params = {
      topic,
      ...options,
    };
    
    const response = await api.get('/financial-insights/recommendations', { params });
    return response.data;
  },
  
  /**
   * Refresh financial insights for a specific topic
   */
  refreshFinancialInsights: async (topic: string) => {
    const response = await api.post('/financial-insights/refresh', { topic });
    return response.data;
  },
};

// Export a unified API service
const ApiService = {
  company: companyApi,
  marketNews: marketNewsApi,
  financialInsights: financialInsightsApi,
};

export default ApiService;