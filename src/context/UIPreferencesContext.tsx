import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

// Define the UI preferences interface
export interface UIPreferences {
  // Layout preferences
  sidebarExpanded: boolean;
  layoutDensity: 'compact' | 'comfortable' | 'spacious';
  headerStyle: 'white' | 'blue';
  
  // Theme preferences
  theme: 'light' | 'dark' | 'system';
  accentColor: 'blue' | 'green' | 'purple' | 'teal' | 'orange' | 'indigo' | 'pink';
  
  // Navigation preferences
  showLabels: boolean;
  mobileNavStyle: 'bottom' | 'tab';
  
  // Content preferences
  enableAnimations: boolean;
  enableHaptics: boolean;
  enableNotifications: boolean;
  fontSize: 'small' | 'medium' | 'large';
  
  // Feature toggles
  enableNewsBar: boolean;
  enableSearchBar: boolean;
  enableJouleAssistant: boolean;
  
  // Chart preferences
  chartColorPalette: 'standard' | 'colorblind' | 'monochrome' | 'pastel';
  chartTheme: 'light' | 'dark' | 'system';
  chartLegendPosition: 'top' | 'bottom' | 'left' | 'right';
  
  // Notification preferences
  notificationPrefs: {
    portfolioAlerts: boolean;
    reportUpdates: boolean;
    marketNews: boolean;
    systemUpdates: boolean;
  };
}

// Default preferences
const defaultPreferences: UIPreferences = {
  sidebarExpanded: true,
  layoutDensity: 'comfortable',
  headerStyle: 'white',
  
  theme: 'system',
  accentColor: 'blue',
  
  showLabels: true,
  mobileNavStyle: 'bottom',
  
  enableAnimations: true,
  enableHaptics: true,
  enableNotifications: true,
  fontSize: 'medium',
  
  enableNewsBar: true,
  enableSearchBar: true,
  enableJouleAssistant: true,
  
  chartColorPalette: 'standard',
  chartTheme: 'system',
  chartLegendPosition: 'bottom',
  
  notificationPrefs: {
    portfolioAlerts: true,
    reportUpdates: true,
    marketNews: true,
    systemUpdates: true
  }
};

// Create the context
interface UIPreferencesContextType {
  preferences: UIPreferences;
  setPreference: <K extends keyof UIPreferences>(key: K, value: UIPreferences[K]) => void;
  resetPreferences: () => void;
  savePreferences: () => void;
  isDarkMode: boolean;
}

const UIPreferencesContext = createContext<UIPreferencesContextType | undefined>(undefined);

// Storage key for local storage
const STORAGE_KEY = 'scb-sapphire-ui-preferences';

export const UIPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state with default values
  const [preferences, setPreferences] = useState<UIPreferences>(defaultPreferences);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Load preferences from local storage on initial mount
  useEffect(() => {
    const loadPreferences = () => {
      try {
        const savedPreferences = localStorage.getItem(STORAGE_KEY);
        if (savedPreferences) {
          const parsedPreferences = JSON.parse(savedPreferences);
          setPreferences(prev => ({
            ...prev,
            ...parsedPreferences
          }));
        }
      } catch (error) {
        console.error('Error loading UI preferences:', error);
      }
    };
    
    if (typeof window !== 'undefined') {
      loadPreferences();
    }
  }, []);
  
  // Set up system theme preference listener once
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Initial check
      const systemPrefersDark = mediaQuery.matches;
      
      // Handler for preference changes
      const handleSystemThemeChange = (e: MediaQueryListEvent) => {
        if (preferences.theme === 'system') {
          setIsDarkMode(e.matches);
        }
      };
      
      // Add listener
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      
      // Cleanup
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }
  }, [preferences.theme]); // Only recreate when theme preference changes
  
  // Update dark mode based on preferences
  useEffect(() => {
    const { theme } = preferences;
    
    if (theme === 'dark') {
      setIsDarkMode(true);
      return;
    }
    
    if (theme === 'light') {
      setIsDarkMode(false);
      return;
    }
    
    // For 'system' theme, check system preference
    if (typeof window !== 'undefined') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(systemPrefersDark);
    }
  }, [preferences.theme]);
  
  // Apply theme to document with smooth transitions
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Add transition class first
      document.documentElement.classList.add('theme-transition');
      
      // Toggle dark mode class
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Remove transition class after the transition completes to avoid interfering with other animations
      const transitionTimeout = setTimeout(() => {
        document.documentElement.classList.remove('theme-transition');
      }, 300); // Should match the transition duration in CSS
      
      return () => clearTimeout(transitionTimeout);
    }
  }, [isDarkMode]);
  
  // Update a single preference - memoized to avoid recreating on every render
  const setPreference = useCallback(<K extends keyof UIPreferences>(key: K, value: UIPreferences[K]) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Save to local storage
    try {
      if (typeof window !== 'undefined') {
        const updatedPreferences = {
          ...preferences,
          [key]: value
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPreferences));
      }
    } catch (error) {
      console.error('Error saving UI preferences:', error);
    }
  }, [preferences]);
  
  // Reset all preferences to defaults - memoized
  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
    
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error resetting UI preferences:', error);
    }
  }, []);
  
  // Save all current preferences to storage - memoized
  const savePreferences = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      }
    } catch (error) {
      console.error('Error saving UI preferences:', error);
    }
  }, [preferences]);
  
  // Memoize context value to prevent unnecessary renders
  const contextValue = useMemo(() => ({
    preferences,
    setPreference,
    resetPreferences,
    savePreferences,
    isDarkMode
  }), [preferences, setPreference, resetPreferences, savePreferences, isDarkMode]);
  
  return (
    <UIPreferencesContext.Provider value={contextValue}>
      {children}
    </UIPreferencesContext.Provider>
  );
};

// Custom hook for using UI preferences
export const useUIPreferences = () => {
  const context = useContext(UIPreferencesContext);
  if (context === undefined) {
    throw new Error('useUIPreferences must be used within a UIPreferencesProvider');
  }
  return context;
};

export default UIPreferencesContext;