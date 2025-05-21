import React from 'react';
import { History, Eye, ArrowRight, Plus, BarChart2, RefreshCw, GitCompare } from 'lucide-react';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';

interface SimulationRecord {
  id: string;
  date: string;
  name: string;
  description?: string;
  parameters?: Record<string, any>;
}

interface EnhancedVietnamMonteCarloHistoryProps {
  onViewSimulation: (id: string) => void;
  onCompare: (ids: string[]) => void;
  onNewSimulation: () => void;
  simulations?: SimulationRecord[];
  className?: string;
  theme?: 'light' | 'dark';
  maxItems?: number;
  compact?: boolean;
}

/**
 * EnhancedVietnamMonteCarloHistory Component
 * An enhanced component that displays a history of Monte Carlo simulations
 * with SCB Beautiful UI styling
 */
const EnhancedVietnamMonteCarloHistory: React.FC<EnhancedVietnamMonteCarloHistoryProps> = ({
  onViewSimulation,
  onCompare,
  onNewSimulation,
  simulations = [
    {
      id: 'sim-input-1',
      date: '2025-04-17',
      name: 'Base Case Scenario',
      description: 'Standard tariff impact analysis with default parameters'
    },
    {
      id: 'sim-input-2',
      date: '2025-04-15',
      name: 'High Volatility Scenario',
      description: 'Increased market volatility with adjusted risk factors'
    },
    {
      id: 'sim-input-3',
      date: '2025-04-10',
      name: 'Conservative Estimates',
      description: 'Lower bounds analysis with more conservative parameters'
    }
  ],
  className = '',
  theme: propTheme,
  maxItems = 5,
  compact = false
}) => {
  const { prefersColorScheme } = useDeviceCapabilities();
  
  // Determine effective theme based on props or system preference
  const theme = propTheme || prefersColorScheme || 'light';
  
  // Define SCB colors based on theme
  const colors = {
    light: {
      primary: 'rgb(var(--scb-honolulu-blue, 0, 114, 170))', // #0072AA
      secondary: 'rgb(var(--scb-american-green, 33, 170, 71))', // #21AA47
      accent: '#cc00dc',
      background: 'white',
      cardBackground: 'white',
      headerBackground: '#f5f5f5',
      text: '#333333',
      textSecondary: '#666666',
      border: '#e0e0e0',
      buttonText: 'white',
      buttonSecondaryText: 'rgb(var(--scb-honolulu-blue, 0, 114, 170))',
      buttonSecondaryBorder: 'rgb(var(--scb-honolulu-blue, 0, 114, 170))',
      buttonSecondaryBackground: 'rgba(0, 114, 170, 0.08)',
      buttonSecondaryHover: 'rgba(0, 114, 170, 0.15)',
      itemBackground: '#f9f9f9',
      itemHover: '#f0f0f0',
      itemBorderHover: 'rgb(var(--scb-honolulu-blue, 0, 114, 170))',
      compactCard: {
        background: 'rgba(0, 114, 170, 0.05)',
        border: 'rgb(var(--scb-honolulu-blue, 0, 114, 170))',
        text: 'rgb(var(--scb-honolulu-blue, 0, 114, 170))'
      }
    },
    dark: {
      primary: 'rgb(0, 142, 211)', // Lighter for dark mode
      secondary: 'rgb(41, 204, 86)', // Lighter for dark mode
      accent: '#e838f1',
      background: '#121212',
      cardBackground: '#1e1e1e',
      headerBackground: '#252525',
      text: '#e0e0e0',
      textSecondary: '#a0a0a0',
      border: '#333333',
      buttonText: 'white',
      buttonSecondaryText: 'rgb(0, 142, 211)',
      buttonSecondaryBorder: 'rgb(0, 142, 211)',
      buttonSecondaryBackground: 'rgba(0, 142, 211, 0.1)',
      buttonSecondaryHover: 'rgba(0, 142, 211, 0.2)',
      itemBackground: '#282828',
      itemHover: '#333333',
      itemBorderHover: 'rgb(0, 142, 211)',
      compactCard: {
        background: 'rgba(0, 142, 211, 0.1)',
        border: 'rgb(0, 142, 211)',
        text: 'rgb(0, 142, 211)'
      }
    }
  };
  
  const currentColors = colors[theme];
  
  // Truncate simulations list to maxItems
  const displaySimulations = simulations.slice(0, maxItems);
  
  // Compact view
  if (compact) {
    return (
      <div 
        className={`p-3 rounded-lg ${className}`}
        style={{
          backgroundColor: currentColors.compactCard.background,
          border: `1px solid ${currentColors.compactCard.border}`,
          color: currentColors.text
        }}
      >
        <div 
          className="flex items-center justify-between mb-2 gap-2"
        >
          <div 
            className="font-medium flex items-center gap-1 text-sm"
            style={{ color: currentColors.compactCard.text }}
          >
            <History size={16} />
            <span>Recent Simulations</span>
          </div>
          
          <button
            className="px-2 py-1 text-xs rounded font-medium flex items-center gap-1 transition-colors"
            style={{ 
              backgroundColor: currentColors.primary,
              color: currentColors.buttonText
            }}
            onClick={onNewSimulation}
          >
            <Plus size={12} />
            New
          </button>
        </div>
        
        <div className="space-y-1">
          {displaySimulations.slice(0, 3).map((simulation) => (
            <button
              key={simulation.id}
              className="w-full text-left p-1.5 rounded text-xs flex items-center justify-between transition-colors hover:bg-opacity-50"
              style={{ 
                backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                color: currentColors.text,
                ':hover': { backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }
              }}
              onClick={() => onViewSimulation(simulation.id)}
            >
              <div className="truncate max-w-[80%]">
                {simulation.name}
              </div>
              <Eye size={12} style={{ color: currentColors.primary }} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`rounded-lg overflow-hidden ${className}`}
      style={{ 
        backgroundColor: currentColors.cardBackground,
        border: `1px solid ${currentColors.border}`,
        color: currentColors.text
      }}
    >
      <div 
        className="p-3 border-b horizon-header"
        style={{ 
          backgroundColor: currentColors.headerBackground,
          borderColor: currentColors.border
        }}
      >
        <div className="flex items-center justify-between">
          <div 
            className="font-medium flex items-center gap-2"
            style={{ color: currentColors.text }}
          >
            <History size={18} style={{ color: currentColors.primary }} />
            <span>Monte Carlo Simulation History</span>
          </div>
          
          <button
            className="px-3 py-1 rounded text-xs font-medium flex items-center gap-1"
            style={{ 
              backgroundColor: currentColors.primary,
              color: currentColors.buttonText
            }}
            onClick={onNewSimulation}
          >
            <Plus size={14} />
            New Simulation
          </button>
        </div>
      </div>
      
      <div className="p-3">
        <div 
          className="text-sm mb-4"
          style={{ color: currentColors.textSecondary }}
        >
          View and compare historical Monte Carlo simulations for Vietnam tariff impact analysis.
        </div>
        
        {displaySimulations.length > 0 ? (
          <div className="space-y-2">
            {displaySimulations.map((simulation) => (
              <div 
                key={simulation.id}
                className="p-3 rounded"
                style={{ 
                  backgroundColor: currentColors.itemBackground,
                  border: `1px solid ${currentColors.border}`
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div 
                    className="font-medium"
                    style={{ color: currentColors.text }}
                  >
                    {simulation.name}
                  </div>
                  <div 
                    className="text-xs"
                    style={{ color: currentColors.textSecondary }}
                  >
                    {simulation.date}
                  </div>
                </div>
                
                {simulation.description && (
                  <div 
                    className="text-sm mb-3"
                    style={{ color: currentColors.textSecondary }}
                  >
                    {simulation.description}
                  </div>
                )}
                
                <div className="flex items-center gap-2 mt-2">
                  <button
                    className="px-2.5 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors"
                    style={{ 
                      backgroundColor: currentColors.buttonSecondaryBackground,
                      color: currentColors.buttonSecondaryText,
                      border: `1px solid ${currentColors.buttonSecondaryBorder}`,
                      ':hover': { backgroundColor: currentColors.buttonSecondaryHover }
                    }}
                    onClick={() => onViewSimulation(simulation.id)}
                  >
                    <Eye size={14} />
                    View
                  </button>
                  
                  <button
                    className="px-2.5 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors"
                    style={{ 
                      backgroundColor: currentColors.buttonSecondaryBackground,
                      color: currentColors.buttonSecondaryText,
                      border: `1px solid ${currentColors.buttonSecondaryBorder}`,
                      ':hover': { backgroundColor: currentColors.buttonSecondaryHover }
                    }}
                    onClick={() => onCompare([simulation.id, displaySimulations[0]?.id])}
                  >
                    <GitCompare size={14} />
                    Compare
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div 
            className="p-4 text-center rounded"
            style={{ 
              backgroundColor: currentColors.itemBackground,
              color: currentColors.textSecondary
            }}
          >
            <BarChart2 
              size={24} 
              className="mx-auto mb-2"
              style={{ color: currentColors.primary }}
            />
            <div className="text-sm mb-2">No simulation history found</div>
            <button
              className="px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 mx-auto"
              style={{ 
                backgroundColor: currentColors.primary,
                color: currentColors.buttonText
              }}
              onClick={onNewSimulation}
            >
              <Plus size={14} />
              Run New Simulation
            </button>
          </div>
        )}
        
        {simulations.length > maxItems && (
          <div className="mt-3 text-center">
            <button
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors"
              style={{ 
                backgroundColor: 'transparent',
                color: currentColors.primary
              }}
              onClick={() => onViewSimulation('all')}
            >
              <span>View All Simulations</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
      
      <div 
        className="p-3 border-t text-xs flex items-center justify-between"
        style={{ 
          borderColor: currentColors.border,
          backgroundColor: currentColors.headerBackground
        }}
      >
        <div 
          className="flex items-center gap-1"
          style={{ color: currentColors.textSecondary }}
        >
          <RefreshCw size={12} />
          <span>Last updated: Today at 09:45</span>
        </div>
        
        <button
          className="text-xs"
          style={{ color: currentColors.primary }}
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default EnhancedVietnamMonteCarloHistory;