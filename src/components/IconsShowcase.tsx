import React, { useState } from 'react';
import { 
  AlertIcon, 
  ArrowIcon, 
  ChartIcon, 
  LoadingIcon, 
  NavIcon, 
  SearchIcon, 
  SparklesIcon 
} from './icons';

const animations = ['none', 'pulse', 'bounce', 'spin', 'wobble'];
const hoverEffects = ['none', 'scale', 'rotate', 'color', 'strokeWidth'];

interface IconSetProps {
  title: string;
  children: React.ReactNode;
}

const IconSet: React.FC<IconSetProps> = ({ title, children }) => (
  <div className="mb-8">
    <h3 className="text-lg font-medium text-gray-800 mb-3">{title}</h3>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-4">
      {children}
    </div>
  </div>
);

interface IconDemoProps {
  name: string;
  icon: React.ReactNode;
}

const IconDemo: React.FC<IconDemoProps> = ({ name, icon }) => (
  <div className="flex flex-col items-center gap-2 p-4 border border-[rgb(var(--scb-border))] rounded-lg hover:bg-gray-50 transition">
    <div className="w-12 h-12 flex items-center justify-center">
      {icon}
    </div>
    <span className="text-xs text-gray-700 text-center">{name}</span>
  </div>
);

export default function IconsShowcase() {
  const [animation, setAnimation] = useState<'none' | 'pulse' | 'bounce' | 'spin' | 'morph' | 'wobble'>('pulse');
  const [hoverEffect, setHoverEffect] = useState<'none' | 'scale' | 'rotate' | 'color' | 'strokeWidth'>('scale');
  const [size, setSize] = useState(24);
  const [strokeWidth, setStrokeWidth] = useState(2);
  
  return (
    <div className="w-full">
      <div className="bg-white p-6 rounded-lg border border-[rgb(var(--scb-border))]">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">FinSight Animated Icons</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Animation Type</h3>
            <div className="flex flex-wrap gap-2">
              {animations.map((anim) => (
                <button
                  key={anim}
                  onClick={() => setAnimation(anim as 'none' | 'pulse' | 'bounce' | 'spin' | 'morph' | 'wobble')}
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
                  onClick={() => setHoverEffect(effect as 'none' | 'scale' | 'rotate' | 'color' | 'strokeWidth')}
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Size: {size}px</h3>
            <input 
              type="range" 
              min="16" 
              max="48" 
              value={size} 
              onChange={(e) => setSize(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Stroke Width: {strokeWidth}</h3>
            <input 
              type="range" 
              min="1" 
              max="4" 
              step="0.5"
              value={strokeWidth} 
              onChange={(e) => setStrokeWidth(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
        
        <div className="border-t border-[rgb(var(--scb-border))] pt-6">
          <IconSet title="Alert Icons">
            <IconDemo 
              name="Alert" 
              icon={<AlertIcon variant="alert" animation={animation} hoverEffect={hoverEffect} size={size} strokeWidth={strokeWidth} />} 
            />
            <IconDemo 
              name="Warning" 
              icon={<AlertIcon variant="warning" animation={animation} hoverEffect={hoverEffect} size={size} strokeWidth={strokeWidth} />} 
            />
            <IconDemo 
              name="Info" 
              icon={<AlertIcon variant="info" animation={animation} hoverEffect={hoverEffect} size={size} strokeWidth={strokeWidth} />} 
            />
          </IconSet>
          
          <IconSet title="Chart Icons">
            <IconDemo 
              name="Bar Chart" 
              icon={<ChartIcon variant="bar" animation={animation} hoverEffect={hoverEffect} size={size} strokeWidth={strokeWidth} />} 
            />
            <IconDemo 
              name="Line Chart" 
              icon={<ChartIcon variant="line" animation={animation} hoverEffect={hoverEffect} size={size} strokeWidth={strokeWidth} />} 
            />
            <IconDemo 
              name="Pie Chart" 
              icon={<ChartIcon variant="pie" animation={animation} hoverEffect={hoverEffect} size={size} strokeWidth={strokeWidth} />} 
            />
            <IconDemo 
              name="Trending Up" 
              icon={<ChartIcon variant="trending-up" animation={animation} hoverEffect={hoverEffect} size={size} strokeWidth={strokeWidth} />} 
            />
            <IconDemo 
              name="Trending Down" 
              icon={<ChartIcon variant="trending-down" animation={animation} hoverEffect={hoverEffect} size={size} strokeWidth={strokeWidth} />} 
            />
          </IconSet>
          
          <IconSet title="Navigation Icons">
            <IconDemo 
              name="Home" 
              icon={<NavIcon variant="home" animation={animation} hoverEffect={hoverEffect} size={size} strokeWidth={strokeWidth} />} 
            />
            <IconDemo 
              name="Dashboard" 
              icon={<NavIcon variant="dashboard" animation={animation} hoverEffect={hoverEffect} size={size} strokeWidth={strokeWidth} />} 
            />
            <IconDemo 
              name="Portfolio" 
              icon={<NavIcon variant="portfolio" animation={animation} hoverEffect={hoverEffect} size={size} strokeWidth={strokeWidth} />} 
            />
            <IconDemo 
              name="Analytics" 
              icon={<NavIcon variant="analytics" animation={animation} hoverEffect={hoverEffect} size={size} strokeWidth={strokeWidth} />} 
            />
            <IconDemo 
              name="Reports" 
              icon={<NavIcon variant="reports" animation={animation} hoverEffect={hoverEffect} size={size} strokeWidth={strokeWidth} />} 
            />
            <IconDemo 
              name="Settings" 
              icon={<NavIcon variant="settings" animation={animation} hoverEffect={hoverEffect} size={size} strokeWidth={strokeWidth} />} 
            />
          </IconSet>
          
          <IconSet title="Arrow Icons">
            <IconDemo 
              name="Arrow Up" 
              icon={<ArrowIcon variant="up" animation={animation} hoverEffect={hoverEffect} size={size} strokeWidth={strokeWidth} />} 
            />
            <IconDemo 
              name="Arrow Down" 
              icon={<ArrowIcon variant="down" animation={animation} hoverEffect={hoverEffect} size={size} strokeWidth={strokeWidth} />} 
            />
            <IconDemo 
              name="Arrow Left" 
              icon={<ArrowIcon variant="left" animation={animation} hoverEffect={hoverEffect} size={size} strokeWidth={strokeWidth} />} 
            />
            <IconDemo 
              name="Arrow Right" 
              icon={<ArrowIcon variant="right" animation={animation} hoverEffect={hoverEffect} size={size} strokeWidth={strokeWidth} />} 
            />
            <IconDemo 
              name="Chevron Up" 
              icon={<ArrowIcon variant="chevron-up" animation={animation} hoverEffect={hoverEffect} size={size} strokeWidth={strokeWidth} />} 
            />
            <IconDemo 
              name="Chevron Down" 
              icon={<ArrowIcon variant="chevron-down" animation={animation} hoverEffect={hoverEffect} size={size} strokeWidth={strokeWidth} />} 
            />
            <IconDemo 
              name="Chevron Left" 
              icon={<ArrowIcon variant="chevron-left" animation={animation} hoverEffect={hoverEffect} size={size} strokeWidth={strokeWidth} />} 
            />
            <IconDemo 
              name="Chevron Right" 
              icon={<ArrowIcon variant="chevron-right" animation={animation} hoverEffect={hoverEffect} size={size} strokeWidth={strokeWidth} />} 
            />
          </IconSet>
          
          <IconSet title="Loading Icons">
            <IconDemo 
              name="Spinner" 
              icon={<LoadingIcon variant="spinner" animation={animation} hoverEffect={hoverEffect} size={size} strokeWidth={strokeWidth} />} 
            />
            <IconDemo 
              name="Dots" 
              icon={<LoadingIcon variant="dots" animation={animation} hoverEffect={hoverEffect} size={size} strokeWidth={strokeWidth} />} 
            />
            <IconDemo 
              name="Circle" 
              icon={<LoadingIcon variant="circle" animation={animation} hoverEffect={hoverEffect} size={size} strokeWidth={strokeWidth} />} 
            />
          </IconSet>
          
          <IconSet title="Utility Icons">
            <IconDemo 
              name="Search" 
              icon={<SearchIcon animation={animation} hoverEffect={hoverEffect} size={size} strokeWidth={strokeWidth} />} 
            />
            <IconDemo 
              name="Sparkles" 
              icon={<SparklesIcon animation={animation} hoverEffect={hoverEffect} size={size} strokeWidth={strokeWidth} />} 
            />
          </IconSet>
        </div>
      </div>
      
      <div className="mt-8 bg-white p-6 rounded-lg border border-[rgb(var(--scb-border))]">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Usage Examples</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600 mb-3">Button with Icon</h4>
            <div className="flex flex-col gap-3">
              <button className="fiori-btn fiori-btn-primary flex items-center gap-2">
                <NavIcon variant="portfolio" size={20} />
                <span>View Portfolio</span>
              </button>
              
              <button className="fiori-btn fiori-btn-secondary flex items-center gap-2">
                <ChartIcon variant="line" size={20} />
                <span>Show Analytics</span>
              </button>
              
              <button className="px-4 py-2 rounded-lg bg-white border border-[rgb(var(--scb-border))] flex items-center gap-2 text-sm hover:bg-gray-50">
                <LoadingIcon variant="spinner" size={16} />
                <span>Loading...</span>
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600 mb-3">Alert with Icon</h4>
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-md bg-red-50 border border-red-200 flex items-start gap-3">
                <AlertIcon variant="alert" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Error</p>
                  <p className="text-xs text-red-700">There was a problem with your request</p>
                </div>
              </div>
              
              <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200 flex items-start gap-3">
                <AlertIcon variant="warning" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">Warning</p>
                  <p className="text-xs text-yellow-700">Your account is approaching its limit</p>
                </div>
              </div>
              
              <div className="p-3 rounded-md bg-blue-50 border border-blue-200 flex items-start gap-3">
                <AlertIcon variant="info" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">Information</p>
                  <p className="text-xs text-blue-700">A new report is available for download</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}