import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import JouleAssistant with SSR disabled
const JouleAssistant = dynamic(
  () => import('./JouleAssistant'),
  { ssr: false }
);

interface JouleAssistantWrapperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialNewsItem?: {
    title: string;
    summary: string;
    category: string;
    source: string;
  };
}

const JouleAssistantWrapper: React.FC<JouleAssistantWrapperProps> = (props) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // Return null on server-side
  }

  return <JouleAssistant {...props} />;
};

export default JouleAssistantWrapper;