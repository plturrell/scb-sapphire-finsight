import React from 'react';
import { useUIPreferences } from '@/context/UIPreferencesContext';

interface PerfectIconProps {
  name: string;
  size?: 'small' | 'medium' | 'large' | 'hero';
  variant?: 'minimal' | 'outlined' | 'filled' | 'glass';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';
  className?: string;
  animate?: boolean;
}

/**
 * PerfectIcons - Jony Ive Inspired Icon System
 * 
 * Principles:
 * 1. Geometric Perfection - Based on perfect circles, squares, and golden ratio
 * 2. Purposeful Weight - Each variant serves a specific semantic purpose
 * 3. Contextual Intelligence - Icons adapt to their environment
 * 4. Effortless Recognition - Instantly communicates function
 * 5. Beautiful Simplicity - Reduced to essential elements only
 */
const PerfectIcon: React.FC<PerfectIconProps> = ({
  name,
  size = 'medium',
  variant = 'minimal',
  color = 'neutral',
  className = '',
  animate = false
}) => {
  const { isDarkMode } = useUIPreferences();
  
  // Perfect size scale based on golden ratio
  const sizeMap = {
    small: '16',
    medium: '24', 
    large: '32',
    hero: '48'
  };
  
  // Perfect color system
  const colorMap = {
    primary: isDarkMode ? '#007AFF' : '#0066CC',
    secondary: isDarkMode ? '#34C759' : '#28A745',
    success: isDarkMode ? '#30D158' : '#28A745',
    warning: isDarkMode ? '#FF9F0A' : '#FD7E14',
    error: isDarkMode ? '#FF453A' : '#DC3545',
    neutral: isDarkMode ? '#8E8E93' : '#6C757D'
  };
  
  const iconColor = colorMap[color];
  const iconSize = sizeMap[size];
  
  // Base classes for perfect icons
  const baseClasses = `
    ${animate ? 'transition-all duration-300 ease-out' : ''}
    ${className}
  `;
  
  // Perfect geometric icons with mathematical precision
  const renderIcon = () => {
    switch (name) {
      case 'analytics':
        return (
          <svg 
            width={iconSize} 
            height={iconSize} 
            viewBox="0 0 24 24" 
            className={baseClasses}
            style={{ color: iconColor }}
          >
            {variant === 'filled' ? (
              <g fill="currentColor">
                <rect x="3" y="12" width="4" height="9" rx="2" />
                <rect x="10" y="8" width="4" height="13" rx="2" />
                <rect x="17" y="4" width="4" height="17" rx="2" />
              </g>
            ) : variant === 'glass' ? (
              <g>
                <rect x="3" y="12" width="4" height="9" rx="2" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="10" y="8" width="4" height="13" rx="2" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="17" y="4" width="4" height="17" rx="2" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5" />
              </g>
            ) : (
              <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="12" width="4" height="9" rx="2" />
                <rect x="10" y="8" width="4" height="13" rx="2" />
                <rect x="17" y="4" width="4" height="17" rx="2" />
              </g>
            )}
          </svg>
        );
        
      case 'portfolio':
        return (
          <svg 
            width={iconSize} 
            height={iconSize} 
            viewBox="0 0 24 24" 
            className={baseClasses}
            style={{ color: iconColor }}
          >
            {variant === 'filled' ? (
              <circle cx="12" cy="12" r="8" fill="currentColor">
                <circle cx="12" cy="12" r="3" fill="white" />
              </circle>
            ) : variant === 'glass' ? (
              <g>
                <circle cx="12" cy="12" r="8" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="12" cy="8" r="2" fill="currentColor" fillOpacity="0.3" />
                <circle cx="12" cy="16" r="1.5" fill="currentColor" fillOpacity="0.3" />
              </g>
            ) : (
              <g fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="8" />
                <circle cx="12" cy="8" r="2" />
                <circle cx="12" cy="16" r="1.5" />
              </g>
            )}
          </svg>
        );
        
      case 'trading':
        return (
          <svg 
            width={iconSize} 
            height={iconSize} 
            viewBox="0 0 24 24" 
            className={baseClasses}
            style={{ color: iconColor }}
          >
            {variant === 'filled' ? (
              <path 
                d="M3 12L12 3L21 12L17 12L17 21L7 21L7 12L3 12Z" 
                fill="currentColor" 
              />
            ) : variant === 'glass' ? (
              <path 
                d="M3 12L12 3L21 12L17 12L17 21L7 21L7 12L3 12Z" 
                fill="currentColor" 
                fillOpacity="0.1" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinejoin="round"
              />
            ) : (
              <path 
                d="M7 17L12 12L17 17M12 3V17" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            )}
          </svg>
        );
        
      case 'risk':
        return (
          <svg 
            width={iconSize} 
            height={iconSize} 
            viewBox="0 0 24 24" 
            className={baseClasses}
            style={{ color: iconColor }}
          >
            {variant === 'filled' ? (
              <path 
                d="M12 2L3 7V12C3 16.97 6.84 21.26 12 22C17.16 21.26 21 16.97 21 12V7L12 2Z" 
                fill="currentColor" 
              />
            ) : variant === 'glass' ? (
              <path 
                d="M12 2L3 7V12C3 16.97 6.84 21.26 12 22C17.16 21.26 21 16.97 21 12V7L12 2Z" 
                fill="currentColor" 
                fillOpacity="0.1" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinejoin="round"
              />
            ) : (
              <path 
                d="M12 2L3 7V12C3 16.97 6.84 21.26 12 22C17.16 21.26 21 16.97 21 12V7L12 2Z" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            )}
          </svg>
        );
        
      case 'search':
        return (
          <svg 
            width={iconSize} 
            height={iconSize} 
            viewBox="0 0 24 24" 
            className={baseClasses}
            style={{ color: iconColor }}
          >
            {variant === 'filled' ? (
              <g fill="currentColor">
                <circle cx="11" cy="11" r="6" />
                <path d="M21 21L16.5 16.5" strokeWidth="2" strokeLinecap="round" stroke="white" />
              </g>
            ) : variant === 'glass' ? (
              <g>
                <circle cx="11" cy="11" r="6" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5" />
                <path d="M21 21L16.5 16.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </g>
            ) : (
              <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="6" />
                <path d="M21 21L16.5 16.5" />
              </g>
            )}
          </svg>
        );
        
      case 'settings':
        return (
          <svg 
            width={iconSize} 
            height={iconSize} 
            viewBox="0 0 24 24" 
            className={baseClasses}
            style={{ color: iconColor }}
          >
            {variant === 'filled' ? (
              <path 
                d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L19 7C18.8 6.2 18.6 5.4 18.2 4.7L19.4 3.5L18 2.1L16.8 3.3C16.1 2.9 15.3 2.7 14.5 2.5V1H9.5V2.5C8.7 2.7 7.9 2.9 7.2 3.3L6 2.1L4.6 3.5L5.8 4.7C5.4 5.4 5.2 6.2 5 7H3V9H5C5.2 9.8 5.4 10.6 5.8 11.3L4.6 12.5L6 13.9L7.2 12.7C7.9 13.1 8.7 13.3 9.5 13.5V15H14.5V13.5C15.3 13.3 16.1 13.1 16.8 12.7L18 13.9L19.4 12.5L18.2 11.3C18.6 10.6 18.8 9.8 19 9H21Z" 
                fill="currentColor" 
              />
            ) : (
              <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </g>
            )}
          </svg>
        );
        
      case 'insight':
        return (
          <svg 
            width={iconSize} 
            height={iconSize} 
            viewBox="0 0 24 24" 
            className={baseClasses}
            style={{ color: iconColor }}
          >
            {variant === 'filled' ? (
              <path 
                d="M12 2L2 7V17L12 22L22 17V7L12 2Z" 
                fill="currentColor" 
              />
            ) : variant === 'glass' ? (
              <g>
                <path 
                  d="M12 2L2 7V17L12 22L22 17V7L12 2Z" 
                  fill="currentColor" 
                  fillOpacity="0.1" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.3" />
              </g>
            ) : (
              <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" />
                <circle cx="12" cy="12" r="3" />
              </g>
            )}
          </svg>
        );
        
      default:
        return (
          <svg 
            width={iconSize} 
            height={iconSize} 
            viewBox="0 0 24 24" 
            className={baseClasses}
            style={{ color: iconColor }}
          >
            <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        );
    }
  };
  
  return (
    <div className={`inline-flex items-center justify-center ${animate ? 'hover:scale-110 active:scale-95' : ''} transition-transform duration-200 ease-out`}>
      {renderIcon()}
    </div>
  );
};

// Icon container with perfect proportions
export const PerfectIconContainer: React.FC<{
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'hero';
  variant?: 'minimal' | 'soft' | 'bold' | 'glass';
  className?: string;
}> = ({ 
  children, 
  size = 'medium', 
  variant = 'soft',
  className = '' 
}) => {
  const { isDarkMode } = useUIPreferences();
  
  const sizeClasses = {
    small: 'w-10 h-10',
    medium: 'w-12 h-12', 
    large: 'w-16 h-16',
    hero: 'w-24 h-24'
  };
  
  const variantClasses = {
    minimal: '',
    soft: isDarkMode 
      ? 'bg-gray-800/30 backdrop-blur-sm' 
      : 'bg-gray-100/50 backdrop-blur-sm',
    bold: isDarkMode 
      ? 'bg-gray-700 shadow-lg' 
      : 'bg-white shadow-lg',
    glass: 'bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl'
  };
  
  return (
    <div className={`
      ${sizeClasses[size]} 
      ${variantClasses[variant]}
      rounded-2xl flex items-center justify-center
      transition-all duration-300 ease-out
      ${className}
    `}>
      {children}
    </div>
  );
};

export default PerfectIcon;