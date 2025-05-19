import { useState, useEffect } from 'react';

interface BreakpointConfig {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
}

interface ResponsiveState {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  currentBreakpoint: keyof BreakpointConfig;
}

const defaultBreakpoints: BreakpointConfig = {
  xs: 375,
  sm: 390,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  '3xl': 1920,
};

export function useResponsive(customBreakpoints?: Partial<BreakpointConfig>): ResponsiveState {
  const breakpoints = { ...defaultBreakpoints, ...customBreakpoints };
  
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return {
        width: 0,
        height: 0,
        isMobile: false,
        isTablet: false,
        isDesktop: false,
        isLargeDesktop: false,
        currentBreakpoint: 'xs',
      };
    }
    
    return calculateResponsiveState(window.innerWidth, window.innerHeight, breakpoints);
  });

  useEffect(() => {
    const handleResize = () => {
      setState(calculateResponsiveState(window.innerWidth, window.innerHeight, breakpoints));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [breakpoints]);

  return state;
}

function calculateResponsiveState(
  width: number,
  height: number,
  breakpoints: BreakpointConfig
): ResponsiveState {
  let currentBreakpoint: keyof BreakpointConfig = 'xs';
  
  if (width >= breakpoints['3xl']) currentBreakpoint = '3xl';
  else if (width >= breakpoints['2xl']) currentBreakpoint = '2xl';
  else if (width >= breakpoints.xl) currentBreakpoint = 'xl';
  else if (width >= breakpoints.lg) currentBreakpoint = 'lg';
  else if (width >= breakpoints.md) currentBreakpoint = 'md';
  else if (width >= breakpoints.sm) currentBreakpoint = 'sm';
  
  return {
    width,
    height,
    isMobile: width < breakpoints.md,
    isTablet: width >= breakpoints.md && width < breakpoints.lg,
    isDesktop: width >= breakpoints.lg,
    isLargeDesktop: width >= breakpoints['2xl'],
    currentBreakpoint,
  };
}

// Hook for detecting iOS device
export function useIOS(): boolean {
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const checkIOS = () => {
      const userAgent = window.navigator.userAgent;
      const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
      const isIPadOS = navigator.maxTouchPoints > 1 && /Mac/.test(userAgent);
      
      setIsIOS(isIOSDevice || isIPadOS);
    };

    checkIOS();
  }, []);

  return isIOS;
}

// Hook for handling safe area insets
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    const updateSafeArea = () => {
      const root = document.documentElement;
      
      setSafeArea({
        top: parseInt(getComputedStyle(root).getPropertyValue('padding-top') || '0'),
        bottom: parseInt(getComputedStyle(root).getPropertyValue('padding-bottom') || '0'),
        left: parseInt(getComputedStyle(root).getPropertyValue('padding-left') || '0'),
        right: parseInt(getComputedStyle(root).getPropertyValue('padding-right') || '0'),
      });
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    window.addEventListener('orientationchange', updateSafeArea);
    
    return () => {
      window.removeEventListener('resize', updateSafeArea);
      window.removeEventListener('orientationchange', updateSafeArea);
    };
  }, []);

  return safeArea;
}

// Hook for media query matching
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    setMatches(mediaQuery.matches);
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else {
      // Fallback for older browsers
      (mediaQuery as any).addListener(handler);
    }
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handler);
      } else {
        // Fallback for older browsers
        (mediaQuery as any).removeListener(handler);
      }
    };
  }, [query]);

  return matches;
}