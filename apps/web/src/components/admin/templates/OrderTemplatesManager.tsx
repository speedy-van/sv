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
  useColorModeValue,
  Alert,
  AlertIcon,
  SimpleGrid,
} from '@chakra-ui/react';
import {
  FiSave,
  FiTrash2,
  FiEdit2,
  FiCopy,
  FiMoreVertical,
  FiFileText,
  FiPlus,
} from 'react-icons/fi';
import { format } from 'date-fns';

interface OrderTemplate {
  id: string;
  name: string;
  description?: string;
  template: {
    pickupAddress?: string;
    dropoffAddress?: string;
    items?: any[];
    serviceType?: string;
    priority?: string;
    notes?: string;
  };
  createdAt: string;
  updatedAt: string;
  usageCount?: number;
}

const STORAGE_KEY = 'admin_order_templates';

export function OrderTemplatesManager() {
  const [templates, setTemplates] = useState<OrderTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<OrderTemplate | null>(null);
  const {
    isOpen: isCreateModalOpen,
    onOpen: onCreateModalOpen,
    onClose: onCreateModalClose,
  } = useDisclosure();
  const {
    isOpen: isEditModalOpen,
    onOpen: onEditModalOpen,
    onClose: onEditModalClose,
  } = useDisclosure();

  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateData, setTemplateData] = useState<any>({});

  const toast = useToast();
  const cardBg = useColorModeValue('#111111', '#111111');
  const textColor = useColorModeValue('#FFFFFF', '#FFFFFF');
  const borderColor = useColorModeValue('#333333', '#333333');
  const secondaryTextColor = useColorModeValue('#9ca3af', '#9ca3af');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTemplates(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const saveTemplates = (newTemplates: OrderTemplate[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTemplates));
    setTemplates(newTemplates);
  };

  const handleCreateTemplate = () => {
    if (!templateName.trim()) {
      toast({
        title: 'Error',
        description: 'Template name is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const newTemplate: OrderTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: templateName,
      description: templateDescription || undefined,
      template: templateData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
    };

    const updated = [...templates, newTemplate];
    saveTemplates(updated);

    toast({
      title: 'Success',
      description: 'Template created successfully',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });

    setTemplateName('');
    setTemplateDescription('');
    setTemplateData({});
    onCreateModalClose();
  };

  const handleEditTemplate = () => {
    if (!selectedTemplate || !templateName.trim()) {
      toast({
        title: 'Error',
        description: 'Template name is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const updated = templates.map(t =>
      t.id === selectedTemplate.id
        ? {
            ...t,
            name: templateName,
            description: templateDescription || undefined,
            template: templateData,
            updatedAt: new Date().toISOString(),
          }
        : t
    );

    saveTemplates(updated);

    toast({
      title: 'Success',
      description: 'Template updated successfully',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });

    setSelectedTemplate(null);
    setTemplateName('');
    setTemplateDescription('');
    setTemplateData({});
    onEditModalClose();
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    saveTemplates(updated);

    toast({
      title: 'Deleted',
      description: 'Template deleted successfully',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleUseTemplate = (template: OrderTemplate) => {
    // Increment usage count
    const updated = templates.map(t =>
      t.id === template.id
        ? { ...t, usageCount: (t.usageCount || 0) + 1, updatedAt: new Date().toISOString() }
        : t
    );
    saveTemplates(updated);

    toast({
      title: 'Template Applied',
      description: `Template "${template.name}" applied. You can now create an order with these settings.`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });

    // Emit event or callback to parent component
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('order-template-selected', { detail: template }));
    }
  };

  const handleEditClick = (template: OrderTemplate) => {
    setSelectedTemplate(template);
    setTemplateName(template.name);
    setTemplateDescription(template.description || '');
    setTemplateData(template.template);
    onEditModalOpen();
  };

  return (
    <VStack align="stretch" spacing={4}>
      <HStack justify="space-between">
        <Text fontWeight="bold" fontSize="lg" color={textColor}>
          Order Templates
        </Text>
        <Button
          leftIcon={<FiPlus />}
          onClick={onCreateModalOpen}
          size="sm"
          bg="#2563eb"
          color="#FFFFFF"
          _hover={{ bg: '#1d4ed8' }}
        >
          Create Template
        </Button>
      </HStack>

      {templates.length === 0 ? (
        <Alert status="info" bg="rgba(37, 99, 235, 0.1)" borderColor="#2563eb" borderWidth={1}>
          <AlertIcon color="#2563eb" />
          <VStack align="start" spacing={1} flex={1}>
            <Text fontSize="sm" fontWeight="bold" color="#FFFFFF">
              No templates yet
            </Text>
            <Text fontSize="xs" color={secondaryTextColor}>
              Create templates to quickly create orders with pre-filled information
            </Text>
          </VStack>
        </Alert>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {templates.map((template) => (
            <Card key={template.id} bg={cardBg} borderColor={borderColor} borderWidth={1}>
              <CardHeader>
                <HStack justify="space-between">
                  <VStack align="start" spacing={0} flex={1}>
                    <Text fontWeight="bold" color={textColor}>
                      {template.name}
                    </Text>
                    {template.description && (
                      <Text fontSize="xs" color={secondaryTextColor} noOfLines={1}>
                        {template.description}
                      </Text>
                    )}
                  </VStack>
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
                        icon={<FiEdit2 />}
                        onClick={() => handleEditClick(template)}
                        bg={cardBg}
                        color={textColor}
                        _hover={{ bg: '#1a1a1a' }}
                      >
                        Edit
                      </MenuItem>
                      <MenuItem
                        icon={<FiCopy />}
                        onClick={() => {
                          const newTemplate = {
                            ...template,
                            id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            name: `${template.name} (Copy)`,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                          };
                          saveTemplates([...templates, newTemplate]);
                        }}
                        bg={cardBg}
                        color={textColor}
                        _hover={{ bg: '#1a1a1a' }}
                      >
                        Duplicate
                      </MenuItem>
                      <MenuItem
                        icon={<FiTrash2 />}
                        onClick={() => handleDeleteTemplate(template.id)}
                        bg={cardBg}
                        color="#ef4444"
                        _hover={{ bg: '#1a1a1a' }}
                      >
                        Delete
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </HStack>
              </CardHeader>
              <CardBody>
                <VStack align="stretch" spacing={2}>
                  <HStack justify="space-between" fontSize="xs" color={secondaryTextColor}>
                    <Text>Used {template.usageCount || 0} times</Text>
                    <Text>{format(new Date(template.updatedAt), 'dd MMM yyyy')}</Text>
                  </HStack>
                  <Button
                    leftIcon={<FiFileText />}
                    onClick={() => handleUseTemplate(template)}
                    size="sm"
                    bg="#10b981"
                    color="#FFFFFF"
                    _hover={{ bg: '#059669' }}
                  >
                    Use Template
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}

      {/* Create Template Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={onCreateModalClose} isCentered>
        <ModalOverlay bg="rgba(0, 0, 0, 0.8)" />
        <ModalContent bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <ModalHeader color={textColor}>Create Order Template</ModalHeader>
          <ModalCloseButton color={textColor} />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <Box>
                <Text fontSize="sm" color={secondaryTextColor} mb={1}>
                  Template Name *
                </Text>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Standard Delivery"
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
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Describe this template..."
                  bg="#1a1a1a"
                  borderColor={borderColor}
                  color={textColor}
                  rows={3}
                />
              </Box>
              <Alert status="info" bg="rgba(37, 99, 235, 0.1)" borderColor="#2563eb" borderWidth={1}>
                <AlertIcon color="#2563eb" />
                <Text fontSize="xs" color={secondaryTextColor}>
                  Template data will be saved when you create an order. You can edit this later.
                </Text>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onCreateModalClose} mr={3} color={textColor}>
              Cancel
            </Button>
            <Button bg="#2563eb" color="#FFFFFF" onClick={handleCreateTemplate} _hover={{ bg: '#1d4ed8' }}>
              Create Template
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Template Modal */}
      <Modal isOpen={isEditModalOpen} onClose={onEditModalClose} isCentered>
        <ModalOverlay bg="rgba(0, 0, 0, 0.8)" />
        <ModalContent bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <ModalHeader color={textColor}>Edit Order Template</ModalHeader>
          <ModalCloseButton color={textColor} />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <Box>
                <Text fontSize="sm" color={secondaryTextColor} mb={1}>
                  Template Name *
                </Text>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Standard Delivery"
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
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Describe this template..."
                  bg="#1a1a1a"
                  borderColor={borderColor}
                  color={textColor}
                  rows={3}
                />
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onEditModalClose} mr={3} color={textColor}>
              Cancel
            </Button>
            <Button bg="#2563eb" color="#FFFFFF" onClick={handleEditTemplate} _hover={{ bg: '#1d4ed8' }}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}

