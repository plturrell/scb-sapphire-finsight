import React, { useRef, useEffect, useState } from 'react';
import { Maximize2, Download, RefreshCw } from 'lucide-react';
import TouchButton from './TouchButton';

interface ResponsiveChartProps {
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
}

export default function ResponsiveChart({
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
}: ResponsiveChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Calculate height based on aspect ratio
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
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {(title || controls) && (
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
              {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>
            
            {controls && (
              <div className="flex items-center gap-2">
                {onRefresh && (
                  <TouchButton
                    variant="ghost"
                    size="sm"
                    onClick={onRefresh}
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                    aria-label="Refresh chart"
                  >
                    <span className="hidden sm:inline">Refresh</span>
                  </TouchButton>
                )}
                
                {onExport && (
                  <TouchButton
                    variant="ghost"
                    size="sm"
                    onClick={onExport}
                    leftIcon={<Download className="w-4 h-4" />}
                    aria-label="Export chart"
                  >
                    <span className="hidden sm:inline">Export</span>
                  </TouchButton>
                )}
                
                <TouchButton
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  leftIcon={<Maximize2 className="w-4 h-4" />}
                  aria-label="Toggle fullscreen"
                >
                  <span className="hidden sm:inline">Fullscreen</span>
                </TouchButton>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div
        ref={containerRef}
        className={`relative ${aspectRatio === 'auto' ? '' : 'overflow-hidden'}`}
        style={{
          height: aspectRatio === 'auto' ? 'auto' : `${dimensions.height}px`,
          minHeight: minHeight ? `${minHeight}px` : undefined,
          maxHeight: maxHeight ? `${maxHeight}px` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Wrapper for common chart libraries with responsive handling
interface ChartWrapperProps {
  children: (dimensions: { width: number; height: number }) => React.ReactNode;
  className?: string;
}

export function ChartWrapper({ children, className = '' }: ChartWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
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
  }, []);

  return (
    <div ref={containerRef} className={`w-full h-full ${className}`}>
      {dimensions.width > 0 && dimensions.height > 0 && children(dimensions)}
    </div>
  );
}

// Mobile-optimized tooltip
interface MobileTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function MobileTooltip({
  content,
  children,
  position = 'top',
  className = '',
}: MobileTooltipProps) {
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
        onTouchEnd={() => setTimeout(() => setIsVisible(false), 1000)}
        className="cursor-help"
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          className={`
            absolute z-50 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg
            shadow-lg whitespace-nowrap
            ${positionClasses[position]}
            ${className}
          `}
        >
          {content}
          <div
            className={`
              absolute w-0 h-0 border-transparent
              ${position === 'top' ? 'border-t-gray-900 border-t-8 border-x-8 top-full left-1/2 -translate-x-1/2' : ''}
              ${position === 'bottom' ? 'border-b-gray-900 border-b-8 border-x-8 bottom-full left-1/2 -translate-x-1/2' : ''}
              ${position === 'left' ? 'border-l-gray-900 border-l-8 border-y-8 left-full top-1/2 -translate-y-1/2' : ''}
              ${position === 'right' ? 'border-r-gray-900 border-r-8 border-y-8 right-full top-1/2 -translate-y-1/2' : ''}
            `}
          />
        </div>
      )}
    </div>
  );
}