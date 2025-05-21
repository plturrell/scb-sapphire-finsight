import type { NextApiRequest, NextApiResponse } from 'next';
import perplexityService from '@/services/PerplexityService';

/**
 * Enhanced debug endpoint to check Perplexity API configuration and test connection
 * Updated to use the centralized PerplexityService
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get service information
  const centralizedServiceInfo = {
    apiKeyMasked: perplexityService.getApiKeyInfo(),
    model: 'sonar'
  };
  
  // Test results for different scenarios
  const testResults: Record<string, any> = {
    centralizedServiceTest: 'Not tested',
    serviceInfo: centralizedServiceInfo
  };
  
  // Test with centralized service
  try {
    const messages = [{ role: 'user' as const, content: 'Test message for debugging' }];
    
    console.log('Testing Perplexity API with centralized service...');
    
    // Use our centralized service
    const response = await perplexityService.callPerplexityAPI(messages, {
      temperature: 0.2,
      max_tokens: 10,
      model: centralizedServiceInfo.model
    });
    
    testResults.centralizedServiceTest = {
      success: true,
      response: JSON.stringify(response).substring(0, 200) // Limit response size
    };
  } catch (error: any) {
    testResults.centralizedServiceTest = {
      success: false,
      error: error?.message || 'Unknown error'
    };
  }
  
  // Get environment variables (for reference only)
  const envVars = {
    NODE_ENV: process.env.NODE_ENV || 'Not set',
    VERCEL_ENV: process.env.VERCEL_ENV || 'Not set',
    VERCEL_REGION: process.env.VERCEL_REGION || 'Not set'
  };
  
  // Test with manually provided key if specified in query
  const { testKey } = req.query;
  if (testKey && typeof testKey === 'string') {
    try {
      // Make a basic test request directly to Perplexity API
      const maskedTestKey = testKey.substring(0, 5) + '...' + testKey.substring(testKey.length - 4);
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
      
      testResults.manualKeyTest = {
        keyPrefix: maskedTestKey,
        statusCode,
        statusText,
        success: statusCode === 200,
        responsePreview: responseText.substring(0, 200) // Limit response size
      };
    } catch (error: any) {
      testResults.manualKeyTest = {
        error: error?.message || 'Unknown error'
      };
    }
  }
  
  // Return comprehensive debug info
  return res.status(200).json({
    timestamp: new Date().toISOString(),
    environment: envVars,
    centralizedService: {
      apiKey: centralizedServiceInfo.apiKeyMasked,
      model: centralizedServiceInfo.model
    },
    testResults,
    vercelInfo: {
      environment: process.env.VERCEL_ENV || 'Not set',
      region: process.env.VERCEL_REGION || 'Not set',
      url: process.env.VERCEL_URL || 'Not set'
    }
  });
}
