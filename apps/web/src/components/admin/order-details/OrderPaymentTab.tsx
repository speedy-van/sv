'use client';

import React from 'react';
import {
  VStack,
  HStack,
  Text,
  Badge,
  Divider,
  Box,
  Card,
  CardBody,
  SimpleGrid,
  Button,
} from '@chakra-ui/react';
import { FiDollarSign, FiClock, FiCreditCard, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { OrderDetail } from '../OrderDetailDrawer';
import PaymentConfirmationButton from '../PaymentConfirmationButton';

interface OrderPaymentTabProps {
  order: OrderDetail;
  bgColor: string;
  textColor: string;
  borderColor: string;
  cardBg: string;
  secondaryTextColor: string;
  onRefresh?: () => void;
}

export function OrderPaymentTab({
  order,
  bgColor,
  textColor,
  borderColor,
  cardBg,
  secondaryTextColor,
  onRefresh,
}: OrderPaymentTabProps) {
  const formatCurrency = (amount: number) => {
    return `£${(amount / 100).toFixed(2)}`;
  };

  const formatDateTime = (value: string) => {
    try {
      return new Date(value).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return value;
    }
  };

  const totalGBP = order.totalGBP || 0;
  const amountPaidGBP = order.amountPaidGBP || 0;
  const remainingAmount = totalGBP - amountPaidGBP;
  const paymentStatus = order.paidAt ? 'paid' : amountPaidGBP > 0 ? 'partial' : 'unpaid';
  const paymentPercentage = totalGBP > 0 ? (amountPaidGBP / totalGBP) * 100 : 0;

  return (
    <VStack spacing={6} align="stretch">
      {/* Payment Status Overview */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
        <CardBody>
          <VStack align="stretch" spacing={4}>
            <HStack justify="space-between">
              <Text fontWeight="bold" fontSize="lg" color={textColor}>
                Payment Status
              </Text>
              <Badge
                colorScheme={
                  paymentStatus === 'paid' ? 'green' :
                  paymentStatus === 'partial' ? 'yellow' : 'orange'
                }
                size="lg"
              >
                {paymentStatus === 'paid' ? '✓ Paid' :
                 paymentStatus === 'partial' ? '⚠ Partially Paid' : '✗ Unpaid'}
              </Badge>
            </HStack>

            <Divider borderColor={borderColor} />

            {/* Payment Progress */}
            <VStack align="stretch" spacing={2}>
              <HStack justify="space-between">
                <Text fontSize="sm" color={secondaryTextColor}>Payment Progress</Text>
                <Text fontSize="sm" fontWeight="bold" color={textColor}>
                  {paymentPercentage.toFixed(1)}%
                </Text>
              </HStack>
              <Box
                h="8px"
                bg={borderColor}
                borderRadius="full"
                overflow="hidden"
              >
                <Box
                  h="100%"
                  bg={
                    paymentStatus === 'paid' ? '#10b981' :
                    paymentStatus === 'partial' ? '#f59e0b' : '#ef4444'
                  }
                  w={`${paymentPercentage}%`}
                  transition="width 0.3s"
                />
              </Box>
            </VStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Payment Details */}
      <SimpleGrid columns={2} spacing={4}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardBody>
            <VStack align="start" spacing={2}>
              <HStack>
                <FiDollarSign color={secondaryTextColor} />
                <Text fontSize="xs" color={secondaryTextColor}>Total Amount</Text>
              </HStack>
              <Text fontSize="xl" fontWeight="bold" color="#10b981">
                {formatCurrency(totalGBP)}
              </Text>
            </VStack>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardBody>
            <VStack align="start" spacing={2}>
              <HStack>
                <FiCheckCircle color={secondaryTextColor} />
                <Text fontSize="xs" color={secondaryTextColor}>Amount Paid</Text>
              </HStack>
              <Text fontSize="xl" fontWeight="bold" color={paymentStatus === 'paid' ? '#10b981' : '#f59e0b'}>
                {formatCurrency(amountPaidGBP)}
              </Text>
            </VStack>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardBody>
            <VStack align="start" spacing={2}>
              <HStack>
                <FiAlertCircle color={secondaryTextColor} />
                <Text fontSize="xs" color={secondaryTextColor}>Remaining</Text>
              </HStack>
              <Text fontSize="xl" fontWeight="bold" color={remainingAmount > 0 ? '#ef4444' : '#10b981'}>
                {formatCurrency(remainingAmount)}
              </Text>
            </VStack>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardBody>
            <VStack align="start" spacing={2}>
              <HStack>
                <FiClock color={secondaryTextColor} />
                <Text fontSize="xs" color={secondaryTextColor}>Payment Date</Text>
              </HStack>
              <Text fontSize="sm" fontWeight="bold" color={textColor}>
                {order.paidAt ? formatDateTime(order.paidAt) : 'Not paid'}
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Payment Actions */}
      {order.status === 'PENDING_PAYMENT' && (
        <Card bg={cardBg} borderColor="#f59e0b" borderWidth={2}>
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <HStack>
                <FiCreditCard color="#f59e0b" />
                <Text fontWeight="bold" color={textColor}>
                  Payment Confirmation Required
                </Text>
              </HStack>
              <Text fontSize="sm" color={secondaryTextColor}>
                This order is pending payment confirmation. Click the button below to confirm payment has been received.
              </Text>
              <PaymentConfirmationButton
                booking={{
                  id: order.id,
                  reference: order.reference,
                  status: order.status,
                  totalGBP: order.totalGBP,
                  customerName: order.customerName,
                  paidAt: order.paidAt
                }}
                onSuccess={() => {
                  if (onRefresh) onRefresh();
                }}
              />
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Payment History */}
      {order.paidAt && (
        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardBody>
            <VStack align="stretch" spacing={3}>
              <Text fontWeight="bold" fontSize="md" color={textColor}>
                Payment History
              </Text>
              <Divider borderColor={borderColor} />
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color={secondaryTextColor}>Payment Date</Text>
                  <Text fontSize="sm" fontWeight="bold" color={textColor}>
                    {formatDateTime(order.paidAt)}
                  </Text>
                </VStack>
                <VStack align="end" spacing={1}>
                  <Text fontSize="sm" color={secondaryTextColor}>Amount</Text>
                  <Text fontSize="sm" fontWeight="bold" color="#10b981">
                    {formatCurrency(amountPaidGBP)}
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      )}
    </VStack>
  );
}

