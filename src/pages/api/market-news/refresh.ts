import type { NextApiRequest, NextApiResponse } from 'next';
import { marketNewsService } from '@/services/jena/MarketNewsService';

/**
 * Refresh market news API endpoint
 * 
 * Triggers a refresh of market news data for a specific topic
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
  
  // Use default topic if not provided
  const parsedTopic = topic && typeof topic === 'string' ? topic : 'financial markets';
  
  try {
    // Refresh market news
    const result = await marketNewsService.refreshMarketNews(parsedTopic);
    
    // Return result
    return res.status(200).json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error refreshing market news:', error);
    
    return res.status(500).json({
      error: 'Failed to refresh market news',
      message: error instanceof Error ? error.message : 'Unknown error',
      success: false,
    });
  }
}