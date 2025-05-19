// Perplexity AI API integration for search functionality
interface PerplexityRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface PerplexityResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta?: {
      role?: string;
      content?: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const PERPLEXITY_API_KEY = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY || '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';
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

// API models - see https://docs.perplexity.ai/docs/model-cards
const MODELS = {
  SMALL: 'mistral-7b-instruct',
  MEDIUM: 'mixtral-8x7b-instruct',
  LARGE: 'llama-2-70b-chat',
  DEFAULT: 'sonar-small-chat'
};

// Delay between retries in milliseconds
const RETRY_DELAY = 1000;
const MAX_RETRIES = 2;

/**
 * Core function to call Perplexity API with retries
 */
async function callPerplexityAPI(messages: Array<{role: string, content: string}>, model = MODELS.DEFAULT): Promise<string> {
  const request: PerplexityRequest = {
    model: model,
    messages: messages,
    temperature: 0.2,
    top_p: 0.9,
    max_tokens: 2000,
    stream: false
  };

  let retries = 0;
  let lastError: Error | null = null;

  while (retries <= MAX_RETRIES) {
    try {
      const response = await fetch(PERPLEXITY_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        // Try alternative model if the current one fails
        if (retries < MAX_RETRIES) {
          retries++;
          const fallbackModel = retries === 1 ? MODELS.MEDIUM : MODELS.SMALL;
          console.warn(`Perplexity API error (${response.status}), retrying with model: ${fallbackModel}`);
          request.model = fallbackModel;
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          continue;
        }
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data: PerplexityResponse = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      lastError = error as Error;
      if (retries < MAX_RETRIES) {
        retries++;
        const fallbackModel = retries === 1 ? MODELS.MEDIUM : MODELS.SMALL;
        console.warn(`Perplexity API error, retrying with model: ${fallbackModel}`, error);
        request.model = fallbackModel;
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      } else {
        break;
      }
    }
  }

  throw lastError || new Error('Failed to get response from Perplexity API');
}

/**
 * Search using Perplexity AI
 */
export async function searchWithPerplexity(query: string): Promise<any> {
  try {
    const messages = [
      {
        role: 'system',
        content: 'You are a financial search assistant helping users find information about companies, financial data, and market insights. Focus on providing relevant, accurate, and up-to-date information with structured data.'
      },
      {
        role: 'user',
        content: query
      }
    ];

    const content = await callPerplexityAPI(messages);
    return parseSearchResults(content, query);
  } catch (error) {
    console.error('Perplexity search error:', error);
    throw error;
  }
}

/**
 * Parse the content to extract structured data
 */
function parseSearchResults(content: string, query: string): any {
  const results = {
    query: query,
    summary: '',
    companies: [] as any[],
    insights: [] as string[],
    sources: [] as any[],
    timestamp: new Date().toISOString()
  };

  try {
    // Extract summary (first paragraph)
    const paragraphs = content.split('\n\n');
    results.summary = paragraphs[0] || content.substring(0, 300);

    // Extract company mentions using regex
    const companyRegex = /\b([A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*)\b(?=.*\b(?:company|corporation|inc|ltd|plc|group|holdings)\b)/gi;
    const companyMatches = content.match(companyRegex);
    
    if (companyMatches) {
      const uniqueCompanies = [...new Set(companyMatches)];
      uniqueCompanies.forEach(company => {
        const contextRegex = new RegExp(`[^.]*${company}[^.]*\\.`, 'i');
        const contextMatch = content.match(contextRegex);
        const context = contextMatch ? contextMatch[0].trim() : '';
        
        results.companies.push({
          name: company.trim(),
          context: context,
          confidence: 0.9
        });
      });
    }

    // Extract key insights (bullet points or numbered lists)
    const bulletPattern = /^[\•\-\*]\s+(.+)$/gm;
    const numberedPattern = /^\d+\.\s+(.+)$/gm;
    
    let matches;
    const insights = new Set<string>();
    
    while ((matches = bulletPattern.exec(content)) !== null) {
      insights.add(matches[1].trim());
    }
    while ((matches = numberedPattern.exec(content)) !== null) {
      insights.add(matches[1].trim());
    }
    
    // If no bullet points, extract sentences that look like insights
    if (insights.size === 0) {
      const sentences = content.split('.');
      sentences.forEach(sentence => {
        const trimmed = sentence.trim();
        if (trimmed.length > 20 && trimmed.length < 150 && 
            !trimmed.startsWith('However') && !trimmed.startsWith('Therefore')) {
          insights.add(trimmed);
        }
      });
    }
    
    results.insights = Array.from(insights).slice(0, 5);
    
    // Extract source references
    const sourcePattern = /\[(.*?)\]\((https?:\/\/.*?)\)/g;
    while ((matches = sourcePattern.exec(content)) !== null) {
      results.sources.push({
        title: matches[1],
        url: matches[2],
        date: new Date().toISOString()
      });
    }

    return results;
  } catch (parseError) {
    console.error('Error parsing search results:', parseError);
    // Even if parsing fails, return the original content as a summary
    return {
      query: query,
      summary: content.substring(0, 300),
      insights: [],
      companies: [],
      sources: [],
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Search for companies using Perplexity AI
 */
export async function searchCompanies(query: string): Promise<any[]> {
  try {
    const searchPrompt = `Search for companies matching "${query}". 
      Provide detailed information for each company found:
      - Company full name
      - Stock ticker symbol if publicly traded
      - Primary industry/sector
      - Country of headquarters
      - Brief description of business
      - Key financial metrics if available
      - Market position

      Format your answer as structured data with clear sections for each company.
      Include at least 2-3 relevant companies if possible.`;

    const messages = [
      {
        role: 'system',
        content: 'You are a corporate research assistant specialized in finding accurate company information from reliable sources. Return detailed, structured information.'
      },
      {
        role: 'user',
        content: searchPrompt
      }
    ];

    const content = await callPerplexityAPI(messages, MODELS.MEDIUM);
    
    // Extract companies with a combination of regex and text parsing
    const companies: any[] = [];
    
    // Look for company sections in the response
    const companyBlocks = content.split(/(?=\#\#|\*\*|Company:)/gi);
    
    companyBlocks.forEach((block, index) => {
      if (block.trim().length < 20) return; // Skip short blocks
      
      const nameMatch = block.match(/(?:\#\#|\*\*|Company:)\s*(.*?)(?:\*\*|\n|$)/i);
      if (!nameMatch) return;
      
      const companyName = nameMatch[1].trim();
      
      // Extract various company attributes
      const tickerMatch = block.match(/(?:Ticker|Symbol):\s*([A-Z.:\-]+)/i);
      const industryMatch = block.match(/(?:Industry|Sector):\s*(.*?)(?:\n|$)/i);
      const countryMatch = block.match(/(?:Country|Headquarters|Location):\s*(.*?)(?:\n|$)/i);
      const descriptionMatch = block.match(/(?:Description|Overview|About):\s*(.*?)(?:\n\n|\n(?=\w+:)|\n\-|\n\*|$)/is);
      
      companies.push({
        companyId: `perplexity-${Date.now()}-${index}`,
        companyCode: tickerMatch ? tickerMatch[1].trim() : `COMP${index}`,
        companyName: companyName,
        ticker: tickerMatch ? tickerMatch[1].trim() : undefined,
        industry: industryMatch ? industryMatch[1].trim() : 'Finance',
        country: countryMatch ? countryMatch[1].trim() : 'Unknown',
        listingStatus: tickerMatch ? 'Listed' : 'Private',
        matchScore: 0.95 - (index * 0.05), // First results have higher confidence
        dataAvailable: {
          profile: true,
          financials: !!tickerMatch,
          filings: !!tickerMatch,
          tariffData: false
        },
        description: descriptionMatch ? descriptionMatch[1].trim() : block.substring(block.indexOf('\n'), 150).trim()
      });
    });
    
    // If no structured companies found but we have text, try a simpler approach
    if (companies.length === 0 && content.length > 0) {
      const companyNameRegex = /\b([A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*)\b(?=.*\b(?:company|corporation|inc|ltd|plc)\b)/gi;
      const companyMatches = content.match(companyNameRegex);
      
      if (companyMatches) {
        companyMatches.forEach((company, index) => {
          companies.push({
            companyId: `perplexity-${Date.now()}-${index}`,
            companyCode: `COMP${index}`,
            companyName: company.trim(),
            industry: 'Finance',
            country: 'Unknown',
            listingStatus: 'Unknown',
            matchScore: 0.8 - (index * 0.05),
            dataAvailable: {
              profile: true,
              financials: false,
              filings: false,
              tariffData: false
            },
            description: content.substring(0, 150).trim()
          });
        });
      }
    }
    
    return companies;
  } catch (error) {
    console.error('Company search error:', error);
    throw error;
  }
}

/**
 * Get financial insights using Perplexity AI
 */
export async function getFinancialInsights(query: string): Promise<any> {
  try {
    const insightPrompt = `Provide comprehensive financial insights for: "${query}".
      Include:
      - Current market analysis and trends
      - Key financial metrics and performance indicators
      - Macro and microeconomic factors affecting this topic
      - Risk assessment and factors to consider
      - Forward-looking projections and considerations
      
      Format your response with clear sections, using bullet points for key insights.
      Include specific data points and factual information where available.`;

    const messages = [
      {
        role: 'system',
        content: 'You are a senior financial analyst providing expert insights on markets, companies, and economic trends. Provide fact-based, concise analysis with supporting data when available.'
      },
      {
        role: 'user',
        content: insightPrompt
      }
    ];

    const content = await callPerplexityAPI(messages, MODELS.SMALL);
    
    // Extract insights with advanced parsing
    const summary = content.split('\n\n')[0] || content.substring(0, 300);
    
    // Extract insights from bullet points, numbered lists, and key sentences
    const insights = new Set<string>();
    
    // Bullet points
    const bulletPattern = /^[\•\-\*]\s+(.+)$/gm;
    const numberedPattern = /^\d+\.\s+(.+)$/gm;
    let matches;
    
    while ((matches = bulletPattern.exec(content)) !== null) {
      insights.add(matches[1].trim());
    }
    
    while ((matches = numberedPattern.exec(content)) !== null) {
      insights.add(matches[1].trim());
    }
    
    // Look for header sections and their first sentences
    const headerPattern = /^#+\s+(.+)\n+(.+?)(?=\n)/gm;
    while ((matches = headerPattern.exec(content)) !== null) {
      insights.add(`${matches[1]}: ${matches[2].trim()}`);
    }
    
    // If still no insights, extract key sentences
    if (insights.size === 0) {
      const sentences = content.split(/(?<=\.)\s+/g);
      const keyPhrases = [
        'important', 'significant', 'key', 'critical', 'major',
        'trend', 'growth', 'decline', 'increase', 'decrease',
        'market', 'economy', 'financial', 'investment', 'risk'
      ];
      
      sentences.forEach(sentence => {
        if (sentence.length > 20 && sentence.length < 150 &&
            keyPhrases.some(phrase => sentence.toLowerCase().includes(phrase))) {
          insights.add(sentence.trim());
        }
      });
    }
    
    return {
      summary: summary,
      insights: Array.from(insights).slice(0, 8),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Financial insights error:', error);
    throw error;
  }
}

/**
 * Get market news using Perplexity AI
 */
export async function getMarketNews(): Promise<any[]> {
  try {
    const prompt = `Provide the latest financial market news from today.
      Include:
      - Major market movements in stocks, bonds, commodities, cryptocurrencies
      - Important economic indicators or data releases
      - Central bank decisions or announcements
      - Significant company earnings or corporate events
      - Geopolitical events affecting markets
      
      For each news item, include:
      - Concise headline/title
      - Brief summary (1-2 sentences)
      - Category (Markets, Economy, Companies, etc.)
      - Source if available
      
      Format as structured data with clear sections for each news item.
      Provide at least 5-8 different news items covering various financial topics.`;

    const messages = [
      {
        role: 'system',
        content: 'You are a financial news reporter providing concise, accurate summaries of the latest market developments. Focus on factual information and provide a diverse range of important financial news.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const content = await callPerplexityAPI(messages, MODELS.SMALL);
    
    // Parse the news content into separate news items
    const newsItems: any[] = [];
    
    // Try to find structured news blocks
    const newsBlocks = content.split(/(?=\#\#|\d+\.\s+|\*\*News Item)/gi);
    
    newsBlocks.forEach((block, index) => {
      if (block.trim().length < 30) return; // Skip short blocks
      
      // Try to extract headline/title
      const titleMatch = block.match(/(?:\#\#|\d+\.\s+|\*\*)(.*?)(?:\*\*|\n|:)/);
      if (!titleMatch) return;
      
      const title = titleMatch[1].trim();
      
      // Try to extract summary, category and source
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
          { name: 'Crypto', keywords: ['crypto', 'bitcoin', 'blockchain', 'token', 'eth'] }
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
        id: `news-${index}`,
        title: title,
        summary: summary || title, // Use title as summary if no summary found
        category: category,
        timestamp: new Date(Date.now() - (index * 3600000)).toISOString(), // Stagger timestamps
        source: source,
        url: '#'
      });
    });
    
    // If no structured news found, try a simpler approach
    if (newsItems.length === 0) {
      // Split content by paragraphs and treat each as a news item
      const paragraphs = content.split('\n\n').filter(p => p.trim().length > 30);
      
      paragraphs.forEach((paragraph, index) => {
        const lines = paragraph.split('\n');
        const title = lines[0] || 'Market Update';
        const summary = lines.slice(1).join(' ') || paragraph;
        
        newsItems.push({
          id: `news-${index}`,
          title: title,
          summary: summary,
          category: 'Finance',
          timestamp: new Date(Date.now() - (index * 3600000)).toISOString(),
          source: 'Financial News',
          url: '#'
        });
      });
    }
    
    return newsItems;
  } catch (error) {
    console.error('Error fetching market news:', error);
    throw error;
  }
}