import type { NextApiRequest, NextApiResponse } from 'next';
import { companyService } from '@/services/jena/CompanyService';
import { withApiCache } from '@/services/redis/ApiCacheMiddleware';

/**
 * Get company by ID API endpoint
 * 
 * Retrieves detailed company information based on the provided ID
 * 
 * @param req - The request object
 * @param res - The response object
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Get company ID from query parameters
  const { id } = req.query;
  
  // Validate company ID
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    return res.status(400).json({
      error: 'Company ID is required',
      success: false,
    });
  }
  
  try {
    // Get company by ID
    const company = await companyService.getCompanyById(id);
    
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
    console.error('Error getting company by ID:', error);
    
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