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
  Input,
  Select,
  Textarea,
  NumberInput,
  NumberInputField,
  useToast,
  Badge,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import {
  FaCog,
  FaCheckCircle,
  FaTimesCircle,
  FaUser,
  FaEnvelope,
  FaTrash,
  FaRoute,
  FaFileExport,
  FaTag,
  FaEdit,
  FaClock,
  FaDollarSign,
  FaStickyNote,
} from 'react-icons/fa';

interface BulkOperationsMenuProps {
  selectedCount: number;
  onAction: (action: string, data?: any) => Promise<void>;
  disabled?: boolean;
}

export function BulkOperationsMenu({
  selectedCount,
  onAction,
  disabled = false,
}: BulkOperationsMenuProps) {
  const toast = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  // Status Change Modal
  const {
    isOpen: isStatusModalOpen,
    onOpen: onStatusModalOpen,
    onClose: onStatusModalClose,
  } = useDisclosure();
  const [newStatus, setNewStatus] = useState('');

  // Driver Assignment Modal
  const {
    isOpen: isDriverModalOpen,
    onOpen: onDriverModalOpen,
    onClose: onDriverModalClose,
  } = useDisclosure();
  const [driverId, setDriverId] = useState('');
  const [assignmentReason, setAssignmentReason] = useState('');
  const [autoAssign, setAutoAssign] = useState(false);

  // Price Adjustment Modal
  const {
    isOpen: isPriceModalOpen,
    onOpen: onPriceModalOpen,
    onClose: onPriceModalClose,
  } = useDisclosure();
  const [priceAdjustment, setPriceAdjustment] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'fixed' | 'percentage'>('fixed');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  // Notes Modal
  const {
    isOpen: isNotesModalOpen,
    onOpen: onNotesModalOpen,
    onClose: onNotesModalClose,
  } = useDisclosure();
  const [bulkNotes, setBulkNotes] = useState('');

  // Email Modal
  const {
    isOpen: isEmailModalOpen,
    onOpen: onEmailModalOpen,
    onClose: onEmailModalClose,
  } = useDisclosure();
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const handleStatusChange = async () => {
    if (!newStatus) {
      toast({
        title: 'Status Required',
        description: 'Please select a status',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading('status');
    try {
      await onAction('change-status', { status: newStatus });
      onStatusModalClose();
      setNewStatus('');
    } catch (error) {
      console.error('Status change error:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleDriverAssignment = async () => {
    if (!autoAssign && !driverId) {
      toast({
        title: 'Driver Required',
        description: 'Please select a driver or enable auto-assign',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading('driver');
    try {
      await onAction('assign', {
        driverId: autoAssign ? null : driverId,
        autoAssign,
        reason: assignmentReason,
      });
      onDriverModalClose();
      setDriverId('');
      setAssignmentReason('');
      setAutoAssign(false);
    } catch (error) {
      console.error('Driver assignment error:', error);
    } finally {
      setLoading(null);
    }
  };

  const handlePriceAdjustment = async () => {
    if (!priceAdjustment) {
      toast({
        title: 'Amount Required',
        description: 'Please enter an adjustment amount',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading('price');
    try {
      await onAction('adjust-price', {
        amount: parseFloat(priceAdjustment),
        type: adjustmentType,
        reason: adjustmentReason,
      });
      onPriceModalClose();
      setPriceAdjustment('');
      setAdjustmentType('fixed');
      setAdjustmentReason('');
    } catch (error) {
      console.error('Price adjustment error:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleAddNotes = async () => {
    if (!bulkNotes.trim()) {
      toast({
        title: 'Notes Required',
        description: 'Please enter notes to add',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading('notes');
    try {
      await onAction('add-notes', { notes: bulkNotes });
      onNotesModalClose();
      setBulkNotes('');
    } catch (error) {
      console.error('Add notes error:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      toast({
        title: 'Email Content Required',
        description: 'Please enter both subject and body',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading('email');
    try {
      await onAction('email', {
        subject: emailSubject,
        body: emailBody,
      });
      onEmailModalClose();
      setEmailSubject('');
      setEmailBody('');
    } catch (error) {
      console.error('Send email error:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleQuickAction = async (action: string) => {
    setLoading(action);
    try {
      await onAction(action);
    } catch (error) {
      console.error(`${action} error:`, error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <Menu>
        <MenuButton
          as={Button}
          leftIcon={<FaCog />}
          colorScheme="blue"
          variant="outline"
          isDisabled={disabled || selectedCount === 0}
          isLoading={loading !== null}
          bg="#121A2B"
          color="#F5F8FF"
          borderColor="#2A3A5E"
          borderWidth="2px"
          borderRadius="lg"
          px={4}
          py={2}
          fontWeight="semibold"
          letterSpacing="0.5px"
        >
          Bulk Actions
        </MenuButton>
        <MenuList bg="#121A2B" borderColor="#2A3A5E" borderWidth={2}>
          {/* Status Actions */}
          <MenuItem
            icon={<FaCheckCircle />}
            bg="#121A2B"
            color="#F5F8FF"
            _hover={{ bg: '#18233A' }}
            onClick={onStatusModalOpen}
          >
            Change Status
          </MenuItem>
          <MenuItem
            icon={<FaTimesCircle />}
            bg="#121A2B"
            color="#F5F8FF"
            _hover={{ bg: '#18233A' }}
            onClick={() => handleQuickAction('cancel')}
          >
            Cancel Orders
          </MenuItem>

          <MenuDivider borderColor="#2A3A5E" />

          {/* Driver Actions */}
          <MenuItem
            icon={<FaUser />}
            bg="#121A2B"
            color="#F5F8FF"
            _hover={{ bg: '#18233A' }}
            onClick={onDriverModalOpen}
          >
            Assign Driver
          </MenuItem>
          <MenuItem
            icon={<FaUser />}
            bg="#121A2B"
            color="#F5F8FF"
            _hover={{ bg: '#18233A' }}
            onClick={() => handleQuickAction('unassign-driver')}
          >
            Unassign Driver
          </MenuItem>

          <MenuDivider borderColor="#2A3A5E" />

          {/* Communication */}
          <MenuItem
            icon={<FaEnvelope />}
            bg="#121A2B"
            color="#F5F8FF"
            _hover={{ bg: '#18233A' }}
            onClick={onEmailModalOpen}
          >
            Send Email
          </MenuItem>
          <MenuItem
            icon={<FaEnvelope />}
            bg="#121A2B"
            color="#F5F8FF"
            _hover={{ bg: '#18233A' }}
            onClick={() => handleQuickAction('send-floor-warnings')}
          >
            Send Floor Warnings
          </MenuItem>

          <MenuDivider borderColor="#2A3A5E" />

          {/* Price & Notes */}
          <MenuItem
            icon={<FaDollarSign />}
            bg="#121A2B"
            color="#F5F8FF"
            _hover={{ bg: '#18233A' }}
            onClick={onPriceModalOpen}
          >
            Adjust Price
          </MenuItem>
          <MenuItem
            icon={<FaStickyNote />}
            bg="#121A2B"
            color="#F5F8FF"
            _hover={{ bg: '#18233A' }}
            onClick={onNotesModalOpen}
          >
            Add Notes
          </MenuItem>

          <MenuDivider borderColor="#2A3A5E" />

          {/* Route & Export */}
          <MenuItem
            icon={<FaRoute />}
            bg="#121A2B"
            color="#F5F8FF"
            _hover={{ bg: '#18233A' }}
            onClick={() => handleQuickAction('create-route')}
          >
            Create Route
          </MenuItem>
          <MenuItem
            icon={<FaFileExport />}
            bg="#121A2B"
            color="#F5F8FF"
            _hover={{ bg: '#18233A' }}
            onClick={() => handleQuickAction('export')}
          >
            Export to CSV
          </MenuItem>

          <MenuDivider borderColor="#2A3A5E" />

          {/* Tags & Labels */}
          <MenuItem
            icon={<FaTag />}
            bg="#121A2B"
            color="#F5F8FF"
            _hover={{ bg: '#18233A' }}
            onClick={() => handleQuickAction('add-tag')}
          >
            Add Tag
          </MenuItem>
        </MenuList>
      </Menu>

      {/* Status Change Modal */}
      <Modal isOpen={isStatusModalOpen} onClose={onStatusModalClose} size="md">
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent bg="#0B1020" borderColor="#2A3A5E" borderWidth={2}>
          <ModalHeader color="#F5F8FF">Change Status</ModalHeader>
          <ModalCloseButton color="#F5F8FF" />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info" bg="#18233A" borderColor="#2A3A5E">
                <AlertIcon />
                <Text fontSize="sm" color="#F5F8FF">
                  This will change the status of {selectedCount} selected order(s)
                </Text>
              </Alert>
              <FormControl>
                <FormLabel color="#9ca3af">New Status</FormLabel>
                <Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  bg="#121A2B"
                  color="#F5F8FF"
                  borderColor="#2A3A5E"
                >
                  <option value="">Select Status</option>
                  <option value="PENDING_PAYMENT">Pending Payment</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack>
              <Button
                variant="outline"
                onClick={onStatusModalClose}
                borderColor="#2A3A5E"
                color="#F5F8FF"
              >
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleStatusChange}
                isLoading={loading === 'status'}
                bg="#2563eb"
                color="#F5F8FF"
              >
                Change Status
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Driver Assignment Modal */}
      <Modal isOpen={isDriverModalOpen} onClose={onDriverModalClose} size="md">
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent bg="#0B1020" borderColor="#2A3A5E" borderWidth={2}>
          <ModalHeader color="#F5F8FF">Assign Driver</ModalHeader>
          <ModalCloseButton color="#F5F8FF" />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info" bg="#18233A" borderColor="#2A3A5E">
                <AlertIcon />
                <Text fontSize="sm" color="#F5F8FF">
                  Assign driver to {selectedCount} selected order(s)
                </Text>
              </Alert>
              <FormControl>
                <Select
                  value={autoAssign ? 'auto' : driverId}
                  onChange={(e) => {
                    if (e.target.value === 'auto') {
                      setAutoAssign(true);
                      setDriverId('');
                    } else {
                      setAutoAssign(false);
                      setDriverId(e.target.value);
                    }
                  }}
                  bg="#121A2B"
                  color="#F5F8FF"
                  borderColor="#2A3A5E"
                >
                  <option value="auto">Auto-Assign (Recommended)</option>
                  <option value="">Select Driver Manually</option>
                  {/* Driver options would be loaded from API */}
                </Select>
              </FormControl>
              {!autoAssign && (
                <FormControl>
                  <FormLabel color="#9ca3af">Driver ID</FormLabel>
                  <Input
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    placeholder="Enter driver ID"
                    bg="#121A2B"
                    color="#F5F8FF"
                    borderColor="#2A3A5E"
                  />
                </FormControl>
              )}
              <FormControl>
                <FormLabel color="#9ca3af">Reason (Optional)</FormLabel>
                <Textarea
                  value={assignmentReason}
                  onChange={(e) => setAssignmentReason(e.target.value)}
                  placeholder="Reason for assignment..."
                  bg="#121A2B"
                  color="#F5F8FF"
                  borderColor="#2A3A5E"
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack>
              <Button
                variant="outline"
                onClick={onDriverModalClose}
                borderColor="#2A3A5E"
                color="#F5F8FF"
              >
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleDriverAssignment}
                isLoading={loading === 'driver'}
                bg="#2563eb"
                color="#F5F8FF"
              >
                Assign Driver
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Price Adjustment Modal */}
      <Modal isOpen={isPriceModalOpen} onClose={onPriceModalClose} size="md">
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent bg="#0B1020" borderColor="#2A3A5E" borderWidth={2}>
          <ModalHeader color="#F5F8FF">Adjust Price</ModalHeader>
          <ModalCloseButton color="#F5F8FF" />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="warning" bg="#18233A" borderColor="#2A3A5E">
                <AlertIcon />
                <Text fontSize="sm" color="#F5F8FF">
                  This will adjust the price for {selectedCount} selected order(s)
                </Text>
              </Alert>
              <FormControl>
                <FormLabel color="#9ca3af">Adjustment Type</FormLabel>
                <Select
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value as 'fixed' | 'percentage')}
                  bg="#121A2B"
                  color="#F5F8FF"
                  borderColor="#2A3A5E"
                >
                  <option value="fixed">Fixed Amount (£)</option>
                  <option value="percentage">Percentage (%)</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel color="#9ca3af">
                  {adjustmentType === 'fixed' ? 'Amount (£)' : 'Percentage (%)'}
                </FormLabel>
                <NumberInput
                  value={priceAdjustment}
                  onChange={(_, value) => setPriceAdjustment(value.toString())}
                >
                  <NumberInputField
                    bg="#121A2B"
                    color="#F5F8FF"
                    borderColor="#2A3A5E"
                    placeholder={adjustmentType === 'fixed' ? '0.00' : '0'}
                  />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel color="#9ca3af">Reason (Required)</FormLabel>
                <Textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Reason for price adjustment..."
                  bg="#121A2B"
                  color="#F5F8FF"
                  borderColor="#2A3A5E"
                  rows={3}
                  required
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack>
              <Button
                variant="outline"
                onClick={onPriceModalClose}
                borderColor="#2A3A5E"
                color="#F5F8FF"
              >
                Cancel
              </Button>
              <Button
                colorScheme="orange"
                onClick={handlePriceAdjustment}
                isLoading={loading === 'price'}
                bg="#f59e0b"
                color="#F5F8FF"
              >
                Adjust Price
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Notes Modal */}
      <Modal isOpen={isNotesModalOpen} onClose={onNotesModalClose} size="md">
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent bg="#0B1020" borderColor="#2A3A5E" borderWidth={2}>
          <ModalHeader color="#F5F8FF">Add Notes</ModalHeader>
          <ModalCloseButton color="#F5F8FF" />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info" bg="#18233A" borderColor="#2A3A5E">
                <AlertIcon />
                <Text fontSize="sm" color="#F5F8FF">
                  Add notes to {selectedCount} selected order(s)
                </Text>
              </Alert>
              <FormControl>
                <FormLabel color="#9ca3af">Notes</FormLabel>
                <Textarea
                  value={bulkNotes}
                  onChange={(e) => setBulkNotes(e.target.value)}
                  placeholder="Enter notes to add to all selected orders..."
                  bg="#121A2B"
                  color="#F5F8FF"
                  borderColor="#2A3A5E"
                  rows={5}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack>
              <Button
                variant="outline"
                onClick={onNotesModalClose}
                borderColor="#2A3A5E"
                color="#F5F8FF"
              >
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleAddNotes}
                isLoading={loading === 'notes'}
                bg="#2563eb"
                color="#F5F8FF"
              >
                Add Notes
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Email Modal */}
      <Modal isOpen={isEmailModalOpen} onClose={onEmailModalClose} size="lg">
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent bg="#0B1020" borderColor="#2A3A5E" borderWidth={2}>
          <ModalHeader color="#F5F8FF">Send Email</ModalHeader>
          <ModalCloseButton color="#F5F8FF" />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info" bg="#18233A" borderColor="#2A3A5E">
                <AlertIcon />
                <Text fontSize="sm" color="#F5F8FF">
                  Send email to customers of {selectedCount} selected order(s)
                </Text>
              </Alert>
              <FormControl>
                <FormLabel color="#9ca3af">Subject</FormLabel>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Email subject..."
                  bg="#121A2B"
                  color="#F5F8FF"
                  borderColor="#2A3A5E"
                />
              </FormControl>
              <FormControl>
                <FormLabel color="#9ca3af">Body</FormLabel>
                <Textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Email body..."
                  bg="#121A2B"
                  color="#F5F8FF"
                  borderColor="#2A3A5E"
                  rows={8}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack>
              <Button
                variant="outline"
                onClick={onEmailModalClose}
                borderColor="#2A3A5E"
                color="#F5F8FF"
              >
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleSendEmail}
                isLoading={loading === 'email'}
                bg="#2563eb"
                color="#F5F8FF"
              >
                Send Email
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

