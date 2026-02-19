'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Input,
  SimpleGrid,
  Spinner,
  Stack,
  Switch,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';

interface AdminJob {
  id: string;
  reference: string;
  status: string;
  scheduledAt: string;
  pickupTimeSlot?: string | null;
  pickupAddress: string;
  pickupPostcode: string;
  dropoffAddress: string;
  dropoffPostcode: string;
  itemsCount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalGBP: number;
  paymentCaptured: boolean;
  stripePaymentIntentId: string | null;
  driverPricePence: number | null;
  driverPriceCurrency: string | null;
  isPublished: boolean;
  publishedAt?: string | null;
  publishedBy?: string | null;
  offerWindowRemainingSeconds: number;
  offers: JobsMarketOffer[];
  approvedOffer?: JobsMarketApprovedOffer | null;
  assignmentPendingCapture?: boolean;
  distanceMiles: number | null;
}

interface JobsMarketOffer {
  driverId: string;
  driverName?: string;
  offerPence: number;
  currency: 'gbp';
  createdAt: string;
  updatedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
}

interface JobsMarketApprovedOffer {
  driverId: string;
  offerPence: number;
  approvedAt: string;
  approvedBy: string;
}

interface DriverJob {
  id: string;
  reference: string;
  status: string;
  scheduledAt: string;
  pickupTimeSlot?: string | null;
  pickupPostcodeArea: string;
  dropoffPostcodeArea: string;
  itemsCount: number;
  driverPricePence: number | null;
  driverPriceCurrency: string | null;
  maxOfferPence: number;
  offerWindowRemainingSeconds: number;
  driverOffer: {
    offerPence: number;
    currency: 'gbp';
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
    updatedAt: string;
  } | null;
  distanceMiles: number | null;
}

interface JobsMarketResponse {
  role: 'admin' | 'driver';
  jobs: AdminJob[] | DriverJob[];
}

interface JobsMarketClientProps {
  role: string;
}

function formatCurrencyPounds(pence: number | null | undefined): string {
  if (!pence || pence <= 0) return '£0.00';
  return `£${(pence / 100).toFixed(2)}`;
}

function formatRemainingTime(seconds: number): string {
  if (seconds <= 0) return 'Expired';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
}

export default function JobsMarketClient({ role }: JobsMarketClientProps): JSX.Element {
  const toast = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [jobsResponse, setJobsResponse] = useState<JobsMarketResponse | null>(null);
  const [priceEdits, setPriceEdits] = useState<Record<string, string>>({});

  const isAdmin = role === 'admin' || role === 'superadmin';

  const loadJobs = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/jobs-market', { cache: 'no-store' });
      const data = (await response.json()) as JobsMarketResponse;

      if (!response.ok) {
        throw new Error((data as any)?.error || 'Failed to load jobs market');
      }

      setJobsResponse(data);
    } catch (error) {
      toast({
        title: 'Failed to load jobs',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const adminJobs = useMemo(() => {
    if (!jobsResponse || jobsResponse.role !== 'admin') return [] as AdminJob[];
    return jobsResponse.jobs as AdminJob[];
  }, [jobsResponse]);

  const driverJobs = useMemo(() => {
    if (!jobsResponse || jobsResponse.role !== 'driver') return [] as DriverJob[];
    const jobs = jobsResponse.jobs as DriverJob[];
    return jobs.filter((job) => Boolean(job.driverPricePence) && Number(job.driverPricePence) > 0);
  }, [jobsResponse]);

  const handlePriceChange = (orderId: string, value: string): void => {
    setPriceEdits((prev) => ({ ...prev, [orderId]: value }));
  };

  const handleSavePrice = async (orderId: string): Promise<void> => {
    const rawValue = priceEdits[orderId];
    const poundsValue = Number(rawValue);

    if (!Number.isFinite(poundsValue) || poundsValue <= 0) {
      toast({
        title: 'Invalid price',
        description: 'Enter a positive GBP amount',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const driverPricePence = Math.round(poundsValue * 100);

    try {
      const response = await fetch(`/api/jobs-market/${orderId}/set-driver-price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverPricePence, currency: 'gbp' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || 'Failed to update driver price');
      }

      toast({
        title: 'Driver price updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      await loadJobs();
    } catch (error) {
      toast({
        title: 'Failed to update price',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handlePublish = async (orderId: string, publish: boolean): Promise<void> => {
    try {
      const response = await fetch(`/api/jobs-market/${orderId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: publish }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || 'Failed to update publish status');
      }

      toast({
        title: publish ? 'Job published' : 'Job unpublished',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      await loadJobs();
    } catch (error) {
      toast({
        title: 'Publish update failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleAccept = async (orderId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/jobs-market/${orderId}/accept`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || 'Failed to accept job');
      }

      toast({
        title: 'Assigned to you',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setJobsResponse((current) => {
        if (!current || current.role !== 'driver') return current;
        const currentJobs = current.jobs as DriverJob[];
        return {
          ...current,
          jobs: currentJobs.filter((job) => job.id !== orderId),
        };
      });

      router.push(`/driver/jobs/${orderId}`);
    } catch (error) {
      toast({
        title: 'Accept failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleSendOffer = async (orderId: string, offerPence: number): Promise<void> => {
    try {
      const response = await fetch(`/api/jobs-market/${orderId}/offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerPence }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || 'Failed to submit offer');
      }

      const payload = await response.json();

      if (payload?.autoApproved) {
        toast({
          title: 'Approved автоматически — تم إسناد الطلب لك',
          status: 'success',
          duration: 4000,
          isClosable: true,
        });

        setJobsResponse((current) => {
          if (!current || current.role !== 'driver') return current;
          const currentJobs = current.jobs as DriverJob[];
          return {
            ...current,
            jobs: currentJobs.filter((job) => job.id !== orderId),
          };
        });

        router.push(`/driver/jobs/${orderId}`);
        return;
      }

      toast({
        title: 'Offer submitted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      await loadJobs();
    } catch (error) {
      toast({
        title: 'Offer failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleApproveOffer = async (orderId: string, driverId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/jobs-market/${orderId}/approve-offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || 'Failed to approve offer');
      }

      toast({
        title: 'Offer approved',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      await loadJobs();
    } catch (error) {
      toast({
        title: 'Approve failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleRejectOffer = async (orderId: string, driverId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/jobs-market/${orderId}/reject-offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || 'Failed to reject offer');
      }

      toast({
        title: 'Offer rejected',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      await loadJobs();
    } catch (error) {
      toast({
        title: 'Reject failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="7xl" py={10}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Jobs Market</Heading>
        <Button onClick={loadJobs} variant="outline">Refresh</Button>
      </Flex>

      {isLoading ? (
        <Flex align="center" justify="center" py={12}>
          <Spinner size="lg" />
        </Flex>
      ) : isAdmin ? (
        <Box borderWidth="1px" borderRadius="lg" overflow="hidden">
          <Table>
            <Thead bg="gray.50">
              <Tr>
                <Th>Reference</Th>
                <Th>Status</Th>
                <Th>Schedule</Th>
                <Th>Pickup</Th>
                <Th>Dropoff</Th>
                <Th>Items</Th>
                <Th>Driver Price</Th>
                <Th>Publish</Th>
                <Th>Offer Window</Th>
                <Th>Offers</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {adminJobs.map((job) => (
                <Tr key={job.id}>
                  <Td>
                    <Text fontWeight="semibold">{job.reference}</Text>
                    <Text fontSize="xs" color="gray.500">{job.customerName}</Text>
                  </Td>
                  <Td>
                    {job.assignmentPendingCapture ? (
                      <Text fontSize="sm" color="orange.600">Assigned, pending payment capture/confirmation</Text>
                    ) : (
                      job.status
                    )}
                  </Td>
                  <Td>
                    <Text>{new Date(job.scheduledAt).toLocaleString()}</Text>
                    {job.pickupTimeSlot ? (
                      <Text fontSize="xs" color="gray.500">{job.pickupTimeSlot}</Text>
                    ) : null}
                  </Td>
                  <Td>
                    <Text>{job.pickupAddress}</Text>
                    <Text fontSize="xs" color="gray.500">{job.pickupPostcode}</Text>
                  </Td>
                  <Td>
                    <Text>{job.dropoffAddress}</Text>
                    <Text fontSize="xs" color="gray.500">{job.dropoffPostcode}</Text>
                  </Td>
                  <Td>{job.itemsCount} items</Td>
                  <Td>
                    <Stack spacing={2}>
                      <Input
                        size="sm"
                        placeholder="GBP"
                        value={priceEdits[job.id] ?? (job.driverPricePence ? (job.driverPricePence / 100).toFixed(2) : '')}
                        onChange={(event) => handlePriceChange(job.id, event.target.value)}
                      />
                      <Text fontSize="xs" color="gray.500">Current: {formatCurrencyPounds(job.driverPricePence)}</Text>
                      {!job.driverPricePence ? (
                        <Text fontSize="xs" color="orange.500">Awaiting admin pricing</Text>
                      ) : null}
                    </Stack>
                  </Td>
                  <Td>
                    <Switch
                      isChecked={job.isPublished}
                      onChange={(event) => handlePublish(job.id, event.target.checked)}
                      isDisabled={!job.driverPricePence}
                    />
                  </Td>
                  <Td>
                    <Text fontSize="sm">{formatRemainingTime(job.offerWindowRemainingSeconds)}</Text>
                  </Td>
                  <Td>
                    <Stack spacing={2}>
                      {job.approvedOffer ? (
                        <Text fontSize="sm" color="green.600">
                          Approved: {job.approvedOffer.driverId} ({formatCurrencyPounds(job.approvedOffer.offerPence)})
                          {job.approvedOffer.approvedBy === 'system' ? ' • Auto-approved' : ''}
                        </Text>
                      ) : null}
                      {job.offers.length === 0 ? (
                        <Text fontSize="sm" color="gray.500">No offers</Text>
                      ) : (
                        job.offers.map((offer) => (
                          <Box key={`${job.id}-${offer.driverId}`} borderWidth="1px" borderRadius="md" p={2}>
                            <Text fontSize="sm" fontWeight="semibold">
                              {offer.driverName || offer.driverId}
                            </Text>
                            <Text fontSize="sm">{formatCurrencyPounds(offer.offerPence)}</Text>
                            <Text fontSize="xs" color="gray.500">{offer.status}</Text>
                            <Stack direction="row" spacing={2} mt={2}>
                              <Button
                                size="xs"
                                colorScheme="green"
                                onClick={() => handleApproveOffer(job.id, offer.driverId)}
                                isDisabled={
                                  offer.status !== 'PENDING' ||
                                  job.offerWindowRemainingSeconds <= 0 ||
                                  !job.isPublished
                                }
                              >
                                Approve
                              </Button>
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => handleRejectOffer(job.id, offer.driverId)}
                                isDisabled={offer.status !== 'PENDING'}
                              >
                                Reject
                              </Button>
                            </Stack>
                          </Box>
                        ))
                      )}
                    </Stack>
                  </Td>
                  <Td>
                    <Button size="sm" onClick={() => handleSavePrice(job.id)}>
                      Save Price
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {driverJobs.map((job) => (
            <Box key={job.id} borderWidth="1px" borderRadius="lg" p={5}>
              <Stack spacing={3}>
                <Heading size="sm">Job {job.reference}</Heading>
                <Text>Pickup area: {job.pickupPostcodeArea || 'N/A'}</Text>
                <Text>Dropoff area: {job.dropoffPostcodeArea || 'N/A'}</Text>
                <Text>Items: {job.itemsCount}</Text>
                <Text>
                  Schedule: {new Date(job.scheduledAt).toLocaleString()}
                  {job.pickupTimeSlot ? ` (${job.pickupTimeSlot})` : ''}
                </Text>
                <Text>Distance: {job.distanceMiles ? `${job.distanceMiles} miles` : 'N/A'}</Text>
                <Text fontWeight="bold">Driver payout: {formatCurrencyPounds(job.driverPricePence)}</Text>
                <Text fontSize="sm" color={job.offerWindowRemainingSeconds > 0 ? 'gray.600' : 'red.500'}>
                  Offer window: {formatRemainingTime(job.offerWindowRemainingSeconds)}
                </Text>
                {job.driverOffer ? (
                  <Text fontSize="sm" color="blue.600">
                    Your offer: {formatCurrencyPounds(job.driverOffer.offerPence)} ({job.driverOffer.status})
                  </Text>
                ) : null}
                <Stack spacing={2}>
                  <Button
                    colorScheme="green"
                    onClick={() => handleAccept(job.id)}
                    isDisabled={job.offerWindowRemainingSeconds <= 0}
                  >
                    Accept at {formatCurrencyPounds(job.driverPricePence)}
                  </Button>
                  <Text fontSize="sm" color="gray.600">Request more:</Text>
                  <Stack direction="row" spacing={2}>
                    {[500, 1000, 1500].map((increment) => {
                      const basePence = job.driverPricePence ?? 0;
                      const targetOffer = basePence + increment;
                      const isDisabled =
                        job.offerWindowRemainingSeconds <= 0 ||
                        basePence <= 0 ||
                        targetOffer > job.maxOfferPence;
                      return (
                        <Button
                          key={`${job.id}-${increment}`}
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendOffer(job.id, targetOffer)}
                          isDisabled={isDisabled}
                        >
                          +£{(increment / 100).toFixed(0)}
                        </Button>
                      );
                    })}
                  </Stack>
                </Stack>
              </Stack>
            </Box>
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
}
























































































































































































































































































































































