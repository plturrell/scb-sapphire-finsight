/**
 * Mock data for Vietnam Tariff Dashboard
 */

export const vietnamTariffData = [
  {
    id: 1,
    hsCode: '8471.30.10',
    description: 'Laptops weighing not more than 10kg',
    baseRate: '10%',
    mfnRate: '5%',
    preferentialRates: {
      ASEAN: '0%',
      CPTPP: '0%',
      EVFTA: '3%'
    },
    effectiveDate: '2023-01-01',
    expiryDate: '2025-12-31',
    status: 'Active',
    countryOfOrigin: 'Vietnam'
  },
  {
    id: 2,
    hsCode: '8517.12.00',
    description: 'Mobile phones and smartphones',
    baseRate: '12%',
    mfnRate: '7%',
    preferentialRates: {
      ASEAN: '0%',
      CPTPP: '0%',
      EVFTA: '2%'
    },
    effectiveDate: '2023-01-01',
    expiryDate: '2025-12-31',
    status: 'Active',
    countryOfOrigin: 'Vietnam'
  },
  {
    id: 3,
    hsCode: '8528.72.91',
    description: 'LCD televisions',
    baseRate: '15%',
    mfnRate: '10%',
    preferentialRates: {
      ASEAN: '0%',
      CPTPP: '3%',
      EVFTA: '5%'
    },
    effectiveDate: '2023-01-01',
    expiryDate: '2025-12-31',
    status: 'Active',
    countryOfOrigin: 'Vietnam'
  },
  {
    id: 4,
    hsCode: '6104.43.00',
    description: "Women's dresses of synthetic fibers",
    baseRate: '20%',
    mfnRate: '15%',
    preferentialRates: {
      ASEAN: '0%',
      CPTPP: '5%',
      EVFTA: '7%'
    },
    effectiveDate: '2023-01-01',
    expiryDate: '2025-12-31',
    status: 'Active',
    countryOfOrigin: 'Vietnam'
  },
  {
    id: 5,
    hsCode: '8703.23.51',
    description: 'Motor cars with engine capacity exceeding 1,500cc but not exceeding 2,500cc',
    baseRate: '70%',
    mfnRate: '55%',
    preferentialRates: {
      ASEAN: '30%',
      CPTPP: '40%',
      EVFTA: '45%'
    },
    effectiveDate: '2023-01-01',
    expiryDate: '2025-12-31',
    status: 'Active',
    countryOfOrigin: 'Vietnam'
  }
];

export const tariffCategories = [
  'Electronics',
  'Textiles',
  'Automotive',
  'Agricultural Products',
  'Machinery',
  'Chemicals',
  'Metals',
  'Plastics'
];

export const tradeAgreements = [
  {
    id: 'ASEAN',
    name: 'ASEAN Trade in Goods Agreement',
    yearEffective: 2010,
    memberCountries: ['Brunei', 'Cambodia', 'Indonesia', 'Laos', 'Malaysia', 'Myanmar', 'Philippines', 'Singapore', 'Thailand', 'Vietnam']
  },
  {
    id: 'CPTPP',
    name: 'Comprehensive and Progressive Agreement for Trans-Pacific Partnership',
    yearEffective: 2018,
    memberCountries: ['Australia', 'Brunei', 'Canada', 'Chile', 'Japan', 'Malaysia', 'Mexico', 'New Zealand', 'Peru', 'Singapore', 'Vietnam']
  },
  {
    id: 'EVFTA',
    name: 'EU-Vietnam Free Trade Agreement',
    yearEffective: 2020,
    memberCountries: ['EU Member States', 'Vietnam']
  }
];

const vietnamTariffDataExport = {
  vietnamTariffData,
  tariffCategories,
  tradeAgreements
};

// Mock Vietnam Tariff Alerts
export const mockVietnamTariffAlerts = [
  {
    id: 'vta-001',
    title: 'New Tariff Rate for Electronics',
    description: 'Tariff rates for electronics imports from China will increase by 5% starting June 1, 2025',
    category: 'Electronics',
    severity: 'high',
    date: '2025-05-15',
    impactScore: 85,
    affectedHsCodes: ['8471.30.10', '8517.12.00'],
    countries: ['China']
  },
  {
    id: 'vta-002',
    title: 'EVFTA Preferential Rate Change',
    description: 'New preferential rates under EVFTA for textile products coming into effect next month',
    category: 'Textiles',
    severity: 'medium',
    date: '2025-05-10',
    impactScore: 65,
    affectedHsCodes: ['6104.43.00'],
    countries: ['EU Member States']
  },
  {
    id: 'vta-003',
    title: 'Automotive Import Tax Reduction',
    description: 'Import taxes on automotive parts from ASEAN countries reduced by 10%',
    category: 'Automotive',
    severity: 'medium',
    date: '2025-05-05',
    impactScore: 70,
    affectedHsCodes: ['8703.23.51'],
    countries: ['Thailand', 'Indonesia']
  },
  {
    id: 'vta-004',
    title: 'New Documentation Requirements',
    description: 'Additional documentation required for all electronics imports starting July 2025',
    category: 'Electronics',
    severity: 'low',
    date: '2025-05-01',
    impactScore: 45,
    affectedHsCodes: ['8528.72.91'],
    countries: ['All']
  },
  {
    id: 'vta-005',
    title: 'Temporary Tariff Suspension',
    description: 'Temporary suspension of tariffs on essential medical equipment imports',
    category: 'Medical',
    severity: 'high',
    date: '2025-04-28',
    impactScore: 90,
    affectedHsCodes: ['9018.90.00', '9019.20.00'],
    countries: ['All']
  }
];

// Vietnam AI Predictions
export const vietnamAiPredictions = [
  {
    id: 'vai-001',
    category: 'Electronics',
    prediction: 'Tariff rates likely to increase by 3-5% in Q3 2025',
    confidence: 0.85,
    impactScore: 75,
    affectedSectors: ['Consumer Electronics', 'Computer Hardware'],
    dataPoints: 128,
    lastUpdated: '2025-05-15'
  },
  {
    id: 'vai-002',
    category: 'Textiles',
    prediction: 'EVFTA rates expected to decrease further by end of 2025',
    confidence: 0.78,
    impactScore: 65,
    affectedSectors: ['Apparel', 'Home Textiles'],
    dataPoints: 95,
    lastUpdated: '2025-05-12'
  },
  {
    id: 'vai-003',
    category: 'Automotive',
    prediction: 'Stable tariff environment for next 6 months, then possible increase',
    confidence: 0.72,
    impactScore: 60,
    affectedSectors: ['Passenger Vehicles', 'Auto Parts'],
    dataPoints: 112,
    lastUpdated: '2025-05-10'
  }
];

// Vietnam Province Data
export const vietnamProvinceData = [
  {
    id: 'vn-44',
    name: 'An Giang',
    imports: 245000000,
    exports: 320000000,
    mainSectors: ['Agriculture', 'Textiles'],
    tariffImpact: 0.12
  },
  {
    id: 'vn-43',
    name: 'Ba Ria - Vung Tau',
    imports: 1250000000,
    exports: 2100000000,
    mainSectors: ['Oil & Gas', 'Logistics'],
    tariffImpact: 0.08
  },
  {
    id: 'vn-54',
    name: 'Bac Giang',
    imports: 780000000,
    exports: 950000000,
    mainSectors: ['Electronics', 'Manufacturing'],
    tariffImpact: 0.15
  },
  {
    id: 'vn-53',
    name: 'Bac Kan',
    imports: 120000000,
    exports: 180000000,
    mainSectors: ['Mining', 'Forestry'],
    tariffImpact: 0.06
  },
  {
    id: 'vn-55',
    name: 'Bac Lieu',
    imports: 210000000,
    exports: 350000000,
    mainSectors: ['Seafood', 'Agriculture'],
    tariffImpact: 0.11
  },
  {
    id: 'vn-56',
    name: 'Bac Ninh',
    imports: 3200000000,
    exports: 4500000000,
    mainSectors: ['Electronics', 'Manufacturing'],
    tariffImpact: 0.18
  },
  {
    id: 'vn-50',
    name: 'Ben Tre',
    imports: 280000000,
    exports: 420000000,
    mainSectors: ['Agriculture', 'Food Processing'],
    tariffImpact: 0.09
  },
  {
    id: 'vn-31',
    name: 'Binh Dinh',
    imports: 320000000,
    exports: 450000000,
    mainSectors: ['Furniture', 'Seafood'],
    tariffImpact: 0.10
  },
  {
    id: 'vn-57',
    name: 'Binh Duong',
    imports: 4100000000,
    exports: 5200000000,
    mainSectors: ['Manufacturing', 'Furniture'],
    tariffImpact: 0.17
  },
  {
    id: 'vn-58',
    name: 'Binh Phuoc',
    imports: 380000000,
    exports: 520000000,
    mainSectors: ['Rubber', 'Agriculture'],
    tariffImpact: 0.08
  }
];

// Vietnam Trade Corridors
export const vietnamTradeCorridors = [
  {
    id: 'vtc-001',
    name: 'Vietnam-China',
    volume: 165000000000,
    growth: 0.12,
    mainProducts: ['Electronics', 'Machinery', 'Textiles'],
    tariffAverage: 0.08,
    checkpoints: ['Mong Cai', 'Lao Cai', 'Lang Son']
  },
  {
    id: 'vtc-002',
    name: 'Vietnam-US',
    volume: 111000000000,
    growth: 0.15,
    mainProducts: ['Furniture', 'Textiles', 'Seafood'],
    tariffAverage: 0.06,
    checkpoints: ['Hai Phong Port', 'Ho Chi Minh City Port']
  },
  {
    id: 'vtc-003',
    name: 'Vietnam-EU',
    volume: 63000000000,
    growth: 0.18,
    mainProducts: ['Electronics', 'Footwear', 'Coffee'],
    tariffAverage: 0.04,
    checkpoints: ['Hai Phong Port', 'Da Nang Port']
  },
  {
    id: 'vtc-004',
    name: 'Vietnam-Japan',
    volume: 42000000000,
    growth: 0.09,
    mainProducts: ['Textiles', 'Seafood', 'Machinery'],
    tariffAverage: 0.05,
    checkpoints: ['Hai Phong Port', 'Ho Chi Minh City Port']
  },
  {
    id: 'vtc-005',
    name: 'Vietnam-South Korea',
    volume: 78000000000,
    growth: 0.14,
    mainProducts: ['Electronics', 'Machinery', 'Textiles'],
    tariffAverage: 0.06,
    checkpoints: ['Hai Phong Port', 'Ho Chi Minh City Port']
  }
];

export default vietnamTariffDataExport;
