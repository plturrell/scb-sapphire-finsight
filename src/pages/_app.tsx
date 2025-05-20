import '@/styles/globals.css';
import '@/styles/typography.css';
import type { AppProps } from 'next/app';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { registerServiceWorker } from '@/lib/register-service-worker';

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

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    // Register service worker on client side
    registerServiceWorker();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <Head>
          <title>FinSight - SCB Sapphire Finance Dashboard</title>
          <meta name="description" content="SCB Sapphire financial insights and visualization platform" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        </Head>
        <div className="font-sans scb-app-container">
          <Component {...pageProps} />
        </div>
      </ChakraProvider>
    </QueryClientProvider>
  );
}