'use client';

import { Box, Text } from '@chakra-ui/react';

interface SpeedyAIIconProps {
  size?: number;
  animated?: boolean;
}

export default function SpeedyAIIcon({ size = 60, animated = true }: SpeedyAIIconProps) {
  const scale = size / 100;
  
  return (
    <Box
      position="relative"
      width={`${size}px`}
      height={`${size}px`}
      display="flex"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      borderRadius="20%"
    >
      {/* Animated Fur Background */}
      <Box
        position="absolute"
        inset={0}
        bgGradient="linear(135deg, #0EA5E9 0%, #06B6D4 50%, #3B82F6 100%)"
        borderRadius="20%"
        _before={{
          content: '""',
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle at 20% 30%, rgba(255,255,255,0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(0,0,0,0.2) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 70%)
          `,
          filter: 'blur(15px)',
          animation: animated ? 'furWave 6s ease-in-out infinite' : 'none',
        }}
        _after={{
          content: '""',
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 2px,
              rgba(255,255,255,0.03) 2px,
              rgba(255,255,255,0.03) 4px
            ),
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 2px,
              rgba(0,0,0,0.02) 2px,
              rgba(0,0,0,0.02) 4px
            )
          `,
          animation: animated ? 'furTexture 8s linear infinite' : 'none',
        }}
        sx={{
          '@keyframes furWave': {
            '0%, 100%': {
              filter: 'blur(15px) hue-rotate(0deg)',
            },
            '50%': {
              filter: 'blur(20px) hue-rotate(10deg)',
            },
          },
          '@keyframes furTexture': {
            '0%': {
              transform: 'translate(0, 0) rotate(0deg)',
            },
            '100%': {
              transform: 'translate(10px, 10px) rotate(360deg)',
            },
          },
        }}
      />

      {/* Shimmer Light Effect */}
      {animated && (
        <Box
          position="absolute"
          inset={0}
          bgGradient="linear(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)"
          animation="shimmer 3s ease-in-out infinite"
          sx={{
            '@keyframes shimmer': {
              '0%': {
                transform: 'translateX(-100%) skewX(-15deg)',
              },
              '100%': {
                transform: 'translateX(200%) skewX(-15deg)',
              },
            },
          }}
        />
      )}

      {/* Glow Border */}
      <Box
        position="absolute"
        inset={0}
        borderRadius="20%"
        boxShadow="inset 0 0 20px rgba(255,255,255,0.3), 0 0 30px rgba(14,165,233,0.5)"
        pointerEvents="none"
      />

      {/* Static Sharp Text - "Speedy AI" */}
      <Box
        position="relative"
        zIndex={2}
        textAlign="center"
        transform={`scale(${scale})`}
      >
        <Text
          fontSize="18px"
          fontWeight="700"
          color="#E0F2FE"
          letterSpacing="0.5px"
          lineHeight="1.2"
          textShadow="0 2px 4px rgba(0,0,0,0.4)"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        >
          Speedy
        </Text>
        <Text
          fontSize="22px"
          fontWeight="800"
          color="#FFFFFF"
          letterSpacing="1px"
          lineHeight="1"
          textShadow="0 2px 8px rgba(0,0,0,0.5)"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        >
          AI
        </Text>
      </Box>
    </Box>
  );
}

