import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { zoom, ZoomBehavior, D3ZoomEvent } from 'd3-zoom';
import { Card, CardContent, Typography, Box, Tabs, Tab, CircularProgress, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import PerplexityEnhancementBadge from '../common/PerplexityEnhancementBadge';

// Define styled components for SAP Fiori Horizon design
const TreeContainer = styled(Box)(({ theme }) => ({
  height: '600px',
  width: '100%',
  position: 'relative',
  overflow: 'hidden',
  background: theme.palette.mode === 'dark' 
    ? 'linear-gradient(180deg, rgba(18,18,24,1) 0%, rgba(35,35,64,0.95) 100%)' 
    : 'linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(240,244,249,0.95) 100%)',
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[3],
  '& svg': {
    fontFamily: theme.typography.fontFamily,
  },
}));

const NodeTooltip = styled(Box)(({ theme }) => ({
  position: 'absolute',
  pointerEvents: 'none',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1.5),
  boxShadow: theme.shadows[3],
  maxWidth: '300px',
  zIndex: 1000,
  transition: 'opacity 0.3s, transform 0.3s',
  opacity: 0,
  transform: 'translateY(10px)',
  '&.visible': {
    opacity: 1,
    transform: 'translateY(0)',
  },
}));

const ControlsContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(2),
  right: theme.spacing(2),
  zIndex: 10,
  display: 'flex',
  gap: theme.spacing(1),
}));

const NodeChip = styled(Chip)(({ theme }) => ({
  fontWeight: 'bold',
  marginRight: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const InsightPanel = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.mode === 'dark' 
    ? 'rgba(35,35,64,0.9)' 
    : 'rgba(248,250,252,0.9)',
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
}));

// Interfaces
interface MCNode {
  id: string;
  state: any;
  parent: MCNode | null;
  children: MCNode[];
  visits: number;
  value: number;
  untriedActions: any[];
  perplexityConfidence?: number;
  domainRelevance?: number;
}

interface SimulationTreeVisualizationProps {
  rootNode: MCNode;
  width?: number;
  height?: number;
  maxDepth?: number;
  colorByValue?: boolean;
  loading?: boolean;
  insights?: Array<{
    title: string;
    description: string;
    importance: string;
    category: string;
  }>;
}

/**
 * SimulationTreeVisualization renders an interactive D3 visualization of the
 * Monte Carlo Tree Search simulation tree, following SAP Fiori design principles
 * and integrating Perplexity AI enhancements.
 */
const SimulationTreeVisualization: React.FC<SimulationTreeVisualizationProps> = ({
  rootNode,
  width = 1000,
  height = 600,
  maxDepth = 5,
  colorByValue = true,
  loading = false,
  insights = [],
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const [viewMode, setViewMode] = useState<'tree' | 'radial' | 'cluster'>('tree');
  const [selectedNode, setSelectedNode] = useState<MCNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [zoomTransform, setZoomTransform] = useState<d3.ZoomTransform | null>(null);
  const [isColorblindMode, setIsColorblindMode] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [previousViewMode, setPreviousViewMode] = useState<'tree' | 'radial' | 'cluster'>('tree');
  const zoomBehaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  
  // Define colors based on SAP Fiori Horizon palette
  // Define colors based on SAP Fiori Horizon palette with colorblind-safe options
  const fioriColors = {
    primary: '#0070F2',
    secondary: '#6A6D70',
    success: '#107E3E',
    info: '#0A6ED1',
    warning: '#E9730C',
    error: '#BB0000',
    neutral: '#6A6D70',
    shell: '#354A5F',
    shellHover: '#2A3B49',
    
    // Colorblind-safe scales
    // Using a viridis-inspired scale which is perceptually uniform and colorblind-safe
    valueScale: d3.scaleSequential(d3.interpolateViridis)
      .domain([0, 100]),
    
    // Pattern fills for colorblind mode
    patterns: {
      diagonal: 'diagonal',
      dots: 'dots',
      grid: 'grid',
      solid: 'solid'
    },
    
    // Accessibility-enhanced mapping for value ranges
    valueRanges: [
      { min: 0, max: 25, colorClass: 'low-value', pattern: 'dots' },
      { min: 25, max: 50, colorClass: 'medium-low-value', pattern: 'diagonal' },
      { min: 50, max: 75, colorClass: 'medium-high-value', pattern: 'grid' },
      { min: 75, max: 100, colorClass: 'high-value', pattern: 'solid' }
    ]
  };

  useEffect(() => {
    if (!rootNode || loading || !svgRef.current) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();
    
    // Setup the SVG with zoom behavior
    setupZoomBehavior();
    
    // Track view mode change for animations
    if (viewMode !== previousViewMode) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 750); // Animation duration
      setPreviousViewMode(viewMode);
    }

    // Choose visualization based on viewMode
    switch (viewMode) {
      case 'radial':
        renderRadialTree();
        break;
      case 'cluster':
        renderClusterTree();
        break;
      case 'tree':
      default:
        renderHorizontalTree();
        break;
    }
    
    // Add color blind patterns if needed
    if (isColorblindMode) {
      addColorblindPatterns();
    }
  }, [rootNode, viewMode, loading, zoomLevel, isColorblindMode]);
  
  /**
   * Setup zoom behavior with gestures support
   */
  const setupZoomBehavior = useCallback(() => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    
    // Create zoom behavior
    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 5]) // Allow zoom from 0.3x to 5x
      .on('zoom', (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
        // Update transform for all container groups
        svg.selectAll('.viz-container').attr('transform', event.transform.toString());
        
        // Update current zoom level for controls
        setZoomTransform(event.transform);
        setZoomLevel(event.transform.k);
      });
    
    // Apply zoom behavior to SVG
    svg.call(zoomBehavior);
    
    // Store zoom behavior for later use
    zoomBehaviorRef.current = zoomBehavior;
    
    // Reset zoom if needed
    if (zoomTransform) {
      svg.call(zoomBehavior.transform, zoomTransform);
    }
  }, [zoomTransform]);
  
  /**
   * Add colorblind-friendly patterns to SVG
   */
  const addColorblindPatterns = () => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const defs = svg.append('defs');
    
    // Pattern: Diagonal lines
    defs.append('pattern')
      .attr('id', 'pattern-diagonal')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 8)
      .attr('height', 8)
      .append('path')
      .attr('d', 'M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4')
      .attr('stroke', '#000')
      .attr('stroke-width', 1.5)
      .attr('stroke-linecap', 'square');
    
    // Pattern: Dots
    defs.append('pattern')
      .attr('id', 'pattern-dots')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 8)
      .attr('height', 8)
      .append('circle')
      .attr('cx', 4)
      .attr('cy', 4)
      .attr('r', 2)
      .attr('fill', '#000');
    
    // Pattern: Grid
    defs.append('pattern')
      .attr('id', 'pattern-grid')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 8)
      .attr('height', 8)
      .append('path')
      .attr('d', 'M0,0 v8 h8 v-8 h-8 M0,4 h8 M4,0 v8')
      .attr('stroke', '#000')
      .attr('stroke-width', 1)
      .attr('fill', 'none');
  };

  /**
   * Renders a horizontal tree visualization of the MCTS tree
   */
  const renderHorizontalTree = () => {
    const svg = d3.select(svgRef.current);
    const margin = { top: 40, right: 120, bottom: 40, left: 120 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Define the tree layout
    const treeLayout = d3.tree<any>()
      .size([innerHeight, innerWidth])
      .separation((a, b) => (a.parent === b.parent ? 1 : 1.2));
    
    // Convert data to D3 hierarchy
    const treeData = prepareNodeData(rootNode, 0);
    const hierarchyData = d3.hierarchy(treeData);
    
    // Apply the tree layout
    const tree = treeLayout(hierarchyData);
    
    // Create container with zoom capability
    const container = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top}) scale(${zoomLevel})`);
      
    // Create links
    container.selectAll('.link')
      .data(tree.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d3.linkHorizontal<any, any>()
        .x(d => d.y)
        .y(d => d.x)
      )
      .attr('fill', 'none')
      .attr('stroke', theme.palette.divider)
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.7);
    
    // Create nodes
    const nodes = container.selectAll('.node')
      .data(tree.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.y},${d.x})`)
      .on('click', (event, d) => handleNodeClick(d.data.originalNode))
      .on('mouseover', (event, d) => showTooltip(event, d.data.originalNode))
      .on('mouseout', hideTooltip);
    
    // Add circles for nodes with colorblind support
    const nodeCircles = nodes.append('circle')
      .attr('r', d => Math.max(4, Math.min(8, d.data.originalNode.visits / 10)))
      .attr('fill', d => getNodeColor(d.data.originalNode))
      .attr('stroke', theme.palette.background.paper)
      .attr('stroke-width', 1.5)
      .style('transition', 'r 0.3s, fill 0.3s'); // Apple-style smooth transitions
    
    // Add patterns for colorblind mode
    if (isColorblindMode) {
      nodeCircles.attr('fill', d => getNodePattern(d.data.originalNode));
    }
    
    // Add shape indicators for accessibility (square for high value, triangle for medium, etc.)
    nodes.filter(d => d.data.originalNode.value > 0.7)
      .append('rect')
      .attr('width', 6)
      .attr('height', 6)
      .attr('x', -3)
      .attr('y', -3)
      .attr('stroke', theme.palette.background.paper)
      .attr('stroke-width', 0.5)
      .attr('fill', 'none');
      
    // Add business metric annotations to key nodes
    nodes.filter(d => {
      const node = d.data.originalNode;
      // Key nodes: high value, high visits, or Perplexity enhanced
      return node.visits > 75 || node.value > 0.75 || (node.perplexityConfidence && node.perplexityConfidence > 0.8);
    }).append('text')
      .attr('class', 'business-metric')
      .attr('dy', -10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('fill', theme.palette.text.primary)
      .text(d => {
        const node = d.data.originalNode;
        // Generate business metric label based on node properties
        if (node.state && node.state.countries) {
          const country = node.state.countries[0];
          if (country && country.avgTariffRate !== undefined) {
            return `${country.avgTariffRate}% → ${calculateImpact(node)}%`;
          }
        }
        // Fallback if no specific metric is available
        return `${(node.value * 100).toFixed(0)}% opt.`;
      });
    
    // Add Perplexity indicators for enhanced nodes
    nodes.filter(d => d.data.originalNode.perplexityConfidence && d.data.originalNode.perplexityConfidence > 0.7)
      .append('circle')
      .attr('r', 3)
      .attr('cx', 7)
      .attr('cy', -7)
      .attr('fill', fioriColors.success)
      .attr('stroke', theme.palette.background.paper)
      .attr('stroke-width', 1);
    
    // Add labels for important nodes
    nodes.filter(d => d.data.originalNode.visits > 50 || d.depth < 2)
      .append('text')
      .attr('dy', '0.31em')
      .attr('x', d => d.children ? -9 : 9)
      .attr('text-anchor', d => d.children ? 'end' : 'start')
      .text(d => d.data.name)
      .style('font-size', '10px')
      .style('fill', theme.palette.text.secondary)
      .style('pointer-events', 'none');
  };

  /**
   * Renders a radial tree visualization of the MCTS tree
   */
  const renderRadialTree = () => {
    const svg = d3.select(svgRef.current);
    const margin = 40;
    const radius = Math.min(width, height) / 2 - margin;
    
    // Define the radial tree layout
    const treeLayout = d3.tree<any>()
      .size([2 * Math.PI, radius])
      .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);
    
    // Convert data to D3 hierarchy
    const treeData = prepareNodeData(rootNode, 0);
    const hierarchyData = d3.hierarchy(treeData);
    
    // Apply the tree layout
    const tree = treeLayout(hierarchyData);
    
    // Create container with zoom capability
    const container = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2}) scale(${zoomLevel})`);
    
    // Create links
    container.selectAll('.link')
      .data(tree.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d3.linkRadial<any, any>()
        .angle(d => d.x)
        .radius(d => d.y)
      )
      .attr('fill', 'none')
      .attr('stroke', theme.palette.divider)
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.7);
    
    // Create nodes
    const nodes = container.selectAll('.node')
      .data(tree.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `
        translate(${d.y * Math.sin(d.x)},${-d.y * Math.cos(d.x)})
      `)
      .on('click', (event, d) => handleNodeClick(d.data.originalNode))
      .on('mouseover', (event, d) => showTooltip(event, d.data.originalNode))
      .on('mouseout', hideTooltip);
    
    // Add circles for nodes
    nodes.append('circle')
      .attr('r', d => Math.max(3, Math.min(7, d.data.originalNode.visits / 15)))
      .attr('fill', d => getNodeColor(d.data.originalNode))
      .attr('stroke', theme.palette.background.paper)
      .attr('stroke-width', 1);
    
    // Add Perplexity indicators for enhanced nodes
    nodes.filter(d => d.data.originalNode.perplexityConfidence && d.data.originalNode.perplexityConfidence > 0.7)
      .append('circle')
      .attr('r', 2.5)
      .attr('cx', 6)
      .attr('cy', -6)
      .attr('fill', fioriColors.success)
      .attr('stroke', theme.palette.background.paper)
      .attr('stroke-width', 0.5);
  };

  /**
   * Renders a cluster diagram of the MCTS tree
   */
  const renderClusterTree = () => {
    const svg = d3.select(svgRef.current);
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Define the cluster layout
    const clusterLayout = d3.cluster<any>()
      .size([innerHeight, innerWidth]);
    
    // Convert data to D3 hierarchy
    const treeData = prepareNodeData(rootNode, 0);
    const hierarchyData = d3.hierarchy(treeData);
    
    // Apply the cluster layout
    const cluster = clusterLayout(hierarchyData);
    
    // Create container with zoom capability
    const container = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top}) scale(${zoomLevel})`);
    
    // Create links
    container.selectAll('.link')
      .data(cluster.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d3.linkHorizontal<any, any>()
        .x(d => d.y)
        .y(d => d.x)
      )
      .attr('fill', 'none')
      .attr('stroke', theme.palette.divider)
      .attr('stroke-width', 1)
      .attr('opacity', 0.5);
    
    // Create nodes
    const nodes = container.selectAll('.node')
      .data(cluster.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.y},${d.x})`)
      .on('click', (event, d) => handleNodeClick(d.data.originalNode))
      .on('mouseover', (event, d) => showTooltip(event, d.data.originalNode))
      .on('mouseout', hideTooltip);
    
    // Add circles for nodes
    nodes.append('circle')
      .attr('r', d => Math.max(3, Math.min(6, d.data.originalNode.visits / 20)))
      .attr('fill', d => getNodeColor(d.data.originalNode))
      .attr('stroke', theme.palette.background.paper)
      .attr('stroke-width', 1);
  };

  /**
   * Prepare node data for visualization
   */
  const prepareNodeData = (node: MCNode, depth: number = 0): any => {
    if (depth > maxDepth || !node) {
      return null;
    }
    
    // Create children array
    const children = node.children
      .filter((child, i) => i < 10) // Limit to 10 children for performance
      .map(child => prepareNodeData(child, depth + 1))
      .filter(Boolean); // Remove null entries
    
    // Get action for node name
    let nodeName = 'Root';
    if (node.parent) {
      // Extract action from parent-child state difference
      nodeName = getActionName(node.parent.state, node.state);
    }
    
    return {
      name: nodeName,
      originalNode: node,
      children: children
    };
  };

  /**
   * Extract action name from state differences
   */
  const getActionName = (parentState: any, childState: any): string => {
    if (!parentState || !childState) {
      return 'Unknown';
    }
    
    // Simplified logic - in real app should use the actual action that led to this state
    if (childState.countries && parentState.countries) {
      // Check for tariff changes
      for (let i = 0; i < childState.countries.length; i++) {
        const childCountry = childState.countries[i];
        const parentCountry = parentState.countries[i];
        
        if (childCountry && parentCountry && childCountry.avgTariffRate !== parentCountry.avgTariffRate) {
          const diff = childCountry.avgTariffRate - parentCountry.avgTariffRate;
          const sign = diff > 0 ? '+' : '';
          return `${childCountry.name} ${sign}${diff.toFixed(1)}%`;
        }
      }
    }
    
    // Check for policy changes
    if (childState.policies && parentState.policies) {
      for (let i = 0; i < childState.policies.length; i++) {
        const childPolicy = childState.policies[i];
        const parentPolicy = parentState.policies[i];
        
        if (childPolicy && parentPolicy && childPolicy.applied !== parentPolicy.applied && childPolicy.applied) {
          return `Apply ${childPolicy.name}`;
        }
      }
    }
    
    return 'State Change';
  };

  /**
   * Generate a color based on node value with accessibility considerations
   */
  const getNodeColor = (node: MCNode): string => {
    if (!node) return fioriColors.neutral;
    
    if (colorByValue && typeof node.value === 'number') {
      // Map the node value to a 0-100 scale for color
      const normalizedValue = Math.max(0, Math.min(100, 
        50 + (node.value * 50) / (Math.max(1, node.visits) * 0.1)
      ));
      
      return fioriColors.valueScale(normalizedValue);
    }
    
    // Color based on node type
    if (node.perplexityConfidence && node.perplexityConfidence > 0.7) {
      return fioriColors.info;
    }
    
    if (node.visits > 100) {
      return fioriColors.primary;
    }
    
    return fioriColors.secondary;
  };
  
  /**
   * Get pattern for colorblind mode
   */
  const getNodePattern = (node: MCNode): string => {
    if (!node) return 'none';
    
    if (colorByValue && typeof node.value === 'number') {
      // Map the node value to a pattern for colorblind users
      const normalizedValue = Math.max(0, Math.min(100, 
        50 + (node.value * 50) / (Math.max(1, node.visits) * 0.1)
      ));
      
      // Select appropriate pattern based on value range
      for (const range of fioriColors.valueRanges) {
        if (normalizedValue >= range.min && normalizedValue < range.max) {
          return `url(#pattern-${range.pattern})`;
        }
      }
    }
    
    // Default pattern
    return 'url(#pattern-diagonal)';
  };
  
  /**
   * Calculate business impact for annotation
   */
  const calculateImpact = (node: MCNode): string => {
    // Calculate business impact metric for this node
    if (!node || !node.value) return '0';
    
    // Formula based on node value and visits (proxy for confidence)
    const impactValue = node.value * Math.log(node.visits + 1) / Math.log(10);
    const scaledImpact = (impactValue * 10).toFixed(1);
    
    // Show positive or negative impact
    return node.value > 0 ? `+${scaledImpact}` : scaledImpact;
  };

  /**
   * Handle node click event
   */
  const handleNodeClick = (node: MCNode) => {
    setSelectedNode(node === selectedNode ? null : node);
  };

  /**
   * Handle tooltip display
   */
  const showTooltip = (event: any, node: MCNode) => {
    if (!tooltipRef.current || !node) return;
    
    const tooltip = tooltipRef.current;
    
    // Set tooltip content
    tooltip.innerHTML = `
      <div style="font-weight: bold;">Node Info</div>
      <div>Value: ${node.value.toFixed(2)}</div>
      <div>Visits: ${node.visits}</div>
      ${node.perplexityConfidence ? 
        `<div>Perplexity Confidence: ${(node.perplexityConfidence * 100).toFixed(0)}%</div>` : 
        ''}
    `;
    
    // Position tooltip
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      tooltip.style.left = `${event.clientX - rect.left + 10}px`;
      tooltip.style.top = `${event.clientY - rect.top + 10}px`;
    }
    
    // Show tooltip
    tooltip.classList.add('visible');
  };

  /**
   * Hide tooltip
   */
  const hideTooltip = () => {
    if (tooltipRef.current) {
      tooltipRef.current.classList.remove('visible');
    }
  };

  /**
   * Handle view mode change
   */
  const handleViewModeChange = (event: React.SyntheticEvent, newMode: 'tree' | 'radial' | 'cluster') => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Monte Carlo Simulation Tree
            <PerplexityEnhancementBadge />
          </Typography>
          
          {/* Accessibility controls */}
          <Box>
            <Chip 
              label={isColorblindMode ? "Standard Colors" : "Colorblind Mode"} 
              onClick={() => setIsColorblindMode(!isColorblindMode)}
              color={isColorblindMode ? "primary" : "default"}
              size="small"
              sx={{ mr: 1 }}
            />
          </Box>
        </Box>
        
        <Tabs value={viewMode} onChange={handleViewModeChange} centered sx={{ mb: 2 }}>
          <Tab label="Tree View" value="tree" />
          <Tab label="Radial View" value="radial" />
          <Tab label="Cluster View" value="cluster" />
        </Tabs>
        
        <TreeContainer>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <CircularProgress />
            </Box>
          ) : (
            <>
              <svg 
                ref={svgRef} 
                width="100%" 
                height="100%" 
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="xMidYMid meet"
              />
              <NodeTooltip ref={tooltipRef} />
              <ControlsContainer>
                <Typography variant="caption" sx={{ mb: 1, color: 'text.secondary', display: 'block', width: '100%', textAlign: 'center' }}>
                  Pinch or use mousewheel to zoom
                </Typography>
                <Chip icon={<span>+</span>} label="Zoom In" onClick={handleZoomIn} />
                <Chip icon={<span>-</span>} label="Zoom Out" onClick={handleZoomOut} />
                <Chip label="Reset" onClick={handleResetZoom} />
              </ControlsContainer>
            </>
          )}
        </TreeContainer>
        
        {/* Selected Node Info */}
        {selectedNode && (
          <Box mt={2} p={2} bgcolor={theme.palette.mode === 'dark' ? 'rgba(35,35,64,0.6)' : 'rgba(248,250,252,0.9)'} borderRadius={1}>
            <Typography variant="subtitle1" gutterBottom>
              Selected Node Details
            </Typography>
            <Box display="flex" flexWrap="wrap">
              <NodeChip 
                label={`Value: ${selectedNode.value.toFixed(2)}`} 
                color="primary" 
              />
              <NodeChip 
                label={`Visits: ${selectedNode.visits}`} 
                color="secondary" 
              />
              {selectedNode.perplexityConfidence && (
                <NodeChip 
                  label={`Perplexity Confidence: ${(selectedNode.perplexityConfidence * 100).toFixed(0)}%`} 
                  color="success" 
                />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" mt={1}>
              This node represents a state where {getActionName(selectedNode.parent?.state, selectedNode.state)} occurred.
              {selectedNode.perplexityConfidence && selectedNode.perplexityConfidence > 0.8 && 
                " Perplexity AI has high confidence that this is a significant state to consider."}
            </Typography>
          </Box>
        )}
        
        {/* AI Insights */}
        {insights && insights.length > 0 && (
          <InsightPanel>
            <Box display="flex" alignItems="center" mb={1}>
              <Typography variant="subtitle1">AI-Generated Insights</Typography>
              <PerplexityEnhancementBadge showDetails={true} />
            </Box>
            
            {insights.map((insight, index) => (
              <Box key={index} mb={2}>
                <Typography variant="subtitle2" color={
                  insight.importance === 'high' ? fioriColors.error :
                  insight.importance === 'medium' ? fioriColors.warning :
                  fioriColors.info
                }>
                  {insight.title}
                </Typography>
                <Typography variant="body2">
                  {insight.description}
                </Typography>
              </Box>
            ))}
          </InsightPanel>
        )}
      </CardContent>
    </Card>
  );
};

export default SimulationTreeVisualization;
