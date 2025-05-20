import type { NextApiRequest, NextApiResponse } from 'next';

// Simple Perplexity API proxy for debugging
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
  
  if (!PERPLEXITY_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // Get the messages from the request body
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Simple request body with the updated model name
    const requestBody = {
      model: 'sonar',
      messages,
      temperature: 0.2,
      max_tokens: 100
    };

    console.log('Making request to Perplexity API with key prefix:', PERPLEXITY_API_KEY.substring(0, 5));
    
    // Call Perplexity API directly
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    // If not OK, log detailed error
    if (!response.ok) {
      const statusCode = response.status;
      const statusText = response.statusText;
      let errorData = '';
      
      try {
        errorData = await response.text();
      } catch (e) {
        console.error('Error reading error response:', e);
      }
      
      console.error('Perplexity API error:', statusCode, statusText);
      console.error('Error details:', errorData);
      
      return res.status(statusCode).json({ 
        error: `API error: ${statusCode} ${statusText}`,
        details: errorData
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('Error in simplified Perplexity proxy:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}
