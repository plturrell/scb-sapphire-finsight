/**
 * Company Search API Endpoint
 * Real-time search through S&P Capital IQ
 */

import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

interface CapitalIQCredentials {
  username: string;
  password: string;
  apiEndpoint: string;
}

interface SearchRequest {
  query: string;
  country?: string;
  limit?: number;
  includeGlobal?: boolean;
}

const credentials: CapitalIQCredentials = {
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

  const { query, country = 'Vietnam', limit = 10, includeGlobal = false }: SearchRequest = req.body;

  if (!query || query.length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters' });
  }

  try {
    // Authenticate with Capital IQ
    const authToken = await authenticateCapitalIQ();
    
    // Perform company search
    const searchResponse = await axios.post(
      `${credentials.apiEndpoint}/v1/companies/search`,
      {
        searchText: query,
        filters: {
          countries: country === 'Vietnam' && !includeGlobal ? ['VN'] : undefined,
          status: ['Active'],
          includePrivate: true,
          includePublic: true
        },
        limit,
        includeMetadata: true
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Transform Capital IQ data to our format
    const companies = searchResponse.data.companies.map((company: any) => ({
      companyId: company.companyId,
      companyCode: company.companyCode || generateCompanyCode(company),
      companyName: company.companyName,
      companyNameLocal: company.localName || company.nativeName,
      ticker: company.tickerSymbol,
      industry: company.industry || company.gicsIndustry || 'Unknown',
      country: company.country || 'Vietnam',
      listingStatus: company.publicStatus ? 'Listed' : 'Private',
      matchScore: company.relevanceScore || 1.0,
      dataAvailable: {
        profile: true, // Capital IQ always has basic profiles
        financials: company.hasFinancials || false,
        filings: company.hasFilings || false,
        tariffData: country === 'Vietnam' // Vietnam companies likely have tariff data
      }
    }));

    // Sort by relevance score
    companies.sort((a: any, b: any) => b.matchScore - a.matchScore);

    res.status(200).json({ companies });

  } catch (error) {
    console.error('Capital IQ search error:', error);
    
    // Fallback to mock data for development
    if (process.env.NODE_ENV === 'development') {
      const mockResults = getMockSearchResults(query, country);
      return res.status(200).json({ companies: mockResults });
    }
    
    res.status(500).json({ error: 'Search failed' });
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

function generateCompanyCode(company: any): string {
  // Generate a unique code for companies without one
  const countryCode = company.country === 'Vietnam' ? 'VCG' : 'GCG';
  const idPart = company.companyId.slice(-4);
  return `${countryCode}-${idPart}`;
}

function getMockSearchResults(query: string, country: string): any[] {
  // Mock data for development
  const mockCompanies = [
    {
      companyId: 'ciq-001',
      companyCode: 'VCG-0001',
      companyName: 'Vietnam Dairy Products Joint Stock Company',
      companyNameLocal: 'Công ty Cổ phần Sữa Việt Nam',
      ticker: 'VNM',
      industry: 'Food Products',
      country: 'Vietnam',
      listingStatus: 'Listed',
      matchScore: 0.95,
      dataAvailable: {
        profile: true,
        financials: true,
        filings: true,
        tariffData: true
      }
    },
    {
      companyId: 'ciq-002',
      companyCode: 'VCG-0002',
      companyName: 'FPT Corporation',
      companyNameLocal: 'Công ty Cổ phần FPT',
      ticker: 'FPT',
      industry: 'Information Technology',
      country: 'Vietnam',
      listingStatus: 'Listed',
      matchScore: 0.90,
      dataAvailable: {
        profile: true,
        financials: true,
        filings: true,
        tariffData: true
      }
    },
    {
      companyId: 'ciq-003',
      companyCode: 'VCG-0003',
      companyName: 'Viettel Group',
      companyNameLocal: 'Tập đoàn Viễn thông Quân đội',
      ticker: null,
      industry: 'Telecommunications',
      country: 'Vietnam',
      listingStatus: 'Private',
      matchScore: 0.88,
      dataAvailable: {
        profile: true,
        financials: false,
        filings: false,
        tariffData: true
      }
    },
    {
      companyId: 'ciq-004',
      companyCode: 'VCG-0004',
      companyName: 'Masan Group Corporation',
      companyNameLocal: 'Công ty Cổ phần Tập đoàn Masan',
      ticker: 'MSN',
      industry: 'Consumer Goods',
      country: 'Vietnam',
      listingStatus: 'Listed',
      matchScore: 0.85,
      dataAvailable: {
        profile: true,
        financials: true,
        filings: true,
        tariffData: true
      }
    },
    {
      companyId: 'ciq-005',
      companyCode: 'VCG-0005',
      companyName: 'Vietnam Airlines JSC',
      companyNameLocal: 'Tổng Công ty Hàng không Việt Nam',
      ticker: 'HVN',
      industry: 'Airlines',
      country: 'Vietnam',
      listingStatus: 'Listed',
      matchScore: 0.82,
      dataAvailable: {
        profile: true,
        financials: true,
        filings: true,
        tariffData: true
      }
    }
  ];

  // Filter based on query
  const filtered = mockCompanies.filter(company => 
    company.companyName.toLowerCase().includes(query.toLowerCase()) ||
    company.companyNameLocal?.toLowerCase().includes(query.toLowerCase()) ||
    company.ticker?.toLowerCase().includes(query.toLowerCase()) ||
    company.industry.toLowerCase().includes(query.toLowerCase())
  );

  return filtered.slice(0, 10);
}