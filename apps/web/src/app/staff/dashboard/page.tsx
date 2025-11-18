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
  Spinner,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  GridItem,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
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
  Textarea,
} from '@chakra-ui/react';
import {
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiCalendar,
  FiLogIn,
  FiLogOut,
  FiAlertCircle,
} from 'react-icons/fi';

interface TodayAttendance {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  totalHours: number | null;
}

export default function StaffDashboardPage() {
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchTodayAttendance();
    fetchRecentAttendance();
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      const response = await fetch('/api/staff/attendance/today');
      const data = await response.json();

      if (data.success) {
        setTodayAttendance(data.attendance);
      }
    } catch (error) {
      console.error('Error fetching today attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentAttendance = async () => {
    try {
      const response = await fetch('/api/staff/attendance?limit=10');
      const data = await response.json();

      if (data.success) {
        setRecentAttendance(data.attendances);
      }
    } catch (error) {
      console.error('Error fetching recent attendance:', error);
    }
  };

  const handleCheckIn = async () => {
    try {
      setCheckingIn(true);
      const response = await fetch('/api/staff/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Checked in successfully',
          status: 'success',
          duration: 3000,
        });
        fetchTodayAttendance();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to check in',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setCheckingOut(true);
      const response = await fetch('/api/staff/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Checked out successfully',
          status: 'success',
          duration: 3000,
        });
        fetchTodayAttendance();
        fetchRecentAttendance();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to check out',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setCheckingOut(false);
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

  if (loading) {
    return (
      <Box p={6}>
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" />
        </Flex>
      </Box>
    );
  }

  const canCheckIn = !todayAttendance || !todayAttendance.checkIn;
  const canCheckOut = todayAttendance?.checkIn && !todayAttendance?.checkOut;

  return (
    <Box p={6}>
      <Heading size="lg" mb={6}>
        Staff Dashboard
      </Heading>

      {/* Today's Attendance Card */}
      <Card mb={6}>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Heading size="md">Today's Attendance</Heading>
            {todayAttendance ? (
              <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
                <Stat>
                  <StatLabel>Check In</StatLabel>
                  <StatNumber fontSize="2xl">
                    {formatTime(todayAttendance.checkIn)}
                  </StatNumber>
                  {todayAttendance.lateMinutes > 0 && (
                    <StatHelpText color="orange.500">
                      {todayAttendance.lateMinutes} minutes late
                    </StatHelpText>
                  )}
                </Stat>
                <Stat>
                  <StatLabel>Check Out</StatLabel>
                  <StatNumber fontSize="2xl">
                    {formatTime(todayAttendance.checkOut)}
                  </StatNumber>
                  {todayAttendance.earlyLeaveMinutes > 0 && (
                    <StatHelpText color="yellow.500">
                      {todayAttendance.earlyLeaveMinutes} minutes early
                    </StatHelpText>
                  )}
                </Stat>
                <Stat>
                  <StatLabel>Total Hours</StatLabel>
                  <StatNumber fontSize="2xl">
                    {todayAttendance.totalHours?.toFixed(2) || '0.00'}h
                  </StatNumber>
                  <StatHelpText>{getStatusBadge(todayAttendance.status)}</StatHelpText>
                </Stat>
              </Grid>
            ) : (
              <Text color="gray.500">No attendance record for today</Text>
            )}

            <HStack spacing={4}>
              <Button
                leftIcon={<FiLogIn />}
                colorScheme="green"
                size="lg"
                onClick={handleCheckIn}
                isLoading={checkingIn}
                isDisabled={!canCheckIn}
                flex={1}
              >
                Check In
              </Button>
              <Button
                leftIcon={<FiLogOut />}
                colorScheme="red"
                size="lg"
                onClick={handleCheckOut}
                isLoading={checkingOut}
                isDisabled={!canCheckOut}
                flex={1}
              >
                Check Out
              </Button>
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Quick Stats */}
      <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4} mb={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>This Month</StatLabel>
              <StatNumber>
                {recentAttendance.filter((a) => a.status === 'present').length}
              </StatNumber>
              <StatHelpText>Present days</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Hours</StatLabel>
              <StatNumber>
                {recentAttendance
                  .reduce((sum, a) => sum + (a.totalHours || 0), 0)
                  .toFixed(1)}
                h
              </StatNumber>
              <StatHelpText>This month</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Late Days</StatLabel>
              <StatNumber>
                {recentAttendance.filter((a) => a.status === 'late').length}
              </StatNumber>
              <StatHelpText>This month</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </Grid>

      {/* Recent Attendance */}
      <Card>
        <CardBody>
          <Heading size="md" mb={4}>
            Recent Attendance
          </Heading>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Date</Th>
                <Th>Check In</Th>
                <Th>Check Out</Th>
                <Th>Hours</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {recentAttendance.length === 0 ? (
                <Tr>
                  <Td colSpan={5} textAlign="center" py={8}>
                    <Text color="gray.500">No attendance records</Text>
                  </Td>
                </Tr>
              ) : (
                recentAttendance.map((attendance) => (
                  <Tr key={attendance.id}>
                    <Td>
                      {new Date(attendance.date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Td>
                    <Td>{formatTime(attendance.checkIn)}</Td>
                    <Td>{formatTime(attendance.checkOut)}</Td>
                    <Td>{attendance.totalHours?.toFixed(2) || '0.00'}h</Td>
                    <Td>{getStatusBadge(attendance.status)}</Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      {/* Leave Request Modal */}
      <LeaveRequestModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onSuccess={() => {
          setIsLeaveModalOpen(false);
          toast({
            title: 'Success',
            description: 'Leave request submitted',
            status: 'success',
            duration: 3000,
          });
        }}
      />
    </Box>
  );
}

// Leave Request Modal Component
function LeaveRequestModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    type: 'annual',
    startDate: '',
    endDate: '',
    reason: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Implement leave request API endpoint
      toast({
        title: 'Info',
        description: 'Leave request functionality will be implemented',
        status: 'info',
        duration: 3000,
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit leave request',
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
        <ModalHeader>Request Leave</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Leave Type</FormLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal Leave</option>
                  <option value="maternity">Maternity Leave</option>
                  <option value="paternity">Paternity Leave</option>
                  <option value="bereavement">Bereavement Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                  <option value="other">Other</option>
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Start Date</FormLabel>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>End Date</FormLabel>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Reason</FormLabel>
                <Textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Optional reason..."
                />
              </FormControl>
              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" colorScheme="blue" isLoading={loading}>
              Submit Request
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

