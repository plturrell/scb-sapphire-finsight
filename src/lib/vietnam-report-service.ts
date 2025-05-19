/**
 * Vietnam Company Report Service
 * Extends the base report service with Vietnam-specific company data from RAG
 */

import reportService from './report-service';
import { vietnamCompanyRAG } from '../services/VietnamCompanyRAG';
import ragSystem from './rag-system';

export interface VietnamCompanyReportConfig {
  companyCode?: string;
  companyName?: string;
  reportType: 'company_profile' | 'financial_analysis' | 'tariff_impact' | 'market_comparison';
  period?: string;
  includeFinancials?: boolean;
  includeTariffAnalysis?: boolean;
  includeCompetitors?: boolean;
}

export interface VietnamCompanyReport {
  companyCode: string;
  companyName: string;
  reportType: string;
  sections: Array<{
    title: string;
    content: string;
    data?: any;
  }>;
  financialData?: {
    revenue: number;
    exports: number;
    imports: number;
    currency: string;
  };
  tariffAnalysis?: {
    impact: number;
    recommendations: string[];
  };
  metadata: {
    generatedAt: string;
    sources: string[];
    confidence: number;
  };
}

class VietnamReportService {
  /**
   * Generate a comprehensive report for a Vietnam company
   */
  async generateVietnamCompanyReport(config: VietnamCompanyReportConfig): Promise<VietnamCompanyReport> {
    console.log(`Generating Vietnam company report: ${config.companyCode || config.companyName}`);
    
    try {
      // Step 1: Query RAG for company data
      const query = config.companyCode 
        ? `Vietnam company ${config.companyCode} ${config.reportType}`
        : `Vietnam company ${config.companyName} ${config.reportType}`;
        
      const ragResults = await vietnamCompanyRAG.queryCompanies(query, 10);
      
      if (ragResults.length === 0) {
        throw new Error(`No data found for company: ${config.companyCode || config.companyName}`);
      }

      // Step 2: Extract company information from RAG results
      const companyData = await this.extractCompanyData(ragResults);
      
      // Step 3: Generate report sections based on type
      const sections = await this.generateReportSections(config, companyData, ragResults);
      
      // Step 4: Get financial data if requested
      let financialData;
      if (config.includeFinancials) {
        financialData = await this.getFinancialData(companyData.companyCode);
      }
      
      // Step 5: Get tariff analysis if requested
      let tariffAnalysis;
      if (config.includeTariffAnalysis) {
        tariffAnalysis = await this.getTariffAnalysis(companyData.companyCode);
      }
      
      // Step 6: Assemble the report
      const report: VietnamCompanyReport = {
        companyCode: companyData.companyCode,
        companyName: companyData.companyName,
        reportType: config.reportType,
        sections,
        financialData,
        tariffAnalysis,
        metadata: {
          generatedAt: new Date().toISOString(),
          sources: ragResults.map(r => r.metadata.source),
          confidence: this.calculateConfidence(ragResults)
        }
      };
      
      return report;
      
    } catch (error) {
      console.error('Error generating Vietnam company report:', error);
      throw error;
    }
  }

  /**
   * Generate company comparison report
   */
  async generateComparisonReport(companyCodes: string[]): Promise<VietnamCompanyReport> {
    console.log(`Generating comparison report for companies: ${companyCodes.join(', ')}`);
    
    try {
      const companyReports = [];
      
      // Get data for each company
      for (const code of companyCodes) {
        const query = `Vietnam company ${code} financial data`;
        const results = await vietnamCompanyRAG.queryCompanies(query, 5);
        if (results.length > 0) {
          companyReports.push({
            code,
            data: await this.extractCompanyData(results)
          });
        }
      }
      
      // Generate comparison sections
      const sections = [
        {
          title: 'Executive Summary',
          content: this.generateComparisonSummary(companyReports)
        },
        {
          title: 'Financial Metrics Comparison',
          content: this.generateFinancialComparison(companyReports),
          data: this.extractFinancialMetrics(companyReports)
        },
        {
          title: 'Market Position Analysis',
          content: this.generateMarketAnalysis(companyReports)
        },
        {
          title: 'Trade Performance',
          content: this.generateTradeAnalysis(companyReports)
        }
      ];
      
      return {
        companyCode: companyCodes.join('_'),
        companyName: 'Multiple Companies',
        reportType: 'comparison',
        sections,
        metadata: {
          generatedAt: new Date().toISOString(),
          sources: ['Capital IQ', 'RAG System'],
          confidence: 0.85
        }
      };
      
    } catch (error) {
      console.error('Error generating comparison report:', error);
      throw error;
    }
  }

  /**
   * Extract company data from RAG results
   */
  private async extractCompanyData(ragResults: any[]): Promise<any> {
    const firstResult = ragResults[0];
    const metadata = firstResult.metadata;
    const content = firstResult.pageContent;
    
    // Parse content to extract key information
    const companyData = {
      companyCode: metadata.company_code || 'Unknown',
      companyName: metadata.company_name || 'Unknown Company',
      industry: metadata.industry || 'Unknown',
      province: metadata.province || 'Unknown',
      status: metadata.listing_status || 'Unknown'
    };
    
    // Extract additional fields from content
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.includes('Annual Revenue:')) {
        const match = line.match(/Annual Revenue:\s*([0-9,]+)\s*(\w+)/);
        if (match) {
          companyData['revenue'] = parseFloat(match[1].replace(/,/g, ''));
          companyData['revenueCurrency'] = match[2];
        }
      }
      if (line.includes('Export Value:')) {
        const match = line.match(/Export Value:\s*([0-9,]+)\s*(\w+)/);
        if (match) {
          companyData['exportValue'] = parseFloat(match[1].replace(/,/g, ''));
          companyData['exportCurrency'] = match[2];
        }
      }
    }
    
    return companyData;
  }

  /**
   * Generate report sections based on report type
   */
  private async generateReportSections(
    config: VietnamCompanyReportConfig, 
    companyData: any,
    ragResults: any[]
  ): Promise<any[]> {
    const sections = [];
    
    switch (config.reportType) {
      case 'company_profile':
        sections.push(
          {
            title: 'Company Overview',
            content: this.generateCompanyOverview(companyData, ragResults)
          },
          {
            title: 'Business Operations',
            content: this.generateBusinessOperations(companyData, ragResults)
          },
          {
            title: 'Financial Summary',
            content: this.generateFinancialSummary(companyData)
          }
        );
        break;
        
      case 'financial_analysis':
        sections.push(
          {
            title: 'Financial Performance',
            content: this.generateFinancialPerformance(companyData)
          },
          {
            title: 'Revenue Analysis',
            content: this.generateRevenueAnalysis(companyData)
          },
          {
            title: 'International Trade',
            content: this.generateTradeAnalysis([{code: companyData.companyCode, data: companyData}])
          }
        );
        break;
        
      case 'tariff_impact':
        sections.push(
          {
            title: 'Tariff Environment',
            content: await this.generateTariffEnvironment(companyData)
          },
          {
            title: 'Impact Assessment',
            content: await this.generateImpactAssessment(companyData)
          },
          {
            title: 'Recommendations',
            content: await this.generateTariffRecommendations(companyData)
          }
        );
        break;
        
      case 'market_comparison':
        sections.push(
          {
            title: 'Market Position',
            content: this.generateMarketPosition(companyData)
          },
          {
            title: 'Competitive Analysis',
            content: await this.generateCompetitiveAnalysis(companyData)
          },
          {
            title: 'Growth Opportunities',
            content: this.generateGrowthOpportunities(companyData)
          }
        );
        break;
    }
    
    return sections;
  }

  // Helper methods for generating content
  private generateCompanyOverview(companyData: any, ragResults: any[]): string {
    return `
${companyData.companyName} (${companyData.companyCode}) is a ${companyData.industry} company based in ${companyData.province}, Vietnam.

Status: ${companyData.status}
Industry: ${companyData.industry}
Location: ${companyData.province}

${ragResults[0].pageContent.split('\n').slice(0, 5).join('\n')}
    `.trim();
  }

  private generateBusinessOperations(companyData: any, ragResults: any[]): string {
    const content = ragResults[0].pageContent;
    const exportMatch = content.match(/Main Export Products:\s*(.+)/);
    const importMatch = content.match(/Main Import Products:\s*(.+)/);
    const partnersMatch = content.match(/Trading Partners:\s*(.+)/);
    
    return `
## Business Operations

### Export Products
${exportMatch ? exportMatch[1] : 'No export data available'}

### Import Products
${importMatch ? importMatch[1] : 'No import data available'}

### Trading Partners
${partnersMatch ? partnersMatch[1] : 'No trading partner data available'}
    `.trim();
  }

  private generateFinancialSummary(companyData: any): string {
    return `
## Financial Summary

Annual Revenue: ${this.formatCurrency(companyData.revenue, companyData.revenueCurrency)}
Export Value: ${this.formatCurrency(companyData.exportValue, companyData.exportCurrency)}

The company has demonstrated strong financial performance in its core markets.
    `.trim();
  }

  private generateFinancialPerformance(companyData: any): string {
    return `
## Financial Performance Analysis

${companyData.companyName} reported annual revenue of ${this.formatCurrency(companyData.revenue, companyData.revenueCurrency)}.

Key Financial Metrics:
- Revenue: ${this.formatCurrency(companyData.revenue, companyData.revenueCurrency)}
- Export Value: ${this.formatCurrency(companyData.exportValue, companyData.exportCurrency)}
- Industry: ${companyData.industry}
    `.trim();
  }

  private generateRevenueAnalysis(companyData: any): string {
    return `
## Revenue Analysis

The company's revenue streams are diversified across domestic and international markets.

Export Performance:
- Total Export Value: ${this.formatCurrency(companyData.exportValue, companyData.exportCurrency)}
- Export as % of Revenue: ${((companyData.exportValue / companyData.revenue) * 100).toFixed(1)}%
    `.trim();
  }

  private generateComparisonSummary(companyReports: any[]): string {
    const companies = companyReports.map(r => r.data.companyName).join(', ');
    return `This report compares ${companyReports.length} Vietnamese companies: ${companies}`;
  }

  private generateFinancialComparison(companyReports: any[]): string {
    let comparison = '## Financial Metrics Comparison\n\n';
    
    for (const report of companyReports) {
      const data = report.data;
      comparison += `### ${data.companyName} (${data.companyCode})\n`;
      comparison += `- Revenue: ${this.formatCurrency(data.revenue, data.revenueCurrency)}\n`;
      comparison += `- Exports: ${this.formatCurrency(data.exportValue, data.exportCurrency)}\n\n`;
    }
    
    return comparison;
  }

  private extractFinancialMetrics(companyReports: any[]): any {
    return companyReports.map(report => ({
      company: report.data.companyName,
      revenue: report.data.revenue,
      exports: report.data.exportValue,
      currency: report.data.revenueCurrency
    }));
  }

  // Additional async methods for enhanced functionality
  private async generateTariffEnvironment(companyData: any): Promise<string> {
    // Query RAG for tariff information
    const query = `Vietnam tariff ${companyData.industry} sector analysis`;
    const results = await ragSystem.retrieveRelevantDocuments(query, 3);
    
    return `
## Current Tariff Environment

The ${companyData.industry} sector in Vietnam faces evolving tariff policies.

${results.length > 0 ? results[0].pageContent.substring(0, 500) : 'No specific tariff data available.'}
    `.trim();
  }

  private async generateImpactAssessment(companyData: any): Promise<string> {
    return `
## Tariff Impact Assessment

Based on ${companyData.companyName}'s export profile, tariff changes could significantly impact:
- Export competitiveness in key markets
- Input costs for imported materials
- Overall profit margins
    `.trim();
  }

  private async generateTariffRecommendations(companyData: any): Promise<string> {
    return `
## Strategic Recommendations

1. Diversify export markets to reduce tariff exposure
2. Consider local sourcing for imported materials
3. Monitor RCEP implementation for potential benefits
4. Engage in forward contracts to hedge against tariff volatility
    `.trim();
  }

  private async generateCompetitiveAnalysis(companyData: any): Promise<string> {
    return `
## Competitive Analysis

${companyData.companyName} operates in the competitive ${companyData.industry} sector.

Market Position:
- Strong presence in ${companyData.province}
- Export capabilities to multiple markets
- Established trading relationships
    `.trim();
  }

  private generateMarketPosition(companyData: any): string {
    return `${companyData.companyName} holds a significant position in the ${companyData.industry} sector in Vietnam.`;
  }

  private generateMarketAnalysis(companyReports: any[]): string {
    return 'Market analysis indicates varied positioning across sectors and regions.';
  }

  private generateGrowthOpportunities(companyData: any): string {
    return `
## Growth Opportunities

1. Expand into emerging ASEAN markets
2. Leverage RCEP trade agreements
3. Invest in digital transformation
4. Develop sustainable product lines
    `.trim();
  }

  // Utility methods
  private formatCurrency(amount?: number, currency?: string): string {
    if (!amount) return 'N/A';
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });

    return formatter.format(amount);
  }

  private calculateConfidence(ragResults: any[]): number {
    if (ragResults.length === 0) return 0;
    
    const avgRelevance = ragResults.reduce((sum, result) => {
      return sum + (result.metadata.relevance_score || 0.5);
    }, 0) / ragResults.length;
    
    return Math.min(avgRelevance, 0.95);
  }

  private async getFinancialData(companyCode: string): Promise<any> {
    const financialData = await vietnamCompanyRAG.getCompanyFinancialData(companyCode);
    
    if (!financialData) {
      return undefined;
    }
    
    return {
      revenue: financialData.AnnualRevenue || 0,
      exports: financialData.ExportValue || 0,
      imports: financialData.ImportValue || 0,
      currency: financialData.AnnualRevenueCurrency || 'VND'
    };
  }

  private async getTariffAnalysis(companyCode: string): Promise<any> {
    // This would integrate with the tariff analysis system
    return {
      impact: 0.05, // 5% impact
      recommendations: [
        'Monitor RCEP implementation',
        'Diversify export markets',
        'Consider local sourcing'
      ]
    };
  }
}

// Export singleton instance
export const vietnamReportService = new VietnamReportService();