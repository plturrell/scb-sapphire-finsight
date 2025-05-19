import { v4 as uuidv4 } from 'uuid';

// Pre-defined market news data
const marketNewsData = [
  {
    id: uuidv4(),
    title: "Asian Stocks Edge Higher on Strong Regional Manufacturing Data",
    summary: "Asian stocks climbed higher following strong PMI data from Vietnam and Thailand. Regional supply chain stability is improving, leading to positive industrial output projections.",
    category: "Markets",
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
    source: "Financial Times",
    url: "https://www.ft.com/content/market-news"
  },
  {
    id: uuidv4(),
    title: "Vietnam's Exports Surge 15% in Q1 Amid Tariff Uncertainty",
    summary: "Vietnam's exports grew significantly in Q1 2025 despite ongoing trade tensions. Electronics and textiles led the growth with major shipments to ASEAN partners and the EU.",
    category: "Trade",
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    source: "Bloomberg",
    url: "https://www.bloomberg.com/news/vietnam"
  },
  {
    id: uuidv4(),
    title: "US Federal Reserve Holds Rates, Signals Future Cut",
    summary: "The Federal Reserve maintained interest rates at current levels but hinted at potential cuts in the next quarter. Markets responded positively with Treasury yields declining.",
    category: "Economy",
    timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
    source: "The Wall Street Journal",
    url: "https://www.wsj.com/fed-news"
  },
  {
    id: uuidv4(),
    title: "SCB Reports Record Quarterly Profit, Boosts Investment in Vietnam",
    summary: "Standard Chartered Bank reported exceptional Q1 earnings and announced increased investments in Vietnam's growing market, focusing on digital banking and sustainable financing options.",
    category: "Banking",
    timestamp: new Date(Date.now() - 8 * 3600000).toISOString(),
    source: "Reuters",
    url: "https://www.reuters.com/business/finance/scb-reports"
  },
  {
    id: uuidv4(),
    title: "Vietnam Government Announces New Incentives for Foreign Investors",
    summary: "Vietnam's Ministry of Planning and Investment unveiled a comprehensive package of tax incentives and regulatory reforms designed to attract foreign direct investment in high-tech manufacturing and renewable energy.",
    category: "Policy",
    timestamp: new Date(Date.now() - 16 * 3600000).toISOString(),
    source: "Nikkei Asia",
    url: "https://asia.nikkei.com/vietnam-investment"
  },
  {
    id: uuidv4(),
    title: "Tech Stocks Rally on Strong Cloud Computing Demand",
    summary: "Major technology companies saw significant gains as quarterly reports showed stronger-than-expected growth in cloud services revenue. Enterprise digitalization continues to drive the sector.",
    category: "Technology",
    timestamp: new Date(Date.now() - 12 * 3600000).toISOString(),
    source: "CNBC",
    url: "https://www.cnbc.com/tech"
  },
  {
    id: uuidv4(),
    title: "ASEAN Economic Ministers Agree on Digital Trade Framework",
    summary: "ASEAN members reached consensus on a common framework for digital trade regulations, expected to boost regional e-commerce and fintech growth while harmonizing cross-border transactions.",
    category: "Trade",
    timestamp: new Date(Date.now() - 26 * 3600000).toISOString(),
    source: "The Straits Times",
    url: "https://www.straitstimes.com/asean"
  },
  {
    id: uuidv4(),
    title: "Global Supply Chain Disruptions Easing, Report Suggests",
    summary: "A new industry report indicates significant improvements in global supply chain resilience, with shipping times normalizing and component shortages resolving across multiple manufacturing sectors.",
    category: "Logistics",
    timestamp: new Date(Date.now() - 20 * 3600000).toISOString(),
    source: "Financial Times",
    url: "https://www.ft.com/supply-chain"
  }
];

/**
 * Function to retrieve market news
 * In the real implementation, this would fetch from the Perplexity API
 * For reliability, we're using pre-defined data
 */
export async function getMarketNews() {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return our pre-defined news data
  return marketNewsData;
}

// Export Perplexity news format for compatibility
export const perplexityApi = {
  getMarketNews
};