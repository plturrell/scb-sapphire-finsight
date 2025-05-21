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
import { haptics } from '@/lib/haptics';
import { UserRole } from '@/types';
import { useMediaQuery } from 'react-responsive';
import { ArrowUp, ArrowDown, TrendingUp, AlertTriangle, Zap, Clock, Download, Share2, Check, RefreshCw } from 'lucide-react';
import EnhancedIOSNavBar from '@/components/EnhancedIOSNavBar';
import EnhancedIOSTabBar from '@/components/EnhancedIOSTabBar';
import EnhancedIOSBreadcrumb from '@/components/EnhancedIOSBreadcrumb';
import { IconSystemProvider } from '@/components/IconSystem';
import { ICONS } from '@/components/IconSystem';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

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
