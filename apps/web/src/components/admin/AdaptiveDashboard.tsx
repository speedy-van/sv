'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Grid,
  GridItem,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Icon,
  Badge,
  Button,
  Spinner,
  useToast,
} from '@chakra-ui/react';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiPackage,
  FiUsers,
  FiTruck,
  FiAlertCircle,
  FiCheckCircle,
} from 'react-icons/fi';
import { AICommandPalette, useCommandPalette } from './AICommandPalette';

interface DashboardMetrics {
  orders: {
    total: number;
    completed: number;
    pending: number;
    growth: number;
  };
  revenue: {
    total: number;
    growth: number;
  };
  drivers: {
    active: number;
    available: number;
  };
  customers: {
    new: number;
    total: number;
  };
}

interface AIInsight {
  id: string;
  type: 'warning' | 'success' | 'info';
  title: string;
  description: string;
  action?: {
    label: string;
    command: string;
  };
}

export function AdaptiveDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useCommandPalette();
  const toast = useToast();

  useEffect(() => {
    loadDashboardData();

    // Listen for AI command execution
    const handleAICommand = (event: CustomEvent) => {
      loadDashboardData(); // Refresh dashboard after AI action
    };

    window.addEventListener('ai-command-executed', handleAICommand as EventListener);

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);

    return () => {
      window.removeEventListener('ai-command-executed', handleAICommand as EventListener);
      clearInterval(interval);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load KPIs
      const kpiResponse = await fetch('/api/admin/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'get kpis with comparison',
          autoExecute: true,
        }),
      });

      const kpiData = await kpiResponse.json();

      if (kpiData.success && kpiData.results && kpiData.results[0]?.data) {
        const data = kpiData.results[0].data;
        const metrics = data.metrics;
        const comparison = data.comparison || {};

        setMetrics({
          orders: {
            total: metrics.totalOrders || 0,
            completed: metrics.completedOrders || 0,
            pending: metrics.totalOrders - metrics.completedOrders || 0,
            growth: comparison.ordersGrowth || 0,
          },
          revenue: {
            total: metrics.revenue || 0,
            growth: comparison.revenueGrowth || 0,
          },
          drivers: {
            active: metrics.activeDrivers || 0,
            available: metrics.activeDrivers || 0,
          },
          customers: {
            new: metrics.newCustomers || 0,
            total: metrics.newCustomers || 0,
          },
        });

        // Generate AI insights
        const newInsights: AIInsight[] = [];

        if (comparison.ordersGrowth && comparison.ordersGrowth < -10) {
          newInsights.push({
            id: 'orders_decline',
            type: 'warning',
            title: 'انخفاض في الطلبات',
            description: `انخفضت الطلبات بنسبة ${Math.abs(comparison.ordersGrowth).toFixed(1)}% مقارنة بالفترة السابقة`,
            action: {
              label: 'تحليل الاتجاهات',
              command: 'get order trends',
            },
          });
        }

        if (metrics.activeDrivers < 5) {
          newInsights.push({
            id: 'low_drivers',
            type: 'warning',
            title: 'عدد قليل من السائقين',
            description: `فقط ${metrics.activeDrivers} سائقين نشطين حالياً`,
            action: {
              label: 'عرض السائقين',
              command: 'get available drivers',
            },
          });
        }

        if (metrics.completionRate > 90) {
          newInsights.push({
            id: 'high_completion',
            type: 'success',
            title: 'معدل إنجاز ممتاز',
            description: `معدل إنجاز الطلبات ${metrics.completionRate.toFixed(1)}%`,
          });
        }

        if (comparison.revenueGrowth && comparison.revenueGrowth > 15) {
          newInsights.push({
            id: 'revenue_growth',
            type: 'success',
            title: 'نمو قوي في الإيرادات',
            description: `زيادة في الإيرادات بنسبة ${comparison.revenueGrowth.toFixed(1)}%`,
          });
        }

        setInsights(newInsights);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const executeCommand = async (command: string) => {
    try {
      const response = await fetch('/api/admin/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: command,
          autoExecute: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'نجح التنفيذ',
          status: 'success',
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: 'فشل التنفيذ',
        status: 'error',
        duration: 3000,
      });
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" h="400px">
        <Spinner size="xl" color="purple.500" />
      </Box>
    );
  }

  return (
    <>
      <VStack spacing={6} align="stretch" dir="rtl">
        {/* AI Command Button */}
        <HStack justify="space-between">
          <Box>
            <Text fontSize="2xl" fontWeight="bold">
              لوحة التحكم الذكية
            </Text>
            <Text color="gray.600">مدعومة بالذكاء الاصطناعي</Text>
          </Box>
          <Button
            leftIcon={<Icon as={FiTrendingUp} />}
            colorScheme="purple"
            onClick={onOpen}
            size="lg"
          >
            افتح مساعد الذكاء الاصطناعي (Ctrl+K)
          </Button>
        </HStack>

        {/* AI Insights */}
        {insights.length > 0 && (
          <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={4}>
            {insights.map(insight => (
              <Card
                key={insight.id}
                bg={
                  insight.type === 'warning'
                    ? 'orange.50'
                    : insight.type === 'success'
                    ? 'green.50'
                    : 'blue.50'
                }
                borderRight="4px solid"
                borderColor={
                  insight.type === 'warning'
                    ? 'orange.500'
                    : insight.type === 'success'
                    ? 'green.500'
                    : 'blue.500'
                }
              >
                <CardBody>
                  <VStack align="start" spacing={2}>
                    <HStack>
                      <Icon
                        as={
                          insight.type === 'warning'
                            ? FiAlertCircle
                            : FiCheckCircle
                        }
                        color={
                          insight.type === 'warning'
                            ? 'orange.500'
                            : insight.type === 'success'
                            ? 'green.500'
                            : 'blue.500'
                        }
                      />
                      <Text fontWeight="bold">{insight.title}</Text>
                    </HStack>
                    <Text fontSize="sm" color="gray.600">
                      {insight.description}
                    </Text>
                    {insight.action && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => executeCommand(insight.action!.command)}
                      >
                        {insight.action.label}
                      </Button>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </Grid>
        )}

        {/* Metrics Grid */}
        <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6}>
          {/* Orders */}
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>إجمالي الطلبات</StatLabel>
                <StatNumber>
                  <HStack>
                    <Icon as={FiPackage} color="blue.500" />
                    <Text>{metrics?.orders.total || 0}</Text>
                  </HStack>
                </StatNumber>
                <StatHelpText>
                  <StatArrow
                    type={
                      metrics && metrics.orders.growth >= 0 ? 'increase' : 'decrease'
                    }
                  />
                  {Math.abs(metrics?.orders.growth || 0).toFixed(1)}%
                </StatHelpText>
              </Stat>
              <HStack mt={4} spacing={3}>
                <Badge colorScheme="green">
                  مكتمل: {metrics?.orders.completed || 0}
                </Badge>
                <Badge colorScheme="orange">
                  معلق: {metrics?.orders.pending || 0}
                </Badge>
              </HStack>
            </CardBody>
          </Card>

          {/* Revenue */}
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>الإيرادات</StatLabel>
                <StatNumber>
                  <HStack>
                    <Icon as={FiDollarSign} color="green.500" />
                    <Text>{metrics?.revenue.total.toFixed(2) || 0} ر.س</Text>
                  </HStack>
                </StatNumber>
                <StatHelpText>
                  <StatArrow
                    type={
                      metrics && metrics.revenue.growth >= 0 ? 'increase' : 'decrease'
                    }
                  />
                  {Math.abs(metrics?.revenue.growth || 0).toFixed(1)}%
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          {/* Drivers */}
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>السائقون النشطون</StatLabel>
                <StatNumber>
                  <HStack>
                    <Icon as={FiTruck} color="purple.500" />
                    <Text>{metrics?.drivers.active || 0}</Text>
                  </HStack>
                </StatNumber>
                <StatHelpText>
                  متاح: {metrics?.drivers.available || 0}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          {/* Customers */}
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>عملاء جدد</StatLabel>
                <StatNumber>
                  <HStack>
                    <Icon as={FiUsers} color="orange.500" />
                    <Text>{metrics?.customers.new || 0}</Text>
                  </HStack>
                </StatNumber>
                <StatHelpText>هذا الشهر</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </Grid>
      </VStack>

      {/* AI Command Palette */}
      <AICommandPalette isOpen={isOpen} onClose={onClose} />
    </>
  );
}
