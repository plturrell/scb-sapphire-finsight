import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ModernLayout from '../ModernLayout';
import MultiTaskingLayout from './MultiTaskingLayout';
import useMultiTasking from '../../hooks/useMultiTasking';
import useSafeArea from '../../hooks/useSafeArea';
import { haptics } from '../../lib/haptics';

interface ResponsiveAppLayoutProps {
  children: React.ReactNode;
  showNewsBar?: boolean;
  showSearchBar?: boolean;
  pageTitle?: string;
  toolbarItems?: React.ReactNode;
  compactNavigation?: React.ReactNode;
  expandedNavigation?: React.ReactNode;
  floatingActionButton?: React.ReactNode;
  onModeChange?: (mode: string) => void;
}

/**
 * Responsive app layout that detects the platform and provides the appropriate layout
 * Automatically uses MultiTaskingLayout for iPad and ModernLayout for other devices
 */
const ResponsiveAppLayout: React.FC<ResponsiveAppLayoutProps> = ({
  children,
  showNewsBar = false,
  showSearchBar = true,
  pageTitle,
  toolbarItems,
  compactNavigation,
  expandedNavigation,
  floatingActionButton,
  onModeChange
}) => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isPlatformDetected, setPlatformDetected] = useState(false);
  const [isIPad, setIsIPad] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const { mode, sizeClass, isMultiTasking } = useMultiTasking();
  const { safeArea } = useSafeArea();

  // Detect the platform on the client side
  useEffect(() => {
    setIsMounted(true);
    
    // Detect iPad
    const isIpad = /iPad/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && 
      navigator.maxTouchPoints > 1 &&
      !navigator.userAgent.includes('iPhone'));
    
    // Detect iOS (including iPad)
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    setIsIPad(isIpad);
    setIsIOS(isIOS);
    setPlatformDetected(true);
    
    // Provide haptic feedback when layout is first mounted
    if (isIOS) {
      haptics.light();
    }
  }, []);
  
  // Handle multi-tasking mode changes
  useEffect(() => {
    if (isIPad && onModeChange && isMounted) {
      onModeChange(mode);
    }
  }, [mode, isIPad, onModeChange, isMounted]);

  // Show fallback during SSR or before detection
  if (!isMounted || !isPlatformDetected) {
    return (
      <ModernLayout>
        <div className="w-full">
          {pageTitle && (
            <h1 className="text-2xl font-bold mb-6">
              {pageTitle}
            </h1>
          )}
          {children}
        </div>
      </ModernLayout>
    );
  }

  // Use iPad multi-tasking optimized layout
  if (isIPad) {
    return (
      <MultiTaskingLayout
        adaptiveSpacing={true}
        preserveToolbars={true}
        optimizeForSlideOver={true}
        stageManagerOptimized={true}
        compactNavigation={compactNavigation}
        expandedNavigation={expandedNavigation}
        toolbarItems={
          toolbarItems || (
            <div className="flex justify-between items-center w-full">
              <h1 className={`
                font-medium text-gray-900 dark:text-white
                ${isMultiTasking && mode === 'slide-over' ? 'text-sm' : 'text-base'}
              `}>
                {pageTitle || router.pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
              </h1>
              {isMultiTasking && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {mode}
                </span>
              )}
            </div>
          )
        }
        floatingActionButton={floatingActionButton}
        onModeChange={onModeChange}
      >
        <div className={`
          ${isMultiTasking && mode === 'slide-over' ? 'px-2 py-2' : 'px-4 py-4'}
        `}>
          {children}
        </div>
      </MultiTaskingLayout>
    );
  }

  // Use standard layout for non-iPad devices
  return (
    <ModernLayout>
      <div className="w-full">
        {pageTitle && (
          <h1 className="text-2xl font-bold mb-6">
            {pageTitle}
          </h1>
        )}
        {children}
      </div>
    </ModernLayout>
  );
};

export default ResponsiveAppLayout;