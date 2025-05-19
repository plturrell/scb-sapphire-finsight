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
    <div className={`bg-white border border-[hsl(var(--border))] shadow-sm rounded ${className}`}>
      <div className="px-4 py-3 border-b border-[hsl(var(--border))] flex justify-between items-center">
        <h3 className="text-xs font-medium text-[hsl(var(--foreground))]">{title}</h3>
        {change !== undefined && (
          <div className="flex items-center space-x-1 text-xs">
            {isPositive ? (
              <ChevronUp className="w-3 h-3 text-[hsl(var(--success))]" />
            ) : (
              <ChevronDown className="w-3 h-3 text-[hsl(var(--destructive))]" />
            )}
            <span
              className={`font-normal ${
                isPositive ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--destructive))]'
              }`}
            >
              {formatPercentage(change)}
            </span>
          </div>
        )}
      </div>
      <div className="px-4 py-5">
        <p className="text-xl font-normal text-[hsl(var(--foreground))]">{formatValue()}</p>
        {period && (
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">{period}</p>
        )}
      </div>
    </div>
  );
}