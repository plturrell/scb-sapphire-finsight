# Finsight Branding Guidelines

This document outlines the branding elements and guidelines for the Finsight application, which combines Standard Chartered Bank (SCB) and SAP Fiori branding.

## Core Branding Components

### BrandingHeader Component

The `BrandingHeader` component (`src/components/common/BrandingHeader.tsx`) provides a standardized way to display the application branding across different contexts:

```tsx
import { BrandingHeader } from './components/common';

// Default usage
<BrandingHeader />

// Usage in space-constrained areas
<BrandingHeader compact={true} />

// Usage in splash screens and feature areas
<BrandingHeader large={true} centered={true} />

// Hide SAP Fiori branding when needed
<BrandingHeader showSapFiori={false} />
```

#### Properties

- `compact`: Boolean - Reduces the component size for use in headers and navigation (default: `false`)
- `showSapFiori`: Boolean - Toggles the SAP Fiori badge visibility (default: `true`)
- `large`: Boolean - Increases component size for splash screens and hero areas (default: `false`)
- `centered`: Boolean - Centers all elements for prominent display (default: `false`)

## Brand Assets

### Standard Chartered Bank (SCB)

- Primary logo: `/public/images/sc-logo.png`
- Primary color: `#042278` (SCB blue)
- Secondary color: `#31ddc1` (SCB teal)

### SAP Fiori

- Indicated via a "Powered by SAP Fiori" badge
- Primary SAP Fiori color: `#0a6ed1` (SAP Fiori blue)
- Badge background: `#f0f0f0` (Light gray)

## Implementation Examples

### Splash Screen

The splash screen (`src/components/SplashScreen.tsx`) displays both SCB and SAP Fiori branding prominently:

```tsx
<BrandingHeader 
  showSapFiori={true} 
  large={true} 
  centered={true} 
/>
```

### Navigation Header

The global navigation (`src/components/GlobalNavigation.tsx`) displays the SCB branding in the header bar, with SAP Fiori branding in the mobile drawer:

```tsx
// Header (desktop)
<BrandingHeader compact={isMobile} showSapFiori={false} />

// Mobile drawer
<BrandingHeader compact={false} showSapFiori={true} />
```

## Brand Usage Guidelines

1. Always display the Standard Chartered Bank logo at the appropriate size and with proper spacing
2. Maintain the "Powered by SAP Fiori" attribution where appropriate
3. Use the `BrandingHeader` component to ensure consistent branding across the application
4. Follow SCB and SAP color guidelines when developing new UI components
5. When creating new screens, include appropriate branding in headers and footers

## Typography

- Primary font: MUI's default Roboto font
- SCB Primary text color: `#042278`
- Secondary text color: `#555` (Medium gray)

## Contact

For questions about branding implementation, please contact the UI/UX design team.