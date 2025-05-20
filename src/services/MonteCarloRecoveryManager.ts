/**
 * MonteCarloRecoveryManager.ts
 * 
 * A service for managing recovery from failed Monte Carlo simulations,
 * implementing robust error handling and automatic recovery strategies.
 */

import { SimulationOutput, UUID } from '../types/MonteCarloTypes';
import monteCarloStorageService from './MonteCarloStorageService';
import { globalSimulationCache } from './SimulationCache';

/**
 * Error types for classification and appropriate recovery strategies
 */
export enum SimulationErrorType {
  // Worker initialization errors
  WORKER_INITIALIZATION = 'worker_initialization',
  
  // Computation errors
  COMPUTATION_ERROR = 'computation_error',
  MEMORY_LIMIT_EXCEEDED = 'memory_limit_exceeded',
  PERFORMANCE_DEGRADATION = 'performance_degradation',
  
  // Data-related errors
  INVALID_PARAMETERS = 'invalid_parameters',
  SERIALIZATION_ERROR = 'serialization_error',
  
  // Runtime errors
  WORKER_TERMINATED = 'worker_terminated',
  TIMEOUT = 'timeout',
  
  // Communication errors
  MESSAGE_HANDLING_ERROR = 'message_handling_error',
  
  // Unknown errors
  UNKNOWN = 'unknown'
}

/**
 * Recovery strategies
 */
export enum RecoveryStrategy {
  RETRY = 'retry',
  REDUCE_ITERATIONS = 'reduce_iterations',
  SIMPLIFY_MODEL = 'simplify_model',
  USE_FALLBACK_ALGORITHM = 'use_fallback_algorithm',
  USE_CACHED_RESULTS = 'use_cached_results',
  SPLIT_WORKLOAD = 'split_workload',
  NO_RECOVERY = 'no_recovery'
}

/**
 * Recovery action result
 */
export interface RecoveryResult {
  successful: boolean;
  strategy: RecoveryStrategy;
  newOutputId?: UUID;
  message: string;
  cachedResults?: number[];
}

/**
 * Error details for diagnostic purposes
 */
export interface SimulationErrorDetails {
  type: SimulationErrorType;
  message: string;
  timestamp: number;
  outputId?: UUID;
  completedIterations?: number;
  maxIterations?: number;
  stackTrace?: string;
  location?: string;
  parameters?: any;
}

/**
 * Monte Carlo Recovery Manager
 * Centralized error handling and recovery for Monte Carlo simulations
 */
export class MonteCarloRecoveryManager {
  private static instance: MonteCarloRecoveryManager;
  private errorLog: SimulationErrorDetails[] = [];
  private recoveryAttempts: Map<UUID, number> = new Map();
  private maxRecoveryAttempts = 3;
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): MonteCarloRecoveryManager {
    if (!MonteCarloRecoveryManager.instance) {
      MonteCarloRecoveryManager.instance = new MonteCarloRecoveryManager();
    }
    return MonteCarloRecoveryManager.instance;
  }
  
  /**
   * Handles simulation error by classifying and logging it
   */
  public async handleSimulationError(
    error: any,
    outputId?: UUID,
    parameters?: any
  ): Promise<SimulationErrorDetails> {
    // Parse error object
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stackTrace = error instanceof Error ? error.stack : undefined;
    
    // Try to determine error type from message
    const errorType = this.classifyError(errorMessage);
    
    // Create error details object
    const errorDetails: SimulationErrorDetails = {
      type: errorType,
      message: errorMessage,
      timestamp: Date.now(),
      outputId,
      stackTrace,
      parameters
    };
    
    // Add completed iterations if available
    if (typeof error === 'object' && error !== null) {
      if ('completedIterations' in error) {
        errorDetails.completedIterations = (error as any).completedIterations;
      }
      if ('maxIterations' in error) {
        errorDetails.maxIterations = (error as any).maxIterations;
      }
      if ('location' in error) {
        errorDetails.location = (error as any).location;
      }
    }
    
    // Log error
    this.errorLog.push(errorDetails);
    
    // Update output status if output ID is provided
    if (outputId) {
      try {
        await monteCarloStorageService.updateSimulationOutput(
          outputId,
          { 
            status: 'failed',
            error: errorMessage,
            errorType: errorType,
            errorTimestamp: Date.now()
          }
        );
      } catch (updateError) {
        console.error('Error updating output status:', updateError);
      }
    }
    
    return errorDetails;
  }
  
  /**
   * Attempt to recover from a simulation error
   */
  public async attemptRecovery(
    errorDetails: SimulationErrorDetails,
    retryCallback?: (parameters: any) => Promise<void>
  ): Promise<RecoveryResult> {
    if (!errorDetails.outputId) {
      return {
        successful: false,
        strategy: RecoveryStrategy.NO_RECOVERY,
        message: 'Cannot recover without output ID'
      };
    }
    
    // Check recovery attempts
    const attempts = this.recoveryAttempts.get(errorDetails.outputId) || 0;
    if (attempts >= this.maxRecoveryAttempts) {
      return {
        successful: false,
        strategy: RecoveryStrategy.NO_RECOVERY,
        message: `Maximum recovery attempts (${this.maxRecoveryAttempts}) reached`
      };
    }
    
    // Get simulation output
    let output: SimulationOutput | null = null;
    try {
      output = await monteCarloStorageService.getSimulationOutput(errorDetails.outputId);
    } catch (error) {
      console.error('Error getting simulation output for recovery:', error);
    }
    
    if (!output) {
      return {
        successful: false,
        strategy: RecoveryStrategy.NO_RECOVERY,
        message: 'Could not find simulation output'
      };
    }
    
    // Get simulation input
    const input = await monteCarloStorageService.getSimulationInput(output.inputId);
    if (!input) {
      return {
        successful: false,
        strategy: RecoveryStrategy.NO_RECOVERY,
        message: 'Could not find simulation input'
      };
    }
    
    // Increment recovery attempts
    this.recoveryAttempts.set(errorDetails.outputId, attempts + 1);
    
    // Determine recovery strategy based on error type
    const strategy = this.determineRecoveryStrategy(errorDetails);
    
    // Apply recovery strategy
    switch (strategy) {
      case RecoveryStrategy.RETRY:
        // Simply retry with the same parameters
        if (retryCallback && errorDetails.parameters) {
          try {
            await retryCallback(errorDetails.parameters);
            return {
              successful: true,
              strategy,
              message: 'Retrying simulation with the same parameters'
            };
          } catch (retryError) {
            return {
              successful: false,
              strategy,
              message: `Retry failed: ${retryError instanceof Error ? retryError.message : String(retryError)}`
            };
          }
        }
        break;
        
      case RecoveryStrategy.REDUCE_ITERATIONS:
        // Retry with reduced iterations
        if (retryCallback && errorDetails.parameters) {
          try {
            // Get original iterations
            const originalIterations = input.simulationConfig.iterations;
            
            // Calculate reduced iterations (50% or to completed iterations + 1000, whichever is higher)
            const completedIterations = errorDetails.completedIterations || 0;
            const reducedIterations = Math.max(
              Math.ceil(originalIterations * 0.5),
              completedIterations + 1000
            );
            
            // Update parameters with reduced iterations
            const modifiedParameters = {
              ...errorDetails.parameters,
              iterations: Math.min(reducedIterations, originalIterations - 1)
            };
            
            await retryCallback(modifiedParameters);
            return {
              successful: true,
              strategy,
              message: `Retrying simulation with reduced iterations: ${modifiedParameters.iterations}`
            };
          } catch (retryError) {
            return {
              successful: false,
              strategy,
              message: `Reduced iterations retry failed: ${retryError instanceof Error ? retryError.message : String(retryError)}`
            };
          }
        }
        break;
        
      case RecoveryStrategy.USE_CACHED_RESULTS:
        // Try to find cached results for similar parameters
        try {
          // Check cache key parameters
          if (!input.parameters.tariffSpecificParameters.hsCodes[0]) {
            throw new Error('Missing HS code in parameters');
          }
          
          // Create cache key
          const cacheKey = {
            country: 'Vietnam',
            timeHorizon: 24, // Default time horizon
            hsCode: input.parameters.tariffSpecificParameters.hsCodes[0],
            iterations: input.simulationConfig.iterations,
            simulationVersion: '1.0.0'
          };
          
          // Try to get cached results
          const cachedResult = globalSimulationCache.getResults(cacheKey);
          
          if (cachedResult && cachedResult.results.length > 0) {
            // We found cached results, update the output with them
            const updatedOutput = await monteCarloStorageService.getSimulationOutput(errorDetails.outputId);
            
            if (updatedOutput) {
              // Mark as recovered and use cached results
              await monteCarloStorageService.updateSimulationOutput(
                errorDetails.outputId,
                { 
                  status: 'recovered',
                  errorRecovery: {
                    strategy: RecoveryStrategy.USE_CACHED_RESULTS,
                    originalError: errorDetails.message,
                    recoveryTimestamp: Date.now()
                  }
                }
              );
              
              return {
                successful: true,
                strategy,
                message: 'Using cached results from a similar simulation',
                cachedResults: cachedResult.results
              };
            }
          }
          
          // No cached results found
          return {
            successful: false,
            strategy,
            message: 'No cached results found for similar parameters'
          };
        } catch (cacheError) {
          return {
            successful: false,
            strategy,
            message: `Cache recovery failed: ${cacheError instanceof Error ? cacheError.message : String(cacheError)}`
          };
        }
        
      case RecoveryStrategy.SIMPLIFY_MODEL:
        // Simplify the model by reducing complexity
        if (retryCallback && errorDetails.parameters) {
          try {
            // Simplify model parameters (trade agreements, scenarios, etc.)
            const simplifiedParams = { ...errorDetails.parameters };
            
            // If scenarios are defined, reduce to just baseline
            if (simplifiedParams.scenarios && Array.isArray(simplifiedParams.scenarios)) {
              simplifiedParams.scenarios = ['baseline'];
            }
            
            // If trade agreements are defined, use only the first one
            if (simplifiedParams.tradeAgreements && Array.isArray(simplifiedParams.tradeAgreements)) {
              simplifiedParams.tradeAgreements = [simplifiedParams.tradeAgreements[0]];
            }
            
            // Simplify timeHorizon if it's too long
            if (simplifiedParams.timeHorizon && simplifiedParams.timeHorizon > 12) {
              simplifiedParams.timeHorizon = 12;
            }
            
            await retryCallback(simplifiedParams);
            return {
              successful: true,
              strategy,
              message: 'Retrying with simplified model parameters'
            };
          } catch (retryError) {
            return {
              successful: false,
              strategy,
              message: `Simplified model retry failed: ${retryError instanceof Error ? retryError.message : String(retryError)}`
            };
          }
        }
        break;
        
      case RecoveryStrategy.SPLIT_WORKLOAD:
        // Split the workload into smaller chunks
        if (retryCallback && errorDetails.parameters) {
          try {
            // Create a new output for the split workload
            const newOutput = await monteCarloStorageService.saveSimulationOutput({
              id: monteCarloStorageService.generateUUID(),
              inputId: output.inputId,
              status: 'running',
              startTime: Date.now(),
              progressPercentage: 0,
              splitFrom: errorDetails.outputId
            });
            
            // Get original iterations
            const originalIterations = input.simulationConfig.iterations;
            
            // Split into chunks (e.g., 25% of original)
            const chunkSize = Math.ceil(originalIterations * 0.25);
            
            // Update parameters with chunk size
            const modifiedParameters = {
              ...errorDetails.parameters,
              iterations: chunkSize
            };
            
            await retryCallback(modifiedParameters);
            return {
              successful: true,
              strategy,
              newOutputId: newOutput.id,
              message: `Split workload into chunks of ${chunkSize} iterations`
            };
          } catch (retryError) {
            return {
              successful: false,
              strategy,
              message: `Split workload retry failed: ${retryError instanceof Error ? retryError.message : String(retryError)}`
            };
          }
        }
        break;
        
      case RecoveryStrategy.NO_RECOVERY:
      default:
        return {
          successful: false,
          strategy: RecoveryStrategy.NO_RECOVERY,
          message: 'No viable recovery strategy available'
        };
    }
    
    return {
      successful: false,
      strategy: RecoveryStrategy.NO_RECOVERY,
      message: 'Recovery failed to execute'
    };
  }
  
  /**
   * Classify error based on message and stack trace
   */
  private classifyError(errorMessage: string): SimulationErrorType {
    const lowerMessage = errorMessage.toLowerCase();
    
    // Check for worker initialization errors
    if (lowerMessage.includes('failed to initialize') || 
        lowerMessage.includes('worker not available')) {
      return SimulationErrorType.WORKER_INITIALIZATION;
    }
    
    // Check for memory errors
    if (lowerMessage.includes('out of memory') || 
        lowerMessage.includes('memory limit') ||
        lowerMessage.includes('allocation failed')) {
      return SimulationErrorType.MEMORY_LIMIT_EXCEEDED;
    }
    
    // Check for performance issues
    if (lowerMessage.includes('timeout') || 
        lowerMessage.includes('too slow') ||
        lowerMessage.includes('performance')) {
      return SimulationErrorType.PERFORMANCE_DEGRADATION;
    }
    
    // Check for parameter errors
    if (lowerMessage.includes('invalid parameter') || 
        lowerMessage.includes('missing parameter')) {
      return SimulationErrorType.INVALID_PARAMETERS;
    }
    
    // Check for serialization errors
    if (lowerMessage.includes('json') || 
        lowerMessage.includes('serialize') ||
        lowerMessage.includes('deserialize') ||
        lowerMessage.includes('circular')) {
      return SimulationErrorType.SERIALIZATION_ERROR;
    }
    
    // Check for worker termination
    if (lowerMessage.includes('terminated') || 
        lowerMessage.includes('killed') ||
        lowerMessage.includes('shut down')) {
      return SimulationErrorType.WORKER_TERMINATED;
    }
    
    // Check for message handling errors
    if (lowerMessage.includes('message') && 
        (lowerMessage.includes('error') || lowerMessage.includes('failed'))) {
      return SimulationErrorType.MESSAGE_HANDLING_ERROR;
    }
    
    // Default to unknown
    return SimulationErrorType.UNKNOWN;
  }
  
  /**
   * Determine the best recovery strategy based on error type and details
   */
  private determineRecoveryStrategy(errorDetails: SimulationErrorDetails): RecoveryStrategy {
    switch (errorDetails.type) {
      case SimulationErrorType.WORKER_INITIALIZATION:
        // Worker initialization errors are best handled by retrying
        return RecoveryStrategy.RETRY;
        
      case SimulationErrorType.MEMORY_LIMIT_EXCEEDED:
        // Memory errors require reducing the workload
        return RecoveryStrategy.REDUCE_ITERATIONS;
        
      case SimulationErrorType.PERFORMANCE_DEGRADATION:
        // Performance issues may be addressed by simplifying the model
        return RecoveryStrategy.SIMPLIFY_MODEL;
        
      case SimulationErrorType.INVALID_PARAMETERS:
        // Parameter errors are hard to recover from automatically
        return RecoveryStrategy.NO_RECOVERY;
        
      case SimulationErrorType.SERIALIZATION_ERROR:
        // Serialization errors might be helped by simplifying the model
        return RecoveryStrategy.SIMPLIFY_MODEL;
        
      case SimulationErrorType.WORKER_TERMINATED:
        // Worker termination can be addressed by retrying
        return RecoveryStrategy.RETRY;
        
      case SimulationErrorType.TIMEOUT:
        // Timeouts can be addressed by splitting the workload
        return RecoveryStrategy.SPLIT_WORKLOAD;
        
      case SimulationErrorType.MESSAGE_HANDLING_ERROR:
        // Message handling errors might be helped by retrying
        return RecoveryStrategy.RETRY;
        
      case SimulationErrorType.UNKNOWN:
      default:
        // For unknown errors, try using cached results if available
        return RecoveryStrategy.USE_CACHED_RESULTS;
    }
  }
  
  /**
   * Get error log for diagnostic purposes
   */
  public getErrorLog(): SimulationErrorDetails[] {
    return [...this.errorLog];
  }
  
  /**
   * Clears error log
   */
  public clearErrorLog(): void {
    this.errorLog = [];
  }
  
  /**
   * Reset recovery attempts for a simulation
   */
  public resetRecoveryAttempts(outputId: UUID): void {
    this.recoveryAttempts.delete(outputId);
  }
}

// Export singleton instance
export const monteCarloRecoveryManager = MonteCarloRecoveryManager.getInstance();
export default monteCarloRecoveryManager;