/**
 * LangGraph Runtime Engine
 * Core runtime for executing LangGraph pipelines
 */

import { LangGraphConfig } from './LangGraphConfig';
import { 
  Graph, 
  GraphState, 
  NodeHandler, 
  NodeState, 
  EdgeType, 
  PipelineExecutionRequest, 
  PipelineExecutionResult,
  RuntimeEnvironment
} from './types';
import { v4 as uuidv4 } from 'uuid';
import { CacheService } from '../redis/CacheService';

// Registry of graph definitions
const graphRegistry: Record<string, Graph> = {};

// Registry of node handlers
const handlerRegistry: Record<string, NodeHandler> = {};

/**
 * Register a graph definition
 */
export function registerGraph(graph: Graph): void {
  graphRegistry[graph.id] = graph;
  console.log(`Registered graph: ${graph.id} (${graph.name})`);
}

/**
 * Register a node handler
 */
export function registerHandler(handlerId: string, handler: NodeHandler): void {
  handlerRegistry[handlerId] = handler;
  console.log(`Registered handler: ${handlerId}`);
}

/**
 * Create initial graph state
 */
function createInitialState(graphId: string, inputs: Record<string, any>): GraphState {
  const graph = graphRegistry[graphId];
  if (!graph) {
    throw new Error(`Graph not found: ${graphId}`);
  }
  
  const initialNodes: Record<string, NodeState> = {};
  graph.nodes.forEach(node => {
    initialNodes[node.id] = {
      id: node.id,
      status: 'pending',
    };
  });
  
  return {
    id: uuidv4(),
    graphId,
    status: 'pending',
    startTime: new Date(),
    nodes: initialNodes,
    inputs,
  };
}

/**
 * Find the start node of a graph
 */
function findStartNode(graph: Graph): string | null {
  const startNode = graph.nodes.find(node => node.type === 'start');
  return startNode ? startNode.id : null;
}

/**
 * Find outgoing edges from a node
 */
function getOutgoingEdges(graph: Graph, nodeId: string) {
  return graph.edges.filter(edge => edge.from === nodeId);
}

/**
 * Evaluate edge condition
 */
function evaluateCondition(condition: string | undefined, result: any): boolean {
  if (!condition) {
    return true;
  }
  
  try {
    // Simple condition evaluation (in production, use a safer evaluation method)
    const fn = new Function('result', `return ${condition}`);
    return fn(result);
  } catch (error) {
    console.error(`Error evaluating condition: ${condition}`, error);
    return false;
  }
}

/**
 * Select next node based on current node result and outgoing edges
 */
function selectNextNode(graph: Graph, currentNodeId: string, result: any): string | null {
  const outgoingEdges = getOutgoingEdges(graph, currentNodeId);
  
  // Check for success edges first
  const successEdges = outgoingEdges.filter(edge => edge.type === EdgeType.SUCCESS);
  for (const edge of successEdges) {
    if (evaluateCondition(edge.condition, result)) {
      return edge.to;
    }
  }
  
  // Check for other edge types if no success edge matched
  for (const edge of outgoingEdges) {
    if (edge.type !== EdgeType.SUCCESS && evaluateCondition(edge.condition, result)) {
      return edge.to;
    }
  }
  
  return null; // No matching edge found
}

/**
 * Execute a node handler
 */
async function executeNode(
  nodeId: string, 
  input: any, 
  state: GraphState, 
  env: RuntimeEnvironment
): Promise<{ result: any; nextNodeId: string | null }> {
  const graph = env.graph;
  const node = graph.nodes.find(n => n.id === nodeId);
  
  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }
  
  const handler = env.handlers[node.handler];
  if (!handler) {
    throw new Error(`Handler not found: ${node.handler}`);
  }
  
  // Update node state to running
  state.nodes[nodeId] = {
    ...state.nodes[nodeId],
    status: 'running',
    startTime: new Date(),
  };
  
  try {
    console.log(`Executing node: ${nodeId} (${node.type})`);
    const startTime = Date.now();
    
    // Execute the handler
    const result = await handler(input, state, node.config);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Update node state to completed
    state.nodes[nodeId] = {
      ...state.nodes[nodeId],
      status: 'completed',
      endTime: new Date(),
      result,
      metrics: {
        duration,
        ...state.nodes[nodeId].metrics,
      },
    };
    
    // Find the next node
    const nextNodeId = selectNextNode(graph, nodeId, result);
    
    return { result, nextNodeId };
  } catch (error) {
    console.error(`Error executing node ${nodeId}:`, error);
    
    // Update node state to failed
    state.nodes[nodeId] = {
      ...state.nodes[nodeId],
      status: 'failed',
      endTime: new Date(),
      error: error instanceof Error ? error.message : String(error),
    };
    
    // Find error edge if available
    const errorEdges = getOutgoingEdges(graph, nodeId).filter(
      edge => edge.type === EdgeType.ERROR
    );
    
    if (errorEdges.length > 0) {
      return { result: null, nextNodeId: errorEdges[0].to };
    }
    
    // No error edge, propagate the error
    throw error;
  }
}

/**
 * Execute a graph
 */
async function executeGraph(
  graphId: string, 
  inputs: Record<string, any>
): Promise<PipelineExecutionResult> {
  const graph = graphRegistry[graphId];
  if (!graph) {
    throw new Error(`Graph not found: ${graphId}`);
  }
  
  const state = createInitialState(graphId, inputs);
  state.status = 'running';
  
  // Find the start node
  let currentNodeId = findStartNode(graph);
  if (!currentNodeId) {
    throw new Error(`No start node found in graph: ${graphId}`);
  }
  
  const env: RuntimeEnvironment = {
    handlers: handlerRegistry,
    state,
    graph,
  };
  
  let currentInput = inputs;
  
  try {
    // Execute nodes until we reach an end node or have no next node
    while (currentNodeId) {
      state.currentNode = currentNodeId;
      
      // Execute the current node
      const { result, nextNodeId } = await executeNode(
        currentNodeId, 
        currentInput, 
        state, 
        env
      );
      
      // Store state after each node execution if configured
      if (LangGraphConfig.storage.useRedis) {
        const redisKey = `${LangGraphConfig.storage.redisKeyPrefix}state:${state.id}`;
        await CacheService.set(redisKey, state, 'default', LangGraphConfig.storage.intermediateTtl);
      }
      
      // Update current input for next node
      currentInput = result;
      
      // Move to next node
      currentNodeId = nextNodeId;
      
      // If we've reached an end node, exit the loop
      if (currentNodeId && graph.nodes.find(n => n.id === currentNodeId)?.type === 'end') {
        // Execute the end node
        const { result } = await executeNode(currentNodeId, currentInput, state, env);
        currentInput = result;
        break;
      }
    }
    
    // Execution completed successfully
    state.status = 'completed';
    state.endTime = new Date();
    state.outputs = currentInput;
    
    // Finalize and return result
    const result: PipelineExecutionResult = {
      id: state.id,
      graphId,
      status: 'completed',
      startTime: state.startTime,
      endTime: state.endTime!,
      duration: state.endTime!.getTime() - state.startTime.getTime(),
      outputs: state.outputs,
      metrics: {
        tokenUsage: calculateTotalTokenUsage(state),
        nodeMetrics: extractNodeMetrics(state),
      },
    };
    
    // Store completed state in Redis if configured
    if (LangGraphConfig.storage.useRedis) {
      const redisKey = `${LangGraphConfig.storage.redisKeyPrefix}result:${state.id}`;
      await CacheService.set(redisKey, result, 'default', LangGraphConfig.storage.completedRunTtl);
    }
    
    return result;
  } catch (error) {
    // Execution failed
    state.status = 'failed';
    state.endTime = new Date();
    state.error = error instanceof Error ? error.message : String(error);
    
    // Finalize and return result
    const result: PipelineExecutionResult = {
      id: state.id,
      graphId,
      status: 'failed',
      startTime: state.startTime,
      endTime: state.endTime,
      duration: state.endTime.getTime() - state.startTime.getTime(),
      error: state.error,
      metrics: {
        tokenUsage: calculateTotalTokenUsage(state),
        nodeMetrics: extractNodeMetrics(state),
      },
    };
    
    // Store failed state in Redis if configured
    if (LangGraphConfig.storage.useRedis) {
      const redisKey = `${LangGraphConfig.storage.redisKeyPrefix}result:${state.id}`;
      await CacheService.set(redisKey, result, 'default', LangGraphConfig.storage.completedRunTtl);
    }
    
    return result;
  }
}

/**
 * Calculate total token usage from all nodes
 */
function calculateTotalTokenUsage(state: GraphState) {
  let promptTokens = 0;
  let completionTokens = 0;
  
  Object.values(state.nodes).forEach(node => {
    if (node.metrics?.tokenUsage) {
      promptTokens += node.metrics.tokenUsage.promptTokens || 0;
      completionTokens += node.metrics.tokenUsage.completionTokens || 0;
    }
  });
  
  return {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
  };
}

/**
 * Extract node metrics for analysis
 */
function extractNodeMetrics(state: GraphState) {
  const nodeMetrics: Record<string, any> = {};
  
  Object.entries(state.nodes).forEach(([nodeId, node]) => {
    if (node.metrics) {
      nodeMetrics[nodeId] = {
        duration: node.metrics.duration,
        tokenUsage: node.metrics.tokenUsage,
        status: node.status,
      };
    }
  });
  
  return nodeMetrics;
}

/**
 * Execute pipeline
 */
export async function executePipeline(
  request: PipelineExecutionRequest
): Promise<PipelineExecutionResult> {
  const { graphId, inputs, callback } = request;
  
  try {
    // Execute the graph
    const result = await executeGraph(graphId, inputs);
    
    // Call callback if provided
    if (callback) {
      const state = await getGraphState(result.id);
      if (state) {
        callback(state);
      }
    }
    
    return result;
  } catch (error) {
    console.error(`Error executing pipeline for graph ${graphId}:`, error);
    
    // Create error result
    const result: PipelineExecutionResult = {
      id: uuidv4(),
      graphId,
      status: 'failed',
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      error: error instanceof Error ? error.message : String(error),
      metrics: {
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        nodeMetrics: {},
      },
    };
    
    // Call callback if provided
    if (callback) {
      const errorState: GraphState = {
        id: result.id,
        graphId,
        status: 'failed',
        startTime: result.startTime,
        endTime: result.endTime,
        nodes: {},
        inputs,
        error: result.error,
      };
      callback(errorState);
    }
    
    return result;
  }
}

/**
 * Get graph state by ID
 */
export async function getGraphState(stateId: string): Promise<GraphState | null> {
  if (LangGraphConfig.storage.useRedis) {
    const redisKey = `${LangGraphConfig.storage.redisKeyPrefix}state:${stateId}`;
    return await CacheService.get<GraphState>(redisKey);
  }
  return null;
}

/**
 * Get execution result by ID
 */
export async function getExecutionResult(resultId: string): Promise<PipelineExecutionResult | null> {
  if (LangGraphConfig.storage.useRedis) {
    const redisKey = `${LangGraphConfig.storage.redisKeyPrefix}result:${resultId}`;
    return await CacheService.get<PipelineExecutionResult>(redisKey);
  }
  return null;
}