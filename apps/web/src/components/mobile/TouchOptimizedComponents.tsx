'use client';

import React from 'react';
import {
  Box,
  Button,
  ButtonProps,
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
  return (
    <Button
      size={{ base: 'lg', lg: size as any }}
      minH={{ base: '48px', lg: 'auto' }}
      minW={{ base: '120px', lg: 'auto' }}
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
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box
      bg={bgColor}
      border={`1px solid ${borderColor}`}
      borderRadius="xl"
      p={{ base: 6, lg: 4 }}
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
