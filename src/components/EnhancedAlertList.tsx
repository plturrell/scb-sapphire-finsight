import React from 'react';
import { AlertTriangle, ExternalLink, Info, Clock, Tag } from 'lucide-react';
import { TariffAlert } from '../types';

interface EnhancedAlertListProps {
  alerts: TariffAlert[];
  onAlertClick?: (alert: TariffAlert) => void;
  title?: string;
  className?: string;
}

/**
 * Enhanced Alert List component with SCB beautiful styling
 * Used in the Tariff Alert Scanner dashboard
 */
export const EnhancedAlertList: React.FC<EnhancedAlertListProps> = ({
  alerts,
  onAlertClick,
  title = 'Alerts',
  className = '',
}) => {
  if (!alerts || alerts.length === 0) {
    return (
      <div className={`fiori-tile p-6 text-center ${className}`}>
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[rgba(var(--scb-light-gray),0.5)] mb-4">
          <AlertTriangle size={20} className="text-[rgb(var(--scb-dark-gray))]" />
        </div>
        <h3 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))] mb-1">No tariff alerts found</h3>
        <p className="text-xs text-[rgba(var(--scb-dark-gray),0.7)]">
          Adjust your filter criteria or check back later for new alerts
        </p>
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
    <div className={`fiori-tile overflow-hidden ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-[rgb(var(--scb-border))] bg-[rgba(var(--scb-light-gray),0.3)]">
          <h2 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">{title}</h2>
        </div>
      )}
      
      <ul className="divide-y divide-[rgb(var(--scb-border))] max-h-[600px] overflow-y-auto">
        {alerts.map((alert) => (
          <li
            key={alert.id || alert.title}
            className="px-4 py-4 hover:bg-[rgba(var(--scb-light-gray),0.5)] cursor-pointer transition-colors"
            onClick={() => onAlertClick && onAlertClick(alert)}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <AlertTriangle
                  size={16}
                  className={
                    alert.priority === 'Critical' ? 'text-[rgb(var(--scb-muted-red))]' :
                    alert.priority === 'high' ? 'text-[rgb(211,137,0)]' :
                    alert.priority === 'medium' ? 'text-[rgb(var(--scb-honolulu-blue))]' : 'text-[rgb(var(--scb-dark-gray))]'
                  }
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-[rgb(var(--scb-dark-gray))] line-clamp-1">
                    {alert.title}
                  </p>
                  <div
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      alert.priority === 'Critical' ? 'horizon-chip bg-[rgba(var(--scb-muted-red),0.1)] text-[rgb(var(--scb-muted-red))] border-[rgba(var(--scb-muted-red),0.2)]' :
                      alert.priority === 'high' ? 'horizon-chip bg-[rgba(211,137,0,0.1)] text-[rgb(211,137,0)] border-[rgba(211,137,0,0.2)]' :
                      alert.priority === 'medium' ? 'horizon-chip-blue' :
                      'horizon-chip'
                    }`}
                  >
                    {alert.priority}
                  </div>
                </div>

                <div className="mt-1 flex items-center flex-wrap gap-x-3 gap-y-1">
                  <div className="flex items-center text-xs text-[rgb(var(--scb-dark-gray))]">
                    <Tag size={12} className="mr-1" />
                    <span>{alert.country}</span>
                  </div>

                  {alert.publishDate && (
                    <div className="flex items-center text-xs text-[rgb(var(--scb-dark-gray))]">
                      <Clock size={12} className="mr-1" />
                      <span>{formatDate(alert.publishDate)}</span>
                    </div>
                  )}

                  {alert.tariffRate !== undefined && (
                    <div className="flex items-center text-xs font-medium text-[rgb(var(--fiori-neutral-text))]">
                      <span>Rate: {alert.tariffRate}%</span>
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
                        alert.impactSeverity >= 8 ? 'text-[rgb(var(--scb-muted-red))]' :
                        alert.impactSeverity >= 5 ? 'text-[rgb(211,137,0)]' :
                        'text-[rgb(var(--scb-honolulu-blue))]'
                      }`}
                    >
                      {alert.impactSeverity}/10
                    </span>
                  </div>

                  <div className="flex items-center text-xs">
                    <span className="text-[rgb(var(--scb-dark-gray))]">Confidence: </span>
                    <span className="ml-1 font-medium text-[rgb(var(--scb-american-green))]">
                      {Math.round(alert.confidence * 100)}%
                    </span>
                  </div>

                  {alert.aiEnhanced && (
                    <div className="flex items-center text-xs horizon-chip-green gap-1">
                      <Info size={12} />
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
  );
};

export default EnhancedAlertList;