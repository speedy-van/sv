import React, { useState } from 'react';
import {
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Box,
  Divider,
  Spinner,
  Code
} from '@chakra-ui/react';

interface PaymentConfirmationButtonProps {
  booking: {
    id: string;
    reference: string;
    status: string;
    totalGBP: number;
    customerName: string;
    paidAt?: string;
    stripePaymentIntentId?: string;
  };
  onSuccess?: () => void;
}

export default function PaymentConfirmationButton({ 
  booking, 
  onSuccess 
}: PaymentConfirmationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const isPendingPayment = booking.status === 'PENDING_PAYMENT';

  const handleConfirmPayment = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${booking.reference}/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setConfirmationResult(result);
        toast({
          title: 'Payment Confirmed Successfully',
          description: `Booking ${booking.reference} has been confirmed and will appear in driver jobs`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        onSuccess?.();
        onOpen(); // Show details modal
      } else {
        throw new Error(result.error || 'Failed to confirm payment');
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        title: 'Payment Confirmation Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isPendingPayment) {
    return (
      <Badge colorScheme="green" size="sm">
        Payment Confirmed
      </Badge>
    );
  }

  return (
    <>
      <VStack spacing={2} align="stretch">
        <Alert status="warning" size="sm">
          <AlertIcon />
          <Box>
            <AlertTitle fontSize="sm">Payment Issue!</AlertTitle>
            <AlertDescription fontSize="xs">
              This booking shows as PENDING_PAYMENT but may have been paid. 
              This prevents it from appearing in driver jobs.
            </AlertDescription>
          </Box>
        </Alert>
        
        <Button
          size="sm"
          colorScheme="blue"
          onClick={handleConfirmPayment}
          isLoading={isLoading}
          loadingText="Confirming..."
          leftIcon={isLoading ? <Spinner size="sm" /> : undefined}
        >
          Manually Confirm Payment
        </Button>
      </VStack>

      {/* Success Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Payment Confirmed Successfully</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {confirmationResult && (
              <VStack spacing={4} align="stretch">
                <Alert status="success">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Booking Fixed!</AlertTitle>
                    <AlertDescription>
                      Booking {confirmationResult.booking.reference} has been manually confirmed
                      and should now appear in the driver jobs dashboard.
                    </AlertDescription>
                  </Box>
                </Alert>

                <Box>
                  <Text fontWeight="bold" mb={2}>Booking Details:</Text>
                  <VStack spacing={1} align="stretch" fontSize="sm">
                    <HStack justify="space-between">
                      <Text>Reference:</Text>
                      <Code>{confirmationResult.booking.reference}</Code>
                    </HStack>
                    <HStack justify="space-between">
                      <Text>Previous Status:</Text>
                      <Badge colorScheme="orange">{confirmationResult.booking.previousStatus}</Badge>
                    </HStack>
                    <HStack justify="space-between">
                      <Text>New Status:</Text>
                      <Badge colorScheme="green">{confirmationResult.booking.status}</Badge>
                    </HStack>
                    <HStack justify="space-between">
                      <Text>Paid At:</Text>
                      <Text>{new Date(confirmationResult.booking.paidAt).toLocaleString()}</Text>
                    </HStack>
                  </VStack>
                </Box>

                {confirmationResult.stripeInfo && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>Stripe Information:</Text>
                    <VStack spacing={1} align="stretch" fontSize="sm">
                      <HStack justify="space-between">
                        <Text>Payment Intent:</Text>
                        <Code fontSize="xs">{confirmationResult.stripeInfo.paymentIntentId}</Code>
                      </HStack>
                      <HStack justify="space-between">
                        <Text>Payment Status:</Text>
                        <Badge colorScheme="green">{confirmationResult.stripeInfo.paymentStatus}</Badge>
                      </HStack>
                    </VStack>
                  </Box>
                )}

                <Divider />

                <Box>
                  <Text fontWeight="bold" mb={2}>Next Steps:</Text>
                  <VStack spacing={1} align="stretch" fontSize="sm">
                    {confirmationResult.nextSteps?.map((step: string, index: number) => (
                      <Text key={index}>• {step}</Text>
                    ))}
                  </VStack>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}