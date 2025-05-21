import React, { useMemo } from 'react';
import { TariffAlert } from '../types';
import { CheckSquare, Square, Filter, X } from 'lucide-react';

interface TariffAlertFiltersProps {
  alerts: TariffAlert[];
  selectedCountries: string[];
  setSelectedCountries: (countries: string[]) => void;
  selectedPriorities: string[];
  setSelectedPriorities: (priorities: string[]) => void;
  className?: string;
  title?: string;
}

/**
 * Enhanced Filters component for the Tariff Alert Scanner with SCB beautiful styling
 * Provides filtering options for countries and priorities
 * Follows Fiori Horizon design patterns with SCB color variables
 * Includes touch-friendly interactions for mobile and desktop
 */
const EnhancedTariffAlertFilters: React.FC<TariffAlertFiltersProps> = ({
  alerts,
  selectedCountries,
  setSelectedCountries,
  selectedPriorities,
  setSelectedPriorities,
  className = "",
  title = "Filter Alerts"
}) => {
  // Extract unique countries from alerts
  const countries = useMemo(() => {
    const countrySet = new Set<string>();
    alerts.forEach(alert => {
      if (alert.country) countrySet.add(alert.country);
    });
    return Array.from(countrySet).sort();
  }, [alerts]);
  
  // Extract unique priorities from alerts with priority ordering
  const priorities = useMemo(() => {
    const prioritySet = new Set<string>();
    alerts.forEach(alert => {
      if (alert.priority) prioritySet.add(alert.priority);
    });
    
    // Sort priorities in order of importance
    const priorityOrder = ['Critical', 'high', 'medium', 'low'];
    return Array.from(prioritySet).sort((a, b) => {
      return priorityOrder.indexOf(a) - priorityOrder.indexOf(b);
    });
  }, [alerts]);
  
  // Handle country selection
  const handleCountryToggle = (country: string) => {
    if (selectedCountries.includes(country)) {
      setSelectedCountries(selectedCountries.filter(c => c !== country));
    } else {
      setSelectedCountries([...selectedCountries, country]);
    }
  };
  
  // Handle priority selection
  const handlePriorityToggle = (priority: string) => {
    if (selectedPriorities.includes(priority)) {
      setSelectedPriorities(selectedPriorities.filter(p => p !== priority));
    } else {
      setSelectedPriorities([...selectedPriorities, priority]);
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedCountries([]);
    setSelectedPriorities([]);
  };
  
  // If no alerts, no filters to show
  if (!alerts || alerts.length === 0) {
    return (
      <div className={`fiori-tile h-full ${className}`}>
        <div className="px-4 py-3 border-b border-[rgb(var(--scb-border))]">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-[rgb(var(--scb-dark-gray))]">{title}</h3>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-[rgb(var(--scb-dark-gray))]">No filter options available</p>
        </div>
      </div>
    );
  }
  
  const filtersActive = selectedCountries.length > 0 || selectedPriorities.length > 0;

  return (
    <div className={`fiori-tile h-full ${className}`}>
      <div className="px-4 py-3 border-b border-[rgb(var(--scb-border))]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-[rgb(var(--scb-dark-gray))]" />
            <h3 className="text-base font-medium text-[rgb(var(--scb-dark-gray))]">{title}</h3>
          </div>
          {filtersActive && (
            <button
              className="text-xs text-[rgb(var(--scb-honolulu-blue))] hover:underline flex items-center gap-1"
              onClick={clearAllFilters}
            >
              <X size={12} />
              <span>Clear all</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Priority filter */}
        <div>
          <h3 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))] mb-3">Priority</h3>
          <div className="space-y-2">
            {priorities.map(priority => (
              <label
                key={priority}
                className="flex items-center gap-2 cursor-pointer text-sm text-[rgb(var(--scb-dark-gray))] hover:bg-[rgba(var(--scb-light-gray),0.5)] p-2 rounded-md transition-colors touch-manipulation"
              >
                <div className="flex-shrink-0">
                  {selectedPriorities.includes(priority) ? (
                    <CheckSquare size={16} className="text-[rgb(var(--scb-honolulu-blue))]" />
                  ) : (
                    <Square size={16} className="text-[rgb(var(--scb-dark-gray))] opacity-50" />
                  )}
                </div>
                <span className="flex-1">
                  {priority}
                </span>
                <div 
                  className={`px-2 py-0.5 text-xs rounded-full ${
                    priority === 'Critical' ? 'bg-[rgba(var(--destructive),0.1)] text-[rgb(var(--destructive))]' : 
                    priority === 'high' ? 'bg-[rgba(var(--warning),0.1)] text-[rgb(var(--warning))]' : 
                    priority === 'medium' ? 'bg-[rgba(var(--scb-honolulu-blue),0.1)] text-[rgb(var(--scb-honolulu-blue))]' : 
                    'bg-[rgba(var(--scb-dark-gray),0.1)] text-[rgb(var(--scb-dark-gray))]'
                  }`}
                >
                  {alerts.filter(a => a.priority === priority).length}
                </div>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={selectedPriorities.includes(priority)}
                  onChange={() => handlePriorityToggle(priority)}
                />
              </label>
            ))}
          </div>
        </div>
        
        {/* Country filter */}
        <div>
          <h3 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))] mb-3">Country</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2 touch-manipulation">
            {countries.map(country => (
              <label
                key={country}
                className="flex items-center gap-2 cursor-pointer text-sm text-[rgb(var(--scb-dark-gray))] hover:bg-[rgba(var(--scb-light-gray),0.5)] p-2 rounded-md transition-colors"
              >
                <div className="flex-shrink-0">
                  {selectedCountries.includes(country) ? (
                    <CheckSquare size={16} className="text-[rgb(var(--scb-honolulu-blue))]" />
                  ) : (
                    <Square size={16} className="text-[rgb(var(--scb-dark-gray))] opacity-50" />
                  )}
                </div>
                <span className="flex-1">
                  {country}
                </span>
                <div className="px-2 py-0.5 text-xs rounded-full bg-[rgba(var(--scb-honolulu-blue),0.1)] text-[rgb(var(--scb-honolulu-blue))]">
                  {alerts.filter(a => a.country === country).length}
                </div>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={selectedCountries.includes(country)}
                  onChange={() => handleCountryToggle(country)}
                />
              </label>
            ))}
          </div>
        </div>
        
        {/* Filter information */}
        <div className="text-xs text-[rgb(var(--scb-dark-gray))] pt-3 border-t border-[rgb(var(--scb-border))]">
          <p>
            {filtersActive
              ? `Showing ${alerts.filter(a => 
                  (selectedCountries.length === 0 || selectedCountries.includes(a.country)) &&
                  (selectedPriorities.length === 0 || selectedPriorities.includes(a.priority))
                ).length} of ${alerts.length} alerts` 
              : `Showing all ${alerts.length} alerts`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTariffAlertFilters;