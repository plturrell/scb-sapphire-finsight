import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, Send, Sparkles, Loader2, InfoIcon, RefreshCw, ThumbsUp, ThumbsDown, 
  Share, Download, ExternalLink, Check, Clipboard, Edit, ChevronDown, BarChart3 
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { JouleMessage, Source } from '@/types';
import { getGrokCompletion, GrokMessageContent } from '@/lib/grok-api';
import useNetworkAwareLoading from '@/hooks/useNetworkAwareLoading';
import useDeviceCapabilities from '@/hooks/useDeviceCapabilities';

interface EnhancedJouleAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialNewsItem?: {
    title: string;
    summary: string;
    category: string;
    source: string;
  };
  theme?: 'light' | 'dark';
}

export default function EnhancedJouleAssistant({ 
  open, 
  onOpenChange, 
  initialNewsItem,
  theme = 'light'
}: EnhancedJouleAssistantProps) {
  const [messages, setMessages] = useState<JouleMessage[]>([
    {
      id: '1',
      content: 'Hello! I am Joule, your SCB financial assistant. How can I help you with your analytics and insights today?',
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
  const initialNewsItemProcessed = useRef(false);

  // State for showing explanation panel
  const [showExplanation, setShowExplanation] = useState(false);
  // State for tracking feedback
  const [feedback, setFeedback] = useState<Record<string, 'positive' | 'negative' | null>>({});
  // Network and device awareness
  const { networkStatus } = useNetworkAwareLoading();
  const { tier, prefersColorScheme } = useDeviceCapabilities();
  
  // Use system theme preference if not specified
  const effectiveTheme = theme === 'light' || theme === 'dark' 
    ? theme 
    : prefersColorScheme === 'dark' ? 'dark' : 'light';
  
  // SCB color palette based on theme
  const scbColors = {
    light: {
      // Primary SCB colors
      honoluluBlue: 'rgb(var(--scb-honolulu-blue))', // #0072AA
      americanGreen: 'rgb(var(--scb-american-green))', // #21AA47
      darkGray: 'rgb(var(--scb-dark-gray))', // Neutral gray
      mutedRed: 'rgb(var(--scb-muted-red))', // Red for negative
      lightBlue: 'rgb(42, 120, 188)', // Light blue
      
      // UI colors
      background: 'white',
      cardBackground: 'white',
      text: 'rgb(var(--scb-dark-gray))',
      subtleText: 'rgba(var(--scb-dark-gray), 0.7)',
      border: 'rgb(var(--scb-border))',
      
      // Message colors
      userMessageBg: 'rgb(var(--scb-honolulu-blue))',
      userMessageText: 'white',
      assistantMessageBg: 'white',
      assistantMessageText: 'rgb(var(--scb-dark-gray))',
      assistantMessageBorder: 'rgb(var(--scb-border))',
    },
    dark: {
      // Dark theme colors
      honoluluBlue: 'rgb(0, 142, 211)', // Lighter for dark mode
      americanGreen: 'rgb(41, 204, 86)', // Lighter for dark mode
      darkGray: 'rgb(180, 180, 180)', // Lighter for dark mode
      mutedRed: 'rgb(235, 87, 82)', // Lighter for dark mode
      lightBlue: 'rgb(82, 157, 222)', // Lighter for dark mode
      
      // UI colors
      background: '#1a1a1a',
      cardBackground: '#2c2c2c',
      text: '#e5e5e5',
      subtleText: 'rgba(229, 229, 229, 0.7)',
      border: 'rgba(255, 255, 255, 0.12)',
      
      // Message colors
      userMessageBg: 'rgb(0, 142, 211)',
      userMessageText: 'white',
      assistantMessageBg: '#3a3a3a',
      assistantMessageText: '#e5e5e5',
      assistantMessageBorder: 'rgba(255, 255, 255, 0.12)',
    }
  };
  
  const colors = scbColors[effectiveTheme];
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Generate contextual suggestions based on conversation
  const generateContextualSuggestions = useCallback((userMessage: string, responseContent: string): string[] => {
    const messageLower = userMessage.toLowerCase();
    const responseLower = responseContent.toLowerCase();
    
    if (messageLower.includes('news') || messageLower.includes('analyze this news') || 
        (initialNewsItem && messageLower.includes(initialNewsItem.title.toLowerCase()))) {
      return ['What are the financial implications?', 'How does this affect our portfolio?', 'Find related market trends'];
    } else if (messageLower.includes('analytics') || responseLower.includes('analytics')) {
      return ['View detailed analytics', 'Compare to previous period', 'Export analytics data'];
    } else if (messageLower.includes('portfolio') || responseLower.includes('portfolio')) {
      return ['View portfolio breakdown', 'Check portfolio performance', 'Adjust portfolio allocation'];
    } else if (messageLower.includes('report') || responseLower.includes('report')) {
      return ['Generate report', 'Schedule regular reports', 'Share report with team'];
    } else {
      return ['View analytics', 'Check portfolio', 'Review recent transactions'];
    }
  }, [initialNewsItem]);

  // Process initialNewsItem when provided and dialog opens
  useEffect(() => {
    if (open && initialNewsItem && !initialNewsItemProcessed.current) {
      initialNewsItemProcessed.current = true;
      
      // Create a synthetic user message about the news item
      const userMessage = `Can you analyze this news item titled "${initialNewsItem.title}" from ${initialNewsItem.source}? The summary is: ${initialNewsItem.summary}`;
      
      // Add the user message to the chat
      const newMessage: JouleMessage = {
        id: Date.now().toString(),
        content: userMessage,
        sender: 'user',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // Process the news item with the AI
      sendToGrok(userMessage);
    }
  }, [open, initialNewsItem]);

  const sendToGrok = useCallback(async (userMessage: string) => {
    setIsLoading(true);
    
    // Adjust API based on network status
    const useSimplifiedModel = networkStatus === 'slow' || tier === 'low';
    
    // Convert chat history to format expected by Grok API
    const grokMessages: GrokMessageContent[] = messages
      .slice(useSimplifiedModel ? -3 : -6) // Use shorter context for slow networks/low-end devices
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
        userMessage.toLowerCase().includes('analytics') ||
        userMessage.toLowerCase().includes('news') ||
        userMessage.toLowerCase().includes('analyze')
      );
      
      // Skip tools usage on slow networks or low-end devices to reduce latency
      const actuallyUseTool = shouldUseTool && !(networkStatus === 'slow' || tier === 'low');
      
      // Get response from Grok with tools if needed
      const responseContent = await getGrokCompletion(grokMessages, actuallyUseTool);
      
      // Generate suggestions based on context
      const suggestions = generateContextualSuggestions(userMessage, responseContent);
      
      // Determine sources based on response content
      let sources: Source[] = [];
      
      // Add the news source if this is a news analysis
      if (initialNewsItem && userMessage.includes(initialNewsItem.title)) {
        sources.push({ 
          name: initialNewsItem.source, 
          url: '#', 
          type: 'external' 
        });
      }
      
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
        toolsUsed: actuallyUseTool
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
  }, [messages, initialNewsItem, generateContextualSuggestions, networkStatus, tier]);

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
    <Dialog.Root open={open} onOpenChange={(newOpenState) => {
        // Reset initialNewsItemProcessed when dialog is closed
        if (!newOpenState) {
          initialNewsItemProcessed.current = false;
        }
        onOpenChange(newOpenState);
      }}>
      <Dialog.Portal>
        <Dialog.Content 
          className="fixed right-4 bottom-4 w-[450px] h-[600px] horizon-dialog flex flex-col overflow-hidden"
          style={{
            backgroundColor: colors.cardBackground,
            border: `1px solid ${colors.border}`,
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
          }}
        >
          <div 
            className="fiori-shell-header p-3"
            style={{
              backgroundColor: colors.honoluluBlue,
              color: 'white'
            }}
          >
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
          
          {/* Network status indicator - shown for slow connections */}
          {networkStatus === 'slow' && (
            <div 
              className="p-2 flex items-center justify-center gap-2 text-xs"
              style={{
                backgroundColor: effectiveTheme === 'light' 
                  ? 'rgba(var(--scb-muted-red), 0.1)' 
                  : 'rgba(235, 87, 82, 0.1)',
                color: effectiveTheme === 'light'
                  ? 'rgb(var(--scb-muted-red))'
                  : 'rgb(235, 87, 82)',
                borderBottom: `1px solid ${effectiveTheme === 'light' 
                  ? 'rgba(var(--scb-muted-red), 0.2)' 
                  : 'rgba(235, 87, 82, 0.2)'}`
              }}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Limited features due to slow network connection</span>
            </div>
          )}
          
          {/* AI Explanation Panel - Based on "Show the Work" Fiori principle */}
          <AnimatePresence>
            {showExplanation && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{
                  borderBottom: `1px solid ${colors.border}`,
                  backgroundColor: effectiveTheme === 'light'
                    ? 'rgba(var(--scb-light-blue), 0.05)' 
                    : 'rgba(0, 142, 211, 0.05)'
                }}
              >
                <div className="p-3">
                  <h3 
                    className="text-sm font-medium"
                    style={{ color: colors.honoluluBlue }}
                  >
                    About Joule AI
                  </h3>
                  <ul 
                    className="mt-2 text-xs space-y-1.5"
                    style={{ color: colors.text }}
                  >
                    <li className="flex items-start">
                      <Check 
                        className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 mr-1.5" 
                        style={{ color: colors.americanGreen }}
                      />
                      <span>Joule is trained on SCB's financial data and best practices</span>
                    </li>
                    <li className="flex items-start">
                      <Check 
                        className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 mr-1.5" 
                        style={{ color: colors.americanGreen }}
                      />
                      <span>All sources of information are clearly marked when available</span>
                    </li>
                    <li className="flex items-start">
                      <Check 
                        className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 mr-1.5" 
                        style={{ color: colors.americanGreen }}
                      />
                      <span>Your feedback improves Joule's responses over time</span>
                    </li>
                    <li className="flex items-start">
                      <Check 
                        className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 mr-1.5" 
                        style={{ color: colors.americanGreen }}
                      />
                      <span>You maintain full control and can edit any AI suggestions</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4"
            style={{ 
              backgroundColor: effectiveTheme === 'light' 
                ? 'rgba(var(--scb-light-gray), 0.5)'
                : 'rgba(40, 40, 40, 0.5)' 
            }}
          >
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
                      ? '' 
                      : 'ai-assistant-message assistant'
                  }`}
                  style={{
                    backgroundColor: message.sender === 'user' 
                      ? colors.userMessageBg 
                      : colors.assistantMessageBg,
                    color: message.sender === 'user' 
                      ? colors.userMessageText 
                      : colors.assistantMessageText,
                    border: message.sender === 'user' 
                      ? 'none' 
                      : `1px solid ${colors.assistantMessageBorder}`
                  }}
                >
                  {message.sender === 'assistant' && (
                    <div 
                      className="text-xs font-medium mb-1 flex items-center"
                      style={{ color: colors.honoluluBlue }}
                    >
                      <Sparkles 
                        className="w-3.5 h-3.5 mr-1" 
                        style={{ color: colors.americanGreen }}
                      />
                      Joule AI
                    </div>
                  )}
                  
                  <div className="text-sm whitespace-pre-wrap">
                    {message.sender === 'assistant' && message.toolsUsed && (
                      <div 
                        className="mb-2 px-2 py-1 rounded-sm text-xs flex items-center"
                        style={{ 
                          backgroundColor: effectiveTheme === 'light'
                            ? 'rgba(var(--scb-american-green), 0.1)'
                            : 'rgba(41, 204, 86, 0.1)',
                          color: colors.americanGreen
                        }}
                      >
                        <Sparkles className="w-3 h-3 mr-1.5" />
                        <span>Using SCB financial analysis tools</span>
                      </div>
                    )}
                    {message.content}
                  </div>
                  
                  {/* Sources - Following "Show the Work" Fiori principle */}
                  {message.sender === 'assistant' && message.sources && message.sources.length > 0 && (
                    <div 
                      className="mt-2 pt-2"
                      style={{ 
                        borderTop: `1px dashed ${colors.border}`
                      }}
                    >
                      <p 
                        className="text-xs font-medium mb-1"
                        style={{ color: colors.subtleText }}
                      >
                        Sources:
                      </p>
                      <div className="space-y-1">
                        {message.sources.map((source, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center text-xs"
                            style={{ color: colors.lightBlue }}
                          >
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
                    <div 
                      className="mt-2 pt-2"
                      style={{ borderTop: `1px solid ${colors.border}` }}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-1">
                          <button 
                            onClick={() => handleFeedback(message.id, 'positive')}
                            className="ai-control-btn"
                            style={{ 
                              backgroundColor: feedback[message.id] === 'positive' 
                                ? effectiveTheme === 'light'
                                  ? 'rgba(var(--scb-american-green), 0.1)'
                                  : 'rgba(41, 204, 86, 0.1)'
                                : 'transparent',
                              color: feedback[message.id] === 'positive'
                                ? colors.americanGreen
                                : colors.subtleText,
                              border: `1px solid ${feedback[message.id] === 'positive'
                                ? colors.americanGreen
                                : colors.border}`
                            }}
                            title="This was helpful"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleFeedback(message.id, 'negative')}
                            className="ai-control-btn"
                            style={{ 
                              backgroundColor: feedback[message.id] === 'negative' 
                                ? effectiveTheme === 'light'
                                  ? 'rgba(var(--scb-honolulu-blue), 0.1)'
                                  : 'rgba(0, 142, 211, 0.1)'
                                : 'transparent',
                              color: feedback[message.id] === 'negative'
                                ? colors.honoluluBlue
                                : colors.subtleText,
                              border: `1px solid ${feedback[message.id] === 'negative'
                                ? colors.honoluluBlue
                                : colors.border}`
                            }}
                            title="This wasn't helpful"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => copyToClipboard(message.content)}
                            className="ai-control-btn"
                            style={{ 
                              color: colors.subtleText,
                              border: `1px solid ${colors.border}`
                            }}
                            title="Copy to clipboard"
                          >
                            <Clipboard className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        <div className="flex space-x-1">
                          <button 
                            className="ai-control-btn"
                            style={{ 
                              color: colors.subtleText,
                              border: `1px solid ${colors.border}`
                            }}
                            title="Edit this response"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            className="ai-control-btn"
                            style={{ 
                              color: colors.subtleText,
                              border: `1px solid ${colors.border}`
                            }}
                            title="Share this insight"
                          >
                            <Share className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            className="ai-control-btn"
                            style={{ 
                              color: colors.subtleText,
                              border: `1px solid ${colors.border}`
                            }}
                            title="Generate again"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Suggestions - Following "Continuously Assist" principle */}
                  {message.sender === 'assistant' && message.suggestions && (
                    <div className="mt-3">
                      <p 
                        className="text-xs font-medium mb-1.5"
                        style={{ color: colors.text }}
                      >
                        Suggested next steps:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {message.suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setInput(suggestion);
                            }}
                            className="text-xs py-1.5 px-3 rounded-full transition-colors"
                            style={{
                              backgroundColor: effectiveTheme === 'light' ? 'white' : '#3a3a3a',
                              color: colors.honoluluBlue,
                              border: `1px solid ${colors.border}`,
                              ':hover': {
                                backgroundColor: effectiveTheme === 'light'
                                  ? 'rgba(var(--scb-light-blue), 0.05)'
                                  : 'rgba(0, 142, 211, 0.05)'
                              }
                            }}
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
                <div 
                  className="flex items-center space-x-2 p-2 rounded"
                  style={{
                    backgroundColor: colors.assistantMessageBg,
                    border: `1px solid ${colors.border}`
                  }}
                >
                  <Loader2 
                    className="w-4 h-4 animate-spin" 
                    style={{ color: colors.honoluluBlue }}
                  />
                  <p 
                    className="text-sm"
                    style={{ color: colors.text }}
                  >
                    Thinking...
                  </p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div 
            className="p-3 bg-white"
            style={{
              borderTop: `1px solid ${colors.border}`,
              backgroundColor: colors.cardBackground
            }}
          >
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={isLoading}
                placeholder={isLoading ? "Joule is thinking..." : "Ask me about your financial data or reports..."}
                className="flex-1 fiori-input disabled:opacity-70"
                style={{
                  backgroundColor: isLoading 
                    ? effectiveTheme === 'light'
                      ? 'rgba(var(--scb-light-gray), 0.5)'
                      : 'rgba(70, 70, 70, 0.5)'
                    : effectiveTheme === 'light'
                      ? 'white'
                      : '#3a3a3a',
                  color: colors.text,
                  border: `1px solid ${colors.border}`
                }}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="fiori-btn fiori-btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[40px]"
                style={{
                  backgroundColor: colors.honoluluBlue,
                  color: 'white'
                }}
                aria-label="Send message"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
            
            {/* Disclaimer - Following "Maintain Quality" principle */}
            <div className="mt-2 text-center">
              <p 
                className="text-[10px]"
                style={{ color: colors.subtleText }}
              >
                Joule provides information and suggestions based on available data. Always verify any financial decisions with appropriate stakeholders.
              </p>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}