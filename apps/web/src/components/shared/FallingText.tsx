'use client';

import React from 'react';
import { Box } from '@chakra-ui/react';
import { keyframes as emotionKeyframes } from '@emotion/react';

interface FallingTextProps {
  text: string;
  intervalMs?: number; // total cycle duration
  letterStaggerMs?: number; // delay between letters
  fontSize?: any;
}

// Keyframes: keep baseline most of the time, fall between 10%-45%, then reset back
const fallKeyframes = emotionKeyframes`
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  8% { transform: translateY(0) rotate(0deg); opacity: 1; }
  10% { transform: translateY(0) rotate(0deg); opacity: 1; }
  35% { transform: translateY(120%) rotate(8deg); opacity: 0.85; }
  45% { transform: translateY(140%) rotate(12deg); opacity: 0.0; }
  60% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(0) rotate(0deg); opacity: 1; }
`;

export const FallingText: React.FC<FallingTextProps> = ({
  text,
  intervalMs = 6000,
  letterStaggerMs = 60,
  fontSize = { base: 'xl', md: '2xl', lg: '3xl' },
}) => {
  const letters = Array.from(text);

  return (
    <Box
      as="h1"
      display="inline-block"
      fontWeight="extrabold"
      lineHeight="1.2"
      letterSpacing="wide"
      sx={{
        // nice multi-color gradient clipped to text
        background:
          'linear-gradient(90deg, rgba(0,194,255,1), rgba(147,51,234,1), rgba(236,72,153,1), rgba(16,185,129,1))',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
      }}
      fontSize={fontSize}
      role="heading"
      aria-label={text}
    >
      {letters.map((ch, idx) => (
        <Box
          as="span"
          key={`${ch}-${idx}`}
          display="inline-block"
          pr={ch === ' ' ? 1 : 0}
          sx={{
            animation: `${fallKeyframes} ${intervalMs}ms ease-in-out infinite`,
            animationDelay: `${idx * letterStaggerMs}ms`,
            willChange: 'transform, opacity',
          }}
        >
          {ch}
        </Box>
      ))}
    </Box>
  );
};

export default FallingText;


