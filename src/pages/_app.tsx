import '@/styles/globals.css';
import '@/styles/apple-enhancements.css';
import '@/styles/typography.css';
import '@/styles/unified.css';
import '@/styles/p3-colors.css';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import ConsistencyProvider from '../components/ConsistencyProvider';
import { ThemeProvider } from '../components/ThemeProvider';
import AppleDesignProvider from '../components/AppleDesignProvider';
import { applyBrowserShims } from '../utils/BrowserCompatibility';

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Apply browser compatibility shims, including P3 color detection
    applyBrowserShims();
    
    // Mark as client-side rendered
    setIsClient(true);
    
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then(
          (registration) => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
          },
          (err) => {
            console.log('ServiceWorker registration failed: ', err);
          }
        );
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Head>
        <title>Finsight - Standard Chartered Bank</title>
        <meta name="description" content="Finsight - Financial insights and visualization platform powered by SAP Fiori" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no" />
        <meta name="color-scheme" content="light dark" />
        <meta name="format-detection" content="telephone=no, address=no, email=no, date=no" />
        <meta name="theme-color" content="#0072AA" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      {isClient ? (
        <ThemeProvider>
          <AppleDesignProvider>
            <ConsistencyProvider>
              <Component {...pageProps} />
            </ConsistencyProvider>
          </AppleDesignProvider>
        </ThemeProvider>
      ) : (
        // Apple-style skeleton loader with subtle animation
        <div className="glass-effect" style={{ 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(12px)'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div className="scb-logo" style={{
              marginBottom: '20px'
            }}>
              <img 
                src="/images/sc-logo.png" 
                alt="Standard Chartered Bank" 
                style={{ 
                  height: '60px',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                }} 
              />
            </div>
            <div className="loading-skeleton" style={{
              width: '100px',
              height: '6px',
              borderRadius: '3px'
            }}></div>
          </div>
        </div>
      )}
    </QueryClientProvider>
  );
}