import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the UI preferences interface
export interface UIPreferences {
  // Layout preferences
  sidebarExpanded: boolean;
  layoutDensity: 'compact' | 'comfortable' | 'spacious';
  headerStyle: 'white' | 'blue';
  
  // Theme preferences
  theme: 'light' | 'dark' | 'system';
  accentColor: 'blue' | 'green' | 'purple' | 'teal' | 'orange';
  
  // Navigation preferences
  showLabels: boolean;
  mobileNavStyle: 'bottom' | 'tab';
  
  // Content preferences
  enableAnimations: boolean;
  enableHaptics: boolean;
  fontSize: 'small' | 'medium' | 'large';
  
  // Feature toggles
  enableNewsBar: boolean;
  enableSearchBar: boolean;
  enableJouleAssistant: boolean;
  
  // Chart preferences
  chartColorPalette: 'standard' | 'colorblind' | 'monochrome' | 'pastel';
  chartTheme: 'light' | 'dark' | 'system';
  chartLegendPosition: 'top' | 'bottom' | 'left' | 'right';
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
  fontSize: 'medium',
  
  enableNewsBar: true,
  enableSearchBar: true,
  enableJouleAssistant: true,
  
  chartColorPalette: 'standard',
  chartTheme: 'system',
  chartLegendPosition: 'bottom'
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
  
  // Update dark mode based on preferences and system preference
  useEffect(() => {
    const updateDarkMode = () => {
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
        
        // Add listener for system preference changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
          setIsDarkMode(e.matches);
        };
        
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      }
    };
    
    updateDarkMode();
  }, [preferences.theme]);
  
  // Apply theme to document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [isDarkMode]);
  
  // Update a single preference
  const setPreference = <K extends keyof UIPreferences>(key: K, value: UIPreferences[K]) => {
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
  };
  
  // Reset all preferences to defaults
  const resetPreferences = () => {
    setPreferences(defaultPreferences);
    
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error resetting UI preferences:', error);
    }
  };
  
  // Save all current preferences to storage
  const savePreferences = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      }
    } catch (error) {
      console.error('Error saving UI preferences:', error);
    }
  };
  
  return (
    <UIPreferencesContext.Provider 
      value={{ 
        preferences, 
        setPreference, 
        resetPreferences, 
        savePreferences,
        isDarkMode
      }}
    >
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