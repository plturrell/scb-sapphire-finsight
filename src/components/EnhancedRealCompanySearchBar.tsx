/**
 * Enhanced Real Company Search Bar with SCB beautiful styling
 * Uses actual S&P Capital IQ data with autocomplete, recommendations, and SCB design system
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Search, 
  Building2, 
  MapPin, 
  DollarSign, 
  Package, 
  FileText, 
  Loader, 
  CheckCircle, 
  X, 
  AlertCircle, 
  TrendingUp, 
  Calendar, 
  BarChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { InlineSpinner } from './LoadingSpinner';
import useNetworkAwareLoading from '../hooks/useNetworkAwareLoading';

interface CompanySearchResult {
  companyCode: string;
  companyName: string;
  capitalIQId: string;
  industry: string;
  province: string;
  annualRevenue: number;
  exportValue: number;
  importValue: number;
  hasFinancialDocs: boolean;
  documentCount: number;
  lastUpdated: string;
}

interface EnhancedRealCompanySearchBarProps {
  onCompanySelect: (company: CompanySearchResult) => void;
  onDocumentLoad?: (companyCode: string, progress: number) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

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

export default function EnhancedRealCompanySearchBar({
  onCompanySelect,
  onDocumentLoad,
  placeholder = "Search Vietnam companies (Real S&P Capital IQ data)...",
  autoFocus = false,
  className = ''
}: EnhancedRealCompanySearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CompanySearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<CompanySearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { networkStatus } = useNetworkAwareLoading();

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('vietnam-real-recent-searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading recent searches:', e);
      }
    }
  }, []);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search for companies
  const searchCompanies = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setSearchStatus('idle');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSearchStatus('loading');

    try {
      const response = await axios.post('/api/vietnam/real-search', {
        query: searchQuery,
        limit: 10,
        filters: {}
      });

      if (response.data.success) {
        setResults(response.data.results);
        setShowResults(true);
        setSearchStatus('success');
      } else {
        setError(response.data.error || 'Search failed');
        setResults([]);
        setSearchStatus('error');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search companies. Please ensure Capital IQ data is loaded.');
      setResults([]);
      setSearchStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((value: string) => searchCompanies(value), 300),
    []
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    
    if (value.trim()) {
      debouncedSearch(value);
    } else {
      setResults([]);
      setShowResults(true); // Show recent searches
      setSearchStatus('idle');
    }
  };

  // Load documents for selected company
  const loadCompanyDocuments = async (company: CompanySearchResult) => {
    setIsLoadingDocs(true);
    
    try {
      // Simulate progressive document loading
      const eventSource = new EventSource(`/api/companies/load-documents?companyCode=${company.companyCode}`);
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.progress && onDocumentLoad) {
          onDocumentLoad(company.companyCode, data.progress);
        }
        
        if (data.complete) {
          eventSource.close();
          setIsLoadingDocs(false);
          
          // Add to recent searches
          const updatedRecent = [company, ...recentSearches.filter(c => c.companyCode !== company.companyCode)].slice(0, 5);
          setRecentSearches(updatedRecent);
          localStorage.setItem('vietnam-real-recent-searches', JSON.stringify(updatedRecent));
          
          // Select the company
          onCompanySelect(company);
          setQuery('');
          setShowResults(false);
        }
      };
      
      eventSource.onerror = () => {
        eventSource.close();
        setIsLoadingDocs(false);
        setError('Failed to load company documents');
      };
      
    } catch (err) {
      console.error('Error loading documents:', err);
      setIsLoadingDocs(false);
      setError('Failed to load company documents');
    }
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    setSearchStatus('idle');
    setError(null);
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalResults = results.length || recentSearches.length;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalResults);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + totalResults) % totalResults);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          const selected = results.length > 0 
            ? results[selectedIndex] 
            : recentSearches[selectedIndex];
          if (selected) {
            loadCompanyDocuments(selected);
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Format currency
  const formatCurrency = (value: number, currency: string = 'VND') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Get display results
  const displayResults = query.trim() ? results : recentSearches;

  // Get search status icon
  const getStatusIcon = () => {
    switch (searchStatus) {
      case 'loading': 
        return <InlineSpinner className="text-[rgb(var(--scb-honolulu-blue))]" size="xs" />;
      case 'success': 
        return <CheckCircle className="w-4 h-4 text-[rgb(var(--scb-american-green))]" />;
      case 'error': 
        return <AlertCircle className="w-4 h-4 text-[rgb(var(--scb-muted-red))]" />;
      default: 
        return null;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div ref={searchRef} className={`relative w-full ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[rgb(var(--scb-dark-gray))] w-5 h-5" />
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowResults(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="fiori-input w-full pl-10 pr-10 py-3 text-[rgb(var(--scb-dark-gray))] bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--scb-honolulu-blue))] focus:border-[rgb(var(--scb-honolulu-blue))] transition-all"
        />
        
        {query && (
          <button 
            onClick={clearSearch}
            className="absolute right-10 top-1/2 transform -translate-y-1/2 text-[rgb(var(--scb-dark-gray))] hover:text-[rgb(var(--scb-muted-red))] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <InlineSpinner className="text-[rgb(var(--scb-honolulu-blue))]" size="xs" />
          </div>
        )}
      </div>

      <AnimatePresence>
        {showResults && (displayResults.length > 0 || error) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 bg-white border border-[rgb(var(--scb-border))] rounded-lg shadow-lg overflow-hidden"
          >
            {/* Search Status Bar */}
            {searchStatus !== 'idle' && (
              <div className={`px-4 py-2 flex items-center justify-between text-xs ${
                searchStatus === 'error' 
                  ? 'bg-[rgba(var(--scb-muted-red),0.1)] text-[rgb(var(--scb-muted-red))]' 
                  : searchStatus === 'success' 
                  ? 'bg-[rgba(var(--scb-american-green),0.05)] text-[rgb(var(--scb-american-green))]' 
                  : 'bg-[rgba(var(--scb-honolulu-blue),0.05)] text-[rgb(var(--scb-honolulu-blue))]'
              }`}>
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  <span>
                    {searchStatus === 'loading' 
                      ? 'Searching...' 
                      : searchStatus === 'success' 
                      ? `Found ${results.length} companies` 
                      : error || 'Search failed'}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    networkStatus === 'fast' 
                      ? 'bg-[rgba(var(--scb-american-green),0.1)] text-[rgb(var(--scb-american-green))]' 
                      : networkStatus === 'slow' 
                      ? 'bg-[rgba(var(--scb-muted-red),0.1)] text-[rgb(var(--scb-muted-red))]' 
                      : 'bg-[rgba(var(--scb-honolulu-blue),0.1)] text-[rgb(var(--scb-honolulu-blue))]'
                  }`}>
                    {networkStatus.toUpperCase()} NETWORK
                  </span>
                </div>
              </div>
            )}
            
            {error && searchStatus === 'error' ? (
              <div className="p-4 text-[rgb(var(--scb-muted-red))] text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            ) : (
              <>
                {/* Header */}
                {!query.trim() && displayResults.length > 0 && (
                  <div className="px-4 py-2 text-xs font-medium text-[rgb(var(--scb-dark-gray))] bg-[rgba(var(--scb-light-gray),0.5)] border-b border-[rgb(var(--scb-border))] uppercase">
                    Recent searches
                  </div>
                )}
                
                {/* Results List */}
                <div className="max-h-96 overflow-y-auto">
                  {displayResults.map((company, index) => (
                    <motion.div
                      key={company.companyCode}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => loadCompanyDocuments(company)}
                      className={`
                        p-4 cursor-pointer hover:bg-[rgba(var(--scb-honolulu-blue),0.05)] transition-colors
                        ${selectedIndex === index ? 'bg-[rgba(var(--scb-honolulu-blue),0.05)]' : ''}
                        ${index > 0 ? 'border-t border-[rgb(var(--scb-border))]' : ''}
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[rgba(var(--scb-honolulu-blue),0.1)] flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-4 h-4 text-[rgb(var(--scb-honolulu-blue))]" />
                            </div>
                            <div>
                              <h4 className="font-medium text-[rgb(var(--scb-dark-gray))]">
                                {company.companyName}
                              </h4>
                              {company.hasFinancialDocs && (
                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-[rgb(var(--scb-american-green))] bg-[rgba(var(--scb-american-green),0.1)] rounded-full mt-1 gap-1">
                                  <FileText className="w-3 h-3" />
                                  {company.documentCount} documents
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-2 flex items-center gap-4 text-xs text-[rgb(var(--scb-dark-gray))]">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {company.province}
                            </span>
                            <span className="flex items-center gap-1">
                              <BarChart className="w-3 h-3" />
                              {company.industry}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Updated: {formatDate(company.lastUpdated)}
                            </span>
                          </div>
                          
                          <div className="mt-3 flex items-center flex-wrap gap-3 text-sm">
                            {company.annualRevenue > 0 && (
                              <span className="flex items-center gap-1 horizon-chip horizon-chip-blue">
                                <DollarSign className="w-3 h-3" />
                                Revenue: {formatCurrency(company.annualRevenue)}
                              </span>
                            )}
                            {company.exportValue > 0 && (
                              <span className="flex items-center gap-1 horizon-chip horizon-chip-green">
                                <Package className="w-3 h-3" />
                                Export: {formatCurrency(company.exportValue, 'USD')}
                              </span>
                            )}
                            {company.importValue > 0 && (
                              <span className="flex items-center gap-1 horizon-chip">
                                <TrendingUp className="w-3 h-3" />
                                Import: {formatCurrency(company.importValue, 'USD')}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="ml-4 text-right">
                          <div className="text-xs text-[rgb(var(--scb-dark-gray))]">
                            Capital IQ ID
                          </div>
                          <div className="text-sm font-mono text-[rgb(var(--scb-honolulu-blue))] bg-[rgba(var(--scb-honolulu-blue),0.05)] px-2 py-1 rounded mt-1">
                            {company.capitalIQId || company.companyCode}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* Footer */}
                <div className="px-4 py-3 bg-[rgba(var(--scb-light-gray),0.3)] border-t border-[rgb(var(--scb-border))]">
                  <div className="flex items-center justify-between text-xs text-[rgb(var(--scb-dark-gray))]">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-[rgb(var(--scb-american-green))]" />
                      S&P Capital IQ Data • Real-time search
                    </span>
                    <span>
                      Updated: {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {isLoadingDocs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[rgba(var(--scb-honolulu-blue),0.1)] flex items-center justify-center">
                <InlineSpinner className="text-[rgb(var(--scb-honolulu-blue))]" size="md" />
              </div>
              <div>
                <p className="font-medium text-[rgb(var(--scb-dark-gray))]">Loading documents from Capital IQ...</p>
                <p className="text-sm text-[rgb(var(--scb-dark-gray))]">This may take a few moments</p>
                <div className="w-full h-2 bg-[rgba(var(--scb-light-gray),0.5)] rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-[rgb(var(--scb-honolulu-blue))] rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}