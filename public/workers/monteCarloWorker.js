// monteCarloWorker.js
// Web Worker for running Monte Carlo Tree Search simulations without blocking the UI

// Import required dependencies
importScripts('/monteCarloAlgorithm.js');

let simulationInstance = null;
let intervalId = null;

self.onmessage = function(event) {
  const { type, config } = event.data;
  
  if (type === 'START_SIMULATION') {
    startMCTS(config);
  } else if (type === 'STOP_SIMULATION') {
    stopMCTS();
  } else if (type === 'PAUSE_SIMULATION') {
    pauseMCTS();
  } else if (type === 'RESUME_SIMULATION') {
    resumeMCTS();
  } else if (type === 'STEP_SIMULATION') {
    stepMCTS(config?.steps || 100);
  }
};

function startMCTS(config) {
  // Initialize MCTS with financial parameters
  simulationInstance = new MonteCarloTreeSearch({
    initialState: generateInitialFinancialState(config),
    maxIterations: config.iterations || 5000,
    explorationParameter: config.explorationParameter || 1.41, // UCB1 exploration parameter
    timeHorizon: config.timeHorizon || 24,
    scenarios: config.scenarios || ['baseline', 'recession', 'growth'],
    riskTolerance: config.riskTolerance || 'moderate'
  });
  
  // Start simulation
  simulationInstance.initialize();
  
  // Send updates every 100ms to update visualization
  intervalId = setInterval(() => {
    if (simulationInstance.isComplete()) {
      sendFinalResults();
      stopMCTS();
      return;
    }
    
    // Run 100 iterations between UI updates for better performance
    const batchSize = 100;
    for (let i = 0; i < batchSize; i++) {
      if (!simulationInstance.isComplete()) {
        simulationInstance.runIteration();
      } else {
        break;
      }
    }
    
    // Send current state for visualization update
    sendProgressUpdate();
  }, 100);
}

function pauseMCTS() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  
  self.postMessage({
    type: 'SIMULATION_PAUSED'
  });
}

function resumeMCTS() {
  if (simulationInstance && !intervalId) {
    intervalId = setInterval(() => {
      if (simulationInstance.isComplete()) {
        sendFinalResults();
        stopMCTS();
        return;
      }
      
      // Run 100 iterations between UI updates
      for (let i = 0; i < 100; i++) {
        if (!simulationInstance.isComplete()) {
          simulationInstance.runIteration();
        } else {
          break;
        }
      }
      
      // Send current state for visualization update
      sendProgressUpdate();
    }, 100);
    
    self.postMessage({
      type: 'SIMULATION_RESUMED'
    });
  }
}

function stepMCTS(steps) {
  if (simulationInstance) {
    // Run specified number of iterations
    for (let i = 0; i < steps; i++) {
      if (!simulationInstance.isComplete()) {
        simulationInstance.runIteration();
      } else {
        break;
      }
    }
    
    // Send current state
    sendProgressUpdate();
    
    // Check if completed after stepping
    if (simulationInstance.isComplete()) {
      sendFinalResults();
    }
  }
}

function stopMCTS() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  
  simulationInstance = null;
  self.postMessage({
    type: 'SIMULATION_STOPPED'
  });
}

function sendProgressUpdate() {
  const currentState = simulationInstance.getCurrentState();
  const progress = simulationInstance.getProgress();
  
  // Transform MCTS state to Sankey visualization format
  const sankeyData = transformMCTSToSankeyFormat(currentState, progress);
  
  self.postMessage({
    type: 'SIMULATION_UPDATE',
    data: {
      flowData: sankeyData,
      progress: {
        iterations: progress.completedIterations,
        confidenceInterval: progress.confidenceInterval,
        timeRemaining: progress.estimatedTimeRemaining,
        timeElapsed: progress.timeElapsed
      }
    }
  });
}

function sendFinalResults() {
  const finalState = simulationInstance.getFinalState();
  const sankeyData = transformMCTSToSankeyFormat(finalState, simulationInstance.getProgress());
  
  self.postMessage({
    type: 'SIMULATION_COMPLETE',
    data: {
      flowData: sankeyData,
      results: {
        optimalPath: simulationInstance.getOptimalPath(),
        expectedValue: simulationInstance.getExpectedValue(),
        riskMetrics: simulationInstance.getRiskMetrics()
      }
    }
  });
}

function transformMCTSToSankeyFormat(mctsState, progress) {
  // Convert MCTS tree structure to Sankey nodes and links
  const nodes = [];
  const links = [];
  
  // Extract nodes from MCTS states
  mctsState.visitedStates.forEach((state) => {
    nodes.push({
      name: `State ${state.id}`,
      group: state.category,
      value: state.value,
      predictedValue: state.expectedValue,
      confidence: state.confidence || progress.confidence
    });
    
    // Extract links from MCTS actions/transitions
    state.children.forEach(childId => {
      const childState = mctsState.visitedStates.find(s => s.id === childId);
      if (childState) {
        const transition = mctsState.transitions.find(
          t => t.fromId === state.id && t.toId === childId
        );
        
        links.push({
          source: nodes.findIndex(n => n.name === `State ${state.id}`),
          target: nodes.findIndex(n => n.name === `State ${childState.id}`),
          value: transition.probability * 1000, // Scale for visibility
          aiEnhanced: transition.isHighlyVisited,
          originalValue: transition.initialProbability * 1000
        });
      }
    });
  });
  
  return {
    nodes,
    links,
    aiInsights: {
      summary: `Monte Carlo simulation showing possible financial flows across ${mctsState.visitedStates.length} states with ${links.length} transitions.`,
      recommendations: generateRecommendations(mctsState),
      confidence: progress.confidence,
      updatedAt: new Date()
    }
  };
}

function generateRecommendations(mctsState) {
  // Generate insights based on MCTS results
  const recommendations = [];
  
  // Identify high-value paths
  const highValuePaths = identifyHighValuePaths(mctsState);
  if (highValuePaths.length > 0) {
    recommendations.push(`Prioritize ${highValuePaths[0].name} flow for optimal returns.`);
  }
  
  // Identify risk areas
  const riskAreas = identifyRiskAreas(mctsState);
  if (riskAreas.length > 0) {
    recommendations.push(`Mitigate risk in ${riskAreas[0].name} with ${riskAreas[0].strategy}.`);
  }
  
  // Add diversification recommendation
  recommendations.push(`Consider ${getOptimalDiversification(mctsState)}.`);
  
  return recommendations;
}

// Helper functions
function generateInitialFinancialState(config) {
  // Generate initial state based on configuration
  return {
    id: 'root',
    category: 'initial',
    value: 100,
    children: [],
    expectedValue: 100,
    confidence: 0.99
  };
}

function identifyHighValuePaths(mctsState) {
  // Find paths with highest expected value
  const paths = [];
  // Implementation would analyze the MCTS tree to find optimal paths
  paths.push({ name: 'equity investment', value: 0.85 });
  return paths;
}

function identifyRiskAreas(mctsState) {
  // Find areas with highest risk
  const risks = [];
  // Implementation would analyze the MCTS tree to find high-risk areas
  risks.push({ name: 'technology sector', strategy: 'hedging strategies' });
  return risks;
}

function getOptimalDiversification(mctsState) {
  // Generate diversification recommendation
  return 'reallocating 15% from fixed income to alternative investments';
}
