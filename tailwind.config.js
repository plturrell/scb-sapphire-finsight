/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    screens: {
      // iPhone SE, standard phones
      'xs': '375px',
      // Modern phones (iPhone 12-15)
      'sm': '390px',
      // Large phones/small tablets
      'md': '768px',
      // iPads (portrait)
      'lg': '1024px',
      // iPads (landscape) / small laptops
      'xl': '1280px',
      // Desktop
      '2xl': '1536px',
      // Large desktop
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
        primary: {
          DEFAULT: '#0072AA', // SCB Honolulu Blue
          light: '#78ADD2',   // SCB Iceberg
          dark: '#005888',
        },
        secondary: {
          DEFAULT: '#21AA47', // SCB American Green
          light: '#A4D0A0',   // SCB Eton Blue
          dark: '#198238',
        },
        neutral: {
          50: '#F5F7FA',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#525355',    // SCB Dark Gray
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        destructive: {
          DEFAULT: '#D33732', // SCB Muted Red
        },
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
        'touch': '44px', // Minimum touch target size
        'touch-sm': '36px', // Smaller touch target
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
        'ripple': 'ripple 0.8s ease-out forwards',
        'pulse': 'pulse 1.5s ease-in-out infinite',
        'wobble': 'wobble 1s ease-in-out',
        'float': 'float 3s ease-in-out infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
        'jelly': 'jelly 0.8s ease-in-out',
        'spin-slow': 'spin 3s linear infinite',
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
        ripple: {
          '0%': { 
            width: '0',
            height: '0',
            opacity: '0.5'
          },
          '100%': { 
            width: '300px',
            height: '300px',
            opacity: '0'
          },
        },
        pulse: {
          '0%, 100%': { 
            transform: 'scale(1)',
            opacity: '1'
          },
          '50%': { 
            transform: 'scale(1.1)',
            opacity: '0.8'
          },
        },
        wobble: {
          '0%, 100%': { transform: 'translateX(0)' },
          '15%': { transform: 'translateX(-12px) rotate(-3deg)' },
          '30%': { transform: 'translateX(10px) rotate(3deg)' },
          '45%': { transform: 'translateX(-8px) rotate(-1.8deg)' },
          '60%': { transform: 'translateX(6px) rotate(1.2deg)' },
          '75%': { transform: 'translateX(-4px) rotate(-0.6deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-5px) scale(1.01)' },
        },
        jelly: {
          '0%, 100%': { transform: 'scale(1, 1)' },
          '25%': { transform: 'scale(0.95, 1.05)' },
          '50%': { transform: 'scale(1.05, 0.95)' },
          '75%': { transform: 'scale(0.98, 1.02)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/container-queries'),
  ],
}