import React, { useState } from 'react';
import { IconSystemProvider } from '../components/IconSystem';
import EnhancedIOSTabBar from '../components/EnhancedIOSTabBar';
import EnhancedIOSBreadcrumb from '../components/EnhancedIOSBreadcrumb';
import EnhancedIOSNavBar from '../components/EnhancedIOSNavBar';
import { ICONS } from '../components/IconSystem';
import EnhancedIOSIcon from '../components/EnhancedIOSIcon';
import { useDeviceCapabilities } from '../hooks/useDeviceCapabilities';
import { useRouter } from 'next/router';

/**
 * iOS Navigation Demo Page
 * 
 * Showcases the iOS-style navigation with SF Symbols integration
 */
export default function IOSNavigationDemo() {
  const router = useRouter();
  // Initialize the active tab from the URL query or default to 'home'
  const initialTab = router.query.tab as string || 'home';
  const [activeTab, setActiveTab] = useState(initialTab);
  const { isAppleDevice, deviceType, prefersColorScheme } = useDeviceCapabilities();
  const isDark = prefersColorScheme === 'dark';
  const isIOS = isAppleDevice && deviceType === 'mobile';
  
  // Update active tab when URL changes
  React.useEffect(() => {
    const tabFromQuery = router.query.tab as string;
    if (tabFromQuery) {
      setActiveTab(tabFromQuery);
    }
  }, [router.query]);
  
  // Generate breadcrumbs based on the active tab
  const getBreadcrumbs = () => {
    const basePath = [
      { label: 'Home', href: '/ios-navigation-demo?tab=home', icon: 'house' }
    ];
    
    switch(activeTab) {
      case 'search':
        return [
          ...basePath,
          { label: 'Search', href: '/ios-navigation-demo?tab=search', icon: 'magnifyingglass' }
        ];
      case 'analytics':
        return [
          ...basePath,
          { label: 'Analytics', href: '/ios-navigation-demo?tab=analytics', icon: 'chart.bar.xaxis' }
        ];
      case 'profile':
        return [
          ...basePath,
          { label: 'Profile', href: '/ios-navigation-demo?tab=profile', icon: 'person.crop.circle' }
        ];
      case 'settings':
        return [
          ...basePath,
          { label: 'Settings', href: '/ios-navigation-demo?tab=settings', icon: 'gear' }
        ];
      default:
        return basePath;
    }
  };

  // Define tabs with SF Symbol names
  const tabs = [
    {
      key: 'home',
      label: 'Home',
      icon: ICONS.HOME,
      href: '/ios-navigation-demo?tab=home',
      sfSymbolVariant: 'fill',
    },
    {
      key: 'search',
      label: 'Search',
      icon: ICONS.SEARCH,
      href: '/ios-navigation-demo?tab=search',
    },
    {
      key: 'analytics',
      label: 'Analytics',
      icon: 'chart.bar.xaxis',
      activeIcon: 'chart.bar.fill.xaxis',
      href: '/ios-navigation-demo?tab=analytics',
      badge: 3,
    },
    {
      key: 'profile',
      label: 'Profile',
      icon: ICONS.USER,
      href: '/ios-navigation-demo?tab=profile',
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: ICONS.SETTINGS,
      href: '/ios-navigation-demo?tab=settings',
    },
  ];

  // Handle tab changes - update URL query param to ensure proper history and deeplinks
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    router.push(`/ios-navigation-demo?tab=${key}`, undefined, { shallow: true });
  };

  // Mock content for each tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="flex flex-col items-center p-6">
            <EnhancedIOSIcon 
              name="house.fill" 
              size={64} 
              renderingMode="hierarchical" 
              animated={true}
              role="decoration"
            />
            <h1 className="text-2xl font-bold mt-4">Home</h1>
            <p className="mt-2 text-center">Welcome to the iOS navigation demo!</p>
          </div>
        );
      case 'search':
        return (
          <div className="flex flex-col items-center p-6">
            <EnhancedIOSIcon 
              name="magnifyingglass" 
              size={64} 
              renderingMode="hierarchical" 
              variant="enclosedcircle"
              role="decoration"
            />
            <h1 className="text-2xl font-bold mt-4">Search</h1>
            <p className="mt-2 text-center">Search for companies and data with SF Symbols.</p>
          </div>
        );
      case 'analytics':
        return (
          <div className="flex flex-col items-center p-6">
            <EnhancedIOSIcon 
              name="chart.bar.fill.xaxis" 
              size={64} 
              renderingMode="hierarchical" 
              role="decoration"
            />
            <h1 className="text-2xl font-bold mt-4">Analytics</h1>
            <p className="mt-2 text-center">View your analytics and reports with beautiful SF Symbol charts.</p>
          </div>
        );
      case 'profile':
        return (
          <div className="flex flex-col items-center p-6">
            <EnhancedIOSIcon 
              name="person.crop.circle.fill" 
              size={64} 
              renderingMode="hierarchical" 
              role="decoration"
            />
            <h1 className="text-2xl font-bold mt-4">Profile</h1>
            <p className="mt-2 text-center">Manage your profile and preferences.</p>
          </div>
        );
      case 'settings':
        return (
          <div className="flex flex-col items-center p-6">
            <EnhancedIOSIcon 
              name="gear" 
              size={64} 
              renderingMode="hierarchical" 
              animated={true}
              animationVariant="pulse"
              role="decoration"
            />
            <h1 className="text-2xl font-bold mt-4">Settings</h1>
            <p className="mt-2 text-center">Configure your application settings.</p>
          </div>
        );
      default:
        return <div>Select a tab</div>;
    }
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  return (
    <IconSystemProvider>
      <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        {/* iOS Navigation Bar */}
        <EnhancedIOSNavBar 
          title={`${isIOS ? 'iOS' : 'Cross-Platform'} Navigation`}
          subtitle="SF Symbols Integration"
          largeTitle={true}
          blurred={true}
          showBackButton={true}
          theme={isDark ? 'dark' : 'light'}
          rightActions={[
            {
              icon: 'person.crop.circle',
              label: 'Profile',
              onPress: () => handleTabChange('profile')
            },
            {
              icon: 'gear',
              label: 'Settings',
              onPress: () => handleTabChange('settings')
            }
          ]}
          respectSafeArea={true}
          hapticFeedback={true}
          animateTitle={true}
        />
        
        {/* Breadcrumb Navigation */}
        <div className={`px-4 py-2 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <EnhancedIOSBreadcrumb 
            items={getBreadcrumbs()}
            showIcons={true}
            hapticFeedback={true}
            separator="chevron"
            theme={isDark ? 'dark' : 'light'}
          />
        </div>

        <main className="pb-20" style={{ paddingBottom: isIOS ? '80px' : '76px' }}>
          {/* Tab content */}
          {renderTabContent()}

          {/* SF Symbols showcase */}
          <div className={`mt-8 p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <h2 className="text-xl font-bold mb-4">SF Symbols Integration</h2>
            <div className="grid grid-cols-5 gap-4">
              <div className="flex flex-col items-center">
                <EnhancedIOSIcon 
                  name="creditcard.fill" 
                  size={36} 
                  renderingMode="hierarchical" 
                  role="decoration"
                />
                <span className="text-xs mt-1">creditcard.fill</span>
              </div>
              <div className="flex flex-col items-center">
                <EnhancedIOSIcon 
                  name="chart.pie.fill" 
                  size={36} 
                  renderingMode="hierarchical" 
                  role="decoration"
                />
                <span className="text-xs mt-1">chart.pie.fill</span>
              </div>
              <div className="flex flex-col items-center">
                <EnhancedIOSIcon 
                  name="dollarsign.circle.fill" 
                  size={36} 
                  renderingMode="hierarchical" 
                  role="decoration"
                />
                <span className="text-xs mt-1">dollarsign.circle</span>
              </div>
              <div className="flex flex-col items-center">
                <EnhancedIOSIcon 
                  name="building.columns.fill" 
                  size={36} 
                  renderingMode="hierarchical" 
                  role="decoration"
                />
                <span className="text-xs mt-1">building.columns</span>
              </div>
              <div className="flex flex-col items-center">
                <EnhancedIOSIcon 
                  name="globe.americas.fill" 
                  size={36} 
                  renderingMode="hierarchical" 
                  role="decoration"
                />
                <span className="text-xs mt-1">globe.americas</span>
              </div>
            </div>
          </div>

          <div className={`mt-6 p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <h2 className="text-xl font-bold mb-4">iOS Navigation Bar</h2>
            <p className="mb-4">
              iOS-styled navigation bars with adaptive titles, dynamic coloring, and SF Symbols integration.
            </p>
            
            <div className="mt-4 space-y-6">
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                <h3 className="font-semibold mb-4">Standard Navigation Bar</h3>
                <div className="relative rounded-lg overflow-hidden">
                  <EnhancedIOSNavBar 
                    title="Financials"
                    showBackButton={true}
                    theme={isDark ? 'dark' : 'light'}
                    position="relative"
                    respectSafeArea={false}
                    rightActions={[
                      {
                        icon: 'square.and.arrow.up',
                        label: 'Share',
                        onPress: () => {}
                      }
                    ]}
                  />
                </div>
              </div>
              
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                <h3 className="font-semibold mb-4">Large Title Navigation Bar</h3>
                <div className="relative rounded-lg overflow-hidden">
                  <EnhancedIOSNavBar 
                    title="Dashboard"
                    largeTitle={true}
                    theme={isDark ? 'dark' : 'light'}
                    position="relative"
                    respectSafeArea={false}
                    rightActions={[
                      {
                        icon: 'ellipsis.circle',
                        label: 'More',
                        onPress: () => {}
                      }
                    ]}
                  />
                </div>
              </div>
              
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                <h3 className="font-semibold mb-4">Navigation Bar with Multiple Actions</h3>
                <div className="relative rounded-lg overflow-hidden">
                  <EnhancedIOSNavBar 
                    title="Settings"
                    theme={isDark ? 'dark' : 'light'}
                    position="relative"
                    respectSafeArea={false}
                    showBackButton={true}
                    rightActions={[
                      {
                        icon: 'trash',
                        label: 'Delete',
                        onPress: () => {},
                        variant: 'destructive'
                      },
                      {
                        icon: 'square.and.pencil',
                        label: 'Edit',
                        onPress: () => {},
                        variant: 'primary'
                      }
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className={`mt-6 p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <h2 className="text-xl font-bold mb-4">iOS Breadcrumb Navigation</h2>
            <p className="mb-4">
              Our breadcrumb navigation uses SF Symbols and adapts to different screen sizes.
              It automatically truncates on small screens and supports various separator styles.
            </p>
            
            <div className="mt-4 space-y-6">
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <h3 className="font-semibold mb-2">Standard Breadcrumb</h3>
                <EnhancedIOSBreadcrumb
                  items={[
                    { label: 'Home', href: '#', icon: 'house' },
                    { label: 'Analytics', href: '#', icon: 'chart.bar' },
                    { label: 'Reports', href: '#', icon: 'doc.text' },
                    { label: 'Financial', href: '#', icon: 'dollarsign.circle' }
                  ]}
                  showIcons={true}
                  theme={isDark ? 'dark' : 'light'}
                />
              </div>
              
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <h3 className="font-semibold mb-2">Breadcrumb with Slash Separator</h3>
                <EnhancedIOSBreadcrumb
                  items={[
                    { label: 'Dashboard', href: '#', icon: 'gauge' },
                    { label: 'Settings', href: '#', icon: 'gear' },
                    { label: 'Profile', href: '#', icon: 'person' }
                  ]}
                  showIcons={true}
                  separator="slash"
                  theme={isDark ? 'dark' : 'light'}
                />
              </div>
              
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <h3 className="font-semibold mb-2">Compact Breadcrumb</h3>
                <EnhancedIOSBreadcrumb
                  items={[
                    { label: 'Home', href: '#', icon: 'house' },
                    { label: 'Projects', href: '#', icon: 'folder' },
                    { label: 'Finance', href: '#', icon: 'banknote' },
                    { label: 'Reports', href: '#', icon: 'doc.text' },
                    { label: '2025', href: '#', icon: 'calendar' },
                    { label: 'Q1', href: '#', icon: 'number.circle.1' }
                  ]}
                  showIcons={true}
                  compact={true}
                  maxItems={4}
                  theme={isDark ? 'dark' : 'light'}
                />
              </div>
            </div>
          </div>
          
          <div className={`mt-6 p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <h2 className="text-xl font-bold mb-4">Cross-Platform Compatibility</h2>
            <p className="mb-4">
              Our SF Symbols integration provides native icons on iOS/iPadOS devices
              and automatically falls back to equivalent icons on other platforms.
            </p>
            <div className="flex flex-wrap gap-4 mt-4">
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="flex items-center gap-2">
                  <EnhancedIOSIcon 
                    name="iphone" 
                    size={18} 
                    renderingMode="hierarchical" 
                    role="decoration"
                  />
                  <span>iOS</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="flex items-center gap-2">
                  <EnhancedIOSIcon 
                    name="ipad" 
                    size={18} 
                    renderingMode="hierarchical" 
                    role="decoration"
                  />
                  <span>iPadOS</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="flex items-center gap-2">
                  <EnhancedIOSIcon 
                    name="desktopcomputer" 
                    size={18} 
                    renderingMode="hierarchical" 
                    role="decoration"
                  />
                  <span>Desktop</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="flex items-center gap-2">
                  <EnhancedIOSIcon 
                    name="laptopcomputer" 
                    size={18} 
                    renderingMode="hierarchical" 
                    role="decoration"
                  />
                  <span>macOS</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* iOS-style Tab Bar with SF Symbols */}
        <EnhancedIOSTabBar 
          items={tabs}
          currentTab={activeTab}
          onChange={handleTabChange}
          blurred={true}
          floating={isIOS}
          hapticFeedback={true}
          showLabels={true}
          theme={isDark ? 'dark' : 'light'}
          respectSafeArea={true}
          adaptForStage={true}
        />
      </div>
    </IconSystemProvider>
  );
}