'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Divider,
  Avatar,
  Spinner,
  Center,
} from '@chakra-ui/react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const toast = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetch('/api/customer/me');
      if (!res.ok) throw new Error('Failed to fetch profile');
      const data = await res.json();
      setProfile(data.user);
      setName(data.user.name || '');
      setPhone(data.user.phone || '');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const res = await fetch('/api/customer/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      });

      if (!res.ok) throw new Error('Failed to update profile');

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
        status: 'success',
        duration: 3000,
      });

      await fetchProfile();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <Center h="400px">
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }

  if (!profile) {
    return (
      <Container maxW="container.md" py={8}>
        <Text>Failed to load profile</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={8}>
      <VStack align="stretch" spacing={6}>
        <Heading size="lg">Profile</Heading>

        <Card>
          <CardBody>
            <VStack align="stretch" spacing={6}>
              <HStack spacing={6}>
                <Avatar size="xl" name={profile.name} />
                <VStack align="start" spacing={1}>
                  <Heading size="md">{profile.name}</Heading>
                  <Text color="gray.600">{profile.email}</Text>
                </VStack>
              </HStack>

              <Divider />

              <FormControl>
                <FormLabel>Name</FormLabel>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Phone Number</FormLabel>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  dir="ltr"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input value={profile.email} isReadOnly bg="gray.50" />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Email cannot be changed
                </Text>
              </FormControl>

              <Button
                colorScheme="brand"
                onClick={handleSave}
                isLoading={isSaving}
                loadingText="Saving..."
              >
                Save Changes
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
}
