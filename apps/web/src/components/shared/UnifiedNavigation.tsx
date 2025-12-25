/**
 * Unified navigation component for Speedy Van
 */

'use client';

import { Box, Flex, HStack, Link, Text, IconButton, useDisclosure, Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton, VStack, Button, useBreakpointValue, Menu, MenuButton, MenuList, MenuItem, Tooltip } from '@chakra-ui/react';
import { useColorModeValue } from '@chakra-ui/react';
import { ReactNode, useRef, useState, useEffect } from 'react';
import { ROUTES, type UserRole } from '@/lib/routing';
import { FiMenu, FiRefreshCw } from 'react-icons/fi';
import { usePathname, useRouter } from 'next/navigation';

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
  const bg = useColorModeValue('rgba(7, 13, 23, 0.85)', 'rgba(7, 13, 23, 0.85)');
  const borderColor = useColorModeValue('rgba(255,255,255,0.08)', 'rgba(255,255,255,0.08)');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef<HTMLButtonElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname() || '';
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    // Check if mobile after mount to avoid SSR issues
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent hydration mismatch by not rendering navigation items until mounted
  if (!isMounted) {
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
        </Flex>
        {children}
      </Box>
    );
  }

  // Only get navigation items after component is mounted
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
          { label: 'Operations', href: ROUTES.ADMIN_OPERATIONS },
          { label: 'Drivers', href: ROUTES.ADMIN_DRIVERS },
          { label: 'Driver Applications', href: ROUTES.ADMIN_DRIVER_APPLICATIONS },
          { label: 'Driver Schedule', href: ROUTES.ADMIN_DRIVER_SCHEDULE },
          { label: 'Driver Earnings', href: ROUTES.ADMIN_DRIVER_EARNINGS },
          { label: 'Staff', href: ROUTES.ADMIN_STAFF },
          { label: 'Staff Attendance', href: ROUTES.ADMIN_STAFF_ATTENDANCE },
          { label: 'Staff Reports', href: ROUTES.ADMIN_STAFF_REPORTS },
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
      case 'staff':
        return [
          { label: 'Dashboard', href: ROUTES.STAFF_DASHBOARD },
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  // Helper: styled nav link with active state
  const NavPill = ({ href, label }: { href: string; label: string }) => {
    const isActive =
      href === '/admin'
        ? pathname === href
        : pathname === href || pathname.startsWith(href + '/');

    return (
      <Button
        as={Link}
        href={href}
        size="sm"
        variant="ghost"
        fontWeight="semibold"
        fontSize="sm"
        borderRadius="full"
        px={3}
        py={2}
        _hover={{ bg: 'rgba(0,194,255,0.08)', color: 'primary.500' }}
        bg={isActive ? 'rgba(0,194,255,0.12)' : 'transparent'}
        color={isActive ? 'primary.400' : 'whiteAlpha.900'}
        transition="all 0.15s ease"
      >
        {label}
      </Button>
    );
  };

  return (
    <Box
      bg={bg}
      borderBottom="1px"
      borderColor={borderColor}
      boxShadow="0 6px 20px rgba(0,0,0,0.25)"
      pl={{ base: 3, md: 4 }}
      pr={{ base: 1, md: 4 }}
      py={{ base: 4, md: 3 }}
      position="sticky"
      top={0}
      zIndex={100}
      sx={{
        backdropFilter: 'saturate(180%) blur(8px)',
      }}
      _before={{
        content: '""',
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '1px',
        background:
          'linear-gradient(90deg, transparent 0%, rgba(0,194,255,0.35) 50%, transparent 100%)',
      }}
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
        {!isMobile && isMounted && (
          <HStack
            spacing={3}
            maxW="calc(100vw - 260px)"
            overflowX="auto"
            css={{
              '&::-webkit-scrollbar': { height: '6px' },
              '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.12)', borderRadius: '10px' },
            }}
            whiteSpace="nowrap"
          >
            {/* Admin: compact, grouped header */}
            {effectiveUserRole === 'admin' ? (
              <>
                {/* Primary links */}
                {[
                  { label: 'Dashboard', href: ROUTES.ADMIN_DASHBOARD },
                  { label: 'Operations', href: ROUTES.ADMIN_OPERATIONS },
                  { label: 'Customers', href: ROUTES.ADMIN_CUSTOMERS },
                  { label: 'Dispatch', href: ROUTES.ADMIN_DISPATCH },
                  { label: 'Chat', href: ROUTES.ADMIN_CHAT },
                  { label: 'Analytics', href: ROUTES.ADMIN_ANALYTICS },
                  { label: 'Finance', href: ROUTES.ADMIN_FINANCE },
                ].map((item) => (
                  <NavPill key={item.href} href={item.href} label={item.label} />
                ))}

                {/* Drivers group */}
                <Menu isLazy>
                  <MenuButton
                    as={Button}
                    variant="ghost"
                    size="sm"
                    fontWeight="medium"
                    fontSize="sm"
                    _hover={{ color: 'primary.500', bg: 'rgba(0,194,255,0.06)' }}
                    borderRadius="full"
                    px={3}
                  >
                    Drivers
                  </MenuButton>
                  <MenuList bg="gray.800" borderColor="gray.700">
                    <MenuItem
                      as={Link}
                      href={ROUTES.ADMIN_DRIVERS}
                      bg="gray.800"
                      _hover={{ bg: 'gray.700' }}
                    >
                      Drivers
                    </MenuItem>
                    <MenuItem
                      as={Link}
                      href={ROUTES.ADMIN_DRIVER_APPLICATIONS}
                      bg="gray.800"
                      _hover={{ bg: 'gray.700' }}
                    >
                      Driver Applications
                    </MenuItem>
                    <MenuItem
                      as={Link}
                      href={ROUTES.ADMIN_DRIVER_SCHEDULE}
                      bg="gray.800"
                      _hover={{ bg: 'gray.700' }}
                    >
                      Driver Schedule
                    </MenuItem>
                    <MenuItem
                      as={Link}
                      href={ROUTES.ADMIN_DRIVER_EARNINGS}
                      bg="gray.800"
                      _hover={{ bg: 'gray.700' }}
                    >
                      Driver Earnings
                    </MenuItem>
                  </MenuList>
                </Menu>

                {/* Staff group */}
                <Menu isLazy>
                  <MenuButton
                    as={Button}
                    variant="ghost"
                    size="sm"
                    fontWeight="medium"
                    fontSize="sm"
                    _hover={{ color: 'primary.500', bg: 'rgba(0,194,255,0.06)' }}
                    borderRadius="full"
                    px={3}
                  >
                    Staff
                  </MenuButton>
                  <MenuList bg="gray.800" borderColor="gray.700">
                    <MenuItem
                      as={Link}
                      href={ROUTES.ADMIN_STAFF}
                      bg="gray.800"
                      _hover={{ bg: 'gray.700' }}
                    >
                      Staff
                    </MenuItem>
                    <MenuItem
                      as={Link}
                      href={ROUTES.ADMIN_STAFF_ATTENDANCE}
                      bg="gray.800"
                      _hover={{ bg: 'gray.700' }}
                    >
                      Staff Attendance
                    </MenuItem>
                    <MenuItem
                      as={Link}
                      href={ROUTES.ADMIN_STAFF_REPORTS}
                      bg="gray.800"
                      _hover={{ bg: 'gray.700' }}
                    >
                      Staff Reports
                    </MenuItem>
                  </MenuList>
                </Menu>

                {/* More group */}
                <Menu isLazy>
                  <MenuButton
                    as={Button}
                    variant="ghost"
                    size="sm"
                    fontWeight="medium"
                    fontSize="sm"
                    _hover={{ color: 'primary.500', bg: 'rgba(0,194,255,0.06)' }}
                    borderRadius="full"
                    px={3}
                  >
                    More
                  </MenuButton>
                  <MenuList bg="gray.800" borderColor="gray.700">
                    <MenuItem
                      as={Link}
                      href="/admin/contact-inquiries"
                      bg="gray.800"
                      _hover={{ bg: 'gray.700' }}
                    >
                      Contact Inquiries
                    </MenuItem>
                    <MenuItem
                      as={Link}
                      href={ROUTES.ADMIN_CONTENT}
                      bg="gray.800"
                      _hover={{ bg: 'gray.700' }}
                    >
                      Content
                    </MenuItem>
                    <MenuItem
                      as={Link}
                      href={ROUTES.ADMIN_TRACKING}
                      bg="gray.800"
                      _hover={{ bg: 'gray.700' }}
                    >
                      Tracking
                    </MenuItem>
                    <MenuItem
                      as={Link}
                      href={ROUTES.ADMIN_LOGS}
                      bg="gray.800"
                      _hover={{ bg: 'gray.700' }}
                    >
                      Logs
                    </MenuItem>
                    <MenuItem
                      as={Link}
                      href={ROUTES.ADMIN_SETTINGS}
                      bg="gray.800"
                      _hover={{ bg: 'gray.700' }}
                    >
                      Settings
                    </MenuItem>
                  </MenuList>
                </Menu>

                {/* Right side quick action: Refresh */}
                <Tooltip label="Refresh data" hasArrow>
                  <IconButton
                    aria-label="Refresh"
                    icon={<FiRefreshCw />}
                    size="sm"
                    variant="ghost"
                    borderRadius="full"
                    onClick={() => router.refresh()}
                    _hover={{ bg: 'rgba(0,194,255,0.08)', color: 'primary.500' }}
                  />
                </Tooltip>

                {/* Open AI Assistant */}
                <Button
                  size="sm"
                  colorScheme="blue"
                  variant="solid"
                  onClick={() => {
                    try {
                      window.dispatchEvent(new Event('sv-ai-open'));
                    } catch {}
                  }}
                >
                  AI Assistant
                </Button>
              </>
            ) : (
              navigationItems.map((item) => (
                <NavPill key={item.href} href={item.href} label={item.label} />
              ))
            )}
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
              {isMounted && navigationItems.map((item) => (
                <Button
                  key={item.href}
                  as={Link}
                  href={item.href}
                  variant="ghost"
                  justifyContent="flex-start"
                  borderRadius={0}
                  py={6}
                  px={6}
                  _hover={{ bg: 'rgba(0,194,255,0.1)' }}
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