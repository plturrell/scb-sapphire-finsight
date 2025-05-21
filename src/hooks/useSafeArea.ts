import { useState, useEffect } from 'react';
import { useDeviceCapabilities } from './useDeviceCapabilities';

// Interface for environment safe areas
export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
  // Dynamic island specific insets (for iPhone 14 Pro and newer)
  dynamicIsland?: {
    top: number;
    height: number;
    width: number;
  };
  // Inset for home indicator (for iPhone X and newer)
  homeIndicator?: number;
  // iPad Pencil region (usually on right side in landscape)
  pencilRegion?: {
    right: number;
    width: number;
  };
  // Stage Manager padding for macOS/iPadOS
  stageManager?: {
    top: number;
    left: number;
    right: number;
    bottom: number;
  };
}

// Default safe areas for different device types
const DEFAULT_SAFE_AREAS: Record<string, SafeAreaInsets> = {
  // Modern iPhones with notch/dynamic island
  iphoneModern: {
    top: 47, // Status bar + notch
    right: 0,
    bottom: 34, // Home indicator
    left: 0,
    dynamicIsland: {
      top: 59,
      height: 37,
      width: 120
    },
    homeIndicator: 34
  },
  // Older iPhones with home button
  iphoneLegacy: {
    top: 20, // Status bar
    right: 0,
    bottom: 0,
    left: 0
  },
  // iPad in portrait
  ipadPortrait: {
    top: 24, // Status bar
    right: 0,
    bottom: 20, // Home indicator on newer models
    left: 0,
    pencilRegion: {
      right: 0,
      width: 0 // No pencil region in portrait
    }
  },
  // iPad in landscape
  ipadLandscape: {
    top: 24, // Status bar
    right: 20, // Pencil charging area on some iPads
    bottom: 20, // Home indicator on newer models
    left: 0,
    pencilRegion: {
      right: 20,
      width: 30
    }
  },
  // iPad in Stage Manager (iPadOS 16+)
  ipadStageManager: {
    top: 24,
    right: 20,
    bottom: 20,
    left: 20,
    stageManager: {
      top: 40,
      left: 40,
      right: 40,
      bottom: 40
    },
    pencilRegion: {
      right: 20,
      width: 30
    }
  },
  // macOS desktop
  desktop: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    stageManager: {
      top: 28,
      left: 28,
      right: 28,
      bottom: 28
    }
  }
};

// Options for the hook
export interface SafeAreaOptions {
  // Whether to use CSS variables for safe areas (recommended)
  useCssVariables?: boolean;
  // Enable support for dynamic island on latest iPhones
  enableDynamicIsland?: boolean;
  // Enable support for Stage Manager on macOS/iPadOS
  enableStageManager?: boolean;
  // Enable support for iPad Pencil region
  enablePencilRegion?: boolean;
}

/**
 * Hook to manage safe area insets for different Apple devices
 * Detects device type and orientation to provide the appropriate insets
 */
export function useSafeArea(options: SafeAreaOptions = {}): {
  safeArea: SafeAreaInsets;
  orientation: 'portrait' | 'landscape';
  hasDynamicIsland: boolean;
  hasHomeIndicator: boolean;
  cssVariables: Record<string, string>;
} {
  const {
    useCssVariables = true,
    enableDynamicIsland = true,
    enableStageManager = true,
    enablePencilRegion = true
  } = options;

  const { deviceType, isAppleDevice, isMobileDevice } = useDeviceCapabilities();
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [safeArea, setSafeArea] = useState<SafeAreaInsets>(DEFAULT_SAFE_AREAS.desktop);
  
  // Detect device model for specialized insets
  const [deviceModel, setDeviceModel] = useState<string>('unknown');
  const [hasDynamicIsland, setHasDynamicIsland] = useState<boolean>(false);
  const [hasHomeIndicator, setHasHomeIndicator] = useState<boolean>(false);
  
  // CSS variables for easier consumption in components
  const [cssVariables, setCssVariables] = useState<Record<string, string>>({});

  // Update orientation on window resize or orientation change
  useEffect(() => {
    const updateOrientation = () => {
      if (typeof window !== 'undefined') {
        const isLandscape = window.innerWidth > window.innerHeight;
        setOrientation(isLandscape ? 'landscape' : 'portrait');
      }
    };

    // Initial update
    updateOrientation();

    // Listen for orientation changes and resizes
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateOrientation);
      window.addEventListener('orientationchange', updateOrientation);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', updateOrientation);
        window.removeEventListener('orientationchange', updateOrientation);
      }
    };
  }, []);

  // Detect device model and features
  useEffect(() => {
    const detectDeviceModel = () => {
      if (typeof window === 'undefined' || !isAppleDevice) return;
      
      const userAgent = window.navigator.userAgent;
      
      // Detect iPhone model
      if (userAgent.includes('iPhone')) {
        // Dynamic Island detection (iPhone 14 Pro and newer)
        if (
          userAgent.includes('iPhone14,4') || // iPhone 14 Pro
          userAgent.includes('iPhone14,5') || // iPhone 14 Pro Max
          userAgent.includes('iPhone15,') || // iPhone 15 series
          userAgent.includes('iPhone16,') || // iPhone 16 series (future)
          // Using screen width to approximate newer models
          (window.screen.width === 393 && window.devicePixelRatio === 3) ||
          (window.screen.width === 430 && window.devicePixelRatio === 3)
        ) {
          setDeviceModel('iPhoneWithDynamicIsland');
          setHasDynamicIsland(true);
          setHasHomeIndicator(true);
        } 
        // Notch detection (iPhone X through 14)
        else if (
          userAgent.includes('iPhone10,') || // iPhone X
          userAgent.includes('iPhone11,') || // iPhone XS/XR
          userAgent.includes('iPhone12,') || // iPhone 11
          userAgent.includes('iPhone13,') || // iPhone 12/13
          userAgent.includes('iPhone14,') || // iPhone 14
          // Using screen dimensions to approximate
          (window.screen.height === 812 || window.screen.height === 844 ||
          window.screen.height === 896 || window.screen.height === 926)
        ) {
          setDeviceModel('iPhoneWithNotch');
          setHasDynamicIsland(false);
          setHasHomeIndicator(true);
        } else {
          setDeviceModel('iPhoneLegacy');
          setHasDynamicIsland(false);
          setHasHomeIndicator(false);
        }
      } 
      // Detect iPad model
      else if (userAgent.includes('iPad')) {
        // Modern iPads with home indicator
        if (
          userAgent.includes('iPad8,') || // iPad Pro 2018
          userAgent.includes('iPad13,') || // iPad Pro 2021
          userAgent.includes('iPad14,') || // iPad Pro 2022
          userAgent.includes('iPad15,') // Future iPads
        ) {
          setDeviceModel('iPadModern');
          setHasHomeIndicator(true);
        } else {
          setDeviceModel('iPadLegacy');
          setHasHomeIndicator(false);
        }
      } 
      // Detect Mac
      else if (userAgent.includes('Macintosh')) {
        setDeviceModel('Mac');
        setHasDynamicIsland(false);
        setHasHomeIndicator(false);
      }
    };
    
    detectDeviceModel();
  }, [isAppleDevice]);

  // Update safe area insets based on device, orientation, and features
  useEffect(() => {
    const getSafeAreaForDevice = () => {
      if (deviceType === 'mobile') {
        if (hasDynamicIsland) {
          return DEFAULT_SAFE_AREAS.iphoneModern;
        } else if (hasHomeIndicator) {
          // Modify for iPhones with notch but no dynamic island
          return {
            ...DEFAULT_SAFE_AREAS.iphoneModern,
            dynamicIsland: undefined
          };
        } else {
          return DEFAULT_SAFE_AREAS.iphoneLegacy;
        }
      } else if (deviceType === 'tablet') {
        if (enableStageManager && detectStageManager()) {
          return DEFAULT_SAFE_AREAS.ipadStageManager;
        } else if (orientation === 'landscape') {
          return DEFAULT_SAFE_AREAS.ipadLandscape;
        } else {
          return DEFAULT_SAFE_AREAS.ipadPortrait;
        }
      } else {
        // Desktop
        if (enableStageManager && detectStageManager()) {
          return DEFAULT_SAFE_AREAS.desktop;
        } else {
          return {
            ...DEFAULT_SAFE_AREAS.desktop,
            stageManager: undefined
          };
        }
      }
    };
    
    // Stage Manager detection (approximation)
    const detectStageManager = () => {
      if (typeof window === 'undefined') return false;
      
      // For macOS Sonoma or iPadOS 16+ with Stage Manager
      // This is an approximation; there's no direct way to detect Stage Manager
      const isIpadOS16Plus = 
        isAppleDevice && 
        deviceType === 'tablet' && 
        navigator.userAgent.includes('Version/16') || 
        navigator.userAgent.includes('Version/17');
        
      const isMacOS = 
        isAppleDevice && 
        deviceType === 'desktop' && 
        navigator.userAgent.includes('Macintosh');
        
      // Look for window dimensions that suggest Stage Manager
      // This is a heuristic and not 100% reliable
      if ((isIpadOS16Plus || isMacOS) && 
          window.innerWidth < window.screen.width - 100 && 
          window.innerHeight < window.screen.height - 100) {
        return true;
      }
      
      return false;
    };
    
    // Update safe area insets
    const newSafeArea = getSafeAreaForDevice();
    setSafeArea(newSafeArea);
    
    // Generate CSS variables if enabled
    if (useCssVariables) {
      const variables: Record<string, string> = {
        '--safe-area-top': `${newSafeArea.top}px`,
        '--safe-area-right': `${newSafeArea.right}px`,
        '--safe-area-bottom': `${newSafeArea.bottom}px`,
        '--safe-area-left': `${newSafeArea.left}px`,
      };
      
      if (newSafeArea.dynamicIsland && enableDynamicIsland) {
        variables['--dynamic-island-top'] = `${newSafeArea.dynamicIsland.top}px`;
        variables['--dynamic-island-height'] = `${newSafeArea.dynamicIsland.height}px`;
        variables['--dynamic-island-width'] = `${newSafeArea.dynamicIsland.width}px`;
      }
      
      if (newSafeArea.homeIndicator) {
        variables['--home-indicator-height'] = `${newSafeArea.homeIndicator}px`;
      }
      
      if (newSafeArea.pencilRegion && enablePencilRegion) {
        variables['--pencil-region-right'] = `${newSafeArea.pencilRegion.right}px`;
        variables['--pencil-region-width'] = `${newSafeArea.pencilRegion.width}px`;
      }
      
      if (newSafeArea.stageManager && enableStageManager) {
        variables['--stage-manager-top'] = `${newSafeArea.stageManager.top}px`;
        variables['--stage-manager-right'] = `${newSafeArea.stageManager.right}px`;
        variables['--stage-manager-bottom'] = `${newSafeArea.stageManager.bottom}px`;
        variables['--stage-manager-left'] = `${newSafeArea.stageManager.left}px`;
      }
      
      setCssVariables(variables);
      
      // Apply CSS variables to :root or body
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        Object.entries(variables).forEach(([key, value]) => {
          root.style.setProperty(key, value);
        });
      }
    }
  }, [
    deviceType, 
    orientation, 
    hasDynamicIsland, 
    hasHomeIndicator, 
    enableDynamicIsland, 
    enableStageManager, 
    enablePencilRegion,
    useCssVariables,
    isAppleDevice
  ]);
  
  return {
    safeArea,
    orientation,
    hasDynamicIsland,
    hasHomeIndicator,
    cssVariables
  };
}

// Helper to get CSS variable references
export const safeAreaCss = {
  top: 'var(--safe-area-top, 0px)',
  right: 'var(--safe-area-right, 0px)',
  bottom: 'var(--safe-area-bottom, 0px)',
  left: 'var(--safe-area-left, 0px)',
  dynamicIslandTop: 'var(--dynamic-island-top, 47px)',
  dynamicIslandHeight: 'var(--dynamic-island-height, 37px)',
  dynamicIslandWidth: 'var(--dynamic-island-width, 120px)',
  homeIndicator: 'var(--home-indicator-height, 0px)',
  pencilRegionRight: 'var(--pencil-region-right, 0px)',
  pencilRegionWidth: 'var(--pencil-region-width, 0px)',
  stageManagerTop: 'var(--stage-manager-top, 0px)',
  stageManagerRight: 'var(--stage-manager-right, 0px)',
  stageManagerBottom: 'var(--stage-manager-bottom, 0px)',
  stageManagerLeft: 'var(--stage-manager-left, 0px)',
};

export default useSafeArea;