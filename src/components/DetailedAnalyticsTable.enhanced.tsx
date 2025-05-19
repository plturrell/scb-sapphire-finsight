import React, { useState, useEffect, useRef } from 'react';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/utils';
import { TransactionSector } from '@/types';
import { useNetworkAwareLoading, useNetworkLazyLoad } from '@/hooks/useNetworkAwareLoading';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import LoadingSpinner from './LoadingSpinner';

interface DetailedAnalyticsTableProps {
  data: TransactionSector[];
}

export default function DetailedAnalyticsTable({ data }: DetailedAnalyticsTableProps) {
  const { connection, strategy } = useNetworkAwareLoading();
  const capabilities = useDeviceCapabilities();
  const tableRef = useRef<HTMLDivElement>(null);
  const { isVisible, isLoaded } = useNetworkLazyLoad(tableRef);
  
  const [displayData, setDisplayData] = useState<TransactionSector[]>([]);
  const [loading, setLoading] = useState(true);
  
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
      
      // Progressive loading animation
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
    
    if (isLoaded) {
      loadData();
    }
  }, [data, connection, isVisible, isLoaded]);

  // Mobile-optimized card view
  const MobileCardView = () => (
    <div className="space-y-3">
      {displayData.map((item, index) => (
        <div key={index} className="bg-white border border-[hsl(var(--border))] rounded p-4">
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-medium text-sm">{item.sector}</h4>
            <span className={`text-xs px-2 py-1 rounded ${
              item.change > 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
            }`}>
              {formatPercentage(item.change)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-600">Revenue</p>
              <p className="font-medium">{formatCurrency(item.revenue)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Income</p>
              <p className="font-medium">{formatCurrency(item.income)}</p>
            </div>
            {capabilities.tier !== 'low' && !connection.saveData && (
              <>
                <div>
                  <p className="text-xs text-gray-600">Yield</p>
                  <p className="font-medium">{formatPercentage(item.yield)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">RoRWA</p>
                  <p className="font-medium">{formatPercentage(item.rorwa)}</p>
                </div>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div ref={tableRef} className="min-h-[400px]">
      {!isVisible || loading ? (
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* Summary Cards - Always visible */}
          <div className="bg-white border border-[hsl(var(--border))] rounded shadow-sm overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
              <h2 className="text-base font-normal">Executive Summary</h2>
            </div>
            <div className="p-4">
              <div className={`grid gap-4 ${
                capabilities.screenSize === 'mobile' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'
              }`}>
                <div className="border border-[hsl(var(--border))] rounded p-3">
                  <p className="text-xs text-[hsl(var(--foreground))] font-medium">SF Revenue</p>
                  <p className="text-lg font-normal mt-2">$120,567</p>
                  <p className="text-xs text-[hsl(var(--success))] mt-1">+6.3%</p>
                </div>
                <div className="border border-[hsl(var(--border))] rounded p-3">
                  <p className="text-xs text-[hsl(var(--foreground))] font-medium">YoY Income</p>
                  <p className="text-lg font-normal mt-2">14.32%</p>
                  <p className="text-xs text-[hsl(var(--success))] mt-1">+6.3%</p>
                </div>
                {capabilities.tier !== 'low' && (
                  <div className="border border-[hsl(var(--border))] rounded p-3">
                    <p className="text-xs text-[hsl(var(--foreground))] font-medium">RoRWA</p>
                    <p className="text-lg font-normal mt-2">6.3%</p>
                    <p className="text-xs text-[hsl(var(--success))] mt-1">+6.3%</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table/Card View based on device and network */}
          <div className="bg-white border border-[hsl(var(--border))] rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))] flex justify-between items-center">
              <h3 className="text-xs font-medium">Detailed Analytics</h3>
              {connection.saveData && (
                <span className="text-xs text-gray-600">Data Saver Mode</span>
              )}
            </div>
            
            {capabilities.screenSize === 'mobile' || connection.type === '2g' || connection.saveData ? (
              <div className="p-4">
                <MobileCardView />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="sapui5-table w-full">
                  <thead>
                    <tr>
                      <th>Sector</th>
                      <th>Revenue</th>
                      <th>Income</th>
                      {capabilities.tier !== 'low' && (
                        <>
                          <th>Assets</th>
                          <th>Deposits</th>
                        </>
                      )}
                      <th>Yield %</th>
                      <th>RoRWA</th>
                      <th>Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayData.map((row, index) => (
                      <tr key={index} className="animate-fadeIn">
                        <td>{row.sector}</td>
                        <td>{formatCurrency(row.revenue)}</td>
                        <td>{formatCurrency(row.income)}</td>
                        {capabilities.tier !== 'low' && (
                          <>
                            <td>{formatCurrency(row.assets)}</td>
                            <td>{formatCurrency(row.deposits)}</td>
                          </>
                        )}
                        <td>{formatPercentage(row.yield)}</td>
                        <td>{formatPercentage(row.rorwa)}</td>
                        <td>
                          <span className={row.change > 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatPercentage(row.change)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Load more indicator */}
            {displayData.length < data.length && (
              <div className="p-4 text-center border-t border-[hsl(var(--border))]">
                <p className="text-sm text-gray-600">
                  Showing {displayData.length} of {data.length} items
                  {connection.saveData && ' (Data Saver Mode)'}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}