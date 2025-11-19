'use client';

import { useState } from 'react';
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
  Switch,
  useToast,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const toast = useToast();

  async function handlePasswordChange() {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/customer/settings/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to change password');
      }

      toast({
        title: 'Success',
        description: 'Password changed successfully',
        status: 'success',
        duration: 3000,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleNotificationUpdate() {
    try {
      const res = await fetch('/api/customer/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailNotifications,
          sms: smsNotifications,
        }),
      });

      if (!res.ok) throw new Error('Failed to update notifications');

      toast({
        title: 'Success',
        description: 'Notification settings updated',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update notification settings',
        status: 'error',
        duration: 3000,
      });
    }
  }

  return (
    <Container maxW="container.md" py={8}>
      <VStack align="stretch" spacing={6}>
        <Heading size="lg">Settings</Heading>

        <Tabs colorScheme="brand">
          <TabList>
            <Tab>Security</Tab>
            <Tab>Notifications</Tab>
          </TabList>

          <TabPanels>
            {/* Security Tab */}
            <TabPanel px={0}>
              <Card>
                <CardBody>
                  <VStack align="stretch" spacing={6}>
                    <Heading size="md">Change Password</Heading>

                    <FormControl>
                      <FormLabel>Current Password</FormLabel>
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>New Password</FormLabel>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Confirm New Password</FormLabel>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                      />
                    </FormControl>

                    <Button
                      colorScheme="brand"
                      onClick={handlePasswordChange}
                      isLoading={isChangingPassword}
                      loadingText="Changing..."
                    >
                      Change Password
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>

            {/* Notifications Tab */}
            <TabPanel px={0}>
              <Card>
                <CardBody>
                  <VStack align="stretch" spacing={6}>
                    <Heading size="md">Notification Settings</Heading>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb={0} flex={1}>
                        Email Notifications
                      </FormLabel>
                      <Switch
                        colorScheme="brand"
                        isChecked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                      />
                    </FormControl>

                    <Divider />

                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb={0} flex={1}>
                        SMS Notifications
                      </FormLabel>
                      <Switch
                        colorScheme="brand"
                        isChecked={smsNotifications}
                        onChange={(e) => setSmsNotifications(e.target.checked)}
                      />
                    </FormControl>

                    <Button colorScheme="brand" onClick={handleNotificationUpdate}>
                      Save Settings
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
}
