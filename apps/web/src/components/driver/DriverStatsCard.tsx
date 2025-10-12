'use client';

import React from 'react';
import {
  Box as Card,
  Box as CardBody,
  VStack,
  HStack,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Icon,
  useColorModeValue,
  Badge,
  Flex,
} from '@chakra-ui/react';
import {
  FaTruck,
  FaCheckCircle,
  FaMoneyBillWave,
  FaStar,
  FaClock,
  FaChartLine,
} from 'react-icons/fa';

interface DriverStats {
  assignedJobs: number;
  availableJobs: number;
  completedToday: number;
  totalCompleted: number;
  earningsToday: number;
  totalEarnings: number;
  averageRating: number;
}

interface DriverStatsCardProps {
  stats: DriverStats;
  title: string;
  description?: string;
}

export function DriverStatsCard({ stats, title, description }: DriverStatsCardProps) {
  // Use Admin dashboard styling - dark theme with neon accents
  const bgColor = 'bg.card';
  const borderColor = 'border.primary';
  const textColor = 'text.primary';
  const textSecondary = 'text.secondary';

  return (
    <Card
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="xl"
      position="relative"
      overflow="hidden"
      cursor="pointer"
      boxShadow="0 0 25px rgba(59, 130, 246, 0.5), 0 0 50px rgba(59, 130, 246, 0.3)"
      transition="all 0.3s"
      animation="pulse-dashboard 4s ease-in-out infinite"
      _hover={{ 
        transform: 'translateY(-4px)', 
        boxShadow: "0 0 35px rgba(59, 130, 246, 0.7), 0 0 70px rgba(59, 130, 246, 0.4)",
        _before: {
          content: '""',
          position: "absolute",
          top: "0",
          left: "-100%",
          width: "100%",
          height: "100%",
          background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
          animation: "wave-dashboard 1s ease-out",
          zIndex: 1
        }
      }}
      sx={{
        "@keyframes pulse-dashboard": {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.2)"
          },
          "50%": {
            boxShadow: "0 0 35px rgba(59, 130, 246, 0.6), 0 0 70px rgba(59, 130, 246, 0.35)"
          }
        },
        "@keyframes wave-dashboard": {
          "0%": { left: "-100%" },
          "100%": { left: "100%" }
        }
      }}
    >
      <CardBody p={6} position="relative" zIndex={2}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <VStack align="start" spacing={2}>
            <Text
              fontSize="lg"
              fontWeight="bold"
              color="white"
              textShadow="0 0 12px rgba(59, 130, 246, 0.8), 0 0 24px rgba(59, 130, 246, 0.4)"
            >
              {title}
            </Text>
            {description && (
              <Text
                fontSize="sm"
                color="white"
                opacity={0.9}
                textShadow="0 0 8px rgba(255, 255, 255, 0.5)"
              >
                {description}
              </Text>
            )}
          </VStack>

          {/* Stats Grid - Matching Admin Dashboard Layout */}
          <VStack spacing={4} align="stretch">
            {/* Top Row - Primary Metrics */}
            <HStack spacing={4} align="stretch">
              <Stat flex={1}>
                <StatLabel fontSize="sm" color="white" display="flex" alignItems="center" gap={2} opacity={0.8}>
                  <Icon as={FaTruck} color="neon.400" boxSize={4} />
                  Active Jobs
                </StatLabel>
                <StatNumber 
                  fontSize="2xl" 
                  color="white" 
                  fontWeight="bold"
                  textShadow="0 0 15px rgba(59, 130, 246, 0.9), 0 0 30px rgba(59, 130, 246, 0.6)"
                >
                  {stats.assignedJobs}
                </StatNumber>
                <StatHelpText fontSize="xs" color="white" opacity={0.7}>
                  <Icon as={FaTruck} style={{ display: 'inline', marginRight: '4px' }} />
                  In progress
                </StatHelpText>
              </Stat>

              <Stat flex={1}>
                <StatLabel fontSize="sm" color="white" display="flex" alignItems="center" gap={2} opacity={0.8}>
                  <Icon as={FaCheckCircle} color="success.400" boxSize={4} />
                  Completed Today
                </StatLabel>
                <StatNumber 
                  fontSize="2xl" 
                  color="white" 
                  fontWeight="bold"
                  textShadow="0 0 15px rgba(34, 197, 94, 0.9), 0 0 30px rgba(34, 197, 94, 0.6)"
                >
                  {stats.completedToday}
                </StatNumber>
                <StatHelpText fontSize="xs" color="white" opacity={0.7}>
                  <Icon as={FaCheckCircle} style={{ display: 'inline', marginRight: '4px' }} />
                  Finished jobs
                </StatHelpText>
              </Stat>
            </HStack>

            {/* Middle Row - Earnings */}
            <HStack spacing={4} align="stretch">
              <Stat flex={1}>
                <StatLabel fontSize="sm" color="white" display="flex" alignItems="center" gap={2} opacity={0.8}>
                  <Icon as={FaMoneyBillWave} color="success.400" boxSize={4} />
                  Today's Earnings
                </StatLabel>
                <StatNumber 
                  fontSize="2xl" 
                  color="white" 
                  fontWeight="bold"
                  textShadow="0 0 15px rgba(34, 197, 94, 0.9), 0 0 30px rgba(34, 197, 94, 0.6)"
                >
                  £{stats.earningsToday.toFixed(2)}
                </StatNumber>
                <StatHelpText fontSize="xs" color="white" opacity={0.7}>
                  Today's income
                </StatHelpText>
              </Stat>

              <Stat flex={1}>
                <StatLabel fontSize="sm" color="white" display="flex" alignItems="center" gap={2} opacity={0.8}>
                  <Icon as={FaStar} color="yellow.400" boxSize={4} />
                  Average Rating
                </StatLabel>
                <StatNumber 
                  fontSize="2xl" 
                  color="white" 
                  fontWeight="bold"
                  textShadow="0 0 15px rgba(251, 191, 36, 0.9), 0 0 30px rgba(251, 191, 36, 0.6)"
                >
                  {stats.averageRating.toFixed(1)}
                </StatNumber>
                <StatHelpText fontSize="xs" color="white" opacity={0.7}>
                  Customer satisfaction
                </StatHelpText>
              </Stat>
            </HStack>

            {/* Bottom Row - Summary Stats */}
            <HStack spacing={4} align="stretch">
              <Stat flex={1}>
                <StatLabel fontSize="sm" color="white" display="flex" alignItems="center" gap={2} opacity={0.8}>
                  <Icon as={FaChartLine} color="brand.400" boxSize={4} />
                  Total Completed
                </StatLabel>
                <StatNumber 
                  fontSize="xl" 
                  color="white" 
                  fontWeight="bold"
                  textShadow="0 0 12px rgba(59, 130, 246, 0.8), 0 0 24px rgba(59, 130, 246, 0.5)"
                >
                  {stats.totalCompleted}
                </StatNumber>
                <StatHelpText fontSize="xs" color="white" opacity={0.7}>
                  All time jobs
                </StatHelpText>
              </Stat>

              <Stat flex={1}>
                <StatLabel fontSize="sm" color="white" display="flex" alignItems="center" gap={2} opacity={0.8}>
                  <Icon as={FaClock} color="orange.400" boxSize={4} />
                  Available Jobs
                </StatLabel>
                <StatNumber 
                  fontSize="xl" 
                  color="white" 
                  fontWeight="bold"
                  textShadow="0 0 12px rgba(251, 191, 36, 0.8), 0 0 24px rgba(251, 191, 36, 0.5)"
                >
                  {stats.availableJobs}
                </StatNumber>
                <StatHelpText fontSize="xs" color="white" opacity={0.7}>
                  Ready to accept
                </StatHelpText>
              </Stat>
            </HStack>
          </VStack>

          {/* Total Earnings Badge - Matching Admin Style */}
          <Flex justify="center" pt={4}>
            <Badge
              bg="success.500"
              color="white"
              size="lg"
              borderRadius="full"
              px={6}
              py={3}
              fontSize="lg"
              fontWeight="bold"
              border={`2px solid`}
              borderColor="success.300"
              position="relative"
              overflow="hidden"
              boxShadow="0 0 20px rgba(34, 197, 94, 0.7), 0 0 40px rgba(34, 197, 94, 0.4)"
              animation="pulse-earnings 3s ease-in-out infinite"
              _hover={{
                boxShadow: "0 0 25px rgba(34, 197, 94, 0.9), 0 0 50px rgba(34, 197, 94, 0.5)",
                transform: "scale(1.05)",
                _before: {
                  content: '""',
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: "0",
                  height: "0",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.5)",
                  transform: "translate(-50%, -50%)",
                  animation: "ripple-earnings 0.6s ease-out"
                }
              }}
              sx={{
                "@keyframes pulse-earnings": {
                  "0%, 100%": { boxShadow: "0 0 15px rgba(34, 197, 94, 0.6), 0 0 30px rgba(34, 197, 94, 0.3)" },
                  "50%": { boxShadow: "0 0 25px rgba(34, 197, 94, 0.9), 0 0 50px rgba(34, 197, 94, 0.5)" }
                },
                "@keyframes ripple-earnings": {
                  "0%": { width: "0", height: "0", opacity: 1 },
                  "100%": { width: "200px", height: "200px", opacity: 0 }
                }
              }}
            >
              Total Earnings: £{stats.totalEarnings.toFixed(2)}
            </Badge>
          </Flex>
        </VStack>
      </CardBody>
    </Card>
  );
}
