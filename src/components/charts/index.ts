// Export all enhanced chart components with SCB beautiful styling
export { default as EnhancedAllocationPieChart } from './EnhancedAllocationPieChart';
export { default as EnhancedLineChart } from './EnhancedLineChart';
export { default as EnhancedBarChart } from './EnhancedBarChart';
export { default as EnhancedSankeyChart } from './EnhancedSankeyChart';
export { default as AllocationPieChart } from './AllocationPieChart';

// Re-export types that may be needed by consumers
export interface DataPoint {
  date: Date;
  value: number;
  aiGenerated?: boolean;
  confidence?: number;
}

export interface DataSeries {
  id: string;
  name: string;
  data: DataPoint[];
  color?: string;
  aiEnhanced?: boolean; 
  isProjection?: boolean;
  strokeDasharray?: string;
}

export interface DataItem {
  name: string;
  value: number;
  color: string;
  aiEnhanced?: boolean;
  confidence?: number;
}

export interface BarDataItem {
  label: string;
  value: number;
  color?: string;
  aiEnhanced?: boolean;
  confidence?: number;
  previousValue?: number;
  change?: number;
}