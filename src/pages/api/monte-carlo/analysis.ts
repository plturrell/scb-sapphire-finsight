import { NextApiRequest, NextApiResponse } from 'next';
import { PerplexityLLMService } from '@/services/PerplexityLLMService';
import { LlmAnalysis, RiskLevel } from '@/types/MonteCarloTypes';
import monteCarloStorageService from '@/services/MonteCarloStorageService';
import vietnamMonteCarloAdapter from '@/services/VietnamMonteCarloAdapter';

/**
 * Monte Carlo Analysis API
 * Provides LLM-powered analysis for simulation results using Perplexity AI
 * Generates insights, recommendations, and risk assessments for simulations
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle OPTIONS request (preflight)
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Handle different methods
    switch (req.method) {
      case 'GET':
        return handleGet(req, res);
      case 'POST':
        return handlePost(req, res);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in Monte Carlo Analysis API:', error);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Handle GET requests
 * Retrieve existing analysis or perform analysis operations
 */
const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { operation, outputId, inputId, analysisType = 'comprehensive' } = req.query;

  try {
    switch (operation) {
      case 'analysis':
        if (outputId) {
          // Get existing analysis for a specific output
          const output = await monteCarloStorageService.getSimulationOutput(outputId as string);
          
          if (!output) {
            return res.status(404).json({ message: 'Simulation output not found' });
          }
          
          if (!output.llmAnalysis) {
            return res.status(404).json({ message: 'No analysis available for this simulation' });
          }
          
          return res.status(200).json({ analysis: output.llmAnalysis });
        } else if (inputId) {
          // Get analysis for the latest completed output of an input
          const outputs = await monteCarloStorageService.listSimulationOutputs(inputId as string);
          const completedOutputs = outputs.filter(o => o.status === 'completed' && o.llmAnalysis);
          
          if (completedOutputs.length === 0) {
            return res.status(404).json({ message: 'No completed simulations with analysis found' });
          }
          
          // Get the most recent analysis
          const latestOutput = completedOutputs.sort((a, b) => (b.endTime || 0) - (a.endTime || 0))[0];
          
          return res.status(200).json({ analysis: latestOutput.llmAnalysis });
        } else {
          return res.status(400).json({ message: 'outputId or inputId is required' });
        }

      case 'analysis-summary':
        // Get analysis summary across multiple simulations
        const { simulationIds } = req.query;
        
        if (!simulationIds || typeof simulationIds !== 'string') {
          return res.status(400).json({ message: 'simulationIds query parameter is required (comma-separated)' });
        }

        const ids = (simulationIds as string).split(',').map(id => id.trim());
        const summaries = [];

        for (const id of ids) {
          const outputs = await monteCarloStorageService.listSimulationOutputs(id);
          const completedOutputs = outputs.filter(o => o.status === 'completed' && o.llmAnalysis);
          
          if (completedOutputs.length > 0) {
            const latestOutput = completedOutputs.sort((a, b) => (b.endTime || 0) - (a.endTime || 0))[0];
            const input = await monteCarloStorageService.getSimulationInput(id);
            
            summaries.push({
              simulationId: id,
              simulationName: input?.name || 'Unknown',
              riskLevel: latestOutput.llmAnalysis?.riskAssessment?.riskLevel || 'unknown',
              keyInsights: latestOutput.llmAnalysis?.insights.slice(0, 2) || [],
              topRecommendation: latestOutput.llmAnalysis?.recommendations[0] || 'No recommendations available'
            });
          }
        }

        return res.status(200).json({ summaries });

      case 'risk-assessment':
        // Generate risk assessment for a simulation
        if (!outputId) {
          return res.status(400).json({ message: 'outputId is required for risk assessment' });
        }

        const output = await monteCarloStorageService.getSimulationOutput(outputId as string);
        
        if (!output || !output.results) {
          return res.status(404).json({ message: 'Simulation output or results not found' });
        }

        const riskAssessment = await generateRiskAssessment(output);
        
        return res.status(200).json({ riskAssessment });

      default:
        return res.status(400).json({ message: 'Invalid operation' });
    }
  } catch (error) {
    console.error('Error in analysis GET:', error);
    return res.status(500).json({
      message: 'Error retrieving analysis data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Handle POST requests
 * Generate new analysis or regenerate existing analysis
 */
const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { operation = 'generate-analysis' } = req.query;

  try {
    switch (operation) {
      case 'generate-analysis':
        const { outputId, forceRegenerate = false } = req.body;

        if (!outputId) {
          return res.status(400).json({ message: 'outputId is required' });
        }

        const output = await monteCarloStorageService.getSimulationOutput(outputId);
        
        if (!output) {
          return res.status(404).json({ message: 'Simulation output not found' });
        }

        if (!output.results) {
          return res.status(400).json({ message: 'Simulation has no results to analyze' });
        }

        // Check if analysis already exists and forceRegenerate is false
        if (output.llmAnalysis && !forceRegenerate) {
          return res.status(200).json({
            message: 'Analysis already exists',
            analysis: output.llmAnalysis,
            regenerated: false
          });
        }

        // Generate new analysis
        const updatedOutput = await vietnamMonteCarloAdapter.generateLlmAnalysis(outputId);
        
        if (!updatedOutput || !updatedOutput.llmAnalysis) {
          return res.status(500).json({ message: 'Failed to generate analysis' });
        }

        return res.status(201).json({
          message: 'Analysis generated successfully',
          analysis: updatedOutput.llmAnalysis,
          regenerated: forceRegenerate
        });

      case 'batch-analysis':
        // Generate analysis for multiple simulations
        const { simulationIds } = req.body;

        if (!simulationIds || !Array.isArray(simulationIds)) {
          return res.status(400).json({ message: 'simulationIds array is required' });
        }

        const batchResults = [];

        for (const simulationId of simulationIds) {
          try {
            const outputs = await monteCarloStorageService.listSimulationOutputs(simulationId);
            const completedOutputs = outputs.filter(o => o.status === 'completed');
            
            if (completedOutputs.length > 0) {
              const latestOutput = completedOutputs.sort((a, b) => (b.endTime || 0) - (a.endTime || 0))[0];
              
              if (!latestOutput.llmAnalysis) {
                const updatedOutput = await vietnamMonteCarloAdapter.generateLlmAnalysis(latestOutput.id);
                
                batchResults.push({
                  simulationId,
                  outputId: latestOutput.id,
                  status: 'analysis_generated',
                  analysis: updatedOutput?.llmAnalysis || null
                });
              } else {
                batchResults.push({
                  simulationId,
                  outputId: latestOutput.id,
                  status: 'analysis_exists',
                  analysis: latestOutput.llmAnalysis
                });
              }
            } else {
              batchResults.push({
                simulationId,
                status: 'no_completed_outputs',
                analysis: null
              });
            }
          } catch (error) {
            batchResults.push({
              simulationId,
              status: 'error',
              error: error instanceof Error ? error.message : 'Unknown error',
              analysis: null
            });
          }
        }

        return res.status(200).json({
          message: 'Batch analysis completed',
          results: batchResults,
          summary: {
            total: simulationIds.length,
            analyzed: batchResults.filter(r => r.status === 'analysis_generated').length,
            existing: batchResults.filter(r => r.status === 'analysis_exists').length,
            errors: batchResults.filter(r => r.status === 'error').length
          }
        });

      case 'comparative-analysis':
        // Generate comparative analysis between multiple simulations
        const { comparisonSimulationIds, comparisonFocus = 'risk_and_returns' } = req.body;

        if (!comparisonSimulationIds || !Array.isArray(comparisonSimulationIds) || comparisonSimulationIds.length < 2) {
          return res.status(400).json({ message: 'At least 2 simulation IDs required for comparative analysis' });
        }

        const comparativeAnalysis = await generateComparativeAnalysis(comparisonSimulationIds, comparisonFocus);
        
        return res.status(201).json({
          message: 'Comparative analysis generated',
          analysis: comparativeAnalysis
        });

      case 'custom-analysis':
        // Generate custom analysis with specific focus areas
        const { targetOutputId, focusAreas, customPrompt } = req.body;

        if (!targetOutputId) {
          return res.status(400).json({ message: 'targetOutputId is required' });
        }

        const targetOutput = await monteCarloStorageService.getSimulationOutput(targetOutputId);
        
        if (!targetOutput || !targetOutput.results) {
          return res.status(404).json({ message: 'Simulation output or results not found' });
        }

        const customAnalysis = await generateCustomAnalysis(targetOutput, focusAreas, customPrompt);
        
        return res.status(201).json({
          message: 'Custom analysis generated',
          analysis: customAnalysis
        });

      default:
        return res.status(400).json({ message: 'Invalid operation' });
    }
  } catch (error) {
    console.error('Error in analysis POST:', error);
    return res.status(500).json({
      message: 'Error generating analysis',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Generate risk assessment for a simulation output
 */
const generateRiskAssessment = async (output: any): Promise<any> => {
  if (!output.results) {
    throw new Error('No results available for risk assessment');
  }

  const results = output.results;
  const pessimisticProb = results.scenarios?.pessimistic?.probability || 0;
  const mean = results.summary?.mean || 0;
  const standardDeviation = results.summary?.standardDeviation || 0;
  
  // Calculate risk metrics
  const coefficientOfVariation = standardDeviation / Math.abs(mean);
  const valueAtRisk5 = results.percentiles?.find(p => p.percentile === 5)?.value || results.summary?.min;
  const valueAtRisk10 = results.percentiles?.find(p => p.percentile === 10)?.value || results.summary?.min;
  
  // Determine risk level
  let riskLevel: RiskLevel = 'low';
  if (pessimisticProb > 0.3 || coefficientOfVariation > 1.0) {
    riskLevel = 'high';
  } else if (pessimisticProb > 0.15 || coefficientOfVariation > 0.5) {
    riskLevel = 'medium';
  }

  return {
    riskLevel,
    pessimisticProbability: pessimisticProb,
    coefficientOfVariation,
    valueAtRisk: {
      fivePercent: valueAtRisk5,
      tenPercent: valueAtRisk10
    },
    riskFactors: [
      {
        factor: 'Outcome Variability',
        severity: Math.min(coefficientOfVariation, 1.0),
        description: `High variability in outcomes with coefficient of variation: ${coefficientOfVariation.toFixed(2)}`
      },
      {
        factor: 'Negative Outcome Probability',
        severity: pessimisticProb,
        description: `${(pessimisticProb * 100).toFixed(1)}% probability of pessimistic outcomes`
      }
    ],
    recommendations: [
      riskLevel === 'high' ? 'Implement immediate risk mitigation strategies' : 
      riskLevel === 'medium' ? 'Monitor risk factors closely and prepare contingency plans' :
      'Continue with current approach while maintaining regular monitoring',
      
      coefficientOfVariation > 0.5 ? 'Consider reducing parameter uncertainty through better data or hedging' :
      'Parameter uncertainty is at acceptable levels',
      
      pessimisticProb > 0.2 ? 'Develop specific plans for handling pessimistic scenarios' :
      'Current risk profile is manageable'
    ].filter(Boolean)
  };
};

/**
 * Generate comparative analysis between multiple simulations
 */
const generateComparativeAnalysis = async (simulationIds: string[], focus: string): Promise<LlmAnalysis> => {
  const simulations = [];
  
  // Collect simulation data
  for (const id of simulationIds) {
    const input = await monteCarloStorageService.getSimulationInput(id);
    const outputs = await monteCarloStorageService.listSimulationOutputs(id);
    const completedOutputs = outputs.filter(o => o.status === 'completed');
    
    if (input && completedOutputs.length > 0) {
      const latestOutput = completedOutputs.sort((a, b) => (b.endTime || 0) - (a.endTime || 0))[0];
      simulations.push({ input, output: latestOutput });
    }
  }

  if (simulations.length < 2) {
    throw new Error('Need at least 2 completed simulations for comparative analysis');
  }

  // Generate comparative insights
  const insights = [];
  const recommendations = [];
  const riskFactors = [];

  // Compare means and identify outliers
  const means = simulations.map(s => s.output.results?.summary?.mean || 0);
  const bestMean = Math.max(...means);
  const worstMean = Math.min(...means);
  const bestSim = simulations.find(s => (s.output.results?.summary?.mean || 0) === bestMean);
  const worstSim = simulations.find(s => (s.output.results?.summary?.mean || 0) === worstMean);

  if (bestSim && worstSim) {
    insights.push(`${bestSim.input.name} shows the best expected outcome with ${bestMean.toFixed(2)}M USD, while ${worstSim.input.name} shows ${worstMean.toFixed(2)}M USD, a difference of ${(bestMean - worstMean).toFixed(2)}M USD.`);
  }

  // Compare risk profiles
  const pessimisticProbs = simulations.map(s => s.output.results?.scenarios?.pessimistic?.probability || 0);
  const lowestRisk = Math.min(...pessimisticProbs);
  const highestRisk = Math.max(...pessimisticProbs);
  const safestSim = simulations.find(s => (s.output.results?.scenarios?.pessimistic?.probability || 0) === lowestRisk);
  const riskiestSim = simulations.find(s => (s.output.results?.scenarios?.pessimistic?.probability || 0) === highestRisk);

  if (safestSim && riskiestSim) {
    insights.push(`${safestSim.input.name} presents the lowest risk profile with ${(lowestRisk * 100).toFixed(1)}% pessimistic probability, compared to ${riskiestSim.input.name} at ${(highestRisk * 100).toFixed(1)}%.`);
  }

  // Generate recommendations based on comparison
  if (bestSim) {
    recommendations.push(`Consider adopting parameters from ${bestSim.input.name} which achieved the best performance.`);
  }
  
  if (safestSim) {
    recommendations.push(`Review risk management approach from ${safestSim.input.name} for lowest risk exposure.`);
  }

  recommendations.push('Perform detailed parameter analysis to understand what drives the performance differences between simulations.');

  // Identify common risk factors
  riskFactors.push({
    factor: 'Parameter Selection Impact',
    severity: (highestRisk + (Math.max(...means.map(m => Math.abs(m))) / 1000000)) / 2,
    mitigation: 'Standardize parameter selection methodology based on best-performing simulations'
  });

  return {
    insights,
    recommendations,
    riskFactors,
    riskAssessment: {
      text: `Comparative analysis of ${simulations.length} simulations shows significant variation in outcomes. Best case achieves ${bestMean.toFixed(2)}M USD while worst case shows ${worstMean.toFixed(2)}M USD. Risk levels vary from ${(lowestRisk * 100).toFixed(1)}% to ${(highestRisk * 100).toFixed(1)}% pessimistic probability.`,
      riskLevel: highestRisk > 0.3 ? 'high' : highestRisk > 0.15 ? 'medium' : 'low',
      probabilityOfNegativeImpact: Math.max(...pessimisticProbs)
    }
  };
};

/**
 * Generate custom analysis with specific focus areas
 */
const generateCustomAnalysis = async (output: any, focusAreas?: string[], customPrompt?: string): Promise<LlmAnalysis> => {
  if (!output.results) {
    throw new Error('No results available for analysis');
  }

  const results = output.results;
  
  // Use Perplexity for custom analysis if available
  try {
    const perplexityService = new PerplexityLLMService();
    
    const analysisPrompt = customPrompt || `
      Analyze the following Monte Carlo simulation results with focus on: ${focusAreas?.join(', ') || 'general analysis'}
      
      Results Summary:
      - Mean: ${results.summary?.mean || 0}
      - Median: ${results.summary?.median || 0}
      - Standard Deviation: ${results.summary?.standardDeviation || 0}
      - Pessimistic Scenario Probability: ${(results.scenarios?.pessimistic?.probability * 100 || 0).toFixed(1)}%
      - Realistic Scenario Probability: ${(results.scenarios?.realistic?.probability * 100 || 0).toFixed(1)}%
      - Optimistic Scenario Probability: ${(results.scenarios?.optimistic?.probability * 100 || 0).toFixed(1)}%
      
      Sensitivity Analysis:
      ${results.sensitivityAnalysis?.map(s => `- ${s.parameter}: ${s.correlation.toFixed(2)} correlation, ${s.impact.toFixed(2)} impact`).join('\n') || 'Not available'}
      
      Please provide:
      1. Key insights about the simulation results
      2. Specific recommendations for risk management
      3. Risk factors and mitigation strategies
      4. Overall risk assessment
    `;

    const response = await perplexityService.chat([{
      role: 'user',
      content: analysisPrompt
    }]);

    // Parse the response to extract structured insights
    const analysisText = response;
    
    // Extract insights, recommendations, and risk factors from the text
    // This is a simplified parsing - in production you'd want more sophisticated NLP
    const insights = extractInsights(analysisText);
    const recommendations = extractRecommendations(analysisText);
    const riskFactors = extractRiskFactors(analysisText, results);
    const riskAssessment = extractRiskAssessment(analysisText, results);

    return {
      insights,
      recommendations,
      riskFactors,
      riskAssessment
    };
  } catch (error) {
    console.error('Error using Perplexity for custom analysis:', error);
    
    // Fallback to basic analysis
    return generateBasicAnalysis(results, focusAreas);
  }
};

/**
 * Extract insights from analysis text
 */
const extractInsights = (text: string): string[] => {
  // Simple extraction - look for numbered lists or bullet points
  const insights = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.match(/^[\d\-\*]\s*/) && trimmed.length > 20) {
      insights.push(trimmed.replace(/^[\d\-\*]\s*/, ''));
    }
  }
  
  return insights.slice(0, 5); // Limit to 5 insights
};

/**
 * Extract recommendations from analysis text
 */
const extractRecommendations = (text: string): string[] => {
  const recommendations = [];
  const lines = text.split('\n');
  
  let inRecommendationSection = false;
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.toLowerCase().includes('recommend')) {
      inRecommendationSection = true;
    }
    
    if (inRecommendationSection && trimmed.match(/^[\d\-\*]\s*/) && trimmed.length > 20) {
      recommendations.push(trimmed.replace(/^[\d\-\*]\s*/, ''));
    }
  }
  
  return recommendations.slice(0, 5); // Limit to 5 recommendations
};

/**
 * Extract risk factors from analysis text
 */
const extractRiskFactors = (text: string, results: any): any[] => {
  const riskFactors = [];
  
  // Add standard risk factors based on results
  if (results.scenarios?.pessimistic?.probability > 0.2) {
    riskFactors.push({
      factor: 'High Pessimistic Scenario Probability',
      severity: results.scenarios.pessimistic.probability,
      mitigation: 'Implement robust risk management strategies and scenario planning'
    });
  }
  
  if (results.summary?.standardDeviation / Math.abs(results.summary?.mean || 1) > 0.5) {
    riskFactors.push({
      factor: 'High Outcome Variability',
      severity: Math.min(results.summary.standardDeviation / Math.abs(results.summary.mean || 1), 1.0),
      mitigation: 'Reduce parameter uncertainty through better data collection or hedging'
    });
  }
  
  return riskFactors;
};

/**
 * Extract risk assessment from analysis text
 */
const extractRiskAssessment = (text: string, results: any): any => {
  const pessimisticProb = results.scenarios?.pessimistic?.probability || 0;
  
  let riskLevel: RiskLevel = 'low';
  if (pessimisticProb > 0.3) {
    riskLevel = 'high';
  } else if (pessimisticProb > 0.15) {
    riskLevel = 'medium';
  }
  
  return {
    text: `Based on the simulation results, the overall risk level is ${riskLevel} with ${(pessimisticProb * 100).toFixed(1)}% probability of pessimistic outcomes. ${riskLevel === 'high' ? 'Immediate risk mitigation is recommended.' : riskLevel === 'medium' ? 'Moderate risk management measures should be implemented.' : 'Current risk levels are acceptable with standard monitoring.'}`,
    riskLevel,
    probabilityOfNegativeImpact: pessimisticProb
  };
};

/**
 * Generate basic analysis when advanced analysis is not available
 */
const generateBasicAnalysis = (results: any, focusAreas?: string[]): LlmAnalysis => {
  const insights = [
    `Simulation shows mean outcome of ${results.summary?.mean?.toFixed(2) || 0} with standard deviation of ${results.summary?.standardDeviation?.toFixed(2) || 0}.`,
    `Pessimistic scenarios have ${((results.scenarios?.pessimistic?.probability || 0) * 100).toFixed(1)}% probability of occurrence.`,
    `${focusAreas?.includes('volatility') ? 'Volatility analysis shows ' : ''}Most sensitive parameter is ${results.sensitivityAnalysis?.[0]?.parameter || 'exchange rate'} with ${((results.sensitivityAnalysis?.[0]?.correlation || 0) * 100).toFixed(0)}% correlation.`
  ];

  const recommendations = [
    'Monitor key risk parameters identified in sensitivity analysis.',
    'Implement hedging strategies for high-impact parameters.',
    'Regular reassessment of simulation parameters recommended.',
    focusAreas?.includes('cost-optimization') ? 'Focus on cost optimization strategies based on simulation outcomes.' : 'Consider scenario-based planning for different outcome ranges.'
  ].filter(Boolean);

  const riskFactors = [
    {
      factor: 'Parameter Uncertainty',
      severity: Math.min((results.summary?.standardDeviation || 0) / Math.abs(results.summary?.mean || 1), 1.0),
      mitigation: 'Improve data quality and parameter estimation accuracy'
    }
  ];

  const pessimisticProb = results.scenarios?.pessimistic?.probability || 0;
  
  return {
    insights,
    recommendations,
    riskFactors,
    riskAssessment: {
      text: `Basic analysis indicates ${pessimisticProb > 0.3 ? 'high' : pessimisticProb > 0.15 ? 'medium' : 'low'} risk level based on simulation outcomes.`,
      riskLevel: pessimisticProb > 0.3 ? 'high' : pessimisticProb > 0.15 ? 'medium' : 'low',
      probabilityOfNegativeImpact: pessimisticProb
    }
  };
};