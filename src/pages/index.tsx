import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useMediaQuery } from 'react-responsive';
import { Info, Clock } from 'lucide-react';
import IOSOptimizedLayout from '@/components/layout/IOSOptimizedLayout';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import useMultiTasking from '@/hooks/useMultiTasking';
import { useMicroInteractions } from '@/hooks/useMicroInteractions';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import { useSFSymbolsSupport } from '@/lib/sf-symbols';
import { ICONS } from '@/components/IconSystem';

export default function Home() {
  const router = useRouter();
  const { isDarkMode } = useUIPreferences();
  const { isMultiTasking, mode, orientation } = useMultiTasking();
  const { deviceType, isAppleDevice } = useDeviceCapabilities();
  const { haptic } = useMicroInteractions();
  const isSmallScreen = useMediaQuery({ maxWidth: 640 });
  const [activeNewsCategory, setActiveNewsCategory] = useState('all');
  const [isPlatformDetected, setPlatformDetected] = useState(false);
  const { supported: sfSymbolsSupported } = useSFSymbolsSupport();
  
  // Effect to detect platform
  useEffect(() => {
    setPlatformDetected(true);
  }, []);
  
  // News categories with SF Symbols icons
  const newsCategories = [
    { id: 'all', label: 'All News', icon: 'newspaper.fill', badge: '9' },
    { id: 'markets', label: 'Markets', icon: 'chart.xyaxis.line', badge: '2' },
    { id: 'economy', label: 'Economy', icon: 'dollarsign.circle.fill', badge: '3' },
    { id: 'banking', label: 'Banking', icon: 'building.columns.fill', badge: '1' },
    { id: 'commodities', label: 'Commodities', icon: 'hammer.fill', badge: '1' },
    { id: 'esg', label: 'ESG', icon: 'leaf.fill', badge: '1' },
    { id: 'regulation', label: 'Regulation', icon: 'building.2.fill', badge: '1' }
  ];
  
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

  // Navigation bar actions for iOS layout
  const navBarActions = [
    {
      icon: 'magnifyingglass',
      label: 'Search News',
      onPress: () => {
        if (isAppleDevice) haptic({ intensity: 'light' });
        alert('Search News');
      },
    },
    {
      icon: 'bell.fill',
      label: 'Notifications',
      onPress: () => {
        if (isAppleDevice) haptic({ intensity: 'light' });
        alert('View Notifications');
      },
    },
    {
      icon: 'gearshape',
      label: 'Settings',
      onPress: () => {
        if (isAppleDevice) haptic({ intensity: 'light' });
        router.push('/settings');
      }
    }
  ];

  // Breadcrumb items for iOS navigation
  const breadcrumbItems = [
    { label: 'Home', href: '/', icon: 'house.fill' }
  ];

  // Tab items for iOS navigation
  const tabItems = [
    { key: 'home', label: 'Home', icon: 'house.fill', href: '/', badge: '5' },
    { key: 'analytics', label: 'Analytics', icon: 'chart.bar.fill', href: '/analytics' },
    { key: 'portfolio', label: 'Portfolio', icon: 'briefcase.fill', href: '/portfolio' },
    { key: 'data', label: 'Data', icon: 'folder.fill', href: '/data-products' },
    { key: 'settings', label: 'Settings', icon: 'gear', href: '/settings' },
  ];

  // Handle news item click with haptic feedback
  const handleNewsItemClick = (item) => {
    if (isAppleDevice) {
      haptic({ intensity: 'light' });
    }
    alert(`Viewing: ${item.title}`);
  };

  // Handle info button click with haptic feedback
  const handleInfoClick = (source, e) => {
    if (isAppleDevice) {
      haptic({ intensity: 'light' });
    }
    e.stopPropagation();
    alert(`${source} info`);
  };
  
  // Handle news category selection
  const handleCategorySelect = (categoryId) => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptic({ intensity: 'light' });
    }
    setActiveNewsCategory(categoryId);
    // In a real app, this would filter news items
    console.log(`Selected news category: ${categoryId}`);
  };
  
  // SF Symbols News Categories Navigation component
  const SFSymbolsNewsNavigation = () => {
    if (!isAppleDevice || !isPlatformDetected || !sfSymbolsSupported) {
      return null;
    }
    
    return (
      <div className={`rounded-lg overflow-x-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-[rgb(var(--scb-border))]'} p-1 mb-4`}>
        <div className="flex items-center overflow-x-auto hide-scrollbar pb-1">
          {newsCategories.map((category) => (
            <button 
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              className={`
                flex flex-col items-center justify-center p-2 min-w-[72px] rounded-lg transition-colors
                ${activeNewsCategory === category.id
                  ? isDarkMode 
                    ? 'bg-blue-900/30 text-blue-400' 
                    : 'bg-blue-50 text-blue-600'
                  : isDarkMode 
                    ? 'text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              <div className="relative">
                <span className="sf-symbol text-xl" role="img">{category.icon}</span>
                
                {/* Badge */}
                {category.badge && (
                  <span className={`
                    absolute -top-1 -right-1 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] 
                    flex items-center justify-center px-1
                    ${isDarkMode ? 'bg-red-600' : 'bg-red-500'}
                  `}>
                    {category.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium mt-1">{category.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };
  
  // Render news cards
  const renderNewsGrid = () => (
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
                onClick={(e) => handleInfoClick('CNBC News', e)}
              />
            )}
          </div>
        </div>
        
        <ul className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-[rgb(var(--scb-border))]'}`}>
          {cnbcNews.map((item, index) => (
            <li 
              key={index} 
              className={`px-4 py-3 ${isAppleDevice ? 'active:bg-gray-100 dark:active:bg-gray-700' : ''}`}
              onClick={() => handleNewsItemClick(item)}
            >
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
                onClick={(e) => handleInfoClick('Bloomberg Green', e)}
              />
            )}
          </div>
        </div>
        
        <ul className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-[rgb(var(--scb-border))]'}`}>
          {bloombergGreen.map((item, index) => (
            <li 
              key={index} 
              className={`px-4 py-3 ${isAppleDevice ? 'active:bg-gray-100 dark:active:bg-gray-700' : ''}`}
              onClick={() => handleNewsItemClick(item)}
            >
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
                onClick={(e) => handleInfoClick('Financial Times', e)}
              />
            )}
          </div>
        </div>
        
        <ul className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-[rgb(var(--scb-border))]'}`}>
          {financialTimes.map((item, index) => (
            <li 
              key={index} 
              className={`px-4 py-3 ${isAppleDevice ? 'active:bg-gray-100 dark:active:bg-gray-700' : ''}`}
              onClick={() => handleNewsItemClick(item)}
            >
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
  );
  
  return (
    <IOSOptimizedLayout
      title="Financial News"
      subtitle="Latest market updates and analysis"
      navBarRightActions={navBarActions}
      showBackButton={false}
      breadcrumbItems={breadcrumbItems}
      tabItems={tabItems}
      theme={isDarkMode ? 'dark' : 'light'}
      largeTitle={true}
    >
      <div className="p-2 md:p-4">
        {/* SF Symbols News Categories Navigation */}
        {isAppleDevice && isPlatformDetected && sfSymbolsSupported && (
          <SFSymbolsNewsNavigation />
        )}
        {renderNewsGrid()}
      </div>
    </IOSOptimizedLayout>
  );
}
