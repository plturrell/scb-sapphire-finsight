import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, SkipForward, StopCircle, Settings, Save, RefreshCw } from 'lucide-react';
import AnimatedSankeyChart from './AnimatedSankeyChart';
import { SankeyData } from '../types';

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

export interface DynamicSankeySimulationProps {
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
}

const DynamicSankeySimulation: React.FC<DynamicSankeySimulationProps> = ({
  initialData,
  width = 800,
  height = 500,
  title = 'Dynamic Flow Simulation',
  onSimulationComplete,
  onSaveResults,
  simulationConfig
}) => {
  // State for simulation
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState<SimulationProgress | null>(null);
  const [visualData, setVisualData] = useState<SankeyData>(initialData);
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [simulationConfigState, setSimulationConfig] = useState(DEFAULT_CONFIG);
  
  // Web worker reference
  const simulationWorker = useRef<Worker | null>(null);
  
  // Initialize worker
  useEffect(() => {
    if (typeof window !== 'undefined') {
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
        }
      };
    }
    
    // Clean up worker on unmount
    return () => {
      if (simulationWorker.current) {
        simulationWorker.current.terminate();
      }
    };
  }, [onSimulationComplete]);
  
  // Start simulation
  const startSimulation = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
    setResults(null);
    
    // Use props config if provided, otherwise use default config
    const configToUse = {
      ...simulationConfigState,
      ...(simulationConfig || {})
    };

    if (!simulationWorker.current) return;
    
    simulationWorker.current.postMessage({
      type: 'START_SIMULATION',
      config: configToUse
    });
  }, [simulationConfig, simulationConfigState]);
  
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
    <div className="dynamic-sankey-simulation flex flex-col bg-white rounded-lg shadow-md overflow-hidden">
      {/* Visualization area */}
      <div className="simulation-visualization relative">
        <AnimatedSankeyChart 
          data={visualData} 
          width={width} 
          height={height} 
          title={title}
          showAIControls
          onRegenerateClick={isRunning ? undefined : startSimulation}
        />
        
        {/* Simulation progress overlay */}
        {isRunning && progress && (
          <div className="absolute bottom-4 left-4 right-4 bg-white/90 rounded p-2 shadow-md border border-gray-200">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Simulation Progress:</span>
              <span className="text-sm">{progress.iterations} / {simulationConfig?.iterations || 1000} iterations</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-scbBlue" 
                style={{ width: `${(progress.iterations / (simulationConfig?.iterations || 1000)) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Time elapsed: {formatTime(progress.timeElapsed)}</span>
              <span>Est. remaining: {formatTime(progress.timeRemaining)}</span>
            </div>
            {progress.confidenceInterval && (
              <div className="text-xs text-gray-600 mt-1">
                Expected Value: {progress.confidenceInterval.lower.toFixed(2)} to {progress.confidenceInterval.upper.toFixed(2)} (95% CI)
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Control panel */}
      <div className="simulation-controls p-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          {/* Simulation controls */}
          <div className="flex space-x-2">
            {!isRunning ? (
              <button 
                onClick={startSimulation}
                className="inline-flex items-center gap-1 px-3 py-2 bg-scbBlue text-white rounded hover:bg-blue-700 transition"
                aria-label="Start simulation"
              >
                <Play size={16} />
                <span>Run Simulation</span>
              </button>
            ) : (
              <>
                {isPaused ? (
                  <button 
                    onClick={resumeSimulation}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                    aria-label="Resume simulation"
                  >
                    <Play size={16} />
                    <span>Resume</span>
                  </button>
                ) : (
                  <button 
                    onClick={pauseSimulation}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition"
                    aria-label="Pause simulation"
                  >
                    <Pause size={16} />
                    <span>Pause</span>
                  </button>
                )}
                <button 
                  onClick={() => stepSimulation()}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
                  aria-label="Step simulation"
                  disabled={!isPaused}
                >
                  <SkipForward size={16} />
                  <span>Step</span>
                </button>
                <button 
                  onClick={stopSimulation}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                  aria-label="Stop simulation"
                >
                  <StopCircle size={16} />
                  <span>Stop</span>
                </button>
              </>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="inline-flex items-center gap-1 px-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
              aria-label="Simulation settings"
            >
              <Settings size={16} />
              <span>Settings</span>
            </button>
            
            {results && (
              <button 
                onClick={handleSaveResults}
                className="inline-flex items-center gap-1 px-3 py-2 bg-scbGreen text-white rounded hover:opacity-90 transition"
                aria-label="Save results"
              >
                <Save size={16} />
                <span>Save Results</span>
              </button>
            )}
            
            {results && (
              <button 
                onClick={startSimulation}
                className="inline-flex items-center gap-1 px-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
                aria-label="Run new simulation"
              >
                <RefreshCw size={16} />
                <span>New Simulation</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Configuration panel */}
        {showSettings && (
          <div className="mt-4 p-4 border rounded-md bg-gray-50">
            <h3 className="text-lg font-semibold mb-3">Simulation Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Iterations
                </label>
                <input 
                  type="number" 
                  min="100"
                  max="10000"
                  step="100"
                  value={simulationConfigState.iterations}
                  onChange={(e) => handleConfigChange('iterations', parseInt(e.target.value))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={isRunning}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Higher values = more accurate but slower simulation
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Horizon (months)
                </label>
                <input 
                  type="number" 
                  min="1"
                  max="60"
                  value={simulationConfigState.timeHorizon}
                  onChange={(e) => handleConfigChange('timeHorizon', parseInt(e.target.value))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={isRunning}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Risk Tolerance
                </label>
                <select
                  value={simulationConfigState.riskTolerance}
                  onChange={(e) => handleConfigChange('riskTolerance', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={isRunning}
                >
                  <option value="conservative">Conservative</option>
                  <option value="moderate">Moderate</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scenarios
                </label>
                <div className="space-y-2">
                  {['baseline', 'recession', 'growth'].map((scenario) => (
                    <label key={scenario} className="inline-flex items-center mr-4">
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
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={isRunning}
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">{scenario}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exploration Parameter (UCB1)
              </label>
              <input 
                type="range" 
                min="0.5"
                max="2.5"
                step="0.01"
                value={simulationConfigState.explorationParameter}
                onChange={(e) => handleConfigChange('explorationParameter', parseFloat(e.target.value))}
                className="block w-full"
                disabled={isRunning}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Exploitation (0.5)</span>
                <span>Balance (1.41)</span>
                <span>Exploration (2.5)</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
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
          <div className="mt-4 p-4 border rounded-md bg-blue-50">
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Simulation Results</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Expected Value</h4>
                <p className="text-2xl font-semibold text-scbBlue">
                  {results.expectedValue.toFixed(2)}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Risk Metrics</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Volatility</p>
                    <p className="text-sm font-medium">{results.riskMetrics.volatility.toFixed(3)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Sharpe Ratio</p>
                    <p className="text-sm font-medium">{results.riskMetrics.sharpeRatio.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Value at Risk (95%)</p>
                    <p className="text-sm font-medium">{results.riskMetrics.valueatRisk.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Max Drawdown</p>
                    <p className="text-sm font-medium">{results.riskMetrics.maxDrawdown.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Optimal Path</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 text-left">Action</th>
                      <th className="px-4 py-2 text-left">From</th>
                      <th className="px-4 py-2 text-left">To</th>
                      <th className="px-4 py-2 text-left">Expected Value</th>
                      <th className="px-4 py-2 text-left">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.optimalPath.slice(0, 5).map((step, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2 capitalize">{step.action}</td>
                        <td className="px-4 py-2">{step.from}</td>
                        <td className="px-4 py-2">{step.to}</td>
                        <td className="px-4 py-2">{step.expectedValue.toFixed(2)}</td>
                        <td className="px-4 py-2">{(step.confidence * 100).toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {results.optimalPath.length > 5 && (
                <p className="text-xs text-gray-500 mt-1">
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

export default DynamicSankeySimulation;
