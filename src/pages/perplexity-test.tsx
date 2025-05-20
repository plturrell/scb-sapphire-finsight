import React, { useState } from 'react';
import Head from 'next/head';

export default function PerplexityTest() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  // Test the direct API call using the API key from vercel.json
  const testDirectApiCall = async () => {
    setLoading(true);
    setError('');
    
    try {
      const directResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [{ role: 'user', content: 'Hello, is this API working?' }],
          temperature: 0.2,
          max_tokens: 100
        })
      });
      
      if (!directResponse.ok) {
        const errorText = await directResponse.text();
        setError(`Direct API error: ${directResponse.status} - ${errorText}`);
      } else {
        const data = await directResponse.json();
        setResult(`Direct API success: ${data.choices[0].message.content}`);
      }
    } catch (err) {
      setError(`Direct API exception: ${err.message}`);
    }
    
    setLoading(false);
  };
  
  // Test the simple proxy
  const testSimpleProxy = async () => {
    setLoading(true);
    setError('');
    
    try {
      const simpleResponse = await fetch('/api/perplexity-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello, is this proxy working?' }]
        })
      });
      
      if (!simpleResponse.ok) {
        const errorText = await simpleResponse.text();
        setError(`Simple proxy error: ${simpleResponse.status} - ${errorText}`);
      } else {
        const data = await simpleResponse.json();
        setResult(`Simple proxy success: ${data.choices[0].message.content}`);
      }
    } catch (err) {
      setError(`Simple proxy exception: ${err.message}`);
    }
    
    setLoading(false);
  };
  
  // Test the original proxy
  const testOriginalProxy = async () => {
    setLoading(true);
    setError('');
    
    try {
      const proxyResponse = await fetch('/api/perplexity-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello, is this proxy working?' }]
        })
      });
      
      if (!proxyResponse.ok) {
        const errorText = await proxyResponse.text();
        setError(`Original proxy error: ${proxyResponse.status} - ${errorText}`);
      } else {
        const data = await proxyResponse.json();
        setResult(`Original proxy success: ${data.choices[0].message.content}`);
      }
    } catch (err) {
      setError(`Original proxy exception: ${err.message}`);
    }
    
    setLoading(false);
  };
  
  // Check environment
  const checkEnvironment = () => {
    const key = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY || 'not set';
    const maskedKey = key !== 'not set' ? 
      `${key.substring(0, 5)}...${key.substring(key.length - 3)}` : 
      'not set';
    
    setResult(`Environment: 
      NEXT_PUBLIC_PERPLEXITY_API_KEY: ${maskedKey}
      NODE_ENV: ${process.env.NODE_ENV}
    `);
  };

  return (
    <div className='p-8 max-w-4xl mx-auto'>
      <Head>
        <title>Perplexity API Test</title>
      </Head>
      
      <h1 className='text-2xl font-bold mb-6'>Perplexity API Test</h1>
      
      <div className='space-y-4 mb-8'>
        <button 
          onClick={testDirectApiCall}
          disabled={loading}
          className='px-4 py-2 bg-blue-500 text-white rounded mr-4 disabled:opacity-50'
        >
          Test Direct API Call
        </button>
        
        <button 
          onClick={testSimpleProxy}
          disabled={loading}
          className='px-4 py-2 bg-green-500 text-white rounded mr-4 disabled:opacity-50'
        >
          Test Simple Proxy
        </button>
        
        <button 
          onClick={testOriginalProxy}
          disabled={loading}
          className='px-4 py-2 bg-purple-500 text-white rounded mr-4 disabled:opacity-50'
        >
          Test Original Proxy
        </button>
        
        <button 
          onClick={checkEnvironment}
          className='px-4 py-2 bg-gray-500 text-white rounded'
        >
          Check Environment
        </button>
      </div>
      
      {loading && <p className='text-gray-500'>Loading...</p>}
      
      {error && (
        <div className='p-4 bg-red-100 text-red-800 rounded mb-4'>
          <h2 className='font-bold'>Error:</h2>
          <pre className='whitespace-pre-wrap'>{error}</pre>
        </div>
      )}
      
      {result && (
        <div className='p-4 bg-green-100 text-green-800 rounded'>
          <h2 className='font-bold'>Result:</h2>
          <pre className='whitespace-pre-wrap'>{result}</pre>
        </div>
      )}
    </div>
  );
}
