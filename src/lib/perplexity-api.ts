// Perplexity AI API integration for search functionality
import perplexityRateLimiter from '@/services/PerplexityRateLimiter';
import { PerplexityRequest, PerplexityResponse, SearchResult, CompanySearchResult, FinancialInsights } from '@/types/perplexity';
// These interfaces have been moved to /src/types/perplexity.ts

const PERPLEXITY_API_KEY = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
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
 * Core function to call Perplexity API with retries and rate limiting
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
  const startTime = Date.now();
  const endpoint = 'chat/completions';
  let tokenUsage = 0;

  // Check if we can make a request based on rate limits
  if (!perplexityRateLimiter.canMakeRequest()) {
    const timeToWait = perplexityRateLimiter.getTimeToWaitMs();
    if (timeToWait > 0) {
      console.warn(`Rate limit reached for Perplexity API. Waiting ${timeToWait}ms before next request.`);
      await new Promise(resolve => setTimeout(resolve, timeToWait));
    }
  }

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
      tokenUsage = data.usage?.total_tokens || 0;

      // Record successful API call in rate limiter
      perplexityRateLimiter.recordRequest({
        endpoint,
        tokens: tokenUsage,
        model: request.model,
        startTime,
        success: true
      });

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
        // Record failed API call
        perplexityRateLimiter.recordRequest({
          endpoint,
          tokens: 0, // We don't know how many tokens were used in failed request
          model: request.model,
          startTime,
          success: false
        });
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
    // Safety check for empty content
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      results.summary = 'No results found for this query.';
      return results;
    }

    // Extract summary (first paragraph)
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
    results.summary = paragraphs[0] || content.substring(0, 300);

    // Extract company mentions using regex (with safer regex that won't cause backtracking issues)
    try {
      // Try to extract company names with contextual validation
      const companyRegex = /\b([A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*){0,4})\b/g;
      const companyMatches = [];
      let match;
      
      // Get all potential company names
      while ((match = companyRegex.exec(content)) !== null) {
        const potentialCompany = match[1].trim();
        // Only consider if it's likely a company (check nearby context for company indicators)
        const context = content.substring(
          Math.max(0, match.index - 50), 
          Math.min(content.length, match.index + potentialCompany.length + 50)
        );
        
        if (/company|corporation|inc|ltd|plc|group|holdings|tech|bank|enterprise|corporation/i.test(context)) {
          companyMatches.push(potentialCompany);
        }
      }
      
      if (companyMatches.length > 0) {
        // Filter out duplicates and very common false positives
        const commonWords = ['The', 'This', 'That', 'These', 'Those', 'It', 'We', 'They', 'He', 'She', 'I', 'You', 'A', 'An'];
        const uniqueCompanies = [...new Set(companyMatches)]
          .filter(company => !commonWords.includes(company));
          
        uniqueCompanies.forEach(company => {
          // Get context for this company
          let context = '';
          try {
            const safeCompany = company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex special chars
            const contextRegex = new RegExp(`[^.]{0,100}${safeCompany}[^.]{0,100}\.`, 'i');
            const contextMatch = content.match(contextRegex);
            context = contextMatch ? contextMatch[0].trim() : '';
          } catch (regexError) {
            console.error('Regex error for company context:', regexError);
            context = 'Context extraction failed';
          }
          
          results.companies.push({
            name: company.trim(),
            context: context,
            confidence: 0.7 // Lower default confidence
          });
        });
      }
    } catch (companyRegexError) {
      console.error('Company regex extraction error:', companyRegexError);
      // Continue with other parsing
    }

    // Extract key insights with safer approach
    try {
      const insights = new Set<string>();
      
      // Extract bullet points with safer regex
      const bulletLines = content.split('\n')
        .filter(line => line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*'));
        
      bulletLines.forEach(line => {
        const cleanLine = line.replace(/^[•\-*]\s+/, '').trim();
        if (cleanLine.length > 10) {
          insights.add(cleanLine);
        }
      });
      
      // Extract numbered points
      const numberedLines = content.split('\n')
        .filter(line => /^\d+\.\s+/.test(line.trim()));
        
      numberedLines.forEach(line => {
        const cleanLine = line.replace(/^\d+\.\s+/, '').trim();
        if (cleanLine.length > 10) {
          insights.add(cleanLine);
        }
      });
      
      // If no bullet points, extract sentences that look like insights
      if (insights.size === 0) {
        const sentences = content.split('.')
          .map(s => s.trim())
          .filter(s => s.length > 20 && s.length < 150);
          
        // Look for sentences with insight indicators
        const insightIndicators = ['important', 'significant', 'key', 'critical', 'major', 'trend', 'growth'];
        sentences.forEach(sentence => {
          if (insightIndicators.some(indicator => sentence.toLowerCase().includes(indicator))) {
            insights.add(sentence);
          }
        });
      }
      
      results.insights = Array.from(insights).slice(0, 5);
    } catch (insightsError) {
      console.error('Insights extraction error:', insightsError);
      results.insights = [];
    }
    
    // Extract source references with safer approach
    try {
      const sources = [];
      // Look for Markdown-style links
      const sourcePattern = /\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g;
      let sourceMatch;
      
      while ((sourceMatch = sourcePattern.exec(content)) !== null) {
        sources.push({
          title: sourceMatch[1].trim(),
          url: sourceMatch[2].trim(),
          date: new Date().toISOString()
        });
      }
      
      // Also look for plain URLs
      const urlPattern = /(https?:\/\/[^\s]+)/g;
      let urlMatch;
      
      while ((urlMatch = urlPattern.exec(content)) !== null) {
        // Don't add if it's already in a Markdown link
        if (!sources.some(s => s.url === urlMatch[1])) {
          sources.push({
            title: 'Reference Source',
            url: urlMatch[1].trim(),
            date: new Date().toISOString()
          });
        }
      }
      
      results.sources = sources;
    } catch (sourcesError) {
      console.error('Sources extraction error:', sourcesError);
      results.sources = [];
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
      try {
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
      } catch (parseError) {
        console.error('Company fallback parse error:', parseError);
      }
    }
    
    return companies;
  } catch (error) {
    console.error('Company search error:', error);
    // Return empty array instead of throwing to avoid breaking the UI
    return [];
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
    
    try {
      // Bullet points
      const bulletLines = content.split('\n')
        .filter(line => line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*'));
        
      bulletLines.forEach(line => {
        const cleanLine = line.replace(/^[•\-*]\s+/, '').trim();
        if (cleanLine.length > 10) {
          insights.add(cleanLine);
        }
      });
      
      // Numbered points
      const numberedLines = content.split('\n')
        .filter(line => /^\d+\.\s+/.test(line.trim()));
        
      numberedLines.forEach(line => {
        const cleanLine = line.replace(/^\d+\.\s+/, '').trim();
        if (cleanLine.length > 10) {
          insights.add(cleanLine);
        }
      });
      
      // Look for header sections and their first sentences
      const headerLines = content.split('\n')
        .filter(line => /^#+\s+/.test(line.trim()));
      
      headerLines.forEach(headerLine => {
        const headerText = headerLine.replace(/^#+\s+/, '').trim();
        if (headerText.length > 5) {
          const headerIndex = content.indexOf(headerLine);
          const nextContent = content.substring(headerIndex + headerLine.length).trim();
          const firstSentence = nextContent.split('.')[0];
          if (firstSentence && firstSentence.length > 10) {
            insights.add(`${headerText}: ${firstSentence.trim()}`);
          }
        }
      });
    } catch (parseError) {
      console.error('Insights parsing error:', parseError);
    }
    
    // If still no insights, extract key sentences
    if (insights.size === 0) {
      try {
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
      } catch (sentenceError) {
        console.error('Sentence parsing error:', sentenceError);
      }
    }
    
    return {
      summary: summary,
      insights: Array.from(insights).slice(0, 8),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Financial insights error:', error);
    // Return basic data structure to avoid breaking UI
    return {
      summary: `Financial insights for "${query}" are not available at the moment.`,
      insights: [],
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get market news using Perplexity AI
 */
export async function getMarketNews(): Promise<any[]> {
  try {
    // Use our proxy endpoint to avoid CORS issues
    const response = await fetch('/api/market-news');
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.articles || !Array.isArray(data.articles)) {
      throw new Error('Invalid news data format');
    }
    
    return data.articles;
  } catch (error) {
    console.error('Error fetching market news:', error);
    // Return empty array instead of throwing to avoid breaking the UI
    return [];
  }
}