import React, { useState } from 'react';
import Head from 'next/head';
import EnhancedIPadMultiTaskingDashboard from '../components/EnhancedIPadMultiTaskingDashboard';
import useMultiTasking from '../hooks/useMultiTasking';
import useSafeArea from '../hooks/useSafeArea';

/**
 * Demo page showcasing iPad multi-tasking optimizations
 * This page demonstrates the enhanced UI components for Split View, Slide Over, and Stage Manager
 */
const IPadMultiTaskingPage: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<string>('');
  const { mode, sizeClass, isMultiTasking } = useMultiTasking();
  const { safeArea } = useSafeArea();
  
  // Handle mode change
  const handleModeChange = (newMode: string) => {
    setCurrentMode(newMode);
  };
  
  return (
    <>
      <Head>
        <title>iPad Multi-tasking Dashboard | SCB FinSight</title>
        <meta name="description" content="iPad-optimized dashboard with multi-tasking support" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1c1c1e" media="(prefers-color-scheme: dark)" />
      </Head>
      
      <div 
        className="h-screen w-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white"
        style={{
          // Apply safe area insets
          paddingTop: `env(safe-area-inset-top, ${safeArea.top}px)`,
          paddingRight: `env(safe-area-inset-right, ${safeArea.right}px)`,
          paddingBottom: `env(safe-area-inset-bottom, ${safeArea.bottom}px)`,
          paddingLeft: `env(safe-area-inset-left, ${safeArea.left}px)`,
        }}
      >
        {/* Instructions visible only in desktop mode */}
        {!isMultiTasking && sizeClass === 'expanded' && (
          <div className="fixed top-4 right-4 max-w-xs bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 z-50 text-sm">
            <h3 className="font-medium mb-2">iPad Multi-tasking Demo</h3>
            <p className="mb-2">
              This demo is optimized for iPad multi-tasking modes:
            </p>
            <ul className="list-disc pl-5 mb-3 space-y-1">
              <li>Split View</li>
              <li>Slide Over</li>
              <li>Stage Manager</li>
              <li>Fullscreen</li>
            </ul>
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              Current mode: <strong>{mode}</strong><br />
              Size class: <strong>{sizeClass}</strong>
            </p>
          </div>
        )}
        
        {/* Main dashboard component */}
        <EnhancedIPadMultiTaskingDashboard 
          initialMode="analytics"
          onModeChange={handleModeChange}
        />
      </div>
    </>
  );
};

export default IPadMultiTaskingPage;