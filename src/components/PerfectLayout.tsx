import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import PerfectHeader from './PerfectHeader';
import PerfectSidebar from './PerfectSidebar';
import PerfectFooter from './PerfectFooter';
import PerfectAppDiscovery from './PerfectAppDiscovery';
import { useUIPreferences } from '@/context/UIPreferencesContext';

interface PerfectLayoutProps {
  children: React.ReactNode;
  title?: string;
  context?: 'focus' | 'browse' | 'analyze';
  showNavigation?: boolean;
  showAppDiscovery?: boolean;
}

/**
 * PerfectLayout - The Ultimate Jony Ive Design Implementation
 * 
 * This layout embodies the highest principles of design:
 * 1. Inevitable - Feels like the only possible solution
 * 2. Purposeful - Every element serves a clear function
 * 3. Effortless - Cognitive load approaches zero
 * 4. Beautiful - Elegance emerges from perfect proportion
 * 5. Coherent - All elements feel unified and intentional
 */
const PerfectLayout: React.FC<PerfectLayoutProps> = ({
  children,
  title,
  context = 'browse',
  showNavigation = true,
  showAppDiscovery = false
}) => {
  const router = useRouter();
  const { isDarkMode } = useUIPreferences();
  
  const [mounted, setMounted] = useState(false);
  const [focusMode, setFocusMode] = useState(context === 'focus');
  const [isAppDiscoveryOpen, setIsAppDiscoveryOpen] = useState(showAppDiscovery);
  
  // Handle mounting
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Intelligent focus mode detection
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Cmd/Ctrl + F for focus mode
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setFocusMode(!focusMode);
      }
      
      // Cmd/Ctrl + K for app discovery
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsAppDiscoveryOpen(!isAppDiscoveryOpen);
      }
      
      // Escape to close app discovery
      if (e.key === 'Escape') {
        setIsAppDiscoveryOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [focusMode, isAppDiscoveryOpen]);
  
  // Determine layout context based on current route
  const getPageContext = () => {
    const path = router.pathname;
    
    if (path.includes('analytics') || path.includes('simulation') || path.includes('trading')) {
      return 'analyze';
    }
    
    if (path.includes('settings') || path === '/') {
      return 'browse';
    }
    
    return context;
  };
  
  const pageContext = getPageContext();
  
  // Layout classes based on context and preferences
  const layoutClasses = `
    min-h-screen transition-all duration-500 ease-out relative
    ${isDarkMode 
      ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
      : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
    }
    ${focusMode ? 'focus-mode' : ''}
  `;
  
  const contentClasses = `
    transition-all duration-300 ease-out
    ${focusMode 
      ? 'pt-20 px-8' 
      : showNavigation 
        ? 'pt-16 pl-[280px] pr-8' 
        : 'pt-16 px-8'
    }
    ${pageContext === 'analyze' ? 'pb-8' : 'pb-24 md:pb-16'}
  `;
  
  // Prevent flash of incorrect theme
  if (!mounted) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="flex items-center justify-center h-screen">
          <div className={`animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent`} />
        </div>
      </div>
    );
  }
  
  return (
    <div className={layoutClasses}>
      
      {/* Perfect Header - Always Present */}
      <PerfectHeader 
        title={title}
        context={pageContext}
        onActionNeeded={() => setIsAppDiscoveryOpen(true)}
      />
      
      {/* Perfect Sidebar - Essential Navigation */}
      {showNavigation && !focusMode && (
        <PerfectSidebar />
      )}
      
      {/* App Discovery Overlay */}
      {isAppDiscoveryOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className={`fixed inset-0 transition-opacity duration-300 ${
              isDarkMode 
                ? 'bg-gray-900/80' 
                : 'bg-gray-900/40'
            } backdrop-blur-sm`}
            onClick={() => setIsAppDiscoveryOpen(false)}
          />
          
          {/* App Discovery Content */}
          <div className="relative z-10 min-h-screen flex items-start justify-center pt-16">
            <div className={`
              w-full max-w-5xl mx-4 rounded-3xl overflow-hidden 
              ${isDarkMode 
                ? 'bg-gray-800/90 border border-gray-700/50' 
                : 'bg-white/90 border border-gray-200/50'
              }
              backdrop-blur-xl shadow-2xl transform transition-all duration-300
              animate-[fadeIn_0.3s_ease-out]
            `}>
              <PerfectAppDiscovery />
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content Area - Perfectly Proportioned */}
      <main className={contentClasses}>
        <div className={`
          max-w-7xl mx-auto transition-all duration-500 ease-out
          ${focusMode ? 'max-w-4xl' : ''}
        `}>
          
          {/* Content Container with Perfect Spacing */}
          <div className={`
            ${pageContext === 'analyze' 
              ? 'perfect-section' 
              : 'perfect-page'
            }
          `}>
            
            {/* Page Title - Contextual Display */}
            {title && !focusMode && (
              <div className="mb-8">
                <div className="flex items-center space-x-4">
                  <div className={`
                    w-1 h-12 rounded-full bg-gradient-to-b
                    ${pageContext === 'analyze' 
                      ? 'from-blue-500 to-blue-600' 
                      : pageContext === 'focus'
                        ? 'from-purple-500 to-purple-600'
                        : 'from-green-500 to-green-600'
                    }
                  `} />
                  <div>
                    <h1 className="perfect-h1">{title}</h1>
                    {pageContext !== 'browse' && (
                      <p className="perfect-caption mt-2 capitalize">
                        {pageContext} Mode
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Main Content */}
            <div className={`
              transition-all duration-500 ease-out
              ${focusMode ? 'opacity-100' : 'opacity-100'}
            `}>
              {children}
            </div>
          </div>
        </div>
      </main>
      
      {/* Perfect Footer System */}
      {!focusMode && <PerfectFooter />}
      
      {/* Subtle Focus Mode Indicator */}
      {focusMode && (
        <div className={`
          fixed bottom-8 left-8 px-4 py-2 rounded-full text-xs font-medium
          ${isDarkMode 
            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
            : 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
          }
          backdrop-blur-sm
        `}>
          Focus Mode Active
        </div>
      )}
      
      {/* Keyboard Shortcuts Hint */}
      <div className={`
        fixed bottom-8 right-8 text-xs opacity-30 transition-opacity duration-300
        hover:opacity-70 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}
      `}>
        <div>⌘F Focus • ⌘K Apps</div>
      </div>
      
      {/* Context-Aware Background Elements */}
      {pageContext === 'analyze' && !focusMode && (
        <div className="fixed top-0 right-0 w-96 h-96 pointer-events-none">
          <div className={`
            w-full h-full rounded-full blur-3xl opacity-10
            ${isDarkMode ? 'bg-blue-500' : 'bg-blue-400'}
          `} />
        </div>
      )}
      
      {/* Perfect Smooth Scroll Indicator */}
      <div className={`
        fixed right-4 top-1/2 transform -translate-y-1/2 w-1 h-16 rounded-full
        ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}
        opacity-20 transition-opacity duration-300
      `}>
        <div className={`
          w-full h-4 rounded-full bg-blue-500 transition-all duration-300
          opacity-70
        `} />
      </div>
    </div>
  );
};

export default PerfectLayout;