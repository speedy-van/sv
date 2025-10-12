'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  HStack,
  VStack,
  Text,
  Badge,
  Card,
  CardBody,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Grid,
  GridItem,
  Select,
  Input,
  FormControl,
  FormLabel,
  Checkbox,
  CheckboxGroup,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Textarea,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FiDownload,
  FiPlus,
  FiCalendar,
  FiBarChart2,
  FiTrendingUp,
  FiUsers,
  FiDollarSign,
  FiPackage,
  FiClock,
  FiMail,
  FiEdit,
  FiPlay,
  FiPause,
  FiTrash2,
  FiEye,
  FiFileText,
  FiSettings,
} from 'react-icons/fi';

interface Report {
  id: string;
  name: string;
  description: string;
  metrics: string[];
  dimensions: string[];
  filters: Record<string, any>;
  schedule: 'none' | 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  lastRun: string;
  nextRun?: string;
  status: 'active' | 'paused' | 'draft';
  createdAt: string;
  createdBy: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  metrics: string[];
  dimensions: string[];
  defaultFilters: Record<string, any>;
}

const AVAILABLE_METRICS = [
  { id: 'revenue', name: 'Revenue', category: 'financial', icon: FiDollarSign },
  { id: 'orders', name: 'Orders', category: 'operational', icon: FiPackage },
  {
    id: 'aov',
    name: 'Average Order Value',
    category: 'financial',
    icon: FiTrendingUp,
  },
  {
    id: 'completion_rate',
    name: 'Completion Rate',
    category: 'operational',
    icon: FiBarChart2,
  },
  {
    id: 'avg_rating',
    name: 'Average Rating',
    category: 'quality',
    icon: FiTrendingUp,
  },
  {
    id: 'driver_earnings',
    name: 'Driver Earnings',
    category: 'financial',
    icon: FiDollarSign,
  },
  {
    id: 'retention_rate',
    name: 'Retention Rate',
    category: 'customer',
    icon: FiUsers,
  },
  {
    id: 'ltv',
    name: 'Lifetime Value',
    category: 'customer',
    icon: FiDollarSign,
  },
  {
    id: 'repeat_orders',
    name: 'Repeat Orders',
    category: 'customer',
    icon: FiPackage,
  },
  {
    id: 'response_time',
    name: 'Response Time',
    category: 'operational',
    icon: FiClock,
  },
  {
    id: 'on_time_rate',
    name: 'On-Time Rate',
    category: 'operational',
    icon: FiClock,
  },
  {
    id: 'cancellation_rate',
    name: 'Cancellation Rate',
    category: 'operational',
    icon: FiBarChart2,
  },
];

const AVAILABLE_DIMENSIONS = [
  { id: 'date', name: 'Date', category: 'time', icon: FiCalendar },
  {
    id: 'service_type',
    name: 'Service Type',
    category: 'operational',
    icon: FiPackage,
  },
  { id: 'driver', name: 'Driver', category: 'people', icon: FiUsers },
  { id: 'week', name: 'Week', category: 'time', icon: FiCalendar },
  { id: 'month', name: 'Month', category: 'time', icon: FiCalendar },
  {
    id: 'customer_segment',
    name: 'Customer Segment',
    category: 'customer',
    icon: FiUsers,
  },
  {
    id: 'area',
    name: 'Service Area',
    category: 'operational',
    icon: FiBarChart2,
  },
  {
    id: 'vehicle_type',
    name: 'Vehicle Type',
    category: 'operational',
    icon: FiPackage,
  },
  {
    id: 'payment_method',
    name: 'Payment Method',
    category: 'financial',
    icon: FiDollarSign,
  },
  {
    id: 'booking_source',
    name: 'Booking Source',
    category: 'operational',
    icon: FiBarChart2,
  },
];

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'daily_revenue',
    name: 'Daily Revenue Report',
    description: 'Daily revenue breakdown with service type analysis',
    category: 'financial',
    metrics: ['revenue', 'orders', 'aov'],
    dimensions: ['date', 'service_type'],
    defaultFilters: { dateRange: '30d' },
  },
  {
    id: 'driver_performance',
    name: 'Driver Performance Weekly',
    description: 'Weekly driver performance metrics and earnings',
    category: 'operational',
    metrics: [
      'completion_rate',
      'avg_rating',
      'driver_earnings',
      'on_time_rate',
    ],
    dimensions: ['driver', 'week'],
    defaultFilters: { dateRange: '4w' },
  },
  {
    id: 'customer_retention',
    name: 'Customer Retention Monthly',
    description: 'Monthly customer retention and lifetime value analysis',
    category: 'customer',
    metrics: ['retention_rate', 'ltv', 'repeat_orders'],
    dimensions: ['customer_segment', 'month'],
    defaultFilters: { dateRange: '6m' },
  },
  {
    id: 'operational_kpis',
    name: 'Operational KPIs',
    description: 'Key operational metrics and performance indicators',
    category: 'operational',
    metrics: [
      'completion_rate',
      'response_time',
      'on_time_rate',
      'cancellation_rate',
    ],
    dimensions: ['date', 'area'],
    defaultFilters: { dateRange: '30d' },
  },
];

export default function AnalyticsReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState('30d');
  const [schedule, setSchedule] = useState<
    'none' | 'daily' | 'weekly' | 'monthly'
  >('none');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState('');
  const [previewData, setPreviewData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Load saved reports on mount
  useEffect(() => {
    loadSavedReports();
  }, []);

  const loadSavedReports = async () => {
    try {
      const response = await fetch('/api/admin/analytics/reports');
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = REPORT_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setReportName(template.name);
      setReportDescription(template.description);
      setSelectedMetrics(template.metrics);
      setSelectedDimensions(template.dimensions);
      setDateRange(template.defaultFilters.dateRange);
    }
  };

  const handleMetricToggle = (metricId: string) => {
    setSelectedMetrics(prev =>
      prev.includes(metricId)
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  };

  const handleDimensionToggle = (dimensionId: string) => {
    setSelectedDimensions(prev =>
      prev.includes(dimensionId)
        ? prev.filter(id => id !== dimensionId)
        : [...prev, dimensionId]
    );
  };

  const addRecipient = () => {
    if (newRecipient && !recipients.includes(newRecipient)) {
      setRecipients([...recipients, newRecipient]);
      setNewRecipient('');
    }
  };

  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r !== email));
  };

  const generatePreview = async () => {
    if (selectedMetrics.length === 0 || selectedDimensions.length === 0) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/analytics/reports/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: selectedMetrics,
          dimensions: selectedDimensions,
          filters: { dateRange },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewData(data);
      }
    } catch (error) {
      console.error('Failed to generate preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveReport = async () => {
    if (!reportName || selectedMetrics.length === 0) {
      return;
    }

    try {
      const response = await fetch('/api/admin/analytics/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reportName,
          description: reportDescription,
          metrics: selectedMetrics,
          dimensions: selectedDimensions,
          filters: { dateRange },
          schedule,
          recipients,
        }),
      });

      if (response.ok) {
        await loadSavedReports();
        // Reset form
        setReportName('');
        setReportDescription('');
        setSelectedMetrics([]);
        setSelectedDimensions([]);
        setSchedule('none');
        setRecipients([]);
        setSelectedTemplate('');
      }
    } catch (error) {
      console.error('Failed to save report:', error);
    }
  };

  const runReport = async (reportId: string) => {
    try {
      const response = await fetch(
        `/api/admin/analytics/reports/${reportId}/run`,
        {
          method: 'POST',
        }
      );
      if (response.ok) {
        // Refresh reports list
        await loadSavedReports();
      }
    } catch (error) {
      console.error('Failed to run report:', error);
    }
  };

  const toggleReportStatus = async (
    reportId: string,
    currentStatus: string
  ) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      const response = await fetch(`/api/admin/analytics/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        await loadSavedReports();
      }
    } catch (error) {
      console.error('Failed to update report status:', error);
    }
  };

  const deleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/analytics/reports/${reportId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await loadSavedReports();
      }
    } catch (error) {
      console.error('Failed to delete report:', error);
    }
  };

  const exportReport = async (reportId: string, format: 'csv' | 'xlsx') => {
    try {
      const response = await fetch(
        `/api/admin/analytics/reports/${reportId}/export?format=${format}`
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${reportId}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const getScheduleColor = (schedule: string) => {
    switch (schedule) {
      case 'daily':
        return 'blue';
      case 'weekly':
        return 'green';
      case 'monthly':
        return 'purple';
      default:
        return 'gray';
    }
  };

  return (
    <Box p={6} display="flex" flexDirection="column" gap={6}>
      {/* Header */}
      <HStack justify="space-between">
        <VStack align="start" spacing={1}>
          <Heading size="lg">Analytics Reports</Heading>
          <Text color="gray.600">
            Build, schedule, and manage custom reports
          </Text>
        </VStack>
        <HStack spacing={3}>
          <Button leftIcon={<FiDownload />} variant="outline" size="sm">
            Export All
          </Button>
          <Button leftIcon={<FiPlus />} colorScheme="blue" size="sm">
            Create Report
          </Button>
        </HStack>
      </HStack>

      <Tabs>
        <TabList>
          <Tab>Saved Reports</Tab>
          <Tab>Report Builder</Tab>
          <Tab>Scheduled Reports</Tab>
          <Tab>Templates</Tab>
        </TabList>

        <TabPanels>
          {/* Saved Reports Tab */}
          <TabPanel>
            <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
              {/* Reports List */}
              <Card bg={bgColor} borderColor={borderColor}>
                <CardBody>
                  <Heading size="md" mb={4}>
                    Saved Reports
                  </Heading>
                  <VStack spacing={4} align="stretch">
                    {reports.map(report => (
                      <Card
                        key={report.id}
                        variant="outline"
                        bg={bgColor}
                        borderColor={borderColor}
                      >
                        <CardBody>
                          <HStack justify="space-between" mb={3}>
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="bold">{report.name}</Text>
                              <Text fontSize="sm" color="gray.600">
                                {report.description}
                              </Text>
                            </VStack>
                            <Badge
                              colorScheme={getScheduleColor(report.schedule)}
                            >
                              {report.schedule}
                            </Badge>
                          </HStack>

                          <HStack spacing={4} mb={3}>
                            <VStack align="start" spacing={1}>
                              <Text fontSize="sm" fontWeight="bold">
                                Metrics
                              </Text>
                              <HStack spacing={1}>
                                {report.metrics.map(metric => (
                                  <Badge
                                    key={metric}
                                    size="sm"
                                    variant="outline"
                                  >
                                    {metric}
                                  </Badge>
                                ))}
                              </HStack>
                            </VStack>
                            <VStack align="start" spacing={1}>
                              <Text fontSize="sm" fontWeight="bold">
                                Dimensions
                              </Text>
                              <HStack spacing={1}>
                                {report.dimensions.map(dimension => (
                                  <Badge
                                    key={dimension}
                                    size="sm"
                                    variant="outline"
                                  >
                                    {dimension}
                                  </Badge>
                                ))}
                              </HStack>
                            </VStack>
                          </HStack>

                          <HStack justify="space-between">
                            <Text fontSize="sm" color="gray.600">
                              Last run:{' '}
                              {report.lastRun
                                ? new Date(report.lastRun).toLocaleString()
                                : 'Never'}
                            </Text>
                            <HStack spacing={2}>
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => runReport(report.id)}
                              >
                                <FiPlay />
                                <span style={{ marginLeft: '0.25rem' }}>Run</span>
                              </Button>
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => exportReport(report.id, 'csv')}
                              >
                                <FiDownload />
                                <span style={{ marginLeft: '0.25rem' }}>CSV</span>
                              </Button>
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => exportReport(report.id, 'xlsx')}
                              >
                                <FiFileText />
                                <span style={{ marginLeft: '0.25rem' }}>Excel</span>
                              </Button>
                              <Button size="xs" variant="outline">
                                <FiEdit />
                                <span style={{ marginLeft: '0.25rem' }}>Edit</span>
                              </Button>
                            </HStack>
                          </HStack>
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>
                </CardBody>
              </Card>

              {/* Quick Stats */}
              <VStack spacing={6} align="stretch">
                <Card bg={bgColor} borderColor={borderColor}>
                  <CardBody>
                    <Heading size="md" mb={4}>
                      Report Statistics
                    </Heading>
                    <VStack spacing={4} align="stretch">
                      <HStack justify="space-between">
                        <Text fontSize="sm">Total Reports</Text>
                        <Text fontWeight="bold">{reports.length}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm">Active Schedules</Text>
                        <Text fontWeight="bold">
                          {reports.filter(r => r.status === 'active').length}
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm">Last 24h Runs</Text>
                        <Text fontWeight="bold">12</Text>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>

                <Card bg={bgColor} borderColor={borderColor}>
                  <CardBody>
                    <Heading size="md" mb={4}>
                      Popular Reports
                    </Heading>
                    <VStack spacing={3} align="stretch">
                      <HStack justify="space-between">
                        <Text fontSize="sm">Daily Revenue</Text>
                        <Text fontSize="sm" color="gray.600">
                          24 runs
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm">Driver Performance</Text>
                        <Text fontSize="sm" color="gray.600">
                          12 runs
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm">Customer Retention</Text>
                        <Text fontSize="sm" color="gray.600">
                          8 runs
                        </Text>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </Grid>
          </TabPanel>

          {/* Report Builder Tab */}
          <TabPanel>
            <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6}>
              {/* Builder Form */}
              <Card bg={bgColor} borderColor={borderColor}>
                <CardBody>
                  <Heading size="md" mb={4}>
                    Report Builder
                  </Heading>
                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel>Start with Template</FormLabel>
                      <Select
                        value={selectedTemplate}
                        onChange={e => handleTemplateSelect(e.target.value)}
                        suppressHydrationWarning
                      >
                        <option value="">Choose a template...</option>
                        {REPORT_TEMPLATES.map(template => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Report Name</FormLabel>
                      <Input
                        value={reportName}
                        onChange={e => setReportName(e.target.value)}
                        placeholder="Enter report name"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Description</FormLabel>
                      <Textarea
                        value={reportDescription}
                        onChange={e => setReportDescription(e.target.value)}
                        placeholder="Enter report description"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Metrics</FormLabel>
                      <CheckboxGroup
                        value={selectedMetrics}
                        onChange={values =>
                          setSelectedMetrics(values as string[])
                        }
                      >
                        <SimpleGrid columns={2} spacing={2}>
                          {AVAILABLE_METRICS.map(metric => (
                            <Checkbox key={metric.id} value={metric.id}>
                              <HStack>
                                <Text fontSize="sm">{metric.name}</Text>
                                <Badge size="sm" variant="outline">
                                  {metric.category}
                                </Badge>
                              </HStack>
                            </Checkbox>
                          ))}
                        </SimpleGrid>
                      </CheckboxGroup>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Dimensions</FormLabel>
                      <CheckboxGroup
                        value={selectedDimensions}
                        onChange={values =>
                          setSelectedDimensions(values as string[])
                        }
                      >
                        <SimpleGrid columns={2} spacing={2}>
                          {AVAILABLE_DIMENSIONS.map(dimension => (
                            <Checkbox key={dimension.id} value={dimension.id}>
                              <HStack>
                                <Text fontSize="sm">{dimension.name}</Text>
                                <Badge size="sm" variant="outline">
                                  {dimension.category}
                                </Badge>
                              </HStack>
                            </Checkbox>
                          ))}
                        </SimpleGrid>
                      </CheckboxGroup>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Date Range</FormLabel>
                      <Select
                        value={dateRange}
                        onChange={e => setDateRange(e.target.value)}
                        suppressHydrationWarning
                      >
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                        <option value="6m">Last 6 months</option>
                        <option value="1y">Last year</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Schedule (Optional)</FormLabel>
                      <Select
                        value={schedule}
                        onChange={e => setSchedule(e.target.value as any)}
                        suppressHydrationWarning
                      >
                        <option value="none">No schedule</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </Select>
                    </FormControl>

                    {schedule !== 'none' && (
                      <FormControl>
                        <FormLabel>Recipients</FormLabel>
                        <HStack>
                          <Input
                            value={newRecipient}
                            onChange={e => setNewRecipient(e.target.value)}
                            placeholder="Enter email address"
                            onKeyPress={e =>
                              e.key === 'Enter' && addRecipient()
                            }
                          />
                          <Button onClick={addRecipient} size="sm">
                            Add
                          </Button>
                        </HStack>
                        <HStack spacing={1} mt={2} flexWrap="wrap">
                          {recipients.map(email => (
                            <Badge key={email} colorScheme="blue" size="sm">
                              {email}
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => removeRecipient(email)}
                                ml={1}
                              >
                                ×
                              </Button>
                            </Badge>
                          ))}
                        </HStack>
                      </FormControl>
                    )}

                    <HStack spacing={3}>
                      <Button
                        onClick={generatePreview}
                        disabled={loading || selectedMetrics.length === 0}
                      >
                        {loading ? 'Generating...' : 'Preview Report'}
                      </Button>
                      <Button
                        onClick={saveReport}
                        variant="outline"
                        disabled={!reportName || selectedMetrics.length === 0}
                      >
                        Save Report
                      </Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>

              {/* Preview */}
              <Card bg={bgColor} borderColor={borderColor}>
                <CardBody>
                  <Heading size="md" mb={4}>
                    Report Preview
                  </Heading>
                  {previewData ? (
                    <VStack spacing={4}>
                      <Text fontSize="sm" color="gray.600">
                        Preview data for {selectedMetrics.length} metrics ×{' '}
                        {selectedDimensions.length} dimensions
                      </Text>
                      <Box
                        bg="gray.50"
                        p={4}
                        rounded="lg"
                        maxH="400px"
                        overflow="auto"
                      >
                        <pre className="text-xs">
                          {JSON.stringify(previewData, null, 2)}
                        </pre>
                      </Box>
                    </VStack>
                  ) : (
                    <VStack spacing={4} justify="center" h="400px">
                      <FiBarChart2 size={48} color="#666" />
                      <Text color="gray.500">
                        Report preview will appear here
                      </Text>
                      <Text fontSize="sm" color="gray.400">
                        Select metrics and dimensions to generate preview
                      </Text>
                    </VStack>
                  )}
                </CardBody>
              </Card>
            </Grid>
          </TabPanel>

          {/* Scheduled Reports Tab */}
          <TabPanel>
            <Card bg={bgColor} borderColor={borderColor}>
              <CardBody>
                <Heading size="md" mb={4}>
                  Scheduled Reports
                </Heading>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Report Name</Th>
                      <Th>Schedule</Th>
                      <Th>Recipients</Th>
                      <Th>Last Run</Th>
                      <Th>Next Run</Th>
                      <Th>Status</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {reports
                      .filter(r => r.schedule !== 'none')
                      .map(report => (
                        <Tr key={report.id}>
                          <Td>
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="bold">{report.name}</Text>
                              <Text fontSize="sm" color="gray.600">
                                {report.description}
                              </Text>
                            </VStack>
                          </Td>
                          <Td>
                            <Badge
                              colorScheme={getScheduleColor(report.schedule)}
                            >
                              {report.schedule}
                            </Badge>
                          </Td>
                          <Td>
                            <Text fontSize="sm">
                              {report.recipients?.slice(0, 2).join(', ')}
                              {report.recipients?.length > 2 &&
                                ` +${report.recipients.length - 2}`}
                            </Text>
                          </Td>
                          <Td>
                            <Text fontSize="sm">
                              {new Date(report.lastRun).toLocaleDateString()}
                            </Text>
                          </Td>
                          <Td>
                            <Text fontSize="sm">
                              {report.nextRun
                                ? new Date(report.nextRun).toLocaleDateString()
                                : 'N/A'}
                            </Text>
                          </Td>
                          <Td>
                            <Badge
                              colorScheme={
                                report.status === 'active' ? 'green' : 'gray'
                              }
                            >
                              {report.status}
                            </Badge>
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() =>
                                  toggleReportStatus(report.id, report.status)
                                }
                              >
                                {report.status === 'active' ? (
                                  <FiPause />
                                ) : (
                                  <FiPlay />
                                )}
                              </Button>
                              <Button size="xs" variant="outline">
                                <FiEdit />
                              </Button>
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => deleteReport(report.id)}
                              >
                                <FiTrash2 />
                              </Button>
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Templates Tab */}
          <TabPanel>
            <Card bg={bgColor} borderColor={borderColor}>
              <CardBody>
                <Heading size="md" mb={4}>
                  Report Templates
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {REPORT_TEMPLATES.map(template => (
                    <Card
                      key={template.id}
                      variant="outline"
                      bg={bgColor}
                      borderColor={borderColor}
                    >
                      <CardBody>
                        <HStack justify="space-between" mb={3}>
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold">{template.name}</Text>
                            <Text fontSize="sm" color="gray.600">
                              {template.description}
                            </Text>
                          </VStack>
                          <Badge variant="outline">{template.category}</Badge>
                        </HStack>

                        <VStack spacing={3} mb={3}>
                          <VStack align="start" spacing={1}>
                            <Text fontSize="sm" fontWeight="bold">
                              Metrics:
                            </Text>
                            <HStack spacing={1} flexWrap="wrap">
                              {template.metrics.map(metric => (
                                <Badge
                                  key={metric}
                                  size="sm"
                                  colorScheme="blue"
                                >
                                  {metric}
                                </Badge>
                              ))}
                            </HStack>
                          </VStack>

                          <VStack align="start" spacing={1}>
                            <Text fontSize="sm" fontWeight="bold">
                              Dimensions:
                            </Text>
                            <HStack spacing={1} flexWrap="wrap">
                              {template.dimensions.map(dimension => (
                                <Badge
                                  key={dimension}
                                  size="sm"
                                  variant="outline"
                                >
                                  {dimension}
                                </Badge>
                              ))}
                            </HStack>
                          </VStack>
                        </VStack>

                        <Button
                          size="sm"
                          onClick={() => handleTemplateSelect(template.id)}
                          width="full"
                        >
                          Use Template
                        </Button>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
