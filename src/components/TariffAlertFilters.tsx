import React, { useMemo } from 'react';
import { TariffAlert } from '../types';
import { CheckSquare, Square } from 'lucide-react';

interface TariffAlertFiltersProps {
  alerts: TariffAlert[];
  selectedCountries: string[];
  setSelectedCountries: (countries: string[]) => void;
  selectedPriorities: string[];
  setSelectedPriorities: (priorities: string[]) => void;
}

/**
 * Filters component for the Tariff Alert Scanner
 * Provides filtering options for countries and priorities
 */
const TariffAlertFilters: React.FC<TariffAlertFiltersProps> = ({
  alerts,
  selectedCountries,
  setSelectedCountries,
  selectedPriorities,
  setSelectedPriorities
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
  
  // If no alerts, no filters to show
  if (!alerts || alerts.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-500">No filter options available</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Priority filter */}
      <div>
        <h3 className="text-xs font-medium text-gray-700 mb-2">Priority</h3>
        <div className="space-y-2">
          {priorities.map(priority => (
            <label
              key={priority}
              className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:text-gray-900"
            >
              <div className="flex-shrink-0">
                {selectedPriorities.includes(priority) ? (
                  <CheckSquare size={16} className="text-blue-600" />
                ) : (
                  <Square size={16} className="text-gray-400" />
                )}
              </div>
              <span className="flex-1">
                {priority}
              </span>
              <span 
                className={`px-2 py-0.5 text-xs rounded-full ${
                  priority === 'Critical' ? 'bg-red-100 text-red-800' : 
                  priority === 'high' ? 'bg-amber-100 text-amber-800' : 
                  priority === 'medium' ? 'bg-blue-100 text-blue-800' : 
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {alerts.filter(a => a.priority === priority).length}
              </span>
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
        <h3 className="text-xs font-medium text-gray-700 mb-2">Country</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
          {countries.map(country => (
            <label
              key={country}
              className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:text-gray-900"
            >
              <div className="flex-shrink-0">
                {selectedCountries.includes(country) ? (
                  <CheckSquare size={16} className="text-blue-600" />
                ) : (
                  <Square size={16} className="text-gray-400" />
                )}
              </div>
              <span className="flex-1">
                {country}
              </span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800">
                {alerts.filter(a => a.country === country).length}
              </span>
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
      <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
        <p>
          {selectedCountries.length > 0 || selectedPriorities.length > 0 
            ? `Showing ${alerts.filter(a => 
                (selectedCountries.length === 0 || selectedCountries.includes(a.country)) &&
                (selectedPriorities.length === 0 || selectedPriorities.includes(a.priority))
              ).length} of ${alerts.length} alerts` 
            : `Showing all ${alerts.length} alerts`}
        </p>
      </div>
    </div>
  );
};

export default TariffAlertFilters;
