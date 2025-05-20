import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TariffAlertFilters from '../TariffAlertFilters';
import { TariffAlert } from '../../types';

// Mock the Lucide React icons
jest.mock('lucide-react', () => ({
  CheckSquare: (props: any) => <div data-testid="check-square-icon" {...props} />,
  Square: (props: any) => <div data-testid="square-icon" {...props} />
}));

describe('TariffAlertFilters Component', () => {
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
    },
    {
      id: '4',
      title: 'Low impact agricultural tariff adjustment',
      description: 'Minor adjustment to agricultural import duties',
      priority: 'low',
      country: 'Canada', // Duplicate country to test counts
      publishDate: new Date('2025-01-01'),
      createdAt: new Date('2025-01-01'),
      impactSeverity: 3,
      confidence: 0.92,
      aiEnhanced: false,
      sourceName: 'Agricultural Policy Center',
      sourceUrl: 'https://example.com/ag-tariffs',
      tariffRate: 2,
      productCategories: ['Agriculture']
    }
  ];

  // Mocked state handlers
  const mockSetSelectedCountries = jest.fn();
  const mockSetSelectedPriorities = jest.fn();

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  // Test basic rendering
  test('renders country and priority filter sections', () => {
    render(
      <TariffAlertFilters
        alerts={mockAlerts}
        selectedCountries={[]}
        setSelectedCountries={mockSetSelectedCountries}
        selectedPriorities={[]}
        setSelectedPriorities={mockSetSelectedPriorities}
      />
    );
    
    // Check for filter section headings
    expect(screen.getByText('Country')).toBeInTheDocument();
    expect(screen.getByText('Priority')).toBeInTheDocument();
    
    // Check for unique countries (3)
    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('European Union')).toBeInTheDocument();
    expect(screen.getByText('Canada')).toBeInTheDocument();
    
    // Check for all priorities (4)
    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
    expect(screen.getByText('low')).toBeInTheDocument();
  });

  // Test empty state
  test('shows no filter options message when no alerts are provided', () => {
    render(
      <TariffAlertFilters
        alerts={[]}
        selectedCountries={[]}
        setSelectedCountries={mockSetSelectedCountries}
        selectedPriorities={[]}
        setSelectedPriorities={mockSetSelectedPriorities}
      />
    );
    
    expect(screen.getByText('No filter options available')).toBeInTheDocument();
  });

  // Test country filter selection
  test('calls setSelectedCountries when a country filter is toggled', () => {
    render(
      <TariffAlertFilters
        alerts={mockAlerts}
        selectedCountries={[]}
        setSelectedCountries={mockSetSelectedCountries}
        selectedPriorities={[]}
        setSelectedPriorities={mockSetSelectedPriorities}
      />
    );
    
    // Find the United States label and click on it
    const usLabels = screen.getAllByText('United States');
    const usLabel = usLabels.find(el => el.closest('label'));
    fireEvent.click(usLabel);
    
    // Verify callback was called with the correct country added
    expect(mockSetSelectedCountries).toHaveBeenCalledWith(['United States']);
  });

  // Test priority filter selection
  test('calls setSelectedPriorities when a priority filter is toggled', () => {
    render(
      <TariffAlertFilters
        alerts={mockAlerts}
        selectedCountries={[]}
        setSelectedCountries={mockSetSelectedCountries}
        selectedPriorities={[]}
        setSelectedPriorities={mockSetSelectedPriorities}
      />
    );
    
    // Find the Critical label and click on it
    const criticalLabels = screen.getAllByText('Critical');
    const criticalLabel = criticalLabels.find(el => el.closest('label'));
    fireEvent.click(criticalLabel);
    
    // Verify callback was called with the correct priority added
    expect(mockSetSelectedPriorities).toHaveBeenCalledWith(['Critical']);
  });

  // Test country filter deselection
  test('calls setSelectedCountries to remove country when already selected', () => {
    render(
      <TariffAlertFilters
        alerts={mockAlerts}
        selectedCountries={['Canada']}
        setSelectedCountries={mockSetSelectedCountries}
        selectedPriorities={[]}
        setSelectedPriorities={mockSetSelectedPriorities}
      />
    );
    
    // Find the Canada label and click on it
    const canadaLabels = screen.getAllByText('Canada');
    const canadaLabel = canadaLabels.find(el => el.closest('label'));
    fireEvent.click(canadaLabel);
    
    // Verify callback was called with the country removed
    expect(mockSetSelectedCountries).toHaveBeenCalledWith([]);
  });

  // Test priority filter deselection
  test('calls setSelectedPriorities to remove priority when already selected', () => {
    render(
      <TariffAlertFilters
        alerts={mockAlerts}
        selectedCountries={[]}
        setSelectedCountries={mockSetSelectedCountries}
        selectedPriorities={['high']}
        setSelectedPriorities={mockSetSelectedPriorities}
      />
    );
    
    // Find the high label and click on it
    const highLabels = screen.getAllByText('high');
    const highLabel = highLabels.find(el => el.closest('label'));
    fireEvent.click(highLabel);
    
    // Verify callback was called with the priority removed
    expect(mockSetSelectedPriorities).toHaveBeenCalledWith([]);
  });

  // Test count badges
  test('displays correct count badges for countries and priorities', () => {
    const { container } = render(
      <TariffAlertFilters
        alerts={mockAlerts}
        selectedCountries={[]}
        setSelectedCountries={mockSetSelectedCountries}
        selectedPriorities={[]}
        setSelectedPriorities={mockSetSelectedPriorities}
      />
    );
    
    // Get all the country labels
    const countryLabels = screen.getAllByText(/United States|European Union|Canada/);
    
    // Find the Canada label which should have count of 2
    const canadaLabel = countryLabels.find(el => el.textContent === 'Canada');
    const canadaCount = canadaLabel?.closest('label')?.querySelector('.rounded-full');
    expect(canadaCount?.textContent).toBe('2');
    
    // Find the US label which should have count of 1
    const usLabel = countryLabels.find(el => el.textContent === 'United States');
    const usCount = usLabel?.closest('label')?.querySelector('.rounded-full');
    expect(usCount?.textContent).toBe('1');
    
    // Test priority counts
    const priorityLabels = screen.getAllByText(/Critical|high|medium|low/);
    
    // We expect 1 alert for each priority
    priorityLabels.forEach(priorityLabel => {
      const countBadge = priorityLabel.closest('label')?.querySelector('.rounded-full');
      expect(countBadge?.textContent).toBe('1');
    });
  });

  // Test filter information summary for no filters selected
  test('displays correct filter information summary with no filters', () => {
    render(
      <TariffAlertFilters
        alerts={mockAlerts}
        selectedCountries={[]}
        setSelectedCountries={mockSetSelectedCountries}
        selectedPriorities={[]}
        setSelectedPriorities={mockSetSelectedPriorities}
      />
    );
    
    // No filters selected - should show all alerts
    expect(screen.getByText(`Showing all ${mockAlerts.length} alerts`)).toBeInTheDocument();
  });
  
  // Test filter information summary for selected filters
  test('displays correct filter information summary with country filter', () => {
    render(
      <TariffAlertFilters
        alerts={mockAlerts}
        selectedCountries={['Canada']}
        setSelectedCountries={mockSetSelectedCountries}
        selectedPriorities={[]}
        setSelectedPriorities={mockSetSelectedPriorities}
      />
    );
    
    // Canada has 2 alerts
    expect(screen.getByText(`Showing 2 of ${mockAlerts.length} alerts`)).toBeInTheDocument();
  });

  // Test checkbox icon rendering based on selection state
  test('displays correct checkbox icons based on selection state', () => {
    const { container } = render(
      <TariffAlertFilters
        alerts={mockAlerts}
        selectedCountries={['Canada']}
        setSelectedCountries={mockSetSelectedCountries}
        selectedPriorities={['Critical']}
        setSelectedPriorities={mockSetSelectedPriorities}
      />
    );
    
    // Get all checkbox icons
    const checkSquares = screen.getAllByTestId('check-square-icon');
    const squares = screen.getAllByTestId('square-icon');
    
    // We should have 2 checked items (Canada and Critical)
    expect(checkSquares.length).toBe(2);
    
    // The rest should be unchecked (2 countries + 3 priorities - 2 checked = 3)
    expect(squares.length).toBe(5);
    
    // One of the checked boxes should be in the Canada label
    const canadaLabel = screen.getByText('Canada').closest('label');
    const canadaChecked = canadaLabel?.querySelector('[data-testid="check-square-icon"]');
    expect(canadaChecked).toBeInTheDocument();
    
    // One of the checked boxes should be in the Critical label
    const criticalLabel = screen.getByText('Critical').closest('label');
    const criticalChecked = criticalLabel?.querySelector('[data-testid="check-square-icon"]');
    expect(criticalChecked).toBeInTheDocument();
  });

  // Test priority styling
  test('applies correct styling to priority badges', () => {
    const { container } = render(
      <TariffAlertFilters
        alerts={mockAlerts}
        selectedCountries={[]}
        setSelectedCountries={mockSetSelectedCountries}
        selectedPriorities={[]}
        setSelectedPriorities={mockSetSelectedPriorities}
      />
    );
    
    // Get the priority labels
    const criticalLabel = screen.getByText('Critical').closest('label');
    const highLabel = screen.getByText('high').closest('label');
    const mediumLabel = screen.getByText('medium').closest('label');
    const lowLabel = screen.getByText('low').closest('label');
    
    // Check the badge styling for each priority
    const criticalBadge = criticalLabel?.querySelector('.rounded-full');
    expect(criticalBadge).toHaveClass('bg-red-100');
    expect(criticalBadge).toHaveClass('text-red-800');
    
    const highBadge = highLabel?.querySelector('.rounded-full');
    expect(highBadge).toHaveClass('bg-amber-100');
    expect(highBadge).toHaveClass('text-amber-800');
    
    const mediumBadge = mediumLabel?.querySelector('.rounded-full');
    expect(mediumBadge).toHaveClass('bg-blue-100');
    expect(mediumBadge).toHaveClass('text-blue-800');
    
    const lowBadge = lowLabel?.querySelector('.rounded-full');
    expect(lowBadge).toHaveClass('bg-gray-100');
    expect(lowBadge).toHaveClass('text-gray-800');
  });
});
