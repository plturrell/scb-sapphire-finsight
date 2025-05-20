import { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';

// This should be a server-side environment variable, not exposed to the client
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle OPTIONS requests for CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }
  
  // Add CORS headers for normal requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Set a longer timeout for this endpoint
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=30');
  
  // Get query parameters
  const { topic = 'financial markets', limit = 5 } = req.query;
  
  try {
    // Validate topic parameter
    if (Array.isArray(topic)) {
      return res.status(400).json({ 
        error: 'Topic must be a single string' 
      });
    }
    
    // Validate limit parameter
    const newsLimit = Array.isArray(limit) ? 
      parseInt(limit[0], 10) : 
      typeof limit === 'string' ? 
        parseInt(limit, 10) : 5;
    
    if (isNaN(newsLimit) || newsLimit < 1 || newsLimit > 20) {
      return res.status(400).json({ 
        error: 'Limit must be a number between 1 and 20' 
      });
    }
    
    // Validate API key
    if (!PERPLEXITY_API_KEY) {
      console.error('Missing Perplexity API key in market-news endpoint');
      return res.status(500).json({ 
        error: 'Server configuration error: Missing API key',
        success: false
      });
    }
    
    // Log the API key format (first 8 chars) for debugging
    console.log(`Using Perplexity API key in market-news: ${PERPLEXITY_API_KEY.substring(0, 8)}...`);
    
    // Call Perplexity API to get market news
    const messages = [
      {
        role: 'system',
        content: 'You are a financial news reporter providing concise, accurate summaries of the latest market developments. Focus on factual information and provide a diverse range of important financial news.'
      },
      {
        role: 'user',
        content: `Provide the latest financial market news about ${topic}. Include major market movements, significant events, and relevant information. For each news item, include a concise headline, brief summary, category, and source if available. Provide ${newsLimit} different news items.`
      }
    ];
    
    // Using exact format from Perplexity API documentation
    const payload = {
      model: 'sonar',
      messages: messages
    };
    
    console.log('Sending market news API request with payload:', JSON.stringify(payload));
    
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    // Check if the API call was successful
    if (!response.ok) {
      // Get more detailed error information if available
      try {
        const errorText = await response.text();
        console.error('Perplexity API error in market-news:', response.status, response.statusText);
        console.error('Error details:', errorText);
        console.error('Request headers:', JSON.stringify({
          'Authorization': 'Bearer [REDACTED]',
          'Content-Type': 'application/json'
        }));
        console.error('Request payload:', JSON.stringify(payload));
        
        return res.status(response.status).json({
          success: false,
          error: `Perplexity API error: ${response.status} ${response.statusText}`,
          details: errorText
        });
      } catch (parseError) {
        console.error('Error parsing API error response:', parseError);
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
      }
    }

    // Parse the API response
    const data = await response.json();
    const newsContent = data.choices[0]?.message?.content || '';
    
    // Process the news content to extract news items
    const newsItems = processNewsContent(newsContent);
    
    // Return news items with timestamp
    return res.status(200).json({
      success: true,
      articles: newsItems,
      timestamp: new Date().toISOString(),
      source: 'Perplexity API',
      params: {
        topic,
        limit: newsLimit
      }
    });
  } catch (error) {
    console.error('Error fetching market news:', error);
    
    // Return error message
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString(),
      params: {
        topic,
        limit: typeof limit === 'string' ? parseInt(limit, 10) : 5
      }
    });
  }
}

// Helper function to process news content into structured format
function processNewsContent(content: string): any[] {
  try {
    // Split content into news blocks
    const newsBlocks = content.split(/(?=\#\#|\d+\.\s+|\*\*News Item)/gi)
      .filter(block => block && block.trim().length > 30);
    
    const newsItems: any[] = [];
    
    newsBlocks.forEach((block, index) => {
      // Try to extract headline/title
      const titleMatch = block.match(/(?:\#\#|\d+\.\s+|\*\*)(.*?)(?:\*\*|\n|:)/);
      if (!titleMatch) return;
      
      const title = titleMatch[1].trim();
      
      // Try to extract summary and other details
      let summary = '';
      let category = '';
      let source = '';
      
      const summaryMatch = block.match(/(?:Summary|:)\s*(.*?)(?=\n\n|\n(?=Category:|Source:)|\n\-|\n\*|$)/is);
      if (summaryMatch) {
        summary = summaryMatch[1].trim();
      } else {
        // If no explicit summary, take the first paragraph after the title
        const lines = block.split('\n').filter(line => line.trim().length > 0);
        if (lines.length > 1) {
          summary = lines[1].trim();
        }
      }
      
      const categoryMatch = block.match(/(?:Category|Type):\s*(.*?)(?:\n|$)/i);
      if (categoryMatch) {
        category = categoryMatch[1].trim();
      } else {
        // Try to determine category from content
        const categories = [
          { name: 'Markets', keywords: ['stock', 'index', 'market', 'dow', 'nasdaq', 's&p'] },
          { name: 'Economy', keywords: ['gdp', 'inflation', 'economic', 'unemployment', 'fed'] },
          { name: 'Technology', keywords: ['tech', 'technology', 'software', 'ai', 'digital'] },
          { name: 'Banking', keywords: ['bank', 'financial', 'lending', 'loan', 'credit'] },
          { name: 'Commodities', keywords: ['oil', 'gold', 'commodity', 'gas', 'energy'] },
          { name: 'Asia', keywords: ['vietnam', 'asia', 'asean', 'japan', 'china'] }
        ];
        
        const blockText = block.toLowerCase();
        for (const cat of categories) {
          if (cat.keywords.some(word => blockText.includes(word))) {
            category = cat.name;
            break;
          }
        }
        
        if (!category) {
          category = 'Finance';
        }
      }
      
      const sourceMatch = block.match(/(?:Source|From):\s*(.*?)(?:\n|$)/i);
      if (sourceMatch) {
        source = sourceMatch[1].trim();
      } else {
        // List of common financial news sources
        const sources = ['Bloomberg', 'Reuters', 'CNBC', 'Financial Times', 'Wall Street Journal', 'MarketWatch'];
        // Look for source mentions in the text
        for (const potentialSource of sources) {
          if (block.includes(potentialSource)) {
            source = potentialSource;
            break;
          }
        }
        
        if (!source) {
          source = 'Financial News';
        }
      }
      
      newsItems.push({
        id: `news-${uuidv4()}`,
        title: title,
        summary: summary || title,
        category: category,
        timestamp: new Date(Date.now() - (index * 3600000)).toISOString(),
        source: source,
        url: '#'
      });
    });
    
    // If no structured news found, return empty array
    if (newsItems.length === 0) {
      return [];
    }
    
    return newsItems;
  } catch (error) {
    console.error('Error parsing news content:', error);
    throw new Error('Failed to parse news data');
  }
}

