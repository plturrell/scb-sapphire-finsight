import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
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
  // Briefcase removed and replaced with Folder from IconExports
  FileBarChart,
  Globe,
  Package,
  AlertCircle,
  Shield,
  ChartBar,
  PieChart,
  TrendingUp,
  UserCircle,
} from 'lucide-react';
import { Icons } from './IconExports';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

// Navigation items for different sections
const primaryNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Portfolio', href: '/portfolio', icon: Target },
  { name: 'Reports', href: '/reports', icon: FileText },
];

const secondaryNavigation = [
  { name: 'Data Products', href: '/data-products', icon: Package },
  { name: 'Tariff Scanner', href: '/tariff-scanner', icon: Globe },
  { name: 'Monte Carlo', href: '/vietnam-monte-carlo', icon: ChartBar },
  { name: 'Settings', href: '/settings', icon: Settings },
];

// Mobile bottom navigation items
const mobileBottomNav = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Analytics', href: '/analytics', icon: Activity },
  { name: 'Portfolio', href: '/portfolio', icon: Icons.Briefcase },
  { name: 'Reports', href: '/reports', icon: FileBarChart },
];

export default function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setSidebarOpen(false);
  }, [router.pathname]);

  const currentPageTitle = [...primaryNavigation, ...secondaryNavigation]
    .find(item => item.href === router.pathname)?.name || 'FinSight';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile/Tablet Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-white border-b border-gray-200 safe-top">
        <div className="flex items-center justify-between h-14 px-4 sm:px-6">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2 rounded-md hover:bg-gray-100 transition-colors touch-manipulation"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>

          <Link href="/" className="flex items-center">
            <Image
              src="/images/finsight-logo.svg"
              alt="FinSight"
              width={120}
              height={30}
              className="h-7 w-auto"
            />
          </Link>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="User menu"
            >
              <UserCircle className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden lg:block h-16 bg-primary text-white">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center">
              <Image
                src="/images/finsight-logo.svg"
                alt="FinSight"
                width={150}
                height={40}
                className="h-8 w-auto brightness-0 invert"
              />
            </Link>

            {/* Desktop search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="search"
                placeholder="Search..."
                className="w-64 pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button className="flex items-center gap-2 p-2 hover:bg-white/10 rounded-lg transition-colors">
              <UserCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Amanda Chen</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 bg-white border-r border-gray-200">
          <nav className="px-4 py-6 space-y-1">
            {primaryNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  router.pathname === item.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
            
            <div className="pt-6">
              <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Advanced Features
              </h3>
              <div className="mt-3 space-y-1">
                {secondaryNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      router.pathname === item.href
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-safe-bottom">
          <div className="h-full lg:px-8 lg:py-6">
            {/* Page header for desktop */}
            <div className="hidden lg:block mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">{currentPageTitle}</h1>
            </div>
            
            {/* Content wrapper with responsive padding */}
            <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-0 lg:py-0">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom">
        <div className="grid grid-cols-4 gap-1">
          {mobileBottomNav.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center py-2 px-3 text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <item.icon className={`w-6 h-6 mb-1 ${isActive ? 'text-primary' : ''}`} />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-gray-900/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white shadow-xl animate-slide-in">
            <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200">
              <Image
                src="/images/finsight-logo.svg"
                alt="FinSight"
                width={120}
                height={30}
                className="h-7 w-auto"
              />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            
            <nav className="px-4 py-6 space-y-1 overflow-y-auto">
              {primaryNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    router.pathname === item.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
              
              <div className="pt-6">
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Advanced Features
                </h3>
                <div className="mt-3 space-y-1">
                  {secondaryNavigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        router.pathname === item.href
                          ? 'bg-primary/10 text-primary'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Notification Panel */}
      {notificationsOpen && (
        <div className="absolute top-16 right-4 w-80 bg-white rounded-lg shadow-lg z-50 lg:right-6">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-2 h-2 mt-1.5 bg-blue-500 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Portfolio Update</p>
                    <p className="text-sm text-gray-500">Your allocation has been optimized</p>
                    <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-2 border-t border-gray-200">
            <Link
              href="/notifications"
              className="text-xs text-primary hover:text-primary-dark"
              onClick={() => setNotificationsOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}

      {/* User Menu */}
      {userMenuOpen && (
        <div className="absolute top-16 right-4 w-64 bg-white rounded-lg shadow-lg z-50 lg:right-6">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900">Amanda Chen</p>
            <p className="text-xs text-gray-500">Investment Analyst</p>
          </div>
          <div className="py-1">
            <Link
              href="/profile"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setUserMenuOpen(false)}
            >
              Profile Settings
            </Link>
            <Link
              href="/help"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setUserMenuOpen(false)}
            >
              Help & Support
            </Link>
            <button
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-100"
              onClick={() => {
                // Handle logout
                setUserMenuOpen(false);
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}