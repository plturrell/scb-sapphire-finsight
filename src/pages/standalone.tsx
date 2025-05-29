import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function StandalonePage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      <Head>
        <title>SCB Sapphire FinSight</title>
        <meta name="description" content="Financial insights dashboard" />
      </Head>

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">📊</span>
            <h1 className="logo-text">SCB FinSight</h1>
          </div>
          <nav className="main-nav">
            <button 
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button 
              className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              Analytics
            </button>
            <button 
              className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              Reports
            </button>
            <button 
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
          </nav>
          <div className="header-actions">
            <button 
              className="theme-toggle" 
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle theme"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button className="user-menu">
              <span className="user-avatar">👤</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Sidebar */}
        <aside className="sidebar">
          <nav className="sidebar-nav">
            <div className="sidebar-section">
              <h3 className="sidebar-heading">Main</h3>
              <ul className="sidebar-menu">
                <li className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}>
                  <button onClick={() => setActiveTab('dashboard')}>
                    <span className="sidebar-icon">📈</span>
                    <span className="sidebar-label">Dashboard</span>
                  </button>
                </li>
                <li className={`sidebar-item ${activeTab === 'analytics' ? 'active' : ''}`}>
                  <button onClick={() => setActiveTab('analytics')}>
                    <span className="sidebar-icon">📊</span>
                    <span className="sidebar-label">Analytics</span>
                  </button>
                </li>
                <li className={`sidebar-item ${activeTab === 'reports' ? 'active' : ''}`}>
                  <button onClick={() => setActiveTab('reports')}>
                    <span className="sidebar-icon">📑</span>
                    <span className="sidebar-label">Reports</span>
                  </button>
                </li>
              </ul>
            </div>
            
            <div className="sidebar-section">
              <h3 className="sidebar-heading">Tools</h3>
              <ul className="sidebar-menu">
                <li className="sidebar-item">
                  <button>
                    <span className="sidebar-icon">🔍</span>
                    <span className="sidebar-label">Search</span>
                  </button>
                </li>
                <li className="sidebar-item">
                  <button>
                    <span className="sidebar-icon">📆</span>
                    <span className="sidebar-label">Calendar</span>
                  </button>
                </li>
                <li className="sidebar-item">
                  <button>
                    <span className="sidebar-icon">⚙️</span>
                    <span className="sidebar-label">Settings</span>
                  </button>
                </li>
              </ul>
            </div>
          </nav>
        </aside>

        {/* Dashboard Content */}
        <div className="content">
          <div className="content-header">
            <h2 className="page-title">Financial Dashboard</h2>
            <div className="content-actions">
              <button className="action-button">
                <span>Export</span>
              </button>
              <button className="action-button primary">
                <span>New Report</span>
              </button>
            </div>
          </div>

          <div className="dashboard-grid">
            {/* KPI Cards */}
            <div className="card kpi-card">
              <h3 className="card-title">Total Revenue</h3>
              <div className="card-value">$1,458,293</div>
              <div className="card-change positive">+12.5%</div>
            </div>
            
            <div className="card kpi-card">
              <h3 className="card-title">Expenses</h3>
              <div className="card-value">$892,475</div>
              <div className="card-change negative">-3.2%</div>
            </div>
            
            <div className="card kpi-card">
              <h3 className="card-title">Net Profit</h3>
              <div className="card-value">$565,818</div>
              <div className="card-change positive">+24.8%</div>
            </div>
            
            <div className="card kpi-card">
              <h3 className="card-title">ROI</h3>
              <div className="card-value">18.3%</div>
              <div className="card-change positive">+2.1%</div>
            </div>

            {/* Chart Cards */}
            <div className="card chart-card wide">
              <h3 className="card-title">Revenue Trends</h3>
              <div className="card-content">
                <div className="chart-placeholder">
                  <div className="chart-line"></div>
                  <div className="chart-line"></div>
                  <div className="chart-line"></div>
                </div>
              </div>
            </div>
            
            <div className="card chart-card">
              <h3 className="card-title">Expense Breakdown</h3>
              <div className="card-content">
                <div className="chart-placeholder pie">
                  <div className="pie-segment" style={{ transform: 'rotate(0deg)', background: 'var(--color-accent-1)' }}></div>
                  <div className="pie-segment" style={{ transform: 'rotate(90deg)', background: 'var(--color-accent-2)' }}></div>
                  <div className="pie-segment" style={{ transform: 'rotate(200deg)', background: 'var(--color-accent-3)' }}></div>
                </div>
              </div>
            </div>
            
            <div className="card chart-card">
              <h3 className="card-title">Monthly Comparison</h3>
              <div className="card-content">
                <div className="chart-placeholder">
                  <div className="bar-chart">
                    <div className="bar" style={{ height: '60%' }}></div>
                    <div className="bar" style={{ height: '75%' }}></div>
                    <div className="bar" style={{ height: '45%' }}></div>
                    <div className="bar" style={{ height: '90%' }}></div>
                    <div className="bar" style={{ height: '65%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Table Card */}
            <div className="card table-card wide tall">
              <h3 className="card-title">Recent Transactions</h3>
              <div className="card-content">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>May 28, 2025</td>
                      <td>Vendor Payment - ABC Corp</td>
                      <td>Supplies</td>
                      <td className="negative">-$12,450</td>
                    </tr>
                    <tr>
                      <td>May 27, 2025</td>
                      <td>Client Invoice #3892</td>
                      <td>Services</td>
                      <td className="positive">$24,800</td>
                    </tr>
                    <tr>
                      <td>May 26, 2025</td>
                      <td>Quarterly Tax Payment</td>
                      <td>Taxes</td>
                      <td className="negative">-$18,620</td>
                    </tr>
                    <tr>
                      <td>May 25, 2025</td>
                      <td>Client Invoice #3891</td>
                      <td>Products</td>
                      <td className="positive">$35,290</td>
                    </tr>
                    <tr>
                      <td>May 24, 2025</td>
                      <td>Payroll Processing</td>
                      <td>Salaries</td>
                      <td className="negative">-$42,350</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-copyright">
            © 2025 Standard Chartered Bank Sapphire FinSight
          </div>
          <div className="footer-links">
            <Link href="#" className="footer-link">Privacy Policy</Link>
            <Link href="#" className="footer-link">Terms of Service</Link>
            <Link href="#" className="footer-link">Contact Support</Link>
          </div>
        </div>
      </footer>

      {/* Embedded Styles */}
      <style jsx global>{`
        /* Font Definitions */
        @font-face {
          font-family: 'SCProsperSans';
          font-style: normal;
          font-weight: 300;
          font-display: swap;
          src: url('/fonts/SCProsperSans-Light.woff2') format('woff2');
        }
        
        @font-face {
          font-family: 'SCProsperSans';
          font-style: normal;
          font-weight: 400;
          font-display: swap;
          src: url('/fonts/SCProsperSans-Regular.woff2') format('woff2');
        }
        
        @font-face {
          font-family: 'SCProsperSans';
          font-style: normal;
          font-weight: 500;
          font-display: swap;
          src: url('/fonts/SCProsperSans-Medium.woff2') format('woff2');
        }
        
        @font-face {
          font-family: 'SCProsperSans';
          font-style: normal;
          font-weight: 700;
          font-display: swap;
          src: url('/fonts/SCProsperSans-Bold.woff2') format('woff2');
        }

        /* Reset & Base Styles */
        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        html, body {
          height: 100%;
          width: 100%;
          font-family: 'SCProsperSans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          font-size: 16px;
          line-height: 1.5;
        }
        
        body {
          overflow-x: hidden;
        }

        button {
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
        }

        ul, ol {
          list-style: none;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        /* Theme Variables */
        .light-mode {
          --color-bg-primary: #f5f7fa;
          --color-bg-secondary: #ffffff;
          --color-bg-tertiary: #e9ecef;
          --color-text-primary: #1a1f36;
          --color-text-secondary: #4a5568;
          --color-text-tertiary: #718096;
          --color-border: #e2e8f0;
          --color-primary: #0072AA; /* SCB Honolulu Blue */
          --color-primary-hover: #005c88;
          --color-primary-light: #e6f4f9;
          --color-positive: #21AA47; /* SCB American Green */
          --color-negative: #D33732; /* SCB Muted Red */
          --color-accent-1: #0072AA;
          --color-accent-2: #21AA47;
          --color-accent-3: #FFB319;
          --color-shadow: rgba(0, 0, 0, 0.1);
        }

        .dark-mode {
          --color-bg-primary: #1a202c;
          --color-bg-secondary: #2d3748;
          --color-bg-tertiary: #3a4a5e;
          --color-text-primary: #f7fafc;
          --color-text-secondary: #e2e8f0;
          --color-text-tertiary: #a0aec0;
          --color-border: #4a5568;
          --color-primary: #4299e1;
          --color-primary-hover: #3182ce;
          --color-primary-light: #2b4562;
          --color-positive: #48bb78;
          --color-negative: #f56565;
          --color-accent-1: #4299e1;
          --color-accent-2: #48bb78;
          --color-accent-3: #ecc94b;
          --color-shadow: rgba(0, 0, 0, 0.3);
        }

        /* Layout */
        .app-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background-color: var(--color-bg-primary);
          color: var(--color-text-primary);
        }

        .header {
          background-color: var(--color-bg-secondary);
          border-bottom: 1px solid var(--color-border);
          height: 64px;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 2px 4px var(--color-shadow);
        }

        .header-content {
          max-width: 1440px;
          height: 100%;
          margin: 0 auto;
          padding: 0 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .logo-icon {
          font-size: 1.5rem;
        }

        .logo-text {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--color-primary);
        }

        .main-nav {
          display: flex;
          gap: 8px;
        }

        .nav-item {
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: 500;
          color: var(--color-text-secondary);
          transition: all 0.2s ease;
        }

        .nav-item:hover {
          background-color: var(--color-primary-light);
          color: var(--color-primary);
        }

        .nav-item.active {
          background-color: var(--color-primary-light);
          color: var(--color-primary);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .theme-toggle, .user-menu {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s ease;
        }

        .theme-toggle:hover, .user-menu:hover {
          background-color: var(--color-bg-tertiary);
        }

        .main-content {
          display: flex;
          flex: 1;
          max-width: 1440px;
          margin: 0 auto;
          width: 100%;
        }

        .sidebar {
          width: 240px;
          padding: 24px 16px;
          background-color: var(--color-bg-secondary);
          border-right: 1px solid var(--color-border);
          height: calc(100vh - 64px);
          position: sticky;
          top: 64px;
          overflow-y: auto;
        }

        .sidebar-section {
          margin-bottom: 24px;
        }

        .sidebar-heading {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--color-text-tertiary);
          margin-bottom: 8px;
          padding: 0 8px;
        }

        .sidebar-menu {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sidebar-item button {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px 12px;
          border-radius: 6px;
          color: var(--color-text-secondary);
          transition: all 0.2s ease;
          text-align: left;
        }

        .sidebar-item button:hover {
          background-color: var(--color-primary-light);
          color: var(--color-primary);
        }

        .sidebar-item.active button {
          background-color: var(--color-primary-light);
          color: var(--color-primary);
          font-weight: 500;
        }

        .sidebar-icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .content {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
        }

        .content-header {
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .page-title {
          font-size: 1.75rem;
          font-weight: 700;
        }

        .content-actions {
          display: flex;
          gap: 12px;
        }

        .action-button {
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--color-border);
          background-color: var(--color-bg-secondary);
          color: var(--color-text-secondary);
          transition: all 0.2s ease;
        }

        .action-button:hover {
          border-color: var(--color-primary);
          color: var(--color-primary);
        }

        .action-button.primary {
          background-color: var(--color-primary);
          border-color: var(--color-primary);
          color: white;
        }

        .action-button.primary:hover {
          background-color: var(--color-primary-hover);
          border-color: var(--color-primary-hover);
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          grid-gap: 20px;
        }

        .card {
          background-color: var(--color-bg-secondary);
          border-radius: 12px;
          box-shadow: 0 2px 8px var(--color-shadow);
          padding: 20px;
          grid-column: span 3;
        }

        .card.wide {
          grid-column: span 6;
        }

        .card.tall {
          grid-row: span 2;
        }

        .kpi-card {
          display: flex;
          flex-direction: column;
        }

        .card-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--color-text-secondary);
          margin-bottom: 12px;
        }

        .card-value {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .card-change {
          font-size: 0.875rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .card-change.positive {
          color: var(--color-positive);
        }

        .card-change.negative {
          color: var(--color-negative);
        }

        .card-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chart-placeholder {
          width: 100%;
          height: 200px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: center;
          position: relative;
        }

        .chart-line {
          position: absolute;
          width: 100%;
          height: 2px;
          background-color: var(--color-border);
        }

        .chart-line:first-child {
          bottom: 25%;
        }

        .chart-line:nth-child(2) {
          bottom: 50%;
        }

        .chart-line:last-child {
          bottom: 75%;
        }

        .pie {
          width: 160px;
          height: 160px;
          border-radius: 50%;
          position: relative;
          overflow: hidden;
        }

        .pie-segment {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          clip-path: polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 0%);
        }

        .bar-chart {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          padding: 0 10px;
        }

        .bar {
          width: 12%;
          background-color: var(--color-primary);
          border-radius: 4px 4px 0 0;
        }

        .table-card {
          overflow: hidden;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th, .data-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid var(--color-border);
        }

        .data-table th {
          font-weight: 600;
          color: var(--color-text-secondary);
        }

        .data-table tbody tr:hover {
          background-color: var(--color-primary-light);
        }

        .data-table .positive {
          color: var(--color-positive);
        }

        .data-table .negative {
          color: var(--color-negative);
        }

        .footer {
          margin-top: auto;
          padding: 16px 0;
          background-color: var(--color-bg-secondary);
          border-top: 1px solid var(--color-border);
        }

        .footer-content {
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .footer-copyright {
          font-size: 0.875rem;
          color: var(--color-text-tertiary);
        }

        .footer-links {
          display: flex;
          gap: 16px;
        }

        .footer-link {
          font-size: 0.875rem;
          color: var(--color-text-tertiary);
          transition: color 0.2s ease;
        }

        .footer-link:hover {
          color: var(--color-primary);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .sidebar {
            width: 200px;
          }
          
          .dashboard-grid {
            grid-template-columns: repeat(6, 1fr);
          }
          
          .card {
            grid-column: span 3;
          }
          
          .card.wide {
            grid-column: span 6;
          }
        }

        @media (max-width: 768px) {
          .main-content {
            flex-direction: column;
          }
          
          .sidebar {
            width: 100%;
            height: auto;
            position: static;
            border-right: none;
            border-bottom: 1px solid var(--color-border);
            padding: 16px;
          }
          
          .sidebar-section {
            margin-bottom: 16px;
          }
          
          .dashboard-grid {
            grid-template-columns: repeat(2, 1fr);
            grid-gap: 16px;
          }
          
          .card {
            grid-column: span 1;
          }
          
          .card.wide {
            grid-column: span 2;
          }
          
          .footer-content {
            flex-direction: column;
            gap: 12px;
            text-align: center;
          }
        }

        @media (max-width: 640px) {
          .header-content {
            padding: 0 12px;
          }
          
          .logo-text {
            display: none;
          }
          
          .main-nav {
            gap: 4px;
          }
          
          .nav-item {
            padding: 8px 12px;
          }
          
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
          
          .card {
            grid-column: span 1;
          }
          
          .card.wide {
            grid-column: span 1;
          }
          
          .content {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}