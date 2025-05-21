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
  const { mode, isMultiTasking } = useMultiTasking();
  const { deviceCapabilities } = useDeviceCapabilities();
  const { safeArea } = useSafeArea();
  const sfSymbolsSupported = useSFSymbolsSupport();
  
  // Detect if device is an Apple device
  const [isAppleDevice, setIsAppleDevice] = useState(false);
  const [isPlatformDetected, setIsPlatformDetected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  useEffect(() => {
    // Detect iOS/iPadOS/macOS
    const isApple = /iPhone|iPad|iPod|Mac/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsAppleDevice(isApple);
    setIsPlatformDetected(true);
  }, []);
  
  // iOS-specific state for touch interactions
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
  const [isPlatformDetected, setPlatformDetected] = useState(false);
  
  // Refs
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Device capability hooks
  const { isAppleDevice, deviceType } = useDeviceCapabilities();
  const { mode, isMultiTasking, sizeClass } = useMultiTasking();
  const { springPreset } = useApplePhysics({ motion: 'standard' });
  const { safeArea, hasHomeIndicator, hasDynamicIsland, orientation } = useSafeArea();
  const { supported: sfSymbolsSupported } = useSFSymbolsSupport();
  
  // Define device types
  const isIPad = deviceType === 'tablet' && isAppleDevice;
  const isIPhone = deviceType === 'mobile' && isAppleDevice;
  const isApplePlatform = isIPad || isIPhone;
  
  // Effect to detect platform
  useEffect(() => {
    setPlatformDetected(true);
  }, []);
  
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
                onClick={isApplePlatform ? () => { haptics.light() } : undefined}
              />
              <MetricCard
                title="YTD Return"
                value={8.7}
                change={1.2}
                period="vs Benchmark 7.5%"
                format="percentage"
                onClick={isApplePlatform ? () => { haptics.light() } : undefined}
              />
              <MetricCard
                title="Dividend Yield"
                value={3.2}
                change={0.3}
                period="vs Last Year"
                format="percentage"
                onClick={isApplePlatform ? () => { haptics.light() } : undefined}
              />
              <MetricCard
                title="Risk Score"
                value={62}
                change={-3}
                period="Moderate"
                format="number"
                onClick={isApplePlatform ? () => { haptics.light() } : undefined}
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
          <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Top Holdings</h3>
          </div>
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