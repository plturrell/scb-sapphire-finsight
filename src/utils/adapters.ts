/**
 * Data Adapters
 * 
 * This module provides adapter functions to convert between different data formats
 * in the application, enabling seamless integration between modular components.
 */

import { 
  SankeyData, 
  SankeyNode, 
  SankeyLink, 
  SimulationResult 
} from '../types';

import {
  SimulationOutput,
  SimulationResults,
  LlmAnalysis,
  StatisticsSummary,
  SimulationParameter,
  ComponentParameter
} from '../types/MonteCarloTypes';

/**
 * Converts Monte Carlo simulation output to a format expected by Sankey visualization
 */
export function monteCarloToSankeyData(
  output: SimulationOutput | null,
  defaultData?: SankeyData
): SankeyData {
  // Handle empty data case
  if (!output || !output.results) {
    return defaultData || { nodes: [], links: [] };
  }

  // Create nodes based on scenario probability distribution
  let nodes: SankeyNode[] = [];
  const scenarios = output.results.scenarios;
  
  // Create a root node (income)
  nodes.push({
    name: 'Revenue',
    group: 'income',
    category: 'income',
    value: 100,
    id: 'node-root'
  });

  // Add nodes for each scenario
  nodes.push(
    {
      name: 'Operating Costs',
      group: 'expense',
      category: 'expense',
      value: scenarios.pessimistic.probability * 100,
      id: 'node-pessimistic'
    },
    {
      name: 'Gross Profit',
      group: 'finance',
      category: 'finance',
      value: scenarios.realistic.probability * 100,
      id: 'node-realistic'
    }
  );

  // Add more nodes if we have them
  nodes.push(
    {
      name: 'Taxes',
      group: 'expense',
      category: 'expense',
      value: 15,
      id: 'node-taxes'
    },
    {
      name: 'Net Profit',
      group: 'finance',
      category: 'finance',
      value: scenarios.optimistic.probability * 100,
      id: 'node-optimistic'
    }
  );

  // Add predictive nodes
  if (output.results.sensitivityAnalysis && output.results.sensitivityAnalysis.length > 0) {
    const sensitivity = output.results.sensitivityAnalysis;
    
    // Create Investment node based on top parameter
    if (sensitivity.length > 0) {
      nodes.push({
        name: 'Investments',
        group: 'investment',
        category: 'investment',
        value: Math.abs(sensitivity[0].impact) * 100,
        id: 'node-investment-1',
        predictedValue: Math.abs(sensitivity[0].impact) * 110,
        confidence: 0.85
      });
    }
    
    // Create Dividend node based on second parameter
    if (sensitivity.length > 1) {
      nodes.push({
        name: 'Dividends',
        group: 'finance',
        category: 'finance',
        value: Math.abs(sensitivity[1].impact) * 100,
        id: 'node-dividend',
        predictedValue: Math.abs(sensitivity[1].impact) * 105,
        confidence: 0.78
      });
    }
    
    // Create Retained Earnings node based on third parameter
    if (sensitivity.length > 2) {
      nodes.push({
        name: 'Retained Earnings',
        group: 'equity',
        category: 'equity',
        value: Math.abs(sensitivity[2].impact) * 100,
        id: 'node-retained',
        predictedValue: Math.abs(sensitivity[2].impact) * 120,
        confidence: 0.72
      });
    }
  }

  // Create links
  const links: SankeyLink[] = [];
  
  // Primary flow
  links.push(
    { 
      source: 0, 
      target: 1, 
      value: scenarios.pessimistic.probability * 100
    },
    { 
      source: 0, 
      target: 2, 
      value: scenarios.realistic.probability * 100
    },
    {
      source: 2, 
      target: 3, 
      value: 15
    },
    {
      source: 2, 
      target: 4, 
      value: scenarios.optimistic.probability * 100
    }
  );
  
  // If we have investment nodes, add links
  if (nodes.length > 5) {
    links.push(
      { 
        source: 4, 
        target: 5, 
        value: Math.abs(output.results.sensitivityAnalysis[0].impact) * 80,
        aiEnhanced: true
      }
    );
  }
  
  // If we have dividend nodes, add links
  if (nodes.length > 6) {
    links.push(
      { 
        source: 4, 
        target: 6, 
        value: Math.abs(output.results.sensitivityAnalysis[1].impact) * 60,
        aiEnhanced: true
      }
    );
  }
  
  // If we have retained earnings nodes, add links
  if (nodes.length > 7) {
    links.push(
      { 
        source: 4, 
        target: 7, 
        value: Math.abs(output.results.sensitivityAnalysis[2].impact) * 40,
        aiEnhanced: true
      }
    );
  }

  // Convert LLM analysis to AI Insights
  const aiInsights = output.llmAnalysis ? llmAnalysisToAiInsights(output.llmAnalysis) : undefined;

  return {
    nodes,
    links,
    aiInsights
  };
}

/**
 * Converts LLM analysis to AI Insights format expected by Sankey visualization
 */
function llmAnalysisToAiInsights(llmAnalysis: LlmAnalysis): SankeyData['aiInsights'] {
  return {
    summary: llmAnalysis.insights.length > 0 
      ? llmAnalysis.insights[0] 
      : 'Analysis of financial flow patterns and potential optimizations.',
    recommendations: llmAnalysis.recommendations,
    confidence: llmAnalysis.riskAssessment?.probabilityOfNegativeImpact 
      ? 1 - llmAnalysis.riskAssessment.probabilityOfNegativeImpact
      : 0.75,
    updatedAt: new Date()
  };
}

/**
 * Converts Monte Carlo simulation output to SimulationResult format
 * expected by visualization components
 */
export function monteCarloToSimulationResult(
  output: SimulationOutput | null
): SimulationResult | null {
  if (!output || !output.results) {
    return null;
  }

  // Convert sensitivity analysis to allocations
  const allocations: Record<string, number> = {};
  if (output.results.sensitivityAnalysis) {
    output.results.sensitivityAnalysis.forEach(sensitivity => {
      allocations[sensitivity.parameter] = Math.abs(sensitivity.impact) * 100;
    });
  }

  // Convert LLM recommendations if available
  const recommendations = output.llmAnalysis?.recommendations || [];

  // Calculate expected value
  const summary = output.results.summary;
  const totalReturn = summary.mean;

  // Fake country breakdown (for demo purposes)
  const byCountry: Record<string, number> = {
    'Vietnam': totalReturn * 0.65,
    'Thailand': totalReturn * 0.15,
    'Malaysia': totalReturn * 0.1,
    'Other ASEAN': totalReturn * 0.1
  };

  // Convert risk metrics
  const volatility = summary.standardDeviation;
  const confidenceBound = volatility * 1.96; // 95% confidence interval
  
  const riskMetrics = {
    volatility,
    confidenceLowerBound: totalReturn - confidenceBound,
    confidenceUpperBound: totalReturn + confidenceBound,
    maxDrawdown: output.results.scenarios.pessimistic.rangeMin / summary.max,
    recessionImpact: output.results.scenarios.pessimistic.meanValue / summary.mean
  };

  // Convert to Sankey data
  const flowData = monteCarloToSankeyData(output);

  return {
    optimalPath: {
      allocations,
      recommendations
    },
    expectedValue: {
      totalReturn,
      byCountry
    },
    riskMetrics,
    flowData
  };
}

/**
 * Converts worker output format to SimulationOutput format
 */
export function workerOutputToSimulationOutput(
  workerData: any
): SimulationOutput {
  // Create a basic SimulationOutput structure
  const output: SimulationOutput = {
    id: `sim-output-${Date.now()}`,
    inputId: `sim-input-${Date.now()}`, // This would normally be passed in
    status: 'completed',
    startTime: Date.now() - (workerData.computeTimeMs || 0),
    endTime: Date.now(),
    progressPercentage: 100,
    computeTimeMs: workerData.computeTimeMs
  };

  // Convert worker results to simulation results
  if (workerData.results) {
    // Get basic stats
    const results = Array.isArray(workerData.results) ? workerData.results : [];
    const mean = results.reduce((sum, val) => sum + val, 0) / (results.length || 1);
    const sortedResults = [...results].sort((a, b) => a - b);
    const min = sortedResults[0] || 0;
    const max = sortedResults[sortedResults.length - 1] || 0;
    const median = sortedResults[Math.floor(sortedResults.length / 2)] || mean;
    
    // Calculate standard deviation
    const variance = results.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (results.length || 1);
    const standardDeviation = Math.sqrt(variance);
    
    // Build simulation results
    const summary: StatisticsSummary = {
      mean,
      median,
      min,
      max,
      standardDeviation,
      variance
    };

    // Create percentiles
    const percentiles = [5, 10, 25, 50, 75, 90, 95].map(percentile => {
      const index = Math.floor(percentile / 100 * results.length);
      return {
        percentile,
        value: sortedResults[index] || 0
      };
    });

    // Create basic scenarios
    const scenarios = {
      pessimistic: {
        probability: 0.25,
        meanValue: sortedResults.slice(0, Math.floor(results.length * 0.25)).reduce((sum, val) => sum + val, 0) / (Math.floor(results.length * 0.25) || 1),
        rangeMin: min,
        rangeMax: sortedResults[Math.floor(results.length * 0.25)] || min
      },
      realistic: {
        probability: 0.5,
        meanValue: sortedResults.slice(Math.floor(results.length * 0.25), Math.floor(results.length * 0.75)).reduce((sum, val) => sum + val, 0) / (Math.floor(results.length * 0.5) || 1),
        rangeMin: sortedResults[Math.floor(results.length * 0.25)] || min,
        rangeMax: sortedResults[Math.floor(results.length * 0.75)] || max
      },
      optimistic: {
        probability: 0.25,
        meanValue: sortedResults.slice(Math.floor(results.length * 0.75)).reduce((sum, val) => sum + val, 0) / (Math.floor(results.length * 0.25) || 1),
        rangeMin: sortedResults[Math.floor(results.length * 0.75)] || median,
        rangeMax: max
      }
    };

    // Create sensitivity analysis from worker's riskMetrics if available
    const sensitivityAnalysis = workerData.riskMetrics ? [
      {
        parameter: 'Exchange Rate',
        correlation: 0.8,
        impact: workerData.riskMetrics.volatility * 0.8
      },
      {
        parameter: 'Tariff Rate',
        correlation: -0.6,
        impact: workerData.riskMetrics.volatility * 0.6
      },
      {
        parameter: 'Import Volume',
        correlation: 0.4,
        impact: workerData.riskMetrics.volatility * 0.4
      }
    ] : [];

    // Create simplified distribution data
    const binCount = Math.min(20, Math.ceil(Math.sqrt(results.length)));
    const binSize = (max - min) / binCount;
    const distributionData = Array(binCount).fill(0).map((_, i) => {
      const binStart = min + i * binSize;
      const binEnd = min + (i + 1) * binSize;
      const freq = results.filter(val => val >= binStart && val < binEnd).length;
      return {
        bin: (binStart + binEnd) / 2,
        frequency: freq,
        cumulative: results.filter(val => val <= binEnd).length / results.length
      };
    });

    // Assign results to output
    output.results = {
      summary,
      percentiles,
      scenarios,
      sensitivityAnalysis,
      distributionData,
      rawResults: results
    };
  }

  // Convert optimal path and AI recommendations to LLM analysis
  if (workerData.optimalPath || workerData.flowData?.aiInsights) {
    const insights = [
      workerData.flowData?.aiInsights?.summary || 
      'Monte Carlo simulation indicates specific financial strategies for optimal outcomes.'
    ];

    const recommendations = workerData.flowData?.aiInsights?.recommendations || [];

    // Create risk factors from riskMetrics
    const riskFactors = workerData.riskMetrics ? [
      {
        factor: 'Volatility',
        severity: workerData.riskMetrics.volatility,
        mitigation: 'Implement diversification strategies to reduce exposure'
      },
      {
        factor: 'Drawdown Risk',
        severity: workerData.riskMetrics.maxDrawdown,
        mitigation: 'Maintain strategic reserves to manage potential market fluctuations'
      }
    ] : [];

    // Create risk assessment
    const riskAssessment = workerData.riskMetrics ? {
      text: `The simulation indicates a risk profile with ${(workerData.riskMetrics.volatility * 100).toFixed(1)}% volatility and potential drawdowns of up to ${(workerData.riskMetrics.maxDrawdown * 100).toFixed(1)}%.`,
      riskLevel: workerData.riskMetrics.valueatRisk > 0.2 ? 'high' as const : workerData.riskMetrics.valueatRisk > 0.1 ? 'medium' as const : 'low' as const,
      probabilityOfNegativeImpact: workerData.riskMetrics.valueatRisk
    } : undefined;

    // Assign LLM analysis to output
    output.llmAnalysis = {
      insights,
      recommendations,
      riskFactors,
      riskAssessment
    };
  }

  return output;
}

/**
 * Convert component parameters to simulation parameters 
 */
export function componentToSimulationParams(componentParams: ComponentParameter[]): SimulationParameter[] {
  return componentParams.map(param => ({
    id: param.id,
    name: param.name,
    value: param.value,
    minValue: param.min,
    maxValue: param.max,
    distributionType: param.distribution,
    parameterType: param.id.includes('Rate') ? 'Percentage' : 
                  param.id.includes('Volume') ? 'Currency' : 'Numeric',
    unit: param.unit,
    description: param.description
  }));
}

/**
 * Convert simulation parameters to component parameters
 */
export function simulationToComponentParams(simulationParams: SimulationParameter[]): ComponentParameter[] {
  return simulationParams.map(param => ({
    id: param.id,
    name: param.name,
    value: param.value,
    min: param.minValue,
    max: param.maxValue,
    distribution: param.distributionType,
    unit: param.unit,
    description: param.description
  }));
}