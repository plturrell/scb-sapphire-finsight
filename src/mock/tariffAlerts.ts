/**
 * Mock data for Tariff Alerts
 */

export const tariffAlerts = [
  {
    id: 'alert-001',
    title: 'New ASEAN Tariff Reduction',
    description: 'Upcoming 5% reduction in import duties for electronics from ASEAN countries, effective October 1, 2025.',
    impactLevel: 'high',
    category: 'Electronics',
    region: 'ASEAN',
    effectiveDate: '2025-10-01',
    notificationDate: '2025-05-15',
    status: 'active',
    source: 'Ministry of Finance',
    affectedHsCodes: ['8471.30', '8517.12', '8528.72']
  },
  {
    id: 'alert-002',
    title: 'EU-Vietnam FTA Phase 2',
    description: 'Phase 2 tariff reductions under EU-Vietnam FTA coming into effect for textiles and apparel.',
    impactLevel: 'medium',
    category: 'Textiles',
    region: 'EU',
    effectiveDate: '2025-08-01',
    notificationDate: '2025-05-10',
    status: 'active',
    source: 'Ministry of Industry and Trade',
    affectedHsCodes: ['6104.43', '6105.10', '6110.20']
  },
  {
    id: 'alert-003',
    title: 'Automotive Duty Increase',
    description: 'Temporary import duty increase of 10% for luxury vehicles above 3000cc engine capacity.',
    impactLevel: 'high',
    category: 'Automotive',
    region: 'Global',
    effectiveDate: '2025-07-15',
    notificationDate: '2025-05-01',
    status: 'active',
    source: 'Vietnam Customs',
    affectedHsCodes: ['8703.24', '8703.33', '8703.40']
  },
  {
    id: 'alert-004',
    title: 'Agricultural Product Quota Expansion',
    description: 'Expanded import quota for dairy products from Australia and New Zealand under CPTPP.',
    impactLevel: 'low',
    category: 'Agricultural Products',
    region: 'CPTPP',
    effectiveDate: '2025-09-01',
    notificationDate: '2025-04-20',
    status: 'pending',
    source: 'Ministry of Agriculture',
    affectedHsCodes: ['0401.10', '0402.21', '0406.90']
  },
  {
    id: 'alert-005',
    title: 'Steel Safeguard Measure',
    description: 'New safeguard measures implementing a 15% additional duty on certain steel products.',
    impactLevel: 'high',
    category: 'Metals',
    region: 'Global',
    effectiveDate: '2025-06-01',
    notificationDate: '2025-03-15',
    status: 'active',
    source: 'Ministry of Industry and Trade',
    affectedHsCodes: ['7208.10', '7209.15', '7210.11']
  }
];

export const alertCategories = [
  'Electronics',
  'Textiles',
  'Automotive',
  'Agricultural Products',
  'Machinery',
  'Chemicals',
  'Metals',
  'Plastics'
];

export const alertStatus = [
  'active',
  'pending',
  'expired',
  'cancelled'
];

export const impactLevels = [
  'low',
  'medium',
  'high',
  'critical'
];

const tariffAlertsExport = {
  tariffAlerts,
  alertCategories,
  alertStatus,
  impactLevels
};

export default tariffAlertsExport;
