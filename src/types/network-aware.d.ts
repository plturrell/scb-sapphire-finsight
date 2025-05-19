// Type definitions for network-aware loading system

// Extended Navigator interface for battery API
interface Navigator {
  getBattery?: () => Promise<BatteryManager>;
  connection?: NetworkInformation;
  deviceMemory?: number;
}

// Network Information API
interface NetworkInformation {
  type?: string;
  effectiveType?: '4g' | '3g' | '2g' | 'slow-2g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

// Battery API
interface BatteryManager {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
}

// Extended Window interface
interface Window {
  MSStream?: any;
}

// Media query types
interface MediaQueryList {
  matches: boolean;
  media: string;
  onchange: ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | null;
  addListener?(callback: (mql: MediaQueryList) => void): void;
  removeListener?(callback: (mql: MediaQueryList) => void): void;
}