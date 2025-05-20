/**
 * Standard Chartered Bank Brand Assets
 * 
 * This module provides centralized access to SCB brand assets and styling.
 * All components should reference these values to maintain consistent branding.
 */

// Primary SCB brand colors
export const SCB_COLORS = {
  // Primary brand colors
  PRIMARY: '#042278',         // Deep blue - primary brand color
  ACCENT: '#31ddc1',          // Teal accent - for highlights and accents
  
  // Secondary palette
  HIGHLIGHT: '#ff6b3d',       // Orange - for calls to action and highlights
  BLUE_ALT: '#58a6ff',        // Light blue - secondary accent
  YELLOW: '#f7c948',          // Yellow - for warnings and notifications
  
  // Functional colors
  SUCCESS: '#2e7d32',         // Green - success states
  WARNING: '#ed6c02',         // Amber - warning states
  ERROR: '#d32f2f',           // Red - error states
  INFO: '#2196f3',            // Blue - informational states
  
  // Neutrals
  DARK_GREY: '#2c2c2c',       // Dark grey for text
  MEDIUM_GREY: '#6c6c6c',     // Medium grey for secondary text
  LIGHT_GREY: '#e0e0e0',      // Light grey for borders
  BACKGROUND: '#f8f9fa',      // Light background
  WHITE: '#ffffff',           // White
};

// Typography scale
export const SCB_TYPOGRAPHY = {
  FONT_FAMILY: '"Roboto", "Helvetica", "Arial", sans-serif',
  WEIGHT: {
    LIGHT: 300,
    REGULAR: 400,
    MEDIUM: 500,
    BOLD: 700,
  },
  SIZE: {
    XS: '0.75rem',    // 12px
    SM: '0.875rem',   // 14px
    MD: '1rem',       // 16px
    LG: '1.25rem',    // 20px
    XL: '1.5rem',     // 24px
    XXL: '2rem',      // 32px
  }
};

// Component styling
export const SCB_COMPONENTS = {
  CARD: {
    BORDER_RADIUS: '8px',
    BOX_SHADOW: '0 2px 10px rgba(0,0,0,0.08)',
    PADDING: '24px',
  },
  BUTTON: {
    PRIMARY: {
      BACKGROUND: SCB_COLORS.PRIMARY,
      TEXT: SCB_COLORS.WHITE,
      HOVER: '#031a5e', // Darker shade of PRIMARY
    },
    SECONDARY: {
      BACKGROUND: 'transparent',
      TEXT: SCB_COLORS.PRIMARY,
      BORDER: SCB_COLORS.PRIMARY,
      HOVER: 'rgba(4, 34, 120, 0.08)',
    },
    ACCENT: {
      BACKGROUND: SCB_COLORS.ACCENT,
      TEXT: SCB_COLORS.PRIMARY,
      HOVER: '#2bc4ab', // Darker shade of ACCENT
    }
  },
  CHARTS: {
    PALETTE: [
      SCB_COLORS.PRIMARY,
      SCB_COLORS.ACCENT,
      SCB_COLORS.HIGHLIGHT,
      SCB_COLORS.BLUE_ALT,
      SCB_COLORS.YELLOW,
      '#9c27b0',  // Purple
      '#0097a7',  // Teal
      '#795548',  // Brown
    ]
  }
};

// SCB Logo paths (relative to public assets)
export const SCB_LOGO = {
  FULL: '/assets/scb-logo-full.svg',       // Full logo with text
  ICON: '/assets/scb-logo-icon.svg',       // Icon only
  MONOCHROME: '/assets/scb-logo-mono.svg', // Monochrome version
};

// Theme configuration for consistent styling across components
export const SCB_THEME = {
  colors: SCB_COLORS,
  typography: SCB_TYPOGRAPHY,
  components: SCB_COMPONENTS,
  logo: SCB_LOGO,
};

/**
 * Returns an alpha version of an SCB color
 * @param color - The base color (can be hex or from SCB_COLORS)
 * @param opacity - Opacity level (0-1)
 * @returns The color with alpha
 */
export const alphaColor = (color: string, opacity: number): string => {
  // If color is from SCB_COLORS, use it directly
  const baseColor = Object.values(SCB_COLORS).includes(color) 
    ? color 
    : color;
  
  // Convert hex to rgba
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default SCB_THEME;