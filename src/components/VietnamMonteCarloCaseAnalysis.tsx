import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Tooltip,
  IconButton,
  Divider
} from '@mui/material';
import { Info } from 'lucide-react';

interface CaseAnalysisProps {
  data: number[] | null;
  metricName?: string;
  metricUnit?: string;
  caseBoundaries?: {
    pessimistic: [number, number]; // percentiles [0-100]
    realistic: [number, number];
    optimistic: [number, number];
  };
}

// Default case boundaries if not provided
const defaultCaseBoundaries = {
  pessimistic: [0, 5],
  realistic: [5, 95],
  optimistic: [95, 100]
};

// SCB color scheme as defined in the spec
const colors = {
  pessimistic: '#d60542', // red
  realistic: '#3267d4',   // medium blue
  optimistic: '#31ddc1',  // light blue/teal
  primaryBlue: '#042278', // primary brand color
};

/**
 * Vietnam Monte Carlo Case Analysis
 * Displays pessimistic, realistic, and optimistic case analyses based on simulation results
 */
export const VietnamMonteCarloCaseAnalysis: React.FC<CaseAnalysisProps> = ({
  data,
  metricName = 'Revenue Impact',
  metricUnit = '$M',
  caseBoundaries = defaultCaseBoundaries
}) => {
  // Format numbers for display
  const formatNumber = (num: number): string => {
    if (Math.abs(num) >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(1)}M`;
    } else if (Math.abs(num) >= 1_000) {
      return `${(num / 1_000).toFixed(1)}K`;
    } else {
      return num.toFixed(2);
    }
  };

  // Format currency values
  const formatCurrency = (num: number): string => {
    if (metricUnit === '$M') {
      return `$${formatNumber(num)}`;
    } else if (metricUnit === '$K') {
      return `$${formatNumber(num * 1000)}`;
    } else {
      return `${formatNumber(num)}${metricUnit}`;
    }
  };

  // Calculate case statistics from data
  const calculateCaseStats = (data: number[] | null) => {
    if (!data || data.length === 0) {
      return {
        pessimistic: { range: [0, 0], mean: 0, probability: 0, interpretation: '' },
        realistic: { range: [0, 0], mean: 0, probability: 0, interpretation: '' },
        optimistic: { range: [0, 0], mean: 0, probability: 0, interpretation: '' }
      };
    }

    const sortedData = [...data].sort((a, b) => a - b);
    
    // Helper to get value at percentile
    const getPercentileValue = (percentile: number) => {
      const index = Math.floor((percentile / 100) * sortedData.length);
      return sortedData[Math.min(index, sortedData.length - 1)];
    };

    // Calculate ranges based on percentiles
    const pessimisticRange = [
      getPercentileValue(caseBoundaries.pessimistic[0]),
      getPercentileValue(caseBoundaries.pessimistic[1])
    ];
    
    const realisticRange = [
      getPercentileValue(caseBoundaries.realistic[0]),
      getPercentileValue(caseBoundaries.realistic[1])
    ];
    
    const optimisticRange = [
      getPercentileValue(caseBoundaries.optimistic[0]),
      getPercentileValue(caseBoundaries.optimistic[1])
    ];

    // Calculate mean values for each case
    const calculateMean = (min: number, max: number) => {
      const values = sortedData.filter(v => v >= min && v <= max);
      if (values.length === 0) return 0;
      const sum = values.reduce((acc, val) => acc + val, 0);
      return sum / values.length;
    };

    const pessimisticMean = calculateMean(pessimisticRange[0], pessimisticRange[1]);
    const realisticMean = calculateMean(realisticRange[0], realisticRange[1]);
    const optimisticMean = calculateMean(optimisticRange[0], optimisticRange[1]);

    // Calculate probabilities (percentages)
    const pessimisticProb = caseBoundaries.pessimistic[1] - caseBoundaries.pessimistic[0];
    const realisticProb = caseBoundaries.realistic[1] - caseBoundaries.realistic[0];
    const optimisticProb = caseBoundaries.optimistic[1] - caseBoundaries.optimistic[0];

    // Generate interpretations based on mean values
    const generateInterpretation = (mean: number, type: 'pessimistic' | 'realistic' | 'optimistic') => {
      if (type === 'pessimistic') {
        if (mean < 0) return 'High risk of significant loss';
        return 'Limited downside risk';
      } else if (type === 'realistic') {
        if (mean < 0) return 'Likely negative outcome with moderate losses';
        if (mean > 0 && mean < pessimisticRange[1] * 2) return 'Modest positive outcome expected';
        return 'Strongly positive expected outcome';
      } else {
        if (mean < optimisticRange[0] * 1.5) return 'Moderate upside potential';
        return 'Exceptional upside potential';
      }
    };

    return {
      pessimistic: {
        range: pessimisticRange,
        mean: pessimisticMean,
        probability: pessimisticProb,
        interpretation: generateInterpretation(pessimisticMean, 'pessimistic')
      },
      realistic: {
        range: realisticRange,
        mean: realisticMean,
        probability: realisticProb,
        interpretation: generateInterpretation(realisticMean, 'realistic')
      },
      optimistic: {
        range: optimisticRange,
        mean: optimisticMean,
        probability: optimisticProb,
        interpretation: generateInterpretation(optimisticMean, 'optimistic')
      }
    };
  };

  const caseStats = calculateCaseStats(data);

  // Generate case analysis box
  const CaseBox = ({ 
    type, 
    color, 
    title, 
    caseData 
  }: { 
    type: 'pessimistic' | 'realistic' | 'optimistic';
    color: string; 
    title: string; 
    caseData: any;
  }) => {
    return (
      <Card 
        elevation={2} 
        sx={{ 
          height: '100%',
          border: `1px solid ${color}`,
          borderTop: `4px solid ${color}`,
          borderRadius: '4px',
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: 3
          }
        }}
      >
        <CardHeader
          title={title}
          subheader={`${type === 'pessimistic' ? 'Bottom' : type === 'optimistic' ? 'Top' : 'Middle'} ${caseData.probability}%`}
          titleTypographyProps={{ variant: 'h6', sx: { color } }}
          subheaderTypographyProps={{ variant: 'caption' }}
          sx={{ pb: 0 }}
        />
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Range:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {formatCurrency(caseData.range[0])} to {formatCurrency(caseData.range[1])}
            </Typography>
          </Box>

          <Divider sx={{ my: 1 }} />

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Probability:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {caseData.probability}%
            </Typography>
          </Box>

          <Divider sx={{ my: 1 }} />

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Mean:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {formatCurrency(caseData.mean)}
            </Typography>
          </Box>

          <Divider sx={{ my: 1 }} />

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Interpretation:
            </Typography>
            <Typography variant="body2">
              {caseData.interpretation}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card elevation={2} sx={{ mb: 3 }}>
      <CardHeader
        title="Case Analysis"
        action={
          <Tooltip title="Analysis of pessimistic, realistic, and optimistic cases based on simulation results">
            <IconButton size="small">
              <Info />
            </IconButton>
          </Tooltip>
        }
        sx={{ 
          bgcolor: colors.primaryBlue, 
          color: 'white',
          '& .MuiCardHeader-action': { color: 'white' }
        }}
      />
      <CardContent>
        {data && data.length > 0 ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <CaseBox
                type="pessimistic"
                color={colors.pessimistic}
                title="Pessimistic"
                caseData={caseStats.pessimistic}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <CaseBox
                type="realistic"
                color={colors.realistic}
                title="Realistic"
                caseData={caseStats.realistic}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <CaseBox
                type="optimistic"
                color={colors.optimistic}
                title="Optimistic"
                caseData={caseStats.optimistic}
              />
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1">
              Run the simulation to see case analysis
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default VietnamMonteCarloCaseAnalysis;
