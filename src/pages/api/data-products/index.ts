import { NextApiRequest, NextApiResponse } from 'next';
import * as fs from 'fs';
import * as path from 'path';

/**
 * API handler for listing available Business Data Cloud data products
 * Simulates the SAP Business Data Cloud API catalog
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Construct the directory path
    const dataProductsDir = path.join(process.cwd(), 'data_products');
    
    // Check if directory exists
    if (!fs.existsSync(dataProductsDir)) {
      return res.status(404).json({ error: 'Data products directory not found' });
    }
    
    // Read the directory
    const files = fs.readdirSync(dataProductsDir)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        // Get basic file stats
        const filePath = path.join(dataProductsDir, file);
        const stats = fs.statSync(filePath);
        
        // Attempt to read the first part of the file to extract metadata
        let metadata = {};
        try {
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(fileContent);
          metadata = data.metadata || {};
        } catch (error) {
          console.error(`Error parsing metadata for ${file}:`, error);
        }
        
        return {
          filename: file,
          path: `/api/data-products/${file}`,
          size: stats.size,
          lastModified: stats.mtime,
          metadata
        };
      });
    
    // Return the list of files
    return res.status(200).json({
      dataProducts: files,
      count: files.length,
      baseUrl: '/api/data-products'
    });
  } catch (error) {
    console.error(`Error listing data products: ${error}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
