/**
 * TypeScript interfaces for Perplexity API integration
 */

// Core API request and response types
export interface PerplexityRequest {
  model: string;
  messages: PerplexityMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PerplexityResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  choices: PerplexityChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface PerplexityChoice {
  index: number;
  finish_reason: string;
  message: {
    role: string;
    content: string;
  };
  delta?: {
    role?: string;
    content?: string;
  };
}

// Search result types
export interface SearchResult {
  query: string;
  summary: string;
  companies: CompanyMention[];
  insights: string[];
  sources: SourceReference[];
  timestamp: string;
}

export interface CompanyMention {
  name: string;
  context: string;
  confidence: number;
}

export interface SourceReference {
  title: string;
  url: string;
  date: string;
}

// Company search results
export interface CompanySearchResult {
  companyId: string;
  companyCode: string;
  companyName: string;
  ticker?: string;
  industry: string;
  country: string;
  listingStatus: 'Listed' | 'Private' | 'Unknown';
  matchScore: number;
  dataAvailable: {
    profile: boolean;
    financials: boolean;
    filings: boolean;
    tariffData: boolean;
  };
  description: string;
}

// Financial insights
export interface FinancialInsights {
  summary: string;
  insights: string[];
  timestamp: string;
}

// News types
export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  timestamp: string;
  source: string;
  url?: string;
}

export interface NewsResponse {
  success: boolean;
  articles: NewsItem[];
  timestamp: string;
  source: string;
  params: {
    topic: string;
    limit: number;
  };
}

// Tariff data types
export interface TariffDataResponse {
  query: string;
  summary: string;
  tariffs: TariffEntry[];
  relatedPolicies: PolicyReference[];
  sources: SourceReference[];
  timestamp: string;
}

export interface TariffEntry {
  hsCode: string;
  description: string;
  sourceCountry: string;
  destinationCountry: string;
  rate: number;
  currency: string;
  effectiveDate: string;
  expirationDate?: string;
  exemptions?: string[];
  specialConditions?: string[];
  confidence: number;
}

export interface PolicyReference {
  name: string;
  description: string;
  countries: string[];
  implementationDate: string;
  url?: string;
  relevance: number;
}

// UI component props
export interface SearchBarProps {
  onSearch?: (query: string, results: SearchResult) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export interface NewsBarProps {
  onAnalyzeNews?: (newsItem: NewsItem) => void;
  maxItems?: number;
  category?: string;
  className?: string;
}

// Search options
export interface SearchOptions {
  useCache?: boolean;
  forceFresh?: boolean;
  timeout?: number;
}