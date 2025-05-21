import React, { useState } from 'react';
import Head from 'next/head';
import { 
  Terminal, 
  Code, 
  Send, 
  Copy, 
  Play, 
  CheckCircle,
  X,
  ChevronDown, 
  Database, 
  Server, 
  Key, 
  Lock, 
  Settings, 
  HelpCircle,
  FileJson,
  AlertTriangle, 
  RefreshCw
} from 'lucide-react';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';

// Sample API endpoints
const apiEndpoints = [
  {
    id: 'market-data',
    name: 'Market Data',
    endpoints: [
      { id: 'market-1', method: 'GET', path: '/api/market-data/indices', description: 'Get latest market indices data' },
      { id: 'market-2', method: 'GET', path: '/api/market-data/currencies', description: 'Get currency exchange rates' },
      { id: 'market-3', method: 'GET', path: '/api/market-data/commodities', description: 'Get commodity prices' },
    ]
  },
  {
    id: 'company-data',
    name: 'Company Data',
    endpoints: [
      { id: 'company-1', method: 'GET', path: '/api/companies/search', description: 'Search for companies by name, symbol, or sector' },
      { id: 'company-2', method: 'GET', path: '/api/companies/{symbol}/profile', description: 'Get company profile data' },
      { id: 'company-3', method: 'GET', path: '/api/companies/{symbol}/financials', description: 'Get company financial statements' },
    ]
  },
  {
    id: 'analytics',
    name: 'Analytics',
    endpoints: [
      { id: 'analytics-1', method: 'POST', path: '/api/analytics/portfolio', description: 'Analyze portfolio performance' },
      { id: 'analytics-2', method: 'POST', path: '/api/analytics/risk', description: 'Perform risk assessment' },
      { id: 'analytics-3', method: 'POST', path: '/api/analytics/optimization', description: 'Optimize portfolio allocation' },
    ]
  },
  {
    id: 'reports',
    name: 'Reports',
    endpoints: [
      { id: 'reports-1', method: 'GET', path: '/api/reports/available', description: 'Get list of available report templates' },
      { id: 'reports-2', method: 'POST', path: '/api/reports/generate', description: 'Generate custom report' },
      { id: 'reports-3', method: 'GET', path: '/api/reports/{id}', description: 'Retrieve a specific report' },
    ]
  }
];

// Sample API request and response
const sampleRequest = {
  method: 'GET',
  endpoint: '/api/companies/AAPL/profile',
  headers: {
    'Authorization': 'Bearer ${API_KEY}',
    'Content-Type': 'application/json'
  },
  params: {}
};

const sampleResponse = {
  status: 200,
  data: {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    industry: 'Consumer Electronics',
    website: 'https://www.apple.com',
    description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
    ceo: 'Timothy Cook',
    sector: 'Technology',
    country: 'United States',
    employees: 154000,
    address: 'One Apple Park Way, Cupertino, CA 95014, USA',
    founded: 1976,
    marketCap: 2810000000000
  }
};

export default function ApiExplorer() {
  const [selectedCategory, setSelectedCategory] = useState('market-data');
  const [selectedEndpoint, setSelectedEndpoint] = useState('market-1');
  const [requestBody, setRequestBody] = useState('{\n  "param1": "value1",\n  "param2": "value2"\n}');
  const [apiKey, setApiKey] = useState('scb_sapphire_2025_XXXXXXXXXXXX');
  const [isLoading, setIsLoading] = useState(false);
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [responseData, setResponseData] = useState(JSON.stringify(sampleResponse, null, 2));
  const [responseStatus, setResponseStatus] = useState(200);
  const [showDocs, setShowDocs] = useState(false);

  const handleSendRequest = () => {
    setIsLoading(true);
    setIsRequestSent(false);
    
    // Simulate API request
    setTimeout(() => {
      setIsLoading(false);
      setIsRequestSent(true);
      setResponseData(JSON.stringify(sampleResponse, null, 2));
      setResponseStatus(200);
    }, 1500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Get the currently selected endpoint details
  const getSelectedEndpointDetails = () => {
    const category = apiEndpoints.find(cat => cat.id === selectedCategory);
    if (!category) return null;
    
    return category.endpoints.find(endpoint => endpoint.id === selectedEndpoint);
  };
  
  const selectedEndpointDetails = getSelectedEndpointDetails();

  return (
    <ScbBeautifulUI pageTitle="API Explorer" showNewsBar={false}>
      <Head>
        <title>API Explorer | SCB Sapphire FinSight</title>
      </Head>

      <div className="space-y-6">
        {/* API Explorer Header */}
        <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] p-5">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <h2 className="text-xl font-medium text-[rgb(var(--scb-dark-gray))]">
                API Explorer
              </h2>
              <p className="text-sm text-[rgb(var(--scb-dark-gray))] opacity-80 mt-1">
                Test and interact with the SCB Sapphire FinSight API endpoints
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowDocs(!showDocs)}
                className={`scb-btn ${showDocs ? 'scb-btn-primary' : 'scb-btn-secondary'} text-sm`}
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Documentation
              </button>
              
              <button className="scb-btn scb-btn-ghost border border-[rgb(var(--scb-border))] p-2">
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* API Categories and Endpoints Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] overflow-hidden">
              <div className="px-4 py-3 border-b border-[rgb(var(--scb-border))]">
                <h3 className="text-base font-medium text-[rgb(var(--scb-dark-gray))]">API Endpoints</h3>
              </div>
              
              <div className="divide-y divide-[rgb(var(--scb-border))]">
                {apiEndpoints.map(category => (
                  <div key={category.id} className="py-2 px-4">
                    <button
                      className="flex items-center justify-between w-full py-2 text-left"
                      onClick={() => setSelectedCategory(category.id === selectedCategory ? '' : category.id)}
                    >
                      <span className="font-medium text-sm text-[rgb(var(--scb-dark-gray))]">{category.name}</span>
                      <ChevronDown className={`h-4 w-4 text-[rgb(var(--scb-dark-gray))] transition-transform ${
                        selectedCategory === category.id ? 'transform rotate-180' : ''
                      }`} />
                    </button>
                    
                    {selectedCategory === category.id && (
                      <div className="ml-4 space-y-1 mb-2">
                        {category.endpoints.map(endpoint => (
                          <button
                            key={endpoint.id}
                            className={`pl-3 border-l-2 py-1.5 w-full text-left text-xs ${
                              selectedEndpoint === endpoint.id 
                                ? 'border-[rgb(var(--scb-honolulu-blue))] text-[rgb(var(--scb-honolulu-blue))] font-medium' 
                                : 'border-[rgb(var(--scb-border))] text-[rgb(var(--scb-dark-gray))]'
                            }`}
                            onClick={() => setSelectedEndpoint(endpoint.id)}
                          >
                            <span className={`inline-block px-1.5 py-0.5 rounded mr-2 text-[9px] font-medium ${
                              endpoint.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                              endpoint.method === 'POST' ? 'bg-green-100 text-green-700' :
                              endpoint.method === 'PUT' ? 'bg-amber-100 text-amber-700' :
                              endpoint.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {endpoint.method}
                            </span>
                            <span className="truncate">{endpoint.path.split('/').pop()}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* API Key Management */}
            <div className="mt-4 bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] overflow-hidden">
              <div className="px-4 py-3 border-b border-[rgb(var(--scb-border))]">
                <h3 className="text-base font-medium text-[rgb(var(--scb-dark-gray))]">API Key</h3>
              </div>
              
              <div className="p-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-4 w-4 text-[rgb(var(--scb-dark-gray))]" />
                  </div>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="scb-input pl-10 w-full text-sm font-mono"
                    placeholder="Enter your API key"
                  />
                </div>
                
                <div className="mt-4 flex flex-col space-y-2">
                  <button className="scb-btn scb-btn-secondary text-xs py-2 flex items-center justify-center">
                    <Lock className="h-3.5 w-3.5 mr-2" />
                    Generate New Key
                  </button>
                  
                  <div className="flex items-center justify-between text-xs text-[rgb(var(--scb-dark-gray))] mt-2">
                    <span>Rate Limit:</span>
                    <span className="font-medium">100 req/min</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-[rgb(var(--scb-dark-gray))]">
                    <span>Status:</span>
                    <span className="flex items-center text-[rgb(var(--scb-american-green))]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--scb-american-green))] mr-1"></span>
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Request and Response Panel */}
          <div className="lg:col-span-3 space-y-4">
            {/* Selected Endpoint Info */}
            {selectedEndpointDetails && (
              <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] p-4">
                <div className="flex items-center">
                  <span className={`inline-block px-2 py-1 rounded mr-3 text-xs font-medium ${
                    selectedEndpointDetails.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                    selectedEndpointDetails.method === 'POST' ? 'bg-green-100 text-green-700' :
                    selectedEndpointDetails.method === 'PUT' ? 'bg-amber-100 text-amber-700' :
                    selectedEndpointDetails.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedEndpointDetails.method}
                  </span>
                  <code className="text-sm font-mono text-[rgb(var(--scb-dark-gray))]">
                    {selectedEndpointDetails.path}
                  </code>
                  <button 
                    onClick={() => copyToClipboard(selectedEndpointDetails.path)}
                    className="p-1.5 ml-2 text-[rgb(var(--scb-dark-gray))] hover:bg-[rgba(var(--scb-light-gray),0.5)] rounded-md transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                
                <p className="mt-2 text-sm text-[rgb(var(--scb-dark-gray))]">
                  {selectedEndpointDetails.description}
                </p>
                
                {showDocs && (
                  <div className="mt-3 pt-3 border-t border-[rgb(var(--scb-border))]">
                    <h4 className="text-xs font-medium text-[rgb(var(--scb-dark-gray))]">Parameters</h4>
                    <div className="mt-2 bg-[rgba(var(--scb-light-gray),0.3)] rounded-md p-3">
                      <p className="text-xs text-[rgb(var(--scb-dark-gray))]">
                        {selectedEndpointDetails.method === 'GET' 
                          ? 'This endpoint accepts optional query parameters for filtering the results.'
                          : 'This endpoint accepts a JSON payload with the required parameters.'}
                      </p>
                      
                      <div className="mt-2 text-xs">
                        <code className="block p-2 rounded bg-[rgba(0,0,0,0.03)] font-mono text-[rgb(var(--scb-dark-gray))]">
                          {selectedEndpointDetails.method === 'GET' 
                            ? `?limit=25&offset=0&sortBy=marketCap`
                            : `{\n  "param1": "value1",\n  "param2": "value2"\n}`}
                        </code>
                      </div>
                      
                      <div className="mt-2 flex items-start gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 text-[rgb(var(--scb-honolulu-blue))] mt-0.5" />
                        <p className="text-xs text-[rgb(var(--scb-dark-gray))]">
                          Refer to the <a href="#" className="text-[rgb(var(--scb-honolulu-blue))] underline">full documentation</a> for complete parameter details.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Request Panel */}
            <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] overflow-hidden">
              <div className="px-5 py-3 border-b border-[rgb(var(--scb-border))] flex justify-between items-center">
                <h3 className="text-base font-medium text-[rgb(var(--scb-dark-gray))]">Request</h3>
                <div className="flex items-center gap-2">
                  <button 
                    className="p-1.5 text-[rgb(var(--scb-dark-gray))] hover:bg-[rgba(var(--scb-light-gray),0.5)] rounded-md transition-colors"
                    onClick={() => copyToClipboard(requestBody)}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button 
                    className="p-1.5 text-[rgb(var(--scb-dark-gray))] hover:bg-[rgba(var(--scb-light-gray),0.5)] rounded-md transition-colors"
                    onClick={() => setRequestBody('{\n  "param1": "value1",\n  "param2": "value2"\n}')}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="p-0">
                <div className="relative">
                  <textarea
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    className="w-full h-56 p-4 font-mono text-sm bg-[rgba(var(--scb-light-gray),0.05)] focus:outline-none resize-none"
                    placeholder="Enter request body (JSON)"
                    disabled={selectedEndpointDetails?.method === 'GET'}
                  />
                  <div className="absolute bottom-0 right-0 p-3">
                    <div className="flex items-center">
                      <button 
                        className="scb-btn scb-btn-primary py-2 px-4 text-sm flex items-center"
                        onClick={handleSendRequest}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Send Request
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Response Panel */}
            <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] overflow-hidden">
              <div className="px-5 py-3 border-b border-[rgb(var(--scb-border))] flex justify-between items-center">
                <div className="flex items-center">
                  <h3 className="text-base font-medium text-[rgb(var(--scb-dark-gray))]">Response</h3>
                  {isRequestSent && (
                    <div className="ml-3 flex items-center">
                      <div className={`px-2 py-0.5 rounded text-xs font-medium ${
                        responseStatus >= 200 && responseStatus < 300 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        Status: {responseStatus}
                      </div>
                    </div>
                  )}
                </div>
                {isRequestSent && (
                  <div className="flex items-center gap-2">
                    <button 
                      className="p-1.5 text-[rgb(var(--scb-dark-gray))] hover:bg-[rgba(var(--scb-light-gray),0.5)] rounded-md transition-colors"
                      onClick={() => copyToClipboard(responseData)}
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="p-0">
                {isRequestSent ? (
                  <pre className="w-full h-64 p-4 font-mono text-sm bg-[rgba(var(--scb-light-gray),0.05)] overflow-auto">
                    {responseData}
                  </pre>
                ) : (
                  <div className="w-full h-64 flex flex-col items-center justify-center bg-[rgba(var(--scb-light-gray),0.05)]">
                    <Terminal className="h-12 w-12 text-[rgb(var(--scb-dark-gray))] opacity-20 mb-3" />
                    <p className="text-sm text-[rgb(var(--scb-dark-gray))]">Send a request to see the response</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* API Documentation Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-3">
              <div className="p-2 rounded-md bg-[rgba(var(--scb-honolulu-blue),0.1)]">
                <FileJson className="w-5 h-5 text-[rgb(var(--scb-honolulu-blue))]" />
              </div>
              <h3 className="ml-3 text-sm font-medium text-[rgb(var(--scb-dark-gray))]">OpenAPI Specification</h3>
            </div>
            <p className="text-xs text-[rgb(var(--scb-dark-gray))]">
              View the complete OpenAPI specification for SCB Sapphire FinSight API
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-3">
              <div className="p-2 rounded-md bg-[rgba(var(--scb-american-green),0.1)]">
                <Code className="w-5 h-5 text-[rgb(var(--scb-american-green))]" />
              </div>
              <h3 className="ml-3 text-sm font-medium text-[rgb(var(--scb-dark-gray))]">SDKs & Libraries</h3>
            </div>
            <p className="text-xs text-[rgb(var(--scb-dark-gray))]">
              Download client libraries for popular programming languages
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-3">
              <div className="p-2 rounded-md bg-[rgba(var(--scb-muted-red),0.1)]">
                <Server className="w-5 h-5 text-[rgb(var(--scb-muted-red))]" />
              </div>
              <h3 className="ml-3 text-sm font-medium text-[rgb(var(--scb-dark-gray))]">API Status</h3>
            </div>
            <p className="text-xs text-[rgb(var(--scb-dark-gray))]">
              View real-time and historical API performance metrics
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-3">
              <div className="p-2 rounded-md bg-[rgba(var(--scb-dark-gray),0.1)]">
                <Database className="w-5 h-5 text-[rgb(var(--scb-dark-gray))]" />
              </div>
              <h3 className="ml-3 text-sm font-medium text-[rgb(var(--scb-dark-gray))]">Data Dictionary</h3>
            </div>
            <p className="text-xs text-[rgb(var(--scb-dark-gray))]">
              Explore field definitions and data models for all endpoints
            </p>
          </div>
        </div>
      </div>
    </ScbBeautifulUI>
  );
}