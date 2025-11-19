'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Card,
  CardBody,
  VStack,
  HStack,
  Button,
  useToast,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
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
  Input,
  Select,
  Stack,
  Flex,
  Spinner,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Divider,
  RadioGroup,
  Radio,
  FormHelperText,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiMoreVertical,
  FiClock,
  FiUser,
  FiMail,
  FiPhone,
  FiBriefcase,
} from 'react-icons/fi';

interface Staff {
  id: string;
  employeeId: string;
  department: string | null;
  position: string | null;
  employmentType: string;
  status: string;
  workSchedule: any;
  User: {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    role?: string;
    adminRole?: string;
  };
}

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRotaModalOpen, setIsRotaModalOpen] = useState(false);
  const [isPayslipOpen, setIsPayslipOpen] = useState(false);
  const toast = useToast();

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  useEffect(() => {
    fetchStaff();
  }, [departmentFilter, statusFilter]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (departmentFilter && departmentFilter.trim()) params.append('department', departmentFilter);
      if (statusFilter && statusFilter.trim()) params.append('status', statusFilter);
      if (searchTerm && searchTerm.trim()) params.append('search', searchTerm);

      const response = await fetch(`/api/admin/staff?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        setStaff(data.staff);
      } else {
        throw new Error(data.error || 'Failed to fetch staff');
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch staff',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/staff/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Staff deleted successfully',
          status: 'success',
          duration: 3000,
        });
        fetchStaff();
        onDeleteClose();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete staff',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const filteredStaff = staff.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.employeeId.toLowerCase().includes(term) ||
      s.User.name?.toLowerCase().includes(term) ||
      s.User.email.toLowerCase().includes(term)
    );
  });

  const departments = Array.from(
    new Set(staff.map((s) => s.department).filter((d): d is string => !!d))
  );

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Staff Management</Heading>
        <HStack spacing={3}>
          <Button variant="outline" onClick={async () => {
            try {
              const res = await fetch('/api/admin/staff/sync-admins', { method: 'POST' });
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              const data = await res.json();
              if (!data.success) throw new Error(data.error || 'Failed to sync admins');
              toast({
                title: 'Admins synced',
                description: `Created: ${data.created}, Skipped: ${data.skipped}`,
                status: 'success',
                duration: 3000,
              });
              fetchStaff();
            } catch (e: any) {
              toast({
                title: 'Sync failed',
                description: e?.message || 'Unable to sync admins',
                status: 'error',
                duration: 4000,
              });
            }
          }}>
            Sync Admins
          </Button>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={() => setIsCreateModalOpen(true)}
          >
            Add Staff
          </Button>
        </HStack>
      </Flex>

      <Flex justify="flex-end" mb={4}>
        <Button variant="outline" onClick={() => setIsPayslipOpen(true)}>
          Generate Payslips
        </Button>
      </Flex>

      {/* Filters */}
      <Card mb={6}>
        <CardBody>
          <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
            <InputGroup flex={1}>
              <InputLeftElement pointerEvents="none">
                <FiSearch />
              </InputLeftElement>
              <Input
                placeholder="Search by name, email, or employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            <Select
              placeholder="All Departments"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              maxW="200px"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </Select>
            <Select
              placeholder="All Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              maxW="200px"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="terminated">Terminated</option>
              <option value="on_leave">On Leave</option>
            </Select>
          </Stack>
        </CardBody>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardBody>
          {loading ? (
            <Flex justify="center" p={8}>
              <Spinner size="xl" />
            </Flex>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Employee ID</Th>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Phone</Th>
                  <Th>Department</Th>
                  <Th>Position</Th>
                  <Th>Source</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredStaff.length === 0 ? (
                  <Tr>
                    <Td colSpan={8} textAlign="center" py={8}>
                      <Text color="gray.500">No staff found</Text>
                    </Td>
                  </Tr>
                ) : (
                  filteredStaff.map((s) => (
                    <Tr key={s.id}>
                      <Td fontWeight="medium">{s.employeeId}</Td>
                      <Td>{s.User.name || 'N/A'}</Td>
                      <Td>{s.User.email}</Td>
                      <Td>{s.User.phone || 'N/A'}</Td>
                      <Td>{s.department || 'N/A'}</Td>
                      <Td>{s.position || 'N/A'}</Td>
                      <Td>
                        {s.employeeId?.startsWith('ADM-') || s.User.role === 'admin' ? (
                          <Badge colorScheme="green">Admin Sync</Badge>
                        ) : (
                          <Badge colorScheme="gray">Standard</Badge>
                        )}
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={
                            s.status === 'active'
                              ? 'green'
                              : s.status === 'suspended'
                              ? 'red'
                              : s.status === 'on_leave'
                              ? 'yellow'
                              : 'gray'
                          }
                        >
                          {s.status}
                        </Badge>
                      </Td>
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
                              onClick={() => {
                                setSelectedStaff(s);
                                setIsEditModalOpen(true);
                              }}
                            >
                              Edit
                            </MenuItem>
                            <MenuItem
                              icon={<FiClock />}
                              onClick={() => {
                                setSelectedStaff(s);
                                setIsRotaModalOpen(true);
                              }}
                            >
                              Edit Rota
                            </MenuItem>
                            <MenuDivider />
                            <MenuItem
                              icon={<FiTrash2 />}
                              color="red.500"
                              onClick={() => {
                                setSelectedStaff(s);
                                onDeleteOpen();
                              }}
                            >
                              Delete
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Create Staff Modal */}
      <CreateStaffModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          fetchStaff();
        }}
      />

      {/* Edit Staff Modal */}
      {selectedStaff && (
        <>
          <EditStaffModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedStaff(null);
            }}
            staff={selectedStaff}
            onSuccess={() => {
              setIsEditModalOpen(false);
              setSelectedStaff(null);
              fetchStaff();
            }}
          />
          <RotaEditorModal
            isOpen={isRotaModalOpen}
            onClose={() => {
              setIsRotaModalOpen(false);
              setSelectedStaff(null);
            }}
            staff={selectedStaff}
            onSuccess={() => {
              setIsRotaModalOpen(false);
              setSelectedStaff(null);
              fetchStaff();
            }}
          />
        </>
      )}

      {/* Payslip Generator Modal */}
      <PayslipGeneratorModal
        isOpen={isPayslipOpen}
        onClose={() => setIsPayslipOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Staff</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Are you sure you want to delete {selectedStaff?.User.name}? This action cannot be
              undone.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteClose}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={() => selectedStaff && handleDelete(selectedStaff.id)}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

// Create Staff Modal Component
function CreateStaffModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    employeeId: '',
    department: '',
    position: '',
    employmentType: 'full_time',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Staff created successfully',
          status: 'success',
          duration: 3000,
        });
        onSuccess();
        setFormData({
          email: '',
          name: '',
          phone: '',
          employeeId: '',
          department: '',
          position: '',
          employmentType: 'full_time',
          password: '',
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create staff',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add New Staff</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Phone</FormLabel>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Employee ID</FormLabel>
                <Input
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Department</FormLabel>
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Position</FormLabel>
                <Input
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Employment Type</FormLabel>
                <Select
                  value={formData.employmentType}
                  onChange={(e) =>
                    setFormData({ ...formData, employmentType: e.target.value })
                  }
                  sx={{
                    'option': {
                      color: 'black',
                    },
                  }}
                >
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="temporary">Temporary</option>
                  <option value="intern">Intern</option>
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" colorScheme="blue" isLoading={loading}>
              Create
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

// Edit Staff Modal Component
function EditStaffModal({
  isOpen,
  onClose,
  staff,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  staff: Staff;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: staff.User.name || '',
    phone: staff.User.phone || '',
    employeeId: staff.employeeId,
    department: staff.department || '',
    position: staff.position || '',
    employmentType: staff.employmentType,
    status: staff.status,
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/staff/${staff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Staff updated successfully',
          status: 'success',
          duration: 3000,
        });
        onSuccess();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update staff',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit Staff</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <Stack spacing={4}>
              <FormControl>
                <FormLabel>Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Phone</FormLabel>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Employee ID</FormLabel>
                <Input
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Department</FormLabel>
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Position</FormLabel>
                <Input
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Employment Type</FormLabel>
                <Select
                  value={formData.employmentType}
                  onChange={(e) =>
                    setFormData({ ...formData, employmentType: e.target.value })
                  }
                  sx={{
                    'option': {
                      color: 'black',
                    },
                  }}
                >
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="temporary">Temporary</option>
                  <option value="intern">Intern</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="terminated">Terminated</option>
                  <option value="on_leave">On Leave</option>
                </Select>
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" colorScheme="blue" isLoading={loading}>
              Update
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

// Rota Editor Modal Component
function RotaEditorModal({
  isOpen,
  onClose,
  staff,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  staff: Staff;
  onSuccess: () => void;
}) {
  const [workSchedule, setWorkSchedule] = useState(
    staff.workSchedule || {
      defaultShift: { start: '09:00', end: '17:00' },
      breakMinutes: 60,
      minHours: 8,
      weeklyOverrides: {},
    }
  );
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/staff/${staff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workSchedule }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Rota updated successfully',
          status: 'success',
          duration: 3000,
        });
        onSuccess();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update rota',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDefaultShift = (field: 'start' | 'end', value: string) => {
    setWorkSchedule({
      ...workSchedule,
      defaultShift: {
        ...workSchedule.defaultShift,
        [field]: value,
      },
    });
  };

  const updateDayOverride = (day: string, field: 'start' | 'end', value: string) => {
    const overrides = workSchedule.weeklyOverrides || {};
    if (!overrides[day]) {
      overrides[day] = { start: '09:00', end: '17:00' };
    }
    overrides[day][field] = value;
    setWorkSchedule({
      ...workSchedule,
      weeklyOverrides: overrides,
    });
  };

  const removeDayOverride = (day: string) => {
    const overrides = { ...workSchedule.weeklyOverrides };
    delete overrides[day];
    setWorkSchedule({
      ...workSchedule,
      weeklyOverrides: overrides,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit Rota - {staff.User.name}</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <Stack spacing={6}>
              <Box>
                <Text fontWeight="bold" mb={3}>
                  Default Shift
                </Text>
                <HStack spacing={4}>
                  <FormControl>
                    <FormLabel>Start Time</FormLabel>
                    <Input
                      type="time"
                      value={workSchedule.defaultShift.start}
                      onChange={(e) => updateDefaultShift('start', e.target.value)}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>End Time</FormLabel>
                    <Input
                      type="time"
                      value={workSchedule.defaultShift.end}
                      onChange={(e) => updateDefaultShift('end', e.target.value)}
                    />
                  </FormControl>
                </HStack>
              </Box>

              <Divider />

              <Box>
                <Text fontWeight="bold" mb={3}>
                  Weekly Overrides
                </Text>
                <Stack spacing={3}>
                  {days.map((day) => {
                    const override = workSchedule.weeklyOverrides?.[day];
                    return (
                      <Box key={day} p={3} borderWidth={1} borderRadius="md">
                        <Flex justify="space-between" align="center" mb={2}>
                          <Text fontWeight="medium" textTransform="capitalize">
                            {day}
                          </Text>
                          {override ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeDayOverride(day)}
                            >
                              Remove Override
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              colorScheme="blue"
                              onClick={() =>
                                updateDayOverride(day, 'start', workSchedule.defaultShift.start)
                              }
                            >
                              Add Override
                            </Button>
                          )}
                        </Flex>
                        {override && (
                          <HStack spacing={4}>
                            <FormControl>
                              <FormLabel>Start</FormLabel>
                              <Input
                                type="time"
                                value={override.start}
                                onChange={(e) => updateDayOverride(day, 'start', e.target.value)}
                              />
                            </FormControl>
                            <FormControl>
                              <FormLabel>End</FormLabel>
                              <Input
                                type="time"
                                value={override.end}
                                onChange={(e) => updateDayOverride(day, 'end', e.target.value)}
                              />
                            </FormControl>
                          </HStack>
                        )}
                      </Box>
                    );
                  })}
                </Stack>
              </Box>

              <HStack spacing={4}>
                <FormControl>
                  <FormLabel>Break Minutes</FormLabel>
                  <Input
                    type="number"
                    value={workSchedule.breakMinutes}
                    onChange={(e) =>
                      setWorkSchedule({
                        ...workSchedule,
                        breakMinutes: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Minimum Hours</FormLabel>
                  <Input
                    type="number"
                    value={workSchedule.minHours}
                    onChange={(e) =>
                      setWorkSchedule({
                        ...workSchedule,
                        minHours: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </FormControl>
              </HStack>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" colorScheme="blue" isLoading={loading}>
              Save Rota
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

// Payslip Generator Modal
function PayslipGeneratorModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'custom'>('monthly');
  const [weekEnding, setWeekEnding] = useState<string>('');
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [summary, setSummary] = useState<any | null>(null);
  const toast = useToast();

  const generate = async () => {
    try {
      setLoading(true);
      setResults(null);
      setSummary(null);

      const payload: any = { period };
      if (period === 'weekly' && weekEnding) payload.weekEnding = weekEnding;
      if (period === 'monthly') {
        payload.month = month;
        payload.year = year;
      }
      if (period === 'custom' && from && to) {
        payload.from = new Date(from).toISOString();
        payload.to = new Date(to).toISOString();
      }

      const res = await fetch('/api/admin/staff/payslips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to generate payslips');

      setResults(data.payslips || []);
      setSummary(data.summary || null);
    } catch (e: any) {
      toast({
        title: 'Generation failed',
        description: e?.message || 'Unable to generate payslips',
        status: 'error',
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = () => {
    if (!results) return;
    const headers = [
      'Employee ID',
      'Name',
      'Email',
      'Hours',
      'Hourly Rate',
      'Gross Pay',
      'NI',
      'PAYE',
      'Other Deductions',
      'Net Pay',
    ];
    const rows = results.map((p: any) => [
      p.employeeId,
      p.name,
      p.email,
      p.hours,
      p.hourlyRate,
      p.grossPay,
      p.deductions?.ni ?? 0,
      p.deductions?.paye ?? 0,
      p.deductions?.other ?? 0,
      p.netPay,
    ]);
    const csv =
      headers.join(',') +
      '\n' +
      rows.map(r => r.map(v => (typeof v === 'string' && v.includes(',') ? `"${v}"` : v)).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payslips.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Generate Payslips</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={6}>
            <FormControl as={Box}>
              <FormLabel>Period</FormLabel>
              <RadioGroup value={period} onChange={(v) => setPeriod(v as any)}>
                <Stack direction="row">
                  <Radio value="weekly">Weekly</Radio>
                  <Radio value="monthly">Monthly</Radio>
                  <Radio value="custom">Custom Range</Radio>
                </Stack>
              </RadioGroup>
              <FormHelperText>
                Weekly uses a 7-day range ending on the selected date. Monthly uses calendar month.
              </FormHelperText>
            </FormControl>

            {period === 'weekly' && (
              <FormControl isRequired>
                <FormLabel>Week ending</FormLabel>
                <Input type="date" value={weekEnding} onChange={(e) => setWeekEnding(e.target.value)} />
              </FormControl>
            )}

            {period === 'monthly' && (
              <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Month</FormLabel>
                  <Select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(0, i).toLocaleString('en', { month: 'long' })}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Year</FormLabel>
                  <Input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value || `${new Date().getFullYear()}`))}
                  />
                </FormControl>
              </Stack>
            )}

            {period === 'custom' && (
              <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>From</FormLabel>
                  <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>To</FormLabel>
                  <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                </FormControl>
              </Stack>
            )}

            <Button colorScheme="blue" onClick={generate} isLoading={loading} alignSelf="flex-start">
              Generate
            </Button>

            {summary && (
              <Box>
                <Heading size="sm" mb={2}>
                  Summary
                </Heading>
                <Text fontSize="sm">Total Staff: {summary.totalStaff}</Text>
                <Text fontSize="sm">Total Hours: {summary.totalHours}</Text>
                <Text fontSize="sm">Total Gross: £{summary.totalGross}</Text>
                <Text fontSize="sm">Total Net: £{summary.totalNet}</Text>
              </Box>
            )}

            {results && results.length > 0 && (
              <Box>
                <Flex justify="space-between" align="center" mb={3}>
                  <Heading size="sm">Payslips</Heading>
                  <Button size="sm" onClick={downloadCsv}>
                    Download CSV
                  </Button>
                </Flex>
                <Box overflowX="auto">
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Employee ID</Th>
                        <Th>Name</Th>
                        <Th>Hours</Th>
                        <Th>Rate</Th>
                        <Th>Gross</Th>
                        <Th>Net</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {results.map((p: any) => (
                        <Tr key={p.staffId}>
                          <Td>{p.employeeId}</Td>
                          <Td>{p.name}</Td>
                          <Td>{p.hours}</Td>
                          <Td>£{p.hourlyRate}</Td>
                          <Td>£{p.grossPay}</Td>
                          <Td>£{p.netPay}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </Box>
            )}
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

