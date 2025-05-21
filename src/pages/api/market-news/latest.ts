import type { NextApiRequest, NextApiResponse } from 'next';
import { marketNewsService } from '@/services/jena/MarketNewsService';
import { withApiCache } from '@/services/redis/ApiCacheMiddleware';

/**
 * Latest market news API endpoint
 * 
 * Retrieves the latest market news based on the provided parameters
 * 
 * @param req - The request object
 * @param res - The response object
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Parse query parameters
  const { topic, category, limit, offset } = req.query;
  
  // Parse topic
  const parsedTopic = topic && typeof topic === 'string' ? topic : 'financial markets';
  
  // Parse category
  const parsedCategory = category && typeof category === 'string' ? category : undefined;
  
  // Parse limit and offset
  const parsedLimit = limit ? 
    (Array.isArray(limit) ? parseInt(limit[0], 10) : parseInt(limit, 10)) : 10;
    
  const parsedOffset = offset ? 
    (Array.isArray(offset) ? parseInt(offset[0], 10) : parseInt(offset, 10)) : 0;
  
  try {
    // Get latest news
    const news = await marketNewsService.getLatestNews({
      topic: parsedTopic,
      category: parsedCategory,
      limit: parsedLimit,
      offset: parsedOffset,
    });
    
    // Return news data
    return res.status(200).json({
      success: true,
      articles: news,
      count: news.length,
      query: {
        topic: parsedTopic,
        category: parsedCategory,
        limit: parsedLimit,
        offset: parsedOffset,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting latest news:', error);
    
    return res.status(500).json({
      error: 'Failed to get latest news',
      message: error instanceof Error ? error.message : 'Unknown error',
      success: false,
    });
  }
}

// Apply cache middleware to the handler
export default withApiCache(handler, {
  ttl: 15 * 60, // 15 minutes TTL for news (shorter due to frequent updates)
  type: 'market',
  includeQueryParams: true,
});