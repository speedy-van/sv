'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Button,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Icon,
  useBreakpointValue,
  Flex,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Avatar,
  Progress,
  Circle,
} from '@chakra-ui/react';
import {
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaTruck,
  FaCheckCircle,
  FaExclamationTriangle,
  FaArrowRight,
  FaSync,
  FaCalendarCheck,
  FaCalendarTimes,
} from 'react-icons/fa';
import DriverShell from '@/components/driver/DriverShell';

interface ScheduledJob {
  id: string;
  reference: string;
  scheduledAt: string;
  status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  dropoffAddress: string;
  items: Array<{
    name: string;
    quantity: number;
  }>;
  duration: number;
  priority: 'low' | 'medium' | 'high';
}

interface ScheduleStats {
  todayJobs: number;
  weekJobs: number;
  totalEarnings: number;
  declinedJobsCount: number;
  acceptanceRate: number;
  nextJob?: ScheduledJob;
}

export default function DriverSchedulePage() {
  const [scheduleData, setScheduleData] = useState<ScheduleStats | null>(null);
  const [upcomingJobs, setUpcomingJobs] = useState<ScheduledJob[]>([]);
  const [pastJobs, setPastJobs] = useState<ScheduledJob[]>([]);
  const [declinedJobs, setDeclinedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  const isMobile = useBreakpointValue({ base: true, md: false });

  // Load schedule data
  const loadScheduleData = useCallback(async () => {
    try {
      setRefreshing(true);

      const [scheduleResponse, jobsResponse] = await Promise.all([
        fetch('/api/driver/schedule/stats'),
        fetch('/api/driver/schedule/jobs'),
      ]);

      if (scheduleResponse.ok) {
        const scheduleStats = await scheduleResponse.json();
        setScheduleData(scheduleStats.data);
      }

      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        setUpcomingJobs(jobsData.data.upcoming || []);
        setPastJobs(jobsData.data.past || []);
        setDeclinedJobs(jobsData.data.declined || []);
      }

    } catch (error) {
      console.error('Error loading schedule data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load schedule data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    loadScheduleData();

    // Listen for job acceptance events
    const handleJobAccepted = () => {
      console.log('📅 Job accepted - refreshing schedule');
      loadScheduleData();
    };

    window.addEventListener('jobAccepted', handleJobAccepted);

    return () => {
      window.removeEventListener('jobAccepted', handleJobAccepted);
    };
  }, [loadScheduleData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'blue';
      case 'in_progress': return 'orange';
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return FaCalendarCheck;
      case 'in_progress': return FaTruck;
      case 'completed': return FaCheckCircle;
      case 'cancelled': return FaCalendarTimes;
      default: return FaExclamationTriangle;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount / 100);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  if (loading) {
    return (
      <DriverShell
        title="My Schedule"
        subtitle="View your upcoming jobs and work schedule"
      >
        <VStack spacing={8} py={8}>
          <Spinner size="xl" />
          <Text>Loading your schedule...</Text>
        </VStack>
      </DriverShell>
    );
  }

  return (
    <DriverShell
      title="My Schedule"
      subtitle="View your upcoming jobs and work schedule"
      actions={
        <Button
          leftIcon={<FaSync />}
          onClick={loadScheduleData}
          isLoading={refreshing}
          loadingText="Refreshing..."
          size="sm"
          colorScheme="brand"
        >
          Refresh
        </Button>
      }
    >
      <VStack spacing={6} align="stretch">
        {/* Schedule Overview Cards */}
        {scheduleData && (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
            <Card
              bg="bg.card"
              border="1px solid"
              borderColor="border.primary"
              borderRadius="xl"
              position="relative"
              overflow="hidden"
              boxShadow="0 0 20px rgba(251, 191, 36, 0.5), 0 0 40px rgba(251, 191, 36, 0.3)"
              transition="all 0.3s"
              _hover={{
                boxShadow: "0 0 25px rgba(251, 191, 36, 0.7), 0 0 50px rgba(251, 191, 36, 0.4)",
                transform: "translateY(-4px)",
                _before: {
                  content: '""',
                  position: "absolute",
                  top: "0",
                  left: "-100%",
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
                  animation: "wave-today 0.8s ease-out",
                  zIndex: 1
                }
              }}
              sx={{
                "@keyframes wave-today": {
                  "0%": { left: "-100%" },
                  "100%": { left: "100%" }
                }
              }}
              _after={{
                content: '""',
                position: 'absolute',
                inset: 0,
                borderRadius: 'xl',
                padding: '1px',
                background: 'linear-gradient(135deg, rgba(0,194,255,0.3), rgba(0,209,143,0.3))',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                pointerEvents: 'none',
              }}
            >
              <CardBody position="relative" zIndex={2}>
                <Stat>
                  <StatLabel color="white">
                    <HStack>
                      <Icon as={FaCalendarAlt} />
                      <Text>Today's Jobs</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber 
                    color="white" 
                    fontSize="2xl"
                    textShadow="0 0 15px rgba(251, 191, 36, 0.8), 0 0 30px rgba(251, 191, 36, 0.5)"
                  >
                    {scheduleData.todayJobs}
                  </StatNumber>
                  <StatHelpText 
                    color="white"
                    textShadow="0 0 8px rgba(255, 255, 255, 0.4)"
                  >
                    Scheduled for today
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card
              bg="bg.card"
              border="1px solid"
              borderColor="border.primary"
              borderRadius="xl"
              position="relative"
              overflow="hidden"
              boxShadow="0 0 20px rgba(168, 85, 247, 0.5), 0 0 40px rgba(168, 85, 247, 0.3)"
              transition="all 0.3s"
              _hover={{
                boxShadow: "0 0 25px rgba(168, 85, 247, 0.7), 0 0 50px rgba(168, 85, 247, 0.4)",
                transform: "translateY(-4px)",
                _before: {
                  content: '""',
                  position: "absolute",
                  top: "0",
                  left: "-100%",
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
                  animation: "wave-week 0.8s ease-out",
                  zIndex: 1
                }
              }}
              sx={{
                "@keyframes wave-week": {
                  "0%": { left: "-100%" },
                  "100%": { left: "100%" }
                }
              }}
              _after={{
                content: '""',
                position: 'absolute',
                inset: 0,
                borderRadius: 'xl',
                padding: '1px',
                background: 'linear-gradient(135deg, rgba(0,194,255,0.3), rgba(0,209,143,0.3))',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                pointerEvents: 'none',
              }}
            >
              <CardBody position="relative" zIndex={2}>
                <Stat>
                  <StatLabel color="white">
                    <HStack>
                      <Icon as={FaCalendarCheck} />
                      <Text>This Week</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber 
                    color="white" 
                    fontSize="2xl"
                    textShadow="0 0 15px rgba(168, 85, 247, 0.8), 0 0 30px rgba(168, 85, 247, 0.5)"
                  >
                    {scheduleData.weekJobs}
                  </StatNumber>
                  <StatHelpText 
                    color="white"
                    textShadow="0 0 8px rgba(255, 255, 255, 0.4)"
                  >
                    Jobs this week
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card
              bg="bg.card"
              border="1px solid"
              borderColor="border.primary"
              borderRadius="xl"
              position="relative"
              overflow="hidden"
              boxShadow="0 0 20px rgba(34, 197, 94, 0.5), 0 0 40px rgba(34, 197, 94, 0.3)"
              transition="all 0.3s"
              _hover={{
                boxShadow: "0 0 25px rgba(34, 197, 94, 0.7), 0 0 50px rgba(34, 197, 94, 0.4)",
                transform: "translateY(-4px)",
                _before: {
                  content: '""',
                  position: "absolute",
                  top: "0",
                  left: "-100%",
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
                  animation: "wave-earnings 0.8s ease-out",
                  zIndex: 1
                }
              }}
              sx={{
                "@keyframes wave-earnings": {
                  "0%": { left: "-100%" },
                  "100%": { left: "100%" }
                }
              }}
              _after={{
                content: '""',
                position: 'absolute',
                inset: 0,
                borderRadius: 'xl',
                padding: '1px',
                background: 'linear-gradient(135deg, rgba(0,194,255,0.3), rgba(0,209,143,0.3))',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                pointerEvents: 'none',
              }}
            >
              <CardBody position="relative" zIndex={2}>
                <Stat>
                  <StatLabel color="white">
                    <HStack>
                      <Icon as={FaTruck} />
                      <Text>Total Earnings</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber 
                    color="white" 
                    fontSize="2xl"
                    textShadow="0 0 15px rgba(34, 197, 94, 0.8), 0 0 30px rgba(34, 197, 94, 0.5)"
                  >
                    {formatCurrency(scheduleData.totalEarnings)}
                  </StatNumber>
                  <StatHelpText 
                    color="white"
                    textShadow="0 0 8px rgba(255, 255, 255, 0.4)"
                  >
                    This week
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card
              bg="bg.card"
              border="1px solid"
              borderColor="border.primary"
              borderRadius="xl"
              position="relative"
              overflow="hidden"
              boxShadow="0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)"
              transition="all 0.3s"
              _hover={{
                boxShadow: "0 0 25px rgba(59, 130, 246, 0.7), 0 0 50px rgba(59, 130, 246, 0.4)",
                transform: "translateY(-4px)",
                _before: {
                  content: '""',
                  position: "absolute",
                  top: "0",
                  left: "-100%",
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
                  animation: "wave-nextjob 0.8s ease-out",
                  zIndex: 1
                }
              }}
              sx={{
                "@keyframes wave-nextjob": {
                  "0%": { left: "-100%" },
                  "100%": { left: "100%" }
                }
              }}
              _after={{
                content: '""',
                position: 'absolute',
                inset: 0,
                borderRadius: 'xl',
                padding: '1px',
                background: 'linear-gradient(135deg, rgba(0,194,255,0.3), rgba(0,209,143,0.3))',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                pointerEvents: 'none',
              }}
            >
              <CardBody position="relative" zIndex={2}>
                <Stat>
                  <StatLabel color="white">
                    <HStack>
                      <Icon as={FaClock} />
                      <Text>Next Job</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber 
                    color="white" 
                    fontSize="lg"
                    textShadow="0 0 15px rgba(59, 130, 246, 0.8), 0 0 30px rgba(59, 130, 246, 0.5)"
                  >
                    {scheduleData.nextJob
                      ? formatTime(scheduleData.nextJob.scheduledAt)
                      : 'No jobs'
                    }
                  </StatNumber>
                  <StatHelpText 
                    color="white"
                    textShadow="0 0 8px rgba(255, 255, 255, 0.4)"
                  >
                    {scheduleData.nextJob
                      ? formatDate(scheduleData.nextJob.scheduledAt)
                      : 'scheduled'
                    }
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>
        )}

        {/* Acceptance Rate Progress */}
        {scheduleData && (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Card
              bg="bg.card"
              border="1px solid"
              borderColor="border.primary"
              borderRadius="xl"
              position="relative"
              overflow="hidden"
              transition="all 0.3s"
              animation={scheduleData.acceptanceRate >= 80 
                ? "pulse-green 3s ease-in-out infinite"
                : scheduleData.acceptanceRate >= 60 
                ? "pulse-amber 3s ease-in-out infinite"
                : "pulse-red-acceptance 3s ease-in-out infinite"}
              _hover={{
                transform: "translateY(-4px)",
                animation: scheduleData.acceptanceRate >= 80 
                  ? "pulse-green-hover 2s ease-in-out infinite"
                  : scheduleData.acceptanceRate >= 60 
                  ? "pulse-amber-hover 2s ease-in-out infinite"
                  : "pulse-red-acceptance-hover 2s ease-in-out infinite",
                _before: {
                  content: '""',
                  position: "absolute",
                  top: "0",
                  left: "-100%",
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
                  animation: "wave-schedule 0.8s ease-out",
                  zIndex: 1
                }
              }}
              sx={{
                "@keyframes pulse-green": {
                  "0%, 100%": {
                    boxShadow: "0 0 15px rgba(34, 197, 94, 0.4), 0 0 30px rgba(34, 197, 94, 0.2)"
                  },
                  "50%": {
                    boxShadow: "0 0 30px rgba(34, 197, 94, 0.7), 0 0 60px rgba(34, 197, 94, 0.4)"
                  }
                },
                "@keyframes pulse-green-hover": {
                  "0%, 100%": {
                    boxShadow: "0 0 25px rgba(34, 197, 94, 0.6), 0 0 50px rgba(34, 197, 94, 0.3)"
                  },
                  "50%": {
                    boxShadow: "0 0 40px rgba(34, 197, 94, 0.9), 0 0 80px rgba(34, 197, 94, 0.5)"
                  }
                },
                "@keyframes pulse-amber": {
                  "0%, 100%": {
                    boxShadow: "0 0 15px rgba(251, 191, 36, 0.4), 0 0 30px rgba(251, 191, 36, 0.2)"
                  },
                  "50%": {
                    boxShadow: "0 0 30px rgba(251, 191, 36, 0.7), 0 0 60px rgba(251, 191, 36, 0.4)"
                  }
                },
                "@keyframes pulse-amber-hover": {
                  "0%, 100%": {
                    boxShadow: "0 0 25px rgba(251, 191, 36, 0.6), 0 0 50px rgba(251, 191, 36, 0.3)"
                  },
                  "50%": {
                    boxShadow: "0 0 40px rgba(251, 191, 36, 0.9), 0 0 80px rgba(251, 191, 36, 0.5)"
                  }
                },
                "@keyframes pulse-red-acceptance": {
                  "0%, 100%": {
                    boxShadow: "0 0 15px rgba(239, 68, 68, 0.4), 0 0 30px rgba(239, 68, 68, 0.2)"
                  },
                  "50%": {
                    boxShadow: "0 0 30px rgba(239, 68, 68, 0.7), 0 0 60px rgba(239, 68, 68, 0.4)"
                  }
                },
                "@keyframes pulse-red-acceptance-hover": {
                  "0%, 100%": {
                    boxShadow: "0 0 25px rgba(239, 68, 68, 0.6), 0 0 50px rgba(239, 68, 68, 0.3)"
                  },
                  "50%": {
                    boxShadow: "0 0 40px rgba(239, 68, 68, 0.9), 0 0 80px rgba(239, 68, 68, 0.5)"
                  }
                },
                "@keyframes wave-schedule": {
                  "0%": { left: "-100%" },
                  "100%": { left: "100%" }
                }
              }}
              _after={{
                content: '""',
                position: 'absolute',
                inset: 0,
                borderRadius: 'xl',
                padding: '1px',
                background: 'linear-gradient(135deg, rgba(0,194,255,0.3), rgba(0,209,143,0.3))',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                pointerEvents: 'none',
              }}
            >
              <CardBody>
                <VStack spacing={3} align="stretch">
                  <HStack justify="space-between">
                    <Text 
                      fontSize="sm" 
                      fontWeight="semibold" 
                      color="white"
                      textShadow="0 0 10px rgba(255, 255, 255, 0.5)"
                    >
                      Acceptance Rate (30 days)
                    </Text>
                    <Text 
                      fontSize="lg" 
                      fontWeight="bold" 
                      color="white"
                      textShadow={scheduleData.acceptanceRate >= 80 
                        ? "0 0 15px rgba(34, 197, 94, 0.8), 0 0 30px rgba(34, 197, 94, 0.5)"
                        : scheduleData.acceptanceRate >= 60 
                        ? "0 0 15px rgba(251, 191, 36, 0.8), 0 0 30px rgba(251, 191, 36, 0.5)"
                        : "0 0 15px rgba(239, 68, 68, 0.8), 0 0 30px rgba(239, 68, 68, 0.5)"}
                    >
                      {scheduleData.acceptanceRate.toFixed(1)}%
                    </Text>
                  </HStack>
                  <Progress
                    value={scheduleData.acceptanceRate}
                    colorScheme={scheduleData.acceptanceRate >= 80 ? 'green' : scheduleData.acceptanceRate >= 60 ? 'yellow' : 'red'}
                    size="lg"
                    borderRadius="md"
                  />
                  <Text 
                    fontSize="xs" 
                    color="white"
                    textShadow="0 0 8px rgba(255, 255, 255, 0.4)"
                  >
                    Each declined job reduces rate by 5%
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            <Card
              bg="bg.card"
              border="1px solid"
              borderColor="border.primary"
              borderRadius="xl"
              position="relative"
              overflow="hidden"
              transition="all 0.3s"
              animation="pulse-red 3s ease-in-out infinite"
              _hover={{
                transform: "translateY(-4px)",
                animation: "pulse-red-hover 2s ease-in-out infinite",
                _before: {
                  content: '""',
                  position: "absolute",
                  top: "0",
                  left: "-100%",
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
                  animation: "wave-declined 0.8s ease-out",
                  zIndex: 1
                }
              }}
              sx={{
                "@keyframes pulse-red": {
                  "0%, 100%": {
                    boxShadow: "0 0 15px rgba(239, 68, 68, 0.4), 0 0 30px rgba(239, 68, 68, 0.2)"
                  },
                  "50%": {
                    boxShadow: "0 0 30px rgba(239, 68, 68, 0.7), 0 0 60px rgba(239, 68, 68, 0.4)"
                  }
                },
                "@keyframes pulse-red-hover": {
                  "0%, 100%": {
                    boxShadow: "0 0 25px rgba(239, 68, 68, 0.6), 0 0 50px rgba(239, 68, 68, 0.3)"
                  },
                  "50%": {
                    boxShadow: "0 0 40px rgba(239, 68, 68, 0.9), 0 0 80px rgba(239, 68, 68, 0.5)"
                  }
                },
                "@keyframes wave-declined": {
                  "0%": { left: "-100%" },
                  "100%": { left: "100%" }
                }
              }}
              _after={{
                content: '""',
                position: 'absolute',
                inset: 0,
                borderRadius: 'xl',
                padding: '1px',
                background: 'linear-gradient(135deg, rgba(0,194,255,0.3), rgba(0,209,143,0.3))',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                pointerEvents: 'none',
              }}
            >
              <CardBody position="relative" zIndex={2}>
                <Stat>
                  <StatLabel color="white">
                    <HStack>
                      <Icon as={FaCalendarTimes} />
                      <Text>Declined Jobs (30 days)</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber 
                    color="white" 
                    fontSize="2xl"
                    textShadow="0 0 15px rgba(239, 68, 68, 0.8), 0 0 30px rgba(239, 68, 68, 0.5)"
                  >
                    {scheduleData.declinedJobsCount}
                  </StatNumber>
                  <StatHelpText 
                    color="white"
                    textShadow="0 0 8px rgba(255, 255, 255, 0.4)"
                  >
                    Recent job declines
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>
        )}

        {/* Schedule Tabs */}
        <Card
          bg="bg.card"
          border="1px solid"
          borderColor="border.primary"
          borderRadius="xl"
          _before={{
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 'xl',
            padding: '1px',
            background: 'linear-gradient(135deg, rgba(0,194,255,0.3), rgba(0,209,143,0.3))',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            pointerEvents: 'none',
          }}
        >
          <CardBody>
            <Tabs colorScheme="blue" variant="enclosed">
              <TabList>
                <Tab 
                  color="white" 
                  fontWeight="semibold"
                  position="relative"
                  overflow="hidden"
                  _selected={{ 
                    color: 'neon.500', 
                    bg: 'bg.surface',
                    boxShadow: "0 0 15px rgba(59, 130, 246, 0.6), 0 0 30px rgba(59, 130, 246, 0.3)"
                  }}
                  _hover={{
                    _before: {
                      content: '""',
                      position: "absolute",
                      top: "0",
                      left: "-100%",
                      width: "100%",
                      height: "100%",
                      background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
                      animation: "wave-tab 0.6s ease-out",
                      zIndex: 1
                    }
                  }}
                  sx={{
                    "@keyframes wave-tab": {
                      "0%": { left: "-100%" },
                      "100%": { left: "100%" }
                    }
                  }}
                >
                  Upcoming Jobs ({upcomingJobs.length})
                </Tab>
                <Tab 
                  color="white" 
                  fontWeight="semibold"
                  position="relative"
                  overflow="hidden"
                  _selected={{ 
                    color: 'neon.500', 
                    bg: 'bg.surface',
                    boxShadow: "0 0 15px rgba(34, 197, 94, 0.6), 0 0 30px rgba(34, 197, 94, 0.3)"
                  }}
                  _hover={{
                    _before: {
                      content: '""',
                      position: "absolute",
                      top: "0",
                      left: "-100%",
                      width: "100%",
                      height: "100%",
                      background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
                      animation: "wave-tab 0.6s ease-out",
                      zIndex: 1
                    }
                  }}
                  sx={{
                    "@keyframes wave-tab": {
                      "0%": { left: "-100%" },
                      "100%": { left: "100%" }
                    }
                  }}
                >
                  Past Jobs ({pastJobs.length})
                </Tab>
                <Tab 
                  color="white" 
                  fontWeight="semibold"
                  position="relative"
                  overflow="hidden"
                  _selected={{ 
                    color: 'neon.500', 
                    bg: 'bg.surface',
                    boxShadow: "0 0 15px rgba(239, 68, 68, 0.6), 0 0 30px rgba(239, 68, 68, 0.3)"
                  }}
                  _hover={{
                    _before: {
                      content: '""',
                      position: "absolute",
                      top: "0",
                      left: "-100%",
                      width: "100%",
                      height: "100%",
                      background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
                      animation: "wave-tab 0.6s ease-out",
                      zIndex: 1
                    }
                  }}
                  sx={{
                    "@keyframes wave-tab": {
                      "0%": { left: "-100%" },
                      "100%": { left: "100%" }
                    }
                  }}
                >
                  Declined Jobs ({declinedJobs.length})
                </Tab>
              </TabList>

              <TabPanels>
                <TabPanel>
                  {upcomingJobs.length === 0 ? (
                    <Alert 
                      status="info" 
                      borderRadius="lg"
                      position="relative"
                      overflow="hidden"
                      boxShadow="0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)"
                      transition="all 0.3s"
                      _hover={{
                        boxShadow: "0 0 25px rgba(59, 130, 246, 0.7), 0 0 50px rgba(59, 130, 246, 0.4)",
                        _before: {
                          content: '""',
                          position: "absolute",
                          top: "0",
                          left: "-100%",
                          width: "100%",
                          height: "100%",
                          background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)",
                          animation: "wave-alert 0.8s ease-out",
                          zIndex: 1
                        }
                      }}
                      sx={{
                        "@keyframes wave-alert": {
                          "0%": { left: "-100%" },
                          "100%": { left: "100%" }
                        }
                      }}
                    >
                      <AlertIcon />
                      <Box position="relative" zIndex={2}>
                        <AlertTitle 
                          color="white"
                          textShadow="0 0 10px rgba(59, 130, 246, 0.8)"
                        >
                          No upcoming jobs!
                        </AlertTitle>
                        <AlertDescription
                          color="white"
                          textShadow="0 0 8px rgba(255, 255, 255, 0.5)"
                        >
                          You don't have any jobs scheduled. Check back later or update your availability.
                        </AlertDescription>
                      </Box>
                    </Alert>
                  ) : (
                    <VStack spacing={4} align="stretch">
                      {upcomingJobs.map((job) => (
                        <Card
                          key={job.id}
                          bg="bg.surface"
                          border="1px solid"
                          borderColor="border.secondary"
                          borderRadius="lg"
                        >
                          <CardBody>
                            <VStack spacing={3} align="stretch">
                              <HStack justify="space-between" align="start">
                                <VStack align="start" spacing={1}>
                                  <HStack>
                                    <Badge bg="neon.500" color="dark.900">
                                      {job.reference}
                                    </Badge>
                                    <Badge bg={getPriorityColor(job.priority)} color="white" size="sm">
                                      {job.priority.toUpperCase()}
                                    </Badge>
                                    <Badge bg={getStatusColor(job.status)} color="white" size="sm">
                                      {job.status.replace('_', ' ').toUpperCase()}
                                    </Badge>
                                  </HStack>
                                  <HStack spacing={2}>
                                    <Icon as={FaCalendarAlt} color="text.secondary" boxSize={4} />
                                    <Text fontSize="sm" color="text.secondary">
                                      {formatDate(job.scheduledAt)} at {formatTime(job.scheduledAt)}
                                    </Text>
                                  </HStack>
                                </VStack>
                                <VStack align="end" spacing={1}>
                                  <Text fontSize="sm" color="text.tertiary">
                                    {job.duration} minutes
                                  </Text>
                                  <Badge bg="neon.500" color="dark.900" size="sm">
                                    {job.priority.toUpperCase()}
                                  </Badge>
                                </VStack>
                              </HStack>

                              <Divider />

                              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                                <Box>
                                  <HStack spacing={2} mb={1}>
                                    <Icon as={FaMapMarkerAlt} color="green.500" boxSize={3} />
                                    <Text fontSize="xs" fontWeight="semibold" color="green.600">
                                      Pickup
                                    </Text>
                                  </HStack>
                                  <Text fontSize="sm" color="text.secondary">
                                    {job.pickupAddress}
                                  </Text>
                                  <Text fontSize="xs" color="text.tertiary">
                                    {job.customerName} • {job.customerPhone}
                                  </Text>
                                </Box>

                                <Box>
                                  <HStack spacing={2} mb={1}>
                                    <Icon as={FaMapMarkerAlt} color="red.500" boxSize={3} />
                                    <Text fontSize="xs" fontWeight="semibold" color="red.600">
                                      Dropoff
                                    </Text>
                                  </HStack>
                                  <Text fontSize="sm" color="text.secondary">
                                    {job.dropoffAddress}
                                  </Text>
                                  {job.items.length > 0 && (
                                    <Text fontSize="xs" color="text.tertiary">
                                      {job.items.map((item: any) => `${item.name} (${item.quantity})`).join(', ')}
                                    </Text>
                                  )}
                                </Box>
                              </SimpleGrid>

                              <HStack justify="space-between" pt={2}>
                                <HStack spacing={2}>
                                  <Circle size="8px" bg={getStatusColor(job.status)} />
                                  <Text fontSize="xs" color="text.secondary">
                                    Status: {job.status.replace('_', ' ')}
                                  </Text>
                                </HStack>
                                <Button
                                  size="sm"
                                  colorScheme="brand"
                                  rightIcon={<FaArrowRight />}
                                  onClick={() => window.location.href = `/driver/jobs/${job.id}`}
                                >
                                  View Details
                                </Button>
                              </HStack>
                            </VStack>
                          </CardBody>
                        </Card>
                      ))}
                    </VStack>
                  )}
                </TabPanel>

                <TabPanel>
                  {pastJobs.length === 0 ? (
                    <Alert status="info" borderRadius="lg">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>No past jobs</AlertTitle>
                        <AlertDescription>
                          Your completed jobs will appear here.
                        </AlertDescription>
                      </Box>
                    </Alert>
                  ) : (
                    <VStack spacing={4} align="stretch">
                      {pastJobs.slice(0, 10).map((job) => (
                        <Card
                          key={job.id}
                          bg="bg.surface"
                          border="1px solid"
                          borderColor="border.secondary"
                          borderRadius="lg"
                          opacity={0.8}
                        >
                          <CardBody>
                            <HStack justify="space-between" align="start">
                              <VStack align="start" spacing={1}>
                                <HStack>
                                  <Badge bg="success.500" color="white">
                                    {job.reference}
                                  </Badge>
                                  <Icon as={FaCheckCircle} color="success.500" />
                                  <Text fontSize="sm" color="success.600">
                                    Completed
                                  </Text>
                                </HStack>
                                <Text fontSize="sm" color="text.secondary">
                                  {formatDate(job.scheduledAt)} at {formatTime(job.scheduledAt)}
                                </Text>
                              </VStack>
                              <VStack align="end" spacing={1}>
                                <Icon as={FaCheckCircle} color="success.500" boxSize={5} />
                                <Button
                                  size="xs"
                                  variant="outline"
                                  onClick={() => window.location.href = `/driver/jobs/${job.id}`}
                                >
                                  View
                                </Button>
                              </VStack>
                            </HStack>
                          </CardBody>
                        </Card>
                      ))}
                    </VStack>
                  )}
                </TabPanel>

                <TabPanel>
                  {declinedJobs.length === 0 ? (
                    <Alert status="success" borderRadius="lg">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Great job!</AlertTitle>
                        <AlertDescription>
                          You haven't declined any jobs recently. Keep up the good work!
                        </AlertDescription>
                      </Box>
                    </Alert>
                  ) : (
                    <VStack spacing={4} align="stretch">
                      {declinedJobs.map((job) => (
                        <Card
                          key={job.id}
                          bg="bg.surface"
                          border="1px solid"
                          borderColor="border.secondary"
                          borderRadius="lg"
                          opacity={0.9}
                        >
                          <CardBody>
                            <VStack spacing={3} align="stretch">
                              <HStack justify="space-between" align="start">
                                <VStack align="start" spacing={1}>
                                  <HStack>
                                    <Badge bg="error.500" color="white">
                                      {job.reference}
                                    </Badge>
                                    <Badge bg="error.500" color="white" size="sm">
                                      DECLINED
                                    </Badge>
                                    <Badge bg={getPriorityColor(job.priority)} color="white" size="sm">
                                      {job.priority.toUpperCase()}
                                    </Badge>
                                  </HStack>
                                  <HStack spacing={2}>
                                    <Icon as={FaCalendarAlt} color="text.secondary" boxSize={4} />
                                    <Text fontSize="sm" color="text.secondary">
                                      Declined: {new Date(job.declinedAt).toLocaleString('en-GB')}
                                    </Text>
                                  </HStack>
                                  <HStack spacing={2}>
                                    <Icon as={FaClock} color="text.secondary" boxSize={4} />
                                    <Text fontSize="sm" color="text.secondary">
                                      Scheduled: {formatDate(job.scheduledAt)} at {formatTime(job.scheduledAt)}
                                    </Text>
                                  </HStack>
                                </VStack>
                                <VStack align="end" spacing={1}>
                                  <Badge bg="error.500" color="white" size="sm">
                                    DECLINED
                                  </Badge>
                                  <Text fontSize="xs" color="text.tertiary">
                                    {job.duration} minutes
                                  </Text>
                                </VStack>
                              </HStack>

                              <Divider />

                              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                                <Box>
                                  <HStack spacing={2} mb={1}>
                                    <Icon as={FaMapMarkerAlt} color="green.500" boxSize={3} />
                                    <Text fontSize="xs" fontWeight="semibold" color="green.600">
                                      Pickup
                                    </Text>
                                  </HStack>
                                  <Text fontSize="sm" color="text.secondary">
                                    {job.pickupAddress}
                                  </Text>
                                  <Text fontSize="xs" color="text.tertiary">
                                    {job.customerName} • {job.customerPhone}
                                  </Text>
                                </Box>

                                <Box>
                                  <HStack spacing={2} mb={1}>
                                    <Icon as={FaMapMarkerAlt} color="red.500" boxSize={3} />
                                    <Text fontSize="xs" fontWeight="semibold" color="red.600">
                                      Dropoff
                                    </Text>
                                  </HStack>
                                  <Text fontSize="sm" color="text.secondary">
                                    {job.dropoffAddress}
                                  </Text>
                                  {job.items.length > 0 && (
                                    <Text fontSize="xs" color="text.tertiary">
                                      {job.items.map((item: any) => `${item.name} (${item.quantity})`).join(', ')}
                                    </Text>
                                  )}
                                </Box>
                              </SimpleGrid>

                              <Box>
                                <Text fontSize="xs" fontWeight="semibold" color="text.secondary" mb={1}>
                                  Reason for Decline:
                                </Text>
                                <Text fontSize="sm" color="error.600" fontStyle="italic">
                                  {job.reason}
                                </Text>
                              </Box>

                              <Alert status="warning" size="sm" borderRadius="md">
                                <AlertIcon />
                                <Box>
                                  <Text fontSize="xs">
                                    This decline reduced your acceptance rate by 5%
                                  </Text>
                                </Box>
                              </Alert>
                            </VStack>
                          </CardBody>
                        </Card>
                      ))}
                    </VStack>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>
      </VStack>
    </DriverShell>
  );
}
