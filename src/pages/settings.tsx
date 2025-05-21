import React, { useState, useEffect, useCallback, useRef } from 'react';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';
import { Switch, Tabs, TabList, TabPanels, Tab, TabPanel, Select, Radio, RadioGroup, Stack, useToast, Box, Text, useColorModeValue } from '@chakra-ui/react';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import useMultiTasking from '@/hooks/useMultiTasking';
import EnhancedTouchButton from '@/components/EnhancedTouchButton';
import EnhancedAppleTouchButton from '@/components/EnhancedAppleTouchButton';
import EnhancedIOSNavBar from '@/components/EnhancedIOSNavBar';
import EnhancedSettingsNavigation from '@/components/EnhancedSettingsNavigation';
import { haptics } from '@/lib/haptics';
import { useSafeArea, safeAreaCss } from '@/hooks/useSafeArea';
import { useApplePhysics } from '@/hooks/useApplePhysics';
import { useIOS } from '@/hooks/useResponsive';
import { useSFSymbolsSupport } from '@/lib/sf-symbols';
import { Settings, PaintBucket, Monitor, Smartphone, Moon, Sun, Layout, Bell, Check, Zap } from 'lucide-react';
import ThemePreview from '@/components/ThemePreview';

// Types for notification preferences
type NotificationPreference = {
  portfolioAlerts: boolean;
  reportUpdates: boolean;
  marketNews: boolean;
  systemUpdates: boolean;
};

// Settings sections with SF Symbol icons
const settingsSections = [
  { 
    id: 'general', 
    name: 'General', 
    icon: 'gear', 
    description: 'Basic app settings and system information'
  },
  { 
    id: 'appearance', 
    name: 'Appearance', 
    icon: 'paintbrush.fill',
    description: 'Themes, colors, and visual preferences'
  },
  { 
    id: 'layout', 
    name: 'Layout', 
    icon: 'square.grid.3x3',
    description: 'Navigation and layout options'
  },
  { 
    id: 'performance', 
    name: 'Performance', 
    icon: 'bolt.fill',
    description: 'Animations and performance settings'
  },
  { 
    id: 'notifications', 
    name: 'Notifications', 
    icon: 'bell.fill',
    description: 'Alert and notification preferences',
    badge: '4'
  },
];

const SettingsPage = () => {
  const { preferences, setPreference, resetPreferences, isDarkMode } = useUIPreferences();
  const { deviceType, isAppleDevice } = useDeviceCapabilities();
  const { isMultiTasking, mode } = useMultiTasking();
  const [isMounted, setIsMounted] = useState(false);
  const [isPlatformDetected, setPlatformDetected] = useState(false);
  const [isIPad, setIsIPad] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [activeSection, setActiveSection] = useState<string>('general');
  const [showSaveNotice, setShowSaveNotice] = useState(false);
  const [showConfirmationSheet, setShowConfirmationSheet] = useState(false);
  const [navbarHidden, setNavbarHidden] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const toast = useToast();
  
  // Use notification prefs from preferences context
  const notificationPrefs = preferences.notificationPrefs || {
    portfolioAlerts: true,
    reportUpdates: true,
    marketNews: true,
    systemUpdates: true,
  };
  
  // Platform detection
  const isAppleDeviceHook = useIOS();
  const { supported: sfSymbolsSupported } = useSFSymbolsSupport();
  
  // iOS-specific hooks
  const { safeArea, hasHomeIndicator } = useSafeArea();
  const physics = useApplePhysics({ motion: 'standard', respectReduceMotion: true });
  
  // Platform detection
  const isiOS = deviceType === 'mobile' && isAppleDevice;
  const isiPad = deviceType === 'tablet' && isAppleDevice;
  const isApplePlatform = isiOS || isiPad;
  
  // Touch tracking
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const lastScrollTop = useRef<number>(0);
  const [navbarHidden, setNavbarHidden] = useState(false);
  
  // Handle notification preference change
  const handleNotificationChange = (key: keyof NotificationPreference, value: boolean) => {
    setPreference('notificationPrefs', {
      ...notificationPrefs,
      [key]: value
    });
    showSaveNotification();
  };
  
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
    
    // Initialize scroll listener for iOS-style navigation hiding
  }, [isAppleDevice, isIPad]);
  
  // Handle scroll for iOS-style navbar hiding
  const handleScroll = useCallback(() => {
    if (!isApplePlatform) return;
    
    const currentScrollY = window.scrollY;
    setNavbarHidden(currentScrollY > 100);
  }, [isApplePlatform, setNavbarHidden]);
  
  // Set up scroll listener
  useEffect(() => {
    if (!isApplePlatform) return;
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll, isApplePlatform]);
  
  // iOS-specific gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isApplePlatform) return;
    const touch = e.touches[0];
    if (touch) {
      const currentScrollY = window.scrollY;
      setNavbarHidden(currentScrollY > 100);
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isApplePlatform) return;
    const touch = e.touches[0];
    if (!touch) return;
    const currentY = touch.clientY;
    const touchStartY = 0; // This should be managed with state if needed
    const diffY = touchStartY - currentY;
    
    // If scrolling down, hide navbar
    if (diffY > 20) {
      setNavbarHidden(true);
    } else if (diffY < -20) {
      setNavbarHidden(false);
    }
  };
  
  const handleTouchEnd = () => {
    if (!isApplePlatform) return;
    // Reset touch state if needed
  };
  
  // Refs for timers and state management
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const noticeTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Browser detection
  const getBrowserName = (): string => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  };
  
  const browserName = isMounted ? getBrowserName() : 'Loading...';
  
  // Show save notification with haptic feedback
  const showSaveNotification = useCallback(() => {
    // Haptic feedback for iOS devices
    if (window.navigator.vibrate) {
      window.navigator.vibrate(50);
    } else if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    } else if (window?.HapticFeedback) {
      window.HapticFeedback.impact('medium');
    }
    
    // On iOS, play success haptic
    if (isApplePlatform && preferences.enableHaptics) {
      haptics.success();
    }
    
    // Show the notification
    setShowSaveNotice(true);
    
    // Clear any existing timers
    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current);
    }
    
    // Hide notification after 3 seconds
    noticeTimerRef.current = setTimeout(() => {
      setShowSaveNotice(false);
      noticeTimerRef.current = null;
    }, 3000);
  }, [isApplePlatform, preferences.enableHaptics]);
  
  // Handle preference changes with debouncing
  const handlePreferenceChange = useCallback((key: keyof typeof preferences, value: typeof preferences[keyof typeof preferences], immediate: boolean = false) => {
    // Cancel any pending updates
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Update local state immediately for responsive UI
    setPreference(key, value);
    
    // For theme changes, we want immediate feedback
    if (key === 'theme' && immediate) {
      showSaveNotification();
      return;
    }
    
    // Show save notification after a short delay
    debounceTimerRef.current = setTimeout(() => {
      showSaveNotification();
    }, 300);
  }, [setPreference, showSaveNotification]);
  
  // Reset all preferences with confirmation for iOS
  const handleResetPreferences = useCallback(() => {
    if (isApplePlatform) {
      // Show iOS-style confirmation sheet
      setShowConfirmationSheet(true);
    } else {
      // Direct reset for non-Apple platforms
      resetPreferences();
      showSaveNotification();
    }
  }, [isApplePlatform, resetPreferences, showSaveNotification]);
  
  // Confirm reset preferences
  const confirmReset = useCallback(() => {
    // Provide haptic feedback on Apple devices
    if (preferences.enableHaptics && isApplePlatform) {
      haptics.warning();
    }
    
    resetPreferences();
    setShowConfirmationSheet(false);
    showSaveNotification();
  }, [preferences.enableHaptics, isApplePlatform, resetPreferences, showSaveNotification]);
  
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
    
    // Update active section for iOS navigation
    const sections = ['General', 'Appearance', 'Layout', 'Performance', 'Notifications'];
    setActiveSection(sections[index]);
    
    // Provide haptic feedback on Apple devices
    if (isApplePlatform) {
      haptics.selection();
    }
  };
  
  // Handle section change for SF Symbols navigation
  const handleSectionChange = (sectionId: string) => {
    const sectionIndex = settingsSections.findIndex(section => section.id === sectionId);
    if (sectionIndex >= 0) {
      setActiveTab(sectionIndex);
      setActiveSection(sectionId);
      
      // Scroll to top when changing sections
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Provide haptic feedback on mobile
      if (preferences.enableHaptics && isApplePlatform) {
        haptics.selection();
      }
    }
  };
  
  return (
    <>
      {/* iOS Navigation Bar */}
      {isApplePlatform && (
        <EnhancedIOSNavBar
          title="Settings"
          subtitle={activeSection}
          showBackButton={true}
          largeTitle={!navbarHidden}
          blurred={true}
          position="sticky"
          respectSafeArea={true}
          className={`transition-transform duration-300 ${navbarHidden ? '-translate-y-full' : 'translate-y-0'}`}
          theme={isDarkMode ? 'dark' : 'light'}
          hapticFeedback={preferences.enableHaptics}
          rightActions={[
            {
              icon: 'arrow.clockwise',
              label: 'Reset Settings',
              onPress: handleResetPreferences,
              variant: 'destructive'
            }
          ]}
        />
      )}
      
      <ScbBeautifulUI pageTitle="Settings" showTabs={isAppleDevice} showNewsBar={!isMultiTasking}>
        <div 
          className={`${isMultiTasking ? 'max-w-full' : 'max-w-4xl'} mx-auto ${isIPad && isMultiTasking && mode === 'slide-over' ? 'p-2' : 'p-4'}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            paddingTop: isApplePlatform ? (navbarHidden ? '1rem' : '0') : '1rem',
            paddingBottom: hasHomeIndicator ? `calc(1rem + ${safeAreaCss.bottom})` : '1rem'
          }}
        >
          {/* Non-iOS Header */}
          {!isApplePlatform && (
            <div className={`${isMultiTasking ? 'mb-4' : 'mb-8'}`}>
              <h1 className="text-2xl font-bold text-[rgb(var(--scb-honolulu-blue))] dark:text-white">
                Application Settings
              </h1>
              <p className="text-[rgb(var(--scb-dark-gray))] dark:text-gray-300 mt-2">
                Customize your SCB Sapphire experience with these settings
              </p>
            </div>
          )}
          
          {/* Settings interface - iOS vs standard */}
          {isApplePlatform ? (
            <div 
              className={`space-y-4 ${hasHomeIndicator ? 'pb-[env(safe-area-inset-bottom)]' : ''}`}
              style={{
                fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif"
              }}
            >
              {/* Enhanced Settings Navigation with SF Symbols */}
              <div className={`mb-6 ${!isAppleDeviceHook || !isPlatformDetected || !sfSymbolsSupported ? 'opacity-0 h-0 overflow-hidden' : ''}`}>
                <EnhancedSettingsNavigation
                  sections={settingsSections}
                  activeSection={activeSection}
                  onSectionChange={handleSectionChange}
                  variant={isIPad && !isMultiTasking ? 'grid' : 'list'}
                  showDescriptions={isIPad && !isMultiTasking}
                  className="mb-4"
                  theme={isDarkMode ? 'dark' : 'light'}
                />
              </div>
              
              {/* Fallback Tabs for non-iOS or when SF Symbols aren't supported */}
              {(!isAppleDeviceHook || !isPlatformDetected || !sfSymbolsSupported) && (
                <Tabs 
                  index={activeTab} 
                  onChange={handleTabChange}
                  variant="enclosed"
                  className="mb-6"
                  colorScheme="blue"
                >
                  <TabList>
                    {settingsSections.map((section) => (
                      <Tab key={section.id} className="capitalize">
                        {section.name}
                      </Tab>
                    ))}
                  </TabList>
                </Tabs>
              )}
              
              {/* iOS-style grouped table view */}
              <div className="rounded-lg overflow-hidden shadow-sm">
                {/* System Information */}
                <div className="bg-white dark:bg-gray-800 px-4 py-2">
                  <h3 className="text-sm uppercase text-gray-500 dark:text-gray-400 font-medium">System Information</h3>
                </div>
                
                <div className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-gray-800 dark:text-white">Device Type</span>
                    <span className="text-gray-500 dark:text-gray-400">{deviceType}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-gray-800 dark:text-white">Browser</span>
                    <span className="text-gray-500 dark:text-gray-400">{browserName}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-gray-800 dark:text-white">Platform</span>
                    <span className="text-gray-500 dark:text-gray-400">{isAppleDevice ? 'Apple' : 'Other'}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-gray-800 dark:text-white">Dark Mode</span>
                    <span className="text-gray-500 dark:text-gray-400">{isDarkMode ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
              </div>
              
              {/* iOS-style toggles section */}
              <div className="rounded-lg overflow-hidden shadow-sm">
                <div className="bg-white dark:bg-gray-800 px-4 py-2">
                  <h3 className="text-sm uppercase text-gray-500 dark:text-gray-400 font-medium">Features</h3>
                </div>
                
                <div className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  <div className="flex justify-between items-center px-4 py-3">
                    <div>
                      <span className="text-gray-800 dark:text-white">News Bar</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Show the latest news in the sidebar</p>
                    </div>
                    <Switch 
                      colorScheme="blue" 
                      isChecked={preferences.enableNewsBar}
                      onChange={() => handlePreferenceChange('enableNewsBar', !preferences.enableNewsBar)}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center px-4 py-3">
                    <div>
                      <span className="text-gray-800 dark:text-white">Joule Assistant</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">AI-powered assistant for insights</p>
                    </div>
                    <Switch 
                      colorScheme="blue" 
                      isChecked={preferences.enableJouleAssistant}
                      onChange={() => handlePreferenceChange('enableJouleAssistant', !preferences.enableJouleAssistant)}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center px-4 py-3">
                    <div>
                      <span className="text-gray-800 dark:text-white">Search Bar</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Show search bar on pages</p>
                    </div>
                    <Switch 
                      colorScheme="blue" 
                      isChecked={preferences.enableSearchBar}
                      onChange={() => handlePreferenceChange('enableSearchBar', !preferences.enableSearchBar)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Appearance settings */}
              <div className="rounded-lg overflow-hidden shadow-sm">
                <div className="bg-white dark:bg-gray-800 px-4 py-2">
                  <h3 className="text-sm uppercase text-gray-500 dark:text-gray-400 font-medium">Appearance</h3>
                </div>
                
                <div className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  {/* Theme Mode */}
                  <div className="px-4 py-3">
                    <div className="mb-8">
                      <h3 className="text-sm font-medium text-gray-800 dark:text-white mb-3">
                        Appearance
                      </h3>
                      
                      {/* Theme Preview */}
                      <ThemePreview 
                        theme={preferences.theme}
                        isDarkMode={isDarkMode}
                        onSelect={(theme) => handlePreferenceChange('theme', theme, true)}
                      />
                      
                      <div className="mt-4">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          Theme Mode
                        </p>
                        <RadioGroup 
                          value={preferences.theme} 
                          onChange={(value) => handlePreferenceChange('theme', value as 'light' | 'dark' | 'system')}
                          className="space-y-2"
                        >
                          <div className="flex items-center">
                            <Radio value="light" className="text-blue-600 dark:text-blue-400">
                              <div className="flex items-center ml-2">
                                <Sun className="w-4 h-4 mr-2" />
                                <span className="text-gray-800 dark:text-white">Light</span>
                              </div>
                            </Radio>
                          </div>
                          <div className="flex items-center">
                            <Radio value="dark" className="text-blue-600 dark:text-blue-400">
                              <div className="flex items-center ml-2">
                                <Moon className="w-4 h-4 mr-2" />
                                <span className="text-gray-800 dark:text-white">Dark</span>
                              </div>
                            </Radio>
                          </div>
                          <div className="flex items-center">
                            <Radio value="system" className="text-blue-600 dark:text-blue-400">
                              <div className="flex items-center ml-2">
                                <Monitor className="w-4 h-4 mr-2" />
                                <span className="text-gray-800 dark:text-white">System Default</span>
                              </div>
                            </Radio>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  </div>
                  
                  {/* Accent Color */}
                  <div className="px-4 py-3">
                    <div className="mb-2">
                      <span className="text-gray-800 dark:text-white">Accent Color</span>
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                      {['blue', 'green', 'purple', 'teal', 'orange'].map((color) => (
                        <button
                          key={color}
                          className={`w-12 h-12 rounded-full transition-transform ${
                            preferences.accentColor === color 
                              ? 'ring-4 ring-offset-2 ring-blue-500 scale-105' 
                              : 'hover:scale-105'
                          }`}
                          style={{ 
                            backgroundColor: 
                              color === 'blue' ? 'rgb(0, 122, 255)' :
                              color === 'green' ? 'rgb(52, 199, 89)' :
                              color === 'purple' ? 'rgb(175, 82, 222)' :
                              color === 'teal' ? 'rgb(48, 176, 199)' :
                              'rgb(255, 149, 0)'
                          }}
                          onClick={() => handlePreferenceChange('accentColor', color as any)}
                          aria-label={`${color} accent color`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Font Size */}
                  <div className="px-4 py-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-800 dark:text-white">Font Size</span>
                      <Select 
                        value={preferences.fontSize}
                        onChange={(e) => handlePreferenceChange('fontSize', e.target.value as 'small' | 'medium' | 'large')}
                        maxWidth="150px"
                        size="sm"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Layout settings */}
              <div className="rounded-lg overflow-hidden shadow-sm">
                <div className="bg-white dark:bg-gray-800 px-4 py-2">
                  <h3 className="text-sm uppercase text-gray-500 dark:text-gray-400 font-medium">Layout</h3>
                </div>
                
                <div className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  <div className="flex justify-between items-center px-4 py-3">
                    <div>
                      <span className="text-gray-800 dark:text-white">Sidebar Labels</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Show labels in sidebar navigation</p>
                    </div>
                    <Switch 
                      colorScheme="blue" 
                      isChecked={preferences.sidebarExpanded}
                      onChange={() => handlePreferenceChange('sidebarExpanded', !preferences.sidebarExpanded)}
                    />
                  </div>
                  
                  {/* Layout Density */}
                  <div className="px-4 py-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-800 dark:text-white">Layout Density</span>
                      <Select 
                        value={preferences.layoutDensity}
                        onChange={(e) => handlePreferenceChange('layoutDensity', e.target.value as 'compact' | 'comfortable' | 'spacious')}
                        maxWidth="150px"
                        size="sm"
                      >
                        <option value="compact">Compact</option>
                        <option value="comfortable">Comfortable</option>
                        <option value="spacious">Spacious</option>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Mobile Tab Position */}
                  <div className="px-4 py-3">
                    <div className="mb-2">
                      <span className="text-gray-800 dark:text-white">Navigation Style</span>
                    </div>
                    <RadioGroup 
                      value={preferences.mobileNavStyle} 
                      onChange={(value) => handlePreferenceChange('mobileNavStyle', value as 'bottom' | 'tab')}
                    >
                      <Stack direction="column" spacing={3}>
                        <Radio value="bottom" colorScheme="blue">
                          <div className="flex items-center">
                            <Smartphone className="w-4 h-4 mr-2" />
                            <span className="text-gray-800 dark:text-white">Bottom Tabs</span>
                          </div>
                        </Radio>
                        <Radio value="tab" colorScheme="blue">
                          <div className="flex items-center">
                            <Layout className="w-4 h-4 mr-2" />
                            <span className="text-gray-800 dark:text-white">Top Tabs</span>
                          </div>
                        </Radio>
                      </Stack>
                    </RadioGroup>
                  </div>
                </div>
              </div>
              
              {/* Performance settings */}
              <div className="rounded-lg overflow-hidden shadow-sm">
                <div className="bg-white dark:bg-gray-800 px-4 py-2">
                  <h3 className="text-sm uppercase text-gray-500 dark:text-gray-400 font-medium">Performance</h3>
                </div>
                
                <div className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  <div className="flex justify-between items-center px-4 py-3">
                    <div>
                      <span className="text-gray-800 dark:text-white">Animations</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Enable interface animations</p>
                    </div>
                    <Switch 
                      colorScheme="blue" 
                      isChecked={preferences.enableAnimations}
                      onChange={() => handlePreferenceChange('enableAnimations', !preferences.enableAnimations)}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center px-4 py-3">
                    <div>
                      <span className="text-gray-800 dark:text-white">Haptic Feedback</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Tactile feedback on interactions</p>
                    </div>
                    <Switch 
                      colorScheme="blue" 
                      isChecked={preferences.enableHaptics}
                      onChange={() => handlePreferenceChange('enableHaptics', !preferences.enableHaptics)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Notifications settings */}
              <div className="rounded-lg overflow-hidden shadow-sm">
                <div className="bg-white dark:bg-gray-800 px-4 py-2">
                  <h3 className="text-sm uppercase text-gray-500 dark:text-gray-400 font-medium">Notifications</h3>
                </div>
                
                <div className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  <div className="flex justify-between items-center px-4 py-3">
                    <div>
                      <span className="text-gray-800 dark:text-white">In-App Notifications</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Display notification alerts</p>
                    </div>
                    <Switch 
                      colorScheme="blue" 
                      isChecked={true}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-gray-800 dark:text-white">Portfolio Alerts</span>
                    <Switch colorScheme="blue" defaultChecked />
                  </div>
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-gray-800 dark:text-white">Report Updates</span>
                    <Switch colorScheme="blue" defaultChecked />
                  </div>
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-gray-800 dark:text-white">Market News</span>
                    <Switch colorScheme="blue" defaultChecked />
                  </div>
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-gray-800 dark:text-white">System Updates</span>
                    <Switch colorScheme="blue" defaultChecked />
                  </div>
                </div>
              </div>
              
              {/* Reset button - bottom spaced for home indicator */}
              <div style={{ paddingBottom: hasHomeIndicator ? safeAreaCss.bottom : '1rem' }} className="mt-6 px-4">
                <EnhancedAppleTouchButton
                  variant="destructive"
                  fullWidth={true}
                  onClick={handleResetPreferences}
                  hapticFeedback={preferences.enableHaptics}
                  hapticPattern="warning"
                  pressAnimation={true}
                  rounded="full"
                  safeAreaBottom={true}
                  size="md"
                >
                  Reset All Settings
                </EnhancedAppleTouchButton>
              </div>
            </div>
          ) : (
            /* Standard (non-iOS) settings interface */
            <>
              {/* Enhanced Settings Navigation for non-iOS */}
              <div className="mb-6">
                <EnhancedSettingsNavigation
                  sections={settingsSections}
                  activeSection={settingsSections[activeTab]?.id || 'general'}
                  onSectionChange={handleSectionChange}
                  variant="tabs"
                  showDescriptions={false}
                  className="mb-4"
                />
              </div>
              
              <Tabs 
                variant="enclosed" 
                colorScheme="blue" 
                index={activeTab} 
                onChange={handleTabChange}
                className={`${isMultiTasking ? 'tabs-multitasking' : ''}`}>
                <TabList style={{ display: 'none' }}>
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
                    <div className="space-y-6">
                      <div className="p-4 bg-white dark:bg-gray-700 rounded-md shadow-sm border border-gray-200 dark:border-gray-600">
                        <h2 className="text-lg font-medium text-[rgb(var(--scb-dark-gray))] dark:text-white mb-4">Notification Preferences</h2>
                        
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-medium text-gray-800 dark:text-gray-200">Enable Notifications</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Receive app notifications</p>
                            </div>
                            <Switch 
                              colorScheme="blue"
                              isChecked={preferences.enableNotifications}
                              onChange={() => handlePreferenceChange('enableNotifications', !preferences.enableNotifications)}
                            />
                          </div>
                          
                          <div>
                            <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-3">Notification Types</h3>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                                <div>
                                  <h4 className="font-medium text-gray-800 dark:text-gray-200">Portfolio Alerts</h4>
                                  <p className="text-xs text-gray-600 dark:text-gray-300">Price alerts and portfolio updates</p>
                                </div>
                                <Switch 
                                  colorScheme="blue"
                                  isChecked={notificationPrefs.portfolioAlerts}
                                  isDisabled={!preferences.enableNotifications}
                                  onChange={(e) => handleNotificationChange('portfolioAlerts', e.target.checked)}
                                />
                              </div>
                              
                              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                                <div>
                                  <h4 className="font-medium text-gray-800 dark:text-gray-200">Report Updates</h4>
                                  <p className="text-xs text-gray-600 dark:text-gray-300">New reports and analysis</p>
                                </div>
                                <Switch 
                                  colorScheme="blue"
                                  isChecked={notificationPrefs.reportUpdates}
                                  isDisabled={!preferences.enableNotifications}
                                  onChange={(e) => handleNotificationChange('reportUpdates', e.target.checked)}
                                />
                              </div>
                              
                              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                                <div>
                                  <h4 className="font-medium text-gray-800 dark:text-gray-200">Market News</h4>
                                  <p className="text-xs text-gray-600 dark:text-gray-300">Breaking market news and updates</p>
                                </div>
                                <Switch 
                                  colorScheme="blue"
                                  isChecked={notificationPrefs.marketNews}
                                  isDisabled={!preferences.enableNotifications}
                                  onChange={(e) => handleNotificationChange('marketNews', e.target.checked)}
                                />
                              </div>
                              
                              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                                <div>
                                  <h4 className="font-medium text-gray-800 dark:text-gray-200">System Updates</h4>
                                  <p className="text-xs text-gray-600 dark:text-gray-300">App maintenance and updates</p>
                                </div>
                                <Switch 
                                  colorScheme="blue"
                                  isChecked={notificationPrefs.systemUpdates}
                                  isDisabled={!preferences.enableNotifications}
                                  onChange={(e) => handleNotificationChange('systemUpdates', e.target.checked)}
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="pt-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Notification preferences are saved automatically. Some notifications may require app permissions to be enabled in your device settings.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabPanel>
                </TabPanels>
              </Tabs>
              
              {/* Reset button */}
              <div className={`${isMultiTasking ? 'mt-4' : 'mt-8'} flex justify-between items-center`}>
                <button
                  className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium rounded-md hover:bg-red-50 transition-colors"
                  onClick={handleResetPreferences}
                >
                  Reset to Defaults
                </button>
                
                {/* Save notification */}
                {showSaveNotice && (
                  <div className="bg-green-50 text-green-800 px-4 py-2 rounded-md text-sm flex items-center">
                    <Check className="w-4 h-4 mr-2" />
                    Preferences saved automatically
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </ScbBeautifulUI>
      
      {/* iOS-style confirmation sheet for reset */}
      {isApplePlatform && showConfirmationSheet && (
        <div 
          className="fixed inset-0 z-50 bg-gray-500 bg-opacity-75 flex items-end justify-center"
          onClick={() => setShowConfirmationSheet(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-t-xl w-full max-w-md p-4 pb-8"
            style={{ 
              paddingBottom: hasHomeIndicator ? `calc(1rem + ${safeAreaCss.bottom})` : '1rem',
              boxShadow: '0px -5px 30px rgba(0, 0, 0, 0.16)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4" />
            
            <h3 className="text-lg font-semibold text-center mb-4">
              Reset All Settings?
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              This will restore all settings to their default values. This action cannot be undone.
            </p>
            
            <div className="space-y-3">
              <EnhancedAppleTouchButton
                variant="destructive"
                fullWidth={true}
                onClick={confirmReset}
                hapticFeedback={preferences.enableHaptics}
                hapticPattern="warning"
                rounded="full"
                size="md"
              >
                Reset All Settings
              </EnhancedAppleTouchButton>
              
              <EnhancedAppleTouchButton
                variant="tertiary"
                fullWidth={true}
                onClick={() => setShowConfirmationSheet(false)}
                hapticFeedback={preferences.enableHaptics}
                rounded="full"
                size="md"
              >
                Cancel
              </EnhancedAppleTouchButton>
            </div>
          </div>
        </div>
      )}
      
      {/* iOS success toast */}
      {isApplePlatform && showSaveNotice && (
        <div 
          className={`fixed bottom-0 left-0 right-0 mx-auto w-fit max-w-xs px-4 py-2 mb-6 
            rounded-full bg-[rgba(0,0,0,0.75)] text-white flex items-center justify-center
            shadow-lg z-50 transition-all duration-300
            ${hasHomeIndicator ? `mb-[calc(1.5rem + ${safeAreaCss.bottom})]` : 'mb-6'}`}
          style={{
            backdropFilter: 'blur(4px)',
          }}
        >
          <Check className="w-4 h-4 mr-2" />
          <span className="text-sm">Preferences Updated</span>
        </div>
      )}
    </>
  );
};

export default SettingsPage;