import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Sparkles, Info, RefreshCw, Download, ArrowDownUp, ArrowLeftRight } from 'lucide-react';
import { EnhancedInlineSpinner } from '../EnhancedLoadingSpinner';

interface BarDataItem {
  label: string;
  value: number;
  color?: string;
  aiEnhanced?: boolean;
  confidence?: number;
  previousValue?: number;
  change?: number;
}

interface EnhancedBarChartProps {
  data: BarDataItem[];
  width?: number;
  height?: number;
  title?: string;
  subtitle?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  orientation?: 'vertical' | 'horizontal';
  isLoading?: boolean;
  onRefresh?: () => void;
  showAIIndicators?: boolean;
  showLabels?: boolean;
  showTooltips?: boolean;
  showValues?: boolean;
  formatValue?: (value: number) => string;
  animate?: boolean;
  sortable?: boolean;
  className?: string;
}

/**
 * Enhanced Bar Chart component with SCB beautiful styling
 * Visualizes categorical data with AI enhancements and SCB branding
 */
const EnhancedBarChart: React.FC<EnhancedBarChartProps> = ({
  data,
  width = 600,
  height = 400,
  title = "Bar Chart",
  subtitle,
  xAxisLabel,
  yAxisLabel,
  orientation = 'vertical',
  isLoading = false,
  onRefresh,
  showAIIndicators = true,
  showLabels = true,
  showTooltips = true,
  showValues = true,
  formatValue = (v: number) => v.toLocaleString(),
  animate = true,
  sortable = true,
  className = ""
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [aiCount, setAiCount] = useState(0);
  const [sortOrder, setSortOrder] = useState<'none' | 'ascending' | 'descending'>('none');
  const [sortedData, setSortedData] = useState<BarDataItem[]>([...data]);
  
  // Update AI count for the indicators
  useEffect(() => {
    setAiCount(data.filter(item => item.aiEnhanced).length);
  }, [data]);
  
  // Update sorted data when original data or sort order changes
  useEffect(() => {
    if (sortOrder === 'none') {
      setSortedData([...data]);
    } else {
      const sorted = [...data].sort((a, b) => {
        const comparison = a.value - b.value;
        return sortOrder === 'ascending' ? comparison : -comparison;
      });
      setSortedData(sorted);
    }
  }, [data, sortOrder]);

  // SCB color palette for bars
  const getBarColor = (item: BarDataItem, index: number): string => {
    if (item.color) return item.color;
    
    const colorPalette = [
      'rgb(var(--scb-honolulu-blue))', // Primary blue
      'rgb(var(--scb-american-green))', // Green
      'rgb(42, 120, 188)', // Light blue
      'rgb(var(--scb-muted-red))', // Red
      'rgb(245, 152, 0)', // Orange
      'rgb(88, 64, 148)', // Purple
      'rgb(0, 112, 122)', // Teal
      'rgb(var(--scb-dark-gray))' // Gray
    ];
    
    return colorPalette[index % colorPalette.length];
  };

  // Main chart rendering function
  useEffect(() => {
    if (!svgRef.current || isLoading || sortedData.length === 0) return;

    // Clear previous chart
    const svgNode = d3.select(svgRef.current);
    svgNode.selectAll('*').remove();

    // Set up dimensions with SCB design proportions
    const margin = { top: 10, right: 30, bottom: orientation === 'vertical' ? 80 : 40, left: orientation === 'vertical' ? 60 : 100 };
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

    // Setup scales based on orientation
    let xScale, yScale;
    
    if (orientation === 'vertical') {
      // X scale for vertical bars (categorical)
      xScale = d3.scaleBand()
        .domain(sortedData.map(d => d.label))
        .range([0, chartWidth])
        .padding(0.3);
      
      // Y scale for vertical bars (values)
      yScale = d3.scaleLinear()
        .domain([0, d3.max(sortedData, d => d.value) || 0])
        .nice()
        .range([chartHeight, 0]);
    } else {
      // X scale for horizontal bars (values)
      xScale = d3.scaleLinear()
        .domain([0, d3.max(sortedData, d => d.value) || 0])
        .nice()
        .range([0, chartWidth]);
      
      // Y scale for horizontal bars (categorical)
      yScale = d3.scaleBand()
        .domain(sortedData.map(d => d.label))
        .range([0, chartHeight])
        .padding(0.2);
    }

    // Add background with SCB light gray
    g.append('rect')
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .attr('fill', 'rgba(var(--scb-light-gray), 0.2)')
      .attr('rx', 4); // Rounded corners

    // Add grid lines with SCB styling
    if (orientation === 'vertical') {
      // Y-grid for vertical bars
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
    } else {
      // X-grid for horizontal bars
      g.append('g')
        .attr('class', 'x-grid')
        .selectAll('line')
        .data(xScale.ticks(5))
        .enter()
        .append('line')
        .attr('x1', d => xScale(d))
        .attr('x2', d => xScale(d))
        .attr('y1', 0)
        .attr('y2', chartHeight)
        .attr('stroke', 'rgb(var(--scb-border))')
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.5);
    }

    // Create a tooltip div if it doesn't exist
    if (showTooltips && !tooltipRef.current) {
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

    // Draw bars based on orientation
    if (orientation === 'vertical') {
      // Draw vertical bars
      const bars = g.selectAll('.bar')
        .data(sortedData)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d.label) || 0)
        .attr('width', xScale.bandwidth())
        .attr('fill', (d, i) => getBarColor(d, i))
        .attr('rx', 2) // Rounded corners for bars
        .attr('ry', 2);
        
      // Animation and final position for bars
      if (animate) {
        bars
          .attr('y', chartHeight)
          .attr('height', 0)
          .transition()
          .duration(800)
          .delay((_, i) => i * 50)
          .attr('y', d => yScale(d.value))
          .attr('height', d => chartHeight - yScale(d.value));
      } else {
        bars
          .attr('y', d => yScale(d.value))
          .attr('height', d => chartHeight - yScale(d.value));
      }
      
      // Add value labels on top of bars if enabled
      if (showValues) {
        const labels = g.selectAll('.value-label')
          .data(sortedData)
          .enter()
          .append('text')
          .attr('class', 'value-label')
          .attr('x', d => (xScale(d.label) || 0) + xScale.bandwidth() / 2)
          .attr('y', d => yScale(d.value) - 8)
          .attr('text-anchor', 'middle')
          .attr('font-size', '11px')
          .attr('fill', 'rgb(var(--scb-dark-gray))')
          .text(d => formatValue(d.value));
          
        // Animate value labels
        if (animate) {
          labels
            .style('opacity', 0)
            .transition()
            .duration(800)
            .delay((_, i) => 100 + i * 50)
            .style('opacity', 1);
        }
      }
      
      // Add change indicators if data has previousValue or change
      g.selectAll('.change-indicator')
        .data(sortedData.filter(d => d.previousValue !== undefined || d.change !== undefined))
        .enter()
        .append('g')
        .attr('class', 'change-indicator')
        .attr('transform', d => `translate(${(xScale(d.label) || 0) + xScale.bandwidth() / 2}, ${yScale(d.value) - 20})`)
        .each(function(d) {
          const group = d3.select(this);
          const change = d.change !== undefined ? d.change : (d.previousValue !== undefined ? ((d.value / d.previousValue) - 1) : 0);
          const isPositive = change > 0;
          const changeText = isPositive ? `+${(change * 100).toFixed(1)}%` : `${(change * 100).toFixed(1)}%`;
          
          // Add triangle indicator
          group.append('path')
            .attr('d', isPositive ? 'M-4,4 L4,4 L0,0 Z' : 'M-4,-4 L4,-4 L0,0 Z')
            .attr('fill', isPositive ? 'rgb(var(--scb-american-green))' : 'rgb(var(--scb-muted-red))');
            
          // Add change percentage
          group.append('text')
            .attr('y', isPositive ? -4 : 8)
            .attr('text-anchor', 'middle')
            .attr('font-size', '10px')
            .attr('fill', isPositive ? 'rgb(var(--scb-american-green))' : 'rgb(var(--scb-muted-red))')
            .text(changeText);
        });
        
    } else {
      // Draw horizontal bars
      const bars = g.selectAll('.bar')
        .data(sortedData)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('y', d => yScale(d.label) || 0)
        .attr('height', yScale.bandwidth())
        .attr('fill', (d, i) => getBarColor(d, i))
        .attr('rx', 2) // Rounded corners for bars
        .attr('ry', 2);
        
      // Animation and final position for bars
      if (animate) {
        bars
          .attr('x', 0)
          .attr('width', 0)
          .transition()
          .duration(800)
          .delay((_, i) => i * 50)
          .attr('width', d => xScale(d.value));
      } else {
        bars
          .attr('width', d => xScale(d.value));
      }
      
      // Add value labels at the end of bars if enabled
      if (showValues) {
        const labels = g.selectAll('.value-label')
          .data(sortedData)
          .enter()
          .append('text')
          .attr('class', 'value-label')
          .attr('x', d => xScale(d.value) + 6)
          .attr('y', d => (yScale(d.label) || 0) + yScale.bandwidth() / 2)
          .attr('dy', '0.35em')
          .attr('font-size', '11px')
          .attr('fill', 'rgb(var(--scb-dark-gray))')
          .text(d => formatValue(d.value));
          
        // Animate value labels
        if (animate) {
          labels
            .style('opacity', 0)
            .transition()
            .duration(800)
            .delay((_, i) => 100 + i * 50)
            .style('opacity', 1);
        }
      }
      
      // Add change indicators for horizontal bars
      g.selectAll('.change-indicator')
        .data(sortedData.filter(d => d.previousValue !== undefined || d.change !== undefined))
        .enter()
        .append('g')
        .attr('class', 'change-indicator')
        .attr('transform', d => `translate(${xScale(d.value) + 5}, ${(yScale(d.label) || 0) + yScale.bandwidth() / 2})`)
        .each(function(d) {
          const group = d3.select(this);
          const change = d.change !== undefined ? d.change : (d.previousValue !== undefined ? ((d.value / d.previousValue) - 1) : 0);
          const isPositive = change > 0;
          const changeText = isPositive ? `+${(change * 100).toFixed(1)}%` : `${(change * 100).toFixed(1)}%`;
          
          // Add triangle indicator
          group.append('path')
            .attr('d', isPositive ? 'M0,-4 L0,4 L4,0 Z' : 'M0,-4 L0,4 L-4,0 Z')
            .attr('fill', isPositive ? 'rgb(var(--scb-american-green))' : 'rgb(var(--scb-muted-red))');
            
          // Add change percentage
          group.append('text')
            .attr('x', isPositive ? 8 : -8)
            .attr('text-anchor', isPositive ? 'start' : 'end')
            .attr('dy', '0.35em')
            .attr('font-size', '10px')
            .attr('fill', isPositive ? 'rgb(var(--scb-american-green))' : 'rgb(var(--scb-muted-red))')
            .text(changeText);
        });
    }

    // Add AI indicators to bars if enabled
    if (showAIIndicators) {
      sortedData.forEach((d, i) => {
        if (d.aiEnhanced) {
          if (orientation === 'vertical') {
            // AI indicators for vertical bars
            g.append('rect')
              .attr('x', (xScale(d.label) || 0) - 1)
              .attr('y', yScale(d.value))
              .attr('width', xScale.bandwidth() + 2)
              .attr('height', 4)
              .attr('fill', 'none')
              .attr('stroke', 'rgb(var(--scb-american-green))')
              .attr('stroke-width', 2)
              .attr('stroke-dasharray', '3,2')
              .attr('rx', 2);
          } else {
            // AI indicators for horizontal bars
            g.append('rect')
              .attr('x', xScale(d.value) - 4)
              .attr('y', (yScale(d.label) || 0) - 1)
              .attr('width', 4)
              .attr('height', yScale.bandwidth() + 2)
              .attr('fill', 'none')
              .attr('stroke', 'rgb(var(--scb-american-green))')
              .attr('stroke-width', 2)
              .attr('stroke-dasharray', '3,2')
              .attr('rx', 2);
          }
        }
      });
    }

    // Create axes with SCB styling
    if (orientation === 'vertical') {
      // X-axis for vertical bars (categories)
      const xAxis = g.append('g')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(d3.axisBottom(xScale)
          .tickSize(0)
          .tickPadding(10)
        );
      
      // Style X-axis
      xAxis.select('.domain')
        .attr('stroke', 'rgb(var(--scb-border))');
        
      xAxis.selectAll('text')
        .attr('font-size', '11px')
        .attr('fill', 'rgb(var(--scb-dark-gray))')
        .attr('transform', 'rotate(-45)')
        .attr('text-anchor', 'end')
        .attr('dx', '-0.8em')
        .attr('dy', '0.15em');
        
      // X-axis label
      if (xAxisLabel) {
        g.append('text')
          .attr('x', chartWidth / 2)
          .attr('y', chartHeight + 60)
          .attr('text-anchor', 'middle')
          .attr('font-size', '12px')
          .attr('fill', 'rgb(var(--scb-dark-gray))')
          .text(xAxisLabel);
      }
      
      // Y-axis for vertical bars (values)
      const yAxis = g.append('g')
        .call(d3.axisLeft(yScale)
          .ticks(5)
          .tickSize(0)
          .tickPadding(10)
          .tickFormat(d => formatValue(d as number))
        );
      
      // Style Y-axis
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
    } else {
      // X-axis for horizontal bars (values)
      const xAxis = g.append('g')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(d3.axisBottom(xScale)
          .ticks(5)
          .tickSize(0)
          .tickPadding(10)
          .tickFormat(d => formatValue(d as number))
        );
      
      // Style X-axis
      xAxis.select('.domain')
        .attr('stroke', 'rgb(var(--scb-border))');
        
      xAxis.selectAll('text')
        .attr('font-size', '11px')
        .attr('fill', 'rgb(var(--scb-dark-gray))');
        
      // X-axis label
      if (xAxisLabel) {
        g.append('text')
          .attr('x', chartWidth / 2)
          .attr('y', chartHeight + 30)
          .attr('text-anchor', 'middle')
          .attr('font-size', '12px')
          .attr('fill', 'rgb(var(--scb-dark-gray))')
          .text(xAxisLabel);
      }
      
      // Y-axis for horizontal bars (categories)
      const yAxis = g.append('g')
        .call(d3.axisLeft(yScale)
          .tickSize(0)
          .tickPadding(10)
        );
      
      // Style Y-axis
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
          .attr('y', -75)
          .attr('text-anchor', 'middle')
          .attr('font-size', '12px')
          .attr('fill', 'rgb(var(--scb-dark-gray))')
          .text(yAxisLabel);
      }
    }

    // Add tooltip interactions to bars
    if (showTooltips) {
      g.selectAll('.bar')
        .on('mouseover', function(event, d: BarDataItem) {
          const rect = this as SVGRectElement;
          
          // Highlight the bar
          d3.select(rect)
            .transition()
            .duration(200)
            .attr('opacity', 0.8)
            .attr('stroke', 'rgb(var(--scb-dark-gray))')
            .attr('stroke-width', 1);
            
          // Show tooltip
          if (tooltipRef.current) {
            tooltipRef.current.style.visibility = 'visible';
            
            // Calculate change if available
            let changeHtml = '';
            if (d.previousValue !== undefined || d.change !== undefined) {
              const change = d.change !== undefined ? d.change : (d.previousValue !== undefined ? ((d.value / d.previousValue) - 1) : 0);
              const isPositive = change > 0;
              const changeText = isPositive ? `+${(change * 100).toFixed(1)}%` : `${(change * 100).toFixed(1)}%`;
              const changeColor = isPositive ? 'rgb(var(--scb-american-green))' : 'rgb(var(--scb-muted-red))';
              
              changeHtml = `
                <div style="display: flex; align-items: center; margin-top: 4px;">
                  <span style="color: ${changeColor}; font-weight: 500;">${changeText}</span>
                  <span style="color: rgb(var(--scb-dark-gray)); margin-left: 4px; font-size: 11px;">vs previous</span>
                </div>
              `;
            }
            
            // Add AI indicator if applicable
            const aiIndicator = d.aiEnhanced 
              ? `<div style="display: flex; align-items: center; margin-top: 4px; font-size: 11px; color: rgb(var(--scb-american-green));">
                  <div style="width: 8px; height: 8px; border-radius: 50%; background-color: rgb(var(--scb-american-green)); margin-right: 5px;"></div>
                  <div>AI-enhanced ${d.confidence ? `(${Math.round(d.confidence * 100)}% confidence)` : ''}</div>
                </div>`
              : '';
            
            // Update tooltip content
            tooltipRef.current.innerHTML = `
              <div style="font-weight: 500; color: rgb(var(--scb-dark-gray));">${d.label}</div>
              <div style="font-weight: 600; font-size: 14px; color: rgb(var(--scb-honolulu-blue)); margin-top: 2px;">
                ${formatValue(d.value)}
              </div>
              ${changeHtml}
              ${aiIndicator}
            `;
            
            // Position tooltip
            const { pageX, pageY } = event;
            tooltipRef.current.style.left = `${pageX + 10}px`;
            tooltipRef.current.style.top = `${pageY - 10}px`;
          }
        })
        .on('mousemove', function(event) {
          if (tooltipRef.current) {
            tooltipRef.current.style.left = `${event.pageX + 10}px`;
            tooltipRef.current.style.top = `${event.pageY - 10}px`;
          }
        })
        .on('mouseout', function() {
          const rect = this as SVGRectElement;
          
          // Reset bar style
          d3.select(rect)
            .transition()
            .duration(200)
            .attr('opacity', 1)
            .attr('stroke', 'none');
            
          // Hide tooltip
          if (tooltipRef.current) {
            tooltipRef.current.style.visibility = 'hidden';
          }
        });
    }

  }, [sortedData, width, height, formatValue, orientation, isLoading, showValues, showAIIndicators, showTooltips, animate, xAxisLabel, yAxisLabel]);

  // Cleanup tooltip on unmount
  useEffect(() => {
    return () => {
      if (tooltipRef.current && document.body.contains(tooltipRef.current)) {
        document.body.removeChild(tooltipRef.current);
      }
    };
  }, []);

  // Handle sort toggle
  const handleSort = () => {
    if (sortOrder === 'none') {
      setSortOrder('descending');
    } else if (sortOrder === 'descending') {
      setSortOrder('ascending');
    } else {
      setSortOrder('none');
    }
  };

  // Toggle orientation
  const handleToggleOrientation = () => {
    // This would be implemented in a real component to switch between vertical and horizontal
    // For this example, we don't actually toggle since it would require re-rendering with new props
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
          {showAIIndicators && aiCount > 0 && (
            <div className="horizon-chip horizon-chip-green text-xs py-0.5 px-2">
              <Sparkles className="w-3 h-3" />
              <span>{aiCount} AI-enhanced</span>
            </div>
          )}
          
          {/* Chart controls */}
          <div className="flex items-center border border-[rgb(var(--scb-border))] rounded-md overflow-hidden">
            {/* Sort toggle */}
            {sortable && (
              <button 
                onClick={handleSort}
                className="p-1.5 hover:bg-[rgba(var(--scb-light-gray),0.5)] transition-colors"
                title={sortOrder === 'none' ? 'Sort values' : sortOrder === 'descending' ? 'Sort ascending' : 'Remove sorting'}
              >
                <ArrowDownUp className={`w-4 h-4 ${
                  sortOrder !== 'none' 
                    ? 'text-[rgb(var(--scb-honolulu-blue))]' 
                    : 'text-[rgb(var(--scb-dark-gray))]'
                }`} />
              </button>
            )}
            
            {/* Orientation toggle */}
            <button 
              onClick={handleToggleOrientation}
              className="p-1.5 hover:bg-[rgba(var(--scb-light-gray),0.5)] transition-colors"
              title={orientation === 'vertical' ? 'Switch to horizontal bars' : 'Switch to vertical bars'}
            >
              <ArrowLeftRight className="w-4 h-4 text-[rgb(var(--scb-dark-gray))]" />
            </button>
            
            {/* Download button */}
            <button 
              onClick={() => {
                // Download chart as image functionality would be implemented here
                if (!svgRef.current) return;
                
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
              }}
              className="p-1.5 hover:bg-[rgba(var(--scb-light-gray),0.5)] transition-colors"
              title="Download Chart"
            >
              <Download className="w-4 h-4 text-[rgb(var(--scb-dark-gray))]" />
            </button>
          </div>
          
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
          <desc>{subtitle || `Bar chart showing ${data.length} categories`}</desc>
        </svg>
        
        {/* No data state */}
        {!isLoading && data.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Info className="w-10 h-10 mx-auto mb-2 text-[rgb(var(--scb-border))]" />
              <p className="text-sm text-[rgb(var(--scb-dark-gray))]">No data available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedBarChart;