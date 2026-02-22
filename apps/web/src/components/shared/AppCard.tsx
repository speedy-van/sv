'use client';

import React from 'react';
import { Card, CardProps, useStyleConfig } from '@chakra-ui/react';

type AppCardVariant = 'default' | 'elevated' | 'interactive';

interface AppCardProps extends Omit<CardProps, 'variant'> {
  variantStyle?: AppCardVariant;
}

export default function AppCard({
  children,
  variantStyle = 'default',
  ...props
}: AppCardProps) {
  const styles = useStyleConfig('Card', { variant: variantStyle === 'default' ? 'default' : 'elevated' });

  return (
    <Card
      __css={styles}
      bg="bg.card"
      borderWidth="1px"
      borderColor="border.primary"
      borderRadius="xl"
      transition="all 0.2s ease"
      _hover={variantStyle === 'interactive' ? {
        transform: 'translateY(-2px)',
        borderColor: 'border.neon',
        boxShadow: 'lg',
      } : undefined}
      {...props}
    >
      {children}
    </Card>
  );
}

