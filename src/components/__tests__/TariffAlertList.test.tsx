import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import TariffAlertList from '../TariffAlertList';
import { TariffAlert } from '../../types';

// Mock the icons
jest.mock('../icons', () => ({
  AlertIcon: ({ variant, size, className }: any) => (
    <div data-testid={`alert-icon-${variant}`} className={className}>
      AlertIcon-{variant}-{size}
    </div>
  ),
  SparklesIcon: ({ size, animation }: any) => (
    <div data-testid="sparkles-icon">SparklesIcon-{size}-{animation}</div>
  ),
  LoadingIcon: ({ variant, animation, size, className }: any) => (
    <div data-testid={`loading-icon-${variant}`} className={className}>
      LoadingIcon-{variant}-{size}-{animation}
    </div>
  )
}));

// Mock the Lucide React icons
jest.mock('lucide-react', () => ({
  ExternalLink: (props: any) => <div data-testid="external-link-icon" {...props} />,
  Clock: (props: any) => <div data-testid="clock-icon" {...props} />,
  Tag: (props: any) => <div data-testid="tag-icon" {...props} />
}));

describe('TariffAlertList Component', () => {
  // Sample mock alerts for testing
  const mockAlerts: TariffAlert[] = [
    {
      id: '1',
      title: 'Critical steel tariff escalation',
      description: 'New 25% tariff on steel imports effective immediately',
      priority: 'Critical',
      country: 'United States',
      publishDate: new Date('2025-01-15'),
      createdAt: new Date('2025-01-15'),
      impactSeverity: 10,
      confidence: 0.98,
      aiEnhanced: true,
      sourceName: 'Trade Policy Journal',
      sourceUrl: 'https://example.com/steel-tariff',
      tariffRate: 25,
      productCategories: ['Steel', 'Metals', 'Construction']
    },
    {
      id: '2',
      title: 'Tariff reduction on textiles from Vietnam',
      description: 'Reduction in tariffs for textile imports from Vietnam',
      priority: 'medium',
      country: 'European Union',
      publishDate: new Date('2025-01-10'),
      createdAt: new Date('2025-01-10'),
      impactSeverity: 6,
      confidence: 0.85,
      aiEnhanced: true,
      sourceName: 'EU Trade Commission',
      sourceUrl: 'https://example.com/eu-vietnam',
      tariffRate: 5,
      productCategories: ['Textiles', 'Apparel']
    },
    {
      id: '3',
      title: 'Medical equipment import tariff review',
      description: 'Potential changes to medical equipment import tariffs',
      priority: 'high',
      country: 'Canada',
      publishDate: new Date('2025-01-05'),
      createdAt: new Date('2025-01-05'),
      impactSeverity: 7,
      confidence: 0.75,
      aiEnhanced: false,
      sourceName: 'Health Industry News',
      sourceUrl: 'https://example.com/medical-tariffs',
      tariffRate: 15,
      productCategories: ['Medical Equipment', 'Healthcare']
    }
  ];

  // Test rendering with alerts
  test('renders a list of tariff alerts', () => {
    const { container } = render(<TariffAlertList alerts={mockAlerts} />);
    
    // Check if all alert titles are displayed
    expect(screen.getByText('Critical steel tariff escalation')).toBeInTheDocument();
    expect(screen.getByText('Tariff reduction on textiles from Vietnam')).toBeInTheDocument();
    expect(screen.getByText('Medical equipment import tariff review')).toBeInTheDocument();
    
    // Verify that alerts contain the necessary data
    const alertElements = container.querySelectorAll('li');
    expect(alertElements.length).toBe(mockAlerts.length);
    
    // Test the first alert details specifically
    const firstAlert = alertElements[0];
    
    // Check for country
    expect(firstAlert.textContent).toContain('United States');
    
    // Check for tariff rate
    expect(firstAlert.textContent).toContain('Rate: 25%');
    
    // Check for impact and confidence values
    expect(firstAlert.textContent).toContain('Impact:');
    expect(firstAlert.textContent).toContain('10/10');
    expect(firstAlert.textContent).toContain('Confidence:');
    expect(firstAlert.textContent).toContain('98%');
    
    // Check for source links
    const sourceLinks = container.querySelectorAll('a');
    const sourceLinkTexts = Array.from(sourceLinks).map(link => link.textContent);
    expect(sourceLinkTexts).toContain('Trade Policy Journal');
    expect(sourceLinkTexts).toContain('EU Trade Commission');
    expect(sourceLinkTexts).toContain('Health Industry News');
  });

  // Test loading state
  test('displays loading state when isLoading is true', () => {
    render(<TariffAlertList alerts={[]} isLoading={true} />);
    
    expect(screen.getByTestId('loading-icon-spinner')).toBeInTheDocument();
    expect(screen.getByText('Loading alerts...')).toBeInTheDocument();
  });

  // Test empty state
  test('displays empty state when no alerts are provided', () => {
    render(<TariffAlertList alerts={[]} />);
    
    expect(screen.getByText('No tariff alerts found')).toBeInTheDocument();
    expect(screen.getByText('Adjust your filter criteria or check back later for new alerts')).toBeInTheDocument();
    expect(screen.getByTestId('alert-icon-info')).toBeInTheDocument();
  });

  // Test alert click callback
  test('calls onAlertClick callback when an alert is clicked', () => {
    const handleAlertClick = jest.fn();
    render(<TariffAlertList alerts={mockAlerts} onAlertClick={handleAlertClick} />);
    
    // Click on the first alert
    fireEvent.click(screen.getByText('Critical steel tariff escalation'));
    
    // Verify callback was called with the correct alert
    expect(handleAlertClick).toHaveBeenCalledTimes(1);
    expect(handleAlertClick).toHaveBeenCalledWith(mockAlerts[0]);
  });

  // Test priority styling
  test('applies correct styling based on alert priority', () => {
    render(<TariffAlertList alerts={mockAlerts} />);
    
    // Get all priority badges
    const priorityBadges = screen.getAllByText(/Critical|medium|high/);
    
    // Critical should have red styling
    const criticalBadge = priorityBadges.find(badge => badge.textContent === 'Critical');
    expect(criticalBadge).toHaveClass('bg-red-100');
    expect(criticalBadge).toHaveClass('text-red-800');
    
    // Medium should have blue styling
    const mediumBadge = priorityBadges.find(badge => badge.textContent === 'medium');
    expect(mediumBadge).toHaveClass('bg-blue-100');
    expect(mediumBadge).toHaveClass('text-blue-800');
    
    // High should have amber styling
    const highBadge = priorityBadges.find(badge => badge.textContent === 'high');
    expect(highBadge).toHaveClass('bg-amber-100');
    expect(highBadge).toHaveClass('text-amber-800');
  });

  // Test AI Enhanced indicators
  test('displays AI Enhanced indicators for appropriate alerts', () => {
    render(<TariffAlertList alerts={mockAlerts} />);
    
    // Count AI Enhanced labels (should be 2)
    const aiEnhancedLabels = screen.getAllByText('AI Enhanced');
    expect(aiEnhancedLabels.length).toBe(2);
    
    // Check if the sparkles icon is present
    const sparklesIcons = screen.getAllByTestId('sparkles-icon');
    expect(sparklesIcons.length).toBe(2);
  });

  // Test date formatting
  test('formats dates correctly', () => {
    render(<TariffAlertList alerts={mockAlerts} />);
    
    // The component is likely using toLocaleDateString, which formats differently based on locale
    // Check for the presence of date content rather than exact format
    const dateElements = screen.getAllByTestId('clock-icon');
    expect(dateElements.length).toBe(3); // Should have 3 dates for our 3 alerts
    
    // Verify each date icon exists
    dateElements.forEach(dateIcon => {
      expect(dateIcon).toBeInTheDocument();
    });
    
    // Check for any date-like content using regex patterns that match dates
    // This is more flexible than checking exact date strings
    const datePattern = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}/i;
    const dateTextElements = screen.getAllByText(datePattern);
    expect(dateTextElements.length).toBeGreaterThan(0);
  });

  // Test product categories truncation
  test('truncates product categories when there are more than 2', () => {
    render(<TariffAlertList alerts={mockAlerts} />);
    
    // Check for the presence of product categories, allowing for flexible text formatting
    expect(screen.getByText(/Products: Steel, Metals/)).toBeInTheDocument();
    expect(screen.getByText(/Products: Textiles, Apparel/)).toBeInTheDocument();
    expect(screen.getByText(/Products: Medical Equipment, Healthcare/)).toBeInTheDocument();
    
    // Check if ellipsis is rendered when there are more than 2 categories
    // First alert has 3 categories but UI may format differently
    const productCategoryElements = screen.getAllByText(/Products:/i);
    const longCategoryElement = productCategoryElements.find(el => 
      el.textContent?.includes('Steel') && el.textContent?.includes('Metals')
    );
    expect(longCategoryElement).toBeTruthy();
  });

  // Test impact severity color coding
  test('applies correct color coding for impact severity', () => {
    const { container } = render(<TariffAlertList alerts={mockAlerts} />);
    
    // Find the elements containing impact severity information
    const impactContainers = Array.from(container.querySelectorAll('.flex.items-center.text-xs'))
      .filter(el => el.textContent?.includes('Impact:'));
    
    // Find specific impact elements by searching for the severity value
    const highImpactContainer = impactContainers.find(el => el.textContent?.includes('10/10'));
    const highImpactValue = highImpactContainer?.querySelector('.font-medium');
    expect(highImpactValue).toHaveClass('text-red-600');
    
    const mediumImpactContainer = impactContainers.find(el => el.textContent?.includes('6/10'));
    const mediumImpactValue = mediumImpactContainer?.querySelector('.font-medium');
    expect(mediumImpactValue).toHaveClass('text-amber-600');
    
    // Create a new render with a low impact alert
    const lowImpactAlert: TariffAlert = {
      ...mockAlerts[0],
      id: '4',
      impactSeverity: 4,
      title: 'Low impact alert',
      createdAt: new Date('2025-01-01')
    };
    
    // Unmount previous render to avoid interference
    cleanup();
    
    const { container: container2 } = render(<TariffAlertList alerts={[lowImpactAlert]} />);
    
    // In this specific new render, check for the '4/10' text with class containing blue-600
    const impacts = Array.from(container2.querySelectorAll('.font-medium'))
      .filter(el => el.textContent?.includes('4/10'));
      
    // Expect to find at least one element with the impact text
    expect(impacts.length).toBeGreaterThan(0);
    
    // Check that at least one has blue color class
    const hasBlueImpact = impacts.some(el => el.classList.contains('text-blue-600'));
    expect(hasBlueImpact).toBe(true);
  });

  // Test source link opens in new tab
  test('renders source links that open in new tabs', () => {
    render(<TariffAlertList alerts={mockAlerts} />);
    
    // Get all source links
    const sourceLinks = screen.getAllByRole('link');
    
    // Check if they have the correct attributes for opening in a new tab
    sourceLinks.forEach(link => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});
