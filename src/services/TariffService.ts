/**
 * Tariff Service
 * 
 * This service provides a unified API for accessing tariff-related data
 * from the backend. It handles all tariff alerts, impact simulations,
 * and tariff search functionality.
 */

import { TariffAlert, SankeyData, TariffChange, IndustryImpact } from '@/types';

// API base configurations
const API_BASE = '/api';
const TARIFF_ALERTS_ENDPOINT = `${API_BASE}/tariff-alerts`;
const TARIFF_SEARCH_ENDPOINT = `${API_BASE}/tariff-search`;
const VIETNAM_SEARCH_ENDPOINT = `${API_BASE}/vietnam/real-search`;

export interface TariffAlertsQueryParams {
  country?: string;
  priority?: string;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface TariffSearchQueryParams {
  term?: string;
  country?: string;
  hsCode?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

export interface TariffImpactQueryParams {
  countries?: string[];
  products?: string[];
  scenarios?: string[];
  timeframe?: string;
}

export class TariffService {
  /**
   * Get all tariff alerts with optional filtering
   */
  static async getTariffAlerts(params?: TariffAlertsQueryParams): Promise<{
    data: TariffAlert[];
    total: number;
  }> {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      // Make API request
      const response = await fetch(
        `${TARIFF_ALERTS_ENDPOINT}?${queryParams.toString()}`
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error');
      }
      
      return {
        data: result.data || [],
        total: result.total || 0
      };
    } catch (error) {
      console.error('Error fetching tariff alerts:', error);
      throw error;
    }
  }
  
  /**
   * Refresh tariff alerts (force bypass cache)
   */
  static async refreshTariffAlerts(params?: TariffAlertsQueryParams): Promise<{
    data: TariffAlert[];
    total: number;
  }> {
    // Add cache busting parameter
    return this.getTariffAlerts({
      ...params,
      cb: Date.now() // Cache buster
    } as any);
  }
  
  /**
   * Search for tariffs by various criteria
   */
  static async searchTariffs(params: TariffSearchQueryParams): Promise<{
    results: TariffChange[];
    total: number;
  }> {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      
      // Make API request
      const response = await fetch(
        `${TARIFF_SEARCH_ENDPOINT}?${queryParams.toString()}`
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error');
      }
      
      return {
        results: result.data || [],
        total: result.total || 0
      };
    } catch (error) {
      console.error('Error searching tariffs:', error);
      throw error;
    }
  }
  
  /**
   * Get Vietnam-specific tariff data
   */
  static async getVietnamTariffData(params: TariffSearchQueryParams): Promise<{
    results: TariffChange[];
    total: number;
  }> {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      
      // Make API request
      const response = await fetch(
        `${VIETNAM_SEARCH_ENDPOINT}?${queryParams.toString()}`
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error');
      }
      
      return {
        results: result.data || [],
        total: result.total || 0
      };
    } catch (error) {
      console.error('Error fetching Vietnam tariff data:', error);
      throw error;
    }
  }
  
  /**
   * Run tariff impact simulation
   */
  static async runImpactSimulation(params: TariffImpactQueryParams): Promise<{
    sankeyData: SankeyData;
    impacts: IndustryImpact[];
  }> {
    try {
      // Make API request
      const response = await fetch(`${API_BASE}/tariff-impact-simulation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error');
      }
      
      return {
        sankeyData: result.sankeyData,
        impacts: result.impacts || []
      };
    } catch (error) {
      console.error('Error running tariff impact simulation:', error);
      throw error;
    }
  }
  
  /**
   * Get available tariff categories
   */
  static async getTariffCategories(): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE}/tariff-categories`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error');
      }
      
      return result.categories || [];
    } catch (error) {
      console.error('Error fetching tariff categories:', error);
      
      // Return fallback categories if API fails
      return [
        'Electronics',
        'Textiles',
        'Automotive',
        'Agricultural Products',
        'Chemicals',
        'Metals',
        'Plastics',
        'Machinery'
      ];
    }
  }
}

export default TariffService;