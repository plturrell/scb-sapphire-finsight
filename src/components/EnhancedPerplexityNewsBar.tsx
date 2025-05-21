import React, { useState, useEffect } from 'react';
import { Newspaper, TrendingUp, Clock, ExternalLink, RefreshCw, Sparkles, BarChart, Globe, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { perplexityApi } from '../lib/market-news-service';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  timestamp: string;
  source: string;
  url?: string;
}

interface EnhancedPerplexityNewsBarProps {
  onAnalyzeNews?: (newsItem: NewsItem) => void;
}

export default function EnhancedPerplexityNewsBar({ onAnalyzeNews }: EnhancedPerplexityNewsBarProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'all' | 'markets' | 'asia'>('all');

  // Fetch news on component mount
  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      
      const MAX_RETRIES = 2;
      let retryCount = 0;
      let lastError: Error | null = null;
      
      // Retry logic with backoff
      while (retryCount <= MAX_RETRIES) {
        // Create a new controller for each attempt
        const controller = new AbortController();
        // Increased timeout to 20 seconds for more reliability
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        
        try {
          console.log(`Enhanced news component: Attempting fetch (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
          
          // Use a wrapper to ensure we get proper error handling
          const response = await fetch('/api/market-news', { 
            signal: controller.signal,
            headers: { 
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache' // Prevent caching issues
            }
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          
          // Successfully got a response, process it
          const data = await response.json();
          
          // Check if we got a fallback response or an error message
          if (data.fallbackContent || !data.success) {
            console.warn('Received fallback content from API');
            // Create a fallback news item
            setNews([{
              id: `fallback-${Date.now()}`,
              title: 'Market News Temporarily Unavailable',
              summary: data.fallbackContent || 'Unable to retrieve market news. Please try again later.',
              category: 'Service Alert',
              timestamp: new Date().toISOString(),
              source: 'System',
              url: ''
            }]);
            setLoading(false);
            setIsRefreshing(false);
            return;
          }
          
          // Process the successful response
          if (!data.articles || !Array.isArray(data.articles)) {
            throw new Error('Invalid news data format');
          }
          
          // Process response and exit retry loop
          setNews(data.articles);
          setLoading(false);
          setIsRefreshing(false);
          return;
          
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          lastError = fetchError;
          
          console.error(`News fetch error (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, 
            fetchError.name === 'AbortError' ? 'Request timed out' : fetchError.message || fetchError);
          
          // If we have retries left, try again with backoff
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            const backoffMs = 1000 * retryCount; // Increasing backoff
            console.log(`Retrying news fetch in ${backoffMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
          } else {
            // No more retries
            break;
          }
        }
      }
      
      // If we reach here, all retries failed
      console.error('All news fetch retries failed');
      
      // Create fallback news item when all attempts failed
      setNews([{
        id: `error-${Date.now()}`,
        title: 'Market News Temporarily Unavailable',
        summary: 'We couldn\'t retrieve the latest market news. Please try again later.',
        category: 'Service Alert',
        timestamp: new Date().toISOString(),
        source: 'System',
        url: ''
      }]);
      
      setLoading(false);
      setIsRefreshing(false);
    } catch (error) {
      console.error('Unexpected error in fetchNews:', error);
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const refreshNews = () => {
    setIsRefreshing(true);
    fetchNews();
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours}h ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Get appropriate icon for news category
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'markets':
        return <TrendingUp className='w-4 h-4' />;
      case 'economy':
        return <BarChart className='w-4 h-4' />;
      case 'asia':
        return <Globe className='w-4 h-4' />;
      case 'banking':
        return <BarChart className='w-4 h-4' />;
      case 'service alert':
        return <AlertCircle className='w-4 h-4' />;
      default:
        return <Newspaper className='w-4 h-4' />;
    }
  };

  // Get color for category
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'markets':
        return 'var(--scb-honolulu-blue)';
      case 'economy':
        return 'var(--scb-american-green)';
      case 'asia':
        return '#5436D6';
      case 'banking':
        return '#E76F51';
      case 'service alert':
        return '#FF4500';
      default:
        return 'var(--scb-dark-gray)';
    }
  };
  
  const handleAnalyzeWithJoule = (item: NewsItem, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the news item click from opening the URL
    if (onAnalyzeNews) {
      onAnalyzeNews(item);
    }
  };

  // Filter news based on selected tab
  const filteredNews = news.filter(item => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'markets') return item.category.toLowerCase() === 'markets';
    if (selectedTab === 'asia') return item.category.toLowerCase() === 'asia' || 
                                     item.title.toLowerCase().includes('asia') || 
                                     item.title.toLowerCase().includes('vietnam');
    return true;
  });

  return (
    <div className="bg-white border-r border-[rgb(var(--scb-border))] w-80 h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[rgb(var(--scb-border))]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div 
              className="h-6 w-6 rounded flex items-center justify-center bg-[#5436D6]"
            >
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <h2 className="text-base font-medium text-[rgb(var(--scb-dark-gray))]">Market News</h2>
          </div>
          <button
            onClick={refreshNews}
            className={`p-1.5 hover:bg-[rgba(var(--scb-honolulu-blue),0.1)] rounded transition-all ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            title="Refresh news"
            aria-label="Refresh news"
          >
            <RefreshCw className="w-4 h-4 text-[rgb(var(--scb-honolulu-blue))]" />
          </button>
        </div>
        
        {/* Category tabs */}
        <div className="flex space-x-1 border-b border-[rgb(var(--scb-border))] mt-2 pb-2">
          <button
            onClick={() => setSelectedTab('all')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              selectedTab === 'all' 
                ? 'bg-[rgba(var(--scb-honolulu-blue),0.1)] text-[rgb(var(--scb-honolulu-blue))] font-medium' 
                : 'text-[rgb(var(--scb-dark-gray))] hover:bg-[rgba(var(--scb-honolulu-blue),0.05)]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedTab('markets')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              selectedTab === 'markets' 
                ? 'bg-[rgba(var(--scb-honolulu-blue),0.1)] text-[rgb(var(--scb-honolulu-blue))] font-medium' 
                : 'text-[rgb(var(--scb-dark-gray))] hover:bg-[rgba(var(--scb-honolulu-blue),0.05)]'
            }`}
          >
            Markets
          </button>
          <button
            onClick={() => setSelectedTab('asia')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              selectedTab === 'asia' 
                ? 'bg-[rgba(var(--scb-honolulu-blue),0.1)] text-[rgb(var(--scb-honolulu-blue))] font-medium' 
                : 'text-[rgb(var(--scb-dark-gray))] hover:bg-[rgba(var(--scb-honolulu-blue),0.05)]'
            }`}
          >
            Asia
          </button>
        </div>
      </div>

      {/* News List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(var(--scb-honolulu-blue))] mx-auto mb-2"></div>
              <p className="text-sm text-[rgb(var(--scb-dark-gray))]">Loading market news...</p>
            </div>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 px-4 text-center">
            <Newspaper className="w-12 h-12 text-[rgba(var(--scb-dark-gray),0.2)] mb-3" />
            <p className="text-sm text-[rgb(var(--scb-dark-gray))] mb-2">No news available</p>
            <button 
              onClick={refreshNews}
              className="fiori-btn fiori-btn-primary px-4 py-2 text-sm"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[rgb(var(--scb-border))]">
            {filteredNews.map((item) => (
              <div
                key={item.id}
                className="p-4 hover:bg-[rgba(var(--scb-light-blue),0.05)] cursor-pointer transition-colors"
                onClick={() => item.url && window.open(item.url, '_blank')}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1" style={{ color: getCategoryColor(item.category) }}>
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))] mb-1 line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[rgba(var(--scb-dark-gray),0.8)] mb-2 line-clamp-2">
                      {item.summary}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-[rgba(var(--scb-dark-gray),0.6)]">
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
                            className="p-1 rounded hover:bg-[rgba(var(--scb-honolulu-blue),0.1)] text-[rgb(var(--scb-honolulu-blue))]"
                            title="Analyze with Joule AI"
                            aria-label="Analyze with Joule AI"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {item.url && (
                          <ExternalLink className="w-3 h-3 text-[rgba(var(--scb-dark-gray),0.4)]" />
                        )}
                      </div>
                    </div>
                    <div className="mt-2">
                      <span 
                        className="inline-block px-2 py-0.5 text-xs rounded-full"
                        style={{ 
                          backgroundColor: `${getCategoryColor(item.category)}15`,
                          color: getCategoryColor(item.category)
                        }}
                      >
                        {item.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[rgb(var(--scb-border))] bg-[rgba(var(--scb-light-blue),0.05)]">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[rgba(var(--scb-dark-gray),0.6)]">
            Updated: {formatTimestamp(new Date().toISOString())}
          </span>
          <button className="text-xs text-[rgb(var(--scb-honolulu-blue))] hover:underline font-medium">
            View All News
          </button>
        </div>
      </div>
    </div>
  );
}
