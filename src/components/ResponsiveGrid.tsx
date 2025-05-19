import React from 'react';

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function ResponsiveGrid({
  children,
  columns = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 'md',
  className = '',
}: ResponsiveGridProps) {
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2 md:gap-3',
    md: 'gap-4 md:gap-6',
    lg: 'gap-6 md:gap-8',
    xl: 'gap-8 md:gap-10',
  };

  // Static column classes mapping with proper typing
  const columnClasses: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    12: 'grid-cols-12',
  };

  const getColumnClasses = () => {
    const classes = ['grid'];
    
    if (columns.xs && columnClasses[columns.xs]) {
      classes.push(columnClasses[columns.xs]);
    }
    if (columns.sm && columnClasses[columns.sm]) {
      classes.push(`sm:${columnClasses[columns.sm]}`);
    }
    if (columns.md && columnClasses[columns.md]) {
      classes.push(`md:${columnClasses[columns.md]}`);
    }
    if (columns.lg && columnClasses[columns.lg]) {
      classes.push(`lg:${columnClasses[columns.lg]}`);
    }
    if (columns.xl && columnClasses[columns.xl]) {
      classes.push(`xl:${columnClasses[columns.xl]}`);
    }
    
    return classes.join(' ');
  };

  return (
    <div className={`${getColumnClasses()} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
}

// Responsive Card Grid with automatic sizing
interface CardGridProps {
  children: React.ReactNode;
  minCardWidth?: number;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CardGrid({
  children,
  minCardWidth = 280,
  gap = 'md',
  className = '',
}: CardGridProps) {
  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4 md:gap-6',
    lg: 'gap-6 md:gap-8',
  };

  return (
    <div
      className={`grid ${gapClasses[gap]} ${className}`}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${minCardWidth}px, 1fr))`,
      }}
    >
      {children}
    </div>
  );
}

// Masonry Layout for varied content heights
interface MasonryGridProps {
  children: React.ReactNode;
  columnConfig?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
  gap?: number;
  className?: string;
}

export function MasonryGrid({
  children,
  columnConfig = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 16,
  className = '',
}: MasonryGridProps) {
  const [columnCount, setColumnCount] = React.useState(1);

  React.useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width >= 1024 && columnConfig.lg) setColumnCount(columnConfig.lg);
      else if (width >= 768 && columnConfig.md) setColumnCount(columnConfig.md);
      else if (width >= 640 && columnConfig.sm) setColumnCount(columnConfig.sm);
      else setColumnCount(columnConfig.xs || 1);
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [columnConfig]);

  const columnWrapperStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
    gap: `${gap}px`,
  };

  const columnStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: `${gap}px`,
  };

  // Distribute children into columns
  const childArray = React.Children.toArray(children);
  const columnArray: React.ReactNode[][] = Array.from({ length: columnCount }, () => []);

  childArray.forEach((child, index) => {
    columnArray[index % columnCount].push(child);
  });

  return (
    <div className={className} style={columnWrapperStyle}>
      {columnArray.map((column, idx) => (
        <div key={idx} style={columnStyle}>
          {column}
        </div>
      ))}
    </div>
  );
}

// Responsive container with max-width constraints
interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: boolean;
  className?: string;
}

export function ResponsiveContainer({
  children,
  maxWidth = 'xl',
  padding = true,
  className = '',
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
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