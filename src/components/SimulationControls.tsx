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
}

/**
 * Simulation controls for the Monte Carlo Tree Search
 * Used in the Tariff Alert Scanner dashboard for impact analysis
 */
export const SimulationControls: React.FC<SimulationControlsProps> = ({
  status,
  progress,
  onPause,
  onResume,
  onStop,
  onStep,
  onRun
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
    <div className="simulation-controls p-4 border rounded-md bg-gray-50 my-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium">Simulation {status === 'complete' ? 'Results' : 'Controls'}</h3>
          {status !== 'idle' && (
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              status === 'running' ? 'bg-green-100 text-green-800' :
              status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
              status === 'complete' ? 'bg-blue-100 text-blue-800' : ''
            }`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            className="p-1.5 rounded hover:bg-gray-200"
            onClick={() => setShowConfig(!showConfig)}
            aria-label="Configure simulation"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {progress && (
        <div className="mb-3 text-xs text-gray-600 space-y-1">
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

      <div className="flex space-x-2">
        {status === 'idle' && (
          <button
            className="px-3 py-1.5 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center"
            onClick={() => onRun(config)}
          >
            <Play size={14} className="mr-1" />
            Run Simulation
          </button>
        )}
        {status === 'running' && (
          <>
            <button
              className="px-3 py-1.5 text-xs font-medium rounded bg-yellow-600 text-white hover:bg-yellow-700 flex items-center"
              onClick={onPause}
            >
              <Pause size={14} className="mr-1" />
              Pause
            </button>
            <button
              className="px-3 py-1.5 text-xs font-medium rounded bg-red-600 text-white hover:bg-red-700 flex items-center"
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
              className="px-3 py-1.5 text-xs font-medium rounded bg-green-600 text-white hover:bg-green-700 flex items-center"
              onClick={onResume}
            >
              <Play size={14} className="mr-1" />
              Resume
            </button>
            <button
              className="px-3 py-1.5 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center"
              onClick={onStep}
            >
              <SkipForward size={14} className="mr-1" />
              Step 100
            </button>
            <button
              className="px-3 py-1.5 text-xs font-medium rounded bg-red-600 text-white hover:bg-red-700 flex items-center"
              onClick={onStop}
            >
              <Stop size={14} className="mr-1" />
              Stop
            </button>
          </>
        )}
        {status === 'complete' && (
          <button
            className="px-3 py-1.5 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center"
            onClick={() => setShowConfig(true)}
          >
            <Play size={14} className="mr-1" />
            New Simulation
          </button>
        )}
      </div>

      {showConfig && (
        <div className="mt-4 p-3 border rounded bg-white">
          <h4 className="text-xs font-medium mb-2">Simulation Configuration</h4>
          <form onSubmit={handleSubmit}>
            <div className="space-y-3">
              <div>
                <label htmlFor="timeHorizon" className="block text-xs text-gray-700 mb-1">
                  Time Horizon (months)
                </label>
                <input
                  type="number"
                  id="timeHorizon"
                  className="text-xs block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={config.timeHorizon}
                  min={1}
                  max={60}
                  onChange={(e) => setConfig({ ...config, timeHorizon: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label htmlFor="iterations" className="block text-xs text-gray-700 mb-1">
                  Iterations
                </label>
                <input
                  type="number"
                  id="iterations"
                  className="text-xs block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={config.iterations}
                  min={1000}
                  max={10000}
                  step={1000}
                  onChange={(e) => setConfig({ ...config, iterations: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label htmlFor="riskTolerance" className="block text-xs text-gray-700 mb-1">
                  Risk Tolerance
                </label>
                <select
                  id="riskTolerance"
                  className="text-xs block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={config.riskTolerance}
                  onChange={(e) => setConfig({ ...config, riskTolerance: e.target.value })}
                >
                  <option value="low">Low (Conservative)</option>
                  <option value="moderate">Moderate (Balanced)</option>
                  <option value="high">High (Aggressive)</option>
                </select>
              </div>
              <div className="flex space-x-2 pt-2">
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Apply & Run
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs font-medium rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
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

export default SimulationControls;
