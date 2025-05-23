import React, { useState, useEffect, useRef, useCallback } from 'react';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';
import DetailedAnalyticsTable from '@/components/DetailedAnalyticsTable.enhanced';
import EnhancedIOSDataVisualization from '@/components/charts/EnhancedIOSDataVisualization';
import MultiTaskingChart from '@/components/charts/MultiTaskingChart';
import EnhancedTouchButton from '@/components/EnhancedTouchButton';
import EnhancedAppleTouchButton from '@/components/EnhancedAppleTouchButton';
import EnhancedAnalyticsNavigation from '@/components/EnhancedAnalyticsNavigation';
import analyticsService from '@/services/AnalyticsService';
import { useMultiTasking } from '@/hooks/useMultiTasking';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { useIOSCompatibility } from '@/hooks/useIOSCompatibility';
import { useSFSymbolsSupport } from '@/hooks/useSFSymbolsSupport';
import { useMicroInteractions } from '@/hooks/useMicroInteractions';
import IOSOptimizedLayout from '@/components/layout/IOSOptimizedLayout';
import { haptics } from '@/lib/haptics';
import { TransactionSector } from '@/types';
import { useMediaQuery } from 'react-responsive';
import useSafeArea, { safeAreaCss } from '@/hooks/useSafeArea';
import { ICONS } from '@/components/IconSystem';
import { ArrowRight, Download, Filter, RefreshCw, LayoutDashboard, FileText, Settings, AlertCircle, Zap } from '@/components/IconExports';
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

export default function Analytics() {
  // Data states for real API integration
  const [sectorData, setSectorData] = useState<TransactionSector[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
  const isIOS = useIOSCompatibility();
  const supportsSFSymbols = useSFSymbolsSupport();
  const { haptic, microScale } = useMicroInteractions();
  const { safeArea, hasHomeIndicator, hasDynamicIsland } = useSafeArea();
  
  // Determine if it's an iOS device
  const isIPad = deviceType === 'tablet' && isAppleDevice;
  const isiOS = deviceType === 'mobile' && isAppleDevice;
  const isApplePlatform = isiOS || isIPad;
  
  // Load data from Analytics Service
  const loadData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const [sectors, trends, distribution] = await Promise.all([
        analyticsService.getSectorData(forceRefresh),
        analyticsService.getTrendData(forceRefresh),
        analyticsService.getDistributionData(forceRefresh)
      ]);
      
      setSectorData(sectors);
      setTrendData(trends);
      
      // Convert distribution data to pie chart format with iOS colors
      const pieChartData = distribution.map((item, index) => ({
        name: item.name,
        value: item.value,
        color: iosColors[index % iosColors.length]
      }));
      setPieData(pieChartData);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      console.error('Error loading analytics data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Initial data load
  useEffect(() => {
    loadData();
  }, []);
  
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
  
  // Analytics categories with SF Symbols icons - enhanced version
  const analyticsCategories = [
    { 
      id: 'overview', 
      label: 'Overview', 
      sublabel: 'Executive summary',
      icon: 'chart.bar.doc.horizontal', 
      badge: undefined as string | undefined
    },
    { 
      id: 'revenue', 
      label: 'Revenue', 
      sublabel: 'Income analysis',
      icon: 'dollarsign.circle.fill', 
      badge: '+5.2%' 
    },
    { 
      id: 'accounts', 
      label: 'Accounts', 
      sublabel: 'Customer metrics',
      icon: 'person.2.fill', 
      count: 895
    },
    { 
      id: 'performance', 
      label: 'Performance', 
      sublabel: 'Key indicators',
      icon: 'chart.line.uptrend.xyaxis.fill', 
      badge: undefined as string | undefined
    },
    { 
      id: 'sectors', 
      label: 'Sectors', 
      sublabel: 'Industry breakdown',
      icon: 'rectangle.3.group.fill', 
      count: 10
    },
    { 
      id: 'risk', 
      label: 'Risk', 
      sublabel: 'Risk assessment',
      icon: 'exclamationmark.triangle.fill', 
      count: 3
    },
    { 
      id: 'custom', 
      label: 'Custom', 
      sublabel: 'Custom reports',
      icon: 'slider.horizontal.3', 
      badge: undefined as string | undefined
    }
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
  
  // Handle data refresh with iOS physics animations
  const handleRefresh = async () => {
    // Don't trigger if already refreshing
    if (refreshing) return;
    
    // Provide haptic feedback on Apple devices
    if (isApplePlatform) {
      haptics.medium();
    }
    
    setRefreshing(true);
    
    // Animate chart transition out
    if (isApplePlatform && !prefersReducedMotion) {
      setChartTransition(true);
    }
    
    try {
      // Load fresh data from API
      await loadData(true);
      
      // Reset chart transition midway
      if (isApplePlatform && !prefersReducedMotion) {
        setTimeout(() => {
          setChartTransition(false);
        }, isApplePlatform ? 400 : 0);
      }
      
      // Success haptic feedback when refresh completes
      if (isApplePlatform) {
        haptics.success();
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
      if (isApplePlatform) {
        haptics.error();
      }
    } finally {
      setRefreshing(false);
    }
  };
  
  // Handle report download with iOS-specific loading state and haptics
  const handleDownloadReport = () => {
    // Provide haptic feedback on Apple devices
    if (isApplePlatform) {
      haptics.medium();
    }
    
    // iOS-style handling with action sheet or notification
    if (isApplePlatform) {
      // Success notification after a delay
      setTimeout(() => {
        // Success haptic feedback when complete
        haptics.success();
        
        // In a real app, this would generate and download a report
        setSelectedDataPoint({
          title: "Analytics Report",
          description: "Transaction Banking Performance Q1 2025",
          status: "Downloaded Successfully",
          timestamp: new Date().toISOString()
        });
        
        setShowDataDetail(true);
      }, 1500);
    } else {
      // Standard alert for non-Apple devices
      alert('Downloading analytics report...');
    }
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

  // Render line chart with enhanced iOS optimizations
  const renderLineChart = (dimensions: any, interactionState: any, helpers: any) => {
    const { width, height, margin, innerWidth, innerHeight } = dimensions;
    const { formatCurrency, triggerHaptic } = helpers || {};
    const { isCompact, isExpanded, hasFocus } = interactionState || {};
    
    // Determine responsively sized elements based on container size
    const fontSize = isCompact ? 10 : isExpanded ? 14 : 12;
    const strokeWidth = isCompact ? 2 : isExpanded ? 4 : 3;
    const dotRadius = isCompact ? 3 : isExpanded ? 5 : 4;
    const activeDotRadius = dotRadius + 2;
    
    // Adjust chart visibility during transition for smoother animation
    const opacity = chartTransition ? 0.3 : 1;
    const transform = chartTransition ? 'translateY(10px)' : 'translateY(0)';
    
    // Dynamic line type based on device - straight lines look more iOS-native
    const lineType = isApplePlatform ? 'linear' : 'monotone';
    
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          opacity,
          transform,
          transition: isApplePlatform ? 
            `opacity ${iosTransitions.duration}ms ${iosTransitions.easing}, transform ${iosTransitions.duration}ms ${iosTransitions.easing}` : 
            'none'
        }}
      >
        <ResponsiveContainer width={width} height={height}>
          <LineChart 
            data={trendData} 
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            onClick={(data) => {
              // Handle chart overall click for iOS integration
              if (isApplePlatform && !data?.activePayload) {
                triggerHaptic('light');
              }
            }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
              vertical={!isCompact}
            />
            <XAxis 
              dataKey="month" 
              tick={{ 
                fontSize, 
                fill: isDarkMode ? '#8E8E93' : '#3C3C43' 
              }}
              stroke={isDarkMode ? "rgba(255,255,255,0.3)" : "#8E8E93"}
              tickLine={!isCompact}
              axisLine={!isCompact}
              tickMargin={8}
            />
            <YAxis 
              yAxisId="left" 
              orientation="left" 
              stroke={iosColors[0]}
              tickFormatter={(value) => formatCurrency ? formatCurrency(value, 'USD').split('.')[0] : `$${value/1000}k`}
              tick={{ fontSize }}
              tickLine={!isCompact}
              axisLine={!isCompact}
              tickMargin={8}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke={iosColors[1]}
              tick={{ fontSize }}
              tickLine={!isCompact}
              axisLine={!isCompact}
              hide={isCompact}
            />
            <Tooltip 
              contentStyle={{
                borderRadius: 12,
                backgroundColor: isDarkMode ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                border: isDarkMode ? '1px solid rgba(60,60,60,0.8)' : '1px solid rgba(0,0,0,0.05)',
                padding: '8px 12px',
                fontSize: fontSize + 1,
                color: isDarkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)'
              }}
              formatter={(value: any, name: string) => {
                if (isApplePlatform && triggerHaptic) {
                  // Provide subtle feedback when hovering over data points
                  triggerHaptic('light');
                }
                
                if (name === 'Revenue') {
                  return formatCurrency ? formatCurrency(value, 'USD') : `$${value.toLocaleString()}`;
                }
                return value;
              }}
              cursor={isApplePlatform ? { stroke: isDarkMode ? '#8E8E93' : '#3C3C43', strokeDasharray: '3 3' } : undefined}
              wrapperStyle={{
                outline: 'none',
                zIndex: 100,
                pointerEvents: 'auto'
              }}
            />
            <Line 
              yAxisId="left" 
              type={lineType}
              dataKey="revenue" 
              stroke={iosColors[0]}
              strokeWidth={strokeWidth}
              activeDot={{
                r: activeDotRadius,
                fill: iosColors[0],
                stroke: isDarkMode ? '#1C1C1E' : 'white',
                strokeWidth: 2,
                onMouseOver: () => isApplePlatform && triggerHaptic && triggerHaptic('light'),
                onClick: () => {
                  if (isApplePlatform && triggerHaptic) {
                    triggerHaptic('medium');
                  }
                }
              }}
              dot={{
                r: dotRadius,
                fill: isDarkMode ? '#1C1C1E' : 'white',
                stroke: iosColors[0],
                strokeWidth: 2
              }}
              name="Revenue"
              animationDuration={isApplePlatform ? iosTransitions.duration : 1000}
              animationEasing={isApplePlatform ? iosTransitions.easing : 'ease'}
              isAnimationActive={!prefersReducedMotion}
            />
            <Line 
              yAxisId="right" 
              type={lineType}
              dataKey="accounts" 
              stroke={iosColors[1]}
              strokeWidth={strokeWidth}
              activeDot={{
                r: activeDotRadius,
                fill: iosColors[1],
                stroke: isDarkMode ? '#1C1C1E' : 'white',
                strokeWidth: 2,
                onMouseOver: () => isApplePlatform && triggerHaptic && triggerHaptic('light'),
                onClick: () => {
                  if (isApplePlatform && triggerHaptic) {
                    triggerHaptic('medium');
                  }
                }
              }}
              dot={{
                r: dotRadius,
                fill: isDarkMode ? '#1C1C1E' : 'white',
                stroke: iosColors[1],
                strokeWidth: 2
              }}
              name="Accounts"
              animationDuration={isApplePlatform ? iosTransitions.duration : 1000}
              animationEasing={isApplePlatform ? iosTransitions.easing : 'ease'}
              isAnimationActive={!prefersReducedMotion}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Render pie chart with enhanced iOS optimizations
  const renderPieChart = (dimensions: any, interactionState: any, helpers: any) => {
    const { width, height } = dimensions;
    const { formatPercentage, triggerHaptic } = helpers || {};
    const { activeIndex, isCompact, isExpanded, isPinching } = interactionState || {};
    
    // Adjust sizes based on container and interaction state
    const outerRadius = isCompact ? 70 : isExpanded ? 100 : 80;
    const innerRadius = activeIndex !== null ? (outerRadius * 0.5) : (isApplePlatform ? outerRadius * 0.35 : 0);
    
    // Adjust chart visibility during transition for smoother animation
    const opacity = chartTransition ? 0.3 : 1;
    const transform = chartTransition ? 'scale(0.95)' : 'scale(1)';
    
    // Dynamic padding based on device
    const paddingAngle = isApplePlatform ? 4 : 2;
    
    // Enhanced iOS-style label function for clean, Apple-like data visualization
    const labelFunction = ({ name, value, percent }: { name: string, value: number, percent: number }) => {
      if (isCompact) return '';
      if (isApplePlatform) {
        return `${value}%`;
      }
      return `${name}: ${value}%`;
    };
    
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          opacity,
          transform,
          transition: isApplePlatform ? 
            `opacity ${iosTransitions.duration}ms ${iosTransitions.easing}, transform ${iosTransitions.duration}ms ${iosTransitions.easing}` : 
            'none'
        }}
      >
        <ResponsiveContainer width={width} height={height}>
          <PieChart
            onClick={() => {
              // Handle chart overall click for iOS integration
              if (isApplePlatform && triggerHaptic) {
                triggerHaptic('light');
              }
            }}
          >
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              fill={iosColors[0]}
              dataKey="value"
              animationDuration={isApplePlatform ? iosTransitions.duration : 800}
              animationEasing={isApplePlatform ? iosTransitions.easing : 'ease'}
              isAnimationActive={!prefersReducedMotion}
              animationBegin={isApplePlatform ? 50 : 0}
              paddingAngle={paddingAngle}
              label={labelFunction}
              labelLine={!isApplePlatform}
              onClick={(_, index) => {
                // Provide feedback when a segment is clicked
                if (isApplePlatform && triggerHaptic) {
                  triggerHaptic('medium');
                  
                  // Select the sector when clicked (iOS style)
                  handleSectorSelect(pieData[index]);
                }
              }}
              activeIndex={isApplePlatform ? (activeIndex !== null ? [activeIndex] : undefined) : undefined}
              activeShape={isApplePlatform ? {
                fill: iosColors[0],
                stroke: isDarkMode ? '#1C1C1E' : 'white',
                strokeWidth: 3,
                scale: 1.05,
                shadowColor: 'rgba(0,0,0,0.2)',
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowOffsetY: 3
              } : undefined}
              onMouseEnter={(_, index) => {
                // Provide subtle feedback on hover
                if (isApplePlatform && triggerHaptic) {
                  triggerHaptic('light');
                }
              }}
            >
              {pieData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                  stroke={isDarkMode ? '#1C1C1E' : 'white'} 
                  strokeWidth={activeIndex === index ? 3 : 1}
                  strokeOpacity={1}
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                borderRadius: 12,
                backgroundColor: isDarkMode ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                border: isDarkMode ? '1px solid rgba(60,60,60,0.8)' : '1px solid rgba(0,0,0,0.05)',
                padding: '8px 12px',
                color: isDarkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)'
              }}
              formatter={(value: any, name: string, props: any) => {
                if (isApplePlatform && triggerHaptic) {
                  // Provide subtle feedback when hovering over segments
                  triggerHaptic('light');
                }
                
                // iOS-optimized tooltip value
                return isApplePlatform ? [
                  `${value}%`, 
                  name
                ] : formatPercentage ? formatPercentage(value, 0) : `${value}%`;
              }}
              wrapperStyle={{
                outline: 'none',
                zIndex: 100,
                pointerEvents: 'auto'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
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

  // iOS-specific enhanced data detail modal
  const renderDataDetailModal = () => {
    if (!isApplePlatform || !showDataDetail || !selectedDataPoint) return null;
    
    // Render iOS style card with sector details
    return (
      <div 
        className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50"
        onClick={closeDataDetail}
        style={{
          touchAction: 'none'
        }}
      >
        <div 
          className={`w-full max-w-lg bg-white dark:bg-gray-800 rounded-t-2xl p-6 pb-10 transform transition-transform duration-300 ease-out ${
            showDataDetail ? 'translate-y-0' : 'translate-y-full'
          }`}
          onClick={e => e.stopPropagation()}
          style={{ 
            paddingBottom: hasHomeIndicator ? `calc(1.5rem + ${safeAreaCss.bottom})` : '1.5rem' 
          }}
        >
          {/* Drag handle */}
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-6" />
          
          {/* Close button */}
          <button 
            className="absolute top-6 right-6 text-gray-500 dark:text-gray-400"
            onClick={closeDataDetail}
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          
          {/* Content */}
          <h3 className="text-xl font-semibold mb-3">
            {selectedDataPoint.name || selectedDataPoint.title || 'Sector Details'}
          </h3>
          
          {selectedDataPoint.status && (
            <div className="mb-4 flex items-center">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {selectedDataPoint.status}
              </span>
            </div>
          )}
          
          {selectedDataPoint.description && (
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {selectedDataPoint.description}
            </p>
          )}
          
          {/* Display data in a card */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-4">
            {selectedDataPoint.revenue && (
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">Revenue</span>
                <span className="font-semibold">${selectedDataPoint.revenue.toLocaleString()}</span>
              </div>
            )}
            
            {selectedDataPoint.accounts && (
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">Accounts</span>
                <span className="font-semibold">{selectedDataPoint.accounts}</span>
              </div>
            )}
            
            {selectedDataPoint.value && (
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">Share</span>
                <span className="font-semibold">{selectedDataPoint.value}%</span>
              </div>
            )}
            
            {selectedDataPoint.change !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">YoY Change</span>
                <span className={`font-semibold ${
                  selectedDataPoint.change > 0 ? 'text-green-600' : 
                  selectedDataPoint.change < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {selectedDataPoint.change > 0 ? '+' : ''}{selectedDataPoint.change}%
                </span>
              </div>
            )}
            
            {selectedDataPoint.timestamp && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Timestamp</span>
                <span className="font-semibold">
                  {new Date(selectedDataPoint.timestamp).toLocaleString()}
                </span>
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <EnhancedAppleTouchButton
              variant="secondary"
              fullWidth={true}
              onClick={closeDataDetail}
              size="md"
              hapticFeedback={true}
              hapticPattern="selection"
            >
              Close
            </EnhancedAppleTouchButton>
            
            <EnhancedAppleTouchButton
              variant="primary"
              fullWidth={true}
              onClick={() => {
                haptics.action();
                closeDataDetail();
                // Navigate to detailed view in real app
                alert('Viewing full details would open a dedicated page');
              }}
              size="md"
              hapticFeedback={true}
              hapticPattern="action"
            >
              View Full Details
            </EnhancedAppleTouchButton>
          </div>
        </div>
      </div>
    );
  };
  
  // Loading state
  if (loading && sectorData.length === 0) {
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
            largeTitle={!navbarHidden}
            theme={isDarkMode ? 'dark' : 'light'}
            navbarHidden={navbarHidden}
          >
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Loading analytics data...</p>
              </div>
            </div>
          </IOSOptimizedLayout>
        ) : (
          <ScbBeautifulUI 
            showNewsBar={!isSmallScreen && !isMultiTasking} 
            pageTitle="Analytics" 
            showTabs={false}
          >
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading analytics data...</p>
              </div>
            </div>
          </ScbBeautifulUI>
        )}
      </>
    );
  }

  // Error state
  if (error) {
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
            largeTitle={!navbarHidden}
            theme={isDarkMode ? 'dark' : 'light'}
            navbarHidden={navbarHidden}
          >
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Failed to Load Analytics
                </h3>
                <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {error}
                </p>
                <EnhancedTouchButton
                  variant="primary"
                  label="Retry"
                  onClick={() => loadData(true)}
                  iconLeft={<RefreshCw className="w-4 h-4" />}
                />
              </div>
            </div>
          </IOSOptimizedLayout>
        ) : (
          <ScbBeautifulUI 
            showNewsBar={!isSmallScreen && !isMultiTasking} 
            pageTitle="Analytics" 
            showTabs={false}
          >
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-gray-900">
                  Failed to Load Analytics
                </h3>
                <p className="text-gray-600 mb-4">
                  {error}
                </p>
                <button
                  onClick={() => loadData(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            </div>
          </ScbBeautifulUI>
        )}
      </>
    );
  }

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
          largeTitle={!navbarHidden}
          theme={isDarkMode ? 'dark' : 'light'}
          navbarHidden={navbarHidden}
        >
          <div 
            className="space-y-6"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            ref={chartContainerRef}
          >
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
            
            {/* Enhanced Analytics Navigation with SF Symbols */}
            <div className="mb-6">
              <EnhancedAnalyticsNavigation
                categories={analyticsCategories}
                activeCategory={activeAnalyticsCategory}
                onCategoryChange={handleCategorySelect}
                variant={isMultiTasking && mode === 'slide-over' ? 'list' : deviceType === 'tablet' ? 'grid' : 'cards'}
                timeFilter={timeFilters[activeFilterIndex]}
                className="w-full"
              />
            </div>
            
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
            
            {/* Enhanced Analytics Navigation - Non-iOS version */}
            <div className="mb-6">
              <EnhancedAnalyticsNavigation
                categories={analyticsCategories}
                activeCategory={activeAnalyticsCategory}
                onCategoryChange={handleCategorySelect}
                variant="tabs"
                timeFilter={timeFilters[activeFilterIndex]}
                className="w-full"
              />
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
      {/* iOS-specific data detail modal */}
      {renderDataDetailModal()}
    </>
  );
}