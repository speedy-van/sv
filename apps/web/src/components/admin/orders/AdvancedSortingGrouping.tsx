'use client';

import React, { useState } from 'react';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  VStack,
  HStack,
  Text,
  FormControl,
  FormLabel,
  Select,
  Checkbox,
  Radio,
  RadioGroup,
  Stack,
  Badge,
  IconButton,
  useToast,
  Box,
  Input,
} from '@chakra-ui/react';
import {
  FaSort,
  FaLayerGroup,
  FaSave,
  FaTimes,
} from 'react-icons/fa';

export type SortField = 
  | 'scheduledAt'
  | 'createdAt'
  | 'totalGBP'
  | 'status'
  | 'customerName'
  | 'reference'
  | 'priority'
  | 'driverName'
  | 'paymentStatus';

export type SortDirection = 'asc' | 'desc';

export type GroupByField = 
  | 'none'
  | 'status'
  | 'driver'
  | 'scheduledDate'
  | 'customer'
  | 'serviceType'
  | 'paymentStatus'
  | 'urgency'
  | 'route';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
  secondaryField?: SortField;
  secondaryDirection?: SortDirection;
}

export interface GroupByConfig {
  field: GroupByField;
  showCounts?: boolean;
  collapseGroups?: boolean;
}

interface AdvancedSortingGroupingProps {
  currentSort?: SortConfig;
  currentGroupBy?: GroupByConfig;
  onSortChange: (sort: SortConfig) => void;
  onGroupByChange: (groupBy: GroupByConfig) => void;
  onSavePreset?: (name: string, sort: SortConfig, groupBy: GroupByConfig) => void;
  savedPresets?: Array<{ name: string; sort: SortConfig; groupBy: GroupByConfig }>;
  onLoadPreset?: (sort: SortConfig, groupBy: GroupByConfig) => void;
  onDeletePreset?: (name: string) => void;
}

export function AdvancedSortingGrouping({
  currentSort,
  currentGroupBy,
  onSortChange,
  onGroupByChange,
  onSavePreset,
  savedPresets = [],
  onLoadPreset,
  onDeletePreset,
}: AdvancedSortingGroupingProps) {
  const {
    isOpen: isModalOpen,
    onOpen: onModalOpen,
    onClose: onModalClose,
  } = useDisclosure();
  
  const [presetName, setPresetName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const toast = useToast();

  const [localSort, setLocalSort] = useState<SortConfig>(
    currentSort || { field: 'scheduledAt', direction: 'asc' }
  );
  const [localGroupBy, setLocalGroupBy] = useState<GroupByConfig>(
    currentGroupBy || { field: 'none' }
  );

  const handleApply = () => {
    onSortChange(localSort);
    onGroupByChange(localGroupBy);
    onModalClose();
    toast({
      title: 'Sorting & Grouping Applied',
      description: 'Your preferences have been applied',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast({
        title: 'Preset Name Required',
        description: 'Please enter a name for this preset',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (onSavePreset) {
      onSavePreset(presetName.trim(), localSort, localGroupBy);
      toast({
        title: 'Preset Saved',
        description: `Sorting preset "${presetName.trim()}" has been saved`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setPresetName('');
      setShowSaveDialog(false);
    }
  };

  const handleLoadPreset = (preset: { name: string; sort: SortConfig; groupBy: GroupByConfig }) => {
    setLocalSort(preset.sort);
    setLocalGroupBy(preset.groupBy);
    if (onLoadPreset) {
      onLoadPreset(preset.sort, preset.groupBy);
    }
    toast({
      title: 'Preset Loaded',
      description: `Sorting preset "${preset.name}" has been loaded`,
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
        description: `Sorting preset "${name}" has been deleted`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const hasActiveSorting = currentSort && (currentSort.field !== 'scheduledAt' || currentSort.direction !== 'asc');
  const hasActiveGrouping = currentGroupBy && currentGroupBy.field !== 'none';

  return (
    <>
      <Menu>
        <MenuButton
          as={Button}
          leftIcon={<FaSort />}
          variant="outline"
          bg="#111111"
          color="#FFFFFF"
          borderColor="#333333"
          borderWidth="2px"
          borderRadius="lg"
          px={4}
          py={2}
          fontWeight="semibold"
          letterSpacing="0.5px"
          _hover={{ bg: '#1a1a1a', borderColor: '#2563eb' }}
        >
          Sort & Group
          {(hasActiveSorting || hasActiveGrouping) && (
            <Badge ml={2} colorScheme="blue" borderRadius="full" px={2}>
              Active
            </Badge>
          )}
        </MenuButton>
        <MenuList bg="#111111" borderColor="#333333" borderWidth={2}>
          {savedPresets.length > 0 && (
            <>
              {savedPresets.map((preset) => (
                <MenuItem
                  key={preset.name}
                  bg="#111111"
                  color="#FFFFFF"
                  _hover={{ bg: '#1a1a1a' }}
                  onClick={() => handleLoadPreset(preset)}
                >
                  <HStack justify="space-between" w="full">
                    <Text>{preset.name}</Text>
                    {onDeletePreset && (
                      <IconButton
                        aria-label="Delete preset"
                        icon={<FaTimes />}
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
              <MenuDivider borderColor="#333333" />
            </>
          )}
          <MenuItem
            icon={<FaSort />}
            bg="#111111"
            color="#FFFFFF"
            _hover={{ bg: '#1a1a1a' }}
            onClick={onModalOpen}
          >
            Configure Sorting & Grouping
          </MenuItem>
          {onSavePreset && (
            <MenuItem
              icon={<FaSave />}
              bg="#111111"
              color="#FFFFFF"
              _hover={{ bg: '#1a1a1a' }}
              onClick={() => setShowSaveDialog(true)}
            >
              Save Current Settings
            </MenuItem>
          )}
        </MenuList>
      </Menu>

      {/* Configuration Modal */}
      <Modal isOpen={isModalOpen} onClose={onModalClose} size="xl" scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent bg="#000000" borderColor="#333333" borderWidth={2}>
          <ModalHeader color="#FFFFFF" borderBottomWidth={1} borderColor="#333333">
            <HStack spacing={2}>
              <FaSort />
              <Text>Advanced Sorting & Grouping</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="#FFFFFF" />
          
          <ModalBody color="#FFFFFF" py={6}>
            <VStack align="stretch" spacing={6}>
              {/* Primary Sort */}
              <Box>
                <Text fontWeight="bold" mb={3} color="#FFFFFF">
                  Primary Sort
                </Text>
                <VStack align="stretch" spacing={3}>
                  <FormControl>
                    <FormLabel color="#9ca3af" fontSize="sm">Sort By</FormLabel>
                    <Select
                      value={localSort.field}
                      onChange={(e) => setLocalSort({
                        ...localSort,
                        field: e.target.value as SortField,
                      })}
                      bg="#111111"
                      color="#FFFFFF"
                      borderColor="#333333"
                    >
                      <option value="scheduledAt">Scheduled Date</option>
                      <option value="createdAt">Created Date</option>
                      <option value="totalGBP">Total Price</option>
                      <option value="status">Status</option>
                      <option value="customerName">Customer Name</option>
                      <option value="reference">Reference</option>
                      <option value="priority">Priority (Urgency)</option>
                      <option value="driverName">Driver Name</option>
                      <option value="paymentStatus">Payment Status</option>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel color="#9ca3af" fontSize="sm">Direction</FormLabel>
                    <RadioGroup
                      value={localSort.direction}
                      onChange={(value) => setLocalSort({
                        ...localSort,
                        direction: value as SortDirection,
                      })}
                    >
                      <Stack direction="row" spacing={4}>
                        <Radio value="asc" colorScheme="blue">Ascending</Radio>
                        <Radio value="desc" colorScheme="blue">Descending</Radio>
                      </Stack>
                    </RadioGroup>
                  </FormControl>
                </VStack>
              </Box>

              {/* Secondary Sort */}
              <Box>
                <Text fontWeight="bold" mb={3} color="#FFFFFF">
                  Secondary Sort (Optional)
                </Text>
                <VStack align="stretch" spacing={3}>
                  <Checkbox
                    isChecked={!!localSort.secondaryField}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setLocalSort({
                          ...localSort,
                          secondaryField: 'scheduledAt',
                          secondaryDirection: 'asc',
                        });
                      } else {
                        setLocalSort({
                          ...localSort,
                          secondaryField: undefined,
                          secondaryDirection: undefined,
                        });
                      }
                    }}
                    colorScheme="blue"
                  >
                    <Text color="#FFFFFF" fontSize="sm">Enable Secondary Sort</Text>
                  </Checkbox>
                  {localSort.secondaryField && (
                    <>
                      <FormControl>
                        <FormLabel color="#9ca3af" fontSize="sm">Secondary Sort By</FormLabel>
                        <Select
                          value={localSort.secondaryField}
                          onChange={(e) => setLocalSort({
                            ...localSort,
                            secondaryField: e.target.value as SortField,
                          })}
                          bg="#111111"
                          color="#FFFFFF"
                          borderColor="#333333"
                        >
                          <option value="scheduledAt">Scheduled Date</option>
                          <option value="createdAt">Created Date</option>
                          <option value="totalGBP">Total Price</option>
                          <option value="status">Status</option>
                          <option value="customerName">Customer Name</option>
                          <option value="reference">Reference</option>
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel color="#9ca3af" fontSize="sm">Direction</FormLabel>
                        <RadioGroup
                          value={localSort.secondaryDirection || 'asc'}
                          onChange={(value) => setLocalSort({
                            ...localSort,
                            secondaryDirection: value as SortDirection,
                          })}
                        >
                          <Stack direction="row" spacing={4}>
                            <Radio value="asc" colorScheme="blue">Ascending</Radio>
                            <Radio value="desc" colorScheme="blue">Descending</Radio>
                          </Stack>
                        </RadioGroup>
                      </FormControl>
                    </>
                  )}
                </VStack>
              </Box>

              <MenuDivider borderColor="#333333" />

              {/* Grouping */}
              <Box>
                <Text fontWeight="bold" mb={3} color="#FFFFFF">
                  Group By
                </Text>
                <VStack align="stretch" spacing={3}>
                  <FormControl>
                    <FormLabel color="#9ca3af" fontSize="sm">Group Orders By</FormLabel>
                    <Select
                      value={localGroupBy.field}
                      onChange={(e) => setLocalGroupBy({
                        ...localGroupBy,
                        field: e.target.value as GroupByField,
                      })}
                      bg="#111111"
                      color="#FFFFFF"
                      borderColor="#333333"
                    >
                      <option value="none">No Grouping</option>
                      <option value="status">Status</option>
                      <option value="driver">Driver</option>
                      <option value="scheduledDate">Scheduled Date</option>
                      <option value="customer">Customer</option>
                      <option value="serviceType">Service Type</option>
                      <option value="paymentStatus">Payment Status</option>
                      <option value="urgency">Urgency Level</option>
                      <option value="route">Route</option>
                    </Select>
                  </FormControl>
                  {localGroupBy.field !== 'none' && (
                    <>
                      <Checkbox
                        isChecked={localGroupBy.showCounts !== false}
                        onChange={(e) => setLocalGroupBy({
                          ...localGroupBy,
                          showCounts: e.target.checked,
                        })}
                        colorScheme="blue"
                      >
                        <Text color="#FFFFFF" fontSize="sm">Show Counts in Group Headers</Text>
                      </Checkbox>
                      <Checkbox
                        isChecked={localGroupBy.collapseGroups === true}
                        onChange={(e) => setLocalGroupBy({
                          ...localGroupBy,
                          collapseGroups: e.target.checked,
                        })}
                        colorScheme="blue"
                      >
                        <Text color="#FFFFFF" fontSize="sm">Collapse Groups by Default</Text>
                      </Checkbox>
                    </>
                  )}
                </VStack>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter borderTopWidth={1} borderColor="#333333">
            <HStack spacing={3} w="full" justify="space-between">
              <Button
                variant="ghost"
                onClick={() => {
                  setLocalSort({ field: 'scheduledAt', direction: 'asc' });
                  setLocalGroupBy({ field: 'none' });
                }}
                color="#9ca3af"
                _hover={{ color: '#FFFFFF' }}
              >
                Reset
              </Button>
              <HStack>
                <Button
                  variant="outline"
                  onClick={onModalClose}
                  borderColor="#333333"
                  color="#FFFFFF"
                  _hover={{ bg: '#1a1a1a' }}
                >
                  Cancel
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={handleApply}
                  bg="#2563eb"
                  color="#FFFFFF"
                  _hover={{ bg: '#1d4ed8' }}
                >
                  Apply
                </Button>
              </HStack>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Save Preset Dialog */}
      {showSaveDialog && (
        <Modal isOpen={showSaveDialog} onClose={() => setShowSaveDialog(false)} size="sm">
          <ModalOverlay bg="blackAlpha.800" />
          <ModalContent bg="#000000" borderColor="#333333" borderWidth={2}>
            <ModalHeader color="#FFFFFF">Save Sorting Preset</ModalHeader>
            <ModalCloseButton color="#FFFFFF" />
            <ModalBody>
              <FormControl>
                <FormLabel color="#9ca3af">Preset Name</FormLabel>
                <Input
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="e.g., Urgent by Date"
                  bg="#111111"
                  color="#FFFFFF"
                  borderColor="#333333"
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
                  borderColor="#333333"
                  color="#FFFFFF"
                >
                  Cancel
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={handleSavePreset}
                  bg="#2563eb"
                  color="#FFFFFF"
                >
                  Save
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}

