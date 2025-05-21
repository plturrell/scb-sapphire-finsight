import React, { useState, useEffect, useCallback, useRef } from 'react';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';
import { Switch, Tabs, TabList, TabPanels, Tab, TabPanel, Select, Radio, RadioGroup, Stack } from '@chakra-ui/react';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import useMultiTasking from '@/hooks/useMultiTasking';
import EnhancedTouchButton from '@/components/EnhancedTouchButton';
import { haptics } from '@/lib/haptics';
import { Settings, PaintBucket, Monitor, Smartphone, Moon, Sun, Layout, Eye, Zap, Volume2, Bell, Check } from 'lucide-react';

const SettingsPage = () => {
  const { preferences, setPreference, resetPreferences, isDarkMode } = useUIPreferences();
  const { deviceType, isAppleDevice, browserName } = useDeviceCapabilities();
  const [activeTab, setActiveTab] = useState(0);
  const { mode, isMultiTasking, orientation } = useMultiTasking();
  const [isMounted, setIsMounted] = useState(false);
  const [isPlatformDetected, setPlatformDetected] = useState(false);
  const [isIPad, setIsIPad] = useState(false);
  
  // Save changes notification
  const [showSaveNotice, setShowSaveNotice] = useState(false);
  
  // Detect platform on mount
  useEffect(() => {
    setIsMounted(true);
    
    // Check if we're on an iPad specifically
    const isIpad = /iPad/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && 
       navigator.maxTouchPoints > 1 &&
       !navigator.userAgent.includes('iPhone'));
    
    setIsIPad(isIpad);
    setPlatformDetected(true);
  }, []);
  
  // Debounce timer ref for preventing UI flicker during theme changes
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const noticeTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Show save notification with debouncing
  const showSaveNotification = useCallback(() => {
    // Clear any existing timers
    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current);
    }
    
    // Show the notification
    setShowSaveNotice(true);
    
    // Hide notification after 3 seconds
    noticeTimerRef.current = setTimeout(() => {
      setShowSaveNotice(false);
      noticeTimerRef.current = null;
    }, 3000);
  }, []);
  
  // Show save notification when preferences change
  const handlePreferenceChange = useCallback(<K extends keyof typeof preferences>(key: K, value: typeof preferences[K]) => {
    // Only provide haptic feedback if enabled and on supported devices
    if (preferences.enableHaptics && isAppleDevice) {
      haptics.selection();
    }
    
    // For theme changes, use debouncing to prevent flicker
    if (key === 'theme' || key === 'chartTheme') {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      debounceTimerRef.current = setTimeout(() => {
        setPreference(key, value);
        debounceTimerRef.current = null;
      }, 100);
    } else {
      // No debouncing for other preferences
      setPreference(key, value);
    }
    
    showSaveNotification();
  }, [preferences.enableHaptics, isAppleDevice, setPreference, showSaveNotification]);
  
  // Reset all preferences
  const handleResetPreferences = useCallback(() => {
    // Provide haptic feedback on Apple devices
    if (preferences.enableHaptics && isAppleDevice) {
      haptics.warning();
    }
    
    resetPreferences();
    showSaveNotification();
  }, [preferences.enableHaptics, isAppleDevice, resetPreferences, showSaveNotification]);
  
  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (noticeTimerRef.current) {
        clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);
  
  // Handle tab change with haptic feedback
  const handleTabChange = (index: number) => {
    setActiveTab(index);
    
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptics.selection();
    }
  };
  
  return (
    <ScbBeautifulUI pageTitle="Settings" showTabs={isAppleDevice} showNewsBar={!isMultiTasking}>
      <div className={`${isMultiTasking ? 'max-w-full' : 'max-w-4xl'} mx-auto ${isIPad && isMultiTasking && mode === 'slide-over' ? 'p-2' : 'p-4'}`}>
        {/* Settings header */}
        <div className={`${isMultiTasking ? 'mb-4' : 'mb-8'}`}>
          <h1 className="text-2xl font-bold text-[rgb(var(--scb-honolulu-blue))] dark:text-white">
            Application Settings
          </h1>
          <p className="text-[rgb(var(--scb-dark-gray))] dark:text-gray-300 mt-2">
            Customize your SCB Sapphire experience with these settings
          </p>
        </div>
        
        {/* Settings tabs */}
        <Tabs 
          variant="enclosed" 
          colorScheme="blue" 
          index={activeTab} 
          onChange={handleTabChange}
          className={`${isMultiTasking ? 'tabs-multitasking' : ''}`}>
          <TabList>
            <Tab><div className="flex items-center"><Settings className="w-4 h-4 mr-2" /> General</div></Tab>
            <Tab><div className="flex items-center"><PaintBucket className="w-4 h-4 mr-2" /> Appearance</div></Tab>
            <Tab><div className="flex items-center"><Layout className="w-4 h-4 mr-2" /> Layout</div></Tab>
            <Tab><div className="flex items-center"><Zap className="w-4 h-4 mr-2" /> Performance</div></Tab>
            <Tab><div className="flex items-center"><Bell className="w-4 h-4 mr-2" /> Notifications</div></Tab>
          </TabList>
          
          <TabPanels>
            {/* General Settings */}
            <TabPanel>
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <h2 className="text-lg font-medium text-[rgb(var(--scb-dark-gray))] dark:text-white mb-4">System Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Device Type</span>
                      <span className="text-sm font-medium">{deviceType}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Browser</span>
                      <span className="text-sm font-medium">{browserName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Platform</span>
                      <span className="text-sm font-medium">{isAppleDevice ? 'Apple' : 'Other'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Dark Mode</span>
                      <span className="text-sm font-medium">{isDarkMode ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-white dark:bg-gray-700 rounded-md shadow-sm border border-gray-200 dark:border-gray-600">
                  <h2 className="text-lg font-medium text-[rgb(var(--scb-dark-gray))] dark:text-white mb-4">Feature Settings</h2>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-800 dark:text-gray-200">Enable News Bar</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Show the latest news in the sidebar</p>
                      </div>
                      <Switch 
                        colorScheme="blue" 
                        isChecked={preferences.enableNewsBar}
                        onChange={() => handlePreferenceChange('enableNewsBar', !preferences.enableNewsBar)}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-800 dark:text-gray-200">Enable Joule Assistant</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered assistant for insights</p>
                      </div>
                      <Switch 
                        colorScheme="blue" 
                        isChecked={preferences.enableJouleAssistant}
                        onChange={() => handlePreferenceChange('enableJouleAssistant', !preferences.enableJouleAssistant)}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-800 dark:text-gray-200">Enable Search Bar</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Show search bar on pages</p>
                      </div>
                      <Switch 
                        colorScheme="blue" 
                        isChecked={preferences.enableSearchBar}
                        onChange={() => handlePreferenceChange('enableSearchBar', !preferences.enableSearchBar)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>
            
            {/* Appearance Settings */}
            <TabPanel>
              <div className="space-y-6">
                <div className="p-4 bg-white dark:bg-gray-700 rounded-md shadow-sm border border-gray-200 dark:border-gray-600">
                  <h2 className="text-lg font-medium text-[rgb(var(--scb-dark-gray))] dark:text-white mb-4">Theme</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Theme Mode</h3>
                      <RadioGroup 
                        value={preferences.theme} 
                        onChange={(value) => handlePreferenceChange('theme', value as 'light' | 'dark' | 'system')}
                      >
                        <Stack direction="row" spacing={5}>
                          <Radio value="light" colorScheme="blue">
                            <div className="flex items-center">
                              <Sun className="w-4 h-4 mr-2" />
                              Light
                            </div>
                          </Radio>
                          <Radio value="dark" colorScheme="blue">
                            <div className="flex items-center">
                              <Moon className="w-4 h-4 mr-2" />
                              Dark
                            </div>
                          </Radio>
                          <Radio value="system" colorScheme="blue">
                            <div className="flex items-center">
                              <Monitor className="w-4 h-4 mr-2" />
                              System
                            </div>
                          </Radio>
                        </Stack>
                      </RadioGroup>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Accent Color</h3>
                      <div className="flex items-center space-x-4">
                        {['blue', 'green', 'purple', 'teal', 'orange'].map((color) => (
                          <button
                            key={color}
                            className={`w-8 h-8 rounded-full transition-transform ${
                              preferences.accentColor === color 
                                ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' 
                                : 'hover:scale-105'
                            }`}
                            style={{ 
                              backgroundColor: 
                                color === 'blue' ? 'rgb(0, 114, 170)' :
                                color === 'green' ? 'rgb(33, 170, 71)' :
                                color === 'purple' ? 'rgb(88, 86, 214)' :
                                color === 'teal' ? 'rgb(0, 199, 190)' :
                                'rgb(255, 149, 0)'
                            }}
                            onClick={() => handlePreferenceChange('accentColor', color as any)}
                            aria-label={`${color} accent color`}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Font Size</h3>
                      <Select 
                        value={preferences.fontSize}
                        onChange={(e) => handlePreferenceChange('fontSize', e.target.value as 'small' | 'medium' | 'large')}
                        maxWidth="200px"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-white dark:bg-gray-700 rounded-md shadow-sm border border-gray-200 dark:border-gray-600">
                  <h2 className="text-lg font-medium text-[rgb(var(--scb-dark-gray))] dark:text-white mb-4">Chart Appearance</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Chart Color Palette</h3>
                      <Select 
                        value={preferences.chartColorPalette}
                        onChange={(e) => handlePreferenceChange('chartColorPalette', e.target.value as any)}
                        maxWidth="200px"
                      >
                        <option value="standard">Standard</option>
                        <option value="colorblind">Colorblind Friendly</option>
                        <option value="monochrome">Monochrome</option>
                        <option value="pastel">Pastel</option>
                      </Select>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Chart Theme</h3>
                      <RadioGroup 
                        value={preferences.chartTheme} 
                        onChange={(value) => handlePreferenceChange('chartTheme', value as 'light' | 'dark' | 'system')}
                      >
                        <Stack direction="row" spacing={5}>
                          <Radio value="light" colorScheme="blue">Light</Radio>
                          <Radio value="dark" colorScheme="blue">Dark</Radio>
                          <Radio value="system" colorScheme="blue">System</Radio>
                        </Stack>
                      </RadioGroup>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Legend Position</h3>
                      <RadioGroup 
                        value={preferences.chartLegendPosition} 
                        onChange={(value) => handlePreferenceChange('chartLegendPosition', value as 'top' | 'bottom' | 'left' | 'right')}
                      >
                        <Stack direction="row" spacing={5}>
                          <Radio value="top" colorScheme="blue">Top</Radio>
                          <Radio value="bottom" colorScheme="blue">Bottom</Radio>
                          <Radio value="left" colorScheme="blue">Left</Radio>
                          <Radio value="right" colorScheme="blue">Right</Radio>
                        </Stack>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>
            
            {/* Layout Settings */}
            <TabPanel>
              <div className="space-y-6">
                <div className="p-4 bg-white dark:bg-gray-700 rounded-md shadow-sm border border-gray-200 dark:border-gray-600">
                  <h2 className="text-lg font-medium text-[rgb(var(--scb-dark-gray))] dark:text-white mb-4">Layout Options</h2>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-800 dark:text-gray-200">Sidebar Expanded</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Show labels in sidebar navigation</p>
                      </div>
                      <Switch 
                        colorScheme="blue" 
                        isChecked={preferences.sidebarExpanded}
                        onChange={() => handlePreferenceChange('sidebarExpanded', !preferences.sidebarExpanded)}
                      />
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Layout Density</h3>
                      <RadioGroup 
                        value={preferences.layoutDensity} 
                        onChange={(value) => handlePreferenceChange('layoutDensity', value as 'compact' | 'comfortable' | 'spacious')}
                      >
                        <Stack direction="column" spacing={2}>
                          <Radio value="compact" colorScheme="blue">Compact (dense, more content)</Radio>
                          <Radio value="comfortable" colorScheme="blue">Comfortable (default spacing)</Radio>
                          <Radio value="spacious" colorScheme="blue">Spacious (more whitespace)</Radio>
                        </Stack>
                      </RadioGroup>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Header Style</h3>
                      <RadioGroup 
                        value={preferences.headerStyle} 
                        onChange={(value) => handlePreferenceChange('headerStyle', value as 'white' | 'blue')}
                      >
                        <Stack direction="row" spacing={5}>
                          <Radio value="white" colorScheme="blue">White</Radio>
                          <Radio value="blue" colorScheme="blue">SCB Blue</Radio>
                        </Stack>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-white dark:bg-gray-700 rounded-md shadow-sm border border-gray-200 dark:border-gray-600">
                  <h2 className="text-lg font-medium text-[rgb(var(--scb-dark-gray))] dark:text-white mb-4">Mobile Layout</h2>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-800 dark:text-gray-200">Show Labels</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Show labels in mobile navigation</p>
                      </div>
                      <Switch 
                        colorScheme="blue" 
                        isChecked={preferences.showLabels}
                        onChange={() => handlePreferenceChange('showLabels', !preferences.showLabels)}
                      />
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Navigation Style</h3>
                      <RadioGroup 
                        value={preferences.mobileNavStyle} 
                        onChange={(value) => handlePreferenceChange('mobileNavStyle', value as 'bottom' | 'tab')}
                      >
                        <Stack direction="row" spacing={5}>
                          <Radio value="bottom" colorScheme="blue">
                            <div className="flex items-center">
                              <Smartphone className="w-4 h-4 mr-2" />
                              Bottom Tabs
                            </div>
                          </Radio>
                          <Radio value="tab" colorScheme="blue">
                            <div className="flex items-center">
                              <Layout className="w-4 h-4 mr-2" />
                              Top Tabs
                            </div>
                          </Radio>
                        </Stack>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>
            
            {/* Performance Settings */}
            <TabPanel>
              <div className="space-y-6">
                <div className="p-4 bg-white dark:bg-gray-700 rounded-md shadow-sm border border-gray-200 dark:border-gray-600">
                  <h2 className="text-lg font-medium text-[rgb(var(--scb-dark-gray))] dark:text-white mb-4">Animation & Effects</h2>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-800 dark:text-gray-200">Enable Animations</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Use animations throughout the app</p>
                      </div>
                      <Switch 
                        colorScheme="blue" 
                        isChecked={preferences.enableAnimations}
                        onChange={() => handlePreferenceChange('enableAnimations', !preferences.enableAnimations)}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-800 dark:text-gray-200">Enable Haptic Feedback</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Tactile feedback on interactions (mobile)</p>
                      </div>
                      <Switch 
                        colorScheme="blue" 
                        isChecked={preferences.enableHaptics}
                        onChange={() => handlePreferenceChange('enableHaptics', !preferences.enableHaptics)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>
            
            {/* Notification Settings */}
            <TabPanel>
              <div className="p-4 bg-white dark:bg-gray-700 rounded-md shadow-sm border border-gray-200 dark:border-gray-600">
                <h2 className="text-lg font-medium text-[rgb(var(--scb-dark-gray))] dark:text-white mb-4">Notification Preferences</h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-gray-200">Show Notifications</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Display notification alerts</p>
                    </div>
                    <Switch 
                      colorScheme="blue" 
                      isChecked={true}
                    />
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Notification Types</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Portfolio Alerts</span>
                        <Switch colorScheme="blue" defaultChecked />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Report Updates</span>
                        <Switch colorScheme="blue" defaultChecked />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Market News</span>
                        <Switch colorScheme="blue" defaultChecked />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 dark:text-gray-300">System Updates</span>
                        <Switch colorScheme="blue" defaultChecked />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
        
        {/* Reset button */}
        <div className={`${isMultiTasking ? 'mt-4' : 'mt-8'} flex justify-between items-center`}>
          {isAppleDevice && isPlatformDetected ? (
            <EnhancedTouchButton
              variant="danger"
              label="Reset to Defaults"
              onClick={handleResetPreferences}
            />
          ) : (
            <button
              className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium rounded-md hover:bg-red-50 transition-colors"
              onClick={handleResetPreferences}
            >
              Reset to Defaults
            </button>
          )}
          
          {/* Save notification */}
          {showSaveNotice && (
            <div className={`${isAppleDevice ? 'flex items-center' : ''} bg-green-50 text-green-800 px-4 py-2 rounded-md text-sm`}>
              {isAppleDevice && <Check className="w-4 h-4 mr-2" />}
              Preferences saved automatically
            </div>
          )}
        </div>
      </div>
    </ScbBeautifulUI>
  );
};

export default SettingsPage;