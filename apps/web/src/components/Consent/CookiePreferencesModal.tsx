"use client";

/**
 * Cookie preferences modal component
 */

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Switch,
  FormControl,
  FormLabel,
  FormHelperText,
  Box,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useConsent } from './ConsentProvider';

interface CookiePreferencesModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function CookiePreferencesModal({
  isOpen = false,
  onClose = () => {},
}: CookiePreferencesModalProps) {
  const { preferences, updatePreferences, setHasConsent } = useConsent();
  const [tempPreferences, setTempPreferences] = useState(preferences);

  const handleSave = () => {
    updatePreferences(tempPreferences);
    setHasConsent(true);
    onClose();
  };

  const handlePreferenceChange = (key: keyof typeof tempPreferences) => {
    setTempPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Cookie Preferences</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            <Text fontSize="sm" color="gray.600">
              Choose which cookies you want to accept. You can change these settings at any time.
            </Text>

            <FormControl>
              <HStack justify="space-between">
                <Box>
                  <FormLabel mb={0}>Necessary Cookies</FormLabel>
                  <FormHelperText fontSize="xs">
                    Required for the website to function properly
                  </FormHelperText>
                </Box>
                <Switch
                  isChecked={tempPreferences.necessary}
                  isDisabled
                  colorScheme="primary"
                />
              </HStack>
            </FormControl>

            <FormControl>
              <HStack justify="space-between">
                <Box>
                  <FormLabel mb={0}>Analytics Cookies</FormLabel>
                  <FormHelperText fontSize="xs">
                    Help us understand how visitors interact with our website
                  </FormHelperText>
                </Box>
                <Switch
                  isChecked={tempPreferences.analytics}
                  onChange={() => handlePreferenceChange('analytics')}
                  colorScheme="primary"
                />
              </HStack>
            </FormControl>

            <FormControl>
              <HStack justify="space-between">
                <Box>
                  <FormLabel mb={0}>Marketing Cookies</FormLabel>
                  <FormHelperText fontSize="xs">
                    Used to track visitors across websites for advertising
                  </FormHelperText>
                </Box>
                <Switch
                  isChecked={tempPreferences.marketing}
                  onChange={() => handlePreferenceChange('marketing')}
                  colorScheme="primary"
                />
              </HStack>
            </FormControl>

            <FormControl>
              <HStack justify="space-between">
                <Box>
                  <FormLabel mb={0}>Preference Cookies</FormLabel>
                  <FormHelperText fontSize="xs">
                    Remember your settings and preferences
                  </FormHelperText>
                </Box>
                <Switch
                  isChecked={tempPreferences.preferences}
                  onChange={() => handlePreferenceChange('preferences')}
                  colorScheme="primary"
                />
              </HStack>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="primary" onClick={handleSave}>
              Save Preferences
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}