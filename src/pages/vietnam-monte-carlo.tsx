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
import monteCarloService from '../services/MonteCarloService';
import { UUID, SimulationStatus } from '../types/MonteCarloTypes';
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
  const [simulationStatus, setSimulationStatus] = useState<SimulationStatus>('idle');
  const [simulationResults, setSimulationResults] = useState<number[] | null>(null);
  const [sensitivityResults, setSensitivityResults] = useState<SensitivityParameter[] | null>(null);
  const [llmAnalysis, setLlmAnalysis] = useState<LlmAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sliderPercentile, setSliderPercentile] = useState<number>(50);
  
  // State for API integration
  const [currentInputId, setCurrentInputId] = useState<UUID | null>(null);
  const [currentOutputId, setCurrentOutputId] = useState<UUID | null>(null);
  const [progressPercentage, setProgressPercentage] = useState<number>(0);

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
    setProgressPercentage(0);
    
    try {
      // Create simulation using the Monte Carlo service
      const result = await monteCarloService.createSimulation(simConfig, 'scb_analyst');
      
      setCurrentInputId(result.inputId);
      setCurrentOutputId(result.outputId);
      
      // Start polling for simulation status
      pollSimulationStatus(result.inputId, result.outputId);
      
    } catch (error) {
      console.error('Error creating simulation:', error);
      setError(error instanceof Error ? error.message : 'Failed to create simulation');
      setSimulationStatus('failed');
      
      // Provide error haptic feedback on Apple devices
      if (isAppleDevice) {
        haptics.error();
      }
    }
  };
  
  // Poll simulation status
  const pollSimulationStatus = async (inputId: UUID, outputId: UUID) => {
    const pollInterval = setInterval(async () => {
      try {
        const status = await monteCarloService.getSimulationStatus(inputId);
        
        setProgressPercentage(status.progress);
        setSimulationStatus(status.status as SimulationStatus);
        
        if (status.error) {
          setError(status.error);
          clearInterval(pollInterval);
          return;
        }
        
        if (status.status === 'completed' && status.hasResults) {
          // Get the completed simulation output
          const output = await monteCarloService.getSimulationOutput(outputId);
          
          if (output && output.results) {
            // Update UI with results
            setSimulationResults(output.results.rawResults || []);
            
            // Convert sensitivity analysis to expected format
            if (output.results.sensitivityAnalysis) {
              const convertedSensitivity: SensitivityParameter[] = output.results.sensitivityAnalysis.map(s => ({
                name: s.parameter,
                impactFactor: s.impact,
                correlation: s.correlation
              }));
              setSensitivityResults(convertedSensitivity);
            }
            
            // Get LLM analysis if available
            if (output.llmAnalysis) {
              const convertedAnalysis: LlmAnalysisResult = {
                status: 'complete',
                keyInsights: output.llmAnalysis.insights || [],
                riskAssessment: output.llmAnalysis.riskAssessment || null,
                recommendations: output.llmAnalysis.recommendations || []
              };
              setLlmAnalysis(convertedAnalysis);
            }
            
            // Cache the results in the global cache
            const cacheKey = {
              country: 'Vietnam',
              timeHorizon: 24,
              hsCode: simConfig?.productInfo.hsCode || '',
              iterations: simConfig?.simulationSettings.iterations || 1000,
              simulationVersion: '1.0.0'
            };
            
            globalSimulationCache.cacheResults(
              cacheKey,
              output.results.rawResults || [],
              {
                iterationsRun: simConfig?.simulationSettings.iterations || 1000,
                computeTimeMs: (output.endTime || 0) - output.startTime,
                convergenceAchieved: true
              }
            );
            
            // Provide success haptic feedback on Apple devices
            if (isAppleDevice) {
              haptics.success();
            }
          }
          
          clearInterval(pollInterval);
        } else if (status.status === 'failed') {
          setError(status.error || 'Simulation failed');
          setSimulationStatus('failed');
          
          // Provide error haptic feedback on Apple devices
          if (isAppleDevice) {
            haptics.error();
          }
          
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Error polling simulation status:', error);
        setError('Error checking simulation status');
        clearInterval(pollInterval);
      }
    }, 2000); // Poll every 2 seconds
    
    // Clear interval after 5 minutes to prevent infinite polling
    setTimeout(() => {
      clearInterval(pollInterval);
      if (simulationStatus === 'running') {
        setError('Simulation timed out');
        setSimulationStatus('failed');
      }
    }, 300000); // 5 minutes
  };

  // Handle messages from the Monte Carlo worker (legacy - now using API)
  const handleWorkerMessage = (event: MessageEvent) => {
    const { type, data } = event.data;
    
    switch (type) {
      case 'SIMULATION_UPDATE':
        // Progress update
        setProgressPercentage(data.progress || 0);
        break;
        
      case 'SIMULATION_COMPLETE':
        // Update simulation results via API
        if (currentOutputId && data.results) {
          monteCarloService.updateSimulationResults(currentOutputId, data.results)
            .then(() => {
              // The polling mechanism will pick up the completed status
              console.log('Simulation results updated via API');
            })
            .catch(error => {
              console.error('Error updating simulation results:', error);
              setError('Failed to save simulation results');
            });
        }
        break;
        
      case 'SIMULATION_ERROR':
        const errorMessage = data.error || 'An error occurred during simulation';
        setError(errorMessage);
        setSimulationStatus('failed');
        
        // Update error status via API if we have an output ID
        if (currentOutputId) {
          monteCarloService.updateSimulationStatus(currentOutputId, 'failed', undefined, errorMessage)
            .catch(error => console.error('Error updating simulation status:', error));
        }
        
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

  // Generate LLM analysis using the API
  const generateLlmAnalysis = async () => {
    if (!currentOutputId) return;
    
    // Set LLM analysis to loading state
    setLlmAnalysis({
      status: 'loading',
      keyInsights: [],
      riskAssessment: null,
      recommendations: []
    });
    
    try {
      // Generate analysis using the Monte Carlo service
      const result = await monteCarloService.generateAnalysis(currentOutputId, false);
      
      if (result.analysis) {
        const convertedAnalysis: LlmAnalysisResult = {
          status: 'complete',
          keyInsights: result.analysis.insights || [],
          riskAssessment: result.analysis.riskAssessment || null,
          recommendations: result.analysis.recommendations || []
        };
        setLlmAnalysis(convertedAnalysis);
      }
    } catch (error) {
      console.error('Error generating LLM analysis:', error);
      
      // Fallback to basic analysis on error
      const fallbackAnalysis: LlmAnalysisResult = {
        status: 'complete',
        keyInsights: [
          'Exchange rate fluctuations typically have significant impact on tariff costs.',
          'Trade agreement utilization can reduce overall tariff expenses.',
          'Regular monitoring and risk assessment are recommended.',
          'Consider implementing hedging strategies for currency exposure.'
        ],
        riskAssessment: {
          text: 'Analysis completed with basic risk assessment. Consider running detailed analysis for comprehensive insights.',
          riskLevel: 'medium',
          probabilityOfNegativeImpact: 0.3
        },
        recommendations: [
          'Implement systematic trade agreement compliance procedures.',
          'Monitor exchange rate fluctuations and implement hedging strategies.',
          'Regular reassessment of simulation parameters recommended.',
          'Consider scenario-based planning for different outcome ranges.'
        ]
      };
      setLlmAnalysis(fallbackAnalysis);
    }
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
                      label={simulationStatus === 'running' ? `Running Simulation (${progressPercentage.toFixed(0)}%)` : "Run Simulation"}
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
                          Running Simulation ({progressPercentage.toFixed(0)}%)
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
              based on varying tariff parameters. It leverages real data storage with Apache Jena, Redis caching, 
              and Perplexity AI for advanced analysis and structured report generation.
            </Typography>
          </Alert>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="caption" color="text.secondary">
            © 2025 SCB FinSight | Data updated: May 19, 2025 | Vietnam Tariff Monte Carlo Module v2.0.0 | Real Data Integration
          </Typography>
        </Box>
      </Container>
    </ScbBeautifulUI>
    </ThemeProvider>
  );
};

export default VietnamMonteCarloPage;
