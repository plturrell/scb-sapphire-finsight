import { useState, useEffect } from 'react';

/**
 * Hook to detect iOS compatibility and provide iOS-specific features
 */
export const useIOSCompatibility = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [iOSVersion, setIOSVersion] = useState<number | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect iOS
    const userAgent = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    
    setIsIOS(isIOSDevice);

    // Detect iOS version
    if (isIOSDevice) {
      const versionMatch = userAgent.match(/OS (\d+)_/);
      if (versionMatch) {
        setIOSVersion(parseInt(versionMatch[1], 10));
      }
    }

    // Detect standalone mode (PWA)
    const isStandaloneMode = (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;
    
    setIsStandalone(isStandaloneMode);
  }, []);

  return {
    isIOS,
    iOSVersion,
    isStandalone,
    supportsSafeArea: isIOS && (iOSVersion || 0) >= 11,
    supportsHapticFeedback: isIOS && (iOSVersion || 0) >= 10,
    supportsContextMenu: isIOS && (iOSVersion || 0) >= 13
  };
};