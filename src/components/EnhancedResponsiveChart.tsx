import React, { useRef, useEffect, useState } from 'react';
import { Maximize2, Download, RefreshCw, Info, Sparkles } from 'lucide-react';
import EnhancedTouchButton from './EnhancedTouchButton';
import { EnhancedInlineSpinner } from './EnhancedLoadingSpinner';

interface EnhancedResponsiveChartProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  aspectRatio?: '16:9' | '4:3' | '1:1' | 'auto';
  minHeight?: number;
  maxHeight?: number;
  controls?: boolean;
  onRefresh?: () => void;
  onExport?: () => void;
  className?: string;
  isLoading?: boolean;
  showAIIndicator?: boolean;
  aiInsights?: string;
  containerClassName?: string;
  /**
   * Optional callback when chart is clicked - useful for mobile interactions
   */
  onChartClick?: () => void;
  /**
   * If true, the chart will be wrapped in a tap/hover tooltip showing AI insights
   */
  aiInfoTooltip?: boolean;
  /**
   * Optional error state
   */
  error?: string | null;
}

/**
 * Enhanced Responsive Chart with SCB beautiful styling
 * Container component for any chart with title, controls, and responsive sizing
 */
export default function EnhancedResponsiveChart({
  children,
  title,
  subtitle,
  aspectRatio = '16:9',
  minHeight = 300,
  maxHeight = 600,
  controls = true,
  onRefresh,
  onExport,
  className = '',
  isLoading = false,
  showAIIndicator = false,
  aiInsights,
  containerClassName = '',
  onChartClick,
  aiInfoTooltip = false,
  error = null,
}: EnhancedResponsiveChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAIInfo, setShowAIInfo] = useState(false);

  // Calculate height based on aspect ratio with SCB styling constraints
  const getHeight = (width: number) => {
    if (aspectRatio === 'auto') return 'auto';
    
    const ratios = {
      '16:9': 9 / 16,
      '4:3': 3 / 4,
      '1:1': 1,
    };
    
    const calculatedHeight = width * ratios[aspectRatio];
    
    if (minHeight && calculatedHeight < minHeight) return minHeight;
    if (maxHeight && calculatedHeight > maxHeight) return maxHeight;
    
    return calculatedHeight;
  };

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = getHeight(width);
        setDimensions({ 
          width, 
          height: typeof height === 'number' ? height : containerRef.current.offsetHeight 
        });
      }
    };

    updateDimensions();
    
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [aspectRatio, minHeight, maxHeight]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(err => {
        console.error('Error attempting to exit fullscreen:', err);
      });
      setIsFullscreen(false);
    }
  };

  // Handle ESC to exit fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className={`fiori-tile h-full flex flex-col ${className}`} data-testid="enhanced-responsive-chart">
      {(title || controls) && (
        <div className="px-4 py-3 border-b border-[rgb(var(--scb-border))] flex items-center justify-between">
          <div>
            <div className="flex items-center">
              <h3 className="text-base font-medium text-[rgb(var(--scb-dark-gray))]">{title}</h3>
              {showAIIndicator && (
                <span className="ml-2 inline-flex items-center">
                  <span className="horizon-chip horizon-chip-green text-xs py-0.5 px-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>AI-enhanced</span>
                  </span>
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-80 mt-0.5">{subtitle}</p>}
          </div>
          
          {controls && (
            <div className="flex items-center gap-2">
              {aiInsights && (
                <div className="relative">
                  <button
                    className="p-1.5 rounded-full hover:bg-[rgba(var(--scb-light-gray),0.5)] text-[rgb(var(--scb-dark-gray))] transition-colors"
                    onClick={() => setShowAIInfo(!showAIInfo)}
                    aria-label="Toggle AI insights"
                  >
                    <Sparkles className="w-4 h-4 text-[rgb(var(--scb-american-green))]" />
                  </button>
                  
                  {showAIInfo && (
                    <div className="absolute z-10 right-0 top-full mt-2 w-64 p-3 bg-white rounded-lg shadow-lg border border-[rgb(var(--scb-border))]">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[rgb(var(--scb-american-green))]" />
                        <span className="font-medium text-xs text-[rgb(var(--scb-dark-gray))]">AI INSIGHTS</span>
                      </div>
                      <p className="text-xs text-[rgb(var(--scb-dark-gray))]">{aiInsights}</p>
                    </div>
                  )}
                </div>
              )}
              
              {onRefresh && (
                <button 
                  className="p-1.5 rounded-full hover:bg-[rgba(var(--scb-light-gray),0.5)] text-[rgb(var(--scb-dark-gray))] transition-colors"
                  onClick={onRefresh}
                  disabled={isLoading}
                  aria-label="Refresh chart"
                >
                  {isLoading ? (
                    <EnhancedInlineSpinner size="sm" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </button>
              )}
              
              {onExport && (
                <button
                  className="p-1.5 rounded-full hover:bg-[rgba(var(--scb-light-gray),0.5)] text-[rgb(var(--scb-dark-gray))] transition-colors"
                  onClick={onExport}
                  disabled={isLoading}
                  aria-label="Export chart"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
              
              <button
                className="p-1.5 rounded-full hover:bg-[rgba(var(--scb-light-gray),0.5)] text-[rgb(var(--scb-dark-gray))] transition-colors"
                onClick={toggleFullscreen}
                disabled={isLoading}
                aria-label="Toggle fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
      
      <div
        ref={containerRef}
        className={`relative flex-1 ${aspectRatio === 'auto' ? '' : 'overflow-hidden'} ${containerClassName}`}
        style={{
          height: aspectRatio === 'auto' ? 'auto' : `${dimensions.height}px`,
          minHeight: minHeight ? `${minHeight}px` : undefined,
          maxHeight: maxHeight ? `${maxHeight}px` : undefined,
        }}
        onClick={onChartClick}
      >
        {/* Loading overlay with SCB styling */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 border-2 border-[rgba(var(--scb-honolulu-blue),0.2)] border-t-[rgb(var(--scb-honolulu-blue))] rounded-full animate-spin"></div>
              <p className="text-sm text-[rgb(var(--scb-dark-gray))]">Loading data...</p>
            </div>
          </div>
        )}
        
        {/* Error overlay with SCB styling */}
        {error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="text-center max-w-sm">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[rgba(var(--scb-error),0.1)] flex items-center justify-center">
                <Info className="w-6 h-6 text-[rgb(var(--scb-error))]" />
              </div>
              <p className="text-base font-medium text-[rgb(var(--scb-dark-gray))]">Unable to load chart data</p>
              <p className="text-sm text-[rgb(var(--scb-dark-gray))] mt-1">{error}</p>
              {onRefresh && (
                <EnhancedTouchButton 
                  variant="secondary" 
                  size="sm" 
                  className="mt-4" 
                  onClick={onRefresh}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  Try Again
                </EnhancedTouchButton>
              )}
            </div>
          </div>
        )}
        
        {/* AI insights tooltip wrapper */}
        {aiInfoTooltip && aiInsights ? (
          <EnhancedChartTooltip content={aiInsights}>
            {children}
          </EnhancedChartTooltip>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// Enhanced wrapper component for chart libraries with SCB styling
export interface EnhancedChartWrapperProps {
  children: (dimensions: { width: number; height: number }) => React.ReactNode;
  className?: string;
  onResize?: (dimensions: { width: number; height: number }) => void;
}

export function EnhancedChartWrapper({ 
  children, 
  className = '',
  onResize
}: EnhancedChartWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const newDimensions = {
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        };
        setDimensions(newDimensions);
        onResize?.(newDimensions);
      }
    };

    updateDimensions();
    
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [onResize]);

  return (
    <div ref={containerRef} className={`w-full h-full ${className}`}>
      {dimensions.width > 0 && dimensions.height > 0 && children(dimensions)}
    </div>
  );
}

// Enhanced mobile-optimized tooltip with SCB styling
interface EnhancedMobileTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  showIndicator?: boolean;
}

export function EnhancedMobileTooltip({
  content,
  children,
  position = 'top',
  className = '',
  showIndicator = true,
}: EnhancedMobileTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onTouchStart={() => setIsVisible(true)}
        onTouchEnd={() => setTimeout(() => setIsVisible(false), 1500)}
        className="cursor-help"
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          className={`
            absolute z-50 px-3.5 py-2.5 text-sm bg-white text-[rgb(var(--scb-dark-gray))] 
            rounded-lg border border-[rgb(var(--scb-border))] shadow-lg whitespace-nowrap
            ${positionClasses[position]}
            ${className}
          `}
          role="tooltip"
        >
          {content}
          {showIndicator && (
            <div
              className={`
                absolute w-0 h-0 border-solid border-transparent
                ${position === 'top' ? 'border-t-white border-t-8 border-x-8 -mb-1 bottom-[-16px] left-1/2 -translate-x-1/2 after:content-[""] after:absolute after:border-t-[rgb(var(--scb-border))] after:border-t-[9px] after:border-x-[9px] after:border-b-0 after:border-transparent after:left-[-9px] after:top-[-9px] after:z-[-1]' : ''}
                ${position === 'bottom' ? 'border-b-white border-b-8 border-x-8 -mt-1 top-[-16px] left-1/2 -translate-x-1/2 after:content-[""] after:absolute after:border-b-[rgb(var(--scb-border))] after:border-b-[9px] after:border-x-[9px] after:border-t-0 after:border-transparent after:left-[-9px] after:bottom-[-9px] after:z-[-1]' : ''}
                ${position === 'left' ? 'border-l-white border-l-8 border-y-8 -mr-1 right-[-16px] top-1/2 -translate-y-1/2 after:content-[""] after:absolute after:border-l-[rgb(var(--scb-border))] after:border-l-[9px] after:border-y-[9px] after:border-r-0 after:border-transparent after:right-[8px] after:top-[-9px] after:z-[-1]' : ''}
                ${position === 'right' ? 'border-r-white border-r-8 border-y-8 -ml-1 left-[-16px] top-1/2 -translate-y-1/2 after:content-[""] after:absolute after:border-r-[rgb(var(--scb-border))] after:border-r-[9px] after:border-y-[9px] after:border-l-0 after:border-transparent after:left-[8px] after:top-[-9px] after:z-[-1]' : ''}
              `}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Enhanced AI Insights tooltip for charts
interface EnhancedChartTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
}

export function EnhancedChartTooltip({
  content,
  children
}: EnhancedChartTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div 
      className="relative w-full h-full"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onTouchStart={() => setIsVisible(true)}
      onTouchEnd={() => setTimeout(() => setIsVisible(false), 2000)}
    >
      {children}
      
      {isVisible && (
        <div className="absolute bottom-3 right-3 max-w-xs z-20 bg-white rounded-lg shadow-lg border border-[rgb(var(--scb-border))] p-3 text-sm animate-fadeIn">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[rgb(var(--scb-american-green))]" />
            <span className="font-medium text-xs text-[rgb(var(--scb-dark-gray))]">AI INSIGHTS</span>
          </div>
          <p className="text-xs text-[rgb(var(--scb-dark-gray))]">{content}</p>
        </div>
      )}
    </div>
  );
}