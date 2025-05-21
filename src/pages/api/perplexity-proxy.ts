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

  const MAX_SERVER_RETRIES = 2;
  const RETRY_TIMEOUT = 500; // ms

  let attempt = 0;
  let lastError: any = null;

  while (attempt <= MAX_SERVER_RETRIES) {
    try {
      // Get the request data
      const {
        messages,
        temperature = 0.2,
        max_tokens = 2000,
        model = 'sonar'
      } = req.body;

      // Log request attempt
      console.log(`Processing Perplexity API request (attempt ${attempt + 1}/${MAX_SERVER_RETRIES + 1}) for model: ${model}, max_tokens: ${max_tokens}`);

      // Validate required parameters
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ 
          error: 'Messages array is required', 
          success: false 
        });
      }

      // Call the Perplexity API through our centralized service
      const response = await perplexityService.callPerplexityAPI(
        messages,
        {
          temperature,
          max_tokens,
          model
        }
      );

      // Return the successful response
      return res.status(200).json({
        ...response,
        success: true
      });
    } catch (error: any) {
      lastError = error;
      console.error(`Perplexity proxy error (attempt ${attempt + 1}/${MAX_SERVER_RETRIES + 1}):`, error.message || error);
      
      // If we have more retries left, wait and try again
      if (attempt < MAX_SERVER_RETRIES) {
        attempt++;
        await new Promise(resolve => setTimeout(resolve, RETRY_TIMEOUT));
      } else {
        // We've exhausted our retries, return the error with a fallback message
        const errorMessage = error.message || 'Unknown error';
        return res.status(500).json({ 
          error: `Failed to call Perplexity API: ${errorMessage}`, 
          success: false,
          fallbackContent: "I'm sorry, but I couldn't retrieve information at this time. Please try again in a moment.",
          timestamp: new Date().toISOString()
        });
      }
    }
  }
  
  // This code should never be reached, but adding as a fallback
  return res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
}
