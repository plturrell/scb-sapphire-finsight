import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { SankeyData } from '../types';
import { Info, RefreshCw, Edit, ChevronRight, ChevronDown, Shield } from 'lucide-react';

// Import the Sankey chart dynamically to avoid SSR issues with D3
const DynamicSankeyChart = dynamic(
  () => import('./charts/EnhancedSankeyChart'),
  { ssr: false }
);

interface TariffImpactVisualizationProps {
  data: SankeyData | null;
  isLoading?: boolean;
  onRegenerateClick?: () => void;
  onEditClick?: () => void;
  className?: string;
  title?: string;
}

/**
 * Enhanced TariffImpactVisualization component with SCB beautiful styling
 * Uses the EnhancedSankeyChart to visualize tariff impacts across countries and products
 * Follows Fiori Horizon design patterns with SCB color variables
 * Includes AI-enhanced insights with recommendations
 */
const EnhancedTariffImpactVisualization: React.FC<TariffImpactVisualizationProps> = ({
  data,
  isLoading = false,
  onRegenerateClick,
  onEditClick,
  className = "",
  title = "Tariff Impact Visualization"
}) => {
  const [insightsExpanded, setInsightsExpanded] = useState(true);
  
  if (isLoading) {
    return (
      <div className={`fiori-tile h-full flex flex-col items-center justify-center py-16 ${className}`}>
        <div className="w-16 h-16 flex items-center justify-center mb-6">
          <RefreshCw size={36} className="text-[rgb(var(--scb-honolulu-blue))] animate-spin" />
        </div>
        <h3 className="text-base font-medium text-[rgb(var(--scb-dark-gray))] mb-2">Running Impact Simulation</h3>
        <p className="text-sm text-[rgb(var(--scb-dark-gray))] opacity-80 max-w-md text-center">
          Analyzing tariff data with Monte Carlo Tree Search to generate optimal pathways...
        </p>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className={`fiori-tile h-full flex flex-col items-center justify-center py-16 ${className}`}>
        <div className="w-16 h-16 rounded-full bg-[rgba(var(--scb-honolulu-blue),0.1)] flex items-center justify-center mb-6">
          <Info size={28} className="text-[rgb(var(--scb-honolulu-blue))]" />
        </div>
        <h3 className="text-base font-medium text-[rgb(var(--scb-dark-gray))] mb-2">{title}</h3>
        <p className="text-sm text-[rgb(var(--scb-dark-gray))] opacity-80 mb-4">
          Run a simulation to generate a tariff impact visualization
        </p>
        <button
          className="fiori-btn fiori-btn-primary text-xs touch-min-h"
          onClick={onRegenerateClick}
        >
          Run Simulation
        </button>
      </div>
    );
  }
  
  return (
    <div className={`fiori-tile h-full flex flex-col overflow-hidden ${className}`}>
      <div className="px-4 py-3 border-b border-[rgb(var(--scb-border))]">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-[rgb(var(--scb-dark-gray))]">{title}</h3>
          
          <div className="flex items-center gap-2">
            <button
              className="ai-control-btn"
              onClick={onRegenerateClick}
              title="Regenerate visualization"
            >
              <RefreshCw size={14} />
            </button>
            
            <button
              className="ai-control-btn"
              onClick={onEditClick}
              title="Edit parameters"
            >
              <Edit size={14} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Visualization Area */}
      <div className="flex-1 p-4 overflow-auto">
        <DynamicSankeyChart 
          data={data} 
          width={800} 
          height={500}
          title={title}
          showAIControls={true}
          onRegenerateClick={onRegenerateClick}
          onEditClick={onEditClick}
        />
      </div>
      
      {/* AI Insights Panel */}
      {data.aiInsights && (
        <div className="border-t border-[rgb(var(--scb-border))] bg-[rgba(var(--scb-light-gray),0.3)]">
          <div 
            className="px-4 py-3 flex items-center justify-between cursor-pointer touch-manipulation hover:bg-[rgba(var(--scb-light-gray),0.5)] transition-colors"
            onClick={() => setInsightsExpanded(!insightsExpanded)}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[rgba(var(--horizon-green),0.15)] flex items-center justify-center">
                <Shield size={14} className="text-[rgb(var(--horizon-green))]" />
              </div>
              <h3 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">AI Insights & Recommendations</h3>
              <div className="horizon-chip horizon-chip-green text-xs">
                {Math.round(data.aiInsights.confidence * 100)}% confidence
              </div>
            </div>
            <div>
              {insightsExpanded ? 
                <ChevronDown size={16} className="text-[rgb(var(--scb-dark-gray))] opacity-60" /> : 
                <ChevronRight size={16} className="text-[rgb(var(--scb-dark-gray))] opacity-60" />
              }
            </div>
          </div>
          
          {insightsExpanded && (
            <div className="px-4 py-3 border-t border-[rgb(var(--scb-border))] animate-fadeIn">
              <div className="ai-generated-content">
                <p className="text-sm text-[rgb(var(--scb-dark-gray))] mb-4">
                  {data.aiInsights.summary}
                </p>
                
                <h4 className="text-xs font-medium text-[rgb(var(--scb-dark-gray))] mb-3">Recommendations:</h4>
                <ul className="text-xs text-[rgb(var(--scb-dark-gray))] space-y-2.5 mb-4">
                  {data.aiInsights.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-5 h-5 rounded-full bg-[rgba(var(--scb-honolulu-blue),0.1)] flex items-center justify-center">
                          <span className="text-[10px] font-bold text-[rgb(var(--scb-honolulu-blue))]">{index + 1}</span>
                        </div>
                      </div>
                      <p>{rec}</p>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-3 pt-3 border-t border-[rgba(var(--scb-border),0.5)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70">
                  Last updated: {new Date(data.aiInsights.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    className="fiori-btn fiori-btn-secondary text-xs touch-min-h"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onRegenerateClick) onRegenerateClick();
                    }}
                  >
                    <RefreshCw size={12} className="mr-1" />
                    Regenerate
                  </button>
                  
                  <button
                    className="fiori-btn fiori-btn-secondary text-xs touch-min-h"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onEditClick) onEditClick();
                    }}
                  >
                    <Edit size={12} className="mr-1" />
                    Edit Parameters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedTariffImpactVisualization;