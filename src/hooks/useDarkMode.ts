import { useState, useEffect } from 'react';

type DarkModePreference = 'system' | 'light' | 'dark';

/**
 * Hook to manage dark mode preferences and provide theme toggling functionality.
 * Supports system preference detection, manual override, and persistence.
 * 
 * @param defaultPreference - Optional default preference ('system', 'light', 'dark')
 * @returns Object with current theme state and toggle functions
 */
export function useDarkMode(defaultPreference: DarkModePreference = 'system') {
  // Get stored preference or fall back to default
  const getInitialPreference = (): DarkModePreference => {
    // Check localStorage first (if available)
    if (typeof window !== 'undefined') {
      const storedPreference = localStorage.getItem('scb-theme-preference') as DarkModePreference | null;
      if (storedPreference) {
        return storedPreference;
      }
    }
    return defaultPreference;
  };

  // State for the user's preference
  const [preference, setPreference] = useState<DarkModePreference>(getInitialPreference());
  
  // State for the actual mode (accounting for system preference)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Apply theme to document
  useEffect(() => {
    // Skip during SSR
    if (typeof window === 'undefined') return;

    // Function to check system preference
    const getSystemPreference = (): boolean => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    };

    // Function to apply theme to DOM
    const applyTheme = () => {
      const shouldUseDarkMode = 
        preference === 'dark' ||
        (preference === 'system' && getSystemPreference());
      
      setIsDarkMode(shouldUseDarkMode);
      
      // Apply to document
      if (shouldUseDarkMode) {
        document.documentElement.classList.add('dark-mode');
        document.documentElement.classList.remove('light-mode');
      } else {
        document.documentElement.classList.remove('dark-mode');
        document.documentElement.classList.add('light-mode');
      }
      
      // Optional: Update meta theme-color for mobile browsers
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute(
          'content',
          shouldUseDarkMode ? '#1E202A' : '#F5F7FA'
        );
      }
    };

    // Apply theme initially
    applyTheme();

    // Store preference
    localStorage.setItem('scb-theme-preference', preference);

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (preference === 'system') {
        applyTheme();
      }
    };

    // Use the modern API if available, otherwise fallback
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // @ts-ignore - Old API for backwards compatibility
      mediaQuery.addListener(handleChange);
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // @ts-ignore - Old API for backwards compatibility
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [preference]);

  // Function to toggle between light and dark mode
  const toggle = () => {
    const newPreference: DarkModePreference = isDarkMode ? 'light' : 'dark';
    setPreference(newPreference);
  };

  // Function to set preference explicitly
  const setMode = (newPreference: DarkModePreference) => {
    setPreference(newPreference);
  };

  return {
    isDarkMode,
    preference,
    toggle,
    setMode
  };
}

export default useDarkMode;