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

export default {
  vietnamTariffData,
  tariffCategories,
  tradeAgreements
};
