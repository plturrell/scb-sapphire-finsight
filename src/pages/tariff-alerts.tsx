import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';
import TariffAlertList from '../components/TariffAlertList';
import EnhancedTariffAlertList from '../components/EnhancedTariffAlertList';
import TariffAlertFilters from '../components/TariffAlertFilters';
import TariffImpactVisualization from '../components/TariffImpactVisualization';
import { OntologyManager } from '../services/OntologyManager';
import { WebSearchService } from '../services/WebSearchService';
import NotificationDispatcher from '../services/NotificationDispatcher';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import TariffImpactSimulator from '../services/TariffImpactSimulator';
import TariffService from '../services/TariffService';
import { TariffAlert, TariffChange, SankeyData } from '../types';
import { RefreshCw, Filter, Search, AlertTriangle, Info, Download, Share2, Bell, Globe } from 'lucide-react';

// Apple platform optimization hooks
import { useIOS, useMediaQuery } from '../hooks/useResponsive';
import { useDeviceCapabilities } from '../hooks/useDeviceCapabilities';
import { useMicroInteractions } from '../hooks/useMicroInteractions';
import EnhancedTouchButton from '../components/EnhancedTouchButton';
import { useSFSymbolsSupport } from '@/lib/sf-symbols';

// Mock data for initial development
import { mockTariffAlerts } from '../mock/tariffAlerts';

const TariffAlertsDashboard: NextPage = () => {
  const [alerts, setAlerts] = useState<TariffAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<TariffAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [sankeyData, setSankeyData] = useState<SankeyData | null>(null);
  const [simulationInProgress, setSimulationInProgress] = useState(false);
  const [activeTariffCategory, setActiveTariffCategory] = useState('all');
  
  // Platform detection and UI enhancement hooks
  const isAppleDevice = useIOS();
  const [isPlatformDetected, setIsPlatformDetected] = useState(false);
  const { haptic } = useMicroInteractions();
  const { touchCapable } = useDeviceCapabilities();
  const { supported: sfSymbolsSupported } = useSFSymbolsSupport();
  
  // Tariff alert categories with SF Symbols
  const tariffCategories = [
    { id: 'all', label: 'All Alerts', icon: 'exclamationmark.triangle.fill', badge: alerts.length.toString() },
    { id: 'import', label: 'Import', icon: 'arrow.down.doc.fill', badge: alerts.filter(a => a.type === 'import').length.toString() },
    { id: 'export', label: 'Export', icon: 'arrow.up.doc.fill', badge: alerts.filter(a => a.type === 'export').length.toString() },
    { id: 'trade', label: 'Trade', icon: 'bag.fill', badge: alerts.filter(a => a.type === 'trade').length.toString() },
    { id: 'regulation', label: 'Regulation', icon: 'building.2.fill', badge: alerts.filter(a => a.type === 'regulation').length.toString() },
    { id: 'commodity', label: 'Commodity', icon: 'cart.fill', badge: alerts.filter(a => a.type === 'commodity').length.toString() },
    { id: 'watchlist', label: 'Watchlist', icon: 'eye.fill', badge: '2' }
  ];
  
  // Multi-tasking mode detection for iPad
  const [isMultiTasking, setIsMultiTasking] = useState(false);
  const [mode, setMode] = useState<'full' | 'split-view' | 'slide-over'>('full');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  
  // Detect multi-tasking mode on iPad
  useEffect(() => {
    const checkMultiTaskingMode = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Set orientation
      setOrientation(width > height ? 'landscape' : 'portrait');
      
      // Typical iPad sizes in various modes (approximate)
      if (isAppleDevice) {
        // Detect if we're in multi-tasking mode
        if (width < 768 && width > 320) {
          setIsMultiTasking(true);
          setMode(width < 400 ? 'slide-over' : 'split-view');
        } else {
          setIsMultiTasking(false);
          setMode('full');
        }
      } else {
        setIsMultiTasking(false);
        setMode('full');
      }
    };
    
    // Run once immediately
    setIsPlatformDetected(true);
    checkMultiTaskingMode();
    
    // Add event listeners for changes
    window.addEventListener('resize', checkMultiTaskingMode);
    window.addEventListener('orientationchange', checkMultiTaskingMode);
    
    return () => {
      window.removeEventListener('resize', checkMultiTaskingMode);
      window.removeEventListener('orientationchange', checkMultiTaskingMode);
    };
  }, [isAppleDevice]);
  
  // Initialize services
  useEffect(() => {
    const fetchTariffAlerts = async () => {
      try {
        setIsLoading(true);
        
        // Fetch tariff alerts using the TariffService
        const result = await TariffService.getTariffAlerts();
        
        // Set the alert data
        setAlerts(result.data);
        setFilteredAlerts(result.data);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch tariff alerts:', error);
        
        // Fall back to mock data if API fails
        if (mockTariffAlerts.length > 0) {
          setAlerts(mockTariffAlerts);
          setFilteredAlerts(mockTariffAlerts);
        }
        
        setIsLoading(false);
      }
    };
    
    fetchTariffAlerts();
    
    // Initialize WebSocket for real-time updates
    const ws = NotificationDispatcher.initializeWebSocket();
    
    // Event listener for tariff alerts from the notification system
    const handleTariffAlerts = (event: CustomEvent) => {
      const newAlerts = event.detail;
      if (Array.isArray(newAlerts) && newAlerts.length > 0) {
        setAlerts(prevAlerts => {
          // Merge new alerts
          const combined = [...prevAlerts];
          newAlerts.forEach(newAlert => {
            const existingIndex = combined.findIndex(a => a.id === newAlert.id);
            if (existingIndex >= 0) {
              combined[existingIndex] = newAlert;
            } else {
              combined.push(newAlert);
            }
          });
          return combined;
        });
      }
    };
    
    window.addEventListener('tariff-alerts', handleTariffAlerts as EventListener);
    
    return () => {
      window.removeEventListener('tariff-alerts', handleTariffAlerts as EventListener);
      if (ws) ws.close();
    };
  }, []);
  
  // Filter alerts when filters or search query changes
  useEffect(() => {
    const filterAlerts = () => {
      let filtered = [...alerts];
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(alert => 
          alert.title.toLowerCase().includes(query) || 
          alert.description.toLowerCase().includes(query) ||
          alert.country.toLowerCase().includes(query)
        );
      }
      
      // Filter by selected countries
      if (selectedCountries.length > 0) {
        filtered = filtered.filter(alert => 
          selectedCountries.includes(alert.country)
        );
      }
      
      // Filter by selected priorities
      if (selectedPriorities.length > 0) {
        filtered = filtered.filter(alert => 
          selectedPriorities.includes(alert.priority)
        );
      }
      
      setFilteredAlerts(filtered);
    };
    
    filterAlerts();
  }, [alerts, searchQuery, selectedCountries, selectedPriorities]);
  
  const runImpactSimulation = async () => {
    try {
      // Provide haptic feedback on Apple devices
      if (isAppleDevice) {
        haptic({ intensity: 'medium' });
      }
      
      setSimulationInProgress(true);
      
      // In a real implementation, this would call the service
      // const ontologyManager = new OntologyManager();
      // await ontologyManager.loadOntology();
      // const simulator = new TariffImpactSimulator(ontologyManager);
      // const results = await simulator.runSimulation();
      // const sankeyData = simulator.generateSankeyData();
      
      // For demo purposes, simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock Sankey data
      setSankeyData({
        nodes: [
          { name: "Singapore", group: "country" },
          { name: "Malaysia", group: "country" },
          { name: "Vietnam", group: "country" },
          { name: "Electronics", group: "product" },
          { name: "Textiles", group: "product" },
          { name: "Automotive", group: "product" },
          { name: "FTA", group: "policy" },
          { name: "Protectionist", group: "policy" },
          { name: "WTO Rules", group: "policy" }
        ],
        links: [
          { source: 0, target: 3, value: 20, uiColor: "rgba(0, 114, 170, 0.6)", aiEnhanced: true },
          { source: 0, target: 4, value: 15, uiColor: "rgba(0, 114, 170, 0.6)" },
          { source: 1, target: 4, value: 25, uiColor: "rgba(0, 114, 170, 0.6)" },
          { source: 1, target: 5, value: 18, uiColor: "rgba(0, 114, 170, 0.6)", aiEnhanced: true },
          { source: 2, target: 3, value: 22, uiColor: "rgba(0, 114, 170, 0.6)" },
          { source: 2, target: 5, value: 12, uiColor: "rgba(0, 114, 170, 0.6)" },
          { source: 3, target: 6, value: 15, uiColor: "rgba(33, 170, 71, 0.6)" },
          { source: 3, target: 8, value: 5, uiColor: "rgba(33, 170, 71, 0.6)" },
          { source: 4, target: 7, value: 20, uiColor: "rgba(33, 170, 71, 0.6)", aiEnhanced: true },
          { source: 5, target: 6, value: 13, uiColor: "rgba(33, 170, 71, 0.6)" },
          { source: 5, target: 7, value: 8, uiColor: "rgba(33, 170, 71, 0.6)" }
        ],
        aiInsights: {
          summary: "AI-enhanced analysis of tariff impacts across ASEAN countries.",
          recommendations: [
            "Monitor changes in Vietnam's electronics tariffs in response to regional tensions.",
            "Consider diversifying textile suppliers beyond Malaysia to mitigate risk.",
            "Prepare contingency plans for automotive supply chain disruptions."
          ],
          confidence: 0.85,
          updatedAt: new Date()
        }
      });
      
      // Success haptic feedback
      if (isAppleDevice) {
        haptic({ intensity: 'light' });
      }
      
      setSimulationInProgress(false);
    } catch (error) {
      console.error('Failed to run impact simulation:', error);
      setSimulationInProgress(false);
      
      // Error haptic feedback
      if (isAppleDevice) {
        haptic({ intensity: 'heavy' });
      }
    }
  };
  
  const refreshAlerts = async () => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptic({ intensity: 'light' });
    }
    
    setIsLoading(true);
    
    try {
      // Use TariffService to refresh alerts (with cache busting)
      const result = await TariffService.refreshTariffAlerts();
      
      setAlerts(result.data);
      // Filters will be reapplied automatically thanks to the useEffect
    } catch (error) {
      console.error('Failed to refresh tariff alerts:', error);
      
      // If refresh fails and we don't have any alerts yet, use mock data
      if (alerts.length === 0 && mockTariffAlerts.length > 0) {
        setAlerts(mockTariffAlerts);
      }
      
      // Show a user-friendly error toast or notification here
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleShareClick = () => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptic({ intensity: 'medium' });
    }
    
    // Implement share functionality (e.g., open share sheet on iOS)
    alert('Sharing analysis results...');
  };
  
  const handleExportClick = () => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptic({ intensity: 'medium' });
    }
    
    // Implement export functionality
    alert('Exporting analysis results...');
  };
  
  const handleAlertClick = (alert: TariffAlert) => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptic({ intensity: 'light' });
    }
    
    // Handle alert click
    console.log('Alert clicked:', alert);
  };
  
  // Handle tariff category selection
  const handleCategorySelect = (categoryId: string) => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptic({ intensity: 'light' });
    }
    
    setActiveTariffCategory(categoryId);
    
    // Filter alerts by category
    if (categoryId === 'all') {
      // Reset to show all alerts
      const filtered = [...alerts];
      applyCurrentFilters(filtered);
    } else {
      // Filter alerts by the selected category
      const filtered = alerts.filter(alert => alert.type === categoryId);
      applyCurrentFilters(filtered);
    }
  };
  
  // Helper function to apply current filters (search, countries, priorities)
  const applyCurrentFilters = (alertsToFilter: TariffAlert[]) => {
    let filtered = [...alertsToFilter];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(alert => 
        alert.title.toLowerCase().includes(query) || 
        alert.description.toLowerCase().includes(query) ||
        alert.country.toLowerCase().includes(query)
      );
    }
    
    // Apply country filter
    if (selectedCountries.length > 0) {
      filtered = filtered.filter(alert => 
        selectedCountries.includes(alert.country)
      );
    }
    
    // Apply priority filter
    if (selectedPriorities.length > 0) {
      filtered = filtered.filter(alert => 
        selectedPriorities.includes(alert.priority)
      );
    }
    
    setFilteredAlerts(filtered);
  };
  
  // SF Symbols Tariff Categories Navigation component
  const SFSymbolsTariffNavigation = () => {
    if (!isAppleDevice || !isPlatformDetected || !sfSymbolsSupported) {
      return null;
    }
    
    return (
      <div className={`rounded-lg overflow-x-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-[rgb(var(--scb-border))]'} p-1 mb-4`}>
        <div className="flex items-center overflow-x-auto hide-scrollbar pb-1">
          {tariffCategories.map((category) => (
            <button 
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              className={`
                flex flex-col items-center justify-center p-2 min-w-[72px] rounded-lg transition-colors
                ${activeTariffCategory === category.id
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
                    ${isDarkMode ? 'bg-red-600' : 'bg-red-500'}
                  `}>
                    {category.badge}
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
  
  const { isDarkMode } = useUIPreferences();
  
  return (
    <>
      <Head>
        <title>Tariff Alert Scanner | SCB Sapphire FinSight</title>
        <meta name="description" content="Monitor and analyze tariff changes affecting your supply chain" />
      </Head>
      
      <ScbBeautifulUI 
        showNewsBar={!isMultiTasking} 
        pageTitle="Tariff Alert Scanner" 
        showTabs={isAppleDevice}
      >
        <div className={`space-y-6 ${isMultiTasking && mode === 'slide-over' ? 'px-2' : ''}`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Globe className={`text-[rgb(var(--scb-primary))] ${isMultiTasking && mode === 'slide-over' ? 'w-5 h-5' : 'w-6 h-6'}`} />
                <h1 className={`font-semibold text-[rgb(var(--scb-primary))] ${isMultiTasking && mode === 'slide-over' ? 'text-lg' : 'text-2xl'}`}>
                  Tariff Alert Scanner
                </h1>
              </div>
              <p className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'}`}>
                Monitor and analyze tariff changes affecting your global supply chain
              </p>
            </div>
            
            {/* SF Symbols Tariff Categories Navigation */}
            {isAppleDevice && isPlatformDetected && sfSymbolsSupported && (
              <SFSymbolsTariffNavigation />
            )}
            
            {/* Platform-specific action buttons */}
            {isAppleDevice && isPlatformDetected ? (
              <div className={`flex items-center ${isMultiTasking && mode === 'slide-over' ? 'gap-2' : 'gap-3'}`}>
                <EnhancedTouchButton
                  onClick={handleShareClick}
                  variant="secondary"
                  className="flex items-center gap-1"
                  size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                >
                  <Share2 className={`${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  <span>Share</span>
                </EnhancedTouchButton>
                
                <EnhancedTouchButton
                  onClick={handleExportClick}
                  variant="secondary"
                  className="flex items-center gap-1"
                  size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                >
                  <Download className={`${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  <span>Export</span>
                </EnhancedTouchButton>
              </div>
            ) : null}
          </div>
          
          <div className={`grid grid-cols-1 ${isMultiTasking && mode === 'slide-over' ? 'gap-3' : 'lg:grid-cols-3 gap-6'}`}>
            {/* Left panel - Filters & Alerts */}
            <div className={`${isMultiTasking && mode === 'slide-over' ? '' : 'col-span-1'} space-y-4`}>
              {/* Search & Filters */}
              <div className="bg-white dark:bg-[rgb(var(--scb-dark-background))] rounded-lg shadow-sm border border-[rgb(var(--scb-border))]">
                <div className="px-4 py-3 border-b border-[rgb(var(--scb-border))] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter size={isMultiTasking && mode === 'slide-over' ? 14 : 18} className="text-[rgb(var(--scb-dark-gray))]" />
                    <h2 className={`font-medium text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'}`}>
                      Filters
                    </h2>
                  </div>
                  
                  {isAppleDevice && isPlatformDetected ? (
                    <EnhancedTouchButton
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCountries([]);
                        setSelectedPriorities([]);
                        
                        // Provide haptic feedback
                        if (isAppleDevice) {
                          haptic({ intensity: 'light' });
                        }
                      }}
                      variant="ghost"
                      className="text-[rgb(var(--scb-honolulu-blue))]"
                      size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                    >
                      Reset
                    </EnhancedTouchButton>
                  ) : (
                    <button 
                      className="text-sm text-[rgb(var(--scb-honolulu-blue))] hover:text-[rgb(var(--scb-primary))]"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCountries([]);
                        setSelectedPriorities([]);
                      }}
                    >
                      Reset
                    </button>
                  )}
                </div>
                
                <div className={`${isMultiTasking && mode === 'slide-over' ? 'p-3' : 'p-4'}`}>
                  {/* Search input */}
                  <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search size={isMultiTasking && mode === 'slide-over' ? 14 : 16} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className={`w-full py-2 pl-10 pr-4 ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} text-[rgb(var(--scb-dark-gray))] bg-[rgb(var(--scb-light-gray))] rounded-md border border-[rgb(var(--scb-border))] focus:ring-[rgb(var(--scb-primary))] focus:border-[rgb(var(--scb-primary))]`}
                      placeholder="Search tariff alerts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  {/* Country filter */}
                  <TariffAlertFilters 
                    alerts={alerts}
                    selectedCountries={selectedCountries}
                    setSelectedCountries={setSelectedCountries}
                    selectedPriorities={selectedPriorities}
                    setSelectedPriorities={setSelectedPriorities}
                  />
                </div>
              </div>
              
              {/* Alert List */}
              <div className="bg-white dark:bg-[rgb(var(--scb-dark-background))] rounded-lg shadow-sm border border-[rgb(var(--scb-border))] h-full">
                <div className="px-4 py-3 border-b border-[rgb(var(--scb-border))] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={isMultiTasking && mode === 'slide-over' ? 14 : 18} className="text-[rgb(var(--warning))]" />
                    <h2 className={`font-medium text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'}`}>
                      Recent Alerts
                    </h2>
                    {filteredAlerts.length > 0 && (
                      <span className={`bg-[rgba(var(--scb-light-gray),0.7)] text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-[9px] px-1.5 py-px' : 'text-xs px-2 py-0.5'} rounded-full`}>
                        {filteredAlerts.length}
                      </span>
                    )}
                  </div>
                  
                  {isAppleDevice && isPlatformDetected ? (
                    <EnhancedTouchButton
                      onClick={refreshAlerts}
                      disabled={isLoading}
                      variant="ghost"
                      className="text-[rgb(var(--scb-dark-gray))]"
                      size="xs"
                    >
                      <RefreshCw size={isMultiTasking && mode === 'slide-over' ? 12 : 16} className={isLoading ? 'animate-spin' : ''} />
                    </EnhancedTouchButton>
                  ) : (
                    <button 
                      className="p-1 rounded-full hover:bg-[rgba(var(--scb-light-gray),0.7)] text-[rgb(var(--scb-dark-gray))]"
                      onClick={refreshAlerts}
                      disabled={isLoading}
                    >
                      <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                  )}
                </div>
                
                {/* Use EnhancedTariffAlertList for Apple devices, regular component for others */}
                {isAppleDevice && isPlatformDetected ? (
                  <EnhancedTariffAlertList 
                    alerts={filteredAlerts}
                    isLoading={isLoading}
                    onAlertClick={handleAlertClick}
                  />
                ) : (
                  <TariffAlertList 
                    alerts={filteredAlerts}
                    isLoading={isLoading}
                  />
                )}
              </div>
            </div>
            
            {/* Right panel - Visualization (only shown in certain modes) */}
            {(!isMultiTasking || mode === 'split-view') && (
              <div className={`${isMultiTasking ? 'col-span-1' : 'col-span-1 lg:col-span-2'}`}>
                <div className="bg-white dark:bg-[rgb(var(--scb-dark-background))] rounded-lg shadow-sm border border-[rgb(var(--scb-border))] h-full">
                  <div className="px-4 py-3 border-b border-[rgb(var(--scb-border))] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Info size={isMultiTasking && mode === 'slide-over' ? 14 : 18} className="text-[rgb(var(--scb-honolulu-blue))]" />
                      <h2 className={`font-medium text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'}`}>
                        Tariff Impact Visualization
                      </h2>
                    </div>
                    
                    {isAppleDevice && isPlatformDetected ? (
                      <EnhancedTouchButton
                        onClick={runImpactSimulation}
                        disabled={simulationInProgress}
                        variant="primary"
                        size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                      >
                        {simulationInProgress ? 'Running...' : 'Run Simulation'}
                      </EnhancedTouchButton>
                    ) : (
                      <button 
                        className="px-3 py-1.5 text-xs font-medium rounded-md bg-[rgb(var(--scb-honolulu-blue))] text-white hover:bg-[rgba(var(--scb-honolulu-blue),0.9)] transition-colors"
                        onClick={runImpactSimulation}
                        disabled={simulationInProgress}
                      >
                        {simulationInProgress ? 'Running...' : 'Run Impact Simulation'}
                      </button>
                    )}
                  </div>
                  
                  <TariffImpactVisualization 
                    data={sankeyData}
                    isLoading={simulationInProgress}
                    adaptToMultiTasking={isMultiTasking}
                    multiTaskingMode={mode}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Fixed notification button for iPad/iPhone */}
        {isAppleDevice && !isMultiTasking && (
          <div className="fixed bottom-6 right-6">
            <EnhancedTouchButton
              onClick={() => {
                haptic({ intensity: 'medium' });
                alert('Notifications panel opened');
              }}
              variant="primary"
              className="rounded-full p-3 shadow-lg"
            >
              <Bell size={20} />
            </EnhancedTouchButton>
          </div>
        )}
      </ScbBeautifulUI>
    </>
  );
};

export default TariffAlertsDashboard;