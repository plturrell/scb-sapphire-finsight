import React, { useState, useEffect, useRef } from 'react';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import MetricCard from '@/components/MetricCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { RefreshCw, Info, Filter, Download, Share2 } from 'lucide-react';
import EnhancedTouchButton from '@/components/EnhancedTouchButton';
import IOSOptimizedLayout from '@/components/layout/IOSOptimizedLayout';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import { useMultiTasking } from '@/hooks/useMultiTasking';
import useApplePhysics from '@/hooks/useApplePhysics';
import useSafeArea, { safeAreaCss } from '@/hooks/useSafeArea';
import { haptics } from '@/lib/haptics';
import { useSFSymbolsSupport } from '@/lib/sf-symbols';
import EnhancedIOSDataVisualization from '@/components/charts/EnhancedIOSDataVisualization';
import MultiTaskingChart from '@/components/charts/MultiTaskingChart';

// Sample investment data
const investmentAllocationData = [
  { name: 'Equities', value: 45, color: '#0072AA' },
  { name: 'Fixed Income', value: 30, color: '#21AA47' },
  { name: 'Alternatives', value: 15, color: '#D13732' },
  { name: 'Cash', value: 10, color: '#FFCC00' },
];

const investmentPerformanceData = [
  { month: 'Jan', returns: 2.4, benchmark: 2.1 },
  { month: 'Feb', returns: -1.2, benchmark: -0.8 },
  { month: 'Mar', returns: 3.5, benchmark: 3.0 },
  { month: 'Apr', returns: 1.8, benchmark: 1.5 },
  { month: 'May', returns: 2.2, benchmark: 2.3 },
  { month: 'Jun', returns: 0.5, benchmark: 0.7 },
  { month: 'Jul', returns: 3.1, benchmark: 2.9 },
  { month: 'Aug', returns: -0.3, benchmark: -0.2 },
];

const topHoldingsData = [
  { name: 'AAPL', value: 18500, change: 3.2, sector: 'Technology' },
  { name: 'MSFT', value: 15200, change: 1.8, sector: 'Technology' },
  { name: 'AMZN', value: 12700, change: -0.5, sector: 'Consumer' },
  { name: 'GOOGL', value: 11200, change: 2.1, sector: 'Technology' },
  { name: 'BRK.B', value: 10500, change: 0.9, sector: 'Financials' },
];

const marketInsights = [
  { id: 1, title: 'Global Market Volatility Increasing', date: 'Today', urgent: true },
  { id: 2, title: 'Central Bank Policy Shifts Expected', date: 'Yesterday' },
  { id: 3, title: 'ESG Investments Outperforming Market', date: '2 days ago' },
  { id: 4, title: 'Emerging Markets: New Opportunities', date: '3 days ago' },
];

export default function Investments() {
  const { preferences, isDarkMode } = useUIPreferences();
  
  // Device capability hooks
  const { isAppleDevice, deviceType } = useDeviceCapabilities();
  const { mode, isMultiTasking, sizeClass } = useMultiTasking();
  // Using standard motion physics without specific preset
  const applePhysics = useApplePhysics({ motion: 'standard' });
  const { safeArea, hasHomeIndicator, hasDynamicIsland, orientation } = useSafeArea();
  const { supported: sfSymbolsSupported } = useSFSymbolsSupport();
  
  // iOS-specific state for touch interactions
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [navbarHidden, setNavbarHidden] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<any>(null);
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<any>(null);
  const [touchSwipeDistance, setTouchSwipeDistance] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeTarget, setSwipeTarget] = useState<string | null>(null);
  
  // Refs
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Define device types
  const isIPad = deviceType === 'tablet' && isAppleDevice;
  const isIPhone = deviceType === 'mobile' && isAppleDevice;
  const isApplePlatform = isIPad || isIPhone;
  
  // Platform detection is handled by the useDeviceCapabilities hook
  
  // Effect to handle scroll events for iOS-style navbar hiding/showing
  useEffect(() => {
    if (!isApplePlatform) return;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Update navbar visibility based on scroll direction
      if (currentScrollY > lastScrollY + 10 && currentScrollY > 100) {
        // Scrolling down - hide navbar
        setNavbarHidden(true);
        if (isApplePlatform) {
          haptics.light(); // Subtle feedback when navbar hides
        }
      } else if (currentScrollY < lastScrollY - 10 || currentScrollY < 50) {
        // Scrolling up or near top - show navbar
        setNavbarHidden(false);
      }
      
      // Update the last scroll position
      setLastScrollY(currentScrollY);
      
      // Debounce updating scroll position
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
      
      scrollTimerRef.current = setTimeout(() => {
        setLastScrollY(currentScrollY);
      }, 100);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
    };
  }, [lastScrollY, isApplePlatform]);
  
  // Handling refresh with iOS-style feedback
  const handleRefresh = () => {
    setIsRefreshing(true);
    
    if (isApplePlatform) {
      haptics.medium(); // Medium haptic for refresh action
    }
    
    setTimeout(() => {
      setIsRefreshing(false);
      
      if (isApplePlatform) {
        haptics.success(); // Success feedback when refresh completes
      }
    }, 1500);
  };
  
  // Touch event handlers for iOS-specific interactions
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isApplePlatform) return;
    
    // Store the initial touch position
    setTouchStartY(e.touches[0].clientY);
    
    // Reset swipe state
    setIsSwiping(false);
    setTouchSwipeDistance(0);
    
    // Identify swipe target if applicable
    const target = e.currentTarget.getAttribute('data-swipe-id');
    if (target) {
      setSwipeTarget(target);
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isApplePlatform || touchStartY === null) return;
    
    const currentY = e.touches[0].clientY;
    const diffY = touchStartY - currentY;
    const diffX = e.touches[0].clientX - e.currentTarget.getBoundingClientRect().left;
    
    // For potential swipe actions in holdings and insights
    if (swipeTarget && Math.abs(diffY) < 20 && diffX > 20) {
      setIsSwiping(true);
      setTouchSwipeDistance(diffX);
      
      // Trigger haptic feedback at threshold points
      if (diffX > 50 && diffX < 52) haptics.light();
      if (diffX > 100 && diffX < 102) haptics.medium();
    }
    
    // Pull-to-refresh gesture (when at top of page)
    if (diffY < -50 && window.scrollY <= 0 && !isRefreshing) {
      handleRefresh();
    }
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isApplePlatform) return;
    
    // Handle swipe action completion
    if (isSwiping && touchSwipeDistance > 100 && swipeTarget) {
      // Complete the swipe action
      handleSwipeAction(swipeTarget);
      haptics.success(); // Success feedback
    } else if (isSwiping) {
      // Reset if swipe wasn't far enough
      setIsSwiping(false);
      setTouchSwipeDistance(0);
    }
    
    // Reset touch state
    setTouchStartY(null);
    setSwipeTarget(null);
  };
  
  // Handle swipe actions on investment items
  const handleSwipeAction = (itemId: string) => {
    // Identify item type (holding or insight)
    const itemType = itemId.split('-')[0];
    const id = itemId.split('-')[1];
    
    if (itemType === 'holding') {
      // Show details for the swiped holding
      const holding = topHoldingsData.find(item => item.name === id);
      if (holding) {
        setSelectedHolding(holding);
        setShowDetailModal(true);
      }
    } else if (itemType === 'insight') {
      // Show details for the swiped insight
      const insight = marketInsights.find(item => item.id === parseInt(id));
      if (insight) {
        setSelectedInsight(insight);
        setShowInsightModal(true);
      }
    }
    
    // Reset swipe state
    setIsSwiping(false);
    setTouchSwipeDistance(0);
    setSwipeTarget(null);
  };
  
  // Define iOS-specific navigation actions
  const navBarActions = [
    {
      icon: "arrow.clockwise",
      label: "Refresh",
      onPress: () => {
        handleRefresh();
      }
    },
    {
      icon: "line.3.horizontal.decrease",
      label: "Filter",
      onPress: () => {
        if (isApplePlatform) haptics.medium();
        console.log("Filter pressed");
      }
    }
  ];
  
  // Tab items for navigation
  const tabItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: 'gauge',
      href: '/dashboard',
    },
    {
      key: 'investments',
      label: 'Investments',
      icon: 'chart.pie.fill',
      href: '/investments',
    },
    {
      key: 'portfolio',
      label: 'Portfolio',
      icon: 'briefcase',
      href: '/portfolio',
    },
    {
      key: 'reports',
      label: 'Reports',
      icon: 'doc.text',
      href: '/reports',
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: 'gearshape',
      href: '/settings',
    },
  ];
  
  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Home', href: '/', icon: 'house' },
    { label: 'Investments', href: '/investments', icon: 'chart.pie.fill' },
  ];
  
  // iOS-style pull-to-refresh indicator
  const renderRefreshIndicator = () => {
    if (!isRefreshing || !isApplePlatform) return null;
    
    return (
      <div className="fixed top-0 left-0 right-0 flex justify-center pt-4 z-40 pointer-events-none">
        <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  };
  
  // iOS-style holding detail modal
  const renderHoldingDetailModal = () => {
    if (!showDetailModal || !selectedHolding) return null;
    
    return (
      <div 
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-in fade-in"
        onClick={() => {
          setShowDetailModal(false);
          if (isApplePlatform) haptics.light();
        }}
        style={{
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)'
        }}
      >
        <div 
          className={`w-full max-w-lg mx-auto rounded-t-xl overflow-hidden pb-8 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}
          style={{
            transform: 'translateY(0)',
            animation: 'slide-in-up 350ms cubic-bezier(0.25, 0.1, 0.25, 1.0)',
            boxShadow: '0 -2px 20px rgba(0,0,0,0.2)',
            paddingBottom: hasHomeIndicator ? `calc(2rem + ${safeAreaCss.bottom})` : '2rem'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle bar for dragging */}
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto my-3" />
          
          {/* Header */}
          <div className="px-5 pt-4 pb-6 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {selectedHolding.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {selectedHolding.sector}
            </p>
          </div>
          
          {/* Content */}
          <div className="px-5 py-4">
            {/* Metrics */}
            <div className="grid grid-cols-2 gap-5 mb-6">
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-blue-800/20' : 'bg-blue-50'}`}>
                <p className="text-xs text-gray-500 dark:text-gray-400">Current Value</p>
                <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                  ${selectedHolding.value.toLocaleString()}
                </p>
              </div>
              <div className={`p-4 rounded-lg ${
                selectedHolding.change >= 0 
                  ? isDarkMode ? 'bg-green-800/20' : 'bg-green-50'
                  : isDarkMode ? 'bg-red-800/20' : 'bg-red-50'
              }`}>
                <p className="text-xs text-gray-500 dark:text-gray-400">Daily Change</p>
                <p className={`text-2xl font-semibold ${
                  selectedHolding.change >= 0 
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {selectedHolding.change >= 0 ? '+' : ''}{selectedHolding.change}%
                </p>
              </div>
            </div>
            
            {/* Details */}
            <div className={`p-4 rounded-lg mb-5 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Market Cap</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">$2.54T</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">52 Week High</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">$198.23</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">52 Week Low</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">$124.17</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Dividend Yield</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">0.54%</span>
              </div>
            </div>
            
            {/* Actions */}
            <div className="space-y-3">
              <button 
                className={`w-full px-4 py-3 text-white rounded-lg flex items-center justify-center space-x-2 ${isDarkMode ? 'bg-blue-600' : 'bg-blue-600'}`}
                onClick={() => {
                  if (isApplePlatform) haptics.medium();
                  setShowDetailModal(false);
                }}
              >
                {sfSymbolsSupported && (
                  <span className="sf-symbol text-white">chart.xyaxis.line</span>
                )}
                <span>View Details</span>
              </button>
              <button 
                className={`w-full px-4 py-3 rounded-lg flex items-center justify-center space-x-2 ${
                  isDarkMode 
                    ? 'bg-gray-800 text-white border border-gray-700'
                    : 'bg-white text-gray-800 border border-gray-300'
                }`}
                onClick={() => {
                  if (isApplePlatform) haptics.light();
                  setShowDetailModal(false);
                }}
              >
                {sfSymbolsSupported && (
                  <span className="sf-symbol">xmark</span>
                )}
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // iOS-style insight detail modal
  const renderInsightDetailModal = () => {
    if (!showInsightModal || !selectedInsight) return null;
    
    return (
      <div 
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-in fade-in"
        onClick={() => {
          setShowInsightModal(false);
          if (isApplePlatform) haptics.light();
        }}
        style={{
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)'
        }}
      >
        <div 
          className={`w-full max-w-lg mx-auto rounded-t-xl overflow-hidden pb-8 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}
          style={{
            transform: 'translateY(0)',
            animation: 'slide-in-up 350ms cubic-bezier(0.25, 0.1, 0.25, 1.0)',
            boxShadow: '0 -2px 20px rgba(0,0,0,0.2)',
            paddingBottom: hasHomeIndicator ? `calc(2rem + ${safeAreaCss.bottom})` : '2rem'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle bar for dragging */}
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto my-3" />
          
          {/* Header */}
          <div className="px-5 pt-4 pb-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center mb-2">
              {selectedInsight.urgent && (
                <div className={`mr-2 ${isDarkMode ? 'bg-red-900/20' : 'bg-red-100'} p-1.5 rounded-full`}>
                  {sfSymbolsSupported ? (
                    <span className="sf-symbol text-red-500">exclamationmark.circle</span>
                  ) : (
                    <Info className="h-4 w-4 text-red-500" />
                  )}
                </div>
              )}
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {selectedInsight.title}
              </h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedInsight.date}
            </p>
          </div>
          
          {/* Content */}
          <div className="px-5 py-4">
            {/* Mock content for the insight detail */}
            <div className="prose dark:prose-invert max-w-none">
              <p>
                Recent market developments suggest increased volatility across global markets,
                with key indicators pointing to potential shifts in economic policy from major central banks.
              </p>
              <p>
                Investors should consider reallocating portions of their portfolio to less volatile 
                assets while maintaining exposure to high-growth sectors that have demonstrated resilience.
              </p>
              <h4>Key Takeaways:</h4>
              <ul>
                <li>Review exposure to emerging markets</li>
                <li>Consider defensive positions in established sectors</li>
                <li>Monitor central bank communications carefully</li>
                <li>Evaluate cash positions for potential opportunities</li>
              </ul>
            </div>
            
            {/* Actions */}
            <div className="mt-6 space-y-3">
              <button 
                className={`w-full px-4 py-3 text-white rounded-lg flex items-center justify-center space-x-2 ${isDarkMode ? 'bg-blue-600' : 'bg-blue-600'}`}
                onClick={() => {
                  if (isApplePlatform) haptics.medium();
                  setShowInsightModal(false);
                }}
              >
                {sfSymbolsSupported && (
                  <span className="sf-symbol text-white">doc.text</span>
                )}
                <span>View Full Report</span>
              </button>
              <button 
                className={`w-full px-4 py-3 rounded-lg flex items-center justify-center space-x-2 ${
                  isDarkMode 
                    ? 'bg-gray-800 text-white border border-gray-700'
                    : 'bg-white text-gray-800 border border-gray-300'
                }`}
                onClick={() => {
                  if (isApplePlatform) haptics.light();
                  setShowInsightModal(false);
                }}
              >
                {sfSymbolsSupported && (
                  <span className="sf-symbol">xmark</span>
                )}
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Use ScbBeautifulUI instead of IOSOptimizedLayout to avoid JSX structure issues
  return (
    <ScbBeautifulUI
      showSearchBar={true}
      pageTitle="Investments"
    >
          <div 
            ref={contentRef}
            className="space-y-6" 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Subtitle */}
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Comprehensive view of your investment assets and performance
            </p>
        
            {/* Key Metrics */}
            <div className={`grid grid-cols-1 ${
              isMultiTasking && mode === 'slide-over'
                ? 'gap-3'
                : isMultiTasking
                  ? 'md:grid-cols-2 gap-4'
                  : isIPad
                    ? 'md:grid-cols-2 lg:grid-cols-4 gap-4'
                    : 'md:grid-cols-2 gap-4'
            }`}>
              <MetricCard
                title="Total Portfolio Value"
                value={2345670}
                change={2.8}
                period="This Month"
                format="currency"
              />
              <MetricCard
                title="YTD Return"
                value={8.7}
                change={1.2}
                period="vs Benchmark 7.5%"
                format="percentage"
              />
              <MetricCard
                title="Dividend Yield"
                value={3.2}
                change={0.3}
                period="vs Last Year"
                format="percentage"
              />
              <MetricCard
                title="Risk Score"
                value={62}
                change={-3}
                period="Moderate"
                format="number"
              />
            </div>
        
        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Asset Allocation */}
          <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-sm overflow-hidden`}>
            <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
              <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Asset Allocation</h3>
              <EnhancedTouchButton
                variant="ghost"
                size="xs"
                className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
              >
                <Info className="h-4 w-4" />
              </EnhancedTouchButton>
            </div>
            <div className="p-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={investmentAllocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {investmentAllocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => `${value}%`}
                      contentStyle={{
                        borderRadius: 4,
                        backgroundColor: isDarkMode ? '#1f2937' : 'white',
                        borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                        color: isDarkMode ? 'white' : 'black'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {investmentAllocationData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {item.name}: {item.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Performance Chart */}
          <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-sm overflow-hidden`}>
            <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
              <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Performance vs Benchmark</h3>
              <div className="flex items-center gap-2">
                <EnhancedTouchButton
                  variant="ghost"
                  size="xs"
                  className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                >
                  <Download className="h-4 w-4" />
                </EnhancedTouchButton>
                <EnhancedTouchButton
                  variant="ghost"
                  size="xs"
                  className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                >
                  <Share2 className="h-4 w-4" />
                </EnhancedTouchButton>
              </div>
            </div>
            <div className="p-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={investmentPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280' }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `${value}%`}
                      tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280' }}
                    />
                    <Tooltip 
                      formatter={(value) => `${value}%`}
                      contentStyle={{
                        borderRadius: 4,
                        backgroundColor: isDarkMode ? '#1f2937' : 'white',
                        borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                        color: isDarkMode ? 'white' : 'black'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="returns" 
                      name="Portfolio" 
                      stroke="#0072AA" 
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="benchmark" 
                      name="Benchmark" 
                      stroke="#21AA47" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4 flex justify-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#0072AA]"></div>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Portfolio</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#21AA47]"></div>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Benchmark</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Top Holdings */}
        <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-sm overflow-hidden`}>
          <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
            <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Top Holdings</h3>
            {isApplePlatform && sfSymbolsSupported && (
              <div className="flex items-center gap-2">
                <button 
                  className="p-1"
                  onClick={() => {
                    if (isApplePlatform) haptics.light();
                  }}
                >
                  <span className={`sf-symbol text-xl ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>arrow.up.arrow.down</span>
                </button>
                <button 
                  className="p-1"
                  onClick={() => {
                    if (isApplePlatform) haptics.light();
                  }}
                >
                  <span className={`sf-symbol text-xl ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>ellipsis.circle</span>
                </button>
              </div>
            )}
          </div>
          
          {/* Mobile-friendly list view for iOS devices */}
          {isApplePlatform ? (
            <div className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {topHoldingsData.map((holding) => (
                <div 
                  key={holding.name}
                  className={`relative overflow-hidden transition-all duration-300 ${
                    isSwiping && swipeTarget === `holding-${holding.name}`
                      ? 'transform translate-x-20'
                      : ''
                  }`}
                  data-swipe-id={`holding-${holding.name}`}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <div 
                    className={`px-4 py-3 flex items-center justify-between ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                    onClick={() => {
                      setSelectedHolding(holding);
                      setShowDetailModal(true);
                      if (isApplePlatform) haptics.selection();
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {sfSymbolsSupported && (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          holding.sector === 'Technology' 
                            ? 'bg-blue-100 dark:bg-blue-900/30'
                            : holding.sector === 'Consumer'
                              ? 'bg-green-100 dark:bg-green-900/30' 
                              : 'bg-purple-100 dark:bg-purple-900/30'
                        }`}>
                          <span className={`sf-symbol ${
                            holding.sector === 'Technology' 
                              ? 'text-blue-600 dark:text-blue-400'
                              : holding.sector === 'Consumer'
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-purple-600 dark:text-purple-400'
                          }`}>
                            {holding.sector === 'Technology' 
                              ? 'laptopcomputer'
                              : holding.sector === 'Consumer'
                                ? 'cart' 
                                : 'building.columns.fill'}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{holding.name}</p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{holding.sector}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>${holding.value.toLocaleString()}</p>
                      <p className={`text-xs font-medium ${
                        holding.change >= 0 
                          ? 'text-green-500' 
                          : 'text-red-500'
                      }`}>
                        {holding.change >= 0 ? '+' : ''}{holding.change}%
                      </p>
                    </div>
                  </div>
                  
                  {/* Swipe action indicators - only visible during swipe */}
                  <div 
                    className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-blue-500 text-white overflow-hidden"
                    style={{
                      width: isSwiping && swipeTarget === `holding-${holding.name}` ? `${touchSwipeDistance * 0.7}px` : '0',
                      opacity: isSwiping && swipeTarget === `holding-${holding.name}` ? (touchSwipeDistance > 50 ? 1 : touchSwipeDistance / 50) : 0,
                      transition: 'opacity 150ms ease-out',
                      maxWidth: '100px'
                    }}
                  >
                    {sfSymbolsSupported ? (
                      <span className="sf-symbol text-white text-lg px-4">info.circle</span>
                    ) : (
                      <Info className="h-5 w-5 text-white mx-4" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`text-xs ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-500'}`}>
                  <tr>
                    <th className="px-4 py-2 text-left">Security</th>
                    <th className="px-4 py-2 text-left">Sector</th>
                    <th className="px-4 py-2 text-right">Value</th>
                    <th className="px-4 py-2 text-right">Daily Change</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {topHoldingsData.map((holding) => (
                    <tr key={holding.name} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                      <td className={`px-4 py-3 font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{holding.name}</td>
                      <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>{holding.sector}</td>
                      <td className={`px-4 py-3 text-right ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        ${holding.value.toLocaleString()}
                      </td>
                      <td className={`px-4 py-3 text-right text-sm font-medium ${
                        holding.change >= 0 
                          ? 'text-green-500' 
                          : 'text-red-500'
                      }`}>
                        {holding.change >= 0 ? '+' : ''}{holding.change}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Market Insights */}
        <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-sm overflow-hidden`}>
          <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Market Insights</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {marketInsights.map((insight) => (
              <div key={insight.id} className={`flex items-center justify-between p-4 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                <div className="flex items-start gap-3">
                  {insight.urgent && (
                    <div className={`${isDarkMode ? 'bg-red-900/20' : 'bg-red-100'} p-1.5 rounded-full`}>
                      <Info className="h-4 w-4 text-red-500" />
                    </div>
                  )}
                  <div>
                    <h4 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{insight.title}</h4>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{insight.date}</p>
                  </div>
                </div>
                <EnhancedTouchButton
                  variant="secondary"
                  size="xs"
                >
                  View Details
                </EnhancedTouchButton>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScbBeautifulUI>
  );
}