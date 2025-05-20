import React from 'react';
import { TariffAlert } from '../types';
import { AlertTriangle, Info, ExternalLink, Clock, Tag, Shield } from 'lucide-react';

interface TariffAlertListProps {
  alerts: TariffAlert[];
  isLoading?: boolean;
  onAlertClick?: (alert: TariffAlert) => void;
  title?: string;
}

/**
 * Enhanced TariffAlertList component with SCB beautiful styling
 * Used in the Tariff Alert Scanner dashboard
 */
const EnhancedTariffAlertList: React.FC<TariffAlertListProps> = ({
  alerts,
  isLoading = false,
  onAlertClick,
  title = "Tariff Alerts"
}) => {
  if (isLoading) {
    return (
      <div className="fiori-tile h-full flex items-center justify-center py-8">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-5 w-5 bg-[rgba(var(--scb-honolulu-blue),0.3)] rounded-full mb-3" />
          <div className="h-2.5 w-32 bg-[rgba(var(--scb-border),0.7)] rounded-full mb-2" />
          <div className="h-2 w-24 bg-[rgba(var(--scb-border),0.5)] rounded-full" />
        </div>
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="fiori-tile h-full">
        <div className="px-4 py-3 border-b border-[rgb(var(--scb-border))]">
          <h3 className="text-base font-medium text-[rgb(var(--scb-dark-gray))]">{title}</h3>
        </div>
        <div className="py-12 px-4 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[rgba(var(--scb-light-gray),0.5)] mb-4">
            <AlertTriangle size={22} className="text-[rgb(var(--scb-dark-gray))] opacity-60" />
          </div>
          <h3 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))] mb-1">No tariff alerts found</h3>
          <p className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70 max-w-xs mx-auto">
            Adjust your filter criteria or check back later for new alerts
          </p>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date | string) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="fiori-tile h-full flex flex-col">
      <div className="px-4 py-3 border-b border-[rgb(var(--scb-border))]">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-[rgb(var(--scb-dark-gray))]">{title}</h3>
          <div className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-80">
            {alerts.length} {alerts.length === 1 ? 'Alert' : 'Alerts'}
          </div>
        </div>
      </div>
      
      <div className="overflow-y-auto flex-grow">
        <ul className="divide-y divide-[rgb(var(--scb-border))]">
          {alerts.map((alert) => (
            <li 
              key={alert.id || alert.title} 
              className="px-4 py-4 hover:bg-[rgba(var(--scb-light-gray),0.3)] cursor-pointer transition-colors"
              onClick={() => onAlertClick && onAlertClick(alert)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div 
                    className={`p-1 rounded-full ${
                      alert.priority === 'Critical' ? 'bg-[rgba(var(--destructive),0.1)]' : 
                      alert.priority === 'high' ? 'bg-[rgba(var(--warning),0.1)]' : 
                      alert.priority === 'medium' ? 'bg-[rgba(var(--scb-honolulu-blue),0.1)]' : 
                      'bg-[rgba(var(--scb-dark-gray),0.1)]'
                    }`}
                  >
                    <AlertTriangle 
                      size={16} 
                      className={
                        alert.priority === 'Critical' ? 'text-[rgb(var(--destructive))]' : 
                        alert.priority === 'high' ? 'text-[rgb(var(--warning))]' : 
                        alert.priority === 'medium' ? 'text-[rgb(var(--scb-honolulu-blue))]' : 
                        'text-[rgb(var(--scb-dark-gray))]'
                      } 
                    />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[rgb(var(--scb-dark-gray))] line-clamp-1">
                      {alert.title}
                    </p>
                    <div 
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        alert.priority === 'Critical' ? 'bg-[rgba(var(--destructive),0.1)] text-[rgb(var(--destructive))]' : 
                        alert.priority === 'high' ? 'bg-[rgba(var(--warning),0.1)] text-[rgb(var(--warning))]' : 
                        alert.priority === 'medium' ? 'bg-[rgba(var(--scb-honolulu-blue),0.1)] text-[rgb(var(--scb-honolulu-blue))]' : 
                        'bg-[rgba(var(--scb-dark-gray),0.1)] text-[rgb(var(--scb-dark-gray))]'
                      }`}
                    >
                      {alert.priority}
                    </div>
                  </div>
                  
                  <div className="mt-1 flex items-center flex-wrap gap-x-3 gap-y-1">
                    <div className="flex items-center text-xs text-[rgb(var(--scb-dark-gray))]">
                      <Tag size={12} className="mr-1 opacity-70" />
                      <span>{alert.country}</span>
                    </div>
                    
                    {alert.publishDate && (
                      <div className="flex items-center text-xs text-[rgb(var(--scb-dark-gray))]">
                        <Clock size={12} className="mr-1 opacity-70" />
                        <span>{formatDate(alert.publishDate)}</span>
                      </div>
                    )}
                    
                    {alert.tariffRate !== undefined && (
                      <div className="flex items-center text-xs text-[rgb(var(--scb-dark-gray))]">
                        <span className="font-medium">Rate: {alert.tariffRate}%</span>
                      </div>
                    )}
                    
                    {alert.productCategories && alert.productCategories.length > 0 && (
                      <div className="flex items-center text-xs text-[rgb(var(--scb-dark-gray))]">
                        <span>Products: {alert.productCategories.slice(0, 2).join(', ')}{alert.productCategories.length > 2 ? '...' : ''}</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="mt-1 text-xs text-[rgb(var(--scb-dark-gray))] line-clamp-2">
                    {alert.description}
                  </p>
                  
                  <div className="mt-2 flex items-center flex-wrap gap-2">
                    {alert.sourceName && (
                      <a 
                        href={alert.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-xs text-[rgb(var(--scb-honolulu-blue))] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>{alert.sourceName}</span>
                        <ExternalLink size={10} className="ml-1" />
                      </a>
                    )}
                    
                    <div className="flex items-center text-xs">
                      <span className="text-[rgb(var(--scb-dark-gray))]">Impact: </span>
                      <span 
                        className={`ml-1 font-medium ${
                          alert.impactSeverity >= 8 ? 'text-[rgb(var(--destructive))]' :
                          alert.impactSeverity >= 5 ? 'text-[rgb(var(--warning))]' :
                          'text-[rgb(var(--scb-honolulu-blue))]'
                        }`}
                      >
                        {alert.impactSeverity}/10
                      </span>
                    </div>
                    
                    <div className="flex items-center text-xs">
                      <span className="text-[rgb(var(--scb-dark-gray))]">Confidence: </span>
                      <span className="ml-1 font-medium text-[rgb(var(--horizon-green))]">
                        {Math.round(alert.confidence * 100)}%
                      </span>
                    </div>
                    
                    {alert.aiEnhanced && (
                      <div className="horizon-chip horizon-chip-green text-[10px] py-0.5 items-center">
                        <Shield size={10} />
                        <span>AI Enhanced</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default EnhancedTariffAlertList;