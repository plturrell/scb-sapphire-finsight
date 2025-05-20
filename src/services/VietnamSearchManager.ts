import { SearchManager } from './SearchManager';
import { OntologyManager } from './OntologyManager';
import VietnamApiClient from './VietnamApiClient';
import { TariffAlert } from '../types';
import { VietnamAnnouncement, VietnamNewsArticleDetail as VietnamNewsArticle } from '../types/index';

// Use type alias instead of re-export due to export issue
export type { VietnamAnnouncement, VietnamNewsArticle };

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
  
  constructor(
    searchManager: SearchManager,
    ontologyManager: OntologyManager,
    options?: {
      reutersApiKey?: string;
      bloombergApiKey?: string;
      vietnamApiKey?: string;
    }
  ) {
    this.searchManager = searchManager;
    this.ontologyManager = ontologyManager;
    
    if (options) {
      this.reutersApiKey = options.reutersApiKey;
      this.bloombergApiKey = options.bloombergApiKey;
      this.vietnamApiKey = options.vietnamApiKey;
      
      // Initialize API client if key provided
      if (this.vietnamApiKey) {
        this.vietnamApiClient = new VietnamApiClient({
          apiKey: this.vietnamApiKey
        });
      }
    }
  }
  
  /**
   * Register a callback for when new tariff information is found
   */
  public onTariffInformation(callback: (tariffInfo: TariffAlert) => void): void {
    this.onTariffInformationFound = callback;
  }
  
  /**
   * Search for Vietnam-specific tariff information
   * Enhanced with Vietnamese language support and industry context
   */
  public async searchVietnamTariffs(options: VietnamSearchOptions): Promise<any[]> {
    const { query, includeAsean = true } = options;
    
    // Search for Vietnam-specific tariff information
    const vietnamResults = await this.searchManager.search({
      query: `${query} Vietnam tariff "thuế quan"`,
      country: 'Vietnam',
      minConfidence: options.minConfidence || 0.6,
      limit: 20
    });
    
    // Transform and filter results
    let results = vietnamResults.items || [];
    
    // If ASEAN context is enabled, get regional information
    if (includeAsean) {
      const aseanResults = await this.getAseanRelatedTariffs(query);
      results = [...results, ...aseanResults];
    }
    
    // Add results from Vietnam-specific sources
    if (this.vietnamApiClient) {
      const vnExpressResults = await this.vietnamApiClient.searchVnExpress(`${query} thuế quan`, {
        fromDate: options.fromDate,
        toDate: options.toDate,
        limit: 10
      });
      
      if (vnExpressResults.success && vnExpressResults.articles.length > 0) {
        const alerts = vnExpressResults.articles.map(article => 
          this.convertToTariffAlert(article, 'VnExpress')
        );
        results = [...results, ...alerts];
      }
      
      // Add results from Ministry of Finance
      const mofResults = await this.vietnamApiClient.getMinistryOfFinanceTariffUpdates({
        fromDate: options.fromDate,
        toDate: options.toDate,
        category: options.productCategories ? options.productCategories.join(',') : undefined
      });
      
      if (mofResults.success && mofResults.announcements.length > 0) {
        const alerts = mofResults.announcements.map(announcement => 
          this.convertAnnouncementToTariffAlert(announcement, 'Ministry of Finance Vietnam')
        );
        results = [...results, ...alerts];
      }
    }
    
    // Apply filters
    const filteredResults = this.applyFilters(results, options);
    
    return filteredResults;
  }
  
  /**
   * Search for Vietnam-specific news and announcements
   * Returns a mix of news articles and government announcements
   */
  public async searchVietnamNews(options: VietnamSearchOptions): Promise<any[]> {
    let newsResults: any[] = [];
    
    // Use search manager for general news
    const standardResults = await this.searchManager.search({
      query: options.query + ' Vietnam' + (options.language === 'vi' ? ' "tin tức"' : ''),
      country: 'Vietnam',
      minConfidence: options.minConfidence || 0.5,
      limit: 20
    });
    
    if (standardResults.items) {
      newsResults = [...standardResults.items];
    }
    
    // Add Vietnam-specific news sources
    if (this.vietnamApiClient) {
      const vnExpressResults = await this.vietnamApiClient.searchVnExpress(options.query, {
        fromDate: options.fromDate,
        toDate: options.toDate,
        limit: 15
      });
      
      if (vnExpressResults.success && vnExpressResults.articles.length > 0) {
        // Convert to VietnamNewsArticle format
        const articles: VietnamNewsArticle[] = vnExpressResults.articles.map(article => ({
          id: article.id,
          title: article.title,
          content: article.content || article.description,
          publishDate: new Date(article.publishDate),
          source: 'VnExpress',
          url: article.url,
          category: article.category || 'news',
          tags: article.tags,
          relevance: article.relevance
        }));
        
        newsResults = [...newsResults, ...articles];
      }
    }
    
    // Apply filters
    const filteredResults = this.applyNewsFilters(newsResults, options);
    
    return filteredResults;
  }
  
  /**
   * Get recent tariff announcements from Vietnam
   */
  public async getRecentTariffAnnouncements(limit: number = 10): Promise<VietnamAnnouncement[]> {
    if (!this.vietnamApiClient) {
      return [];
    }
    
    const result = await this.vietnamApiClient.getMinistryOfFinanceTariffUpdates({
      limit: limit
    });
    
    if (!result.success) {
      return [];
    }
    
    return result.announcements.map(announcement => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      publishDate: new Date(announcement.publishDate),
      documentNumber: announcement.documentNumber,
      ministry: announcement.ministry || 'Ministry of Finance',
      type: announcement.type || 'tariff',
      url: announcement.url,
      affectedProducts: announcement.affectedProducts,
      affectedCountries: announcement.affectedCountries,
      effectiveDate: announcement.effectiveDate ? new Date(announcement.effectiveDate) : undefined
    }));
  }
  
  /**
   * Schedule periodic checks for Vietnam-specific tariff updates
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
      description: announcement.summary || announcement.content?.substring(0, 200) || '',
      country: 'Vietnam',
      impactSeverity,
      confidence: 0.95, // Higher confidence for official sources
      sourceUrl: announcement.url,
      sourceName: source,
      publishDate: new Date(announcement.issuedDate || announcement.publishDate),
      createdAt: new Date(),
      priority: impactSeverity > 7 ? 'high' : impactSeverity > 5 ? 'medium' : 'low',
      tariffRate,
      productCategories: announcement.affectedProducts || [],
      aiEnhanced: false,
      affectedProvinces: announcement.regions || [],
      tradingPartners: announcement.affectedCountries || []
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
      affectedProvinces: analysis.regions || [],
      tradingPartners: analysis.tradingPartners || []
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
        console.error(`Error searching for ${country} tariff information:`, error);
      }
    }
    
    return results;
  }
  
  /**
   * Apply filters to tariff search results
   */
  private applyFilters(results: any[], options: VietnamSearchOptions): any[] {
    // Filter by date if specified
    let filteredResults = results;
    
    if (options.fromDate) {
      filteredResults = filteredResults.filter(item => 
        new Date(item.publishDate) >= options.fromDate!
      );
    }
    
    if (options.toDate) {
      filteredResults = filteredResults.filter(item => 
        new Date(item.publishDate) <= options.toDate!
      );
    }
    
    // Filter by product categories if specified
    if (options.productCategories && options.productCategories.length > 0) {
      filteredResults = filteredResults.filter(item => {
        if (!item.productCategories) return false;
        return item.productCategories.some((category: string) => 
          options.productCategories!.includes(category)
        );
      });
    }
    
    // Filter by source if specified
    if (options.sourceFilters && options.sourceFilters.length > 0) {
      filteredResults = filteredResults.filter(item => 
        options.sourceFilters!.includes(item.sourceName)
      );
    }
    
    // Filter by confidence if specified
    if (options.minConfidence) {
      filteredResults = filteredResults.filter(item => 
        item.confidence >= options.minConfidence!
      );
    }
    
    // Sort by date (newest first)
    filteredResults.sort((a, b) => 
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
    
    return filteredResults;
  }
  
  /**
   * Apply filters to news search results
   */
  private applyNewsFilters(results: any[], options: VietnamSearchOptions): any[] {
    // Filter by date if specified
    let filteredResults = results;
    
    if (options.fromDate) {
      filteredResults = filteredResults.filter(item => 
        new Date(item.publishDate) >= options.fromDate!
      );
    }
    
    if (options.toDate) {
      filteredResults = filteredResults.filter(item => 
        new Date(item.publishDate) <= options.toDate!
      );
    }
    
    // Filter by source if specified
    if (options.sourceFilters && options.sourceFilters.length > 0) {
      filteredResults = filteredResults.filter(item => 
        options.sourceFilters!.includes(item.source)
      );
    }
    
    // Sort by date (newest first)
    filteredResults.sort((a, b) => 
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
    
    return filteredResults;
  }
  
  /**
   * Extract product categories from text
   */
  private extractProductCategories(text: string): string[] {
    const categories: string[] = [];
    
    // Use ontology manager to extract categories
    const ontologyResults = this.ontologyManager.analyzeText(text);
    
    if (ontologyResults.productCategories && ontologyResults.productCategories.length > 0) {
      categories.push(...ontologyResults.productCategories);
    }
    
    // Fallback to keyword matching
    const keywordMapping: Record<string, string> = {
      'textile': 'Textiles',
      'fabric': 'Textiles',
      'garment': 'Textiles',
      'clothing': 'Textiles',
      'apparel': 'Textiles',
      'electronics': 'Electronics',
      'computer': 'Electronics',
      'phone': 'Electronics',
      'semiconductor': 'Electronics',
      'agriculture': 'Agriculture',
      'farming': 'Agriculture',
      'crop': 'Agriculture',
      'food': 'Agriculture',
      'fruit': 'Agriculture',
      'rice': 'Agriculture',
      'wood': 'Forestry',
      'timber': 'Forestry',
      'furniture': 'Forestry',
      'seafood': 'Fisheries',
      'fish': 'Fisheries',
      'automotive': 'Automotive',
      'car': 'Automotive',
      'vehicle': 'Automotive',
      'plastic': 'Chemicals',
      'chemical': 'Chemicals',
      'petroleum': 'Energy',
      'oil': 'Energy',
      'gas': 'Energy',
      'fuel': 'Energy'
    };
    
    const lowerText = text.toLowerCase();
    
    for (const [keyword, category] of Object.entries(keywordMapping)) {
      if (lowerText.includes(keyword) && !categories.includes(category)) {
        categories.push(category);
      }
    }
    
    return categories;
  }
  
  /**
   * Extract tariff rate from text
   */
  private extractTariffRate(text: string): number {
    // Look for patterns like "X% tariff", "tariff of X%", "increased by X%"
    const percentageMatches = text.match(/(\d+(\.\d+)?)%/g);
    
    if (percentageMatches && percentageMatches.length > 0) {
      // If multiple percentages, try to find one close to tariff-related words
      const tariffRelatedWords = ['tariff', 'duty', 'tax', 'surcharge', 'levy', 'thuế'];
      
      for (const word of tariffRelatedWords) {
        const index = text.toLowerCase().indexOf(word);
        if (index > -1) {
          // Find closest percentage to this word
          let closestMatch = null;
          let closestDistance = Number.MAX_SAFE_INTEGER;
          
          for (const match of percentageMatches) {
            const matchIndex = text.indexOf(match);
            const distance = Math.abs(matchIndex - index);
            
            if (distance < closestDistance) {
              closestDistance = distance;
              closestMatch = match;
            }
          }
          
          if (closestMatch && closestDistance < 100) { // Within reasonable distance
            return parseFloat(closestMatch.replace('%', ''));
          }
        }
      }
      
      // If no specific match found, take the first percentage
      return parseFloat(percentageMatches[0].replace('%', ''));
    }
    
    return 0;
  }
  
  /**
   * Calculate impact severity based on tariff rate and product categories
   */
  private calculateImpactSeverity(tariffRate: number, productCategories: string[]): number {
    // Base severity on tariff rate
    let baseSeverity = 5; // Default medium severity
    
    if (tariffRate > 25) {
      baseSeverity = 9;
    } else if (tariffRate > 15) {
      baseSeverity = 8;
    } else if (tariffRate > 10) {
      baseSeverity = 7;
    } else if (tariffRate > 5) {
      baseSeverity = 6;
    } else if (tariffRate > 0) {
      baseSeverity = 5;
    }
    
    // Adjust based on product categories
    const highImpactCategories = ['Electronics', 'Textiles', 'Automotive', 'Fisheries'];
    const mediumImpactCategories = ['Agriculture', 'Forestry', 'Energy'];
    
    let categoryAdjustment = 0;
    
    // Check if any high impact categories are affected
    if (productCategories.some(category => highImpactCategories.includes(category))) {
      categoryAdjustment += 1;
    }
    
    // Check if any medium impact categories are affected
    if (productCategories.some(category => mediumImpactCategories.includes(category))) {
      categoryAdjustment += 0.5;
    }
    
    // Adjust final severity
    let finalSeverity = Math.min(10, baseSeverity + categoryAdjustment);
    
    return finalSeverity;
  }
  
  /**
   * Extract affected provinces from text
   */
  private extractAffectedProvinces(text: string): string[] {
    const provinces: string[] = [];
    
    // List of major Vietnam provinces/cities
    const majorProvinces = [
      'Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Can Tho', 'Hai Phong',
      'An Giang', 'Ba Ria-Vung Tau', 'Bac Giang', 'Bac Kan', 'Bac Lieu',
      'Bac Ninh', 'Ben Tre', 'Binh Dinh', 'Binh Duong', 'Binh Phuoc',
      'Binh Thuan', 'Ca Mau', 'Cao Bang', 'Dak Lak', 'Dak Nong',
      'Dien Bien', 'Dong Nai', 'Dong Thap', 'Gia Lai', 'Ha Giang',
      'Ha Nam', 'Ha Tinh', 'Hai Duong', 'Hau Giang', 'Hoa Binh',
      'Hung Yen', 'Khanh Hoa', 'Kien Giang', 'Kon Tum', 'Lai Chau',
      'Lam Dong', 'Lang Son', 'Lao Cai', 'Long An', 'Nam Dinh',
      'Nghe An', 'Ninh Binh', 'Ninh Thuan', 'Phu Tho', 'Phu Yen',
      'Quang Binh', 'Quang Nam', 'Quang Ngai', 'Quang Ninh', 'Quang Tri',
      'Soc Trang', 'Son La', 'Tay Ninh', 'Thai Binh', 'Thai Nguyen',
      'Thanh Hoa', 'Thua Thien Hue', 'Tien Giang', 'Tra Vinh', 'Tuyen Quang',
      'Vinh Long', 'Vinh Phuc', 'Yen Bai'
    ];
    
    // Check for each province in the text
    for (const province of majorProvinces) {
      if (text.includes(province)) {
        provinces.push(province);
      }
    }
    
    return provinces;
  }
  
  /**
   * Extract trading partners from text
   */
  private extractTradingPartners(text: string): string[] {
    const partners: string[] = [];
    
    // List of major trading partners for Vietnam
    const majorPartners = [
      'United States', 'US', 'USA', 'China', 'Japan', 'South Korea', 'Korea',
      'Thailand', 'Malaysia', 'Singapore', 'Indonesia', 'Philippines',
      'Australia', 'EU', 'European Union', 'Germany', 'Netherlands',
      'United Kingdom', 'UK', 'France', 'India', 'Taiwan', 'Hong Kong',
      'Russia', 'Canada', 'New Zealand', 'Mexico', 'Brazil', 'Chile'
    ];
    
    // Check for each partner in the text
    for (const partner of majorPartners) {
      if (text.includes(partner)) {
        // Normalize country names
        if (partner === 'US' || partner === 'USA') {
          if (!partners.includes('United States')) {
            partners.push('United States');
          }
        } else if (partner === 'UK') {
          if (!partners.includes('United Kingdom')) {
            partners.push('United Kingdom');
          }
        } else if (partner === 'Korea') {
          if (!partners.includes('South Korea')) {
            partners.push('South Korea');
          }
        } else if (partner === 'EU') {
          if (!partners.includes('European Union')) {
            partners.push('European Union');
          }
        } else if (!partners.includes(partner)) {
          partners.push(partner);
        }
      }
    }
    
    return partners;
  }
}