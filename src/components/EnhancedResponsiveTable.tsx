import React from 'react';
import { ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';

interface TableRow {
  [key: string]: any;
}

interface Column<T = TableRow> {
  key: keyof T | string;
  label: string;
  type?: 'text' | 'number' | 'currency' | 'percentage' | 'date';
  sortable?: boolean;
  renderCell?: (value: any, row: T) => React.ReactNode;
}

interface EnhancedResponsiveTableProps<T = TableRow> {
  data: T[];
  columns: Column<T>[];
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  className?: string;
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
}

export default function EnhancedResponsiveTable<T extends TableRow = TableRow>({
  data,
  columns,
  onSort,
  sortKey,
  sortDirection,
  className = '',
  title,
  subtitle,
  showSearch = false,
}: EnhancedResponsiveTableProps<T>) {
  const [expandedRows, setExpandedRows] = React.useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = React.useState('');

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

  // Filter data based on search term
  const filteredData = searchTerm.trim() === '' 
    ? data 
    : data.filter(row => {
        return columns.some(col => {
          const value = row[col.key];
          if (value == null) return false;
          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        });
      });

  return (
    <div className={`fiori-tile ${className}`}>
      {/* Table Header with Title, Subtitle and Search */}
      {(title || subtitle || showSearch) && (
        <div className="px-4 py-3 border-b border-[rgb(var(--scb-border))]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <div>
              {title && <h3 className="text-base font-medium text-[rgb(var(--scb-dark-gray))]">{title}</h3>}
              {subtitle && <p className="text-sm text-[rgb(var(--scb-dark-gray))] opacity-80">{subtitle}</p>}
            </div>
            {showSearch && (
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="fiori-input py-2 pl-3 pr-10 w-full text-sm"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[rgb(var(--scb-dark-gray))]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Card View */}
      <div className="md:hidden space-y-0">
        {filteredData.length === 0 ? (
          <div className="p-6 text-center text-[rgb(var(--scb-dark-gray))]">
            No data available
          </div>
        ) : (
          filteredData.map((row, idx) => (
            <div
              key={idx}
              className="border-b border-[rgb(var(--scb-border))] last:border-b-0 overflow-hidden"
            >
              {/* Main row - always visible */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer touch-manipulation"
                onClick={() => toggleExpanded(idx)}
              >
                <div className="flex-1">
                  <div className="font-medium text-[rgb(var(--scb-honolulu-blue))] mb-1">
                    {columns[0].renderCell 
                      ? columns[0].renderCell(row[columns[0].key], row)
                      : formatValue(row[columns[0].key], columns[0].type)
                    }
                  </div>
                  {columns.length > 1 && (
                    <div className="text-sm text-[rgb(var(--scb-dark-gray))]">
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
                <div className="px-4 pb-4 pt-2 border-t border-[rgb(var(--scb-border))] bg-[rgba(var(--scb-light-gray),0.5)]">
                  {columns.slice(2).map(col => (
                    <div key={col.key} className="flex justify-between py-2">
                      <span className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">
                        {col.label}:
                      </span>
                      <span className="text-sm text-[rgb(var(--scb-dark-gray))]">
                        {col.renderCell 
                          ? col.renderCell(row[col.key], row)
                          : formatValue(row[col.key], col.type)
                        }
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full sapui5-table">
          <thead className="bg-[rgba(var(--scb-light-gray),0.7)] border-b border-[rgb(var(--scb-border))]">
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-[rgb(var(--scb-dark-gray))] uppercase tracking-wider ${
                    col.sortable ? 'cursor-pointer hover:text-[rgb(var(--scb-honolulu-blue))]' : ''
                  }`}
                  onClick={() => col.sortable && onSort?.(col.key as string, sortDirection === 'asc' ? 'desc' : 'asc')}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[rgb(var(--scb-border))]">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center text-[rgb(var(--scb-dark-gray))]">
                  No data available
                </td>
              </tr>
            ) : (
              filteredData.map((row, idx) => (
                <tr key={idx} className="hover:bg-[rgba(var(--scb-light-gray),0.3)] transition-colors">
                  {columns.map(col => (
                    <td key={col.key as string} className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(var(--scb-dark-gray))]">
                      {col.renderCell 
                        ? col.renderCell(row[col.key], row)
                        : formatValue(row[col.key], col.type)
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}