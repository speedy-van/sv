/**
 * Unified navigation component for Speedy Van
 */

'use client';

import { Box, Flex, HStack, Link, Text, IconButton, useDisclosure, Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton, VStack, Button, useBreakpointValue } from '@chakra-ui/react';
import { useColorModeValue } from '@chakra-ui/react';
import { ReactNode, useRef } from 'react';
import { ROUTES, type UserRole } from '@/lib/routing';
import { FiMenu } from 'react-icons/fi';

interface NavigationItem {
  label: string;
  href: string;
  icon?: ReactNode;
}

interface UnifiedNavigationProps {
  userRole?: UserRole;
  isAuthenticated?: boolean;
  children?: ReactNode;
  role?: string;
}

export function UnifiedNavigation({
  userRole,
  isAuthenticated = false,
  children,
  role
}: UnifiedNavigationProps) {
  // If role is passed, use it as userRole for backward compatibility
  const effectiveUserRole = userRole || (role as UserRole) || 'guest';
  const bg = useColorModeValue('gray.900', 'gray.900');
  const borderColor = useColorModeValue('gray.700', 'gray.700');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef<HTMLButtonElement>(null);
  const isMobile = useBreakpointValue({ base: true, md: false });

  const getNavigationItems = (): NavigationItem[] => {
    if (!isAuthenticated) {
      return [
        { label: 'Home', href: ROUTES.HOME },
        { label: 'Services', href: ROUTES.SERVICES },
        { label: 'Pricing', href: ROUTES.PRICING },
        { label: 'Apply to Drive', href: ROUTES.DRIVER_APPLICATION },
        { label: 'Contact', href: ROUTES.CONTACT },
      ];
    }

    switch (effectiveUserRole) {
      case 'admin':
        return [
          { label: 'Dashboard', href: ROUTES.ADMIN_DASHBOARD },
          { label: 'Orders', href: ROUTES.ADMIN_ORDERS },
          { label: 'Routes', href: ROUTES.ADMIN_ROUTES },
          { label: 'Drivers', href: ROUTES.ADMIN_DRIVERS },
          { label: 'Driver Applications', href: ROUTES.ADMIN_DRIVER_APPLICATIONS },
          { label: 'Driver Schedule', href: ROUTES.ADMIN_DRIVER_SCHEDULE },
          { label: 'Driver Earnings', href: ROUTES.ADMIN_DRIVER_EARNINGS },
          { label: 'Customers', href: ROUTES.ADMIN_CUSTOMERS },
          { label: 'Dispatch', href: ROUTES.ADMIN_DISPATCH },
          { label: 'Analytics', href: ROUTES.ADMIN_ANALYTICS },
          { label: 'Finance', href: ROUTES.ADMIN_FINANCE },
          { label: 'Logs', href: ROUTES.ADMIN_LOGS },
          { label: 'Content', href: ROUTES.ADMIN_CONTENT },
          { label: 'Tracking', href: ROUTES.ADMIN_TRACKING },
          { label: 'Chat', href: ROUTES.ADMIN_CHAT },
          { label: 'Settings', href: ROUTES.ADMIN_SETTINGS },
        ];
      case 'driver':
        return [
          { label: 'Dashboard', href: ROUTES.DRIVER_DASHBOARD },
          { label: 'Jobs', href: ROUTES.DRIVER_JOBS },
          { label: 'Schedule', href: ROUTES.DRIVER_SCHEDULE },
          { label: 'Availability', href: ROUTES.DRIVER_AVAILABILITY },
          { label: 'Earnings', href: ROUTES.DRIVER_EARNINGS },
          { label: 'Profile', href: ROUTES.DRIVER_PROFILE },
          { label: 'Settings', href: ROUTES.DRIVER_SETTINGS },
        ];
      case 'customer':
        return [
          { label: 'Dashboard', href: ROUTES.CUSTOMER_DASHBOARD },
          { label: 'Orders', href: ROUTES.CUSTOMER_ORDERS },
          { label: 'Profile', href: ROUTES.CUSTOMER_PROFILE },
          { label: 'Settings', href: ROUTES.CUSTOMER_SETTINGS },
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <Box
      bg={bg}
      borderBottom="1px"
      borderColor={borderColor}
      boxShadow="sm"
      pl={{ base: 3, md: 4 }}
      pr={{ base: 1, md: 4 }}
      py={{ base: 4, md: 3 }}
    >
      <Flex 
        justify="space-between"
        align="center" 
        minH={{ base: "48px", md: "auto" }}
        w="100%"
      >
        {/* Logo/Brand - Left Side */}
        <Link href={effectiveUserRole === 'driver' ? ROUTES.DRIVER_DASHBOARD : ROUTES.HOME} _hover={{ textDecoration: 'none' }}>
          <Text 
            fontSize={{ base: "md", md: "xl" }} 
            fontWeight="bold" 
            color="primary.500"
            noOfLines={1}
          >
            {effectiveUserRole === 'driver' ? 'Speedy Van Driver' : 'Speedy Van'}
          </Text>
        </Link>
        
        {/* Desktop Navigation */}
        {!isMobile && (
          <HStack spacing={6}>
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                _hover={{ textDecoration: 'none', color: 'primary.500' }}
                fontWeight="medium"
                fontSize="sm"
              >
                {item.label}
              </Link>
            ))}
          </HStack>
        )}
        
        {/* Mobile Navigation Button - Far Right Edge */}
        {isMobile && (
          <Box ml="auto">
            <IconButton
              ref={btnRef}
              aria-label="Open navigation menu"
              icon={<FiMenu />}
              variant="ghost"
              onClick={onOpen}
              minW="48px"
              h="48px"
              px="14px"
              borderRadius="lg"
              _hover={{ bg: "rgba(0,194,255,0.1)" }}
              _active={{ bg: "rgba(0,194,255,0.15)" }}
            />
          </Box>
        )}
      </Flex>
      
      {/* Mobile Drawer */}
      <Drawer
        isOpen={isOpen}
        placement="right"
        onClose={onClose}
        finalFocusRef={btnRef}
      >
        <DrawerOverlay bg="rgba(0,0,0,0.4)" backdropFilter="blur(4px)" />
        <DrawerContent>
          <DrawerCloseButton
            size="lg"
            top={4}
            right={4}
            bg="rgba(0,0,0,0.1)"
            borderRadius="full"
            _hover={{ bg: "rgba(0,194,255,0.1)" }}
          />
          <DrawerBody pt={12} px={0}>
            {/* Role-specific header section */}
            {effectiveUserRole === 'driver' && (
              <Box px={6} py={4} bg="gray.50" borderBottom="1px solid" borderColor="gray.200">
                <Text fontSize="sm" fontWeight="semibold" color="gray.600">
                  Driver Navigation
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Manage your jobs and schedule
                </Text>
              </Box>
            )}
            
            <VStack spacing={1} align="stretch" pt={2}>
              {navigationItems.map((item) => (
                <Button
                  key={item.href}
                  as={Link}
                  href={item.href}
                  variant="ghost"
                  justifyContent="flex-start"
                  size="lg"
                  minH="52px"
                  px={6}
                  borderRadius="none"
                  fontWeight="medium"
                  color="gray.700"
                  _hover={{ 
                    bg: "rgba(0,194,255,0.08)",
                    color: "primary.600"
                  }}
                  _active={{
                    bg: "rgba(0,194,255,0.12)"
                  }}
                  onClick={onClose}
                >
                  {item.label}
                </Button>
              ))}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      
      {children}
    </Box>
  );
}