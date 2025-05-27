import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { MonochromeIcons } from './MonochromeIcons';
import { useUIPreferences } from '../context/UIPreferencesContext';

/**
 * Perfect Jony Ive Sidebar System
 * 
 * "Simplicity is not the absence of clutter, that's a consequence of simplicity. 
 * Simplicity is somehow essentially describing the purpose and place of an object and product."
 * 
 * Mathematical Precision:
 * - 280px sidebar width (8px grid × 35)
 * - 16px navigation padding (8px grid × 2)
 * - 12px section spacing (8px grid × 1.5)
 * - Single color palette: #1d1d1f
 * - Perfect rounded corners: 8px
 */

interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string | number;
  isNew?: boolean;
}

const PerfectSidebar: React.FC = () => {
  const { isDarkMode } = useUIPreferences();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Essential navigation sections with purposeful reduction
  const navigationSections: NavigationSection[] = [
    {
      title: 'Core',
      items: [
        { name: 'Overview', href: '/', icon: MonochromeIcons.Home },
        { name: 'Analytics', href: '/analytics', icon: MonochromeIcons.Analytics },
        { name: 'Portfolio', href: '/portfolio', icon: MonochromeIcons.Portfolio },
      ]
    },
    {
      title: 'Development',
      items: [
        { name: 'Todo List', href: '/todos', icon: MonochromeIcons.GitBranch, isNew: true },
        { name: 'Settings', href: '/settings', icon: MonochromeIcons.Settings },
      ]
    },
    {
      title: 'Intelligence',
      items: [
        { name: 'Notifications', href: '/notifications', icon: MonochromeIcons.Notifications, badge: 3 },
        { name: 'Search', href: '/search', icon: MonochromeIcons.Search },
      ]
    }
  ];

  const isCurrentPage = (href: string) => {
    if (href === '/') return router.pathname === '/';
    return router.pathname.startsWith(href);
  };

  return (
    <aside className={`
      fixed left-0 top-16 bottom-0 z-40
      ${isCollapsed ? 'w-16' : 'w-[280px]'}
      bg-white/90 dark:bg-[#1d1d1f]/90
      backdrop-blur-[20px]
      border-r border-[#1d1d1f]/10 dark:border-white/10
      transition-all duration-300 ease-out
    `}>
      <div className="h-full flex flex-col">
        
        {/* Perfect Header */}
        <div className="p-4 border-b border-[#1d1d1f]/10 dark:border-white/10">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="
                text-[#1d1d1f] dark:text-white 
                font-medium text-[14px]
                font-['SF_Pro_Text']
                tracking-[-0.008em]
              ">
                Navigation
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="
                w-8 h-8
                flex items-center justify-center
                rounded-[6px]
                text-[#1d1d1f] dark:text-white
                hover:bg-[#1d1d1f]/5 dark:hover:bg-white/5
                transition-all duration-200 ease-out
              "
            >
              <MonochromeIcons.ChevronRight 
                size={14} 
                className={`transform transition-transform duration-200 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`}
              />
            </button>
          </div>
        </div>

        {/* Perfect Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="space-y-8">
            {navigationSections.map((section) => (
              <div key={section.title}>
                {/* Section Title */}
                {!isCollapsed && (
                  <div className="
                    text-[#1d1d1f]/60 dark:text-white/60
                    text-[11px] font-semibold uppercase tracking-wider
                    font-['SF_Pro_Text']
                    mb-3
                  ">
                    {section.title}
                  </div>
                )}

                {/* Navigation Items */}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const IconComponent = item.icon;
                    const isCurrent = isCurrentPage(item.href);
                    
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`
                          group
                          flex items-center
                          ${isCollapsed ? 'justify-center px-2' : 'px-3'}
                          py-2.5
                          rounded-[8px]
                          transition-all duration-200 ease-out
                          ${isCurrent
                            ? 'bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] shadow-sm'
                            : 'text-[#1d1d1f] dark:text-white hover:bg-[#1d1d1f]/5 dark:hover:bg-white/5'
                          }
                        `}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <div className="relative">
                          <IconComponent 
                            size={18} 
                            className={`
                              transition-all duration-200
                              ${isCurrent ? 'scale-110' : 'group-hover:scale-105'}
                            `}
                          />
                          
                          {/* Perfect Badge */}
                          {item.badge && (
                            <div className="
                              absolute -top-1 -right-1
                              min-w-[16px] h-4
                              bg-red-500
                              rounded-full
                              flex items-center justify-center
                              text-white text-[10px] font-semibold
                              px-1
                            ">
                              {item.badge}
                            </div>
                          )}
                          
                          {/* New Indicator */}
                          {item.isNew && (
                            <div className="
                              absolute -top-1 -right-1
                              w-2 h-2
                              bg-blue-500
                              rounded-full
                            " />
                          )}
                        </div>

                        {!isCollapsed && (
                          <div className="ml-3 flex items-center justify-between flex-1">
                            <span className="
                              text-[14px] font-medium
                              font-['SF_Pro_Text']
                              tracking-[-0.008em]
                              transition-all duration-200
                            ">
                              {item.name}
                            </span>
                            
                            {item.isNew && (
                              <span className="
                                text-[10px] font-semibold
                                text-blue-500
                                bg-blue-500/10
                                px-2 py-0.5
                                rounded-full
                              ">
                                NEW
                              </span>
                            )}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Perfect Footer */}
        <div className="p-4 border-t border-[#1d1d1f]/10 dark:border-white/10">
          <div className={`
            flex items-center
            ${isCollapsed ? 'justify-center' : 'space-x-3'}
          `}>
            <div className="
              w-8 h-8
              bg-gradient-to-br from-blue-500/20 to-purple-500/20
              rounded-[6px]
              flex items-center justify-center
            ">
              <MonochromeIcons.User size={16} />
            </div>
            
            {!isCollapsed && (
              <div className="flex-1">
                <div className="
                  text-[#1d1d1f] dark:text-white 
                  text-[14px] font-medium
                  font-['SF_Pro_Text']
                  tracking-[-0.008em]
                ">
                  Amanda Chen
                </div>
                <div className="
                  text-[#1d1d1f]/60 dark:text-white/60 
                  text-[12px]
                  font-['SF_Pro_Text']
                  tracking-[0.005em]
                ">
                  Senior Analyst
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default PerfectSidebar;