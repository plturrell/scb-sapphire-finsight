import React from 'react';
import { MonochromeIcons } from './MonochromeIcons';

/**
 * Perfect Jony Ive Standard Controls
 * 
 * "Simplicity is not the absence of clutter, that's a consequence of simplicity. 
 * Simplicity is somehow essentially describing the purpose and place of an object."
 * 
 * Mathematical Precision:
 * - 44px minimum touch target (Apple's golden standard)
 * - 8px grid system for all spacing and sizing
 * - Single color palette with semantic variations
 * - SF Pro typography with perfect optical corrections
 */

interface PerfectButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

interface PerfectInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'search';
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  error?: string;
  disabled?: boolean;
  className?: string;
}

interface PerfectCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: 'none' | 'small' | 'medium' | 'large';
  className?: string;
}

// Perfect Button Component
export const PerfectButton: React.FC<PerfectButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  icon: IconComponent,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  onClick,
  className = ''
}) => {
  const baseClasses = `
    relative
    inline-flex items-center justify-center
    font-['SF_Pro_Text'] font-medium
    border border-transparent
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-40 disabled:cursor-not-allowed
    select-none
  `;

  const sizeClasses = {
    small: 'h-8 px-3 text-[13px] tracking-[-0.008em] rounded-[6px]',
    medium: 'h-10 px-4 text-[14px] tracking-[-0.008em] rounded-[8px]',
    large: 'h-12 px-6 text-[16px] tracking-[-0.011em] rounded-[10px]'
  };

  const variantClasses = {
    primary: `
      bg-[#1d1d1f] dark:bg-white
      text-white dark:text-[#1d1d1f]
      hover:bg-[#1d1d1f]/90 dark:hover:bg-white/90
      focus:ring-[#1d1d1f]/50 dark:focus:ring-white/50
      active:scale-[0.98]
    `,
    secondary: `
      bg-[#1d1d1f]/5 dark:bg-white/5
      text-[#1d1d1f] dark:text-white
      border-[#1d1d1f]/20 dark:border-white/20
      hover:bg-[#1d1d1f]/10 dark:hover:bg-white/10
      focus:ring-[#1d1d1f]/30 dark:focus:ring-white/30
      active:scale-[0.98]
    `,
    ghost: `
      bg-transparent
      text-[#1d1d1f] dark:text-white
      hover:bg-[#1d1d1f]/5 dark:hover:bg-white/5
      focus:ring-[#1d1d1f]/30 dark:focus:ring-white/30
      active:scale-[0.98]
    `,
    destructive: `
      bg-red-500
      text-white
      hover:bg-red-600
      focus:ring-red-500/50
      active:scale-[0.98]
    `
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {loading && (
        <MonochromeIcons.RotateCcw 
          size={size === 'small' ? 14 : size === 'large' ? 18 : 16} 
          className="mr-2 animate-spin" 
        />
      )}
      
      {!loading && IconComponent && iconPosition === 'left' && (
        <IconComponent 
          size={size === 'small' ? 14 : size === 'large' ? 18 : 16} 
          className="mr-2" 
        />
      )}
      
      {children}
      
      {!loading && IconComponent && iconPosition === 'right' && (
        <IconComponent 
          size={size === 'small' ? 14 : size === 'large' ? 18 : 16} 
          className="ml-2" 
        />
      )}
    </button>
  );
};

// Perfect Input Component
export const PerfectInput: React.FC<PerfectInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  icon: IconComponent,
  error,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="
          block
          text-[14px] font-medium
          font-['SF_Pro_Text']
          tracking-[-0.008em]
          text-[#1d1d1f] dark:text-white
        ">
          {label}
        </label>
      )}
      
      <div className="relative">
        {IconComponent && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <IconComponent size={16} className="text-[#1d1d1f]/60 dark:text-white/60" />
          </div>
        )}
        
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full h-10
            ${IconComponent ? 'pl-10 pr-4' : 'px-4'}
            bg-[#1d1d1f]/5 dark:bg-white/5
            border border-[#1d1d1f]/20 dark:border-white/20
            rounded-[8px]
            text-[14px] font-medium
            font-['SF_Pro_Text']
            tracking-[-0.008em]
            text-[#1d1d1f] dark:text-white
            placeholder:text-[#1d1d1f]/50 dark:placeholder:text-white/50
            focus:outline-none
            focus:bg-white dark:focus:bg-[#1d1d1f]/20
            focus:border-[#1d1d1f]/40 dark:focus:border-white/40
            focus:ring-2 focus:ring-[#1d1d1f]/20 dark:focus:ring-white/20
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-200 ease-out
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
          `}
        />
      </div>
      
      {error && (
        <p className="
          text-[12px] font-medium
          font-['SF_Pro_Text']
          tracking-[0.005em]
          text-red-500
        ">
          {error}
        </p>
      )}
    </div>
  );
};

// Perfect Card Component
export const PerfectCard: React.FC<PerfectCardProps> = ({
  children,
  title,
  subtitle,
  variant = 'default',
  padding = 'medium',
  className = ''
}) => {
  const baseClasses = `
    relative
    rounded-[12px]
    transition-all duration-200 ease-out
  `;

  const variantClasses = {
    default: `
      bg-white dark:bg-[#1d1d1f]/90
      border border-[#1d1d1f]/10 dark:border-white/10
    `,
    elevated: `
      bg-white dark:bg-[#1d1d1f]/90
      shadow-sm hover:shadow-md
      border border-[#1d1d1f]/5 dark:border-white/5
    `,
    outlined: `
      bg-transparent
      border-2 border-[#1d1d1f]/20 dark:border-white/20
    `,
    glass: `
      bg-white/90 dark:bg-[#1d1d1f]/90
      backdrop-blur-[20px]
      border border-[#1d1d1f]/10 dark:border-white/10
    `
  };

  const paddingClasses = {
    none: '',
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h3 className="
              text-[16px] font-semibold
              font-['SF_Pro_Display']
              tracking-[-0.011em]
              text-[#1d1d1f] dark:text-white
              mb-1
            ">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="
              text-[14px] font-normal
              font-['SF_Pro_Text']
              tracking-[-0.008em]
              text-[#1d1d1f]/60 dark:text-white/60
            ">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

// Perfect Badge Component
export const PerfectBadge: React.FC<{
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium';
  className?: string;
}> = ({
  children,
  variant = 'default',
  size = 'medium',
  className = ''
}) => {
  const baseClasses = `
    inline-flex items-center
    font-['SF_Pro_Text'] font-semibold
    rounded-full
    transition-all duration-200 ease-out
  `;

  const sizeClasses = {
    small: 'px-2 py-0.5 text-[10px] tracking-[0.008em]',
    medium: 'px-3 py-1 text-[11px] tracking-[0.008em]'
  };

  const variantClasses = {
    default: 'bg-[#1d1d1f]/10 dark:bg-white/10 text-[#1d1d1f] dark:text-white',
    success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
  };

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Perfect Toggle Component
export const PerfectToggle: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}> = ({
  checked,
  onChange,
  label,
  disabled = false,
  className = ''
}) => {
  return (
    <label className={`inline-flex items-center cursor-pointer ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div className={`
          w-11 h-6
          rounded-full
          transition-all duration-200 ease-out
          ${checked 
            ? 'bg-[#1d1d1f] dark:bg-white' 
            : 'bg-[#1d1d1f]/20 dark:bg-white/20'
          }
        `}>
          <div className={`
            absolute top-0.5 left-0.5
            w-5 h-5
            bg-white dark:bg-[#1d1d1f]
            rounded-full
            transition-transform duration-200 ease-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `} />
        </div>
      </div>
      
      {label && (
        <span className="
          ml-3
          text-[14px] font-medium
          font-['SF_Pro_Text']
          tracking-[-0.008em]
          text-[#1d1d1f] dark:text-white
        ">
          {label}
        </span>
      )}
    </label>
  );
};