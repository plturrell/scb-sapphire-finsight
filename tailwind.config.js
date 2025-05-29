/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/styles/unified.css",
  ],
  theme: {
    screens: {
      'xs': '375px',
      'sm': '390px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      '3xl': '1920px',
    },
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
        xl: '3rem',
      },
    },
    extend: {
      colors: {
        // Background colors
        background: 'rgb(var(--color-background) / <alpha-value>)',
        'background-elevated': 'rgb(var(--color-background-elevated) / <alpha-value>)',
        'background-muted': 'rgb(var(--color-background-muted) / <alpha-value>)',
        
        // Text colors
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        'foreground-muted': 'rgb(var(--color-foreground-muted) / <alpha-value>)',
        'foreground-subtle': 'rgb(var(--color-foreground-subtle) / <alpha-value>)',
        
        // Primary colors (SCB Blue)
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          foreground: 'rgb(var(--color-primary-foreground) / <alpha-value>)',
          light: 'rgb(var(--color-primary-light) / <alpha-value>)',
          dark: 'rgb(var(--color-primary-dark) / <alpha-value>)',
        },
        
        // Secondary colors (SCB Green)
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary) / <alpha-value>)',
          foreground: 'rgb(var(--color-secondary-foreground) / <alpha-value>)',
          light: 'rgb(var(--color-secondary-light) / <alpha-value>)',
          dark: 'rgb(var(--color-secondary-dark) / <alpha-value>)',
        },
        
        // Accent colors
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          foreground: 'rgb(var(--color-accent-foreground) / <alpha-value>)',
        },
        
        // Destructive colors
        destructive: {
          DEFAULT: 'hsl(0, 84%, 60%)',  // Brighter red for better visibility
          foreground: 'hsl(0, 0%, 100%)',  // White text for contrast
        },
        
        // Border colors
        border: 'rgb(var(--color-border) / <alpha-value>)',
        'border-muted': 'rgb(var(--color-border-muted) / <alpha-value>)',
        
        // Status colors with better contrast
        success: 'hsl(142, 76%, 36%)',  // Brighter green
        warning: 'hsl(38, 92%, 50%)',   // Brighter yellow
        error: 'hsl(0, 84%, 60%)',      // Brighter red
        info: 'hsl(199, 89%, 48%)',     // Brighter blue
      },
      
      fontFamily: {
        sans: ['SC Prosper Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      
      minHeight: {
        'touch': '44px',
        'touch-sm': '36px',
      },
      
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-out': 'slideOut 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'theme-transition': 'themeTransition 0.3s ease-out',
      },
      
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        themeTransition: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.9' },
        },
      },
      },
    },
  },
  plugins: [
    require('@tailwindcss/container-queries'),
  ],
};