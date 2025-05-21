# SCB Beautiful UI Component Library

This document provides guidelines and documentation for using the Enhanced component library in the SCB Sapphire UIUX project.

## Overview

The SCB Beautiful UI Component Library is a set of enhanced React components designed specifically for Standard Chartered Bank's digital products. These components follow SCB's design system and provide consistent styling, accessibility features, and optimized performance.

## Naming Conventions

All enhanced components follow these naming conventions:

- **Component Names**: All enhanced components use the `Enhanced` prefix (e.g., `EnhancedButton`, `EnhancedLoadingSpinner`)
- **CSS Classes**: All CSS classes use the `scb-` prefix (e.g., `scb-btn`, `scb-tile`)
- **Color Variables**: Colors are stored as CSS variables with the `--scb-` prefix (e.g., `--scb-honolulu-blue`, `--scb-american-green`)

## Core Components

### Layout Components

#### EnhancedLayout

A responsive layout component with SCB Beautiful styling.

```tsx
import EnhancedLayout from '@/components/EnhancedLayout';

<EnhancedLayout>
  {/* Your content here */}
</EnhancedLayout>
```

#### EnhancedResponsiveGrid

A grid layout system designed for responsive dashboards.

```tsx
import EnhancedResponsiveGrid from '@/components/EnhancedResponsiveGrid';

<EnhancedResponsiveGrid
  columns={4}
  gap={4}
  breakpoints={{ sm: 1, md: 2, lg: 4 }}
>
  {/* Grid items */}
</EnhancedResponsiveGrid>
```

### UI Components

#### EnhancedTouchButton

```tsx
import EnhancedTouchButton from '@/components/EnhancedTouchButton';

<EnhancedTouchButton 
  variant="primary"
  onClick={handleClick}
  disabled={false}
>
  Button Text
</EnhancedTouchButton>
```

Props:
- `variant`: 'primary' | 'secondary' | 'ghost' | 'link' (default: 'primary')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `disabled`: boolean (default: false)
- `fullWidth`: boolean (default: false)
- `className`: string (optional)
- `onClick`: function (optional)

#### EnhancedLoadingSpinner

```tsx
import EnhancedLoadingSpinner from '@/components/EnhancedLoadingSpinner';

<EnhancedLoadingSpinner 
  size="md"
  variant="default"
  message="Loading data..."
/>
```

Props:
- `size`: 'xs' | 'sm' | 'md' | 'lg' (default: 'md')
- `variant`: 'default' | 'primary' | 'muted' | 'inverted' (default: 'default')
- `message`: string (optional)
- `fullPage`: boolean (default: false)
- `className`: string (optional)

### Visualization Components

#### EnhancedForceDirectedGraph

```tsx
import EnhancedForceDirectedGraph from '@/components/EnhancedForceDirectedGraph';

<EnhancedForceDirectedGraph
  data={graphData}
  title="Knowledge Graph"
  showControls={true}
  showLegend={true}
/>
```

Props:
- `data`: GraphData object containing nodes and links
- `width`: number (default: 800)
- `height`: number (default: 600)
- `title`: string (default: 'Knowledge Graph')
- `showControls`: boolean (default: true)
- `showLegend`: boolean (default: true)
- `isLoading`: boolean (default: false)
- `onNodeClick`: function (optional)
- `onRegenerateClick`: function (optional)
- `className`: string (optional)

#### EnhancedSankeyChart

```tsx
import EnhancedSankeyChart from '@/components/charts/EnhancedSankeyChart';

<EnhancedSankeyChart
  data={sankeyData}
  width={800}
  height={600}
  title="Financial Flows"
/>
```

### Form Components

#### EnhancedPerplexitySearchBar

```tsx
import EnhancedPerplexitySearchBar from '@/components/EnhancedPerplexitySearchBar';

<EnhancedPerplexitySearchBar 
  onSearch={handleSearch}
  placeholder="Search financial data..."
/>
```

## Using Color Variables

SCB Beautiful UI uses a standardized set of color variables:

```css
/* Primary colors */
--scb-honolulu-blue: 0, 114, 170;    /* Primary brand color */
--scb-american-green: 33, 170, 71;   /* Secondary brand color */

/* Neutrals */
--scb-white: 255, 255, 255;
--scb-light-gray: 245, 247, 250;
--scb-dark-gray: 82, 83, 85;

/* Semantic colors */
--scb-muted-red: 211, 55, 50;        /* For errors and alerts */

/* Border */
--scb-border: 229, 231, 235;
```

To use these variables in your styles:

```tsx
<div className="text-[rgb(var(--scb-honolulu-blue))] bg-[rgba(var(--scb-light-gray),0.5)]">
  Content
</div>
```

## CSS Class Usage

Here are the common CSS classes used by SCB Beautiful UI components:

### Button Classes

- `scb-btn`: Base button class
- `scb-btn-primary`: Primary action button
- `scb-btn-secondary`: Secondary action button
- `scb-btn-ghost`: Ghost/transparent button

### Layout Classes

- `scb-card`: Card container
- `scb-tile`: Tile container for dashboard elements
- `scb-section`: Section container

### Typography Classes

- `scb-title`: Page or section title
- `scb-section-header`: Section header

### Component Classes

- `scb-input`: Form input elements
- `scb-chip`: Label/tag elements
- `scb-chip-blue`: Blue variant of chip

## Best Practices

1. **Use Enhanced Components**: Always prefer Enhanced components over their basic counterparts
2. **Consistent Naming**: Follow the naming conventions for components and CSS classes
3. **Color Variables**: Use SCB color variables instead of hardcoded colors
4. **Accessibility**: Ensure all components maintain proper focus states and ARIA attributes
5. **Mobile Optimization**: Use the touch-friendly components for better mobile experience