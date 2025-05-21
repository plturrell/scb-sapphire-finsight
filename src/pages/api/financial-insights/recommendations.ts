import type { NextApiRequest, NextApiResponse } from 'next';
import { financialInsightsService } from '@/services/jena/FinancialInsightsService';
import { withApiCache } from '@/services/redis/ApiCacheMiddleware';

/**
 * Get financial recommendations API endpoint
 * 
 * Retrieves financial recommendations for a specific topic
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
  const { topic, limit, offset } = req.query;
  
  // Validate topic
  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    return res.status(400).json({
      error: 'Topic is required',
      success: false,
    });
  }
  
  // Parse limit and offset
  const parsedLimit = limit ? 
    (Array.isArray(limit) ? parseInt(limit[0], 10) : parseInt(limit, 10)) : 3;
    
  const parsedOffset = offset ? 
    (Array.isArray(offset) ? parseInt(offset[0], 10) : parseInt(offset, 10)) : 0;
  
  try {
    // Get recommendations by topic
    const recommendations = await financialInsightsService.getRecommendationsByTopic(topic, {
      limit: parsedLimit,
      offset: parsedOffset,
    });
    
    // Return recommendations data
    return res.status(200).json({
      success: true,
      recommendations,
      count: recommendations.length,
      query: {
        topic,
        limit: parsedLimit,
        offset: parsedOffset,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting financial recommendations:', error);
    
    return res.status(500).json({
      error: 'Failed to get financial recommendations',
      message: error instanceof Error ? error.message : 'Unknown error',
      success: false,
    });
  }
}

// Apply cache middleware to the handler
export default withApiCache(handler, {
  ttl: 60 * 60, // 1 hour TTL
  type: 'financial',
  includeQueryParams: true,
});