import React from 'react';
import { Info, AlertCircle, TrendingDown, TrendingUp, Percent, DollarSign, BarChart2 } from 'lucide-react';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import { useNetworkAwareLoading } from '@/hooks/useNetworkAwareLoading';

interface EnhancedCaseAnalysisProps {
  data: number[] | null;
  metricName?: string;
  metricUnit?: string;
  caseBoundaries?: {
    pessimistic: [number, number]; // percentiles [0-100]
    realistic: [number, number];
    optimistic: [number, number];
  };
  className?: string;
  theme?: 'light' | 'dark';
  showProbability?: boolean;
  showInterpretation?: boolean;
  showMean?: boolean;
}

/**
 * EnhancedVietnamMonteCarloCaseAnalysis Component
 * An enhanced analysis component that displays pessimistic, realistic, and optimistic case
 * predictions based on Monte Carlo simulation results with SCB Beautiful UI styling
 */
const EnhancedVietnamMonteCarloCaseAnalysis: React.FC<EnhancedCaseAnalysisProps> = ({
  data,
  metricName = 'Revenue Impact',
  metricUnit = '$M',
  caseBoundaries = {
    pessimistic: [0, 5],
    realistic: [5, 95],
    optimistic: [95, 100]
  },
  className = '',
  theme: propTheme,
  showProbability = true,
  showInterpretation = true,
  showMean = true
}) => {
  const { prefersColorScheme, tier } = useDeviceCapabilities();
  const { connection } = useNetworkAwareLoading();
  
  // Determine effective theme based on props or system preference
  const theme = propTheme || prefersColorScheme || 'light';
  
  // Define SCB colors based on theme
  const scbColors = {
    light: {
      // Primary SCB colors
      honoluluBlue: 'rgb(var(--scb-honolulu-blue, 0, 114, 170))', // #0072AA
      americanGreen: 'rgb(var(--scb-american-green, 33, 170, 71))', // #21AA47
      sun: 'rgb(var(--scb-sun, 255, 204, 0))', // #FFCC00
      persianRed: 'rgb(var(--scb-persian-red, 204, 0, 0))', // #CC0000
      
      // Case analysis specific colors
      pessimistic: '#d60542', // red
      realistic: '#0072AA',   // SCB blue
      optimistic: '#21AA47',  // SCB green
      
      // UI elements
      background: 'white',
      cardBackground: 'white',
      headerBackground: '#f8f8f8',
      text: '#333333',
      textSecondary: '#666666',
      border: '#e0e0e0',
      divider: '#eeeeee',
      hoverBackground: 'rgba(0, 114, 170, 0.08)',
      tooltip: {
        background: 'rgba(0, 0, 0, 0.8)',
        text: 'white'
      }
    },
    dark: {
      // Primary SCB colors - lighter for dark mode
      honoluluBlue: 'rgb(0, 142, 211)', // Lighter for dark mode
      americanGreen: 'rgb(41, 204, 86)', // Lighter for dark mode
      sun: 'rgb(255, 214, 51)', // Lighter for dark mode
      persianRed: 'rgb(255, 99, 99)', // Lighter for dark mode
      
      // Case analysis specific colors
      pessimistic: '#ff4d6d', // brighter red for dark mode
      realistic: '#0095db',   // brighter blue for dark mode
      optimistic: '#29cc56',  // brighter green for dark mode
      
      // UI elements
      background: '#121212',
      cardBackground: '#1e1e1e',
      headerBackground: '#252525',
      text: '#e0e0e0',
      textSecondary: '#a0a0a0',
      border: '#333333',
      divider: '#333333',
      hoverBackground: 'rgba(0, 142, 211, 0.15)',
      tooltip: {
        background: 'rgba(0, 0, 0, 0.9)',
        text: 'white'
      }
    }
  };
  
  const colors = scbColors[theme];

  // Format numbers for display
  const formatNumber = (num: number): string => {
    if (Math.abs(num) >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(1)}M`;
    } else if (Math.abs(num) >= 1_000) {
      return `${(num / 1_000).toFixed(1)}K`;
    } else {
      return num.toFixed(2);
    }
  };

  // Format currency values
  const formatCurrency = (num: number): string => {
    if (metricUnit === '$M') {
      return `$${formatNumber(num)}`;
    } else if (metricUnit === '$K') {
      return `$${formatNumber(num * 1000)}`;
    } else {
      return `${formatNumber(num)}${metricUnit}`;
    }
  };

  // Calculate case statistics from data
  const calculateCaseStats = (data: number[] | null) => {
    if (!data || data.length === 0) {
      return {
        pessimistic: { range: [0, 0], mean: 0, probability: 0, interpretation: '' },
        realistic: { range: [0, 0], mean: 0, probability: 0, interpretation: '' },
        optimistic: { range: [0, 0], mean: 0, probability: 0, interpretation: '' }
      };
    }

    const sortedData = [...data].sort((a, b) => a - b);
    
    // Helper to get value at percentile
    const getPercentileValue = (percentile: number) => {
      const index = Math.floor((percentile / 100) * sortedData.length);
      return sortedData[Math.min(index, sortedData.length - 1)];
    };

    // Calculate ranges based on percentiles
    const pessimisticRange = [
      getPercentileValue(caseBoundaries.pessimistic[0]),
      getPercentileValue(caseBoundaries.pessimistic[1])
    ];
    
    const realisticRange = [
      getPercentileValue(caseBoundaries.realistic[0]),
      getPercentileValue(caseBoundaries.realistic[1])
    ];
    
    const optimisticRange = [
      getPercentileValue(caseBoundaries.optimistic[0]),
      getPercentileValue(caseBoundaries.optimistic[1])
    ];

    // Calculate mean values for each case
    const calculateMean = (min: number, max: number) => {
      const values = sortedData.filter(v => v >= min && v <= max);
      if (values.length === 0) return 0;
      const sum = values.reduce((acc, val) => acc + val, 0);
      return sum / values.length;
    };

    const pessimisticMean = calculateMean(pessimisticRange[0], pessimisticRange[1]);
    const realisticMean = calculateMean(realisticRange[0], realisticRange[1]);
    const optimisticMean = calculateMean(optimisticRange[0], optimisticRange[1]);

    // Calculate probabilities (percentages)
    const pessimisticProb = caseBoundaries.pessimistic[1] - caseBoundaries.pessimistic[0];
    const realisticProb = caseBoundaries.realistic[1] - caseBoundaries.realistic[0];
    const optimisticProb = caseBoundaries.optimistic[1] - caseBoundaries.optimistic[0];

    // Generate interpretations based on mean values
    const generateInterpretation = (mean: number, type: 'pessimistic' | 'realistic' | 'optimistic') => {
      if (type === 'pessimistic') {
        if (mean < 0) return 'High risk of significant loss';
        return 'Limited downside risk';
      } else if (type === 'realistic') {
        if (mean < 0) return 'Likely negative outcome with moderate losses';
        if (mean > 0 && mean < pessimisticRange[1] * 2) return 'Modest positive outcome expected';
        return 'Strongly positive expected outcome';
      } else {
        if (mean < optimisticRange[0] * 1.5) return 'Moderate upside potential';
        return 'Exceptional upside potential';
      }
    };

    return {
      pessimistic: {
        range: pessimisticRange,
        mean: pessimisticMean,
        probability: pessimisticProb,
        interpretation: generateInterpretation(pessimisticMean, 'pessimistic')
      },
      realistic: {
        range: realisticRange,
        mean: realisticMean,
        probability: realisticProb,
        interpretation: generateInterpretation(realisticMean, 'realistic')
      },
      optimistic: {
        range: optimisticRange,
        mean: optimisticMean,
        probability: optimisticProb,
        interpretation: generateInterpretation(optimisticMean, 'optimistic')
      }
    };
  };

  const caseStats = calculateCaseStats(data);

  // Generate case analysis box
  const CaseBox = ({ 
    type, 
    caseColor, 
    title, 
    subtitle,
    caseData,
    icon
  }: { 
    type: 'pessimistic' | 'realistic' | 'optimistic';
    caseColor: string; 
    title: string;
    subtitle: string;
    caseData: any;
    icon: React.ReactNode;
  }) => {
    return (
      <div 
        className="relative rounded-lg overflow-hidden transition-transform duration-300 hover:translate-y-[-4px]"
        style={{ 
          backgroundColor: colors.cardBackground,
          border: `1px solid ${colors.border}`,
          boxShadow: theme === 'dark' ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.05)',
          height: '100%'
        }}
      >
        {/* Top border accent */}
        <div 
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: caseColor }}
        ></div>
        
        {/* Header */}
        <div 
          className="flex items-center justify-between p-3 border-b"
          style={{ 
            borderColor: colors.border
          }}
        >
          <div>
            <div 
              className="font-medium text-sm horizon-header mb-1 flex items-center gap-2"
              style={{ color: caseColor }}
            >
              {icon}
              {title}
            </div>
            <div 
              className="text-xs"
              style={{ color: colors.textSecondary }}
            >
              {subtitle}
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-3">
          {/* Range */}
          <div className="mb-3">
            <div 
              className="flex items-center gap-1 mb-1 text-xs font-medium"
              style={{ color: colors.textSecondary }}
            >
              <BarChart2 size={14} />
              Range:
            </div>
            <div 
              className="text-sm font-bold"
              style={{ color: colors.text }}
            >
              {formatCurrency(caseData.range[0])} to {formatCurrency(caseData.range[1])}
            </div>
          </div>
          
          <div 
            className="my-2"
            style={{ 
              height: '1px',
              backgroundColor: colors.divider 
            }}
          ></div>
          
          {/* Probability (optional) */}
          {showProbability && (
            <>
              <div className="mb-3">
                <div 
                  className="flex items-center gap-1 mb-1 text-xs font-medium"
                  style={{ color: colors.textSecondary }}
                >
                  <Percent size={14} />
                  Probability:
                </div>
                <div 
                  className="text-sm font-bold"
                  style={{ color: colors.text }}
                >
                  {caseData.probability}%
                </div>
              </div>
              
              <div 
                className="my-2"
                style={{ 
                  height: '1px',
                  backgroundColor: colors.divider 
                }}
              ></div>
            </>
          )}
          
          {/* Mean (optional) */}
          {showMean && (
            <>
              <div className="mb-3">
                <div 
                  className="flex items-center gap-1 mb-1 text-xs font-medium"
                  style={{ color: colors.textSecondary }}
                >
                  <DollarSign size={14} />
                  Mean:
                </div>
                <div 
                  className="text-sm font-bold"
                  style={{ color: colors.text }}
                >
                  {formatCurrency(caseData.mean)}
                </div>
              </div>
              
              <div 
                className="my-2"
                style={{ 
                  height: '1px',
                  backgroundColor: colors.divider 
                }}
              ></div>
            </>
          )}
          
          {/* Interpretation (optional) */}
          {showInterpretation && (
            <div>
              <div 
                className="flex items-center gap-1 mb-1 text-xs font-medium"
                style={{ color: colors.textSecondary }}
              >
                <Info size={14} />
                Interpretation:
              </div>
              <div 
                className="text-sm"
                style={{ color: colors.text }}
              >
                {caseData.interpretation}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`mb-6 ${className}`}
      style={{ color: colors.text }}
    >
      {/* Main card */}
      <div 
        className="rounded-lg overflow-hidden"
        style={{ 
          backgroundColor: colors.cardBackground,
          border: `1px solid ${colors.border}`,
          boxShadow: theme === 'dark' ? '0 4px 15px rgba(0,0,0,0.2)' : '0 4px 15px rgba(0,0,0,0.08)'
        }}
      >
        {/* Card header */}
        <div 
          className="flex items-center justify-between p-3 horizon-header"
          style={{ 
            backgroundColor: colors.headerBackground,
            borderBottom: `1px solid ${colors.border}`
          }}
        >
          <div 
            className="font-medium flex items-center gap-2"
            style={{ color: colors.text }}
          >
            <BarChart2 
              size={18} 
              style={{ color: colors.honoluluBlue }}
            />
            <span>Monte Carlo Case Analysis</span>
          </div>
          
          {/* Info tooltip */}
          <div className="relative group">
            <button
              className="p-1 rounded-full transition-colors hover:bg-opacity-10"
              style={{ 
                color: colors.textSecondary,
                backgroundColor: 'transparent',
                ':hover': { backgroundColor: colors.hoverBackground } 
              }}
            >
              <Info size={16} />
            </button>
            
            <div 
              className="absolute right-0 top-full mt-2 z-10 p-2 text-xs rounded invisible group-hover:visible transition-opacity opacity-0 group-hover:opacity-100 w-52"
              style={{ 
                backgroundColor: colors.tooltip.background,
                color: colors.tooltip.text,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            >
              Analysis of pessimistic, realistic, and optimistic scenarios based on Monte Carlo simulation results for Vietnam market.
            </div>
          </div>
        </div>
        
        {/* Card content */}
        <div className="p-4">
          {data && data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <CaseBox
                  type="pessimistic"
                  caseColor={colors.pessimistic}
                  title="Pessimistic Case"
                  subtitle={`Bottom ${caseStats.pessimistic.probability}% of outcomes`}
                  caseData={caseStats.pessimistic}
                  icon={<TrendingDown size={16} />}
                />
              </div>
              <div>
                <CaseBox
                  type="realistic"
                  caseColor={colors.realistic}
                  title="Realistic Case"
                  subtitle={`Middle ${caseStats.realistic.probability}% of outcomes`}
                  caseData={caseStats.realistic}
                  icon={<BarChart2 size={16} />}
                />
              </div>
              <div>
                <CaseBox
                  type="optimistic"
                  caseColor={colors.optimistic}
                  title="Optimistic Case"
                  subtitle={`Top ${caseStats.optimistic.probability}% of outcomes`}
                  caseData={caseStats.optimistic}
                  icon={<TrendingUp size={16} />}
                />
              </div>
            </div>
          ) : (
            <div 
              className="py-8 px-4 text-center flex flex-col items-center gap-3"
              style={{ color: colors.textSecondary }}
            >
              <AlertCircle
                size={32}
                style={{ color: colors.honoluluBlue }}
              />
              <div>
                <div 
                  className="font-medium mb-1 horizon-header"
                  style={{ color: colors.text }}
                >
                  No Simulation Data Available
                </div>
                <div className="text-sm">
                  Run the Monte Carlo simulation to view case analysis results
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Network optimization notice */}
        {data && data.length > 0 && (connection.type === 'slow-2g' || connection.type === '2g' || tier === 'low') && (
          <div 
            className="p-2 text-xs text-center"
            style={{ 
              borderTop: `1px solid ${colors.border}`,
              color: colors.textSecondary
            }}
          >
            Displaying optimized view for current network/device conditions
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedVietnamMonteCarloCaseAnalysis;