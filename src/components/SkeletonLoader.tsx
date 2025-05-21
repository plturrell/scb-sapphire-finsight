import React from 'react';

export interface SkeletonLoaderProps {
  type?: 'search' | 'news' | 'card' | 'text' | 'metric' | 'chart' | 'table';
  count?: number;
  width?: string;
  height?: string;
  className?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

/**
 * Enhanced Skeleton Loader component with SCB beautiful styling
 * Used for content placeholders during loading
 */
export default function SkeletonLoader({ 
  type = 'text', 
  count = 1, 
  width, 
  height,
  className = '',
  rounded = 'md'
}: SkeletonLoaderProps) {
  // Base class with shimmer effect from globals.css
  const baseClass = 'skeleton relative overflow-hidden';
  
  // Rounded corners mapping
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  };
  
  const getStyleByType = () => {
    switch (type) {
      case 'search':
        return 'h-16 mb-2 flex items-center';
      case 'news':
        return 'h-24 mb-3';
      case 'card':
        return 'h-32 mb-4';
      case 'metric':
        return 'h-24 mb-3';
      case 'chart':
        return 'h-64 mb-4';
      case 'table':
        return 'h-60 mb-4';
      case 'text':
      default:
        return 'h-4 mb-2';
    }
  };

  const renderSkeleton = () => {
    switch (type) {
      case 'search':
        return (
          <div 
            data-testid="skeleton-loader" 
            className={`fiori-tile ${baseClass} ${getStyleByType()} ${className}`} 
            style={{ width, height }}
          >
            <div className="flex items-start p-3 gap-3 w-full">
              <div data-testid="skeleton-circle" className={`${roundedClasses.full} bg-[rgba(var(--scb-light-gray),0.3)] h-8 w-8 flex-shrink-0`}></div>
              <div className="flex-1">
                <div data-testid="skeleton-line" className={`h-4 bg-[rgba(var(--scb-light-gray),0.3)] ${roundedClasses.sm} w-3/4 mb-2`}></div>
                <div data-testid="skeleton-line" className={`h-3 bg-[rgba(var(--scb-light-gray),0.3)] ${roundedClasses.sm} w-1/2 mb-1`}></div>
                <div data-testid="skeleton-line" className={`h-3 bg-[rgba(var(--scb-light-gray),0.3)] ${roundedClasses.sm} w-2/3`}></div>
              </div>
            </div>
          </div>
        );
      
      case 'news':
        return (
          <div 
            data-testid="skeleton-loader" 
            className={`fiori-tile ${baseClass} ${getStyleByType()} ${className}`} 
            style={{ width, height }}
          >
            <div className="flex flex-col p-3 h-full">
              <div data-testid="skeleton-line" className={`h-5 bg-[rgba(var(--scb-light-gray),0.3)] ${roundedClasses.sm} w-3/4 mb-2`}></div>
              <div data-testid="skeleton-line" className={`h-3 bg-[rgba(var(--scb-light-gray),0.3)] ${roundedClasses.sm} w-full mb-1`}></div>
              <div data-testid="skeleton-line" className={`h-3 bg-[rgba(var(--scb-light-gray),0.3)] ${roundedClasses.sm} w-5/6 mb-3`}></div>
              <div className="flex justify-between mt-auto">
                <div data-testid="skeleton-line" className={`h-3 bg-[rgba(var(--scb-light-gray),0.3)] ${roundedClasses.sm} w-1/4`}></div>
                <div data-testid="skeleton-line" className={`h-3 bg-[rgba(var(--scb-light-gray),0.3)] ${roundedClasses.sm} w-1/6`}></div>
              </div>
            </div>
          </div>
        );
      
      case 'card':
        return (
          <div 
            data-testid="skeleton-loader"
            className={`fiori-tile ${baseClass} ${getStyleByType()} ${className}`} 
            style={{ width, height }}
          >
            <div className="p-4">
              <div data-testid="skeleton-header" className={`h-6 bg-[rgba(var(--scb-light-gray),0.3)] ${roundedClasses.sm} w-1/3 mb-4`}></div>
              <div className="space-y-3">
                <div data-testid="skeleton-line" className={`h-4 bg-[rgba(var(--scb-light-gray),0.3)] ${roundedClasses.sm} w-full`}></div>
                <div data-testid="skeleton-line" className={`h-4 bg-[rgba(var(--scb-light-gray),0.3)] ${roundedClasses.sm} w-5/6`}></div>
              </div>
            </div>
          </div>
        );
      
      case 'metric':
        return (
          <div 
            data-testid="skeleton-loader"
            className={`fiori-tile ${baseClass} ${className}`} 
            style={{ width, height }}
          >
            <div className="p-4 flex flex-col h-full">
              <div data-testid="skeleton-header" className={`h-4 bg-[rgba(var(--scb-light-gray),0.3)] ${roundedClasses.sm} w-1/2 mb-3`}></div>
              <div data-testid="skeleton-value" className={`h-8 bg-[rgba(var(--scb-light-gray),0.3)] ${roundedClasses.sm} w-2/3 mb-2`}></div>
              <div className="mt-auto flex items-center">
                <div data-testid="skeleton-badge" className={`h-4 bg-[rgba(var(--scb-light-gray),0.3)] ${roundedClasses.full} w-16`}></div>
              </div>
            </div>
          </div>
        );
      
      case 'chart':
        return (
          <div 
            data-testid="skeleton-loader"
            className={`fiori-tile ${baseClass} ${className}`} 
            style={{ width, height }}
          >
            <div className="p-4 flex flex-col h-full">
              <div data-testid="skeleton-header" className={`h-5 bg-[rgba(var(--scb-light-gray),0.3)] ${roundedClasses.sm} w-1/3 mb-2`}></div>
              <div data-testid="skeleton-subheader" className={`h-4 bg-[rgba(var(--scb-light-gray),0.3)] ${roundedClasses.sm} w-1/2 mb-4`}></div>
              <div className="flex-1 flex items-end">
                <div className="w-full flex items-end justify-between gap-2 h-40">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div
                      key={i}
                      data-testid="skeleton-bar"
                      className={`bg-[rgba(var(--scb-light-gray),0.3)] ${roundedClasses.sm} w-full`}
                      style={{ height: `${20 + Math.random() * 80}%` }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'table':
        return (
          <div 
            data-testid="skeleton-loader"
            className={`fiori-tile ${baseClass} ${className}`}
            style={{ width, height }}
          >
            <div className="p-4 flex flex-col h-full">
              <div data-testid="skeleton-header" className={`h-5 bg-[rgba(var(--scb-light-gray),0.3)] ${roundedClasses.sm} w-1/3 mb-4`}></div>
              <div className="space-y-2">
                <div className="flex gap-3 py-2 border-b border-[rgba(var(--scb-border),0.5)]">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div 
                      key={`header-${i}`}
                      data-testid="skeleton-table-header" 
                      className={`h-4 bg-[rgba(var(--scb-light-gray),0.3)] ${roundedClasses.sm}`}
                      style={{ width: i === 0 ? '40%' : '30%' }}
                    ></div>
                  ))}
                </div>
                {Array.from({ length: 4 }).map((_, rowIdx) => (
                  <div key={`row-${rowIdx}`} className="flex gap-3 py-3">
                    {Array.from({ length: 3 }).map((_, colIdx) => (
                      <div 
                        key={`cell-${rowIdx}-${colIdx}`}
                        data-testid="skeleton-table-cell" 
                        className={`h-4 bg-[rgba(var(--scb-light-gray),0.3)] ${roundedClasses.sm}`}
                        style={{ width: colIdx === 0 ? '40%' : '30%' }}
                      ></div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'text':
      default:
        return (
          <div 
            data-testid="skeleton-loader"
            className={`${baseClass} bg-[rgba(var(--scb-light-gray),0.3)] ${roundedClasses[rounded]} ${getStyleByType()} ${className}`} 
            style={{ width, height }}
          />
        );
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <React.Fragment key={i}>
          {renderSkeleton()}
        </React.Fragment>
      ))}
    </>
  );
}