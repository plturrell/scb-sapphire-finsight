import React, { useState, useRef, useEffect } from 'react';
import { useDeviceCapabilities } from '../hooks/useDeviceCapabilities';
import { useApplePhysics } from '../hooks/useApplePhysics';
import haptics from '../lib/haptics';
import { ChevronDown, ChevronUp, Check, AlertCircle } from 'lucide-react';

export type SelectVariant = 
  | 'default' 
  | 'filled' 
  | 'outlined' 
  | 'safari' 
  | 'ios' 
  | 'ipados'
  | 'macos';

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
  icon?: React.ReactNode;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

export interface EnhancedSafariSelectProps {
  options: SelectOption[] | SelectGroup[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string | boolean;
  success?: string | boolean;
  helperText?: string;
  fullWidth?: boolean;
  required?: boolean;
  className?: string;
  selectClassName?: string;
  dropdownClassName?: string;
  optionClassName?: string;
  variant?: SelectVariant;
  size?: SelectSize;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  animateOnFocus?: boolean;
  adaptToPlatform?: boolean;
  hapticFeedback?: boolean;
  useSafariUI?: boolean;
  name?: string;
  id?: string;
  showSearch?: boolean;
  clearable?: boolean;
  multiple?: boolean;
  maxHeight?: number;
  dropdownPosition?: 'auto' | 'top' | 'bottom';
}

/**
 * Enhanced Safari Select
 * 
 * A select component that follows Apple's design guidelines for different platforms
 * (iOS, iPadOS, macOS) with special optimizations for Safari.
 */
const EnhancedSafariSelect: React.FC<EnhancedSafariSelectProps> = ({
  options,
  value,
  defaultValue,
  onChange,
  onBlur,
  onFocus,
  label,
  placeholder = 'Select an option',
  disabled = false,
  error,
  success,
  helperText,
  fullWidth = false,
  required = false,
  className = '',
  selectClassName = '',
  dropdownClassName = '',
  optionClassName = '',
  variant = 'default',
  size = 'md',
  rounded = 'md',
  animateOnFocus = true,
  adaptToPlatform = true,
  hapticFeedback = true,
  useSafariUI = true,
  name,
  id,
  showSearch = false,
  clearable = false,
  multiple = false,
  maxHeight = 300,
  dropdownPosition = 'auto'
}) => {
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string>(value || defaultValue || '');
  const [focused, setFocused] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownTop, setDropdownTop] = useState<'top' | 'bottom'>('bottom');
  
  // Refs
  const selectRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
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
  
  // Are the options grouped?
  const isGrouped = options.length > 0 && 'options' in options[0];
  
  // Flat list of all options for search
  const flatOptions = isGrouped
    ? (options as SelectGroup[]).flatMap(group => group.options)
    : (options as SelectOption[]);
  
  // Find currently selected option
  const selectedOption = flatOptions.find(opt => opt.value === selectedValue);
  
  // Filter options based on search term
  const filteredOptions = isGrouped
    ? (options as SelectGroup[]).map(group => ({
        ...group,
        options: group.options.filter(opt => 
          opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          opt.value.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(group => group.options.length > 0)
    : (options as SelectOption[]).filter(opt => 
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opt.value.toLowerCase().includes(searchTerm.toLowerCase())
      );
  
  // Update selected value when value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        
        if (onBlur) {
          onBlur();
        }
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onBlur]);
  
  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && showSearch && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 10);
    }
  }, [isOpen, showSearch]);
  
  // Calculate dropdown position
  useEffect(() => {
    if (isOpen && selectRef.current && dropdownRef.current) {
      const selectRect = selectRef.current.getBoundingClientRect();
      const dropdownHeight = Math.min(dropdownRef.current.scrollHeight, maxHeight);
      
      const spaceBelow = window.innerHeight - selectRect.bottom;
      const spaceAbove = selectRect.top;
      
      let position: 'top' | 'bottom' = 'bottom';
      
      if (dropdownPosition === 'auto') {
        // Auto determine the best position
        if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
          position = 'top';
        } else {
          position = 'bottom';
        }
      } else {
        position = dropdownPosition as 'top' | 'bottom';
      }
      
      setDropdownTop(position);
    }
  }, [isOpen, maxHeight, dropdownPosition]);
  
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
    
    // iOS style
    if (effectiveVariant === 'ios') {
      return isDark
        ? 'bg-[#1c1c1e] border-[#3a3a3c] text-white placeholder-[#8e8e93] focus:border-[#0a84ff]'
        : 'bg-[#e9e9eb] border-[#d1d1d6] text-[#1c1c1e] placeholder-[#8e8e93] focus:border-[#007aff]';
    }
    
    // iPadOS style
    if (effectiveVariant === 'ipados') {
      return isDark
        ? 'bg-[#1c1c1e] border-[#3a3a3c] text-white placeholder-[#8e8e93] focus:border-[#0a84ff]'
        : 'bg-[#f2f2f7] border-[#d1d1d6] text-[#1c1c1e] placeholder-[#8e8e93] focus:border-[#007aff]';
    }
    
    // macOS style
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
  
  // Get dropdown style based on position
  const getDropdownStyle = () => {
    return dropdownTop === 'top'
      ? {
          bottom: '100%',
          marginBottom: '5px',
          maxHeight: `${maxHeight}px`
        }
      : {
          top: '100%',
          marginTop: '5px',
          maxHeight: `${maxHeight}px`
        };
  };
  
  // Toggle dropdown
  const toggleDropdown = () => {
    if (disabled) return;
    
    const newState = !isOpen;
    setIsOpen(newState);
    
    if (hapticFeedback && (isiOS || isiPad)) {
      haptics.selection();
    }
    
    if (newState) {
      setFocused(true);
      if (onFocus) onFocus();
    } else {
      setFocused(false);
      if (onBlur) onBlur();
    }
    
    // Reset search when closing
    if (!newState) {
      setSearchTerm('');
    }
  };
  
  // Handle option selection
  const handleSelectOption = (option: SelectOption) => {
    if (option.disabled) return;
    
    setSelectedValue(option.value);
    setIsOpen(false);
    
    if (hapticFeedback && (isiOS || isiPad)) {
      haptics.light();
    }
    
    if (onChange) {
      onChange(option.value);
    }
    
    if (onBlur) {
      onBlur();
    }
  };
  
  // Handle clearing selection
  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    setSelectedValue('');
    
    if (hapticFeedback && (isiOS || isiPad)) {
      haptics.light();
    }
    
    if (onChange) {
      onChange('');
    }
  };
  
  // Handle search input
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Render dropdown options
  const renderOptions = () => {
    if (isGrouped) {
      return (filteredOptions as SelectGroup[]).map((group, groupIndex) => (
        <div key={`group-${groupIndex}`} className="mb-2 last:mb-0">
          <div 
            className={`
              px-3 py-1 text-xs font-semibold 
              ${prefersColorScheme === 'dark' ? 'text-white/60' : 'text-black/60'}
            `}
          >
            {group.label}
          </div>
          {group.options.map((option) => renderOption(option))}
        </div>
      ));
    } else {
      return (filteredOptions as SelectOption[]).map((option) => renderOption(option));
    }
  };
  
  // Render individual option
  const renderOption = (option: SelectOption) => {
    const isSelected = selectedValue === option.value;
    const isDark = prefersColorScheme === 'dark';
    
    return (
      <div
        key={option.value}
        className={`
          px-3 py-2 flex items-center cursor-pointer
          ${isSelected 
            ? isDark 
              ? 'bg-[rgba(10,132,255,0.3)] text-white' 
              : 'bg-[rgba(0,122,255,0.1)] text-[#007aff]'
            : ''
          }
          ${option.disabled 
            ? 'opacity-40 cursor-not-allowed' 
            : isDark 
              ? 'hover:bg-[rgba(255,255,255,0.1)]' 
              : 'hover:bg-[rgba(0,0,0,0.05)]'
          }
          ${optionClassName}
        `}
        onClick={() => !option.disabled && handleSelectOption(option)}
      >
        {/* Option icon if provided */}
        {option.icon && (
          <span className="mr-2 text-current">{option.icon}</span>
        )}
        
        {/* Option label */}
        <span className="flex-1">{option.label}</span>
        
        {/* Selected checkmark */}
        {isSelected && (
          <Check 
            size={16} 
            className={isDark ? 'text-[#0a84ff]' : 'text-[#007aff]'} 
          />
        )}
      </div>
    );
  };
  
  return (
    <div className={`relative ${fullWidth ? 'w-full' : ''} ${className}`}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={id}
          className={`block mb-1.5 text-sm font-medium ${
            prefersColorScheme === 'dark' ? 'text-white/80' : 'text-[rgb(var(--scb-dark-gray))]'
          }`}
        >
          {label}
          {required && <span className="ml-1 text-[rgb(255,59,48)]">*</span>}
        </label>
      )}
      
      {/* Select container */}
      <div 
        ref={selectRef}
        className={`
          relative border cursor-pointer select-none
          ${getSizeClasses()}
          ${getRoundedClasses()}
          ${getVariantClasses()}
          ${getErrorClasses()}
          ${getSuccessClasses()}
          ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
          ${fullWidth ? 'w-full' : ''}
          ${selectClassName}
        `}
        onClick={toggleDropdown}
        style={getFocusAnimation()}
        aria-expanded={isOpen}
        role="combobox"
        aria-haspopup="listbox"
        id={id}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 truncate">
            {selectedOption ? (
              <div className="flex items-center">
                {selectedOption.icon && (
                  <span className="mr-2">{selectedOption.icon}</span>
                )}
                <span>{selectedOption.label}</span>
              </div>
            ) : (
              <span className={`
                ${prefersColorScheme === 'dark' ? 'text-white/60' : 'text-black/40'}
              `}>
                {placeholder}
              </span>
            )}
          </div>
          
          <div className="flex items-center">
            {/* Clear button */}
            {clearable && selectedValue && (
              <button
                type="button"
                onClick={handleClearSelection}
                className={`
                  p-1 rounded-full mr-1 
                  ${prefersColorScheme === 'dark' 
                    ? 'text-white/60 hover:text-white/80 hover:bg-[rgba(255,255,255,0.1)]' 
                    : 'text-black/60 hover:text-black/80 hover:bg-[rgba(0,0,0,0.05)]'}
                `}
                aria-label="Clear selection"
              >
                <svg 
                  width="14" 
                  height="14" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
            
            {/* Dropdown indicator */}
            {isOpen ? (
              <ChevronUp size={16} className={
                prefersColorScheme === 'dark' ? 'text-white/60' : 'text-black/60'
              } />
            ) : (
              <ChevronDown size={16} className={
                prefersColorScheme === 'dark' ? 'text-white/60' : 'text-black/60'
              } />
            )}
          </div>
        </div>
        
        {/* Error/success indicator */}
        {(error || success) && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
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
        <p className="mt-1 text-xs text-[rgb(255,59,48)]">
          {error}
        </p>
      )}
      
      {/* Success message */}
      {success && typeof success === 'string' && !error && (
        <p className={`mt-1 text-xs ${
          prefersColorScheme === 'dark' 
            ? 'text-[rgb(48,209,88)]' 
            : 'text-[rgb(52,199,89)]'
        }`}>
          {success}
        </p>
      )}
      
      {/* Helper text */}
      {helperText && !error && !success && (
        <p className={`mt-1 text-xs ${
          prefersColorScheme === 'dark' 
            ? 'text-white/60' 
            : 'text-black/60'
        }`}>
          {helperText}
        </p>
      )}
      
      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={`
            absolute z-50 w-full overflow-y-auto overflow-x-hidden
            ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            ${getRoundedClasses()}
            ${prefersColorScheme === 'dark' 
              ? 'bg-[#2a2a2c] border border-[#3a3a3c] shadow-lg text-white' 
              : 'bg-white border border-[rgba(0,0,0,0.1)] shadow-lg text-[#1c1c1e]'
            }
            ${effectiveVariant === 'safari' || (useSafariUI && isAppleSafari)
              ? prefersColorScheme === 'dark'
                ? 'bg-[rgba(42,42,44,0.85)] backdrop-blur-md backdrop-saturate-150'
                : 'bg-[rgba(255,255,255,0.85)] backdrop-blur-md backdrop-saturate-150'
              : ''
            }
            ${dropdownClassName}
          `}
          style={getDropdownStyle()}
          role="listbox"
        >
          {/* Search input */}
          {showSearch && (
            <div className="sticky top-0 p-2 border-b border-gray-200 bg-inherit">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={handleSearchInput}
                className={`
                  w-full px-3 py-1.5 text-sm border ${getRoundedClasses()}
                  ${prefersColorScheme === 'dark' 
                    ? 'bg-[rgba(0,0,0,0.2)] border-[#3a3a3c] text-white placeholder-[rgba(255,255,255,0.6)]' 
                    : 'bg-[rgba(0,0,0,0.05)] border-[rgba(0,0,0,0.1)] text-[#1c1c1e] placeholder-[rgba(0,0,0,0.4)]'
                  }
                  focus:outline-none focus:ring-1
                  ${prefersColorScheme === 'dark' 
                    ? 'focus:ring-[#0a84ff]' 
                    : 'focus:ring-[#007aff]'
                  }
                `}
                placeholder="Search options..."
                aria-label="Search options"
              />
            </div>
          )}
          
          {/* No results message */}
          {filteredOptions.length === 0 && (
            <div className={`
              px-3 py-4 text-center text-sm
              ${prefersColorScheme === 'dark' ? 'text-white/60' : 'text-black/60'}
            `}>
              No options found
            </div>
          )}
          
          {/* Options */}
          {renderOptions()}
        </div>
      )}
      
      {/* Hidden native select for form submission */}
      <select
        name={name}
        value={selectedValue}
        onChange={() => {}}
        required={required}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      >
        <option value="">{placeholder}</option>
        {flatOptions.map(option => (
          <option 
            key={option.value} 
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default EnhancedSafariSelect;