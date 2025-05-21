import React, { useState, useEffect } from 'react';
import useMultiTasking from '../../hooks/useMultiTasking';
import useSafeArea from '../../hooks/useSafeArea';

interface MultiTaskingLayoutProps {
  children: React.ReactNode;
  className?: string;
  adaptiveSpacing?: boolean;
  preserveToolbars?: boolean;
  optimizeForSlideOver?: boolean;
  stageManagerOptimized?: boolean;
  compactNavigation?: React.ReactNode;
  expandedNavigation?: React.ReactNode;
  toolbarItems?: React.ReactNode;
  floatingActionButton?: React.ReactNode;
  onModeChange?: (mode: string) => void;
}

/**
 * Layout component that intelligently adapts to iPadOS multi-tasking modes
 * Optimizes layout for Split View, Slide Over, and Stage Manager
 */
const MultiTaskingLayout: React.FC<MultiTaskingLayoutProps> = ({
  children,
  className = '',
  adaptiveSpacing = true,
  preserveToolbars = true,
  optimizeForSlideOver = true,
  stageManagerOptimized = true,
  compactNavigation,
  expandedNavigation,
  toolbarItems,
  floatingActionButton,
  onModeChange
}) => {
  const { 
    mode,
    sizeClass,
    isMultiTasking,
    windowWidth,
    orientation,
    isStageManager
  } = useMultiTasking();
  
  const { safeArea } = useSafeArea();
  const [previousMode, setPreviousMode] = useState<string>(mode);
  
  // Callback when multi-tasking mode changes
  useEffect(() => {
    if (mode !== previousMode) {
      setPreviousMode(mode);
      onModeChange?.(mode);
    }
  }, [mode, previousMode, onModeChange]);

  // Calculate adaptive spacing based on multi-tasking mode
  const getAdaptiveSpacing = () => {
    if (!adaptiveSpacing) return {};
    
    switch (mode) {
      case 'slide-over':
        return {
          padding: `${safeArea.top}px 8px ${safeArea.bottom}px 8px`,
        };
      case 'split-view':
        return {
          padding: `${safeArea.top}px 16px ${safeArea.bottom}px 16px`,
        };
      case 'stage-manager':
        return {
          padding: `16px 20px 20px 20px`,
        };
      default:
        return {
          padding: `${safeArea.top}px 24px ${safeArea.bottom}px 24px`,
        };
    }
  };

  // Determine which navigation to show based on size class
  const renderNavigation = () => {
    if (sizeClass === 'compact' || (optimizeForSlideOver && mode === 'slide-over')) {
      return compactNavigation ?? null;
    }
    
    return expandedNavigation ?? null;
  };

  // Render toolbar with adaptive positioning
  const renderToolbar = () => {
    if (!toolbarItems || (mode === 'slide-over' && !preserveToolbars)) {
      return null;
    }
    
    return (
      <div className={`
        flex items-center justify-between
        ${mode === 'slide-over' ? 'px-2 h-12' : 'px-4 h-14'}
        ${mode === 'slide-over' ? 'sticky top-0 z-10' : 'relative'}
        bg-white/80 dark:bg-gray-900/80 backdrop-blur-md
      `}>
        {toolbarItems}
      </div>
    );
  };

  // Position floating action button based on multi-tasking mode
  const renderFloatingButton = () => {
    if (!floatingActionButton) return null;
    
    return (
      <div className={`
        fixed z-20
        ${mode === 'slide-over' ? 'bottom-4 right-4' : 'bottom-6 right-6'}
        ${isMultiTasking ? 'scale-90' : 'scale-100'}
        transition-all duration-200
      `} style={{ 
        bottom: `${safeArea.bottom > 0 ? safeArea.bottom : 16}px`
      }}>
        {floatingActionButton}
      </div>
    );
  };

  // Apply stage manager specific styles
  const getStageManagerStyles = () => {
    if (!isStageManager || !stageManagerOptimized) return {};
    
    return {
      borderRadius: '10px',
      overflow: 'hidden',
      boxShadow: '0 0 0 1px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.1)'
    };
  };

  return (
    <div 
      className={`
        relative h-full flex flex-col bg-white dark:bg-gray-900
        ${isMultiTasking ? 'multitasking-active' : ''}
        ${mode} 
        ${className}
      `}
      style={{
        ...getAdaptiveSpacing(),
        ...getStageManagerStyles(),
        maxHeight: isMultiTasking ? '100vh' : undefined,
      }}
      data-multitasking-mode={mode}
      data-orientation={orientation}
    >
      {renderToolbar()}
      
      <div className="flex flex-1 overflow-hidden">
        {renderNavigation()}
        
        <main className={`
          flex-1 overflow-auto
          ${mode === 'slide-over' ? 'pb-16' : ''}
        `}>
          {children}
        </main>
      </div>
      
      {renderFloatingButton()}
    </div>
  );
};

export default MultiTaskingLayout;