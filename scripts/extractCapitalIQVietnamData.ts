/**
 * Script to extract Vietnam company data from S&P Capital IQ
 * Uses provided credentials to authenticate and fetch real company data
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';

interface CapitalIQCredentials {
  email: string;
  password: string;
  baseUrl: string;
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

class CapitalIQClient {
  private credentials: CapitalIQCredentials;
  private authToken: string | null = null;
  private axiosInstance: any;

  constructor() {
    this.credentials = {
      email: 'craig.turrell@sc.com',
      password: 'Victoria0405%',
      baseUrl: 'https://www.capitaliq.spglobal.com'
    };

    this.axiosInstance = axios.create({
      baseURL: this.credentials.baseUrl,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Authenticate with Capital IQ
   */
  async authenticate(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post('/api/v1/authenticate', {
        username: this.credentials.email,
        password: this.credentials.password
      });

      if (response.data && response.data.token) {
        this.authToken = response.data.token;
        this.axiosInstance.defaults.headers['Authorization'] = `Bearer ${this.authToken}`;
        console.log('Successfully authenticated with Capital IQ');
        return true;
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      // Try alternative authentication endpoint
      try {
        const loginResponse = await this.axiosInstance.post('/auth/login', {
          email: this.credentials.email,
          password: this.credentials.password
        });

        if (loginResponse.data && loginResponse.data.sessionToken) {
          this.authToken = loginResponse.data.sessionToken;
          this.axiosInstance.defaults.headers['Authorization'] = `Bearer ${this.authToken}`;
          console.log('Successfully authenticated with Capital IQ (alternative method)');
          return true;
        }
      } catch (altError) {
        console.error('Alternative authentication also failed:', altError);
      }
    }
    return false;
  }

  /**
   * Search for Vietnam companies
   */
  async searchVietnamCompanies(searchCriteria?: any): Promise<any[]> {
    const defaultCriteria = {
      country: 'Vietnam',
      status: 'Active',
      includePrivate: true,
      includePublic: true,
      limit: 1000
    };

    const criteria = { ...defaultCriteria, ...searchCriteria };

    try {
      const response = await this.axiosInstance.post('/api/v1/companies/search', criteria);
      return response.data.companies || [];
    } catch (error) {
      console.error('Error searching companies:', error);
      // Try alternative search endpoint
      try {
        const altResponse = await this.axiosInstance.get('/api/companies/search', {
          params: {
            country: 'VN',
            region: 'APAC',
            ...criteria
          }
        });
        return altResponse.data.results || [];
      } catch (altError) {
        console.error('Alternative search also failed:', altError);
        return [];
      }
    }
  }

  /**
   * Get detailed company information
   */
  async getCompanyDetails(companyId: string): Promise<any> {
    try {
      const response = await this.axiosInstance.get(`/api/v1/companies/${companyId}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting details for company ${companyId}:`, error);
      return null;
    }
  }

  /**
   * Get financial data for a company
   */
  async getCompanyFinancials(companyId: string): Promise<any> {
    try {
      const response = await this.axiosInstance.get(`/api/v1/companies/${companyId}/financials`);
      return response.data;
    } catch (error) {
      console.error(`Error getting financials for company ${companyId}:`, error);
      return null;
    }
  }
}

/**
 * Transform Capital IQ data to our Vietnam Company format
 */
function transformToVietnamCompany(capitalIQData: any, index: number): VietnamCompany {
  return {
    VietnamCompanyCode: `VCG-${String(index + 1).padStart(4, '0')}`,
    CompanyName: capitalIQData.companyName || capitalIQData.name,
    CompanyNameLocal: capitalIQData.localName || capitalIQData.nameLocal,
    TaxCode: capitalIQData.taxId || capitalIQData.taxIdentificationNumber,
    BusinessRegistrationNumber: capitalIQData.registrationNumber || capitalIQData.businessRegNumber,
    IndustryCode: mapIndustryCode(capitalIQData.industry || capitalIQData.sector),
    CompanyType: mapCompanyType(capitalIQData.companyType || capitalIQData.organizationType),
    CompanyTypeText: capitalIQData.companyTypeDescription || capitalIQData.organizationTypeText,
    Province: capitalIQData.state || capitalIQData.province || capitalIQData.region,
    District: capitalIQData.district || capitalIQData.subRegion,
    Address: capitalIQData.address || capitalIQData.streetAddress,
    PhoneNumber: capitalIQData.phone || capitalIQData.phoneNumber,
    Email: capitalIQData.email || capitalIQData.contactEmail,
    Website: capitalIQData.website || capitalIQData.webUrl,
    EstablishedDate: capitalIQData.foundedDate || capitalIQData.incorporationDate,
    RegisteredCapital: capitalIQData.registeredCapital || capitalIQData.authorizedCapital,
    RegisteredCapitalCurrency: capitalIQData.currency || 'VND',
    EmployeeCount: capitalIQData.employees || capitalIQData.employeeCount,
    AnnualRevenue: capitalIQData.revenue || capitalIQData.annualRevenue,
    AnnualRevenueCurrency: capitalIQData.revenueCurrency || 'VND',
    ExportValue: capitalIQData.exportRevenue || capitalIQData.internationalRevenue,
    ExportValueCurrency: capitalIQData.exportCurrency || 'USD',
    ImportValue: capitalIQData.importValue,
    ImportValueCurrency: capitalIQData.importCurrency || 'USD',
    MainExportProducts: capitalIQData.mainProducts || capitalIQData.productDescription,
    MainImportProducts: capitalIQData.importProducts,
    TradingPartners: capitalIQData.keyMarkets || capitalIQData.tradingCountries,
    CreditRating: capitalIQData.creditRating || capitalIQData.rating,
    ListingStatus: capitalIQData.publicStatus || (capitalIQData.isPublic ? 'Listed' : 'Private'),
    StockSymbol: capitalIQData.ticker || capitalIQData.stockSymbol,
    ParentCompany: capitalIQData.parentCompanyId || capitalIQData.ultimateParent,
    Status: capitalIQData.status || 'Active',
    LastUpdated: new Date().toISOString(),
    DataSource: 'S&P Capital IQ'
  };
}

/**
 * Map industry names to standard codes
 */
function mapIndustryCode(industry: string): string {
  const industryMap: { [key: string]: string } = {
    'technology': 'IT',
    'information technology': 'IT',
    'software': 'IT',
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
    'transportation': 'TRANSPORT',
    'education': 'EDUCATION',
    'consumer goods': 'CONSUMER',
    'industrial': 'INDUSTRIAL'
  };

  const normalized = industry?.toLowerCase() || '';
  for (const [key, value] of Object.entries(industryMap)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  return 'OTHER';
}

/**
 * Map company types to standard codes
 */
function mapCompanyType(type: string): string {
  const typeMap: { [key: string]: string } = {
    'joint stock': 'JSC',
    'limited liability': 'LLC',
    'state owned': 'SOE',
    'foreign invested': 'FIE',
    'private': 'PRIVATE',
    'partnership': 'PARTNERSHIP',
    'public': 'PUBLIC'
  };

  const normalized = type?.toLowerCase() || '';
  for (const [key, value] of Object.entries(typeMap)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  return 'OTHER';
}

/**
 * Main extraction function
 */
async function main() {
  console.log('Starting Vietnam company data extraction from S&P Capital IQ...');
  
  const client = new CapitalIQClient();
  
  // Authenticate
  const authenticated = await client.authenticate();
  if (!authenticated) {
    console.error('Failed to authenticate with Capital IQ');
    return;
  }

  // Search for Vietnam companies
  console.log('Searching for Vietnam companies...');
  const companies = await client.searchVietnamCompanies({
    sectors: ['All'],
    minRevenue: 0,
    includeSubsidiaries: true
  });

  console.log(`Found ${companies.length} companies`);

  // Get detailed information for each company
  const detailedCompanies: VietnamCompany[] = [];
  
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    console.log(`Processing company ${i + 1}/${companies.length}: ${company.name || company.companyName}`);
    
    // Get detailed information
    const details = await client.getCompanyDetails(company.id || company.companyId);
    const financials = await client.getCompanyFinancials(company.id || company.companyId);
    
    // Merge all data
    const mergedData = {
      ...company,
      ...details,
      ...financials
    };
    
    // Transform to our format
    const vietnamCompany = transformToVietnamCompany(mergedData, i);
    detailedCompanies.push(vietnamCompany);
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Sort by company code
  detailedCompanies.sort((a, b) => a.VietnamCompanyCode.localeCompare(b.VietnamCompanyCode));
  
  // Save to JSON file
  const outputPath = path.join(
    __dirname,
    '..',
    '..',
    'data_products',
    'vietnam_companies_capitaliq.json'
  );
  
  fs.writeFileSync(outputPath, JSON.stringify(detailedCompanies, null, 2));
  
  console.log(`Successfully extracted ${detailedCompanies.length} Vietnam companies from Capital IQ`);
  console.log(`Data saved to ${outputPath}`);
}

// Run the extraction
if (require.main === module) {
  main().catch(console.error);
}

export { CapitalIQClient, transformToVietnamCompany, main };