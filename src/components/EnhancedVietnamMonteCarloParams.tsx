import React, { useState, useEffect } from 'react';
import { Info, Plus, HelpCircle, Settings, ChevronRight, Package, TrendingUp, Sliders, X, Check, AlertCircle } from 'lucide-react';
import { DistributionType, SimulationConfig, SimulationParameter } from '../types/MonteCarloTypes';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import { useNetworkAwareLoading } from '@/hooks/useNetworkAwareLoading';

// Type alias for backward compatibility 
export type TariffParameter = SimulationParameter;

// Component-specific interfaces
export interface SimulationSettings {
  precision: 'Preview' | 'Medium' | 'High';
  iterations: number;
  caseBoundaries: {
    pessimistic: [number, number]; // percentage range [0-100]
    realistic: [number, number];
    optimistic: [number, number];
  };
}

export interface VietnamMonteCarloConfig {
  productInfo: {
    hsCode: string;
    productDescription?: string;
    section?: string;
    sectionDescription?: string;
  };
  tariffParameters: TariffParameter[];
  financialParameters: TariffParameter[];
  simulationSettings: SimulationSettings;
}

interface EnhancedVietnamMonteCarloParamsProps {
  initialConfig?: Partial<VietnamMonteCarloConfig>;
  onConfigChange?: (config: VietnamMonteCarloConfig) => void;
  onRunSimulation?: (config: VietnamMonteCarloConfig) => void;
  className?: string;
  theme?: 'light' | 'dark';
  adaptive?: boolean;
  simplified?: boolean;
}

const defaultConfig: VietnamMonteCarloConfig = {
  productInfo: {
    hsCode: '',
    productDescription: '',
    section: '',
    sectionDescription: ''
  },
  tariffParameters: [
    {
      id: 'baseTariffRate',
      name: 'Base Tariff Rate',
      value: 25,
      min: 15,
      max: 35,
      distribution: 'Normal',
      description: 'Baseline tariff rate applied to imported goods',
      unit: '%'
    },
    {
      id: 'tradeAgreement',
      name: 'Trade Agreement',
      value: 'CPTPP',
      min: 'CPTPP',
      max: 'MFN',
      distribution: 'Uniform',
      description: 'Trade agreement that determines preferential tariff rates'
    }
  ],
  financialParameters: [
    {
      id: 'importVolume',
      name: 'Import Volume',
      value: 5.2,
      min: 4.5,
      max: 6.0,
      distribution: 'Normal',
      description: 'Volume of imports in millions of USD',
      unit: 'M'
    },
    {
      id: 'exchangeRate',
      name: 'Exchange Rate',
      value: 23500,
      min: 23000,
      max: 24200,
      distribution: 'Normal',
      description: 'VND to USD exchange rate',
      unit: 'VND/USD'
    }
  ],
  simulationSettings: {
    precision: 'Preview',
    iterations: 1000,
    caseBoundaries: {
      pessimistic: [0, 5],
      realistic: [5, 95],
      optimistic: [95, 100]
    }
  }
};

// Helper function to format values with units
const formatValue = (value: number | string, unit?: string): string => {
  if (typeof value === 'number') {
    return unit ? `${value}${unit}` : value.toString();
  }
  return value.toString();
};

/**
 * EnhancedVietnamMonteCarloParams Component
 * An enhanced component for configuring Monte Carlo simulation parameters
 * with SCB Beautiful UI styling
 */
const EnhancedVietnamMonteCarloParams: React.FC<EnhancedVietnamMonteCarloParamsProps> = ({
  initialConfig,
  onConfigChange,
  onRunSimulation,
  className = '',
  theme: propTheme,
  adaptive = true,
  simplified = false
}) => {
  const { prefersColorScheme, tier } = useDeviceCapabilities();
  const { connection } = useNetworkAwareLoading();
  
  // Determine effective theme based on props or system preference
  const theme = propTheme || prefersColorScheme || 'light';
  
  // Define SCB colors based on theme
  const colors = {
    light: {
      // Primary SCB colors
      honoluluBlue: 'rgb(var(--scb-honolulu-blue, 0, 114, 170))', // #0072AA
      americanGreen: 'rgb(var(--scb-american-green, 33, 170, 71))', // #21AA47
      sun: 'rgb(var(--scb-sun, 255, 204, 0))', // #FFCC00
      persianRed: 'rgb(var(--scb-persian-red, 204, 0, 0))', // #CC0000
      
      // Case analysis specific colors
      pessimistic: '#d60542', // red
      realistic: '#0072AA',   // SCB blue
      optimistic: '#21AA47',  // SCB green
      
      // UI elements
      background: 'white',
      cardBackground: 'white',
      headerBackground: '#f8f8f8',
      sectionBackground: '#f9f9f9',
      text: '#333333',
      textSecondary: '#666666',
      border: '#e0e0e0',
      divider: '#eeeeee',
      buttonText: 'white',
      buttonSecondaryText: 'rgb(var(--scb-honolulu-blue, 0, 114, 170))',
      buttonSecondaryBorder: 'rgb(var(--scb-honolulu-blue, 0, 114, 170))',
      buttonSecondaryBackground: 'rgba(0, 114, 170, 0.08)',
      buttonSecondaryHover: 'rgba(0, 114, 170, 0.15)',
      inputBackground: 'white',
      inputBorder: '#e0e0e0',
      inputFocus: 'rgb(var(--scb-honolulu-blue, 0, 114, 170))'
    },
    dark: {
      // Primary SCB colors - lighter for dark mode
      honoluluBlue: 'rgb(0, 142, 211)', // Lighter for dark mode
      americanGreen: 'rgb(41, 204, 86)', // Lighter for dark mode
      sun: 'rgb(255, 214, 51)', // Lighter for dark mode
      persianRed: 'rgb(255, 99, 99)', // Lighter for dark mode
      
      // Case analysis specific colors
      pessimistic: '#ff4d6d', // brighter red for dark mode
      realistic: '#0095db',   // brighter blue for dark mode
      optimistic: '#29cc56',  // brighter green for dark mode
      
      // UI elements
      background: '#121212',
      cardBackground: '#1e1e1e',
      headerBackground: '#252525',
      sectionBackground: '#252525',
      text: '#e0e0e0',
      textSecondary: '#a0a0a0',
      border: '#333333',
      divider: '#333333',
      buttonText: 'white',
      buttonSecondaryText: 'rgb(0, 142, 211)',
      buttonSecondaryBorder: 'rgb(0, 142, 211)',
      buttonSecondaryBackground: 'rgba(0, 142, 211, 0.1)',
      buttonSecondaryHover: 'rgba(0, 142, 211, 0.2)',
      inputBackground: '#2a2a2a',
      inputBorder: '#444444',
      inputFocus: 'rgb(0, 142, 211)'
    }
  };
  
  const currentColors = colors[theme];
  
  // Merge initial config with defaults
  const [config, setConfig] = useState<VietnamMonteCarloConfig>({
    ...defaultConfig,
    ...initialConfig
  });
  
  // Accordion state for sections
  const [expandedSections, setExpandedSections] = useState({
    productInfo: true,
    tariffParameters: true,
    financialParameters: !simplified,
    simulationSettings: !simplified
  });
  
  // If adaptive is enabled, simplify the UI based on network conditions or device tier
  useEffect(() => {
    if (adaptive) {
      const shouldSimplify = connection.type === 'slow-2g' || connection.type === '2g' || tier === 'low';
      
      if (shouldSimplify) {
        setExpandedSections({
          productInfo: true,
          tariffParameters: true,
          financialParameters: false,
          simulationSettings: false
        });
      }
    }
  }, [adaptive, connection.type, tier]);

  // Update parent component when config changes
  useEffect(() => {
    if (onConfigChange) {
      onConfigChange(config);
    }
  }, [config, onConfigChange]);

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };

  // Handle HS code changes
  const handleHSCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const hsCode = event.target.value;
    setConfig({
      ...config,
      productInfo: {
        ...config.productInfo,
        hsCode
      }
    });

    // In a real implementation, we would fetch product descriptions based on HS code
    // This is a simplified mock implementation
    if (hsCode.length === 8) {
      // Simulate API fetch delay
      setTimeout(() => {
        let productDescription = '';
        let section = '';
        let sectionDescription = '';

        // Mock product descriptions based on HS code prefix
        if (hsCode.startsWith('85')) {
          productDescription = 'Electrical machinery and equipment';
          section = 'XVI';
          sectionDescription = 'Machinery and mechanical appliances; electrical equipment';
        } else if (hsCode.startsWith('61')) {
          productDescription = 'Articles of apparel and clothing accessories, knitted or crocheted';
          section = 'XI';
          sectionDescription = 'Textiles and textile articles';
        } else if (hsCode.startsWith('90')) {
          productDescription = 'Optical, photographic, measuring, checking, precision instruments';
          section = 'XVIII';
          sectionDescription = 'Optical, photographic, measuring instruments';
        }

        setConfig({
          ...config,
          productInfo: {
            hsCode,
            productDescription,
            section,
            sectionDescription
          }
        });
      }, 500);
    }
  };

  // Handle parameter changes
  const handleParameterChange = (
    paramType: 'tariffParameters' | 'financialParameters',
    paramId: string,
    field: keyof TariffParameter,
    value: any
  ) => {
    setConfig({
      ...config,
      [paramType]: config[paramType].map(param => 
        param.id === paramId ? { ...param, [field]: value } : param
      )
    });
  };

  // Handle simulation settings changes
  const handleSimulationSettingChange = (setting: keyof SimulationSettings, value: any) => {
    setConfig({
      ...config,
      simulationSettings: {
        ...config.simulationSettings,
        [setting]: value
      }
    });

    // Update iterations based on precision
    if (setting === 'precision') {
      const iterations = 
        value === 'Preview' ? 1000 :
        value === 'Medium' ? 5000 : 10000;
      
      setConfig({
        ...config,
        simulationSettings: {
          ...config.simulationSettings,
          precision: value as 'Preview' | 'Medium' | 'High',
          iterations
        }
      });
    }
  };

  // Handle case boundary changes
  const handleCaseBoundaryChange = (
    caseType: keyof SimulationSettings['caseBoundaries'],
    index: 0 | 1,
    value: number
  ) => {
    const boundaries = { ...config.simulationSettings.caseBoundaries };
    boundaries[caseType][index] = value;

    // Ensure boundaries don't overlap
    if (caseType === 'pessimistic' && index === 1) {
      boundaries.realistic[0] = value;
    } else if (caseType === 'realistic' && index === 0) {
      boundaries.pessimistic[1] = value;
    } else if (caseType === 'realistic' && index === 1) {
      boundaries.optimistic[0] = value;
    } else if (caseType === 'optimistic' && index === 0) {
      boundaries.realistic[1] = value;
    }

    setConfig({
      ...config,
      simulationSettings: {
        ...config.simulationSettings,
        caseBoundaries: boundaries
      }
    });
  };

  // Add new parameter
  const addParameter = (paramType: 'tariffParameters' | 'financialParameters') => {
    const newParam: TariffParameter = {
      id: `custom-${Date.now()}`,
      name: 'Custom Parameter',
      value: 0,
      min: 0,
      max: 100,
      distribution: 'Normal',
      description: 'Custom parameter description'
    };

    setConfig({
      ...config,
      [paramType]: [...config[paramType], newParam]
    });
  };

  // Run simulation
  const handleRunSimulation = () => {
    if (onRunSimulation) {
      onRunSimulation(config);
    }
  };

  return (
    <div 
      className={`rounded-lg overflow-hidden ${className}`}
      style={{ 
        backgroundColor: currentColors.cardBackground,
        border: `1px solid ${currentColors.border}`,
        color: currentColors.text
      }}
    >
      {/* Header */}
      <div 
        className="p-3 border-b horizon-header"
        style={{ 
          backgroundColor: currentColors.headerBackground,
          borderColor: currentColors.border
        }}
      >
        <div 
          className="font-medium flex items-center gap-2"
          style={{ color: currentColors.text }}
        >
          <Settings size={18} style={{ color: currentColors.honoluluBlue }} />
          <span>Parameter Configuration</span>
        </div>
      </div>
      
      <div className="p-4">
        {/* Product Information Section */}
        <div 
          className="mb-4 rounded-lg overflow-hidden border"
          style={{ 
            borderColor: currentColors.border,
          }}
        >
          {/* Section Header */}
          <button
            className="w-full p-3 flex items-center justify-between transition-colors"
            style={{ 
              backgroundColor: expandedSections.productInfo ? currentColors.headerBackground : 'transparent',
              color: currentColors.text
            }}
            onClick={() => toggleSection('productInfo')}
          >
            <div className="flex items-center gap-2">
              <Package size={16} style={{ color: currentColors.honoluluBlue }} />
              <span className="font-medium">Product Information</span>
            </div>
            <ChevronRight 
              size={16} 
              style={{ 
                transform: expandedSections.productInfo ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                color: currentColors.textSecondary
              }} 
            />
          </button>
          
          {/* Section Content */}
          {expandedSections.productInfo && (
            <div className="p-3 border-t" style={{ borderColor: currentColors.border }}>
              <div className="relative mb-4">
                <label 
                  className="block text-sm mb-1"
                  style={{ color: currentColors.textSecondary }}
                >
                  HS Code
                </label>
                <input
                  type="text"
                  value={config.productInfo.hsCode}
                  onChange={handleHSCodeChange}
                  placeholder="e.g., 85287280"
                  className="w-full px-3 py-2 rounded text-sm"
                  style={{ 
                    backgroundColor: currentColors.inputBackground,
                    border: `1px solid ${currentColors.inputBorder}`,
                    color: currentColors.text
                  }}
                />
                <div 
                  className="mt-1 text-xs"
                  style={{ color: currentColors.textSecondary }}
                >
                  Enter 8-digit HS code
                </div>
                
                <div className="absolute right-2 top-8">
                  <div className="relative group">
                    <HelpCircle 
                      size={16} 
                      style={{ color: currentColors.textSecondary }} 
                    />
                    <div 
                      className="absolute right-0 top-full mt-2 z-10 p-2 text-xs rounded w-52 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ 
                        backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.8)',
                        color: 'white'
                      }}
                    >
                      Enter the 8-digit HS code to identify the product category for tariff calculation
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Product Description */}
              <div className="mb-4">
                <label 
                  className="block text-sm mb-1"
                  style={{ color: currentColors.textSecondary }}
                >
                  Product Description
                </label>
                <input
                  type="text"
                  value={config.productInfo.productDescription}
                  disabled
                  className="w-full px-3 py-2 rounded text-sm"
                  style={{ 
                    backgroundColor: theme === 'dark' ? '#222222' : '#f5f5f5',
                    border: `1px solid ${currentColors.inputBorder}`,
                    color: currentColors.text,
                    opacity: 0.8
                  }}
                />
              </div>
              
              {/* Section and Section Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label 
                    className="block text-sm mb-1"
                    style={{ color: currentColors.textSecondary }}
                  >
                    Section
                  </label>
                  <input
                    type="text"
                    value={config.productInfo.section}
                    disabled
                    className="w-full px-3 py-2 rounded text-sm"
                    style={{ 
                      backgroundColor: theme === 'dark' ? '#222222' : '#f5f5f5',
                      border: `1px solid ${currentColors.inputBorder}`,
                      color: currentColors.text,
                      opacity: 0.8
                    }}
                  />
                </div>
                <div>
                  <label 
                    className="block text-sm mb-1"
                    style={{ color: currentColors.textSecondary }}
                  >
                    Section Description
                  </label>
                  <input
                    type="text"
                    value={config.productInfo.sectionDescription}
                    disabled
                    className="w-full px-3 py-2 rounded text-sm"
                    style={{ 
                      backgroundColor: theme === 'dark' ? '#222222' : '#f5f5f5',
                      border: `1px solid ${currentColors.inputBorder}`,
                      color: currentColors.text,
                      opacity: 0.8
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Tariff Parameters Section */}
        <div 
          className="mb-4 rounded-lg overflow-hidden border"
          style={{ 
            borderColor: currentColors.border,
          }}
        >
          {/* Section Header */}
          <button
            className="w-full p-3 flex items-center justify-between transition-colors"
            style={{ 
              backgroundColor: expandedSections.tariffParameters ? currentColors.headerBackground : 'transparent',
              color: currentColors.text
            }}
            onClick={() => toggleSection('tariffParameters')}
          >
            <div className="flex items-center gap-2">
              <TrendingUp size={16} style={{ color: currentColors.honoluluBlue }} />
              <span className="font-medium">Tariff Parameters</span>
            </div>
            <ChevronRight 
              size={16} 
              style={{ 
                transform: expandedSections.tariffParameters ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                color: currentColors.textSecondary
              }} 
            />
          </button>
          
          {/* Section Content */}
          {expandedSections.tariffParameters && (
            <div className="p-3 border-t" style={{ borderColor: currentColors.border }}>
              {config.tariffParameters.map((param, index) => (
                <div 
                  key={param.id}
                  className="mb-4"
                >
                  <div 
                    className="font-medium text-sm mb-2 flex items-center justify-between"
                    style={{ color: currentColors.text }}
                  >
                    <div className="flex items-center gap-2">
                      <span>{param.name}:</span>
                      <span className="font-bold">{formatValue(param.value, param.unit)}</span>
                    </div>
                    
                    <div className="relative group">
                      <Info 
                        size={14} 
                        style={{ color: currentColors.textSecondary }} 
                      />
                      <div 
                        className="absolute right-0 top-full mt-2 z-10 p-2 text-xs rounded w-52 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ 
                          backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.8)',
                          color: 'white'
                        }}
                      >
                        {param.description}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                    {/* Min Value */}
                    <div>
                      <label 
                        className="block text-xs mb-1"
                        style={{ color: currentColors.textSecondary }}
                      >
                        Min Value
                      </label>
                      <input
                        type="text"
                        value={param.min}
                        onChange={(e) => handleParameterChange(
                          'tariffParameters',
                          param.id,
                          'min',
                          typeof param.min === 'number' ? Number(e.target.value) : e.target.value
                        )}
                        className="w-full px-2 py-1.5 rounded text-sm"
                        style={{ 
                          backgroundColor: currentColors.inputBackground,
                          border: `1px solid ${currentColors.inputBorder}`,
                          color: currentColors.text
                        }}
                      />
                    </div>
                    
                    {/* Max Value */}
                    <div>
                      <label 
                        className="block text-xs mb-1"
                        style={{ color: currentColors.textSecondary }}
                      >
                        Max Value
                      </label>
                      <input
                        type="text"
                        value={param.max}
                        onChange={(e) => handleParameterChange(
                          'tariffParameters',
                          param.id,
                          'max',
                          typeof param.max === 'number' ? Number(e.target.value) : e.target.value
                        )}
                        className="w-full px-2 py-1.5 rounded text-sm"
                        style={{ 
                          backgroundColor: currentColors.inputBackground,
                          border: `1px solid ${currentColors.inputBorder}`,
                          color: currentColors.text
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Distribution */}
                  <div>
                    <label 
                      className="block text-xs mb-1"
                      style={{ color: currentColors.textSecondary }}
                    >
                      Distribution
                    </label>
                    <select
                      value={param.distribution}
                      onChange={(e) => handleParameterChange(
                        'tariffParameters',
                        param.id,
                        'distribution',
                        e.target.value as DistributionType
                      )}
                      className="w-full px-2 py-1.5 rounded text-sm"
                      style={{ 
                        backgroundColor: currentColors.inputBackground,
                        border: `1px solid ${currentColors.inputBorder}`,
                        color: currentColors.text
                      }}
                    >
                      <option value="Normal">Normal</option>
                      <option value="Uniform">Uniform</option>
                    </select>
                  </div>
                  
                  {index < config.tariffParameters.length - 1 && (
                    <div 
                      className="my-4"
                      style={{ 
                        height: '1px',
                        backgroundColor: currentColors.divider 
                      }}
                    ></div>
                  )}
                </div>
              ))}
              
              <button
                className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors mt-2"
                style={{ 
                  backgroundColor: currentColors.buttonSecondaryBackground,
                  color: currentColors.buttonSecondaryText,
                  border: `1px solid ${currentColors.buttonSecondaryBorder}`
                }}
                onClick={() => addParameter('tariffParameters')}
              >
                <Plus size={14} />
                Add Parameter
              </button>
            </div>
          )}
        </div>
        
        {/* Financial Parameters Section */}
        <div 
          className="mb-4 rounded-lg overflow-hidden border"
          style={{ 
            borderColor: currentColors.border,
          }}
        >
          {/* Section Header */}
          <button
            className="w-full p-3 flex items-center justify-between transition-colors"
            style={{ 
              backgroundColor: expandedSections.financialParameters ? currentColors.headerBackground : 'transparent',
              color: currentColors.text
            }}
            onClick={() => toggleSection('financialParameters')}
          >
            <div className="flex items-center gap-2">
              <TrendingUp size={16} style={{ color: currentColors.honoluluBlue }} />
              <span className="font-medium">Financial Parameters</span>
            </div>
            <ChevronRight 
              size={16} 
              style={{ 
                transform: expandedSections.financialParameters ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                color: currentColors.textSecondary
              }} 
            />
          </button>
          
          {/* Section Content */}
          {expandedSections.financialParameters && (
            <div className="p-3 border-t" style={{ borderColor: currentColors.border }}>
              {config.financialParameters.map((param, index) => (
                <div 
                  key={param.id}
                  className="mb-4"
                >
                  <div 
                    className="font-medium text-sm mb-2 flex items-center justify-between"
                    style={{ color: currentColors.text }}
                  >
                    <div className="flex items-center gap-2">
                      <span>{param.name}:</span>
                      <span className="font-bold">{formatValue(param.value, param.unit)}</span>
                    </div>
                    
                    <div className="relative group">
                      <Info 
                        size={14} 
                        style={{ color: currentColors.textSecondary }} 
                      />
                      <div 
                        className="absolute right-0 top-full mt-2 z-10 p-2 text-xs rounded w-52 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ 
                          backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.8)',
                          color: 'white'
                        }}
                      >
                        {param.description}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                    {/* Min Value */}
                    <div>
                      <label 
                        className="block text-xs mb-1"
                        style={{ color: currentColors.textSecondary }}
                      >
                        Min Value
                      </label>
                      <input
                        type="text"
                        value={param.min}
                        onChange={(e) => handleParameterChange(
                          'financialParameters',
                          param.id,
                          'min',
                          typeof param.min === 'number' ? Number(e.target.value) : e.target.value
                        )}
                        className="w-full px-2 py-1.5 rounded text-sm"
                        style={{ 
                          backgroundColor: currentColors.inputBackground,
                          border: `1px solid ${currentColors.inputBorder}`,
                          color: currentColors.text
                        }}
                      />
                    </div>
                    
                    {/* Max Value */}
                    <div>
                      <label 
                        className="block text-xs mb-1"
                        style={{ color: currentColors.textSecondary }}
                      >
                        Max Value
                      </label>
                      <input
                        type="text"
                        value={param.max}
                        onChange={(e) => handleParameterChange(
                          'financialParameters',
                          param.id,
                          'max',
                          typeof param.max === 'number' ? Number(e.target.value) : e.target.value
                        )}
                        className="w-full px-2 py-1.5 rounded text-sm"
                        style={{ 
                          backgroundColor: currentColors.inputBackground,
                          border: `1px solid ${currentColors.inputBorder}`,
                          color: currentColors.text
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Distribution */}
                  <div>
                    <label 
                      className="block text-xs mb-1"
                      style={{ color: currentColors.textSecondary }}
                    >
                      Distribution
                    </label>
                    <select
                      value={param.distribution}
                      onChange={(e) => handleParameterChange(
                        'financialParameters',
                        param.id,
                        'distribution',
                        e.target.value as DistributionType
                      )}
                      className="w-full px-2 py-1.5 rounded text-sm"
                      style={{ 
                        backgroundColor: currentColors.inputBackground,
                        border: `1px solid ${currentColors.inputBorder}`,
                        color: currentColors.text
                      }}
                    >
                      <option value="Normal">Normal</option>
                      <option value="Uniform">Uniform</option>
                    </select>
                  </div>
                  
                  {index < config.financialParameters.length - 1 && (
                    <div 
                      className="my-4"
                      style={{ 
                        height: '1px',
                        backgroundColor: currentColors.divider 
                      }}
                    ></div>
                  )}
                </div>
              ))}
              
              <button
                className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors mt-2"
                style={{ 
                  backgroundColor: currentColors.buttonSecondaryBackground,
                  color: currentColors.buttonSecondaryText,
                  border: `1px solid ${currentColors.buttonSecondaryBorder}`
                }}
                onClick={() => addParameter('financialParameters')}
              >
                <Plus size={14} />
                Add Parameter
              </button>
            </div>
          )}
        </div>
        
        {/* Simulation Settings Section */}
        <div 
          className="mb-4 rounded-lg overflow-hidden border"
          style={{ 
            borderColor: currentColors.border,
          }}
        >
          {/* Section Header */}
          <button
            className="w-full p-3 flex items-center justify-between transition-colors"
            style={{ 
              backgroundColor: expandedSections.simulationSettings ? currentColors.headerBackground : 'transparent',
              color: currentColors.text
            }}
            onClick={() => toggleSection('simulationSettings')}
          >
            <div className="flex items-center gap-2">
              <Sliders size={16} style={{ color: currentColors.honoluluBlue }} />
              <span className="font-medium">Simulation Settings</span>
            </div>
            <ChevronRight 
              size={16} 
              style={{ 
                transform: expandedSections.simulationSettings ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                color: currentColors.textSecondary
              }} 
            />
          </button>
          
          {/* Section Content */}
          {expandedSections.simulationSettings && (
            <div className="p-3 border-t" style={{ borderColor: currentColors.border }}>
              {/* Precision Settings */}
              <div className="mb-4">
                <div 
                  className="font-medium text-sm mb-2"
                  style={{ color: currentColors.text }}
                >
                  Precision
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Preview Precision */}
                  <div 
                    className="flex items-center gap-2 p-2 rounded cursor-pointer transition-colors"
                    style={{ 
                      backgroundColor: config.simulationSettings.precision === 'Preview' 
                        ? currentColors.buttonSecondaryBackground 
                        : 'transparent',
                      border: `1px solid ${config.simulationSettings.precision === 'Preview'
                        ? currentColors.buttonSecondaryBorder
                        : currentColors.border}`
                    }}
                    onClick={() => handleSimulationSettingChange('precision', 'Preview')}
                  >
                    <div 
                      className="w-4 h-4 rounded-full border flex items-center justify-center"
                      style={{ 
                        borderColor: config.simulationSettings.precision === 'Preview'
                          ? currentColors.honoluluBlue
                          : currentColors.textSecondary
                      }}
                    >
                      {config.simulationSettings.precision === 'Preview' && (
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: currentColors.honoluluBlue }}
                        ></div>
                      )}
                    </div>
                    <div className="text-sm" style={{ color: currentColors.text }}>
                      Preview (1,000 iterations)
                    </div>
                  </div>
                  
                  {/* Medium Precision */}
                  <div 
                    className="flex items-center gap-2 p-2 rounded cursor-pointer transition-colors"
                    style={{ 
                      backgroundColor: config.simulationSettings.precision === 'Medium' 
                        ? currentColors.buttonSecondaryBackground 
                        : 'transparent',
                      border: `1px solid ${config.simulationSettings.precision === 'Medium'
                        ? currentColors.buttonSecondaryBorder
                        : currentColors.border}`
                    }}
                    onClick={() => handleSimulationSettingChange('precision', 'Medium')}
                  >
                    <div 
                      className="w-4 h-4 rounded-full border flex items-center justify-center"
                      style={{ 
                        borderColor: config.simulationSettings.precision === 'Medium'
                          ? currentColors.honoluluBlue
                          : currentColors.textSecondary
                      }}
                    >
                      {config.simulationSettings.precision === 'Medium' && (
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: currentColors.honoluluBlue }}
                        ></div>
                      )}
                    </div>
                    <div className="text-sm" style={{ color: currentColors.text }}>
                      Medium (5,000 iterations)
                    </div>
                  </div>
                  
                  {/* High Precision */}
                  <div 
                    className="flex items-center gap-2 p-2 rounded cursor-pointer transition-colors"
                    style={{ 
                      backgroundColor: config.simulationSettings.precision === 'High' 
                        ? currentColors.buttonSecondaryBackground 
                        : 'transparent',
                      border: `1px solid ${config.simulationSettings.precision === 'High'
                        ? currentColors.buttonSecondaryBorder
                        : currentColors.border}`
                    }}
                    onClick={() => handleSimulationSettingChange('precision', 'High')}
                  >
                    <div 
                      className="w-4 h-4 rounded-full border flex items-center justify-center"
                      style={{ 
                        borderColor: config.simulationSettings.precision === 'High'
                          ? currentColors.honoluluBlue
                          : currentColors.textSecondary
                      }}
                    >
                      {config.simulationSettings.precision === 'High' && (
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: currentColors.honoluluBlue }}
                        ></div>
                      )}
                    </div>
                    <div className="text-sm" style={{ color: currentColors.text }}>
                      High (10,000 iterations)
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Iterations Display */}
              <div 
                className="rounded p-3 mb-4 flex items-center justify-between"
                style={{ 
                  backgroundColor: currentColors.sectionBackground,
                  border: `1px solid ${currentColors.border}`
                }}
              >
                <div className="text-sm" style={{ color: currentColors.text }}>
                  Total Iterations:
                </div>
                <div 
                  className="font-semibold"
                  style={{ color: currentColors.text }}
                >
                  {config.simulationSettings.iterations.toLocaleString()}
                </div>
              </div>
              
              {/* Case Boundaries */}
              <div className="mb-4">
                <div 
                  className="font-medium text-sm mb-3"
                  style={{ color: currentColors.text }}
                >
                  Case Boundaries
                </div>
                
                {/* Pessimistic Range */}
                <div className="mb-3">
                  <div 
                    className="flex items-center justify-between text-sm mb-1"
                    style={{ color: currentColors.textSecondary }}
                  >
                    <span>Pessimistic:</span>
                    <span style={{ color: currentColors.pessimistic }}>
                      {config.simulationSettings.caseBoundaries.pessimistic[0]}% - {config.simulationSettings.caseBoundaries.pessimistic[1]}%
                    </span>
                  </div>
                  <div 
                    className="h-2 w-full rounded-full relative"
                    style={{ backgroundColor: currentColors.inputBackground }}
                  >
                    <div 
                      className="absolute top-0 left-0 h-full rounded-full"
                      style={{ 
                        width: `${config.simulationSettings.caseBoundaries.pessimistic[1]}%`,
                        backgroundColor: currentColors.pessimistic,
                        opacity: 0.7
                      }}
                    ></div>
                  </div>
                </div>
                
                {/* Realistic Range */}
                <div className="mb-3">
                  <div 
                    className="flex items-center justify-between text-sm mb-1"
                    style={{ color: currentColors.textSecondary }}
                  >
                    <span>Realistic:</span>
                    <span style={{ color: currentColors.realistic }}>
                      {config.simulationSettings.caseBoundaries.realistic[0]}% - {config.simulationSettings.caseBoundaries.realistic[1]}%
                    </span>
                  </div>
                  <div 
                    className="h-2 w-full rounded-full relative"
                    style={{ backgroundColor: currentColors.inputBackground }}
                  >
                    <div 
                      className="absolute top-0 left-0 h-full rounded-full"
                      style={{ 
                        left: `${config.simulationSettings.caseBoundaries.realistic[0]}%`,
                        width: `${config.simulationSettings.caseBoundaries.realistic[1] - config.simulationSettings.caseBoundaries.realistic[0]}%`,
                        backgroundColor: currentColors.realistic,
                        opacity: 0.7
                      }}
                    ></div>
                  </div>
                </div>
                
                {/* Optimistic Range */}
                <div className="mb-3">
                  <div 
                    className="flex items-center justify-between text-sm mb-1"
                    style={{ color: currentColors.textSecondary }}
                  >
                    <span>Optimistic:</span>
                    <span style={{ color: currentColors.optimistic }}>
                      {config.simulationSettings.caseBoundaries.optimistic[0]}% - {config.simulationSettings.caseBoundaries.optimistic[1]}%
                    </span>
                  </div>
                  <div 
                    className="h-2 w-full rounded-full relative"
                    style={{ backgroundColor: currentColors.inputBackground }}
                  >
                    <div 
                      className="absolute top-0 right-0 h-full rounded-full"
                      style={{ 
                        width: `${100 - config.simulationSettings.caseBoundaries.optimistic[0]}%`,
                        backgroundColor: currentColors.optimistic,
                        opacity: 0.7
                      }}
                    ></div>
                  </div>
                </div>
                
                {/* Slider for Realistic Range */}
                <div 
                  className="p-3 rounded mt-4"
                  style={{ 
                    backgroundColor: currentColors.sectionBackground,
                    border: `1px solid ${currentColors.border}`
                  }}
                >
                  <div
                    className="text-xs mb-2 text-center"
                    style={{ color: currentColors.textSecondary }}
                  >
                    Adjust Realistic Range
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <input
                      type="range"
                      min="0"
                      max="95"
                      value={config.simulationSettings.caseBoundaries.realistic[0]}
                      onChange={(e) => handleCaseBoundaryChange('realistic', 0, parseInt(e.target.value))}
                      className="w-5/12"
                    />
                    
                    <div 
                      className="px-2 py-1 text-xs rounded"
                      style={{ 
                        backgroundColor: currentColors.inputBackground,
                        color: currentColors.text
                      }}
                    >
                      {config.simulationSettings.caseBoundaries.realistic[0]}% - {config.simulationSettings.caseBoundaries.realistic[1]}%
                    </div>
                    
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={config.simulationSettings.caseBoundaries.realistic[1]}
                      onChange={(e) => handleCaseBoundaryChange('realistic', 1, parseInt(e.target.value))}
                      className="w-5/12"
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs" style={{ color: currentColors.textSecondary }}>
                    <span>Pessimistic</span>
                    <span>Realistic</span>
                    <span>Optimistic</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Network/device optimization notice */}
        {adaptive && (connection.type === 'slow-2g' || connection.type === '2g' || tier === 'low') && !simplified && (
          <div 
            className="p-3 rounded mb-4 flex items-center gap-2"
            style={{ 
              backgroundColor: currentColors.sectionBackground,
              border: `1px solid ${currentColors.border}`
            }}
          >
            <AlertCircle 
              size={16} 
              style={{ color: currentColors.sun }}
            />
            <div className="text-xs" style={{ color: currentColors.textSecondary }}>
              Simplified view optimized for current network/device conditions
            </div>
          </div>
        )}
        
        {/* Run Simulation Button */}
        <button
          className="w-full py-2.5 px-4 rounded font-medium flex items-center justify-center gap-2"
          style={{ 
            backgroundColor: currentColors.honoluluBlue,
            color: currentColors.buttonText
          }}
          onClick={handleRunSimulation}
        >
          Run Simulation
        </button>
      </div>
    </div>
  );
};

export default EnhancedVietnamMonteCarloParams;