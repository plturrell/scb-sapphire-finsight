/**
 * Core Types
 * Foundational data structures designed with clarity, simplicity, and purpose.
 * Every type serves a specific need. Nothing superfluous.
 */

// === PRIMITIVES ===

export type ID = string;
export type Timestamp = Date;
export type Currency = number;
export type Percentage = number; // 0-100
export type Confidence = number; // 0-1
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Status = 'pending' | 'active' | 'completed' | 'failed';

// === CORE ENTITIES ===

export interface Entity {
  readonly id: ID;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface User extends Entity {
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface Source {
  name: string;
  url: string;
  credibility: Confidence;
}

// === DATA STRUCTURES ===

export interface DataPoint {
  timestamp: Timestamp;
  value: number;
  metadata?: Record<string, unknown>;
}

export interface Metric {
  name: string;
  value: Currency | Percentage | number;
  change?: Percentage;
  trend: 'up' | 'down' | 'stable';
  period: string;
}

export interface Range<T = number> {
  min: T;
  max: T;
}

// === RESPONSES ===

export interface Response<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Timestamp;
}

export interface PaginatedResponse<T> extends Response<T[]> {
  page: number;
  totalPages: number;
  totalItems: number;
}

// === ANALYTICS ===

export interface Statistics {
  mean: number;
  median: number;
  range: Range;
  standardDeviation: number;
}

export interface Insight {
  text: string;
  confidence: Confidence;
  source: string;
}

export interface Recommendation {
  title: string;
  description: string;
  priority: Priority;
  impact: 'low' | 'medium' | 'high';
}

// === UTILITIES ===

export const createEntity = <T extends Partial<Entity>>(data: T): T & Entity => {
  const now = new Date();
  return {
    ...data,
    id: data.id || crypto.randomUUID(),
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
  };
};

export const isValidConfidence = (value: number): value is Confidence => 
  value >= 0 && value <= 1;

export const isValidPercentage = (value: number): value is Percentage => 
  value >= 0 && value <= 100;