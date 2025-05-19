import React from 'react';

interface CountrySelectorProps {
  selectedCountry: string;
  onChange: (country: string) => void;
}

/**
 * Country selector component for Tariff Alert Dashboard
 * Allows filtering alerts and simulations by ASEAN country
 */
export const CountrySelector: React.FC<CountrySelectorProps> = ({
  selectedCountry,
  onChange
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

  return (
    <div className="country-selector">
      <label htmlFor="country-select" className="sr-only">
        Select Country
      </label>
      <select
        id="country-select"
        className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
        value={selectedCountry}
        onChange={(e) => onChange(e.target.value)}
      >
        {aseanCountries.map(country => (
          <option key={country.id} value={country.id}>
            {country.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CountrySelector;
