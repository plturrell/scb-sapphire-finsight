// Vietnam Tariff Data - Mocks specific to Vietnam for development/testing
import { TariffAlert } from '../types';
import { UUID, RiskLevel } from '../types/MonteCarloTypes';

/**
 * Mock Vietnam tariff alerts mimicking data from Vietstock Finance, Reuters and Bloomberg
 * Follows the SCB data structure with Vietnam-specific details
 */
export const mockVietnamTariffAlerts: TariffAlert[] = [
  {
    id: 'vn-alert-001',
    title: 'Vietnam Reduces Electronics Export Duties to Singapore by 3.5%',
    description: 'The Vietnamese Ministry of Finance announced a 3.5% reduction in export duties for electronic components to Singapore, effective next quarter. This policy aims to boost Vietnam\'s position in the regional electronics supply chain.',
    country: 'Vietnam',
    impactSeverity: 7,
    confidence: 0.95,
    sourceUrl: 'https://www.reuters.com/markets/asia/vietnam-cuts-electronics-export-duties-boost-regional-trade-2025-05-15/',
    sourceName: 'Reuters',
    publishDate: new Date('2025-05-15T08:30:00'),
    createdAt: new Date('2025-05-15T09:15:00'),
    priority: 'high',
    tariffRate: 3.5,
    productCategories: ['Electronics', 'Semiconductor Components'],
    aiEnhanced: true,
    affectedProvinces: ['Ho Chi Minh City', 'Hanoi', 'Hai Phong'],
    tradingPartners: ['Singapore', 'Malaysia']
  },
  {
    id: 'vn-alert-002',
    title: 'RCEP Implementation Accelerates Textile Tariff Reductions for Vietnam',
    description: 'Vietnam\'s participation in the Regional Comprehensive Economic Partnership (RCEP) will accelerate the reduction of textile tariffs by an additional 2.1% annually over the next three years, according to the Ministry of Industry and Trade.',
    country: 'Vietnam',
    impactSeverity: 6,
    confidence: 0.92,
    sourceUrl: 'https://www.bloomberg.com/news/articles/2025-05-10/vietnam-textile-exports-to-benefit-from-accelerated-rcep-tariff-cuts',
    sourceName: 'Bloomberg',
    publishDate: new Date('2025-05-10T14:45:00'),
    createdAt: new Date('2025-05-10T15:30:00'),
    priority: 'medium',
    tariffRate: 2.1,
    productCategories: ['Textiles', 'Apparel'],
    aiEnhanced: true,
    affectedProvinces: ['Ho Chi Minh City', 'Da Nang', 'Binh Duong'],
    tradingPartners: ['Japan', 'South Korea', 'Australia']
  },
  {
    id: 'vn-alert-003',
    title: 'Vietnam Implements New Agricultural Import Safeguards',
    description: 'Vietnam\'s government has implemented new safeguard measures for rice and agricultural imports, increasing duties by 5.8% on specific categories following surges in imports from Thailand and India.',
    country: 'Vietnam',
    impactSeverity: 8,
    confidence: 0.89,
    sourceUrl: 'https://www.vietstock.vn/2025/05/vietnam-agriculture-import-duties-3008-458921.htm',
    sourceName: 'VietstockFinance',
    publishDate: new Date('2025-05-08T10:15:00'),
    createdAt: new Date('2025-05-08T11:00:00'),
    priority: 'high',
    tariffRate: 5.8,
    productCategories: ['Agriculture', 'Rice', 'Grains'],
    aiEnhanced: true,
    affectedProvinces: ['Can Tho', 'An Giang', 'Dong Thap'],
    tradingPartners: ['Thailand', 'India']
  },
  {
    id: 'vn-alert-004',
    title: 'Vietnam-EU FTA Update: Machinery Import Tariffs to Decrease by 4.2%',
    description: 'Under the EU-Vietnam Free Trade Agreement, import tariffs on European machinery and equipment will see a 4.2% reduction starting next month, benefiting Vietnam\'s manufacturing sector.',
    country: 'Vietnam',
    impactSeverity: 7,
    confidence: 0.94,
    sourceUrl: 'https://ec.europa.eu/trade/policy/countries-and-regions/countries/vietnam/',
    sourceName: 'European Commission',
    publishDate: new Date('2025-05-05T09:00:00'),
    createdAt: new Date('2025-05-05T10:30:00'),
    priority: 'medium',
    tariffRate: 4.2,
    productCategories: ['Machinery', 'Industrial Equipment', 'Manufacturing'],
    aiEnhanced: true,
    affectedProvinces: ['Hai Phong', 'Ba Ria-Vung Tau', 'Binh Duong'],
    tradingPartners: ['EU', 'Germany', 'France', 'Italy']
  },
  {
    id: 'vn-alert-005',
    title: 'Vietnam Increases Luxury Import Duties on Non-Essential Goods',
    description: 'The Ministry of Finance has announced an 8.5% increase in import duties on luxury consumer goods including imported automobiles, cosmetics, and premium alcoholic beverages.',
    country: 'Vietnam',
    impactSeverity: 6,
    confidence: 0.88,
    sourceUrl: 'https://vietnamnews.vn/economy/2025/05/increased-duties-on-luxury-imports',
    sourceName: 'Vietnam News',
    publishDate: new Date('2025-05-02T15:30:00'),
    createdAt: new Date('2025-05-02T16:15:00'),
    priority: 'medium',
    tariffRate: 8.5,
    productCategories: ['Luxury Goods', 'Automobiles', 'Cosmetics', 'Beverages'],
    aiEnhanced: false,
    affectedProvinces: ['Ho Chi Minh City', 'Hanoi', 'Da Nang'],
    tradingPartners: ['EU', 'USA', 'Japan', 'South Korea']
  }
];

/**
 * Vietnam geospatial data for provincial tariff impact visualization
 */
export const vietnamProvinceData = {
  provinces: [
    { id: 'hanoi', name: 'Hanoi', netImpact: +5.2, exportVolume: 120, importVolume: 85 },
    { id: 'hochiminh', name: 'Ho Chi Minh City', netImpact: +7.8, exportVolume: 180, importVolume: 145 },
    { id: 'danang', name: 'Da Nang', netImpact: +3.2, exportVolume: 45, importVolume: 30 },
    { id: 'haiphong', name: 'Hai Phong', netImpact: +6.5, exportVolume: 110, importVolume: 95 },
    { id: 'cantho', name: 'Can Tho', netImpact: +2.1, exportVolume: 25, importVolume: 15 },
    { id: 'binhduong', name: 'Binh Duong', netImpact: +4.5, exportVolume: 95, importVolume: 75 },
    { id: 'dongna', name: 'Dong Nai', netImpact: +3.8, exportVolume: 85, importVolume: 70 },
    { id: 'vungtau', name: 'Ba Ria-Vung Tau', netImpact: +5.5, exportVolume: 65, importVolume: 40 },
    { id: 'khanhhoa', name: 'Khanh Hoa', netImpact: +1.5, exportVolume: 35, importVolume: 25 },
    { id: 'angiang', name: 'An Giang', netImpact: -0.5, exportVolume: 15, importVolume: 10 }
  ]
};

/**
 * Vietnam trade corridors data for connection visualization
 */
export const vietnamTradeCorridors = [
  { from: 'vietnam', to: 'singapore', volume: 25, tariffImpact: -2.5 },
  { from: 'vietnam', to: 'thailand', volume: 18, tariffImpact: +1.2 },
  { from: 'vietnam', to: 'china', volume: 45, tariffImpact: +3.5 },
  { from: 'vietnam', to: 'usa', volume: 50, tariffImpact: -0.5 },
  { from: 'vietnam', to: 'japan', volume: 35, tariffImpact: -1.5 },
  { from: 'vietnam', to: 'southkorea', volume: 30, tariffImpact: -1.0 },
  { from: 'vietnam', to: 'eu', volume: 40, tariffImpact: -4.2 },
  { from: 'vietnam', to: 'malaysia', volume: 15, tariffImpact: -2.0 }
];

/**
 * Vietnam trade sectors for category-specific analysis
 */
export const vietnamTradeSectors = [
  { 
    name: 'Electronics', 
    exportVolume: 85.2, 
    importVolume: 65.4, 
    tariffTrend: 'decreasing',
    partners: ['Singapore', 'Japan', 'South Korea', 'USA'],
    keyProducts: ['Smartphones', 'Computer Components', 'Integrated Circuits']
  },
  { 
    name: 'Textiles', 
    exportVolume: 62.7, 
    importVolume: 34.8, 
    tariffTrend: 'decreasing',
    partners: ['USA', 'EU', 'Japan', 'South Korea'],
    keyProducts: ['Apparel', 'Fabrics', 'Footwear']
  },
  { 
    name: 'Agriculture', 
    exportVolume: 45.3, 
    importVolume: 28.9, 
    tariffTrend: 'mixed',
    partners: ['China', 'USA', 'Japan', 'ASEAN'],
    keyProducts: ['Rice', 'Coffee', 'Seafood', 'Fruits']
  },
  { 
    name: 'Manufacturing', 
    exportVolume: 58.6, 
    importVolume: 72.3, 
    tariffTrend: 'decreasing',
    partners: ['China', 'South Korea', 'Japan', 'EU'],
    keyProducts: ['Machinery', 'Steel Products', 'Auto Parts']
  },
  { 
    name: 'Energy', 
    exportVolume: 32.1, 
    importVolume: 55.7, 
    tariffTrend: 'stable',
    partners: ['OPEC', 'Russia', 'Australia', 'USA'],
    keyProducts: ['Crude Oil', 'Coal', 'Refined Petroleum']
  }
];

/**
 * Mock simulation results for Vietnam tariff impact
 */
export const mockVietnamSimulationResults = {
  simulationId: `vietnam-sim-${Date.now()}`,
  countrySpecific: {
    vietnam: {
      impactSummary: 'Vietnam projected to experience 7.2% increase in electronics exports under current tariff regime',
      keyFindings: [
        'Textile exports to show resilience with 5.3% projected growth',
        'Electronics tariff reduction agreement with Singapore most impactful policy',
        'Hai Phong port improvements reduce effective tariff impact by 2.1%'
      ],
      riskAssessment: {
        highRiskCategories: ['Agriculture'],
        lowRiskCategories: ['Electronics', 'Manufacturing'],
        recommendedMitigations: [
          'Diversify agricultural export markets beyond China',
          'Accelerate RCEP implementation for electronics components',
          'Develop contingency supply chains through Cambodia'
        ]
      }
    }
  },
  regionalImpact: {
    asean: {
      vietnam: { netTariffImpact: +3.2, confidence: 0.92 },
      thailand: { netTariffImpact: -1.7, confidence: 0.87 },
      singapore: { netTariffImpact: +2.1, confidence: 0.91 },
      malaysia: { netTariffImpact: -0.5, confidence: 0.85 }
    }
  },
  simulationMetrics: {
    convergenceAchieved: true,
    iterationsRequired: 3756,
    confidenceInterval: [2.1, 4.3],
    sensitivityFactors: [
      { factor: 'USD/VND Exchange Rate', sensitivity: 0.83 },
      { factor: 'China-US Relations', sensitivity: 0.76 },
      { factor: 'RCEP Implementation Speed', sensitivity: 0.68 }
    ]
  }
};

/**
 * Vietnam Sankey diagram data for tariff flow visualization
 */
/**
 * AI-enhanced Vietnam tariff impact predictions with confidence levels
 * Following SAP Fiori Generative AI principles for data representation
 */
export const vietnamAiPredictions = {
  confidenceLevel: 0.92, // Overall model confidence
  lastUpdated: new Date('2025-05-18T14:30:00'),
  insightSources: ['Bloomberg Intelligence', 'Reuters Analytics', 'SCB Financial Research'],
  predictions: [
    {
      category: 'Electronics',
      currentTariff: 3.5,
      predictedTariff: 2.8,
      confidence: 0.95,
      timeframe: 'Q3 2025',
      impactLevel: 'medium',
      tradeVolumeTrend: 'increasing',
      recommendation: 'Consider accelerating electronics imports before tariff reduction for competitive advantage'
    },
    {
      category: 'Textiles',
      currentTariff: 7.2,
      predictedTariff: 5.1,
      confidence: 0.89,
      timeframe: 'Q4 2025',
      impactLevel: 'high',
      tradeVolumeTrend: 'stable',
      recommendation: 'Negotiate longer-term contracts with suppliers to lock in tariff rates'
    },
    {
      category: 'Agriculture',
      currentTariff: 5.8,
      predictedTariff: 6.4,
      confidence: 0.87,
      timeframe: 'Q2 2025',
      impactLevel: 'high',
      tradeVolumeTrend: 'decreasing',
      recommendation: 'Diversify agricultural suppliers beyond current trading partners'
    },
    {
      category: 'Machinery',
      currentTariff: 4.2,
      predictedTariff: 3.0,
      confidence: 0.92,
      timeframe: 'Q3 2025',
      impactLevel: 'medium',
      tradeVolumeTrend: 'increasing',
      recommendation: 'Increase EU machinery imports to leverage preferential tariffs'
    },
    {
      category: 'Luxury Goods',
      currentTariff: 8.5,
      predictedTariff: 10.2,
      confidence: 0.91,
      timeframe: 'Q3 2025',
      impactLevel: 'low',
      tradeVolumeTrend: 'stable',
      recommendation: 'Adjust premium pricing strategy to account for tariff increase'
    }
  ],
  riskAssessment: {
    overall: 'medium' as RiskLevel,
    sectors: [
      { name: 'Electronics', risk: 'low' as RiskLevel, rationale: 'Decreasing tariffs and strong demand' },
      { name: 'Textiles', risk: 'medium' as RiskLevel, rationale: 'Competitive pressure despite tariff reduction' },
      { name: 'Agriculture', risk: 'high' as RiskLevel, rationale: 'Increasing tariffs and supply chain disruptions' },
      { name: 'Machinery', risk: 'low' as RiskLevel, rationale: 'EU FTA benefits materializing' },
      { name: 'Luxury Goods', risk: 'medium' as RiskLevel, rationale: 'Higher tariffs offset by inelastic demand' }
    ],
    mitigationStrategies: [
      'Diversify supply chain across ASEAN countries',
      'Leverage preferential RCEP tariff provisions',
      'Restructure product classification to optimize tariff position',
      'Increase domestic sourcing for high-tariff categories'
    ]
  }
};

/**
 * Historical tariff trend data for Vietnam (quarterly from 2023-2025)
 * For trend analysis and visualization
 */
export const vietnamTariffTrends = {
  timeframeStart: new Date('2023-01-01'),
  timeframeEnd: new Date('2025-05-01'),
  categories: [
    {
      name: 'Electronics',
      rates: [
        { date: '2023-Q1', rate: 5.2 },
        { date: '2023-Q2', rate: 5.0 },
        { date: '2023-Q3', rate: 4.8 },
        { date: '2023-Q4', rate: 4.5 },
        { date: '2024-Q1', rate: 4.2 },
        { date: '2024-Q2', rate: 4.0 },
        { date: '2024-Q3', rate: 3.8 },
        { date: '2024-Q4', rate: 3.6 },
        { date: '2025-Q1', rate: 3.5 },
        { date: '2025-Q2', rate: 3.5 }
      ]
    },
    {
      name: 'Textiles',
      rates: [
        { date: '2023-Q1', rate: 9.5 },
        { date: '2023-Q2', rate: 9.3 },
        { date: '2023-Q3', rate: 9.0 },
        { date: '2023-Q4', rate: 8.7 },
        { date: '2024-Q1', rate: 8.5 },
        { date: '2024-Q2', rate: 8.0 },
        { date: '2024-Q3', rate: 7.8 },
        { date: '2024-Q4', rate: 7.5 },
        { date: '2025-Q1', rate: 7.2 },
        { date: '2025-Q2', rate: 7.2 }
      ]
    },
    {
      name: 'Agriculture',
      rates: [
        { date: '2023-Q1', rate: 5.0 },
        { date: '2023-Q2', rate: 5.0 },
        { date: '2023-Q3', rate: 5.2 },
        { date: '2023-Q4', rate: 5.3 },
        { date: '2024-Q1', rate: 5.5 },
        { date: '2024-Q2', rate: 5.5 },
        { date: '2024-Q3', rate: 5.6 },
        { date: '2024-Q4', rate: 5.7 },
        { date: '2025-Q1', rate: 5.8 },
        { date: '2025-Q2', rate: 5.8 }
      ]
    },
    {
      name: 'Machinery',
      rates: [
        { date: '2023-Q1', rate: 6.5 },
        { date: '2023-Q2', rate: 6.3 },
        { date: '2023-Q3', rate: 6.0 },
        { date: '2023-Q4', rate: 5.8 },
        { date: '2024-Q1', rate: 5.5 },
        { date: '2024-Q2', rate: 5.0 },
        { date: '2024-Q3', rate: 4.8 },
        { date: '2024-Q4', rate: 4.5 },
        { date: '2025-Q1', rate: 4.2 },
        { date: '2025-Q2', rate: 4.2 }
      ]
    },
    {
      name: 'Luxury Goods',
      rates: [
        { date: '2023-Q1', rate: 7.0 },
        { date: '2023-Q2', rate: 7.2 },
        { date: '2023-Q3', rate: 7.5 },
        { date: '2023-Q4', rate: 7.8 },
        { date: '2024-Q1', rate: 8.0 },
        { date: '2024-Q2', rate: 8.2 },
        { date: '2024-Q3', rate: 8.3 },
        { date: '2024-Q4', rate: 8.4 },
        { date: '2025-Q1', rate: 8.5 },
        { date: '2025-Q2', rate: 8.5 }
      ]
    }
  ]
};

/**
 * Vietnam trade partner correlation matrix
 * For visualizing trade relationship dynamics
 */
export const vietnamTradeCorrelations = {
  partners: ['Singapore', 'China', 'Japan', 'USA', 'EU', 'Thailand', 'South Korea', 'Malaysia'],
  correlationMatrix: [
    // Singapore, China, Japan, USA, EU, Thailand, South Korea, Malaysia
    [1.00, 0.35, 0.62, 0.58, 0.45, 0.32, 0.67, 0.72], // Singapore
    [0.35, 1.00, 0.55, 0.25, 0.32, 0.65, 0.42, 0.38], // China
    [0.62, 0.55, 1.00, 0.48, 0.52, 0.35, 0.78, 0.45], // Japan
    [0.58, 0.25, 0.48, 1.00, 0.68, 0.22, 0.52, 0.35], // USA
    [0.45, 0.32, 0.52, 0.68, 1.00, 0.28, 0.48, 0.32], // EU
    [0.32, 0.65, 0.35, 0.22, 0.28, 1.00, 0.30, 0.52], // Thailand
    [0.67, 0.42, 0.78, 0.52, 0.48, 0.30, 1.00, 0.55], // South Korea
    [0.72, 0.38, 0.45, 0.35, 0.32, 0.52, 0.55, 1.00]  // Malaysia
  ],
  influences: [
    { partner: 'Singapore', influence: 0.72, mainProduct: 'Electronics' },
    { partner: 'China', influence: 0.85, mainProduct: 'Manufacturing' },
    { partner: 'Japan', influence: 0.68, mainProduct: 'Machinery' },
    { partner: 'USA', influence: 0.75, mainProduct: 'Textiles' },
    { partner: 'EU', influence: 0.62, mainProduct: 'Machinery' },
    { partner: 'Thailand', influence: 0.55, mainProduct: 'Agriculture' },
    { partner: 'South Korea', influence: 0.65, mainProduct: 'Electronics' },
    { partner: 'Malaysia', influence: 0.53, mainProduct: 'Electronics' }
  ]
};

export const vietnamSankeyData = {
  nodes: [
    // Vietnam as central node
    { id: 'vietnam', name: 'Vietnam', group: 'country' },
    
    // ASEAN partner countries
    { id: 'singapore', name: 'Singapore', group: 'country' },
    { id: 'thailand', name: 'Thailand', group: 'country' },
    { id: 'malaysia', name: 'Malaysia', group: 'country' },
    
    // Product categories
    { id: 'electronics', name: 'Electronics', group: 'product' },
    { id: 'textiles', name: 'Textiles', group: 'product' },
    { id: 'agriculture', name: 'Agriculture', group: 'product' },
    
    // Tariff policies
    { id: 'rcep', name: 'RCEP Agreement', group: 'policy' },
    { id: 'vn-sg-fta', name: 'Vietnam-Singapore FTA', group: 'policy' },
    { id: 'asean-china', name: 'ASEAN-China FTA', group: 'policy' }
  ],
  links: [
    // Vietnam exports to countries
    { source: 'vietnam', target: 'singapore', value: 25, type: 'export', uiColor: '#008D83' },
    { source: 'vietnam', target: 'thailand', value: 18, type: 'export', uiColor: '#008D83' },
    { source: 'vietnam', target: 'malaysia', value: 15, type: 'export', uiColor: '#008D83' },
    
    // Imports to Vietnam
    { source: 'singapore', target: 'vietnam', value: 22, type: 'import', uiColor: '#0F5EA2' },
    { source: 'thailand', target: 'vietnam', value: 14, type: 'import', uiColor: '#0F5EA2' },
    { source: 'malaysia', target: 'vietnam', value: 12, type: 'import', uiColor: '#0F5EA2' },
    
    // Vietnam exports by product
    { source: 'vietnam', target: 'electronics', value: 30, type: 'product', uiColor: '#008D83' },
    { source: 'vietnam', target: 'textiles', value: 25, type: 'product', uiColor: '#008D83' },
    { source: 'vietnam', target: 'agriculture', value: 15, type: 'product', uiColor: '#008D83' },
    
    // Policy effects
    { source: 'rcep', target: 'electronics', value: 20, type: 'policy', uiColor: '#0F5EA2', aiEnhanced: true },
    { source: 'vn-sg-fta', target: 'textiles', value: 15, type: 'policy', uiColor: '#0F5EA2', aiEnhanced: true },
    { source: 'asean-china', target: 'agriculture', value: 10, type: 'policy', uiColor: '#0F5EA2' }
  ],
  aiInsights: {
    summary: "Vietnam's electronics exports show strong resilience to tariff fluctuations, while agricultural exports remain vulnerable to policy changes.",
    recommendations: [
      "Focus on electronics supply chain integration with Singapore",
      "Monitor Thailand's textile tariff policies as they present competitive challenges",
      "Prepare contingency for agricultural exports affected by China's seasonal tariff adjustments"
    ],
    confidence: 0.91,
    updatedAt: new Date()
  }
};

const vietnamTariffData = {
  mockVietnamTariffAlerts,
  vietnamProvinceData,
  vietnamTradeCorridors,
  vietnamTradeSectors,
  mockVietnamSimulationResults,
  vietnamSankeyData
};

export default vietnamTariffData;
