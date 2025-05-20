import type { NextApiRequest, NextApiResponse } from 'next';

// Use environment variable with fallback
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

/**
 * API route specifically for tariff search queries
 * Works with the semantic tariff engine to avoid CORS issues
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
    // Get search parameters
    const { 
      product,
      hsCode,
      sourceCountry,
      destinationCountry 
    } = req.body;

    // Build query text
    let queryText = 'What are the current tariff rates';
    
    if (product) {
      queryText += ` for ${product}`;
    }
    
    if (hsCode) {
      queryText += ` (HS code ${hsCode})`;
    }
    
    if (sourceCountry) {
      queryText += ` from ${sourceCountry}`;
    }
    
    if (destinationCountry) {
      queryText += ` imported to ${destinationCountry}`;
    }
    
    queryText += '? Provide detailed information including rates, effective dates, and any special conditions.';

    // Create system prompt for structured output
    const systemPrompt = `You are a tariff data specialist. When asked about tariff information, provide detailed, structured data in the following JSON format:

[
  {
    "hsCode": "8471.30.00",
    "description": "Detailed product description",
    "sourceCountry": "Country of origin",
    "destinationCountry": "Importing country",
    "rate": 5.0,
    "currency": "USD or percentage",
    "effectiveDate": "2025-01-01",
    "expirationDate": "2026-01-01", (if applicable)
    "exemptions": ["List of exemptions"], (if applicable)
    "specialConditions": ["List of special conditions"], (if applicable)
    "confidence": 0.95 (your confidence in this information from 0 to 1)
  }
]

Multiple entries are possible if there are different categories or conditions. Each entry must contain at minimum the hsCode, description, sourceCountry, destinationCountry, rate, and effectiveDate fields. Be as precise as possible with actual current tariff rates.`;

    // Create messages for API call
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: queryText }
    ];

    // Call Perplexity API from server side
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-medium-chat',
        messages,
        temperature: 0.2,
        max_tokens: 2000,
        stream: false
      })
    });

    // Check if the API call was successful
    if (!response.ok) {
      console.error('Perplexity API error:', response.status, response.statusText);
      return res.status(response.status).json({ 
        error: `Perplexity API error: ${response.status} ${response.statusText}` 
      });
    }

    // Parse the response
    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';

    // Try to extract JSON from the response
    let tariffData;
    try {
      // Look for JSON array
      const jsonMatch = content.match(/\[\s*{[\s\S]*}\s*\]/m);
      
      if (jsonMatch) {
        tariffData = JSON.parse(jsonMatch[0]);
      } else {
        // Try to extract JSON object
        const jsonObjMatch = content.match(/{[\s\S]*}/m);
        
        if (jsonObjMatch) {
          tariffData = JSON.parse(jsonObjMatch[0]);
        }
      }
    } catch (error) {
      console.error('Error extracting JSON from response:', error);
    }

    // Return the extracted data or the full content if extraction failed
    return res.status(200).json({
      query: queryText,
      data: tariffData || content,
      raw: content,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in tariff search:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}