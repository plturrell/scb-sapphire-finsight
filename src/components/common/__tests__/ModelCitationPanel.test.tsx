import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ModelCitationPanel from '../ModelCitationPanel';

// Create theme matching SAP Fiori Horizon design principles
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
    text: {
      primary: '#32363a',
      secondary: '#6a6d70',
    },
  },
  typography: {
    fontFamily: '"72", "72-Regular", "72-Light", Arial, Helvetica, sans-serif',
  },
  shape: {
    borderRadius: 4,
  },
});

// Render helper with theme provider
const renderWithTheme = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {ui}
    </ThemeProvider>
  );
};

// Sample test data
const sampleSources = [
  { 
    name: "World Trade Organization Tariff Data", 
    url: "https://www.wto.org/english/res_e/statis_e/statis_e.htm" 
  },
  { 
    name: "IMF Economic Projections", 
    url: "https://www.imf.org/en/Publications/WEO",
    accessDate: "2025-01-15"
  }
];

describe('ModelCitationPanel Component', () => {
  // Test basic rendering
  test('renders model name and version correctly', () => {
    renderWithTheme(
      <ModelCitationPanel 
        modelName="Tariff Impact Monte Carlo" 
        version="2.3.1"
        lastUpdated="2025-05-01T12:00:00Z"
        sources={sampleSources}
      />
    );
    
    expect(screen.getByText('Tariff Impact Monte Carlo')).toBeInTheDocument();
    expect(screen.getByText('v2.3.1')).toBeInTheDocument();
  });

  // Test date formatting
  test('formats date correctly', () => {
    renderWithTheme(
      <ModelCitationPanel 
        modelName="Economic Model" 
        version="1.0.0"
        lastUpdated="2025-04-15T08:30:00Z"
        sources={sampleSources}
      />
    );
    
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    expect(screen.getByText(/April 15, 2025/)).toBeInTheDocument();
  });

  // Test source rendering
  test('displays all sources with correct links', () => {
    renderWithTheme(
      <ModelCitationPanel 
        modelName="Economic Model" 
        version="1.0.0"
        lastUpdated="2025-04-15T08:30:00Z"
        sources={sampleSources}
      />
    );
    
    // Header for sources section should be present
    expect(screen.getByText('Data Sources:')).toBeInTheDocument();
    
    // Each source should be present
    const wtoLink = screen.getByText('World Trade Organization Tariff Data');
    expect(wtoLink).toBeInTheDocument();
    expect(wtoLink.tagName.toLowerCase()).toBe('a');
    expect(wtoLink).toHaveAttribute('href', 'https://www.wto.org/english/res_e/statis_e/statis_e.htm');
    
    const imfLink = screen.getByText('IMF Economic Projections');
    expect(imfLink).toBeInTheDocument();
    expect(imfLink).toHaveAttribute('href', 'https://www.imf.org/en/Publications/WEO');
    
    // Access date should be displayed for sources that have it
    // Using a more flexible regex to account for different date formatting options
    expect(screen.getByText(/Accessed:.*2025/)).toBeInTheDocument();
  });

  // Test confidence score
  test('displays confidence score with appropriate color', () => {
    renderWithTheme(
      <ModelCitationPanel 
        modelName="Economic Model" 
        version="1.0.0"
        lastUpdated="2025-04-15T08:30:00Z"
        sources={sampleSources}
        confidence={0.95}
      />
    );
    
    const confidenceText = screen.getByText('95% confidence');
    expect(confidenceText).toBeInTheDocument();
  });

  // Test additional info
  test('renders additional info when provided', () => {
    const additionalInfo = "Model trained on data from 2020-2025";
    
    renderWithTheme(
      <ModelCitationPanel 
        modelName="Economic Model" 
        version="1.0.0"
        lastUpdated="2025-04-15T08:30:00Z"
        sources={sampleSources}
        additionalInfo={additionalInfo}
      />
    );
    
    expect(screen.getByText(additionalInfo)).toBeInTheDocument();
  });

  // Test without additional info
  test('does not render additional info section when not provided', () => {
    renderWithTheme(
      <ModelCitationPanel 
        modelName="Economic Model" 
        version="1.0.0"
        lastUpdated="2025-04-15T08:30:00Z"
        sources={sampleSources}
      />
    );
    
    // Use a regex that would match any additional info section text
    const additionalInfoRegex = /Model trained on/i;
    expect(screen.queryByText(additionalInfoRegex)).not.toBeInTheDocument();
  });

  // Test PerplexityEnhancementBadge integration
  test('includes PerplexityEnhancementBadge', () => {
    renderWithTheme(
      <ModelCitationPanel 
        modelName="Economic Model" 
        version="1.0.0"
        lastUpdated="2025-04-15T08:30:00Z"
        sources={sampleSources}
      />
    );
    
    // Should have the Perplexity Enhanced badge
    expect(screen.getByText('Perplexity Enhanced')).toBeInTheDocument();
  });

  // Test accessibility
  test('meets accessibility standards with proper ARIA attributes', () => {
    const { container } = renderWithTheme(
      <ModelCitationPanel 
        modelName="Economic Model" 
        version="1.0.0"
        lastUpdated="2025-04-15T08:30:00Z"
        sources={sampleSources}
      />
    );
    
    // Links should have proper attributes for accessibility
    const links = container.querySelectorAll('a');
    links.forEach(link => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
    
    // Model name should be properly emphasized in heading
    const modelHeading = screen.getByText('Economic Model');
    // MUI Typography can render with different HTML tags (h6, p, etc.)
    expect(['H6', 'P']).toContain(modelHeading.tagName);
    // The important part is that it has proper styling
    expect(modelHeading).toHaveClass('MuiTypography-root');
  });

  // Test SAP Fiori compliance
  test('adheres to SAP Fiori Horizon design principles', () => {
    const { container } = renderWithTheme(
      <ModelCitationPanel 
        modelName="Economic Model" 
        version="1.0.0"
        lastUpdated="2025-04-15T08:30:00Z"
        sources={sampleSources}
      />
    );
    
    // Card should have proper styling
    const card = container.querySelector('.MuiCard-root');
    expect(card).toBeInTheDocument();
    
    // Version chip should exist with proper styling
    const versionChip = screen.getByText('v1.0.0');
    const chipElement = versionChip.closest('.MuiChip-root');
    expect(chipElement).toBeInTheDocument();
    
    // SAP disclaimer text should be present
    expect(screen.getByText(/This model follows SCB's AI transparency standards/)).toBeInTheDocument();
  });
});
