import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import Image from 'next/image';
import JouleAssistantWrapper from './JouleAssistantWrapper';

interface GlobalJouleAssistantProps {
  initialOpen?: boolean;
}

/**
 * GlobalJouleAssistant Component
 * A globally accessible Joule AI Assistant that can be used
 * consistently across all pages in the application
 */
const GlobalJouleAssistant: React.FC<GlobalJouleAssistantProps> = ({
  initialOpen = false
}) => {
  const [jouleOpen, setJouleOpen] = useState(initialOpen);
  const [newsItem, setNewsItem] = useState<{
    title: string;
    summary: string;
    category: string;
    source: string;
  } | undefined>(undefined);

  // Method to be exposed to other components to open Joule with specific news
  const analyzeNews = (item: {
    title: string;
    summary: string;
    category: string;
    source: string;
  }) => {
    setNewsItem(item);
    setJouleOpen(true);
  };

  // Method to open Joule without specific content
  const openJoule = () => {
    setJouleOpen(true);
  };

  return (
    <>
      {/* Floating Joule Button - Always visible on bottom right */}
      <button
        onClick={openJoule}
        className="fixed right-6 bottom-6 z-40 flex items-center justify-center w-12 h-12 rounded-full shadow-lg"
        style={{ backgroundColor: '#cc00dc' }}
        aria-label="Open Joule AI Assistant"
      >
        <Sparkles className="w-6 h-6 text-white" />
      </button>

      {/* Joule AI Assistant Panel */}
      {jouleOpen && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out transform translate-x-0">
          {/* Joule Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: '#cc00dc' }}>
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-md flex items-center justify-center bg-[#cc00dc]" 
              >
                <span className="text-white font-bold text-lg">J</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Joule</h2>
                <p className="text-sm text-white/80 flex items-center gap-2">
                  Powered by 
                  <Image
                    src="/assets/idEDqS_YGr_1747680256633.svg"
                    alt="SAP"
                    width={32}
                    height={16}
                    className="inline-block brightness-0 invert"
                  />
                </p>
              </div>
            </div>
            <button
              onClick={() => setJouleOpen(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Joule Content */}
          <div className="flex-1 overflow-hidden">
            <JouleAssistantWrapper 
              open={jouleOpen} 
              onOpenChange={setJouleOpen} 
              initialNewsItem={newsItem}
            />
          </div>
        </div>
      )}
    </>
  );
};

// Create a singleton instance to ensure we have
// only one JouleAssistant at a time
let globalJouleAssistantInstance: {
  analyzeNews: (item: any) => void;
  openJoule: () => void;
} | null = null;

export const useGlobalJouleAssistant = () => {
  if (!globalJouleAssistantInstance) {
    globalJouleAssistantInstance = {
      analyzeNews: () => console.warn('GlobalJouleAssistant not mounted yet'),
      openJoule: () => console.warn('GlobalJouleAssistant not mounted yet')
    };
  }
  
  return globalJouleAssistantInstance;
};

export default GlobalJouleAssistant;