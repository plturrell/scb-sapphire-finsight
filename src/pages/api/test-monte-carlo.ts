import { NextApiRequest, NextApiResponse } from 'next';
import monteCarloService from '@/services/MonteCarloService';

/**
 * Test endpoint for Monte Carlo API integration
 * Verifies that the MonteCarloService and API endpoints are working correctly
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request (preflight)
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method === 'GET') {
      // Test basic service functionality
      try {
        // Test listing simulations
        const simulationsList = await monteCarloService.listSimulations({ limit: 5 });
        
        // Test storage health
        const storageHealth = await monteCarloService.checkStorageHealth();
        
        // Test storage stats
        const storageStats = await monteCarloService.getStorageStats();

        return res.status(200).json({
          status: 'success',
          message: 'Monte Carlo API integration test passed',
          tests: {
            listSimulations: {
              status: 'passed',
              count: simulationsList.inputs?.length || 0
            },
            storageHealth: {
              status: 'passed',
              health: storageHealth
            },
            storageStats: {
              status: 'passed',
              stats: storageStats
            }
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return res.status(500).json({
          status: 'error',
          message: 'Monte Carlo API integration test failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    }

    if (req.method === 'POST') {
      // Test simulation creation with mock data
      const mockConfig = {
        productInfo: {
          hsCode: '1234567890',
          productDescription: 'Test Product',
          section: 'Test Section',
          sectionDescription: 'Test Section Description'
        },
        tariffParameters: [
          {
            id: 'baseTariffRate',
            name: 'Base Tariff Rate',
            value: 0.1,
            min: 0.05,
            max: 0.15,
            distribution: 'Normal' as const,
            description: 'Base tariff rate for the product',
            unit: '%'
          },
          {
            id: 'tradeAgreement',
            name: 'Trade Agreement',
            value: 'CPTPP',
            min: 'CPTPP',
            max: 'MFN',
            distribution: 'Uniform' as const,
            description: 'Applicable trade agreement',
            unit: ''
          }
        ],
        financialParameters: [
          {
            id: 'exchangeRate',
            name: 'Exchange Rate',
            value: 24500,
            min: 24000,
            max: 25000,
            distribution: 'Normal' as const,
            description: 'USD to VND exchange rate',
            unit: 'VND/USD'
          },
          {
            id: 'importVolume',
            name: 'Import Volume',
            value: 1000000,
            min: 500000,
            max: 1500000,
            distribution: 'Normal' as const,
            description: 'Monthly import volume',
            unit: 'USD'
          }
        ],
        simulationSettings: {
          precision: 'Preview' as const,
          iterations: 100,
          caseBoundaries: {
            pessimistic: [0, 20] as [number, number],
            realistic: [20, 80] as [number, number],
            optimistic: [80, 100] as [number, number]
          }
        }
      };

      try {
        // Test simulation creation
        const result = await monteCarloService.createSimulation(mockConfig, 'test_user');
        
        // Test getting the created simulation
        const input = await monteCarloService.getSimulationInput(result.inputId);
        const output = await monteCarloService.getSimulationOutput(result.outputId);

        return res.status(201).json({
          status: 'success',
          message: 'Monte Carlo simulation creation test passed',
          result: {
            inputId: result.inputId,
            outputId: result.outputId,
            inputRetrieved: !!input,
            outputRetrieved: !!output,
            simulationStatus: result.status
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return res.status(500).json({
          status: 'error',
          message: 'Monte Carlo simulation creation test failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Test endpoint error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}