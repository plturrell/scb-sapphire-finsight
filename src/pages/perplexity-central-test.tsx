import React, { useState } from 'react';
import Head from 'next/head';

export default function PerplexityCentralizedTest() {
  const [query, setQuery] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  // Test the new centralized API endpoint
  const testCentralizedAPI = async () => {
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }
    
    setLoading(true);
    setError('');
    setResult('');
    
    try {
      const response = await fetch('/api/perplexity-centralized', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are a helpful financial assistant.' },
            { role: 'user', content: query }
          ],
          temperature: 0.2,
          max_tokens: 500
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        setError(`API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      } else {
        const data = await response.json();
        setResult(data.choices[0]?.message?.content || 'No response content');
      }
    } catch (err) {
      setError(`Exception: ${err.message}`);
    }
    
    setLoading(false);
  };

  return (
    <div className='p-8 max-w-4xl mx-auto'>
      <Head>
        <title>Centralized Perplexity API Test</title>
      </Head>
      
      <h1 className='text-2xl font-bold mb-6'>Centralized Perplexity API Test</h1>
      <p className='mb-4 text-gray-600'>
        This page tests the new centralized Perplexity service that has a clean implementation with proper API key handling.
      </p>
      
      <div className='space-y-4 mb-8'>
        <div className='flex flex-col'>
          <label htmlFor='query' className='text-sm font-medium mb-1'>
            Enter your query:
          </label>
          <input
            id='query'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Ask anything about finance...'
            className='border rounded p-2 w-full'
          />
        </div>
        
        <button 
          onClick={testCentralizedAPI}
          disabled={loading || !query.trim()}
          className='px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50'
        >
          {loading ? 'Loading...' : 'Submit Query'}
        </button>
      </div>
      
      {error && (
        <div className='p-4 bg-red-100 text-red-800 rounded mb-4'>
          <h2 className='font-bold'>Error:</h2>
          <pre className='whitespace-pre-wrap'>{error}</pre>
        </div>
      )}
      
      {result && (
        <div className='p-4 bg-green-100 text-green-800 rounded'>
          <h2 className='font-bold'>Result:</h2>
          <div className='whitespace-pre-wrap'>{result}</div>
        </div>
      )}
    </div>
  );
}
