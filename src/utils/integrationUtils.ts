/**
 * Integration Utilities
 * 
 * This module provides tools and utilities for integrating different components
 * of the FinSight application, particularly focusing on data transformation and
 * compatibility between the Monte Carlo simulation, Vietnam data sources, and 
 * visualization components.
 */

import { SankeyData, SankeyNode, SankeyLink } from '../types';

/**
 * Standardizes SankeyData format for use with the enhanced AnimatedSankeyChart component.
 * Ensures compatibility with the updated D3-based chart.
 */
export function standardizeSankeyFormat(data: SankeyData): SankeyData {
  if (!data) return { nodes: [], links: [] };
  
  // Create a safe copy with all required properties
  const safeData: SankeyData = {
    nodes: data.nodes?.map((node, index) => ({
      ...node,
      id: node.id || `node-${index}`,
      name: node.name || `Node ${index}`,
      group: node.group || node.category || 'default',
      category: node.category || node.group || 'default',
      value: node.value || 10
    })) || [],
    
    links: data.links?.map((link, index) => {
      // Handle various source/target formats
      let sourceIndex: number;
      let targetIndex: number;
      
      // Source can be number, object with index, or object with name
      if (typeof link.source === 'number') {
        sourceIndex = link.source;
      } else if (typeof link.source === 'object' && link.source !== null) {
        if ('index' in link.source) {
          sourceIndex = (link.source as any).index;
        } else if ('name' in link.source) {
          // Find node by name
          const nodeIndex = data.nodes?.findIndex(n => n.name === (link.source as any).name);
          sourceIndex = nodeIndex !== -1 ? nodeIndex : 0;
        } else {
          sourceIndex = 0;
        }
      } else {
        sourceIndex = 0;
      }
      
      // Target can be number, object with index, or object with name
      if (typeof link.target === 'number') {
        targetIndex = link.target;
      } else if (typeof link.target === 'object' && link.target !== null) {
        if ('index' in link.target) {
          targetIndex = (link.target as any).index;
        } else if ('name' in link.target) {
          // Find node by name
          const nodeIndex = data.nodes?.findIndex(n => n.name === (link.target as any).name);
          targetIndex = nodeIndex !== -1 ? nodeIndex : 0;
        } else {
          targetIndex = 0;
        }
      } else {
        targetIndex = 0;
      }
      
      // Make sure indices are valid
      const maxIndex = (data.nodes?.length || 1) - 1;
      sourceIndex = Math.min(Math.max(0, sourceIndex), maxIndex);
      targetIndex = Math.min(Math.max(0, targetIndex), maxIndex);
      
      // Ensure target is not the same as source
      if (targetIndex === sourceIndex && maxIndex > 0) {
        targetIndex = (sourceIndex + 1) % (maxIndex + 1);
      }
      
      return {
        ...link,
        source: sourceIndex,
        target: targetIndex,
        value: link.value || 0,
        uid: `${sourceIndex}-${targetIndex}-${index}`
      };
    }) || [],
    
    aiInsights: data.aiInsights ? {
      summary: data.aiInsights.summary || 'No insights available',
      recommendations: data.aiInsights.recommendations || [],
      confidence: data.aiInsights.confidence || 0.5,
      updatedAt: data.aiInsights.updatedAt || new Date()
    } : undefined
  };
  
  // Add default links if none exist
  if (safeData.nodes.length > 1 && safeData.links.length === 0) {
    for (let i = 0; i < safeData.nodes.length - 1; i++) {
      safeData.links.push({
        source: i,
        target: i + 1,
        value: 10,
        uid: `default-link-${i}`
      });
    }
  }
  
  // Add basic AI insights if not provided
  if (!safeData.aiInsights && safeData.nodes.length > 0) {
    safeData.aiInsights = {
      summary: 'No AI insights available yet.',
      recommendations: [],
      confidence: 0.5,
      updatedAt: new Date()
    };
  }
  
  return safeData;
}

/**
 * Creates a properties object for the enhanced AnimatedSankeyChart component
 * based on standard SankeyData and additional optional parameters.
 */
export function createEnhancedSankeyProps(
  data: SankeyData,
  width: number = 800,
  height: number = 500,
  options: {
    title?: string;
    subtitle?: string;
    showControls?: boolean;
    showInsights?: boolean;
    onNodeClick?: (node: SankeyNode) => void;
    onLinkClick?: (link: SankeyLink) => void;
    colorScheme?: string[];
    margin?: { top: number; right: number; bottom: number; left: number };
  } = {}
) {
  // Create standardized data
  const standardizedData = standardizeSankeyFormat(data);
  
  // Default margin
  const defaultMargin = { top: 20, right: 20, bottom: 20, left: 20 };
  
  // Default color scheme based on Horizon colors
  const defaultColorScheme = [
    'rgb(13, 106, 168)', // blue
    'rgb(0, 112, 122)', // teal
    'rgb(43, 83, 0)', // green
    'rgb(88, 64, 148)', // purple
    'rgb(195, 0, 51)', // red
    'rgb(74, 84, 86)', // neutralGray
    'rgb(15, 40, 109)', // scbBlue
    'rgb(76, 165, 133)', // scbGreen
    'rgb(42, 120, 188)', // scbLightBlue
  ];
  
  // Return configured props
  return {
    data: standardizedData,
    width,
    height,
    margin: options.margin || defaultMargin,
    title: options.title,
    subtitle: options.subtitle,
    showControls: options.showControls !== undefined ? options.showControls : true,
    showInsights: options.showInsights !== undefined ? options.showInsights : true,
    onNodeClick: options.onNodeClick,
    onLinkClick: options.onLinkClick,
    colorScheme: options.colorScheme || defaultColorScheme,
    animationDuration: 1000,
    preAnimationDelay: 500,
    isHighlightModeEnabled: false
  };
}