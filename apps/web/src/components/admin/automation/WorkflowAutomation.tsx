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
  Select,
  Input,
  Switch,
  FormControl,
  FormLabel,
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
  Divider,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiPlay,
  FiPause,
  FiMoreVertical,
  FiSettings,
  FiCheckCircle,
  FiXCircle,
} from 'react-icons/fi';
import { format } from 'date-fns';

interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  trigger: {
    type: 'order_status' | 'order_created' | 'payment_received' | 'route_completed' | 'time_based';
    conditions: Record<string, any>;
  };
  actions: Array<{
    type: 'change_status' | 'assign_driver' | 'send_email' | 'send_sms' | 'create_route' | 'update_price';
    params: Record<string, any>;
  }>;
  createdAt: string;
  updatedAt: string;
  executionCount?: number;
  lastExecuted?: string;
}

const STORAGE_KEY = 'admin_automation_rules';

export function WorkflowAutomation() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
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

  const [ruleName, setRuleName] = useState('');
  const [ruleDescription, setRuleDescription] = useState('');
  const [triggerType, setTriggerType] = useState<AutomationRule['trigger']['type']>('order_status');
  const [enabled, setEnabled] = useState(true);

  const toast = useToast();
  const cardBg = useColorModeValue('#121A2B', '#121A2B');
  const textColor = useColorModeValue('#F5F8FF', '#F5F8FF');
  const borderColor = useColorModeValue('#2A3A5E', '#2A3A5E');
  const secondaryTextColor = useColorModeValue('#9ca3af', '#9ca3af');

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRules(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading automation rules:', error);
    }
  };

  const saveRules = (newRules: AutomationRule[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRules));
    setRules(newRules);
  };

  const handleCreateRule = () => {
    if (!ruleName.trim()) {
      toast({
        title: 'Error',
        description: 'Rule name is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const newRule: AutomationRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: ruleName,
      description: ruleDescription || undefined,
      enabled,
      trigger: {
        type: triggerType,
        conditions: {},
      },
      actions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      executionCount: 0,
    };

    const updated = [...rules, newRule];
    saveRules(updated);

    toast({
      title: 'Success',
      description: 'Automation rule created successfully',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });

    setRuleName('');
    setRuleDescription('');
    setTriggerType('order_status');
    setEnabled(true);
    onCreateModalClose();
  };

  const handleToggleRule = (id: string) => {
    const updated = rules.map(r =>
      r.id === id ? { ...r, enabled: !r.enabled, updatedAt: new Date().toISOString() } : r
    );
    saveRules(updated);

    toast({
      title: 'Rule Updated',
      description: `Rule ${updated.find(r => r.id === id)?.enabled ? 'enabled' : 'disabled'}`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleDeleteRule = (id: string) => {
    const updated = rules.filter(r => r.id !== id);
    saveRules(updated);

    toast({
      title: 'Deleted',
      description: 'Automation rule deleted successfully',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const getTriggerLabel = (type: AutomationRule['trigger']['type']) => {
    const labels = {
      order_status: 'Order Status Change',
      order_created: 'Order Created',
      payment_received: 'Payment Received',
      route_completed: 'Route Completed',
      time_based: 'Time Based',
    };
    return labels[type] || type;
  };

  return (
    <VStack align="stretch" spacing={4}>
      <HStack justify="space-between">
        <VStack align="start" spacing={0}>
          <Text fontWeight="bold" fontSize="lg" color={textColor}>
            Workflow Automation
          </Text>
          <Text fontSize="sm" color={secondaryTextColor}>
            Automate repetitive tasks and workflows
          </Text>
        </VStack>
        <Button
          leftIcon={<FiPlus />}
          onClick={onCreateModalOpen}
          size="sm"
          bg="#9333ea"
          color="#F5F8FF"
          _hover={{ bg: '#7c3aed' }}
        >
          Create Rule
        </Button>
      </HStack>

      {rules.length === 0 ? (
        <Alert status="info" bg="rgba(147, 51, 234, 0.1)" borderColor="#9333ea" borderWidth={1}>
          <AlertIcon color="#9333ea" />
          <VStack align="start" spacing={1} flex={1}>
            <Text fontSize="sm" fontWeight="bold" color="#F5F8FF">
              No automation rules yet
            </Text>
            <Text fontSize="xs" color={secondaryTextColor}>
              Create rules to automate tasks like status changes, driver assignments, and notifications
            </Text>
          </VStack>
        </Alert>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {rules.map((rule) => (
            <Card key={rule.id} bg={cardBg} borderColor={borderColor} borderWidth={1}>
              <CardHeader>
                <HStack justify="space-between">
                  <VStack align="start" spacing={0} flex={1}>
                    <HStack>
                      <Text fontWeight="bold" color={textColor}>
                        {rule.name}
                      </Text>
                      <Badge
                        colorScheme={rule.enabled ? 'green' : 'gray'}
                        size="sm"
                      >
                        {rule.enabled ? 'Active' : 'Inactive'}
                      </Badge>
                    </HStack>
                    {rule.description && (
                      <Text fontSize="xs" color={secondaryTextColor} noOfLines={1}>
                        {rule.description}
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
                        icon={rule.enabled ? <FiPause /> : <FiPlay />}
                        onClick={() => handleToggleRule(rule.id)}
                        bg={cardBg}
                        color={textColor}
                        _hover={{ bg: '#18233A' }}
                      >
                        {rule.enabled ? 'Disable' : 'Enable'}
                      </MenuItem>
                      <MenuItem
                        icon={<FiEdit2 />}
                        onClick={() => {
                          setSelectedRule(rule);
                          setRuleName(rule.name);
                          setRuleDescription(rule.description || '');
                          setTriggerType(rule.trigger.type);
                          setEnabled(rule.enabled);
                          onEditModalOpen();
                        }}
                        bg={cardBg}
                        color={textColor}
                        _hover={{ bg: '#18233A' }}
                      >
                        Edit
                      </MenuItem>
                      <MenuItem
                        icon={<FiTrash2 />}
                        onClick={() => handleDeleteRule(rule.id)}
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
                <VStack align="stretch" spacing={3}>
                  <Box>
                    <Text fontSize="xs" color={secondaryTextColor} mb={1}>
                      Trigger
                    </Text>
                    <Badge colorScheme="blue" size="sm">
                      {getTriggerLabel(rule.trigger.type)}
                    </Badge>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color={secondaryTextColor} mb={1}>
                      Actions
                    </Text>
                    <Text fontSize="sm" color={textColor}>
                      {rule.actions.length} action{rule.actions.length > 1 ? 's' : ''} configured
                    </Text>
                  </Box>
                  <Divider borderColor={borderColor} />
                  <HStack justify="space-between" fontSize="xs" color={secondaryTextColor}>
                    <Text>Executed {rule.executionCount || 0} times</Text>
                    {rule.lastExecuted && (
                      <Text>{format(new Date(rule.lastExecuted), 'dd MMM yyyy')}</Text>
                    )}
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}

      {/* Create/Edit Rule Modal */}
      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={isCreateModalOpen ? onCreateModalClose : onEditModalClose}
        size="lg"
        isCentered
      >
        <ModalOverlay bg="rgba(0, 0, 0, 0.8)" />
        <ModalContent bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <ModalHeader color={textColor}>
            {isCreateModalOpen ? 'Create Automation Rule' : 'Edit Automation Rule'}
          </ModalHeader>
          <ModalCloseButton color={textColor} />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <FormControl>
                <FormLabel color={textColor}>Rule Name *</FormLabel>
                <Input
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g., Auto-assign driver for high priority orders"
                  bg="#18233A"
                  borderColor={borderColor}
                  color={textColor}
                />
              </FormControl>
              <FormControl>
                <FormLabel color={textColor}>Description (optional)</FormLabel>
                <Input
                  value={ruleDescription}
                  onChange={(e) => setRuleDescription(e.target.value)}
                  placeholder="Describe this automation rule..."
                  bg="#18233A"
                  borderColor={borderColor}
                  color={textColor}
                />
              </FormControl>
              <FormControl>
                <FormLabel color={textColor}>Trigger Type *</FormLabel>
                <Select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value as any)}
                  bg="#18233A"
                  borderColor={borderColor}
                  color={textColor}
                >
                  <option value="order_status">Order Status Change</option>
                  <option value="order_created">Order Created</option>
                  <option value="payment_received">Payment Received</option>
                  <option value="route_completed">Route Completed</option>
                  <option value="time_based">Time Based</option>
                </Select>
              </FormControl>
              <FormControl display="flex" alignItems="center">
                <FormLabel color={textColor} mb={0}>
                  Enable Rule
                </FormLabel>
                <Switch
                  isChecked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  colorScheme="green"
                />
              </FormControl>
              <Alert status="info" bg="rgba(37, 99, 235, 0.1)" borderColor="#2563eb" borderWidth={1}>
                <AlertIcon color="#2563eb" />
                <Text fontSize="xs" color={secondaryTextColor}>
                  You can configure actions and conditions after creating the rule.
                </Text>
              </Alert>
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
              bg="#9333ea"
              color="#F5F8FF"
              onClick={handleCreateRule}
              _hover={{ bg: '#7c3aed' }}
            >
              {isCreateModalOpen ? 'Create Rule' : 'Save Changes'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}

