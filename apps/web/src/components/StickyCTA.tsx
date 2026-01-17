'use client';

import { Box, Button, Container, Flex, Text, Icon, HStack } from '@chakra-ui/react';
import { FaArrowRight, FaPhone, FaWhatsapp } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const MotionBox = motion.create(Box);

export default function StickyCTA() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show CTA after scrolling 400px
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBooking = () => {
    const bookingSection = document.getElementById('booking-section');
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <MotionBox
          position="fixed"
          bottom={{ base: 4, md: 6 }}
          left="50%"
          transform="translateX(-50%)"
          zIndex={999}
          width="100%"
          maxW="container.xl"
          px={{ base: 4, md: 6 }}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <Container
            maxW="container.lg"
            bg="rgba(255, 255, 255, 0.98)"
            backdropFilter="blur(20px)"
            borderRadius="2xl"
            boxShadow="0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.5)"
            border="1px solid"
            borderColor="rgba(255, 255, 255, 0.8)"
            p={{ base: 3, md: 4 }}
          >
            <Flex
              direction={{ base: 'column', md: 'row' }}
              align="center"
              justify="space-between"
              gap={{ base: 3, md: 4 }}
            >
              {/* Left Side - Text */}
              <Box flex="1" display={{ base: 'none', md: 'block' }}>
                <Text fontSize="lg" fontWeight="bold" color="gray.800" mb={0.5}>
                  Ready to move? Get instant quote in 30 seconds
                </Text>
                <Text fontSize="sm" color="gray.600">
                  ✓ No hidden fees ✓ Instant confirmation ✓ Professional drivers
                </Text>
              </Box>

              {/* Mobile Text - Shorter */}
              <Box flex="1" display={{ base: 'block', md: 'none' }} textAlign="center">
                <Text fontSize="md" fontWeight="bold" color="gray.800">
                  Get instant quote now
                </Text>
              </Box>

              {/* Right Side - CTAs */}
              <HStack spacing={3}>
                {/* Phone Button - Hidden on mobile */}
                <Button
                  size={{ base: 'md', md: 'lg' }}
                  colorScheme="blue"
                  variant="outline"
                  leftIcon={<Icon as={FaPhone} />}
                  display={{ base: 'none', lg: 'flex' }}
                  as="a"
                  href="tel:+442036677247"
                  _hover={{ transform: 'scale(1.05)' }}
                  transition="all 0.2s"
                >
                  Call Now
                </Button>

                {/* WhatsApp Button */}
                <Button
                  size={{ base: 'md', md: 'lg' }}
                  colorScheme="whatsapp"
                  leftIcon={<Icon as={FaWhatsapp} />}
                  as="a"
                  href="https://wa.me/442036677247"
                  target="_blank"
                  display={{ base: 'flex', md: 'none' }}
                  _hover={{ transform: 'scale(1.05)' }}
                  transition="all 0.2s"
                >
                  WhatsApp
                </Button>

                {/* Main CTA Button */}
                <Button
                  size={{ base: 'md', md: 'lg' }}
                  colorScheme="brand"
                  bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  color="white"
                  rightIcon={<Icon as={FaArrowRight} />}
                  onClick={scrollToBooking}
                  px={{ base: 6, md: 8 }}
                  fontSize={{ base: 'md', md: 'lg' }}
                  fontWeight="bold"
                  boxShadow="0 10px 30px rgba(102, 126, 234, 0.4)"
                  _hover={{
                    transform: 'scale(1.05)',
                    boxShadow: '0 15px 40px rgba(102, 126, 234, 0.5)',
                  }}
                  transition="all 0.2s"
                >
                  Book Now
                </Button>
              </HStack>
            </Flex>
          </Container>
        </MotionBox>
      )}
    </AnimatePresence>
  );
}
