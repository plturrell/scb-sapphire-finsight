/**
 * Company Search Bar with S&P Capital IQ Integration
 * Real-time search with autocomplete, predictive text, and document fetching
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, 
  Building2, 
  FileText, 
  TrendingUp, 
  Download,
  Loader,
  CheckCircle
} from 'lucide-react';
import { useRouter } from 'next/router';

// Simple debounce implementation
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  }) as T;
}

interface CompanySearchResult {
  companyId: string;
  companyCode: string;
  companyName: string;
  companyNameLocal?: string;
  ticker?: string;
  industry: string;
  country: string;
  listingStatus: string;
  matchScore: number;
  dataAvailable: {
    profile: boolean;
    financials: boolean;
    filings: boolean;
    tariffData: boolean;
  };
}

interface DocumentLoadStatus {
  companyId: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  documentsLoaded: number;
  totalDocuments: number;
  message?: string;
}

const CompanySearchBar: React.FC = () => {
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CompanySearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [documentStatus, setDocumentStatus] = useState<DocumentLoadStatus[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentCompanySearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search function
  const performSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsLoading(true);
      
      try {
        const response = await fetch('/api/companies/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query,
            country: 'Vietnam',
            limit: 10,
            includeGlobal: true
          })
        });

        if (!response.ok) throw new Error('Search failed');
        
        const results = await response.json();
        setSearchResults(results.companies);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowResults(true);
    performSearch(query);
  };

  // Load company documents into RAG
  const loadCompanyDocuments = async (company: CompanySearchResult) => {
    const statusId = `${company.companyId}-${Date.now()}`;
    
    // Initialize loading status
    setDocumentStatus(prev => [...prev, {
      companyId: statusId,
      status: 'loading',
      documentsLoaded: 0,
      totalDocuments: 4,
      message: 'Fetching documents from S&P Capital IQ...'
    }]);

    try {
      // Fetch and load documents from Capital IQ
      const response = await fetch('/api/companies/load-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.companyId,
          companyCode: company.companyCode,
          documentTypes: ['profile', 'financials', 'filings', 'tariff']
        })
      });

      if (!response.ok) throw new Error('Document loading failed');

      // Stream progress updates
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const updates = chunk.split('\n').filter(Boolean);

          for (const update of updates) {
            try {
              const progress = JSON.parse(update);
              setDocumentStatus(prev => prev.map(status => 
                status.companyId === statusId
                  ? {
                      ...status,
                      documentsLoaded: progress.loaded,
                      totalDocuments: progress.total,
                      message: progress.message
                    }
                  : status
              ));
            } catch (e) {
              // Skip invalid JSON chunks
            }
          }
        }
      }

      // Update to success status
      setDocumentStatus(prev => prev.map(status => 
        status.companyId === statusId
          ? { ...status, status: 'success', message: 'All documents loaded successfully' }
          : status
      ));

      // Add to recent searches
      const newRecent = [company.companyName, ...recentSearches.filter(s => s !== company.companyName)].slice(0, 5);
      setRecentSearches(newRecent);
      localStorage.setItem('recentCompanySearches', JSON.stringify(newRecent));

      // Navigate to company report after loading
      setTimeout(() => {
        router.push(`/reports/company/${company.companyCode}`);
      }, 1000);

    } catch (error) {
      console.error('Document loading error:', error);
      setDocumentStatus(prev => prev.map(status => 
        status.companyId === statusId
          ? { ...status, status: 'error', message: 'Failed to load documents' }
          : status
      ));
    }
  };

  // Select company from results
  const selectCompany = (company: CompanySearchResult) => {
    setSearchQuery(company.companyName);
    setShowResults(false);
    loadCompanyDocuments(company);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          selectCompany(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        break;
    }
  };

  // Get data availability icon
  const getDataIcon = (available: boolean) => {
    return available 
      ? <CheckCircle className="w-3 h-3 text-green-500" />
      : <div className="w-3 h-3 rounded-full bg-gray-300" />;
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowResults(true)}
          placeholder="Search companies by name, ticker, or industry..."
          className="w-full bg-white border border-gray-300 text-gray-900 py-2.5 px-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--scb-blue))] focus:border-transparent transition-all"
        />
        {isLoading && (
          <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 animate-spin" />
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (searchResults.length > 0 || (searchQuery.length === 0 && recentSearches.length > 0)) && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg overflow-hidden z-50 border border-gray-200">
          {/* Recent Searches */}
          {searchQuery.length === 0 && recentSearches.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-b">
              <h4 className="text-xs font-medium text-gray-600 uppercase">Recent Searches</h4>
            </div>
          )}
          
          {searchQuery.length === 0 && recentSearches.map((recent, idx) => (
            <div
              key={idx}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center"
              onClick={() => {
                setSearchQuery(recent);
                performSearch(recent);
              }}
            >
              <TrendingUp className="w-4 h-4 text-gray-400 mr-3" />
              <span className="text-sm text-gray-700">{recent}</span>
            </div>
          ))}

          {/* Search Results */}
          {searchQuery.length > 0 && searchResults.length > 0 && (
            <>
              <div className="px-4 py-2 bg-gray-50 border-b">
                <h4 className="text-xs font-medium text-gray-600 uppercase">
                  Search Results ({searchResults.length})
                </h4>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {searchResults.map((company, idx) => (
                  <div
                    key={company.companyId}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                      selectedIndex === idx ? 'bg-gray-50' : ''
                    }`}
                    onClick={() => selectCompany(company)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="font-medium text-gray-900">{company.companyName}</span>
                          {company.ticker && (
                            <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              {company.ticker}
                            </span>
                          )}
                        </div>
                        
                        {company.companyNameLocal && (
                          <p className="text-xs text-gray-500 ml-6 mt-0.5">
                            {company.companyNameLocal}
                          </p>
                        )}
                        
                        <div className="flex items-center mt-2 ml-6">
                          <span className="text-xs text-gray-500">
                            {company.industry} • {company.country}
                          </span>
                          {company.listingStatus === 'Listed' && (
                            <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              Listed
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 ml-4">
                        <div className="flex items-center space-x-1">
                          <div className="tooltip" title="Company Profile">
                            {getDataIcon(company.dataAvailable.profile)}
                          </div>
                          <div className="tooltip" title="Financial Data">
                            {getDataIcon(company.dataAvailable.financials)}
                          </div>
                          <div className="tooltip" title="Regulatory Filings">
                            {getDataIcon(company.dataAvailable.filings)}
                          </div>
                          <div className="tooltip" title="Tariff Data">
                            {getDataIcon(company.dataAvailable.tariffData)}
                          </div>
                        </div>
                        
                        <Download className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Document Loading Status */}
      {documentStatus.length > 0 && (
        <div className="fixed bottom-4 right-4 w-96 space-y-2 z-50">
          {documentStatus.map(status => (
            <div
              key={status.companyId}
              className={`bg-white rounded-lg shadow-lg border p-4 transition-all ${
                status.status === 'error' ? 'border-red-500' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  {status.status === 'loading' && (
                    <Loader className="w-4 h-4 text-blue-500 animate-spin mr-2" />
                  )}
                  {status.status === 'success' && (
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  )}
                  {status.status === 'error' && (
                    <div className="w-4 h-4 rounded-full bg-red-500 mr-2" />
                  )}
                  <span className="font-medium text-sm">Document Loading</span>
                </div>
                
                {status.status === 'loading' && (
                  <span className="text-xs text-gray-500">
                    {status.documentsLoaded}/{status.totalDocuments}
                  </span>
                )}
              </div>
              
              <p className={`text-xs ${
                status.status === 'error' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {status.message}
              </p>
              
              {status.status === 'loading' && (
                <div className="mt-2 bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                    style={{
                      width: `${(status.documentsLoaded / status.totalDocuments) * 100}%`
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanySearchBar;