import React, { useRef, useState, useEffect } from 'react';
import * as d3 from 'd3';
import { useDeviceCapabilities } from '../../hooks/useDeviceCapabilities';
import { useGestures } from '../../hooks/useGestures';
import { useApplePhysics } from '../../hooks/useApplePhysics';
import haptics from '../../lib/haptics';
import { useSafeArea } from '../../hooks/useSafeArea';
import { Edit, Trash, Check, X, ZoomIn, ZoomOut, RotateClockwise, Download, Settings } from 'lucide-react';

// Types for annotations created with Apple Pencil
interface PencilAnnotation {
  id: string;
  type: 'freeform' | 'line' | 'arrow' | 'circle' | 'rectangle' | 'highlight' | 'text';
  points: Array<{x: number, y: number, pressure: number, timestamp: number}>;
  color: string;
  width: number;
  opacity: number;
  note?: string;
  bounds?: {x1: number, y1: number, x2: number, y2: number};
  transform?: {scale: number, rotation: number, translateX: number, translateY: number};
  created: Date;
  lastModified: Date;
}

// Chart data format
export interface ChartDataPoint {
  x: number | Date;
  y: number;
  label?: string;
  category?: string;
  color?: string;
}

export interface EnhancedPencilChartProps {
  // Chart data & configuration
  data: ChartDataPoint[];
  width?: number;
  height?: number;
  type?: 'line' | 'bar' | 'area' | 'scatter';
  title?: string;
  subtitle?: string;
  xLabel?: string;
  yLabel?: string;
  
  // Styling options
  color?: string;
  colorScheme?: string[];
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
  
  // Axes options
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  
  // Interactivity
  interactive?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
  
  // Pencil support
  enablePencil?: boolean;
  annotations?: PencilAnnotation[];
  onAnnotationChange?: (annotations: PencilAnnotation[]) => void;
  defaultAnnotationColor?: string;
  defaultAnnotationWidth?: number;
  
  // Specific pencil modes
  pencilMode?: 'draw' | 'annotate' | 'highlight' | 'erase';
  
  // Additional props
  onSaveImage?: (dataUrl: string) => void;
}

/**
 * Enhanced Pencil Chart Component
 * 
 * A charting component with special support for Apple Pencil on iPad
 * Features pressure-sensitive drawing, annotations, and interactive gestures
 */
const EnhancedPencilChart: React.FC<EnhancedPencilChartProps> = ({
  // Chart data & configuration
  data,
  width = 600,
  height = 400,
  type = 'line',
  title,
  subtitle,
  xLabel,
  yLabel,
  
  // Styling options
  color = 'rgb(var(--scb-honolulu-blue))',
  colorScheme,
  className = '',
  theme = 'auto',
  
  // Axes options
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  
  // Interactivity
  interactive = true,
  enableZoom = true,
  enablePan = true,
  
  // Pencil support
  enablePencil = true,
  annotations: initialAnnotations = [],
  onAnnotationChange,
  defaultAnnotationColor = '#FF3B30', // Red (iOS accent color)
  defaultAnnotationWidth = 2,
  
  // Specific pencil modes
  pencilMode = 'draw',
  
  // Additional props
  onSaveImage
}) => {
  // References to DOM elements
  const containerRef = useRef<HTMLDivElement>(null);
  const chartSvgRef = useRef<SVGSVGElement>(null);
  const annotationSvgRef = useRef<SVGSVGElement>(null);
  
  // Device capabilities and platform detection
  const { deviceType, isAppleDevice, prefersColorScheme, isTouchDevice } = useDeviceCapabilities();
  const isIPad = deviceType === 'tablet' && isAppleDevice;
  const effectiveTheme = theme === 'auto' ? prefersColorScheme : theme;
  const physics = useApplePhysics({ motion: 'emphasized' });
  
  // Chart dimensions
  const [chartDimensions, setChartDimensions] = useState({
    width: width,
    height: height, 
    margin: { top: 40, right: 40, bottom: 60, left: 60 }
  });
  
  // Chart state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<'pencil' | 'eraser' | 'select' | 'text' | 'pan'>('pencil');
  const [annotationColor, setAnnotationColor] = useState(defaultAnnotationColor);
  const [annotationWidth, setAnnotationWidth] = useState(defaultAnnotationWidth);
  const [annotations, setAnnotations] = useState<PencilAnnotation[]>(initialAnnotations);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [showToolbar, setShowToolbar] = useState(true);
  const [currentPoints, setCurrentPoints] = useState<Array<{x: number, y: number, pressure: number, timestamp: number}>>([]);
  
  // Transform state for zooming/panning
  const [transform, setTransform] = useState({ 
    scale: 1, 
    translateX: 0, 
    translateY: 0 
  });
  
  // Apple Pencil detection
  const [isUsingPencil, setIsUsingPencil] = useState(false);
  
  // Current annotation in progress (while drawing)
  const currentAnnotationRef = useRef<PencilAnnotation | null>(null);
  
  // Initialize gesture handlers
  const { handlers, state: gestureState, setGestureHandlers } = useGestures({
    enableSwipe: true,
    enableTap: true,
    enableLongPress: true,
    enablePinch: enableZoom,
    enableRotate: false,
    enablePan: enablePan,
    enablePencil: enablePencil
  });
  
  // Set up gesture handlers
  useEffect(() => {
    setGestureHandlers({
      // Track Apple Pencil input
      onPencilInput: (e, state) => {
        if (!enablePencil) return;
        
        setIsUsingPencil(true);
        
        if (currentTool === 'pencil' && isDrawing) {
          // Add point with pressure
          const newPoint = {
            x: state.currentX,
            y: state.currentY,
            pressure: state.pressure || 1, // Default to 1 if pressure not available
            timestamp: Date.now()
          };
          
          setCurrentPoints(prev => [...prev, newPoint]);
        }
      },
      
      // Pan handler
      onPan: (e, state) => {
        if (!enablePan || currentTool !== 'pan') return;
        
        setTransform(prev => ({
          ...prev,
          translateX: prev.translateX + state.deltaX / prev.scale,
          translateY: prev.translateY + state.deltaY / prev.scale
        }));
      },
      
      // Pinch handler for zooming
      onPinch: (e, state) => {
        if (!enableZoom) return;
        
        // Update scale with constraints
        const newScale = Math.min(Math.max(transform.scale * state.scale, 0.5), 5);
        
        setTransform(prev => ({
          ...prev,
          scale: newScale
        }));
      },
      
      // Tap handler for selection
      onTap: (e, state) => {
        if (currentTool === 'select') {
          // Find if we tapped on an annotation
          const annotation = findAnnotationAtPoint(state.currentX, state.currentY);
          setSelectedAnnotation(annotation?.id || null);
        } else if (currentTool === 'eraser') {
          // Erase annotation if tapped
          const annotation = findAnnotationAtPoint(state.currentX, state.currentY);
          if (annotation) {
            removeAnnotation(annotation.id);
            
            // Provide haptic feedback
            if (isIPad) {
              haptics.light();
            }
          }
        }
      }
    });
  }, [isDrawing, currentTool, enablePan, enableZoom, enablePencil, transform.scale]);
  
  // Initialize chart and annotations SVG
  useEffect(() => {
    if (!chartSvgRef.current || !annotationSvgRef.current) return;
    
    // Create the chart
    drawChart();
    
    // Initialize annotation layer
    const annotationSvg = d3.select(annotationSvgRef.current);
    
    // Clear existing content
    annotationSvg.selectAll('*').remove();
    
    // Add a group for annotations
    annotationSvg.append('g')
      .attr('class', 'annotation-layer')
      .attr('transform', `translate(${chartDimensions.margin.left}, ${chartDimensions.margin.top})`);
      
    // Draw existing annotations
    drawAnnotations();
  }, [chartDimensions, data, effectiveTheme]);
  
  // Update annotations when they change
  useEffect(() => {
    drawAnnotations();
    
    // Notify parent component of changes
    if (onAnnotationChange) {
      onAnnotationChange(annotations);
    }
  }, [annotations]);
  
  // Touch event handlers for Apple Pencil drawing
  const handlePointerDown = (e: React.PointerEvent) => {
    // Check if it's Apple Pencil
    const isPencil = e.pointerType === 'pen';
    
    // Only process if pencil mode is active
    if (isPencil && currentTool === 'pencil' && enablePencil) {
      setIsDrawing(true);
      setIsUsingPencil(true);
      
      // Start a new annotation
      currentAnnotationRef.current = {
        id: `annotation-${Date.now()}`,
        type: 'freeform',
        points: [{
          x: e.nativeEvent.offsetX - chartDimensions.margin.left,
          y: e.nativeEvent.offsetY - chartDimensions.margin.top,
          pressure: (e.nativeEvent as any).pressure || 1,
          timestamp: Date.now()
        }],
        color: annotationColor,
        width: annotationWidth,
        opacity: 0.8,
        created: new Date(),
        lastModified: new Date()
      };
      
      // Update current points
      setCurrentPoints([{
        x: e.nativeEvent.offsetX - chartDimensions.margin.left,
        y: e.nativeEvent.offsetY - chartDimensions.margin.top,
        pressure: (e.nativeEvent as any).pressure || 1,
        timestamp: Date.now()
      }]);
      
      // Provide haptic feedback
      if (isIPad) {
        haptics.light();
      }
    }
  };
  
  const handlePointerMove = (e: React.PointerEvent) => {
    // Check if we're drawing with Apple Pencil
    if (isDrawing && currentTool === 'pencil' && enablePencil) {
      // Add point to current annotation
      const newPoint = {
        x: e.nativeEvent.offsetX - chartDimensions.margin.left,
        y: e.nativeEvent.offsetY - chartDimensions.margin.top,
        pressure: (e.nativeEvent as any).pressure || 1,
        timestamp: Date.now()
      };
      
      setCurrentPoints(prev => [...prev, newPoint]);
      
      // Draw the current annotation in progress
      if (annotationSvgRef.current && currentPoints.length > 0) {
        drawCurrentStroke();
      }
    }
  };
  
  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDrawing && currentTool === 'pencil' && enablePencil) {
      // Finalize the annotation
      if (currentAnnotationRef.current && currentPoints.length > 1) {
        // Create bounds for the annotation
        const xs = currentPoints.map(p => p.x);
        const ys = currentPoints.map(p => p.y);
        const bounds = {
          x1: Math.min(...xs),
          y1: Math.min(...ys),
          x2: Math.max(...xs),
          y2: Math.max(...ys)
        };
        
        // Complete the annotation
        const finalAnnotation: PencilAnnotation = {
          ...currentAnnotationRef.current,
          points: [...currentPoints],
          bounds,
          lastModified: new Date()
        };
        
        // Add to annotations
        setAnnotations(prev => [...prev, finalAnnotation]);
      }
      
      // Reset drawing state
      setIsDrawing(false);
      setCurrentPoints([]);
      currentAnnotationRef.current = null;
      
      // Provide haptic feedback
      if (isIPad) {
        haptics.medium();
      }
    }
  };
  
  // Helper function to find an annotation at a point
  const findAnnotationAtPoint = (x: number, y: number): PencilAnnotation | null => {
    // Adjust for margins
    const adjustedX = x - chartDimensions.margin.left;
    const adjustedY = y - chartDimensions.margin.top;
    
    // Search in reverse order (top to bottom in z-index)
    for (let i = annotations.length - 1; i >= 0; i--) {
      const annotation = annotations[i];
      
      // Check if point is within annotation bounds
      if (annotation.bounds) {
        const { x1, y1, x2, y2 } = annotation.bounds;
        
        // For freeform drawings, use a more sophisticated approach
        if (annotation.type === 'freeform') {
          // Check if close to any line segment
          for (let j = 1; j < annotation.points.length; j++) {
            const p1 = annotation.points[j - 1];
            const p2 = annotation.points[j];
            
            // Distance from point to line segment
            const dist = distanceToLineSegment(p1.x, p1.y, p2.x, p2.y, adjustedX, adjustedY);
            
            // Threshold based on line width
            if (dist < annotation.width * 2) {
              return annotation;
            }
          }
        } else {
          // For simple shapes, just check bounds
          if (adjustedX >= x1 && adjustedX <= x2 && adjustedY >= y1 && adjustedY <= y2) {
            return annotation;
          }
        }
      }
    }
    
    return null;
  };
  
  // Calculate distance from point to line segment
  const distanceToLineSegment = (x1: number, y1: number, x2: number, y2: number, px: number, py: number): number => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    
    if (len_sq !== 0) param = dot / len_sq;
    
    let xx, yy;
    
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    
    const dx = px - xx;
    const dy = py - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
  };
  
  // Remove an annotation by ID
  const removeAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
    
    if (selectedAnnotation === id) {
      setSelectedAnnotation(null);
    }
  };
  
  // Clear all annotations
  const clearAllAnnotations = () => {
    setAnnotations([]);
    setSelectedAnnotation(null);
    
    // Provide haptic feedback
    if (isIPad) {
      haptics.medium();
    }
  };
  
  // Draw the main chart
  const drawChart = () => {
    if (!chartSvgRef.current) return;
    
    const svg = d3.select(chartSvgRef.current);
    
    // Clear previous chart
    svg.selectAll('*').remove();
    
    // Set up dimensions
    const { width, height, margin } = chartDimensions;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => typeof d.x === 'number' ? d.x : 0) || 0])
      .range([0, innerWidth]);
      
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.y) || 0])
      .nice()
      .range([innerHeight, 0]);
    
    // If data has Date objects for x, use a time scale
    if (data.length > 0 && data[0].x instanceof Date) {
      const timeScale = d3.scaleTime()
        .domain([
          d3.min(data, d => d.x instanceof Date ? d.x : new Date()) || new Date(),
          d3.max(data, d => d.x instanceof Date ? d.x : new Date()) || new Date()
        ])
        .range([0, innerWidth]);
        
      // Replace xScale with timeScale
      const xScale = timeScale;
    }
    
    // Create axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);
    
    // Render background
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', effectiveTheme === 'dark' ? '#1c1c1e' : '#ffffff');
    
    // Create the main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    // Add grid lines if enabled
    if (showGrid) {
      // Vertical grid lines
      g.append('g')
        .attr('class', 'grid-lines')
        .selectAll('line')
        .data(xScale.ticks())
        .enter()
        .append('line')
        .attr('x1', d => xScale(d))
        .attr('x2', d => xScale(d))
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')
        .attr('stroke-dasharray', '3,3');
        
      // Horizontal grid lines
      g.append('g')
        .attr('class', 'grid-lines')
        .selectAll('line')
        .data(yScale.ticks())
        .enter()
        .append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', d => yScale(d))
        .attr('y2', d => yScale(d))
        .attr('stroke', effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')
        .attr('stroke-dasharray', '3,3');
    }
    
    // Add x-axis
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .style('fill', effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)')
      .style('font-size', '10px');
      
    // Add x-axis label
    if (xLabel) {
      g.append('text')
        .attr('class', 'x-axis-label')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + margin.bottom - 10)
        .attr('text-anchor', 'middle')
        .style('fill', effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)')
        .text(xLabel);
    }
    
    // Add y-axis
    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .selectAll('text')
      .style('fill', effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)')
      .style('font-size', '10px');
      
    // Add y-axis label
    if (yLabel) {
      g.append('text')
        .attr('class', 'y-axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerHeight / 2)
        .attr('y', -margin.left + 15)
        .attr('text-anchor', 'middle')
        .style('fill', effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)')
        .text(yLabel);
    }
    
    // Draw the chart based on type
    if (type === 'line') {
      // Create line generator
      const line = d3.line<ChartDataPoint>()
        .x(d => xScale(typeof d.x === 'number' ? d.x : 0))
        .y(d => yScale(d.y))
        .curve(d3.curveMonotoneX);
        
      // Add line path
      g.append('path')
        .datum(data)
        .attr('class', 'line')
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('d', line);
        
      // Add points
      g.selectAll('.point')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'point')
        .attr('cx', d => xScale(typeof d.x === 'number' ? d.x : 0))
        .attr('cy', d => yScale(d.y))
        .attr('r', 4)
        .attr('fill', color);
    } else if (type === 'bar') {
      // Create bars
      g.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(typeof d.x === 'number' ? d.x : 0) - 10)
        .attr('y', d => yScale(d.y))
        .attr('width', 20)
        .attr('height', d => innerHeight - yScale(d.y))
        .attr('fill', d => d.color || color);
    } else if (type === 'area') {
      // Create area generator
      const area = d3.area<ChartDataPoint>()
        .x(d => xScale(typeof d.x === 'number' ? d.x : 0))
        .y0(innerHeight)
        .y1(d => yScale(d.y))
        .curve(d3.curveMonotoneX);
        
      // Add area path
      g.append('path')
        .datum(data)
        .attr('class', 'area')
        .attr('fill', `${color}40`) // Add transparency
        .attr('stroke', color)
        .attr('stroke-width', 1.5)
        .attr('d', area);
    } else if (type === 'scatter') {
      // Add scatter points
      g.selectAll('.point')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'point')
        .attr('cx', d => xScale(typeof d.x === 'number' ? d.x : 0))
        .attr('cy', d => yScale(d.y))
        .attr('r', 5)
        .attr('fill', d => d.color || color)
        .attr('opacity', 0.7);
    }
    
    // Add chart title
    if (title) {
      svg.append('text')
        .attr('class', 'chart-title')
        .attr('x', width / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .style('fill', effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)')
        .text(title);
    }
    
    // Add chart subtitle
    if (subtitle) {
      svg.append('text')
        .attr('class', 'chart-subtitle')
        .attr('x', width / 2)
        .attr('y', title ? 40 : 20)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)')
        .text(subtitle);
    }
  };
  
  // Draw all saved annotations
  const drawAnnotations = () => {
    if (!annotationSvgRef.current) return;
    
    const svg = d3.select(annotationSvgRef.current);
    const annotationLayer = svg.select('.annotation-layer');
    
    // Clear previous annotations
    annotationLayer.selectAll('.annotation').remove();
    
    // Add each annotation
    annotations.forEach(annotation => {
      if (annotation.type === 'freeform' && annotation.points.length > 1) {
        // Create a line generator for the stroke
        const lineGenerator = d3.line<{x: number, y: number, pressure: number, timestamp: number}>()
          .x(d => d.x)
          .y(d => d.y)
          .curve(d3.curveCatmullRom.alpha(0.5)); // Smooth curve
          
        // Draw the path with pressure-sensitive width
        const group = annotationLayer.append('g')
          .attr('class', 'annotation')
          .attr('data-id', annotation.id)
          .classed('selected', selectedAnnotation === annotation.id);
        
        // Draw the stroke
        group.append('path')
          .attr('d', lineGenerator(annotation.points))
          .attr('fill', 'none')
          .attr('stroke', annotation.color)
          .attr('stroke-width', annotation.width)
          .attr('stroke-opacity', annotation.opacity)
          .attr('stroke-linecap', 'round')
          .attr('stroke-linejoin', 'round');
          
        // If selected, show selection handles
        if (selectedAnnotation === annotation.id && annotation.bounds) {
          const { x1, y1, x2, y2 } = annotation.bounds;
          
          // Add selection rectangle
          group.append('rect')
            .attr('x', x1 - 5)
            .attr('y', y1 - 5)
            .attr('width', x2 - x1 + 10)
            .attr('height', y2 - y1 + 10)
            .attr('fill', 'none')
            .attr('stroke', '#007AFF')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '3,3');
            
          // Add handles
          [
            { x: x1, y: y1 }, // Top-left
            { x: x2, y: y1 }, // Top-right
            { x: x1, y: y2 }, // Bottom-left
            { x: x2, y: y2 }  // Bottom-right
          ].forEach(pos => {
            group.append('circle')
              .attr('cx', pos.x)
              .attr('cy', pos.y)
              .attr('r', 5)
              .attr('fill', '#007AFF')
              .attr('stroke', 'white')
              .attr('stroke-width', 2);
          });
        }
      }
    });
  };
  
  // Draw the current stroke being created
  const drawCurrentStroke = () => {
    if (!annotationSvgRef.current || currentPoints.length < 2) return;
    
    const svg = d3.select(annotationSvgRef.current);
    const annotationLayer = svg.select('.annotation-layer');
    
    // Remove previous current path
    annotationLayer.select('.current-stroke').remove();
    
    // Create a line generator for the stroke
    const lineGenerator = d3.line<{x: number, y: number, pressure: number, timestamp: number}>()
      .x(d => d.x)
      .y(d => d.y)
      .curve(d3.curveCatmullRom.alpha(0.5)); // Smooth curve
      
    // Draw the path
    annotationLayer.append('path')
      .attr('class', 'current-stroke')
      .attr('d', lineGenerator(currentPoints))
      .attr('fill', 'none')
      .attr('stroke', annotationColor)
      .attr('stroke-width', annotationWidth)
      .attr('stroke-opacity', 0.8)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round');
  };
  
  // Save chart as image
  const saveChartAsImage = () => {
    if (!containerRef.current) return;
    
    // Create a canvas element
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Fill background
    ctx.fillStyle = effectiveTheme === 'dark' ? '#1c1c1e' : '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Convert SVGs to images and draw them
    const chartSvg = chartSvgRef.current;
    const annotationSvg = annotationSvgRef.current;
    
    if (!chartSvg || !annotationSvg) return;
    
    // Convert SVG to data URL
    const serializer = new XMLSerializer();
    const chartSvgStr = serializer.serializeToString(chartSvg);
    const annotationSvgStr = serializer.serializeToString(annotationSvg);
    
    // Create image elements
    const chartImg = new Image();
    const annotationImg = new Image();
    
    // When both images are loaded, draw them to canvas
    let imagesLoaded = 0;
    const totalImages = 2;
    
    const drawToCanvas = () => {
      imagesLoaded++;
      if (imagesLoaded === totalImages) {
        // Draw chart first, then annotations on top
        ctx.drawImage(chartImg, 0, 0);
        ctx.drawImage(annotationImg, 0, 0);
        
        // Get data URL
        const dataUrl = canvas.toDataURL('image/png');
        
        // Callback with data URL
        if (onSaveImage) {
          onSaveImage(dataUrl);
        } else {
          // Create a download link
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `${title || 'chart'}-${new Date().toISOString().slice(0, 10)}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      }
    };
    
    // Load chart SVG
    chartImg.onload = drawToCanvas;
    chartImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(chartSvgStr);
    
    // Load annotation SVG
    annotationImg.onload = drawToCanvas;
    annotationImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(annotationSvgStr);
    
    // Provide haptic feedback
    if (isIPad) {
      haptics.medium();
    }
  };
  
  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        width,
        height,
        overflow: 'hidden',
        borderRadius: '8px',
        backgroundColor: effectiveTheme === 'dark' ? '#1c1c1e' : '#ffffff',
        boxShadow: effectiveTheme === 'dark' 
          ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
          : '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Main chart SVG */}
      <svg 
        ref={chartSvgRef} 
        width={width} 
        height={height}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          userSelect: 'none',
          pointerEvents: 'none'
        }}
      />
      
      {/* Annotations SVG with pointer events */}
      <svg 
        ref={annotationSvgRef}
        width={width}
        height={height}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          userSelect: 'none',
          touchAction: 'none'
        }}
        {...handlers}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      
      {/* Toolbar */}
      {showToolbar && (
        <div
          className="absolute top-2 right-2 flex flex-row bg-white/90 dark:bg-black/70 rounded-lg shadow-md backdrop-blur-sm p-1 gap-1"
          style={{
            backgroundColor: effectiveTheme === 'dark' 
              ? 'rgba(28, 28, 30, 0.8)' 
              : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: effectiveTheme === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* Pencil tool */}
          <button
            className={`p-2 rounded-lg ${currentTool === 'pencil' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
            onClick={() => setCurrentTool('pencil')}
            aria-label="Pencil tool"
            style={{
              backgroundColor: currentTool === 'pencil'
                ? effectiveTheme === 'dark' ? 'rgba(10, 132, 255, 0.3)' : 'rgba(0, 122, 255, 0.1)'
                : 'transparent',
              color: currentTool === 'pencil'
                ? effectiveTheme === 'dark' ? 'rgb(10, 132, 255)' : 'rgb(0, 122, 255)'
                : effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'
            }}
          >
            <Edit size={18} />
          </button>
          
          {/* Eraser tool */}
          <button
            className={`p-2 rounded-lg ${currentTool === 'eraser' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
            onClick={() => setCurrentTool('eraser')}
            aria-label="Eraser tool"
            style={{
              backgroundColor: currentTool === 'eraser'
                ? effectiveTheme === 'dark' ? 'rgba(10, 132, 255, 0.3)' : 'rgba(0, 122, 255, 0.1)'
                : 'transparent',
              color: currentTool === 'eraser'
                ? effectiveTheme === 'dark' ? 'rgb(10, 132, 255)' : 'rgb(0, 122, 255)'
                : effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'
            }}
          >
            <Trash size={18} />
          </button>
          
          {/* Select tool */}
          <button
            className={`p-2 rounded-lg ${currentTool === 'select' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
            onClick={() => setCurrentTool('select')}
            aria-label="Select tool"
            style={{
              backgroundColor: currentTool === 'select'
                ? effectiveTheme === 'dark' ? 'rgba(10, 132, 255, 0.3)' : 'rgba(0, 122, 255, 0.1)'
                : 'transparent',
              color: currentTool === 'select'
                ? effectiveTheme === 'dark' ? 'rgb(10, 132, 255)' : 'rgb(0, 122, 255)'
                : effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'
            }}
          >
            <Check size={18} />
          </button>
          
          {/* Pan tool */}
          <button
            className={`p-2 rounded-lg ${currentTool === 'pan' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
            onClick={() => setCurrentTool('pan')}
            aria-label="Pan tool"
            style={{
              backgroundColor: currentTool === 'pan'
                ? effectiveTheme === 'dark' ? 'rgba(10, 132, 255, 0.3)' : 'rgba(0, 122, 255, 0.1)'
                : 'transparent',
              color: currentTool === 'pan'
                ? effectiveTheme === 'dark' ? 'rgb(10, 132, 255)' : 'rgb(0, 122, 255)'
                : effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'
            }}
          >
            <RotateClockwise size={18} />
          </button>
          
          {/* Divider */}
          <div className="w-px h-6 self-center bg-gray-300 dark:bg-gray-700" />
          
          {/* Zoom in */}
          <button
            className="p-2 rounded-lg"
            onClick={() => setTransform(prev => ({ ...prev, scale: prev.scale * 1.2 }))}
            aria-label="Zoom in"
            style={{
              color: effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'
            }}
          >
            <ZoomIn size={18} />
          </button>
          
          {/* Zoom out */}
          <button
            className="p-2 rounded-lg"
            onClick={() => setTransform(prev => ({ ...prev, scale: prev.scale / 1.2 }))}
            aria-label="Zoom out"
            style={{
              color: effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'
            }}
          >
            <ZoomOut size={18} />
          </button>
          
          {/* Divider */}
          <div className="w-px h-6 self-center bg-gray-300 dark:bg-gray-700" />
          
          {/* Save image */}
          <button
            className="p-2 rounded-lg"
            onClick={saveChartAsImage}
            aria-label="Save as image"
            style={{
              color: effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'
            }}
          >
            <Download size={18} />
          </button>
          
          {/* Settings */}
          <button
            className="p-2 rounded-lg"
            onClick={() => {
              // Toggle color picker or annotations panel
            }}
            aria-label="Settings"
            style={{
              color: effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'
            }}
          >
            <Settings size={18} />
          </button>
        </div>
      )}
      
      {/* Color picker popover would go here */}
      
      {/* Apple Pencil info badge */}
      {isUsingPencil && (
        <div
          className="absolute bottom-2 left-2 flex items-center bg-white/90 dark:bg-black/70 rounded-lg px-2 py-1 text-xs shadow-md"
          style={{
            backgroundColor: effectiveTheme === 'dark' 
              ? 'rgba(28, 28, 30, 0.8)' 
              : 'rgba(255, 255, 255, 0.9)',
            color: effectiveTheme === 'dark' ? 'white' : 'black',
            backdropFilter: 'blur(10px)',
            border: effectiveTheme === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.1)'
          }}
        >
          <Edit size={12} className="mr-1" />
          <span>Apple Pencil Active</span>
        </div>
      )}
      
      {/* Transformation debug info */}
      {false && (
        <div className="absolute bottom-2 right-2 text-xs bg-black/70 text-white px-2 py-1 rounded">
          Scale: {transform.scale.toFixed(2)} | 
          X: {transform.translateX.toFixed(0)} | 
          Y: {transform.translateY.toFixed(0)}
        </div>
      )}
    </div>
  );
};

export default EnhancedPencilChart;