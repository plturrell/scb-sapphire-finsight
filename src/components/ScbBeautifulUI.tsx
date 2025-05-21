import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import EnhancedPerplexitySearchBar from './EnhancedPerplexitySearchBar';
import EnhancedPerplexityNewsBar from './EnhancedPerplexityNewsBar';
import { useGlobalJouleAssistant } from './GlobalJouleAssistant';
import ResponsiveAppLayout from './layout/ResponsiveAppLayout';
import EnhancedIOSTabBar from './EnhancedIOSTabBar';
import useMultiTasking from '../hooks/useMultiTasking';
import useSafeArea from '../hooks/useSafeArea';
import { haptics } from '../lib/haptics';

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
  showNewsBar = false,
  showSearchBar = true,
  pageTitle,
  showTabs = false
}) => {
  const router = useRouter();
  const joule = useGlobalJouleAssistant();
  const { mode, isMultiTasking } = useMultiTasking();
  const { safeArea } = useSafeArea();
  const [isMounted, setIsMounted] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Detect platform on mount
  useEffect(() => {
    setIsMounted(true);
    
    // Detect iOS
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    setIsIOS(isIOS);
  }, []);

  const handleAnalyzeNews = (newsItem: any) => {
    joule.analyzeNews(newsItem);
    
    // Add haptic feedback for iOS devices
    if (isIOS) {
      haptics.selection();
    }
  };
  
  // Handle tab change with haptic feedback
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    
    if (isIOS) {
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
  };

  // Define iOS-style tabs
  const tabItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'house.fill' },
    { id: 'analytics', label: 'Analytics', icon: 'chart.pie.fill' },
    { id: 'reports', label: 'Reports', icon: 'doc.text.fill' },
    { id: 'settings', label: 'Settings', icon: 'gear' }
  ];
  
  // Use iOS-specific tab bar as the compact navigation
  const CompactNavigation = () => (
    showTabs && isIOS ? (
      <EnhancedIOSTabBar
        items={tabItems}
        activeItemId={activeTab}
        onChange={handleTabChange}
        respectSafeArea={true}
        floating={false}
        className="border-t border-gray-200 dark:border-gray-700"
      />
    ) : null
  );

  return (
    <ResponsiveAppLayout
      showNewsBar={showNewsBar}
      pageTitle={pageTitle}
      compactNavigation={<CompactNavigation />}
      onModeChange={(newMode) => {
        // Handle mode changes if needed
      }}
    >
      <div className="flex flex-col w-full">
        {/* Page header with search bar */}
        {showSearchBar && (
          <div className={`
            mb-6 flex flex-col items-center gap-4
            ${isMultiTasking && mode === 'slide-over' ? 'mb-4 gap-2' : ''}
          `}>
            {pageTitle && (
              <h1 className={`
                scb-title font-bold text-[rgb(var(--scb-honolulu-blue))] self-start
                ${isMultiTasking && mode === 'slide-over' ? 'text-xl' : 'text-2xl'}
              `}>
                {pageTitle}
              </h1>
            )}
            <EnhancedPerplexitySearchBar />
          </div>
        )}

        {/* Main content */}
        <div className="flex flex-1 gap-6">
          {/* Left content area */}
          <div className={`flex-1 ${showNewsBar && !isMultiTasking ? 'md:mr-80' : ''}`}>
            {children}
          </div>

          {/* News sidebar (if enabled) - hide in slide-over mode */}
          {showNewsBar && (!isMultiTasking || mode !== 'slide-over') && (
            <div className={`
              hidden md:block fixed top-16 bottom-0 right-0 border-l border-[rgb(var(--scb-border))]
              ${isMultiTasking ? 'w-64' : 'w-80'}
            `} style={{
              paddingBottom: safeArea.bottom > 0 ? `${safeArea.bottom}px` : 0
            }}>
              <EnhancedPerplexityNewsBar onAnalyzeNews={handleAnalyzeNews} />
            </div>
          )}
        </div>
      </div>
    </ResponsiveAppLayout>
  );
};

export default ScbBeautifulUI;