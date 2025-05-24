/**
 * Trade & Tariff Types
 * Precise interfaces for international trade, tariffs, and policy monitoring.
 * Focused on clarity and actionable intelligence.
 */

import { Entity, ID, Timestamp, Currency, Percentage, Confidence, Priority, Source } from './core';

// === GEOGRAPHIC ===

export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  region: string;
  currency: string;
  tradingBloc?: string;
}

export interface TradeRoute {
  origin: Country;
  destination: Country;
  volume: Currency;
  frequency: 'daily' | 'weekly' | 'monthly';
}

// === PRODUCTS & CLASSIFICATION ===

export interface Product {
  hsCode: string; // Harmonized System code
  description: string;
  category: string;
  unitOfMeasure: string;
}

export interface TradeFlow {
  product: Product;
  route: TradeRoute;
  value: Currency;
  volume: number;
  duty: Percentage;
}

// === TARIFFS & POLICIES ===

export interface Tariff extends Entity {
  hsCode: string;
  rate: Percentage;
  type: 'ad_valorem' | 'specific' | 'compound';
  effectiveDate: Timestamp;
  expirationDate?: Timestamp;
  exemptions: string[];
  source: Source;
}

export interface TariffChange {
  tariff: Tariff;
  previousRate: Percentage;
  impact: ImpactAssessment;
  confidence: Confidence;
}

export interface Policy extends Entity {
  title: string;
  description: string;
  type: 'tariff' | 'quota' | 'embargo' | 'agreement';
  countries: Country[];
  products: Product[];
  effectiveDate: Timestamp;
  status: 'proposed' | 'enacted' | 'suspended' | 'repealed';
}

// === ALERTS & MONITORING ===

export interface Alert extends Entity {
  title: string;
  description: string;
  priority: Priority;
  type: 'tariff_change' | 'policy_update' | 'trade_disruption';
  countries: Country[];
  products: Product[];
  impact: ImpactAssessment;
  sources: Source[];
  actionRequired: boolean;
}

export interface ImpactAssessment {
  severity: 'minimal' | 'moderate' | 'significant' | 'severe';
  affectedVolume: Currency;
  costIncrease: Currency;
  timeline: 'immediate' | 'short_term' | 'long_term';
  mitigations: string[];
}

// === ANNOUNCEMENTS & NEWS ===

export interface Announcement extends Entity {
  title: string;
  content: string;
  source: Source;
  type: 'ministry' | 'customs' | 'trade_body' | 'government';
  countries: Country[];
  products: Product[];
  urgency: Priority;
  translated?: boolean;
}

export interface NewsArticle extends Entity {
  title: string;
  summary: string;
  content: string;
  source: Source;
  author?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  relevance: Confidence;
  keywords: string[];
  entities: NamedEntity[];
}

export interface NamedEntity {
  text: string;
  type: 'country' | 'organization' | 'product' | 'policy' | 'person';
  confidence: Confidence;
}

// === INTELLIGENCE & ANALYSIS ===

export interface TradeIntelligence {
  summary: string;
  keyFindings: string[];
  risks: RiskFactor[];
  opportunities: Opportunity[];
  recommendations: string[];
  confidence: Confidence;
  lastUpdated: Timestamp;
}

export interface RiskFactor {
  description: string;
  probability: Confidence;
  impact: 'low' | 'medium' | 'high';
  timeframe: 'immediate' | 'near_term' | 'long_term';
}

export interface Opportunity {
  description: string;
  potential: Currency;
  timeline: 'immediate' | 'short_term' | 'long_term';
  requirements: string[];
}

// === VIETNAM SPECIALIZATION ===

export interface VietnamData {
  announcements: Announcement[];
  tariffChanges: TariffChange[];
  policies: Policy[];
  tradeAgreements: string[];
  majorTradingPartners: Country[];
}

export interface VietnamAlert extends Alert {
  province?: string;
  ministry: 'MOF' | 'MOIT' | 'MOJ' | 'PM' | 'OTHER';
  documentNumber?: string;
  legalBasis: string[];
}