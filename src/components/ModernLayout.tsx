import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import EnhancedCompanySearchBar from './EnhancedCompanySearchBar';
import JouleAssistant from './JouleAssistant';
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
  HelpCircle,
  ChevronDown,
  PlusSquare,
  LogOut,
  Info,
  Grid,
  X,
  Home,
  PieChart,
  RefreshCcw,
  Building2,
  Globe,
  Shield,
  AlertTriangle,
  Activity,
  TrendingUp,
  Layers,
  Database,
  Terminal,
  Package,
  FileCode,
  DollarSign,
  Calculator,
  MapPin,
  Calendar,
  Star,
  Zap,
  Briefcase,
  UserPlus,
  Share2,
  Lock,
  Link2,
  Mail,
  Phone,
  MessageSquare,
  Video,
  Headphones,
  Book,
  GraduationCap,
  Award,
  CheckCircle,
  AlertCircle,
  XCircle,
  Hash,
  CreditCard,
  Wallet,
  LineChart
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
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

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Portfolio', href: '/portfolio', icon: Target },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const mobileNav = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Analytics', href: '/analytics', icon: PieChart },
  { name: 'Portfolio', href: '/portfolio', icon: Target },
  { name: 'Reports', href: '/reports', icon: FileText },
];

// Comprehensive App Catalog
const appCatalog: AppItem[] = [
  // Finance Apps
  { id: 'portfolio', name: 'Portfolio Manager', icon: Briefcase, href: '/portfolio', category: 'Finance', color: 'bg-blue-500', description: 'Manage investment portfolios' },
  { id: 'analytics', name: 'Financial Analytics', icon: LineChart, href: '/analytics', category: 'Finance', color: 'bg-green-500', description: 'Advanced financial analysis' },
  { id: 'trading', name: 'Trading Desk', icon: TrendingUp, href: '/trading', category: 'Finance', color: 'bg-purple-500', description: 'Real-time trading platform' },
  { id: 'risk', name: 'Risk Management', icon: Shield, href: '/risk', category: 'Finance', color: 'bg-red-500', description: 'Risk assessment tools' },
  
  // Data Products
  { id: 'data-explorer', name: 'Data Explorer', icon: Database, href: '/data-explorer', category: 'Data', color: 'bg-indigo-500', description: 'Browse data products' },
  { id: 'sankey', name: 'Sankey Visualization', icon: Activity, href: '/sankey-demo', category: 'Data', color: 'bg-teal-500', description: 'Flow visualization' },
  { id: 'montecarlo', name: 'Monte Carlo Sim', icon: Zap, href: '/vietnam-monte-carlo-enhanced', category: 'Data', color: 'bg-orange-500', description: 'Probability simulations' },
  
  // Reports & Documents
  { id: 'reports', name: 'Report Builder', icon: FileText, href: '/reports', category: 'Reports', color: 'bg-gray-600', description: 'Generate custom reports' },
  { id: 'tariff-alerts', name: 'Tariff Alerts', icon: AlertTriangle, href: '/tariff-alerts', category: 'Reports', color: 'bg-yellow-500', description: 'Trade tariff monitoring' },
  { id: 'financial-sim', name: 'Financial Simulator', icon: Calculator, href: '/financial-simulation', category: 'Reports', color: 'bg-pink-500', description: 'Financial modeling' },
  
  // Companies & Research
  { id: 'company-search', name: 'Company Search', icon: Building2, href: '/companies', category: 'Research', color: 'bg-cyan-500', description: 'Search S&P companies' },
  { id: 'vietnam-dashboard', name: 'Vietnam Dashboard', icon: MapPin, href: '/vietnam-tariff-dashboard', category: 'Research', color: 'bg-emerald-500', description: 'Vietnam market insights' },
  { id: 'knowledge', name: 'Knowledge Base', icon: Book, href: '/knowledge-dashboard', category: 'Research', color: 'bg-violet-500', description: 'Research repository' },
  
  // Tools & Utilities
  { id: 'api-explorer', name: 'API Explorer', icon: Terminal, href: '/api-explorer', category: 'Tools', color: 'bg-slate-600', description: 'Test API endpoints' },
  { id: 'settings', name: 'Settings', icon: Settings, href: '/settings', category: 'Tools', color: 'bg-gray-500', description: 'System configuration' },
  { id: 'help', name: 'Help Center', icon: HelpCircle, href: '/help', category: 'Tools', color: 'bg-blue-400', description: 'Documentation & support' },
];

export default function ModernLayout({ children }: LayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [appFinderOpen, setAppFinderOpen] = useState(false);
  const [jouleOpen, setJouleOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredApps, setFilteredApps] = useState(appCatalog);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Categories for App Finder
  const categories = ['All', ...Array.from(new Set(appCatalog.map(app => app.category)))];

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

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Delete notification
  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Clear all notifications
  const clearAllNotifications = () => {
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

  // Close modals on route change
  useEffect(() => {
    setSidebarOpen(false);
    setUserMenuOpen(false);
    setNotificationsOpen(false);
    setAppFinderOpen(false);
  }, [router.pathname]);

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

  return (
    <div className="min-h-screen flex flex-col bg-[rgb(var(--fiori-content-bg))]">
      {/* Modern Header - White background */}
      <header className="bg-white shadow-sm border-b border-gray-200 flex items-center px-4 z-50 h-16">
        {/* Left section - Menu and Logo */}
        <div className="flex items-center w-1/3">
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors mr-4"
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Branding Area with Logo */}
          <Link href="/" className="flex items-center">
            <Image 
              src="https://av.sc.com/corp-en/nr/content/images/sc-lock-up-english-grey-rgb.png" 
              alt="Standard Chartered" 
              width={180} 
              height={40} 
              className="h-9" 
              priority
              unoptimized
            />
          </Link>
        </div>

        {/* Center section - Search Bar */}
        <div className="flex-1 max-w-3xl mx-auto px-4">
          <EnhancedCompanySearchBar />
        </div>

        {/* Right section - Actions */}
        <div className="flex items-center gap-1 lg:gap-2 w-1/3 justify-end">
          
          {/* Joule AI Assistant */}
          <button 
            className="flex h-full px-3 text-gray-700 hover:bg-gray-100 items-center space-x-1 transition-colors rounded"
            title="Joule AI Assistant"
            onClick={() => setJouleOpen(true)}
          >
            <div className="relative">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <div className="absolute -inset-1">
                <div className="animate-pulse w-7 h-7 rounded bg-blue-400 opacity-20"></div>
              </div>
            </div>
          </button>
          
          {/* App Finder - Desktop only */}
          <button 
            className="hidden lg:flex h-full px-3 text-gray-700 hover:bg-gray-100 items-center space-x-1 transition-colors rounded"
            title="App Finder"
            onClick={() => setAppFinderOpen(true)}
          >
            <Grid className="w-5 h-5" />
          </button>

          {/* Help - Desktop only */}
          <button 
            className="hidden lg:flex h-full px-3 text-gray-700 hover:bg-gray-100 transition-colors rounded"
            title="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          
          {/* Notifications with Real-time Updates */}
          <div className="relative">
            <button 
              className="h-full px-2 lg:px-3 text-gray-700 hover:bg-gray-100 relative touch-manipulation transition-colors rounded"
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                if (userMenuOpen) setUserMenuOpen(false);
              }}
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            
            {/* Enhanced Notifications Panel */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-xl overflow-hidden z-50 border border-gray-200">
                <div className="sticky top-0 bg-white border-b">
                  <div className="px-4 py-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={refreshNotifications}
                        className={`p-1 hover:bg-gray-100 rounded transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                        title="Refresh notifications"
                      >
                        <RefreshCcw className="w-4 h-4 text-gray-600" />
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
                      <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No notifications</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 hover:bg-gray-50 cursor-pointer relative group ${
                            !notification.read ? 'bg-blue-50/50' : ''
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
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-600 mt-0.5">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatTimestamp(notification.timestamp)}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
                            >
                              <X className="w-3 h-3 text-gray-500" />
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
                  <div className="px-4 py-2 border-t bg-gray-50 flex items-center justify-between">
                    <button
                      onClick={clearAllNotifications}
                      className="text-xs text-gray-600 hover:text-gray-700"
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
              className="h-full px-2 lg:px-3 flex items-center gap-1 lg:gap-2 text-gray-700 hover:bg-gray-100 touch-manipulation transition-colors rounded"
              onClick={() => {
                setUserMenuOpen(!userMenuOpen);
                if (notificationsOpen) setNotificationsOpen(false);
              }}
            >
              <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-sm hidden md:inline font-medium">Amanda Chen</span>
              <ChevronDown className="w-4 h-4 hidden lg:inline" />
            </button>
            
            {/* User Actions Menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg overflow-hidden z-50">
                <div className="px-4 py-3 bg-gray-50 border-b">
                  <p className="text-sm font-medium text-gray-700">Amanda Chen</p>
                  <p className="text-xs text-gray-500">Investment Analyst</p>
                </div>
                <div className="py-1">
                  <Link href="/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <Settings className="mr-3 h-4 w-4 text-gray-400" />
                    User Settings
                  </Link>
                  <button
                    onClick={() => {
                      setAppFinderOpen(true);
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Grid className="mr-3 h-4 w-4 text-gray-400" />
                    App Finder
                  </button>
                  <Link href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <Info className="mr-3 h-4 w-4 text-gray-400" />
                    About FinSight
                  </Link>
                  <Link href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t">
                    <LogOut className="mr-3 h-4 w-4 text-gray-400" />
                    Sign Out
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* App Finder Modal */}
      {appFinderOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="app-finder-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setAppFinderOpen(false)} />
            
            <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl transform transition-all">
              <div className="sticky top-0 z-10 bg-white border-b">
                <div className="flex items-center justify-between p-4">
                  <h2 id="app-finder-title" className="text-lg font-semibold text-gray-900">App Finder</h2>
                  <button
                    onClick={() => setAppFinderOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                {/* Search and Filter Bar */}
                <div className="px-4 pb-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search apps..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                          selectedCategory === category
                            ? 'bg-blue-500 text-white'
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
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No apps found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredApps.map((app) => (
                      <Link
                        key={app.id}
                        href={app.href}
                        onClick={() => setAppFinderOpen(false)}
                        className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200 hover:border-gray-300"
                      >
                        <div className={`w-14 h-14 ${app.color} rounded-xl flex items-center justify-center mb-3`}>
                          <app.icon className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 text-center">{app.name}</h3>
                        <p className="text-xs text-gray-500 text-center mt-1">{app.description}</p>
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
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" aria-modal="true">
            <div className="fixed inset-0 bg-gray-900/50" onClick={() => setSidebarOpen(false)} />
            
            <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white animate-slide-in">
              <div className="flex items-center justify-between h-14 px-4 border-b">
                <span className="text-base font-medium text-gray-800">FinSight</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-900 touch-manipulation"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-4 px-4">
                {navigation.map((item) => {
                  const isActive = router.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 text-sm font-medium touch-manipulation ${
                        isActive 
                          ? 'bg-primary text-white' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
            </nav>
          </div>
        </div>
        )}

        {/* Desktop Sidebar - Collapsible */}
        <div className={`hidden lg:block ${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 ease-in-out bg-white border-r border-gray-200`}>
          <div className="h-full flex flex-col">
            <div className="h-12 px-4 border-b flex items-center justify-center">
              {sidebarOpen && <span className="text-sm font-medium text-gray-800">FinSight Spaces</span>}
            </div>
            <nav className="flex-1 overflow-y-auto py-2">
              {navigation.map((item) => {
                const isActive = router.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center ${sidebarOpen ? 'px-4' : 'px-3 justify-center'} py-3 hover:bg-gray-100 transition-colors ${isActive ? 'bg-primary text-white hover:bg-primary' : 'text-gray-700'}`}
                    title={!sidebarOpen ? item.name : undefined}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && <span className="ml-3">{item.name}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Page Header - Desktop only */}
          <div className="hidden lg:flex h-12 bg-white border-b px-6 items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-medium text-gray-800">
                {navigation.find(item => item.href === router.pathname)?.name || 'FinSight'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="fiori-btn fiori-btn-secondary flex items-center space-x-1 text-sm">
                <span>Filter</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button className="fiori-btn fiori-btn-primary flex items-center space-x-1 text-sm">
                <PlusSquare className="w-4 h-4" />
                <span>New</span>
              </button>
            </div>
          </div>

          {/* SAP Fiori Page Content - Responsive padding */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-[rgb(var(--fiori-content-bg))] pb-20 lg:pb-6">
            <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-[rgb(var(--scb-border))]">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom">
        <div className="grid grid-cols-4 gap-1">
          {mobileNav.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center py-2 px-3 text-xs font-medium touch-manipulation ${
                  isActive ? 'text-primary' : 'text-gray-600'
                }`}
              >
                <item.icon className={`w-6 h-6 mb-1 ${isActive ? 'text-primary' : ''}`} />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Joule AI Assistant Panel - Full Height */}
      {jouleOpen && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out transform translate-x-0">
          {/* Joule Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Sparkles className="w-8 h-8 text-blue-600" />
                <div className="absolute -inset-1">
                  <div className="animate-pulse w-10 h-10 rounded bg-blue-400 opacity-20"></div>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Joule AI Assistant</h2>
                <p className="text-sm text-gray-600">Powered by SAP</p>
              </div>
            </div>
            <button
              onClick={() => setJouleOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Joule Content */}
          <div className="flex-1 overflow-hidden">
            <JouleAssistant open={jouleOpen} onOpenChange={setJouleOpen} />
          </div>
        </div>
      )}
    </div>
  );
}