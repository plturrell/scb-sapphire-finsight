/**
 * Intelligence & AI Types
 * Sophisticated yet simple interfaces for AI-powered analysis and insights.
 * Every interaction is purposeful and elegant.
 */

import { Entity, ID, Timestamp, Confidence, Source } from './core';

// === SEARCH & DISCOVERY ===

export interface SearchQuery {
  text: string;
  type: 'general' | 'financial' | 'trade' | 'company';
  filters: SearchFilters;
  context?: string;
}

export interface SearchFilters {
  dateRange?: [Timestamp, Timestamp];
  sources?: string[];
  countries?: string[];
  languages?: string[];
  credibilityThreshold?: Confidence;
}

export interface SearchResult extends Entity {
  query: SearchQuery;
  summary: string;
  content: string;
  relevance: Confidence;
  sources: Source[];
  entities: Entity[];
  insights: Insight[];
}

// === AI ANALYSIS ===

export interface AIAnalysis extends Entity {
  type: 'market' | 'risk' | 'opportunity' | 'sentiment' | 'forecast';
  input: string;
  output: string;
  confidence: Confidence;
  model: string;
  processingTime: number; // milliseconds
  metadata: AnalysisMetadata;
}

export interface AnalysisMetadata {
  version: string;
  parameters: Record<string, unknown>;
  tokensUsed: number;
  cost?: number;
}

export interface Insight {
  text: string;
  type: 'observation' | 'correlation' | 'prediction' | 'recommendation';
  confidence: Confidence;
  impact: 'low' | 'medium' | 'high';
  evidence: Source[];
}

// === CONVERSATION & ASSISTANCE ===

export interface Conversation extends Entity {
  title: string;
  messages: Message[];
  context: ConversationContext;
  status: 'active' | 'archived' | 'deleted';
}

export interface Message extends Entity {
  content: string;
  role: 'user' | 'assistant' | 'system';
  attachments?: Attachment[];
  actions?: Action[];
  metadata: MessageMetadata;
}

export interface MessageMetadata {
  tokensUsed?: number;
  processingTime?: number;
  model?: string;
  temperature?: number;
}

export interface ConversationContext {
  domain: 'finance' | 'trade' | 'research' | 'general';
  user: ID;
  preferences: UserPreferences;
  history: ContextHistory[];
}

export interface UserPreferences {
  language: string;
  complexity: 'basic' | 'intermediate' | 'advanced';
  format: 'brief' | 'detailed' | 'comprehensive';
  notifications: boolean;
}

export interface ContextHistory {
  timestamp: Timestamp;
  action: string;
  data: Record<string, unknown>;
}

// === ACTIONS & TOOLS ===

export interface Action {
  type: 'search' | 'analyze' | 'simulate' | 'export' | 'notify';
  label: string;
  icon?: string;
  handler: string;
  parameters: Record<string, unknown>;
}

export interface Attachment {
  type: 'file' | 'image' | 'chart' | 'table' | 'link';
  name: string;
  url: string;
  size?: number;
  metadata?: Record<string, unknown>;
}

// === KNOWLEDGE MANAGEMENT ===

export interface KnowledgeBase extends Entity {
  name: string;
  description: string;
  domain: string;
  documents: Document[];
  indices: Index[];
  lastSync: Timestamp;
}

export interface Document extends Entity {
  title: string;
  content: string;
  source: Source;
  language: string;
  topics: string[];
  entities: Entity[];
  embeddings?: number[];
}

export interface Index {
  name: string;
  type: 'text' | 'vector' | 'graph';
  config: IndexConfig;
  stats: IndexStats;
}

export interface IndexConfig {
  dimensions?: number;
  algorithm?: string;
  parameters: Record<string, unknown>;
}

export interface IndexStats {
  documents: number;
  size: number; // bytes
  lastUpdate: Timestamp;
  queryCount: number;
}

// === MONITORING & ALERTS ===

export interface Monitor extends Entity {
  name: string;
  query: SearchQuery;
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  threshold: Confidence;
  recipients: ID[];
  active: boolean;
}

export interface Notification extends Entity {
  type: 'alert' | 'update' | 'reminder' | 'report';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recipient: ID;
  channel: 'email' | 'sms' | 'push' | 'webhook';
  delivered: boolean;
  readAt?: Timestamp;
}

// === REPORTS & EXPORTS ===

export interface Report extends Entity {
  title: string;
  type: 'analysis' | 'summary' | 'forecast' | 'comparison';
  format: 'html' | 'pdf' | 'excel' | 'json';
  content: string;
  data: Record<string, unknown>;
  template: string;
  recipients: ID[];
}

export interface Export extends Entity {
  type: 'data' | 'report' | 'chart' | 'model';
  format: string;
  size: number; // bytes
  url: string;
  expiresAt: Timestamp;
  downloadCount: number;
}