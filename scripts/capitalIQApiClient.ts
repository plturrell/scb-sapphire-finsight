/**
 * S&P Capital IQ API Client for Vietnam Company Data
 * Uses the Physical Documents Search and Download Service API
 */

import axios, { AxiosInstance } from 'axios';
import fs from 'fs';
import path from 'path';

interface CapitalIQCredentials {
  username: string;
  password: string;
  apiKey?: string;
}

interface DocumentSearchRequest {
  companyNames?: string[];
  companyIds?: string[];
  country?: string;
  documentTypes?: string[];
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

interface VietnamCompany {
  VietnamCompanyCode: string;
  CompanyName: string;
  CompanyNameLocal?: string;
  TaxCode?: string;
  BusinessRegistrationNumber?: string;
  IndustryCode?: string;
  CompanyType?: string;
  CompanyTypeText?: string;
  Province?: string;
  District?: string;
  Address?: string;
  PhoneNumber?: string;
  Email?: string;
  Website?: string;
  EstablishedDate?: string;
  RegisteredCapital?: number;
  RegisteredCapitalCurrency?: string;
  EmployeeCount?: number;
  AnnualRevenue?: number;
  AnnualRevenueCurrency?: string;
  ExportValue?: number;
  ExportValueCurrency?: string;
  ImportValue?: number;
  ImportValueCurrency?: string;
  MainExportProducts?: string;
  MainImportProducts?: string;
  TradingPartners?: string;
  CreditRating?: string;
  ListingStatus?: string;
  StockSymbol?: string;
  ParentCompany?: string;
  Status?: string;
  LastUpdated?: string;
  DataSource?: string;
}

class CapitalIQAPIClient {
  private credentials: CapitalIQCredentials;
  private axiosInstance: AxiosInstance;
  private baseURL = 'https://api-ciq.marketintelligence.spglobal.com/gds/documents';

  constructor() {
    this.credentials = {
      username: 'craig.turrell@sc.com',
      password: 'Victoria0405%'
    };

    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Add authentication interceptor
    this.axiosInstance.interceptors.request.use((config) => {
      // Basic auth header
      const authString = `${this.credentials.username}:${this.credentials.password}`;
      const base64Auth = Buffer.from(authString).toString('base64');
      config.headers['Authorization'] = `Basic ${base64Auth}`;
      return config;
    });
  }

  /**
   * Get reference data for available fields and values
   */
  async getReference(): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/api/v1/reference');
      return response.data;
    } catch (error) {
      console.error('Error fetching reference data:', error);
      throw error;
    }
  }

  /**
   * Search for Vietnam company documents
   */
  async searchCompanyDocuments(searchRequest: DocumentSearchRequest): Promise<any> {
    try {
      const payload = {
        country: 'Vietnam',
        documentTypes: ['Annual Reports', 'Quarterly Reports', 'Company Profiles'],
        limit: searchRequest.limit || 100,
        dateFrom: searchRequest.dateFrom || '2020-01-01',
        dateTo: searchRequest.dateTo || new Date().toISOString().split('T')[0],
        ...searchRequest
      };

      const response = await this.axiosInstance.post('/api/v1/search', payload);
      return response.data;
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }

  /**
   * Download specific document
   */
  async downloadDocument(documentId: string, format: string = 'json'): Promise<any> {
    try {
      const payload = {
        documentId,
        format
      };

      const response = await this.axiosInstance.post('/api/v1/download', payload);
      return response.data;
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  }

  /**
   * Extract company information from document data
   */
  extractCompanyInfo(documentData: any): Partial<VietnamCompany> {
    // Parse the document data and extract relevant fields
    const companyInfo: Partial<VietnamCompany> = {};

    if (documentData.companyName) {
      companyInfo.CompanyName = documentData.companyName;
    }

    if (documentData.companyNameLocal) {
      companyInfo.CompanyNameLocal = documentData.companyNameLocal;
    }

    if (documentData.taxId || documentData.businessRegistrationNumber) {
      companyInfo.TaxCode = documentData.taxId;
      companyInfo.BusinessRegistrationNumber = documentData.businessRegistrationNumber;
    }

    if (documentData.industry) {
      companyInfo.IndustryCode = this.mapIndustryCode(documentData.industry);
    }

    if (documentData.headquarters) {
      companyInfo.Province = documentData.headquarters.province;
      companyInfo.District = documentData.headquarters.district;
      companyInfo.Address = documentData.headquarters.address;
    }

    if (documentData.financials) {
      companyInfo.AnnualRevenue = documentData.financials.revenue;
      companyInfo.AnnualRevenueCurrency = documentData.financials.currency || 'VND';
      companyInfo.EmployeeCount = documentData.financials.employees;
    }

    if (documentData.ticker) {
      companyInfo.StockSymbol = documentData.ticker;
      companyInfo.ListingStatus = 'Listed';
    }

    companyInfo.Status = 'Active';
    companyInfo.LastUpdated = new Date().toISOString();
    companyInfo.DataSource = 'S&P Capital IQ';

    return companyInfo;
  }

  /**
   * Map industry names to standard codes
   */
  private mapIndustryCode(industry: string): string {
    const industryMap: { [key: string]: string } = {
      'technology': 'IT',
      'information technology': 'IT',
      'finance': 'FINANCE',
      'banking': 'BANKING',
      'retail': 'RETAIL',
      'manufacturing': 'MANUFACTURING',
      'real estate': 'REALESTATE',
      'construction': 'CONSTRUCTION',
      'food': 'FOOD',
      'textile': 'TEXTILE',
      'agriculture': 'AGRICULTURE',
      'energy': 'ENERGY',
      'telecommunications': 'TELECOM',
      'healthcare': 'HEALTHCARE',
      'transportation': 'TRANSPORT'
    };

    const normalized = industry?.toLowerCase() || '';
    for (const [key, value] of Object.entries(industryMap)) {
      if (normalized.includes(key)) {
        return value;
      }
    }
    return 'OTHER';
  }
}

/**
 * Main function to extract Vietnam company data
 */
async function extractVietnamCompanies() {
  const client = new CapitalIQAPIClient();
  
  try {
    console.log('Starting Vietnam company data extraction from S&P Capital IQ...');
    
    // First, get reference data to understand available fields
    console.log('Fetching reference data...');
    const referenceData = await client.getReference();
    console.log('Reference data:', referenceData);
    
    // Search for Vietnam company documents
    console.log('Searching for Vietnam company documents...');
    const searchResults = await client.searchCompanyDocuments({
      country: 'Vietnam',
      documentTypes: ['Annual Reports', 'Company Profiles'],
      limit: 500
    });
    
    console.log(`Found ${searchResults.numRows} documents`);
    
    const companies: VietnamCompany[] = [];
    let companyIndex = 1;
    
    // Process each document
    for (const row of searchResults.rows) {
      try {
        const documentId = row.documentId;
        console.log(`Processing document ${documentId}...`);
        
        // Download the document
        const documentData = await client.downloadDocument(documentId);
        
        // Extract company information
        const companyInfo = client.extractCompanyInfo(documentData);
        
        // Create Vietnam company record
        const vietnamCompany: VietnamCompany = {
          VietnamCompanyCode: `VCG-${String(companyIndex).padStart(4, '0')}`,
          CompanyName: companyInfo.CompanyName || '',
          ...companyInfo
        } as VietnamCompany;
        
        companies.push(vietnamCompany);
        companyIndex++;
        
        // Rate limiting - 1 request per second
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error processing document:`, error);
      }
    }
    
    // Save the extracted data
    const outputPath = path.join(
      __dirname,
      '..',
      '..',
      'data_products',
      'vietnam_companies_capitaliq.json'
    );
    
    fs.writeFileSync(outputPath, JSON.stringify(companies, null, 2));
    
    console.log(`Successfully extracted ${companies.length} Vietnam companies`);
    console.log(`Data saved to ${outputPath}`);
    
  } catch (error) {
    console.error('Error during extraction:', error);
    throw error;
  }
}

// Alternative approach using manual reference data
async function extractUsingManualData() {
  // For cases where API access is limited, we can provide a CSV parser
  const csvFilePath = path.join(
    __dirname,
    '..',
    '..',
    'data_products',
    'vietnam_companies_capitaliq_export.csv'
  );
  
  if (fs.existsSync(csvFilePath)) {
    console.log('Found manual export file, processing...');
    // CSV parsing logic would go here
    // This is a fallback option if API access is restricted
  } else {
    console.log('Please export data manually from Capital IQ and save as:');
    console.log(csvFilePath);
    console.log('\nInstructions:');
    console.log('1. Log in to https://www.capitaliq.spglobal.com');
    console.log('2. Go to Screening > Company Screening');
    console.log('3. Filter for Vietnam companies');
    console.log('4. Export to CSV with all available fields');
  }
}

// Run the extraction
if (require.main === module) {
  extractVietnamCompanies().catch(error => {
    console.error('API extraction failed, trying manual method...');
    extractUsingManualData();
  });
}

export { CapitalIQAPIClient, extractVietnamCompanies, extractUsingManualData };