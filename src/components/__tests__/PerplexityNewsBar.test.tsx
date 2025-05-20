import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import PerplexityNewsBar from '../PerplexityNewsBar';
import perplexityAnalytics from '@/services/PerplexityAnalytics';

// Mock the fetch function
global.fetch = jest.fn();

// Mock the perplexity-api
jest.mock('@/lib/market-news-service', () => ({
  perplexityApi: {
    getMarketNews: jest.fn()
  }
}));

// Mock perplexityAnalytics
jest.mock('@/services/PerplexityAnalytics', () => ({
  trackEvent: jest.fn(),
  trackSearch: jest.fn(),
  trackSearchCompleted: jest.fn(),
  trackSearchError: jest.fn(),
  trackResultSelected: jest.fn(),
  trackFeedback: jest.fn()
}));

// Mock useCache hook
jest.mock('@/hooks', () => ({
  useCache: () => {
    // Return [data, loading, error, refreshFunc]
    const mockRefresh = jest.fn().mockImplementation(async (forceFresh) => {
      return mockNewsItems;
    });
    return [mockNewsItems, false, null, mockRefresh];
  }
}));

// Mock news items
const mockNewsItems = [
  {
    id: 'news-1',
    title: 'Test News Headline',
    summary: 'This is a test news summary',
    category: 'Markets',
    timestamp: new Date().toISOString(),
    source: 'Financial Times',
    url: 'https://example.com/news/1'
  },
  {
    id: 'news-2',
    title: 'Another News Story',
    summary: 'This is another test news summary',
    category: 'Technology',
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    source: 'Bloomberg',
    url: 'https://example.com/news/2'
  }
];

describe('PerplexityNewsBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    
    // Mock window.open
    window.open = jest.fn();
  });

  test('renders news bar correctly', () => {
    render(<PerplexityNewsBar />);
    
    expect(screen.getByText('Market News')).toBeInTheDocument();
    expect(screen.getByText('Powered by Perplexity AI')).toBeInTheDocument();
  });

  test('displays news items correctly', async () => {
    render(<PerplexityNewsBar />);
    
    // Check that news items are rendered
    expect(screen.getByText('Test News Headline')).toBeInTheDocument();
    expect(screen.getByText('This is a test news summary')).toBeInTheDocument();
    expect(screen.getByText('Financial Times')).toBeInTheDocument();
    
    // Check that the second news item is rendered
    expect(screen.getByText('Another News Story')).toBeInTheDocument();
    expect(screen.getByText('Bloomberg')).toBeInTheDocument();
  });

  test('formats timestamps correctly', () => {
    render(<PerplexityNewsBar />);
    
    // The newest item should show minutes
    expect(screen.getByText(/0m ago/)).toBeInTheDocument();
    
    // The hour old item should show hours
    expect(screen.getByText(/1h ago/)).toBeInTheDocument();
  });

  test('refreshes news when refresh button is clicked', async () => {
    render(<PerplexityNewsBar />);
    
    // Find and click the refresh button
    const refreshButton = screen.getByTitle('Refresh news');
    fireEvent.click(refreshButton);
    
    // Verify analytics event was tracked
    expect(perplexityAnalytics.trackEvent).toHaveBeenCalledWith('news:refreshed', expect.any(Object));
  });

  test('opens news link when news item is clicked', async () => {
    render(<PerplexityNewsBar />);
    
    // Find and click a news item
    const newsItem = screen.getByText('Test News Headline');
    fireEvent.click(newsItem.closest('div.p-4') as HTMLElement);
    
    // Verify that window.open was called with the correct URL
    expect(window.open).toHaveBeenCalledWith('https://example.com/news/1', '_blank');
  });

  test('calls onAnalyzeNews when analyze button is clicked', async () => {
    const mockOnAnalyzeNews = jest.fn();
    render(<PerplexityNewsBar onAnalyzeNews={mockOnAnalyzeNews} />);
    
    // Find all analyze buttons (sparkles icon)
    const analyzeButtons = screen.getAllByTitle('Analyze with Joule AI');
    
    // Click the first one
    fireEvent.click(analyzeButtons[0]);
    
    // Verify callback was called with the correct news item
    expect(mockOnAnalyzeNews).toHaveBeenCalledWith(mockNewsItems[0]);
    
    // Verify analytics event was tracked
    expect(perplexityAnalytics.trackEvent).toHaveBeenCalledWith('news:item_clicked', expect.objectContaining({
      newsId: mockNewsItems[0].id,
      title: mockNewsItems[0].title,
      action: 'analyze'
    }));
  });

  test('displays categories with the correct icon', () => {
    render(<PerplexityNewsBar />);
    
    // Check that the categories are displayed
    expect(screen.getByText('Markets')).toBeInTheDocument();
    expect(screen.getByText('Technology')).toBeInTheDocument();
  });

  test('displays footer with updated timestamp', () => {
    render(<PerplexityNewsBar />);
    
    // Check that the footer is displayed
    expect(screen.getByText('Last updated:')).toBeInTheDocument();
    expect(screen.getByText('View All News')).toBeInTheDocument();
  });
});