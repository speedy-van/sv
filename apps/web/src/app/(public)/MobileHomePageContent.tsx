'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  SimpleGrid,
  Avatar,
  Badge,
  Icon,
  Stack,
  chakra,
  shouldForwardProp,
  Button,
  usePrefersReducedMotion,
} from '@chakra-ui/react';
import Link from 'next/link';
import { motion, isValidMotionProp } from 'framer-motion';
import {
  FaTruck,
  FaClock,
  FaShieldAlt,
  FaStar,
  FaCouch,
  FaLaptop,
  FaGraduationCap,
  FaBuilding,
  FaCheckCircle,
  FaPhone,
  FaArrowRight,
} from 'react-icons/fa';
import { TouchButton } from '@/components/mobile/TouchOptimizedComponents';
import MobileHeader from '@/components/mobile/MobileHeader';
import dynamic from 'next/dynamic';

// Lazy load non-critical components
const HomeFooter = dynamic(() => import('@/components/site/HomeFooter'), {
  ssr: false,
  loading: () => null,
});

const SpeedyAIBotWrapper = dynamic(() => import('@/components/site/SpeedyAIBotWrapper'), {
  ssr: false,
  loading: () => null,
});

const TrustpilotWidget = dynamic(
  () => import('@/components/site/TrustpilotWidget'),
  { 
    ssr: false,
    loading: () => null,
  }
);

const ServiceMapSection = dynamic(() => import('../../components/ServiceMapSection'), {
  ssr: false,
  loading: () => null,
});

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

const MotionCard = chakra(motion.div, {
  shouldForwardProp: (prop) => {
    // Allow motion-specific props to pass through to Framer Motion
    if (isValidMotionProp(prop)) {
      return true;
    }
    // Use Chakra's shouldForwardProp for everything else (this handles Chakra UI props properly)
    return shouldForwardProp(prop);
  },
});

const MotionText = chakra(motion.span, {
  shouldForwardProp: (prop) => {
    if (isValidMotionProp(prop)) {
      return true;
    }
    return shouldForwardProp(prop);
  },
});

// Mobile-optimized data structures
const features = [
  {
    icon: FaTruck,
    title: 'Fast & Reliable',
    description: 'Professional service with guaranteed delivery times',
    color: 'blue',
    gradient: 'linear(to-r, blue.400, blue.600)',
  },
  {
    icon: FaClock,
    title: '24/7 Support',
    description: 'Round-the-clock customer support',
    color: 'green',
    gradient: 'linear(to-r, green.400, green.600)',
  },
  {
    icon: FaShieldAlt,
    title: 'Fully Insured',
    description: 'Complete coverage for your belongings',
    color: 'purple',
    gradient: 'linear(to-r, purple.400, purple.600)',
  },
  {
    icon: FaStar,
    title: '5-Star Rated',
    description: 'Trusted by thousands of customers',
    color: 'yellow',
    gradient: 'linear(to-r, yellow.400, yellow.600)',
  },
];

const services = [
  {
    icon: FaCouch,
    title: 'Furniture Moves',
    description: 'Expert handling of sofas, tables & delicate pieces',
    emoji: '🪑',
    color: 'orange',
    features: [
      'Professional packing',
      'Furniture protection',
      'Assembly service',
    ],
  },
  {
    icon: FaLaptop,
    title: 'Electronics',
    description: 'Safe transport of TVs, computers & appliances',
    emoji: '💻',
    color: 'blue',
    features: [
      'Anti-static packaging',
      'Climate control',
      'Insurance coverage',
    ],
  },
  {
    icon: FaGraduationCap,
    title: 'Student Moves',
    description: 'Affordable campus-to-campus relocation',
    emoji: '🎓',
    color: 'green',
    features: ['Student discounts', 'Flexible scheduling', 'Storage options'],
  },
  {
    icon: FaBuilding,
    title: 'Business',
    description: 'Professional corporate relocation services',
    emoji: '🏢',
    color: 'purple',
    features: ['Minimal downtime', 'Document security', 'After-hours service'],
  },
];

const testimonials = [
  {
    name: 'Sarah Mitchell',
    city: 'Manchester',
    quote:
      'Speedy Van moved my entire flat in under 3 hours! Professional and careful with my furniture.',
    rating: 5,
    avatar: '/What Our Customers Say/Sarah Mitchell.webp',
    service: 'Flat Removal',
  },
  {
    name: 'James Thompson',
    city: 'Birmingham',
    quote:
      'Best moving experience ever. They handled my electronics with care, and the price was exactly as quoted.',
    rating: 5,
    avatar: '/What Our Customers Say/James Thompson.webp',
    service: 'Electronics Move',
  },
  {
    name: 'Emma Davies',
    city: 'Leeds',
    quote:
      'From booking to delivery, everything was seamless. Punctual drivers and perfect condition delivery.',
    rating: 5,
    avatar: '/What Our Customers Say/Emma Davies.webp',
    service: 'Home Removal',
  },
];

const stats = [
  { number: '50K+', label: 'Happy Customers', icon: FaStar, color: 'yellow' },
  { number: '95%', label: 'On-Time', icon: FaClock, color: 'green' },
  { number: '24/7', label: 'Support', icon: FaPhone, color: 'blue' },
  { number: '£50', label: 'From', icon: FaTruck, color: 'neon' },
];

const viewportMotion = { once: true, amount: 0.25 };

// Simplified animations to reduce CLS and improve performance
const createFadeInUp = (reduceMotion: boolean, delay = 0, distance = 10) => ({
  hidden: { opacity: 0, y: reduceMotion ? 0 : distance },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const, delay },
  },
});

const createStaggerContainer = (reduceMotion: boolean, delayChildren = 0.08, staggerChildren = 0.05) => ({
  hidden: {},
  show: {
    transition: reduceMotion
      ? undefined
      : {
          delayChildren,
          staggerChildren,
        },
  },
});

const hoverLift = (reduceMotion: boolean) =>
  reduceMotion
    ? undefined
    : {
        y: -4,
        scale: 1.005,
        boxShadow: '0 0 25px rgba(0,194,255,0.25)',
        transition: { type: 'spring' as const, stiffness: 200, damping: 20 },
      };

const floatPulse = (reduceMotion: boolean) =>
  reduceMotion
    ? undefined
    : {
        y: [0, -6, 0],
        opacity: [0.96, 1, 0.96],
        transition: { duration: 7, repeat: Infinity, ease: 'easeInOut' as const },
      };

const createWordFade = (reduceMotion: boolean, delay = 0) => ({
  hidden: { opacity: 0, y: reduceMotion ? 0 : 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut' as const, delay },
  },
});

// Mobile Hero Section
const MobileHero: React.FC = () => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const heroStagger = useMemo(
    () => createStaggerContainer(prefersReducedMotion, 0.15, 0.1),
    [prefersReducedMotion]
  );
  const heroBadges = useMemo(() => createFadeInUp(prefersReducedMotion, 0.08, 12), [prefersReducedMotion]);
  const heroHeadline = useMemo(() => createFadeInUp(prefersReducedMotion, 0.25, 26), [prefersReducedMotion]);
  const heroSubheadline = useMemo(() => createFadeInUp(prefersReducedMotion, 0.4, 20), [prefersReducedMotion]);
  const heroCtas = useMemo(() => createFadeInUp(prefersReducedMotion, 0.55, 18), [prefersReducedMotion]);
  const heroTitleWords = useMemo(
    () => 'Professional Man and Van Service Across the UK'.split(' '),
    []
  );
  const heroSubtitleWords = useMemo(
    () =>
      'Expert house removals, furniture delivery, and man and van services in London, Manchester, Birmingham, Glasgow, Edinburgh, Cardiff, Belfast, and all UK cities. Same day service from £25/hour with fully insured drivers.'
        .split(' '),
    []
  );

  return (
    <Box
      className="mobile-hero"
      position="relative"
      display="flex"
      alignItems="center"
      overflow="hidden"
      w="100%"
      maxW="100%"
      sx={{
        minHeight: { base: 'auto', md: '90vh' },
        height: { base: 'auto', md: '90vh' },
        py: { base: '120px', md: '80px' },
        pt: { base: '140px', md: '100px' },
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: '-30%',
          background:
            'radial-gradient(circle at 30% 30%, rgba(0,194,255,0.16), transparent 45%), radial-gradient(circle at 70% 70%, rgba(0,209,143,0.14), transparent 50%)',
          animation: prefersReducedMotion ? undefined : 'gradientShift 18s ease-in-out infinite',
          filter: 'blur(40px)',
          zIndex: 0,
        },
        '@keyframes gradientShift': {
          '0%': { transform: 'translate3d(0px, 0px, 0)' },
          '50%': { transform: 'translate3d(18px, -14px, 0)' },
          '100%': { transform: 'translate3d(0px, 0px, 0)' },
        },
      }}
    >
      {/* Video Background - Now shows on all screen sizes */}
      {(
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/android-chrome-512x512.png"
          aria-hidden
          tabIndex={-1}
          webkit-playsinline="true"
          x5-playsinline="true"
          x5-video-player-type="h5"
          x5-video-player-fullscreen="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
            filter: 'brightness(0.6)',
            imageRendering: 'crisp-edges',
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden',
            transform: 'translateZ(0)',
            willChange: 'transform',
          }}
          onLoadedData={() => {
            // Video loaded successfully - production ready
          }}
          onError={() => {
            // Video failed to load, fallback to background gradient handled by CSS
          }}
          onPlay={() => {
            // Video started playing - production ready
          }}
        >
          {/* Use smaller optimized video first (2.67MB vs 56MB) */}
          <source src={`${process.env.NEXT_PUBLIC_CDN_URL || ''}/videos/background.mp4`} type="video/mp4" />
        </video>
      )}

      {/* Fallback Background */}
      <Box
        position="absolute"
        top="0"
        left="0"
        width="100%"
        height="100%"
        bg="linear-gradient(135deg, rgba(0,194,255,0.8) 0%, rgba(0,209,143,0.8) 100%)"
        zIndex={-1}
      />

      {/* Dark Overlay for better text readability */}
      <Box
        position="absolute"
        top="0"
        left="0"
        width="100%"
        height="100%"
        bg="linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.4) 100%)"
        zIndex={1}
      />

  <Container 
    className="mobile-container"
    maxW="full" 
    px={{ base: 4, md: 6 }} 
    position="relative" 
    zIndex={1}
    w="100%"
    mx="auto"
    overflow="hidden"
  >
        <VStack spacing={{ base: 6, md: 8 }} textAlign="center">
          {/* Trust Indicators - Moved to top */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <MotionBox
            initial="hidden"
            whileInView="show"
            variants={heroStagger}
            viewport={viewportMotion}
            mt={{ base: 0, md: 12, lg: 28 }}
          >
            <HStack spacing={3} justify="center" wrap="wrap" mb={4}>
              {[ 
                { label: 'Fully Insured', icon: FaShieldAlt, bg: 'rgba(0,209,143,0.9)', color: 'white' },
                { label: '5-Star Rated', icon: FaStar, bg: 'rgba(255,193,7,0.9)', color: 'black' },
                { label: '24/7 Support', icon: FaClock, bg: 'rgba(0,194,255,0.9)', color: 'white' },
              ].map((badge, index) => (
                <MotionBox
                  key={badge.label}
                  variants={createFadeInUp(prefersReducedMotion, 0.1 + index * 0.05, 12)}
                  animate={floatPulse(prefersReducedMotion)}
                >
                  <Badge
                    colorScheme="green"
                    position="relative"
                    display="inline-flex"
                    alignItems="center"
                    gap={2}
                    size="lg"
                    px={{ base: 4, md: 5 }}
                    py={{ base: 2, md: 3 }}
                    borderRadius="full"
                    bg={badge.bg}
                    color={badge.color}
                    fontSize={{ base: 'sm', md: 'md' }}
                    fontWeight="extrabold"
                    border="1px solid rgba(255,255,255,0.24)"
                    boxShadow="0 12px 32px rgba(0,0,0,0.28), 0 0 22px rgba(0,194,255,0.25)"
                    backdropFilter="blur(8px)"
                    sx={{
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 'full',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.16), rgba(255,255,255,0.02))',
                        opacity: 0.65,
                      },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        inset: '-4px',
                        borderRadius: 'full',
                        border: '1px solid rgba(255,255,255,0.18)',
                        opacity: 0.8,
                        filter: 'blur(1px)',
                      },
                    }}
                  >
                    <Icon as={badge.icon} mr={2} boxSize={{ base: 3, md: 4 }} zIndex={1} />
                    <Box as="span" position="relative" zIndex={1}>
                      {badge.label}
                    </Box>
                  </Badge>
                </MotionBox>
              ))}
            </HStack>
          </MotionBox>

          {/* Main Heading */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <MotionBox
            initial="hidden"
            whileInView="show"
            variants={heroHeadline}
            viewport={viewportMotion}
          >
            <Heading
              as="h1"
              size={{ base: '2xl', md: '4xl' }}
              mb={4}
              fontWeight="black"
              lineHeight={{ base: '1.1', md: '1.05' }}
              maxW={{ base: '95%', md: '800px' }}
              mx="auto"
              letterSpacing={{ base: '-0.02em', md: '-0.03em' }}
              sx={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #00E5FF 35%, #00D18F 65%, #FFFFFF 100%)',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: prefersReducedMotion ? undefined : 'gradientText 6s ease-in-out infinite',
                filter: 'drop-shadow(0 4px 20px rgba(0,194,255,0.4)) drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
                '@keyframes gradientText': {
                  '0%': { backgroundPosition: '0% 50%' },
                  '50%': { backgroundPosition: '100% 50%' },
                  '100%': { backgroundPosition: '0% 50%' },
                },
              }}
            >
              {heroTitleWords.map((word, index) => (
                <MotionText
                  key={`${word}-${index}`}
                  display="inline-block"
                  mr={word.endsWith('.') ? 0 : { base: 1.5, md: 2 }}
                  variants={createWordFade(prefersReducedMotion, 0.12 + index * 0.04)}
                  sx={{
                    '&:hover': {
                      transform: prefersReducedMotion ? undefined : 'scale(1.05) translateY(-2px)',
                      transition: 'transform 0.3s ease',
                    },
                  }}
                >
                  {word}
                  {index < heroTitleWords.length - 1 ? ' ' : ''}
                </MotionText>
              ))}
            </Heading>
          </MotionBox>

          {/* Subtitle */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <MotionBox
            initial="hidden"
            whileInView="show"
            variants={heroSubheadline}
            viewport={viewportMotion}
            mt={{ base: 4, md: 6 }}
          >
            <Text
              fontSize={{ base: 'md', md: 'xl' }}
              maxW={{ base: '95%', md: '700px' }}
              lineHeight={{ base: '1.7', md: '1.8' }}
              fontWeight="medium"
              letterSpacing="0.01em"
              mx="auto"
              sx={{
                color: 'rgba(255,255,255,0.95)',
                textShadow: '0 2px 10px rgba(0,0,0,0.4), 0 0 30px rgba(0,194,255,0.2)',
                '& strong': {
                  color: '#00E5FF',
                  fontWeight: 'bold',
                },
              }}
            >
              {heroSubtitleWords.map((word, index) => {
                const isHighlighted = ['London,', 'Manchester,', 'Birmingham,', 'Glasgow,', 'Edinburgh,', 'Cardiff,', 'Belfast,', '£25/hour'].includes(word);
                const isPriceWord = word === '£25/hour';
                return (
                  <MotionText
                    key={`${word}-${index}`}
                    display="inline-block"
                    mr={word.endsWith('.') ? 0 : 1}
                    variants={createWordFade(prefersReducedMotion, 0.2 + index * 0.015)}
                    sx={{
                      color: isHighlighted ? '#00E5FF' : 'inherit',
                      fontWeight: isHighlighted ? 'bold' : 'inherit',
                      textShadow: isPriceWord 
                        ? '0 0 20px rgba(0,229,255,0.6), 0 0 40px rgba(0,209,143,0.4)' 
                        : 'inherit',
                      background: isPriceWord 
                        ? 'linear-gradient(135deg, #00E5FF, #00D18F)' 
                        : 'none',
                      WebkitBackgroundClip: isPriceWord ? 'text' : 'unset',
                      WebkitTextFillColor: isPriceWord ? 'transparent' : 'unset',
                      backgroundClip: isPriceWord ? 'text' : 'unset',
                    }}
                  >
                    {word}
                    {index < heroSubtitleWords.length - 1 ? ' ' : ''}
                  </MotionText>
                );
              })}
            </Text>
          </MotionBox>

          {/* Enhanced CTA Buttons */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <MotionBox
            initial="hidden"
            whileInView="show"
            variants={heroCtas}
            viewport={viewportMotion}
            w="full"
            maxW="500px"
          >
            <VStack spacing={4} w="full">
              {/* Primary CTA */}
              <MotionBox whileHover={hoverLift(prefersReducedMotion)} whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}>
                <TouchButton
                  size="xl"
                  bg="linear-gradient(135deg, #001F3F, #002D6B)"
                  color="white"
                  fontWeight="bold"
                  px={8}
                  py={6}
                  fontSize="lg"
                  borderRadius="2xl"
                  rightIcon={<FaArrowRight />}
                  boxShadow="0 8px 25px rgba(0,180,255,0.6)"
                  _hover={{
                    bg: 'linear-gradient(135deg, #002D6B, #001F3F)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 35px rgba(0,240,255,0.2)',
                  }}
                  fullWidth
                  onClick={() => (window.location.href = '/booking-luxury')}
                  position="relative"
                  overflow="hidden"
                  className="hero-cta-button"
                  sx={{
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '0',
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                      animation: prefersReducedMotion ? undefined : 'wave-light-move 3s ease-in-out infinite',
                      zIndex: 1,
                    },
                    '& > span': {
                      position: 'relative',
                      zIndex: 2,
                    },
                  }}
                >
                  Book Your Move Now
                </TouchButton>
              </MotionBox>

              {/* Secondary Actions */}
              <HStack spacing={3} w="full" justify="center">
                <MotionBox flex={1} whileHover={hoverLift(prefersReducedMotion)} whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}>
                  <TouchButton
                    size="lg"
                    variant="outline"
                    borderColor="white"
                    color="white"
                    bg="rgba(255,255,255,0.1)"
                    backdropFilter="blur(10px)"
                    leftIcon={<FaTruck />}
                    _hover={{
                      bg: 'rgba(255,255,255,0.2)',
                      borderColor: 'neon.400',
                      color: 'neon.400',
                      transform: 'translateY(-2px)',
                    }}
                    borderRadius="xl"
                    fontWeight="semibold"
                    flex={1}
                    onClick={() => (window.location.href = '/track')}
                  >
                    Track Move
                  </TouchButton>
                </MotionBox>

                <MotionBox flex={1} whileHover={hoverLift(prefersReducedMotion)} whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}>
                  <Button
                    as="a"
                    href="tel:+441202129746"
                    size="lg"
                    variant="outline"
                    borderColor="white"
                    color="white"
                    bg="rgba(255,255,255,0.1)"
                    backdropFilter="blur(10px)"
                    leftIcon={<FaPhone />}
                    _hover={{
                      bg: 'rgba(255,255,255,0.2)',
                      borderColor: 'green.400',
                      color: 'green.400',
                      transform: 'translateY(-2px)',
                      textDecoration: 'none',
                    }}
                    borderRadius="xl"
                    fontWeight="semibold"
                    flex={1}
                  >
                    Call Now
                  </Button>
                </MotionBox>
              </HStack>
            </VStack>
          </MotionBox>

        </VStack>
      </Container>
    </Box>
  );
};

// Mobile Stats Section
const MobileStats: React.FC = () => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const statsStagger = useMemo(() => createStaggerContainer(prefersReducedMotion, 0.12, 0.1), [prefersReducedMotion]);

  return (
    <Box className="mobile-stats" py={{ base: 12, md: 16 }} bg="bg.surface">
      <Container maxW="container.xl">
        <VStack spacing={8}>
          <MotionBox
            initial="hidden"
            whileInView="show"
            variants={createFadeInUp(prefersReducedMotion, 0.05, 18)}
            viewport={viewportMotion}
            textAlign="center"
          >
            <Heading
              size={{ base: 'lg', md: 'xl' }}
              mb={4}
              color="text.primary"
            >
              Trusted by Thousands
            </Heading>
            <Text color="text.secondary" fontSize={{ base: 'md', md: 'lg' }}>
              Our numbers speak for themselves
            </Text>
          </MotionBox>

          <MotionBox
            initial="hidden"
            whileInView="show"
            variants={statsStagger}
            viewport={viewportMotion}
            w="full"
          >
            <SimpleGrid
              columns={4}
              spacing={{ base: 2, sm: 4, md: 6 }}
              w="full"
              minChildWidth={{ base: '70px', sm: '100px', md: '150px' }}
            >
              {stats.map((stat, index) => (
                <MotionBox
                  key={index}
                  variants={createFadeInUp(prefersReducedMotion, 0.1 + index * 0.08, 14)}
                  whileHover={hoverLift(prefersReducedMotion)}
                >
                  <Box
                    p={{ base: 3, sm: 4, md: 6 }}
                    borderRadius="xl"
                    borderWidth="2px"
                    borderColor="#00C2FF"
                    bg="bg.card"
                    textAlign="center"
                    position="relative"
                    overflow="visible"
                    boxShadow="0 0 20px rgba(0,194,255,0.3)"
                    className="stat-card-neon"
                    minW="0"
                    _hover={{
                      borderColor: `${stat.color}.400`,
                      boxShadow: '0 0 30px rgba(0,194,255,0.5)',
                    }}
                    _before={{
                      content: '""',
                      position: 'absolute',
                      top: '-2px',
                      left: '-2px',
                      right: '-2px',
                      bottom: '-2px',
                      background: 'linear-gradient(90deg, #00C2FF, #00D18F, #00C2FF, #00D18F)',
                      backgroundSize: '300% 300%',
                      borderRadius: 'xl',
                      zIndex: -1,
                      filter: 'blur(8px)',
                      opacity: 0.6,
                      animation: 'neon-glow 3s ease-in-out infinite',
                    }}
                    _after={{
                      content: '""',
                      position: 'absolute',
                      width: '10px',
                      height: '10px',
                      background: 'radial-gradient(circle, white 0%, rgba(255,255,255,0.8) 30%, transparent 70%)',
                      borderRadius: 'full',
                      boxShadow: '0 0 15px rgba(255,255,255,0.9), 0 0 30px rgba(0,194,255,0.6)',
                      zIndex: 10,
                      animation: 'light-point-move 3s linear infinite',
                    }}
                  >
                    <VStack spacing={{ base: 1, sm: 2, md: 3 }}>
                      <Box
                        p={{ base: 1.5, sm: 2 }}
                        borderRadius="lg"
                        bg={`${stat.color}.500`}
                        color="white"
                        boxSize={{ base: '32px', sm: '40px', md: '48px' }}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Icon as={stat.icon} boxSize={{ base: 3, sm: 4, md: 5 }} />
                      </Box>
                      <Text
                        fontSize={{ base: 'md', sm: 'lg', md: '2xl' }}
                        fontWeight="bold"
                        color={`${stat.color}.500`}
                        lineHeight="1.2"
                      >
                        {stat.number}
                      </Text>
                      <Text
                        color="text.secondary"
                        fontSize={{ base: '2xs', sm: 'xs', md: 'sm' }}
                        fontWeight="medium"
                        lineHeight="1.2"
                        noOfLines={2}
                      >
                        {stat.label}
                      </Text>
                    </VStack>
                  </Box>
                </MotionBox>
              ))}
            </SimpleGrid>
          </MotionBox>
        </VStack>
      </Container>
    </Box>
  );
};

// Mobile Features Section
const MobileFeatures: React.FC = () => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const featuresStagger = useMemo(() => createStaggerContainer(prefersReducedMotion, 0.14, 0.1), [prefersReducedMotion]);

  return (
    <Box className="mobile-features" py={{ base: 12, md: 16 }} bg="bg.surface">
      <Container maxW="container.xl">
        <VStack spacing={8}>
          <MotionBox
            initial="hidden"
            whileInView="show"
            variants={createFadeInUp(prefersReducedMotion, 0.05, 18)}
            viewport={viewportMotion}
            textAlign="center"
          >
            <Heading
              size={{ base: 'lg', md: 'xl' }}
              mb={4}
              color="text.primary"
            >
              Why Choose Speedy Van?
            </Heading>
            <Text color="text.secondary" fontSize={{ base: 'md', md: 'lg' }}>
              Professional moving solutions tailored to your needs
            </Text>
          </MotionBox>

          <MotionBox
            initial="hidden"
            whileInView="show"
            variants={featuresStagger}
            viewport={viewportMotion}
            w="full"
          >
            <SimpleGrid
              columns={{ base: 1, sm: 2 }}
              spacing={{ base: 4, md: 6 }}
              w="full"
            >
              {features.map((feature, index) => (
                <MotionCard
                  key={index}
                  variants={createFadeInUp(prefersReducedMotion, 0.1 + index * 0.08, 16)}
                  whileHover={hoverLift(prefersReducedMotion)}
                  p={{ base: 6, md: 8 }}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="#00C2FF"
                  bg="bg.card"
                  position="relative"
                  overflow="visible"
                  boxShadow="0 0 20px rgba(0,194,255,0.3)"
                  className="stat-card-neon"
                  _hover={{
                    borderColor: `${feature.color}.400`,
                    boxShadow: '0 0 30px rgba(0,194,255,0.5)',
                    transform: 'translateY(-4px)',
                  }}
                  cursor="pointer"
                  sx={{
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '-2px',
                      left: '-2px',
                      right: '-2px',
                      bottom: '-2px',
                      background: 'linear-gradient(90deg, #00C2FF, #00D18F, #00C2FF, #00D18F)',
                      backgroundSize: '300% 300%',
                      borderRadius: 'xl',
                      zIndex: -1,
                      filter: 'blur(8px)',
                      opacity: 0.6,
                      animation: 'neon-glow 3s ease-in-out infinite',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      width: '10px',
                      height: '10px',
                      background: 'radial-gradient(circle, white 0%, rgba(255,255,255,0.8) 30%, transparent 70%)',
                      borderRadius: 'full',
                      boxShadow: '0 0 15px rgba(255,255,255,0.9), 0 0 30px rgba(0,194,255,0.6)',
                      zIndex: 10,
                      animation: 'light-point-move 3s linear infinite',
                    },
                  }}
                >
                  <VStack spacing={4} textAlign="center">
                    <Box
                      p={3}
                      borderRadius="lg"
                      bgGradient={feature.gradient}
                      color="white"
                      boxSize={{ base: '60px', md: '70px' }}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      boxShadow="0 4px 15px rgba(0,0,0,0.2)"
                    >
                      <Icon as={feature.icon} boxSize={{ base: 6, md: 7 }} />
                    </Box>
                    <Heading size={{ base: 'md', md: 'lg' }} color="text.primary">
                      {feature.title}
                    </Heading>
                    <Text
                      color="text.secondary"
                      fontSize={{ base: 'sm', md: 'md' }}
                      lineHeight="tall"
                    >
                      {feature.description}
                    </Text>
                  </VStack>
                </MotionCard>
              ))}
            </SimpleGrid>
          </MotionBox>
        </VStack>
      </Container>
    </Box>
  );
};

// Mobile Services Section
const MobileServices: React.FC = () => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const servicesStagger = useMemo(() => createStaggerContainer(prefersReducedMotion, 0.14, 0.1), [prefersReducedMotion]);

  return (
    <Box className="mobile-services" py={{ base: 12, md: 16 }} bg="bg.surface">
      <Container maxW="container.xl">
        <VStack spacing={8}>
          <MotionBox
            initial="hidden"
            whileInView="show"
            variants={createFadeInUp(prefersReducedMotion, 0.05, 18)}
            viewport={viewportMotion}
            textAlign="center"
          >
            <Heading
              size={{ base: 'lg', md: 'xl' }}
              mb={4}
              color="text.primary"
            >
              Our Premium Services
            </Heading>
            <Text color="text.secondary" fontSize={{ base: 'md', md: 'lg' }}>
              Professional moving solutions for every need
            </Text>
          </MotionBox>

          <MotionBox
            initial="hidden"
            whileInView="show"
            variants={servicesStagger}
            viewport={viewportMotion}
            w="full"
          >
            <SimpleGrid
              columns={{ base: 1, md: 2 }}
              spacing={{ base: 4, md: 6 }}
              w="full"
            >
              {services.map((service, index) => (
                <MotionCard
                  key={index}
                  variants={createFadeInUp(prefersReducedMotion, 0.1 + index * 0.08, 16)}
                  whileHover={hoverLift(prefersReducedMotion)}
                  p={{ base: 6, md: 8 }}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="#00C2FF"
                  bg="dark.800"
                  position="relative"
                  overflow="visible"
                  boxShadow="0 0 20px rgba(0,194,255,0.3)"
                  className="stat-card-neon"
                  _hover={{
                    borderColor: 'neon.400',
                    boxShadow: '0 0 30px rgba(0,194,255,0.5)',
                    transform: 'translateY(-4px)',
                  }}
                  cursor="pointer"
                  sx={{
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '-2px',
                      left: '-2px',
                      right: '-2px',
                      bottom: '-2px',
                      background: 'linear-gradient(90deg, #00C2FF, #00D18F, #00C2FF, #00D18F)',
                      backgroundSize: '300% 300%',
                      borderRadius: 'xl',
                      zIndex: -1,
                      filter: 'blur(8px)',
                      opacity: 0.6,
                      animation: 'neon-glow 3s ease-in-out infinite',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      width: '10px',
                      height: '10px',
                      background: 'radial-gradient(circle, white 0%, rgba(255,255,255,0.8) 30%, transparent 70%)',
                      borderRadius: 'full',
                      boxShadow: '0 0 15px rgba(255,255,255,0.9), 0 0 30px rgba(0,194,255,0.6)',
                      zIndex: 10,
                      animation: 'light-point-move 3s linear infinite',
                    },
                  }}
                >

                  <VStack
                    spacing={4}
                    align="center"
                    textAlign="center"
                    position="relative"
                    zIndex={1}
                  >
                    <HStack spacing={3} align="center">
                      <Box
                        p={2}
                        borderRadius="lg"
                        bg="neon.500"
                        color="white"
                        fontSize={{ base: 'xl', md: '2xl' }}
                        boxShadow="0 4px 15px rgba(0,194,255,0.3)"
                      >
                        {service.emoji}
                      </Box>
                      <Icon
                        as={service.icon}
                        boxSize={{ base: 6, md: 8 }}
                        color="neon.400"
                      />
                    </HStack>

                    <Heading size={{ base: 'md', md: 'lg' }} color="white">
                      {service.title}
                    </Heading>

                    <Text
                      color="gray.300"
                      fontSize={{ base: 'sm', md: 'md' }}
                      lineHeight="tall"
                    >
                      {service.description}
                    </Text>

                    {/* Service Features */}
                    <VStack spacing={2} align="start" w="full">
                      {service.features.map((feature, idx) => (
                        <HStack key={idx} spacing={2}>
                          <Icon
                            as={FaCheckCircle}
                            color="green.400"
                            boxSize={3}
                          />
                          <Text color="gray.400" fontSize="xs">
                            {feature}
                          </Text>
                        </HStack>
                      ))}
                    </VStack>
                  </VStack>
                </MotionCard>
              ))}
            </SimpleGrid>
          </MotionBox>
        </VStack>
      </Container>
    </Box>
  );
};

// Mobile Testimonials Section
const MobileTestimonials: React.FC = () => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const testimonialStagger = useMemo(
    () => createStaggerContainer(prefersReducedMotion, 0.14, 0.1),
    [prefersReducedMotion]
  );

  return (
    <Box className="mobile-testimonials" py={{ base: 12, md: 16 }} bg="bg.surface">
      <Container maxW="container.xl">
        <VStack spacing={8}>
          <MotionBox
            initial="hidden"
            whileInView="show"
            variants={createFadeInUp(prefersReducedMotion, 0.05, 18)}
            viewport={viewportMotion}
            textAlign="center"
          >
            <Heading
              size={{ base: 'lg', md: 'xl' }}
              mb={4}
              color="text.primary"
            >
              What Our Customers Say
            </Heading>
            <Text color="text.secondary" fontSize={{ base: 'md', md: 'lg' }}>
              Real reviews from real customers
            </Text>
          </MotionBox>

          <MotionBox
            initial="hidden"
            whileInView="show"
            variants={testimonialStagger}
            viewport={viewportMotion}
            w="full"
          >
            <SimpleGrid
              columns={{ base: 1, md: 2, lg: 3 }}
              spacing={{ base: 4, md: 6 }}
              w="full"
            >
              {testimonials.map((testimonial, index) => (
                <MotionCard
                  key={index}
                  variants={createFadeInUp(prefersReducedMotion, 0.1 + index * 0.08, 16)}
                  whileHover={hoverLift(prefersReducedMotion)}
                  p={{ base: 6, md: 8 }}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="#00C2FF"
                  bg="bg.card"
                  position="relative"
                  overflow="visible"
                  boxShadow="0 0 20px rgba(0,194,255,0.3)"
                  className="stat-card-neon"
                  _hover={{
                    borderColor: 'neon.400',
                    boxShadow: '0 0 30px rgba(0,194,255,0.5)',
                  }}
                  sx={{
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '-2px',
                      left: '-2px',
                      right: '-2px',
                      bottom: '-2px',
                      background: 'linear-gradient(90deg, #00C2FF, #00D18F, #00C2FF, #00D18F)',
                      backgroundSize: '300% 300%',
                      borderRadius: 'xl',
                      zIndex: -1,
                      filter: 'blur(8px)',
                      opacity: 0.6,
                      animation: 'neon-glow 3s ease-in-out infinite',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      width: '10px',
                      height: '10px',
                      background: 'radial-gradient(circle, white 0%, rgba(255,255,255,0.8) 30%, transparent 70%)',
                      borderRadius: 'full',
                      boxShadow: '0 0 15px rgba(255,255,255,0.9), 0 0 30px rgba(0,194,255,0.6)',
                      zIndex: 10,
                      animation: 'light-point-move 3s linear infinite',
                    },
                  }}
                >
                  <VStack spacing={4} align="start">
                    {/* Rating */}
                    <HStack spacing={1}>
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Icon
                          key={i}
                          as={FaStar}
                          color="yellow.400"
                          boxSize={4}
                        />
                      ))}
                    </HStack>

                    {/* Quote */}
                    <Text
                      color="text.secondary"
                      fontSize={{ base: 'sm', md: 'md' }}
                      lineHeight="tall"
                      fontStyle="italic"
                    >
                      &ldquo;{testimonial.quote}&rdquo;
                    </Text>

                    {/* Customer info */}
                    <HStack spacing={3} w="full">
                      <Avatar
                        size="sm"
                        name={testimonial.name}
                        src={testimonial.avatar}
                        loading="lazy"
                        w="32px"
                        h="32px"
                      />
                      <VStack spacing={0} align="start" flex={1}>
                        <Text
                          fontSize="sm"
                          fontWeight="bold"
                          color="text.primary"
                        >
                          {testimonial.name}
                        </Text>
                        <Text fontSize="xs" color="text.tertiary">
                          {testimonial.city} • {testimonial.service}
                        </Text>
                      </VStack>
                    </HStack>
                  </VStack>
                </MotionCard>
              ))}
            </SimpleGrid>
          </MotionBox>
        </VStack>
      </Container>
    </Box>
  );
};

// Mobile CTA Section
const MobileCTA: React.FC = () => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const ctaFade = useMemo(() => createFadeInUp(prefersReducedMotion, 0.1, 18), [prefersReducedMotion]);

  return (
    <Box className="mobile-cta" py={{ base: 12, md: 16 }} bg="bg.surface">
      <Container maxW="container.xl">
        <MotionBox
          initial="hidden"
          whileInView="show"
          variants={ctaFade}
          viewport={viewportMotion}
          p={{ base: 8, md: 12 }}
          borderRadius="2xl"
          bg="bg.card"
          borderWidth="2px"
          borderColor="#00C2FF"
          textAlign="center"
          position="relative"
          overflow="visible"
          boxShadow="0 0 20px rgba(0,194,255,0.3)"
          className="stat-card-neon"
          sx={{
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '-2px',
              left: '-2px',
              right: '-2px',
              bottom: '-2px',
              background: 'linear-gradient(90deg, #00C2FF, #00D18F, #00C2FF, #00D18F)',
              backgroundSize: '300% 300%',
              borderRadius: '2xl',
              zIndex: -1,
              filter: 'blur(8px)',
              opacity: 0.6,
              animation: 'neon-glow 3s ease-in-out infinite',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              width: '10px',
              height: '10px',
              background: 'radial-gradient(circle, white 0%, rgba(255,255,255,0.8) 30%, transparent 70%)',
              borderRadius: 'full',
              boxShadow: '0 0 15px rgba(255,255,255,0.9), 0 0 30px rgba(0,194,255,0.6)',
              zIndex: 10,
              animation: 'light-point-move 3s linear infinite',
            },
          }}
        >

          <VStack spacing={6} position="relative" zIndex={1}>
            <Heading
              size={{ base: 'xl', md: '2xl' }}
              color="neon.500"
              textShadow="0 0 20px rgba(0,194,255,0.3)"
            >
              Ready to Move?
            </Heading>

            <Text
              color="text.secondary"
              fontSize={{ base: 'lg', md: 'xl' }}
              maxW="600px"
              lineHeight="tall"
            >
              Get your instant quote now and experience the UK&rsquo;s most trusted
              moving service.
            </Text>

            <Stack
              direction={{ base: 'column', md: 'row' }}
              spacing={4}
              w="full"
              maxW={{ base: '400px', md: '700px' }}
              flexWrap="wrap"
              justify="center"
            >
              <Box flex={{ base: '1 1 100%', md: '1 1 auto' }} minW={{ md: '180px' }}>
                <TouchButton
                  size="xl"
                  bg="linear-gradient(135deg, #00C2FF, #00D18F)"
                  color="white"
                  fontWeight="bold"
                  rightIcon={<FaArrowRight />}
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,194,255,0.4)',
                  }}
                  fullWidth
                  onClick={() => (window.location.href = '/booking-luxury')}
                >
                  Get Quote Now
                </TouchButton>
              </Box>

              <Box flex={{ base: '1 1 100%', md: '0 1 auto' }} minW={{ md: '150px' }}>
                <MotionBox whileHover={hoverLift(prefersReducedMotion)} whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}>
                  <TouchButton
                    size="xl"
                    variant="outline"
                    borderColor="neon.400"
                    color="neon.400"
                    leftIcon={<FaTruck />}
                    _hover={{
                      bg: 'neon.400',
                      color: 'white',
                    }}
                    fullWidth
                    onClick={() => (window.location.href = '/track')}
                  >
                    Track Move
                  </TouchButton>
                </MotionBox>
              </Box>

              <Box flex={{ base: '1 1 100%', md: '0 1 auto' }} minW={{ md: '130px' }}>
                <MotionBox whileHover={hoverLift(prefersReducedMotion)} whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}>
                  <Button
                    as="a"
                    href="tel:+441202129746"
                    size="xl"
                    variant="outline"
                    borderColor="neon.400"
                    color="neon.400"
                    leftIcon={<FaPhone />}
                    _hover={{
                      bg: 'neon.400',
                      color: 'white',
                      textDecoration: 'none',
                    }}
                    width="full"
                  >
                    Call Us
                  </Button>
                </MotionBox>
              </Box>
            </Stack>
          </VStack>
        </MotionBox>
      </Container>
    </Box>
  );
};

// Main Mobile Home Page Component
export default function MobileHomePageContent() {
  return (
    <Box 
      id="main-content"
      as="main"
      bg="bg.canvas" 
      minH="100vh" 
      w="100%" 
      maxW="100%" 
      overflowX="hidden" 
      suppressHydrationWarning
    >
      {/* Mobile Header with scroll behavior */}
      <MobileHeader />
      
      {/* Mobile Hero */}
      <MobileHero />

      {/* Mobile Stats */}
      <MobileStats />

      {/* Mobile Features */}
      <MobileFeatures />

      {/* Mobile Services */}
      <MobileServices />

      {/* Interactive Service Map */}
      <ServiceMapSection />

      {/* Mobile Testimonials */}
      <MobileTestimonials />

      {/* Mobile CTA */}
      <MobileCTA />

      {/* Home Footer */}
      <HomeFooter />

      {/* Trustpilot Widget Section */}
      <TrustpilotWidget />

      {/* Speedy AI Bot */}
      <SpeedyAIBotWrapper />
    </Box>
  );
}