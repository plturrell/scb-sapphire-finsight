import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal, SankeyGraph } from 'd3-sankey';
import { Sparkles, Info, Edit, Download, RefreshCw } from 'lucide-react';
import { SankeyData, SankeyLink, SankeyNode } from '../types';

// Type definitions for D3 Sankey's internal representations
type D3SankeyNode = SankeyNode & {
  index: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  sourceLinks: any[];
  targetLinks: any[];
};

type D3SankeyLink = Omit<SankeyLink, 'source' | 'target'> & {
  source: D3SankeyNode;
  target: D3SankeyNode;
  path?: string;
  width: number; // D3 Sankey adds this property during layout calculation
};

interface AnimatedSankeyChartProps {
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
const getNodeColor = (node: D3SankeyNode): string => {
  if (!node.group) return horizonColors.neutralGray;
  // Safely handle the node.group property with type assertion
  
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

const getLinkColor = (link: D3SankeyLink | SankeyLink, opacity: number = 0.4): string => {
  if (link.uiColor) return link.uiColor;
  
  // Handle case where source/target are indices or nodes
  let source = 0;
  let target = 0;
  
  if (typeof link.source === 'number') {
    source = link.source;
  } else if (typeof link.source === 'object' && link.source !== null) {
    // Use a type assertion to tell TypeScript that link.source is a D3SankeyNode
    const sourceNode = link.source as unknown as D3SankeyNode;
    source = sourceNode.index || 0;
  }
  
  if (typeof link.target === 'number') {
    target = link.target;
  } else if (typeof link.target === 'object' && link.target !== null) {
    // Use a type assertion to tell TypeScript that link.target is a D3SankeyNode
    const targetNode = link.target as unknown as D3SankeyNode;
    target = targetNode.index || 0;
  }
  
  // Gradient based on indices - simple approach
  const colors = Object.values(horizonColors);
  const colorIndex = (source + target) % colors.length;
  
  // If AI enhanced, use a slight different coloring
  if (link.aiEnhanced) {
    return `rgba(76, 165, 133, ${opacity + 0.2})`; // SCB green with higher opacity
  }
  
  return d3.color(colors[colorIndex])?.copy({opacity})?.toString() || `rgba(74, 84, 86, ${opacity})`;
};

const AnimatedSankeyChart: React.FC<AnimatedSankeyChartProps> = ({
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
        source: typeof link.source === 'object' && link.source !== null ? 
          ((link.source as any).index !== undefined ? (link.source as any).index : 0) : link.source,
        target: typeof link.target === 'object' && link.target !== null ? 
          ((link.target as any).index !== undefined ? (link.target as any).index : 0) : link.target,
      })),
    };

    // Apply the Sankey layout
    // Apply the Sankey layout and cast the result to our internal types
    const result = sankeyGenerator(sanitizedData);
    const nodes = result.nodes as unknown as D3SankeyNode[];
    const links = result.links as unknown as D3SankeyLink[];
    
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
          .attr('x1', () => {
            if (typeof link.source === 'object' && link.source !== null) {
              return (link.source as D3SankeyNode).x1;
            }
            return 0;
          })
          .attr('y1', () => {
            if (typeof link.source === 'object' && link.source !== null) {
              const sourceNode = link.source as D3SankeyNode;
              return (sourceNode.y0 + sourceNode.y1) / 2;
            }
            return 0;
          })
          .attr('x2', () => {
            if (typeof link.target === 'object' && link.target !== null) {
              return (link.target as D3SankeyNode).x0;
            }
            return 0;
          })
          .attr('y2', () => {
            if (typeof link.target === 'object' && link.target !== null) {
              const targetNode = link.target as D3SankeyNode;
              return (targetNode.y0 + targetNode.y1) / 2;
            }
            return 0;
          });

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
      
    // Create the links with SAP Horizon styling and animation support
    const linkPaths = linksGroup
      .selectAll('path')
      .data(links, (d: any) => {
        // Create a stable ID for each link based on source and target
        const sourceId = typeof d.source === 'object' ? d.source.name : `Node ${d.source}`;
        const targetId = typeof d.target === 'object' ? d.target.name : `Node ${d.target}`;
        return `${sourceId}-${targetId}`;
      })
      .join(
        // Enter new links with animations
        enter => enter.append('path')
          .attr('d', sankeyLinkHorizontal())
          .attr('stroke', (d: any) => d.aiEnhanced ? `url(#ai-gradient-${links.indexOf(d as unknown as D3SankeyLink)})` : getLinkColor(d as unknown as SankeyLink))
          .attr('stroke-width', 0) // Start with 0 width for animation
          .attr('fill', 'none')
          .attr('stroke-opacity', 0.1) // Start nearly transparent
          .attr('class', (d: any) => d.aiEnhanced ? 'ai-enhanced-link' : '')
          .call(enter => enter.transition().duration(1000)
            .attr('stroke-width', d => Math.max(1, d.width || 0))
            .attr('stroke-opacity', 0.4)
          ),
        // Update existing links with animations
        update => update
          .call(update => update.transition().duration(800)
            .attr('d', sankeyLinkHorizontal())
            .attr('stroke', (d: any) => d.aiEnhanced ? `url(#ai-gradient-${links.indexOf(d as unknown as D3SankeyLink)})` : getLinkColor(d as unknown as SankeyLink))
            .attr('stroke-width', d => Math.max(1, d.width || 0))
          ),
        // Exit links with animations
        exit => exit
          .call(exit => exit.transition().duration(500)
            .attr('stroke-opacity', 0)
            .attr('stroke-width', 0)
            .remove()
          )
      )
      .on('mouseover', function(event: any, d: any) {
        d3.select(this)
          .attr('stroke-opacity', 0.7)
          .attr('stroke', d => getLinkColor(d as SankeyLink, 0.7));

        // Source and target names
        const sourceName = typeof d.source === 'object' ? d.source.name : `Node ${d.source}`;
        const targetName = typeof d.target === 'object' ? d.target.name : `Node ${d.target}`;
        
        // Create tooltip content
        const content = `
          <div class="font-medium">${sourceName} → ${targetName}</div>
          <div class="text-sm mt-1">Value: ${d.value.toLocaleString()}</div>
          ${d.aiEnhanced ? `
            <div class="text-xs mt-1 flex items-center gap-1 text-[${horizonColors.scbGreen}]">
              <span>AI enhanced (${((d.value - (d.originalValue || 0))/(d.originalValue || 1) * 100).toFixed(1)}% change)</span>
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
          .attr('stroke', d => getLinkColor(d as SankeyLink));
        
        setTooltipContent(prev => ({
          ...prev,
          visible: false,
        }));
      });

    // Create nodes group with animations
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
          .call(enter => enter.transition().duration(800)
            .attr('opacity', 0.8)
          ),
        // Update existing nodes with animations
        update => update
          .call(update => update.transition().duration(800)
            .attr('x', d => d.x0 || 0)
            .attr('y', d => d.y0 || 0)
            .attr('height', d => ((d.y1 || 0) - (d.y0 || 0)) || 0)
            .attr('width', d => ((d.x1 || 0) - (d.x0 || 0)) || 0)
            .attr('fill', d => getNodeColor(d))
          ),
        // Exit nodes with animations
        exit => exit
          .call(exit => exit.transition().duration(500)
            .attr('opacity', 0)
            .remove()
          )
      )
      .on('mouseover', function(event: any, d: any) {
        d3.select(this).attr('opacity', 1);
        
        // Create tooltip content for nodes
        const content = `
          <div class="font-medium">${d.name}</div>
          <div class="text-sm mt-1">${d.group ? 'Category: ' + d.group : ''}</div>
          <div class="text-sm">Value: ${(d.value || 0).toLocaleString()}</div>
          ${d.predictedValue ? `
            <div class="text-xs mt-1 flex items-center text-[${horizonColors.scbBlue}]">
              <span>Predicted: ${d.predictedValue.toLocaleString()} (${(d.confidence || 0) * 100}% confidence)</span>
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
        d3.select(this).attr('opacity', 0.8);
        setTooltipContent(prev => ({
          ...prev,
          visible: false,
        }));
      });
    
    // Add node labels with animations
    const nodeLabels = nodesGroup
      .selectAll('text')
      .data(nodes, (d: any) => d.name)
      .join(
        // Enter new labels with animations
        enter => enter.append('text')
          .attr('x', d => (d.x0 || 0) < innerWidth / 2 ? (d.x1 || 0) + 6 : (d.x0 || 0) - 6)
          .attr('y', d => ((d.y0 || 0) + ((d.y1 || 0) - (d.y0 || 0)) / 2))
          .attr('dy', '0.35em')
          .attr('text-anchor', d => (d.x0 || 0) < innerWidth / 2 ? 'start' : 'end')
          .attr('font-size', '10px')
          .attr('font-family', '"SC Prosper Sans", system-ui, sans-serif')
          .attr('fill', 'currentColor')
          .attr('opacity', 0) // Start invisible
          .text(d => d.name)
          .call(enter => enter.transition().duration(800).delay(200)
            .attr('opacity', 1)
          ),
        // Update existing labels with animations  
        update => update
          .call(update => update.transition().duration(800)
            .attr('x', d => (d.x0 || 0) < innerWidth / 2 ? (d.x1 || 0) + 6 : (d.x0 || 0) - 6)
            .attr('y', d => ((d.y0 || 0) + ((d.y1 || 0) - (d.y0 || 0)) / 2))
            .attr('text-anchor', d => (d.x0 || 0) < innerWidth / 2 ? 'start' : 'end')
          ),
        // Exit labels with animations
        exit => exit
          .call(exit => exit.transition().duration(500)
            .attr('opacity', 0)
            .remove()
          )
      );

    // Save current data for future animations
    prevDataRef.current = data;
  }, [data, width, height]);

  // Initial chart creation & updates
  useEffect(() => {
    updateChart();
  }, [updateChart]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      updateChart();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [updateChart]);

  return (
    <div className="flex flex-col rounded-lg overflow-hidden bg-white">
      {/* Chart title and controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-medium text-lg">{title}</h3>
        
        {showAIControls && (
          <div className="flex items-center space-x-2">
            {data.aiInsights && (
              <button
                onClick={() => setShowAIInsights(!showAIInsights)}
                className="p-1.5 rounded-md hover:bg-gray-100 flex items-center gap-1 text-sm"
              >
                <Sparkles size={16} className="text-blue-500" />
                <span>AI Insights</span>
                <span className="bg-blue-100 text-blue-800 text-xs px-1.5 rounded-full">
                  {Math.round(data.aiInsights.confidence * 100)}%
                </span>
              </button>
            )}
            
            {onRegenerateClick && (
              <button
                onClick={onRegenerateClick}
                className="p-1.5 rounded-md hover:bg-gray-100"
                title="Regenerate"
              >
                <RefreshCw size={16} />
              </button>
            )}
            
            {onEditClick && (
              <button
                onClick={onEditClick}
                className="p-1.5 rounded-md hover:bg-gray-100"
                title="Edit Data"
              >
                <Edit size={16} />
              </button>
            )}
            
            <button
              onClick={() => {
                // Export SVG as PNG file
                if (svgRef.current) {
                  const svgData = new XMLSerializer().serializeToString(svgRef.current);
                  const canvas = document.createElement('canvas');
                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  
                  if (ctx) {
                    const img = new Image();
                    img.onload = () => {
                      ctx.drawImage(img, 0, 0);
                      const a = document.createElement('a');
                      a.download = 'financial-flow.png';
                      a.href = canvas.toDataURL('image/png');
                      a.click();
                    };
                    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                  }
                }
              }}
              className="p-1.5 rounded-md hover:bg-gray-100"
              title="Download as PNG"
            >
              <Download size={16} />
            </button>
          </div>
        )}
      </div>
      
      {/* AI Insights panel */}
      {showAIInsights && data.aiInsights && (
        <div className="p-4 bg-blue-50 border-b border-blue-100">
          <div className="flex items-start space-x-2">
            <Sparkles size={20} className="text-blue-500 mt-1 flex-shrink-0" />
            <div>
              <div className="font-medium text-blue-800 mb-1">AI-Enhanced Analysis</div>
              <p className="text-sm text-gray-800 mb-2">{data.aiInsights.summary}</p>
              
              {data.aiInsights.recommendations.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-1">RECOMMENDATIONS:</div>
                  <ul className="space-y-1">
                    {data.aiInsights.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-gray-800 flex items-start">
                        <span className="text-blue-500 mr-1.5">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="text-xs text-gray-500 mt-3">
                Last updated: {data.aiInsights.updatedAt.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Chart visualization */}
      <div className="relative p-4">
        <svg ref={svgRef} className="w-full" />
        
        {/* Tooltip */}
        {tooltipContent.visible && (
          <div
            className="absolute z-10 bg-white p-2 rounded shadow-lg text-sm border border-gray-200 max-w-xs"
            style={{
              left: Math.min(tooltipContent.x, window.innerWidth - 200),
              top: tooltipContent.y + 10,
            }}
            dangerouslySetInnerHTML={{ __html: tooltipContent.content }}
          />
        )}
      </div>
    </div>
  );
};

export default AnimatedSankeyChart;
