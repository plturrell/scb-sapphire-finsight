import React from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Link, 
  Chip,
  Stack,
  Tooltip
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PerplexityEnhancementBadge from './PerplexityEnhancementBadge';

// Define types for the component
interface ModelSource {
  name: string;
  url: string;
  accessDate?: string;
}

interface ModelCitationPanelProps {
  modelName: string;
  version: string;
  lastUpdated: string;
  sources: ModelSource[];
  confidence?: number;
  additionalInfo?: string;
}

/**
 * ModelCitationPanel provides transparent documentation for economic and simulation models
 * used in the SCB Sapphire platform, following SAP Fiori Horizon design principles.
 */
const ModelCitationPanel: React.FC<ModelCitationPanelProps> = ({
  modelName,
  version,
  lastUpdated,
  sources,
  confidence = 0.85,
  additionalInfo
}) => {
  const formattedDate = new Date(lastUpdated).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Box display="flex" alignItems="center" mb={1}>
              <Typography variant="subtitle1" fontWeight="medium" mr={1}>
                {modelName}
              </Typography>
              <PerplexityEnhancementBadge size="small" />
              <Chip 
                size="small" 
                label={`v${version}`} 
                color="primary" 
                variant="outlined" 
                sx={{ ml: 1 }}
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              Last updated: {formattedDate}
            </Typography>
            
            {additionalInfo && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {additionalInfo}
              </Typography>
            )}
          </Box>
          
          <Tooltip title={`${(confidence * 100).toFixed(0)}% confidence level based on historical data`}>
            <Box display="flex" alignItems="center">
              <Chip 
                icon={<InfoOutlinedIcon fontSize="small" />}
                label={`${(confidence * 100).toFixed(0)}% confidence`}
                color={confidence > 0.9 ? "success" : confidence > 0.7 ? "primary" : "warning"}
                size="small"
              />
            </Box>
          </Tooltip>
        </Box>
        
        <Typography variant="caption" fontWeight="medium" sx={{ display: 'block', mt: 2, mb: 0.5 }}>
          Data Sources:
        </Typography>
        
        <Stack direction="column" spacing={0.5}>
          {sources.map((source, index) => (
            <Box key={index} display="flex" alignItems="center" sx={{ fontSize: '0.8rem' }}>
              <Typography variant="caption" sx={{ mr: 1 }}>•</Typography>
              <Link 
                href={source.url} 
                target="_blank" 
                rel="noopener noreferrer"
                underline="hover"
                sx={{ fontSize: '0.8rem' }}
              >
                {source.name}
              </Link>
              {source.accessDate && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  (Accessed: {new Date(source.accessDate).toLocaleDateString()})
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
        
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, fontSize: '0.7rem' }}>
          This model follows SCB's AI transparency standards and adheres to SAP Fiori Horizon design principles. Documentation is available to authorized users.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ModelCitationPanel;
