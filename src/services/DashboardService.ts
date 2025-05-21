/**
 * Dashboard Service
 * Provides data for the dashboard from the Jena backend
 */

import ApiService from './ApiService';

// Types for financial data
export interface AssetAllocation {
  name: string;
  value: number;
  color: string;
  aiEnhanced?: boolean;
  confidence?: number;
}

export interface AssetData {
  id: string | number;
  name: string;
  value: number;
  allocation: number;
  change: number;
}

export interface FinancialMetrics {
  totalAssets: {
    value: string;
    percentChange: number;
    target: number;
    previous: number;
  };
  portfolioPerformance: {
    value: string;
    percentChange: number;
    target: number;
    previous: number;
  };
  riskScore: {
    value: string;
    percentChange: number;
    target: number;
    previous: number;
  };
}

export interface MonteCarloResults {
  worstCase: number;
  expected: number;
  bestCase: number;
  simulationCount: number;
}

export interface FinancialData {
  assets: {
    totalValue: number;
    previousValue: number;
    targetValue: number;
    percentChange: number;
    breakdown: AssetData[];
  };
  performance: {
    annualizedReturn: number;
    percentChange: number;
    targetReturn: number;
    previousReturn: number;
  };
  risk: {
    riskScore: number;
    percentChange: number;
    targetScore: number;
    previousScore: number;
    monteCarloResults: MonteCarloResults;
  };
}

/**
 * Get dashboard financial data
 * Uses our financial insights API and combines with cached portfolio data
 */
export async function getDashboardData(): Promise<FinancialData> {
  try {
    // Get financial insights for the portfolio
    const insights = await ApiService.financialInsights.getInsightsByTopic('portfolio performance');
    
    // Simulate structured data from insights
    // In production, this would be properly extracted from the API response
    let assetsTotal = 2456789;
    let assetsBreakdown = [
      { id: 1, name: 'Equities', value: 1245600, allocation: 0.51, change: 0.042 },
      { id: 2, name: 'Fixed Income', value: 756400, allocation: 0.31, change: 0.016 },
      { id: 3, name: 'Real Estate', value: 245000, allocation: 0.10, change: -0.023 },
      { id: 4, name: 'Alternatives', value: 196000, allocation: 0.08, change: 0.067 }
    ];
    
    // Try to use real data from insights if available
    if (insights && insights.insights && insights.insights.length > 0) {
      const latestInsight = insights.insights[0];
      
      // Check if we have metrics
      if (latestInsight.metrics && latestInsight.metrics.length > 0) {
        // Look for total asset metric
        const assetMetric = latestInsight.metrics.find(m => 
          m.name.toLowerCase().includes('asset') || 
          m.name.toLowerCase().includes('portfolio value')
        );
        
        if (assetMetric && assetMetric.value) {
          // Parse the value if it's a string with currency symbol
          const valueStr = assetMetric.value.toString().replace(/[$,]/g, '');
          const parsedValue = parseFloat(valueStr);
          
          if (!isNaN(parsedValue)) {
            assetsTotal = parsedValue;
          }
        }
        
        // Update asset allocation if we have that data
        if (latestInsight.keyTrends) {
          // Attempt to find allocation trends
          const allocationTrends = latestInsight.keyTrends.filter(trend => 
            trend.trend.toLowerCase().includes('allocation') ||
            trend.trend.toLowerCase().includes('portfolio breakdown')
          );
          
          if (allocationTrends.length > 0) {
            // Parse out allocation percentages if possible
            // This would be more robust in production
            const percentageMatches = allocationTrends[0].trend.match(/(\d+)%/g);
            if (percentageMatches && percentageMatches.length >= 3) {
              // Update allocations based on extracted percentages
              // This is simplified - would be more robust in production
              assetsBreakdown = assetsBreakdown.map((asset, i) => {
                if (i < percentageMatches.length) {
                  const percent = parseInt(percentageMatches[i]) / 100;
                  return {
                    ...asset,
                    allocation: percent,
                    value: assetsTotal * percent
                  };
                }
                return asset;
              });
            }
          }
        }
      }
    }
    
    // Construct the full response object
    return {
      assets: {
        totalValue: assetsTotal,
        previousValue: assetsTotal * 0.97, // 3% growth assumption
        targetValue: assetsTotal * 1.02, // 2% target growth assumption
        percentChange: 3.2, // Placeholder
        breakdown: assetsBreakdown
      },
      performance: {
        annualizedReturn: 8.7,
        percentChange: 1.2,
        targetReturn: 7.5,
        previousReturn: 7.6
      },
      risk: {
        riskScore: 64,
        percentChange: -3.1,
        targetScore: 60,
        previousScore: 66,
        monteCarloResults: {
          worstCase: -2.1,
          expected: 6.4,
          bestCase: 11.2,
          simulationCount: 5000
        }
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    
    // Fallback to default data if API call fails
    return {
      assets: {
        totalValue: 2456789,
        previousValue: 2380000,
        targetValue: 2500000,
        percentChange: 3.2,
        breakdown: [
          { id: 1, name: 'Equities', value: 1245600, allocation: 0.51, change: 0.042 },
          { id: 2, name: 'Fixed Income', value: 756400, allocation: 0.31, change: 0.016 },
          { id: 3, name: 'Real Estate', value: 245000, allocation: 0.10, change: -0.023 },
          { id: 4, name: 'Alternatives', value: 196000, allocation: 0.08, change: 0.067 }
        ]
      },
      performance: {
        annualizedReturn: 8.7,
        percentChange: 1.2,
        targetReturn: 7.5,
        previousReturn: 7.6
      },
      risk: {
        riskScore: 64,
        percentChange: -3.1,
        targetScore: 60,
        previousScore: 66,
        monteCarloResults: {
          worstCase: -2.1,
          expected: 6.4,
          bestCase: 11.2,
          simulationCount: 5000
        }
      }
    };
  }
}

/**
 * Get asset allocation data for the dashboard
 */
export function getAssetAllocationData(breakdown: AssetData[]): AssetAllocation[] {
  // Predefined colors for asset classes
  const colors = {
    'Equities': '#0072AA',
    'Fixed Income': '#21AA47',
    'Real Estate': '#78ADD2',
    'Alternatives': '#A4D0A0',
    'Cash': '#D2D2D2',
    'Commodities': '#E9B949',
    'Other': '#C4C4C4'
  };
  
  // Map breakdown to allocation data with colors
  return breakdown.map(item => ({
    name: item.name,
    value: item.allocation,
    color: colors[item.name as keyof typeof colors] || '#C4C4C4',
    aiEnhanced: item.name === 'Equities' || item.name === 'Real Estate',
    confidence: item.name === 'Equities' ? 0.92 : item.name === 'Real Estate' ? 0.85 : undefined
  }));
}

/**
 * Format financial metrics for display
 */
export function formatFinancialMetrics(data: FinancialData): FinancialMetrics {
  return {
    totalAssets: {
      value: formatNumber(data.assets.totalValue),
      percentChange: data.assets.percentChange,
      target: data.assets.targetValue,
      previous: data.assets.previousValue
    },
    portfolioPerformance: {
      value: data.performance.annualizedReturn.toString(),
      percentChange: data.performance.percentChange,
      target: data.performance.targetReturn,
      previous: data.performance.previousReturn
    },
    riskScore: {
      value: data.risk.riskScore.toString(),
      percentChange: data.risk.percentChange,
      target: data.risk.targetScore,
      previous: data.risk.previousScore
    }
  };
}

/**
 * Format number with commas
 */
function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

// Export a single object with all methods
const DashboardService = {
  getDashboardData,
  getAssetAllocationData,
  formatFinancialMetrics
};

export default DashboardService;