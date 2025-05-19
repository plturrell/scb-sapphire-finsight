import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { SankeyData } from '../types';
import { Info, RefreshCw, Edit, ChevronRight, ChevronDown } from 'lucide-react';

// Import the Sankey chart dynamically to avoid SSR issues with D3
const DynamicSankeyChart = dynamic(
  () => import('./SankeyChart'),
  { ssr: false }
);

interface TariffImpactVisualizationProps {
  data: SankeyData | null;
  isLoading?: boolean;
  onRegenerateClick?: () => void;
  onEditClick?: () => void;
}

/**
 * TariffImpactVisualization component for the Tariff Alert Scanner
 * Uses the SankeyChart to visualize tariff impacts across countries and products
 */
const TariffImpactVisualization: React.FC<TariffImpactVisualizationProps> = ({
  data,
  isLoading = false,
  onRegenerateClick,
  onEditClick
}) => {
  const [insightsExpanded, setInsightsExpanded] = useState(true);
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <RefreshCw size={36} className="text-blue-600 animate-spin mb-4" />
        <h3 className="text-sm font-medium text-gray-900">Running Impact Simulation</h3>
        <p className="text-xs text-gray-500 mt-1">
          Analyzing tariff data with Monte Carlo Tree Search...
        </p>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
          <Info size={24} className="text-blue-600" />
        </div>
        <h3 className="text-sm font-medium text-gray-900">No Visualization Data</h3>
        <p className="text-xs text-gray-500 mt-1">
          Run a simulation to generate a tariff impact visualization
        </p>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Main Visualization Area */}
      <div className="flex-1 p-4">
        <DynamicSankeyChart 
          data={data} 
          width={800} 
          height={500}
          title="Tariff Impact Flow Visualization"
          showAIControls={true}
          onRegenerateClick={onRegenerateClick}
          onEditClick={onEditClick}
        />
      </div>
      
      {/* AI Insights Panel */}
      {data.aiInsights && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div 
            className="px-4 py-3 flex items-center justify-between cursor-pointer"
            onClick={() => setInsightsExpanded(!insightsExpanded)}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                <Info size={14} className="text-green-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-900">AI Insights & Recommendations</h3>
              <div className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
                {Math.round(data.aiInsights.confidence * 100)}% confidence
              </div>
            </div>
            <div>
              {insightsExpanded ? 
                <ChevronDown size={16} className="text-gray-400" /> : 
                <ChevronRight size={16} className="text-gray-400" />
              }
            </div>
          </div>
          
          {insightsExpanded && (
            <div className="px-4 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-700 mb-3">
                {data.aiInsights.summary}
              </p>
              
              <h4 className="text-xs font-medium text-gray-700 mb-2">Recommendations:</h4>
              <ul className="text-xs text-gray-700 space-y-1.5">
                {data.aiInsights.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-blue-700">{index + 1}</span>
                      </div>
                    </div>
                    <p>{rec}</p>
                  </li>
                ))}
              </ul>
              
              <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Last updated: {data.aiInsights.updatedAt.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onRegenerateClick) onRegenerateClick();
                    }}
                  >
                    <RefreshCw size={12} className="mr-1" />
                    Regenerate
                  </button>
                  
                  <button
                    className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
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

export default TariffImpactVisualization;
