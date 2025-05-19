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

interface ResponsiveTableProps<T = TableRow> {
  data: T[];
  columns: Column<T>[];
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  className?: string;
}

export default function ResponsiveTable<T extends TableRow = TableRow>({
  data,
  columns,
  onSort,
  sortKey,
  sortDirection,
  className = '',
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

  return (
    <div className={className}>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {data.map((row, idx) => (
          <div
            key={idx}
            className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
          >
            {/* Main row - always visible */}
            <div
              className="p-4 flex items-center justify-between cursor-pointer touch-manipulation"
              onClick={() => toggleExpanded(idx)}
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900 mb-1">
                  {columns[0].renderCell 
                    ? columns[0].renderCell(row[columns[0].key], row)
                    : formatValue(row[columns[0].key], columns[0].type)
                  }
                </div>
                {columns.length > 1 && (
                  <div className="text-sm text-gray-600">
                    {columns[1].label}: {
                      columns[1].renderCell 
                        ? columns[1].renderCell(row[columns[1].key], row)
                        : formatValue(row[columns[1].key], columns[1].type)
                    }
                  </div>
                )}
              </div>
              <ChevronRight
                className={`w-5 h-5 text-gray-400 transform transition-transform ${
                  expandedRows.has(idx) ? 'rotate-90' : ''
                }`}
              />
            </div>
            
            {/* Expanded details */}
            {expandedRows.has(idx) && (
              <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                {columns.slice(2).map(col => (
                  <div key={col.key} className="flex justify-between py-2">
                    <span className="text-sm font-medium text-gray-600">
                      {col.label}:
                    </span>
                    <span className="text-sm text-gray-900">
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
        ))}
      </div>
      
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    col.sortable ? 'cursor-pointer hover:text-gray-700' : ''
                  }`}
                  onClick={() => col.sortable && onSort?.(col.key, sortDirection === 'asc' ? 'desc' : 'asc')}
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
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                {columns.map(col => (
                  <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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