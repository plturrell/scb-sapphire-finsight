# SCB Beautiful UI CSS Naming Guidelines

This document provides guidelines for CSS class naming and usage in the SCB Sapphire UIUX project. Following these guidelines will ensure consistency across the codebase and make maintenance easier.

## Prefix Standards

All CSS classes must use the appropriate prefix to clearly identify their purpose and origin:

### Component Prefixes

- `scb-`: Standard prefix for all SCB Beautiful UI components
- Do NOT use `fiori-` or `horizon-` prefixes (legacy prefixes that should be migrated)

### Element Prefixes

- `scb-btn`: Button elements
- `scb-input`: Input elements
- `scb-card`: Card containers
- `scb-tile`: Tile elements (dashboard widgets)
- `scb-chip`: Tags/chips/badges

## Class Naming Pattern

Follow this pattern for all CSS class names:

```
[prefix]-[element]-[modifier]
```

Examples:
- `scb-btn-primary`
- `scb-btn-secondary`
- `scb-btn-ghost`
- `scb-input-large`
- `scb-card-interactive`

## CSS Variable Naming

Use consistent naming for all CSS variables:

- All SCB color variables: `--scb-[color-name]`
- All SCB spacing variables: `--scb-spacing-[size]`
- All SCB animation variables: `--scb-animation-[property]`

Examples:
```css
--scb-honolulu-blue: 0, 114, 170;
--scb-american-green: 33, 170, 71;
--scb-spacing-md: 1rem;
--scb-animation-duration: 0.3s;
```

## Usage with Tailwind CSS

When using Tailwind CSS with SCB Beautiful UI:

1. Always prefer SCB classes for core components
2. Use Tailwind for layout and spacing utilities
3. Use SCB color variables with Tailwind's arbitrary value syntax:

```html
<div class="text-[rgb(var(--scb-honolulu-blue))] bg-[rgba(var(--scb-light-gray),0.5)]">
  Content
</div>
```

## Component Class Structure

Each component should use a consistent class structure:

### Containers
```html
<div class="scb-container">
  <div class="scb-container-header">...</div>
  <div class="scb-container-body">...</div>
  <div class="scb-container-footer">...</div>
</div>
```

### Buttons
```html
<button class="scb-btn scb-btn-primary">
  <span class="scb-btn-icon">...</span>
  <span class="scb-btn-text">...</span>
</button>
```

### Form Elements
```html
<div class="scb-form-group">
  <label class="scb-label">...</label>
  <input class="scb-input" />
  <p class="scb-helper-text">...</p>
</div>
```

## Migration Guidelines

When migrating from legacy class names:

1. Replace all `fiori-` prefixes with `scb-` prefixes
2. Replace all `horizon-` prefixes with `scb-` prefixes
3. Update all CSS variables from `--fiori-` to `--scb-`
4. Update all CSS variables from `--horizon-` to `--scb-`

### Common Replacements

| Legacy Class | SCB Beautiful Class |
|--------------|---------------------|
| fiori-btn | scb-btn |
| fiori-btn-primary | scb-btn-primary |
| fiori-btn-secondary | scb-btn-secondary |
| fiori-btn-ghost | scb-btn-ghost |
| fiori-tile | scb-tile |
| fiori-input | scb-input |
| horizon-chip | scb-chip |
| horizon-chip-blue | scb-chip-blue |

## Accessibility Considerations

Ensure that class names don't override important accessibility features:

1. Never remove focus styles completely
2. Use `scb-focus-visible` for focus styles
3. Use semantic HTML elements with appropriate ARIA attributes

## Developer Workflow

When creating new components:

1. Check the documentation for existing SCB Beautiful components first
2. Use the appropriate prefix for all new classes
3. Document any new class patterns for team visibility
4. Run linting tools to ensure compliance with naming conventions

By following these guidelines, we'll maintain a consistent and maintainable codebase that adheres to SCB Beautiful UI standards.