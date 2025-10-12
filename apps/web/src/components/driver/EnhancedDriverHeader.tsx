'use client';

import React from 'react';
import {
  Box,
  Flex,
  Text,
  Badge,
  HStack,
  VStack,
  Button,
  Icon,
  useColorModeValue,
  useColorMode,
  Avatar,
  IconButton,
  Tooltip,
  useBreakpointValue,
  useDisclosure,
  Circle,
  Container,
  Hide,
  Show,
} from '@chakra-ui/react';
import {
  FaBell,
  FaCog,
  FaSignOutAlt,
  FaTruck,
  FaMapMarkerAlt,
  FaBars,
  FaSync,
  FaHome,
  FaClipboardList,
  FaChartBar,
  FaMoon,
  FaSun,
} from 'react-icons/fa';
import { DriverDrawerMenu } from './DriverDrawerMenu';

interface Driver {
  id: string;
  name: string;
  status: string;
  location?: string;
  vehicle?: string;
}

interface EnhancedDriverHeaderProps {
  driver: Driver;
  onRefresh: () => void;
  onSettings: () => void;
  onLogout: () => void;
  isRefreshing?: boolean;
}

export function EnhancedDriverHeader({
  driver,
  onRefresh,
  onSettings,
  onLogout,
  isRefreshing = false,
}: EnhancedDriverHeaderProps) {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  
  // Use Admin dashboard styling - dark theme with neon accents
  const bgGradient = 'linear(to-r, bg.card, bg.surface)';
  const textColor = 'text.primary';
  const textSecondary = 'text.secondary';
  const accentColor = 'neon.400';

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'green';
      case 'busy': return 'orange';
      case 'offline': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Box
      bgGradient={bgGradient}
      color={textColor}
      px={{ base: 4, md: 6 }}
      py={{ base: 4, md: 5 }}
      boxShadow="xl"
      position="relative"
      overflow="hidden"
    >
      {/* Background Pattern */}
      <Box
        position="absolute"
        top="0"
        right="0"
        w="200px"
        h="100%"
        bgGradient="linear(45deg, rgba(255,255,255,0.1), transparent)"
        transform="rotate(12deg)"
        transformOrigin="top"
      />
      
      <Container maxW="7xl" p={0}>
        <Flex justify="space-between" align="center" position="relative" zIndex="2">
          {/* Left: Brand + Logo */}
          <HStack spacing={4} flex="1">
            {/* Logo Circle with Icon */}
            <Circle
              size={{ base: "60px", md: "70px" }}
              bg={accentColor}
              color="blue.800"
              boxShadow="lg"
            >
              <Icon as={FaTruck} boxSize={{ base: "28px", md: "32px" }} />
            </Circle>
            
            {/* Brand Text */}
            <VStack align="start" spacing={0}>
              <Text
                fontSize={{ base: "2xl", md: "3xl" }}
                fontWeight="black"
                color={textColor}
                letterSpacing="tight"
                textShadow="0 2px 4px rgba(0,0,0,0.3)"
              >
                Speedy Van
              </Text>
              <Hide below="md">
                <Text
                  fontSize="sm"
                  color="blue.100"
                  fontWeight="semibold"
                  letterSpacing="wide"
                  textTransform="uppercase"
                >
                  Driver Portal
                </Text>
              </Hide>
            </VStack>
          </HStack>

          {/* Center: Driver Status (Desktop) */}
          <Hide below="lg">
            <VStack spacing={2} flex="1" maxW="300px">
              <HStack spacing={3}>
                <Avatar
                  size="md"
                  name={driver.name}
                  bg="white"
                  color="blue.800"
                />
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" fontWeight="bold" color="white">
                    {driver.name}
                  </Text>
                  <HStack spacing={2}>
                    <Badge
                      colorScheme={getStatusColor(driver.status)}
                      variant="solid"
                      fontSize="xs"
                      px={2}
                    >
                      {driver.status}
                    </Badge>
                    {driver.location && (
                      <HStack spacing={1}>
                        <Icon as={FaMapMarkerAlt} boxSize="10px" />
                        <Text fontSize="xs" color="blue.100">
                          {driver.location}
                        </Text>
                      </HStack>
                    )}
                  </HStack>
                </VStack>
              </HStack>
            </VStack>
          </Hide>

          {/* Right: Actions */}
          <HStack spacing={3} flex="1" justify="end">
            {/* Refresh Button */}
            <Tooltip label="Refresh Data" placement="bottom">
              <IconButton
                aria-label="Refresh"
                icon={<FaSync />}
                size="lg"
                colorScheme="whiteAlpha"
                variant="ghost"
                color="white"
                _hover={{ bg: 'whiteAlpha.200' }}
                _active={{ bg: 'whiteAlpha.300' }}
                isLoading={isRefreshing}
                onClick={onRefresh}
                borderRadius="xl"
                h="56px"
                w="56px"
              />
            </Tooltip>

            {/* Notifications */}
            <Tooltip label="Notifications" placement="bottom">
              <IconButton
                aria-label="Notifications"
                icon={<FaBell />}
                size="lg"
                colorScheme="whiteAlpha"
                variant="ghost"
                color="white"
                _hover={{ bg: 'whiteAlpha.200' }}
                _active={{ bg: 'whiteAlpha.300' }}
                borderRadius="xl"
                h="56px"
                w="56px"
                position="relative"
              />
            </Tooltip>

            {/* Dark Mode Toggle */}
            <Tooltip label={colorMode === 'dark' ? 'Light Mode' : 'Dark Mode'} placement="bottom">
              <IconButton
                aria-label="Toggle Dark Mode"
                icon={colorMode === 'dark' ? <FaSun /> : <FaMoon />}
                size="lg"
                colorScheme="whiteAlpha"
                variant="ghost"
                color={colorMode === 'dark' ? 'yellow.300' : 'blue.300'}
                _hover={{ bg: 'whiteAlpha.200', transform: 'rotate(20deg)' }}
                _active={{ bg: 'whiteAlpha.300', transform: 'rotate(0deg)' }}
                borderRadius="xl"
                h="56px"
                w="56px"
                onClick={toggleColorMode}
                transition="all 0.3s ease-in-out"
              />
            </Tooltip>

            {/* Settings Button - Desktop Only */}
            <Hide below="md">
              <Tooltip label="Settings" placement="bottom">
                <IconButton
                  aria-label="Settings"
                  icon={<FaCog />}
                  size="lg"
                  colorScheme="whiteAlpha"
                  variant="ghost"
                  color="white"
                  _hover={{ bg: 'whiteAlpha.200' }}
                  _active={{ bg: 'whiteAlpha.300' }}
                  borderRadius="xl"
                  h="56px"
                  w="56px"
                  onClick={onSettings}
                />
              </Tooltip>
            </Hide>

            {/* Sign Out Button - Desktop Only */}
            <Hide below="md">
              <Tooltip label="Sign Out" placement="bottom">
                <IconButton
                  aria-label="Sign Out"
                  icon={<FaSignOutAlt />}
                  size="lg"
                  colorScheme="red"
                  variant="ghost"
                  color="red.300"
                  _hover={{ bg: 'red.900', color: 'red.200' }}
                  _active={{ bg: 'red.800', color: 'red.100' }}
                  borderRadius="xl"
                  h="56px"
                  w="56px"
                  onClick={onLogout}
                />
              </Tooltip>
            </Hide>

            {/* Main Menu - Mobile & Access to all options */}
            <Tooltip label="Main Menu" placement="bottom">
              <IconButton
                aria-label="Main Menu"
                icon={<FaBars />}
                size="lg"
                colorScheme="whiteAlpha"
                variant="solid"
                bg="whiteAlpha.200"
                color="white"
                _hover={{ bg: 'whiteAlpha.300' }}
                _active={{ bg: 'whiteAlpha.400' }}
                borderRadius="xl"
                h="60px"
                w="60px"
                onClick={onDrawerOpen}
              />
            </Tooltip>
          </HStack>
        </Flex>

        {/* Mobile Driver Info */}
        <Show below="lg">
          <Box mt={4} pt={3} borderTop="1px solid" borderColor="whiteAlpha.300">
            <HStack spacing={3} justify="space-between">
              <HStack spacing={3}>
                <Avatar
                  size="md"
                  name={driver.name}
                  bg="white"
                  color="blue.800"
                />
                <VStack align="start" spacing={0}>
                  <Text fontSize="md" fontWeight="bold" color="white">
                    {driver.name}
                  </Text>
                  <HStack spacing={2}>
                    <Badge
                      colorScheme={getStatusColor(driver.status)}
                      variant="solid"
                      fontSize="sm"
                      px={3}
                      py={1}
                    >
                      {driver.status}
                    </Badge>
                  </HStack>
                </VStack>
              </HStack>
              
              {driver.location && (
                <HStack spacing={2} color="blue.100">
                  <Icon as={FaMapMarkerAlt} boxSize="14px" />
                  <Text fontSize="sm" noOfLines={1} maxW="120px">
                    {driver.location}
                  </Text>
                </HStack>
              )}
            </HStack>
          </Box>
        </Show>
      </Container>

      {/* Drawer Menu */}
      <DriverDrawerMenu
        isOpen={isDrawerOpen}
        onClose={onDrawerClose}
        driver={driver}
        onSettings={onSettings}
        onLogout={onLogout}
      />
    </Box>
  );
}