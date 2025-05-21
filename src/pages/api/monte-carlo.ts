import { NextApiRequest, NextApiResponse } from 'next';
import { SimulationInput, SimulationOutput, UUID, generateUUID, getCurrentTimestamp } from '@/types/MonteCarloTypes';
import monteCarloStorageService from '@/services/MonteCarloStorageService';
import vietnamMonteCarloAdapter from '@/services/VietnamMonteCarloAdapter';
import businessDataCloudConnector from '@/services/BusinessDataCloudConnector';

/**
 * Monte Carlo Simulation API
 * Main endpoint for running Monte Carlo simulations for Vietnam tariff impact analysis
 * This endpoint provides access to the Monte Carlo simulation storage architecture
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
    console.error('Error in Monte Carlo API:', error);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Handle GET requests
 * Get simulation input and output data, with optional filtering and pagination
 */
const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id, type, inputId, createdBy, sortBy, sortDirection, limit, offset } = req.query;

  // Get a specific input or output by ID
  if (id) {
    const inputId = id as string;
    
    try {
      // Try to get simulation input
      const input = await monteCarloStorageService.getSimulationInput(inputId);
      
      if (input) {
        return res.status(200).json({ input });
      }
      
      // If not found as input, try as output
      const output = await monteCarloStorageService.getSimulationOutput(inputId);
      
      if (output) {
        return res.status(200).json({ output });
      }
      
      // Neither input nor output found
      return res.status(404).json({ message: 'Simulation not found' });
    } catch (error) {
      console.error('Error fetching simulation by ID:', error);
      return res.status(500).json({
        message: 'Error fetching simulation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get all outputs for a specific input
  if (inputId) {
    try {
      const outputs = await monteCarloStorageService.listSimulationOutputs(inputId as string);
      return res.status(200).json({ outputs });
    } catch (error) {
      console.error('Error fetching outputs for input:', error);
      return res.status(500).json({
        message: 'Error fetching simulation outputs',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // List all simulation inputs with optional filtering
  try {
    const options = {
      simulationType: type as string | undefined,
      createdBy: createdBy as string | undefined,
      sortBy: sortBy as ('createdAt' | 'name') | undefined,
      sortDirection: sortDirection as ('asc' | 'desc') | undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined
    };

    const inputs = await monteCarloStorageService.listSimulationInputs(options);
    
    return res.status(200).json({
      inputs,
      pagination: {
        limit: options.limit,
        offset: options.offset,
        total: inputs.length // This is the filtered count, not the total count
      }
    });
  } catch (error) {
    console.error('Error listing simulations:', error);
    return res.status(500).json({
      message: 'Error listing simulations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Handle POST requests
 * Create and run a new simulation
 */
const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { config, username = 'scb_analyst' } = req.body;

  if (!config) {
    return res.status(400).json({ message: 'Simulation configuration is required' });
  }

  try {
    // Convert component config to storage model
    const input = vietnamMonteCarloAdapter.convertToStorageModel(config, username);
    
    // Save input to storage service
    await monteCarloStorageService.saveSimulationInput(input);
    
    // Create output (simulation results will be updated later by worker)
    const output = vietnamMonteCarloAdapter.createOutputModel(
      input.id,
      'running',
      0
    );
    
    // Save output to storage service
    await monteCarloStorageService.saveSimulationOutput(output);
    
    // Connect to BDC if available
    try {
      await businessDataCloudConnector.saveSimulationInput(input);
      console.log('Saved simulation to Business Data Cloud');
    } catch (error) {
      console.log('Could not save to Business Data Cloud, using local storage only', error);
    }

    // Return the IDs of the created input and output
    return res.status(201).json({
      message: 'Simulation initiated',
      inputId: input.id,
      outputId: output.id,
      status: 'running'
    });
  } catch (error) {
    console.error('Error creating simulation:', error);
    return res.status(500).json({
      message: 'Error creating simulation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Handle PUT requests
 * Update simulation results or simulation status
 */
const handlePut = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;
  const { results, status, progressPercentage, error } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'Simulation ID is required' });
  }

  // Check if update is for an output
  try {
    const output = await monteCarloStorageService.getSimulationOutput(id as string);
    
    if (output) {
      // Build update object
      const updates: Partial<SimulationOutput> = {};
      
      if (status) updates.status = status;
      if (progressPercentage !== undefined) updates.progressPercentage = progressPercentage;
      if (error) updates.error = error;
      
      // If this is a results update, process them
      if (results && Array.isArray(results)) {
        // Process and store results, this generates statistics, distribution data, etc.
        const updatedOutput = await vietnamMonteCarloAdapter.updateOutputWithResults(
          output.id,
          results
        );
        
        if (!updatedOutput) {
          return res.status(500).json({ message: 'Error processing simulation results' });
        }
        
        // Generate LLM analysis
        await vietnamMonteCarloAdapter.generateLlmAnalysis(output.id);
        
        return res.status(200).json({
          message: 'Simulation results updated',
          outputId: output.id,
          status: 'completed'
        });
      }
      
      // Just a status update
      if (Object.keys(updates).length > 0) {
        const success = await monteCarloStorageService.updateSimulationOutput(output.id, updates);
        
        if (success) {
          return res.status(200).json({
            message: 'Simulation status updated',
            outputId: output.id,
            ...updates
          });
        } else {
          return res.status(500).json({ message: 'Error updating simulation status' });
        }
      }
      
      return res.status(400).json({ message: 'No valid updates provided' });
    }
  } catch (error) {
    console.error('Error updating simulation:', error);
    return res.status(500).json({
      message: 'Error updating simulation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // If not found as output, check if it's an input update
  try {
    const input = await monteCarloStorageService.getSimulationInput(id as string);
    
    if (input) {
      // For now, input updates are not supported through this endpoint
      return res.status(400).json({
        message: 'Simulation input updates are not supported through this endpoint'
      });
    }
  } catch (error) {
    console.error('Error checking for input:', error);
  }

  // Neither input nor output found
  return res.status(404).json({ message: 'Simulation not found' });
};

/**
 * Handle DELETE requests
 * Delete a simulation input and all related outputs
 */
const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: 'Simulation ID is required' });
  }

  try {
    // First try to delete as input (which cascades to outputs)
    const inputDeleted = await monteCarloStorageService.deleteSimulationInput(id as string);
    
    if (inputDeleted) {
      return res.status(200).json({
        message: 'Simulation and related outputs deleted successfully'
      });
    }
    
    // If not found as input, try to delete as output
    const output = await monteCarloStorageService.getSimulationOutput(id as string);
    
    if (output) {
      const outputDeleted = await monteCarloStorageService.deleteSimulationOutput(id as string);
      
      if (outputDeleted) {
        return res.status(200).json({
          message: 'Simulation output deleted successfully'
        });
      } else {
        return res.status(500).json({ message: 'Error deleting simulation output' });
      }
    }
    
    // Neither input nor output found
    return res.status(404).json({ message: 'Simulation not found' });
  } catch (error) {
    console.error('Error deleting simulation:', error);
    return res.status(500).json({
      message: 'Error deleting simulation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};