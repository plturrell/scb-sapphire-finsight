/**
 * Enhanced Responsive Grid System with SCB Beautiful UI
 * A collection of responsive grid components with SCB styling for consistent and beautiful layouts
 */

import React from 'react';
import useNetworkAwareLoading from '../hooks/useNetworkAwareLoading';
import useDeviceCapabilities from '../hooks/useDeviceCapabilities';

// Standard responsive grid
interface EnhancedResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  isAdaptive?: boolean; // Adapts to network conditions
}

export function EnhancedResponsiveGrid({
  children,
  columns = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 'md',
  className = '',
  alignItems = 'stretch',
  isAdaptive = false,
}: EnhancedResponsiveGridProps) {
  const { networkStatus } = useNetworkAwareLoading();
  const { tier } = useDeviceCapabilities();
  
  // Adapt grid based on network conditions if isAdaptive is true
  let adaptedColumns = { ...columns };
  if (isAdaptive) {
    if (networkStatus === 'slow' || tier === 'low') {
      adaptedColumns = {
        xs: 1,
        sm: 1,
        md: 2,
        lg: 2,
        xl: 3,
      };
    } else if (networkStatus === 'medium') {
      adaptedColumns = {
        xs: 1,
        sm: 1,
        md: 2,
        lg: 3,
        xl: 4,
      };
    }
  }

  // SCB Beautiful UI gap classes with consistent spacing
  const gapClasses = {
    none: 'gap-0',
    xs: 'gap-1 md:gap-2',
    sm: 'gap-2 md:gap-3',
    md: 'gap-4 md:gap-6',
    lg: 'gap-6 md:gap-8',
    xl: 'gap-8 md:gap-10',
  };

  // Column classes mapping with SCB Beautiful UI
  const columnClasses: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    12: 'grid-cols-12',
  };

  // Alignment classes
  const alignmentClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const getColumnClasses = () => {
    const classes = ['grid'];
    
    if (adaptedColumns.xs && columnClasses[adaptedColumns.xs]) {
      classes.push(columnClasses[adaptedColumns.xs]);
    }
    if (adaptedColumns.sm && columnClasses[adaptedColumns.sm]) {
      classes.push(`sm:${columnClasses[adaptedColumns.sm]}`);
    }
    if (adaptedColumns.md && columnClasses[adaptedColumns.md]) {
      classes.push(`md:${columnClasses[adaptedColumns.md]}`);
    }
    if (adaptedColumns.lg && columnClasses[adaptedColumns.lg]) {
      classes.push(`lg:${columnClasses[adaptedColumns.lg]}`);
    }
    if (adaptedColumns.xl && columnClasses[adaptedColumns.xl]) {
      classes.push(`xl:${columnClasses[adaptedColumns.xl]}`);
    }
    
    return classes.join(' ');
  };

  return (
    <div 
      className={`
        ${getColumnClasses()} 
        ${gapClasses[gap]}
        ${alignmentClasses[alignItems]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Card Grid Layout with SCB Beautiful UI
interface EnhancedCardGridProps {
  children: React.ReactNode;
  minCardWidth?: number;
  gap?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  isAdaptive?: boolean; // Adapts to network and device capability
}

export function EnhancedCardGrid({
  children,
  minCardWidth = 280,
  gap = 'md',
  className = '',
  isAdaptive = false,
}: EnhancedCardGridProps) {
  const { networkStatus } = useNetworkAwareLoading();
  const { tier } = useDeviceCapabilities();
  
  // Adapt card width based on network and device capability
  let adaptedCardWidth = minCardWidth;
  if (isAdaptive) {
    if (networkStatus === 'slow' || tier === 'low') {
      adaptedCardWidth = Math.max(280, minCardWidth); // Ensure cards are not too small
    } else if (networkStatus === 'medium') {
      adaptedCardWidth = minCardWidth;
    } else {
      adaptedCardWidth = minCardWidth;
    }
  }

  // SCB Beautiful UI gap classes
  const gapClasses = {
    xs: 'gap-1 md:gap-2',
    sm: 'gap-3',
    md: 'gap-4 md:gap-6',
    lg: 'gap-6 md:gap-8',
  };

  return (
    <div
      className={`grid ${gapClasses[gap]} ${className}`}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${adaptedCardWidth}px, 1fr))`,
      }}
    >
      {children}
    </div>
  );
}

// Flex Grid for more complex layouts with SCB Beautiful UI
interface EnhancedFlexGridProps {
  children: React.ReactNode;
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  wrap?: boolean;
  justifyContent?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
}

export function EnhancedFlexGrid({
  children,
  gap = 'md',
  className = '',
  wrap = true,
  justifyContent = 'start',
  alignItems = 'stretch',
}: EnhancedFlexGridProps) {
  // SCB Beautiful UI gap classes
  const gapClasses = {
    none: 'gap-0',
    xs: 'gap-1 md:gap-2',
    sm: 'gap-2 md:gap-3',
    md: 'gap-4 md:gap-6',
    lg: 'gap-6 md:gap-8',
    xl: 'gap-8 md:gap-10',
  };

  // Justify content classes
  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  // Alignment classes
  const alignmentClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  return (
    <div
      className={`
        flex 
        ${wrap ? 'flex-wrap' : 'flex-nowrap'} 
        ${gapClasses[gap]} 
        ${justifyClasses[justifyContent]} 
        ${alignmentClasses[alignItems]} 
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// SCB Beautiful UI Cards Grid for Fiori Tile-like layouts
interface EnhancedTiledGridProps {
  children: React.ReactNode;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
  isAdaptive?: boolean;
}

export function EnhancedTiledGrid({
  children,
  columns = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 'md',
  className = '',
  isAdaptive = false,
}: EnhancedTiledGridProps) {
  const { networkStatus } = useNetworkAwareLoading();
  const { tier } = useDeviceCapabilities();
  
  // Adapt grid based on network conditions if isAdaptive is true
  let adaptedColumns = { ...columns };
  if (isAdaptive) {
    if (networkStatus === 'slow' || tier === 'low') {
      adaptedColumns = {
        xs: 1,
        sm: 1,
        md: 2,
        lg: 3,
      };
    }
  }

  return (
    <EnhancedResponsiveGrid
      columns={adaptedColumns}
      gap={gap}
      className={`fiori-tiles-grid ${className}`}
    >
      {React.Children.map(children, (child) => (
        <div className="fiori-tile h-full">
          {child}
        </div>
      ))}
    </EnhancedResponsiveGrid>
  );
}

// Responsive container with SCB Beautiful UI
interface EnhancedResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: boolean;
  className?: string;
}

export function EnhancedResponsiveContainer({
  children,
  maxWidth = 'xl',
  padding = true,
  className = '',
}: EnhancedResponsiveContainerProps) {
  // SCB Beautiful UI max width classes
  const maxWidthClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  };

  return (
    <div
      className={`
        mx-auto w-full
        ${maxWidthClasses[maxWidth]}
        ${padding ? 'px-4 sm:px-6 lg:px-8' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Grid Item - for explicit sizing control with SCB Beautiful UI
interface EnhancedGridItemProps {
  children: React.ReactNode;
  span?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  className?: string;
}

export function EnhancedGridItem({
  children,
  span = { xs: 1 },
  className = '',
}: EnhancedGridItemProps) {
  // Generate span classes
  const generateSpanClasses = () => {
    const classes = [];
    
    if (span.xs) classes.push(`col-span-${span.xs}`);
    if (span.sm) classes.push(`sm:col-span-${span.sm}`);
    if (span.md) classes.push(`md:col-span-${span.md}`);
    if (span.lg) classes.push(`lg:col-span-${span.lg}`);
    if (span.xl) classes.push(`xl:col-span-${span.xl}`);
    
    return classes.join(' ');
  };

  return (
    <div className={`${generateSpanClasses()} ${className}`}>
      {children}
    </div>
  );
}

// Default export with all grid components
const EnhancedResponsiveGridSystem = {
  Grid: EnhancedResponsiveGrid,
  Card: EnhancedCardGrid,
  Flex: EnhancedFlexGrid,
  Tiled: EnhancedTiledGrid,
  Container: EnhancedResponsiveContainer,
  Item: EnhancedGridItem,
};

export default EnhancedResponsiveGridSystem;