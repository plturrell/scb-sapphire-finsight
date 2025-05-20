import React, { ReactNode, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
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
  ChevronDown, 
  PlusSquare, 
  X, 
  Sparkles,
  Globe,
  TrendingUp,
  Grid,
  HelpCircle,
  Info
} from 'lucide-react';

// Import the best components dynamically
const DashboardLayout = dynamic(() => import('./layout/DashboardLayout'), { ssr: false });
const EnhancedJouleAssistant = dynamic(() => import('./EnhancedJouleAssistant'), { ssr: false });
const EnhancedPerplexityPanel = dynamic(() => import('./EnhancedPerplexityPanel'), { ssr: false });
const JouleAssistant = dynamic(() => import('./JouleAssistant'), { ssr: false });
const PerplexitySearchBar = dynamic(() => import('./PerplexitySearchBar'), { ssr: false });

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  userRole?: 'executive' | 'analyst' | 'operations';
  showJoule?: boolean;
  showSearch?: boolean;
  showNewsBar?: boolean;
  showPerplexityPanel?: boolean;
  sidebarCollapsed?: boolean;
  headerStyle?: 'default' | 'minimal' | 'expanded';
  footerLinks?: Array<{ name: string; href: string; icon: React.ElementType }>;
}

/**
 * Standardized application layout component that provides consistent header, sidebar,
 * search functionality, and Joule integration across all screens.
 * 
 * This is a best-in-class implementation based on modern UI patterns from SAP Fiori, 
 * Perplexity AI, and enterprise FinTech applications. It provides configurable options
 * for features to show/hide based on page requirements.
 */
const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title,
  userRole = 'analyst',
  showJoule = true,
  showSearch = true,
  showNewsBar = false,
  showPerplexityPanel = false,
  sidebarCollapsed = false,
  headerStyle = 'default',
  footerLinks
}) => {
  const router = useRouter();
  
  // State for user role management
  const [currentRole, setCurrentRole] = useState<'executive' | 'analyst' | 'operations'>(userRole);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(sidebarCollapsed);
  const [jouleOpen, setJouleOpen] = useState(false);
  const [newsBarOpen, setNewsBarOpen] = useState(showNewsBar);
  const [perplexityPanelOpen, setPerplexityPanelOpen] = useState(showPerplexityPanel);
  
  // Toggle sidebar collapsed state
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };
  
  // Handle role changes
  const handleRoleChange = (newRole: 'executive' | 'analyst' | 'operations') => {
    setCurrentRole(newRole);
  };
  
  // Generate page title based on current route if not explicitly provided
  const pageTitle = title || getPageTitleFromRoute(router.pathname);

  // Track mobile/responsive state
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    // Check if we're on client side
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
      };
      
      // Initial check
      handleResize();
      
      // Add event listener
      window.addEventListener('resize', handleResize);
      
      // Clean up
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  
  const searchBoxElement = showSearch ? (
    <div className="flex-1 max-w-3xl mx-auto px-4">
      <PerplexitySearchBar />
    </div>
  ) : null;
  
  return (
    <DashboardLayout
      title={pageTitle}
      userRole={currentRole}
      onRoleChange={handleRoleChange}
      searchElement={searchBoxElement}
      showJoule={showJoule}
      showNewsBar={newsBarOpen}
      showPerplexityPanel={perplexityPanelOpen}
      onToggleNewsBar={setNewsBarOpen}
      onToggleJoule={setJouleOpen}
      onTogglePerplexityPanel={setPerplexityPanelOpen}
      isJouleOpen={jouleOpen}
      isPerplexityPanelOpen={perplexityPanelOpen}
    >
      {children}
    </DashboardLayout>
  );
};

/**
 * Helper function to derive page title from route path
 */
function getPageTitleFromRoute(path: string): string {
  // Remove leading slash and query params
  const cleanPath = path.split('/')[1]?.split('?')[0] || '';
  
  if (!cleanPath) return 'Dashboard';
  
  // Convert kebab-case to Title Case
  return cleanPath
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default AppLayout;