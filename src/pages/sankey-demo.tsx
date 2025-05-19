import React, { useState } from 'react';
import Layout from '@/components/Layout';
import SankeyChart from '@/components/SankeyChart';
import { Sparkles, RefreshCw, Info, AlertTriangle } from 'lucide-react';

// Sample data for demonstration
const initialSankeyData = {
  nodes: [
    { name: 'Revenue', group: 'income', value: 2000000 },
    { name: 'Investments', group: 'income', value: 1200000 },
    { name: 'Interest', group: 'income', value: 300000 },
    { name: 'Operations', group: 'expense', value: 1500000 },
    { name: 'Marketing', group: 'expense', value: 400000 },
    { name: 'R&D', group: 'expense', value: 800000 },
    { name: 'Administrative', group: 'expense', value: 700000 },
    { name: 'Taxes', group: 'expense', value: 300000 },
    { name: 'Net Profit', group: 'equity', value: 800000 },
  ],
  links: [
    { source: 0, target: 3, value: 900000 },
    { source: 0, target: 4, value: 300000 },
    { source: 0, target: 8, value: 800000 },
    { source: 1, target: 5, value: 700000 }, 
    { source: 1, target: 6, value: 300000 },
    { source: 1, target: 7, value: 200000 },
    { source: 2, target: 6, value: 300000 }
  ]
};

// Enhanced data with AI predictions and insights
const aiEnhancedData = {
  nodes: [
    { name: 'Revenue', group: 'income', value: 2000000, predictedValue: 2200000, confidence: 0.85 },
    { name: 'Investments', group: 'income', value: 1200000, predictedValue: 1350000, confidence: 0.78 },
    { name: 'Interest', group: 'income', value: 300000 },
    { name: 'Operations', group: 'expense', value: 1500000, predictedValue: 1450000, confidence: 0.72 },
    { name: 'Marketing', group: 'expense', value: 400000, predictedValue: 500000, confidence: 0.91 },
    { name: 'R&D', group: 'expense', value: 800000 },
    { name: 'Administrative', group: 'expense', value: 700000, predictedValue: 650000, confidence: 0.65 },
    { name: 'Taxes', group: 'expense', value: 300000 },
    { name: 'Net Profit', group: 'equity', value: 800000, predictedValue: 1050000, confidence: 0.82 },
  ],
  links: [
    { source: 0, target: 3, value: 900000 },
    { source: 0, target: 4, value: 350000, aiEnhanced: true, originalValue: 300000 },
    { source: 0, target: 8, value: 850000, aiEnhanced: true, originalValue: 800000 },
    { source: 1, target: 5, value: 750000, aiEnhanced: true, originalValue: 700000 }, 
    { source: 1, target: 6, value: 300000 },
    { source: 1, target: 7, value: 200000 },
    { source: 2, target: 6, value: 300000 }
  ],
  aiInsights: {
    summary: "Based on current financial flows and market trends, there's potential to increase revenue allocation to Marketing to drive growth. Operational costs can be optimized by 3% while increasing R&D investment for long-term competitiveness.",
    recommendations: [
      "Increase Marketing allocation by 15% to capitalize on emerging market opportunities",
      "Reduce Administrative expenses by 7% through process optimization",
      "Re-allocate savings to R&D to maintain competitive advantage"
    ],
    confidence: 0.82,
    updatedAt: new Date()
  }
};

// More complex expanded data for a detailed view
const expandedSankeyData = {
  nodes: [
    { name: 'Direct Sales', group: 'income', value: 1200000 },
    { name: 'Channel Partners', group: 'income', value: 800000 },
    { name: 'Equity Investments', group: 'income', value: 700000 },
    { name: 'Bond Yields', group: 'income', value: 500000 },
    { name: 'Interest Income', group: 'income', value: 300000 },
    
    { name: 'Sales Operations', group: 'expense', value: 900000 },
    { name: 'IT Infrastructure', group: 'expense', value: 600000 },
    { name: 'Digital Marketing', group: 'expense', value: 250000 },
    { name: 'Traditional Marketing', group: 'expense', value: 150000 },
    { name: 'Product R&D', group: 'expense', value: 500000 },
    { name: 'Innovation Lab', group: 'expense', value: 300000 },
    { name: 'HR & Payroll', group: 'expense', value: 400000 },
    { name: 'Facilities', group: 'expense', value: 300000 },
    { name: 'Corporate Tax', group: 'expense', value: 200000 },
    { name: 'Sales Tax', group: 'expense', value: 100000 },
    
    { name: 'Retained Earnings', group: 'equity', value: 500000 },
    { name: 'Dividends', group: 'equity', value: 300000 },
  ],
  links: [
    // Direct Sales flows
    { source: 0, target: 5, value: 600000 },
    { source: 0, target: 7, value: 150000 },
    { source: 0, target: 15, value: 300000 },
    { source: 0, target: 16, value: 150000 },
    
    // Channel Partners flows
    { source: 1, target: 5, value: 300000 },
    { source: 1, target: 8, value: 100000, aiEnhanced: true, originalValue: 75000 },
    { source: 1, target: 14, value: 100000 },
    { source: 1, target: 15, value: 200000, aiEnhanced: true, originalValue: 175000 },
    { source: 1, target: 16, value: 100000 },
    
    // Equity Investment flows
    { source: 2, target: 6, value: 300000 },
    { source: 2, target: 9, value: 250000, aiEnhanced: true, originalValue: 200000 },
    { source: 2, target: 13, value: 150000 },
    
    // Bond Yields flows
    { source: 3, target: 6, value: 200000 },
    { source: 3, target: 10, value: 150000 },
    { source: 3, target: 15, value: 150000 },
    
    // Interest Income flows
    { source: 4, target: 11, value: 150000 },
    { source: 4, target: 12, value: 150000 }
  ],
  aiInsights: {
    summary: "Financial flow analysis reveals opportunities to optimize resource allocation across the organization. Channel partners show strong potential for growth, while IT infrastructure costs could be strategically reallocated.",
    recommendations: [
      "Increase investment in digital marketing initiatives through channel partners",
      "Allocate more resources to Product R&D to drive innovation and market competitiveness",
      "Optimize IT infrastructure costs through cloud migration and consolidation",
      "Reinvest operational savings to boost retained earnings for future growth initiatives"
    ],
    confidence: 0.89,
    updatedAt: new Date()
  }
};

const SankeyDemoPage: React.FC = () => {
  const [dataMode, setDataMode] = useState<'basic' | 'aiEnhanced' | 'expanded'>('basic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAiMessageBar, setShowAiMessageBar] = useState(true);
  
  // Function to simulate AI generation
  const regenerateWithAI = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setDataMode('aiEnhanced');
      setIsGenerating(false);
    }, 1500);
  };
  
  // Function to simulate expanding the view
  const expandView = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setDataMode('expanded');
      setIsGenerating(false);
    }, 1800);
  };
  
  const currentData = 
    dataMode === 'basic' ? initialSankeyData :
    dataMode === 'aiEnhanced' ? aiEnhancedData :
    expandedSankeyData;

  return (
    <Layout>
      <div className="px-6 py-4 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[rgb(var(--scb-primary))]">Financial Flow Analysis</h1>
          <p className="text-gray-600 mt-1">Visualize your financial flows with AI-enhanced insights</p>
        </div>
        
        {/* AI Message Bar - follows "Show the Work" principle */}
        {showAiMessageBar && (
          <div className="mb-6 p-3 bg-[rgba(var(--horizon-blue),0.08)] border border-[rgba(var(--horizon-blue),0.2)] rounded-lg flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="text-[rgb(var(--scb-accent))] w-5 h-5" />
              <p className="text-sm">
                <span className="font-medium">AI-powered analysis:</span> Joule can enhance your financial flow visualizations with predictive insights and optimization recommendations.
              </p>
            </div>
            <button 
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setShowAiMessageBar(false)}
              aria-label="Dismiss message"
            >
              <span className="text-xs">Dismiss</span>
            </button>
          </div>
        )}
        
        {/* Mode selection controls */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button 
            onClick={() => setDataMode('basic')}
            className={`fiori-btn ${dataMode === 'basic' ? 'fiori-btn-primary' : 'fiori-btn-secondary'}`}
          >
            Basic View
          </button>
          
          <button 
            onClick={regenerateWithAI}
            disabled={isGenerating}
            className={`fiori-btn ${dataMode === 'aiEnhanced' ? 'fiori-btn-primary' : 'fiori-btn-secondary'} flex items-center gap-1`}
          >
            {isGenerating && dataMode !== 'aiEnhanced' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                AI-Enhanced View
              </>
            )}
          </button>
          
          <button 
            onClick={expandView}
            disabled={isGenerating}
            className={`fiori-btn ${dataMode === 'expanded' ? 'fiori-btn-primary' : 'fiori-btn-secondary'} flex items-center gap-1`}
          >
            {isGenerating && dataMode !== 'expanded' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Expanding...
              </>
            ) : (
              'Detailed View'
            )}
          </button>
        </div>
        
        {/* SAP Fiori Information Panel - follows "Maintain Quality" principle */}
        <div className="mb-6 p-3 bg-[rgba(var(--scb-light-bg),0.8)] border border-[rgba(var(--scb-border),0.7)] rounded-lg flex items-start gap-2">
          <div className="flex-shrink-0 mt-1">
            <Info className="w-5 h-5 text-[rgb(var(--horizon-blue))]" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-[rgb(var(--horizon-neutral-gray))]">About this visualization</h2>
            <p className="text-xs mt-1 text-gray-600">
              This Sankey diagram shows the flow of financial resources through your organization. 
              {dataMode === 'aiEnhanced' && ' AI-enhanced elements are highlighted and include predictive values based on historical data and market trends.'}
              {dataMode === 'expanded' && ' The detailed view breaks down high-level categories into more specific components for deeper analysis.'}
            </p>
            {dataMode !== 'basic' && (
              <div className="mt-2 flex items-center gap-1.5">
                <div className="horizon-chip horizon-chip-blue text-[10px] py-0.5 px-2 flex items-center gap-0.5">
                  <Sparkles className="w-3 h-3" /> 
                  AI Enhanced
                </div>
                <div className="horizon-chip text-[10px] py-0.5 px-2">
                  Confidence: {dataMode === 'aiEnhanced' ? '82%' : '89%'}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Warning for demo purposes */}
        {(dataMode === 'aiEnhanced' || dataMode === 'expanded') && (
          <div className="mb-6 p-3 bg-[rgba(var(--horizon-red),0.05)] border border-[rgba(var(--horizon-red),0.2)] rounded-lg flex items-start gap-2">
            <div className="flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-[rgb(var(--horizon-red))]" />
            </div>
            <div className="text-xs text-gray-700">
              <p className="font-medium">Demo Purposes Only</p>
              <p className="mt-0.5">
                This is a demonstration of AI-enhanced visualization capabilities. In a production environment, 
                predictions would be based on real-time data analysis and machine learning models trained on your financial data.
              </p>
            </div>
          </div>
        )}
        
        {/* The Sankey chart */}
        <div className="border border-[rgb(var(--scb-border))] rounded-lg p-4 bg-white h-[600px]">
          <SankeyChart 
            data={currentData}
            width={850}
            height={500}
            title={dataMode === 'basic' ? 'Financial Flow Analysis' : 
                  dataMode === 'aiEnhanced' ? 'AI-Enhanced Financial Flow Analysis' : 
                  'Detailed Financial Flow Breakdown'}
            showAIControls={true}
            onRegenerateClick={
              dataMode === 'basic' ? regenerateWithAI : 
              dataMode === 'aiEnhanced' ? expandView : undefined
            }
          />
        </div>
        
        {/* SAP Fiori Horizon Legend */}
        <div className="mt-4 p-3 bg-[rgba(var(--scb-light-bg),0.5)] border border-[rgba(var(--scb-border),0.3)] rounded-lg">
          <h3 className="text-sm font-medium text-[rgb(var(--horizon-neutral-gray))]">Legend</h3>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{backgroundColor: 'rgb(15, 40, 109)'}}></div>
              <span className="text-xs">Investment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{backgroundColor: 'rgb(43, 83, 0)'}}></div>
              <span className="text-xs">Income</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{backgroundColor: 'rgb(195, 0, 51)'}}></div>
              <span className="text-xs">Expense</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{backgroundColor: 'rgb(0, 112, 122)'}}></div>
              <span className="text-xs">Equity</span>
            </div>
          </div>
          
          {(dataMode === 'aiEnhanced' || dataMode === 'expanded') && (
            <div className="mt-3 pt-3 border-t border-[rgba(var(--scb-border),0.5)]">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-[rgb(var(--scb-accent))]" />
                  <span className="text-xs">AI Enhanced Flow</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[rgb(var(--scb-accent))]"></div>
                  <span className="text-xs">AI Prediction Available</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SankeyDemoPage;
