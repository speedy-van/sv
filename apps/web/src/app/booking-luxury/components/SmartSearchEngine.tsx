/**
 * Smart Search Engine with Autocomplete
 * 
 * Provides intelligent search with partial word matching,
 * synonym support, and real-time autocomplete suggestions
 */

'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Input,
  Text,
  Card,
  Badge,
  Icon,
  InputGroup,
  InputLeftElement,
  useDisclosure,
  Collapse,
  Button,
  Flex
} from '@chakra-ui/react';
import { FaSearch, FaBolt, FaClock, FaFire } from 'react-icons/fa';

import type { Item } from '../../../lib/booking/utils';

// Enhanced synonym mapping for better search results
const SEARCH_SYNONYMS: Record<string, string[]> = {
  // Furniture synonyms
  'sofa': ['couch', 'settee', 'loveseat', 'sectional'],
  'couch': ['sofa', 'settee', 'loveseat'],
  'wardrobe': ['closet', 'armoire', 'cupboard', 'dresser'],
  'closet': ['wardrobe', 'armoire', 'cupboard'],
  'chest of drawers': ['dresser', 'drawer unit', 'bedroom storage'],
  'dresser': ['chest of drawers', 'drawer unit'],
  'coffee table': ['center table', 'living room table', 'tea table'],
  'dining table': ['kitchen table', 'eating table', 'dinner table'],
  'bedside table': ['nightstand', 'night table', 'bedside cabinet'],
  'nightstand': ['bedside table', 'night table'],
  'bookshelf': ['bookcase', 'shelf unit', 'book storage'],
  'tv stand': ['television stand', 'tv unit', 'media unit', 'entertainment center'],
  
  // Appliances synonyms
  'refrigerator': ['fridge', 'icebox', 'cooler'],
  'fridge': ['refrigerator', 'icebox'],
  'washing machine': ['washer', 'laundry machine'],
  'washer': ['washing machine', 'laundry machine'],
  'tumble dryer': ['dryer', 'clothes dryer', 'tumbler'],
  'dryer': ['tumble dryer', 'clothes dryer'],
  'dishwasher': ['dish washer', 'kitchen dishwasher'],
  'microwave': ['microwave oven', 'micro'],
  'vacuum cleaner': ['vacuum', 'hoover', 'carpet cleaner'],
  'vacuum': ['vacuum cleaner', 'hoover'],
  
  // Electronics synonyms
  'television': ['tv', 'telly', 'screen'],
  'tv': ['television', 'telly', 'screen'],
  'computer': ['pc', 'desktop', 'laptop'],
  'laptop': ['notebook', 'computer', 'pc'],
  'desktop': ['computer', 'pc', 'tower'],
  
  // Bedroom synonyms
  'bed': ['mattress', 'sleeping', 'bedroom furniture'],
  'mattress': ['bed', 'sleeping mat', 'bedding'],
  'pillow': ['cushion', 'head rest'],
  'blanket': ['duvet', 'cover', 'bedding'],
  
  // Storage & boxes
  'box': ['container', 'carton', 'package', 'crate'],
  'container': ['box', 'storage', 'bin'],
  'storage': ['container', 'box', 'organizer'],
  
  // Kitchen synonyms
  'stove': ['cooker', 'oven', 'hob'],
  'oven': ['cooker', 'stove', 'range'],
  'sink': ['basin', 'wash basin'],
  
  // General synonyms
  'chair': ['seat', 'seating'],
  'table': ['desk', 'surface'],
  'lamp': ['light', 'lighting', 'illumination'],
  'mirror': ['glass', 'reflection'],
  'plant': ['flower', 'greenery', 'decoration'],
  'picture': ['photo', 'artwork', 'frame', 'painting'],
  'carpet': ['rug', 'mat', 'flooring'],
  'curtain': ['drapes', 'window covering', 'blinds']
};

// Recent searches storage key
const RECENT_SEARCHES_KEY = 'speedyvan_recent_searches';

interface SmartSearchEngineProps {
  items: Item[];
  onSearch: (searchTerm: string) => void;
  onItemSelect?: (item: Item) => void;
  placeholder?: string;
  showTrending?: boolean;
}

interface SearchSuggestion {
  text: string;
  type: 'item' | 'category' | 'recent' | 'synonym';
  item?: Item;
  count?: number;
}

export default function SmartSearchEngine({
  items,
  onSearch,
  onItemSelect,
  placeholder = "Search items (e.g., 'bed', 'wardrobe', 'TV')...",
  showTrending = true
}: SmartSearchEngineProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isOpen: suggestionsOpen, onOpen, onClose } = useDisclosure();

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  }, []);

  // Generate search suggestions based on input
  const searchSuggestions = useMemo((): SearchSuggestion[] => {
    if (!searchTerm.trim()) {
      // Show recent searches and trending when no input
      const suggestions: SearchSuggestion[] = [];
      
      // Add recent searches
      recentSearches.slice(0, 3).forEach(recent => {
        suggestions.push({
          text: recent,
          type: 'recent'
        });
      });
      
      // Add trending categories if enabled
      if (showTrending) {
        ['bedroom', 'living room', 'kitchen', 'appliances'].forEach(category => {
          suggestions.push({
            text: category,
            type: 'category'
          });
        });
      }
      
      return suggestions;
    }

    const suggestions: SearchSuggestion[] = [];
    const searchLower = searchTerm.toLowerCase().trim();
    const words = searchLower.split(/\s+/);
    
    // Direct item matches
    items.forEach(item => {
      const itemNameLower = item.name.toLowerCase();
      const itemWords = itemNameLower.split(/\s+/);
      
      // Exact match
      if (itemNameLower.includes(searchLower)) {
        suggestions.push({
          text: item.name,
          type: 'item',
          item: item
        });
        return;
      }
      
      // Partial word matching
      const hasPartialMatch = words.some(searchWord => 
        itemWords.some(itemWord => 
          itemWord.startsWith(searchWord) || searchWord.startsWith(itemWord)
        )
      );
      
      if (hasPartialMatch) {
        suggestions.push({
          text: item.name,
          type: 'item',
          item: item
        });
      }
    });
    
    // Synonym matching
    Object.entries(SEARCH_SYNONYMS).forEach(([key, synonyms]) => {
      if (key.includes(searchLower) || synonyms.some(syn => syn.includes(searchLower))) {
        // Find items that match the key or synonyms
        const matchingItems = items.filter(item => {
          const itemName = item.name.toLowerCase();
          return itemName.includes(key) || 
                 synonyms.some(syn => itemName.includes(syn));
        });
        
        matchingItems.forEach(item => {
          // Avoid duplicates
          if (!suggestions.some(s => s.item?.id === item.id)) {
            suggestions.push({
              text: item.name,
              type: 'synonym',
              item: item
            });
          }
        });
      }
    });
    
    // Category suggestions
    const categories = ['bedroom', 'living', 'kitchen', 'bathroom', 'appliances', 'electronics'];
    categories.forEach(category => {
      if (category.includes(searchLower)) {
        suggestions.push({
          text: `${category} items`,
          type: 'category'
        });
      }
    });
    
    // Remove duplicates and limit results
    const uniqueSuggestions = suggestions.filter((suggestion, index, self) => 
      index === self.findIndex(s => s.text === suggestion.text)
    );
    
    return uniqueSuggestions.slice(0, 8);
  }, [searchTerm, items, recentSearches, showTrending]);

  // Handle search execution
  const handleSearch = (term: string) => {
    const trimmedTerm = term.trim();
    if (!trimmedTerm) return;
    
    // Add to recent searches
    const newRecentSearches = [trimmedTerm, ...recentSearches.filter(s => s !== trimmedTerm)].slice(0, 5);
    setRecentSearches(newRecentSearches);
    
    // Save to localStorage
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newRecentSearches));
    } catch (error) {
      console.error('Error saving recent searches:', error);
    }
    
    setSearchTerm(trimmedTerm);
    onSearch(trimmedTerm);
    onClose();
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.item && onItemSelect) {
      onItemSelect(suggestion.item);
    } else {
      handleSearch(suggestion.text.replace(' items', ''));
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.trim()) {
      onOpen();
    } else {
      onClose();
    }
  };

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(searchTerm);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Trending items based on frequency (mock data for now)
  const trendingItems = useMemo(() => {
    const trending = [
      'Double Bed',
      'Wardrobe',
      'Sofa',
      'Dining Table',
      'Refrigerator',
      'Washing Machine',
      'TV',
      'Chest of Drawers'
    ];
    
    return items.filter(item => 
      trending.some(trend => item.name.toLowerCase().includes(trend.toLowerCase()))
    ).slice(0, 4);
  }, [items]);

  return (
    <Box position="relative" w="full">
      <VStack spacing={3} align="stretch">
        {/* Search Input */}
        <InputGroup size="lg">
          <InputLeftElement pointerEvents="none">
            <Icon as={FaSearch} color="gray.400" boxSize={5} />
          </InputLeftElement>
          <Input
            ref={inputRef}
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={onOpen}
            placeholder={placeholder}
            borderRadius="xl"
            borderWidth="2px"
            borderColor="purple.200"
            bg="white"
            _focus={{
              borderColor: 'purple.400',
              boxShadow: '0 0 0 1px rgba(128, 90, 213, 0.4)'
            }}
            _hover={{
              borderColor: 'purple.300'
            }}
            fontSize="md"
            pl={12}
          />
        </InputGroup>

        {/* Search Suggestions Dropdown */}
        <Collapse in={suggestionsOpen && searchSuggestions.length > 0} animateOpacity>
          <Card
            bg="white"
            borderRadius="xl"
            shadow="xl"
            borderWidth="1px"
            borderColor="gray.200"
            maxH="300px"
            overflowY="auto"
          >
            <VStack spacing={0} align="stretch" p={2}>
              {searchSuggestions.map((suggestion, index) => (
                <Button
                  key={`${suggestion.type}-${suggestion.text}-${index}`}
                  variant="ghost"
                  justifyContent="flex-start"
                  onClick={() => handleSuggestionClick(suggestion)}
                  p={3}
                  h="auto"
                  borderRadius="lg"
                  _hover={{ bg: 'purple.50' }}
                  textAlign="left"
                >
                  <HStack spacing={3} w="full">
                    <Icon
                      as={
                        suggestion.type === 'recent' ? FaClock :
                        suggestion.type === 'category' ? FaBolt :
                        suggestion.type === 'synonym' ? FaBolt :
                        FaSearch
                      }
                      color={
                        suggestion.type === 'recent' ? 'gray.400' :
                        suggestion.type === 'category' ? 'purple.500' :
                        'blue.500'
                      }
                      boxSize={4}
                      flexShrink={0}
                    />
                    
                    <VStack align="start" spacing={0} flex="1">
                      <Text fontSize="sm" fontWeight="medium" color="gray.800">
                        {suggestion.text}
                      </Text>
                      {suggestion.item && (
                        <Text fontSize="xs" color="gray.500">
                          {suggestion.item.category} • £{suggestion.item.unitPrice}
                        </Text>
                      )}
                    </VStack>
                    
                    <Badge
                      size="sm"
                      colorScheme={
                        suggestion.type === 'recent' ? 'gray' :
                        suggestion.type === 'category' ? 'purple' :
                        suggestion.type === 'synonym' ? 'blue' :
                        'green'
                      }
                      variant="subtle"
                    >
                      {suggestion.type === 'recent' ? 'Recent' :
                       suggestion.type === 'category' ? 'Category' :
                       suggestion.type === 'synonym' ? 'Similar' :
                       'Item'}
                    </Badge>
                  </HStack>
                </Button>
              ))}
            </VStack>
          </Card>
        </Collapse>

        {/* Trending Items Section */}
        {showTrending && !searchTerm && trendingItems.length > 0 && (
          <Card bg="gradient-to-r from-orange.50 to-red.50" borderRadius="xl" p={4}>
            <VStack spacing={3} align="stretch">
              <HStack spacing={2}>
                <Icon as={FaFire} color="orange.500" boxSize={4} />
                <Text fontSize="sm" fontWeight="bold" color="orange.700">
                  Trending Items
                </Text>
                <Badge colorScheme="orange" variant="subtle" fontSize="xs">
                  Popular this week
                </Badge>
              </HStack>
              
              <Flex wrap="wrap" gap={2}>
                {trendingItems.map((item) => (
                  <Button
                    key={item.id}
                    size="sm"
                    variant="outline"
                    colorScheme="orange"
                    onClick={() => onItemSelect?.(item)}
                    borderRadius="full"
                    _hover={{
                      bg: 'orange.100',
                      transform: 'translateY(-1px)',
                      shadow: 'md'
                    }}
                    transition="all 0.2s"
                  >
                    {item.name}
                  </Button>
                ))}
              </Flex>
            </VStack>
          </Card>
        )}

        {/* Quick Search Suggestions */}
        {!searchTerm && (
          <Card bg="purple.50" borderRadius="xl" p={4}>
            <VStack spacing={3} align="stretch">
              <HStack spacing={2}>
                <Icon as={FaBolt} color="purple.500" boxSize={4} />
                <Text fontSize="sm" fontWeight="bold" color="purple.700">
                  Quick Search
                </Text>
              </HStack>
              
              <Flex wrap="wrap" gap={2}>
                {['bedroom furniture', 'kitchen appliances', 'living room', 'electronics', 'storage boxes', 'bathroom items'].map((suggestion) => (
                  <Button
                    key={suggestion}
                    size="sm"
                    variant="solid"
                    colorScheme="purple"
                    onClick={() => handleSearch(suggestion)}
                    borderRadius="full"
                    _hover={{
                      bg: 'purple.600',
                      transform: 'translateY(-1px)',
                      shadow: 'md'
                    }}
                    transition="all 0.2s"
                  >
                    {suggestion}
                  </Button>
                ))}
              </Flex>
            </VStack>
          </Card>
        )}
      </VStack>
    </Box>
  );
}