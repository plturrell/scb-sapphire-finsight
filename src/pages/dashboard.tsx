import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { KPICard, ChartCard, TableCard, AlertCard } from '@/components/cards';
import { TrendingUp, TrendingDown, AlertCircle, Sparkles, BarChart3 } from 'lucide-react';
import AllocationPieChart from '@/components/charts/AllocationPieChart';
import { getGrokCompletion } from '@/lib/grok-api';
// Import the report service for simulations
import * as ReportService from '@/lib/report-service';

/**
 * Dashboard MVP for SCB Sapphire FinSight
 * Implements the core components with the SCB brand identity
 */
// Type definition for table columns to fix type error
interface TableColumn {
  header: string;
  accessor: string;
  type?: 'text' | 'number' | 'percentage' | 'currency' | 'date';
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
  renderCell?: (value: any, row: any) => React.ReactNode;
}

// Financial data service hook to fetch data from APIs
const useFinancialData = () => {
  const [data, setData] = useState<{
    assets: any;
    performance: any;
    risk: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, these would call API endpoints
        // For now, we'll simulate API calls with timeouts
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock API response data
        const assets = {
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
        };
        
        const performance = {
          annualizedReturn: 8.7,
          percentChange: 1.2,
          targetReturn: 7.5,
          previousReturn: 7.6
        };
        
        const risk = {
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
        };
        
        setData({ assets, performance, risk });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
        console.error('Error fetching financial data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  return { data, loading, error };
};

// Component for role-based configuration
interface VisibleComponents {
  detailedTables: boolean;
  monteCarloSimulation: boolean;
  riskMetrics: boolean;
  allocationDetails: boolean;
  aiInsights: boolean;
}

const Dashboard: React.FC = () => {
  const [userRole, setUserRole] = useState<'executive' | 'analyst' | 'operations'>('analyst');
  const [aiInsight, setAiInsight] = useState<string>('');
  const [showAiAlert, setShowAiAlert] = useState(false);
  const [visibleComponents, setVisibleComponents] = useState<VisibleComponents>({
    detailedTables: true,
    monteCarloSimulation: true,
    riskMetrics: true,
    allocationDetails: true,
    aiInsights: true
  });
  
  // Fetch financial data
  const { data, loading, error } = useFinancialData();
  
  // Configure dashboard based on user role
  useEffect(() => {
    const configureForRole = () => {
      switch(userRole) {
        case 'executive':
          // High-level summary view with less detail
          setVisibleComponents({
            detailedTables: false,
            monteCarloSimulation: true,
            riskMetrics: true,
            allocationDetails: false,
            aiInsights: true
          });
          break;
        case 'analyst':
          // Complete view with all details and analysis tools
          setVisibleComponents({
            detailedTables: true,
            monteCarloSimulation: true,
            riskMetrics: true,
            allocationDetails: true,
            aiInsights: true
          });
          break;
        case 'operations':
          // Focus on allocation and performance, less on projections
          setVisibleComponents({
            detailedTables: true,
            monteCarloSimulation: false,
            riskMetrics: true,
            allocationDetails: true,
            aiInsights: false
          });
          break;
      }
    };
    
    configureForRole();
  }, [userRole]);
  
  // AI insight generation using Grok API
  useEffect(() => {
    async function generateAiInsight() {
      if (!visibleComponents.aiInsights) return;
      
      try {
        // Use the Grok API to generate financial insights
        const grokMessages = [
          { role: 'user' as const, content: 'Provide a concise financial insight about this portfolio allocation: Equities 51%, Fixed Income 31%, Real Estate 10%, Alternatives 8%.' }
        ];
        
        const response = await getGrokCompletion(grokMessages);
        if (response) {
          setAiInsight(response);
          setShowAiAlert(true);
        }
      } catch (error) {
        console.error('Error generating AI insight:', error);
      }
    }
    
    // Generate insight when component mounts or role changes
    if (!loading && data) {
      generateAiInsight();
    }
  }, [loading, data, visibleComponents.aiInsights]);
  
  // Update the parent component when role changes
  const handleRoleChange = (newRole: 'executive' | 'analyst' | 'operations') => {
    setUserRole(newRole);
  };

  // Financial metrics - would come from API in real implementation
  const financialMetrics = {
    totalAssets: {
      value: '2,456,789',
      percentChange: 3.2,
      target: 2500000,
      previous: 2380000
    },
    portfolioPerformance: {
      value: '8.7',
      percentChange: 1.2,
      target: 7.5,
      previous: 7.6
    },
    riskScore: {
      value: '64',
      percentChange: -3.1,
      target: 60,
      previous: 66
    }
  };

  // Asset allocation data for the pie chart - enhanced with AI indicators
  const allocationData = [
    { name: 'Equities', value: 0.51, color: '#0072AA', aiEnhanced: true, confidence: 0.92 },
    { name: 'Fixed Income', value: 0.31, color: '#21AA47', aiEnhanced: false },
    { name: 'Real Estate', value: 0.10, color: '#78ADD2', aiEnhanced: true, confidence: 0.85 },
    { name: 'Alternatives', value: 0.08, color: '#A4D0A0', aiEnhanced: false }
  ];

  // Sample table data
  const assetData = [
    { id: 1, name: 'Equities', value: 1245600, allocation: 0.51, change: 0.042 },
    { id: 2, name: 'Fixed Income', value: 756400, allocation: 0.31, change: 0.016 },
    { id: 3, name: 'Real Estate', value: 245000, allocation: 0.10, change: -0.023 },
    { id: 4, name: 'Alternatives', value: 196000, allocation: 0.08, change: 0.067 }
  ];

  const tableColumns: TableColumn[] = [
    { header: 'Asset Class', accessor: 'name', type: 'text' },
    { 
      header: 'Value', 
      accessor: 'value', 
      type: 'currency',
      sortable: true
    },
    { 
      header: 'Allocation', 
      accessor: 'allocation', 
      type: 'percentage',
      sortable: true 
    },
    { 
      header: 'Change', 
      accessor: 'change', 
      type: 'percentage',
      sortable: true,
      renderCell: (value: number) => (
        <div className={`flex items-center ${value >= 0 ? 'text-[rgb(var(--scb-american-green))]' : 'text-[rgb(var(--scb-muted-red))]'}`}>
          {value >= 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
          {(Math.abs(value) * 100).toFixed(2)}%
        </div>
      )
    }
  ];

  return (
    <DashboardLayout 
      title="Financial Dashboard" 
      onRoleChange={handleRoleChange}
      userRole={userRole}
    >
      {/* Role-based view content */}
      <div className="mb-2 px-4 py-2 bg-[rgb(var(--scb-light-blue-10))] rounded-md flex items-center">
        <Sparkles className="text-[rgb(var(--scb-honolulu-blue))] mr-2" size={18} />
        <span className="text-sm">
          <span className="font-medium">Current view:</span> {userRole === 'executive' ? 'Executive Summary' : userRole === 'analyst' ? 'Detailed Analysis' : 'Operations View'}
        </span>
      </div>
      <div>
        {/* Error state handling */}
        {error && (
          <div className="mb-6">
            <AlertCard
              title=""
              type="error"
              message="Error Loading Dashboard Data"
              details={error.message || "There was a problem loading your financial data. Please try refreshing the page."}
              timestamp={new Date().toLocaleString()}
              actionable
              actionLabel="Retry"
              onAction={() => window.location.reload()}
              dismissible
            />
          </div>
        )}
        
        {/* AI Alert - following SAP Fiori "Show the Work" principle */}
        {!error && showAiAlert && visibleComponents.aiInsights && (
          <div className="mb-6">
            <AlertCard
              title=""
              type="info"
              message="AI-Powered Insight Generated"
              details={aiInsight}
              timestamp={new Date().toLocaleString()}
              actionable
              actionLabel="Apply Recommendation"
              onDismiss={() => setShowAiAlert(false)}
              dismissible
            />
          </div>
        )}
        
        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div aria-label="Loading dashboard data" role="status" className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[rgb(var(--scb-honolulu-blue))] border-r-transparent mb-4"></div>
            <p className="scb-data-label text-[rgb(var(--scb-honolulu-blue))]">Loading your financial dashboard...</p>
          </div>
        )}
        
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
            <KPICard
              title="Total Assets"
              value={financialMetrics.totalAssets.value}
              valuePrefix="$"
              percentChange={financialMetrics.totalAssets.percentChange}
              trendDirection="up"
              details="Total assets under management"
              benchmark={{ 
                label: 'Previous Period', 
                value: formatCurrency(financialMetrics.totalAssets.previous) 
              }}
              target={{ 
                label: 'Target', 
                value: formatCurrency(financialMetrics.totalAssets.target) 
              }}
          />
          
          <KPICard
            title="Portfolio Performance"
            value={financialMetrics.portfolioPerformance.value}
            valueSuffix="%"
            percentChange={financialMetrics.portfolioPerformance.percentChange}
            trendDirection="up"
            details="Annualized return"
            benchmark={{ 
              label: 'Previous Period', 
              value: financialMetrics.portfolioPerformance.previous + '%'
            }}
            target={{ 
              label: 'Target', 
              value: financialMetrics.portfolioPerformance.target + '%' 
            }}
          />
          
          <KPICard
            title="Risk Score"
            value={financialMetrics.riskScore.value}
            percentChange={financialMetrics.riskScore.percentChange}
            trendDirection="down"
            details="Overall portfolio risk assessment"
            benchmark={{ 
              label: 'Previous Score', 
              value: financialMetrics.riskScore.previous 
            }}
            target={{ 
              label: 'Target', 
              value: financialMetrics.riskScore.target 
            }}
          />
        </div>
        )}
        
        {/* Main content - adapts based on user role */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className={`${userRole === 'executive' ? 'lg:col-span-3' : 'lg:col-span-2'} order-2 lg:order-1`}>
            <ChartCard
              title="Asset Allocation"
              subtitle={userRole === 'executive' 
                ? "Executive summary of portfolio allocation" 
                : "Current portfolio breakdown with AI-enhanced predictions"}
              expandable
              exportable
              aiInsights={visibleComponents.aiInsights 
                ? "Your equity allocation is 5% higher than your target allocation. Based on Monte Carlo simulations (5,000+ runs), reducing equity exposure by 3-5% could optimize your risk-adjusted returns."
                : undefined}
              legendItems={[
                { label: 'Equities', color: '#0072AA', value: '51%' },
                { label: 'Fixed Income', color: '#21AA47', value: '31%' },
                { label: 'Real Estate', color: '#78ADD2', value: '10%' },
                { label: 'Alternatives', color: '#A4D0A0', value: '8%' }
              ]}
            >
              <div className="flex items-center justify-center h-64">
                {/* Actual D3.js visualization component */}
                <AllocationPieChart 
                  data={allocationData}
                  width={400}
                  height={300}
                  innerRadius={80}
                  animate={true}
                  showAIIndicators={true}
                />
              </div>
            </ChartCard>

            {/* Sankey Flow Analysis - based on existing Sankey chart implementation */}
            <div className="mt-6">
              <ChartCard
                title="Portfolio Flow Analysis"
                subtitle="Asset class interactions and risk connections"
                expandable
              >
                <div className="flex items-center justify-center h-64 relative">
                  {/* Placeholder for the Sankey chart - in the real implementation this would use the existing D3.js implementation */}
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-4 px-2 py-1 rounded-sm bg-[rgba(var(--scb-american-green),0.1)] text-xs text-[rgb(var(--scb-american-green))] flex items-center absolute top-0 right-0">
                      <Sparkles className="w-3 h-3 mr-1.5" />
                      <span>AI Enhanced</span>
                    </div>
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="scb-data-label">Sankey chart visualization would render here</p>
                      <p className="scb-supplementary mt-2">Showing asset class relationships</p>
                    </div>
                  </div>
                </div>
              </ChartCard>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <TableCard
              title="Asset Classes"
              subtitle="Current allocation"
              columns={tableColumns}
              data={assetData}
              sortable
              searchable
            />

            {/* Monte Carlo Simulation Card - showcasing the 5,000+ simulations capability */}
            <div className="mt-6">
              <ChartCard
                title="Monte Carlo Forecast"
                subtitle="5,000+ portfolio simulations"
                comparisonPeriod="Next 10 Years"
              >
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="w-full h-32 mb-4 bg-[rgba(var(--scb-honolulu-blue),0.05)] rounded-md px-3 py-2 relative overflow-hidden">
                    {/* Simplified visual representation of Monte Carlo simulations */}
                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[rgb(var(--scb-dark-gray))]" />
                    <div className="absolute bottom-2 left-2 text-xs text-[rgb(var(--scb-dark-gray))]">Today</div>
                    <div className="absolute bottom-2 right-2 text-xs text-[rgb(var(--scb-dark-gray))]">+10 yrs</div>
                    
                    {/* Simulation lines */}
                    {Array.from({ length: 20 }).map((_, i) => {
                      const hue = i < 3 ? 'var(--scb-muted-red)' : i > 15 ? 'var(--scb-american-green)' : 'var(--scb-honolulu-blue)';
                      const height = 30 + Math.random() * 70;
                      return (
                        <div 
                          key={i} 
                          className="absolute bottom-0 left-0 w-full h-24"
                          style={{
                            borderTop: `1px solid rgb(${hue})`,
                            opacity: 0.1 + (i / 40),
                            transform: `translateY(-${height}%) skewX(${10 + i}deg)`,
                            transition: 'all 0.5s ease'
                          }}
                        />
                      );
                    })}
                    
                    {/* Confidence bands */}
                    <div className="absolute bottom-0 left-0 w-full h-16" style={{ 
                      background: 'linear-gradient(to top, rgba(var(--scb-american-green), 0.1), transparent)',
                      clipPath: 'polygon(0% 100%, 100% 100%, 100% 30%, 0% 60%)'
                    }} />
                  </div>
                  
                  <div className="flex justify-between w-full text-center text-xs">
                    <div className="flex flex-col items-center">
                      <span className="text-[rgb(var(--scb-muted-red))] font-medium">Worst Case</span>
                      <span className="scb-metric-tertiary text-[rgb(var(--scb-muted-red))]">-2.1%</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[rgb(var(--scb-honolulu-blue))] font-medium">Expected</span>
                      <span className="scb-metric-tertiary text-[rgb(var(--scb-honolulu-blue))]">+6.4%</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[rgb(var(--scb-american-green))] font-medium">Best Case</span>
                      <span className="scb-metric-tertiary text-[rgb(var(--scb-american-green))]">+11.2%</span>
                    </div>
                  </div>
                </div>
              </ChartCard>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Helper function to format currency
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

export default Dashboard;
