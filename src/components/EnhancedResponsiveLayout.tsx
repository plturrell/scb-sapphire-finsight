/**
 * Enhanced Responsive Layout with SCB Beautiful UI
 * A modern, adaptive layout component with SCB styling, network-aware features, and responsive behavior
 */

import React, { useState, useEffect } from 'react';
import { Icons } from './IconExports';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import useNetworkAwareLoading from '../hooks/useNetworkAwareLoading';
import useDeviceCapabilities from '../hooks/useDeviceCapabilities';
import { EnhancedLoadingSpinner } from './EnhancedLoadingSpinner';

// Import Lucide icons
import {
  LayoutDashboard,
  BarChart3,
  Target,
  FileText,
  Settings,
  Search,
  Bell,
  User,
  Menu,
  X,
  ChevronLeft,
  Home,
  Activity,
  AlertCircle,
  Shield,
  ChartBar,
  PieChart,
  TrendingUp,
  Package,
  Globe,
  Check,
  Info,
  MessageSquare,
  Zap,
  Database,
  Grid,
  Terminal,
  // Briefcase removed and replaced with Icons.Briefcase
  DollarSign,
  Calendar,
  Clock,
  Sun,
  Moon,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ExternalLink,
  Bookmark,
  UserCircle
} from 'lucide-react';

// Types for layout properties
interface EnhancedResponsiveLayoutProps {
  children: React.ReactNode;
  showSearch?: boolean;
  showNotifications?: boolean;
  fullWidth?: boolean;
  stickyHeader?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
}

// Navigation type for menu items
interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number | string;
  badgeColor?: 'info' | 'success' | 'warning' | 'error';
}

// Mobile footer nav item type
interface MobileFooterItem extends NavigationItem {
  active?: boolean;
}

// Notification type
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  actionable?: boolean;
  actionUrl?: string;
}

// User information type
interface UserInfo {
  name: string;
  role: string;
  avatar?: string;
}

// Navigation items for different sections with SCB Beautiful UI
const primaryNav: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Portfolio', href: '/portfolio', icon: Target },
  { 
    name: 'Reports', 
    href: '/reports', 
    icon: FileText, 
    badge: 'New',
    badgeColor: 'info'
  },
];

const secondaryNav: NavigationItem[] = [
  { name: 'Data Products', href: '/data-products', icon: Package },
  { 
    name: 'Tariff Scanner', 
    href: '/tariff-scanner', 
    icon: Globe,
    badge: 2,
    badgeColor: 'warning'
  },
  { name: 'Monte Carlo', href: '/vietnam-monte-carlo', icon: ChartBar },
  { name: 'Settings', href: '/settings', icon: Settings },
];

// Mobile navigation items
const mobileNav: MobileFooterItem[] = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Analytics', href: '/analytics', icon: Activity },
  { name: 'Portfolio', href: '/portfolio', icon: Icons.Briefcase },
  { name: 'Reports', href: '/reports', icon: FileText },
];

// Responsive layout component with SCB Beautiful UI styling
export default function EnhancedResponsiveLayout({
  children,
  showSearch = true,
  showNotifications = true,
  fullWidth = false,
  stickyHeader = true,
  theme = 'light',
  className = '',
}: EnhancedResponsiveLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsedSidebar, setCollapsedSidebar] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(theme === 'auto' ? 'light' : theme);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: 'Amanda Chen',
    role: 'Investment Analyst',
  });
  
  // Network and device capabilities hooks for adaptive behavior
  const { networkStatus, saveData } = useNetworkAwareLoading();
  const { tier, screenSize } = useDeviceCapabilities();

  // Detect device type for optimized rendering
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Auto theme detection
  useEffect(() => {
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setCurrentTheme(prefersDark ? 'dark' : 'light');
      
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setCurrentTheme(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setCurrentTheme(theme);
    }
  }, [theme]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setSidebarOpen(false);
    setNotificationsOpen(false);
    setUserMenuOpen(false);
  }, [router.pathname]);

  // Determine active navigation item
  const getActiveNav = () => {
    return [...primaryNav, ...secondaryNav].find(item => router.pathname === item.href);
  };

  // Format the current page title
  const currentPageTitle = getActiveNav()?.name || 'FinSight';

  // Load notifications with SCB Beautiful UI
  useEffect(() => {
    if (showNotifications) {
      loadNotifications();
    }
  }, [showNotifications]);

  // Load notifications function
  const loadNotifications = async () => {
    setNotificationsLoading(true);
    try {
      // In a real implementation, this would be an API call
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setNotifications([
        {
          id: '1',
          title: 'Portfolio Alert',
          message: 'Your technology sector allocation is above the recommended threshold.',
          type: 'warning',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          read: false,
          actionable: true,
          actionUrl: '/portfolio'
        },
        {
          id: '2',
          title: 'Report Generated',
          message: 'Q2 Financial Analysis report is ready to view.',
          type: 'success',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          read: false,
          actionable: true,
          actionUrl: '/reports'
        },
        {
          id: '3',
          title: 'Market Update',
          message: 'ASEAN market volatility has increased by 15% in the last 24 hours.',
          type: 'info',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          read: true
        },
        {
          id: '4',
          title: 'System Maintenance',
          message: 'Scheduled maintenance will occur on Sunday at 02:00 UTC.',
          type: 'info',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          read: true
        }
      ]);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Format timestamp with user-friendly relative time
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)}h ago`;
    } else if (diffMins < 10080) { // 7 days
      return `${Math.floor(diffMins / 1440)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: 'info' | 'success' | 'warning' | 'error') => {
    switch (type) {
      case 'success':
        return <Check className="text-[rgb(var(--scb-american-green))]" size={16} />;
      case 'warning':
        return <AlertCircle className="text-[rgb(var(--warning))]" size={16} />;
      case 'error':
        return <AlertCircle className="text-[rgb(var(--scb-muted-red))]" size={16} />;
      case 'info':
      default:
        return <Info className="text-[rgb(var(--scb-honolulu-blue))]" size={16} />;
    }
  };

  // Get notification background color based on type
  const getNotificationBgColor = (type: 'info' | 'success' | 'warning' | 'error') => {
    switch (type) {
      case 'success':
        return 'bg-[rgba(var(--scb-american-green),0.08)]';
      case 'warning':
        return 'bg-[rgba(var(--warning),0.08)]';
      case 'error':
        return 'bg-[rgba(var(--scb-muted-red),0.08)]';
      case 'info':
      default:
        return 'bg-[rgba(var(--scb-honolulu-blue),0.08)]';
    }
  };

  // Badge component for navigation items
  const NavBadge = ({ badge, color }: { badge?: number | string, color?: 'info' | 'success' | 'warning' | 'error' }) => {
    if (!badge) return null;
    
    const bgColor = {
      info: 'bg-[rgb(var(--scb-honolulu-blue))]',
      success: 'bg-[rgb(var(--scb-american-green))]',
      warning: 'bg-[rgb(var(--warning))]',
      error: 'bg-[rgb(var(--scb-muted-red))]',
    }[color || 'info'];
    
    return (
      <span className={`flex-shrink-0 ml-auto ${
        typeof badge === 'number' 
          ? `w-5 h-5 ${bgColor} rounded-full flex items-center justify-center text-[10px] text-white font-medium` 
          : `px-1.5 py-0.5 ${bgColor} rounded-full text-[10px] text-white font-medium`
      }`}>
        {badge}
      </span>
    );
  };

  // Calculate unread notification count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Toggle network saving mode
  const toggleSidebarCollapse = () => {
    setCollapsedSidebar(!collapsedSidebar);
  };

  return (
    <div className={`min-h-screen flex flex-col bg-[rgb(var(--fiori-content-bg))] ${currentTheme === 'dark' ? 'dark' : ''} ${className}`}>
      {/* SCB Beautiful UI - Responsive Header */}
      <header 
        className={`
          z-50 bg-[rgb(var(--scb-honolulu-blue))] text-white
          ${stickyHeader ? 'sticky top-0' : ''}
          border-b border-[rgba(255,255,255,0.1)]
          lg:h-14 h-16 safe-top
        `}
      >
        <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
          {/* Left Section: Menu Button & Logo */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-md hover:bg-white/10 transition-all touch-manipulation lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo with SCB branding */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Image
                  src="/images/sc-logo.png"
                  alt="Standard Chartered"
                  width={36}
                  height={36}
                  className="h-8 w-auto"
                  priority
                />
                <span className="ml-2 font-medium text-lg hidden sm:block">
                  FinSight Platform
                </span>
              </Link>
            </div>

            {/* Sidebar toggle for desktop */}
            <button
              onClick={toggleSidebarCollapse}
              className="hidden lg:flex p-2 ml-4 rounded-md hover:bg-white/10 transition-all"
              aria-label={collapsedSidebar ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronLeft className={`w-5 h-5 transform transition-transform ${collapsedSidebar ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Middle Section: Search Bar */}
          {showSearch && (
            <div className="hidden md:block flex-1 max-w-xl px-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-white/10 border border-white/20 text-white rounded-lg pl-10 pr-4 py-1.5 text-sm placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/15"
                />
              </div>
            </div>
          )}

          {/* Right Section: Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Network Status Indicator */}
            <div className="hidden md:flex">
              <div className={`
                text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-full
                ${networkStatus === 'fast' 
                  ? 'bg-[rgba(var(--scb-american-green),0.2)]' 
                  : networkStatus === 'slow' 
                  ? 'bg-[rgba(var(--scb-muted-red),0.2)]' 
                  : 'bg-[rgba(var(--scb-honolulu-blue),0.2)]'
                }
              `}>
                <Activity className="w-3 h-3" />
                <span className="hidden lg:inline">{networkStatus.toUpperCase()}</span>
              </div>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setCurrentTheme(theme === 'auto' ? currentTheme === 'light' ? 'dark' : 'light' : currentTheme === 'light' ? 'dark' : 'light')}
              className="p-2 rounded-md hover:bg-white/10 transition-all hidden sm:block"
              aria-label={`Switch to ${currentTheme === 'light' ? 'dark' : 'light'} mode`}
            >
              {currentTheme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {/* Notifications */}
            {showNotifications && (
              <div className="relative">
                <button
                  onClick={() => {
                    setNotificationsOpen(!notificationsOpen);
                    if (userMenuOpen) setUserMenuOpen(false);
                  }}
                  className="p-2 rounded-md hover:bg-white/10 transition-all relative touch-manipulation"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-[rgb(var(--scb-muted-red))] rounded-full flex items-center justify-center text-[10px] font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Enhanced Notifications Panel with SCB Beautiful UI */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-xl overflow-hidden z-50 border border-[rgb(var(--scb-border))] animate-fadeIn">
                    <div className="px-4 py-3 bg-[rgba(var(--scb-light-gray),0.3)] border-b border-[rgb(var(--scb-border))] flex items-center justify-between">
                      <h3 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">Notifications</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={loadNotifications}
                          className="p-1 hover:bg-[rgba(var(--scb-light-gray),0.5)] rounded-full transition-all"
                          title="Refresh notifications"
                        >
                          <RefreshCw className="w-4 h-4 text-[rgb(var(--scb-dark-gray))]" />
                        </button>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-[rgb(var(--scb-honolulu-blue))] hover:underline"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                    </div>

                    {notificationsLoading ? (
                      <div className="p-6 flex justify-center">
                        <EnhancedLoadingSpinner size="sm" message="Loading notifications..." />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="w-10 h-10 text-[rgb(var(--scb-border))] mx-auto mb-3" />
                        <p className="text-sm text-[rgb(var(--scb-dark-gray))]">No notifications</p>
                      </div>
                    ) : (
                      <div className="max-h-[400px] overflow-y-auto">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`
                              relative hover:bg-[rgba(var(--scb-light-gray),0.3)] border-b border-[rgb(var(--scb-border))]
                              ${!notification.read ? 'border-l-2 border-l-[rgb(var(--scb-honolulu-blue))]' : 'border-l-2 border-l-transparent'}
                            `}
                          >
                            <button
                              className="absolute top-2 right-2 p-1 hover:bg-[rgba(var(--scb-light-gray),0.5)] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                            >
                              {!notification.read && <Check className="w-3 h-3 text-[rgb(var(--scb-dark-gray))]" />}
                            </button>

                            <div 
                              className="px-4 py-3 cursor-pointer"
                              onClick={() => {
                                markAsRead(notification.id);
                                if (notification.actionable && notification.actionUrl) {
                                  router.push(notification.actionUrl);
                                  setNotificationsOpen(false);
                                }
                              }}
                            >
                              <div className="flex">
                                <div className={`w-8 h-8 rounded-full ${getNotificationBgColor(notification.type)} flex items-center justify-center mr-3 flex-shrink-0`}>
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-80 mt-0.5">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center justify-between mt-1">
                                    <p className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-60">
                                      {formatTimestamp(notification.timestamp)}
                                    </p>
                                    {notification.actionable && (
                                      <span className="text-xs text-[rgb(var(--scb-honolulu-blue))] flex items-center gap-0.5">
                                        Details <ArrowRight size={10} />
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="px-4 py-2 border-t border-[rgb(var(--scb-border))] bg-[rgba(var(--scb-light-gray),0.3)]">
                      <Link
                        href="/notifications"
                        className="text-xs text-[rgb(var(--scb-honolulu-blue))] hover:underline flex items-center justify-center gap-1"
                        onClick={() => setNotificationsOpen(false)}
                      >
                        View all notifications <ExternalLink size={10} />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => {
                  setUserMenuOpen(!userMenuOpen);
                  if (notificationsOpen) setNotificationsOpen(false);
                }}
                className="p-1 rounded-md hover:bg-white/10 transition-all touch-manipulation flex items-center gap-2"
                aria-label="User menu"
              >
                <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center">
                  {userInfo.avatar ? (
                    <Image
                      src={userInfo.avatar}
                      alt={userInfo.name}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <UserCircle className="w-5 h-5" />
                  )}
                </div>
                <span className="text-sm font-medium hidden sm:block">{userInfo.name}</span>
                <ChevronDown className="w-4 h-4 hidden sm:block" />
              </button>

              {/* User Menu with SCB Beautiful UI */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl overflow-hidden z-50 border border-[rgb(var(--scb-border))] animate-fadeIn">
                  <div className="px-4 py-3 bg-[rgba(var(--scb-light-gray),0.3)] border-b border-[rgb(var(--scb-border))]">
                    <p className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">{userInfo.name}</p>
                    <p className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-80">{userInfo.role}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/settings/profile"
                      className="flex items-center px-4 py-2 text-sm text-[rgb(var(--scb-dark-gray))] hover:bg-[rgba(var(--scb-light-gray),0.3)]"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="mr-3 h-4 w-4 text-[rgb(var(--scb-dark-gray))] opacity-70" />
                      Profile Settings
                    </Link>
                    <Link
                      href="/settings/preferences"
                      className="flex items-center px-4 py-2 text-sm text-[rgb(var(--scb-dark-gray))] hover:bg-[rgba(var(--scb-light-gray),0.3)]"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="mr-3 h-4 w-4 text-[rgb(var(--scb-dark-gray))] opacity-70" />
                      Preferences
                    </Link>
                    <Link
                      href="/bookmarks"
                      className="flex items-center px-4 py-2 text-sm text-[rgb(var(--scb-dark-gray))] hover:bg-[rgba(var(--scb-light-gray),0.3)]"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Bookmark className="mr-3 h-4 w-4 text-[rgb(var(--scb-dark-gray))] opacity-70" />
                      Saved Items
                    </Link>
                    <button
                      className="w-full flex items-center px-4 py-2 text-sm text-[rgb(var(--scb-dark-gray))] hover:bg-[rgba(var(--scb-light-gray),0.3)] border-t border-[rgb(var(--scb-border))]"
                      onClick={() => {
                        // Handle logout here
                        setUserMenuOpen(false);
                      }}
                    >
                      <Icons.LogOut className="mr-3 h-4 w-4 text-[rgb(var(--scb-dark-gray))] opacity-70" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" aria-modal="true">
            <div
              className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white shadow-xl animate-slide-in dark:bg-gray-900">
              <div className="flex items-center justify-between h-16 px-4 border-b border-[rgb(var(--scb-border))]">
                <div className="flex items-center">
                  <Image
                    src="/images/sc-logo.png"
                    alt="Standard Chartered"
                    width={32}
                    height={32}
                    className="h-8 w-auto"
                  />
                  <span className="ml-2 text-base font-medium text-[rgb(var(--scb-dark-gray))] dark:text-white">
                    FinSight
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-md hover:bg-[rgba(var(--scb-light-gray),0.3)] transition-colors dark:hover:bg-gray-800"
                >
                  <X className="w-6 h-6 text-[rgb(var(--scb-dark-gray))] dark:text-white" />
                </button>
              </div>
              
              {/* Mobile Search */}
              {showSearch && (
                <div className="px-4 py-3 border-b border-[rgb(var(--scb-border))]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[rgb(var(--scb-dark-gray))] w-4 h-4 opacity-70 dark:text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      className="w-full pl-10 pr-4 py-2 bg-[rgba(var(--scb-light-gray),0.3)] rounded-lg text-[rgb(var(--scb-dark-gray))] border border-[rgb(var(--scb-border))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--scb-honolulu-blue))] dark:bg-gray-800 dark:text-white dark:border-gray-700"
                    />
                  </div>
                </div>
              )}
              
              <nav className="px-4 py-4 space-y-1 overflow-y-auto">
                <div className="mb-2">
                  <div className="px-3 mb-2 text-xs font-semibold text-[rgb(var(--scb-dark-gray))] opacity-60 uppercase tracking-wider dark:text-gray-400">
                    Main Navigation
                  </div>
                  {primaryNav.map((item) => {
                    const isActive = router.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`
                          flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                          ${isActive
                            ? 'bg-[rgba(var(--scb-honolulu-blue),0.1)] text-[rgb(var(--scb-honolulu-blue))] dark:bg-blue-900/30 dark:text-blue-200'
                            : 'text-[rgb(var(--scb-dark-gray))] hover:bg-[rgba(var(--scb-light-gray),0.3)] dark:text-gray-300 dark:hover:bg-gray-800/60'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5" />
                          <span>{item.name}</span>
                        </div>
                        <NavBadge badge={item.badge} color={item.badgeColor} />
                      </Link>
                    );
                  })}
                </div>
                
                <div className="mt-6">
                  <div className="px-3 mb-2 text-xs font-semibold text-[rgb(var(--scb-dark-gray))] opacity-60 uppercase tracking-wider dark:text-gray-400">
                    Advanced Features
                  </div>
                  {secondaryNav.map((item) => {
                    const isActive = router.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`
                          flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                          ${isActive
                            ? 'bg-[rgba(var(--scb-honolulu-blue),0.1)] text-[rgb(var(--scb-honolulu-blue))] dark:bg-blue-900/30 dark:text-blue-200'
                            : 'text-[rgb(var(--scb-dark-gray))] hover:bg-[rgba(var(--scb-light-gray),0.3)] dark:text-gray-300 dark:hover:bg-gray-800/60'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5" />
                          <span>{item.name}</span>
                        </div>
                        <NavBadge badge={item.badge} color={item.badgeColor} />
                      </Link>
                    );
                  })}
                </div>
                
                {/* Mobile user actions */}
                <div className="mt-6 pt-6 border-t border-[rgb(var(--scb-border))] dark:border-gray-700">
                  <div className="px-3 mb-2 text-xs font-semibold text-[rgb(var(--scb-dark-gray))] opacity-60 uppercase tracking-wider dark:text-gray-400">
                    System
                  </div>
                  <Link
                    href="/help"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[rgb(var(--scb-dark-gray))] hover:bg-[rgba(var(--scb-light-gray),0.3)] transition-colors dark:text-gray-300 dark:hover:bg-gray-800/60"
                  >
                    <Info className="w-5 h-5" />
                    <span>Help & Support</span>
                  </Link>
                  <button
                    onClick={() => {
                      setCurrentTheme(currentTheme === 'light' ? 'dark' : 'light');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[rgb(var(--scb-dark-gray))] hover:bg-[rgba(var(--scb-light-gray),0.3)] transition-colors dark:text-gray-300 dark:hover:bg-gray-800/60"
                  >
                    {currentTheme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    <span>{currentTheme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                  </button>
                </div>
              </nav>
            </div>
          </div>
        )}

        {/* Desktop Sidebar with SCB Beautiful UI */}
        <aside 
          className={`
            hidden lg:block
            ${collapsedSidebar ? 'w-16' : 'w-64'} 
            transition-all duration-300 ease-in-out
            bg-white border-r border-[rgb(var(--scb-border))]
            dark:bg-gray-900 dark:border-gray-800
          `}
        >
          <nav className="h-full flex flex-col">
            {/* Primary Navigation */}
            <div className="flex-1 py-4 overflow-y-auto">
              <div className="mb-6">
                <div className={`px-4 mb-2 text-xs font-semibold text-[rgb(var(--scb-dark-gray))] uppercase tracking-wide opacity-60 dark:text-gray-400 ${collapsedSidebar ? 'sr-only' : ''}`}>
                  Main
                </div>
                {primaryNav.map((item) => {
                  const isActive = router.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`
                        flex items-center ${collapsedSidebar ? 'justify-center' : 'justify-between'} 
                        ${collapsedSidebar ? 'px-2' : 'px-4'} py-2
                        ${isActive 
                          ? 'text-[rgb(var(--scb-honolulu-blue))] dark:text-blue-300' 
                          : 'text-[rgb(var(--scb-dark-gray))] dark:text-gray-400'
                        }
                        ${isActive 
                          ? 'bg-[rgba(var(--scb-honolulu-blue),0.08)] dark:bg-blue-900/30' 
                          : 'hover:bg-[rgba(var(--scb-light-gray),0.3)] dark:hover:bg-gray-800/60'
                        }
                        transition-colors rounded-md
                      `}
                      title={collapsedSidebar ? item.name : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[rgb(var(--scb-honolulu-blue))]' : ''}`} />
                        {!collapsedSidebar && <span className="text-sm font-medium">{item.name}</span>}
                      </div>
                      {!collapsedSidebar && item.badge && (
                        <NavBadge badge={item.badge} color={item.badgeColor} />
                      )}
                    </Link>
                  );
                })}
              </div>
              
              {/* Secondary Navigation */}
              <div className="mb-6">
                <div className={`px-4 mb-2 text-xs font-semibold text-[rgb(var(--scb-dark-gray))] uppercase tracking-wide opacity-60 dark:text-gray-400 ${collapsedSidebar ? 'sr-only' : ''}`}>
                  Advanced
                </div>
                {secondaryNav.map((item) => {
                  const isActive = router.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`
                        flex items-center ${collapsedSidebar ? 'justify-center' : 'justify-between'} 
                        ${collapsedSidebar ? 'px-2' : 'px-4'} py-2
                        ${isActive 
                          ? 'text-[rgb(var(--scb-honolulu-blue))] dark:text-blue-300' 
                          : 'text-[rgb(var(--scb-dark-gray))] dark:text-gray-400'
                        }
                        ${isActive 
                          ? 'bg-[rgba(var(--scb-honolulu-blue),0.08)] dark:bg-blue-900/30' 
                          : 'hover:bg-[rgba(var(--scb-light-gray),0.3)] dark:hover:bg-gray-800/60'
                        }
                        transition-colors rounded-md
                      `}
                      title={collapsedSidebar ? item.name : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[rgb(var(--scb-honolulu-blue))]' : ''}`} />
                        {!collapsedSidebar && <span className="text-sm font-medium">{item.name}</span>}
                      </div>
                      {!collapsedSidebar && item.badge && (
                        <NavBadge badge={item.badge} color={item.badgeColor} />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
            
            {/* Sidebar Footer Information */}
            {!collapsedSidebar && (
              <div className="border-t border-[rgb(var(--scb-border))] p-4 dark:border-gray-800">
                <div className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-60 flex items-center justify-between dark:text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            )}
          </nav>
        </aside>

        {/* Main Content Area with SCB Beautiful UI */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Desktop Page Header */}
          <div className="hidden lg:flex h-12 bg-white border-b border-[rgb(var(--scb-border))] px-6 items-center justify-between dark:bg-gray-900 dark:border-gray-800">
            <div className="flex items-center">
              <h1 className="text-base font-medium text-[rgb(var(--scb-dark-gray))] dark:text-white">
                {currentPageTitle}
              </h1>
            </div>
            
            {/* Context-aware actions */}
            <div className="flex items-center gap-2">
              <button className="fiori-btn fiori-btn-secondary text-sm">
                Export
              </button>
              <button className="fiori-btn fiori-btn-primary text-sm">
                {router.pathname.includes('/reports') ? 'New Report' : 'New Item'}
              </button>
            </div>
          </div>

          {/* Page Content with SCB Beautiful UI */}
          <div className="flex-1 overflow-y-auto bg-[rgb(var(--fiori-content-bg))] dark:bg-gray-950">
            <div className={`p-4 lg:p-6 pb-20 lg:pb-6 ${fullWidth ? '' : 'max-w-7xl mx-auto'}`}>
              {/* Page content */}
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation with SCB Beautiful UI */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[rgb(var(--scb-border))] safe-bottom z-20 dark:bg-gray-900 dark:border-gray-800">
        <div className="grid grid-cols-4">
          {mobileNav.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex flex-col items-center py-3 touch-manipulation
                  ${isActive 
                    ? 'text-[rgb(var(--scb-honolulu-blue))]' 
                    : 'text-[rgb(var(--scb-dark-gray))]'
                  }
                  dark:text-gray-200
                `}
              >
                <item.icon className={`w-5 h-5 mb-1 ${isActive ? 'text-[rgb(var(--scb-honolulu-blue))]' : ''}`} />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}