import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, SkipForward, StopCircle, Settings, Save, RefreshCw, ArrowRight, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import EnhancedAnimatedSankeyChart from './EnhancedAnimatedSankeyChart';
import { SankeyData } from '../../types';

// Default simulation configuration
const DEFAULT_CONFIG = {
  iterations: 5000,
  explorationParameter: 1.41,
  timeHorizon: 24,
  scenarios: ['baseline', 'recession', 'growth'],
  riskTolerance: 'moderate'
};

interface SimulationProgress {
  iterations: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  timeRemaining: number;
  timeElapsed: number;
}

interface SimulationResults {
  optimalPath: Array<{
    from: string;
    to: string;
    action: string;
    expectedValue: number;
    confidence: number;
  }>;
  expectedValue: number;
  riskMetrics: {
    volatility: number;
    sharpeRatio: number;
    valueatRisk: number;
    maxDrawdown: number;
  };
}

export interface EnhancedDynamicSankeySimulationProps {
  initialData: SankeyData;
  width?: number;
  height?: number;
  title?: string;
  onSimulationComplete?: (results: SimulationResults) => void;
  onSaveResults?: (data: SankeyData, results: SimulationResults) => void;
  simulationConfig?: {
    iterations?: number;
    timeHorizon?: number;
    explorationParameter?: number;
    scenarios?: string[];
    riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
  };
  className?: string;
}

/**
 * Enhanced Dynamic Sankey Simulation with SCB beautiful styling
 * Provides interactive Monte Carlo simulation of sankey flows
 * Follows Fiori Horizon design patterns with SCB color variables
 */
const EnhancedDynamicSankeySimulation: React.FC<EnhancedDynamicSankeySimulationProps> = ({
  initialData,
  width = 800,
  height = 500,
  title = 'Dynamic Flow Simulation',
  onSimulationComplete,
  onSaveResults,
  simulationConfig,
  className = ""
}) => {
  // State for simulation
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState<SimulationProgress | null>(null);
  const [visualData, setVisualData] = useState<SankeyData>(initialData);
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [simulationConfigState, setSimulationConfig] = useState({
    ...DEFAULT_CONFIG,
    ...simulationConfig
  });
  const [error, setError] = useState<string | null>(null);
  
  // Web worker reference
  const simulationWorker = useRef<Worker | null>(null);
  
  // Initialize worker
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        simulationWorker.current = new Worker('/workers/monteCarloWorker.js');
        
        // Set up message handler
        simulationWorker.current.onmessage = (event) => {
          const { type, data } = event.data;
          
          if (type === 'SIMULATION_UPDATE') {
            setProgress(data.progress);
            setVisualData(data.flowData);
          } else if (type === 'SIMULATION_COMPLETE') {
            // Handle simulation completion
            setIsRunning(false);
            setIsPaused(false);
            
            // Update visualization with final data
            setVisualData(data.flowData);
            setResults(data.results);
            
            // If callback provided, pass the results
            if (onSimulationComplete) {
              onSimulationComplete(data.results);
            }
            
            // If save callback provided, pass the data and results
            if (onSaveResults) {
              onSaveResults(data.flowData, data.results);
            }
          } else if (type === 'SIMULATION_PAUSED') {
            setIsPaused(true);
          } else if (type === 'SIMULATION_RESUMED') {
            setIsPaused(false);
          } else if (type === 'SIMULATION_STOPPED') {
            setIsRunning(false);
            setIsPaused(false);
            setProgress(null);
          } else if (type === 'SIMULATION_ERROR') {
            setError(data.message || 'An error occurred during simulation');
            setIsRunning(false);
            setIsPaused(false);
          }
        };
        
        // Handle worker errors
        simulationWorker.current.onerror = (event) => {
          setError(`Worker error: ${event.message}`);
          setIsRunning(false);
          setIsPaused(false);
        };
      } catch (err) {
        setError(`Failed to initialize simulation worker: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    
    // Clean up worker on unmount
    return () => {
      if (simulationWorker.current) {
        simulationWorker.current.terminate();
      }
    };
  }, [onSimulationComplete, onSaveResults]);
  
  // Start simulation
  const startSimulation = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
    setResults(null);
    setError(null);
    
    // Use props config if provided, otherwise use default config
    const configToUse = {
      ...simulationConfigState,
      ...(simulationConfig || {})
    };

    if (!simulationWorker.current) {
      setError('Simulation worker not initialized');
      setIsRunning(false);
      return;
    }
    
    simulationWorker.current.postMessage({
      type: 'START_SIMULATION',
      config: configToUse,
      initialData: initialData
    });
  }, [simulationConfig, simulationConfigState, initialData]);
  
  // Stop simulation
  const stopSimulation = useCallback(() => {
    if (!simulationWorker.current) return;
    
    simulationWorker.current.postMessage({
      type: 'STOP_SIMULATION'
    });
  }, []);
  
  // Pause simulation
  const pauseSimulation = useCallback(() => {
    if (!simulationWorker.current) return;
    
    simulationWorker.current.postMessage({
      type: 'PAUSE_SIMULATION'
    });
  }, []);
  
  // Resume simulation
  const resumeSimulation = useCallback(() => {
    if (!simulationWorker.current) return;
    
    simulationWorker.current.postMessage({
      type: 'RESUME_SIMULATION'
    });
  }, []);
  
  // Step simulation
  const stepSimulation = useCallback((steps = 100) => {
    if (!simulationWorker.current) return;
    
    simulationWorker.current.postMessage({
      type: 'STEP_SIMULATION',
      config: { steps }
    });
  }, []);
  
  // Handle config changes
  const handleConfigChange = useCallback((key: string, value: any) => {
    setSimulationConfig(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);
  
  // Save results
  const handleSaveResults = useCallback(() => {
    if (results && onSaveResults) {
      onSaveResults(visualData, results);
    }
  }, [results, visualData, onSaveResults]);

  // Format time for display
  const formatTime = (milliseconds: number) => {
    if (!milliseconds) return '0s';
    const seconds = Math.floor(milliseconds / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className={`fiori-tile flex flex-col h-full ${className}`}>
      {/* Visualization area */}
      <div className="relative flex-grow">
        <EnhancedAnimatedSankeyChart 
          data={visualData} 
          width={width} 
          height={height} 
          title={title}
          showAIControls
          onRegenerateClick={isRunning ? undefined : startSimulation}
          isLoading={isRunning && !progress}
          autoAnimate={!isPaused}
          className="h-full"
        />
        
        {/* Simulation progress overlay */}
        {isRunning && progress && (
          <div className="absolute bottom-4 left-4 right-4 bg-white/95 rounded border border-[rgb(var(--scb-border))] p-3 shadow-md">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">Simulation Progress:</span>
              <span className="text-sm text-[rgb(var(--scb-dark-gray))]">
                {progress.iterations.toLocaleString()} / {simulationConfigState.iterations.toLocaleString()} iterations
              </span>
            </div>
            <div className="w-full h-2 bg-[rgba(var(--scb-light-gray),0.5)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[rgb(var(--scb-honolulu-blue))] to-[rgb(var(--scb-american-green))]" 
                style={{ width: `${(progress.iterations / simulationConfigState.iterations) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-[rgb(var(--scb-dark-gray))] opacity-80 mt-1">
              <span>Time elapsed: {formatTime(progress.timeElapsed)}</span>
              <span>Est. remaining: {formatTime(progress.timeRemaining)}</span>
            </div>
            {progress.confidenceInterval && (
              <div className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-90 mt-1">
                Expected Value: {progress.confidenceInterval.lower.toFixed(2)} to {progress.confidenceInterval.upper.toFixed(2)} (95% CI)
              </div>
            )}
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="absolute bottom-4 left-4 right-4 bg-[rgba(var(--destructive),0.1)] border border-[rgb(var(--destructive))] text-[rgb(var(--destructive))] p-3 rounded">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Simulation Error</p>
                <p className="text-xs mt-0.5">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Control panel */}
      <div className="border-t border-[rgb(var(--scb-border))] p-4">
        <div className="flex flex-wrap gap-3 justify-between items-center">
          {/* Simulation controls */}
          <div className="flex gap-2">
            {!isRunning ? (
              <button 
                onClick={startSimulation}
                className="fiori-btn fiori-btn-primary touch-min-h"
                aria-label="Start simulation"
              >
                <Play size={16} className="mr-1" />
                <span>Run Simulation</span>
              </button>
            ) : (
              <>
                {isPaused ? (
                  <button 
                    onClick={resumeSimulation}
                    className="fiori-btn touch-min-h"
                    style={{ backgroundColor: 'rgb(var(--scb-american-green))', color: 'white', borderColor: 'rgb(var(--scb-american-green))' }}
                    aria-label="Resume simulation"
                  >
                    <Play size={16} className="mr-1" />
                    <span>Resume</span>
                  </button>
                ) : (
                  <button 
                    onClick={pauseSimulation}
                    className="fiori-btn touch-min-h"
                    style={{ backgroundColor: 'rgb(var(--warning))', color: 'white', borderColor: 'rgb(var(--warning))' }}
                    aria-label="Pause simulation"
                  >
                    <Pause size={16} className="mr-1" />
                    <span>Pause</span>
                  </button>
                )}
                <button 
                  onClick={() => stepSimulation()}
                  className="fiori-btn fiori-btn-secondary touch-min-h"
                  aria-label="Step simulation"
                  disabled={!isPaused}
                >
                  <SkipForward size={16} className="mr-1" />
                  <span>Step</span>
                </button>
                <button 
                  onClick={stopSimulation}
                  className="fiori-btn touch-min-h"
                  style={{ backgroundColor: 'rgb(var(--destructive))', color: 'white', borderColor: 'rgb(var(--destructive))' }}
                  aria-label="Stop simulation"
                >
                  <StopCircle size={16} className="mr-1" />
                  <span>Stop</span>
                </button>
              </>
            )}
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="fiori-btn fiori-btn-secondary touch-min-h"
              aria-label="Simulation settings"
            >
              <Settings size={16} className="mr-1" />
              <span>Settings</span>
            </button>
            
            {results && (
              <button 
                onClick={handleSaveResults}
                className="fiori-btn touch-min-h"
                style={{ backgroundColor: 'rgb(var(--scb-american-green))', color: 'white', borderColor: 'rgb(var(--scb-american-green))' }}
                aria-label="Save results"
              >
                <Save size={16} className="mr-1" />
                <span>Save Results</span>
              </button>
            )}
            
            {results && (
              <button 
                onClick={startSimulation}
                className="fiori-btn fiori-btn-secondary touch-min-h"
                aria-label="Run new simulation"
              >
                <RefreshCw size={16} className="mr-1" />
                <span>New Simulation</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Configuration panel */}
        {showSettings && (
          <div className="mt-4 p-4 border border-[rgb(var(--scb-border))] rounded-md bg-[rgba(var(--scb-light-gray),0.1)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-medium text-[rgb(var(--scb-dark-gray))]">Simulation Settings</h3>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-1 rounded-full hover:bg-[rgba(var(--scb-light-gray),0.5)]"
                aria-label="Close settings"
              >
                <ChevronUp size={16} className="text-[rgb(var(--scb-dark-gray))]" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--scb-dark-gray))] mb-1">
                  Iterations
                </label>
                <input 
                  type="number" 
                  min="100"
                  max="10000"
                  step="100"
                  value={simulationConfigState.iterations}
                  onChange={(e) => handleConfigChange('iterations', parseInt(e.target.value))}
                  className="fiori-input w-full touch-manipulation"
                  disabled={isRunning}
                />
                <p className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-80 mt-1">
                  Higher values = more accurate but slower simulation
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--scb-dark-gray))] mb-1">
                  Time Horizon (months)
                </label>
                <input 
                  type="number" 
                  min="1"
                  max="60"
                  value={simulationConfigState.timeHorizon}
                  onChange={(e) => handleConfigChange('timeHorizon', parseInt(e.target.value))}
                  className="fiori-input w-full touch-manipulation"
                  disabled={isRunning}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--scb-dark-gray))] mb-1">
                  Risk Tolerance
                </label>
                <select
                  value={simulationConfigState.riskTolerance}
                  onChange={(e) => handleConfigChange('riskTolerance', e.target.value)}
                  className="fiori-input w-full touch-manipulation"
                  disabled={isRunning}
                >
                  <option value="conservative">Conservative</option>
                  <option value="moderate">Moderate</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--scb-dark-gray))] mb-1">
                  Scenarios
                </label>
                <div className="space-y-2">
                  {['baseline', 'recession', 'growth'].map((scenario) => (
                    <label key={scenario} className="inline-flex items-center mr-4 touch-manipulation">
                      <input
                        type="checkbox"
                        checked={simulationConfigState.scenarios?.includes(scenario) || false}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleConfigChange('scenarios', [...(simulationConfigState.scenarios || []), scenario]);
                          } else {
                            handleConfigChange(
                              'scenarios',
                              (simulationConfigState.scenarios || []).filter(s => s !== scenario)
                            );
                          }
                        }}
                        className="h-4 w-4 text-[rgb(var(--scb-honolulu-blue))] border-[rgb(var(--scb-border))] rounded"
                        disabled={isRunning}
                      />
                      <span className="ml-2 text-sm text-[rgb(var(--scb-dark-gray))] capitalize">{scenario}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-[rgb(var(--scb-dark-gray))] mb-1">
                Exploration Parameter (UCB1)
              </label>
              <input 
                type="range" 
                min="0.5"
                max="2.5"
                step="0.01"
                value={simulationConfigState.explorationParameter}
                onChange={(e) => handleConfigChange('explorationParameter', parseFloat(e.target.value))}
                className="block w-full touch-manipulation"
                disabled={isRunning}
              />
              <div className="flex justify-between text-xs text-[rgb(var(--scb-dark-gray))] opacity-80">
                <span>Exploitation (0.5)</span>
                <span>Balance (1.41)</span>
                <span>Exploration (2.5)</span>
              </div>
              <p className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-80 mt-1">
                Current: {simulationConfigState.explorationParameter} - 
                {simulationConfigState.explorationParameter < 1.0 
                  ? ' Favors high-value known paths' 
                  : simulationConfigState.explorationParameter > 1.8 
                    ? ' Explores more uncertain paths'
                    : ' Balanced exploration/exploitation'}
              </p>
            </div>
          </div>
        )}
        
        {/* Results summary */}
        {results && (
          <div className="mt-4 p-4 border border-[rgb(var(--scb-border))] rounded-md bg-[rgba(var(--scb-honolulu-blue),0.05)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-medium text-[rgb(var(--scb-dark-gray))]">Simulation Results</h3>
              <div className="horizon-chip text-xs py-0.5 px-2">
                <span>Complete</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))] mb-1">Expected Value</h4>
                <p className="text-2xl font-medium text-[rgb(var(--scb-honolulu-blue))]">
                  {results.expectedValue.toFixed(2)}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))] mb-1">Risk Metrics</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-80">Volatility</p>
                    <p className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">{results.riskMetrics.volatility.toFixed(3)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-80">Sharpe Ratio</p>
                    <p className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">{results.riskMetrics.sharpeRatio.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-80">Value at Risk (95%)</p>
                    <p className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">{results.riskMetrics.valueatRisk.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-80">Max Drawdown</p>
                    <p className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">{results.riskMetrics.maxDrawdown.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))] mb-2">Optimal Path</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-[rgba(var(--scb-light-gray),0.3)] border-y border-[rgb(var(--scb-border))]">
                      <th className="px-4 py-2 text-left font-medium text-[rgb(var(--scb-dark-gray))]">Action</th>
                      <th className="px-4 py-2 text-left font-medium text-[rgb(var(--scb-dark-gray))]">From</th>
                      <th className="px-4 py-2 text-left font-medium text-[rgb(var(--scb-dark-gray))]">To</th>
                      <th className="px-4 py-2 text-left font-medium text-[rgb(var(--scb-dark-gray))]">Expected Value</th>
                      <th className="px-4 py-2 text-left font-medium text-[rgb(var(--scb-dark-gray))]">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.optimalPath.slice(0, 5).map((step, index) => (
                      <tr key={index} className={index % 2 === 0 
                        ? 'bg-white border-b border-[rgba(var(--scb-border),0.3)]' 
                        : 'bg-[rgba(var(--scb-light-gray),0.1)] border-b border-[rgba(var(--scb-border),0.3)]'}
                      >
                        <td className="px-4 py-2 capitalize text-[rgb(var(--scb-dark-gray))]">{step.action}</td>
                        <td className="px-4 py-2 text-[rgb(var(--scb-dark-gray))]">{step.from}</td>
                        <td className="px-4 py-2 text-[rgb(var(--scb-dark-gray))]">
                          <div className="flex items-center gap-1">
                            <ArrowRight size={12} className="text-[rgb(var(--scb-honolulu-blue))]" />
                            {step.to}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-[rgb(var(--scb-dark-gray))]">{step.expectedValue.toFixed(2)}</td>
                        <td className="px-4 py-2">
                          <div className="horizon-chip text-[10px] py-0.5 px-1.5">
                            {(step.confidence * 100).toFixed(0)}%
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {results.optimalPath.length > 5 && (
                <p className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-80 mt-2">
                  Showing top 5 of {results.optimalPath.length} steps in optimal path
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedDynamicSankeySimulation;