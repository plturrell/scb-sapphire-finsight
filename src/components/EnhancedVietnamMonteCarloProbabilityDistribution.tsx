import React, { useRef, useEffect, useState } from 'react';
import { Info, ZoomIn, ZoomOut, Download, BarChart2, AlertCircle, ChevronRight, RefreshCw } from 'lucide-react';
import * as d3 from 'd3';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import { useNetworkAwareLoading } from '@/hooks/useNetworkAwareLoading';

interface EnhancedProbabilityDistributionProps {
  data: number[] | null;
  metricName?: string;
  metricUnit?: string;
  loading?: boolean;
  caseBoundaries?: {
    pessimistic: [number, number]; // percentiles [0-100]
    realistic: [number, number];
    optimistic: [number, number];
  };
  onSliderChange?: (value: number) => void;
  className?: string;
  theme?: 'light' | 'dark';
  adaptive?: boolean;
  onExport?: () => void;
  showControls?: boolean;
}

// Default case boundaries if not provided
const defaultCaseBoundaries = {
  pessimistic: [0, 5],
  realistic: [5, 95],
  optimistic: [95, 100]
};

/**
 * EnhancedVietnamMonteCarloProbabilityDistribution Component
 * An enhanced component that displays a probability distribution visualization
 * for Monte Carlo simulation results with SCB Beautiful UI styling
 */
const EnhancedVietnamMonteCarloProbabilityDistribution: React.FC<EnhancedProbabilityDistributionProps> = ({
  data,
  metricName = 'Revenue Impact',
  metricUnit = '$M',
  loading = false,
  caseBoundaries = defaultCaseBoundaries,
  onSliderChange,
  className = '',
  theme: propTheme,
  adaptive = true,
  onExport,
  showControls = true
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [sliderValue, setSliderValue] = useState<number>(50);
  const [sliderMetric, setSliderMetric] = useState<number | null>(null);
  const [percentileInfo, setPercentileInfo] = useState<{
    value: number | null;
    percentile: number | null;
  }>({ value: null, percentile: null });
  const [zoom, setZoom] = useState<number>(1);
  
  const { prefersColorScheme, tier, reduceMotion } = useDeviceCapabilities();
  const { connection } = useNetworkAwareLoading();
  
  // Determine effective theme based on props or system preference
  const theme = propTheme || prefersColorScheme || 'light';
  
  // Determine detail level based on device tier and network conditions
  const detailLevel = adaptive 
    ? (connection.type === 'slow-2g' || connection.type === '2g' || tier === 'low') 
      ? 'low' 
      : connection.type === '3g' 
        ? 'medium' 
        : 'high'
    : 'high';
  
  // Define SCB colors based on theme
  const colors = {
    light: {
      // Primary SCB colors
      honoluluBlue: 'rgb(var(--scb-honolulu-blue, 0, 114, 170))', // #0072AA
      americanGreen: 'rgb(var(--scb-american-green, 33, 170, 71))', // #21AA47
      sun: 'rgb(var(--scb-sun, 255, 204, 0))', // #FFCC00
      persianRed: 'rgb(var(--scb-persian-red, 204, 0, 0))', // #CC0000
      
      // Case analysis specific colors
      pessimistic: '#d60542', // red
      realistic: '#0072AA',  // SCB blue
      optimistic: '#21AA47', // SCB green
      
      // UI elements
      background: 'white',
      cardBackground: 'white',
      headerBackground: '#f8f8f8',
      chartBackground: '#f9f9fb',
      text: '#333333',
      textSecondary: '#666666',
      border: '#e0e0e0',
      gridLines: '#ccc',
      axes: '#666666',
      densityCurve: '#cc00dc', // SCB purple
      buttonText: 'white',
      tooltipBackground: 'white',
      tooltipBorder: '#ccc',
      sliderRail: '#e0e0e0',
      sliderTrack: 'rgb(var(--scb-honolulu-blue, 0, 114, 170))',
      sliderThumb: 'rgb(var(--scb-honolulu-blue, 0, 114, 170))'
    },
    dark: {
      // Primary SCB colors - lighter for dark mode
      honoluluBlue: 'rgb(0, 142, 211)', // Lighter for dark mode
      americanGreen: 'rgb(41, 204, 86)', // Lighter for dark mode
      sun: 'rgb(255, 214, 51)', // Lighter for dark mode
      persianRed: 'rgb(255, 99, 99)', // Lighter for dark mode
      
      // Case analysis specific colors
      pessimistic: '#ff4d6d', // brighter red for dark mode
      realistic: '#0095db',   // brighter blue for dark mode
      optimistic: '#29cc56',  // brighter green for dark mode
      
      // UI elements
      background: '#121212',
      cardBackground: '#1e1e1e',
      headerBackground: '#252525',
      chartBackground: '#1a1a1a',
      text: '#e0e0e0',
      textSecondary: '#a0a0a0',
      border: '#333333',
      gridLines: '#444444',
      axes: '#888888',
      densityCurve: '#e838f1', // Lighter purple for dark mode
      buttonText: 'white',
      tooltipBackground: '#2a2a2a',
      tooltipBorder: '#444444',
      sliderRail: '#444444',
      sliderTrack: 'rgb(0, 142, 211)',
      sliderThumb: 'rgb(0, 142, 211)'
    }
  };
  
  const currentColors = colors[theme];

  // Format numbers for display
  const formatNumber = (num: number): string => {
    if (Math.abs(num) >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(1)}M`;
    } else if (Math.abs(num) >= 1_000) {
      return `${(num / 1_000).toFixed(1)}K`;
    } else {
      return num.toFixed(2);
    }
  };

  // Format currency values
  const formatCurrency = (num: number): string => {
    if (metricUnit === '$M') {
      return `$${formatNumber(num)}`;
    } else if (metricUnit === '$K') {
      return `$${formatNumber(num * 1000)}`;
    } else {
      return `${formatNumber(num)}${metricUnit}`;
    }
  };

  // Handle slider change
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setSliderValue(value);
    
    if (onSliderChange) {
      onSliderChange(value);
    }
    
    // Calculate metric value at this percentile
    if (data && data.length > 0) {
      const sortedData = [...data].sort((a, b) => a - b);
      const index = Math.floor((value / 100) * sortedData.length);
      const metricValue = sortedData[Math.min(index, sortedData.length - 1)];
      setSliderMetric(metricValue);
    }
  };
  
  // Handle zoom in
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 2));
  };
  
  // Handle zoom out
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };
  
  // Handle export
  const handleExport = () => {
    if (!svgRef.current) return;
    
    if (onExport) {
      onExport();
      return;
    }
    
    // Default export implementation
    const svg = svgRef.current;
    const serializer = new XMLSerializer();
    const svgData = serializer.serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = svg.clientWidth * 2;
    canvas.height = svg.clientHeight * 2;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${metricName.replace(/\s+/g, '-').toLowerCase()}-distribution.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Render the probability distribution visualization
  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current || !containerRef.current) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

    // Set up dimensions
    const containerWidth = containerRef.current.clientWidth;
    const margin = { top: 20, right: 30, bottom: 60, left: 50 };
    const width = (containerWidth - margin.left - margin.right);
    const height = 400 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', containerWidth)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
      
    // Add background
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', currentColors.chartBackground)
      .attr('rx', 4)
      .attr('ry', 4);

    // Sort data and calculate min/max values
    const sortedData = [...data].sort((a, b) => a - b);
    const minValue = sortedData[0];
    const maxValue = sortedData[sortedData.length - 1];
    const range = maxValue - minValue;
    const padding = range * 0.05;

    // X scale
    const x = d3.scaleLinear()
      .domain([minValue - padding, maxValue + padding])
      .range([0, width * zoom]);
      
    // Apply pan/zoom
    const zoomOffset = (width * zoom - width) / 2;
    svg.attr('transform', `translate(${margin.left - zoomOffset},${margin.top})`);

    // Calculate histogram bins
    const numBins = detailLevel === 'low' ? 20 : detailLevel === 'medium' ? 30 : 50;
    const histogram = d3.histogram<number, number>()
      .value(d => d)
      .domain(x.domain())
      .thresholds(x.ticks(numBins));

    const bins = histogram(data);

    // Y scale (for histogram)
    const y = d3.scaleLinear()
      .domain([0, d3.max(bins, d => d.length) || 0])
      .range([height, 0]);

    // Add grid lines (fewer for low detail)
    const gridLineCount = detailLevel === 'low' ? 3 : detailLevel === 'medium' ? 4 : 5;
    svg.append('g')
      .attr('class', 'grid-lines')
      .selectAll('line')
      .data(y.ticks(gridLineCount))
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', width * zoom)
      .attr('y1', d => y(d))
      .attr('y2', d => y(d))
      .attr('stroke', currentColors.gridLines)
      .attr('stroke-opacity', 0.3)
      .attr('stroke-dasharray', '3,3');

    // Create X axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .ticks(detailLevel === 'low' ? 5 : detailLevel === 'medium' ? 7 : 9)
        .tickFormat(d => formatCurrency(d as number)))
      .attr('color', currentColors.axes)
      .selectAll('text')
      .attr('transform', 'translate(-10,5)rotate(-45)')
      .style('text-anchor', 'end')
      .style('font-size', '10px')
      .style('fill', currentColors.textSecondary);

    // Create Y axis
    svg.append('g')
      .call(d3.axisLeft(y)
        .ticks(detailLevel === 'low' ? 3 : 5)
        .tickFormat(d => `${d}`))
      .attr('color', currentColors.axes)
      .selectAll('text')
      .style('fill', currentColors.textSecondary);

    // Add X axis label
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('x', (width * zoom) / 2)
      .attr('y', height + (detailLevel === 'low' ? 40 : 50))
      .style('font-size', '12px')
      .style('fill', currentColors.text)
      .text(metricName);

    // Add Y axis label (only for medium and high detail)
    if (detailLevel !== 'low') {
      svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90)')
        .attr('y', -margin.left + 15)
        .attr('x', -height / 2)
        .style('font-size', '12px')
        .style('fill', currentColors.text)
        .text('Frequency');
    }

    // Calculate percentile values for case boundaries
    const getPercentileValue = (percentile: number) => {
      const index = Math.floor((percentile / 100) * sortedData.length);
      return sortedData[Math.min(index, sortedData.length - 1)];
    };

    const boundaries = {
      pessimistic: [
        getPercentileValue(caseBoundaries.pessimistic[0]),
        getPercentileValue(caseBoundaries.pessimistic[1])
      ],
      realistic: [
        getPercentileValue(caseBoundaries.realistic[0]),
        getPercentileValue(caseBoundaries.realistic[1])
      ],
      optimistic: [
        getPercentileValue(caseBoundaries.optimistic[0]),
        getPercentileValue(caseBoundaries.optimistic[1])
      ]
    };

    // Draw histogram bars with case coloring
    svg.selectAll('rect.bar')
      .data(bins)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.x0 as number))
      .attr('width', d => Math.max(0, x(d.x1 as number) - x(d.x0 as number) - 1))
      .attr('y', d => y(d.length))
      .attr('height', d => height - y(d.length))
      .attr('fill', d => {
        const binMidpoint = ((d.x0 as number) + (d.x1 as number)) / 2;
        if (binMidpoint <= boundaries.pessimistic[1]) {
          return currentColors.pessimistic;
        } else if (binMidpoint <= boundaries.realistic[1]) {
          return currentColors.realistic;
        } else {
          return currentColors.optimistic;
        }
      })
      .attr('opacity', 0.8)
      .attr('rx', detailLevel === 'high' ? 2 : 0) // Rounded corners for high detail only
      .on('mouseover', function(event, d) {
        const [mouseX, mouseY] = d3.pointer(event);
        
        if (tooltipRef.current) {
          const tooltip = d3.select(tooltipRef.current);
          const binStart = formatCurrency(d.x0 as number);
          const binEnd = formatCurrency(d.x1 as number);
          const count = d.length;
          const percentage = ((count / data.length) * 100).toFixed(1);
          
          tooltip.html(`
            <div style="font-weight: bold; margin-bottom: 4px;">${binStart} to ${binEnd}</div>
            <div>Count: ${count} observations</div>
            <div>Frequency: ${percentage}%</div>
          `);
          
          tooltip
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 30}px`)
            .style('opacity', 1)
            .style('visibility', 'visible');
        }
        
        // Highlight the bar
        d3.select(this)
          .attr('opacity', 1)
          .attr('stroke', theme === 'dark' ? '#fff' : '#000')
          .attr('stroke-width', 1);
      })
      .on('mouseout', function() {
        if (tooltipRef.current) {
          d3.select(tooltipRef.current)
            .style('opacity', 0)
            .style('visibility', 'hidden');
        }
        
        d3.select(this)
          .attr('opacity', 0.8)
          .attr('stroke', 'none');
      });

    // Calculate kernel density estimation for the distribution curve
    // Only add for medium and high detail levels
    if (detailLevel !== 'low') {
      const kde = kernelDensityEstimator(kernelEpanechnikov(0.7), x.ticks(100));
      const density = kde(data);

      // Y scale for density curve (separate from histogram)
      const yDensity = d3.scaleLinear()
        .domain([0, d3.max(density, d => d[1]) || 0])
        .range([height, 0]);

      // Draw density curve
      svg.append('path')
        .datum(density)
        .attr('fill', 'none')
        .attr('stroke', currentColors.densityCurve)
        .attr('stroke-width', 2)
        .attr('stroke-linejoin', 'round')
        .attr('d', d3.line<[number, number]>()
          .curve(d3.curveBasis)
          .x(d => x(d[0]))
          .y(d => yDensity(d[1]))
        );
    }

    // Draw case division lines
    const drawCaseLine = (value: number, color: string, label: string) => {
      const xPos = x(value);
      
      // Draw vertical line
      svg.append('line')
        .attr('x1', xPos)
        .attr('x2', xPos)
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');
      
      // Add label
      svg.append('text')
        .attr('x', xPos)
        .attr('y', height + 30)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('fill', color)
        .text(label);
    };

    // Draw case boundary lines
    drawCaseLine(boundaries.pessimistic[1], currentColors.pessimistic, 'Pessimistic');
    drawCaseLine(boundaries.realistic[1], currentColors.optimistic, 'Optimistic');

    // Draw key percentile indicators
    // For low detail, only show P50, for medium show P25, P50, P75, for high show P5, P25, P50, P75, P95
    const percentilesToShow = 
      detailLevel === 'low' ? [50] : 
      detailLevel === 'medium' ? [25, 50, 75] : 
      [5, 25, 50, 75, 95];
    
    percentilesToShow.forEach(percentile => {
      const value = getPercentileValue(percentile);
      const xPos = x(value);
      
      // Skip if too close to case boundaries
      if (
        Math.abs(xPos - x(boundaries.pessimistic[1])) < 30 ||
        Math.abs(xPos - x(boundaries.realistic[1])) < 30
      ) {
        return;
      }
      
      // Only draw P50 (median) with label
      if (percentile === 50) {
        svg.append('line')
          .attr('x1', xPos)
          .attr('x2', xPos)
          .attr('y1', 0)
          .attr('y2', height)
          .attr('stroke', currentColors.honoluluBlue)
          .attr('stroke-width', 2);
        
        svg.append('text')
          .attr('x', xPos)
          .attr('y', height + 30)
          .attr('text-anchor', 'middle')
          .style('font-size', '10px')
          .style('fill', currentColors.honoluluBlue)
          .text('Median');
      } else {
        // Draw small tick marks for other percentiles
        svg.append('line')
          .attr('x1', xPos)
          .attr('x2', xPos)
          .attr('y1', height - 5)
          .attr('y2', height + 5)
          .attr('stroke', currentColors.axes)
          .attr('stroke-width', 1);
        
        svg.append('text')
          .attr('x', xPos)
          .attr('y', height + 15)
          .attr('text-anchor', 'middle')
          .style('font-size', '8px')
          .style('fill', currentColors.textSecondary)
          .text(`P${percentile}`);
      }
    });

    // Draw slider position indicator
    if (sliderMetric !== null) {
      const sliderX = x(sliderMetric);
      
      svg.append('line')
        .attr('x1', sliderX)
        .attr('x2', sliderX)
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', theme === 'dark' ? '#fff' : '#000')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3');
      
      svg.append('circle')
        .attr('cx', sliderX)
        .attr('cy', height / 2)
        .attr('r', 5)
        .attr('fill', currentColors.honoluluBlue);
    }

    // Update percentile info for display
    if (data && sliderValue !== null) {
      const sortedData = [...data].sort((a, b) => a - b);
      const index = Math.floor((sliderValue / 100) * sortedData.length);
      const value = sortedData[Math.min(index, sortedData.length - 1)];
      
      setPercentileInfo({
        value,
        percentile: sliderValue
      });
    }

    // Helper functions for kernel density estimation
    function kernelDensityEstimator(kernel: (v: number) => number, X: number[]) {
      return function(V: number[]) {
        return X.map(x => [x, d3.mean(V, v => kernel(x - v)) || 0]);
      };
    }

    function kernelEpanechnikov(k: number) {
      return function(v: number) {
        return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
      };
    }
  }, [data, caseBoundaries, metricName, metricUnit, sliderMetric, theme, currentColors, zoom, detailLevel]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Redraw the chart on window resize
      if (data && data.length > 0) {
        d3.select(svgRef.current).selectAll('*').remove();
        // The useEffect above will redraw the chart
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [data]);

  return (
    <div 
      className={`rounded-lg overflow-hidden ${className}`}
      style={{ 
        backgroundColor: currentColors.cardBackground,
        border: `1px solid ${currentColors.border}`,
        color: currentColors.text
      }}
    >
      {/* Header */}
      <div 
        className="p-3 border-b horizon-header flex items-center justify-between"
        style={{ 
          backgroundColor: currentColors.headerBackground,
          borderColor: currentColors.border
        }}
      >
        <div 
          className="font-medium flex items-center gap-2"
          style={{ color: currentColors.text }}
        >
          <BarChart2 size={18} style={{ color: currentColors.honoluluBlue }} />
          <span>Probability Distribution - {metricName}</span>
        </div>
        
        {showControls && (
          <div className="flex items-center gap-2">
            <button
              className="p-1 rounded transition-colors"
              style={{ color: currentColors.textSecondary }}
              onClick={handleExport}
              aria-label="Download as PNG"
            >
              <Download size={16} />
            </button>
            
            <button
              className="p-1 rounded transition-colors"
              style={{ color: currentColors.textSecondary }}
              onClick={handleZoomIn}
              aria-label="Zoom in"
              disabled={zoom >= 2}
            >
              <ZoomIn size={16} />
            </button>
            
            <button
              className="p-1 rounded transition-colors"
              style={{ color: currentColors.textSecondary }}
              onClick={handleZoomOut}
              aria-label="Zoom out"
              disabled={zoom <= 0.5}
            >
              <ZoomOut size={16} />
            </button>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4" ref={containerRef}>
        {loading ? (
          <div 
            className="flex flex-col items-center justify-center py-12"
            style={{ color: currentColors.textSecondary }}
          >
            <div 
              className="animate-spin h-10 w-10 mb-4"
              style={{ 
                borderWidth: '3px',
                borderStyle: 'solid',
                borderColor: `${currentColors.honoluluBlue} transparent transparent transparent`,
                borderRadius: '50%'
              }}
            ></div>
            <div className="text-center">
              <div className="mb-1">Running simulation...</div>
              <div className="text-sm">
                Calculating probability distribution for {metricName}
              </div>
            </div>
          </div>
        ) : data && data.length > 0 ? (
          <>
            <div className="relative">
              <svg ref={svgRef} width="100%" height="460" />
              <div 
                ref={tooltipRef} 
                className="fixed opacity-0 invisible pointer-events-none transition-opacity duration-200 z-50 horizon-tooltip"
                style={{
                  backgroundColor: currentColors.tooltipBackground,
                  border: `1px solid ${currentColors.tooltipBorder}`,
                  borderRadius: '4px',
                  padding: '8px',
                  fontSize: '12px',
                  boxShadow: theme === 'dark' ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
                  maxWidth: '200px'
                }}
              />
            </div>
            
            <div className="mt-4">
              <div 
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center mb-2"
              >
                <div 
                  className="sm:col-span-3 text-sm"
                  style={{ color: currentColors.textSecondary }}
                >
                  Percentile selector:
                </div>
                <div className="sm:col-span-7 flex items-center gap-2">
                  <input
                    type="range"
                    value={sliderValue}
                    onChange={handleSliderChange}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{ 
                      backgroundColor: currentColors.sliderRail,
                      // Custom styling for the thumb and track
                      background: `linear-gradient(to right, ${currentColors.sliderTrack} 0%, ${currentColors.sliderTrack} ${sliderValue}%, ${currentColors.sliderRail} ${sliderValue}%, ${currentColors.sliderRail} 100%)`
                    }}
                    min="0"
                    max="100"
                    step="1"
                  />
                  <span 
                    className="text-xs"
                    style={{ color: currentColors.text }}
                  >
                    P{sliderValue}
                  </span>
                </div>
                <div 
                  className="sm:col-span-2 text-sm font-medium text-right"
                  style={{ color: currentColors.text }}
                >
                  {percentileInfo.value !== null ? 
                    formatCurrency(percentileInfo.value) : ''}
                </div>
              </div>
              
              <div 
                className="text-xs"
                style={{ color: currentColors.textSecondary }}
              >
                At the {sliderValue}th percentile, the {metricName.toLowerCase()} is {
                  percentileInfo.value !== null ? formatCurrency(percentileInfo.value) : ''
                }
              </div>
            </div>
          </>
        ) : (
          <div 
            className="flex flex-col items-center justify-center py-12 text-center"
            style={{ color: currentColors.textSecondary }}
          >
            <BarChart2 
              size={40}
              className="mb-4 opacity-40"
            />
            <div className="mb-1 font-medium" style={{ color: currentColors.text }}>
              No Simulation Data Available
            </div>
            <div className="text-sm mb-4">
              Run the Monte Carlo simulation to view probability distribution
            </div>
            <button
              className="px-4 py-2 rounded text-sm font-medium flex items-center gap-2"
              style={{ 
                backgroundColor: currentColors.honoluluBlue,
                color: currentColors.buttonText
              }}
              onClick={() => window.location.href = '#simulation'}
            >
              <RefreshCw size={16} />
              Run Simulation
            </button>
          </div>
        )}
        
        {/* Network/device optimization notice */}
        {adaptive && data && data.length > 0 && detailLevel !== 'high' && (
          <div 
            className="mt-4 p-2 text-center text-xs border-t"
            style={{ 
              borderColor: currentColors.border,
              color: currentColors.textSecondary
            }}
          >
            <div className="flex items-center justify-center gap-1">
              <AlertCircle size={12} style={{ color: currentColors.sun }} />
              <span>
                {detailLevel === 'low' 
                  ? 'Simplified view optimized for current network/device conditions' 
                  : 'Medium-detail view for current conditions'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedVietnamMonteCarloProbabilityDistribution;