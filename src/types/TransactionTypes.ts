/**
 * Type definitions for Transaction-related data
 */

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

export interface TransactionSectorDetail {
  sector: string;
  percentage: number;
  value: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
}