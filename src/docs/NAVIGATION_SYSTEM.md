# SCB Sapphire Navigation System

This document outlines the navigation and layout architecture used throughout the SCB Sapphire FinSight application. The system is designed to provide a consistent user experience across various devices and form factors while maintaining the brand identity.

## Core Components

The navigation system consists of several key components working together:

### 1. ScbBeautifulUI

`ScbBeautifulUI` is the main wrapper component that provides a consistent UI experience across the application. It handles:

- Platform detection (iOS, iPadOS, macOS, etc.)
- News bar and search functionality
- Device-specific adaptations (multi-tasking, safe areas)
- Integration with the Joule Assistant
- Page title and metadata

Usage:
```tsx
<ScbBeautifulUI showNewsBar={true} pageTitle="Dashboard">
  {/* Page content */}
</ScbBeautifulUI>
```

### 2. ResponsiveAppLayout

`ResponsiveAppLayout` intelligently selects the appropriate layout based on the detected device:

- For standard devices: Uses `ModernLayout`
- For iPad/tablet devices: Uses `MultiTaskingLayout`
- Automatically adapts for different screen sizes and multitasking modes

### 3. ModernLayout

`ModernLayout` provides the standard layout with:

- Header with SCB branding
- Collapsible sidebar navigation
- App Finder modal
- Notifications panel
- User menu
- Mobile-specific adaptations

### 4. MultiTaskingLayout

`MultiTaskingLayout` is specialized for iPad multitasking scenarios:

- Optimizes for Split View, Slide Over, and Stage Manager
- Adjusts spacing and layout based on available screen real estate
- Provides compact navigation for smaller screen spaces
- Adapts UI elements for touch interactions

### 5. EnhancedIOSTabBar

`EnhancedIOSTabBar` provides iOS-style tab navigation with:

- Support for iOS design guidelines
- Haptic feedback integration
- Automatic adaptation for notches, home indicators, etc.
- Support for labels, badges, and custom icons

## Device Adaptation

The system automatically adapts to different devices and contexts:

### iPadOS Support

- **Split View**: Optimized layout when sharing screen with another app (1/3, 1/2, or 2/3 of screen)
- **Slide Over**: Compact floating window mode with specialized navigation
- **Stage Manager**: Enhanced windowed mode with proper spacing and controls
- **Full Screen**: Standard layout with maximum screen utilization

### iOS Support

- **iPhone**: Optimized for smaller screens with bottom tab navigation
- **Dynamic Island**: Proper spacing around Dynamic Island on iPhone Pro models
- **Home Indicator**: Respects the home indicator area at the bottom of modern iPhones
- **Safe Areas**: Automatically adapts to notches and other device-specific features

### Responsive Design

All layouts are fully responsive and adapt to:

- Device orientation changes
- Screen size variations
- Multitasking mode transitions
- System appearance settings (light/dark mode)

## Navigation Patterns

The application uses consistent navigation patterns:

### Primary Navigation

The primary navigation is accessible through:

1. **Side Menu** (desktop/tablet): Collapsible sidebar with major application sections
2. **Tab Bar** (mobile): Bottom tab bar for main sections on small devices
3. **App Finder**: Grid of all available application modules

### Secondary Navigation

Secondary navigation is implemented with:

1. **Page Headers**: Contextual navigation for the current section
2. **Breadcrumbs**: Location indicators for deep navigation paths
3. **Action Bars**: Contextual actions for the current view

## Implementation Guide

When creating new pages or components:

1. Always wrap page content in `ScbBeautifulUI` for consistent navigation
2. Use the provided hook system for device adaptations:
   - `useMultiTasking()` for iPad multitasking detection
   - `useSafeArea()` for device-specific insets
   - `useDeviceCapabilities()` for platform detection

3. Follow these patterns for navigation integration:

```tsx
// Example page implementation
import React from 'react';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';

export default function MyPage() {
  return (
    <ScbBeautifulUI 
      pageTitle="My Page Title"
      showNewsBar={true}
      showSearchBar={true}
    >
      {/* Page content */}
      <div className="space-y-6">
        {/* Page sections */}
      </div>
    </ScbBeautifulUI>
  );
}
```

## Styling Guidelines

To maintain consistency across the navigation system:

1. Use SCB color variables for all UI elements:
   - `--scb-honolulu-blue` for primary elements
   - `--scb-american-green` for action elements
   - `--scb-light-gray` for backgrounds
   - `--scb-dark-gray` for text

2. Use the `scb-` class prefix for custom components
3. Use appropriate spacing scales:
   - Standard spacing: 24px (6 in Tailwind)
   - Compact spacing: 16px (4 in Tailwind)
   - Touch spacing: 8px (2 in Tailwind)

## Accessibility

The navigation system is designed with accessibility in mind:

- All interactive elements are properly labeled
- Navigation is fully keyboard accessible
- Color contrast meets WCAG standards
- Screen readers can interpret the navigation structure

## Future Enhancements

Planned improvements to the navigation system:

1. Global state management for UI preferences
2. Enhanced touch gestures for navigation
3. More consistent mobile navigation patterns
4. Improved keyboard shortcuts for power users