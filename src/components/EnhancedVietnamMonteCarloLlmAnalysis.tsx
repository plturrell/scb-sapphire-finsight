import React from 'react';
import { Brain, FileText, AlertCircle, BarChart, ArrowRight, ChevronRight, Download, ExternalLink } from 'lucide-react';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import { useNetworkAwareLoading } from '@/hooks/useNetworkAwareLoading';

export interface LlmAnalysisResult {
  summary: string;
  confidence: number;
  keyFindings: Array<{
    finding: string;
    confidence: number;
    impact: string;
  }>;
  recommendations: string[];
}

// Type alias for backward compatibility
type LlmAnalysis = LlmAnalysisResult;

interface EnhancedVietnamMonteCarloLlmAnalysisProps {
  analysis: LlmAnalysis | null;
  onGenerateReport: () => void;
  onViewDetailedAnalysis: () => void;
  className?: string;
  theme?: 'light' | 'dark';
  loading?: boolean;
  maxFindings?: number;
  maxRecommendations?: number;
}

/**
 * EnhancedVietnamMonteCarloLlmAnalysis Component
 * An enhanced component that displays AI-powered analysis of Monte Carlo simulation results
 * with SCB Beautiful UI styling
 */
const EnhancedVietnamMonteCarloLlmAnalysis: React.FC<EnhancedVietnamMonteCarloLlmAnalysisProps> = ({
  analysis,
  onGenerateReport,
  onViewDetailedAnalysis,
  className = '',
  theme: propTheme,
  loading = false,
  maxFindings = 3,
  maxRecommendations = 3
}) => {
  const { prefersColorScheme, tier } = useDeviceCapabilities();
  const { connection } = useNetworkAwareLoading();
  
  // Determine effective theme based on props or system preference
  const theme = propTheme || prefersColorScheme || 'light';
  
  // Define SCB colors based on theme
  const colors = {
    light: {
      honoluluBlue: 'rgb(var(--scb-honolulu-blue, 0, 114, 170))', // #0072AA
      americanGreen: 'rgb(var(--scb-american-green, 33, 170, 71))', // #21AA47
      sun: 'rgb(var(--scb-sun, 255, 204, 0))', // #FFCC00
      persianRed: 'rgb(var(--scb-persian-red, 204, 0, 0))', // #CC0000
      background: 'white',
      cardBackground: 'white',
      headerBackground: '#f8f8f8',
      text: '#333333',
      textSecondary: '#666666',
      border: '#e0e0e0',
      divider: '#eeeeee',
      buttonText: 'white',
      buttonSecondaryText: 'rgb(var(--scb-honolulu-blue, 0, 114, 170))',
      buttonSecondaryBorder: 'rgb(var(--scb-honolulu-blue, 0, 114, 170))',
      buttonSecondaryBackground: 'rgba(0, 114, 170, 0.08)',
      buttonSecondaryHover: 'rgba(0, 114, 170, 0.15)',
      findingBackground: '#f9f9f9',
      confidenceHigh: 'rgb(var(--scb-american-green, 33, 170, 71))',
      confidenceMedium: 'rgb(var(--scb-sun, 255, 204, 0))',
      confidenceLow: 'rgb(var(--scb-persian-red, 204, 0, 0))',
      impactHigh: 'rgb(var(--scb-persian-red, 204, 0, 0))',
      impactMedium: 'rgb(var(--scb-sun, 255, 204, 0))',
      impactLow: 'rgb(var(--scb-american-green, 33, 170, 71))',
      aiGradientStart: '#e580ff',
      aiGradientEnd: '#cc00dc'
    },
    dark: {
      honoluluBlue: 'rgb(0, 142, 211)', // Lighter for dark mode
      americanGreen: 'rgb(41, 204, 86)', // Lighter for dark mode
      sun: 'rgb(255, 214, 51)', // Lighter for dark mode
      persianRed: 'rgb(255, 99, 99)', // Lighter for dark mode
      background: '#121212',
      cardBackground: '#1e1e1e',
      headerBackground: '#252525',
      text: '#e0e0e0',
      textSecondary: '#a0a0a0',
      border: '#333333',
      divider: '#333333',
      buttonText: 'white',
      buttonSecondaryText: 'rgb(0, 142, 211)',
      buttonSecondaryBorder: 'rgb(0, 142, 211)',
      buttonSecondaryBackground: 'rgba(0, 142, 211, 0.1)',
      buttonSecondaryHover: 'rgba(0, 142, 211, 0.2)',
      findingBackground: '#252525',
      confidenceHigh: 'rgb(41, 204, 86)', // Lighter for dark mode
      confidenceMedium: 'rgb(255, 214, 51)', // Lighter for dark mode
      confidenceLow: 'rgb(255, 99, 99)', // Lighter for dark mode
      impactHigh: 'rgb(255, 99, 99)', // Lighter for dark mode
      impactMedium: 'rgb(255, 214, 51)', // Lighter for dark mode
      impactLow: 'rgb(41, 204, 86)', // Lighter for dark mode
      aiGradientStart: '#f399ff',
      aiGradientEnd: '#e838f1'
    }
  };
  
  const currentColors = colors[theme];
  
  // Helper function to get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) {
      return currentColors.confidenceHigh;
    } else if (confidence >= 0.4) {
      return currentColors.confidenceMedium;
    } else {
      return currentColors.confidenceLow;
    }
  };
  
  // Helper function to get impact color
  const getImpactColor = (impact: string) => {
    if (impact === 'High') {
      return currentColors.impactHigh;
    } else if (impact === 'Medium') {
      return currentColors.impactMedium;
    } else {
      return currentColors.impactLow;
    }
  };
  
  // Placeholder loading state
  if (loading) {
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
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="h-5 w-5 rounded-full animate-pulse"
              style={{ 
                background: `linear-gradient(135deg, ${currentColors.aiGradientStart}, ${currentColors.aiGradientEnd})`
              }}
            ></div>
            <div 
              className="h-4 w-36 rounded animate-pulse"
              style={{ backgroundColor: theme === 'dark' ? '#333' : '#eee' }}
            ></div>
          </div>
        </div>
        
        <div className="p-4">
          <div 
            className="h-4 w-3/4 rounded animate-pulse mb-3"
            style={{ backgroundColor: theme === 'dark' ? '#333' : '#eee' }}
          ></div>
          <div 
            className="h-4 w-full rounded animate-pulse mb-2"
            style={{ backgroundColor: theme === 'dark' ? '#333' : '#eee' }}
          ></div>
          <div 
            className="h-4 w-5/6 rounded animate-pulse mb-2"
            style={{ backgroundColor: theme === 'dark' ? '#333' : '#eee' }}
          ></div>
          <div 
            className="h-4 w-2/3 rounded animate-pulse mb-4"
            style={{ backgroundColor: theme === 'dark' ? '#333' : '#eee' }}
          ></div>
          
          <div 
            className="h-6 w-32 rounded animate-pulse mb-4"
            style={{ backgroundColor: theme === 'dark' ? '#333' : '#eee' }}
          ></div>
          
          <div 
            className="my-4"
            style={{ 
              height: '1px',
              backgroundColor: currentColors.divider 
            }}
          ></div>
          
          <div 
            className="h-4 w-1/4 rounded animate-pulse mb-3"
            style={{ backgroundColor: theme === 'dark' ? '#333' : '#eee' }}
          ></div>
          
          {[1, 2].map((i) => (
            <div 
              key={i}
              className="p-3 rounded mb-3"
              style={{ backgroundColor: theme === 'dark' ? '#252525' : '#f5f5f5' }}
            >
              <div 
                className="h-3 w-2/3 rounded animate-pulse mb-2"
                style={{ backgroundColor: theme === 'dark' ? '#333' : '#eee' }}
              ></div>
              <div className="flex gap-2">
                <div 
                  className="h-3 w-24 rounded animate-pulse"
                  style={{ backgroundColor: theme === 'dark' ? '#333' : '#eee' }}
                ></div>
                <div 
                  className="h-3 w-20 rounded animate-pulse"
                  style={{ backgroundColor: theme === 'dark' ? '#333' : '#eee' }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state when no analysis is available
  if (!analysis) {
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
          <div 
            className="font-medium flex items-center gap-2"
            style={{ color: currentColors.text }}
          >
            <div 
              style={{ 
                background: `linear-gradient(135deg, ${currentColors.aiGradientStart}, ${currentColors.aiGradientEnd})`,
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Brain size={12} style={{ color: 'white' }} />
            </div>
            <span>AI-Enhanced Analysis</span>
          </div>
        </div>
        
        <div className="p-4 text-center">
          <Brain 
            size={40}
            style={{ margin: '0 auto 1rem', opacity: 0.5, color: currentColors.textSecondary }}
          />
          <div 
            className="mb-2 font-medium"
            style={{ color: currentColors.text }}
          >
            No Analysis Available
          </div>
          <div 
            className="text-sm mb-4"
            style={{ color: currentColors.textSecondary }}
          >
            Run a simulation to generate AI-enhanced analysis
          </div>
          
          <button
            className="px-4 py-2 rounded text-sm font-medium inline-flex items-center gap-2"
            style={{ 
              backgroundColor: currentColors.honoluluBlue,
              color: currentColors.buttonText
            }}
            onClick={() => window.location.href = '#simulation'}
          >
            <BarChart size={16} />
            Run Simulation
          </button>
        </div>
      </div>
    );
  }

  // Truncate findings and recommendations based on device capability
  const displayFindings = analysis.keyFindings.slice(0, tier === 'low' ? 2 : maxFindings);
  const displayRecommendations = analysis.recommendations.slice(0, tier === 'low' ? 2 : maxRecommendations);
  const hasMoreFindings = analysis.keyFindings.length > displayFindings.length;
  const hasMoreRecommendations = analysis.recommendations.length > displayRecommendations.length;

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
        <div 
          className="font-medium flex items-center gap-2"
          style={{ color: currentColors.text }}
        >
          <div 
            style={{ 
              background: `linear-gradient(135deg, ${currentColors.aiGradientStart}, ${currentColors.aiGradientEnd})`,
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Brain size={14} style={{ color: 'white' }} />
          </div>
          <span>AI-Enhanced Analysis</span>
        </div>
      </div>
      
      <div className="p-4">
        {/* Summary Section */}
        <div className="mb-4">
          <div 
            className="text-sm font-medium mb-2"
            style={{ color: currentColors.textSecondary }}
          >
            Summary
          </div>
          <div 
            className="text-sm mb-3"
            style={{ color: currentColors.text }}
          >
            {analysis.summary}
          </div>
          
          <div 
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
            style={{ 
              backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)', 
              color: getConfidenceColor(analysis.confidence)
            }}
          >
            <span>Confidence: {(analysis.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
        
        <div 
          className="my-4"
          style={{ 
            height: '1px',
            backgroundColor: currentColors.divider 
          }}
        ></div>
        
        {/* Key Findings Section */}
        <div className="mb-4">
          <div 
            className="text-sm font-medium mb-3"
            style={{ color: currentColors.textSecondary }}
          >
            Key Findings
          </div>
          
          <div className="space-y-3">
            {displayFindings.map((finding, index) => (
              <div 
                key={index}
                className="p-3 rounded"
                style={{ backgroundColor: currentColors.findingBackground }}
              >
                <div 
                  className="flex items-start gap-2 mb-2"
                >
                  <AlertCircle 
                    size={16} 
                    className="mt-0.5 flex-shrink-0"
                    style={{ 
                      color: getImpactColor(finding.impact)
                    }}
                  />
                  <div 
                    className="text-sm"
                    style={{ color: currentColors.text }}
                  >
                    {finding.finding}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <div 
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                    style={{ 
                      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)', 
                      color: getConfidenceColor(finding.confidence)
                    }}
                  >
                    <span>Confidence: {(finding.confidence * 100).toFixed(0)}%</span>
                  </div>
                  
                  <div 
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                    style={{ 
                      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)', 
                      color: getImpactColor(finding.impact)
                    }}
                  >
                    <span>Impact: {finding.impact}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {hasMoreFindings && (
            <button
              className="mt-2 text-xs inline-flex items-center gap-1"
              style={{ color: currentColors.honoluluBlue }}
              onClick={onViewDetailedAnalysis}
            >
              <span>View {analysis.keyFindings.length - displayFindings.length} more findings</span>
              <ChevronRight size={14} />
            </button>
          )}
        </div>
        
        <div 
          className="my-4"
          style={{ 
            height: '1px',
            backgroundColor: currentColors.divider 
          }}
        ></div>
        
        {/* Recommendations Section */}
        <div className="mb-4">
          <div 
            className="text-sm font-medium mb-3"
            style={{ color: currentColors.textSecondary }}
          >
            Recommendations
          </div>
          
          <ul className="pl-5 space-y-2 mb-2">
            {displayRecommendations.map((recommendation, index) => (
              <li 
                key={index}
                className="text-sm"
                style={{ color: currentColors.text }}
              >
                {recommendation}
              </li>
            ))}
          </ul>
          
          {hasMoreRecommendations && (
            <button
              className="mt-1 text-xs inline-flex items-center gap-1"
              style={{ color: currentColors.honoluluBlue }}
              onClick={onViewDetailedAnalysis}
            >
              <span>View {analysis.recommendations.length - displayRecommendations.length} more recommendations</span>
              <ChevronRight size={14} />
            </button>
          )}
        </div>
        
        {/* Actions */}
        <div 
          className="flex flex-wrap gap-2 mt-4"
        >
          <button
            className="px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1.5 transition-colors"
            style={{ 
              backgroundColor: currentColors.buttonSecondaryBackground,
              color: currentColors.buttonSecondaryText,
              border: `1px solid ${currentColors.buttonSecondaryBorder}`,
              ':hover': { backgroundColor: currentColors.buttonSecondaryHover }
            }}
            onClick={onGenerateReport}
          >
            <Download size={16} />
            Generate Report
          </button>
          
          <button
            className="px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1.5"
            style={{ 
              backgroundColor: currentColors.honoluluBlue,
              color: currentColors.buttonText
            }}
            onClick={onViewDetailedAnalysis}
          >
            <ExternalLink size={16} />
            View Full Analysis
          </button>
        </div>
      </div>
      
      {/* Network/device optimization notice */}
      {(connection.type === 'slow-2g' || connection.type === '2g' || tier === 'low') && (
        <div 
          className="p-2 text-center text-xs border-t"
          style={{ 
            borderColor: currentColors.border,
            color: currentColors.textSecondary,
            backgroundColor: currentColors.headerBackground
          }}
        >
          Optimized view for current network/device conditions
        </div>
      )}
    </div>
  );
};

export default EnhancedVietnamMonteCarloLlmAnalysis;