import React from 'react';
import { Card, CardContent, Typography, Button, Box, Divider, Chip } from '@mui/material';
import { Brain, FileText, AlertCircle } from 'lucide-react';

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
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <Brain size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          AI-Enhanced Analysis
        </Typography>
        
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
            <Box key={index} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AlertCircle size={14} />
                <Typography variant="body2">{finding.finding}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
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
            </Box>
          ))}
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Recommendations
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {analysis.recommendations.map((recommendation, index) => (
              <li key={index}>
                <Typography variant="body2">{recommendation}</Typography>
              </li>
            ))}
          </ul>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
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
        </Box>
      </CardContent>
    </Card>
  );
};

export default VietnamMonteCarloLlmAnalysis;