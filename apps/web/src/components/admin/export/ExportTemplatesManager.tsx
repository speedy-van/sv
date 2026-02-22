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
  Checkbox,
  CheckboxGroup,
  useDisclosure,
  useToast,
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  SimpleGrid,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import {
  FiSave,
  FiTrash2,
  FiEdit2,
  FiDownload,
  FiMoreVertical,
  FiFileText,
  FiPlus,
} from 'react-icons/fi';
import { format } from 'date-fns';

interface ExportTemplate {
  id: string;
  name: string;
  description?: string;
  format: 'csv' | 'excel' | 'pdf';
  fields: string[];
  filters?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  usageCount?: number;
}

const STORAGE_KEY = 'admin_export_templates';
const AVAILABLE_FIELDS = [
  'reference',
  'customerName',
  'customerEmail',
  'customerPhone',
  'pickupAddress',
  'dropoffAddress',
  'scheduledAt',
  'status',
  'totalGBP',
  'paymentStatus',
  'driverName',
  'createdAt',
  'items',
  'notes',
];

export function ExportTemplatesManager() {
  const [templates, setTemplates] = useState<ExportTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ExportTemplate | null>(null);
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
  const [templateFormat, setTemplateFormat] = useState<'csv' | 'excel' | 'pdf'>('csv');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  const toast = useToast();
  const cardBg = useColorModeValue('#121A2B', '#121A2B');
  const textColor = useColorModeValue('#F5F8FF', '#F5F8FF');
  const borderColor = useColorModeValue('#2A3A5E', '#2A3A5E');
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
      console.error('Error loading export templates:', error);
    }
  };

  const saveTemplates = (newTemplates: ExportTemplate[]) => {
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

    if (selectedFields.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one field',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const newTemplate: ExportTemplate = {
      id: `export_template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: templateName,
      description: templateDescription || undefined,
      format: templateFormat,
      fields: selectedFields,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
    };

    const updated = [...templates, newTemplate];
    saveTemplates(updated);

    toast({
      title: 'Success',
      description: 'Export template created successfully',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });

    setTemplateName('');
    setTemplateDescription('');
    setTemplateFormat('csv');
    setSelectedFields([]);
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

    if (selectedFields.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one field',
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
            format: templateFormat,
            fields: selectedFields,
            updatedAt: new Date().toISOString(),
          }
        : t
    );

    saveTemplates(updated);

    toast({
      title: 'Success',
      description: 'Export template updated successfully',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });

    setSelectedTemplate(null);
    setTemplateName('');
    setTemplateDescription('');
    setTemplateFormat('csv');
    setSelectedFields([]);
    onEditModalClose();
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    saveTemplates(updated);

    toast({
      title: 'Deleted',
      description: 'Export template deleted successfully',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleUseTemplate = (template: ExportTemplate) => {
    // Increment usage count
    const updated = templates.map(t =>
      t.id === template.id
        ? { ...t, usageCount: (t.usageCount || 0) + 1, updatedAt: new Date().toISOString() }
        : t
    );
    saveTemplates(updated);

    // Emit event to parent component
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('export-template-selected', { detail: template }));
    }

    toast({
      title: 'Template Selected',
      description: `Export template "${template.name}" selected. Ready to export.`,
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleEditClick = (template: ExportTemplate) => {
    setSelectedTemplate(template);
    setTemplateName(template.name);
    setTemplateDescription(template.description || '');
    setTemplateFormat(template.format);
    setSelectedFields(template.fields);
    onEditModalOpen();
  };

  return (
    <VStack align="stretch" spacing={4}>
      <HStack justify="space-between">
        <Text fontWeight="bold" fontSize="lg" color={textColor}>
          Export Templates
        </Text>
        <Button
          leftIcon={<FiPlus />}
          onClick={onCreateModalOpen}
          size="sm"
          bg="#10b981"
          color="#F5F8FF"
          _hover={{ bg: '#059669' }}
        >
          Create Template
        </Button>
      </HStack>

      {templates.length === 0 ? (
        <Alert status="info" bg="rgba(16, 185, 129, 0.1)" borderColor="#10b981" borderWidth={1}>
          <AlertIcon color="#10b981" />
          <VStack align="start" spacing={1} flex={1}>
            <Text fontSize="sm" fontWeight="bold" color="#F5F8FF">
              No export templates yet
            </Text>
            <Text fontSize="xs" color={secondaryTextColor}>
              Create templates to quickly export orders with predefined fields and formats
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
                    <HStack>
                      <Text fontWeight="bold" color={textColor}>
                        {template.name}
                      </Text>
                      <Badge
                        colorScheme={
                          template.format === 'csv' ? 'blue' :
                          template.format === 'excel' ? 'green' : 'red'
                        }
                        size="sm"
                      >
                        {template.format.toUpperCase()}
                      </Badge>
                    </HStack>
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
                        _hover={{ bg: '#18233A' }}
                      >
                        Edit
                      </MenuItem>
                      <MenuItem
                        icon={<FiTrash2 />}
                        onClick={() => handleDeleteTemplate(template.id)}
                        bg={cardBg}
                        color="#ef4444"
                        _hover={{ bg: '#18233A' }}
                      >
                        Delete
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </HStack>
              </CardHeader>
              <CardBody>
                <VStack align="stretch" spacing={2}>
                  <Text fontSize="xs" color={secondaryTextColor}>
                    {template.fields.length} field{template.fields.length > 1 ? 's' : ''} selected
                  </Text>
                  <HStack justify="space-between" fontSize="xs" color={secondaryTextColor}>
                    <Text>Used {template.usageCount || 0} times</Text>
                    <Text>{format(new Date(template.updatedAt), 'dd MMM yyyy')}</Text>
                  </HStack>
                  <Button
                    leftIcon={<FiDownload />}
                    onClick={() => handleUseTemplate(template)}
                    size="sm"
                    bg="#10b981"
                    color="#F5F8FF"
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

      {/* Create/Edit Template Modal */}
      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={isCreateModalOpen ? onCreateModalClose : onEditModalClose}
        size="lg"
        isCentered
      >
        <ModalOverlay bg="rgba(0, 0, 0, 0.8)" />
        <ModalContent bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <ModalHeader color={textColor}>
            {isCreateModalOpen ? 'Create Export Template' : 'Edit Export Template'}
          </ModalHeader>
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
                  placeholder="e.g., Customer Report"
                  bg="#18233A"
                  borderColor={borderColor}
                  color={textColor}
                />
              </Box>
              <Box>
                <Text fontSize="sm" color={secondaryTextColor} mb={1}>
                  Description (optional)
                </Text>
                <Input
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Describe this template..."
                  bg="#18233A"
                  borderColor={borderColor}
                  color={textColor}
                />
              </Box>
              <Box>
                <Text fontSize="sm" color={secondaryTextColor} mb={1}>
                  Export Format *
                </Text>
                <HStack spacing={2}>
                  {(['csv', 'excel', 'pdf'] as const).map((format) => (
                    <Button
                      key={format}
                      onClick={() => setTemplateFormat(format)}
                      variant={templateFormat === format ? 'solid' : 'outline'}
                      bg={templateFormat === format ? '#2563eb' : 'transparent'}
                      color={templateFormat === format ? '#F5F8FF' : textColor}
                      borderColor={borderColor}
                      _hover={{ bg: templateFormat === format ? '#1d4ed8' : '#18233A' }}
                      flex={1}
                    >
                      {format.toUpperCase()}
                    </Button>
                  ))}
                </HStack>
              </Box>
              <Box>
                <Text fontSize="sm" color={secondaryTextColor} mb={2}>
                  Select Fields *
                </Text>
                <Box
                  bg="#18233A"
                  borderWidth={1}
                  borderColor={borderColor}
                  borderRadius="md"
                  p={3}
                  maxH="200px"
                  overflowY="auto"
                >
                  <CheckboxGroup
                    value={selectedFields}
                    onChange={(values) => setSelectedFields(values as string[])}
                  >
                    <VStack align="start" spacing={2}>
                      {AVAILABLE_FIELDS.map((field) => (
                        <Checkbox
                          key={field}
                          value={field}
                          colorScheme="blue"
                          color={textColor}
                        >
                          <Text fontSize="sm" color={textColor}>
                            {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                          </Text>
                        </Checkbox>
                      ))}
                    </VStack>
                  </CheckboxGroup>
                </Box>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              onClick={isCreateModalOpen ? onCreateModalClose : onEditModalClose}
              mr={3}
              color={textColor}
            >
              Cancel
            </Button>
            <Button
              bg="#10b981"
              color="#F5F8FF"
              onClick={isCreateModalOpen ? handleCreateTemplate : handleEditTemplate}
              _hover={{ bg: '#059669' }}
            >
              {isCreateModalOpen ? 'Create Template' : 'Save Changes'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}

