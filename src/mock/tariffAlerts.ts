import { TariffAlert, TariffChange, IndustryImpact } from '../types';

/**
 * Mock data for tariff alerts
 * Used for development and testing of the Tariff Alert Scanner
 */
export const mockTariffAlerts: TariffAlert[] = [
  {
    id: 'ta-001',
    title: 'Singapore Increases Import Tariffs on Luxury Electronics',
    description: 'Singapore has announced a 5% increase in import tariffs on luxury electronics from non-ASEAN countries, affecting high-end consumer electronics and specialized components. This change is part of a broader policy shift to protect local manufacturing.',
    priority: 'high',
    country: 'Singapore',
    impactSeverity: 7,
    confidence: 0.92,
    sourceUrl: 'https://www.channelnewsasia.com/business',
    sourceName: 'Channel News Asia',
    publishDate: new Date('2025-01-15'),
    createdAt: new Date('2025-01-15T08:30:00'),
    tariffRate: 15,
    productCategories: ['Electronics', 'Luxury Goods'],
    aiEnhanced: true
  },
  {
    id: 'ta-002',
    title: 'Vietnam Reduces Textile Export Tariffs to EU Markets',
    description: 'Vietnam has announced a reduction in export tariffs for textiles bound for EU markets, following the successful implementation of the EU-Vietnam Free Trade Agreement. This is expected to boost Vietnam\'s textile exports by up to 8% in the coming fiscal year.',
    priority: 'medium',
    country: 'Vietnam',
    impactSeverity: 5,
    confidence: 0.85,
    sourceUrl: 'https://vietnamnews.vn/economy',
    sourceName: 'Vietnam News',
    publishDate: new Date('2025-01-10'),
    createdAt: new Date('2025-01-10T14:15:00'),
    tariffRate: 3,
    productCategories: ['Textiles', 'Apparel'],
    aiEnhanced: false
  },
  {
    id: 'ta-003',
    title: 'Indonesia Implements New Tariffs on Agricultural Imports',
    description: 'Indonesia has implemented new tariffs on certain agricultural imports to protect local farmers. The tariffs, ranging from 10-25%, will affect rice, corn, and soybean imports and may significantly impact regional agricultural trade dynamics.',
    priority: 'Critical',
    country: 'Indonesia',
    impactSeverity: 9,
    confidence: 0.88,
    sourceUrl: 'https://www.thejakartapost.com/business',
    sourceName: 'The Jakarta Post',
    publishDate: new Date('2025-01-05'),
    createdAt: new Date('2025-01-05T10:45:00'),
    tariffRate: 25,
    productCategories: ['Agriculture', 'Food Products'],
    aiEnhanced: true
  },
  {
    id: 'ta-004',
    title: 'Malaysia Announces Temporary Suspension of Tariffs on Essential Medical Equipment',
    description: 'Malaysia has announced a temporary suspension of import tariffs on essential medical equipment and supplies for a period of 12 months. This measure aims to support the healthcare sector and ensure adequate supplies of critical equipment.',
    priority: 'medium',
    country: 'Malaysia',
    impactSeverity: 4,
    confidence: 0.79,
    sourceUrl: 'https://www.thestar.com.my/business',
    sourceName: 'The Star',
    publishDate: new Date('2025-01-03'),
    createdAt: new Date('2025-01-03T16:20:00'),
    tariffRate: 0,
    productCategories: ['Medical Equipment', 'Healthcare'],
    aiEnhanced: false
  },
  {
    id: 'ta-005',
    title: 'Thailand Revises Automotive Import Tariff Structure',
    description: 'Thailand has revised its automotive import tariff structure, increasing duties on fully-assembled luxury vehicles while reducing tariffs on auto parts to support local manufacturing. The changes will take effect starting March 2025.',
    priority: 'high',
    country: 'Thailand',
    impactSeverity: 8,
    confidence: 0.91,
    sourceUrl: 'https://www.bangkokpost.com/business',
    sourceName: 'Bangkok Post',
    publishDate: new Date('2024-12-28'),
    createdAt: new Date('2024-12-28T09:10:00'),
    tariffRate: 35,
    productCategories: ['Automotive', 'Luxury Goods'],
    aiEnhanced: true
  },
  {
    id: 'ta-006',
    title: 'Philippines Reduces Import Duties on Renewable Energy Equipment',
    description: 'The Philippines has reduced import duties on renewable energy equipment including solar panels, wind turbines, and related components. This policy change aims to accelerate the country\'s transition to renewable energy sources.',
    priority: 'low',
    country: 'Philippines',
    impactSeverity: 3,
    confidence: 0.76,
    sourceUrl: 'https://www.philstar.com/business',
    sourceName: 'The Philippine Star',
    publishDate: new Date('2024-12-20'),
    createdAt: new Date('2024-12-20T11:30:00'),
    tariffRate: 2,
    productCategories: ['Renewable Energy', 'Construction'],
    aiEnhanced: false
  },
  {
    id: 'ta-007',
    title: 'Singapore and Australia Finalize New Trade Agreement with Reduced Tariffs',
    description: 'Singapore and Australia have finalized a new trade agreement that will eliminate tariffs on 99% of goods traded between the two countries. The agreement will particularly benefit the financial services, technology, and agriculture sectors.',
    priority: 'medium',
    country: 'Singapore',
    impactSeverity: 6,
    confidence: 0.87,
    sourceUrl: 'https://www.straitstimes.com/business',
    sourceName: 'The Straits Times',
    publishDate: new Date('2024-12-15'),
    createdAt: new Date('2024-12-15T14:50:00'),
    tariffRate: 0,
    productCategories: ['Financial Services', 'Agriculture', 'Technology'],
    aiEnhanced: true
  },
  {
    id: 'ta-008',
    title: 'Malaysia Implements New Digital Services Tax Affecting Cross-Border Transactions',
    description: 'Malaysia has implemented a new 6% digital services tax affecting cross-border transactions. The tax applies to digital services including software, streaming, and online marketplaces, and may impact regional e-commerce dynamics.',
    priority: 'high',
    country: 'Malaysia',
    impactSeverity: 7,
    confidence: 0.84,
    sourceUrl: 'https://www.nst.com.my/business',
    sourceName: 'New Straits Times',
    publishDate: new Date('2024-12-10'),
    createdAt: new Date('2024-12-10T13:15:00'),
    tariffRate: 6,
    productCategories: ['Digital Services', 'E-commerce'],
    aiEnhanced: false
  },
  {
    id: 'ta-009',
    title: 'Vietnam Raises Export Duties on Rare Earth Minerals',
    description: 'Vietnam has announced a significant increase in export duties on rare earth minerals, from 20% to 35%. This move appears to be part of a strategy to develop domestic processing capabilities and capture more value from these strategic resources.',
    priority: 'Critical',
    country: 'Vietnam',
    impactSeverity: 9,
    confidence: 0.93,
    sourceUrl: 'https://e.vnexpress.net/news/business',
    sourceName: 'VnExpress',
    publishDate: new Date('2024-12-05'),
    createdAt: new Date('2024-12-05T08:45:00'),
    tariffRate: 35,
    productCategories: ['Mining', 'Raw Materials'],
    aiEnhanced: true
  },
  {
    id: 'ta-010',
    title: 'Indonesia Announces Gradual Reduction in Palm Oil Export Levies',
    description: 'Indonesia has announced a gradual reduction in palm oil export levies over the next 3 years. The plan aims to boost exports while ensuring domestic supply and may significantly impact global vegetable oil markets.',
    priority: 'medium',
    country: 'Indonesia',
    impactSeverity: 6,
    confidence: 0.81,
    sourceUrl: 'https://www.thejakartapost.com/business',
    sourceName: 'The Jakarta Post',
    publishDate: new Date('2024-12-01'),
    createdAt: new Date('2024-12-01T15:30:00'),
    tariffRate: 8,
    productCategories: ['Agriculture', 'Food Products'],
    aiEnhanced: false
  }
];

/**
 * Mock tariff changes to be used with the tariff impact simulator
 */
export const mockTariffChanges: TariffChange[] = [
  {
    id: 'tc-001',
    title: 'Singapore Luxury Electronics Tariff Increase',
    description: 'Increased import tariffs on luxury electronics by 5%',
    country: 'Singapore',
    rate: 15,
    effectiveDate: new Date('2025-02-01'),
    productCategories: ['Electronics', 'Luxury Goods'],
    policy: 'Protectionist',
    impactSeverity: 7,
    confidence: 0.92
  },
  {
    id: 'tc-002',
    title: 'Vietnam Textile Export Tariff Reduction',
    description: 'Reduced export tariffs for textiles bound for EU markets',
    country: 'Vietnam',
    rate: 3,
    effectiveDate: new Date('2025-01-15'),
    productCategories: ['Textiles', 'Apparel'],
    policy: 'Free Trade',
    impactSeverity: 5,
    confidence: 0.85
  },
  {
    id: 'tc-003',
    title: 'Indonesia Agricultural Import Tariffs',
    description: 'New tariffs on agricultural imports including rice, corn, and soybeans',
    country: 'Indonesia',
    rate: 25,
    effectiveDate: new Date('2025-02-15'),
    productCategories: ['Agriculture', 'Food Products'],
    policy: 'Protectionist',
    impactSeverity: 9,
    confidence: 0.88
  },
  {
    id: 'tc-004',
    title: 'Thailand Automotive Tariff Restructuring',
    description: 'Revised automotive import tariff structure with increased duties on luxury vehicles',
    country: 'Thailand',
    rate: 35,
    effectiveDate: new Date('2025-03-01'),
    productCategories: ['Automotive', 'Luxury Goods'],
    policy: 'Mixed',
    impactSeverity: 8,
    confidence: 0.91
  },
  {
    id: 'tc-005',
    title: 'Vietnam Rare Earth Minerals Export Duty Increase',
    description: 'Significant increase in export duties on rare earth minerals',
    country: 'Vietnam',
    rate: 35,
    effectiveDate: new Date('2025-01-01'),
    productCategories: ['Mining', 'Raw Materials'],
    policy: 'Resource Nationalism',
    impactSeverity: 9,
    confidence: 0.93
  }
];

/**
 * Mock industry impacts to be used with the tariff impact simulator
 */
export const mockIndustryImpacts: IndustryImpact[] = [
  {
    id: 'ii-001',
    industry: 'Consumer Electronics',
    severity: 7,
    estimatedAnnualImpact: 120.5,
    description: 'Increased costs for high-end consumer electronics imported from Singapore will impact profit margins for retailers and distributors.',
    relatedTariffChangeId: 'tc-001',
    suggestedMitigations: [
      'Diversify supply chain to include more ASEAN-based manufacturers',
      'Consider local assembly options to reduce exposure to finished goods tariffs',
      'Adjust pricing strategy to account for increased costs'
    ]
  },
  {
    id: 'ii-002',
    industry: 'Apparel Manufacturing',
    severity: 5,
    estimatedAnnualImpact: 85.3,
    description: 'Reduced tariffs on Vietnamese textile exports to the EU present an opportunity for increased market share and revenue.',
    relatedTariffChangeId: 'tc-002',
    suggestedMitigations: [
      'Increase production capacity to meet potential demand growth',
      'Invest in quality control to meet EU standards',
      'Develop stronger logistics partnerships for EU market distribution'
    ]
  },
  {
    id: 'ii-003',
    industry: 'Food Processing',
    severity: 9,
    estimatedAnnualImpact: 210.7,
    description: 'High tariffs on agricultural imports to Indonesia will significantly increase raw material costs for food processors relying on imported ingredients.',
    relatedTariffChangeId: 'tc-003',
    suggestedMitigations: [
      'Source more ingredients from local Indonesian farmers',
      'Reformulate products to use less tariff-affected ingredients',
      'Consider establishing local production facilities in Indonesia'
    ]
  },
  {
    id: 'ii-004',
    industry: 'Luxury Automotive',
    severity: 8,
    estimatedAnnualImpact: 175.2,
    description: 'Increased duties on fully-assembled luxury vehicles in Thailand will reduce competitiveness for imported premium brands.',
    relatedTariffChangeId: 'tc-004',
    suggestedMitigations: [
      'Explore local assembly/manufacturing options in Thailand',
      'Increase focus on auto parts supply which faces lower tariffs',
      'Develop strategic partnerships with Thai automotive companies'
    ]
  },
  {
    id: 'ii-005',
    industry: 'High Technology Manufacturing',
    severity: 9,
    estimatedAnnualImpact: 265.8,
    description: 'Vietnam\'s increased export duties on rare earth minerals will disrupt supply chains for high-tech manufacturers globally.',
    relatedTariffChangeId: 'tc-005',
    suggestedMitigations: [
      'Diversify rare earth mineral sources beyond Vietnam',
      'Invest in recycling technologies to recover minerals from used products',
      'Develop long-term supply contracts with Vietnamese processors to mitigate volatility'
    ]
  }
];
