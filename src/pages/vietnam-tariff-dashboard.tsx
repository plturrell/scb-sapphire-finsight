import React, { useState, useEffect } from 'react';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';
import EnhancedVietnamTariffDashboard from '@/components/EnhancedVietnamTariffDashboard';
import BusinessDataCloudDashboard from '@/components/BusinessDataCloudDashboard.enhanced';
import EnhancedTouchButton from '@/components/EnhancedTouchButton';
import useMultiTasking from '@/hooks/useMultiTasking';
import { haptics } from '@/lib/haptics';
import { useMediaQuery } from 'react-responsive';
import { Link, Globe, Database, ArrowRight, Download, Share2 } from 'lucide-react';

/**
 * Vietnam Tariff Dashboard Page
 * Comprehensive analysis of Vietnam tariff data with AI-enhanced insights and Monte Carlo simulations
 * Integrates with Business Data Cloud for enhanced analytics
 */
const VietnamTariffDashboardPage: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [isPlatformDetected, setPlatformDetected] = useState(false);
  const [isAppleDevice, setIsAppleDevice] = useState(false);
  const [isIPad, setIsIPad] = useState(false);
  
  const isSmallScreen = useMediaQuery({ maxWidth: 768 });
  const { mode, isMultiTasking, orientation } = useMultiTasking();
  
  // Detect platform on mount
  useEffect(() => {
    setIsMounted(true);
    
    // Check if we're on an Apple platform
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // Check if we're on iPad specifically
    const isIpad = /iPad/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && 
       navigator.maxTouchPoints > 1 &&
       !navigator.userAgent.includes('iPhone'));
    
    setIsAppleDevice(isIOS);
    setIsIPad(isIpad);
    setPlatformDetected(true);
  }, []);

  // Handle action button click with haptic feedback
  const handleActionButtonClick = (path: string) => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptics.medium();
    }
    
    // In a real application, we would use router.push(path)
    window.location.href = path;
  };

  // Handle share action with haptic feedback
  const handleShareClick = () => {
    if (isAppleDevice) {
      haptics.medium();
    }
    
    // In a real application, this would open a share dialog
    alert('Opening share dialog...');
  };

  // Handle download action with haptic feedback
  const handleDownloadClick = () => {
    if (isAppleDevice) {
      haptics.medium();
    }
    
    // In a real application, this would trigger a download
    alert('Downloading dashboard as PDF...');
  };

  return (
    <ScbBeautifulUI 
      showNewsBar={!isSmallScreen && !isMultiTasking} 
      pageTitle="Vietnam Tariff Analysis" 
      showTabs={isAppleDevice}
    >
      <div className={`${isMultiTasking && mode === 'slide-over' ? 'px-3 py-2' : 'px-6 py-4'} max-w-6xl mx-auto`}>
        <div className="mb-6">
          <div className="flex items-center">
            <Globe className="mr-3 text-[rgb(var(--scb-primary))]" size={isMultiTasking && mode === 'slide-over' ? 20 : 28} />
            <h1 className="text-2xl font-semibold text-[rgb(var(--scb-primary))]">Vietnam Tariff Analysis Dashboard</h1>
          </div>
          <p className="text-gray-600 mt-2 max-w-[800px]">
            Comprehensive analysis of Vietnam's tariff policies and trade impacts with AI-enhanced predictions.
            Leveraging Monte Carlo simulations to model potential scenarios and impacts across sectors.
          </p>
          
          {/* Platform-specific action buttons for Apple devices */}
          {isAppleDevice && (
            <div className={`mt-4 flex ${isMultiTasking && mode === 'slide-over' ? 'gap-2' : 'gap-3'} ${isMultiTasking && mode === 'slide-over' ? '' : 'justify-end'}`}>
              <EnhancedTouchButton
                onClick={handleDownloadClick}
                variant="secondary"
                className="flex items-center gap-1"
                size={isMultiTasking && mode === 'slide-over' ? 'sm' : 'default'}
              >
                <Download className={`${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                <span>Download</span>
              </EnhancedTouchButton>
              
              <EnhancedTouchButton
                onClick={handleShareClick}
                variant="secondary"
                className="flex items-center gap-1"
                size={isMultiTasking && mode === 'slide-over' ? 'sm' : 'default'}
              >
                <Share2 className={`${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                <span>Share</span>
              </EnhancedTouchButton>
            </div>
          )}
          
          <div className="border-b border-gray-200 my-4"></div>
        </div>

        {/* Main Dashboard Content */}
        <div className="space-y-8">
          <div>
            <EnhancedVietnamTariffDashboard 
              isAppleDevice={isAppleDevice} 
              isIPad={isIPad} 
              isMultiTasking={isMultiTasking} 
              multiTaskingMode={mode}
              orientation={orientation}
            />
          </div>
          
          <div className={`bg-white p-4 border border-[hsl(var(--border))] rounded-lg ${isMultiTasking && mode === 'slide-over' ? 'p-3' : 'p-4'}`}>
            <div className="flex items-center mb-2">
              <Database className={`mr-2 text-[rgb(var(--scb-accent))]`} size={isMultiTasking && mode === 'slide-over' ? 16 : 20} />
              <h2 className={`${isMultiTasking && mode === 'slide-over' ? 'text-base' : 'text-lg'} font-medium`}>
                Business Data Cloud Integration
              </h2>
            </div>
            <p className={`${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} text-gray-600 mb-4`}>
              The Vietnam Tariff Dashboard integrates seamlessly with SAP Business Data Cloud to provide real-time
              analytics, historical trend analysis, and AI-enhanced predictions. This integration leverages the
              power of Monte Carlo simulations to model potential trade impact scenarios with confidence metrics.
            </p>
            
            {isAppleDevice ? (
              <div className="flex flex-wrap gap-3">
                <EnhancedTouchButton
                  onClick={() => handleActionButtonClick('/financial-simulation')}
                  variant="primary"
                  className="flex items-center gap-1"
                  size={isMultiTasking && mode === 'slide-over' ? 'sm' : 'default'}
                >
                  <span>Financial Simulations</span>
                  <ArrowRight className={`${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                </EnhancedTouchButton>
                
                <EnhancedTouchButton
                  onClick={() => handleActionButtonClick('/vietnam-monte-carlo-enhanced')}
                  variant="secondary"
                  className="flex items-center gap-1"
                  size={isMultiTasking && mode === 'slide-over' ? 'sm' : 'default'}
                >
                  <Globe className={`${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  <span>Monte Carlo Analysis</span>
                </EnhancedTouchButton>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => handleActionButtonClick('/financial-simulation')} 
                  className="fiori-btn fiori-btn-primary flex items-center gap-1"
                >
                  <span>Financial Simulations</span>
                  <Link size={16} />
                </button>
                
                <button 
                  onClick={() => handleActionButtonClick('/vietnam-monte-carlo-enhanced')}
                  className="fiori-btn fiori-btn-secondary flex items-center gap-1"
                >
                  <Globe size={16} />
                  <span>Monte Carlo Analysis</span>
                </button>
              </div>
            )}
          </div>
          
          <div className={isMultiTasking && mode === 'slide-over' ? 'scale-[0.95] transform-origin-top-left' : ''}>
            <BusinessDataCloudDashboard 
              isAppleDevice={isAppleDevice} 
              isIPad={isIPad} 
              isMultiTasking={isMultiTasking} 
              multiTaskingMode={mode}
              orientation={orientation}
            />
          </div>
        </div>
      </div>
    </ScbBeautifulUI>
  );
};

export default VietnamTariffDashboardPage;