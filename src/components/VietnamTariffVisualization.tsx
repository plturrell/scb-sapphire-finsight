import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import { Tabs, Tab, Card, CardHeader, CardContent, Box, Typography, Chip } from '@mui/material';
import Grid from '@mui/material/Grid'; // Import Grid component directly to avoid typing issues
import { Loader2, Info, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { VietnamTariffAnalyzer } from '../services/VietnamTariffAnalyzer';

// SCB color palette
const SCB_COLORS = {
  primaryBlue: '#0F5EA2',
  secondaryGreen: '#008D83',
  neutralLight: '#E5E5E5',
  neutralDark: '#333333',
  alertRed: '#D0021B',
  alertAmber: '#F5A623',
  // Extended palette
  positive: '#008D83', // SCB green
  negative: '#D0021B', // SCB red
  neutral: '#0F5EA2', // SCB blue
};

// Type definitions
interface SankeyNode {
  id: string;
  name: string;
  group: string;
}

interface SankeyLink {
  source: string;
  target: string;
  value: number;
  type: string;
  uiColor: string;
  aiEnhanced?: boolean;
}

interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
  aiInsights: {
    summary: string;
    recommendations: string[];
    confidence: number;
    updatedAt: Date;
  };
}

interface GeoMapData {
  vietnam: {
    provinces: {
      id: string;
      name: string;
      netImpact: number;
      exportVolume: number;
      importVolume: number;
    }[];
  };
  asean: {
    countries: {
      id: string;
      name: string;
      netImpact: number;
      tradeBalance: number;
    }[];
  };
  tradeCorridors: {
    from: string;
    to: string;
    volume: number;
    tariffImpact: number;
  }[];
}

interface VietnamTariffVisualizationProps {
  analyzer: VietnamTariffAnalyzer;
  timeHorizon?: number;
  iterations?: number;
  selectedCategories?: string[];
  selectedCountries?: string[];
  confidenceLevel?: number;
  isLoading?: boolean;
}

const VietnamTariffVisualization: React.FC<VietnamTariffVisualizationProps> = ({
  analyzer,
  timeHorizon = 24,
  iterations = 5000,
  selectedCategories = [],
  selectedCountries = [],
  confidenceLevel = 0.95,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<string>('sankey');
  const [sankeyData, setSankeyData] = useState<SankeyData | null>(null);
  const [geoMapData, setGeoMapData] = useState<GeoMapData | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any | null>(null);
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(false);
  const sankeyRef = useRef<HTMLDivElement>(null);
  const geoMapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (analyzer && !isLoading) {
      runAnalysis();
    }
  }, [analyzer, timeHorizon, iterations, selectedCategories, selectedCountries, confidenceLevel]);

  const runAnalysis = async () => {
    try {
      setIsSimulationRunning(true);
      
      // Run the analysis using the Vietnam Tariff Analyzer
      const results = await analyzer.analyzeVietnamImpact({
        timeHorizon,
        iterations,
        tradeCategories: selectedCategories.length ? selectedCategories : undefined,
        aseanCountries: selectedCountries.length ? selectedCountries : undefined,
        confidenceLevel,
      });
      
      setAnalysisResults(results);
      setSankeyData(results.sankeyData);
      setGeoMapData(results.geoMapData);
      
      // Render visualizations
      if (sankeyData && sankeyRef.current) {
        renderSankeyDiagram(sankeyData);
      }
      
      if (geoMapData && geoMapRef.current) {
        renderGeoMap(geoMapData);
      }
      
      setIsSimulationRunning(false);
    } catch (error) {
      console.error('Error running Vietnam tariff analysis:', error);
      setIsSimulationRunning(false);
    }
  };

  useEffect(() => {
    if (sankeyData && sankeyRef.current) {
      renderSankeyDiagram(sankeyData);
    }
  }, [sankeyData, activeTab]);

  useEffect(() => {
    if (geoMapData && geoMapRef.current && activeTab === 'geomap') {
      renderGeoMap(geoMapData);
    }
  }, [geoMapData, activeTab]);

  const renderSankeyDiagram = (data: SankeyData) => {
    if (!sankeyRef.current) return;
    
    // Clear previous visualization
    d3.select(sankeyRef.current).select('svg').remove();
    
    const width = sankeyRef.current.clientWidth;
    const height = 600;
    
    const svg = d3.select(sankeyRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', 'translate(50,20)');
    
    // Set up Sankey generator
    const sankeyLayout = sankey()
      .nodeWidth(20)
      .nodePadding(10)
      .size([width - 100, height - 40]);
    
    // Format data for D3 Sankey following SAP Fiori Horizon design principles
    const nodeMap = new Map();
    data.nodes.forEach((node, i) => {
      nodeMap.set(node.id, i);
    });
    
    // Properly typed Sankey nodes with required d3-sankey properties
    const sankeyNodes = data.nodes.map((node, i) => ({
      index: i,
      name: node.name,
      group: node.group,
      // Add additional required properties for d3-sankey
      x0: 0,
      x1: 0,
      y0: 0,
      y1: 0,
      sourceLinks: [],
      targetLinks: []
    }));
    
    // Properly typed Sankey links with required d3-sankey properties
    const sankeyLinks = data.links.map((link, i) => ({
      source: nodeMap.get(link.source),
      target: nodeMap.get(link.target),
      value: link.value,
      index: i,
      // Preserve our custom attributes for SCB styling
      type: link.type,
      uiColor: link.uiColor,
      aiEnhanced: !!link.aiEnhanced,
      // Add additional properties required by d3-sankey
      width: 0,
      y0: 0,
      y1: 0
    }));
    
    // Create the complete Sankey data structure that matches d3-sankey typing
    const sankeyData = {
      nodes: sankeyNodes,
      links: sankeyLinks
    };
    
    // Generate Sankey diagram with proper typing
    const sankeyGenerator = sankey()
      .nodeWidth(20)
      .nodePadding(10)
      .size([width - 100, height - 40]);
      
    // Apply the data to the Sankey generator
    const sankeyGraph = sankeyGenerator(sankeyData);
    
    // Extract nodes and links with proper typing
    const nodes = sankeyGraph.nodes;
    const links = sankeyGraph.links;
    
    // Create a helper function for the horizontal sankey link path
    const linkPath = sankeyLinkHorizontal();
    
    // Add links using SAP Fiori Horizon design principles for SCB branding
    svg.append('g')
      .selectAll('path')
      .data(links)
      .enter()
      .append('path')
      .attr('d', (d: any) => linkPath(d))
      .attr('stroke', (d: any) => d.uiColor || SCB_COLORS.neutralLight)
      .attr('stroke-width', (d: any) => Math.max(1, d.width))
      .attr('fill', 'none')
      .attr('opacity', (d: any) => d.aiEnhanced ? 0.9 : 0.6)
      .attr('stroke-dasharray', (d: any) => d.aiEnhanced ? '5,5' : null)
      .append('title')
      .text((d: any) => `${d.source.name} → ${d.target.name}: ${d.value}`);
    
    // Add nodes
    const nodeGroup = svg.append('g')
      .selectAll('rect')
      .data(nodes)
      .enter()
      .append('g');
    
    nodeGroup.append('rect')
      .attr('x', (d: any) => d.x0)
      .attr('y', (d: any) => d.y0)
      .attr('height', (d: any) => d.y1 - d.y0)
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('fill', (d: any) => {
        const node = data.nodes[d.index];
        if (node.group === 'country') return SCB_COLORS.primaryBlue;
        if (node.group === 'product') return SCB_COLORS.secondaryGreen;
        if (node.group === 'policy') return SCB_COLORS.alertAmber;
        return SCB_COLORS.neutralLight;
      })
      .attr('stroke', SCB_COLORS.neutralDark)
      .append('title')
      .text((d: any) => `${d.name}: ${d.value}`);
    
    // Add node labels
    nodeGroup.append('text')
      .attr('x', (d: any) => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr('y', (d: any) => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d: any) => d.x0 < width / 2 ? 'start' : 'end')
      .text((d: any) => d.name)
      .attr('font-size', '10px')
      .attr('font-family', 'Proxima Nova, Arial, sans-serif')
      .attr('fill', SCB_COLORS.neutralDark);
    
    // Add legend
    const legend = svg.append('g')
      .attr('font-family', 'Proxima Nova, Arial, sans-serif')
      .attr('font-size', 10)
      .attr('transform', `translate(${width - 180},10)`)
      .selectAll('g')
      .data(['Country', 'Product', 'Policy', 'AI Enhanced'])
      .enter()
      .append('g')
      .attr('transform', (d, i) => `translate(0,${i * 20})`);
    
    legend.append('rect')
      .attr('width', 18)
      .attr('height', 18)
      .attr('fill', (d) => {
        if (d === 'Country') return SCB_COLORS.primaryBlue;
        if (d === 'Product') return SCB_COLORS.secondaryGreen;
        if (d === 'Policy') return SCB_COLORS.alertAmber;
        return 'none';
      })
      .attr('stroke', (d) => d === 'AI Enhanced' ? SCB_COLORS.neutralDark : 'none')
      .attr('stroke-dasharray', (d) => d === 'AI Enhanced' ? '2,2' : null);
    
    legend.append('text')
      .attr('x', 24)
      .attr('y', 9)
      .attr('dy', '0.35em')
      .text((d) => d);
  };

  const renderGeoMap = (data: GeoMapData) => {
    if (!geoMapRef.current) return;
    
    // In a real implementation, this would render a D3 geographic map
    // with Vietnam and ASEAN countries, showing tariff impacts as a heat map
    
    // Clear previous visualization
    d3.select(geoMapRef.current).select('svg').remove();
    
    const width = geoMapRef.current.clientWidth;
    const height = 500;
    
    const svg = d3.select(geoMapRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', 'translate(50,20)');
    
    // This is a placeholder for the geographic visualization
    // In a real implementation, we would:
    // 1. Load GeoJSON data for Vietnam and ASEAN
    // 2. Project the map using d3.geoMercator
    // 3. Create a color scale for impact values
    // 4. Render provinces/countries with color based on impact
    // 5. Add trade flow lines between countries
    
    // Add placeholder text
    svg.append('text')
      .attr('x', width / 2 - 50)
      .attr('y', height / 2)
      .text('Geographic Visualization')
      .attr('font-family', 'Proxima Nova, Arial, sans-serif')
      .attr('fill', SCB_COLORS.neutralDark);
  };

  const renderInsightsPanel = () => {
    if (!sankeyData?.aiInsights) return null;
    
    const { summary, recommendations, confidence } = sankeyData.aiInsights;
    
    return (
      <Card sx={{ mt: 2, bgcolor: '#f5f9fd', border: `1px solid ${SCB_COLORS.primaryBlue}` }}>
        <CardHeader 
          title={
            <Box display="flex" alignItems="center">
              <Info size={18} color={SCB_COLORS.primaryBlue} style={{ marginRight: '8px' }} />
              <Typography variant="h6" component="div" fontSize="16px">
                AI-Enhanced Insights
              </Typography>
              <Chip 
                label={`${(confidence * 100).toFixed(0)}% confidence`}
                size="small" 
                sx={{ 
                  ml: 2, 
                  bgcolor: confidence > 0.9 ? SCB_COLORS.secondaryGreen : SCB_COLORS.alertAmber,
                  color: 'white'
                }}
              />
            </Box>
          }
          sx={{ pb: 0 }}
        />
        <CardContent>
          <Typography variant="body2" paragraph>
            {summary}
          </Typography>
          
          <Typography variant="subtitle2" gutterBottom>
            Recommendations:
          </Typography>
          
          <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
            {recommendations.map((rec, index) => (
              <li key={index}>
                <Typography variant="body2">{rec}</Typography>
              </li>
            ))}
          </ul>
          
          <Box display="flex" alignItems="center" mt={1}>
            <AlertTriangle size={14} color={SCB_COLORS.alertAmber} style={{ marginRight: '8px' }} />
            <Typography variant="caption" color="text.secondary">
              These insights are automatically generated and should be verified by financial analysts.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderImpactSummary = () => {
    if (!analysisResults?.countrySpecific?.vietnam) return null;
    
    const vietnamData = analysisResults.countrySpecific.vietnam;
    
    return (
      <Card sx={{ mt: 2 }}>
        <CardHeader 
          title={
            <Typography variant="h6" component="div" fontSize="16px">
              Vietnam Tariff Impact Summary
            </Typography>
          }
          sx={{ pb: 0 }}
        />
        <CardContent>
          <Typography variant="body2" paragraph>
            {vietnamData.impactSummary}
          </Typography>
          
          <Typography variant="subtitle2" gutterBottom>
            Key Findings:
          </Typography>
          
          <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
            {vietnamData.keyFindings.map((finding: string, index: number) => (
              <li key={index}>
                <Typography variant="body2">{finding}</Typography>
              </li>
            ))}
          </ul>
          
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Risk Assessment:
          </Typography>
          
          {/* Use sx prop for Grid components to avoid TypeScript errors */}
          <Grid container spacing={2} sx={{ width: '100%' }}>
            <Grid sx={{ width: '50%' }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                High Risk Categories:
              </Typography>
              {vietnamData.riskAssessment.highRiskCategories.map((category: string, idx: number) => (
                <Box key={idx} display="flex" alignItems="center" mt={0.5}>
                  <TrendingUp size={14} color={SCB_COLORS.alertRed} style={{ marginRight: '4px' }} />
                  <Typography variant="body2">{category}</Typography>
                </Box>
              ))}
            </Grid>
            <Grid sx={{ width: '50%' }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                Low Risk Categories:
              </Typography>
              {vietnamData.riskAssessment.lowRiskCategories.map((category: string, idx: number) => (
                <Box key={idx} display="flex" alignItems="center" mt={0.5}>
                  <TrendingDown size={14} color={SCB_COLORS.secondaryGreen} style={{ marginRight: '4px' }} />
                  <Typography variant="body2">{category}</Typography>
                </Box>
              ))}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="vietnam-tariff-visualization">
      {isSimulationRunning || isLoading ? (
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center"
          height="300px"
        >
          <Loader2 size={40} className="animate-spin" color={SCB_COLORS.primaryBlue} />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Running Vietnam tariff impact simulation...
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Processing {iterations.toLocaleString()} iterations across {timeHorizon} months
          </Typography>
        </Box>
      ) : (
        <>
          <Tabs 
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            indicatorColor="primary"
            textColor="primary"
            sx={{ 
              mb: 2,
              '& .MuiTab-root': { 
                textTransform: 'none',
                fontFamily: 'Proxima Nova, Arial, sans-serif'
              }
            }}
          >
            <Tab label="Sankey Diagram" value="sankey" />
            <Tab label="Geographic Impact" value="geomap" />
            <Tab label="Simulation Details" value="details" />
          </Tabs>
          
          {activeTab === 'sankey' && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Vietnam Tariff Flow Analysis
              </Typography>
              <div 
                ref={sankeyRef} 
                style={{ 
                  width: '100%', 
                  height: '600px', 
                  border: `1px solid ${SCB_COLORS.neutralLight}`,
                  borderRadius: '4px',
                  padding: '16px',
                  background: '#fff'
                }}
              />
              {renderInsightsPanel()}
            </Box>
          )}
          
          {activeTab === 'geomap' && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Vietnam & ASEAN Tariff Impact Map
              </Typography>
              <div 
                ref={geoMapRef} 
                style={{ 
                  width: '100%', 
                  height: '500px', 
                  border: `1px solid ${SCB_COLORS.neutralLight}`,
                  borderRadius: '4px',
                  padding: '16px',
                  background: '#fff'
                }}
              />
              {renderImpactSummary()}
            </Box>
          )}
          
          {activeTab === 'details' && analysisResults && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Vietnam Tariff Impact Simulation Details
              </Typography>
              
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Simulation Metrics
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ width: '100%' }}>
                    <Grid sx={{ width: { xs: '50%', md: '25%' } }}>
                      <Typography variant="caption" color="text.secondary">
                        Iterations Required
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {analysisResults.simulationMetrics.iterationsRequired.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid sx={{ width: { xs: '50%', md: '25%' } }}>
                      <Typography variant="caption" color="text.secondary">
                        Confidence Interval
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        [{analysisResults.simulationMetrics.confidenceInterval[0]}, {analysisResults.simulationMetrics.confidenceInterval[1]}]
                      </Typography>
                    </Grid>
                    <Grid sx={{ width: { xs: '50%', md: '25%' } }}>
                      <Typography variant="caption" color="text.secondary">
                        Convergence Achieved
                      </Typography>
                      <Typography variant="body2" fontWeight="medium" color={analysisResults.simulationMetrics.convergenceAchieved ? SCB_COLORS.secondaryGreen : SCB_COLORS.alertRed}>
                        {analysisResults.simulationMetrics.convergenceAchieved ? 'Yes' : 'No'}
                      </Typography>
                    </Grid>
                    <Grid sx={{ width: { xs: '50%', md: '25%' } }}>
                      <Typography variant="caption" color="text.secondary">
                        Execution Time
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {analysisResults.simulationMetrics.executionTimeMs.toLocaleString()}ms
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
                    Sensitivity Analysis
                  </Typography>
                  
                  <Box sx={{ mt: 1 }}>
                    {analysisResults.simulationMetrics.sensitivityFactors.map((factor: { name: string; sensitivity: number }, idx: number) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box 
                          sx={{ 
                            width: `${factor.sensitivity * 100}%`, 
                            height: '20px', 
                            bgcolor: SCB_COLORS.primaryBlue,
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            px: 1
                          }}
                        >
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'white', 
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {factor.name}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          {(factor.sensitivity * 100).toFixed(0)}%
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
                    Regional Impact Summary
                  </Typography>
                  
                  <Box sx={{ mt: 1 }}>
                    {Object.entries(analysisResults.regionalImpact.asean).map(([country, data]: [string, any]) => (
                      <Box key={country} sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ width: '120px' }}>
                          {country.charAt(0).toUpperCase() + country.slice(1)}
                        </Typography>
                        <Box sx={{ flex: 1, mx: 2 }}>
                          <Box 
                            sx={{ 
                              position: 'relative', 
                              height: '20px', 
                              bgcolor: SCB_COLORS.neutralLight,
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}
                          >
                            <Box 
                              sx={{ 
                                position: 'absolute',
                                left: '50%',
                                top: 0,
                                bottom: 0,
                                width: `${Math.abs(data.netTariffImpact) * 10}%`,
                                bgcolor: data.netTariffImpact > 0 ? SCB_COLORS.secondaryGreen : SCB_COLORS.alertRed,
                                transform: data.netTariffImpact > 0 ? 'none' : 'translateX(-100%)'
                              }}
                            />
                            <Box 
                              sx={{ 
                                position: 'absolute',
                                left: '50%',
                                top: 0,
                                bottom: 0,
                                width: '1px',
                                bgcolor: SCB_COLORS.neutralDark
                              }}
                            />
                          </Box>
                        </Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            width: '80px', 
                            textAlign: 'right',
                            color: data.netTariffImpact > 0 ? SCB_COLORS.secondaryGreen : SCB_COLORS.alertRed
                          }}
                        >
                          {data.netTariffImpact > 0 ? '+' : ''}{data.netTariffImpact.toFixed(1)}%
                        </Typography>
                        <Typography variant="caption" sx={{ width: '60px', textAlign: 'right' }}>
                          {(data.confidence * 100).toFixed(0)}% conf.
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}
        </>
      )}
    </div>
  );
};

export default VietnamTariffVisualization;
