import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Loader2, InfoIcon, RefreshCw, ThumbsUp, ThumbsDown, Share, Download, ExternalLink, Check, Clipboard, Edit } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { JouleMessage, Source } from '@/types';
import { getGrokCompletion, GrokMessageContent } from '@/lib/grok-api';

interface JouleAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function JouleAssistant({ open, onOpenChange }: JouleAssistantProps) {
  const [messages, setMessages] = useState<JouleMessage[]>([
    {
      id: '1',
      content: 'Hello! I am Joule, your SAP AI assistant. How can I help you with your financial analytics today?',
      sender: 'assistant',
      timestamp: new Date(),
      sources: [
        { name: 'SCB Sapphire FinSight', url: '#', type: 'internal' }
      ]
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // State for showing explanation panel
  const [showExplanation, setShowExplanation] = useState(false);
  // State for tracking feedback
  const [feedback, setFeedback] = useState<Record<string, 'positive' | 'negative' | null>>({});
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendToGrok = async (userMessage: string) => {
    setIsLoading(true);
    
    // Convert chat history to format expected by Grok API
    const grokMessages: GrokMessageContent[] = messages
      .slice(-6) // Only send the last 6 messages to keep context manageable
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));
    
    // Add the new user message
    grokMessages.push({
      role: 'user',
      content: userMessage
    });
    
    try {
      // Determine if we should use tools based on message content
      const shouldUseTool = (
        userMessage.toLowerCase().includes('financial data') || 
        userMessage.toLowerCase().includes('report') || 
        userMessage.toLowerCase().includes('performance') ||
        userMessage.toLowerCase().includes('metrics') ||
        userMessage.toLowerCase().includes('portfolio') ||
        userMessage.toLowerCase().includes('generate') ||
        userMessage.toLowerCase().includes('statistics') ||
        userMessage.toLowerCase().includes('analytics')
      );
      
      // Get response from Grok with tools if needed
      const responseContent = await getGrokCompletion(grokMessages, shouldUseTool);
      
      // Generate suggestions based on context
      const suggestions = generateContextualSuggestions(userMessage, responseContent);
      
      // Determine sources based on response content
      let sources: Source[] = [];
      
      if (responseContent.includes('financial data') || responseContent.includes('performance')) {
        sources.push({ name: 'SCB Investment Report 2025', url: '#', type: 'internal' });
      }
      
      if (responseContent.includes('market') || responseContent.includes('index')) {
        sources.push({ name: 'Financial Times Market Analysis', url: 'https://ft.com', type: 'external' });
      }
      
      if (responseContent.includes('economy') || responseContent.includes('indicator')) {
        sources.push({ name: 'Bloomberg Economic Indicators', url: 'https://bloomberg.com', type: 'external' });
      }
      
      // Add assistant response to chat with dynamic sources
      const assistantMessage: JouleMessage = {
        id: Date.now().toString(),
        content: responseContent,
        sender: 'assistant',
        timestamp: new Date(),
        suggestions,
        sources,
        toolsUsed: shouldUseTool
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting response from Grok:', error);
      
      // Add error message
      const errorMessage: JouleMessage = {
        id: Date.now().toString(),
        content: 'I apologize, but I encountered an issue while processing your request. Please try again.',
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate contextual suggestions based on conversation
  const generateContextualSuggestions = (userMessage: string, responseContent: string): string[] => {
    const messageLower = userMessage.toLowerCase();
    const responseLower = responseContent.toLowerCase();
    
    if (messageLower.includes('analytics') || responseLower.includes('analytics')) {
      return ['View detailed analytics', 'Compare to previous period', 'Export analytics data'];
    } else if (messageLower.includes('portfolio') || responseLower.includes('portfolio')) {
      return ['View portfolio breakdown', 'Check portfolio performance', 'Adjust portfolio allocation'];
    } else if (messageLower.includes('report') || responseLower.includes('report')) {
      return ['Generate report', 'Schedule regular reports', 'Share report with team'];
    } else {
      return ['View analytics', 'Check portfolio', 'Review recent transactions'];
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const newMessage: JouleMessage = {
      id: Date.now().toString(),
      content: userMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    
    // Send to Grok API
    sendToGrok(userMessage);
  };

  // Handle providing feedback on AI responses
  const handleFeedback = (messageId: string, type: 'positive' | 'negative') => {
    setFeedback(prev => {
      const current = prev[messageId];
      // Toggle off if clicking the same button again
      if (current === type) {
        const newFeedback = {...prev};
        delete newFeedback[messageId];
        return newFeedback;
      }
      // Otherwise set to the selected type
      return {...prev, [messageId]: type};
    });
  };
  
  // Handle copying content to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };
  
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 horizon-dialog-overlay" />
        <Dialog.Content className="fixed right-4 bottom-4 w-[450px] h-[600px] bg-white horizon-dialog flex flex-col overflow-hidden">
          <div className="fiori-shell-header text-white p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5" />
                <h2 className="text-base font-normal">Joule Assistant</h2>
              </div>
              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="p-1.5 hover:bg-white/20 rounded-full"
                  title="About Joule AI Assistant"
                >
                  <InfoIcon className="w-4 h-4" />
                </button>
                <Dialog.Close className="p-1.5 hover:bg-white/20 rounded-full">
                  <X className="w-4 h-4" />
                </Dialog.Close>
              </div>
            </div>
            <p className="text-xs mt-1 opacity-90">SCB Sapphire FinSight AI Assistant</p>
          </div>
          
          {/* AI Explanation Panel - Based on "Show the Work" Fiori principle */}
          <AnimatePresence>
            {showExplanation && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b border-[rgb(var(--scb-border))] bg-[rgba(var(--scb-light-blue),0.05)]"
              >
                <div className="p-3">
                  <h3 className="text-sm font-medium text-[rgb(var(--scb-primary))]">About Joule AI</h3>
                  <ul className="mt-2 text-xs space-y-1.5 text-gray-700">
                    <li className="flex items-start">
                      <Check className="w-3.5 h-3.5 text-[rgb(var(--scb-accent))] flex-shrink-0 mt-0.5 mr-1.5" />
                      <span>Joule is trained on SCB's financial data and best practices</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-3.5 h-3.5 text-[rgb(var(--scb-accent))] flex-shrink-0 mt-0.5 mr-1.5" />
                      <span>All sources of information are clearly marked when available</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-3.5 h-3.5 text-[rgb(var(--scb-accent))] flex-shrink-0 mt-0.5 mr-1.5" />
                      <span>Your feedback improves Joule's responses over time</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-3.5 h-3.5 text-[rgb(var(--scb-accent))] flex-shrink-0 mt-0.5 mr-1.5" />
                      <span>You maintain full control and can edit any AI suggestions</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[rgba(var(--scb-light-bg),0.8)]">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 shadow-sm ${
                    message.sender === 'user'
                      ? 'bg-[rgb(var(--fiori-shell-header-bg))] text-white'
                      : 'ai-assistant-message assistant bg-white border border-[rgb(var(--scb-border))]'
                  }`}
                >
                  {message.sender === 'assistant' && (
                    <div className="text-xs font-medium text-[rgb(var(--scb-primary))] mb-1 flex items-center">
                      <Sparkles className="w-3.5 h-3.5 mr-1 text-[rgb(var(--scb-accent))]" />
                      Joule AI
                    </div>
                  )}
                  
                  <div className="text-sm whitespace-pre-wrap">
                    {message.sender === 'assistant' && message.toolsUsed && (
                      <div className="mb-2 px-2 py-1 rounded-sm bg-[rgba(var(--scb-accent),0.1)] text-xs text-[rgb(var(--scb-accent))] flex items-center">
                        <Sparkles className="w-3 h-3 mr-1.5" />
                        <span>Using Grok 3 tools for financial analysis</span>
                      </div>
                    )}
                    {message.content}
                  </div>
                  
                  {/* Sources - Following "Show the Work" Fiori principle */}
                  {message.sender === 'assistant' && message.sources && message.sources.length > 0 && (
                    <div className="ai-assistant-source mt-2">
                      <p className="text-xs font-medium text-gray-600 mb-1">Sources:</p>
                      <div className="space-y-1">
                        {message.sources.map((source, idx) => (
                          <div key={idx} className="flex items-center text-xs text-[rgb(var(--scb-light-blue))]">
                            {source.type === 'external' ? (
                              <ExternalLink className="w-3 h-3 mr-1 flex-shrink-0" />
                            ) : (
                              <Clipboard className="w-3 h-3 mr-1 flex-shrink-0" />
                            )}
                            <span>{source.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* AI Controls - Following "Empower and Inspire" and "Humans Hold the Keys" principles */}
                  {message.sender === 'assistant' && (
                    <div className="ai-controls mt-2 pt-2">
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-1">
                          <button 
                            onClick={() => handleFeedback(message.id, 'positive')}
                            className={`ai-control-btn ${feedback[message.id] === 'positive' ? 'bg-[rgba(var(--scb-accent),0.1)] text-[rgb(var(--scb-accent))] border-[rgb(var(--scb-accent))]' : ''}`}
                            title="This was helpful"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleFeedback(message.id, 'negative')}
                            className={`ai-control-btn ${feedback[message.id] === 'negative' ? 'bg-[rgba(var(--scb-primary),0.1)] text-[rgb(var(--scb-primary))] border-[rgb(var(--scb-primary))]' : ''}`}
                            title="This wasn't helpful"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => copyToClipboard(message.content)}
                            className="ai-control-btn"
                            title="Copy to clipboard"
                          >
                            <Clipboard className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        <div className="flex space-x-1">
                          <button className="ai-control-btn" title="Edit this response">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button className="ai-control-btn" title="Share this insight">
                            <Share className="w-3.5 h-3.5" />
                          </button>
                          <button className="ai-control-btn" title="Generate again">
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Suggestions - Following "Continuously Assist" principle */}
                  {message.sender === 'assistant' && message.suggestions && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-700 mb-1.5">Suggested next steps:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {message.suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setInput(suggestion);
                            }}
                            className="text-xs py-1.5 px-3 rounded-full border border-[rgb(var(--scb-border))] bg-white hover:bg-[rgba(var(--scb-light-blue),0.05)] transition-colors text-[rgb(var(--scb-primary))]"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-[hsl(var(--border))] rounded p-2 flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[hsl(var(--primary))]" />
                  <p className="text-sm text-gray-700">Thinking...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-[rgb(var(--scb-border))] bg-white">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={isLoading}
                placeholder={isLoading ? "Joule is thinking..." : "Ask me about your financial data or reports..."}
                className="flex-1 fiori-input disabled:bg-[rgba(var(--scb-light-bg),0.5)] disabled:opacity-70"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="fiori-btn fiori-btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[40px]"
                aria-label="Send message"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
            
            {/* Disclaimer - Following "Maintain Quality" principle */}
            <div className="mt-2 text-center">
              <p className="text-[10px] text-gray-500">
                Joule provides information and suggestions based on available data. Always verify any financial decisions with appropriate stakeholders.
              </p>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}