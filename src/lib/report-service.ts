import axios from 'axios';
import ragSystem from './rag-system';
import webResearchService from './web-research-service';

/**
 * Report Generation Service for SCB Sapphire FinSight
 * Based on LangChain structured report generation
 */

export interface ReportTopic {
  title: string;
  description: string;
}

export interface ReportStructure {
  sections: string[];
  includeExecutiveSummary: boolean;
  includeTables: boolean;
  includeCharts: boolean;
}

export interface ReportConfig {
  topic: ReportTopic;
  structure: ReportStructure;
  timeframe: string; // e.g., "last 30 days", "Q1 2025"
  maxLength: number; // approximate word count
}

export interface ReportResult {
  id: string;
  title: string;
  executiveSummary?: string;
  sections: Array<{
    title: string;
    content: string;
    charts?: Array<{
      type: string; // "pie", "bar", "line"
      data: any;
      title: string;
    }>;
    tables?: Array<{
      headers: string[];
      rows: any[][];
      title: string;
    }>;
  }>;
  generatedAt: string;
  metadata: {
    sources: string[];
    generationTime: number;
  };
}

export interface MCTSAnalysis {
  expectedReturn: number;
  riskAssessment: string;
  confidenceInterval: [number, number];
  optimalPortfolio: Array<{asset: string, allocation: number}>;
  simulationCount: number;
}

export interface ResearchSummary {
  keyInsights: string[];
  topSources: Array<{
    title: string;
    url: string;
    relevance: number;
  }>;
  marketSentiment: number;
  sectorSentiments: Record<string, number>;
}

export interface ReportWithAI extends ReportResult {
  aiAnalysis: {
    monteCarloSimulation?: MCTSAnalysis;
    webResearch?: ResearchSummary;
    ragAssisted: boolean;
  };
}

export class ReportService {
  private apiKey: string;
  private reportApiEndpoint: string;
  private financeApiEndpoint: string;
  private financeApiKey: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_REPORT_API_KEY || '';
    this.reportApiEndpoint = process.env.NEXT_PUBLIC_REPORT_API_ENDPOINT || 'https://api.scb-finance.com/reports';
    this.financeApiEndpoint = process.env.NEXT_PUBLIC_FINANCE_API_ENDPOINT || 'https://api.scb-finance.com/finance';
    this.financeApiKey = process.env.NEXT_PUBLIC_FINANCE_API_KEY || '';
  }

  /**
   * Generate a structured financial report based on the provided configuration
   * Enhanced with RAG, Monte Carlo analysis, and web research
   */
  async generateReport(config: ReportConfig): Promise<ReportWithAI> {
    try {
      console.log(`Generating report on topic: ${config.topic.title}`);
      console.log(`Structure: ${config.structure.sections.join(', ')}`);
      
      // Step 1: Conduct web research on the topic
      console.log(`Starting web research for topic: ${config.topic.title}`);
      const researchResult = await webResearchService.conductResearch({
        topic: config.topic.title,
        timeframe: config.timeframe,
        depth: 'deep',
        sources: ['bloomberg', 'reuters', 'sec-filings', 'financial-times', 'wsj'],
        relevance_threshold: 0.75
      });
      
      // Step 2: Retrieve relevant knowledge from RAG system
      console.log('Retrieving context from RAG system');
      const ragDocuments = await ragSystem.retrieveRelevantDocuments(
        `${config.topic.title} ${config.topic.description} financial analysis`,
        10
      );
      
      // Step 3: Run Monte Carlo simulations for financial projections
      console.log('Running Monte Carlo simulations for financial projections');
      const monteCarloResults = await this.runFinancialMonteCarlo(config.topic.title);
      
      // Step 4: Generate the actual report using the LangChain API
      console.log('Generating report through LangChain structured report generation API');
      
      // Create the report request payload
      const reportRequest = {
        topic: config.topic,
        parameters: {
          timeframe: config.timeframe,
          sections: config.structure.sections,
          includeExecutiveSummary: config.structure.includeExecutiveSummary,
          includeTables: config.structure.includeTables,
          includeCharts: config.structure.includeCharts,
          maxLength: config.maxLength
        },
        context: {
          webResearch: researchResult,
          ragDocuments: ragDocuments,
          financialAnalysis: monteCarloResults
        }
      };
      
      // Make the API call to the report generation service
      const response = await axios.post(
        this.reportApiEndpoint,
        reportRequest,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Extract the report data from the response
      const reportData = response.data;
      
      // Construct the enhanced report with AI capabilities
      const enhancedReport: ReportWithAI = {
        id: reportData.id,
        title: reportData.title,
        executiveSummary: reportData.executiveSummary,
        sections: reportData.sections,
        generatedAt: reportData.generatedAt,
        metadata: reportData.metadata,
        aiAnalysis: {
          monteCarloSimulation: monteCarloResults,
          webResearch: {
            keyInsights: researchResult.key_insights,
            topSources: researchResult.top_sources.map(source => ({
              title: source.title,
              url: source.url,
              relevance: source.relevance_score
            })),
            marketSentiment: researchResult.market_sentiment.overall,
            sectorSentiments: researchResult.market_sentiment.by_sector
          },
          ragAssisted: ragDocuments.length > 0
        }
      };
      
      return enhancedReport;
      
    } catch (error: unknown) {
      console.error("Error generating report:", error);
      throw new Error("Failed to generate report");
    }
  }

  /**
   * Run Monte Carlo simulation for financial projections using external API
   * @param topic Report topic for context
   */
  private async runFinancialMonteCarlo(topic: string): Promise<MCTSAnalysis> {
    try {
      console.log(`Running Monte Carlo simulations for topic: ${topic}`);
      
      if (!this.financeApiKey) {
        throw new Error('Finance API key is missing. Please check environment variables.');
      }
      
      // Fetch current market data
      const marketDataResponse = await axios.get(
        `${this.financeApiEndpoint}/market-data`,
        {
          headers: {
            'Authorization': `Bearer ${this.financeApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (marketDataResponse.status !== 200) {
        throw new Error(`Failed to fetch market data: ${marketDataResponse.statusText}`);
      }
      
      const marketData = marketDataResponse.data;
      
      // Request Monte Carlo simulation with the topic for context
      const simulationResponse = await axios.post(
        `${this.financeApiEndpoint}/monte-carlo-simulation`,
        {
          topic,
          market_conditions: marketData.current_conditions,
          simulation_parameters: {
            iterations: 10000,
            confidence_level: 0.95,
            time_horizon_years: 5
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.financeApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (simulationResponse.status !== 200) {
        throw new Error(`Failed to run Monte Carlo simulation: ${simulationResponse.statusText}`);
      }
      
      // Parse the simulation results
      const simulationResults = simulationResponse.data;
      
      // Transform API results into our internal format
      return {
        expectedReturn: simulationResults.expected_return,
        riskAssessment: simulationResults.risk_assessment,
        confidenceInterval: simulationResults.confidence_interval,
        optimalPortfolio: simulationResults.optimal_allocation.map((item: any) => ({
          asset: item.asset_id,
          allocation: item.weight
        })),
        simulationCount: simulationResults.simulation_parameters.iterations
      };
    } catch (error: unknown) {
      console.error('Error in Monte Carlo simulation:', error);
      throw new Error(`Failed to complete financial analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get historical reports
   */
  async getReportHistory(): Promise<Array<Pick<ReportResult, 'id' | 'title' | 'generatedAt'>>> {
    try {
      const response = await axios.get(
        `${this.reportApiEndpoint}/history`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.reports;
    } catch (error: unknown) {
      console.error("Error fetching report history:", error);
      return [];
    }
  }

  /**
   * Get a specific report by ID
   */
  async getReportById(id: string): Promise<ReportWithAI | null> {
    try {
      const response = await axios.get(
        `${this.reportApiEndpoint}/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error: unknown) {
      console.error(`Error fetching report ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Get detailed analysis for a financial simulation
   * @param simulationId The ID of the simulation to analyze
   */
  async getDetailedAnalysis(simulationId: string): Promise<any> {
    try {
      console.log(`Fetching detailed analysis for simulation: ${simulationId}`);
      
      if (!this.financeApiKey) {
        throw new Error('Finance API key is missing. Please check environment variables.');
      }
      
      // Request detailed analysis from the finance API
      const analysisResponse = await axios.get(
        `${this.financeApiEndpoint}/simulations/${simulationId}/analysis`,
        {
          headers: {
            'Authorization': `Bearer ${this.financeApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (analysisResponse.status !== 200) {
        throw new Error(`Failed to fetch detailed analysis: ${analysisResponse.statusText}`);
      }
      
      // Return the detailed analysis data
      return analysisResponse.data;
    } catch (error: unknown) {
      console.error(`Error fetching detailed analysis for simulation ${simulationId}:`, error);
      throw new Error(`Failed to fetch detailed analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Create an instance of the ReportService
const reportService = new ReportService();

// Export the instance
export default reportService;