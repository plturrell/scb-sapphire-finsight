import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { MonochromeIcons } from './MonochromeIcons';
import { useUIPreferences } from '../context/UIPreferencesContext';

/**
 * Perfect Jony Ive Header System
 * 
 * "True sophistication lies in the marriage of functionality and form, 
 * where every element has been distilled to its essential purpose."
 * 
 * Mathematical Precision:
 * - 64px header height (8px grid × 8)
 * - 24px spacing between elements (8px grid × 3)
 * - 16px text for perfect readability
 * - Single color palette: #1d1d1f
 * - Perfect backdrop blur: 20px
 */

const PerfectHeader: React.FC = () => {
  const { isDarkMode } = useUIPreferences();
  const router = useRouter();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Essential navigation - purposeful reduction
  const coreNavigation = [
    { name: 'Overview', href: '/', icon: MonochromeIcons.Home },
    { name: 'Analytics', href: '/analytics', icon: MonochromeIcons.Analytics },
    { name: 'Portfolio', href: '/portfolio', icon: MonochromeIcons.Portfolio },
    { name: 'Development', href: '/todos', icon: MonochromeIcons.GitBranch },
  ];

  const isCurrentPage = (href: string) => {
    if (href === '/') return router.pathname === '/';
    return router.pathname.startsWith(href);
  };

  return (
    <header className="
      fixed top-0 left-0 right-0 z-50
      h-16
      bg-white/90 dark:bg-[#1d1d1f]/90
      backdrop-blur-[20px]
      border-b border-[#1d1d1f]/10 dark:border-white/10
      transition-all duration-200 ease-out
    ">
      <div className="h-full max-w-[1400px] mx-auto px-6">
        <div className="h-full flex items-center justify-between">
          
          {/* Perfect Logo - Mathematical precision */}
          <Link 
            href="/" 
            className="flex items-center space-x-3 group transition-all duration-200"
          >
            <div className="
              w-8 h-8 
              bg-[#1d1d1f] dark:bg-white
              rounded-[6px]
              flex items-center justify-center
              group-hover:scale-105
              transition-transform duration-200 ease-out
            ">
              <span className="
                text-white dark:text-[#1d1d1f] 
                font-semibold text-[13px] 
                leading-none
                font-['SF_Pro_Display']
              ">
                SF
              </span>
            </div>
            <div className="hidden sm:block">
              <div className="
                text-[#1d1d1f] dark:text-white
                font-medium text-[16px] leading-tight
                group-hover:opacity-70
                transition-opacity duration-200
                font-['SF_Pro_Display']
                tracking-[-0.011em]
              ">
                Sapphire FinSight
              </div>
            </div>
          </Link>

          {/* Perfect Search - Inevitable design */}
          <div className="flex-1 max-w-[400px] mx-8">
            <div className={`
              relative
              h-10
              bg-[#1d1d1f]/5 dark:bg-white/5
              rounded-[10px]
              border border-transparent
              transition-all duration-200 ease-out
              ${isSearchFocused 
                ? 'bg-white dark:bg-[#1d1d1f]/20 border-[#1d1d1f]/20 dark:border-white/20 shadow-sm' 
                : 'hover:bg-[#1d1d1f]/8 dark:hover:bg-white/8'
              }
            `}>
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <MonochromeIcons.Search size={16} className="opacity-60" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Search anything..."
                className="
                  w-full h-full
                  bg-transparent
                  pl-10 pr-4
                  text-[#1d1d1f] dark:text-white
                  text-[14px] font-medium
                  placeholder:text-[#1d1d1f]/50 dark:placeholder:text-white/50
                  outline-none
                  rounded-[10px]
                  font-['SF_Pro_Text']
                  tracking-[-0.008em]
                "
              />
            </div>
          </div>

          {/* Perfect Navigation - Essential actions only */}
          <nav className="hidden md:flex items-center space-x-1">
            {coreNavigation.map((item) => {
              const IconComponent = item.icon;
              const isCurrent = isCurrentPage(item.href);
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center space-x-2
                    px-3 py-2
                    rounded-[8px]
                    text-[14px] font-medium
                    font-['SF_Pro_Text']
                    tracking-[-0.008em]
                    transition-all duration-200 ease-out
                    ${isCurrent
                      ? 'bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f]'
                      : 'text-[#1d1d1f] dark:text-white hover:bg-[#1d1d1f]/5 dark:hover:bg-white/5'
                    }
                  `}
                >
                  <IconComponent size={16} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Perfect Actions - Purposeful reduction */}
          <div className="flex items-center space-x-2">
            <Link
              href="/notifications"
              className="
                relative
                w-10 h-10
                flex items-center justify-center
                rounded-[8px]
                text-[#1d1d1f] dark:text-white
                hover:bg-[#1d1d1f]/5 dark:hover:bg-white/5
                transition-all duration-200 ease-out
              "
            >
              <MonochromeIcons.Notifications size={18} />
              <div className="
                absolute top-2 right-2
                w-2 h-2
                bg-red-500
                rounded-full
              " />
            </Link>

            <Link
              href="/settings"
              className="
                w-10 h-10
                flex items-center justify-center
                rounded-[8px]
                text-[#1d1d1f] dark:text-white
                hover:bg-[#1d1d1f]/5 dark:hover:bg-white/5
                transition-all duration-200 ease-out
              "
            >
              <MonochromeIcons.Settings size={18} />
            </Link>

            <button className="
              w-10 h-10
              flex items-center justify-center
              rounded-[8px]
              text-[#1d1d1f] dark:text-white
              hover:bg-[#1d1d1f]/5 dark:hover:bg-white/5
              transition-all duration-200 ease-out
            ">
              <MonochromeIcons.User size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default PerfectHeader;