import React from 'react';
import { Loader } from 'lucide-react';

interface EnhancedLoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'muted' | 'inverted';
  message?: string;
  className?: string;
  fullPage?: boolean;
}

/**
 * Enhanced Loading Spinner with SCB beautiful styling
 */
const EnhancedLoadingSpinner: React.FC<EnhancedLoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  message,
  className = '',
  fullPage = false
}) => {
  // Size mappings
  const sizeClasses = {
    xs: 'h-4 w-4',
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  // Variant mappings to SCB colors
  const variantClasses = {
    default: 'border-b-[rgb(var(--scb-honolulu-blue))]',
    primary: 'border-b-[rgb(var(--scb-american-green))]',
    muted: 'border-b-[rgb(var(--scb-dark-gray))]',
    inverted: 'border-b-white'
  };

  // Text size based on spinner size
  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  // For full page loading
  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
        <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-[rgba(var(--scb-light-gray),0.3)] ${variantClasses[variant]}`}></div>
        {message && (
          <p className={`mt-4 ${textSizeClasses[size]} text-[rgb(var(--scb-dark-gray))]`}>{message}</p>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-[rgba(var(--scb-light-gray),0.3)] ${variantClasses[variant]}`}></div>
      {message && (
        <p className={`mt-2 ${textSizeClasses[size]} text-[rgb(var(--scb-dark-gray))]`}>{message}</p>
      )}
    </div>
  );
};

/**
 * Enhanced Inline Loading Spinner - can be used inline with text
 */
export const EnhancedInlineSpinner: React.FC<{
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}> = ({
  size = 'sm',
  className = ''
}) => {
  const sizeMap = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5'
  };

  return (
    <Loader
      className={`animate-spin text-[rgb(var(--scb-honolulu-blue))] ${sizeMap[size]} ${className}`}
    />
  );
};

/**
 * Enhanced Loading Button - Button with loading state
 */
export const EnhancedLoadingButton: React.FC<{
  loading: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
}> = ({
  loading,
  children,
  className = '',
  onClick,
  disabled = false,
  variant = 'primary'
}) => {
  const baseClasses = 'scb-btn inline-flex items-center justify-center gap-2 rounded-md transition-colors';
  const variantClasses = {
    primary: 'scb-btn-primary',
    secondary: 'scb-btn-secondary',
    ghost: 'scb-btn-ghost'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      disabled={loading || disabled}
    >
      {loading && <EnhancedInlineSpinner size="sm" />}
      {children}
    </button>
  );
};

/**
 * Enhanced Skeleton Loading Animation for content placeholders
 */
export const EnhancedSkeletonLoader: React.FC<{
  width?: string;
  height?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}> = ({
  width = '100%',
  height = '1.5rem',
  rounded = 'md',
  className = ''
}) => {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  };

  return (
    <div 
      className={`skeleton bg-[rgba(var(--scb-light-gray),0.3)] ${roundedClasses[rounded]} ${className}`}
      style={{ width, height }}
    ></div>
  );
};

/**
 * Enhanced Page Loader - Specifically for page transitions
 */
export const EnhancedPageLoader: React.FC<{
  message?: string;
}> = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
      <div className="w-full max-w-xs p-6 text-center">
        <div className="inline-block mb-4">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-[rgba(var(--scb-honolulu-blue),0.1)] border-t-[rgb(var(--scb-honolulu-blue))]"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-10 w-10 rounded-full bg-white"></div>
            </div>
          </div>
        </div>
        <p className="text-sm text-[rgb(var(--scb-dark-gray))]">{message}</p>
      </div>
    </div>
  );
};

export { EnhancedLoadingSpinner };
export default EnhancedLoadingSpinner;