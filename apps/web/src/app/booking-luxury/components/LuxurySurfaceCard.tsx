'use client';

import React from 'react';
import { Box, BoxProps } from '@chakra-ui/react';

type LuxuryTone = 'neutral' | 'success' | 'info';
type LuxuryVariant = 'default' | 'glass' | 'luxury';

interface LuxurySurfaceCardProps extends BoxProps {
  tone?: LuxuryTone;
  /** Align with luxury-design-system: glass morphism or card-luxury hover */
  variant?: LuxuryVariant;
}

const toneStyles: Record<LuxuryTone, Pick<BoxProps, 'borderColor' | 'boxShadow'>> = {
  neutral: {
    borderColor: 'border.primary',
    boxShadow: 'lg',
  },
  success: {
    borderColor: 'green.400',
    boxShadow: '0 12px 32px rgba(34, 197, 94, 0.18)',
  },
  info: {
    borderColor: 'blue.400',
    boxShadow: '0 12px 32px rgba(59, 130, 246, 0.16)',
  },
};

const variantStyles: Record<LuxuryVariant, BoxProps> = {
  default: {
    bg: 'bg.card',
    backdropFilter: 'blur(16px)',
  },
  glass: {
    bg: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(16px) saturate(180%)',
    borderColor: 'whiteAlpha.200',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  },
  luxury: {
    bg: 'bg.card',
    backdropFilter: 'blur(16px)',
    transition: 'all 0.3s ease',
    _hover: {
      borderColor: 'gold',
      boxShadow: '0 8px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.1)',
    },
  },
};

export default function LuxurySurfaceCard({
  children,
  tone = 'neutral',
  variant = 'default',
  ...props
}: LuxurySurfaceCardProps) {
  const baseVariant = variantStyles[variant];
  const toneStyle = toneStyles[tone];
  const borderAndShadow =
    variant === 'default'
      ? toneStyle
      : {
          borderColor: (baseVariant as BoxProps).borderColor ?? toneStyle.borderColor,
          boxShadow: (baseVariant as BoxProps).boxShadow ?? toneStyle.boxShadow,
        };
  return (
    <Box
      border="1px solid"
      borderRadius="2xl"
      overflow="hidden"
      position="relative"
      {...baseVariant}
      {...borderAndShadow}
      {...props}
    >
      {children}
    </Box>
  );
}

