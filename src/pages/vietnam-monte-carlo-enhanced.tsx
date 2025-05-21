import React, { useState, useEffect, useRef } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';
import EnhancedTouchButton from '@/components/EnhancedTouchButton';
import EnhancedLoadingSpinner from '@/components/EnhancedLoadingSpinner';
import VietnamMonteCarloParams, { VietnamMonteCarloConfig } from '@/components/VietnamMonteCarloParams';
import VietnamMonteCarloProbabilityDistribution from '@/components/VietnamMonteCarloProbabilityDistribution';
import VietnamMonteCarloCaseAnalysis from '@/components/VietnamMonteCarloCaseAnalysis';
import VietnamMonteCarloSensitivity from '@/components/VietnamMonteCarloSensitivity';
import VietnamMonteCarloLlmAnalysis from '@/components/VietnamMonteCarloLlmAnalysis';
import VietnamMonteCarloHistory from '@/components/VietnamMonteCarloHistory';
import { globalSimulationCache } from '@/services/SimulationCache';
import monteCarloService from '@/services/MonteCarloService';
import monteCarloStorageService from '@/services/MonteCarloStorageService';
import monteCarloComparisonService from '@/services/MonteCarloComparisonService';
import vietnamMonteCarloAdapter from '@/services/VietnamMonteCarloAdapter';
import businessDataCloudConnector from '@/services/BusinessDataCloudConnector';
import { SimulationInput, SimulationOutput, SimulationComparison, UUID, SimulationStatus } from '@/types/MonteCarloTypes';
import useMultiTasking from '@/hooks/useMultiTasking';
import { haptics } from '@/lib/haptics';
import { useMediaQuery } from 'react-responsive';
import { Play, Download, AlertCircle, Save, History, Database, PanelRight, User, BarChart, RefreshCw, X, Share2 } from 'lucide-react';

/**
 * Enhanced Vietnam Tariff Monte Carlo Simulation Page
 * Integrated screen with storage architecture and comparison capabilities
 * Based on the technical specification for SAP Business Data Cloud integration
 */
const VietnamMonteCarloEnhancedPage: NextPage = () => {
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
  
  // Platform detection state
  const [isMounted, setIsMounted] = useState(false);
  const [isPlatformDetected, setPlatformDetected] = useState(false);
  const [isAppleDevice, setIsAppleDevice] = useState(false);
  const [isIPad, setIsIPad] = useState(false);
  
  const isSmallScreen = useMediaQuery({ maxWidth: 768 });
  const { mode, isMultiTasking, orientation } = useMultiTasking();
  
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
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptics.selection();
    }
    
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
    
    try {
      // Use the Monte Carlo service to create and run simulation
      const result = await monteCarloService.createSimulation(simConfig, username);
      
      // Update current simulation state
      const input = await monteCarloService.getSimulationInput(result.inputId);
      const output = await monteCarloService.getSimulationOutput(result.outputId);
      
      setCurrentSimulation({
        input,
        output
      });
      
      // Start polling for results
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
            setSensitivityResults(output.results.sensitivityAnalysis);
            
            // Get LLM analysis if available
            if (output.llmAnalysis) {
              setLlmAnalysis({
                status: 'complete',
                keyInsights: output.llmAnalysis.insights || [],
                riskAssessment: output.llmAnalysis.riskAssessment || null,
                recommendations: output.llmAnalysis.recommendations || []
              });
            }
            
            // Update current simulation
            setCurrentSimulation(prev => ({
              ...prev,
              output
            }));
            
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
  
  // Original storage-based simulation handling (kept as fallback)
  const handleRunSimulationLegacy = async (simConfig: VietnamMonteCarloConfig) => {
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
        
        // Error haptic feedback on Apple devices
        if (isAppleDevice) {
          haptics.error();
        }
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
          // Success haptic feedback on Apple devices
          if (isAppleDevice) {
            haptics.success();
          }
          
          processSimulationResults(currentSimulation.output.id, data.results);
        }
        break;
        
      case 'SIMULATION_ERROR':
        setError(data.error || 'An error occurred during simulation');
        setSimulationStatus('failed');
        
        // Error haptic feedback on Apple devices
        if (isAppleDevice) {
          haptics.error();
        }
        
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
      
      // Error haptic feedback on Apple devices
      if (isAppleDevice) {
        haptics.error();
      }
    }
  };
  
  // Handle percentile slider change
  const handleSliderChange = (value: number) => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptics.light();
    }
    
    setSliderPercentile(value);
  };
  
  // Handle save simulation
  const handleSaveSimulation = () => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptics.medium();
    }
    
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
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptics.medium();
    }
    
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
      
      // Success haptic feedback on Apple devices
      if (isAppleDevice) {
        haptics.success();
      }
      
      // Show success message
      if (savedToBDC) {
        alert('Simulation saved successfully to Business Data Cloud');
      } else {
        alert('Simulation saved successfully to local storage');
      }
    } catch (error) {
      console.error('Error saving simulation:', error);
      setError('Error saving simulation');
      
      // Error haptic feedback on Apple devices
      if (isAppleDevice) {
        haptics.error();
      }
    }
  };
  
  // Handle cancel save
  const handleCancelSave = () => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptics.light();
    }
    
    setSaveDialogOpen(false);
  };
  
  // Handle view saved simulation
  const handleViewSimulation = async (simulationId: string) => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptics.medium();
    }
    
    try {
      // Use Monte Carlo service to get simulation input
      const input = await monteCarloService.getSimulationInput(simulationId);
      
      if (!input) {
        throw new Error('Simulation not found');
      }
      
      // Get outputs for this input using Monte Carlo service
      const outputs = await monteCarloService.getSimulationOutputs(simulationId);
      
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
      
      // Success haptic feedback on Apple devices
      if (isAppleDevice) {
        haptics.success();
      }
      
      // Display Business Data Cloud integration message
      console.log('Successfully loaded simulation from Business Data Cloud');
    } catch (error) {
      console.error('Error viewing simulation:', error);
      setError(`Error viewing simulation: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Error haptic feedback on Apple devices
      if (isAppleDevice) {
        haptics.error();
      }
    }
  };
  
  // Handle new simulation
  const handleNewSimulation = () => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptics.medium();
    }
    
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
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptics.medium();
    }
    
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
      
      // Success haptic feedback on Apple devices
      if (isAppleDevice) {
        haptics.success();
      }
    } catch (error) {
      console.error('Error viewing comparison:', error);
      setError(`Error viewing comparison: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Error haptic feedback on Apple devices
      if (isAppleDevice) {
        haptics.error();
      }
    }
  };
  
  // Handle tab change
  const handleTabChange = (newTab: string) => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptics.selection();
    }
    
    setActiveTab(newTab);
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
  
  // Handle download action with haptic feedback
  const handleDownloadClick = () => {
    if (isAppleDevice) {
      haptics.medium();
    }
    
    // In a real application, this would trigger a download
    alert('Downloading Monte Carlo simulation results as PDF...');
  };

  // Handle share action with haptic feedback
  const handleShareClick = () => {
    if (isAppleDevice) {
      haptics.medium();
    }
    
    // In a real application, this would open a share dialog
    alert('Opening share dialog...');
  };
  
  // Handle dismiss error
  const handleDismissError = () => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptics.light();
    }
    
    setError(null);
  };
  
  // Render simulation tab content
  const renderSimulationTab = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Parameter Configuration Panel */}
        <div className="md:col-span-1">
          <VietnamMonteCarloParams
            initialConfig={config || undefined}
            onConfigChange={handleConfigChange}
            onRunSimulation={handleRunSimulation}
            isAppleDevice={isAppleDevice}
            isIPad={isIPad}
            isMultiTasking={isMultiTasking}
            multiTaskingMode={mode}
          />
        </div>

        {/* Probability Distribution Visualization */}
        <div className={`${isMultiTasking && mode === 'slide-over' ? 'md:col-span-1' : 'md:col-span-3'}`}>
          <VietnamMonteCarloProbabilityDistribution
            data={simulationResults}
            loading={simulationStatus === 'running'}
            caseBoundaries={config?.simulationSettings.caseBoundaries}
            onSliderChange={handleSliderChange}
            isAppleDevice={isAppleDevice}
            isIPad={isIPad}
            isMultiTasking={isMultiTasking}
            multiTaskingMode={mode}
          />
        </div>

        {/* Case Analysis */}
        <div className="col-span-1 md:col-span-full">
          <VietnamMonteCarloCaseAnalysis
            data={simulationResults}
            caseBoundaries={config?.simulationSettings.caseBoundaries}
            isAppleDevice={isAppleDevice}
            isIPad={isIPad}
            isMultiTasking={isMultiTasking}
            multiTaskingMode={mode}
          />
        </div>

        {/* Sensitivity Analysis */}
        <div className="md:col-span-1">
          <VietnamMonteCarloSensitivity
            parameters={sensitivityResults}
            loading={simulationStatus === 'running'}
            onDetailedAnalysis={() => alert('Detailed analysis would be shown here')}
            onExportData={() => alert('Export data functionality would be implemented here')}
            isAppleDevice={isAppleDevice}
            isIPad={isIPad}
            isMultiTasking={isMultiTasking}
            multiTaskingMode={mode}
          />
        </div>

        {/* LLM Analysis */}
        <div className={`${isMultiTasking && mode === 'slide-over' ? 'md:col-span-1' : 'md:col-span-3'}`}>
          <VietnamMonteCarloLlmAnalysis
            analysis={llmAnalysis}
            onGenerateReport={handleGenerateReport}
            onViewDetailedAnalysis={() => alert('Detailed analysis would be shown here')}
            isAppleDevice={isAppleDevice}
            isIPad={isIPad}
            isMultiTasking={isMultiTasking}
            multiTaskingMode={mode}
          />
        </div>

        {/* Action Buttons */}
        <div className="col-span-1 md:col-span-full">
          <div className="bg-white p-4 border border-[hsl(var(--border))] rounded-lg">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {isAppleDevice ? (
                  <>
                    <EnhancedTouchButton
                      onClick={() => config && handleRunSimulation(config)}
                      disabled={simulationStatus === 'running' || !config}
                      variant="primary"
                      className="flex items-center gap-1"
                      size={isMultiTasking && mode === 'slide-over' ? 'sm' : 'default'}
                    >
                      {simulationStatus === 'running' ? (
                        <>
                          <EnhancedLoadingSpinner size="sm" variant="primary" showText={false} isAppleDevice={isAppleDevice} />
                          <span>Running Simulation</span>
                        </>
                      ) : (
                        <>
                          <Play className={`${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                          <span>Run Simulation</span>
                        </>
                      )}
                    </EnhancedTouchButton>
                    
                    <EnhancedTouchButton
                      onClick={handleSaveSimulation}
                      disabled={simulationStatus !== 'completed'}
                      variant="secondary"
                      className="flex items-center gap-1"
                      size={isMultiTasking && mode === 'slide-over' ? 'sm' : 'default'}
                    >
                      <Save className={`${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                      <span>Save Simulation</span>
                    </EnhancedTouchButton>
                    
                    <EnhancedTouchButton
                      onClick={handleNewSimulation}
                      variant="secondary"
                      className="flex items-center gap-1"
                      size={isMultiTasking && mode === 'slide-over' ? 'sm' : 'default'}
                    >
                      <RefreshCw className={`${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                      <span>New Simulation</span>
                    </EnhancedTouchButton>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => config && handleRunSimulation(config)}
                      disabled={simulationStatus === 'running' || !config}
                      className={`fiori-btn fiori-btn-primary flex items-center gap-1 ${(simulationStatus === 'running' || !config) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {simulationStatus === 'running' ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-1"></div>
                          Running Simulation
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Run Simulation
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={handleSaveSimulation}
                      disabled={simulationStatus !== 'completed'}
                      className={`fiori-btn fiori-btn-secondary flex items-center gap-1 ${simulationStatus !== 'completed' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Save className="w-4 h-4" />
                      Save Simulation
                    </button>
                    
                    <button
                      onClick={handleNewSimulation}
                      className="fiori-btn fiori-btn-secondary flex items-center gap-1"
                    >
                      <RefreshCw className="w-4 h-4" />
                      New Simulation
                    </button>
                  </>
                )}
              </div>
              
              <div className="flex gap-2">
                {isAppleDevice ? (
                  <>
                    <EnhancedTouchButton
                      onClick={handleGenerateReport}
                      disabled={simulationStatus !== 'completed'}
                      variant="primary"
                      className="flex items-center gap-1"
                      size={isMultiTasking && mode === 'slide-over' ? 'sm' : 'default'}
                    >
                      <Download className={`${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                      <span>Generate Report</span>
                    </EnhancedTouchButton>
                    
                    <EnhancedTouchButton
                      onClick={handleShareClick}
                      disabled={simulationStatus !== 'completed'}
                      variant="secondary"
                      className="flex items-center gap-1"
                      size={isMultiTasking && mode === 'slide-over' ? 'sm' : 'default'}
                    >
                      <Share2 className={`${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                      <span>Share</span>
                    </EnhancedTouchButton>
                  </>
                ) : (
                  <button
                    onClick={handleGenerateReport}
                    disabled={simulationStatus !== 'completed'}
                    className={`fiori-btn fiori-btn-primary flex items-center gap-1 ${simulationStatus !== 'completed' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Download className="w-4 h-4" />
                    Generate Detailed Report
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render comparison tab content
  const renderComparisonTab = () => {
    if (!comparisonView) {
      return (
        <div className="p-4 text-center bg-white border border-[hsl(var(--border))] rounded-lg">
          <p className="text-gray-600">
            Select simulations to compare from the history tab
          </p>
        </div>
      );
    }
    
    // In a real implementation, this would render a detailed comparison view
    return (
      <div className="bg-white p-4 border border-[hsl(var(--border))] rounded-lg">
        <h2 className={`${isMultiTasking && mode === 'slide-over' ? 'text-lg' : 'text-xl'} font-semibold mb-4`}>
          {comparisonView.name}
        </h2>
        
        <p className="text-gray-600 mb-4">
          {comparisonView.description || 'No description provided'}
        </p>
        
        <div className="mb-6 bg-[rgba(var(--scb-light-bg),0.5)] p-4 border border-[hsl(var(--border))] rounded-lg">
          <h3 className={`${isMultiTasking && mode === 'slide-over' ? 'text-base' : 'text-lg'} font-medium mb-4`}>
            Parameter Differences
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[rgba(var(--scb-light-bg),0.8)]">
                  <th className="border border-[hsl(var(--border))] p-2 text-left">Parameter</th>
                  <th className="border border-[hsl(var(--border))] p-2 text-left">Differences</th>
                </tr>
              </thead>
              <tbody>
                {comparisonView.comparisonResults.differenceMatrix.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-[rgba(var(--scb-light-bg),0.3)]'}>
                    <td className="border border-[hsl(var(--border))] p-2">{item.parameter}</td>
                    <td className="border border-[hsl(var(--border))] p-2">
                      {item.differences.map((diff, i) => (
                        <div key={i} className="mb-1">
                          <span className={`${diff.percentageDifference > 0 ? 'text-[rgb(var(--scb-american-green))]' : 'text-[rgb(var(--horizon-red))]'}`}>
                            {diff.percentageDifference > 0 ? '+' : ''}
                            {diff.percentageDifference.toFixed(1)}% 
                          </span>
                          <span className="text-gray-600 ml-1">
                            ({diff.absoluteDifference.toFixed(2)})
                          </span>
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* More comparison details would be rendered here */}
        </div>
        
        {isAppleDevice ? (
          <EnhancedTouchButton
            onClick={() => handleTabChange('history')}
            variant="primary"
            className="flex items-center gap-1"
          >
            <History className="w-4 h-4" />
            <span>Back to History</span>
          </EnhancedTouchButton>
        ) : (
          <button
            onClick={() => handleTabChange('history')}
            className="fiori-btn fiori-btn-primary flex items-center gap-1"
          >
            <History className="w-4 h-4" />
            Back to History
          </button>
        )}
      </div>
    );
  };
  
  // Render history tab content
  const renderHistoryTab = () => {
    return (
      <VietnamMonteCarloHistory
        onViewSimulation={handleViewSimulation}
        onCompare={handleViewComparison}
        onNewSimulation={handleNewSimulation}
        isAppleDevice={isAppleDevice}
        isIPad={isIPad}
        isMultiTasking={isMultiTasking}
        multiTaskingMode={mode}
      />
    );
  };

  return (
    <ScbBeautifulUI 
      showNewsBar={!isSmallScreen && !isMultiTasking} 
      pageTitle="Vietnam Monte Carlo" 
      showTabs={isAppleDevice}
    >
      <div className={`${isMultiTasking && mode === 'slide-over' ? 'px-3 py-2' : 'px-6 py-4'} max-w-6xl mx-auto`}>
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-[rgb(var(--scb-primary))]">Vietnam Tariff Monte Carlo Simulation</h1>
              <p className="text-gray-600 mt-1">Analyze probable outcomes of Vietnam tariff changes using Monte Carlo simulation</p>
            </div>
            
            {/* Platform-specific action buttons for Apple devices */}
            {isAppleDevice && (
              <div className={`flex ${isMultiTasking && mode === 'slide-over' ? 'gap-2' : 'gap-3'}`}>
                <EnhancedTouchButton
                  onClick={handleDownloadClick}
                  variant="secondary"
                  className="flex items-center gap-1"
                  size={isMultiTasking && mode === 'slide-over' ? 'sm' : 'default'}
                  disabled={simulationStatus !== 'completed'}
                >
                  <Download className={`${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  <span>Export</span>
                </EnhancedTouchButton>
                
                <EnhancedTouchButton
                  onClick={handleShareClick}
                  variant="secondary"
                  className="flex items-center gap-1"
                  size={isMultiTasking && mode === 'slide-over' ? 'sm' : 'default'}
                  disabled={simulationStatus !== 'completed'}
                >
                  <Share2 className={`${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  <span>Share</span>
                </EnhancedTouchButton>
              </div>
            )}
          </div>
          
          {/* Tab navigation */}
          <div className={`mt-6 border-b border-[hsl(var(--border))]`}>
            <div className="flex">
              <button
                onClick={() => handleTabChange('simulation')}
                className={`flex items-center gap-1 px-4 py-2 ${activeTab === 'simulation' ? 'border-b-2 border-[rgb(var(--scb-primary))] text-[rgb(var(--scb-primary))]' : 'text-gray-500'}`}
              >
                <BarChart className="w-4 h-4" />
                <span>Simulation</span>
              </button>
              
              <button
                onClick={() => handleTabChange('history')}
                className={`flex items-center gap-1 px-4 py-2 ${activeTab === 'history' ? 'border-b-2 border-[rgb(var(--scb-primary))] text-[rgb(var(--scb-primary))]' : 'text-gray-500'}`}
              >
                <History className="w-4 h-4" />
                <span>History</span>
              </button>
              
              <button
                onClick={() => comparisonView && handleTabChange('comparison')}
                disabled={!comparisonView}
                className={`flex items-center gap-1 px-4 py-2 ${
                  !comparisonView ? 'opacity-50 cursor-not-allowed text-gray-400' : 
                  activeTab === 'comparison' ? 'border-b-2 border-[rgb(var(--scb-primary))] text-[rgb(var(--scb-primary))]' : 
                  'text-gray-500'
                }`}
              >
                <PanelRight className="w-4 h-4" />
                <span>Comparison</span>
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-[rgba(var(--horizon-red),0.05)] border border-[rgba(var(--horizon-red),0.2)] rounded-lg p-4 flex justify-between items-start">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-[rgb(var(--horizon-red))] mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-[rgb(var(--horizon-neutral-gray))]">Error</h3>
                <p className="text-gray-700 text-sm mt-1">{error}</p>
              </div>
            </div>
            
            {isAppleDevice ? (
              <EnhancedTouchButton
                onClick={handleDismissError}
                variant="ghost"
                size="sm"
                className="text-gray-500"
              >
                <X className="w-4 h-4" />
              </EnhancedTouchButton>
            ) : (
              <button
                onClick={handleDismissError}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        
        {/* Current user indicator */}
        <div className={`mb-6 flex flex-col ${isMultiTasking && !isMultiTasking ? 'sm:flex-row sm:items-center' : ''} gap-2`}>
          <div className="flex items-center">
            <User className="w-4 h-4 mr-2 text-gray-500" />
            <span className="text-sm text-gray-600">
              Logged in as: <strong>{username}</strong>
            </span>
          </div>
          
          {currentSimulation.input && (
            <div className="flex items-center">
              <Database className="w-4 h-4 mr-2 text-gray-500" />
              <span className="text-sm text-gray-600">
                Current simulation: <strong>{currentSimulation.input.name || 'Unnamed Simulation'}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Tab content */}
        <div className="mb-8">
          {activeTab === 'simulation' && renderSimulationTab()}
          {activeTab === 'history' && renderHistoryTab()}
          {activeTab === 'comparison' && renderComparisonTab()}
        </div>

        {/* Additional Information */}
        <div className="mt-8 mb-4">
          <div className="bg-[rgba(var(--horizon-blue),0.05)] border border-[rgba(var(--horizon-blue),0.2)] rounded-lg p-4">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-[rgb(var(--horizon-blue))] mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-[rgb(var(--horizon-neutral-gray))]">About This Tool</h3>
                <p className={`${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} text-gray-700 mt-1`}>
                  The Vietnam Tariff Monte Carlo Simulation uses stochastic modeling to simulate thousands of possible outcomes 
                  based on varying tariff parameters. It leverages real data storage with Apache Jena, Redis caching, 
                  and Perplexity AI for advanced analysis. All simulations are saved to the Business Data Cloud for future reference.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 my-4"></div>

        <div className="mb-4">
          <p className="text-xs text-gray-500">
            © 2025 SCB FinSight | Data updated: May 19, 2025 | Vietnam Tariff Monte Carlo Module v2.0.0 | Real Data Integration
          </p>
        </div>
      </div>
      
      {/* Save Simulation Dialog */}
      {saveDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Save Simulation</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="simulation-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Simulation Name
                  </label>
                  <input
                    id="simulation-name"
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={simulationName}
                    onChange={(e) => setSimulationName(e.target.value)}
                  />
                </div>
                
                <div>
                  <label htmlFor="simulation-description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="simulation-description"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={4}
                    value={simulationDescription}
                    onChange={(e) => setSimulationDescription(e.target.value)}
                  />
                </div>
                
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Created By
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-md p-2">
                    <User className="w-4 h-4 text-gray-500 mr-2" />
                    <input
                      id="username"
                      type="text"
                      className="flex-1 outline-none"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-2">
                {isAppleDevice ? (
                  <>
                    <EnhancedTouchButton
                      onClick={handleCancelSave}
                      variant="secondary"
                    >
                      Cancel
                    </EnhancedTouchButton>
                    
                    <EnhancedTouchButton
                      onClick={handleSaveConfirm}
                      variant="primary"
                    >
                      Save
                    </EnhancedTouchButton>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleCancelSave}
                      className="fiori-btn fiori-btn-secondary"
                    >
                      Cancel
                    </button>
                    
                    <button
                      onClick={handleSaveConfirm}
                      className="fiori-btn fiori-btn-primary"
                    >
                      Save
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </ScbBeautifulUI>
  );
};

export default VietnamMonteCarloEnhancedPage;