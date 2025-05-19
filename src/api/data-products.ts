import { NextApiRequest, NextApiResponse } from 'next';
import * as fs from 'fs';
import * as path from 'path';

/**
 * API handler for accessing Business Data Cloud mock data from the data_products directory
 * Simulates the SAP Business Data Cloud API
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { filename } = req.query;
  
  // Security check to prevent directory traversal
  if (!filename || Array.isArray(filename) || filename.includes('..') || !filename.endsWith('.json')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  
  try {
    // Construct the file path
    const dataProductsDir = path.join(process.cwd(), 'data_products');
    const filePath = path.join(dataProductsDir, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Read the file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // Return the data
    return res.status(200).json(data);
  } catch (error) {
    console.error(`Error accessing data product file: ${error}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
