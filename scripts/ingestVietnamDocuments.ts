/**
 * Document Ingestion Pipeline for Vietnam Company Data
 * Ingests data from Capital IQ and stores in RAG for report generation
 */

import { vietnamCompanyRAG } from '../src/services/VietnamCompanyRAG';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

interface DocumentIngestionOptions {
  source: 'capitaliq' | 'file' | 'api';
  batchSize?: number;
  documentTypes?: string[];
}

class VietnamDocumentIngestion {
  private dataProductsPath: string;
  private documentsPath: string;
  private capitalIQCredentials = {
    username: 'craig.turrell@sc.com',
    password: 'Victoria0405%'
  };

  constructor() {
    this.dataProductsPath = path.join(process.cwd(), 'data_products');
    this.documentsPath = path.join(process.cwd(), 'data_products', 'documents');
  }

  /**
   * Main ingestion pipeline
   */
  async ingestDocuments(options: DocumentIngestionOptions): Promise<void> {
    console.log('Starting Vietnam document ingestion pipeline...');
    console.log(`Source: ${options.source}`);
    
    try {
      switch (options.source) {
        case 'capitaliq':
          await this.ingestFromCapitalIQ(options);
          break;
        case 'file':
          await this.ingestFromFiles(options);
          break;
        case 'api':
          await this.ingestFromAPI(options);
          break;
        default:
          throw new Error(`Unknown source: ${options.source}`);
      }
      
      console.log('Document ingestion completed successfully');
    } catch (error) {
      console.error('Error during document ingestion:', error);
      throw error;
    }
  }

  /**
   * Ingest documents from Capital IQ
   */
  private async ingestFromCapitalIQ(options: DocumentIngestionOptions): Promise<void> {
    console.log('Ingesting from Capital IQ...');
    
    // Load existing company data
    const companiesFile = path.join(this.dataProductsPath, 'vietnam_companies_capitaliq.json');
    
    if (!fs.existsSync(companiesFile)) {
      console.log('Please run the Capital IQ extraction script first');
      return;
    }

    const companies = JSON.parse(fs.readFileSync(companiesFile, 'utf-8'));
    
    // Process companies in batches
    const batchSize = options.batchSize || 10;
    for (let i = 0; i < companies.length; i += batchSize) {
      const batch = companies.slice(i, i + batchSize);
      console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(companies.length / batchSize)}`);
      
      for (const company of batch) {
        await this.fetchAndIngestCapitalIQDocuments(company, options.documentTypes);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  /**
   * Fetch and ingest documents for a specific company from Capital IQ
   */
  private async fetchAndIngestCapitalIQDocuments(
    company: any, 
    documentTypes?: string[]
  ): Promise<void> {
    try {
      const types = documentTypes || ['Annual Report', 'Company Profile', 'Financial Statement'];
      
      // Authenticate with Capital IQ
      const auth = Buffer.from(`${this.capitalIQCredentials.username}:${this.capitalIQCredentials.password}`).toString('base64');
      
      for (const docType of types) {
        console.log(`Fetching REAL ${docType} for ${company.CompanyName} from Capital IQ...`);
        
        try {
          // Fetch real document from Capital IQ API
          const response = await axios({
            method: 'GET',
            url: `https://api.capitaliq.com/v1/companies/${company.CapitalIQId}/documents`,
            params: {
              type: docType,
              companyCode: company.VietnamCompanyCode
            },
            headers: {
              'Authorization': `Basic ${auth}`,
              'Accept': 'application/json'
            }
          });
          
          if (response.data && response.data.content) {
            // Store real document in RAG
            await vietnamCompanyRAG.storeCompanyDocument({
              companyCode: company.VietnamCompanyCode,
              companyName: company.CompanyName,
              documentType: this.mapDocumentType(docType),
              content: response.data.content,
              metadata: {
                period: response.data.period || new Date().getFullYear().toString(),
                fiscal_year: response.data.fiscalYear || new Date().getFullYear().toString(),
                language: response.data.language || 'en',
                source: 'Capital IQ',
                extracted_date: new Date().toISOString(),
                file_type: response.data.fileType || 'pdf'
              }
            });
            
            console.log(`Successfully stored real ${docType} for ${company.CompanyName}`);
          } else {
            console.warn(`No ${docType} found for ${company.CompanyName} in Capital IQ`);
          }
        } catch (apiError) {
          console.error(`Failed to fetch ${docType} for ${company.CompanyName}:`, apiError);
        }
      }
    } catch (error) {
      console.error(`Error fetching documents for ${company.CompanyName}:`, error);
    }
  }

  /**
   * Ingest documents from local files
   */
  private async ingestFromFiles(options: DocumentIngestionOptions): Promise<void> {
    console.log('Ingesting from local files...');
    
    const documentsDir = path.join(this.documentsPath, 'vietnam_companies');
    
    if (!fs.existsSync(documentsDir)) {
      console.log(`Documents directory not found: ${documentsDir}`);
      return;
    }

    const files = fs.readdirSync(documentsDir);
    
    for (const file of files) {
      if (file.endsWith('.txt') || file.endsWith('.pdf')) {
        console.log(`Processing file: ${file}`);
        
        const filePath = path.join(documentsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Extract metadata from filename
        const [companyCode, documentType] = file.split('_');
        
        await vietnamCompanyRAG.storeCompanyDocument({
          companyCode,
          companyName: companyCode, // This should be enhanced to get actual name
          documentType: this.mapDocumentType(documentType),
          content,
          metadata: {
            language: 'en',
            source: 'file',
            extracted_date: new Date().toISOString(),
            file_type: path.extname(file).substring(1)
          }
        });
      }
    }
  }

  /**
   * Ingest documents from external API
   */
  private async ingestFromAPI(options: DocumentIngestionOptions): Promise<void> {
    console.log('Ingesting from REAL APIs...');
    
    // Connect to real Vietnam government APIs and data sources
    const apiEndpoints = [
      {
        url: 'https://api.vietnam.gov.vn/companies',
        headers: { 'API-Key': process.env.VIETNAM_GOV_API_KEY || '' }
      },
      {
        url: 'https://data.vietstock.vn/api/companies',
        headers: { 'Authorization': `Bearer ${process.env.VIETSTOCK_API_TOKEN || ''}` }
      }
    ];
    
    for (const endpoint of apiEndpoints) {
      try {
        console.log(`Fetching REAL data from ${endpoint.url}...`);
        
        const response = await axios({
          method: 'GET',
          url: endpoint.url,
          headers: {
            ...endpoint.headers,
            'Accept': 'application/json'
          }
        });
        
        if (response.data && response.data.companies) {
          for (const company of response.data.companies) {
            // Process real company documents
            if (company.documents && Array.isArray(company.documents)) {
              for (const doc of company.documents) {
                await vietnamCompanyRAG.storeCompanyDocument({
                  companyCode: company.companyCode,
                  companyName: company.companyName,
                  documentType: this.mapDocumentType(doc.type),
                  content: doc.content,
                  metadata: {
                    fiscal_year: doc.year || new Date().getFullYear().toString(),
                    language: doc.language || 'en',
                    source: endpoint.url,
                    extracted_date: new Date().toISOString(),
                    file_type: doc.fileType || 'pdf'
                  }
                });
              }
            }
          }
          console.log(`Successfully ingested ${response.data.companies.length} companies from ${endpoint.url}`);
        } else {
          console.warn(`No company data found from ${endpoint.url}`);
        }
      } catch (error) {
        console.error(`Error fetching from ${endpoint.url}:`, error);
        // Continue with next endpoint instead of failing completely
      }
    }
  }


  /**
   * Map document types
   */
  private mapDocumentType(type: string): 'profile' | 'financial' | 'annual_report' | 'quarterly_report' | 'tariff_analysis' {
    const typeMap: Record<string, any> = {
      'Annual Report': 'annual_report',
      'Quarterly Report': 'quarterly_report',
      'Company Profile': 'profile',
      'Financial Statement': 'financial',
      'Tariff Analysis': 'tariff_analysis'
    };
    
    return typeMap[type] || 'profile';
  }

  /**
   * Initialize RAG with company data
   */
  async initializeRAG(): Promise<void> {
    console.log('Initializing RAG with Vietnam company data...');
    
    // First, ingest basic company data
    await vietnamCompanyRAG.ingestCompanyData();
    
    // Then, ingest documents from various sources
    await this.ingestDocuments({
      source: 'capitaliq',
      batchSize: 10,
      documentTypes: ['Company Profile', 'Financial Statement']
    });
    
    console.log('RAG initialization completed');
  }
}

// Main execution
async function main() {
  const ingestion = new VietnamDocumentIngestion();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const source = args[0] || 'capitaliq';
  const batchSize = parseInt(args[1]) || 10;
  
  try {
    if (args.includes('--init')) {
      // Initialize RAG with all data
      await ingestion.initializeRAG();
    } else {
      // Run specific ingestion
      await ingestion.ingestDocuments({
        source: source as any,
        batchSize,
        documentTypes: ['Annual Report', 'Company Profile', 'Financial Statement']
      });
    }
  } catch (error) {
    console.error('Ingestion failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { VietnamDocumentIngestion };