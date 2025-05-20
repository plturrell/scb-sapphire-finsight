import { getGrokCompletion, GrokMessageContent } from '@/lib/grok-api';
import { MonteCarloTreeSearch } from '@/lib/monte-carlo-search';
import perplexityAPI from '@/lib/perplexity-api';
import { JouleMessage, Source, WorkflowStep, GuidedWorkflow, AIInsight } from '@/types/JouleTypes';

/**
 * JouleIntegrationService
 * 
 * Provides comprehensive integration between the Joule AI Assistant
 * and backend services including:
 * - Grok API for conversational AI
 * - Monte Carlo simulation engine for financial forecasting
 * - Perplexity API for market research and data analysis
 * - SAP Business Data Cloud for enterprise data
 */
export class JouleIntegrationService {
  private mctsInstance: MonteCarloTreeSearch;
  private cachedFinancialData: Record<string, any> = {};
  private workflowEngine: WorkflowEngine;
  
  constructor() {
    // Initialize Monte Carlo engine with default settings
    this.mctsInstance = new MonteCarloTreeSearch(10000, 1.41);
    
    // Initialize workflow engine
    this.workflowEngine = new WorkflowEngine();
  }
  
  /**
   * Process a message with the Joule AI assistant
   * @param messageContent User's message
   * @param context Optional context data
   * @returns AI response with supporting information
   */
  async processMessage(
    messageContent: string, 
    context?: any,
    previousMessages?: JouleMessage[]
  ): Promise<JouleMessage> {
    // Determine the message intent and required tools
    const messageIntent = await this.analyzeIntent(messageContent);
    
    try {
      // Convert previous messages to Grok format if available
      const grokMessages: GrokMessageContent[] = previousMessages ? 
        this.convertToGrokFormat(previousMessages).slice(-5) : [];
      
      // Add the current message
      grokMessages.push({
        role: 'user',
        content: messageContent
      });
      
      // Process based on intent
      switch (messageIntent.primaryIntent) {
        case 'monte_carlo':
          return await this.handleMonteCarloRequest(messageContent, grokMessages, context);
          
        case 'market_research':
          return await this.handleMarketResearchRequest(messageContent, grokMessages, context);
          
        case 'dashboard_creation':
          return await this.handleDashboardRequest(messageContent, grokMessages, context);
          
        case 'workflow_request':
          return await this.handleWorkflowRequest(messageContent, grokMessages, context);
          
        default:
          // General conversation handling through Grok API
          const responseContent = await getGrokCompletion(
            grokMessages, 
            messageIntent.shouldUseTool
          );
          
          // Generate contextual suggestions
          const suggestions = this.generateSuggestions(
            messageContent, 
            responseContent, 
            messageIntent
          );
          
          // Identify relevant sources
          const sources = this.identifySources(
            messageContent, 
            responseContent, 
            messageIntent
          );
          
          return {
            id: Date.now().toString(),
            content: responseContent,
            sender: 'assistant',
            timestamp: new Date(),
            suggestions,
            sources,
            toolsUsed: messageIntent.shouldUseTool
          };
      }
    } catch (error) {
      console.error('Error processing message:', error);
      
      return {
        id: Date.now().toString(),
        content: 'I apologize, but I encountered an issue while processing your request. Please try again.',
        sender: 'assistant',
        timestamp: new Date()
      };
    }
  }
  
  /**
   * Analyze the intent of a message to determine processing approach
   */
  private async analyzeIntent(messageContent: string): Promise<{
    primaryIntent: 'general' | 'monte_carlo' | 'market_research' | 'dashboard_creation' | 'workflow_request';
    secondaryIntent?: string;
    shouldUseTool: boolean;
    confidence: number;
  }> {
    // Process with simple pattern matching for efficiency
    const lowerMessage = messageContent.toLowerCase();
    
    // Monte Carlo detection
    if (
      lowerMessage.includes('monte carlo') || 
      lowerMessage.includes('simulation') ||
      lowerMessage.includes('forecast') && lowerMessage.includes('scenario') ||
      lowerMessage.includes('risk analysis') && lowerMessage.includes('portfolio')
    ) {
      return {
        primaryIntent: 'monte_carlo',
        shouldUseTool: true,
        confidence: 0.85
      };
    }
    
    // Market research detection
    if (
      lowerMessage.includes('market research') || 
      lowerMessage.includes('perplexity') ||
      lowerMessage.includes('news') && lowerMessage.includes('analysis') ||
      lowerMessage.includes('research') && lowerMessage.includes('company')
    ) {
      return {
        primaryIntent: 'market_research',
        shouldUseTool: true,
        confidence: 0.82
      };
    }
    
    // Dashboard creation detection
    if (
      lowerMessage.includes('dashboard') || 
      lowerMessage.includes('create visualization') ||
      lowerMessage.includes('chart') && lowerMessage.includes('generate') ||
      lowerMessage.includes('visualize') && lowerMessage.includes('data')
    ) {
      return {
        primaryIntent: 'dashboard_creation',
        shouldUseTool: true,
        confidence: 0.79
      };
    }
    
    // Workflow detection
    if (
      lowerMessage.includes('workflow') || 
      lowerMessage.includes('guide me') ||
      lowerMessage.includes('step by step') ||
      lowerMessage.includes('walk me through')
    ) {
      return {
        primaryIntent: 'workflow_request',
        shouldUseTool: false,
        confidence: 0.76
      };
    }
    
    // General conversation with tool detection
    const shouldUseTool = (
      lowerMessage.includes('financial data') || 
      lowerMessage.includes('report') || 
      lowerMessage.includes('performance') ||
      lowerMessage.includes('metrics') ||
      lowerMessage.includes('portfolio') ||
      lowerMessage.includes('generate') ||
      lowerMessage.includes('analytics')
    );
    
    return {
      primaryIntent: 'general',
      shouldUseTool,
      confidence: 0.7
    };
  }
  
  /**
   * Handle a Monte Carlo simulation request
   */
  private async handleMonteCarloRequest(
    messageContent: string,
    grokMessages: GrokMessageContent[],
    context?: any
  ): Promise<JouleMessage> {
    try {
      // Extract simulation parameters from the message or context
      const parameters = this.extractSimulationParameters(messageContent, context);
      
      // Run the simulation
      const simulationResult = await this.runMonteCarloSimulation(parameters);
      
      // Format the response with results
      const responseContent = await this.formatMonteCarloResponse(
        simulationResult, 
        parameters, 
        grokMessages
      );
      
      // Generate visualizations from simulation data
      const visualizations = this.generateMonteCarloVisualizations(simulationResult);
      
      // Identify sources
      const sources: Source[] = [
        { 
          name: 'Monte Carlo Simulation Engine', 
          url: '#', 
          type: 'internal' 
        },
        { 
          name: 'Financial Market Data', 
          url: '#', 
          type: 'internal' 
        }
      ];
      
      // Generate suggestions based on results
      const suggestions = [
        `Run simulation with ${parameters.iterations * 2} iterations`,
        `Compare with conservative scenario`,
        `Generate risk assessment report`,
        `Visualize confidence intervals`
      ];
      
      return {
        id: Date.now().toString(),
        content: responseContent,
        sender: 'assistant',
        timestamp: new Date(),
        suggestions,
        sources,
        visualizations,
        toolsUsed: true
      };
    } catch (error) {
      console.error('Error in Monte Carlo processing:', error);
      
      return {
        id: Date.now().toString(),
        content: 'I encountered an issue while running the Monte Carlo simulation. Please check your parameters and try again.',
        sender: 'assistant',
        timestamp: new Date()
      };
    }
  }
  
  /**
   * Extract simulation parameters from message and context
   */
  private extractSimulationParameters(messageContent: string, context?: any): any {
    // Start with defaults
    const parameters = {
      initialValue: 100,
      iterations: 1000,
      timeHorizon: 12, // months
      scenarios: ['baseline'],
      riskTolerance: 'moderate',
      confidenceLevel: 0.95
    };
    
    // Extract from context if available
    if (context?.simulationParams) {
      return { ...parameters, ...context.simulationParams };
    }
    
    // Extract from message content
    const lowerMessage = messageContent.toLowerCase();
    
    // Extract iterations
    const iterationsMatch = lowerMessage.match(/(\d+)\s*(iterations|simulations)/i);
    if (iterationsMatch) {
      parameters.iterations = parseInt(iterationsMatch[1], 10);
    }
    
    // Extract time horizon
    const timeHorizonMatch = lowerMessage.match(/(\d+)\s*(months|years)/i);
    if (timeHorizonMatch) {
      let value = parseInt(timeHorizonMatch[1], 10);
      if (timeHorizonMatch[2].startsWith('year')) {
        value *= 12; // Convert years to months
      }
      parameters.timeHorizon = value;
    }
    
    // Extract risk tolerance
    if (lowerMessage.includes('conservative')) {
      parameters.riskTolerance = 'conservative';
    } else if (lowerMessage.includes('aggressive')) {
      parameters.riskTolerance = 'aggressive';
    }
    
    // Extract scenarios
    if (lowerMessage.includes('recession')) {
      parameters.scenarios.push('recession');
    }
    if (lowerMessage.includes('growth')) {
      parameters.scenarios.push('growth');
    }
    
    return parameters;
  }
  
  /**
   * Run a Monte Carlo simulation with specified parameters
   */
  private async runMonteCarloSimulation(parameters: any): Promise<any> {
    // Create a market data structure for the simulation
    const marketData = {
      assets: {
        'equities': { expected_return: 0.08, volatility: 0.16, recession_factor: 0.7 },
        'bonds': { expected_return: 0.03, volatility: 0.05, recession_factor: 0.9 },
        'realestate': { expected_return: 0.06, volatility: 0.12, recession_factor: 0.75 },
        'commodities': { expected_return: 0.05, volatility: 0.2, recession_factor: 0.8 }
      },
      risk_free_rate: 0.02,
      current_conditions: {
        inflation: 0.03,
        gdp_growth: 0.023,
        unemployment: 0.055,
        recession: parameters.scenarios.includes('recession')
      },
      scenarios: [
        {
          name: 'baseline',
          conditions: { inflation: 0.03, gdp_growth: 0.023, unemployment: 0.055 }
        },
        {
          name: 'recession',
          conditions: { inflation: 0.025, gdp_growth: -0.01, unemployment: 0.08 }
        },
        {
          name: 'growth',
          conditions: { inflation: 0.035, gdp_growth: 0.04, unemployment: 0.045 }
        }
      ]
    };
    
    // Initial portfolio allocation
    const initialPortfolio = {
      'equities': 0.5,
      'bonds': 0.3,
      'realestate': 0.1,
      'commodities': 0.1
    };
    
    // Run the simulation with our Monte Carlo engine
    const simulationResult = await this.mctsInstance.runPortfolioOptimization(
      initialPortfolio,
      marketData,
      parameters.riskTolerance === 'conservative' ? 0.3 : 
        parameters.riskTolerance === 'moderate' ? 0.5 : 0.7,
      parameters.timeHorizon <= 12 ? 'short' : 
        parameters.timeHorizon <= 36 ? 'medium' : 'long'
    );
    
    return {
      parameters,
      result: simulationResult,
      marketData
    };
  }
  
  /**
   * Format Monte Carlo simulation results into a readable response
   */
  private async formatMonteCarloResponse(
    simulationResult: any, 
    parameters: any,
    grokMessages: GrokMessageContent[]
  ): Promise<string> {
    // Create a summary of the simulation results
    const summary = `I've run a Monte Carlo simulation with ${parameters.iterations} iterations over a ${parameters.timeHorizon}-month time horizon using a ${parameters.riskTolerance} risk profile.`;
    
    // Format the detailed results
    const expectedReturn = (simulationResult.result.expected_return * 100).toFixed(2);
    const riskAssessment = (simulationResult.result.risk_assessment * 100).toFixed(2);
    const confidenceLower = (simulationResult.result.confidence_interval[0] * 100).toFixed(2);
    const confidenceUpper = (simulationResult.result.confidence_interval[1] * 100).toFixed(2);
    
    const detailedResults = `
Based on the simulation:

• Expected Return: ${expectedReturn}% annualized
• Risk Assessment: ${riskAssessment}% (coefficient of variation)
• 95% Confidence Interval: ${confidenceLower}% to ${confidenceUpper}%
• Iterations Completed: ${simulationResult.result.iterations}

The optimal portfolio allocation would be:
${simulationResult.result.optimal_path.slice(-1)[0]?.state.assets ? 
  Object.entries(simulationResult.result.optimal_path.slice(-1)[0].state.assets)
    .map(([asset, allocation]) => `• ${asset}: ${(Number(allocation) * 100).toFixed(2)}%`)
    .join('\n') : 
  '• No optimal allocation found'}
`;

    // Use Grok to provide an analysis of the results
    const analysisPrompt = `
You're analyzing Monte Carlo simulation results for a financial portfolio with the following parameters:
- Risk tolerance: ${parameters.riskTolerance}
- Time horizon: ${parameters.timeHorizon} months
- Scenarios considered: ${parameters.scenarios.join(', ')}

The simulation produced these results:
- Expected return: ${expectedReturn}%
- Risk assessment: ${riskAssessment}%
- 95% confidence interval: ${confidenceLower}% to ${confidenceUpper}%

Given these results, provide a brief, insightful analysis of what they mean for the investor. Include key observations and any recommendations. Keep your analysis to 3-4 short paragraphs.`;

    const analysisMessages = [
      ...grokMessages,
      { role: 'user', content: analysisPrompt }
    ];
    
    const analysis = await getGrokCompletion(analysisMessages, false);
    
    // Combine the response components
    return `${summary}\n\n${detailedResults}\n\n${analysis}`;
  }
  
  /**
   * Generate visualizations for Monte Carlo simulation results
   */
  private generateMonteCarloVisualizations(simulationResult: any): any[] {
    // Create visualizations from the simulation data
    return [
      {
        type: 'monte-carlo-distribution',
        data: {
          expectedReturn: simulationResult.result.expected_return,
          confidenceInterval: simulationResult.result.confidence_interval,
          distribution: this.generateDistributionData(
            simulationResult.result.expected_return,
            simulationResult.result.risk_assessment
          )
        }
      },
      {
        type: 'optimal-allocation',
        data: {
          allocation: simulationResult.result.optimal_path.slice(-1)[0]?.state.assets || {},
          initialAllocation: simulationResult.parameters.initialPortfolio || {}
        }
      }
    ];
  }
  
  /**
   * Generate distribution data for visualization
   */
  private generateDistributionData(mean: number, riskAssessment: number): any[] {
    const stdDev = mean * riskAssessment;
    const points = [];
    
    // Generate bell curve data points
    for (let i = -3; i <= 3; i += 0.2) {
      const x = mean + i * stdDev;
      // Normal distribution formula
      const y = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * 
                Math.exp(-0.5 * Math.pow(i, 2));
      points.push({ x, y });
    }
    
    return points;
  }
  
  /**
   * Handle a market research request using Perplexity API
   */
  private async handleMarketResearchRequest(
    messageContent: string,
    grokMessages: GrokMessageContent[],
    context?: any
  ): Promise<JouleMessage> {
    try {
      // Extract market research parameters
      const researchParams = this.extractMarketResearchParameters(messageContent, context);
      
      // Get results based on request type
      let researchResults;
      let sources: Source[] = [];
      
      switch (researchParams.type) {
        case 'company':
          // Search for company information
          const companies = await perplexityAPI.getCompanyFinancialMetrics(researchParams.query);
          researchResults = companies;
          
          // Add sources
          sources = [
            { name: 'Perplexity Financial Data', url: '#', type: 'external' },
            { name: 'Company Financial Reports', url: '#', type: 'external' }
          ];
          break;
          
        case 'news':
          // Get market news
          const newsItems = await perplexityAPI.getMarketNews(researchParams.query);
          researchResults = newsItems;
          
          // Add sources
          sources = [
            { name: 'Perplexity News API', url: '#', type: 'external' },
            { name: 'Financial News Sources', url: '#', type: 'external' }
          ];
          break;
          
        case 'impact':
          // Analyze financial impact
          const impact = await perplexityAPI.analyzeFinancialImpact(
            researchParams.query, 
            researchParams.company
          );
          researchResults = impact;
          
          // Add sources
          impact.sources?.forEach(source => {
            sources.push({
              name: source.title,
              url: source.url,
              type: 'external'
            });
          });
          break;
          
        default:
          // General market insights
          const insights = await perplexityAPI.getFinancialInsights(researchParams.query);
          researchResults = insights;
          
          // Add sources
          sources = [
            { name: 'Perplexity Financial Analysis', url: '#', type: 'external' },
            { name: 'Market Data', url: '#', type: 'external' }
          ];
      }
      
      // Generate a response using Grok with the research results
      const responseContent = await this.formatMarketResearchResponse(
        researchResults,
        researchParams,
        grokMessages
      );
      
      // Generate contextual suggestions
      const suggestions = this.generateMarketResearchSuggestions(
        researchParams, 
        researchResults
      );
      
      // Generate visualizations if applicable
      const visualizations = this.generateMarketResearchVisualizations(
        researchParams, 
        researchResults
      );
      
      return {
        id: Date.now().toString(),
        content: responseContent,
        sender: 'assistant',
        timestamp: new Date(),
        suggestions,
        sources,
        visualizations,
        toolsUsed: true
      };
    } catch (error) {
      console.error('Error in market research processing:', error);
      
      return {
        id: Date.now().toString(),
        content: 'I encountered an issue while performing the market research. Please check your query and try again.',
        sender: 'assistant',
        timestamp: new Date()
      };
    }
  }
  
  /**
   * Extract market research parameters from message and context
   */
  private extractMarketResearchParameters(messageContent: string, context?: any): {
    type: 'general' | 'company' | 'news' | 'impact';
    query: string;
    company?: string;
    timeframe?: string;
  } {
    // Start with defaults
    const params = {
      type: 'general' as const,
      query: messageContent,
      timeframe: 'recent'
    };
    
    // Extract from context if available
    if (context?.researchParams) {
      return { ...params, ...context.researchParams };
    }
    
    // Extract from message content
    const lowerMessage = messageContent.toLowerCase();
    
    // Determine research type
    if (
      lowerMessage.includes('company') || 
      lowerMessage.includes('stock') ||
      lowerMessage.includes('ticker')
    ) {
      params.type = 'company';
      
      // Try to extract company name or ticker
      const companyMatch = messageContent.match(/(?:company|stock|ticker)\s+(?:for|of|about)?\s+([A-Za-z0-9\s\.]+)(?:\?|\.|\s|$)/i);
      if (companyMatch) {
        params.query = companyMatch[1].trim();
      }
    } else if (
      lowerMessage.includes('news') || 
      lowerMessage.includes('headlines') ||
      lowerMessage.includes('recent developments')
    ) {
      params.type = 'news';
      
      // Try to extract news topic
      const newsMatch = messageContent.match(/(?:news|headlines)\s+(?:about|on|for)?\s+([A-Za-z0-9\s\.]+)(?:\?|\.|\s|$)/i);
      if (newsMatch) {
        params.query = newsMatch[1].trim();
      }
    } else if (
      lowerMessage.includes('impact') || 
      lowerMessage.includes('effect') ||
      lowerMessage.includes('analysis of')
    ) {
      params.type = 'impact';
      
      // Try to extract event and company
      const eventMatch = messageContent.match(/(?:impact|effect|analysis)\s+(?:of)?\s+([A-Za-z0-9\s\.]+)(?:\?|\.|\s|$)/i);
      if (eventMatch) {
        params.query = eventMatch[1].trim();
      }
      
      const companyMatch = messageContent.match(/(?:on|for|to)\s+([A-Za-z0-9\s\.]+)(?:\?|\.|\s|$)/i);
      if (companyMatch) {
        params.company = companyMatch[1].trim();
      }
    }
    
    return params;
  }
  
  /**
   * Format market research results into a readable response
   */
  private async formatMarketResearchResponse(
    researchResults: any,
    researchParams: any,
    grokMessages: GrokMessageContent[]
  ): Promise<string> {
    // Create a summary prompt based on the research type
    let summaryPrompt = '';
    
    switch (researchParams.type) {
      case 'company':
        summaryPrompt = `
You're analyzing financial metrics for ${researchParams.query}. Here's the data:
${JSON.stringify(researchResults, null, 2)}

Provide a concise, well-structured summary of these financial metrics. Highlight key strengths and weaknesses, and include relevant context about the company's performance relative to its industry. Format your response with clear sections and bullet points for key metrics.`;
        break;
        
      case 'news':
        summaryPrompt = `
You're summarizing recent news about ${researchParams.query}. Here are the news items:
${JSON.stringify(researchResults, null, 2)}

Provide a concise summary of these news items, highlighting the most significant developments and their potential financial implications. Organize your response by themes or impact categories rather than just listing headlines.`;
        break;
        
      case 'impact':
        summaryPrompt = `
You're analyzing the financial impact of ${researchParams.query} ${researchParams.company ? `on ${researchParams.company}` : 'on the market'}. Here's the analysis:
${JSON.stringify(researchResults, null, 2)}

Provide a well-structured analysis of this financial impact, covering both short-term and long-term implications. Include specific numeric projections where available, and highlight the confidence level of these predictions. Format your response with clear sections for immediate impact, long-term outlook, and recommended actions.`;
        break;
        
      default:
        summaryPrompt = `
You're providing general market insights about ${researchParams.query}. Here's the data:
${JSON.stringify(researchResults, null, 2)}

Provide a concise, well-structured summary of these market insights. Focus on actionable information and clear trends. Format your response with distinct sections for market trends, key insights, and outlook. Use bullet points for clarity where appropriate.`;
    }
    
    // Get summary from Grok
    const analysisMessages = [
      ...grokMessages,
      { role: 'user', content: summaryPrompt }
    ];
    
    return await getGrokCompletion(analysisMessages, false);
  }
  
  /**
   * Generate suggestions based on market research parameters and results
   */
  private generateMarketResearchSuggestions(researchParams: any, researchResults: any): string[] {
    const suggestions: string[] = [];
    
    switch (researchParams.type) {
      case 'company':
        suggestions.push(`Compare with industry average`);
        suggestions.push(`Show historical performance`);
        suggestions.push(`Analyze competitive position`);
        break;
        
      case 'news':
        suggestions.push(`Get more recent updates`);
        suggestions.push(`Analyze impact on portfolio`);
        suggestions.push(`Show related companies`);
        break;
        
      case 'impact':
        suggestions.push(`Run Monte Carlo simulation`);
        suggestions.push(`Show alternative scenarios`);
        suggestions.push(`Analyze sector implications`);
        break;
        
      default:
        suggestions.push(`Get more detailed analysis`);
        suggestions.push(`Show related market data`);
        suggestions.push(`Generate visualization`);
    }
    
    // Add one more general suggestion
    suggestions.push(`Export this research to a report`);
    
    return suggestions;
  }
  
  /**
   * Generate visualizations for market research results
   */
  private generateMarketResearchVisualizations(researchParams: any, researchResults: any): any[] {
    // For demonstration purposes, return empty array
    // In a real implementation, this would generate visualizations based on the data
    return [];
  }
  
  /**
   * Handle a dashboard creation request
   */
  private async handleDashboardRequest(
    messageContent: string,
    grokMessages: GrokMessageContent[],
    context?: any
  ): Promise<JouleMessage> {
    try {
      // Extract dashboard parameters
      const dashboardParams = this.extractDashboardParameters(messageContent, context);
      
      // Generate dashboard components
      const dashboardComponents = await this.generateDashboardComponents(dashboardParams);
      
      // Format the response with results
      const responseContent = await this.formatDashboardResponse(
        dashboardComponents, 
        dashboardParams, 
        grokMessages
      );
      
      // Generate dashboard layout visualization
      const visualizations = [{
        type: 'dashboard-layout',
        data: {
          components: dashboardComponents,
          layout: dashboardParams.layout,
          theme: dashboardParams.theme
        }
      }];
      
      // Identify sources
      const sources: Source[] = [
        { 
          name: 'Business Data Cloud', 
          url: '#', 
          type: 'internal' 
        },
        { 
          name: 'Dashboard Template Library', 
          url: '#', 
          type: 'internal' 
        }
      ];
      
      // Generate suggestions
      const suggestions = [
        `Add more metrics to dashboard`,
        `Change layout to ${dashboardParams.layout === 'grid' ? 'fluid' : 'grid'}`,
        `Export dashboard as PDF`,
        `Share dashboard with team`
      ];
      
      return {
        id: Date.now().toString(),
        content: responseContent,
        sender: 'assistant',
        timestamp: new Date(),
        suggestions,
        sources,
        visualizations,
        toolsUsed: true
      };
    } catch (error) {
      console.error('Error in dashboard creation:', error);
      
      return {
        id: Date.now().toString(),
        content: 'I encountered an issue while creating the dashboard. Please check your parameters and try again.',
        sender: 'assistant',
        timestamp: new Date()
      };
    }
  }
  
  /**
   * Extract dashboard parameters from message and context
   */
  private extractDashboardParameters(messageContent: string, context?: any): any {
    // Start with defaults
    const params = {
      type: 'financial',
      dataFocus: 'portfolio',
      components: ['kpi', 'chart', 'table'],
      timeRange: 'last-quarter',
      layout: 'grid',
      theme: 'light'
    };
    
    // Extract from context if available
    if (context?.dashboardParams) {
      return { ...params, ...context.dashboardParams };
    }
    
    // Extract from message content
    const lowerMessage = messageContent.toLowerCase();
    
    // Determine dashboard type
    if (lowerMessage.includes('portfolio')) {
      params.dataFocus = 'portfolio';
    } else if (lowerMessage.includes('market')) {
      params.dataFocus = 'market';
    } else if (lowerMessage.includes('risk')) {
      params.dataFocus = 'risk';
    }
    
    // Determine components
    if (lowerMessage.includes('chart')) {
      if (!params.components.includes('chart')) {
        params.components.push('chart');
      }
    }
    if (lowerMessage.includes('table')) {
      if (!params.components.includes('table')) {
        params.components.push('table');
      }
    }
    if (lowerMessage.includes('kpi')) {
      if (!params.components.includes('kpi')) {
        params.components.push('kpi');
      }
    }
    
    // Determine time range
    if (lowerMessage.includes('year')) {
      params.timeRange = 'last-year';
    } else if (lowerMessage.includes('month')) {
      params.timeRange = 'last-month';
    } else if (lowerMessage.includes('week')) {
      params.timeRange = 'last-week';
    }
    
    // Determine layout
    if (lowerMessage.includes('fluid')) {
      params.layout = 'fluid';
    } else if (lowerMessage.includes('card')) {
      params.layout = 'card';
    }
    
    // Determine theme
    if (lowerMessage.includes('dark')) {
      params.theme = 'dark';
    }
    
    return params;
  }
  
  /**
   * Generate dashboard components based on parameters
   */
  private async generateDashboardComponents(dashboardParams: any): Promise<any[]> {
    const components = [];
    
    // Generate components based on the dashboard parameters
    if (dashboardParams.components.includes('kpi')) {
      const kpiData = await this.fetchKPIData(dashboardParams.dataFocus, dashboardParams.timeRange);
      
      // Add KPI components
      for (const [metric, value] of Object.entries(kpiData)) {
        components.push({
          type: 'kpi',
          title: metric,
          value: value.current,
          change: value.change,
          target: value.target,
          trendDirection: value.change >= 0 ? 'up' : 'down',
          id: `kpi-${metric.toLowerCase().replace(/\s+/g, '-')}`
        });
      }
    }
    
    if (dashboardParams.components.includes('chart')) {
      const chartData = await this.fetchChartData(dashboardParams.dataFocus, dashboardParams.timeRange);
      
      // Add chart components
      chartData.forEach((chart, index) => {
        components.push({
          type: 'chart',
          chartType: chart.type,
          title: chart.title,
          data: chart.data,
          id: `chart-${index}`,
          dateRange: dashboardParams.timeRange
        });
      });
    }
    
    if (dashboardParams.components.includes('table')) {
      const tableData = await this.fetchTableData(dashboardParams.dataFocus, dashboardParams.timeRange);
      
      // Add table component
      components.push({
        type: 'table',
        title: tableData.title,
        columns: tableData.columns,
        data: tableData.data,
        id: 'table-main'
      });
    }
    
    return components;
  }
  
  /**
   * Format dashboard creation response
   */
  private async formatDashboardResponse(
    dashboardComponents: any[],
    dashboardParams: any,
    grokMessages: GrokMessageContent[]
  ): Promise<string> {
    // Create a summary of the dashboard
    const summary = `I've created a ${dashboardParams.theme} theme dashboard focused on ${dashboardParams.dataFocus} data with a ${dashboardParams.layout} layout for the ${dashboardParams.timeRange} period.`;
    
    // List the components
    const componentsList = dashboardComponents.map(component => {
      if (component.type === 'kpi') {
        return `• ${component.title} KPI: ${component.value} (${component.change >= 0 ? '+' : ''}${component.change}%)`;
      } else if (component.type === 'chart') {
        return `• ${component.title} (${component.chartType} chart)`;
      } else if (component.type === 'table') {
        return `• ${component.title} with ${component.data.length} rows of data`;
      }
      return `• ${component.type} component`;
    }).join('\n');
    
    // Create a prompt for Grok to generate an analysis
    const analysisPrompt = `
You've created a dashboard focused on ${dashboardParams.dataFocus} data for the ${dashboardParams.timeRange} period. The dashboard includes these components:

${componentsList}

Provide a brief analysis of what insights this dashboard offers, what business questions it helps answer, and how a user might leverage these visualizations for decision-making. Focus on the practical value of this dashboard. Keep your analysis to 2-3 short paragraphs.`;

    const analysisMessages = [
      ...grokMessages,
      { role: 'user', content: analysisPrompt }
    ];
    
    const analysis = await getGrokCompletion(analysisMessages, false);
    
    // Combine the response components
    return `${summary}\n\n${componentsList}\n\n${analysis}\n\nThe dashboard preview is available in the visualization panel. You can interact with it or modify it using the suggestions below.`;
  }
  
  /**
   * Fetch KPI data for dashboard
   */
  private async fetchKPIData(dataFocus: string, timeRange: string): Promise<any> {
    // In a real implementation, this would call a data service
    // For demonstration, return sample data
    switch (dataFocus) {
      case 'portfolio':
        return {
          'Total Return': { current: '8.7%', change: 1.2, target: '7.5%' },
          'Risk Score': { current: '64', change: -3.1, target: '60' },
          'Asset Count': { current: '137', change: 5.4, target: '150' }
        };
        
      case 'market':
        return {
          'Market Index': { current: '4,892', change: 0.8, target: '5,000' },
          'Volatility Index': { current: '16.3', change: -2.1, target: '15.0' },
          'Sector Performance': { current: '6.2%', change: 3.1, target: '5.0%' }
        };
        
      case 'risk':
        return {
          'VaR (95%)': { current: '$125K', change: -5.2, target: '$100K' },
          'Sharpe Ratio': { current: '1.24', change: 0.7, target: '1.5' },
          'Max Drawdown': { current: '8.3%', change: -1.8, target: '5.0%' }
        };
        
      default:
        return {
          'Metric 1': { current: '100', change: 0, target: '100' },
          'Metric 2': { current: '100', change: 0, target: '100' },
          'Metric 3': { current: '100', change: 0, target: '100' }
        };
    }
  }
  
  /**
   * Fetch chart data for dashboard
   */
  private async fetchChartData(dataFocus: string, timeRange: string): Promise<any[]> {
    // In a real implementation, this would call a data service
    // For demonstration, return sample data
    const charts = [];
    
    switch (dataFocus) {
      case 'portfolio':
        charts.push({
          type: 'line',
          title: 'Portfolio Performance',
          data: this.generateTimeseriesData(12, 5, 0.08)
        });
        charts.push({
          type: 'pie',
          title: 'Asset Allocation',
          data: [
            { name: 'Equities', value: 0.51 },
            { name: 'Fixed Income', value: 0.31 },
            { name: 'Real Estate', value: 0.10 },
            { name: 'Alternatives', value: 0.08 }
          ]
        });
        break;
        
      case 'market':
        charts.push({
          type: 'line',
          title: 'Market Indexes',
          data: this.generateTimeseriesData(12, 3, 0.05)
        });
        charts.push({
          type: 'bar',
          title: 'Sector Performance',
          data: this.generateCategoryData(10)
        });
        break;
        
      case 'risk':
        charts.push({
          type: 'scatter',
          title: 'Risk/Return Profile',
          data: this.generateScatterData(20)
        });
        charts.push({
          type: 'area',
          title: 'VaR Over Time',
          data: this.generateTimeseriesData(12, 1, 0.15)
        });
        break;
        
      default:
        charts.push({
          type: 'line',
          title: 'Sample Chart',
          data: this.generateTimeseriesData(12, 3, 0.1)
        });
    }
    
    return charts;
  }
  
  /**
   * Fetch table data for dashboard
   */
  private async fetchTableData(dataFocus: string, timeRange: string): Promise<any> {
    // In a real implementation, this would call a data service
    // For demonstration, return sample data
    switch (dataFocus) {
      case 'portfolio':
        return {
          title: 'Asset Performance',
          columns: [
            { header: 'Asset', accessor: 'asset', type: 'text' },
            { header: 'Value', accessor: 'value', type: 'currency' },
            { header: 'Allocation', accessor: 'allocation', type: 'percentage' },
            { header: 'Return', accessor: 'return', type: 'percentage' }
          ],
          data: [
            { asset: 'S&P 500 ETF', value: 125600, allocation: 0.25, return: 0.091 },
            { asset: 'Russell 2000 ETF', value: 78500, allocation: 0.16, return: 0.056 },
            { asset: 'EAFE ETF', value: 52300, allocation: 0.10, return: 0.042 },
            { asset: 'Corporate Bond ETF', value: 95400, allocation: 0.19, return: 0.031 },
            { asset: 'Treasury Bond ETF', value: 62000, allocation: 0.12, return: 0.022 },
            { asset: 'REIT ETF', value: 49300, allocation: 0.10, return: 0.077 },
            { asset: 'Commodities ETF', value: 39800, allocation: 0.08, return: 0.102 }
          ]
        };
        
      case 'market':
        return {
          title: 'Market Indicators',
          columns: [
            { header: 'Indicator', accessor: 'indicator', type: 'text' },
            { header: 'Current', accessor: 'current', type: 'number' },
            { header: 'Previous', accessor: 'previous', type: 'number' },
            { header: 'Change', accessor: 'change', type: 'percentage' }
          ],
          data: [
            { indicator: 'S&P 500', current: 4892.5, previous: 4850.2, change: 0.008 },
            { indicator: 'NASDAQ', current: 17123.8, previous: 16950.3, change: 0.01 },
            { indicator: 'Dow Jones', current: 38956.2, previous: 38762.1, change: 0.005 },
            { indicator: '10Y Treasury', current: 3.87, previous: 3.92, change: -0.013 },
            { indicator: 'VIX', current: 16.3, previous: 16.7, change: -0.024 },
            { indicator: 'Gold', current: 2323.5, previous: 2315.8, change: 0.003 },
            { indicator: 'WTI Crude', current: 75.8, previous: 76.2, change: -0.005 }
          ]
        };
        
      case 'risk':
        return {
          title: 'Risk Metrics by Asset',
          columns: [
            { header: 'Asset', accessor: 'asset', type: 'text' },
            { header: 'Volatility', accessor: 'volatility', type: 'percentage' },
            { header: 'Beta', accessor: 'beta', type: 'number' },
            { header: 'VaR', accessor: 'var', type: 'currency' },
            { header: 'Sharpe', accessor: 'sharpe', type: 'number' }
          ],
          data: [
            { asset: 'S&P 500 ETF', volatility: 0.16, beta: 1, var: 12500, sharpe: 1.42 },
            { asset: 'Russell 2000 ETF', volatility: 0.22, beta: 1.25, var: 9820, sharpe: 1.32 },
            { asset: 'EAFE ETF', volatility: 0.18, beta: 0.92, var: 6540, sharpe: 0.95 },
            { asset: 'Corporate Bond ETF', volatility: 0.05, beta: 0.25, var: 3580, sharpe: 0.86 },
            { asset: 'Treasury Bond ETF', volatility: 0.04, beta: 0.12, var: 2340, sharpe: 0.76 },
            { asset: 'REIT ETF', volatility: 0.15, beta: 0.85, var: 5870, sharpe: 1.18 },
            { asset: 'Commodities ETF', volatility: 0.25, beta: 0.35, var: 7650, sharpe: 1.05 }
          ]
        };
        
      default:
        return {
          title: 'Sample Table',
          columns: [
            { header: 'Column 1', accessor: 'col1', type: 'text' },
            { header: 'Column 2', accessor: 'col2', type: 'number' }
          ],
          data: [
            { col1: 'Row 1', col2: 100 },
            { col1: 'Row 2', col2: 200 },
            { col1: 'Row 3', col2: 300 }
          ]
        };
    }
  }
  
  /**
   * Generate timeseries data for charts
   */
  private generateTimeseriesData(points: number, series: number, volatility: number): any[] {
    const data = [];
    const seriesData: number[][] = [];
    
    // Initialize series starting points
    for (let i = 0; i < series; i++) {
      seriesData.push([100 + Math.random() * 50]);
    }
    
    // Generate data for each time point
    for (let i = 0; i < points; i++) {
      const point: any = {
        time: new Date(Date.now() - (points - i) * 30 * 24 * 60 * 60 * 1000)
      };
      
      // Generate value for each series
      for (let j = 0; j < series; j++) {
        const lastValue = seriesData[j][seriesData[j].length - 1];
        const change = (Math.random() - 0.4) * volatility * lastValue;
        const newValue = Math.max(0, lastValue + change);
        seriesData[j].push(newValue);
        
        point[`series${j}`] = newValue;
      }
      
      data.push(point);
    }
    
    return data;
  }
  
  /**
   * Generate category data for charts
   */
  private generateCategoryData(categories: number): any[] {
    const data = [];
    const categoryNames = [
      'Technology', 'Healthcare', 'Financial', 'Consumer Goods', 
      'Utilities', 'Real Estate', 'Energy', 'Materials',
      'Industrials', 'Communication', 'Consumer Staples', 'Discretionary'
    ];
    
    for (let i = 0; i < Math.min(categories, categoryNames.length); i++) {
      data.push({
        category: categoryNames[i],
        value: Math.random() * 100,
        change: (Math.random() - 0.3) * 20
      });
    }
    
    return data;
  }
  
  /**
   * Generate scatter data for charts
   */
  private generateScatterData(points: number): any[] {
    const data = [];
    
    for (let i = 0; i < points; i++) {
      data.push({
        risk: Math.random() * 0.3,
        return: Math.random() * 0.15,
        size: Math.random() * 100,
        name: `Asset ${i + 1}`
      });
    }
    
    return data;
  }
  
  /**
   * Handle a workflow request
   */
  private async handleWorkflowRequest(
    messageContent: string,
    grokMessages: GrokMessageContent[],
    context?: any
  ): Promise<JouleMessage> {
    try {
      // Extract workflow parameters
      const workflowParams = this.extractWorkflowParameters(messageContent, context);
      
      // Get or create workflow
      let workflow: GuidedWorkflow;
      
      if (workflowParams.workflowId) {
        // Get existing workflow
        workflow = await this.workflowEngine.getWorkflow(workflowParams.workflowId);
        
        // Handle workflow action if specified
        if (workflowParams.action) {
          workflow = await this.workflowEngine.processWorkflowAction(
            workflow, 
            workflowParams.action, 
            workflowParams.stepData
          );
        }
      } else {
        // Create new workflow
        workflow = await this.workflowEngine.createWorkflow(workflowParams.type);
      }
      
      // Format the response with workflow details
      const responseContent = await this.formatWorkflowResponse(workflow, grokMessages);
      
      // Generate workflow visualization
      const visualizations = [{
        type: 'workflow',
        data: {
          workflow,
          currentStep: workflow.steps[workflow.currentStepIndex]
        }
      }];
      
      // Identify sources
      const sources: Source[] = [
        { 
          name: 'SAP Workflow Engine', 
          url: '#', 
          type: 'internal' 
        },
        { 
          name: 'Financial Process Templates', 
          url: '#', 
          type: 'internal' 
        }
      ];
      
      // Generate suggestions based on current step
      const suggestions = this.generateWorkflowSuggestions(workflow);
      
      return {
        id: Date.now().toString(),
        content: responseContent,
        sender: 'assistant',
        timestamp: new Date(),
        suggestions,
        sources,
        visualizations,
        toolsUsed: false,
        workflow
      };
    } catch (error) {
      console.error('Error in workflow processing:', error);
      
      return {
        id: Date.now().toString(),
        content: 'I encountered an issue while processing the workflow. Please try again.',
        sender: 'assistant',
        timestamp: new Date()
      };
    }
  }
  
  /**
   * Extract workflow parameters from message and context
   */
  private extractWorkflowParameters(messageContent: string, context?: any): any {
    // Start with defaults
    const params: any = {
      type: 'general',
      action: null,
      stepData: null
    };
    
    // Extract from context if available
    if (context?.workflowParams) {
      return { ...params, ...context.workflowParams };
    }
    
    // Extract from message content
    const lowerMessage = messageContent.toLowerCase();
    
    // Determine workflow type if creating a new workflow
    if (lowerMessage.includes('monte carlo')) {
      params.type = 'monte-carlo-analysis';
    } else if (lowerMessage.includes('market research')) {
      params.type = 'market-research';
    } else if (lowerMessage.includes('dashboard')) {
      params.type = 'dashboard-story';
    }
    
    // Check for action indicators
    if (lowerMessage.includes('next') || lowerMessage.includes('continue')) {
      params.action = 'next';
    } else if (lowerMessage.includes('back') || lowerMessage.includes('previous')) {
      params.action = 'prev';
    } else if (lowerMessage.includes('complete') || lowerMessage.includes('finish')) {
      params.action = 'complete';
    }
    
    // Extract workflow ID if available in context
    if (context?.workflow?.id) {
      params.workflowId = context.workflow.id;
    }
    
    // Extract step data if available
    if (context?.stepData) {
      params.stepData = context.stepData;
    }
    
    return params;
  }
  
  /**
   * Format workflow response
   */
  private async formatWorkflowResponse(
    workflow: GuidedWorkflow,
    grokMessages: GrokMessageContent[]
  ): Promise<string> {
    // Get current step
    const currentStep = workflow.steps[workflow.currentStepIndex];
    
    // Create a basic response for first time
    if (workflow.currentStepIndex === 0 && currentStep.completed === false) {
      return `I've started a new "${workflow.title}" workflow for you. This will guide you through the process step by step.\n\n**Step 1: ${currentStep.title}**\n\n${currentStep.description}\n\nPlease follow the instructions in the workflow panel to continue.`;
    }
    
    // Create response for step completion
    if (workflow.completed) {
      return `The "${workflow.title}" workflow is now complete! All steps have been finished successfully.\n\nYou can review the results in the visualization panel or start a new workflow if needed.`;
    }
    
    // Create a response for current step
    return `**${workflow.title}** - Step ${workflow.currentStepIndex + 1} of ${workflow.steps.length}: ${currentStep.title}\n\n${currentStep.description}\n\nPlease follow the instructions in the workflow panel to continue.`;
  }
  
  /**
   * Generate suggestions based on current workflow step
   */
  private generateWorkflowSuggestions(workflow: GuidedWorkflow): string[] {
    const suggestions: string[] = [];
    
    // If workflow is complete, suggest new workflows
    if (workflow.completed) {
      return [
        'Start a new workflow',
        'Analyze the results',
        'Create a report from results',
        'Share the results'
      ];
    }
    
    // Add action-based suggestions
    if (workflow.currentStepIndex < workflow.steps.length - 1) {
      suggestions.push('Continue to next step');
    }
    if (workflow.currentStepIndex > 0) {
      suggestions.push('Go back to previous step');
    }
    
    suggestions.push('Complete all steps automatically');
    
    // Add step-specific suggestions
    const currentStep = workflow.steps[workflow.currentStepIndex];
    switch (currentStep.type) {
      case 'input':
        suggestions.push('Provide required information');
        break;
      case 'choice':
        suggestions.push('Select the best option');
        break;
      case 'data-selection':
        suggestions.push('Configure data parameters');
        break;
      case 'visualization':
        suggestions.push('Adjust visualization settings');
        break;
    }
    
    return suggestions;
  }
  
  /**
   * Convert JouleMessages to Grok format
   */
  private convertToGrokFormat(messages: JouleMessage[]): GrokMessageContent[] {
    return messages.map(msg => ({
      role: msg.sender as 'user' | 'assistant',
      content: msg.content
    }));
  }
  
  /**
   * Generate contextual suggestions for a response
   */
  private generateSuggestions(message: string, response: string, intent: any): string[] {
    // Basic implementation - would be enhanced in real system
    const suggestions: string[] = [];
    
    if (intent.primaryIntent === 'general') {
      suggestions.push('Tell me more about this');
      suggestions.push('Compare with industry benchmark');
      suggestions.push('Run a Monte Carlo simulation');
    }
    
    return suggestions;
  }
  
  /**
   * Identify sources for a response
   */
  private identifySources(message: string, response: string, intent: any): Source[] {
    // Basic implementation - would be enhanced in real system
    const sources: Source[] = [
      { name: 'SAP FinSight', url: '#', type: 'internal' }
    ];
    
    if (intent.shouldUseTool) {
      sources.push({ name: 'Financial Data API', url: '#', type: 'internal' });
    }
    
    if (message.toLowerCase().includes('market') || response.toLowerCase().includes('market')) {
      sources.push({ name: 'Market Analysis', url: '#', type: 'external' });
    }
    
    return sources;
  }
}

/**
 * WorkflowEngine class for managing guided workflows
 */
class WorkflowEngine {
  private workflows: Record<string, GuidedWorkflow> = {};
  
  /**
   * Create a new workflow
   */
  async createWorkflow(type: string): Promise<GuidedWorkflow> {
    // Define workflow templates
    const templates: Record<string, Omit<GuidedWorkflow, 'id'>> = {
      'monte-carlo-analysis': {
        title: 'Monte Carlo Simulation Analysis',
        description: 'Create and analyze Monte Carlo simulations for risk assessment',
        steps: [
          {
            id: 'step1',
            title: 'Define Simulation Parameters',
            description: 'Set the parameters for your Monte Carlo simulation',
            type: 'data-selection',
            completed: false,
            dataType: 'monte-carlo'
          },
          {
            id: 'step2',
            title: 'Run Simulation',
            description: 'Execute the Monte Carlo simulation with defined parameters',
            type: 'confirmation',
            completed: false
          },
          {
            id: 'step3',
            title: 'Generate Visualization',
            description: 'Create visual representations of simulation results',
            type: 'visualization',
            completed: false
          },
          {
            id: 'step4',
            title: 'Analyze Results',
            description: 'Get AI-powered analysis of simulation outcomes',
            type: 'input',
            completed: false
          }
        ],
        currentStepIndex: 0,
        completed: false
      },
      
      'market-research': {
        title: 'Market Research Analysis',
        description: 'Research market trends and generate insights with Perplexity integration',
        steps: [
          {
            id: 'step1',
            title: 'Define Research Topic',
            description: 'Specify the market segment or topic to research',
            type: 'input',
            completed: false
          },
          {
            id: 'step2',
            title: 'Select Data Sources',
            description: 'Choose data sources for your research',
            type: 'choice',
            options: ['News Articles', 'Financial Reports', 'Social Media', 'Industry Reports'],
            completed: false
          },
          {
            id: 'step3',
            title: 'Generate Insights',
            description: 'Process data and generate market insights',
            type: 'confirmation',
            completed: false,
            dataType: 'perplexity'
          }
        ],
        currentStepIndex: 0,
        completed: false
      },
      
      'dashboard-story': {
        title: 'Create Dashboard Story',
        description: 'Generate a dynamic dashboard based on your data and requirements',
        steps: [
          {
            id: 'step1',
            title: 'Select Data Focus',
            description: 'Choose the primary data focus for your dashboard',
            type: 'choice',
            options: ['Financial Performance', 'Risk Analysis', 'Market Trends', 'Portfolio Analysis'],
            completed: false
          },
          {
            id: 'step2',
            title: 'Select Visualization Types',
            description: 'Choose the visualization types for your dashboard',
            type: 'choice',
            options: ['Line Charts', 'Bar Charts', 'Pie Charts', 'Sankey Diagrams', 'Heat Maps'],
            completed: false
          },
          {
            id: 'step3',
            title: 'Generate Dashboard',
            description: 'Create your customized dashboard',
            type: 'confirmation',
            completed: false,
            dataType: 'dashboard'
          }
        ],
        currentStepIndex: 0,
        completed: false
      },
      
      // Default general workflow if type not specified
      'general': {
        title: 'General Workflow',
        description: 'A general purpose guided workflow',
        steps: [
          {
            id: 'step1',
            title: 'Define Requirements',
            description: 'Define what you want to accomplish',
            type: 'input',
            completed: false
          },
          {
            id: 'step2',
            title: 'Process Information',
            description: 'Process the provided information',
            type: 'confirmation',
            completed: false
          }
        ],
        currentStepIndex: 0,
        completed: false
      }
    };
    
    // Use the specified type or fall back to general
    const template = templates[type] || templates.general;
    
    // Create a new workflow with unique ID
    const id = `${type}-${Date.now()}`;
    const workflow: GuidedWorkflow = {
      id,
      ...template
    };
    
    // Store the workflow
    this.workflows[id] = workflow;
    
    return workflow;
  }
  
  /**
   * Get an existing workflow
   */
  async getWorkflow(id: string): Promise<GuidedWorkflow> {
    const workflow = this.workflows[id];
    
    if (!workflow) {
      throw new Error(`Workflow with ID '${id}' not found`);
    }
    
    return workflow;
  }
  
  /**
   * Process a workflow action
   */
  async processWorkflowAction(
    workflow: GuidedWorkflow,
    action: 'next' | 'prev' | 'complete',
    stepData?: any
  ): Promise<GuidedWorkflow> {
    // If workflow is already complete, return it unchanged
    if (workflow.completed) {
      return workflow;
    }
    
    // Clone the workflow to avoid modifying the original
    const updatedWorkflow = JSON.parse(JSON.stringify(workflow)) as GuidedWorkflow;
    
    // Process action
    switch (action) {
      case 'next':
        // Mark current step as completed
        updatedWorkflow.steps[updatedWorkflow.currentStepIndex].completed = true;
        
        // Move to next step if available
        if (updatedWorkflow.currentStepIndex < updatedWorkflow.steps.length - 1) {
          updatedWorkflow.currentStepIndex += 1;
        } else {
          // If this was the last step, mark workflow as completed
          updatedWorkflow.completed = true;
        }
        break;
        
      case 'prev':
        // Move to previous step if available
        if (updatedWorkflow.currentStepIndex > 0) {
          updatedWorkflow.currentStepIndex -= 1;
        }
        break;
        
      case 'complete':
        // Mark all steps as completed
        updatedWorkflow.steps.forEach(step => {
          step.completed = true;
        });
        
        // Mark workflow as completed
        updatedWorkflow.completed = true;
        break;
    }
    
    // Update the stored workflow
    this.workflows[workflow.id] = updatedWorkflow;
    
    return updatedWorkflow;
  }
}

// Create and export a singleton instance
const jouleIntegrationService = new JouleIntegrationService();
export default jouleIntegrationService;