import React, { useState, useEffect, useRef } from 'react';
import useApplePhysics from '../../hooks/useApplePhysics';
import useSafeArea from '../../hooks/useSafeArea';
import { haptics } from '../../lib/haptics';

interface EnhancedIOSDataVisualizationProps {
  data: any[];
  type?: 'bar' | 'line' | 'area' | 'pie' | 'donut' | 'summary';
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  colors?: string[];
  enableInteraction?: boolean;
  enableHaptics?: boolean;
  accessibilityLabel?: string;
  className?: string;
  onDataPointSelect?: (point: any, index: number) => void;
  renderChart: (
    dimensions: ChartDimensions, 
    interactionState: ChartInteractionState,
    helperFunctions: ChartHelperFunctions
  ) => React.ReactNode;
  renderLegend?: (isActive: boolean) => React.ReactNode;
  renderCardContent?: () => React.ReactNode;
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
}

export interface ChartInteractionState {
  activeIndex: number | null;
  isExpanded: boolean;
  isPanning: boolean;
  isPinching: boolean;
  zoomLevel: number;
  isPortrait: boolean;
  hasFocus: boolean;
  isRevealed: boolean;
}

export interface ChartHelperFunctions {
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (value: number, currency?: string) => string;
  formatPercentage: (value: number, decimals?: number) => string;
  formatDate: (date: Date | string | number) => string;
  triggerHaptic: (type: 'selection' | 'light' | 'medium' | 'heavy') => void;
  toggleExpand: () => void;
}

/**
 * Enhanced data visualization component optimized for iOS devices
 * Implements Apple's Human Interface Guidelines for data visualization
 */
const EnhancedIOSDataVisualization: React.FC<EnhancedIOSDataVisualizationProps> = ({
  data,
  type = 'bar',
  title,
  subtitle,
  width,
  height = 300,
  colors = ['#0A84FF', '#30D158', '#FF9F0A', '#FF375F', '#5E5CE6'],
  enableInteraction = true,
  enableHaptics = true,
  accessibilityLabel,
  className = '',
  onDataPointSelect,
  renderChart,
  renderLegend,
  renderCardContent
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState<ChartDimensions>({
    width: width || 300,
    height: height || 300,
    margin: { top: 20, right: 20, bottom: 30, left: 40 },
    innerWidth: (width || 300) - 60,
    innerHeight: (height || 300) - 50
  });
  
  const [interactionState, setInteractionState] = useState<ChartInteractionState>({
    activeIndex: null,
    isExpanded: false,
    isPanning: false,
    isPinching: false,
    zoomLevel: 1,
    isPortrait: typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : true,
    hasFocus: true,
    isRevealed: false
  });
  
  const { spring } = useApplePhysics({ motion: 'standard' });
  const { safeArea } = useSafeArea();
  
  // Initialize with reveal animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setInteractionState(prev => ({ ...prev, isRevealed: true }));
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Update dimensions when container resizes
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      const container = containerRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const containerWidth = width || rect.width;
      const containerHeight = height || rect.height;
      
      // iOS-optimized margins
      const margin = { top: 20, right: 20, bottom: 30, left: 40 };
      
      setContainerDimensions({
        width: containerWidth,
        height: containerHeight,
        margin,
        innerWidth: containerWidth - margin.left - margin.right,
        innerHeight: containerHeight - margin.top - margin.bottom
      });
      
      // Update orientation
      setInteractionState(prev => ({
        ...prev,
        isPortrait: window.innerHeight > window.innerWidth
      }));
    };
    
    // Set initial dimensions
    updateDimensions();
    
    // Setup ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });
    
    resizeObserver.observe(containerRef.current);
    
    // Handle orientation changes
    const handleOrientationChange = () => {
      updateDimensions();
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [width, height]);
  
  // Format helpers
  const helperFunctions: ChartHelperFunctions = {
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) => {
      return new Intl.NumberFormat('en-US', options).format(value);
    },
    
    formatCurrency: (value: number, currency = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    },
    
    formatPercentage: (value: number, decimals = 1) => {
      return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(value / 100);
    },
    
    formatDate: (date: Date | string | number) => {
      const dateObj = new Date(date);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric'
      }).format(dateObj);
    },
    
    triggerHaptic: (type: 'selection' | 'light' | 'medium' | 'heavy') => {
      if (!enableHaptics) return;
      
      switch (type) {
        case 'selection':
          haptics.selection();
          break;
        case 'light':
          haptics.light();
          break;
        case 'medium':
          haptics.medium();
          break;
        case 'heavy':
          haptics.heavy();
          break;
      }
    },
    
    toggleExpand: () => {
      setInteractionState(prev => {
        const newState = { ...prev, isExpanded: !prev.isExpanded };
        
        if (newState.isExpanded) {
          helperFunctions.triggerHaptic('medium');
        } else {
          helperFunctions.triggerHaptic('light');
        }
        
        return newState;
      });
    }
  };
  
  // Handle data point selection
  const handleDataPointSelect = (point: any, index: number) => {
    setInteractionState(prev => ({
      ...prev,
      activeIndex: prev.activeIndex === index ? null : index
    }));
    
    if (enableHaptics) {
      haptics.selection();
    }
    
    if (onDataPointSelect) {
      onDataPointSelect(point, index);
    }
  };
  
  // Handle touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    // Check if multi-touch (pinch)
    if (e.touches.length === 2) {
      setInteractionState(prev => ({ ...prev, isPinching: true }));
    } else if (e.touches.length === 1) {
      setInteractionState(prev => ({ ...prev, isPanning: true }));
    }
  };
  
  const handleTouchEnd = () => {
    setInteractionState(prev => ({
      ...prev,
      isPinching: false,
      isPanning: false
    }));
  };
  
  // Transition properties for iOS-style animations
  const getTransitionStyle = () => {
    const { damping, stiffness } = spring;
    
    return {
      transition: `all ${damping}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
      opacity: interactionState.isRevealed ? 1 : 0,
      transform: interactionState.isRevealed 
        ? 'translateY(0) scale(1)' 
        : 'translateY(10px) scale(0.98)'
    };
  };
  
  // Animation styles for expanded state
  const getExpandedStyle = () => {
    if (!interactionState.isExpanded) return {};
    
    const { damping, stiffness } = spring;
    
    return {
      position: 'fixed' as const,
      top: `${safeArea.top}px`,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 100,
      backgroundColor: 'var(--card-bg, white)',
      transition: `all ${damping}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
      height: '100%',
      width: '100%',
      maxHeight: '100vh',
    };
  };
  
  // Render header with title and subtitle
  const renderHeader = () => {
    if (!title && !subtitle) return null;
    
    return (
      <div className="flex flex-col mb-4">
        {title && (
          <h3 className="text-base font-medium text-gray-900 dark:text-white">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        )}
      </div>
    );
  };
  
  // Render expand/collapse button
  const renderExpandButton = () => {
    if (!enableInteraction) return null;
    
    return (
      <button
        type="button"
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
        onClick={helperFunctions.toggleExpand}
        aria-label={interactionState.isExpanded ? 'Collapse chart' : 'Expand chart'}
      >
        <svg 
          width="14" 
          height="14" 
          viewBox="0 0 14 14" 
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-500 dark:text-gray-400"
        >
          {interactionState.isExpanded ? (
            <>
              <path d="M1 13L13 1M1 1L13 13" />
            </>
          ) : (
            <>
              <path d="M1 7H13M7 1V13" />
            </>
          )}
        </svg>
      </button>
    );
  };
  
  return (
    <div
      ref={containerRef}
      className={`
        relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-sm
        ${interactionState.isExpanded ? 'expanded-chart' : ''}
        ${className}
      `}
      style={{
        ...getTransitionStyle(),
        ...getExpandedStyle(),
        height: interactionState.isExpanded ? '100%' : height,
        '--card-bg': 'var(--bg-color, white)'
      } as React.CSSProperties}
      aria-label={accessibilityLabel || title}
      role="img"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      data-chart-type={type}
    >
      <div className={`
        chart-container p-4
        ${interactionState.isExpanded ? 'h-full flex flex-col' : ''}
      `}>
        {renderExpandButton()}
        {renderHeader()}
        
        <div className={`
          relative 
          ${interactionState.isExpanded ? 'flex-1' : ''}
        `}>
          {renderChart(
            containerDimensions, 
            interactionState,
            helperFunctions
          )}
        </div>
        
        {renderLegend && (
          <div className={`
            chart-legend mt-4
            ${interactionState.isExpanded ? 'border-t border-gray-200 dark:border-gray-700 pt-3' : ''}
          `}>
            {renderLegend(interactionState.activeIndex !== null)}
          </div>
        )}
        
        {renderCardContent && interactionState.isExpanded && (
          <div className="expanded-content mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            {renderCardContent()}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedIOSDataVisualization;