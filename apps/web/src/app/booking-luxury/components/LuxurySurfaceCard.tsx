'use client';

import React from 'react';
import { Box, BoxProps } from '@chakra-ui/react';

type LuxuryTone = 'neutral' | 'success' | 'info';

interface LuxurySurfaceCardProps extends BoxProps {
  tone?: LuxuryTone;
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

export default function LuxurySurfaceCard({
  children,
  tone = 'neutral',
  ...props
}: LuxurySurfaceCardProps) {
  return (
    <Box
      bg="bg.card"
      border="1px solid"
      borderRadius="2xl"
      backdropFilter="blur(16px)"
      overflow="hidden"
      position="relative"
      {...toneStyles[tone]}
      {...props}
    >
      {children}
    </Box>
  );
}

