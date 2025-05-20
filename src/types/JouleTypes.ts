/**
 * Type definitions for Joule AI Assistant components
 */

// Source reference for AI-generated content
export interface Source {
  name: string;
  url: string;
  type: 'internal' | 'external';
}

// Message types for chat interface
export interface JouleMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  sources?: Source[];
  suggestions?: string[];
  visualizations?: any[];
  toolsUsed?: boolean;
}

// Workflow types for guided processes
export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  type: 'input' | 'choice' | 'confirmation' | 'data-selection' | 'visualization';
  completed: boolean;
  options?: string[];
  dataType?: 'monte-carlo' | 'perplexity' | 'business-data' | 'dashboard';
}

export interface GuidedWorkflow {
  id: string;
  title: string;
  description: string;
  steps: WorkflowStep[];
  currentStepIndex: number;
  completed: boolean;
}

// Insights and visualization types
export interface AIInsight {
  id: string;
  title: string;
  description: string;
  category: string;
  timestamp: Date;
  severity: 'high' | 'medium' | 'low';
}

export interface VisualizationData {
  type: string;
  data: any;
}