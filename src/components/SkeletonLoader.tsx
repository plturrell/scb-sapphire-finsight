import React from 'react';

export interface SkeletonLoaderProps {
  type?: 'search' | 'news' | 'card' | 'text';
  count?: number;
  width?: string;
  height?: string;
  className?: string;
}

export default function SkeletonLoader({ 
  type = 'text', 
  count = 1, 
  width, 
  height,
  className = ''
}: SkeletonLoaderProps) {
  const baseClass = 'animate-pulse bg-gray-200 rounded relative overflow-hidden';
  
  // Add shimmering effect
  const shimmerClass = 'after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:-translate-x-full after:animate-shimmer';
  
  const getStyleByType = () => {
    switch (type) {
      case 'search':
        return 'h-16 mb-2 flex items-center';
      case 'news':
        return 'h-24 mb-3';
      case 'card':
        return 'h-32 mb-4';
      case 'text':
      default:
        return 'h-4 mb-2';
    }
  };

  const renderSkeleton = () => {
    switch (type) {
      case 'search':
        return (
          <div data-testid="skeleton-loader" className={`${baseClass} ${shimmerClass} ${getStyleByType()} ${className}`} style={{ width, height }}>
            <div className="flex items-start p-3 gap-3 w-full">
              <div data-testid="skeleton-circle" className="rounded-full bg-gray-300 h-8 w-8 flex-shrink-0"></div>
              <div className="flex-1">
                <div data-testid="skeleton-line" className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div data-testid="skeleton-line" className="h-3 bg-gray-300 rounded w-1/2 mb-1"></div>
                <div data-testid="skeleton-line" className="h-3 bg-gray-300 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        );
      
      case 'news':
        return (
          <div data-testid="skeleton-loader" className={`${baseClass} ${shimmerClass} ${getStyleByType()} ${className}`} style={{ width, height }}>
            <div className="flex flex-col p-3 h-full">
              <div data-testid="skeleton-line" className="h-5 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div data-testid="skeleton-line" className="h-3 bg-gray-300 rounded w-full mb-1"></div>
              <div data-testid="skeleton-line" className="h-3 bg-gray-300 rounded w-5/6 mb-3"></div>
              <div className="flex justify-between mt-auto">
                <div data-testid="skeleton-line" className="h-3 bg-gray-300 rounded w-1/4"></div>
                <div data-testid="skeleton-line" className="h-3 bg-gray-300 rounded w-1/6"></div>
              </div>
            </div>
          </div>
        );
      
      case 'card':
        return (
          <div data-testid="skeleton-loader" className={`${baseClass} ${shimmerClass} ${getStyleByType()} ${className}`} style={{ width, height }}>
            <div data-testid="skeleton-header" className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div data-testid="skeleton-line" className="h-4 bg-gray-300 rounded w-full"></div>
              <div data-testid="skeleton-line" className="h-4 bg-gray-300 rounded w-5/6"></div>
            </div>
          </div>
        );
      
      case 'text':
      default:
        return (
          <div 
            data-testid="skeleton-loader"
            className={`${baseClass} ${shimmerClass} ${getStyleByType()} ${className}`} 
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