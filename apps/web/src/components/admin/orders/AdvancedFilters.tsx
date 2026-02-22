'use client';

import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Select,
  Checkbox,
  CheckboxGroup,
  NumberInput,
  NumberInputField,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Divider,
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
} from '@chakra-ui/react';
import {
  FaFilter,
  FaSave,
  FaTrash,
  FaTimes,
} from 'react-icons/fa';
import { format } from 'date-fns';

export interface AdvancedFilterState {
  // Date Filters
  scheduledDateRange?: { start: Date | null; end: Date | null };
  createdAtRange?: { start: Date | null; end: Date | null };
  paymentDateRange?: { start: Date | null; end: Date | null };
  
  // Price Filters
  priceRange?: { min: number | null; max: number | null };
  unpaidOnly?: boolean;
  partiallyPaid?: boolean;
  
  // Location Filters
  pickupPostcode?: string[];
  dropoffPostcode?: string[];
  serviceArea?: string[];
  
  // Customer Filters
  customerType?: 'new' | 'returning' | 'all';
  hasNotes?: boolean;
  
  // Journey Filters
  hasReturnJourney?: boolean;
  hasAdditionalJourney?: boolean;
  totalSegments?: { min: number | null; max: number | null };
  
  // Driver Filters
  driverStatus?: 'assigned' | 'unassigned' | 'all';
  
  // Route Filters
  inRoute?: boolean;
  multiDropEligible?: boolean;
  
  // Status Filters
  status?: string[];
  urgency?: 'low' | 'medium' | 'high' | 'critical' | 'all';
  
  // Capacity Filters
  requiresMultipleVans?: boolean;
  highVolume?: boolean;
}

interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: AdvancedFilterState) => void;
  onSave?: (name: string, filters: AdvancedFilterState) => void;
  savedPresets?: Array<{ name: string; filters: AdvancedFilterState }>;
  onLoadPreset?: (filters: AdvancedFilterState) => void;
  onDeletePreset?: (name: string) => void;
  currentFilters?: AdvancedFilterState;
}

export function AdvancedFilters({
  isOpen,
  onClose,
  onApply,
  onSave,
  savedPresets = [],
  onLoadPreset,
  onDeletePreset,
  currentFilters,
}: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<AdvancedFilterState>(currentFilters || {});
  const [presetName, setPresetName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const toast = useToast();

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({});
    toast({
      title: 'Filters Reset',
      description: 'All filters have been cleared',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast({
        title: 'Preset Name Required',
        description: 'Please enter a name for this filter preset',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (onSave) {
      onSave(presetName.trim(), filters);
      toast({
        title: 'Preset Saved',
        description: `Filter preset "${presetName.trim()}" has been saved`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setPresetName('');
      setShowSaveDialog(false);
    }
  };

  const handleLoadPreset = (preset: { name: string; filters: AdvancedFilterState }) => {
    setFilters(preset.filters);
    if (onLoadPreset) {
      onLoadPreset(preset.filters);
    }
    toast({
      title: 'Preset Loaded',
      description: `Filter preset "${preset.name}" has been loaded`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleDeletePreset = (name: string) => {
    if (onDeletePreset) {
      onDeletePreset(name);
      toast({
        title: 'Preset Deleted',
        description: `Filter preset "${name}" has been deleted`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const activeFiltersCount = Object.values(filters).filter(v => {
    if (v === null || v === undefined) return false;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') return v !== 'all' && v !== '';
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'object') {
      return Object.values(v).some(val => val !== null && val !== undefined && val !== '');
    }
    return true;
  }).length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent bg="#0B1020" borderColor="#2A3A5E" borderWidth={2}>
        <ModalHeader color="#F5F8FF" borderBottomWidth={1} borderColor="#2A3A5E">
          <HStack justify="space-between">
            <HStack spacing={2}>
              <FaFilter color="#F5F8FF" />
              <Text>Advanced Filters</Text>
              {activeFiltersCount > 0 && (
                <Badge colorScheme="blue" borderRadius="full">
                  {activeFiltersCount} active
                </Badge>
              )}
            </HStack>
            {savedPresets.length > 0 && (
              <Menu>
                <MenuButton
                  as={Button}
                  size="sm"
                  variant="outline"
                  colorScheme="blue"
                  leftIcon={<FaSave />}
                >
                  Load Preset
                </MenuButton>
                <MenuList bg="#121A2B" borderColor="#2A3A5E">
                  {savedPresets.map((preset) => (
                    <MenuItem
                      key={preset.name}
                      bg="#121A2B"
                      color="#F5F8FF"
                      _hover={{ bg: '#18233A' }}
                      onClick={() => handleLoadPreset(preset)}
                    >
                      <HStack justify="space-between" w="full">
                        <Text>{preset.name}</Text>
                        {onDeletePreset && (
                          <IconButton
                            aria-label="Delete preset"
                            icon={<FaTrash />}
                            size="xs"
                            colorScheme="red"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePreset(preset.name);
                            }}
                          />
                        )}
                      </HStack>
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>
            )}
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="#F5F8FF" />
        
        <ModalBody color="#F5F8FF" py={6}>
          <VStack align="stretch" spacing={6}>
            {/* Date Filters */}
            <Box>
              <Text fontWeight="bold" mb={3} color="#F5F8FF">
                Date Filters
              </Text>
              <VStack align="stretch" spacing={3}>
                <FormControl>
                  <FormLabel color="#9ca3af" fontSize="sm">Scheduled Date Range</FormLabel>
                  <HStack>
                    <Input
                      type="date"
                      value={filters.scheduledDateRange?.start ? format(filters.scheduledDateRange.start, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setFilters({
                        ...filters,
                        scheduledDateRange: {
                          start: e.target.value ? new Date(e.target.value) : null,
                          end: filters.scheduledDateRange?.end || null,
                        },
                      })}
                      bg="#121A2B"
                      color="#F5F8FF"
                      borderColor="#2A3A5E"
                    />
                    <Text color="#9ca3af">to</Text>
                    <Input
                      type="date"
                      value={filters.scheduledDateRange?.end ? format(filters.scheduledDateRange.end, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setFilters({
                        ...filters,
                        scheduledDateRange: {
                          start: filters.scheduledDateRange?.start || null,
                          end: e.target.value ? new Date(e.target.value) : null,
                        },
                      })}
                      bg="#121A2B"
                      color="#F5F8FF"
                      borderColor="#2A3A5E"
                    />
                  </HStack>
                </FormControl>
              </VStack>
            </Box>

            <Divider borderColor="#2A3A5E" />

            {/* Price Filters */}
            <Box>
              <Text fontWeight="bold" mb={3} color="#F5F8FF">
                Price Filters
              </Text>
              <VStack align="stretch" spacing={3}>
                <HStack>
                  <FormControl flex={1}>
                    <FormLabel color="#9ca3af" fontSize="sm">Min Price (£)</FormLabel>
                    <NumberInput
                      value={filters.priceRange?.min ? (filters.priceRange.min / 100).toFixed(2) : ''}
                      onChange={(_, value) => setFilters({
                        ...filters,
                        priceRange: {
                          min: value ? Math.round(value * 100) : null,
                          max: filters.priceRange?.max || null,
                        },
                      })}
                    >
                      <NumberInputField bg="#121A2B" color="#F5F8FF" borderColor="#2A3A5E" />
                    </NumberInput>
                  </FormControl>
                  <FormControl flex={1}>
                    <FormLabel color="#9ca3af" fontSize="sm">Max Price (£)</FormLabel>
                    <NumberInput
                      value={filters.priceRange?.max ? (filters.priceRange.max / 100).toFixed(2) : ''}
                      onChange={(_, value) => setFilters({
                        ...filters,
                        priceRange: {
                          min: filters.priceRange?.min || null,
                          max: value ? Math.round(value * 100) : null,
                        },
                      })}
                    >
                      <NumberInputField bg="#121A2B" color="#F5F8FF" borderColor="#2A3A5E" />
                    </NumberInput>
                  </FormControl>
                </HStack>
                <Checkbox
                  isChecked={filters.unpaidOnly}
                  onChange={(e) => setFilters({ ...filters, unpaidOnly: e.target.checked })}
                  colorScheme="orange"
                >
                  <Text color="#F5F8FF" fontSize="sm">Unpaid Orders Only</Text>
                </Checkbox>
                <Checkbox
                  isChecked={filters.partiallyPaid}
                  onChange={(e) => setFilters({ ...filters, partiallyPaid: e.target.checked })}
                  colorScheme="yellow"
                >
                  <Text color="#F5F8FF" fontSize="sm">Partially Paid</Text>
                </Checkbox>
              </VStack>
            </Box>

            <Divider borderColor="#2A3A5E" />

            {/* Journey Filters */}
            <Box>
              <Text fontWeight="bold" mb={3} color="#F5F8FF">
                Journey Filters
              </Text>
              <VStack align="stretch" spacing={2}>
                <Checkbox
                  isChecked={filters.hasReturnJourney}
                  onChange={(e) => setFilters({ ...filters, hasReturnJourney: e.target.checked })}
                  colorScheme="green"
                >
                  <Text color="#F5F8FF" fontSize="sm">Has Return Journey</Text>
                </Checkbox>
                <Checkbox
                  isChecked={filters.hasAdditionalJourney}
                  onChange={(e) => setFilters({ ...filters, hasAdditionalJourney: e.target.checked })}
                  colorScheme="cyan"
                >
                  <Text color="#F5F8FF" fontSize="sm">Has Additional Journey</Text>
                </Checkbox>
                <HStack>
                  <FormControl flex={1}>
                    <FormLabel color="#9ca3af" fontSize="sm">Min Segments</FormLabel>
                    <NumberInput
                      value={filters.totalSegments?.min || ''}
                      onChange={(_, value) => setFilters({
                        ...filters,
                        totalSegments: {
                          min: value || null,
                          max: filters.totalSegments?.max || null,
                        },
                      })}
                    >
                      <NumberInputField bg="#121A2B" color="#F5F8FF" borderColor="#2A3A5E" />
                    </NumberInput>
                  </FormControl>
                  <FormControl flex={1}>
                    <FormLabel color="#9ca3af" fontSize="sm">Max Segments</FormLabel>
                    <NumberInput
                      value={filters.totalSegments?.max || ''}
                      onChange={(_, value) => setFilters({
                        ...filters,
                        totalSegments: {
                          min: filters.totalSegments?.min || null,
                          max: value || null,
                        },
                      })}
                    >
                      <NumberInputField bg="#121A2B" color="#F5F8FF" borderColor="#2A3A5E" />
                    </NumberInput>
                  </FormControl>
                </HStack>
              </VStack>
            </Box>

            <Divider borderColor="#2A3A5E" />

            {/* Driver Filters */}
            <Box>
              <Text fontWeight="bold" mb={3} color="#F5F8FF">
                Driver Filters
              </Text>
              <FormControl>
                <FormLabel color="#9ca3af" fontSize="sm">Driver Status</FormLabel>
                <Select
                  value={filters.driverStatus || 'all'}
                  onChange={(e) => setFilters({
                    ...filters,
                    driverStatus: e.target.value as 'assigned' | 'unassigned' | 'all',
                  })}
                  bg="#121A2B"
                  color="#F5F8FF"
                  borderColor="#2A3A5E"
                >
                  <option value="all">All</option>
                  <option value="assigned">Assigned</option>
                  <option value="unassigned">Unassigned</option>
                </Select>
              </FormControl>
            </Box>

            <Divider borderColor="#2A3A5E" />

            {/* Status Filters */}
            <Box>
              <Text fontWeight="bold" mb={3} color="#F5F8FF">
                Status Filters
              </Text>
              <FormControl>
                <FormLabel color="#9ca3af" fontSize="sm">Urgency Level</FormLabel>
                <Select
                  value={filters.urgency || 'all'}
                  onChange={(e) => setFilters({
                    ...filters,
                    urgency: e.target.value as 'low' | 'medium' | 'high' | 'critical' | 'all',
                  })}
                  bg="#121A2B"
                  color="#F5F8FF"
                  borderColor="#2A3A5E"
                >
                  <option value="all">All</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </Select>
              </FormControl>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter borderTopWidth={1} borderColor="#2A3A5E">
          <HStack spacing={3} w="full" justify="space-between">
            <HStack>
              <Button
                variant="ghost"
                onClick={handleReset}
                color="#9ca3af"
                _hover={{ color: '#F5F8FF' }}
              >
                Reset
              </Button>
              {onSave && (
                <Button
                  leftIcon={<FaSave />}
                  variant="outline"
                  colorScheme="blue"
                  onClick={() => setShowSaveDialog(true)}
                >
                  Save Preset
                </Button>
              )}
            </HStack>
            <HStack>
              <Button
                variant="outline"
                onClick={onClose}
                borderColor="#2A3A5E"
                color="#F5F8FF"
                _hover={{ bg: '#18233A' }}
              >
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleApply}
                bg="#2563eb"
                color="#F5F8FF"
                _hover={{ bg: '#1d4ed8' }}
              >
                Apply Filters
              </Button>
            </HStack>
          </HStack>
        </ModalFooter>
      </ModalContent>

      {/* Save Preset Dialog */}
      {showSaveDialog && (
        <Modal isOpen={showSaveDialog} onClose={() => setShowSaveDialog(false)} size="sm">
          <ModalOverlay bg="blackAlpha.800" />
          <ModalContent bg="#0B1020" borderColor="#2A3A5E" borderWidth={2}>
            <ModalHeader color="#F5F8FF">Save Filter Preset</ModalHeader>
            <ModalCloseButton color="#F5F8FF" />
            <ModalBody>
              <FormControl>
                <FormLabel color="#9ca3af">Preset Name</FormLabel>
                <Input
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="e.g., Urgent Unpaid Orders"
                  bg="#121A2B"
                  color="#F5F8FF"
                  borderColor="#2A3A5E"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSavePreset();
                    }
                  }}
                />
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <HStack>
                <Button
                  variant="outline"
                  onClick={() => setShowSaveDialog(false)}
                  borderColor="#2A3A5E"
                  color="#F5F8FF"
                >
                  Cancel
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={handleSavePreset}
                  bg="#2563eb"
                  color="#F5F8FF"
                >
                  Save
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Modal>
  );
}

