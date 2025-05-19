#!/usr/bin/env node

/**
 * Real Capital IQ Data Extraction Script
 * Uses actual credentials to extract Vietnam company data
 * craig.turrell@sc.com / Victoria0405%
 */

import axios from 'axios';
import puppeteer, { Browser, Page } from 'puppeteer';
import { VietnamCompanyRAG } from '../src/services/VietnamCompanyRAG';
import path from 'path';
import fs from 'fs';

const CAPITAL_IQ_CREDENTIALS = {
  username: 'craig.turrell@sc.com',
  password: 'Victoria0405%'
};

const CAPITAL_IQ_BASE_URL = 'https://www.capitaliq.com';

interface CapitalIQCompany {
  capitalIQId: string;
  companyName: string;
  vietnamCode: string;
  taxId: string;
  annualRevenue: number;
  exportValue: number;
  importValue: number;
  industry: string;
  province: string;
}

class RealCapitalIQExtractor {
  private browser?: Browser;
  private page?: Page;
  private vietnamRAG: VietnamCompanyRAG;
  private outputPath: string;

  constructor() {
    this.vietnamRAG = new VietnamCompanyRAG();
    this.outputPath = path.join(process.cwd(), 'data_products', 'vietnam_real_companies.json');
  }

  async initialize() {
    console.log('Launching browser for real Capital IQ extraction...');
    this.browser = await puppeteer.launch({
      headless: false, // Set to true in production
      defaultViewport: { width: 1366, height: 768 }
    });
    
    this.page = await this.browser.newPage();
    
    // Set realistic user agent
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
  }

  async login() {
    console.log('Logging into Capital IQ with real credentials...');
    
    await this.page!.goto(`${CAPITAL_IQ_BASE_URL}/CIQDotNet/Login.aspx`, {
      waitUntil: 'networkidle2'
    });

    // Enter real credentials
    await this.page!.type('#username', CAPITAL_IQ_CREDENTIALS.username);
    await this.page!.type('#password', CAPITAL_IQ_CREDENTIALS.password);
    
    // Click login
    await this.page!.click('#loginButton');
    
    // Wait for successful login
    await this.page!.waitForNavigation({ waitUntil: 'networkidle2' });
    
    console.log('Successfully logged into Capital IQ');
  }

  async searchVietnamCompanies(): Promise<string[]> {
    console.log('Searching for Vietnam companies...');
    
    // Navigate to company search
    await this.page!.goto(`${CAPITAL_IQ_BASE_URL}/CIQDotNet/CompanySearch/CompanySearchResults.aspx`, {
      waitUntil: 'networkidle2'
    });

    // Set search criteria for Vietnam companies
    await this.page!.select('#CountryFilter', 'Vietnam');
    
    // Additional filters for active companies
    await this.page!.click('#ActiveCompaniesOnly');
    
    // Submit search
    await this.page!.click('#searchButton');
    
    // Wait for results
    await this.page!.waitForSelector('.company-results-table', { timeout: 60000 });

    // Extract company links
    const companyLinks = await this.page!.evaluate(() => {
      const links: string[] = [];
      document.querySelectorAll('.company-result-link').forEach(el => {
        if (el instanceof HTMLAnchorElement) {
          links.push(el.href);
        }
      });
      return links;
    });

    console.log(`Found ${companyLinks.length} Vietnam companies`);
    return companyLinks;
  }

  async extractCompanyData(companyUrl: string): Promise<CapitalIQCompany | null> {
    try {
      console.log(`Extracting data from: ${companyUrl}`);
      
      await this.page!.goto(companyUrl, { waitUntil: 'networkidle2' });
      
      // Extract real company data
      const companyData = await this.page!.evaluate(() => {
        const getText = (selector: string): string => {
          const element = document.querySelector(selector);
          return element?.textContent?.trim() || '';
        };

        const getNumber = (selector: string): number => {
          const text = getText(selector);
          return parseFloat(text.replace(/[^0-9.-]+/g, '')) || 0;
        };

        return {
          capitalIQId: getText('#CompanyId'),
          companyName: getText('#CompanyName'),
          vietnamCode: getText('[data-field="vietnam_code"]'),
          taxId: getText('[data-field="tax_id"]'),
          annualRevenue: getNumber('[data-field="revenue_ltm"]'),
          exportValue: getNumber('[data-field="export_value"]'),
          importValue: getNumber('[data-field="import_value"]'),
          industry: getText('[data-field="industry_classification"]'),
          province: getText('[data-field="headquarters_province"]')
        };
      });

      // Validate data
      if (!companyData.companyName || !companyData.capitalIQId) {
        console.warn('Invalid company data:', companyData);
        return null;
      }

      return companyData as CapitalIQCompany;
    } catch (error) {
      console.error(`Error extracting company data: ${error}`);
      return null;
    }
  }

  async extractFinancialDocuments(company: CapitalIQCompany): Promise<void> {
    console.log(`Extracting financial documents for ${company.companyName}...`);
    
    // Navigate to documents section
    const documentsUrl = `${CAPITAL_IQ_BASE_URL}/CIQDotNet/Company/CompanyDocuments.aspx?companyId=${company.capitalIQId}`;
    await this.page!.goto(documentsUrl, { waitUntil: 'networkidle2' });

    // Extract document links
    const documentLinks = await this.page!.evaluate(() => {
      const links: { type: string; url: string }[] = [];
      document.querySelectorAll('.document-link').forEach(el => {
        if (el instanceof HTMLAnchorElement) {
          const type = el.textContent?.trim() || 'Unknown';
          links.push({ type, url: el.href });
        }
      });
      return links;
    });

    // Download and store each document
    for (const doc of documentLinks) {
      if (this.isRelevantDocument(doc.type)) {
        await this.downloadAndStoreDocument(company, doc);
      }
    }
  }

  private isRelevantDocument(type: string): boolean {
    const relevantTypes = ['Annual Report', 'Financial Statement', 'Company Profile', 'Quarterly Report'];
    return relevantTypes.some(t => type.includes(t));
  }

  private async downloadAndStoreDocument(company: CapitalIQCompany, doc: { type: string; url: string }) {
    try {
      console.log(`Downloading ${doc.type} for ${company.companyName}...`);
      
      // Navigate to document page
      await this.page!.goto(doc.url, { waitUntil: 'networkidle2' });
      
      // Extract document content
      const content = await this.page!.evaluate(() => {
        // Try multiple selectors for document content
        const contentElement = document.querySelector('#documentContent') ||
                            document.querySelector('.document-body') ||
                            document.querySelector('.pdf-content');
        
        return contentElement?.textContent?.trim() || '';
      });

      if (content) {
        // Store in RAG system
        await this.vietnamRAG.storeCompanyDocument({
          companyCode: company.vietnamCode || `VCG-${company.capitalIQId}`,
          companyName: company.companyName,
          documentType: this.mapDocumentType(doc.type),
          content: content,
          metadata: {
            fiscal_year: new Date().getFullYear().toString(),
            language: 'en',
            source: 'Capital IQ',
            extracted_date: new Date().toISOString(),
            file_type: 'html'
          }
        });

        console.log(`Successfully stored ${doc.type} for ${company.companyName}`);
      }
    } catch (error) {
      console.error(`Error downloading document: ${error}`);
    }
  }

  private mapDocumentType(type: string): 'profile' | 'financial' | 'annual_report' | 'quarterly_report' | 'tariff_analysis' {
    if (type.includes('Annual Report')) return 'annual_report';
    if (type.includes('Quarterly')) return 'quarterly_report';
    if (type.includes('Financial')) return 'financial';
    if (type.includes('Profile')) return 'profile';
    return 'profile';
  }

  async saveResults(companies: CapitalIQCompany[]) {
    console.log(`Saving ${companies.length} companies to ${this.outputPath}`);
    
    // Ensure directory exists
    const dir = path.dirname(this.outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Save data
    fs.writeFileSync(this.outputPath, JSON.stringify(companies, null, 2));
    
    // Also save to backup
    const backupPath = this.outputPath.replace('.json', `_${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(companies, null, 2));
    
    console.log('Data saved successfully');
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.login();
      
      // Search for Vietnam companies
      const companyLinks = await this.searchVietnamCompanies();
      
      // Extract data for each company
      const companies: CapitalIQCompany[] = [];
      
      for (let i = 0; i < Math.min(companyLinks.length, 50); i++) { // Limit to 50 for testing
        const company = await this.extractCompanyData(companyLinks[i]);
        
        if (company) {
          companies.push(company);
          
          // Extract financial documents
          await this.extractFinancialDocuments(company);
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        // Save progress every 10 companies
        if (i > 0 && i % 10 === 0) {
          await this.saveResults(companies);
          console.log(`Progress: ${i}/${companyLinks.length} companies processed`);
        }
      }
      
      // Save final results
      await this.saveResults(companies);
      
      console.log('Extraction completed successfully');
      console.log(`Total companies extracted: ${companies.length}`);
      
    } catch (error) {
      console.error('Error during extraction:', error);
    } finally {
      await this.close();
    }
  }
}

// Main execution
async function main() {
  const extractor = new RealCapitalIQExtractor();
  await extractor.run();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { RealCapitalIQExtractor };