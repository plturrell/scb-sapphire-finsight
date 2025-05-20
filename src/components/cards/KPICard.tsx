import React from 'react';
import DashboardCard, { DashboardCardProps } from './DashboardCard';
import { ChartIcon } from '../icons';

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
      return 'text-[rgb(var(--scb-american-green))] dark:text-green-400';
    } 
    // For financial metrics where down is good
    else if (trendDirection === 'down') {
      return 'text-[rgb(var(--scb-muted-red))] dark:text-red-400';
    }
    
    return 'text-[rgb(var(--scb-honolulu-blue))] dark:text-blue-300';
  };

  return (
    <DashboardCard {...cardProps}>
      <div className="flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
          <div className="scb-metric-primary text-[rgb(var(--scb-honolulu-blue))] dark:text-blue-300 text-xl sm:text-2xl md:text-3xl transition-colors transform hover:scale-105 transition-transform duration-300">
            {valuePrefix}{value}{valueSuffix}
          </div>
          
          {percentChange !== undefined && (
            <div className={`flex items-center scb-data-label text-sm sm:text-base ${getTrendColor()} px-2 py-1 rounded-full backdrop-blur-sm backdrop-saturate-150 bg-white/10 dark:bg-white/5 transition-all hover:scale-105`}>
              {percentChange > 0 ? (
                <>
                  <ChartIcon 
                    variant="trending-up" 
                    size={16} 
                    animation="pulse" 
                    className="mr-1"
                    color="currentColor"
                  />
                  +{percentChange}%
                </>
              ) : percentChange < 0 ? (
                <>
                  <ChartIcon 
                    variant="trending-down" 
                    size={16} 
                    animation="pulse" 
                    className="mr-1"
                    color="currentColor"
                  />
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
          <div className="scb-supplementary mt-2 dark:text-gray-300 transition-colors backdrop-blur-sm p-2 rounded-md bg-gray-50/50 dark:bg-gray-700/30">
            {details}
          </div>
        )}
        
        {(benchmark || target) && (
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[rgb(var(--scb-border))] dark:border-gray-700/40">
            {benchmark && (
              <div className="p-2 rounded-md hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors group">
                <div className="scb-data-label mb-1 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">{benchmark.label}</div>
                <div className="scb-financial-data scb-metric-tertiary dark:text-white transition-all group-hover:scale-105">
                  {valuePrefix}{benchmark.value}{valueSuffix}
                </div>
              </div>
            )}
            
            {target && (
              <div className="p-2 rounded-md hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors group">
                <div className="scb-data-label mb-1 dark:text-gray-300 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">{target.label}</div>
                <div className="scb-financial-data scb-metric-tertiary dark:text-white transition-all group-hover:scale-105">
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