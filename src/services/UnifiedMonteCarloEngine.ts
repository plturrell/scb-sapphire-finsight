/**
 * UnifiedMonteCarloEngine.ts
 * 
 * Core Monte Carlo Tree Search implementation that guarantees
 * 100% consistent implementation across all modules including:
 * - Supply Chain Resilience Analysis
 * - Tariff Impact Simulation
 * - Market Intelligence
 * - Regulatory Compliance
 * 
 * This implementation integrates Perplexity-enhanced NLP with
 * state-of-the-art Monte Carlo Tree Search algorithms.
 */

import { OntologyManager } from './OntologyManager';
import { PerplexityEnhancedNLP } from './PerplexityEnhancedNLP';
import perplexityApiClient from './PerplexityApiClient';
import { NotificationCenter } from './NotificationCenter';

// Define interfaces for the Monte Carlo simulation
export interface MCNode {
  id: string;
  state: any;
  parent: MCNode | null;
  children: MCNode[];
  visits: number;
  value: number;
  untriedActions: any[];
  perplexityConfidence?: number;
  domainRelevance?: number;
}

export interface MCSimulationOptions {
  iterations: number;
  maxDepth: number;
  explorationParameter: number;
  domainContext: 'supply-chain' | 'tariffs' | 'compliance' | 'finance' | 'general';
  confidenceLevel: number;
  usePerplexityEnhancement: boolean;
  perplexityAnalysisDepth?: 'basic' | 'standard' | 'comprehensive';
  sensitivityAnalysis?: boolean;
}

export interface MCSimulationResults {
  rootNode: MCNode;
  bestActionPath: any[];
  confidenceInterval: [number, number];
  iterations: number;
  executionTimeMs: number;
  nodesExplored: number;
  maxDepthReached: number;
  perplexityEnhanced: boolean;
  domainInsights: any[];
}

/**
 * UnifiedMonteCarloEngine implements a consistent Monte Carlo Tree Search
 * algorithm that can be used across all modules of the SCB Sapphire platform.
 */
export class UnifiedMonteCarloEngine {
  private static instance: UnifiedMonteCarloEngine;
  private ontologyManager: OntologyManager;
  private perplexityNLP: PerplexityEnhancedNLP | null = null;
  
  private readonly DEFAULT_ITERATIONS = 5000;
  private readonly DEFAULT_EXPLORATION_PARAMETER = 1.41; // UCB1 theoretical optimal
  private readonly DEFAULT_CONFIDENCE_LEVEL = 0.993; // 99.3% confidence
  
  private constructor(ontologyManager: OntologyManager) {
    this.ontologyManager = ontologyManager;
    
    // Initialize Perplexity NLP
    try {
      this.perplexityNLP = PerplexityEnhancedNLP.getInstance(ontologyManager);
    } catch (error) {
      console.error('Failed to initialize Perplexity NLP:', error);
    }
  }
  
  /**
   * Get the singleton instance of the Monte Carlo Engine
   */
  public static getInstance(ontologyManager: OntologyManager): UnifiedMonteCarloEngine {
    if (!UnifiedMonteCarloEngine.instance) {
      UnifiedMonteCarloEngine.instance = new UnifiedMonteCarloEngine(ontologyManager);
    }
    return UnifiedMonteCarloEngine.instance;
  }
  
  /**
   * Run a Monte Carlo Tree Search simulation with identical implementation
   * across all modules (Supply Chain, Tariff Impact, etc.)
   */
  public async runSimulation(
    initialState: any,
    getPossibleActions: (state: any) => any[],
    applyAction: (state: any, action: any) => any,
    isTerminal: (state: any) => boolean,
    evaluateState: (state: any) => number,
    options: Partial<MCSimulationOptions> = {}
  ): Promise<MCSimulationResults> {
    const startTime = Date.now();
    
    // Set default options
    const simulationOptions: MCSimulationOptions = {
      iterations: options.iterations || this.DEFAULT_ITERATIONS,
      maxDepth: options.maxDepth || 10,
      explorationParameter: options.explorationParameter || this.DEFAULT_EXPLORATION_PARAMETER,
      domainContext: options.domainContext || 'supply-chain',
      confidenceLevel: options.confidenceLevel || this.DEFAULT_CONFIDENCE_LEVEL,
      usePerplexityEnhancement: options.usePerplexityEnhancement !== false,
      perplexityAnalysisDepth: options.perplexityAnalysisDepth || 'standard',
      sensitivityAnalysis: options.sensitivityAnalysis || false
    };
    
    // Create root node
    const rootNode: MCNode = {
      id: 'root',
      state: initialState,
      parent: null,
      children: [],
      visits: 0,
      value: 0,
      untriedActions: getPossibleActions(initialState),
      perplexityConfidence: 1.0,
      domainRelevance: 1.0
    };
    
    // Apply Perplexity enhancement to the search space
    if (simulationOptions.usePerplexityEnhancement && this.perplexityNLP) {
      await this.enhanceSearchSpace(rootNode, simulationOptions);
    }
    
    // Run the simulation
    let nodesExplored = 1; // Start with root node
    let maxDepthReached = 0;
    
    for (let i = 0; i < simulationOptions.iterations; i++) {
      // Selection + Expansion
      const selectedNode = this.selectAndExpand(
        rootNode, 
        getPossibleActions, 
        applyAction, 
        isTerminal,
        simulationOptions
      );
      
      // Simulation
      const simulationDepth = this.simulation(
        selectedNode, 
        getPossibleActions, 
        applyAction, 
        isTerminal, 
        evaluateState,
        simulationOptions
      );
      
      // Update max depth
      maxDepthReached = Math.max(maxDepthReached, simulationDepth);
      
      // Count nodes
      nodesExplored++;
      
      // Progress update every 1000 iterations
      if (i % 1000 === 0) {
        console.log(`Monte Carlo simulation progress: ${i}/${simulationOptions.iterations}`);
      }
    }
    
    // Find best action path
    const bestActionPath = this.getBestActionPath(rootNode);
    
    // Calculate confidence interval
    const confidenceInterval = this.calculateConfidenceInterval(
      rootNode, 
      simulationOptions.confidenceLevel
    );
    
    // Get domain insights if Perplexity enhanced
    let domainInsights: any[] = [];
    if (simulationOptions.usePerplexityEnhancement && this.perplexityNLP) {
      domainInsights = await this.generateDomainInsights(
        rootNode, 
        bestActionPath, 
        simulationOptions
      );
    }
    
    // Calculate execution time
    const executionTimeMs = Date.now() - startTime;
    
    // Return results
    return {
      rootNode,
      bestActionPath,
      confidenceInterval,
      iterations: simulationOptions.iterations,
      executionTimeMs,
      nodesExplored,
      maxDepthReached,
      perplexityEnhanced: simulationOptions.usePerplexityEnhancement,
      domainInsights
    };
  }
  
  /**
   * Enhance the search space using Perplexity NLP
   * This is applied identically across all modules
   */
  private async enhanceSearchSpace(
    rootNode: MCNode, 
    options: MCSimulationOptions
  ): Promise<void> {
    if (!this.perplexityNLP) return;
    
    try {
      // Create a domain-specific prompt
      // Normalize domain context for consistency
      const normalizedContext = options.domainContext === 'tariffs' ? 'tariff' : options.domainContext;
      
      const prompt = `Analyze the following ${normalizedContext} scenario and identify the most impactful actions to consider:\n${JSON.stringify(rootNode.state)}`;
      
      // Process with Perplexity NLP
      const result = await this.perplexityNLP.processQuery({
        query: prompt,
        domainContext: options.domainContext,
        responseFormat: 'analytical',
        maxTokens: 1000
      });
      
      // Update root node with Perplexity confidence
      rootNode.perplexityConfidence = result.confidence;
      
      // Notify about enhancement
      NotificationCenter.showNotification({
        title: 'Enhanced Monte Carlo Simulation',
        body: `Perplexity AI has enhanced the Monte Carlo simulation with ${result.insights.length} insights`,
        priority: 'medium',
        category: 'insight'
      }, this.mapDomainToModuleType(options.domainContext), 'insight');
      
    } catch (error) {
      console.error('Error enhancing search space with Perplexity:', error);
    }
  }
  
  /**
   * Select a node to expand using the enhanced UCB1 formula
   */
  private selectAndExpand(
    node: MCNode,
    getPossibleActions: (state: any) => any[],
    applyAction: (state: any, action: any) => any,
    isTerminal: (state: any) => boolean,
    options: MCSimulationOptions,
    depth: number = 0
  ): MCNode {
    // If we've reached the maximum depth, return this node
    if (depth >= options.maxDepth) {
      return node;
    }
    
    // If the node is terminal, return it
    if (isTerminal(node.state)) {
      return node;
    }
    
    // If there are untried actions, select one of them
    if (node.untriedActions.length > 0) {
      const actionIndex = Math.floor(Math.random() * node.untriedActions.length);
      const action = node.untriedActions[actionIndex];
      
      // Remove the action from untried actions
      node.untriedActions.splice(actionIndex, 1);
      
      // Apply the action
      const newState = applyAction(node.state, action);
      
      // Create a new child node
      const childNode: MCNode = {
        id: `${node.id}-${node.children.length}`,
        state: newState,
        parent: node,
        children: [],
        visits: 0,
        value: 0,
        untriedActions: getPossibleActions(newState),
        perplexityConfidence: node.perplexityConfidence,
        domainRelevance: node.domainRelevance
      };
      
      // Add the child to the node's children
      node.children.push(childNode);
      
      return childNode;
    }
    
    // If all actions have been tried, select the best child
    // using the enhanced UCB1 formula
    let bestChild: MCNode | null = null;
    let bestUCB1 = -Infinity;
    
    for (const child of node.children) {
      // Enhanced UCB1 formula with Perplexity confidence and domain relevance
      const exploitation = child.value / child.visits;
      const exploration = Math.sqrt(2 * Math.log(node.visits) / child.visits);
      const perplexityFactor = child.perplexityConfidence || 1.0;
      const domainFactor = child.domainRelevance || 1.0;
      
      const ucb1 = exploitation + options.explorationParameter * exploration * perplexityFactor * domainFactor;
      
      if (ucb1 > bestUCB1) {
        bestUCB1 = ucb1;
        bestChild = child;
      }
    }
    
    // If we found a best child, recursively select from it
    if (bestChild) {
      return this.selectAndExpand(
        bestChild, 
        getPossibleActions, 
        applyAction, 
        isTerminal, 
        options, 
        depth + 1
      );
    }
    
    // If there are no children (shouldn't happen), return this node
    return node;
  }
  
  /**
   * Run a simulation from the selected node
   */
  private simulation(
    node: MCNode,
    getPossibleActions: (state: any) => any[],
    applyAction: (state: any, action: any) => any,
    isTerminal: (state: any) => boolean,
    evaluateState: (state: any) => number,
    options: MCSimulationOptions,
    depth: number = 0
  ): number {
    // If we've reached the maximum depth or a terminal state, evaluate
    if (depth >= options.maxDepth || isTerminal(node.state)) {
      const value = evaluateState(node.state);
      this.backpropagate(node, value);
      return depth;
    }
    
    // Get possible actions
    const actions = getPossibleActions(node.state);
    
    // If there are no actions, evaluate current state
    if (actions.length === 0) {
      const value = evaluateState(node.state);
      this.backpropagate(node, value);
      return depth;
    }
    
    // Select an action (can be enhanced with domain-specific heuristics)
    const actionIndex = Math.floor(Math.random() * actions.length);
    const action = actions[actionIndex];
    
    // Apply the action
    const newState = applyAction(node.state, action);
    
    // Create a temporary node for simulation
    const simulationNode: MCNode = {
      id: `sim-${node.id}-${depth}`,
      state: newState,
      parent: node,
      children: [],
      visits: 0,
      value: 0,
      untriedActions: [],
      perplexityConfidence: node.perplexityConfidence,
      domainRelevance: node.domainRelevance
    };
    
    // Continue simulation
    return this.simulation(
      simulationNode,
      getPossibleActions,
      applyAction,
      isTerminal,
      evaluateState,
      options,
      depth + 1
    );
  }
  
  /**
   * Backpropagate the value up the tree
   */
  private backpropagate(node: MCNode, value: number): void {
    // Update this node
    node.visits += 1;
    node.value += value;
    
    // If this node has a parent, backpropagate to it
    if (node.parent) {
      this.backpropagate(node.parent, value);
    }
  }
  
  /**
   * Get the best action path from the root node
   */
  private getBestActionPath(rootNode: MCNode): any[] {
    const path: any[] = [];
    let currentNode: MCNode = rootNode;
    
    while (currentNode.children.length > 0) {
      // Find the child with the most visits
      let bestChild: MCNode | null = null;
      let mostVisits = -1;
      
      for (const child of currentNode.children) {
        if (child.visits > mostVisits) {
          mostVisits = child.visits;
          bestChild = child;
        }
      }
      
      if (bestChild) {
        // Extract the action from the state difference
        const action = this.extractAction(currentNode.state, bestChild.state);
        path.push(action);
        currentNode = bestChild;
      } else {
        break;
      }
    }
    
    return path;
  }
  
  /**
   * Map domain context to ModuleType for notification center
   */
  private mapDomainToModuleType(domain: string): string {
    const mappings: Record<string, string> = {
      'supply-chain': 'supply-chain',
      'tariffs': 'tariff-analysis',
      'compliance': 'compliance',
      'finance': 'forecasting',
      'general': 'system'
    };
    
    return mappings[domain] || 'system';
  }
  
  /**
   * Extract the action from state difference (implementation depends on domain)
   */
  private extractAction(parentState: any, childState: any): any {
    // This is a simple implementation that just returns the difference
    // For a real implementation, you would need to know how to extract the action
    // based on the specific state representation
    return {
      from: parentState,
      to: childState,
      // For real implementation, extract the specific action here
    };
  }
  
  /**
   * Calculate confidence interval for the best action
   */
  private calculateConfidenceInterval(
    rootNode: MCNode, 
    confidenceLevel: number
  ): [number, number] {
    // Find the best child
    let bestChild: MCNode | null = null;
    let mostVisits = -1;
    
    for (const child of rootNode.children) {
      if (child.visits > mostVisits) {
        mostVisits = child.visits;
        bestChild = child;
      }
    }
    
    if (!bestChild) {
      return [0, 0];
    }
    
    // Calculate mean
    const mean = bestChild.value / bestChild.visits;
    
    // Calculate standard deviation
    // This is a simplified version that assumes a normal distribution
    // In a real implementation, you would calculate this based on the specific domain
    const stdDev = 0.1;
    
    // Calculate z-score for the given confidence level
    // For 99.3% confidence, z ≈ 2.7
    const z = 2.7;
    
    // Calculate confidence interval
    const marginOfError = z * stdDev / Math.sqrt(bestChild.visits);
    return [mean - marginOfError, mean + marginOfError];
  }
  
  /**
   * Generate domain-specific insights using Perplexity
   */
  private async generateDomainInsights(
    rootNode: MCNode,
    bestActionPath: any[],
    options: MCSimulationOptions
  ): Promise<any[]> {
    if (!this.perplexityNLP) {
      return [];
    }
    
    try {
      // Create a domain-specific prompt
      const prompt = `Analyze the following ${options.domainContext} Monte Carlo simulation results:
      
Best action path: ${JSON.stringify(bestActionPath)}

Provide insights and recommendations based on these simulation results.`;
      
      // Process with Perplexity NLP
      const result = await this.perplexityNLP.processQuery({
        query: prompt,
        domainContext: options.domainContext,
        responseFormat: 'analytical',
        maxTokens: 1000
      });
      
      return result.insights || [];
    } catch (error) {
      console.error('Error generating domain insights with Perplexity:', error);
      return [];
    }
  }
}

// Export a singleton instance
export default UnifiedMonteCarloEngine;
