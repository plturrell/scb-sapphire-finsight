import type { NextApiRequest, NextApiResponse } from 'next';
import { marketNewsService } from '@/services/jena/MarketNewsService';
import { withApiCache } from '@/services/redis/ApiCacheMiddleware';

/**
 * Market news analysis API endpoint
 * 
 * Retrieves sentiment analysis for market news on a specific topic
 * 
 * @param req - The request object
 * @param res - The response object
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Get topic from query parameters
  const { topic } = req.query;
  
  // Validate topic
  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    return res.status(400).json({
      error: 'Topic is required',
      success: false,
    });
  }
  
  try {
    // Get news analysis
    const analysis = await marketNewsService.getNewsAnalysis(topic);
    
    // If analysis not found
    if (!analysis) {
      return res.status(404).json({
        error: 'News analysis not found',
        success: false,
      });
    }
    
    // Return analysis data
    return res.status(200).json({
      success: true,
      analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting news analysis:', error);
    
    return res.status(500).json({
      error: 'Failed to get news analysis',
      message: error instanceof Error ? error.message : 'Unknown error',
      success: false,
    });
  }
}

// Apply cache middleware to the handler
export default withApiCache(handler, {
  ttl: 30 * 60, // 30 minutes TTL
  type: 'market',
  includeQueryParams: true,
});