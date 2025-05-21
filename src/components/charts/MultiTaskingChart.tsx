import React, { useState, useEffect, useRef } from 'react';
import useMultiTasking from '../../hooks/useMultiTasking';
import useDragAndDrop from '../../hooks/useDragAndDrop';
import useApplePhysics from '../../hooks/useApplePhysics';

interface MultiTaskingChartProps {
  data: any[];
  width?: number;
  height?: number;
  chartType?: 'bar' | 'line' | 'area' | 'pie' | 'scatter' | 'sankey';
  colors?: string[];
  title?: string;
  subtitle?: string;
  enableInteraction?: boolean;
  enableDragAndDrop?: boolean;
  onDataPointClick?: (point: any, index: number) => void;
  onDragComplete?: (item: any) => void;
  className?: string;
  renderChart: (dimensions: ChartDimensions, interactionState: ChartInteractionState) => React.ReactNode;
  renderLegend?: (isCompact: boolean) => React.ReactNode;
  renderControls?: (isCompact: boolean) => React.ReactNode;
}

export interface ChartDimensions {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  innerWidth: number;
  innerHeight: number;
  hasResized: boolean;
}

export interface ChartInteractionState {
  isCompact: boolean;
  isPinching: boolean;
  isMultiTasking: boolean;
  selectedPoint: number | null;
  zoomLevel: number;
  isDragging: boolean;
  isAnimating: boolean;
}

/**
 * iPad-optimized chart component that adapts to multi-tasking modes
 * Supports Split View, Slide Over, and Stage Manager
 */
const MultiTaskingChart: React.FC<MultiTaskingChartProps> = ({
  data,
  width,
  height,
  chartType = 'line',
  colors = ['#0A84FF', '#30D158', '#FF9F0A', '#FF375F', '#5E5CE6'],
  title,
  subtitle,
  enableInteraction = true,
  enableDragAndDrop = true,
  onDataPointClick,
  onDragComplete,
  className = '',
  renderChart,
  renderLegend,
  renderControls
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { 
    mode,
    sizeClass,
    isMultiTasking, 
    windowWidth,
    windowHeight,
    hasFocus
  } = useMultiTasking();
  
  const [containerDimensions, setContainerDimensions] = useState<ChartDimensions>({
    width: width || 300,
    height: height || 200,
    margin: { top: 20, right: 20, bottom: 30, left: 40 },
    innerWidth: (width || 300) - 60,
    innerHeight: (height || 200) - 50,
    hasResized: false
  });
  
  const [interactionState, setInteractionState] = useState<ChartInteractionState>({
    isCompact: sizeClass === 'compact',
    isPinching: false,
    isMultiTasking,
    selectedPoint: null,
    zoomLevel: 1,
    isDragging: false,
    isAnimating: false
  });
  
  const { registerDragSource, registerDropTarget } = useDragAndDrop();
  const { springPreset } = useApplePhysics();
  
  // Adapt chart dimensions based on container size and multi-tasking mode
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      const container = containerRef.current;
      if (!container) return;
      
      // Get container dimensions
      const rect = container.getBoundingClientRect();
      const containerWidth = width || rect.width;
      const containerHeight = height || rect.height;
      
      // Adjust margins based on available space
      let margin = { top: 20, right: 20, bottom: 30, left: 40 };
      
      // For compact modes, reduce margins
      if (sizeClass === 'compact' || mode === 'slide-over') {
        margin = { top: 15, right: 15, bottom: 25, left: 30 };
      }
      
      // For larger views, increase margins
      if (sizeClass === 'expanded' && !isMultiTasking) {
        margin = { top: 30, right: 30, bottom: 40, left: 50 };
      }
      
      setContainerDimensions({
        width: containerWidth,
        height: containerHeight,
        margin,
        innerWidth: containerWidth - margin.left - margin.right,
        innerHeight: containerHeight - margin.top - margin.bottom,
        hasResized: true
      });
      
      setInteractionState(prev => ({
        ...prev,
        isCompact: sizeClass === 'compact' || mode === 'slide-over',
        isMultiTasking
      }));
    };
    
    updateDimensions();
    
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [width, height, isMultiTasking, mode, sizeClass, windowWidth, windowHeight]);

  // Configure drag source for chart data points
  const dragSourceProps = enableDragAndDrop 
    ? registerDragSource({
        id: `chart-${title || 'data'}-drag-source`,
        type: 'chart',
        data: {
          chartType,
          title,
          data,
          selectedPoint: interactionState.selectedPoint
        },
        disabled: !enableDragAndDrop || !interactionState.selectedPoint,
        onDragStart: () => {
          setInteractionState(prev => ({ ...prev, isDragging: true }));
        },
        onDragEnd: (dropped) => {
          setInteractionState(prev => ({ ...prev, isDragging: false }));
          if (dropped && onDragComplete && interactionState.selectedPoint !== null) {
            onDragComplete(data[interactionState.selectedPoint]);
          }
        }
      })
    : { ref: () => {}, isDragging: false };

  // Configure drop target for receiving data
  const dropTargetProps = enableDragAndDrop
    ? registerDropTarget({
        id: `chart-${title || 'data'}-drop-target`,
        types: ['data-point', 'chart'],
        disabled: !enableDragAndDrop,
        onDragEnter: () => {
          setInteractionState(prev => ({ ...prev, isAnimating: true }));
        },
        onDragLeave: () => {
          setInteractionState(prev => ({ ...prev, isAnimating: false }));
        },
        onDrop: (item) => {
          setInteractionState(prev => ({ ...prev, isAnimating: false }));
          // Handle dropped data here if needed
        }
      })
    : { ref: () => {}, isOver: false, canDrop: false };

  // Handle data point selection
  const handleDataPointClick = (point: any, index: number) => {
    setInteractionState(prev => ({
      ...prev,
      selectedPoint: prev.selectedPoint === index ? null : index
    }));
    
    if (onDataPointClick) {
      onDataPointClick(point, index);
    }
  };

  // Get animation styles based on current state
  const getAnimationStyle = () => {
    if (!interactionState.isAnimating) return {};
    
    // Apply different animations based on chart type and interaction state
    const { damping, stiffness } = springPreset('gentle');
    
    return {
      transition: `transform ${damping}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
      transform: interactionState.isAnimating ? 'scale(1.02)' : 'scale(1)'
    };
  };

  // Render title and subtitle
  const renderHeader = () => {
    if (!title && !subtitle) return null;
    
    return (
      <div className={`
        chart-header 
        ${interactionState.isCompact ? 'mb-2' : 'mb-4'}
      `}>
        {title && (
          <h3 className={`
            font-medium text-gray-900 dark:text-gray-100
            ${interactionState.isCompact ? 'text-sm' : 'text-base'}
          `}>
            {title}
          </h3>
        )}
        {subtitle && (
          <p className={`
            text-gray-500 dark:text-gray-400
            ${interactionState.isCompact ? 'text-xs' : 'text-sm'}
          `}>
            {subtitle}
          </p>
        )}
      </div>
    );
  };

  return (
    <div 
      ref={(el) => {
        containerRef.current = el;
        // Combine refs from drag and drop
        dragSourceProps.ref(el);
        dropTargetProps.ref(el);
      }}
      className={`
        relative overflow-hidden transition-all
        ${dragSourceProps.isDragging ? 'opacity-70' : 'opacity-100'}
        ${dropTargetProps.isOver ? 'ring-2 ring-blue-500' : ''}
        ${isMultiTasking ? 'multi-tasking' : ''}
        ${mode}
        ${className}
      `}
      style={{
        ...getAnimationStyle(),
        touchAction: 'manipulation',
        pointerEvents: hasFocus ? 'auto' : 'none',
        height
      }}
      data-testid="multi-tasking-chart"
      data-chart-type={chartType}
    >
      {renderHeader()}
      
      <div className="relative chart-container">
        {/* Render the actual chart using the provided render function */}
        {renderChart(containerDimensions, {
          ...interactionState,
          isCompact: interactionState.isCompact,
          isMultiTasking
        })}
      </div>
      
      {/* Conditionally render legend or controls based on available space */}
      <div className={`
        chart-footer
        ${interactionState.isCompact ? 'mt-2 flex-col' : 'mt-4 flex-row'}
        flex items-center
        ${interactionState.isCompact ? 'justify-center' : 'justify-between'}
      `}>
        {renderLegend && renderLegend(interactionState.isCompact)}
        {renderControls && renderControls(interactionState.isCompact)}
      </div>
    </div>
  );
};

export default MultiTaskingChart;