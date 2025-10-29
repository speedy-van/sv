'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  HStack,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  Link,
  Text,
  Button,
  useBreakpointValue,
} from '@chakra-ui/react';
import { FiMenu, FiX, FiUser, FiLogIn, FiUserPlus, FiMapPin, FiFileText, FiShield } from 'react-icons/fi';
import { FaPhone, FaTruck, FaStar, FaQuestionCircle } from 'react-icons/fa';

export default function MobileHeader() {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDifference = Math.abs(currentScrollY - lastScrollY);
      
      // Only update if scroll difference is significant (prevents flickering)
      if (scrollDifference < 5) return;
      
      // Show header when scrolling up, hide when scrolling down
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHeaderVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    // Throttle scroll events for better performance
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
    };
  }, [lastScrollY]);

  if (!isMobile) return null;

  return (
    <>
      <Box
        className={`mobile-header ${isHeaderVisible ? 'visible' : 'hidden'}`}
        bg="rgba(15, 17, 20, 0.95)"
        backdropFilter="blur(10px)"
        borderBottom="1px solid rgba(45, 55, 72, 0.3)"
        px={4}
        py={3}
      >
        <Flex justify="space-between" align="center">
          {/* Logo */}
          <Link href="/" _hover={{ textDecoration: 'none' }}>
            <HStack spacing={2}>
              <Box
                w={8}
                h={8}
                bg="linear-gradient(135deg, #00C2FF, #00D18F)"
                borderRadius="md"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="white"
                fontWeight="bold"
                fontSize="sm"
              >
                SV
              </Box>
              <Text
                fontSize="lg"
                fontWeight="bold"
                color="white"
                display={{ base: 'none', sm: 'block' }}
              >
                Speedy Van
              </Text>
            </HStack>
          </Link>

          {/* Right side buttons */}
          <HStack spacing={2}>
            {/* Call Now Button */}
            <Button
              size="sm"
              bg="linear-gradient(135deg, #00D18F, #00C2FF)"
              color="white"
              fontWeight="bold"
              boxShadow="0 4px 15px rgba(0,209,143,0.3)"
              leftIcon={<FaPhone />}
              onClick={() => window.open('tel:+441202129746')}
              position="relative"
              overflow="hidden"
              transition="all 0.3s ease"
              _hover={{
                bg: 'linear-gradient(135deg, #00C2FF, #00D18F)',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(0,209,143,0.4)',
              }}
              _before={{
                content: '""',
                position: 'absolute',
                top: '0',
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                animation: 'waveMove 2s infinite linear',
                pointerEvents: 'none',
              }}
              css={{
                '@keyframes waveMove': {
                  '0%': {
                    left: '-100%',
                  },
                  '100%': {
                    left: '100%',
                  },
                },
              }}
            >
              Call Now
            </Button>

            {/* Menu Button */}
            <IconButton
              aria-label="Open menu"
              icon={isOpen ? <FiX /> : <FiMenu />}
              variant="ghost"
              color="white"
              _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
              onClick={isOpen ? onClose : onOpen}
              size="sm"
            />
          </HStack>
        </Flex>
      </Box>

      {/* Mobile Drawer */}
      <Drawer
        isOpen={isOpen}
        placement="right"
        onClose={onClose}
        size="xs"
      >
        <DrawerOverlay bg="blackAlpha.700" backdropFilter="blur(10px)" />
        <DrawerContent 
          bg="linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(15, 17, 20, 0.98) 100%)"
          backdropFilter="blur(20px)"
          borderLeft="1px solid"
          borderColor="rgba(59, 130, 246, 0.3)"
        >
          <DrawerCloseButton color="white" _hover={{ bg: 'whiteAlpha.200' }} />
          <DrawerHeader 
            borderBottomWidth="1px" 
            borderColor="rgba(59, 130, 246, 0.3)"
            bg="rgba(30, 64, 175, 0.1)"
          >
            <Text color="white" fontWeight="bold" fontSize="xl">
              Menu
            </Text>
          </DrawerHeader>

          <DrawerBody p={0} bg="rgba(15, 17, 20, 0.95)">
            <VStack spacing={0} align="stretch">
              <Link
                href="/"
                p={4}
                borderBottom="1px solid"
                borderColor="rgba(59, 130, 246, 0.2)"
                _hover={{ bg: 'rgba(30, 64, 175, 0.2)' }}
                onClick={onClose}
              >
                <HStack spacing={3}>
                  <FiUser color="#3B82F6" />
                  <Text color="white">Home</Text>
                </HStack>
              </Link>
              
              <Link
                href="/services"
                p={4}
                borderBottom="1px solid"
                borderColor="rgba(59, 130, 246, 0.2)"
                _hover={{ bg: 'rgba(30, 64, 175, 0.2)' }}
                onClick={onClose}
              >
                <HStack spacing={3}>
                  <FaTruck color="#3B82F6" />
                  <Text color="white">Services</Text>
                </HStack>
              </Link>
              
              <Link
                href="/pricing"
                p={4}
                borderBottom="1px solid"
                borderColor="rgba(59, 130, 246, 0.2)"
                _hover={{ bg: 'rgba(30, 64, 175, 0.2)' }}
                onClick={onClose}
              >
                <HStack spacing={3}>
                  <FaStar color="#3B82F6" />
                  <Text color="white">Pricing</Text>
                </HStack>
              </Link>
              
              <Link
                href="/track"
                p={4}
                borderBottom="1px solid"
                borderColor="rgba(59, 130, 246, 0.2)"
                _hover={{ bg: 'rgba(30, 64, 175, 0.2)' }}
                onClick={onClose}
              >
                <HStack spacing={3}>
                  <FiMapPin color="#3B82F6" />
                  <Text color="white">Track Move</Text>
                </HStack>
              </Link>
              
              <Link
                href="/about"
                p={4}
                borderBottom="1px solid"
                borderColor="rgba(59, 130, 246, 0.2)"
                _hover={{ bg: 'rgba(30, 64, 175, 0.2)' }}
                onClick={onClose}
              >
                <HStack spacing={3}>
                  <FiFileText color="#3B82F6" />
                  <Text color="white">About Us</Text>
                </HStack>
              </Link>
              
              <Link
                href="/contact"
                p={4}
                borderBottom="1px solid"
                borderColor="rgba(59, 130, 246, 0.2)"
                _hover={{ bg: 'rgba(30, 64, 175, 0.2)' }}
                onClick={onClose}
              >
                <HStack spacing={3}>
                  <FaQuestionCircle color="#3B82F6" />
                  <Text color="white">Contact</Text>
                </HStack>
              </Link>

              <Box p={3} bg="rgba(30, 64, 175, 0.15)" borderBottom="1px solid" borderColor="rgba(59, 130, 246, 0.2)">
                <Text fontSize="sm" color="rgba(255,255,255,0.7)" fontWeight="semibold" mb={2}>
                  DRIVER
                </Text>
              </Box>
              
              <Link
                href="/driver-application"
                p={4}
                borderBottom="1px solid"
                borderColor="rgba(59, 130, 246, 0.2)"
                _hover={{ bg: 'rgba(30, 64, 175, 0.2)' }}
                onClick={onClose}
              >
                <HStack spacing={3}>
                  <FiUserPlus color="#06B6D4" />
                  <Text color="white">Apply to Drive</Text>
                </HStack>
              </Link>

              <Box p={3} bg="rgba(30, 64, 175, 0.15)" borderBottom="1px solid" borderColor="rgba(59, 130, 246, 0.2)">
                <Text fontSize="sm" color="rgba(255,255,255,0.7)" fontWeight="semibold" mb={2}>
                  LEGAL
                </Text>
              </Box>
              
              <Link
                href="/privacy"
                p={4}
                borderBottom="1px solid"
                borderColor="rgba(59, 130, 246, 0.2)"
                _hover={{ bg: 'rgba(30, 64, 175, 0.2)' }}
                onClick={onClose}
              >
                <HStack spacing={3}>
                  <FiShield color="#3B82F6" />
                  <Text color="white">Privacy Policy</Text>
                </HStack>
              </Link>
              
              <Link
                href="/terms"
                p={4}
                borderBottom="1px solid"
                borderColor="rgba(59, 130, 246, 0.2)"
                _hover={{ bg: 'rgba(30, 64, 175, 0.2)' }}
                onClick={onClose}
              >
                <HStack spacing={3}>
                  <FiFileText color="#3B82F6" />
                  <Text color="white">Terms of Service</Text>
                </HStack>
              </Link>

              <Box p={3} bg="rgba(30, 64, 175, 0.15)" borderBottom="1px solid" borderColor="rgba(59, 130, 246, 0.2)">
                <Text fontSize="sm" color="rgba(255,255,255,0.7)" fontWeight="semibold" mb={2}>
                  ACCOUNT
                </Text>
              </Box>
              
              <Link
                href="/auth/login"
                p={4}
                borderBottom="1px solid"
                borderColor="rgba(59, 130, 246, 0.2)"
                _hover={{ bg: 'rgba(30, 64, 175, 0.2)' }}
                onClick={onClose}
              >
                <HStack spacing={3}>
                  <FiLogIn color="#3B82F6" />
                  <Text color="white">Sign In</Text>
                </HStack>
              </Link>
              
              <Link
                href="/auth/register"
                p={4}
                borderBottom="1px solid"
                borderColor="rgba(59, 130, 246, 0.2)"
                _hover={{ bg: 'rgba(30, 64, 175, 0.2)' }}
                onClick={onClose}
              >
                <HStack spacing={3}>
                  <FiUserPlus color="#3B82F6" />
                  <Text color="white">Sign Up</Text>
                </HStack>
              </Link>

              <Box p={4} bg="rgba(30, 64, 175, 0.1)" borderTop="1px solid" borderColor="rgba(59, 130, 246, 0.3)">
                <VStack spacing={3}>
                  <Button
                    size="lg"
                    bg="linear-gradient(135deg, #3B82F6, #06B6D4)"
                    color="white"
                    fontWeight="bold"
                    w="full"
                    boxShadow="0 4px 15px rgba(59,130,246,0.4)"
                    _hover={{
                      bg: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(59, 130, 246, 0.5)',
                    }}
                    onClick={() => {
                      window.location.href = '/booking-luxury';
                      onClose();
                    }}
                    position="relative"
                    overflow="hidden"
                    _before={{
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                      animation: 'wave 2s infinite',
                    }}
                    sx={{
                      '@keyframes wave': {
                        '0%': {
                          left: '-100%',
                        },
                        '100%': {
                          left: '100%',
                        },
                      },
                    }}
                  >
                    Book Your Move
                  </Button>
                  
                  <Button
                    size="md"
                    variant="outline"
                    color="white"
                    borderColor="rgba(59, 130, 246, 0.5)"
                    w="full"
                    _hover={{
                      bg: 'rgba(59, 130, 246, 0.2)',
                      transform: 'translateY(-1px)',
                      borderColor: '#3B82F6',
                    }}
                    onClick={() => {
                      window.open('tel:+441202129746');
                      onClose();
                    }}
                    leftIcon={<FaPhone />}
                  >
                    Call Now
                  </Button>
                </VStack>
              </Box>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}
