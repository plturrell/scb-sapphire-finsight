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
  RefreshCw,
  Info,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { useRouter } from 'next/router';
import { searchWithPerplexity, searchCompanies, getFinancialInsights } from '@/lib/perplexity-api';
import { useCache } from '@/hooks';
import SkeletonLoader from './SkeletonLoader';
import { SearchResult, CompanySearchResult, FinancialInsights, SearchOptions } from '@/types/perplexity';
import perplexityAnalytics from '@/services/PerplexityAnalytics';

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

interface SearchResultItem {
  id: string;
  type: 'company' | 'insight' | 'news' | 'general';
  title: string;
  subtitle?: string;
  description?: string;
  confidence?: number;
  icon?: React.ElementType;
  action?: () => void;
}

interface SearchCache {
  query: string;
  results: SearchResultItem[];
  summary: string;
}

interface PerplexitySearchBarProps {
  placeholder?: string;
  autoFocus?: boolean;
  onResultSelect?: (result: SearchResultItem) => void;
  className?: string;
}

export default function PerplexitySearchBar({
  placeholder = 'Search companies, insights, news...',
  autoFocus = false,
  onResultSelect,
  className = ''
}: PerplexitySearchBarProps) {
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchType, setSearchType] = useState<'all' | 'companies' | 'insights'>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const [skeletonVisible, setSkeletonVisible] = useState<boolean>(false);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentPerplexitySearches');
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

  // Use caching hook for search results
  const [cachedResults, cacheLoading, cacheError, performCachedSearch] = useCache<SearchCache>(
    `search:${searchQuery}:${searchType}`,
    async () => {
      // Create a wrapper function to execute the actual search
      const executeSearch = async (): Promise<SearchCache> => {
        let results: SearchResultItem[] = [];
        let summaryText = '';
        let promises = [];

        // Create a controller for aborting requests if they take too long
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        const signal = controller.signal;

        try {
          // Prepare all the search requests based on type
          if (searchType === 'all' || searchType === 'companies') {
            // Search for companies
            promises.push(
              searchCompanies(searchQuery).then(companies => {
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
              }).catch(err => {
                console.error('Company search error:', err);
                // Continue with other searches even if this one fails
              })
            );
          }

          if (searchType === 'all' || searchType === 'insights') {
            // Get financial insights
            promises.push(
              getFinancialInsights(searchQuery).then(insights => {
                summaryText = insights.summary;
                
                if (insights.insights && Array.isArray(insights.insights)) {
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
              }).catch(err => {
                console.error('Insights search error:', err);
                // Continue with other searches even if this one fails
              })
            );
          }

          // General search results
          promises.push(
            searchWithPerplexity(searchQuery).then(generalResults => {
              if (generalResults && generalResults.summary) {
                results.push({
                  id: 'general-summary',
                  type: 'general',
                  title: 'AI Summary',
                  description: generalResults.summary,
                  icon: Sparkles,
                  confidence: 1.0
                });
              }
            }).catch(err => {
              console.error('General search error:', err);
              // Continue anyway
            })
          );

          // Wait for all promises to settle (either resolve or reject)
          await Promise.allSettled(promises);
          clearTimeout(timeoutId);

          return {
            query: searchQuery,
            results: results,
            summary: summaryText
          };
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      };

      // Execute the search with a timeout
      return executeSearch();
    },
    { ttl: 5 * 60 * 1000, namespace: 'perplexity_searches' } // 5 minute TTL
  );
  
  // Perform search with Perplexity AI
  const performSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSearchResults([]);
        setAiInsight('');
        setError(false);
        setSkeletonVisible(false);
        return;
      }

      // Track search start in analytics
      const searchStartTime = Date.now();
      perplexityAnalytics.trackSearch(query, { type: searchType });

      setIsLoading(true);
      setError(false);
      setSkeletonVisible(true);
      
      try {
        // Try to get cached or fresh results
        const result = await performCachedSearch(false); // Don't force fresh by default
        
        if (result && result.results.length > 0) {
          setSearchResults(result.results);
          setAiInsight(result.summary);
          
          // Track search completion with metrics
          const searchDuration = Date.now() - searchStartTime;
          perplexityAnalytics.trackSearchCompleted(query, result.results.length, searchDuration);
        } else {
          setError(true);
          setSearchResults([{
            id: 'error',
            type: 'general',
            title: 'No Results Found',
            description: 'No matching results were found. Please try a different search query.',
            icon: AlertCircle
          }]);
          
          // Track no results event
          perplexityAnalytics.trackEvent('search:no_results', { query });
        }
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
        
        // Track search error
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        perplexityAnalytics.trackSearchError(query, errorMessage);
      } finally {
        setIsLoading(false);
        // Small delay before hiding skeleton for smooth transition
        setTimeout(() => setSkeletonVisible(false), 300);
      }
    }, 300),
    [searchType, router, performCachedSearch]
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowResults(true);
    performSearch(query);
  };

  // Select result
  const selectResult = (result: SearchResultItem, index: number = -1) => {
    if (result.action) {
      result.action();
    }
    
    // Add to recent searches
    const newRecent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('recentPerplexitySearches', JSON.stringify(newRecent));
    
    // Track result selection in analytics
    perplexityAnalytics.trackResultSelected(
      result.id,
      index >= 0 ? index : searchResults.findIndex(r => r.id === result.id),
      result.type
    );
    
    setShowResults(false);
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
          selectResult(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        break;
    }
  };

  const getResultIcon = (result: SearchResultItem) => {
    const Icon = result.icon || Globe;
    return <Icon className="w-5 h-5 flex-shrink-0" />;
  };

  return (
    <div ref={searchRef} className="relative w-full">
      {/* Search Input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowResults(true)}
            placeholder="Search companies, insights, news..."
            className="w-full bg-gray-50 border border-gray-300 text-gray-900 py-3 px-12 pr-32 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white transition-all"
          />
        
          {/* Search Type Selector */}
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as any)}
              className="text-sm bg-transparent border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="all">All</option>
              <option value="companies">Companies</option>
              <option value="insights">Insights</option>
            </select>
            
            {isLoading ? (
              <Loader data-testid="loading-indicator" className="w-5 h-5 text-purple-500 animate-spin" />
            ) : error ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : (
              <Brain className="w-5 h-5 text-purple-500" />
            )}
          </div>
        </div>
        
        {/* Perplexity Branding */}
        <div className="flex items-center gap-2 ml-2">
          <div 
            className="h-6 w-6 rounded flex items-center justify-center bg-[#5436D6]"
          >
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="text-sm text-gray-600 whitespace-nowrap">Powered by Perplexity</span>
        </div>
      </div>

      {/* Error Bar */}
      {error && searchQuery.length > 0 && (
        <div className="absolute top-full mt-1 w-full p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-800 mb-1">Search service is temporarily unavailable.</p>
              <button 
                onClick={() => {
                  setError(false);
                  performSearch(searchQuery);
                }}
                className="text-xs bg-red-100 hover:bg-red-200 text-red-800 py-1 px-2 rounded transition-colors"
              >
                Retry Search
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* AI Insight Bar */}
      {aiInsight && showResults && !error && (
        <div className="absolute top-full mt-1 w-full p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-purple-900">{aiInsight}</p>
          </div>
        </div>
      )}

      {/* Search Results Dropdown */}
      {showResults && (searchResults.length > 0 || (searchQuery.length === 0 && recentSearches.length > 0) || skeletonVisible) && (
        <div className={`absolute top-full ${aiInsight ? 'mt-16' : 'mt-2'} w-full bg-white rounded-lg shadow-xl overflow-hidden z-50 border border-gray-200`}>
          {/* Recent Searches */}
          {searchQuery.length === 0 && recentSearches.length > 0 && (
            <>
              <div className="px-4 py-2 bg-gray-50 border-b">
                <h4 className="text-xs font-medium text-gray-600 uppercase">Recent Searches</h4>
              </div>
              {recentSearches.map((recent, idx) => (
                <div
                  key={idx}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3"
                  onClick={() => {
                    setSearchQuery(recent);
                    performSearch(recent);
                  }}
                >
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{recent}</span>
                </div>
              ))}
            </>
          )}

          {/* Skeleton Loading State */}
          {searchQuery.length > 0 && skeletonVisible && (
            <>
              <div className="px-4 py-2 bg-gray-50 border-b">
                <h4 className="text-xs font-medium text-gray-600 uppercase">
                  Loading Results...
                </h4>
              </div>
              
              <div className="max-h-96 overflow-y-auto px-4 py-2">
                <SkeletonLoader type="search" count={3} />
              </div>
            </>
          )}
          
          {/* Search Results */}
          {searchQuery.length > 0 && searchResults.length > 0 && !skeletonVisible && (
            <>
              <div className="px-4 py-2 bg-gray-50 border-b">
                <h4 className="text-xs font-medium text-gray-600 uppercase">
                  AI-Powered Results ({searchResults.length})
                </h4>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {searchResults.map((result, idx) => (
                  <div
                    key={result.id}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                      selectedIndex === idx ? 'bg-gray-50' : ''
                    }`}
                    onClick={() => selectResult(result, idx)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${result.type === 'company' ? 'text-blue-500' : result.type === 'insight' ? 'text-purple-500' : 'text-gray-500'}`}>
                        {getResultIcon(result)}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{result.title}</h4>
                        {result.subtitle && (
                          <p className="text-sm text-gray-600 mt-0.5">{result.subtitle}</p>
                        )}
                        {result.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{result.description}</p>
                        )}
                      </div>
                      
                      {result.confidence && (
                        <div className="flex items-center space-x-1 text-xs text-gray-400">
                          <span>{Math.round(result.confidence * 100)}%</span>
                          <button 
                            className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-green-500 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              perplexityAnalytics.trackFeedback('positive', result.id);
                              // Show feedback received
                              e.currentTarget.classList.add('text-green-500');
                              e.currentTarget.classList.add('bg-green-50');
                            }}
                            title="Good result"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button 
                            className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              perplexityAnalytics.trackFeedback('negative', result.id);
                              // Show feedback received
                              e.currentTarget.classList.add('text-red-500');
                              e.currentTarget.classList.add('bg-red-50');
                            }}
                            title="Not relevant"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                        </div>
                      )}
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
}