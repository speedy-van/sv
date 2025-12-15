'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Icon,
  useToast,
  Spinner,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
} from '@chakra-ui/react';
import {
  FiDownload,
  FiFilter,
  FiSearch,
  FiMoreVertical,
  FiEye,
  FiAlertCircle,
  FiCheckCircle,
} from 'react-icons/fi';

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: any;
  createdAt: string;
  User?: {
    name: string;
    email: string;
  };
}

export function AuditTrailViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const toast = useToast();

  useEffect(() => {
    loadAuditLogs();
  }, [filterAction, filterUser, dateFrom, dateTo]);

  const loadAuditLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterAction) params.append('action', filterAction);
      if (filterUser) params.append('userId', filterUser);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      const data = await response.json();

      if (data.success) {
        setLogs(data.logs);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل سجلات المراجعة',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportLogs = async (format: 'csv' | 'json') => {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (filterAction) params.append('action', filterAction);
      if (filterUser) params.append('userId', filterUser);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await fetch(`/api/admin/audit-logs/export?${params}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'نجح التصدير',
        description: `تم تصدير ${logs.length} سجل`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'فشل التصدير',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const getActionBadge = (action: string) => {
    if (action.includes('CREATE') || action.includes('CONFIRMED')) {
      return <Badge colorScheme="green">{action}</Badge>;
    }
    if (action.includes('DELETE') || action.includes('CANCEL')) {
      return <Badge colorScheme="red">{action}</Badge>;
    }
    if (action.includes('UPDATE') || action.includes('EDIT')) {
      return <Badge colorScheme="blue">{action}</Badge>;
    }
    if (action.includes('AI_')) {
      return <Badge colorScheme="purple">{action}</Badge>;
    }
    return <Badge colorScheme="gray">{action}</Badge>;
  };

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(search) ||
      log.resource.toLowerCase().includes(search) ||
      log.User?.name.toLowerCase().includes(search) ||
      log.User?.email.toLowerCase().includes(search)
    );
  });

  return (
    <VStack spacing={6} align="stretch" dir="rtl">
      {/* Header */}
      <HStack justify="space-between">
        <Box>
          <Text fontSize="2xl" fontWeight="bold">
            سجل المراجعة والامتثال
          </Text>
          <Text color="gray.600">جميع العمليات والإجراءات المسجلة</Text>
        </Box>
        <HStack spacing={3}>
          <Menu>
            <MenuButton
              as={Button}
              leftIcon={<Icon as={FiDownload} />}
              colorScheme="purple"
              variant="outline"
            >
              تصدير
            </MenuButton>
            <MenuList bg="gray.800" borderColor="gray.700">
              <MenuItem bg="gray.800" _hover={{ bg: 'gray.700' }} onClick={() => exportLogs('csv')}>تصدير CSV</MenuItem>
              <MenuItem bg="gray.800" _hover={{ bg: 'gray.700' }} onClick={() => exportLogs('json')}>تصدير JSON</MenuItem>
            </MenuList>
          </Menu>
          <Button
            leftIcon={<Icon as={FiFilter} />}
            variant="outline"
            onClick={loadAuditLogs}
          >
            تحديث
          </Button>
        </HStack>
      </HStack>

      {/* Filters */}
      <HStack spacing={4}>
        <Box flex={1}>
          <InputGroup>
            <InputLeftElement>
              <Icon as={FiSearch} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="بحث في السجلات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
        </Box>
        <Select
          placeholder="نوع العملية"
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          w="200px"
        >
          <option value="AI_TOOL_">عمليات الذكاء الاصطناعي</option>
          <option value="CREATE">إنشاء</option>
          <option value="UPDATE">تحديث</option>
          <option value="DELETE">حذف</option>
          <option value="CONFIRMED">تأكيد</option>
        </Select>
        <Input
          type="date"
          placeholder="من تاريخ"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          w="200px"
        />
        <Input
          type="date"
          placeholder="إلى تاريخ"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          w="200px"
        />
      </HStack>

      {/* Stats */}
      <HStack spacing={4} p={4} bg="gray.50" borderRadius="lg">
        <Box flex={1} textAlign="center">
          <Text fontSize="2xl" fontWeight="bold" color="purple.600">
            {logs.length}
          </Text>
          <Text fontSize="sm" color="gray.600">
            إجمالي السجلات
          </Text>
        </Box>
        <Box flex={1} textAlign="center">
          <Text fontSize="2xl" fontWeight="bold" color="green.600">
            {logs.filter(l => l.action.includes('AI_TOOL_')).length}
          </Text>
          <Text fontSize="sm" color="gray.600">
            عمليات AI
          </Text>
        </Box>
        <Box flex={1} textAlign="center">
          <Text fontSize="2xl" fontWeight="bold" color="blue.600">
            {new Set(logs.map(l => l.userId)).size}
          </Text>
          <Text fontSize="sm" color="gray.600">
            مستخدمون نشطون
          </Text>
        </Box>
      </HStack>

      {/* Table */}
      <Box borderWidth="1px" borderRadius="lg" overflowX="auto">
        {isLoading ? (
          <Box py={12} textAlign="center">
            <Spinner size="xl" color="purple.500" />
            <Text mt={4} color="gray.600">
              جاري التحميل...
            </Text>
          </Box>
        ) : filteredLogs.length === 0 ? (
          <Box py={12} textAlign="center">
            <Icon as={FiAlertCircle} boxSize={12} color="gray.400" mb={4} />
            <Text color="gray.600">لا توجد سجلات</Text>
          </Box>
        ) : (
          <Table variant="simple">
            <Thead bg="gray.50">
              <Tr>
                <Th>الوقت</Th>
                <Th>المستخدم</Th>
                <Th>العملية</Th>
                <Th>المورد</Th>
                <Th>التفاصيل</Th>
                <Th>الحالة</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredLogs.map((log) => (
                <Tr key={log.id} _hover={{ bg: 'gray.50' }}>
                  <Td>
                    <Text fontSize="sm">
                      {new Date(log.createdAt).toLocaleString('ar-SA')}
                    </Text>
                  </Td>
                  <Td>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="medium">
                        {log.User?.name || 'غير معروف'}
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        {log.User?.email}
                      </Text>
                    </VStack>
                  </Td>
                  <Td>{getActionBadge(log.action)}</Td>
                  <Td>
                    <Text fontSize="sm">{log.resource}</Text>
                    {log.resourceId && (
                      <Text fontSize="xs" color="gray.600">
                        {log.resourceId}
                      </Text>
                    )}
                  </Td>
                  <Td>
                    <Text fontSize="xs" noOfLines={2}>
                      {typeof log.details === 'object'
                        ? JSON.stringify(log.details).substring(0, 50) + '...'
                        : log.details}
                    </Text>
                  </Td>
                  <Td>
                    <Icon
                      as={FiCheckCircle}
                      color="green.500"
                      boxSize={5}
                    />
                  </Td>
                  <Td>
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<Icon as={FiMoreVertical} />}
                        variant="ghost"
                        size="sm"
                      />
                      <MenuList bg="gray.800" borderColor="gray.700">
                        <MenuItem bg="gray.800" _hover={{ bg: 'gray.700' }} icon={<Icon as={FiEye} />}>
                          عرض التفاصيل الكاملة
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Box>
    </VStack>
  );
}
