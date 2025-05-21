import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';
import EnhancedIOSNavBar from '@/components/EnhancedIOSNavBar';
import EnhancedIOSBreadcrumb from '@/components/EnhancedIOSBreadcrumb';
import EnhancedLoadingSpinner from '@/components/EnhancedLoadingSpinner';
import EnhancedTouchButton from '@/components/EnhancedTouchButton';
import useMultiTasking from '@/hooks/useMultiTasking';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { haptics } from '@/lib/haptics';
import { useMediaQuery } from 'react-responsive';
import reportService from '@/lib/report-service';
import { IconSystemProvider } from '@/components/IconSystem';
import { LineChart, BarChart, Tooltip, XAxis, YAxis, CartesianGrid, Line, Bar, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon, AlertTriangleIcon, TrendingUpIcon, DownloadIcon } from 'lucide-react';

/**
 * Detailed analysis of financial simulation results
 * Full-featured analysis with interactive charts, risk metrics, and scenario breakdowns
 */
export default function DetailedAnalysis() {
  const router = useRouter();
  const { 
    role, 
    expectedReturn, 
    riskScore, 
    confidenceLower, 
    confidenceUpper, 
    simulationId 
  } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  
  // Platform detection
  const [isMounted, setIsMounted] = useState(false);
  const [isPlatformDetected, setPlatformDetected] = useState(false);
  const [isAppleDevice, setIsAppleDevice] = useState(false);
  
  // UI states
  const { isDarkMode: isDark } = useUIPreferences();
  const isSmallScreen = useMediaQuery({ maxWidth: 768 });
  const { mode, isMultiTasking, orientation } = useMultiTasking();
  
  // Tab states
  const [activeTab, setActiveTab] = useState('risk');
  
  // Detect platform on mount
  useEffect(() => {
    setIsMounted(true);
    
    // Check if we're on an Apple platform
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    setIsAppleDevice(isIOS);
    setPlatformDetected(true);
  }, []);
  
  // Fetch detailed analysis data
  useEffect(() => {
    const fetchAnalysisData = async () => {
      if (!simulationId) return;
      
      try {
        setLoading(true);
        const response = await reportService.getDetailedAnalysis(simulationId as string);
        setAnalysisData(response);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching detailed analysis:', err);
        setError('Unable to load detailed analysis. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchAnalysisData();
  }, [simulationId]);
  
  // Tabs for detailed analysis
  const analysisTabs = [
    { id: 'risk', label: 'Risk Analysis' },
    { id: 'scenarios', label: 'Scenarios' },
    { id: 'allocation', label: 'Allocation' },
    { id: 'metrics', label: 'Key Metrics' }
  ];
  
  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Home', href: '/', icon: 'house' },
    { label: 'Simulation', href: '/financial-simulation', icon: 'chart.bar' },
    { label: 'Analysis', href: '#', icon: 'magnifyingglass' }
  ];
  
  // Generate sample scenario data if real data isn't available yet
  const getSampleScenarioData = () => {
    return [
      { name: 'Baseline', probability: 60, return: parseFloat(expectedReturn as string) || 8.5 },
      { name: 'Recession', probability: 25, return: (parseFloat(expectedReturn as string) || 8.5) * 0.4 },
      { name: 'Growth', probability: 15, return: (parseFloat(expectedReturn as string) || 8.5) * 1.5 }
    ];
  };
  
  // Generate sample time series data if real data isn't available yet
  const getSampleTimeSeriesData = () => {
    const baseReturn = parseFloat(expectedReturn as string) || 8.5;
    return Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      expected: baseReturn * (1 + 0.01 * i),
      optimistic: baseReturn * (1 + 0.03 * i),
      pessimistic: baseReturn * (1 + 0.005 * i)
    }));
  };
  
  // Navigate back to simulation
  const handleBackToSimulation = () => {
    if (isAppleDevice) {
      haptics.medium();
    }
    router.push('/financial-simulation');
  };
  
  // Export detailed analysis as PDF with real functionality
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  
  const exportDetailedAnalysisAsPdf = async () => {
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
      page.drawText('Detailed Financial Analysis', {
        x: 50,
        y: height - 50,
        size: 24,
        font: helveticaBold,
        color: rgb(0, 0.3, 0.6), // SCB blue
      });

      // Add subtitle
      page.drawText('Monte Carlo Simulation Analysis Results', {
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
      page.drawText(`Role: ${role || 'Investor'}`, {
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
        { label: 'Expected Return:', value: `${expectedReturn || '8.5'}%`, trend: parseFloat(expectedReturn as string || '8.5') > 7 ? '↑' : '↓' },
        { label: 'Risk Score:', value: riskScore || '4.3', trend: '' },
        { label: 'Confidence Interval:', value: `${confidenceLower || '6.2'}% - ${confidenceUpper || '10.8'}%`, trend: '' },
        { label: 'Simulation Count:', value: '10,000', trend: '' },
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
      
      // Add tab data based on active tab
      if (activeTab === 'risk') {
        page.drawText('Risk Analysis', {
          x: 50,
          y: height - 350,
          size: 18,
          font: helveticaBold,
          color: rgb(0, 0, 0),
        });
        
        // Add risk factor explanations
        page.drawText('Market Volatility: 65%', {
          x: 50,
          y: height - 380,
          size: 12,
          font: helveticaBold,
          color: rgb(0, 0, 0),
        });
        
        page.drawText('Inflation Impact: 42%', {
          x: 50,
          y: height - 405,
          size: 12,
          font: helveticaBold,
          color: rgb(0, 0, 0),
        });
        
        page.drawText('Interest Rate Risk: 78%', {
          x: 50,
          y: height - 430,
          size: 12,
          font: helveticaBold,
          color: rgb(0, 0, 0),
        });
        
        page.drawText('Sector Exposure: 31%', {
          x: 50,
          y: height - 455,
          size: 12,
          font: helveticaBold,
          color: rgb(0, 0, 0),
        });
      } 
      else if (activeTab === 'allocation') {
        page.drawText('Asset Allocation', {
          x: 50,
          y: height - 350,
          size: 18,
          font: helveticaBold,
          color: rgb(0, 0, 0),
        });
        
        // Draw asset allocation data
        const allocations = [
          { asset: 'Equities', allocation: 0.55 },
          { asset: 'Fixed Income', allocation: 0.30 },
          { asset: 'Alternatives', allocation: 0.10 },
          { asset: 'Cash', allocation: 0.05 },
        ];
        
        allocations.forEach((alloc, index) => {
          // Asset name
          page.drawText(alloc.asset, {
            x: 50,
            y: height - 380 - (index * 35),
            size: 12,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
          
          // Allocation percentage
          page.drawText(`${(alloc.allocation * 100).toFixed(1)}%`, {
            x: 200,
            y: height - 380 - (index * 35),
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
            y: height - 390 - (index * 35),
            width: barMaxWidth,
            height: barHeight,
            color: rgb(0.9, 0.9, 0.9),
          });
          
          // Foreground bar (colored by asset type)
          let barColor;
          if (alloc.asset.toLowerCase().includes('equit')) {
            barColor = rgb(0, 0.4, 0.7); // Blue for equities
          } else if (alloc.asset.toLowerCase().includes('fixed')) {
            barColor = rgb(0.2, 0.6, 0.3); // Green for fixed income
          } else if (alloc.asset.toLowerCase().includes('alt')) {
            barColor = rgb(0.8, 0.3, 0.1); // Orange for alternatives
          } else {
            barColor = rgb(0.6, 0.6, 0.2); // Yellow/gold for cash or others
          }
          
          page.drawRectangle({
            x: barStartX,
            y: height - 390 - (index * 35),
            width: barMaxWidth * alloc.allocation,
            height: barHeight,
            color: barColor,
          });
        });
      }
      else if (activeTab === 'metrics') {
        page.drawText('Performance Metrics', {
          x: 50,
          y: height - 350,
          size: 18,
          font: helveticaBold,
          color: rgb(0, 0, 0),
        });
        
        // Add metrics data
        const metrics = [
          { name: 'Expected Return', value: `${expectedReturn || '8.5'}%` },
          { name: 'Volatility', value: `${(parseFloat(riskScore as string || '4.3') * 2.2).toFixed(1)}%` },
          { name: 'Sharpe Ratio', value: '1.73' },
          { name: 'Sortino Ratio', value: '2.12' },
          { name: 'Max Drawdown', value: '-9.4%' },
          { name: 'Success Rate', value: '94%' },
          { name: 'Value at Risk (95%)', value: '-7.2%' },
          { name: 'Expected Tail Loss', value: '-10.4%' },
          { name: 'Beta', value: '0.87' },
          { name: 'Information Ratio', value: '1.21' },
        ];
        
        // Draw in two columns
        metrics.slice(0, 5).forEach((metric, index) => {
          page.drawText(metric.name + ':', {
            x: 50,
            y: height - 380 - (index * 25),
            size: 12,
            font: helveticaFont,
            color: rgb(0.3, 0.3, 0.3),
          });
          
          page.drawText(metric.value, {
            x: 200,
            y: height - 380 - (index * 25),
            size: 12,
            font: helveticaBold,
            color: rgb(0, 0, 0),
          });
        });
        
        metrics.slice(5).forEach((metric, index) => {
          page.drawText(metric.name + ':', {
            x: 330,
            y: height - 380 - (index * 25),
            size: 12,
            font: helveticaFont,
            color: rgb(0.3, 0.3, 0.3),
          });
          
          page.drawText(metric.value, {
            x: 480,
            y: height - 380 - (index * 25),
            size: 12,
            font: helveticaBold,
            color: rgb(0, 0, 0),
          });
        });
      }
      else if (activeTab === 'scenarios') {
        page.drawText('Scenario Analysis', {
          x: 50,
          y: height - 350,
          size: 18,
          font: helveticaBold,
          color: rgb(0, 0, 0),
        });
        
        // Draw scenario data
        const scenarios = [
          { name: 'Baseline', probability: 60, return: parseFloat(expectedReturn as string) || 8.5 },
          { name: 'Recession', probability: 25, return: (parseFloat(expectedReturn as string) || 8.5) * 0.4 },
          { name: 'Growth', probability: 15, return: (parseFloat(expectedReturn as string) || 8.5) * 1.5 }
        ];
        
        // Headers
        page.drawText('Scenario', {
          x: 50,
          y: height - 380,
          size: 12,
          font: helveticaBold,
          color: rgb(0, 0, 0),
        });
        
        page.drawText('Probability', {
          x: 200,
          y: height - 380,
          size: 12,
          font: helveticaBold,
          color: rgb(0, 0, 0),
        });
        
        page.drawText('Return', {
          x: 350,
          y: height - 380,
          size: 12,
          font: helveticaBold,
          color: rgb(0, 0, 0),
        });
        
        // Scenario data
        scenarios.forEach((scenario, index) => {
          page.drawText(scenario.name, {
            x: 50,
            y: height - 410 - (index * 30),
            size: 12,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
          
          page.drawText(`${scenario.probability}%`, {
            x: 200,
            y: height - 410 - (index * 30),
            size: 12,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
          
          page.drawText(`${scenario.return.toFixed(1)}%`, {
            x: 350,
            y: height - 410 - (index * 30),
            size: 12,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
        });
      }
      
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
      link.download = `Financial_Analysis_${role || 'Investor'}_${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`;
      
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
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Error haptic feedback
      if (isAppleDevice) {
        haptics.error();
      }
      
      alert('Unable to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  
  return (
    <div>
      <Head>
        <title>Detailed Analysis | Financial Simulation</title>
        <meta name="description" content="Detailed financial analysis of Monte Carlo simulation results" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <ScbBeautifulUI showSearchBar={false} showTabs={false} pageTitle="Detailed Analysis">
        <IconSystemProvider>
          <div className={`min-h-screen ${isSmallScreen ? 'pb-20' : 'pb-16'} ${isPlatformDetected ? (isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900') : ''}`}>
            {/* iOS Navigation Bar */}
            <EnhancedIOSNavBar 
              title="Detailed Analysis"
              subtitle={isMultiTasking && mode === 'slide-over' ? null : "Financial Simulation Results"}
              largeTitle={!isMultiTasking || mode !== 'slide-over'}
              blurred={true}
              showBackButton={true}
              onBackButtonPress={handleBackToSimulation}
              theme={isDark ? 'dark' : 'light'}
              rightActions={[
                {
                  icon: isGeneratingPdf ? 'arrow.clockwise' : downloadSuccess ? 'checkmark.circle.fill' : 'square.and.arrow.down',
                  label: isGeneratingPdf ? 'Generating...' : downloadSuccess ? 'Downloaded' : 'Export PDF',
                  onPress: exportDetailedAnalysisAsPdf,
                  disabled: isGeneratingPdf,
                  variant: downloadSuccess ? 'success' : 'primary',
                  loading: isGeneratingPdf
                }
              ]}
              respectSafeArea={true}
              hapticFeedback={true}
              multiTaskingMode={mode}
              isMultiTasking={isMultiTasking}
              compactFormatting={isMultiTasking}
            />
            
            {/* Breadcrumb Navigation */}
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
            
            {/* Main content container */}
            <div className={`${isMultiTasking && mode === 'slide-over' 
              ? 'px-2 py-2 overflow-x-hidden' 
              : isMultiTasking && mode === 'split-view'
                ? 'px-4 py-3 max-w-4xl' 
                : 'px-6 py-4 max-w-6xl'} mx-auto`}>
              
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <EnhancedLoadingSpinner size="lg" message="Loading detailed analysis..." variant="primary" />
                </div>
              ) : error ? (
                <div className="bg-[rgba(var(--horizon-red),0.05)] border border-[rgba(var(--horizon-red),0.2)] rounded-lg p-4 mb-6 flex">
                  <AlertTriangleIcon className="h-5 w-5 text-[rgb(var(--horizon-red))] mr-2 flex-shrink-0" />
                  <span className="text-gray-700">{error}</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary section */}
                  <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4 shadow-sm`}>
                    <h2 className="text-xl font-semibold mb-3 text-primary">Analysis Summary</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Expected Return</span>
                        <span className="text-2xl font-bold">{expectedReturn || '8.5'}%</span>
                        <span className={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                          {parseFloat(expectedReturn as string || '8.5') > 7 ? 'Above market average' : 'Below market average'}
                        </span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Risk Score</span>
                        <span className="text-2xl font-bold">{riskScore || '4.3'}</span>
                        <span className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                          {parseFloat(riskScore as string || '4.3') < 5 ? 'Moderate risk profile' : 'High risk profile'}
                        </span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Confidence Interval</span>
                        <span className="text-2xl font-bold">
                          {confidenceLower || '6.2'}% - {confidenceUpper || '10.8'}%
                        </span>
                        <span className={`text-xs ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                          95% confidence range
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Analysis tabs */}
                  <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
                    {analysisTabs.map(tab => (
                      <button
                        key={tab.id}
                        className={`px-4 py-2 font-medium text-sm ${
                          activeTab === tab.id 
                            ? `${isDark ? 'text-blue-400 border-blue-400' : 'text-blue-600 border-blue-600'} border-b-2` 
                            : `${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
                        }`}
                        onClick={() => {
                          setActiveTab(tab.id);
                          if (isAppleDevice) haptics.light();
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  
                  {/* Tab content */}
                  <div className="tab-content">
                    {/* Risk Analysis Tab */}
                    {activeTab === 'risk' && (
                      <div className="space-y-6">
                        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4`}>
                          <h3 className="text-lg font-medium mb-4">Returns Over Time</h3>
                          <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={analysisData?.timeSeriesData || getSampleTimeSeriesData()}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottomRight', offset: -10 }} />
                                <YAxis label={{ value: 'Return (%)', angle: -90, position: 'insideLeft' }} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="expected" stroke="#2563eb" strokeWidth={2} name="Expected" />
                                <Line type="monotone" dataKey="optimistic" stroke="#16a34a" strokeWidth={2} name="Optimistic" />
                                <Line type="monotone" dataKey="pessimistic" stroke="#dc2626" strokeWidth={2} name="Pessimistic" />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        
                        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4`}>
                          <h3 className="text-lg font-medium mb-4">Risk Factors</h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Market Volatility</span>
                              <div className="w-2/3 bg-gray-200 rounded-full h-2.5">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '65%' }}></div>
                              </div>
                              <span className="font-medium">65%</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Inflation Impact</span>
                              <div className="w-2/3 bg-gray-200 rounded-full h-2.5">
                                <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: '42%' }}></div>
                              </div>
                              <span className="font-medium">42%</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Interest Rate Risk</span>
                              <div className="w-2/3 bg-gray-200 rounded-full h-2.5">
                                <div className="bg-red-500 h-2.5 rounded-full" style={{ width: '78%' }}></div>
                              </div>
                              <span className="font-medium">78%</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Sector Exposure</span>
                              <div className="w-2/3 bg-gray-200 rounded-full h-2.5">
                                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '31%' }}></div>
                              </div>
                              <span className="font-medium">31%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Scenarios Tab */}
                    {activeTab === 'scenarios' && (
                      <div className="space-y-6">
                        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4`}>
                          <h3 className="text-lg font-medium mb-4">Scenario Probability</h3>
                          <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={analysisData?.scenarioData || getSampleScenarioData()}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis label={{ value: 'Probability (%)', angle: -90, position: 'insideLeft' }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="probability" fill="#3b82f6" name="Probability" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        
                        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4`}>
                          <h3 className="text-lg font-medium mb-4">Scenario Returns</h3>
                          <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={analysisData?.scenarioData || getSampleScenarioData()}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis label={{ value: 'Return (%)', angle: -90, position: 'insideLeft' }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="return" fill="#10b981" name="Expected Return" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        
                        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4`}>
                          <h3 className="text-lg font-medium mb-4">Scenario Descriptions</h3>
                          <div className="space-y-4">
                            <div className="border-l-4 border-blue-500 pl-4 py-2">
                              <h4 className="font-medium">Baseline Scenario</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                The baseline scenario assumes current market conditions continue, with moderate growth and typical market volatility.
                                Inflation remains under central bank targets and interest rates stabilize at current levels.
                              </p>
                            </div>
                            
                            <div className="border-l-4 border-red-500 pl-4 py-2">
                              <h4 className="font-medium">Recession Scenario</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                The recession scenario models economic contraction, higher unemployment, and market volatility.
                                Asset prices experience significant declines and recovery takes 12-24 months.
                              </p>
                            </div>
                            
                            <div className="border-l-4 border-green-500 pl-4 py-2">
                              <h4 className="font-medium">Growth Scenario</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                The growth scenario assumes stronger-than-expected economic expansion, technological innovation,
                                and increased productivity. Markets perform strongly with lower volatility.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Allocation Tab */}
                    {activeTab === 'allocation' && (
                      <div className="space-y-6">
                        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4`}>
                          <h3 className="text-lg font-medium mb-4">Optimal Asset Allocation</h3>
                          
                          <div className="space-y-4">
                            <div className="flex items-center">
                              <div className="w-32 text-sm font-medium">Equities</div>
                              <div className="flex-1">
                                <div className="bg-gray-200 rounded-full h-4">
                                  <div className="bg-blue-600 h-4 rounded-full" style={{ width: '55%' }}></div>
                                </div>
                              </div>
                              <div className="w-16 text-sm font-medium text-right">55%</div>
                            </div>
                            
                            <div className="flex items-center">
                              <div className="w-32 text-sm font-medium">Fixed Income</div>
                              <div className="flex-1">
                                <div className="bg-gray-200 rounded-full h-4">
                                  <div className="bg-green-600 h-4 rounded-full" style={{ width: '30%' }}></div>
                                </div>
                              </div>
                              <div className="w-16 text-sm font-medium text-right">30%</div>
                            </div>
                            
                            <div className="flex items-center">
                              <div className="w-32 text-sm font-medium">Alternatives</div>
                              <div className="flex-1">
                                <div className="bg-gray-200 rounded-full h-4">
                                  <div className="bg-orange-600 h-4 rounded-full" style={{ width: '10%' }}></div>
                                </div>
                              </div>
                              <div className="w-16 text-sm font-medium text-right">10%</div>
                            </div>
                            
                            <div className="flex items-center">
                              <div className="w-32 text-sm font-medium">Cash</div>
                              <div className="flex-1">
                                <div className="bg-gray-200 rounded-full h-4">
                                  <div className="bg-yellow-500 h-4 rounded-full" style={{ width: '5%' }}></div>
                                </div>
                              </div>
                              <div className="w-16 text-sm font-medium text-right">5%</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4`}>
                          <h3 className="text-lg font-medium mb-4">Allocation by Sector</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="text-md font-medium mb-3">Equity Sectors</h4>
                              <div className="space-y-3">
                                <div className="flex items-center">
                                  <div className="w-32 text-xs">Technology</div>
                                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                                    <div className="bg-indigo-500 h-3 rounded-full" style={{ width: '28%' }}></div>
                                  </div>
                                  <div className="w-12 text-xs text-right">28%</div>
                                </div>
                                
                                <div className="flex items-center">
                                  <div className="w-32 text-xs">Healthcare</div>
                                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                                    <div className="bg-indigo-500 h-3 rounded-full" style={{ width: '18%' }}></div>
                                  </div>
                                  <div className="w-12 text-xs text-right">18%</div>
                                </div>
                                
                                <div className="flex items-center">
                                  <div className="w-32 text-xs">Financial</div>
                                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                                    <div className="bg-indigo-500 h-3 rounded-full" style={{ width: '15%' }}></div>
                                  </div>
                                  <div className="w-12 text-xs text-right">15%</div>
                                </div>
                                
                                <div className="flex items-center">
                                  <div className="w-32 text-xs">Consumer</div>
                                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                                    <div className="bg-indigo-500 h-3 rounded-full" style={{ width: '12%' }}></div>
                                  </div>
                                  <div className="w-12 text-xs text-right">12%</div>
                                </div>
                                
                                <div className="flex items-center">
                                  <div className="w-32 text-xs">Industrial</div>
                                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                                    <div className="bg-indigo-500 h-3 rounded-full" style={{ width: '10%' }}></div>
                                  </div>
                                  <div className="w-12 text-xs text-right">10%</div>
                                </div>
                                
                                <div className="flex items-center">
                                  <div className="w-32 text-xs">Other</div>
                                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                                    <div className="bg-indigo-500 h-3 rounded-full" style={{ width: '17%' }}></div>
                                  </div>
                                  <div className="w-12 text-xs text-right">17%</div>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-md font-medium mb-3">Fixed Income</h4>
                              <div className="space-y-3">
                                <div className="flex items-center">
                                  <div className="w-32 text-xs">Government</div>
                                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                                    <div className="bg-green-500 h-3 rounded-full" style={{ width: '40%' }}></div>
                                  </div>
                                  <div className="w-12 text-xs text-right">40%</div>
                                </div>
                                
                                <div className="flex items-center">
                                  <div className="w-32 text-xs">Corporate</div>
                                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                                    <div className="bg-green-500 h-3 rounded-full" style={{ width: '35%' }}></div>
                                  </div>
                                  <div className="w-12 text-xs text-right">35%</div>
                                </div>
                                
                                <div className="flex items-center">
                                  <div className="w-32 text-xs">Municipal</div>
                                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                                    <div className="bg-green-500 h-3 rounded-full" style={{ width: '15%' }}></div>
                                  </div>
                                  <div className="w-12 text-xs text-right">15%</div>
                                </div>
                                
                                <div className="flex items-center">
                                  <div className="w-32 text-xs">High Yield</div>
                                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                                    <div className="bg-green-500 h-3 rounded-full" style={{ width: '10%' }}></div>
                                  </div>
                                  <div className="w-12 text-xs text-right">10%</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Key Metrics Tab */}
                    {activeTab === 'metrics' && (
                      <div className="space-y-6">
                        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4`}>
                          <h3 className="text-lg font-medium mb-4">Performance Metrics</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <table className="w-full">
                                <tbody>
                                  <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <td className="py-3 text-sm font-medium">Expected Return</td>
                                    <td className="py-3 text-sm text-right">{expectedReturn || '8.5'}%</td>
                                  </tr>
                                  <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <td className="py-3 text-sm font-medium">Volatility</td>
                                    <td className="py-3 text-sm text-right">{parseFloat(riskScore as string || '4.3') * 2.2}%</td>
                                  </tr>
                                  <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <td className="py-3 text-sm font-medium">Sharpe Ratio</td>
                                    <td className="py-3 text-sm text-right">1.73</td>
                                  </tr>
                                  <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <td className="py-3 text-sm font-medium">Sortino Ratio</td>
                                    <td className="py-3 text-sm text-right">2.12</td>
                                  </tr>
                                  <tr>
                                    <td className="py-3 text-sm font-medium">Max Drawdown</td>
                                    <td className="py-3 text-sm text-right">-9.4%</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            
                            <div>
                              <table className="w-full">
                                <tbody>
                                  <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <td className="py-3 text-sm font-medium">Success Rate</td>
                                    <td className="py-3 text-sm text-right">94%</td>
                                  </tr>
                                  <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <td className="py-3 text-sm font-medium">Value at Risk (95%)</td>
                                    <td className="py-3 text-sm text-right">-7.2%</td>
                                  </tr>
                                  <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <td className="py-3 text-sm font-medium">Expected Tail Loss</td>
                                    <td className="py-3 text-sm text-right">-10.4%</td>
                                  </tr>
                                  <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <td className="py-3 text-sm font-medium">Beta</td>
                                    <td className="py-3 text-sm text-right">0.87</td>
                                  </tr>
                                  <tr>
                                    <td className="py-3 text-sm font-medium">Information Ratio</td>
                                    <td className="py-3 text-sm text-right">1.21</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                        
                        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4`}>
                          <h3 className="text-lg font-medium mb-4">Monte Carlo Simulation Details</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                            <div className="flex justify-between">
                              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Time Horizon:</span>
                              <span className="text-sm font-medium">10 years</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Number of Simulations:</span>
                              <span className="text-sm font-medium">10,000</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Confidence Level:</span>
                              <span className="text-sm font-medium">95%</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Simulation Method:</span>
                              <span className="text-sm font-medium">Monte Carlo Tree Search</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Risk Model:</span>
                              <span className="text-sm font-medium">Extended Black-Litterman</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Data Source:</span>
                              <span className="text-sm font-medium">Standard Chartered Research</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Last Updated:</span>
                              <span className="text-sm font-medium">{new Date().toLocaleDateString()}</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Role:</span>
                              <span className="text-sm font-medium capitalize">{role || 'Investor'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4`}>
                          <h3 className="text-lg font-medium mb-4">AI-Generated Recommendations</h3>
                          
                          <div className="space-y-4">
                            <div className={`rounded-lg p-3 ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                              <div className="flex items-center mb-2">
                                <CheckCircleIcon className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'} mr-2`} />
                                <h4 className="font-medium">Asset Allocation Recommendation</h4>
                              </div>
                              <p className="text-sm">
                                Based on your risk profile and the current market conditions, consider increasing equity allocation
                                by 5% and decreasing fixed income by the same amount to optimize long-term returns.
                              </p>
                            </div>
                            
                            <div className={`rounded-lg p-3 ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                              <div className="flex items-center mb-2">
                                <CheckCircleIcon className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'} mr-2`} />
                                <h4 className="font-medium">Sector Rotation Strategy</h4>
                              </div>
                              <p className="text-sm">
                                Consider rotating into defensive sectors like healthcare and consumer staples as a hedge
                                against potential market volatility in the coming quarters.
                              </p>
                            </div>
                            
                            <div className={`rounded-lg p-3 ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                              <div className="flex items-center mb-2">
                                <CheckCircleIcon className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'} mr-2`} />
                                <h4 className="font-medium">Risk Management</h4>
                              </div>
                              <p className="text-sm">
                                Your portfolio shows higher than average exposure to interest rate risk. Consider diversifying
                                your fixed income holdings into variable rate securities to mitigate this risk.
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-6 text-right">
                            <EnhancedTouchButton
                              onClick={() => {
                                if (isAppleDevice) haptics.medium();
                                router.push('/financial-simulation');
                              }}
                              variant="primary"
                              size="sm"
                            >
                              Back to Simulation
                            </EnhancedTouchButton>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </IconSystemProvider>
      </ScbBeautifulUI>
    </div>
  );
}