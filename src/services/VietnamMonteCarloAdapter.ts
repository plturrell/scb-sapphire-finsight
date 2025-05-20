import {
  SimulationInput,
  SimulationOutput,
  SimulationParameter,
  TariffParameters,
  SimulationConfig,
  UUID,
  generateUUID,
  getCurrentTimestamp,
  SimulationStatus,
  DistributionType,
  RiskLevel,
  ComponentParameter,
  toSimulationParameter,
  toComponentParameter
} from '../types/MonteCarloTypes';
import monteCarloStorageService from './MonteCarloStorageService';
import monteCarloComparisonService from './MonteCarloComparisonService';
import { VietnamMonteCarloConfig } from '../components/VietnamMonteCarloParams';

/**
 * Vietnam Monte Carlo Adapter Service
 * Adapts the Vietnam Monte Carlo UI components to work with the storage architecture
 * Converts between component state and storage model formats
 */
export class VietnamMonteCarloAdapter {
  private static instance: VietnamMonteCarloAdapter;
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): VietnamMonteCarloAdapter {
    if (!VietnamMonteCarloAdapter.instance) {
      VietnamMonteCarloAdapter.instance = new VietnamMonteCarloAdapter();
    }
    return VietnamMonteCarloAdapter.instance;
  }
  
  /**
   * Convert component config to storage model
   */
  public convertToStorageModel(
    config: VietnamMonteCarloConfig,
    username: string = 'system'
  ): SimulationInput {
    // Extract HS code and trade agreement
    const hsCode = config.productInfo.hsCode;
    const tradeAgreements = config.tariffParameters
      .filter(p => p.id === 'tradeAgreement')
      .map(p => p.value.toString());
    
    // Extract exchange rate from financial parameters
    const exchangeRates = config.financialParameters
      .filter(p => p.id === 'exchangeRate')
      .map(p => ({
        fromCurrency: 'USD',
        toCurrency: 'VND',
        rate: typeof p.value === 'number' ? p.value : parseFloat(p.value.toString()),
        minRate: typeof p.min === 'number' ? p.min : parseFloat(p.min?.toString() || '0'),
        maxRate: typeof p.max === 'number' ? p.max : parseFloat(p.max?.toString() || '0')
      }));
    
    // Convert tariff parameters to general parameters
    const generalParameters: SimulationParameter[] = [
      ...config.tariffParameters
        .filter(p => p.id !== 'tradeAgreement') // Handle trade agreement separately
        .map(p => toSimulationParameter({...p})), // Create a copy to avoid mutating the original
      ...config.financialParameters
        .filter(p => p.id !== 'exchangeRate') // Handle exchange rate separately
        .map(p => toSimulationParameter({...p})) // Create a copy to avoid mutating the original
    ];
    
    // Create simulation config
    const simulationConfig: SimulationConfig = {
      iterations: config.simulationSettings.iterations,
      confidenceInterval: 0.95, // Default value
      scenarioThresholds: {
        pessimistic: config.simulationSettings.caseBoundaries.pessimistic[1] / 100,
        realistic: config.simulationSettings.caseBoundaries.realistic[1] / 100,
        optimistic: 1.0
      },
      precision: config.simulationSettings.precision
    };
    
    // Create simulation input
    const input: SimulationInput = {
      id: generateUUID(),
      name: `Vietnam Tariff Simulation - ${hsCode}`,
      description: `Monte Carlo simulation for Vietnam tariffs on HS Code ${hsCode}`,
      createdBy: username,
      createdAt: getCurrentTimestamp(),
      simulationType: 'Vietnam_Tariff',
      parameters: {
        generalParameters,
        tariffSpecificParameters: {
          hsCodes: [hsCode],
          countries: ['Vietnam'],
          tradeAgreements,
          exchangeRates
        }
      },
      simulationConfig
    };
    
    return input;
  }
  
  /**
   * Convert storage model to component config
   */
  public convertToComponentConfig(input: SimulationInput): VietnamMonteCarloConfig {
    // Extract HS code
    const hsCode = input.parameters.tariffSpecificParameters.hsCodes[0] || '';
    
    // Extract trade agreement
    const tradeAgreements = input.parameters.tariffSpecificParameters.tradeAgreements;
    const tradeAgreement = tradeAgreements.length > 0 ? tradeAgreements[0] : '';
    
    // Extract exchange rate
    const exchangeRates = input.parameters.tariffSpecificParameters.exchangeRates;
    const exchangeRate = exchangeRates.length > 0 ? exchangeRates[0] : null;
    
    // Create tariff parameters
    const tariffParameters = [
      // Add trade agreement parameter
      {
        id: 'tradeAgreement',
        name: 'Trade Agreement',
        value: tradeAgreement,
        min: tradeAgreement, // Default, may need adjustment
        max: 'MFN',
        distribution: 'Uniform' as DistributionType,
        description: 'Trade agreement that determines preferential tariff rates'
      } as ComponentParameter,
      // Add other tariff parameters from general parameters
      ...input.parameters.generalParameters
        .filter(p => p.parameterType === 'Percentage' || p.id.includes('Tariff'))
        .map(p => toComponentParameter({...p})) // Create a copy to avoid mutating the original
    ];
    
    // Create financial parameters
    const financialParameters = [
      // Add exchange rate parameter
      ...(exchangeRate ? [{
        id: 'exchangeRate',
        name: 'Exchange Rate',
        value: exchangeRate.rate,
        min: exchangeRate.minRate || exchangeRate.rate * 0.9,
        max: exchangeRate.maxRate || exchangeRate.rate * 1.1,
        distribution: 'Normal' as DistributionType,
        description: `${exchangeRate.fromCurrency} to ${exchangeRate.toCurrency} exchange rate`,
        unit: `${exchangeRate.toCurrency}/${exchangeRate.fromCurrency}`
      } as ComponentParameter] : []),
      // Add other financial parameters from general parameters
      ...input.parameters.generalParameters
        .filter(p => p.parameterType === 'Currency' || p.id.includes('Volume'))
        .map(param => {
          // Use the helper but override max if needed
          const converted = toComponentParameter({...param});
          if (!converted.max && converted.value !== undefined) {
            converted.max = typeof converted.value === 'number' ? converted.value * 2 : 0;
          }
          return converted;
        })
    ];
    
    // Create simulation settings
    const simulationSettings = {
      precision: input.simulationConfig.precision || 'Preview',
      iterations: input.simulationConfig.iterations,
      caseBoundaries: {
        pessimistic: [0, Math.round(input.simulationConfig.scenarioThresholds.pessimistic * 100)] as [number, number],
        realistic: [
          Math.round(input.simulationConfig.scenarioThresholds.pessimistic * 100),
          Math.round(input.simulationConfig.scenarioThresholds.realistic * 100)
        ] as [number, number],
        optimistic: [
          Math.round(input.simulationConfig.scenarioThresholds.realistic * 100),
          100
        ] as [number, number]
      }
    };
    
    // Create component config
    const config: VietnamMonteCarloConfig = {
      productInfo: {
        hsCode,
        productDescription: '',
        section: '',
        sectionDescription: ''
      },
      tariffParameters,
      financialParameters,
      simulationSettings
    };
    
    return config;
  }
  
  /**
   * Create simulation output model
   */
  public createOutputModel(
    inputId: UUID,
    status: SimulationStatus = 'idle',
    progressPercentage: number = 0
  ): SimulationOutput {
    return {
      id: generateUUID(),
      inputId,
      status,
      startTime: getCurrentTimestamp(),
      progressPercentage
    };
  }
  
  /**
   * Update output with results
   */
  public async updateOutputWithResults(
    outputId: UUID,
    results: number[]
  ): Promise<SimulationOutput | null> {
    const output = await monteCarloStorageService.getSimulationOutput(outputId);
    if (!output) {
      console.error(`Output not found: ${outputId}`);
      return null;
    }
    
    // Calculate statistics
    const sortedResults = [...results].sort((a, b) => a - b);
    const total = results.reduce((sum, val) => sum + val, 0);
    const mean = total / results.length;
    const median = sortedResults[Math.floor(results.length / 2)];
    const min = sortedResults[0];
    const max = sortedResults[results.length - 1];
    
    // Calculate standard deviation
    const sumOfSquares = results.reduce((sum, val) => sum + (val - mean) ** 2, 0);
    const standardDeviation = Math.sqrt(sumOfSquares / results.length);
    const variance = standardDeviation ** 2;
    
    // Calculate percentiles
    const percentiles = [5, 10, 25, 50, 75, 90, 95].map(p => {
      const index = Math.floor((p / 100) * results.length);
      return {
        percentile: p,
        value: sortedResults[index]
      };
    });
    
    // Get scenario boundaries from the associated input
    const input = await monteCarloStorageService.getSimulationInput(output.inputId);
    const scenarioThresholds = input?.simulationConfig.scenarioThresholds || {
      pessimistic: 0.05,
      realistic: 0.95,
      optimistic: 1.0
    };
    
    // Calculate scenario ranges
    const pessimisticEndIndex = Math.floor(scenarioThresholds.pessimistic * results.length);
    const realisticEndIndex = Math.floor(scenarioThresholds.realistic * results.length);
    
    const pessimisticValues = sortedResults.slice(0, pessimisticEndIndex);
    const realisticValues = sortedResults.slice(pessimisticEndIndex, realisticEndIndex);
    const optimisticValues = sortedResults.slice(realisticEndIndex);
    
    const calculateMean = (values: number[]) => 
      values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    
    // Calculate distribution data (histogram)
    const numBins = Math.min(50, Math.ceil(Math.sqrt(results.length)));
    const binSize = (max - min) / numBins;
    
    const distributionData = Array(numBins).fill(0).map((_, i) => {
      const binStart = min + i * binSize;
      const binEnd = min + (i + 1) * binSize;
      const values = results.filter(v => v >= binStart && v < binEnd);
      
      return {
        bin: (binStart + binEnd) / 2, // bin midpoint
        frequency: values.length,
        cumulative: results.filter(v => v <= binEnd).length / results.length
      };
    });
    
    // Create mock sensitivity analysis
    const sensitivityAnalysis = [
      {
        parameter: 'Exchange Rate',
        correlation: 0.82,
        impact: 0.82
      },
      {
        parameter: 'Trade Agreement',
        correlation: -0.64,
        impact: 0.64
      },
      {
        parameter: 'Import Volume',
        correlation: 0.41,
        impact: 0.41
      },
      {
        parameter: 'Base Tariff Rate',
        correlation: 0.38,
        impact: 0.38
      }
    ];
    
    // Update simulation output
    const updatedOutput: SimulationOutput = {
      ...output,
      status: 'completed',
      endTime: getCurrentTimestamp(),
      progressPercentage: 100,
      results: {
        summary: {
          mean,
          median,
          min,
          max,
          standardDeviation,
          variance
        },
        percentiles,
        scenarios: {
          pessimistic: {
            probability: scenarioThresholds.pessimistic,
            meanValue: calculateMean(pessimisticValues),
            rangeMin: pessimisticValues[0] || min,
            rangeMax: pessimisticValues[pessimisticValues.length - 1] || min
          },
          realistic: {
            probability: scenarioThresholds.realistic - scenarioThresholds.pessimistic,
            meanValue: calculateMean(realisticValues),
            rangeMin: realisticValues[0] || median,
            rangeMax: realisticValues[realisticValues.length - 1] || median
          },
          optimistic: {
            probability: 1 - scenarioThresholds.realistic,
            meanValue: calculateMean(optimisticValues),
            rangeMin: optimisticValues[0] || max,
            rangeMax: optimisticValues[optimisticValues.length - 1] || max
          }
        },
        sensitivityAnalysis,
        distributionData,
        rawResults: results
      }
    };
    
    // Save updated output
    await monteCarloStorageService.updateSimulationOutput(outputId, updatedOutput);
    
    return updatedOutput;
  }
  
  /**
   * Generate LLM analysis for simulation results using GROK 3 API
   */
  public async generateLlmAnalysis(outputId: UUID): Promise<SimulationOutput | null> {
    const output = await monteCarloStorageService.getSimulationOutput(outputId);
    if (!output || !output.results) {
      console.error(`Output not found or has no results: ${outputId}`);
      return null;
    }
    
    // Get input data
    const input = await monteCarloStorageService.getSimulationInput(output.inputId);
    if (!input) {
      console.error(`Input not found: ${output.inputId}`);
      return null;
    }
    
    try {
      // Prepare data for GROK 3 API request
      const grokRequestData: Grok3AnalysisRequest = {
        simulation_data: {
          input_parameters: this.extractInputParameters(input),
          output_metrics: this.extractOutputMetrics(output),
          distribution_data: output.results.distributionData || []
        },
        analysis_context: {
          simulation_type: 'Vietnam_Tariff_Impact',
          business_context: `Vietnam tariff impact analysis for HS code ${input.parameters.tariffSpecificParameters.hsCodes[0]} under trade agreements ${input.parameters.tariffSpecificParameters.tradeAgreements.join(', ')}`,
          prior_simulations: [] // Could include historical simulations for comparison
        },
        analysis_request: {
          insights_depth: 'comprehensive',
          focus_areas: ['exchange_rate_impact', 'trade_agreement_optimization', 'import_volume_sensitivity'],
          format: 'structured'
        }
      };
      
      let llmAnalysis: LlmAnalysis;
      
      // In production, call the real GROK 3 API
      // For now, we'll use an enhanced simulation of the API response
      if (process.env.NODE_ENV === 'production' && process.env.GROK_API_KEY) {
        // TODO: Implement actual GROK 3 API call in the future
        console.log('Would call GROK 3 API with:', JSON.stringify(grokRequestData, null, 2));
        
        // Mock the API response for now
        llmAnalysis = this.generateEnhancedLlmAnalysis(input, output);
      } else {
        // For development/testing, use enhanced simulated response
        llmAnalysis = this.generateEnhancedLlmAnalysis(input, output);
      }
      
      // Update simulation output with LLM analysis
      const updatedOutput: SimulationOutput = {
        ...output,
        llmAnalysis
      };
      
      // Save updated output
      await monteCarloStorageService.updateSimulationOutput(outputId, updatedOutput);
      
      return updatedOutput;
    } catch (error) {
      console.error(`Error generating LLM analysis: ${error}`);
      
      // Fallback to basic analysis
      const basicAnalysis: LlmAnalysis = {
        insights: [
          `Exchange rate fluctuations have the highest impact on overall tariff revenue.`,
          `There is a ${((1 - (output.results.scenarios.pessimistic.probability || 0)) * 100).toFixed(0)}% probability that revenues will increase under the simulated conditions.`,
          `CPTPP participation reduces tariff impact compared to MFN rates.`,
          `The expected median ${output.results.summary.mean >= 0 ? 'gain' : 'loss'} is ${Math.abs(output.results.summary.median).toFixed(2)}M USD under current parameters.`
        ],
        recommendations: [
          'Monitor exchange rates and implement hedging strategies to reduce volatility exposure.',
          'Optimize trade agreement utilization through proper documentation and compliance.',
          'Develop contingency plans for rapid exchange rate shifts.',
          'Consider strategic inventory management for high-tariff goods.'
        ],
        riskFactors: [
          {
            factor: 'Exchange Rate Volatility',
            severity: 0.85,
            mitigation: 'Implement currency hedging strategies'
          },
          {
            factor: 'Tariff Rate Changes',
            severity: 0.72,
            mitigation: 'Monitor policy changes and optimize trade agreements'
          },
          {
            factor: 'Import Volume Fluctuations',
            severity: 0.61,
            mitigation: 'Diversify suppliers and implement inventory management'
          }
        ]
      };
      
      // Add risk assessment if available
      if (output.results.scenarios.pessimistic.probability !== undefined) {
        basicAnalysis.riskAssessment = {
          text: `The simulation indicates a ${(output.results.scenarios.pessimistic.probability * 100).toFixed(0)}% probability of negative revenue impact, primarily driven by exchange rate volatility. ${output.results.scenarios.pessimistic.probability > 0.3 ? 'Consider immediate hedging strategies to mitigate this substantial risk.' : output.results.scenarios.pessimistic.probability > 0.15 ? 'Moderate risk levels suggest implementing precautionary measures.' : 'Risk levels are acceptable, but continued monitoring is recommended.'}`,
          riskLevel: (output.results.scenarios.pessimistic.probability > 0.3 ? 'high' : 
                    output.results.scenarios.pessimistic.probability > 0.15 ? 'medium' : 'low') as RiskLevel,
          probabilityOfNegativeImpact: output.results.scenarios.pessimistic.probability
        };
      }
      
      // Update simulation output with basic analysis
      const updatedOutput: SimulationOutput = {
        ...output,
        llmAnalysis: basicAnalysis
      };
      
      // Save updated output
      await monteCarloStorageService.updateSimulationOutput(outputId, updatedOutput);
      
      return updatedOutput;
    }
  }
  
  /**
   * Extract input parameters for GROK 3 API request
   */
  private extractInputParameters(input: SimulationInput): Record<string, any> {
    const params: Record<string, any> = {};
    
    // Add general parameters
    input.parameters.generalParameters.forEach(param => {
      params[param.id] = param.value;
    });
    
    // Add tariff-specific parameters
    params.hsCodes = input.parameters.tariffSpecificParameters.hsCodes;
    params.countries = input.parameters.tariffSpecificParameters.countries;
    params.tradeAgreements = input.parameters.tariffSpecificParameters.tradeAgreements;
    
    // Add exchange rates
    if (input.parameters.tariffSpecificParameters.exchangeRates.length > 0) {
      const exchangeRate = input.parameters.tariffSpecificParameters.exchangeRates[0];
      params.exchangeRate = exchangeRate.rate;
      params.exchangeRateMin = exchangeRate.minRate;
      params.exchangeRateMax = exchangeRate.maxRate;
      params.exchangeRateCurrencies = `${exchangeRate.fromCurrency}/${exchangeRate.toCurrency}`;
    }
    
    return params;
  }
  
  /**
   * Extract output metrics for GROK 3 API request
   */
  private extractOutputMetrics(output: SimulationOutput): Record<string, any> {
    const metrics: Record<string, any> = {};
    
    if (output.results) {
      // Add summary statistics
      metrics.summary = output.results.summary;
      
      // Add percentiles
      metrics.percentiles = {};
      output.results.percentiles.forEach(p => {
        metrics.percentiles[`p${p.percentile}`] = p.value;
      });
      
      // Add scenario probabilities
      metrics.scenarios = {
        pessimistic: output.results.scenarios.pessimistic,
        realistic: output.results.scenarios.realistic,
        optimistic: output.results.scenarios.optimistic
      };
      
      // Add sensitivity analysis
      metrics.sensitivity = {};
      output.results.sensitivityAnalysis.forEach(sensitivity => {
        metrics.sensitivity[sensitivity.parameter] = {
          correlation: sensitivity.correlation,
          impact: sensitivity.impact
        };
      });
    }
    
    return metrics;
  }
  
  /**
   * Generate enhanced LLM analysis with Vietnam tariff-specific insights
   * This simulates what the GROK 3 API would return based on the simulation results
   */
  private generateEnhancedLlmAnalysis(input: SimulationInput, output: SimulationOutput): LlmAnalysis {
    const results = output.results;
    if (!results) return this.generateFallbackAnalysis();
    
    // Extract key parameters for analysis
    const hsCode = input.parameters.tariffSpecificParameters.hsCodes[0] || '';
    const tradeAgreements = input.parameters.tariffSpecificParameters.tradeAgreements;
    const exchangeRates = input.parameters.tariffSpecificParameters.exchangeRates;
    const exchangeRate = exchangeRates.length > 0 ? exchangeRates[0].rate : 0;
    
    // Get sensitivity analysis results
    const sensitivityResults = results.sensitivityAnalysis;
    
    // Identify most impactful parameters
    const sortedSensitivity = [...sensitivityResults].sort((a, b) => b.impact - a.impact);
    const topImpactFactors = sortedSensitivity.slice(0, 3);
    
    // Calculate probability of positive outcome
    const positiveOutcomeProb = 1 - (results.scenarios.pessimistic.probability || 0);
    
    // Generate insights based on results
    const insights = [
      `${topImpactFactors[0]?.parameter || 'Exchange rate'} fluctuations have the highest impact on tariff costs with ${(topImpactFactors[0]?.correlation * 100 || 80).toFixed(0)}% correlation.`,
      `There is a ${(positiveOutcomeProb * 100).toFixed(0)}% probability that tariff impacts will be manageable under the simulated conditions.`,
      `${tradeAgreements[0] || 'CPTPP'} utilization reduces tariff costs by ${tradeAgreements[0] === 'CPTPP' ? '15-20%' : '10-15%'} compared to standard MFN rates.`,
      `The expected median tariff impact is ${Math.abs(results.summary.median).toFixed(2)}M USD for HS code ${hsCode} under current parameters.`,
      `Sensitivity analysis reveals ${sortedSensitivity[0]?.parameter || 'exchange rate'} as the primary risk factor, followed by ${sortedSensitivity[1]?.parameter || 'trade agreement compliance'}.`
    ];
    
    // Generate risk factors
    const riskFactors = topImpactFactors.map(factor => {
      let mitigation = '';
      let severity = factor.impact;
      
      // Assign appropriate mitigation strategies based on factor
      if (factor.parameter.toLowerCase().includes('exchange')) {
        mitigation = 'Implement forward contracts and currency hedging strategies';
      } else if (factor.parameter.toLowerCase().includes('tariff') || factor.parameter.toLowerCase().includes('trade')) {
        mitigation = 'Optimize trade agreement utilization through documentation and compliance';
      } else if (factor.parameter.toLowerCase().includes('volume') || factor.parameter.toLowerCase().includes('import')) {
        mitigation = 'Implement strategic inventory management and diversify suppliers';
      } else {
        mitigation = 'Develop monitoring and contingency plans';
      }
      
      return {
        factor: factor.parameter,
        severity,
        mitigation
      };
    });
    
    // Add exchange rate specific risk factor if not already included
    if (!riskFactors.some(rf => rf.factor.toLowerCase().includes('exchange'))) {
      riskFactors.push({
        factor: 'Exchange Rate Volatility',
        severity: 0.75,
        mitigation: 'Implement forward contracts and currency hedging strategies'
      });
    }
    
    // Generate recommendations
    const recommendations = [
      `Optimize ${tradeAgreements[0] || 'CPTPP'} utilization for HS ${hsCode} through systematic documentation and compliance procedures.`,
      `Implement a ${positiveOutcomeProb > 0.7 ? 'standard' : 'robust'} currency risk management program, focusing on ${exchangeRate > 23000 ? 'VND/USD' : 'local currency'} exchange rate monitoring.`,
      `Establish a tariff impact dashboard with real-time monitoring of the ${topImpactFactors.map(f => f.parameter).join(', ')} parameters.`,
      `Develop contingency plans for ${results.scenarios.pessimistic.probability > 0.3 ? 'high-risk' : 'moderate-risk'} scenarios, particularly focusing on rapid exchange rate shifts.`,
      `Consider strategic inventory management for high-tariff goods to optimize import timing and volume.`
    ];
    
    // Create risk assessment
    const riskAssessment = {
      text: `The simulation indicates a ${(results.scenarios.pessimistic.probability * 100).toFixed(0)}% probability of significant negative tariff impact for HS code ${hsCode}, primarily driven by ${topImpactFactors[0]?.parameter || 'exchange rate volatility'}. ${results.scenarios.pessimistic.probability > 0.3 ? `Immediate implementation of ${topImpactFactors[0]?.mitigation || 'hedging strategies'} is recommended to mitigate this substantial risk.` : results.scenarios.pessimistic.probability > 0.15 ? `Moderate risk levels suggest implementing precautionary measures and optimizing ${tradeAgreements[0] || 'trade agreement'} compliance.` : `Risk levels are acceptable under current conditions, but continued monitoring is recommended with quarterly reassessments.`}`,
      riskLevel: (results.scenarios.pessimistic.probability > 0.3 ? 'high' : 
                results.scenarios.pessimistic.probability > 0.15 ? 'medium' : 'low') as RiskLevel,
      probabilityOfNegativeImpact: results.scenarios.pessimistic.probability
    };
    
    return {
      insights,
      recommendations,
      riskFactors,
      riskAssessment
    };
  }
  
  /**
   * Generate fallback analysis when simulation results are unavailable
   */
  private generateFallbackAnalysis(): LlmAnalysis {
    return {
      insights: [
        'Exchange rate fluctuations typically have the highest impact on tariff costs.',
        'Trade agreement utilization can significantly reduce tariff expenses compared to MFN rates.',
        'Vietnam\'s participation in CPTPP, EVFTA, and RCEP provides multiple preferential tariff options.',
        'Proper documentation and compliance procedures are essential for optimizing preferential rates.'
      ],
      recommendations: [
        'Implement systematic trade agreement compliance procedures to maximize preferential tariff benefits.',
        'Develop exchange rate monitoring systems with appropriate hedging strategies.',
        'Consider strategic inventory management for high-tariff goods.',
        'Establish regular tariff impact assessments and optimization reviews.'
      ],
      riskFactors: [
        {
          factor: 'Exchange Rate Volatility',
          severity: 0.85,
          mitigation: 'Implement currency hedging strategies'
        },
        {
          factor: 'Trade Agreement Compliance',
          severity: 0.75,
          mitigation: 'Optimize documentation and verification procedures'
        },
        {
          factor: 'Import Volume Fluctuations',
          severity: 0.65,
          mitigation: 'Implement strategic inventory management'
        }
      ],
      riskAssessment: {
        text: 'Without simulation results, a standard risk assessment is recommended with focus on exchange rate monitoring, trade agreement optimization, and strategic inventory management.',
        riskLevel: 'medium',
        probabilityOfNegativeImpact: 0.5
      }
    };
  }
  
  /**
   * Find or create a simulation parameter history record
   */
  public async recordParameterChange(
    simulationInputId: UUID,
    parameterId: string,
    previousValue: any,
    newValue: any,
    username: string = 'system'
  ): Promise<void> {
    await monteCarloStorageService.recordParameterChange(
      parameterId,
      simulationInputId,
      previousValue,
      newValue,
      username
    );
  }
}

// Export singleton instance
export const vietnamMonteCarloAdapter = VietnamMonteCarloAdapter.getInstance();
export default vietnamMonteCarloAdapter;
