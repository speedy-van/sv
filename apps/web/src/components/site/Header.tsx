'use client';

import React from 'react';
import NextLink from 'next/link';
import {
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  HStack,
  IconButton,
  Link,
  Text,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';
import { FiMenu, FiPhone } from 'react-icons/fi';

const primaryLinks = [
  { label: 'About', href: '/about' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Services', href: '/services' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Contact', href: '/contact' },
];

const portalLinks = [
  { label: 'Customer Portal', href: '/customer/login' },
  { label: 'Driver Portal', href: '/driver-auth' },
];

export default function Header() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box
      as="header"
      role="banner"
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={1000}
      bg="bg.header"
      borderBottom="1px solid"
      borderColor="border.primary"
      boxShadow="sm"
      backdropFilter="blur(10px)"
      sx={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <Container maxW="container.xl" py={3}>
        <HStack justify="space-between" align="center" minH={{ base: '56px', md: '64px' }}>
          <Link
            as={NextLink}
            href="/"
            _hover={{ textDecoration: 'none' }}
            display="inline-flex"
            alignItems="center"
            gap={3}
          >
            <Box
              w={{ base: 9, md: 10 }}
              h={{ base: 9, md: 10 }}
              borderRadius="full"
              bgGradient="linear(to-br, interactive.primary, interactive.secondary)"
            />
            <VStack align="start" spacing={0} display={{ base: 'none', sm: 'flex' }}>
              <Text color="text.primary" fontWeight="800" lineHeight="1">
                Speedy Van
              </Text>
              <Text color="text.secondary" fontSize="xs" lineHeight="1">
                Modern Moving
              </Text>
            </VStack>
          </Link>

          <HStack spacing={2} display={{ base: 'none', md: 'flex' }}>
            {primaryLinks.map((item) => (
              <Button
                key={item.href}
                as={NextLink}
                href={item.href}
                variant="ghost"
                color="text.secondary"
                _hover={{ color: 'text.primary', bg: 'bg.surface' }}
              >
                {item.label}
              </Button>
            ))}
          </HStack>

          <HStack spacing={2} display={{ base: 'none', md: 'flex' }}>
            <Button
              as="a"
              href="tel:01202129746"
              variant="outline"
              borderColor="border.neon"
              color="text.primary"
              leftIcon={<FiPhone />}
            >
              01202 129746
            </Button>
            <Button as={NextLink} href="/booking-luxury" colorScheme="blue">
              Book Now
            </Button>
          </HStack>

          <IconButton
            aria-label="Open menu"
            icon={<FiMenu />}
            onClick={onOpen}
            display={{ base: 'inline-flex', md: 'none' }}
            variant="outline"
            borderColor="border.primary"
            color="text.primary"
          />
        </HStack>
      </Container>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay bg="blackAlpha.700" />
        <DrawerContent bg="bg.surface" borderLeft="1px solid" borderColor="border.primary">
          <DrawerCloseButton color="text.primary" />
          <DrawerHeader color="text.primary">Menu</DrawerHeader>
          <DrawerBody>
            <VStack align="stretch" spacing={2}>
              {primaryLinks.map((item) => (
                <Button
                  key={item.href}
                  as={NextLink}
                  href={item.href}
                  onClick={onClose}
                  justifyContent="flex-start"
                  variant="ghost"
                  color="text.secondary"
                  _hover={{ color: 'text.primary', bg: 'bg.surface.elevated' }}
                >
                  {item.label}
                </Button>
              ))}

              <Divider borderColor="border.primary" my={2} />

              {portalLinks.map((item) => (
                <Button
                  key={item.href}
                  as={NextLink}
                  href={item.href}
                  onClick={onClose}
                  justifyContent="flex-start"
                  variant="outline"
                  borderColor="border.primary"
                  color="text.primary"
                >
                  {item.label}
                </Button>
              ))}

              <Button
                as="a"
                href="tel:01202129746"
                leftIcon={<FiPhone />}
                justifyContent="flex-start"
                variant="outline"
                borderColor="border.neon"
                color="text.primary"
              >
                01202 129746
              </Button>

              <Button as={NextLink} href="/booking-luxury" onClick={onClose} colorScheme="blue">
                Start Booking
              </Button>

              <Text color="text.secondary" fontSize="sm" pt={2}>
                support@speedy-van.co.uk
              </Text>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}

