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
  Tooltip,
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
import { FaWhatsapp } from 'react-icons/fa';
import { m, isValidMotionProp } from 'framer-motion';
import { chakra, shouldForwardProp } from '@chakra-ui/react';
import HeaderButton from '@/components/common/HeaderButton';

const Header: React.FC = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const logoVideoSrc = '/logo/sv-logo.mp4';
  const logoFallbackSrc = '/logo/speedy-van-icon.svg';


  // Theme colors - must be called at top level, not inside useMemo
  // Using same colors as Book Now button for consistency
  const bgColor = useColorModeValue(
    isScrolled ? 'linear-gradient(135deg, #001F3F, #002D6B)' : 'linear-gradient(135deg, #001F3F, #002D6B)',
    isScrolled ? 'linear-gradient(135deg, #001F3F, #002D6B)' : 'linear-gradient(135deg, #001F3F, #002D6B)'
  );
  const borderColor = useColorModeValue('rgba(0, 194, 255, 0.2)', 'rgba(0, 194, 255, 0.2)');
  const shadowColor = useColorModeValue(
    'rgba(0, 180, 255, 0.3)',
    'rgba(0, 180, 255, 0.3)'
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
        label: 'How It Works',
        href: '/how-it-works',
        icon: FiBookOpen,
        ariaLabel: 'See how our service works',
      },
      {
        label: 'Services',
        href: '/services',
        icon: FiSettings,
        hasDropdown: true,
        ariaLabel: 'Explore our moving services',
        children: [
          {
            label: 'Man and Van',
            href: '/man-and-van',
            icon: FiTruck,
            ariaLabel: 'Man and van services',
          },
          {
            label: 'House Removals',
            href: '/house-removals',
            icon: FiHome,
            ariaLabel: 'Full house removal services',
          },
          {
            label: 'Same Day Delivery',
            href: '/same-day-delivery',
            icon: FiTruck,
            ariaLabel: 'Express same day delivery',
          },
          {
            label: 'Single Item Delivery',
            href: '/single-item-delivery',
            icon: FiTruck,
            ariaLabel: 'Single item delivery service',
          },
          {
            label: 'Office Removals',
            href: '/office-removals',
            icon: FiSettings,
            ariaLabel: 'Commercial office relocation',
          },
          {
            label: 'Student Moves',
            href: '/student-moves',
            icon: FiBookOpen,
            ariaLabel: 'Student moving assistance',
          },
          {
            label: 'Facebook Marketplace',
            href: '/facebook-marketplace-delivery',
            icon: FiMapPin,
            ariaLabel: 'Facebook Marketplace collection',
          },
          {
            label: 'Gumtree Pickup',
            href: '/gumtree-pickup-delivery',
            icon: FiMapPin,
            ariaLabel: 'Gumtree pickup and delivery',
          },
          {
            label: 'Sofa Delivery',
            href: '/sofa-delivery-service',
            icon: FiTruck,
            ariaLabel: 'Sofa delivery service',
          },
          {
            label: 'Furniture Collection',
            href: '/furniture-collection-delivery',
            icon: FiTruck,
            ariaLabel: 'Furniture collection and delivery',
          },
          {
            label: 'Assembly Service',
            href: '/assembly-service',
            icon: FiSettings,
            ariaLabel: 'Furniture assembly service',
          },
          {
            label: 'Storage Services',
            href: '/storage-services',
            icon: FiTruck,
            ariaLabel: 'Storage pickup and delivery',
          },
          {
            label: 'Multi-Stop Delivery',
            href: '/multi-stop-delivery',
            icon: FiMapPin,
            ariaLabel: 'Multiple stop delivery',
          },
          {
            label: 'View All Services',
            href: '/services',
            icon: FiSettings,
            ariaLabel: 'View all services',
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
        label: 'How It Works',
        href: '/how-it-works',
        icon: FiBookOpen,
        ariaLabel: 'See how our service works',
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

  const [canPlayLogo, setCanPlayLogo] = useState(false);

  const logoMedia = (
    <React.Fragment>
      <Box
        as="video"
        src={logoVideoSrc}
        autoPlay
        loop
        muted
        playsInline
        w="100%"
        h="100%"
        objectFit="cover"
        border="3px solid"
        borderColor="#00C2FF"
        boxShadow="0 0 20px rgba(0,194,255,0.5), inset 0 0 10px rgba(0,194,255,0.2)"
        transition="all 0.3s ease"
        sx={{
          borderRadius: 'full',
        }}
        hidden={!canPlayLogo}
        onLoadedMetadata={(event: React.SyntheticEvent<HTMLVideoElement>) => {
          event.currentTarget.playbackRate = 0.5;
        }}
        onCanPlay={() => setCanPlayLogo(true)}
        onError={() => setCanPlayLogo(false)}
        _hover={{
          borderColor: '#00D18F',
          boxShadow: '0 0 30px rgba(0,194,255,0.8), inset 0 0 15px rgba(0,194,255,0.4)',
          transform: 'rotate(-5deg)',
        }}
      />
      <Box
        as="img"
        src={logoFallbackSrc}
        alt="Speedy Van logo"
        w="100%"
        h="100%"
        objectFit="cover"
        border="3px solid"
        borderColor="#00C2FF"
        boxShadow="0 0 20px rgba(0,194,255,0.5), inset 0 0 10px rgba(0,194,255,0.2)"
        transition="all 0.3s ease"
        sx={{
          borderRadius: 'full',
        }}
        hidden={canPlayLogo}
      />
    </React.Fragment>
  );

  return (
    <Box
      as="header"
      role="banner"
      className="desktop-header"
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={1000}
      bg={themeColors.bgColor}
      borderBottom={`1px solid ${themeColors.borderColor}`}
      boxShadow={isScrolled ? `0 4px 20px ${themeColors.shadowColor}` : 'sm'}
      backdropFilter={isScrolled ? 'blur(20px)' : 'none'}
      suppressHydrationWarning
      w="100%"
      sx={{
        // iOS safe area support
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <Box maxW="container.xl" mx="auto" px={{ base: 0, md: 0, lg: 0 }} pl={{ base: 2, md: 3, lg: 4 }} pr={{ base: 4, md: 6, lg: 8 }}>
        <Flex
          h={{ base: '72px', md: '120px', lg: '140px' }}
          align="center"
          justify="space-between"
          gap={6}
          suppressHydrationWarning
        >
          {/* Enhanced Logo */}
          <MotionFlex
            gap={3}
            alignItems="center"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 } as any}
            cursor="pointer"
            onClick={() => window.location.href = '/'}
            ml={{ base: '-128px', md: '-128px', lg: '-128px' }}
            flexShrink={0}
          >
            <Box
              position="relative"
              w={{ base: '80px', md: '70px', lg: '75px' }}
              h={{ base: '80px', md: '70px', lg: '75px' }}
              borderRadius="full"
              overflow="hidden"
              _before={{
                content: '""',
                position: 'absolute',
                top: '-4px',
                left: '-4px',
                right: '-4px',
                bottom: '-4px',
                borderRadius: 'full',
                background: 'linear-gradient(135deg, #00C2FF, #00D18F)',
                opacity: 0.6,
                filter: 'blur(8px)',
                animation: 'pulse 2s ease-in-out infinite',
                zIndex: -1,
              }}
              _hover={{
                _before: {
                  opacity: 1,
                  filter: 'blur(12px)',
                }
              }}
            >
              {logoMedia}
            </Box>
            <VStack align="start" spacing={0.5} display={{ base: 'none', md: 'flex' }}>
              <Text fontSize={{ md: 'lg', lg: 'xl' }} fontWeight="bold" color="white" lineHeight="1.2">
                Speedy Van
              </Text>
              <Text fontSize="sm" color="rgba(255,255,255,0.8)" fontWeight="medium" lineHeight="1.2">
                Professional Moving Services
              </Text>
            </VStack>
          </MotionFlex>

          {/* Enhanced Desktop Navigation */}
          <HStack spacing={4} flex={1} justify="center" display={{ base: 'none', md: 'flex' }}>
            {navItems.map((item) => (
              <Box
                key={item.label}
                suppressHydrationWarning
              >
                {item.hasDropdown ? (
                  <Menu>
                    <MenuButton
                      as={Button}
                      rightIcon={<FiChevronDown />}
                      h="42px"
                      minW="auto"
                      borderRadius="lg"
                      bg="rgba(255,255,255,0.15)"
                      color="white"
                      fontWeight="600"
                      fontSize="sm"
                      border="1px solid"
                      borderColor="rgba(255,255,255,0.2)"
                      backdropFilter="blur(10px)"
                      transition="all 0.3s ease"
                      boxShadow="0 2px 8px rgba(0,0,0,0.1)"
                      sx={{
                        paddingLeft: '32px !important',
                        paddingRight: '80px !important',
                      }}
                      _hover={{
                        bg: 'rgba(255,255,255,0.25)',
                        borderColor: '#00C2FF',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,194,255,0.3)',
                      }}
                      _active={{
                        transform: 'translateY(0px)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }}
                      _expanded={{
                        bg: 'rgba(255,255,255,0.25)',
                        borderColor: '#00C2FF',
                      }}
                      >
                        {item.label}
                      </MenuButton>
                      <MenuList
                        bg="rgba(26, 26, 26, 0.98)"
                        border="1px solid"
                        borderColor="rgba(59, 130, 246, 0.3)"
                        borderRadius="xl"
                        boxShadow="0 10px 40px rgba(0,0,0,0.3)"
                        p={2}
                        backdropFilter="blur(10px)"
                        sx={{
                          '& .chakra-menu__menuitem': {
                            color: 'white !important',
                            bg: 'transparent !important',
                          },
                        }}
                      >
                        {item.children?.map((child) => (
                          <MenuItem
                            key={child.label}
                            icon={<child.icon />}
                            color="white"
                            bg="transparent"
                            _hover={{
                              bg: 'rgba(59, 130, 246, 0.2) !important',
                              color: 'neon.400 !important',
                            }}
                            _focus={{
                              bg: 'rgba(59, 130, 246, 0.2) !important',
                              color: 'neon.400 !important',
                            }}
                            _active={{
                              bg: 'rgba(59, 130, 246, 0.3) !important',
                              color: 'neon.400 !important',
                            }}
                            borderRadius="lg"
                            onClick={() => window.location.href = child.href}
                            sx={{
                              color: 'white !important',
                              bg: 'transparent !important',
                            }}
                          >
                            {child.label}
                          </MenuItem>
                        ))}
                      </MenuList>
                    </Menu>
                  ) : (
                    <Button
                      as={Link}
                      href={item.href}
                      size="md"
                      h="42px"
                      px={['How It Works', 'Pricing', 'Contact'].includes(item.label) ? 12 : 6}
                      borderRadius="lg"
                      bg="rgba(255,255,255,0.15)"
                      color="white"
                      fontWeight="600"
                      fontSize="sm"
                      border="1px solid"
                      borderColor="rgba(255,255,255,0.2)"
                      backdropFilter="blur(10px)"
                      transition="all 0.3s ease"
                      boxShadow="0 2px 8px rgba(0,0,0,0.1)"
                      _hover={{
                        bg: 'rgba(255,255,255,0.25)',
                        borderColor: '#00C2FF',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,194,255,0.3)',
                        textDecoration: 'none',
                      }}
                      _active={{
                        transform: 'translateY(0px)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }}
                    >
                      {item.label}
                    </Button>
                  )}
                </Box>
              ))}
            </HStack>

          {/* Enhanced Desktop CTA Buttons */}
          <HStack
            spacing={0}
            display="flex"
            ml={{ base: 0, md: 'auto' }}
            flexShrink={0}
            sx={{
              '& > * + *': {
                marginLeft: '24px',
              },
            }}
          >
            <Tooltip label="Chat with us" hasArrow placement="bottom">
              <Button
                leftIcon={<FiMessageCircle size={16} />}
                aria-label="Open chat"
                onClick={() => {
                  if (typeof window === 'undefined') return;
                  window.location.href = '/booking-luxury?openChat=1';
                }}
                size="md"
                h="42px"
                px={5}
                borderRadius="lg"
                bg="rgba(255,255,255,0.15)"
                color="white"
                fontWeight="600"
                fontSize="sm"
                border="1px solid"
                borderColor="rgba(255,255,255,0.2)"
                backdropFilter="blur(10px)"
                display={{ base: 'none', md: 'inline-flex' }}
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                transition="all 0.3s ease"
                boxShadow="0 2px 8px rgba(0,0,0,0.1)"
                _hover={{
                  bg: 'rgba(255,255,255,0.25)',
                  borderColor: '#00C2FF',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,194,255,0.3)',
                  textDecoration: 'none',
                }}
                _active={{
                  transform: 'translateY(0px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
                suppressHydrationWarning
              >
                Chat
              </Button>
            </Tooltip>
            

            <Tooltip label="Chat / Book on WhatsApp" hasArrow placement="bottom">
              <Button
                leftIcon={<FaWhatsapp size={16} />}
                aria-label="WhatsApp"
                onClick={() => {
                  if (typeof window === 'undefined') return;
                  window.open('https://wa.me/message/K57JWNNC2K3TA1', '_blank', 'noopener,noreferrer');
                }}
                size="md"
                h="42px"
                px={5}
                borderRadius="lg"
                bg="rgba(255,255,255,0.15)"
                color="white"
                fontWeight="600"
                fontSize="sm"
                border="1px solid"
                borderColor="rgba(255,255,255,0.2)"
                backdropFilter="blur(10px)"
                display={{ base: 'none', md: 'inline-flex' }}
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                transition="all 0.3s ease"
                boxShadow="0 2px 8px rgba(0,0,0,0.1)"
                _hover={{
                  bg: 'rgba(255,255,255,0.25)',
                  borderColor: '#25D366',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(37,211,102,0.3)',
                  textDecoration: 'none',
                }}
                _active={{
                  transform: 'translateY(0px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
                suppressHydrationWarning
              >
                WhatsApp
              </Button>
            </Tooltip>
            <Tooltip label="Call us now" hasArrow placement="bottom">
              <Button
                as="a"
                href="tel:+441202129746"
                leftIcon={<FiPhone size={16} />}
                aria-label="Call now"
                size="md"
                h="42px"
                px={5}
                borderRadius="lg"
                bg="rgba(255,255,255,0.15)"
                color="white"
                fontWeight="600"
                fontSize="sm"
                border="1px solid"
                borderColor="rgba(255,255,255,0.2)"
                backdropFilter="blur(10px)"
                display={{ base: 'none', md: 'inline-flex' }}
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                transition="all 0.3s ease"
                boxShadow="0 2px 8px rgba(0,0,0,0.1)"
                _hover={{
                  bg: 'rgba(255,255,255,0.25)',
                  borderColor: '#00D18F',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,209,143,0.3)',
                  textDecoration: 'none',
                }}
                _active={{
                  transform: 'translateY(0px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
                suppressHydrationWarning
              >
                Call
              </Button>
            </Tooltip>
              
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<FiChevronDown />}
                size="md"
                h="42px"
                px={5}
                borderRadius="lg"
                bg="rgba(255,255,255,0.15)"
                color="white"
                fontWeight="600"
                fontSize="sm"
                border="1px solid"
                borderColor="rgba(255,255,255,0.2)"
                backdropFilter="blur(10px)"
                transition="all 0.3s ease"
                boxShadow="0 2px 8px rgba(0,0,0,0.1)"
                _hover={{
                  bg: 'rgba(255,255,255,0.25)',
                  borderColor: '#FFD700',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(255,215,0,0.3)',
                }}
                _active={{
                  transform: 'translateY(0px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
                _expanded={{
                  bg: 'rgba(255,255,255,0.25)',
                  borderColor: '#FFD700',
                }}
              >
                Sign In
              </MenuButton>
                <MenuList
                  bg="rgba(26, 26, 26, 0.98)"
                  border="1px solid"
                  borderColor="rgba(59, 130, 246, 0.3)"
                  borderRadius="xl"
                  boxShadow="0 10px 40px rgba(0,0,0,0.3)"
                  p={2}
                  backdropFilter="blur(10px)"
                  sx={{
                    '& .chakra-menu__menuitem': {
                      color: 'white !important',
                      bg: 'transparent !important',
                    },
                  }}
                >
                  <MenuItem
                    icon={<FiUsers />}
                    color="white"
                    bg="transparent"
                    onClick={() => {
                      console.log('👤 Customer Sign In clicked - redirecting to /customer/login');
                      window.location.href = '/customer/login';
                    }}
                    _hover={{ 
                      bg: 'rgba(59, 130, 246, 0.2) !important', 
                      color: 'neon.400 !important' 
                    }}
                    _focus={{ 
                      bg: 'rgba(59, 130, 246, 0.2) !important', 
                      color: 'neon.400 !important' 
                    }}
                    _active={{ 
                      bg: 'rgba(59, 130, 246, 0.3) !important', 
                      color: 'neon.400 !important' 
                    }}
                    borderRadius="lg"
                    sx={{
                      color: 'white !important',
                      bg: 'transparent !important',
                    }}
                  >
                    Customer Portal
                  </MenuItem>
                  <MenuItem
                    icon={<FiUser />}
                    color="white"
                    bg="transparent"
                    onClick={() => {
                      console.log('🚚 Driver Sign In clicked - redirecting to /driver-auth');
                      window.location.href = '/driver-auth';
                    }}
                    _hover={{ 
                      bg: 'rgba(59, 130, 246, 0.2) !important', 
                      color: 'neon.400 !important' 
                    }}
                    _focus={{ 
                      bg: 'rgba(59, 130, 246, 0.2) !important', 
                      color: 'neon.400 !important' 
                    }}
                    _active={{ 
                      bg: 'rgba(59, 130, 246, 0.3) !important', 
                      color: 'neon.400 !important' 
                    }}
                    borderRadius="lg"
                    sx={{
                      color: 'white !important',
                      bg: 'transparent !important',
                    }}
                  >
                    Driver Portal
                  </MenuItem>
                  <MenuDivider borderColor="rgba(59, 130, 246, 0.2)" />
                  <MenuItem
                    icon={<FiUserPlus />}
                    color="neon.400"
                    bg="transparent"
                    onClick={() => {
                      console.log('🚚 Become Driver clicked - redirecting to /driver-application');
                      window.location.href = '/driver-application';
                    }}
                    _hover={{ 
                      bg: 'rgba(59, 130, 246, 0.2) !important', 
                      color: 'neon.300 !important' 
                    }}
                    _focus={{ 
                      bg: 'rgba(59, 130, 246, 0.2) !important', 
                      color: 'neon.300 !important' 
                    }}
                    _active={{ 
                      bg: 'rgba(59, 130, 246, 0.3) !important', 
                      color: 'neon.300 !important' 
                    }}
                    borderRadius="lg"
                    sx={{
                      color: 'neon.400 !important',
                      bg: 'transparent !important',
                    }}
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
              color="white"
              _hover={{
                bg: 'rgba(255,255,255,0.1)',
                color: 'neon.400',
              }}
              borderRadius="xl"
            />
          </MotionBox>
        </Flex>
      </Box>

      {/* Enhanced Mobile Navigation Drawer */}
      <Drawer isOpen={isOpen} onClose={toggleMenu} placement="right" size="md">
        <DrawerOverlay bg="rgba(0,0,0,0.7)" backdropFilter="blur(10px)" />
        <DrawerContent 
          bg="linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(15, 17, 20, 0.98) 100%)"
          backdropFilter="blur(20px)"
          borderLeftRadius="2xl"
          borderLeft="1px solid"
          borderColor="rgba(59, 130, 246, 0.3)"
        >
          <DrawerCloseButton
            size="lg"
            color="white"
            _hover={{ bg: 'rgba(59, 130, 246, 0.2)', color: 'neon.400' }}
            top={6}
            right={6}
          />
          <DrawerHeader 
            pt={8} 
            pb={4}
            borderBottomWidth="1px"
            borderColor="rgba(59, 130, 246, 0.3)"
            bg="rgba(30, 64, 175, 0.1)"
          >
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
                  boxShadow="0 0 20px rgba(0, 194, 255, 0.4)"
                >
                  SV
                </Box>
                <Text color="white" fontWeight="bold" fontSize="xl">
                  Menu
                </Text>
              </HStack>
            </VStack>
          </DrawerHeader>
          
          <DrawerBody pt={0} bg="rgba(15, 17, 20, 0.95)">
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
                    color="white"
                    borderBottom="1px solid"
                    borderColor="rgba(59, 130, 246, 0.2)"
                    _hover={{
                      bg: 'rgba(59, 130, 246, 0.2)',
                      color: '#00C2FF',
                      transform: 'translateX(8px)',
                      borderColor: 'rgba(59, 130, 246, 0.4)',
                    }}
                    borderRadius="lg"
                    transition="all 0.3s ease"
                  >
                    {item.label}
                  </Button>
                </MotionBox>
              ))}
              
              <Divider my={6} borderColor="rgba(59, 130, 246, 0.3)" />
              
              {/* Enhanced Mobile CTA Buttons */}
              <VStack spacing={4} px={2}>
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
                    console.log('👤 Customer Sign In (mobile) clicked - redirecting to /customer/login');
                    window.location.href = '/customer/login';
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
                    console.log('🚚 Driver Sign In (mobile) clicked - redirecting to /driver-auth');
                    window.location.href = '/driver-auth';
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
                        +44 1202129746
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
    </Box>
  );
});

export default Header;
