import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import MetricCard from '@/components/MetricCard';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';
import EnhancedIOSDataVisualization from '@/components/charts/EnhancedIOSDataVisualization';
import MultiTaskingChart from '@/components/charts/MultiTaskingChart';
import EnhancedTouchButton from '@/components/EnhancedTouchButton';
import { useMediaQuery } from 'react-responsive';
import NetworkAwareImage from '@/components/NetworkAwareImage';
import useMultiTasking from '@/hooks/useMultiTasking';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { useMicroInteractions } from '@/hooks/useMicroInteractions';
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
import { RefreshCw, ArrowDownCircle, ChevronRight, Info, Download, Share2 } from 'lucide-react';

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

const monthlyData = [
  { month: 'Jan', revenue: 45000, target: 42000 },
  { month: 'Feb', revenue: 52000, target: 48000 },
  { month: 'Mar', revenue: 48000, target: 50000 },
  { month: 'Apr', revenue: 55000, target: 53000 },
  { month: 'May', revenue: 58000, target: 55000 },
  { month: 'Jun', revenue: 62000, target: 60000 },
];

const sectorData = [
  { name: 'Banking', value: 45, color: iosColors[0] },
  { name: 'Insurance', value: 30, color: iosColors[1] },
  { name: 'Investment', value: 25, color: iosColors[2] },
];

const newsItems = [
  { id: '1', title: 'New tariff announcement impacts Asian markets', source: 'CNBC', date: 'May 04, 11:53', important: true },
  { id: '2', title: 'New allegations for APAC region', source: 'Bloomberg Green', date: 'May 04, 11:53' },
  { id: '3', title: 'New regulations for APAC region', source: 'BNC Green', date: 'May 03, 12:25' },
  { id: '4', title: 'Innovative ways companies turn waste into resources', source: 'CNBC', date: 'May 03, 10:32' },
];

export default function Dashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const [isPlatformDetected, setPlatformDetected] = useState(false);
  const [isAppleDevice, setIsAppleDevice] = useState(false);
  const [isIPad, setIsIPad] = useState(false);
  const [selectedDataPoint, setSelectedDataPoint] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSafeAreaInset, setIsSafeAreaInset] = useState(false);
  
  // Use multi-tasking hook for iPad modes
  const { mode, isMultiTasking, orientation, sizeClass } = useMultiTasking();
  const { isDarkMode, preferences } = useUIPreferences();
  const { haptic, RippleContainer } = useMicroInteractions();
  
  const isSmallScreen = useMediaQuery({ maxWidth: 768 });
  
  // Detect platform when component mounts
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
    
    // Check for iOS safe area insets (notch/home indicator) for better layout
    if (isIOS) {
      // Check for environment with safe area insets (notches, etc)
      const hasSafeArea = window.innerHeight > window.screen.height || 
                        (window.screen.height - window.innerHeight > 50);
      setIsSafeAreaInset(hasSafeArea);
    }
  }, []);
  
  // Handle refresh data with haptic feedback
  const handleRefresh = () => {
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
  
  // Handle data point selection with haptic feedback
  const handleDataPointSelect = (dataPoint: any) => {
    if (isAppleDevice) {
      haptic({ intensity: 'light' });
    }
    setSelectedDataPoint(dataPoint);
  };
  
  // Handle download report with haptic feedback
  const handleDownload = () => {
    if (isAppleDevice) {
      haptic({ intensity: 'medium' });
    }
    alert('Downloading report...');
  };
  
  // Handle share dashboard with haptic feedback
  const handleShare = () => {
    if (isAppleDevice) {
      haptic({ intensity: 'medium' });
    }
    alert('Sharing dashboard...');
  };
  
  // Render line chart with iOS optimizations
  const renderLineChart = (dimensions: any, interactionState: any, helpers: any) => {
    const { width, height } = dimensions;
    const { formatCurrency } = helpers || {};
    
    return (
      <ResponsiveContainer width={width} height={height}>
        <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--scb-border), 0.6)" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: interactionState?.isCompact ? 10 : 12, fill: 'rgb(var(--scb-dark-gray))' }}
          />
          <YAxis 
            tick={{ fontSize: interactionState?.isCompact ? 10 : 12, fill: 'rgb(var(--scb-dark-gray))' }}
            tickFormatter={(value) => formatCurrency ? formatCurrency(value, 'USD').split('.')[0] : `$${value/1000}k`}
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
              if (name === 'Target') {
                return formatCurrency ? formatCurrency(value, 'USD') : `$${value.toLocaleString()}`;
              }
              return value;
            }}
          />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            name="Revenue"
            stroke={iosColors[0]} 
            strokeWidth={3}
            activeDot={{ r: 6, fill: iosColors[0], stroke: 'white', strokeWidth: 2 }}
            dot={{ r: 4, fill: 'white', stroke: iosColors[0], strokeWidth: 2 }}
            animationDuration={1000}
          />
          <Line 
            type="monotone" 
            dataKey="target" 
            name="Target"
            stroke={iosColors[1]} 
            strokeDasharray="5 5"
            strokeWidth={2}
            dot={{ r: 4, fill: 'white', stroke: iosColors[1], strokeWidth: 2 }}
            animationDuration={1000}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };
  
  // Render pie chart with iOS optimizations
  const renderPieChart = (dimensions: any, interactionState: any, helpers: any) => {
    const { width, height } = dimensions;
    const { formatPercentage } = helpers || {};
    const { activeIndex } = interactionState || {};
    
    return (
      <ResponsiveContainer width={width} height={height}>
        <PieChart>
          <Pie
            data={sectorData}
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
            {sectorData.map((entry, index) => (
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
            data={sectorData}
            cx="50%"
            cy="50%"
            outerRadius={isCompact ? 60 : 80}
            fill={iosColors[0]}
            dataKey="value"
            label={({ name, value }) => isCompact ? `${value}%` : `${name}: ${value}%`}
          >
            {sectorData.map((entry, index) => (
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
  
  // Render legend for charts
  const renderPieLegend = (isActive: boolean) => {
    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
        {sectorData.map((item, index) => (
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
          <span>Target</span>
        </div>
      </div>
    );
  };
  
  // Conditional rendering based on detected platform
  const renderCharts = () => {
    // Use iOS-optimized visualizations on Apple devices
    if (isAppleDevice && isPlatformDetected) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EnhancedIOSDataVisualization
            data={monthlyData}
            type="line"
            title="Monthly Revenue Trend"
            subtitle="Actual vs Target"
            height={320}
            colors={iosColors}
            enableInteraction={true}
            enableHaptics={true}
            renderChart={renderLineChart}
            renderLegend={renderLineLegend}
            onDataPointSelect={handleDataPointSelect}
          />
          
          <EnhancedIOSDataVisualization
            data={sectorData}
            type="pie"
            title="Revenue by Sector"
            subtitle="Percentage distribution"
            height={320}
            colors={iosColors}
            enableInteraction={true}
            enableHaptics={true}
            renderChart={renderPieChart}
            renderLegend={renderPieLegend}
            onDataPointSelect={handleDataPointSelect}
          />
        </div>
      );
    } 
    
    // Use iPad-optimized multitasking charts on iPad
    if (isIPad && isPlatformDetected) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MultiTaskingChart
            data={monthlyData}
            chartType="line"
            title="Monthly Revenue Trend"
            subtitle="Actual vs Target"
            height={320}
            colors={iosColors}
            enableInteraction={true}
            enableDragAndDrop={true}
            renderChart={renderMultiTaskingChart}
            renderLegend={(isCompact) => renderLineLegend(isCompact)}
          />
          
          <MultiTaskingChart
            data={sectorData}
            chartType="pie"
            title="Revenue by Sector"
            subtitle="Percentage distribution"
            height={320}
            colors={iosColors}
            enableInteraction={true}
            enableDragAndDrop={true}
            renderChart={renderMultiTaskingChart}
            renderLegend={(isCompact) => renderPieLegend(isCompact)}
          />
        </div>
      );
    }
    
    // Fallback to standard charts
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="fiori-tile">
          <div className="px-4 py-3 border-b border-[rgb(var(--scb-border))]">
            <h3 className="fiori-tile-title">Monthly Revenue Trend</h3>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--scb-border), 0.8)" />
                <XAxis dataKey="month" tick={{fill: 'rgb(var(--scb-dark-gray))'}} />
                <YAxis tick={{fill: 'rgb(var(--scb-dark-gray))'}} />
                <Tooltip 
                  contentStyle={{
                    borderColor: 'rgb(var(--scb-border))',
                    backgroundColor: 'white'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="rgb(var(--scb-honolulu-blue))" 
                  strokeWidth={2}
                  dot={{fill: 'rgb(var(--scb-honolulu-blue))'}}
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="rgb(var(--scb-american-green))" 
                  strokeDasharray="5 5"
                  dot={{fill: 'rgb(var(--scb-american-green))'}}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="fiori-tile">
          <div className="px-4 py-3 border-b border-[rgb(var(--scb-border))]">
            <h3 className="fiori-tile-title">Revenue by Sector</h3>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="rgb(var(--scb-honolulu-blue))"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    borderColor: 'rgb(var(--scb-border))',
                    backgroundColor: 'white'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ScbBeautifulUI showNewsBar={!isSmallScreen && !isMultiTasking} pageTitle="SCB FinSight Dashboard" showTabs={isAppleDevice}>
      <div className={`space-y-6 ${isMultiTasking && mode === 'slide-over' ? 'px-2' : ''} ${isSafeAreaInset && isAppleDevice ? 'pb-6' : ''}`}>
        {/* Header with action buttons */}
        <div className={`flex ${isMultiTasking && mode === 'slide-over' ? 'flex-col gap-3' : 'flex-col md:flex-row gap-4'} justify-between items-start md:items-center`}>
          <div>
            <h1 className={`${isMultiTasking && mode === 'slide-over' ? 'text-xl' : 'text-2xl'} font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>FinSight Dashboard</h1>
            <p className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Financial insights and analytics overview
            </p>
          </div>
          
          {/* Action Buttons for iPad */}
          {isAppleDevice && isPlatformDetected && (
            <div className={`flex items-center ${isMultiTasking && mode === 'slide-over' ? 'gap-2 w-full justify-end' : 'gap-3'}`}>
              <EnhancedTouchButton
                onClick={handleRefresh}
                variant={isDarkMode ? "dark" : "secondary"}
                size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                className="flex items-center gap-1"
              >
                <RefreshCw className={`${isRefreshing ? 'animate-spin' : ''} ${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                {!isMultiTasking && <span>Refresh</span>}
              </EnhancedTouchButton>
              
              <EnhancedTouchButton
                onClick={handleDownload}
                variant={isDarkMode ? "dark" : "secondary"}
                size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                className="flex items-center gap-1"
              >
                <Download className={`${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                {!isMultiTasking && <span>Export</span>}
              </EnhancedTouchButton>
              
              <EnhancedTouchButton
                onClick={handleShare}
                variant={isDarkMode ? "dark" : "secondary"}
                size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                className="flex items-center gap-1"
              >
                <Share2 className={`${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                {!isMultiTasking && <span>Share</span>}
              </EnhancedTouchButton>
            </div>
          )}
        </div>
        
        {/* SCB Banner Image - use network-aware image if on Apple devices */}
        {(!isMultiTasking || mode !== 'slide-over') && (
          <div className="w-full rounded-lg shadow-sm mb-6 overflow-hidden">
            {isAppleDevice ? (
              <NetworkAwareImage 
                src="/assets/finsight_Banner.png" 
                alt="FinSight Banner" 
                width={1200} 
                height={300}
                priorityLevel="high"
                className="w-full" 
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <Image 
                src="/assets/finsight_Banner.png" 
                alt="FinSight Banner" 
                width={1200} 
                height={300} 
                className="w-full" 
                style={{ objectFit: 'contain' }}
                priority
              />
            )}
          </div>
        )}
        
        {/* Welcome Banner */}
        <div className={`
          flex flex-col sm:flex-row sm:items-center justify-between gap-4 
          ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[rgb(var(--scb-border))]'} 
          p-4 border rounded-lg shadow-sm mb-6
        `}>
          <div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-[rgb(var(--scb-dark-gray))]'}`}>
              GCFO's digital gateway for data, executive insights driving commercial insights and business decision-making.
            </p>
          </div>
        </div>

        {/* Metric Cards - adjust layout for multi-tasking modes */}
        <div className={`grid ${
          isMultiTasking && mode === 'slide-over' 
            ? 'grid-cols-1 gap-3' 
            : isMultiTasking && mode === 'split-view'
              ? 'grid-cols-2 gap-3' 
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'
        }`}>
          <MetricCard
            title="SF Revenue"
            value={120567}
            change={6.3}
            period="vs Budget"
            format="currency"
          />
          <MetricCard
            title="Outlook vs Budget"
            value={10221}
            change={6.3}
            period="FY Outlook: 8m"
            format="currency"
          />
          <MetricCard
            title="SF Penetration"
            value={111}
            change={6.3}
            period="CIB Income: $n YTD"
            format="number"
          />
          <MetricCard
            title="YoY Income"
            value={14.32}
            change={6.3}
            period="Last Year YTD: $m"
            format="percentage"
          />
        </div>

        {/* Charts - conditionally rendered based on platform */}
        {renderCharts()}

        {/* News Section - platform-aware styling with iOS optimizations */}
        <div className={`fiori-tile ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[rgb(var(--scb-border))]'} border rounded-lg shadow-sm`}>
          <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-[rgb(var(--scb-border))]'} flex justify-between items-center`}>
            <h3 className={`${isMultiTasking && mode === 'slide-over' ? 'text-base' : 'text-lg'} font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              News from SAP Joule
            </h3>
            
            {/* iOS-specific view all button */}
            {isAppleDevice && isPlatformDetected && (
              <EnhancedTouchButton
                onClick={() => {
                  if (isAppleDevice) haptic({ intensity: 'light' });
                  alert('View all news');
                }}
                variant={isDarkMode ? "dark" : "secondary"}
                size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                className="flex items-center gap-1"
              >
                <ChevronRight className={`${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                {!isMultiTasking && <span>View All</span>}
              </EnhancedTouchButton>
            )}
          </div>
          
          <div className="p-4">
            <div className="space-y-3">
              {newsItems.map((item) => (
                <div 
                  key={item.id} 
                  className={`flex items-center justify-between py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-[rgb(var(--scb-border)])'} last:border-0`}
                  onClick={() => {
                    if (isAppleDevice) {
                      haptic({ intensity: 'light' });
                      alert(`Viewing news: ${item.title}`);
                    }
                  }}
                >
                  <div className="flex-1">
                    <p className={`text-sm font-normal ${isDarkMode ? 'text-gray-300' : 'text-[rgb(var(--scb-dark-gray))]'}`}>
                      {item.title}
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-[rgba(var(--scb-dark-gray), 0.7)]'}`}>
                      {item.source}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-[rgba(var(--scb-dark-gray), 0.7)]'}`}>
                      {item.date}
                    </span>
                    {item.important && (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        isDarkMode 
                          ? 'bg-purple-900/50 text-purple-300' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        Important
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* News Categories - responsive layout for iPad multi-tasking modes */}
        <div className={`grid ${
          isMultiTasking && mode === 'slide-over' 
            ? 'grid-cols-1 gap-3' 
            : isMultiTasking && mode === 'split-view'
              ? orientation === 'portrait' ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'
              : 'grid-cols-1 lg:grid-cols-3 gap-6'
        }`}
          {/* CNBC News - iOS optimized */}
          <div 
            className={`border rounded-lg shadow-sm overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[rgb(var(--scb-border))]'} ${
              isAppleDevice ? 'transition-all duration-150 active:scale-[0.99]' : ''
            }`}
            style={isAppleDevice ? { WebkitTapHighlightColor: 'transparent' } : undefined}
          >
            <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-[rgb(var(--scb-border))]'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-[rgb(var(--scb-muted-red))]"></div>
                  <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} ${isMultiTasking && mode === 'slide-over' ? 'text-sm' : 'text-base'}`}>
                    Important CNBC News
                  </h3>
                </div>
                
                {isAppleDevice && (
                  <Info 
                    className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ${isMultiTasking && mode === 'slide-over' ? 'h-3 w-3' : 'h-4 w-4'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isAppleDevice) haptic({ intensity: 'light' });
                      alert('CNBC News info');
                    }}
                  />
                )}
              </div>
            </div>
            <div className="p-4">
              <ul className="space-y-2">
                {[
                  'New regulation for APAC region',
                  'Impact tariff announcements on Asia markets',
                  'Bloomberg Green new regulations for APAC region',
                ].map((item, index) => (
                  <li 
                    key={index} 
                    className={`flex items-start py-1 border-b ${isDarkMode ? 'border-gray-700' : 'border-[rgb(var(--scb-border)])'} last:border-0 ${
                      isAppleDevice ? 'active:bg-gray-50 dark:active:bg-gray-700' : ''
                    }`}
                    onClick={() => {
                      if (isAppleDevice) {
                        haptic({ intensity: 'light' });
                        alert(`Reading: ${item}`);
                      }
                    }}
                  >
                    <span className="text-[rgb(var(--scb-muted-red))] mr-2">•</span>
                    <span className={`${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} ${isDarkMode ? 'text-gray-300' : 'text-[rgb(var(--scb-dark-gray))]'}`}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bloomberg Green - iOS optimized */}
          <div 
            className={`border rounded-lg shadow-sm overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[rgb(var(--scb-border))]'} ${
              isAppleDevice ? 'transition-all duration-150 active:scale-[0.99]' : ''
            }`}
            style={isAppleDevice ? { WebkitTapHighlightColor: 'transparent' } : undefined}
          >
            <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-[rgb(var(--scb-border))]'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-[rgb(var(--scb-american-green))]"></div>
                  <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} ${isMultiTasking && mode === 'slide-over' ? 'text-sm' : 'text-base'}`}>
                    Bloomberg Green
                  </h3>
                </div>
                
                {isAppleDevice && (
                  <Info 
                    className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ${isMultiTasking && mode === 'slide-over' ? 'h-3 w-3' : 'h-4 w-4'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isAppleDevice) haptic({ intensity: 'light' });
                      alert('Bloomberg Green info');
                    }}
                  />
                )}
              </div>
            </div>
            <div className="p-4">
              <ul className="space-y-2">
                {[
                  'New regulations for APAC region',
                  'Sustainability targets updated',
                  'Climate change impact assessment',
                ].map((item, index) => (
                  <li 
                    key={index} 
                    className={`flex items-start py-1 border-b ${isDarkMode ? 'border-gray-700' : 'border-[rgb(var(--scb-border)])'} last:border-0 ${
                      isAppleDevice ? 'active:bg-gray-50 dark:active:bg-gray-700' : ''
                    }`}
                    onClick={() => {
                      if (isAppleDevice) {
                        haptic({ intensity: 'light' });
                        alert(`Reading: ${item}`);
                      }
                    }}
                  >
                    <span className="text-[rgb(var(--scb-american-green))] mr-2">•</span>
                    <span className={`${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} ${isDarkMode ? 'text-gray-300' : 'text-[rgb(var(--scb-dark-gray))]'}`}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* BNC Green - hide in Slide Over mode on iPad */}
          {(!isMultiTasking || mode !== 'slide-over') && (
            <div 
              className={`border rounded-lg shadow-sm overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[rgb(var(--scb-border))]'} ${
                isAppleDevice ? 'transition-all duration-150 active:scale-[0.99]' : ''
              }`}
              style={isAppleDevice ? { WebkitTapHighlightColor: 'transparent' } : undefined}
            >
              <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-[rgb(var(--scb-border))]'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-[rgb(var(--scb-american-green))]"></div>
                    <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} ${isMultiTasking && mode === 'split-view' ? 'text-sm' : 'text-base'}`}>
                      BNC Green
                    </h3>
                  </div>
                  
                  {isAppleDevice && (
                    <Info 
                      className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ${isMultiTasking && mode === 'split-view' ? 'h-3 w-3' : 'h-4 w-4'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isAppleDevice) haptic({ intensity: 'light' });
                        alert('BNC Green info');
                      }}
                    />
                  )}
                </div>
              </div>
              <div className="p-4">
                <ul className="space-y-2">
                  {[
                    'New regulations for APAC region',
                    'Environmental compliance update',
                    'Green finance opportunities',
                  ].map((item, index) => (
                    <li 
                      key={index} 
                      className={`flex items-start py-1 border-b ${isDarkMode ? 'border-gray-700' : 'border-[rgb(var(--scb-border)])'} last:border-0 ${
                        isAppleDevice ? 'active:bg-gray-50 dark:active:bg-gray-700' : ''
                      }`}
                      onClick={() => {
                        if (isAppleDevice) {
                          haptic({ intensity: 'light' });
                          alert(`Reading: ${item}`);
                        }
                      }}
                    >
                      <span className="text-[rgb(var(--scb-american-green))] mr-2">•</span>
                      <span className={`${isMultiTasking && mode === 'split-view' ? 'text-xs' : 'text-sm'} ${isDarkMode ? 'text-gray-300' : 'text-[rgb(var(--scb-dark-gray))]'}`}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </ScbBeautifulUI>
  );
}