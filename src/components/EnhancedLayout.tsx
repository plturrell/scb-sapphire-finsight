import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { 
  LayoutDashboard, BarChart3, Target, FileText, Settings, 
  Search, Bell, User, Menu, HelpCircle, ChevronDown, 
  PlusSquare, LogOut, Info, Grid, X, Home, PieChart, 
  RefreshCcw, Building2, Globe, Shield, AlertTriangle, 
  Activity, TrendingUp, Layers, Database, Terminal, Sparkles,
  LineChart, AlertCircle, CheckCircle, Package
} from 'lucide-react';
import { Icons } from './IconExports';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import AppNavigationLinks from './layout/AppNavigationLinks';

/**
 * EnhancedLayout provides a consistent layout system for all pages in the application
 * It combines the functionality of ModernLayout and DashboardLayout into a single
 * consolidated component to ensure a consistent navigation experience.
 * 
 * This component integrates with UIPreferencesContext to respect user preferences
 * for layout, theme, and interactions while maintaining backward compatibility
 * through props.
 */

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showSideMenu?: boolean;
  showHeader?: boolean;
  headerStyle?: 'white' | 'blue';
  sidebarExpanded?: boolean;
}

interface AppItem {
  id: string;
  name: string;
  icon: React.ElementType;
  href: string;
  category: string;
  color: string;
  description: string;
}

interface Notification {
  id: string;
  type: 'alert' | 'success' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

// Primary navigation for sidebar
const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Portfolio', href: '/portfolio', icon: Target },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

// Mobile-specific navigation
const mobileNav = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Analytics', href: '/analytics', icon: PieChart },
  { name: 'Portfolio', href: '/portfolio', icon: Target },
  { name: 'Reports', href: '/reports', icon: FileText },
];

// Comprehensive app catalog (same as in ModernLayout)
const appCatalog: AppItem[] = [
  // Finance Apps
  { id: 'portfolio', name: 'Portfolio Manager', icon: Icons.Briefcase, href: '/portfolio', category: 'Finance', color: 'bg-blue-500', description: 'Manage investment portfolios' },
  { id: 'analytics', name: 'Financial Analytics', icon: LineChart, href: '/analytics', category: 'Finance', color: 'bg-green-500', description: 'Advanced financial analysis' },
  { id: 'trading', name: 'Trading Desk', icon: TrendingUp, href: '/trading', category: 'Finance', color: 'bg-purple-500', description: 'Real-time trading platform' },
  { id: 'risk', name: 'Risk Management', icon: Shield, href: '/risk', category: 'Finance', color: 'bg-red-500', description: 'Risk assessment tools' },
  
  // Data Products
  { id: 'data-explorer', name: 'Data Explorer', icon: Database, href: '/data-explorer', category: 'Data', color: 'bg-indigo-500', description: 'Browse data products' },
  { id: 'sankey', name: 'Sankey Visualization', icon: Activity, href: '/sankey-demo', category: 'Data', color: 'bg-teal-500', description: 'Flow visualization' },
  { id: 'montecarlo', name: 'Monte Carlo Sim', icon: Icons.Zap, href: '/vietnam-monte-carlo-enhanced', category: 'Data', color: 'bg-orange-500', description: 'Probability simulations' },
  
  // Reports & Documents
  { id: 'reports', name: 'Report Builder', icon: FileText, href: '/reports', category: 'Reports', color: 'bg-gray-600', description: 'Generate custom reports' },
  { id: 'tariff-alerts', name: 'Tariff Alerts', icon: AlertTriangle, href: '/tariff-alerts', category: 'Reports', color: 'bg-yellow-500', description: 'Trade tariff monitoring' },
  { id: 'financial-sim', name: 'Financial Simulator', icon: Icons.Calculator, href: '/financial-simulation', category: 'Reports', color: 'bg-pink-500', description: 'Financial modeling' },
  
  // Companies & Research
  { id: 'company-search', name: 'Company Search', icon: Building2, href: '/companies', category: 'Research', color: 'bg-cyan-500', description: 'Search S&P companies' },
  { id: 'vietnam-dashboard', name: 'Vietnam Dashboard', icon: Icons.MapPin, href: '/vietnam-tariff-dashboard', category: 'Research', color: 'bg-emerald-500', description: 'Vietnam market insights' },
  { id: 'knowledge', name: 'Knowledge Base', icon: Icons.Book, href: '/knowledge-dashboard', category: 'Research', color: 'bg-violet-500', description: 'Research repository' },
  
  // Tools & Utilities
  { id: 'api-explorer', name: 'API Explorer', icon: Terminal, href: '/api-explorer', category: 'Tools', color: 'bg-slate-600', description: 'Test API endpoints' },
  { id: 'settings', name: 'Settings', icon: Settings, href: '/settings', category: 'Tools', color: 'bg-gray-500', description: 'System configuration' },
  { id: 'help', name: 'Help Center', icon: HelpCircle, href: '/help', category: 'Tools', color: 'bg-blue-400', description: 'Documentation & support' },
];

const EnhancedLayout: React.FC<LayoutProps> = ({ 
  children, 
  title = 'SCB Sapphire', 
  showSideMenu = true,
  showHeader = true,
  headerStyle: propHeaderStyle = 'white',
  sidebarExpanded: propSidebarExpanded = true
}) => {
  // Use the UI preferences context
  const { preferences, isDarkMode } = useUIPreferences();
  
  const router = useRouter();
  
  // Use preferences from context with props as fallback for backward compatibility
  const headerStyle = preferences.headerStyle || propHeaderStyle;
  const sidebarExpanded = preferences.sidebarExpanded !== undefined ? preferences.sidebarExpanded : propSidebarExpanded;
  
  const [sidebarOpen, setSidebarOpen] = useState(sidebarExpanded);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [appFinderOpen, setAppFinderOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredApps, setFilteredApps] = useState(appCatalog);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Categories for App Finder
  const categories = ['All', ...Array.from(new Set(appCatalog.map(app => app.category)))];
  
  // Helper function for haptic feedback
  const triggerHaptics = () => {
    if (!preferences.enableHaptics) return;
    
    // Use navigator.vibrate if available (most mobile browsers)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };
  
  // Get CSS classes for layout density
  const getDensityClasses = () => {
    switch (preferences.layoutDensity) {
      case 'compact':
        return 'p-2 lg:p-3 space-y-2';
      case 'spacious':
        return 'p-6 lg:p-8 space-y-6';
      case 'comfortable':
      default:
        return 'p-4 lg:p-6 space-y-4';
    }
  };
  
  // Get CSS classes for font size
  const getFontSizeClasses = () => {
    switch (preferences.fontSize) {
      case 'small':
        return 'text-xs lg:text-sm';
      case 'large':
        return 'text-base lg:text-lg';
      case 'medium':
      default:
        return 'text-sm lg:text-base';
    }
  };
  
  // Get animation classes based on preferences
  const getAnimationClasses = (animation: string) => {
    return preferences.enableAnimations ? animation : '';
  };

  // Initialize notifications
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Use mock data as fallback
      setNotifications([
        {
          id: '1',
          type: 'alert',
          title: 'Portfolio Alert',
          message: 'Your tech sector allocation is above threshold',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          read: false,
          actionUrl: '/portfolio'
        },
        {
          id: '2',
          type: 'success',
          title: 'Report Generated',
          message: 'Q2 Financial Analysis is ready to view',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          read: false,
          actionUrl: '/reports'
        },
        {
          id: '3',
          type: 'warning',
          title: 'Market Update',
          message: 'Market volatility has increased by 15%',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          read: true
        },
        {
          id: '4',
          type: 'info',
          title: 'New Feature',
          message: 'Monte Carlo simulations now available',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          read: true,
          actionUrl: '/vietnam-monte-carlo-enhanced'
        }
      ]);
    }
  };

  // Refresh notifications
  const refreshNotifications = async () => {
    setIsRefreshing(true);
    await fetchNotifications();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // We're using the triggerHaptics function defined earlier

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    triggerHaptics();
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    triggerHaptics();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Delete notification
  const deleteNotification = (notificationId: string) => {
    triggerHaptics();
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    triggerHaptics();
    setNotifications([]);
  };

  // Filter apps based on search and category
  useEffect(() => {
    let filtered = appCatalog;
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(app => app.category === selectedCategory);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(app => 
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredApps(filtered);
  }, [searchQuery, selectedCategory]);

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Close modals on route change and apply preferences
  useEffect(() => {
    setSidebarOpen(sidebarExpanded);
    setUserMenuOpen(false);
    setNotificationsOpen(false);
    setAppFinderOpen(false);
  }, [router.pathname, sidebarExpanded]);
  
  // Update sidebar state when preferences change
  useEffect(() => {
    setSidebarOpen(sidebarExpanded);
  }, [preferences.sidebarExpanded, sidebarExpanded]);

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Apply header style based on preferences
  const headerClassName = headerStyle === 'blue' 
    ? 'bg-[rgb(var(--scb-honolulu-blue))] text-white'
    : 'bg-white text-[rgb(var(--scb-dark-gray))] shadow-sm border-b border-gray-200';

  // We're using the getDensityClasses function defined earlier

  // We're using the getFontSizeClasses function defined earlier

  // We're using the getAnimationClasses function defined earlier

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-[rgb(var(--scb-light-gray))]'}`}>
      {/* Enhanced Header */}
      {showHeader && (
        <header className={`flex items-center px-4 z-50 h-16 ${headerClassName} ${isDarkMode && headerStyle === 'white' ? 'bg-gray-800 text-white border-gray-700' : ''}`}>
          {/* Left section - Menu and Logo */}
          <div className="flex items-center w-1/3">
            {/* Hamburger Menu Button */}
            {showSideMenu && (
              <button
                onClick={() => {
                  setSidebarOpen(!sidebarOpen);
                  triggerHaptics();
                }}
                className={`p-2 ${headerStyle === 'blue' || isDarkMode ? 'text-white hover:bg-[rgba(255,255,255,0.1)]' : 'text-gray-700 hover:bg-gray-100'} rounded transition-colors mr-1`}
                aria-label="Toggle menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}

            {/* Branding Area with Logo */}
            <Link href="/" className="flex items-center">
              <Image 
                src={headerStyle === 'blue' || isDarkMode
                  ? "https://av.sc.com/corp-en/nr/content/images/sc-lock-up-english-white-rgb.png"
                  : "https://av.sc.com/corp-en/nr/content/images/sc-lock-up-english-grey-rgb.png"
                } 
                alt="Standard Chartered" 
                width={375} 
                height={94} 
                className="h-14" 
                style={{ objectFit: 'contain' }}
                priority
                unoptimized
              />
            </Link>
          </div>

          {/* Center section - Page Title */}
          <div className="flex-1 max-w-3xl mx-auto px-4">
            {title && title !== 'SCB Sapphire' && (
              <h1 className={`text-lg font-medium ${headerStyle === 'blue' || isDarkMode ? 'text-white' : 'text-[rgb(var(--scb-dark-gray))]'}`}>
                {title}
              </h1>
            )}
          </div>

          {/* Right section - Actions */}
          <div className="flex items-center gap-1 lg:gap-2 w-1/3 justify-end">
            {/* App Finder - Desktop only */}
            <button 
              className={`hidden lg:flex h-full px-3 ${headerStyle === 'blue' || isDarkMode ? 'text-white hover:bg-[rgba(255,255,255,0.1)]' : 'text-gray-700 hover:bg-gray-100'} items-center space-x-1 transition-colors rounded`}
              title="App Finder"
              onClick={() => {
                setAppFinderOpen(true);
                triggerHaptics();
              }}
            >
              <Grid className="w-5 h-5" />
            </button>

            {/* Help - Desktop only */}
            <button 
              className={`hidden lg:flex h-full px-3 ${headerStyle === 'blue' || isDarkMode ? 'text-white hover:bg-[rgba(255,255,255,0.1)]' : 'text-gray-700 hover:bg-gray-100'} transition-colors rounded`}
              title="Help"
              onClick={() => {
                router.push('/help');
                triggerHaptics();
              }}
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            
            {/* Notifications with Real-time Updates */}
            <div className="relative">
              <button 
                className={`h-full px-2 lg:px-3 ${headerStyle === 'blue' || isDarkMode ? 'text-white hover:bg-[rgba(255,255,255,0.1)]' : 'text-gray-700 hover:bg-gray-100'} relative touch-manipulation transition-colors rounded`}
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  if (userMenuOpen) setUserMenuOpen(false);
                  triggerHaptics();
                }}
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              {/* Enhanced Notifications Panel */}
              {notificationsOpen && (
                <div className={`absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-xl overflow-hidden z-50 border ${getAnimationClasses('animate-fadeIn')}`}>
                  <div className={`sticky top-0 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
                    <div className="px-4 py-3 flex items-center justify-between">
                      <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Notifications</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={refreshNotifications}
                          className={`p-1 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                          title="Refresh notifications"
                        >
                          <RefreshCcw className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                        </button>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="max-h-[480px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell className={`w-12 h-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-3`} />
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No notifications</p>
                      </div>
                    ) : (
                      <div className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`px-4 py-3 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} cursor-pointer relative group ${
                              !notification.read ? isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50/50' : ''
                            }`}
                            onClick={() => {
                              markAsRead(notification.id);
                              if (notification.actionUrl) {
                                router.push(notification.actionUrl);
                                setNotificationsOpen(false);
                              }
                            }}
                          >
                            <div className="flex items-start">
                              <div className="flex-shrink-0 mt-0.5">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="ml-3 flex-1">
                                <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {notification.title}
                                </p>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-0.5`}>
                                  {notification.message}
                                </p>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                                  {formatTimestamp(notification.timestamp)}
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className={`opacity-0 group-hover:opacity-100 p-1 ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} rounded transition-all`}
                              >
                                <X className={`w-3 h-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                              </button>
                            </div>
                            {!notification.read && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {notifications.length > 0 && (
                    <div className={`px-4 py-2 border-t ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'} flex items-center justify-between`}>
                      <button
                        onClick={clearAllNotifications}
                        className={`text-xs ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'}`}
                      >
                        Clear all
                      </button>
                      <Link 
                        href="/notifications" 
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View all notifications
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* User Menu */}
            <div className="relative">
              <button 
                className={`h-full px-2 lg:px-3 flex items-center gap-1 lg:gap-2 ${headerStyle === 'blue' || isDarkMode ? 'text-white hover:bg-[rgba(255,255,255,0.1)]' : 'text-gray-700 hover:bg-gray-100'} touch-manipulation transition-colors rounded`}
                onClick={() => {
                  setUserMenuOpen(!userMenuOpen);
                  if (notificationsOpen) setNotificationsOpen(false);
                  triggerHaptics();
                }}
              >
                <div className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full ${headerStyle === 'blue' || isDarkMode ? 'bg-[rgba(255,255,255,0.2)]' : 'bg-gray-200'} flex items-center justify-center`}>
                  <User className={`w-4 h-4 ${headerStyle === 'blue' || isDarkMode ? 'text-white' : 'text-gray-600'}`} />
                </div>
                <span className={`text-sm hidden md:inline font-medium ${getFontSizeClasses()}`}>Amanda Chen</span>
                <ChevronDown className="w-4 h-4 hidden lg:inline" />
              </button>
              
              {/* User Actions Menu */}
              {userMenuOpen && (
                <div className={`absolute right-0 mt-2 w-64 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg overflow-hidden z-50 ${getAnimationClasses('animate-fadeIn')}`}>
                  <div className={`px-4 py-3 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border-b`}>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Amanda Chen</p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Investment Analyst</p>
                  </div>
                  <div className="py-1">
                    <Link href="/settings" className={`flex items-center px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                      <Settings className={`mr-3 h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      User Settings
                    </Link>
                    <button
                      onClick={() => {
                        setAppFinderOpen(true);
                        setUserMenuOpen(false);
                        triggerHaptics();
                      }}
                      className={`w-full flex items-center px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      <Grid className={`mr-3 h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      App Finder
                    </button>
                    <Link href="/help" className={`flex items-center px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                      <Info className={`mr-3 h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      About FinSight
                    </Link>
                    <Link href="#" className={`flex items-center px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300 hover:bg-gray-700 border-gray-700' : 'text-gray-700 hover:bg-gray-100 border-gray-200'} border-t`}>
                      <LogOut className={`mr-3 h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      Sign Out
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {/* App Finder Modal */}
      {appFinderOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="app-finder-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              onClick={() => {
                setAppFinderOpen(false);
                triggerHaptics();
              }}
            />
            
            <div className={`relative ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl transform transition-all ${getAnimationClasses('animate-fadeIn')}`}>
              <div className={`sticky top-0 z-10 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
                <div className="flex items-center justify-between p-4">
                  <h2 id="app-finder-title" className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>App Finder</h2>
                  <button
                    onClick={() => {
                      setAppFinderOpen(false);
                      triggerHaptics();
                    }}
                    className={`${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'}`}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                {/* Search and Filter Bar */}
                <div className="px-4 pb-3">
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} w-5 h-5`} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search apps..."
                      className={`w-full pl-10 pr-4 py-2 border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                          selectedCategory === category
                            ? 'bg-[rgb(var(--scb-honolulu-blue))] text-white'
                            : isDarkMode 
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* App Grid */}
              <div className="p-4 overflow-y-auto max-h-[calc(90vh-180px)]">
                {filteredApps.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className={`w-12 h-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-3`} />
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No apps found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredApps.map((app) => (
                      <Link
                        key={app.id}
                        href={app.href}
                        onClick={() => {
                          setAppFinderOpen(false);
                          triggerHaptics();
                        }}
                        className={`flex flex-col items-center p-4 rounded-lg ${
                          isDarkMode 
                            ? 'hover:bg-gray-700 border-gray-700 hover:border-gray-600' 
                            : 'hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                        } transition-colors border ${getAnimationClasses('hover:scale-105 transition-transform')}`}
                      >
                        <div className={`w-14 h-14 ${app.color} rounded-xl flex items-center justify-center mb-3 ${getAnimationClasses('transform transition-transform')}`}>
                          <app.icon className="w-7 h-7 text-white" />
                        </div>
                        <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} text-center`}>{app.name}</h3>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-center mt-1`}>{app.description}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && showSideMenu && (
          <div className="fixed inset-0 z-50 lg:hidden" aria-modal="true">
            <div className="fixed inset-0 bg-gray-900/50" onClick={() => setSidebarOpen(false)} />
            
            <div className={`fixed inset-y-0 left-0 w-full max-w-xs ${isDarkMode ? 'bg-gray-800' : 'bg-white'} ${getAnimationClasses('animate-slide-in')}`}>
              <div className={`flex items-center justify-between h-14 px-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <span className={`text-base font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>FinSight</span>
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    triggerHaptics();
                  }}
                  className={`p-2 -mr-2 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-900'} touch-manipulation`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-4 px-2">
                <AppNavigationLinks 
                  condensed={false}
                  showLabels={preferences.showLabels !== false}
                  filterTest={preferences.hideTestPages !== false}
                  filterMobile={false} // In mobile view, we want to show mobile pages
                  enableHaptics={preferences.enableHaptics}
                  onClick={(item) => {
                    router.push(item.href);
                    setSidebarOpen(false);
                    triggerHaptics();
                  }}
                />
              </div>
            </div>
        </div>
        )}

        {/* Desktop Sidebar - Collapsible */}
        {showSideMenu && (
          <div className={`hidden lg:block ${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 ease-in-out ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r`}>
            <div className="h-full flex flex-col">
              <div className={`h-12 px-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-center`}>
                {sidebarOpen && <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>FinSight Spaces</span>}
              </div>
              <AppNavigationLinks 
                condensed={!sidebarOpen}
                showLabels={sidebarOpen && preferences.showLabels}
                filterTest={preferences.hideTestPages !== false}
                filterMobile={preferences.hideMobilePages !== false}
                enableHaptics={preferences.enableHaptics}
                onClick={(item) => {
                  router.push(item.href);
                  triggerHaptics();
                }}
              />
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* SCB Beautiful Content - Responsive padding */}
          <main className={`flex-1 overflow-y-auto ${getDensityClasses()} ${isDarkMode ? 'bg-gray-900' : 'bg-[rgb(var(--scb-light-gray))]'} pb-20 lg:pb-6 ${getFontSizeClasses()}`}>
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} ${getDensityClasses()} rounded-lg shadow-sm border`}>
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation - only show if mobile nav style is bottom */}
      {preferences.mobileNavStyle === 'bottom' && (
        <nav className={`lg:hidden fixed bottom-0 left-0 right-0 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t safe-bottom`}>
          <AppNavigationLinks 
            condensed={true}
            showLabels={true}
            filterTest={preferences.hideTestPages !== false}
            filterMobile={false}
            filterCategory="Main"
            enableHaptics={preferences.enableHaptics}
            onClick={(item) => {
              router.push(item.href);
              triggerHaptics();
            }}
          />
        </nav>
      )}
    </div>
  );
};

export default EnhancedLayout;