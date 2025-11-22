'use client';

import React, { forwardRef } from 'react';
import { Box, BoxProps, Icon } from '@chakra-ui/react';
import { FaCheck } from 'react-icons/fa';

export interface SelectableCardProps extends BoxProps {
  isSelected: boolean;
  showCheckIndicator?: boolean;
}

export const SelectableCard = forwardRef<HTMLDivElement, SelectableCardProps>(
  (
    {
      isSelected,
      showCheckIndicator = true,
      children,
      _hover,
      _focusVisible,
      onClick,
      tabIndex,
      cursor,
      role,
      ...rest
    },
    ref
  ) => {
    const baseHoverStyles = {
      bg: isSelected ? 'rgba(15, 23, 42, 0.98)' : 'rgba(15, 23, 42, 0.5)',
      borderColor: 'blue.300',
      boxShadow: isSelected
        ? '0 0 40px rgba(59, 130, 246, 0.6)'
        : '0 8px 20px rgba(0, 0, 0, 0.45)',
      transform: { base: 'translateY(-2px)', md: 'translateY(-4px) scale(1.02)' },
    };

    return (
      <Box
        ref={ref}
        borderWidth={{ base: '2px', md: '3px' }}
        borderColor={isSelected ? 'blue.400' : 'whiteAlpha.200'}
        bg={isSelected ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.35)'}
        borderRadius={{ base: 'xl', md: '2xl' }}
        boxShadow={isSelected ? '0 0 30px rgba(59, 130, 246, 0.45)' : 'none'}
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        overflow="hidden"
        position="relative"
        onClick={onClick}
        cursor={cursor ?? (onClick ? 'pointer' : undefined)}
        role={role ?? (onClick ? 'button' : undefined)}
        tabIndex={tabIndex ?? (onClick ? 0 : undefined)}
        _hover={{
          ...baseHoverStyles,
          ..._hover,
        }}
        _focusVisible={{
          outline: 'none',
          boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.8)',
          ..._focusVisible,
        }}
        {...rest}
      >
        {showCheckIndicator && isSelected && (
          <Box
            position="absolute"
            top={{ base: 2, md: 3 }}
            right={{ base: 2, md: 3 }}
            bg="blue.500"
            borderRadius="full"
            p={{ base: 1.5, md: 2 }}
            boxShadow="0 0 15px rgba(255, 255, 255, 0.5)"
          >
            <Icon as={FaCheck} boxSize={{ base: 3, md: 4 }} color="white" />
          </Box>
        )}
        {children}
      </Box>
    );
  }
);

SelectableCard.displayName = 'SelectableCard';


