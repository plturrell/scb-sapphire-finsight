import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Essential viewport configuration for responsive design */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        
        {/* Apple/iOS specific */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FinSight" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        
        {/* Android specific */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0072AA" />
        
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Favicon */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        
        {/* Fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        
        {/* Critical CSS inlined to ensure styles work */}
        <style dangerouslySetInnerHTML={{ __html: `
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
          
          /* Reset and Base Styles */
          *, *::before, *::after {
            box-sizing: border-box;
          }
          
          html, body {
            margin: 0;
            padding: 0;
            font-family: 'SCProsperSans', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', system-ui, sans-serif;
            background-color: #f5f7fa;
            color: #333;
            height: 100%;
            line-height: 1.5;
          }
          
          /* Critical Colors */
          :root {
            --scb-honolulu-blue: 0, 114, 170;
            --scb-american-green: 33, 170, 71;
            --scb-white: 255, 255, 255;
            --scb-light-gray: 245, 247, 250;
            --scb-dark-gray: 82, 83, 85;
            --scb-muted-red: 211, 55, 50;
            --scb-border: 229, 231, 235;
          }
          
          /* Button Styles */
          button {
            font-family: 'SCProsperSans', -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
            background-color: rgb(var(--scb-honolulu-blue));
            color: white;
            border: none;
            border-radius: 0.25rem;
            padding: 0.5rem 1rem;
            cursor: pointer;
            font-weight: 500;
          }
          
          button:hover {
            opacity: 0.9;
          }
          
          /* Component Styles */
          .chakra-heading, h1, h2, h3, h4, h5, h6,
          .chakra-text, p, span, div, button, input, textarea, select {
            font-family: 'SCProsperSans', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', system-ui, sans-serif !important;
          }
          
          h1, .h1 {
            font-size: 2rem;
            font-weight: 700;
          }
          
          h2, .h2 {
            font-size: 1.75rem;
            font-weight: 600;
          }
          
          h3, .h3 {
            font-size: 1.5rem;
            font-weight: 600;
          }
          
          h4, .h4 {
            font-size: 1.25rem;
            font-weight: 500;
          }
          
          /* Layout Containers */
          .container {
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 1rem;
          }
          
          /* Navigation */
          .nav {
            background-color: rgb(var(--scb-honolulu-blue));
            color: white;
            padding: 1rem;
          }
          
          /* Card Styles */
          .card {
            background: white;
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            padding: 1rem;
            margin-bottom: 1rem;
          }
          
          /* Utility Classes */
          .text-center { text-align: center; }
          .flex { display: flex; }
          .flex-col { flex-direction: column; }
          .items-center { align-items: center; }
          .justify-between { justify-content: space-between; }
          .gap-4 { gap: 1rem; }
          .p-4 { padding: 1rem; }
          .m-4 { margin: 1rem; }
          .rounded { border-radius: 0.25rem; }
          
          /* Colors */
          .bg-primary { background-color: rgb(var(--scb-honolulu-blue)); }
          .text-primary { color: rgb(var(--scb-honolulu-blue)); }
          .bg-white { background-color: white; }
          .text-white { color: white; }
          
          /* Fix for Chakra UI */
          .chakra-ui-light,
          .chakra-ui-dark {
            color-scheme: light dark;
          }
        `}} />
        
        {/* Prevent zoom on input focus for iOS */}
        <meta name="format-detection" content="telephone=no" />
        
        {/* SEO and social */}
        <meta name="description" content="SCB Sapphire FinSight - Advanced Financial Analytics Dashboard" />
        <meta property="og:title" content="SCB Sapphire FinSight" />
        <meta property="og:description" content="Advanced Financial Analytics Dashboard" />
        <meta property="og:image" content="/og-image.png" />
      
        {/* SC Prosper Sans Font Preloading */}
        <link 
          rel="preload" 
          href="/fonts/SCProsperSans-Regular.woff2" 
          as="font" 
          type="font/woff2" 
          crossOrigin="anonymous" 
        />
        <link 
          rel="preload" 
          href="/fonts/SCProsperSans-Medium.woff2" 
          as="font" 
          type="font/woff2" 
          crossOrigin="anonymous" 
        />
        <link 
          rel="preload" 
          href="/fonts/SCProsperSans-Bold.woff2" 
          as="font" 
          type="font/woff2" 
          crossOrigin="anonymous" 
        />
        <link 
          rel="preload" 
          href="/fonts/SCProsperSans-Light.woff2" 
          as="font" 
          type="font/woff2" 
          crossOrigin="anonymous" 
        />
        
        {/* External CSS for production */}
        <link rel="stylesheet" href="/styles/scb-styles.css" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}