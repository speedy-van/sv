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
  const bgColor = 'bg.card';
  const borderColor = 'border.primary';

  return (
    <Card
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="xl"
      position="relative"
      overflow="hidden"
      cursor="pointer"
      boxShadow="md"
      transition="all 0.3s"
      _hover={{ 
        transform: 'translateY(-4px)', 
        borderColor: 'border.neon',
        boxShadow: 'lg',
      }}
    >
      <CardBody p={6} position="relative" zIndex={2}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <VStack align="start" spacing={2}>
            <Text
              fontSize="lg"
              fontWeight="bold"
              color="text.primary"
            >
              {title}
            </Text>
            {description && (
              <Text
                fontSize="sm"
                color="text.secondary"
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
                <StatLabel fontSize="sm" color="text.secondary" display="flex" alignItems="center" gap={2}>
                  <Icon as={FaTruck} color="neon.400" boxSize={4} />
                  Active Jobs
                </StatLabel>
                <StatNumber 
                  fontSize="2xl" 
                  color="text.primary" 
                  fontWeight="bold"
                >
                  {stats.assignedJobs}
                </StatNumber>
                <StatHelpText fontSize="xs" color="text.tertiary">
                  <Icon as={FaTruck} style={{ display: 'inline', marginRight: '4px' }} />
                  In progress
                </StatHelpText>
              </Stat>

              <Stat flex={1}>
                <StatLabel fontSize="sm" color="text.secondary" display="flex" alignItems="center" gap={2}>
                  <Icon as={FaCheckCircle} color="success.400" boxSize={4} />
                  Completed Today
                </StatLabel>
                <StatNumber 
                  fontSize="2xl" 
                  color="text.primary" 
                  fontWeight="bold"
                >
                  {stats.completedToday}
                </StatNumber>
                <StatHelpText fontSize="xs" color="text.tertiary">
                  <Icon as={FaCheckCircle} style={{ display: 'inline', marginRight: '4px' }} />
                  Finished jobs
                </StatHelpText>
              </Stat>
            </HStack>

            {/* Middle Row - Earnings */}
            <HStack spacing={4} align="stretch">
              <Stat flex={1}>
                <StatLabel fontSize="sm" color="text.secondary" display="flex" alignItems="center" gap={2}>
                  <Icon as={FaMoneyBillWave} color="success.400" boxSize={4} />
                  Today's Earnings
                </StatLabel>
                <StatNumber 
                  fontSize="2xl" 
                  color="text.primary" 
                  fontWeight="bold"
                >
                  £{stats.earningsToday.toFixed(2)}
                </StatNumber>
                <StatHelpText fontSize="xs" color="text.tertiary">
                  Today's income
                </StatHelpText>
              </Stat>

              <Stat flex={1}>
                <StatLabel fontSize="sm" color="text.secondary" display="flex" alignItems="center" gap={2}>
                  <Icon as={FaStar} color="yellow.400" boxSize={4} />
                  Average Rating
                </StatLabel>
                <StatNumber 
                  fontSize="2xl" 
                  color="text.primary" 
                  fontWeight="bold"
                >
                  {stats.averageRating.toFixed(1)}
                </StatNumber>
                <StatHelpText fontSize="xs" color="text.tertiary">
                  Customer satisfaction
                </StatHelpText>
              </Stat>
            </HStack>

            {/* Bottom Row - Summary Stats */}
            <HStack spacing={4} align="stretch">
              <Stat flex={1}>
                <StatLabel fontSize="sm" color="text.secondary" display="flex" alignItems="center" gap={2}>
                  <Icon as={FaChartLine} color="brand.400" boxSize={4} />
                  Total Completed
                </StatLabel>
                <StatNumber 
                  fontSize="xl" 
                  color="text.primary" 
                  fontWeight="bold"
                >
                  {stats.totalCompleted}
                </StatNumber>
                <StatHelpText fontSize="xs" color="text.tertiary">
                  All time jobs
                </StatHelpText>
              </Stat>

              <Stat flex={1}>
                <StatLabel fontSize="sm" color="text.secondary" display="flex" alignItems="center" gap={2}>
                  <Icon as={FaClock} color="orange.400" boxSize={4} />
                  Available Jobs
                </StatLabel>
                <StatNumber 
                  fontSize="xl" 
                  color="text.primary" 
                  fontWeight="bold"
                >
                  {stats.availableJobs}
                </StatNumber>
                <StatHelpText fontSize="xs" color="text.tertiary">
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
              _hover={{
                boxShadow: "0 0 0 3px rgba(34, 197, 94, 0.25)",
                transform: "scale(1.05)",
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
