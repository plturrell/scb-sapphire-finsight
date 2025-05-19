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
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import DashboardLayout from '../components/layout/DashboardLayout';
import VietnamMonteCarloParams, { VietnamMonteCarloConfig } from '../components/VietnamMonteCarloParams';
import VietnamMonteCarloProbabilityDistribution from '../components/VietnamMonteCarloProbabilityDistribution';
import VietnamMonteCarloCaseAnalysis from '../components/VietnamMonteCarloCaseAnalysis';
import VietnamMonteCarloSensitivity from '../components/VietnamMonteCarloSensitivity';
import VietnamMonteCarloLlmAnalysis from '../components/VietnamMonteCarloLlmAnalysis';
import VietnamMonteCarloHistory from '../components/VietnamMonteCarloHistory';
import { globalSimulationCache } from '../services/SimulationCache';
import monteCarloStorageService from '../services/MonteCarloStorageService';
import monteCarloComparisonService from '../services/MonteCarloComparisonService';
import vietnamMonteCarloAdapter from '../services/VietnamMonteCarloAdapter';
import businessDataCloudConnector from '../services/BusinessDataCloudConnector';
import { SimulationInput, SimulationOutput, SimulationComparison, UUID, SimulationStatus } from '../types/MonteCarloTypes';
import { Play, Download, AlertCircle, Save, History, Database, PanelRight, User, BarChart, RefreshCw } from 'lucide-react';

/**
 * Enhanced Vietnam Tariff Monte Carlo Simulation Page
 * Integrated screen with storage architecture and comparison capabilities
 * Based on the technical specification for SAP Business Data Cloud integration
 */
const VietnamMonteCarloEnhancedPage: NextPage = () => {
  const theme = useTheme();
  
  // State for simulation configuration and results
  const [config, setConfig] = useState<VietnamMonteCarloConfig | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<SimulationStatus>('idle');
  const [simulationResults, setSimulationResults] = useState<number[] | null>(null);
  const [sensitivityResults, setSensitivityResults] = useState<any[] | null>(null);
  const [llmAnalysis, setLlmAnalysis] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sliderPercentile, setSliderPercentile] = useState<number>(50);
  
  // State for storage and history
  const [currentSimulation, setCurrentSimulation] = useState<{
    input: SimulationInput | null;
    output: SimulationOutput | null;
  }>({
    input: null,
    output: null
  });
  const [saveDialogOpen, setSaveDialogOpen] = useState<boolean>(false);
  const [simulationName, setSimulationName] = useState<string>('');
  const [simulationDescription, setSimulationDescription] = useState<string>('');
  const [username, setUsername] = useState<string>('scb_analyst');
  const [activeTab, setActiveTab] = useState<string>('simulation');
  const [comparisonView, setComparisonView] = useState<SimulationComparison | null>(null);
  
  // References
  const monteCarloWorker = useRef<Worker | null>(null);
  
  // Initialize the Monte Carlo worker and Business Data Cloud connector
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Initialize Monte Carlo worker
        monteCarloWorker.current = new Worker('/workers/monteCarloWorker.js');
        monteCarloWorker.current.onmessage = handleWorkerMessage;
        
        // Initialize Business Data Cloud connector
        businessDataCloudConnector.initialize().then(() => {
          console.log('Business Data Cloud connector initialized successfully');
        }).catch(error => {
          console.error('Error initializing Business Data Cloud connector:', error);
          // Continue with local storage as fallback
        });
      } catch (error) {
        console.error('Failed to initialize simulation worker:', error);
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
    
    // If we're currently viewing a saved simulation, track parameter changes
    if (currentSimulation.input && config) {
      // Check for changes in parameters
      trackParameterChanges(currentSimulation.input.id, config, newConfig);
    }
  };
  
  // Track parameter changes for history
  const trackParameterChanges = async (
    simulationId: UUID,
    oldConfig: VietnamMonteCarloConfig,
    newConfig: VietnamMonteCarloConfig
  ) => {
    // Check tariff parameters
    for (const newParam of newConfig.tariffParameters) {
      const oldParam = oldConfig.tariffParameters.find(p => p.id === newParam.id);
      if (oldParam && JSON.stringify(oldParam.value) !== JSON.stringify(newParam.value)) {
        await vietnamMonteCarloAdapter.recordParameterChange(
          simulationId,
          newParam.id,
          oldParam.value,
          newParam.value,
          username
        );
      }
    }
    
    // Check financial parameters
    for (const newParam of newConfig.financialParameters) {
      const oldParam = oldConfig.financialParameters.find(p => p.id === newParam.id);
      if (oldParam && JSON.stringify(oldParam.value) !== JSON.stringify(newParam.value)) {
        await vietnamMonteCarloAdapter.recordParameterChange(
          simulationId,
          newParam.id,
          oldParam.value,
          newParam.value,
          username
        );
      }
    }
  };
  
  // Handle running the simulation
  const handleRunSimulation = async (simConfig: VietnamMonteCarloConfig) => {
    setConfig(simConfig);
    setSimulationStatus('running');
    setError(null);
    setSimulationResults(null);
    setSensitivityResults(null);
    setLlmAnalysis(null);
    
    // Create or update simulation input in storage
    let input: SimulationInput;
    if (currentSimulation.input) {
      // We're re-running an existing simulation
      input = currentSimulation.input;
    } else {
      // Create new simulation input
      input = vietnamMonteCarloAdapter.convertToStorageModel(simConfig, username);
      await monteCarloStorageService.saveSimulationInput(input);
    }
    
    // Create simulation output
    const output = vietnamMonteCarloAdapter.createOutputModel(
      input.id,
      'running',
      0
    );
    await monteCarloStorageService.saveSimulationOutput(output);
    
    // Update current simulation
    setCurrentSimulation({
      input,
      output
    });
    
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
        // Process cached results
        processSimulationResults(output.id, cachedResult.results);
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
        setSimulationStatus('failed');
      }
    }
  };
  
  // Handle messages from the Monte Carlo worker
  const handleWorkerMessage = (event: MessageEvent) => {
    const { type, data } = event.data;
    
    switch (type) {
      case 'SIMULATION_UPDATE':
        // Update progress
        if (currentSimulation.output) {
          monteCarloStorageService.updateSimulationOutput(
            currentSimulation.output.id,
            { progressPercentage: data.progress || 0 }
          );
        }
        break;
        
      case 'SIMULATION_COMPLETE':
        // Process simulation results
        if (currentSimulation.output) {
          processSimulationResults(currentSimulation.output.id, data.results);
        }
        break;
        
      case 'SIMULATION_ERROR':
        setError(data.error || 'An error occurred during simulation');
        setSimulationStatus('failed');
        
        // Update output status
        if (currentSimulation.output) {
          monteCarloStorageService.updateSimulationOutput(
            currentSimulation.output.id,
            { 
              status: 'failed',
              error: data.error || 'An error occurred during simulation'
            }
          );
        }
        break;
    }
  };
  
  // Process simulation results
  const processSimulationResults = async (outputId: UUID, results: number[]) => {
    try {
      // Update output with results
      const updatedOutput = await vietnamMonteCarloAdapter.updateOutputWithResults(
        outputId,
        results
      );
      
      if (updatedOutput && updatedOutput.results) {
        // Update UI state
        setSimulationStatus('completed');
        setSimulationResults(updatedOutput.results.rawResults || []);
        setSensitivityResults(updatedOutput.results.sensitivityAnalysis);
        
        // Generate LLM analysis
        const analysisResult = await vietnamMonteCarloAdapter.generateLlmAnalysis(outputId);
        if (analysisResult && analysisResult.llmAnalysis) {
          setLlmAnalysis({
            status: 'complete',
            keyInsights: analysisResult.llmAnalysis.insights || [],
            riskAssessment: analysisResult.llmAnalysis.riskAssessment || null,
            recommendations: analysisResult.llmAnalysis.recommendations || []
          });
        }
        
        // Update current simulation
        setCurrentSimulation(prev => ({
          ...prev,
          output: updatedOutput
        }));
        
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
            results,
            {
              iterationsRun: config.simulationSettings.iterations,
              computeTimeMs: (updatedOutput.endTime || 0) - updatedOutput.startTime,
              convergenceAchieved: true
            }
          );
        }
      }
    } catch (error) {
      console.error('Error processing simulation results:', error);
      setError('Error processing simulation results');
      setSimulationStatus('failed');
    }
  };
  
  // Handle percentile slider change
  const handleSliderChange = (value: number) => {
    setSliderPercentile(value);
  };
  
  // Handle save simulation
  const handleSaveSimulation = () => {
    if (currentSimulation.input && currentSimulation.output && currentSimulation.output.status === 'completed') {
      setSaveDialogOpen(true);
      
      // Set default name and description
      const hsCode = currentSimulation.input.parameters.tariffSpecificParameters.hsCodes[0] || '';
      setSimulationName(`Vietnam Tariff Impact - ${hsCode} - ${new Date().toLocaleDateString()}`);
      setSimulationDescription(`Monte Carlo simulation for Vietnam tariff impact on HS Code ${hsCode}`);
    }
  };
  
  // Handle save confirmation
  const handleSaveConfirm = async () => {
    if (!currentSimulation.input) return;
    
    try {
      // Update input with name and description
      const updatedInput = {
        ...currentSimulation.input,
        name: simulationName,
        description: simulationDescription
      };
      
      // Try to save to Business Data Cloud first
      let savedToBDC = false;
      try {
        await businessDataCloudConnector.saveSimulationInput(updatedInput);
        savedToBDC = true;
        console.log('Simulation saved to Business Data Cloud successfully');
      } catch (cloudError) {
        console.error('Error saving to Business Data Cloud, falling back to local storage', cloudError);
      }
      
      // If BDC save failed, save to local storage
      if (!savedToBDC) {
        await monteCarloStorageService.saveSimulationInput(updatedInput);
      }
      
      // Update current simulation
      setCurrentSimulation(prev => ({
        ...prev,
        input: updatedInput
      }));
      
      // Close dialog
      setSaveDialogOpen(false);
      
      // Show success message
      if (savedToBDC) {
        alert('Simulation saved successfully to Business Data Cloud');
      } else {
        alert('Simulation saved successfully to local storage');
      }
    } catch (error) {
      console.error('Error saving simulation:', error);
      setError('Error saving simulation');
    }
  };
  
  // Handle view saved simulation
  const handleViewSimulation = async (simulationId: string) => {
    try {
      // Try to get simulation input from Business Data Cloud first
      let input: SimulationInput | null = null;
      try {
        input = await businessDataCloudConnector.getSimulationInput(simulationId);
      } catch (cloudError) {
        console.log('Business Data Cloud retrieval failed, falling back to local storage', cloudError);
        // Fall back to local storage
        input = await monteCarloStorageService.getSimulationInput(simulationId);
      }
      
      if (!input) {
        throw new Error('Simulation not found');
      }
      
      // Get outputs for this input
      let outputs: SimulationOutput[] = [];
      try {
        // Try Business Data Cloud first
        outputs = await businessDataCloudConnector.getSimulationOutputs(simulationId);
        if (outputs.length === 0) {
          // If no results from BDC, fall back to local storage
          outputs = await monteCarloStorageService.listSimulationOutputs(simulationId);
        }
      } catch (cloudError) {
        console.log('Business Data Cloud outputs retrieval failed, falling back to local storage', cloudError);
        // Fall back to local storage
        outputs = await monteCarloStorageService.listSimulationOutputs(simulationId);
      }
      
      const completedOutputs = outputs.filter(o => o.status === 'completed');
      
      if (completedOutputs.length === 0) {
        throw new Error('No completed outputs found for this simulation');
      }
      
      // Sort by end time descending and take the most recent
      completedOutputs.sort((a, b) => (b.endTime || 0) - (a.endTime || 0));
      const output = completedOutputs[0];
      
      // Convert to component config
      const config = vietnamMonteCarloAdapter.convertToComponentConfig(input);
      setConfig(config);
      
      // Set simulation results
      if (output.results) {
        setSimulationStatus('completed');
        setSimulationResults(output.results.rawResults || []);
        setSensitivityResults(output.results.sensitivityAnalysis);
        
        // Set LLM analysis
        if (output.llmAnalysis) {
          setLlmAnalysis({
            status: 'complete',
            keyInsights: output.llmAnalysis.insights || [],
            riskAssessment: output.llmAnalysis.riskAssessment || null,
            recommendations: output.llmAnalysis.recommendations || []
          });
        }
      }
      
      // Update current simulation
      setCurrentSimulation({
        input,
        output
      });
      
      // Switch to simulation tab
      setActiveTab('simulation');
      
      // Display Business Data Cloud integration message
      console.log('Successfully loaded simulation from Business Data Cloud');
    } catch (error) {
      console.error('Error viewing simulation:', error);
      setError(`Error viewing simulation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Handle new simulation
  const handleNewSimulation = () => {
    // Reset state
    setConfig(null);
    setSimulationStatus('idle');
    setSimulationResults(null);
    setSensitivityResults(null);
    setLlmAnalysis(null);
    setError(null);
    setCurrentSimulation({
      input: null,
      output: null
    });
    
    // Switch to simulation tab
    setActiveTab('simulation');
  };
  
  // Handle view comparison
  const handleViewComparison = async (comparisonId: string) => {
    try {
      // Get comparison
      const comparison = await monteCarloStorageService.getSimulationComparison(comparisonId);
      if (!comparison) {
        throw new Error('Comparison not found');
      }
      
      // Set comparison view
      setComparisonView(comparison);
      
      // Switch to comparison tab
      setActiveTab('comparison');
    } catch (error) {
      console.error('Error viewing comparison:', error);
      setError(`Error viewing comparison: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };
  
  // Generate detailed report
  const handleGenerateReport = () => {
    // In a real implementation, this would call the Nvidia langchain API
    alert('This would generate a comprehensive report using Nvidia langchain structured-report-generation API');
  };
  
  // Render simulation tab content
  const renderSimulationTab = () => {
    return (
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
            onDetailedAnalysis={() => alert('Detailed analysis would be shown here')}
            onExportData={() => alert('Export data functionality would be implemented here')}
          />
        </Grid>

        {/* LLM Analysis */}
        <Grid item xs={12} md={8}>
          <VietnamMonteCarloLlmAnalysis
            analysis={llmAnalysis}
            onGenerateReport={handleGenerateReport}
            onViewDetailedAnalysis={() => alert('Detailed analysis would be shown here')}
          />
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
            <Grid container spacing={2} justifyContent="space-between">
              <Grid item>
                <Button
                  variant="contained"
                  startIcon={<Play />}
                  disabled={simulationStatus === 'running' || !config}
                  onClick={() => config && handleRunSimulation(config)}
                  sx={{ 
                    bgcolor: '#042278', 
                    '&:hover': { bgcolor: '#031a5e' },
                    mr: 1
                  }}
                >
                  {simulationStatus === 'running' ? (
                    <>
                      <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                      Running Simulation
                    </>
                  ) : 'Run Simulation'}
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Save />}
                  disabled={simulationStatus !== 'completed'}
                  onClick={handleSaveSimulation}
                  sx={{ mr: 1 }}
                >
                  Save Simulation
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<RefreshCw />}
                  onClick={handleNewSimulation}
                >
                  New Simulation
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
    );
  };
  
  // Render comparison tab content
  const renderComparisonTab = () => {
    if (!comparisonView) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            Select simulations to compare from the history tab
          </Typography>
        </Box>
      );
    }
    
    // In a real implementation, this would render a detailed comparison view
    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {comparisonView.name}
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 2 }}>
          {comparisonView.description || 'No description provided'}
        </Typography>
        
        <Paper elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Parameter Differences
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Parameter</TableCell>
                  <TableCell>Differences</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {comparisonView.comparisonResults.differenceMatrix.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.parameter}</TableCell>
                    <TableCell>
                      {item.differences.map((diff, i) => (
                        <Box key={i} sx={{ mb: 1 }}>
                          <Typography variant="body2">
                            {diff.percentageDifference > 0 ? '+' : ''}
                            {diff.percentageDifference.toFixed(1)}% 
                            ({diff.absoluteDifference.toFixed(2)})
                          </Typography>
                        </Box>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* More comparison details would be rendered here */}
        </Paper>
        
        <Button
          variant="contained"
          onClick={() => setActiveTab('history')}
          sx={{ bgcolor: '#042278' }}
        >
          Back to History
        </Button>
      </Box>
    );
  };
  
  // Render history tab content
  const renderHistoryTab = () => {
    return (
      <VietnamMonteCarloHistory
        onViewSimulation={handleViewSimulation}
        onCompare={handleViewComparison}
        onNewSimulation={handleNewSimulation}
      />
    );
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
            Analyze probable outcomes of Vietnam tariff changes using Monte Carlo simulation
          </Typography>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              aria-label="simulation tabs"
            >
              <Tab 
                icon={<BarChart size={16} />} 
                iconPosition="start"
                label="Simulation" 
                value="simulation"
              />
              <Tab 
                icon={<History size={16} />} 
                iconPosition="start"
                label="History" 
                value="history"
              />
              <Tab 
                icon={<PanelRight size={16} />} 
                iconPosition="start"
                label="Comparison" 
                value="comparison"
                disabled={!comparisonView}
              />
            </Tabs>
          </Box>
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
        
        {/* Current user indicator */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <User size={16} style={{ marginRight: '8px' }} />
          <Typography variant="body2" color="text.secondary">
            Logged in as: <strong>{username}</strong>
          </Typography>
          
          {currentSimulation.input && (
            <Box sx={{ ml: 3, display: 'flex', alignItems: 'center' }}>
              <Database size={16} style={{ marginRight: '8px' }} />
              <Typography variant="body2" color="text.secondary">
                Current simulation: <strong>{currentSimulation.input.name}</strong>
              </Typography>
            </Box>
          )}
        </Box>

        {/* Tab content */}
        <Box sx={{ mb: 4 }}>
          {activeTab === 'simulation' && renderSimulationTab()}
          {activeTab === 'history' && renderHistoryTab()}
          {activeTab === 'comparison' && renderComparisonTab()}
        </Box>

        {/* Additional Information */}
        <Box sx={{ mt: 4, mb: 2 }}>
          <Alert severity="info" icon={<AlertCircle />}>
            <AlertTitle>About This Tool</AlertTitle>
            <Typography variant="body2">
              The Vietnam Tariff Monte Carlo Simulation uses stochastic modeling to simulate thousands of possible outcomes 
              based on varying tariff parameters. It leverages GROK 3 API for advanced analysis and Nvidia's langchain 
              for structured report generation. All simulations are saved to the Business Data Cloud for future reference.
            </Typography>
          </Alert>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="caption" color="text.secondary">
            © 2025 SCB FinSight | Data updated: May 19, 2025 | Vietnam Tariff Monte Carlo Module v2.0.0
          </Typography>
        </Box>
        
        {/* Save Simulation Dialog */}
        <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
          <DialogTitle>Save Simulation</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Simulation Name"
              fullWidth
              variant="outlined"
              value={simulationName}
              onChange={(e) => setSimulationName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              value={simulationDescription}
              onChange={(e) => setSimulationDescription(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Created By"
              fullWidth
              variant="outlined"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <User size={16} />
                  </InputAdornment>
                ),
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSaveConfirm} 
              variant="contained"
              sx={{ bgcolor: '#042278' }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </DashboardLayout>
  );
};

export default VietnamMonteCarloEnhancedPage;
