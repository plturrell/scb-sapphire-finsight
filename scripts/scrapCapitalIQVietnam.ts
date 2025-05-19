/**
 * Web scraper for S&P Capital IQ Vietnam company data
 * Uses Playwright/Puppeteer for authenticated web scraping
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

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

class CapitalIQScraper {
  private browser: any;
  private page: any;
  private credentials = {
    email: 'craig.turrell@sc.com',
    password: 'Victoria0405%'
  };

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for production
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 800 });
  }

  async login() {
    console.log('Navigating to Capital IQ login page...');
    await this.page.goto('https://www.capitaliq.spglobal.com/login', {
      waitUntil: 'networkidle2'
    });

    // Wait for login form
    await this.page.waitForSelector('#username', { visible: true });
    
    // Fill in credentials
    await this.page.type('#username', this.credentials.email);
    await this.page.type('#password', this.credentials.password);
    
    // Click login button
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'networkidle2' }),
      this.page.click('#login-button')
    ]);

    console.log('Logged in successfully');
  }

  async searchVietnamCompanies() {
    console.log('Searching for Vietnam companies...');
    
    // Navigate to search page
    await this.page.goto('https://www.capitaliq.spglobal.com/search/companies', {
      waitUntil: 'networkidle2'
    });

    // Wait for search filters to load
    await this.page.waitForSelector('#country-filter', { visible: true });
    
    // Select Vietnam as country
    await this.page.select('#country-filter', 'Vietnam');
    
    // Set additional filters
    await this.page.click('#include-private-companies');
    await this.page.click('#include-public-companies');
    
    // Execute search
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'networkidle2' }),
      this.page.click('#search-button')
    ]);

    // Wait for results
    await this.page.waitForSelector('.company-results', { visible: true });
    
    // Extract real Capital IQ company links
    const companyLinks = await this.page.evaluate(() => {
      const links: string[] = [];
      const elements = document.querySelectorAll('.search-result-item a, .company-link, [data-link-type="company"]');
      elements.forEach(el => {
        if (el instanceof HTMLAnchorElement && el.href) {
          links.push(el.href);
        }
      });
      return links;
    });

    return companyLinks;
  }

  async extractCompanyData(companyUrl: string): Promise<VietnamCompany | null> {
    try {
      await this.page.goto(companyUrl, { waitUntil: 'networkidle2' });
      
      // Wait for actual Capital IQ content to load
      await this.page.waitForSelector('#company-header', { timeout: 30000 });
      
      // Extract REAL Capital IQ company data using their actual selectors
      const companyData = await this.page.evaluate(() => {
        const extractText = (selector: string, fallback: string = '') => {
          const element = document.querySelector(selector);
          if (!element) {
            // Try data attribute selectors used by Capital IQ
            const dataElement = document.querySelector(`[data-field="${fallback}"]`);
            return dataElement ? dataElement.textContent?.trim() : null;
          }
          return element.textContent?.trim() || null;
        };

        const extractNumber = (selector: string, fallback: string = '') => {
          const text = extractText(selector, fallback);
          return text ? parseFloat(text.replace(/[^0-9.-]+/g, '')) : null;
        };

        // Capital IQ specific selectors
        return {
          companyName: extractText('#company-name-header', 'company_name'),
          companyNameLocal: extractText('.name-local', 'local_name'),
          capitalIQId: extractText('#ciq-id', 'capital_iq_id'),
          taxCode: extractText('.tax-identification', 'tax_id'),
          registrationNumber: extractText('.business-registration', 'registration_number'),
          industry: extractText('.gics-classification', 'industry'),
          companyType: extractText('.entity-type', 'company_type'),
          province: extractText('.headquarters-region', 'province'),
          district: extractText('.headquarters-district', 'district'),
          address: extractText('.headquarters-address', 'address'),
          phone: extractText('.main-phone', 'phone'),
          email: extractText('.company-email', 'email'),
          website: extractText('.company-website', 'website'),
          establishedDate: extractText('.incorporation-date', 'established_date'),
          registeredCapital: extractNumber('.registered-capital-amount', 'registered_capital'),
          employeeCount: extractNumber('.total-employees', 'employee_count'),
          annualRevenue: extractNumber('.revenue-ltm', 'annual_revenue'),
          ticker: extractText('.ticker-primary', 'ticker_symbol'),
          creditRating: extractText('.sp-rating', 'credit_rating'),
          listingStatus: extractText('.exchange-listing', 'listing_status')
        };
      });

      // Get REAL financial and trade data from Capital IQ
      const hasFinancials = await this.page.$('#financials-tab, .financials-section');
      if (hasFinancials) {
        // Capital IQ uses specific navigation for financial sections
        await this.page.click('#financials-tab, .financials-link');
        await this.page.waitForSelector('.financial-statements, #financial-data', { visible: true });
        
        const financialData = await this.page.evaluate(() => {
          const extractNumber = (selector: string, fallback: string = '') => {
            const element = document.querySelector(selector) || 
                           document.querySelector(`[data-field="${fallback}"]`);
            const text = element?.textContent?.trim();
            return text ? parseFloat(text.replace(/[^0-9.-]+/g, '')) : null;
          };

          const extractText = (selector: string, fallback: string = '') => {
            const element = document.querySelector(selector) || 
                           document.querySelector(`[data-field="${fallback}"]`);
            return element?.textContent?.trim() || null;
          };

          // Capital IQ specific financial and trade data selectors
          return {
            exportValue: extractNumber('.export-revenue-total', 'export_value'),
            importValue: extractNumber('.import-value-total', 'import_value'),
            exportProducts: extractText('.key-export-products', 'export_products'),
            importProducts: extractText('.key-import-products', 'import_products'),
            tradingPartners: extractText('.major-trading-partners', 'trading_partners'),
            exportValueUSD: extractNumber('.export-value-usd', 'export_value_usd'),
            importValueUSD: extractNumber('.import-value-usd', 'import_value_usd'),
            tradeBalance: extractNumber('.trade-balance', 'trade_balance'),
            exportGrowthRate: extractNumber('.export-growth-yoy', 'export_growth_rate'),
            importGrowthRate: extractNumber('.import-growth-yoy', 'import_growth_rate')
          };
        });

        Object.assign(companyData, financialData);
      }
      
      console.log(`Successfully extracted REAL Capital IQ data for: ${companyData.companyName}`);
      return companyData;
    } catch (error) {
      console.error(`Error extracting data from ${companyUrl}:`, error);
      return null;
    }
  }

  async close() {
    await this.browser.close();
  }
}

/**
 * Transform scraped data to our Vietnam Company format
 */
function transformToVietnamCompany(scrapedData: any, index: number): VietnamCompany {
  return {
    VietnamCompanyCode: `VCG-${String(index + 1).padStart(4, '0')}`,
    CompanyName: scrapedData.companyName,
    CompanyNameLocal: scrapedData.companyNameLocal,
    TaxCode: scrapedData.taxCode,
    BusinessRegistrationNumber: scrapedData.registrationNumber,
    IndustryCode: mapIndustryCode(scrapedData.industry),
    CompanyType: mapCompanyType(scrapedData.companyType),
    CompanyTypeText: scrapedData.companyType,
    Province: scrapedData.province,
    District: scrapedData.district,
    Address: scrapedData.address,
    PhoneNumber: scrapedData.phone,
    Email: scrapedData.email,
    Website: scrapedData.website,
    EstablishedDate: scrapedData.establishedDate,
    RegisteredCapital: scrapedData.registeredCapital,
    RegisteredCapitalCurrency: 'VND',
    EmployeeCount: scrapedData.employeeCount,
    AnnualRevenue: scrapedData.annualRevenue,
    AnnualRevenueCurrency: 'VND',
    ExportValue: scrapedData.exportValue,
    ExportValueCurrency: 'USD',
    ImportValue: scrapedData.importValue,
    ImportValueCurrency: 'USD',
    MainExportProducts: scrapedData.exportProducts,
    MainImportProducts: scrapedData.importProducts,
    TradingPartners: scrapedData.tradingPartners,
    CreditRating: scrapedData.creditRating,
    ListingStatus: scrapedData.listingStatus,
    StockSymbol: scrapedData.ticker,
    Status: 'Active',
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
 * Main execution function
 */
async function main() {
  const scraper = new CapitalIQScraper();
  
  try {
    console.log('Starting S&P Capital IQ data extraction for Vietnam companies...');
    
    await scraper.initialize();
    await scraper.login();
    
    const companyLinks = await scraper.searchVietnamCompanies();
    console.log(`Found ${companyLinks.length} Vietnam companies`);
    
    const companies: VietnamCompany[] = [];
    
    // Extract data for each company
    for (let i = 0; i < companyLinks.length; i++) {
      console.log(`Processing company ${i + 1}/${companyLinks.length}`);
      
      const companyData = await scraper.extractCompanyData(companyLinks[i]);
      if (companyData) {
        const vietnamCompany = transformToVietnamCompany(companyData, i);
        companies.push(vietnamCompany);
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Save data
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
  } finally {
    await scraper.close();
  }
}

// Run the scraper
if (require.main === module) {
  main().catch(console.error);
}

export { CapitalIQScraper, main };