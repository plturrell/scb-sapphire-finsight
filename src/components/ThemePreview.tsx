import React from 'react';
import { Box, VStack, HStack, Text, Badge, useColorModeValue } from '@chakra-ui/react';

type ThemePreviewProps = {
  theme: 'light' | 'dark' | 'system';
  isDarkMode: boolean;
  onSelect?: (theme: 'light' | 'dark' | 'system') => void;
};

const ThemePreview: React.FC<ThemePreviewProps> = ({ theme, isDarkMode, onSelect }) => {
  const isSelected = (mode: string) => 
    (mode === 'system' && theme === 'system') ||
    (mode === 'light' && theme === 'light') ||
    (mode === 'dark' && theme === 'dark');

  const getThemeBg = (mode: 'light' | 'dark') => 
    mode === 'dark' ? 'gray.800' : 'gray.50';
  
  const getThemeText = (mode: 'light' | 'dark') => 
    mode === 'dark' ? 'whiteAlpha.900' : 'gray.900';
  
  const getThemeMuted = (mode: 'light' | 'dark') => 
    mode === 'dark' ? 'whiteAlpha.600' : 'gray.600';
  
  const getThemeBorder = (mode: 'light' | 'dark') => 
    mode === 'dark' ? 'whiteAlpha.200' : 'gray.200';
  
  const getThemeCard = (mode: 'light' | 'dark') => 
    mode === 'dark' ? 'gray.700' : 'white';

  const renderPreview = (mode: 'light' | 'dark', label: string) => {
    const isActive = 
      (mode === 'light' && (theme === 'light' || (theme === 'system' && !isDarkMode))) ||
      (mode === 'dark' && (theme === 'dark' || (theme === 'system' && isDarkMode)));

    return (
      <VStack
        spacing={3}
        p={4}
        bg={getThemeCard(mode)}
        borderRadius="lg"
        borderWidth="1px"
        borderColor={isActive ? 'primary.500' : getThemeBorder(mode)}
        boxShadow={isActive ? '0 0 0 2px var(--chakra-colors-primary-500)' : 'none'}
        transition="all 0.2s"
        cursor="pointer"
        onClick={() => onSelect?.(mode === 'light' ? 'light' : 'dark')}
        flex={1}
        minH="180px"
        position="relative"
        overflow="hidden"
      >
        <HStack w="full" justify="space-between">
          <Text
            fontSize="sm"
            fontWeight="medium"
            color={getThemeText(mode)}
          >
            {label} {mode === 'dark' ? '🌙' : '☀️'}
          </Text>
          {isActive && (
            <Badge colorScheme="primary" fontSize="xs">
              Active
            </Badge>
          )}
        </HStack>
        
        <VStack 
          align="start" 
          spacing={2} 
          w="full"
          bg={getThemeBg(mode)}
          p={3}
          borderRadius="md"
          borderWidth="1px"
          borderColor={getThemeBorder(mode)}
        >
          <Box
            h="8px"
            w="60%"
            bg={mode === 'dark' ? 'primary.400' : 'primary.500'}
            borderRadius="full"
          />
          <Box
            h="8px"
            w="40%"
            bg={getThemeMuted(mode)}
            borderRadius="full"
            opacity={0.8}
          />
          <HStack spacing={2} mt={2} w="full">
            <Box
              flex={1}
              h="24px"
              bg={getThemeCard(mode)}
              borderRadius="sm"
              borderWidth="1px"
              borderColor={getThemeBorder(mode)}
            />
            <Box
              flex={1}
              h="24px"
              bg={mode === 'dark' ? 'green.500' : 'green.400'}
              borderRadius="sm"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="xs" color="white">Button</Text>
            </Box>
          </HStack>
        </VStack>
        
        {isActive && (
          <Box
            position="absolute"
            top={0}
            right={0}
            w={0}
            h={0}
            borderStyle="solid"
            borderWidth="0 32px 32px 0"
            borderColor={`transparent var(--chakra-colors-primary-500) transparent transparent`}
          >
            <Box
              position="absolute"
              top={1}
              right={-28}
              w={10}
              textAlign="center"
              color="white"
              fontSize="xs"
              transform="rotate(45deg)"
            >
              ✓
            </Box>
          </Box>
        )}
      </VStack>
    );
  };

  return (
    <Box w="full" mb={6}>
      <Text fontSize="sm" fontWeight="medium" mb={3} color={useColorModeValue('gray.700', 'whiteAlpha.800')}>
        Preview
      </Text>
      <HStack spacing={4} w="full">
        {renderPreview('light', 'Light')}
        {renderPreview('dark', 'Dark')}
      </HStack>
      
      <Box 
        mt={4} 
        p={4} 
        bg={useColorModeValue('gray.50', 'gray.800')} 
        borderRadius="lg"
        borderWidth="1px"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
        onClick={() => onSelect?.('system')}
        cursor="pointer"
        transition="all 0.2s"
        borderLeftWidth="3px"
        borderLeftColor={theme === 'system' ? 'primary.500' : 'transparent'}
      >
        <HStack justify="space-between">
          <VStack align="start" spacing={0}>
            <Text fontSize="sm" fontWeight="medium">
              System Default
              {theme === 'system' && (
                <Badge ml={2} colorScheme="primary" fontSize="xs">
                  Active
                </Badge>
              )}
            </Text>
            <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')}>
              {isDarkMode ? 'Using dark theme' : 'Using light theme'}
            </Text>
          </VStack>
          <Box 
            color={useColorModeValue('gray.400', 'gray.600')}
            fontSize="sm"
          >
            {isDarkMode ? '🌙' : '☀️'}
          </Box>
        </HStack>
      </Box>
    </Box>
  );
};

export default ThemePreview;
