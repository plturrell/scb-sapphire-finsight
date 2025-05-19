import React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import DashboardCard, { DashboardCardProps } from './DashboardCard';

interface KPICardProps extends Omit<DashboardCardProps, 'children'> {
  value: string | number;
  previousValue?: string | number;
  percentChange?: number;
  valuePrefix?: string;
  valueSuffix?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  details?: string;
  benchmark?: {
    label: string;
    value: string | number;
  };
  target?: {
    label: string;
    value: string | number;
  };
}

/**
 * KPI Card Component for SCB Sapphire FinSight dashboard
 * Displays financial metrics with trends, benchmarks and targets
 * Following SCB brand guidelines and SAP Fiori design principles
 */
const KPICard: React.FC<KPICardProps> = ({
  value,
  previousValue,
  percentChange,
  valuePrefix = '',
  valueSuffix = '',
  trendDirection,
  details,
  benchmark,
  target,
  ...cardProps
}) => {
  // Determine trend color based on value change
  const getTrendColor = () => {
    if (!trendDirection) return '';
    
    // For financial metrics where up is good
    if (trendDirection === 'up') {
      return 'text-[rgb(var(--scb-american-green))]';
    } 
    // For financial metrics where down is good
    else if (trendDirection === 'down') {
      return 'text-[rgb(var(--scb-muted-red))]';
    }
    
    return 'text-[rgb(var(--scb-honolulu-blue))]';
  };

  return (
    <DashboardCard {...cardProps}>
      <div className="flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
          <div className="scb-metric-primary text-[rgb(var(--scb-honolulu-blue))] text-xl sm:text-2xl md:text-3xl">
            {valuePrefix}{value}{valueSuffix}
          </div>
          
          {percentChange !== undefined && (
            <div className={`flex items-center scb-data-label text-sm sm:text-base ${getTrendColor()}`}>
              {percentChange > 0 ? (
                <>
                  <TrendingUp size={16} className="mr-1" />
                  +{percentChange}%
                </>
              ) : percentChange < 0 ? (
                <>
                  <TrendingDown size={16} className="mr-1" />
                  {percentChange}%
                </>
              ) : (
                <>
                  {percentChange}%
                </>
              )}
            </div>
          )}
        </div>
        
        {details && (
          <div className="scb-supplementary mt-2">
            {details}
          </div>
        )}
        
        {(benchmark || target) && (
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[rgb(var(--scb-border))]">
            {benchmark && (
              <div>
                <div className="scb-data-label mb-1">{benchmark.label}</div>
                <div className="scb-financial-data scb-metric-tertiary">
                  {valuePrefix}{benchmark.value}{valueSuffix}
                </div>
              </div>
            )}
            
            {target && (
              <div>
                <div className="scb-data-label mb-1">{target.label}</div>
                <div className="scb-financial-data scb-metric-tertiary">
                  {valuePrefix}{target.value}{valueSuffix}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardCard>
  );
};

export default KPICard;
