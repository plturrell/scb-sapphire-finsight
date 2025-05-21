import { useState, useEffect } from 'react';
import { useIOSCompatibility } from './useIOSCompatibility';

/**
 * Hook to detect SF Symbols support and provide fallback capabilities
 */
export const useSFSymbolsSupport = () => {
  const [supportsSFSymbols, setSupportsSFSymbols] = useState(false);
  const [sfSymbolsVersion, setSFSymbolsVersion] = useState<number | null>(null);
  const { isIOS, iOSVersion } = useIOSCompatibility();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // SF Symbols are available on iOS 13+ and macOS 11+
    const isSFSymbolsSupported = 
      (isIOS && (iOSVersion || 0) >= 13) || 
      (navigator.userAgent.includes('Mac') && !isIOS);

    setSupportsSFSymbols(isSFSymbolsSupported);

    // Determine SF Symbols version based on iOS version
    if (isIOS && iOSVersion) {
      if (iOSVersion >= 15) {
        setSFSymbolsVersion(3);
      } else if (iOSVersion >= 14) {
        setSFSymbolsVersion(2);
      } else if (iOSVersion >= 13) {
        setSFSymbolsVersion(1);
      }
    }
  }, [isIOS, iOSVersion]);

  return {
    supportsSFSymbols,
    sfSymbolsVersion,
    hasMulticolorSupport: (sfSymbolsVersion || 0) >= 3,
    hasVariableColorSupport: (sfSymbolsVersion || 0) >= 2,
    hasHierarchicalSupport: (sfSymbolsVersion || 0) >= 2
  };
};