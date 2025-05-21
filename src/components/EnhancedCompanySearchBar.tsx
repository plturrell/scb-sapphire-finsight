/**
 * Enhanced Company Search Bar with SCB beautiful styling 
 * Real-time search with autocomplete, predictive text, and document fetching
 * Connected to Apache Jena backend through API service
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, 
  Building2, 
  TrendingUp, 
  Download,
  Loader,
  CheckCircle,
  X,
  AlertCircle,
  Info
} from 'lucide-react';
import { useRouter } from 'next/router';
import { InlineSpinner } from './LoadingSpinner';
import ApiService from '@/services/ApiService';

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
  id: string;
  name: string;
  ticker?: string;
  industry?: string;
  sector?: string;
  relevance?: number;
  dataAvailable?: {
    profile: boolean;
    financials: boolean;
    filings: boolean;
    tariffData: boolean;
  };
}

interface EnhancedCompanySearchBarProps {
  placeholder?: string;
  defaultCountry?: string;
  onCompanySelect?: (company: CompanySearchResult) => void;
  className?: string;
  autoNavigate?: boolean;
}

const EnhancedCompanySearchBar: React.FC<EnhancedCompanySearchBarProps> = ({
  placeholder = "Search companies by name, ticker, or industry...",
  defaultCountry = 'Vietnam',
  onCompanySelect,
  className = '',
  autoNavigate = true
}) => {
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CompanySearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchStatus, setSearchStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error', message?: string }>({ type: 'idle' });

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

  // Search function using our API service
  const performSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSearchResults([]);
        setSearchStatus({ type: 'idle' });
        return;
      }

      setIsLoading(true);
      setSearchStatus({ type: 'loading', message: 'Searching companies...' });
      
      try {
        // Call our API service
        const response = await ApiService.company.searchCompanies(query, {
          limit: 10,
        });
        
        if (response.success && response.results) {
          // Map results to our interface if needed
          const results = response.results.map((company: any) => {
            return {
              id: company.id,
              name: company.name,
              ticker: company.ticker,
              industry: company.industry,
              sector: company.sector,
              relevance: company.relevance || 1.0,
              // Generate a default data availability if not provided
              dataAvailable: company.dataAvailable || {
                profile: true,
                financials: !!company.ticker, // Assume financial data available for companies with tickers
                filings: !!company.ticker,
                tariffData: false,
              },
            };
          });
          
          setSearchResults(results);
          setSearchStatus({ 
            type: 'success', 
            message: `Found ${results.length} companies` 
          });
        } else {
          throw new Error('Invalid search response format');
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
        setSearchStatus({ 
          type: 'error', 
          message: 'Search failed. Please try again.' 
        });
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [setSearchResults, setSearchStatus, setIsLoading]
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowResults(true);
    performSearch(query);
  };

  // Clear search input
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    inputRef.current?.focus();
  };

  // Select company from results
  const selectCompany = (company: CompanySearchResult) => {
    setSearchQuery(company.name);
    setShowResults(false);
    
    // Add to recent searches
    const newRecent = [company.name, ...recentSearches.filter(s => s !== company.name)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('recentCompanySearches', JSON.stringify(newRecent));

    // If provided, call the onCompanySelect callback
    if (onCompanySelect) {
      onCompanySelect(company);
    }
    
    // Navigate to company page if autoNavigate is true
    if (autoNavigate) {
      router.push(`/reports/company/${encodeURIComponent(company.id)}`);
    }
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
      ? <CheckCircle className="w-3 h-3 text-[rgb(var(--scb-american-green))]" />
      : <div className="w-3 h-3 rounded-full bg-[rgba(var(--scb-light-gray),0.5)]" />;
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (searchStatus.type) {
      case 'loading': return <InlineSpinner size="xs" className="text-[rgb(var(--scb-honolulu-blue))]" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-[rgb(var(--scb-american-green))]" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-[rgb(var(--scb-muted-red))]" />;
      default: return null;
    }
  };

  return (
    <div ref={searchRef} className={`relative w-full ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[rgb(var(--scb-dark-gray))] w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowResults(true)}
          placeholder={placeholder}
          className="fiori-input w-full py-2.5 pl-10 pr-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--scb-honolulu-blue))] focus:border-[rgb(var(--scb-honolulu-blue))] transition-all"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-10 top-1/2 transform -translate-y-1/2 text-[rgb(var(--scb-dark-gray))] hover:text-[rgb(var(--scb-muted-red))] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {isLoading && (
          <InlineSpinner 
            size="sm" 
            className="absolute right-3 top-1/2 transform -translate-y-1/2" 
          />
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (searchResults.length > 0 || (searchQuery.length === 0 && recentSearches.length > 0)) && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg overflow-hidden z-50 border border-[rgb(var(--scb-border))]">
          {/* Status Bar */}
          {searchStatus.type !== 'idle' && searchQuery.length > 0 && (
            <div className={`px-4 py-2 flex items-center gap-2 text-xs ${
              searchStatus.type === 'error' ? 'bg-[rgba(var(--scb-muted-red),0.1)] text-[rgb(var(--scb-muted-red))]' : 
              searchStatus.type === 'success' ? 'bg-[rgba(var(--scb-american-green),0.1)] text-[rgb(var(--scb-american-green))]' : 
              'bg-[rgba(var(--scb-honolulu-blue),0.1)] text-[rgb(var(--scb-honolulu-blue))]'
            }`}>
              {getStatusIcon()}
              <span>{searchStatus.message}</span>
            </div>
          )}
          
          {/* Recent Searches */}
          {searchQuery.length === 0 && recentSearches.length > 0 && (
            <>
              <div className="px-4 py-2 bg-[rgba(var(--scb-light-gray),0.3)] border-b border-[rgb(var(--scb-border))]">
                <h4 className="text-xs font-medium text-[rgb(var(--scb-dark-gray))] uppercase">Recent Searches</h4>
              </div>
              {recentSearches.map((recent, idx) => (
                <div
                  key={idx}
                  className="px-4 py-3 hover:bg-[rgba(var(--scb-light-gray),0.3)] cursor-pointer flex items-center"
                  onClick={() => {
                    setSearchQuery(recent);
                    performSearch(recent);
                  }}
                >
                  <TrendingUp className="w-4 h-4 text-[rgb(var(--scb-dark-gray))] mr-3" />
                  <span className="text-sm text-[rgb(var(--scb-dark-gray))]">{recent}</span>
                </div>
              ))}
            </>
          )}

          {/* Search Results */}
          {searchQuery.length > 0 && searchResults.length > 0 && (
            <>
              <div className="px-4 py-2 bg-[rgba(var(--scb-light-gray),0.3)] border-b border-[rgb(var(--scb-border))]">
                <h4 className="text-xs font-medium text-[rgb(var(--scb-dark-gray))] uppercase">
                  Search Results ({searchResults.length})
                </h4>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {searchResults.map((company, idx) => (
                  <div
                    key={company.companyId}
                    className={`px-4 py-3 hover:bg-[rgba(var(--scb-light-gray),0.3)] cursor-pointer ${
                      selectedIndex === idx ? 'bg-[rgba(var(--scb-light-gray),0.3)]' : ''
                    }`}
                    onClick={() => selectCompany(company)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <Building2 className="w-4 h-4 text-[rgb(var(--scb-dark-gray))] mr-2" />
                          <span className="font-medium text-[rgb(var(--scb-dark-gray))]">{company.name}</span>
                          {company.ticker && (
                            <span className="ml-2 text-xs horizon-chip">
                              {company.ticker}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center mt-2 ml-6">
                          <span className="text-xs text-[rgb(var(--scb-dark-gray))]">
                            {company.industry || 'Unknown'} {company.sector ? `• ${company.sector}` : ''}
                          </span>
                          {company.ticker && (
                            <span className="ml-2 text-xs horizon-chip-blue">
                              Listed
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 ml-4">
                        <div className="flex items-center space-x-1">
                          <div className="relative group">
                            {getDataIcon(company.dataAvailable.profile)}
                            <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-[rgb(var(--scb-dark-gray))] text-white text-[10px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              Profile
                            </span>
                          </div>
                          <div className="relative group">
                            {getDataIcon(company.dataAvailable.financials)}
                            <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-[rgb(var(--scb-dark-gray))] text-white text-[10px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              Financials
                            </span>
                          </div>
                          <div className="relative group">
                            {getDataIcon(company.dataAvailable.filings)}
                            <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-[rgb(var(--scb-dark-gray))] text-white text-[10px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              Filings
                            </span>
                          </div>
                          <div className="relative group">
                            {getDataIcon(company.dataAvailable.tariffData)}
                            <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-[rgb(var(--scb-dark-gray))] text-white text-[10px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              Tariff
                            </span>
                          </div>
                        </div>
                        
                        <Download className="w-4 h-4 text-[rgb(var(--scb-dark-gray))]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedCompanySearchBar;