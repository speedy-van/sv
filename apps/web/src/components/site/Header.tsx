'use client';

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Button,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useColorModeValue,
  Link,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
} from '@chakra-ui/react';
import { 
  FiMenu, 
  FiX, 
  FiTruck, 
  FiPhone, 
  FiMail, 
  FiUser, 
  FiUsers, 
  FiHome, 
  FiInfo, 
  FiSettings, 
  FiDollarSign, 
  FiMessageCircle,
  FiChevronDown,
  FiUserPlus,
  FiBookOpen,
  FiMapPin
} from 'react-icons/fi';
import { m, isValidMotionProp } from 'framer-motion';
import { chakra, shouldForwardProp } from '@chakra-ui/react';
import HeaderButton from '@/components/common/HeaderButton';

const Header: React.FC = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);


  // Theme colors - must be called at top level, not inside useMemo
  const bgColor = useColorModeValue(
    isScrolled ? 'rgba(255,255,255,0.95)' : 'white',
    isScrolled ? 'rgba(26,32,44,0.95)' : 'gray.800'
  );
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const shadowColor = useColorModeValue(
    'rgba(0,0,0,0.1)',
    'rgba(0,0,0,0.3)'
  );

  // Memoized theme colors object for better performance
  const themeColors = useMemo(() => ({
    bgColor,
    borderColor,
    shadowColor,
  }), [bgColor, borderColor, shadowColor]);

  // Optimized mount effect to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Optimized scroll effect with throttling for better performance
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Memoized callback for menu toggle with accessibility
  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Memoized navigation items for better performance
  const navItems = useMemo(
    () => [
      {
        label: 'About',
        href: '/about',
        icon: FiInfo,
        ariaLabel: 'Learn more about Speedy Van',
      },
      {
        label: 'Services',
        href: '/services',
        icon: FiSettings,
        hasDropdown: true,
        ariaLabel: 'Explore our moving services',
        children: [
          {
            label: 'House Moving',
            href: '/services/house-moving',
            icon: FiHome,
            ariaLabel: 'Residential moving services',
          },
          {
            label: 'Office Relocation',
            href: '/services/office',
            icon: FiSettings,
            ariaLabel: 'Commercial office relocation',
          },
          {
            label: 'Furniture Delivery',
            href: '/services/furniture',
            icon: FiTruck,
            ariaLabel: 'Furniture delivery services',
          },
          {
            label: 'Student Moving',
            href: '/services/student',
            icon: FiBookOpen,
            ariaLabel: 'Student moving assistance',
          },
        ],
      },
      {
        label: 'Pricing',
        href: '/pricing',
        icon: FiDollarSign,
        ariaLabel: 'View our pricing plans',
      },
      {
        label: 'Contact',
        href: '/contact',
        icon: FiMessageCircle,
        ariaLabel: 'Get in touch with us',
      },
    ],
    []
  );

  const mobileNavItems = useMemo(
    () => [
      {
        label: 'About',
        href: '/about',
        icon: FiInfo,
        ariaLabel: 'Learn more about Speedy Van',
      },
      {
        label: 'Services',
        href: '/services',
        icon: FiSettings,
        ariaLabel: 'Explore our moving services',
      },
      {
        label: 'Pricing',
        href: '/pricing',
        icon: FiDollarSign,
        ariaLabel: 'View our pricing plans',
      },
      {
        label: 'Contact',
        href: '/contact',
        icon: FiMessageCircle,
        ariaLabel: 'Get in touch with us',
      },
    ],
    []
  );
  // Removed extraneous closing brackets and empty dependency array.
  // The previous code had a redundant ], []); after the mobileNavItems useMemo.
  // No code is needed here; the useMemo for mobileNavItems is already properly closed above.

  const MotionBox = chakra(m.div, {
    shouldForwardProp: (prop) => {
      if (typeof prop === 'string') {
        return isValidMotionProp(prop) || shouldForwardProp(prop);
      }
      return shouldForwardProp(prop);
    },
  });
  const MotionFlex = chakra(m.div, {
    shouldForwardProp: (prop) => {
      if (typeof prop === 'string') {
        return isValidMotionProp(prop) || shouldForwardProp(prop);
      }
      return shouldForwardProp(prop);
    },
  });

  return (
    <MotionBox
      as="header"
      role="banner"
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={1000}
      borderBottom={`1px solid ${themeColors.borderColor}`}
      boxShadow={isScrolled ? `0 4px 20px ${themeColors.shadowColor}` : 'sm'}
      backdropFilter={isScrolled ? 'blur(20px)' : 'none'}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' } as any}
      aria-label="Main navigation"
    >
      <Box maxW="container.xl" mx="auto" px={{ base: 4, md: 6, lg: 8 }}>
        <Flex
          h={{ base: '80px', md: '130px', lg: '140px' }}
          align={isMounted ? "center" : undefined}
          justify="space-between"
          gap={6}
        >
          {/* Enhanced Logo */}
          <MotionFlex
            gap={3}
            alignItems="center"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 } as any}
            cursor="pointer"
            onClick={() => window.location.href = '/'}
            ml={{ base: 2, md: 0 }}
            flexShrink={0}
          >
            <MotionBox
              w={{ base: '42px', md: '48px', lg: '52px' }}
              h={{ base: '42px', md: '48px', lg: '52px' }}
              bg="linear-gradient(135deg, #00C2FF, #00D18F)"
              borderRadius="lg"
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="white"
              fontSize={{ base: 'md', md: 'lg', lg: 'xl' }}
              fontWeight="bold"
              boxShadow="0 4px 15px rgba(0,194,255,0.3)"
              whileHover={{
                rotate: [0, -5, 5, -5, 0],
                boxShadow: "0 8px 25px rgba(0,194,255,0.5)"
              }}
              transition={{ duration: 0.5 } as any}
            >
              SV
            </MotionBox>
            <VStack align="start" spacing={0.5} display={{ base: 'none', md: 'flex' }}>
              <Text fontSize={{ md: 'lg', lg: 'xl' }} fontWeight="bold" color="text.primary" lineHeight="1.2">
                Speedy Van
              </Text>
              <Text fontSize="sm" color="text.secondary" fontWeight="medium" lineHeight="1.2">
                Professional Moving Services
              </Text>
            </VStack>
          </MotionFlex>

          {/* Enhanced Desktop Navigation */}
          <HStack spacing={8} flex={1} justify="center" display={{ base: 'none', md: 'flex' }}>
            {navItems.map((item, index) => (
              <MotionBox
                key={item.label}
                initial={false}
                animate={isMounted ? { opacity: 1, y: 0 } : { opacity: 0 }}
                transition={{ delay: index * 0.06 } as any}
              >
                {item.hasDropdown ? (
                  <Menu>
                    <MenuButton
                      as={HeaderButton}
                      variant="ghost"
                      rightIcon={<FiChevronDown />}
                      size="md"
                      animate={false}
                      h="48px"
                      px={4}
                      color="text.primary"
                      _hover={{
                        color: 'neon.400',
                        bg: 'rgba(0,194,255,0.05)',
                      }}
                      >
                        {item.label}
                      </MenuButton>
                      <MenuList
                        bg="white"
                        border="1px solid"
                        borderColor="gray.200"
                        borderRadius="xl"
                        boxShadow="0 10px 40px rgba(0,0,0,0.1)"
                        p={2}
                      >
                        {item.children?.map((child) => (
                          <MenuItem
                            key={child.label}
                            icon={<child.icon />}
                            _hover={{
                              bg: 'rgba(0,194,255,0.1)',
                              color: 'neon.400',
                            }}
                            borderRadius="lg"
                            onClick={() => window.location.href = child.href}
                          >
                            {child.label}
                          </MenuItem>
                        ))}
                      </MenuList>
                    </Menu>
                  ) : (
                    <Link
                      href={item.href}
                      position="relative"
                      display="flex"
                      alignItems="center"
                      h="48px"
                      px={4}
                      color="text.primary"
                      fontWeight="semibold"
                      fontSize="md"
                      borderRadius="md"
                      transition="all 0.3s ease"
                      _hover={{
                        color: 'neon.400',
                        bg: 'rgba(0,194,255,0.05)',
                        transform: 'translateY(-2px)',
                        textDecoration: 'none',
                      }}
                      _after={{
                        content: '""',
                        position: 'absolute',
                        bottom: '-4px',
                        left: '0',
                        width: '0',
                        height: '2px',
                        bg: 'linear-gradient(90deg, #00C2FF, #00D18F)',
                        transition: 'width 0.3s ease',
                      }}
                      sx={{
                        '&:hover::after': {
                          width: '100%',
                        }
                      }}
                    >
                      {item.label}
                    </Link>
                  )}
                </MotionBox>
              ))}
            </HStack>

          {/* Enhanced Desktop CTA Buttons */}
          <HStack
            spacing={4}
            display="flex"
          >
            <HeaderButton
              variant="neon"
              size="lg"
              onClick={() => window.open('tel:+441202129746')}
              leftIcon={<FiPhone />}
              animate={true}
              minW={{ base: '100px', lg: '120px' }}
            >
              Call Now
            </HeaderButton>
              
            <Menu>
              <MenuButton
                as={HeaderButton}
                variant="primary"
                size="lg"
                rightIcon={<FiChevronDown />}
                minW={{ base: '100px', lg: '120px' }}
              >
                Sign In
              </MenuButton>
                <MenuList
                  bg="white"
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="xl"
                  boxShadow="0 10px 40px rgba(0,0,0,0.1)"
                  p={2}
                >
                  <MenuItem
                    icon={<FiUsers />}
                    onClick={() => {
                      console.log('👤 Customer Sign In clicked - redirecting to /auth/login');
                      window.location.href = '/auth/login?role=customer';
                    }}
                    _hover={{ bg: 'rgba(0,194,255,0.1)' }}
                    borderRadius="lg"
                  >
                    Customer Portal
                  </MenuItem>
                  <MenuItem
                    icon={<FiUser />}
                    onClick={() => {
                      console.log('🚚 Driver Sign In clicked - redirecting to /auth/login');
                      window.location.href = '/auth/login?role=driver';
                    }}
                    _hover={{ bg: 'rgba(0,194,255,0.1)' }}
                    borderRadius="lg"
                  >
                    Driver Portal
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem
                    icon={<FiUserPlus />}
                    onClick={() => {
                      console.log('🚚 Become Driver clicked - redirecting to /driver-application');
                      window.location.href = '/driver-application';
                    }}
                    _hover={{ bg: 'rgba(0,194,255,0.1)' }}
                    borderRadius="lg"
                    color="neon.400"
                  >
                    Become Driver
                  </MenuItem>
                </MenuList>
              </Menu>
            </HStack>

          {/* Enhanced Mobile Menu Button */}
          <MotionBox
            display={{ base: 'block', md: 'none' }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 } as any}
          >
            <IconButton
              icon={isOpen ? <FiX /> : <FiMenu />}
              onClick={toggleMenu}
              variant="ghost"
              size="lg"
              aria-label="Toggle menu"
              color="text.primary"
              _hover={{
                bg: 'rgba(0,194,255,0.1)',
                color: 'neon.400',
              }}
              borderRadius="xl"
            />
          </MotionBox>
        </Flex>
      </Box>

      {/* Enhanced Mobile Navigation Drawer */}
      <Drawer isOpen={isOpen} onClose={toggleMenu} placement="right" size="md">
        <DrawerOverlay bg="rgba(0,0,0,0.4)" backdropFilter="blur(4px)" />
        <DrawerContent bg="white" borderLeftRadius="2xl">
          <DrawerCloseButton
            size="lg"
            color="text.primary"
            _hover={{ color: 'neon.400' }}
            top={6}
            right={6}
          />
          <DrawerHeader pt={8} pb={4}>
            <VStack align="start" spacing={3}>
              <HStack spacing={3}>
                <Box
                  w="40px"
                  h="40px"
                  bg="linear-gradient(135deg, #00C2FF, #00D18F)"
                  borderRadius="lg"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  color="white"
                  fontSize="md"
                  fontWeight="bold"
                >
                  SV
                </Box>
              </HStack>
            </VStack>
          </DrawerHeader>
          
          <DrawerBody pt={0}>
            <VStack spacing={1} align="stretch">
              {mobileNavItems.map((item, index) => (
                <MotionBox
                  key={item.label}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 } as any}
                >
                  <Button
                    variant="ghost"
                    justifyContent="start"
                    leftIcon={<item.icon size={20} />}
                    onClick={() => {
                      window.location.href = item.href;
                      toggleMenu();
                    }}
                    h="60px"
                    fontSize="md"
                    fontWeight="semibold"
                    color="text.primary"
                    _hover={{
                      bg: 'rgba(0,194,255,0.1)',
                      color: 'neon.400',
                      transform: 'translateX(8px)',
                    }}
                    borderRadius="xl"
                    transition="all 0.3s ease"
                  >
                    {item.label}
                  </Button>
                </MotionBox>
              ))}
              
              <Divider my={6} />
              
              {/* Enhanced Mobile CTA Buttons */}
              <VStack spacing={4}>
                <HeaderButton
                  variant="neon"
                  fullWidth
                  size="lg"
                  onClick={() => {
                    window.open('tel:+441202129746');
                    toggleMenu();
                  }}
                  leftIcon={<FiPhone />}
                  animate={true}
                >
                  Call Now
                </HeaderButton>
                
                <HeaderButton
                  variant="outline"
                  fullWidth
                  size="lg"
                  onClick={() => {
                    console.log('👤 Customer Sign In (mobile) clicked - redirecting to /auth/login');
                    window.location.href = '/auth/login?role=customer';
                    toggleMenu();
                  }}
                  leftIcon={<FiUsers />}
                  animate={true}
                >
                  Customer Sign In
                </HeaderButton>
                
                <HeaderButton
                  variant="ghost"
                  fullWidth
                  size="lg"
                  onClick={() => {
                    console.log('🚚 Driver Sign In (mobile) clicked - redirecting to /auth/login');
                    window.location.href = '/auth/login?role=driver';
                    toggleMenu();
                  }}
                  leftIcon={<FiUser />}
                  animate={true}
                >
                  Driver Sign In
                </HeaderButton>
                
                <HeaderButton
                  variant="neon"
                  fullWidth
                  size="lg"
                  onClick={() => {
                    console.log('🚚 Become Driver (mobile) clicked - redirecting to /driver-application');
                    window.location.href = '/driver-application';
                    toggleMenu();
                  }}
                  leftIcon={<FiUserPlus />}
                  animate={true}
                >
                  Become Driver
                </HeaderButton>
                
                <HeaderButton
                  variant="primary"
                  fullWidth
                  size="lg"
                  onClick={() => {
                    window.location.href = '/booking-luxury';
                    toggleMenu();
                  }}
                  pulse={true}
                  animate={true}
                >
                  Book Your Move
                </HeaderButton>
              </VStack>

              <Divider my={6} />

              {/* Enhanced Contact Info */}
              <VStack spacing={4} align="stretch">
                <Text fontSize="md" fontWeight="bold" color="text.primary">
                  Contact Information
                </Text>
                <VStack spacing={3} align="stretch">
                  <HStack spacing={3} p={3} bg="rgba(0,194,255,0.05)" borderRadius="xl">
                    <Box
                      w="40px"
                      h="40px"
                      bg="neon.400"
                      borderRadius="lg"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      color="white"
                    >
                      <FiPhone size={20} />
                    </Box>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="semibold" color="text.primary">
                        Phone
                      </Text>
                      <Text fontSize="sm" color="text.secondary">
                        +44 7901846297
                      </Text>
                    </VStack>
                  </HStack>
                  
                  <HStack spacing={3} p={3} bg="rgba(0,209,143,0.05)" borderRadius="xl">
                    <Box
                      w="40px"
                      h="40px"
                      bg="green.400"
                      borderRadius="lg"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      color="white"
                    >
                      <FiMail size={20} />
                    </Box>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="semibold" color="text.primary">
                        Email
                      </Text>
                      <Text fontSize="sm" color="text.secondary">
                        support@speedy-van.co.uk
                      </Text>
                    </VStack>
                  </HStack>
                  
                  <HStack spacing={3} p={3} bg="rgba(255,193,7,0.05)" borderRadius="xl">
                    <Box
                      w="40px"
                      h="40px"
                      bg="yellow.400"
                      borderRadius="lg"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      color="white"
                    >
                      <FiMapPin size={20} />
                    </Box>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="semibold" color="text.primary">
                        Address
                      </Text>
                      <Text fontSize="sm" color="text.secondary">
                        Office 2.18 1 Barrack St, Hamilton ML3 0HS
                      </Text>
                    </VStack>
                  </HStack>
                </VStack>
              </VStack>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </MotionBox>
  );
});

export default Header;
