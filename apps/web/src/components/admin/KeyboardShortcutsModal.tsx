'use client';

import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Badge,
  Box,
  Divider,
  useColorModeValue,
  SimpleGrid,
  Kbd,
} from '@chakra-ui/react';
import { KeyboardShortcut } from '@/lib/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
}

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
  shortcuts,
}: KeyboardShortcutsModalProps) {
  const bgColor = useColorModeValue('#0B1020', '#0B1020');
  const cardBg = useColorModeValue('#121A2B', '#121A2B');
  const textColor = useColorModeValue('#F5F8FF', '#F5F8FF');
  const borderColor = useColorModeValue('#2A3A5E', '#2A3A5E');
  const secondaryTextColor = useColorModeValue('#9ca3af', '#9ca3af');

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  const formatKey = (shortcut: KeyboardShortcut) => {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.meta) parts.push('Meta');
    
    // Format the main key
    let key = shortcut.key;
    if (key === 'Escape') key = 'Esc';
    if (key === ' ') key = 'Space';
    
    parts.push(key);
    return parts;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay bg="rgba(0, 0, 0, 0.8)" />
      <ModalContent bg={bgColor} borderColor={borderColor} borderWidth={1}>
        <ModalHeader color={textColor}>
          <HStack spacing={2}>
            <Text>Keyboard Shortcuts</Text>
            <Badge colorScheme="blue" size="sm">
              {shortcuts.length} shortcuts
            </Badge>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color={textColor} />
        <ModalBody pb={6}>
          <VStack align="stretch" spacing={4}>
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
              <Box key={category}>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color={secondaryTextColor}
                  mb={2}
                  textTransform="uppercase"
                  letterSpacing="wide"
                >
                  {category}
                </Text>
                <Divider borderColor={borderColor} mb={3} />
                <SimpleGrid columns={1} spacing={2}>
                  {categoryShortcuts.map((shortcut, index) => (
                    <HStack
                      key={index}
                      justify="space-between"
                      p={2}
                      bg={cardBg}
                      borderRadius="md"
                      borderWidth={1}
                      borderColor={borderColor}
                    >
                      <Text fontSize="sm" color={textColor} flex={1}>
                        {shortcut.description}
                      </Text>
                      <HStack spacing={1}>
                        {formatKey(shortcut).map((key, keyIndex) => (
                          <React.Fragment key={keyIndex}>
                            <Kbd
                              bg="#18233A"
                              color={textColor}
                              borderColor={borderColor}
                              fontSize="xs"
                              px={2}
                              py={1}
                            >
                              {key}
                            </Kbd>
                            {keyIndex < formatKey(shortcut).length - 1 && (
                              <Text color={secondaryTextColor} fontSize="xs">+</Text>
                            )}
                          </React.Fragment>
                        ))}
                      </HStack>
                    </HStack>
                  ))}
                </SimpleGrid>
              </Box>
            ))}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

