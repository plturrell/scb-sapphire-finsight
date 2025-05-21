import React, { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import useDarkMode from '@/hooks/useDarkMode';
import tokens from '@/styles/tokens';
import { motion } from '@/styles/motion';
import { useReducedMotionPreference } from '@/hooks/useReducedMotion';

type ThemeToggleProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  variant?: 'icon' | 'button' | 'dropdown';
  position?: 'top-right' | 'bottom-right' | 'header' | 'sidebar';
};

/**
 * ThemeToggle component allowing users to switch between light, dark, and system theme
 */
const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  size = 'md',
  showLabel = false,
  variant = 'icon',
  position = 'top-right',
}) => {
  const { isDarkMode, preference, setMode } = useDarkMode();
  const { prefersReducedMotion } = useReducedMotionPreference();
  const [isOpen, setIsOpen] = useState(false);

  // Size maps
  const sizeMap = {
    sm: {
      button: 'h-8 w-8',
      icon: 'h-4 w-4',
      text: 'text-xs',
      dropdown: 'w-28',
    },
    md: {
      button: 'h-10 w-10',
      icon: 'h-5 w-5',
      text: 'text-sm',
      dropdown: 'w-32',
    },
    lg: {
      button: 'h-12 w-12',
      icon: 'h-6 w-6',
      text: 'text-base',
      dropdown: 'w-36',
    },
  };

  // Get icon based on current theme
  const getThemeIcon = () => {
    switch (preference) {
      case 'light':
        return <Sun className={sizeMap[size].icon} />;
      case 'dark':
        return <Moon className={sizeMap[size].icon} />;
      default:
        return <Monitor className={sizeMap[size].icon} />;
    }
  };

  // Get text label based on current theme
  const getThemeLabel = () => {
    switch (preference) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      default:
        return 'System';
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (isOpen && !(e.target as Element).closest('.theme-toggle-container')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Style for position
  const positionStyles = {
    'top-right': 'fixed top-4 right-4 z-50',
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'header': '',
    'sidebar': '',
  };

  // Handle theme change
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setMode(newTheme);
    setIsOpen(false);
  };

  const buttonAnimation = prefersReducedMotion
    ? {}
    : motion.animationPresets.buttonPress();

  // Icon-only toggle
  if (variant === 'icon') {
    return (
      <div className={`theme-toggle-container ${positionStyles[position]} ${className}`}>
        <button
          aria-label={`Switch to ${preference === 'light' ? 'dark' : 'light'} mode`}
          onClick={() => setMode(preference === 'light' ? 'dark' : 'light')}
          className={`${sizeMap[size].button} rounded-md flex items-center justify-center transition-colors 
          ${isDarkMode 
            ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
            : 'bg-white text-gray-800 hover:bg-gray-100'} 
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
          border border-gray-200 dark:border-gray-700 shadow-sm`}
          style={buttonAnimation}
        >
          {getThemeIcon()}
        </button>
      </div>
    );
  }

  // Button toggle with optional label
  if (variant === 'button') {
    return (
      <div className={`theme-toggle-container ${positionStyles[position]} ${className}`}>
        <button
          aria-label={`Current theme: ${getThemeLabel()}`}
          onClick={() => setMode(preference === 'light' ? 'dark' : preference === 'dark' ? 'system' : 'light')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md
          transition-colors duration-200 
          ${isDarkMode 
            ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' 
            : 'bg-white text-gray-800 hover:bg-gray-100'}
          focus:outline-none focus:ring-2 focus:ring-primary-500
          border border-gray-200 dark:border-gray-700 shadow-sm`}
          style={buttonAnimation}
        >
          {getThemeIcon()}
          {showLabel && (
            <span className={`${sizeMap[size].text}`}>{getThemeLabel()}</span>
          )}
        </button>
      </div>
    );
  }

  // Dropdown toggle
  return (
    <div className={`theme-toggle-container relative ${positionStyles[position]} ${className}`}>
      <button
        aria-label={`Current theme: ${getThemeLabel()}, click to change`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between space-x-2 px-3 py-2 rounded-md
        w-full transition-colors duration-200
        ${isDarkMode 
          ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' 
          : 'bg-white text-gray-800 hover:bg-gray-100'}
        focus:outline-none focus:ring-2 focus:ring-primary-500
        border border-gray-200 dark:border-gray-700 shadow-sm
        ${sizeMap[size].dropdown}`}
        style={buttonAnimation}
      >
        <div className="flex items-center space-x-2">
          {getThemeIcon()}
          <span className={`${sizeMap[size].text}`}>{getThemeLabel()}</span>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute top-full mt-1 w-full rounded-md shadow-lg
          ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
          border overflow-hidden z-10`}
          style={prefersReducedMotion ? {} : motion.animationPresets.scaleIn({ 
            duration: tokens.animation.duration.fast,
            origin: 'top' 
          })}
        >
          <ul role="listbox" className="py-1">
            <li
              role="option"
              aria-selected={preference === 'light'}
              className={`flex items-center space-x-2 px-3 py-2 cursor-pointer
              ${preference === 'light' ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
              ${isDarkMode 
                ? 'hover:bg-gray-700 text-gray-200' 
                : 'hover:bg-gray-100 text-gray-800'}`}
              onClick={() => handleThemeChange('light')}
            >
              <Sun className={sizeMap[size].icon} />
              <span className={sizeMap[size].text}>Light</span>
            </li>
            <li
              role="option"
              aria-selected={preference === 'dark'}
              className={`flex items-center space-x-2 px-3 py-2 cursor-pointer
              ${preference === 'dark' ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
              ${isDarkMode 
                ? 'hover:bg-gray-700 text-gray-200' 
                : 'hover:bg-gray-100 text-gray-800'}`}
              onClick={() => handleThemeChange('dark')}
            >
              <Moon className={sizeMap[size].icon} />
              <span className={sizeMap[size].text}>Dark</span>
            </li>
            <li
              role="option"
              aria-selected={preference === 'system'}
              className={`flex items-center space-x-2 px-3 py-2 cursor-pointer
              ${preference === 'system' ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
              ${isDarkMode 
                ? 'hover:bg-gray-700 text-gray-200' 
                : 'hover:bg-gray-100 text-gray-800'}`}
              onClick={() => handleThemeChange('system')}
            >
              <Monitor className={sizeMap[size].icon} />
              <span className={sizeMap[size].text}>System</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;