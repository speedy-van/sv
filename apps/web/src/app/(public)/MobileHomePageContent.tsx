'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  AspectRatio,
  Avatar,
  Badge,
  Icon,
  Stack,
  Image,
  VisuallyHidden,
  chakra,
  shouldForwardProp,
  Button,
  usePrefersReducedMotion,
} from '@chakra-ui/react';
import Link from 'next/link';
import { motion, isValidMotionProp } from 'framer-motion';
import dynamic from 'next/dynamic';
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
import { SiAfterpay, SiKlarna } from 'react-icons/si';
import { TouchButton } from '@/components/mobile/TouchOptimizedComponents';
import MobileHeader from '@/components/mobile/MobileHeader';
import MarqueeText from '@/components/MarqueeText';

// Lazy load non-critical components
const HomeFooter = dynamic(() => import('@/components/site/HomeFooter'), {
  ssr: false,
  loading: () => null,
});

const LiveBookingCounter = dynamic(() => import('@/components/LiveBookingCounter'), {
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

const seoServices = [
  {
    title: 'Furniture Transport',
    description: 'Professional movers to transport sofas, tables, chairs and beds across England, Scotland, and Wales.',
    icon: '🛋️',
    color: 'blue',
    link: '/furniture-removal',
  },
  {
    title: 'Long Distance House Mover',
    description: 'Stress-free house moves anywhere in the UK. Guaranteed best prices from £25/hour.',
    icon: '🏠',
    color: 'green',
    link: '/house-removals',
  },
  {
    title: 'Packers and Movers',
    description: 'Expert packing and moving services. Get instant quotes and book today.',
    icon: '📦',
    color: 'purple',
    link: '/man-and-van',
  },
  {
    title: 'Removal Companies',
    description: 'From small moves to large relocations. Affordable and reliable removal services.',
    icon: '🚚',
    color: 'orange',
    link: '/office-removals',
  },
  {
    title: 'Large Item Movers',
    description: 'Specialist large item delivery. Serving all UK destinations with competitive rates.',
    icon: '📏',
    color: 'cyan',
    link: '/single-item-delivery',
  },
];

const commonItemImages = [
  {
    src: '/UK_Removal_Dataset/Images_Only/Living_room_Furniture/sofa_3_seat_fabric_modern_lestar_jpg_48kg.jpg',
    alt: 'Three-seat fabric sofa ready for moving',
    label: '3-Seater Sofa',
  },
  {
    src: '/UK_Removal_Dataset/Images_Only/Bedroom/double_bed_frame_harper_storage_mattress_jpg_45kg.jpg',
    alt: 'Double bed frame with storage drawers',
    label: 'Double Bed',
  },
  {
    src: '/UK_Removal_Dataset/Images_Only/Wardrobes_closet/wardrobe_double_door_harmony_wood_better_home_jpg_68kg.jpg',
    alt: 'Two-door wooden wardrobe',
    label: '2-Door Wardrobe',
  },
  {
    src: '/UK_Removal_Dataset/Images_Only/Bag_luggage_box/moving_boxes_8_best_top_moving_house_boxes_jpg_18kg.jpg',
    alt: 'Stack of labeled moving boxes',
    label: 'Moving Boxes',
  },
  {
    src: '/UK_Removal_Dataset/Images_Only/Kitchen_appliances/washing_machine_standard_dimensions_jpg_75kg.jpg',
    alt: 'Front-load washing machine',
    label: 'Washing Machine',
  },
  {
    src: '/UK_Removal_Dataset/Images_Only/Kitchen_appliances/american_fridge_freezer_bosch_jpg_145kg.jpg',
    alt: 'American-style fridge freezer',
    label: 'Fridge Freezer',
  },
] as const;

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
        py: { base: '20px', md: '80px' },
        pt: { base: 'calc(env(safe-area-inset-top) + 118px)', md: '100px' },
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

      {/* Strong Dark Overlay for better text readability */}
      <Box
        position="absolute"
        top="0"
        left="0"
        width="100%"
        height="100%"
        bg="linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.5) 100%)"
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
          {/* Live Booking Counter */}
          <MotionBox
            initial="hidden"
            whileInView="show"
            variants={heroStagger}
            viewport={viewportMotion}
            mt={{ base: 2, md: 12, lg: 28 }}
          >
            <Box>
              <LiveBookingCounter />
            </Box>
          </MotionBox>

          {/* Main Heading */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <MotionBox
            initial="hidden"
            whileInView="show"
            variants={heroHeadline}
            viewport={viewportMotion}
          >
            <VisuallyHidden>Facebook Marketplace Pickup and Furniture Delivery Service UK</VisuallyHidden>
            <Heading
              as="h1"
              fontSize={{ base: '2xl', sm: '3xl', md: '4xl' }}
              fontWeight="bold"
              color="white"
              textAlign="center"
              lineHeight="1.2"
              textShadow="0 2px 20px rgba(0,0,0,0.5)"
            >
              Your Move, Made Easy
            </Heading>
          </MotionBox>

          {/* Subheadline */}
          <MotionBox
            initial="hidden"
            whileInView="show"
            variants={heroSubheadline}
            viewport={viewportMotion}
            mt={{ base: 2, md: 4 }}
          >
            <Text
              fontSize={{ base: 'sm', md: 'md' }}
              color="whiteAlpha.900"
              fontWeight="medium"
              maxW="400px"
              mx="auto"
              textShadow="0 2px 10px rgba(0,0,0,0.8)"
            >
              From £25/hour • Same-day service • Fully insured
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
            mt={{ base: 4, md: 6 }}
          >
            <VStack spacing={3} w="full">
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

              {/* Popular Deliveries Pills */}
              <Box w="full" mt={5}>
                <Text
                  fontSize="xs"
                  color="whiteAlpha.700"
                  fontWeight="medium"
                  mb={2}
                  textAlign="center"
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  Popular Deliveries
                </Text>
                <Flex
                  gap={2}
                  flexWrap="wrap"
                  justify="center"
                  maxW="full"
                >
                  <Button
                    as={Link}
                    href="/facebook-marketplace-delivery"
                    size="sm"
                    bg="rgba(255,255,255,0.15)"
                    backdropFilter="blur(10px)"
                    color="white"
                    fontSize="xs"
                    fontWeight="semibold"
                    borderRadius="full"
                    px={4}
                    py={2}
                    h="auto"
                    border="1px solid"
                    borderColor="whiteAlpha.300"
                    _hover={{ 
                      bg: 'rgba(0,194,255,0.3)', 
                      borderColor: 'cyan.400',
                      transform: 'translateY(-2px)',
                      textDecoration: 'none'
                    }}
                    transition="all 0.2s"
                    leftIcon={<Text fontSize="sm">📦</Text>}
                  >
                    Facebook Marketplace
                  </Button>
                  <Button
                    as={Link}
                    href="/gumtree-pickup-delivery"
                    size="sm"
                    bg="rgba(255,255,255,0.15)"
                    backdropFilter="blur(10px)"
                    color="white"
                    fontSize="xs"
                    fontWeight="semibold"
                    borderRadius="full"
                    px={4}
                    py={2}
                    h="auto"
                    border="1px solid"
                    borderColor="whiteAlpha.300"
                    _hover={{ 
                      bg: 'rgba(0,209,143,0.3)', 
                      borderColor: 'green.400',
                      transform: 'translateY(-2px)',
                      textDecoration: 'none'
                    }}
                    transition="all 0.2s"
                    leftIcon={<Text fontSize="sm">🌳</Text>}
                  >
                    Gumtree
                  </Button>
                  <Button
                    as={Link}
                    href="/sofa-delivery-service"
                    size="sm"
                    bg="rgba(255,255,255,0.15)"
                    backdropFilter="blur(10px)"
                    color="white"
                    fontSize="xs"
                    fontWeight="semibold"
                    borderRadius="full"
                    px={4}
                    py={2}
                    h="auto"
                    border="1px solid"
                    borderColor="whiteAlpha.300"
                    _hover={{ 
                      bg: 'rgba(147,51,234,0.3)', 
                      borderColor: 'purple.400',
                      transform: 'translateY(-2px)',
                      textDecoration: 'none'
                    }}
                    transition="all 0.2s"
                    leftIcon={<FaCouch size={12} />}
                  >
                    Sofa Delivery
                  </Button>
                </Flex>
              </Box>
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
    <Box className="mobile-stats" py={{ base: 12, md: 16 }} bg="transparent">
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
                    borderWidth="1px"
                    borderColor="#1f2937"
                    bg="rgba(0,0,0,0.9)"
                    textAlign="center"
                    position="relative"
                    overflow="visible"
                    boxShadow="0 10px 35px rgba(0,0,0,0.6)"
                    className="stat-card-neon"
                    minW="0"
                    _hover={{
                      borderColor: `${stat.color}.400`,
                      boxShadow: '0 0 30px rgba(0,194,255,0.4)',
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
    <Box className="mobile-features" py={{ base: 12, md: 16 }} bg="transparent">
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
            <HStack
              spacing={2}
              mt={2}
              justify="center"
              flexWrap="wrap"
              color="text.secondary"
            >
              <Badge colorScheme="teal" variant="subtle" borderRadius="full" px={3} py={1} fontSize="xs">
                Book now, pay later
              </Badge>
              <HStack spacing={2} flexWrap="wrap">
                <HStack
                  spacing={1}
                  px={2}
                  py={1}
                  borderRadius="full"
                  bg="whiteAlpha.100"
                  borderWidth="1px"
                  borderColor="whiteAlpha.200"
                >
                  <Icon as={SiKlarna} boxSize={4} />
                  <Text fontSize="xs">Klarna</Text>
                </HStack>
                <HStack
                  spacing={1}
                  px={2}
                  py={1}
                  borderRadius="full"
                  bg="whiteAlpha.100"
                  borderWidth="1px"
                  borderColor="whiteAlpha.200"
                >
                  <Icon as={SiAfterpay} boxSize={4} />
                  <Text fontSize="xs">Clearpay</Text>
                </HStack>
              </HStack>
              <Text fontSize="xs">
                Appears at checkout when eligible.
              </Text>
            </HStack>
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
                  borderWidth="1px"
                  borderColor="#1f2937"
                  bg="rgba(0,0,0,0.9)"
                  position="relative"
                  overflow="visible"
                  boxShadow="0 10px 35px rgba(0,0,0,0.6)"
                  className="stat-card-neon"
                  _hover={{
                    borderColor: `${feature.color}.400`,
                    boxShadow: '0 0 30px rgba(0,194,255,0.4)',
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
    <Box className="mobile-services" py={{ base: 12, md: 16 }} bg="transparent">
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
            <Text color="whiteAlpha.700" fontSize={{ base: 'md', md: 'lg' }}>
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
                  borderWidth="1px"
                  borderColor="#1f2937"
                  bg="rgba(0,0,0,0.9)"
                  position="relative"
                  overflow="visible"
                  boxShadow="0 10px 35px rgba(0,0,0,0.6)"
                  className="stat-card-neon"
                  _hover={{
                    borderColor: 'neon.400',
                    boxShadow: '0 0 30px rgba(0,194,255,0.4)',
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

// SEO Services Section
const SEOServicesSection: React.FC = () => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const seoStagger = useMemo(() => createStaggerContainer(prefersReducedMotion, 0.12, 0.1), [prefersReducedMotion]);

  return (
    <Box className="seo-services" py={{ base: 12, md: 16 }} bg="transparent">
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
              Comprehensive Moving Solutions
            </Heading>
            <Text color="whiteAlpha.700" fontSize={{ base: 'md', md: 'lg' }}>
              Expert services tailored to your moving needs
            </Text>
          </MotionBox>

          <MotionBox
            initial="hidden"
            whileInView="show"
            variants={seoStagger}
            viewport={viewportMotion}
            w="full"
          >
            <SimpleGrid
              columns={{ base: 1, md: 2, lg: 3 }}
              spacing={{ base: 4, md: 6 }}
              w="full"
            >
              {seoServices.map((service, index) => (
                <Link 
                  key={index}
                  href={service.link}
                  style={{ textDecoration: 'none' }}
                >
                  <MotionCard
                    variants={createFadeInUp(prefersReducedMotion, 0.1 + index * 0.08, 16)}
                    whileHover={hoverLift(prefersReducedMotion)}
                    p={{ base: 6, md: 7 }}
                    borderRadius="2xl"
                    borderWidth="2px"
                    borderColor="rgba(0,194,255,0.2)"
                    bg="linear-gradient(135deg, rgba(0,0,0,0.95), rgba(15,23,42,0.95))"
                    position="relative"
                    overflow="hidden"
                    boxShadow="0 10px 40px rgba(0,0,0,0.7)"
                    transition="all 0.3s ease"
                    cursor="pointer"
                    _hover={{
                      borderColor: 'rgba(0,229,255,0.6)',
                      boxShadow: '0 0 40px rgba(0,194,255,0.5)',
                      transform: 'translateY(-8px)',
                    }}
                    sx={{
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: `linear-gradient(90deg, transparent, rgba(0,229,255,0.8), transparent)`,
                        opacity: 0,
                        transition: 'opacity 0.3s',
                      },
                      '&:hover::before': {
                        opacity: 1,
                      },
                    }}
                  >
                  <VStack spacing={4} align="center" textAlign="center">
                    {/* Icon */}
                    <Box
                      fontSize={{ base: '3xl', md: '4xl' }}
                      w="70px"
                      h="70px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      borderRadius="xl"
                      bg={`linear-gradient(135deg, rgba(0,194,255,0.15), rgba(16,185,129,0.15))`}
                      border="2px solid"
                      borderColor={`rgba(0,229,255,0.3)`}
                      boxShadow="0 4px 20px rgba(0,194,255,0.3)"
                      transition="all 0.3s"
                      _groupHover={{
                        transform: 'scale(1.1) rotateY(10deg)',
                        boxShadow: '0 8px 30px rgba(0,194,255,0.5)',
                      }}
                    >
                      {service.icon}
                    </Box>

                    {/* Title */}
                    <Heading 
                      size={{ base: 'sm', md: 'md' }} 
                      color="white"
                      lineHeight="short"
                    >
                      {service.title}
                    </Heading>

                    {/* Description */}
                    <Text
                      color="gray.400"
                      fontSize={{ base: 'sm', md: 'md' }}
                      lineHeight="tall"
                    >
                      {service.description}
                    </Text>
                  </VStack>
                </MotionCard>
                </Link>
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
    <Box className="mobile-testimonials" py={{ base: 12, md: 16 }} bg="transparent">
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
            <Text color="whiteAlpha.700" fontSize={{ base: 'md', md: 'lg' }}>
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
                  borderWidth="1px"
                  borderColor="#1f2937"
                  bg="rgba(0,0,0,0.9)"
                  position="relative"
                  overflow="visible"
                  boxShadow="0 10px 35px rgba(0,0,0,0.6)"
                  className="stat-card-neon"
                  _hover={{
                    borderColor: 'neon.400',
                    boxShadow: '0 0 30px rgba(0,194,255,0.4)',
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
                        w="40px"
                        h="40px"
                        border="2px solid"
                        borderColor="cyan.400"
                        boxShadow="0 4px 12px rgba(0,194,255,0.3)"
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
    <Box className="mobile-cta" py={{ base: 12, md: 16 }} bg="transparent">
      <Container maxW="container.xl">
        <MotionBox
          initial="hidden"
          whileInView="show"
          variants={ctaFade}
          viewport={viewportMotion}
          p={{ base: 8, md: 12 }}
          borderRadius="2xl"
          bg="rgba(0,0,0,0.9)"
          borderWidth="1px"
          borderColor="#1f2937"
          textAlign="center"
          position="relative"
          overflow="visible"
          boxShadow="0 10px 35px rgba(0,0,0,0.6)"
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
              color="whiteAlpha.700"
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
      position="relative"
      bg="#000000" 
      minH="100vh" 
      w="100%" 
      maxW="100%" 
      overflowX="hidden" 
      overflowY="hidden"
      color="white"
      suppressHydrationWarning
      sx={{
        scrollMarginTop: { base: '72px', md: '120px', lg: '140px' },
      }}
    >
      {/* Snow overlay for homepage */}
      <Box
        aria-hidden
        position="fixed"
        inset={0}
        pointerEvents="none"
        zIndex={0}
        backgroundImage={
          'radial-gradient(rgba(255,255,255,0.55) 1.2px, transparent 1.2px),' +
          'radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)'
        }
        backgroundSize="140px 140px, 90px 90px"
        backgroundPosition="0 0, 60px 60px"
        opacity={0.85}
        mixBlendMode="screen"
        sx={{
          animation: 'snowMoveHome 18s linear infinite',
          '@keyframes snowMoveHome': {
            '0%': { backgroundPosition: '0 0, 60px 60px' },
            '100%': { backgroundPosition: '0 320px, 60px 380px' },
          },
        }}
      />
      {/* Mobile Header - no wrapper needed since MobileHeader is position:fixed with high z-index */}
      <MobileHeader />
      
      {/* Mobile Hero */}
      <Box position="relative" zIndex={1}>
        <MobileHero />
      </Box>

      {/* Mobile Stats */}
      <Box position="relative" zIndex={1}>
        <MobileStats />
      </Box>

      {/* Mobile Features */}
      <Box position="relative" zIndex={1}>
        <MobileFeatures />
      </Box>

      {/* Mobile Services */}
      <Box position="relative" zIndex={1}>
        <MobileServices />
      </Box>

      {/* SEO Services Section */}
      <Box position="relative" zIndex={1}>
        <SEOServicesSection />
      </Box>

      {/* Interactive Service Map */}
      <Box position="relative" zIndex={1}>
        <ServiceMapSection />
      </Box>

      {/* Mobile Testimonials */}
      <Box position="relative" zIndex={1}>
        <MobileTestimonials />
      </Box>

      {/* Mobile CTA */}
      <Box position="relative" zIndex={1}>
        <MobileCTA />
      </Box>

      {/* Home Footer */}
      {/* Trustpilot Widget Section - moved above footer */}
      <Box position="relative" zIndex={1}>
        <TrustpilotWidget />
      </Box>

      <Box position="relative" zIndex={1}>
        <HomeFooter />
      </Box>

      {/* Speedy AI Bot */}
      <Box position="relative" zIndex={1}>
        <SpeedyAIBotWrapper />
      </Box>
    </Box>
  );
}