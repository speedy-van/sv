'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge,
  Divider,
  Spinner,
  Icon,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import { FiMessageSquare, FiSend, FiCheck, FiAlertCircle } from 'react-icons/fi';
import Button from '@/components/common/Button';

interface Recipient {
  id: string;
  name: string;
  phone: string;
  type: 'driver' | 'customer' | 'admin';
}

interface SMSHistory {
  id: string;
  to: string;
  message: string;
  status: string;
  sentAt: string;
}

export default function SendSMSPage() {
  const { data: session } = useSession();
  const toast = useToast();
  
  // Form state
  const [recipientType, setRecipientType] = useState<'manual' | 'driver' | 'customer' | 'admin'>('manual');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  // Data state
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [smsHistory, setSmsHistory] = useState<SMSHistory[]>([]);
  const [stats, setStats] = useState({
    sent: 0,
    delivered: 0,
    failed: 0,
    balance: 0,
  });

  // Load recipients when type changes
  useEffect(() => {
    if (recipientType !== 'manual') {
      loadRecipients(recipientType);
    }
  }, [recipientType]);

  // Load SMS balance on mount
  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      const response = await fetch('/api/admin/sms/balance');
      if (!response.ok) throw new Error('Failed to load balance');
      
      const data = await response.json();
      setStats(prev => ({ ...prev, balance: data.balance || 0 }));
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const loadRecipients = async (type: string) => {
    setLoadingRecipients(true);
    try {
      const response = await fetch(`/api/admin/sms/recipients?type=${type}`);
      if (!response.ok) throw new Error('Failed to load recipients');
      
      const data = await response.json();
      setRecipients(data.recipients || []);
    } catch (error) {
      console.error('Error loading recipients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recipients',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingRecipients(false);
    }
  };

  const validatePhoneNumber = (phone: string): { valid: boolean; formatted: string; error?: string } => {
    // Remove all spaces and special characters
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // Check if it starts with +44 or 0044
    if (cleaned.startsWith('+44')) {
      cleaned = '0044' + cleaned.substring(3);
    } else if (cleaned.startsWith('44') && !cleaned.startsWith('0044')) {
      cleaned = '0044' + cleaned.substring(2);
    } else if (cleaned.startsWith('0') && !cleaned.startsWith('0044')) {
      // Convert 07... to 00447...
      cleaned = '0044' + cleaned.substring(1);
    }
    
    // Ensure it starts with 0044
    if (!cleaned.startsWith('0044')) {
      return {
        valid: false,
        formatted: '',
        error: 'Phone number must be in UK format (starting with 0044)',
      };
    }
    
    // Validate length (0044 + 10 digits = 14 total)
    if (cleaned.length !== 14) {
      return {
        valid: false,
        formatted: '',
        error: 'Invalid UK phone number length',
      };
    }
    
    return {
      valid: true,
      formatted: cleaned,
    };
  };

  const handleSendSMS = async () => {
    // Get the phone number
    let finalPhone = '';
    
    if (recipientType === 'manual') {
      if (!phoneNumber.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Please enter a phone number',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      finalPhone = phoneNumber;
    } else {
      if (!selectedRecipient) {
        toast({
          title: 'Validation Error',
          description: 'Please select a recipient',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      const recipient = recipients.find(r => r.id === selectedRecipient);
      if (!recipient) {
        toast({
          title: 'Error',
          description: 'Selected recipient not found',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      finalPhone = recipient.phone;
    }
    
    // Validate message
    if (!message.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a message',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    // Validate phone number format
    const validation = validatePhoneNumber(finalPhone);
    if (!validation.valid) {
      toast({
        title: 'Invalid Phone Number',
        description: validation.error || 'Phone number must start with 0044',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    setSending(true);
    
    try {
      const response = await fetch('/api/admin/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: validation.formatted,
          message: message.trim(),
          sender: 'SpeedyVan',
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send SMS');
      }
      
      toast({
        title: 'SMS Sent Successfully',
        description: `Message sent to ${validation.formatted}. Message ID: ${result.messageId}`,
        status: 'success',
        duration: 7000,
        isClosable: true,
      });
      
      // Log request and response
      console.log('=== SMS SEND REQUEST ===');
      console.log('To:', validation.formatted);
      console.log('Message:', message.trim());
      console.log('=== SMS SEND RESPONSE ===');
      console.log('Status:', response.status);
      console.log('Result:', result);
      console.log('========================');
      
      // Reset form
      setMessage('');
      setPhoneNumber('');
      setSelectedRecipient('');
      
      // Update stats
      setStats(prev => ({ 
        ...prev, 
        sent: prev.sent + 1,
        balance: Math.max(0, prev.balance - (result.creditsUsed || 1))
      }));
      
    } catch (error) {
      console.error('SMS sending error:', error);
      
      toast({
        title: 'Failed to Send SMS',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 7000,
        isClosable: true,
      });
      
      setStats(prev => ({ ...prev, failed: prev.failed + 1 }));
    } finally {
      setSending(false);
    }
  };

  const characterCount = message.length;
  const messageCount = Math.ceil(characterCount / 160);

  return (
    <Box p={6}>
      <VStack align="start" spacing={6} w="full">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>
            Send SMS
          </Heading>
          <Text color="text.secondary">
            Send SMS notifications to drivers, customers, or admins using Voodoo SMS.
          </Text>
        </Box>

        {/* Stats */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} w="full">
          <Card bg="bg.surface" border="1px solid" borderColor="border.primary">
            <CardBody>
              <Stat>
                <StatLabel>Messages Sent</StatLabel>
                <StatNumber color="neon.500">{stats.sent}</StatNumber>
                <StatHelpText>This session</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg="bg.surface" border="1px solid" borderColor="border.primary">
            <CardBody>
              <Stat>
                <StatLabel>Delivered</StatLabel>
                <StatNumber color="green.500">{stats.delivered}</StatNumber>
                <StatHelpText>Successfully delivered</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg="bg.surface" border="1px solid" borderColor="border.primary">
            <CardBody>
              <Stat>
                <StatLabel>Failed</StatLabel>
                <StatNumber color="red.500">{stats.failed}</StatNumber>
                <StatHelpText>Failed to send</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg="bg.surface" border="1px solid" borderColor="border.primary">
            <CardBody>
              <Stat>
                <StatLabel>SMS Balance</StatLabel>
                <StatNumber color="blue.500">{stats.balance}</StatNumber>
                <StatHelpText>Credits remaining</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Important Notice */}
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>UK National Format Required</AlertTitle>
            <AlertDescription>
              All phone numbers must be in UK national format starting with <strong>0044</strong>. 
              Numbers starting with +44 or 0 will be automatically converted.
            </AlertDescription>
          </Box>
        </Alert>

        {/* Main Form */}
        <Card bg="bg.surface" border="1px solid" borderColor="border.primary" w="full">
          <CardBody>
            <VStack spacing={6} align="stretch">
              <Heading size="md">
                <Icon as={FiMessageSquare} mr={2} />
                Send To
              </Heading>

              {/* Recipient Selection */}
              <FormControl>
                <FormLabel>Recipient Type</FormLabel>
                <Select
                  value={recipientType}
                  onChange={(e) => setRecipientType(e.target.value as any)}
                  bg="bg.input"
                  borderColor="border.primary"
                >
                  <option value="manual">Enter Phone Manually</option>
                  <option value="driver">Select Driver</option>
                  <option value="customer">Select Customer</option>
                  <option value="admin">Select Admin</option>
                </Select>
              </FormControl>

              {/* Manual Phone Input */}
              {recipientType === 'manual' && (
                <FormControl>
                  <FormLabel>Phone Number</FormLabel>
                  <Input
                    type="tel"
                    placeholder="e.g., 00447901846297 or 07901846297"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    bg="bg.input"
                    borderColor="border.primary"
                  />
                  <Text fontSize="sm" color="text.tertiary" mt={1}>
                    Enter UK phone number (will be converted to 0044 format)
                  </Text>
                </FormControl>
              )}

              {/* Recipient Dropdown */}
              {recipientType !== 'manual' && (
                <FormControl>
                  <FormLabel>Select Recipient</FormLabel>
                  {loadingRecipients ? (
                    <HStack justify="center" py={4}>
                      <Spinner size="sm" />
                      <Text>Loading {recipientType}s...</Text>
                    </HStack>
                  ) : recipients.length === 0 ? (
                    <Alert status="warning" borderRadius="md">
                      <AlertIcon />
                      No {recipientType}s found with phone numbers
                    </Alert>
                  ) : (
                    <Select
                      placeholder={`Select a ${recipientType}`}
                      value={selectedRecipient}
                      onChange={(e) => setSelectedRecipient(e.target.value)}
                      bg="bg.input"
                      borderColor="border.primary"
                    >
                      {recipients.map((recipient) => (
                        <option key={recipient.id} value={recipient.id}>
                          {recipient.name} - {recipient.phone}
                        </option>
                      ))}
                    </Select>
                  )}
                </FormControl>
              )}

              <Divider />

              {/* Message Content */}
              <Heading size="md">Message Content</Heading>

              <FormControl>
                <FormLabel>
                  <HStack justify="space-between">
                    <Text>Your Message</Text>
                    <HStack spacing={2}>
                      <Badge colorScheme={characterCount > 160 ? 'orange' : 'green'}>
                        {characterCount} chars
                      </Badge>
                      <Badge colorScheme={messageCount > 1 ? 'orange' : 'blue'}>
                        {messageCount} SMS
                      </Badge>
                    </HStack>
                  </HStack>
                </FormLabel>
                <Textarea
                  placeholder="Enter your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  bg="bg.input"
                  borderColor="border.primary"
                  maxLength={1600}
                />
                <Text fontSize="sm" color="text.tertiary" mt={1}>
                  Maximum 1600 characters (approx. 10 SMS messages)
                </Text>
              </FormControl>

              {/* Send Button */}
              <Button
                leftIcon={<FiSend />}
                colorScheme="blue"
                size="lg"
                onClick={handleSendSMS}
                isLoading={sending}
                loadingText="Sending SMS..."
                w="full"
                mt={4}
              >
                Send SMS
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* API Info */}
        <Card bg="bg.surface" border="1px solid" borderColor="border.primary" w="full">
          <CardBody>
            <VStack align="start" spacing={3}>
              <Heading size="sm">API Integration Details</Heading>
              <HStack>
                <Icon as={FiCheck} color="green.500" />
                <Text fontSize="sm">Using Voodoo SMS</Text>
              </HStack>
              <HStack>
                <Icon as={FiCheck} color="green.500" />
                <Text fontSize="sm">Simple API key authentication</Text>
              </HStack>
              <HStack>
                <Icon as={FiCheck} color="green.500" />
                <Text fontSize="sm">Automatic retry on failure (2 attempts max)</Text>
              </HStack>
              <HStack>
                <Icon as={FiCheck} color="green.500" />
                <Text fontSize="sm">UK national format enforced (0044)</Text>
              </HStack>
              <HStack>
                <Icon as={FiAlertCircle} color="blue.500" />
                <Text fontSize="sm">All requests/responses logged to console</Text>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
}

