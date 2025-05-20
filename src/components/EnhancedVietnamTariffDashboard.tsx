import React, { useState, useEffect } from 'react';
import {
  Globe,
  BarChart2,
  TrendingUp,
  Flag,
  AlertCircle,
  ChevronRight,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { 
  mockVietnamTariffAlerts, 
  vietnamAiPredictions,
  vietnamTariffTrends,
  vietnamTradeCorrelations 
} from '../mock/vietnamTariffData';
import { VietnamMonteCarloHistory } from './VietnamMonteCarloHistory';
import { VietnamMonteCarloLlmAnalysis } from './VietnamMonteCarloLlmAnalysis';
import EnhancedTouchButton from './EnhancedTouchButton';
import EnhancedResponsiveTable from './EnhancedResponsiveTable';

/**
 * Enhanced Vietnam Tariff Dashboard Component
 * Comprehensive dashboard for Vietnam tariff analysis with AI insights and Monte Carlo simulations
 * Following SCB beautiful styling system with Fiori integration
 */
const EnhancedVietnamTariffDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedSimulationId, setSelectedSimulationId] = useState<string | null>(null);
  const [selectedComparisonId, setSelectedComparisonId] = useState<string | null>(null);
  
  // Mock LLM analysis state - would be fetched from API in production
  const [llmAnalysis, setLlmAnalysis] = useState<any>({
    status: 'complete',
    summary: 'Comprehensive analysis of Vietnam\'s tariff landscape indicates significant opportunities in electronics and machinery sectors through EU-Vietnam FTA implementation, while agricultural imports require strategic hedging against ASEAN regulatory changes.',
    confidence: 0.89,
    keyFindings: [
      { finding: 'Electronics sector shows 7.2% projected growth with tariff reductions', confidence: 0.92 },
      { finding: 'RCEP accelerates textile tariff reductions by 2.1% annually', confidence: 0.87 },
      { finding: 'Agricultural imports from Thailand face new safeguard measures', confidence: 0.85 },
      { finding: 'EU-Vietnam FTA creates 4.2% tariff reduction in machinery', confidence: 0.91 },
      { finding: 'Exchange rate-tariff correlation stands at 0.62', confidence: 0.83 }
    ],
    keyInsights: [
      'Vietnam electronics sector projected to benefit most from tariff reductions with 7.2% growth',
      'RCEP implementation accelerates textile tariff reductions by an additional 2.1% annually',
      'Agricultural imports from Thailand show increased price sensitivity due to new safeguards',
      'EU-Vietnam FTA creating significant opportunities in machinery sector with 4.2% tariff reduction',
      'Currency exchange rate fluctuations have moderate correlation (0.62) with tariff effectiveness'
    ],
    riskAssessment: {
      text: 'Overall risk assessment indicates moderate exposure to tariff policy changes, with electronics and machinery showing resilience while agriculture faces potential challenges.',
      riskLevel: 'medium',
      probabilityOfNegativeImpact: 0.42
    },
    recommendations: [
      'Prioritize EU machinery imports to maximize FTA benefits and cost savings',
      'Establish supply chain contingencies for agricultural products to mitigate Thailand import duty increases',
      'Consider accelerating electronics exports to Singapore before end of quarter to leverage current rates',
      'Develop dual-supplier strategy across ASEAN to balance against potential tariff volatility',
      'Implement monthly tariff impact assessments for high-volume product categories'
    ],
    confidenceScore: 0.89,
    insightSources: ['Bloomberg Intelligence', 'SCB Research', 'Vietnam Ministry of Finance']
  });

  // Handle tab changes
  const handleTabChange = (newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle view simulation
  const handleViewSimulation = (simulationId: string) => {
    setSelectedSimulationId(simulationId);
    setActiveTab(2); // Switch to Analysis tab
  };

  // Handle compare simulations
  const handleCompareSimulations = (comparisonId: string) => {
    setSelectedComparisonId(comparisonId);
    setActiveTab(2); // Switch to Analysis tab
  };

  // Handle new simulation
  const handleNewSimulation = () => {
    console.log('Creating new Vietnam simulation');
    // Logic to start new simulation
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* SCB Styled Tabs */}
      <div className="border-b border-[rgb(var(--scb-border))]">
        <div className="flex space-x-1">
          <button
            className={`px-4 py-3 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 0 
                ? 'border-[rgb(var(--scb-honolulu-blue))] text-[rgb(var(--scb-honolulu-blue))]' 
                : 'border-transparent text-[rgb(var(--scb-dark-gray))] hover:text-[rgb(var(--scb-honolulu-blue))] hover:border-[rgba(var(--scb-honolulu-blue),0.3)]'
            }`}
            onClick={() => handleTabChange(0)}
          >
            <Globe size={18} />
            Overview
          </button>
          <button
            className={`px-4 py-3 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 1 
                ? 'border-[rgb(var(--scb-honolulu-blue))] text-[rgb(var(--scb-honolulu-blue))]' 
                : 'border-transparent text-[rgb(var(--scb-dark-gray))] hover:text-[rgb(var(--scb-honolulu-blue))] hover:border-[rgba(var(--scb-honolulu-blue),0.3)]'
            }`}
            onClick={() => handleTabChange(1)}
          >
            <BarChart2 size={18} />
            Simulation History
          </button>
          <button
            className={`px-4 py-3 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 2 
                ? 'border-[rgb(var(--scb-honolulu-blue))] text-[rgb(var(--scb-honolulu-blue))]' 
                : 'border-transparent text-[rgb(var(--scb-dark-gray))] hover:text-[rgb(var(--scb-honolulu-blue))] hover:border-[rgba(var(--scb-honolulu-blue),0.3)]'
            }`}
            onClick={() => handleTabChange(2)}
          >
            <TrendingUp size={18} />
            AI Insights
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 0 && (
        <div className="space-y-6">
          <div className="fiori-tile">
            <div className="px-4 py-3 border-b border-[rgb(var(--scb-border))] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Flag size={18} className="text-[rgb(var(--scb-honolulu-blue))]" />
                <h3 className="text-base font-medium text-[rgb(var(--scb-dark-gray))]">
                  Vietnam Tariff Impact Analysis
                </h3>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-[rgb(var(--scb-dark-gray))] mb-4">
                Comprehensive analysis of tariff impacts on Vietnamese trade with Monte Carlo simulations and AI-enhanced predictions.
              </p>

              <div className="border-t border-[rgb(var(--scb-border))] pt-4 mb-6"></div>
              
              {/* Recent Alerts */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))] mb-3">
                  Recent Tariff Alerts
                </h4>
                
                <EnhancedResponsiveTable
                  data={mockVietnamTariffAlerts.slice(0, 3).map(alert => ({
                    ...alert,
                    formattedDate: formatDate(alert.publishDate),
                    confidence: Math.round(alert.confidence * 100),
                    impactStatus: alert.impactSeverity > 7 
                      ? 'high' 
                      : alert.impactSeverity > 5 
                        ? 'medium' 
                        : 'low'
                  }))}
                  columns={[
                    {
                      key: 'title',
                      label: 'Alert',
                      renderCell: (value, row) => (
                        <div>
                          <div className="font-medium text-[rgb(var(--scb-honolulu-blue))]">{value}</div>
                          <div className="text-xs text-[rgb(var(--scb-dark-gray))] mt-1">{row.sourceName}</div>
                        </div>
                      )
                    },
                    {
                      key: 'impactSeverity',
                      label: 'Impact',
                      renderCell: (value, row) => (
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          row.impactStatus === 'high'
                            ? 'bg-[rgba(var(--destructive),0.1)] text-[rgb(var(--destructive))]'
                            : row.impactStatus === 'medium'
                              ? 'bg-[rgba(var(--warning),0.1)] text-[rgb(var(--warning))]'
                              : 'bg-[rgba(var(--horizon-green),0.1)] text-[rgb(var(--horizon-green))]'
                        }`}>
                          {value}/10
                        </div>
                      )
                    },
                    {
                      key: 'formattedDate',
                      label: 'Date'
                    },
                    {
                      key: 'confidence',
                      label: 'Confidence',
                      renderCell: (value) => (
                        <span className="text-[rgb(var(--scb-dark-gray))]">{value}%</span>
                      )
                    }
                  ]}
                />
              </div>
              
              {/* AI Predictions Summary */}
              <div>
                <h4 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))] mb-3">
                  AI-Enhanced Tariff Predictions
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {vietnamAiPredictions.predictions.slice(0, 3).map((prediction, idx) => (
                    <div 
                      key={idx}
                      className="fiori-tile p-0 border border-[rgb(var(--scb-border))]"
                    >
                      <div className="px-3 py-2 border-b border-[rgb(var(--scb-border))] flex justify-between items-center">
                        <h5 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">
                          {prediction.category}
                        </h5>
                        <div className="horizon-chip horizon-chip-blue text-xs">
                          {Math.round(prediction.confidence * 100)}%
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-sm text-[rgb(var(--scb-dark-gray))]">
                            Current: <span className="font-medium">{prediction.currentTariff}%</span>
                          </div>
                          <ArrowRight size={14} className="text-[rgb(var(--scb-dark-gray))]" />
                          <div className={`text-sm font-medium ${
                            prediction.predictedTariff < prediction.currentTariff 
                              ? 'text-[rgb(var(--horizon-green))]' 
                              : 'text-[rgb(var(--destructive))]'
                          }`}>
                            {prediction.predictedTariff}%
                          </div>
                        </div>
                        <div className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70">
                          {prediction.timeframe} | {prediction.impactLevel} impact
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <EnhancedTouchButton 
                  variant="secondary"
                  size="sm"
                  rightIcon={<ChevronRight size={16} />}
                  onClick={() => setActiveTab(2)}
                  className="mt-2"
                >
                  View AI Insights
                </EnhancedTouchButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simulation History Tab */}
      {activeTab === 1 && (
        <VietnamMonteCarloHistory 
          onViewSimulation={handleViewSimulation}
          onCompare={handleCompareSimulations}
          onNewSimulation={handleNewSimulation}
        />
      )}

      {/* AI Insights Tab */}
      {activeTab === 2 && (
        <div className="space-y-6">
          <VietnamMonteCarloLlmAnalysis 
            analysis={llmAnalysis}
            onGenerateReport={() => console.log('Generating report')}
            onViewDetailedAnalysis={() => console.log('Viewing detailed analysis')}
          />
          
          {selectedSimulationId && (
            <div className="fiori-tile">
              <div className="px-4 py-3 border-b border-[rgb(var(--scb-border))]">
                <h3 className="text-base font-medium text-[rgb(var(--scb-dark-gray))]">
                  Selected Simulation Details
                </h3>
              </div>
              <div className="p-4">
                <p className="text-sm font-medium text-[rgb(var(--scb-honolulu-blue))]">
                  Simulation ID: {selectedSimulationId}
                </p>
                <p className="text-sm text-[rgb(var(--scb-dark-gray))] mt-1">
                  View the simulation details and analysis results
                </p>
                <div className="mt-4 flex gap-3">
                  <EnhancedTouchButton
                    variant="secondary"
                    size="sm"
                    rightIcon={<ExternalLink size={14} />}
                    onClick={() => console.log(`Viewing simulation ${selectedSimulationId}`)}
                  >
                    View Full Details
                  </EnhancedTouchButton>
                  <EnhancedTouchButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSimulationId(null)}
                  >
                    Close
                  </EnhancedTouchButton>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedVietnamTariffDashboard;