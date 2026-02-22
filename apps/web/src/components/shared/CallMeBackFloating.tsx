'use client';

import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Select,
  Text,
  VStack,
  useDisclosure,
  useToast,
  Icon,
} from '@chakra-ui/react';
import { FiPhoneCall, FiClock, FiUser, FiX, FiSend } from 'react-icons/fi';
import { usePathname } from 'next/navigation';

const timeOptions = [
  'Anytime (9am - 6pm)',
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '12:00 - 13:00',
  '13:00 - 14:00',
  '14:00 - 15:00',
  '15:00 - 16:00',
  '16:00 - 17:00',
  '17:00 - 18:00',
];

export function CallMeBackFloating() {
  const pathname = usePathname();
  const isHome = useMemo(() => pathname === '/', [pathname]);
  const isHowItWorks = useMemo(() => pathname === '/how-it-works', [pathname]);
  const isAbout = useMemo(() => pathname === '/about', [pathname]);
  const isContact = useMemo(() => pathname === '/contact', [pathname]);
  const isPricing = useMemo(() => pathname === '/pricing', [pathname]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [customerName, setCustomerName] = useState('');
  const [preferredTime, setPreferredTime] = useState(timeOptions[0]);
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleSubmit = async () => {
    if (!customerName.trim()) {
      toast({
        title: 'Please add your name',
        status: 'warning',
        duration: 2500,
        isClosable: true,
      });
      return;
    }
    if (!phone.trim()) {
      toast({
        title: 'Please add your phone',
        status: 'warning',
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/callbacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customerName.trim(),
          preferredTime,
          phone: phone.trim(),
          page: pathname,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Unable to save request');
      }

      toast({
        title: 'Callback saved',
        description: `We will call ${customerName} at ${preferredTime}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
      setCustomerName('');
      setPhone('');
      setPreferredTime(timeOptions[0]);
    } catch (error) {
      toast({
        title: 'Unable to save request',
        description: error instanceof Error ? error.message : 'Please try again shortly.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      position="fixed"
      bottom={
        isHowItWorks || isAbout || isContact || isPricing
          ? { base: 24, md: 28 } // elevate above WhatsApp/other floating buttons on these pages
          : { base: 4, md: 8 }
      }
      right={isHome ? undefined : { base: 4, md: 8 }}
      left={isHome ? { base: 4, md: 8 } : undefined}
      zIndex={2000}
      pointerEvents="none"
    >
      <VStack align="flex-end" spacing={3} pointerEvents="auto">
        {isOpen ? (
          <Card
            bg="#0b1220"
            border="1px solid #1f2937"
            borderRadius="xl"
            shadow="xl"
            w={{ base: '90vw', sm: '320px' }}
          >
            <CardBody>
              <VStack align="stretch" spacing={3}>
                <HStack justify="space-between">
                  <HStack spacing={2}>
                    <Icon as={FiPhoneCall} color="neon.400" />
                    <Text fontWeight="bold" color="#fff">
                      Call me back
                    </Text>
                  </HStack>
                  <Button
                    size="xs"
                    variant="ghost"
                    color="gray.300"
                    onClick={onClose}
                    leftIcon={<FiX />}
                  >
                    Close
                  </Button>
                </HStack>

                <FormControl>
                  <FormLabel color="#cbd5e1" fontSize="sm" display="flex" alignItems="center" gap={2}>
                    <Icon as={FiUser} color="gray.400" />
                    Your name
                  </FormLabel>
                  <Input
                    placeholder="Full name"
                    bg="#111827"
                    borderColor="#1f2937"
                    color="#A9B4CC"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color="#cbd5e1" fontSize="sm" display="flex" alignItems="center" gap={2}>
                    <Icon as={FiPhoneCall} color="gray.400" />
                    Phone
                  </FormLabel>
                  <Input
                    placeholder="07xxxxxxxx"
                    bg="#111827"
                    borderColor="#1f2937"
                    color="#A9B4CC"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color="#cbd5e1" fontSize="sm" display="flex" alignItems="center" gap={2}>
                    <Icon as={FiClock} color="gray.400" />
                    Preferred time
                  </FormLabel>
                  <Select
                    bg="#111827"
                    borderColor="#1f2937"
                    color="#A9B4CC"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                  >
                    {timeOptions.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </Select>
                  <Text fontSize="xs" color="#94a3b8" mt={1}>
                    We call between 9am and 6pm. Choose a slot or select Anytime.
                  </Text>
                </FormControl>

                <Button
                  colorScheme="green"
                  leftIcon={<FiSend />}
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                >
                  Request callback
                </Button>
              </VStack>
            </CardBody>
          </Card>
        ) : null}

        <Button
          leftIcon={<FiPhoneCall />}
          colorScheme="blue"
          size="lg"
          borderRadius="full"
          shadow="lg"
          onClick={isOpen ? onClose : onOpen}
        >
          Call me back
        </Button>
      </VStack>
    </Box>
  );
}

export default CallMeBackFloating;

