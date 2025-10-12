'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  useBreakpointValue,
  useColorModeValue,
  Flex,
  Progress,
  Text,
  Badge,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Button,
  Collapse,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { FaArrowLeft, FaBars, FaShieldAlt, FaTruck, FaWifi, FaExclamationTriangle } from 'react-icons/fa';

interface ResponsiveBookingLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
  stepDescription?: string;
  onBack?: () => void;
  showProgress?: boolean;
  showSecurity?: boolean;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
}

interface NetworkStatus {
  isOnline: boolean;
  connectionType?: string;
  effectiveType?: string;
}

export const ResponsiveBookingLayout: React.FC<ResponsiveBookingLayoutProps> = ({
  children,
  currentStep,
  totalSteps,
  stepTitle,
  stepDescription,
  onBack,
  showProgress = true,
  showSecurity = true,
  isLoading = false,
  error,
  onRetry,
}) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({ isOnline: true });
  const [isScrolled, setIsScrolled] = useState(false);
  const [viewportHeight, setViewportHeight] = useState('100vh');
  
  const { isOpen: isMenuOpen, onOpen: onMenuOpen, onClose: onMenuClose } = useDisclosure();
  
  // Responsive values
  const isMobile = useBreakpointValue({ base: true, md: false });
  const containerPadding = useBreakpointValue({ base: 4, md: 6, lg: 8 });
  const headerHeight = useBreakpointValue({ base: '60px', md: '80px' });
  const progressHeight = useBreakpointValue({ base: '4px', md: '6px' });
  
  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const headerBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const shadowColor = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.3)');

  // Network status monitoring
  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      setNetworkStatus({
        isOnline: navigator.onLine,
        connectionType: connection?.type,
        effectiveType: connection?.effectiveType,
      });
    };

    updateNetworkStatus();
    
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    
    if ((navigator as any).connection) {
      (navigator as any).connection.addEventListener('change', updateNetworkStatus);
    }

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      if ((navigator as any).connection) {
        (navigator as any).connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Viewport height fix for mobile browsers
  useEffect(() => {
    const updateViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      setViewportHeight(`${window.innerHeight}px`);
    };

    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <Box
      minH={viewportHeight}
      bg={bgColor}
      position="relative"
      className="safe-area-top safe-area-bottom"
    >
      {/* Fixed Header */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex={1000}
        bg={headerBg}
        borderBottom="1px solid"
        borderColor={borderColor}
        boxShadow={isScrolled ? `0 2px 8px ${shadowColor}` : 'none'}
        transition="all 0.2s ease"
        className="safe-area-left safe-area-right"
      >
        {/* Progress Bar */}
        {showProgress && (
          <Progress
            value={progressPercentage}
            size="sm"
            colorScheme="blue"
            bg="gray.100"
            height={progressHeight}
            transition="all 0.3s ease"
          />
        )}

        {/* Header Content */}
        <Container maxW="container.xl" px={containerPadding}>
          <HStack
            h={headerHeight}
            justify="space-between"
            align="center"
            spacing={4}
          >
            {/* Left Section */}
            <HStack spacing={3}>
              {onBack && (
                <IconButton
                  aria-label="Go back"
                  icon={<FaArrowLeft />}
                  variant="ghost"
                  size={isMobile ? "sm" : "md"}
                  onClick={onBack}
                  isDisabled={isLoading}
                />
              )}
              
              <VStack align="start" spacing={0}>
                <HStack spacing={2}>
                  <Text
                    fontSize={isMobile ? "md" : "lg"}
                    fontWeight="bold"
                    color="gray.700"
                    noOfLines={1}
                  >
                    {stepTitle}
                  </Text>
                  {showProgress && (
                    <Badge
                      colorScheme="blue"
                      variant="solid"
                      fontSize="xs"
                      borderRadius="full"
                    >
                      {currentStep}/{totalSteps}
                    </Badge>
                  )}
                </HStack>
                {stepDescription && !isMobile && (
                  <Text fontSize="sm" color="gray.500" noOfLines={1}>
                    {stepDescription}
                  </Text>
                )}
              </VStack>
            </HStack>

            {/* Right Section */}
            <HStack spacing={2}>
              {/* Network Status Indicator */}
              <Box>
                {networkStatus.isOnline ? (
                  <HStack spacing={1}>
                    <FaWifi color="green" size={12} />
                    {!isMobile && networkStatus.effectiveType && (
                      <Text fontSize="xs" color="gray.500">
                        {networkStatus.effectiveType.toUpperCase()}
                      </Text>
                    )}
                  </HStack>
                ) : (
                  <HStack spacing={1}>
                    <FaExclamationTriangle color="red" size={12} />
                    {!isMobile && (
                      <Text fontSize="xs" color="red.500">
                        Offline
                      </Text>
                    )}
                  </HStack>
                )}
              </Box>

              {/* Security Badge */}
              {showSecurity && !isMobile && (
                <HStack spacing={1}>
                  <FaShieldAlt color="green" size={12} />
                  <Text fontSize="xs" color="gray.500">
                    Secure
                  </Text>
                </HStack>
              )}

              {/* Mobile Menu */}
              {isMobile && (
                <IconButton
                  aria-label="Open menu"
                  icon={<FaBars />}
                  variant="ghost"
                  size="sm"
                  onClick={onMenuOpen}
                />
              )}
            </HStack>
          </HStack>
        </Container>
      </Box>

      {/* Offline Alert */}
      <Collapse in={!networkStatus.isOnline}>
        <Alert status="warning" variant="solid">
          <AlertIcon />
          <Box>
            <AlertTitle fontSize="sm">You're offline</AlertTitle>
            <AlertDescription fontSize="xs">
              Some features may not work properly. Check your connection.
            </AlertDescription>
          </Box>
        </Alert>
      </Collapse>

      {/* Error Alert */}
      <Collapse in={!!error}>
        <Alert status="error" variant="left-accent">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle fontSize="sm">Something went wrong</AlertTitle>
            <AlertDescription fontSize="xs" mb={2}>
              {error}
            </AlertDescription>
            {onRetry && (
              <Button size="xs" colorScheme="red" variant="outline" onClick={onRetry}>
                Try Again
              </Button>
            )}
          </Box>
        </Alert>
      </Collapse>

      {/* Main Content */}
      <Box
        pt={`calc(${headerHeight} + ${showProgress ? progressHeight : '0px'} + 16px)`}
        pb={8}
        className="safe-area-left safe-area-right"
      >
        <Container
          maxW="container.xl"
          px={containerPadding}
          position="relative"
        >
          {/* Loading Overlay */}
          {isLoading && (
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              bg="rgba(255, 255, 255, 0.8)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              zIndex={999}
              borderRadius="lg"
            >
              <VStack spacing={3}>
                <Progress size="sm" isIndeterminate colorScheme="blue" w="200px" />
                <Text fontSize="sm" color="gray.600">
                  Loading...
                </Text>
              </VStack>
            </Box>
          )}

          {/* Content */}
          <Box opacity={isLoading ? 0.5 : 1} transition="opacity 0.2s ease">
            {children}
          </Box>
        </Container>
      </Box>

      {/* Mobile Menu Drawer */}
      <Drawer isOpen={isMenuOpen} placement="right" onClose={onMenuClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            <HStack spacing={2}>
              <FaTruck color="blue" />
              <Text>Speedy Van</Text>
            </HStack>
          </DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="stretch" pt={4}>
              {/* Step Progress */}
              <Box>
                <Text fontSize="sm" fontWeight="semibold" mb={2}>
                  Booking Progress
                </Text>
                <Progress
                  value={progressPercentage}
                  colorScheme="blue"
                  size="lg"
                  borderRadius="full"
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Step {currentStep} of {totalSteps}
                </Text>
              </Box>

              {/* Security Info */}
              <Box>
                <HStack spacing={2} mb={2}>
                  <FaShieldAlt color="green" />
                  <Text fontSize="sm" fontWeight="semibold">
                    Secure Booking
                  </Text>
                </HStack>
                <Text fontSize="xs" color="gray.600">
                  Your data is encrypted and secure. We never store payment details.
                </Text>
              </Box>

              {/* Network Status */}
              <Box>
                <HStack spacing={2} mb={2}>
                  {networkStatus.isOnline ? (
                    <FaWifi color="green" />
                  ) : (
                    <FaExclamationTriangle color="red" />
                  )}
                  <Text fontSize="sm" fontWeight="semibold">
                    Connection Status
                  </Text>
                </HStack>
                <Text fontSize="xs" color="gray.600">
                  {networkStatus.isOnline ? (
                    <>
                      Connected
                      {networkStatus.effectiveType && ` (${networkStatus.effectiveType.toUpperCase()})`}
                    </>
                  ) : (
                    'Offline - Some features may not work'
                  )}
                </Text>
              </Box>

              {/* Help Section */}
              <Box>
                <Text fontSize="sm" fontWeight="semibold" mb={2}>
                  Need Help?
                </Text>
                <VStack spacing={2} align="stretch">
                  <Button size="sm" variant="outline" colorScheme="blue">
                    Live Chat
                  </Button>
                  <Button size="sm" variant="outline" colorScheme="blue">
                    Call Support
                  </Button>
                  <Button size="sm" variant="outline" colorScheme="blue">
                    FAQ
                  </Button>
                </VStack>
              </Box>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default ResponsiveBookingLayout;
