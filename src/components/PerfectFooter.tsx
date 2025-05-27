import React from 'react';
import Link from 'next/link';
import { MonochromeIcons } from './MonochromeIcons';
import { useUIPreferences } from '../context/UIPreferencesContext';

/**
 * Perfect Jony Ive Footer System
 * 
 * "Design is not just what it looks like and feels like. Design is how it works."
 * 
 * Mathematical Precision:
 * - 88px mobile tab bar height (11px grid × 8) - perfect thumb reach
 * - 56px desktop footer height (8px grid × 7)
 * - 4 essential actions maximum - cognitive load optimization
 * - Single color palette: #1d1d1f
 * - SF Pro typography with perfect letter spacing
 */

interface FooterAction {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  isActive?: boolean;
  badge?: number;
}

const PerfectFooter: React.FC = () => {
  const { isDarkMode } = useUIPreferences();

  // Essential actions only - purposeful reduction
  const coreActions: FooterAction[] = [
    { name: 'Overview', href: '/', icon: MonochromeIcons.Home },
    { name: 'Analytics', href: '/analytics', icon: MonochromeIcons.Analytics },
    { name: 'Portfolio', href: '/portfolio', icon: MonochromeIcons.Portfolio },
    { name: 'Development', href: '/todos', icon: MonochromeIcons.GitBranch, badge: 3 },
  ];

  return (
    <>
      {/* Mobile Tab Bar - Bottom Navigation */}
      <nav className="
        md:hidden
        fixed bottom-0 left-0 right-0 z-50
        h-[88px]
        bg-white/95 dark:bg-[#1d1d1f]/95
        backdrop-blur-[20px]
        border-t border-[#1d1d1f]/10 dark:border-white/10
        safe-area-inset-bottom
      ">
        <div className="h-full px-4 pt-2 pb-6">
          <div className="flex items-center justify-around h-full">
            {coreActions.map((action) => {
              const IconComponent = action.icon;
              
              return (
                <Link
                  key={action.name}
                  href={action.href}
                  className="
                    flex flex-col items-center justify-center
                    min-w-[60px] h-full
                    transition-all duration-200 ease-out
                    group
                  "
                >
                  <div className="relative mb-1">
                    <IconComponent 
                      size={24} 
                      className="
                        text-[#1d1d1f] dark:text-white
                        group-active:scale-95
                        transition-transform duration-150
                      " 
                    />
                    
                    {/* Perfect Badge */}
                    {action.badge && (
                      <div className="
                        absolute -top-1 -right-1
                        min-w-[18px] h-[18px]
                        bg-red-500
                        rounded-full
                        flex items-center justify-center
                        text-white text-[11px] font-semibold
                        font-['SF_Pro_Text']
                        px-1
                      ">
                        {action.badge}
                      </div>
                    )}
                  </div>
                  
                  <span className="
                    text-[11px] font-medium
                    font-['SF_Pro_Text']
                    tracking-[0.008em]
                    text-[#1d1d1f] dark:text-white
                    group-active:opacity-60
                    transition-opacity duration-150
                  ">
                    {action.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Desktop Footer - Minimal Information */}
      <footer className="
        hidden md:block
        mt-16
        border-t border-[#1d1d1f]/10 dark:border-white/10
        bg-white/90 dark:bg-[#1d1d1f]/90
        backdrop-blur-[20px]
      ">
        <div className="max-w-[1400px] mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            
            {/* Brand Information */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="
                  w-6 h-6 
                  bg-[#1d1d1f] dark:bg-white
                  rounded-[4px]
                  flex items-center justify-center
                ">
                  <span className="
                    text-white dark:text-[#1d1d1f] 
                    font-semibold text-[10px] 
                    leading-none
                    font-['SF_Pro_Display']
                  ">
                    SF
                  </span>
                </div>
                <div className="
                  text-[#1d1d1f] dark:text-white
                  text-[14px] font-medium
                  font-['SF_Pro_Text']
                  tracking-[-0.008em]
                ">
                  Sapphire FinSight
                </div>
              </div>
              
              <div className="
                text-[#1d1d1f]/60 dark:text-white/60
                text-[12px]
                font-['SF_Pro_Text']
                tracking-[0.005em]
              ">
                © 2024 Standard Chartered Bank
              </div>
            </div>

            {/* Essential Links */}
            <div className="flex items-center space-x-6">
              <Link 
                href="/help" 
                className="
                  text-[#1d1d1f]/60 dark:text-white/60
                  hover:text-[#1d1d1f] dark:hover:text-white
                  text-[12px] font-medium
                  font-['SF_Pro_Text']
                  tracking-[0.005em]
                  transition-colors duration-200
                "
              >
                Help
              </Link>
              <Link 
                href="/settings" 
                className="
                  text-[#1d1d1f]/60 dark:text-white/60
                  hover:text-[#1d1d1f] dark:hover:text-white
                  text-[12px] font-medium
                  font-['SF_Pro_Text']
                  tracking-[0.005em]
                  transition-colors duration-200
                "
              >
                Settings
              </Link>
              <div className="
                text-[#1d1d1f]/40 dark:text-white/40
                text-[12px]
                font-['SF_Pro_Text']
                tracking-[0.005em]
              ">
                v2.1.0
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default PerfectFooter;