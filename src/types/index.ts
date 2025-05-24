/**
 * FinSight Type System
 * 
 * A beautifully designed type system following Jony Ive's design principles:
 * - Simplicity: Every type has a single, clear purpose
 * - Clarity: Names and structures are immediately understandable  
 * - Purposefulness: Nothing superfluous, everything essential
 * - Elegance: Sophisticated functionality with minimal complexity
 * 
 * "Simplicity is the ultimate sophistication." - Leonardo da Vinci
 */

// === CORE FOUNDATION ===
export * from './core';

// === DOMAIN MODELS ===
export * from './financial';
export * from './trade';
export * from './intelligence';
export * from './simulation';

// === LEGACY COMPATIBILITY ===
// Maintaining backward compatibility during transition
export * from './MonteCarloTypes';
export * from './perplexity';
export * from './semantic-web';

// === TYPE GUARDS ===

import { Entity, Confidence, Percentage } from './core';

export const isEntity = (obj: unknown): obj is Entity => {
  return typeof obj === 'object' && 
         obj !== null && 
         'id' in obj && 
         'createdAt' in obj && 
         'updatedAt' in obj;
};

export const isValidConfidence = (value: unknown): value is Confidence => {
  return typeof value === 'number' && value >= 0 && value <= 1;
};

export const isValidPercentage = (value: unknown): value is Percentage => {
  return typeof value === 'number' && value >= 0 && value <= 100;
};

// === UTILITY TYPES ===

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };
export type DeepPartial<T> = { [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P] };

// === CONSTANTS ===

export const TYPE_SYSTEM_VERSION = '2.0.0';
export const DESIGN_PRINCIPLES = {
  SIMPLICITY: 'Every type has a single, clear purpose',
  CLARITY: 'Names and structures are immediately understandable',
  PURPOSEFULNESS: 'Nothing superfluous, everything essential',
  ELEGANCE: 'Sophisticated functionality with minimal complexity'
} as const;