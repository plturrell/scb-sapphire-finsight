import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import useDeviceCapabilities from '@/hooks/useDeviceCapabilities';

// Dynamically import EnhancedJouleAssistant with SSR disabled
const EnhancedJouleAssistant = dynamic(
  () => import('./EnhancedJouleAssistant'),
  { ssr: false }
);

interface EnhancedJouleAssistantWrapperProps {
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

/**
 * Enhanced JouleAssistant Wrapper Component with SCB Beautiful UI styling
 * Provides a client-side wrapper for the Joule Assistant with theme support
 */
const EnhancedJouleAssistantWrapper: React.FC<EnhancedJouleAssistantWrapperProps> = (props) => {
  const [isMounted, setIsMounted] = useState(false);
  const { prefersColorScheme } = useDeviceCapabilities();

  // Determine effective theme based on props or system preference
  const theme = props.theme || prefersColorScheme || 'light';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // Return null on server-side
  }

  return <EnhancedJouleAssistant {...props} theme={theme} />;
};

export default EnhancedJouleAssistantWrapper;