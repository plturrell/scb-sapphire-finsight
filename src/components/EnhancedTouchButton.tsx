import React from 'react';
import { Loader } from 'lucide-react';

interface EnhancedTouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
}

export default function EnhancedTouchButton({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  children,
  disabled,
  ...props
}: EnhancedTouchButtonProps) {
  const baseClasses = 'fiori-btn inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 touch-manipulation active:scale-[0.98] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';
  
  const variantClasses = {
    primary: 'fiori-btn-primary',
    secondary: 'fiori-btn-secondary',
    ghost: 'fiori-btn-ghost',
    success: 'bg-[rgb(var(--scb-american-green))] text-white border border-[rgb(var(--scb-american-green))] hover:bg-[rgba(var(--scb-american-green),0.9)]',
    danger: 'bg-[rgb(var(--scb-muted-red))] text-white border border-[rgb(var(--scb-muted-red))] hover:bg-[rgba(var(--scb-muted-red),0.9)]',
  };
  
  const sizeClasses = {
    xs: 'min-h-[32px] px-2.5 py-1 text-xs gap-1',
    sm: 'min-h-[36px] px-3 py-1.5 text-sm gap-1.5',
    md: 'min-h-[44px] px-4 py-2 text-base gap-2',
    lg: 'min-h-[52px] px-6 py-3 text-lg gap-3',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  const combinedClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    widthClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={combinedClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader className="w-4 h-4 animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}

// Specialized mobile-friendly FAB (Floating Action Button)
interface FABProps {
  onClick: () => void;
  icon: React.ReactNode;
  label?: string;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  className?: string;
  variant?: 'primary' | 'secondary' | 'success';
}

export function EnhancedFAB({
  onClick,
  icon,
  label,
  position = 'bottom-right',
  className = '',
  variant = 'primary',
}: FABProps) {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
  };
  
  const variantClasses = {
    primary: 'bg-[rgb(var(--scb-honolulu-blue))] text-white hover:bg-[rgba(var(--scb-honolulu-blue),0.9)]',
    secondary: 'bg-white text-[rgb(var(--scb-honolulu-blue))] border border-[rgb(var(--scb-honolulu-blue))] hover:bg-[rgba(var(--scb-honolulu-blue),0.05)]',
    success: 'bg-[rgb(var(--scb-american-green))] text-white hover:bg-[rgba(var(--scb-american-green),0.9)]',
  };
  
  return (
    <button
      onClick={onClick}
      className={`
        fixed z-40 ${variantClasses[variant]} rounded-full shadow-lg
        hover:shadow-xl active:scale-95 transition-all duration-200
        touch-manipulation focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(var(--horizon-focus-color))]
        ${label ? 'px-6 py-4' : 'p-4'}
        ${positionClasses[position]}
        ${className}
      `}
      aria-label={label || 'Floating action button'}
    >
      <div className="flex items-center gap-2">
        {icon}
        {label && <span className="font-medium">{label}</span>}
      </div>
    </button>
  );
}

// Mobile-optimized segmented control with SCB styling
interface SegmentedControlProps {
  options: { value: string; label: string; icon?: React.ReactNode }[];
  value: string;
  onChange: (value: string) => void;
  fullWidth?: boolean;
  className?: string;
}

export function EnhancedSegmentedControl({
  options,
  value,
  onChange,
  fullWidth = false,
  className = '',
}: SegmentedControlProps) {
  return (
    <div
      className={`
        inline-flex rounded-lg border border-[rgb(var(--scb-border))] overflow-hidden
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      role="group"
    >
      {options.map((option, index) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`
            flex-1 px-4 py-2 text-sm font-medium transition-colors
            touch-manipulation focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[rgb(var(--horizon-focus-color))]
            ${value === option.value
              ? 'bg-[rgb(var(--scb-honolulu-blue))] text-white'
              : 'bg-white text-[rgb(var(--scb-dark-gray))] hover:bg-[rgba(var(--scb-light-gray),0.5)]'
            }
            ${index > 0 ? 'border-l border-[rgb(var(--scb-border))]' : ''}
          `}
        >
          <div className="flex items-center justify-center gap-2">
            {option.icon}
            <span>{option.label}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

// Pill tabs for horizontal filtering/navigation with SCB styling
interface PillTabsProps {
  tabs: { value: string; label: string; icon?: React.ReactNode }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function EnhancedPillTabs({
  tabs,
  value,
  onChange,
  className = '',
}: PillTabsProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`
            inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium
            transition-colors touch-manipulation
            ${value === tab.value
              ? 'bg-[rgb(var(--scb-honolulu-blue))] text-white'
              : 'bg-[rgba(var(--scb-light-gray),0.5)] text-[rgb(var(--scb-dark-gray))] hover:bg-[rgba(var(--scb-light-gray),0.8)]'
            }
          `}
        >
          <div className="flex items-center gap-1.5">
            {tab.icon}
            <span>{tab.label}</span>
          </div>
        </button>
      ))}
    </div>
  );
}