'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Box, Image, Text, useToken } from '@chakra-ui/react';
import { motion } from 'framer-motion';

interface ProfileItem {
  id: number;
  imagePath: string;
  label: string;
  color: string;
}

const FloatingOrbCluster: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [rotation, setRotation] = useState(0);

  // Profile items from the dataset - defined before any useEffect
  const profileItems: ProfileItem[] = useMemo(() => [
    {
      id: 1,
      imagePath: '/UK_Removal_Dataset/Images_Only/Living_room_Furniture/accent_chairs_set_2_mid_century_jpg_38kg.jpg',
      label: 'Furniture',
      color: 'orange.700',
    },
    {
      id: 2,
      imagePath: '/UK_Removal_Dataset/Images_Only/Kitchen_appliances/air_fryer_toaster_oven_breville_jpg_18kg.jpg',
      label: 'Kitchen',
      color: 'red.500',
    },
    {
      id: 3,
      imagePath: '/UK_Removal_Dataset/Images_Only/Electrical_Electronic/computer_monitor_24inch_gaming_jpg_6kg.jpg',
      label: 'Electronics',
      color: 'blue.500',
    },
    {
      id: 4,
      imagePath: '/UK_Removal_Dataset/Images_Only/Garden_Outdoor/bbq_grill_3in1_gas_charcoal_combo_jpg_65kg.jpg',
      label: 'Outdoor',
      color: 'green.600',
    },
    {
      id: 5,
      imagePath: '/UK_Removal_Dataset/Images_Only/Bedroom/bunk_bed_frame_l_shaped_white_storage_desk_jpg_95kg.jpg',
      label: 'Bedroom',
      color: 'purple.400',
    },
    {
      id: 6,
      imagePath: '/UK_Removal_Dataset/Images_Only/Office_furniture/conference_table_ahliss_sturdy_cable_management_jpg_85kg.jpg',
      label: 'Office',
      color: 'blue.600',
    },
    {
      id: 7,
      imagePath: '/UK_Removal_Dataset/Images_Only/Gym_Fitness_Equipment/balance_ball_half_exercise_23inch_jpg_5kg.jpg',
      label: 'Fitness',
      color: 'orange.600',
    },
    {
      id: 8,
      imagePath: '/UK_Removal_Dataset/Images_Only/Children_Baby_Items/baby_bouncer_swing_seat_jpg_15kg.jpg',
      label: 'Baby',
      color: 'pink.300',
    },
    {
      id: 9,
      imagePath: '/UK_Removal_Dataset/Images_Only/Bathroom_Furniture/bathroom_bench_white_storage_jpg_15kg.jpg',
      label: 'Bathroom',
      color: 'cyan.400',
    },
    {
      id: 10,
      imagePath: '/UK_Removal_Dataset/Images_Only/Musical_instruments/acoustic_guitar_brooklyn_orangewood_jpg_2kg.jpg',
      label: 'Music',
      color: 'yellow.600',
    },
    {
      id: 11,
      imagePath: '/UK_Removal_Dataset/Images_Only/Carpets_Rugs/area_rug_8x10_oriental_jpg_25kg.jpg',
      label: 'Rugs',
      color: 'red.600',
    },
    {
      id: 12,
      imagePath: '/UK_Removal_Dataset/Images_Only/Pet_items/aquarium_240_gallon_glass_custom_aquariums_jpg_185kg.jpg',
      label: 'Pets',
      color: 'teal.500',
    },
  ], []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Continuous slow rotation (360° per 40 seconds - counter-clockwise)
  useEffect(() => {
    if (!mounted) return;

    let animationFrame: number;
    let lastTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const delta = now - lastTime;
      lastTime = now;

      // Counter-clockwise rotation: negative delta
      setRotation((prev) => {
        const newRotation = (prev - (delta / 40000) * 360) % 360;
        return newRotation;
      });
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [mounted]);

  if (!mounted) return null;

  return (
    <Box
      w="100%"
      h={{ base: '280px', md: '380px', lg: '450px' }}
      position="relative"
      overflow="visible"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      {/* Dark Space Background */}
      <Box
        position="absolute"
        inset={0}
        bgGradient="radial(blackAlpha.900 0%, blackAlpha.600 100%)"
        borderRadius="50%"
        filter="blur(40px)"
        zIndex={0}
      />

      {/* Orbital Container */}
      <Box
        position="relative"
        w={{ base: '320px', md: '480px', lg: '550px' }}
        h={{ base: '320px', md: '480px', lg: '550px' }}
        style={{
          perspective: '1200px',
          transformStyle: 'preserve-3d',
        }}
        zIndex={1}
      >
        {/* Central Core with Pulsing Effect */}
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          w="60px"
          h="60px"
          borderRadius="50%"
          bgGradient="radial(neon.500, brand.500, transparent)"
          filter="blur(25px)"
          zIndex={50}
          animation="pulse 3s ease-in-out infinite"
          sx={{
            '@keyframes pulse': {
              '0%, 100%': { opacity: 0.6, transform: 'translate(-50%, -50%) scale(1)' },
              '50%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1.2)' },
            },
          }}
        />
        
        {/* Orbital Ring Guide */}
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          w="85%"
          h="85%"
          borderRadius="50%"
          borderWidth="1px"
          borderColor="neon.500"
          borderStyle="solid"
          opacity={0.15}
          boxShadow="glow.neon"
          zIndex={0}
        />

        {/* Orbiting Profile Photos */}
        {profileItems.map((item, index) => {
          const totalItems = profileItems.length;
          const baseAngle = (360 / totalItems) * index;
          const currentAngle = (baseAngle + rotation) % 360;

          return (
            <OrbitalPhoto
              key={item.id}
              item={item}
              angle={currentAngle}
              index={index}
            />
          );
        })}
      </Box>
    </Box>
  );
};

// Orbital Photo Component
const OrbitalPhoto: React.FC<{
  item: ProfileItem;
  angle: number;
  index: number;
}> = ({ item, angle, index }) => {
  // Get theme colors
  const [neonColor, brandColor] = useToken('colors', ['neon.500', 'brand.500']);
  
  // Orbital radius (distance from center) - increased for better visibility
  const orbitalRadius = 42; // percentage of container

  // Convert angle to radians
  const angleRad = (angle - 90) * (Math.PI / 180); // -90 to start from top

  // Calculate X, Y position on orbital path
  const x = Math.cos(angleRad) * orbitalRadius;
  const y = Math.sin(angleRad) * orbitalRadius;

  // Calculate depth factor (Z-axis simulation)
  // When angle is 180° (bottom), depth is maximum (1.0)
  // When angle is 0° or 360° (top), depth is minimum (0.0)
  const normalizedAngle = ((angle + 180) % 360) / 360;
  const depthFactor = Math.sin(normalizedAngle * Math.PI);

  // Scale based on depth (8.6:1 ratio as per spec)
  // Min: 14px, Max: 120px - increased for better visibility
  const minSize = 14;
  const maxSize = 120;
  const currentSize = minSize + (maxSize - minSize) * depthFactor;

  // Calculate Z-index based on depth
  // Photos closer to viewer (larger) should have higher z-index
  const zIndex = Math.round(depthFactor * 100);

  // Calculate opacity for depth effect - more visible
  const opacity = 0.5 + depthFactor * 0.5;

  // Glow intensity based on size - enhanced
  const glowIntensity = depthFactor * 1.2;
  
  // Helper to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <Box
      position="absolute"
      left="50%"
      top="50%"
      style={{
        transform: `translate(-50%, -50%) translate(${x}%, ${y}%)`,
        zIndex: zIndex,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.6,
          delay: index * 0.05,
          ease: [0.34, 1.56, 0.64, 1],
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        {/* Profile Photo */}
        <Box
          w={`${currentSize}px`}
          h={`${currentSize}px`}
          position="relative"
          borderRadius="50%"
          overflow="hidden"
          border={`${2.5 + depthFactor * 3}px solid`}
          borderColor={hexToRgba(neonColor, 0.5 + glowIntensity * 0.4)}
          bg={item.color}
          opacity={opacity}
          cursor="pointer"
          transition="all 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
          sx={{
            boxShadow: `
              0 0 ${15 + glowIntensity * 30}px ${hexToRgba(neonColor, 0.5 + glowIntensity * 0.4)},
              0 0 ${30 + glowIntensity * 50}px ${hexToRgba(brandColor, 0.3 + glowIntensity * 0.35)},
              0 ${2 + depthFactor * 6}px ${10 + depthFactor * 15}px var(--chakra-colors-blackAlpha-${Math.round((400 + depthFactor * 300))}),
              inset 0 2px ${6 + depthFactor * 6}px var(--chakra-colors-whiteAlpha-${Math.round((150 + depthFactor * 250))})
            `
          }}
          _hover={{
            transform: 'scale(1.2)',
            borderColor: 'brand.500',
            boxShadow: `
              0 0 40px ${brandColor},
              0 0 70px ${hexToRgba(neonColor, 0.8)},
              0 0 100px ${hexToRgba(brandColor, 0.6)},
              0 8px 25px var(--chakra-colors-blackAlpha-600)
            `,
            zIndex: 200,
          }}
        >
          <Image
            src={item.imagePath}
            alt={item.label}
            w="100%"
            h="100%"
            objectFit="cover"
            filter={`brightness(${0.95 + depthFactor * 0.25}) contrast(1.15) saturate(${1.1 + depthFactor * 0.4})`}
            loading="lazy"
          />

          {/* Radial highlight */}
          <Box
            position="absolute"
            inset={0}
            borderRadius="50%"
            bgGradient={`radial(whiteAlpha.${Math.round((200 + depthFactor * 300))}, transparent)`}
            pointerEvents="none"
          />
        </Box>

        {/* Label (scales with photo) */}
        {currentSize > 50 && (
          <Text
            fontSize={`${Math.max(9, currentSize * 0.14)}px`}
            fontWeight="extrabold"
            color="white"
            textAlign="center"
            whiteSpace="nowrap"
            opacity={opacity}
            textShadow={`
              0 0 ${10 + glowIntensity * 10}px ${hexToRgba(neonColor, 0.7 + glowIntensity * 0.3)},
              0 2px 4px var(--chakra-colors-blackAlpha-800)
            `}
            px={2}
            py={1}
            bg="blackAlpha.600"
            borderRadius="full"
            backdropFilter="blur(6px)"
            borderWidth="1px"
            borderColor="neon.500"
            borderStyle="solid"
            sx={{
              borderColor: hexToRgba(neonColor, 0.3),
            }}
          >
            {item.label}
          </Text>
        )}
      </motion.div>
    </Box>
  );
};

export default FloatingOrbCluster;
