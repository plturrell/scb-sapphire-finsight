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
  useTheme,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent
} from '@mui/material';
import DashboardLayout from '../components/layout/DashboardLayout';
import VietnamMonteCarloParams, { VietnamMonteCarloConfig } from '../components/VietnamMonteCarloParams';
import VietnamMonteCarloProbabilityDistribution from '../components/VietnamMonteCarloProbabilityDistribution';
import VietnamMonteCarloCaseAnalysis from '../components/VietnamMonteCarloCaseAnalysis';
import VietnamMonteCarloSensitivity, { SensitivityParameter } from '../components/VietnamMonteCarloSensitivity';
import VietnamMonteCarloLlmAnalysis, { LlmAnalysisResult } from '../components/VietnamMonteCarloLlmAnalysis';
import { globalSimulationCache } from '../services/SimulationCache';
import { Play, Download, AlertCircle, Database, RefreshCw } from 'lucide-react';
import { SimulationInput, SimulationOutput, UUID } from '../types/MonteCarloTypes';
import vietnamMonteCarloAdapter from '../services/VietnamMonteCarloAdapter';

/**
 * Vietnam Tariff Monte Carlo Simulation Page with Data Products Integration
 * Integrated screen for running tariff impact simulations using data from SAP Business Data Cloud
 */
const VietnamMonteCarloDataProducts: NextPage = () => {
  const theme = useTheme();
  
  // State for simulation configuration and results
  const [config, setConfig] = useState<VietnamMonteCarloConfig | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [simulationResults, setSimulationResults] = useState<number[] | null>(null);
  const [sensitivityResults, setSensitivityResults] = useState<SensitivityParameter[] | null>(null);
  const [llmAnalysis, setLlmAnalysis] = useState<LlmAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sliderPercentile, setSliderPercentile] = useState<number>(50);

  // Data Products integration state
  const [dataProductInputs, setDataProductInputs] = useState<SimulationInput[]>([]);
  const [selectedInputId, setSelectedInputId] = useState<string>('');
  const [isLoadingDataProducts, setIsLoadingDataProducts] = useState<boolean>(false);
  const [dataProductsLoaded, setDataProductsLoaded] = useState<boolean>(false);

  // References
  const monteCarloWorker = useRef<Worker | null>(null);
  
  // Initialize the Monte Carlo worker and load data products
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
    
    // Load data products on initial mount
    loadDataProducts();
    
    return () => {
      // Clean up worker on unmount
      if (monteCarloWorker.current) {
        monteCarloWorker.current.terminate();
      }
    };
  }, []);

  // Load simulation inputs from data products
  const loadDataProducts = async () => {
    setIsLoadingDataProducts(true);
    setError(null);
    
    try {
      const response = await fetch('/api/monte-carlo/data-products?action=inputs');
      
      if (!response.ok) {
        throw new Error(`Failed to load data products: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.inputs && Array.isArray(data.inputs)) {
        setDataProductInputs(data.inputs);
        setDataProductsLoaded(true);
        
        // If there are inputs, select the first one by default
        if (data.inputs.length > 0) {
          setSelectedInputId(data.inputs[0].id);
          // Convert the first input to component config format
          const componentConfig = vietnamMonteCarloAdapter.convertToComponentConfig(data.inputs[0]);
          setConfig(componentConfig);
        }
      } else {
        setError('Failed to load data products: Invalid response format');
      }
    } catch (error) {
      console.error('Error loading data products:', error);
      setError(`Failed to load data products: ${(error as Error).message}`);
    } finally {
      setIsLoadingDataProducts(false);
    }
  };

  // Handle selected data product change
  const handleDataProductChange = (event: SelectChangeEvent<string>) => {
    const newInputId = event.target.value;
    setSelectedInputId(newInputId);
    
    // Find the selected input
    const selectedInput = dataProductInputs.find(input => input.id === newInputId);
    
    if (selectedInput) {
      // Convert to component config
      const componentConfig = vietnamMonteCarloAdapter.convertToComponentConfig(selectedInput);
      setConfig(componentConfig);
      
      // Reset simulation state
      setSimulationStatus('idle');
      setSimulationResults(null);
      setSensitivityResults(null);
      setLlmAnalysis(null);
    }
  };

  // Handle configuration changes
  const handleConfigChange = (newConfig: VietnamMonteCarloConfig) => {
    setConfig(newConfig);
  };

  // Handle running the simulation from data product
  const handleRunSimulationFromDataProduct = async () => {
    if (!selectedInputId) {
      setError('Please select a data product input first');
      return;
    }
    
    setSimulationStatus('running');
    setError(null);
    setSimulationResults(null);
    setSensitivityResults(null);
    setLlmAnalysis(null);
    
    try {
      const response = await fetch(`/api/monte-carlo/data-products?action=run&inputId=${selectedInputId}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to run simulation: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.output) {
        const output = data.output as SimulationOutput;
        
        // Process simulation results
        if (output.results && output.results.rawResults) {
          setSimulationResults(output.results.rawResults);
          
          // Generate sensitivity analysis from the output
          const sensitivityParams: SensitivityParameter[] = output.results.sensitivityAnalysis.map(item => ({
            name: item.parameter,
            impactFactor: item.impact,
            correlation: item.correlation
          }));
          setSensitivityResults(sensitivityParams);
          
          // Process LLM analysis
          if (output.llmAnalysis) {
            setLlmAnalysis({
              status: 'complete',
              keyInsights: output.llmAnalysis.insights,
              riskAssessment: output.llmAnalysis.riskAssessment ? {
                text: output.llmAnalysis.riskAssessment.text,
                riskLevel: output.llmAnalysis.riskAssessment.riskLevel,
                probabilityOfNegativeImpact: output.llmAnalysis.riskAssessment.probabilityOfNegativeImpact
              } : null,
              recommendations: output.llmAnalysis.recommendations
            });
          }
          
          setSimulationStatus('completed');
        } else {
          throw new Error('Simulation completed but returned no results');
        }
      } else {
        throw new Error(data.message || 'Failed to run simulation');
      }
    } catch (error) {
      console.error('Error running simulation from data product:', error);
      setError(`Failed to run simulation: ${(error as Error).message}`);
      setSimulationStatus('error');
    }
  };

  // Handle running the simulation with workers (local simulation)
  const handleRunSimulation = async (simConfig: VietnamMonteCarloConfig) => {
    setConfig(simConfig);
    setSimulationStatus('running');
    setError(null);
    setSimulationResults(null);
    setSensitivityResults(null);
    setLlmAnalysis(null);
    
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

  // Save current configuration as data product
  const handleSaveAsDataProduct = async () => {
    if (!config) {
      setError('No configuration to save');
      return;
    }
    
    try {
      // Convert component config to storage model
      const storageModel = vietnamMonteCarloAdapter.convertToStorageModel(config, 'user');
      
      // Post to data products API
      const response = await fetch('/api/monte-carlo/data-products?action=inputs/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ input: storageModel })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save data product: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Reload data products
        await loadDataProducts();
        // Set the selected input to the newly created one
        setSelectedInputId(storageModel.id);
      } else {
        throw new Error(data.message || 'Failed to save data product');
      }
    } catch (error) {
      console.error('Error saving data product:', error);
      setError(`Failed to save data product: ${(error as Error).message}`);
    }
  };

  // Handle percentile slider change
  const handleSliderChange = (value: number) => {
    setSliderPercentile(value);
  };

  // Generate detailed report
  const handleGenerateReport = () => {
    // In a real implementation, this would call the Nvidia langchain API
    alert('This would generate a comprehensive report using Nvidia langchain structured-report-generation API');
  };

  // View detailed analysis
  const handleViewDetailedAnalysis = () => {
    // In a real implementation, this would open a detailed analysis view
    alert('This would show a detailed analysis view with more comprehensive metrics and visualizations');
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Vietnam Tariff Monte Carlo Simulation | SCB FinSight</title>
      </Head>

      <Container maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Tariff Monte Carlo Simulation
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Data Products Integration - Analyze probable outcomes of Vietnam tariff changes
          </Typography>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => setError(null)}
              >
                Dismiss
              </Button>
            }
          >
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        )}

        {/* Data Products Selection Panel */}
        <Paper sx={{ p: 3, mb: 3, border: `1px solid ${theme.palette.divider}` }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="center">
                <Database size={24} color="#042278" style={{ marginRight: 12 }} />
                <Typography variant="h6">Data Products Integration</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Select a simulation input from SAP Business Data Cloud
              </Typography>
            </Grid>
            <Grid item xs={12} md={5}>
              <FormControl fullWidth>
                <InputLabel id="data-product-select-label">Simulation Input</InputLabel>
                <Select
                  labelId="data-product-select-label"
                  id="data-product-select"
                  value={selectedInputId}
                  label="Simulation Input"
                  onChange={handleDataProductChange}
                  disabled={isLoadingDataProducts || dataProductInputs.length === 0}
                >
                  {dataProductInputs.map((input) => (
                    <MenuItem key={input.id} value={input.id}>
                      {input.name} ({input.parameters.tariffSpecificParameters.hsCodes[0]})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box display="flex" justifyContent="flex-end">
                <Button
                  variant="outlined"
                  startIcon={<RefreshCw />}
                  onClick={loadDataProducts}
                  disabled={isLoadingDataProducts}
                  sx={{ mr: 1 }}
                >
                  {isLoadingDataProducts ? (
                    <>
                      <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                      Loading...
                    </>
                  ) : 'Refresh'}
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSaveAsDataProduct}
                  disabled={!config || simulationStatus === 'running'}
                >
                  Save As Data Product
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={3}>
          {/* Parameter Configuration Panel */}
          <Grid item xs={12} md={4}>
            <VietnamMonteCarloParams
              initialConfig={config || undefined}
              onConfigChange={handleConfigChange}
              onRunSimulation={handleRunSimulation}
            />
          </Grid>

          {/* Probability Distribution Visualization */}
          <Grid item xs={12} md={8}>
            <VietnamMonteCarloProbabilityDistribution
              data={simulationResults}
              loading={simulationStatus === 'running'}
              caseBoundaries={config?.simulationSettings.caseBoundaries}
              onSliderChange={handleSliderChange}
            />
          </Grid>

          {/* Case Analysis */}
          <Grid item xs={12}>
            <VietnamMonteCarloCaseAnalysis
              data={simulationResults}
              caseBoundaries={config?.simulationSettings.caseBoundaries}
            />
          </Grid>

          {/* Sensitivity Analysis */}
          <Grid item xs={12} md={4}>
            <VietnamMonteCarloSensitivity
              parameters={sensitivityResults}
              loading={simulationStatus === 'running'}
              onDetailedAnalysis={handleViewDetailedAnalysis}
              onExportData={() => alert('Export data functionality would be implemented here')}
            />
          </Grid>

          {/* LLM Analysis */}
          <Grid item xs={12} md={8}>
            <VietnamMonteCarloLlmAnalysis
              analysis={llmAnalysis}
              onGenerateReport={handleGenerateReport}
              onViewDetailedAnalysis={handleViewDetailedAnalysis}
            />
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
              <Grid container spacing={2} justifyContent="space-between">
                <Grid item>
                  <Button
                    variant="contained"
                    startIcon={<Database />}
                    disabled={simulationStatus === 'running' || !selectedInputId}
                    onClick={handleRunSimulationFromDataProduct}
                    sx={{ 
                      bgcolor: '#042278', 
                      '&:hover': { bgcolor: '#031a5e' },
                      mr: 2
                    }}
                  >
                    {simulationStatus === 'running' ? (
                      <>
                        <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                        Running Data Product Simulation
                      </>
                    ) : 'Run Data Product Simulation'}
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Play />}
                    disabled={simulationStatus === 'running' || !config}
                    onClick={() => config && handleRunSimulation(config)}
                    sx={{ 
                      bgcolor: '#3267d4', 
                      '&:hover': { bgcolor: '#2a55b2' }
                    }}
                  >
                    {simulationStatus === 'running' ? (
                      <>
                        <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                        Running Local Simulation
                      </>
                    ) : 'Run Local Simulation'}
                  </Button>
                </Grid>
                <Grid item>
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
              based on varying tariff parameters. This version integrates with SAP Business Data Cloud for enhanced data sharing 
              and collaborative analysis across the organization.
            </Typography>
          </Alert>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="caption" color="text.secondary">
            © 2025 SCB FinSight | Data updated: May 20, 2025 | Vietnam Tariff Monte Carlo Module v1.1.0 with Data Products Integration
          </Typography>
        </Box>
      </Container>
    </DashboardLayout>
  );
};

export default VietnamMonteCarloDataProducts;