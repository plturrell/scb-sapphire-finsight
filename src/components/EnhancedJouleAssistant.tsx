import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Send,
  Sparkles,
  Loader2,
  InfoIcon,
  RefreshCw,
  CheckCircle,
  Box,
  BarChart3,
  Award,
  Link,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Globe,
  LineChart,
  ArrowRightCircle,
  Share2,
  Download,
  Calculator,
  AlertCircle
} from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { JouleMessage, Source, WorkflowStep, GuidedWorkflow, AIInsight } from '../types/JouleTypes';

interface EnhancedJouleAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
  contextData?: any; // For passing dashboard context data
}

// Use WorkflowStep and GuidedWorkflow types from JouleTypes

/**
 * Enhanced Joule AI Assistant with SAP Fiori design language and specialized
 * capabilities for Perplexity integration and Monte Carlo simulations
 */
export default function EnhancedJouleAssistant({
  open,
  onOpenChange,
  initialQuery,
  contextData
}: EnhancedJouleAssistantProps) {
  // Message state
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
  
  const [input, setInput] = useState(initialQuery || '');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // UI states
  const [activeTab, setActiveTab] = useState<'chat' | 'workflows' | 'insights'>('chat');
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  
  // Workflow states
  const [availableWorkflows, setAvailableWorkflows] = useState<GuidedWorkflow[]>([
    {
      id: 'monte-carlo-analysis',
      title: 'Monte Carlo Simulation Analysis',
      description: 'Create and analyze Monte Carlo simulations for risk assessment',
      steps: [
        {
          id: 'step1',
          title: 'Define Simulation Parameters',
          description: 'Set the parameters for your Monte Carlo simulation',
          type: 'data-selection',
          completed: false,
          dataType: 'monte-carlo'
        },
        {
          id: 'step2',
          title: 'Run Simulation',
          description: 'Execute the Monte Carlo simulation with defined parameters',
          type: 'confirmation',
          completed: false
        },
        {
          id: 'step3',
          title: 'Generate Visualization',
          description: 'Create visual representations of simulation results',
          type: 'visualization',
          completed: false
        },
        {
          id: 'step4',
          title: 'Analyze Results',
          description: 'Get AI-powered analysis of simulation outcomes',
          type: 'input',
          completed: false
        }
      ],
      currentStepIndex: 0,
      completed: false
    },
    {
      id: 'market-research',
      title: 'Market Research Analysis',
      description: 'Research market trends and generate insights with Perplexity integration',
      steps: [
        {
          id: 'step1',
          title: 'Define Research Topic',
          description: 'Specify the market segment or topic to research',
          type: 'input',
          completed: false
        },
        {
          id: 'step2',
          title: 'Select Data Sources',
          description: 'Choose data sources for your research',
          type: 'choice',
          options: ['News Articles', 'Financial Reports', 'Social Media', 'Industry Reports'],
          completed: false
        },
        {
          id: 'step3',
          title: 'Generate Insights',
          description: 'Process data and generate market insights',
          type: 'confirmation',
          completed: false,
          dataType: 'perplexity'
        }
      ],
      currentStepIndex: 0,
      completed: false
    },
    {
      id: 'dashboard-story',
      title: 'Create Dashboard Story',
      description: 'Generate a dynamic dashboard based on your data and requirements',
      steps: [
        {
          id: 'step1',
          title: 'Select Data Focus',
          description: 'Choose the primary data focus for your dashboard',
          type: 'choice',
          options: ['Financial Performance', 'Risk Analysis', 'Market Trends', 'Portfolio Analysis'],
          completed: false
        },
        {
          id: 'step2',
          title: 'Select Visualization Types',
          description: 'Choose the visualization types for your dashboard',
          type: 'choice',
          options: ['Line Charts', 'Bar Charts', 'Pie Charts', 'Sankey Diagrams', 'Heat Maps'],
          completed: false
        },
        {
          id: 'step3',
          title: 'Generate Dashboard',
          description: 'Create your customized dashboard',
          type: 'confirmation',
          completed: false,
          dataType: 'dashboard'
        }
      ],
      currentStepIndex: 0,
      completed: false
    }
  ]);
  
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  
  // Insights states
  const [generatedInsights, setGeneratedInsights] = useState<AIInsight[]>([
    {
      id: 'insight1',
      title: 'Portfolio Allocation Risk',
      description: 'Current allocation shows 12% higher risk exposure than benchmark',
      category: 'Risk',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      severity: 'high'
    },
    {
      id: 'insight2',
      title: 'Market Trend Detection',
      description: 'Detected upward trend in Southeast Asian markets based on recent data',
      category: 'Market',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
      severity: 'medium'
    }
  ]);
  
  // Advanced visualization states
  const [generatedVisualizations, setGeneratedVisualizations] = useState<any[]>([]);
  
  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Process initial query when provided and dialog opens
  useEffect(() => {
    if (open && initialQuery && input === initialQuery) {
      handleSend();
    }
  }, [open, initialQuery, input]);
  
  // Handle sending a message
  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: JouleMessage = {
      id: Date.now().toString(),
      content: input.trim(),
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    // Process the message
    processMessage(userMessage.content);
  };
  
  // Process a message with appropriate response
  const processMessage = async (messageContent: string) => {
    setIsLoading(true);
    
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Example response logic - would connect to real AI services in production
      let responseContent = '';
      let aiSources: Source[] = [];
      let visualizations = [];
      
      // Detect context and generate appropriate response
      if (messageContent.toLowerCase().includes('monte carlo')) {
        responseContent = "I can help with Monte Carlo simulations. Would you like to start a guided workflow for setting up and analyzing a simulation?";
        aiSources = [
          { name: 'Monte Carlo Simulation Documentation', url: '#', type: 'internal' }
        ];
        
        // Offer to start the workflow
        setActiveWorkflowId('monte-carlo-analysis');
        setActiveTab('workflows');
      } 
      else if (messageContent.toLowerCase().includes('market research') || messageContent.toLowerCase().includes('perplexity')) {
        responseContent = "I can help with market research using Perplexity integration. Would you like to start a guided workflow for market research?";
        aiSources = [
          { name: 'Perplexity Research API', url: '#', type: 'external' },
          { name: 'Market Analysis Framework', url: '#', type: 'internal' }
        ];
        
        setActiveWorkflowId('market-research');
        setActiveTab('workflows');
      }
      else if (messageContent.toLowerCase().includes('dashboard') || messageContent.toLowerCase().includes('visualization')) {
        responseContent = "I can create a custom dashboard story with visualizations based on your data. Would you like to start a guided workflow for creating a dashboard?";
        aiSources = [
          { name: 'Dashboard Templates', url: '#', type: 'internal' }
        ];
        
        setActiveWorkflowId('dashboard-story');
        setActiveTab('workflows');
      }
      else if (messageContent.toLowerCase().includes('portfolio') || messageContent.toLowerCase().includes('allocation')) {
        responseContent = "Based on your portfolio data, I've analyzed the allocation and found that your current exposure to technology sectors is 12% higher than the recommended benchmark for your risk profile. Would you like to see a visualization of this analysis?";
        aiSources = [
          { name: 'Portfolio Analysis', url: '#', type: 'internal' },
          { name: 'Risk Assessment Framework', url: '#', type: 'internal' }
        ];
        
        // Add a sample visualization
        visualizations.push({
          type: 'portfolio-allocation',
          data: {
            current: [
              { category: 'Technology', value: 32 },
              { category: 'Finance', value: 25 },
              { category: 'Healthcare', value: 18 },
              { category: 'Consumer', value: 15 },
              { category: 'Other', value: 10 }
            ],
            recommended: [
              { category: 'Technology', value: 20 },
              { category: 'Finance', value: 30 },
              { category: 'Healthcare', value: 20 },
              { category: 'Consumer', value: 20 },
              { category: 'Other', value: 10 }
            ]
          }
        });
        
        setGeneratedVisualizations(visualizations);
      }
      else {
        responseContent = "I'm here to help with financial analytics, Monte Carlo simulations, market research with Perplexity, and creating dynamic dashboards. How can I assist you today?";
        aiSources = [
          { name: 'FinSight Documentation', url: '#', type: 'internal' }
        ];
      }
      
      // Generate contextual suggestions based on response
      const suggestions = generateSuggestions(messageContent, responseContent);
      
      // Add assistant response to chat
      const assistantMessage: JouleMessage = {
        id: Date.now().toString(),
        content: responseContent,
        sender: 'assistant',
        timestamp: new Date(),
        sources: aiSources,
        suggestions,
        visualizations
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing message:', error);
      
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
  
  // Generate contextual suggestions
  const generateSuggestions = (userMessage: string, assistantResponse: string): string[] => {
    // Simple logic for generating contextual suggestions
    if (userMessage.toLowerCase().includes('monte carlo')) {
      return ['Run a new Monte Carlo simulation', 'Show previous simulation results', 'Analyze risk factors'];
    } else if (userMessage.toLowerCase().includes('market') || userMessage.toLowerCase().includes('perplexity')) {
      return ['Research market trends', 'Analyze competitor data', 'Generate market report'];
    } else if (userMessage.toLowerCase().includes('dashboard') || userMessage.toLowerCase().includes('visualization')) {
      return ['Create portfolio dashboard', 'Generate risk analysis', 'Build market trend visualization'];
    } else if (userMessage.toLowerCase().includes('portfolio')) {
      return ['Show portfolio allocation', 'Calculate risk metrics', 'Compare to benchmark'];
    } else {
      return ['Tell me about Monte Carlo simulations', 'Research market trends', 'Create a dashboard'];
    }
  };
  
  // Handle selecting a workflow
  const handleWorkflowSelect = (workflowId: string) => {
    setActiveWorkflowId(workflowId);
  };
  
  // Get the active workflow
  const getActiveWorkflow = () => {
    return availableWorkflows.find(workflow => workflow.id === activeWorkflowId) || null;
  };
  
  // Handle workflow step interaction
  const handleWorkflowStep = (action: 'next' | 'prev' | 'complete') => {
    const updatedWorkflows = [...availableWorkflows];
    const workflowIndex = updatedWorkflows.findIndex(w => w.id === activeWorkflowId);
    
    if (workflowIndex === -1) return;
    
    const workflow = updatedWorkflows[workflowIndex];
    const currentStep = workflow.steps[workflow.currentStepIndex];
    
    if (action === 'next') {
      // Mark current step as completed
      workflow.steps[workflow.currentStepIndex].completed = true;
      
      // Move to next step if available
      if (workflow.currentStepIndex < workflow.steps.length - 1) {
        workflow.currentStepIndex += 1;
      } else {
        workflow.completed = true;
      }
    } else if (action === 'prev') {
      // Move to previous step if available
      if (workflow.currentStepIndex > 0) {
        workflow.currentStepIndex -= 1;
      }
    } else if (action === 'complete') {
      // Mark all steps as completed
      workflow.steps.forEach(step => { step.completed = true; });
      workflow.completed = true;
      
      // Add completion message to chat
      const completionMessage: JouleMessage = {
        id: Date.now().toString(),
        content: `I've completed the "${workflow.title}" workflow for you. ${
          workflow.id === 'monte-carlo-analysis' 
            ? 'The Monte Carlo simulation has been run successfully with 5,000 iterations.' 
            : workflow.id === 'market-research' 
              ? 'I\'ve generated a market research report based on the latest data.' 
              : 'I\'ve created a custom dashboard based on your specifications.'
        }`,
        sender: 'assistant',
        timestamp: new Date(),
        sources: [
          { name: 'Workflow Engine', url: '#', type: 'internal' }
        ]
      };
      
      setMessages(prev => [...prev, completionMessage]);
      setActiveTab('chat');
    }
    
    setAvailableWorkflows(updatedWorkflows);
  };
  
  return (
    <div className="fixed inset-y-0 right-0 flex flex-col bg-white shadow-xl z-50 w-96 border-l border-gray-200">
      {/* Header with SAP Fiori design */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-[#354a5f]">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-md bg-[#cc00dc] flex items-center justify-center mr-3">
            <Sparkles className="text-white h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-medium text-white">Joule</h2>
            <div className="flex items-center">
              <p className="text-xs text-white/80">Powered by</p>
              <Image
                src="/assets/idEDqS_YGr_1747680256633.svg"
                alt="SAP"
                width={24}
                height={12}
                className="ml-1 brightness-0 invert opacity-80"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowHelpPanel(!showHelpPanel)}
            className="text-white/80 hover:text-white p-1.5 rounded-full transition-colors"
            aria-label="Help"
          >
            <InfoIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onOpenChange(false)}
            className="text-white/80 hover:text-white p-1.5 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>
      
      {/* Help Panel */}
      <AnimatePresence>
        {showHelpPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-200 bg-gray-50"
          >
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-800 mb-2">What can Joule do?</h3>
              <ul className="space-y-2 text-xs text-gray-600">
                <li className="flex items-start">
                  <LineChart className="h-3.5 w-3.5 text-[#cc00dc] mt-0.5 mr-2 flex-shrink-0" />
                  <span>Run Monte Carlo simulations and financial analyses</span>
                </li>
                <li className="flex items-start">
                  <Globe className="h-3.5 w-3.5 text-[#cc00dc] mt-0.5 mr-2 flex-shrink-0" />
                  <span>Conduct market research with Perplexity integration</span>
                </li>
                <li className="flex items-start">
                  <BarChart3 className="h-3.5 w-3.5 text-[#cc00dc] mt-0.5 mr-2 flex-shrink-0" />
                  <span>Create interactive visualizations and dashboards</span>
                </li>
                <li className="flex items-start">
                  <ArrowRightCircle className="h-3.5 w-3.5 text-[#cc00dc] mt-0.5 mr-2 flex-shrink-0" />
                  <span>Guide you through complex business workflows</span>
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'chat'
              ? 'border-[#cc00dc] text-[#cc00dc]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('chat')}
        >
          Chat
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'workflows'
              ? 'border-[#cc00dc] text-[#cc00dc]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('workflows')}
        >
          Workflows
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'insights'
              ? 'border-[#cc00dc] text-[#cc00dc]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('insights')}
        >
          Insights
        </button>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-[#354a5f] text-white'
                      : 'bg-gray-100 border border-gray-200'
                  }`}
                >
                  {message.sender === 'assistant' && (
                    <div className="text-xs font-medium text-[#cc00dc] mb-1 flex items-center">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Joule
                    </div>
                  )}
                  
                  <div className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </div>
                  
                  {/* Visualizations */}
                  {message.visualizations && message.visualizations.length > 0 && (
                    <div className="mt-3 p-2 bg-white border border-gray-200 rounded-md">
                      <div className="text-xs font-medium text-gray-700 mb-2">Portfolio Allocation Comparison</div>
                      <div className="flex flex-col space-y-2">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Current Allocation</span>
                          <span>Recommended Allocation</span>
                        </div>
                        
                        {/* Simple bar visualization */}
                        {message.visualizations[0].data.current.map((item: any, index: number) => (
                          <div key={index} className="flex flex-col">
                            <div className="text-xs text-gray-800 mb-1">{item.category}</div>
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                                <div 
                                  className="h-full bg-blue-500 rounded-r" 
                                  style={{ width: `${item.value}%` }}
                                />
                              </div>
                              <div className="text-xs text-gray-600 w-8 text-right">{item.value}%</div>
                              
                              <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                                <div 
                                  className="h-full bg-green-500 rounded-r" 
                                  style={{ width: `${message.visualizations[0].data.recommended[index].value}%` }}
                                />
                              </div>
                              <div className="text-xs text-gray-600 w-8 text-right">
                                {message.visualizations[0].data.recommended[index].value}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-end mt-3">
                        <button className="text-xs flex items-center gap-1 text-[#cc00dc]">
                          <Share2 className="w-3 h-3" />
                          <span>Share</span>
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Sources */}
                  {message.sender === 'assistant' && message.sources && message.sources.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      <div className="flex flex-wrap gap-1">
                        {message.sources.map((source, idx) => (
                          <span key={idx} className="inline-flex items-center bg-gray-200 px-2 py-0.5 rounded">
                            <Link className="w-3 h-3 mr-1" />
                            {source.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Suggestions */}
                  {message.sender === 'assistant' && message.suggestions && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-1.5">
                        {message.suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setInput(suggestion);
                            }}
                            className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 border border-gray-200 rounded-lg p-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#cc00dc]" />
                  <p className="text-sm text-gray-600">Thinking...</p>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
        
        {/* Workflows Tab */}
        {activeTab === 'workflows' && (
          <div className="p-4">
            {activeWorkflowId ? (
              <div>
                {/* Active Workflow */}
                <div className="mb-4">
                  <button 
                    className="text-sm text-[#cc00dc] flex items-center mb-2"
                    onClick={() => setActiveWorkflowId(null)}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to all workflows
                  </button>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-base font-medium text-gray-800">
                      {getActiveWorkflow()?.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {getActiveWorkflow()?.description}
                    </p>
                    
                    {/* Progress indicator */}
                    <div className="mt-4 mb-6">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span>Progress</span>
                        <span>
                          {getActiveWorkflow()?.steps.filter(s => s.completed).length} / {getActiveWorkflow()?.steps.length} steps
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#cc00dc] rounded-full" 
                          style={{ 
                            width: `${
                              getActiveWorkflow() 
                                ? (getActiveWorkflow()!.steps.filter(s => s.completed).length / getActiveWorkflow()!.steps.length) * 100 
                                : 0
                            }%` 
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Current step */}
                    {getActiveWorkflow() && (
                      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <h4 className="font-medium text-gray-800 mb-1">
                          {getActiveWorkflow()?.steps[getActiveWorkflow()!.currentStepIndex].title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">
                          {getActiveWorkflow()?.steps[getActiveWorkflow()!.currentStepIndex].description}
                        </p>
                        
                        {/* Step content based on type */}
                        {(() => {
                          const currentStep = getActiveWorkflow()?.steps[getActiveWorkflow()!.currentStepIndex];
                          
                          switch (currentStep?.type) {
                            case 'input':
                              return (
                                <div className="mb-4">
                                  <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    placeholder="Enter your response..."
                                  />
                                </div>
                              );
                            case 'choice':
                              return (
                                <div className="mb-4 space-y-2">
                                  {currentStep.options?.map((option, index) => (
                                    <div 
                                      key={index}
                                      className="flex items-center space-x-2 p-2 border border-gray-200 rounded-md hover:bg-white cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        id={`option-${index}`}
                                        className="h-4 w-4 text-[#cc00dc] focus:ring-[#cc00dc]"
                                      />
                                      <label 
                                        htmlFor={`option-${index}`}
                                        className="text-sm text-gray-700 cursor-pointer"
                                      >
                                        {option}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              );
                            case 'data-selection':
                              return (
                                <div className="mb-4">
                                  {currentStep.dataType === 'monte-carlo' && (
                                    <div className="space-y-3">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                          Number of Simulations
                                        </label>
                                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white">
                                          <option>1,000</option>
                                          <option>5,000</option>
                                          <option>10,000</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                          Confidence Level
                                        </label>
                                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white">
                                          <option>90%</option>
                                          <option>95%</option>
                                          <option>99%</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                          Time Horizon
                                        </label>
                                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white">
                                          <option>1 Year</option>
                                          <option>3 Years</option>
                                          <option>5 Years</option>
                                          <option>10 Years</option>
                                        </select>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            case 'visualization':
                              return (
                                <div className="mb-4 p-3 bg-white border border-gray-200 rounded-md">
                                  <div className="text-center text-sm text-gray-600 py-6">
                                    <Calculator className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                    <p>Visualization will be generated after running the simulation</p>
                                  </div>
                                </div>
                              );
                            default:
                              return null;
                          }
                        })()}
                        
                        {/* Step navigation */}
                        <div className="flex justify-between">
                          <button
                            onClick={() => handleWorkflowStep('prev')}
                            className="px-4 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50"
                            disabled={getActiveWorkflow()?.currentStepIndex === 0}
                          >
                            Previous
                          </button>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleWorkflowStep('complete')}
                              className="px-4 py-2 text-sm border border-[#cc00dc] text-[#cc00dc] rounded-md"
                            >
                              Complete All
                            </button>
                            <button
                              onClick={() => handleWorkflowStep('next')}
                              className="px-4 py-2 text-sm bg-[#cc00dc] text-white rounded-md"
                            >
                              {getActiveWorkflow()?.currentStepIndex === getActiveWorkflow()!.steps.length - 1
                                ? 'Complete'
                                : 'Next'
                              }
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Workflow List */
              <div>
                <h3 className="text-base font-medium text-gray-800 mb-4">Available Workflows</h3>
                <div className="space-y-3">
                  {availableWorkflows.map((workflow) => (
                    <div
                      key={workflow.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-[#cc00dc] transition-colors cursor-pointer"
                      onClick={() => handleWorkflowSelect(workflow.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-800">{workflow.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                      
                      {workflow.completed && (
                        <div className="mt-2 inline-flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completed
                        </div>
                      )}
                      
                      {!workflow.completed && workflow.steps.some(s => s.completed) && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{workflow.steps.filter(s => s.completed).length} / {workflow.steps.length}</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#cc00dc] rounded-full" 
                              style={{ 
                                width: `${(workflow.steps.filter(s => s.completed).length / workflow.steps.length) * 100}%` 
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="p-4">
            <h3 className="text-base font-medium text-gray-800 mb-4">Generated Insights</h3>
            
            <div className="space-y-3">
              {generatedInsights.map((insight) => (
                <div
                  key={insight.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-[#cc00dc] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`rounded-full p-2 ${
                      insight.severity === 'high' 
                        ? 'bg-red-100 text-red-600' 
                        : insight.severity === 'medium'
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-blue-100 text-blue-600'
                    }`}>
                      {insight.category === 'Risk' 
                        ? <AlertCircle className="w-4 h-4" /> 
                        : insight.category === 'Market'
                          ? <Globe className="w-4 h-4" />
                          : <Award className="w-4 h-4" />
                      }
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{insight.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                      
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">
                          {insight.timestamp.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <button className="text-xs text-[#cc00dc] flex items-center gap-1">
                            <Share2 className="w-3 h-3" />
                            <span>Share</span>
                          </button>
                          <button className="text-xs text-[#cc00dc] flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            <span>Export</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Input area */}
      <div className="border-t border-gray-200 p-3 bg-white">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isLoading ? "Thinking..." : "Ask me anything..."}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#cc00dc] focus:border-[#cc00dc]"
            disabled={isLoading}
          />
          
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2 bg-[#cc00dc] text-white rounded-md disabled:opacity-50"
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        
        <p className="text-center text-xs text-gray-500 mt-2">
          Joule provides information based on SAP's FinSight data. Always verify critical business decisions.
        </p>
      </div>
    </div>
  );
}