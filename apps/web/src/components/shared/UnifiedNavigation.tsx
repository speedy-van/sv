/**
 * Unified navigation component for Speedy Van
 */

'use client';

import { Box, Flex, HStack, Link, Text, IconButton, useDisclosure, Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton, VStack, Button, useBreakpointValue, Menu, MenuButton, MenuList, MenuItem, Tooltip, Badge, Icon } from '@chakra-ui/react';
import { useColorModeValue } from '@chakra-ui/react';
import { ReactNode, useRef, useState, useEffect } from 'react';
import { ROUTES, type UserRole } from '@/lib/routing';
import { FiMenu, FiRefreshCw, FiUsers, FiBriefcase, FiBarChart2, FiSettings, FiTruck, FiClipboard, FiDollarSign, FiShield, FiActivity, FiFileText, FiMessageSquare, FiPhone, FiChevronDown } from 'react-icons/fi';
import { usePathname, useRouter } from 'next/navigation';
import { AdminNotificationBell } from '@/components/admin/AdminNotificationBell';
import { FaPhone } from 'react-icons/fa';
import { RiSparklingFill } from 'react-icons/ri';

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

  // Helper: styled nav link with active state and enhanced design
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
        fontWeight="bold"
        fontSize="sm"
        letterSpacing="0.3px"
        borderRadius="xl"
        px={5}
        py={2.5}
        height="auto"
        _hover={{ 
          bg: isActive 
            ? 'rgba(0,194,255,0.2)' 
            : 'rgba(0,194,255,0.12)', 
          color: 'primary.200',
          transform: 'translateY(-2px) scale(1.02)',
          boxShadow: isActive 
            ? '0 6px 20px rgba(0,194,255,0.4), inset 0 1px 0 rgba(255,255,255,0.1)' 
            : '0 4px 14px rgba(0,194,255,0.25)',
        }}
        _active={{
          transform: 'translateY(0) scale(0.98)',
        }}
        bg={isActive 
          ? 'linear-gradient(135deg, rgba(0,194,255,0.18) 0%, rgba(0,150,255,0.25) 100%)' 
          : 'transparent'}
        color={isActive ? '#00D4FF' : 'whiteAlpha.900'}
        transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
        boxShadow={isActive 
          ? '0 4px 14px rgba(0,194,255,0.3), inset 0 1px 0 rgba(255,255,255,0.1)' 
          : 'none'}
        position="relative"
        border={isActive ? '1px solid' : 'none'}
        borderColor={isActive ? 'rgba(0,194,255,0.3)' : 'transparent'}
        _before={isActive ? {
          content: '""',
          position: 'absolute',
          bottom: '-18px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '32px',
          height: '3px',
          bgGradient: 'linear(to-r, transparent, primary.400, transparent)',
          borderRadius: 'full',
          boxShadow: '0 0 8px rgba(0,194,255,0.6)',
        } : undefined}
        _after={isActive ? {
          content: '""',
          position: 'absolute',
          inset: 0,
          borderRadius: 'xl',
          padding: '1px',
          background: 'linear-gradient(135deg, rgba(0,194,255,0.3), rgba(0,150,255,0.1))',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          pointerEvents: 'none',
        } : undefined}
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
      boxShadow="0 12px 48px rgba(0,0,0,0.4), 0 2px 16px rgba(0,194,255,0.1)"
      pl={{ base: 3, md: 7 }}
      pr={{ base: 1, md: 7 }}
      py={{ base: 4, md: 5 }}
      position="sticky"
      top={0}
      zIndex={100}
      sx={{
        backdropFilter: 'saturate(200%) blur(20px)',
        WebkitBackdropFilter: 'saturate(200%) blur(20px)',
      }}
      _before={{
        content: '""',
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '3px',
        background:
          'linear-gradient(90deg, transparent 0%, rgba(0,194,255,0.4) 15%, rgba(0,194,255,0.8) 50%, rgba(0,194,255,0.4) 85%, transparent 100%)',
        opacity: 0.7,
        filter: 'blur(0.5px)',
      }}
      _after={{
        content: '""',
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
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
          <HStack spacing={3}>
            <Box
              w="42px"
              h="42px"
              borderRadius="xl"
              bgGradient="linear(135deg, #00C2FF 0%, #0096FF 50%, #0066FF 100%)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontWeight="black"
              fontSize="xl"
              color="white"
              boxShadow="0 6px 20px rgba(0,194,255,0.4), inset 0 1px 0 rgba(255,255,255,0.2)"
              position="relative"
              _before={{
                content: '""',
                position: 'absolute',
                inset: 0,
                borderRadius: 'xl',
                padding: '2px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.3), transparent, rgba(0,194,255,0.5))',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
              }}
              transition="all 0.3s ease"
              _hover={{
                transform: 'scale(1.05) rotate(-5deg)',
                boxShadow: '0 8px 28px rgba(0,194,255,0.5), inset 0 1px 0 rgba(255,255,255,0.3)',
              }}
            >
              SV
            </Box>
            <VStack align="start" spacing={0}>
              <Text 
                fontSize={{ base: "md", md: "xl" }} 
                fontWeight="black" 
                bgGradient="linear(to-r, #00C2FF, #00E5FF, #00D4FF)"
                bgClip="text"
                noOfLines={1}
                letterSpacing="tight"
              >
                {effectiveUserRole === 'driver' ? 'Speedy Van Driver' : 'Speedy Van'}
              </Text>
              {effectiveUserRole === 'admin' && (
                <Badge
                  bgGradient="linear(to-r, purple.500, purple.600)"
                  color="white"
                  variant="solid"
                  fontSize="xs"
                  px={2.5}
                  py={0.5}
                  borderRadius="full"
                  fontWeight="bold"
                  letterSpacing="wider"
                  textTransform="uppercase"
                  boxShadow="0 2px 8px rgba(128, 90, 213, 0.4)"
                >
                  Admin
                </Badge>
              )}
            </VStack>
          </HStack>
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
            {/* Admin: enhanced, professionally organized header */}
            {effectiveUserRole === 'admin' ? (
              <>
                {/* Core Operations - Primary Actions */}
                {[
                  { label: 'Dashboard', href: ROUTES.ADMIN_DASHBOARD },
                  { label: 'Orders', href: ROUTES.ADMIN_ORDERS },
                  { label: 'Operations', href: ROUTES.ADMIN_OPERATIONS },
                  { label: 'Dispatch', href: ROUTES.ADMIN_DISPATCH },
                ].map((item) => (
                  <NavPill key={item.href} href={item.href} label={item.label} />
                ))}

                {/* People Management */}
                <Menu isLazy placement="bottom-start">
                  <MenuButton
                    as={Button}
                    variant="ghost"
                    size="sm"
                    fontWeight="bold"
                    fontSize="sm"
                    letterSpacing="0.3px"
                    rightIcon={<Icon as={FiChevronDown} />}
                    leftIcon={<Icon as={FiUsers} />}
                    _hover={{ 
                      color: 'primary.300', 
                      bg: 'rgba(0,194,255,0.12)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,194,255,0.2)',
                    }}
                    _active={{ 
                      bg: 'rgba(0,194,255,0.18)',
                      transform: 'translateY(0)',
                    }}
                    borderRadius="xl"
                    px={5}
                    height="auto"
                    py={2.5}
                    transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                  >
                    People
                  </MenuButton>
                  <MenuList 
                    bg="rgba(17, 25, 40, 0.95)"
                    backdropFilter="blur(16px)"
                    borderColor="rgba(0,194,255,0.2)"
                    borderWidth="1px"
                    boxShadow="0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,194,255,0.1)"
                    borderRadius="xl"
                    py={3}
                    overflow="hidden"
                    minW="240px"
                  >
                    <Text px={5} py={2} fontSize="xs" fontWeight="bold" color="primary.400" textTransform="uppercase" letterSpacing="wider">
                      Customers
                    </Text>
                    <MenuItem 
                      as={Link} 
                      href={ROUTES.ADMIN_CUSTOMERS} 
                      bg="transparent" 
                      _hover={{ bg: 'rgba(0,194,255,0.1)', color: 'primary.300' }}
                      px={5}
                      py={3}
                      icon={<Icon as={FiUsers} color="primary.400" />}
                      fontWeight="medium"
                      transition="all 0.2s"
                    >
                      All Customers
                    </MenuItem>
                    <MenuItem 
                      as={Link} 
                      href={ROUTES.ADMIN_USERS} 
                      bg="transparent" 
                      _hover={{ bg: 'rgba(0,194,255,0.1)', color: 'primary.300' }}
                      px={5}
                      py={3}
                      icon={<Icon as={FiShield} color="primary.400" />}
                      fontWeight="medium"
                      transition="all 0.2s"
                    >
                      User Management
                    </MenuItem>
                    
                    <Box h="1px" bg="rgba(255,255,255,0.08)" my={2} mx={3} />
                    
                    <Text px={5} py={2} fontSize="xs" fontWeight="bold" color="primary.400" textTransform="uppercase" letterSpacing="wider">
                      Drivers
                    </Text>
                    <MenuItem 
                      as={Link} 
                      href={ROUTES.ADMIN_DRIVERS} 
                      bg="transparent" 
                      _hover={{ bg: 'rgba(0,194,255,0.1)', color: 'primary.300' }}
                      px={5}
                      py={3}
                      icon={<Icon as={FiTruck} color="primary.400" />}
                      fontWeight="medium"
                      transition="all 0.2s"
                    >
                      All Drivers
                    </MenuItem>
                    <MenuItem 
                      as={Link} 
                      href={ROUTES.ADMIN_DRIVER_APPLICATIONS} 
                      bg="transparent" 
                      _hover={{ bg: 'rgba(0,194,255,0.1)', color: 'primary.300' }}
                      px={5}
                      py={3}
                      icon={<Icon as={FiClipboard} color="primary.400" />}
                      fontWeight="medium"
                      transition="all 0.2s"
                    >
                      Applications
                    </MenuItem>
                    <MenuItem 
                      as={Link} 
                      href={ROUTES.ADMIN_DRIVER_SCHEDULE} 
                      bg="transparent" 
                      _hover={{ bg: 'rgba(0,194,255,0.1)', color: 'primary.300' }}
                      px={5}
                      py={3}
                      icon={<Icon as={FiClipboard} color="primary.400" />}
                      fontWeight="medium"
                      transition="all 0.2s"
                    >
                      Schedule
                    </MenuItem>
                    <MenuItem 
                      as={Link} 
                      href={ROUTES.ADMIN_DRIVER_EARNINGS} 
                      bg="transparent" 
                      _hover={{ bg: 'rgba(0,194,255,0.1)', color: 'primary.300' }}
                      px={5}
                      py={3}
                      icon={<Icon as={FiDollarSign} color="primary.400" />}
                      fontWeight="medium"
                      transition="all 0.2s"
                    >
                      Earnings
                    </MenuItem>
                    
                    <Box h="1px" bg="rgba(255,255,255,0.08)" my={2} mx={3} />
                    
                    <Text px={5} py={2} fontSize="xs" fontWeight="bold" color="primary.400" textTransform="uppercase" letterSpacing="wider">
                      Staff
                    </Text>
                    <MenuItem 
                      as={Link} 
                      href={ROUTES.ADMIN_STAFF} 
                      bg="transparent" 
                      _hover={{ bg: 'rgba(0,194,255,0.1)', color: 'primary.300' }}
                      px={5}
                      py={3}
                      icon={<Icon as={FiUsers} color="primary.400" />}
                      fontWeight="medium"
                      transition="all 0.2s"
                    >
                      Staff List
                    </MenuItem>
                    <MenuItem 
                      as={Link} 
                      href={ROUTES.ADMIN_STAFF_ATTENDANCE} 
                      bg="transparent" 
                      _hover={{ bg: 'rgba(0,194,255,0.1)', color: 'primary.300' }}
                      px={5}
                      py={3}
                      icon={<Icon as={FiClipboard} color="primary.400" />}
                      fontWeight="medium"
                      transition="all 0.2s"
                    >
                      Attendance
                    </MenuItem>
                    <MenuItem 
                      as={Link} 
                      href={ROUTES.ADMIN_STAFF_REPORTS} 
                      bg="transparent" 
                      _hover={{ bg: 'rgba(0,194,255,0.1)', color: 'primary.300' }}
                      px={5}
                      py={3}
                      icon={<Icon as={FiFileText} color="primary.400" />}
                      fontWeight="medium"
                      transition="all 0.2s"
                    >
                      Reports
                    </MenuItem>
                  </MenuList>
                </Menu>

                {/* Business & Finance */}
                <Menu isLazy placement="bottom-start">
                  <MenuButton
                    as={Button}
                    variant="ghost"
                    size="sm"
                    fontWeight="bold"
                    fontSize="sm"
                    letterSpacing="0.3px"
                    rightIcon={<Icon as={FiChevronDown} />}
                    leftIcon={<Icon as={FiBriefcase} />}
                    _hover={{ 
                      color: 'primary.300', 
                      bg: 'rgba(0,194,255,0.12)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,194,255,0.2)',
                    }}
                    _active={{ 
                      bg: 'rgba(0,194,255,0.18)',
                      transform: 'translateY(0)',
                    }}
                    borderRadius="xl"
                    px={5}
                    height="auto"
                    py={2.5}
                    transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                  >
                    Business
                  </MenuButton>
                  <MenuList 
                    bg="rgba(17, 25, 40, 0.95)"
                    backdropFilter="blur(16px)"
                    borderColor="rgba(0,194,255,0.2)"
                    borderWidth="1px"
                    boxShadow="0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,194,255,0.1)"
                    borderRadius="xl"
                    py={3}
                    overflow="hidden"
                    minW="240px"
                  >
                    <Text px={5} py={2} fontSize="xs" fontWeight="bold" color="primary.400" textTransform="uppercase" letterSpacing="wider">
                      B2B Management
                    </Text>
                    <MenuItem 
                      as={Link} 
                      href="/admin/b2b/companies" 
                      bg="transparent" 
                      _hover={{ bg: 'rgba(0,194,255,0.1)', color: 'primary.300' }}
                      px={5}
                      py={3}
                      icon={<Icon as={FiBriefcase} color="primary.400" />}
                      fontWeight="medium"
                      transition="all 0.2s"
                    >
                      Companies
                    </MenuItem>
                    <MenuItem 
                      as={Link} 
                      href="/admin/b2b/applications" 
                      bg="transparent" 
                      _hover={{ bg: 'rgba(0,194,255,0.1)', color: 'primary.300' }}
                      px={5}
                      py={3}
                      icon={<Icon as={FiClipboard} color="primary.400" />}
                      fontWeight="medium"
                      transition="all 0.2s"
                    >
                      Applications
                    </MenuItem>
                    
                    <Box h="1px" bg="rgba(255,255,255,0.08)" my={2} mx={3} />
                    
                    <Text px={5} py={2} fontSize="xs" fontWeight="bold" color="primary.400" textTransform="uppercase" letterSpacing="wider">
                      Finance
                    </Text>
                    <MenuItem 
                      as={Link} 
                      href={ROUTES.ADMIN_FINANCE} 
                      bg="transparent" 
                      _hover={{ bg: 'rgba(0,194,255,0.1)', color: 'primary.300' }}
                      px={5}
                      py={3}
                      icon={<Icon as={FiDollarSign} color="primary.400" />}
                      fontWeight="medium"
                      transition="all 0.2s"
                    >
                      Finance Dashboard
                    </MenuItem>
                    <MenuItem 
                      as={Link} 
                      href={ROUTES.ADMIN_PAYOUTS} 
                      bg="transparent" 
                      _hover={{ bg: 'rgba(0,194,255,0.1)', color: 'primary.300' }}
                      px={5}
                      py={3}
                      icon={<Icon as={FiDollarSign} color="primary.400" />}
                      fontWeight="medium"
                      transition="all 0.2s"
                    >
                      Payouts
                    </MenuItem>
                    <MenuItem 
                      as={Link} 
                      href={ROUTES.ADMIN_BONUSES} 
                      bg="transparent" 
                      _hover={{ bg: 'rgba(0,194,255,0.1)', color: 'primary.300' }}
                      px={5}
                      py={3}
                      icon={<Icon as={FiDollarSign} color="primary.400" />}
                      fontWeight="medium"
                      transition="all 0.2s"
                    >
                      Bonuses
                    </MenuItem>
                    <MenuItem 
                      as={Link} 
                      href={ROUTES.ADMIN_APPROVALS} 
                      bg="transparent" 
                      _hover={{ bg: 'rgba(0,194,255,0.1)', color: 'primary.300' }}
                      px={5}
                      py={3}
                      icon={<Icon as={FiShield} color="primary.400" />}
                      fontWeight="medium"
                      transition="all 0.2s"
                    >
                      Approvals
                    </MenuItem>
                  </MenuList>
                </Menu>

                {/* Analytics & Insights */}
                <NavPill href={ROUTES.ADMIN_ANALYTICS} label="Analytics" />
                <NavPill href={ROUTES.ADMIN_CHAT} label="Chat" />

                {/* System & Tools */}
                <Menu isLazy placement="bottom-start">
                  <MenuButton
                    as={Button}
                    variant="ghost"
                    size="sm"
                    fontWeight="bold"
                    fontSize="sm"
                    letterSpacing="0.3px"
                    rightIcon={<Icon as={FiChevronDown} />}
                    leftIcon={<Icon as={FiSettings} />}
                    _hover={{ 
                      color: 'primary.300', 
                      bg: 'rgba(0,194,255,0.12)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,194,255,0.2)',
                    }}
                    _active={{ 
                      bg: 'rgba(0,194,255,0.18)',
                      transform: 'translateY(0)',
                    }}
                    borderRadius="xl"
                    px={5}
                    height="auto"
                    py={2.5}
                    transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                  >
                    System
                  </MenuButton>
                  <MenuList 
                    bg="rgba(17, 25, 40, 0.95)"
                    backdropFilter="blur(16px)"
                    borderColor="rgba(0,194,255,0.2)"
                    borderWidth="1px"
                    boxShadow="0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,194,255,0.1)"
                    borderRadius="xl"
                    py={3}
                    overflow="hidden"
                    minW="240px"
                  >
                    <Text px={5} py={2} fontSize="xs" fontWeight="bold" color="primary.400" textTransform="uppercase" letterSpacing="wider">
                      Monitoring
                    </Text>
                    <MenuItem 
                      as={Link} 
                      href={ROUTES.ADMIN_HEALTH} 
                      bg="transparent" 
                      _hover={{ bg: 'rgba(0,194,255,0.1)', color: 'primary.300' }}
                      px={5}
                      py={3}
                      icon={<Icon as={FiActivity} color="primary.400" />}
                      fontWeight="medium"
                      transition="all 0.2s"
                    >
                      System Health
                    </MenuItem>
                    <MenuItem 
                      as={Link} 
                      href={ROUTES.ADMIN_TRACKING} 
                      bg="transparent" 
                      _hover={{ bg: 'rgba(0,194,255,0.1)', color: 'primary.300' }}
                      px={5}
                      py={3}
                      icon={<Icon as={FiActivity} color="primary.400" />}
                      fontWeight="medium"
                      transition="all 0.2s"
                    >
                      Tracking
                    </MenuItem>
                    <MenuItem 
                      as={Link} 
                      href={ROUTES.ADMIN_LOGS} 
                      bg="transparent" 
                      _hover={{ bg: 'rgba(0,194,255,0.1)', color: 'primary.300' }}
                      px={5}
                      py={3}
                      icon={<Icon as={FiFileText} color="primary.400" />}
                      fontWeight="medium"
                      transition="all 0.2s"
                    >
                      Logs
                    </MenuItem>
                    <MenuItem 
                      as={Link} 
                      href={ROUTES.ADMIN_AUDIT_TRAIL} 
                      bg="transparent" 
                      _hover={{ bg: 'rgba(0,194,255,0.1)', color: 'primary.300' }}
                      px={5}
                      py={3}
                      icon={<Icon as={FiShield} color="primary.400" />}
                      fontWeight="medium"
                      transition="all 0.2s"
                    >
                      Audit Trail
                    </MenuItem>
                    
                    <Box h="1px" bg="rgba(255,255,255,0.08)" my={2} mx={3} />
                    
                    <Text px={5} py={2} fontSize="xs" fontWeight="bold" color="primary.400" textTransform="uppercase" letterSpacing="wider">
                      Operations
                    </Text>
                    <MenuItem 
                      as={Link} 
                      href={ROUTES.ADMIN_ROUTES} 
                      bg="transparent" 
                      _hover={{ bg: 'rgba(0,194,255,0.1)', color: 'primary.300' }}
                      px={5}
                      py={3}
                      icon={<Icon as={FiTruck} color="primary.400" />}
                      fontWeight="medium"
                      transition="all 0.2s"
                    >
                      Route Management
                    </MenuItem>
                    <MenuItem 
                      as={Link} 
                      href={ROUTES.ADMIN_VISITORS} 
                      bg="transparent" 
                      _hover={{ bg: 'rgba(0,194,255,0.1)', color: 'primary.300' }}
                      px={5}
                      py={3}
                      icon={<Icon as={FiBarChart2} color="primary.400" />}
                      fontWeight="medium"
                      transition="all 0.2s"
                    >
                      Visitor Analytics
                    </MenuItem>
                    
                    <Box h="1px" bg="rgba(255,255,255,0.08)" my={2} mx={3} />
                    
                    <Text px={5} py={2} fontSize="xs" fontWeight="bold" color="primary.400" textTransform="uppercase" letterSpacing="wider">
                      Content & Support
                    </Text>
                    <MenuItem 
                      as={Link} 
                      href={ROUTES.ADMIN_CONTENT} 
                      bg="transparent" 
                      _hover={{ bg: 'rgba(0,194,255,0.1)', color: 'primary.300' }}
                      px={5}
                      py={3}
                      icon={<Icon as={FiFileText} color="primary.400" />}
                      fontWeight="medium"
                      transition="all 0.2s"
                    >
                      Content Management
                    </MenuItem>
                    <MenuItem 
                      as={Link} 
                      href="/admin/contact-inquiries" 
                      bg="transparent" 
                      _hover={{ bg: 'rgba(0,194,255,0.1)', color: 'primary.300' }}
                      px={5}
                      py={3}
                      icon={<Icon as={FiMessageSquare} color="primary.400" />}
                      fontWeight="medium"
                      transition="all 0.2s"
                    >
                      Contact Inquiries
                    </MenuItem>
                    <MenuItem 
                      as={Link} 
                      href="/admin/callbacks" 
                      bg="transparent" 
                      _hover={{ bg: 'rgba(0,194,255,0.1)', color: 'primary.300' }}
                      px={5}
                      py={3}
                      icon={<Icon as={FiPhone} color="primary.400" />}
                      fontWeight="medium"
                      transition="all 0.2s"
                    >
                      Callback Requests
                    </MenuItem>
                    
                    <Box h="1px" bg="rgba(255,255,255,0.08)" my={2} mx={3} />
                    
                    <Text px={5} py={2} fontSize="xs" fontWeight="bold" color="primary.400" textTransform="uppercase" letterSpacing="wider">
                      Settings
                    </Text>
                    <MenuItem 
                      as={Link} 
                      href={ROUTES.ADMIN_SETTINGS} 
                      bg="transparent" 
                      _hover={{ bg: 'rgba(0,194,255,0.1)', color: 'primary.300' }}
                      px={5}
                      py={3}
                      icon={<Icon as={FiSettings} color="primary.400" />}
                      fontWeight="medium"
                      transition="all 0.2s"
                    >
                      System Settings
                    </MenuItem>
                  </MenuList>
                </Menu>

                {/* Separator */}
                <Box 
                  h="28px" 
                  w="2px" 
                  bgGradient="linear(to-b, transparent, rgba(0,194,255,0.3), transparent)" 
                  mx={2} 
                />

                {/* Quick Actions */}
                <Tooltip 
                  label="Refresh data" 
                  hasArrow 
                  placement="bottom"
                  bg="gray.800"
                  color="white"
                  fontSize="xs"
                  px={3}
                  py={2}
                  borderRadius="lg"
                >
                  <IconButton
                    aria-label="Refresh"
                    icon={<FiRefreshCw />}
                    size="sm"
                    variant="ghost"
                    borderRadius="xl"
                    onClick={() => router.refresh()}
                    _hover={{ 
                      bg: 'rgba(0,194,255,0.15)', 
                      color: 'primary.300',
                      transform: 'rotate(180deg) scale(1.1)',
                      boxShadow: '0 4px 12px rgba(0,194,255,0.3)',
                    }}
                    transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                  />
                </Tooltip>

                {/* Notification Bell */}
                <AdminNotificationBell />

                {/* AI Assistant - Premium Design */}
                <Button
                  size="sm"
                  bgGradient="linear(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)"
                  color="white"
                  fontWeight="bold"
                  letterSpacing="0.5px"
                  leftIcon={<Icon as={RiSparklingFill} />}
                  _hover={{
                    bgGradient: "linear(135deg, #5568d3 0%, #653a8b 50%, #e082ea 100%)",
                    transform: 'translateY(-3px) scale(1.03)',
                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.5), 0 0 20px rgba(240, 147, 251, 0.3)',
                    _before: {
                      left: '100%',
                    }
                  }}
                  _active={{
                    transform: 'translateY(-1px) scale(1.01)',
                  }}
                  borderRadius="xl"
                  px={5}
                  height="auto"
                  py={2.5}
                  transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  boxShadow="0 4px 14px rgba(102, 126, 234, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)"
                  position="relative"
                  overflow="hidden"
                  _before={{
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    transition: 'left 0.5s',
                  }}
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