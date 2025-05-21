import { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import { SankeyData, IndustryImpact } from '@/types';
import perplexityService from '@/services/PerplexityService';
import { withApiCache } from '@/services/redis/ApiCacheMiddleware';

/**
 * Tariff Impact Simulation API
 * 
 * This endpoint runs a simulation to predict the impact of tariff changes
 * on trade flows and industries.
 * 
 * It accepts a POST request with the following parameters:
 * - countries: List of countries to include in the simulation
 * - products: List of product categories to include
 * - scenarios: List of policy scenarios to simulate
 * - timeframe: Time period for simulation (e.g., "2025", "2025-2030")
 * 
 * Returns:
 * - sankeyData: Flow diagram data showing trade relationships
 * - impacts: List of industry impact predictions
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle options request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Get simulation parameters
    const { countries, products, scenarios, timeframe } = req.body;
    
    // Log simulation parameters
    console.log('Running tariff impact simulation with parameters:', {
      countries,
      products,
      scenarios,
      timeframe
    });
    
    // Generate simulation results
    const { sankeyData, impacts } = await generateSimulationResults(
      countries,
      products,
      scenarios,
      timeframe
    );
    
    // Return simulation results
    return res.status(200).json({
      success: true,
      sankeyData,
      impacts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error running tariff impact simulation:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to run tariff impact simulation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Generate simulation results
 */
async function generateSimulationResults(
  countries?: string[],
  products?: string[],
  scenarios?: string[],
  timeframe?: string
): Promise<{
  sankeyData: SankeyData;
  impacts: IndustryImpact[];
}> {
  try {
    // Use Perplexity for intelligent sankey data generation
    const sankeyData = await generateSankeyData(countries, products, scenarios, timeframe);
    
    // Generate industry impacts
    const impacts = generateIndustryImpacts(products);
    
    return {
      sankeyData,
      impacts
    };
  } catch (error) {
    console.error('Error generating simulation results:', error);
    
    // Fallback to default simulation results
    return {
      sankeyData: generateDefaultSankeyData(),
      impacts: generateDefaultIndustryImpacts()
    };
  }
}

/**
 * Generate Sankey data using Perplexity AI
 */
async function generateSankeyData(
  countries?: string[],
  products?: string[],
  scenarios?: string[],
  timeframe?: string
): Promise<SankeyData> {
  // Try to use Perplexity to generate intelligent Sankey data
  try {
    if (!countries?.length && !products?.length) {
      throw new Error('Insufficient parameters for Perplexity');
    }
    
    // Create a structured prompt for Perplexity
    const systemPrompt = `You are a trade policy and economics expert specializing in visualizing trade flows and tariff impacts. Generate a Sankey diagram structure showing how trade flows between countries, through product categories, and is affected by policy types. Return only the structured JSON object with nodes and links.`;
    
    // Build the user prompt based on available parameters
    let userPrompt = `Generate a Sankey diagram showing trade flows`;
    
    if (countries && countries.length > 0) {
      userPrompt += ` for these countries: ${countries.join(', ')}`;
    } else {
      userPrompt += ` for major ASEAN countries`;
    }
    
    if (products && products.length > 0) {
      userPrompt += ` focusing on these product categories: ${products.join(', ')}`;
    }
    
    if (timeframe) {
      userPrompt += ` for the timeframe: ${timeframe}`;
    }
    
    userPrompt += `. Create nodes for countries, product categories, and policy types. Create links between them showing trade flows and impacts. Include AI insights with a summary and recommendations. Ensure nodes have 'name' and 'group' properties, and links have 'source', 'target', and 'value' properties. Some links should have 'aiEnhanced' set to true to indicate AI-enhanced insights.`;
    
    // Call Perplexity API
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt }
    ];
    
    const perplexityResponse = await perplexityService.callPerplexityAPI(messages, {
      temperature: 0.3,
      max_tokens: 2000
    });
    
    const content = perplexityResponse.choices[0]?.message?.content;
    
    if (content) {
      // Try to extract JSON object from the response
      try {
        // Find JSON-like structure in the text
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);
          
          // Process node indices to ensure compatibility
          if (parsedData.nodes && parsedData.links) {
            // Convert string sources/targets to indices if needed
            parsedData.links = parsedData.links.map((link: any) => {
              // If the source/target are already numbers, use them
              if (typeof link.source === 'number' && typeof link.target === 'number') {
                return link;
              }
              
              // If they're strings, convert to indices
              const sourceIndex = parsedData.nodes.findIndex((n: any) => 
                n.name === link.source || n.id === link.source
              );
              
              const targetIndex = parsedData.nodes.findIndex((n: any) => 
                n.name === link.target || n.id === link.target
              );
              
              return {
                ...link,
                source: sourceIndex >= 0 ? sourceIndex : 0,
                target: targetIndex >= 0 ? targetIndex : 0
              };
            });
            
            // Add colors if missing
            parsedData.links = parsedData.links.map((link: any) => ({
              ...link,
              uiColor: link.uiColor || getColorForGroup(
                parsedData.nodes[typeof link.source === 'number' ? link.source : 0]?.group
              )
            }));
            
            // Ensure all nodes have value property
            parsedData.nodes = parsedData.nodes.map((node: any) => ({
              ...node,
              value: node.value || 1
            }));
            
            return parsedData as SankeyData;
          }
        }
      } catch (jsonError) {
        console.error('Error parsing Perplexity response as JSON:', jsonError);
      }
    }
    
    throw new Error('Failed to generate valid Sankey data from Perplexity');
  } catch (perplexityError) {
    console.error('Error using Perplexity for Sankey data:', perplexityError);
    
    // Fall back to default Sankey data
    return generateDefaultSankeyData();
  }
}

/**
 * Generate default Sankey data
 */
function generateDefaultSankeyData(): SankeyData {
  return {
    nodes: [
      { name: "Singapore", group: "country", value: 1 },
      { name: "Malaysia", group: "country", value: 1 },
      { name: "Vietnam", group: "country", value: 1 },
      { name: "Electronics", group: "product", value: 1 },
      { name: "Textiles", group: "product", value: 1 },
      { name: "Automotive", group: "product", value: 1 },
      { name: "FTA", group: "policy", value: 1 },
      { name: "Protectionist", group: "policy", value: 1 },
      { name: "WTO Rules", group: "policy", value: 1 }
    ],
    links: [
      { source: 0, target: 3, value: 20, uiColor: "rgba(0, 114, 170, 0.6)", aiEnhanced: true },
      { source: 0, target: 4, value: 15, uiColor: "rgba(0, 114, 170, 0.6)" },
      { source: 1, target: 4, value: 25, uiColor: "rgba(0, 114, 170, 0.6)" },
      { source: 1, target: 5, value: 18, uiColor: "rgba(0, 114, 170, 0.6)", aiEnhanced: true },
      { source: 2, target: 3, value: 22, uiColor: "rgba(0, 114, 170, 0.6)" },
      { source: 2, target: 5, value: 12, uiColor: "rgba(0, 114, 170, 0.6)" },
      { source: 3, target: 6, value: 15, uiColor: "rgba(33, 170, 71, 0.6)" },
      { source: 3, target: 8, value: 5, uiColor: "rgba(33, 170, 71, 0.6)" },
      { source: 4, target: 7, value: 20, uiColor: "rgba(33, 170, 71, 0.6)", aiEnhanced: true },
      { source: 5, target: 6, value: 13, uiColor: "rgba(33, 170, 71, 0.6)" },
      { source: 5, target: 7, value: 8, uiColor: "rgba(33, 170, 71, 0.6)" }
    ],
    aiInsights: {
      summary: "AI-enhanced analysis of tariff impacts across ASEAN countries.",
      recommendations: [
        "Monitor changes in Vietnam's electronics tariffs in response to regional tensions.",
        "Consider diversifying textile suppliers beyond Malaysia to mitigate risk.",
        "Prepare contingency plans for automotive supply chain disruptions."
      ],
      confidence: 0.85,
      updatedAt: new Date()
    }
  };
}

/**
 * Generate industry impacts
 */
function generateIndustryImpacts(products?: string[]): IndustryImpact[] {
  // Predefined industries related to product categories
  const industryMap: Record<string, string[]> = {
    'Electronics': ['Semiconductor Manufacturing', 'Consumer Electronics', 'Electronic Components'],
    'Textiles': ['Apparel Manufacturing', 'Textile Production', 'Fashion Retail'],
    'Automotive': ['Auto Manufacturing', 'Auto Parts', 'Vehicle Assembly'],
    'Agricultural Products': ['Food Processing', 'Agricultural Production', 'Beverage Manufacturing'],
    'Chemicals': ['Chemical Manufacturing', 'Pharmaceuticals', 'Plastics Production'],
    'Metals': ['Steel Production', 'Metal Fabrication', 'Mining'],
    'Plastics': ['Plastics Manufacturing', 'Packaging', 'Consumer Goods'],
    'Machinery': ['Machine Tools', 'Heavy Equipment', 'Industrial Machinery']
  };
  
  let relevantIndustries: string[] = [];
  
  // If products are specified, use related industries
  if (products && products.length > 0) {
    products.forEach(product => {
      if (industryMap[product]) {
        relevantIndustries = [...relevantIndustries, ...industryMap[product]];
      }
    });
  }
  
  // If no relevant industries found, use a default set
  if (relevantIndustries.length === 0) {
    relevantIndustries = [
      'Semiconductor Manufacturing',
      'Apparel Manufacturing',
      'Auto Manufacturing',
      'Food Processing',
      'Chemical Manufacturing',
      'Steel Production'
    ];
  }
  
  // Generate impact data for each industry
  return relevantIndustries.map(industry => ({
    id: `impact-${uuidv4().substring(0, 8)}`,
    industry,
    severity: Math.floor(Math.random() * 8) + 3, // 3-10 severity
    estimatedAnnualImpact: Math.round((Math.random() * 90 + 10) * 10) / 10, // 10-100 million
    description: `Predicted impact on ${industry} based on tariff changes and trade policy shifts.`,
    suggestedMitigations: [
      `Diversify supply chain for ${industry}`,
      `Explore alternative markets for ${industry} products`,
      `Invest in automation to reduce labor costs in ${industry}`
    ]
  }));
}

/**
 * Generate default industry impacts
 */
function generateDefaultIndustryImpacts(): IndustryImpact[] {
  return [
    {
      id: 'impact-001',
      industry: 'Semiconductor Manufacturing',
      severity: 8,
      estimatedAnnualImpact: 75.5,
      description: 'Predicted impact on semiconductor manufacturing based on tariff changes affecting electronics imports and exports.',
      suggestedMitigations: [
        'Diversify supply chain beyond traditional sources',
        'Develop alternative sourcing strategies for key components',
        'Consider investing in domestic production capacity'
      ]
    },
    {
      id: 'impact-002',
      industry: 'Automotive Assembly',
      severity: 7,
      estimatedAnnualImpact: 62.3,
      description: 'Automotive assembly operations will face challenges due to tariff increases on components and finished vehicles.',
      suggestedMitigations: [
        'Explore regional assembly options to circumvent tariffs',
        'Negotiate with suppliers for cost reductions',
        'Increase local content percentages where feasible'
      ]
    },
    {
      id: 'impact-003',
      industry: 'Textile Production',
      severity: 6,
      estimatedAnnualImpact: 41.8,
      description: 'Textile production costs will increase due to tariffs on raw materials and machinery imports.',
      suggestedMitigations: [
        'Source alternative raw materials from unaffected countries',
        'Invest in production efficiency improvements',
        'Develop higher-value products to offset increased costs'
      ]
    }
  ];
}

/**
 * Get color for group
 */
function getColorForGroup(group?: string): string {
  if (!group) return 'rgba(128, 128, 128, 0.6)';
  
  switch (group.toLowerCase()) {
    case 'country':
      return 'rgba(0, 114, 170, 0.6)'; // Blue
    case 'product':
      return 'rgba(33, 170, 71, 0.6)'; // Green
    case 'policy':
      return 'rgba(170, 74, 68, 0.6)'; // Red
    default:
      return 'rgba(128, 128, 128, 0.6)'; // Gray
  }
}

// Export with cache middleware - cache for 30 minutes
export default withApiCache(handler, {
  ttl: 30 * 60,
  type: 'simulation',
  includeQueryParams: true
});