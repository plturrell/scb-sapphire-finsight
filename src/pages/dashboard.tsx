import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';
import { KPICard, ChartCard, TableCard, AlertCard } from '@/components/cards';
import { TrendingUp, TrendingDown, AlertCircle, Sparkles, BarChart3, RefreshCw, Info, ChevronRight } from 'lucide-react';
import AllocationPieChart from '@/components/charts/AllocationPieChart';
import { getGrokCompletion } from '@/lib/grok-api';
// Import the dashboard service for real data
import DashboardService, { FinancialData } from '@/services/DashboardService';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import { useMultiTasking } from '@/hooks/useMultiTasking';
import { useMicroInteractions } from '@/hooks/useMicroInteractions';
import { useIOSCompatibility } from '@/hooks/useIOSCompatibility';
import { useSFSymbolsSupport } from '@/hooks/useSFSymbolsSupport';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import useApplePhysics from '@/hooks/useApplePhysics';
import useSafeArea, { safeAreaCss } from '@/hooks/useSafeArea';
import { haptics } from '@/lib/haptics';
import EnhancedTouchButton from '@/components/EnhancedTouchButton';
import EnhancedDashboardNavigation from '@/components/EnhancedDashboardNavigation';
import IOSOptimizedLayout from '@/components/layout/IOSOptimizedLayout';
import EnhancedIOSDataVisualization from '@/components/charts/EnhancedIOSDataVisualization';
import { ICONS } from '@/components/IconSystem';
import '@/styles/ios-enhancements.css';

/**
 * Dashboard MVP for SCB Sapphire FinSight
 * Implements the core components with the SCB brand identity
 */
// Type definition for table columns to fix type error
interface TableColumn {
  header: string;
  accessor: string;
  type?: 'text' | 'number' | 'percentage' | 'currency' | 'date';
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
  renderCell?: (value: any, row: any) => React.ReactNode;
}

// Financial data service hook to fetch data from APIs
const useFinancialData = () => {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch real financial data from our API service
        const financialData = await DashboardService.getDashboardData();
        setData(financialData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
        console.error('Error fetching financial data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  return { data, loading, error };
};

// Component for role-based configuration
interface VisibleComponents {
  detailedTables: boolean;
  monteCarloSimulation: boolean;
  riskMetrics: boolean;
  allocationDetails: boolean;
  aiInsights: boolean;
}

const Dashboard: React.FC = () => {
  const router = useRouter();
  const [userRole, setUserRole] = useState<'executive' | 'analyst' | 'operations'>('analyst');
  const [aiInsight, setAiInsight] = useState<string>('');
  const [showAiAlert, setShowAiAlert] = useState(false);
  const [activeDashboardSection, setActiveDashboardSection] = useState('overview');
  const [visibleComponents, setVisibleComponents] = useState<VisibleComponents>({
    detailedTables: true,
    monteCarloSimulation: true,
    riskMetrics: true,
    allocationDetails: true,
    aiInsights: true
  });
  
  // iOS-specific state for touch interactions and gestures
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [navbarHidden, setNavbarHidden] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showKPIDetailModal, setShowKPIDetailModal] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<any>(null);
  const [showChartDetailModal, setShowChartDetailModal] = useState(false);
  const [selectedChart, setSelectedChart] = useState<any>(null);
  const [touchSwipeDistance, setTouchSwipeDistance] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeTarget, setSwipeTarget] = useState<string | null>(null);
  const [pinchState, setPinchState] = useState({ scale: 1, initialDistance: 0, isActive: false });
  const [containerDimensions, setContainerDimensions] = useState({ width: 300, height: 300 });
  
  // iOS-style network awareness and offline state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('');
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  
  // Device and platform detection
  const { isAppleDevice, deviceType } = useDeviceCapabilities();
  const { isMultiTasking, mode, sizeClass } = useMultiTasking();
  const { safeArea, hasHomeIndicator, hasDynamicIsland, orientation } = useSafeArea();
  const { supported: sfSymbolsSupported } = useSFSymbolsSupport();
  const { prefersReducedMotion } = useReducedMotion();
  const applePhysics = useApplePhysics({ motion: 'standard' });
  const isIOS = useIOSCompatibility();
  
  // Refs
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Define device types
  const isIPad = deviceType === 'tablet' && isAppleDevice;
  const isIPhone = deviceType === 'mobile' && isAppleDevice;
  const isApplePlatform = isIPad || isIPhone;
  
  // Active tab state for the iOS tab bar
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Generate iOS-specific CSS classes
  const getIOSClasses = () => {
    const classes = [];
    if (isApplePlatform) classes.push('ios-optimized');
    if (isIPhone) classes.push('ios-iphone');
    if (isIPad) classes.push('ios-ipad');
    if (hasDynamicIsland) classes.push('ios-dynamic-island');
    if (hasHomeIndicator) classes.push('ios-home-indicator');
    if (prefersReducedMotion) classes.push('reduced-motion');
    if (isMultiTasking) classes.push('ios-multitasking');
    if (mode === 'slide-over') classes.push('ios-slide-over');
    if (mode === 'split-view') classes.push('ios-split-view');
    if (mode === 'stage-manager') classes.push('ios-stage-manager');
    return classes.join(' ');
  };
  
  // Dashboard sections configuration with role-based access
  const dashboardSections = useMemo(() => [
    {
      id: 'overview',
      label: 'Overview',
      sublabel: 'Executive summary',
      icon: 'gauge.badge.plus',
      role: 'all' as const
    },
    {
      id: 'analytics',
      label: 'Analytics',
      sublabel: 'Deep dive analysis',
      icon: 'chart.bar.xaxis.ascending',
      role: 'analyst' as const
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      sublabel: 'Asset allocation',
      icon: 'briefcase.fill',
      role: 'all' as const
    },
    {
      id: 'risk',
      label: 'Risk',
      sublabel: 'Risk assessment',
      icon: 'shield.lefthalf.filled.badge.checkmark',
      role: 'all' as const
    },
    {
      id: 'performance',
      label: 'Performance',
      sublabel: 'Returns & metrics',
      icon: 'chart.line.uptrend.xyaxis',
      role: 'analyst' as const
    },
    {
      id: 'simulation',
      label: 'Monte Carlo',
      sublabel: 'Scenario analysis',
      icon: 'waveform.path.ecg',
      role: 'analyst' as const,
      badge: visibleComponents.monteCarloSimulation ? '3' : undefined
    },
    {
      id: 'reports',
      label: 'Reports',
      sublabel: 'Generated insights',
      icon: 'doc.text.fill',
      role: 'all' as const,
      badge: '5'
    },
    {
      id: 'operations',
      label: 'Operations',
      sublabel: 'Daily operations',
      icon: 'gear.badge.checkmark',
      role: 'operations' as const
    }
  ], [visibleComponents.monteCarloSimulation]);
  
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
      href: '/financial-simulation',
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
    { label: 'Dashboard', href: '/dashboard', icon: 'gauge' }
  ];
  
  // NavBar actions
  const navBarActions = [
    {
      icon: 'bell',
      label: 'Notifications',
      onPress: () => {
        if (preferences.enableHaptics) haptic({ intensity: 'light' });
        console.log('Notifications');
      }
    },
    {
      icon: 'person.crop.circle',
      label: 'Profile',
      onPress: () => {
        if (preferences.enableHaptics) haptic({ intensity: 'light' });
        console.log('Profile');
      }
    }
  ];
  
  // Fetch financial data
  const { data, loading, error } = useFinancialData();
  
  // Effect to update container dimensions for responsive charts
  useEffect(() => {
    if (!contentRef.current) return;
    
    const updateDimensions = () => {
      if (contentRef.current) {
        const rect = contentRef.current.getBoundingClientRect();
        setContainerDimensions({
          width: rect.width || 300,
          height: Math.max(rect.height || 300, 300)
        });
      }
    };
    
    updateDimensions();
    
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(contentRef.current);
    
    return () => {
      if (contentRef.current) {
        resizeObserver.unobserve(contentRef.current);
      }
    };
  }, []);

  // Effect to handle multi-tasking and orientation changes for iPad
  useEffect(() => {
    if (!isIPad || !isMultiTasking) return;
    
    const handleOrientationChange = () => {
      // Adjust layout when orientation changes in multi-tasking mode
      setTimeout(() => {
        if (contentRef.current) {
          const rect = contentRef.current.getBoundingClientRect();
          setContainerDimensions({
            width: rect.width || 300,
            height: Math.max(rect.height || 300, 300)
          });
        }
      }, 200); // Allow for orientation transition to complete
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, [isIPad, isMultiTasking]);

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

  // Effect to monitor network connectivity for iOS devices
  useEffect(() => {
    if (!isApplePlatform) return;
    
    const handleOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      
      if (!online && !showOfflineBanner) {
        setShowOfflineBanner(true);
        if (isApplePlatform) haptics.warning(); // Notify user of connectivity loss
      } else if (online && showOfflineBanner) {
        setShowOfflineBanner(false);
        if (isApplePlatform) haptics.success(); // Notify user of connectivity restoration
      }
    };
    
    const getConnectionInfo = () => {
      // @ts-ignore - connection API may not be available in all browsers
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        setConnectionType(connection.effectiveType || connection.type || 'unknown');
      }
    };
    
    // Initial setup
    handleOnlineStatus();
    getConnectionInfo();
    
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    // Monitor connection changes on iOS
    // @ts-ignore
    if (navigator.connection) {
      // @ts-ignore
      navigator.connection.addEventListener('change', getConnectionInfo);
    }
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
      // @ts-ignore
      if (navigator.connection) {
        // @ts-ignore
        navigator.connection.removeEventListener('change', getConnectionInfo);
      }
    };
  }, [showOfflineBanner, isApplePlatform]);
  
  // Configure dashboard based on user role
  useEffect(() => {
    const configureForRole = () => {
      switch(userRole) {
        case 'executive':
          // High-level summary view with less detail
          setVisibleComponents({
            detailedTables: false,
            monteCarloSimulation: true,
            riskMetrics: true,
            allocationDetails: false,
            aiInsights: true
          });
          break;
        case 'analyst':
          // Complete view with all details and analysis tools
          setVisibleComponents({
            detailedTables: true,
            monteCarloSimulation: true,
            riskMetrics: true,
            allocationDetails: true,
            aiInsights: true
          });
          break;
        case 'operations':
          // Focus on allocation and performance, less on projections
          setVisibleComponents({
            detailedTables: true,
            monteCarloSimulation: false,
            riskMetrics: true,
            allocationDetails: true,
            aiInsights: false
          });
          break;
      }
    };
    
    configureForRole();
  }, [userRole]);
  
  // AI insight generation using Grok API
  useEffect(() => {
    async function generateAiInsight() {
      if (!visibleComponents.aiInsights) return;
      
      try {
        // Use the Grok API to generate financial insights
        const grokMessages = [
          { role: 'user' as const, content: 'Provide a concise financial insight about this portfolio allocation: Equities 51%, Fixed Income 31%, Real Estate 10%, Alternatives 8%.' }
        ];
        
        const response = await getGrokCompletion(grokMessages);
        if (response) {
          setAiInsight(response);
          setShowAiAlert(true);
        }
      } catch (error) {
        console.error('Error generating AI insight:', error);
      }
    }
    
    // Generate insight when component mounts or role changes
    if (!loading && data) {
      generateAiInsight();
    }
  }, [loading, data, visibleComponents.aiInsights]);
  
  // Update the parent component when role changes
  const handleRoleChange = (newRole: 'executive' | 'analyst' | 'operations') => {
    setUserRole(newRole);
  };

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
      
      // Optionally refetch data here
      window.location.reload();
    }, 1500);
  };

  // Touch event handlers for iOS-specific interactions
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isApplePlatform) return;
    
    // Store the initial touch position
    setTouchStartY(e.touches[0].clientY);
    
    // Check for pinch gesture (two touches)
    if (e.touches.length === 2) {
      // Calculate initial distance between two touch points
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const initialDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      setPinchState({
        scale: pinchState.scale, // Keep current scale
        initialDistance,
        isActive: true
      });
      
      // Provide haptic feedback for pinch start
      haptics.light();
      
      // Prevent default to avoid scrolling during pinch
      e.preventDefault();
    } else {
      // Reset swipe state for single touch
      setIsSwiping(false);
      setTouchSwipeDistance(0);
      
      // Identify swipe target if applicable
      const target = e.currentTarget.getAttribute('data-swipe-id');
      if (target) {
        setSwipeTarget(target);
      }
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isApplePlatform) return;
    
    // Handle pinch-to-zoom (two touches)
    if (e.touches.length === 2 && pinchState.isActive && pinchState.initialDistance > 0) {
      // Calculate current distance between touch points
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      // Calculate new scale based on the change in distance
      const newScale = (currentDistance / pinchState.initialDistance) * pinchState.scale;
      
      // Constrain scale to reasonable limits (0.5 to 3)
      const constrainedScale = Math.min(Math.max(newScale, 0.5), 3);
      
      // Apply haptic feedback at scale thresholds for a more tactile experience
      if (constrainedScale > 1.5 && pinchState.scale <= 1.5) haptics.light();
      if (constrainedScale > 2.0 && pinchState.scale <= 2.0) haptics.medium();
      if (constrainedScale < 1.0 && pinchState.scale >= 1.0) haptics.light();
      
      setPinchState({
        ...pinchState,
        scale: constrainedScale
      });
      
      e.preventDefault(); // Prevent default to avoid unwanted scrolling
      return;
    }
    
    // Handle single touch gestures
    if (touchStartY === null) return;
    
    const currentY = e.touches[0].clientY;
    const diffY = touchStartY - currentY;
    const diffX = e.touches[0].clientX - e.currentTarget.getBoundingClientRect().left;
    
    // For potential swipe actions in dashboard elements
    if (swipeTarget && Math.abs(diffY) < 20 && diffX > 20) {
      setIsSwiping(true);
      setTouchSwipeDistance(diffX);
      
      // Enhanced haptic feedback with gradual intensity
      if (diffX > 30 && diffX < 32) haptics.selection();
      if (diffX > 50 && diffX < 52) haptics.light();
      if (diffX > 75 && diffX < 77) haptics.light();
      if (diffX > 100 && diffX < 102) haptics.medium();
    }
    
    // Pull-to-refresh gesture (when at top of page)
    if (diffY < -50 && window.scrollY <= 0 && !isRefreshing) {
      // Progressive haptic feedback based on pull distance
      if (diffY < -80 && diffY > -85) haptics.light();
      if (diffY < -120 && diffY > -125) haptics.medium();
      
      handleRefresh();
    }
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isApplePlatform) return;
    
    // Handle pinch gesture end
    if (pinchState.isActive) {
      // Reset to default scale with a satisfying snap if close to 1
      if (pinchState.scale > 0.85 && pinchState.scale < 1.15) {
        setPinchState({
          scale: 1,
          initialDistance: 0,
          isActive: false
        });
        haptics.light(); // Feedback for snapping back
      } else {
        setPinchState({
          ...pinchState,
          initialDistance: 0,
          isActive: false
        });
      }
      return;
    }
    
    // Handle swipe action completion
    if (isSwiping && touchSwipeDistance > 100 && swipeTarget) {
      // Add a small delay before action to make it feel more deliberate
      setTimeout(() => {
        // Complete the swipe action
        handleSwipeAction(swipeTarget);
        haptics.success(); // Success feedback
      }, 50);
    } else if (isSwiping) {
      // Animate swiped item back with spring physics
      setIsSwiping(false);
      setTouchSwipeDistance(0);
      haptics.selection(); // Light feedback for cancellation
    }
    
    // Reset touch state
    setTouchStartY(null);
    setSwipeTarget(null);
  };
  
  // Handle swipe actions on dashboard elements
  const handleSwipeAction = (itemId: string) => {
    // Identify item type and action
    const [itemType, itemValue] = itemId.split('-');
    
    if (itemType === 'kpi') {
      // Show details for the swiped KPI
      const kpiData = {
        id: itemValue,
        title: itemValue === 'assets' ? 'Total Assets' : itemValue === 'performance' ? 'Portfolio Performance' : 'Risk Score',
        value: financialMetrics[itemValue as keyof typeof financialMetrics]
      };
      setSelectedKPI(kpiData);
      setShowKPIDetailModal(true);
    } else if (itemType === 'chart') {
      // Show details for the swiped chart
      const chartData = {
        id: itemValue,
        title: itemValue === 'allocation' ? 'Asset Allocation' : 'Performance Chart',
        data: allocationData
      };
      setSelectedChart(chartData);
      setShowChartDetailModal(true);
    }
    
    // Reset swipe state
    setIsSwiping(false);
    setTouchSwipeDistance(0);
    setSwipeTarget(null);
  };

  // Format financial metrics from real data
  const financialMetrics = useMemo(() => {
    return data ? DashboardService.formatFinancialMetrics(data) : {
      totalAssets: {
        value: '-',
        percentChange: 0,
        target: 0,
        previous: 0
      },
      portfolioPerformance: {
        value: '-',
        percentChange: 0,
        target: 0,
        previous: 0
      },
      riskScore: {
        value: '-',
        percentChange: 0,
        target: 0,
        previous: 0
      }
    };
  }, [data]);

  // Get asset allocation data from real data
  const allocationData = useMemo(() => {
    if (!data) return [];
    return DashboardService.getAssetAllocationData(data.assets.breakdown);
  }, [data]);

  // Get asset data from real data
  const assetData = useMemo(() => {
    if (!data) return [];
    return data.assets.breakdown;
  }, [data]);
  
  // Create legend items for allocation chart
  const allocationLegendItems = useMemo(() => {
    return allocationData.map(item => ({
      label: item.name,
      color: item.color,
      value: `${Math.round(item.value * 100)}%`
    }));
  }, [allocationData]);

  const tableColumns: TableColumn[] = [
    { header: 'Asset Class', accessor: 'name', type: 'text' },
    { 
      header: 'Value', 
      accessor: 'value', 
      type: 'currency',
      sortable: true
    },
    { 
      header: 'Allocation', 
      accessor: 'allocation', 
      type: 'percentage',
      sortable: true 
    },
    { 
      header: 'Change', 
      accessor: 'change', 
      type: 'percentage',
      sortable: true,
      renderCell: (value: number) => (
        <div className={`flex items-center ${value >= 0 ? 'text-[rgb(var(--scb-american-green))]' : 'text-[rgb(var(--scb-muted-red))]'}`}>
          {value >= 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
          {(Math.abs(value) * 100).toFixed(2)}%
        </div>
      )
    }
  ];

  const { isDarkMode, preferences } = useUIPreferences();
  const { haptic } = useMicroInteractions();
  
  // Memoize dashboard data
  const dashboardData = useMemo(() => ({
    financialMetrics,
    assetData,
    allocationData,
    monteCarloResults: data?.risk?.monteCarloResults
  }), [financialMetrics, assetData, allocationData, data?.risk?.monteCarloResults]);
  
  // Role change handler with haptics
  const memoizedRoleChangeHandler = useCallback((role: string) => {
    if (preferences.enableHaptics) {
      // Enhanced haptic feedback for iOS devices
      if (isAppleDevice) {
        haptic({ intensity: 'medium' });
      } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(5);
      }
    }
    handleRoleChange(role);
  }, [preferences.enableHaptics, isAppleDevice, haptic]);
  
  // Handle dashboard section changes
  const handleDashboardSectionChange = useCallback((sectionId: string) => {
    setActiveDashboardSection(sectionId);
    
    // Optional: Update URL with section parameter
    const url = new URL(window.location.href);
    url.searchParams.set('section', sectionId);
    window.history.replaceState({}, '', url.toString());
  }, []);

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
    <>
      {isAppleDevice ? (
        <IOSOptimizedLayout
          title="Financial Dashboard"
          subtitle="SCB Sapphire FinSight"
          showBreadcrumb={true}
          breadcrumbItems={breadcrumbItems}
          showTabBar={true}
          tabItems={tabItems}
          navBarRightActions={navBarActions}
          showBackButton={false}
          largeTitle={true}
          theme={isDarkMode ? 'dark' : 'light'}
        >
          {/* Role-based view selector */}
          <div className={`mb-4 rounded-md flex items-center ${isDarkMode ? 'bg-blue-900/20' : 'bg-[rgb(var(--scb-light-blue-10))]'} p-3`}>
            <Sparkles className="text-[rgb(var(--scb-honolulu-blue))] mr-2" size={18} />
            <span className={`text-sm ${isDarkMode ? 'text-gray-200' : ''}`}>
              <span className="font-medium">Current view:</span> {userRole === 'executive' ? 'Executive Summary' : userRole === 'analyst' ? 'Detailed Analysis' : 'Operations View'}
            </span>
            
            {/* Role selector */}
            <div className="ml-auto">
              <div className={`${isMultiTasking && mode === 'slide-over' ? 'flex flex-col space-y-1.5' : 'flex space-x-1.5'}`}>
                <EnhancedTouchButton
                  variant={userRole === 'executive' ? 'primary' : 'secondary'}
                  size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                  onClick={() => memoizedRoleChangeHandler('executive')}
                >
                  Executive
                </EnhancedTouchButton>
                <EnhancedTouchButton
                  variant={userRole === 'analyst' ? 'primary' : 'secondary'}
                  size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                  onClick={() => memoizedRoleChangeHandler('analyst')}
                >
                  Analyst
                </EnhancedTouchButton>
                <EnhancedTouchButton
                  variant={userRole === 'operations' ? 'primary' : 'secondary'}
                  size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                  onClick={() => memoizedRoleChangeHandler('operations')}
                >
                  Operations
                </EnhancedTouchButton>
              </div>
            </div>
          </div>

          {/* Enhanced Dashboard Navigation with SF Symbols */}
          <div className="mb-6">
            <EnhancedDashboardNavigation
              sections={dashboardSections}
              activeSection={activeDashboardSection}
              onSectionChange={handleDashboardSectionChange}
              variant={isMultiTasking && mode === 'slide-over' ? 'list' : deviceType === 'tablet' ? 'grid' : 'cards'}
              userRole={userRole}
              className="w-full"
            />
          </div>
          
          {/* Alert Cards */}
          {error && (
            <AlertCard
              title=""
              type="error"
              message="Error Loading Dashboard Data"
              details={error.message || "There was a problem loading your financial data. Please try refreshing the page."}
              timestamp={new Date().toLocaleString()}
              actionable
              actionLabel="Retry"
              onAction={() => window.location.reload()}
              dismissible
            />
          )}
          
          {!error && showAiAlert && visibleComponents.aiInsights && (
            <AlertCard
              title=""
              type="info"
              message="AI-Powered Insight Generated"
              details={aiInsight}
              timestamp={new Date().toLocaleString()}
              actionable
              actionLabel="Apply Recommendation"
              onDismiss={() => setShowAiAlert(false)}
              dismissible
            />
          )}
          
          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div aria-label="Loading dashboard data" role="status" className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[rgb(var(--scb-honolulu-blue))] border-r-transparent mb-4"></div>
              <p className="scb-data-label text-[rgb(var(--scb-honolulu-blue))]">Loading your financial dashboard...</p>
            </div>
          )}
          
          {/* KPI Cards */}
          {!loading && !error && (
            <div className={`grid grid-cols-1 ${
              isMultiTasking && mode === 'slide-over'
                ? 'gap-3 mb-3'
                : isMultiTasking
                  ? 'sm:grid-cols-2 gap-3 mb-4'
                  : 'sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6'
            }`}>
              <KPICard
                title="Total Assets"
                value={financialMetrics.totalAssets.value}
                valuePrefix="$"
                percentChange={financialMetrics.totalAssets.percentChange}
                trendDirection="up"
                details="Total assets under management"
                benchmark={{ 
                  label: 'Previous Period', 
                  value: formatCurrency(financialMetrics.totalAssets.previous) 
                }}
                target={{ 
                  label: 'Target', 
                  value: formatCurrency(financialMetrics.totalAssets.target) 
                }}
              />
              
              <KPICard
                title="Portfolio Performance"
                value={financialMetrics.portfolioPerformance.value}
                valueSuffix="%"
                percentChange={financialMetrics.portfolioPerformance.percentChange}
                trendDirection="up"
                details="Annualized return"
                benchmark={{ 
                  label: 'Previous Period', 
                  value: financialMetrics.portfolioPerformance.previous + '%'
                }}
                target={{ 
                  label: 'Target', 
                  value: financialMetrics.portfolioPerformance.target + '%' 
                }}
              />
              
              <KPICard
                title="Risk Score"
                value={financialMetrics.riskScore.value}
                percentChange={financialMetrics.riskScore.percentChange}
                trendDirection="down"
                details="Overall portfolio risk assessment"
                benchmark={{ 
                  label: 'Previous Score', 
                  value: financialMetrics.riskScore.previous 
                }}
                target={{ 
                  label: 'Target', 
                  value: financialMetrics.riskScore.target 
                }}
              />
            </div>
          )}
          
          {/* Main content - charts and tables */}
          {!loading && !error && (
            <div className={`grid grid-cols-1 ${
              isMultiTasking && mode === 'slide-over'
                ? 'gap-3'
                : isMultiTasking
                  ? 'gap-3'
                  : 'lg:grid-cols-3 gap-4 md:gap-6'
            }`}>
              <div className={`${
                userRole === 'executive' 
                  ? 'lg:col-span-3' 
                  : isMultiTasking
                    ? 'col-span-1'
                    : 'lg:col-span-2'
              } order-2 lg:order-1`}>
                <ChartCard
                  title="Asset Allocation"
                  subtitle={userRole === 'executive' 
                    ? "Executive summary of portfolio allocation" 
                    : "Current portfolio breakdown with AI-enhanced predictions"}
                  expandable
                  exportable
                  aiInsights={visibleComponents.aiInsights 
                    ? "Your equity allocation is 5% higher than your target allocation. Based on Monte Carlo simulations (5,000+ runs), reducing equity exposure by 3-5% could optimize your risk-adjusted returns."
                    : undefined}
                  legendItems={allocationLegendItems}
                >
                  <div className="flex items-center justify-center h-64">
                    <AllocationPieChart 
                      data={allocationData}
                      width={400}
                      height={300}
                      innerRadius={80}
                      animate={true}
                      showAIIndicators={true}
                    />
                  </div>
                </ChartCard>
    
                {/* Sankey Flow Analysis */}
                <div className="mt-6">
                  <ChartCard
                    title="Portfolio Flow Analysis"
                    subtitle="Asset class interactions and risk connections"
                    expandable
                  >
                    <div className="flex items-center justify-center h-64 relative">
                      <div className="flex flex-col items-center text-center">
                        <div className="mb-4 px-2 py-1 rounded-sm bg-[rgba(var(--scb-american-green),0.1)] text-xs text-[rgb(var(--scb-american-green))] flex items-center absolute top-0 right-0">
                          <Sparkles className="w-3 h-3 mr-1.5" />
                          <span>AI Enhanced</span>
                        </div>
                        <div className="w-full h-full flex items-center justify-center">
                          <p className="scb-data-label">Sankey chart visualization would render here</p>
                          <p className="scb-supplementary mt-2">Showing asset class relationships</p>
                        </div>
                      </div>
                    </div>
                  </ChartCard>
                </div>
              </div>
              
              <div className="lg:col-span-1">
                <TableCard
                  title="Asset Classes"
                  subtitle="Current allocation"
                  columns={tableColumns}
                  data={assetData}
                  sortable
                  searchable
                />
    
                {/* Monte Carlo Simulation Card */}
                <div className="mt-6">
                  <ChartCard
                    title="Monte Carlo Forecast"
                    subtitle="5,000+ portfolio simulations"
                    comparisonPeriod="Next 10 Years"
                  >
                    <div className="flex flex-col items-center justify-center py-4">
                      <div className="w-full h-32 mb-4 bg-[rgba(var(--scb-honolulu-blue),0.05)] rounded-md px-3 py-2 relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[rgb(var(--scb-dark-gray))]" />
                        <div className="absolute bottom-2 left-2 text-xs text-[rgb(var(--scb-dark-gray))]">Today</div>
                        <div className="absolute bottom-2 right-2 text-xs text-[rgb(var(--scb-dark-gray))]">+10 yrs</div>
                        
                        {/* Simulation lines */}
                        {Array.from({ length: 20 }).map((_, i) => {
                          const hue = i < 3 ? 'var(--scb-muted-red)' : i > 15 ? 'var(--scb-american-green)' : 'var(--scb-honolulu-blue)';
                          const height = 30 + Math.random() * 70;
                          return (
                            <div 
                              key={i} 
                              className="absolute bottom-0 left-0 w-full h-24"
                              style={{
                                borderTop: `1px solid rgb(${hue})`,
                                opacity: 0.1 + (i / 40),
                                transform: `translateY(-${height}%) skewX(${10 + i}deg)`,
                                transition: 'all 0.5s ease'
                              }}
                            />
                          );
                        })}
                        
                        {/* Confidence bands */}
                        <div className="absolute bottom-0 left-0 w-full h-16" style={{ 
                          background: 'linear-gradient(to top, rgba(var(--scb-american-green), 0.1), transparent)',
                          clipPath: 'polygon(0% 100%, 100% 100%, 100% 30%, 0% 60%)'
                        }} />
                      </div>
                      
                      <div className="flex justify-between w-full text-center text-xs">
                        <div className="flex flex-col items-center">
                          <span className="text-[rgb(var(--scb-muted-red))] font-medium">Worst Case</span>
                          <span className="scb-metric-tertiary text-[rgb(var(--scb-muted-red))]">
                            {data?.risk?.monteCarloResults?.worstCase 
                              ? `${data.risk.monteCarloResults.worstCase > 0 ? '+' : ''}${data.risk.monteCarloResults.worstCase.toFixed(1)}%` 
                              : '-2.1%'}
                          </span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[rgb(var(--scb-honolulu-blue))] font-medium">Expected</span>
                          <span className="scb-metric-tertiary text-[rgb(var(--scb-honolulu-blue))]">
                            {data?.risk?.monteCarloResults?.expected 
                              ? `+${data.risk.monteCarloResults.expected.toFixed(1)}%` 
                              : '+6.4%'}
                          </span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[rgb(var(--scb-american-green))] font-medium">Best Case</span>
                          <span className="scb-metric-tertiary text-[rgb(var(--scb-american-green))]">
                            {data?.risk?.monteCarloResults?.bestCase 
                              ? `+${data.risk.monteCarloResults.bestCase.toFixed(1)}%` 
                              : '+11.2%'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </ChartCard>
                </div>
              </div>
            </div>
          )}
        </IOSOptimizedLayout>
      ) : (
        <ScbBeautifulUI 
          pageTitle="Financial Dashboard"
          showNewsBar={preferences.enableNewsBar}
        >
          {/* Role-based view content */}
          <div className={`mb-2 px-4 py-2 rounded-md flex items-center ${isDarkMode ? 'bg-blue-900/20' : 'bg-[rgb(var(--scb-light-blue-10))]'}`}>
            <Sparkles className="text-[rgb(var(--scb-honolulu-blue))] mr-2" size={18} />
            <span className={`text-sm ${isDarkMode ? 'text-gray-200' : ''}`}>
              <span className="font-medium">Current view:</span> {userRole === 'executive' ? 'Executive Summary' : userRole === 'analyst' ? 'Detailed Analysis' : 'Operations View'}
            </span>
            
            {/* Role selector for non-Apple devices */}
            <div className="ml-auto">
              <select 
                value={userRole}
                onChange={(e) => memoizedRoleChangeHandler(e.target.value)}
                className={`text-sm rounded border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}`}
              >
                <option value="executive">Executive</option>
                <option value="analyst">Analyst</option>
                <option value="operations">Operations</option>
              </select>
            </div>
          </div>

          {/* Enhanced Dashboard Navigation - Non-iOS version */}
          <div className="mb-6">
            <EnhancedDashboardNavigation
              sections={dashboardSections}
              activeSection={activeDashboardSection}
              onSectionChange={handleDashboardSectionChange}
              variant="tabs"
              userRole={userRole}
              className="w-full"
            />
          </div>
          
          {/* Alert Cards */}
          {error && (
            <div className="mb-6">
              <AlertCard
                title=""
                type="error"
                message="Error Loading Dashboard Data"
                details={error.message || "There was a problem loading your financial data. Please try refreshing the page."}
                timestamp={new Date().toLocaleString()}
                actionable
                actionLabel="Retry"
                onAction={() => window.location.reload()}
                dismissible
              />
            </div>
          )}
          
          {!error && showAiAlert && visibleComponents.aiInsights && (
            <div className="mb-6">
              <AlertCard
                title=""
                type="info"
                message="AI-Powered Insight Generated"
                details={aiInsight}
                timestamp={new Date().toLocaleString()}
                actionable
                actionLabel="Apply Recommendation"
                onDismiss={() => setShowAiAlert(false)}
                dismissible
              />
            </div>
          )}
          
          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div aria-label="Loading dashboard data" role="status" className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[rgb(var(--scb-honolulu-blue))] border-r-transparent mb-4"></div>
              <p className="scb-data-label text-[rgb(var(--scb-honolulu-blue))]">Loading your financial dashboard...</p>
            </div>
          )}
          
          {/* KPI Cards */}
          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
              <KPICard
                title="Total Assets"
                value={financialMetrics.totalAssets.value}
                valuePrefix="$"
                percentChange={financialMetrics.totalAssets.percentChange}
                trendDirection="up"
                details="Total assets under management"
                benchmark={{ 
                  label: 'Previous Period', 
                  value: formatCurrency(financialMetrics.totalAssets.previous) 
                }}
                target={{ 
                  label: 'Target', 
                  value: formatCurrency(financialMetrics.totalAssets.target) 
                }}
              />
              
              <KPICard
                title="Portfolio Performance"
                value={financialMetrics.portfolioPerformance.value}
                valueSuffix="%"
                percentChange={financialMetrics.portfolioPerformance.percentChange}
                trendDirection="up"
                details="Annualized return"
                benchmark={{ 
                  label: 'Previous Period', 
                  value: financialMetrics.portfolioPerformance.previous + '%'
                }}
                target={{ 
                  label: 'Target', 
                  value: financialMetrics.portfolioPerformance.target + '%' 
                }}
              />
              
              <KPICard
                title="Risk Score"
                value={financialMetrics.riskScore.value}
                percentChange={financialMetrics.riskScore.percentChange}
                trendDirection="down"
                details="Overall portfolio risk assessment"
                benchmark={{ 
                  label: 'Previous Score', 
                  value: financialMetrics.riskScore.previous 
                }}
                target={{ 
                  label: 'Target', 
                  value: financialMetrics.riskScore.target 
                }}
              />
            </div>
          )}
          
          {/* Content for non-Apple devices - same layout as in iOS version */}
          {!loading && !error && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              <div className={userRole === 'executive' ? 'lg:col-span-3' : 'lg:col-span-2'}>
                {/* Same chart and table components as in iOS version */}
                <ChartCard
                  title="Asset Allocation"
                  subtitle={userRole === 'executive' 
                    ? "Executive summary of portfolio allocation" 
                    : "Current portfolio breakdown with AI-enhanced predictions"}
                  expandable
                  exportable
                  aiInsights={visibleComponents.aiInsights 
                    ? "Your equity allocation is 5% higher than your target allocation. Based on Monte Carlo simulations (5,000+ runs), reducing equity exposure by 3-5% could optimize your risk-adjusted returns."
                    : undefined}
                  legendItems={allocationLegendItems}
                >
                  <div className="flex items-center justify-center h-64">
                    <AllocationPieChart 
                      data={allocationData}
                      width={400}
                      height={300}
                      innerRadius={80}
                      animate={true}
                      showAIIndicators={true}
                    />
                  </div>
                </ChartCard>
                
                {/* Additional charts and tables - same as iOS version */}
              </div>
            </div>
          )}
        </ScbBeautifulUI>
      )}
    </>
  );
};

// Helper function to format currency
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

export default Dashboard;