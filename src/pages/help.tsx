import React, { useState } from 'react';
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

  return (
    <ScbBeautifulUI pageTitle="Help Center" showNewsBar={false}>
      <Head>
        <title>Help Center | SCB Sapphire FinSight</title>
      </Head>

      <div className="space-y-6">
        {/* Help Center Header with Search */}
        <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] p-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-medium text-[rgb(var(--scb-dark-gray))]">
              How can we help you today?
            </h2>
            <p className="text-[rgb(var(--scb-dark-gray))] mt-2 mb-6">
              Search our knowledge base or browse the help topics below
            </p>
            
            <div className="relative max-w-xl mx-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-[rgb(var(--scb-dark-gray))]" />
              </div>
              <input
                type="text"
                placeholder="Search for help articles, tutorials, FAQs..."
                className="scb-input pl-10 w-full py-3"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* Help Categories */}
        <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] p-5">
          <div className="flex overflow-x-auto no-scrollbar pb-2 gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-[rgb(var(--scb-honolulu-blue))] text-white'
                  : 'bg-[rgba(var(--scb-light-gray),0.5)] text-[rgb(var(--scb-dark-gray))]'
              }`}
            >
              All Topics
            </button>
            
            {helpCategories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors flex items-center ${
                  selectedCategory === category.id
                    ? 'bg-[rgb(var(--scb-honolulu-blue))] text-white'
                    : 'bg-[rgba(var(--scb-light-gray),0.5)] text-[rgb(var(--scb-dark-gray))]'
                }`}
              >
                <category.icon className="h-4 w-4 mr-2" />
                {category.name}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - FAQs */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] overflow-hidden">
              <div className="px-6 py-4 border-b border-[rgb(var(--scb-border))]">
                <h3 className="text-lg font-medium text-[rgb(var(--scb-dark-gray))]">Frequently Asked Questions</h3>
              </div>
              
              <div className="p-0 divide-y divide-[rgb(var(--scb-border))]">
                {filteredFaqs.length > 0 ? (
                  filteredFaqs.map(faq => (
                    <div key={faq.id} className="border-b border-[rgb(var(--scb-border))]">
                      <button
                        className="w-full text-left px-6 py-4 flex items-center justify-between"
                        onClick={() => toggleFaq(faq.id)}
                      >
                        <span className="font-medium text-[rgb(var(--scb-dark-gray))]">{faq.question}</span>
                        <ChevronDown className={`h-5 w-5 text-[rgb(var(--scb-dark-gray))] transition-transform ${
                          expandedFaqs.includes(faq.id) ? 'transform rotate-180' : ''
                        }`} />
                      </button>
                      
                      {expandedFaqs.includes(faq.id) && (
                        <div className="px-6 pb-4">
                          <p className="text-sm text-[rgb(var(--scb-dark-gray))]">{faq.answer}</p>
                          
                          <div className="mt-3 flex justify-between items-center">
                            <span className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70">
                              Was this helpful?
                            </span>
                            <div className="flex items-center gap-2">
                              <button className="p-1.5 rounded-md border border-[rgb(var(--scb-border))] hover:bg-[rgba(var(--scb-light-gray),0.5)]">
                                <Check className="h-3.5 w-3.5 text-[rgb(var(--scb-american-green))]" />
                              </button>
                              <button className="p-1.5 rounded-md border border-[rgb(var(--scb-border))] hover:bg-[rgba(var(--scb-light-gray),0.5)]">
                                <PlusCircle className="h-3.5 w-3.5 text-[rgb(var(--scb-dark-gray))]" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <HelpCircle className="h-12 w-12 mx-auto text-[rgb(var(--scb-dark-gray))] opacity-20 mb-3" />
                    <h4 className="text-lg font-medium text-[rgb(var(--scb-dark-gray))]">No FAQs found</h4>
                    <p className="text-sm text-[rgb(var(--scb-dark-gray))] opacity-70 mt-1 max-w-sm mx-auto">
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
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] overflow-hidden">
              <div className="px-6 py-4 border-b border-[rgb(var(--scb-border))]">
                <h3 className="text-lg font-medium text-[rgb(var(--scb-dark-gray))]">Video Tutorials</h3>
              </div>
              
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredTutorials.map(tutorial => (
                  <div key={tutorial.id} className="border border-[rgb(var(--scb-border))] rounded-lg overflow-hidden group transition-shadow hover:shadow-md">
                    <div className="relative h-32 bg-[rgba(var(--scb-light-gray),0.3)]">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="absolute inset-0 bg-black opacity-50 group-hover:opacity-60 transition-opacity"></div>
                        <Play className="h-10 w-10 text-white opacity-80 group-hover:opacity-100 transition-opacity z-10" />
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-0.5 rounded z-10 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {tutorial.duration}
                      </div>
                    </div>
                    
                    <div className="p-3">
                      <h4 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">{tutorial.title}</h4>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="px-6 py-4 border-t border-[rgb(var(--scb-border))]">
                <Link href="#" className="text-sm text-[rgb(var(--scb-honolulu-blue))] font-medium flex items-center">
                  <span>View all tutorials</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>
          
          {/* Right Column - Contact and Resources */}
          <div className="lg:col-span-1 space-y-6">
            {/* Documentation */}
            <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] overflow-hidden">
              <div className="px-5 py-3 border-b border-[rgb(var(--scb-border))]">
                <h3 className="text-base font-medium text-[rgb(var(--scb-dark-gray))]">Documentation</h3>
              </div>
              
              <div className="p-4">
                <ul className="divide-y divide-[rgb(var(--scb-border))]">
                  {filteredDocs.map(doc => (
                    <li key={doc.id} className="py-2">
                      <Link href={doc.url} className="flex items-center text-[rgb(var(--scb-dark-gray))] hover:text-[rgb(var(--scb-honolulu-blue))]">
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
            <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] overflow-hidden">
              <div className="px-5 py-3 border-b border-[rgb(var(--scb-border))]">
                <h3 className="text-base font-medium text-[rgb(var(--scb-dark-gray))]">Contact Support</h3>
              </div>
              
              <div className="p-4">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="bg-[rgba(var(--scb-light-gray),0.3)] p-2 rounded-full mr-3">
                      <MessageCircle className="h-5 w-5 text-[rgb(var(--scb-honolulu-blue))]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">Live Chat</h4>
                      <p className="text-xs text-[rgb(var(--scb-dark-gray))] mt-1">
                        Chat with our support team, available 24/7
                      </p>
                      <button className="mt-2 scb-btn scb-btn-primary text-xs py-1.5 px-3">
                        Start Chat
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-[rgba(var(--scb-light-gray),0.3)] p-2 rounded-full mr-3">
                      <Mail className="h-5 w-5 text-[rgb(var(--scb-honolulu-blue))]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">Email Support</h4>
                      <p className="text-xs text-[rgb(var(--scb-dark-gray))] mt-1">
                        Email us at <a href="mailto:sapphire-support@scb.com" className="text-[rgb(var(--scb-honolulu-blue))]">sapphire-support@scb.com</a>
                      </p>
                      <p className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70 mt-1">
                        Response time: Within 24 hours
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-[rgba(var(--scb-light-gray),0.3)] p-2 rounded-full mr-3">
                      <Phone className="h-5 w-5 text-[rgb(var(--scb-honolulu-blue))]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">Phone Support</h4>
                      <p className="text-xs text-[rgb(var(--scb-dark-gray))] mt-1">
                        Call us at <a href="tel:+18001234567" className="text-[rgb(var(--scb-honolulu-blue))]">+1 (800) 123-4567</a>
                      </p>
                      <p className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70 mt-1">
                        Hours: Mon-Fri, 9am-6pm (GMT+8)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Tips */}
            <div className="bg-[rgba(var(--scb-light-gray),0.3)] rounded-lg border border-[rgb(var(--scb-border))] p-5">
              <div className="flex items-center gap-3 mb-3">
                <Lightbulb className="h-5 w-5 text-[rgb(var(--scb-american-green))]" />
                <h3 className="text-base font-medium text-[rgb(var(--scb-dark-gray))]">Quick Tips</h3>
              </div>
              
              <ul className="space-y-2 text-sm text-[rgb(var(--scb-dark-gray))]">
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
              
              <Link href="#" className="mt-3 text-sm text-[rgb(var(--scb-honolulu-blue))] font-medium flex items-center">
                <span>View all tips</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            {/* Webinar Promo */}
            <div className="bg-[rgb(var(--scb-honolulu-blue))] text-white rounded-lg overflow-hidden relative">
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
                
                <button className="bg-white text-[rgb(var(--scb-honolulu-blue))] font-medium px-4 py-2 rounded-md text-sm">
                  Register Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScbBeautifulUI>
  );
}