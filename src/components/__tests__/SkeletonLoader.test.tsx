import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SkeletonLoader from '../SkeletonLoader';

describe('SkeletonLoader', () => {
  test('renders text skeleton by default', () => {
    render(<SkeletonLoader />);
    
    // Check that a skeleton element is rendered
    const skeletonElement = screen.getByTestId('skeleton-loader');
    expect(skeletonElement).toBeInTheDocument();
    expect(skeletonElement).toHaveClass('animate-pulse');
  });

  test('renders the correct number of skeletons based on count prop', () => {
    render(<SkeletonLoader count={3} />);
    
    // Check that 3 skeleton elements are rendered
    const skeletonElements = screen.getAllByTestId('skeleton-loader');
    expect(skeletonElements).toHaveLength(3);
  });

  test('renders search type skeleton correctly', () => {
    render(<SkeletonLoader type="search" />);
    
    // Check that search skeleton has specific elements
    const searchSkeletons = screen.getAllByTestId('skeleton-loader');
    expect(searchSkeletons[0]).toHaveClass('flex');
    
    // Search skeletons should have circular icon and text lines
    const circles = screen.getAllByTestId('skeleton-circle');
    expect(circles).toHaveLength(1);
    
    const lines = screen.getAllByTestId('skeleton-line');
    expect(lines.length).toBeGreaterThan(0);
  });

  test('renders news type skeleton correctly', () => {
    render(<SkeletonLoader type="news" />);
    
    // News skeletons should have headline and content
    const newsSkeletons = screen.getAllByTestId('skeleton-loader');
    expect(newsSkeletons[0]).toHaveClass('mb-4');
    
    // Should have title and summary lines
    const headlineLines = screen.getAllByTestId('skeleton-line');
    expect(headlineLines.length).toBeGreaterThan(2);
  });

  test('renders card type skeleton correctly', () => {
    render(<SkeletonLoader type="card" />);
    
    // Card skeletons should have specific shape
    const cardSkeletons = screen.getAllByTestId('skeleton-loader');
    expect(cardSkeletons[0]).toHaveClass('rounded-lg');
    
    // Should have header and content sections
    const headerLine = screen.getByTestId('skeleton-header');
    expect(headerLine).toBeInTheDocument();
  });

  test('applies custom width and height correctly', () => {
    render(<SkeletonLoader width="200px" height="100px" />);
    
    // Check that custom dimensions are applied
    const skeletonElement = screen.getByTestId('skeleton-loader');
    expect(skeletonElement).toHaveStyle({
      width: '200px',
      height: '100px'
    });
  });

  test('applies custom className correctly', () => {
    render(<SkeletonLoader className="custom-class" />);
    
    // Check that custom class is applied
    const skeletonElement = screen.getByTestId('skeleton-loader');
    expect(skeletonElement).toHaveClass('custom-class');
  });
});