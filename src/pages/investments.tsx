import React, { useState, useEffect, useRef } from 'react';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import MetricCard from '@/components/MetricCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { RefreshCw, Info, Filter, Download, Share2, ChevronRight } from 'lucide-react';
import EnhancedTouchButton from '@/components/EnhancedTouchButton';
import IOSOptimizedLayout from '@/components/layout/IOSOptimizedLayout';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import { useMultiTasking } from '@/hooks/useMultiTasking';
import useApplePhysics from '@/hooks/useApplePhysics';
import useSafeArea, { safeAreaCss } from '@/hooks/useSafeArea';
import { haptics } from '@/lib/haptics';
import EnhancedIOSDataVisualization from '@/components/charts/EnhancedIOSDataVisualization';
import MultiTaskingChart from '@/components/charts/MultiTaskingChart';
import { useSFSymbolsSupport } from '@/lib/sf-symbols';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import '@/styles/ios-enhancements.css';

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
  const { prefersReducedMotion } = useReducedMotion();
  
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
  const [pinchState, setPinchState] = useState({ scale: 1, initialDistance: 0, isActive: false });
  const [containerDimensions, setContainerDimensions] = useState({ width: 300, height: 300 });
  
  // iOS-style network awareness and offline state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('');
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  
  // Refs
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Define device types
  const isIPad = deviceType === 'tablet' && isAppleDevice;
  const isIPhone = deviceType === 'mobile' && isAppleDevice;
  const isApplePlatform = isIPad || isIPhone;
  
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
  
  // Platform detection is handled by the useDeviceCapabilities hook
  
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
    
    // For potential swipe actions in holdings and insights
    if (swipeTarget && Math.abs(diffY) < 20 && diffX > 20) {
      setIsSwiping(true);
      setTouchSwipeDistance(diffX);
      
      // Enhanced haptic feedback with gradual intensity
      // This creates a more precise "detent" feeling common in iOS interfaces
      if (diffX > 30 && diffX < 32) haptics.selection();
      if (diffX > 50 && diffX < 52) haptics.light();
      if (diffX > 75 && diffX < 77) haptics.light();
      if (diffX > 100 && diffX < 102) haptics.medium();
    }
    
    // Pull-to-refresh gesture with enhanced physics (when at top of page)
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
    
    // Handle swipe action completion with enhanced feedback
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
  
  // iOS-style offline banner
  const renderOfflineBanner = () => {
    if (!showOfflineBanner || !isApplePlatform) return null;
    
    // Position the banner below the Dynamic Island if present
    const topOffset = hasDynamicIsland ? '100px' : '80px';
    
    return (
      <div 
        className={`fixed left-4 right-4 z-50 pointer-events-auto notification-banner ${showOfflineBanner ? 'show' : ''}`}
        style={{ 
          top: topOffset,
          maxWidth: '400px',
          margin: '0 auto',
          left: '50%',
          transform: 'translateX(-50%)',
          ...(hasDynamicIsland && {
            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.1))'
          })
        }}
      >
        <div 
          className={`p-3 rounded-xl border ${
            isDarkMode 
              ? 'bg-gray-800/90 border-gray-700 text-white' 
              : 'bg-white/90 border-gray-200 text-gray-800'
          }`}
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="flex items-center gap-3">
            {sfSymbolsSupported ? (
              <span className="sf-symbol text-orange-500 text-lg">wifi.slash</span>
            ) : (
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">No Internet Connection</p>
              <p className="text-xs opacity-75">Showing cached data</p>
            </div>
            <button 
              className={`px-3 py-1 text-xs rounded-lg ${
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              }`}
              onClick={() => {
                setShowOfflineBanner(false);
                if (isApplePlatform) haptics.light();
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  };

  // iOS-style pull-to-refresh indicator with Dynamic Island awareness
  const renderRefreshIndicator = () => {
    if (!isRefreshing || !isApplePlatform) return null;
    
    // Position the refresh indicator below the Dynamic Island if present
    const topOffset = hasDynamicIsland ? '72px' : '50px';
    
    return (
      <div 
        className="fixed top-0 left-0 right-0 flex justify-center z-40 pointer-events-none"
        style={{ 
          paddingTop: topOffset,
          // Respect Dynamic Island in full-screen experiences
          ...(hasDynamicIsland && {
            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.1))'
          })
        }}
      >
        <div 
          className={`h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent ${
            prefersReducedMotion ? '' : 'animate-spin'
          }`}
          style={{
            animation: prefersReducedMotion 
              ? 'none' 
              : `spin ${applePhysics.config.duration * 2}ms linear infinite`
          }}
        />
      </div>
    );
  };
  
  // iOS-style holding detail modal
  const renderHoldingDetailModal = () => {
    if (!showDetailModal || !selectedHolding) return null;
    
    return (
      <div 
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
        onClick={() => {
          setShowDetailModal(false);
          if (isApplePlatform) haptics.light();
        }}
        style={{
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          // Enhanced backdrop for iOS-style modal feel
          backgroundColor: 'rgba(0,0,0,0.3)',
          animation: prefersReducedMotion 
            ? 'none' 
            : `fade-in ${applePhysics.config.duration}ms cubic-bezier(0.25, 0.1, 0.25, 1.0)`
        }}
      >
        <div 
          className={`w-full max-w-lg mx-auto rounded-t-xl overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}
          style={{
            transform: 'translateY(0)',
            animation: prefersReducedMotion 
              ? 'none' 
              : `slide-in-up ${applePhysics.config.duration}ms cubic-bezier(0.25, 0.1, 0.25, 1.0)`,
            boxShadow: '0 -2px 20px rgba(0,0,0,0.2)',
            paddingBottom: hasHomeIndicator ? `calc(2rem + ${safeAreaCss.bottom})` : '2rem',
            // Better iOS-style sheet appearance
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            ...(hasDynamicIsland && {
              // Ensure content doesn't interfere with Dynamic Island
              maxHeight: 'calc(100vh - 100px)'
            })
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
            
            {/* iOS-style Actions */}
            <div className="space-y-3">
              <button 
                className={`w-full px-4 py-3 text-white rounded-lg flex items-center justify-center space-x-2 ${
                  isDarkMode ? 'bg-blue-600' : 'bg-blue-600'
                } active:scale-95 transition-transform duration-100`}
                onClick={() => {
                  if (isApplePlatform) haptics.medium();
                  setShowDetailModal(false);
                }}
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  borderRadius: '12px',
                  minHeight: '48px', // iOS-recommended touch target size
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  transition: prefersReducedMotion 
                    ? 'none' 
                    : `all ${applePhysics.config.duration * 0.5}ms cubic-bezier(0.25, 0.1, 0.25, 1.0)`
                }}
              >
                {sfSymbolsSupported ? (
                  <span className="sf-symbol text-white text-[16px]">chart.xyaxis.line</span>
                ) : (
                  <span>📊</span>
                )}
                <span>View Details</span>
              </button>
              <button 
                className={`w-full px-4 py-3 rounded-lg flex items-center justify-center space-x-2 ${
                  isDarkMode 
                    ? 'bg-gray-800 text-white border border-gray-700'
                    : 'bg-white text-gray-800 border border-gray-300'
                } active:scale-95 transition-transform duration-100`}
                onClick={() => {
                  if (isApplePlatform) haptics.light();
                  setShowDetailModal(false);
                }}
                style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  borderRadius: '12px',
                  minHeight: '48px', // iOS-recommended touch target size
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  transition: prefersReducedMotion 
                    ? 'none' 
                    : `all ${applePhysics.config.duration * 0.5}ms cubic-bezier(0.25, 0.1, 0.25, 1.0)`
                }}
              >
                {sfSymbolsSupported ? (
                  <span className="sf-symbol text-[16px]">xmark</span>
                ) : (
                  <span>✕</span>
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
            
            {/* iOS-style Actions */}
            <div className="mt-6 space-y-3">
              <button 
                className={`w-full px-4 py-3 text-white rounded-lg flex items-center justify-center space-x-2 ${
                  isDarkMode ? 'bg-blue-600' : 'bg-blue-600'
                } active:scale-95 transition-transform duration-100`}
                onClick={() => {
                  if (isApplePlatform) haptics.medium();
                  setShowInsightModal(false);
                }}
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  borderRadius: '12px',
                  minHeight: '48px', // iOS-recommended touch target size
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  transition: prefersReducedMotion 
                    ? 'none' 
                    : `all ${applePhysics.config.duration * 0.5}ms cubic-bezier(0.25, 0.1, 0.25, 1.0)`
                }}
              >
                {sfSymbolsSupported ? (
                  <span className="sf-symbol text-white text-[16px]">doc.text</span>
                ) : (
                  <span>📄</span>
                )}
                <span>View Full Report</span>
              </button>
              <button 
                className={`w-full px-4 py-3 rounded-lg flex items-center justify-center space-x-2 ${
                  isDarkMode 
                    ? 'bg-gray-800 text-white border border-gray-700'
                    : 'bg-white text-gray-800 border border-gray-300'
                } active:scale-95 transition-transform duration-100`}
                onClick={() => {
                  if (isApplePlatform) haptics.light();
                  setShowInsightModal(false);
                }}
                style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  borderRadius: '12px',
                  minHeight: '48px', // iOS-recommended touch target size
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  transition: prefersReducedMotion 
                    ? 'none' 
                    : `all ${applePhysics.config.duration * 0.5}ms cubic-bezier(0.25, 0.1, 0.25, 1.0)`
                }}
              >
                {sfSymbolsSupported ? (
                  <span className="sf-symbol text-[16px]">xmark</span>
                ) : (
                  <span>✕</span>
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
    <React.Fragment>
      <div>
      {/* iOS-specific refresh indicator */}
      {renderRefreshIndicator()}
      
      {/* iOS-specific offline banner */}
      {renderOfflineBanner()}
      
      {/* iOS-specific modal overlays */}
      {renderHoldingDetailModal()}
      {renderInsightDetailModal()}
      
      <ScbBeautifulUI
        showSearchBar={true}
        pageTitle="Investments"
      >
        <div 
          ref={contentRef}
          className={`space-y-6 ${getIOSClasses()}`}
          onTouchStart={isApplePlatform ? handleTouchStart : undefined}
          onTouchMove={isApplePlatform ? handleTouchMove : undefined}
          onTouchEnd={isApplePlatform ? handleTouchEnd : undefined}
          style={{
            // Apple-style scrolling physics
            ...(isApplePlatform && {
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              // Respect safe areas for iOS devices
              paddingBottom: hasHomeIndicator ? safeAreaCss.bottom : '0px',
              // Apply pinch zoom if active for the entire container
              ...(pinchState.isActive && {
                transform: `scale(${pinchState.scale})`,
                transformOrigin: 'center',
                transition: 'none'
              })
            })
          }}
        >
            {/* Subtitle */}
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Comprehensive view of your investment assets and performance
            </p>
        
            {/* Key Metrics - Enhanced responsive layout */}
            <div className={`grid transition-all duration-300 ${
              isMultiTasking && mode === 'slide-over'
                ? 'grid-cols-1 gap-3'
                : isMultiTasking && mode === 'split-view'
                  ? 'grid-cols-1 sm:grid-cols-2 gap-4'
                : isMultiTasking && mode === 'stage-manager'
                  ? sizeClass === 'compact' ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'
                  : isIPad && !isMultiTasking
                    ? 'grid-cols-2 lg:grid-cols-4 gap-4'
                    : isIPhone
                      ? 'grid-cols-1 gap-4'
                      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'
            } ${getIOSClasses()}`}>
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
          
          {/* iOS-Optimized Performance Chart */}
          {isApplePlatform ? (
            <EnhancedIOSDataVisualization
              data={investmentPerformanceData}
              type="line"
              title="Performance vs Benchmark"
              width={containerDimensions.width}
              height={300}
              colors={['#0072AA', '#21AA47']}
              enableInteraction={true}
              enableHaptics={true}
              accessibilityLabel="Investment performance chart showing portfolio returns compared to benchmark"
              className={`${isDarkMode ? 'dark-theme' : 'light-theme'} ${prefersReducedMotion ? 'reduced-motion' : ''}`}
              onDataPointSelect={(point, index) => {
                console.log('Point selected:', point);
                haptics.selection();
              }}
              renderChart={(dimensions, interactionState, helpers) => (
                <div className={`chart-container ${interactionState.isExpanded ? 'expanded' : ''} ${
                  pinchState.isActive ? 'pinch-active' : ''
                }`}
                   style={{ 
                     transform: pinchState.isActive ? `scale(${pinchState.scale})` : 'scale(1)',
                     transition: !pinchState.isActive 
                       ? `transform ${applePhysics.config.duration}ms cubic-bezier(0.25, 0.1, 0.25, 1.0)` 
                       : 'none',
                     // iOS-style spring animation when expanded
                     ...(interactionState.isExpanded && !prefersReducedMotion && {
                       animation: `ios-spring-scale ${applePhysics.config.duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
                       transformOrigin: 'center center'
                     })
                   }}>
                  <ResponsiveContainer width="100%" height={interactionState.isExpanded ? 400 : dimensions.height}>
                    <LineChart 
                      data={investmentPerformanceData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                    >
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 
                        strokeOpacity={prefersReducedMotion ? 0.7 : 1}
                      />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280' }}
                        tickSize={8}
                        dy={10}
                      />
                      <YAxis 
                        tickFormatter={(value) => `${value}%`}
                        tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280' }}
                        width={40}
                        tickSize={8}
                        dx={-10}
                      />
                      <Tooltip 
                        formatter={(value) => `${value}%`}
                        contentStyle={{
                          borderRadius: 12,
                          backgroundColor: isDarkMode ? 'rgba(31,41,55,0.95)' : 'rgba(255,255,255,0.95)',
                          borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                          color: isDarkMode ? 'white' : 'black',
                          padding: '8px 12px',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                          backdropFilter: 'blur(8px)',
                          WebkitBackdropFilter: 'blur(8px)',
                          borderWidth: '0.5px'
                        }}
                        cursor={{ 
                          stroke: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)', 
                          strokeWidth: 1.5, 
                          strokeDasharray: '4 4' 
                        }}
                        active={interactionState.activeIndex !== null || undefined}
                        wrapperStyle={{ zIndex: 10 }}
                        position={{ y: 0 }}
                        allowEscapeViewBox={{ x: false, y: true }}
                        animationEasing={prefersReducedMotion ? "linear" : "ease-out"}
                        animationDuration={prefersReducedMotion ? 0 : 300}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="returns" 
                        name="Portfolio" 
                        stroke="#0072AA" 
                        strokeWidth={3}
                        isAnimationActive={!prefersReducedMotion}
                        animationDuration={1000}
                        animationEasing="ease-out"
                        activeDot={{ 
                          r: 6, 
                          stroke: isDarkMode ? 'rgba(0,114,170,0.8)' : '#0072AA',
                          strokeWidth: 2,
                          fill: isDarkMode ? '#1f2937' : 'white'
                        }}
                        dot={{ r: 0 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="benchmark" 
                        name="Benchmark" 
                        stroke="#21AA47" 
                        strokeWidth={2.5}
                        strokeDasharray="5 5"
                        isAnimationActive={!prefersReducedMotion}
                        animationDuration={1000}
                        animationEasing="ease-out"
                        animationBegin={300}
                        activeDot={{ 
                          r: 6, 
                          stroke: isDarkMode ? 'rgba(33,170,71,0.8)' : '#21AA47',
                          strokeWidth: 2,
                          fill: isDarkMode ? '#1f2937' : 'white'
                        }}
                        dot={{ r: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              renderLegend={(isActive) => (
                <div className={`flex justify-center gap-6 mt-2 py-2 ${
                  isActive ? 'opacity-100' : 'opacity-80'
                } transition-opacity duration-200`}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#0072AA]"></div>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Portfolio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#21AA47]"></div>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Benchmark</span>
                  </div>
                </div>
              )}
              renderCardContent={() => (
                <div className="p-4 space-y-4">
                  <h4 className={`text-base font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Portfolio Performance</h4>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Your portfolio has outperformed the benchmark by 0.7% year-to-date. The strongest performance was in March with a 3.5% increase.
                  </p>
                  <div className="flex gap-4">
                    <button 
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${
                        isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                      }`}
                      onClick={() => {
                        haptics.light();
                      }}
                    >
                      {sfSymbolsSupported ? (
                        <span className="sf-symbol text-[15px]">arrow.down.doc</span>
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      <span>Download</span>
                    </button>
                    <button 
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${
                        isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                      }`}
                      onClick={() => {
                        haptics.light();
                      }}
                    >
                      {sfSymbolsSupported ? (
                        <span className="sf-symbol text-[15px]">square.and.arrow.up</span>
                      ) : (
                        <Share2 className="h-4 w-4" />
                      )}
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              )}
            />
          ) : (
            // Standard Performance Chart for non-Apple devices
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
          )}
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
                  className={`relative overflow-hidden transition-all ${
                    isSwiping && swipeTarget === `holding-${holding.name}`
                      ? 'duration-0' // No CSS transition during active swiping
                      : `duration-${applePhysics.config.duration}`
                  }`}
                  data-swipe-id={`holding-${holding.name}`}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  style={{
                    ...(isSwiping && swipeTarget === `holding-${holding.name}` && {
                      transform: `translateX(${Math.min(touchSwipeDistance, 120)}px)`,
                      transition: 'none',
                      // Apply rubber band effect for overswipe (iOS-style physics)
                      ...(touchSwipeDistance > 120 && {
                        transform: `translateX(${120 + (touchSwipeDistance - 120) * 0.3}px)`
                      })
                    }),
                    // Smooth spring animation back to original position
                    ...(!isSwiping && swipeTarget === null && {
                      transform: 'translateX(0px)',
                      transition: `transform ${applePhysics.config.duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
                    })
                  }}
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
          <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
            <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Market Insights</h3>
            {isApplePlatform && sfSymbolsSupported && (
              <button 
                className="p-1"
                onClick={() => {
                  if (isApplePlatform) haptics.light();
                }}
              >
                <span className={`sf-symbol text-xl ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>arrow.counterclockwise</span>
              </button>
            )}
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {marketInsights.map((insight) => (
              <div 
                key={insight.id} 
                className={`relative overflow-hidden transition-all ${
                  isSwiping && swipeTarget === `insight-${insight.id}`
                    ? 'duration-0' // No CSS transition during active swiping
                    : `duration-${applePhysics.config.duration}`
                }`}
                data-swipe-id={`insight-${insight.id}`}
                onTouchStart={isApplePlatform ? handleTouchStart : undefined}
                onTouchMove={isApplePlatform ? handleTouchMove : undefined}
                onTouchEnd={isApplePlatform ? handleTouchEnd : undefined}
                style={{
                  ...(isSwiping && swipeTarget === `insight-${insight.id}` && {
                    transform: `translateX(${Math.min(touchSwipeDistance, 120)}px)`,
                    transition: 'none',
                    // Apply rubber band effect for overswipe (iOS-style physics)
                    ...(touchSwipeDistance > 120 && {
                      transform: `translateX(${120 + (touchSwipeDistance - 120) * 0.3}px)`
                    })
                  }),
                  // Smooth spring animation back to original position
                  ...(!isSwiping && swipeTarget === null && {
                    transform: 'translateX(0px)',
                    transition: `transform ${applePhysics.config.duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
                  })
                }}
              >
                <div 
                  className={`flex items-center justify-between p-4 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                  onClick={() => {
                    if (isApplePlatform) {
                      setSelectedInsight(insight);
                      setShowInsightModal(true);
                      haptics.selection();
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    {insight.urgent && (
                      <div className={`${isDarkMode ? 'bg-red-900/20' : 'bg-red-100'} p-1.5 rounded-full`}>
                        {isApplePlatform && sfSymbolsSupported ? (
                          <span className="sf-symbol text-red-500">exclamationmark.circle</span>
                        ) : (
                          <Info className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    )}
                    <div>
                      <h4 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{insight.title}</h4>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{insight.date}</p>
                    </div>
                  </div>
                  
                  {isApplePlatform ? (
                    <div className="flex items-center text-gray-400">
                      {sfSymbolsSupported ? (
                        <span className={`sf-symbol ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>chevron.right</span>
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  ) : (
                    <EnhancedTouchButton
                      variant={isDarkMode ? "dark" : "secondary"}
                      size="xs"
                    >
                      View Details
                    </EnhancedTouchButton>
                  )}
                </div>
                
                {/* Swipe action indicators - only visible during swipe */}
                <div 
                  className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-blue-500 text-white overflow-hidden"
                  style={{
                    width: isSwiping && swipeTarget === `insight-${insight.id}` ? `${touchSwipeDistance * 0.7}px` : '0',
                    opacity: isSwiping && swipeTarget === `insight-${insight.id}` ? (touchSwipeDistance > 50 ? 1 : touchSwipeDistance / 50) : 0,
                    transition: 'opacity 150ms ease-out',
                    maxWidth: '100px'
                  }}
                >
                  {sfSymbolsSupported ? (
                    <span className="sf-symbol text-white text-lg px-4">doc.text</span>
                  ) : (
                    <Info className="h-5 w-5 text-white mx-4" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScbBeautifulUI>
    </React.Fragment>
  );
}