'use client';

import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Button,
  Select,
  Input,
  FormControl,
  FormLabel,
  useToast,
  useColorModeValue,
  Badge,
  Divider,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { FiEdit, FiSave } from 'react-icons/fi';

interface BatchEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOrders: string[];
  onSave: (updates: BatchEditUpdates) => Promise<void>;
}

export interface BatchEditUpdates {
  status?: string;
  priority?: string;
  driverId?: string;
  scheduledAt?: string;
  notes?: string;
  priceAdjustment?: {
    type: 'fixed' | 'percentage';
    value: number;
  };
}

export function BatchEditModal({
  isOpen,
  onClose,
  selectedOrders,
  onSave,
}: BatchEditModalProps) {
  const [updates, setUpdates] = useState<BatchEditUpdates>({});
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const bgColor = useColorModeValue('#000000', '#000000');
  const cardBg = useColorModeValue('#111111', '#111111');
  const textColor = useColorModeValue('#FFFFFF', '#FFFFFF');
  const borderColor = useColorModeValue('#333333', '#333333');
  const secondaryTextColor = useColorModeValue('#9ca3af', '#9ca3af');

  const handleSave = async () => {
    if (Object.keys(updates).length === 0) {
      toast({
        title: 'No changes',
        description: 'Please select at least one field to update',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSaving(true);
    try {
      await onSave(updates);
      toast({
        title: 'Success',
        description: `Updated ${selectedOrders.length} order(s) successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setUpdates({});
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update orders',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay bg="rgba(0, 0, 0, 0.8)" />
      <ModalContent bg={bgColor} borderColor={borderColor} borderWidth={1}>
        <ModalHeader color={textColor}>
          <HStack spacing={2}>
            <FiEdit />
            <Text>Batch Edit Orders</Text>
            <Badge colorScheme="blue" size="lg">
              {selectedOrders.length} selected
            </Badge>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color={textColor} />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Alert status="info" bg="rgba(37, 99, 235, 0.1)" borderColor="#2563eb" borderWidth={1}>
              <AlertIcon color="#2563eb" />
              <Text fontSize="sm" color="#FFFFFF">
                Only fill the fields you want to update. Empty fields will be ignored.
              </Text>
            </Alert>

            <FormControl>
              <FormLabel color={textColor}>Status</FormLabel>
              <Select
                value={updates.status || ''}
                onChange={(e) => setUpdates({ ...updates, status: e.target.value || undefined })}
                bg={cardBg}
                borderColor={borderColor}
                color={textColor}
                placeholder="Keep current status"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel color={textColor}>Priority</FormLabel>
              <Select
                value={updates.priority || ''}
                onChange={(e) => setUpdates({ ...updates, priority: e.target.value || undefined })}
                bg={cardBg}
                borderColor={borderColor}
                color={textColor}
                placeholder="Keep current priority"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel color={textColor}>Scheduled Date & Time</FormLabel>
              <Input
                type="datetime-local"
                value={updates.scheduledAt || ''}
                onChange={(e) => setUpdates({ ...updates, scheduledAt: e.target.value || undefined })}
                bg={cardBg}
                borderColor={borderColor}
                color={textColor}
              />
            </FormControl>

            <Divider borderColor={borderColor} />

            <FormControl>
              <FormLabel color={textColor}>Price Adjustment</FormLabel>
              <HStack spacing={2}>
                <Select
                  value={updates.priceAdjustment?.type || ''}
                  onChange={(e) =>
                    setUpdates({
                      ...updates,
                      priceAdjustment: e.target.value
                        ? { type: e.target.value as 'fixed' | 'percentage', value: updates.priceAdjustment?.value || 0 }
                        : undefined,
                    })
                  }
                  bg={cardBg}
                  borderColor={borderColor}
                  color={textColor}
                  placeholder="No adjustment"
                  flex={1}
                >
                  <option value="fixed">Fixed Amount (£)</option>
                  <option value="percentage">Percentage (%)</option>
                </Select>
                {updates.priceAdjustment && (
                  <Input
                    type="number"
                    value={updates.priceAdjustment.value || ''}
                    onChange={(e) =>
                      setUpdates({
                        ...updates,
                        priceAdjustment: {
                          ...updates.priceAdjustment!,
                          value: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    bg={cardBg}
                    borderColor={borderColor}
                    color={textColor}
                    placeholder="0"
                    w="120px"
                  />
                )}
              </HStack>
            </FormControl>

            <FormControl>
              <FormLabel color={textColor}>Notes (will be appended)</FormLabel>
              <Input
                value={updates.notes || ''}
                onChange={(e) => setUpdates({ ...updates, notes: e.target.value || undefined })}
                placeholder="Add notes to all selected orders..."
                bg={cardBg}
                borderColor={borderColor}
                color={textColor}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose} mr={3} color={textColor}>
            Cancel
          </Button>
          <Button
            leftIcon={<FiSave />}
            onClick={handleSave}
            isLoading={saving}
            bg="#2563eb"
            color="#FFFFFF"
            _hover={{ bg: '#1d4ed8' }}
          >
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

