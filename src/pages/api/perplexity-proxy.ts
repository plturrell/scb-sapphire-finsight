import type { NextApiRequest, NextApiResponse } from 'next';
import perplexityService from '@/services/PerplexityService';

/**
 * API route that serves as a proxy for Perplexity API calls
 * Uses the centralized PerplexityService for reliability and consistent key management
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle OPTIONS requests for CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Add CORS headers for normal requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  try {
    // Get the request data
    const {
      messages,
      temperature = 0.2,
      max_tokens = 2000,
      model = 'sonar'
    } = req.body;

    // Validate required parameters
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }
    
    console.log(`Processing request for model: ${model}, max_tokens: ${max_tokens}`);
    
    try {
      // Use our centralized service to make the API call
      const response = await perplexityService.callPerplexityAPI(messages, {
        temperature,
        max_tokens,
        model
      });
      
      // Return the successful response
      return res.status(200).json(response);
    } catch (error) {
      console.error('Error calling Perplexity API:', error);
      return res.status(500).json({ 
        error: `Perplexity API error: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error in Perplexity proxy:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}
