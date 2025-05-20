// Perplexity API for tariff data extraction
import { v4 as uuidv4 } from 'uuid';
import perplexityRateLimiter from '@/services/PerplexityRateLimiter';
import { TariffDataResponse, PolicyReference, SourceReference, TariffEntry } from '@/types/perplexity';

// Types for tariff data have been moved to /src/types/perplexity.ts

// Using our proxy endpoint instead of direct API call to avoid CORS issues
const PERPLEXITY_API_URL = '/api/perplexity-proxy';

// API models
const MODELS = {
  SMALL: 'mistral-7b-instruct',
  MEDIUM: 'mixtral-8x7b-instruct',
  LARGE: 'llama-2-70b-chat',
  DEFAULT: 'sonar'
};

// Retry configuration
const RETRY_DELAY = 1000;
const MAX_RETRIES = 2;

/**
 * Call Perplexity API with retries using our server-side proxy
 */
async function callPerplexityAPI(messages: Array<{role: string, content: string}>, model = MODELS.DEFAULT): Promise<string> {
  const request = {
    model: model,
    messages: messages,
    temperature: 0.2,
    top_p: 0.9,
    max_tokens: 2000,
    stream: false
  };

  let retries = 0;
  let lastError: Error | null = null;
  const startTime = Date.now();
  const endpoint = 'perplexity-proxy';
  let tokenUsage = 0;

  // Check if we can make a request based on rate limits
  if (!perplexityRateLimiter.canMakeRequest()) {
    const timeToWait = perplexityRateLimiter.getTimeToWaitMs();
    if (timeToWait > 0) {
      console.warn(`Rate limit reached for Perplexity API. Waiting ${timeToWait}ms before next request.`);
      await new Promise(resolve => setTimeout(resolve, timeToWait));
    }
  }

  while (retries <= MAX_RETRIES) {
    try {
      // Use our proxy API route instead of calling Perplexity directly
      // This avoids CORS issues
      const response = await fetch('/api/perplexity-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request),
        // Add error handling for network issues
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        // Try alternative model if the current one fails
        if (retries < MAX_RETRIES) {
          retries++;
          const fallbackModel = retries === 1 ? MODELS.MEDIUM : MODELS.SMALL;
          console.warn(`Perplexity API error (${response.status}), retrying with model: ${fallbackModel}`);
          request.model = fallbackModel;
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          continue;
        }
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      // Estimate token usage based on response
      tokenUsage = data.usage?.total_tokens || 
        // If usage is not available, estimate based on input/output length
        (JSON.stringify(messages).length / 4) + (data.choices[0]?.message?.content?.length || 0) / 4;

      // Record successful API call in rate limiter
      perplexityRateLimiter.recordRequest({
        endpoint,
        tokens: Math.round(tokenUsage),
        model: request.model,
        startTime,
        success: true
      });

      return data.choices[0]?.message?.content || '';
    } catch (error) {
      lastError = error as Error;
      if (retries < MAX_RETRIES) {
        retries++;
        const fallbackModel = retries === 1 ? MODELS.MEDIUM : MODELS.SMALL;
        console.warn(`Perplexity API error, retrying with model: ${fallbackModel}`, error);
        request.model = fallbackModel;
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      } else {
        // Record failed API call
        perplexityRateLimiter.recordRequest({
          endpoint,
          tokens: 0, // We don't know how many tokens were used in failed request
          model: request.model,
          startTime,
          success: false
        });
        break;
      }
    }
  }

  throw lastError || new Error('Failed to get response from Perplexity API');
}

/**
 * Extract JSON from a text response
 */
function extractJsonFromResponse(text: string): any {
  try {
    // First, try to parse the entire response as JSON
    try {
      return JSON.parse(text);
    } catch (e) {
      // If that fails, look for JSON object in the response
      const jsonMatch = text.match(/{[\s\S]*}/m);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If that fails, look for JSON array in the response
      const jsonArrayMatch = text.match(/\[\s*{[\s\S]*}\s*\]/m);
      
      if (jsonArrayMatch) {
        return JSON.parse(jsonArrayMatch[0]);
      }
    }
    
    // If no JSON found, return null
    return null;
  } catch (error) {
    console.error('Error extracting JSON from response:', error);
    return null;
  }
}

/**
 * Search for tariff information
 */
export async function searchTariffInformation({
  product,
  hsCode,
  sourceCountry,
  destinationCountry
}: {
  product?: string;
  hsCode?: string;
  sourceCountry?: string;
  destinationCountry?: string;
}): Promise<TariffDataResponse> {
  try {
    // Build a search query string based on the parameters
    let queryText = 'What are the current tariff rates';
    
    if (product) {
      queryText += ` for ${product}`;
    }
    
    if (hsCode) {
      queryText += ` (HS code ${hsCode})`;
    }
    
    if (sourceCountry) {
      queryText += ` from ${sourceCountry}`;
    }
    
    if (destinationCountry) {
      queryText += ` imported to ${destinationCountry}`;
    }
    
    queryText += '? Provide detailed information including rates, effective dates, and any special conditions or exemptions.';
    
    // Create a system prompt that requests structured output
    const systemPrompt = `You are a tariff data specialist providing accurate information about international trade tariffs. 
When asked about tariff information, provide a thorough analysis including current rates, relevant trade agreements, 
and key details in the following JSON format:

{
  "summary": "Brief overview of the tariff situation",
  "tariffs": [
    {
      "hsCode": "8471.30.00",
      "description": "Detailed product description",
      "sourceCountry": "Country of origin",
      "destinationCountry": "Importing country",
      "rate": 5.0,
      "currency": "USD or percentage",
      "effectiveDate": "2025-01-01",
      "expirationDate": "2026-01-01", (if applicable)
      "exemptions": ["List of exemptions"], (if applicable)
      "specialConditions": ["List of special conditions"], (if applicable)
      "confidence": 0.95 (your confidence in this information from 0 to 1)
    }
  ],
  "relatedPolicies": [
    {
      "name": "Policy or agreement name",
      "description": "Brief description of the policy",
      "countries": ["Countries involved"],
      "implementationDate": "2025-01-01",
      "url": "URL with more information if available",
      "relevance": 0.9 (relevance score from 0 to 1)
    }
  ],
  "sources": [
    {
      "title": "Source title",
      "url": "Source URL",
      "date": "Publication date",
      "reliability": 0.95 (reliability score from 0 to 1)
    }
  ]
}

Provide the most current and accurate information possible. If you're not confident about specific details, indicate lower confidence scores.`;
    
    // Create messages for the API call
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: queryText
      }
    ];
    
    // Call Perplexity API
    const responseText = await callPerplexityAPI(messages, MODELS.MEDIUM);
    
    // Parse the JSON response
    const jsonData = extractJsonFromResponse(responseText);
    
    if (jsonData && typeof jsonData === 'object') {
      // Construct the response
      const response: TariffDataResponse = {
        query: queryText,
        summary: jsonData.summary || 'No summary available',
        tariffs: jsonData.tariffs || [],
        relatedPolicies: jsonData.relatedPolicies || [],
        sources: jsonData.sources || [],
        timestamp: new Date().toISOString()
      };
      
      return response;
    }
    
    // If we couldn't parse structured data, create a simpler response
    console.warn('Failed to parse structured data from Perplexity response');
    
    return {
      query: queryText,
      summary: 'Failed to extract structured tariff data',
      tariffs: [],
      relatedPolicies: [],
      sources: [],
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error searching tariff information:', error);
    throw error;
  }
}

/**
 * Get recent tariff policy changes
 */
export async function getRecentTariffChanges({
  countries,
  timeframe = 30
}: {
  countries?: string[];
  timeframe?: number;
}): Promise<any> {
  try {
    // Build the query based on parameters
    let queryText = `What are the most significant tariff policy changes announced in the past ${timeframe} days`;
    
    if (countries && countries.length > 0) {
      queryText += ` in ${countries.join(', ')}`;
    } else {
      queryText += ' worldwide';
    }
    
    queryText += '? Focus on changes that could significantly impact international trade. Include details on the affected products, the nature of the changes, and implementation dates.';
    
    // Create a system prompt that requests structured output
    const systemPrompt = `You are a tariff policy analyst specializing in international trade. When asked about recent tariff changes, 
provide comprehensive information in the following JSON format:

{
  "summary": "Overview of recent tariff policy changes",
  "changes": [
    {
      "title": "Brief descriptive title of the change",
      "description": "Detailed description of the tariff change",
      "country": "Country implementing the change",
      "hsCode": "HS code if specific",
      "productCategories": ["List of affected product categories"],
      "oldRate": 5.0,
      "newRate": 7.5,
      "effectiveDate": "2025-05-01",
      "announcementDate": "2025-03-15",
      "impactLevel": "high|medium|low",
      "affectedCountries": ["List of affected trade partners"],
      "economicImpact": "Brief assessment of economic impact",
      "confidence": 0.9 (confidence score from 0 to 1)
    }
  ],
  "tradeTrends": {
    "globalTrend": "Brief description of global tariff trends",
    "regionalTrends": ["List of regional tariff trends"],
    "sectorTrends": ["List of sector-specific tariff trends"]
  },
  "sources": [
    {
      "title": "Source title",
      "url": "Source URL",
      "date": "Publication date",
      "reliability": 0.95 (reliability score from 0 to 1)
    }
  ]
}

Provide actual recent tariff changes from credible sources. For each change, include comprehensive details about the policy, affected parties, and potential impact.`;
    
    // Create messages for the API call
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: queryText
      }
    ];
    
    // Call Perplexity API
    const responseText = await callPerplexityAPI(messages, MODELS.MEDIUM);
    
    // Parse the JSON response
    const jsonData = extractJsonFromResponse(responseText);
    
    if (jsonData && typeof jsonData === 'object') {
      // Add query and timestamp to the response
      return {
        ...jsonData,
        query: queryText,
        timestamp: new Date().toISOString()
      };
    }
    
    // If we couldn't parse structured data, create a simpler response
    console.warn('Failed to parse structured data for tariff changes from Perplexity response');
    
    return {
      query: queryText,
      summary: 'Failed to extract structured tariff change data',
      changes: [],
      tradeTrends: {
        globalTrend: 'Data unavailable',
        regionalTrends: [],
        sectorTrends: []
      },
      sources: [],
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting recent tariff changes:', error);
    throw error;
  }
}

/**
 * Analyze tariff impact for specific products
 */
export async function analyzeTariffImpact({
  product,
  countries,
  timeframeMonths = 12
}: {
  product: string;
  countries: string[];
  timeframeMonths?: number;
}): Promise<any> {
  try {
    // Build the query text
    const countryList = countries.join(', ');
    const queryText = `Analyze the tariff impact for ${product} over the next ${timeframeMonths} months for the following countries: ${countryList}. What are the current rates, projected changes, and potential economic impacts? Include economic and political factors that might influence tariff policies.`;
    
    // Create a system prompt for tariff impact analysis
    const systemPrompt = `You are an international trade and tariff analysis expert. Analyze the tariff impact for specific products and countries using the most current data. 
Provide a structured analysis in the following JSON format:

{
  "summary": "Brief summary of tariff impact analysis",
  "product": "Product category analyzed",
  "timeframeMonths": 24,
  "impactByCountry": [
    {
      "country": "Country name",
      "currentTariffRate": 5.0,
      "projectedTariffRate": 7.5,
      "netImpact": 2.5,
      "impactDirection": "increase|decrease|neutral",
      "riskLevel": "high|medium|low",
      "keyFactors": ["List of key factors affecting tariffs"],
      "economicImplications": "Brief assessment of economic implications",
      "confidence": 0.85 (confidence score from 0 to 1)
    }
  ],
  "tradeTrends": {
    "globalTrend": "Brief description of global trend",
    "regionalPatterns": ["List of regional patterns"],
    "volatilityAssessment": "high|medium|low"
  },
  "recommendations": [
    "List of strategic recommendations"
  ],
  "dataSources": [
    "List of data sources referenced"
  ]
}

Provide detailed analysis with quantitative estimates where possible. For projections, explain the key factors that could influence tariff rates over the given timeframe, including political, economic, and regulatory considerations.`;
    
    // Create messages for the API call
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: queryText
      }
    ];
    
    // Call Perplexity API
    const responseText = await callPerplexityAPI(messages, MODELS.LARGE);
    
    // Parse the JSON response
    const jsonData = extractJsonFromResponse(responseText);
    
    if (jsonData && typeof jsonData === 'object') {
      // Add query and timestamp to the response
      return {
        ...jsonData,
        query: queryText,
        timestamp: new Date().toISOString()
      };
    }
    
    // If we couldn't parse structured data, create a simpler response
    console.warn('Failed to parse structured impact analysis from Perplexity response');
    
    return {
      query: queryText,
      summary: 'Failed to extract structured tariff impact analysis',
      product: product,
      timeframeMonths: timeframeMonths,
      impactByCountry: countries.map(country => ({
        country: country,
        currentTariffRate: 'Unknown',
        projectedTariffRate: 'Unknown',
        netImpact: 'Unknown',
        impactDirection: 'neutral',
        riskLevel: 'medium',
        keyFactors: ['Analysis unavailable'],
        confidence: 0.5
      })),
      tradeTrends: {
        globalTrend: 'Data unavailable',
        regionalPatterns: [],
        volatilityAssessment: 'medium'
      },
      recommendations: ['Data unavailable'],
      dataSources: [],
      rawResponse: responseText,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error analyzing tariff impact:', error);
    throw error;
  }
}

/**
 * Convert tariff data to RDF triples (in Turtle format)
 */
export function convertTariffToRDF(tariffData: TariffDataResponse): string {
  try {
    const prefixes = [
      '@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .',
      '@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .',
      '@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .',
      '@prefix tariff: <http://example.org/tariff/> .',
      '@prefix dc: <http://purl.org/dc/elements/1.1/> .',
      '@prefix owl: <http://www.w3.org/2002/07/owl#> .',
      '@prefix skos: <http://www.w3.org/2004/02/skos/core#> .',
      '@prefix hs: <http://example.org/hs-code/> .',
      ''
    ];
    
    let triples: string[] = [...prefixes];
    
    // Add triples for each tariff
    tariffData.tariffs.forEach((tariff, index) => {
      const tariffId = `tariff:T_${uuidv4()}`;
      
      triples.push(`# Tariff entry ${index + 1}`);
      triples.push(`${tariffId} rdf:type tariff:Tariff .`);
      
      if (tariff.hsCode) {
        const hsCodeId = `hs:${tariff.hsCode.replace(/\./g, '_')}`;
        triples.push(`${tariffId} tariff:hasHSCode ${hsCodeId} .`);
        triples.push(`${hsCodeId} rdf:type tariff:HSCode .`);
        triples.push(`${hsCodeId} rdfs:label "${tariff.hsCode}"@en .`);
      }
      
      if (tariff.description) {
        triples.push(`${tariffId} rdfs:label "${escapeString(tariff.description)}"@en .`);
      }
      
      if (tariff.sourceCountry) {
        const sourceCountryId = `tariff:${tariff.sourceCountry.replace(/\s+/g, '_')}`;
        triples.push(`${tariffId} tariff:hasSourceCountry ${sourceCountryId} .`);
        triples.push(`${sourceCountryId} rdf:type tariff:Country .`);
        triples.push(`${sourceCountryId} rdfs:label "${tariff.sourceCountry}"@en .`);
      }
      
      if (tariff.destinationCountry) {
        const destCountryId = `tariff:${tariff.destinationCountry.replace(/\s+/g, '_')}`;
        triples.push(`${tariffId} tariff:hasDestinationCountry ${destCountryId} .`);
        triples.push(`${destCountryId} rdf:type tariff:Country .`);
        triples.push(`${destCountryId} rdfs:label "${tariff.destinationCountry}"@en .`);
      }
      
      if (typeof tariff.rate === 'number') {
        triples.push(`${tariffId} tariff:hasRate "${tariff.rate}"^^xsd:decimal .`);
      }
      
      if (tariff.currency) {
        triples.push(`${tariffId} tariff:hasCurrency "${tariff.currency}" .`);
      }
      
      if (tariff.effectiveDate) {
        triples.push(`${tariffId} tariff:hasEffectiveDate "${tariff.effectiveDate}"^^xsd:date .`);
      }
      
      if (tariff.expirationDate) {
        triples.push(`${tariffId} tariff:hasExpirationDate "${tariff.expirationDate}"^^xsd:date .`);
      }
      
      if (tariff.exemptions && tariff.exemptions.length > 0) {
        tariff.exemptions.forEach((exemption, exemptionIndex) => {
          const exemptionId = `${tariffId}_exemption_${exemptionIndex}`;
          triples.push(`${exemptionId} rdf:type tariff:Exemption .`);
          triples.push(`${exemptionId} rdfs:label "${escapeString(exemption)}"@en .`);
          triples.push(`${tariffId} tariff:hasExemption ${exemptionId} .`);
        });
      }
      
      if (tariff.specialConditions && tariff.specialConditions.length > 0) {
        tariff.specialConditions.forEach((condition, conditionIndex) => {
          const conditionId = `${tariffId}_condition_${conditionIndex}`;
          triples.push(`${conditionId} rdf:type tariff:SpecialCondition .`);
          triples.push(`${conditionId} rdfs:label "${escapeString(condition)}"@en .`);
          triples.push(`${tariffId} tariff:hasSpecialCondition ${conditionId} .`);
        });
      }
      
      if (typeof tariff.confidence === 'number') {
        triples.push(`${tariffId} tariff:hasConfidence "${tariff.confidence}"^^xsd:decimal .`);
      }
      
      triples.push('');
    });
    
    // Add triples for related policies
    tariffData.relatedPolicies.forEach((policy, index) => {
      const policyId = `tariff:policy_${index}_${Date.now()}`;
      
      triples.push(`# Policy ${index + 1}`);
      triples.push(`${policyId} rdf:type tariff:Policy .`);
      
      if (policy.name) {
        triples.push(`${policyId} rdfs:label "${escapeString(policy.name)}"@en .`);
      }
      
      if (policy.description) {
        triples.push(`${policyId} dc:description "${escapeString(policy.description)}"@en .`);
      }
      
      if (policy.countries && policy.countries.length > 0) {
        policy.countries.forEach(country => {
          const countryId = `tariff:${country.replace(/\s+/g, '_')}`;
          triples.push(`${policyId} tariff:involvesCountry ${countryId} .`);
          triples.push(`${countryId} rdf:type tariff:Country .`);
          triples.push(`${countryId} rdfs:label "${country}"@en .`);
        });
      }
      
      if (policy.implementationDate) {
        triples.push(`${policyId} tariff:hasImplementationDate "${policy.implementationDate}"^^xsd:date .`);
      }
      
      if (policy.url) {
        triples.push(`${policyId} tariff:hasUrl "${policy.url}"^^xsd:anyURI .`);
      }
      
      if (typeof policy.relevance === 'number') {
        triples.push(`${policyId} tariff:hasRelevance "${policy.relevance}"^^xsd:decimal .`);
      }
      
      triples.push('');
    });
    
    // Add triples for sources
    tariffData.sources.forEach((source, index) => {
      const sourceId = `tariff:source_${index}_${Date.now()}`;
      
      triples.push(`# Source ${index + 1}`);
      triples.push(`${sourceId} rdf:type tariff:Source .`);
      
      if (source.title) {
        triples.push(`${sourceId} dc:title "${escapeString(source.title)}"@en .`);
      }
      
      if (source.url) {
        triples.push(`${sourceId} tariff:hasUrl "${source.url}"^^xsd:anyURI .`);
      }
      
      if (source.date) {
        triples.push(`${sourceId} dc:date "${source.date}"^^xsd:date .`);
      }
      
      if (typeof source.reliability === 'number') {
        triples.push(`${sourceId} tariff:hasReliability "${source.reliability}"^^xsd:decimal .`);
      }
      
      triples.push('');
    });
    
    return triples.join('\n');
  } catch (error) {
    console.error('Error converting tariff data to RDF:', error);
    return '';
  }
}

/**
 * Helper function to escape strings for RDF
 */
function escapeString(str: string): string {
  return str.replace(/"/g, '\\"').replace(/\n/g, '\\n');
}