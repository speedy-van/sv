'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  HStack,
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
} from '@chakra-ui/react';
import { FiMenu, FiX, FiUser, FiLogIn, FiUserPlus, FiMapPin, FiFileText, FiShield, FiMessageCircle } from 'react-icons/fi';
import { FaPhone, FaTruck, FaStar, FaQuestionCircle, FaWhatsapp } from 'react-icons/fa';
import { WhatsAppIconLink, openWhatsAppLink } from '@/components/shared/WhatsAppEntryPoint';

export default function MobileHeader() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  // CRITICAL: Always render, always visible - no scroll hiding on mobile
  // CSS handles responsive display (mobile vs desktop)

  return (
    <>
      <Box
        className="mobile-header mobile-header-visible"
        position="fixed"
        top="0"
        left="0"
        right="0"
        w="100%"
        bg="rgba(13, 13, 13, 0.97)"
        backdropFilter="blur(10px)"
        borderBottom="1px solid rgba(55, 65, 81, 0.8)"
        px={3}
        py={2}
        zIndex={1000}
        boxShadow="0 2px 12px rgba(0,0,0,0.4)"
        suppressHydrationWarning
        display={{ base: 'block', md: 'none' }}
        visibility="visible"
        opacity={1}
        sx={{
          '@media (max-width: 767px)': {
            display: 'block !important',
            visibility: 'visible !important',
            opacity: '1 !important',
          },
          '@media (min-width: 768px)': {
            display: 'none !important',
          }
        }}
      >
        <Flex justify="space-between" align="center" h="56px">
          {/* Logo */}
          <Link href="/" _hover={{ textDecoration: 'none' }}>
            <Box
              position="relative"
              w="65px"
              h="65px"
              borderRadius="full"
              overflow="hidden"
              _before={{
                content: '""',
                position: 'absolute',
                top: '-3px',
                left: '-3px',
                right: '-3px',
                bottom: '-3px',
                borderRadius: 'full',
                background: 'linear-gradient(135deg, #00C2FF, #00D18F)',
                opacity: 0.5,
                filter: 'blur(6px)',
                animation: 'pulse 2s ease-in-out infinite',
                zIndex: -1,
              }}
            >
              <Box
                as="video"
                src="/logo/sv-logo.mp4"
                autoPlay
                loop
                muted
                playsInline
                w="100%"
                h="100%"
                objectFit="cover"
                border="2px solid"
                borderColor="#00C2FF"
                boxShadow="0 0 15px rgba(0,194,255,0.5)"
                transition="all 0.3s ease"
                sx={{
                  borderRadius: 'full',
                }}
                onLoadedMetadata={(e: any) => {
                  e.target.playbackRate = 0.5;
                }}
              />
            </Box>
          </Link>

          {/* Right side - Clean icon buttons */}
          <HStack
            spacing={2}
            flexShrink={0}
          >
            {/* Live Chat Button - Icon Only */}
            <Box
              as="button"
              aria-label="Live chat"
              onClick={() => {
                if (typeof window === 'undefined') return;
                // Redirect to booking-luxury with openChat parameter
                window.location.href = '/booking-luxury?openChat=1';
              }}
              w="42px"
              h="42px"
              minW="42px"
              borderRadius="full"
              bg="linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)"
              color="white"
              boxShadow="0 3px 10px rgba(37, 99, 235, 0.35)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              transition="all 0.2s ease"
              _hover={{
                bg: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)',
                transform: 'scale(1.05)',
              }}
              _active={{
                transform: 'scale(0.95)',
              }}
              suppressHydrationWarning
            >
              <FiMessageCircle size={20} />
            </Box>
            
            {/* WhatsApp Button - Icon Only */}
            <Box
              as="button"
              aria-label="WhatsApp"
              onClick={() => openWhatsAppLink('mobile_header')}
              w="42px"
              h="42px"
              minW="42px"
              borderRadius="full"
              bg="linear-gradient(135deg, #25D366, #128C7E)"
              color="white"
              boxShadow="0 3px 10px rgba(37, 211, 102, 0.35)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              transition="all 0.2s ease"
              _hover={{
                bg: 'linear-gradient(135deg, #128C7E, #0C6C5A)',
                transform: 'scale(1.05)',
              }}
              _active={{
                transform: 'scale(0.95)',
              }}
              suppressHydrationWarning
            >
              <FaWhatsapp size={20} />
            </Box>
            
            {/* Call Now Button - Icon Only */}
            <Box
              as="a"
              href="tel:+441202129746"
              aria-label="Call now"
              w="42px"
              h="42px"
              minW="42px"
              bg="linear-gradient(135deg, #10B981 0%, #059669 100%)"
              color="white"
              boxShadow="0 3px 10px rgba(16, 185, 129, 0.35)"
              borderRadius="full"
              transition="all 0.2s ease"
              display="flex"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              _hover={{
                bg: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                transform: 'scale(1.05)',
              }}
              _active={{
                transform: 'scale(0.95)',
              }}
              suppressHydrationWarning
            >
              <FaPhone size={18} />
            </Box>

            {/* Menu Icon Button */}
            <Box
              as="button"
              aria-label="Open menu"
              bg="rgba(31, 41, 55, 0.95)"
              color="white"
              w="42px"
              h="42px"
              minW="42px"
              borderRadius="full"
              boxShadow="0 2px 8px rgba(0, 0, 0, 0.15)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              transition="all 0.2s"
              _hover={{ 
                bg: 'rgba(17, 24, 39, 1)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
              }}
              _active={{ 
                bg: 'rgba(31, 41, 55, 1)',
                transform: 'scale(0.95)'
              }}
              onClick={onOpen}
              suppressHydrationWarning
            >
              <Box as="span" display="flex" alignItems="center" justifyContent="center" suppressHydrationWarning>
                <FiMenu size={24} />
              </Box>
            </Box>
          </HStack>
        </Flex>
      </Box>

      {/* Mobile Drawer - Enhanced Design */}
      <Drawer
        isOpen={isOpen}
        placement="right"
        onClose={onClose}
        size="xs"
      >
        <DrawerOverlay 
          bg="blackAlpha.600" 
          backdropFilter="blur(12px)"
          sx={{
            animation: 'fadeIn 0.2s ease-out',
            '@keyframes fadeIn': {
              from: { opacity: 0 },
              to: { opacity: 1 },
            },
          }}
        />
        <DrawerContent 
          bg="linear-gradient(180deg, rgba(15, 17, 20, 0.98) 0%, rgba(10, 12, 15, 0.98) 100%)"
          backdropFilter="blur(20px)"
          borderLeft="2px solid"
          borderColor="rgba(59, 130, 246, 0.3)"
          boxShadow="0 0 40px rgba(0, 0, 0, 0.4)"
        >
          <DrawerCloseButton 
            color="white" 
            fontSize="20px"
            _hover={{ 
              bg: 'rgba(59, 130, 246, 0.3)',
              transform: 'scale(1.1)',
            }}
            _active={{
              transform: 'scale(0.95)',
            }}
            transition="all 0.2s"
          />
          <DrawerHeader 
            borderBottomWidth="2px" 
            borderColor="rgba(59, 130, 246, 0.3)"
            bg="linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)"
            py={5}
          >
            <Text 
              color="white" 
              fontWeight="bold" 
              fontSize="2xl"
              letterSpacing="tight"
            >
              Menu
            </Text>
          </DrawerHeader>

          <DrawerBody p={0} bg="transparent">
            <VStack spacing={1} align="stretch" p={2}>
              <Box
                as="button"
                p={4}
                borderRadius="xl"
                _hover={{ 
                  bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
                  transform: 'translateX(4px)',
                }}
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                  window.location.href = '/';
                }}
                cursor="pointer"
                textAlign="left"
                w="full"
                bg="transparent"
                border="none"
                transition="all 0.2s"
              >
                <HStack spacing={3}>
                  <Box 
                    w="40px" 
                    h="40px" 
                    bg="linear-gradient(135deg, #3B82F6, #06B6D4)"
                    borderRadius="lg"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="0 2px 8px rgba(59, 130, 246, 0.3)"
                  >
                    <FiUser color="white" size={20} />
                  </Box>
                  <Text color="white" fontWeight="600" fontSize="16px">Home</Text>
                </HStack>
              </Box>
              
              <Box
                as="button"
                p={4}
                borderRadius="xl"
                _hover={{ 
                  bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
                  transform: 'translateX(4px)',
                }}
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                  window.location.href = '/services';
                }}
                cursor="pointer"
                textAlign="left"
                w="full"
                bg="transparent"
                border="none"
                transition="all 0.2s"
              >
                <HStack spacing={3}>
                  <Box 
                    w="40px" 
                    h="40px" 
                    bg="linear-gradient(135deg, #3B82F6, #06B6D4)"
                    borderRadius="lg"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="0 2px 8px rgba(59, 130, 246, 0.3)"
                  >
                    <FaTruck color="white" size={20} />
                  </Box>
                  <Text color="white" fontWeight="600" fontSize="16px">Services</Text>
                </HStack>
              </Box>
              
              <Box
                as="button"
                p={4}
                borderRadius="xl"
                _hover={{ 
                  bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
                  transform: 'translateX(4px)',
                }}
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                  window.location.href = '/how-it-works';
                }}
                cursor="pointer"
                textAlign="left"
                w="full"
                bg="transparent"
                border="none"
                transition="all 0.2s"
              >
                <HStack spacing={3}>
                  <Box 
                    w="40px" 
                    h="40px" 
                    bg="linear-gradient(135deg, #3B82F6, #06B6D4)"
                    borderRadius="lg"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="0 2px 8px rgba(59, 130, 246, 0.3)"
                  >
                    <FaQuestionCircle color="white" size={20} />
                  </Box>
                  <Text color="white" fontWeight="600" fontSize="16px">How It Works</Text>
                </HStack>
              </Box>
              
              <Box
                as="button"
                p={4}
                borderRadius="xl"
                _hover={{ 
                  bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
                  transform: 'translateX(4px)',
                }}
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                  window.location.href = '/pricing';
                }}
                cursor="pointer"
                textAlign="left"
                w="full"
                bg="transparent"
                border="none"
                transition="all 0.2s"
              >
                <HStack spacing={3}>
                  <Box 
                    w="40px" 
                    h="40px" 
                    bg="linear-gradient(135deg, #3B82F6, #06B6D4)"
                    borderRadius="lg"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="0 2px 8px rgba(59, 130, 246, 0.3)"
                  >
                    <FaStar color="white" size={20} />
                  </Box>
                  <Text color="white" fontWeight="600" fontSize="16px">Pricing</Text>
                </HStack>
              </Box>
              
              <Box
                as="button"
                p={4}
                borderRadius="xl"
                _hover={{ 
                  bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
                  transform: 'translateX(4px)',
                }}
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                  window.location.href = '/track';
                }}
                cursor="pointer"
                textAlign="left"
                w="full"
                bg="transparent"
                border="none"
                transition="all 0.2s"
              >
                <HStack spacing={3}>
                  <Box 
                    w="40px" 
                    h="40px" 
                    bg="linear-gradient(135deg, #3B82F6, #06B6D4)"
                    borderRadius="lg"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="0 2px 8px rgba(59, 130, 246, 0.3)"
                  >
                    <FiMapPin color="white" size={20} />
                  </Box>
                  <Text color="white" fontWeight="600" fontSize="16px">Track Move</Text>
                </HStack>
              </Box>
              
              <Box
                as="button"
                p={4}
                borderRadius="xl"
                _hover={{ 
                  bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
                  transform: 'translateX(4px)',
                }}
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                  window.location.href = '/about';
                }}
                cursor="pointer"
                textAlign="left"
                w="full"
                bg="transparent"
                border="none"
                transition="all 0.2s"
              >
                <HStack spacing={3}>
                  <Box 
                    w="40px" 
                    h="40px" 
                    bg="linear-gradient(135deg, #3B82F6, #06B6D4)"
                    borderRadius="lg"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="0 2px 8px rgba(59, 130, 246, 0.3)"
                  >
                    <FiFileText color="white" size={20} />
                  </Box>
                  <Text color="white" fontWeight="600" fontSize="16px">About Us</Text>
                </HStack>
              </Box>
              
              <Box
                as="button"
                p={4}
                borderRadius="xl"
                _hover={{ 
                  bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
                  transform: 'translateX(4px)',
                }}
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                  window.location.href = '/contact';
                }}
                cursor="pointer"
                textAlign="left"
                w="full"
                bg="transparent"
                border="none"
                transition="all 0.2s"
              >
                <HStack spacing={3}>
                  <Box 
                    w="40px" 
                    h="40px" 
                    bg="linear-gradient(135deg, #3B82F6, #06B6D4)"
                    borderRadius="lg"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="0 2px 8px rgba(59, 130, 246, 0.3)"
                  >
                    <FaQuestionCircle color="white" size={20} />
                  </Box>
                  <Text color="white" fontWeight="600" fontSize="16px">Contact</Text>
                </HStack>
              </Box>

              <Box px={4} py={3} mt={2}>
                <Text fontSize="xs" color="rgba(255, 255, 255, 0.6)" fontWeight="bold" letterSpacing="wider">
                  DRIVER
                </Text>
              </Box>
              
              <Box
                as="button"
                p={4}
                borderBottom="1px solid"
                borderColor="rgba(59, 130, 246, 0.2)"
                _hover={{ bg: 'rgba(30, 64, 175, 0.2)' }}
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                  window.location.href = '/driver-application';
                }}
                cursor="pointer"
                textAlign="left"
                w="full"
                bg="transparent"
                border="none"
              >
                <HStack spacing={3}>
                  <FiUserPlus color="#06B6D4" />
                  <Text color="white">Apply to Drive</Text>
                </HStack>
              </Box>

              <Box p={3} bg="rgba(30, 64, 175, 0.15)" borderBottom="1px solid" borderColor="rgba(59, 130, 246, 0.2)">
                <Text fontSize="sm" color="rgba(255,255,255,0.7)" fontWeight="semibold">
                  LEGAL
                </Text>
              </Box>
              
              <Box
                as="button"
                p={4}
                borderBottom="1px solid"
                borderColor="rgba(59, 130, 246, 0.2)"
                _hover={{ bg: 'rgba(30, 64, 175, 0.2)' }}
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                  window.location.href = '/privacy';
                }}
                cursor="pointer"
                textAlign="left"
                w="full"
                bg="transparent"
                border="none"
              >
                <HStack spacing={3}>
                  <FiShield color="#3B82F6" />
                  <Text color="white">Privacy Policy</Text>
                </HStack>
              </Box>
              
              <Box
                as="button"
                p={4}
                borderBottom="1px solid"
                borderColor="rgba(59, 130, 246, 0.2)"
                _hover={{ bg: 'rgba(30, 64, 175, 0.2)' }}
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                  window.location.href = '/terms';
                }}
                cursor="pointer"
                textAlign="left"
                w="full"
                bg="transparent"
                border="none"
              >
                <HStack spacing={3}>
                  <FiFileText color="#3B82F6" />
                  <Text color="white">Terms of Service</Text>
                </HStack>
              </Box>

              <Box p={3} bg="rgba(30, 64, 175, 0.15)" borderBottom="1px solid" borderColor="rgba(59, 130, 246, 0.2)">
                <Text fontSize="sm" color="rgba(255,255,255,0.7)" fontWeight="semibold">
                  ACCOUNT
                </Text>
              </Box>
              
              <Box
                as="button"
                p={4}
                borderBottom="1px solid"
                borderColor="rgba(59, 130, 246, 0.2)"
                _hover={{ bg: 'rgba(30, 64, 175, 0.2)' }}
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                  window.location.href = '/customer/login';
                }}
                cursor="pointer"
                textAlign="left"
                w="full"
                bg="transparent"
                border="none"
              >
                <HStack spacing={3}>
                  <FiLogIn color="#3B82F6" />
                  <Text color="white">Sign In</Text>
                </HStack>
              </Box>
              
              <Box
                as="button"
                p={4}
                borderBottom="1px solid"
                borderColor="rgba(59, 130, 246, 0.2)"
                _hover={{ bg: 'rgba(30, 64, 175, 0.2)' }}
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                  window.location.href = '/customer/register';
                }}
                cursor="pointer"
                textAlign="left"
                w="full"
                bg="transparent"
                border="none"
              >
                <HStack spacing={3}>
                  <FiUserPlus color="#3B82F6" />
                  <Text color="white">Sign Up</Text>
                </HStack>
              </Box>

              <Box p={4} bg="rgba(30, 64, 175, 0.1)" borderTop="1px solid" borderColor="rgba(59, 130, 246, 0.3)">
                <VStack spacing={3}>
                  <Button
                    size="lg"
                    bg="linear-gradient(135deg, #3B82F6, #06B6D4)"
                    color="white"
                    fontWeight="bold"
                    w="full"
                    h="56px"
                    boxShadow="0 4px 15px rgba(59,130,246,0.4)"
                    _hover={{
                      bg: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(59, 130, 246, 0.5)',
                    }}
                    _active={{
                      transform: 'scale(0.98)',
                    }}
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onClose();
                      setTimeout(() => {
                        window.location.href = '/booking-luxury';
                      }, 100);
                    }}
                    position="relative"
                    overflow="hidden"
                    borderRadius="xl"
                  >
                    Book Your Move
                  </Button>
                  
                  <Button
                    as="a"
                    href="tel:+441202129746"
                    size="md"
                    variant="outline"
                    color="white"
                    borderColor="rgba(16, 185, 129, 0.5)"
                    borderWidth="2px"
                    w="full"
                    h="48px"
                    _hover={{
                      bg: 'rgba(16, 185, 129, 0.2)',
                      transform: 'translateY(-1px)',
                      borderColor: '#10B981',
                      textDecoration: 'none',
                    }}
                    _active={{
                      transform: 'scale(0.98)',
                    }}
                    onClick={() => {
                      onClose();
                    }}
                    leftIcon={<FaPhone />}
                    borderRadius="xl"
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
