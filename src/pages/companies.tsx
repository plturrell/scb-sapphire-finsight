import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  Download, 
  ArrowUpRight, 
  Building2, 
  Globe, 
  User, 
  TrendingUp, 
  DollarSign,
  ChevronDown,
  X,
  FileText,
  BarChart2
} from 'lucide-react';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';
import EnhancedRealCompanySearchBar from '@/components/EnhancedRealCompanySearchBar';
import EnhancedSectorNavigation from '@/components/EnhancedSectorNavigation';
import { useIOS } from '@/hooks/useResponsive';
import { useSFSymbolsSupport } from '@/lib/sf-symbols';

// Sample data for companies
const companies = [
  {
    id: 'aapl',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Technology',
    industry: 'Consumer Electronics',
    logo: 'https://logo.clearbit.com/apple.com',
    price: 178.72,
    change: 1.24,
    changePercent: 0.72,
    marketCap: '2.81T',
    volume: '52.4M',
    pe: 29.45,
    description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.'
  },
  {
    id: 'msft',
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    sector: 'Technology',
    industry: 'Software—Infrastructure',
    logo: 'https://logo.clearbit.com/microsoft.com',
    price: 352.78,
    change: -1.36,
    changePercent: -0.38,
    marketCap: '2.62T',
    volume: '28.7M',
    pe: 33.12,
    description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.'
  },
  {
    id: 'googl',
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    sector: 'Technology',
    industry: 'Internet Content & Information',
    logo: 'https://logo.clearbit.com/abc.xyz',
    price: 142.56,
    change: 2.15,
    changePercent: 1.52,
    marketCap: '1.79T',
    volume: '32.1M',
    pe: 27.83,
    description: 'Alphabet Inc. provides various products and platforms in the United States, Europe, the Middle East, Africa, the Asia-Pacific, and internationally.'
  },
  {
    id: 'amzn',
    symbol: 'AMZN',
    name: 'Amazon.com, Inc.',
    sector: 'Consumer Cyclical',
    industry: 'Internet Retail',
    logo: 'https://logo.clearbit.com/amazon.com',
    price: 175.90,
    change: 0.45,
    changePercent: 0.26,
    marketCap: '1.83T',
    volume: '40.8M',
    pe: 47.76,
    description: 'Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions through its online stores and various physical retail locations.'
  },
  {
    id: 'nvda',
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    sector: 'Technology',
    industry: 'Semiconductors',
    logo: 'https://logo.clearbit.com/nvidia.com',
    price: 924.67,
    change: 15.92,
    changePercent: 1.75,
    marketCap: '2.28T',
    volume: '36.5M',
    pe: 86.42,
    description: 'NVIDIA Corporation provides graphics, computing, and networking solutions in the United States, Taiwan, China, and internationally.'
  },
  {
    id: 'tsla',
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    sector: 'Consumer Cyclical',
    industry: 'Auto Manufacturers',
    logo: 'https://logo.clearbit.com/tesla.com',
    price: 182.45,
    change: -3.87,
    changePercent: -2.08,
    marketCap: '582.4B',
    volume: '105.2M',
    pe: 48.91,
    description: 'Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, energy generation and storage systems globally.'
  }
];

// Sample data for sectors with SF Symbol icons
const sectors = [
  { id: 'all', name: 'All Sectors', count: 11, icon: 'square.grid.2x2.fill' },
  { id: 'technology', name: 'Technology', count: 5, icon: 'desktopcomputer' },
  { id: 'consumer-cyclical', name: 'Consumer Cyclical', count: 2, icon: 'cart.fill' },
  { id: 'financial', name: 'Financial Services', count: 1, icon: 'dollarsign.circle.fill' },
  { id: 'healthcare', name: 'Healthcare', count: 1, icon: 'cross.case.fill' },
  { id: 'energy', name: 'Energy', count: 1, icon: 'bolt.fill' },
  { id: 'industrial', name: 'Industrial', count: 1, icon: 'gearshape.2.fill' },
];

export default function Companies() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [isPlatformDetected, setIsPlatformDetected] = useState(false);
  const isAppleDevice = useIOS();
  const { supported: sfSymbolsSupported } = useSFSymbolsSupport();
  
  // Platform detection effect
  useEffect(() => {
    setIsPlatformDetected(true);
  }, []);
  
  // Filter companies based on search and sector
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = searchQuery === '' || 
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSector = selectedSector === 'all' || 
      company.sector.toLowerCase().includes(selectedSector.toLowerCase());
    
    return matchesSearch && matchesSector;
  });

  return (
    <ScbBeautifulUI pageTitle="Company Search" showNewsBar={true}>
      <Head>
        <title>Company Search | SCB Sapphire FinSight</title>
      </Head>

      <div className="space-y-6">
        {/* Enhanced Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] p-5">
          <EnhancedRealCompanySearchBar 
            onCompanySelect={(company) => {
              console.log('Selected company:', company);
              setSelectedCompany(company.companyCode);
            }}
          />
          
          <div className="mt-4">
            {isAppleDevice && isPlatformDetected && sfSymbolsSupported ? (
              <EnhancedSectorNavigation
                sectors={sectors}
                activeSector={selectedSector}
                onSectorChange={setSelectedSector}
                variant={isAppleDevice ? 'card' : 'chip'}
                className="mt-2"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {sectors.map(sector => (
                  <button
                    key={sector.id}
                    onClick={() => setSelectedSector(sector.id)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                      selectedSector === sector.id
                        ? 'bg-[rgb(var(--scb-honolulu-blue))] text-white'
                        : 'bg-[rgba(var(--scb-light-gray),0.5)] text-[rgb(var(--scb-dark-gray))]'
                    }`}
                  >
                    {sector.name} ({sector.count})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Companies List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map(company => (
            <div 
              key={company.id} 
              className={`bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] overflow-hidden transition-shadow hover:shadow-md ${
                selectedCompany === company.id ? 'ring-2 ring-[rgb(var(--scb-honolulu-blue))]' : ''
              }`}
              onClick={() => setSelectedCompany(company.id)}
            >
              <div className="flex items-center gap-4 p-4 border-b border-[rgb(var(--scb-border))]">
                <div className="relative h-12 w-12 rounded-md bg-[rgba(var(--scb-light-gray),0.3)] overflow-hidden flex items-center justify-center">
                  {company.logo ? (
                    <Image
                      src={company.logo}
                      alt={company.name}
                      fill
                      style={{ objectFit: 'contain' }}
                      className="p-1"
                    />
                  ) : (
                    <Building2 className="h-6 w-6 text-[rgb(var(--scb-dark-gray))]" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-[rgb(var(--scb-dark-gray))] truncate">
                        {company.name}
                      </h3>
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-[rgb(var(--scb-honolulu-blue))]">{company.symbol}</span>
                        <span className="mx-2 text-[rgb(var(--scb-dark-gray))] opacity-40">•</span>
                        <span className="text-[rgb(var(--scb-dark-gray))] opacity-70">{company.sector}</span>
                      </div>
                    </div>
                    
                    <div className={`flex items-center px-2 py-1 rounded text-xs font-medium ${
                      company.changePercent > 0 
                        ? 'bg-[rgba(var(--scb-american-green),0.1)] text-[rgb(var(--scb-american-green))]' 
                        : 'bg-[rgba(var(--scb-muted-red),0.1)] text-[rgb(var(--scb-muted-red))]'
                    }`}>
                      <span>${company.price}</span>
                      <span className="ml-1">
                        {company.changePercent > 0 ? '+' : ''}{company.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70">Market Cap</div>
                    <div className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">${company.marketCap}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70">Volume</div>
                    <div className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">{company.volume}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70">P/E Ratio</div>
                    <div className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">{company.pe}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70">Industry</div>
                    <div className="text-sm font-medium text-[rgb(var(--scb-dark-gray))] truncate">{company.industry}</div>
                  </div>
                </div>
                
                <p className="text-xs text-[rgb(var(--scb-dark-gray))] line-clamp-2 mb-4">
                  {company.description}
                </p>
                
                <div className="flex gap-2">
                  <Link 
                    href={`/reports/company/${company.symbol.toLowerCase()}`}
                    className="flex-1 scb-btn scb-btn-primary text-xs py-2 px-3"
                  >
                    View Analysis
                  </Link>
                  <button className="scb-btn-ghost border border-[rgb(var(--scb-border))] rounded-md p-2">
                    <FileText className="h-4 w-4 text-[rgb(var(--scb-dark-gray))]" />
                  </button>
                  <button className="scb-btn-ghost border border-[rgb(var(--scb-border))] rounded-md p-2">
                    <BarChart2 className="h-4 w-4 text-[rgb(var(--scb-dark-gray))]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredCompanies.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] p-8 text-center">
            <Building2 className="h-12 w-12 mx-auto text-[rgb(var(--scb-dark-gray))] opacity-20 mb-4" />
            <h3 className="text-lg font-medium text-[rgb(var(--scb-dark-gray))]">No companies found</h3>
            <p className="text-sm text-[rgb(var(--scb-dark-gray))] opacity-70 mt-1 max-w-md mx-auto">
              Try adjusting your search or filter criteria to find companies matching your requirements.
            </p>
          </div>
        )}
        
        {/* Selected Company Details (expanded view) */}
        {selectedCompany && (
          <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] overflow-hidden">
            <div className="p-6 border-b border-[rgb(var(--scb-border))] flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 rounded-md bg-[rgba(var(--scb-light-gray),0.3)] overflow-hidden flex items-center justify-center">
                  {companies.find(c => c.id === selectedCompany)?.logo ? (
                    <Image
                      src={companies.find(c => c.id === selectedCompany)?.logo || ''}
                      alt={companies.find(c => c.id === selectedCompany)?.name || ''}
                      fill
                      style={{ objectFit: 'contain' }}
                      className="p-1"
                    />
                  ) : (
                    <Building2 className="h-8 w-8 text-[rgb(var(--scb-dark-gray))]" />
                  )}
                </div>
                
                <div>
                  <h2 className="text-xl font-medium text-[rgb(var(--scb-dark-gray))]">
                    {companies.find(c => c.id === selectedCompany)?.name}
                  </h2>
                  <div className="flex items-center text-sm mt-1">
                    <span className="font-medium text-[rgb(var(--scb-honolulu-blue))]">
                      {companies.find(c => c.id === selectedCompany)?.symbol}
                    </span>
                    <span className="mx-2 text-[rgb(var(--scb-dark-gray))] opacity-40">•</span>
                    <span className="text-[rgb(var(--scb-dark-gray))]">
                      {companies.find(c => c.id === selectedCompany)?.sector}
                    </span>
                    <span className="mx-2 text-[rgb(var(--scb-dark-gray))] opacity-40">•</span>
                    <span className="text-[rgb(var(--scb-dark-gray))]">
                      {companies.find(c => c.id === selectedCompany)?.industry}
                    </span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedCompany(null)}
                className="p-1 hover:bg-[rgba(var(--scb-light-gray),0.3)] rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-[rgb(var(--scb-dark-gray))]" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="flex items-center p-4 bg-[rgba(var(--scb-light-gray),0.2)] rounded-lg">
                  <DollarSign className="h-6 w-6 text-[rgb(var(--scb-honolulu-blue))] mr-3" />
                  <div>
                    <div className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70">Share Price</div>
                    <div className="flex items-baseline">
                      <span className="text-lg font-medium text-[rgb(var(--scb-dark-gray))]">
                        ${companies.find(c => c.id === selectedCompany)?.price}
                      </span>
                      <span className={`ml-2 text-xs font-medium ${
                        (companies.find(c => c.id === selectedCompany)?.changePercent || 0) > 0
                          ? 'text-[rgb(var(--scb-american-green))]'
                          : 'text-[rgb(var(--scb-muted-red))]'
                      }`}>
                        {(companies.find(c => c.id === selectedCompany)?.changePercent || 0) > 0 ? '+' : ''}
                        {companies.find(c => c.id === selectedCompany)?.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center p-4 bg-[rgba(var(--scb-light-gray),0.2)] rounded-lg">
                  <TrendingUp className="h-6 w-6 text-[rgb(var(--scb-american-green))] mr-3" />
                  <div>
                    <div className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70">Market Cap</div>
                    <div className="text-lg font-medium text-[rgb(var(--scb-dark-gray))]">
                      ${companies.find(c => c.id === selectedCompany)?.marketCap}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center p-4 bg-[rgba(var(--scb-light-gray),0.2)] rounded-lg">
                  <User className="h-6 w-6 text-[rgb(var(--scb-muted-red))] mr-3" />
                  <div>
                    <div className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70">P/E Ratio</div>
                    <div className="text-lg font-medium text-[rgb(var(--scb-dark-gray))]">
                      {companies.find(c => c.id === selectedCompany)?.pe}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center p-4 bg-[rgba(var(--scb-light-gray),0.2)] rounded-lg">
                  <Globe className="h-6 w-6 text-[rgb(var(--scb-honolulu-blue))] mr-3" />
                  <div>
                    <div className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70">Volume</div>
                    <div className="text-lg font-medium text-[rgb(var(--scb-dark-gray))]">
                      {companies.find(c => c.id === selectedCompany)?.volume}
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-[rgb(var(--scb-dark-gray))] mb-6">
                {companies.find(c => c.id === selectedCompany)?.description}
              </p>
              
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/reports/company/${companies.find(c => c.id === selectedCompany)?.symbol.toLowerCase()}`}
                  className="scb-btn scb-btn-primary"
                >
                  View Detailed Analysis
                </Link>
                <button className="scb-btn scb-btn-secondary">
                  Financial Statements
                </button>
                <button className="scb-btn scb-btn-secondary">
                  News & Insights
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ScbBeautifulUI>
  );
}