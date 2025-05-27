import React, { useState, useEffect } from 'react';
import PerfectLayout from './PerfectLayout';
import IntelligentDefaults from './IntelligentDefaults';
import { useUIPreferences } from '@/context/UIPreferencesContext';

/**
 * EnhancedLayout - Now powered by Perfect Design System
 * 
 * This layout has been transformed to embody Jony Ive's design philosophy:
 * - Purposeful reduction of visual noise
 * - Intelligent defaults that adapt to context
 * - Effortless interaction patterns
 * - Beautiful proportions and spacing
 * - Coherent experience across all touchpoints
 */

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  context?: 'focus' | 'browse' | 'analyze';
  showNavigation?: boolean;
  // Legacy props for backward compatibility
  showSideMenu?: boolean;
  showHeader?: boolean;
  headerStyle?: 'white' | 'blue';
  sidebarExpanded?: boolean;
}

const EnhancedLayout: React.FC<LayoutProps> = ({
  children,
  title,
  context = 'browse',
  showNavigation = true,
  // Legacy props - ignored in perfect design
  showSideMenu,
  showHeader,
  headerStyle,
  sidebarExpanded
}) => {
  const { preferences } = useUIPreferences();
  const [showIntelligentDefaults, setShowIntelligentDefaults] = useState(false);

  // Check if this is a first-time user or if intelligent defaults should run
  useEffect(() => {
    const shouldShowDefaults = !preferences.hasBeenCustomized && 
                              Object.keys(preferences).length <= 2; // Only has basic defaults
    
    setShowIntelligentDefaults(shouldShowDefaults);
  }, [preferences]);

  // Intelligent context detection based on title and current state
  const getIntelligentContext = () => {
    if (!title) return context;
    
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('analytic') || 
        titleLower.includes('simulation') || 
        titleLower.includes('monte carlo') ||
        titleLower.includes('trading')) {
      return 'analyze';
    }
    
    if (titleLower.includes('focus') || 
        titleLower.includes('detail')) {
      return 'focus';
    }
    
    return 'browse';
  };

  const intelligentContext = getIntelligentContext();

  return (
    <>
      {/* Intelligent Setup for New Users */}
      {showIntelligentDefaults && (
        <IntelligentDefaults 
          onDefaultsApplied={() => setShowIntelligentDefaults(false)}
        />
      )}
      
      {/* Perfect Layout System */}
      <PerfectLayout
        title={title}
        context={intelligentContext}
        showNavigation={showNavigation && !showIntelligentDefaults}
      >
        {children}
      </PerfectLayout>
    </>
  );
};

export default EnhancedLayout;