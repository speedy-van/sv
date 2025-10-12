'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Badge,
  Button,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Divider,
  Flex,
  IconButton,
  Tooltip,
  useColorModeValue,
  TableContainer,
} from '@chakra-ui/react';
import {
  FiDollarSign,
  FiTrendingUp,
  FiCalendar,
  FiRefreshCw,
  FiDownload,
  FiEye,
  FiClock,
  FiCheckCircle,
} from 'react-icons/fi';
import { format, startOfWeek, startOfMonth, endOfWeek, endOfMonth } from 'date-fns';

interface DriverEarning {
  id: string;
  assignmentId: string;
  bookingReference: string;
  customerName: string;
  baseAmount: string;
  surgeAmount: string;
  tipAmount: string;
  // feeAmount removed from driver view for privacy
  netAmount: string;
  currency: string;
  calculatedAt: string;
  paidOut: boolean;
  payoutId?: string;
}

interface EarningsSummary {
  totalEarnings: string;
  totalJobs: number;
  totalTips: string;
  // totalFees removed from driver view for privacy
  paidOutEarnings: string;
  pendingEarnings: string;
  averageEarningsPerJob: string;
}

interface EarningsData {
  period: string;
  dateRange: {
    start: string;
    end: string;
  } | null;
  summary: EarningsSummary;
  earnings: DriverEarning[];
}

export default function DriverEarningsPage() {
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const periods = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'all', label: 'All Time' },
  ];

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        period: selectedPeriod,
      });
      
      const response = await fetch(`/api/driver/earnings?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch earnings data');
      }
      
      const data = await response.json();
      setEarningsData(data.data);
    } catch (err) {
      console.error('Driver Earnings Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Error Loading Earnings',
        description: 'Failed to load your earnings data. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, [selectedPeriod]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = format(new Date(start), 'MMM dd, yyyy');
    const endDate = format(new Date(end), 'MMM dd, yyyy');
    return `${startDate} - ${endDate}`;
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    toast({
      title: 'Export',
      description: 'Export functionality coming soon',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={{ base: 4, md: 8 }}>
        <VStack spacing={6} align="center" py={20}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading your earnings...</Text>
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={{ base: 4, md: 8 }}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Error loading earnings</Text>
            <Text>{error}</Text>
          </Box>
        </Alert>
      </Container>
    );
  }

  if (!earningsData) {
    return (
      <Container maxW="container.xl" py={{ base: 4, md: 8 }}>
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          <Text>No earnings data available</Text>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={{ base: 4, md: 8 }}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <Box>
            <Heading 
              size={{ base: "md", md: "lg" }} 
              mb={2}
              color="white"
              textShadow="0 0 15px rgba(34, 197, 94, 0.8), 0 0 30px rgba(34, 197, 94, 0.5)"
            >
              My Earnings
            </Heading>
            {earningsData.dateRange && (
              <Text 
                color="white" 
                fontSize="sm"
                opacity={0.8}
                textShadow="0 0 6px rgba(255, 255, 255, 0.4)"
              >
                {formatDateRange(earningsData.dateRange.start, earningsData.dateRange.end)}
              </Text>
            )}
          </Box>
          <HStack spacing={4} wrap="wrap">
            <Select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              width={{ base: "full", sm: "150px" }}
            >
              {periods.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </Select>
            <IconButton
              aria-label="Refresh"
              icon={<FiRefreshCw />}
              onClick={fetchEarnings}
              colorScheme="blue"
              variant="outline"
              size="sm"
              position="relative"
              overflow="hidden"
              color="white"
              borderColor="neon.500"
              boxShadow="0 0 10px rgba(59, 130, 246, 0.5)"
              _hover={{
                boxShadow: "0 0 15px rgba(59, 130, 246, 0.7)",
                transform: "rotate(180deg)",
                _before: {
                  content: '""',
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: "0",
                  height: "0",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.4)",
                  transform: "translate(-50%, -50%)",
                  animation: "ripple-btn 0.5s ease-out"
                }
              }}
              sx={{
                "@keyframes ripple-btn": {
                  "0%": { width: "0", height: "0", opacity: 1 },
                  "100%": { width: "60px", height: "60px", opacity: 0 }
                }
              }}
            />
            <Button
              leftIcon={<FiDownload />}
              onClick={handleExport}
              colorScheme="blue"
              variant="outline"
              size="sm"
              position="relative"
              overflow="hidden"
              color="white"
              borderColor="neon.500"
              boxShadow="0 0 10px rgba(34, 197, 94, 0.5)"
              _hover={{
                boxShadow: "0 0 15px rgba(34, 197, 94, 0.7)",
                transform: "scale(1.05)",
                _before: {
                  content: '""',
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: "0",
                  height: "0",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.4)",
                  transform: "translate(-50%, -50%)",
                  animation: "ripple-btn 0.5s ease-out"
                }
              }}
              sx={{
                "@keyframes ripple-btn": {
                  "0%": { width: "0", height: "0", opacity: 1 },
                  "100%": { width: "100px", height: "100px", opacity: 0 }
                }
              }}
            >
              Export
            </Button>
          </HStack>
        </Flex>

        {/* Summary Cards */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
          <Card 
            bg={cardBg} 
            borderColor={borderColor}
            position="relative"
            overflow="hidden"
            boxShadow="0 0 20px rgba(34, 197, 94, 0.5), 0 0 40px rgba(34, 197, 94, 0.3)"
            transition="all 0.3s"
            animation="pulse-total-earnings 3s ease-in-out infinite"
            _hover={{
              transform: "translateY(-4px)",
              boxShadow: "0 0 30px rgba(34, 197, 94, 0.7), 0 0 60px rgba(34, 197, 94, 0.4)",
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
              "@keyframes pulse-total-earnings": {
                "0%, 100%": { boxShadow: "0 0 15px rgba(34, 197, 94, 0.4), 0 0 30px rgba(34, 197, 94, 0.2)" },
                "50%": { boxShadow: "0 0 25px rgba(34, 197, 94, 0.7), 0 0 50px rgba(34, 197, 94, 0.4)" }
              },
              "@keyframes wave-earnings": {
                "0%": { left: "-100%" },
                "100%": { left: "100%" }
              }
            }}
          >
            <CardBody position="relative" zIndex={2}>
              <Stat>
                <StatLabel color="white" opacity={0.8}>Total Earnings</StatLabel>
                <StatNumber 
                  color="white" 
                  fontSize={{ base: "lg", md: "xl" }}
                  textShadow="0 0 15px rgba(34, 197, 94, 0.9), 0 0 30px rgba(34, 197, 94, 0.6)"
                >
                  £{earningsData.summary.totalEarnings}
                </StatNumber>
                <StatHelpText color="white" opacity={0.7}>
                  <StatArrow type="increase" />
                  {earningsData.summary.totalJobs} jobs
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card 
            bg={cardBg} 
            borderColor={borderColor}
            position="relative"
            overflow="hidden"
            boxShadow="0 0 20px rgba(251, 191, 36, 0.5), 0 0 40px rgba(251, 191, 36, 0.3)"
            transition="all 0.3s"
            animation="pulse-pending 3s ease-in-out infinite"
            _hover={{
              transform: "translateY(-4px)",
              boxShadow: "0 0 30px rgba(251, 191, 36, 0.7), 0 0 60px rgba(251, 191, 36, 0.4)",
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
              "@keyframes pulse-pending": {
                "0%, 100%": { boxShadow: "0 0 15px rgba(251, 191, 36, 0.4), 0 0 30px rgba(251, 191, 36, 0.2)" },
                "50%": { boxShadow: "0 0 25px rgba(251, 191, 36, 0.7), 0 0 50px rgba(251, 191, 36, 0.4)" }
              },
              "@keyframes wave-earnings": {
                "0%": { left: "-100%" },
                "100%": { left: "100%" }
              }
            }}
          >
            <CardBody position="relative" zIndex={2}>
              <Stat>
                <StatLabel color="white" opacity={0.8}>Pending Payout</StatLabel>
                <StatNumber 
                  color="white" 
                  fontSize={{ base: "lg", md: "xl" }}
                  textShadow="0 0 15px rgba(251, 191, 36, 0.9), 0 0 30px rgba(251, 191, 36, 0.6)"
                >
                  £{earningsData.summary.pendingEarnings}
                </StatNumber>
                <StatHelpText color="white" opacity={0.7}>
                  <FiClock style={{ display: 'inline', marginRight: '4px' }} />
                  Awaiting payout
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card 
            bg={cardBg} 
            borderColor={borderColor}
            position="relative"
            overflow="hidden"
            boxShadow="0 0 20px rgba(168, 85, 247, 0.5), 0 0 40px rgba(168, 85, 247, 0.3)"
            transition="all 0.3s"
            animation="pulse-tips 3s ease-in-out infinite"
            _hover={{
              transform: "translateY(-4px)",
              boxShadow: "0 0 30px rgba(168, 85, 247, 0.7), 0 0 60px rgba(168, 85, 247, 0.4)",
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
              "@keyframes pulse-tips": {
                "0%, 100%": { boxShadow: "0 0 15px rgba(168, 85, 247, 0.4), 0 0 30px rgba(168, 85, 247, 0.2)" },
                "50%": { boxShadow: "0 0 25px rgba(168, 85, 247, 0.7), 0 0 50px rgba(168, 85, 247, 0.4)" }
              },
              "@keyframes wave-earnings": {
                "0%": { left: "-100%" },
                "100%": { left: "100%" }
              }
            }}
          >
            <CardBody position="relative" zIndex={2}>
              <Stat>
                <StatLabel color="white" opacity={0.8}>Tips Received</StatLabel>
                <StatNumber 
                  color="white" 
                  fontSize={{ base: "lg", md: "xl" }}
                  textShadow="0 0 15px rgba(168, 85, 247, 0.9), 0 0 30px rgba(168, 85, 247, 0.6)"
                >
                  £{earningsData.summary.totalTips}
                </StatNumber>
                <StatHelpText color="white" opacity={0.7}>
                  <StatArrow type="increase" />
                  Customer tips
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card 
            bg={cardBg} 
            borderColor={borderColor}
            position="relative"
            overflow="hidden"
            boxShadow="0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)"
            transition="all 0.3s"
            animation="pulse-avg 3s ease-in-out infinite"
            _hover={{
              transform: "translateY(-4px)",
              boxShadow: "0 0 30px rgba(59, 130, 246, 0.7), 0 0 60px rgba(59, 130, 246, 0.4)",
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
              "@keyframes pulse-avg": {
                "0%, 100%": { boxShadow: "0 0 15px rgba(59, 130, 246, 0.4), 0 0 30px rgba(59, 130, 246, 0.2)" },
                "50%": { boxShadow: "0 0 25px rgba(59, 130, 246, 0.7), 0 0 50px rgba(59, 130, 246, 0.4)" }
              },
              "@keyframes wave-earnings": {
                "0%": { left: "-100%" },
                "100%": { left: "100%" }
              }
            }}
          >
            <CardBody position="relative" zIndex={2}>
              <Stat>
                <StatLabel color="white" opacity={0.8}>Avg per Job</StatLabel>
                <StatNumber 
                  color="white" 
                  fontSize={{ base: "lg", md: "xl" }}
                  textShadow="0 0 15px rgba(59, 130, 246, 0.9), 0 0 30px rgba(59, 130, 246, 0.6)"
                >
                  £{earningsData.summary.averageEarningsPerJob}
                </StatNumber>
                <StatHelpText color="white" opacity={0.7}>
                  <StatArrow type="increase" />
                  Per assignment
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Earnings History */}
        <Card 
          bg={cardBg} 
          borderColor={borderColor}
          position="relative"
          overflow="hidden"
          boxShadow="0 0 25px rgba(59, 130, 246, 0.5), 0 0 50px rgba(59, 130, 246, 0.3)"
          transition="all 0.3s"
          _hover={{
            boxShadow: "0 0 35px rgba(59, 130, 246, 0.7), 0 0 70px rgba(59, 130, 246, 0.4)",
            _before: {
              content: '""',
              position: "absolute",
              top: "0",
              left: "-100%",
              width: "100%",
              height: "100%",
              background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
              animation: "wave-history 1s ease-out",
              zIndex: 1
            }
          }}
          sx={{
            "@keyframes wave-history": {
              "0%": { left: "-100%" },
              "100%": { left: "100%" }
            }
          }}
        >
          <CardHeader position="relative" zIndex={2}>
            <Heading 
              size="md"
              color="white"
              textShadow="0 0 12px rgba(59, 130, 246, 0.8), 0 0 24px rgba(59, 130, 246, 0.4)"
            >
              Earnings History
            </Heading>
          </CardHeader>
          <CardBody position="relative" zIndex={2}>
            {earningsData.earnings.length === 0 ? (
              <VStack spacing={4} py={8}>
                <FiDollarSign size={48} color="white" />
                <Text 
                  color="white"
                  textShadow="0 0 10px rgba(59, 130, 246, 0.8)"
                >
                  No earnings found for this period
                </Text>
                <Text 
                  fontSize="sm" 
                  color="white"
                  opacity={0.7}
                  textShadow="0 0 6px rgba(255, 255, 255, 0.4)"
                >
                  Complete some jobs to see your earnings here
                </Text>
              </VStack>
            ) : (
              <TableContainer>
                <Table variant="simple" size={{ base: "sm", md: "md" }}>
                  <Thead>
                    <Tr>
                      <Th color="white" opacity={0.9}>Reference</Th>
                      <Th color="white" opacity={0.9}>Customer</Th>
                      <Th isNumeric color="white" opacity={0.9}>Base</Th>
                      <Th isNumeric color="white" opacity={0.9}>Surge</Th>
                      <Th isNumeric color="white" opacity={0.9}>Tips</Th>
                      <Th isNumeric color="white" opacity={0.9}>Bonus</Th>
                      {/* Fees column removed from driver view for privacy */}
                      <Th isNumeric color="white" opacity={0.9}>Net Amount</Th>
                      <Th color="white" opacity={0.9}>Status</Th>
                      <Th color="white" opacity={0.9}>Date</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {earningsData.earnings.map((earning) => (
                      <Tr key={earning.id}>
                        <Td>
                          <Text fontFamily="mono" fontSize="sm" color="white" textShadow="0 0 6px rgba(255, 255, 255, 0.4)">
                            {earning.bookingReference}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm" color="white" opacity={0.9}>{earning.customerName}</Text>
                        </Td>
                        <Td isNumeric>
                          <Text fontSize="sm" color="white" opacity={0.9}>£{earning.baseAmount}</Text>
                        </Td>
                        <Td isNumeric>
                          <Text fontSize="sm" color="white" opacity={0.9}>£{earning.surgeAmount}</Text>
                        </Td>
                        <Td isNumeric>
                          <Text 
                            fontSize="sm" 
                            color="white"
                            textShadow="0 0 10px rgba(168, 85, 247, 0.8)"
                          >
                            £{earning.tipAmount}
                          </Text>
                        </Td>
                        <Td isNumeric>
                          <Text 
                            fontSize="sm" 
                            color="white"
                            textShadow="0 0 10px rgba(251, 191, 36, 0.8)"
                          >
                            £{(earning as any).bonusAmount || '0.00'}
                          </Text>
                        </Td>
                        {/* Fees column removed from driver view for privacy */}
                        <Td isNumeric>
                          <Text 
                            fontWeight="bold" 
                            color="white"
                            textShadow="0 0 12px rgba(34, 197, 94, 0.9), 0 0 24px rgba(34, 197, 94, 0.6)"
                          >
                            £{earning.netAmount}
                          </Text>
                        </Td>
                        <Td>
                          <HStack spacing={1}>
                            {earning.paidOut ? <FiCheckCircle size={12} color="white" /> : <FiClock size={12} color="white" />}
                            <Badge
                              colorScheme={earning.paidOut ? 'green' : 'orange'}
                              variant="subtle"
                              boxShadow={earning.paidOut 
                                ? "0 0 8px rgba(34, 197, 94, 0.6)" 
                                : "0 0 8px rgba(251, 191, 36, 0.6)"}
                            >
                              {earning.paidOut ? 'Paid' : 'Pending'}
                            </Badge>
                          </HStack>
                        </Td>
                        <Td>
                          <Text fontSize="sm" color="white" opacity={0.8}>
                            {formatDate(earning.calculatedAt)}
                          </Text>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            )}
          </CardBody>
        </Card>

        {/* Payout Information */}
        <Card 
          bg={cardBg} 
          borderColor={borderColor}
          position="relative"
          overflow="hidden"
          boxShadow="0 0 25px rgba(34, 197, 94, 0.5), 0 0 50px rgba(34, 197, 94, 0.3)"
          transition="all 0.3s"
          _hover={{
            boxShadow: "0 0 35px rgba(34, 197, 94, 0.7), 0 0 70px rgba(34, 197, 94, 0.4)",
            _before: {
              content: '""',
              position: "absolute",
              top: "0",
              left: "-100%",
              width: "100%",
              height: "100%",
              background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
              animation: "wave-payout 1s ease-out",
              zIndex: 1
            }
          }}
          sx={{
            "@keyframes wave-payout": {
              "0%": { left: "-100%" },
              "100%": { left: "100%" }
            }
          }}
        >
          <CardHeader position="relative" zIndex={2}>
            <Heading 
              size="md"
              color="white"
              textShadow="0 0 12px rgba(34, 197, 94, 0.8), 0 0 24px rgba(34, 197, 94, 0.4)"
            >
              Payout Information
            </Heading>
          </CardHeader>
          <CardBody position="relative" zIndex={2}>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Text fontWeight="medium" color="white" opacity={0.8}>Next Payout Date:</Text>
                <Text color="white" textShadow="0 0 8px rgba(255, 255, 255, 0.5)">Every Friday</Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontWeight="medium" color="white" opacity={0.8}>Payout Method:</Text>
                <Text color="white" textShadow="0 0 8px rgba(255, 255, 255, 0.5)">Bank Transfer</Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontWeight="medium" color="white" opacity={0.8}>Minimum Payout:</Text>
                <Text color="white" textShadow="0 0 8px rgba(255, 255, 255, 0.5)">£10.00</Text>
              </HStack>
              <Divider />
              <Alert 
                status="info" 
                borderRadius="md"
                bg="rgba(59, 130, 246, 0.1)"
                borderColor="neon.500"
                border="1px solid"
              >
                <AlertIcon />
                <Box>
                  <Text 
                    fontSize="sm"
                    color="white"
                    textShadow="0 0 6px rgba(255, 255, 255, 0.4)"
                  >
                    Payouts are processed every Friday for earnings from the previous week. 
                    You'll receive an email notification when your payout is processed.
                  </Text>
                </Box>
              </Alert>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
}
