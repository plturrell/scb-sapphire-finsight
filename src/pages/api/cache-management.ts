import { NextApiRequest, NextApiResponse } from 'next';
import { CacheService } from '@/services/redis/CacheService';
import { clearApiCache } from '@/services/redis/ApiCacheMiddleware';

/**
 * Cache Management API Endpoint
 * Provides functionality to monitor and manage the Redis cache
 * 
 * IMPORTANT: This should be protected in production with proper authentication
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check for authentication (should be implemented before production)
  // This is a placeholder - in production, implement proper auth
  const apiKey = req.headers['x-api-key'];
  const isAuthorized = process.env.NODE_ENV === 'development' || 
                      apiKey === process.env.CACHE_MANAGEMENT_API_KEY;
  
  if (!isAuthorized) {
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized access to cache management API' 
    });
  }
  
  // Handle different operations based on request method and query parameters
  try {
    switch (req.method) {
      case 'GET':
        // Get cache statistics
        const stats = await CacheService.getStats();
        return res.status(200).json({
          success: true,
          stats,
          timestamp: new Date().toISOString()
        });
        
      case 'POST':
        // Handle cache management operations
        const { operation, type, path } = req.body;
        
        if (!operation) {
          return res.status(400).json({
            success: false,
            error: 'Missing required parameter: operation'
          });
        }
        
        switch (operation) {
          case 'clear-type':
            // Clear cache for a specific type
            if (!type) {
              return res.status(400).json({
                success: false,
                error: 'Missing required parameter: type'
              });
            }
            
            await CacheService.clearType(type);
            return res.status(200).json({
              success: true,
              message: `Cache cleared for type: ${type}`,
              timestamp: new Date().toISOString()
            });
            
          case 'clear-api':
            // Clear cache for a specific API path
            if (!path) {
              return res.status(400).json({
                success: false,
                error: 'Missing required parameter: path'
              });
            }
            
            await clearApiCache(path);
            return res.status(200).json({
              success: true,
              message: `Cache cleared for API path: ${path}`,
              timestamp: new Date().toISOString()
            });
            
          default:
            return res.status(400).json({
              success: false,
              error: `Unknown operation: ${operation}`
            });
        }
        
      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Error in cache management API:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    });
  }
}