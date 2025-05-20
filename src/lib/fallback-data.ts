/**
 * Fallback data to use when API calls fail
 * This ensures the UI doesn't break completely when we have API issues
 */

// Mock market news fallback
export const fallbackMarketNews = [
  {
    id: 'news-fallback-1',
    title: 'Markets React to Economic Data',
    summary: 'Financial markets responded positively to better-than-expected economic indicators, with major indices gaining ground.',
    category: 'Markets',
    timestamp: new Date().toISOString(),
    source: 'Financial News',
    url: '#'
  },
  {
    id: 'news-fallback-2',
    title: 'Central Bank Maintains Interest Rates',
    summary: 'The central bank held interest rates steady at its recent meeting, signaling confidence in the current economic trajectory.',
    category: 'Economy',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    source: 'Economic Reports',
    url: '#'
  },
  {
    id: 'news-fallback-3',
    title: 'Technology Sector Leads Market Gains',
    summary: 'Tech stocks outperformed the broader market as investors responded to positive earnings reports from major companies.',
    category: 'Technology',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    source: 'Market Analysis',
    url: '#'
  }
];

// Mock company search results fallback
export const fallbackCompanySearch = [
  {
    companyId: 'company-fallback-1',
    companyCode: 'AAPL',
    companyName: 'Apple Inc.',
    ticker: 'AAPL',
    industry: 'Technology',
    country: 'United States',
    listingStatus: 'Listed',
    matchScore: 0.95,
    dataAvailable: {
      profile: true,
      financials: true,
      filings: true,
      tariffData: false
    },
    description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.'
  },
  {
    companyId: 'company-fallback-2',
    companyCode: 'MSFT',
    companyName: 'Microsoft Corporation',
    ticker: 'MSFT',
    industry: 'Technology',
    country: 'United States',
    listingStatus: 'Listed',
    matchScore: 0.93,
    dataAvailable: {
      profile: true,
      financials: true,
      filings: true,
      tariffData: false
    },
    description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.'
  }
];

// Mock financial insights fallback
export const fallbackFinancialInsights = {
  summary: 'Markets are currently experiencing moderate volatility with mixed sector performance. Economic indicators suggest continued but slowing growth.',
  insights: [
    'Inflation concerns remain a key factor influencing market sentiment',
    'Supply chain disruptions continue to impact certain industries',
    'Central bank policies are closely monitored for signals of monetary tightening',
    'Technology sector performance diverges from traditional industries',
    'Global trade dynamics are shifting due to policy changes'
  ],
  timestamp: new Date().toISOString()
};

// Mock tariff data fallback
export const fallbackTariffData = {
  summary: 'Current tariff rates reflect recent trade agreements and policy updates across major trading regions.',
  tariffs: [
    {
      hsCode: '8471.30.00',
      description: 'Portable digital automatic data processing machines, weighing not more than 10 kg',
      sourceCountry: 'China',
      destinationCountry: 'United States',
      rate: 25.0,
      currency: 'percentage',
      effectiveDate: '2023-01-01',
      confidence: 0.95
    },
    {
      hsCode: '8517.12.00',
      description: 'Telephones for cellular networks or for other wireless networks',
      sourceCountry: 'Vietnam',
      destinationCountry: 'European Union',
      rate: 2.5,
      currency: 'percentage',
      effectiveDate: '2023-01-01',
      confidence: 0.92
    }
  ],
  relatedPolicies: [
    {
      name: 'CPTPP',
      description: 'Comprehensive and Progressive Agreement for Trans-Pacific Partnership',
      countries: ['Australia', 'Canada', 'Japan', 'Mexico', 'New Zealand', 'Singapore', 'Vietnam'],
      implementationDate: '2018-12-30',
      relevance: 0.9
    }
  ],
  sources: [
    {
      title: 'Trade Policy Database',
      url: '#',
      date: '2023-01-15',
      reliability: 0.95
    }
  ],
  timestamp: new Date().toISOString()
};