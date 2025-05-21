import React from 'react';
import { ChevronRight, ChevronUp, ChevronDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';

interface TableRow {
  [key: string]: any;
}

interface Column<T = TableRow> {
  key: keyof T | string;
  label: string;
  type?: 'text' | 'number' | 'currency' | 'percentage' | 'date';
  sortable?: boolean;
  renderCell?: (value: any, row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface ResponsiveTableProps<T = TableRow> {
  data: T[];
  columns: Column<T>[];
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  className?: string;
  title?: string;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
}

/**
 * Responsive table component with SCB beautiful styling
 * Provides both desktop and mobile views with sorting, expanding rows, and more
 */
export default function ResponsiveTable<T extends TableRow = TableRow>({
  data,
  columns,
  onSort,
  sortKey,
  sortDirection,
  className = '',
  title,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  rowClassName,
}: ResponsiveTableProps<T>) {
  const [expandedRows, setExpandedRows] = React.useState<Set<number>>(new Set());

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const formatValue = (value: any, type?: string) => {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value);
      case 'percentage':
        return `${(value * 100).toFixed(2)}%`;
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'number':
        return value.toLocaleString();
      default:
        return value;
    }
  };

  const handleRowClick = (row: T, index: number) => {
    // In mobile view, toggle expansion instead of triggering row click
    if (window.innerWidth < 768) {
      toggleExpanded(index);
    } else if (onRowClick) {
      onRowClick(row);
    }
  };

  // Custom alignment classes based on data type and alignment prop
  const getAlignmentClass = (column: Column<T>) => {
    if (column.align) {
      return column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left';
    }
    
    // Default alignment based on data type
    return column.type === 'number' || column.type === 'currency' || column.type === 'percentage' 
      ? 'text-right' 
      : 'text-left';
  };

  // Empty state for the table
  if ((!data || data.length === 0) && !loading) {
    return (
      <div className={`fiori-tile flex flex-col items-center justify-center py-12 ${className}`}>
        <div className="w-16 h-16 rounded-full bg-[rgba(var(--scb-light-gray),0.4)] flex items-center justify-center mb-4">
          <Filter className="w-8 h-8 text-[rgba(var(--scb-dark-gray),0.5)]" />
        </div>
        <p className="text-[rgb(var(--scb-dark-gray))] text-sm">{emptyMessage}</p>
      </div>
    );
  }

  // Loading state for the table
  if (loading) {
    return (
      <div className={`fiori-tile ${className}`}>
        {title && (
          <div className="px-4 py-3 border-b border-[rgb(var(--scb-border))]">
            <h3 className="text-base font-medium text-[rgb(var(--scb-dark-gray))]">{title}</h3>
          </div>
        )}
        <div className="p-8 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-[rgba(var(--scb-light-gray),0.3)] border-t-[rgb(var(--scb-honolulu-blue))] animate-spin mb-4"></div>
          <p className="text-sm text-[rgb(var(--scb-dark-gray))]">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`fiori-tile overflow-hidden ${className}`}>
      {/* Title bar (optional) */}
      {title && (
        <div className="px-4 py-3 border-b border-[rgb(var(--scb-border))]">
          <h3 className="text-base font-medium text-[rgb(var(--scb-dark-gray))]">{title}</h3>
        </div>
      )}
      
      {/* Mobile Card View */}
      <div className="md:hidden">
        {data.map((row, idx) => (
          <div
            key={idx}
            className={`border-b border-[rgb(var(--scb-border))] overflow-hidden ${
              rowClassName ? rowClassName(row) : ''
            }`}
          >
            {/* Main row - always visible */}
            <div
              className="p-4 flex items-center justify-between cursor-pointer touch-manipulation"
              onClick={() => toggleExpanded(idx)}
            >
              <div className="flex-1">
                <div className="font-medium text-[rgb(var(--scb-dark-gray))] mb-1">
                  {columns[0].renderCell 
                    ? columns[0].renderCell(row[columns[0].key], row)
                    : formatValue(row[columns[0].key], columns[0].type)
                  }
                </div>
                {columns.length > 1 && (
                  <div className="text-sm text-[rgba(var(--scb-dark-gray),0.8)]">
                    {columns[1].label}: {
                      columns[1].renderCell 
                        ? columns[1].renderCell(row[columns[1].key], row)
                        : formatValue(row[columns[1].key], columns[1].type)
                    }
                  </div>
                )}
              </div>
              <ChevronRight
                className={`w-5 h-5 text-[rgb(var(--scb-dark-gray))] transform transition-transform ${
                  expandedRows.has(idx) ? 'rotate-90' : ''
                }`}
              />
            </div>
            
            {/* Expanded details */}
            {expandedRows.has(idx) && (
              <div className="px-4 pb-4 pt-2 bg-[rgba(var(--scb-light-gray),0.1)]">
                {columns.slice(2).map(col => (
                  <div key={col.key} className="flex justify-between py-2 border-b border-[rgba(var(--scb-border),0.2)] last:border-0">
                    <span className="text-sm font-medium text-[rgba(var(--scb-dark-gray),0.9)]">
                      {col.label}
                    </span>
                    <span className={`text-sm text-[rgb(var(--scb-dark-gray))] ${getAlignmentClass(col)}`}>
                      {col.renderCell 
                        ? col.renderCell(row[col.key], row)
                        : formatValue(row[col.key], col.type)
                      }
                    </span>
                  </div>
                ))}
                
                {onRowClick && (
                  <div className="mt-3 pt-2">
                    <button
                      className="fiori-btn fiori-btn-secondary text-xs w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRowClick(row);
                      }}
                    >
                      View Details
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[rgba(var(--scb-light-gray),0.3)] border-b border-[rgb(var(--scb-border))]">
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-[rgb(var(--scb-dark-gray))] tracking-wider ${
                    col.sortable ? 'cursor-pointer hover:bg-[rgba(var(--scb-light-gray),0.5)]' : ''
                  } ${col.width ? '' : 'whitespace-nowrap'} ${getAlignmentClass(col)}`}
                  style={col.width ? { width: col.width } : {}}
                  onClick={() => col.sortable && onSort?.(col.key, sortDirection === 'asc' ? 'desc' : 'asc')}
                >
                  <div className="flex items-center gap-1 justify-between">
                    <span>{col.label}</span>
                    {col.sortable && sortKey === col.key && (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-[rgb(var(--scb-honolulu-blue))]" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-[rgb(var(--scb-honolulu-blue))]" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[rgb(var(--scb-border))]">
            {data.map((row, idx) => (
              <tr 
                key={idx} 
                className={`hover:bg-[rgba(var(--scb-light-gray),0.2)] transition-colors ${
                  onRowClick ? 'cursor-pointer' : ''
                } ${rowClassName ? rowClassName(row) : ''}`}
                onClick={() => handleRowClick(row, idx)}
              >
                {columns.map(col => (
                  <td 
                    key={col.key} 
                    className={`px-6 py-4 text-sm text-[rgb(var(--scb-dark-gray))] ${getAlignmentClass(col)}`}
                  >
                    {col.renderCell 
                      ? col.renderCell(row[col.key], row)
                      : formatValue(row[col.key], col.type)
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}