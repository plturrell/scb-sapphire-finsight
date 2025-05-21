import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal, SankeyGraph } from 'd3-sankey';
import { Sparkles, Info, Edit, Download, RefreshCw, ZoomIn, ZoomOut, X } from 'lucide-react';
import { SankeyData, SankeyLink, SankeyNode } from '../../types';
import { EnhancedInlineSpinner } from '../EnhancedLoadingSpinner';

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
}

interface EnhancedAnimatedSankeyChartProps {
  data: SankeyData;
  width?: number;
  height?: number;
  title?: string;
  subtitle?: string;
  showAIControls?: boolean;
  onRegenerateClick?: () => void;
  onEditClick?: () => void;
  onDownloadClick?: () => void;
  isLoading?: boolean;
  className?: string;
  autoAnimate?: boolean;
}

/**
 * Enhanced Animated Sankey Chart component with SCB beautiful styling
 * Visualizes flow relationships with animated transitions and AI-enhanced insights
 * Follows Fiori Horizon design patterns with SCB color variables
 */
const EnhancedAnimatedSankeyChart: React.FC<EnhancedAnimatedSankeyChartProps> = ({
  data,
  width = 800,
  height = 500,
  title = 'Financial Flow Analysis',
  subtitle,
  showAIControls = true,
  onRegenerateClick,
  onEditClick,
  onDownloadClick,
  isLoading = false,
  className = "",
  autoAnimate = true
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [showAIInsights, setShowAIInsights] = useState(false);
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
  
  // Remember previous data for animations
  const prevDataRef = useRef<SankeyData | null>(null);
  
  // SCB color palette for nodes and links
  const scbColors = {
    honoluluBlue: 'rgb(var(--scb-honolulu-blue))', // Primary blue
    americanGreen: 'rgb(var(--scb-american-green))', // Green
    muted: 'rgb(var(--scb-dark-gray))', // Neutral gray
    negative: 'rgb(var(--scb-muted-red))', // Red for negative
    lightBlue: 'rgb(42, 120, 188)', // Light blue
    orange: 'rgb(245, 152, 0)', // Orange
    purple: 'rgb(88, 64, 148)', // Purple
    teal: 'rgb(0, 112, 122)' // Teal
  };
  
  // Get node color based on group/category
  const getNodeColor = (node: D3SankeyNode): string => {
    if (!node.group) return scbColors.muted;
    
    const colorMap: Record<string, string> = {
      'income': scbColors.americanGreen,
      'expense': scbColors.negative,
      'asset': scbColors.honoluluBlue,
      'liability': scbColors.purple,
      'equity': scbColors.teal,
      'investment': scbColors.lightBlue,
      'finance': scbColors.americanGreen,
      'trading': scbColors.orange,
    };
    
    return colorMap[node.group.toLowerCase()] || scbColors.muted;
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
    const colors = Object.values(scbColors);
    const colorIndex = (source + target) % colors.length;
    
    // If AI enhanced, use SCB green with higher opacity
    if (link.aiEnhanced) {
      return `rgba(var(--scb-american-green), ${opacity + 0.2})`;
    }
    
    return d3.color(colors[colorIndex])?.copy({opacity})?.toString() || `rgba(var(--scb-dark-gray), ${opacity})`;
  };
  
  // Count AI enhanced nodes and links
  useEffect(() => {
    const aiLinks = data.links.filter(link => link.aiEnhanced).length;
    const aiNodes = data.nodes.filter(node => (node as any).predictedValue !== undefined).length;
    setAiCount(aiLinks + aiNodes);
  }, [data]);
  
  // Function to create or update the chart
  const updateChart = useCallback(() => {
    if (!svgRef.current || !data.nodes.length) return;
    
    // Clear SVG if it's a full redraw, or get the existing one for animations
    const svg = d3.select(svgRef.current);
    const isFirstRender = svg.selectAll('*').empty();
    
    // Create the chart with padding
    const margin = { top: 10, right: 30, bottom: 10, left: 30 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // For a full redraw, set up the SVG container first
    if (isFirstRender) {
      svg.attr('width', width)
         .attr('height', height)
         .attr('viewBox', [0, 0, width, height])
         .attr('font-family', '"SCProsperSans", "72", sans-serif');
      
      // Add a base container group with margin transform
      svg.append('g')
         .attr('class', 'sankey-container')
         .attr('transform', `translate(${margin.left},${margin.top})`);
    }
    
    // Select the container for all our elements
    const container = svg.select('.sankey-container');
    
    // Clear previous elements if updating
    if (!isFirstRender) {
      // Don't remove everything - keep the container for animations
      container.selectAll('.sankey-links, .sankey-nodes, .sankey-labels, .sankey-defs').remove();
    }

    // Set up the Sankey generator
    const sankeyGenerator = sankey<SankeyNode, SankeyLink>()
      .nodeWidth(20)
      .nodePadding(10)
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
    
    // Add background with SCB light gray
    if (isFirstRender) {
      container.append('rect')
        .attr('class', 'sankey-background')
        .attr('width', innerWidth)
        .attr('height', innerHeight)
        .attr('fill', 'rgba(var(--scb-light-gray), 0.2)')
        .attr('rx', 4); // Rounded corners
    } else {
      container.select('.sankey-background')
        .transition().duration(500)
        .attr('width', innerWidth)
        .attr('height', innerHeight);
    }
    
    // Add defs for gradients (AI enhanced links)
    const defsGroup = container.append('g')
      .attr('class', 'sankey-defs');
    const defs = defsGroup.append('defs');
      
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
          .attr('stop-color', scbColors.honoluluBlue);
        
        gradient.append('stop')
          .attr('offset', '100%')
          .attr('stop-color', scbColors.americanGreen);
      }
    });

    // Create links group
    const linksGroup = container.append('g')
      .attr('class', 'sankey-links');
      
    // Create the links with SCB styling and animated transitions
    const linkPaths = linksGroup
      .selectAll('path')
      .data(links, (d: any) => {
        // Create a stable ID for each link based on source and target
        const sourceId = d.source.name;
        const targetId = d.target.name;
        return `${sourceId}-${targetId}-${d.type || ''}`;
      })
      .join(
        // Enter new links with animations
        enter => enter.append('path')
          .attr('d', sankeyLinkHorizontal())
          .attr('stroke', d => d.aiEnhanced ? `url(#ai-gradient-${links.indexOf(d)})` : getLinkColor(d))
          .attr('stroke-width', 0) // Start with 0 width for animation
          .attr('fill', 'none')
          .attr('stroke-opacity', 0.1) // Start nearly transparent
          .attr('class', d => d.aiEnhanced ? 'ai-enhanced-link' : '')
          .call(enter => enter.transition().duration(autoAnimate ? 1000 : 100)
            .attr('stroke-width', d => Math.max(1, d.width || 0))
            .attr('stroke-opacity', 0.4)
          ),
        // Update existing links with animations
        update => update
          .call(update => update.transition().duration(autoAnimate ? 800 : 100)
            .attr('d', sankeyLinkHorizontal())
            .attr('stroke', d => d.aiEnhanced ? `url(#ai-gradient-${links.indexOf(d)})` : getLinkColor(d))
            .attr('stroke-width', d => Math.max(1, d.width || 0))
          ),
        // Exit links with animations
        exit => exit
          .call(exit => exit.transition().duration(autoAnimate ? 500 : 50)
            .attr('stroke-opacity', 0)
            .attr('stroke-width', 0)
            .remove()
          )
      );
    
    // Add hover effects to links
    linkPaths
      .on('mouseover', function(event: any, d) {
        d3.select(this)
          .attr('stroke-opacity', 0.7)
          .attr('stroke-width', d => Math.max(1, (d.width || 0) * 1.2));
        
        // Source and target names
        const sourceName = d.source.name;
        const targetName = d.target.name;
        
        // Create tooltip content
        const content = `
          <div class="font-medium">${sourceName} → ${targetName}</div>
          <div class="text-sm mt-1">Value: ${d.value.toLocaleString()}</div>
          ${d.aiEnhanced ? `
            <div class="text-xs mt-1 flex items-center gap-1 text-[rgb(var(--scb-american-green))]">
              <span>AI enhanced</span>
              ${d.originalValue ? `<span>(${((d.value - d.originalValue)/d.originalValue * 100).toFixed(1)}% change)</span>` : ''}
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
      .on('mousemove', function(event: any) {
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
      
    // Add animated nodes with data binding for updates
    const nodeRects = nodesGroup
      .selectAll('rect')
      .data(nodes, (d: any) => d.name)
      .join(
        // Enter new nodes with animations
        enter => enter.append('rect')
          .attr('x', d => d.x0 || 0)
          .attr('y', d => d.y0 || 0)
          .attr('height', d => ((d.y1 || 0) - (d.y0 || 0)) || 0)
          .attr('width', d => ((d.x1 || 0) - (d.x0 || 0)) || 0)
          .attr('fill', d => getNodeColor(d))
          .attr('opacity', 0.2) // Start nearly transparent
          .attr('rx', 3) // Rounded corners
          .attr('ry', 3)
          .call(enter => enter.transition().duration(autoAnimate ? 800 : 100)
            .attr('opacity', 0.8)
          ),
        // Update existing nodes with animations
        update => update
          .call(update => update.transition().duration(autoAnimate ? 800 : 100)
            .attr('x', d => d.x0 || 0)
            .attr('y', d => d.y0 || 0)
            .attr('height', d => ((d.y1 || 0) - (d.y0 || 0)) || 0)
            .attr('width', d => ((d.x1 || 0) - (d.x0 || 0)) || 0)
            .attr('fill', d => getNodeColor(d))
          ),
        // Exit nodes with animations
        exit => exit
          .call(exit => exit.transition().duration(autoAnimate ? 500 : 50)
            .attr('opacity', 0)
            .remove()
          )
      );
    
    // Add hover effects to nodes
    nodeRects
      .on('mouseover', function(event: any, d) {
        d3.select(this)
          .attr('opacity', 1)
          .attr('stroke', 'rgb(var(--scb-dark-gray))')
          .attr('stroke-width', 1);
        
        // Create tooltip content for nodes
        const content = `
          <div class="font-medium">${d.name}</div>
          <div class="text-sm mt-1">${d.group ? 'Category: ' + d.group : ''}</div>
          <div class="text-sm">Value: ${(d.value || 0).toLocaleString()}</div>
          ${(d as any).predictedValue ? `
            <div class="text-xs mt-1 flex items-center text-[rgb(var(--scb-american-green))]">
              <span>Predicted: ${(d as any).predictedValue.toLocaleString()}</span>
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
      .on('mousemove', function(event: any) {
        setTooltipContent(prev => ({
          ...prev,
          x: event.pageX,
          y: event.pageY,
        }));
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('opacity', 0.8)
          .attr('stroke', 'none');
        
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
      .attr('r', 0) // Start with radius 0 for animation
      .attr('fill', 'rgb(var(--scb-american-green))')
      .attr('stroke', 'white')
      .attr('stroke-width', 1)
      .transition().duration(autoAnimate ? 1000 : 100).delay(autoAnimate ? 300 : 0)
      .attr('r', 5); // Animate to final radius
    
    // Add animated node labels
    const nodeLabels = nodesGroup
      .selectAll('.node-label')
      .data(nodes, (d: any) => d.name)
      .join(
        // Enter new labels with animations
        enter => enter.append('text')
          .attr('class', 'node-label')
          .attr('x', d => (d.x0 || 0) < innerWidth / 2 ? (d.x1 || 0) + 6 : (d.x0 || 0) - 6)
          .attr('y', d => ((d.y0 || 0) + ((d.y1 || 0) - (d.y0 || 0)) / 2))
          .attr('dy', '0.35em')
          .attr('text-anchor', d => (d.x0 || 0) < innerWidth / 2 ? 'start' : 'end')
          .attr('font-size', '11px')
          .attr('fill', 'rgb(var(--scb-dark-gray))')
          .attr('opacity', 0) // Start invisible
          .text(d => d.name)
          .call(enter => enter.transition().duration(autoAnimate ? 800 : 100).delay(autoAnimate ? 200 : 0)
            .attr('opacity', 1)
          ),
        // Update existing labels with animations  
        update => update
          .call(update => update.transition().duration(autoAnimate ? 800 : 100)
            .attr('x', d => (d.x0 || 0) < innerWidth / 2 ? (d.x1 || 0) + 6 : (d.x0 || 0) - 6)
            .attr('y', d => ((d.y0 || 0) + ((d.y1 || 0) - (d.y0 || 0)) / 2))
            .attr('text-anchor', d => (d.x0 || 0) < innerWidth / 2 ? 'start' : 'end')
          ),
        // Exit labels with animations
        exit => exit
          .call(exit => exit.transition().duration(autoAnimate ? 500 : 50)
            .attr('opacity', 0)
            .remove()
          )
      );
    
    // Add value labels for larger nodes with animations
    nodesGroup
      .selectAll('.value-label')
      .data(nodes.filter(d => ((d.y1 || 0) - (d.y0 || 0)) > 30))
      .join(
        enter => enter.append('text')
          .attr('class', 'value-label')
          .attr('x', d => (d.x0 || 0) + ((d.x1 || 0) - (d.x0 || 0)) / 2)
          .attr('y', d => (d.y0 || 0) + ((d.y1 || 0) - (d.y0 || 0)) / 2 + 14)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('fill', 'white')
          .attr('font-weight', 'bold')
          .attr('opacity', 0)
          .text(d => d.value ? d.value.toLocaleString() : '')
          .call(enter => enter.transition().duration(autoAnimate ? 800 : 100).delay(autoAnimate ? 400 : 0)
            .attr('opacity', 1)
          ),
        update => update
          .call(update => update.transition().duration(autoAnimate ? 800 : 100)
            .attr('x', d => (d.x0 || 0) + ((d.x1 || 0) - (d.x0 || 0)) / 2)
            .attr('y', d => (d.y0 || 0) + ((d.y1 || 0) - (d.y0 || 0)) / 2 + 14)
            .text(d => d.value ? d.value.toLocaleString() : '')
          ),
        exit => exit
          .call(exit => exit.transition().duration(autoAnimate ? 500 : 50)
            .attr('opacity', 0)
            .remove()
          )
      );
    
    // Save current data for future animations
    prevDataRef.current = data;
    
  }, [data, width, height, scbColors, autoAnimate]);
  
  // Initial chart creation & updates
  useEffect(() => {
    updateChart();
  }, [updateChart]);
  
  // Handle window resize with debouncing
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        updateChart();
      }, 300); // Debounce resize events
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(timeoutId);
      };
    }
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
    <div className={`fiori-tile h-full flex flex-col ${className}`}>
      {/* Chart header with controls */}
      <div className="px-4 py-3 border-b border-[rgb(var(--scb-border))] flex justify-between items-center">
        <div>
          <h3 className="text-base font-medium text-[rgb(var(--scb-dark-gray))]">{title}</h3>
          {subtitle && <p className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-80 mt-0.5">{subtitle}</p>}
        </div>
        
        <div className="flex items-center gap-2">
          {/* AI enhanced indicator */}
          {showAIControls && aiCount > 0 && (
            <div className="horizon-chip horizon-chip-green text-xs py-0.5 px-2">
              <Sparkles className="w-3 h-3" />
              <span>{aiCount} AI-enhanced</span>
            </div>
          )}
          
          {/* Chart controls */}
          <div className="flex items-center">
            {showAIControls && data.aiInsights && (
              <button 
                onClick={() => setShowAIInsights(!showAIInsights)}
                className="p-1.5 ml-1 rounded-full hover:bg-[rgba(var(--scb-light-gray),0.5)] text-[rgb(var(--scb-american-green))] transition-colors"
                title="Toggle AI Insights"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            )}
            
            {onEditClick && (
              <button 
                onClick={onEditClick}
                disabled={isLoading}
                className="p-1.5 ml-1 rounded-full hover:bg-[rgba(var(--scb-light-gray),0.5)] text-[rgb(var(--scb-dark-gray))] transition-colors"
                title="Edit Chart"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            
            {onRegenerateClick && (
              <button 
                onClick={onRegenerateClick}
                disabled={isLoading}
                className="p-1.5 ml-1 rounded-full hover:bg-[rgba(var(--scb-light-gray),0.5)] text-[rgb(var(--scb-honolulu-blue))] transition-colors"
                title="Regenerate with AI"
              >
                {isLoading ? (
                  <EnhancedInlineSpinner size="sm" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </button>
            )}
            
            <button 
              onClick={handleDownload}
              disabled={isLoading}
              className="p-1.5 ml-1 rounded-full hover:bg-[rgba(var(--scb-light-gray),0.5)] text-[rgb(var(--scb-dark-gray))] transition-colors"
              title="Download Chart"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* AI Insights Panel */}
      {showAIInsights && data.aiInsights && (
        <div className="px-4 py-3 bg-[rgba(var(--scb-american-green),0.05)] border-b border-[rgba(var(--scb-american-green),0.2)] animate-fadeIn">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 mt-1 text-[rgb(var(--scb-american-green))]" />
            <div className="flex-1">
              <div className="flex justify-between">
                <h4 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">AI Analysis</h4>
                <button
                  onClick={() => setShowAIInsights(false)}
                  className="p-0.5 text-[rgb(var(--scb-dark-gray))] hover:text-[rgb(var(--scb-muted-red))]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs mt-1 text-[rgb(var(--scb-dark-gray))]">{data.aiInsights.summary}</p>
              
              {data.aiInsights.recommendations.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-[rgb(var(--scb-dark-gray))]">Recommendations:</p>
                  <ul className="text-xs mt-1 space-y-1">
                    {data.aiInsights.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-1 text-[rgb(var(--scb-dark-gray))]">
                        <span className="text-[rgb(var(--scb-american-green))]">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex items-center gap-2 mt-2">
                <div className="text-[10px] text-[rgb(var(--scb-dark-gray))] opacity-80 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  <span>AI confidence: {(data.aiInsights.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="text-[10px] text-[rgb(var(--scb-dark-gray))] opacity-80">
                  Updated: {typeof data.aiInsights.updatedAt === 'object' 
                    ? data.aiInsights.updatedAt.toLocaleString() 
                    : new Date(data.aiInsights.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main chart container */}
      <div className="flex-1 flex items-center justify-center p-4 relative">
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 border-2 border-[rgba(var(--scb-honolulu-blue),0.2)] border-t-[rgb(var(--scb-honolulu-blue))] rounded-full animate-spin"></div>
              <p className="text-sm text-[rgb(var(--scb-dark-gray))]">Generating visualization...</p>
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
          <desc>{subtitle || `Animated Sankey diagram showing flow relationships`}</desc>
        </svg>
        
        {/* No data state */}
        {!isLoading && (!data.nodes.length || !data.links.length) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Info className="w-10 h-10 mx-auto mb-2 text-[rgb(var(--scb-border))]" />
              <p className="text-sm text-[rgb(var(--scb-dark-gray))]">No flow data available</p>
            </div>
          </div>
        )}
        
        {/* Tooltip - SCB styling */}
        {tooltipContent.visible && (
          <div 
            className="absolute pointer-events-none z-10 bg-white rounded-md shadow-lg max-w-xs border border-[rgb(var(--scb-border))] p-3"
            style={{
              left: `${tooltipContent.x + 10}px`,
              top: `${tooltipContent.y - 10}px`,
              transform: 'translate(-50%, -100%)',
            }}
            dangerouslySetInnerHTML={{ __html: tooltipContent.content }}
          />
        )}
        
        {/* Legend */}
        <div className="absolute bottom-2 right-2 bg-white/90 p-2 rounded border border-[rgb(var(--scb-border))] text-xs">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 bg-[rgb(var(--scb-dark-gray))] opacity-80 rounded-sm"></div>
            <span className="text-[rgb(var(--scb-dark-gray))]">Standard Flow</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[rgb(var(--scb-american-green))] opacity-80 rounded-sm"></div>
            <span className="flex items-center gap-1 text-[rgb(var(--scb-dark-gray))]">
              <Sparkles className="w-3 h-3 text-[rgb(var(--scb-american-green))]" />
              AI Enhanced
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAnimatedSankeyChart;