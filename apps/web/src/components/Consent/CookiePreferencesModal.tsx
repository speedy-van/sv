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
      <ModalOverlay bg="rgba(0, 0, 0, 0.7)" backdropFilter="blur(10px)" />
      <ModalContent bg="rgba(15, 17, 20, 0.98)" border="1px solid" borderColor="rgba(59, 130, 246, 0.3)">
        <ModalHeader color="white">Cookie Preferences</ModalHeader>
        <ModalCloseButton color="white" _hover={{ bg: 'rgba(59, 130, 246, 0.2)' }} />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            <Text fontSize="sm" color="gray.300">
              Choose which cookies you want to accept. You can change these settings at any time.
            </Text>

            <FormControl>
              <HStack justify="space-between">
                <Box>
                  <FormLabel mb={0} color="white">Necessary Cookies</FormLabel>
                  <FormHelperText fontSize="xs" color="gray.400">
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
                  <FormLabel mb={0} color="white">Analytics Cookies</FormLabel>
                  <FormHelperText fontSize="xs" color="gray.400">
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
                  <FormLabel mb={0} color="white">Marketing Cookies</FormLabel>
                  <FormHelperText fontSize="xs" color="gray.400">
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
                  <FormLabel mb={0} color="white">Preference Cookies</FormLabel>
                  <FormHelperText fontSize="xs" color="gray.400">
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