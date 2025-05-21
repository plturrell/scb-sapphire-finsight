import React, { useState, useEffect } from 'react';
import MultiTaskingLayout from './layout/MultiTaskingLayout';
import MultiTaskingChart from './charts/MultiTaskingChart';
import EnhancedIOSTabBar from './EnhancedIOSTabBar';
import EnhancedAppleTouchButton from './EnhancedAppleTouchButton';
import EnhancedSonomaDialog from './EnhancedSonomaDialog';
import useMultiTasking from '../hooks/useMultiTasking';
import useDragAndDrop from '../hooks/useDragAndDrop';
import useSafeArea from '../hooks/useSafeArea';
import { haptics } from '../lib/haptics';

// Import mock data
import { mockSankeyData } from '../data/mockSankeyData';

interface EnhancedIPadMultiTaskingDashboardProps {
  className?: string;
  initialMode?: 'analytics' | 'reports' | 'settings';
  onModeChange?: (mode: string) => void;
}

/**
 * Enhanced dashboard component optimized for iPad multi-tasking
 * Seamlessly adapts to Split View, Slide Over, and Stage Manager
 */
const EnhancedIPadMultiTaskingDashboard: React.FC<EnhancedIPadMultiTaskingDashboardProps> = ({
  className = '',
  initialMode = 'analytics',
  onModeChange
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialMode);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [selectedChartData, setSelectedChartData] = useState<any>(null);
  const [statePersistence, setStatePersistence] = useState<Record<string, any>>({});
  
  const { 
    mode: multiTaskingMode, 
    sizeClass, 
    isMultiTasking,
    isPrimary,
    hasFocus,
    windowWidth
  } = useMultiTasking();
  
  const { safeArea } = useSafeArea();
  const { registerDropTarget } = useDragAndDrop();
  
  // Handle multi-tasking mode changes
  useEffect(() => {
    // Save current state when multi-tasking mode changes
    setStatePersistence(prev => ({
      ...prev,
      [multiTaskingMode]: {
        activeTab,
        selectedChartData,
        timestamp: Date.now()
      }
    }));
    
    // Fire callback if provided
    if (onModeChange) {
      onModeChange(multiTaskingMode);
    }
    
    // Provide haptic feedback when mode changes
    haptics.selection();
  }, [multiTaskingMode, activeTab, selectedChartData, onModeChange]);
  
  // Configure tab bar based on multi-tasking mode
  const getTabBarItems = () => {
    const items = [
      {
        id: 'analytics',
        label: 'Analytics',
        icon: 'chart.pie.fill',
        badge: 0
      },
      {
        id: 'reports',
        label: 'Reports',
        icon: 'doc.text.fill',
        badge: 3
      },
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'square.grid.2x2.fill',
        badge: 0
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: 'gear',
        badge: 0
      }
    ];
    
    // For very compact views, limit the tabs
    if (multiTaskingMode === 'slide-over' && windowWidth < 350) {
      return items.slice(0, 3);
    }
    
    return items;
  };
  
  // Switch to a tab
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    haptics.light();
  };
  
  // Configure drop target for the entire dashboard
  const dashboardDropProps = registerDropTarget({
    id: 'ipad-dashboard-drop-target',
    types: ['chart', 'data-point', 'file'],
    onDrop: (item, position) => {
      // Handle dropped items from other windows/apps
      if (item.type === 'chart' || item.type === 'data-point') {
        setSelectedChartData(item.payload);
        setIsDialogOpen(true);
        haptics.success();
      }
    }
  });
  
  // Render chart with data
  const renderDashboardChart = (dimensions: any, interactionState: any) => {
    // This is a simplified example, in a real app you'd render different
    // chart types based on data and context
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
        <svg width={dimensions.width} height={dimensions.height}>
          <g transform={`translate(${dimensions.margin.left},${dimensions.margin.top})`}>
            <rect
              width={dimensions.innerWidth}
              height={dimensions.innerHeight}
              fill={interactionState.isMultiTasking ? '#f0f0f0' : '#e0e0e0'}
              rx={8}
              ry={8}
            />
            <text
              x={dimensions.innerWidth / 2}
              y={dimensions.innerHeight / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#666"
              fontSize={interactionState.isCompact ? 12 : 14}
            >
              {interactionState.isMultiTasking ? 'Multi-tasking Chart' : 'Full Screen Chart'}
            </text>
          </g>
        </svg>
      </div>
    );
  };
  
  // Render legend for chart
  const renderChartLegend = (isCompact: boolean) => {
    return (
      <div className={`flex gap-2 items-center ${isCompact ? 'text-xs' : 'text-sm'}`}>
        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
        <span>Revenue</span>
        <span className="w-3 h-3 rounded-full bg-green-500 ml-2"></span>
        <span>Expenses</span>
      </div>
    );
  };
  
  // Render different content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'analytics':
        return (
          <div className="grid gap-4 p-4" style={{ gridTemplateColumns: getGridColumns() }}>
            <div className={`${multiTaskingMode === 'slide-over' ? 'col-span-1' : 'col-span-2'} bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4`}>
              <h2 className="text-lg font-medium mb-4">Performance Metrics</h2>
              <MultiTaskingChart
                data={mockSankeyData}
                chartType="bar"
                title="Revenue by Region"
                subtitle="Quarterly comparison"
                height={200}
                enableDragAndDrop={true}
                renderChart={renderDashboardChart}
                renderLegend={renderChartLegend}
              />
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <h2 className="text-lg font-medium mb-4">Project Status</h2>
              <MultiTaskingChart
                data={mockSankeyData}
                chartType="pie"
                title="Task Completion"
                subtitle="By department"
                height={200}
                enableDragAndDrop={true}
                renderChart={renderDashboardChart}
                renderLegend={renderChartLegend}
              />
            </div>
            
            {multiTaskingMode !== 'slide-over' && (
              <div className="col-span-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                <h2 className="text-lg font-medium mb-4">Financial Overview</h2>
                <MultiTaskingChart
                  data={mockSankeyData}
                  chartType="line"
                  title="Quarterly Results"
                  subtitle="Last 12 months"
                  height={250}
                  enableDragAndDrop={true}
                  renderChart={renderDashboardChart}
                  renderLegend={renderChartLegend}
                />
              </div>
            )}
          </div>
        );
        
      case 'reports':
        return (
          <div className="p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-4">
              <h2 className="text-lg font-medium mb-4">Recent Reports</h2>
              <ul className="space-y-2">
                <li className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex justify-between items-center">
                  <span>Q2 Financial Summary</span>
                  <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-2 py-1 rounded-full">New</span>
                </li>
                <li className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex justify-between items-center">
                  <span>Market Analysis 2025</span>
                  <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 px-2 py-1 rounded-full">Updated</span>
                </li>
                <li className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex justify-between items-center">
                  <span>Operational Efficiency Report</span>
                </li>
              </ul>
            </div>
          </div>
        );
        
      case 'settings':
        return (
          <div className="p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <h2 className="text-lg font-medium mb-4">Dashboard Settings</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Current multi-tasking mode: <strong>{multiTaskingMode}</strong>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Size class: <strong>{sizeClass}</strong>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Window width: <strong>{windowWidth}px</strong>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {isPrimary ? 'Primary window' : 'Secondary window'}
              </p>
              
              <EnhancedAppleTouchButton
                label="Open Dialog"
                variant="primary"
                onClick={() => {
                  setIsDialogOpen(true);
                  haptics.medium();
                }}
                className="mt-4"
              />
            </div>
          </div>
        );
        
      default:
        return (
          <div className="p-4">
            <h2 className="text-lg font-medium">Select a tab</h2>
          </div>
        );
    }
  };
  
  // Helper to determine grid columns based on mode
  const getGridColumns = () => {
    if (multiTaskingMode === 'slide-over') {
      return 'repeat(1, 1fr)';
    }
    if (multiTaskingMode === 'split-view') {
      return isPrimary ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)';
    }
    return 'repeat(3, 1fr)';
  };
  
  // Compact toolbar for very small views
  const renderCompactNavigation = () => {
    return (
      <EnhancedIOSTabBar
        items={getTabBarItems()}
        activeItemId={activeTab}
        onChange={handleTabChange}
        floating={multiTaskingMode === 'slide-over'}
        respectSafeArea={true}
        className="border-t border-gray-200 dark:border-gray-700"
      />
    );
  };
  
  // Expanded sidebar for larger views
  const renderExpandedNavigation = () => {
    return (
      <aside className="w-64 h-full border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
        <div className="p-4">
          <h2 className="text-lg font-semibold">SCB Finance</h2>
          <p className="text-sm text-gray-500">iPad Multi-tasking</p>
        </div>
        
        <nav className="mt-6">
          {getTabBarItems().map(item => (
            <button
              key={item.id}
              className={`
                w-full text-left px-4 py-3 flex items-center gap-3
                ${activeTab === item.id ? 
                  'bg-blue-50 text-blue-600 dark:bg-gray-700 dark:text-blue-300' : 
                  'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}
              `}
              onClick={() => handleTabChange(item.id)}
            >
              <span className={`
                w-8 h-8 flex items-center justify-center rounded-full
                ${activeTab === item.id ? 
                  'bg-blue-100 dark:bg-blue-900' : 
                  'bg-gray-100 dark:bg-gray-600'}
              `}>
                {/* Icon for tab (using placeholder text for example) */}
                {item.icon.charAt(0).toUpperCase()}
              </span>
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>
    );
  };

  return (
    <div
      ref={dashboardDropProps.ref}
      className={`
        h-full w-full
        ${dashboardDropProps.isOver ? 'ring-4 ring-blue-400 ring-opacity-50' : ''}
        ${className}
      `}
    >
      <MultiTaskingLayout
        adaptiveSpacing={true}
        preserveToolbars={true}
        optimizeForSlideOver={true}
        stageManagerOptimized={true}
        compactNavigation={renderCompactNavigation()}
        expandedNavigation={sizeClass !== 'compact' && multiTaskingMode !== 'slide-over' ? renderExpandedNavigation() : undefined}
        toolbarItems={
          <div className="flex justify-between items-center w-full">
            <h1 className={`
              font-medium text-gray-900 dark:text-white
              ${multiTaskingMode === 'slide-over' ? 'text-sm' : 'text-base'}
            `}>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
            {multiTaskingMode !== 'fullscreen' && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {multiTaskingMode}
              </span>
            )}
          </div>
        }
        floatingActionButton={
          multiTaskingMode === 'slide-over' ? (
            <EnhancedAppleTouchButton
              ariaLabel="Add"
              variant="primary"
              isIcon={true}
              label="+"
              onClick={() => {
                setIsDialogOpen(true);
                haptics.medium();
              }}
            />
          ) : undefined
        }
        onModeChange={onModeChange}
      >
        {renderTabContent()}
      </MultiTaskingLayout>
      
      <EnhancedSonomaDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Multi-tasking Information"
        width={multiTaskingMode === 'slide-over' ? '90%' : 500}
        type="sheet"
        position={multiTaskingMode === 'slide-over' ? 'bottom' : 'center'}
      >
        <div className="p-6">
          <p className="mb-4">
            Current multi-tasking mode: <strong>{multiTaskingMode}</strong>
          </p>
          
          <p className="mb-4">
            This component is fully optimized for iPad multi-tasking modes including Split View,
            Slide Over, and Stage Manager. It provides adaptive layouts, proper safe area
            handling, and cross-window drag and drop support.
          </p>
          
          {selectedChartData && (
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <h4 className="font-medium mb-2">Received Chart Data:</h4>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(selectedChartData, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="mt-6 flex justify-end">
            <EnhancedAppleTouchButton
              label="Close"
              variant="secondary"
              onClick={() => {
                setIsDialogOpen(false);
                haptics.light();
              }}
            />
          </div>
        </div>
      </EnhancedSonomaDialog>
    </div>
  );
};

export default EnhancedIPadMultiTaskingDashboard;