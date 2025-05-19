import React, { useState, useEffect } from 'react';
import { Newspaper, TrendingUp, Clock, ExternalLink, RefreshCw, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';

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

  // Mock news data
  const mockNews: NewsItem[] = [
    {
      id: uuidv4(),
      title: "Asian Stocks Edge Higher on Strong Regional Manufacturing Data",
      summary: "Asian stocks climbed higher following strong PMI data from Vietnam and Thailand. Regional supply chain stability is improving, leading to positive industrial output projections.",
      category: "Markets",
      timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
      source: "Financial Times",
      url: "https://www.ft.com/content/market-news"
    },
    {
      id: uuidv4(),
      title: "Vietnam's Exports Surge 15% in Q1 Amid Tariff Uncertainty",
      summary: "Vietnam's exports grew significantly in Q1 2025 despite ongoing trade tensions. Electronics and textiles led the growth with major shipments to ASEAN partners and the EU.",
      category: "Trade",
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
      source: "Bloomberg",
      url: "https://www.bloomberg.com/news/vietnam"
    },
    {
      id: uuidv4(),
      title: "US Federal Reserve Holds Rates, Signals Future Cut",
      summary: "The Federal Reserve maintained interest rates at current levels but hinted at potential cuts in the next quarter. Markets responded positively with Treasury yields declining.",
      category: "Economy",
      timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
      source: "The Wall Street Journal",
      url: "https://www.wsj.com/fed-news"
    },
    {
      id: uuidv4(),
      title: "SCB Reports Record Quarterly Profit, Boosts Investment in Vietnam",
      summary: "Standard Chartered Bank reported exceptional Q1 earnings and announced increased investments in Vietnam's growing market, focusing on digital banking and sustainable financing options.",
      category: "Banking",
      timestamp: new Date(Date.now() - 8 * 3600000).toISOString(),
      source: "Reuters",
      url: "https://www.reuters.com/business/finance/scb-reports"
    },
    {
      id: uuidv4(),
      title: "Vietnam Government Announces New Incentives for Foreign Investors",
      summary: "Vietnam's Ministry of Planning and Investment unveiled a comprehensive package of tax incentives and regulatory reforms designed to attract foreign direct investment in high-tech manufacturing and renewable energy.",
      category: "Policy",
      timestamp: new Date(Date.now() - 16 * 3600000).toISOString(),
      source: "Nikkei Asia",
      url: "https://asia.nikkei.com/vietnam-investment"
    },
    {
      id: uuidv4(),
      title: "Tech Stocks Rally on Strong Cloud Computing Demand",
      summary: "Major technology companies saw significant gains as quarterly reports showed stronger-than-expected growth in cloud services revenue. Enterprise digitalization continues to drive the sector.",
      category: "Technology",
      timestamp: new Date(Date.now() - 12 * 3600000).toISOString(),
      source: "CNBC",
      url: "https://www.cnbc.com/tech"
    },
    {
      id: uuidv4(),
      title: "ASEAN Economic Ministers Agree on Digital Trade Framework",
      summary: "ASEAN members reached consensus on a common framework for digital trade regulations, expected to boost regional e-commerce and fintech growth while harmonizing cross-border transactions.",
      category: "Trade",
      timestamp: new Date(Date.now() - 26 * 3600000).toISOString(),
      source: "The Straits Times",
      url: "https://www.straitstimes.com/asean"
    },
    {
      id: uuidv4(),
      title: "Global Supply Chain Disruptions Easing, Report Suggests",
      summary: "A new industry report indicates significant improvements in global supply chain resilience, with shipping times normalizing and component shortages resolving across multiple manufacturing sectors.",
      category: "Logistics",
      timestamp: new Date(Date.now() - 20 * 3600000).toISOString(),
      source: "Financial Times",
      url: "https://www.ft.com/supply-chain"
    }
  ];

  // Fetch news on component mount
  useEffect(() => {
    fetchNews();
    // No need for interval with mock data
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      // Use mock data instead of API call to avoid 400 errors
      setNews(mockNews);
    } catch (error) {
      console.error('Error loading news:', error);
      setNews([]);
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