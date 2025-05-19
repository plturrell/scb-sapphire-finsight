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
  DistributionType
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
        minRate: typeof p.min === 'number' ? p.min : parseFloat(p.min.toString()),
        maxRate: typeof p.max === 'number' ? p.max : parseFloat(p.max.toString())
      }));
    
    // Convert tariff parameters to general parameters
    const generalParameters: SimulationParameter[] = [
      ...config.tariffParameters
        .filter(p => p.id !== 'tradeAgreement') // Handle trade agreement separately
        .map(p => ({
          id: p.id,
          name: p.name,
          value: p.value,
          minValue: p.min,
          maxValue: p.max,
          distributionType: p.distribution as DistributionType,
          parameterType: p.id.includes('Rate') ? 'Percentage' : 'Numeric',
          unit: p.unit,
          description: p.description
        })),
      ...config.financialParameters
        .filter(p => p.id !== 'exchangeRate') // Handle exchange rate separately
        .map(p => ({
          id: p.id,
          name: p.name,
          value: p.value,
          minValue: p.min,
          maxValue: p.max,
          distributionType: p.distribution as DistributionType,
          parameterType: p.id.includes('Volume') ? 'Currency' : 'Numeric',
          unit: p.unit,
          description: p.description
        }))
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
      },
      // Add other tariff parameters from general parameters
      ...input.parameters.generalParameters
        .filter(p => p.parameterType === 'Percentage' || p.id.includes('Tariff'))
        .map(p => ({
          id: p.id,
          name: p.name,
          value: p.value,
          min: p.minValue || 0,
          max: p.maxValue || 100,
          distribution: p.distributionType,
          description: p.description || '',
          unit: p.unit
        }))
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
      }] : []),
      // Add other financial parameters from general parameters
      ...input.parameters.generalParameters
        .filter(p => p.parameterType === 'Currency' || p.id.includes('Volume'))
        .map(p => ({
          id: p.id,
          name: p.name,
          value: p.value,
          min: p.minValue || 0,
          max: p.maxValue || p.value * 2,
          distribution: p.distributionType,
          description: p.description || '',
          unit: p.unit
        }))
    ];
    
    // Create simulation settings
    const simulationSettings = {
      precision: input.simulationConfig.precision || 'Preview',
      iterations: input.simulationConfig.iterations,
      caseBoundaries: {
        pessimistic: [0, Math.round(input.simulationConfig.scenarioThresholds.pessimistic * 100)],
        realistic: [
          Math.round(input.simulationConfig.scenarioThresholds.pessimistic * 100),
          Math.round(input.simulationConfig.scenarioThresholds.realistic * 100)
        ],
        optimistic: [
          Math.round(input.simulationConfig.scenarioThresholds.realistic * 100),
          100
        ]
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
   * Generate LLM analysis for simulation results
   * In a real implementation, this would call the GROK 3 API
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
    
    // Generate mock LLM analysis
    const mockLlmAnalysis = {
      insights: [
        `Exchange rate fluctuations have the highest impact on overall tariff revenue, with 82% correlation.`,
        `There is a ${((1 - (output.results.scenarios.pessimistic.probability || 0)) * 100).toFixed(0)}% probability that revenues will increase under the simulated conditions.`,
        `CPTPP participation reduces tariff impact by 15-20% compared to MFN rates.`,
        `The expected median ${output.results.summary.mean >= 0 ? 'gain' : 'loss'} is ${Math.abs(output.results.summary.median).toFixed(2)}M USD under current parameters.`
      ],
      recommendations: [
        'Prioritize exchange rate monitoring systems and implement hedging strategies to reduce volatility exposure.',
        'Consider strategic reserves for periods of high market volatility to ensure smooth operations.',
        'Develop contingency plans for high-impact scenarios, particularly focusing on rapid exchange rate shifts.',
        'Explore further CPTPP optimizations to maximize preferential tariff benefits.',
        'Conduct more granular analysis of specific product categories to identify additional optimization opportunities.'
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
      ],
      riskAssessment: {
        text: `The simulation indicates a ${(output.results.scenarios.pessimistic.probability * 100).toFixed(0)}% probability of negative revenue impact, primarily driven by exchange rate volatility. ${output.results.scenarios.pessimistic.probability > 0.3 ? 'Consider immediate hedging strategies to mitigate this substantial risk.' : output.results.scenarios.pessimistic.probability > 0.15 ? 'Moderate risk levels suggest implementing precautionary measures.' : 'Risk levels are acceptable, but continued monitoring is recommended.'}`,
        riskLevel: output.results.scenarios.pessimistic.probability > 0.3 ? 'high' : 
                  output.results.scenarios.pessimistic.probability > 0.15 ? 'medium' : 'low',
        probabilityOfNegativeImpact: output.results.scenarios.pessimistic.probability
      }
    };
    
    // Update simulation output with LLM analysis
    const updatedOutput: SimulationOutput = {
      ...output,
      llmAnalysis: mockLlmAnalysis
    };
    
    // Save updated output
    await monteCarloStorageService.updateSimulationOutput(outputId, updatedOutput);
    
    return updatedOutput;
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
