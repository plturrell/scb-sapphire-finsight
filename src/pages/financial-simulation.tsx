import React, { useState, useEffect, useRef } from 'react';
// Ensure React is in scope for JSX
import Head from 'next/head';
import { useRouter } from 'next/router';
import reportService from '@/lib/report-service';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';
import EnhancedDynamicSankeySimulation from '@/components/charts/EnhancedDynamicSankeySimulation';
import KPICard from '@/components/cards/KPICard';
import EnhancedLoadingSpinner from '@/components/EnhancedLoadingSpinner';
import EnhancedTouchButton from '@/components/EnhancedTouchButton';
import useMultiTasking from '@/hooks/useMultiTasking';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import { haptics } from '@/lib/haptics';
import { UserRole } from '@/types';
import { useMediaQuery } from 'react-responsive';
import { ArrowUp, ArrowDown, TrendingUp, AlertTriangle, Clock, Download, Share2, Check, RefreshCw } from 'lucide-react';
import { Icons } from '@/components/IconExports';
import EnhancedIOSNavBar from '@/components/EnhancedIOSNavBar';
import EnhancedIOSTabBar from '@/components/EnhancedIOSTabBar';
import EnhancedIOSBreadcrumb from '@/components/EnhancedIOSBreadcrumb';
import { IconSystemProvider } from '@/components/IconSystem';
import { ICONS } from '@/components/IconSystem';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { useSFSymbolsSupport } from '@/lib/sf-symbols';
import SFSymbol from '@/components/SFSymbol';

// Simulation page with full MCTS integration for SCB Sapphire FinSight
export default function FinancialSimulation() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('investor');
  const [simulationData, setSimulationData] = useState<any>(null);
  const [summaryMetrics, setSummaryMetrics] = useState<any>({
    expectedReturn: 0,
    volatility: 0,
    sharpeRatio: 0,
    successRate: 0,
    timeHorizon: 10,
    confidenceInterval: 95
  });
  
  // SF Symbols support and platform detection
  const { supported: sfSymbolsSupported } = useSFSymbolsSupport();
  const { isAppleDevice } = useDeviceCapabilities();
  const [activeSimulationMode, setActiveSimulationMode] = useState<string>('montecarlo');
  
  // Simulation categories with SF Symbols icons
  const simulationCategories = [
    { id: 'montecarlo', label: 'Monte Carlo', icon: 'chart.bar', badge: null },
    { id: 'scenario', label: 'Scenario Analysis', icon: 'chart.line.uptrend.xyaxis', badge: null },
    { id: 'stress', label: 'Stress Test', icon: 'waveform.path.ecg', badge: null },
    { id: 'optimization', label: 'Portfolio Optimization', icon: 'checkmark.seal.fill', badge: null },
    { id: 'backtesting', label: 'Backtesting', icon: 'clock.arrow.circlepath', badge: null }
  ];
  
  // All the rest of your component code here...
  
  // Handle tab change
  const handleTabChange = (key: string) => {
    const selectedTab = tabItems.find(item => item.key === key);
    if (selectedTab && selectedTab.href) {
      router.push(selectedTab.href);
    }
  };
  
  // Navigate to detailed analysis page with simulation data
  const viewDetailedAnalysis = () => {
    if (isAppleDevice) {
      haptics.medium();
    }
    
    // Real functionality - navigate to detailed analysis page with query parameters
    router.push({
      pathname: '/financial-simulation/detailed-analysis',
      query: { 
        role: userRole,
        expectedReturn: summaryMetrics.expectedReturn,
        riskScore: summaryMetrics.volatility,
        confidenceLower: summaryMetrics.confidenceInterval[0],
        confidenceUpper: summaryMetrics.confidenceInterval[1],
        simulationId: simulationData?.aiInsights?.updatedAt?.toISOString() || new Date().toISOString()
      }
    });
  };
  
  // Handle simulation category selection
  const handleSimulationModeChange = (modeId: string) => {
    if (isAppleDevice) {
      haptics.light();
    }
    
    setActiveSimulationMode(modeId);
    
    // In a real implementation, this would load the appropriate simulation mode data
    console.log(`Switching to simulation mode: ${modeId}`);
  };
  
  // SF Symbols Simulation Categories Navigation Component
  const SFSymbolsSimulationNavigation = () => {
    if (!isAppleDevice || !isPlatformDetected || !sfSymbolsSupported) {
      return null;
    }
    
    return (
      <div className={`mb-6 -mx-4 px-4 overflow-x-auto ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDark ? 'border-gray-700' : 'border-[rgb(var(--scb-border))]'} py-2`}>
        <div className="flex space-x-4 items-center">
          {simulationCategories.map((category) => (
            <div 
              key={category.id}
              onClick={() => handleSimulationModeChange(category.id)}
              className={`flex flex-col items-center p-2 rounded-xl cursor-pointer transition-colors ${
                activeSimulationMode === category.id
                ? isDark 
                  ? 'bg-blue-900/30' 
                  : 'bg-blue-50'
                : isDark 
                  ? 'hover:bg-gray-700' 
                  : 'hover:bg-gray-100'
              }`}
              style={{ minWidth: isMultiTasking && mode === 'slide-over' ? '70px' : '80px' }}
            >
              <div className={`relative flex items-center justify-center ${
                isMultiTasking && mode === 'slide-over' ? 'w-10 h-10' : 'w-12 h-12'
              } rounded-full mb-1 ${
                activeSimulationMode === category.id
                ? 'bg-[rgb(var(--scb-honolulu-blue))]'
                : isDark 
                  ? 'bg-gray-700' 
                  : 'bg-gray-200'
              }`}>
                <SFSymbol 
                  name={category.icon} 
                  size={isMultiTasking && mode === 'slide-over' ? 22 : 26}
                  color={activeSimulationMode === category.id ? 'white' : undefined}
                />
                
                {/* Badge indicator */}
                {category.badge && (
                  <div className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center rounded-full bg-[rgb(var(--scb-notification))] text-white text-xs px-1">
                    {category.badge}
                  </div>
                )}
              </div>
              <span className={`text-center ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} ${
                activeSimulationMode === category.id
                ? 'text-[rgb(var(--scb-honolulu-blue))] font-medium'
                : isDark 
                  ? 'text-gray-300' 
                  : 'text-gray-600'
              }`}>
                {category.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <Head>
        <title>Financial Simulation | SCB Sapphire</title>
        <meta name="description" content="Monte Carlo financial simulation and analysis for optimized investment strategies" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <ScbBeautifulUI showSearchBar={false} showTabs={false} pageTitle="Financial Simulation">
        <IconSystemProvider>
          {isAppleDevice && isPlatformDetected ? (
            <div className={`min-h-screen ${isSmallScreen ? 'pb-20' : 'pb-16'} ${isPlatformDetected ? (isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900') : ''}`}>
              {/* iOS Navigation Bar - Adapted for iPad multi-tasking */}
              <EnhancedIOSNavBar 
                title="Financial Simulation"
                subtitle={isMultiTasking && mode === 'slide-over' ? null : "Monte Carlo Analysis"}
                largeTitle={!isMultiTasking || mode !== 'slide-over'}
                blurred={true}
                showBackButton={true}
                onBackButtonPress={() => router.push('/dashboard')}
                actions={
                  isGeneratingReport ? [
                    {
                      icon: 'arrow.down.doc.fill',
                      label: null,
                      onPress: async () => {},
                      disabled: true,
                      variant: 'primary',
                      size: 'md',
                      loading: true
                    }
                  ] : [
                    {
                      icon: 'arrow.down.doc.fill',
                      label: 'Export',
                      onPress: generateReport,
                      disabled: false,
                      variant: 'primary',
                      loading: false
                    },
                    {
                      icon: 'square.and.arrow.up',
                      label: 'Share',
                      onPress: shareResults,
                      disabled: false,
                      variant: 'success',
                      loading: false
                    }
                  ]
                }
              />
              
              {/* Main content */}
              <div className="px-4 pt-4 pb-20">
                {/* SF Symbols Simulation Categories Navigation */}
                {isAppleDevice && isPlatformDetected && sfSymbolsSupported && (
                  <SFSymbolsSimulationNavigation />
                )}
                
                {/* All your main content here */}
              </div>
              
              {/* iOS-specific bottom safe area spacer for notched devices */}
              {isAppleDevice && (
                <div className="h-6 sm:h-4 md:h-2"></div>
              )}
            </div>
          ) : (
            <div className="min-h-screen pb-16">
              {/* Non-iOS content here */}
            </div>
          )}
        </IconSystemProvider>
      </ScbBeautifulUI>
    </div>
  );
}
