/**
 * Enhanced Vietnam Tariff Visualization with SCB Beautiful UI
 * Comprehensive visualization component with SCB styling, AI insights, and responsive design
 */

import React, { useEffect, useRef, useState } from 'react';
import { styled } from '@mui/material/styles';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import { 
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  Tabs,
  Tab,
  Paper,
  useMediaQuery,
  useTheme,
  Button,
  tooltipClasses,
  TooltipProps,
  Tooltip,
  Chip
} from '@mui/material';
import { 
  BarChart2,
  TrendingUp,
  TrendingDown,
  Map,
  AlertTriangle,
  Check,
  Info,
  Activity,
  ZoomIn,
  ZoomOut,
  Download,
  Share2,
  Globe,
  Layers,
  FileText,
  Calendar,
  DollarSign,
  Zap,
  PieChart,
  RefreshCw,
  Clipboard,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Shield
} from 'lucide-react';
import { VietnamTariffAnalyzer } from '../services/VietnamTariffAnalyzer';
import { EnhancedLoadingSpinner } from './EnhancedLoadingSpinner';
import useNetworkAwareLoading from '../hooks/useNetworkAwareLoading';

// Styled Components for SCB Beautiful UI
const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  border: '1px solid',
  borderColor: 'rgb(var(--scb-border))',
  borderRadius: '0.25rem',
  boxShadow: 'none',
  transition: 'box-shadow 0.2s, transform 0.2s',
  '&:hover': {
    boxShadow: '0 4px 6px rgba(var(--scb-honolulu-blue), 0.1)',
    transform: 'translateY(-2px)'
  }
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  border: '1px solid rgb(var(--scb-border))',
  borderRadius: '0.25rem',
  boxShadow: 'none',
  height: '100%'
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 500,
  fontSize: '0.95rem',
  minHeight: 48,
  color: 'rgb(var(--scb-dark-gray))',
  '&.Mui-selected': {
    color: 'rgb(var(--scb-honolulu-blue))',
    fontWeight: 600
  }
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTabs-indicator': {
    backgroundColor: 'rgb(var(--scb-honolulu-blue))',
    height: 3
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  borderRadius: '0.375rem',
  fontWeight: 500,
  boxShadow: 'none',
  '&.MuiButton-contained': {
    backgroundColor: 'rgb(var(--scb-honolulu-blue))',
    color: 'white',
    '&:hover': {
      backgroundColor: 'rgba(var(--scb-honolulu-blue), 0.9)',
      boxShadow: '0 2px 4px rgba(var(--scb-honolulu-blue), 0.2)'
    }
  },
  '&.MuiButton-outlined': {
    borderColor: 'rgb(var(--scb-honolulu-blue))',
    color: 'rgb(var(--scb-honolulu-blue))',
    '&:hover': {
      backgroundColor: 'rgba(var(--scb-honolulu-blue), 0.05)'
    }
  }
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  borderRadius: '1rem',
  fontSize: '0.75rem',
  fontWeight: 500,
  height: '24px',
  '&.MuiChip-colorPrimary': {
    backgroundColor: 'rgba(var(--scb-honolulu-blue), 0.1)',
    color: 'rgb(var(--scb-honolulu-blue))',
    border: '1px solid rgba(var(--scb-honolulu-blue), 0.2)'
  },
  '&.MuiChip-colorSuccess': {
    backgroundColor: 'rgba(var(--scb-american-green), 0.1)',
    color: 'rgb(var(--scb-american-green))',
    border: '1px solid rgba(var(--scb-american-green), 0.2)'
  },
  '&.MuiChip-colorWarning': {
    backgroundColor: 'rgba(var(--warning), 0.1)',
    color: 'rgb(var(--horizon-neutral-gray))',
    border: '1px solid rgba(var(--warning), 0.2)'
  },
  '&.MuiChip-colorError': {
    backgroundColor: 'rgba(var(--scb-muted-red), 0.1)',
    color: 'rgb(var(--scb-muted-red))',
    border: '1px solid rgba(var(--scb-muted-red), 0.2)'
  }
}));

const StyledTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: '#fff',
    color: 'rgb(var(--scb-dark-gray))',
    border: '1px solid rgb(var(--scb-border))',
    borderRadius: '0.25rem',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    padding: '8px 12px',
    fontSize: '0.75rem',
    maxWidth: 220,
  },
}));

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

interface EnhancedVietnamTariffVisualizationProps {
  analyzer: VietnamTariffAnalyzer;
  timeHorizon?: number;
  iterations?: number;
  selectedCategories?: string[];
  selectedCountries?: string[];
  confidenceLevel?: number;
  isLoading?: boolean;
  className?: string;
}

// SCB color variables for visualization
const SCB_VIZ_COLORS = {
  primaryBlue: 'rgb(var(--scb-honolulu-blue))',
  secondaryGreen: 'rgb(var(--scb-american-green))',
  neutral: 'rgb(var(--scb-dark-gray))',
  neutralLight: 'rgb(var(--scb-light-gray))',
  alertRed: 'rgb(var(--scb-muted-red))',
  alertAmber: 'rgb(var(--warning))',
  backgroundLight: 'rgba(var(--scb-light-gray), 0.5)',
  border: 'rgb(var(--scb-border))',
  positive: 'rgb(var(--scb-american-green))',
  negative: 'rgb(var(--scb-muted-red))'
};

/**
 * Enhanced Vietnam Tariff Visualization component with SCB beautiful styling
 */
const EnhancedVietnamTariffVisualization: React.FC<EnhancedVietnamTariffVisualizationProps> = ({
  analyzer,
  timeHorizon = 24,
  iterations = 5000,
  selectedCategories = [],
  selectedCountries = [],
  confidenceLevel = 0.95,
  isLoading = false,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<string>('sankey');
  const [sankeyData, setSankeyData] = useState<SankeyData | null>(null);
  const [geoMapData, setGeoMapData] = useState<GeoMapData | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any | null>(null);
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const sankeyRef = useRef<HTMLDivElement>(null);
  const geoMapRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { connection } = useNetworkAwareLoading();

  // Determine optimal visualization based on network
  const shouldRenderHeavyViz = connection.type !== '2g' && 
                             connection.type !== 'slow-2g' && 
                             !connection.saveData;

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
      
      setTimeout(() => {
        // Render visualizations after a slight delay to allow state updates
        if (sankeyData && sankeyRef.current && activeTab === 'sankey') {
          renderSankeyDiagram(sankeyData);
        }
        
        if (geoMapData && geoMapRef.current && activeTab === 'geomap') {
          renderGeoMap(geoMapData);
        }
        
        setIsSimulationRunning(false);
      }, 100);
    } catch (error) {
      console.error('Error running Vietnam tariff analysis:', error);
      setIsSimulationRunning(false);
    }
  };

  useEffect(() => {
    if (sankeyData && sankeyRef.current && activeTab === 'sankey') {
      renderSankeyDiagram(sankeyData);
    }
  }, [sankeyData, activeTab, zoomLevel]);

  useEffect(() => {
    if (geoMapData && geoMapRef.current && activeTab === 'geomap') {
      renderGeoMap(geoMapData);
    }
  }, [geoMapData, activeTab, zoomLevel]);

  const renderSankeyDiagram = (data: SankeyData) => {
    if (!sankeyRef.current) return;
    
    // Clear previous visualization
    d3.select(sankeyRef.current).select('svg').remove();
    
    const containerWidth = sankeyRef.current.clientWidth;
    const width = containerWidth * zoomLevel;
    const height = 600 * zoomLevel;
    
    const svg = d3.select(sankeyRef.current)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', 600)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .append('g')
      .attr('transform', `translate(50,20) scale(${zoomLevel})`);
    
    // Set up Sankey generator
    const sankeyLayout = sankey()
      .nodeWidth(20)
      .nodePadding(10)
      .size([width - 100, height - 40]);
    
    // Format data for D3 Sankey with SCB styling
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
      uiColor: link.uiColor || SCB_VIZ_COLORS.neutralLight,
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
      .size([width - 150, height - 80]);
      
    // Apply the data to the Sankey generator
    const sankeyGraph = sankeyGenerator(sankeyData);
    
    // Extract nodes and links with proper typing
    const nodes = sankeyGraph.nodes;
    const links = sankeyGraph.links;
    
    // Create a helper function for the horizontal sankey link path
    const linkPath = sankeyLinkHorizontal();
    
    // Add a gradient definition for SCB styled links
    const defs = svg.append('defs');
    
    links.forEach((link: any, i) => {
      const gradientId = `gradient-${i}`;
      const gradient = defs.append('linearGradient')
        .attr('id', gradientId)
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', link.source.x1)
        .attr('x2', link.target.x0);
      
      // Set gradient stops based on SCB styling
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', getNodeColor(link.source));
      
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', getNodeColor(link.target));
      
      // Add the gradient ID to the link object for reference
      link.gradientId = gradientId;
    });
    
    // Add links using SCB Beautiful UI styling
    svg.append('g')
      .selectAll('path')
      .data(links)
      .enter()
      .append('path')
      .attr('d', (d: any) => linkPath(d))
      .attr('stroke', (d: any) => `url(#${d.gradientId})`)
      .attr('stroke-width', (d: any) => Math.max(1, d.width))
      .attr('fill', 'none')
      .attr('opacity', (d: any) => d.aiEnhanced ? 0.85 : 0.6)
      .attr('stroke-dasharray', (d: any) => d.aiEnhanced ? '5,5' : null)
      .on('mouseover', function() {
        d3.select(this)
          .attr('opacity', 0.9)
          .attr('stroke-width', (d: any) => Math.max(2, d.width + 2));
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('opacity', (d: any) => d.aiEnhanced ? 0.85 : 0.6)
          .attr('stroke-width', (d: any) => Math.max(1, d.width));
      })
      .append('title')
      .text((d: any) => `${d.source.name} → ${d.target.name}: ${d.value}`);
    
    // Add nodes using SCB Beautiful UI styling
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
      .attr('fill', (d: any) => getNodeColor(d))
      .attr('stroke', SCB_VIZ_COLORS.border)
      .attr('rx', 3) // Rounded corners for SCB styling
      .attr('ry', 3)
      .attr('opacity', 0.9)
      .on('mouseover', function() {
        d3.select(this)
          .attr('opacity', 1)
          .attr('stroke-width', 2);
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('opacity', 0.9)
          .attr('stroke-width', 1);
      })
      .append('title')
      .text((d: any) => `${d.name}: ${d.value}`);
    
    // Add node labels with SCB Beautiful UI styling
    nodeGroup.append('text')
      .attr('x', (d: any) => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr('y', (d: any) => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d: any) => d.x0 < width / 2 ? 'start' : 'end')
      .text((d: any) => d.name)
      .attr('font-size', '10px')
      .attr('font-family', "'72', 'SCProsperSans-Regular', 'Proxima Nova', Arial, sans-serif")
      .attr('fill', SCB_VIZ_COLORS.neutral);
    
    // Add legend using SCB Beautiful UI styling
    const legend = svg.append('g')
      .attr('font-family', "'72', 'SCProsperSans-Regular', 'Proxima Nova', Arial, sans-serif")
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
      .attr('rx', 3) // Rounded corners for SCB styling
      .attr('ry', 3)
      .attr('fill', (d) => {
        if (d === 'Country') return SCB_VIZ_COLORS.primaryBlue;
        if (d === 'Product') return SCB_VIZ_COLORS.secondaryGreen;
        if (d === 'Policy') return SCB_VIZ_COLORS.alertAmber;
        return 'none';
      })
      .attr('stroke', (d) => d === 'AI Enhanced' ? SCB_VIZ_COLORS.neutral : 'none')
      .attr('stroke-dasharray', (d) => d === 'AI Enhanced' ? '2,2' : null);
    
    legend.append('text')
      .attr('x', 24)
      .attr('y', 9)
      .attr('dy', '0.35em')
      .text((d) => d)
      .attr('fill', SCB_VIZ_COLORS.neutral);
    
    // Helper function to get node color based on SCB styling
    function getNodeColor(node: any) {
      const nodeData = data.nodes[node.index];
      if (!nodeData) return SCB_VIZ_COLORS.neutralLight;
      
      if (nodeData.group === 'country') return SCB_VIZ_COLORS.primaryBlue;
      if (nodeData.group === 'product') return SCB_VIZ_COLORS.secondaryGreen;
      if (nodeData.group === 'policy') return SCB_VIZ_COLORS.alertAmber;
      return SCB_VIZ_COLORS.neutralLight;
    }
  };

  const renderGeoMap = (data: GeoMapData) => {
    if (!geoMapRef.current) return;
    
    // Clear previous visualization
    d3.select(geoMapRef.current).select('svg').remove();
    
    const containerWidth = geoMapRef.current.clientWidth;
    const width = containerWidth * zoomLevel;
    const height = 500 * zoomLevel;
    
    const svg = d3.select(geoMapRef.current)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', 500)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .append('g')
      .attr('transform', `translate(50,20) scale(${zoomLevel})`);
    
    // This is a placeholder for the geographic visualization
    // In a real implementation, we would:
    // 1. Load GeoJSON data for Vietnam and ASEAN
    // 2. Project the map using d3.geoMercator
    // 3. Create a color scale for impact values
    // 4. Render provinces/countries with color based on impact
    // 5. Add trade flow lines between countries
    
    // Add placeholder with SCB styling
    svg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width - 100)
      .attr('height', height - 40)
      .attr('fill', 'rgba(var(--scb-light-gray), 0.2)')
      .attr('stroke', 'rgb(var(--scb-border))')
      .attr('rx', 8)
      .attr('ry', 8);
    
    svg.append('text')
      .attr('x', (width - 100) / 2)
      .attr('y', (height - 40) / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .text('Geographic Visualization')
      .attr('font-family', "'72', 'SCProsperSans-Regular', 'Proxima Nova', Arial, sans-serif")
      .attr('fill', 'rgb(var(--scb-dark-gray))')
      .attr('font-size', '16px');
    
    // Add SCB styled icon
    svg.append('circle')
      .attr('cx', (width - 100) / 2)
      .attr('cy', (height - 40) / 2 - 40)
      .attr('r', 20)
      .attr('fill', 'rgba(var(--scb-honolulu-blue), 0.1)');
    
    // Add map coordinates placeholder
    svg.append('text')
      .attr('x', (width - 100) / 2)
      .attr('y', (height - 40) / 2 + 40)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .text('Vietnam and ASEAN Region')
      .attr('font-family', "'72', 'SCProsperSans-Regular', 'Proxima Nova', Arial, sans-serif")
      .attr('fill', 'rgb(var(--scb-dark-gray))')
      .attr('font-size', '12px');
  };

  // Format currency for display
  const formatCurrency = (value: number, currency: string = 'VND') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format date for better UI
  const formatDate = (dateString: Date | string) => {
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return String(dateString);
    }
  };

  // Render AI insights panel with SCB beautiful styling
  const renderInsightsPanel = () => {
    if (!sankeyData?.aiInsights) return null;
    
    const { summary, recommendations, confidence, updatedAt } = sankeyData.aiInsights;
    
    return (
      <StyledCard sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <div className="w-8 h-8 rounded-full bg-[rgba(var(--scb-honolulu-blue),0.1)] flex items-center justify-center">
              <Zap className="w-4 h-4 text-[rgb(var(--scb-honolulu-blue))]" />
            </div>
            <Typography variant="h6" color="rgb(var(--scb-dark-gray))">
              AI-Enhanced Insights
            </Typography>
            <StyledChip 
              label={`${Math.round(confidence * 100)}% confidence`}
              color={confidence > 0.85 ? 'success' : confidence > 0.7 ? 'primary' : 'warning'}
              size="small"
              sx={{ ml: 'auto' }}
            />
          </Box>
          
          <Box className="p-3 bg-[rgba(var(--scb-light-gray),0.2)] rounded-lg mb-3">
            <Typography variant="body2" color="rgb(var(--scb-dark-gray))">
              {summary}
            </Typography>
          </Box>
          
          <Divider sx={{ my: 2, borderColor: 'rgb(var(--scb-border))' }} />
          
          <Typography variant="subtitle2" color="rgb(var(--scb-dark-gray))" gutterBottom>
            Key Recommendations
          </Typography>
          
          <Box sx={{ ml: 1 }}>
            {recommendations.map((rec, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
                <Check size={16} className="text-[rgb(var(--scb-american-green))] mt-0.5" />
                <Typography variant="body2" color="rgb(var(--scb-dark-gray))">
                  {rec}
                </Typography>
              </Box>
            ))}
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            mt: 2, 
            pt: 2, 
            borderTop: '1px dashed rgb(var(--scb-border))' 
          }}>
            <AlertTriangle size={14} className="text-[rgb(var(--warning))]" />
            <Typography variant="caption" color="rgb(var(--scb-dark-gray))" sx={{ opacity: 0.7 }}>
              AI-generated insights based on Monte Carlo simulation results. Updated: {formatDate(updatedAt)}
            </Typography>
          </Box>
        </CardContent>
      </StyledCard>
    );
  };

  // Render impact summary with SCB beautiful styling
  const renderImpactSummary = () => {
    if (!analysisResults?.countrySpecific?.vietnam) return null;
    
    const vietnamData = analysisResults.countrySpecific.vietnam;
    
    return (
      <StyledCard sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <div className="w-8 h-8 rounded-full bg-[rgba(var(--scb-american-green),0.1)] flex items-center justify-center">
              <Globe className="w-4 h-4 text-[rgb(var(--scb-american-green))]" />
            </div>
            <Typography variant="h6" color="rgb(var(--scb-dark-gray))">
              Vietnam Tariff Impact Summary
            </Typography>
          </Box>
          
          <Box className="p-3 bg-[rgba(var(--scb-light-gray),0.2)] rounded-lg mb-3">
            <Typography variant="body2" color="rgb(var(--scb-dark-gray))">
              {vietnamData.impactSummary}
            </Typography>
          </Box>
          
          <Divider sx={{ my: 2, borderColor: 'rgb(var(--scb-border))' }} />
          
          <Typography variant="subtitle2" color="rgb(var(--scb-dark-gray))" gutterBottom>
            Key Findings
          </Typography>
          
          <Box sx={{ ml: 1 }}>
            {vietnamData.keyFindings.map((finding: string, index: number) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
                <ArrowRight size={16} className="text-[rgb(var(--scb-honolulu-blue))] mt-0.5" />
                <Typography variant="body2" color="rgb(var(--scb-dark-gray))">
                  {finding}
                </Typography>
              </Box>
            ))}
          </Box>
          
          <Divider sx={{ my: 2, borderColor: 'rgb(var(--scb-border))' }} />
          
          <Typography variant="subtitle2" color="rgb(var(--scb-dark-gray))" gutterBottom>
            Risk Assessment
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 45%', minWidth: 250 }}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" fontWeight="medium" color="rgb(var(--scb-dark-gray))">
                  High Risk Categories
                </Typography>
              </Box>
              {vietnamData.riskAssessment.highRiskCategories.map((category: string, idx: number) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TrendingUp size={16} className="text-[rgb(var(--scb-muted-red))]" />
                  <Typography variant="body2" color="rgb(var(--scb-dark-gray))">
                    {category}
                  </Typography>
                </Box>
              ))}
            </Box>
            
            <Box sx={{ flex: '1 1 45%', minWidth: 250 }}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" fontWeight="medium" color="rgb(var(--scb-dark-gray))">
                  Low Risk Categories
                </Typography>
              </Box>
              {vietnamData.riskAssessment.lowRiskCategories.map((category: string, idx: number) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TrendingDown size={16} className="text-[rgb(var(--scb-american-green))]" />
                  <Typography variant="body2" color="rgb(var(--scb-dark-gray))">
                    {category}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </CardContent>
      </StyledCard>
    );
  };

  // Render simulation details with SCB beautiful styling
  const renderSimulationDetails = () => {
    if (!analysisResults) return null;
    
    return (
      <>
        <StyledCard>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <div className="w-8 h-8 rounded-full bg-[rgba(var(--scb-honolulu-blue),0.1)] flex items-center justify-center">
                <Activity className="w-4 h-4 text-[rgb(var(--scb-honolulu-blue))]" />
              </div>
              <Typography variant="h6" color="rgb(var(--scb-dark-gray))">
                Simulation Metrics
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flex: '1 1 20%', minWidth: 150 }}>
                <StyledPaper sx={{ p: 2 }}>
                  <Typography variant="caption" color="rgb(var(--scb-dark-gray))" sx={{ opacity: 0.7 }}>
                    Iterations Required
                  </Typography>
                  <Typography variant="h5" fontWeight="medium" color="rgb(var(--scb-dark-gray))">
                    {analysisResults.simulationMetrics.iterationsRequired.toLocaleString()}
                  </Typography>
                </StyledPaper>
              </Box>
              
              <Box sx={{ flex: '1 1 20%', minWidth: 150 }}>
                <StyledPaper sx={{ p: 2 }}>
                  <Typography variant="caption" color="rgb(var(--scb-dark-gray))" sx={{ opacity: 0.7 }}>
                    Confidence Interval
                  </Typography>
                  <Typography variant="body2" fontWeight="medium" color="rgb(var(--scb-dark-gray))">
                    [{analysisResults.simulationMetrics.confidenceInterval[0].toFixed(2)}, {analysisResults.simulationMetrics.confidenceInterval[1].toFixed(2)}]
                  </Typography>
                </StyledPaper>
              </Box>
              
              <Box sx={{ flex: '1 1 20%', minWidth: 150 }}>
                <StyledPaper sx={{ p: 2 }}>
                  <Typography variant="caption" color="rgb(var(--scb-dark-gray))" sx={{ opacity: 0.7 }}>
                    Convergence Achieved
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    {analysisResults.simulationMetrics.convergenceAchieved ? (
                      <Check className="text-[rgb(var(--scb-american-green))]" size={18} />
                    ) : (
                      <AlertTriangle className="text-[rgb(var(--scb-muted-red))]" size={18} />
                    )}
                    <Typography 
                      variant="body2" 
                      fontWeight="medium" 
                      color={analysisResults.simulationMetrics.convergenceAchieved ? 
                        'rgb(var(--scb-american-green))' : 
                        'rgb(var(--scb-muted-red))'
                      }
                    >
                      {analysisResults.simulationMetrics.convergenceAchieved ? 'Yes' : 'No'}
                    </Typography>
                  </Box>
                </StyledPaper>
              </Box>
              
              <Box sx={{ flex: '1 1 20%', minWidth: 150 }}>
                <StyledPaper sx={{ p: 2 }}>
                  <Typography variant="caption" color="rgb(var(--scb-dark-gray))" sx={{ opacity: 0.7 }}>
                    Execution Time
                  </Typography>
                  <Typography variant="h5" fontWeight="medium" color="rgb(var(--scb-dark-gray))">
                    {(analysisResults.simulationMetrics.executionTimeMs / 1000).toFixed(2)}s
                  </Typography>
                </StyledPaper>
              </Box>
            </Box>
          </CardContent>
        </StyledCard>
        
        <StyledCard sx={{ mt: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <div className="w-8 h-8 rounded-full bg-[rgba(var(--scb-american-green),0.1)] flex items-center justify-center">
                <PieChart className="w-4 h-4 text-[rgb(var(--scb-american-green))]" />
              </div>
              <Typography variant="h6" color="rgb(var(--scb-dark-gray))">
                Sensitivity Analysis
              </Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              {analysisResults.simulationMetrics.sensitivityFactors.map((factor: { name: string; sensitivity: number }, idx: number) => (
                <Box key={idx} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight="medium" color="rgb(var(--scb-dark-gray))">
                      {factor.name}
                    </Typography>
                    <Typography variant="body2" color="rgb(var(--scb-dark-gray))">
                      {(factor.sensitivity * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    width: '100%', 
                    height: '10px', 
                    backgroundColor: 'rgba(var(--scb-light-gray), 0.5)',
                    borderRadius: '5px',
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      width: `${factor.sensitivity * 100}%`, 
                      height: '100%', 
                      backgroundColor: 'rgb(var(--scb-honolulu-blue))',
                      borderRadius: '5px'
                    }} />
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </StyledCard>
        
        <StyledCard sx={{ mt: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <div className="w-8 h-8 rounded-full bg-[rgba(var(--scb-honolulu-blue),0.1)] flex items-center justify-center">
                <Globe className="w-4 h-4 text-[rgb(var(--scb-honolulu-blue))]" />
              </div>
              <Typography variant="h6" color="rgb(var(--scb-dark-gray))">
                Regional Impact Summary
              </Typography>
            </Box>
            
            <Box>
              {Object.entries(analysisResults.regionalImpact.asean).map(([country, data]: [string, any]) => (
                <Box key={country} sx={{ mb: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight="medium" color="rgb(var(--scb-dark-gray))">
                        {country.charAt(0).toUpperCase() + country.slice(1)}
                      </Typography>
                      <StyledChip 
                        label={`${Math.round(data.confidence * 100)}%`}
                        color={data.confidence > 0.85 ? 'success' : data.confidence > 0.7 ? 'primary' : 'warning'}
                        size="small"
                      />
                    </Box>
                    
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: data.netTariffImpact > 0 ? 'rgb(var(--scb-american-green))' : 'rgb(var(--scb-muted-red))'
                      }}
                    >
                      {data.netTariffImpact > 0 ? '+' : ''}{data.netTariffImpact.toFixed(1)}%
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    position: 'relative', 
                    height: '14px', 
                    backgroundColor: 'rgba(var(--scb-light-gray), 0.3)',
                    borderRadius: '7px',
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      position: 'absolute',
                      left: '50%',
                      top: 0,
                      bottom: 0,
                      width: `${Math.min(50, Math.abs(data.netTariffImpact) * 5)}%`,
                      backgroundColor: data.netTariffImpact > 0 ? 'rgb(var(--scb-american-green))' : 'rgb(var(--scb-muted-red))',
                      transform: data.netTariffImpact > 0 ? 'none' : 'translateX(-100%)'
                    }} />
                    <Box sx={{ 
                      position: 'absolute',
                      left: '50%',
                      top: 0,
                      bottom: 0,
                      width: '1px',
                      backgroundColor: 'rgb(var(--scb-dark-gray))'
                    }} />
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </StyledCard>
      </>
    );
  };

  // Render visualization controls with SCB beautiful styling
  const renderVisControls = () => {
    return (
      <Box sx={{ 
        display: 'flex', 
        gap: 1, 
        justifyContent: 'flex-end',
        mb: 1
      }}>
        <StyledTooltip title="Zoom out">
          <StyledButton 
            variant="outlined" 
            size="small"
            onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
            aria-label="Zoom out"
            disabled={zoomLevel <= 0.5}
            sx={{ minWidth: 0, width: 36, height: 36, p: 0 }}
          >
            <ZoomOut size={18} />
          </StyledButton>
        </StyledTooltip>
        
        <StyledTooltip title="Zoom in">
          <StyledButton 
            variant="outlined" 
            size="small"
            onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
            aria-label="Zoom in"
            disabled={zoomLevel >= 2}
            sx={{ minWidth: 0, width: 36, height: 36, p: 0 }}
          >
            <ZoomIn size={18} />
          </StyledButton>
        </StyledTooltip>
        
        <StyledTooltip title="Download as PNG">
          <StyledButton 
            variant="outlined" 
            size="small"
            onClick={() => console.log('Download visualization')}
            aria-label="Download"
            sx={{ minWidth: 0, width: 36, height: 36, p: 0 }}
          >
            <Download size={18} />
          </StyledButton>
        </StyledTooltip>
        
        <StyledTooltip title="Share visualization">
          <StyledButton 
            variant="outlined" 
            size="small"
            onClick={() => console.log('Share visualization')}
            aria-label="Share"
            sx={{ minWidth: 0, width: 36, height: 36, p: 0 }}
          >
            <Share2 size={18} />
          </StyledButton>
        </StyledTooltip>
        
        <StyledTooltip title="Reset view">
          <StyledButton 
            variant="outlined" 
            size="small"
            onClick={() => setZoomLevel(1)}
            aria-label="Reset view"
            sx={{ minWidth: 0, width: 36, height: 36, p: 0 }}
          >
            <RefreshCw size={18} />
          </StyledButton>
        </StyledTooltip>
      </Box>
    );
  };

  // Render simulation info panel with SCB beautiful styling
  const renderSimulationInfo = () => {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 2,
        mb: 3,
        p: 2,
        backgroundColor: 'rgba(var(--scb-light-gray), 0.3)',
        borderRadius: '0.25rem',
        border: '1px dashed rgb(var(--scb-border))'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Calendar size={18} className="text-[rgb(var(--scb-honolulu-blue))]" />
          <Typography variant="body2" color="rgb(var(--scb-dark-gray))">
            Time Horizon: <span className="font-medium">{timeHorizon} months</span>
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Activity size={18} className="text-[rgb(var(--scb-honolulu-blue))]" />
          <Typography variant="body2" color="rgb(var(--scb-dark-gray))">
            Iterations: <span className="font-medium">{iterations.toLocaleString()}</span>
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Shield size={18} className="text-[rgb(var(--scb-honolulu-blue))]" />
          <Typography variant="body2" color="rgb(var(--scb-dark-gray))">
            Confidence: <span className="font-medium">{(confidenceLevel * 100).toFixed(0)}%</span>
          </Typography>
        </Box>
        
        {selectedCategories.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Layers size={18} className="text-[rgb(var(--scb-honolulu-blue))]" />
            <Typography variant="body2" color="rgb(var(--scb-dark-gray))">
              Categories: <span className="font-medium">{selectedCategories.length}</span>
            </Typography>
          </Box>
        )}
        
        {selectedCountries.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Globe size={18} className="text-[rgb(var(--scb-honolulu-blue))]" />
            <Typography variant="body2" color="rgb(var(--scb-dark-gray))">
              Countries: <span className="font-medium">{selectedCountries.length}</span>
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <div className={`vietnam-tariff-visualization ${className}`}>
      {isSimulationRunning || isLoading ? (
        <Box 
          sx={{
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '300px',
            backgroundColor: 'rgba(var(--scb-light-gray), 0.2)',
            borderRadius: '0.25rem',
            border: '1px solid rgb(var(--scb-border))'
          }}
        >
          <EnhancedLoadingSpinner message="Running Vietnam tariff impact simulation..." />
          <Typography variant="caption" color="rgb(var(--scb-dark-gray))" sx={{ mt: 1 }}>
            Processing {iterations.toLocaleString()} iterations across {timeHorizon} months
          </Typography>
        </Box>
      ) : (
        <>
          {renderSimulationInfo()}
          
          <StyledTabs 
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons="auto"
            sx={{ mb: 2 }}
          >
            <StyledTab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Activity size={18} />
                  <span>Sankey Diagram</span>
                </Box>
              }
              value="sankey" 
            />
            <StyledTab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Map size={18} />
                  <span>Geographic Impact</span>
                </Box>
              }
              value="geomap" 
            />
            <StyledTab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FileText size={18} />
                  <span>Simulation Details</span>
                </Box>
              }
              value="details" 
            />
          </StyledTabs>
          
          {activeTab === 'sankey' && (
            <Box>
              <StyledCard>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" color="rgb(var(--scb-dark-gray))">
                        Vietnam Tariff Flow Analysis
                      </Typography>
                      <StyledChip 
                        label="AI-Enhanced"
                        color="primary"
                        size="small"
                      />
                    </Box>
                    {renderVisControls()}
                  </Box>
                  
                  <Divider sx={{ mb: 2, borderColor: 'rgb(var(--scb-border))' }} />
                  
                  <Box 
                    ref={sankeyRef} 
                    sx={{ 
                      width: '100%',
                      height: '600px',
                      backgroundColor: '#fff',
                      overflow: 'hidden',
                      borderRadius: '0.25rem'
                    }}
                  />
                </CardContent>
              </StyledCard>
              
              {shouldRenderHeavyViz && renderInsightsPanel()}
            </Box>
          )}
          
          {activeTab === 'geomap' && (
            <Box>
              <StyledCard>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" color="rgb(var(--scb-dark-gray))">
                        Vietnam & ASEAN Tariff Impact Map
                      </Typography>
                      {shouldRenderHeavyViz && (
                        <StyledChip 
                          label="Real-Time Data"
                          color="success"
                          size="small"
                        />
                      )}
                    </Box>
                    {renderVisControls()}
                  </Box>
                  
                  <Divider sx={{ mb: 2, borderColor: 'rgb(var(--scb-border))' }} />
                  
                  <Box 
                    ref={geoMapRef} 
                    sx={{ 
                      width: '100%',
                      height: '500px',
                      backgroundColor: '#fff',
                      overflow: 'hidden',
                      borderRadius: '0.25rem'
                    }}
                  />
                </CardContent>
              </StyledCard>
              
              {shouldRenderHeavyViz && renderImpactSummary()}
            </Box>
          )}
          
          {activeTab === 'details' && (
            <Box>
              <Typography variant="h6" color="rgb(var(--scb-dark-gray))" gutterBottom>
                Vietnam Tariff Impact Simulation Details
              </Typography>
              
              {renderSimulationDetails()}
            </Box>
          )}
        </>
      )}
    </div>
  );
};

export default EnhancedVietnamTariffVisualization;