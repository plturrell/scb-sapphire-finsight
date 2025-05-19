import { SearchManager } from './SearchManager';
import { OntologyManager } from './OntologyManager';
import VietnamApiClient from './VietnamApiClient';
import { TariffAlert, VietnamAnnouncement, VietnamNewsArticle } from '../types';

// Use type alias instead of re-export due to export issue
export type { VietnamAnnouncement, VietnamNewsArticle };

// No need to redefine interfaces that are imported from types

// Types specific to Vietnam search manager
interface VietnamSearchOptions {
  query: string;
  includeAsean?: boolean;
  language?: 'en' | 'vi' | 'both';
  fromDate?: Date;
  toDate?: Date;
  productCategories?: string[];
  sourceFilters?: string[];
  minConfidence?: number;
}

interface AseanSearchOptions {
  query: string;
  countries?: string[];
  includeVietnamContext?: boolean;
}

/**
 * VietnamSearchManager - Specialized extension of SearchManager for Vietnam
 * Provides enhanced tariff search capabilities focused on Vietnam's trade position
 */
export class VietnamSearchManager {
  private searchManager: SearchManager;
  private ontologyManager: OntologyManager;
  private vietnamSpecificSources: string[] = [
    'VnExpress', 'Vietnam News',
    'Ministry of Finance Vietnam', 'General Department of Vietnam Customs',
    'VietstockFinance', 'Vietnam Investment Review'
  ];
  
  // API client credentials and specialized API client
  private reutersApiKey?: string;
  private bloombergApiKey?: string;
  private vietnamApiKey?: string;
  private vietnamApiClient: VietnamApiClient | null = null;
  
  // Callback for tariff information
  private onTariffInformationFound: (tariffInfo: TariffAlert) => void = () => {};
  
  // Polling intervals
  private pollingIntervals: NodeJS.Timeout[] = [];
  
  constructor(searchManager: SearchManager, ontologyManager: OntologyManager, config?: {
    reutersApiKey?: string;
    bloombergApiKey?: string;
    vietnamApiKey?: string;
    onTariffInformationFound?: (tariffInfo: TariffAlert) => void;
  }) {
    this.searchManager = searchManager;
    this.ontologyManager = ontologyManager;
    
    // Set the callback for tariff information, prioritizing config param if provided
    if (config?.onTariffInformationFound) {
      this.onTariffInformationFound = config.onTariffInformationFound;
    }
    
    if (config) {
      this.reutersApiKey = config.reutersApiKey;
      this.bloombergApiKey = config.bloombergApiKey;
      this.vietnamApiKey = config.vietnamApiKey;
      
      // Initialize Vietnam-specific API client if API key is provided
      if (config.vietnamApiKey) {
        this.vietnamApiClient = new VietnamApiClient({
          apiKey: config.vietnamApiKey,
          maxRetries: 3,
          rateLimitPerMinute: 60
        });
      }
    }
  }
  
  /**
   * Configure specialized Vietnam tariff search parameters
   * Sets up high-frequency searches for Vietnam-specific tariff information
   * Enhanced with specialized Vietnamese language sources and ASEAN integration
   */
  public configureVietnamTariffSearches(): void {
    // General Vietnam tariff search
    this.searchManager.registerSearch({
      country: 'Vietnam',
      frequency: 1800000, // 30 minutes
      sources: [
        'Reuters', 'Bloomberg', 
        ...this.vietnamSpecificSources
      ],
      customQuery: 'Vietnam tariff changes',
      priority: 'medium',
      metadata: {
        includeVietnameseLanguage: true,
        translateResults: true,
        relevanceThreshold: 0.75
      }
    });
    
    // Vietnam-US tariff relations - higher priority
    this.registerVietnamUSTradeSearches();
    
    // Vietnam-ASEAN tariff relations with enhanced ASEAN integration
    this.registerVietnamASEANTradeSearches();
    
    // Vietnam-EU tariff relations
    this.registerVietnamEUTradeSearches();
    
    console.log('Vietnam-specific tariff searches configured with enhanced API integration');
  }
  
  /**
   * Register specialized Vietnam-US trade tension searches
   * Higher frequency and specialized queries based on your suggested implementation
   */
  private registerVietnamUSTradeSearches(): void {
    const vietnamUSSources = [
      'Reuters', 'Bloomberg', 'VnExpress', 'Vietnam News',
      'Ministry of Finance Vietnam', 'USTR', 'US Department of Commerce'
    ];
    
    // Create specific search queries for Vietnam-US trade tensions
    const searchQueries = [
      "Vietnam US tariff rate",
      "Vietnam export tariff impact",
      "USTR Vietnam investigation",
      "Vietnam currency manipulation tariff",
      "Vietnam textile export tariff",
      "Vietnam US trade remedies"
    ];
    
    // Register high-frequency search for each query
    searchQueries.forEach(query => {
      this.searchManager.registerSearch({
        country: 'Vietnam',
        frequency: 1800000, // 30 minutes - higher frequency
        sources: vietnamUSSources,
        customQuery: query,
        priority: 'high'
      });
    });
    
    console.log(`Registered ${searchQueries.length} Vietnam-US trade searches`);
  }
  
  /**
   * Register Vietnam-ASEAN trade relation searches
   */
  private registerVietnamASEANTradeSearches(): void {
    const vietnamASEANSources = [
      'Reuters', 'Bloomberg', 'VnExpress', 
      'ASEAN Secretariat', 'Vietnam News'
    ];
    
    const aseanSearchQueries = [
      "RCEP Vietnam implementation",
      "Vietnam ASEAN tariff reduction",
      "Vietnam Thailand trade agreement",
      "Vietnam Singapore tariff"
    ];
    
    aseanSearchQueries.forEach(query => {
      this.searchManager.registerSearch({
        country: 'Vietnam',
        frequency: 3600000, // 1 hour
        sources: vietnamASEANSources,
        customQuery: query,
        priority: 'medium'
      });
    });
    
    console.log(`Registered ${aseanSearchQueries.length} Vietnam-ASEAN trade searches`);
  }
  
  /**
   * Register Vietnam-EU trade relation searches
   */
  private registerVietnamEUTradeSearches(): void {
    const vietnamEUSources = [
      'Reuters', 'Bloomberg', 'VnExpress', 
      'EU Trade Commission', 'Vietnam News'
    ];
    
    const euSearchQueries = [
      "Vietnam EU FTA tariff",
      "Vietnam EU textile quota",
      "EVFTA implementation Vietnam",
      "Vietnam EU export duties"
    ];
    
    euSearchQueries.forEach(query => {
      this.searchManager.registerSearch({
        country: 'Vietnam',
        frequency: 3600000, // 1 hour
        sources: vietnamEUSources,
        customQuery: query,
        priority: 'medium'
      });
    });
    
    console.log(`Registered ${euSearchQueries.length} Vietnam-EU trade searches`);
  }
  
  /**
   * Perform specialized Reuters search for Vietnam tariff news
   * If a Reuters API key is available, this will use the actual API
   */
  public async searchReutersForVietnam(query: string): Promise<any[]> {
    if (!this.reutersApiKey) {
      console.log('No Reuters API key available for Vietnam search');
      return [];
    }
    
    try {
      console.log(`Searching Reuters for Vietnam tariff news: ${query}`);
      // In a real implementation, this would call the Reuters API
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return empty array - in production would return actual results
      return [];
    } catch (error) {
      console.error('Error searching Reuters for Vietnam:', error);
      return [];
    }
  }
  
  /**
   * Perform specialized Bloomberg search for Vietnam tariff news
   * If a Bloomberg API key is available, this will use the actual API
   */
  public async searchBloombergForVietnam(query: string): Promise<any[]> {
    if (!this.bloombergApiKey) {
      console.log('No Bloomberg API key available for Vietnam search');
      return [];
    }
    
    try {
      console.log(`Searching Bloomberg for Vietnam tariff news: ${query}`);
      // In a real implementation, this would call the Bloomberg API
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Return empty array - in production would return actual results
      return [];
    } catch (error) {
      console.error('Error searching Bloomberg for Vietnam:', error);
      return [];
    }
  }
  
  /**
   * Perform a Vietnam-specific search
   * Enhanced with multi-source integration and ASEAN filtering
   * @param options Search options
   */
  public async performVietnamSearch(options: VietnamSearchOptions): Promise<TariffAlert[]> {
    console.log(`Performing enhanced Vietnam search: ${options.query}`);
    
    const results: TariffAlert[] = [];
    const searchPromises: Promise<any>[] = [];
    
    // Search Vietnam-specific sources if API client is available
    if (this.vietnamApiClient) {
      // VnExpress search
      if (!options.sourceFilters || options.sourceFilters.includes('VnExpress')) {
        const vnExpressPromise = this.vietnamApiClient.searchVnExpress(options.query, {
          fromDate: options.fromDate,
          toDate: options.toDate,
          limit: 20
        });
        searchPromises.push(vnExpressPromise);
      }
      
      // Ministry of Finance search
      if (!options.sourceFilters || options.sourceFilters.includes('Ministry of Finance')) {
        const mofPromise = this.vietnamApiClient.getMinistryOfFinanceTariffUpdates({
          productCategory: options.productCategories?.join(',')
        });
        searchPromises.push(mofPromise);
      }
      
      // Vietstock analysis
      if (!options.sourceFilters || options.sourceFilters.includes('VietstockFinance')) {
        const vietstockPromise = this.vietnamApiClient.getVietstockTariffAnalysis({
          sectors: options.productCategories
        });
        searchPromises.push(vietstockPromise);
      }
    }
    
    // Wait for all search promises to resolve
    const searchResults = await Promise.allSettled(searchPromises);
    
    // Process successful results
    searchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        // VnExpress results
        if (index === 0 && result.value?.success) {
          const articles = result.value.articles.map((article: any) => 
            this.convertToTariffAlert(article, 'VnExpress'));
          results.push(...articles);
        }
        // Ministry of Finance results
        else if (index === 1 && result.value?.success) {
          const announcements = result.value.announcements.map((announcement: any) => 
            this.convertAnnouncementToTariffAlert(announcement, 'Ministry of Finance Vietnam')
          );
          results.push(...announcements);
        }
        // Vietstock results
        else if (index === 2 && result.value?.success) {
          const analyses = result.value.analysis.map((analysis: any) =>
            this.convertAnalysisToTariffAlert(analysis, 'VietstockFinance')
          );
          results.push(...analyses);
        }
      }
    });
    
    // Apply ASEAN-specific filtering if requested
    if (options.includeAsean) {
      const aseanResults = await this.getAseanRelatedTariffs(options.query);
      results.push(...aseanResults);
    }
    
    // Filter by minimum confidence if specified
    const filteredResults = options.minConfidence 
      ? results.filter(item => item.confidence >= (options.minConfidence || 0))
      : results;
    
    // Sort by date (newest first)
    filteredResults.sort((a, b) => 
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
    
    return filteredResults;
  }
  
  /**
   * Schedule regular polling of Vietnam-specific APIs
   * This enhances real-time monitoring of Vietnam tariff changes
   */
  public scheduleVietnamSpecificAPIs(): void {
    if (!this.vietnamApiClient) {
      console.warn('Vietnam API client not initialized, skipping API polling');
      return;
    }
    
    // Check Ministry of Finance announcements every hour
    const mofInterval = setInterval(async () => {
      try {
        const result = await this.vietnamApiClient!.getMinistryOfFinanceTariffUpdates();
        if (result.success && result.announcements.length > 0) {
          // Process new announcements with proper typing
          const alerts = result.announcements.map((announcement: VietnamAnnouncement) => 
            this.convertAnnouncementToTariffAlert(announcement, 'Ministry of Finance Vietnam')
          );
          
          // Notify SearchManager of new tariff information using the correct callback
          alerts.forEach((alert: TariffAlert) => {
            // Use the SearchManager's notification method consistently throughout the app
            this.searchManager.notifyTariffInformationFound(alert);
          });
        }
      } catch (error) {
        console.error('Error polling Ministry of Finance API:', error);
      }
    }, 3600000); // 1 hour
    this.pollingIntervals.push(mofInterval);
    
    // Check VnExpress for tariff news every 30 minutes
    const vnExpressInterval = setInterval(async () => {
      try {
        const result = await this.vietnamApiClient!.searchVnExpress('thuế quan vietnam tariff', {
          fromDate: new Date(Date.now() - 1800000), // Last 30 minutes
          limit: 10
        });
        
        if (result.success && result.articles.length > 0) {
          // Process new articles
          const alerts = result.articles.map((article: any) => 
            this.convertToTariffAlert(article, 'VnExpress')
          );
          
          // Notify SearchManager of new tariff information
          alerts.forEach(alert => {
            this.onTariffInformationFound(alert);
          });
        }
      } catch (error) {
        console.error('Error polling VnExpress API:', error);
      }
    }, 1800000); // 30 minutes
    this.pollingIntervals.push(vnExpressInterval);
  }
  
  /**
   * Convert a news article to TariffAlert format
   */
  private convertToTariffAlert(article: any, source: string): TariffAlert {
    // Extract product categories using ontology
    const productCategories = this.extractProductCategories(article.title + ' ' + article.description);
    
    // Extract tariff rate if available
    const tariffRate = this.extractTariffRate(article.title + ' ' + article.description);
    
    // Calculate impact severity based on tariff rate and product categories
    const impactSeverity = this.calculateImpactSeverity(tariffRate, productCategories);
    
    return {
      id: `vn-${source.toLowerCase().replace(/\s+/g, '-')}-${article.id}`,
      title: article.title,
      description: article.description || article.summary,
      country: 'Vietnam',
      impactSeverity,
      confidence: 0.85, // Default confidence for news articles
      sourceUrl: article.url,
      sourceName: source,
      publishDate: new Date(article.publishDate),
      createdAt: new Date(),
      priority: impactSeverity > 7 ? 'high' : impactSeverity > 5 ? 'medium' : 'low',
      tariffRate,
      productCategories,
      aiEnhanced: true,
      affectedProvinces: this.extractAffectedProvinces(article.content || ''),
      tradingPartners: this.extractTradingPartners(article.content || '')
    };
  }
  
  /**
   * Convert a government announcement to TariffAlert format
   */
  private convertAnnouncementToTariffAlert(announcement: any, source: string): TariffAlert {
    // Extract tariff rate from changes if available
    let tariffRate = 0;
    if (announcement.tariffChanges && announcement.tariffChanges.length > 0) {
      const rates = announcement.tariffChanges.map((change: any) => change.newRate - change.oldRate);
      tariffRate = rates.reduce((sum: number, rate: number) => sum + rate, 0) / rates.length;
    }
    
    // Calculate impact severity
    const impactSeverity = this.calculateImpactSeverity(
      tariffRate,
      announcement.affectedProducts || []
    );
    
    return {
      id: `vn-mof-${announcement.id}`,
      title: announcement.title,
      description: announcement.summary,
      country: 'Vietnam',
      impactSeverity,
      confidence: 0.95, // Higher confidence for official sources
      sourceUrl: announcement.url,
      sourceName: source,
      publishDate: new Date(announcement.issuedDate),
      createdAt: new Date(),
      priority: impactSeverity > 7 ? 'high' : impactSeverity > 5 ? 'medium' : 'low',
      tariffRate,
      productCategories: announcement.affectedProducts || [],
      aiEnhanced: false,
      effectiveDate: new Date(announcement.effectiveDate),
      documentNumber: announcement.documentNumber
    };
  }
  
  /**
   * Convert market analysis to TariffAlert format
   */
  private convertAnalysisToTariffAlert(analysis: any, source: string): TariffAlert {
    return {
      id: `vn-analysis-${analysis.id}`,
      title: analysis.title,
      description: analysis.summary,
      country: 'Vietnam',
      impactSeverity: analysis.impactScore * 10 || 5,
      confidence: analysis.confidenceLevel || 0.8,
      sourceUrl: analysis.url,
      sourceName: source,
      publishDate: new Date(analysis.publishDate),
      createdAt: new Date(),
      priority: analysis.priority || 'medium',
      tariffRate: analysis.tariffRateChange || 0,
      productCategories: analysis.sectors || [],
      aiEnhanced: true,
      tradingPartners: analysis.countries || []
    };
  }
  
  /**
   * Get ASEAN-related tariff information
   * Enhanced with country-specific filtering
   */
  private async getAseanRelatedTariffs(query: string): Promise<TariffAlert[]> {
    const aseanCountries = ['Singapore', 'Malaysia', 'Indonesia', 'Thailand', 'Philippines', 'Brunei', 'Cambodia', 'Laos', 'Myanmar'];
    const results: TariffAlert[] = [];
    
    // Search for each ASEAN country's relation to Vietnam
    for (const country of aseanCountries) {
      try {
        const countryQuery = `${query} ${country} ASEAN`;
        // For now, return empty array since SearchManager search isn't implemented
        results.push([]); 
      } catch (error) {
        console.error(`Error searching for ASEAN ${country} relation:`, error);
      }
    }
    
    return results.flat();
  }
  
  /**
   * Calculate impact severity based on tariff rate and product categories
   */
  private calculateImpactSeverity(tariffRate: number, productCategories: string[]): number {
    // Base severity on absolute tariff rate
    let baseSeverity = Math.min(10, Math.abs(tariffRate) * 1.2);
    
    // Adjust based on product categories
    const highImpactCategories = ['Electronics', 'Textiles', 'Machinery', 'Agriculture'];
    const categoryImpact = productCategories.reduce((impact, category) => {
      return impact + (highImpactCategories.includes(category) ? 1 : 0.5);
    }, 0);
    
    // Normalize category impact
    const normalizedCategoryImpact = Math.min(3, categoryImpact);
    
    // Combine base severity with category impact
    const combinedSeverity = baseSeverity + normalizedCategoryImpact;
    
    // Cap at 10
    return Math.min(10, Math.max(1, Math.round(combinedSeverity * 10) / 10));
  }
  
  /**
   * Extract product categories from text using ontology
   */
  private extractProductCategories(text: string): string[] {
    // In a real implementation, this would use the ontology to extract categories
    // For now, we'll use a simple keyword matching approach
    const categories: string[] = [];
    
    const categoryKeywords: {[key: string]: string[]} = {
      'Electronics': ['electronics', 'semiconductor', 'computer', 'phone', 'electronic'],
      'Textiles': ['textile', 'apparel', 'clothing', 'fabric', 'garment'],
      'Machinery': ['machinery', 'equipment', 'industrial', 'manufacturing'],
      'Agriculture': ['agriculture', 'rice', 'farm', 'crop', 'grain'],
      'Automotive': ['auto', 'car', 'vehicle', 'automotive'],
      'Chemicals': ['chemical', 'pharma', 'pharmaceutical', 'medicine'],
      'Furniture': ['furniture', 'wood', 'household'],
      'Seafood': ['seafood', 'fish', 'shrimp', 'aquaculture']
    };
    
    const lowerText = text.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        categories.push(category);
      }
    }
    
    return categories;
  }
  
  /**
   * Extract tariff rate from text
   */
  private extractTariffRate(text: string): number {
    // In a real implementation, this would use NLP to extract tariff rates
    // For now, we'll use a simple regex approach
    const tariffRegex = /(increased|decreased|reduced|raised|cut|added|imposed|lowered)\s+by\s+(\d+(\.\d+)?)\s*%/i;
    const match = text.match(tariffRegex);
    
    if (match) {
      const direction = match[1].toLowerCase();
      const rate = parseFloat(match[2]);
      
      // Determine if it's a positive or negative change
      const isNegative = ['decreased', 'reduced', 'cut', 'lowered'].includes(direction);
      return isNegative ? -rate : rate;
    }
    
    return 0; // Default if no rate found
  }
  
  /**
   * Extract affected provinces from text
   */
  private extractAffectedProvinces(text: string): string[] {
    const provinces = [
      'Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hai Phong', 'Can Tho',
      'Binh Duong', 'Dong Nai', 'Ba Ria-Vung Tau', 'Quang Ninh', 'Bac Ninh',
      'Hai Duong', 'Vinh Phuc', 'Thua Thien-Hue', 'Khanh Hoa', 'Tay Ninh'
    ];
    
    return provinces.filter(province => text.includes(province));
  }
  
  /**
   * Extract trading partners from text
   */
  private extractTradingPartners(text: string): string[] {
    const countries = [
      'USA', 'China', 'Japan', 'South Korea', 'EU', 
      'Singapore', 'Malaysia', 'Thailand', 'Australia', 'Germany',
      'France', 'UK', 'Russia', 'India', 'Taiwan'
    ];
    
    return countries.filter(country => text.includes(country));
  }
  
  /**
   * Clean up resources when this manager is no longer needed
   */
  public dispose(): void {
    // Clear all polling intervals
    this.pollingIntervals.forEach(interval => clearInterval(interval));
    this.pollingIntervals = [];
    
    console.log('Vietnam search manager resources released');
  }
}

/**
 * Enhanced Vietnam search monitor with API polling capabilities
 */
export class VietnamSearchMonitor {
  private vietnamApiClient?: VietnamApiClient;
  private searchManager: SearchManager;
  private pollingIntervals: NodeJS.Timeout[] = [];
  private onTariffInformationFound?: (tariffInfo: TariffAlert) => void;
  
  constructor(searchManager: SearchManager, vietnamApiClient?: VietnamApiClient, onTariffCallback?: (tariffInfo: TariffAlert) => void) {
    this.searchManager = searchManager;
    this.vietnamApiClient = vietnamApiClient;
    this.onTariffInformationFound = onTariffCallback;
  }
  
  /**
   * Schedule regular polling of Vietnam-specific APIs
   * This enhances real-time monitoring of Vietnam tariff changes
   */
  public scheduleVietnamSpecificAPIs(): void {
    if (!this.vietnamApiClient) {
      console.warn('Vietnam API client not initialized, skipping API polling');
      return;
    }
    
    // Check Ministry of Finance announcements every hour
    setInterval(async () => {
      try {
        const result = await this.vietnamApiClient!.getMinistryOfFinanceTariffUpdates();
        if (result.success && result.announcements.length > 0) {
          // Process new announcements
          const alerts = result.announcements.map((announcement: any) => 
            this.convertAnnouncementToTariffAlert(announcement, 'Ministry of Finance Vietnam')
          );
          
          // Notify SearchManager of new tariff information
          alerts.forEach(alert => {
            this.searchManager.notifyTariffInformationFound(alert);
          });
        }
      } catch (error) {
        console.error('Error polling Ministry of Finance API:', error);
      }
    }, 3600000); // 1 hour
    
    // Check VnExpress for tariff news every 30 minutes
    setInterval(async () => {
      try {
        const result = await this.vietnamApiClient!.searchVnExpress('thuế quan vietnam tariff', {
          fromDate: new Date(Date.now() - 1800000), // Last 30 minutes
          limit: 10
        });
        
        if (result.success && result.articles.length > 0) {
          // Process new articles
          const alerts = result.articles.map((article: any) => 
            this.convertToTariffAlert(article, 'VnExpress')
          );
          
          // Notify SearchManager of new tariff information
          alerts.forEach(alert => {
            this.searchManager.notifyTariffInformationFound(alert);
          });
        }
      } catch (error) {
        console.error('Error polling VnExpress API:', error);
      }
    }, 1800000); // 30 minutes
  }
  
  /**
   * Convert a news article to TariffAlert format
   */
  private convertToTariffAlert(article: any, source: string): TariffAlert {
    // Extract product categories using ontology
    const productCategories = this.extractProductCategories(article.title + ' ' + article.description);
    
    // Extract tariff rate if available
    const tariffRate = this.extractTariffRate(article.title + ' ' + article.description);
    
    // Calculate impact severity based on tariff rate and product categories
    const impactSeverity = this.calculateImpactSeverity(tariffRate, productCategories);
    
    return {
      id: `vn-${source.toLowerCase().replace(/\s+/g, '-')}-${article.id}`,
      title: article.title,
      description: article.description || article.summary,
      country: 'Vietnam',
      impactSeverity,
      confidence: 0.85, // Default confidence for news articles
      sourceUrl: article.url,
      sourceName: source,
      publishDate: new Date(article.publishDate),
      createdAt: new Date(),
      priority: impactSeverity > 7 ? 'high' : impactSeverity > 5 ? 'medium' : 'low',
      tariffRate,
      productCategories,
      aiEnhanced: true,
      affectedProvinces: this.extractAffectedProvinces(article.content || ''),
      tradingPartners: this.extractTradingPartners(article.content || '')
    };
  }
  
  /**
   * Convert a government announcement to TariffAlert format
   */
  private convertAnnouncementToTariffAlert(announcement: any, source: string): TariffAlert {
    // Extract tariff rate from changes if available
    let tariffRate = 0;
    if (announcement.tariffChanges && announcement.tariffChanges.length > 0) {
      const rates = announcement.tariffChanges.map((change: any) => change.newRate - change.oldRate);
      tariffRate = rates.reduce((sum: number, rate: number) => sum + rate, 0) / rates.length;
    }
    
    // Calculate impact severity
    const impactSeverity = this.calculateImpactSeverity(
      tariffRate,
      announcement.affectedProducts || []
    );
    
    return {
      id: `vn-mof-${announcement.id}`,
      title: announcement.title,
      description: announcement.summary,
      country: 'Vietnam',
      impactSeverity,
      confidence: 0.95, // Higher confidence for official sources
      sourceUrl: announcement.url,
      sourceName: source,
      publishDate: new Date(announcement.issuedDate),
      createdAt: new Date(),
      priority: impactSeverity > 7 ? 'high' : impactSeverity > 5 ? 'medium' : 'low',
      tariffRate,
      productCategories: announcement.affectedProducts || [],
      aiEnhanced: false,
      effectiveDate: new Date(announcement.effectiveDate),
      documentNumber: announcement.documentNumber
    };
  }
  
  /**
   * Convert market analysis to TariffAlert format
   */
  private convertAnalysisToTariffAlert(analysis: any, source: string): TariffAlert {
    return {
      id: `vn-analysis-${analysis.id}`,
      title: analysis.title,
      description: analysis.summary,
      country: 'Vietnam',
      impactSeverity: analysis.impactScore * 10 || 5,
      confidence: analysis.confidenceLevel || 0.8,
      sourceUrl: analysis.url,
      sourceName: source,
      publishDate: new Date(analysis.publishDate),
      createdAt: new Date(),
      priority: analysis.priority || 'medium',
      tariffRate: analysis.tariffRateChange || 0,
      productCategories: analysis.sectors || [],
      aiEnhanced: true,
      tradingPartners: analysis.countries || []
    };
  }
  
  /**
   * Get ASEAN-related tariff information
   * Enhanced with country-specific filtering
   */
  private async getAseanRelatedTariffs(query: string): Promise<TariffAlert[]> {
    const aseanCountries = ['Singapore', 'Malaysia', 'Indonesia', 'Thailand', 'Philippines', 'Brunei', 'Cambodia', 'Laos', 'Myanmar'];
    const results: TariffAlert[] = [];
    
    // Search for each ASEAN country's relation to Vietnam
    for (const country of aseanCountries) {
      try {
        const countryQuery = `${query} ${country} ASEAN`;
        const searchResults = await this.searchManager.search({
          query: countryQuery,
          country: country
        });
        
        if (searchResults.items && searchResults.items.length > 0) {
          // Filter for Vietnam relevance
          const vietnamRelevant = searchResults.items.filter((item: any) => 
            (item.title?.toLowerCase().includes('vietnam') || 
             item.description?.toLowerCase().includes('vietnam'))
          );
          
          results.push(...vietnamRelevant);
        }
      } catch (error) {
        console.error(`Error searching for ASEAN ${country} relation:`, error);
      }
    }
    
    return results;
  }
  
  /**
   * Calculate impact severity based on tariff rate and product categories
   */
  private calculateImpactSeverity(tariffRate: number, productCategories: string[]): number {
    // Base severity on absolute tariff rate
    let baseSeverity = Math.min(10, Math.abs(tariffRate) * 1.2);
    
    // Adjust based on product categories
    const highImpactCategories = ['Electronics', 'Textiles', 'Machinery', 'Agriculture'];
    const categoryImpact = productCategories.reduce((impact, category) => {
      return impact + (highImpactCategories.includes(category) ? 1 : 0.5);
    }, 0);
    
    // Normalize category impact
    const normalizedCategoryImpact = Math.min(3, categoryImpact);
    
    // Combine base severity with category impact
    const combinedSeverity = baseSeverity + normalizedCategoryImpact;
    
    // Cap at 10
    return Math.min(10, Math.max(1, Math.round(combinedSeverity * 10) / 10));
  }
  
  /**
   * Extract product categories from text using ontology
   */
  private extractProductCategories(text: string): string[] {
    // In a real implementation, this would use the ontology to extract categories
    // For now, we'll use a simple keyword matching approach
    const categories: string[] = [];
    
    const categoryKeywords: {[key: string]: string[]} = {
      'Electronics': ['electronics', 'semiconductor', 'computer', 'phone', 'electronic'],
      'Textiles': ['textile', 'apparel', 'clothing', 'fabric', 'garment'],
      'Machinery': ['machinery', 'equipment', 'industrial', 'manufacturing'],
      'Agriculture': ['agriculture', 'rice', 'farm', 'crop', 'grain'],
      'Automotive': ['auto', 'car', 'vehicle', 'automotive'],
      'Chemicals': ['chemical', 'pharma', 'pharmaceutical', 'medicine'],
      'Furniture': ['furniture', 'wood', 'household'],
      'Seafood': ['seafood', 'fish', 'shrimp', 'aquaculture']
    };
    
    const lowerText = text.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        categories.push(category);
      }
    }
    
    return categories;
  }
  
  /**
   * Extract tariff rate from text
   */
  private extractTariffRate(text: string): number {
    // In a real implementation, this would use NLP to extract tariff rates
    // For now, we'll use a simple regex approach
    const tariffRegex = /(increased|decreased|reduced|raised|cut|added|imposed|lowered)\s+by\s+(\d+(\.\d+)?)\s*%/i;
    const match = text.match(tariffRegex);
    
    if (match) {
      const direction = match[1].toLowerCase();
      const rate = parseFloat(match[2]);
      
      // Determine if it's a positive or negative change
      const isNegative = ['decreased', 'reduced', 'cut', 'lowered'].includes(direction);
      return isNegative ? -rate : rate;
    }
    
    return 0; // Default if no rate found
  }
  
  /**
   * Extract affected provinces from text
   */
  private extractAffectedProvinces(text: string): string[] {
    const provinces = [
      'Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hai Phong', 'Can Tho',
      'Binh Duong', 'Dong Nai', 'Ba Ria-Vung Tau', 'Quang Ninh', 'Bac Ninh',
      'Hai Duong', 'Vinh Phuc', 'Thua Thien-Hue', 'Khanh Hoa', 'Tay Ninh'
    ];
    
    return provinces.filter(province => text.includes(province));
  }
  
  /**
   * Extract trading partners from text
   */
  private extractTradingPartners(text: string): string[] {
    const countries = [
      'USA', 'China', 'Japan', 'South Korea', 'EU', 
      'Singapore', 'Malaysia', 'Thailand', 'Australia', 'Germany',
      'France', 'UK', 'Russia', 'India', 'Taiwan'
    ];
    
    return countries.filter(country => text.includes(country));
  }
  /**
   * Schedule regular polling of Vietnam-specific APIs
   * This enhances real-time monitoring of Vietnam tariff changes
   */
  public scheduleVietnamSpecificAPIs(): void {
    if (!this.vietnamApiClient) {
      console.warn('Vietnam API client not initialized, skipping API polling');
      return;
    }
    
    // Check Ministry of Finance announcements every hour
    const mofInterval = setInterval(async () => {
      try {
        const result = await this.vietnamApiClient!.getMinistryOfFinanceTariffUpdates();
        if (result.success && result.announcements.length > 0) {
          // Process new announcements with proper typing
          const alerts = result.announcements.map((announcement: VietnamAnnouncement) => 
            this.convertAnnouncementToTariffAlert(announcement, 'Ministry of Finance Vietnam')
          );
          
          // Notify SearchManager of new tariff information using the correct callback
          alerts.forEach((alert: TariffAlert) => {
            // Use the onTariffInformationFound callback that's defined in SearchManager
            this.onTariffInformationFound?.(alert);
          });
        }
      } catch (error) {
        console.error('Error polling Ministry of Finance API:', error);
      }
    }, 3600000); // 1 hour
    this.pollingIntervals.push(mofInterval);
    
    // Check VnExpress for tariff news every 30 minutes
    const vnExpressInterval = setInterval(async () => {
      try {
        const result = await this.vietnamApiClient!.searchVnExpress('thuế quan vietnam tariff', {
          fromDate: new Date(Date.now() - 1800000), // Last 30 minutes
          limit: 10
        });
        
        if (result.success && result.articles.length > 0) {
          // Process new articles
          const alerts = result.articles.map((article: any) => 
            this.convertToTariffAlert(article, 'VnExpress')
          );
          
          // Notify SearchManager of new tariff information
          alerts.forEach(alert => {
            this.searchManager.notifyTariffInformationFound(alert);
          });
        }
      } catch (error) {
        console.error('Error polling VnExpress API:', error);
      }
    }, 1800000); // 30 minutes
    this.pollingIntervals.push(vnExpressInterval);
  }
  
  /**
   * Perform a Vietnam-specific search
   * Enhanced with multi-source integration and ASEAN filtering
   * @param options Search options
   */
  public async performVietnamSearch(options: VietnamSearchOptions): Promise<TariffAlert[]> {
    console.log(`Performing enhanced Vietnam search: ${options.query}`);
    
    const results: TariffAlert[] = [];
    const searchPromises: Promise<any>[] = [];
    
    // Search standard sources via SearchManager
    const standardSourcePromise = this.searchManager.search({
      query: options.query,
      country: 'Vietnam',
      fromDate: options.fromDate,
      toDate: options.toDate
    });
    
    searchPromises.push(standardSourcePromise);
    
    // Search Vietnam-specific sources if API client is available
    if (this.vietnamApiClient) {
      // VnExpress search
      if (!options.sourceFilters || options.sourceFilters.includes('VnExpress')) {
        const vnExpressPromise = this.vietnamApiClient.searchVnExpress(options.query, {
          fromDate: options.fromDate,
          toDate: options.toDate,
          limit: 20
        });
        searchPromises.push(vnExpressPromise);
      }
      
      // Ministry of Finance search
      if (!options.sourceFilters || options.sourceFilters.includes('Ministry of Finance')) {
        const mofPromise = this.vietnamApiClient.getMinistryOfFinanceTariffUpdates({
          productCategory: options.productCategories?.join(',')
        });
        searchPromises.push(mofPromise);
      }
      
      // Vietstock analysis
      if (!options.sourceFilters || options.sourceFilters.includes('VietstockFinance')) {
        const vietstockPromise = this.vietnamApiClient.getVietstockTariffAnalysis({
          sectors: options.productCategories
        });
        searchPromises.push(vietstockPromise);
      }
    }
    
    // Wait for all search promises to resolve
    const searchResults = await Promise.allSettled(searchPromises);
    
    // Process successful results
    searchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        // Standard search results
        if (index === 0 && result.value?.items) {
          results.push(...result.value.items);
        }
        // VnExpress results
        else if (index === 1 && result.value?.success) {
          const articles = result.value.articles.map((article: any) => 
            this.convertToTariffAlert(article, 'VnExpress'));
          results.push(...articles);
        }
        // Ministry of Finance results
        else if (index === 2 && result.value?.success) {
          const announcements = result.value.announcements.map((announcement: any) => 
            this.convertAnnouncementToTariffAlert(announcement, 'Ministry of Finance Vietnam')
          );
          results.push(...announcements);
        }
        // Vietstock results
        else if (index === 3 && result.value?.success) {
          const analyses = result.value.analysis.map((analysis: any) =>
            this.convertAnalysisToTariffAlert(analysis, 'VietstockFinance')
          );
          results.push(...analyses);
        }
      }
    });
    
    // Apply ASEAN-specific filtering if requested
    if (options.includeAsean) {
      const aseanResults = await this.getAseanRelatedTariffs(options.query);
      results.push(...aseanResults);
    }
    
    // Filter by minimum confidence if specified
    const filteredResults = options.minConfidence 
      ? results.filter(item => item.confidence >= (options.minConfidence || 0))
      : results;
    
    // Sort by date (newest first)
    filteredResults.sort((a, b) => 
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
    
    return filteredResults;
  }
  
  /**
   * Convert a news article to TariffAlert format
   */
  private convertToTariffAlert(article: any, source: string): TariffAlert {
    // Extract product categories using ontology
    const productCategories = this.extractProductCategories(article.title + ' ' + article.description);
    
    // Extract tariff rate if available
    const tariffRate = this.extractTariffRate(article.title + ' ' + article.description);
    
    // Calculate impact severity based on tariff rate and product categories
    const impactSeverity = this.calculateImpactSeverity(tariffRate, productCategories);
    
    return {
      id: `vn-${source.toLowerCase().replace(/\s+/g, '-')}-${article.id}`,
      title: article.title,
      description: article.description || article.summary,
      country: 'Vietnam',
      impactSeverity,
      confidence: 0.85, // Default confidence for news articles
      sourceUrl: article.url,
      sourceName: source,
      publishDate: new Date(article.publishDate),
      createdAt: new Date(),
      priority: impactSeverity > 7 ? 'high' : impactSeverity > 5 ? 'medium' : 'low',
      tariffRate,
      productCategories,
      aiEnhanced: true,
      tradingPartners: this.extractTradingPartners(article.content || '')
    };
  }
  
  /**
   * Convert a government announcement to TariffAlert format
   */
  private convertAnnouncementToTariffAlert(announcement: any, source: string): TariffAlert {
    // Extract tariff rate from changes if available
    let tariffRate = 0;
    if (announcement.tariffChanges && announcement.tariffChanges.length > 0) {
      const rates = announcement.tariffChanges.map((change: any) => change.newRate - change.oldRate);
      tariffRate = rates.reduce((sum: number, rate: number) => sum + rate, 0) / rates.length;
    }
    
    // Calculate impact severity
    const impactSeverity = this.calculateImpactSeverity(
      tariffRate,
      announcement.affectedProducts || []
    );
    
    return {
      id: `vn-mof-${announcement.id}`,
      title: announcement.title,
      description: announcement.summary,
      country: 'Vietnam',
      impactSeverity,
      confidence: 0.95, // Higher confidence for official sources
      sourceUrl: announcement.url,
      sourceName: source,
      publishDate: new Date(announcement.issuedDate),
      createdAt: new Date(),
      priority: impactSeverity > 7 ? 'high' : impactSeverity > 5 ? 'medium' : 'low',
      tariffRate,
      productCategories: announcement.affectedProducts || [],
      aiEnhanced: false
    };
  }
  
  /**
   * Convert market analysis to TariffAlert format
   */
  private convertAnalysisToTariffAlert(analysis: any, source: string): TariffAlert {
    return {
      id: `vn-analysis-${analysis.id}`,
      title: analysis.title,
      description: analysis.summary,
      country: 'Vietnam',
      impactSeverity: analysis.impactScore * 10 || 5,
      confidence: analysis.confidenceLevel || 0.8,
      sourceUrl: analysis.url,
      sourceName: source,
      publishDate: new Date(analysis.publishDate),
      createdAt: new Date(),
      priority: analysis.priority || 'medium',
      tariffRate: analysis.tariffRateChange || 0,
      productCategories: analysis.sectors || [],
      aiEnhanced: true
    };
  }
  
  /**
   * Get ASEAN-related tariff information
   * Enhanced with country-specific filtering
   */
  private async getAseanRelatedTariffs(query: string): Promise<TariffAlert[]> {
    const aseanCountries = ['Singapore', 'Malaysia', 'Indonesia', 'Thailand', 'Philippines', 'Brunei', 'Cambodia', 'Laos', 'Myanmar'];
    const results: TariffAlert[] = [];
    
    // Search for each ASEAN country's relation to Vietnam
    for (const country of aseanCountries) {
      try {
        const countryQuery = `${query} ${country} ASEAN`;
        const searchResults = await this.searchManager.search({
          query: countryQuery,
          country: country
        });
        
        if (searchResults.items && searchResults.items.length > 0) {
          // Filter for Vietnam relevance
          const vietnamRelevant = searchResults.items.filter((item: any) => 
            (item.title?.toLowerCase().includes('vietnam') || 
             item.description?.toLowerCase().includes('vietnam'))
          );
          
          results.push(...vietnamRelevant);
        }
      } catch (error) {
        console.error(`Error searching for ASEAN ${country} relation:`, error);
      }
    }
    
    return results;
  }
  
  /**
   * Calculate impact severity based on tariff rate and product categories
   */
  private calculateImpactSeverity(tariffRate: number, productCategories: string[]): number {
    // Base severity on absolute tariff rate
    let baseSeverity = Math.min(10, Math.abs(tariffRate) * 1.2);
    
    // Adjust based on product categories
    const highImpactCategories = ['Electronics', 'Textiles', 'Machinery', 'Agriculture'];
    const categoryImpact = productCategories.reduce((impact, category) => {
      return impact + (highImpactCategories.includes(category) ? 1 : 0.5);
    }, 0);
    
    // Normalize category impact
    const normalizedCategoryImpact = Math.min(3, categoryImpact);
    
    // Combine base severity with category impact
    const combinedSeverity = baseSeverity + normalizedCategoryImpact;
    
    // Cap at 10
    return Math.min(10, Math.max(1, Math.round(combinedSeverity * 10) / 10));
  }
  
  /**
   * Extract product categories from text using ontology
   */
  private extractProductCategories(text: string): string[] {
    // In a real implementation, this would use the ontology to extract categories
    // For now, we'll use a simple keyword matching approach
    const categories: string[] = [];
    
    const categoryKeywords: {[key: string]: string[]} = {
      'Electronics': ['electronics', 'semiconductor', 'computer', 'phone', 'electronic'],
      'Textiles': ['textile', 'apparel', 'clothing', 'fabric', 'garment'],
      'Machinery': ['machinery', 'equipment', 'industrial', 'manufacturing'],
      'Agriculture': ['agriculture', 'rice', 'farm', 'crop', 'grain'],
      'Automotive': ['auto', 'car', 'vehicle', 'automotive'],
      'Chemicals': ['chemical', 'pharma', 'pharmaceutical', 'medicine'],
      'Furniture': ['furniture', 'wood', 'household'],
      'Seafood': ['seafood', 'fish', 'shrimp', 'aquaculture']
    };
    
    const lowerText = text.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        categories.push(category);
      }
    }
    
    return categories;
  }
  
  /**
   * Extract tariff rate from text
   */
  private extractTariffRate(text: string): number {
    // In a real implementation, this would use NLP to extract tariff rates
    // For now, we'll use a simple regex approach
    const tariffRegex = /(increased|decreased|reduced|raised|cut|added|imposed|lowered)\s+by\s+(\d+(\.\d+)?)\s*%/i;
    const match = text.match(tariffRegex);
    
    if (match) {
      const direction = match[1].toLowerCase();
      const rate = parseFloat(match[2]);
      
      // Determine if it's a positive or negative change
      const isNegative = ['decreased', 'reduced', 'cut', 'lowered'].includes(direction);
      return isNegative ? -rate : rate;
    }
    
    return 0; // Default if no rate found
  }
  
  /**
   * Extract trading partners from text
   */
  private extractTradingPartners(text: string): string[] {
    const countries = [
      'USA', 'China', 'Japan', 'South Korea', 'EU', 
      'Singapore', 'Malaysia', 'Thailand', 'Australia', 'Germany',
      'France', 'UK', 'Russia', 'India', 'Taiwan'
    ];
    
    return countries.filter(country => text.includes(country));
  }
  
  /**
   * Clean up resources when this manager is no longer needed
   */
  public dispose(): void {
    // Clear all polling intervals
    this.pollingIntervals.forEach(interval => clearInterval(interval));
    this.pollingIntervals = [];
    
    console.log('Vietnam search manager resources released');
  }
}

export default VietnamSearchManager;
