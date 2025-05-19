/**
 * Real Vietnam Company Search API
 * Uses actual Capital IQ data and credentials
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { VietnamCompanyRAG } from '@/services/VietnamCompanyRAG';
import { VietnamSearchManager } from '@/services/VietnamSearchManager';
import RedisDataStore from '@/services/RedisDataStore';
import fs from 'fs';
import path from 'path';

interface RealSearchRequest {
  query: string;
  filters?: {
    industry?: string;
    province?: string;
    minRevenue?: number;
    exportOnly?: boolean;
  };
  limit?: number;
}

interface CompanySearchResult {
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

class RealCompanySearchService {
  private vietnamRAG: VietnamCompanyRAG;
  private searchManager: VietnamSearchManager;
  private redisStore: RedisDataStore;
  private realDataPath: string;

  constructor() {
    this.vietnamRAG = new VietnamCompanyRAG();
    this.searchManager = new VietnamSearchManager();
    this.redisStore = new RedisDataStore(
      process.env.REDIS_URL || 'redis://localhost:6379'
    );
    this.realDataPath = path.join(process.cwd(), 'data_products', 'vietnam_real_companies.json');
  }

  async initialize() {
    // RedisDataStore connects automatically in constructor
  }

  async searchRealCompanies(request: RealSearchRequest): Promise<CompanySearchResult[]> {
    try {
      // First, check if we have real data loaded
      const hasRealData = await this.checkRealDataAvailable();
      
      if (!hasRealData) {
        throw new Error('Real Capital IQ data not available. Please run extraction first.');
      }

      // Search in RAG system
      const ragResults = await this.vietnamRAG.queryCompanies(request.query, 10);

      // Search in Redis for additional data
      const redisResults = await this.searchRedis(request);

      // Combine and deduplicate results
      const combinedResults = this.combineResults(ragResults, redisResults);

      // Apply filters
      let filteredResults = this.applyFilters(combinedResults, request.filters);

      // Sort by relevance and revenue
      filteredResults.sort((a, b) => {
        // Prioritize exact matches
        if (a.companyName.toLowerCase() === request.query.toLowerCase()) return -1;
        if (b.companyName.toLowerCase() === request.query.toLowerCase()) return 1;
        
        // Then by revenue
        return (b.annualRevenue || 0) - (a.annualRevenue || 0);
      });

      // Limit results
      if (request.limit) {
        filteredResults = filteredResults.slice(0, request.limit);
      }

      // Check document availability for each company
      for (const result of filteredResults) {
        result.documentCount = await this.getDocumentCount(result.companyCode);
        result.hasFinancialDocs = result.documentCount > 0;
      }

      return filteredResults;

    } catch (error) {
      console.error('Error searching real companies:', error);
      throw error;
    }
  }

  private async checkRealDataAvailable(): Promise<boolean> {
    try {
      // Check if real data file exists
      if (!fs.existsSync(this.realDataPath)) {
        return false;
      }

      // Check if data is recent (less than 24 hours old)
      const stats = fs.statSync(this.realDataPath);
      const ageInHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
      
      if (ageInHours > 24) {
        console.warn('Real data is older than 24 hours');
      }

      return true;
    } catch (error) {
      console.error('Error checking real data:', error);
      return false;
    }
  }

  private async searchRedis(request: RealSearchRequest): Promise<CompanySearchResult[]> {
    const results: CompanySearchResult[] = [];
    
    try {
      // Search in Redis for matching companies
      const keys = await this.redisStore.searchKeys(`vietnam:company:*${request.query}*`);
      
      for (const key of keys) {
        const data = await this.redisStore.get(key);
        if (data) {
          results.push(this.transformToSearchResult(data));
        }
      }
    } catch (error) {
      console.error('Error searching Redis:', error);
    }

    return results;
  }

  private combineResults(ragResults: any[], redisResults: CompanySearchResult[]): CompanySearchResult[] {
    const combined = new Map<string, CompanySearchResult>();

    // Add RAG results
    for (const result of ragResults) {
      if (result.metadata?.company_code) {
        combined.set(result.metadata.company_code, {
          companyCode: result.metadata.company_code,
          companyName: result.metadata.company_name || result.title,
          capitalIQId: result.metadata.capital_iq_id || '',
          industry: result.metadata.industry || '',
          province: result.metadata.province || '',
          annualRevenue: result.metadata.annual_revenue || 0,
          exportValue: result.metadata.export_value || 0,
          importValue: result.metadata.import_value || 0,
          hasFinancialDocs: false,
          documentCount: 0,
          lastUpdated: result.metadata.extracted_date || new Date().toISOString()
        });
      }
    }

    // Merge Redis results
    for (const result of redisResults) {
      const existing = combined.get(result.companyCode);
      if (existing) {
        // Merge data, preferring more complete information
        combined.set(result.companyCode, {
          ...existing,
          ...result,
          annualRevenue: result.annualRevenue || existing.annualRevenue,
          exportValue: result.exportValue || existing.exportValue,
          importValue: result.importValue || existing.importValue
        });
      } else {
        combined.set(result.companyCode, result);
      }
    }

    return Array.from(combined.values());
  }

  private applyFilters(
    results: CompanySearchResult[],
    filters?: RealSearchRequest['filters']
  ): CompanySearchResult[] {
    if (!filters) return results;

    return results.filter(result => {
      if (filters.industry && !result.industry.toLowerCase().includes(filters.industry.toLowerCase())) {
        return false;
      }

      if (filters.province && !result.province.toLowerCase().includes(filters.province.toLowerCase())) {
        return false;
      }

      if (filters.minRevenue && result.annualRevenue < filters.minRevenue) {
        return false;
      }

      if (filters.exportOnly && !result.exportValue) {
        return false;
      }

      return true;
    });
  }

  private transformToSearchResult(data: any): CompanySearchResult {
    return {
      companyCode: data.VietnamCompanyCode || data.companyCode,
      companyName: data.CompanyName || data.companyName,
      capitalIQId: data.CapitalIQId || data.capitalIQId || '',
      industry: data.IndustryCode || data.industry || '',
      province: data.Province || data.province || '',
      annualRevenue: data.AnnualRevenue || data.annualRevenue || 0,
      exportValue: data.ExportValue || data.exportValue || 0,
      importValue: data.ImportValue || data.importValue || 0,
      hasFinancialDocs: false,
      documentCount: 0,
      lastUpdated: data.UpdatedDate || data.lastUpdated || new Date().toISOString()
    };
  }

  private async getDocumentCount(companyCode: string): Promise<number> {
    try {
      const docs = await this.vietnamRAG.getCompanyDocuments(companyCode);
      return docs.length;
    } catch (error) {
      return 0;
    }
  }

  async cleanup() {
    await this.redisStore.disconnect();
  }
}

// API Handler
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const searchService = new RealCompanySearchService();

  try {
    await searchService.initialize();

    const request: RealSearchRequest = req.body;

    if (!request.query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const results = await searchService.searchRealCompanies(request);

    res.status(200).json({
      success: true,
      query: request.query,
      resultCount: results.length,
      results: results,
      timestamp: new Date().toISOString(),
      dataSource: 'Capital IQ Real Data'
    });

  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  } finally {
    await searchService.cleanup();
  }
}