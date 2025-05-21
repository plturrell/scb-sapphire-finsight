/**
 * Vietnam Service
 * 
 * Provides unified access to Vietnam-specific tariff, trade, and economic data.
 * Uses the `/api/vietnam/real-search` endpoint to retrieve data from various sources.
 */

// Types for tariff data
export interface VietnamTariffAlert {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'Critical';
  publishDate: string;
  impactSeverity: number;
  tariffRate?: number;
  productCategories?: string[];
  affectedProvinces?: string[];
  affectedHsCodes?: string[];
  sourceName: string;
  sourceUrl?: string;
  country: string;
  tradePartners?: string[];
}

export interface VietnamProvince {
  id: string;
  name: string;
  imports: number;
  exports: number;
  mainSectors: string[];
  tariffImpact: number;
  description?: string;
  gdp?: number;
  population?: number;
}

export interface VietnamTradeData {
  id: string;
  name: string;
  volume: number;
  growth: number;
  mainProducts: string[];
  tariffAverage: number;
  checkpoints: string[];
  description?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  futureOutlook?: string;
}

export interface VietnamAIPrediction {
  id: string;
  category: string;
  prediction: string;
  confidence: number;
  impactScore: number;
  affectedSectors: string[];
  dataPoints: number;
  lastUpdated: string;
  recommendation?: string;
}

// Query parameters
export interface VietnamSearchParams {
  query?: string;
  dataType?: 'all' | 'alerts' | 'provinces' | 'trade' | 'predictions';
  province?: string;
  category?: string;
  includeAsean?: boolean;
  limit?: number;
}

// Company search parameters
export interface VietnamCompanySearchParams {
  query: string;
  filters?: {
    industry?: string;
    province?: string;
    minRevenue?: number;
    exportOnly?: boolean;
  };
  limit?: number;
}

// Company search result
export interface VietnamCompanySearchResult {
  companyCode: string;
  companyName: string;
  capitalIQId: string;
  industry: string;
  province: string;
  annualRevenue: number;
  exportValue: number;
  importValue: number;
  hasFinancialDocs: boolean;
  documentCount: number;
  lastUpdated: string;
}

// Complete search response
export interface VietnamSearchResponse {
  success: boolean;
  timestamp: string;
  query: string;
  includedAsean: boolean;
  alerts?: VietnamTariffAlert[];
  provinceData?: VietnamProvince[];
  tradeData?: VietnamTradeData[];
  predictions?: VietnamAIPrediction[];
}

// Company search response
export interface VietnamCompanySearchResponse {
  success: boolean;
  query: string;
  resultCount: number;
  results: VietnamCompanySearchResult[];
  timestamp: string;
  dataSource: string;
}

/**
 * Vietnam Service class encapsulating all Vietnam-specific API calls
 */
export class VietnamService {
  /**
   * Get Vietnam tariff alerts and related data
   */
  static async getVietnamTariffData(params: VietnamSearchParams = {}): Promise<VietnamSearchResponse> {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      if (params.query) {
        queryParams.append('query', params.query);
      }
      
      if (params.dataType) {
        queryParams.append('dataType', params.dataType);
      }
      
      if (params.province) {
        queryParams.append('province', params.province);
      }
      
      if (params.category) {
        queryParams.append('category', params.category);
      }
      
      if (params.includeAsean !== undefined) {
        queryParams.append('includeAsean', params.includeAsean.toString());
      }
      
      if (params.limit !== undefined) {
        queryParams.append('limit', params.limit.toString());
      }
      
      // Make API request
      const response = await fetch(`/api/vietnam/real-search?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching Vietnam tariff data:', error);
      throw error;
    }
  }
  
  /**
   * Get Vietnam tariff alerts
   */
  static async getTariffAlerts(params: VietnamSearchParams = {}): Promise<VietnamTariffAlert[]> {
    try {
      const result = await this.getVietnamTariffData({
        ...params,
        dataType: 'alerts'
      });
      
      return result.alerts || [];
    } catch (error) {
      console.error('Error fetching Vietnam tariff alerts:', error);
      return [];
    }
  }
  
  /**
   * Get Vietnam province data
   */
  static async getProvinceData(params: VietnamSearchParams = {}): Promise<VietnamProvince[]> {
    try {
      const result = await this.getVietnamTariffData({
        ...params,
        dataType: 'provinces'
      });
      
      return result.provinceData || [];
    } catch (error) {
      console.error('Error fetching Vietnam province data:', error);
      return [];
    }
  }
  
  /**
   * Get Vietnam trade corridor data
   */
  static async getTradeData(params: VietnamSearchParams = {}): Promise<VietnamTradeData[]> {
    try {
      const result = await this.getVietnamTariffData({
        ...params,
        dataType: 'trade'
      });
      
      return result.tradeData || [];
    } catch (error) {
      console.error('Error fetching Vietnam trade data:', error);
      return [];
    }
  }
  
  /**
   * Get Vietnam AI predictions
   */
  static async getAIPredictions(params: VietnamSearchParams = {}): Promise<VietnamAIPrediction[]> {
    try {
      const result = await this.getVietnamTariffData({
        ...params,
        dataType: 'predictions'
      });
      
      return result.predictions || [];
    } catch (error) {
      console.error('Error fetching Vietnam AI predictions:', error);
      return [];
    }
  }
  
  /**
   * Search for Vietnam companies
   */
  static async searchCompanies(params: VietnamCompanySearchParams): Promise<VietnamCompanySearchResponse> {
    try {
      // Make API request
      const response = await fetch('/api/vietnam/real-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error searching Vietnam companies:', error);
      throw error;
    }
  }
  
  /**
   * Get company by code
   */
  static async getCompanyByCode(companyCode: string): Promise<VietnamCompanySearchResult | null> {
    try {
      const response = await this.searchCompanies({
        query: companyCode
      });
      
      if (response.success && response.resultCount > 0) {
        const exactMatch = response.results.find(company => 
          company.companyCode === companyCode
        );
        
        return exactMatch || response.results[0];
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching company with code ${companyCode}:`, error);
      return null;
    }
  }
  
  /**
   * Get all provinces
   */
  static async getAllProvinces(): Promise<VietnamProvince[]> {
    try {
      const result = await this.getVietnamTariffData({
        dataType: 'provinces',
        limit: 100 // Get a larger set
      });
      
      return result.provinceData || [];
    } catch (error) {
      console.error('Error fetching all Vietnam provinces:', error);
      return [];
    }
  }
  
  /**
   * Get province by ID
   */
  static async getProvinceById(provinceId: string): Promise<VietnamProvince | null> {
    try {
      const provinces = await this.getAllProvinces();
      return provinces.find(province => province.id === provinceId) || null;
    } catch (error) {
      console.error(`Error fetching province with ID ${provinceId}:`, error);
      return null;
    }
  }
}

export default VietnamService;