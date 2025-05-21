import React, { useState, useEffect } from 'react';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';
import DetailedAnalyticsTable from '@/components/DetailedAnalyticsTable.enhanced';
import EnhancedIOSDataVisualization from '@/components/charts/EnhancedIOSDataVisualization';
import MultiTaskingChart from '@/components/charts/MultiTaskingChart';
import EnhancedTouchButton from '@/components/EnhancedTouchButton';
import { useMultiTasking } from '@/hooks/useMultiTasking';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import IOSOptimizedLayout from '@/components/layout/IOSOptimizedLayout';
import { haptics } from '@/lib/haptics';
import { TransactionSector } from '@/types';
import { useMediaQuery } from 'react-responsive';
import { useSFSymbolsSupport } from '@/lib/sf-symbols';
import { ICONS } from '@/components/IconSystem';
import { ArrowRight, Download, Filter, RefreshCw, LayoutDashboard, FileText, Settings, AlertCircle } from '@/components/IconExports';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// iOS colors for better integration with Apple platforms
const iosColors = [
  '#007AFF', // blue
  '#34C759', // green
  '#FF9500', // orange
  '#FF3B30', // red
  '#5856D6', // purple
  '#FF2D55', // pink
  '#FFCC00', // yellow
  '#00C7BE'  // teal
];

// iOS-specific chart transitions for animations
const iosTransitions = {
  duration: 400,
  easing: 'cubic-bezier(0.25, 0.1, 0.25, 1.0)', // iOS animation curve
  delay: 0
};

const sectorData: TransactionSector[] = [
  { name: 'Aluminum', revenue: 500000, accounts: 120, income: 45000, assets: 2500000, deposits: 1800000, yield: 5.2, rowWa: 3.5, change: 2.5 },
  { name: 'Automotive', revenue: 750000, accounts: 85, income: 68000, assets: 3200000, deposits: 2100000, yield: 6.1, rowWa: 4.2, change: -1.2 },
  { name: 'Cement', revenue: 420000, accounts: 95, income: 38000, assets: 1900000, deposits: 1400000, yield: 4.8, rowWa: 3.1, change: 3.8 },
  { name: 'Chemical', revenue: 680000, accounts: 110, income: 61000, assets: 2800000, deposits: 2000000, yield: 5.6, rowWa: 3.8, change: 1.5 },
  { name: 'Diversified', revenue: 890000, accounts: 145, income: 80000, assets: 3600000, deposits: 2500000, yield: 6.3, rowWa: 4.5, change: 4.2 },
  { name: 'Gems', revenue: 320000, accounts: 75, income: 29000, assets: 1500000, deposits: 1100000, yield: 4.2, rowWa: 2.8, change: -0.5 },
  { name: 'Construction', revenue: 580000, accounts: 105, income: 52000, assets: 2400000, deposits: 1700000, yield: 5.1, rowWa: 3.4, change: 2.1 },
  { name: 'Real Estate', revenue: 720000, accounts: 90, income: 65000, assets: 3100000, deposits: 2200000, yield: 5.9, rowWa: 4.0, change: 3.6 },
  { name: 'Telecom', revenue: 820000, accounts: 125, income: 74000, assets: 3400000, deposits: 2400000, yield: 6.2, rowWa: 4.3, change: 2.8 },
  { name: 'Others', revenue: 550000, accounts: 130, income: 50000, assets: 2300000, deposits: 1600000, yield: 5.0, rowWa: 3.3, change: 1.8 },
];

const trendData = [
  { month: 'Jan', revenue: 420000, accounts: 85 },
  { month: 'Feb', revenue: 450000, accounts: 88 },
  { month: 'Mar', revenue: 480000, accounts: 92 },
  { month: 'Apr', revenue: 510000, accounts: 95 },
  { month: 'May', revenue: 540000, accounts: 98 },
  { month: 'Jun', revenue: 570000, accounts: 102 },
];

const pieData = [
  { name: 'Diversified', value: 25, color: iosColors[0] },
  { name: 'Telecom', value: 20, color: iosColors[1] },
  { name: 'Automotive', value: 18, color: iosColors[2] },
  { name: 'Real Estate', value: 15, color: iosColors[3] },
  { name: 'Others', value: 22, color: iosColors[4] },
];

export default function Analytics() {
  const [selectedSector, setSelectedSector] = useState<any>(null);
  const [activeFilterIndex, setActiveFilterIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [activeAnalyticsCategory, setActiveAnalyticsCategory] = useState('overview');
  const [isPlatformDetected, setPlatformDetected] = useState(false);
  const [showDataDetail, setShowDataDetail] = useState(false);
  const [selectedDataPoint, setSelectedDataPoint] = useState<any>(null);
  const [chartTransition, setChartTransition] = useState(false);
  const [navbarHidden, setNavbarHidden] = useState(false);
  const [lastScrollPosition, setLastScrollPosition] = useState(0);
  
  // Touch handling
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  const isSmallScreen = useMediaQuery({ maxWidth: 768 });
  const { mode, isMultiTasking, windowWidth, windowHeight } = useMultiTasking();
  const { isAppleDevice, deviceType, prefersReducedMotion } = useDeviceCapabilities();
  const { isDarkMode } = useUIPreferences();
  const { supported: sfSymbolsSupported } = useSFSymbolsSupport();
  const { safeArea, hasNotch, hasHomeIndicator } = useSafeArea();
  
  // Determine if it's an iOS device
  const isIPad = deviceType === 'tablet' && isAppleDevice;
  const isiOS = deviceType === 'mobile' && isAppleDevice;
  const isApplePlatform = isiOS || isIPad;
  
  // Effect to detect platform and setup iOS-specific handlers
  useEffect(() => {
    setPlatformDetected(true);
    
    // Add iOS-specific scroll handling for hiding/showing navbar
    if (isApplePlatform) {
      const handleScroll = () => {
        if (typeof window !== 'undefined') {
          const currentScrollPos = window.scrollY;
          
          // Show navbar when scrolling up, hide when scrolling down (after scrolling past threshold)
          if (currentScrollPos > 100) {
            if (currentScrollPos < lastScrollPosition) {
              setNavbarHidden(false);
            } else if (currentScrollPos > lastScrollPosition + 10) {
              setNavbarHidden(true);
            }
          } else {
            setNavbarHidden(false);
          }
          
          setLastScrollPosition(currentScrollPos);
        }
      };
      
      window.addEventListener('scroll', handleScroll, { passive: true });
      
      // Cleanup event listener
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [isApplePlatform, lastScrollPosition]);
  
  // iOS touch handling for gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isApplePlatform) return;
    setTouchStartY(e.touches[0].clientY);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isApplePlatform || touchStartY === null) return;
    
    const currentY = e.touches[0].clientY;
    const diff = touchStartY - currentY;
    
    // Pull-to-refresh gesture (when at top of page)
    if (diff < -50 && window.scrollY <= 0 && !refreshing) {
      handleRefresh();
    }
    
    // Hide/show navbar based on scroll direction
    if (Math.abs(diff) > 20) {
      setNavbarHidden(diff > 0);
    }
  };
  
  const handleTouchEnd = () => {
    setTouchStartY(null);
  };
  
  // Analytics categories with SF Symbols icons
  const analyticsCategories = [
    { id: 'overview', label: 'Overview', icon: 'chart.bar.doc.horizontal', badge: null },
    { id: 'revenue', label: 'Revenue', icon: 'dollarsign.circle.fill', badge: '+5.2%' },
    { id: 'accounts', label: 'Accounts', icon: 'person.2.fill', badge: '895' },
    { id: 'performance', label: 'Performance', icon: 'chart.line.uptrend.xyaxis.fill', badge: null },
    { id: 'sectors', label: 'Sectors', icon: 'rectangle.3.group.fill', badge: '10' },
    { id: 'risk', label: 'Risk', icon: 'exclamationmark.triangle.fill', badge: '3' },
    { id: 'custom', label: 'Custom', icon: 'slider.horizontal.3', badge: null }
  ];
  
  const timeFilters = ['Last 30 Days', 'Last Quarter', 'Last 6 Months', 'Year to Date', 'Last 12 Months'];

  // Handle chart sector selection with enhanced iOS interactions
  const handleSectorSelect = (sector: any) => {
    // Provide appropriate haptic feedback on Apple devices
    if (isApplePlatform) {
      // Use impact haptic for data selection to provide more distinctive feedback
      haptics.impact('medium');
    }
    
    setSelectedSector(sector);
    
    // Show detailed data sheet for iOS devices
    if (isApplePlatform && sector) {
      setSelectedDataPoint(sector);
      
      // Animate the transition with a slight delay
      setTimeout(() => {
        setShowDataDetail(true);
      }, 200);
    }
  };
  
  // Close data detail sheet (iOS)
  const closeDataDetail = () => {
    if (isApplePlatform) {
      haptics.selection();
    }
    setShowDataDetail(false);
  };
  
  // Handle filter change with iOS-optimized feedback
  const handleFilterChange = (index: number) => {
    // Don't do anything if already on this filter
    if (index === activeFilterIndex) return;
    
    // Provide haptic feedback on Apple devices
    if (isApplePlatform) {
      haptics.selection();
      
      // Animate transitions between filter changes
      setChartTransition(true);
      setTimeout(() => {
        setActiveFilterIndex(index);
        setTimeout(() => {
          setChartTransition(false);
        }, 300);
      }, 50);
    } else {
      // Immediate change for non-Apple devices
      setActiveFilterIndex(index);
    }
  };
  
  // Handle analytics category selection with enhanced feedback
  const handleCategorySelect = (categoryId: string) => {
    // Don't do anything if already on this category
    if (categoryId === activeAnalyticsCategory) return;
    
    // Provide haptic feedback on Apple devices
    if (isApplePlatform) {
      // Use navigation haptic since we're changing views
      haptics.navigation();
    }
    
    setActiveAnalyticsCategory(categoryId);
    
    // Reset data detail if showing
    if (showDataDetail) {
      setShowDataDetail(false);
    }
  };
  
  // SF Symbols Analytics Categories Navigation component
  const SFSymbolsAnalyticsNavigation = () => {
    if (!isAppleDevice || !isPlatformDetected || !sfSymbolsSupported) {
      return null;
    }
    
    return (
      <div className={`rounded-lg overflow-x-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-[rgb(var(--scb-border))]'} p-1 mb-4`}>
        <div className="flex items-center overflow-x-auto hide-scrollbar pb-1">
          {analyticsCategories.map((category) => (
            <button 
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              className={`
                flex flex-col items-center justify-center p-2 min-w-[72px] rounded-lg transition-colors
                ${activeAnalyticsCategory === category.id
                  ? isDarkMode 
                    ? 'bg-blue-900/30 text-blue-400' 
                    : 'bg-blue-50 text-blue-600'
                  : isDarkMode 
                    ? 'text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              <div className="relative">
                <span className="sf-symbol text-xl" role="img">{category.icon}</span>
                
                {/* Badge */}
                {category.badge && (
                  <span className={`
                    absolute -top-1 -right-1 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] 
                    flex items-center justify-center px-1
                    ${category.badge.startsWith('+') 
                      ? isDarkMode ? 'bg-green-600' : 'bg-green-500' 
                      : isDarkMode ? 'bg-blue-600' : 'bg-red-500'
                    }
                  `}>
                    {category.badge.length > 4 ? category.badge.substring(0, 3) + '...' : category.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium mt-1">{category.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };
  
  // Handle data refresh
  const handleRefresh = () => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptics.medium();
    }
    
    setRefreshing(true);
    
    // Simulate a data refresh with a timeout
    setTimeout(() => {
      setRefreshing(false);
      
      // Success haptic feedback when refresh completes
      if (isAppleDevice) {
        haptics.success();
      }
    }, 1500);
  };
  
  // Handle report download
  const handleDownloadReport = () => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptics.medium();
    }
    
    // In a real app, this would generate and download a report
    alert('Downloading analytics report...');
  };
  
  // Navigation bar actions
  const navBarActions = [
    {
      icon: 'arrow.down.doc',
      label: 'Download Report',
      onPress: handleDownloadReport
    },
    {
      icon: 'arrow.clockwise',
      label: 'Refresh',
      onPress: handleRefresh
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
      key: 'analytics',
      label: 'Analytics',
      icon: 'chart.bar.xaxis',
      href: '/analytics',
    },
    {
      key: 'portfolio',
      label: 'Portfolio',
      icon: 'folder',
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
    { label: 'Analytics', href: '/analytics', icon: 'chart.bar.xaxis' },
  ];

  // Render line chart with iOS optimizations if on Apple device
  const renderLineChart = (dimensions: any, interactionState: any, helpers: any) => {
    const { width, height, margin, innerWidth, innerHeight } = dimensions;
    const { formatCurrency } = helpers || {};
    
    return (
      <ResponsiveContainer width={width} height={height}>
        <LineChart data={trendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: interactionState?.isCompact ? 10 : 12 }}
            stroke="#8E8E93"
          />
          <YAxis 
            yAxisId="left" 
            orientation="left" 
            stroke={iosColors[0]}
            tickFormatter={(value) => formatCurrency ? formatCurrency(value, 'USD').split('.')[0] : `$${value/1000}k`}
            fontSize={interactionState?.isCompact ? 10 : 12}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            stroke={iosColors[1]}
            fontSize={interactionState?.isCompact ? 10 : 12}
          />
          <Tooltip 
            contentStyle={{
              borderRadius: 8,
              backgroundColor: 'rgba(255,255,255,0.95)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid rgba(0,0,0,0.05)'
            }}
            formatter={(value: any, name: string) => {
              if (name === 'Revenue') {
                return formatCurrency ? formatCurrency(value, 'USD') : `$${value.toLocaleString()}`;
              }
              return value;
            }}
          />
          <Line 
            yAxisId="left" 
            type="monotone" 
            dataKey="revenue" 
            stroke={iosColors[0]}
            strokeWidth={3}
            animationDuration={1000}
            dot={{ r: 4, fill: 'white', stroke: iosColors[0], strokeWidth: 2 }}
            activeDot={{ r: 6, fill: iosColors[0], stroke: 'white', strokeWidth: 2 }}
            name="Revenue" 
          />
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="accounts" 
            stroke={iosColors[1]}
            strokeWidth={3}
            animationDuration={1000}
            dot={{ r: 4, fill: 'white', stroke: iosColors[1], strokeWidth: 2 }}
            activeDot={{ r: 6, fill: iosColors[1], stroke: 'white', strokeWidth: 2 }}
            name="Accounts" 
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // Render pie chart with iOS optimizations if on Apple device
  const renderPieChart = (dimensions: any, interactionState: any, helpers: any) => {
    const { width, height } = dimensions;
    const { formatPercentage } = helpers || {};
    const { activeIndex } = interactionState || {};
    
    return (
      <ResponsiveContainer width={width} height={height}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={activeIndex !== null ? 40 : 0}
            outerRadius={80}
            fill={iosColors[0]}
            dataKey="value"
            animationDuration={800}
            animationBegin={0}
            paddingAngle={2}
            label={({ name, value }) => `${name}: ${value}%`}
            labelLine={false}
          >
            {pieData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color} 
                stroke="white" 
                strokeWidth={activeIndex === index ? 2 : 0}
              />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              borderRadius: 8,
              backgroundColor: 'rgba(255,255,255,0.95)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid rgba(0,0,0,0.05)'
            }}
            formatter={(value: any) => formatPercentage ? formatPercentage(value, 0) : `${value}%`}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Render iPad-optimized multitasking chart
  const renderMultiTaskingChart = (dimensions: any, interactionState: any) => {
    const { width, height } = dimensions;
    const { isCompact } = interactionState;
    
    return (
      <ResponsiveContainer width={width} height={height}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            outerRadius={isCompact ? 60 : 80}
            fill={iosColors[0]}
            dataKey="value"
            label={({ name, value }) => isCompact ? `${value}%` : `${name}: ${value}%`}
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              borderRadius: 8,
              backgroundColor: 'rgba(255,255,255,0.95)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid rgba(0,0,0,0.05)'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Render legend for pie chart
  const renderPieLegend = (isActive: boolean) => {
    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
        {pieData.map((item, index) => (
          <div key={item.name} className="flex items-center gap-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: item.color }}
            ></div>
            <span>{item.name}: {item.value}%</span>
          </div>
        ))}
      </div>
    );
  };

  // Render legend for line chart
  const renderLineLegend = (isActive: boolean) => {
    return (
      <div className="flex justify-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: iosColors[0] }}></div>
          <span>Revenue</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: iosColors[1] }}></div>
          <span>Accounts</span>
        </div>
      </div>
    );
  };

  // Conditional rendering based on detected platform
  const renderCharts = () => {
    // Use iPad-optimized multitasking charts for iPad
    if (isIPad && isPlatformDetected && isMultiTasking) {
      // Adjust layout based on multitasking mode
      const gridCols = mode === 'slide-over' ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2';
      const chartHeight = mode === 'slide-over' ? 240 : 320;
      
      return (
        <div className={`grid ${gridCols} gap-4`}>
          <MultiTaskingChart
            data={trendData}
            chartType="line"
            title="Revenue & Account Growth"
            height={chartHeight}
            colors={iosColors}
            enableInteraction={true}
            enableDragAndDrop={true}
            multiTaskingMode={mode}
            isMultiTasking={isMultiTasking}
            renderChart={renderMultiTaskingChart}
            renderLegend={(isCompact) => renderLineLegend(isCompact)}
          />
          
          <MultiTaskingChart
            data={pieData}
            chartType="pie"
            title="Revenue by Sector"
            height={chartHeight}
            colors={iosColors}
            enableInteraction={true}
            enableDragAndDrop={true}
            multiTaskingMode={mode}
            isMultiTasking={isMultiTasking}
            renderChart={renderMultiTaskingChart}
            renderLegend={(isCompact) => renderPieLegend(isCompact)}
          />
        </div>
      );
    }
    
    // Use iOS-optimized visualizations on Apple devices
    if (isAppleDevice && isPlatformDetected) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EnhancedIOSDataVisualization
            data={trendData}
            type="line"
            title="Revenue & Account Growth"
            subtitle={`${timeFilters[activeFilterIndex]} trends`}
            height={320}
            colors={iosColors}
            enableInteraction={true}
            enableHaptics={true}
            renderChart={renderLineChart}
            renderLegend={renderLineLegend}
            onDataPointSelect={handleSectorSelect}
          />
          
          <EnhancedIOSDataVisualization
            data={pieData}
            type="pie"
            title="Revenue by Sector"
            subtitle="Percentage distribution"
            height={320}
            colors={iosColors}
            enableInteraction={true}
            enableHaptics={true}
            renderChart={renderPieChart}
            renderLegend={renderPieLegend}
            onDataPointSelect={handleSectorSelect}
          />
        </div>
      );
    }
    
    // Fallback to standard charts
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue & Account Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" orientation="left" stroke="#4A5FDB" />
              <YAxis yAxisId="right" orientation="right" stroke="#1ED760" />
              <Tooltip />
              <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#4A5FDB" name="Revenue" />
              <Line yAxisId="right" type="monotone" dataKey="accounts" stroke="#1ED760" name="Accounts" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue by Sector</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <>
      {isAppleDevice ? (
        <IOSOptimizedLayout
          title="Analytics"
          subtitle="Transaction Banking Performance"
          showBreadcrumb={true}
          breadcrumbItems={breadcrumbItems}
          showTabBar={true}
          tabItems={tabItems}
          navBarRightActions={navBarActions}
          showBackButton={true}
          largeTitle={true}
          theme={isDarkMode ? 'dark' : 'light'}
        >
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
                  Transaction Banking Performance Overview
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <EnhancedTouchButton
                  variant="secondary"
                  label="Refresh"
                  iconLeft={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
                  onClick={handleRefresh}
                  disabled={refreshing}
                  compact={isMultiTasking && mode === 'slide-over'}
                />
                <EnhancedTouchButton
                  variant="secondary"
                  label="Download Report"
                  iconLeft={<Download className="w-4 h-4" />}
                  onClick={handleDownloadReport}
                  compact={isMultiTasking && mode === 'slide-over'}
                />
              </div>
            </div>
            
            {/* SF Symbols Analytics Categories Navigation */}
            {isAppleDevice && isPlatformDetected && sfSymbolsSupported && (
              <SFSymbolsAnalyticsNavigation />
            )}
            
            {/* Time Period Filter */}
            <div className="overflow-x-auto">
              <div className={`inline-flex ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg p-1 ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'}`}>
                {timeFilters.map((filter, index) => (
                  <button
                    key={filter}
                    className={`px-3 py-1.5 rounded-md transition-colors ${
                      activeFilterIndex === index 
                        ? isDarkMode 
                          ? 'bg-gray-700 shadow-sm text-blue-400' 
                          : 'bg-white shadow-sm text-blue-600'
                        : isDarkMode
                          ? 'text-gray-300 hover:text-white'
                          : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => handleFilterChange(index)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Responsive table - use enhanced on iPad for multitasking */}
            <DetailedAnalyticsTable 
              data={sectorData} 
              compact={isMultiTasking && mode === 'slide-over'}
            />

            {/* Charts - dynamically rendered based on platform */}
            {renderCharts()}

            {/* Key Insights section */}
            <div className={`
              ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'} 
              rounded-lg shadow ${isMultiTasking && mode === 'slide-over' ? 'p-4' : 'p-6'}
            `}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`
                  text-lg font-semibold
                  ${isDarkMode ? 'text-blue-400' : 'text-[rgb(var(--scb-honolulu-blue))]'}
                `}>
                  Key Insights
                </h3>
                
                <EnhancedTouchButton
                  variant="link"
                  label="View All Insights"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                  onClick={() => {
                    haptics.selection();
                    alert('This would navigate to a detailed insights view');
                  }}
                  compact={true}
                />
              </div>
              
              <div className={`grid grid-cols-1 ${isMultiTasking && mode === 'slide-over' ? 'md:grid-cols-1' : 'md:grid-cols-3'} gap-4`}>
                <div 
                  className={`
                    p-4 ${isDarkMode ? 'bg-blue-900/20 text-blue-100' : 'bg-blue-50'} rounded-lg transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer
                  `}
                  onClick={() => {
                    haptics.selection();
                    alert('Viewing details for top performer: Diversified sector');
                  }}
                >
                  <h4 className={`font-semibold ${isDarkMode ? 'text-blue-100' : 'text-blue-900'}`}>Top Performer</h4>
                  <p className={`text-sm ${isDarkMode ? 'text-blue-200' : 'text-blue-700'} mt-1`}>
                    Diversified sector showing 4.2% growth
                  </p>
                </div>
                
                <div 
                  className={`
                    p-4 ${isDarkMode ? 'bg-green-900/20 text-green-100' : 'bg-green-50'} rounded-lg transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer
                  `}
                  onClick={() => {
                    haptics.selection();
                    alert('Viewing details for strongest yield: Diversified sector');
                  }}
                >
                  <h4 className={`font-semibold ${isDarkMode ? 'text-green-100' : 'text-green-900'}`}>Strongest Yield</h4>
                  <p className={`text-sm ${isDarkMode ? 'text-green-200' : 'text-green-700'} mt-1`}>
                    Diversified sector at 6.3% yield
                  </p>
                </div>
                
                <div 
                  className={`
                    p-4 ${isDarkMode ? 'bg-yellow-900/20 text-yellow-100' : 'bg-yellow-50'} rounded-lg transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer
                  `}
                  onClick={() => {
                    haptics.selection();
                    alert('Viewing details for watch area: Automotive sector');
                  }}
                >
                  <h4 className={`font-semibold ${isDarkMode ? 'text-yellow-100' : 'text-yellow-900'}`}>Watch Area</h4>
                  <p className={`text-sm ${isDarkMode ? 'text-yellow-200' : 'text-yellow-700'} mt-1`}>
                    Automotive showing -1.2% decline
                  </p>
                </div>
              </div>
            </div>
          </div>
        </IOSOptimizedLayout>
      ) : (
        <ScbBeautifulUI 
          showNewsBar={!isSmallScreen && !isMultiTasking} 
          pageTitle="Analytics" 
          showTabs={false}
        >
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <p className="text-gray-600 mt-1">Transaction Banking Performance Overview</p>
              </div>
              
              {/* Action Buttons for non-Apple devices */}
              <div className="flex items-center gap-2">
                <button 
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-md shadow-sm text-sm flex items-center gap-1"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button 
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-md shadow-sm text-sm flex items-center gap-1"
                  onClick={handleDownloadReport}
                >
                  <Download className="w-4 h-4" />
                  Download Report
                </button>
              </div>
            </div>
            
            {/* Time Period Filter for non-Apple devices */}
            <div className="overflow-x-auto">
              <div className="inline-flex bg-gray-100 rounded-lg p-1 text-sm">
                {timeFilters.map((filter, index) => (
                  <button
                    key={filter}
                    className={`px-3 py-1.5 rounded-md transition-colors ${
                      activeFilterIndex === index 
                        ? 'bg-white shadow-sm font-medium' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => handleFilterChange(index)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Non-Apple device content */}
            <DetailedAnalyticsTable 
              data={sectorData} 
              compact={false}
            />

            {/* Charts for non-Apple devices */}
            {renderCharts()}

            {/* Key Insights section for non-Apple devices */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Key Insights
                </h3>
                
                <button 
                  className="text-sm text-blue-600 flex items-center gap-1"
                  onClick={() => alert('This would navigate to a detailed insights view')}
                >
                  View All Insights
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900">Top Performer</h4>
                  <p className="text-sm text-blue-700 mt-1">Diversified sector showing 4.2% growth</p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900">Strongest Yield</h4>
                  <p className="text-sm text-green-700 mt-1">Diversified sector at 6.3% yield</p>
                </div>
                
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-semibold text-yellow-900">Watch Area</h4>
                  <p className="text-sm text-yellow-700 mt-1">Automotive showing -1.2% decline</p>
                </div>
              </div>
            </div>
          </div>
        </ScbBeautifulUI>
      )}
    </>
  );
}