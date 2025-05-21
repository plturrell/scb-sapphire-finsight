import React from 'react';
import { Play, Pause, Square as Stop, SkipForward, Settings } from 'lucide-react';

interface SimulationControlsProps {
  status: 'idle' | 'running' | 'paused' | 'complete';
  progress?: {
    iterations: number;
    confidenceInterval?: [number, number];
    timeRemaining?: number;
    timeElapsed?: number;
  };
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onStep: () => void;
  onRun: (config: any) => void;
  className?: string;
}

/**
 * Enhanced Simulation controls with SCB beautiful styling
 * Used in the Tariff Alert Scanner dashboard for impact analysis
 * Follows Fiori Horizon design patterns with SCB color variables
 * Responsive and touch-friendly for both desktop and mobile use
 */
export const EnhancedSimulationControls: React.FC<SimulationControlsProps> = ({
  status,
  progress,
  onPause,
  onResume,
  onStop,
  onStep,
  onRun,
  className = ''
}) => {
  const formatTime = (ms: number) => {
    if (!ms) return '0s';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const [showConfig, setShowConfig] = React.useState(false);
  const [config, setConfig] = React.useState({
    timeHorizon: 24,
    iterations: 5000,
    riskTolerance: 'moderate'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRun(config);
    setShowConfig(false);
  };

  return (
    <div className={`fiori-tile p-0 my-4 ${className}`}>
      <div className="px-4 py-3 border-b border-[rgb(var(--scb-border))] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">
            Simulation {status === 'complete' ? 'Results' : 'Controls'}
          </h3>
          {status !== 'idle' && (
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              status === 'running' ? 'bg-[rgba(var(--horizon-green),0.1)] text-[rgb(var(--horizon-green))]' :
              status === 'paused' ? 'bg-[rgba(var(--warning),0.1)] text-[rgb(var(--warning))]' :
              status === 'complete' ? 'bg-[rgba(var(--horizon-blue),0.1)] text-[rgb(var(--horizon-blue))]' : ''
            }`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          )}
        </div>
        <div className="flex items-center">
          <button
            className="p-1.5 rounded hover:bg-[rgba(var(--scb-light-gray),0.5)] transition-colors"
            onClick={() => setShowConfig(!showConfig)}
            aria-label="Configure simulation"
          >
            <Settings size={16} className="text-[rgb(var(--scb-dark-gray))]" />
          </button>
        </div>
      </div>

      {progress && (
        <div className="px-4 py-3 mb-0 text-xs text-[rgb(var(--scb-dark-gray))] space-y-1 border-b border-[rgb(var(--scb-border))]">
          <div className="flex justify-between">
            <span>Iterations:</span>
            <span className="font-medium">{progress.iterations.toLocaleString()}</span>
          </div>
          {progress.confidenceInterval && (
            <div className="flex justify-between">
              <span>Confidence Interval:</span>
              <span className="font-medium">
                [{progress.confidenceInterval[0].toFixed(2)}, {progress.confidenceInterval[1].toFixed(2)}]
              </span>
            </div>
          )}
          {progress.timeElapsed !== undefined && (
            <div className="flex justify-between">
              <span>Time Elapsed:</span>
              <span className="font-medium">{formatTime(progress.timeElapsed)}</span>
            </div>
          )}
          {progress.timeRemaining !== undefined && status !== 'complete' && (
            <div className="flex justify-between">
              <span>Estimated Remaining:</span>
              <span className="font-medium">{formatTime(progress.timeRemaining)}</span>
            </div>
          )}
        </div>
      )}

      <div className="px-4 py-3 flex flex-wrap gap-2 touch-manipulation">
        {status === 'idle' && (
          <button
            className="fiori-btn fiori-btn-primary flex items-center text-xs touch-min-h"
            onClick={() => onRun(config)}
          >
            <Play size={14} className="mr-1" />
            Run Simulation
          </button>
        )}
        {status === 'running' && (
          <>
            <button
              className="fiori-btn flex items-center text-xs touch-min-h"
              style={{ 
                backgroundColor: 'rgb(var(--warning))', 
                color: 'white',
                borderColor: 'rgb(var(--warning))'
              }}
              onClick={onPause}
            >
              <Pause size={14} className="mr-1" />
              Pause
            </button>
            <button
              className="fiori-btn flex items-center text-xs touch-min-h"
              style={{ 
                backgroundColor: 'rgb(var(--destructive))', 
                color: 'white',
                borderColor: 'rgb(var(--destructive))'
              }}
              onClick={onStop}
            >
              <Stop size={14} className="mr-1" />
              Stop
            </button>
          </>
        )}
        {status === 'paused' && (
          <>
            <button
              className="fiori-btn flex items-center text-xs touch-min-h"
              style={{ 
                backgroundColor: 'rgb(var(--horizon-green))', 
                color: 'white',
                borderColor: 'rgb(var(--horizon-green))'
              }}
              onClick={onResume}
            >
              <Play size={14} className="mr-1" />
              Resume
            </button>
            <button
              className="fiori-btn fiori-btn-primary flex items-center text-xs touch-min-h"
              onClick={onStep}
            >
              <SkipForward size={14} className="mr-1" />
              Step 100
            </button>
            <button
              className="fiori-btn flex items-center text-xs touch-min-h"
              style={{ 
                backgroundColor: 'rgb(var(--destructive))', 
                color: 'white',
                borderColor: 'rgb(var(--destructive))'
              }}
              onClick={onStop}
            >
              <Stop size={14} className="mr-1" />
              Stop
            </button>
          </>
        )}
        {status === 'complete' && (
          <button
            className="fiori-btn fiori-btn-primary flex items-center text-xs touch-min-h"
            onClick={() => setShowConfig(true)}
          >
            <Play size={14} className="mr-1" />
            New Simulation
          </button>
        )}
      </div>

      {showConfig && (
        <div className="px-4 py-3 border-t border-[rgb(var(--scb-border))] bg-[rgba(var(--scb-light-gray),0.2)]">
          <h4 className="text-xs font-medium mb-3 text-[rgb(var(--scb-dark-gray))]">Simulation Configuration</h4>
          <form onSubmit={handleSubmit}>
            <div className="space-y-3">
              <div>
                <label htmlFor="timeHorizon" className="block text-xs text-[rgb(var(--scb-dark-gray))] mb-1">
                  Time Horizon (months)
                </label>
                <input
                  type="number"
                  id="timeHorizon"
                  className="fiori-input text-xs w-full touch-manipulation"
                  value={config.timeHorizon}
                  min={1}
                  max={60}
                  onChange={(e) => setConfig({ ...config, timeHorizon: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label htmlFor="iterations" className="block text-xs text-[rgb(var(--scb-dark-gray))] mb-1">
                  Iterations
                </label>
                <input
                  type="number"
                  id="iterations"
                  className="fiori-input text-xs w-full touch-manipulation"
                  value={config.iterations}
                  min={1000}
                  max={10000}
                  step={1000}
                  onChange={(e) => setConfig({ ...config, iterations: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label htmlFor="riskTolerance" className="block text-xs text-[rgb(var(--scb-dark-gray))] mb-1">
                  Risk Tolerance
                </label>
                <select
                  id="riskTolerance"
                  className="fiori-input text-xs w-full touch-manipulation"
                  value={config.riskTolerance}
                  onChange={(e) => setConfig({ ...config, riskTolerance: e.target.value })}
                >
                  <option value="low">Low (Conservative)</option>
                  <option value="moderate">Moderate (Balanced)</option>
                  <option value="high">High (Aggressive)</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="fiori-btn fiori-btn-primary text-xs touch-min-h"
                >
                  Apply & Run
                </button>
                <button
                  type="button"
                  className="fiori-btn fiori-btn-secondary text-xs touch-min-h"
                  onClick={() => setShowConfig(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default EnhancedSimulationControls;