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
} from '@chakra-ui/react';
import { FiMenu, FiX, FiUser, FiLogIn, FiUserPlus, FiMapPin, FiFileText, FiShield } from 'react-icons/fi';
import { FaPhone, FaTruck, FaStar, FaQuestionCircle } from 'react-icons/fa';

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
        bg="rgba(15, 17, 20, 0.98)"
        backdropFilter="blur(10px)"
        borderBottom="1px solid rgba(59, 130, 246, 0.3)"
        px={3}
        py={2}
        zIndex={1000}
        boxShadow="0 2px 8px rgba(0,0,0,0.3)"
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
                boxShadow="0 0 15px rgba(0, 194, 255, 0.4)"
              >
                SV
              </Box>
            </HStack>
          </Link>

          {/* Right side - Clean buttons only */}
          <HStack spacing={2}>
            {/* Call Now Button */}
            <Button
              size="sm"
              h="40px"
              px={4}
              bg="linear-gradient(135deg, #10B981, #059669)"
              color="white"
              fontWeight="bold"
              fontSize="sm"
              boxShadow="0 4px 12px rgba(16, 185, 129, 0.4)"
              leftIcon={<FaPhone />}
              onClick={() => window.open('tel:01202 129746')}
              borderRadius="full"
              _hover={{
                bg: 'linear-gradient(135deg, #059669, #047857)',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(16, 185, 129, 0.5)',
              }}
              _active={{
                transform: 'scale(0.95)',
              }}
            >
              Call
            </Button>

            {/* Sign In Button */}
            <Button
              size="sm"
              h="40px"
              px={4}
              bg="linear-gradient(135deg, #3B82F6, #2563EB)"
              color="white"
              fontWeight="bold"
              fontSize="sm"
              boxShadow="0 4px 12px rgba(59, 130, 246, 0.4)"
              leftIcon={<FiLogIn />}
              onClick={() => window.location.href = '/customer/login'}
              borderRadius="full"
              _hover={{
                bg: 'linear-gradient(135deg, #2563EB, #1d4ed8)',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(59, 130, 246, 0.5)',
              }}
              _active={{
                transform: 'scale(0.95)',
              }}
            >
              Sign In
            </Button>

            {/* Menu Icon Button */}
            <IconButton
              aria-label="Open menu"
              icon={<FiMenu />}
              variant="ghost"
              color="white"
              size="sm"
              w="40px"
              h="40px"
              minW="40px"
              _hover={{ bg: 'rgba(59, 130, 246, 0.2)' }}
              _active={{ bg: 'rgba(59, 130, 246, 0.3)' }}
              onClick={onOpen}
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
                  window.location.href = '/';
                }}
                cursor="pointer"
                textAlign="left"
                w="full"
                bg="transparent"
                border="none"
              >
                <HStack spacing={3}>
                  <FiUser color="#3B82F6" />
                  <Text color="white">Home</Text>
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
                  window.location.href = '/services';
                }}
                cursor="pointer"
                textAlign="left"
                w="full"
                bg="transparent"
                border="none"
              >
                <HStack spacing={3}>
                  <FaTruck color="#3B82F6" />
                  <Text color="white">Services</Text>
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
                  window.location.href = '/pricing';
                }}
                cursor="pointer"
                textAlign="left"
                w="full"
                bg="transparent"
                border="none"
              >
                <HStack spacing={3}>
                  <FaStar color="#3B82F6" />
                  <Text color="white">Pricing</Text>
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
                  window.location.href = '/track';
                }}
                cursor="pointer"
                textAlign="left"
                w="full"
                bg="transparent"
                border="none"
              >
                <HStack spacing={3}>
                  <FiMapPin color="#3B82F6" />
                  <Text color="white">Track Move</Text>
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
                  window.location.href = '/about';
                }}
                cursor="pointer"
                textAlign="left"
                w="full"
                bg="transparent"
                border="none"
              >
                <HStack spacing={3}>
                  <FiFileText color="#3B82F6" />
                  <Text color="white">About Us</Text>
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
                  window.location.href = '/contact';
                }}
                cursor="pointer"
                textAlign="left"
                w="full"
                bg="transparent"
                border="none"
              >
                <HStack spacing={3}>
                  <FaQuestionCircle color="#3B82F6" />
                  <Text color="white">Contact</Text>
                </HStack>
              </Box>

              <Box p={3} bg="rgba(30, 64, 175, 0.15)" borderBottom="1px solid" borderColor="rgba(59, 130, 246, 0.2)">
                <Text fontSize="sm" color="rgba(255,255,255,0.7)" fontWeight="semibold">
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
                    }}
                    _active={{
                      transform: 'scale(0.98)',
                    }}
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open('tel:01202 129746');
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
