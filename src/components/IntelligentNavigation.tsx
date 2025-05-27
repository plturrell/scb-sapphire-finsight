import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  BarChart3, 
  Target, 
  FileText, 
  Database,
  TrendingUp,
  Shield,
  Building2,
  Settings,
  ChevronRight
} from 'lucide-react';
import { useUIPreferences } from '@/context/UIPreferencesContext';

interface NavigationIntent {
  category: 'analyze' | 'monitor' | 'report' | 'manage';
  confidence: number;
  suggestedNext?: string[];
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  category: 'analyze' | 'monitor' | 'report' | 'manage';
  keywords: string[];
  usage?: number;
  lastUsed?: Date;
}

/**
 * IntelligentNavigation - Contextual, Learning Navigation
 * 
 * Jony Ive Principles:
 * 1. Anticipatory Design - Predicts user needs
 * 2. Purposeful Hierarchy - Shows what matters now
 * 3. Effortless Interaction - Minimal cognitive load
 * 4. Coherent Experience - Consistent across contexts
 */
const IntelligentNavigation: React.FC = () => {
  const router = useRouter();
  const { isDarkMode } = useUIPreferences();
  
  const [userIntent, setUserIntent] = useState<NavigationIntent>({ 
    category: 'analyze', 
    confidence: 0.7 
  });
  const [recentActivity, setRecentActivity] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Core navigation items with intelligent categorization
  const navigationItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Overview',
      href: '/',
      icon: LayoutDashboard,
      category: 'monitor',
      keywords: ['overview', 'summary', 'dashboard', 'home'],
      usage: 0.8
    },
    {
      id: 'analytics',
      label: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      category: 'analyze',
      keywords: ['analytics', 'analyze', 'data', 'insights', 'trends'],
      usage: 0.9
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      href: '/portfolio',
      icon: Target,
      category: 'monitor',
      keywords: ['portfolio', 'investments', 'holdings', 'performance'],
      usage: 0.7
    },
    {
      id: 'trading',
      label: 'Trading',
      href: '/trading',
      icon: TrendingUp,
      category: 'analyze',
      keywords: ['trading', 'markets', 'positions', 'orders'],
      usage: 0.6
    },
    {
      id: 'risk',
      label: 'Risk',
      href: '/risk',
      icon: Shield,
      category: 'monitor',
      keywords: ['risk', 'exposure', 'limits', 'compliance'],
      usage: 0.5
    },
    {
      id: 'companies',
      label: 'Companies',
      href: '/companies',
      icon: Building2,
      category: 'analyze',
      keywords: ['companies', 'research', 'fundamentals', 'search'],
      usage: 0.4
    },
    {
      id: 'data-products',
      label: 'Data',
      href: '/data-products',
      icon: Database,
      category: 'analyze',
      keywords: ['data', 'datasets', 'products', 'sources'],
      usage: 0.3
    },
    {
      id: 'reports',
      label: 'Reports',
      href: '/reports',
      icon: FileText,
      category: 'report',
      keywords: ['reports', 'documents', 'export', 'generate'],
      usage: 0.6
    }
  ];
  
  // Intelligent intent detection based on current path and time
  useEffect(() => {
    const detectIntent = () => {
      const path = router.pathname;
      const hour = new Date().getHours();
      
      // Morning: monitoring focus
      if (hour >= 6 && hour < 12) {
        if (path.includes('dashboard') || path === '/') {
          setUserIntent({ category: 'monitor', confidence: 0.9 });
        }
      }
      // Afternoon: analysis focus  
      else if (hour >= 12 && hour < 18) {
        if (path.includes('analytics') || path.includes('trading')) {
          setUserIntent({ category: 'analyze', confidence: 0.9 });
        }
      }
      // Evening: reporting focus
      else {
        setUserIntent({ category: 'report', confidence: 0.8 });
      }
    };
    
    detectIntent();
  }, [router.pathname]);
  
  // Get prioritized navigation based on intent
  const getPrioritizedNavigation = () => {
    const currentCategory = userIntent.category;
    const primary = navigationItems.filter(item => item.category === currentCategory);
    const secondary = navigationItems.filter(item => item.category !== currentCategory);
    
    // Sort by usage and relevance
    primary.sort((a, b) => (b.usage || 0) - (a.usage || 0));
    secondary.sort((a, b) => (b.usage || 0) - (a.usage || 0));
    
    return { primary: primary.slice(0, 3), secondary: secondary.slice(0, 2) };
  };
  
  const { primary, secondary } = getPrioritizedNavigation();
  
  // Get current navigation item
  const currentItem = navigationItems.find(item => 
    router.pathname === item.href || 
    (item.href !== '/' && router.pathname.startsWith(item.href))
  );
  
  return (
    <nav className={`
      fixed left-8 top-1/2 transform -translate-y-1/2 z-40
      transition-all duration-500 ease-out
      ${isDarkMode ? 'text-white' : 'text-gray-900'}
    `}>
      
      {/* Primary Navigation - Always Visible */}
      <div className={`
        backdrop-blur-xl rounded-3xl p-2
        ${isDarkMode 
          ? 'bg-gray-900/80 border border-gray-700/50' 
          : 'bg-white/80 border border-gray-200/50'
        }
        shadow-xl
      `}>
        
        {/* Intent Context Indicator */}
        <div className="px-4 py-3 mb-2">
          <div className="flex items-center space-x-2">
            <div className={`
              w-2 h-2 rounded-full
              ${userIntent.category === 'analyze' ? 'bg-blue-500' :
                userIntent.category === 'monitor' ? 'bg-green-500' :
                userIntent.category === 'report' ? 'bg-purple-500' :
                'bg-orange-500'
              }
            `} />
            <span className="text-xs font-medium opacity-60 capitalize">
              {userIntent.category} Mode
            </span>
          </div>
        </div>
        
        {/* Primary Navigation Items */}
        <div className="space-y-1">
          {primary.map((item) => {
            const isActive = currentItem?.id === item.id;
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`
                  group flex items-center space-x-3 px-4 py-3 rounded-2xl
                  transition-all duration-200 relative
                  ${isActive
                    ? isDarkMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : isDarkMode
                      ? 'hover:bg-gray-800 text-gray-300 hover:text-white'
                      : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                <span className="font-medium">{item.label}</span>
                
                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                )}
              </Link>
            );
          })}
        </div>
        
        {/* Expand Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            w-full mt-2 p-3 rounded-2xl transition-all duration-200
            ${isDarkMode 
              ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
            }
            flex items-center justify-center
          `}
        >
          <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${
            isExpanded ? 'rotate-90' : ''
          }`} />
        </button>
      </div>
      
      {/* Secondary Navigation - Expandable */}
      {isExpanded && (
        <div className={`
          mt-4 backdrop-blur-xl rounded-3xl p-2
          ${isDarkMode 
            ? 'bg-gray-900/60 border border-gray-700/30' 
            : 'bg-white/60 border border-gray-200/30'
          }
          shadow-lg opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]
        `}>
          <div className="space-y-1">
            {secondary.map((item) => {
              const isActive = currentItem?.id === item.id;
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`
                    group flex items-center space-x-3 px-4 py-2 rounded-xl
                    transition-all duration-200 text-sm
                    ${isActive
                      ? isDarkMode
                        ? 'bg-blue-600/80 text-white'
                        : 'bg-blue-500/80 text-white'
                      : isDarkMode
                        ? 'hover:bg-gray-800/50 text-gray-400 hover:text-white'
                        : 'hover:bg-gray-100/50 text-gray-500 hover:text-gray-900'
                    }
                  `}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            
            {/* Settings Access */}
            <Link
              href="/settings"
              className={`
                group flex items-center space-x-3 px-4 py-2 rounded-xl
                transition-all duration-200 text-sm mt-4 border-t pt-4
                ${isDarkMode 
                  ? 'border-gray-700/50 hover:bg-gray-800/50 text-gray-400 hover:text-white' 
                  : 'border-gray-200/50 hover:bg-gray-100/50 text-gray-500 hover:text-gray-900'
                }
              `}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Link>
          </div>
        </div>
      )}
      
      {/* Context Breadcrumb - Minimal */}
      {currentItem && (
        <div className={`
          mt-4 px-4 py-2 rounded-full text-xs font-medium
          ${isDarkMode 
            ? 'bg-gray-900/40 text-gray-400' 
            : 'bg-white/40 text-gray-600'
          }
          backdrop-blur-md
        `}>
          {currentItem.label}
        </div>
      )}
    </nav>
  );
};

export default IntelligentNavigation;