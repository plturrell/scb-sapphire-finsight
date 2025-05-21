import { 
  SimulationInput, 
  SimulationOutput, 
  SimulationComparison,
  LlmAnalysis,
  UUID,
  ParameterHistory
} from '@/types/MonteCarloTypes';
import { VietnamMonteCarloConfig } from '@/components/VietnamMonteCarloParams';

/**
 * Monte Carlo Service
 * High-level service that integrates with the Monte Carlo API endpoints
 * Provides a simple interface for frontend components to interact with simulations
 */
export class MonteCarloService {
  private static instance: MonteCarloService;
  private baseUrl: string;

  private constructor() {
    // Use appropriate base URL based on environment
    this.baseUrl = typeof window !== 'undefined' 
      ? window.location.origin + '/api'
      : process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): MonteCarloService {
    if (!MonteCarloService.instance) {
      MonteCarloService.instance = new MonteCarloService();
    }
    return MonteCarloService.instance;
  }

  // ============= SIMULATION MANAGEMENT =============

  /**
   * Create and run a new Monte Carlo simulation
   */
  public async createSimulation(
    config: VietnamMonteCarloConfig,
    username?: string
  ): Promise<{ inputId: UUID; outputId: UUID; status: string }> {
    const response = await fetch(`${this.baseUrl}/monte-carlo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ config, username })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create simulation');
    }

    return response.json();
  }

  /**
   * Get a simulation input by ID
   */
  public async getSimulationInput(inputId: UUID): Promise<SimulationInput | null> {
    const response = await fetch(`${this.baseUrl}/monte-carlo?id=${inputId}`, {
      method: 'GET'
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      const error = await response.json();
      throw new Error(error.message || 'Failed to get simulation input');
    }

    const data = await response.json();
    return data.input || null;
  }

  /**
   * Get a simulation output by ID
   */
  public async getSimulationOutput(outputId: UUID): Promise<SimulationOutput | null> {
    const response = await fetch(`${this.baseUrl}/monte-carlo?id=${outputId}`, {
      method: 'GET'
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      const error = await response.json();
      throw new Error(error.message || 'Failed to get simulation output');
    }

    const data = await response.json();
    return data.output || null;
  }

  /**
   * List all simulation inputs with optional filtering
   */
  public async listSimulations(options?: {
    type?: string;
    createdBy?: string;
    sortBy?: 'createdAt' | 'name';
    sortDirection?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<{ inputs: SimulationInput[]; pagination?: any }> {
    const params = new URLSearchParams();
    
    if (options?.type) params.append('type', options.type);
    if (options?.createdBy) params.append('createdBy', options.createdBy);
    if (options?.sortBy) params.append('sortBy', options.sortBy);
    if (options?.sortDirection) params.append('sortDirection', options.sortDirection);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const response = await fetch(`${this.baseUrl}/monte-carlo?${params.toString()}`, {
      method: 'GET'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to list simulations');
    }

    return response.json();
  }

  /**
   * Get all outputs for a simulation input
   */
  public async getSimulationOutputs(inputId: UUID): Promise<SimulationOutput[]> {
    const response = await fetch(`${this.baseUrl}/monte-carlo?inputId=${inputId}`, {
      method: 'GET'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get simulation outputs');
    }

    const data = await response.json();
    return data.outputs || [];
  }

  /**
   * Update simulation results
   */
  public async updateSimulationResults(
    outputId: UUID,
    results: number[]
  ): Promise<{ message: string; outputId: UUID; status: string }> {
    const response = await fetch(`${this.baseUrl}/monte-carlo?id=${outputId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ results })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update simulation results');
    }

    return response.json();
  }

  /**
   * Update simulation status
   */
  public async updateSimulationStatus(
    outputId: UUID,
    status: string,
    progressPercentage?: number,
    error?: string
  ): Promise<{ message: string; outputId: UUID }> {
    const response = await fetch(`${this.baseUrl}/monte-carlo?id=${outputId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, progressPercentage, error })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update simulation status');
    }

    return response.json();
  }

  /**
   * Delete a simulation and all related data
   */
  public async deleteSimulation(simulationId: UUID): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/monte-carlo?id=${simulationId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete simulation');
    }

    return response.json();
  }

  // ============= STORAGE OPERATIONS =============

  /**
   * Get parameter history for a simulation
   */
  public async getParameterHistory(simulationId: UUID): Promise<ParameterHistory[]> {
    const response = await fetch(
      `${this.baseUrl}/monte-carlo/storage?operation=parameter-history&simulationId=${simulationId}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get parameter history');
    }

    const data = await response.json();
    return data.history || [];
  }

  /**
   * Record a parameter change
   */
  public async recordParameterChange(
    parameterId: string,
    simulationInputId: UUID,
    previousValue: any,
    newValue: any,
    changedBy?: string
  ): Promise<{ message: string; historyId: UUID }> {
    const response = await fetch(
      `${this.baseUrl}/monte-carlo/storage?operation=record-parameter-change`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parameterId,
          simulationInputId,
          previousValue,
          newValue,
          changedBy
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to record parameter change');
    }

    return response.json();
  }

  /**
   * Get storage statistics
   */
  public async getStorageStats(): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/monte-carlo/storage?operation=storage-stats`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get storage statistics');
    }

    const data = await response.json();
    return data.storageStats;
  }

  /**
   * Apply data retention policy
   */
  public async applyDataRetentionPolicy(options?: {
    detailedRetentionDays?: number;
    summaryRetentionDays?: number;
    coldStorageThresholdDays?: number;
  }): Promise<{ message: string }> {
    const response = await fetch(
      `${this.baseUrl}/monte-carlo/storage?operation=apply-retention-policy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options || {})
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to apply retention policy');
    }

    return response.json();
  }

  /**
   * Check storage health
   */
  public async checkStorageHealth(): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/monte-carlo/storage?operation=health`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to check storage health');
    }

    const data = await response.json();
    return data.health;
  }

  // ============= COMPARISON OPERATIONS =============

  /**
   * Create a comparison between multiple simulations
   */
  public async createComparison(
    simulationIds: UUID[],
    name?: string,
    description?: string
  ): Promise<{ comparisonId: UUID; comparison: SimulationComparison }> {
    const response = await fetch(
      `${this.baseUrl}/monte-carlo/comparison`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ simulationIds, name, description })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create comparison');
    }

    return response.json();
  }

  /**
   * Get a comparison by ID
   */
  public async getComparison(comparisonId: UUID): Promise<SimulationComparison | null> {
    const response = await fetch(
      `${this.baseUrl}/monte-carlo/comparison?operation=comparison&comparisonId=${comparisonId}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      const error = await response.json();
      throw new Error(error.message || 'Failed to get comparison');
    }

    const data = await response.json();
    return data.comparison || null;
  }

  /**
   * List all comparisons
   */
  public async listComparisons(): Promise<SimulationComparison[]> {
    const response = await fetch(
      `${this.baseUrl}/monte-carlo/comparison?operation=comparison`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to list comparisons');
    }

    const data = await response.json();
    return data.comparisons || [];
  }

  /**
   * Quick comparison between simulations (without saving)
   */
  public async quickCompare(simulationIds: UUID[]): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/monte-carlo/comparison?operation=quick-compare&simulationIds=${simulationIds.join(',')}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to perform quick comparison');
    }

    const data = await response.json();
    return data.quickComparison;
  }

  /**
   * Delete a comparison
   */
  public async deleteComparison(comparisonId: UUID): Promise<{ message: string }> {
    const response = await fetch(
      `${this.baseUrl}/monte-carlo/comparison?comparisonId=${comparisonId}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete comparison');
    }

    return response.json();
  }

  // ============= ANALYSIS OPERATIONS =============

  /**
   * Get existing analysis for a simulation output
   */
  public async getAnalysis(outputId: UUID): Promise<LlmAnalysis | null> {
    const response = await fetch(
      `${this.baseUrl}/monte-carlo/analysis?operation=analysis&outputId=${outputId}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      const error = await response.json();
      throw new Error(error.message || 'Failed to get analysis');
    }

    const data = await response.json();
    return data.analysis || null;
  }

  /**
   * Generate analysis for a simulation output
   */
  public async generateAnalysis(
    outputId: UUID,
    forceRegenerate: boolean = false
  ): Promise<{ analysis: LlmAnalysis; regenerated: boolean }> {
    const response = await fetch(
      `${this.baseUrl}/monte-carlo/analysis`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ outputId, forceRegenerate })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate analysis');
    }

    return response.json();
  }

  /**
   * Generate analysis for multiple simulations in batch
   */
  public async batchAnalysis(simulationIds: UUID[]): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/monte-carlo/analysis?operation=batch-analysis`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ simulationIds })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to perform batch analysis');
    }

    return response.json();
  }

  /**
   * Generate comparative analysis between simulations
   */
  public async generateComparativeAnalysis(
    simulationIds: UUID[],
    focus: string = 'risk_and_returns'
  ): Promise<{ analysis: LlmAnalysis }> {
    const response = await fetch(
      `${this.baseUrl}/monte-carlo/analysis?operation=comparative-analysis`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comparisonSimulationIds: simulationIds, comparisonFocus: focus })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate comparative analysis');
    }

    return response.json();
  }

  /**
   * Generate custom analysis with specific focus areas
   */
  public async generateCustomAnalysis(
    outputId: UUID,
    focusAreas?: string[],
    customPrompt?: string
  ): Promise<{ analysis: LlmAnalysis }> {
    const response = await fetch(
      `${this.baseUrl}/monte-carlo/analysis?operation=custom-analysis`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetOutputId: outputId, focusAreas, customPrompt })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate custom analysis');
    }

    return response.json();
  }

  /**
   * Get risk assessment for a simulation
   */
  public async getRiskAssessment(outputId: UUID): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/monte-carlo/analysis?operation=risk-assessment&outputId=${outputId}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get risk assessment');
    }

    const data = await response.json();
    return data.riskAssessment;
  }

  /**
   * Get analysis summary for multiple simulations
   */
  public async getAnalysisSummary(simulationIds: UUID[]): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/monte-carlo/analysis?operation=analysis-summary&simulationIds=${simulationIds.join(',')}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get analysis summary');
    }

    const data = await response.json();
    return data.summaries;
  }

  // ============= UTILITY METHODS =============

  /**
   * Get the most recent completed output for a simulation input
   */
  public async getLatestCompletedOutput(inputId: UUID): Promise<SimulationOutput | null> {
    const outputs = await this.getSimulationOutputs(inputId);
    const completedOutputs = outputs.filter(o => o.status === 'completed');
    
    if (completedOutputs.length === 0) {
      return null;
    }
    
    // Sort by end time descending and return the most recent
    completedOutputs.sort((a, b) => (b.endTime || 0) - (a.endTime || 0));
    return completedOutputs[0];
  }

  /**
   * Check if a simulation has completed results
   */
  public async hasCompletedResults(inputId: UUID): Promise<boolean> {
    const latestOutput = await this.getLatestCompletedOutput(inputId);
    return latestOutput !== null && latestOutput.results !== undefined;
  }

  /**
   * Get simulation status
   */
  public async getSimulationStatus(inputId: UUID): Promise<{
    status: string;
    progress: number;
    error?: string;
    hasResults: boolean;
    hasAnalysis: boolean;
  }> {
    const outputs = await this.getSimulationOutputs(inputId);
    
    if (outputs.length === 0) {
      return {
        status: 'not_found',
        progress: 0,
        hasResults: false,
        hasAnalysis: false
      };
    }
    
    // Get the most recent output
    const latestOutput = outputs.sort((a, b) => (b.startTime) - (a.startTime))[0];
    
    return {
      status: latestOutput.status,
      progress: latestOutput.progressPercentage,
      error: latestOutput.error,
      hasResults: !!latestOutput.results,
      hasAnalysis: !!latestOutput.llmAnalysis
    };
  }
}

// Export singleton instance
export const monteCarloService = MonteCarloService.getInstance();
export default monteCarloService;