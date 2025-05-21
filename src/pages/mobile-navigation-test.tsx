import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import MobileNavigation from '@/components/MobileNavigation';
import { LayoutDashboard, BarChart, Briefcase, FileText, Settings, AlertCircle } from '@/components/ui/icons';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import { useSafeArea } from '@/hooks/useSafeArea';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';

const MobileNavigationTest: NextPage = () => {
  const [activeTab, setActiveTab] = useState('bottom');
  const { deviceType, screenSize, operatingSystem } = useDeviceCapabilities();
  const { safeArea } = useSafeArea();
  const { isDarkMode, preferences } = useUIPreferences();
  
  // Custom navigation items
  const customItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Analytics', href: '/analytics', icon: BarChart },
    { name: 'Portfolio', href: '/portfolio', icon: Briefcase, badge: 3 },
    { name: 'Reports', href: '/reports', icon: FileText }
  ];
  
  // Toggle between navigation variants
  const toggleVariant = (variant: string) => {
    setActiveTab(variant);
  };
  
  return (
    <>
      <Head>
        <title>Mobile Navigation Test | SCB Sapphire</title>
        <meta name="description" content="Test mobile navigation patterns for SCB Sapphire" />
      </Head>
      
      <ScbBeautifulUI pageTitle="Mobile Navigation Test">
        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
          Testing different mobile navigation patterns
        </p>
        
        <div className="space-y-8">
        {/* Device Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Device Information</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Device Type:</span>
              <span className="font-medium text-gray-900 dark:text-white">{deviceType}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Screen Size:</span>
              <span className="font-medium text-gray-900 dark:text-white">{screenSize}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Operating System:</span>
              <span className="font-medium text-gray-900 dark:text-white">{operatingSystem}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Safe Area Bottom:</span>
              <span className="font-medium text-gray-900 dark:text-white">{safeArea.bottom}px</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Has Home Indicator:</span>
              <span className="font-medium text-gray-900 dark:text-white">{safeArea.homeIndicator ? 'Yes' : 'No'}</span>
            </li>
          </ul>
        </div>
        
        {/* Navigation Test Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Navigation Test</h2>
          
          <div className="flex flex-wrap gap-2 mb-6">
            <button 
              onClick={() => toggleVariant('bottom')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                activeTab === 'bottom' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              Bottom Nav
            </button>
            <button 
              onClick={() => toggleVariant('tab')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                activeTab === 'tab' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              Top Tabs
            </button>
            <button 
              onClick={() => toggleVariant('iphone')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                activeTab === 'iphone' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              iPhone Style
            </button>
            <button 
              onClick={() => toggleVariant('android')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                activeTab === 'android' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              Android Style
            </button>
          </div>
          
          <div className="p-6 bg-gray-100 dark:bg-gray-900 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-3" />
              <p className="text-gray-600 dark:text-gray-400">Navigation variant:</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">{activeTab}</p>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation Examples */}
        <div className="space-y-6">
          {/* Sample Content Sections */}
          {[1, 2, 3].map((section) => (
            <div key={section} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Section {section}</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                This is sample content to demonstrate how the mobile navigation components appear
                with actual page content. The navigation should stay fixed while scrolling this content.
              </p>
              <div className="h-32 mt-4 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                <span className="text-gray-500 dark:text-gray-400">Content Area {section}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
        
        {/* Mobile Navigation Component */}
        {activeTab === 'bottom' && (
          <MobileNavigation 
            variant="bottom"
            customItems={customItems}
            showLabel={preferences.showLabels}
            enableHaptics={preferences.enableHaptics}
            showNotifications={true}
            activeItemHref="/dashboard"
          />
        )}
        
        {activeTab === 'tab' && (
          <MobileNavigation 
            variant="tab"
            customItems={customItems}
            showLabel={preferences.showLabels}
            enableHaptics={preferences.enableHaptics}
            showNotifications={true}
            showSearch={true}
            activeItemHref="/analytics"
          />
        )}
        
        {activeTab === 'iphone' && (
          <MobileNavigation 
            variant="bottom"
            customItems={customItems}
            showLabel={preferences.showLabels}
            enableHaptics={preferences.enableHaptics}
            appearance="light"
            activeItemHref="/portfolio"
          />
        )}
        
        {activeTab === 'android' && (
          <MobileNavigation 
            variant="bottom"
            customItems={[
              ...customItems,
              { name: 'Settings', href: '/settings', icon: Settings }
            ]}
            showLabel={false}
            enableHaptics={preferences.enableHaptics}
            appearance="dark"
            activeItemHref="/reports"
          />
        )}
      </ScbBeautifulUI>
    </>
  );
};

export default MobileNavigationTest;