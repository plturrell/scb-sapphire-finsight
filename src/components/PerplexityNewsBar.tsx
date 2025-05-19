import React, { useState, useEffect } from 'react';
import { Newspaper, TrendingUp, Clock, ExternalLink, RefreshCw, Sparkles } from 'lucide-react';
import Image from 'next/image';
import axios from 'axios';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  timestamp: string;
  source: string;
  url?: string;
}

interface PerplexityNewsBarProps {
  onAnalyzeNews?: (newsItem: NewsItem) => void;
}

export default function PerplexityNewsBar({ onAnalyzeNews }: PerplexityNewsBarProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedNewsItem, setSelectedNewsItem] = useState<NewsItem | null>(null);

  // Fetch news on component mount
  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      // Use our internal API endpoint instead of external API
      const response = await axios.get('/api/market-news');
      
      if (response.data && response.data.length > 0) {
        setNews(response.data);
      } else {
        // Fallback - create some dummy news items if API doesn't return any
        const fallbackNews = [];
        for (let i = 0; i < 3; i++) {
          fallbackNews.push({
            id: `fallback-${i}`,
            title: `Financial Update ${i+1}`,
            summary: "No specific market news available at this time.",
            category: "Finance",
            timestamp: new Date().toISOString(),
            source: "Market Update",
            url: "#"
          });
        }
        setNews(fallbackNews);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      
      // Create fallback news items on error
      const fallbackNews = [];
      for (let i = 0; i < 3; i++) {
        fallbackNews.push({
          id: `fallback-${i}`,
          title: `Market Update ${i+1}`,
          summary: "Unable to retrieve market news at this time.",
          category: "Finance",
          timestamp: new Date().toISOString(),
          source: "System",
          url: "#"
        });
      }
      setNews(fallbackNews);
    } finally {
      setLoading(false);
    }
  };

  const refreshNews = async () => {
    setIsRefreshing(true);
    await fetchNews();
    setTimeout(() => setIsRefreshing(false), 500);
  };

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
            onClick={refreshNews}
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
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Loading market news...</p>
            </div>
          </div>
        ) : news.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 px-4 text-center">
            <Newspaper className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-2">Could not retrieve market news</p>
            <button 
              onClick={refreshNews}
              className="px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors"
            >
              Retry
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