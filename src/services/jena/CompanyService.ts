/**
 * Company Service
 * Provides functionality to retrieve and manage company data from Jena
 */

import jenaClient, { SparqlResults } from './JenaClient';
import { langGraphService } from '../langgraph';

/**
 * Company data interface
 */
export interface CompanyData {
  id: string;
  name: string;
  ticker?: string;
  description?: string;
  industry?: string;
  sector?: string;
  foundedYear?: number;
  headquarters?: string;
  employees?: number;
  ceo?: string;
  financials?: {
    revenue?: { value: number; currency: string; period?: string; year?: number };
    marketCap?: { value: number; currency: string };
    peRatio?: number;
    profitMargin?: number;
  };
  products?: string[];
  competitors?: string[];
  recentNews?: {
    headline: string;
    summary: string;
    date: string;
  }[];
  analysisResults?: {
    recommendation?: string;
    targetPrice?: string;
    confidenceLevel?: string;
    strengths?: string[];
    weaknesses?: string[];
    lastUpdated?: string;
  };
}

/**
 * Company search result interface
 */
export interface CompanySearchResult {
  id: string;
  name: string;
  ticker?: string;
  industry?: string;
  sector?: string;
  relevance?: number;
}

/**
 * Company service for interacting with company data
 */
export class CompanyService {
  /**
   * Search for companies by name, ticker, or description
   */
  public async searchCompanies(
    searchTerm: string,
    options?: {
      limit?: number;
      offset?: number;
      industry?: string;
      sector?: string;
    }
  ): Promise<CompanySearchResult[]> {
    const limit = options?.limit || 10;
    const offset = options?.offset || 0;
    
    try {
      // Construct SPARQL query for searching companies
      let query = `
        PREFIX scb: <http://scb.com/ontology#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
        SELECT ?id ?name ?ticker ?industry ?sector
        WHERE {
          ?id a scb:Company ;
               scb:hasName ?name .
          OPTIONAL { ?id scb:hasTicker ?ticker }
          OPTIONAL { ?id scb:hasIndustry ?industry }
          OPTIONAL { ?id scb:hasSector ?sector }
          
          FILTER(
            CONTAINS(LCASE(?name), LCASE("${searchTerm}")) ||
            CONTAINS(LCASE(?ticker), LCASE("${searchTerm}"))
          )
      `;
      
      // Add industry filter if specified
      if (options?.industry) {
        query += `
          FILTER(CONTAINS(LCASE(?industry), LCASE("${options.industry}")))
        `;
      }
      
      // Add sector filter if specified
      if (options?.sector) {
        query += `
          FILTER(CONTAINS(LCASE(?sector), LCASE("${options.sector}")))
        `;
      }
      
      // Close the query and add limit/offset
      query += `
        }
        ORDER BY ?name
        LIMIT ${limit}
        OFFSET ${offset}
      `;
      
      // Execute the query
      const result = await jenaClient.select(query);
      
      // Transform SPARQL results to CompanySearchResult
      return this.transformSearchResults(result);
    } catch (error) {
      console.error('Error searching companies:', error);
      
      // If Jena query fails, attempt to get data via LangGraph/Perplexity
      console.log('Falling back to Perplexity for company search');
      return this.fallbackSearchCompanies(searchTerm, options);
    }
  }
  
  /**
   * Get detailed company data by ID
   */
  public async getCompanyById(id: string): Promise<CompanyData | null> {
    try {
      // Construct SPARQL query for getting company by ID
      const query = `
        PREFIX scb: <http://scb.com/ontology#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
        SELECT *
        WHERE {
          <${id}> a scb:Company ;
                scb:hasName ?name .
          OPTIONAL { <${id}> scb:hasTicker ?ticker }
          OPTIONAL { <${id}> scb:hasDescription ?description }
          OPTIONAL { <${id}> scb:hasIndustry ?industry }
          OPTIONAL { <${id}> scb:hasSector ?sector }
          OPTIONAL { <${id}> scb:hasFoundedYear ?foundedYear }
          OPTIONAL { <${id}> scb:hasHeadquarters ?headquarters }
          OPTIONAL { <${id}> scb:hasEmployees ?employees }
          OPTIONAL { <${id}> scb:hasCEO ?ceo }
          
          # Financial data
          OPTIONAL {
            <${id}> scb:hasFinancial ?financial .
            ?financial a scb:Financial .
            OPTIONAL { ?financial scb:hasRevenue ?revenue }
            OPTIONAL { ?financial scb:hasMarketCap ?marketCap }
            OPTIONAL { ?financial scb:hasPERatio ?peRatio }
            OPTIONAL { ?financial scb:hasProfitMargin ?profitMargin }
          }
          
          # Products
          OPTIONAL {
            <${id}> scb:hasProduct ?product
          }
          
          # Competitors
          OPTIONAL {
            <${id}> scb:hasCompetitor ?competitor
          }
          
          # Recent news
          OPTIONAL {
            <${id}> scb:hasNews ?news .
            ?news scb:hasHeadline ?newsHeadline ;
                 scb:hasSummary ?newsSummary ;
                 scb:hasDate ?newsDate .
          }
          
          # Analysis results
          OPTIONAL {
            <${id}> scb:hasAnalysis ?analysis .
            ?analysis a scb:InvestmentAnalysis .
            OPTIONAL { ?analysis scb:hasRecommendation ?recommendation }
            OPTIONAL { ?analysis scb:hasTargetPrice ?targetPrice }
            OPTIONAL { ?analysis scb:hasConfidenceLevel ?confidenceLevel }
            OPTIONAL { ?analysis scb:hasLastUpdated ?analysisDate }
          }
        }
      `;
      
      // Execute the query
      const result = await jenaClient.select(query);
      
      // Transform SPARQL results to CompanyData
      const company = this.transformCompanyResult(result, id);
      return company;
    } catch (error) {
      console.error('Error getting company by ID:', error);
      
      // If Jena query fails, attempt to get data via LangGraph/Perplexity
      console.log('Falling back to Perplexity for company details');
      return this.fallbackGetCompanyByName(this.extractNameFromId(id));
    }
  }
  
  /**
   * Get company data by name
   */
  public async getCompanyByName(name: string): Promise<CompanyData | null> {
    try {
      // Construct SPARQL query for getting company by name
      const query = `
        PREFIX scb: <http://scb.com/ontology#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
        SELECT ?id
        WHERE {
          ?id a scb:Company ;
              scb:hasName ?name .
          FILTER(LCASE(?name) = LCASE("${name}"))
        }
        LIMIT 1
      `;
      
      // Execute the query
      const result = await jenaClient.select(query);
      
      // Check if we found a company
      if (result.results.bindings.length === 0) {
        // If not found in Jena, try fallback
        return this.fallbackGetCompanyByName(name);
      }
      
      // Get the company ID
      const id = result.results.bindings[0].id.value;
      
      // Get detailed company data
      return this.getCompanyById(id);
    } catch (error) {
      console.error('Error getting company by name:', error);
      
      // If Jena query fails, fall back to Perplexity
      return this.fallbackGetCompanyByName(name);
    }
  }
  
  /**
   * Get company financial metrics
   */
  public async getCompanyFinancials(id: string): Promise<any> {
    try {
      // Construct SPARQL query for getting company financials
      const query = `
        PREFIX scb: <http://scb.com/ontology#>
        
        SELECT *
        WHERE {
          <${id}> scb:hasFinancial ?financial .
          ?financial a scb:Financial .
          OPTIONAL { ?financial scb:hasRevenue ?revenue }
          OPTIONAL { ?financial scb:hasMarketCap ?marketCap }
          OPTIONAL { ?financial scb:hasPERatio ?peRatio }
          OPTIONAL { ?financial scb:hasProfitMargin ?profitMargin }
          OPTIONAL { ?financial scb:hasEPS ?eps }
          OPTIONAL { ?financial scb:hasDividendYield ?dividendYield }
          OPTIONAL { ?financial scb:hasDebtToEquity ?debtToEquity }
          OPTIONAL { ?financial scb:hasROE ?roe }
          OPTIONAL { ?financial scb:hasROA ?roa }
          OPTIONAL { ?financial scb:hasQuarterlyGrowth ?quarterlyGrowth }
          OPTIONAL { ?financial scb:hasYearlyGrowth ?yearlyGrowth }
          OPTIONAL { ?financial scb:hasLastUpdated ?lastUpdated }
        }
      `;
      
      // Execute the query
      const result = await jenaClient.select(query);
      
      // Transform SPARQL results to financial data
      return this.transformFinancialResult(result);
    } catch (error) {
      console.error('Error getting company financials:', error);
      
      // If Jena query fails, fall back to Perplexity
      const companyName = this.extractNameFromId(id);
      return this.fallbackGetCompanyFinancials(companyName);
    }
  }
  
  /**
   * Refresh company data by triggering the LangGraph pipeline
   */
  public async refreshCompanyData(companyName: string): Promise<{ success: boolean; message: string }> {
    try {
      // Trigger LangGraph pipeline to refresh company data
      const pipelineResult = await langGraphService.processCompanyData(companyName);
      
      if (pipelineResult.status === 'completed') {
        return {
          success: true,
          message: `Successfully refreshed data for ${companyName}`,
        };
      } else {
        return {
          success: false,
          message: `Failed to refresh data for ${companyName}: ${pipelineResult.error || 'Unknown error'}`,
        };
      }
    } catch (error) {
      console.error('Error refreshing company data:', error);
      return {
        success: false,
        message: `Error refreshing data for ${companyName}: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
  
  /**
   * Transform SPARQL search results to CompanySearchResult objects
   */
  private transformSearchResults(result: SparqlResults): CompanySearchResult[] {
    const companies: CompanySearchResult[] = [];
    
    for (const binding of result.results.bindings) {
      companies.push({
        id: binding.id.value,
        name: binding.name.value,
        ticker: binding.ticker?.value,
        industry: binding.industry?.value,
        sector: binding.sector?.value,
      });
    }
    
    return companies;
  }
  
  /**
   * Transform SPARQL company result to CompanyData object
   */
  private transformCompanyResult(result: SparqlResults, id: string): CompanyData | null {
    if (result.results.bindings.length === 0) {
      return null;
    }
    
    // Extract basic company information from the first binding
    const binding = result.results.bindings[0];
    
    const company: CompanyData = {
      id,
      name: binding.name.value,
    };
    
    // Add optional fields if they exist
    if (binding.ticker) company.ticker = binding.ticker.value;
    if (binding.description) company.description = binding.description.value;
    if (binding.industry) company.industry = binding.industry.value;
    if (binding.sector) company.sector = binding.sector.value;
    if (binding.foundedYear) company.foundedYear = parseInt(binding.foundedYear.value);
    if (binding.headquarters) company.headquarters = binding.headquarters.value;
    if (binding.employees) company.employees = parseInt(binding.employees.value);
    if (binding.ceo) company.ceo = binding.ceo.value;
    
    // Extract financial data
    company.financials = {};
    if (binding.revenue) {
      company.financials.revenue = { 
        value: parseFloat(binding.revenue.value),
        currency: 'USD',
      };
    }
    if (binding.marketCap) {
      company.financials.marketCap = { 
        value: parseFloat(binding.marketCap.value),
        currency: 'USD',
      };
    }
    if (binding.peRatio) company.financials.peRatio = parseFloat(binding.peRatio.value);
    if (binding.profitMargin) company.financials.profitMargin = parseFloat(binding.profitMargin.value);
    
    // Extract products (may be multiple bindings)
    company.products = [];
    for (const b of result.results.bindings) {
      if (b.product && !company.products.includes(b.product.value)) {
        company.products.push(b.product.value);
      }
    }
    
    // Extract competitors (may be multiple bindings)
    company.competitors = [];
    for (const b of result.results.bindings) {
      if (b.competitor && !company.competitors.includes(b.competitor.value)) {
        company.competitors.push(b.competitor.value);
      }
    }
    
    // Extract recent news (may be multiple bindings)
    company.recentNews = [];
    const processedNews = new Set<string>();
    
    for (const b of result.results.bindings) {
      if (b.newsHeadline && b.newsSummary && b.newsDate) {
        const newsKey = `${b.newsHeadline.value}-${b.newsDate.value}`;
        
        if (!processedNews.has(newsKey)) {
          company.recentNews.push({
            headline: b.newsHeadline.value,
            summary: b.newsSummary.value,
            date: b.newsDate.value,
          });
          
          processedNews.add(newsKey);
        }
      }
    }
    
    // Extract analysis results if available
    if (binding.recommendation || binding.targetPrice || binding.confidenceLevel) {
      company.analysisResults = {};
      
      if (binding.recommendation) company.analysisResults.recommendation = binding.recommendation.value;
      if (binding.targetPrice) company.analysisResults.targetPrice = binding.targetPrice.value;
      if (binding.confidenceLevel) company.analysisResults.confidenceLevel = binding.confidenceLevel.value;
      if (binding.analysisDate) company.analysisResults.lastUpdated = binding.analysisDate.value;
    }
    
    return company;
  }
  
  /**
   * Transform SPARQL financial result to a financial data object
   */
  private transformFinancialResult(result: SparqlResults): any {
    if (result.results.bindings.length === 0) {
      return {};
    }
    
    const binding = result.results.bindings[0];
    const financials: any = {};
    
    // Add financial metrics if they exist
    if (binding.revenue) financials.revenue = parseFloat(binding.revenue.value);
    if (binding.marketCap) financials.marketCap = parseFloat(binding.marketCap.value);
    if (binding.peRatio) financials.peRatio = parseFloat(binding.peRatio.value);
    if (binding.profitMargin) financials.profitMargin = parseFloat(binding.profitMargin.value);
    if (binding.eps) financials.eps = parseFloat(binding.eps.value);
    if (binding.dividendYield) financials.dividendYield = parseFloat(binding.dividendYield.value);
    if (binding.debtToEquity) financials.debtToEquity = parseFloat(binding.debtToEquity.value);
    if (binding.roe) financials.roe = parseFloat(binding.roe.value);
    if (binding.roa) financials.roa = parseFloat(binding.roa.value);
    if (binding.quarterlyGrowth) financials.quarterlyGrowth = parseFloat(binding.quarterlyGrowth.value);
    if (binding.yearlyGrowth) financials.yearlyGrowth = parseFloat(binding.yearlyGrowth.value);
    if (binding.lastUpdated) financials.lastUpdated = binding.lastUpdated.value;
    
    return financials;
  }
  
  /**
   * Extract company name from ID
   */
  private extractNameFromId(id: string): string {
    // Extract company name from ID like "company:apple" -> "Apple"
    const parts = id.split(':');
    if (parts.length >= 2) {
      return parts[1].replace(/_/g, ' ');
    }
    return id;
  }
  
  /**
   * Fallback method to search companies using Perplexity
   */
  private async fallbackSearchCompanies(
    searchTerm: string,
    options?: {
      limit?: number;
      offset?: number;
      industry?: string;
      sector?: string;
    }
  ): Promise<CompanySearchResult[]> {
    try {
      // Trigger the company pipeline to get data
      const pipelineResult = await langGraphService.processCompanyData(searchTerm);
      
      if (pipelineResult.status !== 'completed' || !pipelineResult.outputs) {
        return [];
      }
      
      // Create a search result from the pipeline output
      const companyData = pipelineResult.outputs;
      const searchResult: CompanySearchResult = {
        id: `company:${companyData.name.replace(/\s+/g, '_').toLowerCase()}`,
        name: companyData.name,
        ticker: companyData.ticker,
        industry: companyData.industry,
        sector: companyData.sector,
        relevance: 1.0,
      };
      
      return [searchResult];
    } catch (error) {
      console.error('Error in fallback company search:', error);
      return [];
    }
  }
  
  /**
   * Fallback method to get company by name using Perplexity
   */
  private async fallbackGetCompanyByName(name: string): Promise<CompanyData | null> {
    try {
      // Trigger the company pipeline to get data
      const pipelineResult = await langGraphService.processCompanyData(name);
      
      if (pipelineResult.status !== 'completed' || !pipelineResult.outputs) {
        return null;
      }
      
      // Extract company data from pipeline output
      const companyData = pipelineResult.outputs;
      
      // Create a CompanyData object
      const company: CompanyData = {
        id: `company:${companyData.name.replace(/\s+/g, '_').toLowerCase()}`,
        name: companyData.name,
      };
      
      // Add fields from the pipeline output
      if (companyData.ticker) company.ticker = companyData.ticker;
      if (companyData.description) company.description = companyData.description;
      if (companyData.industry) company.industry = companyData.industry;
      if (companyData.sector) company.sector = companyData.sector;
      if (companyData.foundedYear) company.foundedYear = companyData.foundedYear;
      if (companyData.headquarters) company.headquarters = companyData.headquarters;
      if (companyData.employees) company.employees = companyData.employees;
      if (companyData.ceo) company.ceo = companyData.ceo;
      
      // Add financials if available
      if (companyData.financials) {
        company.financials = {};
        
        if (companyData.financials.revenue) {
          company.financials.revenue = companyData.financials.revenue;
        }
        
        if (companyData.financials.marketCap) {
          company.financials.marketCap = companyData.financials.marketCap;
        }
        
        if (companyData.financials.peRatio) {
          company.financials.peRatio = companyData.financials.peRatio;
        }
        
        if (companyData.financials.profitMargin) {
          company.financials.profitMargin = companyData.financials.profitMargin;
        }
      }
      
      // Add products if available
      if (companyData.products && Array.isArray(companyData.products)) {
        company.products = companyData.products;
      }
      
      // Add competitors if available
      if (companyData.competitors && Array.isArray(companyData.competitors)) {
        company.competitors = companyData.competitors;
      }
      
      // Add recent news if available
      if (companyData.recentNews && Array.isArray(companyData.recentNews)) {
        company.recentNews = companyData.recentNews.map((news: any) => ({
          headline: news.headline,
          summary: news.summary,
          date: news.date,
        }));
      }
      
      return company;
    } catch (error) {
      console.error('Error in fallback get company:', error);
      return null;
    }
  }
  
  /**
   * Fallback method to get company financials using Perplexity
   */
  private async fallbackGetCompanyFinancials(companyName: string): Promise<any> {
    try {
      // Use the fallback get company method and extract financials
      const company = await this.fallbackGetCompanyByName(companyName);
      
      if (!company || !company.financials) {
        return {};
      }
      
      return company.financials;
    } catch (error) {
      console.error('Error in fallback get financials:', error);
      return {};
    }
  }
}

// Export a singleton instance for use throughout the application
export const companyService = new CompanyService();
export default companyService;