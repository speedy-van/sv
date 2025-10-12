'use client';

import React from 'react';
import {
  Box,
  VStack,
  Spinner,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'xl',
}) => {
  const textColor = useColorModeValue('gray.600', 'gray.300');

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minH="200px"
      w="full"
    >
      <VStack spacing={4}>
        <Spinner
          size={size}
          color="blue.500"
          thickness="4px"
          speed="0.65s"
        />
        <Text color={textColor} fontSize="sm">
          {message}
        </Text>
      </VStack>
    </Box>
  );
};

export default LoadingSpinner;
