/**
 * Vietnam Company RAG (Retrieval-Augmented Generation) Service
 * Stores and retrieves company documents for LLM processing
 * Integrates with existing RAG system and NVIDIA patterns
 */

import { DocumentMetadata } from '../lib/rag-system';
import ragSystem from '../lib/rag-system';
import fs from 'fs';
import path from 'path';

export interface VietnamCompanyDocument {
  companyCode: string;
  companyName: string;
  documentType: 'profile' | 'financial' | 'annual_report' | 'quarterly_report' | 'tariff_analysis';
  content: string;
  metadata: {
    period?: string;
    fiscal_year?: string;
    language: 'en' | 'vi';
    source: string;
    extracted_date: string;
    file_type?: string;
  };
}

export interface CompanyFinancialData {
  VietnamCompanyCode: string;
  CompanyName: string;
  AnnualRevenue?: number;
  AnnualRevenueCurrency?: string;
  ExportValue?: number;
  ImportValue?: number;
  TradingPartners?: string;
  MainExportProducts?: string;
  MainImportProducts?: string;
  [key: string]: any;
}

export class VietnamCompanyRAG {
  private dataProductsPath: string;
  private documentsPath: string;
  
  constructor() {
    this.dataProductsPath = path.join(process.cwd(), 'data_products');
    this.documentsPath = path.join(process.cwd(), 'data_products', 'documents');
    
    // Create documents directory if it doesn't exist
    if (!fs.existsSync(this.documentsPath)) {
      fs.mkdirSync(this.documentsPath, { recursive: true });
    }
  }

  /**
   * Ingest Vietnam company data from data products
   */
  async ingestCompanyData(): Promise<void> {
    console.log('Starting Vietnam company data ingestion...');
    
    try {
      // Load company data from data products
      const companiesFile = path.join(this.dataProductsPath, 'vietnam_companies_capitaliq.json');
      
      if (!fs.existsSync(companiesFile)) {
        console.log('Vietnam companies data file not found. Please run extraction first.');
        return;
      }

      const companiesData: CompanyFinancialData[] = JSON.parse(
        fs.readFileSync(companiesFile, 'utf-8')
      );

      console.log(`Found ${companiesData.length} Vietnam companies to ingest`);

      // Process each company
      for (const company of companiesData) {
        await this.ingestCompanyDocument(company);
      }

      console.log('Company data ingestion completed');
    } catch (error) {
      console.error('Error during company data ingestion:', error);
      throw error;
    }
  }

  /**
   * Ingest a single company document into RAG
   */
  async ingestCompanyDocument(company: CompanyFinancialData): Promise<void> {
    try {
      // Create comprehensive company profile
      const profileContent = this.createCompanyProfile(company);
      
      // Create metadata for RAG storage
      const metadata: DocumentMetadata = {
        source: 'capital_iq',
        title: `${company.CompanyName} Company Profile`,
        created_at: Date.now(),
        category: 'vietnam_company',
        author: 'Capital IQ',
        relevance_score: 1.0
      };

      // Add additional metadata for better search
      const extendedMetadata = {
        ...metadata,
        company_code: company.VietnamCompanyCode,
        company_name: company.CompanyName,
        industry: company.IndustryCode || 'unknown',
        province: company.Province || 'unknown',
        listing_status: company.ListingStatus || 'unknown'
      };

      // Store in RAG system
      await ragSystem.storeDocument(profileContent, extendedMetadata);

      // Store financial data if available
      if (company.AnnualRevenue || company.ExportValue || company.ImportValue) {
        const financialContent = this.createFinancialSummary(company);
        
        const financialMetadata = {
          ...extendedMetadata,
          title: `${company.CompanyName} Financial Summary`,
          category: 'vietnam_financial'
        };

        await ragSystem.storeDocument(financialContent, financialMetadata);
      }

      console.log(`Ingested data for ${company.CompanyName}`);
    } catch (error) {
      console.error(`Error ingesting company ${company.CompanyName}:`, error);
    }
  }

  /**
   * Create a comprehensive company profile for RAG
   */
  private createCompanyProfile(company: CompanyFinancialData): string {
    const sections = [];

    // Company Overview
    sections.push(`# ${company.CompanyName} Company Profile`);
    sections.push(`Company Code: ${company.VietnamCompanyCode}`);
    
    if (company.CompanyNameLocal) {
      sections.push(`Local Name: ${company.CompanyNameLocal}`);
    }

    // Basic Information
    sections.push('\n## Basic Information');
    sections.push(`- Tax Code: ${company.TaxCode || 'N/A'}`);
    sections.push(`- Business Registration: ${company.BusinessRegistrationNumber || 'N/A'}`);
    sections.push(`- Industry: ${company.IndustryCode || 'N/A'}`);
    sections.push(`- Company Type: ${company.CompanyType || 'N/A'}`);
    sections.push(`- Status: ${company.Status || 'Active'}`);

    // Location
    sections.push('\n## Location');
    sections.push(`- Province/City: ${company.Province || 'N/A'}`);
    sections.push(`- District: ${company.District || 'N/A'}`);
    sections.push(`- Address: ${company.Address || 'N/A'}`);

    // Contact Information
    sections.push('\n## Contact Information');
    sections.push(`- Phone: ${company.PhoneNumber || 'N/A'}`);
    sections.push(`- Email: ${company.Email || 'N/A'}`);
    sections.push(`- Website: ${company.Website || 'N/A'}`);

    // Company Details
    sections.push('\n## Company Details');
    sections.push(`- Established Date: ${company.EstablishedDate || 'N/A'}`);
    sections.push(`- Employee Count: ${company.EmployeeCount || 'N/A'}`);
    sections.push(`- Registered Capital: ${this.formatCurrency(company.RegisteredCapital, company.RegisteredCapitalCurrency)}`);

    // Stock Information (if public)
    if (company.ListingStatus === 'Listed' || company.StockSymbol) {
      sections.push('\n## Stock Information');
      sections.push(`- Listing Status: ${company.ListingStatus}`);
      sections.push(`- Stock Symbol: ${company.StockSymbol || 'N/A'}`);
    }

    // Credit Rating
    if (company.CreditRating) {
      sections.push('\n## Credit Rating');
      sections.push(`- Rating: ${company.CreditRating}`);
    }

    // Data Source
    sections.push('\n## Data Source');
    sections.push(`- Source: ${company.DataSource || 'S&P Capital IQ'}`);
    sections.push(`- Last Updated: ${company.LastUpdated || new Date().toISOString()}`);

    return sections.join('\n');
  }

  /**
   * Create financial summary for RAG
   */
  private createFinancialSummary(company: CompanyFinancialData): string {
    const sections = [];

    sections.push(`# ${company.CompanyName} Financial Summary`);
    sections.push(`Company Code: ${company.VietnamCompanyCode}`);

    // Revenue Information
    sections.push('\n## Revenue Information');
    sections.push(`- Annual Revenue: ${this.formatCurrency(company.AnnualRevenue, company.AnnualRevenueCurrency)}`);

    // Trade Information
    sections.push('\n## International Trade');
    sections.push(`- Export Value: ${this.formatCurrency(company.ExportValue, company.ExportValueCurrency)}`);
    sections.push(`- Import Value: ${this.formatCurrency(company.ImportValue, company.ImportValueCurrency)}`);

    // Products
    if (company.MainExportProducts) {
      sections.push('\n## Export Products');
      sections.push(company.MainExportProducts);
    }

    if (company.MainImportProducts) {
      sections.push('\n## Import Products');
      sections.push(company.MainImportProducts);
    }

    // Trading Partners
    if (company.TradingPartners) {
      sections.push('\n## Trading Partners');
      sections.push(company.TradingPartners);
    }

    return sections.join('\n');
  }

  /**
   * Format currency values
   */
  private formatCurrency(amount?: number, currency?: string): string {
    if (!amount) return 'N/A';
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });

    return formatter.format(amount);
  }

  /**
   * Query Vietnam companies in RAG
   */
  async queryCompanies(query: string, limit: number = 5): Promise<any[]> {
    try {
      const results = await ragSystem.retrieveRelevantDocuments(query, limit);
      
      // Filter for Vietnam company documents
      const vietnamResults = results.filter(doc => 
        doc.metadata.category === 'vietnam_company' || 
        doc.metadata.category === 'vietnam_financial'
      );

      return vietnamResults;
    } catch (error) {
      console.error('Error querying Vietnam companies:', error);
      return [];
    }
  }

  /**
   * Get company financial data for reports
   */
  async getCompanyFinancialData(companyCode: string): Promise<CompanyFinancialData | null> {
    try {
      const query = `Vietnam company ${companyCode} financial data revenue exports imports`;
      const results = await this.queryCompanies(query, 1);
      
      if (results.length > 0) {
        // Parse the content to extract financial data
        const content = results[0].pageContent;
        // This would be enhanced with proper parsing logic
        return {
          VietnamCompanyCode: companyCode,
          CompanyName: results[0].metadata.company_name || companyCode,
          // Extract other fields from content
        } as CompanyFinancialData;
      }

      return null;
    } catch (error) {
      console.error(`Error getting financial data for ${companyCode}:`, error);
      return null;
    }
  }

  /**
   * Store additional documents (PDFs, reports, etc.)
   */
  async storeCompanyDocument(document: VietnamCompanyDocument): Promise<string[]> {
    try {
      const metadata: DocumentMetadata = {
        source: document.metadata.source,
        title: `${document.companyName} ${document.documentType}`,
        created_at: Date.now(),
        category: `vietnam_${document.documentType}`,
        author: document.metadata.source
      };

      // Add extended metadata
      const extendedMetadata = {
        ...metadata,
        company_code: document.companyCode,
        company_name: document.companyName,
        document_type: document.documentType,
        period: document.metadata.period,
        fiscal_year: document.metadata.fiscal_year,
        language: document.metadata.language
      };

      // Store in RAG
      const ids = await ragSystem.storeDocument(document.content, extendedMetadata);

      // Also save to file system for backup
      const fileName = `${document.companyCode}_${document.documentType}_${Date.now()}.txt`;
      const filePath = path.join(this.documentsPath, fileName);
      fs.writeFileSync(filePath, document.content);

      console.log(`Stored ${document.documentType} for ${document.companyName}`);
      return ids;
    } catch (error) {
      console.error('Error storing company document:', error);
      throw error;
    }
  }

  /**
   * Batch process Capital IQ documents
   */
  async batchProcessCapitalIQDocuments(documents: any[]): Promise<void> {
    console.log(`Processing ${documents.length} Capital IQ documents...`);
    
    for (const doc of documents) {
      const vietnamDoc: VietnamCompanyDocument = {
        companyCode: doc.companyCode || `VCG-${Date.now()}`,
        companyName: doc.companyName,
        documentType: this.mapDocumentType(doc.type),
        content: doc.content,
        metadata: {
          period: doc.period,
          fiscal_year: doc.fiscalYear,
          language: 'en',
          source: 'Capital IQ',
          extracted_date: new Date().toISOString(),
          file_type: doc.fileType
        }
      };

      await this.storeCompanyDocument(vietnamDoc);
    }
  }

  /**
   * Get documents for a specific company
   */
  async getCompanyDocuments(companyCode: string): Promise<VietnamCompanyDocument[]> {
    try {
      // Search for documents in RAG system
      const results = await ragSystem.query(
        `company_code:${companyCode}`,
        {
          category: 'vietnam_company',
          limit: 50
        }
      );

      // Transform results to our document format
      const documents: VietnamCompanyDocument[] = [];
      
      for (const result of results) {
        if (result.metadata?.company_code === companyCode) {
          documents.push({
            companyCode: result.metadata.company_code,
            companyName: result.metadata.company_name || '',
            documentType: result.metadata.document_type || 'profile',
            content: result.content,
            metadata: {
              period: result.metadata.period,
              fiscal_year: result.metadata.fiscal_year,
              language: result.metadata.language || 'en',
              source: result.metadata.source || 'unknown',
              extracted_date: result.metadata.extracted_date || new Date().toISOString(),
              file_type: result.metadata.file_type
            }
          });
        }
      }

      return documents;
    } catch (error) {
      console.error(`Error getting documents for company ${companyCode}:`, error);
      return [];
    }
  }

  /**
   * Map Capital IQ document types to our types
   */
  private mapDocumentType(type: string): VietnamCompanyDocument['documentType'] {
    const typeMap: Record<string, VietnamCompanyDocument['documentType']> = {
      'Annual Report': 'annual_report',
      'Quarterly Report': 'quarterly_report',
      'Company Profile': 'profile',
      'Financial Statement': 'financial',
      'Tariff Analysis': 'tariff_analysis'
    };

    return typeMap[type] || 'profile';
  }
}

// Export singleton instance
export const vietnamCompanyRAG = new VietnamCompanyRAG();