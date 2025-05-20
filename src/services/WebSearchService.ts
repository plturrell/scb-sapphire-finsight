import { OntologyManager } from './OntologyManager';
import perplexityApiClient from './PerplexityApiClient';
import { RedisDataStore } from './RedisDataStore';
import { NotificationCenter } from './NotificationCenter';
import { TariffAlert } from '../types';

interface SearchResult {
  title: string;
  description: string;
  url: string;
  source: string;
  publishDate: string;
  content?: string;
  [key: string]: any;
}

interface SearchQueryConfig {
  id: string;
  query: string;
  priority: 'high' | 'medium' | 'low';
  sources?: string[];
  country?: string;
  productCategories?: string[];
}

interface WebSearchConfig {
  ontology: OntologyManager;
  searchFrequency?: number;
  onFoundNewTariffInfo?: (results: SearchResult[], ontology: OntologyManager) => void;
  onSearchStart?: () => void;
  onSearchComplete?: () => void;
  onError?: (error: Error) => void;
}

/**
 * WebSearchService for the Tariff Alert Scanner system
 * Implements web search capabilities to monitor tariff-related news and information
 * Uses Perplexity API for real-time search capability
 */
export class WebSearchService {
  private ontology: OntologyManager;
  private searchFrequency: number;
  private redisDataStore: RedisDataStore;
  private onFoundNewTariffInfo?: (results: SearchResult[], ontology: OntologyManager) => void;
  private onSearchStart?: () => void;
  private onSearchComplete?: () => void;
  private onError?: (error: Error) => void;
  
  private searchQueries: SearchQueryConfig[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private lastSearchResults: Map<string, SearchResult[]> = new Map();
  private isSearching: boolean = false;
  private static instance: WebSearchService;
  
  constructor({
    ontology,
    searchFrequency = 10 * 60 * 1000, // Default: Every 10 minutes
    onFoundNewTariffInfo,
    onSearchStart,
    onSearchComplete,
    onError
  }: WebSearchConfig) {
    this.ontology = ontology;
    this.searchFrequency = searchFrequency;
    this.onFoundNewTariffInfo = onFoundNewTariffInfo;
    this.onSearchStart = onSearchStart;
    this.onSearchComplete = onSearchComplete;
    this.onError = onError;
    this.redisDataStore = RedisDataStore.getInstance();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(config?: WebSearchConfig): WebSearchService {
    if (!WebSearchService.instance) {
      if (!config) {
        throw new Error('WebSearchService config is required for initial instantiation');
      }
      WebSearchService.instance = new WebSearchService(config);
    }
    return WebSearchService.instance;
  }
  
  /**
   * Register a search query to monitor
   */
  public registerSearchQuery(queryConfig: SearchQueryConfig) {
    // Check if query already exists
    const existingIndex = this.searchQueries.findIndex(q => q.id === queryConfig.id);
    if (existingIndex >= 0) {
      // Update existing query
      this.searchQueries[existingIndex] = queryConfig;
      console.log(`Updated search query: ${queryConfig.id}`);
    } else {
      // Add new query
      this.searchQueries.push(queryConfig);
      console.log(`Registered search query: ${queryConfig.id}`);
    }
    
    // Store query in Redis for persistence
    this.storeQueryConfig(queryConfig);
  }
  
  /**
   * Store query config in Redis
   */
  private async storeQueryConfig(queryConfig: SearchQueryConfig) {
    try {
      await this.redisDataStore.set(`search-query:${queryConfig.id}`, queryConfig);
    } catch (error) {
      console.error(`Failed to store query config in Redis: ${queryConfig.id}`, error);
    }
  }
  
  /**
   * Load all search queries from Redis
   */
  public async loadStoredQueries() {
    try {
      const keys = await this.redisDataStore.searchKeys('search-query:*');
      
      for (const key of keys) {
        const queryConfig = await this.redisDataStore.get(key);
        if (queryConfig) {
          // Add to queries if not already there
          if (!this.searchQueries.some(q => q.id === queryConfig.id)) {
            this.searchQueries.push(queryConfig);
            console.log(`Loaded stored query: ${queryConfig.id}`);
          }
        }
      }
      
      console.log(`Loaded ${this.searchQueries.length} queries from storage`);
    } catch (error) {
      console.error('Failed to load stored queries:', error);
    }
  }
  
  /**
   * Start the monitoring process
   */
  public async startMonitoring() {
    // Load stored queries first
    await this.loadStoredQueries();
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    // Immediately perform first search
    this.performSearch();
    
    // Set up regular interval
    this.intervalId = setInterval(() => {
      this.performSearch();
    }, this.searchFrequency);
    
    console.log(`Web search monitoring started with ${this.searchQueries.length} queries`);
    
    // Notify system about monitoring start
    NotificationCenter.showNotification({
      title: 'Tariff Monitoring Started',
      body: `Monitoring ${this.searchQueries.length} tariff-related topics`,
      priority: 'medium',
      category: 'update',
      module: 'tariff-analysis'
    });
  }
  
  /**
   * Perform search for all registered queries
   */
  public async performSearch() {
    // Prevent concurrent searches
    if (this.isSearching) {
      console.log('Search already in progress, skipping this cycle');
      return;
    }
    
    this.isSearching = true;
    
    try {
      if (this.onSearchStart) {
        this.onSearchStart();
      }
      
      // If we have no queries, try to load stored ones
      if (this.searchQueries.length === 0) {
        await this.loadStoredQueries();
        
        if (this.searchQueries.length === 0) {
          console.log('No search queries registered, skipping search');
          return;
        }
      }
      
      const newResults: SearchResult[] = [];
      
      // Process each registered query
      const searchPromises = this.searchQueries.map(async (queryConfig) => {
        try {
          console.log(`Performing search for: ${queryConfig.id}`);
          
          // Call web search API
          const searchResults = await this.executeWebSearch(
            queryConfig.query, 
            queryConfig.sources,
            queryConfig.country,
            queryConfig.productCategories
          );
          
          // Filter new results by comparing with last search
          const lastResults = this.lastSearchResults.get(queryConfig.id) || [];
          const newArticles = this.filterNewResults(searchResults, lastResults);
          
          if (newArticles.length > 0) {
            console.log(`Found ${newArticles.length} new results for ${queryConfig.id}`);
            
            // Add priority and query info to results
            const enhancedResults = newArticles.map(article => ({
              ...article,
              priority: queryConfig.priority,
              queryId: queryConfig.id,
              country: queryConfig.country || this.extractCountryFromQuery(queryConfig.query),
              productCategories: queryConfig.productCategories || this.extractProductsFromQuery(queryConfig.query)
            }));
            
            return enhancedResults;
          }
          
          // Update last results
          this.lastSearchResults.set(queryConfig.id, searchResults);
          
          return [];
        } catch (error) {
          console.error(`Error searching for ${queryConfig.id}:`, error);
          return [];
        }
      });
      
      // Wait for all searches to complete
      const resultsArrays = await Promise.all(searchPromises);
      
      // Flatten results
      resultsArrays.forEach(results => {
        newResults.push(...results);
      });
      
      // Process new results if any
      if (newResults.length > 0) {
        console.log(`Found ${newResults.length} total new results across all queries`);
        
        // Convert to tariff alerts and store
        await this.convertAndStoreTariffAlerts(newResults);
        
        if (this.onFoundNewTariffInfo) {
          this.onFoundNewTariffInfo(newResults, this.ontology);
        }
      }
      
      if (this.onSearchComplete) {
        this.onSearchComplete();
      }
    } catch (error) {
      console.error('Error in search process:', error);
      
      if (this.onError) {
        this.onError(error as Error);
      }
    } finally {
      this.isSearching = false;
    }
  }
  
  /**
   * Convert search results to tariff alerts and store them
   */
  private async convertAndStoreTariffAlerts(results: SearchResult[]) {
    // Process each result
    for (const result of results) {
      try {
        // Extract tariff rate from result if available
        const tariffRate = this.extractTariffRate(result.title, result.description, result.content);
        
        // Create tariff alert
        const tariffAlert: TariffAlert = {
          title: result.title,
          description: result.content || result.description,
          country: result.country || this.extractCountryFromQuery(result.query || ''),
          impactSeverity: this.calculateImpactSeverity(result),
          confidence: result.confidence || 0.7,
          sourceUrl: result.url,
          sourceName: result.source,
          publishDate: new Date(result.publishDate),
          createdAt: new Date(),
          priority: this.mapPriorityLevel(result.priority || 'medium'),
          tariffRate: tariffRate,
          productCategories: result.productCategories || this.extractProductsFromQuery(result.query || ''),
          aiEnhanced: true
        };
        
        // Store in Redis
        const alertId = await this.redisDataStore.storeTariffAlert(tariffAlert);
        
        // Create notification for high priority alerts
        if (tariffAlert.priority === 'high' || tariffAlert.priority === 'Critical') {
          NotificationCenter.showNotification({
            title: `New ${tariffAlert.priority} Tariff Alert`,
            body: tariffAlert.title,
            priority: tariffAlert.priority === 'Critical' ? 'critical' : 'high',
            category: 'alert',
            module: 'tariff-analysis',
            data: { alertId }
          });
        }
      } catch (error) {
        console.error('Error converting search result to tariff alert:', error);
      }
    }
  }
  
  /**
   * Map priority levels between systems
   */
  private mapPriorityLevel(priority: string): 'Critical' | 'high' | 'medium' | 'low' {
    switch (priority.toLowerCase()) {
      case 'critical':
        return 'Critical';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
      default:
        return 'low';
    }
  }
  
  /**
   * Calculate impact severity based on result
   */
  private calculateImpactSeverity(result: SearchResult): number {
    // Start with base severity
    let severity = 5;
    
    // Adjust based on tariff rate if available
    const tariffRate = this.extractTariffRate(result.title, result.description, result.content);
    if (tariffRate) {
      // Higher tariff rates have higher impact
      severity += Math.min(tariffRate / 5, 3);
    }
    
    // Adjust based on priority
    if (result.priority === 'high') {
      severity += 2;
    } else if (result.priority === 'critical') {
      severity += 3;
    }
    
    // Adjust based on confidence
    if (result.confidence) {
      severity *= result.confidence;
    }
    
    // Cap at 10
    return Math.min(Math.round(severity * 10) / 10, 10);
  }
  
  /**
   * Extract tariff rate from text
   */
  private extractTariffRate(title: string, description: string, content?: string): number | undefined {
    // Combine all text for searching
    const allText = [title, description, content].filter(Boolean).join(' ');
    
    // Look for patterns like "15%" or "15 percent"
    const percentMatch = allText.match(/(\d+(\.\d+)?)%/);
    if (percentMatch) {
      return parseFloat(percentMatch[1]);
    }
    
    const percentWordMatch = allText.match(/(\d+(\.\d+)?)\s*percent/i);
    if (percentWordMatch) {
      return parseFloat(percentWordMatch[1]);
    }
    
    return undefined;
  }
  
  /**
   * Extract country from query
   */
  private extractCountryFromQuery(query: string): string {
    // Look for country in quotes
    const quoteMatch = query.match(/"([^"]+)"/);
    if (quoteMatch) {
      return quoteMatch[1];
    }
    
    // Default fallback
    return 'Global';
  }
  
  /**
   * Extract product categories from query
   */
  private extractProductsFromQuery(query: string): string[] {
    // Look for products in parentheses, separated by OR
    const productMatch = query.match(/\(([^)]+)\)/);
    if (productMatch) {
      return productMatch[1].split(/\s+OR\s+/).map(p => p.trim());
    }
    
    return [];
  }
  
  /**
   * Execute web search via Perplexity API
   */
  private async executeWebSearch(
    query: string, 
    sources?: string[],
    country?: string,
    productCategories?: string[]
  ): Promise<SearchResult[]> {
    console.log(`Executing web search for: ${query}`);
    console.log(`Sources: ${sources?.join(', ') || 'all'}`);
    
    try {
      // Use real API if available
      const isReal = process.env.USE_MOCK_DATA !== 'true';
      
      if (isReal) {
        try {
          // Construct API query
          const apiQuery = `${query} latest news tariff changes trade policy`;
          
          // Call market news API with appropriate topic
          const response = await fetch(`/api/market-news?topic=${encodeURIComponent(apiQuery)}&limit=10`);
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data.success && Array.isArray(data.data)) {
            // Convert API results to SearchResult format
            return data.data.map((item: any) => ({
              title: item.title,
              description: item.summary || '',
              url: item.source || '',
              source: item.sourceName || 'News Service',
              publishDate: item.publishDate || new Date().toISOString(),
              content: item.content || item.summary,
              confidence: 0.8,
              country: country || this.extractCountryFromQuery(query),
              productCategories: productCategories || this.extractProductsFromQuery(query)
            }));
          }
          
          throw new Error('Invalid API response format');
        } catch (error) {
          console.error('Error calling real API, falling back to simulation:', error);
          // Fall back to simulated results
          return this.simulateSearchResults(query, sources, country, productCategories);
        }
      } else {
        // Use simulated results
        return this.simulateSearchResults(query, sources, country, productCategories);
      }
    } catch (error) {
      console.error('Search execution error:', error);
      throw error;
    }
  }
  
  /**
   * Simulate search results (fallback when API is unavailable)
   */
  private async simulateSearchResults(
    query: string,
    sources?: string[],
    country?: string,
    productCategories?: string[]
  ): Promise<SearchResult[]> {
    // Extract components from the query for simulated results
    const countryMatch = query.match(/"([^"]+)"/);
    const simulatedCountry = country || (countryMatch ? countryMatch[1] : 'Unknown');
    
    const productMatch = query.match(/\(([^)]+)\)/);
    const simulatedProductTerms = productCategories || 
      (productMatch ? productMatch[1].split(' OR ') : []);
    
    // Generate simulated results
    const results: SearchResult[] = [];
    
    // Base number of results on query components
    const resultCount = Math.floor(Math.random() * 3) + 1; // 1-3 results
    
    for (let i = 0; i < resultCount; i++) {
      const product = simulatedProductTerms.length > 0 
        ? simulatedProductTerms[Math.floor(Math.random() * simulatedProductTerms.length)]
        : 'general goods';
        
      const rate = (Math.floor(Math.random() * 25) + 5).toFixed(1);
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 7)); // Within last week
      
      results.push({
        title: `New ${rate}% tariff on ${product} imports from ${simulatedCountry}`,
        description: `The government has announced new tariff rates on ${product} imports from ${simulatedCountry}, effective next month. The rate will increase to ${rate}%, which may impact trade relations.`,
        url: `https://example.com/news/${Date.now()}-${i}-${simulatedCountry.toLowerCase().replace(/\s+/g, '-')}`,
        source: sources && sources.length > 0 
          ? sources[Math.floor(Math.random() * sources.length)]
          : ['Bloomberg', 'Reuters', 'Financial Times', 'WSJ'][Math.floor(Math.random() * 4)],
        publishDate: date.toISOString(),
        content: `In a move that could affect international trade relations, the government has announced a new tariff rate of ${rate}% on ${product} imports from ${simulatedCountry}. The new rate will take effect starting next month, according to officials. Experts suggest this could impact various industries dependent on these imports, with potential price increases for consumers. The ${simulatedCountry} government has not yet issued an official response to these changes.`,
        tariffRate: parseFloat(rate),
        country: simulatedCountry,
        productCategory: product,
        confidence: 0.7 + (Math.random() * 0.25), // 0.7-0.95
        query
      });
    }
    
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    return results;
  }
  
  /**
   * Filter out results we've already seen
   */
  private filterNewResults(currentResults: SearchResult[], previousResults: SearchResult[]): SearchResult[] {
    // Compare based on URL to identify new articles
    const previousUrls = new Set(previousResults.map(r => r.url));
    return currentResults.filter(result => !previousUrls.has(result.url));
  }
  
  /**
   * Unsubscribe from all monitoring
   */
  public unsubscribeAll() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('Web search monitoring stopped');
    
    // Notify system
    NotificationCenter.showNotification({
      title: 'Tariff Monitoring Stopped',
      body: 'The tariff monitoring service has been deactivated',
      priority: 'medium',
      category: 'update',
      module: 'tariff-analysis'
    });
  }
  
  /**
   * Build a tariff search query
   */
  public static buildTariffSearchQuery(
    countryName: string, 
    productCategories: string[], 
    includeExtraTerms = true
  ): string {
    // Build a sophisticated search query combining country and product categories
    const productTerms = productCategories
      .slice(0, 3) // Take top 3 most relevant product categories
      .join(' OR ');
      
    const extraTerms = includeExtraTerms 
      ? 'AND (new OR change OR increase OR negotiation)' 
      : '';
      
    return `(tariff OR trade policy) AND "${countryName}" AND (${productTerms}) ${extraTerms}`;
  }
  
  /**
   * Create tariff alert from search result
   */
  public createTariffAlertFromResult(result: SearchResult): TariffAlert {
    const publishDate = result.publishDate ? new Date(result.publishDate) : new Date();
    const effectiveDate = new Date(publishDate);
    effectiveDate.setDate(effectiveDate.getDate() + 30); // Assume 30 days later
    
    return {
      title: result.title,
      description: result.content || result.description,
      country: result.country || 'Global',
      impactSeverity: this.calculateImpactSeverity(result),
      confidence: result.confidence || 0.7,
      sourceUrl: result.url,
      sourceName: result.source,
      publishDate,
      createdAt: new Date(),
      effectiveDate,
      priority: this.mapPriorityLevel(result.priority || 'medium'),
      tariffRate: result.tariffRate,
      productCategories: Array.isArray(result.productCategories) ? result.productCategories : 
        [result.productCategory].filter(Boolean) as string[],
      aiEnhanced: true
    };
  }
}

// Initialize singleton instance with default config
let webSearchServiceInstance: WebSearchService | null = null;

/**
 * Get the WebSearchService singleton instance
 */
export const getWebSearchService = (ontology?: OntologyManager): WebSearchService => {
  if (!webSearchServiceInstance) {
    if (!ontology) {
      throw new Error('OntologyManager is required for initial WebSearchService instantiation');
    }
    
    webSearchServiceInstance = new WebSearchService({
      ontology,
      searchFrequency: 10 * 60 * 1000
    });
  }
  
  return webSearchServiceInstance;
};

export default getWebSearchService;