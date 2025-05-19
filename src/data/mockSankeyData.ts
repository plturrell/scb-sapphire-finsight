import { SankeyData } from '../types';

// Mock initial data for Sankey visualization
export const initialSankeyData: SankeyData = {
  nodes: [
    { name: 'Operating Revenue', group: 'income', value: 1000 },
    { name: 'Investment Income', group: 'income', value: 450 },
    { name: 'Fees & Commissions', group: 'income', value: 350 },
    { name: 'Interest Income', group: 'income', value: 650 },
    
    { name: 'Operating Expenses', group: 'expense', value: 700 },
    { name: 'Administrative', group: 'expense', value: 350 },
    { name: 'Salaries', group: 'expense', value: 450 },
    { name: 'Marketing', group: 'expense', value: 180 },
    
    { name: 'Net Income', group: 'equity', value: 770 },
    { name: 'Retained Earnings', group: 'equity', value: 620 },
    { name: 'Dividends', group: 'equity', value: 150 },
    
    { name: 'Fixed Assets', group: 'asset', value: 500 },
    { name: 'Current Assets', group: 'asset', value: 800 },
    { name: 'Liquid Assets', group: 'asset', value: 550 },
    
    { name: 'Long-term Debt', group: 'liability', value: 350 },
    { name: 'Short-term Liabilities', group: 'liability', value: 250 }
  ],
  links: [
    // Revenue flows
    { source: 0, target: 8, value: 300 },
    { source: 1, target: 8, value: 250 },
    { source: 2, target: 8, value: 100 },
    { source: 3, target: 8, value: 120 },
    
    // Expense flows
    { source: 0, target: 4, value: 350 },
    { source: 0, target: 5, value: 150 },
    { source: 0, target: 6, value: 150 },
    { source: 0, target: 7, value: 50 },
    
    // Net income allocation
    { source: 8, target: 9, value: 620 },
    { source: 8, target: 10, value: 150 },
    
    // Asset flows
    { source: 9, target: 11, value: 150 },
    { source: 9, target: 12, value: 320 },
    { source: 9, target: 13, value: 150 },
    
    // Liability flows
    { source: 12, target: 14, value: 180 },
    { source: 12, target: 15, value: 120 },
    
    // Additional connections
    { source: 1, target: 13, value: 200 },
    { source: 2, target: 7, value: 130 },
    { source: 3, target: 12, value: 230 },
    { source: 3, target: 14, value: 170 },
    { source: 3, target: 6, value: 130 }
  ],
  aiInsights: {
    summary: "Financial flow analysis shows healthy revenue streams with appropriate expense allocation. Net income represents 31% of total inflows.",
    recommendations: [
      "Consider increasing allocation to Fixed Assets for long-term growth",
      "Opportunity to reduce Administrative expenses by 8-12%",
      "Evaluate relationship between Interest Income and Long-term Debt"
    ],
    confidence: 0.85,
    updatedAt: new Date()
  }
};

// Sample forecast scenarion data
export const forecastScenarioData: SankeyData = {
  nodes: [
    { name: 'Operating Revenue', group: 'income', value: 1050, predictedValue: 1100, confidence: 0.88 },
    { name: 'Investment Income', group: 'income', value: 480, predictedValue: 520, confidence: 0.82 },
    { name: 'Fees & Commissions', group: 'income', value: 380, predictedValue: 400, confidence: 0.91 },
    { name: 'Interest Income', group: 'income', value: 680, predictedValue: 700, confidence: 0.87 },
    
    { name: 'Operating Expenses', group: 'expense', value: 690, predictedValue: 685, confidence: 0.89 },
    { name: 'Administrative', group: 'expense', value: 320, predictedValue: 310, confidence: 0.88 },
    { name: 'Salaries', group: 'expense', value: 470, predictedValue: 480, confidence: 0.93 },
    { name: 'Marketing', group: 'expense', value: 210, predictedValue: 230, confidence: 0.81 },
    
    { name: 'Net Income', group: 'equity', value: 900, predictedValue: 1015, confidence: 0.86 },
    { name: 'Retained Earnings', group: 'equity', value: 720, predictedValue: 780, confidence: 0.89 },
    { name: 'Dividends', group: 'equity', value: 180, predictedValue: 195, confidence: 0.90 },
    
    { name: 'Fixed Assets', group: 'asset', value: 580, predictedValue: 620, confidence: 0.84 },
    { name: 'Current Assets', group: 'asset', value: 850, predictedValue: 890, confidence: 0.91 },
    { name: 'Liquid Assets', group: 'asset', value: 620, predictedValue: 650, confidence: 0.88 },
    
    { name: 'Long-term Debt', group: 'liability', value: 320, predictedValue: 300, confidence: 0.87 },
    { name: 'Short-term Liabilities', group: 'liability', value: 230, predictedValue: 215, confidence: 0.86 }
  ],
  links: [
    // Revenue flows with some AI enhanced
    { source: 0, target: 8, value: 340, aiEnhanced: true, originalValue: 300 },
    { source: 1, target: 8, value: 280, aiEnhanced: true, originalValue: 250 },
    { source: 2, target: 8, value: 120, aiEnhanced: true, originalValue: 100 },
    { source: 3, target: 8, value: 160, aiEnhanced: true, originalValue: 120 },
    
    // Expense flows
    { source: 0, target: 4, value: 330, aiEnhanced: true, originalValue: 350 },
    { source: 0, target: 5, value: 130, aiEnhanced: true, originalValue: 150 },
    { source: 0, target: 6, value: 160, aiEnhanced: false, originalValue: 150 },
    { source: 0, target: 7, value: 90, aiEnhanced: true, originalValue: 50 },
    
    // Net income allocation
    { source: 8, target: 9, value: 720, aiEnhanced: true, originalValue: 620 },
    { source: 8, target: 10, value: 180, aiEnhanced: true, originalValue: 150 },
    
    // Asset flows
    { source: 9, target: 11, value: 210, aiEnhanced: true, originalValue: 150 },
    { source: 9, target: 12, value: 350, aiEnhanced: true, originalValue: 320 },
    { source: 9, target: 13, value: 160, aiEnhanced: false, originalValue: 150 },
    
    // Liability flows
    { source: 12, target: 14, value: 160, aiEnhanced: true, originalValue: 180 },
    { source: 12, target: 15, value: 110, aiEnhanced: true, originalValue: 120 },
    
    // Additional connections
    { source: 1, target: 13, value: 200, aiEnhanced: false, originalValue: 200 },
    { source: 2, target: 7, value: 120, aiEnhanced: true, originalValue: 130 },
    { source: 3, target: 12, value: 240, aiEnhanced: false, originalValue: 230 },
    { source: 3, target: 14, value: 160, aiEnhanced: true, originalValue: 170 },
    { source: 3, target: 6, value: 120, aiEnhanced: true, originalValue: 130 }
  ],
  aiInsights: {
    summary: "Monte Carlo simulation predicts a 17% increase in Net Income over the next 12 months with moderate confidence.",
    recommendations: [
      "Increase marketing budget allocation by 40-60% for optimal ROI",
      "Reduce administrative expenses by 10-15% through process automation",
      "Maintain current dividend payout ratio while increasing retained earnings"
    ],
    confidence: 0.86,
    updatedAt: new Date()
  }
};
