import React, { useState, useEffect, useRef } from 'react';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/utils';
import { TransactionSector } from '@/types';
import { useNetworkAwareLoading, useNetworkLazyLoad } from '@/hooks/useNetworkAwareLoading';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import { EnhancedInlineSpinner } from './EnhancedLoadingSpinner';
import EnhancedTouchButton from './EnhancedTouchButton';
import { 
  BarChart, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Printer, 
  Filter,
  ArrowUpRight,
  RefreshCw,
  ChevronRight,
  Info,
  AlertCircle
} from 'lucide-react';

interface DetailedAnalyticsTableProps {
  data: TransactionSector[];
  title?: string;
  subtitle?: string;
  onExport?: () => void;
  onPrint?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  showAIIndicator?: boolean;
  className?: string;
}

/**
 * Enhanced Detailed Analytics Table with SCB beautiful styling
 * Displays financial data in a responsive, network-aware table with SCB design elements
 */
export default function EnhancedDetailedAnalyticsTable({ 
  data, 
  title = "Executive Summary",
  subtitle,
  onExport,
  onPrint,
  onRefresh,
  isLoading = false,
  showAIIndicator = false,
  className = ""
}: DetailedAnalyticsTableProps) {
  const { connection, strategy } = useNetworkAwareLoading();
  const capabilities = useDeviceCapabilities();
  const tableRef = useRef<HTMLDivElement>(null);
  const { isVisible, isLoaded } = useNetworkLazyLoad(tableRef);
  
  const [displayData, setDisplayData] = useState<TransactionSector[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSort, setCurrentSort] = useState<{ field: string; direction: 'asc' | 'desc' } | null>(null);
  
  // Calculate summary metrics
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const avgYield = data.reduce((sum, item) => sum + item.yield, 0) / (data.length || 1);
  const avgRoRWA = data.reduce((sum, item) => sum + item.rowWa, 0) / (data.length || 1);
  
  // Sort the data based on current sort settings
  const sortData = (field: string, direction: 'asc' | 'desc') => {
    const sortedData = [...displayData].sort((a: any, b: any) => {
      if (a[field] < b[field]) return direction === 'asc' ? -1 : 1;
      if (a[field] > b[field]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setDisplayData(sortedData);
  };

  const handleSort = (field: string) => {
    const direction = currentSort?.field === field && currentSort?.direction === 'asc' ? 'desc' : 'asc';
    setCurrentSort({ field, direction });
    sortData(field, direction);
  };
  
  // Determine optimal data display based on network
  useEffect(() => {
    setLoading(true);
    
    // Simulate progressive data loading based on network speed
    const loadData = async () => {
      if (!isVisible) return;
      
      let itemsToShow = data.length;
      
      if (connection.saveData || connection.type === 'slow-2g') {
        itemsToShow = Math.min(5, data.length);
      } else if (connection.type === '2g') {
        itemsToShow = Math.min(10, data.length);
      } else if (connection.type === '3g') {
        itemsToShow = Math.min(20, data.length);
      }
      
      // Progressive loading animation with SCB styling
      const chunks = Math.ceil(itemsToShow / 5);
      for (let i = 0; i < chunks; i++) {
        const start = i * 5;
        const end = Math.min((i + 1) * 5, itemsToShow);
        setDisplayData(data.slice(0, end));
        
        if (i < chunks - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      setLoading(false);
    };
    
    if (isLoaded && !isLoading) {
      loadData();
    }
  }, [data, connection, isVisible, isLoaded, isLoading]);

  // Mobile-optimized card view with SCB styling
  const MobileCardView = () => (
    <div className="space-y-3">
      {displayData.map((item, index) => (
        <div 
          key={index} 
          className="border border-[rgb(var(--scb-border))] rounded-lg p-4 hover:bg-[rgba(var(--scb-light-gray),0.1)] transition-colors"
        >
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-medium text-[rgb(var(--scb-dark-gray))]">{item.name}</h4>
            <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 
              ${item.change > 0 
                ? 'text-[rgb(var(--scb-american-green))] bg-[rgba(var(--scb-american-green),0.1)]' 
                : 'text-[rgb(var(--scb-muted-red))] bg-[rgba(var(--scb-muted-red),0.1)]'
              }`}
            >
              {item.change > 0 
                ? <TrendingUp className="w-3 h-3" /> 
                : <TrendingDown className="w-3 h-3" />
              }
              {formatPercentage(item.change)}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 bg-[rgba(var(--scb-light-gray),0.2)] rounded">
              <p className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70">Revenue</p>
              <p className="font-medium text-[rgb(var(--scb-dark-gray))]">{formatCurrency(item.revenue)}</p>
            </div>
            <div className="p-2 bg-[rgba(var(--scb-light-gray),0.2)] rounded">
              <p className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70">Income</p>
              <p className="font-medium text-[rgb(var(--scb-dark-gray))]">{formatCurrency(item.income)}</p>
            </div>
            {capabilities.tier !== 'low' && !connection.saveData && (
              <>
                <div className="p-2 bg-[rgba(var(--scb-light-gray),0.2)] rounded">
                  <p className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70">Yield</p>
                  <p className="font-medium text-[rgb(var(--scb-dark-gray))]">{formatPercentage(item.yield)}</p>
                </div>
                <div className="p-2 bg-[rgba(var(--scb-light-gray),0.2)] rounded">
                  <p className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70">RoRWA</p>
                  <p className="font-medium text-[rgb(var(--scb-dark-gray))]">{formatPercentage(item.rowWa)}</p>
                </div>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div ref={tableRef} className={`space-y-6 ${className}`} data-testid="enhanced-detailed-analytics-table">
      {!isVisible || loading || isLoading ? (
        <div className="fiori-tile flex flex-col items-center justify-center p-12 min-h-[400px]">
          <div className="w-12 h-12 border-4 border-[rgba(var(--scb-honolulu-blue),0.2)] border-t-[rgb(var(--scb-honolulu-blue))] rounded-full animate-spin mb-4"></div>
          <p className="text-base text-[rgb(var(--scb-dark-gray))]">Loading analytics data...</p>
          <p className="text-sm text-[rgb(var(--scb-dark-gray))] opacity-70 mt-1">Please wait while we prepare your insights</p>
        </div>
      ) : (
        <>
          {/* Summary Cards with SCB styling */}
          <div className="fiori-tile flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-[rgb(var(--scb-border))] px-5 py-3">
              <div>
                <h2 className="text-base font-medium text-[rgb(var(--scb-dark-gray))]">{title}</h2>
                {subtitle && <p className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-80 mt-0.5">{subtitle}</p>}
              </div>
              
              <div className="flex items-center gap-2">
                {showAIIndicator && (
                  <div className="horizon-chip horizon-chip-green text-xs py-0.5 px-2 flex items-center gap-1">
                    <BarChart className="w-3 h-3" />
                    <span>AI-enhanced</span>
                  </div>
                )}
                
                {onRefresh && (
                  <button 
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="p-1.5 rounded-full hover:bg-[rgba(var(--scb-light-gray),0.5)] text-[rgb(var(--scb-dark-gray))] transition-colors"
                  >
                    {isLoading ? (
                      <EnhancedInlineSpinner size="sm" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
            
            <div className="p-5">
              <div className={`grid gap-4 ${
                capabilities.screenSize === 'mobile' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'
              }`}>
                <div className="p-4 rounded-lg border border-[rgb(var(--scb-border))] bg-[rgba(var(--scb-light-gray),0.1)]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[rgba(var(--scb-honolulu-blue),0.1)] flex items-center justify-center">
                      <BarChart className="w-4 h-4 text-[rgb(var(--scb-honolulu-blue))]" />
                    </div>
                    <p className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">Total Revenue</p>
                  </div>
                  <p className="text-2xl font-semibold text-[rgb(var(--scb-honolulu-blue))]">
                    {formatCurrency(totalRevenue)}
                  </p>
                  <p className="text-xs flex items-center gap-1 text-[rgb(var(--scb-american-green))] mt-1">
                    <TrendingUp className="w-3 h-3" /> +6.3% YoY
                  </p>
                </div>
                
                <div className="p-4 rounded-lg border border-[rgb(var(--scb-border))] bg-[rgba(var(--scb-light-gray),0.1)]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[rgba(var(--scb-american-green),0.1)] flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-[rgb(var(--scb-american-green))]" />
                    </div>
                    <p className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">Average Yield</p>
                  </div>
                  <p className="text-2xl font-semibold text-[rgb(var(--scb-american-green))]">
                    {formatPercentage(avgYield)}
                  </p>
                  <p className="text-xs flex items-center gap-1 text-[rgb(var(--scb-american-green))] mt-1">
                    <TrendingUp className="w-3 h-3" /> +4.2% MoM
                  </p>
                </div>
                
                {capabilities.tier !== 'low' && (
                  <div className="p-4 rounded-lg border border-[rgb(var(--scb-border))] bg-[rgba(var(--scb-light-gray),0.1)]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-[rgba(var(--scb-honolulu-blue),0.1)] flex items-center justify-center">
                        <ArrowUpRight className="w-4 h-4 text-[rgb(var(--scb-honolulu-blue))]" />
                      </div>
                      <p className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">Average RoRWA</p>
                    </div>
                    <p className="text-2xl font-semibold text-[rgb(var(--scb-honolulu-blue))]">
                      {formatPercentage(avgRoRWA)}
                    </p>
                    <p className="text-xs flex items-center gap-1 text-[rgb(var(--scb-american-green))] mt-1">
                      <TrendingUp className="w-3 h-3" /> +1.8% YoY
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table/Card View with SCB styling */}
          <div className="fiori-tile flex flex-col">
            <div className="flex items-center justify-between border-b border-[rgb(var(--scb-border))] px-5 py-3">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-medium text-[rgb(var(--scb-dark-gray))]">Detailed Analytics</h3>
                {connection.saveData && (
                  <span className="horizon-chip text-xs py-0.5 px-2">Data Saver Mode</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {onExport && (
                  <EnhancedTouchButton
                    variant="ghost"
                    size="sm"
                    onClick={onExport}
                    leftIcon={<Download className="w-4 h-4" />}
                  >
                    <span className="hidden sm:inline">Export</span>
                  </EnhancedTouchButton>
                )}
                
                {onPrint && (
                  <EnhancedTouchButton
                    variant="ghost"
                    size="sm"
                    onClick={onPrint}
                    leftIcon={<Printer className="w-4 h-4" />}
                  >
                    <span className="hidden sm:inline">Print</span>
                  </EnhancedTouchButton>
                )}
              </div>
            </div>
            
            {capabilities.screenSize === 'mobile' || connection.type === '2g' || connection.saveData ? (
              <div className="p-5">
                <MobileCardView />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[rgba(var(--scb-light-gray),0.2)] text-[rgb(var(--scb-dark-gray))]">
                    <tr>
                      <th 
                        className="px-4 py-3 font-medium text-xs uppercase tracking-wider cursor-pointer hover:bg-[rgba(var(--scb-honolulu-blue),0.05)]"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-1">
                          Sector
                          {currentSort?.field === 'name' && (
                            <ChevronRight 
                              className={`w-4 h-4 ${currentSort.direction === 'desc' ? 'rotate-90' : '-rotate-90'}`} 
                            />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 font-medium text-xs uppercase tracking-wider cursor-pointer hover:bg-[rgba(var(--scb-honolulu-blue),0.05)]"
                        onClick={() => handleSort('revenue')}
                      >
                        <div className="flex items-center gap-1">
                          Revenue
                          {currentSort?.field === 'revenue' && (
                            <ChevronRight 
                              className={`w-4 h-4 ${currentSort.direction === 'desc' ? 'rotate-90' : '-rotate-90'}`} 
                            />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 font-medium text-xs uppercase tracking-wider cursor-pointer hover:bg-[rgba(var(--scb-honolulu-blue),0.05)]"
                        onClick={() => handleSort('income')}
                      >
                        <div className="flex items-center gap-1">
                          Income
                          {currentSort?.field === 'income' && (
                            <ChevronRight 
                              className={`w-4 h-4 ${currentSort.direction === 'desc' ? 'rotate-90' : '-rotate-90'}`} 
                            />
                          )}
                        </div>
                      </th>
                      {capabilities.tier !== 'low' && (
                        <>
                          <th 
                            className="px-4 py-3 font-medium text-xs uppercase tracking-wider cursor-pointer hover:bg-[rgba(var(--scb-honolulu-blue),0.05)]"
                            onClick={() => handleSort('assets')}
                          >
                            <div className="flex items-center gap-1">
                              Assets
                              {currentSort?.field === 'assets' && (
                                <ChevronRight 
                                  className={`w-4 h-4 ${currentSort.direction === 'desc' ? 'rotate-90' : '-rotate-90'}`} 
                                />
                              )}
                            </div>
                          </th>
                          <th 
                            className="px-4 py-3 font-medium text-xs uppercase tracking-wider cursor-pointer hover:bg-[rgba(var(--scb-honolulu-blue),0.05)]"
                            onClick={() => handleSort('deposits')}
                          >
                            <div className="flex items-center gap-1">
                              Deposits
                              {currentSort?.field === 'deposits' && (
                                <ChevronRight 
                                  className={`w-4 h-4 ${currentSort.direction === 'desc' ? 'rotate-90' : '-rotate-90'}`} 
                                />
                              )}
                            </div>
                          </th>
                        </>
                      )}
                      <th 
                        className="px-4 py-3 font-medium text-xs uppercase tracking-wider cursor-pointer hover:bg-[rgba(var(--scb-honolulu-blue),0.05)]"
                        onClick={() => handleSort('yield')}
                      >
                        <div className="flex items-center gap-1">
                          Yield %
                          {currentSort?.field === 'yield' && (
                            <ChevronRight 
                              className={`w-4 h-4 ${currentSort.direction === 'desc' ? 'rotate-90' : '-rotate-90'}`} 
                            />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 font-medium text-xs uppercase tracking-wider cursor-pointer hover:bg-[rgba(var(--scb-honolulu-blue),0.05)]"
                        onClick={() => handleSort('rowWa')}
                      >
                        <div className="flex items-center gap-1">
                          RoRWA
                          {currentSort?.field === 'rowWa' && (
                            <ChevronRight 
                              className={`w-4 h-4 ${currentSort.direction === 'desc' ? 'rotate-90' : '-rotate-90'}`} 
                            />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 font-medium text-xs uppercase tracking-wider cursor-pointer hover:bg-[rgba(var(--scb-honolulu-blue),0.05)]"
                        onClick={() => handleSort('change')}
                      >
                        <div className="flex items-center gap-1">
                          Change
                          {currentSort?.field === 'change' && (
                            <ChevronRight 
                              className={`w-4 h-4 ${currentSort.direction === 'desc' ? 'rotate-90' : '-rotate-90'}`} 
                            />
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[rgb(var(--scb-border))]">
                    {displayData.map((row, index) => (
                      <tr 
                        key={index} 
                        className="animate-fadeIn hover:bg-[rgba(var(--scb-light-gray),0.1)] transition-colors"
                      >
                        <td className="px-4 py-3.5 font-medium text-[rgb(var(--scb-dark-gray))]">{row.name}</td>
                        <td className="px-4 py-3.5 text-[rgb(var(--scb-dark-gray))]">{formatCurrency(row.revenue)}</td>
                        <td className="px-4 py-3.5 text-[rgb(var(--scb-dark-gray))]">{formatCurrency(row.income)}</td>
                        {capabilities.tier !== 'low' && (
                          <>
                            <td className="px-4 py-3.5 text-[rgb(var(--scb-dark-gray))]">{formatCurrency(row.assets)}</td>
                            <td className="px-4 py-3.5 text-[rgb(var(--scb-dark-gray))]">{formatCurrency(row.deposits)}</td>
                          </>
                        )}
                        <td className="px-4 py-3.5 text-[rgb(var(--scb-dark-gray))]">{formatPercentage(row.yield)}</td>
                        <td className="px-4 py-3.5 text-[rgb(var(--scb-dark-gray))]">{formatPercentage(row.rowWa)}</td>
                        <td className="px-4 py-3.5">
                          <span className={`flex items-center gap-1 ${
                            row.change > 0 
                              ? 'text-[rgb(var(--scb-american-green))]' 
                              : 'text-[rgb(var(--scb-muted-red))]'
                          }`}>
                            {row.change > 0 
                              ? <TrendingUp className="w-3 h-3" /> 
                              : <TrendingDown className="w-3 h-3" />
                            }
                            {formatPercentage(row.change)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Load more indicator with SCB styling */}
            {displayData.length < data.length && (
              <div className="p-4 border-t border-[rgb(var(--scb-border))] flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-[rgb(var(--scb-honolulu-blue))]" />
                  <p className="text-sm text-[rgb(var(--scb-dark-gray))]">
                    Showing {displayData.length} of {data.length} items
                    {connection.saveData && ' (Data Saver Mode)'}
                  </p>
                </div>
                
                <EnhancedTouchButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setDisplayData(data)}
                >
                  Show All
                </EnhancedTouchButton>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}