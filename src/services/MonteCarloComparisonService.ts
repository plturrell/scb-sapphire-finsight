import {
  SimulationInput,
  SimulationOutput,
  SimulationComparison,
  SensitivityResult,
  DifferenceRecord,
  UUID,
  generateUUID,
  getCurrentTimestamp
} from '../types/MonteCarloTypes';
import monteCarloStorageService from './MonteCarloStorageService';

/**
 * Monte Carlo Comparison Service
 * Provides functionality to compare multiple simulation results
 * Creates difference matrices and analyzes parameter impact differences
 */
export class MonteCarloComparisonService {
  private static instance: MonteCarloComparisonService;
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): MonteCarloComparisonService {
    if (!MonteCarloComparisonService.instance) {
      MonteCarloComparisonService.instance = new MonteCarloComparisonService();
    }
    return MonteCarloComparisonService.instance;
  }
  
  /**
   * Create a comparison between two or more simulations
   */
  public async createComparison(
    simulationInputIds: UUID[],
    name: string,
    description?: string
  ): Promise<SimulationComparison | null> {
    if (simulationInputIds.length < 2) {
      console.error('At least two simulations are required for comparison');
      return null;
    }
    
    // Fetch simulation inputs and their latest outputs
    const simulations: Array<{
      input: SimulationInput;
      output: SimulationOutput;
    }> = [];
    
    for (const inputId of simulationInputIds) {
      const input = await monteCarloStorageService.getSimulationInput(inputId);
      if (!input) {
        console.error(`Simulation input not found: ${inputId}`);
        return null;
      }
      
      // Get all outputs for this input and find the latest completed one
      const outputs = await monteCarloStorageService.listSimulationOutputs(inputId);
      const completedOutputs = outputs.filter(o => o.status === 'completed');
      
      if (completedOutputs.length === 0) {
        console.error(`No completed outputs found for simulation: ${inputId}`);
        return null;
      }
      
      // Sort by end time descending and take the most recent
      completedOutputs.sort((a, b) => 
        (b.endTime || 0) - (a.endTime || 0)
      );
      
      simulations.push({
        input,
        output: completedOutputs[0]
      });
    }
    
    // Create parameter difference matrix
    const differenceMatrix = this.createParameterDifferenceMatrix(simulations);
    
    // Create outcome comparison
    const outcomeComparison = this.createOutcomeComparison(simulations);
    
    // Create comparison object
    const comparison: SimulationComparison = {
      id: generateUUID(),
      name,
      description,
      createdAt: getCurrentTimestamp(),
      simulationIds: simulationInputIds,
      comparisonResults: {
        differenceMatrix,
        outcomeComparison
      }
    };
    
    // Save comparison to storage
    await monteCarloStorageService.saveSimulationComparison(comparison);
    
    return comparison;
  }
  
  /**
   * Create a parameter difference matrix between simulations
   */
  private createParameterDifferenceMatrix(
    simulations: Array<{
      input: SimulationInput;
      output: SimulationOutput;
    }>
  ): Array<{
    parameter: string;
    differences: DifferenceRecord[];
  }> {
    const differenceMatrix: Array<{
      parameter: string;
      differences: DifferenceRecord[];
    }> = [];
    
    // Process each simulation and extract all unique parameters
    const allParameters: Set<string> = new Set();
    
    // Build a map of parameter values by simulation
    const parameterValuesBySimulation: Map<UUID, Map<string, any>> = new Map();
    
    for (const simulation of simulations) {
      const { input } = simulation;
      const paramValues = new Map<string, any>();
      
      // Process general parameters
      for (const param of input.parameters.generalParameters) {
        allParameters.add(param.name);
        paramValues.set(param.name, param.value);
      }
      
      // Process tariff specific parameters
      const tariffParams = input.parameters.tariffSpecificParameters;
      
      // Handle trade agreements
      if (tariffParams.tradeAgreements.length > 0) {
        allParameters.add('Trade Agreement');
        paramValues.set('Trade Agreement', tariffParams.tradeAgreements.join(', '));
      }
      
      // Handle exchange rates
      for (const rate of tariffParams.exchangeRates) {
        const name = `Exchange Rate (${rate.fromCurrency}/${rate.toCurrency})`;
        allParameters.add(name);
        paramValues.set(name, rate.rate);
      }
      
      parameterValuesBySimulation.set(input.id, paramValues);
    }
    
    // Create differences for each parameter
    for (const paramName of allParameters) {
      const paramDifferences: DifferenceRecord[] = [];
      
      // Compare each pair of simulations
      for (let i = 0; i < simulations.length; i++) {
        for (let j = i + 1; j < simulations.length; j++) {
          const sim1 = simulations[i];
          const sim2 = simulations[j];
          
          const sim1Values = parameterValuesBySimulation.get(sim1.input.id);
          const sim2Values = parameterValuesBySimulation.get(sim2.input.id);
          
          if (!sim1Values || !sim2Values) continue;
          
          const value1 = sim1Values.get(paramName);
          const value2 = sim2Values.get(paramName);
          
          // Skip if values are missing
          if (value1 === undefined || value2 === undefined) continue;
          
          // Calculate differences
          if (typeof value1 === 'number' && typeof value2 === 'number') {
            const absoluteDifference = value2 - value1;
            const percentageDifference = value1 !== 0 
              ? (absoluteDifference / Math.abs(value1)) * 100 
              : value2 !== 0 ? 100 : 0;
            
            paramDifferences.push({
              sim1Id: sim1.input.id,
              sim2Id: sim2.input.id,
              absoluteDifference,
              percentageDifference
            });
          } else {
            // For non-numeric values, just record if they're different
            paramDifferences.push({
              sim1Id: sim1.input.id,
              sim2Id: sim2.input.id,
              absoluteDifference: value1 === value2 ? 0 : 1,
              percentageDifference: value1 === value2 ? 0 : 100
            });
          }
        }
      }
      
      differenceMatrix.push({
        parameter: paramName,
        differences: paramDifferences
      });
    }
    
    return differenceMatrix;
  }
  
  /**
   * Create outcome comparison data
   */
  private createOutcomeComparison(
    simulations: Array<{
      input: SimulationInput;
      output: SimulationOutput;
    }>
  ): {
    meanDifferences: DifferenceRecord[];
    riskProfileDifferences: Array<{
      sim1Id: UUID;
      sim2Id: UUID;
      pessimisticDifference: number;
      realisticDifference: number;
      optimisticDifference: number;
    }>;
  } {
    const meanDifferences: DifferenceRecord[] = [];
    const riskProfileDifferences: Array<{
      sim1Id: UUID;
      sim2Id: UUID;
      pessimisticDifference: number;
      realisticDifference: number;
      optimisticDifference: number;
    }> = [];
    
    // Compare each pair of simulations
    for (let i = 0; i < simulations.length; i++) {
      for (let j = i + 1; j < simulations.length; j++) {
        const sim1 = simulations[i];
        const sim2 = simulations[j];
        
        // Skip if results are missing
        if (!sim1.output.results || !sim2.output.results) continue;
        
        // Calculate mean differences
        const mean1 = sim1.output.results.summary.mean;
        const mean2 = sim2.output.results.summary.mean;
        
        const absoluteDifference = mean2 - mean1;
        const percentageDifference = mean1 !== 0 
          ? (absoluteDifference / Math.abs(mean1)) * 100 
          : mean2 !== 0 ? 100 : 0;
        
        meanDifferences.push({
          sim1Id: sim1.input.id,
          sim2Id: sim2.input.id,
          absoluteDifference,
          percentageDifference
        });
        
        // Calculate risk profile differences
        const pessimistic1 = sim1.output.results.scenarios.pessimistic.probability;
        const realistic1 = sim1.output.results.scenarios.realistic.probability;
        const optimistic1 = sim1.output.results.scenarios.optimistic.probability;
        
        const pessimistic2 = sim2.output.results.scenarios.pessimistic.probability;
        const realistic2 = sim2.output.results.scenarios.realistic.probability;
        const optimistic2 = sim2.output.results.scenarios.optimistic.probability;
        
        riskProfileDifferences.push({
          sim1Id: sim1.input.id,
          sim2Id: sim2.input.id,
          pessimisticDifference: pessimistic2 - pessimistic1,
          realisticDifference: realistic2 - realistic1,
          optimisticDifference: optimistic2 - optimistic1
        });
      }
    }
    
    return {
      meanDifferences,
      riskProfileDifferences
    };
  }
  
  /**
   * Generate LLM analysis for a comparison
   * In a real implementation, this would call the GROK 3 API
   */
  public async generateComparisonAnalysis(
    comparisonId: UUID
  ): Promise<SimulationComparison | null> {
    const comparison = await monteCarloStorageService.getSimulationComparison(comparisonId);
    if (!comparison) {
      console.error(`Comparison not found: ${comparisonId}`);
      return null;
    }
    
    // In a real implementation, this would call the GROK 3 API
    // For now, generate mock analysis
    const mockLlmAnalysis = {
      insights: [
        'Parameter differences significantly impact the simulation outcomes, particularly for exchange rates.',
        'Higher tariff rates in the newer simulation lead to a more polarized outcome distribution.',
        'The pessimistic scenario probability increased by 2.3%, indicating higher risk exposure.',
        'Import volume changes have amplified the effect of exchange rate volatility.'
      ],
      recommendations: [
        'Consider hedging strategies to mitigate the increased exchange rate sensitivity.',
        'Evaluate preferential trade agreements to offset the higher baseline tariff rates.',
        'Develop contingency plans for the increased pessimistic scenario probability.',
        'Monitor import volumes closely as they magnify other risk factors.'
      ],
      riskFactors: [
        {
          factor: 'Increased Exchange Rate Volatility',
          severity: 0.85,
          mitigation: 'Implement currency hedging strategies'
        },
        {
          factor: 'Higher Baseline Tariff Rate',
          severity: 0.72,
          mitigation: 'Optimize sourcing based on trade agreements'
        },
        {
          factor: 'Increased Import Volume',
          severity: 0.61,
          mitigation: 'Diversify suppliers and staging imports'
        }
      ],
      riskAssessment: {
        text: 'The newer simulation scenario shows a higher risk profile with increased probability of unfavorable outcomes. This is primarily driven by the combination of higher tariff rates and increased import volumes.',
        riskLevel: 'medium',
        probabilityOfNegativeImpact: 0.32
      }
    };
    
    // Update comparison with LLM analysis
    const updatedComparison = {
      ...comparison,
      llmAnalysis: mockLlmAnalysis
    };
    
    // Save updated comparison
    await monteCarloStorageService.saveSimulationComparison(updatedComparison);
    
    return updatedComparison;
  }
  
  /**
   * Export comparison data for external use (e.g., Excel export)
   */
  public async exportComparisonData(
    comparisonId: UUID
  ): Promise<Record<string, any>> {
    const comparison = await monteCarloStorageService.getSimulationComparison(comparisonId);
    if (!comparison) {
      throw new Error(`Comparison not found: ${comparisonId}`);
    }
    
    // Fetch simulation inputs to get their names
    const simulationNames: Record<string, string> = {};
    for (const simId of comparison.simulationIds) {
      const sim = await monteCarloStorageService.getSimulationInput(simId);
      if (sim) {
        simulationNames[simId] = sim.name;
      }
    }
    
    // Format parameter differences
    const parameterDifferences = comparison.comparisonResults.differenceMatrix.map(item => {
      const formattedDiffs: Record<string, any> = {
        parameter: item.parameter
      };
      
      item.differences.forEach(diff => {
        const sim1Name = simulationNames[diff.sim1Id] || diff.sim1Id;
        const sim2Name = simulationNames[diff.sim2Id] || diff.sim2Id;
        const key = `${sim1Name} vs ${sim2Name}`;
        
        formattedDiffs[key] = {
          absolute: diff.absoluteDifference,
          percentage: `${diff.percentageDifference.toFixed(2)}%`
        };
      });
      
      return formattedDiffs;
    });
    
    // Format outcome differences
    const meanDifferences = comparison.comparisonResults.outcomeComparison.meanDifferences.map(diff => {
      const sim1Name = simulationNames[diff.sim1Id] || diff.sim1Id;
      const sim2Name = simulationNames[diff.sim2Id] || diff.sim2Id;
      
      return {
        comparison: `${sim1Name} vs ${sim2Name}`,
        absoluteDifference: diff.absoluteDifference,
        percentageDifference: `${diff.percentageDifference.toFixed(2)}%`
      };
    });
    
    const riskProfileDifferences = comparison.comparisonResults.outcomeComparison.riskProfileDifferences.map(diff => {
      const sim1Name = simulationNames[diff.sim1Id] || diff.sim1Id;
      const sim2Name = simulationNames[diff.sim2Id] || diff.sim2Id;
      
      return {
        comparison: `${sim1Name} vs ${sim2Name}`,
        pessimisticDifference: `${(diff.pessimisticDifference * 100).toFixed(2)}%`,
        realisticDifference: `${(diff.realisticDifference * 100).toFixed(2)}%`,
        optimisticDifference: `${(diff.optimisticDifference * 100).toFixed(2)}%`
      };
    });
    
    // Prepare export data
    return {
      comparisonName: comparison.name,
      description: comparison.description || '',
      createdAt: new Date(comparison.createdAt).toISOString(),
      simulations: Object.values(simulationNames),
      parameterDifferences,
      meanDifferences,
      riskProfileDifferences,
      llmAnalysis: comparison.llmAnalysis || {
        insights: [],
        recommendations: [],
        riskFactors: []
      }
    };
  }
}

// Export singleton instance
export const monteCarloComparisonService = MonteCarloComparisonService.getInstance();
export default monteCarloComparisonService;
