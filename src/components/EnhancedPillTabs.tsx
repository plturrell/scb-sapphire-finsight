import React, { useState, useEffect } from 'react';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import { haptics } from '@/lib/haptics';

interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
}

interface EnhancedPillTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'default' | 'ios' | 'material';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

/**
 * EnhancedPillTabs - A pill-style tab component with iOS and Material Design variants
 * Optimized for touch interactions with haptic feedback on iOS devices
 */
const EnhancedPillTabs: React.FC<EnhancedPillTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className = ''
}) => {
  const { isDarkMode, preferences } = useUIPreferences();
  const { isAppleDevice } = useDeviceCapabilities();
  const [mounted, setMounted] = useState(false);
  
  // Handle mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Handle tab change with haptic feedback
  const handleTabChange = (tabId: string) => {
    if (tabId === activeTab) return;
    
    // Provide haptic feedback on iOS devices if enabled
    if (isAppleDevice && preferences.enableHaptics) {
      haptics.selection();
    }
    
    onChange(tabId);
  };
  
  // Get size-specific classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs py-1 px-3';
      case 'lg':
        return 'text-base py-2 px-5';
      case 'md':
      default:
        return 'text-sm py-1.5 px-4';
    }
  };
  
  // Get variant-specific classes
  const getVariantClasses = (isActive: boolean) => {
    const baseClasses = 'transition-all duration-200 font-medium rounded-full';
    const sizeClasses = getSizeClasses();
    
    switch (variant) {
      case 'ios':
        return `${baseClasses} ${sizeClasses} ${
          isActive
            ? isDarkMode
              ? 'bg-blue-900/30 text-blue-400'
              : 'bg-blue-50 text-blue-600'
            : isDarkMode
              ? 'text-gray-300 hover:bg-gray-700/30'
              : 'text-gray-600 hover:bg-gray-100'
        }`;
      
      case 'material':
        return `${baseClasses} ${sizeClasses} ${
          isActive
            ? isDarkMode
              ? 'bg-purple-900/30 text-purple-400'
              : 'bg-purple-100 text-purple-700'
            : isDarkMode
              ? 'text-gray-300 hover:bg-gray-700/30'
              : 'text-gray-600 hover:bg-gray-100'
        }`;
      
      case 'default':
      default:
        return `${baseClasses} ${sizeClasses} ${
          isActive
            ? isDarkMode
              ? 'bg-gray-700 text-white'
              : 'bg-gray-900 text-white'
            : isDarkMode
              ? 'text-gray-300 hover:bg-gray-700/30'
              : 'text-gray-600 hover:bg-gray-100'
        }`;
    }
  };
  
  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted) return null;
  
  return (
    <div className={`flex ${fullWidth ? 'w-full' : 'inline-flex'} rounded-full p-1 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabChange(tab.id)}
          className={`${getVariantClasses(tab.id === activeTab)} ${fullWidth ? 'flex-1' : ''} flex items-center justify-center gap-1.5`}
        >
          {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
          <span>{tab.label}</span>
          
          {/* Badge */}
          {tab.badge && (
            <span className={`
              ml-1 text-xs px-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center
              ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}
            `}>
              {typeof tab.badge === 'number' && tab.badge > 99 ? '99+' : tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default EnhancedPillTabs;
