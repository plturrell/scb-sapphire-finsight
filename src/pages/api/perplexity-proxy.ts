import type { NextApiRequest, NextApiResponse } from 'next';

// Using the new API key directly on the server side
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || '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';
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

/**
 * API route that serves as a proxy for Perplexity API calls
 * Solves CORS issues by making the request server-side
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
      model = 'sonar-small-chat',
      temperature = 0.2,
      max_tokens = 2000,
      stream = false
    } = req.body;

    // Validate required parameters
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }
    
    // Validate API key
    if (!PERPLEXITY_API_KEY) {
      console.error('Missing Perplexity API key');
      return res.status(500).json({ error: 'Server configuration error: Missing API key' });
    }
    
    // Log the API key format (first 8 chars) for debugging
    console.log(`Using Perplexity API key format: ${PERPLEXITY_API_KEY.substring(0, 8)}...`);
    console.log(`Request model: ${model}, tokens: ${max_tokens}`);
    console.log(`Request body length: ${JSON.stringify(req.body).length} chars`);

    // Call Perplexity API from the server side (no CORS issues here)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    try {
      // Ensure we're matching the exact format from Perplexity documentation
      // Make sure the model name is valid - must use 'sonar' for new API key
      const validModelName = 'sonar';
      
      const payload = {
        model: validModelName,
        messages: messages
      };
      
      // Only add optional parameters if they're provided and needed
      if (temperature !== 0.2) payload['temperature'] = temperature;
      if (max_tokens !== 2000) payload['max_tokens'] = max_tokens;
      if (stream) payload['stream'] = stream;
      
      console.log('Sending API request with payload:', JSON.stringify(payload));
      
      // Use the exact fetch format from documentation
      const options = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      };
      
      console.log('Request options:', {
        ...options,
        headers: {...options.headers, Authorization: 'Bearer <redacted>'}
      });
      
      const response = await fetch(PERPLEXITY_API_URL, options);
      
      clearTimeout(timeoutId);

      // Check if the API call was successful
      if (!response.ok) {
        console.error('Perplexity API error:', response.status, response.statusText);
        
        // Get more detailed error information if available
        try {
          const errorData = await response.text();
          console.error('Perplexity API error details:', errorData);
          console.error('Request headers:', JSON.stringify({
            'Authorization': 'Bearer [REDACTED]',
            'Content-Type': 'application/json'
          }));
          console.error('Request payload:', JSON.stringify(payload));
          
          // Return the actual error status and details
          return res.status(response.status).json({ 
            error: `Perplexity API error: ${response.status} ${response.statusText}`,
            details: errorData
          });
        } catch (e) {
          return res.status(response.status).json({ 
            error: `Perplexity API error: ${response.status} ${response.statusText}` 
          });
        }
      }

      // Handle streaming response if requested
      if (stream) {
        // For streaming responses, we need to pipe the response
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        });
        
        // Pipe the stream through
        response.body?.pipe(res);
        return;
      } else {
        // For non-streaming responses, parse and return the data
        const data = await response.json();
        return res.status(200).json(data);
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return res.status(504).json({ error: 'Request to Perplexity API timed out' });
      }
      throw fetchError; // rethrow to be caught by outer try/catch
    }

  } catch (error) {
    console.error('Error in Perplexity proxy:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}