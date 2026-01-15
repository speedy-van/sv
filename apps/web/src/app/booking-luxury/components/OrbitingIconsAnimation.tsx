'use client';

/**
 * Orbiting Icons Animation - Premium Calculating State
 * Two gear/settings icons spin around each other before revealing pricing
 */

import React from 'react';
import { Box, VStack, Text, SimpleGrid } from '@chakra-ui/react';

interface OrbitingIconsAnimationProps {
  duration?: number;
}

export default function OrbitingIconsAnimation({ duration = 270 }: OrbitingIconsAnimationProps) {
  // Generate gear tooth path with SHARP DIAMOND teeth
  const generateGearPath = (
    radius: number,
    toothCount: number,
    toothHeight: number,
    innerRadius: number
  ): string => {
    const points: string[] = [];
    const anglePerTooth = (2 * Math.PI) / toothCount;
    
    for (let i = 0; i < toothCount; i++) {
      const baseAngle = i * anglePerTooth;
      
      // Sharp diamond tip - single point at the apex
      const tipAngle = baseAngle;
      
      // Base of tooth (on pitch circle)
      const baseAngle1 = baseAngle - anglePerTooth * 0.25;
      const baseAngle2 = baseAngle + anglePerTooth * 0.25;
      
      // Single sharp tip point (apex of diamond)
      const xTip = Math.cos(tipAngle) * (radius + toothHeight);
      const yTip = Math.sin(tipAngle) * (radius + toothHeight);
      
      // Base points (left and right of tooth base)
      const x1 = Math.cos(baseAngle1) * radius;
      const y1 = Math.sin(baseAngle1) * radius;
      const x2 = Math.cos(baseAngle2) * radius;
      const y2 = Math.sin(baseAngle2) * radius;
      
      if (i === 0) {
        points.push(`M ${x1.toFixed(2)},${y1.toFixed(2)}`);
      } else {
        points.push(`L ${x1.toFixed(2)},${y1.toFixed(2)}`);
      }
      
      // Draw sharp diamond: base-left → tip → base-right
      points.push(`L ${xTip.toFixed(2)},${yTip.toFixed(2)}`);
      points.push(`L ${x2.toFixed(2)},${y2.toFixed(2)}`);
    }
    
    points.push('Z');
    return points.join(' ');
  };

  const gear1Path = generateGearPath(28, 12, 8, 12);
  const gear2Path = generateGearPath(28, 12, 8, 12);
  const gear3Path = generateGearPath(28, 12, 8, 12);

  return (
    <VStack spacing={6} py={12} align="center" justify="center" minH="400px">
      {/* Background Glow Effect */}
      <Box
        position="absolute"
        w="400px"
        h="400px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(139,92,246,0.06) 0%, rgba(59,130,246,0.03) 40%, transparent 70%)"
        filter="blur(40px)"
        pointerEvents="none"
        animation="pulse-glow 6s ease-in-out infinite"
        sx={{
          '@keyframes pulse-glow': {
            '0%, 100%': {
              transform: 'scale(1)',
              opacity: 0.5,
            },
            '50%': {
              transform: 'scale(1.1)',
              opacity: 0.8,
            },
          },
        }}
      />

      {/* Gears Container - Three gears with edge-to-edge contact */}
      <Box
        position="relative"
        w={{ base: '280px', md: '320px' }}
        h={{ base: '200px', md: '240px' }}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {/* Gear 1 (Left Bottom) - Spinning Clockwise */}
        <Box
          position="absolute"
          left="50%"
          top="50%"
          transform="translate(-130%, 30%)"
          animation="spin-left-gear 3s linear infinite"
          filter="drop-shadow(0 4px 8px rgba(139, 92, 246, 0.2))"
          sx={{
            '@keyframes spin-left-gear': {
              '0%': { transform: 'translate(-130%, 30%) rotate(0deg)' },
              '100%': { transform: 'translate(-130%, 30%) rotate(360deg)' },
            },
          }}
        >
          <svg width="120" height="120" viewBox="-50 -50 100 100" style={{ display: 'block' }}>
            <defs>
              <linearGradient id="gear1-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#6B7280', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#4B5563', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#374151', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <g>
              {/* Gear teeth */}
              <path 
                fill="url(#gear1-grad)" 
                stroke="#000000" 
                strokeWidth="1" 
                strokeLinejoin="round"
                d={gear1Path}
              />
              {/* Center hub */}
              <circle cx="0" cy="0" r="12" fill="#F9FAFB" stroke="#000000" strokeWidth="1"/>
              {/* Bolt holes */}
              <circle cx="0" cy="-6" r="1.5" fill="#D1D5DB"/>
              <circle cx="5.2" cy="3" r="1.5" fill="#D1D5DB"/>
              <circle cx="-5.2" cy="3" r="1.5" fill="#D1D5DB"/>
            </g>
          </svg>
        </Box>

        {/* Gear 3 (Center Top) - Spinning Counter-clockwise */}
        <Box
          position="absolute"
          left="50%"
          top="50%"
          transform="translate(-50%, -110%)"
          animation="spin-top-gear 3s linear infinite"
          filter="drop-shadow(0 4px 8px rgba(16, 185, 129, 0.2))"
          sx={{
            '@keyframes spin-top-gear': {
              '0%': { transform: 'translate(-50%, -110%) rotate(0deg)' },
              '100%': { transform: 'translate(-50%, -110%) rotate(-360deg)' },
            },
          }}
        >
          <svg width="120" height="120" viewBox="-50 -50 100 100" style={{ display: 'block' }}>
            <defs>
              <linearGradient id="gear3-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#6B7280', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#4B5563', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#374151', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <g>
              {/* Gear teeth */}
              <path 
                fill="url(#gear3-grad)" 
                stroke="#000000" 
                strokeWidth="1" 
                strokeLinejoin="round"
                d={gear3Path}
              />
              {/* Center hub */}
              <circle cx="0" cy="0" r="12" fill="#F9FAFB" stroke="#000000" strokeWidth="1"/>
              {/* Bolt holes */}
              <circle cx="0" cy="-6" r="1.5" fill="#D1D5DB"/>
              <circle cx="5.2" cy="3" r="1.5" fill="#D1D5DB"/>
              <circle cx="-5.2" cy="3" r="1.5" fill="#D1D5DB"/>
            </g>
          </svg>
        </Box>

        {/* Gear 2 (Right Bottom) - Spinning Clockwise */}
        <Box
          position="absolute"
          left="50%"
          top="50%"
          transform="translate(30%, 30%)"
          animation="spin-right-gear 3s linear infinite"
          filter="drop-shadow(0 4px 8px rgba(59, 130, 246, 0.2))"
          sx={{
            '@keyframes spin-right-gear': {
              '0%': { transform: 'translate(30%, 30%) rotate(0deg)' },
              '100%': { transform: 'translate(30%, 30%) rotate(360deg)' },
            },
          }}
        >
          <svg width="120" height="120" viewBox="-50 -50 100 100" style={{ display: 'block' }}>
            <defs>
              <linearGradient id="gear2-grad" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#6B7280', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#4B5563', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#374151', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <g>
              {/* Gear teeth */}
              <path 
                fill="url(#gear2-grad)" 
                stroke="#000000" 
                strokeWidth="1" 
                strokeLinejoin="round"
                d={gear2Path}
              />
              {/* Center hub */}
              <circle cx="0" cy="0" r="12" fill="#F9FAFB" stroke="#000000" strokeWidth="1"/>
              {/* Bolt holes */}
              <circle cx="0" cy="-6" r="1.5" fill="#D1D5DB"/>
              <circle cx="5.2" cy="3" r="1.5" fill="#D1D5DB"/>
              <circle cx="-5.2" cy="3" r="1.5" fill="#D1D5DB"/>
            </g>
          </svg>
        </Box>
      </Box>

      {/* Text Below */}
      <VStack spacing={2}>
        <Text
          color="white"
          fontSize="xl"
          fontWeight="800"
          textAlign="center"
          animation="pulse-text 2s ease-in-out infinite"
          sx={{
            '@keyframes pulse-text': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.7 },
            },
          }}
        >
          Calculating your premium quote
        </Text>
        
        {/* Animated Messages */}
        <Box position="relative" h="24px" w="full" display="flex" alignItems="center" justifyContent="center">
          <Text 
            color="purple.300" 
            fontSize="sm" 
            fontWeight="600" 
            textAlign="center"
            position="absolute"
            animation="message1 7s ease-in-out"
            sx={{
              '@keyframes message1': {
                '0%': { opacity: 0, transform: 'translateY(10px)' },
                '5%': { opacity: 1, transform: 'translateY(0)' },
                '20%': { opacity: 1, transform: 'translateY(0)' },
                '28%': { opacity: 0, transform: 'translateY(-10px)' },
                '100%': { opacity: 0, transform: 'translateY(-10px)' },
              },
            }}
          >
            Analyzing your requirements...
          </Text>
          
          <Text 
            color="blue.300" 
            fontSize="sm" 
            fontWeight="600" 
            textAlign="center"
            position="absolute"
            animation="message2 7s ease-in-out"
            sx={{
              '@keyframes message2': {
                '0%, 28%': { opacity: 0, transform: 'translateY(10px)' },
                '32%': { opacity: 1, transform: 'translateY(0)' },
                '48%': { opacity: 1, transform: 'translateY(0)' },
                '56%': { opacity: 0, transform: 'translateY(-10px)' },
                '100%': { opacity: 0, transform: 'translateY(-10px)' },
              },
            }}
          >
            Finding the cheapest price for you...
          </Text>
          
          <Text 
            color="cyan.300" 
            fontSize="sm" 
            fontWeight="600" 
            textAlign="center"
            position="absolute"
            animation="message3 7s ease-in-out"
            sx={{
              '@keyframes message3': {
                '0%, 56%': { opacity: 0, transform: 'translateY(10px)' },
                '60%': { opacity: 1, transform: 'translateY(0)' },
                '76%': { opacity: 1, transform: 'translateY(0)' },
                '84%': { opacity: 0, transform: 'translateY(-10px)' },
                '100%': { opacity: 0, transform: 'translateY(-10px)' },
              },
            }}
          >
            Comparing multiple options...
          </Text>
          
          <Text 
            color="green.300" 
            fontSize="sm" 
            fontWeight="600" 
            textAlign="center"
            position="absolute"
            animation="message4 7s ease-in-out"
            sx={{
              '@keyframes message4': {
                '0%, 84%': { opacity: 0, transform: 'translateY(10px)' },
                '88%': { opacity: 1, transform: 'translateY(0)' },
                '96%': { opacity: 1, transform: 'translateY(0)' },
                '100%': { opacity: 0, transform: 'translateY(-10px)' },
              },
            }}
          >
            Almost ready! 🎯
          </Text>
        </Box>
      </VStack>
    </VStack>
  );
}
