import React, { useState, useEffect, useRef } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import DashboardLayout from '../components/layout/DashboardLayout';
import VietnamGeoMap from '../components/VietnamGeoMap';
import VietnamTariffVisualization from '../components/VietnamTariffVisualization';
import { VietnamTariffAnalyzer } from '../services/VietnamTariffAnalyzer';
import { VietnamSearchManager } from '../services/VietnamSearchManager';
import { OntologyManager } from '../services/OntologyManager';
import { SearchManager } from '../services/SearchManager';
import { globalSimulationCache } from '../services/SimulationCache';
import { mockVietnamTariffAlerts, vietnamProvinceData, vietnamTradeCorridors } from '../mock/vietnamTariffData';
import { useIOS } from '../hooks/useResponsive';
import { useMicroInteractions } from '../hooks/useMicroInteractions';
import { useSFSymbolsSupport } from '@/lib/sf-symbols';
import SFSymbol from '@/components/SFSymbol';

import { 
  Box, Typography, Card, CardContent, CardHeader, Grid, Button, 
  Tabs, Tab, Chip, TextField, MenuItem, Select, FormControl, 
  InputLabel, Alert, AlertTitle, CircularProgress 
} from '@mui/material';
import { 
  TrendingUp, Filter, Download, Map, BarChart2, 
  Activity, AlertTriangle, Info 
} from 'lucide-react';
import { RefreshCw } from 'lucide-react'; // Correct name for the Refresh icon

/**
 * Vietnam Tariff Impact Page
 * Specialized dashboard for Vietnam-specific tariff impact analysis
 */
const VietnamTariffImpactPage: NextPage = () => {
  // State
  const [ontology, setOntology] = useState<OntologyManager | null>(null);
  const [alerts, setAlerts] = useState<any[]>(mockVietnamTariffAlerts);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [simulationData, setSimulationData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<string>('visualization');
  const [loadingState, setLoadingState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [selectedTimeHorizon, setSelectedTimeHorizon] = useState<number>(24);
  const [selectedConfidenceLevel, setSelectedConfidenceLevel] = useState<number>(0.95);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [simulationMessage, setSimulationMessage] = useState<string | null>(null);
  const [useCache, setUseCache] = useState<boolean>(true);
  
  // Platform detection and UI enhancement hooks
  const isAppleDevice = useIOS();
  const [isPlatformDetected, setIsPlatformDetected] = useState(false);
  const { haptic } = useMicroInteractions();
  const { supported: sfSymbolsSupported } = useSFSymbolsSupport();
  
  // Vietnam tariff tabs with SF Symbols icons
  const tariffTabs = [
    { id: 'visualization', label: 'Tariff Flow', icon: 'chart.bar', badge: null },
    { id: 'geomap', label: 'Geographic', icon: 'map.fill', badge: null },
    { id: 'alerts', label: 'Alerts & News', icon: 'bell.fill', badge: alerts.length.toString() }
  ];
  
  // Refs
  const vietnamAnalyzer = useRef<VietnamTariffAnalyzer | null>(null);
  const searchManager = useRef<SearchManager | null>(null);
  const vietnamSearchManager = useRef<VietnamSearchManager | null>(null);
  const monteCarloWorker = useRef<Worker | null>(null);
  
  // Platform detection effect
  useEffect(() => {
    // Set platform detected flag
    setIsPlatformDetected(true);
  }, []);
  
  // Initialize systems
  useEffect(() => {
    // Initialize ontology
    const initializeOntologyManager = async () => {
      try {
        const ontologyManager = new OntologyManager({
          ontologyUrl: '/ontologies/tariff-alert-scanner.ttl'
        });
        
        await ontologyManager.loadOntology();
        
        // In a real implementation, this would load a specialized Vietnam ontology
        // await ontologyManager.importOntology('/ontologies/vietnam-tariff-impact-research.ttl');
        
        setOntology(ontologyManager);
        initializeServices(ontologyManager);
      } catch (error) {
        console.error('Failed to load ontology:', error);
        setLoadingState('error');
      }
    };
    
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
      if (monteCarloWorker.current) {
        monteCarloWorker.current.terminate();
      }
    };
  }, []);
  
  // Initialize services with ontology
  const initializeServices = async (ontologyManager: OntologyManager) => {
    try {
      // Initialize search manager
      const search = new SearchManager({
        ontology: ontologyManager,
        onTariffInformationFound: handleNewTariffInfo,
        countryFocus: 'Vietnam'
      });
      searchManager.current = search;
      
      // Initialize Vietnam-specific search manager
      vietnamSearchManager.current = new VietnamSearchManager(
        search, 
        ontologyManager,
        { 
          // In production, these would be actual API keys
          reutersApiKey: process.env.REUTERS_API_KEY,
          bloombergApiKey: process.env.BLOOMBERG_API_KEY
        }
      );
      
      // Initialize Vietnam tariff analyzer
      const analyzer = new VietnamTariffAnalyzer(ontologyManager);
      await analyzer.initialize();
      vietnamAnalyzer.current = analyzer;
      
      // Configure Vietnam-specific searches
      if (vietnamSearchManager.current) {
        vietnamSearchManager.current.configureVietnamTariffSearches();
      }
      
      // Run initial simulation (or get from cache)
      await runVietnamSimulation({
        timeHorizon: selectedTimeHorizon,
        confidenceLevel: selectedConfidenceLevel
      });
      
      setLoadingState('ready');
    } catch (error) {
      console.error('Failed to initialize services:', error);
      setLoadingState('error');
      
      // For development, continue with mock data
      setLoadingState('ready');
    }
  };
  
  // Handle new tariff information
  const handleNewTariffInfo = (tariffInfo: any) => {
    // Add to alerts
    setAlerts(prev => [tariffInfo, ...prev].slice(0, 20));
    
    // If significant, run a new simulation
    if (tariffInfo.impactSeverity > 7) {
      runVietnamSimulation({
        timeHorizon: selectedTimeHorizon,
        confidenceLevel: selectedConfidenceLevel,
        forceRefresh: true
      });
    }
  };
  
  // Handle worker messages
  const handleWorkerMessage = (event: MessageEvent) => {
    const { type, data } = event.data;
    
    switch (type) {
      case 'SIMULATION_UPDATE':
        setSimulationData(data);
        break;
      
      case 'SIMULATION_COMPLETE':
        setSimulationStatus('completed');
        setSimulationData(data);
        
        // Cache the results
        if (useCache) {
          globalSimulationCache.cacheResults(
            {
              country: 'Vietnam',
              timeHorizon: selectedTimeHorizon,
              confidenceRequired: selectedConfidenceLevel,
              simulationVersion: '1.0.0'
            },
            data,
            {
              iterationsRun: data.iterationsRun || 5000,
              computeTimeMs: data.computeTimeMs || 2000,
              convergenceAchieved: data.convergenceAchieved || true
            }
          );
        }
        
        setSimulationMessage('Simulation completed successfully');
        break;
      
      case 'SIMULATION_ERROR':
        setSimulationStatus('idle');
        setSimulationMessage(`Error: ${data.error}`);
        break;
    }
  };
  
  // Run Vietnam simulation
  const runVietnamSimulation = async (params: {
    timeHorizon?: number;
    confidenceLevel?: number;
    forceRefresh?: boolean;
  }) => {
    const timeHorizon = params.timeHorizon || selectedTimeHorizon;
    const confidenceLevel = params.confidenceLevel || selectedConfidenceLevel;
    const forceRefresh = params.forceRefresh || false;
    
    setSimulationMessage('Preparing simulation...');
    
    // Check cache first if not forcing refresh
    if (useCache && !forceRefresh) {
      const cacheKey = {
        country: 'Vietnam',
        timeHorizon,
        confidenceRequired: confidenceLevel,
        simulationVersion: '1.0.0'
      };
      
      const cachedResults = globalSimulationCache.getCachedResults(cacheKey);
      
      if (cachedResults) {
        setSimulationData(cachedResults.results);
        setSimulationStatus('completed');
        setSimulationMessage(`Loaded from cache (computed ${Math.round((Date.now() - cachedResults.timestamp) / 60000)} minutes ago)`);
        return;
      }
    }
    
    // No cache hit or forced refresh, run simulation
    setSimulationStatus('running');
    setSimulationMessage('Running Monte Carlo simulation...');
    
    if (vietnamAnalyzer.current) {
      try {
        // In a real implementation, this would use the actual analyzer
        // For demo, we'll use the Monte Carlo worker
        if (monteCarloWorker.current) {
          monteCarloWorker.current.postMessage({
            type: 'START_SIMULATION',
            config: {
              country: 'Vietnam',
              timeHorizon,
              tariffRate: 0,
              confidenceRequired: confidenceLevel,
              scenarios: ['baseline', 'escalation', 'negotiated'],
              iterations: 5000,
              useVietnamParameters: true
            }
          });
        } else {
          // Fallback if worker not available
          const results = await vietnamAnalyzer.current.analyzeVietnamImpact({
            timeHorizon,
            iterations: 5000,
            confidenceLevel
          });
          
          setSimulationData(results);
          setSimulationStatus('completed');
          setSimulationMessage('Simulation completed successfully');
        }
      } catch (error) {
        console.error('Error running Vietnam simulation:', error);
        setSimulationStatus('idle');
        setSimulationMessage(`Error: ${error}`);
      }
    } else {
      setSimulationStatus('idle');
      setSimulationMessage('Vietnam analyzer not initialized');
    }
  };
  
  // Handle province selection
  const handleProvinceSelect = (provinceId: string) => {
    setSelectedProvince(provinceId === selectedProvince ? null : provinceId);
    
    // Filter alerts for selected province if applicable
    if (provinceId && provinceId !== selectedProvince) {
      const provinceData = vietnamProvinceData.provinces.find(p => p.id === provinceId);
      if (provinceData) {
        setSearchQuery(provinceData.name);
      }
    }
  };
  
  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptic({ intensity: 'light' });
    }
    
    setActiveTab(newValue);
  };
  
  // Handle SF Symbol tab change
  const handleSFSymbolTabChange = (tabId: string) => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptic({ intensity: 'light' });
    }
    
    setActiveTab(tabId);
  };
  
  // Handle search
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    if (vietnamSearchManager.current) {
      vietnamSearchManager.current.performVietnamSearch({
        query: searchQuery,
        includeAsean: true
      });
      
      setSimulationMessage(`Searching for "${searchQuery}" in Vietnam tariff sources...`);
    }
  };
  
  // Handle time horizon change
  const handleTimeHorizonChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const newTimeHorizon = event.target.value as number;
    setSelectedTimeHorizon(newTimeHorizon);
    
    // Run a new simulation with the new time horizon
    runVietnamSimulation({
      timeHorizon: newTimeHorizon,
      confidenceLevel: selectedConfidenceLevel
    });
  };
  
  // Handle confidence level change
  const handleConfidenceLevelChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const newConfidenceLevel = event.target.value as number;
    setSelectedConfidenceLevel(newConfidenceLevel);
    
    // Run a new simulation with the new confidence level
    runVietnamSimulation({
      timeHorizon: selectedTimeHorizon,
      confidenceLevel: newConfidenceLevel
    });
  };
  
  // Handle export data
  const handleExportData = () => {
    if (!simulationData) return;
    
    try {
      const dataStr = JSON.stringify(simulationData, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const exportFileDefaultName = `vietnam-tariff-impact-${new Date().toISOString().slice(0, 10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      setSimulationMessage('Exported simulation data successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      setSimulationMessage(`Error exporting data: ${error}`);
    }
  };
  
  return (
    <>
      <Head>
        <title>Vietnam Tariff Impact Analysis | SCB Sapphire FinSight</title>
        <meta name="description" content="Specialized Vietnam tariff impact analysis with real-time monitoring and simulation" />
      </Head>
      
      <DashboardLayout>
        {loadingState === 'loading' && (
          <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Loading Vietnam Tariff Analysis System...
            </Typography>
          </Box>
        )}
        
        {loadingState === 'error' && (
          <Alert severity="error" sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
            <AlertTitle>Error Loading Vietnam Tariff Analysis System</AlertTitle>
            <Typography variant="body2">
              An error occurred while initializing the Vietnam Tariff Analysis System. 
              Please try refreshing the page or contact support if the problem persists.
            </Typography>
            <Button 
              variant="outlined" 
              size="small" 
              sx={{ mt: 2 }}
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </Alert>
        )}
        
        {loadingState === 'ready' && (
          <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5" component="h1" sx={{ color: '#0F5EA2', fontWeight: 500 }}>
                Vietnam Tariff Impact Analysis
              </Typography>
              
              <Box display="flex" gap={2}>
                <Button 
                  variant="outlined" 
                  size="small"
                  startIcon={<RefreshCw />}
                  onClick={() => runVietnamSimulation({ forceRefresh: true })}
                  disabled={simulationStatus === 'running'}
                >
                  Run New Simulation
                </Button>
                
                <Button 
                  variant="outlined" 
                  size="small"
                  startIcon={<Download />}
                  onClick={handleExportData}
                  disabled={!simulationData || simulationStatus === 'running'}
                >
                  Export Data
                </Button>
              </Box>
            </Box>
            
            {/* Simulation Message */}
            {simulationMessage && (
              <Alert 
                severity={simulationMessage.includes('Error') ? 'error' : 'info'} 
                sx={{ mb: 2 }}
                onClose={() => setSimulationMessage(null)}
              >
                {simulationMessage}
              </Alert>
            )}
            
            {/* Controls */}
            <Grid container spacing={3} mb={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Search Vietnam Tariff Information
                    </Typography>
                    <Box display="flex" gap={2}>
                      <TextField 
                        size="small"
                        label="Search Query"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ flexGrow: 1 }}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      />
                      <Button 
                        variant="contained"
                        size="small"
                        onClick={handleSearch}
                        disabled={!searchQuery.trim()}
                      >
                        Search
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Simulation Parameters
                    </Typography>
                    <Box display="flex" gap={2}>
                      <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel id="time-horizon-label">Time Horizon</InputLabel>
                        <Select
                          labelId="time-horizon-label"
                          value={selectedTimeHorizon}
                          label="Time Horizon"
                          onChange={handleTimeHorizonChange as any}
                        >
                          <MenuItem value={12}>12 Months</MenuItem>
                          <MenuItem value={24}>24 Months</MenuItem>
                          <MenuItem value={36}>36 Months</MenuItem>
                          <MenuItem value={48}>48 Months</MenuItem>
                        </Select>
                      </FormControl>
                      
                      <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel id="confidence-level-label">Confidence Level</InputLabel>
                        <Select
                          labelId="confidence-level-label"
                          value={selectedConfidenceLevel}
                          label="Confidence Level"
                          onChange={handleConfidenceLevelChange as any}
                        >
                          <MenuItem value={0.90}>90% Confidence</MenuItem>
                          <MenuItem value={0.95}>95% Confidence</MenuItem>
                          <MenuItem value={0.99}>99% Confidence</MenuItem>
                        </Select>
                      </FormControl>
                      
                      <Box display="flex" alignItems="center">
                        <Chip 
                          label={useCache ? "Using Cache" : "Cache Disabled"} 
                          color={useCache ? "success" : "default"}
                          onClick={() => setUseCache(!useCache)}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                aria-label="Vietnam tariff analysis tabs"
              >
                <Tab 
                  icon={<BarChart2 size={16} />} 
                  iconPosition="start" 
                  label="Tariff Flow Visualization" 
                  value="visualization" 
                />
                <Tab 
                  icon={<Map size={16} />} 
                  iconPosition="start" 
                  label="Geographic Impact" 
                  value="geomap" 
                />
                <Tab 
                  icon={<Activity size={16} />} 
                  iconPosition="start" 
                  label="Alerts & News" 
                  value="alerts" 
                />
              </Tabs>
            </Box>
            
            {/* Tab Content */}
            {activeTab === 'visualization' && (
              <Box>
                {vietnamAnalyzer.current && (
                  <VietnamTariffVisualization
                    analyzer={vietnamAnalyzer.current}
                    timeHorizon={selectedTimeHorizon}
                    iterations={5000}
                    isLoading={simulationStatus === 'running'}
                  />
                )}
              </Box>
            )}
            
            {activeTab === 'geomap' && (
              <Box>
                <VietnamGeoMap
                  provinces={vietnamProvinceData.provinces}
                  tradeCorridors={vietnamTradeCorridors}
                  width={800}
                  height={600}
                  selectedProvince={selectedProvince || undefined}
                  onProvinceSelect={handleProvinceSelect}
                  loading={simulationStatus === 'running'}
                />
              </Box>
            )}
            
            {activeTab === 'alerts' && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card>
                    <CardHeader 
                      title="Vietnam Tariff Alerts & News"
                      action={
                        <Box display="flex" gap={1}>
                          <Button 
                            size="small" 
                            startIcon={<Filter />}
                            variant="outlined"
                          >
                            Filter
                          </Button>
                          <Button 
                            size="small" 
                            startIcon={<RefreshCw />}
                            variant="outlined"
                            onClick={() => {
                              if (vietnamSearchManager.current) {
                                vietnamSearchManager.current.performVietnamSearch({
                                  query: "Vietnam tariff update",
                                  includeAsean: true
                                });
                              }
                            }}
                          >
                            Refresh
                          </Button>
                        </Box>
                      }
                    />
                    <CardContent>
                      {alerts.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No alerts found
                        </Typography>
                      ) : (
                        <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
                          {alerts.map((alert, index) => (
                            <Card 
                              key={alert.id || index} 
                              sx={{ mb: 2, boxShadow: 'none', border: '1px solid #eee' }}
                            >
                              <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                  <Box>
                                    <Typography variant="subtitle1" gutterBottom display="flex" alignItems="center">
                                      {alert.priority === 'Critical' || alert.priority === 'high' ? (
                                        <AlertTriangle size={16} color={SCB_COLORS.alertRed} style={{ marginRight: 8 }} />
                                      ) : (
                                        <Info size={16} color={SCB_COLORS.primaryBlue} style={{ marginRight: 8 }} />
                                      )}
                                      {alert.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" paragraph>
                                      {alert.description}
                                    </Typography>
                                  </Box>
                                  <Chip 
                                    label={`Impact: ${alert.impactSeverity}/10`}
                                    color={alert.impactSeverity > 7 ? "error" : alert.impactSeverity > 5 ? "warning" : "info"}
                                    size="small"
                                  />
                                </Box>
                                
                                <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                                  {alert.productCategories?.map((category: string, i: number) => (
                                    <Chip key={i} label={category} size="small" />
                                  ))}
                                  
                                  {alert.affectedProvinces?.map((province: string, i: number) => (
                                    <Chip 
                                      key={`province-${i}`} 
                                      label={province} 
                                      size="small"
                                      variant="outlined"
                                    />
                                  ))}
                                </Box>
                                
                                <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                                  <Typography variant="caption" color="text.secondary">
                                    Source: {alert.sourceName} • {new Date(alert.publishDate).toLocaleDateString()}
                                  </Typography>
                                  
                                  <Box display="flex" alignItems="center">
                                    <TrendingUp 
                                      size={14} 
                                      color={alert.tariffRate > 0 ? SCB_COLORS.alertRed : SCB_COLORS.secondaryGreen}
                                      style={{ marginRight: 4 }}
                                    />
                                    <Typography variant="caption" fontWeight="medium">
                                      {alert.tariffRate > 0 ? '+' : ''}{alert.tariffRate}%
                                    </Typography>
                                  </Box>
                                </Box>
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Box>
        )}
      </DashboardLayout>
    </>
  );
};

export default VietnamTariffImpactPage;
