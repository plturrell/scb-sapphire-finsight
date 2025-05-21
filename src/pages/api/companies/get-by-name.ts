import type { NextApiRequest, NextApiResponse } from 'next';
import { companyService } from '@/services/jena/CompanyService';
import { withApiCache } from '@/services/redis/ApiCacheMiddleware';

/**
 * Get company by name API endpoint
 * 
 * Retrieves detailed company information based on the provided name
 * 
 * @param req - The request object
 * @param res - The response object
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Get company name from query parameters
  const { name } = req.query;
  
  // Validate company name
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      error: 'Company name is required',
      success: false,
    });
  }
  
  try {
    // Get company by name
    const company = await companyService.getCompanyByName(name);
    
    // If company not found
    if (!company) {
      return res.status(404).json({
        error: 'Company not found',
        success: false,
      });
    }
    
    // Return company data
    return res.status(200).json({
      success: true,
      company,
    });
  } catch (error) {
    console.error('Error getting company by name:', error);
    
    return res.status(500).json({
      error: 'Failed to get company',
      message: error instanceof Error ? error.message : 'Unknown error',
      success: false,
    });
  }
}

// Apply cache middleware to the handler
export default withApiCache(handler, {
  ttl: 60 * 60, // 1 hour TTL
  type: 'default',
  includeQueryParams: true,
});