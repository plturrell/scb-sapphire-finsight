# SCB Beautiful UI Components

This document lists all the components that have been enhanced with SCB's beautiful styling system.

## Enhanced Components

These components have been upgraded to use SCB's design system with Fiori integration, brand colors, and responsive design:

1. **EnhancedPerplexitySearchBar**
   - A beautifully styled search component using SCB design variables
   - Path: `/src/components/EnhancedPerplexitySearchBar.tsx`

2. **EnhancedPerplexityNewsBar**
   - A news bar component with SCB styling
   - Path: `/src/components/EnhancedPerplexityNewsBar.tsx`

3. **ScbBeautifulUI**
   - A wrapper component that ties everything together
   - Path: `/src/components/ScbBeautifulUI.tsx`

4. **MetricCard**
   - A card component for displaying metrics with SCB styling
   - Path: `/src/components/MetricCard.tsx`

5. **EnhancedResponsiveTable**
   - A data table with responsive behavior styled with SCB design
   - Path: `/src/components/EnhancedResponsiveTable.tsx`

6. **EnhancedSimulationControls**
   - Controls for Monte Carlo simulations using SCB styling
   - Path: `/src/components/EnhancedSimulationControls.tsx`

7. **EnhancedTariffAlertList**
   - A beautifully styled alert list component
   - Path: `/src/components/EnhancedTariffAlertList.tsx`

8. **EnhancedTouchButton**
   - Mobile-friendly touch buttons with SCB styling
   - Also includes EnhancedFAB, EnhancedSegmentedControl, and EnhancedPillTabs
   - Path: `/src/components/EnhancedTouchButton.tsx`

9. **EnhancedVietnamTariffDashboard**
   - Complete dashboard for Vietnam tariff analysis with SCB styling
   - Path: `/src/components/EnhancedVietnamTariffDashboard.tsx`

10. **EnhancedCountrySelector**
    - Dropdown and pill-based country selectors with SCB styling
    - Path: `/src/components/EnhancedCountrySelector.tsx`

11. **EnhancedLoadingSpinner**
    - Various loading spinners and indicators using SCB styling
    - Includes inline spinners, loading buttons, skeletons, and page loaders
    - Path: `/src/components/EnhancedLoadingSpinner.tsx`

12. **EnhancedForceDirectedGraph**
    - Knowledge graph visualization with SCB styling
    - Interactive nodes and edges with AI indicators
    - Path: `/src/components/EnhancedForceDirectedGraph.tsx`

13. **EnhancedAllocationPieChart**
    - Pie chart for asset allocation with SCB styling
    - AI-enhanced indicators and interactive segments
    - Path: `/src/components/charts/EnhancedAllocationPieChart.tsx`

14. **EnhancedLineChart**
    - Time series visualization with SCB styling
    - Support for multiple data series and AI-enhanced projections
    - Path: `/src/components/charts/EnhancedLineChart.tsx`

15. **EnhancedBarChart**
    - Bar chart visualization with SCB styling
    - Supports vertical/horizontal orientations and AI-enhanced data points
    - Path: `/src/components/charts/EnhancedBarChart.tsx`

## Style Variables

The core styling variables are defined in `/src/styles/globals.css` and include:

- SCB Brand Colors (Honolulu Blue, American Green, etc.)
- Financial Data Color Logic
- SAP Fiori Horizon Integration
- Component Class Definitions
- Responsive Typography Scale
- Touch-friendly utilities
- Responsive Grid Utilities
- Animation utilities

## Usage Example

Here's a quick example of how to use these enhanced components:

```tsx
import ScbBeautifulUI from '@/components/ScbBeautifulUI';
import EnhancedTariffAlertList from '@/components/EnhancedTariffAlertList';
import EnhancedTouchButton from '@/components/EnhancedTouchButton';
import MetricCard from '@/components/MetricCard';
import EnhancedLoadingSpinner from '@/components/EnhancedLoadingSpinner';
import EnhancedCountrySelector from '@/components/EnhancedCountrySelector';
import { EnhancedLineChart, EnhancedBarChart, EnhancedAllocationPieChart } from '@/components/charts';

export default function Dashboard() {
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  
  // Sample data for charts
  const lineChartData = [
    {
      id: 'revenue',
      name: 'Revenue',
      data: [
        { date: new Date('2023-01-01'), value: 105000 },
        { date: new Date('2023-02-01'), value: 125000 },
        { date: new Date('2023-03-01'), value: 140000 },
        { date: new Date('2023-04-01'), value: 160000, aiGenerated: true, confidence: 0.95 },
      ],
      color: 'rgb(var(--scb-honolulu-blue))',
      aiEnhanced: true
    }
  ];
  
  const barChartData = [
    { label: 'Product A', value: 45000, aiEnhanced: true, confidence: 0.9 },
    { label: 'Product B', value: 32000, change: 0.15 },
    { label: 'Product C', value: 28000, change: -0.05 },
    { label: 'Product D', value: 18000 }
  ];
  
  const pieChartData = [
    { name: 'Equities', value: 0.45, color: 'rgb(var(--scb-honolulu-blue))' },
    { name: 'Fixed Income', value: 0.30, color: 'rgb(var(--scb-american-green))' },
    { name: 'Alternatives', value: 0.15, color: 'rgb(245, 152, 0)', aiEnhanced: true },
    { name: 'Cash', value: 0.10, color: 'rgb(var(--scb-dark-gray))' }
  ];

  return (
    <ScbBeautifulUI showNewsBar={true} pageTitle="Dashboard">
      <div className="flex justify-between items-center mb-6">
        <EnhancedCountrySelector 
          selectedCountry={selectedCountry}
          onChange={setSelectedCountry}
        />
        
        <EnhancedTouchButton 
          variant="primary" 
          size="md"
          onClick={() => {/* handle click */}}
        >
          View Details
        </EnhancedTouchButton>
      </div>
      
      {isLoading ? (
        <EnhancedLoadingSpinner message="Loading data..." />
      ) : (
        <>
          {/* Metrics row */}
          <div className="grid-responsive mb-6">
            <MetricCard 
              title="Total Revenue" 
              value={1250000} 
              format="currency" 
              change={2.5} 
              period="vs. last month" 
            />
            
            <MetricCard 
              title="Active Users" 
              value={42560} 
              format="number" 
              change={-1.8} 
              period="vs. last month" 
            />
            
            <MetricCard 
              title="Conversion Rate" 
              value={0.0345} 
              format="percent" 
              change={0.8} 
              period="vs. last month" 
            />
          </div>
          
          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <EnhancedLineChart 
              series={lineChartData}
              title="Revenue Trend"
              subtitle="Monthly revenue with AI forecast"
              height={300}
              showAIIndicators={true}
            />
            
            <EnhancedBarChart
              data={barChartData}
              title="Revenue by Product"
              subtitle="Current period with year-over-year change"
              height={300}
              orientation="vertical"
            />
          </div>
          
          {/* Bottom row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <EnhancedAllocationPieChart
                data={pieChartData}
                title="Asset Allocation"
                height={300}
                innerRadius={80}
                showAIIndicators={true}
              />
            </div>
            
            <div className="lg:col-span-2">
              <EnhancedTariffAlertList 
                alerts={alerts} 
                title="Recent Alerts" 
              />
            </div>
          </div>
        </>
      )}
    </ScbBeautifulUI>
  );
}
```

## Styling Classes

Common styling classes to use throughout the application:

- `fiori-tile`: For card-like containers
- `fiori-btn`: Base button styling
- `fiori-btn-primary`: Primary action button
- `fiori-btn-secondary`: Secondary action button
- `fiori-btn-ghost`: Text-only button
- `fiori-input`: Input field styling
- `horizon-chip`: Tag/chip component
- `horizon-chip-blue`: Blue variant of the tag component
- `horizon-chip-green`: Green variant of the tag component
- `grid-responsive`: Responsive grid layout
- `animate-fadeIn`: Smooth fade-in animation
- `animate-slide-in-right`: Slide-in from right animation

## Font System

The application uses SCB's ProsperSans font family:
- SCProsperSans-Regular
- SCProsperSans-Medium
- SCProsperSans-Bold
- SCProsperSans-Light

These fonts are loaded from the /public/fonts/ directory.

## Component Composition

The SCB Beautiful UI system is designed for component composition. Start with the `ScbBeautifulUI` wrapper, then combine:

1. Layout components (ResponsiveGrid, fiori-tile containers)
2. Data visualization components:
   - Metrics: MetricCard, EnhancedResponsiveTable
   - Charts: EnhancedLineChart, EnhancedBarChart, EnhancedAllocationPieChart
   - Complex visualizations: EnhancedForceDirectedGraph, EnhancedSankeyChart
3. Interactive components (EnhancedTouchButton, EnhancedCountrySelector)
4. Feedback components (EnhancedLoadingSpinner, horizon-chip tags)
5. AI-enhanced components (special indicators, confidence markers)

This modular approach ensures consistent styling across the application while allowing for flexible layouts.

## Chart Components

The enhanced chart components provide data visualization with SCB's beautiful styling:

1. **EnhancedLineChart**: For time series data, forecasts, and trends
   - Perfect for financial performance over time
   - Supports multiple series with AI-enhanced projections
   - Interactive tooltips, zoom features, and SCB styling

2. **EnhancedBarChart**: For category comparisons and rankings
   - Vertical or horizontal orientations
   - Year-over-year change indicators with SCB colors
   - AI-enhanced data points with confidence markers

3. **EnhancedAllocationPieChart**: For proportional compositions
   - Perfect for portfolio allocations, market share
   - Donut chart with center KPI display
   - Interactive segments with SCB styling

4. **EnhancedForceDirectedGraph**: For network and relationship visualization
   - Knowledge graphs with interactive nodes/edges
   - AI-enhanced relationship indicators
   - SCB styling for node categories and relationship types

All chart components include:
- AI-enhanced indicators with SCB styling
- Loading/empty states
- Interactive elements (tooltips, clicks)
- Responsive sizing
- Accessibility features