import React from 'react';
import { Loader } from 'lucide-react';

interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
}

export default function TouchButton({
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
}: TouchButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 touch-manipulation active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';
  
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-primary',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-primary',
    danger: 'bg-destructive text-white hover:bg-red-700 focus:ring-destructive',
  };
  
  const sizeClasses = {
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
}

export function FAB({
  onClick,
  icon,
  label,
  position = 'bottom-right',
  className = '',
}: FABProps) {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
  };
  
  return (
    <button
      onClick={onClick}
      className={`
        fixed z-40 bg-primary text-white rounded-full shadow-lg
        hover:shadow-xl active:scale-95 transition-all duration-200
        touch-manipulation focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
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

// Mobile-optimized segmented control
interface SegmentedControlProps {
  options: { value: string; label: string; icon?: React.ReactNode }[];
  value: string;
  onChange: (value: string) => void;
  fullWidth?: boolean;
  className?: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  fullWidth = false,
  className = '',
}: SegmentedControlProps) {
  return (
    <div
      className={`
        inline-flex rounded-lg border border-gray-300 overflow-hidden
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
            touch-manipulation focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary
            ${value === option.value
              ? 'bg-primary text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
            }
            ${index > 0 ? 'border-l border-gray-300' : ''}
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