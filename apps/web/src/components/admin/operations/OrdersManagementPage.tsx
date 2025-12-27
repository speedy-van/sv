'use client';

import React, { useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Icon,
  Badge,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { FaTrash } from 'react-icons/fa';
import { OrdersTable } from '@/components/admin/orders/OrdersTable';
import { NotificationsCenter } from '../NotificationsCenter';
import { KeyboardShortcutsModal } from '../KeyboardShortcutsModal';
import { useKeyboardShortcuts, AdminShortcuts } from '@/lib/hooks/useKeyboardShortcuts';

// Pulsing animation for declined notifications
const pulseAnimation = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
`;

interface OrdersManagementPageProps {
  declinedNotifications?: string[];
  acceptedNotifications?: string[];
  inProgressNotifications?: string[];
}

/**
 * Orders Management Page
 * 
 * Focused, single-purpose page for managing orders only.
 * No navigation modules, no tabs, no confusion.
 * 
 * Architecture:
 * - Clean header with page title and essential actions only
 * - Single search system (handled by OrdersTable)
 * - Clear separation: Header → Filters → Table → Actions
 */
export default function OrdersManagementPage({
  declinedNotifications = [],
  acceptedNotifications = [],
  inProgressNotifications = [],
}: OrdersManagementPageProps) {
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isShortcutsOpen, onOpen: onShortcutsOpen, onClose: onShortcutsClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const toast = useToast();

  // Setup Keyboard Shortcuts
  const shortcuts = [
    AdminShortcuts.help(onShortcutsOpen),
  ];

  useKeyboardShortcuts(shortcuts, { enabled: true });

  const handleCleanup = async () => {
    try {
      setIsCleaningUp(true);
      const response = await fetch('/api/admin/cleanup', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Cleanup Successful',
          description: `Deleted ${data.deleted.bookings} bookings, ${data.deleted.routes} routes, and related data`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        // Refresh the page to update counts
        window.location.reload();
      } else {
        throw new Error(data.error || 'Cleanup failed');
      }
    } catch (error: any) {
      toast({
        title: 'Cleanup Failed',
        description: error.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCleaningUp(false);
      onClose();
    }
  };

  return (
    <Box>
      {/* Page Header - Clean and Focused */}
      <VStack align="stretch" spacing={4} mb={6}>
        <HStack justify="space-between" align="flex-start">
          <VStack align="start" spacing={2}>
            <Heading size="lg" color="white">
              Orders Management
            </Heading>
            <Text color="gray.400" fontSize="sm">
              Manage all customer orders with full control over assignments, status, and payments
            </Text>
          </VStack>
        
          <HStack spacing={3}>
            {/* Declined Notifications Badge */}
            {declinedNotifications.length > 0 && (
              <Button
                leftIcon={<Badge colorScheme="red" fontSize="xs" borderRadius="full">{declinedNotifications.length}</Badge>}
                colorScheme="red"
                variant="solid"
                size="sm"
                animation={`${pulseAnimation} 2s ease-in-out infinite`}
                onClick={() => {
                  toast({
                    title: 'Notifications Cleared',
                    description: `Cleared ${declinedNotifications.length} declined notification(s)`,
                    status: 'info',
                    duration: 3000,
                  });
                }}
              >
                🚨 {declinedNotifications.length} Declined
              </Button>
            )}
            
            {/* Cleanup Button - Moved to Settings or removed from main view */}
            <Button
              leftIcon={<Icon as={FaTrash} />}
              colorScheme="red"
              variant="outline"
              size="sm"
              onClick={onOpen}
              _hover={{ bg: 'red.900', borderColor: 'red.500' }}
            >
              Cleanup All
            </Button>

            {/* Notifications Center */}
            <NotificationsCenter />

            {/* Keyboard Shortcuts Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onShortcutsOpen}
              title="Keyboard Shortcuts (Shift+?)"
              _hover={{ bg: 'gray.700' }}
            >
              ⌨️ Shortcuts
            </Button>
          </HStack>
        </HStack>
      </VStack>

      {/* Cleanup Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg="gray.800" borderColor="red.500" borderWidth="2px">
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="white">
              ⚠️ Delete All Orders & Routes?
            </AlertDialogHeader>

            <AlertDialogBody color="gray.300">
              This will <Text as="span" color="red.400" fontWeight="bold">permanently delete</Text>:
              <Box mt={3} pl={4}>
                <Text>• All bookings/orders</Text>
                <Text>• All routes</Text>
                <Text>• All assignments</Text>
                <Text>• All tracking data</Text>
                <Text>• All related records</Text>
              </Box>
              <Text mt={4} color="red.400" fontWeight="bold">
                This action cannot be undone!
              </Text>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} variant="ghost">
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleCleanup}
                ml={3}
                isLoading={isCleaningUp}
                loadingText="Deleting..."
              >
                Yes, Delete Everything
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Orders Table - Single source of truth for search, filters, and actions */}
      <Box>
        <OrdersTable 
          embedded={false}
          declinedNotifications={declinedNotifications}
          acceptedNotifications={acceptedNotifications}
          inProgressNotifications={inProgressNotifications}
        />
      </Box>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={onShortcutsClose}
        shortcuts={shortcuts}
      />
    </Box>
  );
}

