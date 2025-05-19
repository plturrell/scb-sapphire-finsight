import { NextApiRequest, NextApiResponse } from 'next';
import { RedisDataStore } from '../../../services/RedisDataStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;
  
  if (!slug || !Array.isArray(slug)) {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  const dataStore = new RedisDataStore();

  try {
    switch (req.method) {
      case 'GET':
        // GET /api/data-products/:namespace/:entityName/:version
        if (slug.length === 3) {
          const [namespace, entityName, version] = slug;
          const product = await dataStore.getDataProduct(namespace, entityName, version);
          
          if (!product) {
            return res.status(404).json({ error: 'Data product not found' });
          }
          
          return res.status(200).json(product);
        }
        
        // GET /api/data-products/associations/:entityName
        if (slug.length === 2 && slug[0] === 'associations') {
          const entityName = slug[1];
          const direction = req.query.direction as 'from' | 'to' || 'from';
          const associations = await dataStore.getAssociations(entityName, direction);
          
          return res.status(200).json({ entityName, direction, associations });
        }
        
        return res.status(400).json({ error: 'Invalid request format' });

      case 'POST':
        // POST /api/data-products/:namespace/:entityName/:version
        if (slug.length === 3) {
          const [namespace, entityName, version] = slug;
          const dataProduct = {
            id: `${namespace}:${entityName}:${version}`,
            namespace,
            entityName,
            version,
            entities: req.body.entities || {},
            associations: req.body.associations || [],
            metadata: req.body.metadata || {}
          };
          
          await dataStore.storeDataProduct(dataProduct);
          return res.status(201).json({ message: 'Data product stored successfully' });
        }
        
        return res.status(400).json({ error: 'Invalid request format' });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error handling data product request:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await dataStore.close();
  }
}