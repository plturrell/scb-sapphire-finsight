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
import EnhancedIOSNavBar from '@/components/EnhancedIOSNavBar';
import EnhancedIOSTabBar from '@/components/EnhancedIOSTabBar';
import EnhancedIOSBreadcrumb from '@/components/EnhancedIOSBreadcrumb';
import { IconSystemProvider } from '@/components/IconSystem';
import { ICONS } from '@/components/IconSystem';
import { useUIPreferences } from '@/context/UIPreferencesContext';

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
  
  // Access UI preferences for theme
  const { isDarkMode: isDark } = useUIPreferences();
  
  const isSmallScreen = useMediaQuery({ maxWidth: 768 });
  const { mode, isMultiTasking, orientation } = useMultiTasking();
  
  // Active tab state for the iOS tab bar
  const [activeTab, setActiveTab] = useState('analytics');
  
  // iOS tab bar configuration
  const tabItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: ICONS.HOME,
      href: '/dashboard',
    },
    {
      key: 'analytics',
      label: 'Analytics',
      icon: 'chart.bar.xaxis',
      activeIcon: 'chart.bar.fill.xaxis',
      href: '/financial-simulation',
      sfSymbolVariant: 'fill'
    },
    {
      key: 'knowledge',
      label: 'Knowledge',
      icon: 'network',
      href: '/knowledge-dashboard',
    },
    {
      key: 'reports',
      label: 'Reports',
      icon: 'doc.text',
      href: '/reports',
      badge: '3',
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: ICONS.SETTINGS,
      href: '/settings',
    },
  ];
  
  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Home', href: '/', icon: 'house' },
    { label: 'Analytics', href: '/financial-simulation', icon: 'chart.bar' }
  ];
  
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

  // Handle tab changes
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    // Navigate to the corresponding page
    const selectedTab = tabItems.find(item => item.key === key);
    if (selectedTab && selectedTab.href) {
      router.push(selectedTab.href);
    }
  };

  return (
    <React.Fragment>
      <Head>
        <title>Financial Simulation | SCB Sapphire</title>
        <meta name="description" content="Monte Carlo financial simulation and analysis for optimized investment strategies" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <ScbBeautifulUI showSearchBar={false} showTabs={false} pageTitle="Financial Simulation">
        <IconSystemProvider>
        {isAppleDevice && isPlatformDetected ? (
          <div className={`min-h-screen ${isSmallScreen ? 'pb-20' : 'pb-16'} ${isPlatformDetected ? (isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900') : ''}`}>
          {/* iOS Navigation Bar - Adapted for iPad multi-tasking */}
          <EnhancedIOSNavBar 
            title="Financial Simulation"
            subtitle={isMultiTasking && mode === 'slide-over' ? null : "Monte Carlo Analysis"}
            largeTitle={!isMultiTasking || mode !== 'slide-over'}
            blurred={true}
            showBackButton={true}
            onBackButtonPress={() => router.push('/dashboard')}
            theme={isDark ? 'dark' : 'light'}
            rightActions={isMultiTasking && mode === 'slide-over' ? [
              {
                icon: 'square.and.arrow.down',
                label: null, // No label in slide-over mode
                onPress: exportSimulationReport,
                disabled: !summaryMetrics.simulationCompleted,
                variant: 'primary',
                size: 'small'
              }
            ] : [
              {
                icon: 'square.and.arrow.down',
                label: 'Export',
                onPress: exportSimulationReport,
                disabled: !summaryMetrics.simulationCompleted,
                variant: 'primary'
              },
              {
                icon: 'square.and.arrow.up',
                label: 'Share',
                onPress: handleShareClick
              }
            ]}
            respectSafeArea={true}
            hapticFeedback={true}
            multiTaskingMode={mode}
            isMultiTasking={isMultiTasking}
            compactFormatting={isMultiTasking}
          />
          
          {/* Breadcrumb Navigation - Hide in slide-over mode to save space */}
          {(!isMultiTasking || mode !== 'slide-over') && (
            <div className={`px-4 py-2 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <EnhancedIOSBreadcrumb 
                items={breadcrumbItems}
                showIcons={true}
                hapticFeedback={true}
                theme={isDark ? 'dark' : 'light'}
                compact={isMultiTasking}
              />
            </div>
          )}
          
          {/* Main content container - adjusted padding for multi-tasking */}
          <div className={`${isMultiTasking && mode === 'slide-over' 
            ? 'px-2 py-2 overflow-x-hidden' 
            : isMultiTasking && mode === 'split-view'
              ? 'px-4 py-3 max-w-4xl' 
              : 'px-6 py-4 max-w-6xl'} mx-auto`}
            {/* The main content remains mostly the same, just remove the top heading since it's in the navbar */}
        
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
          <React.Fragment>
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
          </React.Fragment>
        )}

        {/* iOS Tab Bar Navigation */}
        {isAppleDevice && isPlatformDetected && (
          <EnhancedIOSTabBar
            items={tabItems}
            currentTab={activeTab}
            onChange={handleTabChange}
            respectSafeArea={true}
            hapticFeedback={true}
            blurred={true}
            showLabels={true}
            theme={isDark ? 'dark' : 'light'}
            floating={true}
          />
        )}
      </div>
      </div>
        </IconSystemProvider>
      </ScbBeautifulUI>
    </React.Fragment>
  );
}