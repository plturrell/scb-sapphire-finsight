import type { NextApiRequest, NextApiResponse } from 'next';
import { financialInsightsService } from '@/services/jena/FinancialInsightsService';

/**
 * Refresh financial insights API endpoint
 * 
 * Triggers a refresh of financial insights data for a specific topic
 * 
 * @param req - The request object
 * @param res - The response object
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Get topic from request body
  const { topic } = req.body;
  
  // Validate topic
  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    return res.status(400).json({
      error: 'Topic is required',
      success: false,
    });
  }
  
  try {
    // Refresh financial insights
    const result = await financialInsightsService.refreshFinancialInsights(topic);
    
    // Return result
    return res.status(200).json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error refreshing financial insights:', error);
    
    return res.status(500).json({
      error: 'Failed to refresh financial insights',
      message: error instanceof Error ? error.message : 'Unknown error',
      success: false,
    });
  }
}