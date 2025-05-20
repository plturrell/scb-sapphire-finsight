import React from 'react';
import ModernLayout from '@/components/ModernLayout';
import Image from 'next/image';
import { 
  NavIcon, 
  ChartIcon, 
  AlertIcon, 
  SparklesIcon, 
  SearchIcon, 
  ArrowIcon,
  LoadingIcon 
} from '../components/icons';

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
          <h1 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
            <SparklesIcon className="mr-2" animation="pulse" size={28} />
            Modern Layout with Animated Icons
          </h1>
          <p className="text-gray-600 mb-6">
            This page demonstrates all the enhanced UI features including our new animated icons:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                <SearchIcon animation="none" hoverAnimation hoverEffect="scale" size={20} className="mr-2" color="#1E88E5" />
                Enhanced Search
              </h3>
              <p className="text-sm text-gray-600">
                Try searching for companies in the header search bar with real-time results
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                <NavIcon variant="dashboard" animation="none" hoverAnimation size={20} className="mr-2" color="#43A047" />
                App Finder
              </h3>
              <p className="text-sm text-gray-600">
                Click the grid icon in the header to browse all available apps
              </p>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                <AlertIcon variant="warning" animation="pulse" size={20} className="mr-2" />
                Live Notifications
              </h3>
              <p className="text-sm text-gray-600">
                Click the bell icon for real-time notifications with refresh functionality
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                <ArrowIcon variant="right" animation="wobble" size={20} className="mr-2" color="#9C27B0" />
                Modern UI
              </h3>
              <p className="text-sm text-gray-600">
                Clean design with smooth animations and transitions
              </p>
            </div>
            
            <div className="p-4 bg-indigo-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                <ChartIcon variant="line" animation="none" hoverAnimation hoverEffect="rotate" size={20} className="mr-2" color="#3949AB" />
                SAP Fiori
              </h3>
              <p className="text-sm text-gray-600">
                Consistent styling following SAP Fiori design principles
              </p>
            </div>
            
            <div className="p-4 bg-red-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                <SparklesIcon animation="pulse" size={20} className="mr-2" color="#E53935" />
                SCB Branding
              </h3>
              <p className="text-sm text-gray-600">
                SCB colors and branding integrated throughout
              </p>
            </div>
          </div>
        </div>
        
        {/* Feature Status */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <ChartIcon variant="bar" size={22} className="mr-2" animation="none" hoverAnimation />
            Feature Status
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <ArrowIcon variant="chevron-right" className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-gray-700">Logo Display Fixed</span>
            </div>
            <div className="flex items-center">
              <ArrowIcon variant="chevron-right" className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-gray-700">Search Functionality Implemented</span>
            </div>
            <div className="flex items-center">
              <ArrowIcon variant="chevron-right" className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-gray-700">App Grid Working</span>
            </div>
            <div className="flex items-center">
              <ArrowIcon variant="chevron-right" className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-gray-700">Real Notifications with Refresh</span>
            </div>
            <div className="flex items-center">
              <ArrowIcon variant="chevron-right" className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-gray-700">Responsive Design</span>
            </div>
            <div className="flex items-center">
              <ArrowIcon variant="chevron-right" className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-gray-700">Animated Icons Implemented</span>
            </div>
          </div>
        </div>
        
        {/* Demo Instructions */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-300">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center">
            <SparklesIcon animation="pulse" size={20} className="mr-2" />
            Try These Features:
          </h3>
          <ol className="space-y-2 text-sm text-gray-700 list-none">
            <li className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <ArrowIcon variant="right" size={12} className="text-blue-600" />
              </div>
              <div className="ml-2">Search for "Vietnam" or "FPT" in the search bar</div>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <ArrowIcon variant="right" size={12} className="text-blue-600" />
              </div>
              <div className="ml-2">Click the grid icon to explore available apps</div>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <ArrowIcon variant="right" size={12} className="text-blue-600" />
              </div>
              <div className="ml-2">Click the bell icon to see notifications</div>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <ArrowIcon variant="right" size={12} className="text-blue-600" />
              </div>
              <div className="ml-2">Click the refresh button in notifications panel</div>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <ArrowIcon variant="right" size={12} className="text-blue-600" />
              </div>
              <div className="ml-2">Try the keyboard shortcuts (↑↓ for navigation, Enter to select)</div>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <ArrowIcon variant="right" size={12} className="text-blue-600" />
              </div>
              <div className="ml-2">Resize your browser to see responsive design</div>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <ArrowIcon variant="right" size={12} className="text-blue-600" />
              </div>
              <div className="ml-2">Hover over icons to see hover animations</div>
            </li>
          </ol>
        </div>
        
        {/* Icons Demo */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <SparklesIcon className="mr-2" size={22} animation="pulse" />
            Animated Icons Demo
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="p-3 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <AlertIcon variant="alert" size={32} animation="pulse" />
              <span className="mt-2 text-xs text-gray-600">Alert</span>
            </div>
            
            <div className="p-3 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <AlertIcon variant="warning" size={32} animation="wobble" />
              <span className="mt-2 text-xs text-gray-600">Warning</span>
            </div>
            
            <div className="p-3 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <AlertIcon variant="info" size={32} animation="none" hoverAnimation hoverEffect="scale" />
              <span className="mt-2 text-xs text-gray-600">Info (hover)</span>
            </div>
            
            <div className="p-3 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <ChartIcon variant="line" size={32} animation="none" hoverAnimation />
              <span className="mt-2 text-xs text-gray-600">Line Chart</span>
            </div>
            
            <div className="p-3 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <ChartIcon variant="bar" size={32} animation="none" hoverAnimation />
              <span className="mt-2 text-xs text-gray-600">Bar Chart</span>
            </div>
            
            <div className="p-3 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <ChartIcon variant="pie" size={32} animation="pulse" />
              <span className="mt-2 text-xs text-gray-600">Pie Chart</span>
            </div>
            
            <div className="p-3 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <NavIcon variant="home" size={32} animation="none" hoverAnimation hoverEffect="scale" />
              <span className="mt-2 text-xs text-gray-600">Home</span>
            </div>
            
            <div className="p-3 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <NavIcon variant="analytics" size={32} animation="none" hoverAnimation />
              <span className="mt-2 text-xs text-gray-600">Analytics</span>
            </div>
            
            <div className="p-3 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <NavIcon variant="portfolio" size={32} animation="pulse" />
              <span className="mt-2 text-xs text-gray-600">Portfolio</span>
            </div>
            
            <div className="p-3 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <ArrowIcon variant="up" size={32} animation="bounce" />
              <span className="mt-2 text-xs text-gray-600">Arrow Up</span>
            </div>
            
            <div className="p-3 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <LoadingIcon variant="spinner" size={32} animation="spin" />
              <span className="mt-2 text-xs text-gray-600">Loading</span>
            </div>
            
            <div className="p-3 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <SparklesIcon size={32} animation="pulse" />
              <span className="mt-2 text-xs text-gray-600">Sparkles</span>
            </div>
          </div>
        </div>
      </div>
    </ModernLayout>
  );
}