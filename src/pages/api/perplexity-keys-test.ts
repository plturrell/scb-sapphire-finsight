import type { NextApiRequest, NextApiResponse } from 'next';
import perplexityService from '@/services/PerplexityService';

/**
 * NOTE: This endpoint is now redundant with the centralized PerplexityService implementation.
 * It is kept for historical reference and to validate the working API keys.
 * New code should use the centralized PerplexityService instead of testing multiple keys.
 */

/**
 * Debug endpoint to test all possible Perplexity API keys
 * This will help us identify exactly which key works in the Vercel environment
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // The three keys you mentioned
  const allKeys = [
    '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',
    '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',
    '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'
  ];
  
  // Masked versions of the keys for display
  const maskedKeys = allKeys.map(key => 
    `${key.substring(0, 5)}...${key.substring(key.length - 4)}`
  );
  
  // Get environment variable 
  const envKey = process.env.PERPLEXITY_API_KEY || 'Not set';
  const maskedEnvKey = envKey !== 'Not set' ? 
    `${envKey.substring(0, 5)}...${envKey.substring(envKey.length - 4)}` : 
    'Not set';
  
  // Test results for each key
  const results = {
    environment: process.env.NODE_ENV,
    envKey: maskedEnvKey,
    timestamp: new Date().toISOString(),
    keyResults: {}
  };
  
  // Test each key one by one
  for (let i = 0; i < allKeys.length; i++) {
    const key = allKeys[i];
    const maskedKey = maskedKeys[i];
    
    try {
      const requestBody = {
        model: 'sonar',
        messages: [{ role: 'user', content: `Key test ${i+1}` }],
        temperature: 0.2,
        max_tokens: 10
      };
      
      console.log(`Testing key ${i+1}: ${maskedKey}`);
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      const statusCode = response.status;
      let responseText = '';
      
      try {
        responseText = await response.text();
      } catch (e) {
        responseText = 'Error reading response';
      }
      
      results.keyResults[`key${i+1}`] = {
        maskedKey,
        status: statusCode,
        success: statusCode === 200,
        response: responseText.substring(0, 100) // Limit response size
      };
    } catch (error: any) {
      results.keyResults[`key${i+1}`] = {
        maskedKey,
        status: 'Error',
        success: false,
        error: error?.message || 'Unknown error'
      };
    }
  }
  
  // Check if environment key matches any of the test keys
  let envKeyMatch = 'No match';
  if (envKey !== 'Not set') {
    const matchIndex = allKeys.findIndex(key => key === envKey);
    if (matchIndex !== -1) {
      envKeyMatch = `Matches key${matchIndex + 1}`;
    }
  }
  
  results['envKeyMatch'] = envKeyMatch;
  
  // Return results
  return res.status(200).json(results);
}
