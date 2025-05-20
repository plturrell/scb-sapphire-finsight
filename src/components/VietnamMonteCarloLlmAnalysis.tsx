import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Box, 
  Divider, 
  Chip, 
  useTheme,
  useMediaQuery,
  CardHeader,
  IconButton,
  Collapse 
} from '@mui/material';
import { Brain, FileText, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useResponsive } from '../hooks/useResponsive';
import { useHaptic } from '../hooks/useMicroInteractions';
import TouchButton from './TouchButton';

export interface LlmAnalysisResult {
  summary: string;
  confidence: number;
  keyFindings: Array<{
    finding: string;
    confidence: number;
    impact: string;
  }>;
  recommendations: string[];
}

// Type alias for backward compatibility
type LlmAnalysis = LlmAnalysisResult;

interface VietnamMonteCarloLlmAnalysisProps {
  analysis: LlmAnalysis | null;
  onGenerateReport: () => void;
  onViewDetailedAnalysis: () => void;
}

export const VietnamMonteCarloLlmAnalysis: React.FC<VietnamMonteCarloLlmAnalysisProps> = ({
  analysis,
  onGenerateReport,
  onViewDetailedAnalysis,
}) => {
  // Get device capabilities
  const { isMobile, isTablet } = useResponsive();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const haptic = useHaptic();
  
  // Mobile-specific state
  const [expanded, setExpanded] = useState(!isSmallScreen);
  const [expandedFindings, setExpandedFindings] = useState<number[]>([]);
  
  // Toggle expanded state for mobile view
  const toggleExpanded = () => {
    setExpanded(!expanded);
    if (isMobile) {
      haptic({ intensity: 'medium' });
    }
  };
  
  // Toggle individual finding expanded state
  const toggleFindingExpanded = (index: number) => {
    if (expandedFindings.includes(index)) {
      setExpandedFindings(expandedFindings.filter(i => i !== index));
    } else {
      setExpandedFindings([...expandedFindings, index]);
    }
    
    if (isMobile) {
      haptic({ intensity: 'light' });
    }
  };
  if (!analysis) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            No analysis available. Run simulation to generate analysis.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant={isSmallScreen ? 'subtitle1' : 'h6'} component="div">
              <Brain size={isSmallScreen ? 14 : 18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              AI-Enhanced Analysis
            </Typography>
            {isSmallScreen && (
              <IconButton size="small" onClick={toggleExpanded}>
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </IconButton>
            )}
          </Box>
        }
        sx={{ 
          p: isSmallScreen ? 1.5 : 2,
          bgcolor: theme.palette.background.paper
        }}
      />
      <Collapse in={expanded} timeout="auto" unmountOnExit={false}>
        <CardContent sx={{ p: isSmallScreen ? 1.5 : 2 }}>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Summary
          </Typography>
          <Typography variant="body1" paragraph>
            {analysis.summary}
          </Typography>
          <Chip 
            label={`Confidence: ${(analysis.confidence * 100).toFixed(0)}%`}
            color="primary"
            size="small"
          />
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Key Findings
          </Typography>
          {analysis.keyFindings.map((finding, index) => (
            <Box 
              key={index} 
              sx={{ 
                mb: 2, 
                p: 1, 
                borderRadius: 1,
                backgroundColor: theme.palette.background.default,
                transition: 'all 0.2s ease',
                cursor: isSmallScreen ? 'pointer' : 'default'
              }}
              onClick={isSmallScreen ? () => toggleFindingExpanded(index) : undefined}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                <AlertCircle size={14} style={{ marginTop: 4 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: isSmallScreen && !expandedFindings.includes(index) ? 'bold' : 'normal',
                      overflow: isSmallScreen && !expandedFindings.includes(index) ? 'hidden' : 'visible',
                      textOverflow: isSmallScreen && !expandedFindings.includes(index) ? 'ellipsis' : 'clip',
                      whiteSpace: isSmallScreen && !expandedFindings.includes(index) ? 'nowrap' : 'normal'
                    }}
                  >
                    {finding.finding}
                  </Typography>
                </Box>
                {isSmallScreen && (
                  <IconButton 
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFindingExpanded(index);
                    }}
                  >
                    {expandedFindings.includes(index) ? 
                      <ChevronUp size={14} /> : 
                      <ChevronDown size={14} />
                    }
                  </IconButton>
                )}
              </Box>
              <Collapse in={!isSmallScreen || expandedFindings.includes(index)}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip 
                    label={`Confidence: ${(finding.confidence * 100).toFixed(0)}%`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip 
                    label={`Impact: ${finding.impact}`}
                    size="small"
                    color={
                      finding.impact === 'High' ? 'error' : 
                      finding.impact === 'Medium' ? 'warning' : 
                      'success'
                    }
                    variant="outlined"
                  />
                </Box>
              </Collapse>
            </Box>
          ))}
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Recommendations
          </Typography>
          <Box sx={{ bgcolor: theme.palette.background.default, p: 1.5, borderRadius: 1 }}>
            <ul style={{ margin: 0, paddingLeft: isSmallScreen ? 16 : 20 }}>
              {analysis.recommendations.map((recommendation, index) => (
                <li key={index} style={{ marginBottom: 8 }}>
                  <Typography variant="body2">{recommendation}</Typography>
                </li>
              ))}
            </ul>
          </Box>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          gap: isSmallScreen ? 1 : 2, 
          mt: 3,
          flexDirection: isSmallScreen ? 'column' : 'row'
        }}>
          {isSmallScreen ? (
            <>
              <TouchButton
                fullWidth
                variant="secondary"
                leftIcon={<FileText size={16} />}
                onClick={onGenerateReport}
              >
                Generate Report
              </TouchButton>
              <TouchButton
                fullWidth
                variant="primary"
                onClick={onViewDetailedAnalysis}
              >
                View Detailed Analysis
              </TouchButton>
            </>
          ) : (
            <>
              <Button 
                variant="outlined" 
                startIcon={<FileText size={16} />}
                onClick={onGenerateReport}
              >
                Generate Report
              </Button>
              <Button 
                variant="contained"
                onClick={onViewDetailedAnalysis}
              >
                View Detailed Analysis
              </Button>
            </>
          )}
        </Box>
      </CardContent>
      </Collapse>
      
      {/* Mobile collapsed view summary */}
      {isSmallScreen && !expanded && (
        <CardContent sx={{ p: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Brain size={14} style={{ marginRight: 6, color: theme.palette.primary.main }} />
            <Typography 
              variant="caption" 
              color="primary" 
              sx={{ fontWeight: 'medium', letterSpacing: '0.02em' }}
            >
              Key insights
            </Typography>
          </Box>
          {analysis.keyFindings.length > 0 && (
            <Box 
              sx={{ 
                bgcolor: theme.palette.background.default, 
                p: 1.5, 
                borderRadius: 1,
                borderLeft: `3px solid ${
                  analysis.keyFindings[0].impact === 'High' ? theme.palette.error.main : 
                  analysis.keyFindings[0].impact === 'Medium' ? theme.palette.warning.main : 
                  theme.palette.success.main
                }`,
                mt: 1
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 'medium', display: 'flex', alignItems: 'flex-start' }}>
                <AlertCircle size={14} style={{ marginRight: 8, marginTop: 2, flexShrink: 0 }} />
                <span>
                  {analysis.keyFindings[0].finding.length > 60 
                    ? `${analysis.keyFindings[0].finding.substring(0, 60)}...` 
                    : analysis.keyFindings[0].finding}
                </span>
              </Typography>
            </Box>
          )}
          <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'center' }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: theme.palette.text.secondary,
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' }
              }}
              onClick={toggleExpanded}
            >
              Show Full Analysis
              <ChevronDown size={14} style={{ marginLeft: 4 }} />
            </Typography>
          </Box>
        </CardContent>
      )}
    </Card>
  );
};

export default VietnamMonteCarloLlmAnalysis;