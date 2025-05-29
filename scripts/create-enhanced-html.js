/**
 * Creates enhanced HTML pages with dynamic features
 */
const fs = require('fs');
const path = require('path');

// Base HTML template with dynamic loading script
const createHtml = (title, content, scripts) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} - SCB Sapphire FinSight</title>
  <link rel="icon" href="/favicon.ico" />
  <link rel="stylesheet" href="/styles/scb-styles.css" />
  
  <!-- Pre-connect to APIs -->
  <link rel="preconnect" href="https://api.perplexity.ai" />
  
  <!-- Font preloading -->
  <link rel="preload" href="/fonts/SCProsperSans-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
  <link rel="preload" href="/fonts/SCProsperSans-Medium.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
  <link rel="preload" href="/fonts/SCProsperSans-Bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
  
  <style>
    /* Dynamic loading animation */
    .scb-loading {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgb(var(--scb-light-gray));
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      transition: opacity 0.5s ease-out;
    }
    
    .scb-spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(var(--scb-honolulu-blue), 0.1);
      border-radius: 50%;
      border-top: 4px solid rgb(var(--scb-honolulu-blue));
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .scb-loading-text {
      font-size: 1.25rem;
      color: rgb(var(--scb-honolulu-blue));
      margin-bottom: 40px;
    }
    
    /* Emulated Perplexity functionality styles */
    .perplexity-search {
      position: relative;
      margin-bottom: 20px;
    }
    
    .perplexity-search input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid rgb(var(--scb-border));
      border-radius: 8px;
      font-size: 16px;
      font-family: "SCProsperSans", system-ui, sans-serif;
    }
    
    .perplexity-search button {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      background-color: rgb(var(--scb-honolulu-blue));
      color: white;
      border: none;
      border-radius: 4px;
      padding: 6px 12px;
      cursor: pointer;
    }
    
    .perplexity-result {
      margin-top: 20px;
      padding: 16px;
      border: 1px solid rgb(var(--scb-border));
      border-radius: 8px;
      background-color: white;
    }
    
    /* Monte Carlo Simulation Styles */
    .simulation-controls {
      margin-bottom: 20px;
      padding: 16px;
      border: 1px solid rgb(var(--scb-border));
      border-radius: 8px;
      background-color: white;
    }
    
    .simulation-controls label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
    }
    
    .simulation-controls input, .simulation-controls select {
      width: 100%;
      padding: 8px;
      margin-bottom: 12px;
      border: 1px solid rgb(var(--scb-border));
      border-radius: 4px;
    }
    
    .simulation-controls button {
      background-color: rgb(var(--scb-honolulu-blue));
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      cursor: pointer;
      margin-top: 8px;
    }
    
    .simulation-result {
      margin-top: 20px;
      padding: 16px;
      border: 1px solid rgb(var(--scb-border));
      border-radius: 8px;
      background-color: white;
    }
    
    /* Charts */
    .chart-container {
      width: 100%;
      height: 300px;
      margin-top: 20px;
      border: 1px solid rgb(var(--scb-border));
      border-radius: 8px;
      padding: 16px;
      background-color: white;
    }
    
    /* Responsive Grids */
    .grid-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
      margin-top: 20px;
    }
    
    .grid-item {
      background-color: white;
      border: 1px solid rgb(var(--scb-border));
      border-radius: 8px;
      padding: 16px;
    }
    
    @media (max-width: 768px) {
      .grid-container {
        grid-template-columns: 1fr;
      }
    }
  </style>
  
  <!-- Loading fallback -->
  <script>
    // Initialize API connection variables
    window.SCB_API_STATUS = {};
    window.SCB_DATA_CACHE = {};
    
    // Feature detection
    window.SCB_FEATURES = {
      perplexity: true,
      monteCarlo: true,
      visualization: true,
      news: true
    };
    
    // Data storage
    window.SCB_SIMULATION_RESULTS = {
      probabilityDistribution: [],
      sensitivity: [],
      history: []
    };
    
    // Mock Perplexity API
    window.mockPerplexitySearch = async (query) => {
      if (!query || query.length < 3) return "Please enter a longer query";
      
      // Simple cache
      if (window.SCB_DATA_CACHE[query]) {
        return window.SCB_DATA_CACHE[query];
      }
      
      // Vietnam tariff simulation
      if (query.toLowerCase().includes('vietnam') && query.toLowerCase().includes('tariff')) {
        const result = "Vietnam tariff analysis shows potential impact on manufacturing sectors with 5-15% increases likely in 2025. Most affected industries include electronics and textile manufacturing.";
        window.SCB_DATA_CACHE[query] = result;
        return result;
      }
      
      // Financial simulation
      if (query.toLowerCase().includes('market') || query.toLowerCase().includes('finance')) {
        const result = "Financial market analysis indicates moderate growth in Q3 with key sectors showing resilience despite inflationary pressures. Recommended portfolio adjustments include increasing exposure to defensive sectors.";
        window.SCB_DATA_CACHE[query] = result;
        return result;
      }
      
      // Default response
      const result = "I've analyzed your query and found relevant financial insights based on current market data. Please refine your search for more specific information.";
      window.SCB_DATA_CACHE[query] = result;
      return result;
    };
    
    // Mock Monte Carlo API
    window.runMonteCarloSimulation = async (params) => {
      // Generate random probability distribution
      const probabilityDistribution = [];
      for (let i = 0; i < 20; i++) {
        probabilityDistribution.push({
          value: Math.round(params.startValue + (Math.random() * params.volatility * 20)),
          probability: Math.random()
        });
      }
      
      // Normalize probabilities
      const sum = probabilityDistribution.reduce((acc, item) => acc + item.probability, 0);
      probabilityDistribution.forEach(item => item.probability /= sum);
      
      // Sort by value
      probabilityDistribution.sort((a, b) => a.value - b.value);
      
      // Generate sensitivity data
      const sensitivity = [
        { factor: "Interest Rate", impact: Math.random() * 10 - 5 },
        { factor: "Exchange Rate", impact: Math.random() * 10 - 5 },
        { factor: "Inflation", impact: Math.random() * 10 - 5 },
        { factor: "GDP Growth", impact: Math.random() * 10 - 5 },
      ];
      
      // Store in global object
      window.SCB_SIMULATION_RESULTS = {
        probabilityDistribution,
        sensitivity,
        expectedValue: probabilityDistribution.reduce((acc, item) => acc + item.value * item.probability, 0),
        risk: Math.sqrt(probabilityDistribution.reduce((acc, item) => {
          const diff = item.value - window.SCB_SIMULATION_RESULTS.expectedValue;
          return acc + diff * diff * item.probability;
        }, 0))
      };
      
      return window.SCB_SIMULATION_RESULTS;
    };
    
    // Function to show simulated interactive content
    window.showSimulatedContent = () => {
      const mainContent = document.getElementById('main-content');
      if (!mainContent) return;
      
      // Hide loading screen after a delay
      setTimeout(() => {
        const loadingElement = document.getElementById('loading-screen');
        if (loadingElement) {
          loadingElement.style.opacity = '0';
          setTimeout(() => {
            loadingElement.style.display = 'none';
          }, 500);
        }
      }, 1000);
    };
    
    // Initialize on page load
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(showSimulatedContent, 500);
      
      // Set up Perplexity search functionality
      const searchForm = document.getElementById('perplexity-search-form');
      const searchInput = document.getElementById('perplexity-search-input');
      const searchResults = document.getElementById('perplexity-search-results');
      
      if (searchForm && searchInput && searchResults) {
        searchForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const query = searchInput.value.trim();
          
          // Show loading state
          searchResults.innerHTML = '<div class="simulation-result">Searching...</div>';
          
          // Get mock results
          setTimeout(async () => {
            const result = await window.mockPerplexitySearch(query);
            searchResults.innerHTML = '<div class="simulation-result">' + result + '</div>';
          }, 1000);
        });
      }
      
      // Set up Monte Carlo simulation functionality
      const simulationForm = document.getElementById('monte-carlo-form');
      const simulationResults = document.getElementById('monte-carlo-results');
      
      if (simulationForm && simulationResults) {
        simulationForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          // Get form values
          const startValue = parseFloat(document.getElementById('start-value').value) || 100;
          const volatility = parseFloat(document.getElementById('volatility').value) || 0.2;
          const iterations = parseInt(document.getElementById('iterations').value) || 1000;
          
          // Show loading state
          simulationResults.innerHTML = '<div class="simulation-result">Running simulation...</div>';
          
          // Run simulation
          setTimeout(async () => {
            const results = await window.runMonteCarloSimulation({
              startValue,
              volatility,
              iterations
            });
            
            // Display results
            simulationResults.innerHTML = '<div class="simulation-result">' +
              '<h3>Simulation Results</h3>' +
              '<p>Expected Value: ' + results.expectedValue.toFixed(2) + '</p>' +
              '<p>Risk: ' + results.risk.toFixed(2) + '</p>' +
              '<div class="chart-container">' +
              '  <div style="text-align: center; padding-top: 120px;">Probability Distribution Chart</div>' +
              '</div>' +
              '<h3>Sensitivity Analysis</h3>' +
              '<ul>' +
              results.sensitivity.map(s => '<li>' + s.factor + ': ' + s.impact.toFixed(2) + '%</li>').join('') +
              '</ul>' +
              '</div>';
          }, 1500);
        });
      }
    });
  </script>
  
  ${scripts ? scripts : ''}
</head>
<body>
  <!-- Loading screen -->
  <div id="loading-screen" class="scb-loading">
    <div class="scb-spinner"></div>
    <div class="scb-loading-text">Loading SCB Sapphire FinSight...</div>
  </div>

  <!-- Header -->
  <header class="fiori-shell-header" style="background-color: rgb(var(--scb-honolulu-blue)); color: white; height: 64px; display: flex; align-items: center; padding: 0 20px;">
    <div style="display: flex; justify-content: space-between; width: 100%; max-width: 1200px; margin: 0 auto;">
      <div style="font-weight: 700; font-size: 1.25rem;">SCB Sapphire FinSight</div>
      <div style="display: flex; gap: 16px;">
        <a href="/" class="fiori-btn fiori-btn-primary" style="background-color: transparent; border: 1px solid rgba(255, 255, 255, 0.3);">
          Dashboard
        </a>
        <a href="/vietnam-tariff-dashboard" class="fiori-btn fiori-btn-primary" style="background-color: transparent; border: 1px solid rgba(255, 255, 255, 0.3);">
          Vietnam Analysis
        </a>
        <a href="/perplexity-test" class="fiori-btn fiori-btn-primary" style="background-color: transparent; border: 1px solid rgba(255, 255, 255, 0.3);">
          Perplexity
        </a>
        <a href="/financial-simulation" class="fiori-btn fiori-btn-primary" style="background-color: transparent; border: 1px solid rgba(255, 255, 255, 0.3);">
          Simulation
        </a>
      </div>
    </div>
  </header>

  <!-- Main content area -->
  <main id="main-content" style="max-width: 1200px; margin: 0 auto; padding: 40px 20px;">
    ${content}
  </main>
  
  <!-- Footer -->
  <footer style="background-color: rgb(var(--scb-honolulu-blue)); color: white; padding: 40px 0; margin-top: 60px;">
    <div style="max-width: 1200px; margin: 0 auto; padding: 0 20px;">
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; margin-bottom: 40px;">
        <div style="min-width: 200px; margin-bottom: 20px;">
          <div style="font-weight: 600; margin-bottom: 15px;">Products</div>
          <div style="margin-bottom: 10px; opacity: 0.8;">Portfolio Management</div>
          <div style="margin-bottom: 10px; opacity: 0.8;">Risk Analysis</div>
          <div style="margin-bottom: 10px; opacity: 0.8;">Trading Desk</div>
          <div style="margin-bottom: 10px; opacity: 0.8;">Reports</div>
        </div>
        
        <div style="min-width: 200px; margin-bottom: 20px;">
          <div style="font-weight: 600; margin-bottom: 15px;">Resources</div>
          <div style="margin-bottom: 10px; opacity: 0.8;">Documentation</div>
          <div style="margin-bottom: 10px; opacity: 0.8;">API Reference</div>
          <div style="margin-bottom: 10px; opacity: 0.8;">Tutorial Videos</div>
          <div style="margin-bottom: 10px; opacity: 0.8;">Knowledge Base</div>
        </div>
        
        <div style="min-width: 200px; margin-bottom: 20px;">
          <div style="font-weight: 600; margin-bottom: 15px;">Company</div>
          <div style="margin-bottom: 10px; opacity: 0.8;">About Us</div>
          <div style="margin-bottom: 10px; opacity: 0.8;">Contact</div>
          <div style="margin-bottom: 10px; opacity: 0.8;">Careers</div>
          <div style="margin-bottom: 10px; opacity: 0.8;">Blog</div>
        </div>
        
        <div style="min-width: 200px; margin-bottom: 20px;">
          <div style="font-weight: 600; margin-bottom: 15px;">Legal</div>
          <div style="margin-bottom: 10px; opacity: 0.8;">Terms of Service</div>
          <div style="margin-bottom: 10px; opacity: 0.8;">Privacy Policy</div>
          <div style="margin-bottom: 10px; opacity: 0.8;">Cookies</div>
          <div style="margin-bottom: 10px; opacity: 0.8;">Compliance</div>
        </div>
      </div>
      
      <div style="text-align: center; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.2); opacity: 0.6; font-size: 0.875rem;">
        © 2025 SCB Sapphire FinSight. All rights reserved.
      </div>
    </div>
  </footer>
</body>
</html>
`;

// Define directory for HTML files
const outDir = path.join(__dirname, '../out');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Create index.html (dashboard)
const dashboardContent = `
<section class="perfect-section">
  <h1 class="perfect-h1" style="color: rgb(var(--scb-honolulu-blue)); margin-bottom: 20px;">Financial Dashboard</h1>
  <p class="perfect-body" style="margin-bottom: 40px;">Welcome to your financial insights dashboard with dynamic features. View your performance metrics and analytics in real-time.</p>
  
  <h2 class="perfect-h2" style="margin-bottom: 20px;">Key Metrics</h2>
  
  <div class="grid grid-cols-1 md:grid-cols-4 gap-6" style="display: grid; gap: 1.5rem; grid-template-columns: repeat(4, 1fr);">
    <div class="fiori-tile" style="padding: 20px;">
      <div style="font-size: 0.875rem; color: rgb(var(--scb-dark-gray)); margin-bottom: 8px;">Portfolio Value</div>
      <div class="perfect-h2" style="margin-bottom: 8px;">$347.2B</div>
      <div style="font-size: 0.875rem; color: rgb(var(--scb-american-green));">+$14.32M (+6.3%)</div>
    </div>
    
    <div class="fiori-tile" style="padding: 20px;">
      <div style="font-size: 0.875rem; color: rgb(var(--scb-dark-gray)); margin-bottom: 8px;">YTD Return</div>
      <div class="perfect-h2" style="margin-bottom: 8px;">+6.3%</div>
      <div style="font-size: 0.875rem; color: rgb(var(--scb-american-green));">↑ 1.2% Since last quarter</div>
    </div>
    
    <div class="fiori-tile" style="padding: 20px;">
      <div style="font-size: 0.875rem; color: rgb(var(--scb-dark-gray)); margin-bottom: 8px;">Risk Score</div>
      <div class="perfect-h2" style="margin-bottom: 8px;">7.2</div>
      <div style="font-size: 0.875rem; color: rgb(var(--scb-american-green));">Moderate Risk</div>
    </div>
    
    <div class="fiori-tile" style="padding: 20px;">
      <div style="font-size: 0.875rem; color: rgb(var(--scb-dark-gray)); margin-bottom: 8px;">Transaction Banking</div>
      <div class="perfect-h2" style="margin-bottom: 8px;">45%</div>
      <div style="font-size: 0.875rem;">Allocation</div>
    </div>
  </div>
</section>

<section class="perfect-section">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
    <h2 class="perfect-h2 scb-section-header">Intelligent Insights</h2>
    <div class="fiori-btn fiori-btn-primary">View All</div>
  </div>
  
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6" style="display: grid; gap: 1.5rem; grid-template-columns: repeat(3, 1fr);">
    <div class="fiori-tile" style="padding: 20px;">
      <h3 class="fiori-tile-title">Market Performance Update</h3>
      <p class="perfect-body-small" style="margin-bottom: 20px;">5.2% growth across key sectors</p>
      <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: rgb(var(--scb-dark-gray));">
        <div>Market Analysis</div>
        <div>Confidence: 88%</div>
      </div>
    </div>
    
    <div class="fiori-tile" style="padding: 20px;">
      <h3 class="fiori-tile-title">Investment Opportunity</h3>
      <p class="perfect-body-small" style="margin-bottom: 20px;">New opportunities in emerging markets show potential for high returns</p>
      <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: rgb(var(--scb-dark-gray));">
        <div>AI Insights</div>
        <div>Confidence: 85%</div>
      </div>
    </div>
    
    <div class="fiori-tile" style="padding: 20px;">
      <h3 class="fiori-tile-title">System Status</h3>
      <p class="perfect-body-small" style="margin-bottom: 20px;">All systems operational, data refresh in progress</p>
      <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: rgb(var(--scb-dark-gray));">
        <div>System Monitor</div>
        <div>Confidence: 95%</div>
      </div>
    </div>
  </div>
</section>

<section class="perfect-section">
  <h2 class="perfect-h2 scb-section-header" style="margin-bottom: 20px;">Quick Actions</h2>
  
  <div class="grid grid-cols-1 md:grid-cols-4 gap-6" style="display: grid; gap: 1.5rem; grid-template-columns: repeat(4, 1fr);">
    <a href="/vietnam-tariff-dashboard" class="fiori-tile" style="background-color: rgb(var(--scb-honolulu-blue)); color: white; padding: 20px; text-decoration: none;">
      <h3 style="font-weight: 600; margin-bottom: 10px; color: white;">Vietnam Analysis</h3>
      <p style="font-size: 0.875rem; opacity: 0.8;">Deep dive into Vietnam tariff impact</p>
    </a>
    
    <a href="/financial-simulation" class="fiori-tile" style="background-color: rgb(var(--scb-american-green)); color: white; padding: 20px; text-decoration: none;">
      <h3 style="font-weight: 600; margin-bottom: 10px; color: white;">Monte Carlo</h3>
      <p style="font-size: 0.875rem; opacity: 0.8;">Run financial simulations</p>
    </a>
    
    <a href="/perplexity-test" class="fiori-tile" style="background-color: rgb(var(--scb-muted-red)); color: white; padding: 20px; text-decoration: none;">
      <h3 style="font-weight: 600; margin-bottom: 10px; color: white;">Perplexity</h3>
      <p style="font-size: 0.875rem; opacity: 0.8;">AI-powered financial research</p>
    </a>
    
    <div class="fiori-tile" style="background-color: rgb(var(--scb-dark-gray)); color: white; padding: 20px;">
      <h3 style="font-weight: 600; margin-bottom: 10px; color: white;">News Feed</h3>
      <p style="font-size: 0.875rem; opacity: 0.8;">Latest market updates</p>
    </div>
  </div>
</section>
`;

// Create vietnam-tariff-dashboard.html
const vietnamTariffContent = `
<section class="perfect-section">
  <h1 class="perfect-h1" style="color: rgb(var(--scb-honolulu-blue)); margin-bottom: 20px;">Vietnam Tariff Analysis Dashboard</h1>
  <p class="perfect-body" style="margin-bottom: 40px;">Analyze the impact of tariff changes on Vietnam manufacturing and trade sectors.</p>
  
  <div class="grid-container">
    <div class="grid-item">
      <h3 class="fiori-tile-title">Tariff Overview</h3>
      <p>Current average tariff rate: 7.9%</p>
      <p>Projected changes: +2.3% by Q3 2025</p>
      <p>Most affected sectors: Electronics, Textiles</p>
    </div>
    
    <div class="grid-item">
      <h3 class="fiori-tile-title">Economic Impact</h3>
      <p>GDP impact: -0.5% to -1.2%</p>
      <p>Export volume change: -3.7%</p>
      <p>Import cost increase: +5.2%</p>
    </div>
    
    <div class="grid-item">
      <h3 class="fiori-tile-title">Industry Risk Levels</h3>
      <p>Electronics: High</p>
      <p>Textiles: High</p>
      <p>Agriculture: Medium</p>
      <p>Pharmaceuticals: Low</p>
    </div>
    
    <div class="grid-item">
      <h3 class="fiori-tile-title">Supply Chain Disruption</h3>
      <p>Overall disruption: Moderate</p>
      <p>Expected duration: 6-9 months</p>
      <p>Recovery timeline: Q4 2025</p>
    </div>
  </div>
  
  <div class="chart-container" style="margin-top: 30px;">
    <div style="text-align: center; padding-top: 120px;">Vietnam Tariff Impact Visualization</div>
  </div>
  
  <h2 class="perfect-h2" style="margin: 40px 0 20px;">Recent Tariff Alerts</h2>
  
  <div class="grid-container">
    <div class="grid-item">
      <h3 class="fiori-tile-title">New Electronics Tariff</h3>
      <p>Effective: June 15, 2025</p>
      <p>Rate change: +3.5%</p>
      <p>Products affected: 237</p>
      <p>Status: Pending Implementation</p>
    </div>
    
    <div class="grid-item">
      <h3 class="fiori-tile-title">Textile Export Regulations</h3>
      <p>Effective: August 1, 2025</p>
      <p>Rate change: +2.8%</p>
      <p>Products affected: 189</p>
      <p>Status: Announced</p>
    </div>
    
    <div class="grid-item">
      <h3 class="fiori-tile-title">Agricultural Imports</h3>
      <p>Effective: July 10, 2025</p>
      <p>Rate change: +1.2%</p>
      <p>Products affected: 94</p>
      <p>Status: Under Review</p>
    </div>
  </div>
</section>
`;

// Create vietnam-monte-carlo.html
const monteCarloContent = `
<section class="perfect-section">
  <h1 class="perfect-h1" style="color: rgb(var(--scb-honolulu-blue)); margin-bottom: 20px;">Monte Carlo Financial Simulation</h1>
  <p class="perfect-body" style="margin-bottom: 40px;">Run sophisticated Monte Carlo simulations to analyze financial scenarios and risk profiles.</p>
  
  <div class="simulation-controls">
    <h3 class="fiori-tile-title">Simulation Parameters</h3>
    <form id="monte-carlo-form">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
        <div>
          <label for="start-value">Starting Value ($)</label>
          <input type="number" id="start-value" value="100" min="1" max="10000" required>
        </div>
        
        <div>
          <label for="volatility">Volatility (%)</label>
          <input type="number" id="volatility" value="20" min="1" max="100" required>
        </div>
        
        <div>
          <label for="iterations">Iterations</label>
          <input type="number" id="iterations" value="1000" min="100" max="10000" required>
        </div>
        
        <div>
          <label for="time-horizon">Time Horizon (years)</label>
          <input type="number" id="time-horizon" value="5" min="1" max="30" required>
        </div>
      </div>
      
      <div style="margin-top: 20px;">
        <label for="scenario">Scenario</label>
        <select id="scenario">
          <option value="baseline">Baseline</option>
          <option value="bullish">Bullish Market</option>
          <option value="bearish">Bearish Market</option>
          <option value="volatile">High Volatility</option>
          <option value="stagflation">Stagflation</option>
        </select>
      </div>
      
      <button type="submit" style="margin-top: 20px; padding: 10px 20px;">Run Simulation</button>
    </form>
  </div>
  
  <div id="monte-carlo-results">
    <div class="simulation-result">
      <p>Configure parameters and run a simulation to see results</p>
    </div>
  </div>
</section>
`;

// Create perplexity-test.html
const perplexityContent = `
<section class="perfect-section">
  <h1 class="perfect-h1" style="color: rgb(var(--scb-honolulu-blue)); margin-bottom: 20px;">Perplexity Financial Research</h1>
  <p class="perfect-body" style="margin-bottom: 40px;">Use AI-powered research to get instant insights on financial topics, markets, and company analysis.</p>
  
  <div class="perplexity-search">
    <form id="perplexity-search-form">
      <input type="text" id="perplexity-search-input" placeholder="Ask about financial markets, Vietnam tariffs, or investment strategies..." />
      <button type="submit">Search</button>
    </form>
  </div>
  
  <div id="perplexity-search-results">
    <div class="simulation-result">
      <p>Try searching for financial insights. For example:</p>
      <ul style="margin-top: 10px; margin-left: 20px;">
        <li>"Vietnam tariff impact on manufacturing"</li>
        <li>"Market outlook for next quarter"</li>
        <li>"Interest rate implications for banking sector"</li>
      </ul>
    </div>
  </div>
  
  <h2 class="perfect-h2" style="margin: 40px 0 20px;">Recent Financial Insights</h2>
  
  <div class="grid-container">
    <div class="grid-item">
      <h3 class="fiori-tile-title">Vietnam Economic Outlook</h3>
      <p>GDP Growth: 6.2% projected for 2025</p>
      <p>Key risks: Supply chain disruptions, tariff changes</p>
      <p>Opportunities: Manufacturing relocation, tech sector growth</p>
    </div>
    
    <div class="grid-item">
      <h3 class="fiori-tile-title">Global Market Trends</h3>
      <p>Equities: Moderate growth expected</p>
      <p>Fixed Income: Yield curve normalizing</p>
      <p>Commodities: Mixed outlook with energy volatility</p>
    </div>
    
    <div class="grid-item">
      <h3 class="fiori-tile-title">Sector Analysis</h3>
      <p>Technology: Strong growth in AI and cloud services</p>
      <p>Finance: Banks stabilizing with improved capital ratios</p>
      <p>Healthcare: Innovation driving valuation increases</p>
    </div>
  </div>
</section>
`;

// Create financial-simulation.html
const financialSimulationContent = `
<section class="perfect-section">
  <h1 class="perfect-h1" style="color: rgb(var(--scb-honolulu-blue)); margin-bottom: 20px;">Financial Simulation Dashboard</h1>
  <p class="perfect-body" style="margin-bottom: 40px;">Advanced financial modeling with real-time market data integration.</p>
  
  <div class="grid-container">
    <div class="grid-item">
      <h3 class="fiori-tile-title">Market Scenarios</h3>
      <p>Baseline: Current market conditions</p>
      <p>Bull Case: +12% market growth</p>
      <p>Bear Case: -8% market decline</p>
      <p>Volatility Shock: +35% VIX increase</p>
    </div>
    
    <div class="grid-item">
      <h3 class="fiori-tile-title">Portfolio Risk</h3>
      <p>Value at Risk (95%): $24.3M</p>
      <p>Expected Shortfall: $31.7M</p>
      <p>Beta: 0.87</p>
      <p>Sharpe Ratio: 1.42</p>
    </div>
    
    <div class="grid-item">
      <h3 class="fiori-tile-title">Macro Factors</h3>
      <p>Inflation: 3.2% projected</p>
      <p>Interest Rates: 4.5% by EOY</p>
      <p>GDP Growth: 2.1% expected</p>
      <p>Unemployment: 4.6% steady</p>
    </div>
    
    <div class="grid-item">
      <h3 class="fiori-tile-title">Asset Allocation</h3>
      <p>Equities: 55%</p>
      <p>Fixed Income: 30%</p>
      <p>Alternatives: 10%</p>
      <p>Cash: 5%</p>
    </div>
  </div>
  
  <h2 class="perfect-h2" style="margin: 40px 0 20px;">Interactive Simulation</h2>
  
  <div class="simulation-controls">
    <h3 class="fiori-tile-title">Stress Test Parameters</h3>
    <form id="monte-carlo-form">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
        <div>
          <label for="start-value">Portfolio Value ($M)</label>
          <input type="number" id="start-value" value="100" min="1" max="10000" required>
        </div>
        
        <div>
          <label for="volatility">Market Volatility (%)</label>
          <input type="number" id="volatility" value="15" min="1" max="100" required>
        </div>
        
        <div>
          <label for="iterations">Simulation Runs</label>
          <input type="number" id="iterations" value="1000" min="100" max="10000" required>
        </div>
        
        <div>
          <label for="time-horizon">Time Horizon (months)</label>
          <input type="number" id="time-horizon" value="12" min="1" max="60" required>
        </div>
      </div>
      
      <div style="margin-top: 20px;">
        <label for="scenario">Market Scenario</label>
        <select id="scenario">
          <option value="baseline">Baseline</option>
          <option value="rate-hike">Rate Hike (+100bps)</option>
          <option value="recession">Mild Recession</option>
          <option value="inflation">Inflation Surge</option>
          <option value="recovery">Strong Recovery</option>
        </select>
      </div>
      
      <button type="submit" style="margin-top: 20px; padding: 10px 20px;">Run Stress Test</button>
    </form>
  </div>
  
  <div id="monte-carlo-results">
    <div class="simulation-result">
      <p>Configure parameters and run a simulation to see results</p>
    </div>
  </div>
  
  <div class="chart-container" style="margin-top: 30px;">
    <div style="text-align: center; padding-top: 120px;">Portfolio Performance Visualization</div>
  </div>
</section>
`;

// Write HTML files
fs.writeFileSync(path.join(outDir, 'index.html'), createHtml('Dashboard', dashboardContent));
fs.writeFileSync(path.join(outDir, 'vietnam-tariff-dashboard.html'), createHtml('Vietnam Tariff Analysis', vietnamTariffContent));
fs.writeFileSync(path.join(outDir, 'vietnam-monte-carlo.html'), createHtml('Monte Carlo Simulation', monteCarloContent));
fs.writeFileSync(path.join(outDir, 'perplexity-test.html'), createHtml('Perplexity Research', perplexityContent));
fs.writeFileSync(path.join(outDir, 'financial-simulation.html'), createHtml('Financial Simulation', financialSimulationContent));

console.log('✅ Successfully created enhanced HTML pages with dynamic features');