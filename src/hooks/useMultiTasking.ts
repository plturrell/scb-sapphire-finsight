import { useState, useEffect, useCallback } from 'react';

export type MultiTaskingMode = 
  | 'fullscreen' 
  | 'split-view' 
  | 'slide-over' 
  | 'stage-manager' 
  | 'picture-in-picture'
  | 'unknown';

export type WindowSizeClass = 
  | 'compact' 
  | 'medium' 
  | 'expanded';

export type MultiTaskingState = {
  mode: MultiTaskingMode;
  sizeClass: WindowSizeClass;
  isMultiTasking: boolean;
  isPrimary: boolean;
  windowWidth: number;
  windowHeight: number;
  aspectRatio: number;
  orientation: 'portrait' | 'landscape';
  isStageManager: boolean;
  hasFocus: boolean;
};

/**
 * Hook to detect and respond to iPad multi-tasking modes
 * Supports Split View, Slide Over, and Stage Manager on iPadOS
 */
export function useMultiTasking(): MultiTaskingState {
  const [state, setState] = useState<MultiTaskingState>(() => {
    // Initial state based on window dimensions
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
    const aspectRatio = windowWidth / windowHeight;
    
    return {
      mode: 'fullscreen',
      sizeClass: 'expanded',
      isMultiTasking: false,
      isPrimary: true,
      windowWidth,
      windowHeight,
      aspectRatio,
      orientation: windowWidth > windowHeight ? 'landscape' : 'portrait',
      isStageManager: false,
      hasFocus: typeof document !== 'undefined' ? document.hasFocus() : true
    };
  });

  // Detect iPad
  const isIPad = useCallback(() => {
    if (typeof navigator === 'undefined') return false;
    
    // Check for iPad specifically
    const isIpadOS = /iPad/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && 
       navigator.maxTouchPoints > 1 &&
       !navigator.userAgent.includes('iPhone'));
    
    return isIpadOS;
  }, []);

  // Determine multi-tasking mode based on window dimensions
  const determineMultiTaskingMode = useCallback((width: number, height: number): MultiTaskingState => {
    const aspectRatio = width / height;
    const orientation = width > height ? 'landscape' : 'portrait';
    
    // Only apply iPad multi-tasking detection on iPad devices
    if (!isIPad()) {
      return {
        mode: 'fullscreen',
        sizeClass: width < 768 ? 'compact' : width < 1024 ? 'medium' : 'expanded',
        isMultiTasking: false,
        isPrimary: true,
        windowWidth: width,
        windowHeight: height,
        aspectRatio,
        orientation,
        isStageManager: false,
        hasFocus: typeof document !== 'undefined' ? document.hasFocus() : true
      };
    }
    
    // Base size class before considering multitasking
    let sizeClass: WindowSizeClass = 'expanded';
    if (width < 768) {
      sizeClass = 'compact';
    } else if (width < 1024) {
      sizeClass = 'medium';
    }
    
    // Check for Picture-in-Picture
    if (document.querySelector('video:picture-in-picture')) {
      return {
        mode: 'picture-in-picture',
        sizeClass,
        isMultiTasking: true,
        isPrimary: true,
        windowWidth: width,
        windowHeight: height,
        aspectRatio,
        orientation,
        isStageManager: false,
        hasFocus: typeof document !== 'undefined' ? document.hasFocus() : true
      };
    }
    
    // iPadOS 16+ Stage Manager detection (approximate based on window dimensions)
    // Stage Manager windows are freely resizable but have min/max constraints
    const isStageManager = isIPad() && 
      width < window.screen.width * 0.95 && 
      height < window.screen.height * 0.95 &&
      width > 400 && // Minimum Stage Manager window width
      window.visualViewport?.scale === 1;
    
    if (isStageManager) {
      return {
        mode: 'stage-manager',
        sizeClass,
        isMultiTasking: true,
        isPrimary: true, // Can't reliably detect if primary in Stage Manager
        windowWidth: width,
        windowHeight: height,
        aspectRatio,
        orientation,
        isStageManager: true,
        hasFocus: typeof document !== 'undefined' ? document.hasFocus() : true
      };
    }
    
    // Split View detection (approximate)
    // In Split View, window width is roughly 50-70% of screen width (primary)
    // or 30-50% (secondary)
    const screenWidth = window.screen.width;
    const widthRatio = width / screenWidth;
    
    if (widthRatio < 0.85 && widthRatio > 0.25) {
      const isPrimarySplitView = widthRatio >= 0.5;
      return {
        mode: 'split-view',
        sizeClass,
        isMultiTasking: true,
        isPrimary: isPrimarySplitView,
        windowWidth: width,
        windowHeight: height,
        aspectRatio,
        orientation,
        isStageManager: false,
        hasFocus: typeof document !== 'undefined' ? document.hasFocus() : true
      };
    }
    
    // Slide Over detection (approximate)
    // Slide Over typically has a narrower width (~320-375px)
    if (width < 400 && width >= 280) {
      return {
        mode: 'slide-over',
        sizeClass: 'compact',
        isMultiTasking: true,
        isPrimary: false,
        windowWidth: width,
        windowHeight: height,
        aspectRatio,
        orientation,
        isStageManager: false,
        hasFocus: typeof document !== 'undefined' ? document.hasFocus() : true
      };
    }
    
    // Default to fullscreen
    return {
      mode: 'fullscreen',
      sizeClass,
      isMultiTasking: false,
      isPrimary: true,
      windowWidth: width,
      windowHeight: height,
      aspectRatio,
      orientation,
      isStageManager: false,
      hasFocus: typeof document !== 'undefined' ? document.hasFocus() : true
    };
  }, [isIPad]);

  // Update dimensions on resize
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    
    const handleResize = () => {
      const updatedState = determineMultiTaskingMode(window.innerWidth, window.innerHeight);
      setState(updatedState);
    };
    
    const handleVisibilityChange = () => {
      setState(prev => ({
        ...prev,
        hasFocus: document.visibilityState === 'visible'
      }));
    };
    
    const handleFocus = () => {
      setState(prev => ({
        ...prev,
        hasFocus: true
      }));
    };
    
    const handleBlur = () => {
      setState(prev => ({
        ...prev,
        hasFocus: false
      }));
    };
    
    // Set initial state
    handleResize();
    
    // Add event listeners
    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    // Handle iPad-specific orientation changes
    if (isIPad()) {
      window.addEventListener('orientationchange', handleResize);
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      
      if (isIPad()) {
        window.removeEventListener('orientationchange', handleResize);
      }
    };
  }, [determineMultiTaskingMode, isIPad]);

  return state;
}

export default useMultiTasking;