import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { Icons } from '../IconExports';
import {
  LayoutDashboard,
  BarChart3,
  Target,
  FileText,
  Settings,
  Building2,
  Database,
  Activity,
  // Zap imported from Icons
  AlertTriangle,
  // Calculator imported from Icons
  MapPin,
  Book,
  Terminal,
  HelpCircle,
  TrendingUp,
  DollarSign,
  Wallet,
  Globe,
  Search,
  ShieldAlert,
  Layers,
  PackageOpen,
  Cpu,
  Smartphone,
  TabletSmartphone,
  MonitorSmartphone,
  Sparkles
} from 'lucide-react';

// Define the navigation item interface
interface NavigationItem {
  id: string;
  name: string;
  href: string;
  icon: React.ElementType;
  category: string;
  isMobile?: boolean;
  isTest?: boolean;
  isNew?: boolean;
}

// Comprehensive app catalog with all available pages
const allNavigationItems: NavigationItem[] = [
  // Main Navigation
  { id: 'dashboard', name: 'Dashboard', href: '/', icon: LayoutDashboard, category: 'Main' },
  { id: 'analytics', name: 'Analytics', href: '/analytics', icon: BarChart3, category: 'Main' },
  { id: 'portfolio', name: 'Portfolio', href: '/portfolio', icon: Target, category: 'Main' },
  { id: 'reports', name: 'Reports', href: '/reports', icon: FileText, category: 'Main' },
  { id: 'investments', name: 'Investments', href: '/investments', icon: Wallet, category: 'Main', isNew: true },
  { id: 'settings', name: 'Settings', href: '/settings', icon: Settings, category: 'Main' },
  
  // Finance
  { id: 'trading', name: 'Trading Desk', href: '/trading', icon: TrendingUp, category: 'Finance' },
  { id: 'risk', name: 'Risk Management', href: '/risk', icon: ShieldAlert, category: 'Finance' },
  { id: 'financial-sim', name: 'Financial Simulator', href: '/financial-simulation', icon: Icons.Calculator, category: 'Finance' },
  
  // Data Products
  { id: 'data-explorer', name: 'Data Explorer', href: '/data-explorer', icon: Database, category: 'Data' },
  { id: 'data-products', name: 'Data Products', href: '/data-products', icon: Layers, category: 'Data' },
  { id: 'sankey', name: 'Sankey Visualization', href: '/sankey-demo', icon: Activity, category: 'Data' },
  { id: 'knowledge', name: 'Knowledge Dashboard', href: '/knowledge-dashboard', icon: Icons.Book, category: 'Data' },
  
  // Research
  { id: 'company-search', name: 'Company Search', href: '/companies', icon: Building2, category: 'Research' },
  { id: 'semantic-tariff', name: 'Semantic Tariff', href: '/semantic-tariff-engine', icon: Search, category: 'Research' },
  { id: 'tariff-scanner', name: 'Tariff Scanner', href: '/tariff-scanner', icon: Search, category: 'Research' },
  { id: 'tariff-alerts', name: 'Tariff Alerts', href: '/tariff-alerts', icon: AlertTriangle, category: 'Research' },
  
  // Vietnam Research
  { id: 'vietnam-dashboard', name: 'Vietnam Dashboard', href: '/vietnam-tariff-dashboard', icon: Icons.MapPin, category: 'Vietnam' },
  { id: 'vietnam-monte-carlo', name: 'Monte Carlo Sim', href: '/vietnam-monte-carlo', icon: Icons.Zap, category: 'Vietnam' },
  { id: 'vietnam-monte-carlo-enhanced', name: 'Enhanced Monte Carlo', href: '/vietnam-monte-carlo-enhanced', icon: Icons.Zap, category: 'Vietnam' },
  { id: 'vietnam-tariff-impact', name: 'Tariff Impact', href: '/vietnam-tariff-impact', icon: Globe, category: 'Vietnam' },
  
  // Tools & Utilities
  { id: 'api-explorer', name: 'API Explorer', href: '/api-explorer', icon: Terminal, category: 'Tools' },
  { id: 'notifications', name: 'Notifications', href: '/notifications', icon: AlertTriangle, category: 'Tools' },
  { id: 'help', name: 'Help Center', href: '/help', icon: HelpCircle, category: 'Tools' },
  
  // Mobile & Tablet
  { id: 'mobile', name: 'Mobile View', href: '/mobile', icon: Smartphone, category: 'Mobile', isMobile: true },
  { id: 'mobile-navigation', name: 'Mobile Navigation', href: '/mobile-navigation-test', icon: Smartphone, category: 'Mobile', isMobile: true, isTest: true },
  { id: 'ios-navigation', name: 'iOS Navigation', href: '/ios-navigation-demo', icon: Smartphone, category: 'Mobile', isMobile: true, isTest: true },
  { id: 'ios-visualization', name: 'iOS Visualization', href: '/ios-visualization', icon: Smartphone, category: 'Mobile', isMobile: true },
  { id: 'ipad-multi', name: 'iPad Multi-tasking', href: '/ipad-multi-tasking', icon: TabletSmartphone, category: 'Mobile', isMobile: true },
  { id: 'icon-system', name: 'Icon System Demo', href: '/icon-system-demo', icon: MonitorSmartphone, category: 'Mobile', isMobile: true, isTest: true },
  
  // AI & Testing
  { id: 'perplexity-test', name: 'Perplexity Test', href: '/perplexity-test', icon: Sparkles, category: 'AI', isTest: true },
  { id: 'perplexity-central', name: 'Perplexity Central', href: '/perplexity-central-test', icon: Sparkles, category: 'AI', isTest: true },
  { id: 'perplexity-keys', name: 'Perplexity Keys', href: '/perplexity-keys-test', icon: Sparkles, category: 'AI', isTest: true },
  { id: 'perplexity-migration', name: 'Perplexity Migration', href: '/perplexity-migration-test', icon: Sparkles, category: 'AI', isTest: true },
  { id: 'test-modern', name: 'Modern UI Test', href: '/test-modern', icon: Cpu, category: 'Testing', isTest: true },
  { id: 'test-navigation', name: 'Navigation Test', href: '/test-navigation', icon: Layers, category: 'Testing', isTest: true, isNew: true },
];

// Props for the navigation component
interface AppNavigationLinksProps {
  condensed?: boolean;
  showLabels?: boolean;
  showIcons?: boolean;
  filterTest?: boolean; // Whether to filter out test pages
  filterMobile?: boolean; // Whether to filter out mobile pages
  filterCategory?: string; // Only show items from this category
  onClick?: (navItem: NavigationItem) => void; // Optional click handler
  enableHaptics?: boolean; // Whether to enable haptic feedback
}

const AppNavigationLinks: React.FC<AppNavigationLinksProps> = ({
  condensed = false,
  showLabels = true,
  showIcons = true,
  filterTest = true,
  filterMobile = false,
  filterCategory,
  onClick,
  enableHaptics = false
}) => {
  const router = useRouter();
  const { isDarkMode } = useUIPreferences();
  
  // Filter navigation items based on props
  const filteredItems = allNavigationItems.filter(item => {
    if (filterTest && item.isTest) return false;
    if (filterMobile && item.isMobile) return false;
    if (filterCategory && item.category !== filterCategory) return false;
    return true;
  });
  
  // Group items by category
  const groupedItems: Record<string, NavigationItem[]> = {};
  
  filteredItems.forEach(item => {
    if (!groupedItems[item.category]) {
      groupedItems[item.category] = [];
    }
    groupedItems[item.category].push(item);
  });
  
  // Get all categories
  const categories = Object.keys(groupedItems);
  
  // Helper function to determine if a route is active
  const isActive = (href: string) => {
    if (href === '/' && router.pathname !== '/') return false;
    return router.pathname === href || router.pathname.startsWith(`${href}/`);
  };

  const getDefaultCategoryStyle = (expanded: boolean) => {
    return `${expanded ? 'px-4 py-2' : 'px-2 py-1.5'} ${
      isDarkMode ? 'text-gray-400' : 'text-gray-500'
    } text-xs font-medium uppercase tracking-wider`;
  };

  const getDefaultItemStyle = (active: boolean, expanded: boolean) => {
    return `flex items-center ${expanded ? 'px-4 py-2.5' : 'px-3 py-2 justify-center'} ${
      active 
        ? isDarkMode 
          ? 'bg-blue-900/30 text-white' 
          : 'bg-blue-50 text-blue-700'
        : isDarkMode 
          ? 'text-gray-300 hover:bg-gray-800' 
          : 'text-gray-700 hover:bg-gray-100'
    } rounded-md transition-colors ${expanded ? '' : 'w-full'} ${
      enableHaptics ? 'active:scale-[0.98] transition-transform' : ''
    }`;
  };

  return (
    <nav className={`flex-1 overflow-y-auto ${condensed ? 'py-0' : 'py-2'}`}>
      {categories.map((category) => (
        <div key={category} className={`${condensed ? 'mb-0' : 'mb-4'}`}>
          {/* Category Header - only show if expanded and not condensed */}
          {!condensed && (
            <h3 className={getDefaultCategoryStyle(showLabels)}>{category}</h3>
          )}
          
          {/* Items in this category */}
          <div className={`
            ${condensed 
              ? 'flex flex-row items-center justify-around gap-1 px-1 py-2' 
              : 'mt-1 space-y-1'
            }
          `}>
            {groupedItems[category].map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`
                    ${condensed 
                      ? `flex flex-col items-center ${active 
                          ? isDarkMode 
                            ? 'text-white' 
                            : 'text-blue-700' 
                          : isDarkMode 
                            ? 'text-gray-300' 
                            : 'text-gray-600'
                        } px-2 py-1 rounded-md transition-colors ${
                          enableHaptics ? 'active:scale-[0.98] transition-transform' : ''
                        }`
                      : getDefaultItemStyle(active, showLabels)
                    }
                  `}
                  title={!showLabels ? item.name : undefined}
                  onClick={() => onClick && onClick(item)}
                >
                  {showIcons && (
                    <item.icon className={`flex-shrink-0 ${
                      condensed ? 'w-6 h-6 mb-1' : 'w-5 h-5 mr-3'
                    } ${active ? (isDarkMode ? 'text-white' : 'text-blue-700') : ''}`} />
                  )}
                  
                  {showLabels && (
                    <span className={`truncate ${condensed ? 'text-xs' : ''}`}>{item.name}</span>
                  )}
                  
                  {/* New badge - not shown in condensed mode for cleaner UI */}
                  {item.isNew && showLabels && !condensed && (
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                      isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'
                    }`}>
                      New
                    </span>
                  )}
                  
                  {/* Dot indicator for new items in condensed mode */}
                  {item.isNew && condensed && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
};

export default AppNavigationLinks;