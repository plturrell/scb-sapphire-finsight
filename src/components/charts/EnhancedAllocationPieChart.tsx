import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Sparkles, Info, RefreshCw } from 'lucide-react';
import { EnhancedInlineSpinner } from '../EnhancedLoadingSpinner';

interface DataItem {
  name: string;
  value: number;
  color: string;
  aiEnhanced?: boolean;
  confidence?: number;
}

interface EnhancedAllocationPieChartProps {
  data: DataItem[];
  width?: number;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  animate?: boolean;
  showAIIndicators?: boolean;
  title?: string;
  subtitle?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

/**
 * Enhanced Asset Allocation Pie Chart with SCB beautiful styling
 * Visualizes portfolio allocation with AI-enhanced insights and SCB branding
 */
const EnhancedAllocationPieChart: React.FC<EnhancedAllocationPieChartProps> = ({
  data,
  width = 400,
  height = 300,
  innerRadius = 80,
  outerRadius = 0,
  animate = true,
  showAIIndicators = true,
  title = "Asset Allocation",
  subtitle,
  isLoading = false,
  onRefresh,
  className = ""
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const announcementRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, null, undefined> | null>(null);
  const [aiCount, setAiCount] = useState(0);
  
  // Update AI count for indicator display
  useEffect(() => {
    setAiCount(data.filter(item => item.aiEnhanced).length);
  }, [data]);

  // Helper function to create tooltip with SCB styling
  const createTooltip = (data: DataItem, position: { x: number, y: number }) => {
    // Remove any existing tooltips
    d3.selectAll('.scb-chart-tooltip').remove();
    
    // Create tooltip with D3 and SCB styling
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'scb-chart-tooltip')
      .attr('role', 'tooltip')
      .attr('aria-live', 'polite')
      .style('position', 'absolute')
      .style('left', `${position.x + 10}px`)
      .style('top', `${position.y + 10}px`)
      .style('background', 'white')
      .style('padding', '10px 14px')
      .style('border-radius', '6px')
      .style('box-shadow', '0 4px 12px rgba(0,0,0,0.1)')
      .style('pointer-events', 'none')
      .style('font-family', '"SCProsperSans", "72", sans-serif')
      .style('font-size', '12px')
      .style('z-index', '100')
      .style('max-width', '240px')
      .style('opacity', 0)
      .style('border', '1px solid rgb(var(--scb-border))');
    
    // Add AI indicator to tooltip if applicable with SCB styling
    const aiIndicator = data.aiEnhanced 
      ? `<div style="display: flex; align-items: center; margin-top: 5px; font-size: 11px; color: rgb(var(--scb-american-green));">
          <div style="width: 8px; height: 8px; border-radius: 50%; background-color: rgb(var(--scb-american-green)); margin-right: 5px;"></div>
          <div>AI-enhanced prediction (${data.confidence ? Math.round(data.confidence * 100) : 85}% confidence)</div>
        </div>`
      : '';
    
    // Add content to tooltip with SCB styling
    tooltip.html(`
      <div style="display: flex; align-items: center;">
        <div style="width: 10px; height: 10px; border-radius: 50%; background-color: ${data.color}; margin-right: 8px;" aria-hidden="true"></div>
        <div style="font-weight: 500; color: rgb(var(--scb-dark-gray));">${data.name}</div>
      </div>
      <div style="margin-top: 4px; font-weight: 600; color: rgb(var(--scb-honolulu-blue));">${Math.round(data.value * 100)}%</div>
      ${aiIndicator}
    `);
    
    // Animate tooltip
    tooltip.transition()
      .duration(200)
      .style('opacity', 1);
      
    return tooltip;
  };

  // Draw chart function with improved SCB styling
  const drawChart = useCallback(() => {
    if (!svgRef.current || !data.length || isLoading) return;
    
    // Setup dimensions
    const svgSelection = d3.select(svgRef.current);
    svgSelection.selectAll('*').remove(); // Clear previous elements
    
    const actualWidth = width;
    const actualHeight = height;
    const actualOuterRadius = outerRadius > 0 ? outerRadius : Math.min(width, height) / 2 - 20;
    const actualInnerRadius = innerRadius || 0;
    
    // SVG element initialization with ARIA attributes
    svgSelection
      .attr('width', actualWidth)
      .attr('height', actualHeight)
      .attr('aria-label', 'Asset allocation pie chart')
      .attr('role', 'img')
      .attr('tabindex', 0);
    
    // Create chart group centered in SVG
    const g = svgSelection.append('g')
      .attr('transform', `translate(${actualWidth / 2}, ${actualHeight / 2})`);
    
    // Create pie chart
    const pie = d3.pie<DataItem>()
      .value(d => d.value)
      .sort(null)
      .padAngle(0.02); // Add small padding between slices for modern look
    
    const arcData = pie(data);
    
    // Create arc generator with improved rounding for SCB aesthetic
    const arc = d3.arc<d3.PieArcDatum<DataItem>>()
      .innerRadius(actualInnerRadius)
      .outerRadius(actualOuterRadius)
      .cornerRadius(4); // Rounded corners for SCB design language
    
    // Create outer stroke arc for clean separation
    const strokeArc = d3.arc<d3.PieArcDatum<DataItem>>()
      .innerRadius(actualInnerRadius - 1)
      .outerRadius(actualOuterRadius + 1)
      .cornerRadius(4);
    
    // Add subtle background grid for depth (SCB design pattern)
    const gridCircle = g.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', actualOuterRadius + 5)
      .attr('fill', 'none')
      .attr('stroke', 'rgb(var(--scb-border))')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,2')
      .style('opacity', 0.5);
    
    // Create arc paths with enhanced styling
    const paths = g.selectAll('path.arc')
      .data(arcData)
      .enter()
      .append('path')
      .attr('class', 'arc')
      .attr('d', arc)
      .attr('fill', (d: d3.PieArcDatum<DataItem>) => d.data.color)
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('opacity', 0.9);
    
    // Add outer stroke for better separation
    g.selectAll('path.arc-stroke')
      .data(arcData)
      .enter()
      .append('path')
      .attr('class', 'arc-stroke')
      .attr('d', strokeArc)
      .attr('fill', 'none')
      .attr('stroke', 'white')
      .attr('stroke-width', 1.5)
      .style('opacity', 0.7);
    
    // Add AI enhanced indicators with SCB styling
    if (showAIIndicators) {
      g.selectAll('.ai-indicator')
        .data(arcData.filter(d => d.data.aiEnhanced))
        .enter()
        .append('path')
        .attr('class', 'ai-indicator')
        .attr('d', (d: d3.PieArcDatum<DataItem>) => {
          const outerArc = d3.arc<d3.PieArcDatum<DataItem>>()
            .innerRadius(actualOuterRadius + 4)
            .outerRadius(actualOuterRadius + 8)
            .cornerRadius(2);
          return outerArc(d);
        })
        .attr('fill', 'rgb(var(--scb-american-green))')
        .attr('stroke', 'white')
        .attr('stroke-width', 0.5)
        .style('opacity', (d: d3.PieArcDatum<DataItem>) => d.data.confidence ? d.data.confidence : 0.85);
    }
    
    // Add animation with proper SCB timing
    if (animate) {
      paths.style('opacity', 0)
        .transition()
        .duration(800)
        .delay((_, i) => i * 80) // Staggered animation for each segment
        .style('opacity', 0.9);
    }
    
    // Add value labels with improved positioning and SCB typography
    const labelArc = d3.arc<d3.PieArcDatum<DataItem>>()
      .innerRadius(actualOuterRadius * 0.75)
      .outerRadius(actualOuterRadius * 0.75);
    
    const labels = g.selectAll('.label')
      .data(arcData)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('transform', (d: d3.PieArcDatum<DataItem>) => `translate(${labelArc.centroid(d)})`)
      .attr('dy', '.35em')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-family', '"SCProsperSans", "72", sans-serif')
      .style('font-weight', 600)
      .style('fill', '#FFFFFF')
      .style('text-shadow', '0px 1px 2px rgba(0,0,0,0.2)') // Text shadow for readability
      .text((d: d3.PieArcDatum<DataItem>) => d.data.value >= 0.05 ? `${Math.round(d.data.value * 100)}%` : '');
    
    // Add animations for labels with SCB timing
    if (animate) {
      labels.style('opacity', 0)
        .transition()
        .delay(600)
        .duration(600)
        .style('opacity', 1);
    }
    
    // Add AI-enhanced indicator dots next to AI-enhanced labels
    if (showAIIndicators) {
      g.selectAll('.ai-dot')
        .data(arcData.filter(d => d.data.aiEnhanced))
        .enter()
        .append('circle')
        .attr('class', 'ai-dot')
        .attr('transform', (d: d3.PieArcDatum<DataItem>) => {
          const [x, y] = labelArc.centroid(d);
          return `translate(${x + 18}, ${y})`;
        })
        .attr('r', 3)
        .attr('fill', 'rgb(var(--scb-american-green))')
        .attr('stroke', 'white')
        .attr('stroke-width', 1);
    }
    
    // Add interactive tooltips with SCB styling
    g.selectAll('path.arc')
      .on('mouseover', function(event: MouseEvent, d: d3.PieArcDatum<DataItem>) {
        const segment = this as SVGPathElement;
        
        // Highlight segment
        d3.select(segment)
          .transition()
          .duration(200)
          .attr('transform', () => {
            const [x, y] = arc.centroid(d);
            const distance = 5; // Distance to "pull out" the segment
            const midAngle = Math.atan2(y, x);
            const translateX = Math.cos(midAngle) * distance;
            const translateY = Math.sin(midAngle) * distance;
            return `translate(${translateX},${translateY})`;
          })
          .style('opacity', 1)
          .style('filter', 'drop-shadow(0px 3px 5px rgba(0,0,0,0.15))');
          
        // Show tooltip with SCB styling
        createTooltip(d.data, {
          x: event.pageX,
          y: event.pageY
        });
          
        // Announce tooltip content for screen readers
        const announceElement = document.getElementById('chart-announcement');
        if (announceElement) {
          announceElement.textContent = `${d.data.name}: ${Math.round(d.data.value * 100)}%${
            d.data.aiEnhanced ? `, AI-enhanced prediction with ${d.data.confidence ? Math.round(d.data.confidence * 100) : 85}% confidence` : ''
          }`;
        }
      })
      .on('mousemove', function(event: MouseEvent) {
        d3.select('.scb-chart-tooltip')
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY + 10}px`);
      })
      .on('mouseout', function() {
        const segment = this as SVGPathElement;
        
        // Reset segment
        d3.select(segment)
          .transition()
          .duration(200)
          .attr('transform', 'translate(0,0)')
          .style('opacity', 0.9)
          .style('filter', 'none');
          
        // Remove tooltip
        d3.select('.scb-chart-tooltip').remove();
        
        // Clear announcement
        const announceElement = document.getElementById('chart-announcement');
        if (announceElement) {
          announceElement.textContent = '';
        }
      });
      
    // Add keyboard navigation for accessibility
    svgSelection.attr('tabindex', 0)
      .on('keydown', function(event: KeyboardEvent) {
        // Basic keyboard navigation - would be expanded in a full implementation
        if ((event as KeyboardEvent).key === 'Enter' || (event as KeyboardEvent).key === ' ') {
          event.preventDefault();
        }
      });
      
    // Add center content for donut charts with SCB styling
    if (innerRadius > 0) {
      const total = d3.sum(data, d => d.value);
      
      // Add center background for better contrast
      g.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', innerRadius - 5)
        .attr('fill', 'white')
        .attr('stroke', 'rgb(var(--scb-border))')
        .attr('stroke-width', 1)
        .style('opacity', 0.8);
      
      // Add label text
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.5em')
        .style('font-family', '"SCProsperSans", "72", sans-serif')
        .style('font-weight', 500)
        .style('font-size', '14px')
        .style('fill', 'rgb(var(--scb-dark-gray))')
        .text('Total');
        
      // Add value text
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1em')
        .style('font-family', '"SCProsperSans", "72", sans-serif')
        .style('font-weight', 700)
        .style('font-size', '20px')
        .style('fill', 'rgb(var(--scb-honolulu-blue))')
        .text('100%');
      
      // Add AI indicator with SCB styling
      if (showAIIndicators && aiCount > 0) {
        g.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '3em')
          .style('font-family', '"SCProsperSans", "72", sans-serif')
          .style('font-weight', 400)
          .style('font-size', '11px')
          .style('fill', 'rgb(var(--scb-american-green))')
          .text(`${aiCount} AI-enhanced ${aiCount === 1 ? 'prediction' : 'predictions'}`);
      }
    }
  }, [data, width, height, innerRadius, outerRadius, animate, showAIIndicators, isLoading, aiCount]);

  // Draw chart on data or size changes
  useEffect(() => {
    drawChart();
  }, [data, width, height, isLoading, drawChart]);

  return (
    <div className={`fiori-tile h-full flex flex-col ${className}`}>
      {/* Chart header with SCB styling */}
      <div className="px-4 py-3 border-b border-[rgb(var(--scb-border))] flex justify-between items-center">
        <div>
          <h3 className="text-base font-medium text-[rgb(var(--scb-dark-gray))]">{title}</h3>
          {subtitle && <p className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-80 mt-0.5">{subtitle}</p>}
        </div>
        
        {showAIIndicators && aiCount > 0 && (
          <div className="horizon-chip horizon-chip-green text-xs py-0.5 px-2">
            <Sparkles className="w-3 h-3" />
            <span>{aiCount} AI-enhanced</span>
          </div>
        )}
        
        {onRefresh && (
          <button 
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 rounded-full hover:bg-[rgba(var(--scb-light-gray),0.5)] text-[rgb(var(--scb-dark-gray))] transition-colors"
          >
            {isLoading ? (
              <EnhancedInlineSpinner size="sm" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      
      {/* Main chart area */}
      <div className="flex-1 flex items-center justify-center p-4 relative">
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 border-2 border-[rgba(var(--scb-honolulu-blue),0.2)] border-t-[rgb(var(--scb-honolulu-blue))] rounded-full animate-spin"></div>
              <p className="text-sm text-[rgb(var(--scb-dark-gray))]">Generating chart...</p>
            </div>
          </div>
        )}
        
        {/* Screen reader announcement area */}
        <div 
          id="chart-announcement" 
          className="sr-only" 
          aria-live="polite" 
          aria-atomic="true"
          ref={announcementRef}
        ></div>
        
        {/* SVG Chart */}
        <svg 
          ref={svgRef}
          role="img"
          aria-label="Asset allocation pie chart"
          tabIndex={0}
          className="max-w-full max-h-full"
        >
          <title>{title}</title>
          <desc>Pie chart showing portfolio allocation across different asset classes{showAIIndicators && aiCount > 0 ? ' with AI-enhanced predictions' : ''}</desc>
        </svg>
        
        {/* No data state */}
        {!isLoading && (!data || data.length === 0) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Info className="w-10 h-10 mx-auto mb-2 text-[rgb(var(--scb-border))]" />
              <p className="text-sm text-[rgb(var(--scb-dark-gray))]">No allocation data available</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Legend - only show if we have data */}
      {data.length > 0 && !isLoading && (
        <div className="px-4 py-3 border-t border-[rgb(var(--scb-border))] bg-[rgba(var(--scb-light-gray),0.1)]">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-xs text-[rgb(var(--scb-dark-gray))]">
                  {item.name}
                  {item.aiEnhanced && (
                    <span className="ml-1.5 inline-flex items-center">
                      <Sparkles className="w-3 h-3 text-[rgb(var(--scb-american-green))]" />
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAllocationPieChart;