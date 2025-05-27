// import '@/styles/globals.css';
// import '@/styles/typography.css';
import type { AppProps } from 'next/app';
import { ChakraProvider, extendTheme, CSSReset } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { registerServiceWorker } from '@/lib/register-service-worker';
import dynamic from 'next/dynamic';
import { UIPreferencesProvider } from '@/context/UIPreferencesContext';
import { IconSystemProvider } from '@/components/IconSystem';
import { SFSymbolsCSS } from '@/lib/sf-symbols';

// Import Emotion's createCache and StyleProvider from the correct location
import createCache from '@emotion/cache';
import { CacheProvider as StyleProvider } from '@emotion/react';

// Import GlobalJouleAssistant with SSR disabled
const GlobalJouleAssistant = dynamic(
  () => import('@/components/GlobalJouleAssistant'),
  { ssr: false }
);

// Custom theme to match SCB colors with Chakra UI
const theme = extendTheme({
  colors: {
    primary: {
      50: '#e0f0f7',
      100: '#b3d7ea',
      200: '#8cbedc',
      300: '#66a5cd',
      400: '#4991c2',
      500: '#0072AA', // SCB Honolulu Blue
      600: '#005e8c',
      700: '#004a6d',
      800: '#00364f',
      900: '#002230',
    },
    secondary: {
      50: '#e8f8ed',
      100: '#c5ecd1',
      200: '#a3e0b6',
      300: '#82d49b',
      400: '#51c173',
      500: '#21AA47', // SCB American Green
      600: '#1c8939',
      700: '#16682c',
      800: '#11481f',
      900: '#0a2811',
    },
  },
  fonts: {
    heading: "'SC Prosper Sans', 'Inter', sans-serif",
    body: "'SC Prosper Sans', 'Inter', sans-serif",
  },
});

// Create a custom cache with higher specificity
const cache = createCache({
  key: 'scb-sapphire',
  // Force higher specificity for our custom styles
  stylisPlugins: [
    (context, content) => {
      if (context === 2) {
        return content.replace(/css-([a-zA-Z0-9]+)/g, 'scb-$1');
      }
      return content;
    }
  ],
});

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Register service worker on client side
    registerServiceWorker();
    // Force CSS recalculation
    setMounted(true);
    
    // Apply custom styles directly to ensure they're not overridden
    document.documentElement.style.setProperty('--scb-honolulu-blue', '0, 114, 170');
    document.documentElement.style.setProperty('--scb-american-green', '33, 170, 71');
    document.documentElement.classList.add('scb-styled');
  }, []);

  return (
    <StyleProvider value={cache}>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider theme={theme} resetCSS={false}>
          <UIPreferencesProvider>
            <CSSReset />
            <Head>
              <title>FinSight - SCB Sapphire Finance Dashboard</title>
              <meta name="description" content="SCB Sapphire financial insights and visualization platform" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <link rel="icon" href="/favicon.ico" />
              <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
              <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
              {/* Force custom styles to take precedence */}
              <style>{`
                /* SCB Brand Colors */
                :root {
                  --scb-honolulu-blue: 0, 114, 170 !important; 
                  --scb-american-green: 33, 170, 71 !important;
                  --scb-white: 255, 255, 255 !important;
                  --scb-light-gray: 245, 247, 250 !important;
                  --scb-dark-gray: 82, 83, 85 !important;
                  --scb-muted-red: 211, 55, 50 !important;
                  --scb-border: 229, 231, 235 !important;
                  
                  /* SAP Fiori Integration */
                  --fiori-shell-header-bg: var(--scb-honolulu-blue) !important;
                  --fiori-shell-header-text: 255, 255, 255 !important;
                  --fiori-sidebar-bg: var(--scb-white) !important;
                  --fiori-sidebar-text: var(--scb-dark-gray) !important;
                  --fiori-sidebar-active-bg: var(--scb-honolulu-blue) !important;
                  --fiori-sidebar-active-text: 255, 255, 255 !important;
                  --fiori-content-bg: var(--scb-light-gray) !important;
                  --fiori-tile-bg: 255, 255, 255 !important;
                  --fiori-action-color: var(--scb-american-green) !important;
                  --fiori-button-primary-bg: var(--scb-honolulu-blue) !important;
                  --fiori-button-primary-text: 255, 255, 255 !important;
                  --fiori-button-secondary-bg: 255, 255, 255 !important;
                  --fiori-button-secondary-text: var(--scb-honolulu-blue) !important;
                  --fiori-notification-bg: var(--scb-honolulu-blue) !important;
                  
                  /* SAP Horizon Theme */
                  --horizon-blue: 0, 114, 170 !important;
                  --horizon-green: 33, 170, 71 !important;
                  --horizon-red: 211, 55, 50 !important;
                  --horizon-neutral-gray: 82, 83, 85 !important;
                  --horizon-focus-color: 0, 94, 150 !important;
                  
                  /* Financial Data Presentation */
                  --fiori-positive-text: var(--scb-american-green) !important;
                  --fiori-negative-text: var(--scb-muted-red) !important;
                  --fiori-neutral-text: var(--scb-honolulu-blue) !important;
                  --fiori-positive-bg: rgba(var(--scb-american-green), 0.1) !important;
                  --fiori-negative-bg: rgba(var(--scb-muted-red), 0.1) !important;
                  --fiori-neutral-bg: rgba(var(--scb-honolulu-blue), 0.1) !important;
                  
                  /* General Application */
                  --primary: var(--scb-honolulu-blue) !important;
                  --secondary: var(--scb-american-green) !important;
                }
                
                /* Component Styling */
                .fiori-shell-header {
                  background-color: rgb(var(--scb-honolulu-blue)) !important;
                  color: white !important;
                  height: 3rem !important;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08) !important;
                  border-bottom: 1px solid rgba(0, 0, 0, 0.1) !important;
                }
                
                .fiori-sidebar {
                  background-color: rgb(var(--fiori-sidebar-bg)) !important;
                  border-right: 1px solid rgb(var(--scb-border)) !important;
                  width: 16rem !important;
                }
                
                .fiori-sidebar-item {
                  color: rgb(var(--fiori-sidebar-text)) !important;
                  padding: 0.75rem 1rem !important;
                  transition: background-color 0.2s !important;
                  border-left: 4px solid transparent !important;
                }
                
                .fiori-sidebar-item:hover {
                  background-color: rgba(var(--scb-honolulu-blue), 0.1) !important;
                }
                
                .fiori-sidebar-item.active {
                  background-color: rgba(var(--scb-honolulu-blue), 0.1) !important;
                  border-left-color: rgb(var(--scb-honolulu-blue)) !important;
                  color: rgb(var(--scb-honolulu-blue)) !important;
                  font-weight: 500 !important;
                }
                
                .fiori-tile {
                  background-color: white !important;
                  border: 1px solid rgb(var(--scb-border)) !important;
                  border-radius: 0.25rem !important;
                  padding: 1rem !important;
                  transition: box-shadow 0.2s, transform 0.2s !important;
                  height: 100% !important;
                  display: flex !important;
                  flex-direction: column !important;
                  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05) !important;
                }
                
                .fiori-tile:hover {
                  box-shadow: 0 4px 6px rgba(var(--scb-honolulu-blue), 0.1) !important;
                  transform: translateY(-2px) !important;
                }
                
                /* Touch-friendly styles */
                .touch-manipulation {
                  touch-action: manipulation !important;
                }
                
                .touch-min-h {
                  min-height: 44px !important;
                }
                
                /* Typography */
                .scb-title {
                  font-family: "SC Prosper Sans", Inter, system-ui, sans-serif !important;
                  font-weight: 700 !important;
                  font-size: clamp(1.25rem, 3vw, 1.75rem) !important;
                  line-height: 1.25 !important;
                  letter-spacing: -0.01em !important;
                  color: rgb(var(--scb-honolulu-blue)) !important;
                }
                
                .scb-section-header {
                  font-family: "SC Prosper Sans", Inter, system-ui, sans-serif !important;
                  font-weight: 500 !important;
                  font-size: clamp(1rem, 2.5vw, 1.25rem) !important;
                  line-height: 1.4 !important;
                  color: rgb(var(--scb-dark-gray)) !important;
                  margin-bottom: 0.75rem !important;
                }
                
                /* Animation utilities */
                .animate-fadeIn {
                  animation: fadeIn 0.3s ease-out !important;
                }
                
                .animate-slide-in {
                  animation: slideIn 0.3s ease-out !important;
                }
                
                /* Add splash screen styling */
                .scb-splash {
                  position: fixed !important;
                  top: 0 !important;
                  left: 0 !important;
                  right: 0 !important;
                  bottom: 0 !important;
                  background-color: rgb(var(--scb-honolulu-blue)) !important;
                  display: flex !important;
                  align-items: center !important;
                  justify-content: center !important;
                  z-index: 9999 !important;
                  transition: opacity 0.5s ease-out !important;
                }
                
                .scb-splash-logo {
                  width: 180px !important;
                  height: 180px !important;
                  animation: pulse 2s infinite !important;
                }
                
                @keyframes pulse {
                  0% { transform: scale(0.95); opacity: 0.8; }
                  50% { transform: scale(1.05); opacity: 1; }
                  100% { transform: scale(0.95); opacity: 0.8; }
                }

                /* Dark mode variables */
                .dark {
                  --scb-bg-primary: 17, 24, 39 !important; /* gray-900 */
                  --scb-bg-secondary: 31, 41, 55 !important; /* gray-800 */
                  --scb-bg-tertiary: 55, 65, 81 !important; /* gray-700 */
                  --scb-text-primary: 255, 255, 255 !important;
                  --scb-text-secondary: 209, 213, 219 !important; /* gray-300 */
                  --scb-text-tertiary: 156, 163, 175 !important; /* gray-400 */
                  --scb-border-primary: 75, 85, 99 !important; /* gray-600 */
                  --scb-border-secondary: 55, 65, 81 !important; /* gray-700 */
                  --scb-highlight: 59, 130, 246 !important; /* blue-500 */
                  --scb-highlight-hover: 96, 165, 250 !important; /* blue-400 */
                  
                  /* Form elements */
                  --scb-input-bg: 31, 41, 55 !important; /* gray-800 */
                  --scb-input-border: 75, 85, 99 !important; /* gray-600 */
                  --scb-input-text: 209, 213, 219 !important; /* gray-300 */
                  --scb-input-placeholder: 156, 163, 175 !important; /* gray-400 */
                  
                  /* Buttons */
                  --scb-button-primary-bg: var(--scb-honolulu-blue) !important;
                  --scb-button-primary-text: 255, 255, 255 !important;
                  --scb-button-secondary-bg: 55, 65, 81 !important; /* gray-700 */
                  --scb-button-secondary-text: 209, 213, 219 !important; /* gray-300 */
                }
                
                /* Component styles with dark mode */
                .dark .fiori-tile {
                  background-color: rgb(var(--scb-bg-secondary)) !important;
                  border-color: rgb(var(--scb-border-secondary)) !important;
                  color: rgb(var(--scb-text-primary)) !important;
                }
                
                .dark .scb-title {
                  color: rgb(var(--scb-text-primary)) !important;
                }
                
                .dark .scb-section-header {
                  color: rgb(var(--scb-text-secondary)) !important;
                }

                .dark .fiori-sidebar-item {
                  color: rgb(var(--scb-text-secondary)) !important;
                }
                
                .dark .fiori-sidebar-item:hover {
                  background-color: rgba(var(--scb-highlight), 0.1) !important;
                }
                
                .dark .fiori-sidebar-item.active {
                  background-color: rgba(var(--scb-honolulu-blue), 0.2) !important;
                  border-left-color: rgb(var(--scb-honolulu-blue)) !important;
                  color: rgb(var(--scb-text-secondary)) !important;
                }
                
                /* Form elements - dark mode */
                .dark input, .dark select, .dark textarea {
                  background-color: rgb(var(--scb-input-bg)) !important;
                  border-color: rgb(var(--scb-input-border)) !important;
                  color: rgb(var(--scb-input-text)) !important;
                }
                
                .dark input::placeholder, .dark textarea::placeholder {
                  color: rgb(var(--scb-input-placeholder)) !important;
                }
                
                /* Transitions for theme switching */
                .theme-transition {
                  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
                }
              `}</style>
            </Head>
            <div className="font-sans scb-app-container scb-styled">
              {mounted && (
                <IconSystemProvider>
                  <Component {...pageProps} />
                  <GlobalJouleAssistant />
                  {/* Inject SF Symbols CSS */}
                  <style jsx global>{`${SFSymbolsCSS}`}</style>
                </IconSystemProvider>
              )}
            </div>
          </UIPreferencesProvider>
        </ChakraProvider>
      </QueryClientProvider>
    </StyleProvider>
  );
}