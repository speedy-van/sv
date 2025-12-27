'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  VStack,
  HStack,
  Text,
  Badge,
  IconButton,
  useColorModeValue,
  Menu,
  MenuList,
  MenuItem,
  useOutsideClick,
} from '@chakra-ui/react';
import { FiSearch, FiX, FiClock } from 'react-icons/fi';

interface SearchResult {
  id: string;
  type: 'order' | 'route' | 'customer' | 'driver';
  title: string;
  subtitle?: string;
  reference?: string;
  status?: string;
}

interface AdvancedSearchProps {
  onSearch: (query: string) => void;
  onSelectResult?: (result: SearchResult) => void;
  placeholder?: string;
  showRecentSearches?: boolean;
  maxRecentSearches?: number;
}

export function AdvancedSearch({
  onSearch,
  onSelectResult,
  placeholder = 'Search orders, routes, customers...',
  showRecentSearches = true,
  maxRecentSearches = 5,
}: AdvancedSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const bgColor = useColorModeValue('#111111', '#111111');
  const textColor = useColorModeValue('#FFFFFF', '#FFFFFF');
  const borderColor = useColorModeValue('#333333', '#333333');
  const secondaryTextColor = useColorModeValue('#9ca3af', '#9ca3af');

  useOutsideClick({
    ref: searchRef,
    handler: () => setShowResults(false),
  });

  useEffect(() => {
    // Load recent searches from localStorage
    if (showRecentSearches && typeof window !== 'undefined') {
      const stored = localStorage.getItem('admin_recent_searches');
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored));
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }, [showRecentSearches]);

  useEffect(() => {
    if (query.trim().length >= 2) {
      performSearch(query);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setIsSearching(true);
    setShowResults(true);

    try {
      // Search orders
      const ordersRes = await fetch(`/api/admin/orders?search=${encodeURIComponent(searchQuery)}&limit=5`);
      const ordersData = await ordersRes.ok ? await ordersRes.json() : { orders: [] };

      // Search routes
      const routesRes = await fetch(`/api/admin/routes?search=${encodeURIComponent(searchQuery)}&limit=5`);
      const routesData = routesRes.ok ? await routesRes.json() : { routes: [] };

      const searchResults: SearchResult[] = [];

      // Add order results
      if (ordersData.orders) {
        ordersData.orders.forEach((order: any) => {
          searchResults.push({
            id: order.id,
            type: 'order',
            title: order.reference || `Order ${order.id}`,
            subtitle: order.customerName || order.customerEmail,
            reference: order.reference,
            status: order.status,
          });
        });
      }

      // Add route results
      if (routesData.routes) {
        routesData.routes.forEach((route: any) => {
          searchResults.push({
            id: route.id,
            type: 'route',
            title: route.reference || `Route ${route.id}`,
            subtitle: `${route.totalDrops || 0} drops`,
            reference: route.reference,
            status: route.status,
          });
        });
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch(value);

    // Save to recent searches
    if (value.trim() && showRecentSearches) {
      const updated = [value, ...recentSearches.filter(s => s !== value)].slice(0, maxRecentSearches);
      setRecentSearches(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_recent_searches', JSON.stringify(updated));
      }
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    if (onSelectResult) {
      onSelectResult(result);
    }
    setQuery('');
    setShowResults(false);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    onSearch('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'gray';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('completed')) return 'green';
    if (statusLower.includes('cancelled')) return 'red';
    if (statusLower.includes('pending')) return 'yellow';
    if (statusLower.includes('progress')) return 'blue';
    return 'gray';
  };

  return (
    <Box ref={searchRef} position="relative" w="100%">
      <InputGroup>
        <InputLeftElement pointerEvents="none">
          <FiSearch color={secondaryTextColor} />
        </InputLeftElement>
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2 || recentSearches.length > 0) {
              setShowResults(true);
            }
          }}
          placeholder={placeholder}
          bg={bgColor}
          borderColor={borderColor}
          color={textColor}
          _placeholder={{ color: secondaryTextColor }}
          _focus={{ borderColor: '#2563eb', boxShadow: '0 0 0 1px #2563eb' }}
        />
        {query && (
          <InputRightElement>
            <IconButton
              aria-label="Clear search"
              icon={<FiX />}
              size="sm"
              variant="ghost"
              onClick={handleClear}
              color={secondaryTextColor}
              _hover={{ color: textColor }}
            />
          </InputRightElement>
        )}
      </InputGroup>

      {showResults && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          mt={1}
          bg={bgColor}
          borderWidth={1}
          borderColor={borderColor}
          borderRadius="md"
          boxShadow="0 4px 16px rgba(0, 0, 0, 0.4)"
          zIndex={1000}
          maxH="400px"
          overflowY="auto"
        >
          {isSearching ? (
            <Box p={4} textAlign="center">
              <Text color={secondaryTextColor}>Searching...</Text>
            </Box>
          ) : results.length > 0 ? (
            <VStack align="stretch" spacing={0}>
              {results.map((result) => (
                <Box
                  key={`${result.type}-${result.id}`}
                  p={3}
                  _hover={{ bg: '#1a1a1a' }}
                  cursor="pointer"
                  onClick={() => handleSelectResult(result)}
                  borderBottomWidth={1}
                  borderBottomColor={borderColor}
                >
                  <HStack justify="space-between">
                    <VStack align="start" spacing={0} flex={1}>
                      <HStack spacing={2}>
                        <Text fontWeight="bold" color={textColor} fontSize="sm">
                          {result.title}
                        </Text>
                        <Badge
                          colorScheme={result.type === 'order' ? 'blue' : 'purple'}
                          size="sm"
                        >
                          {result.type}
                        </Badge>
                        {result.status && (
                          <Badge colorScheme={getStatusColor(result.status)} size="sm">
                            {result.status}
                          </Badge>
                        )}
                      </HStack>
                      {result.subtitle && (
                        <Text fontSize="xs" color={secondaryTextColor} mt={1}>
                          {result.subtitle}
                        </Text>
                      )}
                    </VStack>
                  </HStack>
                </Box>
              ))}
            </VStack>
          ) : query.trim().length >= 2 ? (
            <Box p={4} textAlign="center">
              <Text color={secondaryTextColor}>No results found</Text>
            </Box>
          ) : showRecentSearches && recentSearches.length > 0 ? (
            <VStack align="stretch" spacing={0}>
              <Box p={2} borderBottomWidth={1} borderBottomColor={borderColor}>
                <Text fontSize="xs" color={secondaryTextColor} textTransform="uppercase">
                  Recent Searches
                </Text>
              </Box>
              {recentSearches.map((search, index) => (
                <Box
                  key={index}
                  p={3}
                  _hover={{ bg: '#1a1a1a' }}
                  cursor="pointer"
                  onClick={() => handleSearch(search)}
                  borderBottomWidth={index < recentSearches.length - 1 ? 1 : 0}
                  borderBottomColor={borderColor}
                >
                  <HStack spacing={2}>
                    <FiClock color={secondaryTextColor} />
                    <Text color={textColor} fontSize="sm">
                      {search}
                    </Text>
                  </HStack>
                </Box>
              ))}
            </VStack>
          ) : null}
        </Box>
      )}
    </Box>
  );
}

