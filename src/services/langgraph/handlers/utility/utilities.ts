/**
 * Utility Handlers
 * Provides utility functions for the LangGraph pipeline
 */

import { NodeHandler, GraphState } from '../../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Start node handler - initializes pipeline execution
 */
export const startNode: NodeHandler = async (input: any, state: GraphState) => {
  console.log('Starting pipeline execution');
  
  // Initialize execution context
  const executionContext = {
    pipelineId: uuidv4(),
    startTime: new Date().toISOString(),
    input,
  };
  
  // Return the input along with execution context
  return {
    ...input,
    executionContext,
  };
};

/**
 * End node handler - finalizes pipeline execution
 */
export const endNode: NodeHandler = async (input: any, state: GraphState) => {
  console.log('Ending pipeline execution');
  
  // Extract the execution context
  const executionContext = input.executionContext || {
    pipelineId: uuidv4(),
    startTime: state.startTime.toISOString(),
  };
  
  // Create result summary
  const summary = {
    pipelineId: executionContext.pipelineId,
    startTime: executionContext.startTime,
    endTime: new Date().toISOString(),
    status: 'completed',
    result: input,
  };
  
  // Return the summary
  return summary;
};

/**
 * Error handler node
 */
export const errorNode: NodeHandler = async (input: any, state: GraphState) => {
  console.error('Pipeline error occurred:', input);
  
  // Extract error information
  const error = input.error || 'Unknown error';
  const errorNodeId = input.nodeId || state.currentNode;
  
  // Create error summary
  const errorSummary = {
    pipelineId: input.executionContext?.pipelineId || uuidv4(),
    startTime: input.executionContext?.startTime || state.startTime.toISOString(),
    endTime: new Date().toISOString(),
    status: 'failed',
    error: {
      message: error instanceof Error ? error.message : String(error),
      nodeId: errorNodeId,
      stack: error instanceof Error ? error.stack : undefined,
    },
  };
  
  // Return the error summary
  return errorSummary;
};

/**
 * Router node - conditionally routes data based on type
 */
export const routerNode: NodeHandler = async (input: any, state: GraphState, config?: Record<string, any>) => {
  console.log('Running router node');
  
  if (!input) {
    throw new Error('No input provided for router');
  }
  
  // Determine the data type from input or config
  let dataType: string;
  
  if (config && config.typeField) {
    // Get type from specified field
    dataType = input[config.typeField] || 
               (input._metadata && input._metadata.type) || 
               'unknown';
  } else {
    // Default to metadata type
    dataType = (input._metadata && input._metadata.type) || 'unknown';
  }
  
  console.log(`Router determined data type: ${dataType}`);
  
  // Return input with routing information
  return {
    ...input,
    _routing: {
      type: dataType,
      timestamp: new Date().toISOString(),
    },
  };
};

/**
 * Logger node - logs data and passes it through
 */
export const loggerNode: NodeHandler = async (input: any, state: GraphState, config?: Record<string, any>) => {
  const logLevel = (config && config.level) || 'info';
  const logPrefix = (config && config.prefix) || 'LangGraph';
  
  // Determine what to log based on config
  const shouldLogFullData = config && config.logFullData === true;
  const logData = shouldLogFullData ? input : (input._metadata || { type: 'unknown' });
  
  // Log based on level
  switch (logLevel) {
    case 'error':
      console.error(`${logPrefix}:`, logData);
      break;
    case 'warn':
      console.warn(`${logPrefix}:`, logData);
      break;
    case 'debug':
      console.debug(`${logPrefix}:`, logData);
      break;
    case 'info':
    default:
      console.log(`${logPrefix}:`, logData);
  }
  
  // Pass through the input unchanged
  return input;
};

/**
 * Merge node - merges multiple inputs into a single output
 * Note: This would be used in more complex graph topologies
 */
export const mergeNode: NodeHandler = async (input: any, state: GraphState) => {
  console.log('Running merge node');
  
  // If input is already an array, process it
  if (Array.isArray(input)) {
    // Create merged result with all inputs
    return {
      merged: true,
      timestamp: new Date().toISOString(),
      inputs: input,
      // Extract metadata from each input
      metadata: input.map(item => item._metadata || { unknown: true }),
    };
  }
  
  // If not an array, just pass through
  return input;
};