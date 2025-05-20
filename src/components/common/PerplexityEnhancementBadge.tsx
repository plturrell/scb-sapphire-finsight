import React from 'react';
import { Chip, Tooltip, Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled components following SAP Fiori Horizon design principles
const EnhancementBadge = styled(Chip)(({ theme }) => ({
  height: '22px',
  fontSize: '0.75rem',
  fontWeight: 600,
  marginLeft: theme.spacing(1),
  background: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
  color: '#ffffff',
  border: 'none',
  '&:hover': {
    background: 'linear-gradient(135deg, #00b8ff 0%, #0066e8 100%)',
  },
  '& .MuiChip-label': {
    padding: '0 10px',
  },
  verticalAlign: 'middle',
}));

const PerplexityLogo = styled('span')({
  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  fontWeight: 700,
  fontSize: '10px',
  marginRight: '4px',
  letterSpacing: '-0.5px',
});

const TooltipContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  maxWidth: '300px',
}));

interface PerplexityEnhancementBadgeProps {
  confidenceScore?: number;
  showDetails?: boolean;
  size?: 'small' | 'medium';
}

/**
 * PerplexityEnhancementBadge displays an indicator that Perplexity AI
 * has enhanced this component's analysis
 */
const PerplexityEnhancementBadge: React.FC<PerplexityEnhancementBadgeProps> = ({
  confidenceScore = 0.93,
  showDetails = false,
  size = 'small'
}) => {
  // Format confidence score as percentage with 0 decimal places
  const formattedScore = `${Math.round(confidenceScore * 100)}%`;
  
  return (
    <Tooltip
      title={
        <TooltipContent>
          <Typography variant="subtitle2" component="div" gutterBottom>
            Enhanced by Perplexity AI
          </Typography>
          <Typography variant="body2" component="div">
            This visualization has been enhanced with domain-specific insights from Perplexity AI,
            improving the accuracy and interpretability of the Monte Carlo simulation.
          </Typography>
          {showDetails && (
            <>
              <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                <strong>Confidence Score:</strong> {formattedScore}
              </Typography>
              <Typography variant="body2" component="div">
                <strong>Enhanced Features:</strong> Node values, path prediction, optimal strategy
              </Typography>
            </>
          )}
        </TooltipContent>
      }
      arrow
    >
      <EnhancementBadge
        label={
          <>
            <PerplexityLogo>℗</PerplexityLogo>
            Perplexity Enhanced
          </>
        }
        size="small"
        tabIndex={0}
        role="status"
        aria-label="Enhanced by Perplexity AI"
      />
    </Tooltip>
  );
};

export default PerplexityEnhancementBadge;
