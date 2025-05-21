import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';
import EnhancedVietnamTariffDashboard from '@/components/EnhancedVietnamTariffDashboard';
import BusinessDataCloudDashboard from '@/components/BusinessDataCloudDashboard.enhanced';
import EnhancedTouchButton from '@/components/EnhancedTouchButton';
import EnhancedIOSNavBar from '@/components/EnhancedIOSNavBar';
import EnhancedIOSBreadcrumb from '@/components/EnhancedIOSBreadcrumb';
import EnhancedIOSTabBar from '@/components/EnhancedIOSTabBar';
import EnhancedLoadingSpinner from '@/components/EnhancedLoadingSpinner';
import useMultiTasking from '@/hooks/useMultiTasking';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { useMicroInteractions } from '@/hooks/useMicroInteractions';
import { haptics } from '@/lib/haptics';
import { useMediaQuery } from 'react-responsive';
import { Link, Globe, Database, ArrowRight, Download, Share2, Bookmark, AlertCircle, RefreshCw, ArrowUp, ArrowDown, Check } from 'lucide-react';
import { IconSystemProvider, ICONS } from '@/components/IconSystem';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * Vietnam Tariff Dashboard Page
 * Comprehensive analysis of Vietnam tariff data with AI-enhanced insights and Monte Carlo simulations
 * Integrates with Business Data Cloud for enhanced analytics
 */
const VietnamTariffDashboardPage: React.FC = () => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isPlatformDetected, setPlatformDetected] = useState(false);
  const [isAppleDevice, setIsAppleDevice] = useState(false);
  const [isIPad, setIsIPad] = useState(false);
  const [isSafeAreaInset, setIsSafeAreaInset] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [bookmarked, setBookmarked] = useState(false);
  
  // Hook references for iOS specifics
  const isSmallScreen = useMediaQuery({ maxWidth: 768 });
  const { mode, isMultiTasking, orientation, sizeClass } = useMultiTasking();
  const { isDarkMode, preferences } = useUIPreferences();
  const { haptic } = useMicroInteractions();
  
  // Shared height ref for dashboard sections
  const dashboardRef = useRef<HTMLDivElement>(null);
  
  // Active tab state for iOS tab bar
  const [activeTab, setActiveTab] = useState('tariffs');
  
  // iOS tab bar configuration
  const tabItems = [
    {
      key: 'home',
      label: 'Home',
      icon: ICONS.HOME,
      href: '/',
    },
    {
      key: 'tariffs',
      label: 'Tariffs',
      icon: 'globe.asia.australia',
      activeIcon: 'globe.asia.australia.fill',
      href: '/vietnam-tariff-dashboard',
      sfSymbolVariant: 'fill'
    },
    {
      key: 'simulation',
      label: 'Simulation',
      icon: 'chart.line.uptrend.xyaxis',
      href: '/financial-simulation',
    },
    {
      key: 'reports',
      label: 'Reports',
      icon: 'doc.text',
      href: '/reports',
      badge: '2',
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
    { label: 'Analytics', href: '/financial-simulation', icon: 'chart.bar' },
    { label: 'Vietnam', href: '/vietnam-tariff-dashboard', icon: 'globe.asia.australia' }
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
    
    // Check for iOS safe area insets (notch/home indicator)
    if (isIOS) {
      const hasSafeArea = window.innerHeight > window.screen.height || 
                        (window.screen.height - window.innerHeight > 50);
      setIsSafeAreaInset(hasSafeArea);
    }
  }, []);

  // Handle action button click with haptic feedback
  const handleActionButtonClick = (path: string) => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptic({ intensity: 'medium' });
    }
    
    router.push(path);
  };

  // Handle share action with haptic feedback
  const handleShareClick = () => {
    if (isAppleDevice) {
      haptic({ intensity: 'medium' });
    }
    
    // In a real application, this would open a share dialog
    alert('Opening share dialog...');
  };

  // States for download process
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  
  // Generate and download PDF report with real functionality
  const handleDownloadClick = async () => {
    if (isAppleDevice) {
      haptic({ intensity: 'medium' });
    }
    
    try {
      setIsGeneratingPdf(true);
      
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      
      // Embed the standard font
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Add a page to the document
      const page = pdfDoc.addPage([600, 800]);
      const { width, height } = page.getSize();
      
      // Draw the title
      page.drawText('Vietnam Tariff Analysis Dashboard', {
        x: 50,
        y: height - 50,
        size: 24,
        font: helveticaBold,
        color: rgb(0, 0.3, 0.6), // SCB blue
      });

      // Add subtitle
      page.drawText('Comprehensive Trade Analytics and Tariff Impact Assessment', {
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
      
      // Draw a divider line
      page.drawLine({
        start: { x: 50, y: height - 130 },
        end: { x: width - 50, y: height - 130 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });
      
      // Add tariff summary
      page.drawText('Tariff Rate Summary', {
        x: 50,
        y: height - 170,
        size: 18,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });
      
      // Draw summary metrics
      const summaryItems = [
        { label: 'Average Tariff Rate:', value: '7.2%', trend: '↓ -0.4%' },
        { label: 'Trade Volume:', value: '$12.8B', trend: '↑ +5.3%' },
        { label: 'Active Alerts:', value: '3', trend: '↑ +1' },
        { label: 'Prediction Accuracy:', value: '94%', trend: '' },
      ];
      
      summaryItems.forEach((item, index) => {
        // Label
        page.drawText(item.label, {
          x: 50,
          y: height - 200 - (index * 25),
          size: 12,
          font: helveticaFont,
          color: rgb(0.3, 0.3, 0.3),
        });
        
        // Value
        page.drawText(item.value, {
          x: 200,
          y: height - 200 - (index * 25),
          size: 12,
          font: helveticaBold,
          color: rgb(0, 0, 0),
        });
        
        // Trend
        if (item.trend) {
          const trendColor = item.trend.includes('↑') ? rgb(0, 0.7, 0) : rgb(0.8, 0, 0);
          page.drawText(item.trend, {
            x: 250,
            y: height - 200 - (index * 25),
            size: 12,
            font: helveticaFont,
            color: trendColor,
          });
        }
      });
      
      // Draw a divider line
      page.drawLine({
        start: { x: 50, y: height - 300 },
        end: { x: width - 50, y: height - 300 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });
      
      // Add tariff insights section
      page.drawText('AI-Generated Tariff Insights', {
        x: 50,
        y: height - 340,
        size: 18,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });
      
      const insights = [
        'Electronics sector shows 7.2% projected growth with tariff reductions',
        'RCEP accelerates textile tariff reductions by 2.1% annually',
        'EU-Vietnam FTA creates 4.2% tariff reduction in machinery',
        'Exchange rate-tariff correlation stands at 0.62',
        'Agricultural imports from Thailand face new safeguard measures',
      ];
      
      insights.forEach((insight, index) => {
        page.drawText(`• ${insight}`, {
          x: 50,
          y: height - 370 - (index * 20),
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
      
      page.drawText('This report was generated using AI-enhanced analytics', {
        x: width / 2 - 130,
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
      link.download = `Vietnam_Tariff_Analysis_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Append to the document, click and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL created for the blob
      URL.revokeObjectURL(url);
      
      // Show success state and provide success haptic feedback
      setDownloadSuccess(true);
      
      if (isAppleDevice) {
        haptic({ intensity: 'heavy' });
      }
      
      // Reset success state after 2 seconds
      setTimeout(() => {
        setDownloadSuccess(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Provide error haptic feedback
      if (isAppleDevice) {
        haptic({ intensity: 'medium' });
      }
      
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  
  // Handle refresh data with haptic feedback
  const handleRefreshData = () => {
    if (isAppleDevice) {
      haptic({ intensity: 'medium' });
    }
    
    setIsRefreshing(true);
    
    // Simulate a data refresh
    setTimeout(() => {
      setIsRefreshing(false);
      
      // Success haptic feedback when complete
      if (isAppleDevice) {
        haptic({ intensity: 'heavy' });
      }
    }, 1500);
  };
  
  // Handle bookmark toggle with haptic feedback
  const handleBookmarkToggle = () => {
    if (isAppleDevice) {
      haptic({ intensity: bookmarked ? 'light' : 'medium' });
    }
    
    setBookmarked(!bookmarked);
  };
  
  // Handle tab changes for iOS tab bar
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    // Navigate to the corresponding page
    const selectedTab = tabItems.find(item => item.key === key);
    if (selectedTab && selectedTab.href) {
      router.push(selectedTab.href);
    }
  };

  return (
    <ScbBeautifulUI 
      showNewsBar={false} 
      pageTitle="Vietnam Tariff Analysis" 
      showTabs={false}
    >
      <IconSystemProvider>
        {isAppleDevice && isPlatformDetected ? (
          <div className={`min-h-screen ${isSmallScreen ? 'pb-20' : 'pb-16'} ${isPlatformDetected ? (isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900') : ''}`}>
            {/* iOS Navigation Bar - Adapted for iPad multi-tasking */}
            <EnhancedIOSNavBar 
              title="Vietnam Tariff Analysis"
              subtitle={isMultiTasking && mode === 'slide-over' ? null : "Monte Carlo Simulation"}
              largeTitle={!isMultiTasking || mode !== 'slide-over'}
              blurred={true}
              showBackButton={true}
              onBackButtonPress={() => router.push('/dashboard')}
              theme={isDarkMode ? 'dark' : 'light'}
              rightActions={isMultiTasking && mode === 'slide-over' ? [
                {
                  icon: bookmarked ? 'bookmark.fill' : 'bookmark',
                  label: null, // No label in slide-over mode
                  onPress: handleBookmarkToggle,
                  variant: bookmarked ? 'primary' : 'secondary',
                  size: 'small'
                },
                {
                  icon: 'arrow.down.doc',
                  label: null, // No label in slide-over mode
                  onPress: handleDownloadClick,
                  variant: 'secondary',
                  size: 'small'
                }
              ] : [
                {
                  icon: bookmarked ? 'bookmark.fill' : 'bookmark',
                  label: bookmarked ? 'Bookmarked' : 'Bookmark',
                  onPress: handleBookmarkToggle,
                  variant: bookmarked ? 'primary' : 'secondary'
                },
                {
                  icon: 'arrow.down.doc',
                  label: 'Export',
                  onPress: handleDownloadClick
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
              <div className={`px-4 py-2 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <EnhancedIOSBreadcrumb 
                  items={breadcrumbItems}
                  showIcons={true}
                  hapticFeedback={true}
                  theme={isDarkMode ? 'dark' : 'light'}
                  compact={isMultiTasking}
                />
              </div>
            )}
            
            {/* Main content container - adjusted padding for multi-tasking */}
            <div className={`${isMultiTasking && mode === 'slide-over' 
              ? 'px-2 py-2 overflow-x-hidden' 
              : isMultiTasking && mode === 'split-view'
                ? 'px-4 py-3 max-w-4xl' 
                : 'px-6 py-4 max-w-6xl'} mx-auto ${isDarkMode ? 'text-white' : ''}`} ref={dashboardRef}>
              
              {/* Vietnam dashboard header with iOS optimizations */}
              <div className="mb-4">
                <div className={`flex justify-between items-center ${isMultiTasking && mode === 'slide-over' ? 'flex-col items-start gap-2' : 'flex-row'}`}>
                  <div className="flex items-center">
                    <Globe className={`mr-2 ${isDarkMode ? 'text-blue-400' : 'text-[rgb(var(--scb-primary))]'}`} 
                      size={isMultiTasking && mode === 'slide-over' ? 18 : 24} />
                    <h1 className={`${isMultiTasking && mode === 'slide-over' ? 'text-lg' : 'text-xl'} font-semibold ${isDarkMode ? 'text-white' : 'text-[rgb(var(--scb-primary))]'}`}>
                      Vietnam Trade Analytics
                    </h1>
                  </div>
                  
                  {/* Refresh button for iOS */}
                  <EnhancedTouchButton
                    onClick={handleRefreshData}
                    variant={isDarkMode ? "dark" : "secondary"}
                    size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                    className="flex items-center gap-1"
                  >
                    <RefreshCw className={`${isRefreshing ? 'animate-spin' : ''} ${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                    {!isMultiTasking && <span>Refresh Data</span>}
                  </EnhancedTouchButton>
                </div>
                
                {/* Description text - hide in slide-over mode to save space */}
                {(!isMultiTasking || mode !== 'slide-over') && (
                  <p className={`mt-2 max-w-[800px] ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} ${isMultiTasking && mode === 'split-view' ? 'text-sm' : ''}`}>
                    Comprehensive analysis of Vietnam's tariff policies and trade impacts with AI-enhanced predictions.
                    Leveraging Monte Carlo simulations to model potential scenarios and impacts across sectors.
                  </p>
                )}
                
                {/* Key metrics summary for iOS */}
                <div className={`mt-3 grid ${
                  isMultiTasking && mode === 'slide-over' 
                    ? 'grid-cols-2 gap-2' 
                    : isMultiTasking && mode === 'split-view'
                      ? 'grid-cols-2 md:grid-cols-4 gap-2' 
                      : 'grid-cols-2 md:grid-cols-4 gap-3'
                }`}>
                  <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-2 flex flex-col items-center justify-center text-center`}>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tariff Rate</div>
                    <div className="flex items-center mt-1">
                      <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>7.2%</span>
                      <ArrowDown className="w-3 h-3 ml-1 text-green-500" />
                    </div>
                  </div>
                  
                  <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-2 flex flex-col items-center justify-center text-center`}>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Trade Volume</div>
                    <div className="flex items-center mt-1">
                      <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>$12.8B</span>
                      <ArrowUp className="w-3 h-3 ml-1 text-green-500" />
                    </div>
                  </div>
                  
                  <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-2 flex flex-col items-center justify-center text-center`}>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Alerts</div>
                    <div className="flex items-center mt-1">
                      <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>3</span>
                      <AlertCircle className="w-3 h-3 ml-1 text-amber-500" />
                    </div>
                  </div>
                  
                  <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-2 flex flex-col items-center justify-center text-center`}>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Predictions</div>
                    <div className="flex items-center mt-1">
                      <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>94%</span>
                      <span className={`text-xs ml-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>accuracy</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Dashboard Content - optimized for iOS and iPad multi-tasking */}
              <div className="space-y-6">
                <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[hsl(var(--border))]'} border rounded-lg shadow-sm overflow-hidden`}>
                  <EnhancedVietnamTariffDashboard 
                    isAppleDevice={isAppleDevice} 
                    isIPad={isIPad} 
                    isMultiTasking={isMultiTasking} 
                    multiTaskingMode={mode}
                    orientation={orientation}
                    darkMode={isDarkMode}
                  />
                </div>
                
                <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[hsl(var(--border))]'} border rounded-lg shadow-sm overflow-hidden ${isMultiTasking && mode === 'slide-over' ? 'p-3' : 'p-4'}`}>
                  <div className="flex items-center mb-2 justify-between">
                    <div className="flex items-center">
                      <Database className={`mr-2 ${isDarkMode ? 'text-blue-400' : 'text-[rgb(var(--scb-accent))]'}`} 
                        size={isMultiTasking && mode === 'slide-over' ? 16 : 20} />
                      <h2 className={`${isMultiTasking && mode === 'slide-over' ? 'text-sm' : 'text-base'} font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Business Data Cloud Integration
                      </h2>
                    </div>
                    
                    {/* Tutorial button for iOS devices */}
                    {isAppleDevice && !isMultiTasking && (
                      <EnhancedTouchButton
                        onClick={() => {
                          if (isAppleDevice) haptic({ intensity: 'light' });
                          alert('Viewing BDC Integration Tutorial');
                        }}
                        variant={isDarkMode ? "dark" : "secondary"}
                        size="xs"
                      >
                        Tutorial
                      </EnhancedTouchButton>
                    )}
                  </div>
                  
                  <p className={`${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                    {isMultiTasking && mode === 'slide-over' 
                      ? 'Integrates with SAP Business Data Cloud for real-time analytics and AI-enhanced predictions.'
                      : 'The Vietnam Tariff Dashboard integrates seamlessly with SAP Business Data Cloud to provide real-time analytics, historical trend analysis, and AI-enhanced predictions. This integration leverages the power of Monte Carlo simulations to model potential trade impact scenarios with confidence metrics.'
                    }
                  </p>
                  
                  <div className={`flex flex-wrap ${isMultiTasking && mode === 'slide-over' ? 'gap-2' : 'gap-3'}`}>
                    <EnhancedTouchButton
                      onClick={() => handleActionButtonClick('/financial-simulation')}
                      variant="primary"
                      className="flex items-center gap-1"
                      size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                    >
                      <span>Financial Simulations</span>
                      <ArrowRight className={`${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                    </EnhancedTouchButton>
                    
                    <EnhancedTouchButton
                      onClick={() => handleActionButtonClick('/vietnam-monte-carlo-enhanced')}
                      variant={isDarkMode ? "dark" : "secondary"}
                      className="flex items-center gap-1"
                      size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                    >
                      <Globe className={`${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                      <span>Monte Carlo Analysis</span>
                    </EnhancedTouchButton>
                  </div>
                </div>
                
                <div className={`${isMultiTasking && mode === 'slide-over' ? 'scale-[0.98] transform-origin-top-left' : ''}`}>
                  <BusinessDataCloudDashboard 
                    isAppleDevice={isAppleDevice} 
                    isIPad={isIPad} 
                    isMultiTasking={isMultiTasking} 
                    multiTaskingMode={mode}
                    orientation={orientation}
                    darkMode={isDarkMode}
                  />
                </div>
              </div>
              
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
                  theme={isDarkMode ? 'dark' : 'light'}
                  floating={!isMultiTasking || mode !== 'slide-over'}
                  compact={isMultiTasking}
                  multiTaskingMode={mode}
                />
              )}
              
              {/* iOS-specific bottom safe area spacer for notched devices */}
              {isAppleDevice && isSafeAreaInset && (
                <div className="h-6 sm:h-4 md:h-2"></div>
              )}
            </div>
          </div>
        ) : (
          /* Non-iOS version - standard layout */
          <div className={`${isMultiTasking && mode === 'slide-over' ? 'px-3 py-2' : 'px-6 py-4'} max-w-6xl mx-auto`}>
            <div className="mb-6">
              <div className="flex items-center">
                <Globe className="mr-3 text-[rgb(var(--scb-primary))]" size={isMultiTasking && mode === 'slide-over' ? 20 : 28} />
                <h1 className="text-2xl font-semibold text-[rgb(var(--scb-primary))]">Vietnam Tariff Analysis Dashboard</h1>
              </div>
              <p className="text-gray-600 mt-2 max-w-[800px]">
                Comprehensive analysis of Vietnam's tariff policies and trade impacts with AI-enhanced predictions.
                Leveraging Monte Carlo simulations to model potential scenarios and impacts across sectors.
              </p>
              
              <div className="border-b border-gray-200 my-4"></div>
            </div>

            {/* Main Dashboard Content - non-iOS version */}
            <div className="space-y-8">
              <div>
                <EnhancedVietnamTariffDashboard 
                  isAppleDevice={isAppleDevice} 
                  isIPad={isIPad} 
                  isMultiTasking={isMultiTasking} 
                  multiTaskingMode={mode}
                  orientation={orientation}
                />
              </div>
              
              <div className={`bg-white p-4 border border-[hsl(var(--border))] rounded-lg ${isMultiTasking && mode === 'slide-over' ? 'p-3' : 'p-4'}`}>
                <div className="flex items-center mb-2">
                  <Database className={`mr-2 text-[rgb(var(--scb-accent))]`} size={isMultiTasking && mode === 'slide-over' ? 16 : 20} />
                  <h2 className={`${isMultiTasking && mode === 'slide-over' ? 'text-base' : 'text-lg'} font-medium`}>
                    Business Data Cloud Integration
                  </h2>
                </div>
                <p className={`${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} text-gray-600 mb-4`}>
                  The Vietnam Tariff Dashboard integrates seamlessly with SAP Business Data Cloud to provide real-time
                  analytics, historical trend analysis, and AI-enhanced predictions. This integration leverages the
                  power of Monte Carlo simulations to model potential trade impact scenarios with confidence metrics.
                </p>
                
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => handleActionButtonClick('/financial-simulation')} 
                    className="fiori-btn fiori-btn-primary flex items-center gap-1"
                  >
                    <span>Financial Simulations</span>
                    <Link size={16} />
                  </button>
                  
                  <button 
                    onClick={() => handleActionButtonClick('/vietnam-monte-carlo-enhanced')}
                    className="fiori-btn fiori-btn-secondary flex items-center gap-1"
                  >
                    <Globe size={16} />
                    <span>Monte Carlo Analysis</span>
                  </button>
                </div>
              </div>
              
              <div className={isMultiTasking && mode === 'slide-over' ? 'scale-[0.95] transform-origin-top-left' : ''}>
                <BusinessDataCloudDashboard 
                  isAppleDevice={isAppleDevice} 
                  isIPad={isIPad} 
                  isMultiTasking={isMultiTasking} 
                  multiTaskingMode={mode}
                  orientation={orientation}
                />
              </div>
            </div>
          </div>
        )}
      </IconSystemProvider>
    </ScbBeautifulUI>
  );
};

export default VietnamTariffDashboardPage;