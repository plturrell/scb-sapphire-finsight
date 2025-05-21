import React from 'react';
import { Activity, ZapOff, Zap } from 'lucide-react';
import { useReducedMotionPreference } from '@/hooks/useReducedMotion';
import tokens from '@/styles/tokens';

type ReducedMotionToggleProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  variant?: 'icon' | 'button' | 'switch';
};

/**
 * Accessibility toggle component for reduced motion preferences
 * Allows users to override system preferences for reduced motion
 */
const ReducedMotionToggle: React.FC<ReducedMotionToggleProps> = ({
  className = '',
  size = 'md',
  showLabel = true,
  variant = 'button',
}) => {
  const { 
    prefersReducedMotion, 
    source, 
    enableReducedMotion, 
    disableReducedMotion,
    resetToSystemPreference
  } = useReducedMotionPreference();

  // Size maps
  const sizeMap = {
    sm: {
      button: 'h-8 px-2',
      icon: 'h-4 w-4',
      text: 'text-xs',
      switch: 'w-8 h-4',
      dot: 'h-3 w-3',
    },
    md: {
      button: 'h-10 px-3',
      icon: 'h-5 w-5',
      text: 'text-sm',
      switch: 'w-10 h-5',
      dot: 'h-4 w-4',
    },
    lg: {
      button: 'h-12 px-4',
      icon: 'h-6 w-6',
      text: 'text-base',
      switch: 'w-12 h-6',
      dot: 'h-5 w-5',
    },
  };

  // Get appropriate icon
  const getMotionIcon = () => {
    if (source === 'system') {
      return <Activity className={sizeMap[size].icon} />;
    }
    return prefersReducedMotion ? 
      <ZapOff className={sizeMap[size].icon} /> : 
      <Zap className={sizeMap[size].icon} />;
  };

  // Get label text
  const getLabel = () => {
    if (source === 'system') {
      return `System (${prefersReducedMotion ? 'Reduced' : 'Standard'})`;
    }
    return prefersReducedMotion ? 'Reduced Motion' : 'Standard Motion';
  };

  // Handle toggle
  const handleToggle = () => {
    if (source === 'system') {
      // If using system, switch to explicit setting opposite of system
      if (prefersReducedMotion) {
        disableReducedMotion();
      } else {
        enableReducedMotion();
      }
    } else {
      // If already using explicit setting, toggle it
      if (prefersReducedMotion) {
        disableReducedMotion();
      } else {
        enableReducedMotion();
      }
    }
  };

  // Icon-only variant
  if (variant === 'icon') {
    return (
      <button
        aria-label={`Animations: ${getLabel()}`}
        onClick={handleToggle}
        className={`${sizeMap[size].button} flex items-center justify-center rounded-md
        transition-colors duration-200 ${prefersReducedMotion ? 'transition-none' : ''}
        border border-gray-200 dark:border-gray-700
        bg-white dark:bg-gray-800 
        text-gray-800 dark:text-gray-200
        hover:bg-gray-100 dark:hover:bg-gray-700
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
        ${className}`}
      >
        {getMotionIcon()}
      </button>
    );
  }

  // Switch toggle variant
  if (variant === 'switch') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {showLabel && (
          <span className={`${sizeMap[size].text} text-gray-700 dark:text-gray-300`}>
            {getLabel()}
          </span>
        )}
        <button
          role="switch"
          aria-checked={prefersReducedMotion}
          aria-label="Toggle reduced motion"
          onClick={handleToggle}
          className={`relative inline-flex ${sizeMap[size].switch} flex-shrink-0 
          border-2 border-transparent rounded-full cursor-pointer 
          transition-colors duration-200 ${prefersReducedMotion ? 'transition-none' : ''}
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
          ${prefersReducedMotion 
            ? 'bg-green-500 dark:bg-green-600' 
            : 'bg-gray-200 dark:bg-gray-700'}`}
        >
          <span
            className={`pointer-events-none relative inline-block 
            ${sizeMap[size].dot} rounded-full 
            bg-white dark:bg-gray-100 shadow transform ring-0 
            transition duration-200 ${prefersReducedMotion ? 'transition-none' : ''}
            ${prefersReducedMotion ? 'translate-x-full' : 'translate-x-0'}`}
          />
        </button>
        <button
          aria-label="Reset to system preference"
          onClick={resetToSystemPreference}
          className={`ml-2 p-1 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
          ${source === 'system' ? 'opacity-50 cursor-not-allowed' : 'opacity-100 cursor-pointer'}`}
          disabled={source === 'system'}
        >
          <Activity className="h-3 w-3" />
        </button>
      </div>
    );
  }

  // Default button variant
  return (
    <button
      aria-label={`Animations: ${getLabel()}`}
      onClick={handleToggle}
      className={`${sizeMap[size].button} flex items-center space-x-2 rounded-md
      transition-colors duration-200 ${prefersReducedMotion ? 'transition-none' : ''}
      border border-gray-200 dark:border-gray-700
      bg-white dark:bg-gray-800 
      text-gray-800 dark:text-gray-200
      hover:bg-gray-100 dark:hover:bg-gray-700
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
      ${className}`}
    >
      {getMotionIcon()}
      {showLabel && (
        <span className={sizeMap[size].text}>{getLabel()}</span>
      )}
    </button>
  );
};

export default ReducedMotionToggle;