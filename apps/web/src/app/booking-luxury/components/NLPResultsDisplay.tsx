/**
 * Natural Language Processing Results Display
 * Shows parsed items from natural language input with bulk add functionality
 */

import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Flex,
  Icon,
  Divider,
  Alert,
  AlertIcon,
  AlertDescription,
  IconButton
} from '@chakra-ui/react';
import { FaPlus, FaCheckCircle, FaBrain, FaTimes } from 'react-icons/fa';
import { parseNaturalLanguage, type ParseResult, type ParsedItem } from '../../../lib/search/natural-language-parser';
import type { Item } from '../hooks/useBookingForm';

interface NLPResultsDisplayProps {
  query: string;
  onAddItems: (items: Item[]) => void;
  onAddSingleItem: (item: Item) => void;
  onClose: () => void; // New prop to close the analysis
  selectedItems: Item[];
}

export const NLPResultsDisplay: React.FC<NLPResultsDisplayProps> = ({
  query,
  onAddItems,
  onAddSingleItem,
  onClose,
  selectedItems
}) => {
  const parseResult = parseNaturalLanguage(query);
  
  if (parseResult.items.length === 0) {
    return null;
  }

  // Convert parsed items to Item format
  const convertToItems = (parsedItems: ParsedItem[]): Item[] => {
    return parsedItems.map(parsed => ({
      id: parsed.item.id,
      name: parsed.item.name,
      description: `${parsed.item.name} - ${parsed.item.keywords[0]}`,
      category: parsed.item.category as any,
      size: parsed.item.volume > 1.5 ? 'large' : parsed.item.volume > 0.5 ? 'medium' : 'small',
      quantity: parsed.quantity,
      unitPrice: Math.round(parsed.item.volume * 20 + parsed.item.weight * 0.5),
      totalPrice: Math.round((parsed.item.volume * 20 + parsed.item.weight * 0.5) * parsed.quantity),
      weight: parsed.item.weight,
      volume: parsed.item.volume,
      image: `/items/${parsed.item.category}/${parsed.item.id}.png`,
    }));
  };

  const itemsToAdd = convertToItems(parseResult.items);
  const totalItems = parseResult.items.reduce((sum, item) => sum + item.quantity, 0);
  const averageConfidence = parseResult.totalConfidence;

  // Check which items are already selected
  const getItemStatus = (itemId: string): { isSelected: boolean; currentQuantity: number } => {
    const existing = selectedItems.find(item => item.id === itemId);
    return {
      isSelected: !!existing,
      currentQuantity: existing?.quantity || 0
    };
  };

  const handleAddAllItems = () => {
    onAddItems(itemsToAdd);
  };

  const handleAddSingleItem = (parsedItem: ParsedItem) => {
    const item = convertToItems([parsedItem])[0];
    onAddSingleItem(item);
  };

  return (
    <Box
      bg="white"
      border="2px solid"
      borderColor="blue.200"
      borderRadius="xl"
      p={4}
      boxShadow="lg"
      w="90%"
      mx="auto"
      mt={2}
    >
      {/* Header */}
      <HStack spacing={2} mb={3} justify="space-between">
        <HStack spacing={2}>
          <Icon as={FaBrain} color="blue.500" />
          <Text fontWeight="bold" color="blue.700" fontSize="sm">
            Smart Text Analysis
          </Text>
          <Badge colorScheme="blue" variant="subtle">
            {Math.round(averageConfidence)}% confidence
          </Badge>
        </HStack>
        
        <IconButton
          size="xs"
          aria-label="Close analysis"
          icon={<Icon as={FaTimes} />}
          colorScheme="gray"
          variant="ghost"
          onClick={onClose}
          _hover={{ bg: "gray.100" }}
        />
      </HStack>

      {/* Confidence Alert */}
      {averageConfidence > 80 ? (
        <Alert status="success" size="sm" borderRadius="md" mb={3}>
          <AlertIcon />
          <AlertDescription fontSize="xs">
            Found {parseResult.items.length} items ({totalItems} total pieces) in your message
          </AlertDescription>
        </Alert>
      ) : (
        <Alert status="info" size="sm" borderRadius="md" mb={3}>
          <AlertIcon />
          <AlertDescription fontSize="xs">
            Found {parseResult.items.length} possible items - please review before adding
          </AlertDescription>
        </Alert>
      )}

      {/* Parsed Items */}
      <VStack spacing={2} align="stretch">
        {parseResult.items.map((parsedItem, index) => {
          const status = getItemStatus(parsedItem.item.id);
          
          return (
            <Box
              key={`${parsedItem.item.id}-${index}`}
              p={2}
              bg={status.isSelected ? "green.50" : "gray.50"}
              borderRadius="md"
              border="1px solid"
              borderColor={status.isSelected ? "green.200" : "gray.200"}
            >
              <Flex justify="space-between" align="center">
                <HStack spacing={2} flex={1}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.800">
                    {parsedItem.quantity}× {parsedItem.item.name}
                  </Text>
                  <Badge
                    size="sm"
                    colorScheme={
                      parsedItem.confidence > 90 ? 'green' :
                      parsedItem.confidence > 75 ? 'blue' : 'yellow'
                    }
                    variant="subtle"
                  >
                    {Math.round(parsedItem.confidence)}%
                  </Badge>
                  <Badge size="sm" colorScheme="gray" variant="outline">
                    {parsedItem.item.category}
                  </Badge>
                  {status.isSelected && (
                    <Badge size="sm" colorScheme="green">
                      <Icon as={FaCheckCircle} mr={1} />
                      Selected ({status.currentQuantity})
                    </Badge>
                  )}
                </HStack>
                
                <Button
                  size="xs"
                  colorScheme={status.isSelected ? "green" : "blue"}
                  variant={status.isSelected ? "outline" : "solid"}
                  leftIcon={<Icon as={FaPlus} />}
                  onClick={() => handleAddSingleItem(parsedItem)}
                >
                  {status.isSelected ? 'Add More' : 'Add'}
                </Button>
              </Flex>
              
              {/* Item Details */}
              <HStack spacing={2} mt={1}>
                <Text fontSize="xs" color="gray.500">
                  Matched: "{parsedItem.matchedText}"
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {parsedItem.item.weight}kg • {parsedItem.item.volume}m³
                </Text>
              </HStack>
            </Box>
          );
        })}
      </VStack>

      <Divider my={3} />

      {/* Bulk Actions */}
      <Flex justify="space-between" align="center">
        <VStack align="start" spacing={0}>
          <Text fontSize="sm" fontWeight="medium" color="gray.700">
            Total: {totalItems} items
          </Text>
          <Text fontSize="xs" color="gray.500">
            From: "{parseResult.originalText.substring(0, 50)}..."
          </Text>
        </VStack>
        
        <HStack spacing={2}>
          <Button
            colorScheme="gray"
            size="sm"
            variant="outline"
            onClick={onClose}
          >
            Done
          </Button>
          <Button
            colorScheme="blue"
            size="sm"
            leftIcon={<Icon as={FaPlus} />}
            onClick={handleAddAllItems}
            isDisabled={parseResult.items.length === 0}
          >
            Add All Items
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
};

export default NLPResultsDisplay;
