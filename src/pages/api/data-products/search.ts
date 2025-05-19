import { NextApiRequest, NextApiResponse } from 'next';
import { RedisDataStore } from '../../../services/RedisDataStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const dataStore = new RedisDataStore();

  try {
    const { namespace, entityName, version } = req.query;

    // Search based on provided criteria
    const products = await dataStore.searchDataProducts({
      namespace: namespace as string,
      entityName: entityName as string,
      version: version as string,
    });

    res.status(200).json({ products });
  } catch (error) {
    console.error('Error searching data products:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await dataStore.close();
  }
}