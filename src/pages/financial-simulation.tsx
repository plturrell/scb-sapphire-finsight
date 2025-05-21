import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import reportService from '@/lib/report-service';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';
import EnhancedDynamicSankeySimulation from '@/components/charts/EnhancedDynamicSankeySimulation';
import KPICard from '@/components/cards/KPICard';
import EnhancedLoadingSpinner from '@/components/EnhancedLoadingSpinner';
import EnhancedTouchButton from '@/components/EnhancedTouchButton';
import useMultiTasking from '@/hooks/useMultiTasking';
import { haptics } from '@/lib/haptics';
import { UserRole } from '@/types';
import { useMediaQuery } from 'react-responsive';
import { ArrowUp, ArrowDown, TrendingUp, AlertTriangle, Zap, Clock, Download, Share2 } from 'lucide-react';

// Simulation page with full MCTS integration for SCB Sapphire FinSight
export default function FinancialSimulation() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('investor');
  const [simulationData, setSimulationData] = useState<any>(null);
  const [summaryMetrics, setSummaryMetrics] = useState<any>({
    expectedReturn: 0,
    riskScore: 0,
    confidenceInterval: [0, 0],
    optimizedAllocation: {},
    simulationCompleted: false
  });
  const simulationRef = useRef<HTMLDivElement>(null);
  
  // Platform detection state
  const [isMounted, setIsMounted] = useState(false);
  const [isPlatformDetected, setPlatformDetected] = useState(false);
  const [isAppleDevice, setIsAppleDevice] = useState(false);
  const [isIPad, setIsIPad] = useState(false);
  
  const isSmallScreen = useMediaQuery({ maxWidth: 768 });
  const { mode, isMultiTasking, orientation } = useMultiTasking();
  
  // Detect platform on mount
  useEffect(() => {
    setIsMounted(true);
    
    // Check if we're on an Apple platform
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // Check if we're on iPad specifically
    const isIpad = /iPad/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && 
       navigator.maxTouchPoints > 1 &&
       !navigator.userAgent.includes('iPhone'));
    
    setIsAppleDevice(isIOS);
    setIsIPad(isIpad);
    setPlatformDetected(true);
  }, []);
  
  // Load real financial data and initialize simulation
  useEffect(() => {
    const initializeFinancialData = async () => {
      try {
        setLoading(true);
        // Load actual client financial data from API 
        const portfolioResponse = await reportService.getClientPortfolio();
        const marketResponse = await reportService.getMarketConditions();
        
        // Prepare data for Monte Carlo simulation
        const initialData = {
          nodes: [
            // Core financial nodes
            { name: 'Income', group: 'income', value: portfolioResponse.cashflow.income.total },
            { name: 'Expenses', group: 'expense', value: portfolioResponse.cashflow.expenses.total },
            { name: 'Savings', group: 'asset', value: portfolioResponse.savings.total },
            { name: 'Investments', group: 'investment', value: portfolioResponse.investments.total },
            
            // Asset allocation nodes
            { name: 'Equities', group: 'investment', value: portfolioResponse.investments.equities.total },
            { name: 'Fixed Income', group: 'investment', value: portfolioResponse.investments.fixedIncome.total },
            { name: 'Alternatives', group: 'investment', value: portfolioResponse.investments.alternatives.total },
            { name: 'Cash', group: 'asset', value: portfolioResponse.savings.cash },
            
            // Market condition nodes
            { name: 'Market Growth', group: 'finance', value: marketResponse.growthRate * 100 },
            { name: 'Inflation', group: 'finance', value: marketResponse.inflationRate * 100 },
            { name: 'Recession Risk', group: 'finance', value: marketResponse.recessionProbability * 100 },
            
            // Outcome nodes
            { name: 'Retirement', group: 'asset', value: portfolioResponse.goals.retirement.targetAmount },
            { name: 'Education', group: 'asset', value: portfolioResponse.goals.education?.targetAmount || 0 },
            { name: 'Property', group: 'asset', value: portfolioResponse.goals.property?.targetAmount || 0 },
          ],
          links: [
            // Income flows
            { source: 0, target: 1, value: portfolioResponse.cashflow.expenses.total },
            { source: 0, target: 2, value: portfolioResponse.cashflow.savings },
            { source: 2, target: 3, value: portfolioResponse.investments.contributions.regular },
            
            // Investment allocation flows
            { source: 3, target: 4, value: portfolioResponse.investments.equities.allocation * portfolioResponse.investments.total },
            { source: 3, target: 5, value: portfolioResponse.investments.fixedIncome.allocation * portfolioResponse.investments.total },
            { source: 3, target: 6, value: portfolioResponse.investments.alternatives.allocation * portfolioResponse.investments.total },
            { source: 3, target: 7, value: portfolioResponse.investments.cash.allocation * portfolioResponse.investments.total },
            
            // Market impact flows
            { source: 8, target: 4, value: marketResponse.equityPerformance * portfolioResponse.investments.equities.total, aiEnhanced: true },
            { source: 8, target: 5, value: marketResponse.bondPerformance * portfolioResponse.investments.fixedIncome.total, aiEnhanced: true },
            { source: 9, target: 7, value: -marketResponse.inflationRate * portfolioResponse.savings.cash, aiEnhanced: true },
            { source: 10, target: 4, value: -marketResponse.recessionImpact.equity * portfolioResponse.investments.equities.total, aiEnhanced: true },
            
            // Goal-oriented flows
            { source: 4, target: 11, value: portfolioResponse.goals.retirement.equityContribution },
            { source: 5, target: 11, value: portfolioResponse.goals.retirement.fixedIncomeContribution },
            { source: 6, target: 11, value: portfolioResponse.goals.retirement.alternativesContribution },
            { source: 4, target: 12, value: portfolioResponse.goals.education?.equityContribution || 0 },
            { source: 5, target: 12, value: portfolioResponse.goals.education?.fixedIncomeContribution || 0 },
            { source: 4, target: 13, value: portfolioResponse.goals.property?.equityContribution || 0 },
            { source: 7, target: 13, value: portfolioResponse.goals.property?.cashContribution || 0 },
          ],
          aiInsights: {
            summary: "This analysis shows projected financial flows and their impact on investment goals based on current market conditions and historical data.",
            recommendations: [
              "Consider increasing equity allocation by 5% for higher long-term returns.",
              "Review your emergency fund to ensure it covers 6-9 months of expenses.",
              "Evaluate the impact of rising interest rates on your fixed income holdings."
            ],
            confidence: 0.87,
            updatedAt: new Date()
          }
        };
        
        setSimulationData(initialData);
        setLoading(false);
      } catch (err) {
        console.error('Error loading financial data:', err);
        setError('Unable to load financial data. Please try again later.');
        setLoading(false);
      }
    };
    
    initializeFinancialData();
  }, []);
  
  // Handle simulation results
  const handleSimulationResults = (results: any) => {
    // Provide haptic feedback on Apple devices when simulation completes
    if (isAppleDevice) {
      haptics.success();
    }
    
    // Update KPIs and metrics based on simulation results
    setSummaryMetrics({
      expectedReturn: results.expectedValue.totalReturn,
      riskScore: results.riskMetrics.volatility,
      confidenceInterval: [
        results.riskMetrics.confidenceLowerBound,
        results.riskMetrics.confidenceUpperBound
      ],
      optimizedAllocation: results.optimalPath.allocations,
      simulationCompleted: true
    });
  };
  
  // Handle role change
  const handleRoleChange = (newRole: UserRole) => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptics.selection();
    }
    
    setUserRole(newRole);
  };
  
  // Export simulation results as report
  const exportSimulationReport = async () => {
    if (!summaryMetrics.simulationCompleted) return;
    
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptics.medium();
    }
    
    try {
      const report = await reportService.generateFinancialReport({
        simulationResults: summaryMetrics,
        portfolioData: simulationData,
        clientInfo: {
          role: userRole
        }
      });
      
      // Download or display the report
      window.open(report.downloadUrl, '_blank');
      
      // Success haptic feedback on Apple devices
      if (isAppleDevice) {
        haptics.success();
      }
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Unable to generate report. Please try again later.');
      
      // Error haptic feedback on Apple devices
      if (isAppleDevice) {
        haptics.error();
      }
    }
  };
  
  // Handle download action with haptic feedback
  const handleShareClick = () => {
    if (isAppleDevice) {
      haptics.medium();
    }
    
    // In a real application, this would open a share dialog
    alert('Opening share dialog...');
  };

  return (
    <ScbBeautifulUI 
      showNewsBar={!isSmallScreen && !isMultiTasking} 
      pageTitle="Financial Simulation" 
      showTabs={isAppleDevice}
    >
      <Head>
        <title>Financial Simulation | SCB Sapphire FinSight</title>
      </Head>
      
      <div className={`${isMultiTasking && mode === 'slide-over' ? 'px-3 py-2' : 'px-6 py-4'} max-w-6xl mx-auto`}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-[rgb(var(--scb-primary))]">Monte Carlo Financial Simulation</h1>
          
          <div className="flex items-center space-x-2">
            {isAppleDevice ? (
              <>
                <EnhancedTouchButton 
                  onClick={exportSimulationReport}
                  disabled={!summaryMetrics.simulationCompleted}
                  variant="primary"
                  className="flex items-center gap-1"
                  size={isMultiTasking && mode === 'slide-over' ? 'sm' : 'default'}
                >
                  <Download className={`${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  <span>Export Report</span>
                </EnhancedTouchButton>
                
                <EnhancedTouchButton
                  onClick={handleShareClick}
                  variant="secondary"
                  className="flex items-center gap-1"
                  size={isMultiTasking && mode === 'slide-over' ? 'sm' : 'default'}
                >
                  <Share2 className={`${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  <span>Share</span>
                </EnhancedTouchButton>
              </>
            ) : (
              <button 
                onClick={exportSimulationReport}
                disabled={!summaryMetrics.simulationCompleted}
                className={`fiori-btn ${summaryMetrics.simulationCompleted ? 'fiori-btn-primary' : 'fiori-btn-disabled'} flex items-center gap-1`}
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <EnhancedLoadingSpinner size="lg" message="Loading financial data..." variant="primary" />
          </div>
        ) : error ? (
          <div className="bg-[rgba(var(--horizon-red),0.05)] border border-[rgba(var(--horizon-red),0.2)] rounded-lg p-4 mb-6 flex">
            <AlertTriangle className="h-5 w-5 text-[rgb(var(--horizon-red))] mr-2 flex-shrink-0" />
            <span className="text-gray-700">{error}</span>
          </div>
        ) : (
          <>
            {/* KPI summary cards */}
            <div className={`grid grid-cols-1 gap-4 mb-6 ${isMultiTasking && mode === 'slide-over' ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
              <KPICard 
                title="Expected Return" 
                value={`${summaryMetrics.expectedReturn.toFixed(2)}%`}
                icon={<TrendingUp className="h-5 w-5" />}
                trend={summaryMetrics.expectedReturn > 7 ? 'up' : 'down'}
                trendValue={`${(summaryMetrics.expectedReturn - 7).toFixed(1)}%`}
                trendLabel={summaryMetrics.expectedReturn > 7 ? 'above market avg' : 'below market avg'}
                isAppleDevice={isAppleDevice}
                isMultiTasking={isMultiTasking}
                multiTaskingMode={mode}
              />
              
              <KPICard 
                title="Risk Score" 
                value={summaryMetrics.riskScore.toFixed(1)}
                icon={<AlertTriangle className="h-5 w-5" />}
                colorScale={[
                  { threshold: 3, color: 'green' },
                  { threshold: 7, color: 'yellow' },
                  { threshold: 10, color: 'red' }
                ]}
                trendLabel="on a scale of 1-10"
                isAppleDevice={isAppleDevice}
                isMultiTasking={isMultiTasking}
                multiTaskingMode={mode}
              />
              
              <KPICard 
                title="Confidence Interval" 
                value={`${summaryMetrics.confidenceInterval[0].toFixed(1)}% - ${summaryMetrics.confidenceInterval[1].toFixed(1)}%`}
                icon={<Zap className="h-5 w-5" />}
                description="95% confidence range for returns"
                isAppleDevice={isAppleDevice}
                isMultiTasking={isMultiTasking}
                multiTaskingMode={mode}
              />
              
              <KPICard 
                title="Simulation Status" 
                value={summaryMetrics.simulationCompleted ? 'Complete' : 'In Progress'}
                icon={<Clock className="h-5 w-5" />}
                trend={summaryMetrics.simulationCompleted ? 'up' : 'neutral'}
                trendLabel={summaryMetrics.simulationCompleted ? '5,000 iterations' : 'Running...'}
                isAppleDevice={isAppleDevice}
                isMultiTasking={isMultiTasking}
                multiTaskingMode={mode}
              />
            </div>
            
            {/* Main simulation component */}
            <div ref={simulationRef} className="mb-6">
              <div className="bg-white border border-[hsl(var(--border))] rounded-lg p-4">
                <h2 className="text-lg font-medium mb-4">Monte Carlo Tree Search Simulation</h2>
                <div className={`${isMultiTasking ? (mode === 'slide-over' ? 'h-[400px]' : 'h-[500px]') : 'h-[600px]'}`}>
                  <EnhancedDynamicSankeySimulation
                    initialData={simulationData}
                    width={simulationRef.current?.offsetWidth || 1000}
                    height={isMultiTasking ? (mode === 'slide-over' ? 350 : 450) : 560}
                    title="Financial Flow Simulation"
                    onSimulationComplete={handleSimulationResults}
                    isAppleDevice={isAppleDevice}
                    isIPad={isIPad}
                    isMultiTasking={isMultiTasking}
                    multiTaskingMode={mode}
                    orientation={orientation}
                    enableHaptics={isAppleDevice}
                    simulationConfig={{
                      iterations: 5000,
                      timeHorizon: 24, // 24 months
                      explorationParameter: 1.41,
                      scenarios: ['baseline', 'recession', 'growth'],
                      riskTolerance: userRole === 'advisor' ? 'moderate' : 
                                     userRole === 'investor' ? 'conservative' : 'aggressive'
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* Optimized allocation section - shown after simulation is complete */}
            {summaryMetrics.simulationCompleted && (
              <div className="bg-white border border-[hsl(var(--border))] rounded-lg p-4">
                <h2 className="text-lg font-medium mb-4">Optimized Asset Allocation</h2>
                <div className={`grid grid-cols-1 ${isMultiTasking && mode === 'slide-over' ? 'gap-4' : 'md:grid-cols-2 gap-8'}`}>
                  <div>
                    <h3 className={`${isMultiTasking && mode === 'slide-over' ? 'text-base' : 'text-lg'} font-medium text-gray-900 mb-4`}>Recommended Allocation</h3>
                    <div className="space-y-4">
                      {Object.entries(summaryMetrics.optimizedAllocation).map(([asset, allocation]: [string, number]) => (
                        <div key={asset} className="flex items-center">
                          <div className={`${isMultiTasking && mode === 'slide-over' ? 'w-24 text-xs' : 'w-32 text-sm'} font-medium text-gray-700`}>{asset}</div>
                          <div className="flex-1">
                            <div className="bg-gray-200 rounded-full h-4">
                              <div 
                                className={`rounded-full h-4 ${
                                  asset.toLowerCase().includes('equit') ? 'bg-[rgb(var(--scb-honolulu-blue))]' :
                                  asset.toLowerCase().includes('fixed') ? 'bg-[rgb(var(--scb-lapis-blue))]' :
                                  asset.toLowerCase().includes('alter') ? 'bg-[rgb(var(--scb-american-green))]' :
                                  'bg-[rgb(var(--scb-muted-yellow))]'
                                }`}
                                style={{ width: `${allocation * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className={`${isMultiTasking && mode === 'slide-over' ? 'w-12 text-xs' : 'w-16 text-sm'} text-right font-medium text-gray-900`}>
                            {(allocation * 100).toFixed(1)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className={`${isMultiTasking && mode === 'slide-over' ? 'mt-4' : ''}`}>
                    <h3 className={`${isMultiTasking && mode === 'slide-over' ? 'text-base' : 'text-lg'} font-medium text-gray-900 mb-4`}>AI-Generated Insights</h3>
                    <div className="bg-[rgba(var(--horizon-blue),0.05)] border border-[rgba(var(--horizon-blue),0.2)] rounded-lg p-4">
                      <div className="flex items-start mb-4">
                        <Zap className={`${isMultiTasking && mode === 'slide-over' ? 'h-4 w-4' : 'h-5 w-5'} text-[rgb(var(--horizon-blue))] mr-2 mt-0.5`} />
                        <span className={`${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} font-medium text-[rgb(var(--horizon-neutral-gray))]`}>Key Findings from 5,000+ Simulations</span>
                      </div>
                      <ul className={`space-y-2 ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} text-gray-700`}>
                        <li className="flex items-start">
                          <ArrowUp className={`${isMultiTasking && mode === 'slide-over' ? 'h-3 w-3' : 'h-4 w-4'} text-[rgb(var(--scb-american-green))] mr-2 mt-0.5`} />
                          <span>The optimal allocation provides a {summaryMetrics.expectedReturn.toFixed(1)}% expected return with moderate risk.</span>
                        </li>
                        <li className="flex items-start">
                          <ArrowDown className={`${isMultiTasking && mode === 'slide-over' ? 'h-3 w-3' : 'h-4 w-4'} text-[rgb(var(--horizon-red))] mr-2 mt-0.5`} />
                          <span>Recession scenarios show a maximum drawdown of {(summaryMetrics.riskScore * 2).toFixed(1)}% that recovers within 8 months.</span>
                        </li>
                        <li className="flex items-start">
                          <TrendingUp className={`${isMultiTasking && mode === 'slide-over' ? 'h-3 w-3' : 'h-4 w-4'} text-[rgb(var(--horizon-blue))] mr-2 mt-0.5`} />
                          <span>Increasing {Object.entries(summaryMetrics.optimizedAllocation)[0][0]} allocation by 5% could improve long-term returns.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ScbBeautifulUI>
  );
}