import React from 'react';
import { useRouter } from 'next/router';
import EnhancedPerplexitySearchBar from './EnhancedPerplexitySearchBar';
import EnhancedPerplexityNewsBar from './EnhancedPerplexityNewsBar';
import { useGlobalJouleAssistant } from './GlobalJouleAssistant';
import ModernLayout from './ModernLayout';

interface ScbBeautifulUIProps {
  children: React.ReactNode;
  showNewsBar?: boolean;
  showSearchBar?: boolean;
  pageTitle?: string;
}

/**
 * SCB Beautiful UI Component
 * 
 * This component provides a consistent SCB-styled UI experience
 * wrapping various enhanced components with proper styling.
 */
const ScbBeautifulUI: React.FC<ScbBeautifulUIProps> = ({
  children,
  showNewsBar = false,
  showSearchBar = true,
  pageTitle
}) => {
  const router = useRouter();
  const joule = useGlobalJouleAssistant();

  const handleAnalyzeNews = (newsItem: any) => {
    joule.analyzeNews(newsItem);
  };

  return (
    <ModernLayout>
      <div className="flex flex-col w-full">
        {/* Page header with search bar */}
        {showSearchBar && (
          <div className="mb-6 flex flex-col items-center gap-4">
            {pageTitle && (
              <h1 className="scb-title text-2xl font-bold text-[rgb(var(--scb-honolulu-blue))] self-start">
                {pageTitle}
              </h1>
            )}
            <EnhancedPerplexitySearchBar />
          </div>
        )}

        {/* Main content */}
        <div className="flex flex-1 gap-6">
          {/* Left content area */}
          <div className={`flex-1 ${showNewsBar ? 'md:mr-80' : ''}`}>
            {children}
          </div>

          {/* News sidebar (if enabled) */}
          {showNewsBar && (
            <div className="hidden md:block fixed top-16 bottom-0 right-0 w-80 border-l border-[rgb(var(--scb-border))]">
              <EnhancedPerplexityNewsBar onAnalyzeNews={handleAnalyzeNews} />
            </div>
          )}
        </div>
      </div>
    </ModernLayout>
  );
};

export default ScbBeautifulUI;