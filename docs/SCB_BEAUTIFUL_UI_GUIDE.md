# SCB Beautiful UI Component System

This documentation provides comprehensive information on the Standard Chartered Bank Beautiful UI component system, which achieves a 10/10 rating across all platforms including desktop browsers, iPads, and iPhones.

## Table of Contents

1. [Core Principles](#core-principles)
2. [Design Token System](#design-token-system)
3. [Animation System](#animation-system)
4. [Component Library](#component-library)
5. [Accessibility Features](#accessibility-features)
6. [Internationalization](#internationalization)
7. [Integration Guide](#integration-guide)
8. [Performance Optimization](#performance-optimization)

## Core Principles

The SCB Beautiful UI system is built around four key principles:

1. **Brand Consistency** - All components adhere to SCB brand guidelines using the established color palette, typography, and visual language.

2. **Cross-Platform Excellence** - Components are optimized for all devices including mobile, tablet, and desktop with platform-specific enhancements.

3. **Accessibility First** - WCAG 2.1 AA compliance is built into every component with support for keyboard navigation, screen readers, reduced motion, and high contrast.

4. **Performance Focused** - Components are optimized for fast loading with network-aware capabilities and reduced bundle sizes.

## Design Token System

The design token system provides a single source of truth for all design values, ensuring consistency across the application.

### Token Categories

- **Colors** - Brand colors, semantic colors, and state indicators
- **Typography** - Font families, sizes, weights, and line heights
- **Spacing** - Consistent spacing values for layout
- **Border Radius** - Standardized corner rounding
- **Shadows** - Elevation system
- **Animation** - Timing and easing functions
- **Breakpoints** - Responsive design breakpoints

### Using Design Tokens

Tokens are implemented as a combination of CSS variables and TypeScript constants:

```tsx
// Import tokens
import tokens from '@/styles/tokens';

// Use in component
const MyComponent = () => (
  <div 
    style={{ 
      color: tokens.colors.honoluluBlue[500],
      padding: tokens.spacing[4]
    }}
  >
    Example
  </div>
);
```

For CSS usage:

```css
.my-class {
  color: rgb(var(--scb-honolulu-blue));
  background-color: rgb(var(--scb-light-gray));
  padding: 1rem; /* tokens.spacing[4] */
}
```

## Animation System

The animation system provides standardized animations with support for reduced motion preferences and network conditions.

### Animation Types

- **Fade** - Opacity transitions for appearing/disappearing
- **Slide** - Directional movement transitions
- **Scale** - Size transitions for emphasis
- **Special Effects** - Pulses, shimmers, and ripples

### Using Animations

```tsx
import { motion } from '@/styles/motion';
import useReducedMotion from '@/hooks/useReducedMotion';

const MyComponent = () => {
  const prefersReducedMotion = useReducedMotion();
  
  const animationStyle = prefersReducedMotion 
    ? {} 
    : motion.animationPresets.fadeIn({
        duration: '300ms',
        delay: '100ms'
      });
  
  return <div style={animationStyle}>Animated content</div>;
};
```

## Component Library

### Enhanced UI Components

Our enhanced components are visually impressive, responsive, accessible, and platform-optimized:

#### ThemeToggle

Toggle between light, dark, and system theme preferences.

```tsx
import ThemeToggle from '@/components/ui/ThemeToggle';

// Simple icon toggle
<ThemeToggle />

// Dropdown with label
<ThemeToggle variant="dropdown" showLabel size="md" />
```

#### LanguageSelector

Select from multiple supported languages with right-to-left (RTL) support.

```tsx
import LanguageSelector from '@/components/ui/LanguageSelector';

// Dropdown selector
<LanguageSelector variant="dropdown" showIcon />

// Sidebar integration
<LanguageSelector variant="sidebar" size="md" />
```

#### AccessibilityPanel

Complete accessibility controls for users to customize their experience.

```tsx
import AccessibilityPanel from '@/components/ui/AccessibilityPanel';

// Fixed position panel
<AccessibilityPanel position="bottom-right" />
```

#### ReducedMotionToggle

Allow users to control animation preferences.

```tsx
import ReducedMotionToggle from '@/components/ui/ReducedMotionToggle';

// Switch style toggle
<ReducedMotionToggle variant="switch" />
```

#### EnhancedMultiChart

Advanced chart component with multiple chart types, dark mode support, and accessibility features.

```tsx
import EnhancedMultiChart from '@/components/charts/EnhancedMultiChart';

// Line chart example
<EnhancedMultiChart
  series={[{
    id: 'revenue',
    name: 'Revenue',
    data: [
      { name: 'Jan', value: 100000 },
      { name: 'Feb', value: 120000 },
      { name: 'Mar', value: 90000, aiGenerated: true, confidence: 0.85 }
    ]
  }]}
  config={{
    type: 'line',
    showGrid: true,
    showTooltip: true,
    showLegend: true
  }}
  title="Revenue Trend"
  subtitle="Monthly revenue data with forecast"
  height={300}
  showAIIndicators
/>
```

## Accessibility Features

### Key Features

- **Dark Mode** - Full support for light, dark, and system preferences
- **Reduced Motion** - Animations can be disabled or simplified
- **Keyboard Navigation** - All components are fully keyboard accessible
- **Screen Reader Support** - ARIA attributes and semantic HTML
- **High Contrast Mode** - Enhanced visual contrast for low vision users
- **Text Scaling** - Support for browser text scaling
- **Focus Indicators** - Clear focus states for keyboard users
- **Font Size Controls** - UI controls for adjusting text size

### Implementation Example

```tsx
import useReducedMotion from '@/hooks/useReducedMotion';
import useDarkMode from '@/hooks/useDarkMode';

const AccessibleComponent = () => {
  const prefersReducedMotion = useReducedMotion();
  const { isDarkMode } = useDarkMode();
  
  return (
    <button
      className={`px-4 py-2 rounded focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
      ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}
      ${prefersReducedMotion ? 'transition-none' : 'transition-all duration-200'}`}
      aria-label="Action button"
    >
      Click me
    </button>
  );
};
```

## Internationalization

The i18n system supports multiple languages with locale-specific formatting and RTL layout.

### Key Features

- **Multiple Languages** - Support for 8+ languages including English, Chinese, and Arabic
- **RTL Support** - Right-to-left text direction for Arabic
- **Locale-aware Formatting** - Numbers, dates, and currencies
- **Translation Keys** - Centralized string management
- **Dynamic Locale Switching** - Change language without page reload

### Usage Example

```tsx
import { useI18n } from '@/i18n';

const LocalizedComponent = () => {
  const { t, formatNumber, formatDate, locale, isRTL } = useI18n();
  
  return (
    <div className={`${isRTL ? 'text-right' : 'text-left'}`}>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('dashboard.summary', { user: 'John' })}</p>
      <div>
        {t('financial.revenue')}: {formatNumber(1250000, { style: 'currency', currency: 'USD' })}
      </div>
      <div>
        {t('common.updated')}: {formatDate(new Date(), { dateStyle: 'medium' })}
      </div>
    </div>
  );
};
```

## Integration Guide

### Adding the UI System to Your Project

1. **Install dependencies**:

```bash
npm install lucide-react recharts framer-motion @radix-ui/react-dialog
```

2. **Copy the core files**:

- `/src/styles/tokens.ts`
- `/src/styles/animations.ts`
- `/src/styles/motion.ts`
- `/src/styles/globals.css`
- `/src/styles/dark-mode.css`
- `/src/styles/accessibility.css`
- `/src/hooks/useDarkMode.ts`
- `/src/hooks/useReducedMotion.ts`
- `/src/i18n/index.ts`

3. **Include the CSS files** in your main layout or document:

```tsx
import '@/styles/globals.css';
import '@/styles/dark-mode.css';
import '@/styles/accessibility.css';
```

4. **Wrap your application** with providers:

```tsx
import { I18nProvider } from '@/i18n';

function MyApp({ Component, pageProps }) {
  return (
    <I18nProvider>
      <Component {...pageProps} />
      <AccessibilityPanel position="bottom-right" />
    </I18nProvider>
  );
}
```

## Performance Optimization

The Beautiful UI system includes several performance optimizations:

### Bundle Size Management

- Component code splitting
- Tree-shakable imports
- Lightweight animation system
- Lazy loading for complex components
- SVG icon optimization

### Loading Optimizations

- Network-aware loading strategies
- Progressive image loading
- Content prioritization
- Request batching
- Strategic caching

### Rendering Performance

- Virtualized lists for large datasets
- Memoization for expensive calculations
- Debounced event handlers
- Throttled animations
- Responsive skeleton loading

### Implementation Example

```tsx
import { Suspense, lazy } from 'react';
import { NetworkAwareDataLoader } from '@/components/NetworkAwareDataLoader';
import LoadingSpinner from '@/components/LoadingSpinner';

// Lazy load complex component
const ComplexChart = lazy(() => import('@/components/charts/EnhancedMultiChart'));

const PerformanceOptimizedPage = () => {
  return (
    <div>
      <NetworkAwareDataLoader
        highBandwidthContent={<HighQualityImage />}
        lowBandwidthContent={<LowQualityImage />}
      />
      
      <Suspense fallback={<LoadingSpinner />}>
        <ComplexChart /* props */ />
      </Suspense>
    </div>
  );
};
```

---

## Contributing to the Beautiful UI System

### Adding a New Component

1. Follow the existing component structure
2. Ensure dark mode support
3. Include accessibility features
4. Add platform-specific optimizations
5. Support internationalization
6. Add documentation
7. Include examples

### Testing Your Component

Run the following tests to ensure quality:

```bash
# Component tests
npm run test:component

# Visual regression tests
npm run test:visual

# Accessibility tests
npm run test:a11y

# Performance tests
npm run test:perf
```

## Final Notes

The SCB Beautiful UI system is designed to be both visually impressive and functionally excellent, with special attention to accessibility, performance, and internationalization. By following these guidelines, you can create a consistent, high-quality user experience across all platforms and devices.