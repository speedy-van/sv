/**
 * Smart Search Box Component
 * Advanced search with autocomplete, real-time suggestions, and +/- controls
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Flex,
  Badge,
  Portal,
  useOutsideClick,
  Icon,
  Divider
} from '@chakra-ui/react';
import { FaSearch, FaTimes, FaPlus, FaMinus, FaBrain, FaCouch, FaBed, FaUtensils, FaTv, FaBox, FaCar, FaBicycle, FaMusic, FaBook, FaHome, FaChair } from 'react-icons/fa';
import { getAutocomplete, getSuggestions, type SearchSuggestion } from '../../../lib/search/smart-search';
import { isNaturalLanguageQuery, parseNaturalLanguage } from '../../../lib/search/natural-language-parser';
import { convertPopularToItem } from '../../../lib/items/popular-items';
import { COMPREHENSIVE_CATALOG } from '../../../lib/pricing/catalog-dataset';
import NLPResultsDisplay from './NLPResultsDisplay';
import type { Item } from '../hooks/useBookingForm';

interface SmartSearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  onItemAdd: (item: Item) => void;
  onItemUpdate: (itemId: string, quantity: number) => void;
  onAddItems: (items: Item[]) => void; // For bulk adding from NLP
  selectedItems: Item[];
  placeholder?: string;
}

export const SmartSearchBox: React.FC<SmartSearchBoxProps> = ({
  value,
  onChange,
  onItemAdd,
  onItemUpdate,
  onAddItems,
  selectedItems,
  placeholder = "Search for furniture, appliances, boxes... (e.g., 'sofa', 'heavy items', 'kitchen')"
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<SearchSuggestion[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [inlineCompletion, setInlineCompletion] = useState('');
  const [showNLPAnalysis, setShowNLPAnalysis] = useState(true); // State to control NLP display
  const [catalogItems, setCatalogItems] = useState<any[]>([]); // Loaded catalog items
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Close suggestions when clicking outside
  useOutsideClick({
    ref: containerRef,
    handler: () => {
      // Add delay to prevent immediate closing when clicking inside suggestions
      setTimeout(() => {
        setIsFocused(false);
        setHighlightedIndex(-1);
      }, 100);
    }
  });

  // Load catalog items on component mount
  useEffect(() => {
    const loadCatalogItems = async () => {
      try {
        // Try to load from COMPREHENSIVE_CATALOG first
        if (COMPREHENSIVE_CATALOG.length > 0) {
          setCatalogItems(COMPREHENSIVE_CATALOG);
          return;
        }

        // Fallback: Use COMPREHENSIVE_CATALOG instead of old dataset
        console.log('Using COMPREHENSIVE_CATALOG instead of old dataset file');
        setCatalogItems(COMPREHENSIVE_CATALOG);
      } catch (error) {
        console.warn('Failed to load catalog items:', error);
        // Keep empty array as fallback
        setCatalogItems([]);
      }
    };

    loadCatalogItems();
  }, []);

  // Handle keyboard events for better mobile experience
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsFocused(false);
      setHighlightedIndex(-1);
      inputRef.current?.blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const totalSuggestions = suggestions.length;
      setHighlightedIndex(prev => Math.min(prev + 1, totalSuggestions - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      // Handle selection based on highlighted index
      const suggestion = suggestions[highlightedIndex];
      if (suggestion.item) {
        const item = convertCatalogToItem(suggestion.item);
        onItemAdd(item);
        onChange('');
      }
      setIsFocused(false);
      setHighlightedIndex(-1);
    }
  }, [highlightedIndex, suggestions, onChange, onItemAdd]);

  // Handle mobile keyboard behavior
  useEffect(() => {
    const handleResize = () => {
      // Recalculate position when viewport changes (keyboard open/close)
      if (isFocused && suggestionsRef.current) {
        const inputRect = inputRef.current?.getBoundingClientRect();
        if (inputRect) {
          const viewportHeight = window.innerHeight;
          const suggestionsHeight = 200;
          const spaceBelow = viewportHeight - inputRect.bottom;
          const spaceAbove = inputRect.top;
          
          if (spaceBelow < suggestionsHeight && spaceAbove > spaceBelow) {
            // Show above if keyboard is open and there's more space above
            suggestionsRef.current.style.top = `${Math.max(8, inputRect.top - suggestionsHeight - 4)}px`;
          } else {
            // Show below
            suggestionsRef.current.style.top = `${inputRect.bottom + 4}px`;
          }
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFocused]);

  // Reset NLP analysis visibility when value changes
  useEffect(() => {
    if (value && isNaturalLanguageQuery(value)) {
      setShowNLPAnalysis(true);
    }
  }, [value]);

  // Local search function using loaded catalog items
  const searchLocalItems = (query: string, limit: number = 12) => {
    if (!query || query.length < 1) {
      // Return popular items when no query
      return catalogItems.slice(0, limit).map(item => ({
        id: item.id,
        text: item.name,
        type: 'item' as const,
        popularity: 100,
        matchedKeywords: item.keywords || [],
        item: item
      }));
    }

    const queryLower = query.toLowerCase();
    const results = catalogItems.filter(item => {
      // Search in name
      if (item.name.toLowerCase().includes(queryLower)) return true;
      
      // Search in keywords
      if (item.keywords && Array.isArray(item.keywords)) {
        return item.keywords.some((keyword: string) => 
          keyword.toLowerCase().includes(queryLower)
        );
      }
      
      // Search in category
      if (item.category && item.category.toLowerCase().includes(queryLower)) return true;
      
      return false;
    }).slice(0, limit);

    return results.map(item => ({
      id: item.id,
      text: item.name,
      type: 'item' as const,
      popularity: 100,
      matchedKeywords: item.keywords || [],
      item: item
    }));
  };

  // Update suggestions when query changes - NOW TRIGGERS ON SINGLE CHARACTER!
  useEffect(() => {
    const updateSuggestions = async () => {
      // Use local search with loaded catalog items
      const searchSuggestions = searchLocalItems(value, 12);
      
      setAutocompleteSuggestions([]); // No autocomplete suggestions
      setSuggestions(searchSuggestions);
      
      // Set inline completion for first exact match
      if (searchSuggestions.length > 0 && searchSuggestions[0].text.toLowerCase().startsWith(value.toLowerCase())) {
        const completion = searchSuggestions[0].text.substring(value.length);
        setInlineCompletion(completion);
      } else {
        setInlineCompletion('');
      }
    };

    const debounceTimer = setTimeout(updateSuggestions, 50); // Faster response
    return () => clearTimeout(debounceTimer);
  }, [value, catalogItems]);


  // Handle suggestion click - ONE CLICK SELECTION
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    // ALWAYS fill the search field first
    onChange(suggestion.text);
    setInlineCompletion('');
    
    // If it's an item suggestion, also add it to the cart
    if (suggestion.type === 'item' && suggestion.item) {
      const item = convertCatalogToItem(suggestion.item);
      onItemAdd(item);
    }
    
    // Keep focus and suggestions for continuous searching
    setTimeout(() => {
      inputRef.current?.focus();
      setIsFocused(true);
    }, 100);
  };

  // Handle mouse enter/leave to maintain focus
  const handleSuggestionsMouseEnter = () => {
    setIsFocused(true);
  };

  const handleSuggestionsMouseLeave = () => {
    // Don't close immediately, let user click
  };

  // Text highlighting function for search matches
  const highlightMatchedText = (text: string, query: string) => {
    if (!query || query.length === 0) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      if (part.toLowerCase() === query.toLowerCase()) {
        return <Text as="span" key={index} fontWeight="bold" color="blue.300">{part}</Text>;
      }
      return part;
    });
  };

  // Convert catalog item to Item format
  const convertCatalogToItem = (catalogItem: any): Item => {
    return {
      id: catalogItem.id,
      name: catalogItem.name,
      description: `${catalogItem.name} - ${Array.isArray(catalogItem.keywords) ? catalogItem.keywords[0] : catalogItem.keywords}`,
      category: catalogItem.category,
      size: catalogItem.volume > 1.5 ? 'large' : catalogItem.volume > 0.5 ? 'medium' : 'small',
      quantity: 1,
      unitPrice: Math.round(catalogItem.volume * 20 + catalogItem.weight * 0.5),
      totalPrice: Math.round(catalogItem.volume * 20 + catalogItem.weight * 0.5),
      weight: catalogItem.weight,
      volume: catalogItem.volume,
      image: '', // No default image - use icons instead
    };
  };

  // Get current quantity for an item
  const getItemQuantity = (itemId: string): number => {
    return selectedItems.find(item => item.id === itemId)?.quantity || 0;
  };

  // Get icon for category
  const getCategoryIcon = (category: string) => {
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes('sofa') || categoryLower.includes('couch') || categoryLower.includes('living')) {
      return FaCouch;
    }
    if (categoryLower.includes('bed') || categoryLower.includes('bedroom')) {
      return FaBed;
    }
    if (categoryLower.includes('kitchen') || categoryLower.includes('dining') || categoryLower.includes('cook')) {
      return FaUtensils;
    }
    if (categoryLower.includes('tv') || categoryLower.includes('electronic') || categoryLower.includes('audio')) {
      return FaTv;
    }
    if (categoryLower.includes('bike') || categoryLower.includes('bicycle')) {
      return FaBicycle;
    }
    if (categoryLower.includes('car') || categoryLower.includes('vehicle')) {
      return FaCar;
    }
    if (categoryLower.includes('music') || categoryLower.includes('instrument')) {
      return FaMusic;
    }
    if (categoryLower.includes('book') || categoryLower.includes('study') || categoryLower.includes('office')) {
      return FaBook;
    }
    if (categoryLower.includes('chair') || categoryLower.includes('seating')) {
      return FaChair;
    }
    if (categoryLower.includes('antique') || categoryLower.includes('collectible')) {
      return FaHome;
    }
    // Default icon for boxes and general items
    return FaBox;
  };

  // Handle item quantity change
  const handleQuantityChange = (itemId: string, change: number) => {
    const currentQuantity = getItemQuantity(itemId);
    const newQuantity = Math.max(0, currentQuantity + change);
    onItemUpdate(itemId, newQuantity);
  };

  return (
    <Box ref={containerRef} position="relative" w="100%">
      {/* Search Input with Inline Completion */}
      <InputGroup size="lg">
        <Box position="relative" flex="1">
          {/* Background text for inline completion */}
          {inlineCompletion && (
            <Text
              position="absolute"
              left="16px" // No search icon, so adjust position
              top="50%"
              transform="translateY(-50%)"
              fontSize="md"
              color="gray.400"
              pointerEvents="none"
              zIndex={1}
              whiteSpace="nowrap"
            >
              {value + inlineCompletion}
            </Text>
          )}
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setInlineCompletion('');
            }}
            onFocus={() => {
              setIsFocused(true);
              setHighlightedIndex(-1);
            }}
            onBlur={(e) => {
              // Only close if not clicking inside suggestions
              if (!suggestionsRef.current?.contains(e.relatedTarget as Node)) {
                setTimeout(() => setIsFocused(false), 150);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            bg="white"
            border="2px solid"
            borderColor={isFocused ? "blue.300" : "gray.200"}
            borderRadius="xl"
            fontSize="md"
            position="relative"
            zIndex={2}
            _hover={{ borderColor: "blue.200" }}
            _focus={{ 
              borderColor: "blue.400", 
              boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)" 
            }}
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </Box>
        {value && (
          <InputRightElement>
            <IconButton
              size="sm"
              variant="ghost"
              aria-label="Clear search"
              icon={<FaTimes />}
              onClick={() => {
                onChange('');
                setInlineCompletion('');
                inputRef.current?.focus();
              }}
              color="gray.400"
              _hover={{ color: "gray.600" }}
            />
          </InputRightElement>
        )}
      </InputGroup>

      {/* Search Suggestions Dropdown - PREMIUM DARK THEME */}
      {isFocused && (autocompleteSuggestions.length > 0 || suggestions.length > 0) && (
        <Portal>
          <Box
            ref={suggestionsRef}
            position="fixed"
            bg="rgba(31, 41, 55, 0.95)" // Dark glass effect
            backdropFilter="blur(12px)"
            borderRadius="xl"
            border="2px solid"
            borderColor="rgba(255, 255, 255, 0.1)"
            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.5)"
            zIndex={9999}
            maxH={{ base: "300px", md: "400px" }}
            overflowY="auto"
            w={{ base: "calc(100vw - 32px)", md: "90%" }}
            maxW={{ base: "400px", md: "600px" }}
            onMouseEnter={handleSuggestionsMouseEnter}
            onMouseLeave={handleSuggestionsMouseLeave}
            sx={{
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '3px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '3px',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.5)',
                }
              }
            }}
            style={{
              top: inputRef.current ? (() => {
                const inputRect = inputRef.current.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const suggestionsHeight = 200; // Base height for mobile
                const spaceBelow = viewportHeight - inputRect.bottom;
                const spaceAbove = inputRect.top;
                
                // If there's enough space below, show below
                if (spaceBelow >= suggestionsHeight) {
                  return inputRect.bottom + window.scrollY + 4;
                }
                // If there's more space above, show above
                else if (spaceAbove > spaceBelow) {
                  return Math.max(8, inputRect.top + window.scrollY - suggestionsHeight - 4);
                }
                // Otherwise, show below but limit height
                else {
                  return inputRect.bottom + window.scrollY + 4;
                }
              })() : 0,
              left: inputRef.current ? (() => {
                const inputRect = inputRef.current.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const suggestionsWidth = Math.min(343, viewportWidth - 32);
                const leftPosition = inputRect.left + window.scrollX;
                
                // Center if possible, otherwise align to input
                if (leftPosition + suggestionsWidth > viewportWidth) {
                  return Math.max(16, viewportWidth - suggestionsWidth - 16) + window.scrollX;
                }
                return leftPosition;
              })() : 0,
            }}
          >
            {/* Individual Items Search Results */}

            {/* Search Results with +/- Controls - PREMIUM DARK THEME */}
            {suggestions.length > 0 && (
              <VStack spacing={0} align="stretch">
                <Box p={3} bg="rgba(34, 197, 94, 0.1)">
                  <Text fontSize="xs" fontWeight="semibold" color="green.300">
                    ⚡ Click to Add Items Instantly
                  </Text>
                </Box>
                {suggestions.slice(0, 8).map((suggestion, index) => {
                  const adjustedIndex = index; // No autocomplete suggestions anymore
                  const currentQuantity = suggestion.item ? getItemQuantity(suggestion.item.id) : 0;
                  
                  return (
                    <Box
                      key={suggestion.id}
                      p={3}
                      bg={highlightedIndex === adjustedIndex ? "rgba(34, 197, 94, 0.15)" : "transparent"}
                      _hover={{ 
                        bg: "rgba(34, 197, 94, 0.1)",
                        transform: "translateX(4px)",
                      }}
                      transition="all 0.2s ease"
                      borderLeft="2px solid"
                      borderColor={highlightedIndex === adjustedIndex ? "green.400" : "transparent"}
                      borderBottomRadius={index === Math.min(suggestions.length - 1, 3) ? "xl" : "none"}
                    >
                      {/* TABLE FORMAT: Icon + Names with +/- controls */}
                      <Flex justify="space-between" align="center" w="full">
                        {/* Icon + Item Name (Left) */}
                        <HStack spacing={3} flex={1}>
                          {/* Category Icon */}
                          {suggestion.item && (
                            <Icon
                              as={getCategoryIcon(suggestion.item.category)}
                              color="blue.300"
                              boxSize={5}
                              flexShrink={0}
                            />
                          )}
                          <VStack align="start" spacing={0} flex={1}>
                            <Text fontSize="sm" fontWeight="medium" color="white">
                              {highlightMatchedText(suggestion.text, value)}
                            </Text>
                            {suggestion.item && (
                              <Text fontSize="xs" color="gray.400">
                                {suggestion.item.category}
                              </Text>
                            )}
                          </VStack>
                        </HStack>
                        
                        {/* Quantity Controls (Right) */}
                        {suggestion.item && (
                          <HStack spacing={1}>
                            {currentQuantity > 0 && (
                              <>
                                <IconButton
                                  size="xs"
                                  variant="ghost"
                                  colorScheme="red"
                                  aria-label="Remove"
                                  icon={<FaMinus />}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleQuantityChange(suggestion.item!.id, -1);
                                  }}
                                />
                                <Text 
                                  fontSize="sm" 
                                  fontWeight="bold" 
                                  color="white" 
                                  minW="20px" 
                                  textAlign="center"
                                >
                                  {currentQuantity}
                                </Text>
                              </>
                            )}
                            
                            <IconButton
                              size="xs"
                              variant="ghost"
                              colorScheme="green"
                              aria-label="Add"
                              icon={<FaPlus />}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (currentQuantity === 0) {
                                  const item = convertCatalogToItem(suggestion.item!);
                                  onItemAdd(item);
                                } else {
                                  handleQuantityChange(suggestion.item!.id, 1);
                                }
                              }}
                            />
                          </HStack>
                        )}
                      </Flex>
                    </Box>
                  );
                })}
                
                {/* Done Button */}
                {suggestions.length > 0 && (
                  <Box p={3} bg="rgba(59, 130, 246, 0.1)" borderTop="1px solid rgba(59, 130, 246, 0.2)">
                    <Button
                      size="sm"
                      colorScheme="blue"
                      variant="solid"
                      w="full"
                      onClick={() => {
                        setIsFocused(false);
                        setHighlightedIndex(-1);
                      }}
                      _hover={{
                        bg: "blue.600",
                        transform: "translateY(-1px)",
                      }}
                      transition="all 0.2s ease"
                    >
                      Done
                    </Button>
                  </Box>
                )}
              </VStack>
            )}
          </Box>
        </Portal>
      )}

      {/* Search Results Count */}
      {value && !isNaturalLanguageQuery(value) && (suggestions.length > 0 || autocompleteSuggestions.length > 0) && (
        <Text fontSize="xs" color="gray.600" mt={1} pl={2}>
          {suggestions.length + autocompleteSuggestions.length} suggestions found
        </Text>
      )}

      {/* Natural Language Processing Results */}
      {value && isNaturalLanguageQuery(value) && showNLPAnalysis && (
        <NLPResultsDisplay
          query={value}
          onAddItems={onAddItems}
          onAddSingleItem={onItemAdd}
          onClose={() => setShowNLPAnalysis(false)}
          selectedItems={selectedItems}
        />
      )}

      {/* Show button to reopen NLP analysis if hidden */}
      {value && isNaturalLanguageQuery(value) && !showNLPAnalysis && (
        <Box textAlign="center" mt={2}>
          <Button
            size="sm"
            colorScheme="blue"
            variant="outline"
            leftIcon={<Icon as={FaBrain} />}
            onClick={() => setShowNLPAnalysis(true)}
          >
            Show Smart Analysis
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default SmartSearchBox;
