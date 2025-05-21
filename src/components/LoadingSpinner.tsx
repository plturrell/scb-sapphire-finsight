import React from 'react';
import { Loader } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'muted' | 'inverted';
  message?: string;
  className?: string;
  fullPage?: boolean;
}

/**
 * Enhanced Loading Spinner with SCB beautiful styling
 * This is a bridge component that uses the same interface as EnhancedLoadingSpinner
 * for backward compatibility
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
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
 * Inline Loading Spinner - can be used inline with text
 */
export const InlineSpinner: React.FC<{
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

export { LoadingSpinner };
export default LoadingSpinner;