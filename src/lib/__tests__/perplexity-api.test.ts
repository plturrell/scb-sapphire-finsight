import { searchWithPerplexity, searchCompanies, getFinancialInsights, getMarketNews } from '../perplexity-api';
import perplexityRateLimiter from '@/services/PerplexityRateLimiter';

// Mock fetch
global.fetch = jest.fn();

// Mock perplexityRateLimiter
jest.mock('@/services/PerplexityRateLimiter', () => ({
  canMakeRequest: jest.fn(),
  getTimeToWaitMs: jest.fn(),
  recordRequest: jest.fn()
}));

describe('Perplexity API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock responses
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'mock-id',
        model: 'sonar-small-chat',
        object: 'chat.completion',
        created: Date.now(),
        choices: [
          {
            index: 0,
            finish_reason: 'stop',
            message: {
              role: 'assistant',
              content: 'Mock response content'
            }
          }
        ],
        usage: {
          prompt_tokens: 50,
          completion_tokens: 100,
          total_tokens: 150
        }
      })
    });
    
    // Mock API key
    process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY = 'mock-api-key';
    
    // Mock rate limiter to allow requests
    (perplexityRateLimiter.canMakeRequest as jest.Mock).mockReturnValue(true);
    (perplexityRateLimiter.getTimeToWaitMs as jest.Mock).mockReturnValue(0);
  });

  describe('searchWithPerplexity', () => {
    test('calls the API with correct parameters', async () => {
      // Act
      await searchWithPerplexity('test query');
      
      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.perplexity.ai/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-api-key',
            'Content-Type': 'application/json'
          }),
          body: expect.any(String)
        })
      );
      
      // Check the request body
      const requestBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(requestBody.model).toBe('sonar-small-chat');
      expect(requestBody.messages).toContainEqual(
        expect.objectContaining({
          role: 'user',
          content: 'test query'
        })
      );
    });

    test('parses search results correctly', async () => {
      // Mock API response with structured content
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: `
                Here are the search results for your query:
                
                ## Summary
                This is a summary of the search results.
                
                ## Companies
                - Apple Inc. (AAPL): Technology company in USA
                - Microsoft Corporation (MSFT): Software company
                
                ## Key Insights
                • First important insight about the market
                • Second insight about financial trends
                • Third insight about economic indicators
                
                ## Sources
                - [Financial Times](https://ft.com)
                - [Bloomberg](https://bloomberg.com)
              `
            }
          }]
        })
      });
      
      // Act
      const results = await searchWithPerplexity('apple microsoft');
      
      // Assert
      expect(results).toHaveProperty('summary');
      expect(results.summary).toContain('This is a summary');
      
      // Should extract insights
      expect(results.insights).toHaveLength(3);
      expect(results.insights[0]).toContain('First important insight');
      
      // Should extract sources
      expect(results.sources).toHaveLength(2);
      expect(results.sources[0].title).toBe('Financial Times');
      expect(results.sources[0].url).toBe('https://ft.com');
    });

    test('handles API errors gracefully', async () => {
      // Mock API error
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });
      
      // Mock rate limiter
      (perplexityRateLimiter.canMakeRequest as jest.Mock).mockReturnValue(true);
      
      // Act & Assert
      await expect(searchWithPerplexity('error query')).rejects.toThrow();
      
      // Should record failed request
      expect(perplexityRateLimiter.recordRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });

    test('respects rate limits and retries', async () => {
      // First mock rate limiter to indicate we need to wait
      (perplexityRateLimiter.canMakeRequest as jest.Mock).mockReturnValueOnce(false);
      (perplexityRateLimiter.getTimeToWaitMs as jest.Mock).mockReturnValueOnce(100);
      
      // Then allow the request
      (perplexityRateLimiter.canMakeRequest as jest.Mock).mockReturnValueOnce(true);
      
      // Mock setTimeout
      jest.spyOn(global, 'setTimeout').mockImplementation((cb: any) => {
        cb();
        return {} as any;
      });
      
      // Act
      await searchWithPerplexity('rate limited query');
      
      // Assert
      expect(perplexityRateLimiter.getTimeToWaitMs).toHaveBeenCalled();
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 100);
    });
  });

  describe('searchCompanies', () => {
    test('calls API with company-specific prompt', async () => {
      // Act
      await searchCompanies('apple');
      
      // Assert
      expect(global.fetch).toHaveBeenCalled();
      
      // Check request content
      const requestBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      const userMessage = requestBody.messages.find((m: any) => m.role === 'user');
      expect(userMessage.content).toContain('Search for companies matching');
      expect(userMessage.content).toContain('apple');
    });

    test('parses company results correctly', async () => {
      // Mock API response with company information
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: `
                ## Apple Inc.
                Ticker: AAPL
                Industry: Technology
                Country: United States
                Description: Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories.
                
                ## Microsoft Corporation
                Ticker: MSFT
                Industry: Software
                Country: United States
                Description: Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions.
              `
            }
          }]
        })
      });
      
      // Act
      const companies = await searchCompanies('tech companies');
      
      // Assert
      expect(companies).toHaveLength(2);
      
      // Check first company
      expect(companies[0].companyName).toBe('Apple Inc.');
      expect(companies[0].ticker).toBe('AAPL');
      expect(companies[0].industry).toBe('Technology');
      expect(companies[0].country).toBe('United States');
      
      // Check second company
      expect(companies[1].companyName).toBe('Microsoft Corporation');
      expect(companies[1].ticker).toBe('MSFT');
    });

    test('handles unstructured content gracefully', async () => {
      // Mock API response with unstructured text
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: `
                Here are some technology companies:
                Apple Inc. is a major technology company based in Cupertino.
                Microsoft Corporation is a leading software company.
                Google (Alphabet Inc.) is known for search and cloud services.
              `
            }
          }]
        })
      });
      
      // Act
      const companies = await searchCompanies('tech companies');
      
      // Assert - should still extract some companies
      expect(companies.length).toBeGreaterThan(0);
      expect(companies.some(c => c.companyName.includes('Apple'))).toBeTruthy();
    });
  });

  describe('getFinancialInsights', () => {
    test('calls API with financial insights prompt', async () => {
      // Act
      await getFinancialInsights('market trends');
      
      // Assert
      expect(global.fetch).toHaveBeenCalled();
      
      // Check request content
      const requestBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      const userMessage = requestBody.messages.find((m: any) => m.role === 'user');
      expect(userMessage.content).toContain('Provide comprehensive financial insights');
      expect(userMessage.content).toContain('market trends');
    });

    test('extracts insights from bullet points', async () => {
      // Mock API response with bullet points
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: `
                # Market Trends Analysis
                
                The current market shows several important patterns.
                
                ## Key Insights
                
                • The S&P 500 has shown growth of 15% year-to-date
                • Interest rates are expected to remain stable in Q3
                • Tech sector continues to outperform other segments
                • Inflation concerns have moderated in recent months
                • Energy stocks face headwinds due to regulatory changes
              `
            }
          }]
        })
      });
      
      // Act
      const insights = await getFinancialInsights('market trends');
      
      // Assert
      expect(insights.summary).toContain('The current market shows');
      expect(insights.insights).toHaveLength(5);
      expect(insights.insights[0]).toContain('S&P 500');
      expect(insights.insights[2]).toContain('Tech sector');
    });

    test('extracts insights from numbered lists', async () => {
      // Mock API response with numbered lists
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: `
                # Financial Overview
                
                Here are the key points to consider:
                
                1. Earnings reports for Q2 exceeded analyst expectations
                2. Consumer sentiment index has improved by 5 points
                3. Manufacturing sector showing signs of recovery
              `
            }
          }]
        })
      });
      
      // Act
      const insights = await getFinancialInsights('economic outlook');
      
      // Assert
      expect(insights.insights).toHaveLength(3);
      expect(insights.insights[0]).toContain('Earnings reports');
      expect(insights.insights[1]).toContain('Consumer sentiment');
    });
  });

  describe('getMarketNews', () => {
    test('calls the market news API endpoint', async () => {
      // Mock fetch specifically for this test
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          articles: [
            {
              id: 'news-1',
              title: 'Market Update',
              summary: 'Recent developments in financial markets',
              category: 'Markets',
              timestamp: new Date().toISOString(),
              source: 'Financial Times'
            }
          ]
        })
      });
      
      // Act
      const news = await getMarketNews();
      
      // Assert
      expect(global.fetch).toHaveBeenCalledWith('/api/market-news', expect.any(Object));
      expect(news).toHaveLength(1);
      expect(news[0].title).toBe('Market Update');
    });

    test('handles API errors gracefully', async () => {
      // Mock API error
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });
      
      // Act
      const news = await getMarketNews();
      
      // Assert - should return empty array instead of throwing
      expect(news).toEqual([]);
    });

    test('handles invalid data format gracefully', async () => {
      // Mock invalid response format
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          // Missing articles array
          status: 'success'
        })
      });
      
      // Act & Assert
      await expect(getMarketNews()).rejects.toThrow('Invalid news data format');
    });
  });
});