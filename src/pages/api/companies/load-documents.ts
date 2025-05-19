/**
 * Document Loading API Endpoint
 * Fetches documents from S&P Capital IQ and loads them into RAG
 */

import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { vietnamCompanyRAG } from '../../../services/VietnamCompanyRAG';

interface LoadDocumentsRequest {
  companyId: string;
  companyCode: string;
  documentTypes: string[];
}

interface DocumentProgress {
  loaded: number;
  total: number;
  message: string;
  currentDocument?: string;
}

const credentials = {
  username: process.env.CAPITAL_IQ_USERNAME || 'craig.turrell@sc.com',
  password: process.env.CAPITAL_IQ_PASSWORD || 'Victoria0405%',
  apiEndpoint: process.env.CAPITAL_IQ_API_ENDPOINT || 'https://api-ciq.marketintelligence.spglobal.com'
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { companyId, companyCode, documentTypes }: LoadDocumentsRequest = req.body;

  if (!companyId || !companyCode) {
    return res.status(400).json({ error: 'Company ID and code are required' });
  }

  // Set up streaming response
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  try {
    // Authenticate with Capital IQ
    const authToken = await authenticateCapitalIQ();
    
    let loaded = 0;
    const total = documentTypes.length;
    
    // Send initial progress
    sendProgress(res, { loaded, total, message: 'Starting document fetch...' });

    // Fetch each document type
    for (const docType of documentTypes) {
      try {
        sendProgress(res, { 
          loaded, 
          total, 
          message: `Fetching ${docType} from Capital IQ...`,
          currentDocument: docType
        });

        const document = await fetchDocument(authToken, companyId, docType);
        
        if (document) {
          sendProgress(res, { 
            loaded, 
            total, 
            message: `Loading ${docType} into RAG system...`,
            currentDocument: docType
          });

          await loadDocumentToRAG(companyCode, document, docType);
          
          loaded++;
          sendProgress(res, { 
            loaded, 
            total, 
            message: `Successfully loaded ${docType}`,
            currentDocument: docType
          });
        }
      } catch (error) {
        console.error(`Error loading ${docType}:`, error);
        sendProgress(res, { 
          loaded, 
          total, 
          message: `Failed to load ${docType}`,
          currentDocument: docType
        });
      }
    }

    // Final success message
    sendProgress(res, { 
      loaded: total, 
      total, 
      message: 'All documents loaded successfully'
    });

    res.end();

  } catch (error) {
    console.error('Document loading error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Document loading failed' })}\n\n`);
    res.end();
  }
}

async function authenticateCapitalIQ(): Promise<string> {
  try {
    const response = await axios.post(
      `${credentials.apiEndpoint}/v1/auth/login`,
      {
        username: credentials.username,
        password: credentials.password
      }
    );
    
    return response.data.token;
  } catch (error) {
    console.error('Capital IQ authentication failed:', error);
    throw new Error('Authentication failed');
  }
}

async function fetchDocument(token: string, companyId: string, docType: string): Promise<any> {
  try {
    const endpoint = getDocumentEndpoint(docType);
    
    const response = await axios.get(
      `${credentials.apiEndpoint}${endpoint}`,
      {
        params: { companyId },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error(`Error fetching ${docType}:`, error);
    
    // Return mock data for development
    if (process.env.NODE_ENV === 'development') {
      return getMockDocument(companyId, docType);
    }
    
    throw error;
  }
}

async function loadDocumentToRAG(companyCode: string, document: any, docType: string) {
  try {
    // Transform document based on type
    const transformedDoc = transformDocument(document, docType);
    
    // Load into RAG system
    await vietnamCompanyRAG.storeCompanyDocument({
      companyCode,
      companyName: document.companyName || companyCode,
      documentType: mapDocumentType(docType),
      content: transformedDoc.content,
      metadata: {
        period: transformedDoc.period,
        fiscal_year: transformedDoc.fiscalYear,
        language: 'en',
        source: 'S&P Capital IQ',
        extracted_date: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error loading to RAG:', error);
    throw error;
  }
}

function getDocumentEndpoint(docType: string): string {
  const endpoints: Record<string, string> = {
    'profile': '/v1/companies/profile',
    'financials': '/v1/companies/financials',
    'filings': '/v1/documents/filings',
    'tariff': '/v1/companies/trade-data'
  };
  
  return endpoints[docType] || '/v1/companies/profile';
}

function mapDocumentType(docType: string): 'profile' | 'financial' | 'annual_report' | 'quarterly_report' | 'tariff_analysis' {
  const mapping: Record<string, any> = {
    'profile': 'profile',
    'financials': 'financial',
    'filings': 'annual_report',
    'tariff': 'tariff_analysis'
  };
  
  return mapping[docType] || 'profile';
}

function transformDocument(document: any, docType: string): any {
  const content = [];
  
  switch (docType) {
    case 'profile':
      content.push(`# ${document.companyName} Company Profile`);
      content.push(`\nCompany ID: ${document.companyId}`);
      content.push(`Industry: ${document.industry}`);
      content.push(`Country: ${document.country}`);
      content.push(`\n## Description`);
      content.push(document.description || 'No description available');
      content.push(`\n## Key Facts`);
      content.push(`- Founded: ${document.foundedDate || 'N/A'}`);
      content.push(`- Employees: ${document.employeeCount || 'N/A'}`);
      content.push(`- Headquarters: ${document.headquarters || 'N/A'}`);
      break;
      
    case 'financials':
      content.push(`# ${document.companyName} Financial Summary`);
      content.push(`\nPeriod: ${document.period || 'Latest'}`);
      content.push(`\n## Revenue`);
      content.push(`- Total Revenue: ${document.revenue || 'N/A'}`);
      content.push(`- Revenue Growth: ${document.revenueGrowth || 'N/A'}`);
      content.push(`\n## Profitability`);
      content.push(`- Net Income: ${document.netIncome || 'N/A'}`);
      content.push(`- EBITDA: ${document.ebitda || 'N/A'}`);
      break;
      
    case 'filings':
      content.push(`# ${document.companyName} - ${document.documentType}`);
      content.push(`\nFiling Date: ${document.filingDate}`);
      content.push(`Period: ${document.period}`);
      content.push(`\n${document.content || 'Content not available'}`);
      break;
      
    case 'tariff':
      content.push(`# ${document.companyName} Trade & Tariff Data`);
      content.push(`\n## Export/Import Summary`);
      content.push(`- Total Exports: ${document.totalExports || 'N/A'}`);
      content.push(`- Total Imports: ${document.totalImports || 'N/A'}`);
      content.push(`\n## Key Trading Partners`);
      if (document.tradingPartners) {
        document.tradingPartners.forEach((partner: any) => {
          content.push(`- ${partner.country}: ${partner.tradeVolume}`);
        });
      }
      break;
  }
  
  return {
    content: content.join('\n'),
    period: document.period,
    fiscalYear: document.fiscalYear || new Date().getFullYear().toString()
  };
}

function sendProgress(res: NextApiResponse, progress: DocumentProgress) {
  res.write(`${JSON.stringify(progress)}\n`);
}

function getMockDocument(companyId: string, docType: string): any {
  // Mock documents for development
  const mockDocs: Record<string, any> = {
    'profile': {
      companyId,
      companyName: 'Sample Company',
      industry: 'Technology',
      country: 'Vietnam',
      description: 'A leading technology company in Vietnam',
      foundedDate: '2000-01-01',
      employeeCount: 5000,
      headquarters: 'Ho Chi Minh City'
    },
    'financials': {
      companyId,
      companyName: 'Sample Company',
      period: '2023',
      revenue: '$100M',
      revenueGrowth: '15%',
      netIncome: '$20M',
      ebitda: '$30M'
    },
    'filings': {
      companyId,
      companyName: 'Sample Company',
      documentType: 'Annual Report',
      filingDate: '2024-03-31',
      period: '2023',
      content: 'Annual report content...'
    },
    'tariff': {
      companyId,
      companyName: 'Sample Company',
      totalExports: '$50M',
      totalImports: '$30M',
      tradingPartners: [
        { country: 'USA', tradeVolume: '$20M' },
        { country: 'China', tradeVolume: '$15M' }
      ]
    }
  };
  
  return mockDocs[docType] || mockDocs['profile'];
}