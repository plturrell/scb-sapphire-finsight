import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import PerplexitySearchBar from '../PerplexitySearchBar';
import { searchWithPerplexity, searchCompanies, getFinancialInsights } from '@/lib/perplexity-api';
import perplexityAnalytics from '@/services/PerplexityAnalytics';

// Mock the modules
jest.mock('@/lib/perplexity-api', () => ({
  searchWithPerplexity: jest.fn(),
  searchCompanies: jest.fn(),
  getFinancialInsights: jest.fn()
}));

jest.mock('@/services/PerplexityAnalytics', () => ({
  trackSearch: jest.fn(),
  trackSearchCompleted: jest.fn(),
  trackSearchError: jest.fn(),
  trackResultSelected: jest.fn(),
  trackFeedback: jest.fn(),
  trackEvent: jest.fn()
}));

// Mock useRouter
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}));

// Mock useCache hook
jest.mock('@/hooks', () => ({
  useCache: () => {
    // Return [data, loading, error, fetchFunc]
    return [null, false, null, jest.fn().mockResolvedValue({})]
  }
}));

describe('PerplexitySearchBar', () => {
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
  });

  test('renders search input correctly', () => {
    render(<PerplexitySearchBar />);
    expect(screen.getByPlaceholderText('Search companies, insights, news...')).toBeInTheDocument();
    expect(screen.getByText('Powered by Perplexity')).toBeInTheDocument();
  });

  test('handles search input change', async () => {
    render(<PerplexitySearchBar />);
    
    const searchInput = screen.getByPlaceholderText('Search companies, insights, news...');
    
    // Type in search query
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    
    // Check that analytics tracking was called
    await waitFor(() => {
      expect(perplexityAnalytics.trackSearch).toHaveBeenCalledWith('test query', { type: 'all' });
    });
  });

  test('displays loading state during search', async () => {
    // Mock API to take some time
    (searchWithPerplexity as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ summary: 'Test summary' }), 100))
    );
    
    render(<PerplexitySearchBar />);
    
    const searchInput = screen.getByPlaceholderText('Search companies, insights, news...');
    
    // Type in search query to trigger search
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    
    // Loading indicator should be visible
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  test('displays search results when API returns data', async () => {
    // Mock API responses
    (searchWithPerplexity as jest.Mock).mockResolvedValue({
      summary: 'Test summary',
      insights: ['Insight 1', 'Insight 2']
    });
    
    (searchCompanies as jest.Mock).mockResolvedValue([
      {
        companyId: 'test-1',
        companyCode: 'TST',
        companyName: 'Test Company',
        industry: 'Technology',
        country: 'USA',
        description: 'A test company'
      }
    ]);
    
    (getFinancialInsights as jest.Mock).mockResolvedValue({
      summary: 'Financial summary',
      insights: ['Financial insight 1', 'Financial insight 2']
    });
    
    render(<PerplexitySearchBar />);
    
    const searchInput = screen.getByPlaceholderText('Search companies, insights, news...');
    
    // Type in search query
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'test company' } });
      // Small delay to let debounce function execute
      await new Promise(resolve => setTimeout(resolve, 400));
    });
    
    // Wait for results to appear
    await waitFor(() => {
      expect(screen.getByText('AI-Powered Results')).toBeInTheDocument();
    });
    
    // Check if search results are displayed
    expect(screen.getByText('Test Company')).toBeInTheDocument();
    expect(screen.getByText('Technology • USA')).toBeInTheDocument();
    expect(screen.getByText('AI Summary')).toBeInTheDocument();
  });

  test('handles API error gracefully', async () => {
    // Mock APIs to throw errors
    (searchWithPerplexity as jest.Mock).mockRejectedValue(new Error('API error'));
    (searchCompanies as jest.Mock).mockRejectedValue(new Error('API error'));
    (getFinancialInsights as jest.Mock).mockRejectedValue(new Error('API error'));
    
    render(<PerplexitySearchBar />);
    
    const searchInput = screen.getByPlaceholderText('Search companies, insights, news...');
    
    // Type in search query
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'error test' } });
      // Small delay to let debounce function execute
      await new Promise(resolve => setTimeout(resolve, 400));
    });
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText('Search Error')).toBeInTheDocument();
    });
    
    // Check that analytics tracked the error
    expect(perplexityAnalytics.trackSearchError).toHaveBeenCalled();
  });

  test('allows selecting search results', async () => {
    // Mock API responses
    (searchWithPerplexity as jest.Mock).mockResolvedValue({
      summary: 'Test summary',
      insights: ['Insight 1']
    });
    
    // Mock callback
    const mockOnResultSelect = jest.fn();
    
    render(<PerplexitySearchBar onResultSelect={mockOnResultSelect} />);
    
    const searchInput = screen.getByPlaceholderText('Search companies, insights, news...');
    
    // Type in search query
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'test query' } });
      // Small delay to let debounce function execute
      await new Promise(resolve => setTimeout(resolve, 400));
    });
    
    // Wait for results and click on one
    await waitFor(() => {
      expect(screen.getByText('AI Summary')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('AI Summary'));
    
    // Check that result selection was tracked
    expect(perplexityAnalytics.trackResultSelected).toHaveBeenCalled();
  });

  test('allows switching search types', async () => {
    render(<PerplexitySearchBar />);
    
    // Find the select element and change its value
    const searchTypeSelect = screen.getByRole('combobox');
    
    // Change to 'companies' search type
    fireEvent.change(searchTypeSelect, { target: { value: 'companies' } });
    
    expect(searchTypeSelect).toHaveValue('companies');
    
    // Change to 'insights' search type
    fireEvent.change(searchTypeSelect, { target: { value: 'insights' } });
    
    expect(searchTypeSelect).toHaveValue('insights');
  });

  test('displays feedback buttons on search results', async () => {
    // Mock API responses
    (searchWithPerplexity as jest.Mock).mockResolvedValue({
      summary: 'Test summary',
      insights: ['Insight 1']
    });
    
    render(<PerplexitySearchBar />);
    
    const searchInput = screen.getByPlaceholderText('Search companies, insights, news...');
    
    // Type in search query
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'test query' } });
      // Small delay to let debounce function execute
      await new Promise(resolve => setTimeout(resolve, 400));
    });
    
    // Wait for results to appear
    await waitFor(() => {
      expect(screen.getByText('AI Summary')).toBeInTheDocument();
    });
    
    // Check for feedback buttons
    const thumbsUpButton = screen.getByTitle('Good result');
    expect(thumbsUpButton).toBeInTheDocument();
    
    const thumbsDownButton = screen.getByTitle('Not relevant');
    expect(thumbsDownButton).toBeInTheDocument();
    
    // Click on thumbs up
    fireEvent.click(thumbsUpButton);
    
    // Check that feedback was tracked
    expect(perplexityAnalytics.trackFeedback).toHaveBeenCalledWith('positive', expect.any(String));
  });
});