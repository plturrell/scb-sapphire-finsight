import React, { useRef, useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Select, 
  MenuItem, 
  InputLabel, 
  FormControl,
  Tooltip,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Slider,
  ButtonGroup,
  Button,
  CircularProgress,
  Divider,
  alpha,
  useTheme
} from '@mui/material';
import { animated, useSpring, config } from '@react-spring/web';
import * as d3 from 'd3';
import 'd3-sankey';
import { 
  DataIcon,
  SparklesIcon,
  ChartIcon,
  FinanceIcon,
  ChevronIcon
} from './icons';
import PerplexityParticles from './effects/PerplexityParticles';
import useEnhancedMicroInteractions from '../hooks/useEnhancedMicroInteractions';

// Standard colors for the application
const PRIMARY_COLOR = '#042278';
const ACCENT_COLOR = '#31ddc1';
const HIGHLIGHT_COLOR = '#ff6b3d';

// Node and link interfaces
interface SankeyNode {
  name: string;
  category: string;
  value: number;
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
  index?: number;
  targetLinks?: SankeyLink[];
  sourceLinks?: SankeyLink[];
  highlight?: boolean;
  color?: string;
}

interface SankeyLink {
  source: number | SankeyNode;
  target: number | SankeyNode;
  value: number;
  path?: string;
  color?: string;
  opacity?: number;
  y0?: number;
  y1?: number;
  width?: number;
  highlight?: boolean;
}

interface NodeGroup {
  category: string;
  label: string;
  color: string;
  description: string;
  nodes: string[];
}

interface EnhancedSankeyDiagramProps {
  data?: { nodes: SankeyNode[]; links: SankeyLink[] };
  width?: number;
  height?: number;
  nodeWidth?: number;
  nodePadding?: number;
  nodeGroups?: NodeGroup[];
  title?: string;
  subtitle?: string;
  aiEnhanced?: boolean;
  loading?: boolean;
  interactive?: boolean;
  customColors?: string[];
  showLegend?: boolean;
  showControls?: boolean;
  reduceAnimations?: boolean;
  variant?: 'standard' | 'compact' | 'detailed';
  onNodeClick?: (node: SankeyNode) => void;
  onLinkClick?: (link: SankeyLink) => void;
}

const EnhancedSankeyDiagram: React.FC<EnhancedSankeyDiagramProps> = ({
  data = { nodes: [], links: [] },
  width = 800,
  height = 500,
  nodeWidth = 20,
  nodePadding = 10,
  nodeGroups = [],
  title = "Tariff Flow Visualization",
  subtitle = "Interactive Sankey diagram showing tariff impacts across trade pathways",
  aiEnhanced = true,
  loading = false,
  interactive = true,
  customColors,
  showLegend = true,
  showControls = true,
  reduceAnimations = false,
  variant = 'standard',
  onNodeClick,
  onLinkClick,
}) => {
  const theme = useTheme();
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<SankeyNode | null>(null);
  const [selectedLink, setSelectedLink] = useState<SankeyLink | null>(null);
  const [hoveredNode, setHoveredNode] = useState<SankeyNode | null>(null);
  const [hoveredLink, setHoveredLink] = useState<SankeyLink | null>(null);
  const [layoutIterations, setLayoutIterations] = useState(32);
  const [showParticles, setShowParticles] = useState(!reduceAnimations);
  const [alignMethod, setAlignMethod] = useState<'justify' | 'center' | 'left' | 'right'>('justify');
  
  // Get our micro-interactions
  const { 
    createAnimation, 
    FadeIn, 
    SlideUp, 
    Pulse 
  } = useEnhancedMicroInteractions();
  
  // Adjust dimensions for padding
  const margin = useMemo(() => ({ top: 30, right: 30, bottom: 30, left: 30 }), []);
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  
  // Create a color scale for nodes based on their category
  const colorScale = useMemo(() => {
    const defaultColors = [
      '#042278', // Primary
      '#31ddc1', // Accent
      '#ff6b3d', // Highlight
      '#58a6ff', // Blue alternate
      '#f7c948', // Yellow
      '#6a5acd', // Slate blue
      '#2e7d32', // Forest green
      '#d32f2f', // Red
      '#9c27b0', // Purple
      '#0097a7', // Teal
    ];
    
    const colors = customColors || defaultColors;
    const categories = [...new Set(data.nodes.map(node => node.category))];
    
    // First check if we have predefined groups with colors
    const categoryColors = new Map();
    if (nodeGroups.length > 0) {
      nodeGroups.forEach(group => {
        categoryColors.set(group.category, group.color);
      });
    }
    
    // Then fill in any missing categories with scale colors
    categories.forEach((category, i) => {
      if (!categoryColors.has(category)) {
        categoryColors.set(category, colors[i % colors.length]);
      }
    });
    
    return (category: string) => categoryColors.get(category) || colors[0];
  }, [data.nodes, nodeGroups, customColors]);
  
  // Calculate the actual data for the Sankey diagram
  const sankeyData = useMemo(() => {
    // Create a deep copy to avoid mutating the original data
    const nodes = data.nodes.map(node => ({
      ...node,
      x0: undefined,
      x1: undefined,
      y0: undefined,
      y1: undefined,
      sourceLinks: [],
      targetLinks: [],
      highlight: selectedNode ? 
        (node.name === selectedNode.name || 
         (data.links.some(link => 
           (link.source === selectedNode.index && link.target === node.index) || 
           (link.target === selectedNode.index && link.source === node.index)
         ))
        ) : false,
      color: node.color || colorScale(node.category),
    }));
    
    // For links, adjust sources and targets to be indices
    const links = data.links.map(link => {
      let source: number;
      let target: number;
      
      // Handle the case where source and target are already indices
      if (typeof link.source === 'number') {
        source = link.source;
      } else if (typeof link.source === 'object' && 'index' in link.source && typeof link.source.index === 'number') {
        source = link.source.index;
      } else {
        source = nodes.findIndex(node => node.name === (typeof link.source === 'object' ? link.source.name : link.source));
      }
      
      if (typeof link.target === 'number') {
        target = link.target;
      } else if (typeof link.target === 'object' && 'index' in link.target && typeof link.target.index === 'number') {
        target = link.target.index;
      } else {
        target = nodes.findIndex(node => node.name === (typeof link.target === 'object' ? link.target.name : link.target));
      }
      
      return {
        ...link,
        source,
        target,
        highlight: selectedNode ? 
          ((source === selectedNode.index) || (target === selectedNode.index)) : false,
        color: link.color || (typeof source === 'object' ? colorScale((source as SankeyNode).category) : undefined),
        opacity: link.opacity || 0.6,
      };
    });
    
    return { nodes, links };
  }, [data, colorScale, selectedNode]);
  
  // Generate Sankey layout
  useEffect(() => {
    if (!svgRef.current || sankeyData.nodes.length === 0 || sankeyData.links.length === 0) return;
    
    // Reset any existing SVG content
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    
    // Create the Sankey generator
    const sankey = d3.sankey()
      .nodeWidth(nodeWidth)
      .nodePadding(nodePadding)
      .extent([[margin.left, margin.top], [innerWidth, innerHeight]])
      .nodeAlign(d3[`sankey${alignMethod.charAt(0).toUpperCase() + alignMethod.slice(1)}`])
      .iterations(layoutIterations);
    
    // Generate the Sankey layout
    const { nodes, links } = sankey(sankeyData);
    
    // Create the node groups
    const nodeGroup = svg.append("g")
      .selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.x0},${d.y0})`)
      .style("cursor", interactive ? "pointer" : "default");
    
    // Add node rectangles with animations
    nodeGroup.append("rect")
      .attr("height", d => Math.max(1, d.y1 - d.y0))
      .attr("width", d => d.x1 - d.x0)
      .attr("rx", 3) // Rounded corners
      .attr("ry", 3)
      .attr("fill", d => d.color || colorScale(d.category || ''))
      .attr("stroke", d => d3.color(d.color || colorScale(d.category || ''))?.darker(0.5) as unknown as string)
      .attr("stroke-width", 0.5)
      .attr("opacity", 0)
      .transition()
      .duration(reduceAnimations ? 0 : 1000)
      .delay((_, i) => reduceAnimations ? 0 : i * 20)
      .attr("opacity", d => d.highlight ? 1 : hoveredNode ? (
        d.name === hoveredNode.name ? 1 : 0.6
      ) : 0.9);
    
    // Add node labels with animation
    nodeGroup.append("text")
      .attr("x", d => d.x0 < innerWidth / 2 ? nodeWidth + 5 : -5)
      .attr("y", d => (d.y1 - d.y0) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", d => d.x0 < innerWidth / 2 ? "start" : "end")
      .text(d => d.name)
      .style("font-size", "11px")
      .style("font-weight", d => d.highlight ? "bold" : "normal")
      .style("fill", d => d.highlight ? "#000" : "#555")
      .style("pointer-events", "none")
      .attr("opacity", 0)
      .transition()
      .duration(reduceAnimations ? 0 : 1200)
      .delay((_, i) => reduceAnimations ? 0 : 500 + i * 20)
      .attr("opacity", 1);
    
    // Handle node events if interactive
    if (interactive) {
      nodeGroup
        .on("mouseenter", (event, d) => {
          setHoveredNode(d as unknown as SankeyNode);
          const tooltip = d3.select("#sankeyTooltip");
          tooltip.style("visibility", "visible")
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`);
        })
        .on("mousemove", (event) => {
          const tooltip = d3.select("#sankeyTooltip");
          tooltip.style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`);
        })
        .on("mouseleave", () => {
          setHoveredNode(null);
          d3.select("#sankeyTooltip").style("visibility", "hidden");
        })
        .on("click", (_, d) => {
          setSelectedNode(selectedNode && selectedNode.name === d.name ? null : d as unknown as SankeyNode);
          if (onNodeClick) onNodeClick(d as unknown as SankeyNode);
        });
    }
    
    // Create the link groups
    const linkGenerator = d3.sankeyLinkHorizontal();
    
    const linkGroup = svg.append("g")
      .selectAll(".link")
      .data(links)
      .enter()
      .append("g")
      .attr("class", "link")
      .style("cursor", interactive ? "pointer" : "default");
    
    // Add link paths with animation
    linkGroup.append("path")
      .attr("d", linkGenerator)
      .attr("fill", "none")
      .attr("stroke", d => d.color || colorScale((d.source as SankeyNode).category || ''))
      .attr("stroke-width", d => Math.max(1, d.width || 0))
      .attr("stroke-opacity", d => d.opacity || 0.4)
      .attr("stroke-dasharray", function() {
        const length = this.getTotalLength();
        return `${length} ${length}`;
      })
      .attr("stroke-dashoffset", function() {
        return this.getTotalLength();
      })
      .transition()
      .duration(reduceAnimations ? 0 : 1500)
      .delay((_, i) => reduceAnimations ? 0 : i * 10)
      .attr("stroke-dashoffset", 0);
    
    // Handle link events if interactive
    if (interactive) {
      linkGroup
        .on("mouseenter", (event, d) => {
          setHoveredLink(d as unknown as SankeyLink);
          const tooltip = d3.select("#sankeyTooltip");
          tooltip.style("visibility", "visible")
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`);
        })
        .on("mousemove", (event) => {
          const tooltip = d3.select("#sankeyTooltip");
          tooltip.style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`);
        })
        .on("mouseleave", () => {
          setHoveredLink(null);
          d3.select("#sankeyTooltip").style("visibility", "hidden");
        })
        .on("click", (_, d) => {
          setSelectedLink(selectedLink && 
            selectedLink.source === d.source && 
            selectedLink.target === d.target ? null : d as unknown as SankeyLink);
          if (onLinkClick) onLinkClick(d as unknown as SankeyLink);
        });
    }
    
    // Update highlighting when selected/hovered items change
    const updateHighlighting = () => {
      svg.selectAll(".node rect")
        .transition()
        .duration(reduceAnimations ? 0 : 300)
        .attr("opacity", d => {
          if (hoveredNode) {
            if (d.name === hoveredNode.name) return 1;
            
            // Check if this node is connected to the hovered node
            const isConnected = links.some(link => {
              const sourceName = typeof link.source === 'object' ? link.source.name : '';
              const targetName = typeof link.target === 'object' ? link.target.name : '';
              return (sourceName === hoveredNode.name && targetName === d.name) ||
                   (targetName === hoveredNode.name && sourceName === d.name);
            });
            
            return isConnected ? 0.9 : 0.3;
          }
          
          if (hoveredLink) {
            if (d.name === hoveredLink.source.name || d.name === hoveredLink.target.name) return 1;
            return 0.3;
          }
          
          if (selectedNode) {
            if (d.name === selectedNode.name) return 1;
            
            // Check if this node is connected to the selected node
            const isConnected = links.some(link => {
              const sourceName = typeof link.source === 'object' ? link.source.name : '';
              const targetName = typeof link.target === 'object' ? link.target.name : '';
              return (sourceName === selectedNode.name && targetName === d.name) ||
                   (targetName === selectedNode.name && sourceName === d.name);
            });
            
            return isConnected ? 0.9 : 0.4;
          }
          
          return 0.9;
        });
      
      svg.selectAll(".link path")
        .transition()
        .duration(reduceAnimations ? 0 : 300)
        .attr("stroke-opacity", d => {
          if (hoveredNode) {
            const sourceName = typeof d.source === 'object' ? d.source.name : '';
            const targetName = typeof d.target === 'object' ? d.target.name : '';
            if (sourceName === hoveredNode.name || targetName === hoveredNode.name) return 0.8;
            return 0.1;
          }
          
          if (hoveredLink) {
            const sourceName = typeof d.source === 'object' ? d.source.name : '';
            const targetName = typeof d.target === 'object' ? d.target.name : '';
            const hoveredSourceName = typeof hoveredLink.source === 'object' ? hoveredLink.source.name : '';
            const hoveredTargetName = typeof hoveredLink.target === 'object' ? hoveredLink.target.name : '';
            if (sourceName === hoveredSourceName && targetName === hoveredTargetName) return 0.8;
            return 0.1;
          }
          
          if (selectedNode) {
            const sourceName = typeof d.source === 'object' ? d.source.name : '';
            const targetName = typeof d.target === 'object' ? d.target.name : '';
            if (sourceName === selectedNode.name || targetName === selectedNode.name) return 0.8;
            return 0.2;
          }
          
          return d.opacity || 0.4;
        });
      
      svg.selectAll(".node text")
        .transition()
        .duration(reduceAnimations ? 0 : 300)
        .style("font-weight", d => {
          if (hoveredNode && (d.name === hoveredNode.name)) return "bold";
          if (hoveredLink && (d.name === hoveredLink.source.name || d.name === hoveredLink.target.name)) return "bold";
          if (selectedNode && (d.name === selectedNode.name)) return "bold";
          return "normal";
        })
        .style("fill", d => {
          if (hoveredNode && (d.name === hoveredNode.name)) return "#000";
          if (hoveredLink && (d.name === hoveredLink.source.name || d.name === hoveredLink.target.name)) return "#000";
          if (selectedNode && (d.name === selectedNode.name)) return "#000";
          return "#555";
        });
    };
    
    // Call the update function when these deps change
    updateHighlighting();
  }, [
    innerWidth, 
    innerHeight, 
    margin, 
    sankeyData, 
    nodeWidth, 
    nodePadding, 
    colorScale, 
    hoveredNode, 
    hoveredLink, 
    selectedNode, 
    selectedLink, 
    interactive,
    alignMethod,
    layoutIterations,
    reduceAnimations
  ]);
  
  // Tooltip content
  const tooltipContent = useMemo(() => {
    if (hoveredNode) {
      const sourceLinks = data.links.filter(link => 
        (typeof link.source === 'object' ? link.source.name : data.nodes[link.source as number]?.name) === hoveredNode.name
      );
      
      const targetLinks = data.links.filter(link => 
        (typeof link.target === 'object' ? link.target.name : data.nodes[link.target as number]?.name) === hoveredNode.name
      );
      
      const totalInflow = targetLinks.reduce((sum, link) => sum + link.value, 0);
      const totalOutflow = sourceLinks.reduce((sum, link) => sum + link.value, 0);
      
      const nodeGroup = nodeGroups.find(group => group.category === hoveredNode.category);
      
      return (
        <Box sx={{ p: 1.5, maxWidth: 300 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            {hoveredNode.name}
          </Typography>
          
          {nodeGroup && (
            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={nodeGroup.label} 
                size="small" 
                style={{ 
                  backgroundColor: alpha(nodeGroup.color, 0.1),
                  color: nodeGroup.color,
                  height: 20,
                  fontSize: '0.6875rem',
                }}
              />
              {hoveredNode.value && (
                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                  Value: {hoveredNode.value.toLocaleString()}
                </Typography>
              )}
            </Box>
          )}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                Total inflow:
              </Typography>
              <Typography variant="caption" fontWeight={500}>
                {totalInflow.toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                Total outflow:
              </Typography>
              <Typography variant="caption" fontWeight={500}>
                {totalOutflow.toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </Box>
      );
    }
    
    if (hoveredLink) {
      const sourceName = typeof hoveredLink.source === 'object' 
        ? hoveredLink.source.name 
        : data.nodes[hoveredLink.source as number]?.name;
      
      const targetName = typeof hoveredLink.target === 'object' 
        ? hoveredLink.target.name 
        : data.nodes[hoveredLink.target as number]?.name;
      
      return (
        <Box sx={{ p: 1.5, maxWidth: 250 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Flow Details
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                From:
              </Typography>
              <Typography variant="caption" fontWeight={500}>
                {sourceName}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                To:
              </Typography>
              <Typography variant="caption" fontWeight={500}>
                {targetName}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Value:
              </Typography>
              <Typography variant="caption" fontWeight={600}>
                {hoveredLink.value.toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </Box>
      );
    }
    
    return null;
  }, [hoveredNode, hoveredLink, data, nodeGroups]);
  
  // Animation springs
  const containerSpring = useSpring({
    opacity: 1,
    transform: 'translateY(0)',
    from: { opacity: 0, transform: 'translateY(20px)' },
    config: config.gentle,
    immediate: reduceAnimations,
  });
  
  const controlsSpring = useSpring({
    opacity: 1,
    height: showControls ? 'auto' : 0,
    from: { opacity: 0, height: 0 },
    config: config.stiff,
    immediate: reduceAnimations,
  });
  
  return (
    <animated.div style={containerSpring}>
      <Box sx={{ width: '100%', mb: 4 }}>
        {/* Header */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            mb: 2 
          }}
        >
          <Box>
            <Typography 
              variant="h5" 
              component={reduceAnimations ? 'h2' : FadeIn}
              sx={{ 
                fontWeight: 600, 
                display: 'flex',
                alignItems: 'center',
                color: PRIMARY_COLOR 
              }}
            >
              <DataIcon
                variant="sankey"
                size={26}
                style={{ marginRight: 10 }}
                animation={reduceAnimations ? "none" : "pulse"}
                color={ACCENT_COLOR}
              />
              {title}
              {aiEnhanced && (
                <SparklesIcon
                  size={16}
                  style={{ marginLeft: 8 }}
                  animation={reduceAnimations ? "none" : "pulse"}
                  color={ACCENT_COLOR}
                />
              )}
            </Typography>
            {subtitle && (
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ mt: 0.5, maxWidth: 700 }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          
          {/* Controls toggle */}
          {showControls && (
            <Button
              size="small"
              variant="outlined"
              endIcon={<ChevronIcon direction={showControls ? 'up' : 'down'} size={14} />}
              onClick={() => setShowParticles(!showParticles)}
              sx={{ 
                textTransform: 'none',
                color: PRIMARY_COLOR,
                borderColor: alpha(PRIMARY_COLOR, 0.5),
              }}
            >
              {showParticles ? 'Hide' : 'Show'} Effects
            </Button>
          )}
        </Box>
        
        {/* Legend */}
        {showLegend && nodeGroups.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {nodeGroups.map((group) => (
              <Chip
                key={group.category}
                label={group.label}
                size="small"
                icon={
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: group.color,
                      ml: 1,
                    }}
                  />
                }
                sx={{
                  backgroundColor: alpha(group.color, 0.1),
                  color: theme.palette.getContrastText(alpha(group.color, 0.1)),
                  height: 24,
                  '& .MuiChip-icon': {
                    order: 1,
                    ml: 0,
                    mr: -0.5,
                  },
                  '& .MuiChip-label': {
                    px: 1,
                  },
                }}
              />
            ))}
          </Box>
        )}
        
        {/* Controls */}
        {showControls && (
          <animated.div style={controlsSpring}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 3,
                border: '1px solid',
                borderColor: theme.palette.divider,
                borderRadius: 1,
              }}
            >
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Layout Alignment
                    </Typography>
                    <ButtonGroup size="small" aria-label="alignment method">
                      <Button 
                        variant={alignMethod === 'justify' ? 'contained' : 'outlined'}
                        onClick={() => setAlignMethod('justify')}
                        sx={{ 
                          textTransform: 'none',
                          bgcolor: alignMethod === 'justify' ? PRIMARY_COLOR : 'transparent',
                          color: alignMethod === 'justify' ? 'white' : PRIMARY_COLOR,
                          '&:hover': {
                            bgcolor: alignMethod === 'justify' ? alpha(PRIMARY_COLOR, 0.9) : alpha(PRIMARY_COLOR, 0.1),
                          }
                        }}
                      >
                        Justify
                      </Button>
                      <Button 
                        variant={alignMethod === 'left' ? 'contained' : 'outlined'}
                        onClick={() => setAlignMethod('left')}
                        sx={{ 
                          textTransform: 'none',
                          bgcolor: alignMethod === 'left' ? PRIMARY_COLOR : 'transparent',
                          color: alignMethod === 'left' ? 'white' : PRIMARY_COLOR,
                          '&:hover': {
                            bgcolor: alignMethod === 'left' ? alpha(PRIMARY_COLOR, 0.9) : alpha(PRIMARY_COLOR, 0.1),
                          }
                        }}
                      >
                        Left
                      </Button>
                      <Button 
                        variant={alignMethod === 'center' ? 'contained' : 'outlined'}
                        onClick={() => setAlignMethod('center')}
                        sx={{ 
                          textTransform: 'none',
                          bgcolor: alignMethod === 'center' ? PRIMARY_COLOR : 'transparent',
                          color: alignMethod === 'center' ? 'white' : PRIMARY_COLOR,
                          '&:hover': {
                            bgcolor: alignMethod === 'center' ? alpha(PRIMARY_COLOR, 0.9) : alpha(PRIMARY_COLOR, 0.1),
                          }
                        }}
                      >
                        Center
                      </Button>
                      <Button 
                        variant={alignMethod === 'right' ? 'contained' : 'outlined'}
                        onClick={() => setAlignMethod('right')}
                        sx={{ 
                          textTransform: 'none',
                          bgcolor: alignMethod === 'right' ? PRIMARY_COLOR : 'transparent',
                          color: alignMethod === 'right' ? 'white' : PRIMARY_COLOR,
                          '&:hover': {
                            bgcolor: alignMethod === 'right' ? alpha(PRIMARY_COLOR, 0.9) : alpha(PRIMARY_COLOR, 0.1),
                          }
                        }}
                      >
                        Right
                      </Button>
                    </ButtonGroup>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle2">
                        Layout Iterations
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {layoutIterations}
                      </Typography>
                    </Box>
                    <Slider
                      value={layoutIterations}
                      min={1}
                      max={64}
                      step={1}
                      onChange={(_, value) => setLayoutIterations(value as number)}
                      sx={{
                        '& .MuiSlider-thumb': {
                          backgroundColor: PRIMARY_COLOR,
                        },
                        '& .MuiSlider-track': {
                          backgroundColor: PRIMARY_COLOR,
                        },
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </animated.div>
        )}
        
        {/* Main visualization */}
        <Paper
          elevation={0}
          sx={{
            position: 'relative',
            width: '100%',
            height: height,
            borderRadius: 2,
            border: '1px solid',
            borderColor: theme.palette.divider,
            overflow: 'hidden',
          }}
        >
          {/* Background particles if enabled */}
          {showParticles && !reduceAnimations && (
            <Box sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0,
              opacity: 0.07,
              pointerEvents: 'none',
            }}>
              <PerplexityParticles 
                active={true}
                count={40}
                color="#042278" 
                speed={0.3}
                opacity={0.7}
                style={{ height: '100%', width: '100%' }}
              />
            </Box>
          )}
          
          {/* Loading state */}
          {loading ? (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255,255,255,0.6)',
                zIndex: 10,
              }}
            >
              <CircularProgress size={40} sx={{ color: ACCENT_COLOR, mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Generating Sankey diagram...
              </Typography>
            </Box>
          ) : (
            <>
              {/* Tooltip */}
              <Tooltip
                id="sankeyTooltip"
                sx={{
                  position: 'absolute',
                  visibility: 'hidden',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  borderRadius: 1,
                  zIndex: 1000,
                  maxWidth: 300,
                  width: 'auto',
                  p: 0,
                  border: '1px solid',
                  borderColor: theme.palette.divider,
                }}
              >
                {tooltipContent}
              </Tooltip>
              
              {/* SVG for Sankey diagram */}
              <svg
                ref={svgRef}
                width={width}
                height={height}
                style={{ display: 'block' }}
              />
              
              {/* Selected node/link details panel */}
              {(selectedNode || selectedLink) && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 16,
                    right: 16,
                    width: 300,
                    bgcolor: 'white',
                    borderRadius: 1,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    border: '1px solid',
                    borderColor: theme.palette.divider,
                    zIndex: 5,
                    overflow: 'hidden',
                  }}
                  component={reduceAnimations ? 'div' : SlideUp}
                >
                  <Box
                    sx={{
                      p: 2,
                      pb: 1.5,
                      borderBottom: '1px solid',
                      borderColor: theme.palette.divider,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {selectedNode ? (
                        <>
                          <ChartIcon
                            variant="pie"
                            size={16}
                            style={{ marginRight: 6 }}
                            animation={reduceAnimations ? "none" : "pulse"}
                            color={ACCENT_COLOR}
                          />
                          Node Details
                        </>
                      ) : (
                        <>
                          <DataIcon
                            variant="sankey"
                            size={16}
                            style={{ marginRight: 6 }}
                            animation={reduceAnimations ? "none" : "pulse"}
                            color={ACCENT_COLOR}
                          />
                          Link Details
                        </>
                      )}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedNode(null);
                        setSelectedLink(null);
                      }}
                      sx={{ color: 'text.secondary' }}
                    >
                      <ChevronIcon direction="down" size={16} />
                    </IconButton>
                  </Box>
                  <Box sx={{ p: 2 }}>
                    {selectedNode && (
                      <>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                          {selectedNode.name}
                        </Typography>
                        
                        <Box sx={{ mb: 1 }}>
                          {nodeGroups.find(g => g.category === selectedNode.category) && (
                            <Chip
                              label={nodeGroups.find(g => g.category === selectedNode.category)?.label}
                              size="small"
                              sx={{
                                backgroundColor: alpha(colorScale(selectedNode.category), 0.1),
                                color: colorScale(selectedNode.category),
                                height: 24,
                                mb: 1,
                              }}
                            />
                          )}
                          
                          {nodeGroups.find(g => g.category === selectedNode.category)?.description && (
                            <Typography variant="body2" color="text.secondary" paragraph>
                              {nodeGroups.find(g => g.category === selectedNode.category)?.description}
                            </Typography>
                          )}
                        </Box>
                        
                        <Divider sx={{ my: 1.5 }} />
                        
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Value
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {selectedNode.value?.toLocaleString() || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Category
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {selectedNode.category}
                            </Typography>
                          </Grid>
                        </Grid>
                      </>
                    )}
                    
                    {selectedLink && (
                      <>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                          Flow Information
                        </Typography>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            This link represents a flow of value between two nodes in the system.
                          </Typography>
                        </Box>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">
                              From
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {typeof selectedLink.source === 'object' 
                                ? selectedLink.source.name 
                                : data.nodes[selectedLink.source as number]?.name}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">
                              To
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {typeof selectedLink.target === 'object' 
                                ? selectedLink.target.name 
                                : data.nodes[selectedLink.target as number]?.name}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Divider sx={{ my: 0.5 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                Value
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {selectedLink.value.toLocaleString()}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </>
                    )}
                  </Box>
                </Box>
              )}
            </>
          )}
        </Paper>
      </Box>
    </animated.div>
  );
};

// Default data for testing
EnhancedSankeyDiagram.defaultProps = {
  data: {
    nodes: [
      { name: "Agricultural Products", category: "source", value: 10 },
      { name: "Electronics", category: "source", value: 20 },
      { name: "Textiles", category: "source", value: 15 },
      { name: "EU", category: "destination", value: 20 },
      { name: "ASEAN", category: "destination", value: 15 },
      { name: "United States", category: "destination", value: 10 }
    ],
    links: [
      { source: 0, target: 3, value: 5 },
      { source: 0, target: 4, value: 3 },
      { source: 0, target: 5, value: 2 },
      { source: 1, target: 3, value: 8 },
      { source: 1, target: 4, value: 7 },
      { source: 1, target: 5, value: 5 },
      { source: 2, target: 3, value: 7 },
      { source: 2, target: 4, value: 5 },
      { source: 2, target: 5, value: 3 }
    ]
  },
  nodeGroups: [
    { 
      category: "source", 
      label: "Product Categories", 
      color: "#31ddc1",
      description: "Product categories represent the different types of goods exported from Vietnam.",
      nodes: ["Agricultural Products", "Electronics", "Textiles"]
    },
    { 
      category: "destination", 
      label: "Destinations", 
      color: "#042278",
      description: "Destination markets for Vietnamese exports, showing the flow of goods to different regions.",
      nodes: ["EU", "ASEAN", "United States"]
    }
  ]
};

export default EnhancedSankeyDiagram;