export interface User {
  id: string;
  name: string;
  role: string;
  portfolio: string;
  email: string;
  avatar?: string;
}

export interface SankeyNode {
  name: string;
  group?: string;
  category?: string;
  value: number; // Required for proper Sankey diagram rendering
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
  index?: number;
  id?: string; // For unique identification
  predictedValue?: number; // For AI insights
  confidence?: number; // AI confidence level
}

export interface SankeyLink {
  source: number | SankeyNode;
  target: number | SankeyNode;
  value: number;
  uiColor?: string;
  aiEnhanced?: boolean; // Flag for links that are suggested or enhanced by AI
  originalValue?: number; // Original value before AI enhancement
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
  aiInsights?: {
    summary: string;
    recommendations: string[];
    confidence: number;
    updatedAt: Date;
  };
}

export interface DashboardMetrics {
  revenue: {
    current: number;
    previous: number;
    change: number;
  };
  budget: {
    current: number;
    allocated: number;
    percentage: number;
  };
  penetration: {
    current: number;
    target: number;
  };
  income: {
    current: number;
    previous: number;
    change: number;
  };
  rowWa: {
    current: number;
    change: number;
  };
  mobilization: {
    current: number;
  };
}

export interface Sector {
  name: string;
  allocation: number;
  color: string;
}

export interface KeyMetric {
  label: string;
  amount: string;
  change: number;
  period: string;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  sourceName: string;
  isPremium: boolean;
}

// Vietnam specific interfaces for the FinSight application
export interface VietnamAnnouncement {
  id: string;
  title: string;
  content: string;
  date: string;
  source: string;
  category?: string;
  confidence?: number;
  url?: string;
  tariffChanges?: Array<{
    oldRate: number;
    newRate: number;
    product: string;
  }>;
  affectedProducts?: string[];
}

export interface VietnamNewsArticle {
  id: string;
  title: string;
  content: string;
  date: string;
  source: string;
  url?: string;
  relevance?: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
  keywords?: string[];
}

export interface Task {
  id: string;
  title: string;
  status: 'pending' | 'completed' | 'overdue';
  type: 'personal' | 'compliance' | 'update';
  date: string;
  overdue?: boolean;
}

export interface TransactionSector {
  name: string;
  revenue: number;
  accounts: number;
  income: number;
  assets: number;
  deposits: number;
  yield: number;
  rowWa: number;
  change?: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface Source {
  name: string;
  url: string;
  type: 'internal' | 'external';
}

export interface JouleMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  suggestions?: string[];
  sources?: Source[];
  toolsUsed?: boolean;
}

// Tariff Alert System Types
export interface TariffAlert {
  id?: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'Critical';
  country: string;
  impactSeverity: number; // 1-10 scale
  confidence: number; // 0-1 scale
  sourceUrl?: string;
  sourceName?: string;
  publishDate?: Date;
  createdAt: Date;
  effectiveDate?: Date; // When tariffs go into effect
  tariffRate?: number;
  productCategories?: string[];
  aiEnhanced?: boolean;
  tradingPartners?: string[]; // Affected trading partners
}

export interface TariffChange {
  id?: string;
  title: string;
  description: string;
  country: string;
  rate: number; // Percentage
  effectiveDate: Date;

  // Additional properties for Vietnam-specific implementation
  oldRate?: number;
  newRate?: number;
  product?: string;
  sourceUrl?: string;
  affectedProducts?: string[];
  productCategories: string[];
  policy?: string;
  impactSeverity?: number;
  confidence?: number;
}

export interface IndustryImpact {
  id?: string;
  industry: string;
  severity: number; // 1-10 scale
  estimatedAnnualImpact: number; // In millions
  description: string;
  relatedTariffChangeId?: string;
  suggestedMitigations?: string[];
}

export interface SimulationResult {
  optimalPath: {
    allocations: Record<string, number>;
    recommendations: string[];
  };
  expectedValue: {
    totalReturn: number;
    byCountry: Record<string, number>;
  };
  riskMetrics: {
    volatility: number;
    confidenceLowerBound: number;
    confidenceUpperBound: number;
    maxDrawdown: number;
    recessionImpact: number;
  };
  flowData: SankeyData;
}

export interface TransactionSector {
  sector: string;
  percentage: number;
  value: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

export interface VietnamAnnouncement {
  id: string;
  title: string;
  content: string;
  publishDate: Date;
  documentNumber?: string;
  ministry?: string;
  type: 'tariff' | 'trade' | 'regulation' | 'general';
  url?: string;
  affectedProducts?: string[];
  affectedCountries?: string[];
  effectiveDate?: Date;
}

export interface VietnamNewsArticle {
  id: string;
  title: string;
  content: string;
  publishDate: Date;
  source: string;
  url: string;
  category: string;
  tags?: string[];
  relevance?: number;
}

export interface SimulationProgress {
  completedIterations: number;
  totalIterations: number;
  percent: number;
  estimatedTimeRemaining: number;
  timeElapsed: number;
  confidence: number;
  isComplete: boolean;
}