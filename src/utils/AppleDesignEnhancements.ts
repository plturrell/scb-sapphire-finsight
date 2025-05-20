/**
 * Apple-inspired design enhancements for the Finsight UI
 * 
 * This module provides styling constants and utility functions
 * to achieve Apple's high design standards across all components.
 */

// SF Pro-inspired typography values
export const TYPOGRAPHY = {
  WEIGHTS: {
    THIN: 200,
    LIGHT: 300,
    REGULAR: 400,
    MEDIUM: 500,
    SEMIBOLD: 600,
    BOLD: 700
  },
  SIZES: {
    XS: '0.75rem',    // 12px
    SM: '0.875rem',   // 14px
    BASE: '1rem',     // 16px
    LG: '1.125rem',   // 18px
    XL: '1.25rem',    // 20px
    XXL: '1.5rem',    // 24px
    XXXL: '2rem',     // 32px
  },
  LEADING: {
    TIGHT: 1.15,
    NORMAL: 1.5,
    LOOSE: 1.8
  },
  TRACKING: {
    TIGHT: '-0.01em',
    NORMAL: '0',
    WIDE: '0.03em'
  }
};

// Apple-inspired color and transparency values
export const COLORS = {
  SYSTEM_BLUE: 'rgba(0, 122, 255, 1)',
  SYSTEM_GREEN: 'rgba(52, 199, 89, 1)',
  SYSTEM_INDIGO: 'rgba(88, 86, 214, 1)',
  SYSTEM_ORANGE: 'rgba(255, 149, 0, 1)',
  SYSTEM_PINK: 'rgba(255, 45, 85, 1)',
  SYSTEM_PURPLE: 'rgba(175, 82, 222, 1)',
  SYSTEM_RED: 'rgba(255, 59, 48, 1)',
  SYSTEM_TEAL: 'rgba(90, 200, 250, 1)',
  SYSTEM_YELLOW: 'rgba(255, 204, 0, 1)',
  GRAY: {
    100: 'rgba(242, 242, 247, 1)',
    200: 'rgba(229, 229, 234, 1)',
    300: 'rgba(209, 209, 214, 1)',
    400: 'rgba(199, 199, 204, 1)',
    500: 'rgba(174, 174, 178, 1)',
    600: 'rgba(142, 142, 147, 1)',
    700: 'rgba(99, 99, 102, 1)',
    800: 'rgba(72, 72, 74, 1)',
    900: 'rgba(44, 44, 46, 1)'
  },
  SHADOW: {
    LIGHT: 'rgba(0, 0, 0, 0.03)',
    MEDIUM: 'rgba(0, 0, 0, 0.05)',
    DARK: 'rgba(0, 0, 0, 0.1)'
  }
};

// Apple-inspired UI effects
export const EFFECTS = {
  SHADOW: {
    SM: '0 2px 4px 0px var(--apple-shadow-light)',
    MD: '0 4px 8px -2px var(--apple-shadow-medium)',
    LG: '0 12px 16px -4px var(--apple-shadow-dark)',
    FOCUS: '0 0 0 4px rgba(0, 125, 250, 0.6)'
  },
  BLUR: {
    SM: 'blur(4px)',
    MD: 'blur(12px)',
    LG: 'blur(20px)'
  },
  TRANSITION: {
    FAST: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    MEDIUM: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    SLOW: 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    SPRING: 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  },
  BORDER_RADIUS: {
    SM: '6px',
    MD: '8px',
    LG: '12px',
    XL: '16px',
    FULL: '9999px'
  }
};

// Apple-inspired spacing scale
export const SPACING = {
  XXS: '0.25rem',   // 4px
  XS: '0.5rem',     // 8px
  SM: '0.75rem',    // 12px
  MD: '1rem',       // 16px
  LG: '1.5rem',     // 24px
  XL: '2rem',       // 32px
  XXL: '3rem',      // 48px
  XXXL: '4rem'      // 64px
};

// Apple-inspired gesture configurations
export const GESTURE = {
  SWIPE_THRESHOLD: 50,       // Minimum distance for swipe detection
  SWIPE_VELOCITY: 0.3,       // Minimum velocity for swipe detection
  PRESS_DURATION: 500,       // Long press duration in milliseconds
  BOUNCE_STRENGTH: 0.2,      // Strength of bounce-back effect
  PULL_TO_REFRESH: 80,       // Distance to pull for refresh
  TRANSITION_SPRING: {       // Spring physics for natural motion
    tension: 280,
    friction: 30,
    mass: 1
  }
};

// Utility function to add ultra-thin borders like Apple interfaces
export const appleBorder = (color = COLORS.GRAY[300], weight = '0.5px') => `${weight} solid ${color}`;

// Utility function for Apple-style card background
export const appleCardBackground = (isDark = false) => 
  isDark ? 'rgba(30, 30, 30, 0.7)' : 'rgba(255, 255, 255, 0.8)';

// Generates Apple-like backdrop blur effect
export const appleBackdropBlur = (intensity = 'md') => {
  const blurMap = {
    sm: 'blur(8px) saturate(180%)',
    md: 'blur(20px) saturate(180%)',
    lg: 'blur(40px) saturate(180%)'
  };
  return blurMap[intensity] || blurMap.md;
};

// Convert hex colors to Apple's preferred rgba format
export const hexToRgba = (hex: string, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Apple-style skeleton loader effect
export const appleSkeletonLoader = () => `
  background: linear-gradient(90deg, var(--apple-gray-200) 0%, var(--apple-gray-100) 50%, var(--apple-gray-200) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

// Apple's Dynamic Island style animation parameters
export const dynamicIslandAnimations = {
  expand: {
    duration: 0.35,
    easing: [0.2, 0.85, 0.4, 0.95]
  },
  contract: {
    duration: 0.3,
    easing: [0.4, 0.0, 0.2, 1]
  }
};

// Generates CSS variable declarations for all Apple design tokens
export const generateAppleCssVariables = () => `
  :root {
    /* Typography */
    --apple-font-thin: ${TYPOGRAPHY.WEIGHTS.THIN};
    --apple-font-light: ${TYPOGRAPHY.WEIGHTS.LIGHT};
    --apple-font-regular: ${TYPOGRAPHY.WEIGHTS.REGULAR};
    --apple-font-medium: ${TYPOGRAPHY.WEIGHTS.MEDIUM};
    --apple-font-semibold: ${TYPOGRAPHY.WEIGHTS.SEMIBOLD};
    --apple-font-bold: ${TYPOGRAPHY.WEIGHTS.BOLD};
    
    /* Colors */
    --apple-blue: ${COLORS.SYSTEM_BLUE};
    --apple-green: ${COLORS.SYSTEM_GREEN};
    --apple-indigo: ${COLORS.SYSTEM_INDIGO};
    --apple-orange: ${COLORS.SYSTEM_ORANGE};
    --apple-pink: ${COLORS.SYSTEM_PINK};
    --apple-purple: ${COLORS.SYSTEM_PURPLE};
    --apple-red: ${COLORS.SYSTEM_RED};
    --apple-teal: ${COLORS.SYSTEM_TEAL};
    --apple-yellow: ${COLORS.SYSTEM_YELLOW};
    
    /* Grays */
    --apple-gray-100: ${COLORS.GRAY[100]};
    --apple-gray-200: ${COLORS.GRAY[200]};
    --apple-gray-300: ${COLORS.GRAY[300]};
    --apple-gray-400: ${COLORS.GRAY[400]};
    --apple-gray-500: ${COLORS.GRAY[500]};
    --apple-gray-600: ${COLORS.GRAY[600]};
    --apple-gray-700: ${COLORS.GRAY[700]};
    --apple-gray-800: ${COLORS.GRAY[800]};
    --apple-gray-900: ${COLORS.GRAY[900]};
    
    /* Shadows */
    --apple-shadow-light: ${COLORS.SHADOW.LIGHT};
    --apple-shadow-medium: ${COLORS.SHADOW.MEDIUM};
    --apple-shadow-dark: ${COLORS.SHADOW.DARK};
    
    /* Border Radius */
    --apple-radius-sm: ${EFFECTS.BORDER_RADIUS.SM};
    --apple-radius-md: ${EFFECTS.BORDER_RADIUS.MD};
    --apple-radius-lg: ${EFFECTS.BORDER_RADIUS.LG};
    --apple-radius-xl: ${EFFECTS.BORDER_RADIUS.XL};
    
    /* Transitions */
    --apple-transition-fast: ${EFFECTS.TRANSITION.FAST};
    --apple-transition-medium: ${EFFECTS.TRANSITION.MEDIUM};
    --apple-transition-slow: ${EFFECTS.TRANSITION.SLOW};
    --apple-transition-spring: ${EFFECTS.TRANSITION.SPRING};
  }
`;

export default {
  TYPOGRAPHY,
  COLORS,
  EFFECTS,
  SPACING,
  GESTURE,
  appleBorder,
  appleCardBackground,
  appleBackdropBlur,
  hexToRgba,
  appleSkeletonLoader,
  dynamicIslandAnimations,
  generateAppleCssVariables
};