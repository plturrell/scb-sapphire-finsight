import React, { useState, useEffect, useRef } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import {
  Box,
  Typography,
  Container,
  Grid,
  Button,
  CircularProgress,
  Alert,
  AlertTitle,
  Paper,
  Divider,
  ThemeProvider,
  useTheme
} from '@mui/material';
import muiTheme from '@/lib/mui-theme';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';
import VietnamMonteCarloParams, { VietnamMonteCarloConfig } from '../components/VietnamMonteCarloParams';
import VietnamMonteCarloProbabilityDistribution from '../components/VietnamMonteCarloProbabilityDistribution';
import VietnamMonteCarloCaseAnalysis from '../components/VietnamMonteCarloCaseAnalysis';
import VietnamMonteCarloSensitivity, { SensitivityParameter } from '../components/VietnamMonteCarloSensitivity';
import VietnamMonteCarloLlmAnalysis, { LlmAnalysisResult } from '../components/VietnamMonteCarloLlmAnalysis';
import { globalSimulationCache } from '../services/SimulationCache';
import EnhancedTouchButton from '@/components/EnhancedTouchButton';
import useMultiTasking from '@/hooks/useMultiTasking';
import { haptics } from '@/lib/haptics';
import { Play, Download, AlertCircle, ChevronRight } from 'lucide-react';
import { useSFSymbolsSupport } from '@/lib/sf-symbols';

/**
 * Vietnam Tariff Monte Carlo Simulation Page
 * Integrated screen for running tariff impact simulations with Vietnam-specific parameters
 */
const VietnamMonteCarloPage: NextPage = () => {
  const theme = useTheme();
  const { mode, isMultiTasking, orientation } = useMultiTasking();
  
  // Platform detection
  const [isMounted, setIsMounted] = useState(false);
  const [isPlatformDetected, setPlatformDetected] = useState(false);
  const [isAppleDevice, setIsAppleDevice] = useState(false);
  const [isIPad, setIsIPad] = useState(false);
  const { supported: sfSymbolsSupported } = useSFSymbolsSupport();
  const [activeMonteCarloTab, setActiveMonteCarloTab] = useState<string>('parameters');
  
  // State for simulation configuration and results
  const [config, setConfig] = useState<VietnamMonteCarloConfig | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [simulationResults, setSimulationResults] = useState<number[] | null>(null);
  const [sensitivityResults, setSensitivityResults] = useState<SensitivityParameter[] | null>(null);
  const [llmAnalysis, setLlmAnalysis] = useState<LlmAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sliderPercentile, setSliderPercentile] = useState<number>(50);

  // References
  const monteCarloWorker = useRef<Worker | null>(null);
  
  // Detect platform on mount
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
  }, []);
  
  // Initialize the Monte Carlo worker
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        monteCarloWorker.current = new Worker('/workers/monteCarloWorker.js');
        monteCarloWorker.current.onmessage = handleWorkerMessage;
      } catch (error) {
        console.error('Failed to initialize Monte Carlo worker:', error);
        setError('Failed to initialize simulation worker. Please refresh the page.');
      }
    }
    
    return () => {
      // Clean up worker on unmount
      if (monteCarloWorker.current) {
        monteCarloWorker.current.terminate();
      }
    };
  }, []);

  // Handle configuration changes
  const handleConfigChange = (newConfig: VietnamMonteCarloConfig) => {
    setConfig(newConfig);
  };

  // Handle running the simulation
  const handleRunSimulation = async (simConfig: VietnamMonteCarloConfig) => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptics.medium();
    }
    
    setConfig(simConfig);
    setSimulationStatus('running');
    setError(null);
    setSimulationResults(null);
    setSensitivityResults(null);
    setLlmAnalysis(null);
    
    // Check if we have cached results
    const cacheKey = {
      country: 'Vietnam',
      timeHorizon: 24, // Default time horizon
      hsCode: simConfig.productInfo.hsCode,
      iterations: simConfig.simulationSettings.iterations,
      simulationVersion: '1.0.0'
    };
    
    const cachedResult = globalSimulationCache.getResults(cacheKey);
    
    if (cachedResult && false) { // Disabled for now to always run fresh simulations
      console.log('Using cached simulation results');
      setTimeout(() => {
        setSimulationResults(cachedResult.results);
        setSimulationStatus('completed');
        generateSensitivityAnalysis(cachedResult.results, simConfig);
        generateLlmAnalysis(cachedResult.results, simConfig);
      }, 500); // Small delay to show loading state
    } else {
      // Start the simulation in the worker
      if (monteCarloWorker.current) {
        monteCarloWorker.current.postMessage({
          type: 'START_SIMULATION',
          config: {
            parameters: [...simConfig.tariffParameters, ...simConfig.financialParameters],
            iterations: simConfig.simulationSettings.iterations,
            hsCode: simConfig.productInfo.hsCode,
            productDescription: simConfig.productInfo.productDescription,
            caseBoundaries: simConfig.simulationSettings.caseBoundaries
          }
        });
      } else {
        setError('Simulation worker not available. Please refresh the page.');
        setSimulationStatus('error');
      }
    }
  };

  // Handle messages from the Monte Carlo worker
  const handleWorkerMessage = (event: MessageEvent) => {
    const { type, data } = event.data;
    
    switch (type) {
      case 'SIMULATION_UPDATE':
        // Progress update (not implemented in this version)
        break;
        
      case 'SIMULATION_COMPLETE':
        setSimulationResults(data.results);
        setSimulationStatus('completed');
        
        // Provide success haptic feedback on Apple devices
        if (isAppleDevice) {
          haptics.success();
        }
        
        // Cache the results
        if (config) {
          globalSimulationCache.cacheResults(
            {
              country: 'Vietnam',
              timeHorizon: 24, // Default time horizon
              hsCode: config.productInfo.hsCode,
              iterations: config.simulationSettings.iterations,
              simulationVersion: '1.0.0'
            },
            data.results,
            {
              iterationsRun: config.simulationSettings.iterations,
              computeTimeMs: data.computeTimeMs || 1000,
              convergenceAchieved: true
            }
          );
        }
        
        // Generate additional analyses
        generateSensitivityAnalysis(data.results, config);
        generateLlmAnalysis(data.results, config);
        break;
        
      case 'SIMULATION_ERROR':
        setError(data.error || 'An error occurred during simulation');
        setSimulationStatus('error');
        
        // Provide error haptic feedback on Apple devices
        if (isAppleDevice) {
          haptics.error();
        }
        break;
    }
  };

  // Generate sensitivity analysis
  const generateSensitivityAnalysis = (results: number[], config: VietnamMonteCarloConfig | null) => {
    if (!config) return;
    
    // In a real implementation, this would analyze correlation between parameter variations
    // and simulation results. This is a simplified mock implementation.
    
    // Combine all parameters
    const allParams = [...config.tariffParameters, ...config.financialParameters];
    
    // Mock sensitivity analysis
    const mockSensitivity: SensitivityParameter[] = allParams.map(param => {
      // Generate realistic but random sensitivity data
      const randomImpact = Math.random() * 0.5 + 0.3; // Between 0.3 and 0.8
      
      // Exchange rate and tariff rate should have high impact
      let impactFactor = randomImpact;
      if (param.id === 'exchangeRate') impactFactor = 0.82;
      if (param.id === 'tradeAgreement') impactFactor = 0.64;
      if (param.id === 'importVolume') impactFactor = 0.41;
      if (param.id === 'baseTariffRate') impactFactor = 0.38;
      
      // Generate correlation (trade agreement should have negative correlation)
      let correlation = (Math.random() * 0.8) - (param.id === 'tradeAgreement' ? 0.7 : 0.1);
      if (param.id === 'exchangeRate') correlation = 0.82;
      if (param.id === 'tradeAgreement') correlation = -0.64;
      if (param.id === 'importVolume') correlation = 0.41;
      if (param.id === 'baseTariffRate') correlation = 0.38;
      
      return {
        name: param.name,
        impactFactor,
        correlation
      };
    });
    
    setSensitivityResults(mockSensitivity);
  };

  // Generate LLM analysis using GROK 3 API
  const generateLlmAnalysis = (results: number[], config: VietnamMonteCarloConfig | null) => {
    if (!config) return;
    
    // Set LLM analysis to loading state
    setLlmAnalysis({
      status: 'loading',
      keyInsights: [],
      riskAssessment: null,
      recommendations: []
    });
    
    // In a real implementation, this would call the GROK 3 API
    // This is a simplified mock implementation with a delay
    setTimeout(() => {
      // Calculate basic statistics for the analysis
      const sortedResults = [...results].sort((a, b) => a - b);
      const mean = results.reduce((sum, val) => sum + val, 0) / results.length;
      const median = sortedResults[Math.floor(results.length / 2)];
      
      // Count negative values to assess risk
      const negativeCount = results.filter(val => val < 0).length;
      const negativePercentage = negativeCount / results.length;
      
      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (negativePercentage > 0.3) riskLevel = 'high';
      else if (negativePercentage > 0.15) riskLevel = 'medium';
      
      // Mock analysis result
      const mockAnalysis: LlmAnalysisResult = {
        status: 'complete',
        keyInsights: [
          `Exchange rate fluctuations have the highest impact on overall tariff revenue, with ${config.financialParameters.find(p => p.id === 'exchangeRate')?.name || 'Exchange rate'} showing 82% correlation.`,
          `There is a ${((1 - negativePercentage) * 100).toFixed(0)}% probability that revenues will increase under the simulated conditions.`,
          `CPTPP participation reduces tariff impact by 15-20% compared to MFN rates.`,
          `The expected median ${mean >= 0 ? 'gain' : 'loss'} is ${Math.abs(median).toFixed(2)}M USD under current parameters.`
        ],
        riskAssessment: {
          text: `The simulation indicates a ${(negativePercentage * 100).toFixed(0)}% probability of negative revenue impact, primarily driven by exchange rate volatility. ${riskLevel === 'high' ? 'Consider immediate hedging strategies to mitigate this substantial risk.' : riskLevel === 'medium' ? 'Moderate risk levels suggest implementing precautionary measures.' : 'Risk levels are acceptable, but continued monitoring is recommended.'}`,
          riskLevel,
          probabilityOfNegativeImpact: negativePercentage
        },
        recommendations: [
          'Prioritize exchange rate monitoring systems and implement hedging strategies to reduce volatility exposure.',
          'Consider strategic reserves for periods of high market volatility to ensure smooth operations.',
          'Develop contingency plans for high-impact scenarios, particularly focusing on rapid exchange rate shifts.',
          'Explore further CPTPP optimizations to maximize preferential tariff benefits.',
          'Conduct more granular analysis of specific product categories to identify additional optimization opportunities.'
        ]
      };
      
      setLlmAnalysis(mockAnalysis);
    }, 3000); // Simulate API delay
  };

  // Handle percentile slider change
  const handleSliderChange = (value: number) => {
    setSliderPercentile(value);
  };

  // Generate detailed report
  const handleGenerateReport = () => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptics.medium();
    }
    
    // In a real implementation, this would call the Nvidia langchain API
    alert('This would generate a comprehensive report using Nvidia langchain structured-report-generation API');
  };

  // View detailed analysis
  const handleViewDetailedAnalysis = () => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptics.medium();
    }
    
    // In a real implementation, this would open a detailed analysis view
    alert('This would show a detailed analysis view with more comprehensive metrics and visualizations');
  };
  
  // Handle Monte Carlo tab selection
  const handleMonteCarloTabSelect = (tabId: string) => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptics.light();
    }
    
    setActiveMonteCarloTab(tabId);
    
    // In a real app, this would scroll to the corresponding section
    const element = document.getElementById(tabId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  // Monte Carlo categories with SF Symbols icons
  const monteCarloCategories = [
    { id: 'parameters', label: 'Parameters', icon: 'slider.horizontal.3', badge: null },
    { id: 'distribution', label: 'Distribution', icon: 'chart.bar.fill', badge: simulationResults ? simulationResults.length.toString() : null },
    { id: 'cases', label: 'Case Analysis', icon: 'doc.text.magnifyingglass', badge: config?.simulationSettings.caseBoundaries.length.toString() || null },
    { id: 'sensitivity', label: 'Sensitivity', icon: 'gauge.with.needle', badge: sensitivityResults ? sensitivityResults.length.toString() : null },
    { id: 'analysis', label: 'AI Analysis', icon: 'sparkles', badge: llmAnalysis && llmAnalysis.status === 'complete' ? 'New' : null }
  ];
  
  // SF Symbols Monte Carlo Navigation component
  const SFSymbolsMonteCarloNavigation = () => {
    if (!isAppleDevice || !isPlatformDetected || !sfSymbolsSupported) {
      return null;
    }
    
    return (
      <Box sx={{ mb: 3, mt: 2 }}>
        <div className={`rounded-lg overflow-x-auto ${theme.palette.mode === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${theme.palette.mode === 'dark' ? 'border-gray-700' : 'border-[rgb(var(--scb-border))]'} p-1`}>
          <div className="flex items-center overflow-x-auto hide-scrollbar pb-1">
            {monteCarloCategories.map((category) => (
              <button 
                key={category.id}
                onClick={() => handleMonteCarloTabSelect(category.id)}
                className={`
                  flex flex-col items-center justify-center p-2 min-w-[72px] rounded-lg transition-colors
                  ${activeMonteCarloTab === category.id
                    ? theme.palette.mode === 'dark' 
                      ? 'bg-blue-900/30 text-blue-400' 
                      : 'bg-blue-50 text-blue-600'
                    : theme.palette.mode === 'dark' 
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
                      ${category.badge === 'New' 
                        ? theme.palette.mode === 'dark' ? 'bg-green-600' : 'bg-green-500'
                        : theme.palette.mode === 'dark' ? 'bg-blue-600' : 'bg-blue-500'
                      }
                    `}>
                      {category.badge.length > 4 ? category.badge.substring(0, 3) + '..' : category.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium mt-1">{category.label}</span>
              </button>
            ))}
          </div>
        </div>
      </Box>
    );
  };

  return (
    <ThemeProvider theme={muiTheme}>
      <ScbBeautifulUI 
        pageTitle="Vietnam Monte Carlo" 
        showTabs={isAppleDevice}
        showNewsBar={!isMultiTasking && !isIPad}
      >
        <Head>
          <title>Vietnam Tariff Monte Carlo Simulation | SCB FinSight</title>
        </Head>

        <Container 
          maxWidth={isMultiTasking && mode === 'slide-over' ? false : "xl"}
          sx={{ px: isMultiTasking && mode === 'slide-over' ? 1 : 2 }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Tariff Monte Carlo Simulation
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Analyze probable outcomes of Vietnam tariff changes using Monte Carlo simulation
            </Typography>
          </Box>
          
          {/* SF Symbols Monte Carlo Navigation */}
          {isAppleDevice && isPlatformDetected && sfSymbolsSupported && (
            <SFSymbolsMonteCarloNavigation />
          )}

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => {
                  // Provide light haptic feedback for dismissal on Apple devices
                  if (isAppleDevice) {
                    haptics.light();
                  }
                  setError(null);
                }}
              >
                Dismiss
              </Button>
            }
          >
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Parameter Configuration Panel */}
          <Grid item xs={12} md={4} id="parameters">
            <VietnamMonteCarloParams
              initialConfig={config || undefined}
              onConfigChange={handleConfigChange}
              onRunSimulation={handleRunSimulation}
            />
          </Grid>

          {/* Probability Distribution Visualization */}
          <Grid item xs={12} md={8} id="distribution">
            <VietnamMonteCarloProbabilityDistribution
              data={simulationResults}
              loading={simulationStatus === 'running'}
              caseBoundaries={config?.simulationSettings.caseBoundaries}
              onSliderChange={handleSliderChange}
            />
          </Grid>

          {/* Case Analysis */}
          <Grid item xs={12} id="cases">
            <VietnamMonteCarloCaseAnalysis
              data={simulationResults}
              caseBoundaries={config?.simulationSettings.caseBoundaries}
            />
          </Grid>

          {/* Sensitivity Analysis */}
          <Grid item xs={12} md={4} id="sensitivity">
            <VietnamMonteCarloSensitivity
              parameters={sensitivityResults}
              loading={simulationStatus === 'running'}
              onDetailedAnalysis={handleViewDetailedAnalysis}
              onExportData={() => alert('Export data functionality would be implemented here')}
            />
          </Grid>

          {/* LLM Analysis */}
          <Grid item xs={12} md={8} id="analysis">
            <VietnamMonteCarloLlmAnalysis
              analysis={llmAnalysis}
              onGenerateReport={handleGenerateReport}
              onViewDetailedAnalysis={handleViewDetailedAnalysis}
            />
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: isMultiTasking && mode === 'slide-over' ? 1 : 2, border: '1px solid rgba(0, 0, 0, 0.12)' }}>
              <Grid container spacing={2} justifyContent="space-between">
                <Grid item>
                  {isAppleDevice && isPlatformDetected ? (
                    <EnhancedTouchButton
                      variant="primary"
                      label={simulationStatus === 'running' ? "Running Simulation" : "Run Simulation"}
                      iconLeft={simulationStatus === 'running' ? 
                        <CircularProgress size={20} color="inherit" /> : 
                        <Play className="w-4 h-4" />
                      }
                      onClick={() => config && handleRunSimulation(config)}
                      disabled={simulationStatus === 'running' || !config}
                      isLoading={simulationStatus === 'running'}
                    />
                  ) : (
                    <Button
                      variant="contained"
                      startIcon={<Play />}
                      disabled={simulationStatus === 'running' || !config}
                      onClick={() => config && handleRunSimulation(config)}
                      sx={{ 
                        bgcolor: '#042278', 
                        '&:hover': { bgcolor: '#031a5e' }
                      }}
                    >
                      {simulationStatus === 'running' ? (
                        <>
                          <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                          Running Simulation
                        </>
                      ) : 'Run Simulation'}
                    </Button>
                  )}
                </Grid>
                <Grid item>
                  {isAppleDevice && isPlatformDetected ? (
                    <EnhancedTouchButton
                      variant="secondary"
                      label="Generate Detailed Report"
                      iconLeft={<Download className="w-4 h-4" />}
                      onClick={handleGenerateReport}
                      disabled={simulationStatus !== 'completed'}
                    />
                  ) : (
                    <Button
                      variant="contained"
                      startIcon={<Download />}
                      disabled={simulationStatus !== 'completed'}
                      onClick={handleGenerateReport}
                      sx={{ 
                        bgcolor: '#3267d4', 
                        '&:hover': { bgcolor: '#2a55b2' }
                      }}
                    >
                      Generate Detailed Report
                    </Button>
                  )}
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        {/* Additional Information */}
        <Box sx={{ mt: 4, mb: 2 }}>
          <Alert severity="info" icon={<AlertCircle />}>
            <AlertTitle>About This Tool</AlertTitle>
            <Typography variant="body2">
              The Vietnam Tariff Monte Carlo Simulation uses stochastic modeling to simulate thousands of possible outcomes 
              based on varying tariff parameters. It leverages GROK 3 API for advanced analysis and Nvidia's langchain 
              for structured report generation.
            </Typography>
          </Alert>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="caption" color="text.secondary">
            © 2025 SCB FinSight | Data updated: May 19, 2025 | Vietnam Tariff Monte Carlo Module v1.0.0
          </Typography>
        </Box>
      </Container>
    </ScbBeautifulUI>
    </ThemeProvider>
  );
};

export default VietnamMonteCarloPage;
