'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Select,
  Switch,
  FormHelperText,
  Alert,
  AlertIcon,
  useToast,
  Card,
  CardBody,
  Grid,
  Divider,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiShield,
  FiUser,
  FiMail,
  FiMoreVertical,
  FiCheck,
  FiX,
} from 'react-icons/fi';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  adminRole: string;
  isActive: boolean;
  lastLogin?: string;
  twoFactorEnabled: boolean;
}

interface Role {
  name: string;
  description: string;
  permissions: string[];
}

const roles: Role[] = [
  {
    name: 'superadmin',
    description: 'Full system access and control',
    permissions: ['*'],
  },
  {
    name: 'ops',
    description: 'Operations management and dispatch',
    permissions: [
      'orders.read',
      'orders.write',
      'orders.delete',
      'drivers.read',
      'drivers.write',
      'dispatch.read',
      'dispatch.write',
      'customers.read',
      'customers.write',
    ],
  },
  {
    name: 'support',
    description: 'Customer support and issue resolution',
    permissions: [
      'orders.read',
      'customers.read',
      'customers.write',
      'support.read',
      'support.write',
    ],
  },
  {
    name: 'reviewer',
    description: 'Driver applications and compliance review',
    permissions: [
      'drivers.read',
      'drivers.write',
      'compliance.read',
      'compliance.write',
    ],
  },
  {
    name: 'finance',
    description: 'Financial operations and reporting',
    permissions: [
      'orders.read',
      'finance.read',
      'finance.write',
      'payouts.read',
      'payouts.write',
      'refunds.read',
      'refunds.write',
    ],
  },
  {
    name: 'read_only',
    description: 'View-only access to all data',
    permissions: [
      'orders.read',
      'drivers.read',
      'customers.read',
      'finance.read',
      'analytics.read',
    ],
  },
];

export default function TeamSettings() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const bgColor = 'bg.surface';
  const borderColor = 'border.primary';

  // Fetch admin users from database
  const fetchAdminUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error('Failed to fetch admin users');
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin users',
        status: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const handleInviteUser = () => {
    setSelectedUser(null);
    setIsEditing(false);
    onOpen();
  };

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setIsEditing(true);
    onOpen();
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      setUsers(users.filter(user => user.id !== userId));
      toast({
        title: 'User removed',
        description: 'The user has been removed from the admin team.',
        status: 'success',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove user',
        status: 'error',
      });
    }
  };

  const handleSaveUser = async (userData: Partial<AdminUser>) => {
    try {
      let response;

      if (isEditing && selectedUser) {
        // Update existing user
        response = await fetch(`/api/admin/users/${selectedUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
        });
      } else {
        // Create new user
        response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
        });
      }

      if (!response.ok) {
        throw new Error('Failed to save user');
      }

      // Refresh the users list
      await fetchAdminUsers();

      toast({
        title: isEditing ? 'Admin updated' : 'Admin added',
        description: isEditing
          ? 'The admin user has been updated successfully.'
          : 'New admin user has been added to the team.',
        status: 'success',
      });
    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        title: 'Error',
        description: 'Failed to save user',
        status: 'error',
      });
    }
    onClose();
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      superadmin: 'red',
      ops: 'blue',
      support: 'green',
      reviewer: 'purple',
      finance: 'orange',
      read_only: 'gray',
    };
    return colors[role] || 'gray';
  };

  const formatLastLogin = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  return (
    <Box p={6}>
      <VStack align="start" spacing={6} w="full">
        <HStack justify="space-between" w="full">
          <Box>
            <Heading size="lg" mb={2}>
              Team & Roles
            </Heading>
            <Text color="gray.600">
              Manage admin users, roles, and permissions for your team.
            </Text>
          </Box>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={handleInviteUser}
          >
            Add Admin
          </Button>
        </HStack>

        {/* Role Overview */}
        <Card bg={bgColor} border="1px solid" borderColor={borderColor}>
          <CardBody>
            <Heading size="md" mb={4}>
              Role Permissions
            </Heading>
            <Grid
              templateColumns="repeat(auto-fit, minmax(300px, 1fr))"
              gap={4}
            >
              {roles.map(role => (
                <Box
                  key={role.name}
                  p={4}
                  border="1px solid"
                  borderColor={borderColor}
                  borderRadius="md"
                >
                  <HStack mb={2}>
                    <Badge colorScheme={getRoleColor(role.name)}>
                      {role.name}
                    </Badge>
                  </HStack>
                  <Text fontSize="sm" color="gray.600" mb={3}>
                    {role.description}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {role.permissions.length === 1 &&
                    role.permissions[0] === '*'
                      ? 'All permissions'
                      : `${role.permissions.length} permissions`}
                  </Text>
                </Box>
              ))}
            </Grid>
          </CardBody>
        </Card>

        {/* Users Table */}
        <Card bg={bgColor} border="1px solid" borderColor={borderColor}>
          <CardBody>
            <Heading size="md" mb={4}>
              Admin Users
            </Heading>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Role</Th>
                  <Th>Status</Th>
                  <Th>2FA</Th>
                  <Th>Last Login</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {loading ? (
                  <Tr>
                    <Td colSpan={7} textAlign="center">
                      Loading...
                    </Td>
                  </Tr>
                ) : users.length === 0 ? (
                  <Tr>
                    <Td colSpan={7} textAlign="center">
                      No admin users found.
                    </Td>
                  </Tr>
                ) : (
                  users.map(user => (
                    <Tr key={user.id}>
                      <Td>
                        <HStack>
                          <FiUser />
                          <Text fontWeight="medium">{user.name}</Text>
                        </HStack>
                      </Td>
                      <Td>
                        <HStack>
                          <FiMail />
                          <Text>{user.email}</Text>
                        </HStack>
                      </Td>
                      <Td>
                        <Badge colorScheme={getRoleColor(user.adminRole)}>
                          {user.adminRole}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={user.isActive ? 'green' : 'red'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </Td>
                      <Td>
                        {user.twoFactorEnabled ? (
                          <FiCheck color="green" />
                        ) : (
                          <FiX color="red" />
                        )}
                      </Td>
                      <Td>{formatLastLogin(user.lastLogin)}</Td>
                      <Td>
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            icon={<FiMoreVertical />}
                            variant="ghost"
                            size="sm"
                          />
                          <MenuList>
                            <MenuItem
                              icon={<FiEdit />}
                              onClick={() => handleEditUser(user)}
                            >
                              Edit
                            </MenuItem>
                            <MenuItem
                              icon={<FiTrash2 />}
                              color="red.500"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              Remove
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </CardBody>
        </Card>

        {/* User Modal */}
        <UserModal
          isOpen={isOpen}
          onClose={onClose}
          user={selectedUser}
          isEditing={isEditing}
          roles={roles}
          onSave={handleSaveUser}
        />
      </VStack>
    </Box>
  );
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUser | null;
  isEditing: boolean;
  roles: Role[];
  onSave: (userData: Partial<AdminUser>) => void;
}

function UserModal({
  isOpen,
  onClose,
  user,
  isEditing,
  roles,
  onSave,
}: UserModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    adminRole: 'read_only',
    isActive: true,
  });

  useEffect(() => {
    if (user && isEditing) {
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        adminRole: user.adminRole,
        isActive: user.isActive,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        adminRole: 'read_only',
        isActive: true,
      });
    }
  }, [user, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>{isEditing ? 'Edit Admin' : 'Add New Admin'}</ModalHeader>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter full name"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={e =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Enter email address"
                />
              </FormControl>

              <FormControl isRequired={!isEditing}>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={e =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder={isEditing ? "Leave blank to keep current password" : "Enter password"}
                  minLength={8}
                  disabled={isEditing}
                />
                <FormHelperText>
                  {isEditing 
                    ? "Leave blank to keep the current password unchanged."
                    : "Password must be at least 8 characters long."
                  }
                </FormHelperText>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Role</FormLabel>
                <Select
                  value={formData.adminRole}
                  onChange={e =>
                    setFormData({ ...formData, adminRole: e.target.value })
                  }
                >
                  {roles.map(role => (
                    <option key={role.name} value={role.name}>
                      {role.name} - {role.description}
                    </option>
                  ))}
                </Select>
                <FormHelperText>
                  Choose the appropriate role for this user's responsibilities.
                </FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>Status</FormLabel>
                <HStack>
                  <Switch
                    isChecked={formData.isActive}
                    onChange={e =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                  />
                  <Text>{formData.isActive ? 'Active' : 'Inactive'}</Text>
                </HStack>
                <FormHelperText>
                  Inactive users cannot access the admin panel.
                </FormHelperText>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" colorScheme="blue">
              {isEditing ? 'Update Admin' : 'Add Admin'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
