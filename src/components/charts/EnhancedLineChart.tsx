import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Sparkles, Info, RefreshCw, Download, Settings, ZoomIn, ZoomOut } from 'lucide-react';
import { EnhancedInlineSpinner } from '../EnhancedLoadingSpinner';

interface DataPoint {
  date: Date;
  value: number;
  aiGenerated?: boolean;
  confidence?: number;
}

interface DataSeries {
  id: string;
  name: string;
  data: DataPoint[];
  color?: string;
  aiEnhanced?: boolean; 
  isProjection?: boolean;
  strokeDasharray?: string;
}

interface EnhancedLineChartProps {
  series: DataSeries[];
  width?: number;
  height?: number; 
  title?: string;
  subtitle?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  zoomable?: boolean;
  dateFormat?: string;
  valueFormat?: (value: number) => string;
  showLegend?: boolean;
  showAreaGradient?: boolean;
  showTooltip?: boolean;
  showGrid?: boolean;
  animation?: boolean;
  className?: string;
}

/**
 * Enhanced Line Chart component with SCB beautiful styling
 * Visualizes time series data with AI-enhanced projections and SCB branding
 */
const EnhancedLineChart: React.FC<EnhancedLineChartProps> = ({
  series,
  width = 600,
  height = 400,
  title = "Time Series Chart",
  subtitle,
  xAxisLabel,
  yAxisLabel,
  isLoading = false,
  onRefresh,
  zoomable = true,
  dateFormat = "%b %d, %Y",
  valueFormat = (v: number) => v.toLocaleString(),
  showLegend = true,
  showAreaGradient = true,
  showTooltip = true,
  showGrid = true,
  animation = true,
  className = ""
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const zooomRef = useRef<any>(null);
  const [aiSeriesCount, setAiSeriesCount] = useState(0);
  
  // SCB color palette for series
  const getSeriesColor = (index: number, color?: string): string => {
    if (color) return color;
    
    const colorPalette = [
      'rgb(var(--scb-honolulu-blue))', // Primary blue
      'rgb(var(--scb-american-green))', // Green
      'rgb(var(--scb-muted-red))', // Red
      'rgb(42, 120, 188)', // Light blue
      'rgb(245, 152, 0)', // Orange
      'rgb(88, 64, 148)', // Purple
      'rgb(0, 112, 122)', // Teal
      'rgb(var(--scb-dark-gray))' // Gray
    ];
    
    return colorPalette[index % colorPalette.length];
  };

  // Update AI series count for indicator display
  useEffect(() => {
    setAiSeriesCount(series.filter(s => s.aiEnhanced).length);
  }, [series]);

  // Main chart rendering function
  useEffect(() => {
    if (!svgRef.current || isLoading || series.length === 0 || !series[0].data.length) return;

    // Clear previous chart
    const svgNode = d3.select(svgRef.current);
    svgNode.selectAll('*').remove();

    // Set up dimensions with SCB design proportions
    const margin = { top: 10, right: 50, bottom: 50, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Create the chart container with proper SCB styling
    const svg = svgNode
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto;')
      .attr('font-family', '"SCProsperSans", "72", sans-serif');

    // Create the chart group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Find data ranges for x and y axes
    const allDates = series.flatMap(s => s.data.map(d => d.date));
    const allValues = series.flatMap(s => s.data.map(d => d.value));
    
    const xMin = d3.min(allDates) || new Date();
    const xMax = d3.max(allDates) || new Date();
    const yMin = d3.min(allValues) || 0;
    const yMax = d3.max(allValues) || 100;
    
    // Add 5% padding to y-axis range for better visualization
    const yPadding = (yMax - yMin) * 0.05;

    // Create scales
    const xScale = d3.scaleTime()
      .domain([xMin, xMax])
      .range([0, chartWidth]);
    
    const yScale = d3.scaleLinear()
      .domain([Math.max(0, yMin - yPadding), yMax + yPadding])
      .range([chartHeight, 0]);

    // Add background with SCB light gray
    g.append('rect')
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .attr('fill', 'rgba(var(--scb-light-gray), 0.2)')
      .attr('rx', 4); // Rounded corners

    // Add grid with SCB styling if enabled
    if (showGrid) {
      // Y-grid - main grid lines with SCB styling
      g.append('g')
        .attr('class', 'y-grid')
        .selectAll('line')
        .data(yScale.ticks(5))
        .enter()
        .append('line')
        .attr('x1', 0)
        .attr('x2', chartWidth)
        .attr('y1', d => yScale(d))
        .attr('y2', d => yScale(d))
        .attr('stroke', 'rgb(var(--scb-border))')
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.5);
      
      // X-grid - for date intervals with SCB styling
      g.append('g')
        .attr('class', 'x-grid')
        .selectAll('line')
        .data(xScale.ticks(6))
        .enter()
        .append('line')
        .attr('x1', d => xScale(d))
        .attr('x2', d => xScale(d))
        .attr('y1', 0)
        .attr('y2', chartHeight)
        .attr('stroke', 'rgb(var(--scb-border))')
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.3);
    }

    // Create line generator
    const lineGenerator = d3.line<DataPoint>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX); // Smooth curve for financial data

    // Area generator for gradient fills
    const areaGenerator = d3.area<DataPoint>()
      .x(d => xScale(d.date))
      .y0(chartHeight)
      .y1(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Add defs for gradient fills
    const defs = svg.append('defs');
    
    // Create line paths and area fills
    series.forEach((s, i) => {
      const seriesColor = getSeriesColor(i, s.color);
      
      // Create gradient for area charts
      if (showAreaGradient) {
        const gradientId = `line-gradient-${s.id}`;
        
        const gradient = defs.append('linearGradient')
          .attr('id', gradientId)
          .attr('x1', '0%')
          .attr('y1', '0%')
          .attr('x2', '0%')
          .attr('y2', '100%');
          
        gradient.append('stop')
          .attr('offset', '0%')
          .attr('stop-color', seriesColor)
          .attr('stop-opacity', 0.3);
          
        gradient.append('stop')
          .attr('offset', '100%')
          .attr('stop-color', seriesColor)
          .attr('stop-opacity', 0.05);
        
        // Add area with gradient fill
        g.append('path')
          .datum(s.data)
          .attr('class', 'area')
          .attr('fill', `url(#${gradientId})`)
          .attr('d', areaGenerator as any)
          .attr('opacity', 0);
        
        // Animate the area fill if animation is enabled
        if (animation) {
          g.selectAll('.area')
            .transition()
            .duration(1000)
            .attr('opacity', 1);
        } else {
          g.selectAll('.area')
            .attr('opacity', 0.8);
        }
      }
      
      // Add the line path with SCB styling
      const path = g.append('path')
        .datum(s.data)
        .attr('class', 'line')
        .attr('fill', 'none')
        .attr('stroke', seriesColor)
        .attr('stroke-width', s.isProjection ? 2 : 3)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('d', lineGenerator as any);
        
      // Add dash pattern for projections or AI-enhanced series
      if (s.isProjection || s.aiEnhanced) {
        path.attr('stroke-dasharray', s.strokeDasharray || (s.isProjection ? '6,4' : ''));
      }
      
      // Animate the line path if animation is enabled
      if (animation) {
        const totalLength = path.node()?.getTotalLength() || 0;
        path
          .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
          .attr('stroke-dashoffset', totalLength)
          .transition()
          .duration(1500)
          .attr('stroke-dashoffset', 0);
      }
      
      // Add data points with SCB styling
      g.selectAll(`.point-${i}`)
        .data(s.data)
        .enter()
        .append('circle')
        .attr('class', `point-${i}`)
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d.value))
        .attr('r', (d, idx) => {
          // More prominent markers at start/end of series
          if (idx === 0 || idx === s.data.length - 1) return 4;
          // Smaller markers for middle points
          return d.aiGenerated ? 3 : 0;
        })
        .attr('fill', (d) => d.aiGenerated ? 'rgb(var(--scb-american-green))' : 'white')
        .attr('stroke', seriesColor)
        .attr('stroke-width', 2)
        .style('opacity', 0);
      
      // Animate the data points if animation is enabled
      if (animation) {
        g.selectAll(`.point-${i}`)
          .transition()
          .delay((_, idx) => idx * (1500 / s.data.length))
          .duration(300)
          .style('opacity', 1);
      } else {
        g.selectAll(`.point-${i}`)
          .style('opacity', 1);
      }
      
      // Add AI-enhanced indicators for special points
      if (s.aiEnhanced) {
        g.selectAll(`.ai-indicator-${i}`)
          .data(s.data.filter(d => d.aiGenerated))
          .enter()
          .append('circle')
          .attr('class', `ai-indicator-${i}`)
          .attr('cx', d => xScale(d.date))
          .attr('cy', d => yScale(d.value))
          .attr('r', 6)
          .attr('fill', 'none')
          .attr('stroke', 'rgb(var(--scb-american-green))')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '2,1')
          .style('opacity', 0);
          
        // Animate AI indicators
        if (animation) {
          g.selectAll(`.ai-indicator-${i}`)
            .transition()
            .delay(1000)
            .duration(500)
            .style('opacity', d => d.confidence || 0.8);
        } else {
          g.selectAll(`.ai-indicator-${i}`)
            .style('opacity', d => d.confidence || 0.8);
        }
      }
    });

    // Create axes with SCB styling
    // X-axis
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale)
        .ticks(6)
        .tickSize(0)
        .tickPadding(10)
        .tickFormat(d => d3.timeFormat(dateFormat)(d as Date))
      );
    
    // X-axis styling
    xAxis.select('.domain')
      .attr('stroke', 'rgb(var(--scb-border))');
      
    xAxis.selectAll('text')
      .attr('font-size', '11px')
      .attr('fill', 'rgb(var(--scb-dark-gray))');
    
    // X-axis label
    if (xAxisLabel) {
      g.append('text')
        .attr('x', chartWidth / 2)
        .attr('y', chartHeight + 40)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', 'rgb(var(--scb-dark-gray))')
        .text(xAxisLabel);
    }
    
    // Y-axis
    const yAxis = g.append('g')
      .call(d3.axisLeft(yScale)
        .ticks(5)
        .tickSize(0)
        .tickPadding(10)
        .tickFormat(d => valueFormat(d as number))
      );
    
    // Y-axis styling
    yAxis.select('.domain')
      .attr('stroke', 'rgb(var(--scb-border))');
      
    yAxis.selectAll('text')
      .attr('font-size', '11px')
      .attr('fill', 'rgb(var(--scb-dark-gray))');
    
    // Y-axis label
    if (yAxisLabel) {
      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -chartHeight / 2)
        .attr('y', -40)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', 'rgb(var(--scb-dark-gray))')
        .text(yAxisLabel);
    }

    // Add tooltip functionality with SCB styling
    if (showTooltip) {
      // Create tooltip div if it doesn't exist
      if (!tooltipRef.current) {
        tooltipRef.current = document.createElement('div');
        tooltipRef.current.className = 'scb-chart-tooltip';
        tooltipRef.current.style.position = 'absolute';
        tooltipRef.current.style.visibility = 'hidden';
        tooltipRef.current.style.backgroundColor = 'white';
        tooltipRef.current.style.border = '1px solid rgb(var(--scb-border))';
        tooltipRef.current.style.borderRadius = '4px';
        tooltipRef.current.style.padding = '8px 12px';
        tooltipRef.current.style.boxShadow = '0px 2px 10px rgba(0, 0, 0, 0.1)';
        tooltipRef.current.style.fontSize = '12px';
        tooltipRef.current.style.fontFamily = '"SCProsperSans", "72", sans-serif';
        tooltipRef.current.style.pointerEvents = 'none';
        tooltipRef.current.style.zIndex = '100';
        document.body.appendChild(tooltipRef.current);
      }

      // Create overlay for mouse events
      const overlay = g.append('rect')
        .attr('class', 'overlay')
        .attr('width', chartWidth)
        .attr('height', chartHeight)
        .attr('fill', 'none')
        .attr('pointer-events', 'all');

      // Vertical line for tooltip
      const verticalLine = g.append('line')
        .attr('class', 'vertical-line')
        .attr('y1', 0)
        .attr('y2', chartHeight)
        .attr('stroke', 'rgb(var(--scb-dark-gray))')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,4')
        .style('opacity', 0);

      // Create tooltip dots for each series
      const tooltipDots = series.map((s, i) => {
        return g.append('circle')
          .attr('class', 'tooltip-dot')
          .attr('r', 5)
          .attr('fill', 'white')
          .attr('stroke', getSeriesColor(i, s.color))
          .attr('stroke-width', 2)
          .style('opacity', 0);
      });

      // Mouse move handler
      overlay.on('mousemove', function(event) {
        // Get mouse position
        const [mouseX] = d3.pointer(event);
        const xDate = xScale.invert(mouseX);
        
        // Find closest data point in each series
        const closestPoints = series.map(s => {
          // Find closest date to mouse position
          const bisect = d3.bisector((d: DataPoint) => d.date).left;
          const index = bisect(s.data, xDate);
          
          // Get closest point
          const closest = index > 0 && index < s.data.length 
            ? (xDate.getTime() - s.data[index - 1].date.getTime() > s.data[index].date.getTime() - xDate.getTime() 
              ? s.data[index] 
              : s.data[index - 1])
            : s.data[index < s.data.length ? index : s.data.length - 1];
            
          return {
            series: s,
            point: closest
          };
        });
        
        // Show the tooltip
        if (tooltipRef.current) {
          // Position tooltip
          tooltipRef.current.style.visibility = 'visible';
          
          // Format date
          const dateFormatter = d3.timeFormat(dateFormat);
          const dateString = dateFormatter(closestPoints[0].point.date);
          
          // Build tooltip content
          let tooltipContent = `
            <div style="margin-bottom: 6px; font-weight: 500; color: rgb(var(--scb-dark-gray));">
              ${dateString}
            </div>
          `;
          
          // Add each series value
          closestPoints.forEach((item, idx) => {
            const { series: s, point } = item;
            
            const aiIndicator = point.aiGenerated 
              ? `<span style="color: rgb(var(--scb-american-green)); margin-left: 4px; font-size: 10px;">
                  AI ${point.confidence ? Math.round(point.confidence * 100) + '%' : ''}
                </span>` 
              : '';
            
            tooltipContent += `
              <div style="display: flex; justify-content: space-between; margin-top: 4px;">
                <div style="display: flex; align-items: center;">
                  <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; 
                   background-color: ${getSeriesColor(idx, s.color)}; margin-right: 6px;"></span>
                  <span style="font-weight: 500; color: rgb(var(--scb-dark-gray));">${s.name}</span>
                  ${aiIndicator}
                </div>
                <span style="font-weight: 600; color: rgb(var(--scb-honolulu-blue)); margin-left: 12px;">
                  ${valueFormat(point.value)}
                </span>
              </div>
            `;
          });
          
          // Update tooltip content
          tooltipRef.current.innerHTML = tooltipContent;
          
          // Position tooltip
          const tooltipWidth = tooltipRef.current.offsetWidth;
          const tooltipHeight = tooltipRef.current.offsetHeight;
          const chartRect = svgNode.node()?.getBoundingClientRect();
          
          if (chartRect) {
            const xPosition = chartRect.left + margin.left + mouseX;
            const yPosition = chartRect.top + window.scrollY + margin.top;
            
            // Ensure tooltip stays within viewport
            let leftPos = xPosition + 10;
            
            // If tooltip would go off right edge, position to the left
            if (leftPos + tooltipWidth > window.innerWidth - 10) {
              leftPos = xPosition - tooltipWidth - 10;
            }
            
            tooltipRef.current.style.left = `${leftPos}px`;
            tooltipRef.current.style.top = `${yPosition - tooltipHeight - 10}px`;
          }
        }
        
        // Update vertical line
        verticalLine
          .attr('x1', mouseX)
          .attr('x2', mouseX)
          .style('opacity', 0.5);
        
        // Update tooltip dots
        closestPoints.forEach((item, idx) => {
          const { point } = item;
          
          tooltipDots[idx]
            .attr('cx', xScale(point.date))
            .attr('cy', yScale(point.value))
            .style('opacity', 1);
        });
      });
      
      // Mouse leave handler
      overlay.on('mouseleave', function() {
        // Hide tooltip
        if (tooltipRef.current) {
          tooltipRef.current.style.visibility = 'hidden';
        }
        
        // Hide vertical line
        verticalLine.style('opacity', 0);
        
        // Hide tooltip dots
        tooltipDots.forEach(dot => dot.style('opacity', 0));
      });
    }

    // Add zoom behavior if enabled
    if (zoomable) {
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 5])
        .translateExtent([[0, 0], [width, height]])
        .extent([[0, 0], [width, height]])
        .on('zoom', (event) => {
          // Update axes and paths based on zoom transform
          const xz = event.transform.rescaleX(xScale);
          
          // Update X axis
          g.select('.overlay').remove();
          
          // Update all elements with the new scale
          g.selectAll('.line')
            .attr('d', (d: any) => {
              const lineGen = d3.line<DataPoint>()
                .x(d => xz(d.date))
                .y(d => yScale(d.value))
                .curve(d3.curveMonotoneX);
              return lineGen(d);
            });
            
          g.selectAll('.area')
            .attr('d', (d: any) => {
              const areaGen = d3.area<DataPoint>()
                .x(d => xz(d.date))
                .y0(chartHeight)
                .y1(d => yScale(d.value))
                .curve(d3.curveMonotoneX);
              return areaGen(d);
            });
            
          // Update points
          series.forEach((s, i) => {
            g.selectAll(`.point-${i}`)
              .attr('cx', (d: any) => xz(d.date));
              
            g.selectAll(`.ai-indicator-${i}`)
              .attr('cx', (d: any) => xz(d.date));
          });
          
          // Update X axis
          g.select('g')
            .call(d3.axisBottom(xz)
              .ticks(6)
              .tickSize(0)
              .tickPadding(10)
              .tickFormat(d => d3.timeFormat(dateFormat)(d as Date))
            );
        });
        
      // Store zoom for external controls
      zooomRef.current = zoom;
      
      // Add zoom behavior to SVG
      svg.call(zoom);
    }

  }, [series, width, height, isLoading, showAreaGradient, showTooltip, showGrid, animation, valueFormat, xAxisLabel, yAxisLabel, dateFormat, zoomable]);

  // Cleanup tooltip on unmount
  useEffect(() => {
    return () => {
      if (tooltipRef.current && document.body.contains(tooltipRef.current)) {
        document.body.removeChild(tooltipRef.current);
      }
    };
  }, []);
  
  // Handle zoom in/out via buttons
  const handleZoomIn = () => {
    if (zooomRef.current && svgRef.current) {
      d3.select(svgRef.current).transition().call(zooomRef.current.scaleBy, 1.5);
    }
  };
  
  const handleZoomOut = () => {
    if (zooomRef.current && svgRef.current) {
      d3.select(svgRef.current).transition().call(zooomRef.current.scaleBy, 0.5);
    }
  };
  
  const handleZoomReset = () => {
    if (zooomRef.current && svgRef.current) {
      d3.select(svgRef.current).transition().call(zooomRef.current.transform, d3.zoomIdentity);
    }
  };

  // Handle download chart as PNG
  const handleDownload = () => {
    if (!svgRef.current) return;
    
    try {
      // Convert SVG to canvas for PNG download
      const svgString = new XMLSerializer().serializeToString(svgRef.current);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Create image from SVG
      const img = new Image();
      img.onload = () => {
        // Draw white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        // Draw SVG image
        ctx.drawImage(img, 0, 0);
        
        // Download as PNG
        const link = document.createElement('a');
        link.download = `${title.replace(/\s+/g, '-').toLowerCase()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      };
      
      // Load SVG as image
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
    } catch (err) {
      console.error('Error downloading chart:', err);
    }
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
          {aiSeriesCount > 0 && (
            <div className="horizon-chip horizon-chip-green text-xs py-0.5 px-2">
              <Sparkles className="w-3 h-3" />
              <span>{aiSeriesCount} AI-enhanced</span>
            </div>
          )}
          
          {/* Chart controls */}
          <div className="flex items-center">
            {zoomable && (
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
                  <Settings className="w-4 h-4 text-[rgb(var(--scb-dark-gray))]" />
                </button>
                <button 
                  onClick={handleZoomOut}
                  className="p-1.5 hover:bg-[rgba(var(--scb-light-gray),0.5)] transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4 text-[rgb(var(--scb-dark-gray))]" />
                </button>
              </div>
            )}
            
            {/* Download button */}
            <button 
              onClick={handleDownload}
              className="p-1.5 ml-1 rounded-full hover:bg-[rgba(var(--scb-light-gray),0.5)] text-[rgb(var(--scb-dark-gray))] transition-colors"
              title="Download Chart"
            >
              <Download className="w-4 h-4" />
            </button>
            
            {/* Refresh button */}
            {onRefresh && (
              <button 
                onClick={onRefresh}
                disabled={isLoading}
                className="p-1.5 ml-1 rounded-full hover:bg-[rgba(var(--scb-light-gray),0.5)] text-[rgb(var(--scb-dark-gray))] transition-colors"
                title="Refresh Data"
              >
                {isLoading ? (
                  <EnhancedInlineSpinner size="sm" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Main chart container */}
      <div className="flex-1 flex items-center justify-center p-4 relative">
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 border-2 border-[rgba(var(--scb-honolulu-blue),0.2)] border-t-[rgb(var(--scb-honolulu-blue))] rounded-full animate-spin"></div>
              <p className="text-sm text-[rgb(var(--scb-dark-gray))]">Loading data...</p>
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
          <desc>{subtitle || `Line chart showing ${series.map(s => s.name).join(', ')}`}</desc>
        </svg>
        
        {/* No data state */}
        {!isLoading && (!series.length || !series[0].data.length) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Info className="w-10 h-10 mx-auto mb-2 text-[rgb(var(--scb-border))]" />
              <p className="text-sm text-[rgb(var(--scb-dark-gray))]">No data available</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Legend */}
      {showLegend && series.length > 0 && (
        <div className="px-4 py-3 border-t border-[rgb(var(--scb-border))] bg-[rgba(var(--scb-light-gray),0.1)]">
          <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center">
            {series.map((s, idx) => (
              <div key={s.id} className="flex items-center">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="flex">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: getSeriesColor(idx, s.color) }}
                      ></div>
                      {s.isProjection && (
                        <div 
                          className="w-8 h-0 border-b-2 ml-1 mt-1.5"
                          style={{ 
                            borderColor: getSeriesColor(idx, s.color),
                            borderStyle: 'dashed',
                            borderWidth: '2px'
                          }}
                        ></div>
                      )}
                    </div>
                    <span className="text-xs text-[rgb(var(--scb-dark-gray))]">{s.name}</span>
                  </div>
                  {s.aiEnhanced && (
                    <Sparkles className="w-3 h-3 text-[rgb(var(--scb-american-green))]" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedLineChart;