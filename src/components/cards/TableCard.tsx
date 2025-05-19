import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Download, Filter, Search } from 'lucide-react';
import DashboardCard, { DashboardCardProps } from './DashboardCard';

interface TableColumn {
  header: string;
  accessor: string;
  type?: 'text' | 'number' | 'percentage' | 'currency' | 'date';
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
  renderCell?: (value: any, row: any) => React.ReactNode;
}

interface TableCardProps extends Omit<DashboardCardProps, 'children'> {
  columns: TableColumn[];
  data: any[];
  pagination?: boolean;
  pageSize?: number;
  searchable?: boolean;
  exportable?: boolean;
  onExportData?: () => void;
  sortable?: boolean;
  filterable?: boolean;
  emptyStateMessage?: string;
  loading?: boolean;
}

/**
 * Table Card Component for SCB Sapphire FinSight dashboard
 * Displays detailed financial data in tabular format with sorting, filtering and pagination
 * Following SCB brand guidelines and SAP Fiori design principles with tabular numbers for financial data
 */
const TableCard: React.FC<TableCardProps> = ({
  columns,
  data,
  pagination = true,
  pageSize = 10,
  searchable = false,
  sortable = true,
  filterable = false,
  emptyStateMessage = 'No data available',
  loading = false,
  onExportData,
  ...cardProps
}) => {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  // Filter and sort data
  const filteredData = React.useMemo(() => {
    let filtered = [...data];
    
    // Apply search term if provided
    if (searchTerm) {
      filtered = filtered.filter(row => {
        return columns.some(column => {
          const value = row[column.accessor];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        });
      });
    }
    
    // Apply filters if any
    if (Object.keys(activeFilters).length > 0) {
      filtered = filtered.filter(row => {
        return Object.entries(activeFilters).every(([key, filterValue]) => {
          if (!filterValue) return true;
          const value = row[key];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
        });
      });
    }
    
    // Apply sorting if a sort column is selected
    if (sortColumn) {
      filtered.sort((a, b) => {
        const valueA = a[sortColumn];
        const valueB = b[sortColumn];
        
        // Handle null/undefined values
        if (valueA === null || valueA === undefined) return sortDirection === 'asc' ? -1 : 1;
        if (valueB === null || valueB === undefined) return sortDirection === 'asc' ? 1 : -1;
        
        // Find column definition to check type
        const column = columns.find(col => col.accessor === sortColumn);
        
        // Sort based on type
        if (column?.type === 'number' || column?.type === 'percentage' || column?.type === 'currency') {
          return sortDirection === 'asc' 
            ? Number(valueA) - Number(valueB)
            : Number(valueB) - Number(valueA);
        } else if (column?.type === 'date') {
          return sortDirection === 'asc'
            ? new Date(valueA).getTime() - new Date(valueB).getTime()
            : new Date(valueB).getTime() - new Date(valueA).getTime();
        } else {
          // Default string sort
          return sortDirection === 'asc'
            ? String(valueA).localeCompare(String(valueB))
            : String(valueB).localeCompare(String(valueA));
        }
      });
    }
    
    return filtered;
  }, [data, searchTerm, sortColumn, sortDirection, activeFilters, columns]);
  
  // Get paginated data
  const paginatedData = React.useMemo(() => {
    if (!pagination) return filteredData;
    const start = page * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize, pagination]);
  
  // Total pages for pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  
  // Format cell based on column type
  const formatCellValue = (value: any, column: TableColumn) => {
    if (value === null || value === undefined) return '-';
    
    if (column.renderCell) {
      return column.renderCell(value, value);
    }
    
    switch (column.type) {
      case 'percentage':
        return `${(Number(value) * 100).toFixed(2)}%`;
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2
        }).format(Number(value));
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'number':
        return new Intl.NumberFormat('en-US').format(Number(value));
      default:
        return String(value);
    }
  };
  
  // Handle sort change
  const handleSort = (column: TableColumn) => {
    if (!sortable || !column.sortable) return;
    
    if (sortColumn === column.accessor) {
      // Toggle direction if already sorting by this column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort column and default to ascending
      setSortColumn(column.accessor);
      setSortDirection('asc');
    }
  };
  
  // Render pagination controls
  const renderPagination = () => {
    if (!pagination || totalPages <= 1) return null;
    
    return (
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-[rgb(var(--scb-border))]">
        <div className="scb-supplementary">
          Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, filteredData.length)} of {filteredData.length} entries
        </div>
        
        <div className="flex items-center">
          <button
            className="p-1 rounded hover:bg-[rgba(var(--scb-honolulu-blue),0.05)] disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </button>
          
          <div className="mx-2 scb-supplementary">
            Page {page + 1} of {totalPages}
          </div>
          
          <button
            className="p-1 rounded hover:bg-[rgba(var(--scb-honolulu-blue),0.05)] disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
          >
            Next
          </button>
        </div>
      </div>
    );
  };
  
  // Additional actions for the card header
  const headerAction = (
    <div className="flex items-center gap-2">
      {searchable && (
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="fiori-input py-1 px-2 text-sm w-40"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Search size={14} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[rgb(var(--scb-dark-gray))]" />
        </div>
      )}
      
      {filterable && (
        <button
          className={`p-1 rounded hover:bg-[rgba(var(--scb-honolulu-blue),0.05)] ${
            Object.keys(activeFilters).length > 0 ? 'text-[rgb(var(--scb-honolulu-blue))]' : ''
          }`}
          onClick={() => setFiltersOpen(!filtersOpen)}
          aria-label="Filter"
        >
          <Filter size={16} />
        </button>
      )}
      
      {onExportData && (
        <button
          className="p-1 rounded hover:bg-[rgba(var(--scb-honolulu-blue),0.05)]"
          onClick={onExportData}
          aria-label="Export Data"
        >
          <Download size={16} />
        </button>
      )}
    </div>
  );

  return (
    <DashboardCard 
      headerAction={headerAction} 
      {...cardProps}
    >
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-[rgb(var(--scb-honolulu-blue))] border-r-transparent"></div>
            <span className="ml-2 scb-data-label">Loading data...</span>
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="scb-data-label text-center">{emptyStateMessage}</div>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[rgb(var(--scb-border))]">
                {columns.map((column, index) => (
                  <th 
                    key={index}
                    className={`py-3 px-4 text-left scb-data-label font-medium text-[rgb(var(--scb-dark-gray))] ${
                      column.sortable && sortable ? 'cursor-pointer select-none' : ''
                    }`}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column)}
                  >
                    <div className="flex items-center">
                      {column.header}
                      {sortable && column.sortable && sortColumn === column.accessor && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, rowIndex) => (
                <tr 
                  key={rowIndex}
                  className="border-b border-[rgb(var(--scb-border))] hover:bg-[rgba(var(--scb-honolulu-blue),0.02)]"
                >
                  {columns.map((column, colIndex) => {
                    // Determine if this is a financial value that needs special styling
                    const isFinancial = column.type === 'number' || column.type === 'currency' || column.type === 'percentage';
                    const value = row[column.accessor];
                    
                    return (
                      <td 
                        key={colIndex} 
                        className={`py-3 px-4 scb-data-label ${
                          isFinancial ? 'scb-financial-data text-right' : ''
                        }`}
                      >
                        {formatCellValue(value, column)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {renderPagination()}
      </div>
    </DashboardCard>
  );
};

export default TableCard;
