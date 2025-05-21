/**
 * LLM-Modulo Verification Framework for Financial Analysis
 * Implements bi-directional verification loop with specialized financial critics
 */

import { FinancialAlgorithm } from './AlphaEvolveEngine';
import { UUID } from '@/types/MonteCarloTypes';

export interface CriticFeedback {
  criticId: string;
  criticName: string;
  isValid: boolean;
  score: number; // 0-1 scale
  feedback: string;
  suggestions: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface VerificationResult {
  isValid: boolean;
  overallScore: number;
  feedback: CriticFeedback[];
  refinedAlgorithm?: FinancialAlgorithm;
  iterations: number;
  convergenceAchieved: boolean;
}

export interface VerificationConfig {
  maxIterations: number;
  convergenceThreshold: number;
  requireAllCritics: boolean;
  minScore: number;
}

/**
 * Base class for financial critics
 */
abstract class FinancialCritic {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;
  
  abstract evaluate(algorithm: FinancialAlgorithm, context: any): Promise<CriticFeedback>;
  
  protected createFeedback(
    isValid: boolean,
    score: number,
    feedback: string,
    suggestions: string[] = [],
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): CriticFeedback {
    return {
      criticId: this.id,
      criticName: this.name,
      isValid,
      score,
      feedback,
      suggestions,
      severity
    };
  }
}

/**
 * Mathematical Consistency Critic
 * Validates calculations, formulas, and mathematical operations
 */
class MathematicalConsistencyCritic extends FinancialCritic {
  readonly id = 'math_consistency';
  readonly name = 'Mathematical Consistency';
  readonly description = 'Validates mathematical formulas and calculations';

  async evaluate(algorithm: FinancialAlgorithm, context: any): Promise<CriticFeedback> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 1.0;

    // Check for common mathematical errors in the algorithm code
    const code = algorithm.code.toLowerCase();
    
    // Division by zero checks
    if (code.includes('/ 0') || code.includes('/0')) {
      issues.push('Potential division by zero detected');
      suggestions.push('Add zero-division protection');
      score -= 0.3;
    }

    // Check for undefined or NaN handling
    if (!code.includes('isnan') && !code.includes('isfinite')) {
      issues.push('No NaN or infinity handling detected');
      suggestions.push('Add NaN and infinity checks');
      score -= 0.2;
    }

    // Validate statistical calculations
    if (code.includes('sqrt') && !code.includes('abs')) {
      issues.push('Square root without absolute value check');
      suggestions.push('Ensure non-negative values before square root');
      score -= 0.1;
    }

    // Check parameter bounds
    const params = algorithm.parameters;
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'number') {
        if (key.includes('rate') || key.includes('probability')) {
          if (value < 0 || value > 1) {
            issues.push(`Parameter ${key} should be between 0 and 1`);
            suggestions.push(`Constrain ${key} to valid range`);
            score -= 0.1;
          }
        }
      }
    }

    const isValid = issues.length === 0;
    const feedback = isValid 
      ? 'Mathematical consistency validated'
      : `Mathematical issues found: ${issues.join(', ')}`;

    return this.createFeedback(
      isValid, 
      Math.max(0, score), 
      feedback, 
      suggestions,
      issues.length > 2 ? 'high' : 'medium'
    );
  }
}

/**
 * Financial Principles Critic
 * Ensures adherence to financial theory and established practices
 */
class FinancialPrinciplesCritic extends FinancialCritic {
  readonly id = 'financial_principles';
  readonly name = 'Financial Principles';
  readonly description = 'Validates adherence to financial theory and best practices';

  async evaluate(algorithm: FinancialAlgorithm, context: any): Promise<CriticFeedback> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 1.0;

    const code = algorithm.code.toLowerCase();
    const params = algorithm.parameters;

    // Risk management checks
    if (!code.includes('risk') && !code.includes('volatility')) {
      issues.push('No explicit risk management detected');
      suggestions.push('Add risk management measures');
      score -= 0.3;
    }

    // Diversification checks
    if (!code.includes('diversi') && !code.includes('correlation')) {
      issues.push('No diversification considerations detected');
      suggestions.push('Consider portfolio diversification');
      score -= 0.2;
    }

    // Position sizing checks
    if (!code.includes('position') && !code.includes('allocation')) {
      issues.push('No position sizing strategy detected');
      suggestions.push('Add position sizing logic');
      score -= 0.2;
    }

    // Check for leverage constraints
    if (params.leverage && params.leverage > 3) {
      issues.push('Excessive leverage detected');
      suggestions.push('Consider reducing leverage for risk management');
      score -= 0.3;
    }

    // Market regime awareness
    if (!code.includes('market') && !code.includes('regime')) {
      issues.push('No market regime awareness detected');
      suggestions.push('Add market condition adaptability');
      score -= 0.1;
    }

    // Transaction cost considerations
    if (!code.includes('cost') && !code.includes('fee')) {
      issues.push('No transaction cost considerations');
      suggestions.push('Include transaction costs in calculations');
      score -= 0.1;
    }

    const isValid = issues.length === 0;
    const feedback = isValid 
      ? 'Financial principles validated'
      : `Financial principle violations: ${issues.join(', ')}`;

    return this.createFeedback(
      isValid, 
      Math.max(0, score), 
      feedback, 
      suggestions,
      score < 0.5 ? 'high' : 'medium'
    );
  }
}

/**
 * Market Plausibility Critic
 * Checks if predictions and analyses align with realistic market behavior
 */
class MarketPlausibilityCritic extends FinancialCritic {
  readonly id = 'market_plausibility';
  readonly name = 'Market Plausibility';
  readonly description = 'Validates market behavior assumptions and predictions';

  async evaluate(algorithm: FinancialAlgorithm, context: any): Promise<CriticFeedback> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 1.0;

    const performance = algorithm.performance;
    const params = algorithm.parameters;

    // Check for unrealistic return expectations
    if (performance.returns > 0.5) { // 50% returns
      issues.push('Unrealistically high return expectations');
      suggestions.push('Adjust return expectations to market reality');
      score -= 0.4;
    }

    // Check for unrealistic low volatility
    if (performance.risk < 0.01) { // Less than 1% volatility
      issues.push('Unrealistically low volatility assumption');
      suggestions.push('Consider realistic market volatility');
      score -= 0.3;
    }

    // Check Sharpe ratio plausibility
    if (performance.sharpe > 3.0) {
      issues.push('Unrealistically high Sharpe ratio');
      suggestions.push('Validate risk-adjusted return calculations');
      score -= 0.3;
    }

    // Check for market efficiency assumptions
    if (params.alphaExpectation && params.alphaExpectation > 0.1) {
      issues.push('Excessive alpha expectation may violate market efficiency');
      suggestions.push('Consider market efficiency constraints');
      score -= 0.2;
    }

    // Liquidity considerations
    if (params.portfolioSize && params.portfolioSize > 1000000000) { // $1B+
      if (!algorithm.code.includes('liquidity')) {
        issues.push('Large portfolio without liquidity considerations');
        suggestions.push('Add liquidity impact modeling');
        score -= 0.2;
      }
    }

    // Time horizon realism
    if (params.rebalanceFreq && params.rebalanceFreq < 1) {
      issues.push('Unrealistic high-frequency rebalancing');
      suggestions.push('Consider practical rebalancing constraints');
      score -= 0.1;
    }

    const isValid = issues.length === 0;
    const feedback = isValid 
      ? 'Market assumptions are plausible'
      : `Market plausibility issues: ${issues.join(', ')}`;

    return this.createFeedback(
      isValid, 
      Math.max(0, score), 
      feedback, 
      suggestions,
      score < 0.4 ? 'high' : 'medium'
    );
  }
}

/**
 * Data Integrity Critic
 * Verifies proper use of financial data without fabrication
 */
class DataIntegrityCritic extends FinancialCritic {
  readonly id = 'data_integrity';
  readonly name = 'Data Integrity';
  readonly description = 'Validates proper use of financial data and prevents fabrication';

  async evaluate(algorithm: FinancialAlgorithm, context: any): Promise<CriticFeedback> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 1.0;

    const code = algorithm.code.toLowerCase();

    // Check for hardcoded values that should be data-driven
    const hardcodedPatterns = [
      /return 0\.\d+/g,
      /price = \d+/g,
      /volatility = 0\.\d+/g
    ];

    hardcodedPatterns.forEach(pattern => {
      if (pattern.test(code)) {
        issues.push('Hardcoded financial values detected');
        suggestions.push('Use market data instead of hardcoded values');
        score -= 0.2;
      }
    });

    // Check for data validation
    if (!code.includes('validate') && !code.includes('clean')) {
      issues.push('No data validation detected');
      suggestions.push('Add data validation and cleaning steps');
      score -= 0.2;
    }

    // Check for missing data handling
    if (!code.includes('null') && !code.includes('undefined') && !code.includes('missing')) {
      issues.push('No missing data handling detected');
      suggestions.push('Add missing data handling logic');
      score -= 0.2;
    }

    // Check for data source references
    if (!code.includes('source') && !code.includes('data')) {
      issues.push('No clear data source references');
      suggestions.push('Specify data sources and their reliability');
      score -= 0.1;
    }

    // Check for lookback bias
    if (code.includes('future') || code.includes('lookahead')) {
      issues.push('Potential lookback bias detected');
      suggestions.push('Ensure no future information is used');
      score -= 0.4;
    }

    const isValid = issues.length === 0;
    const feedback = isValid 
      ? 'Data integrity validated'
      : `Data integrity issues: ${issues.join(', ')}`;

    return this.createFeedback(
      isValid, 
      Math.max(0, score), 
      feedback, 
      suggestions,
      issues.some(i => i.includes('lookback')) ? 'critical' : 'medium'
    );
  }
}

/**
 * Regulatory Compliance Critic
 * Ensures analyses meet relevant financial regulations
 */
class RegulatoryComplianceCritic extends FinancialCritic {
  readonly id = 'regulatory_compliance';
  readonly name = 'Regulatory Compliance';
  readonly description = 'Validates compliance with financial regulations';

  async evaluate(algorithm: FinancialAlgorithm, context: any): Promise<CriticFeedback> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 1.0;

    const code = algorithm.code.toLowerCase();
    const params = algorithm.parameters;

    // Risk disclosure checks
    if (!code.includes('risk') || !code.includes('disclosure')) {
      issues.push('Insufficient risk disclosure');
      suggestions.push('Add comprehensive risk disclosures');
      score -= 0.2;
    }

    // Suitability checks
    if (!code.includes('suitability') && !code.includes('client')) {
      issues.push('No suitability assessment detected');
      suggestions.push('Add client suitability considerations');
      score -= 0.2;
    }

    // Market manipulation checks
    if (code.includes('manipulate') || code.includes('pump')) {
      issues.push('Potential market manipulation detected');
      suggestions.push('Remove market manipulation strategies');
      score -= 0.8;
    }

    // Insider trading checks
    if (code.includes('insider') || code.includes('material non-public')) {
      issues.push('Potential insider trading detected');
      suggestions.push('Ensure no use of material non-public information');
      score -= 0.8;
    }

    // Position limits
    if (params.maxPosition && params.maxPosition > 0.1) {
      issues.push('Position may exceed regulatory limits');
      suggestions.push('Verify position limits compliance');
      score -= 0.1;
    }

    // Record keeping
    if (!code.includes('log') && !code.includes('record')) {
      issues.push('No record keeping detected');
      suggestions.push('Add proper transaction and decision logging');
      score -= 0.1;
    }

    const isValid = issues.length === 0;
    const feedback = isValid 
      ? 'Regulatory compliance validated'
      : `Compliance issues: ${issues.join(', ')}`;

    return this.createFeedback(
      isValid, 
      Math.max(0, score), 
      feedback, 
      suggestions,
      issues.some(i => i.includes('manipulation') || i.includes('insider')) ? 'critical' : 'medium'
    );
  }
}

/**
 * Main LLM-Modulo Verification Framework
 */
export class LLMModuloFramework {
  private critics: FinancialCritic[];
  private config: VerificationConfig;
  private reformatter: FinancialReformatter;

  constructor(config: Partial<VerificationConfig> = {}) {
    this.config = {
      maxIterations: 7,
      convergenceThreshold: 0.8,
      requireAllCritics: false,
      minScore: 0.7,
      ...config
    };

    this.critics = [
      new MathematicalConsistencyCritic(),
      new FinancialPrinciplesCritic(),
      new MarketPlausibilityCritic(),
      new DataIntegrityCritic(),
      new RegulatoryCompliancyCritic()
    ];

    this.reformatter = new FinancialReformatter();
  }

  /**
   * Main verification loop
   */
  async verify(algorithm: FinancialAlgorithm, context: any): Promise<VerificationResult> {
    let currentAlgorithm = algorithm;
    let iterations = 0;
    let convergenceAchieved = false;

    const allFeedback: CriticFeedback[][] = [];

    while (iterations < this.config.maxIterations && !convergenceAchieved) {
      iterations++;
      
      // Evaluate with all critics
      const feedback = await this.evaluateWithCritics(currentAlgorithm, context);
      allFeedback.push(feedback);

      // Check convergence
      const overallScore = this.calculateOverallScore(feedback);
      convergenceAchieved = this.checkConvergence(feedback, overallScore);

      if (!convergenceAchieved && iterations < this.config.maxIterations) {
        // Refine algorithm based on feedback
        currentAlgorithm = await this.refineAlgorithm(currentAlgorithm, feedback, context);
      }
    }

    const finalFeedback = allFeedback[allFeedback.length - 1];
    const finalScore = this.calculateOverallScore(finalFeedback);
    const isValid = this.isAlgorithmValid(finalFeedback, finalScore);

    return {
      isValid,
      overallScore: finalScore,
      feedback: finalFeedback,
      refinedAlgorithm: currentAlgorithm,
      iterations,
      convergenceAchieved
    };
  }

  /**
   * Evaluate algorithm with all critics
   */
  private async evaluateWithCritics(
    algorithm: FinancialAlgorithm, 
    context: any
  ): Promise<CriticFeedback[]> {
    const feedbackPromises = this.critics.map(critic => 
      critic.evaluate(algorithm, context)
    );

    return Promise.all(feedbackPromises);
  }

  /**
   * Calculate overall score from critic feedback
   */
  private calculateOverallScore(feedback: CriticFeedback[]): number {
    if (feedback.length === 0) return 0;
    
    const weightedScores = feedback.map(f => {
      const weight = f.severity === 'critical' ? 2 : 
                    f.severity === 'high' ? 1.5 : 
                    f.severity === 'medium' ? 1 : 0.5;
      return f.score * weight;
    });

    const totalWeight = feedback.reduce((sum, f) => {
      return sum + (f.severity === 'critical' ? 2 : 
                   f.severity === 'high' ? 1.5 : 
                   f.severity === 'medium' ? 1 : 0.5);
    }, 0);

    return weightedScores.reduce((sum, score) => sum + score, 0) / totalWeight;
  }

  /**
   * Check if convergence has been achieved
   */
  private checkConvergence(feedback: CriticFeedback[], overallScore: number): boolean {
    if (overallScore >= this.config.convergenceThreshold) {
      return true;
    }

    if (this.config.requireAllCritics) {
      return feedback.every(f => f.isValid);
    }

    const criticalIssues = feedback.filter(f => f.severity === 'critical' && !f.isValid);
    return criticalIssues.length === 0 && overallScore >= this.config.minScore;
  }

  /**
   * Determine if algorithm is valid
   */
  private isAlgorithmValid(feedback: CriticFeedback[], overallScore: number): boolean {
    const criticalIssues = feedback.filter(f => f.severity === 'critical' && !f.isValid);
    return criticalIssues.length === 0 && overallScore >= this.config.minScore;
  }

  /**
   * Refine algorithm based on critic feedback
   */
  private async refineAlgorithm(
    algorithm: FinancialAlgorithm,
    feedback: CriticFeedback[],
    context: any
  ): Promise<FinancialAlgorithm> {
    const refinementPrompt = this.constructRefinementPrompt(algorithm, feedback, context);
    
    try {
      const response = await fetch('/api/perplexity-centralized', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: refinementPrompt,
          type: 'algorithm_refinement'
        })
      });

      const data = await response.json();
      const refinedData = this.reformatter.parseRefinementResponse(data.response || data.message);

      return {
        ...algorithm,
        code: refinedData.code || algorithm.code,
        description: refinedData.description || algorithm.description,
        parameters: { ...algorithm.parameters, ...refinedData.parameters }
      };

    } catch (error) {
      console.error('Error refining algorithm:', error);
      return algorithm; // Return original if refinement fails
    }
  }

  /**
   * Construct refinement prompt for LLM
   */
  private constructRefinementPrompt(
    algorithm: FinancialAlgorithm,
    feedback: CriticFeedback[],
    context: any
  ): string {
    const issues = feedback.filter(f => !f.isValid);
    const suggestions = feedback.flatMap(f => f.suggestions);

    return `
Refine this financial algorithm based on the following critic feedback:

Algorithm: ${algorithm.description}
Code: ${algorithm.code}
Parameters: ${JSON.stringify(algorithm.parameters)}

Issues Found:
${issues.map(issue => `- ${issue.criticName}: ${issue.feedback}`).join('\n')}

Suggestions:
${suggestions.map(suggestion => `- ${suggestion}`).join('\n')}

Context: ${JSON.stringify(context)}

Please provide a refined version that addresses these issues while maintaining the algorithm's core functionality.
Focus on the most critical issues first.

Return a JSON object with:
{
  "code": "improved algorithm code",
  "description": "updated description",
  "parameters": "refined parameters object"
}
    `;
  }
}

/**
 * Financial Reformatter for converting between representations
 */
class FinancialReformatter {
  parseRefinementResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error parsing refinement response:', error);
    }
    
    return {};
  }
}

export default LLMModuloFramework;