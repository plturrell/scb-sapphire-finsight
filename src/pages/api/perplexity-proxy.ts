import type { NextApiRequest, NextApiResponse } from 'next';

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
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    // Call Perplexity API from the server side (no CORS issues here)
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens,
        stream
      })
    });

    // Check if the API call was successful
    if (!response.ok) {
      console.error('Perplexity API error:', response.status, response.statusText);
      return res.status(response.status).json({ 
        error: `Perplexity API error: ${response.status} ${response.statusText}` 
      });
    }

    // Parse and return the API response
    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Error in Perplexity proxy:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}