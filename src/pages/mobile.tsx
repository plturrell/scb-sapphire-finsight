import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { useIOS, useMediaQuery } from '../hooks/useResponsive';
import { useDeviceCapabilities } from '../hooks/useDeviceCapabilities';
import { useMicroInteractions } from '../hooks/useMicroInteractions';
import EnhancedTouchButton from '../components/EnhancedTouchButton';
import { 
  ChevronLeft, ChevronRight, Bell, FileText, MoreHorizontal, 
  Home, LayoutGrid, Search, Settings, HelpCircle, Info,
  BarChart2, Clock, Tag, User, MessageSquare, Download
} from 'lucide-react';

interface TabProps {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  badge?: number;
}

function Tab({ label, icon, active, onClick, badge }: TabProps) {
  const { haptic } = useMicroInteractions();
  const isAppleDevice = useIOS();
  
  const handleClick = () => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptic({ intensity: 'light' });
    }
    onClick();
  };
  
  return (
    <button
      onClick={handleClick}
      className={`py-3 px-4 text-sm font-medium flex flex-col items-center gap-1 transition-colors ${
        active
          ? 'text-[rgb(var(--scb-honolulu-blue))]'
          : 'text-[rgb(var(--scb-dark-gray))]'
      }`}
    >
      <div className="relative">
        {icon}
        {badge && badge > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[rgb(var(--scb-honolulu-blue))] text-white text-[10px] font-medium flex items-center justify-center rounded-full">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      <span>{label}</span>
    </button>
  );
}

function NavButton({ icon, label, active, onClick }) {
  const { haptic } = useMicroInteractions();
  const isAppleDevice = useIOS();
  
  const handleClick = () => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptic({ intensity: 'light' });
    }
    onClick();
  };
  
  return (
    <button
      onClick={handleClick}
      className={`p-2 flex flex-col items-center justify-center gap-1 ${
        active
          ? 'text-[rgb(var(--scb-honolulu-blue))]'
          : 'text-[rgb(var(--scb-dark-gray))]'
      }`}
    >
      {icon}
      <span className="text-[10px]">{label}</span>
    </button>
  );
}

export default function MobileView() {
  const [activeTab, setActiveTab] = useState('feed');
  const [activeNavItem, setActiveNavItem] = useState('home');
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [showSafeArea, setShowSafeArea] = useState(true);
  
  // Platform detection and UI enhancement hooks
  const isAppleDevice = useIOS();
  const [isPlatformDetected, setIsPlatformDetected] = useState(false);
  const { haptic } = useMicroInteractions();
  const { touchCapable, screenSize } = useDeviceCapabilities();
  const { isDarkMode } = useUIPreferences();
  
  // Responsive state
  const isMobile = useMediaQuery('(max-width: 640px)');
  
  // Set platform detection flag
  useEffect(() => {
    setIsPlatformDetected(true);
  }, []);
  
  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptic({ intensity: 'light' });
    }
  };
  
  // Handle navigation change
  const handleNavChange = (item: string) => {
    setActiveNavItem(item);
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptic({ intensity: 'light' });
    }
  };
  
  // Handle notification button click
  const handleNotificationClick = () => {
    setUnreadNotifications(0);
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptic({ intensity: 'medium' });
    }
  };
  
  // Handle download click
  const handleDownloadClick = () => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptic({ intensity: 'medium' });
    }
    
    alert('Downloading document...');
  };
  
  // Handle post interaction
  const handlePostInteraction = (action: string) => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptic({ intensity: 'light' });
    }
    
    console.log(`Post ${action} clicked`);
  };

  return (
    <>
      <Head>
        <title>Mobile App | SCB Sapphire FinSight</title>
        <meta name="description" content="Mobile optimized view for SCB Sapphire FinSight" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
      </Head>

      <div className={`min-h-screen bg-[rgb(var(--scb-light-gray))] dark:bg-[rgb(var(--scb-dark-background))] ${showSafeArea ? 'pt-safe pb-safe pl-safe pr-safe' : ''}`}>
        {/* Header */}
        <header className="bg-white dark:bg-[rgb(var(--scb-dark-background))] border-b border-[rgb(var(--scb-border))] sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <Link href="/" className="p-1.5 rounded-full">
                <ChevronLeft className="w-5 h-5 text-[rgb(var(--scb-dark-gray))]" />
              </Link>
              <h1 className="text-lg font-semibold ml-2 text-[rgb(var(--scb-primary))]">FinSight Mobile</h1>
            </div>
            <div className="flex items-center space-x-1">
              <button 
                className="p-2 rounded-full relative"
                onClick={handleNotificationClick}
              >
                <Bell className="w-5 h-5 text-[rgb(var(--scb-dark-gray))]" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 w-3 h-3 bg-[rgb(var(--scb-honolulu-blue))] rounded-full"></span>
                )}
              </button>
              <button className="p-2 rounded-full">
                <Search className="w-5 h-5 text-[rgb(var(--scb-dark-gray))]" />
              </button>
            </div>
          </div>
          <div className="flex overflow-x-auto scrollbar-hide">
            <Tab 
              label="Feed" 
              icon={<Home size={18} />} 
              active={activeTab === 'feed'} 
              onClick={() => handleTabChange('feed')} 
            />
            <Tab 
              label="Market" 
              icon={<BarChart2 size={18} />} 
              active={activeTab === 'market'} 
              onClick={() => handleTabChange('market')} 
            />
            <Tab 
              label="Documents" 
              icon={<FileText size={18} />} 
              active={activeTab === 'documents'} 
              onClick={() => handleTabChange('documents')} 
              badge={2}
            />
            <Tab 
              label="Messages" 
              icon={<MessageSquare size={18} />} 
              active={activeTab === 'messages'} 
              onClick={() => handleTabChange('messages')} 
              badge={5}
            />
          </div>
        </header>

        {/* Content */}
        <main className="p-4 pb-20">
          {activeTab === 'feed' && (
            <div className="space-y-4">
              {/* Featured card */}
              <div className="bg-[rgba(var(--scb-light-blue),0.3)] dark:bg-[rgba(var(--scb-dark-blue),0.2)] p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Tag className="text-[rgb(var(--scb-honolulu-blue))] mr-2" size={16} />
                    <span className="text-[rgb(var(--scb-honolulu-blue))] text-sm font-medium">Featured Update</span>
                  </div>
                  <span className="text-xs text-[rgb(var(--scb-dark-gray))]">1h ago</span>
                </div>
                <h3 className="font-semibold mb-1 text-[rgb(var(--scb-dark-gray))]">Q2 Fiscal Report Released</h3>
                <p className="text-sm text-[rgb(var(--scb-dark-gray))] mb-3">Strong growth in ASEAN markets contributing to Q2 performance...</p>
                
                <div className="flex items-center gap-2 mt-2">
                  {isAppleDevice && isPlatformDetected ? (
                    <EnhancedTouchButton
                      onClick={() => handlePostInteraction('view')}
                      variant="primary"
                      size="xs"
                    >
                      View Report
                    </EnhancedTouchButton>
                  ) : (
                    <button 
                      className="px-3 py-1.5 text-xs font-medium rounded-md bg-[rgb(var(--scb-honolulu-blue))] text-white"
                      onClick={() => handlePostInteraction('view')}
                    >
                      View Report
                    </button>
                  )}
                  
                  <button 
                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-transparent text-[rgb(var(--scb-dark-gray))] border border-[rgb(var(--scb-border))]"
                    onClick={() => handlePostInteraction('share')}
                  >
                    Share
                  </button>
                </div>
              </div>
              
              {/* Post cards */}
              <div className="bg-white dark:bg-[rgba(var(--scb-dark-gray),0.05)] rounded-lg p-4 shadow-sm border border-[rgb(var(--scb-border))]">
                <div className="flex items-center mb-3">
                  <div className="w-9 h-9 rounded-full bg-[rgb(var(--scb-honolulu-blue))] flex items-center justify-center text-white mr-3">
                    <User size={16} />
                  </div>
                  <div>
                    <h4 className="font-medium text-[rgb(var(--scb-dark-gray))]">Sarah Chen</h4>
                    <p className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70">Financial Analyst • 2h ago</p>
                  </div>
                </div>
                <h3 className="font-semibold mb-2 text-[rgb(var(--scb-dark-gray))]">Market Update</h3>
                <p className="text-sm text-[rgb(var(--scb-dark-gray))]">
                  Asia-Pacific markets showing strong performance this week. Malaysia and Vietnam leading the pack with significant growth in technology sectors.
                </p>
                <div className="mt-4 flex justify-between items-center">
                  <div className="flex items-center gap-3 text-xs text-[rgb(var(--scb-dark-gray))]">
                    <button 
                      className="flex items-center"
                      onClick={() => handlePostInteraction('like')}
                    >
                      <span className="font-medium">12</span>
                      <span className="ml-1">Likes</span>
                    </button>
                    <button 
                      className="flex items-center"
                      onClick={() => handlePostInteraction('comment')}
                    >
                      <span className="font-medium">4</span>
                      <span className="ml-1">Comments</span>
                    </button>
                  </div>
                  <button 
                    className="text-xs text-[rgb(var(--scb-honolulu-blue))] font-medium"
                    onClick={() => handlePostInteraction('save')}
                  >
                    Save
                  </button>
                </div>
              </div>
              
              <div className="bg-white dark:bg-[rgba(var(--scb-dark-gray),0.05)] rounded-lg p-4 shadow-sm border border-[rgb(var(--scb-border))]">
                <div className="flex items-center mb-3">
                  <div className="w-9 h-9 rounded-full bg-[rgb(var(--scb-american-green))] flex items-center justify-center text-white mr-3">
                    <User size={16} />
                  </div>
                  <div>
                    <h4 className="font-medium text-[rgb(var(--scb-dark-gray))]">Michael Wong</h4>
                    <p className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70">Market Strategist • 5h ago</p>
                  </div>
                </div>
                <h3 className="font-semibold mb-2 text-[rgb(var(--scb-dark-gray))]">Tariff Impact Analysis</h3>
                <p className="text-sm text-[rgb(var(--scb-dark-gray))]">
                  New tariff changes between Vietnam and EU partners show positive impact on export forecasts. Our analysis indicates a 15% potential growth over next quarter.
                </p>
                <div className="mt-4 flex justify-between items-center">
                  <div className="flex items-center gap-3 text-xs text-[rgb(var(--scb-dark-gray))]">
                    <button 
                      className="flex items-center"
                      onClick={() => handlePostInteraction('like')}
                    >
                      <span className="font-medium">8</span>
                      <span className="ml-1">Likes</span>
                    </button>
                    <button 
                      className="flex items-center"
                      onClick={() => handlePostInteraction('comment')}
                    >
                      <span className="font-medium">2</span>
                      <span className="ml-1">Comments</span>
                    </button>
                  </div>
                  <button 
                    className="text-xs text-[rgb(var(--scb-honolulu-blue))] font-medium"
                    onClick={() => handlePostInteraction('save')}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'market' && (
            <div className="space-y-4">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-[rgb(var(--scb-dark-gray))] mb-2">Market Insights</h2>
                <p className="text-sm text-[rgb(var(--scb-dark-gray))]">Real-time market data and analysis</p>
              </div>
              
              {/* Market summary cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-[rgba(var(--scb-dark-gray),0.05)] rounded-lg p-3 shadow-sm border border-[rgb(var(--scb-border))]">
                  <span className="text-xs font-medium text-[rgb(var(--scb-dark-gray))] opacity-70">ASEAN Index</span>
                  <div className="flex items-end justify-between mt-1">
                    <span className="text-lg font-semibold text-[rgb(var(--scb-dark-gray))]">2,487.35</span>
                    <span className="text-xs font-medium text-[rgb(var(--scb-american-green))]">+1.25%</span>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-[rgba(var(--scb-dark-gray),0.05)] rounded-lg p-3 shadow-sm border border-[rgb(var(--scb-border))]">
                  <span className="text-xs font-medium text-[rgb(var(--scb-dark-gray))] opacity-70">VN Index</span>
                  <div className="flex items-end justify-between mt-1">
                    <span className="text-lg font-semibold text-[rgb(var(--scb-dark-gray))]">1,214.86</span>
                    <span className="text-xs font-medium text-[rgb(var(--scb-muted-red))]">-0.42%</span>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-[rgba(var(--scb-dark-gray),0.05)] rounded-lg p-3 shadow-sm border border-[rgb(var(--scb-border))]">
                  <span className="text-xs font-medium text-[rgb(var(--scb-dark-gray))] opacity-70">KLCI</span>
                  <div className="flex items-end justify-between mt-1">
                    <span className="text-lg font-semibold text-[rgb(var(--scb-dark-gray))]">1,479.55</span>
                    <span className="text-xs font-medium text-[rgb(var(--scb-american-green))]">+0.89%</span>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-[rgba(var(--scb-dark-gray),0.05)] rounded-lg p-3 shadow-sm border border-[rgb(var(--scb-border))]">
                  <span className="text-xs font-medium text-[rgb(var(--scb-dark-gray))] opacity-70">SGX</span>
                  <div className="flex items-end justify-between mt-1">
                    <span className="text-lg font-semibold text-[rgb(var(--scb-dark-gray))]">3,208.44</span>
                    <span className="text-xs font-medium text-[rgb(var(--scb-american-green))]">+0.35%</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-[rgba(var(--scb-dark-gray),0.05)] rounded-lg p-4 shadow-sm border border-[rgb(var(--scb-border))]">
                <h3 className="font-semibold mb-2 text-[rgb(var(--scb-dark-gray))]">Analyst Commentary</h3>
                <p className="text-sm text-[rgb(var(--scb-dark-gray))]">
                  ASEAN markets continue their upward trajectory, supported by strong economic fundamentals and positive trade developments. Vietnam's markets show some correction after recent rallies.
                </p>
                <div className="mt-3 text-xs text-[rgb(var(--scb-dark-gray))] opacity-70 flex items-center">
                  <Clock size={12} className="mr-1" />
                  <span>Updated 43 minutes ago</span>
                </div>
              </div>
              
              <div className="bg-[rgba(var(--scb-light-blue),0.3)] dark:bg-[rgba(var(--scb-dark-blue),0.2)] p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-[rgb(var(--scb-dark-gray))]">Key Events Today</h3>
                <ul className="space-y-2 text-sm text-[rgb(var(--scb-dark-gray))]">
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--scb-honolulu-blue))] mr-2"></span>
                    <span>Vietnam GDP Report - 2:00 PM</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--scb-honolulu-blue))] mr-2"></span>
                    <span>Singapore Interest Rate Decision - 4:30 PM</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--scb-honolulu-blue))] mr-2"></span>
                    <span>Malaysia Trade Balance - 5:00 PM</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-[rgb(var(--scb-dark-gray))] mb-2">Documents</h2>
                <p className="text-sm text-[rgb(var(--scb-dark-gray))]">Recent reports and analysis</p>
              </div>
              
              <div className="bg-white dark:bg-[rgba(var(--scb-dark-gray),0.05)] rounded-lg p-4 shadow-sm border border-[rgb(var(--scb-border))] flex items-center">
                <div className="w-10 h-12 bg-[rgba(var(--scb-honolulu-blue),0.1)] rounded flex items-center justify-center mr-3">
                  <FileText className="text-[rgb(var(--scb-honolulu-blue))]" size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-[rgb(var(--scb-dark-gray))]">Vietnam Market Analysis 2025.pdf</h3>
                  <p className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70">12.4 MB • Updated 3 days ago</p>
                </div>
                <button 
                  className="p-2 text-[rgb(var(--scb-dark-gray))]"
                  onClick={handleDownloadClick}
                >
                  <Download size={18} />
                </button>
              </div>
              
              <div className="bg-white dark:bg-[rgba(var(--scb-dark-gray),0.05)] rounded-lg p-4 shadow-sm border border-[rgb(var(--scb-border))] flex items-center">
                <div className="w-10 h-12 bg-[rgba(var(--scb-american-green),0.1)] rounded flex items-center justify-center mr-3">
                  <FileText className="text-[rgb(var(--scb-american-green))]" size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-[rgb(var(--scb-dark-gray))]">ASEAN Tariff Report Q2.xlsx</h3>
                  <p className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70">8.7 MB • Updated 1 week ago</p>
                </div>
                <button 
                  className="p-2 text-[rgb(var(--scb-dark-gray))]"
                  onClick={handleDownloadClick}
                >
                  <Download size={18} />
                </button>
              </div>
              
              <div className="bg-white dark:bg-[rgba(var(--scb-dark-gray),0.05)] rounded-lg p-4 shadow-sm border border-[rgb(var(--scb-border))] flex items-center">
                <div className="w-10 h-12 bg-[rgba(var(--scb-purple),0.1)] rounded flex items-center justify-center mr-3">
                  <FileText className="text-[rgb(var(--scb-purple))]" size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-[rgb(var(--scb-dark-gray))]">Financial Projections 2025-2026.pptx</h3>
                  <p className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70">18.2 MB • Updated 2 weeks ago</p>
                </div>
                <button 
                  className="p-2 text-[rgb(var(--scb-dark-gray))]"
                  onClick={handleDownloadClick}
                >
                  <Download size={18} />
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'messages' && (
            <div className="space-y-4">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-[rgb(var(--scb-dark-gray))] mb-2">Messages</h2>
                <p className="text-sm text-[rgb(var(--scb-dark-gray))]">Your conversations</p>
              </div>
              
              <div className="space-y-3">
                <div className="bg-white dark:bg-[rgba(var(--scb-dark-gray),0.05)] rounded-lg p-3 shadow-sm border border-[rgb(var(--scb-honolulu-blue))] flex items-center">
                  <div className="w-10 h-10 rounded-full bg-[rgb(var(--scb-honolulu-blue))] flex items-center justify-center mr-3 text-white">
                    <User size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <h3 className="font-medium text-[rgb(var(--scb-dark-gray))]">David Lim</h3>
                      <span className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70">10:32 AM</span>
                    </div>
                    <p className="text-sm text-[rgb(var(--scb-dark-gray))] line-clamp-1">
                      Have you seen the latest Vietnam tariff data? I think we should...
                    </p>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-[rgba(var(--scb-dark-gray),0.05)] rounded-lg p-3 shadow-sm border border-[rgb(var(--scb-border))] flex items-center">
                  <div className="w-10 h-10 rounded-full bg-[rgb(var(--scb-american-green))] flex items-center justify-center mr-3 text-white">
                    <User size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <h3 className="font-medium text-[rgb(var(--scb-dark-gray))]">Samantha Wong</h3>
                      <span className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70">Yesterday</span>
                    </div>
                    <p className="text-sm text-[rgb(var(--scb-dark-gray))] line-clamp-1">
                      Thank you for sharing the report. I'll review it and get back to you.
                    </p>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-[rgba(var(--scb-dark-gray),0.05)] rounded-lg p-3 shadow-sm border border-[rgb(var(--scb-border))] flex items-center">
                  <div className="w-10 h-10 rounded-full bg-[rgb(var(--scb-purple))] flex items-center justify-center mr-3 text-white">
                    <User size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <h3 className="font-medium text-[rgb(var(--scb-dark-gray))]">John Nguyen</h3>
                      <span className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70">2 days ago</span>
                    </div>
                    <p className="text-sm text-[rgb(var(--scb-dark-gray))] line-clamp-1">
                      Can we schedule a meeting to discuss the Singapore expansion?
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Bottom navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[rgb(var(--scb-dark-background))] border-t border-[rgb(var(--scb-border))] px-2 pb-safe">
          <div className="flex items-center justify-around">
            <NavButton 
              icon={<Home size={20} />}
              label="Home"
              active={activeNavItem === 'home'}
              onClick={() => handleNavChange('home')}
            />
            <NavButton 
              icon={<LayoutGrid size={20} />}
              label="Dashboard"
              active={activeNavItem === 'dashboard'}
              onClick={() => handleNavChange('dashboard')}
            />
            <NavButton 
              icon={<BarChart2 size={20} />}
              label="Analytics"
              active={activeNavItem === 'analytics'}
              onClick={() => handleNavChange('analytics')}
            />
            <NavButton 
              icon={<Settings size={20} />}
              label="Settings"
              active={activeNavItem === 'settings'}
              onClick={() => handleNavChange('settings')}
            />
          </div>
        </nav>
      </div>
    </>
  );
}