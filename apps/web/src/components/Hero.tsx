'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Icon,
  Flex,
  Badge,
  Spinner,
  chakra,
  shouldForwardProp,
} from '@chakra-ui/react';
import { motion, useInView, isValidMotionProp } from 'framer-motion';
import Link from 'next/link';
import {
  FaArrowRight,
  FaTruck,
  FaPlay,
  FaPause,
  FaVolumeUp,
  FaVolumeMute,
  FaShieldAlt,
  FaClock,
  FaStar,
  FaPhone,
} from 'react-icons/fa';

interface HeroProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
  backgroundImage?: string;
  height?: string;
  videoUrl?: string;
  showVideoControls?: boolean;
}

// Create motion components with proper prop filtering
const MotionBox = chakra(motion.div, {
  shouldForwardProp: (prop) => {
    // Allow motion-specific props to pass through to Framer Motion
    if (isValidMotionProp(prop)) {
      return true;
    }
    // Use Chakra's shouldForwardProp for everything else (this handles Chakra UI props properly)
    return shouldForwardProp(prop);
  },
});

const MotionHeading = chakra(motion.h1, {
  shouldForwardProp: (prop) => {
    // Allow motion-specific props to pass through to Framer Motion
    if (isValidMotionProp(prop)) {
      return true;
    }
    // Use Chakra's shouldForwardProp for everything else (this handles Chakra UI props properly)
    return shouldForwardProp(prop);
  },
});

const MotionText = chakra(motion.p, {
  shouldForwardProp: (prop) => {
    // Allow motion-specific props to pass through to Framer Motion
    if (isValidMotionProp(prop)) {
      return true;
    }
    // Use Chakra's shouldForwardProp for everything else (this handles Chakra UI props properly)
    return shouldForwardProp(prop);
  },
});
const MotionButton = chakra(motion.button, {
  shouldForwardProp: (prop) => {
    if (typeof prop === 'string') {
      return isValidMotionProp(prop) || (chakra as any).shouldForwardProp?.(prop) || true;
    }
    return true;
  },
});

const Hero: React.FC<HeroProps> = ({
  title = "🚚 Move Fast, Move Smart with Speedy Van",
  subtitle = "Professional van hire and moving services across the UK. Book in minutes, track in real-time, move with confidence.",
  ctaText = "Book Your Move Now",
  ctaHref = "/booking-luxury",
  backgroundImage,
  height = "100vh",
  videoUrl = "/videos/background.mp4",
  showVideoControls = true,
}) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(heroRef, { once: true });
  const textColor = 'white';

  return (
    <MotionBox
      ref={heroRef}
      w="full"
      h={height}
      position="relative"
      display="flex"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: isInView ? 1 : 0 }}
      transition="1s ease-out"
    >
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
          filter: 'brightness(0.6)',
        }}
        onLoadedData={() => console.log('🎥 Video loaded successfully!')}
        onError={(e) => console.error('❌ Video error:', e)}
        onPlay={() => console.log('▶️ Video is playing')}
      >
        <source src="/videos/background.mp4" type="video/mp4" />
      </video>

      {/* Minimal overlay for text readability */}
      <Box
        position="absolute"
        top="0"
        left="0"
        width="100%"
        height="100%"
        bg="linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.4) 100%)"
        zIndex={1}
      />

      {/* Hero Content */}
      <Container maxW="container.xl" position="relative" zIndex={2}>
        <VStack
          spacing={{ base: 6, md: 8 }}
          textAlign="center"
          maxW="5xl"
          mx="auto"
          py={{ base: 8, md: 16 }}
        >
          {/* Trust Indicators */}
          <MotionBox
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : -20 }}
            transition="0.8s ease-out 0.2s"
          >
            <HStack spacing={4} justify="center" wrap="wrap" mb={4}>
              <Badge
                colorScheme="green"
                size="lg"
                px={4}
                py={2}
                borderRadius="full"
                bg="rgba(0,209,143,0.9)"
                color="white"
                fontWeight="bold"
                boxShadow="0 4px 15px rgba(0,209,143,0.3)"
              >
                <Icon as={FaShieldAlt} mr={2} />
                Fully Insured
              </Badge>
              <Badge
                colorScheme="yellow"
                size="lg"
                px={4}
                py={2}
                borderRadius="full"
                bg="rgba(255,193,7,0.9)"
                color="black"
                fontWeight="bold"
                boxShadow="0 4px 15px rgba(255,193,7,0.3)"
              >
                <Icon as={FaStar} mr={2} />
                5-Star Rated
              </Badge>
              <Badge
                colorScheme="blue"
                size="lg"
                px={4}
                py={2}
                borderRadius="full"
                bg="rgba(0,194,255,0.9)"
                color="white"
                fontWeight="bold"
                boxShadow="0 4px 15px rgba(0,194,255,0.3)"
              >
                <Icon as={FaClock} mr={2} />
                24/7 Support
              </Badge>
            </HStack>
          </MotionBox>

          {/* Main Title */}
          <MotionHeading
            as="h1"
            fontSize={{ base: 'xl', md: '2xl', lg: '2xl' }}
            color={textColor}
            fontWeight="extrabold"
            lineHeight="shorter"
            textShadow="0 2px 10px rgba(0,0,0,0.5)"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 30 }}
            transition="0.8s ease-out 0.4s"
            maxW="4xl"
            mx="auto"
            mt={{ base: 0, lg: 72 }}
          >
            {title}
          </MotionHeading>
          
          {/* Subtitle */}
          <MotionText
            fontSize={{ base: 'lg', md: 'xl', lg: '2xl' }}
            color={textColor}
            opacity={0.95}
            maxW="3xl"
            mx="auto"
            lineHeight="tall"
            fontWeight="medium"
            textShadow="0 1px 5px rgba(0,0,0,0.3)"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
            transition="0.8s ease-out 0.6s"
          >
            {subtitle}
          </MotionText>

          {/* Enhanced CTA Buttons */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
            transition="0.8s ease-out 0.8s"
            w="full"
            maxW="600px"
          >
            <VStack spacing={4} w="full">
              {/* Primary CTA */}
              <MotionButton
                as={Link}
                href={ctaHref}
                bg="linear-gradient(135deg, #00C2FF, #00D18F)"
                color="white"
                fontWeight="bold"
                px={{ base: 8, md: 12 }}
                py={{ base: 6, md: 8 }}
                fontSize={{ base: 'lg', md: 'xl' }}
                borderRadius="2xl"
                boxShadow="0 8px 25px rgba(0,194,255,0.4)"
                _hover={{
                  bg: 'linear-gradient(135deg, #00D18F, #00C2FF)',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 35px rgba(0,194,255,0.5)',
                }}
                _active={{
                  transform: 'translateY(-2px)',
                }}
                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                w="full"
                maxW="400px"
              >
                {ctaText}
              </MotionButton>

              {/* Secondary Actions */}
              <HStack spacing={4} w="full" justify="center" wrap="wrap">
                <MotionButton
                  fontSize={{ base: 'md', md: 'lg' }}
                  borderColor="white"
                  color="white"
                  bg="rgba(255,255,255,0.1)"
                  backdropFilter="blur(10px)"
                  _hover={{
                    bg: 'rgba(255,255,255,0.2)',
                    borderColor: 'neon.400',
                    color: 'neon.400',
                    transform: 'translateY(-2px)',
                  }}
                  borderRadius="xl"
                  fontWeight="semibold"
                  transition="all 0.3s ease"
                  onClick={() => (window.location.href = '/track')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Track Move
                </MotionButton>

                <MotionButton
                  fontSize={{ base: 'md', md: 'lg' }}
                  borderColor="white"
                  color="white"
                  bg="rgba(255,255,255,0.1)"
                  backdropFilter="blur(10px)"
                  _hover={{
                    bg: 'rgba(255,255,255,0.2)',
                    borderColor: 'green.400',
                    color: 'green.400',
                    transform: 'translateY(-2px)',
                  }}
                  borderRadius="xl"
                  fontWeight="semibold"
                  transition="all 0.3s ease"
                  onClick={() => window.open('tel:+441202129746')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Call Now
                </MotionButton>
              </HStack>
            </VStack>
          </MotionBox>

          {/* Quick Stats */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
            transition="0.8s ease-out 1.0s"
            mt={8}
          >
            <HStack
              spacing={{ base: 6, md: 12 }}
              justify="center"
              wrap="wrap"
              divider={<Box h="40px" w="1px" bg="rgba(255,255,255,0.3)" />}
            >
              <VStack spacing={1}>
                <Text
                  fontSize={{ base: '2xl', md: '3xl' }}
                  fontWeight="bold"
                  color="neon.400"
                  textShadow="0 0 10px rgba(0,194,255,0.5)"
                >
                  50K+
                </Text>
                <Text fontSize="sm" color="white" opacity={0.8}>
                  Happy Customers
                </Text>
              </VStack>
              <VStack spacing={1}>
                <Text
                  fontSize={{ base: '2xl', md: '3xl' }}
                  fontWeight="bold"
                  color="green.400"
                  textShadow="0 0 10px rgba(0,209,143,0.5)"
                >
                  95%
                </Text>
                <Text fontSize="sm" color="white" opacity={0.8}>
                  On-Time Delivery
                </Text>
              </VStack>
              <VStack spacing={1}>
                <Text
                  fontSize={{ base: '2xl', md: '3xl' }}
                  fontWeight="bold"
                  color="yellow.400"
                  textShadow="0 0 10px rgba(255,193,7,0.5)"
                >
                  £50
                </Text>
                <Text fontSize="sm" color="white" opacity={0.8}>
                  Starting From
                </Text>
              </VStack>
            </HStack>
          </MotionBox>
        </VStack>
      </Container>
    </MotionBox>
  );
};

export default Hero;
