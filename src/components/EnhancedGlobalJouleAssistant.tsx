import React, { useState, useEffect } from 'react';
import { Sparkles, X, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import EnhancedJouleAssistantWrapper from './EnhancedJouleAssistantWrapper';
import { useDeviceCapabilities } from '../hooks/useDeviceCapabilities';
import { useNetworkAwareLoading } from '../hooks/useNetworkAwareLoading';

interface EnhancedGlobalJouleAssistantProps {
  initialOpen?: boolean;
  theme?: 'light' | 'dark';
}

/**
 * EnhancedGlobalJouleAssistant Component
 * An enhanced globally accessible Joule AI Assistant with SCB Beautiful UI styling
 * that can be used consistently across all pages in the application
 */
const EnhancedGlobalJouleAssistant: React.FC<EnhancedGlobalJouleAssistantProps> = ({
  initialOpen = false,
  theme: propTheme
}) => {
  const [jouleOpen, setJouleOpen] = useState(initialOpen);
  const [newsItem, setNewsItem] = useState<{
    title: string;
    summary: string;
    category: string;
    source: string;
  } | undefined>(undefined);
  
  const { prefersColorScheme, tier } = useDeviceCapabilities();
  const { connection } = useNetworkAwareLoading();
  
  // Determine effective theme based on props or system preference
  const theme = propTheme || prefersColorScheme || 'light';
  
  // Define SCB colors based on theme
  const colors = {
    light: {
      honoluluBlue: 'rgb(var(--scb-honolulu-blue, 0, 114, 170))', // #0072AA
      americanGreen: 'rgb(var(--scb-american-green, 33, 170, 71))', // #21AA47
      primaryPurple: '#cc00dc',
      background: 'white',
      cardBackground: 'white',
      border: '#e0e0e0',
      text: '#333333',
      textLight: '#666666',
      buttonBackgroundHover: 'rgba(0, 114, 170, 0.1)',
      networkGood: 'rgb(var(--scb-american-green, 33, 170, 71))',
      networkWarning: 'rgb(var(--scb-sun, 255, 204, 0))',
      networkBad: 'rgb(var(--scb-persian-red, 204, 0, 0))',
    },
    dark: {
      honoluluBlue: 'rgb(0, 142, 211)', // Lighter for dark mode
      americanGreen: 'rgb(41, 204, 86)', // Lighter for dark mode
      primaryPurple: '#e838f1',
      background: '#121212',
      cardBackground: '#1e1e1e',
      border: '#333333',
      text: '#e0e0e0',
      textLight: '#a0a0a0',
      buttonBackgroundHover: 'rgba(0, 142, 211, 0.15)',
      networkGood: 'rgb(41, 204, 86)',
      networkWarning: 'rgb(255, 214, 51)',
      networkBad: 'rgb(255, 99, 99)',
    }
  };
  
  const currentColors = colors[theme];
  
  // Method to be exposed to other components to open Joule with specific news
  const analyzeNews = (item: {
    title: string;
    summary: string;
    category: string;
    source: string;
  }) => {
    setNewsItem(item);
    setJouleOpen(true);
  };

  // Method to open Joule without specific content
  const openJoule = () => {
    setJouleOpen(true);
  };
  
  // Network status indicator color
  const getNetworkStatusColor = () => {
    if (connection.saveData || connection.type === 'slow-2g' || connection.type === '2g') {
      return currentColors.networkBad;
    } else if (connection.type === '3g' || (connection.type === '4g' && connection.downlink < 2)) {
      return currentColors.networkWarning;
    } else {
      return currentColors.networkGood;
    }
  };
  
  // Determine network icon based on connection
  const NetworkIcon = connection.type === 'offline' ? WifiOff :
    (connection.type === 'slow-2g' || connection.type === '2g') ? AlertCircle : Wifi;

  return (
    <>
      {/* Floating Joule Button - Always visible on bottom right */}
      <button
        onClick={openJoule}
        className="fixed right-6 bottom-6 z-40 flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{ 
          backgroundColor: currentColors.primaryPurple,
          boxShadow: `0 3px 15px rgba(204, 0, 220, ${theme === 'dark' ? '0.4' : '0.2'})`,
          transform: `scale(${tier === 'low' ? '0.9' : '1'})`,
          focusRingColor: currentColors.honoluluBlue,
        }}
        aria-label="Open Joule AI Assistant"
      >
        <Sparkles className="w-6 h-6 text-white" />
      </button>

      {/* Joule AI Assistant Panel */}
      {jouleOpen && (
        <div 
          className="fixed inset-y-0 right-0 w-96 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out transform translate-x-0"
          style={{ 
            backgroundColor: currentColors.background,
            borderLeft: `1px solid ${currentColors.border}`,
            boxShadow: `0 0 25px rgba(0, 0, 0, ${theme === 'dark' ? '0.5' : '0.15'})`,
          }}
        >
          {/* Joule Header with SCB styling */}
          <div 
            className="flex items-center justify-between px-6 py-4 border-b fiori-shell-header"
            style={{ 
              backgroundColor: currentColors.primaryPurple,
              borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-md flex items-center justify-center"
                style={{ backgroundColor: currentColors.primaryPurple }}
              >
                <span className="text-white font-bold text-lg">J</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white horizon-header">Joule</h2>
                <p className="text-sm text-white/80 flex items-center gap-2">
                  Powered by 
                  <Image
                    src="/assets/idEDqS_YGr_1747680256633.svg"
                    alt="SAP"
                    width={32}
                    height={16}
                    className="inline-block brightness-0 invert"
                    priority={connection.type === 'wifi' || connection.type === '4g'}
                  />
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Network status indicator */}
              <div 
                className="flex items-center" 
                title={`Network: ${connection.type}, Downlink: ${connection.downlink} Mbps`}
              >
                <NetworkIcon className="w-4 h-4 text-white opacity-80" style={{ color: getNetworkStatusColor() }} />
              </div>
              
              <button
                onClick={() => setJouleOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close Joule Assistant"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Joule Content */}
          <div className="flex-1 overflow-hidden">
            <EnhancedJouleAssistantWrapper 
              open={jouleOpen} 
              onOpenChange={setJouleOpen} 
              initialNewsItem={newsItem}
              theme={theme}
            />
          </div>
        </div>
      )}
    </>
  );
};

// Create a singleton instance to ensure we have
// only one JouleAssistant at a time
let globalJouleAssistantInstance: {
  analyzeNews: (item: any) => void;
  openJoule: () => void;
} | null = null;

export const useGlobalJouleAssistant = () => {
  if (!globalJouleAssistantInstance) {
    globalJouleAssistantInstance = {
      analyzeNews: () => console.warn('GlobalJouleAssistant not mounted yet'),
      openJoule: () => console.warn('GlobalJouleAssistant not mounted yet')
    };
  }
  
  return globalJouleAssistantInstance;
};

export default EnhancedGlobalJouleAssistant;