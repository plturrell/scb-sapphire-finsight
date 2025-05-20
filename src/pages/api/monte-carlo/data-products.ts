import { NextApiRequest, NextApiResponse } from 'next';
import { dataProductsMonteCarloIntegration } from '../../../services/DataProductsMonteCarloIntegration';
import { UUID } from '../../../types/MonteCarloTypes';
import fs from 'fs';
import path from 'path';

/**
 * Direct API endpoint for Monte Carlo data product integration
 * Provides methods to import/export simulation data from/to data products
 * and run simulations from data product inputs
 * 
 * This is a completely non-mocked implementation that directly reads and writes
 * to the data_products directory containing actual SAP data products.
 * 
 * GET /api/monte-carlo/data-products?action=inputs - Import all simulation inputs from data products
 * GET /api/monte-carlo/data-products?action=outputs - Import all simulation outputs from data products
 * GET /api/monte-carlo/data-products?action=parameter-history - Import all parameter history from data products
 * POST /api/monte-carlo/data-products?action=inputs/export - Export all simulation inputs to data products
 * POST /api/monte-carlo/data-products?action=outputs/export - Export all simulation outputs to data products
 * POST /api/monte-carlo/data-products?action=run&inputId=:inputId - Run a simulation from data product input
 * GET /api/monte-carlo/data-products?action=mapping - Get mapping between data products and simulations
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Parse the dynamic route to determine the action
    const { method, query } = req;
    
    // Extract action from the query
    const action = query.action as string | undefined;
    const inputId = query.inputId as UUID | undefined;
    
    // Check if the data_products directory exists
    const dataProductsDir = path.join(process.cwd(), 'data_products');
    if (!fs.existsSync(dataProductsDir)) {
      return res.status(500).json({
        success: false,
        message: 'Data products directory not found'
      });
    }
    
    // Handle different actions based on method and path
    if (method === 'GET') {
      // Import simulation inputs, outputs, or parameter history
      if (action === 'inputs') {
        const inputs = await dataProductsMonteCarloIntegration.importAllSimulationInputs();
        return res.status(200).json({ 
          success: true, 
          message: `Imported ${inputs.length} simulation inputs from data products`,
          count: inputs.length,
          inputs 
        });
      } else if (action === 'outputs') {
        const outputs = await dataProductsMonteCarloIntegration.importAllSimulationOutputs();
        return res.status(200).json({ 
          success: true, 
          message: `Imported ${outputs.length} simulation outputs from data products`,
          count: outputs.length,
          outputs 
        });
      } else if (action === 'parameter-history') {
        const history = await dataProductsMonteCarloIntegration.importAllParameterHistory();
        return res.status(200).json({ 
          success: true, 
          message: `Imported ${history.length} parameter history records from data products`,
          count: history.length,
          history 
        });
      } else if (action === 'mapping') {
        const mapping = await dataProductsMonteCarloIntegration.getDataProductSimulationMapping();
        return res.status(200).json({ 
          success: true, 
          message: 'Fetched data product simulation mapping',
          mapping 
        });
      } else {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid action. Use "inputs", "outputs", "parameter-history", or "mapping".'
        });
      }
    } else if (method === 'POST') {
      // Export simulation inputs or outputs, or run a simulation
      if (action === 'inputs/export') {
        const success = await dataProductsMonteCarloIntegration.exportAllSimulationInputs();
        return res.status(success ? 200 : 500).json({ 
          success, 
          message: success 
            ? 'Exported all simulation inputs to data products' 
            : 'Failed to export simulation inputs' 
        });
      } else if (action === 'outputs/export') {
        const success = await dataProductsMonteCarloIntegration.exportAllSimulationOutputs();
        return res.status(success ? 200 : 500).json({ 
          success, 
          message: success 
            ? 'Exported all simulation outputs to data products' 
            : 'Failed to export simulation outputs' 
        });
      } else if (action === 'run' && inputId) {
        const output = await dataProductsMonteCarloIntegration.runSimulationFromDataProduct(inputId);
        if (output) {
          return res.status(200).json({ 
            success: true, 
            message: `Successfully ran simulation for input ${inputId}`,
            output 
          });
        } else {
          return res.status(500).json({ 
            success: false, 
            message: `Failed to run simulation for input ${inputId}` 
          });
        }
      } else {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid action. Use "inputs/export", "outputs/export", or "run" with inputId.'
        });
      }
    } else {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: (error as Error).message
    });
  }
}