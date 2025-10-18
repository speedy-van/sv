/**
 * View Items Modal Component
 * Displays selected items with details and allows editing
 */

'use client';

import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Box,
  Flex,
  Text,
  Badge,
  IconButton,
  VStack,
  HStack,
  Divider,
  Image,
  Input,
  useToast,
} from '@chakra-ui/react';
import { FiTrash2, FiPlus, FiMinus, FiPackage } from 'react-icons/fi';

export interface ViewItemsModalItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  weight?: number;
  volume?: number;
  image?: string;
  unitPrice?: number;
}

interface ViewItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ViewItemsModalItem[];
  onUpdateItem?: (itemId: string, quantity: number) => void;
  onRemoveItem?: (itemId: string) => void;
  readOnly?: boolean;
}

export default function ViewItemsModal({
  isOpen,
  onClose,
  items,
  onUpdateItem,
  onRemoveItem,
  readOnly = false,
}: ViewItemsModalProps) {
  const toast = useToast();

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      toast({
        title: 'Invalid Quantity',
        description: 'Quantity must be at least 1',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    if (onUpdateItem) {
      onUpdateItem(itemId, newQuantity);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    if (onRemoveItem) {
      onRemoveItem(itemId);
      toast({
        title: 'Item Removed',
        description: 'Item has been removed from your list',
        status: 'info',
        duration: 2000,
      });
    }
  };

  const getTotalWeight = () => {
    return items.reduce((sum, item) => sum + (item.weight || 0) * item.quantity, 0);
  };

  const getTotalVolume = () => {
    return items.reduce((sum, item) => sum + (item.volume || 0) * item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((sum, item) => sum + (item.unitPrice || 0) * item.quantity, 0);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      furniture: 'blue',
      appliances: 'green',
      electronics: 'purple',
      boxes: 'orange',
      'full-house': 'red',
    };
    return colors[category.toLowerCase()] || 'gray';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Flex align="center" gap={2}>
            <FiPackage />
            <Text>Selected Items ({items.length})</Text>
          </Flex>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          {items.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Text color="gray.500" fontSize="lg">
                No items selected yet
              </Text>
              <Text color="gray.400" fontSize="sm" mt={2}>
                Add items to see them here
              </Text>
            </Box>
          ) : (
            <VStack spacing={4} align="stretch">
              {items.map((item) => (
                <Box
                  key={item.id}
                  p={4}
                  borderWidth="1px"
                  borderRadius="md"
                  borderColor="gray.200"
                  _hover={{ borderColor: 'blue.300', shadow: 'sm' }}
                  transition="all 0.2s"
                >
                  <Flex gap={4}>
                    {/* Item Image */}
                    {item.image && (
                      <Box flexShrink={0}>
                        <Image
                          src={item.image}
                          alt={item.name}
                          boxSize="60px"
                          objectFit="cover"
                          borderRadius="md"
                          fallbackSrc="/items/placeholder.png"
                        />
                      </Box>
                    )}

                    {/* Item Details */}
                    <Box flex={1}>
                      <Flex justify="space-between" align="start">
                        <Box>
                          <Text fontWeight="bold" fontSize="md">
                            {item.name}
                          </Text>
                          <Badge colorScheme={getCategoryColor(item.category)} mt={1}>
                            {item.category}
                          </Badge>
                        </Box>

                        {!readOnly && onRemoveItem && (
                          <IconButton
                            aria-label="Remove item"
                            icon={<FiTrash2 />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => handleRemoveItem(item.id)}
                          />
                        )}
                      </Flex>

                      {/* Item Specs */}
                      <HStack spacing={4} mt={2} fontSize="sm" color="gray.600">
                        {item.weight && (
                          <Text>Weight: {item.weight * item.quantity}kg</Text>
                        )}
                        {item.volume && (
                          <Text>Volume: {item.volume * item.quantity}m³</Text>
                        )}
                        {item.unitPrice && (
                          <Text fontWeight="semibold" color="blue.600">
                            £{((item.unitPrice * item.quantity) / 100).toFixed(2)}
                          </Text>
                        )}
                      </HStack>

                      {/* Quantity Controls */}
                      <HStack mt={3} spacing={2}>
                        <Text fontSize="sm" color="gray.600">
                          Quantity:
                        </Text>
                        {!readOnly && onUpdateItem ? (
                          <HStack>
                            <IconButton
                              aria-label="Decrease quantity"
                              icon={<FiMinus />}
                              size="sm"
                              onClick={() =>
                                handleQuantityChange(item.id, item.quantity - 1)
                              }
                              isDisabled={item.quantity <= 1}
                            />
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                handleQuantityChange(
                                  item.id,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              size="sm"
                              width="60px"
                              textAlign="center"
                            />
                            <IconButton
                              aria-label="Increase quantity"
                              icon={<FiPlus />}
                              size="sm"
                              onClick={() =>
                                handleQuantityChange(item.id, item.quantity + 1)
                              }
                            />
                          </HStack>
                        ) : (
                          <Badge colorScheme="blue" fontSize="md">
                            {item.quantity}
                          </Badge>
                        )}
                      </HStack>
                    </Box>
                  </Flex>
                </Box>
              ))}

              {/* Summary */}
              <Divider />
              <Box p={4} bg="gray.50" borderRadius="md">
                <Text fontWeight="bold" mb={2}>
                  Summary
                </Text>
                <VStack align="stretch" spacing={1} fontSize="sm">
                  <Flex justify="space-between">
                    <Text>Total Items:</Text>
                    <Text fontWeight="semibold">{items.length}</Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text>Total Quantity:</Text>
                    <Text fontWeight="semibold">
                      {items.reduce((sum, item) => sum + item.quantity, 0)}
                    </Text>
                  </Flex>
                  {getTotalWeight() > 0 && (
                    <Flex justify="space-between">
                      <Text>Total Weight:</Text>
                      <Text fontWeight="semibold">{getTotalWeight().toFixed(2)} kg</Text>
                    </Flex>
                  )}
                  {getTotalVolume() > 0 && (
                    <Flex justify="space-between">
                      <Text>Total Volume:</Text>
                      <Text fontWeight="semibold">{getTotalVolume().toFixed(2)} m³</Text>
                    </Flex>
                  )}
                  {getTotalPrice() > 0 && (
                    <Flex justify="space-between" pt={2} borderTopWidth="1px">
                      <Text fontWeight="bold">Total Price:</Text>
                      <Text fontWeight="bold" color="blue.600" fontSize="lg">
                        £{(getTotalPrice() / 100).toFixed(2)}
                      </Text>
                    </Flex>
                  )}
                </VStack>
              </Box>
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

