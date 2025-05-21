import { useState, useEffect } from 'react';

/**
 * Hook that tracks the user's motion preference
 * Uses the prefers-reduced-motion media query to check if the user has requested reduced motion
 * Handles SSR by checking window only in useEffect
 * 
 * @returns Boolean indicating if reduced motion is preferred
 */
export function useReducedMotion(): boolean {
  // Default to false for SSR
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  
  useEffect(() => {
    // Check if user has set a preference in localStorage (overrides system)
    const userPreference = localStorage.getItem('scb-reduced-motion-preference');
    if (userPreference !== null) {
      setPrefersReducedMotion(userPreference === 'true');
      return;
    }
    
    // Check for system preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Update state with current preference
    setPrefersReducedMotion(mediaQuery.matches);
    
    // Handler for changes to the preference
    const handleMediaChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    
    // Add listener for preference changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else {
      // Fallback for older browsers
      // @ts-ignore - Old API
      mediaQuery.addListener(handleMediaChange);
    }
    
    // Clean up
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else {
        // @ts-ignore - Old API
        mediaQuery.removeListener(handleMediaChange);
      }
    };
  }, []);
  
  return prefersReducedMotion;
}

/**
 * Extended hook that provides both the preference state and functions to manage it
 * 
 * @returns Object with preference state and management functions
 */
export function useReducedMotionPreference() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const [source, setSource] = useState<'system' | 'user'>('system');
  
  useEffect(() => {
    // Check if user has set a preference
    const userPreference = localStorage.getItem('scb-reduced-motion-preference');
    if (userPreference !== null) {
      setPrefersReducedMotion(userPreference === 'true');
      setSource('user');
      return;
    }
    
    // Check for system preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    setSource('system');
    
    // Handler for changes
    const handleMediaChange = (event: MediaQueryListEvent) => {
      // Only update if we're using system preference
      if (source === 'system') {
        setPrefersReducedMotion(event.matches);
      }
    };
    
    // Add listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else {
      // @ts-ignore - Old API
      mediaQuery.addListener(handleMediaChange);
    }
    
    // Clean up
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else {
        // @ts-ignore - Old API
        mediaQuery.removeListener(handleMediaChange);
      }
    };
  }, [source]);
  
  // Function to enable reduced motion
  const enableReducedMotion = () => {
    localStorage.setItem('scb-reduced-motion-preference', 'true');
    setPrefersReducedMotion(true);
    setSource('user');
  };
  
  // Function to disable reduced motion
  const disableReducedMotion = () => {
    localStorage.setItem('scb-reduced-motion-preference', 'false');
    setPrefersReducedMotion(false);
    setSource('user');
  };
  
  // Function to reset to system preference
  const resetToSystemPreference = () => {
    localStorage.removeItem('scb-reduced-motion-preference');
    const systemPreference = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setPrefersReducedMotion(systemPreference);
    setSource('system');
  };
  
  return {
    prefersReducedMotion,
    source,
    enableReducedMotion,
    disableReducedMotion,
    resetToSystemPreference
  };
}

// Utility function to get transition styles based on motion preference
export function getReducedMotionTransition(
  defaultTransition: string, 
  prefersReduced: boolean = false
): string {
  if (prefersReduced) {
    return 'none'; // No transition for reduced motion
  }
  return defaultTransition;
}

// Utility function to get animation styles based on motion preference
export function getReducedMotionAnimation(
  defaultAnimation: string,
  prefersReduced: boolean = false
): string {
  if (prefersReduced) {
    return 'none'; // No animation for reduced motion
  }
  return defaultAnimation;
}

// Utility function to get transform styles based on motion preference
export function getReducedMotionTransform(
  defaultTransform: string,
  reducedTransform: string = 'none',
  prefersReduced: boolean = false
): string {
  if (prefersReduced) {
    return reducedTransform;
  }
  return defaultTransform;
}

export default useReducedMotion;