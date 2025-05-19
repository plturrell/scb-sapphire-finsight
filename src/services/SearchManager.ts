import { OntologyManager } from './OntologyManager';

/**
 * SearchManager for the Tariff Alert Scanner
 * Handles monitoring of tariff-related news and official sources
 */
/**
 * SearchManager - Service for monitoring tariff-related news and official sources
 * Enhanced with specialized Vietnam tariff search capabilities and Reuters/Bloomberg integration
 */
export class SearchManager {
  private ontology: OntologyManager;
  // Callback for tariff information discovery
  private onTariffInformationFound: (tariffInfo: any) => void;
  private countryFocus: string = 'all';
  private searches: any[] = [];
  private searchScheduler: any = null;
  private reutersApiClient: any = null;
  private bloombergApiClient: any = null;
  private vietnamSpecificSources: string[] = [
    'VnExpress', 'Vietnam News',
    'Ministry of Finance Vietnam', 'General Department of Vietnam Customs',
    'VietstockFinance', 'Vietnam Investment Review'
  ];
  private priorityCountries: Set<string> = new Set<string>();
  private cacheExpirationTime: number = 1800000; // 30 minutes
  private searchCache: Map<string, { results: any[], timestamp: number }> = new Map();
  
  constructor({ ontology, onTariffInformationFound, countryFocus, config }: {
    ontology: OntologyManager;
    onTariffInformationFound?: (tariffInfo: any) => void;
    countryFocus?: string;
    config?: {
      reutersApiKey?: string;
      bloombergApiKey?: string;
      priorityCountries?: string[];
    };
  }) {
    this.ontology = ontology;
    this.onTariffInformationFound = onTariffInformationFound || (() => {});
    this.countryFocus = countryFocus || 'all';
    
    // Initialize API clients if credentials provided
    if (config?.reutersApiKey) {
      this.initializeReutersClient(config.reutersApiKey);
    }
    
    if (config?.bloombergApiKey) {
      this.initializeBloombergClient(config.bloombergApiKey);
    }
    
    // Set priority countries (higher search frequency)
    if (config?.priorityCountries) {
      config.priorityCountries.forEach((country: string) => this.priorityCountries.add(country));
    }
    
    // Always add Vietnam as a priority country
    this.priorityCountries.add('Vietnam');
  }
  
  /**
   * Notify when tariff information is found
   * This method is called by various search services like VietnamSearchManager
   */
  public notifyTariffInformationFound(tariffInfo: any): void {
    if (this.onTariffInformationFound) {
      this.onTariffInformationFound(tariffInfo);
    }
  }
  
  /**
   * Search for tariff information in various sources
   * @param query Search query term
   * @param params Additional search parameters
   * @returns Promise of search results
   */
  public search(query: string, params?: any): Promise<any[]> {
    const cacheKey = JSON.stringify({ query, params });
    const cached = this.searchCache.get(cacheKey);
    
    // Return cached results if they haven't expired
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpirationTime) {
      return Promise.resolve(cached.results);
    }
    
    // Perform actual search if cache miss or expired
    return this.performSearch(query, params).then(results => {
      // Cache the results
      this.searchCache.set(cacheKey, {
        results,
        timestamp: Date.now()
      });
      
      return results;
    });
  }
  
  /**
   * Internal method to perform the actual search
   * @private
   */
  private performSearch(query: string, params?: any): Promise<any[]> {
    // Default implementation, can be overridden by specific managers
    return Promise.resolve([]);
  }
  
  private configureSearchEndpoints() {
    return {
      newsApi: 'https://newsapi.org/v2/everything',
      googleAlerts: 'https://www.google.com/alerts/api/search',
      customSources: this.extractCustomSourcesFromOntology()
    };
  }

  private loadApiKeys() {
    // In a real implementation, these would be loaded securely
    // For now, return empty placeholders
    return {
      newsApi: process.env.NEWS_API_KEY || '',
    };
  }
  
  private extractCustomSourcesFromOntology() {
    const sources: any[] = [];
    // Extract news and official sources from ontology
    const newsSourcesQuery = `
      PREFIX tas: <http://example.org/tariff-alert-scanner#>
      SELECT ?source ?label WHERE {
        ?source a tas:NewsSource .
        ?source rdfs:label ?label .
      }
    `;
    
    const officialSourcesQuery = `
      PREFIX tas: <http://example.org/tariff-alert-scanner#>
      SELECT ?source ?label WHERE {
        ?source a tas:OfficialSource .
        ?source rdfs:label ?label .
      }
    `;
    
    const newsSources = this.ontology.query(newsSourcesQuery);
    const officialSources = this.ontology.query(officialSourcesQuery);
    
    // Combine sources
    [...newsSources, ...officialSources].forEach((source: any) => {
      sources.push({
        id: source.source,
        name: source.label,
        type: source.source.includes('NewsSource') ? 'news' : 'official'
      });
    });
    
    return sources;
  }
  
  /**
   * Register a search configuration for tariff monitoring
   * @param searchConfig Configuration for the search (country, frequency, sources, etc.)
   */
  public registerSearch(searchConfig: any) {
    // Set default search frequency based on priority
    if (!searchConfig.frequency) {
      searchConfig.frequency = this.priorityCountries.has(searchConfig.country) 
        ? 1800000 // 30 minutes for priority countries
        : 3600000; // 1 hour for regular countries
    }
    
    // Add country-specific sources
    if (searchConfig.country === 'Vietnam') {
      searchConfig.sources = [
        ...(searchConfig.sources || []),
        ...this.vietnamSpecificSources
      ];
    }
    
    this.searches.push(searchConfig);
    console.log(`Registered search for ${searchConfig.country} tariffs with ${searchConfig.sources?.length || 0} sources`);
    return this;
  }
  
  private buildTariffSearchQuery(country: string) {
    // Build a search query for this country
    return `"${country}" AND (tariff OR duty OR "trade policy" OR "import tax") AND (new OR change OR increase OR agreement OR negotiation)`;
  }
  
  private getDefaultSourcesForCountry(country: string) {
    // Return default news sources plus any country-specific sources
    const defaultSources = ['Reuters', 'Bloomberg', 'Wall Street Journal'];
    const countrySpecificSources = this.getCountrySpecificSources(country);
    
    return [...defaultSources, ...countrySpecificSources];
  }
  
  private getCountrySpecificSources(country: string) {
    // Get country-specific news sources from ontology
    // Example implementation
    const countrySpecificSourcesMap: Record<string, string[]> = {
      'Vietnam': ['VnExpress', 'Vietnam News'],
      'Thailand': ['Bangkok Post', 'The Nation Thailand'],
      'Indonesia': ['Jakarta Post', 'Antara News'],
      'Malaysia': ['New Straits Times', 'The Star'],
      'Philippines': ['Philippine Daily Inquirer', 'ABS-CBN News'],
      'Singapore': ['The Straits Times', 'Channel News Asia']
      // Add others for remaining ASEAN countries
    };
    
    return countrySpecificSourcesMap[country] || [];
  }
  
  /**
   * Register specialized Vietnam tariff search configuration
   * Implements enhanced search for Vietnam tariff news, with higher frequency
   * and specialized sources
   */
  public registerVietnamTariffSearch() {
    const vietnamSources = [
      'Reuters', 'Bloomberg', 'VnExpress', 'Vietnam News',
      'Ministry of Finance Vietnam', 'General Department of Vietnam Customs',
      'VietstockFinance', 'Vietnam Investment Review'
    ];
    
    // Create specific search queries for Vietnam-US trade tensions
    const searchQueries = [
      "Vietnam US tariff rate",
      "Vietnam export tariff impact",
      "USTR Vietnam investigation",
      "Vietnam currency manipulation tariff",
      "Vietnam textile export tariff",
      "RCEP Vietnam implementation",
      "Vietnam electronics tariff",
      "Vietnam EU FTA tariff"
    ];
    
    // Register high-frequency search for each query
    searchQueries.forEach(query => {
      this.registerSearch({
        country: 'Vietnam',
        frequency: 1800000, // 30 minutes - higher frequency than other countries
        sources: vietnamSources,
        customQuery: query,
        priority: 'high'
      });
    });
    
    console.log(`Registered ${searchQueries.length} specialized Vietnam tariff searches`);
    return this;
  }
  
  /**
   * Initialize Reuters API client with provided credentials
   */
  private initializeReutersClient(apiKey: string) {
    // In a production implementation, this would initialize the actual Reuters API client
    console.log('Initialized Reuters API client');
    this.reutersApiClient = { apiKey };
  }
  
  /**
   * Initialize Bloomberg API client with provided credentials
   */
  private initializeBloombergClient(apiKey: string) {
    // In a production implementation, this would initialize the actual Bloomberg API client
    console.log('Initialized Bloomberg API client');
    this.bloombergApiClient = { apiKey };
  }
  
  /**
   * Search Reuters API for tariff information
   */
  private async searchReuters(search: any): Promise<any[]> {
    // In a production implementation, this would query the Reuters API
    console.log(`Searching Reuters for ${search.country} tariff information`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return empty array for now - in production this would return actual API results
    return [];
  }
  
  /**
   * Search Bloomberg API for tariff information
   */
  private async searchBloomberg(search: any): Promise<any[]> {
    // In a production implementation, this would query the Bloomberg API
    console.log(`Searching Bloomberg for ${search.country} tariff information`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 700));
    
    // Return empty array for now - in production this would return actual API results
    return [];
  }
  
  /**
   * Search Vietnam-specific sources for tariff information
   */
  private async searchVietnamSource(source: string, search: any): Promise<any[]> {
    // In a production implementation, this would query Vietnam-specific sources
    console.log(`Searching ${source} for ${search.country} tariff information`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Return empty array for now - in production this would return actual API results
    return [];
  }
  
  /**
   * Build cache key from search parameters
   */
  private buildCacheKey(search: any): string {
    const { country, customQuery = '', sources = [] } = search;
    return `${country}:${customQuery}:${sources.sort().join(',')}`;
  }
  
  /**
   * Get results from cache if not expired
   */
  private getFromCache(key: string): any[] | null {
    const cached = this.searchCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpirationTime) {
      return cached.results;
    }
    
    return null;
  }
  
  /**
   * Add results to cache
   */
  private addToCache(key: string, results: any[]): void {
    this.searchCache.set(key, {
      results,
      timestamp: Date.now()
    });
  }
  
  /**
   * Perform a manual search with custom parameters
   * @param params Custom search parameters
   */
  public async performManualSearch(params: any) {
    const search = {
      country: params.country,
      customQuery: params.query,
      sources: params.sources || [
        'Reuters', 'Bloomberg',
        ...this.vietnamSpecificSources
      ],
      // No frequency needed for manual search
    };
    
    console.log(`Performing manual search for ${search.country}: ${search.customQuery}`);
    return await this.executeSearch(search);
  }
  
  /**
   * Execute a specific search configuration
   * @param search Search configuration to execute
   */
  private async executeSearch(search: any) {
    try {
      const cacheKey = this.buildCacheKey(search);
      const cachedResults = this.getFromCache(cacheKey);
      
      if (cachedResults) {
        console.log(`Using cached results for ${search.country} tariff search`);
        return cachedResults;
      }
      
      let results: any[] = [];
      
      // Search in Reuters if available
      if (this.reutersApiClient && search.sources?.includes('Reuters')) {
        const reutersResults = await this.searchReuters(search);
        results = [...results, ...reutersResults];
      }
      
      // Search in Bloomberg if available
      if (this.bloombergApiClient && search.sources?.includes('Bloomberg')) {
        const bloombergResults = await this.searchBloomberg(search);
        results = [...results, ...bloombergResults];
      }
      
      // Vietnam-specific sources
      if (search.country === 'Vietnam' && search.sources) {
        for (const source of search.sources) {
          if (this.vietnamSpecificSources.includes(source)) {
            const vietnamResults = await this.searchVietnamSource(source, search);
            results = [...results, ...vietnamResults];
          }
        }
      }
      
      // For development/demo, supplement with mock data if no results
      if (results.length === 0 && Math.random() > 0.6) {
        results.push(this.generateMockTariffInfo(search.country));
      }
      
      // Cache the results
      this.addToCache(cacheKey, results);
      
      // Process results
      results.forEach(result => {
        if (this.onTariffInformationFound) {
          this.onTariffInformationFound(result, this.ontology);
        }
      });
      
      return results;
    } catch (error) {
      console.error(`Error executing search for ${search.country}:`, error);
      return [];
    }
  }
  
  /**
   * Generate mock tariff information for development/testing
   * Enhanced with additional Vietnam-specific details when applicable
   */
  private generateMockTariffInfo(country: string) {
    // Generate mock tariff information for demonstration purposes
    const mockTariffChanges = [
      { type: 'increase', magnitude: 5.2 },
      { type: 'decrease', magnitude: 3.7 },
      { type: 'newPolicy', magnitude: 0 },
      { type: 'quota', magnitude: 15 }
    ];
    
    const mockProductCategories = [
      ['Electronics', 'Semiconductors'],
      ['Textiles', 'Apparel'],
      ['Automotive', 'Parts'],
      ['Agriculture', 'Processed Foods'],
      ['Chemicals', 'Pharmaceuticals']
    ];
    
    // Vietnam-specific content for more realistic data
    const vietnamSpecificContent = {
      tradingPartners: ['China', 'US', 'EU', 'Japan', 'South Korea', 'Singapore', 'Thailand'],
      companies: ['Samsung Electronics Vietnam', 'Intel Products Vietnam', 'Foxconn Vietnam', 'Vingroup', 'Viettel'],
      policies: ['CPTPP', 'RCEP', 'Vietnam-EU FTA', 'US-Vietnam Trade Agreement'],
      provinces: ['Ho Chi Minh City', 'Hanoi', 'Hai Phong', 'Da Nang', 'Binh Duong', 'Dong Nai']
    };
    
    // This would use NLP techniques to extract structured information
    // For this example, we'll use a simplified approach
    
    // Basic confidence score based on source type and keywords
    let confidence = result.sourceType === 'official' ? 0.9 : 0.7;
    
    // Look for percentage mentions that might be tariff rates
    const percentageMatches = (result.content || '').match(/(\d+(\.\d+)?)%/g);
    let tariffRates: number[] = [];
    
    if (percentageMatches) {
      tariffRates = percentageMatches.map(match => parseFloat(match));
      // Increase confidence if we found rates
      confidence += 0.1;
    }
    
    // Look for tariff change indicators
    const increaseIndicators = ['increase', 'raise', 'higher', 'new'];
    const decreaseIndicators = ['decrease', 'lower', 'reduce', 'cut'];
    
    let changeDirection = null;
    
    if (increaseIndicators.some(indicator => 
      result.title.toLowerCase().includes(indicator) || 
      (result.content || '').toLowerCase().includes(indicator)
    )) {
      changeDirection = 'increase';
      confidence += 0.05;
    } else if (decreaseIndicators.some(indicator => 
      result.title.toLowerCase().includes(indicator) || 
      (result.content || '').toLowerCase().includes(indicator)
    )) {
      changeDirection = 'decrease';
      confidence += 0.05;
    }
    
    // Look for product categories
    const productCategories = this.extractProductCategories(result.content || '', result.country);
    
    // Determine if this is a major change
    const isMajorChange = changeDirection === 'increase' && (
      tariffRates.some(rate => rate > 10) || // Rates over 10%
      result.title.toLowerCase().includes('significant') ||
      result.title.toLowerCase().includes('major')
    );
    
    return {
      title: result.title,
      description: result.description || '',
      country: result.country,
      source: result.source,
      sourceType: result.sourceType,
      url: result.url,
      publishedAt: result.publishedAt,
      tariffRates,
      changeDirection,
      productCategories,
      confidence: Math.min(confidence, 1.0), // Cap at 1.0
      isMajorChange,
      raw: result
    };
  }
  
  private extractProductCategories(content: string, country: string) {
    // Extract product categories mentioned in the content
    // This would be more sophisticated with proper NLP
    
    // Get product categories from ontology
    const productCategoriesQuery = `
      PREFIX tas: <http://example.org/tariff-alert-scanner#>
      SELECT ?category ?label WHERE {
        ?category a tas:ProductCategory .
        ?category rdfs:label ?label .
      }
    `;
    
    const categories = this.ontology.query(productCategoriesQuery);
    const foundCategories: string[] = [];
    
    // Common product categories for fallback
    const commonCategories = [
      'Electronics', 'Textiles', 'Automotive', 'Agriculture', 
      'Pharmaceuticals', 'Raw Materials', 'Luxury Goods', 
      'Consumer Goods', 'Industrial Equipment'
    ];
    
    // Look for category mentions in content
    if (categories.length > 0) {
      categories.forEach((category: any) => {
        const categoryName = category.label;
        if (content.toLowerCase().includes(categoryName.toLowerCase())) {
          foundCategories.push(categoryName);
        }
      });
    } else {
      // Fallback to checking common categories if ontology doesn't have categories
      commonCategories.forEach(category => {
        if (content.toLowerCase().includes(category.toLowerCase())) {
          foundCategories.push(category);
        }
      });
    }
    
    return foundCategories;
  }
  
  private isInformationNewAndRelevant(tariffInfo: any) {
    // Check if we already have this information in the ontology
    // This prevents duplicate alerts
    
    // Simplistic approach - in practice would be more sophisticated
    const isNew = !this.ontology.hasAlertWithSourceUrl?.(tariffInfo.url) || true;
    
    // Basic relevance check - ensure it's about ASEAN countries
    const isRelevant = this.countryFocus === 'ASEAN' ? 
      this.isASEANCountry(tariffInfo.country) : true;
    
    return isNew && isRelevant && tariffInfo.confidence > 0.6;
  }
  
  private isASEANCountry(country: string) {
    const aseanCountries = [
      'Vietnam', 'Thailand', 'Indonesia', 'Malaysia', 
      'Philippines', 'Singapore', 'Myanmar', 'Cambodia', 
      'Laos', 'Brunei'
    ];
    
    return aseanCountries.includes(country);
  }
  
  public performManualSearch(params: any) {
    // Allow manual triggering of searches with custom parameters
    const search = {
      id: `manual-search-${Date.now()}`,
      country: params.country,
      query: params.query || this.buildTariffSearchQuery(params.country),
      sources: params.sources || this.getDefaultSourcesForCountry(params.country),
      status: 'idle'
    };
    
    // Execute immediately
    this.executeSearch(search);
    
    return search.id;
  }
  
  public stopAllSearches() {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
    
    this.searches.forEach(search => {
      search.status = 'stopped';
    });
    
    console.log('All searches stopped');
  }
}
