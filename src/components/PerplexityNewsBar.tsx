import React, { useState, useEffect, useCallback } from 'react';
import { Newspaper, TrendingUp, Clock, ExternalLink, RefreshCw, Sparkles, AlertCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useCache } from '@/hooks';
import SkeletonLoader from './SkeletonLoader';
import { NewsItem } from '@/types/perplexity';
import perplexityAnalytics from '@/services/PerplexityAnalytics';
import ApiService from '@/services/ApiService';


interface PerplexityNewsBarProps {
  onAnalyzeNews?: (newsItem: NewsItem) => void;
}

export default function PerplexityNewsBar({ onAnalyzeNews }: PerplexityNewsBarProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedNewsItem, setSelectedNewsItem] = useState<NewsItem | null>(null);
  const [error, setError] = useState<boolean>(false);
  
  // Use caching hook for market news
  const [cachedNews, cacheLoading, cacheError, refreshNews] = useCache<NewsItem[]>(
    'market-news',
    async () => {
      const MAX_RETRIES = 2;
      let retryCount = 0;
      let lastError: Error | null = null;
      
      // Retry logic with backoff
      while (retryCount <= MAX_RETRIES) {
        try {
          console.log(`Attempting to fetch news (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
          
          // Use our new API service
          const response = await ApiService.marketNews.getLatestNews({
            topic: 'financial markets',
            limit: 10
          });
          
          if (!response.success) {
            throw new Error('API returned unsuccessful response');
          }
          
          if (!response.articles || !Array.isArray(response.articles)) {
            throw new Error('Invalid news data format');
          }
          
          // Transform the API response to match our NewsItem format
          const newsItems = response.articles.map((article: any) => ({
            id: article.id || `news-${Date.now()}-${Math.random()}`,
            title: article.title,
            summary: article.summary,
            category: article.category || 'General',
            timestamp: article.timestamp || new Date().toISOString(),
            source: article.source || 'Financial News',
            url: article.url || '#',
            impact: article.impact,
            relevance: article.relevance
          }));
          
          return newsItems;
        } catch (fetchError: any) {
          lastError = fetchError;
          console.error(`News fetch error (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, fetchError.message || fetchError);
          
          // If we have retries left, try again with backoff
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            const backoffMs = 1000 * retryCount; // Increasing backoff
            console.log(`Retrying news fetch in ${backoffMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
          } else {
            // We've exhausted all retries
            break;
          }
        }
      }
      
      // If we get here, all retries failed - return a fallback item
      console.error('All news fetch retries failed');
      return [{
        id: `error-${Date.now()}`,
        title: 'Market News Temporarily Unavailable',
        summary: 'We couldn\'t retrieve the latest market news at this time. Please try refreshing or check back later.',
        category: 'Service Alert',
        timestamp: new Date().toISOString(),
        source: 'System',
        url: ''
      }];
    },
    {
      ttl: 5 * 60 * 1000, // 5 minute TTL for news
      namespace: 'perplexity'
    }
  );

  // Effect to update news from cache
  useEffect(() => {
    if (cachedNews) {
      setNews(cachedNews);
      setLoading(false);
    }
    if (cacheError) {
      console.error('Cache error:', cacheError);
      setError(true);
      setLoading(false);
    }
  }, [cachedNews, cacheError]);

  // Fetch news on component mount
  useEffect(() => {
    const fetchInitialNews = async () => {
      try {
        setLoading(true);
        setError(false);
        await refreshNews(false); // Don't force refresh initially
        
        // Track news viewed event in analytics
        perplexityAnalytics.trackEvent('news:viewed', {
          source: 'initial_load',
          count: news.length
        });
      } catch (error) {
        console.error('Error fetching news:', error);
        setError(true);
        
        // Track error event
        perplexityAnalytics.trackEvent('api:error', {
          endpoint: 'market-news',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInitialNews();
    
    // Set up interval for periodic refreshing
    const interval = setInterval(() => refreshNews(true), 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [refreshNews, news.length]);

  // Function to manually refresh news
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(false);
    
    // Track refresh event in analytics
    perplexityAnalytics.trackEvent('news:refreshed', {
      source: 'manual_refresh',
      previous_count: news.length
    });
    
    try {
      // First, trigger the API refresh endpoint
      await ApiService.marketNews.refreshMarketNews('financial markets');
      
      // Then refresh our local cache
      await refreshNews(true); // Force a fresh fetch
    } catch (error) {
      console.error('Error refreshing news:', error);
      setError(true);
      
      // Track error event
      perplexityAnalytics.trackEvent('api:error', {
        endpoint: 'market-news',
        action: 'refresh',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      // Short delay for UI feedback
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [refreshNews, news.length]);


  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'markets':
      case 'technology':
      case 'commodities':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Newspaper className="w-4 h-4" />;
    }
  };
  
  const handleAnalyzeWithJoule = (item: NewsItem, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the news item click from opening the URL
    
    // Track analyze with Joule event
    perplexityAnalytics.trackEvent('news:item_clicked', {
      newsId: item.id,
      title: item.title,
      category: item.category,
      source: item.source,
      action: 'analyze'
    });
    
    if (onAnalyzeNews) {
      onAnalyzeNews(item);
    }
  };

  return (
    <div className="bg-white border-r border-gray-200 w-80 h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div 
              className="h-5 w-5 rounded flex items-center justify-center bg-[#5436D6]"
            >
              <span className="text-white font-bold text-xs">P</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Market News</h2>
          </div>
          <button
            onClick={handleRefresh}
            className={`p-1.5 hover:bg-gray-100 rounded transition-all ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            title="Refresh news"
          >
            <RefreshCw className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <p className="text-xs text-gray-500">Powered by Perplexity AI</p>
      </div>

      {/* News List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4">
            <SkeletonLoader type="news" count={5} />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 px-4 text-center">
            <AlertCircle className="w-12 h-12 text-red-300 mb-3" />
            <p className="text-sm text-gray-500 mb-2">Could not retrieve market news</p>
            <button 
              onClick={handleRefresh}
              className="px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : news.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 px-4 text-center">
            <Newspaper className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-2">No market news available</p>
            <button 
              onClick={handleRefresh}
              className="px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {news.map((item) => (
              <div
                key={item.id}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => item.url && window.open(item.url, '_blank')}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-gray-400">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {item.summary}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="font-medium">{item.source}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(item.timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {onAnalyzeNews && (
                          <button 
                            onClick={(e) => handleAnalyzeWithJoule(item, e)}
                            className="p-1 rounded hover:bg-[rgba(var(--scb-accent),0.1)] text-purple-600"
                            title="Analyze with Joule AI"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {item.url && (
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                    </div>
                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-xs text-gray-600 rounded-full mt-2">
                      {item.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t bg-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Last updated: {formatTimestamp(new Date().toISOString())}</span>
          <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            View All News
          </button>
        </div>
      </div>
    </div>
  );
}