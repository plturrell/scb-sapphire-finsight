import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { 
  Box, 
  Typography, 
  IconButton, 
  InputBase, 
  Avatar, 
  Chip, 
  Divider, 
  Badge, 
  Paper, 
  alpha, 
  Tooltip
} from '@mui/material';

type NewsItem = {
  id: string;
  title: string;
  source: string;
  category: string;
  timestamp: string;
  content?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  importance?: number;
  relatedTags?: string[];
  url?: string;
  imageUrl?: string;
};

/**
 * EnhancedPerplexityPanel
 * 
 * World-class news and search panel inspired by Perplexity AI with premium
 * design details, optimized for financial information and alerts in an
 * enterprise context.
 */
const EnhancedPerplexityPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'news' | 'search' | 'alerts'>('news');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [expandedNewsId, setExpandedNewsId] = useState<string | null>(null);
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const controls = useAnimation();

  // Mock data for demonstration
  const newsItems: NewsItem[] = [
    {
      id: '1',
      title: 'Vietnam trade deal impact on Standard Chartered growth prospects',
      source: 'Bloomberg Financial',
      category: 'Financial',
      timestamp: '10 minutes ago',
      content: "The recent trade agreements between Vietnam and neighboring countries are expected to have a significant positive impact on Standard Chartered Bank's growth in the Southeast Asian market. Experts predict a 15% increase in trade financing opportunities over the next fiscal year. The bank has already positioned itself strategically in the region with new partnerships and expanded services tailored to cross-border commerce.",
      sentiment: 'positive',
      importance: 9,
      relatedTags: ['Vietnam', 'Trade Deal', 'Growth', 'SCB'],
      url: 'https://bloomberg.com/news/articles/2025-05-20/vietnam-trade-deal-impact',
      imageUrl: '/assets/finsight_Banner.png'
    },
    {
      id: '2',
      title: 'New tariff regulations affect Asian markets',
      source: 'Reuters',
      category: 'Regulatory',
      timestamp: '2 hours ago',
      sentiment: 'negative',
      importance: 8,
      relatedTags: ['Tariffs', 'Asia', 'Regulations']
    },
    {
      id: '3',
      title: 'Financial sector embracing AI for analytics',
      source: 'Financial Times',
      category: 'Technology',
      timestamp: '5 hours ago',
      sentiment: 'positive',
      importance: 7,
      relatedTags: ['AI', 'Analytics', 'FinTech']
    },
    {
      id: '4',
      title: 'Market volatility increases amid global tensions',
      source: 'CNBC',
      category: 'Markets',
      timestamp: '1 day ago',
      sentiment: 'neutral',
      importance: 6,
      relatedTags: ['Volatility', 'Markets', 'Global']
    },
    {
      id: '5',
      title: 'Sustainable banking initiatives gain traction',
      source: 'ESG Today',
      category: 'Sustainability',
      timestamp: '1 day ago',
      sentiment: 'positive',
      importance: 5,
      relatedTags: ['ESG', 'Sustainability', 'Banking']
    }
  ];

  const alertItems = [
    {
      id: 'a1',
      title: 'Significant tariff change detected',
      description: 'Vietnam export tariffs changing by 3.5%',
      timestamp: '10 minutes ago',
      severity: 'high',
      type: 'tariff'
    },
    {
      id: 'a2',
      title: 'Market volatility threshold exceeded',
      description: 'APAC markets showing 12% increased volatility',
      timestamp: '1 hour ago',
      severity: 'medium',
      type: 'market'
    },
    {
      id: 'a3',
      title: 'New regulatory compliance requirement',
      description: 'Financial reporting changes for Q3',
      timestamp: '3 hours ago',
      severity: 'high',
      type: 'regulatory'
    }
  ];

  const recentSearches = [
    'Vietnam tariff impact',
    'Standard Chartered growth APAC',
    'Financial market volatility 2025',
    'ESG banking initiatives'
  ];

  // Animation effects when switching tabs
  useEffect(() => {
    controls.start({
      opacity: [0, 1],
      y: [10, 0],
      transition: { duration: 0.3, ease: 'easeOut' }
    });
  }, [activeTab, controls]);

  // Focus the search input when switching to search tab
  useEffect(() => {
    if (activeTab === 'search' && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [activeTab]);

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    // Simulate search delay
    setTimeout(() => {
      setIsSearching(false);
      // Handle search results here
    }, 1500);
  };

  // Get color for sentiment badges
  const getSentimentColor = (sentiment: 'positive' | 'negative' | 'neutral') => {
    switch (sentiment) {
      case 'positive': return { bg: '#e6f7ed', text: '#0a8043' };
      case 'negative': return { bg: '#fee7e7', text: '#d93025' };
      case 'neutral': return { bg: '#f1f3f4', text: '#606368' };
      default: return { bg: '#f1f3f4', text: '#606368' };
    }
  };

  // Get color for alert severity
  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return { bg: 'rgba(217, 48, 37, 0.1)', text: '#d93025', border: '#d93025' };
      case 'medium': return { bg: 'rgba(251, 188, 5, 0.1)', text: '#f5a623', border: '#f5a623' };
      case 'low': return { bg: 'rgba(52, 168, 83, 0.1)', text: '#34a853', border: '#34a853' };
      default: return { bg: 'rgba(66, 133, 244, 0.1)', text: '#4285f4', border: '#4285f4' };
    }
  };

  // Get icon for alert type
  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'tariff':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="2" x2="12" y2="6"></line>
            <line x1="12" y1="18" x2="12" y2="22"></line>
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
            <line x1="2" y1="12" x2="6" y2="12"></line>
            <line x1="18" y1="12" x2="22" y2="12"></line>
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
          </svg>
        );
      case 'market':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
          </svg>
        );
      case 'regulatory':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
            <line x1="6" y1="1" x2="6" y2="4"></line>
            <line x1="10" y1="1" x2="10" y2="4"></line>
            <line x1="14" y1="1" x2="14" y2="4"></line>
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        );
    }
  };

  return (
    <Box
      sx={{
        width: 380,
        height: '100vh',
        backgroundColor: 'rgb(255, 255, 255)',
        borderLeft: '1px solid rgba(0, 0, 0, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.08)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Tab Navigation with Perplexity Branding */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          paddingX: 2,
          paddingY: 2.5,
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          backgroundColor: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar 
            src="/assets/perplexity.png"
            alt="Perplexity"
            sx={{ 
              width: 30, 
              height: 30, 
              marginRight: 1,
              backgroundColor: '#5436DA',
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          />
          <Typography 
            variant="subtitle1"
            sx={{ 
              fontWeight: 600,
              fontSize: '1rem',
              letterSpacing: '-0.01em',
              color: '#0f101a'
            }}
          >
            Perplexity
            <Box 
              component="span" 
              sx={{ 
                fontSize: '0.65rem', 
                verticalAlign: 'top', 
                ml: 0.5,
                fontWeight: 700,
                color: '#5436DA' 
              }}
            >
              PRO
            </Box>
          </Typography>
          <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
            <Tooltip title="Research with sources" arrow>
              <IconButton size="small">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings" arrow>
              <IconButton size="small">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 1, 
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            pb: 1
          }}
        >
          <Box
            onClick={() => setActiveTab('news')}
            sx={{
              py: 0.8,
              px: 1.5,
              borderRadius: '6px',
              backgroundColor: activeTab === 'news' ? alpha('#5436DA', 0.08) : 'transparent',
              color: activeTab === 'news' ? '#5436DA' : '#606368',
              fontWeight: activeTab === 'news' ? 600 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: activeTab === 'news' ? alpha('#5436DA', 0.12) : alpha('#000', 0.04)
              },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"></path>
              <path d="M18 14h-8"></path>
              <path d="M15 18h-5"></path>
              <path d="M10 6h8v4h-8V6Z"></path>
            </svg>
            News
          </Box>
          
          <Box
            onClick={() => setActiveTab('search')}
            sx={{
              py: 0.8,
              px: 1.5,
              borderRadius: '6px',
              backgroundColor: activeTab === 'search' ? alpha('#5436DA', 0.08) : 'transparent',
              color: activeTab === 'search' ? '#5436DA' : '#606368',
              fontWeight: activeTab === 'search' ? 600 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: activeTab === 'search' ? alpha('#5436DA', 0.12) : alpha('#000', 0.04)
              },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            Search
          </Box>
          
          <Box
            onClick={() => setActiveTab('alerts')}
            sx={{
              py: 0.8,
              px: 1.5,
              borderRadius: '6px',
              backgroundColor: activeTab === 'alerts' ? alpha('#5436DA', 0.08) : 'transparent',
              color: activeTab === 'alerts' ? '#5436DA' : '#606368',
              fontWeight: activeTab === 'alerts' ? 600 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: activeTab === 'alerts' ? alpha('#5436DA', 0.12) : alpha('#000', 0.04)
              },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            Alerts
            <Badge
              variant="dot"
              color="error"
              sx={{
                position: 'absolute',
                top: 5,
                right: 5,
                '& .MuiBadge-dot': {
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                }
              }}
            />
          </Box>
        </Box>
      </Box>
      
      {/* Tab Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={controls}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{ height: '100%' }}
          >
            {/* News Tab */}
            {activeTab === 'news' && (
              <Box sx={{ height: '100%', overflow: 'auto', px: 2, py: 2 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    mb: 2, 
                    fontSize: '0.9rem', 
                    fontWeight: 600, 
                    color: '#202124',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  Latest Financial News
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {newsItems.map((item) => (
                    <Paper
                      key={item.id}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        transition: 'all 0.15s ease',
                        cursor: 'pointer',
                        position: 'relative',
                        backgroundColor: expandedNewsId === item.id ? alpha('#5436DA', 0.02) : 'white',
                        '&:hover': {
                          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                          transform: expandedNewsId !== item.id ? 'translateY(-2px)' : 'none'
                        }
                      }}
                      onClick={() => {
                        setExpandedNewsId(expandedNewsId === item.id ? null : item.id);
                      }}
                    >
                      {/* News Category Bar */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: 4,
                          bottom: 0,
                          borderTopLeftRadius: '12px',
                          borderBottomLeftRadius: '12px',
                          backgroundColor: item.category === 'Financial' ? '#4285f4' :
                            item.category === 'Regulatory' ? '#f5a623' :
                            item.category === 'Technology' ? '#5436DA' :
                            item.category === 'Markets' ? '#d93025' :
                            '#34a853'
                        }}
                      />

                      {/* News Content */}
                      <Box sx={{ pl: 0.5 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            color: '#202124',
                            mb: 1,
                            lineHeight: 1.3
                          }}
                        >
                          {item.title}
                        </Typography>
                        
                        {item.sentiment && (
                          <Chip
                            label={item.sentiment.charAt(0).toUpperCase() + item.sentiment.slice(1)}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              backgroundColor: getSentimentColor(item.sentiment).bg,
                              color: getSentimentColor(item.sentiment).text,
                              borderRadius: '3px',
                              mb: 1,
                              '& .MuiChip-label': {
                                px: 1
                              }
                            }}
                          />
                        )}
                        
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: expandedNewsId === item.id ? 2 : 0,
                            flexWrap: 'wrap'
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{ 
                              color: '#5f6368',
                              fontSize: '0.75rem',
                              fontWeight: 500
                            }}
                          >
                            {item.source}
                          </Typography>
                          
                          <Box
                            sx={{
                              width: 4,
                              height: 4,
                              borderRadius: '50%',
                              backgroundColor: '#dadce0'
                            }}
                          />
                          
                          <Typography
                            variant="caption"
                            sx={{ 
                              color: '#5f6368',
                              fontSize: '0.75rem'
                            }}
                          >
                            {item.timestamp}
                          </Typography>
                          
                          {item.importance && item.importance > 7 && (
                            <>
                              <Box
                                sx={{
                                  width: 4,
                                  height: 4,
                                  borderRadius: '50%',
                                  backgroundColor: '#dadce0'
                                }}
                              />
                              
                              <Tooltip title="High importance" arrow>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#d93025" stroke="none">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                  </svg>
                                  <Typography
                                    variant="caption"
                                    sx={{ 
                                      color: '#d93025',
                                      fontSize: '0.7rem',
                                      fontWeight: 600,
                                      ml: 0.5
                                    }}
                                  >
                                    {item.importance}/10
                                  </Typography>
                                </Box>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                        
                        {/* Expanded Content */}
                        <AnimatePresence>
                          {expandedNewsId === item.id && item.content && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  color: '#202124',
                                  fontSize: '0.85rem',
                                  lineHeight: 1.5,
                                  my: 2
                                }}
                              >
                                {item.content}
                              </Typography>
                              
                              {/* Image */}
                              {item.imageUrl && (
                                <Box
                                  sx={{
                                    width: '100%',
                                    height: 150,
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    mb: 2
                                  }}
                                >
                                  <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover'
                                    }}
                                  />
                                </Box>
                              )}
                              
                              {/* Tags */}
                              {item.relatedTags && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                                  {item.relatedTags.map((tag, index) => (
                                    <Chip
                                      key={index}
                                      label={tag}
                                      size="small"
                                      sx={{
                                        height: 24,
                                        fontSize: '0.7rem',
                                        backgroundColor: alpha('#5436DA', 0.08),
                                        color: '#5436DA',
                                        borderRadius: '4px',
                                        '& .MuiChip-label': {
                                          px: 1
                                        }
                                      }}
                                    />
                                  ))}
                                </Box>
                              )}
                              
                              {/* Source Link */}
                              {item.url && (
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    mt: 2,
                                    p: 1.5,
                                    borderRadius: '8px',
                                    backgroundColor: alpha('#5436DA', 0.04),
                                    cursor: 'pointer',
                                    '&:hover': {
                                      backgroundColor: alpha('#5436DA', 0.08)
                                    }
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(item.url, '_blank');
                                  }}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5436DA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                    <polyline points="15 3 21 3 21 9"></polyline>
                                    <line x1="10" y1="14" x2="21" y2="3"></line>
                                  </svg>
                                  <Typography
                                    variant="caption"
                                    sx={{ 
                                      color: '#5436DA',
                                      fontSize: '0.8rem',
                                      fontWeight: 500,
                                      ml: 1
                                    }}
                                  >
                                    Read full article on {item.source}
                                  </Typography>
                                </Box>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </Box>
            )}
            
            {/* Search Tab */}
            {activeTab === 'search' && (
              <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Search Input */}
                <Box sx={{ p: 2 }}>
                  <form onSubmit={handleSearch}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '8px',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        backgroundColor: alpha('#5436DA', 0.02),
                        '&:focus-within': {
                          border: '1px solid #5436DA',
                          boxShadow: `0 0 0 2px ${alpha('#5436DA', 0.2)}`
                        }
                      }}
                    >
                      <IconButton 
                        type="submit" 
                        sx={{ p: 1, color: isSearching ? '#5436DA' : '#606368' }}
                        disabled={isSearching}
                      >
                        {isSearching ? (
                          <motion.div
                            animate={{ 
                              rotate: 360 
                            }}
                            transition={{ 
                              repeat: Infinity, 
                              duration: 1.5, 
                              ease: "linear" 
                            }}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                            </svg>
                          </motion.div>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                          </svg>
                        )}
                      </IconButton>
                      <InputBase
                        placeholder="Search financial insights..."
                        inputRef={searchInputRef}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        fullWidth
                        sx={{
                          ml: 1,
                          flex: 1,
                          fontSize: '0.95rem',
                          '& .MuiInputBase-input': {
                            p: 1,
                          }
                        }}
                        disabled={isSearching}
                      />
                      {searchQuery && (
                        <IconButton
                          onClick={() => setSearchQuery('')}
                          edge="end"
                          sx={{ p: 1, color: '#606368' }}
                          disabled={isSearching}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </IconButton>
                      )}
                    </Paper>
                  </form>
                </Box>
                
                {/* Recent searches */}
                <Box sx={{ px: 2, pb: 3 }}>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      mb: 1.5, 
                      ml: 1,
                      fontSize: '0.8rem', 
                      fontWeight: 600, 
                      color: '#5f6368',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                      <polyline points="12 8 12 12 14 14"></polyline>
                      <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5"></path>
                    </svg>
                    Recent Searches
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {recentSearches.map((search, index) => (
                      <Paper
                        key={index}
                        elevation={0}
                        sx={{
                          py: 1.5,
                          px: 2,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'background-color 0.2s ease',
                          '&:hover': {
                            backgroundColor: alpha('#5436DA', 0.05)
                          }
                        }}
                        onClick={() => {
                          setSearchQuery(search);
                          if (searchInputRef.current) {
                            searchInputRef.current.focus();
                          }
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#606368" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="12 8 12 12 14 14"></polyline>
                          <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5"></path>
                        </svg>
                        <Typography
                          variant="body2"
                          sx={{
                            ml: 1.5,
                            color: '#202124',
                            fontSize: '0.9rem',
                            fontWeight: 500
                          }}
                        >
                          {search}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                </Box>
                
                {/* Search suggestions */}
                <Box sx={{ px: 2, pb: 2, mt: 'auto' }}>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      mb: 1.5, 
                      ml: 1,
                      fontSize: '0.8rem', 
                      fontWeight: 600, 
                      color: '#5f6368',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    Suggested Topics
                  </Typography>
                  
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1
                    }}
                  >
                    {['Vietnam tariffs', 'APAC market growth', 'Financial regulations 2025', 'ESG banking trends', 'SCB performance'].map((topic, index) => (
                      <Chip
                        key={index}
                        label={topic}
                        onClick={() => {
                          setSearchQuery(topic);
                          if (searchInputRef.current) {
                            searchInputRef.current.focus();
                          }
                        }}
                        sx={{
                          height: 32,
                          borderRadius: '8px',
                          backgroundColor: alpha('#5436DA', 0.08),
                          color: '#5436DA',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          '&:hover': {
                            backgroundColor: alpha('#5436DA', 0.15)
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
                
                {/* Perplexity info section */}
                <Box
                  sx={{
                    mt: 'auto',
                    p: 3,
                    backgroundColor: alpha('#5436DA', 0.03),
                    borderTop: '1px solid rgba(0, 0, 0, 0.08)'
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      mb: 1.5
                    }}
                  >
                    <Avatar 
                      src="/assets/perplexity.png"
                      sx={{ 
                        width: 28, 
                        height: 28,
                        backgroundColor: '#5436DA'
                      }}
                    />
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        color: '#5436DA',
                        fontSize: '0.9rem'
                      }}
                    >
                      Perplexity Pro
                    </Typography>
                  </Box>
                  
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#5f6368',
                      fontSize: '0.8rem',
                      lineHeight: 1.5
                    }}
                  >
                    Powered by advanced AI with real-time data access and source citations. Your financial research assistant.
                  </Typography>
                </Box>
              </Box>
            )}
            
            {/* Alerts Tab */}
            {activeTab === 'alerts' && (
              <Box sx={{ height: '100%', overflow: 'auto', px: 2, py: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontSize: '0.9rem', 
                      fontWeight: 600, 
                      color: '#202124',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', color: '#d93025' }}>
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    Active Alerts
                  </Typography>
                  
                  <Box>
                    <Chip
                      label="Configure"
                      size="small"
                      onClick={() => {}}
                      sx={{
                        height: 24,
                        fontSize: '0.7rem',
                        backgroundColor: alpha('#5436DA', 0.08),
                        color: '#5436DA',
                        '& .MuiChip-label': {
                          px: 1
                        }
                      }}
                    />
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {alertItems.slice(0, showAllAlerts ? alertItems.length : 2).map((alert) => (
                    <Paper
                      key={alert.id}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: '10px',
                        border: `1px solid ${getAlertSeverityColor(alert.severity).border}`,
                        borderLeftWidth: '4px',
                        transition: 'all 0.15s ease',
                        cursor: 'pointer',
                        backgroundColor: alpha(getAlertSeverityColor(alert.severity).border, 0.05),
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': {
                          boxShadow: `0 2px 8px ${alpha(getAlertSeverityColor(alert.severity).border, 0.2)}`,
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: '50%',
                            backgroundColor: alpha(getAlertSeverityColor(alert.severity).border, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: getAlertSeverityColor(alert.severity).text,
                            mr: 2
                          }}
                        >
                          {getAlertTypeIcon(alert.type)}
                        </Box>
                        
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                color: getAlertSeverityColor(alert.severity).text,
                                lineHeight: 1.3
                              }}
                            >
                              {alert.title}
                            </Typography>
                            
                            <Chip
                              label={alert.severity.toUpperCase()}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                backgroundColor: getAlertSeverityColor(alert.severity).bg,
                                color: getAlertSeverityColor(alert.severity).text,
                                borderRadius: '3px',
                                '& .MuiChip-label': {
                                  px: 1
                                }
                              }}
                            />
                          </Box>
                          
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: '0.85rem',
                              color: '#202124',
                              mb: 1.5
                            }}
                          >
                            {alert.description}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography
                              variant="caption"
                              sx={{
                                color: '#5f6368',
                                fontSize: '0.75rem'
                              }}
                            >
                              {alert.timestamp}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton
                                size="small"
                                sx={{
                                  p: 0.5,
                                  color: '#5f6368',
                                  '&:hover': {
                                    backgroundColor: alpha('#5436DA', 0.1),
                                    color: '#5436DA'
                                  }
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                                </svg>
                              </IconButton>
                              
                              <IconButton
                                size="small"
                                sx={{
                                  p: 0.5,
                                  color: '#5f6368',
                                  '&:hover': {
                                    backgroundColor: alpha('#d93025', 0.1),
                                    color: '#d93025'
                                  }
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                              </IconButton>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
                
                {alertItems.length > 2 && (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      mt: 2
                    }}
                  >
                    <Button
                      onClick={() => setShowAllAlerts(!showAllAlerts)}
                      sx={{
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        color: '#5436DA',
                        textTransform: 'none',
                        '&:hover': {
                          backgroundColor: alpha('#5436DA', 0.05)
                        }
                      }}
                    >
                      {showAllAlerts ? 'Show Less' : `Show All (${alertItems.length})`}
                    </Button>
                  </Box>
                )}
                
                {/* Alert Settings */}
                <Box
                  sx={{
                    mt: 4,
                    p: 2,
                    borderRadius: '10px',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    backgroundColor: alpha('#5436DA', 0.02)
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#202124',
                      mb: 1.5,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5436DA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                    Alert Preferences
                  </Typography>
                  
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.8rem',
                      color: '#5f6368',
                      mb: 2
                    }}
                  >
                    Set up your notification preferences for different alert types
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {['Configure Alerts', 'Notification Settings', 'Alert History'].map((option, index) => (
                      <Chip
                        key={index}
                        label={option}
                        clickable
                        sx={{
                          height: 32,
                          borderRadius: '16px',
                          backgroundColor: '#5436DA',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          '&:hover': {
                            backgroundColor: '#4429B8'
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Box>
            )}
          </motion.div>
        </AnimatePresence>
      </Box>
      
      {/* Perplexity Badge */}
      <Box
        sx={{
          position: 'absolute',
          width: 120,
          height: 24,
          bottom: 18,
          right: -48,
          transform: 'rotate(-90deg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#5436DA',
          color: 'white',
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
          borderTopLeftRadius: '4px',
          borderTopRightRadius: '4px',
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.15)',
          zIndex: 1
        }}
      >
        PERPLEXITY AI
      </Box>
    </Box>
  );
};

// Helper Button component
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  sx?: Record<string, any>;
}

const Button: React.FC<ButtonProps> = ({ children, onClick, sx }) => {
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 1,
        borderRadius: '8px',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
        ...sx
      }}
    >
      {children}
    </Box>
  );
};

export default EnhancedPerplexityPanel;