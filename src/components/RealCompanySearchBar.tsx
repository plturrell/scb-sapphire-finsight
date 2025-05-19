/**
 * Real Company Search Bar Component
 * Uses actual Capital IQ data with autocomplete and recommendations
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Search, Building2, MapPin, DollarSign, Package, FileText, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

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

interface RealCompanySearchBarProps {
  onCompanySelect: (company: CompanySearchResult) => void;
  onDocumentLoad?: (companyCode: string, progress: number) => void;
  placeholder?: string;
  autoFocus?: boolean;
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

export default function RealCompanySearchBar({
  onCompanySelect,
  onDocumentLoad,
  placeholder = "Search Vietnam companies (Real S&P Capital IQ data)...",
  autoFocus = false
}: RealCompanySearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CompanySearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<CompanySearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/vietnam/real-search', {
        query: searchQuery,
        limit: 10,
        filters: {}
      });

      if (response.data.success) {
        setResults(response.data.results);
        setShowResults(true);
      } else {
        setError(response.data.error || 'Search failed');
        setResults([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search companies. Please ensure Capital IQ data is loaded.');
      setResults([]);
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
          const selected = results[selectedIndex] || recentSearches[selectedIndex];
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

  return (
    <div ref={searchRef} className="relative w-full max-w-3xl mx-auto">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowResults(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-12 pr-4 py-3 text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin" />
        )}
      </div>

      <AnimatePresence>
        {showResults && (displayResults.length > 0 || error) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
          >
            {error ? (
              <div className="p-4 text-red-600 text-sm">
                {error}
              </div>
            ) : (
              <>
                {!query.trim() && displayResults.length > 0 && (
                  <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
                    Recent searches
                  </div>
                )}
                
                <div className="max-h-96 overflow-y-auto">
                  {displayResults.map((company, index) => (
                    <motion.div
                      key={company.companyCode}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => loadCompanyDocuments(company)}
                      className={`
                        p-4 cursor-pointer hover:bg-gray-50 transition-colors
                        ${selectedIndex === index ? 'bg-gray-50' : ''}
                        ${index > 0 ? 'border-t border-gray-100' : ''}
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <h4 className="font-medium text-gray-900">
                              {company.companyName}
                            </h4>
                            {company.hasFinancialDocs && (
                              <span className="px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                                {company.documentCount} docs
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {company.province}
                            </span>
                            <span>{company.industry}</span>
                          </div>
                          
                          <div className="mt-2 flex items-center gap-4 text-sm">
                            {company.annualRevenue > 0 && (
                              <span className="flex items-center gap-1 text-gray-600">
                                <DollarSign className="w-3 h-3" />
                                {formatCurrency(company.annualRevenue)}
                              </span>
                            )}
                            {company.exportValue > 0 && (
                              <span className="flex items-center gap-1 text-blue-600">
                                <Package className="w-3 h-3" />
                                Export: {formatCurrency(company.exportValue, 'USD')}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="ml-4 text-right">
                          <div className="text-xs text-gray-400">
                            Capital IQ ID
                          </div>
                          <div className="text-sm font-mono text-gray-600">
                            {company.capitalIQId || company.companyCode}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Data from S&P Capital IQ • Real-time search
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
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              <div>
                <p className="font-medium text-gray-900">Loading documents from Capital IQ...</p>
                <p className="text-sm text-gray-500">This may take a few moments</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}