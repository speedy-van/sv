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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  Stack,
  Flex,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  GridItem,
  Badge,
} from '@chakra-ui/react';
import { FiDownload, FiCalendar, FiTrendingUp } from 'react-icons/fi';

export default function AdminReportsPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const toast = useToast();

  useEffect(() => {
    fetchReport();
  }, [period, startDate, endDate]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('period', period);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/admin/staff/attendance/reports?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setReport(data.report);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch report',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!report) return;

    const headers = ['Date', 'Staff', 'Employee ID', 'Check In', 'Check Out', 'Hours', 'Status'];
    const rows = report.attendances.map((a: any) => [
      new Date(a.date).toLocaleDateString(),
      a.Staff.User.name,
      a.Staff.employeeId,
      a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : 'N/A',
      a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : 'N/A',
      a.totalHours?.toFixed(2) || '0',
      a.status,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleExportPDF = () => {
    toast({
      title: 'Info',
      description: 'PDF export functionality will be implemented',
      status: 'info',
      duration: 3000,
    });
  };

  if (loading && !report) {
    return (
      <Box p={6}>
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" />
        </Flex>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Attendance Reports</Heading>
        <HStack>
          <Button leftIcon={<FiDownload />} onClick={handleExportCSV}>
            Export CSV
          </Button>
          <Button leftIcon={<FiDownload />} onClick={handleExportPDF}>
            Export PDF
          </Button>
        </HStack>
      </Flex>

      {/* Filters */}
      <Card mb={6}>
        <CardBody>
          <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
            <Select value={period} onChange={(e) => setPeriod(e.target.value)} maxW="200px">
              <option value="day">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </Select>
            <Box>
              <Text fontSize="sm" mb={1}>
                Start Date
              </Text>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </Box>
            <Box>
              <Text fontSize="sm" mb={1}>
                End Date
              </Text>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </Box>
          </Stack>
        </CardBody>
      </Card>

      {report && (
        <>
          {/* Summary Stats */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={4} mb={6}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Days</StatLabel>
                  <StatNumber>{report.summary.totalDays}</StatNumber>
                  <StatHelpText>
                    {report.startDate && new Date(report.startDate).toLocaleDateString()} -{' '}
                    {report.endDate && new Date(report.endDate).toLocaleDateString()}
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Present Days</StatLabel>
                  <StatNumber>{report.summary.presentDays}</StatNumber>
                  <StatHelpText>
                    {report.summary.totalDays > 0
                      ? ((report.summary.presentDays / report.summary.totalDays) * 100).toFixed(1)
                      : 0}
                    % attendance rate
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Hours</StatLabel>
                  <StatNumber>{report.summary.totalHours.toFixed(1)}</StatNumber>
                  <StatHelpText>Hours worked</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Late Days</StatLabel>
                  <StatNumber>{report.summary.lateDays}</StatNumber>
                  <StatHelpText>
                    {report.summary.earlyLeaveDays} early leaves
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </Grid>

          {/* By Staff Summary */}
          {report.byStaff && report.byStaff.length > 0 && (
            <Card mb={6}>
              <CardBody>
                <Heading size="md" mb={4}>
                  Summary by Staff
                </Heading>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Staff</Th>
                      <Th>Total Days</Th>
                      <Th>Present</Th>
                      <Th>Absent</Th>
                      <Th>Late</Th>
                      <Th>Total Hours</Th>
                      <Th>Attendance Rate</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {report.byStaff.map((staff: any, idx: number) => (
                      <Tr key={idx}>
                        <Td>
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="medium">
                              {staff.staff.User.name || 'N/A'}
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              {staff.staff.employeeId}
                            </Text>
                          </VStack>
                        </Td>
                        <Td>{staff.totalDays}</Td>
                        <Td>{staff.presentDays}</Td>
                        <Td>{staff.absentDays}</Td>
                        <Td>{staff.lateDays}</Td>
                        <Td>{staff.totalHours.toFixed(1)}h</Td>
                        <Td>
                          <Badge
                            colorScheme={staff.attendanceRate >= 95 ? 'green' : 'orange'}
                          >
                            {staff.attendanceRate.toFixed(1)}%
                          </Badge>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          )}

          {/* Detailed Records */}
          <Card>
            <CardBody>
              <Heading size="md" mb={4}>
                Detailed Records
              </Heading>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Date</Th>
                    <Th>Staff</Th>
                    <Th>Check In</Th>
                    <Th>Check Out</Th>
                    <Th>Hours</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {report.attendances.length === 0 ? (
                    <Tr>
                      <Td colSpan={6} textAlign="center" py={8}>
                        <Text color="gray.500">No records found</Text>
                      </Td>
                    </Tr>
                  ) : (
                    report.attendances.map((attendance: any) => (
                      <Tr key={attendance.id}>
                        <Td>
                          {new Date(attendance.date).toLocaleDateString('en-GB')}
                        </Td>
                        <Td>
                          {attendance.Staff.User.name} ({attendance.Staff.employeeId})
                        </Td>
                        <Td>
                          {attendance.checkIn
                            ? new Date(attendance.checkIn).toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'N/A'}
                        </Td>
                        <Td>
                          {attendance.checkOut
                            ? new Date(attendance.checkOut).toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'N/A'}
                        </Td>
                        <Td>{attendance.totalHours?.toFixed(2) || '0'}h</Td>
                        <Td>
                          <Badge
                            colorScheme={
                              attendance.status === 'present'
                                ? 'green'
                                : attendance.status === 'absent'
                                ? 'red'
                                : 'orange'
                            }
                            textTransform="capitalize"
                          >
                            {attendance.status.replace('_', ' ')}
                          </Badge>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        </>
      )}
    </Box>
  );
}

