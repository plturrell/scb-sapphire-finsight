/**
 * Monte Carlo Tree Search implementation for financial analysis
 * Used for predictive modeling, risk assessment, and optimal decision-making
 */

export interface MCTSNode {
  state: FinancialState;
  parent: MCTSNode | null;
  children: MCTSNode[];
  visits: number;
  reward: number;
  untried_actions: any[];
}

export interface FinancialState {
  assets: Record<string, number>;
  timeframe: string;
  risks: Record<string, number>;
  market_conditions: Record<string, any>;
  target_metrics: Record<string, any>;
}

export interface SimulationResult {
  expected_return: number;
  risk_assessment: number;
  confidence_interval: [number, number];
  optimal_path: FinancialState[];
  iterations: number;
}

export class MonteCarloTreeSearch {
  private c_param: number = 1.41; // Exploration parameter
  private max_iterations: number = 10000;
  private max_depth: number = 10;
  
  constructor(iterations?: number, explorationParameter?: number) {
    if (iterations) this.max_iterations = iterations;
    if (explorationParameter) this.c_param = explorationParameter;
  }
  
  /**
   * Run Monte Carlo Tree Search on financial data
   * @param initial_state Initial financial state
   * @param available_actions Set of possible financial actions
   * @param reward_function Function to calculate reward for a state
   */
  runMCTS(
    initial_state: FinancialState,
    available_actions: (state: FinancialState) => any[],
    reward_function: (state: FinancialState) => number
  ): SimulationResult {
    // Create root node
    const root: MCTSNode = {
      state: initial_state,
      parent: null,
      children: [],
      visits: 0,
      reward: 0,
      untried_actions: available_actions(initial_state)
    };
    
    // Run iterations
    const start_time = Date.now();
    let iterations = 0;
    
    const results: number[] = [];
    const states_path: FinancialState[] = [];
    
    for (let i = 0; i < this.max_iterations; i++) {
      // 1. Selection
      let node = this.select(root);
      
      // 2. Expansion
      if (node.untried_actions.length > 0) {
        node = this.expand(node, available_actions);
      }
      
      // 3. Simulation
      const terminal_state = this.simulate(node.state, available_actions, reward_function);
      
      // 4. Backpropagation
      const reward = reward_function(terminal_state);
      this.backpropagate(node, reward);
      
      results.push(reward);
      iterations++;
    }
    
    // Extract best path
    let current = root;
    const optimal_path: FinancialState[] = [root.state];
    
    while (current.children.length > 0) {
      current = this.best_child(current, 0); // Exploitation only
      optimal_path.push(current.state);
    }
    
    // Calculate statistics
    const expected_return = results.reduce((a, b) => a + b, 0) / results.length;
    results.sort((a, b) => a - b);
    const lower = results[Math.floor(results.length * 0.05)]; // 5th percentile
    const upper = results[Math.floor(results.length * 0.95)]; // 95th percentile
    
    // Risk assessment (simplified - based on variance of results)
    const variance = results.reduce((sum, val) => sum + Math.pow(val - expected_return, 2), 0) / results.length;
    const risk_assessment = Math.sqrt(variance) / expected_return; // Coefficient of variation as risk measure
    
    return {
      expected_return,
      risk_assessment,
      confidence_interval: [lower, upper],
      optimal_path,
      iterations
    };
  }
  
  /**
   * Select a node to expand using UCB1
   */
  private select(node: MCTSNode): MCTSNode {
    while (node.untried_actions.length === 0 && node.children.length > 0) {
      node = this.best_child(node, this.c_param);
    }
    return node;
  }
  
  /**
   * Expand node by trying a new action
   */
  private expand(node: MCTSNode, available_actions: (state: FinancialState) => any[]): MCTSNode {
    const action = node.untried_actions.pop();
    const next_state = this.apply_action(node.state, action);
    
    const child: MCTSNode = {
      state: next_state,
      parent: node,
      children: [],
      visits: 0,
      reward: 0,
      untried_actions: available_actions(next_state)
    };
    
    node.children.push(child);
    return child;
  }
  
  /**
   * Simulate from state until terminal state
   */
  private simulate(state: FinancialState, 
                  available_actions: (state: FinancialState) => any[],
                  reward_function: (state: FinancialState) => number): FinancialState {
    let current_state = { ...state };
    let depth = 0;
    
    while (depth < this.max_depth) {
      const actions = available_actions(current_state);
      if (actions.length === 0) break;
      
      // Random action selection for simulation
      const action = actions[Math.floor(Math.random() * actions.length)];
      current_state = this.apply_action(current_state, action);
      depth += 1;
    }
    
    return current_state;
  }
  
  /**
   * Backpropagate results
   */
  private backpropagate(node: MCTSNode, reward: number): void {
    let current = node;
    while (current !== null) {
      current.visits += 1;
      current.reward += reward;
      current = current.parent as MCTSNode;
    }
  }
  
  /**
   * Select best child using UCB1 formula
   */
  private best_child(node: MCTSNode, c_param: number): MCTSNode {
    const weights = node.children.map(child => {
      const exploitation = child.reward / child.visits;
      const exploration = c_param * Math.sqrt(2 * Math.log(node.visits) / child.visits);
      return exploitation + exploration;
    });
    
    const max_index = weights.indexOf(Math.max(...weights));
    return node.children[max_index];
  }
  
  /**
   * Apply an action to a state
   */
  private apply_action(state: FinancialState, action: any): FinancialState {
    // Deep copy the state
    const new_state = JSON.parse(JSON.stringify(state));
    
    // Apply the action effects (simplified example)
    if (action.type === 'buy_asset') {
      new_state.assets[action.asset] = (new_state.assets[action.asset] || 0) + action.amount;
    } else if (action.type === 'sell_asset') {
      new_state.assets[action.asset] = Math.max(0, (new_state.assets[action.asset] || 0) - action.amount);
    } else if (action.type === 'market_change') {
      // Apply market conditions changes
      for (const [key, value] of Object.entries(action.changes)) {
        new_state.market_conditions[key] = value;
      }
    }
    
    return new_state;
  }
  
  /**
   * Run advanced portfolio optimization using MCTS
   */
  runPortfolioOptimization(
    initial_portfolio: Record<string, number>,
    market_data: any,
    risk_tolerance: number,
    investment_horizon: string
  ): SimulationResult {
    const initial_state: FinancialState = {
      assets: initial_portfolio,
      timeframe: investment_horizon,
      risks: this.calculateInitialRisks(initial_portfolio, market_data),
      market_conditions: market_data.current_conditions,
      target_metrics: {
        target_return: market_data.risk_free_rate + risk_tolerance * 0.05,
        max_drawdown: risk_tolerance * 0.1,
        diversification_target: 0.7
      }
    };
    
    // Define available actions function
    const available_actions = (state: FinancialState) => {
      const actions = [];
      const asset_classes = Object.keys(market_data.assets);
      
      // Generate buy/sell actions for each asset class
      for (const asset of asset_classes) {
        // Buy actions at different allocation percentages
        actions.push({ type: 'buy_asset', asset, amount: 0.05 });
        actions.push({ type: 'buy_asset', asset, amount: 0.1 });
        actions.push({ type: 'buy_asset', asset, amount: 0.2 });
        
        // Sell actions if we own the asset
        if (state.assets[asset] > 0) {
          actions.push({ type: 'sell_asset', asset, amount: 0.05 });
          actions.push({ type: 'sell_asset', asset, amount: 0.1 });
          actions.push({ type: 'sell_asset', asset, amount: state.assets[asset] }); // Sell all
        }
        
        // Market scenario changes for simulation
        for (const scenario of market_data.scenarios) {
          actions.push({ 
            type: 'market_change', 
            changes: scenario.conditions
          });
        }
      }
      
      return actions;
    };
    
    // Define reward function based on Sharpe ratio and constraints
    const reward_function = (state: FinancialState) => {
      // Calculate expected return based on asset allocation and market conditions
      let expected_return = 0;
      let risk = 0;
      let diversification = 0;
      
      // Portfolio total value
      const total_value = Object.values(state.assets).reduce((sum, val) => sum + val, 0);
      if (total_value === 0) return -1; // Penalize empty portfolios
      
      // Calculate weighted return and risk
      for (const [asset, allocation] of Object.entries(state.assets)) {
        const weight = allocation / total_value;
        const asset_data = market_data.assets[asset] || { expected_return: 0, volatility: 0.5 };
        
        expected_return += weight * asset_data.expected_return;
        risk += weight * asset_data.volatility;
        
        // Consider market condition effects
        if (state.market_conditions.recession && asset_data.recession_factor) {
          expected_return *= asset_data.recession_factor;
        }
      }
      
      // Calculate diversification (simplified HHI)
      const weights = Object.values(state.assets).map(v => v / total_value);
      diversification = 1 - weights.reduce((sum, w) => sum + w * w, 0);
      
      // Calculate Sharpe-like ratio (adjusted for constraints)
      const sharpe = (expected_return - market_data.risk_free_rate) / risk;
      
      // Penalties for constraint violations
      let penalties = 0;
      
      // Penalize if expected return is below target
      if (expected_return < state.target_metrics.target_return) {
        penalties += state.target_metrics.target_return - expected_return;
      }
      
      // Penalize if risk is too high
      if (risk > risk_tolerance) {
        penalties += (risk - risk_tolerance) * 2;
      }
      
      // Penalize if diversification is below target
      if (diversification < state.target_metrics.diversification_target) {
        penalties += (state.target_metrics.diversification_target - diversification);
      }
      
      return sharpe - penalties;
    };
    
    return this.runMCTS(initial_state, available_actions, reward_function);
  }
  
  /**
   * Calculate initial risk metrics for a portfolio
   */
  private calculateInitialRisks(portfolio: Record<string, number>, market_data: any): Record<string, number> {
    const risks: Record<string, number> = {
      volatility: 0,
      var_95: 0,
      max_drawdown: 0
    };
    
    // Calculate total portfolio value
    const total_value = Object.values(portfolio).reduce((sum, val) => sum + val, 0);
    if (total_value === 0) return risks;
    
    // Calculate portfolio volatility (simplified)
    let portfolio_variance = 0;
    for (const [asset, allocation] of Object.entries(portfolio)) {
      const weight = allocation / total_value;
      const asset_data = market_data.assets[asset] || { volatility: 0.5 };
      portfolio_variance += weight * weight * asset_data.volatility * asset_data.volatility;
    }
    
    // Add covariance terms (simplified assumption of 0.3 correlation between assets)
    for (const [asset1, allocation1] of Object.entries(portfolio)) {
      for (const [asset2, allocation2] of Object.entries(portfolio)) {
        if (asset1 !== asset2) {
          const weight1 = allocation1 / total_value;
          const weight2 = allocation2 / total_value;
          const asset1_data = market_data.assets[asset1] || { volatility: 0.5 };
          const asset2_data = market_data.assets[asset2] || { volatility: 0.5 };
          
          portfolio_variance += 2 * weight1 * weight2 * asset1_data.volatility * asset2_data.volatility * 0.3;
        }
      }
    }
    
    risks.volatility = Math.sqrt(portfolio_variance);
    
    // VaR calculation (simplified normal distribution assumption)
    // 95% VaR = 1.645 * volatility * portfolio value
    risks.var_95 = 1.645 * risks.volatility * total_value;
    
    // Max drawdown estimation (simplified)
    risks.max_drawdown = risks.volatility * 2.5;
    
    return risks;
  }
}

export default MonteCarloTreeSearch;
