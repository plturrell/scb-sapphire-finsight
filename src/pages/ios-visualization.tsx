import React from 'react';
import Head from 'next/head';
import EnhancedIosVisualizationDashboard from '../components/EnhancedIosVisualizationDashboard';
import useSafeArea from '../hooks/useSafeArea';

/**
 * Demo page showcasing iOS-optimized data visualizations
 * This page demonstrates enhanced mobile chart components following Apple's design guidelines
 */
const IOSVisualizationPage: React.FC = () => {
  const { safeArea } = useSafeArea();
  
  return (
    <>
      <Head>
        <title>iOS-Optimized Visualizations | SCB FinSight</title>
        <meta name="description" content="iOS-optimized data visualizations for mobile" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1c1c1e" media="(prefers-color-scheme: dark)" />
      </Head>
      
      <div 
        className="h-screen w-screen overflow-hidden bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white"
        style={{
          // Apply safe area insets
          paddingTop: `env(safe-area-inset-top, ${safeArea.top}px)`,
          paddingRight: `env(safe-area-inset-right, ${safeArea.right}px)`,
          paddingLeft: `env(safe-area-inset-left, ${safeArea.left}px)`,
        }}
      >
        {/* Main iOS visualization dashboard */}
        <EnhancedIosVisualizationDashboard />
      </div>
    </>
  );
};

export default IOSVisualizationPage;