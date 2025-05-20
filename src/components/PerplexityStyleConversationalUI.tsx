import React, { useState, useEffect, useRef } from 'react';
import { PerplexityEnhancedNLP } from '../services/PerplexityEnhancedNLP';
import { OntologyManager } from '../services/OntologyManager';
import { UnifiedLayoutContainer } from './UnifiedLayoutContainer';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  isLoading?: boolean;
  insights?: Array<{key: string; value: string; confidence: number;}>;
  sources?: Array<{title: string; url?: string; reliability: number; relevance: number;}>;
  visualizations?: Array<{
    type: 'chart' | 'table' | 'sankey' | 'heatmap';
    title: string;
    description: string;
    dataPoints: Record<string, any>;
  }>;
}

interface ConversationalUIProps {
  initialPrompt?: string;
  domainContext?: 'finance' | 'supply-chain' | 'tariffs' | 'compliance' | 'general';
  ontologyManager: OntologyManager;
  className?: string;
}

/**
 * PerplexityStyleConversationalUI
 * 
 * A Perplexity-inspired conversational interface that maintains our
 * cross-platform consistency requirements while bringing the accessibility
 * and conversational fluidity of Perplexity.ai
 */
export const PerplexityStyleConversationalUI: React.FC<ConversationalUIProps> = ({
  initialPrompt,
  domainContext = 'finance',
  ontologyManager,
  className
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nlpService = PerplexityEnhancedNLP.getInstance(ontologyManager);
  
  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: `system-${Date.now()}`,
      content: 'Welcome to SCB Sapphire FinSight. How can I assist with your supply chain and financial analysis today?',
      sender: 'assistant',
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
    
    // If initial prompt is provided, process it
    if (initialPrompt) {
      handleInitialPrompt(initialPrompt);
    }
  }, [initialPrompt]);
  
  // Handle initial prompt
  const handleInitialPrompt = async (prompt: string) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: prompt,
      sender: 'user',
      timestamp: new Date()
    };
    
    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      content: '',
      sender: 'assistant',
      timestamp: new Date(),
      isLoading: true
    };
    
    setMessages(prev => [...prev, userMessage, assistantMessage]);
    
    // Process with NLP service
    try {
      setIsProcessing(true);
      const result = await nlpService.processQuery({
        query: prompt,
        domainContext,
        responseFormat: 'conversational'
      });
      
      // Update assistant message with response
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { 
              ...msg, 
              content: result.response, 
              isLoading: false,
              insights: result.insights,
              sources: result.sources,
              visualizations: result.visualizationSuggestions
            } 
          : msg
      ));
    } catch (error) {
      console.error('Error processing query:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { 
              ...msg, 
              content: 'I apologize, but I encountered an error processing your request. Please try again.',
              isLoading: false
            } 
          : msg
      ));
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle message submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isProcessing) return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };
    
    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      content: '',
      sender: 'assistant',
      timestamp: new Date(),
      isLoading: true
    };
    
    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInputValue('');
    
    // Process with NLP service
    try {
      setIsProcessing(true);
      const result = await nlpService.processQuery({
        query: userMessage.content,
        domainContext,
        responseFormat: 'conversational'
      });
      
      // Update assistant message with response
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { 
              ...msg, 
              content: result.response, 
              isLoading: false,
              insights: result.insights,
              sources: result.sources,
              visualizations: result.visualizationSuggestions
            } 
          : msg
      ));
    } catch (error) {
      console.error('Error processing query:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { 
              ...msg, 
              content: 'I apologize, but I encountered an error processing your request. Please try again.',
              isLoading: false
            } 
          : msg
      ));
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
    <UnifiedLayoutContainer>
      <div className={`conversation-container ${className || ''}`} style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}>
        <div className="messages-container" style={{
          flex: 1,
          overflowY: 'auto',
          marginBottom: '20px',
          padding: '10px'
        }}>
          {messages.map(message => (
            <div 
              key={message.id} 
              className={`message ${message.sender === 'user' ? 'user-message' : 'assistant-message'}`}
              style={{
                marginBottom: '16px',
                padding: '12px 16px',
                borderRadius: '12px',
                maxWidth: '85%',
                alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: message.sender === 'user' ? '#1a237e' : '#f5f5f5',
                color: message.sender === 'user' ? 'white' : 'black',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                alignItems: 'flex-start',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {message.isLoading ? (
                <div className="loading-indicator" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#3f51b5',
                    margin: '0 4px',
                    animation: 'pulse 1.5s infinite ease-in-out'
                  }}></div>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#3f51b5',
                    margin: '0 4px',
                    animation: 'pulse 1.5s infinite ease-in-out',
                    animationDelay: '0.3s'
                  }}></div>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#3f51b5',
                    margin: '0 4px',
                    animation: 'pulse 1.5s infinite ease-in-out',
                    animationDelay: '0.6s'
                  }}></div>
                </div>
              ) : (
                <>
                  <div className="message-content" style={{
                    marginBottom: message.insights?.length ? '12px' : '0'
                  }}>
                    {message.content}
                  </div>
                  
                  {message.insights && message.insights.length > 0 && (
                    <div className="insights-container" style={{
                      marginTop: '12px',
                      width: '100%'
                    }}>
                      <h4 style={{
                        fontSize: '14px',
                        margin: '0 0 8px 0',
                        fontWeight: 500,
                        color: '#3f51b5'
                      }}>Key Insights</h4>
                      <ul style={{
                        margin: 0,
                        padding: 0,
                        listStyle: 'none'
                      }}>
                        {message.insights.map((insight, index) => (
                          <li key={index} style={{
                            padding: '4px 0',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'flex-start'
                          }}>
                            <span style={{
                              color: '#3f51b5',
                              fontWeight: 500,
                              marginRight: '6px'
                            }}>{insight.key}:</span>
                            <span>{insight.value}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {message.sources && message.sources.length > 0 && (
                    <div className="sources-container" style={{
                      marginTop: '12px',
                      fontSize: '12px',
                      color: '#666',
                      width: '100%'
                    }}>
                      <h4 style={{
                        fontSize: '14px',
                        margin: '0 0 8px 0',
                        fontWeight: 500,
                        color: '#666'
                      }}>Sources</h4>
                      <ul style={{
                        margin: 0,
                        padding: 0,
                        listStyle: 'none'
                      }}>
                        {message.sources.map((source, index) => (
                          <li key={index} style={{ 
                            padding: '4px 0'
                          }}>
                            {source.url ? (
                              <a href={source.url} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 style={{
                                   color: '#3f51b5',
                                   textDecoration: 'none'
                                 }}>
                                {source.title}
                              </a>
                            ) : (
                              <span>{source.title}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {message.visualizations && message.visualizations.length > 0 && (
                    <div className="visualizations-container" style={{
                      marginTop: '16px',
                      width: '100%'
                    }}>
                      <h4 style={{
                        fontSize: '14px',
                        margin: '0 0 8px 0',
                        fontWeight: 500,
                        color: '#3f51b5'
                      }}>Suggested Visualizations</h4>
                      {message.visualizations.map((viz, index) => (
                        <div key={index} className="visualization-suggestion" style={{
                          padding: '8px 12px',
                          backgroundColor: '#e8eaf6',
                          borderRadius: '6px',
                          marginBottom: '8px',
                          cursor: 'pointer'
                        }}>
                          <div style={{
                            fontWeight: 500,
                            marginBottom: '4px'
                          }}>{viz.title}</div>
                          <div style={{
                            fontSize: '13px',
                            color: '#555'
                          }}>{viz.description}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          position: 'relative',
          marginTop: 'auto'
        }}>
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Ask about supply chain resilience, tariff impacts, or financial analysis..."
            disabled={isProcessing}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '24px',
              border: '1px solid #ddd',
              fontSize: '16px',
              outline: 'none',
              boxSizing: 'border-box',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif'
            }}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isProcessing}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: '#3f51b5',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isProcessing || !inputValue.trim() ? 'not-allowed' : 'pointer',
              opacity: isProcessing || !inputValue.trim() ? 0.7 : 1
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor" />
            </svg>
          </button>
        </form>
      </div>
    </UnifiedLayoutContainer>
  );
};

export default PerplexityStyleConversationalUI;
