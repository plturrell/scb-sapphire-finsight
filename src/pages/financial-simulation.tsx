import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';
import { KPICard, ChartCard, TableCard, AlertCard } from '@/components/cards';
import { TrendingUp, TrendingDown, AlertCircle, Sparkles, BarChart3, RefreshCw, Info, ChevronRight, Download, Share2, Play, Pause, RotateCcw } from 'lucide-react';
import AllocationPieChart from '@/components/charts/AllocationPieChart';
import { getGrokCompletion } from '@/lib/grok-api';
import reportService from '@/lib/report-service';
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
import IOSOptimizedLayout from '@/components/layout/IOSOptimizedLayout';
import { ICONS } from '@/components/IconSystem';
import '@/styles/ios-enhancements.css';

/**
 * Financial Simulation Page for SCB Sapphire FinSight
 * Comprehensive iOS optimizations for Monte Carlo simulation and analysis
 */

interface SimulationResults {
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  successRate: number;
  worstCase: number;
  bestCase: number;
  confidence95: { lower: number; upper: number };
  timeHorizon: number;
  scenarios: Array<{
    name: string;
    probability: number;
    return: number;
    impact: string;
  }>;
}

const FinancialSimulation: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simulationResults, setSimulationResults] = useState<SimulationResults | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeSimulationMode, setActiveSimulationMode] = useState<string>('montecarlo');
  const [timeHorizon, setTimeHorizon] = useState(10);
  const [numSimulations, setNumSimulations] = useState(10000);
  const [riskTolerance, setRiskTolerance] = useState(5);
  
  // iOS-specific state for touch interactions and gestures
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [navbarHidden, setNavbarHidden] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<any>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [touchSwipeDistance, setTouchSwipeDistance] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeTarget, setSwipeTarget] = useState<string | null>(null);
  const [pinchState, setPinchState] = useState({ scale: 1, initialDistance: 0, isActive: false });
  const [containerDimensions, setContainerDimensions] = useState({ width: 300, height: 400 });
  const [simulationProgress, setSimulationProgress] = useState(0);
  
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
  const simulationWorkerRef = useRef<Worker | null>(null);
  
  // Define device types
  const isIPad = deviceType === 'tablet' && isAppleDevice;
  const isIPhone = deviceType === 'mobile' && isAppleDevice;
  const isApplePlatform = isIPad || isIPhone;
  
  // Active tab state for the iOS tab bar
  const [activeTab, setActiveTab] = useState('analytics');
  
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
  
  // Simulation categories with role-based access
  const simulationCategories = useMemo(() => [
    {
      id: 'montecarlo',
      label: 'Monte Carlo',
      sublabel: 'Random sampling',
      icon: 'waveform.path.ecg',
      badge: numSimulations > 5000 ? '10K+' : null,
      description: 'Run thousands of scenarios to predict portfolio outcomes'
    },
    {
      id: 'scenario',
      label: 'Scenario Analysis',
      sublabel: 'What-if analysis',
      icon: 'chart.line.uptrend.xyaxis',
      badge: null,
      description: 'Test specific market conditions and their impact'
    },
    {
      id: 'stress',
      label: 'Stress Test',
      sublabel: 'Risk assessment',
      icon: 'exclamationmark.triangle.fill',
      badge: 'New',
      description: 'Evaluate portfolio resilience under extreme conditions'
    },
    {
      id: 'optimization',
      label: 'Portfolio Optimization',
      sublabel: 'Efficiency frontier',
      icon: 'slider.horizontal.3',
      badge: null,
      description: 'Find optimal asset allocation for your risk tolerance'
    },
    {
      id: 'backtesting',
      label: 'Backtesting',
      sublabel: 'Historical analysis',
      icon: 'clock.arrow.circlepath',
      badge: null,
      description: 'Test strategies against historical market data'
    }
  ], [numSimulations]);
  
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
    { label: 'Analytics', href: '/financial-simulation', icon: 'chart.bar.xaxis' }
  ];
  
  // NavBar actions
  const navBarActions = [
    {
      icon: 'slider.horizontal.3',
      label: 'Settings',
      onPress: () => {
        if (preferences.enableHaptics) haptics.light();
        setShowSettingsModal(true);
      }
    },
    {
      icon: 'square.and.arrow.up',
      label: 'Share',
      onPress: () => {
        if (preferences.enableHaptics) haptics.medium();
        handleShareResults();
      }
    }
  ];
  
  // Effect to update container dimensions for responsive charts
  useEffect(() => {
    if (!contentRef.current) return;
    
    const updateDimensions = () => {
      if (contentRef.current) {
        const rect = contentRef.current.getBoundingClientRect();
        setContainerDimensions({
          width: rect.width || 300,
          height: Math.max(rect.height || 400, 400)
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
      setTimeout(() => {
        if (contentRef.current) {
          const rect = contentRef.current.getBoundingClientRect();
          setContainerDimensions({
            width: rect.width || 300,
            height: Math.max(rect.height || 400, 400)
          });
        }
      }, 200);
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
      
      if (currentScrollY > lastScrollY + 10 && currentScrollY > 100) {
        setNavbarHidden(true);
        if (isApplePlatform) {
          haptics.light();
        }
      } else if (currentScrollY < lastScrollY - 10 || currentScrollY < 50) {
        setNavbarHidden(false);
      }
      
      setLastScrollY(currentScrollY);
      
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
        if (isApplePlatform) haptics.warning();
      } else if (online && showOfflineBanner) {
        setShowOfflineBanner(false);
        if (isApplePlatform) haptics.success();
      }
    };
    
    const getConnectionInfo = () => {
      // @ts-ignore - connection API may not be available in all browsers
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        setConnectionType(connection.effectiveType || connection.type || 'unknown');
      }
    };
    
    handleOnlineStatus();
    getConnectionInfo();
    
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
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
  
  // Initialize simulation data
  useEffect(() => {
    const initializeSimulation = async () => {
      try {
        setLoading(true);
        
        // Simulate API call to load initial data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock simulation results
        const mockResults: SimulationResults = {
          expectedReturn: 8.4,
          volatility: 12.8,
          sharpeRatio: 1.24,
          successRate: 87.3,
          worstCase: -18.5,
          bestCase: 24.7,
          confidence95: { lower: 3.2, upper: 15.8 },
          timeHorizon: 10,
          scenarios: [
            { name: 'Bull Market', probability: 35, return: 15.2, impact: 'positive' },
            { name: 'Normal Market', probability: 45, return: 8.4, impact: 'neutral' },
            { name: 'Bear Market', probability: 15, return: -5.1, impact: 'negative' },
            { name: 'Market Crash', probability: 5, return: -18.5, impact: 'severe' }
          ]
        };
        
        setSimulationResults(mockResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Error initializing simulation:', err);
      } finally {
        setLoading(false);
      }
    };
    
    initializeSimulation();
  }, []);

  // Initialize web worker for simulations
  useEffect(() => {
    if (typeof Worker !== 'undefined') {
      simulationWorkerRef.current = new Worker('/workers/monteCarloWorker.js');
      
      simulationWorkerRef.current.onmessage = (event) => {
        const { type, data, progress } = event.data;
        
        if (type === 'progress') {
          setSimulationProgress(progress);
        } else if (type === 'complete') {
          setSimulationResults(data);
          setIsRunning(false);
          setSimulationProgress(0);
          if (isApplePlatform) haptics.success();
        } else if (type === 'error') {
          setError(data.message);
          setIsRunning(false);
          setSimulationProgress(0);
          if (isApplePlatform) haptics.error();
        }
      };
      
      return () => {
        if (simulationWorkerRef.current) {
          simulationWorkerRef.current.terminate();
        }
      };
    }
  }, [isApplePlatform]);

  // Handling refresh with iOS-style feedback
  const handleRefresh = () => {
    setIsRefreshing(true);
    
    if (isApplePlatform) {
      haptics.medium();
    }
    
    setTimeout(() => {
      setIsRefreshing(false);
      
      if (isApplePlatform) {
        haptics.success();
      }
      
      // Optionally refetch data here
      window.location.reload();
    }, 1500);
  };

  // Touch event handlers for iOS-specific interactions
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isApplePlatform) return;
    
    setTouchStartY(e.touches[0].clientY);
    
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const initialDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      setPinchState({
        scale: pinchState.scale,
        initialDistance,
        isActive: true
      });
      
      haptics.light();
      e.preventDefault();
    } else {
      setIsSwiping(false);
      setTouchSwipeDistance(0);
      
      const target = e.currentTarget.getAttribute('data-swipe-id');
      if (target) {
        setSwipeTarget(target);
      }
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isApplePlatform) return;
    
    if (e.touches.length === 2 && pinchState.isActive && pinchState.initialDistance > 0) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      const newScale = (currentDistance / pinchState.initialDistance) * pinchState.scale;
      const constrainedScale = Math.min(Math.max(newScale, 0.5), 3);
      
      if (constrainedScale > 1.5 && pinchState.scale <= 1.5) haptics.light();
      if (constrainedScale > 2.0 && pinchState.scale <= 2.0) haptics.medium();
      if (constrainedScale < 1.0 && pinchState.scale >= 1.0) haptics.light();
      
      setPinchState({
        ...pinchState,
        scale: constrainedScale
      });
      
      e.preventDefault();
      return;
    }
    
    if (touchStartY === null) return;
    
    const currentY = e.touches[0].clientY;
    const diffY = touchStartY - currentY;
    const diffX = e.touches[0].clientX - e.currentTarget.getBoundingClientRect().left;
    
    if (swipeTarget && Math.abs(diffY) < 20 && diffX > 20) {
      setIsSwiping(true);
      setTouchSwipeDistance(diffX);
      
      if (diffX > 30 && diffX < 32) haptics.selection();
      if (diffX > 50 && diffX < 52) haptics.light();
      if (diffX > 75 && diffX < 77) haptics.light();
      if (diffX > 100 && diffX < 102) haptics.medium();
    }
    
    if (diffY < -50 && window.scrollY <= 0 && !isRefreshing) {
      if (diffY < -80 && diffY > -85) haptics.light();
      if (diffY < -120 && diffY > -125) haptics.medium();
      
      handleRefresh();
    }
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isApplePlatform) return;
    
    if (pinchState.isActive) {
      if (pinchState.scale > 0.85 && pinchState.scale < 1.15) {
        setPinchState({
          scale: 1,
          initialDistance: 0,
          isActive: false
        });
        haptics.light();
      } else {
        setPinchState({
          ...pinchState,
          initialDistance: 0,
          isActive: false
        });
      }
      return;
    }
    
    if (isSwiping && touchSwipeDistance > 100 && swipeTarget) {
      setTimeout(() => {
        handleSwipeAction(swipeTarget);
        haptics.success();
      }, 50);
    } else if (isSwiping) {
      setIsSwiping(false);
      setTouchSwipeDistance(0);
      haptics.selection();
    }
    
    setTouchStartY(null);
    setSwipeTarget(null);
  };
  
  // Handle swipe actions on simulation elements
  const handleSwipeAction = (itemId: string) => {
    const [itemType, itemValue] = itemId.split('-');
    
    if (itemType === 'scenario') {
      const scenario = simulationResults?.scenarios?.find(s => s.name.toLowerCase().includes(itemValue));
      if (scenario) {
        setSelectedScenario(scenario);
        setShowResultsModal(true);
      }
    } else if (itemType === 'simulation') {
      setActiveSimulationMode(itemValue);
    }
    
    setIsSwiping(false);
    setTouchSwipeDistance(0);
    setSwipeTarget(null);
  };

  // Run Monte Carlo simulation
  const runSimulation = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setSimulationProgress(0);
    
    if (isApplePlatform) {
      haptics.medium();
    }
    
    if (simulationWorkerRef.current) {
      simulationWorkerRef.current.postMessage({
        type: 'monte-carlo',
        params: {
          numSimulations,
          timeHorizon,
          riskTolerance,
          mode: activeSimulationMode
        }
      });
    } else {
      // Fallback simulation without web worker
      setTimeout(() => {
        setIsRunning(false);
        setSimulationProgress(0);
        if (isApplePlatform) haptics.success();
      }, 3000);
    }
  };

  // Handle simulation mode change
  const handleSimulationModeChange = (modeId: string) => {
    if (isApplePlatform) {
      haptics.light();
    }
    
    setActiveSimulationMode(modeId);
  };

  // Share simulation results
  const handleShareResults = async () => {
    if (!simulationResults) return;
    
    try {
      if (navigator.share && isApplePlatform) {
        await navigator.share({
          title: 'SCB Sapphire Financial Simulation Results',
          text: `Expected Return: ${simulationResults.expectedReturn}%, Risk: ${simulationResults.volatility}%, Success Rate: ${simulationResults.successRate}%`,
          url: window.location.href
        });
        
        if (isApplePlatform) haptics.success();
      } else {
        // Fallback for non-native sharing
        navigator.clipboard.writeText(`SCB Sapphire Financial Simulation Results:\nExpected Return: ${simulationResults.expectedReturn}%\nRisk: ${simulationResults.volatility}%\nSuccess Rate: ${simulationResults.successRate}%`);
        
        if (isApplePlatform) haptics.light();
      }
    } catch (error) {
      console.error('Error sharing results:', error);
      if (isApplePlatform) haptics.error();
    }
  };

  // Export simulation report
  const handleExportReport = async () => {
    if (!simulationResults) return;
    
    try {
      if (isApplePlatform) haptics.medium();
      
      const report = await reportService.generateSimulationReport(simulationResults);
      
      // Create download link
      const blob = new Blob([report], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `SCB-Sapphire-Simulation-${new Date().toISOString().split('T')[0]}.pdf`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      if (isApplePlatform) haptics.success();
    } catch (error) {
      console.error('Error exporting report:', error);
      if (isApplePlatform) haptics.error();
    }
  };

  // Handle tab changes
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    const selectedTab = tabItems.find(item => item.key === key);
    if (selectedTab && selectedTab.href) {
      router.push(selectedTab.href);
    }
  };

  const { isDarkMode, preferences } = useUIPreferences();
  const { haptic } = useMicroInteractions();
  
  // Memoize simulation data
  const simulationData = useMemo(() => ({
    results: simulationResults,
    isRunning,
    progress: simulationProgress,
    mode: activeSimulationMode
  }), [simulationResults, isRunning, simulationProgress, activeSimulationMode]);

  // iOS-style offline banner
  const renderOfflineBanner = () => {
    if (!showOfflineBanner || !isApplePlatform) return null;
    
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
              <p className="text-xs opacity-75">Simulation data cached</p>
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

  // iOS-style refresh indicator
  const renderRefreshIndicator = () => {
    if (!isRefreshing || !isApplePlatform) return null;
    
    const topOffset = hasDynamicIsland ? '72px' : '50px';
    
    return (
      <div 
        className="fixed top-0 left-0 right-0 flex justify-center z-40 pointer-events-none"
        style={{ 
          paddingTop: topOffset,
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

  // iOS-style simulation results modal
  const renderResultsModal = () => {
    if (!showResultsModal || !selectedScenario) return null;
    
    return (
      <div 
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
        onClick={() => {
          setShowResultsModal(false);
          if (isApplePlatform) haptics.light();
        }}
        style={{
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
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
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            ...(hasDynamicIsland && {
              maxHeight: 'calc(100vh - 100px)'
            })
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto my-3" />
          
          <div className="px-5 pt-4 pb-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center mb-2">
              <div className={`mr-3 p-2 rounded-full ${
                selectedScenario.impact === 'positive' ? 'bg-green-100 dark:bg-green-900/30' :
                selectedScenario.impact === 'negative' ? 'bg-red-100 dark:bg-red-900/30' :
                selectedScenario.impact === 'severe' ? 'bg-red-100 dark:bg-red-900/30' :
                'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                {sfSymbolsSupported ? (
                  <span className={`sf-symbol text-lg ${
                    selectedScenario.impact === 'positive' ? 'text-green-600 dark:text-green-400' :
                    selectedScenario.impact === 'negative' ? 'text-red-600 dark:text-red-400' :
                    selectedScenario.impact === 'severe' ? 'text-red-600 dark:text-red-400' :
                    'text-blue-600 dark:text-blue-400'
                  }`}>
                    {selectedScenario.impact === 'positive' ? 'arrow.up.circle.fill' :
                     selectedScenario.impact === 'negative' ? 'arrow.down.circle.fill' :
                     selectedScenario.impact === 'severe' ? 'exclamationmark.triangle.fill' :
                     'minus.circle.fill'}
                  </span>
                ) : (
                  <BarChart3 className={`h-5 w-5 ${
                    selectedScenario.impact === 'positive' ? 'text-green-600 dark:text-green-400' :
                    selectedScenario.impact === 'negative' ? 'text-red-600 dark:text-red-400' :
                    selectedScenario.impact === 'severe' ? 'text-red-600 dark:text-red-400' :
                    'text-blue-600 dark:text-blue-400'
                  }`} />
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {selectedScenario.name}
              </h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Scenario analysis and impact assessment
            </p>
          </div>
          
          <div className="px-5 py-4">
            <div className="space-y-6">
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-blue-800/20' : 'bg-blue-50'}`}>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Expected Return</p>
                <p className={`text-3xl font-bold ${
                  selectedScenario.return >= 0 
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {selectedScenario.return >= 0 ? '+' : ''}{selectedScenario.return.toFixed(1)}%
                </p>
                <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                  {selectedScenario.probability}% probability of occurrence
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Impact Level</p>
                  <p className="text-lg font-semibold capitalize text-gray-900 dark:text-white">
                    {selectedScenario.impact}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Confidence</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedScenario.probability >= 30 ? 'High' : selectedScenario.probability >= 15 ? 'Medium' : 'Low'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              <button 
                className={`w-full px-4 py-3 text-white rounded-lg flex items-center justify-center space-x-2 ${
                  isDarkMode ? 'bg-blue-600' : 'bg-blue-600'
                } active:scale-95 transition-transform duration-100`}
                onClick={() => {
                  if (isApplePlatform) haptics.medium();
                  setShowResultsModal(false);
                }}
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  borderRadius: '12px',
                  minHeight: '48px',
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
                  <BarChart3 className="h-4 w-4" />
                )}
                <span>View Full Analysis</span>
              </button>
              <button 
                className={`w-full px-4 py-3 rounded-lg flex items-center justify-center space-x-2 ${
                  isDarkMode 
                    ? 'bg-gray-800 text-white border border-gray-700'
                    : 'bg-white text-gray-800 border border-gray-300'
                } active:scale-95 transition-transform duration-100`}
                onClick={() => {
                  if (isApplePlatform) haptics.light();
                  setShowResultsModal(false);
                }}
                style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  borderRadius: '12px',
                  minHeight: '48px',
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

  // iOS-style settings modal
  const renderSettingsModal = () => {
    if (!showSettingsModal) return null;
    
    return (
      <div 
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
        onClick={() => {
          setShowSettingsModal(false);
          if (isApplePlatform) haptics.light();
        }}
        style={{
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
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
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            ...(hasDynamicIsland && {
              maxHeight: 'calc(100vh - 100px)'
            })
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto my-3" />
          
          <div className="px-5 pt-4 pb-6 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Simulation Settings
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Configure simulation parameters
            </p>
          </div>
          
          <div className="px-5 py-4">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Time Horizon: {timeHorizon} years
                </label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={timeHorizon}
                  onChange={(e) => setTimeHorizon(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Simulations: {numSimulations.toLocaleString()}
                </label>
                <input
                  type="range"
                  min="1000"
                  max="50000"
                  step="1000"
                  value={numSimulations}
                  onChange={(e) => setNumSimulations(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Risk Tolerance: {riskTolerance}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={riskTolerance}
                  onChange={(e) => setRiskTolerance(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              <button 
                className={`w-full px-4 py-3 text-white rounded-lg flex items-center justify-center space-x-2 ${
                  isDarkMode ? 'bg-blue-600' : 'bg-blue-600'
                } active:scale-95 transition-transform duration-100`}
                onClick={() => {
                  if (isApplePlatform) haptics.medium();
                  setShowSettingsModal(false);
                }}
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  borderRadius: '12px',
                  minHeight: '48px',
                  transition: prefersReducedMotion 
                    ? 'none' 
                    : `all ${applePhysics.config.duration * 0.5}ms cubic-bezier(0.25, 0.1, 0.25, 1.0)`
                }}
              >
                {sfSymbolsSupported ? (
                  <span className="sf-symbol text-white text-[16px]">checkmark</span>
                ) : (
                  <span>✓</span>
                )}
                <span>Apply Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Financial Simulation | SCB Sapphire FinSight</title>
        <meta name="description" content="Advanced Monte Carlo financial simulation and portfolio analysis" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      
      {/* iOS-specific refresh indicator */}
      {renderRefreshIndicator()}
      
      {/* iOS-specific offline banner */}
      {renderOfflineBanner()}
      
      {/* iOS-specific modal overlays */}
      {renderResultsModal()}
      {renderSettingsModal()}

      {isAppleDevice ? (
        <IOSOptimizedLayout
          title="Financial Simulation"
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
          {/* Simulation Type Selector */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Simulation Type
            </h2>
            <div 
              className={`grid transition-all duration-300 ${
                isMultiTasking && mode === 'slide-over'
                  ? 'grid-cols-1 gap-3'
                  : isMultiTasking && mode === 'split-view'
                    ? 'grid-cols-2 gap-3'
                  : isMultiTasking && mode === 'stage-manager'
                    ? sizeClass === 'compact' ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-3'
                    : isIPad && !isMultiTasking
                      ? 'grid-cols-2 lg:grid-cols-3 gap-4'
                      : isIPhone
                        ? 'grid-cols-1 gap-4'
                        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
              } ${getIOSClasses()}`}
            >
              {simulationCategories.map((category) => (
                <div
                  key={category.id}
                  className={`relative overflow-hidden transition-all ${
                    isSwiping && swipeTarget === `simulation-${category.id}`
                      ? 'duration-0'
                      : `duration-${applePhysics.config.duration}`
                  }`}
                  data-swipe-id={`simulation-${category.id}`}
                  onTouchStart={isApplePlatform ? handleTouchStart : undefined}
                  onTouchMove={isApplePlatform ? handleTouchMove : undefined}
                  onTouchEnd={isApplePlatform ? handleTouchEnd : undefined}
                  style={{
                    ...(isSwiping && swipeTarget === `simulation-${category.id}` && {
                      transform: `translateX(${Math.min(touchSwipeDistance, 120)}px)`,
                      transition: 'none',
                      ...(touchSwipeDistance > 120 && {
                        transform: `translateX(${120 + (touchSwipeDistance - 120) * 0.3}px)`
                      })
                    }),
                    ...(!isSwiping && swipeTarget === null && {
                      transform: 'translateX(0px)',
                      transition: `transform ${applePhysics.config.duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
                    })
                  }}
                  onClick={() => {
                    handleSimulationModeChange(category.id);
                    if (isApplePlatform) haptics.selection();
                  }}
                >
                  <div
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      activeSimulationMode === category.id
                        ? isDarkMode
                          ? 'bg-blue-900/30 border-blue-600'
                          : 'bg-blue-50 border-blue-300'
                        : isDarkMode
                          ? 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                    style={{
                      borderRadius: '12px',
                      transition: prefersReducedMotion 
                        ? 'none' 
                        : `all ${applePhysics.config.duration}ms cubic-bezier(0.25, 0.1, 0.25, 1.0)`
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2 rounded-lg ${
                        activeSimulationMode === category.id
                          ? 'bg-blue-600'
                          : isDarkMode
                            ? 'bg-gray-700'
                            : 'bg-gray-100'
                      }`}>
                        {sfSymbolsSupported ? (
                          <span 
                            className={`sf-symbol text-lg ${
                              activeSimulationMode === category.id 
                                ? 'text-white' 
                                : isDarkMode 
                                  ? 'text-gray-300' 
                                  : 'text-gray-600'
                            }`}
                          >
                            {category.icon}
                          </span>
                        ) : (
                          <BarChart3 className={`h-5 w-5 ${
                            activeSimulationMode === category.id 
                              ? 'text-white' 
                              : isDarkMode 
                                ? 'text-gray-300' 
                                : 'text-gray-600'
                          }`} />
                        )}
                      </div>
                      {category.badge && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          {category.badge}
                        </span>
                      )}
                    </div>
                    <h3 className={`font-semibold mb-1 ${
                      activeSimulationMode === category.id
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {category.label}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {category.sublabel}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {category.description}
                    </p>
                  </div>
                  
                  {/* Swipe action indicator */}
                  <div 
                    className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-blue-500 text-white overflow-hidden rounded-r-xl"
                    style={{
                      width: isSwiping && swipeTarget === `simulation-${category.id}` ? `${touchSwipeDistance * 0.7}px` : '0',
                      opacity: isSwiping && swipeTarget === `simulation-${category.id}` ? (touchSwipeDistance > 50 ? 1 : touchSwipeDistance / 50) : 0,
                      transition: 'opacity 150ms ease-out',
                      maxWidth: '100px',
                      borderRadius: '0 12px 12px 0'
                    }}
                  >
                    {sfSymbolsSupported ? (
                      <span className="sf-symbol text-white text-lg px-4">play.fill</span>
                    ) : (
                      <Play className="h-5 w-5 text-white mx-4" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Simulation Controls */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Run Simulation
              </h2>
              {isRunning && (
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                    style={{
                      animation: prefersReducedMotion 
                        ? 'none' 
                        : `pulse ${applePhysics.config.duration}ms ease-in-out infinite`
                    }}
                  />
                  <span className="text-sm text-blue-600 dark:text-blue-400">
                    Running... {simulationProgress}%
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-3">
              <EnhancedTouchButton
                variant={isRunning ? 'secondary' : 'primary'}
                size="lg"
                onClick={runSimulation}
                disabled={isRunning}
                icon={sfSymbolsSupported ? (isRunning ? 'pause.fill' : 'play.fill') : undefined}
                hapticFeedback="medium"
                className="flex-1 min-w-[120px]"
              >
                {isRunning ? 'Running...' : 'Run Simulation'}
              </EnhancedTouchButton>
              
              <EnhancedTouchButton
                variant="secondary"
                size="lg"
                onClick={() => setShowSettingsModal(true)}
                icon={sfSymbolsSupported ? 'slider.horizontal.3' : undefined}
                hapticFeedback="light"
              >
                Settings
              </EnhancedTouchButton>
              
              {simulationResults && (
                <EnhancedTouchButton
                  variant="success"
                  size="lg"
                  onClick={handleExportReport}
                  icon={sfSymbolsSupported ? 'square.and.arrow.down' : undefined}
                  hapticFeedback="medium"
                >
                  Export
                </EnhancedTouchButton>
              )}
            </div>
          </div>

          {/* Loading state with iOS-style animation */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div 
                aria-label="Loading simulation data" 
                role="status" 
                className="inline-block h-10 w-10 rounded-full border-4 border-solid border-[rgb(var(--scb-honolulu-blue))] border-r-transparent mb-4"
                style={{
                  animation: prefersReducedMotion 
                    ? 'none' 
                    : `spin ${applePhysics.config.duration * 2}ms linear infinite`
                }}
              />
              <p className="scb-data-label text-[rgb(var(--scb-honolulu-blue))]">Loading simulation data...</p>
            </div>
          )}

          {/* Simulation Results */}
          {!loading && !error && simulationResults && (
            <>
              {/* KPI Cards for Results */}
              <div 
                ref={contentRef}
                className={`grid transition-all duration-300 mb-6 ${
                  isMultiTasking && mode === 'slide-over'
                    ? 'grid-cols-1 gap-3'
                    : isMultiTasking && mode === 'split-view'
                      ? 'grid-cols-1 sm:grid-cols-2 gap-4'
                    : isMultiTasking && mode === 'stage-manager'
                      ? sizeClass === 'compact' ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'
                      : isIPad && !isMultiTasking
                        ? 'grid-cols-2 lg:grid-cols-4 gap-4'
                        : isIPhone
                          ? 'grid-cols-2 gap-3'
                          : 'grid-cols-2 lg:grid-cols-4 gap-4'
                } ${getIOSClasses()}`}
                onTouchStart={isApplePlatform ? handleTouchStart : undefined}
                onTouchMove={isApplePlatform ? handleTouchMove : undefined}
                onTouchEnd={isApplePlatform ? handleTouchEnd : undefined}
                style={{
                  ...(isApplePlatform && {
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehavior: 'contain',
                    paddingBottom: hasHomeIndicator ? safeAreaCss.bottom : '0px',
                    ...(pinchState.isActive && {
                      transform: `scale(${pinchState.scale})`,
                      transformOrigin: 'center',
                      transition: 'none'
                    })
                  })
                }}
              >
                <KPICard
                  title="Expected Return"
                  value={simulationResults.expectedReturn}
                  valueSuffix="%"
                  percentChange={2.3}
                  trendDirection="up"
                  details="Annualized expected return"
                />
                
                <KPICard
                  title="Risk (Volatility)"
                  value={simulationResults.volatility}
                  valueSuffix="%"
                  percentChange={-1.2}
                  trendDirection="down"
                  details="Annual volatility measure"
                />
                
                <KPICard
                  title="Sharpe Ratio"
                  value={simulationResults.sharpeRatio}
                  percentChange={0.1}
                  trendDirection="up"
                  details="Risk-adjusted return"
                />
                
                <KPICard
                  title="Success Rate"
                  value={simulationResults.successRate}
                  valueSuffix="%"
                  percentChange={5.4}
                  trendDirection="up"
                  details="Probability of positive returns"
                />
              </div>

              {/* Scenario Analysis */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Scenario Analysis
                </h2>
                <div className="space-y-3">
                  {simulationResults.scenarios.map((scenario, index) => (
                    <div
                      key={index}
                      className={`relative overflow-hidden transition-all ${
                        isSwiping && swipeTarget === `scenario-${scenario.name.toLowerCase().replace(' ', '')}`
                          ? 'duration-0'
                          : `duration-${applePhysics.config.duration}`
                      }`}
                      data-swipe-id={`scenario-${scenario.name.toLowerCase().replace(' ', '')}`}
                      onTouchStart={isApplePlatform ? handleTouchStart : undefined}
                      onTouchMove={isApplePlatform ? handleTouchMove : undefined}
                      onTouchEnd={isApplePlatform ? handleTouchEnd : undefined}
                      style={{
                        ...(isSwiping && swipeTarget === `scenario-${scenario.name.toLowerCase().replace(' ', '')}` && {
                          transform: `translateX(${Math.min(touchSwipeDistance, 120)}px)`,
                          transition: 'none',
                          ...(touchSwipeDistance > 120 && {
                            transform: `translateX(${120 + (touchSwipeDistance - 120) * 0.3}px)`
                          })
                        }),
                        ...(!isSwiping && swipeTarget === null && {
                          transform: 'translateX(0px)',
                          transition: `transform ${applePhysics.config.duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
                        })
                      }}
                      onClick={() => {
                        if (isApplePlatform) {
                          setSelectedScenario(scenario);
                          setShowResultsModal(true);
                          haptics.selection();
                        }
                      }}
                    >
                      <div
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          isDarkMode
                            ? 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                        style={{
                          borderRadius: '12px',
                          transition: prefersReducedMotion 
                            ? 'none' 
                            : `all ${applePhysics.config.duration}ms cubic-bezier(0.25, 0.1, 0.25, 1.0)`
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              scenario.impact === 'positive' ? 'bg-green-500' :
                              scenario.impact === 'negative' ? 'bg-red-500' :
                              scenario.impact === 'severe' ? 'bg-red-600' :
                              'bg-blue-500'
                            }`} />
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {scenario.name}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {scenario.probability}% probability
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${
                              scenario.return >= 0 
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {scenario.return >= 0 ? '+' : ''}{scenario.return.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Swipe action indicator */}
                      <div 
                        className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-blue-500 text-white overflow-hidden rounded-r-xl"
                        style={{
                          width: isSwiping && swipeTarget === `scenario-${scenario.name.toLowerCase().replace(' ', '')}` ? `${touchSwipeDistance * 0.7}px` : '0',
                          opacity: isSwiping && swipeTarget === `scenario-${scenario.name.toLowerCase().replace(' ', '')}` ? (touchSwipeDistance > 50 ? 1 : touchSwipeDistance / 50) : 0,
                          transition: 'opacity 150ms ease-out',
                          maxWidth: '100px',
                          borderRadius: '0 12px 12px 0'
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
              </div>

              {/* Chart Visualization Placeholder */}
              <div className="mb-6">
                <ChartCard 
                  title="Monte Carlo Distribution"
                  subtitle="Probability distribution of returns"
                  expandable
                  exportable
                >
                  <div 
                    className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    style={{
                      transform: pinchState.isActive ? `scale(${pinchState.scale})` : 'scale(1)',
                      transition: !pinchState.isActive ? `transform ${applePhysics.config.duration}ms cubic-bezier(0.25, 0.1, 0.25, 1.0)` : 'none'
                    }}
                  >
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Monte Carlo distribution visualization would appear here
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        Based on {numSimulations.toLocaleString()} simulations
                      </p>
                    </div>
                  </div>
                </ChartCard>
              </div>
            </>
          )}

          {/* Error State */}
          {error && (
            <AlertCard
              title=""
              type="error"
              message="Simulation Error"
              details={error}
              timestamp={new Date().toLocaleString()}
              actionable
              actionLabel="Retry"
              onAction={() => {
                setError(null);
                runSimulation();
              }}
              dismissible
            />
          )}
        </IOSOptimizedLayout>
      ) : (
        <ScbBeautifulUI 
          pageTitle="Financial Simulation"
          showNewsBar={preferences.enableNewsBar}
        >
          {/* Non-iOS content - same structure but without iOS-specific enhancements */}
          <div className="min-h-screen pb-16">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Financial Simulation
              </h1>
              
              {/* Same content as iOS version but without touch interactions */}
              {/* ... content implementation ... */}
            </div>
          </div>
        </ScbBeautifulUI>
      )}
    </>
  );
};

export default FinancialSimulation;