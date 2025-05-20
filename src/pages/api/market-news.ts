import { NextApiRequest, NextApiResponse } from 'next';
import { NewsItem } from '../../types';
import perplexityApiClient from '../../services/PerplexityApiClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    
    // Fetch news from Perplexity API
    const newsItems = await perplexityApiClient.getMarketNews({
      topic: topic,
      limit: newsLimit
    });
    
    // Use the results from API
    const results = newsItems.map(item => ({
      id: item.id || `news-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: item.title,
      source: item.url || '',
      sourceName: item.source,
      isPremium: item.isPremium || false,
      publishDate: new Date(item.publishDate || new Date())
    }));
    
    // Return news items with timestamp
    return res.status(200).json({
      success: true,
      data: results,
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