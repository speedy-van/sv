'use client';

import React from 'react';
import { Box, Text } from '@chakra-ui/react';

interface MarqueeTextProps {
  text: string;
  speed?: number;
}

export default function MarqueeText({ text, speed = 50 }: MarqueeTextProps) {
  return (
    <Box
      position="relative"
      w="100%"
      overflow="hidden"
      bg="linear-gradient(90deg, rgba(0,194,255,0.15) 0%, rgba(0,209,143,0.15) 50%, rgba(0,194,255,0.15) 100%)"
      backdropFilter="blur(12px)"
      borderY="2px solid"
      borderColor="rgba(0,229,255,0.4)"
      py={{ base: 3, md: 4 }}
      my={6}
      boxShadow="0 4px 20px rgba(0,194,255,0.3), inset 0 1px 0 rgba(255,255,255,0.1)"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '100%',
        background: 'linear-gradient(90deg, rgba(0,0,0,0.4) 0%, transparent 10%, transparent 90%, rgba(0,0,0,0.4) 100%)',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    >
      <Box
        display="flex"
        alignItems="center"
        animation={`marquee ${speed}s linear infinite`}
        sx={{
          '@keyframes marquee': {
            '0%': {
              transform: 'translateX(0%)',
            },
            '100%': {
              transform: 'translateX(-50%)',
            },
          },
        }}
      >
        {/* Repeat the text twice for seamless loop */}
        {[...Array(2)].map((_, i) => (
          <Text
            key={i}
            fontSize={{ base: 'sm', md: 'lg' }}
            fontWeight="700"
            color="white"
            textShadow="0 2px 12px rgba(0,0,0,0.7), 0 0 20px rgba(0,229,255,0.4)"
            whiteSpace="nowrap"
            px={4}
            letterSpacing="0.5px"
            sx={{
              background: 'linear-gradient(135deg, #ffffff 30%, #00E5FF 50%, #ffffff 70%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {text}
          </Text>
        ))}
      </Box>
    </Box>
  );
}
