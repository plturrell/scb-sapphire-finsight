import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Debug endpoint to check the Perplexity API configuration
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Return the current environment configuration (don't include the full API key)
  const apiKey = process.env.PERPLEXITY_API_KEY || 'not-set';
  const maskedKey = apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 5);
  
  return res.status(200).json({
    apiKeyPrefix: maskedKey,
    apiKeySet: !!process.env.PERPLEXITY_API_KEY,
    envVars: Object.keys(process.env).filter(key => 
      key.includes('PERPLEXITY') || 
      key.includes('API') || 
      key.includes('NEXT')
    ),
    serverTime: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
  });
}
