"use client";

/**
 * Cookie consent banner component
 */

import {
  Box,
  Button,
  Flex,
  Text,
  VStack,
  HStack,
  useDisclosure,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useConsent } from './ConsentProvider';
import CookiePreferencesModal from './CookiePreferencesModal';

export default function CookieBanner() {
  const { hasConsent, setHasConsent, preferences, updatePreferences } = useConsent();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  const handleAcceptAll = async () => {
    setIsLoading(true);
    updatePreferences({
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    });
    setHasConsent(true);
    setIsLoading(false);
  };

  const handleRejectAll = async () => {
    setIsLoading(true);
    updatePreferences({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    });
    setHasConsent(true);
    setIsLoading(false);
  };

  if (hasConsent) {
    return null;
  }

  return (
    <>
      <Box
        position="fixed"
        bottom="0"
        left="0"
        right="0"
        bg="rgba(15, 17, 20, 0.98)"
        borderTop="1px"
        borderColor="rgba(59, 130, 246, 0.3)"
        p={4}
        zIndex={1000}
        boxShadow="lg"
        backdropFilter="blur(10px)"
        suppressHydrationWarning
      >
        <VStack spacing={4} maxW="4xl" mx="auto" suppressHydrationWarning>
          <Text fontSize="sm" color="white" textAlign="center" suppressHydrationWarning>
            We use cookies to enhance your experience, analyze site traffic, and personalize content. 
            By continuing to use our site, you consent to our use of cookies.
          </Text>
          
          <Flex
            direction="row"
            gap={{ base: 2, md: 4 }}
            w="full"
            align="center"
            justify={{ base: 'space-between', md: 'center' }}
            wrap="wrap"
            suppressHydrationWarning
          >
            <Button
              size="sm"
              variant="outline"
              onClick={onOpen}
              isLoading={isLoading}
              order={{ base: 1, md: 1 }}
              suppressHydrationWarning
            >
              Manage Preferences
            </Button>
            <Flex
              gap={2}
              order={{ base: 2, md: 2 }}
              ml={{ base: 0, md: 'auto' }}
              suppressHydrationWarning
            >
              <Button
                size="sm"
                variant="outline"
                onClick={handleRejectAll}
                isLoading={isLoading}
                suppressHydrationWarning
              >
                Reject All
              </Button>
              <Button
                size="sm"
                colorScheme="primary"
                onClick={handleAcceptAll}
                isLoading={isLoading}
                suppressHydrationWarning
              >
                Accept All
              </Button>
            </Flex>
          </Flex>
        </VStack>
      </Box>

      <CookiePreferencesModal isOpen={isOpen} onClose={onClose} />
    </>
  );
}