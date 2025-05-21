import { NextApiRequest, NextApiResponse } from 'next';
import { FinancialData } from '@/services/DashboardService';

/**
 * Dashboard API Test Endpoint
 * 
 * This endpoint helps test the dashboard implementation
 * by providing structured test data mimicking the real API response
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Simulate a delay to test loading states
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Return test data in the same structure as the real API
  const testData: FinancialData = {
    assets: {
      totalValue: 2456789,
      previousValue: 2380000,
      targetValue: 2500000,
      percentChange: 3.2,
      breakdown: [
        { id: 1, name: 'Equities', value: 1245600, allocation: 0.51, change: 0.042 },
        { id: 2, name: 'Fixed Income', value: 756400, allocation: 0.31, change: 0.016 },
        { id: 3, name: 'Real Estate', value: 245000, allocation: 0.10, change: -0.023 },
        { id: 4, name: 'Alternatives', value: 196000, allocation: 0.08, change: 0.067 }
      ]
    },
    performance: {
      annualizedReturn: 8.7,
      percentChange: 1.2,
      targetReturn: 7.5,
      previousReturn: 7.6
    },
    risk: {
      riskScore: 64,
      percentChange: -3.1,
      targetScore: 60,
      previousScore: 66,
      monteCarloResults: {
        worstCase: -2.1,
        expected: 6.4,
        bestCase: 11.2,
        simulationCount: 5000
      }
    }
  };
  
  // Return test data
  res.status(200).json({
    success: true,
    data: testData,
    message: 'Dashboard test data retrieved successfully',
    isTestData: true,
    timestamp: new Date().toISOString()
  });
}