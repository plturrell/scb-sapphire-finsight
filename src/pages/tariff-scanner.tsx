import React, { useState, useEffect, useRef } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import DashboardLayout from '../components/layout/DashboardLayout';
import TariffAlertDashboard from '../components/TariffAlertDashboard';
import VietnamTariffVisualization from '../components/VietnamTariffVisualization';
import { OntologyManager } from '../services/OntologyManager';
import { SearchManager } from '../services/SearchManager';
import { NotificationCenter } from '../services/NotificationCenter';
import { VietnamTariffAnalyzer } from '../services/VietnamTariffAnalyzer';
import { TariffAlert } from '../types';
import { Tabs, Tab, Box, Typography, Alert, AlertTitle, Button } from '@mui/material';
import { Briefcase, Map, BarChart2, AlertTriangle } from 'lucide-react';

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
  
  const monteCarloWorker = useRef<Worker | null>(null);
  const searchManager = useRef<SearchManager | null>(null);
  const vietnamAnalyzer = useRef<VietnamTariffAnalyzer | null>(null);
  
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
    }
  };
  
  const handlePauseSimulation = () => {
    if (monteCarloWorker.current) {
      monteCarloWorker.current.postMessage({ type: 'PAUSE_SIMULATION' });
    }
  };
  
  const handleResumeSimulation = () => {
    if (monteCarloWorker.current) {
      monteCarloWorker.current.postMessage({ type: 'RESUME_SIMULATION' });
    }
  };
  
  const handleStopSimulation = () => {
    if (monteCarloWorker.current) {
      monteCarloWorker.current.postMessage({ type: 'STOP_SIMULATION' });
    }
  };
  
  const handleStepSimulation = (steps: number) => {
    if (monteCarloWorker.current) {
      monteCarloWorker.current.postMessage({ 
        type: 'STEP_SIMULATION', 
        config: { steps } 
      });
    }
  };
  
  const handleTriggerManualSearch = (params: any) => {
    if (searchManager.current) {
      searchManager.current.performManualSearch(params);
    }
  };
  
  const handleVietnamAnalysis = async (params: any) => {
    if (vietnamAnalyzer.current && vietnamAnalyzerStatus === 'ready') {
      try {
        setSimulationStatus('running');
        
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
      } catch (error) {
        console.error('Error running Vietnam tariff analysis:', error);
        setSimulationStatus('idle');
      }
    }
  };

  return (
    <>
      <Head>
        <title>Tariff Alert Scanner | SCB Sapphire FinSight</title>
        <meta name="description" content="Real-time tariff monitoring and impact analysis for ASEAN countries with Vietnam focus" />
      </Head>
      
      <DashboardLayout>
        {loadingState === 'loading' && (
          <div className="flex justify-center items-center h-screen bg-gray-50">
            <div className="text-center">
              <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h2 className="text-lg font-medium text-gray-900">Loading Tariff Alert Scanner</h2>
              <p className="text-sm text-gray-600">Initializing systems and loading data...</p>
            </div>
          </div>
        )}
        
        {loadingState === 'error' && (
          <div className="flex justify-center items-center h-screen bg-gray-50">
            <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">Failed to Initialize</h2>
              <p className="text-sm text-gray-600 mb-4">
                We encountered an error while loading the Tariff Alert Scanner. This could be due to a network issue or missing data.
              </p>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          </div>
        )}
        
        {loadingState === 'ready' && (
          <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs 
                value={selectedTab} 
                onChange={(_, newValue) => setSelectedTab(newValue)}
                aria-label="Tariff analysis tabs"
                sx={{ 
                  '& .MuiTab-root': { 
                    textTransform: 'none',
                    fontFamily: 'Proxima Nova, Arial, sans-serif'
                  }
                }}
              >
                <Tab 
                  icon={<Briefcase size={16} />} 
                  iconPosition="start" 
                  label="ASEAN Tariff Scanner" 
                  value="general" 
                />
                <Tab 
                  icon={<Map size={16} />} 
                  iconPosition="start" 
                  label="Vietnam Focus" 
                  value="vietnam" 
                />
              </Tabs>
            </Box>
            
            {selectedTab === 'general' && (
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
              />
            )}
            
            {selectedTab === 'vietnam' && (
              <Box>
                {vietnamAnalyzerStatus === 'initializing' && (
                  <Box display="flex" justifyContent="center" alignItems="center" p={4}>
                    <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mr-4"></div>
                    <Typography variant="body1">Initializing Vietnam Tariff Analyzer...</Typography>
                  </Box>
                )}
                
                {vietnamAnalyzerStatus === 'error' && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    <AlertTitle>Vietnam Analyzer Error</AlertTitle>
                    Failed to initialize the Vietnam tariff analysis system. Using limited functionality with mock data.
                    <Button 
                      variant="outlined" 
                      size="small" 
                      startIcon={<AlertTriangle size={16} />}
                      sx={{ mt: 1 }}
                      onClick={() => window.location.reload()}
                    >
                      Retry Initialization
                    </Button>
                  </Alert>
                )}
                
                <Typography variant="h5" sx={{ mb: 2, color: '#0F5EA2', fontFamily: 'Proxima Nova, Arial, sans-serif' }}>
                  Vietnam Tariff Impact Analysis System
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <AlertTitle>Vietnam Focus</AlertTitle>
                    This specialized view provides Vietnam-specific tariff impact analysis using RDF ontologies, real-time Reuters/Bloomberg feeds, and Monte Carlo simulations.
                  </Alert>
                  
                  <Typography variant="subtitle1" gutterBottom>
                    <BarChart2 size={16} style={{ marginRight: '8px', display: 'inline', verticalAlign: 'text-bottom' }} />
                    Vietnam Tariff Insights
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Monitor and analyze the impact of tariff changes on Vietnam's trade position in the ASEAN region. This system combines Vietnam customs data with RDF ontologies and SAP Fiori visualization through OData middleware.
                  </Typography>
                </Box>
                
                {vietnamAnalyzerStatus === 'ready' && vietnamAnalyzer.current && (
                  <VietnamTariffVisualization
                    analyzer={vietnamAnalyzer.current}
                    timeHorizon={24}
                    iterations={5000}
                    isLoading={simulationStatus === 'running'}
                  />
                )}
              </Box>
            )}
          </Box>
        )}
      </DashboardLayout>
    </>
  );
};

export default TariffScannerPage;
