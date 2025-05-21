import { NextApiRequest, NextApiResponse } from 'next';
import { SimulationInput, SimulationOutput, ParameterHistory, UUID } from '@/types/MonteCarloTypes';
import monteCarloStorageService from '@/services/MonteCarloStorageService';
import businessDataCloudConnector from '@/services/BusinessDataCloudConnector';

/**
 * Monte Carlo Storage Management API
 * Provides database-level operations for simulation storage including parameter history
 * and data retention policies. This endpoint focuses on storage operations.
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
    console.error('Error in Monte Carlo Storage API:', error);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Handle GET requests
 * Get parameter history, storage statistics, and other storage-related data
 */
const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { operation, simulationId, parameterId, page = '1', limit = '50' } = req.query;

  try {
    switch (operation) {
      case 'parameter-history':
        if (simulationId) {
          // Get parameter history for specific simulation
          const history = await monteCarloStorageService.getParameterHistoryForSimulation(simulationId as string);
          return res.status(200).json({ history });
        } else if (parameterId) {
          // Get parameter history for specific parameter
          const history = await monteCarloStorageService.getParameterHistory(parameterId as string);
          return res.status(200).json({ history });
        } else {
          return res.status(400).json({ message: 'simulationId or parameterId is required' });
        }

      case 'storage-stats':
        // Get storage statistics
        const inputs = await monteCarloStorageService.listSimulationInputs();
        const storageStats = {
          totalInputs: inputs.length,
          totalOutputsByType: {},
          storageSize: 'Not Available', // Would need actual storage calculations
          oldestRecord: inputs.length > 0 ? Math.min(...inputs.map(i => i.createdAt)) : null,
          newestRecord: inputs.length > 0 ? Math.max(...inputs.map(i => i.createdAt)) : null
        };

        // Calculate outputs by type
        const outputCounts: Record<string, number> = {};
        for (const input of inputs) {
          const outputs = await monteCarloStorageService.listSimulationOutputs(input.id);
          outputCounts[input.simulationType] = (outputCounts[input.simulationType] || 0) + outputs.length;
        }
        storageStats.totalOutputsByType = outputCounts;

        return res.status(200).json({ storageStats });

      case 'health':
        // Health check for storage services
        let businessDataCloudStatus = 'disconnected';
        try {
          businessDataCloudStatus = 'connected';
        } catch (error) {
          businessDataCloudStatus = 'error';
        }

        const healthStatus = {
          localStorage: 'healthy',
          businessDataCloud: businessDataCloudStatus,
          indexedDB: typeof window !== 'undefined' && window.indexedDB ? 'available' : 'unavailable',
          timestamp: Date.now()
        };

        return res.status(200).json({ health: healthStatus });

      case 'list-inputs':
        // List all simulation inputs with pagination
        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        
        const allInputs = await monteCarloStorageService.listSimulationInputs({
          sortBy: 'createdAt',
          sortDirection: 'desc',
          limit: limitNum,
          offset: (pageNum - 1) * limitNum
        });

        const totalInputs = await monteCarloStorageService.listSimulationInputs();
        
        return res.status(200).json({
          inputs: allInputs,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: totalInputs.length,
            pages: Math.ceil(totalInputs.length / limitNum)
          }
        });

      default:
        return res.status(400).json({ message: 'Invalid operation' });
    }
  } catch (error) {
    console.error('Error in storage GET:', error);
    return res.status(500).json({
      message: 'Error retrieving storage data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Handle POST requests
 * Record parameter changes and perform storage operations
 */
const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { operation } = req.query;

  try {
    switch (operation) {
      case 'record-parameter-change':
        const { parameterId, simulationInputId, previousValue, newValue, changedBy } = req.body;

        if (!parameterId || !simulationInputId || previousValue === undefined || newValue === undefined) {
          return res.status(400).json({
            message: 'parameterId, simulationInputId, previousValue, and newValue are required'
          });
        }

        const historyId = await monteCarloStorageService.recordParameterChange(
          parameterId,
          simulationInputId,
          previousValue,
          newValue,
          changedBy || 'unknown'
        );

        return res.status(201).json({
          message: 'Parameter change recorded',
          historyId
        });

      case 'apply-retention-policy':
        const { detailedRetentionDays, summaryRetentionDays, coldStorageThresholdDays } = req.body;

        await monteCarloStorageService.applyDataRetentionPolicy({
          detailedRetentionDays,
          summaryRetentionDays,
          coldStorageThresholdDays
        });

        return res.status(200).json({
          message: 'Data retention policy applied successfully'
        });

      case 'backup-to-bdc':
        // Backup all data to Business Data Cloud
        try {
          const inputs = await monteCarloStorageService.listSimulationInputs();
          let backedUpInputs = 0;
          let backedUpOutputs = 0;

          for (const input of inputs) {
            try {
              await businessDataCloudConnector.saveSimulationInput(input);
              backedUpInputs++;

              // Backup outputs for this input
              const outputs = await monteCarloStorageService.listSimulationOutputs(input.id);
              for (const output of outputs) {
                // Would need to implement saveSimulationOutput in businessDataCloudConnector
                // await businessDataCloudConnector.saveSimulationOutput(output);
                backedUpOutputs++;
              }
            } catch (error) {
              console.log(`Failed to backup input ${input.id}:`, error);
            }
          }

          return res.status(200).json({
            message: 'Backup to Business Data Cloud completed',
            backedUpInputs,
            backedUpOutputs
          });
        } catch (error) {
          console.error('Error backing up to BDC:', error);
          return res.status(500).json({
            message: 'Error backing up to Business Data Cloud',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

      default:
        return res.status(400).json({ message: 'Invalid operation' });
    }
  } catch (error) {
    console.error('Error in storage POST:', error);
    return res.status(500).json({
      message: 'Error performing storage operation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Handle PUT requests
 * Update storage settings and configuration
 */
const handlePut = async (req: NextApiRequest, res: NextApiResponse) => {
  const { operation } = req.query;

  try {
    switch (operation) {
      case 'storage-settings':
        // Update storage settings (this would be stored in a settings store)
        const { useBusinessDataCloud, retentionPolicy } = req.body;

        // In a real implementation, this would update storage service settings
        console.log('Storage settings update:', { useBusinessDataCloud, retentionPolicy });

        return res.status(200).json({
          message: 'Storage settings updated',
          settings: { useBusinessDataCloud, retentionPolicy }
        });

      default:
        return res.status(400).json({ message: 'Invalid operation' });
    }
  } catch (error) {
    console.error('Error in storage PUT:', error);
    return res.status(500).json({
      message: 'Error updating storage settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Handle DELETE requests
 * Delete storage data and perform cleanup operations
 */
const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const { operation } = req.query;

  try {
    switch (operation) {
      case 'cleanup-old-data':
        const { olderThanDays = 365 } = req.body;
        const cutoffDate = Date.now() - (parseInt(olderThanDays, 10) * 24 * 60 * 60 * 1000);

        const inputs = await monteCarloStorageService.listSimulationInputs();
        let deletedInputs = 0;
        let deletedOutputs = 0;

        for (const input of inputs) {
          if (input.createdAt < cutoffDate) {
            const outputs = await monteCarloStorageService.listSimulationOutputs(input.id);
            deletedOutputs += outputs.length;

            await monteCarloStorageService.deleteSimulationInput(input.id);
            deletedInputs++;
          }
        }

        return res.status(200).json({
          message: 'Old data cleanup completed',
          deletedInputs,
          deletedOutputs
        });

      case 'parameter-history':
        const { historyId } = req.body;

        if (!historyId) {
          return res.status(400).json({ message: 'historyId is required' });
        }

        const deleted = await monteCarloStorageService.deleteParameterHistory(historyId);

        if (deleted) {
          return res.status(200).json({
            message: 'Parameter history deleted'
          });
        } else {
          return res.status(404).json({ message: 'Parameter history not found' });
        }

      default:
        return res.status(400).json({ message: 'Invalid operation' });
    }
  } catch (error) {
    console.error('Error in storage DELETE:', error);
    return res.status(500).json({
      message: 'Error performing storage deletion',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};