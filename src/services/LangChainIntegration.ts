import { v4 as uuidv4 } from 'uuid';
import { TariffSearchParams, TariffInfo, TariffChangeEvent } from './SemanticTariffEngine';

/**
 * LangChainIntegration
 * 
 * This class provides integration between Perplexity AI search capabilities
 * and the semantic tariff engine using LangChain as the middleware layer.
 * 
 * It transforms unstructured content from Perplexity into structured RDF data
 * that can be stored in the tariff ontology.
 */
export class LangChainIntegration {
  private apiKey: string = process.env.PERPLEXITY_API_KEY || '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';
  private perplexityApiUrl: string = 'https://api.perplexity.ai/chat/completions';
  private models = {
    SMALL: 'mistral-7b-instruct',
    MEDIUM: 'mixtral-8x7b-instruct',
    LARGE: 'llama-2-70b-chat',
    DEFAULT: 'sonar-small-chat'
  };
  private isInitialized: boolean = false;
  
  /**
   * Initialize the LangChain integration
   */
  public async initialize(): Promise<void> {
    try {
      // In a real implementation, this would initialize LangChain components
      // For now, we'll just simulate initialization
      
      // Test Perplexity API connection
      // await this.testPerplexityConnection();
      
      this.isInitialized = true;
      console.log('LangChain integration initialized');
    } catch (error) {
      console.error('Failed to initialize LangChain integration:', error);
      throw error;
    }
  }
  
  /**
   * Test Perplexity connection
   */
  private async testPerplexityConnection(): Promise<void> {
    try {
      const messages = [
        {
          role: 'system',
          content: 'You are a tariff data assistant. Respond with "Connection successful" if you can read this message.'
        },
        {
          role: 'user',
          content: 'Test connection'
        }
      ];
      
      const response = await this.callPerplexityApi(messages);
      
      if (!response.includes('Connection successful')) {
        throw new Error('Failed to establish connection with Perplexity API');
      }
      
      console.log('Perplexity API connection successful');
    } catch (error) {
      console.error('Failed to connect to Perplexity API:', error);
      throw error;
    }
  }
  
  /**
   * Call Perplexity API with retry logic using our server-side proxy
   */
  private async callPerplexityApi(messages: Array<{ role: string, content: string }>, model = this.models.DEFAULT): Promise<string> {
    const request = {
      model: model,
      messages: messages,
      temperature: 0.2,
      max_tokens: 2000,
      stream: false
    };
    
    const MAX_RETRIES = 2;
    const RETRY_DELAY = 1000;
    let retries = 0;
    let lastError: Error | null = null;
    
    while (retries <= MAX_RETRIES) {
      try {
        // Use our proxy API route instead of calling Perplexity directly
        // This avoids CORS issues
        const response = await fetch('/api/perplexity-proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(request)
        });
        
        if (!response.ok) {
          // Try alternative model if the current one fails
          if (retries < MAX_RETRIES) {
            retries++;
            const fallbackModel = retries === 1 ? this.models.MEDIUM : this.models.SMALL;
            console.warn(`Perplexity API error (${response.status}), retrying with model: ${fallbackModel}`);
            request.model = fallbackModel;
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            continue;
          }
          const errorText = await response.text();
          throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        const data = await response.json();
        return data.choices[0]?.message?.content || '';
      } catch (error) {
        lastError = error as Error;
        if (retries < MAX_RETRIES) {
          retries++;
          const fallbackModel = retries === 1 ? this.models.MEDIUM : this.models.SMALL;
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
   * Search for tariff information using Perplexity
   */
  public async searchTariffsWithPerplexity(params: TariffSearchParams): Promise<TariffInfo[]> {
    if (!this.isInitialized) {
      throw new Error('LangChain integration not initialized');
    }
    
    try {
      // Build a search query string based on the parameters
      let queryText = 'What are the current tariff rates';
      
      if (params.product) {
        queryText += ` for ${params.product}`;
      }
      
      if (params.hsCode) {
        queryText += ` (HS code ${params.hsCode})`;
      }
      
      if (params.originCountry) {
        queryText += ` from ${params.originCountry}`;
      }
      
      if (params.destinationCountry) {
        queryText += ` imported to ${params.destinationCountry}`;
      }
      
      if (params.effectiveDate) {
        queryText += ` effective as of ${params.effectiveDate}`;
      }
      
      queryText += '? Provide detailed information including rates, effective dates, and any special conditions.';
      
      // Create a system prompt that requests structured output
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
      
      // Create messages for the API call
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: queryText
        }
      ];
      
      // Call Perplexity API
      const responseText = await this.callPerplexityApi(messages, this.models.MEDIUM);
      
      // Parse the JSON response
      const tariffData = this.extractJsonFromResponse(responseText);
      
      if (Array.isArray(tariffData)) {
        // Transform the data into TariffInfo objects
        return tariffData.map(item => ({
          id: `perplexity:${uuidv4()}`,
          hsCode: item.hsCode || 'Unknown',
          description: item.description || 'No description available',
          sourceCountry: item.sourceCountry || params.originCountry || 'Unknown',
          destinationCountry: item.destinationCountry || params.destinationCountry || 'Unknown',
          rate: typeof item.rate === 'number' ? item.rate : parseFloat(item.rate) || 0,
          currency: item.currency || '%',
          effectiveDate: item.effectiveDate || new Date().toISOString().split('T')[0],
          expirationDate: item.expirationDate,
          exemptions: item.exemptions,
          specialConditions: item.specialConditions,
          source: {
            id: 'perplexity-tariff-search',
            name: 'Perplexity Tariff Search',
            type: 'api',
            description: 'Tariff data from Perplexity AI search',
            reliability: 0.85
          },
          confidence: typeof item.confidence === 'number' ? item.confidence : 0.8,
          lastUpdated: new Date().toISOString()
        }));
      }
      
      // If we couldn't parse structured data, return an empty array
      console.warn('Failed to parse structured tariff data from Perplexity response');
      return [];
    } catch (error) {
      console.error('Error searching tariffs with Perplexity:', error);
      // Return empty array on error rather than throwing
      return [];
    }
  }
  
  /**
   * Extract JSON from a text response
   */
  private extractJsonFromResponse(text: string): any {
    try {
      // Look for JSON array in the response
      const jsonMatch = text.match(/\[\s*{[\s\S]*}\s*\]/m);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Try to extract JSON object
      const jsonObjMatch = text.match(/{[\s\S]*}/m);
      
      if (jsonObjMatch) {
        return JSON.parse(jsonObjMatch[0]);
      }
      
      // If no JSON found, return null
      return null;
    } catch (error) {
      console.error('Error extracting JSON from response:', error);
      return null;
    }
  }
  
  /**
   * Query for recent tariff changes using Perplexity
   */
  public async queryRecentTariffChanges(): Promise<TariffChangeEvent[]> {
    if (!this.isInitialized) {
      throw new Error('LangChain integration not initialized');
    }
    
    try {
      // Create a system prompt that requests structured output for tariff changes
      const systemPrompt = `You are a tariff policy analyst. When asked about recent tariff changes, provide detailed, structured data in the following JSON format:

[
  {
    "title": "Brief descriptive title of the change",
    "description": "Detailed description of the tariff change",
    "country": "Country implementing the change",
    "hsCode": "HS code if specific",
    "productCategories": ["List of affected product categories"],
    "oldRate": 5.0,
    "newRate": 7.5,
    "effectiveDate": "2025-05-01",
    "announcementDate": "2025-03-15",
    "impactLevel": "high|medium|low",
    "relatedCountries": ["List of affected trade partners"],
    "confidence": 0.9
  }
]

Provide actual recent tariff changes from around the world, focusing on significant changes with economic impact. Each entry must include title, description, country, productCategories, and effectiveDate at minimum.`;
      
      // Query for recent changes
      const queryText = "What are the most significant tariff policy changes announced in the past 30 days worldwide? Focus on changes that could significantly impact international trade. Include details on the countries involved, affected products, and the nature of the changes.";
      
      // Create messages for the API call
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: queryText
        }
      ];
      
      // Call Perplexity API
      const responseText = await this.callPerplexityApi(messages, this.models.MEDIUM);
      
      // Parse the JSON response
      const tariffChanges = this.extractJsonFromResponse(responseText);
      
      if (Array.isArray(tariffChanges)) {
        // Transform the data into TariffChangeEvent objects
        return tariffChanges.map(item => ({
          id: `perplexity:change:${uuidv4()}`,
          title: item.title || 'Tariff policy change',
          description: item.description || 'No description available',
          country: item.country || 'Global',
          hsCode: item.hsCode,
          productCategories: item.productCategories || ['General'],
          oldRate: typeof item.oldRate === 'number' ? item.oldRate : (parseFloat(item.oldRate) || undefined),
          newRate: typeof item.newRate === 'number' ? item.newRate : (parseFloat(item.newRate) || undefined),
          effectiveDate: item.effectiveDate || new Date().toISOString().split('T')[0],
          announcementDate: item.announcementDate || new Date().toISOString().split('T')[0],
          source: {
            id: 'perplexity-recent-changes',
            name: 'Perplexity Tariff Updates',
            type: 'api',
            description: 'Recent tariff changes from Perplexity AI search',
            reliability: 0.8
          },
          impactLevel: (item.impactLevel as 'low' | 'medium' | 'high') || 'medium',
          relatedCountries: item.relatedCountries || [],
          confidence: typeof item.confidence === 'number' ? item.confidence : 0.8
        }));
      }
      
      // If we couldn't parse structured data, return an empty array
      console.warn('Failed to parse structured tariff change data from Perplexity response');
      return [];
    } catch (error) {
      console.error('Error querying recent tariff changes:', error);
      // Return empty array on error rather than throwing
      return [];
    }
  }
  
  /**
   * Analyze product tariff impact using LangChain
   */
  public async analyzeProductTariffImpact(
    product: string,
    countries: string[],
    timeframe: number
  ): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('LangChain integration not initialized');
    }
    
    try {
      // Create a system prompt for tariff impact analysis
      const systemPrompt = `You are an international trade and tariff analysis expert. Analyze the tariff impact for specific products and countries using the most current data. Provide a structured analysis in the following JSON format:

{
  "summary": "Brief summary of tariff impact",
  "product": "Product category analyzed",
  "timeframeMonths": 24,
  "impactByCountry": [
    {
      "country": "Country name",
      "currentTariffRate": 5.0,
      "projectedTariffRate": 7.5,
      "netImpact": 2.5,
      "impactDirection": "increase|decrease|neutral",
      "riskLevel": "high|medium|low",
      "keyFactors": ["List of key factors affecting tariffs"],
      "confidence": 0.85
    }
  ],
  "tradeTrends": {
    "globalTrend": "Brief description of global trend",
    "regionalPatterns": ["List of regional patterns"],
    "volatilityAssessment": "high|medium|low"
  },
  "recommendations": [
    "List of strategic recommendations"
  ],
  "dataSources": [
    "List of data sources referenced"
  ]
}

Provide detailed analysis with quantitative estimates where possible. For projections, explain the key factors that could influence tariff rates over the given timeframe.`;
      
      // Build the query text
      const countryList = countries.join(', ');
      const queryText = `Analyze the tariff impact for ${product} over the next ${timeframe} months for the following countries: ${countryList}. What are the current rates, projected changes, and potential impacts? Include economic and political factors that might influence tariff policies.`;
      
      // Create messages for the API call
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: queryText
        }
      ];
      
      // Call Perplexity API
      const responseText = await this.callPerplexityApi(messages, this.models.LARGE);
      
      // Parse the JSON response
      const impactAnalysis = this.extractJsonFromResponse(responseText);
      
      if (impactAnalysis && typeof impactAnalysis === 'object') {
        // Add timestamp and source info
        return {
          ...impactAnalysis,
          timestamp: new Date().toISOString(),
          source: {
            id: 'perplexity-impact-analysis',
            name: 'Perplexity AI Analysis',
            type: 'api',
            description: 'Tariff impact analysis from Perplexity AI',
            reliability: 0.8
          }
        };
      }
      
      // If we couldn't parse structured data, return a simplified structure
      console.warn('Failed to parse structured impact analysis from Perplexity response');
      return {
        summary: 'Unable to generate structured analysis',
        product: product,
        timeframeMonths: timeframe,
        impactByCountry: countries.map(country => ({
          country: country,
          currentTariffRate: 'Unknown',
          projectedTariffRate: 'Unknown',
          netImpact: 'Unknown',
          impactDirection: 'neutral',
          riskLevel: 'medium',
          keyFactors: ['Insufficient data'],
          confidence: 0.5
        })),
        rawResponse: responseText,
        timestamp: new Date().toISOString(),
        source: {
          id: 'perplexity-impact-analysis',
          name: 'Perplexity AI Analysis',
          type: 'api',
          description: 'Tariff impact analysis from Perplexity AI',
          reliability: 0.7
        }
      };
    } catch (error) {
      console.error('Error analyzing product tariff impact:', error);
      
      // Return basic structure on error
      return {
        summary: 'Error generating tariff impact analysis',
        product: product,
        timeframeMonths: timeframe,
        impactByCountry: countries.map(country => ({
          country: country,
          currentTariffRate: 'Unknown',
          projectedTariffRate: 'Unknown',
          netImpact: 'Unknown',
          impactDirection: 'neutral',
          riskLevel: 'medium',
          keyFactors: ['Analysis error'],
          confidence: 0.3
        })),
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}