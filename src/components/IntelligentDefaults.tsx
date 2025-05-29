import React, { useState, useEffect } from 'react';
import { useUIPreferences } from '@/context/UIPreferencesContext';

interface IntelligentDefaultsProps {
  onDefaultsApplied?: () => void;
}

/**
 * IntelligentDefaults - Self-Configuring System
 * 
 * Jony Ive Philosophy:
 * 1. "The best interface is no interface" - Configure itself
 * 2. Learn from user behavior without explicit input
 * 3. Provide intelligent defaults that work for 90% of users
 * 4. Only surface settings when truly necessary
 */
const IntelligentDefaults: React.FC<IntelligentDefaultsProps> = ({
  onDefaultsApplied
}) => {
  const { preferences, setPreference } = useUIPreferences();
  const [isLearning, setIsLearning] = useState(true);
  const [detectedContext, setDetectedContext] = useState<any>({});
  
  // Helper function to apply multiple preferences
  const applyIntelligentSettings = (settings: any) => {
    Object.entries(settings).forEach(([key, value]) => {
      setPreference(key, value);
    });
  };
  
  // Intelligent context detection
  useEffect(() => {
    const detectUserContext = () => {
      const context = {
        // Device detection
        isTouch: 'ontouchstart' in window,
        screenSize: {
          width: window.innerWidth,
          height: window.innerHeight,
          ratio: window.devicePixelRatio || 1
        },
        
        // Time-based preferences
        timeOfDay: new Date().getHours(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        
        // Accessibility preferences
        prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        prefersColorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
        prefersContrast: window.matchMedia('(prefers-contrast: high)').matches ? 'high' : 'normal',
        
        // Network conditions
        connection: (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection,
        
        // Language and locale
        language: navigator.language,
        languages: navigator.languages,
        
        // Hardware capabilities
        memory: (navigator as any).deviceMemory,
        cores: navigator.hardwareConcurrency,
        
        // Battery (if available)
        battery: null
      };
      
      // Get battery info if available
      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
          context.battery = {
            level: battery.level,
            charging: battery.charging
          };
          setDetectedContext(context);
        });
      } else {
        setDetectedContext(context);
      }
    };
    
    detectUserContext();
    
    // Re-detect on window resize
    const handleResize = () => {
      detectUserContext();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Apply intelligent defaults based on detected context
  useEffect(() => {
    if (Object.keys(detectedContext).length === 0) return;
    
    const intelligentSettings = generateIntelligentSettings(detectedContext);
    
    // Only update if current preferences are default/empty
    const shouldApplyDefaults = !preferences.hasBeenCustomized;
    
    if (shouldApplyDefaults) {
      applyIntelligentSettings({
        ...intelligentSettings,
        hasBeenCustomized: false // Mark as intelligent defaults, not user customization
      });
      
      setTimeout(() => {
        setIsLearning(false);
        onDefaultsApplied?.();
      }, 2000);
    } else {
      setIsLearning(false);
    }
  }, [detectedContext, preferences.hasBeenCustomized]);
  
  // Generate intelligent settings based on context
  const generateIntelligentSettings = (context: any) => {
    const settings: any = {};
    
    // Theme based on time and system preference
    if (context.prefersColorScheme === 'dark' || 
        (context.timeOfDay >= 18 || context.timeOfDay <= 6)) {
      settings.theme = 'dark';
    } else {
      settings.theme = 'light';
    }
    
    // Layout density based on screen size and touch capability
    if (context.isTouch && context.screenSize.width < 768) {
      settings.layoutDensity = 'comfortable'; // More touch-friendly
      settings.mobileNavStyle = 'bottom';
    } else if (context.screenSize.width > 1440) {
      settings.layoutDensity = 'spacious'; // Use space on large screens
      settings.sidebarExpanded = true;
    } else {
      settings.layoutDensity = 'comfortable';
      settings.sidebarExpanded = false;
    }
    
    // Font size based on screen ratio and accessibility
    if (context.screenSize.ratio > 2 || context.prefersContrast === 'high') {
      settings.fontSize = 'large';
    } else if (context.screenSize.width < 480) {
      settings.fontSize = 'medium'; // Readable on small screens
    } else {
      settings.fontSize = 'medium';
    }
    
    // Animation preferences based on system settings and performance
    if (context.prefersReducedMotion || 
        (context.connection && context.connection.effectiveType === 'slow-2g') ||
        (context.memory && context.memory < 4)) {
      settings.enableAnimations = false;
      settings.enableHaptics = false;
    } else {
      settings.enableAnimations = true;
      settings.enableHaptics = context.isTouch;
    }
    
    // Header style based on context
    if (context.timeOfDay >= 9 && context.timeOfDay <= 17) {
      settings.headerStyle = 'white'; // Professional during work hours
    } else {
      settings.headerStyle = 'blue'; // Brand emphasis
    }
    
    // Navigation preferences based on usage patterns
    settings.showLabels = context.screenSize.width > 1024; // Labels on larger screens
    settings.hideTestPages = true; // Clean interface by default
    settings.hideMobilePages = !context.isTouch; // Hide mobile pages on desktop
    
    // Performance optimizations
    if (context.connection && 
        (context.connection.effectiveType === 'slow-2g' || 
         context.connection.effectiveType === '2g')) {
      settings.enableBackgroundSync = false;
      settings.enableRealTimeUpdates = false;
    } else {
      settings.enableBackgroundSync = true;
      settings.enableRealTimeUpdates = true;
    }
    
    // Workspace preferences based on screen real estate
    if (context.screenSize.width > 1920) {
      settings.multiPanelView = true;
      settings.enablePictureInPicture = true;
    } else {
      settings.multiPanelView = false;
      settings.enablePictureInPicture = false;
    }
    
    // Language and formatting
    settings.language = context.language;
    settings.dateFormat = getDateFormatForLocale(context.language);
    settings.numberFormat = getNumberFormatForLocale(context.language);
    
    // Smart notifications based on time
    if (context.timeOfDay >= 22 || context.timeOfDay <= 7) {
      settings.quietHours = true;
      settings.notificationBadges = false;
    } else {
      settings.quietHours = false;
      settings.notificationBadges = true;
    }
    
    return settings;
  };
  
  // Helper functions for locale-based formatting
  const getDateFormatForLocale = (locale: string) => {
    const region = locale.split('-')[1] || locale;
    const usRegions = ['US', 'CA', 'PH'];
    return usRegions.includes(region) ? 'MM/DD/YYYY' : 'DD/MM/YYYY';
  };
  
  const getNumberFormatForLocale = (locale: string) => {
    try {
      const formatter = new Intl.NumberFormat(locale);
      const parts = formatter.formatToParts(1234.56);
      const decimal = parts.find(p => p.type === 'decimal')?.value || '.';
      const group = parts.find(p => p.type === 'group')?.value || ',';
      return { decimal, group };
    } catch {
      return { decimal: '.', group: ',' };
    }
  };
  
  // Learning indicator for user feedback
  if (isLearning) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl max-w-md mx-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-pulse" />
              <div className="absolute inset-2 rounded-full bg-blue-500/40 animate-pulse animation-delay-300" />
              <div className="absolute inset-4 rounded-full bg-blue-500 animate-pulse animation-delay-600" />
            </div>
            
            <h3 className="perfect-h4 mb-2">Personalizing Your Experience</h3>
            <p className="perfect-body-small text-gray-600 dark:text-gray-400">
              Configuring optimal settings based on your device and preferences...
            </p>
            
            <div className="mt-6 space-y-2 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="perfect-caption">Detecting device capabilities</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="perfect-caption">Analyzing display preferences</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="perfect-caption">Optimizing performance settings</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
};

export default IntelligentDefaults;