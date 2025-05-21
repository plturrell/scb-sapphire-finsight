/**
 * SCB Design Token System
 * 
 * This file defines the design tokens used throughout the application,
 * providing a single source of truth for design values.
 * 
 * Tokens are organized in a hierarchical structure:
 * - Core tokens: Raw values (colors, sizes, etc.)
 * - Semantic tokens: Application of core tokens to specific UI contexts
 * - Component tokens: Values specific to individual components
 */

// =============================================================================
// CORE TOKENS
// =============================================================================

// Color Palette
export const colors = {
  // Primary SCB brand colors
  honoluluBlue: {
    100: 'rgba(204, 230, 245, 1)', // Lightest
    200: 'rgba(153, 204, 234, 1)',
    300: 'rgba(102, 179, 224, 1)',
    400: 'rgba(51, 153, 214, 1)', 
    500: 'rgba(0, 114, 170, 1)',   // #0072AA - Primary SCB blue
    600: 'rgba(0, 94, 150, 1)',    // Darker
    700: 'rgba(0, 74, 130, 1)',    // Darker still
    800: 'rgba(0, 54, 110, 1)',    // Very dark
    900: 'rgba(0, 34, 90, 1)',     // Darkest
  },
  
  americanGreen: {
    100: 'rgba(210, 240, 218, 1)', // Lightest
    200: 'rgba(168, 226, 184, 1)',
    300: 'rgba(120, 212, 148, 1)',
    400: 'rgba(76, 191, 109, 1)',
    500: 'rgba(33, 170, 71, 1)',   // #21AA47 - SCB green
    600: 'rgba(26, 140, 59, 1)',   // Darker
    700: 'rgba(20, 110, 47, 1)',   // Darker still
    800: 'rgba(14, 80, 34, 1)',    // Very dark
    900: 'rgba(7, 50, 21, 1)',     // Darkest
  },
  
  // Neutrals
  gray: {
    100: 'rgba(245, 247, 250, 1)', // #F5F7FA - SCB light gray (bg)
    200: 'rgba(229, 231, 235, 1)', // #E5E7EB - SCB border color
    300: 'rgba(209, 213, 219, 1)',
    400: 'rgba(156, 163, 175, 1)',
    500: 'rgba(107, 114, 128, 1)',
    600: 'rgba(82, 83, 85, 1)',    // #525355 - SCB dark gray
    700: 'rgba(55, 65, 81, 1)',
    800: 'rgba(31, 41, 55, 1)',
    900: 'rgba(17, 24, 39, 1)',
  },
  
  // Semantic colors
  red: {
    100: 'rgba(254, 226, 226, 1)',
    300: 'rgba(252, 165, 165, 1)',
    500: 'rgba(211, 55, 50, 1)',   // #D33732 - SCB muted red
    700: 'rgba(185, 28, 28, 1)',
    900: 'rgba(127, 29, 29, 1)',
  },
  
  yellow: {
    100: 'rgba(254, 243, 199, 1)',
    300: 'rgba(252, 211, 77, 1)',
    500: 'rgba(245, 158, 11, 1)',
    700: 'rgba(180, 83, 9, 1)',
    900: 'rgba(120, 53, 15, 1)',
  },
  
  // Pure colors
  white: 'rgba(255, 255, 255, 1)',
  black: 'rgba(0, 0, 0, 1)',
  
  // Functional colors with transparency
  transparent: 'rgba(0, 0, 0, 0)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  skeleton: 'rgba(0, 0, 0, 0.1)',
  shimmer: 'rgba(255, 255, 255, 0.05)',
};

// Typography
export const typography = {
  // Font families
  fontFamily: {
    primary: '"SC Prosper Sans", sans-serif',
    fallback: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  
  // Font weights
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    bold: 700,
  },
  
  // Font sizes (in rem)
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    md: '1.125rem',     // 18px
    lg: '1.25rem',      // 20px
    xl: '1.5rem',       // 24px
    '2xl': '1.75rem',   // 28px
    '3xl': '2rem',      // 32px
    '4xl': '2.5rem',    // 40px
  },
  
  // Line heights
  lineHeight: {
    none: 1,
    tight: 1.2,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  // Letter spacing
  letterSpacing: {
    tighter: '-0.02em',
    tight: '-0.01em',
    normal: '0',
    wide: '0.01em',
    wider: '0.02em',
  },
};

// Spacing
export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  48: '12rem',      // 192px
  56: '14rem',      // 224px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px
};

// Border radius
export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
};

// Border width
export const borderWidth = {
  DEFAULT: '1px',
  0: '0',
  2: '2px',
  4: '4px',
  8: '8px',
};

// Shadows
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  none: 'none',
  
  // SCB-specific shadows for components
  fioriTile: '0 2px 8px rgba(0, 0, 0, 0.1)',
  fioriTileHover: '0 4px 12px rgba(0, 0, 0, 0.15)',
  fioriMenu: '0 4px 16px rgba(0, 0, 0, 0.15)',
  fioriModal: '0 10px 25px rgba(0, 0, 0, 0.2)',
};

// Z-index
export const zIndex = {
  auto: 'auto',
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
  75: '75',
  100: '100',
  dropdown: '1000',
  modal: '2000',
  toast: '3000',
  tooltip: '4000',
  popover: '5000',
};

// Animation timing
export const animation = {
  duration: {
    fastest: '100ms',
    faster: '150ms',
    fast: '200ms',
    normal: '300ms',
    slow: '400ms',
    slower: '500ms',
    slowest: '700ms',
  },
  
  ease: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    
    // Apple-specific easings for more natural motion
    appleIn: 'cubic-bezier(0.32, 0.72, 0, 1)',
    appleOut: 'cubic-bezier(0.32, 0.72, 0, 1)',
    appleInOut: 'cubic-bezier(0.52, 0.16, 0.24, 0.8)',
  },
  
  spring: {
    gentle: 'spring(1, 90, 10, 0)',
    wobbly: 'spring(1, 180, 10, 0)',
    stiff: 'spring(1, 300, 10, 0)',
    ios: 'spring(0.5, 300, 10, 0)', // iOS-like spring
  },
};

// Breakpoints for responsive design
export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// =============================================================================
// SEMANTIC TOKENS
// =============================================================================

export const semantic = {
  // Text colors
  text: {
    primary: colors.gray[800],
    secondary: colors.gray[600],
    muted: colors.gray[500],
    disabled: colors.gray[400],
    inverse: colors.white,
    link: colors.honoluluBlue[500],
    linkHover: colors.honoluluBlue[600],
    positive: colors.americanGreen[500],
    negative: colors.red[500],
    warning: colors.yellow[500],
    info: colors.honoluluBlue[500],
  },
  
  // Background colors
  background: {
    page: colors.gray[100],
    card: colors.white,
    input: colors.white,
    disabled: colors.gray[200],
    hover: colors.gray[200],
    selected: colors.honoluluBlue[100],
    positive: `rgba(${colors.americanGreen[500]}, 0.1)`,
    negative: `rgba(${colors.red[500]}, 0.1)`,
    warning: `rgba(${colors.yellow[500]}, 0.1)`,
    info: `rgba(${colors.honoluluBlue[500]}, 0.1)`,
  },
  
  // Border colors
  border: {
    default: colors.gray[200],
    strong: colors.gray[300],
    focus: colors.honoluluBlue[500],
    disabled: colors.gray[300],
    positive: colors.americanGreen[500],
    negative: colors.red[500],
    warning: colors.yellow[500],
    info: colors.honoluluBlue[500],
  },
  
  // Action colors (buttons, etc.)
  action: {
    primary: colors.honoluluBlue[500],
    primaryHover: colors.honoluluBlue[600],
    primaryActive: colors.honoluluBlue[700],
    primaryText: colors.white,
    
    secondary: colors.white,
    secondaryHover: colors.gray[100],
    secondaryActive: colors.gray[200],
    secondaryText: colors.honoluluBlue[500],
    secondaryBorder: colors.honoluluBlue[500],
    
    success: colors.americanGreen[500],
    successHover: colors.americanGreen[600],
    successText: colors.white,
    
    danger: colors.red[500],
    dangerHover: colors.red[700],
    dangerText: colors.white,
    
    disabled: colors.gray[300],
    disabledText: colors.gray[500],
  },
  
  // Focus styles
  focus: {
    ring: `0 0 0 2px rgba(${colors.honoluluBlue[500]}, 0.3)`,
    outline: `2px solid ${colors.honoluluBlue[500]}`,
    outlineOffset: '2px',
  },
};

// =============================================================================
// COMPONENT TOKENS
// =============================================================================

export const components = {
  // Button component tokens
  button: {
    // Sizing
    paddingX: {
      sm: spacing[2],
      md: spacing[3],
      lg: spacing[4],
    },
    paddingY: {
      sm: spacing[1],
      md: spacing[2],
      lg: spacing[3],
    },
    fontSize: {
      sm: typography.fontSize.sm,
      md: typography.fontSize.base,
      lg: typography.fontSize.lg,
    },
    height: {
      sm: '1.75rem', // 28px
      md: '2.25rem', // 36px
      lg: '2.75rem', // 44px
    },
    
    // Styling
    borderRadius: borderRadius.md,
    fontWeight: typography.fontWeight.medium,
    transition: `all ${animation.duration.fast} ${animation.ease.inOut}`,
  },
  
  // Input component tokens
  input: {
    height: '2.25rem', // 36px
    paddingX: spacing[3],
    fontSize: typography.fontSize.base,
    borderRadius: borderRadius.DEFAULT,
    borderWidth: borderWidth.DEFAULT,
    boxShadow: 'none',
    transition: `all ${animation.duration.fast} ${animation.ease.inOut}`,
  },
  
  // Card component tokens
  card: {
    padding: spacing[4],
    borderRadius: borderRadius.DEFAULT,
    shadow: shadows.DEFAULT,
    borderWidth: borderWidth.DEFAULT,
    borderColor: semantic.border.default,
    background: semantic.background.card,
  },
  
  // Table component tokens
  table: {
    cellPaddingX: spacing[4],
    cellPaddingY: spacing[3],
    headerBackground: colors.gray[100],
    borderColor: semantic.border.default,
    borderWidth: borderWidth.DEFAULT,
    stripedRowBackground: colors.gray[50],
    hoverRowBackground: colors.gray[100],
  },
  
  // Tooltip component tokens
  tooltip: {
    background: colors.gray[800],
    text: colors.white,
    padding: `${spacing[1.5]} ${spacing[2.5]}`,
    borderRadius: borderRadius.md,
    maxWidth: '20rem',
    fontSize: typography.fontSize.sm,
    shadow: shadows.lg,
    zIndex: zIndex.tooltip,
  },
  
  // Chip/tag component tokens
  chip: {
    paddingX: spacing[2],
    paddingY: spacing[0.5],
    borderRadius: borderRadius.full,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  
  // Modal component tokens
  modal: {
    background: semantic.background.card,
    backdropColor: 'rgba(0, 0, 0, 0.5)',
    backdropBlur: '2px',
    borderRadius: borderRadius.xl,
    shadow: shadows.xl,
    padding: spacing[6],
    zIndex: zIndex.modal,
  },
  
  // Header component tokens
  header: {
    height: '3rem', // 48px
    background: colors.honoluluBlue[500],
    color: colors.white,
    borderBottom: `1px solid ${colors.honoluluBlue[600]}`,
    paddingX: spacing[4],
  },
  
  // Sidebar component tokens
  sidebar: {
    width: '16rem', // 256px
    background: colors.white,
    borderRight: `1px solid ${semantic.border.default}`,
    itemPaddingX: spacing[4],
    itemPaddingY: spacing[3],
    itemHoverBackground: colors.gray[100],
    activeItemBorderWidth: borderWidth[4],
    activeItemBorderColor: colors.honoluluBlue[500],
  },
  
  // Loading indicators
  loading: {
    spinnerSize: {
      sm: spacing[4],
      md: spacing[6],
      lg: spacing[10],
    },
    spinnerColor: colors.honoluluBlue[500],
    spinnerTrackColor: colors.gray[200],
    spinnerWidth: borderWidth[2],
    skeletonColor: colors.skeleton,
    skeletonHighlightColor: colors.shimmer,
  },
  
  // Chart colors
  charts: {
    primaryColors: [
      colors.honoluluBlue[500],
      colors.americanGreen[500],
      colors.honoluluBlue[300],
      colors.americanGreen[300],
      colors.honoluluBlue[700],
      colors.americanGreen[700],
    ],
    
    axisColor: colors.gray[400],
    gridColor: colors.gray[200],
    labelColor: colors.gray[600],
    legendColor: colors.gray[800],
    
    tooltip: {
      background: colors.white,
      border: colors.gray[300],
      shadow: shadows.lg,
      text: colors.gray[800],
    },
  },
};

// Dark mode overrides
export const darkMode = {
  // Mostly derived from previous implementations
  // They can be used with useDarkMode hook 
  // or directly loaded in dark-mode.css
};

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  borderWidth,
  shadows,
  zIndex,
  animation,
  breakpoints,
  semantic,
  components,
  darkMode,
};