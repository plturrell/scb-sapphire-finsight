import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  Search, 
  Clock, 
  Sparkles, 
  ArrowRight,
  BarChart3,
  Target,
  Database,
  TrendingUp,
  Shield,
  FileText,
  Building2,
  Settings
} from 'lucide-react';
import { useUIPreferences } from '@/context/UIPreferencesContext';

interface AppSuggestion {
  id: string;
  name: string;
  href: string;
  icon: React.ElementType;
  description: string;
  category: string;
  relevanceScore: number;
  reason: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  usage: number;
  lastUsed?: Date;
}

interface WorkflowSuggestion {
  id: string;
  title: string;
  description: string;
  apps: AppSuggestion[];
  icon: React.ElementType;
  estimatedTime: string;
}

/**
 * PerfectAppDiscovery - Intelligent, Contextual App Discovery
 * 
 * Jony Ive Philosophy:
 * 1. Inevitable Choices - Surface exactly what's needed
 * 2. Purposeful Curation - Quality over quantity
 * 3. Anticipatory Intelligence - Predict user intent
 * 4. Effortless Flow - Reduce decision fatigue
 */
const PerfectAppDiscovery: React.FC = () => {
  const router = useRouter();
  const { isDarkMode } = useUIPreferences();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<'suggestions' | 'recent' | 'workflows'>('suggestions');
  
  // All available apps with intelligent metadata
  const apps: AppSuggestion[] = [
    {
      id: 'analytics',
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      description: 'Deep financial analysis and insights',
      category: 'Analysis',
      relevanceScore: 0.95,
      reason: 'Your most-used analysis tool',
      timeOfDay: 'afternoon',
      usage: 0.9,
      lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
      id: 'portfolio',
      name: 'Portfolio',
      href: '/portfolio',
      icon: Target,
      description: 'Monitor your investment performance',
      category: 'Monitoring',
      relevanceScore: 0.88,
      reason: 'Daily portfolio check recommended',
      timeOfDay: 'morning',
      usage: 0.8,
      lastUsed: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
    },
    {
      id: 'trading',
      name: 'Trading',
      href: '/trading',
      icon: TrendingUp,
      description: 'Execute trades and market analysis',
      category: 'Trading',
      relevanceScore: 0.82,
      reason: 'Market is active now',
      timeOfDay: 'afternoon',
      usage: 0.7
    },
    {
      id: 'risk',
      name: 'Risk',
      href: '/risk',
      icon: Shield,
      description: 'Risk assessment and compliance',
      category: 'Monitoring',
      relevanceScore: 0.75,
      reason: 'Weekly risk review due',
      usage: 0.6
    },
    {
      id: 'companies',
      name: 'Companies',
      href: '/companies',
      icon: Building2,
      description: 'Research companies and fundamentals',
      category: 'Research',
      relevanceScore: 0.68,
      reason: 'Research trending stocks',
      usage: 0.5
    },
    {
      id: 'data-products',
      name: 'Data Explorer',
      href: '/data-products',
      icon: Database,
      description: 'Explore financial datasets',
      category: 'Data',
      relevanceScore: 0.60,
      reason: 'New datasets available',
      usage: 0.4
    },
    {
      id: 'reports',
      name: 'Reports',
      href: '/reports',
      icon: FileText,
      description: 'Generate and view reports',
      category: 'Reporting',
      relevanceScore: 0.55,
      reason: 'Monthly report due soon',
      usage: 0.5
    }
  ];
  
  // Intelligent workflow suggestions
  const workflows: WorkflowSuggestion[] = [
    {
      id: 'morning-review',
      title: 'Morning Portfolio Review',
      description: 'Check overnight performance and market outlook',
      apps: apps.filter(app => ['portfolio', 'analytics', 'risk'].includes(app.id)),
      icon: Target,
      estimatedTime: '10 min'
    },
    {
      id: 'market-analysis',
      title: 'Market Analysis Session',
      description: 'Deep dive into market trends and opportunities',
      apps: apps.filter(app => ['analytics', 'trading', 'companies'].includes(app.id)),
      icon: BarChart3,
      estimatedTime: '25 min'
    },
    {
      id: 'weekly-reporting',
      title: 'Weekly Reporting',
      description: 'Generate comprehensive performance reports',
      apps: apps.filter(app => ['reports', 'analytics', 'portfolio'].includes(app.id)),
      icon: FileText,
      estimatedTime: '15 min'
    }
  ];
  
  // Get contextual suggestions based on time and usage
  const getContextualSuggestions = () => {
    const hour = new Date().getHours();
    const timeContext = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    
    return apps
      .filter(app => {
        // Time-based relevance
        if (app.timeOfDay && app.timeOfDay !== timeContext) {
          app.relevanceScore *= 0.8;
        }
        
        // Recent usage boost
        if (app.lastUsed) {
          const hoursAgo = (Date.now() - app.lastUsed.getTime()) / (1000 * 60 * 60);
          if (hoursAgo < 4) app.relevanceScore *= 1.2;
        }
        
        return true;
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 4);
  };
  
  // Get recent apps
  const getRecentApps = () => {
    return apps
      .filter(app => app.lastUsed)
      .sort((a, b) => (b.lastUsed?.getTime() || 0) - (a.lastUsed?.getTime() || 0))
      .slice(0, 3);
  };
  
  // Filter apps based on search
  const getSearchResults = () => {
    if (!searchQuery) return [];
    
    return apps.filter(app =>
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  
  const contextualSuggestions = getContextualSuggestions();
  const recentApps = getRecentApps();
  const searchResults = getSearchResults();
  
  const AppCard: React.FC<{ app: AppSuggestion; showReason?: boolean }> = ({ app, showReason = false }) => (
    <Link
      href={app.href}
      className={`
        group block transition-all duration-500 ease-out
        hover:scale-[1.03] hover:shadow-2xl
        transform-gpu
      `}
    >
      <div className={`
        p-8 rounded-[2rem] relative overflow-hidden
        ${isDarkMode 
          ? 'bg-gradient-to-br from-gray-800/40 to-gray-700/20 border border-gray-700/30' 
          : 'bg-gradient-to-br from-white/80 to-gray-50/60 border border-gray-200/40'
        }
        backdrop-blur-xl shadow-lg group-hover:shadow-xl
        transition-all duration-500 ease-out
      `}>
        <div className="flex items-start space-x-6 relative z-10">
          {/* Perfect Icon Container */}
          <div className={`
            w-16 h-16 rounded-[1.25rem] flex items-center justify-center
            ${isDarkMode 
              ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30' 
              : 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20'
            }
            backdrop-blur-sm shadow-inner
            group-hover:scale-110 group-hover:rotate-3
            transition-all duration-500 ease-out
          `}>
            <app.icon className="w-8 h-8 text-blue-500 transition-all duration-300 group-hover:scale-110" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className={`perfect-h5 mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {app.name}
            </h3>
            <p className={`perfect-body-small mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
              {app.description}
            </p>
            
            {showReason && app.reason && (
              <div className={`
                inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium
                ${isDarkMode 
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                  : 'bg-blue-500/8 text-blue-600 border border-blue-500/15'
                }
                transition-all duration-300 group-hover:scale-105
              `}>
                <Sparkles className="w-3 h-3" />
                <span>{app.reason}</span>
              </div>
            )}
          </div>
          
          {/* Subtle Arrow */}
          <div className={`
            w-8 h-8 rounded-xl flex items-center justify-center
            ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'}
            opacity-0 group-hover:opacity-100
            transform translate-x-2 group-hover:translate-x-0
            transition-all duration-300 ease-out
          `}>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
        
        {/* Perfect Background Glow */}
        <div className={`
          absolute top-0 right-0 w-32 h-32 rounded-full
          bg-gradient-to-br from-blue-400/10 to-purple-400/10
          blur-3xl opacity-0 group-hover:opacity-100
          transition-opacity duration-700 ease-out
          pointer-events-none
        `} />
      </div>
    </Link>
  );
  
  const WorkflowCard: React.FC<{ workflow: WorkflowSuggestion }> = ({ workflow }) => (
    <div className={`
      p-6 rounded-3xl transition-all duration-300
      ${isDarkMode 
        ? 'bg-gradient-to-r from-gray-800/60 to-gray-700/60 border border-gray-700/50' 
        : 'bg-gradient-to-r from-blue-50/60 to-purple-50/60 border border-gray-200/50'
      }
      backdrop-blur-sm hover:scale-[1.01] cursor-pointer
    `}>
      <div className="flex items-start space-x-4">
        <div className={`
          p-3 rounded-2xl 
          ${isDarkMode ? 'bg-purple-500/20' : 'bg-purple-500/10'}
        `}>
          <workflow.icon className="w-6 h-6 text-purple-500" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {workflow.title}
            </h3>
            <span className={`text-xs px-2 py-1 rounded-full ${
              isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}>
              {workflow.estimatedTime}
            </span>
          </div>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {workflow.description}
          </p>
          
          <div className="flex items-center mt-3 space-x-2">
            {workflow.apps.slice(0, 3).map((app) => (
              <div
                key={app.id}
                className={`
                  p-1 rounded-lg 
                  ${isDarkMode ? 'bg-gray-700' : 'bg-white'}
                `}
              >
                <app.icon className="w-4 h-4 text-blue-500" />
              </div>
            ))}
            {workflow.apps.length > 3 && (
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                +{workflow.apps.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="max-w-4xl mx-auto p-8">
      
      {/* Perfect Search - Jony Ive Inspired */}
      <div className="mb-12">
        <div className="relative max-w-2xl mx-auto">
          <div className={`
            absolute left-6 top-1/2 transform -translate-y-1/2 transition-all duration-300
            ${searchQuery ? 'scale-90 opacity-60' : 'scale-100 opacity-80'}
          `}>
            <Search className={`w-6 h-6 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="What would you like to work on?"
            className={`
              w-full pl-16 pr-8 py-6 rounded-3xl text-xl font-light tracking-wide
              ${isDarkMode 
                ? 'bg-gray-800/30 border-2 border-gray-700/30 text-white placeholder-gray-400' 
                : 'bg-white/80 border-2 border-gray-200/30 text-gray-900 placeholder-gray-500'
              }
              backdrop-blur-xl shadow-xl
              focus:outline-none focus:border-blue-500/50 focus:bg-opacity-100
              focus:shadow-2xl focus:scale-[1.02]
              transition-all duration-500 ease-out
              hover:shadow-xl hover:scale-[1.01]
            `}
            style={{
              letterSpacing: '0.02em',
              lineHeight: '1.2'
            }}
          />
          
          {/* Search Enhancement Glow */}
          {searchQuery && (
            <div className={`
              absolute inset-0 rounded-3xl opacity-20 pointer-events-none
              bg-gradient-to-r from-blue-500 to-purple-500 blur-xl
              animate-pulse
            `} />
          )}
        </div>
      </div>
      
      {/* Search Results */}
      {searchQuery && searchResults.length > 0 && (
        <div className="mb-8">
          <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Search Results
          </h2>
          <div className="grid gap-4">
            {searchResults.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        </div>
      )}
      
      {/* Main Content - Only show when not searching */}
      {!searchQuery && (
        <>
          {/* Contextual Suggestions */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="w-5 h-5 text-blue-500" />
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Suggested for You
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contextualSuggestions.map((app) => (
                <AppCard key={app.id} app={app} showReason />
              ))}
            </div>
          </div>
          
          {/* Recent Apps */}
          {recentApps.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <Clock className="w-5 h-5 text-gray-500" />
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Recently Used
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentApps.map((app) => (
                  <AppCard key={app.id} app={app} />
                ))}
              </div>
            </div>
          )}
          
          {/* Workflow Suggestions */}
          <div className="mb-8">
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Suggested Workflows
            </h2>
            <div className="grid gap-4">
              {workflows.map((workflow) => (
                <WorkflowCard key={workflow.id} workflow={workflow} />
              ))}
            </div>
          </div>
        </>
      )}
      
      {/* Quick Settings Access */}
      <div className="mt-12 pt-8 border-t border-gray-200/20">
        <Link
          href="/settings"
          className={`
            flex items-center justify-center space-x-2 p-4 rounded-2xl
            ${isDarkMode 
              ? 'bg-gray-800/30 hover:bg-gray-700/50 text-gray-400 hover:text-white' 
              : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600 hover:text-gray-900'
            }
            transition-all duration-200
          `}
        >
          <Settings className="w-5 h-5" />
          <span>Customize Experience</span>
        </Link>
      </div>
    </div>
  );
};

export default PerfectAppDiscovery;