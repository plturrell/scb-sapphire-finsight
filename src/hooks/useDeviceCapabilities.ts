import { useState, useEffect } from 'react';

// Battery API interface (not yet in TypeScript lib)
interface BatteryManager {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
}

interface DeviceCapabilities {
  // Performance
  hardwareConcurrency: number;
  deviceMemory: number;
  // Network
  connection: {
    type: 'wifi' | '4g' | '3g' | '2g' | 'slow-2g' | 'offline';
    downlink: number;
    rtt: number;
    saveData: boolean;
  };
  // Display
  pixelRatio: number;
  colorGamut: 'srgb' | 'p3' | 'rec2020';
  hdr: boolean;
  // Features
  touchCapable: boolean;
  reducedMotion: boolean;
  prefersColorScheme: 'light' | 'dark' | 'no-preference';
  // Battery
  battery: {
    level: number;
    charging: boolean;
  } | null;
  // Performance tier
  tier: 'high' | 'medium' | 'low';
  // Screen size
  screenSize: 'mobile' | 'tablet' | 'desktop';
  // Device type
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  // Apple device detection
  isAppleDevice: boolean;
}

export function useDeviceCapabilities(): DeviceCapabilities {
  const getDefaultCapabilities = (): DeviceCapabilities => {
    if (typeof window === 'undefined') {
      return {
        hardwareConcurrency: 4,
        deviceMemory: 4,
        connection: {
          type: 'wifi',
          downlink: 10,
          rtt: 100,
          saveData: false,
        },
        pixelRatio: 1,
        colorGamut: 'srgb',
        hdr: false,
        touchCapable: false,
        reducedMotion: false,
        prefersColorScheme: 'light',
        battery: null,
        tier: 'medium',
        screenSize: 'desktop',
        deviceType: 'desktop',
        isAppleDevice: false,
      };
    }
    
    // Detect Apple device
    const isAppleDevice = /iPhone|iPad|iPod|Mac/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // Determine device type
    let deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown' = 'unknown';
    if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      deviceType = 'mobile';
    } else if (/iPad|Android/.test(navigator.userAgent) && 'ontouchstart' in window) {
      deviceType = 'tablet';
    } else {
      deviceType = 'desktop';
    }
    
    return {
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
      deviceMemory: (navigator as any).deviceMemory || 4,
      connection: {
        type: 'wifi',
        downlink: 10,
        rtt: 100,
        saveData: false,
      },
      pixelRatio: window.devicePixelRatio || 1,
      colorGamut: 'srgb',
      hdr: false,
      touchCapable: 'ontouchstart' in window,
      deviceType,
      isAppleDevice,
      reducedMotion: false,
      prefersColorScheme: 'light',
      battery: null,
      tier: 'medium',
      screenSize: 'desktop',
    };
  };
  
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>(getDefaultCapabilities());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updateCapabilities = async () => {
      const newCapabilities: Partial<DeviceCapabilities> = {};

      // Network connection
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        newCapabilities.connection = {
          type: connection.effectiveType || 'wifi',
          downlink: connection.downlink || 10,
          rtt: connection.rtt || 100,
          saveData: connection.saveData || false,
        };
      }

      // Color gamut and HDR
      if (window.matchMedia) {
        if (window.matchMedia('(color-gamut: p3)').matches) {
          newCapabilities.colorGamut = 'p3';
        } else if (window.matchMedia('(color-gamut: rec2020)').matches) {
          newCapabilities.colorGamut = 'rec2020';
        }

        newCapabilities.hdr = window.matchMedia('(dynamic-range: high)').matches;
        newCapabilities.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          newCapabilities.prefersColorScheme = 'dark';
        } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
          newCapabilities.prefersColorScheme = 'light';
        }
      }

      // Battery status
      if ('getBattery' in navigator) {
        try {
          // Battery API is not in TypeScript's Navigator interface yet
          const battery = await (navigator as Navigator & { getBattery(): Promise<BatteryManager> }).getBattery();
          newCapabilities.battery = {
            level: battery.level,
            charging: battery.charging,
          };
        } catch (e) {
          // Battery API might be restricted
        }
      }

      // Calculate screen size
      const width = window.innerWidth;
      let screenSize: 'mobile' | 'tablet' | 'desktop' = 'desktop';
      if (width < 768) {
        screenSize = 'mobile';
      } else if (width < 1024) {
        screenSize = 'tablet';
      }
      newCapabilities.screenSize = screenSize;

      // Calculate performance tier
      const tier = calculatePerformanceTier({
        ...capabilities,
        ...newCapabilities,
      });
      
      setCapabilities(prev => ({
        ...prev,
        ...newCapabilities,
        tier,
      }));
    };

    updateCapabilities();

    // Listen for connection changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', updateCapabilities);
      
      return () => {
        connection.removeEventListener('change', updateCapabilities);
      };
    }
  }, []);

  return capabilities;
}

function calculatePerformanceTier(capabilities: Partial<DeviceCapabilities>): 'high' | 'medium' | 'low' {
  let score = 0;

  // CPU cores
  if (capabilities.hardwareConcurrency) {
    if (capabilities.hardwareConcurrency >= 8) score += 3;
    else if (capabilities.hardwareConcurrency >= 4) score += 2;
    else score += 1;
  }

  // Memory
  if (capabilities.deviceMemory) {
    if (capabilities.deviceMemory >= 8) score += 3;
    else if (capabilities.deviceMemory >= 4) score += 2;
    else score += 1;
  }

  // Network
  if (capabilities.connection) {
    if (capabilities.connection.type === 'wifi' || capabilities.connection.type === '4g') score += 3;
    else if (capabilities.connection.type === '3g') score += 2;
    else score += 1;
  }

  // Battery
  if (capabilities.battery) {
    if (capabilities.battery.level > 0.5 && capabilities.battery.charging) score += 2;
    else if (capabilities.battery.level > 0.2) score += 1;
  }

  // Determine tier based on score
  if (score >= 10) return 'high';
  if (score >= 6) return 'medium';
  return 'low';
}

// Hook for adaptive layouts
export function useAdaptiveLayout() {
  const capabilities = useDeviceCapabilities();
  const [layout, setLayout] = useState({
    columns: 3,
    spacing: 'normal',
    animations: true,
    imageQuality: 'high',
    chartComplexity: 'full',
  });

  useEffect(() => {
    const adaptLayout = () => {
      switch (capabilities.tier) {
        case 'high':
          setLayout({
            columns: 3,
            spacing: 'normal',
            animations: true,
            imageQuality: 'high',
            chartComplexity: 'full',
          });
          break;
        case 'medium':
          setLayout({
            columns: 2,
            spacing: 'compact',
            animations: !capabilities.reducedMotion,
            imageQuality: 'medium',
            chartComplexity: 'simplified',
          });
          break;
        case 'low':
          setLayout({
            columns: 1,
            spacing: 'compact',
            animations: false,
            imageQuality: 'low',
            chartComplexity: 'basic',
          });
          break;
      }

      // Network-specific adjustments
      if (capabilities.connection.saveData || capabilities.connection.type === 'slow-2g') {
        setLayout(prev => ({
          ...prev,
          imageQuality: 'low',
          animations: false,
          chartComplexity: 'basic',
        }));
      }

      // Battery-specific adjustments
      if (capabilities.battery && capabilities.battery.level < 0.2 && !capabilities.battery.charging) {
        setLayout(prev => ({
          ...prev,
          animations: false,
          imageQuality: 'low',
        }));
      }
    };

    adaptLayout();
  }, [capabilities]);

  return { capabilities, layout };
}

// Export as default for backward compatibility
export default useDeviceCapabilities;