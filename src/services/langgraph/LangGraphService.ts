/**
 * LangGraph Service
 * Provides a service interface for the LangGraph pipeline
 */

import { 
  registerGraph, 
  registerHandler, 
  executePipeline,
  getGraphState,
  getExecutionResult
} from './runtime';
import { handlers } from './handlers';
import { graphs } from './graphs';
import { PipelineExecutionRequest, PipelineExecutionResult } from './types';

/**
 * LangGraph Service Class
 * Manages LangGraph pipelines for processing financial data
 */
class LangGraphService {
  private initialized = false;
  
  /**
   * Initialize the LangGraph service
   */
  public initialize(): void {
    if (this.initialized) {
      return;
    }
    
    console.log('Initializing LangGraph Service');
    
    // Register all handlers
    Object.entries(handlers).forEach(([handlerId, handler]) => {
      registerHandler(handlerId, handler);
    });
    
    // Register all graphs
    Object.values(graphs).forEach(graph => {
      registerGraph(graph);
    });
    
    this.initialized = true;
    console.log('LangGraph Service initialized successfully');
  }
  
  /**
   * Check if the service is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Execute a pipeline
   */
  public async executePipeline(request: PipelineExecutionRequest): Promise<PipelineExecutionResult> {
    if (!this.initialized) {
      this.initialize();
    }
    
    return await executePipeline(request);
  }
  
  /**
   * Process company data through the company analysis pipeline
   */
  public async processCompanyData(companyName: string): Promise<PipelineExecutionResult> {
    return this.executePipeline({
      graphId: 'company_analysis_graph',
      inputs: { company: companyName },
    });
  }
  
  /**
   * Process market news through the market news pipeline
   */
  public async processMarketNews(topic: string, limit: number = 5): Promise<PipelineExecutionResult> {
    return this.executePipeline({
      graphId: 'market_news_graph',
      inputs: { topic, limit },
    });
  }
  
  /**
   * Process financial insights through the financial insights pipeline
   */
  public async processFinancialInsights(topic: string): Promise<PipelineExecutionResult> {
    return this.executePipeline({
      graphId: 'financial_insights_graph',
      inputs: { topic },
    });
  }
  
  /**
   * Get pipeline execution state
   */
  public async getPipelineState(stateId: string): Promise<any> {
    return await getGraphState(stateId);
  }
  
  /**
   * Get pipeline execution result
   */
  public async getPipelineResult(resultId: string): Promise<any> {
    return await getExecutionResult(resultId);
  }
}

// Export a singleton instance for use throughout the application
const langGraphService = new LangGraphService();
export default langGraphService;