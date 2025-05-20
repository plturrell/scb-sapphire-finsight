/**
 * Monte Carlo Tree Search (MCTS) Impact Analyzer
 * Integrates with Sankey diagram to visualize complex impacts over time
 */

class MCTSImpactAnalyzer {
    constructor(initialData) {
        this.initialData = initialData;
        this.simulations = 1000;
        this.explorationConstant = 1.414;
        this.timeHorizons = ['3M', '6M', '12M', '24M'];
        this.scenarios = [];
        this.currentBestPath = null;
    }

    /**
     * Run MCTS simulations for impact analysis
     */
    runAnalysis() {
        console.log('Starting MCTS analysis with', this.simulations, 'simulations');
        
        // Initialize root node
        const rootNode = {
            state: this.createInitialState(),
            parent: null,
            children: [],
            visits: 0,
            value: 0,
            untried_actions: this.getAvailableActions()
        };

        // Run simulations
        for (let i = 0; i < this.simulations; i++) {
            this.runSimulation(rootNode);
        }

        // Extract best path and scenarios
        this.currentBestPath = this.getBestPath(rootNode);
        this.scenarios = this.extractScenarios(rootNode);
        
        return {
            bestPath: this.currentBestPath,
            scenarios: this.scenarios,
            riskProbabilities: this.calculateRiskProbabilities(),
            impactTimeline: this.generateImpactTimeline()
        };
    }

    /**
     * Create initial state from trade flow data
     */
    createInitialState() {
        return {
            timestamp: Date.now(),
            flows: {
                vietnam_production: 47000, // $47B total
                us_exports: 21000,         // $21B at risk
                china_exports: 9000,
                europe_exports: 8000,
                japan_exports: 5000,
                other_exports: 4000
            },
            risks: {
                tariff_rate: 0.25,
                implementation_probability: 0.85,
                market_volatility: 0.45,
                supply_chain_risk: 0.25
            },
            mitigations: {
                trade_finance: false,
                market_diversification: false,
                production_relocation: false,
                cost_optimization: false
            }
        };
    }

    /**
     * Get available actions for current state
     */
    getAvailableActions() {
        return [
            { type: 'ACCELERATE_SHIPMENTS', cost: 45, effectiveness: 0.7 },
            { type: 'ACTIVATE_LC', cost: 8.75, effectiveness: 0.8 },
            { type: 'DIVERSIFY_MARKETS', cost: 120, effectiveness: 0.9 },
            { type: 'SUPPLY_CHAIN_OPTIMIZE', cost: 85, effectiveness: 0.85 },
            { type: 'RELOCATE_PRODUCTION', cost: 450, effectiveness: 0.95 },
            { type: 'HEDGE_CURRENCY', cost: 25, effectiveness: 0.6 },
            { type: 'NEGOTIATE_EXEMPTIONS', cost: 15, effectiveness: 0.4 },
            { type: 'IMPLEMENT_AUTOMATION', cost: 200, effectiveness: 0.75 }
        ];
    }

    /**
     * Run single MCTS simulation
     */
    runSimulation(node) {
        let current = node;
        const path = [];

        // Selection phase
        while (current.untried_actions.length === 0 && current.children.length > 0) {
            current = this.selectChild(current);
            path.push(current);
        }

        // Expansion phase
        if (current.untried_actions.length > 0) {
            const action = this.selectRandomAction(current.untried_actions);
            const newState = this.applyAction(current.state, action);
            const child = {
                state: newState,
                parent: current,
                children: [],
                visits: 0,
                value: 0,
                untried_actions: this.getAvailableActions(),
                action: action
            };
            current.children.push(child);
            current.untried_actions = current.untried_actions.filter(a => a !== action);
            current = child;
            path.push(current);
        }

        // Simulation phase
        const simulationResult = this.simulateToEnd(current.state);
        
        // Backpropagation phase
        for (const node of path) {
            node.visits += 1;
            node.value += simulationResult;
        }
    }

    /**
     * Select child using UCB1 formula
     */
    selectChild(node) {
        let bestChild = null;
        let bestScore = -Infinity;

        for (const child of node.children) {
            const exploitation = child.value / child.visits;
            const exploration = this.explorationConstant * Math.sqrt(Math.log(node.visits) / child.visits);
            const score = exploitation + exploration;

            if (score > bestScore) {
                bestScore = score;
                bestChild = child;
            }
        }

        return bestChild;
    }

    /**
     * Apply action to state and calculate new flows
     */
    applyAction(state, action) {
        const newState = JSON.parse(JSON.stringify(state));
        
        switch (action.type) {
            case 'ACCELERATE_SHIPMENTS':
                // Reduce immediate impact by 15%
                newState.flows.us_exports *= 1.15;
                newState.risks.implementation_probability *= 0.85;
                break;
                
            case 'ACTIVATE_LC':
                // Improve cash flow and reduce financial risk
                newState.risks.market_volatility *= 0.8;
                newState.mitigations.trade_finance = true;
                break;
                
            case 'DIVERSIFY_MARKETS':
                // Shift 20% of US exports to other markets
                const diverted = newState.flows.us_exports * 0.2;
                newState.flows.us_exports *= 0.8;
                newState.flows.china_exports += diverted * 0.3;
                newState.flows.europe_exports += diverted * 0.3;
                newState.flows.other_exports += diverted * 0.4;
                newState.mitigations.market_diversification = true;
                break;
                
            case 'SUPPLY_CHAIN_OPTIMIZE':
                // Reduce overall risk and improve efficiency
                newState.risks.supply_chain_risk *= 0.6;
                newState.risks.market_volatility *= 0.9;
                break;
                
            case 'RELOCATE_PRODUCTION':
                // Major impact - reduce tariff exposure by 60%
                newState.flows.us_exports *= 0.4;
                newState.risks.tariff_rate *= 0.4;
                newState.mitigations.production_relocation = true;
                break;
                
            case 'HEDGE_CURRENCY':
                // Reduce currency risk
                newState.risks.market_volatility *= 0.7;
                break;
                
            case 'NEGOTIATE_EXEMPTIONS':
                // Potential to reduce tariff impact
                if (Math.random() < action.effectiveness) {
                    newState.risks.tariff_rate *= 0.8;
                }
                break;
                
            case 'IMPLEMENT_AUTOMATION':
                // Reduce costs to offset tariff impact
                newState.mitigations.cost_optimization = true;
                newState.risks.market_volatility *= 0.85;
                break;
        }
        
        return newState;
    }

    /**
     * Simulate to end state and calculate value
     */
    simulateToEnd(state) {
        let currentState = JSON.parse(JSON.stringify(state));
        let totalValue = 0;
        
        // Simulate over time horizons
        for (const horizon of this.timeHorizons) {
            const impact = this.calculateImpact(currentState);
            totalValue += impact.netBenefit;
            
            // Apply time decay and random events
            currentState = this.applyTimeEffects(currentState, horizon);
        }
        
        return totalValue;
    }

    /**
     * Calculate impact for current state
     */
    calculateImpact(state) {
        const tariffImpact = state.flows.us_exports * state.risks.tariff_rate;
        const mitigationFactor = this.calculateMitigationFactor(state.mitigations);
        const riskFactor = this.calculateRiskFactor(state.risks);
        
        return {
            grossImpact: tariffImpact,
            mitigatedImpact: tariffImpact * (1 - mitigationFactor),
            riskAdjustedImpact: tariffImpact * riskFactor,
            netBenefit: (tariffImpact - (tariffImpact * (1 - mitigationFactor))) / riskFactor
        };
    }

    /**
     * Generate Sankey data from MCTS analysis
     */
    generateSankeyData(timeHorizon = '12M') {
        const bestPath = this.currentBestPath;
        const scenario = this.getScenarioForTimeHorizon(timeHorizon);
        
        // Create nodes
        const nodes = [
            { name: "Samsung Vietnam", group: "source" },
            { name: "Consumer Electronics", group: "product" },
            { name: "Semiconductors", group: "product" },
            { name: "Display Panels", group: "product" },
            { name: "US Market (Original)", group: "market", risk: true },
            { name: "US Market (Mitigated)", group: "market", risk: false },
            { name: "China Market", group: "market", risk: false },
            { name: "Europe Market", group: "market", risk: false },
            { name: "Japan Market", group: "market", risk: false },
            { name: "Other Markets", group: "market", risk: false },
            { name: "Trade Finance", group: "mitigation" },
            { name: "Market Diversification", group: "mitigation" },
            { name: "Production Relocation", group: "mitigation" },
            { name: "Cost Optimization", group: "mitigation" }
        ];
        
        // Create links based on MCTS results
        const links = [];
        const state = scenario.state;
        
        // Production to products flows
        const totalProduction = state.flows.vietnam_production;
        links.push(
            { source: 0, target: 1, value: totalProduction * 0.48, risk: false },
            { source: 0, target: 2, value: totalProduction * 0.31, risk: false },
            { source: 0, target: 3, value: totalProduction * 0.21, risk: false }
        );
        
        // Product to market flows (risk-adjusted)
        const riskRatio = state.risks.implementation_probability;
        const usOriginal = state.flows.us_exports;
        const usMitigated = usOriginal * (1 - riskRatio);
        const usAtRisk = usOriginal * riskRatio;
        
        // Consumer Electronics flows
        const ceTotal = totalProduction * 0.48;
        const ceUSRatio = usOriginal / totalProduction;
        links.push(
            { source: 1, target: 4, value: ceTotal * ceUSRatio * riskRatio, risk: true },
            { source: 1, target: 5, value: ceTotal * ceUSRatio * (1 - riskRatio), risk: false },
            { source: 1, target: 6, value: ceTotal * 0.15, risk: false },
            { source: 1, target: 7, value: ceTotal * 0.12, risk: false },
            { source: 1, target: 8, value: ceTotal * 0.1, risk: false },
            { source: 1, target: 9, value: ceTotal * 0.08, risk: false }
        );
        
        // Mitigation flows
        if (state.mitigations.trade_finance) {
            links.push({ source: 10, target: 5, value: usMitigated * 0.2, risk: false });
        }
        if (state.mitigations.market_diversification) {
            links.push({ source: 11, target: 6, value: usMitigated * 0.15, risk: false });
            links.push({ source: 11, target: 7, value: usMitigated * 0.15, risk: false });
        }
        if (state.mitigations.production_relocation) {
            links.push({ source: 12, target: 5, value: usMitigated * 0.3, risk: false });
        }
        if (state.mitigations.cost_optimization) {
            links.push({ source: 13, target: 5, value: usMitigated * 0.1, risk: false });
        }
        
        return { nodes, links };
    }

    /**
     * Calculate risk probabilities from MCTS simulations
     */
    calculateRiskProbabilities() {
        const probabilities = {};
        
        for (const scenario of this.scenarios) {
            for (const [risk, value] of Object.entries(scenario.state.risks)) {
                if (!probabilities[risk]) {
                    probabilities[risk] = [];
                }
                probabilities[risk].push(value);
            }
        }
        
        // Calculate statistics
        const stats = {};
        for (const [risk, values] of Object.entries(probabilities)) {
            stats[risk] = {
                mean: values.reduce((a, b) => a + b) / values.length,
                std: Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - (values.reduce((a, b) => a + b) / values.length), 2), 0) / values.length),
                min: Math.min(...values),
                max: Math.max(...values),
                percentiles: {
                    p10: this.percentile(values, 10),
                    p50: this.percentile(values, 50),
                    p90: this.percentile(values, 90)
                }
            };
        }
        
        return stats;
    }

    /**
     * Generate impact timeline from MCTS results
     */
    generateImpactTimeline() {
        const timeline = [];
        
        for (const horizon of this.timeHorizons) {
            const scenario = this.getScenarioForTimeHorizon(horizon);
            const impact = this.calculateImpact(scenario.state);
            
            timeline.push({
                period: horizon,
                impact: impact,
                actions: scenario.actions,
                flows: scenario.state.flows,
                risks: scenario.state.risks,
                confidence: scenario.confidence
            });
        }
        
        return timeline;
    }

    /**
     * Helper functions
     */
    selectRandomAction(actions) {
        return actions[Math.floor(Math.random() * actions.length)];
    }
    
    calculateMitigationFactor(mitigations) {
        let factor = 0;
        if (mitigations.trade_finance) factor += 0.15;
        if (mitigations.market_diversification) factor += 0.25;
        if (mitigations.production_relocation) factor += 0.35;
        if (mitigations.cost_optimization) factor += 0.1;
        return Math.min(factor, 0.85);
    }
    
    calculateRiskFactor(risks) {
        return (risks.tariff_rate * risks.implementation_probability + 
                risks.market_volatility * 0.3 + 
                risks.supply_chain_risk * 0.2);
    }
    
    applyTimeEffects(state, horizon) {
        const newState = JSON.parse(JSON.stringify(state));
        const monthsMap = { '3M': 3, '6M': 6, '12M': 12, '24M': 24 };
        const months = monthsMap[horizon];
        
        // Apply time-based changes
        newState.risks.market_volatility *= Math.pow(0.95, months / 3);
        newState.risks.implementation_probability *= Math.pow(1.02, months / 6);
        
        // Random events
        if (Math.random() < 0.1 * (months / 12)) {
            newState.risks.tariff_rate *= (0.8 + Math.random() * 0.4);
        }
        
        return newState;
    }
    
    getBestPath(rootNode) {
        const path = [];
        let current = rootNode;
        
        while (current.children.length > 0) {
            current = current.children.reduce((best, child) => 
                child.visits > best.visits ? child : best
            );
            if (current.action) {
                path.push(current.action);
            }
        }
        
        return path;
    }
    
    extractScenarios(rootNode) {
        const scenarios = [];
        const queue = [{ node: rootNode, path: [], depth: 0 }];
        
        while (queue.length > 0 && scenarios.length < 100) {
            const { node, path, depth } = queue.shift();
            
            if (depth >= this.timeHorizons.length || node.children.length === 0) {
                scenarios.push({
                    actions: path,
                    state: node.state,
                    value: node.value,
                    visits: node.visits,
                    confidence: node.visits / this.simulations
                });
            } else {
                for (const child of node.children) {
                    queue.push({
                        node: child,
                        path: [...path, child.action],
                        depth: depth + 1
                    });
                }
            }
        }
        
        return scenarios;
    }
    
    getScenarioForTimeHorizon(horizon) {
        const index = this.timeHorizons.indexOf(horizon);
        return this.scenarios.find(s => s.actions.length === index + 1) || this.scenarios[0];
    }
    
    percentile(arr, p) {
        const sorted = arr.sort((a, b) => a - b);
        const index = (p / 100) * sorted.length;
        return sorted[Math.floor(index)];
    }
}

// Export for use in dashboard
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MCTSImpactAnalyzer;
}