import type { NextApiRequest, NextApiResponse } from 'next';
import perplexityService from '@/services/PerplexityService';

/**
 * Simple Perplexity API proxy that uses the centralized PerplexityService
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the messages from the request body
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    console.log('Making request to Perplexity API via centralized service');
    
    // Use our centralized service to make the API call
    const response = await perplexityService.callPerplexityAPI(messages, {
      temperature: 0.2,
      max_tokens: 100,
      model: 'sonar'
    });

    // Return the successful response
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error in simple proxy:', error);
    return res.status(500).json({ 
      error: `API error: ${error.message || 'Unknown error'}`,
      timestamp: new Date().toISOString()
    });
  }
}
