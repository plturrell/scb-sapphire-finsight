import { promises as fs } from 'fs';
import path from 'path';
import { RedisDataStore, DataProduct } from '../services/RedisDataStore';

const DATA_PRODUCTS_DIR = path.join(process.cwd(), 'data_products');

interface RawDataProduct {
  namespace: string;
  version: string;
  entities: Record<string, any>;
}

async function loadDataProducts() {
  const dataStore = new RedisDataStore();
  
  try {
    // Check Redis connection
    const isHealthy = await dataStore.healthCheck();
    if (!isHealthy) {
      throw new Error('Redis connection failed');
    }
    
    console.log('Connected to Redis successfully');
    
    // Clear existing data if needed
    await dataStore.clear();
    console.log('Cleared existing data');
    
    // Read all JSON files from data_products directory
    const files = await fs.readdir(DATA_PRODUCTS_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    console.log(`Found ${jsonFiles.length} data product files`);
    
    // Load associations
    const associations: Array<{ from: string; to: string }> = [];
    
    // Process each file
    for (const file of jsonFiles) {
      if (file === 'association_summary.json') {
        // Handle associations file separately
        const associationPath = path.join(DATA_PRODUCTS_DIR, file);
        const associationData = await fs.readFile(associationPath, 'utf-8');
        const parsed = JSON.parse(associationData);
        
        if (parsed.valid_references) {
          associations.push(...parsed.valid_references);
        }
        continue;
      }
      
      const filePath = path.join(DATA_PRODUCTS_DIR, file);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const rawData: RawDataProduct = JSON.parse(fileContent);
      
      // Extract entity name from filename
      const entityNameMatch = file.match(/(.+?)_v\d+\.(.+?)\.json/);
      if (!entityNameMatch) {
        console.warn(`Skipping file with invalid name format: ${file}`);
        continue;
      }
      
      const entityName = entityNameMatch[2];
      
      // Create DataProduct object
      const dataProduct: DataProduct = {
        id: `${rawData.namespace}:${entityName}:${rawData.version}`,
        namespace: rawData.namespace,
        version: rawData.version,
        entityName: entityName,
        entities: rawData.entities,
        associations: associations.filter(a => 
          a.from.includes(entityName) || a.to.includes(entityName)
        ),
        metadata: {
          sourceFile: file,
          loadedAt: new Date().toISOString()
        }
      };
      
      // Store in Redis
      await dataStore.storeDataProduct(dataProduct);
      console.log(`Loaded: ${dataProduct.entityName} (${dataProduct.namespace} v${dataProduct.version})`);
    }
    
    // Store all associations
    for (const association of associations) {
      const assocProduct: DataProduct = {
        id: `association:${association.from}:${association.to}`,
        namespace: 'associations',
        version: '1.0.0',
        entityName: 'Association',
        entities: { association },
        associations: [association],
        metadata: {
          sourceFile: 'association_summary.json',
          loadedAt: new Date().toISOString()
        }
      };
      
      await dataStore.storeDataProduct(assocProduct);
    }
    
    console.log(`Loaded ${associations.length} associations`);
    console.log('Data loading completed successfully');
    
  } catch (error) {
    console.error('Error loading data products:', error);
    process.exit(1);
  } finally {
    await dataStore.close();
  }
}

// Run the loader
if (require.main === module) {
  loadDataProducts();
}

export { loadDataProducts };