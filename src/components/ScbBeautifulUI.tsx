import React, { useState, useEffect, useCallback } from 'react';
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
import { LayoutDashboard, FileText, Settings, AlertCircle, Book, Icons } from './IconExports';

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
  
  // Handle tab change with haptic feedback
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    
    // Add haptic feedback for iOS devices if enabled
    if (isIOS && preferences.enableHaptics) {
      haptics.selection();
    }
    
    // Navigate based on tab
    switch (tabId) {
      case 'dashboard':
        router.push('/');
        break;
      case 'analytics':
        router.push('/analytics');
        break;
      case 'reports':
        router.push('/reports');
        break;
      case 'settings':
        router.push('/settings');
        break;
      default:
        router.push('/');
    }
  }, [isIOS, preferences.enableHaptics, router]);

  // Define iOS-style tabs
  const tabItems = [
    { key: 'dashboard', id: 'dashboard', label: 'Dashboard', icon: 'house.fill', href: '/' },
    { key: 'analytics', id: 'analytics', label: 'Analytics', icon: 'chart.pie.fill', href: '/analytics' },
    { key: 'reports', id: 'reports', label: 'Reports', icon: 'doc.text.fill', href: '/reports' },
    { key: 'settings', id: 'settings', label: 'Settings', icon: 'gear', href: '/settings' }
  ];
  
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
  ), [showTabs, isIOS, activeTab, handleTabChange, preferences.showLabels, preferences.enableHaptics, isDarkMode]);

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
        {/* Page header with search bar */}
        {showSearchBar && (
          <div className={`
            mb-6 flex flex-col items-center gap-4
            ${isMultiTasking && mode === 'slide-over' ? 'mb-4 gap-2' : ''}
            ${getAnimationClass('animate-fadeIn')}
          `}>
            {pageTitle && (
              <h1 className={`
                scb-title font-bold self-start
                ${isDarkMode ? 'text-white' : 'text-[rgb(var(--scb-honolulu-blue))]'}
                ${isMultiTasking && mode === 'slide-over' ? 'text-xl' : 'text-2xl'}
              `}>
                {pageTitle}
              </h1>
            )}
            <EnhancedPerplexitySearchBar />
          </div>
        )}

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