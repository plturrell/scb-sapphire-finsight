/**
 * Type definitions for LangGraph Pipeline
 */

/**
 * Basic node types for the graph
 */
export enum NodeType {
  START = 'start',
  RETRIEVE = 'retrieve',
  TRANSFORM = 'transform',
  ANALYZE = 'analyze',
  STRUCTURE = 'structure',
  VALIDATE = 'validate',
  STORE = 'store',
  END = 'end',
}

/**
 * Edge types for the graph
 */
export enum EdgeType {
  SUCCESS = 'success',
  ERROR = 'error',
  RETRY = 'retry',
  FALLBACK = 'fallback',
}

/**
 * Data types for processing
 */
export enum DataType {
  MARKET_DATA = 'market_data',
  COMPANY_INFO = 'company_info',
  FINANCIAL_METRICS = 'financial_metrics',
  NEWS = 'news',
  PORTFOLIO = 'portfolio',
  ANALYSIS = 'analysis',
  RECOMMENDATION = 'recommendation',
}

/**
 * Node definition
 */
export interface GraphNode {
  id: string;
  type: NodeType;
  handler: string;
  config?: Record<string, any>;
}

/**
 * Edge definition
 */
export interface GraphEdge {
  from: string;
  to: string;
  type: EdgeType;
  condition?: string;
}

/**
 * Graph definition
 */
export interface Graph {
  id: string;
  name: string;
  description?: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  version?: string;
  metadata?: Record<string, any>;
}

/**
 * Node execution state
 */
export interface NodeState {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime?: Date;
  endTime?: Date;
  retryCount?: number;
  error?: string;
  result?: any;
  metrics?: {
    duration?: number;
    tokenUsage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    };
  };
}

/**
 * Graph execution state
 */
export interface GraphState {
  id: string;
  graphId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  nodes: Record<string, NodeState>;
  currentNode?: string;
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  error?: string;
}

/**
 * Query parameters for Perplexity
 */
export interface PerplexityQuery {
  query: string;
  options?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    top_k?: number;
  };
  metadata?: Record<string, any>;
}

/**
 * Node handler function type
 */
export type NodeHandler = (
  input: any,
  state: GraphState,
  config?: Record<string, any>
) => Promise<any>;

/**
 * Runtime environment 
 */
export interface RuntimeEnvironment {
  handlers: Record<string, NodeHandler>;
  state: GraphState;
  graph: Graph;
}

/**
 * Pipeline execution request
 */
export interface PipelineExecutionRequest {
  graphId: string;
  inputs: Record<string, any>;
  callback?: (state: GraphState) => void;
  metadata?: Record<string, any>;
}

/**
 * Pipeline execution result
 */
export interface PipelineExecutionResult {
  id: string;
  graphId: string;
  status: 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime: Date;
  duration: number;
  outputs?: Record<string, any>;
  error?: string;
  metrics?: {
    tokenUsage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    nodeMetrics: Record<string, any>;
  };
}