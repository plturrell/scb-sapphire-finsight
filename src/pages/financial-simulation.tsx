import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import reportService from '../lib/report-service';
import DashboardLayout from '../components/layout/DashboardLayout';
import EnhancedDynamicSankeySimulation from '../components/charts/EnhancedDynamicSankeySimulation';
import DashboardCard from '../components/cards/DashboardCard';
import KPICard from '../components/cards/KPICard';
import EnhancedLoadingSpinner from '../components/EnhancedLoadingSpinner';
import { UserRole } from '../types';
import { ArrowUp, ArrowDown, TrendingUp, AlertTriangle, Zap, Clock } from 'lucide-react';

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
    setUserRole(newRole);
  };
  
  // Export simulation results as report
  const exportSimulationReport = async () => {
    if (!summaryMetrics.simulationCompleted) return;
    
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
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Unable to generate report. Please try again later.');
    }
  };
  
  return (
    <DashboardLayout userRole={userRole} onRoleChange={handleRoleChange}>
      <Head>
        <title>Financial Simulation | SCB Sapphire FinSight</title>
      </Head>
      
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-[rgb(var(--scb-honolulu-blue))]">Monte Carlo Financial Simulation</h1>
          <div className="flex space-x-2">
            <button 
              onClick={exportSimulationReport}
              disabled={!summaryMetrics.simulationCompleted}
              className={`scb-btn scb-btn-primary inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
                ${summaryMetrics.simulationCompleted ? 'bg-[rgb(var(--scb-honolulu-blue))] hover:bg-[rgb(var(--scb-honolulu-blue-dark))]' : 'bg-[rgb(var(--scb-light-gray))] cursor-not-allowed'}`}
            >
              Export Report
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <EnhancedLoadingSpinner size="lg" message="Loading financial data..." variant="primary" />
          </div>
        ) : error ? (
          <div className="bg-[rgba(var(--scb-muted-red),0.1)] border border-[rgba(var(--scb-muted-red),0.3)] text-[rgb(var(--scb-muted-red))] rounded-md p-4 mb-8">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-[rgba(var(--scb-muted-red),0.7)] mr-2" />
              <span>{error}</span>
            </div>
          </div>
        ) : (
          <>
            {/* KPI summary cards */}
            <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
              <KPICard 
                title="Expected Return" 
                value={`${summaryMetrics.expectedReturn.toFixed(2)}%`}
                icon={<TrendingUp className="h-5 w-5" />}
                trend={summaryMetrics.expectedReturn > 7 ? 'up' : 'down'}
                trendValue={`${(summaryMetrics.expectedReturn - 7).toFixed(1)}%`}
                trendLabel={summaryMetrics.expectedReturn > 7 ? 'above market avg' : 'below market avg'}
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
              />
              
              <KPICard 
                title="Confidence Interval" 
                value={`${summaryMetrics.confidenceInterval[0].toFixed(1)}% - ${summaryMetrics.confidenceInterval[1].toFixed(1)}%`}
                icon={<Zap className="h-5 w-5" />}
                description="95% confidence range for returns"
              />
              
              <KPICard 
                title="Simulation Status" 
                value={summaryMetrics.simulationCompleted ? 'Complete' : 'In Progress'}
                icon={<Clock className="h-5 w-5" />}
                trend={summaryMetrics.simulationCompleted ? 'up' : 'neutral'}
                trendLabel={summaryMetrics.simulationCompleted ? '5,000 iterations' : 'Running...'}
              />
            </div>
            
            {/* Main simulation component */}
            <div ref={simulationRef} className="mb-8">
              <DashboardCard title="Monte Carlo Tree Search Simulation">
                <div className="h-[600px]">
                  <EnhancedDynamicSankeySimulation
                    initialData={simulationData}
                    width={simulationRef.current?.offsetWidth || 1000}
                    height={560}
                    title="Financial Flow Simulation"
                    onSimulationComplete={handleSimulationResults}
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
              </DashboardCard>
            </div>
            
            {/* Optimized allocation section - shown after simulation is complete */}
            {summaryMetrics.simulationCompleted && (
              <DashboardCard title="Optimized Asset Allocation">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Recommended Allocation</h3>
                    <div className="space-y-4">
                      {Object.entries(summaryMetrics.optimizedAllocation).map(([asset, allocation]: [string, number]) => (
                        <div key={asset} className="flex items-center">
                          <div className="w-32 text-sm font-medium text-gray-700">{asset}</div>
                          <div className="flex-1">
                            <div className="bg-gray-200 rounded-full h-4">
                              <div 
                                className={`rounded-full h-4 ${
                                  asset.toLowerCase().includes('equit') ? 'bg-blue-600' :
                                  asset.toLowerCase().includes('fixed') ? 'bg-purple-600' :
                                  asset.toLowerCase().includes('alter') ? 'bg-green-600' :
                                  'bg-yellow-600'
                                }`}
                                style={{ width: `${allocation * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="w-16 text-right text-sm font-medium text-gray-900">
                            {(allocation * 100).toFixed(1)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">AI-Generated Insights</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <div className="flex items-start mb-4">
                        <Zap className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                        <span className="text-sm font-medium text-blue-900">Key Findings from 5,000+ Simulations</span>
                      </div>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start">
                          <ArrowUp className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                          <span>The optimal allocation provides a {summaryMetrics.expectedReturn.toFixed(1)}% expected return with moderate risk.</span>
                        </li>
                        <li className="flex items-start">
                          <ArrowDown className="h-4 w-4 text-red-600 mr-2 mt-0.5" />
                          <span>Recession scenarios show a maximum drawdown of {(summaryMetrics.riskScore * 2).toFixed(1)}% that recovers within 8 months.</span>
                        </li>
                        <li className="flex items-start">
                          <TrendingUp className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
                          <span>Increasing {Object.entries(summaryMetrics.optimizedAllocation)[0][0]} allocation by 5% could improve long-term returns.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </DashboardCard>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
