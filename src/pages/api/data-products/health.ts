import { NextApiRequest, NextApiResponse } from 'next';
import { RedisDataStore } from '../../../services/RedisDataStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const dataStore = new RedisDataStore();

  try {
    const isHealthy = await dataStore.healthCheck();
    
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'error',
      error: 'Failed to check Redis health',
      timestamp: new Date().toISOString()
    });
  } finally {
    await dataStore.close();
  }
}