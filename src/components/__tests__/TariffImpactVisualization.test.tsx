import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TariffImpactVisualization from '../TariffImpactVisualization';
import { SankeyData } from '../../types';

// Mock next/dynamic
jest.mock('next/dynamic', () => () => {
  const DynamicComponent = ({ data, onRegenerateClick, onEditClick }: any) => (
    <div data-testid="mock-sankey-chart">
      <div data-testid="sankey-data">{JSON.stringify(data)}</div>
      <button 
        data-testid="regenerate-button" 
        onClick={onRegenerateClick}
      >
        Regenerate
      </button>
      <button 
        data-testid="edit-button" 
        onClick={onEditClick}
      >
        Edit Parameters
      </button>
    </div>
  );
  return DynamicComponent;
});

// Mock lucide-react icons
jest.mock('lucide-react', () => {
  const mockIcon = (name: string) => {
    return function MockIcon(props: any) {
      return (
        <div data-testid={`${name}-icon`} className={props.className || ''}>
          {props.children}
        </div>
      );
    };
  };
  
  return {
    Info: mockIcon('info'),
    RefreshCw: mockIcon('refresh-cw'),
    Edit: mockIcon('edit'),
    ChevronRight: mockIcon('chevron-right'),
    ChevronDown: mockIcon('chevron-down'),
    Sparkles: mockIcon('sparkles')
  };
});

// Sample test data that follows the structure expected by the component
const mockSankeyData: SankeyData = {
  nodes: [
    { id: '1', name: 'USA', value: 100, group: 'country' },
    { id: '2', name: 'China', value: 80, group: 'country' },
    { id: '3', name: 'Electronics', value: 60, group: 'product' },
    { id: '4', name: 'Textiles', value: 40, group: 'product' }
  ],
  links: [
    { source: 0, target: 2, value: 60, aiEnhanced: true },
    { source: 1, target: 3, value: 40, aiEnhanced: false }
  ],
  aiInsights: {
    summary: 'The tariff changes will impact electronics trade with the USA most significantly.',
    confidence: 0.92,
    recommendations: [
      'Monitor electronics supply chain for potential disruptions',
      'Consider diversifying sourcing for key electronic components',
      'Prepare contingency planning for potential price increases'
    ],
    updatedAt: new Date('2025-01-15')
  }
};

describe('TariffImpactVisualization', () => {
  // Test loading state
  test('displays loading state correctly', () => {
    render(<TariffImpactVisualization data={null} isLoading={true} />);
    
    // Should show loading spinner
    expect(screen.getByTestId('refresh-cw-icon')).toHaveClass('animate-spin');
    expect(screen.getByText('Running Impact Simulation')).toBeInTheDocument();
    expect(screen.getByText(/Analyzing tariff data with Monte Carlo Tree Search/)).toBeInTheDocument();
    
    // Sankey chart should not be rendered
    expect(screen.queryByTestId('mock-sankey-chart')).not.toBeInTheDocument();
  });
  
  // Test empty state (no data)
  test('displays empty state correctly', () => {
    render(<TariffImpactVisualization data={null} isLoading={false} />);
    
    // Should show info message
    expect(screen.getByTestId('info-icon')).toBeInTheDocument();
    expect(screen.getByText('No Visualization Data')).toBeInTheDocument();
    expect(screen.getByText(/Run a simulation to generate/)).toBeInTheDocument();
    
    // Sankey chart should not be rendered
    expect(screen.queryByTestId('mock-sankey-chart')).not.toBeInTheDocument();
  });
  
  // Test visualization with data
  test('renders visualization when data is provided', () => {
    render(<TariffImpactVisualization data={mockSankeyData} />);
    
    // Should render Sankey chart
    expect(screen.getByTestId('mock-sankey-chart')).toBeInTheDocument();
    
    // Should pass data to Sankey chart
    const sankeyData = screen.getByTestId('sankey-data');
    expect(sankeyData).toHaveTextContent(JSON.stringify(mockSankeyData));
    
    // Should render AI insights panel
    expect(screen.getByText('AI Insights & Recommendations')).toBeInTheDocument();
    expect(screen.getByText('92% confidence')).toBeInTheDocument();
    expect(screen.getByText(mockSankeyData.aiInsights.summary)).toBeInTheDocument();
    
    // Should render recommendations
    mockSankeyData.aiInsights.recommendations.forEach(rec => {
      expect(screen.getByText(rec)).toBeInTheDocument();
    });
    
    // Last updated date should be shown
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });
  
  // Test AI insights panel expand/collapse
  test('toggles AI insights panel visibility', () => {
    render(<TariffImpactVisualization data={mockSankeyData} />);
    
    // Panel should be expanded by default (summary and recommendations visible)
    expect(screen.getByText(mockSankeyData.aiInsights.summary)).toBeInTheDocument();
    expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
    
    // Click to collapse
    fireEvent.click(screen.getByText('AI Insights & Recommendations'));
    
    // Panel should be collapsed (summary and recommendations not visible)
    expect(screen.queryByText(mockSankeyData.aiInsights.summary)).not.toBeInTheDocument();
    expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument();
    
    // Click to expand again
    fireEvent.click(screen.getByText('AI Insights & Recommendations'));
    
    // Panel should be expanded again
    expect(screen.getByText(mockSankeyData.aiInsights.summary)).toBeInTheDocument();
    expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
  });
  
  // Test button click handlers
  test('calls regenerate and edit handlers when buttons are clicked', () => {
    const handleRegenerate = jest.fn();
    const handleEdit = jest.fn();
    
    render(
      <TariffImpactVisualization 
        data={mockSankeyData} 
        onRegenerateClick={handleRegenerate}
        onEditClick={handleEdit}
      />
    );
    
    // Click regenerate button
    fireEvent.click(screen.getByTestId('regenerate-button'));
    expect(handleRegenerate).toHaveBeenCalledTimes(1);
    
    // Click edit parameters button
    fireEvent.click(screen.getByTestId('edit-button'));
    expect(handleEdit).toHaveBeenCalledTimes(1);
  });
  
  // Test accessibility compliance
  test('complies with accessibility standards', () => {
    const { container } = render(<TariffImpactVisualization data={mockSankeyData} />);
    
    // Headings should be properly hierarchical
    const headings = container.querySelectorAll('h3, h4');
    expect(headings.length).toBeGreaterThan(0);
    
    // Buttons should have accessible content
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveTextContent(/\w+/); // Should have some text content
    });
    
    // AI confidence indicator has both color and text representation (not just color)
    const confidenceIndicator = screen.getByText('92% confidence');
    expect(confidenceIndicator).toBeInTheDocument();
    expect(confidenceIndicator).toHaveClass('bg-green-100'); // Visual indicator
    
    // Interactive elements should be clickable
    const clickableHeader = screen.getByText('AI Insights & Recommendations').parentElement.parentElement;
    expect(clickableHeader).toHaveClass('cursor-pointer');
  });
  
  // Test SAP Fiori design alignment
  test('follows SAP Fiori Horizon design principles', () => {
    render(<TariffImpactVisualization data={mockSankeyData} />);
    
    // Should use appropriate color classes that match SAP Fiori palette
    const fioriBlueElements = document.querySelectorAll('.text-blue-600, .bg-blue-100');
    expect(fioriBlueElements.length).toBeGreaterThan(0);
    
    const fioriGreenElements = document.querySelectorAll('.text-green-600, .bg-green-100');
    expect(fioriGreenElements.length).toBeGreaterThan(0);
    
    // Should follow Fiori's "Maintain Quality" principle with confidence indicators
    expect(screen.getByText('92% confidence')).toBeInTheDocument();
    
    // Should follow Fiori's "Empower and Inspire" with recommendations
    expect(screen.getByText('Recommendations:')).toBeInTheDocument();
    
    // Should follow Fiori's "Humans Hold the Keys" with edit controls
    expect(screen.getByTestId('edit-button')).toBeInTheDocument();
    expect(screen.getByTestId('regenerate-button')).toBeInTheDocument();
  });
});
