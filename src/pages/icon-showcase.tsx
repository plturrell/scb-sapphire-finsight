import React, { useState } from 'react';
import ModernLayout from '@/components/ModernLayout';
import { 
  AlertIcon, 
  ArrowIcon, 
  ChartIcon, 
  DataIcon,
  FinanceIcon,
  LoadingIcon, 
  NavIcon, 
  SearchIcon, 
  SparklesIcon 
} from '../components/icons';

export default function IconShowcasePage() {
  const [animation, setAnimation] = useState('pulse');
  const [hoverEffect, setHoverEffect] = useState('scale');
  
  const animations = ['none', 'pulse', 'bounce', 'spin', 'wobble'];
  const hoverEffects = ['none', 'scale', 'rotate', 'color', 'strokeWidth'];
  
  return (
    <ModernLayout>
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
            <SparklesIcon className="mr-2" animation="pulse" size={28} />
            SCB Sapphire FinSight Animated Icons
          </h1>
          <p className="text-gray-600 mb-6">
            This showcase demonstrates all animated icons developed for SCB Sapphire FinSight UI, designed to enhance user experience with subtle animations and visual feedback.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Animation Type</h3>
              <div className="flex flex-wrap gap-2">
                {animations.map((anim) => (
                  <button
                    key={anim}
                    onClick={() => setAnimation(anim)}
                    className={`px-3 py-1.5 text-sm rounded-full ${
                      animation === anim 
                        ? 'bg-[rgb(var(--scb-primary))] text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {anim}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Hover Effect</h3>
              <div className="flex flex-wrap gap-2">
                {hoverEffects.map((effect) => (
                  <button
                    key={effect}
                    onClick={() => setHoverEffect(effect)}
                    className={`px-3 py-1.5 text-sm rounded-full ${
                      hoverEffect === effect 
                        ? 'bg-[rgb(var(--scb-primary))] text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {effect}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Alert Icons */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Alert Icons</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <AlertIcon variant="alert" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Alert</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <AlertIcon variant="warning" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Warning</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <AlertIcon variant="info" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Info</span>
            </div>
          </div>
        </div>
        
        {/* Chart Icons */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Chart Icons</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <ChartIcon variant="bar" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Bar Chart</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <ChartIcon variant="line" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Line Chart</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <ChartIcon variant="pie" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Pie Chart</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <ChartIcon variant="trending-up" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Trending Up</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <ChartIcon variant="trending-down" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Trending Down</span>
            </div>
          </div>
        </div>
        
        {/* Navigation Icons */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Navigation Icons</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <NavIcon variant="home" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Home</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <NavIcon variant="dashboard" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Dashboard</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <NavIcon variant="portfolio" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Portfolio</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <NavIcon variant="analytics" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Analytics</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <NavIcon variant="reports" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Reports</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <NavIcon variant="settings" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Settings</span>
            </div>
          </div>
        </div>
        
        {/* Arrow Icons */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Arrow Icons</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <ArrowIcon variant="up" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Up</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <ArrowIcon variant="down" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Down</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <ArrowIcon variant="left" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Left</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <ArrowIcon variant="right" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Right</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <ArrowIcon variant="chevron-up" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Chevron Up</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <ArrowIcon variant="chevron-down" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Chevron Down</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <ArrowIcon variant="chevron-left" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Chevron Left</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <ArrowIcon variant="chevron-right" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Chevron Right</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <ArrowIcon variant="up-right" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Up Right</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <ArrowIcon variant="down-right" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Down Right</span>
            </div>
          </div>
        </div>
        
        {/* Finance Icons */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Finance Icons</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <FinanceIcon variant="currency" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Currency</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <FinanceIcon variant="investment" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Investment</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <FinanceIcon variant="stocks" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Stocks</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <FinanceIcon variant="wallet" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Wallet</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <FinanceIcon variant="bank" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Bank</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <FinanceIcon variant="growth" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Growth</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <FinanceIcon variant="percentage" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Percentage</span>
            </div>
          </div>
        </div>
        
        {/* Data Visualization Icons */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Visualization Icons</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <DataIcon variant="sankey" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Sankey Diagram</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <DataIcon variant="heatmap" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Heatmap</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <DataIcon variant="scatter" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Scatter Plot</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <DataIcon variant="bubble" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Bubble Chart</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <DataIcon variant="radar" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Radar Chart</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <DataIcon variant="candlestick" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Candlestick</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <DataIcon variant="table" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Table</span>
            </div>
          </div>
        </div>
        
        {/* Utility Icons */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Utility Icons</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <SearchIcon size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Search</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <LoadingIcon variant="spinner" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Loading Spinner</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <LoadingIcon variant="dots" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Loading Dots</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <LoadingIcon variant="circle" size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Loading Circle</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50">
              <SparklesIcon size={40} animation={animation} hoverAnimation={animation === 'none'} hoverEffect={hoverEffect} />
              <span className="mt-2 text-sm text-gray-600">Sparkles</span>
            </div>
          </div>
        </div>
        
        {/* Usage Examples */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Examples</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-base font-medium text-gray-800 mb-3">In Context Examples</h3>
              
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <FinanceIcon variant="currency" className="text-[rgb(var(--scb-honolulu-blue))]" size={20} />
                    <h4 className="font-medium">Portfolio Value</h4>
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-2xl font-semibold mr-2">$1,278,934</span>
                    <div className="flex items-center text-green-600 text-sm">
                      <ArrowIcon variant="up" className="mr-1" size={14} />
                      <span>5.4%</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <DataIcon variant="sankey" className="text-[rgb(var(--scb-primary))]" size={20} />
                      <h4 className="font-medium">Data Flow Analysis</h4>
                    </div>
                    <LoadingIcon variant="spinner" animation="spin" className="text-gray-400" size={16} />
                  </div>
                  <div className="h-20 bg-gray-100 rounded-md"></div>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertIcon variant="warning" animation="pulse" className="text-amber-500" size={18} />
                    <span className="text-sm">Sector allocation over threshold</span>
                  </div>
                  <button className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs">
                    View
                  </button>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-base font-medium text-gray-800 mb-3">Button Examples</h3>
              
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[rgb(var(--scb-primary))] text-white rounded-md hover:bg-[rgb(var(--scb-primary-dark))] transition-colors">
                  <FinanceIcon variant="wallet" size={18} />
                  <span>View Portfolio</span>
                </button>
                
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[rgb(var(--scb-border))] rounded-md hover:bg-gray-50 transition-colors">
                  <DataIcon variant="table" size={18} className="text-[rgb(var(--scb-primary))]" />
                  <span>Export Data</span>
                </button>
                
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[rgb(var(--scb-accent))] text-white rounded-md hover:bg-[rgb(var(--scb-accent-dark))] transition-colors">
                  <SparklesIcon size={18} animation="pulse" />
                  <span>AI Analysis</span>
                </button>
                
                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors">
                    <ArrowIcon variant="up" size={14} />
                    <span className="text-sm">Buy</span>
                  </button>
                  
                  <button className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors">
                    <ArrowIcon variant="down" size={14} />
                    <span className="text-sm">Sell</span>
                  </button>
                  
                  <button className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors">
                    <SearchIcon size={14} />
                    <span className="text-sm">Research</span>
                  </button>
                </div>
              </div>
              
              <h3 className="text-base font-medium text-gray-800 mb-3 mt-6">Navigation Example</h3>
              
              <div className="flex gap-2 border-b">
                <button className="px-4 py-2 text-[rgb(var(--scb-primary))] border-b-2 border-[rgb(var(--scb-primary))] flex items-center gap-1">
                  <NavIcon variant="dashboard" size={16} />
                  <span>Dashboard</span>
                </button>
                
                <button className="px-4 py-2 text-gray-600 hover:text-[rgb(var(--scb-primary))] flex items-center gap-1">
                  <NavIcon variant="analytics" size={16} />
                  <span>Analytics</span>
                </button>
                
                <button className="px-4 py-2 text-gray-600 hover:text-[rgb(var(--scb-primary))] flex items-center gap-1">
                  <NavIcon variant="reports" size={16} />
                  <span>Reports</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModernLayout>
  );
}