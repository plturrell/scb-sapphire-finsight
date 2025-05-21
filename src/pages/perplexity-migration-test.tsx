import React, { useState } from 'react';
import styles from '@/styles/Home.module.css';

/**
 * This page tests all the migrated Perplexity API endpoints
 * to verify they're working properly with the centralized service
 */
export default function PerplexityMigrationTest() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  // Test all endpoints
  const testAllEndpoints = async () => {
    setError(null);
    setLoading({ all: true });
    try {
      await testProxyEndpoint();
      await testSimpleEndpoint();
      await testCentralizedEndpoint();
      await testMarketNewsEndpoint();
      await testTariffSearchEndpoint();
    } catch (error: any) {
      setError(`Error testing all endpoints: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading({ ...loading, all: false });
    }
  };

  // Test the perplexity-proxy endpoint
  const testProxyEndpoint = async () => {
    setLoading({ ...loading, proxy: true });
    try {
      const response = await fetch('/api/perplexity-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: 'Test message for perplexity-proxy endpoint' }
          ],
          temperature: 0.2,
          max_tokens: 50
        })
      });

      const data = await response.json();
      setResults({ ...results, proxy: { status: response.status, data } });
    } catch (error: any) {
      setResults({ 
        ...results, 
        proxy: { error: error?.message || 'Unknown error' } 
      });
    } finally {
      setLoading({ ...loading, proxy: false });
    }
  };

  // Test the perplexity-simple endpoint
  const testSimpleEndpoint = async () => {
    setLoading({ ...loading, simple: true });
    try {
      const response = await fetch('/api/perplexity-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: 'Test message for perplexity-simple endpoint' }
          ]
        })
      });

      const data = await response.json();
      setResults({ ...results, simple: { status: response.status, data } });
    } catch (error: any) {
      setResults({ 
        ...results, 
        simple: { error: error?.message || 'Unknown error' } 
      });
    } finally {
      setLoading({ ...loading, simple: false });
    }
  };

  // Test the perplexity-centralized endpoint
  const testCentralizedEndpoint = async () => {
    setLoading({ ...loading, centralized: true });
    try {
      const response = await fetch('/api/perplexity-centralized', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: 'Test message for perplexity-centralized endpoint' }
          ],
          temperature: 0.2,
          max_tokens: 50
        })
      });

      const data = await response.json();
      setResults({ ...results, centralized: { status: response.status, data } });
    } catch (error: any) {
      setResults({ 
        ...results, 
        centralized: { error: error?.message || 'Unknown error' } 
      });
    } finally {
      setLoading({ ...loading, centralized: false });
    }
  };

  // Test the market-news endpoint
  const testMarketNewsEndpoint = async () => {
    setLoading({ ...loading, marketNews: true });
    try {
      const response = await fetch('/api/market-news?topic=forex&limit=1');
      const data = await response.json();
      setResults({ ...results, marketNews: { status: response.status, data } });
    } catch (error: any) {
      setResults({ 
        ...results, 
        marketNews: { error: error?.message || 'Unknown error' } 
      });
    } finally {
      setLoading({ ...loading, marketNews: false });
    }
  };

  // Test the tariff-search endpoint
  const testTariffSearchEndpoint = async () => {
    setLoading({ ...loading, tariffSearch: true });
    try {
      const response = await fetch('/api/tariff-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product: 'electronics',
          sourceCountry: 'China',
          destinationCountry: 'United States'
        })
      });

      const data = await response.json();
      setResults({ ...results, tariffSearch: { status: response.status, data } });
    } catch (error: any) {
      setResults({ 
        ...results, 
        tariffSearch: { error: error?.message || 'Unknown error' } 
      });
    } finally {
      setLoading({ ...loading, tariffSearch: false });
    }
  };

  // Test the debug endpoints
  const testDebugEndpoints = async () => {
    setLoading({ ...loading, debug: true });
    try {
      // Test perplexity-debug endpoint
      const debugResponse = await fetch('/api/perplexity-debug');
      const debugData = await debugResponse.json();
      
      // No need to test keys-test endpoint as it's redundant now
      
      setResults({ 
        ...results, 
        debug: { 
          status: debugResponse.status, 
          data: debugData 
        } 
      });
    } catch (error: any) {
      setResults({ 
        ...results, 
        debug: { error: error?.message || 'Unknown error' } 
      });
    } finally {
      setLoading({ ...loading, debug: false });
    }
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          Perplexity API Migration Test
        </h1>
        
        <p className={styles.description}>
          Test all endpoints after migrating to the centralized PerplexityService
        </p>
        
        {error && (
          <div style={{ color: 'red', margin: '20px 0' }}>
            {error}
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
            onClick={testAllEndpoints} 
            disabled={loading.all}
            className={styles.button}
          >
            {loading.all ? 'Testing All...' : 'Test All Endpoints'}
          </button>
          
          <button 
            onClick={testDebugEndpoints} 
            disabled={loading.debug}
            className={styles.button}
          >
            {loading.debug ? 'Testing...' : 'Test Debug Endpoint'}
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <button onClick={testProxyEndpoint} disabled={loading.proxy} className={styles.button}>
            {loading.proxy ? 'Testing...' : 'Test Proxy Endpoint'}
          </button>
          
          <button onClick={testSimpleEndpoint} disabled={loading.simple} className={styles.button}>
            {loading.simple ? 'Testing...' : 'Test Simple Endpoint'}
          </button>
          
          <button onClick={testCentralizedEndpoint} disabled={loading.centralized} className={styles.button}>
            {loading.centralized ? 'Testing...' : 'Test Centralized Endpoint'}
          </button>
          
          <button onClick={testMarketNewsEndpoint} disabled={loading.marketNews} className={styles.button}>
            {loading.marketNews ? 'Testing...' : 'Test Market News Endpoint'}
          </button>
          
          <button onClick={testTariffSearchEndpoint} disabled={loading.tariffSearch} className={styles.button}>
            {loading.tariffSearch ? 'Testing...' : 'Test Tariff Search Endpoint'}
          </button>
        </div>
        
        <div style={{ width: '100%' }}>
          <h2>Test Results</h2>
          
          {Object.keys(results).length === 0 ? (
            <p>No tests run yet</p>
          ) : (
            <div>
              {Object.entries(results).map(([endpoint, result]) => (
                <div key={endpoint} style={{ marginBottom: '20px' }}>
                  <h3>{endpoint} Endpoint Result</h3>
                  <pre style={{ 
                    background: '#f5f5f5', 
                    padding: '10px', 
                    borderRadius: '5px',
                    overflow: 'auto',
                    maxHeight: '300px'
                  }}>
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
