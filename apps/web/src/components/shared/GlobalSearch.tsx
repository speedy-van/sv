'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  List,
  ListItem,
  Text,
  Flex,
  Badge,
  Spinner,
  useColorModeValue,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  useDisclosure,
} from '@chakra-ui/react';
import { FiSearch, FiX, FiMapPin } from 'react-icons/fi';

interface Place {
  name: string;
  slug: string;
  type?: string;
  region: string;
  population?: number;
}

interface GlobalSearchProps {
  variant?: 'header' | 'modal' | 'inline';
  placeholder?: string;
}

export default function GlobalSearch({ variant = 'header', placeholder = 'Search city, town or village...' }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<Place[]>([]);
  const [totalPlaces, setTotalPlaces] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  // Search via API
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const searchPlaces = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/places/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.places || []);
        if (data.total) setTotalPlaces(data.total);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      }
      setIsLoading(false);
    };

    const timer = setTimeout(searchPlaces, 150);
    return () => clearTimeout(timer);
  }, [query]);

  // Get total on mount
  useEffect(() => {
    fetch('/api/places/search?q=')
      .then(res => res.json())
      .then(data => setTotalPlaces(data.total || 787))
      .catch(() => setTotalPlaces(787));
  }, []);

  const handleSelect = useCallback((slug: string) => {
    setQuery('');
    setIsOpen(false);
    onModalClose();
    router.push(`/uk/${slug}`);
  }, [router, onModalClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, slug?: string) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      onModalClose();
    }
    if (e.key === 'Enter' && slug) {
      handleSelect(slug);
    }
  }, [handleSelect, onModalClose]);

  // Keyboard shortcut to open search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (variant === 'header') {
          onModalOpen();
          setTimeout(() => inputRef.current?.focus(), 100);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [variant, onModalOpen]);

  const SearchInput = (
    <Box position="relative" w="100%">
      <InputGroup size={variant === 'modal' ? 'lg' : 'md'}>
        <InputLeftElement pointerEvents="none">
          <FiSearch color={mutedColor} />
        </InputLeftElement>
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onKeyDown={(e) => handleKeyDown(e)}
          placeholder={placeholder}
          bg={bgColor}
          borderColor={borderColor}
          borderRadius="full"
          _focus={{
            borderColor: 'cyan.400',
            boxShadow: '0 0 0 1px var(--chakra-colors-cyan-400)',
          }}
          _placeholder={{ color: mutedColor }}
        />
        {query && (
          <InputRightElement>
            <IconButton
              aria-label="Clear search"
              icon={<FiX />}
              size="xs"
              variant="ghost"
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
            />
          </InputRightElement>
        )}
      </InputGroup>

      {/* Results dropdown */}
      {isOpen && (query.length >= 2 || results.length > 0) && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          mt={2}
          bg={bgColor}
          borderRadius="xl"
          boxShadow="xl"
          border="1px solid"
          borderColor={borderColor}
          zIndex={9999}
          maxH="400px"
          overflowY="auto"
        >
          {isLoading ? (
            <Flex justify="center" align="center" py={4}>
              <Spinner size="sm" color="cyan.500" mr={2} />
              <Text color={mutedColor} fontSize="sm">Searching...</Text>
            </Flex>
          ) : results.length > 0 ? (
            <List spacing={0}>
              {results.map((place) => (
                <ListItem
                  key={place.slug}
                  px={4}
                  py={3}
                  cursor="pointer"
                  _hover={{ bg: hoverBg }}
                  onClick={() => handleSelect(place.slug)}
                  borderBottom="1px solid"
                  borderColor={borderColor}
                  _last={{ borderBottom: 'none' }}
                >
                  <Flex justify="space-between" align="center">
                    <Flex align="center" gap={2}>
                      <FiMapPin color="var(--chakra-colors-cyan-500)" />
                      <Box>
                        <Text fontWeight="600" color={textColor}>
                          {place.name}
                        </Text>
                        <Text fontSize="xs" color={mutedColor}>
                          {place.region}
                        </Text>
                      </Box>
                    </Flex>
                    <Badge
                      colorScheme={place.type === 'city' ? 'green' : place.type === 'town' ? 'blue' : 'gray'}
                      fontSize="xs"
                      textTransform="capitalize"
                    >
                      {place.type || 'place'}
                    </Badge>
                  </Flex>
                </ListItem>
              ))}
            </List>
          ) : query.length >= 2 ? (
            <Box py={4} textAlign="center">
              <Text color={mutedColor} fontSize="sm">
                No locations found for "{query}"
              </Text>
            </Box>
          ) : null}
        </Box>
      )}
    </Box>
  );

  // Header variant - show button that opens modal
  if (variant === 'header') {
    return (
      <>
        <IconButton
          aria-label="Search locations"
          icon={<FiSearch />}
          variant="ghost"
          size="md"
          onClick={onModalOpen}
          _hover={{ bg: 'cyan.50', color: 'cyan.600' }}
        />
        
        <Modal isOpen={isModalOpen} onClose={onModalClose} size="xl" isCentered>
          <ModalOverlay backdropFilter="blur(4px)" />
          <ModalContent mx={4} bg="transparent" boxShadow="none">
            <ModalBody p={0}>
              <Box bg={bgColor} borderRadius="2xl" p={4} boxShadow="2xl">
                <Text fontSize="sm" color={mutedColor} mb={3} textAlign="center">
                  Search {totalPlaces.toLocaleString()} UK locations • Press ESC to close
                </Text>
                {SearchInput}
              </Box>
            </ModalBody>
          </ModalContent>
        </Modal>
      </>
    );
  }

  // Inline or modal variant - show full search
  return SearchInput;
}
