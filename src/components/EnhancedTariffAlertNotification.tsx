import React, { useState, useEffect } from 'react';
import { AlertTriangle, Bell, Shield, X, ExternalLink, Clock } from 'lucide-react';
import Link from 'next/link';
import { TariffAlert } from '../types';

interface TariffAlertNotificationProps {
  alerts?: TariffAlert[];
  onViewAll?: () => void;
  onDismiss?: (id: string) => void;
  className?: string;
}

/**
 * Enhanced Tariff Alert Notification component with SCB beautiful styling
 * Shows a summary of the latest tariff alerts with priority indicators
 * Follows Fiori Horizon design patterns with SCB color variables
 * Provides both collapsed and expanded views with smooth transitions
 */
const EnhancedTariffAlertNotification: React.FC<TariffAlertNotificationProps> = ({
  alerts = [],
  onViewAll,
  onDismiss,
  className = ""
}) => {
  const [expanded, setExpanded] = useState(false);
  const [visibleAlerts, setVisibleAlerts] = useState<TariffAlert[]>([]);
  
  // Update visible alerts when alerts prop changes
  useEffect(() => {
    if (alerts.length > 0) {
      // Sort by priority and date
      const sortedAlerts = [...alerts].sort((a, b) => {
        // First by priority
        const priorityMap: Record<string, number> = {
          'Critical': 0,
          'high': 1,
          'medium': 2,
          'low': 3
        };
        
        const priorityDiff = priorityMap[a.priority] - priorityMap[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // Then by date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      setVisibleAlerts(sortedAlerts.slice(0, 5)); // Show top 5
    } else {
      setVisibleAlerts([]);
    }
  }, [alerts]);
  
  // If no alerts, render nothing
  if (visibleAlerts.length === 0) return null;
  
  // Count priority levels
  const criticalCount = visibleAlerts.filter(a => a.priority === 'Critical').length;
  const highCount = visibleAlerts.filter(a => a.priority === 'high').length;
  
  // Get the highest priority alert for the collapsed view
  const highestPriorityAlert = visibleAlerts[0];

  // Format date for alerts
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
    <div className={`tariff-alert-notification w-full ${className}`}>
      {/* Collapsed view */}
      {!expanded && (
        <div 
          className="flex items-center gap-2 px-4 py-3 bg-[rgba(var(--warning),0.1)] border-b border-[rgba(var(--warning),0.3)] cursor-pointer touch-manipulation animate-fadeIn"
          onClick={() => setExpanded(true)}
        >
          <div className={`p-1 rounded-full ${
            highestPriorityAlert.priority === 'Critical' ? 'bg-[rgba(var(--destructive),0.1)]' : 
            highestPriorityAlert.priority === 'high' ? 'bg-[rgba(var(--warning),0.1)]' : 
            'bg-[rgba(var(--scb-honolulu-blue),0.1)]'
          }`}>
            <AlertTriangle 
              size={16} 
              className={
                highestPriorityAlert.priority === 'Critical' ? 'text-[rgb(var(--destructive))]' : 
                highestPriorityAlert.priority === 'high' ? 'text-[rgb(var(--warning))]' : 
                'text-[rgb(var(--scb-honolulu-blue))]'
              } 
            />
          </div>
          <span className="text-sm font-medium text-[rgb(var(--scb-dark-gray))] mr-1">
            Tariff Alert{criticalCount + highCount > 1 ? 's' : ''}:
          </span>
          <span className="text-sm text-[rgb(var(--scb-dark-gray))]">
            {highestPriorityAlert.title}
          </span>
          <span className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70 ml-1">
            {criticalCount + highCount > 1 && `+${criticalCount + highCount - 1} more`}
          </span>
          <div className="flex-1" />
          <button 
            className="fiori-btn-ghost text-xs text-[rgb(var(--scb-honolulu-blue))] hover:underline touch-manipulation"
            onClick={(e) => {
              e.stopPropagation();
              if (onViewAll) onViewAll();
            }}
          >
            View All
          </button>
        </div>
      )}
      
      {/* Expanded view */}
      {expanded && (
        <div className="bg-white border-b border-[rgb(var(--scb-border))] shadow-sm animate-fadeIn">
          <div className="px-4 py-3 bg-[rgba(var(--scb-honolulu-blue),0.06)] border-b border-[rgba(var(--scb-honolulu-blue),0.15)] flex items-center">
            <Bell size={16} className="text-[rgb(var(--scb-honolulu-blue))] mr-2" />
            <h3 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">Recent Tariff Alerts</h3>
            <div className="flex-1" />
            <button 
              className="p-1.5 hover:bg-[rgba(var(--scb-honolulu-blue),0.1)] rounded-full transition-colors"
              onClick={() => setExpanded(false)}
            >
              <X size={16} className="text-[rgb(var(--scb-dark-gray))]" />
            </button>
          </div>
          
          <ul className="divide-y divide-[rgb(var(--scb-border))] max-h-96 overflow-y-auto">
            {visibleAlerts.map(alert => (
              <li key={alert.id} className="px-4 py-3 hover:bg-[rgba(var(--scb-light-gray),0.3)] transition-colors touch-manipulation">
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
                    <p className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">
                      {alert.title}
                    </p>
                    <div className="mt-1 flex items-center flex-wrap gap-x-3 gap-y-1">
                      <div className="flex items-center text-xs text-[rgb(var(--scb-dark-gray))]">
                        <span className="font-medium">{alert.country}</span>
                      </div>
                      
                      {alert.publishDate && (
                        <div className="flex items-center text-xs text-[rgb(var(--scb-dark-gray))]">
                          <Clock size={12} className="mr-1 opacity-70" />
                          <span>{formatDate(alert.publishDate)}</span>
                        </div>
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
                    </div>
                    <p className="mt-1 text-xs text-[rgb(var(--scb-dark-gray))] line-clamp-2">
                      {alert.description}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-2">
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
                    
                    {alert.sourceName && (
                      <a 
                        href={alert.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-xs text-[rgb(var(--scb-honolulu-blue))] hover:underline"
                      >
                        <span>{alert.sourceName}</span>
                        <ExternalLink size={10} className="ml-1" />
                      </a>
                    )}
                    
                    {alert.aiEnhanced && (
                      <div className="horizon-chip horizon-chip-green text-[10px] py-0.5 items-center">
                        <Shield size={10} />
                        <span>AI Enhanced</span>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          
          <div className="p-4 bg-[rgba(var(--scb-light-gray),0.3)] border-t border-[rgb(var(--scb-border))] flex items-center justify-between">
            <div className="text-xs text-[rgb(var(--scb-dark-gray))]">
              Showing {visibleAlerts.length} of {alerts.length} alerts
            </div>
            <Link href="/tariff-alerts" passHref>
              <a 
                className="fiori-btn fiori-btn-primary text-xs py-1.5 px-3 touch-min-h" 
                onClick={(e) => {
                  if (onViewAll) {
                    e.preventDefault();
                    onViewAll();
                  }
                }}
              >
                View All Alerts
              </a>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedTariffAlertNotification;