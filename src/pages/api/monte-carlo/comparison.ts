import { NextApiRequest, NextApiResponse } from 'next';
import { SimulationComparison, DifferenceRecord, UUID, generateUUID, getCurrentTimestamp } from '@/types/MonteCarloTypes';
import monteCarloStorageService from '@/services/MonteCarloStorageService';
import monteCarloComparisonService from '@/services/MonteCarloComparisonService';

/**
 * Monte Carlo Simulation Comparison API
 * Handles comparison of multiple simulations, difference calculations, and comparison analytics
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
      case 'PUT':
        return handlePut(req, res);
      case 'DELETE':
        return handleDelete(req, res);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in Monte Carlo Comparison API:', error);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Handle GET requests
 * Retrieve comparison data and perform comparison analytics
 */
const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { operation, comparisonId, simulationIds } = req.query;

  try {
    switch (operation) {
      case 'comparison':
        if (comparisonId) {
          // Get a specific comparison
          const comparison = await monteCarloStorageService.getSimulationComparison(comparisonId as string);
          
          if (!comparison) {
            return res.status(404).json({ message: 'Comparison not found' });
          }
          
          return res.status(200).json({ comparison });
        } else {
          // List all comparisons
          const comparisons = await monteCarloStorageService.listSimulationComparisons();
          return res.status(200).json({ comparisons });
        }

      case 'quick-compare':
        // Quick comparison between two simulations without saving
        if (!simulationIds || typeof simulationIds !== 'string') {
          return res.status(400).json({ message: 'simulationIds query parameter is required (comma-separated)' });
        }

        const ids = (simulationIds as string).split(',').map(id => id.trim());
        
        if (ids.length < 2) {
          return res.status(400).json({ message: 'At least 2 simulation IDs are required for comparison' });
        }

        // Fetch the simulation inputs and outputs
        const simulations = [];
        for (const id of ids) {
          const input = await monteCarloStorageService.getSimulationInput(id);
          if (!input) {
            return res.status(404).json({ message: `Simulation ${id} not found` });
          }

          const outputs = await monteCarloStorageService.listSimulationOutputs(id);
          const completedOutputs = outputs.filter(o => o.status === 'completed');
          
          if (completedOutputs.length === 0) {
            return res.status(400).json({ message: `Simulation ${id} has no completed outputs` });
          }

          // Take the most recent completed output
          const latestOutput = completedOutputs.sort((a, b) => (b.endTime || 0) - (a.endTime || 0))[0];
          
          simulations.push({ input, output: latestOutput });
        }

        // Perform quick comparison using comparison service
        const quickComparison = await performQuickComparison(simulations);
        
        return res.status(200).json({ quickComparison });

      case 'difference-analysis':
        // Detailed difference analysis between two specific simulations
        if (!simulationIds || typeof simulationIds !== 'string') {
          return res.status(400).json({ message: 'simulationIds query parameter is required (comma-separated)' });
        }

        const comparisonIds = (simulationIds as string).split(',').map(id => id.trim());
        
        if (comparisonIds.length !== 2) {
          return res.status(400).json({ message: 'Exactly 2 simulation IDs are required for difference analysis' });
        }

        const [sim1Id, sim2Id] = comparisonIds;
        
        // Get simulations
        const sim1Input = await monteCarloStorageService.getSimulationInput(sim1Id);
        const sim2Input = await monteCarloStorageService.getSimulationInput(sim2Id);
        
        if (!sim1Input || !sim2Input) {
          return res.status(404).json({ message: 'One or both simulations not found' });
        }

        const sim1Outputs = await monteCarloStorageService.listSimulationOutputs(sim1Id);
        const sim2Outputs = await monteCarloStorageService.listSimulationOutputs(sim2Id);
        
        const sim1CompletedOutputs = sim1Outputs.filter(o => o.status === 'completed');
        const sim2CompletedOutputs = sim2Outputs.filter(o => o.status === 'completed');
        
        if (sim1CompletedOutputs.length === 0 || sim2CompletedOutputs.length === 0) {
          return res.status(400).json({ message: 'Both simulations must have completed outputs' });
        }

        const sim1LatestOutput = sim1CompletedOutputs.sort((a, b) => (b.endTime || 0) - (a.endTime || 0))[0];
        const sim2LatestOutput = sim2CompletedOutputs.sort((a, b) => (b.endTime || 0) - (a.endTime || 0))[0];

        // Perform detailed difference analysis
        const differenceAnalysis = await performDifferenceAnalysis(
          { input: sim1Input, output: sim1LatestOutput },
          { input: sim2Input, output: sim2LatestOutput }
        );

        return res.status(200).json({ differenceAnalysis });

      default:
        return res.status(400).json({ message: 'Invalid operation' });
    }
  } catch (error) {
    console.error('Error in comparison GET:', error);
    return res.status(500).json({
      message: 'Error retrieving comparison data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Handle POST requests
 * Create new comparisons and save comparison results
 */
const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { operation = 'create-comparison' } = req.query;

  try {
    switch (operation) {
      case 'create-comparison':
        const { simulationIds, name, description } = req.body;

        if (!simulationIds || !Array.isArray(simulationIds) || simulationIds.length < 2) {
          return res.status(400).json({ message: 'At least 2 simulation IDs are required' });
        }

        // Validate all simulations exist and have completed outputs
        const simulations = [];
        for (const id of simulationIds) {
          const input = await monteCarloStorageService.getSimulationInput(id);
          if (!input) {
            return res.status(404).json({ message: `Simulation ${id} not found` });
          }

          const outputs = await monteCarloStorageService.listSimulationOutputs(id);
          const completedOutputs = outputs.filter(o => o.status === 'completed');
          
          if (completedOutputs.length === 0) {
            return res.status(400).json({ message: `Simulation ${id} has no completed outputs` });
          }

          const latestOutput = completedOutputs.sort((a, b) => (b.endTime || 0) - (a.endTime || 0))[0];
          simulations.push({ input, output: latestOutput });
        }

        // Create comparison using comparison service
        const comparison = await createFullComparison(simulations, name, description);
        
        // Save comparison
        const comparisonId = await monteCarloStorageService.saveSimulationComparison(comparison);

        return res.status(201).json({
          message: 'Comparison created successfully',
          comparisonId,
          comparison
        });

      case 'batch-compare':
        // Compare multiple simulations in batch
        const { batchSimulationIds, comparisonName } = req.body;

        if (!batchSimulationIds || !Array.isArray(batchSimulationIds)) {
          return res.status(400).json({ message: 'batchSimulationIds array is required' });
        }

        const batchComparisons = [];
        
        // Create pairwise comparisons for all combinations
        for (let i = 0; i < batchSimulationIds.length; i++) {
          for (let j = i + 1; j < batchSimulationIds.length; j++) {
            const id1 = batchSimulationIds[i];
            const id2 = batchSimulationIds[j];
            
            const sim1Input = await monteCarloStorageService.getSimulationInput(id1);
            const sim2Input = await monteCarloStorageService.getSimulationInput(id2);
            
            if (sim1Input && sim2Input) {
              const sim1Outputs = await monteCarloStorageService.listSimulationOutputs(id1);
              const sim2Outputs = await monteCarloStorageService.listSimulationOutputs(id2);
              
              const sim1CompletedOutputs = sim1Outputs.filter(o => o.status === 'completed');
              const sim2CompletedOutputs = sim2Outputs.filter(o => o.status === 'completed');
              
              if (sim1CompletedOutputs.length > 0 && sim2CompletedOutputs.length > 0) {
                const sim1LatestOutput = sim1CompletedOutputs.sort((a, b) => (b.endTime || 0) - (a.endTime || 0))[0];
                const sim2LatestOutput = sim2CompletedOutputs.sort((a, b) => (b.endTime || 0) - (a.endTime || 0))[0];
                
                const pairComparison = await createFullComparison(
                  [{ input: sim1Input, output: sim1LatestOutput }, { input: sim2Input, output: sim2LatestOutput }],
                  `${comparisonName || 'Batch Comparison'} - ${sim1Input.name} vs ${sim2Input.name}`,
                  `Automatic batch comparison between ${sim1Input.name} and ${sim2Input.name}`
                );
                
                const pairComparisonId = await monteCarloStorageService.saveSimulationComparison(pairComparison);
                batchComparisons.push({
                  comparisonId: pairComparisonId,
                  simulations: [id1, id2],
                  names: [sim1Input.name, sim2Input.name]
                });
              }
            }
          }
        }

        return res.status(201).json({
          message: 'Batch comparison completed',
          comparisons: batchComparisons
        });

      default:
        return res.status(400).json({ message: 'Invalid operation' });
    }
  } catch (error) {
    console.error('Error in comparison POST:', error);
    return res.status(500).json({
      message: 'Error creating comparison',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Handle PUT requests
 * Update comparison names, descriptions, or regenerate comparison analysis
 */
const handlePut = async (req: NextApiRequest, res: NextApiResponse) => {
  const { comparisonId } = req.query;
  const { name, description, regenerateAnalysis } = req.body;

  if (!comparisonId) {
    return res.status(400).json({ message: 'comparisonId is required' });
  }

  try {
    const comparison = await monteCarloStorageService.getSimulationComparison(comparisonId as string);
    
    if (!comparison) {
      return res.status(404).json({ message: 'Comparison not found' });
    }

    if (regenerateAnalysis) {
      // Regenerate the comparison analysis
      const simulations = [];
      
      for (const simulationId of comparison.simulationIds) {
        const input = await monteCarloStorageService.getSimulationInput(simulationId);
        if (input) {
          const outputs = await monteCarloStorageService.listSimulationOutputs(simulationId);
          const completedOutputs = outputs.filter(o => o.status === 'completed');
          
          if (completedOutputs.length > 0) {
            const latestOutput = completedOutputs.sort((a, b) => (b.endTime || 0) - (a.endTime || 0))[0];
            simulations.push({ input, output: latestOutput });
          }
        }
      }

      if (simulations.length >= 2) {
        const updatedComparison = await createFullComparison(
          simulations,
          name || comparison.name,
          description || comparison.description
        );
        
        // Keep the original ID and creation timestamp
        updatedComparison.id = comparison.id;
        updatedComparison.createdAt = comparison.createdAt;
        
        await monteCarloStorageService.saveSimulationComparison(updatedComparison);
        
        return res.status(200).json({
          message: 'Comparison analysis regenerated',
          comparison: updatedComparison
        });
      } else {
        return res.status(400).json({ message: 'Not enough completed simulations to regenerate comparison' });
      }
    } else {
      // Just update name and description
      const updatedComparison = {
        ...comparison,
        name: name || comparison.name,
        description: description || comparison.description
      };
      
      await monteCarloStorageService.saveSimulationComparison(updatedComparison);
      
      return res.status(200).json({
        message: 'Comparison updated',
        comparison: updatedComparison
      });
    }
  } catch (error) {
    console.error('Error updating comparison:', error);
    return res.status(500).json({
      message: 'Error updating comparison',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Handle DELETE requests
 * Delete comparisons
 */
const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const { comparisonId } = req.query;

  if (!comparisonId) {
    return res.status(400).json({ message: 'comparisonId is required' });
  }

  try {
    const deleted = await monteCarloStorageService.deleteSimulationComparison(comparisonId as string);
    
    if (deleted) {
      return res.status(200).json({
        message: 'Comparison deleted successfully'
      });
    } else {
      return res.status(404).json({ message: 'Comparison not found' });
    }
  } catch (error) {
    console.error('Error deleting comparison:', error);
    return res.status(500).json({
      message: 'Error deleting comparison',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Perform quick comparison between simulations
 */
const performQuickComparison = async (simulations: Array<{ input: any, output: any }>) => {
  // This is a simplified comparison that returns key metrics
  const results = simulations.map((sim, index) => ({
    id: sim.input.id,
    name: sim.input.name,
    mean: sim.output.results?.summary?.mean || 0,
    median: sim.output.results?.summary?.median || 0,
    standardDeviation: sim.output.results?.summary?.standardDeviation || 0,
    pessimisticProbability: sim.output.results?.scenarios?.pessimistic?.probability || 0,
    optimisticProbability: sim.output.results?.scenarios?.optimistic?.probability || 0
  }));

  // Calculate basic differences
  const comparisions = [];
  for (let i = 0; i < results.length; i++) {
    for (let j = i + 1; j < results.length; j++) {
      const sim1 = results[i];
      const sim2 = results[j];
      
      comparisions.push({
        simulation1: sim1.name,
        simulation2: sim2.name,
        meanDifference: sim1.mean - sim2.mean,
        medianDifference: sim1.median - sim2.median,
        riskDifference: sim1.pessimisticProbability - sim2.pessimisticProbability,
        volatilityDifference: sim1.standardDeviation - sim2.standardDeviation
      });
    }
  }

  return {
    results,
    comparisons: comparisions,
    summary: {
      totalSimulations: simulations.length,
      totalComparisons: comparisions.length
    }
  };
};

/**
 * Perform detailed difference analysis between two simulations
 */
const performDifferenceAnalysis = async (
  sim1: { input: any, output: any },
  sim2: { input: any, output: any }
) => {
  const results1 = sim1.output.results;
  const results2 = sim2.output.results;

  if (!results1 || !results2) {
    throw new Error('Both simulations must have completed results');
  }

  // Parameter differences
  const parameterDifferences = [];
  
  // Compare general parameters
  const params1 = sim1.input.parameters.generalParameters;
  const params2 = sim2.input.parameters.generalParameters;
  
  for (const param1 of params1) {
    const param2 = params2.find(p => p.id === param1.id);
    if (param2 && param1.value !== param2.value) {
      parameterDifferences.push({
        parameter: param1.name,
        simulation1Value: param1.value,
        simulation2Value: param2.value,
        absoluteDifference: Math.abs(param1.value - param2.value),
        percentageDifference: ((param1.value - param2.value) / param2.value) * 100
      });
    }
  }

  // Outcome differences
  const outcomeDifferences = {
    meanDifference: results1.summary.mean - results2.summary.mean,
    medianDifference: results1.summary.median - results2.summary.median,
    standardDeviationDifference: results1.summary.standardDeviation - results2.summary.standardDeviation,
    pessimisticScenarioDifference: results1.scenarios.pessimistic.probability - results2.scenarios.pessimistic.probability,
    realisticScenarioDifference: results1.scenarios.realistic.probability - results2.scenarios.realistic.probability,
    optimisticScenarioDifference: results1.scenarios.optimistic.probability - results2.scenarios.optimistic.probability
  };

  // Sensitivity differences
  const sensitivityDifferences = [];
  
  for (const sens1 of results1.sensitivityAnalysis) {
    const sens2 = results2.sensitivityAnalysis.find(s => s.parameter === sens1.parameter);
    if (sens2) {
      sensitivityDifferences.push({
        parameter: sens1.parameter,
        correlationDifference: sens1.correlation - sens2.correlation,
        impactDifference: sens1.impact - sens2.impact
      });
    }
  }

  return {
    simulation1: {
      id: sim1.input.id,
      name: sim1.input.name
    },
    simulation2: {
      id: sim2.input.id,
      name: sim2.input.name
    },
    parameterDifferences,
    outcomeDifferences,
    sensitivityDifferences,
    summary: {
      significantParameterChanges: parameterDifferences.filter(pd => Math.abs(pd.percentageDifference) > 10).length,
      significantOutcomeChanges: Math.abs(outcomeDifferences.meanDifference) > (results1.summary.standardDeviation * 0.5),
      overallRiskChange: outcomeDifferences.pessimisticScenarioDifference > 0.1 ? 'increased' : 
                         outcomeDifferences.pessimisticScenarioDifference < -0.1 ? 'decreased' : 'stable'
    }
  };
};

/**
 * Create a full comparison with all analysis
 */
const createFullComparison = async (
  simulations: Array<{ input: any, output: any }>,
  name?: string,
  description?: string
): Promise<SimulationComparison> => {
  // Create difference matrix
  const differenceMatrix = [];
  
  // Get all unique parameters
  const allParameters = new Set<string>();
  simulations.forEach(sim => {
    sim.input.parameters.generalParameters.forEach(param => allParameters.add(param.name));
  });

  // Calculate differences for each parameter
  for (const paramName of allParameters) {
    const differences: DifferenceRecord[] = [];
    
    for (let i = 0; i < simulations.length; i++) {
      for (let j = i + 1; j < simulations.length; j++) {
        const sim1 = simulations[i];
        const sim2 = simulations[j];
        
        const param1 = sim1.input.parameters.generalParameters.find(p => p.name === paramName);
        const param2 = sim2.input.parameters.generalParameters.find(p => p.name === paramName);
        
        if (param1 && param2 && param1.value !== param2.value) {
          differences.push({
            sim1Id: sim1.input.id,
            sim2Id: sim2.input.id,
            absoluteDifference: Math.abs(param1.value - param2.value),
            percentageDifference: ((param1.value - param2.value) / param2.value) * 100
          });
        }
      }
    }
    
    if (differences.length > 0) {
      differenceMatrix.push({
        parameter: paramName,
        differences
      });
    }
  }

  // Create outcome comparison
  const meanDifferences: DifferenceRecord[] = [];
  const riskProfileDifferences = [];
  
  for (let i = 0; i < simulations.length; i++) {
    for (let j = i + 1; j < simulations.length; j++) {
      const sim1 = simulations[i];
      const sim2 = simulations[j];
      
      if (sim1.output.results && sim2.output.results) {
        meanDifferences.push({
          sim1Id: sim1.input.id,
          sim2Id: sim2.input.id,
          absoluteDifference: Math.abs(sim1.output.results.summary.mean - sim2.output.results.summary.mean),
          percentageDifference: ((sim1.output.results.summary.mean - sim2.output.results.summary.mean) / sim2.output.results.summary.mean) * 100
        });
        
        riskProfileDifferences.push({
          sim1Id: sim1.input.id,
          sim2Id: sim2.input.id,
          pessimisticDifference: sim1.output.results.scenarios.pessimistic.probability - sim2.output.results.scenarios.pessimistic.probability,
          realisticDifference: sim1.output.results.scenarios.realistic.probability - sim2.output.results.scenarios.realistic.probability,
          optimisticDifference: sim1.output.results.scenarios.optimistic.probability - sim2.output.results.scenarios.optimistic.probability
        });
      }
    }
  }

  return {
    id: generateUUID(),
    name: name || `Comparison of ${simulations.length} simulations`,
    description: description || `Comparison created on ${new Date().toLocaleString()}`,
    createdAt: getCurrentTimestamp(),
    simulationIds: simulations.map(sim => sim.input.id),
    comparisonResults: {
      differenceMatrix,
      outcomeComparison: {
        meanDifferences,
        riskProfileDifferences
      }
    }
  };
};