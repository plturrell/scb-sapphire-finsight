import React, { ReactNode, useState } from 'react';
import { 
  BarChart3, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  CircleUser, 
  Home, 
  Menu, 
  PieChart, 
  Settings, 
  Wallet, 
  TrendingUp,
  X,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import PerplexityNewsBar from '../PerplexityNewsBar';
// Removed JouleAssistantWrapper import as we're using GlobalJouleAssistant

// Import SVG logo as a component
const SCBLogo = () => (
  <svg width="32" height="32" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M30 0C13.4315 0 0 13.4315 0 30C0 46.5685 13.4315 60 30 60C46.5685 60 60 46.5685 60 30C60 13.4315 46.5685 0 30 0Z" fill="white"/>
    <path d="M30 55C43.8071 55 55 43.8071 55 30C55 16.1929 43.8071 5 30 5C16.1929 5 5 16.1929 5 30C5 43.8071 16.1929 55 30 55Z" fill="#0072AA"/>
    <path d="M20 40C25.5228 40 30 35.5228 30 30C30 24.4772 25.5228 20 20 20C14.4772 20 10 24.4772 10 30C10 35.5228 14.4772 40 20 40Z" fill="#21AA47"/>
    <path d="M40 40C45.5228 40 50 35.5228 50 30C50 24.4772 45.5228 20 40 20C34.4772 20 30 24.4772 30 30C30 35.5228 34.4772 40 40 40Z" fill="white"/>
  </svg>
);

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, href, active, onClick }) => (
  <Link href={href} passHref>
    <a 
      className={`fiori-sidebar-item flex items-center py-3 px-4 my-1 rounded-md transition-colors ${
        active ? 'bg-[rgba(var(--scb-honolulu-blue),0.1)] text-[rgb(var(--scb-honolulu-blue))] font-medium border-l-2 border-[rgb(var(--scb-honolulu-blue))]' : ''
      }`}
      onClick={onClick}
    >
      <span className="mr-3">{icon}</span>
      {label}
    </a>
  </Link>
);

interface UserSelectorProps {
  currentRole: 'executive' | 'analyst' | 'operations';
  onRoleChange: (role: 'executive' | 'analyst' | 'operations') => void;
}

const UserRoleSelector: React.FC<UserSelectorProps> = ({ currentRole, onRoleChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const roles = [
    { id: 'executive' as const, name: 'Executive View' },
    { id: 'analyst' as const, name: 'Analyst View' },
    { id: 'operations' as const, name: 'Operations View' }
  ];
  
  return (
    <div className="relative">
      <button 
        className="flex items-center justify-between w-full px-4 py-2 text-sm border border-[rgb(var(--scb-border))] rounded-md bg-white"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select dashboard view type"
      >
        <div className="flex items-center">
          <CircleUser size={16} className="mr-2 text-[rgb(var(--scb-honolulu-blue))]" />
          <span>{roles.find(r => r.id === currentRole)?.name}</span>
        </div>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-[rgb(var(--scb-border))] rounded-md shadow-lg z-10"
          role="listbox"
          aria-label="Available dashboard views"
        >
          <ul>
            {roles.map(role => (
              <li key={role.id}>
                <button
                  className={`w-full text-left px-4 py-2 hover:bg-[rgba(var(--scb-honolulu-blue),0.05)] ${
                    currentRole === role.id ? 'bg-[rgba(var(--scb-honolulu-blue),0.1)] font-medium' : ''
                  }`}
                  onClick={() => {
                    onRoleChange(role.id);
                    setIsOpen(false);
                  }}
                  role="option"
                  aria-selected={currentRole === role.id}
                >
                  {role.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  userRole?: 'executive' | 'analyst' | 'operations';
  onRoleChange?: (role: 'executive' | 'analyst' | 'operations') => void;
}

/**
 * Dashboard Layout Component for SCB Sapphire FinSight
 * Implements responsive design following SAP Fiori principles
 * with SCB branding and role-based adaptability
 */
const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children,
  title = 'FinSight Dashboard',
  userRole: externalUserRole,
  onRoleChange: externalRoleChange
}) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [internalUserRole, setInternalUserRole] = useState<'executive' | 'analyst' | 'operations'>('analyst'); // Default to analyst view
  const [showNewsBar, setShowNewsBar] = useState(false);
  // We're now using GlobalJouleAssistant instead
  // const [jouleOpen, setJouleOpen] = useState(false);
  const [newsItem, setNewsItem] = useState<{
    title: string;
    summary: string;
    category: string;
    source: string;
  } | undefined>(undefined);
  
  // Use external role if provided, otherwise use internal state
  const userRole = externalUserRole || internalUserRole;
  
  // Determine if a sidebar link is active
  const isActive = (path: string) => router.pathname === path;
  
  // Toggle sidebar for desktop view
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Handle role change
  const handleRoleChange = (role: 'executive' | 'analyst' | 'operations') => {
    // If external handler provided, use it; otherwise update internal state
    if (externalRoleChange) {
      externalRoleChange(role);
    } else {
      setInternalUserRole(role);
    }
  };
  
  // This functionality now uses the GlobalJouleAssistant
  const handleAnalyzeNews = (item: any) => {
    // This will be handled by the GlobalJouleAssistant
    console.log('News analysis request will be handled by GlobalJouleAssistant', item);
    // The actual implementation would involve calling the GlobalJouleAssistant API
  };
  
  // Toggle news bar
  const toggleNewsBar = () => {
    setShowNewsBar(!showNewsBar);
  };
  
  return (
    <div className="flex h-screen bg-[rgb(var(--scb-light-gray))]">
      {/* Desktop Sidebar */}
      <aside 
        className={`fiori-sidebar fixed inset-y-0 left-0 z-20 flex flex-col transition-all duration-300 transform lg:translate-x-0 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative`}
      >
        {/* Mobile close button */}
        <button 
          className="absolute top-4 right-4 p-1 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <X size={20} />
        </button>
        
        {/* Logo */}
        <div className={`flex items-center h-16 px-4 border-b border-[rgb(var(--scb-border))] ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
          <div className="flex items-center gap-2">
            <SCBLogo />
            {sidebarOpen && <span className="scb-section-header">SCB Sapphire</span>}
          </div>
          
          {sidebarOpen && (
            <button 
              className="p-1 rounded-full hover:bg-[rgba(var(--scb-honolulu-blue),0.05)] lg:block hidden"
              onClick={toggleSidebar}
            >
              <ChevronLeft size={20} />
            </button>
          )}
          
          {!sidebarOpen && (
            <button 
              className="p-1 rounded-full hover:bg-[rgba(var(--scb-honolulu-blue),0.05)] absolute -right-4 top-8 bg-white border border-[rgb(var(--scb-border))] shadow-sm lg:block hidden"
              onClick={toggleSidebar}
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>
        
        {/* Role Selector */}
        {sidebarOpen && (
          <div className="px-4 py-3 border-b border-[rgb(var(--scb-border))]">
            <UserRoleSelector 
              currentRole={userRole} 
              onRoleChange={handleRoleChange} 
            />
          </div>
        )}
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul>
            <li>
              <SidebarItem 
                icon={<Home size={sidebarOpen ? 20 : 24} />} 
                label={sidebarOpen ? "Dashboard" : ""}
                href="/dashboard" 
                active={isActive('/dashboard')}
                onClick={() => setMobileMenuOpen(false)}
              />
            </li>
            <li>
              <SidebarItem 
                icon={<PieChart size={sidebarOpen ? 20 : 24} />} 
                label={sidebarOpen ? "Portfolio" : ""}
                href="/portfolio" 
                active={isActive('/portfolio')}
                onClick={() => setMobileMenuOpen(false)}
              />
            </li>
            <li>
              <SidebarItem 
                icon={<BarChart3 size={sidebarOpen ? 20 : 24} />} 
                label={sidebarOpen ? "Analytics" : ""}
                href="/analytics" 
                active={isActive('/analytics')}
                onClick={() => setMobileMenuOpen(false)}
              />
            </li>
            <li>
              <SidebarItem 
                icon={<TrendingUp size={sidebarOpen ? 20 : 24} />} 
                label={sidebarOpen ? "Financial Simulation" : ""}
                href="/financial-simulation" 
                active={isActive('/financial-simulation')}
                onClick={() => setMobileMenuOpen(false)}
              />
            </li>
            <li>
              <SidebarItem 
                icon={<AlertTriangle size={sidebarOpen ? 20 : 24} />} 
                label={sidebarOpen ? "Tariff Scanner" : ""}
                href="/tariff-scanner" 
                active={isActive('/tariff-scanner')}
                onClick={() => setMobileMenuOpen(false)}
              />
            </li>
            <li>
              <SidebarItem 
                icon={<Wallet size={sidebarOpen ? 20 : 24} />} 
                label={sidebarOpen ? "Investments" : ""}
                href="/investments" 
                active={isActive('/investments')}
                onClick={() => setMobileMenuOpen(false)}
              />
            </li>
          </ul>
        </nav>
        
        {/* Footer */}
        <div className="p-4 border-t border-[rgb(var(--scb-border))]">
          <SidebarItem 
            icon={<Settings size={sidebarOpen ? 20 : 24} />} 
            label={sidebarOpen ? "Settings" : ""}
            href="/settings" 
            active={isActive('/settings')}
            onClick={() => setMobileMenuOpen(false)}
          />
        </div>
      </aside>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* News Bar */}
        {showNewsBar && (
          <div className="fixed right-0 top-16 bottom-0 z-20">
            <PerplexityNewsBar onAnalyzeNews={handleAnalyzeNews} />
          </div>
        )}
      
        {/* Joule Assistant moved to GlobalJouleAssistant */}
        
        {/* Header */}
        <header className="fiori-shell-header flex items-center justify-between px-4 h-16 bg-[rgb(var(--scb-honolulu-blue))] text-white shadow-md">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button 
              className="p-1 mr-4 rounded-md hover:bg-[rgba(255,255,255,0.1)] lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            
            <h1 className="scb-title text-white">{title}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              className="p-2 rounded-md hover:bg-[rgba(255,255,255,0.1)] flex items-center"
              onClick={toggleNewsBar}
              title="Toggle market news"
            >
              <span className="mr-2 text-sm font-medium hidden md:block">Market News</span>
              <span className={`flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold ${showNewsBar ? 'bg-white text-[rgb(var(--scb-honolulu-blue))]' : 'bg-[rgba(255,255,255,0.2)]'}`}>
                P
              </span>
            </button>
            {/* Joule button moved to GlobalJouleAssistant */}
          </div>
        </header>
        
        {/* Page Content */}
        <main className={`flex-1 overflow-auto p-6 ${showNewsBar ? 'mr-80' : ''} transition-all duration-300`}>
          {/* Breadcrumbs */}
          <div className="fiori-breadcrumbs mb-4 text-sm text-[rgb(var(--scb-dark-gray))]">
            {/* Dynamic breadcrumbs would go here */}
            <span>Home</span>
            <span className="mx-2">/</span>
            <span className="font-medium">{title}</span>
          </div>
          
          {/* Main content - role-based views */}
          <div className={`role-view-${userRole}`}>
            {children}
          </div>
        </main>
      </div>
      
      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
