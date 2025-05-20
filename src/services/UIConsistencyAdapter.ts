import { 
  RegionalHeatmapEntry, 
  VulnerabilityHotspot, 
  ResilienceRecommendation,
  RiskLevel
} from '../types/TariffAnalysisTypes';
import SupplyChainResilienceAnalyzer from './SupplyChainResilienceAnalyzer';

/**
 * UIConsistencyAdapter ensures all data transformations from the SupplyChainResilienceAnalyzer
 * produce identical visualization output regardless of device or browser
 */
export class UIConsistencyAdapter {
  private analyzer: SupplyChainResilienceAnalyzer;
  
  constructor(analyzer: SupplyChainResilienceAnalyzer) {
    this.analyzer = analyzer;
  }
  
  /**
   * Format heatmap data for consistent visualization
   * @param data Regional heatmap data
   */
  formatHeatmapData(data: RegionalHeatmapEntry[]): any {
    // Pre-process data to ensure identical visualization regardless of device
    return data.map(entry => ({
      ...entry,
      // Normalize values to ensure consistent rendering
      normalizedScore: Number(entry.resilienceScore.toFixed(2)),
      // Pre-compute color values instead of letting the renderer decide
      colorValue: this.getFixedColorValue(entry.resilienceScore),
      // Standardize risk level display
      standardizedRiskLevels: {
        tariff: this.standardizeRiskLevel(entry.tariffRiskLevel),
        geopolitical: this.standardizeRiskLevel(entry.geopoliticalRiskLevel),
        transitTime: this.standardizeRiskLevel(entry.transitTimeRisk)
      }
    }));
  }
  
  /**
   * Format vulnerability hotspot data for consistent visualization
   * @param hotspots Vulnerability hotspot data
   */
  formatHotspotData(hotspots: VulnerabilityHotspot[]): any {
    return hotspots.map(hotspot => ({
      ...hotspot,
      // Normalize score values
      normalizedScore: Number(hotspot.vulnerabilityScore.toFixed(1)),
      // Pre-compute risk classification
      riskClassification: this.classifyRisk(hotspot.vulnerabilityScore),
      // Normalize production impact value
      normalizedImpact: Number(hotspot.impactOnProductionValue.toFixed(2)),
      // Format time to disruption consistently
      formattedTimeToDisruption: `${Math.round(hotspot.timeToDisruptionDays)} days`,
      // Sort alternative sources consistently
      alternativeSources: [...hotspot.alternativeSources].sort((a, b) => 
        b.viabilityScore - a.viabilityScore
      ).map(source => ({
        ...source,
        normalizedViabilityScore: Number(source.viabilityScore.toFixed(1)),
        formattedTimeframes: {
          best: `${source.implementationTimeframes.best} days`,
          expected: `${source.implementationTimeframes.expected} days`,
          worst: `${source.implementationTimeframes.worst} days`
        }
      }))
    }));
  }
  
  /**
   * Format recommendation data for consistent visualization
   * @param recommendations Resilience recommendations
   */
  formatRecommendationData(recommendations: ResilienceRecommendation[]): any {
    return recommendations.map(recommendation => ({
      ...recommendation,
      // Sort by priority consistently
      priorityValue: this.getPriorityValue(recommendation.priority),
      // Normalize impact value
      normalizedImpact: Number(recommendation.expectedImpact.toFixed(1)),
      // Standardize timeframe display
      standardizedTimeframe: this.standardizeTimeframe(recommendation.timeframe),
      // Convert investment level to numeric value for consistent sorting
      investmentValue: this.getInvestmentValue(recommendation.investmentRequired)
    }));
  }
  
  /**
   * Get a fixed color value for a resilience score
   * @param score Resilience score
   */
  private getFixedColorValue(score: number): string {
    // Fixed color mapping that will be identical across platforms
    const colors = [
      '#1a237e', '#283593', '#303f9f', '#3949ab', '#3f51b5',
      '#5c6bc0', '#7986cb', '#9fa8da', '#c5cae9', '#e8eaf6'
    ];
    const index = Math.min(Math.floor(score), 9);
    return colors[index];
  }
  
  /**
   * Standardize risk level display
   * @param risk Risk level
   */
  private standardizeRiskLevel(risk: RiskLevel): { value: number; color: string; label: string } {
    switch (risk) {
      case 'low':
        return { value: 1, color: '#4caf50', label: 'Low' };
      case 'medium':
        return { value: 2, color: '#ffc107', label: 'Medium' };
      case 'high':
        return { value: 3, color: '#ff9800', label: 'High' };
      case 'critical':
        return { value: 4, color: '#f44336', label: 'Critical' };
      default:
        return { value: 0, color: '#9e9e9e', label: 'Unknown' };
    }
  }
  
  /**
   * Classify risk based on vulnerability score
   * @param score Vulnerability score
   */
  private classifyRisk(score: number): { level: RiskLevel; color: string } {
    if (score < 3) {
      return { level: 'low', color: '#4caf50' };
    } else if (score < 5) {
      return { level: 'medium', color: '#ffc107' };
    } else if (score < 8) {
      return { level: 'high', color: '#ff9800' };
    } else {
      return { level: 'critical', color: '#f44336' };
    }
  }
  
  /**
   * Get priority value for consistent sorting
   * @param priority Priority level
   */
  private getPriorityValue(priority: RiskLevel): number {
    switch (priority) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }
  
  /**
   * Standardize timeframe display
   * @param timeframe Timeframe string
   */
  private standardizeTimeframe(timeframe: string): { value: number; label: string } {
    if (timeframe.includes('immediate')) {
      return { value: 1, label: 'Immediate (0-7 days)' };
    } else if (timeframe.includes('short')) {
      return { value: 2, label: 'Short-term (1-4 weeks)' };
    } else if (timeframe.includes('medium')) {
      return { value: 3, label: 'Medium-term (1-3 months)' };
    } else if (timeframe.includes('long')) {
      return { value: 4, label: 'Long-term (3+ months)' };
    } else {
      return { value: 0, label: timeframe };
    }
  }
  
  /**
   * Get investment value for consistent sorting
   * @param investment Investment level
   */
  private getInvestmentValue(investment: string): number {
    switch (investment) {
      case 'minimal': return 1;
      case 'moderate': return 2;
      case 'substantial': return 3;
      default: return 0;
    }
  }
}

export default UIConsistencyAdapter;
