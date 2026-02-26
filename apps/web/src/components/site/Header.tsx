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
      width="100%"
      maxW="100vw"
      zIndex={1000}
      bg="bg.header"
      borderBottom="1px solid"
      borderColor="border.primary"
      boxShadow="sm"
      minH="56px"
      overflow="hidden"
      sx={{
        paddingTop: 'max(env(safe-area-inset-top), 0px)',
        WebkitBackdropFilter: 'saturate(180%) blur(12px)',
        backdropFilter: 'saturate(180%) blur(12px)',
      }}
    >
      <Container maxW="container.xl" py={3} px={{ base: 3, sm: 4 }} w="100%">
        <HStack
          justify="space-between"
          align="center"
          minH={{ base: '56px', lg: '64px' }}
          gap={2}
          w="100%"
          flexWrap="nowrap"
        >
          <Link
            as={NextLink}
            href="/"
            _hover={{ textDecoration: 'none' }}
            display="inline-flex"
            alignItems="center"
            gap={2}
            flexShrink={0}
            minW={0}
          >
            <Box
              w={{ base: 9, sm: 10 }}
              h={{ base: 9, sm: 10 }}
              flexShrink={0}
              borderRadius="full"
              bgGradient="linear(to-br, neon.400, neon.600)"
            />
            <VStack align="start" spacing={0} display={{ base: 'none', sm: 'flex' }} flexShrink={0}>
              <Text color="text.primary" fontWeight="800" lineHeight="1" fontSize={{ base: 'sm', sm: 'md' }}>
                Speedy Van
              </Text>
              <Text color="text.secondary" fontSize="xs" lineHeight="1">
                Modern Moving
              </Text>
            </VStack>
          </Link>

          {/* Desktop nav: show only from lg (768px) so iPhone always gets hamburger */}
          <HStack spacing={2} display={{ base: 'none', lg: 'flex' }} flexShrink={0}>
            {primaryLinks.map((item) => (
              <Button
                key={item.href}
                as={NextLink}
                href={item.href}
                variant="ghost"
                color="text.secondary"
                _hover={{ color: 'text.primary', bg: 'bg.surface' }}
                size="sm"
              >
                {item.label}
              </Button>
            ))}
          </HStack>

          <HStack spacing={2} display={{ base: 'none', lg: 'flex' }} flexShrink={0}>
            <Button
              as="a"
              href="tel:01202129746"
              variant="outline"
              borderColor="border.neon"
              color="text.primary"
              leftIcon={<FiPhone />}
              size="sm"
            >
              01202 129746
            </Button>
            <Button as={NextLink} href="/booking-luxury" colorScheme="blue" size="sm">
              Book Now
            </Button>
          </HStack>

          <IconButton
            aria-label="Open menu"
            icon={<FiMenu />}
            onClick={onOpen}
            display={{ base: 'inline-flex', lg: 'none' }}
            variant="outline"
            borderColor="border.primary"
            color="text.primary"
            size="lg"
            minW="44px"
            minH="44px"
            flexShrink={0}
          />
        </HStack>
      </Container>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size={{ base: 'full', sm: 'xs' }}>
        <DrawerOverlay bg="blackAlpha.700" />
        <DrawerContent
          bg="bg.surface"
          borderLeft="1px solid"
          borderColor="border.primary"
          sx={{ paddingTop: 'max(env(safe-area-inset-top), 0px)' }}
        >
          <DrawerCloseButton color="text.primary" size="lg" sx={{ top: 'max(env(safe-area-inset-top), 8px)' }} />
          <DrawerHeader color="text.primary">Menu</DrawerHeader>
          <DrawerBody overflowY="auto">
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
                  _hover={{ color: 'text.primary', bg: 'bg.card' }}
                  size="lg"
                  minH="44px"
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
                  size="lg"
                  minH="44px"
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
                size="lg"
                minH="44px"
              >
                01202 129746
              </Button>

              <Button as={NextLink} href="/booking-luxury" onClick={onClose} colorScheme="blue" size="lg" minH="44px">
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

