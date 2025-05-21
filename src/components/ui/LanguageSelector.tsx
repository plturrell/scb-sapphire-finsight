import React, { useState, useEffect, useRef } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useI18n, localeNames, SupportedLocale } from '@/i18n';
import useReducedMotion from '@/hooks/useReducedMotion';
import tokens from '@/styles/tokens';
import { motion } from '@/styles/motion';

type LanguageSelectorProps = {
  variant?: 'dropdown' | 'modal' | 'sidebar';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
};

/**
 * Language selector component with multiple display variants
 * Supports dropdown, modal, and sidebar integration
 */
const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'dropdown',
  size = 'md',
  showIcon = true,
  className = '',
  buttonClassName = '',
  menuClassName = '',
}) => {
  const { locale, setLocale, t, isRTL } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  
  // Get all available locales
  const availableLocales = Object.keys(localeNames) as SupportedLocale[];
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  // Size variants
  const sizeClasses = {
    sm: {
      button: 'text-xs h-7 px-2',
      icon: 'h-3 w-3 mr-1',
      menu: 'w-32',
      item: 'px-2 py-1 text-xs',
    },
    md: {
      button: 'text-sm h-9 px-3',
      icon: 'h-4 w-4 mr-2',
      menu: 'w-40',
      item: 'px-3 py-2 text-sm',
    },
    lg: {
      button: 'text-base h-11 px-4',
      icon: 'h-5 w-5 mr-2',
      menu: 'w-48',
      item: 'px-4 py-2.5 text-base',
    },
  };
  
  // Handle language change
  const handleSelectLocale = (newLocale: SupportedLocale) => {
    setLocale(newLocale);
    setIsOpen(false);
  };
  
  // Animation for dropdown
  const menuAnimation = !prefersReducedMotion
    ? motion.animationPresets.scaleIn({
        duration: tokens.animation.duration.fast,
        origin: 'top'
      })
    : {};
  
  // Dropdown variant
  if (variant === 'dropdown') {
    return (
      <div 
        className={`relative ${className}`}
        ref={containerRef}
      >
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className={`flex items-center justify-between rounded-md border 
          bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700
          hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 
          focus:ring-primary-500 focus:ring-offset-1 ${sizeClasses[size].button} ${buttonClassName}`}
        >
          <div className="flex items-center">
            {showIcon && <Globe className={`${sizeClasses[size].icon} text-gray-500 dark:text-gray-400`} />}
            <span>
              {localeNames[locale]}
            </span>
          </div>
          <ChevronDown 
            className={`h-4 w-4 text-gray-500 dark:text-gray-400 ml-2 transition-transform duration-200 
            ${isOpen ? 'rotate-180' : ''} ${prefersReducedMotion ? 'transition-none' : ''}`}
          />
        </button>
        
        {isOpen && (
          <div
            className={`absolute z-10 mt-1 ${isRTL ? 'right-0' : 'left-0'} rounded-md border
            border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg
            ${sizeClasses[size].menu} ${menuClassName}`}
            style={menuAnimation}
          >
            <ul 
              className="py-1 max-h-60 overflow-auto"
              role="listbox" 
              aria-label={t('settings.language')}
            >
              {availableLocales.map((localeCode) => (
                <li
                  key={localeCode}
                  role="option"
                  aria-selected={locale === localeCode}
                  className={`flex items-center justify-between cursor-pointer
                  ${sizeClasses[size].item}
                  ${locale === localeCode ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : 
                  'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  onClick={() => handleSelectLocale(localeCode)}
                >
                  <span>{localeNames[localeCode]}</span>
                  {locale === localeCode && <Check className="h-4 w-4" />}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
  
  // Sidebar variant
  if (variant === 'sidebar') {
    return (
      <div className={`${className}`}>
        <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
          {t('settings.language')}
        </div>
        <ul className="mt-1 space-y-1">
          {availableLocales.map((localeCode) => (
            <li key={localeCode}>
              <button
                type="button"
                className={`w-full ${sizeClasses[size].item} flex items-center 
                rounded-md hover:bg-gray-50 dark:hover:bg-gray-700
                ${locale === localeCode ? 
                  'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : 
                  'text-gray-700 dark:text-gray-300'}`}
                onClick={() => handleSelectLocale(localeCode)}
                aria-current={locale === localeCode ? 'page' : undefined}
              >
                <span>{localeNames[localeCode]}</span>
                {locale === localeCode && <Check className="h-4 w-4 ml-auto" />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  
  // Modal variant - simplified for now
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('settings.language')}
      </label>
      <div className="grid grid-cols-2 gap-2">
        {availableLocales.map((localeCode) => (
          <button
            key={localeCode}
            type="button"
            className={`flex items-center justify-center py-2 px-4 rounded-md border
            ${locale === localeCode ? 
              'bg-primary-50 border-primary-500 dark:bg-primary-900/20 dark:border-primary-500 text-primary-700 dark:text-primary-300' : 
              'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            onClick={() => handleSelectLocale(localeCode)}
            aria-pressed={locale === localeCode}
          >
            {localeNames[localeCode]}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;