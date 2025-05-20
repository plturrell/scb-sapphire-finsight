import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Sparkles, Info, Edit, Download, RefreshCw, Maximize2, ZoomIn, ZoomOut, Filter, X, Compass, Share2 } from 'lucide-react';
import { EnhancedLoadingButton, EnhancedInlineSpinner } from './EnhancedLoadingSpinner';

// Extend the SimulationNodeDatum with our custom properties
interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  group: string;
  category?: string;
  value: number; // Required for node sizing
  relevance?: number;
  confidence?: number;
  aiGenerated?: boolean;
  description?: string;
  // Ensure type safety for properties that d3 will add
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  index?: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  value: number;
  type?: string;
  confidence?: number;
  aiGenerated?: boolean;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  aiMetadata?: {
    generatedAt: Date;
    confidenceScore: number;
    dataSource: string[];
    insightSummary: string;
  };
}

interface EnhancedForceDirectedGraphProps {
  data: GraphData;
  width?: number;
  height?: number;
  title?: string;
  showControls?: boolean;
  showLegend?: boolean;
  isLoading?: boolean;
  onNodeClick?: (node: GraphNode) => void;
  onRegenerateClick?: () => void;
  className?: string;
}

/**
 * Enhanced Force Directed Graph with SCB beautiful styling
 * Used for knowledge graph visualization with support for AI-generated data
 */
const EnhancedForceDirectedGraph: React.FC<EnhancedForceDirectedGraphProps> = ({
  data,
  width = 800,
  height = 600,
  title = 'Knowledge Graph',
  showControls = true,
  showLegend = true,
  isLoading = false,
  onNodeClick,
  onRegenerateClick,
  className = ''
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [showAIMetadata, setShowAIMetadata] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [tooltipData, setTooltipData] = useState<{
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

  // Simulation ref to control it from UI
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length || isLoading) return;

    // Clear any existing chart
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 10, right: 10, bottom: 10, left: 10 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto;');
      
    // Add zoom capabilities
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });
      
    svg.call(zoom);
    
    // Main group for all elements
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add a subtle grid pattern for the background
    const grid = g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(d3.range(0, innerWidth, 50))
      .enter()
      .append('line')
      .attr('x1', d => d)
      .attr('y1', 0)
      .attr('x2', d => d)
      .attr('y2', innerHeight)
      .attr('stroke', 'rgba(var(--scb-border), 0.3)')
      .attr('stroke-width', 0.5);

    const gridHorizontal = g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(d3.range(0, innerHeight, 50))
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('y1', d => d)
      .attr('x2', innerWidth)
      .attr('y2', d => d)
      .attr('stroke', 'rgba(var(--scb-border), 0.3)')
      .attr('stroke-width', 0.5);

    // Create links with improved styling
    const linkGroup = g.append('g')
      .attr('class', 'links');
      
    const link = linkGroup
      .selectAll('line')
      .data(data.links)
      .join('line')
      .attr('stroke', d => d.aiGenerated ? 'rgb(var(--scb-american-green))' : 'rgb(var(--scb-dark-gray))')
      .attr('stroke-opacity', d => d.aiGenerated ? 0.8 : 0.5)
      .attr('stroke-width', d => Math.sqrt(d.value) * 0.7)
      .attr('class', d => d.aiGenerated ? 'ai-generated-link' : '')
      .attr('stroke-dasharray', d => d.aiGenerated ? '5,3' : '0');

    // Create nodes with improved SCB styling
    const nodeGroup = g.append('g')
      .attr('class', 'nodes');
      
    const node = nodeGroup
      .selectAll('circle')
      .data(data.nodes)
      .join('circle')
      .attr('r', d => 4 + d.value * 1.5)
      .attr('fill', d => getNodeColor(d.group))
      .attr('stroke', d => d.aiGenerated ? 'rgb(var(--scb-american-green))' : '#fff')
      .attr('stroke-width', d => d.aiGenerated ? 2 : 1)
      .attr('opacity', 0.9)
      .call(drag(simulationRef) as any)
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget).attr('opacity', 1);
        
        // Highlight connected links and nodes
        const connectedNodeIds = new Set<string | GraphNode>();
        link.each(function(l) {
          const source = typeof l.source === 'object' ? l.source.id : l.source;
          const target = typeof l.target === 'object' ? l.target.id : l.target;
          
          if (source === d.id || target === d.id) {
            d3.select(this).attr('stroke-opacity', 1).attr('stroke-width', l => Math.sqrt((l as GraphLink).value) * 0.9);
            connectedNodeIds.add(source);
            connectedNodeIds.add(target);
          }
        });
        
        node.attr('opacity', n => connectedNodeIds.has(n.id) ? 1 : 0.3);
        
        // Show tooltip with SCB styling
        let tooltipContent = `
          <div class="font-medium text-[rgb(var(--scb-honolulu-blue))]">${d.label}</div>
          <div class="text-sm mt-1 text-[rgb(var(--scb-dark-gray))]">Group: ${d.group}</div>
          <div class="text-sm text-[rgb(var(--scb-dark-gray))]">Value: ${d.value}</div>
        `;
        
        if (d.aiGenerated) {
          tooltipContent += `
            <div class="text-xs mt-1 flex items-center gap-1 text-[rgb(var(--scb-american-green))]">
              <span>AI generated (confidence: ${(d.confidence || 0) * 100}%)</span>
            </div>
          `;
        }
        
        if (d.description) {
          tooltipContent += `
            <div class="text-xs mt-1 text-[rgb(var(--scb-dark-gray))]">${d.description}</div>
          `;
        }
        
        setTooltipData({
          content: tooltipContent,
          x: event.pageX,
          y: event.pageY,
          visible: true,
        });
      })
      .on('mouseout', (event) => {
        d3.select(event.currentTarget).attr('opacity', 0.9);
        node.attr('opacity', 0.9);
        link.attr('stroke-opacity', d => (d as GraphLink).aiGenerated ? 0.8 : 0.5)
            .attr('stroke-width', d => Math.sqrt((d as GraphLink).value) * 0.7);
            
        setTooltipData(prev => ({...prev, visible: false}));
      })
      .on('click', (event, d) => {
        setSelectedNode(d);
        if (onNodeClick) onNodeClick(d);
      });

    // Add text labels for larger nodes with SCB font styling
    const labels = nodeGroup
      .selectAll('text')
      .data(data.nodes.filter(d => d.value > 3)) // Only label larger nodes
      .join('text')
      .attr('dx', 10)
      .attr('dy', '.35em')
      .text(d => d.label)
      .attr('font-size', '10px')
      .attr('font-family', '"SCProsperSans", "72", "72full", Arial, Helvetica, sans-serif')
      .attr('fill', 'rgb(var(--scb-dark-gray))')
      .attr('pointer-events', 'none');
    
    // Add AI indicators for AI-generated nodes with SCB styling
    const aiMarkers = nodeGroup
      .selectAll('.ai-marker')
      .data(data.nodes.filter(d => d.aiGenerated))
      .join('circle')
      .attr('class', 'ai-marker')
      .attr('r', 3)
      .attr('fill', 'rgb(var(--scb-american-green))')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('pointer-events', 'none');

    // Create the force simulation with improved parameters
    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(data.links).id(d => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-180))
      .force('center', d3.forceCenter(innerWidth / 2, innerHeight / 2))
      .force('collision', d3.forceCollide().radius(d => 6 + (d as GraphNode).value * 1.5))
      .on('tick', () => {
        link
          .attr('x1', d => (d.source as GraphNode).x || 0)
          .attr('y1', d => (d.source as GraphNode).y || 0)
          .attr('x2', d => (d.target as GraphNode).x || 0)
          .attr('y2', d => (d.target as GraphNode).y || 0);

        node
          .attr('cx', d => d.x || 0)
          .attr('cy', d => d.y || 0);
          
        labels
          .attr('x', d => d.x || 0)
          .attr('y', d => d.y || 0);
          
        aiMarkers
          .attr('cx', d => (d.x || 0) + 5)
          .attr('cy', d => (d.y || 0) - 5);
      });
      
    // Store simulation reference
    simulationRef.current = simulation;
    
    // Drag functionality
    function drag(simulationRef: React.MutableRefObject<d3.Simulation<GraphNode, GraphLink> | null>) {
      function dragstarted(event: any) {
        if (!event.active && simulationRef.current) simulationRef.current.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      
      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      
      function dragended(event: any) {
        if (!event.active && simulationRef.current) simulationRef.current.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      
      return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    }
    
    // Cleanup function
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [data, width, height, isLoading, onNodeClick]);

  // Handle zoom controls
  const handleZoomIn = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).transition().call(
      (d3.zoom() as any).scaleBy, 1.3
    );
  };
  
  const handleZoomOut = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).transition().call(
      (d3.zoom() as any).scaleBy, 0.7
    );
  };
  
  const handleZoomReset = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).transition().call(
      (d3.zoom() as any).transform, d3.zoomIdentity
    );
    setZoomLevel(1);
  };

  // Group colors mapping with SCB colors
  const getNodeColor = (group: string): string => {
    const colorMap: { [key: string]: string } = {
      'financial': 'rgb(var(--scb-honolulu-blue))',
      'market': 'rgb(0, 112, 122)', // teal
      'regulatory': 'rgb(88, 64, 148)', // purple
      'economic': 'rgb(var(--scb-american-green))',
      'risk': 'rgb(var(--scb-muted-red))',
      'technology': 'rgb(42, 120, 188)', // light blue
      'client': 'rgb(245, 152, 0)', // yellow
      'internal': 'rgb(15, 40, 109)', // SCB primary blue
    };
    return colorMap[group.toLowerCase()] || 'rgb(var(--scb-dark-gray))';
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Control panel with SCB styling */}
      {showControls && (
        <div className="fiori-tile px-4 py-3 mb-4">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <h3 className="text-base font-medium text-[rgb(var(--scb-dark-gray))]">{title}</h3>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowAIMetadata(!showAIMetadata)}
                className="fiori-btn-ghost p-1.5 rounded-full hover:bg-[rgba(var(--scb-light-gray),0.5)] transition-colors"
                title="AI Metadata"
              >
                <Sparkles className="w-4 h-4 text-[rgb(var(--scb-american-green))]" />
              </button>
              
              {/* Zoom Controls with SCB styling */}
              <div className="flex border border-[rgb(var(--scb-border))] rounded-md overflow-hidden">
                <button 
                  onClick={handleZoomIn}
                  className="p-1.5 hover:bg-[rgba(var(--scb-light-gray),0.5)] transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4 text-[rgb(var(--scb-dark-gray))]" />
                </button>
                <button 
                  onClick={handleZoomReset}
                  className="p-1.5 hover:bg-[rgba(var(--scb-light-gray),0.5)] transition-colors"
                  title="Reset Zoom"
                >
                  <Maximize2 className="w-4 h-4 text-[rgb(var(--scb-dark-gray))]" />
                </button>
                <button 
                  onClick={handleZoomOut}
                  className="p-1.5 hover:bg-[rgba(var(--scb-light-gray),0.5)] transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4 text-[rgb(var(--scb-dark-gray))]" />
                </button>
              </div>
              
              <button 
                className="fiori-btn-ghost p-1.5 rounded-full hover:bg-[rgba(var(--scb-light-gray),0.5)] transition-colors"
                title="Filter Graph" 
              >
                <Filter className="w-4 h-4 text-[rgb(var(--scb-dark-gray))]" />
              </button>
              
              {onRegenerateClick && (
                <button 
                  onClick={onRegenerateClick}
                  className="fiori-btn-ghost p-1.5 rounded-full hover:bg-[rgba(var(--scb-light-gray),0.5)] transition-colors"
                  title="Regenerate Graph"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <EnhancedInlineSpinner size="sm" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-[rgb(var(--scb-honolulu-blue))]" />
                  )}
                </button>
              )}
              
              <button 
                className="fiori-btn-ghost p-1.5 rounded-full hover:bg-[rgba(var(--scb-light-gray),0.5)] transition-colors"
                title="Download Graph"
                onClick={() => {
                  if (!svgRef.current) return;
                  // Download SVG
                  const svgData = new XMLSerializer().serializeToString(svgRef.current);
                  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                  const url = URL.createObjectURL(svgBlob);
                  
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${title.replace(/\s+/g, '-').toLowerCase()}.svg`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                <Download className="w-4 h-4 text-[rgb(var(--scb-dark-gray))]" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* AI Metadata Panel with SCB styling */}
      {showAIMetadata && data.aiMetadata && (
        <div className="mb-4 p-3 bg-[rgba(var(--scb-light-gray),0.3)] border border-[rgb(var(--scb-border))] rounded-md">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-[rgb(var(--scb-american-green))] mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">AI-Generated Insights</h4>
              <p className="text-xs mt-1 text-[rgb(var(--scb-dark-gray))]">{data.aiMetadata.insightSummary}</p>
              
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                <div className="text-[10px] text-[rgb(var(--scb-dark-gray))] flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  <span>Confidence Score: {(data.aiMetadata.confidenceScore * 100).toFixed(0)}%</span>
                </div>
                <div className="text-[10px] text-[rgb(var(--scb-dark-gray))]">
                  Generated: {new Date(data.aiMetadata.generatedAt).toLocaleString()}
                </div>
              </div>
              
              {data.aiMetadata.dataSource.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] text-[rgb(var(--scb-dark-gray))]">Sources:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {data.aiMetadata.dataSource.map((source, idx) => (
                      <div key={idx} className="horizon-chip horizon-chip-blue text-[10px] py-0.5 px-2">
                        {source}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Main visualization with loading state */}
      <div className="relative flex-1 min-h-0 bg-white rounded-lg border border-[rgb(var(--scb-border))]">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[rgba(255,255,255,0.9)] z-10">
            <div className="w-12 h-12 animate-spin rounded-full border-4 border-[rgba(var(--scb-honolulu-blue),0.1)] border-t-[rgb(var(--scb-honolulu-blue))]"></div>
            <p className="mt-4 text-sm text-[rgb(var(--scb-dark-gray))]">Generating knowledge graph...</p>
          </div>
        ) : (
          data.nodes.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Compass className="w-12 h-12 text-[rgba(var(--scb-dark-gray),0.3)]" />
              <p className="mt-4 text-sm text-[rgb(var(--scb-dark-gray))]">No data available</p>
              {onRegenerateClick && (
                <button 
                  className="mt-4 fiori-btn fiori-btn-primary text-sm flex items-center gap-2"
                  onClick={onRegenerateClick}
                >
                  <RefreshCw className="w-4 h-4" />
                  Generate Graph
                </button>
              )}
            </div>
          ) : null
        )}
        
        <svg ref={svgRef} className="w-full h-full"></svg>
        
        {/* Tooltip with SCB styling */}
        {tooltipData.visible && (
          <div 
            className="absolute pointer-events-none fiori-tile p-2.5 text-xs z-10 min-w-[150px] max-w-[250px] shadow-lg border border-[rgb(var(--scb-border))]"
            style={{
              left: `${tooltipData.x + 15}px`,
              top: `${tooltipData.y - 15}px`,
              transform: 'translate(-50%, -100%)',
            }}
            dangerouslySetInnerHTML={{ __html: tooltipData.content }}
          />
        )}
      </div>
      
      {/* Legend with SCB styling */}
      {showLegend && (
        <div className="mt-3 p-3 bg-white rounded-md border border-[rgb(var(--scb-border))]">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {Object.entries({
              'Financial': 'rgb(var(--scb-honolulu-blue))',
              'Market': 'rgb(0, 112, 122)',
              'Regulatory': 'rgb(88, 64, 148)',
              'Economic': 'rgb(var(--scb-american-green))',
              'Risk': 'rgb(var(--scb-muted-red))',
              'Technology': 'rgb(42, 120, 188)',
              'Client': 'rgb(245, 152, 0)',
              'Internal': 'rgb(15, 40, 109)',
            }).map(([group, color], idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                <span className="text-xs text-[rgb(var(--scb-dark-gray))]">{group}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-2 pt-2 border-t border-[rgba(var(--scb-border),0.5)]">
            <div className="flex flex-wrap gap-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-[rgb(var(--scb-dark-gray))] opacity-50"></div>
                <span className="text-xs text-[rgb(var(--scb-dark-gray))]">Standard Link</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-[rgb(var(--scb-american-green))] opacity-80 border-dashed"></div>
                <span className="text-xs flex items-center gap-1 text-[rgb(var(--scb-dark-gray))]">
                  <Sparkles className="w-3 h-3 text-[rgb(var(--scb-american-green))]" />
                  AI-Generated Link
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Node Details Panel with SCB styling */}
      {selectedNode && (
        <div className="mt-3 fiori-tile p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-[rgb(var(--scb-border))] flex justify-between items-center">
            <h4 className="text-base font-medium text-[rgb(var(--scb-dark-gray))]">{selectedNode.label}</h4>
            <button 
              onClick={() => setSelectedNode(null)}
              className="text-[rgb(var(--scb-dark-gray))] hover:text-[rgb(var(--scb-honolulu-blue))] p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[rgba(var(--scb-dark-gray),0.7)]">Group</p>
                <p className="text-sm text-[rgb(var(--scb-dark-gray))]">{selectedNode.group}</p>
              </div>
              <div>
                <p className="text-xs text-[rgba(var(--scb-dark-gray),0.7)]">Value</p>
                <p className="text-sm text-[rgb(var(--scb-dark-gray))]">{selectedNode.value}</p>
              </div>
              {selectedNode.relevance && (
                <div>
                  <p className="text-xs text-[rgba(var(--scb-dark-gray),0.7)]">Relevance</p>
                  <p className="text-sm text-[rgb(var(--scb-dark-gray))]">{(selectedNode.relevance * 100).toFixed(1)}%</p>
                </div>
              )}
              {selectedNode.confidence && (
                <div>
                  <p className="text-xs text-[rgba(var(--scb-dark-gray),0.7)]">AI Confidence</p>
                  <p className="text-sm text-[rgb(var(--scb-dark-gray))]">{(selectedNode.confidence * 100).toFixed(1)}%</p>
                </div>
              )}
            </div>
            
            {selectedNode.description && (
              <div className="mt-3">
                <p className="text-xs text-[rgba(var(--scb-dark-gray),0.7)]">Description</p>
                <p className="text-sm mt-1 text-[rgb(var(--scb-dark-gray))]">{selectedNode.description}</p>
              </div>
            )}
            
            {selectedNode.aiGenerated && (
              <div className="mt-3 pt-3 border-t border-[rgba(var(--scb-border),0.5)]">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[rgb(var(--scb-american-green))]" />
                  <span className="text-xs text-[rgb(var(--scb-american-green))]">AI-Generated</span>
                </div>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button 
                className="fiori-btn fiori-btn-secondary text-xs flex items-center gap-2"
              >
                <Share2 className="w-3 h-3" />
                Share
              </button>
              <button 
                className="fiori-btn fiori-btn-ghost text-xs flex items-center gap-2"
              >
                <Edit className="w-3 h-3" />
                Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedForceDirectedGraph;