import { TariffAlert, VietnamAnnouncement, VietnamNewsArticle } from '.';

// Augment the TariffAlert interface to include additional properties
// used in VietnamSearchManager
declare module '../types' {
  interface TariffAlert {
    // These additional properties are used by VietnamSearchManager
    effectiveDate?: Date;
    tradingPartners?: string[];
    affectedProvinces?: string[];
    documentNumber?: string;
  }
}

// Define Vietnam API client response structures for strong typing
export interface VietnamApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface MinistryOfFinanceResponse {
  success: boolean;
  announcements: VietnamAnnouncement[];
  timestamp: string;
}

export interface VnExpressResponse {
  success: boolean;
  articles: VietnamNewsArticle[];
  timestamp: string;
}

// Extend SearchManager with Vietnam-specific methods
declare module '../services/SearchManager' {
  interface SearchManager {
    notifyTariffInformationFound(tariffInfo: TariffAlert): void;
    search(query: string | object, params?: any): Promise<any[]>;
  }
}

// Type declaration for topojson-client
declare module 'topojson-client' {
  export function feature(topology: any, name: string): any;
}

// Extend global types
declare global {
  interface Window {
    ethereum?: any;
  }
}

export {};