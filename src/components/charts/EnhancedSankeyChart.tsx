import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal, SankeyGraph } from 'd3-sankey';
import { 
  Sparkles, Info, Edit, Download, RefreshCw, Maximize, Minimize, 
  ZoomIn, ZoomOut, X, BarChart3, ChevronDown, Eye, EyeOff 
} from 'lucide-react';
import { SankeyData, SankeyLink, SankeyNode } from '../../types';
import { EnhancedInlineSpinner } from '../EnhancedLoadingSpinner';
import useNetworkAwareLoading from '../../hooks/useNetworkAwareLoading';
import useDeviceCapabilities from '../../hooks/useDeviceCapabilities';

// Type definitions for D3 Sankey's internal representations
interface D3SankeyNode extends SankeyNode {
  index: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  sourceLinks: D3SankeyLink[];
  targetLinks: D3SankeyLink[];
}

interface D3SankeyLink extends Omit<SankeyLink, 'source' | 'target'> {
  source: D3SankeyNode;
  target: D3SankeyNode;
  path?: string;
  width: number; // D3 Sankey adds this property during layout calculation
  originalValue?: number; // For AI enhanced links
}

interface EnhancedSankeyChartProps {
  data: SankeyData;
  width?: number;
  height?: number;
  title?: string;
  subtitle?: string;
  showAIControls?: boolean;
  showLegend?: boolean;
  isLoading?: boolean;
  adaptiveLayout?: boolean;
  onRegenerateClick?: () => void;
  onEditClick?: () => void;
  onDownloadClick?: () => void;
  onFullscreenClick?: () => void;
  onExpandChart?: () => void;
  className?: string;
  animationDuration?: number;
  theme?: 'light' | 'dark';
}

/**
 * Enhanced Sankey Chart component with SCB beautiful styling
 * Visualizes flow relationships with AI-enhanced insights, network awareness,
 * and device capability adaptations
 */
const EnhancedSankeyChart: React.FC<EnhancedSankeyChartProps> = ({
  data,
  width = 800,
  height = 500,
  title = 'Financial Flow Analysis',
  subtitle,
  showAIControls = true,
  showLegend = true,
  isLoading = false,
  adaptiveLayout = true,
  onRegenerateClick,
  onEditClick,
  onDownloadClick,
  onFullscreenClick,
  onExpandChart,
  className = "",
  animationDuration = 800,
  theme = 'light'
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [aiCount, setAiCount] = useState(0);
  const [tooltipContent, setTooltipContent] = useState<{
    content: string;
    x: number;
    y: number;
    visible: boolean;
  }>({
    content: '',
    x: 0,
    y: 0,
    visible: false,
  });

  // Network and device capability awareness
  const { networkStatus, connection } = useNetworkAwareLoading();
  const { tier, prefersColorScheme } = useDeviceCapabilities();
  
  // Use system theme preference if not specified
  const effectiveTheme = theme === 'light' || theme === 'dark' 
    ? theme 
    : prefersColorScheme === 'dark' ? 'dark' : 'light';
  
  // SCB color palette based on theme
  const scbColors = {
    light: {
      // Primary SCB colors
      honoluluBlue: 'rgb(var(--scb-honolulu-blue))', // #0072AA
      americanGreen: 'rgb(var(--scb-american-green))', // #21AA47
      muted: 'rgb(var(--scb-dark-gray))', // Neutral gray
      negative: 'rgb(var(--scb-muted-red))', // Red for negative
      lightBlue: 'rgb(42, 120, 188)', // Light blue
      orange: 'rgb(245, 152, 0)', // Orange
      purple: 'rgb(88, 64, 148)', // Purple
      teal: 'rgb(0, 112, 122)', // Teal
      
      // UI colors
      background: 'white',
      cardBackground: 'white',
      text: 'rgb(var(--scb-dark-gray))',
      subtleText: 'rgba(var(--scb-dark-gray), 0.7)',
      border: 'rgb(var(--scb-border))',
      
      // AI accent
      aiAccent: 'rgb(var(--scb-american-green))',
      aiHighlight: 'rgba(var(--scb-american-green), 0.05)'
    },
    dark: {
      // Primary SCB colors - lightened for dark mode
      honoluluBlue: 'rgb(0, 142, 211)', // Lighter blue for dark mode
      americanGreen: 'rgb(41, 204, 86)', // Lighter green for dark mode
      muted: 'rgb(180, 180, 180)', // Lighter gray for dark mode
      negative: 'rgb(235, 87, 82)', // Lighter red for dark mode
      lightBlue: 'rgb(82, 157, 222)', // Lighter blue for dark mode
      orange: 'rgb(255, 176, 59)', // Lighter orange for dark mode
      purple: 'rgb(126, 94, 204)', // Lighter purple for dark mode
      teal: 'rgb(0, 153, 168)', // Lighter teal for dark mode
      
      // UI colors
      background: '#1a1a1a',
      cardBackground: '#2c2c2c',
      text: '#e5e5e5',
      subtleText: 'rgba(229, 229, 229, 0.7)',
      border: 'rgba(255, 255, 255, 0.12)',
      
      // AI accent
      aiAccent: 'rgb(92, 199, 160)', // Lighter for dark mode
      aiHighlight: 'rgba(92, 199, 160, 0.15)'
    }
  };
  
  const colors = scbColors[effectiveTheme];
  
  // Get node color based on group/category
  const getNodeColor = (node: D3SankeyNode): string => {
    if (!node.group) return colors.muted;
    
    const colorMap: Record<string, string> = {
      'income': colors.americanGreen,
      'expense': colors.negative,
      'asset': colors.honoluluBlue,
      'liability': colors.purple,
      'equity': colors.teal,
      'investment': colors.lightBlue,
      'finance': colors.americanGreen,
      'trading': colors.orange,
    };
    
    return colorMap[node.group.toLowerCase()] || colors.muted;
  };
  
  // Get link color with proper opacity
  const getLinkColor = (link: D3SankeyLink | SankeyLink, opacity: number = 0.4): string => {
    if (link.uiColor) return link.uiColor;
    
    // Handle case where source/target are indices or nodes
    let source = 0;
    let target = 0;
    
    if (typeof link.source === 'number') {
      source = link.source;
    } else if (typeof link.source === 'object' && link.source !== null) {
      source = (link.source as any).index || 0;
    }
    
    if (typeof link.target === 'number') {
      target = link.target;
    } else if (typeof link.target === 'object' && link.target !== null) {
      target = (link.target as any).index || 0;
    }
    
    // Gradient based on indices
    const colorOptions = [
      colors.honoluluBlue,
      colors.americanGreen,
      colors.teal,
      colors.purple,
      colors.lightBlue
    ];
    const colorIndex = (source + target) % colorOptions.length;
    
    // If AI enhanced, use accent green with higher opacity
    if (link.aiEnhanced) {
      return colors.aiAccent;
    }
    
    return d3.color(colorOptions[colorIndex])?.copy({opacity})?.toString() || `${colors.muted}`;
  };
  
  // Count AI enhanced nodes and links
  useEffect(() => {
    if (!data) return;
    
    const aiLinks = data.links.filter(link => link.aiEnhanced).length;
    const aiNodes = data.nodes.filter(node => (node as any).predictedValue !== undefined).length;
    setAiCount(aiLinks + aiNodes);
  }, [data]);

  // Calculate animation duration based on network and device capabilities
  const getEffectiveAnimationDuration = useCallback(() => {
    if (tier === 'low' || networkStatus === 'slow') {
      return 0; // Disable animations for low-end devices or slow networks
    }
    
    if (tier === 'medium' || networkStatus === 'medium') {
      return animationDuration / 2; // Reduce animation time for medium tier devices
    }
    
    return animationDuration;
  }, [tier, networkStatus, animationDuration]);

  // Adapt layout based on network and device capabilities
  const getAdaptedDimensions = useCallback(() => {
    if (!adaptiveLayout) return { width, height, nodePadding: 10, nodeWidth: 20 };
    
    let adaptedWidth = width;
    let adaptedHeight = height;
    let nodePadding = 10;
    let nodeWidth = 20;
    
    // Adapt based on network status
    if (networkStatus === 'slow') {
      nodePadding = 8;
      nodeWidth = 15;
      adaptedHeight = Math.min(height, 400); // Reduce height for performance
    } else if (tier === 'high' && networkStatus === 'fast') {
      nodePadding = 12;
      nodeWidth = 24;
    }
    
    // Adapt based on device tier
    if (tier === 'low') {
      nodePadding = 6;
      nodeWidth = 12;
      adaptedHeight = Math.min(height, 350);
    }
    
    return { width: adaptedWidth, height: adaptedHeight, nodePadding, nodeWidth };
  }, [adaptiveLayout, width, height, networkStatus, tier]);

  // Function to create or update the chart
  const updateChart = useCallback(() => {
    if (!svgRef.current || !data?.nodes?.length) return;
    
    // Get adapted dimensions and animation duration
    const { width: adaptedWidth, height: adaptedHeight, nodePadding, nodeWidth } = getAdaptedDimensions();
    const duration = getEffectiveAnimationDuration();
    
    // Clear SVG
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    // Create the chart with padding
    const margin = { top: 10, right: 30, bottom: 10, left: 30 };
    const innerWidth = adaptedWidth - margin.left - margin.right;
    const innerHeight = adaptedHeight - margin.top - margin.bottom;
    
    // Set up SVG container
    svg.attr('width', adaptedWidth)
       .attr('height', adaptedHeight)
       .attr('viewBox', [0, 0, adaptedWidth, adaptedHeight])
       .attr('style', 'width: 100%; height: auto; max-width: 100%;')
       .attr('font-family', '"SCProsperSans", "72", sans-serif');
    
    // Add a base container group with margin transform
    const container = svg.append('g')
       .attr('class', 'sankey-container')
       .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Background with theme coloring
    container.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', effectiveTheme === 'light' ? 'rgba(var(--scb-light-gray), 0.2)' : 'rgba(60, 60, 60, 0.3)')
      .attr('rx', 4); // Rounded corners
    
    // Set up the Sankey generator
    const sankeyGenerator = sankey<SankeyNode, SankeyLink>()
      .nodeWidth(nodeWidth)
      .nodePadding(nodePadding)
      .extent([[0, 0], [innerWidth, innerHeight]])
      .nodeId((d) => d.name);
    
    // Create a sanitized copy of the data
    const sanitizedData = {
      nodes: [...data.nodes],
      links: data.links.map(link => ({
        ...link,
        source: typeof link.source === 'object' && link.source !== null ? 
          ((link.source as any).index !== undefined ? (link.source as any).index : 0) : link.source,
        target: typeof link.target === 'object' && link.target !== null ? 
          ((link.target as any).index !== undefined ? (link.target as any).index : 0) : link.target,
      })),
    };
    
    // Apply the Sankey layout and cast to our internal types
    const result = sankeyGenerator(sanitizedData as unknown as SankeyGraph<SankeyNode, SankeyLink>);
    const nodes = result.nodes as unknown as D3SankeyNode[];
    const links = result.links as unknown as D3SankeyLink[];
    
    // Add defs for gradients (AI enhanced links)
    const defs = container.append('defs');
      
    // Create gradients for AI enhanced links
    links.forEach((link, i) => {
      if (link.aiEnhanced) {
        const gradientId = `ai-gradient-${i}`;
        const gradient = defs.append('linearGradient')
          .attr('id', gradientId)
          .attr('gradientUnits', 'userSpaceOnUse')
          .attr('x1', link.source.x1)
          .attr('y1', (link.source.y0 + link.source.y1) / 2)
          .attr('x2', link.target.x0)
          .attr('y2', (link.target.y0 + link.target.y1) / 2);
        
        gradient.append('stop')
          .attr('offset', '0%')
          .attr('stop-color', colors.honoluluBlue);
        
        gradient.append('stop')
          .attr('offset', '100%')
          .attr('stop-color', colors.aiAccent);
      }
    });
    
    // Create links group
    const linksGroup = container.append('g')
      .attr('class', 'sankey-links');
      
    // Create the links with SCB styling and animation
    const linkPaths = linksGroup
      .selectAll('path')
      .data(links)
      .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', (d) => d.aiEnhanced ? `url(#ai-gradient-${links.indexOf(d)})` : getLinkColor(d))
      .attr('stroke-width', d => Math.max(1, d.width || 0))
      .attr('fill', 'none')
      .attr('stroke-opacity', 0.4)
      .attr('class', d => d.aiEnhanced ? 'ai-enhanced-link' : '')
      .style('transition', duration > 0 ? `all ${duration/1000}s ease` : 'none');
    
    // Add hover effects to links
    linkPaths
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('stroke-opacity', 0.7)
          .attr('stroke-width', d => Math.max(1, (d.width || 0) * 1.2));
        
        // Source and target names
        const sourceName = d.source.name;
        const targetName = d.target.name;
        
        // Format the value with locale
        const formatter = new Intl.NumberFormat(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        });
        
        // Calculate change for AI-enhanced links
        let changeContent = '';
        if (d.aiEnhanced && d.originalValue) {
          const change = ((d.value - d.originalValue) / d.originalValue) * 100;
          const changeDirection = change >= 0 ? '+' : '';
          const changeClass = change >= 0 ? 'text-[#21AA47]' : 'text-[#D33732]';
          
          changeContent = `
            <div class="text-xs mt-1 flex items-center gap-1 ${changeClass}">
              <span>${changeDirection}${change.toFixed(1)}% from baseline</span>
            </div>
          `;
        }
        
        // Create tooltip content
        const content = `
          <div class="font-medium">${sourceName} → ${targetName}</div>
          <div class="text-sm mt-1">Value: ${formatter.format(d.value)}</div>
          ${d.aiEnhanced ? `
            <div class="text-xs mt-1 flex items-center gap-1" style="color:${colors.aiAccent}">
              <span>AI enhanced</span>
            </div>
            ${changeContent}
          ` : ''}
        `;
        
        // Show tooltip
        setTooltipContent({
          content,
          x: event.pageX,
          y: event.pageY,
          visible: true,
        });
      })
      .on('mousemove', function(event) {
        setTooltipContent(prev => ({
          ...prev,
          x: event.pageX,
          y: event.pageY,
        }));
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('stroke-opacity', 0.4)
          .attr('stroke-width', d => Math.max(1, d.width || 0));
        
        setTooltipContent(prev => ({
          ...prev,
          visible: false,
        }));
      });
    
    // Create nodes group
    const nodesGroup = container.append('g')
      .attr('class', 'sankey-nodes');
      
    // Add nodes with SCB styling
    const nodeRects = nodesGroup
      .selectAll('rect')
      .data(nodes)
      .join('rect')
      .attr('x', d => d.x0 || 0)
      .attr('y', d => d.y0 || 0)
      .attr('height', d => ((d.y1 || 0) - (d.y0 || 0)) || 0)
      .attr('width', d => ((d.x1 || 0) - (d.x0 || 0)) || 0)
      .attr('fill', d => getNodeColor(d))
      .attr('opacity', 0.85)
      .attr('rx', 4) // Rounded corners for SCB style
      .attr('ry', 4)
      .attr('stroke', d => d3.color(getNodeColor(d))?.darker(0.3).toString() || '')
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.6)
      .style('transition', duration > 0 ? `all ${duration/1000}s ease` : 'none');
    
    // Add hover effects to nodes
    nodeRects
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('opacity', 1)
          .attr('stroke-width', 1.5);
        
        // Format the value with locale
        const formatter = new Intl.NumberFormat(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        });
        
        // Create tooltip content for nodes
        const content = `
          <div class="font-medium">${d.name}</div>
          <div class="text-sm mt-1">${d.group ? 'Category: ' + d.group : ''}</div>
          <div class="text-sm">Value: ${formatter.format(d.value || 0)}</div>
          ${(d as any).predictedValue ? `
            <div class="text-xs mt-1 flex items-center" style="color:${colors.aiAccent}">
              <span>Predicted: ${formatter.format((d as any).predictedValue)}</span>
              ${(d as any).confidence ? `<span> (${Math.round((d as any).confidence * 100)}% confidence)</span>` : ''}
            </div>
          ` : ''}
        `;
        
        // Show tooltip
        setTooltipContent({
          content,
          x: event.pageX,
          y: event.pageY,
          visible: true,
        });
      })
      .on('mousemove', function(event) {
        setTooltipContent(prev => ({
          ...prev,
          x: event.pageX,
          y: event.pageY,
        }));
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('opacity', 0.85)
          .attr('stroke-width', 1);
        
        setTooltipContent(prev => ({
          ...prev,
          visible: false,
        }));
      });
    
    // Add AI indicators for nodes with predictions
    nodesGroup
      .selectAll('.ai-indicator')
      .data(nodes.filter(d => (d as any).predictedValue !== undefined))
      .join('circle')
      .attr('class', 'ai-indicator')
      .attr('cx', d => (d.x0 || 0) + ((d.x1 || 0) - (d.x0 || 0)) - 6)
      .attr('cy', d => (d.y0 || 0) + 6)
      .attr('r', 5)
      .attr('fill', colors.aiAccent)
      .attr('stroke', effectiveTheme === 'light' ? 'white' : colors.cardBackground)
      .attr('stroke-width', 1.5);
    
    // Add node labels if enabled
    if (showLabels) {
      // Add node labels
      const nodeLabels = nodesGroup
        .selectAll('text')
        .data(nodes)
        .join('text')
        .attr('x', d => (d.x0 || 0) < innerWidth / 2 ? (d.x1 || 0) + 6 : (d.x0 || 0) - 6)
        .attr('y', d => ((d.y0 || 0) + ((d.y1 || 0) - (d.y0 || 0)) / 2))
        .attr('dy', '0.35em')
        .attr('text-anchor', d => (d.x0 || 0) < innerWidth / 2 ? 'start' : 'end')
        .attr('font-size', '11px')
        .attr('fill', colors.text)
        .text(d => {
          // Handle label truncation for small screens
          if (tier === 'low' && d.name.length > 12) {
            return d.name.substring(0, 12) + '...';
          }
          return d.name;
        });
      
      // Add value labels for larger nodes
      const valueLabels = nodesGroup
        .selectAll('.value-label')
        .data(nodes.filter(d => ((d.y1 || 0) - (d.y0 || 0)) > 30))
        .join('text')
        .attr('class', 'value-label')
        .attr('x', d => (d.x0 || 0) + ((d.x1 || 0) - (d.x0 || 0)) / 2)
        .attr('y', d => (d.y0 || 0) + ((d.y1 || 0) - (d.y0 || 0)) / 2 + 16)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', 'white')
        .attr('font-weight', 'bold')
        .text(d => {
          if (!d.value) return '';
          // Format based on size - simpler for small nodes
          if (((d.y1 || 0) - (d.y0 || 0)) < 40) {
            return new Intl.NumberFormat(undefined, {
              notation: 'compact',
              maximumFractionDigits: 1
            }).format(d.value);
          }
          return new Intl.NumberFormat(undefined, {
            maximumFractionDigits: 0
          }).format(d.value);
        });
    }
    
    // Network status indicator for premium displays
    if (tier === 'high' && networkStatus) {
      const statusColors = {
        fast: colors.americanGreen,
        medium: colors.honoluluBlue,
        slow: colors.negative
      };
      
      const networkIndicator = container.append('g')
        .attr('class', 'network-indicator')
        .attr('transform', `translate(${innerWidth - 60}, 20)`)
        .style('opacity', 0.8);
      
      networkIndicator.append('rect')
        .attr('rx', 8)
        .attr('width', 50)
        .attr('height', 16)
        .attr('fill', `rgba(${effectiveTheme === 'light' ? '255,255,255' : '40,40,40'}, 0.8)`)
        .attr('stroke', statusColors[networkStatus])
        .attr('stroke-width', 1);
      
      networkIndicator.append('text')
        .attr('x', 25)
        .attr('y', 12)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('fill', statusColors[networkStatus])
        .text(networkStatus.charAt(0).toUpperCase() + networkStatus.slice(1));
    }
    
  }, [data, effectiveTheme, colors, showLabels, getAdaptedDimensions, getEffectiveAnimationDuration, networkStatus, tier]);
  
  // Initial chart creation & updates
  useEffect(() => {
    if (data && !isLoading) {
      updateChart();
    }
  }, [data, updateChart, isLoading, showLabels, effectiveTheme]);
  
  // Update on window resize
  useEffect(() => {
    if (!containerRef.current) return;
    
    const handleResize = () => {
      updateChart();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateChart]);
  
  // Handle custom download functionality
  const handleDownload = () => {
    if (onDownloadClick) {
      onDownloadClick();
      return;
    }
    
    if (!svgRef.current) return;
    
    // Convert SVG to data URL and trigger download
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      ref={containerRef}
      className={`fiori-tile h-full flex flex-col ${className}`}
      style={{
        backgroundColor: colors.cardBackground,
        color: colors.text,
        borderColor: colors.border,
      }}
    >
      {/* Chart header with controls */}
      <div 
        className="px-4 py-3 border-b flex justify-between items-center"
        style={{ borderColor: colors.border }}
      >
        <div>
          <h3 
            className="text-base font-medium"
            style={{ color: colors.honoluluBlue }}
          >
            {title}
          </h3>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: colors.subtleText }}>{subtitle}</p>}
        </div>
        
        <div className="flex items-center gap-2">
          {/* AI enhanced indicator */}
          {showAIControls && aiCount > 0 && (
            <div 
              className="horizon-chip text-xs py-0.5 px-2 flex items-center gap-1"
              style={{
                backgroundColor: `rgba(${effectiveTheme === 'light' ? 'var(--scb-american-green)' : '92, 199, 160'}, 0.1)`,
                color: colors.aiAccent,
                borderColor: `rgba(${effectiveTheme === 'light' ? 'var(--scb-american-green)' : '92, 199, 160'}, 0.2)`
              }}
            >
              <Sparkles className="w-3 h-3" />
              <span>{aiCount} AI-enhanced</span>
            </div>
          )}
          
          {/* Network status indicator */}
          {networkStatus && (
            <div
              className="text-xs py-0.5 px-2 rounded-full hidden md:flex items-center gap-1"
              style={{
                backgroundColor: networkStatus === 'fast'
                  ? `rgba(${effectiveTheme === 'light' ? 'var(--scb-american-green)' : '92, 199, 160'}, 0.1)`
                  : networkStatus === 'slow'
                    ? `rgba(${effectiveTheme === 'light' ? 'var(--scb-muted-red)' : '235, 87, 82'}, 0.1)`
                    : `rgba(${effectiveTheme === 'light' ? 'var(--scb-honolulu-blue)' : '0, 142, 211'}, 0.1)`,
                color: networkStatus === 'fast'
                  ? effectiveTheme === 'light' ? 'rgb(var(--scb-american-green))' : 'rgb(92, 199, 160)'
                  : networkStatus === 'slow'
                    ? effectiveTheme === 'light' ? 'rgb(var(--scb-muted-red))' : 'rgb(235, 87, 82)'
                    : effectiveTheme === 'light' ? 'rgb(var(--scb-honolulu-blue))' : 'rgb(0, 142, 211)'
              }}
            >
              <BarChart3 className="w-3 h-3" />
              <span>{networkStatus}</span>
            </div>
          )}
          
          {/* Chart controls */}
          <div className="flex items-center">
            {showAIControls && data?.aiInsights && (
              <button 
                onClick={() => setShowAIInsights(!showAIInsights)}
                className="p-1.5 ml-1 rounded-full transition-colors"
                style={{
                  color: colors.aiAccent,
                  backgroundColor: showAIInsights 
                    ? `rgba(${effectiveTheme === 'light' ? 'var(--scb-american-green)' : '92, 199, 160'}, 0.1)` 
                    : 'transparent'
                }}
                title="Toggle AI Insights"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            )}
            
            <button 
              onClick={() => setShowLabels(!showLabels)}
              className="p-1.5 ml-1 rounded-full transition-colors"
              style={{
                color: colors.text,
                backgroundColor: 'transparent',
                '&:hover': {
                  backgroundColor: effectiveTheme === 'light' 
                    ? 'rgba(var(--scb-light-gray), 0.5)' 
                    : 'rgba(60, 60, 60, 0.5)'
                }
              }}
              title={showLabels ? "Hide Labels" : "Show Labels"}
            >
              {showLabels ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            
            {onExpandChart && (
              <button 
                onClick={onExpandChart}
                disabled={isLoading}
                className="p-1.5 ml-1 rounded-full transition-colors"
                style={{
                  color: colors.text,
                  backgroundColor: 'transparent',
                  '&:hover': {
                    backgroundColor: effectiveTheme === 'light' 
                      ? 'rgba(var(--scb-light-gray), 0.5)' 
                      : 'rgba(60, 60, 60, 0.5)'
                  }
                }}
                title="Expand Chart"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
            
            {onEditClick && (
              <button 
                onClick={onEditClick}
                disabled={isLoading}
                className="p-1.5 ml-1 rounded-full transition-colors"
                style={{
                  color: colors.text,
                  backgroundColor: 'transparent',
                  '&:hover': {
                    backgroundColor: effectiveTheme === 'light' 
                      ? 'rgba(var(--scb-light-gray), 0.5)' 
                      : 'rgba(60, 60, 60, 0.5)'
                  }
                }}
                title="Edit Chart"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            
            {onRegenerateClick && (
              <button 
                onClick={onRegenerateClick}
                disabled={isLoading}
                className="p-1.5 ml-1 rounded-full transition-colors"
                style={{
                  color: colors.honoluluBlue,
                  backgroundColor: 'transparent',
                  '&:hover': {
                    backgroundColor: effectiveTheme === 'light' 
                      ? 'rgba(var(--scb-light-gray), 0.5)' 
                      : 'rgba(60, 60, 60, 0.5)'
                  }
                }}
                title="Regenerate with AI"
              >
                {isLoading ? (
                  <EnhancedInlineSpinner size="sm" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </button>
            )}
            
            {onFullscreenClick && (
              <button 
                onClick={onFullscreenClick}
                disabled={isLoading}
                className="p-1.5 ml-1 rounded-full transition-colors"
                style={{
                  color: colors.text,
                  backgroundColor: 'transparent',
                  '&:hover': {
                    backgroundColor: effectiveTheme === 'light' 
                      ? 'rgba(var(--scb-light-gray), 0.5)' 
                      : 'rgba(60, 60, 60, 0.5)'
                  }
                }}
                title="Toggle Fullscreen"
              >
                <Maximize className="w-4 h-4" />
              </button>
            )}
            
            <button 
              onClick={handleDownload}
              disabled={isLoading}
              className="p-1.5 ml-1 rounded-full transition-colors"
              style={{
                color: colors.text,
                backgroundColor: 'transparent',
                '&:hover': {
                  backgroundColor: effectiveTheme === 'light' 
                    ? 'rgba(var(--scb-light-gray), 0.5)' 
                    : 'rgba(60, 60, 60, 0.5)'
                }
              }}
              title="Download Chart"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* AI Insights Panel */}
      {showAIInsights && data?.aiInsights && (
        <div 
          className="px-4 py-3 border-b animate-fadeIn"
          style={{
            backgroundColor: colors.aiHighlight,
            borderColor: `rgba(${effectiveTheme === 'light' ? 'var(--scb-american-green)' : '92, 199, 160'}, 0.2)`
          }}
        >
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 mt-1" style={{ color: colors.aiAccent }} />
            <div className="flex-1">
              <div className="flex justify-between">
                <h4 className="text-sm font-medium" style={{ color: colors.text }}>AI Analysis</h4>
                <button
                  onClick={() => setShowAIInsights(false)}
                  className="p-0.5 hover:text-[rgb(var(--scb-muted-red))]"
                  style={{ color: colors.text }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs mt-1" style={{ color: colors.text }}>{data.aiInsights.summary}</p>
              
              {data.aiInsights.recommendations.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium" style={{ color: colors.text }}>Recommendations:</p>
                  <ul className="text-xs mt-1 space-y-1">
                    {data.aiInsights.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-1" style={{ color: colors.text }}>
                        <span style={{ color: colors.aiAccent }}>•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex items-center gap-2 mt-2">
                <div className="text-[10px] flex items-center gap-1" style={{ color: colors.subtleText }}>
                  <Info className="w-3 h-3" />
                  <span>AI confidence: {(data.aiInsights.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="text-[10px]" style={{ color: colors.subtleText }}>
                  Updated: {typeof data.aiInsights.updatedAt === 'object' 
                    ? data.aiInsights.updatedAt.toLocaleString() 
                    : new Date(data.aiInsights.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Network warning for slow connections */}
      {networkStatus === 'slow' && (
        <div 
          className="px-4 py-2 border-b"
          style={{ 
            backgroundColor: `rgba(${effectiveTheme === 'light' ? 'var(--scb-muted-red)' : '235, 87, 82'}, 0.05)`,
            borderColor: `rgba(${effectiveTheme === 'light' ? 'var(--scb-muted-red)' : '235, 87, 82'}, 0.2)`
          }}
        >
          <div className="flex items-center gap-2 text-xs">
            <Info className="w-3.5 h-3.5" style={{ color: effectiveTheme === 'light' ? 'rgb(var(--scb-muted-red))' : 'rgb(235, 87, 82)' }} />
            <span style={{ color: colors.text }}>Simplified visualization for slower connection</span>
          </div>
        </div>
      )}
      
      {/* Main chart container */}
      <div className="flex-1 flex items-center justify-center p-4 relative">
        {/* Loading state */}
        {isLoading && (
          <div 
            className="absolute inset-0 flex items-center justify-center z-10"
            style={{ backgroundColor: `${colors.cardBackground}CC` }} // CC = 80% opacity
          >
            <div className="text-center">
              <div 
                className="w-10 h-10 mx-auto mb-2 rounded-full animate-spin"
                style={{ 
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  borderColor: `rgba(${effectiveTheme === 'light' ? 'var(--scb-honolulu-blue)' : '0, 142, 211'}, 0.2)`,
                  borderTopColor: colors.honoluluBlue
                }}
              ></div>
              <p className="text-sm" style={{ color: colors.text }}>Generating visualization...</p>
            </div>
          </div>
        )}
        
        {/* SVG Chart */}
        <svg 
          ref={svgRef}
          role="img"
          aria-label={title}
          className="max-w-full max-h-full"
        >
          <title>{title}</title>
          <desc>{subtitle || `Sankey diagram showing flow relationships`}</desc>
        </svg>
        
        {/* No data state */}
        {!isLoading && (!data?.nodes?.length || !data?.links?.length) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Info className="w-10 h-10 mx-auto mb-2" style={{ color: colors.border }} />
              <p className="text-sm" style={{ color: colors.subtleText }}>No flow data available</p>
            </div>
          </div>
        )}
        
        {/* Tooltip - SCB styling */}
        {tooltipContent.visible && (
          <div 
            className="absolute pointer-events-none z-10 rounded-md shadow-lg max-w-xs p-3"
            style={{
              left: `${tooltipContent.x + 10}px`,
              top: `${tooltipContent.y - 10}px`,
              transform: 'translate(-50%, -100%)',
              backgroundColor: colors.cardBackground,
              color: colors.text,
              borderColor: colors.border,
              borderWidth: '1px',
              borderStyle: 'solid'
            }}
            dangerouslySetInnerHTML={{ __html: tooltipContent.content }}
          />
        )}
        
        {/* Legend */}
        {showLegend && (
          <div 
            className="absolute bottom-2 right-2 p-2 rounded text-xs"
            style={{
              backgroundColor: `${colors.cardBackground}E6`, // E6 = 90% opacity
              borderColor: colors.border,
              borderWidth: '1px',
              borderStyle: 'solid'
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded-sm opacity-80"
                style={{ backgroundColor: colors.muted }}
              ></div>
              <span style={{ color: colors.text }}>Standard Flow</span>
            </div>
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-sm opacity-80"
                style={{ backgroundColor: colors.aiAccent }}
              ></div>
              <span className="flex items-center gap-1" style={{ color: colors.text }}>
                <Sparkles className="w-3 h-3" style={{ color: colors.aiAccent }} />
                AI Enhanced
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedSankeyChart;