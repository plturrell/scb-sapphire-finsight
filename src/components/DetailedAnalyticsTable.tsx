import React from 'react';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/utils';
import { TransactionSector } from '@/types';

interface DetailedAnalyticsTableProps {
  data: TransactionSector[];
}

export default function DetailedAnalyticsTable({ data }: DetailedAnalyticsTableProps) {
  return (
    <div className="bg-white border border-[hsl(var(--border))] rounded shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
        <h2 className="text-base font-normal">Executive Summary</h2>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
          <div className="border border-[hsl(var(--border))] rounded p-3">
            <p className="text-xs text-[hsl(var(--foreground))] font-medium">RoRWA</p>
            <p className="text-lg font-normal mt-2">6.3%</p>
            <p className="text-xs text-[hsl(var(--success))] mt-1">+6.3%</p>
          </div>
        </div>
      </div>
      
      <div className="px-4 py-3 border-t border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
        <h3 className="text-xs font-medium">Detailed Analytics</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="sapui5-table w-full">
          <thead>
            <tr>
              <th>Sector</th>
              <th>Revenue</th>
              <th>Income</th>
              <th>Assets</th>
              <th>Deposits</th>
              <th>Yield %</th>
              <th>RoRWA</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            {data.map((sector) => (
              <tr key={sector.name}>
                <td>
                  {sector.name}
                </td>
                <td>
                  {formatCurrency(sector.revenue)}
                </td>
                <td>
                  {formatCurrency(sector.income)}
                </td>
                <td>
                  {formatCurrency(sector.assets)}
                </td>
                <td>
                  {formatCurrency(sector.deposits)}
                </td>
                <td>
                  {sector.yield}%
                </td>
                <td>
                  {sector.rowWa}%
                </td>
                <td>
                  <span className={`${
                    sector.change && sector.change > 0 ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--destructive))]'
                  }`}>
                    {sector.change ? formatPercentage(sector.change) : '-'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 border-t border-[hsl(var(--border))] flex justify-end">
        <button className="btn-sapui5 btn-sapui5-primary mr-2">Export</button>
        <button className="btn-sapui5 btn-sapui5-secondary">Print</button>
      </div>
    </div>
  );
}