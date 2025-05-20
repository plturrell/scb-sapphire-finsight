/**
 * API utilities for connecting to backends
 * Supports hybrid deployment with NVIDIA GPU acceleration
 */

import axios from 'axios';

// Determine if we're using the hybrid deployment with external GPU backend
const isHybridDeployment = process.env.NEXT_PUBLIC_USE_HYBRID_DEPLOYMENT === 'true';

// Base URL for API endpoints
const getBaseUrl = () => {
  // In hybrid deployment, use the GPU backend URL
  if (isHybridDeployment) {
    return process.env.NEXT_PUBLIC_API_URL || '';
  }
  
  // In Vercel-only deployment, use relative paths
  if (process.env.VERCEL_ENV === 'production') {
    return '';
  }
  
  // In development, call the local Python API server
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888';
};

// Create axios instance with common configuration
const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout for GPU operations
});

// Add authentication if configured
if (process.env.API_AUTH_TOKEN) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${process.env.API_AUTH_TOKEN}`;
}

/**
 * API functions for tariff analysis
 */
export const tariffApi = {
  // Get key metrics
  getMetrics: async () => {
    try {
      const response = await apiClient.get('/api/metrics');
      return response.data;
    } catch (error) {
      console.error('Error fetching metrics:', error);
      throw error;
    }
  },
  
  // Get tariff impacts
  getImpacts: async () => {
    try {
      const response = await apiClient.get('/api/impacts');
      return response.data;
    } catch (error) {
      console.error('Error fetching impacts:', error);
      throw error;
    }
  },
  
  // Get finance options
  getFinanceOptions: async () => {
    try {
      const response = await apiClient.get('/api/finance-options');
      return response.data;
    } catch (error) {
      console.error('Error fetching finance options:', error);
      throw error;
    }
  },
  
  // Get recommendations
  getRecommendations: async () => {
    try {
      const response = await apiClient.get('/api/recommendations');
      return response.data;
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      throw error;
    }
  },
  
  // Run Monte Carlo simulation (GPU-accelerated)
  runMonteCarloSimulation: async (parameters) => {
    try {
      const response = await apiClient.post('/api/monte-carlo', parameters);
      return response.data;
    } catch (error) {
      console.error('Error running Monte Carlo simulation:', error);
      throw error;
    }
  },
  
  // Real-time updates
  getRealTimeUpdate: async () => {
    try {
      const response = await apiClient.get('/api/real-time-update');
      return response.data;
    } catch (error) {
      console.error('Error fetching real-time updates:', error);
      throw error;
    }
  },
  
  // SPARQL query
  executeSparqlQuery: async (query) => {
    try {
      const response = await apiClient.get('/api/sparql', {
        params: { query }
      });
      return response.data;
    } catch (error) {
      console.error('Error executing SPARQL query:', error);
      throw error;
    }
  }
};

export default tariffApi;