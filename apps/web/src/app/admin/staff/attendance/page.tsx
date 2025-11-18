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
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiEdit,
  FiCheck,
  FiCalendar,
  FiClock,
  FiUser,
  FiDownload,
  FiFilter,
} from 'react-icons/fi';

interface Attendance {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  totalHours: number | null;
  notes: string | null;
  Staff: {
    id: string;
    employeeId: string;
    department: string | null;
    User: {
      name: string | null;
      email: string;
    };
  };
}

export default function AdminAttendancePage() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    staffId: '',
    department: '',
    status: '',
    startDate: '',
    endDate: '',
  });
  const toast = useToast();

  useEffect(() => {
    fetchAttendance();
    fetchStats();
  }, [filters]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.staffId) params.append('staffId', filters.staffId);
      if (filters.department) params.append('department', filters.department);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`/api/admin/staff/attendance?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setAttendances(data.attendances);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch attendance',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/staff/attendance/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/staff/attendance/${id}/approve`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Attendance approved',
          status: 'success',
          duration: 3000,
        });
        fetchAttendance();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve attendance',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      present: 'green',
      absent: 'red',
      late: 'orange',
      early_leave: 'yellow',
      half_day: 'purple',
      pending: 'gray',
      approved: 'blue',
      rejected: 'red',
    };

    return (
      <Badge colorScheme={colors[status] || 'gray'} textTransform="capitalize">
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const formatTime = (time: string | null) => {
    if (!time) return 'N/A';
    return new Date(time).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Staff Attendance</Heading>
        <HStack>
          <Button leftIcon={<FiDownload />} variant="outline">
            Export CSV
          </Button>
          <Button leftIcon={<FiDownload />} variant="outline">
            Export PDF
          </Button>
        </HStack>
      </Flex>

      {/* Stats Cards */}
      {stats && (
        <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={4} mb={6}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Staff</StatLabel>
                <StatNumber>{stats.totalStaff}</StatNumber>
                <StatHelpText>{stats.activeStaff} active</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Today's Attendance</StatLabel>
                <StatNumber>{stats.todayAttendances}</StatNumber>
                <StatHelpText>Checked in today</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Records</StatLabel>
                <StatNumber>{stats.totalAttendances}</StatNumber>
                <StatHelpText>Last 30 days</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Status Breakdown</StatLabel>
                <StatNumber>
                  {stats.statusBreakdown?.find((s: any) => s.status === 'present')?.count || 0}
                </StatNumber>
                <StatHelpText>Present records</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </Grid>
      )}

      {/* Filters */}
      <Card mb={6}>
        <CardBody>
          <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
            <Input
              placeholder="Staff ID"
              value={filters.staffId}
              onChange={(e) => setFilters({ ...filters, staffId: e.target.value })}
              maxW="200px"
            />
            <Input
              placeholder="Department"
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              maxW="200px"
            />
            <Select
              placeholder="All Status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              maxW="200px"
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="early_leave">Early Leave</option>
              <option value="half_day">Half Day</option>
              <option value="pending">Pending</option>
            </Select>
            <Input
              type="date"
              placeholder="Start Date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              maxW="200px"
            />
            <Input
              type="date"
              placeholder="End Date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              maxW="200px"
            />
          </Stack>
        </CardBody>
      </Card>

      {/* Attendance Table */}
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
                  <Th>Date</Th>
                  <Th>Staff</Th>
                  <Th>Department</Th>
                  <Th>Check In</Th>
                  <Th>Check Out</Th>
                  <Th>Hours</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {attendances.length === 0 ? (
                  <Tr>
                    <Td colSpan={8} textAlign="center" py={8}>
                      <Text color="gray.500">No attendance records found</Text>
                    </Td>
                  </Tr>
                ) : (
                  attendances.map((attendance) => (
                    <Tr key={attendance.id}>
                      <Td>
                        {new Date(attendance.date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Td>
                      <Td>
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="medium">
                            {attendance.Staff.User.name || 'N/A'}
                          </Text>
                          <Text fontSize="sm" color="gray.500">
                            {attendance.Staff.employeeId}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>{attendance.Staff.department || 'N/A'}</Td>
                      <Td>
                        <VStack align="start" spacing={0}>
                          <Text>{formatTime(attendance.checkIn)}</Text>
                          {attendance.lateMinutes > 0 && (
                            <Badge colorScheme="orange" fontSize="xs">
                              +{attendance.lateMinutes}m
                            </Badge>
                          )}
                        </VStack>
                      </Td>
                      <Td>
                        <VStack align="start" spacing={0}>
                          <Text>{formatTime(attendance.checkOut)}</Text>
                          {attendance.earlyLeaveMinutes > 0 && (
                            <Badge colorScheme="yellow" fontSize="xs">
                              -{attendance.earlyLeaveMinutes}m
                            </Badge>
                          )}
                        </VStack>
                      </Td>
                      <Td>{attendance.totalHours?.toFixed(2) || 'N/A'}h</Td>
                      <Td>{getStatusBadge(attendance.status)}</Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            icon={<FiEdit />}
                            aria-label="Edit"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedAttendance(attendance);
                              setIsEditModalOpen(true);
                            }}
                          />
                          {attendance.status === 'pending' && (
                            <IconButton
                              icon={<FiCheck />}
                              aria-label="Approve"
                              size="sm"
                              colorScheme="green"
                              variant="ghost"
                              onClick={() => handleApprove(attendance.id)}
                            />
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Edit Attendance Modal */}
      {selectedAttendance && (
        <EditAttendanceModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedAttendance(null);
          }}
          attendance={selectedAttendance}
          onSuccess={() => {
            setIsEditModalOpen(false);
            setSelectedAttendance(null);
            fetchAttendance();
          }}
        />
      )}
    </Box>
  );
}

// Edit Attendance Modal Component
function EditAttendanceModal({
  isOpen,
  onClose,
  attendance,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  attendance: Attendance;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    checkIn: attendance.checkIn
      ? new Date(attendance.checkIn).toISOString().slice(0, 16)
      : '',
    checkOut: attendance.checkOut
      ? new Date(attendance.checkOut).toISOString().slice(0, 16)
      : '',
    notes: attendance.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData: any = {};
      if (formData.checkIn) {
        updateData.checkIn = new Date(formData.checkIn).toISOString();
      }
      if (formData.checkOut) {
        updateData.checkOut = new Date(formData.checkOut).toISOString();
      }
      if (formData.notes !== undefined) {
        updateData.notes = formData.notes;
      }

      const response = await fetch(`/api/admin/staff/attendance/${attendance.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Attendance updated successfully',
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
        description: error.message || 'Failed to update attendance',
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
        <ModalHeader>Edit Attendance</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <Stack spacing={4}>
              <FormControl>
                <FormLabel>Check In</FormLabel>
                <Input
                  type="datetime-local"
                  value={formData.checkIn}
                  onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Check Out</FormLabel>
                <Input
                  type="datetime-local"
                  value={formData.checkOut}
                  onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes..."
                />
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

