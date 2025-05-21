import React from 'react';
import { Globe, ChevronDown } from 'lucide-react';

interface CountrySelectorProps {
  selectedCountry: string;
  onChange: (country: string) => void;
  variant?: 'dropdown' | 'pills';
  className?: string;
}

/**
 * Enhanced Country selector with SCB beautiful styling
 * Allows filtering alerts and simulations by ASEAN country
 * Supports dropdown and pill-based selection variants
 */
export const CountrySelector: React.FC<CountrySelectorProps> = ({
  selectedCountry,
  onChange,
  variant = 'dropdown',
  className = ''
}) => {
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

  // Pill-based selection style
  if (variant === 'pills') {
    return (
      <div className={`${className}`}>
        <label className="text-xs font-medium text-[rgb(var(--scb-dark-gray))] mb-1.5 block">
          Select Country
        </label>
        <div className="flex flex-wrap gap-2">
          {aseanCountries.map(country => (
            <button
              key={country.id}
              className={`
                inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium
                transition-colors touch-manipulation focus:outline-none
                ${selectedCountry === country.id
                  ? 'bg-[rgb(var(--scb-honolulu-blue))] text-white'
                  : 'bg-[rgba(var(--scb-light-gray),0.5)] text-[rgb(var(--scb-dark-gray))] hover:bg-[rgba(var(--scb-light-gray),0.8)]'
                }
              `}
              onClick={() => onChange(country.id)}
            >
              {country.id === 'all' ? <Globe size={14} className="mr-1.5" /> : null}
              <span>{country.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Default dropdown style
  return (
    <div className={`country-selector ${className}`}>
      <label htmlFor="country-select" className="sr-only">
        Select Country
      </label>
      <div className="relative">
        <select
          id="country-select"
          className="fiori-input pr-10 appearance-none bg-white border border-[rgb(var(--scb-border))] rounded-md py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--scb-honolulu-blue))] focus:border-[rgb(var(--scb-honolulu-blue))] transition-colors w-full"
          value={selectedCountry}
          onChange={(e) => onChange(e.target.value)}
        >
          {aseanCountries.map(country => (
            <option key={country.id} value={country.id}>
              {country.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[rgb(var(--scb-dark-gray))]">
          <ChevronDown size={16} />
        </div>
      </div>
    </div>
  );
};

export default CountrySelector;