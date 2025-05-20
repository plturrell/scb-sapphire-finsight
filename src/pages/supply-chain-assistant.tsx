import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { OntologyManager } from '../services/OntologyManager';
import PerplexityStyleConversationalUI from '../components/PerplexityStyleConversationalUI';
import { UnifiedLayoutContainer } from '../components/UnifiedLayoutContainer';
import GlobalNavigation from '../components/GlobalNavigation';

/**
 * Supply Chain Assistant Page
 * 
 * Integrates Perplexity-quality conversational UI with our SCB Sapphire platform
 * while maintaining perfect cross-platform consistency requirements.
 */
export default function SupplyChainAssistantPage() {
  const [ontologyManager, setOntologyManager] = useState<OntologyManager | null>(null);
  const [initialPrompt, setInitialPrompt] = useState<string | undefined>(undefined);
  
  // Initialize ontology manager
  useEffect(() => {
    // This ensures we're running on client-side
    if (typeof window !== 'undefined') {
      const manager = new OntologyManager();
      setOntologyManager(manager);
      
      // Check for query params to pre-populate with initial question
      const urlParams = new URLSearchParams(window.location.search);
      const query = urlParams.get('query');
      if (query) {
        setInitialPrompt(query);
      }
    }
  }, []);
  
  // Fixed dimensions for perfect cross-platform consistency
  const fixedStyle = {
    width: '1200px',
    height: '800px',
    backgroundColor: '#ffffff',
    position: 'relative' as const,
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
  };
  
  return (
    <div className="app-container">
      <Head>
        <title>SCB Sapphire | Supply Chain Assistant</title>
        <meta name="description" content="Advanced supply chain analysis with AI assistance" />
      </Head>
      
      <UnifiedLayoutContainer>
        <div style={fixedStyle}>
          <GlobalNavigation />
          
          <div style={{ 
            padding: '80px 20px 20px',
            height: 'calc(100% - 80px)',
            boxSizing: 'border-box' as const
          }}>
            {ontologyManager ? (
              <PerplexityStyleConversationalUI 
                ontologyManager={ontologyManager} 
                initialPrompt={initialPrompt}
                domainContext="supply-chain"
              />
            ) : (
              <div className="loading-container" style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%'
              }}>
                <div className="loading-spinner" style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid rgba(63, 81, 181, 0.2)',
                  borderTop: '4px solid #3f51b5',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <style jsx>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            )}
          </div>
        </div>
      </UnifiedLayoutContainer>
    </div>
  );
}
