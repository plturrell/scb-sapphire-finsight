import { OntologyManager } from './OntologyManager';

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
}

interface WebSearchConfig {
  ontology: OntologyManager;
  searchFrequency: number;
  onFoundNewTariffInfo?: (results: SearchResult[], ontology: OntologyManager) => void;
  onSearchStart?: () => void;
  onSearchComplete?: () => void;
}

/**
 * WebSearchService for the Tariff Alert Scanner system
 * Implements web search capabilities to monitor tariff-related news and information
 */
export class WebSearchService {
  private ontology: OntologyManager;
  private searchFrequency: number;
  private onFoundNewTariffInfo?: (results: SearchResult[], ontology: OntologyManager) => void;
  private onSearchStart?: () => void;
  private onSearchComplete?: () => void;
  
  private searchQueries: SearchQueryConfig[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private lastSearchResults: Map<string, SearchResult[]> = new Map();
  
  constructor({
    ontology,
    searchFrequency = 10 * 60 * 1000, // Default: Every 10 minutes
    onFoundNewTariffInfo,
    onSearchStart,
    onSearchComplete
  }: WebSearchConfig) {
    this.ontology = ontology;
    this.searchFrequency = searchFrequency;
    this.onFoundNewTariffInfo = onFoundNewTariffInfo;
    this.onSearchStart = onSearchStart;
    this.onSearchComplete = onSearchComplete;
  }
  
  /**
   * Register a search query to monitor
   */
  public registerSearchQuery(queryConfig: SearchQueryConfig) {
    this.searchQueries.push(queryConfig);
    console.log(`Registered search query: ${queryConfig.id}`);
  }
  
  /**
   * Start the monitoring process
   */
  public startMonitoring() {
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
  }
  
  /**
   * Perform search for all registered queries
   */
  public async performSearch() {
    if (this.onSearchStart) {
      this.onSearchStart();
    }
    
    const newResults: SearchResult[] = [];
    
    // Process each registered query
    for (const queryConfig of this.searchQueries) {
      try {
        console.log(`Performing search for: ${queryConfig.id}`);
        
        // Call web search API
        const searchResults = await this.executeWebSearch(
          queryConfig.query, 
          queryConfig.sources
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
            queryId: queryConfig.id
          }));
          
          newResults.push(...enhancedResults);
          
          // Update last results
          this.lastSearchResults.set(queryConfig.id, searchResults);
        }
      } catch (error) {
        console.error(`Error searching for ${queryConfig.id}:`, error);
      }
    }
    
    // Process new results if any
    if (newResults.length > 0 && this.onFoundNewTariffInfo) {
      this.onFoundNewTariffInfo(newResults, this.ontology);
    }
    
    if (this.onSearchComplete) {
      this.onSearchComplete();
    }
  }
  
  /**
   * Execute web search via API
   */
  private async executeWebSearch(query: string, sources?: string[]): Promise<SearchResult[]> {
    // In a full implementation, this would use an actual search API
    // For this demo, we'll simulate results based on the query
    
    console.log(`Executing web search for: ${query}`);
    console.log(`Sources: ${sources?.join(', ') || 'all'}`);
    
    // Simulate API call with a delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Extract components from the query for simulated results
    const countryMatch = query.match(/"([^"]+)"/);
    const country = countryMatch ? countryMatch[1] : 'Unknown';
    
    const productMatch = query.match(/\(([^)]+)\)/);
    const productTerms = productMatch ? productMatch[1].split(' OR ') : [];
    
    // Generate simulated results
    const results: SearchResult[] = [];
    
    // Base number of results on query components
    const resultCount = Math.floor(Math.random() * 3) + 1; // 1-3 results
    
    for (let i = 0; i < resultCount; i++) {
      const product = productTerms.length > 0 
        ? productTerms[Math.floor(Math.random() * productTerms.length)]
        : 'general goods';
        
      const rate = (Math.floor(Math.random() * 25) + 5).toFixed(1);
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 7)); // Within last week
      
      results.push({
        title: `New ${rate}% tariff on ${product} imports from ${country}`,
        description: `The government has announced new tariff rates on ${product} imports from ${country}, effective next month. The rate will increase to ${rate}%, which may impact trade relations.`,
        url: `https://example.com/news/${Date.now()}-${i}-${country.toLowerCase().replace(/\s+/g, '-')}`,
        source: sources && sources.length > 0 
          ? sources[Math.floor(Math.random() * sources.length)]
          : ['Bloomberg', 'Reuters', 'Financial Times', 'WSJ'][Math.floor(Math.random() * 4)],
        publishDate: date.toISOString(),
        content: `In a move that could affect international trade relations, the government has announced a new tariff rate of ${rate}% on ${product} imports from ${country}. The new rate will take effect starting next month, according to officials. Experts suggest this could impact various industries dependent on these imports, with potential price increases for consumers. The ${country} government has not yet issued an official response to these changes.`,
        tariffRate: parseFloat(rate),
        country: country,
        productCategory: product,
        confidence: 0.7 + (Math.random() * 0.25) // 0.7-0.95
      });
    }
    
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
      
    return `(US tariff OR trade policy) AND "${countryName}" AND (${productTerms}) ${extraTerms}`;
  }
}

// Export singleton instance (optional)
export const webSearchService = new WebSearchService({
  ontology: null as any, // This will be set after proper initialization
  searchFrequency: 10 * 60 * 1000
});
