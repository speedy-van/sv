'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  VStack,
  HStack,
  Text,
  useToast,
  Select,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Divider,
} from '@chakra-ui/react';

// Function to play chat notification sound
const playChatNotificationSound = () => {
  if (typeof window === 'undefined') return;
  
  try {
    // Use Web Audio API to create a pleasant notification sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Create a pleasant two-tone chime sound for chat notifications
    // First tone (higher)
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.type = 'sine';
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
    
    // Play second tone after a short delay
    setTimeout(() => {
      try {
        const audioContext2 = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator2 = audioContext2.createOscillator();
        const gainNode2 = audioContext2.createGain();
        
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext2.destination);
        
        oscillator2.frequency.setValueAtTime(1000, audioContext2.currentTime);
        oscillator2.frequency.setValueAtTime(1200, audioContext2.currentTime + 0.1);
        
        gainNode2.gain.setValueAtTime(0, audioContext2.currentTime);
        gainNode2.gain.linearRampToValueAtTime(0.3, audioContext2.currentTime + 0.01);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext2.currentTime + 0.3);
        
        oscillator2.type = 'sine';
        oscillator2.start(audioContext2.currentTime);
        oscillator2.stop(audioContext2.currentTime + 0.3);
      } catch (e) {
        // Ignore errors for second tone
      }
    }, 150);
  } catch (e) {
    console.log('Audio notification not available:', e);
    // Fallback: Try to play a simple beep using HTML5 Audio
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURAJR6Hh8sBrJAUwgM/y2IU1CBxou+3nn00QDFCn4/C2YxwGOJHX8sx5LAUkd8fw3ZBAC');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio play errors
      });
    } catch (fallbackError) {
      // Ignore all audio errors
    }
  }
};

interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  service?: string;
  message: string;
  status: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export default function ContactInquiriesPage() {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchInquiries();
    
    // Setup Pusher for real-time notifications
    if (typeof window !== 'undefined' && (window as any).Pusher) {
      const PUSHER_KEY = '407cb06c423e6c032e9c';
      const PUSHER_CLUSTER = 'eu';
      
      const pusher = new (window as any).Pusher(PUSHER_KEY, {
        cluster: PUSHER_CLUSTER,
      });
      
      const notificationsChannel = pusher.subscribe('admin-notifications');
      
      notificationsChannel.bind('live-chat-message', (data: any) => {
        console.log('💬 New live chat message received:', data);
        
        toast({
          title: '💬 New Live Chat Message',
          description: `${data.data.customerName} sent a message`,
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
        
        // Play notification sound
        playChatNotificationSound();
        
        // Refresh inquiries list
        fetchInquiries();
      });
      
      return () => {
        notificationsChannel.unbind_all();
        notificationsChannel.unsubscribe();
        pusher.disconnect();
      };
    }
  }, [statusFilter, toast]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/contact-inquiries?status=${statusFilter}`);
      const data = await response.json();
      
      if (response.ok) {
        setInquiries(data.inquiries);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch contact inquiries',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/contact-inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Status updated successfully',
          status: 'success',
          duration: 2000,
        });
        fetchInquiries();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'contacted': return 'blue';
      case 'resolved': return 'green';
      default: return 'gray';
    }
  };

  const viewDetails = (inquiry: ContactInquiry) => {
    setSelectedInquiry(inquiry);
    onOpen();
  };

  return (
    <Box minH="100vh" bg="#0D0D0D" py={8}>
      <Container maxW="container.xl">
        <VStack spacing={6} align="stretch">
          <HStack justify="space-between">
            <Heading size="lg" color="white">Contact Inquiries</Heading>
            <Button onClick={fetchInquiries} colorScheme="blue" size="sm">
              Refresh
            </Button>
          </HStack>

          <HStack>
            <Text fontWeight="medium" color="white">Filter by status:</Text>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              maxW="200px"
              bg="rgba(255,255,255,0.05)"
              color="white"
              borderColor="rgba(255,255,255,0.1)"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="contacted">Contacted</option>
              <option value="resolved">Resolved</option>
            </Select>
          </HStack>

          {loading ? (
            <Box textAlign="center" py={10}>
              <Spinner size="lg" color="neon.400" />
            </Box>
          ) : inquiries.length === 0 ? (
            <Box textAlign="center" py={10}>
              <Text color="gray.400">No inquiries found</Text>
            </Box>
          ) : (
            <Box overflowX="auto" bg="rgba(255,255,255,0.05)" borderRadius="lg" shadow="lg" border="1px" borderColor="rgba(255,255,255,0.1)">
              <Table variant="simple" colorScheme="whiteAlpha">
                <Thead bg="rgba(255,255,255,0.05)">
                  <Tr>
                    <Th color="gray.400">Date</Th>
                    <Th color="gray.400">Name</Th>
                    <Th color="gray.400">Email</Th>
                    <Th color="gray.400">Phone</Th>
                    <Th color="gray.400">Service</Th>
                    <Th color="gray.400">Status</Th>
                    <Th color="gray.400">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {inquiries.map((inquiry) => (
                    <Tr key={inquiry.id} _hover={{ bg: 'rgba(255,255,255,0.05)' }}>
                      <Td color="gray.300">{new Date(inquiry.createdAt).toLocaleDateString()}</Td>
                      <Td fontWeight="medium" color="white">{inquiry.name}</Td>
                      <Td color="gray.300">{inquiry.email}</Td>
                      <Td color="gray.300">{inquiry.phone || '-'}</Td>
                      <Td color="gray.300">{inquiry.service || '-'}</Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(inquiry.status)}>
                          {inquiry.status}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <Button size="xs" onClick={() => viewDetails(inquiry)} variant="outline" colorScheme="blue">
                            View
                          </Button>
                          {inquiry.status === 'pending' && (
                            <Button
                              size="xs"
                              colorScheme="blue"
                              onClick={() => updateStatus(inquiry.id, 'contacted')}
                            >
                              Mark Contacted
                            </Button>
                          )}
                          {inquiry.status === 'contacted' && (
                            <Button
                              size="xs"
                              colorScheme="green"
                              onClick={() => updateStatus(inquiry.id, 'resolved')}
                            >
                              Resolve
                            </Button>
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </VStack>
      </Container>

      {/* Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay bg="rgba(0,0,0,0.8)" backdropFilter="blur(4px)" />
        <ModalContent bg="#1A1A1A" border="1px" borderColor="rgba(255,255,255,0.1)">
          <ModalHeader color="white">Inquiry Details</ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody pb={6}>
            {selectedInquiry && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold" mb={1} color="gray.400">Name:</Text>
                  <Text color="white">{selectedInquiry.name}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" mb={1} color="gray.400">Email:</Text>
                  <Text color="white">{selectedInquiry.email}</Text>
                </Box>
                {selectedInquiry.phone && (
                  <Box>
                    <Text fontWeight="bold" mb={1} color="gray.400">Phone:</Text>
                    <Text color="white">{selectedInquiry.phone}</Text>
                  </Box>
                )}
                {selectedInquiry.service && (
                  <Box>
                    <Text fontWeight="bold" mb={1} color="gray.400">Service:</Text>
                    <Text color="white">{selectedInquiry.service}</Text>
                  </Box>
                )}
                <Divider borderColor="rgba(255,255,255,0.1)" />
                <Box>
                  <Text fontWeight="bold" mb={1} color="gray.400">Message:</Text>
                  <Text whiteSpace="pre-wrap" color="white">{selectedInquiry.message}</Text>
                </Box>
                <Divider borderColor="rgba(255,255,255,0.1)" />
                <HStack justify="space-between">
                  <Box>
                    <Text fontSize="sm" color="gray.400">Status:</Text>
                    <Badge colorScheme={getStatusColor(selectedInquiry.status)}>
                      {selectedInquiry.status}
                    </Badge>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.400">Received:</Text>
                    <Text fontSize="sm" color="white">
                      {new Date(selectedInquiry.createdAt).toLocaleString()}
                    </Text>
                  </Box>
                </HStack>
                <HStack spacing={2}>
                  {selectedInquiry.status === 'pending' && (
                    <Button
                      colorScheme="blue"
                      onClick={() => {
                        updateStatus(selectedInquiry.id, 'contacted');
                        onClose();
                      }}
                    >
                      Mark as Contacted
                    </Button>
                  )}
                  {selectedInquiry.status === 'contacted' && (
                    <Button
                      colorScheme="green"
                      onClick={() => {
                        updateStatus(selectedInquiry.id, 'resolved');
                        onClose();
                      }}
                    >
                      Mark as Resolved
                    </Button>
                  )}
                  <Button
                    as="a"
                    href={`mailto:${selectedInquiry.email}`}
                    colorScheme="gray"
                  >
                    Reply via Email
                  </Button>
                </HStack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
