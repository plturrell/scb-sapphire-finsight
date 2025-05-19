import React, { useState, useEffect } from 'react';
import { AlertTriangle, Bell, Info, X } from 'lucide-react';
import Link from 'next/link';
import { TariffAlert } from '../types';

interface TariffAlertNotificationProps {
  alerts?: TariffAlert[];
  onViewAll?: () => void;
  onDismiss?: (id: string) => void;
}

/**
 * Tariff Alert Notification component for the top banner
 * Shows a summary of the latest tariff alerts with priority indicators
 */
const TariffAlertNotification: React.FC<TariffAlertNotificationProps> = ({
  alerts = [],
  onViewAll,
  onDismiss
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
  
  return (
    <div className="tariff-alert-notification">
      {/* Collapsed view */}
      {!expanded && (
        <div 
          className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200 cursor-pointer"
          onClick={() => setExpanded(true)}
        >
          <AlertTriangle 
            size={18} 
            className={
              highestPriorityAlert.priority === 'Critical' ? 'text-red-600' : 
              highestPriorityAlert.priority === 'high' ? 'text-amber-600' : 'text-blue-600'
            } 
          />
          <span className="text-sm font-medium mr-1">
            Tariff Alert{criticalCount + highCount > 1 ? 's' : ''}:
          </span>
          <span className="text-sm">
            {highestPriorityAlert.title}
          </span>
          <span className="text-xs text-gray-600 ml-1">
            {criticalCount + highCount > 1 && `+${criticalCount + highCount - 1} more`}
          </span>
          <div className="flex-1" />
          <button 
            className="text-sm text-blue-600 hover:text-blue-800"
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
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 flex items-center">
            <Bell size={16} className="text-amber-600 mr-2" />
            <h3 className="text-sm font-medium">Recent Tariff Alerts</h3>
            <div className="flex-1" />
            <button 
              className="p-1 hover:bg-amber-100 rounded-full transition-colors"
              onClick={() => setExpanded(false)}
            >
              <X size={16} />
            </button>
          </div>
          
          <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
            {visibleAlerts.map(alert => (
              <li key={alert.id} className="p-3 hover:bg-gray-50">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <AlertTriangle 
                      size={16} 
                      className={
                        alert.priority === 'Critical' ? 'text-red-600' : 
                        alert.priority === 'high' ? 'text-amber-600' : 
                        alert.priority === 'medium' ? 'text-blue-600' : 'text-gray-500'
                      } 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {alert.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-medium">{alert.country}</span>
                      <span>•</span>
                      <span>
                        Impact: {alert.impactSeverity}/10
                      </span>
                      <span>•</span>
                      <span>
                        Confidence: {Math.round(alert.confidence * 100)}%
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-700 line-clamp-2">
                      {alert.description}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-2">
                    <div 
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        alert.priority === 'Critical' ? 'bg-red-100 text-red-800' : 
                        alert.priority === 'high' ? 'bg-amber-100 text-amber-800' : 
                        alert.priority === 'medium' ? 'bg-blue-100 text-blue-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {alert.priority}
                    </div>
                    
                    {alert.sourceName && (
                      <a 
                        href={alert.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {alert.sourceName}
                      </a>
                    )}
                    
                    {alert.aiEnhanced && (
                      <div className="flex items-center text-xs text-green-700 gap-1">
                        <Info size={12} />
                        <span>AI Enhanced</span>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          
          <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Showing {visibleAlerts.length} of {alerts.length} alerts
            </div>
            <Link href="/tariff-alerts" passHref>
              <a 
                className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors" 
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

export default TariffAlertNotification;
