import { TransactionSector } from '@/types';

/**
 * Analytics Service
 * Provides real-time financial analytics data for dashboard and analytics pages
 * Integrates with the analytics API to replace mock data
 */
export class AnalyticsService {
  private static instance: AnalyticsService;
  private baseUrl: string;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  
  private constructor() {
    // Use appropriate base URL based on environment
    this.baseUrl = typeof window !== 'undefined' 
      ? window.location.origin + '/api'
      : process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Get from cache if available and not expired
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set cache with TTL
   */
  private setCache(key: string, data: any, ttlMinutes: number = 5): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }

  /**
   * Get sector performance data
   */
  public async getSectorData(refresh: boolean = false): Promise<TransactionSector[]> {
    const cacheKey = 'sectors';
    
    if (!refresh) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await fetch(`${this.baseUrl}/analytics?dataType=sectors&refresh=${refresh}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch sector data: ${response.status}`);
      }

      const result = await response.json();
      const sectorData = result.data;
      
      // Cache for 5 minutes
      this.setCache(cacheKey, sectorData, 5);
      
      return sectorData;
    } catch (error) {
      console.error('Error fetching sector data:', error);
      
      // Return fallback data
      return this.getFallbackSectorData();
    }
  }

  /**
   * Get trend data for charts
   */
  public async getTrendData(refresh: boolean = false): Promise<any[]> {
    const cacheKey = 'trends';
    
    if (!refresh) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await fetch(`${this.baseUrl}/analytics?dataType=trends&refresh=${refresh}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch trend data: ${response.status}`);
      }

      const result = await response.json();
      const trendData = result.data;
      
      // Cache for 10 minutes
      this.setCache(cacheKey, trendData, 10);
      
      return trendData;
    } catch (error) {
      console.error('Error fetching trend data:', error);
      
      // Return fallback data
      return this.getFallbackTrendData();
    }
  }

  /**
   * Get distribution data for pie charts
   */
  public async getDistributionData(refresh: boolean = false): Promise<any[]> {
    const cacheKey = 'distribution';
    
    if (!refresh) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await fetch(`${this.baseUrl}/analytics?dataType=distribution&refresh=${refresh}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch distribution data: ${response.status}`);
      }

      const result = await response.json();
      const distributionData = result.data;
      
      // Cache for 15 minutes
      this.setCache(cacheKey, distributionData, 15);
      
      return distributionData;
    } catch (error) {
      console.error('Error fetching distribution data:', error);
      
      // Return fallback data
      return this.getFallbackDistributionData();
    }
  }

  /**
   * Get comprehensive dashboard data
   */
  public async getDashboardData(refresh: boolean = false): Promise<{
    sectors: TransactionSector[];
    trends: any[];
    distribution: any[];
    summary: any;
  }> {
    const cacheKey = 'dashboard';
    
    if (!refresh) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await fetch(`${this.baseUrl}/analytics?dataType=dashboard&refresh=${refresh}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.status}`);
      }

      const result = await response.json();
      
      // Cache for 3 minutes for dashboard (shorter TTL for freshness)
      this.setCache(cacheKey, result, 3);
      
      return result;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // Return fallback data
      return {
        sectors: this.getFallbackSectorData(),
        trends: this.getFallbackTrendData(),
        distribution: this.getFallbackDistributionData(),
        summary: this.getFallbackSummaryData()
      };
    }
  }

  /**
   * Get custom sector analysis
   */
  public async getSectorAnalysis(sector: string, focusAreas?: string[]): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisType: 'sector_analysis',
          parameters: { sector, focusAreas }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch sector analysis: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching sector analysis:', error);
      
      return {
        analysis: 'Sector analysis unavailable at this time. Please try again later.',
        sector,
        focusAreas: focusAreas || [],
        confidence: 0.3,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Get market insights
   */
  public async getMarketInsights(): Promise<any[]> {
    const cacheKey = 'market_insights';
    
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.baseUrl}/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisType: 'market_insights',
          parameters: {}
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch market insights: ${response.status}`);
      }

      const result = await response.json();
      const insights = result.insights;
      
      // Cache insights for 30 minutes
      this.setCache(cacheKey, insights, 30);
      
      return insights;
    } catch (error) {
      console.error('Error fetching market insights:', error);
      
      return this.getFallbackMarketInsights();
    }
  }

  /**
   * Refresh all cached data
   */
  public async refreshAllData(): Promise<void> {
    this.cache.clear();
    
    // Pre-load fresh data
    await Promise.all([
      this.getSectorData(true),
      this.getTrendData(true),
      this.getDistributionData(true),
      this.getMarketInsights()
    ]);
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  // Fallback data methods

  private getFallbackSectorData(): TransactionSector[] {
    return [
      { name: 'Aluminum', revenue: 485000, accounts: 117, income: 43650, assets: 2425000, deposits: 1747500, yield: 5.1, rowWa: 3.4, change: 2.3 },
      { name: 'Automotive', revenue: 763000, accounts: 88, income: 68670, assets: 3206000, deposits: 2084900, yield: 6.0, rowWa: 4.1, change: -0.8 },
      { name: 'Cement', revenue: 407000, accounts: 98, income: 36630, assets: 1935500, deposits: 1419150, yield: 4.9, rowWa: 3.2, change: 4.1 },
      { name: 'Chemical', revenue: 694000, accounts: 113, income: 62460, assets: 2776000, deposits: 1998400, yield: 5.7, rowWa: 3.9, change: 1.8 },
      { name: 'Diversified', revenue: 876000, accounts: 142, income: 78840, assets: 3590400, deposits: 2513280, yield: 6.2, rowWa: 4.4, change: 3.9 },
      { name: 'Gems', revenue: 334000, accounts: 77, income: 30060, assets: 1503000, deposits: 1102200, yield: 4.3, rowWa: 2.9, change: -0.2 },
      { name: 'Construction', revenue: 567000, accounts: 108, income: 51030, assets: 2401500, deposits: 1721070, yield: 5.2, rowWa: 3.5, change: 2.4 },
      { name: 'Real Estate', revenue: 741000, accounts: 93, income: 66690, assets: 3112200, deposits: 2232540, yield: 6.0, rowWa: 4.1, change: 3.9 },
      { name: 'Telecom', revenue: 798000, accounts: 121, income: 71820, assets: 3392000, deposits: 2374400, yield: 6.1, rowWa: 4.2, change: 2.5 },
      { name: 'Others', revenue: 572000, accounts: 134, income: 51480, assets: 2288000, deposits: 1601600, yield: 5.1, rowWa: 3.4, change: 2.1 },
    ];
  }

  private getFallbackTrendData(): any[] {
    return [
      { month: 'Jan', revenue: 428000, accounts: 87 },
      { month: 'Feb', revenue: 461000, accounts: 90 },
      { month: 'Mar', revenue: 492000, accounts: 94 },
      { month: 'Apr', revenue: 518000, accounts: 97 },
      { month: 'May', revenue: 551000, accounts: 101 },
      { month: 'Jun', revenue: 584000, accounts: 105 },
    ];
  }

  private getFallbackDistributionData(): any[] {
    const iosColors = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6'];
    
    return [
      { name: 'Diversified', value: 26, color: iosColors[0] },
      { name: 'Telecom', value: 19, color: iosColors[1] },
      { name: 'Automotive', value: 17, color: iosColors[2] },
      { name: 'Real Estate', value: 16, color: iosColors[3] },
      { name: 'Others', value: 22, color: iosColors[4] },
    ];
  }

  private getFallbackSummaryData(): any {
    return {
      totalRevenue: 6237000,
      totalAccounts: 1071,
      avgYield: 5.46,
      totalAssets: 27654100,
      growthRate: 4.2,
      marketCap: 33184920,
      activeCustomers: 9103,
      portfolioValue: 23505985
    };
  }

  private getFallbackMarketInsights(): any[] {
    return [
      {
        type: 'growth_opportunity',
        title: 'Digital Banking Expansion',
        description: 'Significant growth potential in mobile banking adoption across rural Thailand',
        impact: 'high',
        timeframe: '6-12 months',
        confidence: 0.85,
        lastUpdated: new Date().toISOString()
      },
      {
        type: 'risk_factor',
        title: 'Interest Rate Volatility',
        description: 'Rising global interest rates may impact loan demand and deposit flows',
        impact: 'medium',
        timeframe: '3-6 months',
        confidence: 0.78,
        lastUpdated: new Date().toISOString()
      },
      {
        type: 'market_trend',
        title: 'ESG Investment Growth',
        description: 'Increasing demand for environmentally sustainable investment products',
        impact: 'medium',
        timeframe: '12-24 months',
        confidence: 0.82,
        lastUpdated: new Date().toISOString()
      }
    ];
  }
}

// Export singleton instance
export const analyticsService = AnalyticsService.getInstance();
export default analyticsService;