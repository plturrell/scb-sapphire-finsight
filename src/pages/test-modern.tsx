import React from 'react';
import ModernLayout from '@/components/ModernLayout';
import Image from 'next/image';

export default function TestModernPage() {
  return (
    <ModernLayout>
      <div className="space-y-6">
        {/* SCB Banner Image */}
        <div className="w-full overflow-hidden rounded-md shadow-sm mb-6 max-h-[180px]">
          <Image 
            src="/images/banner.png" 
            alt="SCB Sapphire FinSight Banner" 
            width={1200} 
            height={180} 
            className="w-full object-cover"
            priority
          />
        </div>
        
        {/* Welcome Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Modern Layout Test</h1>
          <p className="text-gray-600 mb-6">
            This page demonstrates all the enhanced UI features including:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">🔍 Enhanced Search</h3>
              <p className="text-sm text-gray-600">
                Try searching for companies in the header search bar with real-time results
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">📱 App Finder</h3>
              <p className="text-sm text-gray-600">
                Click the grid icon in the header to browse all available apps
              </p>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">🔔 Live Notifications</h3>
              <p className="text-sm text-gray-600">
                Click the bell icon for real-time notifications with refresh functionality
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">🎨 Modern UI</h3>
              <p className="text-sm text-gray-600">
                Clean design with smooth animations and transitions
              </p>
            </div>
            
            <div className="p-4 bg-indigo-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">📊 SAP Fiori</h3>
              <p className="text-sm text-gray-600">
                Consistent styling following SAP Fiori design principles
              </p>
            </div>
            
            <div className="p-4 bg-red-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">🏦 SCB Branding</h3>
              <p className="text-sm text-gray-600">
                SCB colors and branding integrated throughout
              </p>
            </div>
          </div>
        </div>
        
        {/* Feature Status */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Feature Status</h2>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-gray-700">Logo Display Fixed</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-gray-700">Search Functionality Implemented</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-gray-700">App Grid Working</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-gray-700">Real Notifications with Refresh</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-gray-700">Responsive Design</span>
            </div>
          </div>
        </div>
        
        {/* Demo Instructions */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-300">
          <h3 className="font-medium text-gray-900 mb-3">🚀 Try These Features:</h3>
          <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
            <li>Search for "Vietnam" or "FPT" in the search bar</li>
            <li>Click the grid icon to explore available apps</li>
            <li>Click the bell icon to see notifications</li>
            <li>Click the refresh button in notifications panel</li>
            <li>Try the keyboard shortcuts (↑↓ for navigation, Enter to select)</li>
            <li>Resize your browser to see responsive design</li>
          </ol>
        </div>
      </div>
    </ModernLayout>
  );
}