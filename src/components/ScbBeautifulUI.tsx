import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import EnhancedPerplexitySearchBar from './EnhancedPerplexitySearchBar';
import EnhancedPerplexityNewsBar from './EnhancedPerplexityNewsBar';
import { useGlobalJouleAssistant } from './GlobalJouleAssistant';
import ResponsiveAppLayout from './layout/ResponsiveAppLayout';
import EnhancedIOSTabBar from './EnhancedIOSTabBar';
import useMultiTasking from '../hooks/useMultiTasking';
import useSafeArea from '../hooks/useSafeArea';
import { haptics } from '../lib/haptics';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { LayoutDashboard, FileText, Settings, AlertCircle, Book, Zap, Bell, Icons } from './IconExports';

interface ScbBeautifulUIProps {
  children: React.ReactNode;
  showNewsBar?: boolean;
  showSearchBar?: boolean;
  pageTitle?: string;
  showTabs?: boolean;
}

/**
 * SCB Beautiful UI Component
 * 
 * This component provides a consistent SCB-styled UI experience
 * with platform-specific optimizations for iOS, iPadOS, and macOS
 */
const ScbBeautifulUI: React.FC<ScbBeautifulUIProps> = ({
  children,
  showNewsBar: propShowNewsBar = false,
  showSearchBar: propShowSearchBar = true,
  pageTitle,
  showTabs: propShowTabs = false
}) => {
  const router = useRouter();
  const joule = useGlobalJouleAssistant();
  const { mode, isMultiTasking } = useMultiTasking();
  const { safeArea } = useSafeArea();
  const { preferences, isDarkMode } = useUIPreferences();
  const [isMounted, setIsMounted] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Use UI preferences with prop fallbacks
  const showNewsBar = preferences.enableNewsBar && propShowNewsBar;
  const showSearchBar = preferences.enableSearchBar && propShowSearchBar;
  const showTabs = propShowTabs;
  const showJoule = preferences.enableJouleAssistant;

  // Detect platform on mount
  useEffect(() => {
    setIsMounted(true);
    
    // Detect iOS
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    setIsIOS(isIOS);
  }, []);

  const handleAnalyzeNews = useCallback((newsItem: any) => {
    // Only engage Joule if assistant is enabled
    if (showJoule) {
      joule.analyzeNews(newsItem);
    }
    
    // Add haptic feedback for iOS devices if enabled
    if (isIOS && preferences.enableHaptics) {
      haptics.selection();
    }
  }, [isIOS, joule, preferences.enableHaptics, showJoule]);
  
  // Define iOS-style tabs with useMemo to prevent dependency changes
  const tabItems = useMemo(() => [
    { key: 'dashboard', id: 'dashboard', label: 'Dashboard', icon: 'house.fill', href: '/' },
    { key: 'analytics', id: 'analytics', label: 'Analytics', icon: 'chart.pie.fill', href: '/analytics' },
    { key: 'reports', id: 'reports', label: 'Reports', icon: 'doc.text.fill', href: '/reports' },
    { key: 'settings', id: 'settings', label: 'Settings', icon: 'gear', href: '/settings' }
  ], []);

  // Handle tab change with haptic feedback
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    
    // Add haptic feedback for iOS devices if enabled
    if (isIOS && preferences.enableHaptics) {
      haptics.selection();
    }
    
    // Find the matching tab item and navigate to its href
    const tabItem = tabItems.find(item => item.id === tabId);
    if (tabItem && tabItem.href) {
      router.push(tabItem.href);
    }
  }, [isIOS, preferences.enableHaptics, router, tabItems]);
  
  // Helper functions for layout classes based on preferences
  const getFontSizeClass = useCallback(() => {
    switch (preferences.fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      default: return 'text-base';
    }
  }, [preferences.fontSize]);
  
  // Get animation classes based on preferences
  const getAnimationClass = useCallback((animationName: string) => {
    return preferences.enableAnimations ? animationName : '';
  }, [preferences.enableAnimations]);
  
  // Use iOS-specific tab bar as the compact navigation
  const CompactNavigation = useCallback(() => (
    showTabs && isIOS ? (
      <EnhancedIOSTabBar
        items={tabItems}
        currentTab={activeTab}
        onChange={handleTabChange}
        respectSafeArea={true}
        floating={false}
        showLabels={preferences.showLabels} 
        hapticFeedback={preferences.enableHaptics}
        className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
      />
    ) : null
  ), [showTabs, isIOS, activeTab, handleTabChange, preferences.showLabels, preferences.enableHaptics, isDarkMode, tabItems]);

  return (
    <ResponsiveAppLayout
      showNewsBar={showNewsBar}
      pageTitle={pageTitle}
      compactNavigation={<CompactNavigation />}
      onModeChange={(newMode) => {
        // Handle mode changes if needed
      }}
    >
      <div className={`flex flex-col w-full ${getFontSizeClass()}`}>
        {/* Enhanced Page Header with Search Bar */}
        <header 
          className={`
            sticky top-0 z-10 transition-all duration-300
            ${showSearchBar ? 'pt-4 pb-2' : 'py-2'}
            ${isDarkMode ? 'bg-gray-900' : 'bg-white'}
            ${getAnimationClass('animate-fadeIn')}
            ${isMultiTasking && mode === 'slide-over' ? 'px-2' : 'px-4 md:px-6'}
            ${!showSearchBar && 'border-b border-opacity-10 ' + (isDarkMode ? 'border-gray-700' : 'border-gray-200')}
          `}
        >
          <div className={`
            flex flex-col gap-3 w-full
            ${isMultiTasking && mode === 'slide-over' ? 'max-w-full' : 'max-w-7xl mx-auto'}
          `}>
            {/* Title Row */}
            <div className="flex items-center justify-between w-full">
              {pageTitle && (
                <h1 className={`
                  scb-title font-bold leading-tight
                  ${isDarkMode ? 'text-white' : 'text-[rgb(var(--scb-honolulu-blue))]'}
                  ${isMultiTasking && mode === 'slide-over' ? 'text-xl' : 'text-2xl md:text-3xl'}
                  transition-all duration-200
                `}>
                  {pageTitle}
                </h1>
              )}
              
              {/* Header Actions */}
              <div className="flex items-center gap-2">
                {showJoule && (
                  <button 
                    onClick={() => joule.toggle()}
                    className={`
                      p-2 rounded-full transition-colors
                      ${isDarkMode 
                        ? 'hover:bg-gray-800 text-blue-400' 
                        : 'hover:bg-blue-50 text-blue-600'}
                    `}
                    aria-label="Open Joule Assistant"
                  >
                    <Zap className="w-5 h-5" />
                  </button>
                )}
                
                <button 
                  className={`
                    p-2 rounded-full transition-colors
                    ${isDarkMode 
                      ? 'hover:bg-gray-800 text-gray-300' 
                      : 'hover:bg-gray-100 text-gray-600'}
                  `}
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Search Bar */}
            {showSearchBar && (
              <div className={`
                transition-all duration-300
                ${isMultiTasking && mode === 'slide-over' ? 'w-full' : 'w-full md:w-2/3'}
              `}>
                <EnhancedPerplexitySearchBar />
              </div>
            )}
          </div>
        </header>

        {/* Main content */}
        <div className={`flex flex-1 gap-6 ${getAnimationClass('animate-fadeIn')}`}>
          {/* Left content area */}
          <div className={`flex-1 ${showNewsBar && !isMultiTasking ? 'md:mr-80' : ''}`}>
            {children}
          </div>

          {/* News sidebar (if enabled) - hide in slide-over mode */}
          {showNewsBar && (!isMultiTasking || mode !== 'slide-over') && (
            <div className={`
              hidden md:block fixed top-16 bottom-0 right-0 
              ${isDarkMode ? 'border-gray-700' : 'border-[rgb(var(--scb-border))]'} border-l
              ${isMultiTasking ? 'w-64' : 'w-80'}
              ${getAnimationClass('animate-slide-in')}
            `} style={{
              paddingBottom: safeArea.bottom > 0 ? `${safeArea.bottom}px` : 0
            }}>
              <EnhancedPerplexityNewsBar 
                onAnalyzeNews={handleAnalyzeNews}
                enableHaptics={preferences.enableHaptics}
              />
            </div>
          )}
        </div>
      </div>
    </ResponsiveAppLayout>
  );
};

export default ScbBeautifulUI;