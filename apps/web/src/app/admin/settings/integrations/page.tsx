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
  InputGroup,
  InputRightElement,
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
  Tooltip,
  Textarea,
  Select,
} from '@chakra-ui/react';
import {
  FiEye,
  FiEyeOff,
  FiCopy,
  FiRefreshCw,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiCreditCard,
  FiMessageSquare,
  FiMap,
  FiMail,
  FiGlobe,
  FiShield,
} from 'react-icons/fi';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: 'connected' | 'disconnected' | 'error';
  config: Record<string, any>;
  isEnabled: boolean;
}

const mockIntegrations: Integration[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing and subscription management',
    icon: FiCreditCard,
    status: 'connected',
    isEnabled: true,
    config: {
      publishableKey: 'pk_live_...',
      secretKey: 'sk_live_...',
      webhookSecret: 'whsec_...',
    },
  },
  {
    id: 'pusher',
    name: 'Pusher',
    description: 'Real-time notifications and live updates',
    icon: FiMessageSquare,
    status: 'connected',
    isEnabled: true,
    config: {
      appId: '1234567',
      key: 'abcdef123456',
      secret: 'ghijkl789012',
      cluster: 'eu',
    },
  },
  {
    id: 'mapbox',
    name: 'Mapbox',
    description: 'Geocoding, directions, and location services',
    icon: FiMap,
    status: 'connected',
    isEnabled: true,
    config: {
      accessToken: 'pk.eyJ1Ijoi...',
      styleUrl: 'mapbox://styles/mapbox/streets-v12',
      geocodingEndpoint: 'https://api.mapbox.com/geocoding/v5',
    },
  },
  {
    id: 'email',
    name: 'SendGrid',
    description: 'Transactional email delivery',
    icon: FiMail,
    status: 'connected',
    isEnabled: true,
    config: {
      apiKey: 'SG...',
      fromEmail: 'noreply@speedy-van.co.uk',
      fromName: 'Speedy Van',
    },
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    description: 'Outbound webhook notifications',
    icon: FiGlobe,
    status: 'disconnected',
    isEnabled: false,
    config: {
      endpoints: [],
      retryAttempts: 3,
      timeout: 5000,
    },
  },
  {
    id: 'security',
    name: 'Security Headers',
    description: 'CSP, HSTS, and security configurations',
    icon: FiShield,
    status: 'connected',
    isEnabled: true,
    config: {
      cspEnabled: true,
      hstsEnabled: true,
      rateLimitEnabled: true,
    },
  },
];

export default function IntegrationsSettings() {
  const [integrations, setIntegrations] =
    useState<Integration[]>(mockIntegrations);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [editingIntegration, setEditingIntegration] = useState<string | null>(
    null
  );
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const toggleSecretVisibility = (integrationId: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [integrationId]: !prev[integrationId],
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      status: 'success',
      duration: 2000,
    });
  };

  const testConnection = (integrationId: string) => {
    toast({
      title: 'Testing connection...',
      status: 'info',
      duration: 2000,
    });

    // Simulate API test
    setTimeout(() => {
      toast({
        title: 'Connection successful',
        description: 'The integration is working correctly.',
        status: 'success',
      });
    }, 2000);
  };

  const updateIntegration = (
    integrationId: string,
    updates: Partial<Integration>
  ) => {
    setIntegrations(prev =>
      prev.map(integration =>
        integration.id === integrationId
          ? { ...integration, ...updates }
          : integration
      )
    );
    setEditingIntegration(null);
    toast({
      title: 'Integration updated',
      status: 'success',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      connected: 'green',
      disconnected: 'gray',
      error: 'red',
    };
    return colors[status] || 'gray';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return FiCheck;
      case 'error':
        return FiX;
      default:
        return FiAlertCircle;
    }
  };

  return (
    <Box p={6}>
      <VStack align="start" spacing={6} w="full">
        <Box>
          <Heading size="lg" mb={2}>
            Integrations
          </Heading>
          <Text color="gray.600">
            Configure third-party services and API connections for your
            platform.
          </Text>
        </Box>

        <Grid
          templateColumns="repeat(auto-fit, minmax(400px, 1fr))"
          gap={6}
          w="full"
        >
          {integrations.map(integration => (
            <Card
              key={integration.id}
              bg={bgColor}
              border="1px solid"
              borderColor={borderColor}
            >
              <CardBody>
                <VStack align="start" spacing={4}>
                  {/* Header */}
                  <HStack justify="space-between" w="full">
                    <HStack>
                      <Icon
                        as={integration.icon}
                        boxSize={5}
                        color="brand.500"
                      />
                      <Box>
                        <Heading size="md">{integration.name}</Heading>
                        <Text fontSize="sm" color="gray.600">
                          {integration.description}
                        </Text>
                      </Box>
                    </HStack>
                    <VStack align="end" spacing={1}>
                      <Badge colorScheme={getStatusColor(integration.status)}>
                        {integration.status}
                      </Badge>
                      <Switch
                        isChecked={integration.isEnabled}
                        onChange={e =>
                          updateIntegration(integration.id, {
                            isEnabled: e.target.checked,
                          })
                        }
                        size="sm"
                      />
                    </VStack>
                  </HStack>

                  {/* Status */}
                  <HStack>
                    <Icon
                      as={getStatusIcon(integration.status)}
                      color={`${getStatusColor(integration.status)}.500`}
                    />
                    <Text fontSize="sm">
                      {integration.status === 'connected' &&
                        'Connected and working'}
                      {integration.status === 'disconnected' && 'Not connected'}
                      {integration.status === 'error' && 'Connection error'}
                    </Text>
                  </HStack>

                  {/* Configuration */}
                  {editingIntegration === integration.id ? (
                    <IntegrationConfigForm
                      integration={integration}
                      onSave={config =>
                        updateIntegration(integration.id, { config })
                      }
                      onCancel={() => setEditingIntegration(null)}
                    />
                  ) : (
                    <IntegrationConfigDisplay
                      integration={integration}
                      showSecrets={showSecrets[integration.id] || false}
                      onToggleSecrets={() =>
                        toggleSecretVisibility(integration.id)
                      }
                      onCopy={copyToClipboard}
                    />
                  )}

                  {/* Actions */}
                  <HStack spacing={2} w="full">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingIntegration(integration.id)}
                    >
                      Configure
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<FiRefreshCw />}
                      onClick={() => testConnection(integration.id)}
                    >
                      Test
                    </Button>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </Grid>

        {/* Security Notice */}
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Box>
            <Text fontWeight="medium">Security Notice</Text>
            <Text fontSize="sm">
              API keys and secrets are encrypted at rest and only displayed when
              needed. Never share these credentials or commit them to version
              control.
            </Text>
          </Box>
        </Alert>
      </VStack>
    </Box>
  );
}

interface IntegrationConfigFormProps {
  integration: Integration;
  onSave: (config: Record<string, any>) => void;
  onCancel: () => void;
}

function IntegrationConfigForm({
  integration,
  onSave,
  onCancel,
}: IntegrationConfigFormProps) {
  const [config, setConfig] = useState(integration.config);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(config);
  };

  const renderField = (key: string, value: any) => {
    if (typeof value === 'boolean') {
      return (
        <FormControl key={key}>
          <FormLabel>
            {key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())}
          </FormLabel>
          <Switch
            isChecked={value}
            onChange={e => setConfig({ ...config, [key]: e.target.checked })}
          />
        </FormControl>
      );
    }

    if (typeof value === 'number') {
      return (
        <FormControl key={key}>
          <FormLabel>
            {key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())}
          </FormLabel>
          <Input
            type="number"
            value={value}
            onChange={e =>
              setConfig({ ...config, [key]: parseInt(e.target.value) })
            }
          />
        </FormControl>
      );
    }

    if (Array.isArray(value)) {
      return (
        <FormControl key={key}>
          <FormLabel>
            {key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())}
          </FormLabel>
          <Textarea
            value={value.join('\n')}
            onChange={e =>
              setConfig({
                ...config,
                [key]: e.target.value.split('\n').filter(Boolean),
              })
            }
            placeholder="Enter values, one per line"
          />
        </FormControl>
      );
    }

    return (
      <FormControl key={key}>
        <FormLabel>
          {key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())}
        </FormLabel>
        <Input
          value={value}
          onChange={e => setConfig({ ...config, [key]: e.target.value })}
          placeholder={`Enter ${key}`}
        />
      </FormControl>
    );
  };

  return (
    <Box as="form" onSubmit={handleSubmit} w="full">
      <VStack spacing={3} align="start">
        {Object.entries(config).map(([key, value]) => renderField(key, value))}
        <HStack spacing={2}>
          <Button type="submit" size="sm" colorScheme="brand">
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}

interface IntegrationConfigDisplayProps {
  integration: Integration;
  showSecrets: boolean;
  onToggleSecrets: () => void;
  onCopy: (text: string) => void;
}

function IntegrationConfigDisplay({
  integration,
  showSecrets,
  onToggleSecrets,
  onCopy,
}: IntegrationConfigDisplayProps) {
  const isSecretKey = (key: string) =>
    key.toLowerCase().includes('secret') ||
    key.toLowerCase().includes('key') ||
    key.toLowerCase().includes('token');

  return (
    <VStack align="start" spacing={2} w="full">
      <Text fontSize="sm" fontWeight="medium" color="gray.700">
        Configuration:
      </Text>
      {Object.entries(integration.config).map(([key, value]) => (
        <Box key={key} w="full">
          <Text fontSize="xs" color="gray.500" mb={1}>
            {key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())}
            :
          </Text>
          <HStack>
            <Input
              size="sm"
              value={
                isSecretKey(key) && !showSecrets ? '••••••••' : String(value)
              }
              isReadOnly
              fontFamily="mono"
            />
            {isSecretKey(key) && (
              <Tooltip label={showSecrets ? 'Hide' : 'Show'}>
                <Button size="sm" variant="ghost" onClick={onToggleSecrets}>
                  <Icon as={showSecrets ? FiEyeOff : FiEye} />
                </Button>
              </Tooltip>
            )}
            <Tooltip label="Copy">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onCopy(String(value))}
              >
                <Icon as={FiCopy} />
              </Button>
            </Tooltip>
          </HStack>
        </Box>
      ))}
    </VStack>
  );
}
