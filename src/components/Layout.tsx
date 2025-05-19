import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import CompanySearchBar from './CompanySearchBar';
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
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Portfolio', href: '/portfolio', icon: Target },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

// Mobile bottom navigation
const mobileNav = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Analytics', href: '/analytics', icon: PieChart },
  { name: 'Portfolio', href: '/portfolio', icon: Target },
  { name: 'Reports', href: '/reports', icon: FileText },
];

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
  }, [router.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-[rgb(var(--fiori-content-bg))]">
      {/* SAP Fiori Shell Header - Responsive */}
      <header className="fiori-shell-header flex items-center px-4 justify-between z-50 h-14 lg:h-12 safe-top">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 -ml-2 text-white touch-manipulation"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Branding Area */}
        <div className="flex items-center h-full">
          <Link href="/" className="flex items-center">
            <Image 
              src="https://av.sc.com/corp-en/nr/content/images/sc-lock-up-english-grey-rgb.png" 
              alt="Standard Chartered" 
              width={150} 
              height={36} 
              className="h-7 w-auto lg:h-8" 
              priority
            />
          </Link>
        </div>

        {/* Shell Header Actions */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Company Search Bar - Hidden on mobile */}
          <div className="hidden lg:block flex-1 max-w-2xl mx-4">
            <CompanySearchBar />
          </div>
          
          {/* App Finder - Desktop only */}
          <button 
            className="hidden lg:flex h-full px-3 text-white hover:bg-white/10 items-center space-x-1"
            title="App Finder"
          >
            <Grid className="w-5 h-5" />
          </button>

          {/* Help - Desktop only */}
          <button 
            className="hidden lg:flex h-full px-3 text-white hover:bg-white/10"
            title="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          
          {/* Notifications */}
          <div className="relative">
            <button 
              className="h-full px-2 lg:px-3 text-white hover:bg-white/10 relative touch-manipulation"
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                if (userMenuOpen) setUserMenuOpen(false);
              }}
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 bg-red-500 rounded-full w-2 h-2 lg:w-4 lg:h-4 lg:flex lg:items-center lg:justify-center lg:text-[10px] lg:font-bold">
                <span className="hidden lg:inline">3</span>
              </span>
            </button>
            
            {/* Notifications Panel - Responsive */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-lg overflow-hidden z-50">
                <div className="px-4 py-3 bg-gray-50 border-b">
                  <h3 className="text-sm font-medium text-gray-700">Notifications</h3>
                </div>
                <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                  <div className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex">
                      <div className="flex-shrink-0 bg-blue-500 rounded-full w-2 h-2 mt-2"></div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Portfolio Alert</p>
                        <p className="text-xs text-gray-500">Your tech sector allocation is above threshold</p>
                        <p className="text-xs text-gray-400 mt-1">10 minutes ago</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex">
                      <div className="flex-shrink-0 bg-green-500 rounded-full w-2 h-2 mt-2"></div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Report Generated</p>
                        <p className="text-xs text-gray-500">Q2 Financial Analysis is ready to view</p>
                        <p className="text-xs text-gray-400 mt-1">1 hour ago</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex">
                      <div className="flex-shrink-0 bg-yellow-500 rounded-full w-2 h-2 mt-2"></div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Market Update</p>
                        <p className="text-xs text-gray-500">Market volatility has increased by 15%</p>
                        <p className="text-xs text-gray-400 mt-1">3 hours ago</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-2 border-t text-center">
                  <Link href="#" className="text-xs text-blue-600 hover:text-blue-700">View all notifications</Link>
                </div>
              </div>
            )}
          </div>
          
          {/* User Menu */}
          <div className="relative">
            <button 
              className="h-full px-2 lg:px-3 flex items-center gap-1 lg:gap-2 text-white hover:bg-white/10 touch-manipulation"
              onClick={() => {
                setUserMenuOpen(!userMenuOpen);
                if (notificationsOpen) setNotificationsOpen(false);
              }}
            >
              <div className="w-6 h-6 lg:w-7 lg:h-7 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <span className="text-sm hidden md:inline">Amanda Chen</span>
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
                  <Link href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <Grid className="mr-3 h-4 w-4 text-gray-400" />
                    App Finder
                  </Link>
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

        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 fiori-sidebar">
          <div className="h-full flex flex-col">
            <div className="h-12 px-4 border-b flex items-center">
              <span className="text-sm font-medium text-gray-800">FinSight Spaces</span>
            </div>
            <nav className="flex-1 overflow-y-auto py-2">
              {navigation.map((item) => {
                const isActive = router.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`fiori-sidebar-item flex items-center space-x-3 ${isActive ? 'active' : ''}`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
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
    </div>
  );
}