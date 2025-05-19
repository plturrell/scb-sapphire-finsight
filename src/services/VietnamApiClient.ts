import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

/**
 * VietnamApiClient - Specialized client for Vietnam-specific news and tariff data sources
 * Part of the Vietnam Tariff Impact System integration plan
 */
export class VietnamApiClient {
  private vnExpressClient: AxiosInstance;
  private ministryOfFinanceClient: AxiosInstance;
  private customsClient: AxiosInstance;
  private vietstockClient: AxiosInstance;
  
  private apiKey?: string;
  private maxRetries: number = 3;
  private rateLimit: { [key: string]: number } = {};
  
  constructor(config?: {
    apiKey?: string;
    maxRetries?: number;
    rateLimitPerMinute?: number;
  }) {
    this.apiKey = config?.apiKey;
    this.maxRetries = config?.maxRetries || 3;
    
    // Initialize rate limits
    const ratePerMinute = config?.rateLimitPerMinute || 60;
    this.rateLimit = {
      'vnexpress': ratePerMinute,
      'mof': ratePerMinute / 2, // More conservative with government sites
      'customs': ratePerMinute / 2,
      'vietstock': ratePerMinute
    };
    
    // Base configuration for axios instances
    const baseConfig: AxiosRequestConfig = {
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };
    
    // Initialize API clients
    this.vnExpressClient = axios.create({
      ...baseConfig,
      baseURL: 'https://api.vnexpress.net/v1',
    });
    
    this.ministryOfFinanceClient = axios.create({
      ...baseConfig,
      baseURL: 'https://api.mof.gov.vn/tariff-api',
    });
    
    this.customsClient = axios.create({
      ...baseConfig,
      baseURL: 'https://api.customs.gov.vn/v2',
    });
    
    this.vietstockClient = axios.create({
      ...baseConfig,
      baseURL: 'https://api.vietstock.vn/finance',
    });
    
    // Add request interceptors for authentication and rate limiting
    this.setupInterceptors();
  }
  
  /**
   * Configure request interceptors for API clients
   */
  private setupInterceptors(): void {
    // Setup for VnExpress API
    this.vnExpressClient.interceptors.request.use((config) => {
      if (this.apiKey) {
        config.headers['X-API-Key'] = this.apiKey;
      }
      return config;
    });
    
    // Setup for Ministry of Finance API
    this.ministryOfFinanceClient.interceptors.request.use((config) => {
      if (this.apiKey) {
        config.headers['Authorization'] = `Bearer ${this.apiKey}`;
      }
      return config;
    });
    
    // Add similar interceptors for other APIs
    // ...
  }
  
  /**
   * Search VnExpress for tariff-related news
   */
  public async searchVnExpress(query: string, options?: {
    fromDate?: Date;
    toDate?: Date;
    categories?: string[];
    limit?: number;
  }): Promise<any> {
    try {
      const params = {
        q: query,
        from_date: options?.fromDate?.toISOString(),
        to_date: options?.toDate?.toISOString(),
        category: options?.categories?.join(','),
        limit: options?.limit || 20
      };
      
      const response = await this.vnExpressClient.get('/search', { params });
      return this.processArticles(response.data.articles || []);
    } catch (error) {
      console.error('Error searching VnExpress:', error);
      return { success: false, error, articles: [] };
    }
  }
  
  /**
   * Get latest tariff announcements from Vietnam Ministry of Finance
   */
  public async getMinistryOfFinanceTariffUpdates(options?: {
    limit?: number;
    department?: string;
    productCategory?: string;
  }): Promise<any> {
    try {
      const params = {
        limit: options?.limit || 10,
        department: options?.department || 'tariff',
        product_category: options?.productCategory
      };
      
      const response = await this.ministryOfFinanceClient.get('/announcements', { params });
      return this.processTariffAnnouncements(response.data.announcements || []);
    } catch (error) {
      console.error('Error getting Ministry of Finance updates:', error);
      return { success: false, error, announcements: [] };
    }
  }
  
  /**
   * Get Vietnam Customs tariff rate data
   */
  public async getCustomsTariffRates(productCodes: string[]): Promise<any> {
    try {
      const response = await this.customsClient.post('/tariff-rates', {
        product_codes: productCodes
      });
      
      return {
        success: true,
        tariffRates: response.data.tariffRates || []
      };
    } catch (error) {
      console.error('Error getting Customs tariff rates:', error);
      return { success: false, error, tariffRates: [] };
    }
  }
  
  /**
   * Get Vietnam-specific market analysis from Vietstock Finance
   */
  public async getVietstockTariffAnalysis(options?: {
    sectors?: string[];
    timeframe?: string;
  }): Promise<any> {
    try {
      const params = {
        sectors: options?.sectors?.join(',') || 'all',
        timeframe: options?.timeframe || 'monthly'
      };
      
      const response = await this.vietstockClient.get('/tariff-impact-analysis', { params });
      return {
        success: true,
        analysis: response.data.analysis || []
      };
    } catch (error) {
      console.error('Error getting Vietstock tariff analysis:', error);
      return { success: false, error, analysis: [] };
    }
  }
  
  /**
   * Process articles from news APIs into standardized format
   */
  private processArticles(articles: any[]): any {
    return {
      success: true,
      articles: articles.map(article => ({
        id: article.id || article.articleId,
        title: article.title,
        description: article.description || article.summary,
        publishDate: article.publishDate || article.date,
        url: article.url || article.link,
        source: 'VnExpress',
        categories: article.categories || [],
        content: article.content || ''
      }))
    };
  }
  
  /**
   * Process tariff announcements from government sources
   */
  private processTariffAnnouncements(announcements: any[]): any {
    return {
      success: true,
      announcements: announcements.map(announcement => ({
        id: announcement.id,
        title: announcement.title,
        issuedDate: announcement.issuedDate,
        effectiveDate: announcement.effectiveDate,
        department: announcement.department,
        documentNumber: announcement.documentNumber,
        url: announcement.url,
        summary: announcement.summary,
        affectedProducts: announcement.affectedProducts || [],
        tariffChanges: announcement.tariffChanges || []
      }))
    };
  }
}

export default VietnamApiClient;
