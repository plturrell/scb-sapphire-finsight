import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Sparkles, Info, Edit, Download, RefreshCw, Maximize2, ZoomIn, ZoomOut, Filter, X } from 'lucide-react';

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

interface ForceDirectedGraphProps {
  data: GraphData;
  width?: number;
  height?: number;
  title?: string;
  showControls?: boolean;
  showLegend?: boolean;
  onNodeClick?: (node: GraphNode) => void;
  onRegenerateClick?: () => void;
}

// Horizon color palette - follows SAP Fiori Horizon design
const horizonColors = {
  blue: 'rgb(13, 106, 168)', // #0D6AA8
  teal: 'rgb(0, 112, 122)', // #00707A
  green: 'rgb(43, 83, 0)', // #2B5300
  purple: 'rgb(88, 64, 148)', // #584094
  red: 'rgb(195, 0, 51)', // #C30033
  yellow: 'rgb(245, 152, 0)', // #F59800
  neutralGray: 'rgb(74, 84, 86)', // #4A5456
  lightGray: 'rgb(242, 242, 242)', // #F2F2F2
  // SCB colors
  scbBlue: 'rgb(15, 40, 109)', // SCB primary blue
  scbAccent: 'rgb(76, 165, 133)', // SCB accent green
  scbLightBlue: 'rgb(42, 120, 188)', // SCB light blue
};

// Group colors mapping
const getNodeColor = (group: string): string => {
  const colorMap: { [key: string]: string } = {
    'financial': horizonColors.blue,
    'market': horizonColors.teal,
    'regulatory': horizonColors.purple,
    'economic': horizonColors.green,
    'risk': horizonColors.red,
    'technology': horizonColors.scbLightBlue,
    'client': horizonColors.yellow,
    'internal': horizonColors.scbBlue,
  };
  return colorMap[group.toLowerCase()] || horizonColors.neutralGray;
};

const ForceDirectedGraph: React.FC<ForceDirectedGraphProps> = ({
  data,
  width = 800,
  height = 600,
  title = 'Knowledge Graph',
  showControls = true,
  showLegend = true,
  onNodeClick,
  onRegenerateClick,
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
    if (!svgRef.current || !data.nodes.length) return;

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

    // Create links
    const linkGroup = g.append('g')
      .attr('class', 'links');
      
    const link = linkGroup
      .selectAll('line')
      .data(data.links)
      .join('line')
      .attr('stroke', d => d.aiGenerated ? horizonColors.scbAccent : horizonColors.neutralGray)
      .attr('stroke-opacity', d => d.aiGenerated ? 0.8 : 0.5)
      .attr('stroke-width', d => Math.sqrt(d.value) * 0.7)
      .attr('class', d => d.aiGenerated ? 'ai-generated-link' : '')
      .attr('stroke-dasharray', d => d.aiGenerated ? '5,3' : '0');

    // Create nodes
    const nodeGroup = g.append('g')
      .attr('class', 'nodes');
      
    const node = nodeGroup
      .selectAll('circle')
      .data(data.nodes)
      .join('circle')
      .attr('r', d => 4 + d.value * 1.5)
      .attr('fill', d => getNodeColor(d.group))
      .attr('stroke', d => d.aiGenerated ? horizonColors.scbAccent : '#fff')
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
        
        // Show tooltip
        let tooltipContent = `
          <div class="font-medium text-[rgb(var(--scb-primary))]">${d.label}</div>
          <div class="text-sm mt-1">Group: ${d.group}</div>
          <div class="text-sm">Value: ${d.value}</div>
        `;
        
        if (d.aiGenerated) {
          tooltipContent += `
            <div class="text-xs mt-1 flex items-center gap-1 text-[${horizonColors.scbAccent}]">
              <span>AI generated (confidence: ${(d.confidence || 0) * 100}%)</span>
            </div>
          `;
        }
        
        if (d.description) {
          tooltipContent += `
            <div class="text-xs mt-1">${d.description}</div>
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

    // Add text labels for larger nodes
    const labels = nodeGroup
      .selectAll('text')
      .data(data.nodes.filter(d => d.value > 3)) // Only label larger nodes
      .join('text')
      .attr('dx', 10)
      .attr('dy', '.35em')
      .text(d => d.label)
      .attr('font-size', '9px')
      .attr('font-family', 'var(--fiori-font-family, "72", "72full", Arial, Helvetica, sans-serif)')
      .attr('fill', 'rgb(74, 84, 86)')
      .attr('pointer-events', 'none');
    
    // Add AI indicators for AI-generated nodes
    const aiMarkers = nodeGroup
      .selectAll('.ai-marker')
      .data(data.nodes.filter(d => d.aiGenerated))
      .join('circle')
      .attr('class', 'ai-marker')
      .attr('r', 3)
      .attr('fill', horizonColors.scbAccent)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('pointer-events', 'none');

    // Create the force simulation
    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(data.links).id(d => d.id).distance(70))
      .force('charge', d3.forceManyBody().strength(-150))
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
  }, [data, width, height, onNodeClick]);

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

  return (
    <div className="h-full flex flex-col">
      {/* Control panel - follows SAP Fiori Horizon style */}
      {showControls && (
        <div className="flex justify-between items-center mb-3">
          <div className="flex-1">
            <h3 className="fiori-tile-title text-lg text-[rgb(var(--scb-primary))]">{title}</h3>
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setShowAIMetadata(!showAIMetadata)}
              className="fiori-btn-ghost rounded-full p-1.5 hover:bg-[rgba(var(--horizon-blue),0.08)]"
              title="AI Metadata"
            >
              <Sparkles className="w-4 h-4 text-[rgb(var(--scb-accent))]" />
            </button>
            
            {/* Zoom Controls */}
            <div className="flex border border-[rgb(var(--scb-border))] rounded-md overflow-hidden">
              <button 
                onClick={handleZoomIn}
                className="p-1.5 hover:bg-[rgba(var(--horizon-blue),0.08)]"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4 text-[rgb(var(--horizon-neutral-gray))]" />
              </button>
              <button 
                onClick={handleZoomReset}
                className="p-1.5 hover:bg-[rgba(var(--horizon-blue),0.08)]"
                title="Reset Zoom"
              >
                <Maximize2 className="w-4 h-4 text-[rgb(var(--horizon-neutral-gray))]" />
              </button>
              <button 
                onClick={handleZoomOut}
                className="p-1.5 hover:bg-[rgba(var(--horizon-blue),0.08)]"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4 text-[rgb(var(--horizon-neutral-gray))]" />
              </button>
            </div>
            
            <button 
              className="fiori-btn-ghost rounded-full p-1.5 hover:bg-[rgba(var(--horizon-blue),0.08)]"
              title="Filter Graph" 
            >
              <Filter className="w-4 h-4 text-[rgb(var(--horizon-neutral-gray))]" />
            </button>
            
            {onRegenerateClick && (
              <button 
                onClick={onRegenerateClick}
                className="fiori-btn-ghost rounded-full p-1.5 hover:bg-[rgba(var(--horizon-blue),0.08)]"
                title="Regenerate Graph"
              >
                <RefreshCw className="w-4 h-4 text-[rgb(var(--horizon-blue))]" />
              </button>
            )}
            
            <button 
              className="fiori-btn-ghost rounded-full p-1.5 hover:bg-[rgba(var(--horizon-blue),0.08)]"
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
              <Download className="w-4 h-4 text-[rgb(var(--horizon-neutral-gray))]" />
            </button>
          </div>
        </div>
      )}
      
      {/* AI Metadata Panel - follows "Show the Work" principle */}
      {showAIMetadata && data.aiMetadata && (
        <div className="mb-4 p-3 bg-[rgba(var(--scb-light-blue),0.05)] border border-[rgba(var(--scb-light-blue),0.2)] rounded-md">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-[rgb(var(--scb-accent))] mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-[rgb(var(--scb-primary))]">AI-Generated Insights</h4>
              <p className="text-xs mt-1">{data.aiMetadata.insightSummary}</p>
              
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                <div className="text-[10px] text-gray-600 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  <span>Confidence Score: {(data.aiMetadata.confidenceScore * 100).toFixed(0)}%</span>
                </div>
                <div className="text-[10px] text-gray-600">
                  Generated: {new Date(data.aiMetadata.generatedAt).toLocaleString()}
                </div>
              </div>
              
              {data.aiMetadata.dataSource.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] text-gray-600">Sources:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {data.aiMetadata.dataSource.map((source, idx) => (
                      <div key={idx} className="horizon-chip text-[10px] py-0.5 px-2">
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
      
      {/* Main visualization */}
      <div className="relative flex-1 min-h-0 bg-[rgba(var(--scb-light-bg),0.3)] rounded-lg border border-[rgb(var(--scb-border))]">
        <svg ref={svgRef} className="w-full h-full"></svg>
        
        {/* Tooltip - SAP Fiori Horizon style */}
        {tooltipData.visible && (
          <div 
            className="absolute pointer-events-none horizon-dialog p-2.5 text-xs z-10 min-w-[150px] max-w-[250px]"
            style={{
              left: `${tooltipData.x + 15}px`,
              top: `${tooltipData.y - 15}px`,
              transform: 'translate(-50%, -100%)',
            }}
            dangerouslySetInnerHTML={{ __html: tooltipData.content }}
          />
        )}
      </div>
      
      {/* Legend - SAP Fiori Horizon style */}
      {showLegend && (
        <div className="mt-3 p-3 bg-white rounded-md border border-[rgb(var(--scb-border))]">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {Object.entries({
              'Financial': horizonColors.blue,
              'Market': horizonColors.teal,
              'Regulatory': horizonColors.purple,
              'Economic': horizonColors.green,
              'Risk': horizonColors.red,
              'Technology': horizonColors.scbLightBlue,
              'Client': horizonColors.yellow,
              'Internal': horizonColors.scbBlue,
            }).map(([group, color], idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                <span className="text-xs">{group}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-2 pt-2 border-t border-[rgba(var(--scb-border),0.5)]">
            <div className="flex flex-wrap gap-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-[rgb(var(--horizon-neutral-gray))] opacity-50"></div>
                <span className="text-xs">Standard Link</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-[rgb(var(--scb-accent))] opacity-80 dashed-line"></div>
                <span className="text-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[rgb(var(--scb-accent))]" />
                  AI-Generated Link
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Node Details Panel - if a node is selected */}
      {selectedNode && (
        <div className="mt-3 p-4 bg-white rounded-md border border-[rgb(var(--scb-border))]">
          <div className="flex justify-between items-start">
            <h4 className="font-medium text-[rgb(var(--scb-primary))]">{selectedNode.label}</h4>
            <button 
              onClick={() => setSelectedNode(null)}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Group</p>
              <p className="text-sm">{selectedNode.group}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Value</p>
              <p className="text-sm">{selectedNode.value}</p>
            </div>
            {selectedNode.relevance && (
              <div>
                <p className="text-xs text-gray-500">Relevance</p>
                <p className="text-sm">{(selectedNode.relevance * 100).toFixed(1)}%</p>
              </div>
            )}
            {selectedNode.confidence && (
              <div>
                <p className="text-xs text-gray-500">AI Confidence</p>
                <p className="text-sm">{(selectedNode.confidence * 100).toFixed(1)}%</p>
              </div>
            )}
          </div>
          
          {selectedNode.description && (
            <div className="mt-3">
              <p className="text-xs text-gray-500">Description</p>
              <p className="text-sm mt-1">{selectedNode.description}</p>
            </div>
          )}
          
          {selectedNode.aiGenerated && (
            <div className="mt-3 pt-3 border-t border-[rgba(var(--scb-border),0.5)]">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[rgb(var(--scb-accent))]" />
                <span className="text-xs text-[rgb(var(--scb-accent))]">AI-Generated</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ForceDirectedGraph;
