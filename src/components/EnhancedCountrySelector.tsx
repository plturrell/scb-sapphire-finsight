import React, { useState } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';

interface EnhancedCountrySelectorProps {
  selectedCountry: string;
  onChange: (country: string) => void;
  className?: string;
  variant?: 'default' | 'compact' | 'pill';
}

/**
 * Enhanced Country selector component with SCB beautiful styling
 * Allows filtering alerts and simulations by ASEAN country
 */
export const EnhancedCountrySelector: React.FC<EnhancedCountrySelectorProps> = ({
  selectedCountry,
  onChange,
  className = '',
  variant = 'default'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const aseanCountries = [
    { id: 'all', name: 'All ASEAN Countries' },
    { id: 'Vietnam', name: 'Vietnam' },
    { id: 'Thailand', name: 'Thailand' },
    { id: 'Indonesia', name: 'Indonesia' },
    { id: 'Malaysia', name: 'Malaysia' },
    { id: 'Philippines', name: 'Philippines' },
    { id: 'Singapore', name: 'Singapore' },
    { id: 'Myanmar', name: 'Myanmar' },
    { id: 'Cambodia', name: 'Cambodia' },
    { id: 'Laos', name: 'Laos' },
    { id: 'Brunei', name: 'Brunei' }
  ];

  const handleSelect = (countryId: string) => {
    onChange(countryId);
    setIsOpen(false);
  };

  const selectedCountryObj = aseanCountries.find(c => c.id === selectedCountry);

  // Style variants
  const getTriggerStyles = () => {
    switch (variant) {
      case 'compact':
        return 'py-1.5 px-2.5 text-xs';
      case 'pill':
        return 'py-2 px-3 rounded-full text-sm';
      default:
        return 'py-2.5 px-4 text-sm';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        className={`fiori-input flex items-center justify-between w-full ${getTriggerStyles()} gap-2 bg-white`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-[rgb(var(--scb-honolulu-blue))]" />
          <span className="text-[rgb(var(--scb-dark-gray))]">
            {selectedCountryObj?.name || 'Select Country'}
          </span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-[rgb(var(--scb-dark-gray))] transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-[rgb(var(--scb-border))] rounded-md shadow-lg max-h-60 overflow-auto animate-fadeIn">
          <ul className="py-1" role="listbox">
            {aseanCountries.map(country => (
              <li
                key={country.id}
                id={`country-${country.id}`}
                role="option"
                aria-selected={selectedCountry === country.id}
                className={`
                  flex items-center px-3 py-2 cursor-pointer text-sm
                  ${selectedCountry === country.id 
                    ? 'bg-[rgba(var(--scb-honolulu-blue),0.08)] text-[rgb(var(--scb-honolulu-blue))]' 
                    : 'text-[rgb(var(--scb-dark-gray))] hover:bg-[rgba(var(--scb-light-gray),0.5)]'
                  }
                `}
                onClick={() => handleSelect(country.id)}
              >
                <div className="flex-1">{country.name}</div>
                {selectedCountry === country.id && (
                  <Check className="w-4 h-4 text-[rgb(var(--scb-honolulu-blue))]" />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/**
 * Enhanced Country Pill Selector for horizontal filtering
 * More compact visual display as pills/tabs
 */
export const EnhancedCountryPillSelector: React.FC<EnhancedCountrySelectorProps> = ({
  selectedCountry,
  onChange,
  className = ''
}) => {
  // Only show a subset of countries for the pill variant to avoid overflow
  const mainAseanCountries = [
    { id: 'all', name: 'All ASEAN' },
    { id: 'Vietnam', name: 'Vietnam' },
    { id: 'Thailand', name: 'Thailand' },
    { id: 'Indonesia', name: 'Indonesia' },
    { id: 'Malaysia', name: 'Malaysia' },
    { id: 'Singapore', name: 'Singapore' }
  ];

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {mainAseanCountries.map(country => (
        <button
          key={country.id}
          onClick={() => onChange(country.id)}
          className={`
            inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium
            transition-colors touch-manipulation
            ${selectedCountry === country.id
              ? 'bg-[rgb(var(--scb-honolulu-blue))] text-white'
              : 'bg-[rgba(var(--scb-light-gray),0.5)] text-[rgb(var(--scb-dark-gray))] hover:bg-[rgba(var(--scb-light-gray),0.8)]'
            }
          `}
        >
          {country.name}
        </button>
      ))}
    </div>
  );
};

export default EnhancedCountrySelector;