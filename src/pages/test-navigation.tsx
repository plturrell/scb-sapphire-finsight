import React, { useState } from 'react';
import AppNavigationLinks from '@/components/layout/AppNavigationLinks';
import { useUIPreferences } from '@/context/UIPreferencesContext';

export default function TestNavigationPage() {
  const { isDarkMode } = useUIPreferences();
  const [filterTest, setFilterTest] = useState(true);
  const [filterMobile, setFilterMobile] = useState(false);
  const [condensed, setCondensed] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  
  const categories = [
    'All Categories', 'Main', 'Finance', 'Data', 'Research', 
    'Vietnam', 'Tools', 'Mobile', 'AI', 'Testing'
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className={`text-3xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Navigation Components Test
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="col-span-1">
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
              <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Navigation Controls
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={filterTest} 
                      onChange={(e) => setFilterTest(e.target.checked)}
                      className="mr-2"
                    />
                    <span>Hide Test Pages</span>
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={filterMobile} 
                      onChange={(e) => setFilterMobile(e.target.checked)}
                      className="mr-2"
                    />
                    <span>Hide Mobile Pages</span>
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={condensed} 
                      onChange={(e) => setCondensed(e.target.checked)}
                      className="mr-2"
                    />
                    <span>Condensed View</span>
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={showLabels} 
                      onChange={(e) => setShowLabels(e.target.checked)}
                      className="mr-2"
                    />
                    <span>Show Labels</span>
                  </label>
                </div>
                
                <div>
                  <label className="block mb-2">Category Filter:</label>
                  <select 
                    value={selectedCategory || 'All Categories'} 
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedCategory(value === 'All Categories' ? undefined : value);
                    }}
                    className={`w-full p-2 rounded ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-span-1 lg:col-span-2">
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg h-full flex flex-col`}>
              <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Navigation Preview
              </h2>
              
              <div className={`flex-1 overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md w-full max-w-md mx-auto h-full overflow-y-auto ${condensed ? 'w-20' : 'md:w-64'}`}>
                  <div className={`h-12 px-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-center`}>
                    {!condensed && <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Navigation Preview</span>}
                  </div>
                  <div className="overflow-y-auto h-full">
                    <AppNavigationLinks 
                      condensed={condensed}
                      showLabels={showLabels}
                      filterTest={filterTest}
                      filterMobile={filterMobile}
                      filterCategory={selectedCategory}
                      onClick={(item) => console.log('Clicked:', item.name)}
                      enableHaptics={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}