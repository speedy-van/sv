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
import { useState } from 'react';
import { useConsent } from './ConsentProvider';
import CookiePreferencesModal from './CookiePreferencesModal';

export default function CookieBanner() {
  const { hasConsent, setHasConsent, preferences, updatePreferences } = useConsent();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);

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
        bg="white"
        borderTop="1px"
        borderColor="gray.200"
        p={4}
        zIndex={1000}
        boxShadow="lg"
      >
        <VStack spacing={4} maxW="4xl" mx="auto">
          <Text fontSize="sm" color="gray.600" textAlign="center">
            We use cookies to enhance your experience, analyze site traffic, and personalize content. 
            By continuing to use our site, you consent to our use of cookies.
          </Text>
          
          <HStack spacing={4}>
            <Button
              size="sm"
              variant="outline"
              onClick={onOpen}
              isLoading={isLoading}
            >
              Manage Preferences
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRejectAll}
              isLoading={isLoading}
            >
              Reject All
            </Button>
            <Button
              size="sm"
              colorScheme="primary"
              onClick={handleAcceptAll}
              isLoading={isLoading}
            >
              Accept All
            </Button>
          </HStack>
        </VStack>
      </Box>

      <CookiePreferencesModal isOpen={isOpen} onClose={onClose} />
    </>
  );
}