/**
 * Parser for manual CSV export from S&P Capital IQ
 * Converts Capital IQ CSV export to our Vietnam Company data format
 */

import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

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

/**
 * Map Capital IQ CSV columns to our data structure
 */
const COLUMN_MAPPING = {
  // Capital IQ Column Name -> Our Field Name
  'Company Name': 'CompanyName',
  'Local Name': 'CompanyNameLocal',
  'Tax ID': 'TaxCode',
  'Business Registration Number': 'BusinessRegistrationNumber',
  'GICS Industry': 'IndustryCode',
  'Company Type': 'CompanyType',
  'Province/State': 'Province',
  'City': 'District',
  'Address': 'Address',
  'Phone': 'PhoneNumber',
  'Email': 'Email',
  'Website': 'Website',
  'Founded Date': 'EstablishedDate',
  'Registered Capital': 'RegisteredCapital',
  'Employees': 'EmployeeCount',
  'Revenue (LTM)': 'AnnualRevenue',
  'Revenue Currency': 'AnnualRevenueCurrency',
  'Export Revenue': 'ExportValue',
  'Import Value': 'ImportValue',
  'Credit Rating': 'CreditRating',
  'Exchange': 'ListingStatus',
  'Ticker': 'StockSymbol',
  'Ultimate Parent Company': 'ParentCompany',
  'Status': 'Status'
};

/**
 * Parse Capital IQ CSV export
 */
async function parseCapitalIQExport(csvFilePath: string): Promise<VietnamCompany[]> {
  return new Promise((resolve, reject) => {
    const companies: VietnamCompany[] = [];
    let companyIndex = 1;

    if (!fs.existsSync(csvFilePath)) {
      reject(new Error(`CSV file not found: ${csvFilePath}`));
      return;
    }

    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        // Convert CSV row to Vietnam Company format
        const company: VietnamCompany = {
          VietnamCompanyCode: `VCG-${String(companyIndex).padStart(4, '0')}`,
          CompanyName: '',
          Status: 'Active',
          LastUpdated: new Date().toISOString(),
          DataSource: 'S&P Capital IQ'
        };

        // Map CSV columns to our fields
        for (const [csvColumn, ourField] of Object.entries(COLUMN_MAPPING)) {
          if (row[csvColumn]) {
            (company as any)[ourField] = cleanValue(row[csvColumn], ourField);
          }
        }

        // Process industry code
        if (company.IndustryCode) {
          company.IndustryCode = mapIndustryCode(company.IndustryCode);
        }

        // Process company type
        if (company.CompanyType) {
          company.CompanyTypeText = company.CompanyType;
          company.CompanyType = mapCompanyType(company.CompanyType);
        }

        // Process listing status
        if (company.StockSymbol || row['Exchange']) {
          company.ListingStatus = 'Listed';
        } else {
          company.ListingStatus = 'Private';
        }

        // Process currencies
        if (!company.RegisteredCapitalCurrency && company.RegisteredCapital) {
          company.RegisteredCapitalCurrency = 'VND';
        }
        if (!company.AnnualRevenueCurrency && company.AnnualRevenue) {
          company.AnnualRevenueCurrency = 'VND';
        }
        if (!company.ExportValueCurrency && company.ExportValue) {
          company.ExportValueCurrency = 'USD';
        }
        if (!company.ImportValueCurrency && company.ImportValue) {
          company.ImportValueCurrency = 'USD';
        }

        companies.push(company);
        companyIndex++;
      })
      .on('end', () => {
        console.log(`Parsed ${companies.length} companies from CSV`);
        resolve(companies);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Clean and format values from CSV
 */
function cleanValue(value: string, fieldName: string): any {
  if (!value || value.trim() === '' || value.trim() === 'N/A') {
    return undefined;
  }

  // Handle numeric fields
  if (['RegisteredCapital', 'EmployeeCount', 'AnnualRevenue', 'ExportValue', 'ImportValue'].includes(fieldName)) {
    // Remove commas and currency symbols
    const cleanedValue = value.replace(/[,\$₫]/g, '').trim();
    const numValue = parseFloat(cleanedValue);
    return isNaN(numValue) ? undefined : numValue;
  }

  // Handle date fields
  if (['EstablishedDate'].includes(fieldName)) {
    try {
      const date = new Date(value);
      return isNaN(date.getTime()) ? undefined : date.toISOString().split('T')[0];
    } catch {
      return undefined;
    }
  }

  return value.trim();
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
 * Main function to parse and save Capital IQ export
 */
async function main() {
  const csvFilePath = path.join(
    __dirname,
    '..',
    '..',
    'data_products',
    'vietnam_companies_capitaliq_export.csv'
  );

  const jsonOutputPath = path.join(
    __dirname,
    '..',
    '..',
    'data_products',
    'vietnam_companies_capitaliq.json'
  );

  try {
    console.log('Starting Capital IQ CSV parsing...');
    console.log(`Looking for CSV file: ${csvFilePath}`);

    const companies = await parseCapitalIQExport(csvFilePath);
    
    // Save to JSON
    fs.writeFileSync(jsonOutputPath, JSON.stringify(companies, null, 2));
    
    console.log(`Successfully parsed and saved ${companies.length} Vietnam companies`);
    console.log(`Output saved to: ${jsonOutputPath}`);

    // Also save a summary
    const summary = {
      totalCompanies: companies.length,
      exportDate: new Date().toISOString(),
      industries: companies.reduce((acc: any, company) => {
        const industry = company.IndustryCode || 'Unknown';
        acc[industry] = (acc[industry] || 0) + 1;
        return acc;
      }, {}),
      provinces: companies.reduce((acc: any, company) => {
        const province = company.Province || 'Unknown';
        acc[province] = (acc[province] || 0) + 1;
        return acc;
      }, {}),
      listedCompanies: companies.filter(c => c.ListingStatus === 'Listed').length,
      privateCompanies: companies.filter(c => c.ListingStatus === 'Private').length
    };

    const summaryPath = path.join(
      __dirname,
      '..',
      '..',
      'data_products',
      'vietnam_companies_summary.json'
    );

    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`Summary saved to: ${summaryPath}`);

  } catch (error) {
    console.error('Error parsing Capital IQ export:', error);
    
    console.log('\nInstructions for manual export from Capital IQ:');
    console.log('1. Log in to https://www.capitaliq.spglobal.com');
    console.log('2. Navigate to Screening > Company Screening');
    console.log('3. Set filters:');
    console.log('   - Geography: Vietnam');
    console.log('   - Status: Active');
    console.log('   - Include: Private and Public companies');
    console.log('4. Configure columns to include:');
    console.log('   - Company Name');
    console.log('   - Local Name');
    console.log('   - Tax ID');
    console.log('   - Business Registration Number');
    console.log('   - GICS Industry');
    console.log('   - Company Type');
    console.log('   - Province/State');
    console.log('   - City');
    console.log('   - Address');
    console.log('   - Phone');
    console.log('   - Website');
    console.log('   - Founded Date');
    console.log('   - Employees');
    console.log('   - Revenue (LTM)');
    console.log('   - Exchange');
    console.log('   - Ticker');
    console.log('5. Export to CSV');
    console.log(`6. Save as: ${csvFilePath}`);
    console.log('7. Run this script again');
  }
}

// Run the parser
if (require.main === module) {
  main();
}

export { parseCapitalIQExport, main };