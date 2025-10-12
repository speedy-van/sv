'use client';

import React from 'react';
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Avatar,
  Badge,
  Divider,
  Box,
  useColorModeValue,
  useColorMode,
  Circle,
  Flex,
  Switch,
} from '@chakra-ui/react';
import {
  FaHome,
  FaClipboardList,
  FaChartBar,
  FaCog,
  FaSignOutAlt,
  FaTruck,
  FaHeadset,
  FaQuestionCircle,
  FaMapMarkerAlt,
  FaStar,
  FaPhone,
  FaHistory,
  FaBell,
  FaUserCircle,
  FaFileAlt,
  FaMoon,
  FaSun,
} from 'react-icons/fa';

interface Driver {
  id: string;
  name: string;
  status: string;
  location?: string;
  vehicle?: string;
  rating?: number;
}

interface DriverDrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  driver: Driver;
  onSettings: () => void;
  onLogout: () => void;
}

export function DriverDrawerMenu({
  isOpen,
  onClose,
  driver,
  onSettings,
  onLogout,
}: DriverDrawerMenuProps) {
  const { colorMode, toggleColorMode } = useColorMode();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const brandColor = useColorModeValue('blue.600', 'blue.400');
  const accentColor = useColorModeValue('yellow.300', 'yellow.200');

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'green';
      case 'busy': return 'orange';
      case 'offline': return 'red';
      default: return 'gray';
    }
  };

  const menuItems = [
    {
      icon: FaHome,
      label: 'Dashboard',
      href: '/driver',
      color: 'blue.600',
      description: 'Overview & Stats',
    },
    {
      icon: FaClipboardList,
      label: 'My Jobs',
      href: '/driver/jobs',
      color: 'blue.600',
      description: 'Current & Available',
    },
    {
      icon: FaChartBar,
      label: 'Earnings',
      href: '/driver/earnings',
      color: 'green.600',
      description: 'Income & Reports',
    },
    {
      icon: FaHistory,
      label: 'Job History',
      href: '/driver/history',
      color: 'gray.600',
      description: 'Past Deliveries',
    },
    {
      icon: FaBell,
      label: 'Notifications',
      href: '/driver/notifications',
      color: 'orange.600',
      description: 'Alerts & Updates',
    },
    {
      icon: FaUserCircle,
      label: 'Profile',
      href: '/driver/profile',
      color: 'purple.600',
      description: 'Personal Info',
    },
    {
      icon: FaCog,
      label: 'Settings',
      action: onSettings,
      color: 'gray.600',
      description: 'App Preferences',
    },
    {
      icon: FaHeadset,
      label: 'Support',
      href: '/driver/support',
      color: 'purple.600',
      description: '24/7 Help Available',
    },
    {
      icon: FaFileAlt,
      label: 'Documents',
      href: '/driver/documents',
      color: 'blue.600',
      description: 'Licenses & Papers',
    },
    {
      icon: FaQuestionCircle,
      label: 'Help & FAQ',
      href: '/driver/help',
      color: 'blue.600',
      description: 'Common Questions',
    },
  ];

  return (
    <Drawer
      isOpen={isOpen}
      placement="right"
      onClose={onClose}
      size="sm"
    >
      <DrawerOverlay bg="blackAlpha.600" />
      <DrawerContent
        bg={bgColor}
        borderLeft="1px solid"
        borderColor={borderColor}
        maxW="320px"
      >
        <DrawerCloseButton
          size="lg"
          color={textColor}
          _hover={{ bg: 'gray.100' }}
          top={4}
          right={4}
        />

        {/* Simplified Header */}
        <DrawerHeader
          bg="gray.50"
          borderBottom="1px solid"
          borderColor="gray.200"
          py={4}
          pt={16}
        >
          <VStack spacing={3} align="start">
            <Text fontSize="lg" fontWeight="bold" color="gray.700">
              Driver Menu
            </Text>
            <Text fontSize="sm" color="gray.600">
              Quick access to your tools
            </Text>
          </VStack>
        </DrawerHeader>

        <DrawerBody px={0} py={4}>
          <VStack spacing={2} align="stretch">
            {/* Driver Profile Section */}
            <Box px={6} py={4} bg="gray.50" mx={4} borderRadius="xl">
              <HStack spacing={4}>
                <Avatar
                  size="lg"
                  name={driver.name}
                  bg="blue.600"
                  color="white"
                />
                <VStack align="start" spacing={2} flex="1">
                  <Text fontSize="lg" fontWeight="bold" color={textColor}>
                    {driver.name}
                  </Text>
                  <HStack spacing={3}>
                    <Badge
                      colorScheme={getStatusColor(driver.status)}
                      variant="solid"
                      fontSize="sm"
                      px={3}
                      py={1}
                      borderRadius="full"
                    >
                      {driver.status.toUpperCase()}
                    </Badge>
                    {driver.rating && (
                      <HStack spacing={1}>
                        <Icon as={FaStar} color="yellow.500" boxSize="14px" />
                        <Text fontSize="sm" color="gray.600" fontWeight="medium">
                          {driver.rating}
                        </Text>
                      </HStack>
                    )}
                  </HStack>
                  {driver.location && (
                    <HStack spacing={2}>
                      <Icon as={FaMapMarkerAlt} color="gray.500" boxSize="14px" />
                      <Text fontSize="sm" color="gray.600">
                        {driver.location}
                      </Text>
                    </HStack>
                  )}
                </VStack>
              </HStack>
            </Box>

            <Divider my={2} />

            {/* Menu Items */}
            <VStack spacing={1} align="stretch" px={4}>
              {menuItems.map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  justifyContent="flex-start"
                  size="lg"
                  h="70px"
                  px={6}
                  borderRadius="xl"
                  color={textColor}
                  _hover={{
                    bg: 'blue.50',
                    color: brandColor,
                    transform: 'translateX(4px)',
                  }}
                  _active={{
                    bg: 'blue.100',
                    transform: 'translateX(2px)',
                  }}
                  transition="all 0.2s ease-in-out"
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    } else if (item.href) {
                      window.location.href = item.href;
                    }
                    onClose();
                  }}
                >
                  <HStack spacing={4} w="100%">
                    <Circle
                      size="44px"
                      bg={`${item.color.split('.')[0]}.100`}
                      color={item.color}
                    >
                      <Icon as={item.icon} boxSize="22px" />
                    </Circle>
                    <VStack align="start" spacing={0} flex="1">
                      <Text fontSize="md" fontWeight="semibold" color={textColor}>
                        {item.label}
                      </Text>
                      {item.description && (
                        <Text fontSize="xs" color="gray.500" fontWeight="medium">
                          {item.description}
                        </Text>
                      )}
                    </VStack>
                  </HStack>
                </Button>
              ))}
            </VStack>

            <Divider my={4} />

            {/* Dark Mode Toggle */}
            <Box px={6} py={2}>
              <HStack 
                justify="space-between" 
                p={4} 
                bg={useColorModeValue('gray.50', 'gray.700')}
                borderRadius="xl"
                transition="all 0.2s"
              >
                <HStack spacing={3}>
                  <Circle
                    size="44px"
                    bg={colorMode === 'dark' ? 'yellow.100' : 'blue.100'}
                    color={colorMode === 'dark' ? 'yellow.600' : 'blue.600'}
                  >
                    <Icon as={colorMode === 'dark' ? FaSun : FaMoon} boxSize="22px" />
                  </Circle>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="md" fontWeight="semibold" color={textColor}>
                      {colorMode === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </Text>
                    <Text fontSize="xs" color="gray.500" fontWeight="medium">
                      Toggle theme
                    </Text>
                  </VStack>
                </HStack>
                <Switch
                  size="lg"
                  colorScheme="blue"
                  isChecked={colorMode === 'dark'}
                  onChange={toggleColorMode}
                />
              </HStack>
            </Box>

            <Divider my={2} />

            {/* Emergency Contact */}
            <Box px={6}>
              <VStack spacing={3}>
                <Text fontSize="sm" color="gray.500" fontWeight="medium">
                  Emergency Support
                </Text>
                <Button
                  variant="outline"
                  colorScheme="red"
                  size="md"
                  w="100%"
                  leftIcon={<FaPhone />}
                  borderRadius="xl"
                  h="50px"
                >
                  Emergency: 999
                </Button>
              </VStack>
            </Box>
          </VStack>
        </DrawerBody>

        {/* Footer */}
        <DrawerFooter borderTop="1px solid" borderColor={borderColor} px={6} py={4}>
          <Button
            colorScheme="red"
            variant="ghost"
            size="lg"
            w="100%"
            h="56px"
            leftIcon={<FaSignOutAlt />}
            onClick={() => {
              onLogout();
              onClose();
            }}
            borderRadius="xl"
            _hover={{
              bg: 'red.50',
              color: 'red.600',
            }}
          >
            Sign Out
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}