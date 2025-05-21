import React, { useState, useCallback, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Search, 
  HelpCircle, 
  BookOpen, 
  Video, 
  MessageCircle, 
  Mail, 
  Phone, 
  ChevronRight,
  ChevronDown,
  ExternalLink,
  FileText,
  Play,
  Clock,
  PlusCircle,
  Lightbulb,
  Headphones,
  Check
} from 'lucide-react';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import { useSafeArea } from '@/hooks/useSafeArea';
import { useApplePhysics } from '@/hooks/useApplePhysics';
import EnhancedIOSNavBar from '@/components/EnhancedIOSNavBar';
import { EnhancedTouchButton, EnhancedPillTabs } from '@/components/EnhancedTouchButton';
import haptics from '@/lib/haptics';

// Sample data for help categories
const helpCategories = [
  { id: 'getting-started', name: 'Getting Started', icon: BookOpen },
  { id: 'data-analysis', name: 'Data Analysis', icon: FileText },
  { id: 'reporting', name: 'Reporting', icon: FileText },
  { id: 'api', name: 'API & Integration', icon: FileText },
  { id: 'account', name: 'Account Management', icon: FileText },
];

// Sample data for FAQs
const faqs = [
  {
    id: 'faq-1',
    category: 'getting-started',
    question: 'How do I set up my account preferences?',
    answer: 'You can set up your account preferences by navigating to the Settings page, where you can customize your dashboard, notification preferences, and display settings to suit your needs.'
  },
  {
    id: 'faq-2',
    category: 'getting-started',
    question: 'What are the system requirements for SCB Sapphire FinSight?',
    answer: 'SCB Sapphire FinSight is a web-based application that works on modern browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version of these browsers for optimal performance.'
  },
  {
    id: 'faq-3',
    category: 'data-analysis',
    question: 'How do I create a custom data visualization?',
    answer: 'To create a custom data visualization, go to the Data Explorer page, select your data source, and click on "Create Visualization". You can then choose from various chart types and customize them according to your requirements.'
  },
  {
    id: 'faq-4',
    category: 'data-analysis',
    question: 'Can I export data for offline analysis?',
    answer: 'Yes, you can export data in various formats including CSV, Excel, and JSON. Look for the Download or Export button on data tables and visualization tools to save data for offline analysis.'
  },
  {
    id: 'faq-5',
    category: 'reporting',
    question: 'How do I schedule automated reports?',
    answer: 'To schedule automated reports, navigate to the Reports page, select or create a report template, and click on "Schedule". You can set the frequency, recipients, and delivery format for your reports.'
  },
  {
    id: 'faq-6',
    category: 'api',
    question: 'Where can I find my API key?',
    answer: 'You can find your API key in the API Explorer or Settings page. If you need to generate a new key, you can do so from the API Key Management section.'
  },
  {
    id: 'faq-7',
    category: 'account',
    question: 'How do I add users to my organization account?',
    answer: 'To add users to your organization account, go to Settings > User Management. Click "Add User" and enter their email address. They will receive an invitation to join your organization with appropriate access permissions.'
  },
];

// Sample data for video tutorials
const videoTutorials = [
  {
    id: 'video-1',
    title: 'Getting Started with SCB Sapphire FinSight',
    thumbnail: '/images/tutorials/getting-started.jpg',
    duration: '5:24',
    category: 'getting-started'
  },
  {
    id: 'video-2',
    title: 'Advanced Data Analysis Techniques',
    thumbnail: '/images/tutorials/data-analysis.jpg',
    duration: '8:15',
    category: 'data-analysis'
  },
  {
    id: 'video-3',
    title: 'Creating Custom Reports',
    thumbnail: '/images/tutorials/reporting.jpg',
    duration: '6:42',
    category: 'reporting'
  },
  {
    id: 'video-4',
    title: 'API Integration Guide',
    thumbnail: '/images/tutorials/api.jpg',
    duration: '12:10',
    category: 'api'
  },
];

// Sample data for documentation
const documentationLinks = [
  { id: 'doc-1', title: 'User Guide', url: '#', category: 'getting-started' },
  { id: 'doc-2', title: 'Data Dictionary', url: '#', category: 'data-analysis' },
  { id: 'doc-3', title: 'API Reference', url: '#', category: 'api' },
  { id: 'doc-4', title: 'Report Templates', url: '#', category: 'reporting' },
  { id: 'doc-5', title: 'Security Guide', url: '#', category: 'account' },
  { id: 'doc-6', title: 'Administrator Manual', url: '#', category: 'account' },
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('getting-started');
  const [expandedFaqs, setExpandedFaqs] = useState<string[]>([]);
  const { isDarkMode, preferences } = useUIPreferences();
  
  // iOS optimization hooks
  const { deviceType, isAppleDevice, screenSize } = useDeviceCapabilities();
  const { safeArea, orientation, hasHomeIndicator, hasDynamicIsland } = useSafeArea();
  const physics = useApplePhysics({ motion: 'standard', respectReduceMotion: true });
  
  // Detect if running on Apple device
  const isiOS = deviceType === 'mobile' && isAppleDevice;
  const isiPad = deviceType === 'tablet' && isAppleDevice;
  const isApplePlatform = isiOS || isiPad;
  
  // Detect iPad multi-tasking mode (Slide Over, Split View, or Full Screen)
  const [iPadMode, setIPadMode] = useState<'full' | 'split' | 'slide' | 'none'>('full');
  
  // Track the iPad multi-tasking mode
  useEffect(() => {
    if (!isiPad) return;
    
    const detectMultitaskingMode = () => {
      const windowWidth = window.innerWidth;
      const screenWidth = window.screen.width;
      
      // iPad multi-tasking detection logic
      if (windowWidth === screenWidth || (orientation === 'landscape' && windowWidth > 768)) {
        // Full screen mode
        setIPadMode('full');
      } else if (windowWidth >= 320 && windowWidth <= 400) {
        // Slide Over mode (narrow floating window)
        setIPadMode('slide');
      } else {
        // Split View mode (portion of the screen)
        setIPadMode('split');
      }
    };
    
    // Initial detection
    detectMultitaskingMode();
    
    // Update on resize
    window.addEventListener('resize', detectMultitaskingMode);
    
    return () => {
      window.removeEventListener('resize', detectMultitaskingMode);
    };
  }, [isiPad, orientation]);
  
  // Helper function to get animation class if animations are enabled
  const getAnimationClass = (className: string) => {
    if (physics.shouldReduceMotion || !preferences.enableAnimations) return '';
    return className;
  };
  
  const toggleFaq = (faqId: string) => {
    if (expandedFaqs.includes(faqId)) {
      setExpandedFaqs(expandedFaqs.filter(id => id !== faqId));
    } else {
      setExpandedFaqs([...expandedFaqs, faqId]);
    }
  };
  
  // Filter FAQs based on search and category
  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Filter tutorials based on category
  const filteredTutorials = videoTutorials.filter(tutorial => 
    selectedCategory === 'all' || tutorial.category === selectedCategory
  );
  
  // Filter documentation based on category
  const filteredDocs = documentationLinks.filter(doc => 
    selectedCategory === 'all' || doc.category === selectedCategory
  );

  // Memoize toggle function with optimized haptic feedback for iOS
  const toggleFaqWithHaptics = useCallback((faqId: string) => {
    // Enhanced haptic feedback for iOS devices
    if (isApplePlatform) {
      haptics.selection();
    } 
    // Fallback to basic vibration for other devices
    else if (preferences.enableHaptics && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(5);
    }
    
    toggleFaq(faqId);
  }, [isApplePlatform, preferences.enableHaptics, toggleFaq]);
  
  // Adapt layout based on iPad multi-tasking mode
  const getLayoutForIPadMode = () => {
    if (!isiPad) return '';
    
    switch (iPadMode) {
      case 'slide':
        return 'ipad-slide-over-mode';
      case 'split':
        return 'ipad-split-view-mode';
      default:
        return 'ipad-full-screen-mode';
    }
  };

  // Compact layout for smaller screens or iPad Slide Over mode
  const useCompactLayout = isiPad && iPadMode === 'slide' || screenSize === 'mobile';

  // Configure iOS navigation right actions
  const navRightActions = [
    {
      icon: 'magnifyingglass',
      onPress: () => {
        if (isApplePlatform) {
          haptics.selection();
        }
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
      label: 'Search',
      variant: 'primary'
    }
  ];

  return isApplePlatform ? (
    <>
      <Head>
        <title>Help Center | SCB Sapphire FinSight</title>
      </Head>
      
      <EnhancedIOSNavBar
        title="Help Center"
        largeTitle={true}
        rightActions={navRightActions}
        respectSafeArea={true}
        transparent={false}
        blurred={true}
        theme={isDarkMode ? 'dark' : 'light'}
      />
      
      <div 
        className={`space-y-6 px-4 pt-2 ${getLayoutForIPadMode()}`}
        style={{ 
          paddingBottom: hasHomeIndicator ? '34px' : '16px',
          maxWidth: isiPad && iPadMode === 'full' ? '768px' : '100%',
          margin: isiPad && iPadMode === 'full' ? '0 auto' : '0'
        }}
      >
        {/* iOS optimized search */}
        <div className={`rounded-xl shadow-sm border p-5 ${isDarkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white/95 border-[rgba(var(--scb-border),0.8)]'}`}
          style={{ backdropFilter: 'blur(8px)' }}>
          <div className="mx-auto text-center">
            <h2 className={`text-2xl font-medium ${isDarkMode ? 'text-white' : 'text-[rgb(var(--scb-dark-gray))]'}`}
                style={{ fontFamily: "-apple-system, 'SF Pro Display', system-ui, BlinkMacSystemFont, sans-serif" }}>
              How can we help you today?
            </h2>
            <p className={`mt-2 mb-4 ${isDarkMode ? 'text-gray-300' : 'text-[rgb(var(--scb-dark-gray))]'}`}>
              Search our knowledge base or browse the help topics below
            </p>
            
            {/* iOS-style search field with rounded corners and blurred background */}
            <div className="relative max-w-xl mx-auto">
              <div className={`flex items-center overflow-hidden 
                rounded-full border shadow-sm
                ${isDarkMode 
                  ? 'bg-gray-700/80 border-gray-600' 
                  : 'bg-[rgba(var(--scb-light-gray),0.5)] border-[rgba(var(--scb-border),0.6)]'}`}
                style={{ backdropFilter: 'blur(4px)' }}>
                <div className="pl-4 flex items-center">
                  <Search className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-[rgb(var(--scb-dark-gray))]'}`} />
                </div>
                <input
                  type="text"
                  placeholder="Search for help articles, tutorials, FAQs..."
                  className={`w-full py-3 px-3 bg-transparent border-0 outline-none ${
                    isDarkMode 
                      ? 'text-white placeholder-gray-400' 
                      : 'text-[rgb(var(--scb-dark-gray))] placeholder-[rgba(var(--scb-dark-gray),0.6)]'
                  }`}
                  style={{ fontFamily: "-apple-system, system-ui, BlinkMacSystemFont, sans-serif" }}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    // iOS-specific haptic feedback
                    if (isApplePlatform) {
                      haptics.selection();
                    }
                  }}
                  onFocus={() => {
                    if (isApplePlatform) {
                      haptics.light();
                    }
                  }}
                />
                {searchQuery.length > 0 && (
                  <button 
                    className={`pr-4 ${isDarkMode ? 'text-gray-400' : 'text-[rgb(var(--scb-dark-gray))]'}`}
                    onClick={() => {
                      setSearchQuery('');
                      // Provide haptic feedback
                      if (isApplePlatform) {
                        haptics.light();
                      }
                    }}
                  >
                    <span className="sr-only">Clear search</span>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="10" cy="10" r="8" fill={isDarkMode ? "#3A3A3C" : "#E5E5E7"} />
                      <path d="M7.05 7.05L12.95 12.95M7.05 12.95L12.95 7.05" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* iOS-optimized Help Categories using EnhancedPillTabs */}
        <div className={`rounded-xl shadow-sm border p-5 ${isDarkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white/95 border-[rgba(var(--scb-border),0.8)]'}`}
          style={{ backdropFilter: 'blur(8px)' }}>
          <div className="overflow-x-auto no-scrollbar pb-1">
            <EnhancedPillTabs
              tabs={[
                { value: 'all', label: 'All Topics' },
                ...helpCategories.map(category => ({
                  value: category.id,
                  label: category.name,
                  icon: <category.icon className="h-4 w-4" />
                }))
              ]}
              value={selectedCategory}
              onChange={(value) => {
                setSelectedCategory(value);
                // iOS-specific haptic feedback
                if (isApplePlatform) {
                  haptics.selection();
                }
              }}
              className="flex-wrap"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - FAQs */}
          <div className="lg:col-span-2">
            <div className={`rounded-lg shadow-sm border overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[rgb(var(--scb-border))]'}`}>
              <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-[rgb(var(--scb-border))]'}`}>
                <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-[rgb(var(--scb-dark-gray))]'}`}>Frequently Asked Questions</h3>
              </div>
              
              <div className={`p-0 divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-[rgb(var(--scb-border))]'}`}>
                {filteredFaqs.length > 0 ? (
                  filteredFaqs.map(faq => (
                    <div key={faq.id} className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-[rgb(var(--scb-border))]'}`}>
                      <button
                        className={`w-full text-left px-6 py-4 flex items-center justify-between focus:outline-none ${
                          isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                        } ${preferences.enableAnimations ? 'transition-colors' : ''}`}
                        onClick={() => toggleFaqWithHaptics(faq.id)}
                      >
                        <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-[rgb(var(--scb-dark-gray))]'}`}>
                          {faq.question}
                        </span>
                        <ChevronDown className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-[rgb(var(--scb-dark-gray))]'} ${
                          preferences.enableAnimations ? 'transition-transform' : ''
                        } ${expandedFaqs.includes(faq.id) ? 'transform rotate-180' : ''}`} />
                      </button>
                      
                      {expandedFaqs.includes(faq.id) && (
                        <div className={`px-6 pb-4 ${preferences.enableAnimations ? getAnimationClass('animate-fadeIn') : ''}`}>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-[rgb(var(--scb-dark-gray))]'}`}>
                            {faq.answer}
                          </p>
                          
                          <div className="mt-3 flex justify-between items-center">
                            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-[rgb(var(--scb-dark-gray))] opacity-70'}`}>
                              Was this helpful?
                            </span>
                            <div className="flex items-center gap-2">
                              <button 
                                className={`p-1.5 rounded-md border ${isDarkMode 
                                  ? 'border-gray-600 hover:bg-gray-700' 
                                  : 'border-[rgb(var(--scb-border))] hover:bg-[rgba(var(--scb-light-gray),0.5)]'
                                } ${preferences.enableAnimations ? 'transition-colors' : ''}`}
                                onClick={() => {
                                  if (preferences.enableHaptics) {
                                    if (typeof navigator !== 'undefined' && navigator.vibrate) {
                                      navigator.vibrate(5);
                                    }
                                  }
                                }}
                              >
                                <Check className="h-3.5 w-3.5 text-[rgb(var(--scb-american-green))]" />
                              </button>
                              <button 
                                className={`p-1.5 rounded-md border ${isDarkMode 
                                  ? 'border-gray-600 hover:bg-gray-700' 
                                  : 'border-[rgb(var(--scb-border))] hover:bg-[rgba(var(--scb-light-gray),0.5)]'
                                } ${preferences.enableAnimations ? 'transition-colors' : ''}`}
                                onClick={() => {
                                  if (preferences.enableHaptics) {
                                    if (typeof navigator !== 'undefined' && navigator.vibrate) {
                                      navigator.vibrate(5);
                                    }
                                  }
                                }}
                              >
                                <PlusCircle className={`h-3.5 w-3.5 ${isDarkMode ? 'text-gray-400' : 'text-[rgb(var(--scb-dark-gray))]'}`} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <HelpCircle className={`h-12 w-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-[rgb(var(--scb-dark-gray))] opacity-20'}`} />
                    <h4 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-[rgb(var(--scb-dark-gray))]'}`}>
                      No FAQs found
                    </h4>
                    <p className={`text-sm mt-1 max-w-sm mx-auto ${isDarkMode ? 'text-gray-400' : 'text-[rgb(var(--scb-dark-gray))] opacity-70'}`}>
                      Try a different search term or category to find the information you're looking for.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="px-6 py-4 border-t border-[rgb(var(--scb-border))] flex justify-between items-center">
                <Link href="#" className="text-sm text-[rgb(var(--scb-honolulu-blue))] font-medium">
                  View all FAQs
                </Link>
                <button className="scb-btn scb-btn-secondary text-sm">
                  Ask a Question
                </button>
              </div>
            </div>
            
            {/* Video Tutorials */}
            <div className={`mt-6 rounded-lg shadow-sm border overflow-hidden ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[rgb(var(--scb-border))]'
            }`}>
              <div className={`px-6 py-4 border-b ${
                isDarkMode ? 'border-gray-700' : 'border-[rgb(var(--scb-border))]'
              }`}>
                <h3 className={`text-lg font-medium ${
                  isDarkMode ? 'text-white' : 'text-[rgb(var(--scb-dark-gray))]'
                }`}>Video Tutorials</h3>
              </div>
              
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredTutorials.map(tutorial => (
                  <div 
                    key={tutorial.id} 
                    className={`rounded-lg overflow-hidden group ${
                      preferences.enableAnimations ? 'transition-shadow hover:shadow-md' : ''
                    } ${
                      isDarkMode 
                        ? 'border border-gray-700 hover:border-gray-600' 
                        : 'border border-[rgb(var(--scb-border))]'
                    }`}
                  >
                    <div className={`relative h-32 ${
                      isDarkMode ? 'bg-gray-700' : 'bg-[rgba(var(--scb-light-gray),0.3)]'
                    }`}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`absolute inset-0 bg-black ${
                          isDarkMode ? 'opacity-70' : 'opacity-50'
                        } group-hover:opacity-60 ${
                          preferences.enableAnimations ? 'transition-opacity' : ''
                        }`}></div>
                        <Play className={`h-10 w-10 text-white opacity-80 group-hover:opacity-100 z-10 ${
                          preferences.enableAnimations ? 'transition-opacity' : ''
                        }`} />
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-0.5 rounded z-10 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {tutorial.duration}
                      </div>
                    </div>
                    
                    <div className="p-3">
                      <h4 className={`text-sm font-medium ${
                        isDarkMode ? 'text-white' : 'text-[rgb(var(--scb-dark-gray))]'
                      }`}>{tutorial.title}</h4>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className={`px-6 py-4 border-t ${
                isDarkMode ? 'border-gray-700' : 'border-[rgb(var(--scb-border))]'
              }`}>
                <Link 
                  href="#" 
                  className={`text-sm text-[rgb(var(--scb-honolulu-blue))] font-medium flex items-center ${
                    isDarkMode ? 'hover:text-blue-400' : ''
                  }`}
                >
                  <span>View all tutorials</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>
          
          {/* Right Column - Contact and Resources */}
          <div className="lg:col-span-1 space-y-6">
            {/* Documentation */}
            <div className={`rounded-lg shadow-sm border overflow-hidden ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[rgb(var(--scb-border))]'
            }`}>
              <div className={`px-5 py-3 border-b ${
                isDarkMode ? 'border-gray-700' : 'border-[rgb(var(--scb-border))]'
              }`}>
                <h3 className={`text-base font-medium ${
                  isDarkMode ? 'text-white' : 'text-[rgb(var(--scb-dark-gray))]'
                }`}>Documentation</h3>
              </div>
              
              <div className="p-4">
                <ul className={`divide-y ${
                  isDarkMode ? 'divide-gray-700' : 'divide-[rgb(var(--scb-border))]'
                }`}>
                  {filteredDocs.map(doc => (
                    <li key={doc.id} className="py-2">
                      <Link 
                        href={doc.url} 
                        className={`flex items-center ${
                          isDarkMode 
                            ? 'text-gray-300 hover:text-blue-400' 
                            : 'text-[rgb(var(--scb-dark-gray))] hover:text-[rgb(var(--scb-honolulu-blue))]'
                        } ${preferences.enableAnimations ? 'transition-colors' : ''}`}
                      >
                        <FileText className="h-4 w-4 mr-3" />
                        <span className="text-sm">{doc.title}</span>
                        <ExternalLink className="h-3.5 w-3.5 ml-auto" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Contact Support */}
            <div className={`rounded-lg shadow-sm border overflow-hidden ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[rgb(var(--scb-border))]'
            }`}>
              <div className={`px-5 py-3 border-b ${
                isDarkMode ? 'border-gray-700' : 'border-[rgb(var(--scb-border))]'
              }`}>
                <h3 className={`text-base font-medium ${
                  isDarkMode ? 'text-white' : 'text-[rgb(var(--scb-dark-gray))]'
                }`}>Contact Support</h3>
              </div>
              
              <div className="p-4">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className={`p-2 rounded-full mr-3 ${
                      isDarkMode ? 'bg-gray-700' : 'bg-[rgba(var(--scb-light-gray),0.3)]'
                    }`}>
                      <MessageCircle className="h-5 w-5 text-[rgb(var(--scb-honolulu-blue))]" />
                    </div>
                    <div>
                      <h4 className={`text-sm font-medium ${
                        isDarkMode ? 'text-white' : 'text-[rgb(var(--scb-dark-gray))]'
                      }`}>Live Chat</h4>
                      <p className={`text-xs mt-1 ${
                        isDarkMode ? 'text-gray-300' : 'text-[rgb(var(--scb-dark-gray))]'
                      }`}>
                        Chat with our support team, available 24/7
                      </p>
                      <button className={`mt-2 text-xs py-1.5 px-3 rounded-md ${
                        isDarkMode 
                          ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                          : 'bg-[rgb(var(--scb-honolulu-blue))] text-white'
                      } ${preferences.enableAnimations ? 'transition-colors' : ''}`}>
                        Start Chat
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className={`p-2 rounded-full mr-3 ${
                      isDarkMode ? 'bg-gray-700' : 'bg-[rgba(var(--scb-light-gray),0.3)]'
                    }`}>
                      <Mail className="h-5 w-5 text-[rgb(var(--scb-honolulu-blue))]" />
                    </div>
                    <div>
                      <h4 className={`text-sm font-medium ${
                        isDarkMode ? 'text-white' : 'text-[rgb(var(--scb-dark-gray))]'
                      }`}>Email Support</h4>
                      <p className={`text-xs mt-1 ${
                        isDarkMode ? 'text-gray-300' : 'text-[rgb(var(--scb-dark-gray))]'
                      }`}>
                        Email us at <a href="mailto:sapphire-support@scb.com" className={`${
                          isDarkMode ? 'text-blue-400' : 'text-[rgb(var(--scb-honolulu-blue))]'
                        }`}>sapphire-support@scb.com</a>
                      </p>
                      <p className={`text-xs mt-1 ${
                        isDarkMode ? 'text-gray-400' : 'text-[rgb(var(--scb-dark-gray))] opacity-70'
                      }`}>
                        Response time: Within 24 hours
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className={`p-2 rounded-full mr-3 ${
                      isDarkMode ? 'bg-gray-700' : 'bg-[rgba(var(--scb-light-gray),0.3)]'
                    }`}>
                      <Phone className="h-5 w-5 text-[rgb(var(--scb-honolulu-blue))]" />
                    </div>
                    <div>
                      <h4 className={`text-sm font-medium ${
                        isDarkMode ? 'text-white' : 'text-[rgb(var(--scb-dark-gray))]'
                      }`}>Phone Support</h4>
                      <p className={`text-xs mt-1 ${
                        isDarkMode ? 'text-gray-300' : 'text-[rgb(var(--scb-dark-gray))]'
                      }`}>
                        Call us at <a href="tel:+18001234567" className={`${
                          isDarkMode ? 'text-blue-400' : 'text-[rgb(var(--scb-honolulu-blue))]'
                        }`}>+1 (800) 123-4567</a>
                      </p>
                      <p className={`text-xs mt-1 ${
                        isDarkMode ? 'text-gray-400' : 'text-[rgb(var(--scb-dark-gray))] opacity-70'
                      }`}>
                        Hours: Mon-Fri, 9am-6pm (GMT+8)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Tips */}
            <div className={`rounded-lg border p-5 ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600' 
                : 'bg-[rgba(var(--scb-light-gray),0.3)] border-[rgb(var(--scb-border))]'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <Lightbulb className="h-5 w-5 text-[rgb(var(--scb-american-green))]" />
                <h3 className={`text-base font-medium ${
                  isDarkMode ? 'text-white' : 'text-[rgb(var(--scb-dark-gray))]'
                }`}>Quick Tips</h3>
              </div>
              
              <ul className={`space-y-2 text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-[rgb(var(--scb-dark-gray))]'
              }`}>
                <li className="flex items-start gap-2">
                  <span className="text-[rgb(var(--scb-american-green))] font-bold mt-0.5">•</span>
                  <span>Use keyboard shortcuts (press ? to view) for faster navigation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[rgb(var(--scb-american-green))] font-bold mt-0.5">•</span>
                  <span>Save your frequently used reports and dashboards to favorites</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[rgb(var(--scb-american-green))] font-bold mt-0.5">•</span>
                  <span>Set up email alerts for important market movements</span>
                </li>
              </ul>
              
              <Link 
                href="#" 
                className={`mt-3 text-sm font-medium flex items-center ${
                  isDarkMode 
                    ? 'text-blue-400 hover:text-blue-300' 
                    : 'text-[rgb(var(--scb-honolulu-blue))]'
                } ${preferences.enableAnimations ? 'transition-colors' : ''}`}
              >
                <span>View all tips</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            {/* Webinar Promo */}
            <div className={`${
              isDarkMode 
                ? 'bg-gradient-to-r from-blue-800 to-blue-700' 
                : 'bg-[rgb(var(--scb-honolulu-blue))]'
            } text-white rounded-lg overflow-hidden relative`}>
              <div className="relative z-10 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Headphones className="h-5 w-5" />
                  <span className="text-sm font-medium">Upcoming Webinar</span>
                </div>
                
                <h3 className="font-medium mb-2">Advanced Analytics for Financial Insights</h3>
                <p className="text-sm text-white/80 mb-4">Learn how to leverage advanced analytics tools for better financial decision making.</p>
                
                <div className="flex items-center gap-2 text-xs mb-4">
                  <div className="bg-white/20 px-2 py-1 rounded">June 15, 2025</div>
                  <div className="bg-white/20 px-2 py-1 rounded">2:00 PM GMT</div>
                </div>
                
                <button className={`font-medium px-4 py-2 rounded-md text-sm ${
                  isDarkMode 
                    ? 'bg-blue-400 text-gray-900 hover:bg-blue-300' 
                    : 'bg-white text-[rgb(var(--scb-honolulu-blue))]'
                } ${preferences.enableAnimations ? 'transition-colors' : ''}`}>
                  Register Now
                </button>
              </div>
              {isDarkMode && (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 to-blue-600/20"></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  ) : (
    <ScbBeautifulUI 
      pageTitle="Help Center" 
      showNewsBar={preferences.enableNewsBar && false}
      showTabs={preferences.mobileNavStyle === 'tab'}
    >
      <Head>
        <title>Help Center | SCB Sapphire FinSight</title>
      </Head>

      <div className="space-y-6">
        {/* Help Center Header with Search */}
        <div className={`rounded-lg shadow-sm border p-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[rgb(var(--scb-border))]'}`}>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className={`text-2xl font-medium ${isDarkMode ? 'text-white' : 'text-[rgb(var(--scb-dark-gray))]'}`}>
              How can we help you today?
            </h2>
            <p className={`mt-2 mb-6 ${isDarkMode ? 'text-gray-300' : 'text-[rgb(var(--scb-dark-gray))]'}`}>
              Search our knowledge base or browse the help topics below
            </p>
            
            <div className="relative max-w-xl mx-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-[rgb(var(--scb-dark-gray))]'}`} />
              </div>
              <input
                type="text"
                placeholder="Search for help articles, tutorials, FAQs..."
                className={`pl-10 w-full py-3 rounded-lg ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-[rgb(var(--scb-border))] text-[rgb(var(--scb-dark-gray))]'
                }`}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  // Add haptic feedback if enabled
                  if (preferences.enableHaptics && typeof navigator !== 'undefined' && navigator.vibrate) {
                    navigator.vibrate(2);
                  }
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Rest of the content */}
        {/* Help Categories */}
        {/* Left Column - FAQs */}
        {/* Right Column - Contact and Resources */}
      </div>
    </ScbBeautifulUI>
  );
}