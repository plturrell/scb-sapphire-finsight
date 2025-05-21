import React from 'react';
import { Info, Download, BarChart2, RefreshCw, ChevronRight, ArrowDown, ArrowUp, Minus, AlertCircle } from 'lucide-react';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import { useNetworkAwareLoading } from '@/hooks/useNetworkAwareLoading';

export interface SensitivityParameter {
  name: string;
  impactFactor: number; // 0 to 1 scale
  correlation: number; // -1 to 1 scale
}

interface EnhancedSensitivityAnalysisProps {
  parameters: SensitivityParameter[] | null;
  metricName?: string;
  loading?: boolean;
  onDetailedAnalysis?: () => void;
  onExportData?: () => void;
  className?: string;
  theme?: 'light' | 'dark';
  adaptive?: boolean;
  showHelp?: boolean;
}

/**
 * EnhancedVietnamMonteCarloSensitivity Component
 * An enhanced component that displays parameter sensitivity analysis 
 * for Monte Carlo simulation results with SCB Beautiful UI styling
 */
const EnhancedVietnamMonteCarloSensitivity: React.FC<EnhancedSensitivityAnalysisProps> = ({
  parameters,
  metricName = 'Revenue Impact',
  loading = false,
  onDetailedAnalysis,
  onExportData,
  className = '',
  theme: propTheme,
  adaptive = true,
  showHelp = true
}) => {
  const { prefersColorScheme, tier } = useDeviceCapabilities();
  const { connection } = useNetworkAwareLoading();
  
  // Determine effective theme based on props or system preference
  const theme = propTheme || prefersColorScheme || 'light';
  
  // Determine detail level based on device tier and network conditions
  const detailLevel = adaptive 
    ? (connection.type === 'slow-2g' || connection.type === '2g' || tier === 'low') 
      ? 'low' 
      : connection.type === '3g' 
        ? 'medium' 
        : 'high'
    : 'high';
  
  // Define SCB colors based on theme
  const colors = {
    light: {
      // Primary SCB colors
      honoluluBlue: 'rgb(var(--scb-honolulu-blue, 0, 114, 170))', // #0072AA
      americanGreen: 'rgb(var(--scb-american-green, 33, 170, 71))', // #21AA47
      sun: 'rgb(var(--scb-sun, 255, 204, 0))', // #FFCC00
      persianRed: 'rgb(var(--scb-persian-red, 204, 0, 0))', // #CC0000
      
      // UI elements
      background: 'white',
      cardBackground: 'white',
      headerBackground: '#f8f8f8',
      text: '#333333',
      textSecondary: '#666666',
      border: '#e0e0e0',
      tableBorder: '#eaeaea',
      tableHeader: '#f5f5f5',
      tableRow: '#ffffff',
      tableRowAlt: '#f9f9f9',
      buttonText: 'white',
      
      // Correlation colors
      correlationPositiveStrong: 'rgb(var(--scb-american-green, 33, 170, 71))',
      correlationPositive: '#83C686',
      correlationNeutral: '#888888',
      correlationNegative: '#F3A86B',
      correlationNegativeStrong: 'rgb(var(--scb-persian-red, 204, 0, 0))',
      
      // Impact bar
      impactBarBackground: '#eaeaea',
      impactBarFill: '#a87fff',
      
      // Button states
      buttonSecondaryText: 'rgb(var(--scb-honolulu-blue, 0, 114, 170))',
      buttonSecondaryBorder: 'rgb(var(--scb-honolulu-blue, 0, 114, 170))',
      buttonSecondaryBackground: 'rgba(0, 114, 170, 0.08)',
      buttonSecondaryHover: 'rgba(0, 114, 170, 0.15)'
    },
    dark: {
      // Primary SCB colors - lighter for dark mode
      honoluluBlue: 'rgb(0, 142, 211)', // Lighter for dark mode
      americanGreen: 'rgb(41, 204, 86)', // Lighter for dark mode
      sun: 'rgb(255, 214, 51)', // Lighter for dark mode
      persianRed: 'rgb(255, 99, 99)', // Lighter for dark mode
      
      // UI elements
      background: '#121212',
      cardBackground: '#1e1e1e',
      headerBackground: '#252525',
      text: '#e0e0e0',
      textSecondary: '#a0a0a0',
      border: '#333333',
      tableBorder: '#333333',
      tableHeader: '#252525',
      tableRow: '#1e1e1e',
      tableRowAlt: '#242424',
      buttonText: 'white',
      
      // Correlation colors
      correlationPositiveStrong: 'rgb(41, 204, 86)', // Lighter for dark mode
      correlationPositive: '#7BD17E',
      correlationNeutral: '#a0a0a0',
      correlationNegative: '#FFB366',
      correlationNegativeStrong: 'rgb(255, 99, 99)', // Lighter for dark mode
      
      // Impact bar
      impactBarBackground: '#333333',
      impactBarFill: '#ba8fff',
      
      // Button states
      buttonSecondaryText: 'rgb(0, 142, 211)',
      buttonSecondaryBorder: 'rgb(0, 142, 211)',
      buttonSecondaryBackground: 'rgba(0, 142, 211, 0.1)',
      buttonSecondaryHover: 'rgba(0, 142, 211, 0.2)'
    }
  };
  
  const currentColors = colors[theme];

  // Function to determine bar color based on correlation
  const getCorrelationColor = (correlation: number): string => {
    if (correlation > 0.5) return currentColors.correlationPositiveStrong;
    if (correlation > 0) return currentColors.correlationPositive;
    if (correlation === 0) return currentColors.correlationNeutral;
    if (correlation > -0.5) return currentColors.correlationNegative;
    return currentColors.correlationNegativeStrong;
  };
  
  // Function to get correlation icon
  const getCorrelationIcon = (correlation: number) => {
    if (correlation > 0.2) return <ArrowUp size={14} />;
    if (correlation < -0.2) return <ArrowDown size={14} />;
    return <Minus size={14} />;
  };

  // Function to render impact factor bars
  const renderImpactBar = (impactFactor: number): JSX.Element => {
    return (
      <div className="flex items-center w-full gap-2">
        <div 
          className="h-3 flex-1 rounded-full overflow-hidden relative"
          style={{ backgroundColor: currentColors.impactBarBackground }}
        >
          <div
            className="absolute top-0 left-0 h-full rounded-full"
            style={{ 
              width: `${impactFactor * 100}%`,
              backgroundColor: currentColors.impactBarFill
            }}
          />
        </div>
        <div 
          className="text-xs min-w-[2.5rem] text-right"
          style={{ color: currentColors.text }}
        >
          {impactFactor.toFixed(2)}
        </div>
      </div>
    );
  };

  // Sort parameters by impact factor (highest first)
  const sortedParameters = parameters 
    ? [...parameters].sort((a, b) => b.impactFactor - a.impactFactor)
    : [];
    
  // Limit displayed parameters for low detail mode
  const displayParameters = detailLevel === 'low' 
    ? sortedParameters.slice(0, 3) 
    : sortedParameters;
  
  // Do we have more parameters than we're showing?
  const hasMoreParameters = sortedParameters.length > displayParameters.length;

  return (
    <div 
      className={`rounded-lg overflow-hidden ${className}`}
      style={{ 
        backgroundColor: currentColors.cardBackground,
        border: `1px solid ${currentColors.border}`,
        color: currentColors.text
      }}
    >
      {/* Header */}
      <div 
        className="p-3 border-b horizon-header flex items-center justify-between"
        style={{ 
          backgroundColor: currentColors.headerBackground,
          borderColor: currentColors.border
        }}
      >
        <div 
          className="font-medium flex items-center gap-2"
          style={{ color: currentColors.text }}
        >
          <BarChart2 size={18} style={{ color: currentColors.honoluluBlue }} />
          <span>Parameter Sensitivity Analysis</span>
        </div>
        
        {/* Info tooltip */}
        {showHelp && (
          <div className="relative group">
            <button
              className="p-1 rounded-full transition-colors hover:bg-opacity-10"
              style={{ 
                color: currentColors.textSecondary,
                backgroundColor: 'transparent',
                ':hover': { backgroundColor: currentColors.buttonSecondaryHover } 
              }}
            >
              <Info size={16} />
            </button>
            
            <div 
              className="absolute right-0 top-full mt-2 z-10 p-2 text-xs rounded invisible group-hover:visible transition-opacity opacity-0 group-hover:opacity-100 w-64"
              style={{ 
                backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.8)',
                color: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            >
              Analyze which parameters have the most significant impact on simulation results. Impact factor measures sensitivity while correlation shows the direction of influence.
            </div>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4">
        {parameters && parameters.length > 0 ? (
          <>
            {/* Table */}
            <div 
              className="w-full rounded-md overflow-hidden border mb-4"
              style={{ borderColor: currentColors.tableBorder }}
            >
              {/* Table header */}
              <div 
                className="grid grid-cols-12 text-sm font-medium p-2"
                style={{ 
                  backgroundColor: currentColors.tableHeader,
                  borderBottom: `1px solid ${currentColors.tableBorder}`
                }}
              >
                <div 
                  className="col-span-4"
                  style={{ color: currentColors.text }}
                >
                  Parameter
                </div>
                <div 
                  className="col-span-6"
                  style={{ color: currentColors.text }}
                >
                  Impact Factor
                </div>
                <div 
                  className="col-span-2 text-center"
                  style={{ color: currentColors.text }}
                >
                  Correlation
                </div>
              </div>
              
              {/* Table body */}
              <div className="w-full">
                {displayParameters.map((param, idx) => (
                  <div 
                    key={param.name}
                    className="grid grid-cols-12 p-3 text-sm items-center"
                    style={{ 
                      backgroundColor: idx % 2 === 0 ? currentColors.tableRow : currentColors.tableRowAlt,
                      borderBottom: idx < displayParameters.length - 1 ? `1px solid ${currentColors.tableBorder}` : 'none'
                    }}
                  >
                    <div 
                      className="col-span-4 font-medium truncate pr-2"
                      style={{ color: currentColors.text }}
                    >
                      {param.name}
                    </div>
                    <div className="col-span-6">
                      {renderImpactBar(param.impactFactor)}
                    </div>
                    <div 
                      className="col-span-2 flex justify-center items-center gap-1 font-medium"
                      style={{ color: getCorrelationColor(param.correlation) }}
                    >
                      {getCorrelationIcon(param.correlation)}
                      <span>{param.correlation > 0 ? '+' : ''}{param.correlation.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* "More parameters" message if in low detail mode */}
            {hasMoreParameters && (
              <div 
                className="text-xs rounded py-1.5 px-3 mb-4 text-center"
                style={{ 
                  backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  color: currentColors.textSecondary
                }}
              >
                Showing top {displayParameters.length} parameters by impact. {sortedParameters.length - displayParameters.length} more available in detailed view.
              </div>
            )}
            
            {/* Help text */}
            {showHelp && (
              <div 
                className="text-sm mb-4"
                style={{ color: currentColors.textSecondary }}
              >
                <span className="font-medium">Impact Factor</span> indicates how strongly a parameter affects the {metricName.toLowerCase()}.
                <br />
                <span className="font-medium">Correlation</span> shows the direction of influence (positive or negative).
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex flex-wrap justify-between gap-2">
              <button
                className="px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1.5 transition-colors"
                style={{ 
                  backgroundColor: currentColors.buttonSecondaryBackground,
                  color: currentColors.buttonSecondaryText,
                  border: `1px solid ${currentColors.buttonSecondaryBorder}`,
                  ':hover': { backgroundColor: currentColors.buttonSecondaryHover }
                }}
                onClick={onDetailedAnalysis}
              >
                <BarChart2 size={16} />
                Detailed Analysis
              </button>
              
              <button
                className="px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1.5 transition-colors"
                style={{ 
                  backgroundColor: currentColors.buttonSecondaryBackground,
                  color: currentColors.buttonSecondaryText,
                  border: `1px solid ${currentColors.buttonSecondaryBorder}`,
                  ':hover': { backgroundColor: currentColors.buttonSecondaryHover }
                }}
                onClick={onExportData}
              >
                <Download size={16} />
                Export Data
              </button>
            </div>
          </>
        ) : loading ? (
          <div 
            className="flex flex-col items-center justify-center py-8"
            style={{ color: currentColors.textSecondary }}
          >
            <div 
              className="animate-spin h-10 w-10 mb-4"
              style={{ 
                borderWidth: '3px',
                borderStyle: 'solid',
                borderColor: `${currentColors.honoluluBlue} transparent transparent transparent`,
                borderRadius: '50%'
              }}
            ></div>
            <div className="text-center">
              <div className="mb-1">Calculating sensitivity analysis...</div>
              <div className="text-sm">
                Analyzing parameter impacts for {metricName}
              </div>
            </div>
          </div>
        ) : (
          <div 
            className="flex flex-col items-center justify-center py-8 text-center"
            style={{ color: currentColors.textSecondary }}
          >
            <BarChart2 
              size={40}
              className="mb-4 opacity-40"
            />
            <div className="mb-1 font-medium" style={{ color: currentColors.text }}>
              No Sensitivity Data Available
            </div>
            <div className="text-sm mb-4">
              Run the Monte Carlo simulation to analyze parameter sensitivity
            </div>
            <button
              className="px-4 py-2 rounded text-sm font-medium flex items-center gap-2"
              style={{ 
                backgroundColor: currentColors.honoluluBlue,
                color: currentColors.buttonText
              }}
              onClick={() => window.location.href = '#simulation'}
            >
              <RefreshCw size={16} />
              Run Simulation
            </button>
          </div>
        )}
        
        {/* Network/device optimization notice */}
        {adaptive && parameters && parameters.length > 0 && detailLevel === 'low' && (
          <div 
            className="mt-4 p-2 text-center text-xs border-t"
            style={{ 
              borderColor: currentColors.border,
              color: currentColors.textSecondary
            }}
          >
            <div className="flex items-center justify-center gap-1">
              <AlertCircle size={12} style={{ color: currentColors.sun }} />
              <span>
                Simplified view optimized for current network/device conditions
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedVietnamMonteCarloSensitivity;