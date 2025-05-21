import React, { useState, useRef, useEffect } from 'react';
import { useDeviceCapabilities } from '../hooks/useDeviceCapabilities';
import { useApplePhysics } from '../hooks/useApplePhysics';
import haptics from '../lib/haptics';
import { 
  X, 
  Search, 
  AlertCircle, 
  Check, 
  Eye, 
  EyeOff, 
  ChevronDown,
  ChevronUp, 
  Calendar
} from 'lucide-react';

export type InputVariant = 
  | 'default' 
  | 'filled' 
  | 'outlined' 
  | 'safari' 
  | 'ios' 
  | 'ipados'
  | 'macos';

export type InputType = 
  | 'text' 
  | 'password' 
  | 'email' 
  | 'number' 
  | 'tel' 
  | 'search' 
  | 'url'
  | 'date'
  | 'time'
  | 'datetime-local'
  | 'month'
  | 'week';

export type InputSize = 'sm' | 'md' | 'lg';

export interface EnhancedSafariInputProps 
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  variant?: InputVariant;
  size?: InputSize;
  className?: string;
  error?: string | boolean;
  success?: string | boolean;
  helperText?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  showClearButton?: boolean;
  fullWidth?: boolean;
  animateOnFocus?: boolean;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  inputRef?: React.RefObject<HTMLInputElement>;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
  helperClassName?: string;
  adaptToPlatform?: boolean;
  hapticFeedback?: boolean;
  useSafariUI?: boolean;
  autocomplete?: string;
}

/**
 * Enhanced Safari Input
 * 
 * A form input component that follows Apple's design guidelines for different platforms
 * (iOS, iPadOS, macOS) with special optimizations for Safari.
 */
const EnhancedSafariInput: React.FC<EnhancedSafariInputProps> = ({
  label,
  variant = 'default',
  size = 'md',
  className = '',
  error,
  success,
  helperText,
  startAdornment,
  endAdornment,
  showClearButton = true,
  fullWidth = false,
  animateOnFocus = true,
  rounded = 'md',
  type = 'text',
  inputRef: externalInputRef,
  containerClassName = '',
  labelClassName = '',
  inputClassName = '',
  errorClassName = '',
  helperClassName = '',
  adaptToPlatform = true,
  hapticFeedback = true,
  useSafariUI = true,
  autoComplete,
  ...restProps
}) => {
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [inputValue, setInputValue] = useState(restProps.value || restProps.defaultValue || '');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef || internalInputRef;
  
  const { deviceType, isAppleDevice, prefersColorScheme, isAppleSafari } = useDeviceCapabilities();
  const physics = useApplePhysics({ motion: 'snappy' });
  
  // Determine if we're on Apple platforms
  const isiOS = deviceType === 'mobile' && isAppleDevice;
  const isiPad = deviceType === 'tablet' && isAppleDevice;
  const ismacOS = deviceType === 'desktop' && isAppleDevice;
  
  // Adapt variant based on platform if adaptToPlatform is enabled
  const effectiveVariant = adaptToPlatform 
    ? isiOS 
      ? 'ios' 
      : isiPad 
        ? 'ipados' 
        : ismacOS 
          ? 'macos' 
          : variant
    : variant;
    
  // Effective input type (for password visibility toggle)
  const effectiveType = type === 'password' && passwordVisible ? 'text' : type;
  
  // Reset input value when value prop changes
  useEffect(() => {
    if (restProps.value !== undefined) {
      setInputValue(restProps.value);
    }
  }, [restProps.value]);
  
  // Size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-sm';
      case 'lg':
        return 'px-4 py-3 text-lg';
      case 'md':
      default:
        return 'px-3 py-2 text-base';
    }
  };
  
  // Rounded classes
  const getRoundedClasses = () => {
    return {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      full: 'rounded-full'
    }[rounded];
  };
  
  // Variant classes
  const getVariantClasses = () => {
    const isDark = prefersColorScheme === 'dark';
    
    // iOS style input
    if (effectiveVariant === 'ios') {
      return isDark
        ? 'bg-[#1c1c1e] border-[#3a3a3c] text-white placeholder-[#8e8e93] focus:border-[#0a84ff]'
        : 'bg-[#e9e9eb] border-[#d1d1d6] text-[#1c1c1e] placeholder-[#8e8e93] focus:border-[#007aff]';
    }
    
    // iPadOS style input
    if (effectiveVariant === 'ipados') {
      return isDark
        ? 'bg-[#1c1c1e] border-[#3a3a3c] text-white placeholder-[#8e8e93] focus:border-[#0a84ff]'
        : 'bg-[#f2f2f7] border-[#d1d1d6] text-[#1c1c1e] placeholder-[#8e8e93] focus:border-[#007aff]';
    }
    
    // macOS style input
    if (effectiveVariant === 'macos') {
      return isDark
        ? 'bg-[rgba(0,0,0,0.2)] border-[#3a3a3c] text-white placeholder-[#8e8e93] focus:border-[#0a84ff] focus:bg-[rgba(0,0,0,0.3)]'
        : 'bg-white border-[#d1d1d6] text-[#1c1c1e] placeholder-[#8e8e93] focus:border-[#007aff] shadow-sm';
    }
    
    // Safari special style (Big Sur+)
    if (effectiveVariant === 'safari' || (useSafariUI && isAppleSafari)) {
      return isDark
        ? 'bg-[rgba(28,28,30,0.7)] backdrop-blur-md backdrop-saturate-150 border-[rgba(255,255,255,0.2)] text-white placeholder-[rgba(255,255,255,0.6)] focus:border-[#0a84ff]'
        : 'bg-[rgba(255,255,255,0.8)] backdrop-blur-md backdrop-saturate-150 border-[rgba(0,0,0,0.1)] text-[#1c1c1e] placeholder-[rgba(60,60,67,0.6)] focus:border-[#007aff] shadow-sm';
    }
    
    // Other variants mapped to SCB colors
    switch (effectiveVariant) {
      case 'filled':
        return isDark
          ? 'bg-[rgba(255,255,255,0.1)] border-transparent text-white placeholder-[rgba(255,255,255,0.6)] focus:bg-[rgba(255,255,255,0.15)]'
          : 'bg-[rgba(0,0,0,0.05)] border-transparent text-[rgb(var(--scb-dark-gray))] placeholder-[rgba(0,0,0,0.4)] focus:bg-[rgba(0,0,0,0.075)]';
      case 'outlined':
        return isDark
          ? 'bg-transparent border-[rgba(255,255,255,0.2)] text-white placeholder-[rgba(255,255,255,0.6)] focus:border-[rgb(var(--scb-honolulu-blue))]'
          : 'bg-transparent border-[rgba(0,0,0,0.2)] text-[rgb(var(--scb-dark-gray))] placeholder-[rgba(0,0,0,0.4)] focus:border-[rgb(var(--scb-honolulu-blue))]';
      case 'default':
      default:
        return isDark
          ? 'bg-[#2a2a2c] border-[#3a3a3c] text-white placeholder-[rgba(255,255,255,0.6)] focus:border-[rgb(var(--scb-honolulu-blue))]'
          : 'bg-white border-[rgb(var(--scb-border))] text-[rgb(var(--scb-dark-gray))] placeholder-[rgba(0,0,0,0.4)] focus:border-[rgb(var(--scb-honolulu-blue))]';
    }
  };
  
  // Error state classes
  const getErrorClasses = () => {
    if (!error) return '';
    
    return prefersColorScheme === 'dark'
      ? 'border-[rgb(255,69,58)] focus:border-[rgb(255,69,58)]'
      : 'border-[rgb(255,59,48)] focus:border-[rgb(255,59,48)]';
  };
  
  // Success state classes
  const getSuccessClasses = () => {
    if (!success || error) return '';
    
    return prefersColorScheme === 'dark'
      ? 'border-[rgb(48,209,88)] focus:border-[rgb(48,209,88)]'
      : 'border-[rgb(52,199,89)] focus:border-[rgb(52,199,89)]';
  };
  
  // Animation style for focus
  const getFocusAnimation = () => {
    if (!animateOnFocus) return {};
    
    return {
      transform: focused ? 'translateY(-2px)' : 'translateY(0)',
      transition: `transform ${physics.spring.duration * 0.6}ms cubic-bezier(0.25, 0.1, 0.25, 1.0)`
    };
  };
  
  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    
    if (restProps.onChange) {
      restProps.onChange(e);
    }
  };
  
  // Handle input focus
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    
    if (hapticFeedback && (isiOS || isiPad)) {
      haptics.selection();
    }
    
    if (restProps.onFocus) {
      restProps.onFocus(e);
    }
  };
  
  // Handle input blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    
    if (restProps.onBlur) {
      restProps.onBlur(e);
    }
  };
  
  // Handle clear button click
  const handleClearClick = () => {
    setInputValue('');
    
    if (hapticFeedback && (isiOS || isiPad)) {
      haptics.light();
    }
    
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.focus();
      
      // Trigger onChange event
      const event = new Event('input', { bubbles: true });
      inputRef.current.dispatchEvent(event);
    }
    
    // Call onChange handler with empty value
    if (restProps.onChange) {
      const changeEvent = {
        target: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>;
      
      restProps.onChange(changeEvent);
    }
  };
  
  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
    
    if (hapticFeedback && (isiOS || isiPad)) {
      haptics.light();
    }
  };
  
  // Handle date picker toggle
  const handleDatePickerToggle = () => {
    if ((type === 'date' || type === 'datetime-local') && inputRef.current) {
      if (isiOS || isiPad) {
        // iOS and iPadOS will show their native picker
        inputRef.current.click();
      } else {
        // Toggle our custom picker on desktop
        setDatePickerOpen(!datePickerOpen);
        
        if (!datePickerOpen) {
          inputRef.current.focus();
          inputRef.current.showPicker?.();
        }
      }
      
      if (hapticFeedback && (isiOS || isiPad)) {
        haptics.selection();
      }
    }
  };
  
  return (
    <div 
      className={`relative ${fullWidth ? 'w-full' : ''} ${containerClassName}`}
    >
      {/* Label */}
      {label && (
        <label 
          htmlFor={restProps.id}
          className={`block mb-1.5 text-sm font-medium ${
            prefersColorScheme === 'dark' ? 'text-white/80' : 'text-[rgb(var(--scb-dark-gray))]'
          } ${labelClassName}`}
        >
          {label}
        </label>
      )}
      
      {/* Input container */}
      <div 
        className={`relative ${fullWidth ? 'w-full' : ''}`}
        style={getFocusAnimation()}
      >
        {/* Start adornment */}
        {startAdornment && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
            {startAdornment}
          </div>
        )}
        
        {/* Default search icon for search inputs */}
        {!startAdornment && type === 'search' && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
            <Search 
              size={16} 
              className={
                prefersColorScheme === 'dark' ? 'text-white/50' : 'text-black/40'
              } 
            />
          </div>
        )}
        
        {/* Input element */}
        <input
          ref={inputRef}
          type={effectiveType}
          value={inputValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`
            block border w-full focus:outline-none focus:ring-0 transition-colors
            ${getSizeClasses()}
            ${getRoundedClasses()}
            ${getVariantClasses()}
            ${getErrorClasses()}
            ${getSuccessClasses()}
            ${startAdornment || type === 'search' ? 'pl-10' : ''}
            ${(endAdornment || showClearButton || type === 'password' || (type === 'date' || type === 'datetime-local')) ? 'pr-10' : ''}
            ${className}
            ${inputClassName}
          `}
          autoComplete={autoComplete || 'off'} // Explicitly disable Safari autofill by default
          {...restProps}
        />
        
        {/* End adornment container */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {/* Clear button */}
          {showClearButton && inputValue && (
            <button
              type="button"
              onClick={handleClearClick}
              className={`
                rounded-full p-1 
                ${prefersColorScheme === 'dark' 
                  ? 'bg-[rgba(255,255,255,0.2)] text-white/80 hover:bg-[rgba(255,255,255,0.3)]' 
                  : 'bg-[rgba(0,0,0,0.1)] text-black/80 hover:bg-[rgba(0,0,0,0.15)]'}
              `}
              aria-label="Clear input"
            >
              <X size={14} />
            </button>
          )}
          
          {/* Password visibility toggle */}
          {type === 'password' && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className={`
                p-1 rounded-full
                ${prefersColorScheme === 'dark' 
                  ? 'text-white/60 hover:text-white/80' 
                  : 'text-black/60 hover:text-black/80'}
              `}
              aria-label={passwordVisible ? 'Hide password' : 'Show password'}
            >
              {passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
          
          {/* Date picker toggle */}
          {(type === 'date' || type === 'datetime-local') && (
            <button
              type="button"
              onClick={handleDatePickerToggle}
              className={`
                p-1 rounded-full
                ${prefersColorScheme === 'dark' 
                  ? 'text-white/60 hover:text-white/80' 
                  : 'text-black/60 hover:text-black/80'}
              `}
              aria-label="Open date picker"
            >
              <Calendar size={16} />
            </button>
          )}
          
          {/* Custom end adornment */}
          {endAdornment}
        </div>
        
        {/* Valid/invalid indicators */}
        {(error || success) && !endAdornment && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {error ? (
              <AlertCircle 
                size={16} 
                className="text-[rgb(255,59,48)]" 
              />
            ) : success ? (
              <Check 
                size={16} 
                className={
                  prefersColorScheme === 'dark' 
                    ? 'text-[rgb(48,209,88)]' 
                    : 'text-[rgb(52,199,89)]'
                } 
              />
            ) : null}
          </div>
        )}
      </div>
      
      {/* Error message */}
      {error && typeof error === 'string' && (
        <p 
          className={`mt-1 text-xs text-[rgb(255,59,48)] ${errorClassName}`}
        >
          {error}
        </p>
      )}
      
      {/* Success message */}
      {success && typeof success === 'string' && !error && (
        <p 
          className={`mt-1 text-xs ${
            prefersColorScheme === 'dark' 
              ? 'text-[rgb(48,209,88)]' 
              : 'text-[rgb(52,199,89)]'
          }`}
        >
          {success}
        </p>
      )}
      
      {/* Helper text */}
      {helperText && !error && !success && (
        <p 
          className={`mt-1 text-xs ${
            prefersColorScheme === 'dark' 
              ? 'text-white/60' 
              : 'text-black/60'
          } ${helperClassName}`}
        >
          {helperText}
        </p>
      )}
    </div>
  );
};

export default EnhancedSafariInput;