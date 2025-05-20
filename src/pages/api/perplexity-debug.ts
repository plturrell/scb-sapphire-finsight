import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Enhanced debug endpoint to check Perplexity API configuration and test connection
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get environment variables
  const apiKey = process.env.PERPLEXITY_API_KEY || 'Not set';
  const publicApiKey = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY || 'Not set';
  
  // Mask keys for security
  const maskedApiKey = apiKey !== 'Not set' ? 
    `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}` : 
    'Not set';
    
  const maskedPublicKey = publicApiKey !== 'Not set' ? 
    `${publicApiKey.substring(0, 5)}...${publicApiKey.substring(publicApiKey.length - 4)}` : 
    'Not set';
  
  // Test results for different scenarios
  const testResults = {
    environmentVarTest: 'Not tested',
    hardcodedKnownWorkingKeyTest: 'Not tested',
    manualTest: 'Not tested',
    allHeaders: {}
  };
  
  // 1. Test with environment variable if it exists
  if (apiKey !== 'Not set') {
    try {
      const requestBody = {
        model: 'sonar',
        messages: [{ role: 'user', content: 'Test message for debugging' }],
        temperature: 0.2,
        max_tokens: 10
      };
      
      console.log('Testing Perplexity API with environment variable key...');
      
      // Get full headers for debugging
      const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      testResults.allHeaders = headers;
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });
      
      const statusCode = response.status;
      const statusText = response.statusText;
      
      let responseText = '';
      try {
        responseText = await response.text();
      } catch (e) {
        responseText = 'Error reading response text';
      }
      
      testResults.environmentVarTest = {
        statusCode,
        statusText,
        responseText: responseText.substring(0, 500) // Limit response size
      };
    } catch (error) {
      testResults.environmentVarTest = {
        error: error.message
      };
    }
  }
  
  // 2. Test with the hardcoded key we know works locally
  try {
    const knownWorkingKey = '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';
    
    const requestBody = {
      model: 'sonar',
      messages: [{ role: 'user', content: 'Test with hardcoded key' }],
      temperature: 0.2,
      max_tokens: 10
    };
    
    console.log('Testing Perplexity API with known working key...');
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${knownWorkingKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    const statusCode = response.status;
    const statusText = response.statusText;
    
    let responseText = '';
    try {
      responseText = await response.text();
    } catch (e) {
      responseText = 'Error reading response text';
    }
    
    testResults.hardcodedKnownWorkingKeyTest = {
      statusCode,
      statusText,
      responseText: responseText.substring(0, 500) // Limit response size
    };
  } catch (error) {
    testResults.hardcodedKnownWorkingKeyTest = {
      error: error.message
    };
  }
  
  // 3. Manual test if key is provided in query
  const { testKey } = req.query;
  if (testKey && typeof testKey === 'string') {
    try {
      const requestBody = {
        model: 'sonar',
        messages: [{ role: 'user', content: 'Manual test with provided key' }],
        temperature: 0.2,
        max_tokens: 10
      };
      
      console.log('Testing Perplexity API with manually provided key...');
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      const statusCode = response.status;
      const statusText = response.statusText;
      
      let responseText = '';
      try {
        responseText = await response.text();
      } catch (e) {
        responseText = 'Error reading response text';
      }
      
      testResults.manualTest = {
        statusCode,
        statusText,
        responseText: responseText.substring(0, 500) // Limit response size
      };
    } catch (error) {
      testResults.manualTest = {
        error: error.message
      };
    }
  }
  
  // Return comprehensive debug info
  return res.status(200).json({
    environment: process.env.NODE_ENV,
    perplexityApiKey: maskedApiKey,
    publicPerplexityApiKey: maskedPublicKey,
    timestamp: new Date().toISOString(),
    vercelEnv: process.env.VERCEL_ENV || 'Not set',
    region: process.env.VERCEL_REGION || 'Not set',
    testResults,
    headers: {
      'Authorization': 'Bearer [MASKED]',
      'Content-Type': 'application/json'
    }
  });
}
