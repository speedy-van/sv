'use client';
import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Input,
  Switch,
  FormHelperText,
  Badge,
  Alert,
  AlertIcon,
  useToast,
  Divider,
  Grid,
  Icon,
  useColorModeValue,
  Textarea,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
} from '@chakra-ui/react';
import {
  FiShield,
  FiLock,
  FiUsers,
  FiGlobe,
  FiClock,
  FiAlertTriangle,
  FiCheck,
  FiX,
  FiPlus,
  FiTrash2,
  FiEdit,
  FiEye,
  FiEyeOff,
  FiRefreshCw,
  FiDownload,
  FiUpload,
} from 'react-icons/fi';

interface SecuritySettings {
  twoFactorAuth: {
    enabled: boolean;
    requiredForAdmins: boolean;
    backupCodesEnabled: boolean;
  };
  sessionManagement: {
    timeoutMinutes: number;
    maxConcurrentSessions: number;
    forceLogoutOnPasswordChange: boolean;
  };
  ipSecurity: {
    allowlistEnabled: boolean;
    allowlist: string[];
    blocklistEnabled: boolean;
    blocklist: string[];
  };
  sso: {
    enabled: boolean;
    provider: string;
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
  };
  audit: {
    enabled: boolean;
    retentionDays: number;
    logFailedLogins: boolean;
    logAdminActions: boolean;
  };
}

const mockSecuritySettings: SecuritySettings = {
  twoFactorAuth: {
    enabled: true,
    requiredForAdmins: true,
    backupCodesEnabled: true,
  },
  sessionManagement: {
    timeoutMinutes: 480, // 8 hours
    maxConcurrentSessions: 3,
    forceLogoutOnPasswordChange: true,
  },
  ipSecurity: {
    allowlistEnabled: false,
    allowlist: ['192.168.1.0/24', '10.0.0.0/8'],
    blocklistEnabled: true,
    blocklist: ['1.2.3.4', '5.6.7.8'],
  },
  sso: {
    enabled: false,
    provider: 'google',
    clientId: '',
    clientSecret: '',
    callbackUrl: 'https://admin.speedyvan.com/auth/callback',
  },
  audit: {
    enabled: true,
    retentionDays: 90,
    logFailedLogins: true,
    logAdminActions: true,
  },
};

const mockSecurityStats = {
  failedLogins: 12,
  failedLoginsChange: -25,
  activeSessions: 8,
  activeSessionsChange: 0,
  blockedIPs: 3,
  blockedIPsChange: 50,
  securityScore: 85,
  securityScoreChange: 5,
};

const mockRecentActivity = [
  {
    id: '1',
    user: 'john@speedy-van.co.uk',
    action: 'Failed login attempt',
    ip: '192.168.1.100',
    timestamp: '2025-01-15T10:30:00Z',
    status: 'blocked',
  },
  {
    id: '2',
    user: 'sarah@speedy-van.co.uk',
    action: 'Password changed',
    ip: '10.0.0.50',
    timestamp: '2025-01-15T09:15:00Z',
    status: 'success',
  },
  {
    id: '3',
    user: 'admin@speedy-van.co.uk',
    action: '2FA enabled',
    ip: '203.0.113.1',
    timestamp: '2025-01-15T08:45:00Z',
    status: 'success',
  },
];

export default function SecuritySettings() {
  const [settings, setSettings] =
    useState<SecuritySettings>(mockSecuritySettings);
  const [showSecrets, setShowSecrets] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const updateSettings = (section: keyof SecuritySettings, updates: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates },
    }));
    toast({
      title: 'Settings updated',
      status: 'success',
    });
  };

  const addIPToList = (listType: 'allowlist' | 'blocklist', ip: string) => {
    const list = settings.ipSecurity[listType];
    if (!list.includes(ip)) {
      updateSettings('ipSecurity', {
        [listType]: [...list, ip],
      });
    }
  };

  const removeIPFromList = (
    listType: 'allowlist' | 'blocklist',
    ip: string
  ) => {
    const list = settings.ipSecurity[listType];
    updateSettings('ipSecurity', {
      [listType]: list.filter(item => item !== ip),
    });
  };

  const generateBackupCodes = () => {
    toast({
      title: 'Backup codes generated',
      description: 'New backup codes have been created and sent to your email.',
      status: 'success',
    });
  };

  const exportSecurityLogs = () => {
    toast({
      title: 'Export started',
      description: 'Security logs are being prepared for download.',
      status: 'info',
    });
  };

  const getStatusColor = (status: string) => {
    return status === 'success' ? 'green' : 'red';
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box p={6}>
      <VStack align="start" spacing={6} w="full">
        <Box>
          <Heading size="lg" mb={2}>
            Security Settings
          </Heading>
          <Text color="gray.600">
            Configure authentication, session management, and security policies.
          </Text>
        </Box>

        {/* Security Overview */}
        <Grid
          templateColumns="repeat(auto-fit, minmax(200px, 1fr))"
          gap={4}
          w="full"
        >
          <Card bg={bgColor} border="1px solid" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel>Security Score</StatLabel>
                <StatNumber>{mockSecurityStats.securityScore}%</StatNumber>
                <StatHelpText>
                  <StatArrow
                    type={
                      mockSecurityStats.securityScoreChange > 0
                        ? 'increase'
                        : 'decrease'
                    }
                  />
                  {Math.abs(mockSecurityStats.securityScoreChange)}%
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card bg={bgColor} border="1px solid" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel>Failed Logins</StatLabel>
                <StatNumber>{mockSecurityStats.failedLogins}</StatNumber>
                <StatHelpText>
                  <StatArrow
                    type={
                      mockSecurityStats.failedLoginsChange > 0
                        ? 'increase'
                        : 'decrease'
                    }
                  />
                  {Math.abs(mockSecurityStats.failedLoginsChange)}%
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card bg={bgColor} border="1px solid" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel>Active Sessions</StatLabel>
                <StatNumber>{mockSecurityStats.activeSessions}</StatNumber>
                <StatHelpText>
                  <StatArrow
                    type={
                      mockSecurityStats.activeSessionsChange > 0
                        ? 'increase'
                        : 'decrease'
                    }
                  />
                  {Math.abs(mockSecurityStats.activeSessionsChange)}%
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card bg={bgColor} border="1px solid" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel>Blocked IPs</StatLabel>
                <StatNumber>{mockSecurityStats.blockedIPs}</StatNumber>
                <StatHelpText>
                  <StatArrow
                    type={
                      mockSecurityStats.blockedIPsChange > 0
                        ? 'increase'
                        : 'decrease'
                    }
                  />
                  {Math.abs(mockSecurityStats.blockedIPsChange)}%
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </Grid>

        {/* Two-Factor Authentication */}
        <Card bg={bgColor} border="1px solid" borderColor={borderColor}>
          <CardBody>
            <VStack align="start" spacing={4}>
              <HStack>
                <Icon as={FiLock} boxSize={5} color="brand.500" />
                <Heading size="md">Two-Factor Authentication</Heading>
              </HStack>

              <FormControl>
                <FormLabel>Enable 2FA</FormLabel>
                <Switch
                  isChecked={settings.twoFactorAuth.enabled}
                  onChange={e =>
                    updateSettings('twoFactorAuth', {
                      enabled: e.target.checked,
                    })
                  }
                />
                <FormHelperText>
                  Require two-factor authentication for all users
                </FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>Require 2FA for Admins</FormLabel>
                <Switch
                  isChecked={settings.twoFactorAuth.requiredForAdmins}
                  onChange={e =>
                    updateSettings('twoFactorAuth', {
                      requiredForAdmins: e.target.checked,
                    })
                  }
                />
                <FormHelperText>
                  Force all admin users to enable 2FA
                </FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>Backup Codes</FormLabel>
                <Switch
                  isChecked={settings.twoFactorAuth.backupCodesEnabled}
                  onChange={e =>
                    updateSettings('twoFactorAuth', {
                      backupCodesEnabled: e.target.checked,
                    })
                  }
                />
                <FormHelperText>
                  Allow users to generate backup codes for account recovery
                </FormHelperText>
              </FormControl>

              <Button
                leftIcon={<FiRefreshCw />}
                variant="outline"
                onClick={generateBackupCodes}
              >
                Generate Backup Codes
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Session Management */}
        <Card bg={bgColor} border="1px solid" borderColor={borderColor}>
          <CardBody>
            <VStack align="start" spacing={4}>
              <HStack>
                <Icon as={FiClock} boxSize={5} color="brand.500" />
                <Heading size="md">Session Management</Heading>
              </HStack>

              <FormControl>
                <FormLabel>Session Timeout (minutes)</FormLabel>
                <Input
                  type="number"
                  value={settings.sessionManagement.timeoutMinutes}
                  onChange={e =>
                    updateSettings('sessionManagement', {
                      timeoutMinutes: parseInt(e.target.value),
                    })
                  }
                  placeholder="480"
                />
                <FormHelperText>
                  Automatically log out users after inactivity
                </FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>Max Concurrent Sessions</FormLabel>
                <Input
                  type="number"
                  value={settings.sessionManagement.maxConcurrentSessions}
                  onChange={e =>
                    updateSettings('sessionManagement', {
                      maxConcurrentSessions: parseInt(e.target.value),
                    })
                  }
                  placeholder="3"
                />
                <FormHelperText>
                  Maximum number of active sessions per user
                </FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>Force Logout on Password Change</FormLabel>
                <Switch
                  isChecked={
                    settings.sessionManagement.forceLogoutOnPasswordChange
                  }
                  onChange={e =>
                    updateSettings('sessionManagement', {
                      forceLogoutOnPasswordChange: e.target.checked,
                    })
                  }
                />
                <FormHelperText>
                  Automatically log out all sessions when password is changed
                </FormHelperText>
              </FormControl>
            </VStack>
          </CardBody>
        </Card>

        {/* IP Security */}
        <Card bg={bgColor} border="1px solid" borderColor={borderColor}>
          <CardBody>
            <VStack align="start" spacing={4}>
              <HStack>
                <Icon as={FiGlobe} boxSize={5} color="brand.500" />
                <Heading size="md">IP Security</Heading>
              </HStack>

              <Grid templateColumns="1fr 1fr" gap={6} w="full">
                {/* Allowlist */}
                <VStack align="start" spacing={3}>
                  <FormControl>
                    <FormLabel>IP Allowlist</FormLabel>
                    <Switch
                      isChecked={settings.ipSecurity.allowlistEnabled}
                      onChange={e =>
                        updateSettings('ipSecurity', {
                          allowlistEnabled: e.target.checked,
                        })
                      }
                    />
                    <FormHelperText>
                      Only allow access from specific IP addresses
                    </FormHelperText>
                  </FormControl>

                  {settings.ipSecurity.allowlistEnabled && (
                    <VStack align="start" spacing={2} w="full">
                      <Text fontSize="sm" fontWeight="medium">
                        Allowed IPs:
                      </Text>
                      {settings.ipSecurity.allowlist.map((ip, index) => (
                        <HStack key={index} w="full">
                          <Text fontSize="sm" flex={1}>
                            {ip}
                          </Text>
                          <IconButton
                            size="sm"
                            icon={<FiTrash2 />}
                            variant="ghost"
                            aria-label="Remove IP from allowlist"
                            onClick={() => removeIPFromList('allowlist', ip)}
                          />
                        </HStack>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<FiPlus />}
                        onClick={onOpen}
                      >
                        Add IP
                      </Button>
                    </VStack>
                  )}
                </VStack>

                {/* Blocklist */}
                <VStack align="start" spacing={3}>
                  <FormControl>
                    <FormLabel>IP Blocklist</FormLabel>
                    <Switch
                      isChecked={settings.ipSecurity.blocklistEnabled}
                      onChange={e =>
                        updateSettings('ipSecurity', {
                          blocklistEnabled: e.target.checked,
                        })
                      }
                    />
                    <FormHelperText>
                      Block access from specific IP addresses
                    </FormHelperText>
                  </FormControl>

                  {settings.ipSecurity.blocklistEnabled && (
                    <VStack align="start" spacing={2} w="full">
                      <Text fontSize="sm" fontWeight="medium">
                        Blocked IPs:
                      </Text>
                      {settings.ipSecurity.blocklist.map((ip, index) => (
                        <HStack key={index} w="full">
                          <Text fontSize="sm" flex={1}>
                            {ip}
                          </Text>
                          <IconButton
                            size="sm"
                            icon={<FiTrash2 />}
                            variant="ghost"
                            aria-label="Remove IP from blocklist"
                            onClick={() => removeIPFromList('blocklist', ip)}
                          />
                        </HStack>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<FiPlus />}
                        onClick={onOpen}
                      >
                        Add IP
                      </Button>
                    </VStack>
                  )}
                </VStack>
              </Grid>
            </VStack>
          </CardBody>
        </Card>

        {/* SSO Configuration */}
        <Card bg={bgColor} border="1px solid" borderColor={borderColor}>
          <CardBody>
            <VStack align="start" spacing={4}>
              <HStack>
                <Icon as={FiUsers} boxSize={5} color="brand.500" />
                <Heading size="md">Single Sign-On (SSO)</Heading>
              </HStack>

              <FormControl>
                <FormLabel>Enable SSO</FormLabel>
                <Switch
                  isChecked={settings.sso.enabled}
                  onChange={e =>
                    updateSettings('sso', { enabled: e.target.checked })
                  }
                />
                <FormHelperText>
                  Allow users to sign in with external identity providers
                </FormHelperText>
              </FormControl>

              {settings.sso.enabled && (
                <VStack align="start" spacing={3} w="full">
                  <FormControl>
                    <FormLabel>Provider</FormLabel>
                    <Select
                      value={settings.sso.provider}
                      onChange={e =>
                        updateSettings('sso', { provider: e.target.value })
                      }
                    >
                      <option value="google">Google</option>
                      <option value="microsoft">Microsoft</option>
                      <option value="okta">Okta</option>
                      <option value="auth0">Auth0</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Client ID</FormLabel>
                    <Input
                      value={settings.sso.clientId}
                      onChange={e =>
                        updateSettings('sso', { clientId: e.target.value })
                      }
                      placeholder="Enter client ID"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Client Secret</FormLabel>
                    <HStack>
                      <Input
                        type={showSecrets ? 'text' : 'password'}
                        value={settings.sso.clientSecret}
                        onChange={e =>
                          updateSettings('sso', {
                            clientSecret: e.target.value,
                          })
                        }
                        placeholder="Enter client secret"
                      />
                      <IconButton
                        icon={showSecrets ? <FiEyeOff /> : <FiEye />}
                        onClick={() => setShowSecrets(!showSecrets)}
                        variant="ghost"
                        aria-label="Toggle password visibility"
                      />
                    </HStack>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Callback URL</FormLabel>
                    <Input
                      value={settings.sso.callbackUrl}
                      onChange={e =>
                        updateSettings('sso', { callbackUrl: e.target.value })
                      }
                      placeholder="https://admin.speedyvan.com/auth/callback"
                    />
                    <FormHelperText>
                      URL where users will be redirected after authentication
                    </FormHelperText>
                  </FormControl>
                </VStack>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Audit Logging */}
        <Card bg={bgColor} border="1px solid" borderColor={borderColor}>
          <CardBody>
            <VStack align="start" spacing={4}>
              <HStack>
                <Icon as={FiShield} boxSize={5} color="brand.500" />
                <Heading size="md">Audit Logging</Heading>
              </HStack>

              <FormControl>
                <FormLabel>Enable Audit Logging</FormLabel>
                <Switch
                  isChecked={settings.audit.enabled}
                  onChange={e =>
                    updateSettings('audit', { enabled: e.target.checked })
                  }
                />
                <FormHelperText>
                  Log all security-related events for compliance and monitoring
                </FormHelperText>
              </FormControl>

              {settings.audit.enabled && (
                <VStack align="start" spacing={3} w="full">
                  <FormControl>
                    <FormLabel>Retention Period (days)</FormLabel>
                    <Input
                      type="number"
                      value={settings.audit.retentionDays}
                      onChange={e =>
                        updateSettings('audit', {
                          retentionDays: parseInt(e.target.value),
                        })
                      }
                      placeholder="90"
                    />
                    <FormHelperText>
                      How long to keep audit logs before automatic deletion
                    </FormHelperText>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Log Failed Logins</FormLabel>
                    <Switch
                      isChecked={settings.audit.logFailedLogins}
                      onChange={e =>
                        updateSettings('audit', {
                          logFailedLogins: e.target.checked,
                        })
                      }
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Log Admin Actions</FormLabel>
                    <Switch
                      isChecked={settings.audit.logAdminActions}
                      onChange={e =>
                        updateSettings('audit', {
                          logAdminActions: e.target.checked,
                        })
                      }
                    />
                  </FormControl>

                  <Button
                    leftIcon={<FiDownload />}
                    variant="outline"
                    onClick={exportSecurityLogs}
                  >
                    Export Security Logs
                  </Button>
                </VStack>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Recent Security Activity */}
        <Card bg={bgColor} border="1px solid" borderColor={borderColor}>
          <CardBody>
            <VStack align="start" spacing={4}>
              <HStack justify="space-between" w="full">
                <Heading size="md">Recent Security Activity</Heading>
                <Button size="sm" variant="outline" leftIcon={<FiRefreshCw />}>
                  Refresh
                </Button>
              </HStack>

              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>User</Th>
                    <Th>Action</Th>
                    <Th>IP Address</Th>
                    <Th>Time</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {mockRecentActivity.map(activity => (
                    <Tr key={activity.id}>
                      <Td>{activity.user}</Td>
                      <Td>{activity.action}</Td>
                      <Td>{activity.ip}</Td>
                      <Td>{formatTimestamp(activity.timestamp)}</Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(activity.status)}>
                          {activity.status}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </VStack>
          </CardBody>
        </Card>

        {/* Add IP Modal */}
        <AddIPModal
          isOpen={isOpen}
          onClose={onClose}
          onAdd={(ip, listType) => {
            addIPToList(listType, ip);
            onClose();
          }}
        />
      </VStack>
    </Box>
  );
}

interface AddIPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (ip: string, listType: 'allowlist' | 'blocklist') => void;
}

function AddIPModal({ isOpen, onClose, onAdd }: AddIPModalProps) {
  const [ip, setIp] = useState('');
  const [listType, setListType] = useState<'allowlist' | 'blocklist'>(
    'blocklist'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ip.trim()) {
      onAdd(ip.trim(), listType);
      setIp('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>Add IP Address</ModalHeader>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>IP Address or CIDR</FormLabel>
                <Input
                  value={ip}
                  onChange={e => setIp(e.target.value)}
                  placeholder="192.168.1.1 or 192.168.1.0/24"
                />
                <FormHelperText>
                  Enter a single IP address or CIDR range
                </FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>List Type</FormLabel>
                <Select
                  value={listType}
                  onChange={e =>
                    setListType(e.target.value as 'allowlist' | 'blocklist')
                  }
                >
                  <option value="allowlist">Allowlist</option>
                  <option value="blocklist">Blocklist</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" colorScheme="brand">
              Add IP
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
