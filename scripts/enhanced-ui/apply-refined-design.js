const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Configuration
const outputDir = path.resolve(__dirname, '../../out');
const refinedCssPath = path.resolve(__dirname, '../../src/styles/refined-system.css');
const pagesConfig = [
  { name: 'index', title: 'FinSight Dashboard' },
  { name: 'vietnam-tariff-dashboard', title: 'Vietnam Tariff Dashboard' },
  { name: 'vietnam-monte-carlo', title: 'Vietnam Monte Carlo Simulation' },
  { name: 'perplexity-test', title: 'Market Intelligence' },
  { name: 'financial-simulation', title: 'Financial Simulation' }
];

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Copy refined CSS to output directory
const stylesDir = path.join(outputDir, 'styles');
if (!fs.existsSync(stylesDir)) {
  fs.mkdirSync(stylesDir, { recursive: true });
}

// Read the refined CSS
let refinedCss = '';
try {
  refinedCss = fs.readFileSync(refinedCssPath, 'utf8');
  fs.writeFileSync(path.join(stylesDir, 'refined-system.css'), refinedCss);
  console.log('✅ Copied refined CSS to output directory');
} catch (err) {
  console.error('❌ Failed to read or copy refined CSS:', err);
  process.exit(1);
}

// HTML template with the refined design system
function createRefinedTemplate(title, content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | SCB Sapphire FinSight</title>
  <link rel="icon" href="/favicon.ico" />
  <link rel="preload" href="/fonts/SCProsperSans-Regular.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/fonts/SCProsperSans-Medium.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/fonts/SCProsperSans-Bold.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="stylesheet" href="/styles/refined-system.css" />
  <style>
    @font-face {
      font-family: 'SC Prosper Sans';
      src: url('/fonts/SCProsperSans-Regular.woff2') format('woff2');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'SC Prosper Sans';
      src: url('/fonts/SCProsperSans-Medium.woff2') format('woff2');
      font-weight: 500;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'SC Prosper Sans';
      src: url('/fonts/SCProsperSans-Bold.woff2') format('woff2');
      font-weight: 700;
      font-style: normal;
      font-display: swap;
    }
  </style>
</head>
<body class="refined-ui">
  <div class="app-container">
    <header class="main-header">
      <div class="logo-container">
        <img src="/images/finsight-logo.svg" alt="FinSight Logo" class="logo" />
        <h1>SCB Sapphire FinSight</h1>
      </div>
      <nav class="main-navigation">
        <ul>
          <li><a href="/" class="nav-link">Dashboard</a></li>
          <li><a href="/vietnam-tariff-dashboard.html" class="nav-link">Vietnam Tariffs</a></li>
          <li><a href="/vietnam-monte-carlo.html" class="nav-link">Monte Carlo</a></li>
          <li><a href="/perplexity-test.html" class="nav-link">Market Intelligence</a></li>
          <li><a href="/financial-simulation.html" class="nav-link">Financial Simulation</a></li>
        </ul>
      </nav>
      <div class="user-controls">
        <button class="icon-button" aria-label="Notifications">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"></path>
          </svg>
        </button>
        <button class="icon-button" aria-label="Settings">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"></path>
          </svg>
        </button>
        <button class="theme-toggle icon-button" aria-label="Toggle dark mode">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" class="light-icon">
            <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41.39.39 1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41.39.39 1.03.39 1.41 0l1.06-1.06z"></path>
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" class="dark-icon">
            <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"></path>
          </svg>
        </button>
      </div>
    </header>

    <main class="content-area">
      ${content}
    </main>

    <footer class="main-footer">
      <div class="footer-content">
        <p>&copy; 2025 SCB Sapphire FinSight. All rights reserved.</p>
        <div class="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact</a>
        </div>
      </div>
    </footer>
  </div>

  <script>
    // Theme toggle functionality
    document.addEventListener('DOMContentLoaded', () => {
      const themeToggle = document.querySelector('.theme-toggle');
      const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Check for saved theme preference or use OS preference
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark' || (!savedTheme && prefersDarkScheme.matches)) {
        document.body.classList.add('dark-mode');
      }

      themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
      });
      
      // Add active class to current nav link
      const currentPath = window.location.pathname;
      const navLinks = document.querySelectorAll('.nav-link');
      navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath || 
            (currentPath === '/' && link.getAttribute('href') === '/') ||
            (currentPath === '/index.html' && link.getAttribute('href') === '/')) {
          link.classList.add('active');
        }
      });
    });
  </script>
</body>
</html>`;
}

// Process each HTML file to apply the refined design
console.log('🔄 Enhancing HTML files with refined design system...');

pagesConfig.forEach(({ name, title }) => {
  const sourcePath = path.join(outputDir, `${name}.html`);
  
  try {
    // Check if the source file exists
    if (fs.existsSync(sourcePath)) {
      // Read the original HTML
      const originalHtml = fs.readFileSync(sourcePath, 'utf8');
      
      // Parse the HTML with cheerio to extract content
      const $ = cheerio.load(originalHtml);
      
      // Extract the main content
      const mainContent = $('#__next').html() || $('main').html() || $('body').html();
      
      // Create new HTML with refined design
      const enhancedHtml = createRefinedTemplate(title, mainContent);
      
      // Write the enhanced HTML back to the file
      fs.writeFileSync(sourcePath, enhancedHtml);
      console.log(`✅ Enhanced ${name}.html with refined design`);
    } else {
      console.warn(`⚠️ Source file ${sourcePath} not found, creating new file`);
      
      // Create a basic placeholder content
      const placeholderContent = `
        <div class="dashboard-container">
          <h2 class="page-title">${title}</h2>
          <div class="card-grid">
            <div class="card">
              <h3>Loading Data...</h3>
              <div class="loader"></div>
            </div>
          </div>
        </div>
      `;
      
      // Create new HTML with refined design
      const newHtml = createRefinedTemplate(title, placeholderContent);
      
      // Write the new HTML file
      fs.writeFileSync(sourcePath, newHtml);
      console.log(`✅ Created new ${name}.html with refined design`);
    }
  } catch (err) {
    console.error(`❌ Error processing ${name}.html:`, err);
  }
});

// Script to enhance specific components with interactive behaviors
function createInteractiveScript() {
  const script = `
// Enhance cards with animation and interaction
function enhanceCards() {
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-4px)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
    });
  });
}

// Create a toast notification system
function createNotificationSystem() {
  const notificationContainer = document.createElement('div');
  notificationContainer.className = 'notification-container';
  document.body.appendChild(notificationContainer);

  window.showNotification = function(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = \`notification notification-\${type}\`;
    notification.innerHTML = \`
      <div class="notification-content">
        <span>\${message}</span>
      </div>
      <button class="notification-close">&times;</button>
    \`;
    
    notificationContainer.appendChild(notification);
    
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.classList.add('notification-hiding');
      setTimeout(() => {
        notification.remove();
      }, 300);
    });
    
    setTimeout(() => {
      notification.classList.add('notification-hiding');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 5000);
    
    // Animate entrance
    setTimeout(() => {
      notification.classList.add('notification-visible');
    }, 10);
  };
}

// Add motion and physics-based animations
function addPhysicsAnimations() {
  const animatableElements = document.querySelectorAll('.animate-physics');
  animatableElements.forEach(element => {
    let isDragging = false;
    let initialX, initialY;
    let currentX = 0, currentY = 0;
    let velocityX = 0, velocityY = 0;
    
    element.style.position = 'relative';
    
    element.addEventListener('mousedown', startDrag);
    element.addEventListener('touchstart', e => {
      const touch = e.touches[0];
      startDrag({ clientX: touch.clientX, clientY: touch.clientY });
    });
    
    function startDrag(e) {
      isDragging = true;
      initialX = e.clientX - currentX;
      initialY = e.clientY - currentY;
      element.style.transition = 'none';
      
      document.addEventListener('mousemove', drag);
      document.addEventListener('touchmove', e => {
        const touch = e.touches[0];
        drag({ clientX: touch.clientX, clientY: touch.clientY });
      });
      
      document.addEventListener('mouseup', endDrag);
      document.addEventListener('touchend', endDrag);
    }
    
    function drag(e) {
      if (isDragging) {
        const newX = e.clientX - initialX;
        const newY = e.clientY - initialY;
        
        velocityX = newX - currentX;
        velocityY = newY - currentY;
        
        currentX = newX;
        currentY = newY;
        
        element.style.transform = \`translate(\${currentX}px, \${currentY}px)\`;
      }
    }
    
    function endDrag() {
      isDragging = false;
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('touchmove', drag);
      document.removeEventListener('mouseup', endDrag);
      document.removeEventListener('touchend', endDrag);
      
      // Apply physics animation to return to original position
      element.style.transition = 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      element.style.transform = 'translate(0, 0)';
      currentX = 0;
      currentY = 0;
    }
  });
}

// Initialize all UI enhancements
document.addEventListener('DOMContentLoaded', () => {
  enhanceCards();
  createNotificationSystem();
  addPhysicsAnimations();
  
  // Display an initial welcome notification
  setTimeout(() => {
    window.showNotification('Welcome to the enhanced SCB Sapphire FinSight dashboard!', 'success');
  }, 1000);
});
  `;
  
  return script;
}

// Add the interactive script to each page
pagesConfig.forEach(({ name }) => {
  const filePath = path.join(outputDir, `${name}.html`);
  
  try {
    if (fs.existsSync(filePath)) {
      let html = fs.readFileSync(filePath, 'utf8');
      
      // Check if the script is already added
      if (!html.includes('enhanceCards()')) {
        // Add the interactive script before the closing body tag
        const interactiveScript = `<script>${createInteractiveScript()}</script>`;
        html = html.replace('</body>', `${interactiveScript}\n</body>`);
        
        // Write the updated HTML
        fs.writeFileSync(filePath, html);
        console.log(`✅ Added interactive behaviors to ${name}.html`);
      }
    }
  } catch (err) {
    console.error(`❌ Error adding interactive script to ${name}.html:`, err);
  }
});

console.log('✨ All HTML files enhanced with refined design system!');