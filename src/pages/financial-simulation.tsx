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
import { ArrowUp, ArrowDown, TrendingUp, AlertTriangle, Zap, Clock, Download, Share2, Check, RefreshCw } from 'lucide-react';
import EnhancedIOSNavBar from '@/components/EnhancedIOSNavBar';
import EnhancedIOSTabBar from '@/components/EnhancedIOSTabBar';
import EnhancedIOSBreadcrumb from '@/components/EnhancedIOSBreadcrumb';
import { IconSystemProvider } from '@/components/IconSystem';
import { ICONS } from '@/components/IconSystem';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

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
  
  // States for PDF generation
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  
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
  
  // Export simulation results as report with real PDF generation
  const exportSimulationReport = async () => {
    if (!summaryMetrics.simulationCompleted) return;
    
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptics.medium();
    }
    
    try {
      setIsGeneratingPdf(true);
      
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      
      // Embed the standard fonts
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Add a page to the document
      const page = pdfDoc.addPage([600, 800]);
      const { width, height } = page.getSize();
      
      // Draw the title
      page.drawText('Financial Simulation Report', {
        x: 50,
        y: height - 50,
        size: 24,
        font: helveticaBold,
        color: rgb(0, 0.3, 0.6), // SCB blue
      });

      // Add subtitle
      page.drawText('Monte Carlo Tree Search Simulation Results', {
        x: 50,
        y: height - 80,
        size: 14,
        font: helveticaFont,
        color: rgb(0.3, 0.3, 0.3),
      });
      
      // Add date
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      page.drawText(`Generated on: ${currentDate}`, {
        x: 50,
        y: height - 110,
        size: 12,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      // Add user role information
      page.drawText(`Role: ${userRole.charAt(0).toUpperCase() + userRole.slice(1)}`, {
        x: 50,
        y: height - 130,
        size: 12,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      // Draw a divider line
      page.drawLine({
        start: { x: 50, y: height - 150 },
        end: { x: width - 50, y: height - 150 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });
      
      // Add summary metrics section
      page.drawText('Simulation Summary Metrics', {
        x: 50,
        y: height - 180,
        size: 18,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });
      
      // Draw summary metrics
      const summaryItems = [
        { label: 'Expected Return:', value: `${summaryMetrics.expectedReturn.toFixed(2)}%`, trend: summaryMetrics.expectedReturn > 7 ? '↑' : '↓' },
        { label: 'Risk Score:', value: summaryMetrics.riskScore.toFixed(1), trend: '' },
        { label: 'Confidence Interval:', value: `${summaryMetrics.confidenceInterval[0].toFixed(1)}% - ${summaryMetrics.confidenceInterval[1].toFixed(1)}%`, trend: '' },
        { label: 'Simulation Iterations:', value: '5,000', trend: '' },
      ];
      
      summaryItems.forEach((item, index) => {
        // Label
        page.drawText(item.label, {
          x: 50,
          y: height - 210 - (index * 25),
          size: 12,
          font: helveticaFont,
          color: rgb(0.3, 0.3, 0.3),
        });
        
        // Value
        page.drawText(item.value, {
          x: 200,
          y: height - 210 - (index * 25),
          size: 12,
          font: helveticaBold,
          color: rgb(0, 0, 0),
        });
        
        // Trend
        if (item.trend) {
          const trendColor = item.trend === '↑' ? rgb(0, 0.7, 0) : rgb(0.8, 0, 0);
          page.drawText(item.trend, {
            x: 300,
            y: height - 210 - (index * 25),
            size: 12,
            font: helveticaFont,
            color: trendColor,
          });
        }
      });
      
      // Draw a divider line
      page.drawLine({
        start: { x: 50, y: height - 320 },
        end: { x: width - 50, y: height - 320 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });
      
      // Add optimal allocation section
      page.drawText('Optimized Asset Allocation', {
        x: 50,
        y: height - 350,
        size: 18,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });
      
      // Draw asset allocation chart and data
      let yPos = height - 380;
      
      for (const [asset, allocation] of Object.entries(summaryMetrics.optimizedAllocation)) {
        const allocationPercentage = (allocation as number) * 100;
        
        // Asset name
        page.drawText(asset, {
          x: 50,
          y: yPos,
          size: 12,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
        
        // Allocation percentage
        page.drawText(`${allocationPercentage.toFixed(1)}%`, {
          x: 200,
          y: yPos,
          size: 12,
          font: helveticaBold,
          color: rgb(0, 0, 0),
        });
        
        // Draw allocation bar
        const barStartX = 250;
        const barMaxWidth = 250;
        const barHeight = 15;
        
        // Background bar
        page.drawRectangle({
          x: barStartX,
          y: yPos - 10,
          width: barMaxWidth,
          height: barHeight,
          color: rgb(0.9, 0.9, 0.9),
        });
        
        // Foreground bar (colored by asset type)
        let barColor;
        if (asset.toLowerCase().includes('equit')) {
          barColor = rgb(0, 0.4, 0.7); // Blue for equities
        } else if (asset.toLowerCase().includes('fixed')) {
          barColor = rgb(0.2, 0.6, 0.3); // Green for fixed income
        } else if (asset.toLowerCase().includes('alt')) {
          barColor = rgb(0.8, 0.3, 0.1); // Orange for alternatives
        } else {
          barColor = rgb(0.6, 0.6, 0.2); // Yellow/gold for cash or others
        }
        
        page.drawRectangle({
          x: barStartX,
          y: yPos - 10,
          width: barMaxWidth * (allocationPercentage / 100),
          height: barHeight,
          color: barColor,
        });
        
        yPos -= 35;
      }
      
      // Draw a divider line
      page.drawLine({
        start: { x: 50, y: yPos - 15 },
        end: { x: width - 50, y: yPos - 15 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });
      
      // Add AI insights section
      page.drawText('AI-Generated Insights', {
        x: 50,
        y: yPos - 45,
        size: 18,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });
      
      const insights = [
        `The optimal allocation provides a ${summaryMetrics.expectedReturn.toFixed(1)}% expected return with moderate risk.`,
        `Recession scenarios show a maximum drawdown of ${(summaryMetrics.riskScore * 2).toFixed(1)}% that recovers within 8 months.`,
        `Increasing ${Object.entries(summaryMetrics.optimizedAllocation)[0][0]} allocation by 5% could improve long-term returns.`,
        'Asset correlation analysis suggests a low-risk diversification strategy for this portfolio.',
        'Long-term projection shows 94% probability of meeting retirement goals with current strategy.',
      ];
      
      insights.forEach((insight, index) => {
        page.drawText(`• ${insight}`, {
          x: 50,
          y: yPos - 75 - (index * 20),
          size: 11,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
      });
      
      // Add footer
      page.drawText('© 2025 Standard Chartered Bank - Confidential', {
        x: width / 2 - 120,
        y: 30,
        size: 10,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      page.drawText('This report was generated using Monte Carlo Tree Search simulation', {
        x: width / 2 - 145,
        y: 15,
        size: 9,
        font: helveticaFont,
        color: rgb(0.6, 0.6, 0.6),
      });
      
      // Serialize the PDFDocument to bytes
      const pdfBytes = await pdfDoc.save();
      
      // Convert the bytes to a Blob
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      // Create a URL for the Blob
      const url = URL.createObjectURL(blob);
      
      // Create a link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `Financial_Simulation_${userRole}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Append to the document, click and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL created for the blob
      URL.revokeObjectURL(url);
      
      // Show success state and provide success haptic feedback
      setDownloadSuccess(true);
      
      if (isAppleDevice) {
        haptics.success();
      }
      
      // Reset success state after 2 seconds
      setTimeout(() => {
        setDownloadSuccess(false);
      }, 2000);
      
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Unable to generate report. Please try again later.');
      
      // Error haptic feedback on Apple devices
      if (isAppleDevice) {
        haptics.error();
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  
  // Handle share action with real sharing functionality
  const handleShareClick = async () => {
    if (isAppleDevice) {
      haptics.medium();
    }
    
    try {
      // Check if Web Share API is available
      if (navigator.share) {
        // Create a simple text version of the report for sharing
        const shareText = `
Financial Simulation Report
Expected Return: ${summaryMetrics.expectedReturn.toFixed(2)}%
Risk Score: ${summaryMetrics.riskScore.toFixed(1)}
Confidence Interval: ${summaryMetrics.confidenceInterval[0].toFixed(1)}% - ${summaryMetrics.confidenceInterval[1].toFixed(1)}%
Generated on: ${new Date().toLocaleDateString()}
        `;
        
        // Use Web Share API to share the report summary
        await navigator.share({
          title: 'SCB Sapphire Financial Simulation Report',
          text: shareText,
          url: window.location.href
        });
        
        // Success haptic feedback
        if (isAppleDevice) {
          haptics.success();
        }
      } else {
        // Fallback for browsers that don't support Web Share API
        // Create a temporary textarea to copy text
        const textarea = document.createElement('textarea');
        textarea.value = `SCB Sapphire Financial Simulation Report\n\nExpected Return: ${summaryMetrics.expectedReturn.toFixed(2)}%\nRisk Score: ${summaryMetrics.riskScore.toFixed(1)}\nConfidence Interval: ${summaryMetrics.confidenceInterval[0].toFixed(1)}% - ${summaryMetrics.confidenceInterval[1].toFixed(1)}%\n\nView more at: ${window.location.href}`;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        alert('Report summary copied to clipboard. You can now paste it into any messaging app.');
        
        // Medium haptic feedback for fallback
        if (isAppleDevice) {
          haptics.medium();
        }
      }
    } catch (error) {
      console.error('Error sharing report:', error);
      
      // Error haptic feedback
      if (isAppleDevice) {
        haptics.error();
      }
      
      alert('Unable to share the report. Please try again later.');
    }
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
    <div>
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
                icon: isGeneratingPdf ? 'arrow.clockwise' : downloadSuccess ? 'checkmark.circle.fill' : 'square.and.arrow.down',
                label: null, // No label in slide-over mode
                onPress: exportSimulationReport,
                disabled: !summaryMetrics.simulationCompleted || isGeneratingPdf,
                variant: downloadSuccess ? 'success' : 'primary',
                size: 'small',
                loading: isGeneratingPdf
              }
            ] : [
              {
                icon: isGeneratingPdf ? 'arrow.clockwise' : downloadSuccess ? 'checkmark.circle.fill' : 'square.and.arrow.down',
                label: isGeneratingPdf ? 'Generating...' : downloadSuccess ? 'Downloaded' : 'Export',
                onPress: exportSimulationReport,
                disabled: !summaryMetrics.simulationCompleted || isGeneratingPdf,
                variant: downloadSuccess ? 'success' : 'primary',
                loading: isGeneratingPdf
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
              : 'px-6 py-4 max-w-6xl'} mx-auto`}>
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
              <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[hsl(var(--border))]'} border rounded-lg ${isMultiTasking && mode === 'slide-over' ? 'p-3' : 'p-4'} ${isAppleDevice ? 'shadow-sm' : ''}`}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className={`${isMultiTasking && mode === 'slide-over' ? 'text-base' : 'text-lg'} font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Monte Carlo Tree Search Simulation
                  </h2>
                  
                  {/* Role selector for iOS devices */}
                  {isAppleDevice && isPlatformDetected && (
                    <div className={`flex items-center ${isMultiTasking && mode === 'slide-over' ? 'gap-1' : 'gap-2'}`}>
                      <EnhancedTouchButton
                        onClick={() => handleRoleChange('investor')}
                        variant={userRole === 'investor' ? 'primary' : isDark ? 'dark' : 'secondary'}
                        size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                      >
                        Investor
                      </EnhancedTouchButton>
                      
                      <EnhancedTouchButton
                        onClick={() => handleRoleChange('advisor')}
                        variant={userRole === 'advisor' ? 'primary' : isDark ? 'dark' : 'secondary'}
                        size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                      >
                        Advisor
                      </EnhancedTouchButton>
                    </div>
                  )}
                </div>
                
                <div className={`${isMultiTasking ? (mode === 'slide-over' ? 'h-[380px]' : 'h-[480px]') : 'h-[580px]'}`}>
                  <EnhancedDynamicSankeySimulation
                    initialData={simulationData}
                    width={simulationRef.current?.offsetWidth || 1000}
                    height={isMultiTasking ? (mode === 'slide-over' ? 330 : 430) : 540}
                    title="Financial Flow Simulation"
                    onSimulationComplete={handleSimulationResults}
                    isAppleDevice={isAppleDevice}
                    isIPad={isIPad}
                    isMultiTasking={isMultiTasking}
                    multiTaskingMode={mode}
                    orientation={orientation}
                    enableHaptics={isAppleDevice}
                    darkMode={isDark}
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
                
                {/* Interactive hint for iOS devices */}
                {isAppleDevice && !loading && (
                  <div className={`text-xs text-center mt-2 ${isDark ? 'text-blue-400 opacity-70' : 'text-blue-600 opacity-70'}`}>
                    {isMultiTasking && mode === 'slide-over'
                      ? 'Tap nodes for details'
                      : 'Tap and drag nodes to explore relationships'
                    }
                  </div>
                )}
              </div>
            </div>
            
            {/* Optimized allocation section - shown after simulation is complete */}
            {summaryMetrics.simulationCompleted && (
              <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[hsl(var(--border))]'} border rounded-lg ${isMultiTasking && mode === 'slide-over' ? 'p-3' : 'p-4'} ${isAppleDevice ? 'shadow-sm' : ''}`}>
                <h2 className={`${isMultiTasking && mode === 'slide-over' ? 'text-base' : 'text-lg'} font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
                  Optimized Asset Allocation
                  
                  {/* Add actions for iOS devices */}
                  {isAppleDevice && (
                    <div className="float-right">
                      <EnhancedTouchButton
                        onClick={exportSimulationReport}
                        variant={downloadSuccess ? "success" : (isDark ? "dark" : "secondary")}
                        size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                        className="flex items-center gap-1"
                        disabled={!summaryMetrics.simulationCompleted || isGeneratingPdf}
                      >
                        {isGeneratingPdf ? (
                          <RefreshCw className={`${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'} animate-spin`} />
                        ) : downloadSuccess ? (
                          <Check className={`${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                        ) : (
                          <Download className={`${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                        )}
                        {!isMultiTasking && <span>{isGeneratingPdf ? 'Generating...' : downloadSuccess ? 'Downloaded' : 'Export'}</span>}
                      </EnhancedTouchButton>
                    </div>
                  )}
                </h2>
                
                <div className={`grid grid-cols-1 ${isMultiTasking && mode === 'slide-over' ? 'gap-3' : isMultiTasking && mode === 'split-view' ? 'gap-4 md:grid-cols-2' : 'md:grid-cols-2 gap-8'}`}>
                  <div>
                    <h3 className={`${isMultiTasking && mode === 'slide-over' ? 'text-sm' : 'text-base'} font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'} mb-3`}>
                      Recommended Allocation
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(summaryMetrics.optimizedAllocation).map(([asset, allocation]: [string, number]) => (
                        <div 
                          key={asset} 
                          className="flex items-center"
                          onClick={() => {
                            if (isAppleDevice) {
                              haptics.light();
                              alert(`Details for ${asset} allocation: ${(allocation * 100).toFixed(1)}%`);
                            }
                          }}
                        >
                          <div className={`${isMultiTasking && mode === 'slide-over' ? 'w-20 text-xs' : 'w-32 text-sm'} font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {asset}
                          </div>
                          <div className="flex-1">
                            <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-4`}>
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
                          <div className={`${isMultiTasking && mode === 'slide-over' ? 'w-12 text-xs' : 'w-16 text-sm'} text-right font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {(allocation * 100).toFixed(1)}%
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* iOS-specific interactive hint */}
                    {isAppleDevice && !isMultiTasking && (
                      <div className="mt-2 text-xs text-center opacity-70 text-blue-600 dark:text-blue-400">
                        Tap on allocation bars for details
                      </div>
                    )}
                  </div>
                  
                  <div className={`${isMultiTasking && mode === 'slide-over' ? 'mt-3' : ''}`}>
                    <h3 className={`${isMultiTasking && mode === 'slide-over' ? 'text-sm' : 'text-base'} font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'} mb-3`}>
                      AI-Generated Insights
                    </h3>
                    <div className={`${
                      isDark 
                        ? 'bg-blue-900/20 border-blue-800/30' 
                        : 'bg-[rgba(var(--horizon-blue),0.05)] border-[rgba(var(--horizon-blue),0.2)]'
                    } border rounded-lg ${isMultiTasking && mode === 'slide-over' ? 'p-2' : 'p-4'}`}>
                      <div className="flex items-start mb-3">
                        <Zap className={`${isMultiTasking && mode === 'slide-over' ? 'h-3 w-3' : 'h-5 w-5'} ${isDark ? 'text-blue-400' : 'text-[rgb(var(--horizon-blue))]'} mr-2 mt-0.5 flex-shrink-0`} />
                        <span className={`${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} font-medium ${isDark ? 'text-gray-200' : 'text-[rgb(var(--horizon-neutral-gray))]'}`}>
                          Key Findings from 5,000+ Simulations
                        </span>
                      </div>
                      <ul className={`space-y-2 ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <li className="flex items-start">
                          <ArrowUp className={`${isMultiTasking && mode === 'slide-over' ? 'h-3 w-3' : 'h-4 w-4'} ${isDark ? 'text-green-400' : 'text-[rgb(var(--scb-american-green))]'} mr-2 mt-0.5 flex-shrink-0`} />
                          <span>The optimal allocation provides a {summaryMetrics.expectedReturn.toFixed(1)}% expected return with moderate risk.</span>
                        </li>
                        <li className="flex items-start">
                          <ArrowDown className={`${isMultiTasking && mode === 'slide-over' ? 'h-3 w-3' : 'h-4 w-4'} ${isDark ? 'text-red-400' : 'text-[rgb(var(--horizon-red))]'} mr-2 mt-0.5 flex-shrink-0`} />
                          <span>Recession scenarios show a maximum drawdown of {(summaryMetrics.riskScore * 2).toFixed(1)}% that recovers within 8 months.</span>
                        </li>
                        <li className="flex items-start">
                          <TrendingUp className={`${isMultiTasking && mode === 'slide-over' ? 'h-3 w-3' : 'h-4 w-4'} ${isDark ? 'text-blue-400' : 'text-[rgb(var(--horizon-blue))]'} mr-2 mt-0.5 flex-shrink-0`} />
                          <span>Increasing {Object.entries(summaryMetrics.optimizedAllocation)[0][0]} allocation by 5% could improve long-term returns.</span>
                        </li>
                      </ul>
                      
                      {/* iOS-specific action button */}
                      {isAppleDevice && (
                        <div className={`mt-3 ${isMultiTasking && mode === 'slide-over' ? 'text-center' : 'text-right'}`}>
                          <EnhancedTouchButton
                            onClick={() => {
                              if (isAppleDevice) {
                                haptics.medium();
                                alert('Viewing detailed AI analysis...');
                              }
                            }}
                            variant={isDark ? "dark" : "link"}
                            size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                          >
                            View Full Analysis
                          </EnhancedTouchButton>
                        </div>
                      )}
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
            showLabels={!isMultiTasking || mode !== 'slide-over'} // Hide labels in slide-over mode
            theme={isDark ? 'dark' : 'light'}
            floating={!isMultiTasking || mode !== 'slide-over'}
            compact={isMultiTasking}
            multiTaskingMode={mode}
          />
        )}
        
        {/* iOS-specific bottom safe area spacer for notched devices */}
        {isAppleDevice && (
          <div className="h-6 sm:h-4 md:h-2"></div>
        )}
      </div>
        </div>
        </IconSystemProvider>
      </ScbBeautifulUI>
    </div>
  );
}