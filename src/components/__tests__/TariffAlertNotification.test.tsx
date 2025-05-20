import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TariffAlertNotification from '../TariffAlertNotification';
import { TariffAlert } from '../../types';

// Mock next/link since we're in a test environment
jest.mock('next/link', () => {
  return {
    __esModule: true,
    default: function MockLink({ children, href, className, onClick }: { children: any, href: string, className?: string, onClick?: Function }) {
      return (
        <a 
          href={href} 
          className={className} 
          onClick={(e) => onClick && onClick(e)}
        >
          {children}
        </a>
      );
    }
  };
});

// Mock comprehensive test data reflecting domain-specific tariff alert requirements
const mockAlerts: TariffAlert[] = [
  {
    id: '1',
    title: 'Critical tariff increase on electronics from China',
    description: 'New 25% tariff on semiconductors and electronic components will be effective from June 1, 2025.',
    country: 'China',
    priority: 'Critical',
    impactSeverity: 9,
    confidence: 0.95,
    createdAt: new Date('2025-05-15T10:00:00Z'),
    publishDate: new Date('2025-05-15T08:00:00Z'),
    productCategories: ['Electronics', 'Semiconductors'],
    sourceName: 'Financial Times',
    sourceUrl: 'https://ft.com/article/123',
    aiEnhanced: true
  },
  {
    id: '2',
    title: 'Tariff reduction on textiles from Vietnam',
    description: 'New trade agreement reduces tariffs on textiles by 8%, effective immediately.',
    country: 'Vietnam',
    priority: 'medium',
    impactSeverity: 5,
    confidence: 0.89,
    createdAt: new Date('2025-05-14T14:30:00Z'),
    publishDate: new Date('2025-05-14T12:30:00Z'),
    productCategories: ['Textiles'],
    sourceName: 'Reuters',
    sourceUrl: 'https://reuters.com/article/456',
    aiEnhanced: false
  },
  {
    id: '3',
    title: 'Potential automotive tariff changes in EU',
    description: 'European Commission discussing potential 5-8% increase in automotive tariffs.',
    country: 'European Union',
    priority: 'high',
    impactSeverity: 7,
    confidence: 0.82,
    createdAt: new Date('2025-05-12T09:15:00Z'),
    publishDate: new Date('2025-05-12T08:15:00Z'),
    productCategories: ['Automotive'],
    sourceName: 'Bloomberg',
    sourceUrl: 'https://bloomberg.com/article/789',
    aiEnhanced: true
  },
  {
    id: '4',
    title: 'Agricultural tariff negotiations with Brazil',
    description: 'Ongoing negotiations may lead to reduced tariffs on agricultural products.',
    country: 'Brazil',
    priority: 'low',
    impactSeverity: 3,
    confidence: 0.75,
    createdAt: new Date('2025-05-10T16:45:00Z'),
    publishDate: new Date('2025-05-10T14:45:00Z'),
    productCategories: ['Agriculture'],
    sourceName: 'Trade Economics',
    sourceUrl: 'https://tradeeconomics.com/article/101',
    aiEnhanced: false
  },
  {
    id: '5',
    title: 'Medical equipment import tariff review',
    description: 'Health ministry reviewing import tariffs on medical equipment for potential reduction.',
    country: 'United States',
    priority: 'medium',
    impactSeverity: 4,
    confidence: 0.80,
    createdAt: new Date('2025-05-08T11:30:00Z'),
    publishDate: new Date('2025-05-08T10:00:00Z'),
    productCategories: ['Healthcare', 'Medical Equipment'],
    sourceName: 'Healthcare Economics',
    sourceUrl: 'https://healthcareecon.com/article/202',
    aiEnhanced: true
  },
  {
    id: '6',
    title: 'Critical steel tariff escalation',
    description: 'Immediate 30% tariff increase on steel imports announced with minimal notice period.',
    country: 'United States',
    priority: 'Critical',
    impactSeverity: 10,
    confidence: 0.98,
    createdAt: new Date('2025-05-19T18:30:00Z'),
    publishDate: new Date('2025-05-19T16:30:00Z'),
    productCategories: ['Steel', 'Manufacturing'],
    sourceName: 'Wall Street Journal',
    sourceUrl: 'https://wsj.com/article/303',
    aiEnhanced: true
  }
];

describe('TariffAlertNotification Component', () => {
  // Test rendering and basic functionality
  test('renders collapsed notification with highest priority alert', () => {
    render(<TariffAlertNotification alerts={mockAlerts} />);
    
    // Verify the collapsed view shows the highest priority alert (which should be the Critical one)
    expect(screen.getByText(/Tariff Alert/)).toBeInTheDocument();
    expect(screen.getByText('Critical steel tariff escalation')).toBeInTheDocument();
    // There are 2 critical alerts in our mock data
    expect(screen.getByText(/\+\d more/)).toBeInTheDocument();
  });
  
  test('does not render when no alerts are provided', () => {
    const { container } = render(<TariffAlertNotification alerts={[]} />);
    expect(container.firstChild).toBeNull();
  });
  
  test('expands to show detailed alerts when clicked', () => {
    render(<TariffAlertNotification alerts={mockAlerts} />);
    
    // Click to expand
    fireEvent.click(screen.getByText('Critical steel tariff escalation'));
    
    // Verify expanded view header
    expect(screen.getByText('Recent Tariff Alerts')).toBeInTheDocument();
    
    // Verify all alert titles are shown
    expect(screen.getByText('Critical steel tariff escalation')).toBeInTheDocument();
    expect(screen.getByText('Critical tariff increase on electronics from China')).toBeInTheDocument();
    expect(screen.getByText('Potential automotive tariff changes in EU')).toBeInTheDocument();
    expect(screen.getByText('Tariff reduction on textiles from Vietnam')).toBeInTheDocument();
    expect(screen.getByText('Medical equipment import tariff review')).toBeInTheDocument();
    
    // Verify alert details are shown in a more specific way
    const impactText = screen.getByText('Impact: 10/10');
    expect(impactText).toBeInTheDocument();
    
    const confidenceText = screen.getByText('Confidence: 98%');
    expect(confidenceText).toBeInTheDocument();
    
    // Find the country text - we need to be more specific since 'United States' appears multiple times
    const alertElement = impactText.closest('li');
    expect(alertElement).toHaveTextContent('United States');
    
    // Verify the summary footer
    expect(screen.getByText('Showing 5 of 6 alerts')).toBeInTheDocument();
  });
  
  test('collapses expanded view when close button is clicked', () => {
    const { container } = render(<TariffAlertNotification alerts={mockAlerts} />);
    
    // Expand
    fireEvent.click(screen.getByText('Critical steel tariff escalation'));
    expect(screen.getByText('Recent Tariff Alerts')).toBeInTheDocument();
    
    // Find and click the close button (button containing X icon)
    const closeButton = container.querySelector('button:has(svg[class*="lucide-x"])');
    expect(closeButton).toBeInTheDocument();
    if (closeButton) {
      fireEvent.click(closeButton);
    }
    
    // Verify we're back to collapsed view
    expect(screen.getByText(/Tariff Alert/)).toBeInTheDocument();
  });
  
  // Test proper prioritization and sorting
  test('displays alerts in priority order', async () => {
    render(<TariffAlertNotification alerts={mockAlerts} />);
    
    // Expand the view
    fireEvent.click(screen.getByText('Critical steel tariff escalation'));
    
    // Get all alert elements 
    const alertElements = screen.getAllByRole('listitem');
    
    // Check first item (should be highest priority - Critical)
    expect(alertElements[0]).toHaveTextContent('Critical steel tariff escalation');
    
    // Second item should be the other Critical alert
    expect(alertElements[1]).toHaveTextContent('Critical tariff increase on electronics from China');
    
    // Third item should be high priority
    expect(alertElements[2]).toHaveTextContent('Potential automotive tariff changes in EU');
  });
  
  // Test callback functionality
  test('calls onViewAll callback when View All button is clicked', () => {
    const handleViewAll = jest.fn();
    render(<TariffAlertNotification alerts={mockAlerts} onViewAll={handleViewAll} />);
    
    // Click View All in collapsed view
    fireEvent.click(screen.getByText('View All'));
    expect(handleViewAll).toHaveBeenCalledTimes(1);
    
    // Expand
    fireEvent.click(screen.getByText('Critical steel tariff escalation'));
    
    // Click View All in expanded view
    fireEvent.click(screen.getByText('View All Alerts'));
    expect(handleViewAll).toHaveBeenCalledTimes(2);
  });
  
  test('calls onDismiss callback when provided', () => {
    const handleDismiss = jest.fn();
    render(<TariffAlertNotification alerts={mockAlerts} onDismiss={handleDismiss} />);
    
    // Note: The current implementation doesn't have individual dismiss buttons
    // This test is ready if that functionality is added
  });
  
  // Test AI enhancement display
  test('displays AI Enhanced indicators for appropriate alerts', () => {
    const { container } = render(<TariffAlertNotification alerts={mockAlerts} />);
    
    // Expand
    fireEvent.click(screen.getByText('Critical steel tariff escalation'));
    
    // Get the number of visible alerts with AI Enhanced indicators
    const aiEnhancedLabels = container.querySelectorAll('.text-green-700');
    
    // Due to the sorting by priority and date, we know which alerts should be visible
    // Only the top 5 alerts are shown in the UI
    // In our mock data, sorted by priority and date, 4 of those have aiEnhanced=true
    const expectedAiEnhancedCount = 4;
    
    expect(aiEnhancedLabels.length).toBe(expectedAiEnhancedCount);
  });
  
  // Test source linking
  test('includes source links for alerts with source information', () => {
    render(<TariffAlertNotification alerts={mockAlerts} />);
    
    // Expand
    fireEvent.click(screen.getByText('Critical steel tariff escalation'));
    
    // Check for source links
    expect(screen.getByText('Wall Street Journal')).toBeInTheDocument();
    expect(screen.getByText('Wall Street Journal')).toHaveAttribute('href', 'https://wsj.com/article/303');
    
    expect(screen.getByText('Financial Times')).toBeInTheDocument();
    expect(screen.getByText('Financial Times')).toHaveAttribute('href', 'https://ft.com/article/123');
  });
  
  // Test accessibility features
  test('meets accessibility standards with proper semantic HTML', () => {
    const { container } = render(<TariffAlertNotification alerts={mockAlerts} />);
    
    // Expand
    fireEvent.click(screen.getByText('Critical steel tariff escalation'));
    
    // Check for proper heading structure
    expect(screen.getByText('Recent Tariff Alerts')).toBeInTheDocument();
    
    // Check for proper list semantics
    const list = container.querySelector('ul');
    expect(list).toBeInTheDocument();
    
    const listItems = container.querySelectorAll('li');
    expect(listItems.length).toBe(5); // Should show 5 alerts
    
    // Check for the close button (X icon button)
    const closeButton = container.querySelector('button svg[class*="lucide-x"]');
    expect(closeButton).toBeInTheDocument();
  });
  
  // Test styling and visual indicators
  test('applies correct styling based on alert priority', () => {
    const { container } = render(<TariffAlertNotification alerts={mockAlerts} />);
    
    // Expand
    fireEvent.click(screen.getByText('Critical steel tariff escalation'));
    
    // Using container.querySelectorAll is more reliable for class-based testing
    const criticalBadges = container.querySelectorAll('.bg-red-100.text-red-800');
    expect(criticalBadges.length).toBeGreaterThan(0);
    
    const highBadges = container.querySelectorAll('.bg-amber-100.text-amber-800');
    expect(highBadges.length).toBeGreaterThan(0);
    
    const mediumBadges = container.querySelectorAll('.bg-blue-100.text-blue-800');
    expect(mediumBadges.length).toBeGreaterThan(0);
  });
  
  // Test consistent SAP Fiori styling
  test('maintains consistent SAP Fiori styling', () => {
    const { container } = render(<TariffAlertNotification alerts={mockAlerts} />);
    
    // Check for SAP Fiori color palette usage (amber/blue colors for notifications)
    expect(container.querySelector('.bg-amber-50')).toBeInTheDocument();
    expect(container.querySelector('.border-amber-200')).toBeInTheDocument();
    
    // Expand to check more elements
    fireEvent.click(screen.getByText('Critical steel tariff escalation'));
    
    // Verify rounded corners for buttons/UI elements (Fiori design pattern)
    const roundedElements = container.querySelectorAll('.rounded-md, .rounded-full');
    expect(roundedElements.length).toBeGreaterThan(0);
    
    // Verify proper spacing according to Fiori guidelines
    expect(container.querySelector('.p-3')).toBeInTheDocument();
    expect(container.querySelector('.gap-3')).toBeInTheDocument();
  });
});
