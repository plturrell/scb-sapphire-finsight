import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: number | string;
  change?: number;
  period?: string;
  format?: 'currency' | 'percentage' | 'number' | 'string';
  className?: string;
}

export default function MetricCard({
  title,
  value,
  change,
  period,
  format = 'string',
  className = '',
}: MetricCardProps) {
  const formatValue = () => {
    if (format === 'currency' && typeof value === 'number') {
      return formatCurrency(value);
    }
    if (format === 'percentage' && typeof value === 'number') {
      return `${value}%`;
    }
    if (format === 'number' && typeof value === 'number') {
      return value.toLocaleString();
    }
    return value;
  };

  const isPositive = change && change > 0;

  return (
    <div className={`fiori-tile ${className}`}>
      <div className="px-4 py-3 border-b border-[rgb(var(--scb-border))] flex justify-between items-center">
        <h3 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">{title}</h3>
        {change !== undefined && (
          <div className="flex items-center space-x-1 text-xs">
            {isPositive ? (
              <ChevronUp className="w-3 h-3 text-[rgb(var(--scb-american-green))]" />
            ) : (
              <ChevronDown className="w-3 h-3 text-[rgb(var(--scb-muted-red))]" />
            )}
            <span
              className={`font-medium ${
                isPositive ? 'text-[rgb(var(--scb-american-green))]' : 'text-[rgb(var(--scb-muted-red))]'
              }`}
            >
              {formatPercentage(change)}
            </span>
          </div>
        )}
      </div>
      <div className="px-4 py-5">
        <p className="text-2xl font-medium text-[rgb(var(--scb-honolulu-blue))]">{formatValue()}</p>
        {period && (
          <p className="text-xs text-[rgba(var(--scb-dark-gray),0.7)] mt-2">{period}</p>
        )}
      </div>
    </div>
  );
}