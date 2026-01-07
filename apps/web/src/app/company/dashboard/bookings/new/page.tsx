'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Button,
  Card,
  CardBody,
  Grid,
  Text,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  NumberInput,
  NumberInputField,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import Link from 'next/link';

export default function NewBookingPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    pickupAddressLine1: '',
    pickupCity: '',
    pickupPostcode: '',
    dropoffAddressLine1: '',
    dropoffCity: '',
    dropoffPostcode: '',
    scheduledDate: '',
    vehicleType: 'MEDIUM_VAN',
    crewSize: 2,
    poNumber: '',
    costCenter: '',
    projectCode: '',
    specialRequirements: '',
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/b2b/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          scheduledDate: new Date(formData.scheduledDate).toISOString(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Booking Created',
          description: 'Your booking has been confirmed',
          status: 'success',
          duration: 3000,
        });
        router.push('/company/dashboard/bookings');
      } else if (data.code === 'ORDER_LIMIT_REACHED') {
        toast({
          title: 'Order Limit Reached',
          description: data.error,
          status: 'error',
          duration: 7000,
        });
      } else {
        toast({
          title: 'Booking Failed',
          description: data.error || 'Failed to create booking',
          status: 'error',
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="gray.50">
      <Box bg="white" borderBottom="1px" borderColor="gray.200" py={4}>
        <Container maxW="7xl">
          <HStack>
            <Button
              as={Link}
              href="/company/dashboard"
              leftIcon={<ArrowBackIcon />}
              variant="ghost"
            >
              Back
            </Button>
            <Heading size="lg">New Booking</Heading>
          </HStack>
        </Container>
      </Box>

      <Container maxW="4xl" py={8}>
        <form onSubmit={handleSubmit}>
          <VStack spacing={6} align="stretch">
            {/* Pickup Address */}
            <Card>
              <CardBody>
                <Heading size="md" mb={4}>Pickup Address</Heading>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                  <FormControl isRequired gridColumn={{ base: '1', md: '1 / -1' }}>
                    <FormLabel>Address Line 1</FormLabel>
                    <Input
                      value={formData.pickupAddressLine1}
                      onChange={(e) => handleChange('pickupAddressLine1', e.target.value)}
                      placeholder="Street address"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>City</FormLabel>
                    <Input
                      value={formData.pickupCity}
                      onChange={(e) => handleChange('pickupCity', e.target.value)}
                      placeholder="City"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Postcode</FormLabel>
                    <Input
                      value={formData.pickupPostcode}
                      onChange={(e) => handleChange('pickupPostcode', e.target.value)}
                      placeholder="SW1A 1AA"
                    />
                  </FormControl>
                </Grid>
              </CardBody>
            </Card>

            {/* Dropoff Address */}
            <Card>
              <CardBody>
                <Heading size="md" mb={4}>Dropoff Address</Heading>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                  <FormControl isRequired gridColumn={{ base: '1', md: '1 / -1' }}>
                    <FormLabel>Address Line 1</FormLabel>
                    <Input
                      value={formData.dropoffAddressLine1}
                      onChange={(e) => handleChange('dropoffAddressLine1', e.target.value)}
                      placeholder="Street address"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>City</FormLabel>
                    <Input
                      value={formData.dropoffCity}
                      onChange={(e) => handleChange('dropoffCity', e.target.value)}
                      placeholder="City"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Postcode</FormLabel>
                    <Input
                      value={formData.dropoffPostcode}
                      onChange={(e) => handleChange('dropoffPostcode', e.target.value)}
                      placeholder="M1 1AA"
                    />
                  </FormControl>
                </Grid>
              </CardBody>
            </Card>

            {/* Service Details */}
            <Card>
              <CardBody>
                <Heading size="md" mb={4}>Service Details</Heading>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                  <FormControl isRequired>
                    <FormLabel>Scheduled Date & Time</FormLabel>
                    <Input
                      type="datetime-local"
                      value={formData.scheduledDate}
                      onChange={(e) => handleChange('scheduledDate', e.target.value)}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Vehicle Type</FormLabel>
                    <Select
                      value={formData.vehicleType}
                      onChange={(e) => handleChange('vehicleType', e.target.value)}
                    >
                      <option value="SMALL_VAN">Small Van</option>
                      <option value="MEDIUM_VAN">Medium Van</option>
                      <option value="LARGE_VAN">Large Van</option>
                      <option value="LUTON_VAN">Luton Van</option>
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Crew Size</FormLabel>
                    <NumberInput
                      min={1}
                      max={4}
                      value={formData.crewSize}
                      onChange={(_, value) => handleChange('crewSize', value)}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>
                </Grid>
              </CardBody>
            </Card>

            {/* Business Details */}
            <Card>
              <CardBody>
                <Heading size="md" mb={4}>Business Details</Heading>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>PO Number</FormLabel>
                    <Input
                      value={formData.poNumber}
                      onChange={(e) => handleChange('poNumber', e.target.value)}
                      placeholder="Purchase Order Number"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Cost Center</FormLabel>
                    <Input
                      value={formData.costCenter}
                      onChange={(e) => handleChange('costCenter', e.target.value)}
                      placeholder="Optional"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Project Code</FormLabel>
                    <Input
                      value={formData.projectCode}
                      onChange={(e) => handleChange('projectCode', e.target.value)}
                      placeholder="Optional"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Special Requirements</FormLabel>
                    <Textarea
                      value={formData.specialRequirements}
                      onChange={(e) => handleChange('specialRequirements', e.target.value)}
                      placeholder="Any special instructions..."
                      rows={4}
                    />
                  </FormControl>
                </VStack>
              </CardBody>
            </Card>

            {/* Submit */}
            <HStack justify="space-between">
              <Button
                as={Link}
                href="/company/dashboard"
                variant="ghost"
                size="lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                isLoading={loading}
                loadingText="Creating..."
              >
                Create Booking
              </Button>
            </HStack>
          </VStack>
        </form>
      </Container>
    </Box>
  );
}
