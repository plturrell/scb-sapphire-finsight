// monteCarloAlgorithm.js
// Implementation of Monte Carlo Tree Search for financial forecasting

/**
 * Monte Carlo Tree Search implementation for financial simulations
 * This implements the core MCTS algorithm with adaptations for financial modeling
 */
class MonteCarloTreeSearch {
  constructor(options) {
    // Configuration parameters
    this.initialState = options.initialState || {};
    this.maxIterations = options.maxIterations || 1000;
    this.explorationParameter = options.explorationParameter || 1.41;
    this.timeHorizon = options.timeHorizon || 12; // Months
    this.scenarios = options.scenarios || ['baseline'];
    this.riskTolerance = options.riskTolerance || 'moderate';
    
    // Internal state
    this.root = null;
    this.visitedStates = [];
    this.transitions = [];
    this.nodeCount = 0;
    this.completedIterations = 0;
    this.startTime = 0;
    this.isRunning = false;
    this.confidence = 0.5; // Initial confidence level
  }
  
  initialize() {
    this.root = this.createNode(this.initialState);
    this.visitedStates.push(this.root);
    this.startTime = Date.now();
    this.isRunning = true;
    this.completedIterations = 0;
  }
  
  createNode(state) {
    const node = {
      id: state.id || `node_${this.nodeCount++}`,
      visits: 0,
      value: state.value || 0,
      expectedValue: state.expectedValue || 0,
      totalReward: 0,
      children: [],
      parent: state.parent || null,
      category: state.category || 'default',
      depth: state.depth || 0,
      confidence: state.confidence || 0.5
    };
    
    return node;
  }
  
  runIteration() {
    if (!this.isRunning || this.isComplete()) {
      return false;
    }
    
    // 1. Selection: Select a node to expand using UCB1
    const selectedNode = this.select(this.root);
    
    // 2. Expansion: Add new child nodes to the selected node
    const expandedNode = this.expand(selectedNode);
    
    // 3. Simulation: Run a simulation from the expanded node
    const reward = this.simulate(expandedNode);
    
    // 4. Backpropagation: Update values back up the tree
    this.backpropagate(expandedNode, reward);
    
    this.completedIterations++;
    
    // Update confidence based on number of iterations
    this.confidence = Math.min(0.99, 0.5 + (this.completedIterations / this.maxIterations) * 0.5);
    
    return true;
  }
  
  select(node) {
    // If node has unvisited children, return it for expansion
    if (node.visits === 0 || node.children.length === 0 || 
        (node.children.length < this.getActionSpace(node).length)) {
      return node;
    }
    
    // Use UCB1 formula to select the best child
    let bestScore = -Infinity;
    let bestChild = null;
    
    for (const childId of node.children) {
      const child = this.getNodeById(childId);
      if (!child) continue;
      
      // UCB1 formula: exploitation + exploration
      const exploitation = child.totalReward / child.visits;
      const exploration = Math.sqrt(2 * Math.log(node.visits) / child.visits);
      const ucb1 = exploitation + this.explorationParameter * exploration;
      
      if (ucb1 > bestScore) {
        bestScore = ucb1;
        bestChild = child;
      }
    }
    
    // If we found a best child, recursively select from there
    return bestChild ? this.select(bestChild) : node;
  }
  
  expand(node) {
    // Get the possible actions for this node
    const possibleActions = this.getActionSpace(node);
    
    // Filter out actions that already have corresponding children
    const availableActions = possibleActions.filter(action => {
      const childState = this.getNextState(node, action);
      return !node.children.some(childId => {
        const child = this.getNodeById(childId);
        return child && child.id === childState.id;
      });
    });
    
    // If no available actions, return the node itself
    if (availableActions.length === 0) {
      return node;
    }
    
    // Choose a random action and create a new node
    const randomAction = availableActions[Math.floor(Math.random() * availableActions.length)];
    const nextState = this.getNextState(node, randomAction);
    
    // Create the new child node
    const childNode = this.createNode({
      ...nextState,
      parent: node.id,
      depth: node.depth + 1
    });
    
    // Add the child to the tree
    node.children.push(childNode.id);
    this.visitedStates.push(childNode);
    
    // Record the transition
    this.transitions.push({
      fromId: node.id, 
      toId: childNode.id, 
      action: randomAction,
      probability: 1 / availableActions.length,
      initialProbability: 1 / availableActions.length,
      isHighlyVisited: false
    });
    
    return childNode;
  }
  
  simulate(node) {
    // If we reached terminal state or max depth, return the expected value
    if (this.isTerminalState(node) || node.depth >= this.timeHorizon) {
      return this.evaluateState(node);
    }
    
    // Initialize with current node
    let currentNode = { ...node };
    let currentDepth = node.depth;
    let cumulativeReward = 0;
    
    // Perform a random walk simulation to a terminal state or max depth
    while (!this.isTerminalState(currentNode) && currentDepth < this.timeHorizon) {
      // Get possible actions for the current state
      const possibleActions = this.getActionSpace(currentNode);
      
      if (possibleActions.length === 0) {
        break;
      }
      
      // Choose a random action
      const randomAction = possibleActions[Math.floor(Math.random() * possibleActions.length)];
      
      // Get the next state
      const nextState = this.getNextState(currentNode, randomAction);
      currentNode = {
        ...nextState,
        depth: currentDepth + 1
      };
      
      // Update depth
      currentDepth++;
      
      // Accumulate immediate reward
      cumulativeReward += this.getReward(currentNode);
    }
    
    // Add final state evaluation
    cumulativeReward += this.evaluateState(currentNode);
    
    // Apply discount factor based on depth
    const discountFactor = Math.pow(0.95, currentDepth - node.depth);
    return cumulativeReward * discountFactor;
  }
  
  backpropagate(node, reward) {
    let currentNode = node;
    
    // Update the node and all its ancestors
    while (currentNode) {
      currentNode.visits += 1;
      currentNode.totalReward += reward;
      currentNode.expectedValue = currentNode.totalReward / currentNode.visits;
      
      // Get parent node
      const parentId = currentNode.parent;
      currentNode = parentId ? this.getNodeById(parentId) : null;
    }
    
    // Update transition probabilities based on visit counts
    this.updateTransitionProbabilities();
  }
  
  updateTransitionProbabilities() {
    // Only update periodically for performance
    if (this.completedIterations % 50 !== 0) return;
    
    // Group transitions by source node
    const nodeTransitions = {};
    
    this.transitions.forEach(transition => {
      if (!nodeTransitions[transition.fromId]) {
        nodeTransitions[transition.fromId] = [];
      }
      nodeTransitions[transition.fromId].push(transition);
    });
    
    // For each source node, update probabilities based on visit counts
    Object.keys(nodeTransitions).forEach(fromId => {
      const sourceNode = this.getNodeById(fromId);
      const transitions = nodeTransitions[fromId];
      
      // Skip if no transitions or source node not found
      if (!transitions.length || !sourceNode) return;
      
      // Get total visits across all children
      const childrenIds = sourceNode.children;
      let totalChildVisits = 0;
      
      childrenIds.forEach(childId => {
        const child = this.getNodeById(childId);
        if (child) {
          totalChildVisits += child.visits;
        }
      });
      
      // Update each transition probability
      transitions.forEach(transition => {
        const targetNode = this.getNodeById(transition.toId);
        if (targetNode && totalChildVisits > 0) {
          transition.probability = targetNode.visits / totalChildVisits;
          
          // Mark as highly visited if probability significantly increased
          if (transition.probability > 1.5 * transition.initialProbability) {
            transition.isHighlyVisited = true;
          }
        }
      });
    });
  }
  
  getNodeById(id) {
    return this.visitedStates.find(state => state.id === id);
  }
  
  isTerminalState(node) {
    // Terminal states are those that have reached the time horizon or have no valid actions
    return node.depth >= this.timeHorizon || this.getActionSpace(node).length === 0;
  }
  
  evaluateState(node) {
    // Basic evaluation - can be expanded for more sophisticated models
    const baseValue = node.value || 0;
    
    // Apply risk-based adjustments based on risk tolerance
    let riskMultiplier = 1.0;
    switch (this.riskTolerance) {
      case 'conservative':
        riskMultiplier = 0.8;
        break;
      case 'aggressive':
        riskMultiplier = 1.2;
        break;
      default: // moderate
        riskMultiplier = 1.0;
    }
    
    // Apply scenario-based adjustments
    let scenarioMultiplier = 1.0;
    if (this.scenarios.includes('recession')) {
      // Add recession probability
      scenarioMultiplier *= 0.7 + 0.3 * Math.random();
    }
    if (this.scenarios.includes('growth')) {
      // Add growth probability
      scenarioMultiplier *= 1.1 + 0.3 * Math.random();
    }
    
    // Apply time-based discount
    const timeDiscount = Math.pow(0.95, node.depth);
    
    return baseValue * riskMultiplier * scenarioMultiplier * timeDiscount;
  }
  
  getReward(node) {
    // Simple reward function based on value change
    return node.value * 0.05 * (Math.random() - 0.3); // Base growth minus some volatility
  }
  
  getActionSpace(node) {
    // Generate possible financial actions based on the current node
    // For a financial context, these could be different investment decisions
    const actions = [];
    
    // Basic actions common to all states
    actions.push('hold');
    
    // Add investment actions if not at max depth
    if (node.depth < this.timeHorizon - 1) {
      actions.push('invest');
      actions.push('diversify');
      
      // Add risk-related actions based on risk tolerance
      if (this.riskTolerance === 'aggressive') {
        actions.push('leverage');
      }
      if (this.riskTolerance === 'conservative') {
        actions.push('hedge');
      }
    }
    
    // Add reallocation actions
    actions.push('reallocate');
    
    // Add scenario-specific actions
    if (this.scenarios.includes('recession')) {
      actions.push('defensive');
    }
    if (this.scenarios.includes('growth')) {
      actions.push('growth');
    }
    
    return actions;
  }
  
  getNextState(node, action) {
    // Generate the next state based on the current state and action
    const baseValue = node.value || 100;
    let newValue = baseValue;
    let category = node.category;
    
    // Apply action-specific transformations
    switch (action) {
      case 'hold':
        // Small natural growth or decline
        newValue = baseValue * (1 + (Math.random() * 0.04 - 0.01));
        break;
        
      case 'invest':
        // Higher potential return but more volatility
        newValue = baseValue * (1 + (Math.random() * 0.12 - 0.04));
        category = 'investment';
        break;
        
      case 'diversify':
        // Lower volatility, moderate growth
        newValue = baseValue * (1 + (Math.random() * 0.06 - 0.01));
        category = 'diversified';
        break;
        
      case 'leverage':
        // Higher volatility, potential for large gains or losses
        newValue = baseValue * (1 + (Math.random() * 0.25 - 0.1));
        category = 'leveraged';
        break;
        
      case 'hedge':
        // Much lower volatility, very stable
        newValue = baseValue * (1 + (Math.random() * 0.03 - 0.01));
        category = 'hedged';
        break;
        
      case 'reallocate':
        // Medium volatility, medium growth
        newValue = baseValue * (1 + (Math.random() * 0.08 - 0.03));
        category = 'reallocated';
        break;
        
      case 'defensive':
        // Best in recession scenarios
        if (this.scenarios.includes('recession')) {
          newValue = baseValue * (1 + (Math.random() * 0.05 - 0.01));
        } else {
          newValue = baseValue * (1 + (Math.random() * 0.03 - 0.02));
        }
        category = 'defensive';
        break;
        
      case 'growth':
        // Best in growth scenarios
        if (this.scenarios.includes('growth')) {
          newValue = baseValue * (1 + (Math.random() * 0.15 - 0.03));
        } else {
          newValue = baseValue * (1 + (Math.random() * 0.07 - 0.05));
        }
        category = 'growth';
        break;
    }
    
    // Ensure values don't go negative
    newValue = Math.max(0, newValue);
    
    // Create a unique ID for the new state
    const stateId = `${node.id}_${action}_${this.nodeCount}`;
    
    return {
      id: stateId,
      value: newValue,
      category: category,
      confidence: Math.min(node.confidence * 0.95, 0.99) // Confidence decreases with depth
    };
  }
  
  isComplete() {
    return this.completedIterations >= this.maxIterations || !this.isRunning;
  }
  
  getProgress() {
    const progress = this.completedIterations / this.maxIterations;
    const timeElapsed = Date.now() - this.startTime;
    const timePerIteration = this.completedIterations > 0 ? timeElapsed / this.completedIterations : 0;
    const remainingIterations = this.maxIterations - this.completedIterations;
    const estimatedTimeRemaining = timePerIteration * remainingIterations;
    
    return {
      completedIterations: this.completedIterations,
      maxIterations: this.maxIterations,
      progress: progress,
      timeElapsed: timeElapsed,
      estimatedTimeRemaining: estimatedTimeRemaining,
      confidence: this.confidence,
      confidenceInterval: this.calculateConfidenceInterval()
    };
  }
  
  calculateConfidenceInterval() {
    if (!this.root || this.root.visits === 0) {
      return { lower: 0, upper: 0 };
    }
    
    const mean = this.root.expectedValue;
    // Standard deviation approximation based on MCTS visits
    const stdDev = Math.sqrt(Math.abs(mean) / (this.root.visits + 1));
    
    // 95% confidence interval
    const z = 1.96;
    return {
      lower: mean - z * stdDev,
      upper: mean + z * stdDev
    };
  }
  
  getCurrentState() {
    return {
      visitedStates: this.visitedStates,
      transitions: this.transitions,
      root: this.root
    };
  }
  
  getFinalState() {
    // Return the full state of the tree
    return {
      visitedStates: this.visitedStates,
      transitions: this.transitions,
      root: this.root,
      stats: {
        iterations: this.completedIterations,
        duration: Date.now() - this.startTime,
        nodeCount: this.nodeCount,
        confidence: this.confidence
      }
    };
  }
  
  getOptimalPath() {
    // Find the path with highest expected value
    const path = [];
    let currentNode = this.root;
    
    while (currentNode && currentNode.children.length > 0) {
      // Find the child with highest expected value
      let bestChild = null;
      let bestValue = -Infinity;
      
      for (const childId of currentNode.children) {
        const child = this.getNodeById(childId);
        if (child && child.expectedValue > bestValue && child.visits > 0) {
          bestValue = child.expectedValue;
          bestChild = child;
        }
      }
      
      if (!bestChild) break;
      
      // Find the transition
      const transition = this.transitions.find(
        t => t.fromId === currentNode.id && t.toId === bestChild.id
      );
      
      path.push({
        from: currentNode.id,
        to: bestChild.id,
        action: transition ? transition.action : 'unknown',
        expectedValue: bestChild.expectedValue,
        confidence: bestChild.confidence
      });
      
      currentNode = bestChild;
    }
    
    return path;
  }
  
  getExpectedValue() {
    return this.root ? this.root.expectedValue : 0;
  }
  
  getRiskMetrics() {
    // Calculate various risk metrics based on the simulation results
    const returns = [];
    
    // Collect all possible terminal state values
    const terminalStates = this.visitedStates.filter(
      node => this.isTerminalState(node) || node.depth === this.timeHorizon
    );
    
    terminalStates.forEach(state => {
      if (state.visits > 0) {
        const returnRate = (state.value - this.root.value) / this.root.value;
        returns.push(returnRate);
      }
    });
    
    // If no returns data, return default metrics
    if (returns.length === 0) {
      return {
        volatility: 0,
        sharpeRatio: 0,
        valueatRisk: 0,
        maxDrawdown: 0
      };
    }
    
    // Calculate mean return
    const meanReturn = returns.reduce((sum, val) => sum + val, 0) / returns.length;
    
    // Calculate volatility (standard deviation)
    const variance = returns.reduce((sum, val) => sum + Math.pow(val - meanReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);
    
    // Calculate Sharpe ratio (assuming risk-free rate of 0.02)
    const riskFreeRate = 0.02;
    const sharpeRatio = (meanReturn - riskFreeRate) / volatility;
    
    // Calculate Value at Risk (VaR) - 95% confidence
    returns.sort((a, b) => a - b);
    const varIndex = Math.floor(returns.length * 0.05);
    const valueatRisk = Math.abs(returns[varIndex]);
    
    // Calculate Max Drawdown
    let maxDrawdown = 0;
    let peak = -Infinity;
    
    // Convert returns to a cumulative value path
    const cumulativeReturns = [1];
    for (let i = 0; i < returns.length; i++) {
      cumulativeReturns.push(cumulativeReturns[i] * (1 + returns[i]));
    }
    
    // Calculate drawdown
    for (const value of cumulativeReturns) {
      if (value > peak) {
        peak = value;
      }
      const drawdown = (peak - value) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    return {
      volatility,
      sharpeRatio,
      valueatRisk,
      maxDrawdown
    };
  }
}

// Make the class available globally for the worker
self.MonteCarloTreeSearch = MonteCarloTreeSearch;
