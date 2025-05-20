import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Search, 
  Building2, 
  TrendingUp, 
  Loader,
  Brain,
  Sparkles,
  FileText,
  Globe,
  AlertCircle,
  ChevronDown,
  History,
  Filter
} from 'lucide-react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { searchWithPerplexity, searchCompanies, getFinancialInsights } from '@/lib/perplexity-api';

// Debounce function
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

interface SearchResult {
  id: string;
  type: 'company' | 'insight' | 'news' | 'general';
  title: string;
  subtitle?: string;
  description?: string;
  confidence?: number;
  icon?: React.ElementType;
  action?: () => void;
}

export default function EnhancedPerplexitySearchBar() {
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchType, setSearchType] = useState<'all' | 'companies' | 'insights'>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentPerplexitySearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent searches:', e);
        setRecentSearches([]);
      }
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

  // Perform search with Perplexity AI
  const performSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSearchResults([]);
        setAiInsight('');
        setError(false);
        return;
      }

      setIsLoading(true);
      setError(false);
      
      try {
        let results: SearchResult[] = [];

        if (searchType === 'all' || searchType === 'companies') {
          // Search for companies
          const companies = await searchCompanies(query);
          const companyResults = companies.map(company => ({
            id: company.companyId,
            type: 'company' as const,
            title: company.companyName,
            subtitle: `${company.industry} • ${company.country}`,
            description: company.description,
            confidence: company.matchScore,
            icon: Building2,
            action: () => {
              // Navigate to company page or load company data
              router.push(`/company/${company.companyCode}`);
            }
          }));
          results = [...results, ...companyResults];
        }

        if (searchType === 'all' || searchType === 'insights') {
          // Get financial insights
          const insights = await getFinancialInsights(query);
          setAiInsight(insights.summary);
          
          if (insights.insights && insights.insights.length > 0) {
            insights.insights.forEach((insight: string, index: number) => {
              results.push({
                id: `insight-${index}`,
                type: 'insight',
                title: insight,
                icon: Brain,
                confidence: 0.9
              });
            });
          }
        }

        // General search results if we have few results
        if (results.length < 2) {
          const generalResults = await searchWithPerplexity(query);
          if (generalResults.summary) {
            results.push({
              id: 'general-summary',
              type: 'general',
              title: 'AI Summary',
              description: generalResults.summary,
              icon: Sparkles,
              confidence: 1.0
            });
          }
        }

        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setError(true);
        setSearchResults([{
          id: 'error',
          type: 'general',
          title: 'Search Error',
          description: 'Failed to perform search. Please try again.',
          icon: AlertCircle
        }]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [searchType, router]
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowResults(true);
    performSearch(query);
  };

  // Select result
  const selectResult = (result: SearchResult) => {
    if (result.action) {
      result.action();
    }
    
    // Add to recent searches if not already present or at the beginning
    if (searchQuery.trim() && !recentSearches.includes(searchQuery)) {
      const newRecent = [searchQuery, ...recentSearches].slice(0, 5);
      setRecentSearches(newRecent);
      localStorage.setItem('recentPerplexitySearches', JSON.stringify(newRecent));
    }
    
    setShowResults(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : searchResults.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          selectResult(searchResults[selectedIndex]);
        } else if (searchQuery.trim()) {
          // Add to recent searches
          const newRecent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
          setRecentSearches(newRecent);
          localStorage.setItem('recentPerplexitySearches', JSON.stringify(newRecent));
          // Navigate to search page
          router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
          setShowResults(false);
        }
        break;
      case 'Escape':
        setShowResults(false);
        break;
    }
  };

  const getResultIcon = (result: SearchResult) => {
    const Icon = result.icon || Globe;
    return <Icon className="w-5 h-5 flex-shrink-0 text-[rgb(var(--scb-dark-gray))]" />;
  };

  return (
    <div ref={searchRef} className="relative w-full mx-auto max-w-3xl">
      {/* Search Input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[rgb(var(--scb-dark-gray))]">
            <Search className="w-5 h-5" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowResults(true)}
            placeholder="Search companies, insights, news..."
            className="w-full fiori-input pl-12 pr-32 py-3 rounded-xl text-base border-[rgb(var(--scb-border))]"
          />
        
          {/* Search Type Selector */}
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as any)}
              className="horizon-chip border border-[rgb(var(--scb-border))] bg-white py-1 px-2 rounded-full text-xs focus:outline-none focus:border-[rgb(var(--scb-honolulu-blue))]"
            >
              <option value="all">All</option>
              <option value="companies">Companies</option>
              <option value="insights">Insights</option>
            </select>
            
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin text-[rgb(var(--scb-honolulu-blue))]" />
            ) : error ? (
              <AlertCircle className="w-5 h-5 text-[rgb(var(--scb-muted-red))]" />
            ) : (
              <div className="h-5 w-5 rounded-full flex items-center justify-center bg-[#5436D6]">
                <span className="text-white font-bold text-[10px]">P</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Bar */}
      {error && searchQuery.length > 0 && (
        <div className="absolute top-full mt-1 w-full p-3 bg-[rgba(var(--scb-muted-red),0.1)] border border-[rgba(var(--scb-muted-red),0.2)] rounded-lg z-40">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[rgb(var(--scb-muted-red))] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-[rgb(var(--scb-muted-red))] mb-1">Search service is temporarily unavailable.</p>
              <button 
                onClick={() => {
                  setError(false);
                  performSearch(searchQuery);
                }}
                className="fiori-btn-secondary text-xs py-1 px-2"
              >
                Retry Search
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* AI Insight Bar */}
      {aiInsight && showResults && !error && (
        <div className="absolute top-full mt-1 w-full p-3 bg-[rgba(var(--scb-light-blue),0.05)] border border-[rgba(var(--scb-light-blue),0.2)] rounded-lg z-40">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-[rgb(var(--scb-honolulu-blue))] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[rgb(var(--scb-dark-gray))]">{aiInsight}</p>
          </div>
        </div>
      )}

      {/* Search Results Dropdown */}
      {showResults && !error && (searchResults.length > 0 || (searchQuery.length === 0 && recentSearches.length > 0)) && (
        <div className={`absolute top-full ${aiInsight ? 'mt-24' : 'mt-2'} w-full bg-white rounded-lg horizon-dialog overflow-hidden z-50 border border-[rgb(var(--scb-border))]`}>
          {/* Recent Searches */}
          {searchQuery.length === 0 && recentSearches.length > 0 && (
            <>
              <div className="px-4 py-2 bg-[rgba(var(--scb-light-blue),0.05)] border-b border-[rgb(var(--scb-border))]">
                <div className="flex items-center">
                  <History className="w-4 h-4 text-[rgb(var(--scb-dark-gray))] mr-2" />
                  <h4 className="text-xs font-medium text-[rgb(var(--scb-dark-gray))]">RECENT SEARCHES</h4>
                </div>
              </div>
              {recentSearches.map((recent, idx) => (
                <div
                  key={idx}
                  className="px-4 py-3 hover:bg-[rgba(var(--scb-light-blue),0.05)] cursor-pointer flex items-center gap-3"
                  onClick={() => {
                    setSearchQuery(recent);
                    performSearch(recent);
                  }}
                >
                  <TrendingUp className="w-4 h-4 text-[rgb(var(--scb-dark-gray))]" />
                  <span className="text-sm text-[rgb(var(--scb-dark-gray))]">{recent}</span>
                </div>
              ))}
            </>
          )}

          {/* Search Results */}
          {searchQuery.length > 0 && searchResults.length > 0 && (
            <>
              <div className="px-4 py-2 bg-[rgba(var(--scb-light-blue),0.05)] border-b border-[rgb(var(--scb-border))]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Sparkles className="w-4 h-4 text-[rgb(var(--scb-honolulu-blue))] mr-2" />
                    <h4 className="text-xs font-medium text-[rgb(var(--scb-dark-gray))]">
                      AI-POWERED RESULTS
                    </h4>
                  </div>
                  <span className="text-xs text-[rgb(var(--scb-dark-gray))]">
                    {searchResults.length} results
                  </span>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {searchResults.map((result, idx) => (
                  <div
                    key={result.id}
                    className={`px-4 py-3 hover:bg-[rgba(var(--scb-light-blue),0.05)] cursor-pointer ${
                      selectedIndex === idx ? 'bg-[rgba(var(--scb-light-blue),0.05)]' : ''
                    }`}
                    onClick={() => selectResult(result)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${
                        result.type === 'company' ? 'text-[rgb(var(--scb-honolulu-blue))]' : 
                        result.type === 'insight' ? 'text-[#5436D6]' : 
                        'text-[rgb(var(--scb-dark-gray))]'
                      }`}>
                        {getResultIcon(result)}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium text-[rgb(var(--scb-dark-gray))]">{result.title}</h4>
                        {result.subtitle && (
                          <p className="text-sm text-[rgba(var(--scb-dark-gray),0.8)] mt-0.5">{result.subtitle}</p>
                        )}
                        {result.description && (
                          <p className="text-sm text-[rgba(var(--scb-dark-gray),0.7)] mt-1 line-clamp-2">{result.description}</p>
                        )}
                      </div>
                      
                      {result.confidence && (
                        <div className="horizon-chip horizon-chip-blue text-xs">
                          {Math.round(result.confidence * 100)}%
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-[rgb(var(--scb-border))] p-2 flex justify-end">
                <Link 
                  href={`/search?q=${encodeURIComponent(searchQuery)}`}
                  className="text-xs text-[rgb(var(--scb-honolulu-blue))] hover:underline flex items-center"
                >
                  View all results
                  <ChevronDown className="w-3 h-3 ml-1 transform rotate-270" />
                </Link>
              </div>
            </>
          )}
        </div>
      )}

      {/* Powered by Perplexity indicator */}
      <div className="absolute -bottom-6 right-2 text-xs text-[rgb(var(--scb-dark-gray))] opacity-70 flex items-center">
        Powered by 
        <Image 
          src="/assets/perplexity.svg" 
          alt="Perplexity AI" 
          width={16} 
          height={16} 
          className="ml-1 inline-block" 
        />
        <span className="ml-1">Perplexity</span>
      </div>
    </div>
  );
}