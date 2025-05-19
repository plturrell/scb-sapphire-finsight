import React, { ReactNode } from 'react';
import DashboardCard, { DashboardCardProps } from './DashboardCard';

interface ChartCardProps extends Omit<DashboardCardProps, 'children'> {
  children: ReactNode;
  legendItems?: {
    label: string;
    color: string;
    value?: string | number;
  }[];
  comparisonPeriod?: string;
  hasComparison?: boolean;
  aiInsights?: string;
}

/**
 * Chart Card Component for SCB Sapphire FinSight dashboard
 * Displays data visualizations with proper context
 * Following SCB brand guidelines and SAP Fiori design principles
 */
const ChartCard: React.FC<ChartCardProps> = ({
  children,
  legendItems,
  comparisonPeriod,
  hasComparison,
  aiInsights,
  ...cardProps
}) => {
  return (
    <DashboardCard {...cardProps}>
      <div className="flex flex-col h-full">
        {comparisonPeriod && (
          <div className="mb-3 flex justify-end">
            <div className="scb-supplementary px-2 py-1 bg-[rgba(var(--scb-honolulu-blue),0.05)] rounded-md">
              {comparisonPeriod}
            </div>
          </div>
        )}
        
        <div className="chart-container flex-grow" style={{ minHeight: '240px' }}>
          {children}
        </div>
        
        {legendItems && legendItems.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[rgb(var(--scb-border))]">
            <div className="flex flex-wrap gap-3">
              {legendItems.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-sm mr-2" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="scb-data-label mr-1">{item.label}</span>
                  {item.value !== undefined && (
                    <span className="scb-data-label font-medium">{item.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {aiInsights && (
          <div className="mt-4 pt-4 border-t border-[rgb(var(--scb-border))]">
            <div className="flex items-start">
              <div className="w-6 h-6 rounded-full bg-[rgba(var(--scb-american-green),0.1)] flex items-center justify-center mr-3 mt-0.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" 
                    stroke="rgb(33, 170, 71)" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <div className="scb-data-label-large text-[rgb(var(--scb-american-green))] mb-1">AI Insight</div>
                <div className="scb-supplementary">{aiInsights}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardCard>
  );
};

export default ChartCard;
