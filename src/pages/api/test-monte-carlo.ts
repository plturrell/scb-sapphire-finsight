import { NextApiRequest, NextApiResponse } from 'next';
import { dataProductsMonteCarloIntegration } from '../../services/DataProductsMonteCarloIntegration';

/**
 * Simple test API endpoint for Monte Carlo data product integration
 * This endpoint allows testing the integration without routing complexities
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const result = {
      message: 'Monte Carlo Test API is working',
      timestamp: new Date().toISOString(),
      testResults: {} as any
    };
    
    // Test importing simulation inputs
    try {
      const inputs = await dataProductsMonteCarloIntegration.importAllSimulationInputs();
      result.testResults.importInputs = {
        success: true,
        message: `Imported ${inputs.length} simulation inputs`,
        count: inputs.length,
        sample: inputs.length > 0 ? inputs[0] : null
      };
    } catch (error) {
      result.testResults.importInputs = {
        success: false,
        message: `Error importing inputs: ${(error as Error).message}`
      };
    }
    
    // Test importing simulation outputs
    try {
      const outputs = await dataProductsMonteCarloIntegration.importAllSimulationOutputs();
      result.testResults.importOutputs = {
        success: true,
        message: `Imported ${outputs.length} simulation outputs`,
        count: outputs.length,
        sample: outputs.length > 0 ? outputs[0] : null
      };
    } catch (error) {
      result.testResults.importOutputs = {
        success: false,
        message: `Error importing outputs: ${(error as Error).message}`
      };
    }
    
    // Test getting mapping
    try {
      const mapping = await dataProductsMonteCarloIntegration.getDataProductSimulationMapping();
      result.testResults.getMapping = {
        success: true,
        message: 'Retrieved mapping successfully',
        mapping
      };
    } catch (error) {
      result.testResults.getMapping = {
        success: false,
        message: `Error getting mapping: ${(error as Error).message}`
      };
    }
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Test API error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: (error as Error).message
    });
  }
}