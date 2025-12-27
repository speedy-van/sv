'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Input,
  Textarea,
  useDisclosure,
  useToast,
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  useColorModeValue,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import {
  FiSave,
  FiTrash2,
  FiEdit2,
  FiStar,
  FiMoreVertical,
  FiDownload,
  FiUpload,
  FiEye,
} from 'react-icons/fi';
import { ViewsStorage, SavedFilter, CustomView } from '@/lib/storage/views-storage';
import { format } from 'date-fns';

interface CustomViewsManagerProps {
  currentFilters?: Record<string, any>;
  currentSorting?: { field: string; direction: 'asc' | 'desc' };
  currentGrouping?: { field: string; enabled: boolean };
  onLoadFilter?: (filter: SavedFilter) => void;
  onLoadView?: (view: CustomView) => void;
  onSaveAsView?: (view: Omit<CustomView, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function CustomViewsManager({
  currentFilters,
  currentSorting,
  currentGrouping,
  onLoadFilter,
  onLoadView,
  onSaveAsView,
}: CustomViewsManagerProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [customViews, setCustomViews] = useState<CustomView[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<SavedFilter | null>(null);
  const [selectedView, setSelectedView] = useState<CustomView | null>(null);
  
  const {
    isOpen: isFilterModalOpen,
    onOpen: onFilterModalOpen,
    onClose: onFilterModalClose,
  } = useDisclosure();
  const {
    isOpen: isViewModalOpen,
    onOpen: onViewModalOpen,
    onClose: onViewModalClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteModalOpen,
    onOpen: onDeleteModalOpen,
    onClose: onDeleteModalClose,
  } = useDisclosure();

  const [filterName, setFilterName] = useState('');
  const [filterDescription, setFilterDescription] = useState('');
  const [viewName, setViewName] = useState('');
  const [viewDescription, setViewDescription] = useState('');
  const [itemToDelete, setItemToDelete] = useState<{ type: 'filter' | 'view'; id: string } | null>(null);

  const toast = useToast();
  const cardBg = useColorModeValue('#111111', '#111111');
  const textColor = useColorModeValue('#FFFFFF', '#FFFFFF');
  const borderColor = useColorModeValue('#333333', '#333333');
  const secondaryTextColor = useColorModeValue('#9ca3af', '#9ca3af');
  const bgColor = useColorModeValue('#1a1a1a', '#1a1a1a');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setSavedFilters(ViewsStorage.getFilters());
    setCustomViews(ViewsStorage.getViews());
  };

  const handleSaveFilter = () => {
    if (!filterName.trim()) {
      toast({
        title: 'Error',
        description: 'Filter name is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!currentFilters) {
      toast({
        title: 'Error',
        description: 'No filters to save',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const filter = ViewsStorage.saveFilter({
      name: filterName,
      description: filterDescription || undefined,
      filters: currentFilters,
    });

    toast({
      title: 'Success',
      description: 'Filter saved successfully',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });

    setFilterName('');
    setFilterDescription('');
    onFilterModalClose();
    loadData();
  };

  const handleSaveView = () => {
    if (!viewName.trim()) {
      toast({
        title: 'Error',
        description: 'View name is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!currentFilters) {
      toast({
        title: 'Error',
        description: 'No filters to save',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const filter = ViewsStorage.saveFilter({
      name: `${viewName} - Filter`,
      filters: currentFilters,
    });

    const view = ViewsStorage.saveView({
      name: viewName,
      description: viewDescription || undefined,
      filters: filter,
      sorting: currentSorting,
      grouping: currentGrouping,
    });

    toast({
      title: 'Success',
      description: 'View saved successfully',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });

    setViewName('');
    setViewDescription('');
    onViewModalClose();
    loadData();

    if (onSaveAsView) {
      onSaveAsView(view);
    }
  };

  const handleLoadFilter = (filter: SavedFilter) => {
    if (onLoadFilter) {
      onLoadFilter(filter);
    }
    toast({
      title: 'Filter Loaded',
      description: `Loaded filter: ${filter.name}`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleLoadView = (view: CustomView) => {
    if (onLoadView) {
      onLoadView(view);
    }
    toast({
      title: 'View Loaded',
      description: `Loaded view: ${view.name}`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleDelete = () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'filter') {
      ViewsStorage.deleteFilter(itemToDelete.id);
    } else {
      ViewsStorage.deleteView(itemToDelete.id);
    }

    toast({
      title: 'Deleted',
      description: `${itemToDelete.type === 'filter' ? 'Filter' : 'View'} deleted successfully`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });

    setItemToDelete(null);
    onDeleteModalClose();
    loadData();
  };

  const handleSetDefault = (type: 'filter' | 'view', id: string) => {
    if (type === 'filter') {
      ViewsStorage.setDefaultFilter(id);
    } else {
      ViewsStorage.setDefaultView(id);
    }

    toast({
      title: 'Default Set',
      description: `${type === 'filter' ? 'Filter' : 'View'} set as default`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });

    loadData();
  };

  const handleExport = (type: 'filter' | 'view') => {
    const data = type === 'filter' ? ViewsStorage.exportFilters() : ViewsStorage.exportViews();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin_${type}s_${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Exported',
      description: `${type === 'filter' ? 'Filters' : 'Views'} exported successfully`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleImport = (type: 'filter' | 'view', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const success = type === 'filter'
        ? ViewsStorage.importFilters(content)
        : ViewsStorage.importViews(content);

      if (success) {
        toast({
          title: 'Imported',
          description: `${type === 'filter' ? 'Filters' : 'Views'} imported successfully`,
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
        loadData();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to import. Please check the file format.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <VStack align="stretch" spacing={4}>
      {/* Action Buttons */}
      <HStack spacing={2}>
        <Button
          leftIcon={<FiSave />}
          onClick={onFilterModalOpen}
          size="sm"
          bg="#2563eb"
          color="#FFFFFF"
          _hover={{ bg: '#1d4ed8' }}
        >
          Save Filter
        </Button>
        <Button
          leftIcon={<FiEye />}
          onClick={onViewModalOpen}
          size="sm"
          bg="#9333ea"
          color="#FFFFFF"
          _hover={{ bg: '#7c3aed' }}
        >
          Save View
        </Button>
      </HStack>

      {/* Saved Filters */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
        <CardHeader>
          <HStack justify="space-between">
            <Text fontWeight="bold" fontSize="md" color={textColor}>
              Saved Filters ({savedFilters.length})
            </Text>
            <HStack spacing={2}>
              <Button
                size="xs"
                leftIcon={<FiDownload />}
                onClick={() => handleExport('filter')}
                variant="ghost"
                color={textColor}
              >
                Export
              </Button>
              <label>
                <Button
                  as="span"
                  size="xs"
                  leftIcon={<FiUpload />}
                  variant="ghost"
                  color={textColor}
                >
                  Import
                </Button>
                <input
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={(e) => handleImport('filter', e)}
                />
              </label>
            </HStack>
          </HStack>
        </CardHeader>
        <CardBody>
          {savedFilters.length === 0 ? (
            <Alert status="info" bg="rgba(37, 99, 235, 0.1)" borderColor="#2563eb" borderWidth={1}>
              <AlertIcon color="#2563eb" />
              <Text fontSize="sm" color="#FFFFFF">
                No saved filters. Save your current filters to get started.
              </Text>
            </Alert>
          ) : (
            <VStack align="stretch" spacing={2}>
              {savedFilters.map((filter) => (
                <HStack
                  key={filter.id}
                  p={3}
                  bg="#1a1a1a"
                  borderRadius="md"
                  borderWidth={1}
                  borderColor={borderColor}
                  justify="space-between"
                >
                  <VStack align="start" spacing={1} flex={1}>
                    <HStack>
                      <Text fontWeight="bold" color={textColor}>
                        {filter.name}
                      </Text>
                      {filter.isDefault && (
                        <Badge colorScheme="yellow" size="sm">Default</Badge>
                      )}
                    </HStack>
                    {filter.description && (
                      <Text fontSize="xs" color={secondaryTextColor}>
                        {filter.description}
                      </Text>
                    )}
                    <Text fontSize="xs" color={secondaryTextColor}>
                      {format(new Date(filter.updatedAt), 'dd MMM yyyy')}
                    </Text>
                  </VStack>
                  <HStack spacing={1}>
                    <Button
                      size="sm"
                      onClick={() => handleLoadFilter(filter)}
                      bg="#10b981"
                      color="#FFFFFF"
                      _hover={{ bg: '#059669' }}
                    >
                      Load
                    </Button>
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<FiMoreVertical />}
                        variant="ghost"
                        size="sm"
                        color={textColor}
                      />
                      <MenuList bg={cardBg} borderColor={borderColor}>
                        <MenuItem
                          icon={<FiStar />}
                          onClick={() => handleSetDefault('filter', filter.id)}
                          bg={cardBg}
                          color={textColor}
                          _hover={{ bg: '#1a1a1a' }}
                        >
                          Set as Default
                        </MenuItem>
                        <MenuItem
                          icon={<FiTrash2 />}
                          onClick={() => {
                            setItemToDelete({ type: 'filter', id: filter.id });
                            onDeleteModalOpen();
                          }}
                          bg={cardBg}
                          color="#ef4444"
                          _hover={{ bg: '#1a1a1a' }}
                        >
                          Delete
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </HStack>
                </HStack>
              ))}
            </VStack>
          )}
        </CardBody>
      </Card>

      {/* Custom Views */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
        <CardHeader>
          <HStack justify="space-between">
            <Text fontWeight="bold" fontSize="md" color={textColor}>
              Custom Views ({customViews.length})
            </Text>
            <HStack spacing={2}>
              <Button
                size="xs"
                leftIcon={<FiDownload />}
                onClick={() => handleExport('view')}
                variant="ghost"
                color={textColor}
              >
                Export
              </Button>
              <label>
                <Button
                  as="span"
                  size="xs"
                  leftIcon={<FiUpload />}
                  variant="ghost"
                  color={textColor}
                >
                  Import
                </Button>
                <input
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={(e) => handleImport('view', e)}
                />
              </label>
            </HStack>
          </HStack>
        </CardHeader>
        <CardBody>
          {customViews.length === 0 ? (
            <Alert status="info" bg="rgba(147, 51, 234, 0.1)" borderColor="#9333ea" borderWidth={1}>
              <AlertIcon color="#9333ea" />
              <Text fontSize="sm" color="#FFFFFF">
                No custom views. Save your current view to get started.
              </Text>
            </Alert>
          ) : (
            <VStack align="stretch" spacing={2}>
              {customViews.map((view) => (
                <HStack
                  key={view.id}
                  p={3}
                  bg="#1a1a1a"
                  borderRadius="md"
                  borderWidth={1}
                  borderColor={borderColor}
                  justify="space-between"
                >
                  <VStack align="start" spacing={1} flex={1}>
                    <HStack>
                      <Text fontWeight="bold" color={textColor}>
                        {view.name}
                      </Text>
                      {view.isDefault && (
                        <Badge colorScheme="yellow" size="sm">Default</Badge>
                      )}
                    </HStack>
                    {view.description && (
                      <Text fontSize="xs" color={secondaryTextColor}>
                        {view.description}
                      </Text>
                    )}
                    <HStack spacing={2} fontSize="xs" color={secondaryTextColor}>
                      {view.sorting && (
                        <Badge size="sm">Sort: {view.sorting.field}</Badge>
                      )}
                      {view.grouping?.enabled && (
                        <Badge size="sm">Group: {view.grouping.field}</Badge>
                      )}
                    </HStack>
                    <Text fontSize="xs" color={secondaryTextColor}>
                      {format(new Date(view.updatedAt), 'dd MMM yyyy')}
                    </Text>
                  </VStack>
                  <HStack spacing={1}>
                    <Button
                      size="sm"
                      onClick={() => handleLoadView(view)}
                      bg="#9333ea"
                      color="#FFFFFF"
                      _hover={{ bg: '#7c3aed' }}
                    >
                      Load
                    </Button>
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<FiMoreVertical />}
                        variant="ghost"
                        size="sm"
                        color={textColor}
                      />
                      <MenuList bg={cardBg} borderColor={borderColor}>
                        <MenuItem
                          icon={<FiStar />}
                          onClick={() => handleSetDefault('view', view.id)}
                          bg={cardBg}
                          color={textColor}
                          _hover={{ bg: '#1a1a1a' }}
                        >
                          Set as Default
                        </MenuItem>
                        <MenuItem
                          icon={<FiTrash2 />}
                          onClick={() => {
                            setItemToDelete({ type: 'view', id: view.id });
                            onDeleteModalOpen();
                          }}
                          bg={cardBg}
                          color="#ef4444"
                          _hover={{ bg: '#1a1a1a' }}
                        >
                          Delete
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </HStack>
                </HStack>
              ))}
            </VStack>
          )}
        </CardBody>
      </Card>

      {/* Save Filter Modal */}
      <Modal isOpen={isFilterModalOpen} onClose={onFilterModalClose} isCentered>
        <ModalOverlay bg="rgba(0, 0, 0, 0.8)" />
        <ModalContent bg={bgColor} borderColor={borderColor} borderWidth={1}>
          <ModalHeader color={textColor}>Save Filter</ModalHeader>
          <ModalCloseButton color={textColor} />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <Box>
                <Text fontSize="sm" color={secondaryTextColor} mb={1}>
                  Filter Name *
                </Text>
                <Input
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  placeholder="e.g., High Priority Orders"
                  bg="#1a1a1a"
                  borderColor={borderColor}
                  color={textColor}
                />
              </Box>
              <Box>
                <Text fontSize="sm" color={secondaryTextColor} mb={1}>
                  Description (optional)
                </Text>
                <Textarea
                  value={filterDescription}
                  onChange={(e) => setFilterDescription(e.target.value)}
                  placeholder="Describe this filter..."
                  bg="#1a1a1a"
                  borderColor={borderColor}
                  color={textColor}
                  rows={3}
                />
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onFilterModalClose} mr={3} color={textColor}>
              Cancel
            </Button>
            <Button bg="#2563eb" color="#FFFFFF" onClick={handleSaveFilter} _hover={{ bg: '#1d4ed8' }}>
              Save Filter
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Save View Modal */}
      <Modal isOpen={isViewModalOpen} onClose={onViewModalClose} isCentered>
        <ModalOverlay bg="rgba(0, 0, 0, 0.8)" />
        <ModalContent bg={bgColor} borderColor={borderColor} borderWidth={1}>
          <ModalHeader color={textColor}>Save Custom View</ModalHeader>
          <ModalCloseButton color={textColor} />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <Box>
                <Text fontSize="sm" color={secondaryTextColor} mb={1}>
                  View Name *
                </Text>
                <Input
                  value={viewName}
                  onChange={(e) => setViewName(e.target.value)}
                  placeholder="e.g., My Daily View"
                  bg="#1a1a1a"
                  borderColor={borderColor}
                  color={textColor}
                />
              </Box>
              <Box>
                <Text fontSize="sm" color={secondaryTextColor} mb={1}>
                  Description (optional)
                </Text>
                <Textarea
                  value={viewDescription}
                  onChange={(e) => setViewDescription(e.target.value)}
                  placeholder="Describe this view..."
                  bg="#1a1a1a"
                  borderColor={borderColor}
                  color={textColor}
                  rows={3}
                />
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onViewModalClose} mr={3} color={textColor}>
              Cancel
            </Button>
            <Button bg="#9333ea" color="#FFFFFF" onClick={handleSaveView} _hover={{ bg: '#7c3aed' }}>
              Save View
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={onDeleteModalClose} isCentered>
        <ModalOverlay bg="rgba(0, 0, 0, 0.8)" />
        <ModalContent bg={bgColor} borderColor="#ef4444" borderWidth={2}>
          <ModalHeader color={textColor}>Confirm Delete</ModalHeader>
          <ModalCloseButton color={textColor} />
          <ModalBody>
            <Text color={textColor}>
              Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onDeleteModalClose} mr={3} color={textColor}>
              Cancel
            </Button>
            <Button bg="#ef4444" color="#FFFFFF" onClick={handleDelete} _hover={{ bg: '#dc2626' }}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}

