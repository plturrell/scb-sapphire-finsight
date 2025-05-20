import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal, SankeyGraph } from 'd3-sankey';
import { Sparkles, Info, Edit, Download, RefreshCw } from 'lucide-react';
import { SankeyData, SankeyLink, SankeyNode } from '../types';

// Extended SankeyNode type for D3 visualization specifics
type SankeyNodeExtended = SankeyNode & d3.SimulationNodeDatum;

interface SankeyChartProps {
  data: SankeyData;
  width?: number;
  height?: number;
  title?: string;
  showAIControls?: boolean;
  onRegenerateClick?: () => void;
  onEditClick?: () => void;
}

// Color palette based on SAP Horizon theme
const horizonColors = {
  blue: 'rgb(13, 106, 168)', // #0D6AA8
  teal: 'rgb(0, 112, 122)', // #00707A
  green: 'rgb(43, 83, 0)', // #2B5300
  purple: 'rgb(88, 64, 148)', // #584094
  red: 'rgb(195, 0, 51)', // #C30033
  neutralGray: 'rgb(74, 84, 86)', // #4A5456
  scbBlue: 'rgb(15, 40, 109)', // SCB primary blue
  scbGreen: 'rgb(76, 165, 133)', // SCB accent green
  scbLightBlue: 'rgb(42, 120, 188)', // SCB light blue
  lightBg: 'rgb(248, 250, 252)', // Light background
};

// Node colors based on group/category
const getNodeColor = (node: SankeyNode): string => {
  if (!node.group) return horizonColors.neutralGray;
  
  const colorMap: Record<string, string> = {
    'income': horizonColors.green,
    'expense': horizonColors.red,
    'asset': horizonColors.blue,
    'liability': horizonColors.purple,
    'equity': horizonColors.teal,
    'investment': horizonColors.scbBlue,
    'finance': horizonColors.scbGreen,
    'trading': horizonColors.scbLightBlue,
  };
  
  return colorMap[node.group.toLowerCase()] || horizonColors.neutralGray;
};

const getLinkColor = (link: SankeyLink, opacity: number = 0.4): string => {
  if (link.uiColor) return link.uiColor;
  
  // Handle case where source/target are indices or nodes
  const source = typeof link.source === 'number' 
    ? link.source 
    : (link.source as any).index || 0;
  
  const target = typeof link.target === 'number' 
    ? link.target 
    : (link.target as any).index || 0;
  
  // Gradient based on indices - simple approach
  const colors = Object.values(horizonColors);
  const colorIndex = (source + target) % colors.length;
  
  // If AI enhanced, use a slight different coloring
  if (link.aiEnhanced) {
    return `rgba(76, 165, 133, ${opacity + 0.2})`; // SCB green with higher opacity
  }
  
  return d3.color(colors[colorIndex])?.copy({opacity})?.toString() || `rgba(74, 84, 86, ${opacity})`;
};

const SankeyChart: React.FC<SankeyChartProps> = ({
  data,
  width = 800,
  height = 500,
  title = 'Financial Flow Analysis',
  showAIControls = true,
  onRegenerateClick,
  onEditClick,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [showAIInsights, setShowAIInsights] = useState(false);
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
  
  // Function to create or update the chart
  const updateChart = useCallback(() => {
    if (!svgRef.current || !data.nodes.length) return;
    
    // Clear SVG if it's a full redraw, or get the existing one for animations
    const svg = d3.select(svgRef.current);
    const isFirstRender = svg.selectAll('*').empty();
    
    // Create the chart with padding
    const margin = { top: 20, right: 30, bottom: 20, left: 30 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // For a full redraw, set up the SVG container first
    if (isFirstRender) {
      svg.attr('width', width)
         .attr('height', height);
      
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
        source: typeof link.source === 'object' ? (link.source as any).index || 0 : link.source,
        target: typeof link.target === 'object' ? (link.target as any).index || 0 : link.target,
      })),
    };

    // Apply the Sankey layout
    const { nodes, links } = sankeyGenerator(sanitizedData as unknown as SankeyGraph<SankeyNode, SankeyLink>);
    
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
          .attr('x1', typeof link.source === 'object' ? (link.source as any).x1 || 0 : 0)
          .attr('y1', typeof link.source === 'object' ? ((link.source as any).y0 || 0) + ((link.source as any).y1 || 0) / 2 : 0)
          .attr('x2', typeof link.target === 'object' ? (link.target as any).x0 || 0 : 0)
          .attr('y2', typeof link.target === 'object' ? ((link.target as any).y0 || 0) + ((link.target as any).y1 || 0) / 2 : 0);

        gradient.append('stop')
          .attr('offset', '0%')
          .attr('stop-color', horizonColors.scbBlue);

        gradient.append('stop')
          .attr('offset', '100%')
          .attr('stop-color', horizonColors.scbGreen);
      }
    });

    // Create links group
    const linksGroup = container.append('g')
      .attr('class', 'sankey-links');
      
    // Add enhanced filter effects for glowing
    const filter = defs.append("filter")
      .attr("id", "glow-effect")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    
    filter.append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "blur");
    
    filter.append("feComposite")
      .attr("in", "SourceGraphic")
      .attr("in2", "blur")
      .attr("operator", "over");
    
    // Add drop shadow filter
    const dropShadow = defs.append("filter")
      .attr("id", "drop-shadow")
      .attr("x", "-30%")
      .attr("y", "-30%")
      .attr("width", "160%")
      .attr("height", "160%");
    
    dropShadow.append("feDropShadow")
      .attr("dx", "0")
      .attr("dy", "2")
      .attr("stdDeviation", "2")
      .attr("flood-opacity", "0.2");
    
    // Create the links with enhanced SAP Horizon styling and animation support
    const linkPaths = linksGroup
      .selectAll('path')
      .data(links, (d: any) => {
        // Create a stable ID for each link based on source and target
        const sourceId = typeof d.source === 'object' ? d.source.name : `Node ${d.source}`;
        const targetId = typeof d.target === 'object' ? d.target.name : `Node ${d.target}`;
        return `${sourceId}-${targetId}`;
      })
      .join(
        // Enter new links with enhanced animations
        enter => enter.append('path')
          .attr('d', sankeyLinkHorizontal())
          .attr('stroke', d => d.aiEnhanced ? `url(#ai-gradient-${links.indexOf(d)})` : getLinkColor(d))
          .attr('stroke-width', 0) // Start with 0 width for animation
          .attr('fill', 'none')
          .attr('stroke-opacity', 0.1) // Start nearly transparent
          .attr('class', d => d.aiEnhanced ? 'ai-enhanced-link' : '')
          .attr('filter', d => d.aiEnhanced ? 'url(#glow-effect)' : 'none')
          .attr('transform', 'translate(0, 5) scale(0.97)')
          .call(enter => enter.transition().duration(1200)
            .attr('stroke-width', d => Math.max(1, d.width || 0))
            .attr('stroke-opacity', d => d.aiEnhanced ? 0.6 : 0.4)
            .attr('transform', 'translate(0, 0) scale(1)')
            .ease(d3.easeCubicOut)
          ),
        // Update existing links with enhanced animations
        update => update
          .call(update => update.transition().duration(1000)
            .attr('d', sankeyLinkHorizontal())
            .attr('stroke', d => d.aiEnhanced ? `url(#ai-gradient-${links.indexOf(d)})` : getLinkColor(d))
            .attr('stroke-width', d => Math.max(1, d.width || 0))
            .attr('filter', d => d.aiEnhanced ? 'url(#glow-effect)' : 'none')
            .attr('stroke-opacity', d => d.aiEnhanced ? 0.6 : 0.4)
            .ease(d3.easeCubicInOut)
          ),
        // Exit links with enhanced animations
        exit => exit
          .call(exit => exit.transition().duration(600)
            .attr('stroke-opacity', 0)
            .attr('stroke-width', 0)
            .attr('transform', 'translate(0, -5) scale(0.97)')
            .ease(d3.easeCubicIn)
            .remove()
          )
      )
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('stroke-opacity', 0.7)
          .attr('stroke', d => getLinkColor(d as SankeyLink, 0.7));

        // Source and target names
        const sourceName = typeof d.source === 'object' ? (d.source as any).name : `Node ${d.source}`;
        const targetName = typeof d.target === 'object' ? (d.target as any).name : `Node ${d.target}`;
        
        // Create tooltip content
        const content = `
          <div class="font-medium">${sourceName} → ${targetName}</div>
          <div class="text-sm mt-1">Value: ${d.value.toLocaleString()}</div>
          ${d.aiEnhanced ? `
            <div class="text-xs mt-1 flex items-center gap-1 text-[${horizonColors.scbGreen}]">
              <span>AI enhanced (${((d.value - ((d as any).originalValue || 0))/((d as any).originalValue || 1) * 100).toFixed(1)}% change)</span>
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
          .attr('stroke-opacity', 0.4)
          .attr('stroke', d => getLinkColor(d as SankeyLink));
        
        setTooltipContent(prev => ({
          ...prev,
          visible: false,
        }));
      });

    // The animated nodes implementation will go here
    // Create nodes group with animations
    const nodesGroup = container.append('g')
      .attr('class', 'sankey-nodes');
      
    // Add animated nodes with data binding for updates and enhanced 3D effects
    const nodeRects = nodesGroup
      .selectAll('rect')
      .data(nodes, (d: any) => d.name)
      .join(
        // Enter new nodes with enhanced animations
        enter => enter.append('rect')
          .attr('x', d => d.x0 || 0)
          .attr('y', d => d.y0 || 0)
          .attr('height', d => ((d.y1 || 0) - (d.y0 || 0)) || 0)
          .attr('width', d => ((d.x1 || 0) - (d.x0 || 0)) || 0)
          .attr('fill', d => getNodeColor(d))
          .attr('opacity', 0.2) // Start nearly transparent
          .attr('rx', 6) // More rounded corners for modern look
          .attr('ry', 6)
          .attr('filter', 'url(#drop-shadow)') // Add drop shadow
          .attr('transform', 'scale(0.95) translate(5, 5)') // Start scaled down and offset
          .call(enter => enter.transition().duration(1000)
            .attr('opacity', 0.85)
            .attr('transform', 'scale(1) translate(0, 0)')
            .ease(d3.easeCubicOut)
          ),
        // Update existing nodes with enhanced animations
        update => update
          .call(update => update.transition().duration(900)
            .attr('x', d => d.x0 || 0)
            .attr('y', d => d.y0 || 0)
            .attr('height', d => ((d.y1 || 0) - (d.y0 || 0)) || 0)
            .attr('width', d => ((d.x1 || 0) - (d.x0 || 0)) || 0)
            .attr('fill', d => getNodeColor(d))
            .attr('opacity', 0.85)
            .attr('filter', 'url(#drop-shadow)')
            .ease(d3.easeCubicInOut)
          ),
        // Exit nodes with enhanced animations
        exit => exit
          .call(exit => exit.transition().duration(600)
            .attr('opacity', 0)
            .attr('transform', 'scale(0.9) translate(10, 10)')
            .ease(d3.easeCubicIn)
            .remove()
          )
      )
      // Add glow effect on hover
      .on('mouseenter', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 1)
          .attr('filter', 'url(#glow-effect)')
          .attr('transform', 'scale(1.02)')
      })
      .on('mouseleave', function() {
        d3.select(this)
          .transition()
          .duration(300)
          .attr('opacity', 0.85)
          .attr('filter', 'url(#drop-shadow)')
          .attr('transform', 'scale(1)')
      })
      .on('mouseover', function(event, d) {
        d3.select(this).attr('opacity', 1);
        
        // Create tooltip content for nodes
        const content = `
          <div class="font-medium">${d.name}</div>
          <div class="text-sm mt-1">${d.group ? 'Category: ' + d.group : ''}</div>
          <div class="text-sm">Value: ${(d.value || 0).toLocaleString()}</div>
          ${(d as any).predictedValue ? `
            <div class="text-xs mt-1 flex items-center text-[${horizonColors.scbBlue}]">
              <span>Predicted: ${(d as any).predictedValue.toLocaleString()} (${((d as any).confidence || 0) * 100}% confidence)</span>
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
        d3.select(this).attr('opacity', 0.8);
        setTooltipContent(prev => ({
          ...prev,
          visible: false,
        }));
      });
    
    // Add node labels with enhanced animations and text effects
    const nodeLabels = nodesGroup
      .selectAll('text')
      .data(nodes, (d: any) => d.name)
      .join(
        // Enter new labels with enhanced animations
        enter => enter.append('text')
          .attr('x', d => (d.x0 || 0) < innerWidth / 2 ? (d.x1 || 0) + 8 : (d.x0 || 0) - 8)
          .attr('y', d => ((d.y0 || 0) + ((d.y1 || 0) - (d.y0 || 0)) / 2))
          .attr('dy', '0.35em')
          .attr('text-anchor', d => (d.x0 || 0) < innerWidth / 2 ? 'start' : 'end')
          .attr('font-size', '10px')
          .attr('font-weight', 'medium')
          .attr('font-family', '"SC Prosper Sans", system-ui, sans-serif')
          .attr('fill', 'currentColor')
          .attr('opacity', 0) // Start invisible
          .attr('transform', d => (d.x0 || 0) < innerWidth / 2 ? 'translate(-10, 0)' : 'translate(10, 0)')
          .text(d => d.name)
          // Add text shadow for better visibility
          .style('text-shadow', '0 1px 2px rgba(0, 0, 0, 0.1)')
          // Enhanced animation with staggered delay based on index
          .call(enter => enter.transition().duration(900)
            .delay((d, i) => 200 + i * 30) // Staggered delay
            .attr('opacity', 1)
            .attr('transform', 'translate(0, 0)')
            .ease(d3.easeCubicOut)
          ),
        // Update existing labels with enhanced animations  
        update => update
          .call(update => update.transition().duration(800)
            .attr('x', d => (d.x0 || 0) < innerWidth / 2 ? (d.x1 || 0) + 8 : (d.x0 || 0) - 8)
            .attr('y', d => ((d.y0 || 0) + ((d.y1 || 0) - (d.y0 || 0)) / 2))
            .attr('text-anchor', d => (d.x0 || 0) < innerWidth / 2 ? 'start' : 'end')
            .ease(d3.easeCubicInOut)
          ),
        // Exit labels with enhanced animations
        exit => exit
          .call(exit => exit.transition().duration(500)
            .attr('opacity', 0)
            .attr('transform', d => (d.x0 || 0) < innerWidth / 2 ? 'translate(-10, 0)' : 'translate(10, 0)')
            .ease(d3.easeCubicIn)
            .remove()
          )
      );
    
    // Add hover interaction for labels
    nodeLabels.on('mouseenter', function() {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('font-weight', 'bold')
          .attr('font-size', '11px')
      })
    
    nodeLabels.on('mouseleave', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('font-weight', 'medium')
          .attr('font-size', '10px')
    });

    // Create the nodes with SAP Fiori Horizon styling
    const nodeGroup = svg
      .append('g')
      .selectAll('rect')
      .data(nodes)
      .enter()
      .append('g');

    // Add node rectangles
    nodeGroup
      .append('rect')
      .attr('x', d => d.x0 || 0)
      .attr('y', d => d.y0 || 0)
      .attr('height', d => (d.y1 || 0) - (d.y0 || 0))
      .attr('width', d => (d.x1 || 0) - (d.x0 || 0))
      .attr('fill', d => getNodeColor(d))
      .attr('opacity', 0.8)
      .attr('rx', 4) // Rounded corners for Fiori Horizon style
      .attr('stroke', d => d3.color(getNodeColor(d))?.darker(0.5).toString() || '')
      .attr('stroke-width', 1)
      .on('mouseover', function(event, d) {
        d3.select(this).attr('opacity', 1);
        
        // Create tooltip content
        const content = `
          <div class="font-medium">${d.name}</div>
          <div class="text-sm mt-1">Value: ${d.value?.toLocaleString() || 'N/A'}</div>
          ${(d as any).predictedValue ? `
            <div class="text-xs mt-1 flex items-center gap-1 text-[${horizonColors.scbGreen}]">
              <span>Predicted: ${(d as any).predictedValue.toLocaleString()}</span>
              <span class="text-[${horizonColors.scbGreen}]">(AI confidence: ${((d as any).confidence || 0) * 100}%)</span>
            </div>
          ` : ''}
          ${(d as any).category ? `<div class="text-xs mt-1">Category: ${(d as any).category}</div>` : ''}
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
        d3.select(this).attr('opacity', 0.8);
        
        setTooltipContent(prev => ({
          ...prev,
          visible: false,
        }));
      });

    // Add AI indicators for nodes with predictions
    nodeGroup
      .filter(d => (d as any).predictedValue !== undefined)
      .append('circle')
      .attr('cx', d => (d.x0 || 0) + ((d.x1 || 0) - (d.x0 || 0)) - 6)
      .attr('cy', d => (d.y0 || 0) + 6)
      .attr('r', 5)
      .attr('fill', horizonColors.scbGreen)
      .attr('stroke', 'white')
      .attr('stroke-width', 1);

    // Add node text labels
    nodeGroup
      .append('text')
      .attr('x', d => {
        return d.x0 && d.x1 ? (d.x0 < innerWidth / 2 ? (d.x1 || 0) + 6 : (d.x0 || 0) - 6) : 0;
      })
      .attr('y', d => (d.y0 || 0) + ((d.y1 || 0) - (d.y0 || 0)) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => (d.x0 || 0) < innerWidth / 2 ? 'start' : 'end')
      .attr('font-size', '10px')
      .attr('font-family', 'var(--fiori-font-family, "72", "72full", Arial, Helvetica, sans-serif)')
      .attr('fill', 'rgb(74, 84, 86)')
      .text(d => d.name);

  }, [data, width, height]);

  return (
    <div className="fiori-tile w-full relative glass-effect dark:glass-effect-darker rounded-lg transform hover:scale-[1.01] transition-transform duration-300 ease-in-out">
      {/* Chart title and control bar */}
      <div className="flex justify-between items-center mb-4 p-4 border-b border-[rgb(var(--scb-border))] dark:border-gray-700/40">
        <h3 className="fiori-tile-title text-[rgb(var(--scb-primary))] dark:text-blue-300">{title}</h3>
        
        {showAIControls && (
          <div className="flex items-center gap-2">
            <button 
              className="fiori-btn-ghost rounded-full p-1.5 hover:bg-[rgba(var(--horizon-blue),0.08)] dark:hover:bg-blue-500/10 transform hover:scale-110 transition-all duration-200"
              onClick={() => setShowAIInsights(!showAIInsights)}
              title="AI Insights"
            >
              <Sparkles className="w-4 h-4 text-[rgb(var(--scb-accent))] dark:text-blue-400" />
            </button>
            {onEditClick && (
              <button 
                className="fiori-btn-ghost rounded-full p-1.5 hover:bg-[rgba(var(--horizon-blue),0.08)] dark:hover:bg-blue-500/10 transform hover:scale-110 transition-all duration-200"
                onClick={onEditClick}
                title="Edit Chart"
              >
                <Edit className="w-4 h-4 text-[rgb(var(--horizon-neutral-gray))] dark:text-gray-300" />
              </button>
            )}
            {onRegenerateClick && (
              <button 
                className="fiori-btn-ghost rounded-full p-1.5 hover:bg-[rgba(var(--horizon-blue),0.08)] dark:hover:bg-blue-500/10 transform hover:scale-110 transition-all duration-200 hover:rotate-45" 
                onClick={onRegenerateClick}
                title="Regenerate with AI"
              >
                <RefreshCw className="w-4 h-4 text-[rgb(var(--horizon-blue))] dark:text-blue-400" />
              </button>
            )}
            <button 
              className="fiori-btn-ghost rounded-full p-1.5 hover:bg-[rgba(var(--horizon-blue),0.08)] dark:hover:bg-blue-500/10 transform hover:scale-110 transition-all duration-200 hover:translate-y-[-2px]"
              title="Download Chart" 
              onClick={() => {
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
              }}
            >
              <Download className="w-4 h-4 text-[rgb(var(--horizon-neutral-gray))] dark:text-gray-300" />
            </button>
          </div>
        )}
      </div>
      
      {/* AI Insights Panel - Following "Show the Work" principle */}
      {showAIInsights && data.aiInsights && (
        <div className="mx-4 mb-4 p-4 backdrop-blur-md backdrop-saturate-150 bg-[rgba(var(--scb-light-blue),0.08)] dark:bg-blue-500/10 border border-[rgba(var(--scb-light-blue),0.2)] dark:border-blue-500/20 rounded-md shadow-lg transform transition-all duration-500 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 bg-blue-500/10 p-1.5 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[rgb(var(--scb-accent))] dark:text-blue-400 animate-pulse" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-[rgb(var(--scb-primary))] dark:text-blue-300">AI Analysis</h4>
              <p className="text-xs mt-2 dark:text-gray-300">{data.aiInsights.summary}</p>
              
              {data.aiInsights.recommendations.length > 0 && (
                <div className="mt-3 p-2 bg-white/30 dark:bg-gray-800/30 rounded-md backdrop-blur-sm">
                  <p className="text-xs font-medium text-[rgb(var(--scb-primary))] dark:text-blue-300">Recommendations:</p>
                  <ul className="text-xs mt-2 space-y-2">
                    {data.aiInsights.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 group">
                        <span className="text-[rgb(var(--scb-accent))] dark:text-blue-400 transform group-hover:scale-125 transition-transform">•</span>
                        <span className="dark:text-gray-200 group-hover:text-[rgb(var(--scb-primary))] dark:group-hover:text-blue-300 transition-colors">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex items-center gap-3 mt-3 pt-2 border-t border-[rgba(var(--scb-light-blue),0.15)] dark:border-blue-500/15">
                <div className="text-[10px] text-gray-600 dark:text-gray-300 flex items-center gap-1 bg-white/40 dark:bg-gray-700/40 px-2 py-1 rounded-full backdrop-blur-sm">
                  <Info className="w-3 h-3" />
                  <span>AI confidence: {(data.aiInsights.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400">
                  Updated: {new Date(data.aiInsights.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Visualization with 3D perspective effect */}
      <div className="relative h-full px-4 pb-4 perspective-1000">
        <div className="transform-gpu transition-transform duration-700 ease-out rotateX-3d hover:rotateX-0 overflow-hidden">
          <svg ref={svgRef} className="w-full h-full drop-shadow-xl"></svg>
        </div>
        
        {/* Legend - shows AI elements vs standard elements */}
        <div className="absolute bottom-2 right-2 bg-white/80 dark:bg-gray-800/80 p-2.5 rounded-lg border border-[rgb(var(--scb-border))] dark:border-gray-700/50 text-xs backdrop-blur-sm transform transition-transform hover:scale-105">
          <div className="flex items-center gap-2 mb-2 group">
            <div className="w-3 h-3 bg-[rgb(var(--horizon-neutral-gray))] dark:bg-gray-400 opacity-80 rounded-sm group-hover:scale-125 transition-transform"></div>
            <span className="dark:text-gray-300">Standard Flow</span>
          </div>
          <div className="flex items-center gap-2 group">
            <div className="w-3 h-3 bg-[rgb(var(--scb-accent))] dark:bg-blue-400 opacity-80 rounded-sm group-hover:scale-125 transition-transform"></div>
            <span className="flex items-center gap-1 dark:text-gray-300">
              <Sparkles className="w-3 h-3 text-[rgb(var(--scb-accent))] dark:text-blue-400 animate-pulse" />
              AI Enhanced Flow
            </span>
          </div>
        </div>
        
        {/* Enhanced Tooltip with glassmorphism */}
        {tooltipContent.visible && (
          <div 
            className="absolute pointer-events-none z-10 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-xl max-w-xs backdrop-blur-md backdrop-saturate-150 border border-gray-200 dark:border-gray-700/50 animate-fadeIn"
            style={{
              left: `${tooltipContent.x + 15}px`,
              top: `${tooltipContent.y - 15}px`,
              transform: 'translate(-50%, -100%) perspective(1000px) rotateX(5deg)',
              transformOrigin: 'bottom center',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.12), 0 5px 10px rgba(0, 0, 0, 0.08)'
            }}
          >
            <div className="p-3 text-xs dark:text-white" dangerouslySetInnerHTML={{ __html: tooltipContent.content }} />
            <div className="absolute w-4 h-4 bg-white/90 dark:bg-gray-800/90 transform rotate-45 left-1/2 bottom-[-8px] border-b border-r border-gray-200 dark:border-gray-700/50"></div>
          </div>
        )}
      </div>
      
      {/* Add custom CSS for 3D transforms */}
      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .rotateX-3d {
          transform: rotateX(3deg);
        }
        
        .rotateX-0 {
          transform: rotateX(0deg);
        }
      `}</style>
    </div>
  );
};

export default SankeyChart;
