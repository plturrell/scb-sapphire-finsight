/**
 * Portfolio Service
 * Provides real-time portfolio performance data, regional analytics, and task management
 * Integrates with the portfolio API to replace mock data
 */

export interface PortfolioData {
  region: string;
  planned: number;
  actual: number;
  currency?: string;
  market?: string;
  riskLevel?: string;
  lastUpdated?: string;
}

export interface TaskData {
  id: string;
  task: string;
  status: 'completed' | 'pending' | 'overdue' | 'in_progress';
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  assignee?: string;
  description?: string;
}

export interface PortfolioMetrics {
  totalRevenue: number;
  revenueChange: number;
  rorwa: number;
  rorwaChange: number;
  sustainableFinance: number;
  tasksOverdue: number;
  tasksTotal: number;
  assetsUnderManagement: number;
  lastUpdated: string;
}

export interface PortfolioSummary {
  totalRegions: number;
  avgPlannedPerformance: number;
  avgActualPerformance: number;
  tasksCompleted: number;
  tasksOverdue: number;
  lastUpdated: string;
}

export class PortfolioService {
  private static instance: PortfolioService;
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
  public static getInstance(): PortfolioService {
    if (!PortfolioService.instance) {
      PortfolioService.instance = new PortfolioService();
    }
    return PortfolioService.instance;
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
  private setCache(key: string, data: any, ttlMinutes: number = 10): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }

  /**
   * Get regional portfolio performance data
   */
  public async getRegionalData(refresh: boolean = false): Promise<PortfolioData[]> {
    const cacheKey = 'regional_data';
    
    if (!refresh) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await fetch(`${this.baseUrl}/portfolio?dataType=regional&refresh=${refresh}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch regional data: ${response.status}`);
      }

      const result = await response.json();
      const regionalData = result.data;
      
      // Cache for 15 minutes
      this.setCache(cacheKey, regionalData, 15);
      
      return regionalData;
    } catch (error) {
      console.error('Error fetching regional portfolio data:', error);
      
      // Return fallback data
      return this.getFallbackRegionalData();
    }
  }

  /**
   * Get task management data
   */
  public async getTaskData(refresh: boolean = false): Promise<TaskData[]> {
    const cacheKey = 'task_data';
    
    if (!refresh) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await fetch(`${this.baseUrl}/portfolio?dataType=tasks&refresh=${refresh}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch task data: ${response.status}`);
      }

      const result = await response.json();
      const taskData = result.data;
      
      // Cache for 10 minutes
      this.setCache(cacheKey, taskData, 10);
      
      return taskData;
    } catch (error) {
      console.error('Error fetching task data:', error);
      
      // Return fallback data
      return this.getFallbackTaskData();
    }
  }

  /**
   * Get portfolio metrics
   */
  public async getMetrics(refresh: boolean = false): Promise<PortfolioMetrics> {
    const cacheKey = 'portfolio_metrics';
    
    if (!refresh) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await fetch(`${this.baseUrl}/portfolio?dataType=metrics&refresh=${refresh}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch portfolio metrics: ${response.status}`);
      }

      const result = await response.json();
      const metrics = result.data;
      
      // Cache for 5 minutes
      this.setCache(cacheKey, metrics, 5);
      
      return metrics;
    } catch (error) {
      console.error('Error fetching portfolio metrics:', error);
      
      // Return fallback data
      return this.getFallbackMetrics();
    }
  }

  /**
   * Get comprehensive portfolio data
   */
  public async getPortfolioData(refresh: boolean = false): Promise<{
    regional: PortfolioData[];
    tasks: TaskData[];
    metrics: PortfolioMetrics;
    summary: PortfolioSummary;
  }> {
    const cacheKey = 'portfolio_comprehensive';
    
    if (!refresh) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await fetch(`${this.baseUrl}/portfolio?dataType=all&refresh=${refresh}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch comprehensive portfolio data: ${response.status}`);
      }

      const result = await response.json();
      
      // Cache for 8 minutes for comprehensive data (shorter TTL for freshness)
      this.setCache(cacheKey, result.data, 8);
      
      return result.data;
    } catch (error) {
      console.error('Error fetching comprehensive portfolio data:', error);
      
      // Return fallback data
      return {
        regional: this.getFallbackRegionalData(),
        tasks: this.getFallbackTaskData(),
        metrics: this.getFallbackMetrics(),
        summary: this.getFallbackSummary()
      };
    }
  }

  /**
   * Update task status
   */
  public async updateTaskStatus(taskId: string, status: TaskData['status']): Promise<TaskData> {
    try {
      const response = await fetch(`${this.baseUrl}/portfolio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_task',
          taskId,
          status
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update task status: ${response.status}`);
      }

      const result = await response.json();
      
      // Clear task cache to refresh data
      this.cache.delete('task_data');
      this.cache.delete('portfolio_comprehensive');
      
      return result.data;
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }

  /**
   * Get performance analysis for a specific region
   */
  public async getRegionAnalysis(region: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/portfolio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'region_analysis',
          region
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch region analysis: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching region analysis:', error);
      
      return {
        analysis: `Analysis for ${region} is currently unavailable. Please try again later.`,
        region,
        confidence: 0.3,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Refresh all cached data
   */
  public async refreshAllData(): Promise<void> {
    this.cache.clear();
    
    // Pre-load fresh data
    await Promise.all([
      this.getRegionalData(true),
      this.getTaskData(true),
      this.getMetrics(true)
    ]);
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  // Fallback data methods

  private getFallbackRegionalData(): PortfolioData[] {
    return [
      { region: 'United Kingdom', planned: 75, actual: 82, currency: 'GBP', market: 'developed', riskLevel: 'low' },
      { region: 'India', planned: 65, actual: 70, currency: 'INR', market: 'emerging', riskLevel: 'medium' },
      { region: 'Bangladesh', planned: 58, actual: 60, currency: 'BDT', market: 'emerging', riskLevel: 'high' },
      { region: 'United States', planned: 85, actual: 88, currency: 'USD', market: 'developed', riskLevel: 'low' },
      { region: 'United Arab Emirates', planned: 62, actual: 65, currency: 'AED', market: 'developed', riskLevel: 'medium' },
      { region: 'China', planned: 78, actual: 80, currency: 'CNY', market: 'emerging', riskLevel: 'medium' },
      { region: 'Korea', planned: 55, actual: 58, currency: 'KRW', market: 'developed', riskLevel: 'medium' },
    ];
  }

  private getFallbackTaskData(): TaskData[] {
    return [
      { 
        id: '1', 
        task: 'Review annual budget allocation', 
        status: 'completed', 
        dueDate: '2025-01-15',
        priority: 'high',
        category: 'budgeting',
        assignee: 'Sofia Chen',
        description: 'Complete annual budget review and allocation for Asia portfolio'
      },
      { 
        id: '2', 
        task: 'Provide personal details for company records', 
        status: 'pending', 
        dueDate: '2025-01-20',
        priority: 'medium',
        category: 'compliance',
        description: 'Update personal information in company system'
      },
      { 
        id: '3', 
        task: 'Update compliance certifications', 
        status: 'overdue', 
        dueDate: '2025-01-10',
        priority: 'high',
        category: 'compliance',
        assignee: 'Compliance Team',
        description: 'Renew mandatory compliance and regulatory certifications'
      },
      { 
        id: '4', 
        task: 'Complete Q4 performance review', 
        status: 'pending', 
        dueDate: '2025-01-25',
        priority: 'high',
        category: 'reporting',
        assignee: 'Sofia Chen',
        description: 'Finalize Q4 2024 performance review for Asia portfolio'
      },
    ];
  }

  private getFallbackMetrics(): PortfolioMetrics {
    return {
      totalRevenue: 14.32,
      revenueChange: 6.3,
      rorwa: 6.3,
      rorwaChange: 6.3,
      sustainableFinance: 50789,
      tasksOverdue: 7,
      tasksTotal: 24,
      assetsUnderManagement: 347.2,
      lastUpdated: new Date().toISOString()
    };
  }

  private getFallbackSummary(): PortfolioSummary {
    return {
      totalRegions: 7,
      avgPlannedPerformance: 68.3,
      avgActualPerformance: 71.9,
      tasksCompleted: 1,
      tasksOverdue: 1,
      lastUpdated: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const portfolioService = PortfolioService.getInstance();
export default portfolioService;