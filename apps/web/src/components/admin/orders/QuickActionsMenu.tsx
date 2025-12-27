'use client';

import React from 'react';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Tooltip,
  useToast,
  useColorModeValue,
  Divider,
  Text,
  Badge,
  HStack,
} from '@chakra-ui/react';
import {
  FiMoreVertical,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiEdit,
  FiCopy,
  FiTrash2,
  FiSend,
  FiMessageSquare,
  FiDollarSign,
  FiUser,
} from 'react-icons/fi';

interface QuickActionsMenuProps {
  orderId: string;
  orderReference: string;
  currentStatus: string;
  onStatusChange?: (orderId: string, newStatus: string) => Promise<void>;
  onEdit?: (orderId: string) => void;
  onDuplicate?: (orderId: string) => void;
  onDelete?: (orderId: string) => void;
  onSendEmail?: (orderId: string) => void;
  onSendSMS?: (orderId: string) => void;
  onAssignDriver?: (orderId: string) => void;
  onRequestPayment?: (orderId: string) => void;
  disabled?: boolean;
}

export function QuickActionsMenu({
  orderId,
  orderReference,
  currentStatus,
  onStatusChange,
  onEdit,
  onDuplicate,
  onDelete,
  onSendEmail,
  onSendSMS,
  onAssignDriver,
  onRequestPayment,
  disabled = false,
}: QuickActionsMenuProps) {
  const toast = useToast();
  const menuBg = useColorModeValue('#111111', '#111111');
  const textColor = useColorModeValue('#FFFFFF', '#FFFFFF');
  const borderColor = useColorModeValue('#333333', '#333333');
  const secondaryTextColor = useColorModeValue('#9ca3af', '#9ca3af');

  const handleStatusChange = async (newStatus: string) => {
    if (onStatusChange) {
      try {
        await onStatusChange(orderId, newStatus);
        toast({
          title: 'Status Updated',
          description: `Order ${orderReference} status changed to ${newStatus}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update order status',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const getStatusOptions = () => {
    const statusMap: Record<string, { next: string[]; icon: any; color: string }> = {
      pending: {
        next: ['confirmed', 'cancelled'],
        icon: FiClock,
        color: '#f59e0b',
      },
      confirmed: {
        next: ['assigned', 'in_progress', 'cancelled'],
        icon: FiCheckCircle,
        color: '#2563eb',
      },
      assigned: {
        next: ['in_progress', 'cancelled'],
        icon: FiUser,
        color: '#9333ea',
      },
      in_progress: {
        next: ['completed', 'cancelled'],
        icon: FiClock,
        color: '#06b6d4',
      },
      completed: {
        next: [],
        icon: FiCheckCircle,
        color: '#10b981',
      },
      cancelled: {
        next: [],
        icon: FiXCircle,
        color: '#ef4444',
      },
    };

    return statusMap[currentStatus.toLowerCase()] || statusMap.pending;
  };

  const statusOptions = getStatusOptions();

  return (
    <Menu>
      <Tooltip label="Quick Actions" placement="top">
        <MenuButton
          as={IconButton}
          icon={<FiMoreVertical />}
          variant="ghost"
          size="sm"
          isDisabled={disabled}
          color={textColor}
          _hover={{ bg: '#1a1a1a' }}
        />
      </Tooltip>
      <MenuList bg={menuBg} borderColor={borderColor} minW="200px">
        {/* Status Actions */}
        {statusOptions.next.length > 0 && (
          <>
            <Text px={3} py={2} fontSize="xs" fontWeight="bold" color={secondaryTextColor} textTransform="uppercase">
              Change Status
            </Text>
            {statusOptions.next.map((status) => (
              <MenuItem
                key={status}
                icon={<statusOptions.icon />}
                onClick={() => handleStatusChange(status)}
                bg={menuBg}
                color={textColor}
                _hover={{ bg: '#1a1a1a' }}
              >
                <HStack spacing={2}>
                  <Text>Mark as {status.replace('_', ' ')}</Text>
                  <Badge size="sm" colorScheme={
                    status === 'completed' ? 'green' :
                    status === 'cancelled' ? 'red' :
                    status === 'in_progress' ? 'blue' : 'gray'
                  }>
                    {status}
                  </Badge>
                </HStack>
              </MenuItem>
            ))}
            <Divider borderColor={borderColor} />
          </>
        )}

        {/* Communication Actions */}
        {(onSendEmail || onSendSMS) && (
          <>
            <Text px={3} py={2} fontSize="xs" fontWeight="bold" color={secondaryTextColor} textTransform="uppercase">
              Communication
            </Text>
            {onSendEmail && (
              <MenuItem
                icon={<FiSend />}
                onClick={() => onSendEmail(orderId)}
                bg={menuBg}
                color={textColor}
                _hover={{ bg: '#1a1a1a' }}
              >
                Send Email
              </MenuItem>
            )}
            {onSendSMS && (
              <MenuItem
                icon={<FiMessageSquare />}
                onClick={() => onSendSMS(orderId)}
                bg={menuBg}
                color={textColor}
                _hover={{ bg: '#1a1a1a' }}
              >
                Send SMS
              </MenuItem>
            )}
            <Divider borderColor={borderColor} />
          </>
        )}

        {/* Management Actions */}
        <Text px={3} py={2} fontSize="xs" fontWeight="bold" color={secondaryTextColor} textTransform="uppercase">
          Management
        </Text>
        {onEdit && (
          <MenuItem
            icon={<FiEdit />}
            onClick={() => onEdit(orderId)}
            bg={menuBg}
            color={textColor}
            _hover={{ bg: '#1a1a1a' }}
          >
            Edit Order
          </MenuItem>
        )}
        {onDuplicate && (
          <MenuItem
            icon={<FiCopy />}
            onClick={() => onDuplicate(orderId)}
            bg={menuBg}
            color={textColor}
            _hover={{ bg: '#1a1a1a' }}
          >
            Duplicate Order
          </MenuItem>
        )}
        {onAssignDriver && (
          <MenuItem
            icon={<FiUser />}
            onClick={() => onAssignDriver(orderId)}
            bg={menuBg}
            color={textColor}
            _hover={{ bg: '#1a1a1a' }}
          >
            Assign Driver
          </MenuItem>
        )}
        {onRequestPayment && (
          <MenuItem
            icon={<FiDollarSign />}
            onClick={() => onRequestPayment(orderId)}
            bg={menuBg}
            color={textColor}
            _hover={{ bg: '#1a1a1a' }}
          >
            Request Payment
          </MenuItem>
        )}
        {onDelete && (
          <>
            <Divider borderColor={borderColor} />
            <MenuItem
              icon={<FiTrash2 />}
              onClick={() => onDelete(orderId)}
              bg={menuBg}
              color="#ef4444"
              _hover={{ bg: '#1a1a1a' }}
            >
              Delete Order
            </MenuItem>
          </>
        )}
      </MenuList>
    </Menu>
  );
}

