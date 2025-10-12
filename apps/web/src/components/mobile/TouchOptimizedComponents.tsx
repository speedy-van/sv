'use client';

import React from 'react';
import {
  Box,
  Button,
  ButtonProps,
  useBreakpointValue,
  useColorModeValue,
} from '@chakra-ui/react';

interface TouchButtonProps extends ButtonProps {
  fullWidth?: boolean;
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  fullWidth = false,
  size = 'md',
  ...props
}) => {
  const isMobile = useBreakpointValue({ base: true, lg: false });
  
  // Mobile-optimized button sizing
  const mobileSize = isMobile ? 'lg' : size;
  const minHeight = isMobile ? '48px' : undefined;
  const minWidth = isMobile ? '120px' : undefined;

  return (
    <Button
      size={mobileSize}
      minH={minHeight}
      minW={minWidth}
      w={fullWidth ? 'full' : undefined}
      borderRadius="xl"
      fontWeight="semibold"
      transition="all 0.2s ease"
      _active={{
        transform: 'scale(0.98)',
      }}
      _hover={{
        transform: 'translateY(-1px)',
        boxShadow: 'lg',
      }}
      {...props}
    />
  );
};

export const TouchCard: React.FC<any> = ({ children, ...props }) => {
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box
      bg={bgColor}
      border={`1px solid ${borderColor}`}
      borderRadius="xl"
      p={isMobile ? 6 : 4}
      transition="all 0.2s ease"
      _hover={{
        transform: 'translateY(-2px)',
        boxShadow: 'lg',
      }}
      _active={{
        transform: 'scale(0.98)',
      }}
      {...props}
    >
      {children}
    </Box>
  );
};
