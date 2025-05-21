import React, { useState, useEffect, useRef } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';
import TariffAlertDashboard from '../components/TariffAlertDashboard';
import VietnamTariffVisualization from '../components/VietnamTariffVisualization';
import { OntologyManager } from '../services/OntologyManager';
import { SearchManager } from '../services/SearchManager';
import { NotificationCenter } from '../services/NotificationCenter';
import { VietnamTariffAnalyzer } from '../services/VietnamTariffAnalyzer';
import { TariffAlert } from '../types';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { useIOS, useMediaQuery } from '../hooks/useResponsive';
import { useDeviceCapabilities } from '../hooks/useDeviceCapabilities';
import { useMicroInteractions } from '../hooks/useMicroInteractions';
import EnhancedTouchButton from '../components/EnhancedTouchButton';
import { 
  Briefcase, Map, BarChart2, AlertTriangle, 
  RefreshCw, Globe, RotateCw, Pause, Play, 
  StopCircle, Workflow, Download, Share2, Bell, 
  HelpCircle, Info
} from 'lucide-react';

// Import mock data for initial development (will be replaced by real data in production)
import { mockTariffAlerts } from '../mock/tariffAlerts';
import { mockVietnamTariffAlerts, vietnamSankeyData } from '../mock/vietnamTariffData';

/**
 * Tariff Scanner page - integrated tariff monitoring system with Monte Carlo simulation
 * Combines real-time web search with financial impact analysis
 */
const TariffScannerPage: NextPage = () => {
  const [ontology, setOntology] = useState<OntologyManager | null>(null);
  const [alerts, setAlerts] = useState<TariffAlert[]>([]);
  const [vietnamAlerts, setVietnamAlerts] = useState<TariffAlert[]>([]);
  const [loadingState, setLoadingState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [simulationStatus, setSimulationStatus] = useState<'idle' | 'running' | 'paused' | 'complete'>('idle');
  const [simulationData, setSimulationData] = useState<any>(null);
  const [vietnamSimulationData, setVietnamSimulationData] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<string>('general');
  const [vietnamAnalyzerStatus, setVietnamAnalyzerStatus] = useState<'initializing' | 'ready' | 'error'>('initializing');
  
  // Platform detection and UI enhancement hooks
  const isAppleDevice = useIOS();
  const [isPlatformDetected, setIsPlatformDetected] = useState(false);
  const { haptic } = useMicroInteractions();
  const { touchCapable } = useDeviceCapabilities();
  const { isDarkMode } = useUIPreferences();
  
  // Multi-tasking mode detection for iPad
  const [isMultiTasking, setIsMultiTasking] = useState(false);
  const [mode, setMode] = useState<'full' | 'split-view' | 'slide-over'>('full');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  
  const monteCarloWorker = useRef<Worker | null>(null);
  const searchManager = useRef<SearchManager | null>(null);
  const vietnamAnalyzer = useRef<VietnamTariffAnalyzer | null>(null);
  
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
  
  // Initialize systems
  useEffect(() => {
    // Initialize the ontology
    const initializeOntologyManager = async () => {
      try {
        const ontologyManager = new OntologyManager({
          ontologyUrl: '/ontologies/tariff-alert-scanner.ttl'
        });
        
        await ontologyManager.loadOntology();
        setOntology(ontologyManager);
        initializeSearchSystem(ontologyManager);
        initializeVietnamAnalyzer(ontologyManager);
      } catch (error) {
        console.error('Failed to load ontology:', error);
        setLoadingState('error');
        
        // For development, continue with mock data
        setAlerts(mockTariffAlerts);
        setVietnamAlerts(mockVietnamTariffAlerts);
        setLoadingState('ready');
      }
    };
    
    // In browser environment, initialize systems
    if (typeof window !== 'undefined') {
      initializeOntologyManager();
      
      // Initialize Monte Carlo worker
      try {
        monteCarloWorker.current = new Worker('/workers/monteCarloWorker.js');
        monteCarloWorker.current.onmessage = handleWorkerMessage;
      } catch (error) {
        console.error('Failed to initialize Monte Carlo worker:', error);
      }
    }
    
    return () => {
      // Cleanup
      if (searchManager.current) {
        searchManager.current.stopAllSearches();
      }
      if (monteCarloWorker.current) {
        monteCarloWorker.current.terminate();
      }
    };
  }, []);
  
  // Initialize Vietnam Tariff Analyzer
  const initializeVietnamAnalyzer = async (ontologyManager: OntologyManager) => {
    try {
      const analyzer = new VietnamTariffAnalyzer(ontologyManager);
      await analyzer.initialize();
      
      // Set up specialized news monitoring for Vietnam
      analyzer.setupVietnamNewsMonitoring();
      
      // Register OData service for SAP Fiori integration
      analyzer.registerODataService();
      
      // Get Vietnam indicators for initial view
      const vietnamIndicators = await analyzer.getVietstockIndicators();
      console.log('Vietnam economic indicators loaded:', vietnamIndicators);
      
      // Run initial analysis (in production this would use real data)
      const initialAnalysis = await analyzer.analyzeVietnamImpact({
        timeHorizon: 24,
        iterations: 5000
      });
      
      setVietnamSimulationData(initialAnalysis);
      vietnamAnalyzer.current = analyzer;
      setVietnamAnalyzerStatus('ready');
      
      // For development, use mock data
      setVietnamAlerts(mockVietnamTariffAlerts);
    } catch (error) {
      console.error('Failed to initialize Vietnam Tariff Analyzer:', error);
      setVietnamAnalyzerStatus('error');
      
      // For development, use mock data
      setVietnamAlerts(mockVietnamTariffAlerts);
    }
  };
  
  const initializeSearchSystem = (loadedOntology: OntologyManager) => {
    // Create search manager with ontology parameters
    searchManager.current = new SearchManager({
      ontology: loadedOntology,
      onTariffInformationFound: (tariffInfo: any) => handleNewTariffInfo(tariffInfo, loadedOntology),
      countryFocus: 'ASEAN'
    });
    
    // Get ASEAN countries from ontology or use default list
    let aseanCountries: string[] = [];
    try {
      const countryInstances = loadedOntology.getInstancesOfClass('tas:ASEANCountry');
      aseanCountries = countryInstances.map(country => 
        loadedOntology.getLabelForInstance(country) || ''
      ).filter(Boolean);
    } catch (error) {
      console.error('Error getting countries from ontology, using default list:', error);
      aseanCountries = [
        'Vietnam', 'Thailand', 'Indonesia', 'Malaysia', 
        'Philippines', 'Singapore', 'Myanmar', 'Cambodia', 
        'Laos', 'Brunei'
      ];
    }
    
    // Register searches for each country
    aseanCountries.forEach(country => {
      searchManager.current?.registerSearch({
        country,
        frequency: 3600000, // hourly
        sources: getSourcesForCountry(country, loadedOntology)
      });
    });
    
    // For development, populate with mock data
    setAlerts(mockTariffAlerts);
    
    // Start scheduled searches in production
    if (process.env.NODE_ENV === 'production') {
      searchManager.current.startSearchScheduler();
    }
    
    setLoadingState('ready');
  };
  
  const getSearchFrequencyForCountry = (country: string, ontology: OntologyManager) => {
    // Default to hourly
    return 3600000;
  };
  
  const getSourcesForCountry = (country: string, ontology: OntologyManager) => {
    // Get sources from ontology or use default
    return [
      'Reuters', 
      'Bloomberg',
      'Wall Street Journal',
      ...getCountrySpecificSources(country)
    ];
  };
  
  const getCountrySpecificSources = (country: string) => {
    // Get country-specific news sources
    const countrySpecificSourcesMap: Record<string, string[]> = {
      'Vietnam': ['VnExpress', 'Vietnam News'],
      'Thailand': ['Bangkok Post', 'The Nation Thailand'],
      'Indonesia': ['Jakarta Post', 'Antara News'],
      'Malaysia': ['New Straits Times', 'The Star'],
      'Philippines': ['Philippine Daily Inquirer', 'ABS-CBN News'],
      'Singapore': ['The Straits Times', 'Channel News Asia']
    };
    
    return countrySpecificSourcesMap[country] || [];
  };
  
  const handleWorkerMessage = (event: MessageEvent) => {
    const { type, data } = event.data;
    
    switch (type) {
      case 'SIMULATION_UPDATE':
        setSimulationData(data);
        break;
      
      case 'SIMULATION_COMPLETE':
        setSimulationStatus('complete');
        setSimulationData(data);
        // Update ontology with simulation results
        if (ontology) {
          updateOntologyWithSimulation(data, ontology);
        }
        
        // Provide haptic feedback on Apple devices
        if (isAppleDevice) {
          haptic({ intensity: 'medium' });
        }
        break;
      
      case 'SIMULATION_PAUSED':
        setSimulationStatus('paused');
        break;
      
      case 'SIMULATION_RESUMED':
        setSimulationStatus('running');
        break;
      
      case 'SIMULATION_STOPPED':
        setSimulationStatus('idle');
        break;
    }
  };
  
  const updateOntologyWithSimulation = (simulationData: any, ontology: OntologyManager) => {
    // In a real implementation, this would add the simulation results to the ontology
    console.log('Updating ontology with simulation results');
  };
  
  const handleNewTariffInfo = (tariffInfo: any, ontology: OntologyManager) => {
    // Process the new tariff information
    console.log('New tariff information found:', tariffInfo);
    
    // Create alert object
    const newAlert: TariffAlert = {
      id: `alert-${Date.now()}`,
      title: tariffInfo.title,
      description: tariffInfo.description,
      country: tariffInfo.country,
      impactSeverity: estimateImpactSeverity(tariffInfo),
      confidence: tariffInfo.confidence || 0.7,
      sourceUrl: tariffInfo.url,
      sourceName: tariffInfo.source,
      publishDate: new Date(tariffInfo.publishedAt || Date.now()),
      createdAt: new Date(),
      priority: determinePriority(tariffInfo),
      tariffRate: tariffInfo.tariffRates?.length ? tariffInfo.tariffRates[0] : undefined,
      productCategories: tariffInfo.productCategories,
      aiEnhanced: false
    };
    
    // Update ontology in production
    if (process.env.NODE_ENV === 'production') {
      try {
        // In real implementation, this would add to ontology
        // ontology.addTariffAlert(newAlert);
        
        // If significant change, run simulation
        if (tariffInfo.isMajorChange) {
          runTariffImpactSimulation(tariffInfo, ontology);
        }
      } catch (error) {
        console.error('Error updating ontology:', error);
      }
    }
    
    // Create notification
    NotificationCenter.showNotification({
      title: `New Tariff Alert: ${tariffInfo.country}`,
      body: tariffInfo.title,
      priority: newAlert.priority,
      onClick: () => navigateToAlert(newAlert.id || '')
    });
    
    // Update alerts state
    setAlerts(prevAlerts => [newAlert, ...prevAlerts]);
    
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptic({ intensity: 'medium' });
    }
  };
  
  const estimateImpactSeverity = (tariffInfo: any) => {
    // Estimate impact severity based on tariff information
    if (tariffInfo.isMajorChange) return 8;
    
    // If we have tariff rates, use them to help determine severity
    if (tariffInfo.tariffRates && tariffInfo.tariffRates.length > 0) {
      const maxRate = Math.max(...tariffInfo.tariffRates);
      if (maxRate > 20) return 9;
      if (maxRate > 15) return 8;
      if (maxRate > 10) return 7;
      if (maxRate > 5) return 6;
      return 5;
    }
    
    // Default to moderate impact
    return 5;
  };
  
  const determinePriority = (tariffInfo: any) => {
    // Determine priority based on tariff information
    if (tariffInfo.isMajorChange) return 'Critical';
    
    // Check tariff rates if available
    if (tariffInfo.tariffRates && tariffInfo.tariffRates.length > 0) {
      const maxRate = Math.max(...tariffInfo.tariffRates);
      if (maxRate > 15) return 'high';
      if (maxRate > 5) return 'medium';
    }
    
    // Check source type
    if (tariffInfo.sourceType === 'official') {
      return 'high';
    }
    
    // Default to medium
    return 'medium';
  };
  
  const navigateToAlert = (alertId: string) => {
    // This would navigate to a detailed view of the alert
    console.log('Navigate to alert:', alertId);
  };
  
  const runTariffImpactSimulation = (tariffInfo: any, ontology: OntologyManager) => {
    // Extract simulation parameters from tariff info and ontology
    const simConfig = buildSimulationConfig(tariffInfo, ontology);
    
    // Start Monte Carlo simulation
    if (monteCarloWorker.current) {
      monteCarloWorker.current.postMessage({
        type: 'START_SIMULATION',
        config: simConfig
      });
      
      setSimulationStatus('running');
      
      // Provide haptic feedback on Apple devices
      if (isAppleDevice) {
        haptic({ intensity: 'light' });
      }
    }
  };
  
  const buildSimulationConfig = (tariffInfo: any, ontology: OntologyManager) => {
    // Extract tariff rates
    const tariffRate = tariffInfo.tariffRates && tariffInfo.tariffRates.length > 0 ? 
      tariffInfo.tariffRates[0] : 0;
    
    // Create scenarios based on tariff change direction
    const scenarios = ['baseline'];
    
    if (tariffInfo.changeDirection === 'increase') {
      scenarios.push('high_tariff', 'trade_war');
    } else if (tariffInfo.changeDirection === 'decrease') {
      scenarios.push('low_tariff', 'free_trade');
    }
    
    return {
      country: tariffInfo.country,
      tariffRate,
      productCategories: tariffInfo.productCategories || [],
      changeDirection: tariffInfo.changeDirection,
      scenarios,
      iterations: 5000,
      timeHorizon: 24, // 24 months
      confidenceRequired: 0.9,
      riskTolerance: 'moderate'
    };
  };
  
  // Dashboard controller functions
  const handleRunSimulation = (config: any) => {
    if (monteCarloWorker.current) {
      monteCarloWorker.current.postMessage({
        type: 'START_SIMULATION',
        config
      });
      
      setSimulationStatus('running');
      
      // Provide haptic feedback on Apple devices
      if (isAppleDevice) {
        haptic({ intensity: 'medium' });
      }
    }
  };
  
  const handlePauseSimulation = () => {
    if (monteCarloWorker.current) {
      monteCarloWorker.current.postMessage({ type: 'PAUSE_SIMULATION' });
      
      // Provide haptic feedback on Apple devices
      if (isAppleDevice) {
        haptic({ intensity: 'light' });
      }
    }
  };
  
  const handleResumeSimulation = () => {
    if (monteCarloWorker.current) {
      monteCarloWorker.current.postMessage({ type: 'RESUME_SIMULATION' });
      
      // Provide haptic feedback on Apple devices
      if (isAppleDevice) {
        haptic({ intensity: 'light' });
      }
    }
  };
  
  const handleStopSimulation = () => {
    if (monteCarloWorker.current) {
      monteCarloWorker.current.postMessage({ type: 'STOP_SIMULATION' });
      
      // Provide haptic feedback on Apple devices
      if (isAppleDevice) {
        haptic({ intensity: 'medium' });
      }
    }
  };
  
  const handleStepSimulation = (steps: number) => {
    if (monteCarloWorker.current) {
      monteCarloWorker.current.postMessage({ 
        type: 'STEP_SIMULATION', 
        config: { steps } 
      });
      
      // Provide haptic feedback on Apple devices
      if (isAppleDevice) {
        haptic({ intensity: 'light' });
      }
    }
  };
  
  const handleTriggerManualSearch = (params: any) => {
    if (searchManager.current) {
      searchManager.current.performManualSearch(params);
      
      // Provide haptic feedback on Apple devices
      if (isAppleDevice) {
        haptic({ intensity: 'medium' });
      }
    }
  };
  
  const handleVietnamAnalysis = async (params: any) => {
    if (vietnamAnalyzer.current && vietnamAnalyzerStatus === 'ready') {
      try {
        setSimulationStatus('running');
        
        // Provide haptic feedback on Apple devices
        if (isAppleDevice) {
          haptic({ intensity: 'medium' });
        }
        
        // Run Vietnam-specific analysis with provided parameters
        const results = await vietnamAnalyzer.current.analyzeVietnamImpact({
          timeHorizon: params.timeHorizon || 24,
          iterations: params.iterations || 5000,
          tradeCategories: params.categories,
          aseanCountries: params.countries,
          confidenceLevel: params.confidenceLevel || 0.95
        });
        
        setVietnamSimulationData(results);
        setSimulationStatus('complete');
        
        // Success haptic feedback on Apple devices
        if (isAppleDevice) {
          haptic({ intensity: 'light' });
        }
      } catch (error) {
        console.error('Error running Vietnam tariff analysis:', error);
        setSimulationStatus('idle');
        
        // Error haptic feedback on Apple devices
        if (isAppleDevice) {
          haptic({ intensity: 'heavy' });
        }
      }
    }
  };
  
  const handleTabChange = (tab: string) => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptic({ intensity: 'light' });
    }
    setSelectedTab(tab);
  };
  
  const handleRetry = () => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptic({ intensity: 'medium' });
    }
    window.location.reload();
  };
  
  const handleShareClick = () => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptic({ intensity: 'medium' });
    }
    
    // Implement share functionality (e.g., open share sheet on iOS)
    alert('Sharing tariff analysis results...');
  };
  
  const handleExportClick = () => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptic({ intensity: 'medium' });
    }
    
    // Implement export functionality
    alert('Exporting tariff analysis results...');
  };

  return (
    <React.Fragment>
      <Head>
        <title>Tariff Scanner | SCB Sapphire FinSight</title>
        <meta name="description" content="Real-time tariff monitoring and impact analysis for ASEAN countries with Vietnam focus" />
      </Head>
      
      <ScbBeautifulUI 
        showNewsBar={!isMultiTasking}
        pageTitle="Tariff Scanner"
        showTabs={isAppleDevice}
      >
        {loadingState === 'loading' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin h-10 w-10 border-4 border-[rgb(var(--scb-honolulu-blue))] border-t-transparent rounded-full mx-auto mb-4"></div>
              <h2 className={`font-medium text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-sm' : 'text-lg'} mb-2`}>
                Loading Tariff Alert Scanner
              </h2>
              <p className={`text-[rgb(var(--scb-dark-gray))] opacity-70 ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'}`}>
                Initializing systems and loading data...
              </p>
            </div>
          </div>
        )}
        
        {loadingState === 'error' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center p-6 bg-white dark:bg-[rgba(var(--scb-dark-gray),0.1)] rounded-lg shadow-sm border border-[rgb(var(--scb-border))] max-w-md">
              <div className="h-12 w-12 rounded-full bg-[rgba(var(--destructive),0.1)] flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="text-[rgb(var(--destructive))]" size={24} />
              </div>
              <h2 className={`font-medium text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-sm' : 'text-lg'} mb-2`}>
                Failed to Initialize
              </h2>
              <p className={`text-[rgb(var(--scb-dark-gray))] opacity-70 ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} mb-4`}>
                We encountered an error while loading the Tariff Alert Scanner. This could be due to a network issue or missing data.
              </p>
              
              {isAppleDevice && isPlatformDetected ? (
                <EnhancedTouchButton
                  onClick={handleRetry}
                  variant="primary"
                  className="w-full"
                  size={isMultiTasking && mode === 'slide-over' ? 'sm' : 'md'}
                >
                  <RefreshCw className="mr-2" size={isMultiTasking && mode === 'slide-over' ? 12 : 16} />
                  Retry
                </EnhancedTouchButton>
              ) : (
                <button 
                  className="px-4 py-2 bg-[rgb(var(--scb-honolulu-blue))] text-white font-medium rounded-md hover:bg-[rgba(var(--scb-honolulu-blue),0.9)] w-full"
                  onClick={handleRetry}
                >
                  <RefreshCw className="inline-block mr-2" size={16} />
                  Retry
                </button>
              )}
            </div>
          </div>
        )}
        
        {loadingState === 'ready' && (
          <div className={`space-y-6 ${isMultiTasking && mode === 'slide-over' ? 'px-2' : ''}`}>
            {/* Platform-specific action buttons */}
            {isAppleDevice && isPlatformDetected && (
              <div className="flex justify-end">
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
              </div>
            )}
            
            {/* Tabs */}
            <div className={`border-b border-[rgb(var(--scb-border))]`}>
              <div className="flex space-x-6">
                <button
                  className={`${isMultiTasking && mode === 'slide-over' ? 'text-xs py-2' : 'text-sm py-3'} pb-2 px-1 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                    selectedTab === 'general' 
                      ? 'border-[rgb(var(--scb-honolulu-blue))] text-[rgb(var(--scb-honolulu-blue))]' 
                      : 'border-transparent text-[rgb(var(--scb-dark-gray))] hover:text-[rgb(var(--scb-primary))]'
                  }`}
                  onClick={() => handleTabChange('general')}
                >
                  <Briefcase size={isMultiTasking && mode === 'slide-over' ? 14 : 16} />
                  <span>ASEAN Tariff Scanner</span>
                </button>
                <button
                  className={`${isMultiTasking && mode === 'slide-over' ? 'text-xs py-2' : 'text-sm py-3'} pb-2 px-1 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                    selectedTab === 'vietnam' 
                      ? 'border-[rgb(var(--scb-honolulu-blue))] text-[rgb(var(--scb-honolulu-blue))]' 
                      : 'border-transparent text-[rgb(var(--scb-dark-gray))] hover:text-[rgb(var(--scb-primary))]'
                  }`}
                  onClick={() => handleTabChange('vietnam')}
                >
                  <Map size={isMultiTasking && mode === 'slide-over' ? 14 : 16} />
                  <span>Vietnam Focus</span>
                </button>
              </div>
            </div>
            
            {/* Tab Panels */}
            <div className="mt-6">
              {selectedTab === 'general' && (
                <div className={isMultiTasking ? 'px-1' : ''}>
                  <div className="pb-4">
                    <h2 className={`font-semibold text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-base' : 'text-xl'} mb-2`}>
                      ASEAN Tariff Analysis
                    </h2>
                    <p className={`text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'}`}>
                      Monitor and analyze the impact of tariff changes across ASEAN countries. This system combines real-time data with advanced financial modeling.
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <div className={`flex ${isMultiTasking && mode === 'slide-over' ? 'flex-col gap-2' : 'flex-wrap items-center gap-3'}`}>
                      {simulationStatus === 'idle' && (
                        isAppleDevice && isPlatformDetected ? (
                          <EnhancedTouchButton
                            onClick={() => handleRunSimulation({
                              iterations: 5000,
                              timeHorizon: 24,
                              confidenceRequired: 0.9
                            })}
                            variant="primary"
                            size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                            className="flex items-center gap-1.5"
                          >
                            <RotateCw className={isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'} />
                            <span>Run Simulation</span>
                          </EnhancedTouchButton>
                        ) : (
                          <button
                            onClick={() => handleRunSimulation({
                              iterations: 5000,
                              timeHorizon: 24,
                              confidenceRequired: 0.9
                            })}
                            className="bg-[rgb(var(--scb-honolulu-blue))] text-white py-1.5 px-3 text-sm font-medium rounded flex items-center gap-1.5"
                          >
                            <RotateCw size={16} />
                            <span>Run Simulation</span>
                          </button>
                        )
                      )}
                    
                      {simulationStatus === 'running' && (
                        <>
                          {isAppleDevice && isPlatformDetected ? (
                            <EnhancedTouchButton
                              onClick={handlePauseSimulation}
                              variant="secondary"
                              size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                              className="flex items-center gap-1.5"
                            >
                              <Pause className={isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'} />
                              <span>Pause</span>
                            </EnhancedTouchButton>
                          ) : (
                            <button
                              onClick={handlePauseSimulation}
                              className="bg-[rgb(var(--scb-dark-gray))] text-white py-1.5 px-3 text-sm font-medium rounded flex items-center gap-1.5"
                            >
                              <Pause size={16} />
                              <span>Pause</span>
                            </button>
                          )}
                        
                          {isAppleDevice && isPlatformDetected ? (
                            <EnhancedTouchButton
                              onClick={handleStopSimulation}
                              variant="secondary"
                              size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                              className="flex items-center gap-1.5"
                            >
                              <StopCircle className={isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'} />
                              <span>Stop</span>
                            </EnhancedTouchButton>
                          ) : (
                            <button
                              onClick={handleStopSimulation}
                              className="bg-[rgb(var(--scb-dark-gray))] text-white py-1.5 px-3 text-sm font-medium rounded flex items-center gap-1.5"
                            >
                              <StopCircle size={16} />
                              <span>Stop</span>
                            </button>
                          )}
                        </>
                      )}
                    
                      {simulationStatus === 'paused' && (
                        <>
                          {isAppleDevice && isPlatformDetected ? (
                            <EnhancedTouchButton
                              onClick={handleResumeSimulation}
                              variant="primary"
                              size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                              className="flex items-center gap-1.5"
                            >
                              <Play className={isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'} />
                              <span>Resume</span>
                            </EnhancedTouchButton>
                          ) : (
                            <button
                              onClick={handleResumeSimulation}
                              className="bg-[rgb(var(--scb-honolulu-blue))] text-white py-1.5 px-3 text-sm font-medium rounded flex items-center gap-1.5"
                            >
                              <Play size={16} />
                              <span>Resume</span>
                            </button>
                          )}
                        
                          {isAppleDevice && isPlatformDetected ? (
                            <EnhancedTouchButton
                              onClick={handleStopSimulation}
                              variant="secondary"
                              size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                              className="flex items-center gap-1.5"
                            >
                              <StopCircle className={isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'} />
                              <span>Stop</span>
                            </EnhancedTouchButton>
                          ) : (
                            <button
                              onClick={handleStopSimulation}
                              className="bg-[rgb(var(--scb-dark-gray))] text-white py-1.5 px-3 text-sm font-medium rounded flex items-center gap-1.5"
                            >
                              <StopCircle size={16} />
                              <span>Stop</span>
                            </button>
                          )}
                        </>
                      )}
                    
                      {simulationStatus === 'complete' && (
                        isAppleDevice && isPlatformDetected ? (
                          <EnhancedTouchButton
                            onClick={() => handleRunSimulation({
                              iterations: 10000,
                              timeHorizon: 24,
                              confidenceRequired: 0.95
                            })}
                            variant="primary"
                            size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                            className="flex items-center gap-1.5"
                          >
                            <RotateCw className={isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'} />
                            <span>Run Again</span>
                          </EnhancedTouchButton>
                        ) : (
                          <button
                            onClick={() => handleRunSimulation({
                              iterations: 10000,
                              timeHorizon: 24,
                              confidenceRequired: 0.95
                            })}
                            className="bg-[rgb(var(--scb-honolulu-blue))] text-white py-1.5 px-3 text-sm font-medium rounded flex items-center gap-1.5"
                          >
                            <RotateCw size={16} />
                            <span>Run Again</span>
                          </button>
                        )
                      )}
                    
                      {simulationStatus === 'running' && (
                        <div className="ml-3 text-[rgb(var(--scb-dark-gray))] flex items-center">
                          <div className="animate-spin h-4 w-4 border-2 border-[rgb(var(--scb-honolulu-blue))] border-t-transparent rounded-full mr-2"></div>
                          <span className={isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'}>
                            Running simulation...
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <TariffAlertDashboard 
                      alerts={alerts}
                      simulationData={simulationData}
                      simulationStatus={simulationStatus}
                      onRunSimulation={handleRunSimulation}
                      onPauseSimulation={handlePauseSimulation}
                      onResumeSimulation={handleResumeSimulation}
                      onStopSimulation={handleStopSimulation}
                      onStepSimulation={handleStepSimulation}
                      onTriggerManualSearch={handleTriggerManualSearch}
                      isMultiTasking={isMultiTasking}
                      multiTaskingMode={mode}
                      isAppleDevice={isAppleDevice}
                    />
                  </div>
                </div>
              )}
              
              {selectedTab === 'vietnam' && (
                <div className={isMultiTasking ? 'px-1' : ''}>
                  {vietnamAnalyzerStatus === 'initializing' && (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin h-8 w-8 border-3 border-[rgb(var(--scb-honolulu-blue))] border-t-transparent rounded-full mr-3"></div>
                      <p className={`text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'}`}>
                        Initializing Vietnam Tariff Analyzer...
                      </p>
                    </div>
                  )}
                  
                  {vietnamAnalyzerStatus === 'error' && (
                    <div className="bg-[rgba(var(--destructive),0.1)] rounded-md p-4 mb-6">
                      <div className="flex items-start">
                        <AlertTriangle className="text-[rgb(var(--destructive))] mr-3 mt-0.5" size={20} />
                        <div>
                          <h3 className={`font-semibold text-[rgb(var(--destructive))] ${isMultiTasking && mode === 'slide-over' ? 'text-sm' : 'text-base'} mb-1`}>
                            Vietnam Analyzer Error
                          </h3>
                          <p className={`text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} mb-3`}>
                            Failed to initialize the Vietnam tariff analysis system. Using limited functionality with mock data.
                          </p>
                          
                          {isAppleDevice && isPlatformDetected ? (
                            <EnhancedTouchButton
                              onClick={handleRetry}
                              variant="secondary"
                              size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                              className="flex items-center gap-1.5"
                            >
                              <RefreshCw className={isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'} />
                              <span>Retry Initialization</span>
                            </EnhancedTouchButton>
                          ) : (
                            <button 
                              className="border border-[rgb(var(--scb-border))] bg-white hover:bg-gray-50 text-[rgb(var(--scb-dark-gray))] font-medium rounded px-3 py-1.5 text-sm flex items-center gap-1.5"
                              onClick={handleRetry}
                            >
                              <RefreshCw size={16} />
                              <span>Retry Initialization</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="pb-4">
                    <h2 className={`font-semibold text-[rgb(var(--scb-primary))] ${isMultiTasking && mode === 'slide-over' ? 'text-base' : 'text-xl'} mb-2`}>
                      Vietnam Tariff Impact Analysis System
                    </h2>
                  </div>
                  
                  <div className="bg-[rgba(var(--scb-light-blue),0.2)] dark:bg-[rgba(var(--scb-dark-blue),0.2)] rounded-md p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <Info className="text-[rgb(var(--scb-honolulu-blue))] mt-0.5" size={isMultiTasking && mode === 'slide-over' ? 16 : 20} />
                      <div>
                        <h3 className={`font-medium text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-sm' : 'text-base'} mb-1`}>
                          Vietnam Focus
                        </h3>
                        <p className={`text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'}`}>
                          This specialized view provides Vietnam-specific tariff impact analysis using RDF ontologies, real-time Reuters/Bloomberg feeds, and Monte Carlo simulations.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart2 className="text-[rgb(var(--scb-honolulu-blue))]" size={isMultiTasking && mode === 'slide-over' ? 16 : 20} />
                      <h3 className={`font-medium text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-sm' : 'text-base'}`}>
                        Vietnam Tariff Insights
                      </h3>
                    </div>
                    
                    <p className={`text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} mb-4`}>
                      Monitor and analyze the impact of tariff changes on Vietnam's trade position in the ASEAN region. This system combines Vietnam customs data with RDF ontologies and SAP Fiori visualization.
                    </p>
                    
                    <div className="pt-2">
                      {vietnamAnalyzerStatus === 'ready' && vietnamAnalyzer.current && (
                        <VietnamTariffVisualization
                          analyzer={vietnamAnalyzer.current}
                          timeHorizon={24}
                          iterations={5000}
                          isLoading={simulationStatus === 'running'}
                          isMultiTasking={isMultiTasking}
                          multiTaskingMode={mode}
                          isAppleDevice={isAppleDevice}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Fixed notification button for iPad/iPhone */}
        {isAppleDevice && !isMultiTasking && loadingState === 'ready' && (
          <div className="fixed bottom-6 right-6">
            <EnhancedTouchButton
              onClick={() => {
                haptic({ intensity: 'medium' });
                alert('Simulate button pressed');
              }}
              variant="primary"
              className="rounded-full p-3 shadow-lg"
            >
              <Workflow size={20} />
            </EnhancedTouchButton>
          </div>
        )}
      </ScbBeautifulUI>
    </React.Fragment>
  );
};

export default TariffScannerPage;