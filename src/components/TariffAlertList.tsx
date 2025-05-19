import React from 'react';
import { TariffAlert } from '../types';
import { AlertTriangle, Info, ExternalLink, Clock, Tag } from 'lucide-react';

interface TariffAlertListProps {
  alerts: TariffAlert[];
  isLoading?: boolean;
  onAlertClick?: (alert: TariffAlert) => void;
}

/**
 * TariffAlertList component for displaying a list of tariff alerts
 * Used in the Tariff Alert Scanner dashboard
 */
const TariffAlertList: React.FC<TariffAlertListProps> = ({
  alerts,
  isLoading = false,
  onAlertClick
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 w-4 bg-blue-200 rounded-full mb-2.5" />
          <div className="h-2.5 w-24 bg-gray-200 rounded-full" />
        </div>
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="py-8 px-4 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
          <AlertTriangle size={20} className="text-gray-400" />
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-1">No tariff alerts found</h3>
        <p className="text-xs text-gray-500">
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
    <div className="overflow-y-auto max-h-[600px]">
      <ul className="divide-y divide-gray-100">
        {alerts.map((alert) => (
          <li 
            key={alert.id || alert.title} 
            className="px-4 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => onAlertClick && onAlertClick(alert)}
          >
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
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">
                    {alert.title}
                  </p>
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
                </div>
                
                <div className="mt-1 flex items-center flex-wrap gap-x-3 gap-y-1">
                  <div className="flex items-center text-xs text-gray-500">
                    <Tag size={12} className="mr-1" />
                    <span>{alert.country}</span>
                  </div>
                  
                  {alert.publishDate && (
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock size={12} className="mr-1" />
                      <span>{formatDate(alert.publishDate)}</span>
                    </div>
                  )}
                  
                  {alert.tariffRate !== undefined && (
                    <div className="flex items-center text-xs text-gray-500">
                      <span className="font-medium">Rate: {alert.tariffRate}%</span>
                    </div>
                  )}
                  
                  {alert.productCategories && alert.productCategories.length > 0 && (
                    <div className="flex items-center text-xs text-gray-500">
                      <span>Products: {alert.productCategories.slice(0, 2).join(', ')}{alert.productCategories.length > 2 ? '...' : ''}</span>
                    </div>
                  )}
                </div>
                
                <p className="mt-1 text-xs text-gray-700 line-clamp-2">
                  {alert.description}
                </p>
                
                <div className="mt-2 flex items-center flex-wrap gap-2">
                  {alert.sourceName && (
                    <a 
                      href={alert.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-xs text-blue-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>{alert.sourceName}</span>
                      <ExternalLink size={10} className="ml-1" />
                    </a>
                  )}
                  
                  <div className="flex items-center text-xs">
                    <span className="text-gray-500">Impact: </span>
                    <span 
                      className={`ml-1 font-medium ${
                        alert.impactSeverity >= 8 ? 'text-red-600' :
                        alert.impactSeverity >= 5 ? 'text-amber-600' :
                        'text-blue-600'
                      }`}
                    >
                      {alert.impactSeverity}/10
                    </span>
                  </div>
                  
                  <div className="flex items-center text-xs">
                    <span className="text-gray-500">Confidence: </span>
                    <span className="ml-1 font-medium text-green-600">
                      {Math.round(alert.confidence * 100)}%
                    </span>
                  </div>
                  
                  {alert.aiEnhanced && (
                    <div className="flex items-center text-xs text-green-700 gap-1">
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

export default TariffAlertList;
