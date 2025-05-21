import React, { useState } from 'react';

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
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 0' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          Perplexity API Migration Test
        </h1>
        
        <p style={{ fontSize: '1.25rem', marginBottom: '2rem', textAlign: 'center' }}>
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
            style={{ padding: '0.5rem 1rem', backgroundColor: '#4A90E2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' }}
          >
            {loading.all ? 'Testing All...' : 'Test All Endpoints'}
          </button>
          
          <button 
            onClick={testDebugEndpoints} 
            disabled={loading.debug}
            style={{ padding: '0.5rem 1rem', backgroundColor: '#4A90E2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            {loading.debug ? 'Testing...' : 'Test Debug Endpoint'}
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <button onClick={testProxyEndpoint} disabled={loading.proxy} style={{ padding: '0.5rem 1rem', backgroundColor: '#4A90E2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', margin: '4px' }}>
            {loading.proxy ? 'Testing...' : 'Test Proxy Endpoint'}
          </button>
          
          <button onClick={testSimpleEndpoint} disabled={loading.simple} style={{ padding: '0.5rem 1rem', backgroundColor: '#4A90E2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', margin: '4px' }}>
            {loading.simple ? 'Testing...' : 'Test Simple Endpoint'}
          </button>
          
          <button onClick={testCentralizedEndpoint} disabled={loading.centralized} style={{ padding: '0.5rem 1rem', backgroundColor: '#4A90E2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', margin: '4px' }}>
            {loading.centralized ? 'Testing...' : 'Test Centralized Endpoint'}
          </button>
          
          <button onClick={testMarketNewsEndpoint} disabled={loading.marketNews} style={{ padding: '0.5rem 1rem', backgroundColor: '#4A90E2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', margin: '4px' }}>
            {loading.marketNews ? 'Testing...' : 'Test Market News Endpoint'}
          </button>
          
          <button onClick={testTariffSearchEndpoint} disabled={loading.tariffSearch} style={{ padding: '0.5rem 1rem', backgroundColor: '#4A90E2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', margin: '4px' }}>
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
