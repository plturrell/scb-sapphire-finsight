import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';
import EnhancedPerplexityNewsBar from '@/components/EnhancedPerplexityNewsBar';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import useMultiTasking from '@/hooks/useMultiTasking';
import { useMediaQuery } from 'react-responsive';
import { Info, TrendingUp, ArrowUpRight, Clock, Zap } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { isDarkMode, isAppleDevice, isPlatformDetected } = useUIPreferences();
  const { isMultiTasking, mode, orientation } = useMultiTasking();
  const isSmallScreen = useMediaQuery({ maxWidth: 640 });
  
  // News items data
  const cnbcNews = [
    {
      title: "Fed signals potential rate cuts as inflation eases",
      timestamp: "2h ago",
      impact: "positive",
      category: "monetary-policy"
    },
    {
      title: "Tech stocks rally on strong earnings reports",
      timestamp: "4h ago",
      impact: "positive",
      category: "markets"
    },
    {
      title: "Oil prices drop amid supply concerns",
      timestamp: "6h ago",
      impact: "negative",
      category: "commodities"
    }
  ];
  
  const bloombergGreen = [
    {
      title: "Renewable energy investments hit record high",
      timestamp: "3h ago",
      impact: "positive",
      category: "esg"
    },
    {
      title: "Major banks commit to net-zero financing goals",
      timestamp: "5h ago",
      impact: "positive",
      category: "finance"
    },
    {
      title: "Carbon credit markets face regulatory scrutiny",
      timestamp: "8h ago",
      impact: "neutral",
      category: "regulation"
    }
  ];
  
  const financialTimes = [
    {
      title: "Global supply chains show signs of recovery",
      timestamp: "1h ago",
      impact: "positive",
      category: "economy"
    },
    {
      title: "UK inflation falls to 2-year low",
      timestamp: "4h ago",
      impact: "positive",
      category: "economy"
    },
    {
      title: "European banks face stress test challenges",
      timestamp: "7h ago",
      impact: "negative",
      category: "banking"
    }
  ];
  
  return (
    <ScbBeautifulUI>
      <div className="min-h-screen">
        <div className="px-4 py-6">
          <div className={`grid ${
            isMultiTasking && mode === 'slide-over'
              ? 'grid-cols-1 gap-3' 
              : isMultiTasking && mode === 'split-view'
                ? orientation === 'portrait' ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'
                : 'grid-cols-1 lg:grid-cols-3 gap-6'
          }`}>
            {/* CNBC News - iOS optimized */}
            <div 
              className={`border rounded-lg shadow-sm overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[rgb(var(--scb-border))]'} ${
                isAppleDevice ? 'transition-all duration-150 active:scale-[0.99]' : ''
              }`}
              style={isAppleDevice ? { WebkitTapHighlightColor: 'transparent' } : undefined}
            >
              <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-[rgb(var(--scb-border))]'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-[rgb(var(--scb-muted-red))]"></div>
                    <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} ${isMultiTasking && mode === 'slide-over' ? 'text-sm' : 'text-base'}`}>
                      Important CNBC News
                    </h3>
                  </div>
                  
                  {isAppleDevice && (
                    <Info 
                      className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ${isMultiTasking && mode === 'slide-over' ? 'h-3 w-3' : 'h-4 w-4'}`}
                    />
                  )}
                </div>
              </div>
              
              <ul className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-[rgb(var(--scb-border))]'}`}>
                {cnbcNews.map((item, index) => (
                  <li key={index} className={`px-4 py-3 ${isAppleDevice ? 'active:bg-gray-100 dark:active:bg-gray-700' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'} ${isMultiTasking && mode === 'slide-over' ? 'text-sm' : 'text-base'} font-medium`}>
                          {item.title}
                        </p>
                        <div className="flex items-center mt-1 space-x-2">
                          <Clock className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ${isMultiTasking && mode === 'slide-over' ? 'h-3 w-3' : 'h-4 w-4'}`} />
                          <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'}`}>
                            {item.timestamp}
                          </span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        item.impact === 'positive' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : item.impact === 'negative'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {item.category}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bloomberg Green - iOS optimized */}
            <div 
              className={`border rounded-lg shadow-sm overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[rgb(var(--scb-border))]'} ${
                isAppleDevice ? 'transition-all duration-150 active:scale-[0.99]' : ''
              }`}
              style={isAppleDevice ? { WebkitTapHighlightColor: 'transparent' } : undefined}
            >
              <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-[rgb(var(--scb-border))]'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-[rgb(var(--scb-american-green))]"></div>
                    <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} ${isMultiTasking && mode === 'slide-over' ? 'text-sm' : 'text-base'}`}>
                      Bloomberg Green
                    </h3>
                  </div>
                  
                  {isAppleDevice && (
                    <Info 
                      className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ${isMultiTasking && mode === 'slide-over' ? 'h-3 w-3' : 'h-4 w-4'}`}
                    />
                  )}
                </div>
              </div>
              
              <ul className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-[rgb(var(--scb-border))]'}`}>
                {bloombergGreen.map((item, index) => (
                  <li key={index} className={`px-4 py-3 ${isAppleDevice ? 'active:bg-gray-100 dark:active:bg-gray-700' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'} ${isMultiTasking && mode === 'slide-over' ? 'text-sm' : 'text-base'} font-medium`}>
                          {item.title}
                        </p>
                        <div className="flex items-center mt-1 space-x-2">
                          <Clock className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ${isMultiTasking && mode === 'slide-over' ? 'h-3 w-3' : 'h-4 w-4'}`} />
                          <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'}`}>
                            {item.timestamp}
                          </span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        item.impact === 'positive' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : item.impact === 'negative'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {item.category}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Financial Times - iOS optimized */}
            <div 
              className={`border rounded-lg shadow-sm overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[rgb(var(--scb-border))]'} ${
                isAppleDevice ? 'transition-all duration-150 active:scale-[0.99]' : ''
              }`}
              style={isAppleDevice ? { WebkitTapHighlightColor: 'transparent' } : undefined}
            >
              <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-[rgb(var(--scb-border))]'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-[rgb(var(--scb-muted-blue))]"></div>
                    <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} ${isMultiTasking && mode === 'slide-over' ? 'text-sm' : 'text-base'}`}>
                      Financial Times
                    </h3>
                  </div>
                  
                  {isAppleDevice && (
                    <Info 
                      className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ${isMultiTasking && mode === 'slide-over' ? 'h-3 w-3' : 'h-4 w-4'}`}
                    />
                  )}
                </div>
              </div>
              
              <ul className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-[rgb(var(--scb-border))]'}`}>
                {financialTimes.map((item, index) => (
                  <li key={index} className={`px-4 py-3 ${isAppleDevice ? 'active:bg-gray-100 dark:active:bg-gray-700' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'} ${isMultiTasking && mode === 'slide-over' ? 'text-sm' : 'text-base'} font-medium`}>
                          {item.title}
                        </p>
                        <div className="flex items-center mt-1 space-x-2">
                          <Clock className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ${isMultiTasking && mode === 'slide-over' ? 'h-3 w-3' : 'h-4 w-4'}`} />
                          <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'}`}>
                            {item.timestamp}
                          </span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        item.impact === 'positive' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : item.impact === 'negative'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {item.category}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ScbBeautifulUI>
  );
}
