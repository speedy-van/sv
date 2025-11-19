'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  VStack,
  Alert,
  AlertIcon,
  useToast,
  Card,
  CardBody,
} from '@chakra-ui/react';

interface SettingsCodeGateProps {
  children: React.ReactNode;
}

const STORAGE_KEY = 'sv_admin_settings_code_ok';

export default function SettingsCodeGate({ children }: SettingsCodeGateProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    try {
      const ok = sessionStorage.getItem(STORAGE_KEY);
      if (ok === 'true') setUnlocked(true);
    } catch {
      // ignore storage errors
    }
  }, []);

  const expected =
    process.env.NEXT_PUBLIC_ADMIN_SETTINGS_CODE?.trim() ||
    process.env.NEXT_PUBLIC_SETTINGS_CODE?.trim() ||
    '112233';

  const unlock = () => {
    if (code.trim() === expected) {
      setUnlocked(true);
      setError(null);
      try {
        sessionStorage.setItem(STORAGE_KEY, 'true');
      } catch {
        // ignore
      }
      toast({ title: 'Unlocked', status: 'success', duration: 1500 });
    } else {
      setError('Invalid code. Please try again.');
    }
  };

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <Box minH="60vh" display="flex" alignItems="center" justifyContent="center" p={6}>
      <Card maxW="420px" w="100%">
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Heading size="md">Restricted Area</Heading>
            <Text color="gray.600" fontSize="sm">
              Enter the access code to view Admin Settings.
            </Text>
            {error && (
              <Alert status="error">
                <AlertIcon />
                {error}
              </Alert>
            )}
            <InputGroup>
              <Input
                type="password"
                placeholder="Enter access code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') unlock();
                }}
              />
              <InputRightElement width="4.5rem">
                <Button h="1.75rem" size="sm" onClick={unlock}>
                  Unlock
                </Button>
              </InputRightElement>
            </InputGroup>
            <Text fontSize="xs" color="gray.500">
              For security, access resets when you close the tab.
            </Text>
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
}


