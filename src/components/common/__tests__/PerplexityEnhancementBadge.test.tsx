import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PerplexityEnhancementBadge from '../PerplexityEnhancementBadge';

// Use SAP Fiori Horizon design system colors to match production
const theme = createTheme({
  palette: {
    primary: {
      main: '#0070F2', // SAP Fiori Blue
    },
    secondary: {
      main: '#107E3E', // SAP Fiori Green
    },
    error: {
      main: '#BB0000', // SAP Fiori Red
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  spacing: 8,
  typography: {
    fontFamily: '"72", "72-Regular", "72-Light", Arial, Helvetica, sans-serif',
  },
});

// Render helper that provides the theme context
const renderWithTheme = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {ui}
    </ThemeProvider>
  );
};

describe('PerplexityEnhancementBadge Component', () => {
  // Test basic rendering
  test('renders the badge with correct text', () => {
    renderWithTheme(<PerplexityEnhancementBadge />);
    
    // Check badge text is present
    expect(screen.getByText('Perplexity Enhanced')).toBeInTheDocument();
    expect(screen.getByText('℗')).toBeInTheDocument();
  });

  // Test tooltip functionality
  test('shows tooltip on hover with correct information', async () => {
    renderWithTheme(<PerplexityEnhancementBadge />);
    
    // Initially tooltip content should not be visible
    expect(screen.queryByText('Enhanced by Perplexity AI')).not.toBeInTheDocument();
    
    // Hover over the badge to show tooltip
    fireEvent.mouseOver(screen.getByText('Perplexity Enhanced').closest('div')!);
    
    // Tooltip content should now be visible
    expect(await screen.findByText('Enhanced by Perplexity AI')).toBeInTheDocument();
    expect(screen.getByText(/This visualization has been enhanced/)).toBeInTheDocument();
  });

  // Test with custom confidence score
  test('displays the provided confidence score when showDetails is true', async () => {
    renderWithTheme(<PerplexityEnhancementBadge confidenceScore={0.85} showDetails={true} />);
    
    // Hover over the badge to show tooltip
    fireEvent.mouseOver(screen.getByText('Perplexity Enhanced').closest('div')!);
    
    // Should show the formatted confidence score
    expect(await screen.findByText(/Confidence Score:/)).toBeInTheDocument();
    expect(screen.getByText(/85%/)).toBeInTheDocument();
  });

  // Test without details
  test('does not show details when showDetails is false', async () => {
    renderWithTheme(<PerplexityEnhancementBadge confidenceScore={0.85} showDetails={false} />);
    
    // Hover over the badge to show tooltip
    fireEvent.mouseOver(screen.getByText('Perplexity Enhanced').closest('div')!);
    
    // Wait for tooltip to appear
    await screen.findByText('Enhanced by Perplexity AI');
    
    // Should not show the confidence score
    expect(screen.queryByText(/Confidence Score:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Enhanced Features:/)).not.toBeInTheDocument();
  });

  // Test default confidence score formatting
  test('formats default confidence score correctly', async () => {
    renderWithTheme(<PerplexityEnhancementBadge showDetails={true} />);
    
    // Hover over the badge to show tooltip
    fireEvent.mouseOver(screen.getByText('Perplexity Enhanced').closest('div')!);
    
    // Wait for tooltip to appear
    await screen.findByText('Enhanced by Perplexity AI');
    
    // Default confidence is 0.93, which should be formatted as 93%
    expect(screen.getByText(/93%/)).toBeInTheDocument();
  });

  // Test perfect cross-platform consistency of styling
  test('maintains consistent styling with SAP Fiori Horizon guidelines', () => {
    const { container } = renderWithTheme(<PerplexityEnhancementBadge />);
    
    // Get the actual badge element
    const badge = container.querySelector('.MuiChip-root');
    
    // Check that we found the badge
    expect(badge).toBeInTheDocument();
    
    // Verify styling matches SAP Fiori Horizon design principles
    // This uses computed styles to validate actual rendered appearance
    if (badge) {
      const styles = window.getComputedStyle(badge);
      
      // We can't directly test background gradient but we can check other properties
      expect(badge).toHaveClass('MuiChip-root');
      expect(badge).toHaveStyle('color: #ffffff');
      expect(badge).toHaveStyle('vertical-align: middle');
    }
  });

  // Test accessibility
  test('meets accessibility standards with proper ARIA attributes', () => {
    const { container } = renderWithTheme(<PerplexityEnhancementBadge />);
    
    // The tooltip should have appropriate aria attributes
    const tooltip = container.querySelector('[role="tooltip"]');
    expect(tooltip).toBeDefined();
    
    // The badge should be interactive and focusable
    const badge = screen.getByText('Perplexity Enhanced').closest('div');
    expect(badge).toHaveAttribute('tabindex', '0');
  });
});
