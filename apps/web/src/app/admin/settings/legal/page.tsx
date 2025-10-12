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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import {
  FiFileText,
  FiHome,
  FiCreditCard,
  FiShield,
  FiSettings,
  FiEdit,
  FiSave,
  FiEye,
  FiDownload,
  FiUpload,
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiInfo,
} from 'react-icons/fi';

interface LegalSettings {
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    registrationNumber: string;
    vatNumber: string;
  };
  vat: {
    enabled: boolean;
    rate: number;
    registrationNumber: string;
    country: string;
  };
  privacy: {
    policyUrl: string;
    dataRetentionDays: number;
    gdprCompliant: boolean;
    cookieConsent: boolean;
    marketingEmails: boolean;
  };
  terms: {
    termsUrl: string;
    lastUpdated: string;
    version: string;
  };
  cookies: {
    essential: boolean;
    analytics: boolean;
    marketing: boolean;
    preferences: boolean;
    retentionDays: number;
  };
}

const mockLegalSettings: LegalSettings = {
  company: {
    name: 'Speedy Van Ltd',
    address: '123 Business Street, London, SW1A 1AA, United Kingdom',
    phone: '+44 20 7123 4567',
    email: 'legal@speedy-van.co.uk',
    website: 'https://speedyvan.com',
    registrationNumber: '12345678',
    vatNumber: 'GB123456789',
  },
  vat: {
    enabled: true,
    rate: 20,
    registrationNumber: 'GB123456789',
    country: 'GB',
  },
  privacy: {
    policyUrl: 'https://speedyvan.com/privacy',
    dataRetentionDays: 2555, // 7 years
    gdprCompliant: true,
    cookieConsent: true,
    marketingEmails: true,
  },
  terms: {
    termsUrl: 'https://speedyvan.com/terms',
    lastUpdated: '2025-01-15',
    version: '2.1',
  },
  cookies: {
    essential: true,
    analytics: true,
    marketing: false,
    preferences: true,
    retentionDays: 365,
  },
};

const countries = [
  { reference: 'GB', name: 'United Kingdom' },
  { reference: 'US', name: 'United States' },
  { reference: 'CA', name: 'Canada' },
  { reference: 'AU', name: 'Australia' },
  { reference: 'DE', name: 'Germany' },
  { reference: 'FR', name: 'France' },
  { reference: 'NL', name: 'Netherlands' },
  { reference: 'IE', name: 'Ireland' },
];

const mockComplianceStatus = {
  gdpr: { status: 'compliant', score: 95 },
  vat: { status: 'compliant', score: 100 },
  cookies: { status: 'warning', score: 75 },
  terms: { status: 'compliant', score: 90 },
};

export default function LegalSettings() {
  const [settings, setSettings] = useState<LegalSettings>(mockLegalSettings);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const updateSettings = (section: keyof LegalSettings, updates: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates },
    }));
    toast({
      title: 'Settings updated',
      status: 'success',
    });
  };

  const exportLegalDocuments = () => {
    toast({
      title: 'Export started',
      description: 'Legal documents are being prepared for download.',
      status: 'info',
    });
  };

  const previewDocument = (type: string) => {
    toast({
      title: 'Preview not available',
      description: 'Document preview will be available in the next update.',
      status: 'info',
    });
  };

  const getComplianceColor = (status: string) => {
    const colors: Record<string, string> = {
      compliant: 'green',
      warning: 'yellow',
      non_compliant: 'red',
    };
    return colors[status] || 'gray';
  };

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return FiCheck;
      case 'warning':
        return FiAlertTriangle;
      case 'non_compliant':
        return FiX;
      default:
        return FiInfo;
    }
  };

  return (
    <Box p={6}>
      <VStack align="start" spacing={6} w="full">
        <Box>
          <Heading size="lg" mb={2}>
            Legal & Compliance
          </Heading>
          <Text color="gray.600">
            Manage company information, VAT settings, privacy policies, and
            legal compliance.
          </Text>
        </Box>

        {/* Compliance Overview */}
        <Grid
          templateColumns="repeat(auto-fit, minmax(250px, 1fr))"
          gap={4}
          w="full"
        >
          {Object.entries(mockComplianceStatus).map(([key, value]) => (
            <Card
              key={key}
              bg={bgColor}
              border="1px solid"
              borderColor={borderColor}
            >
              <CardBody>
                <VStack align="start" spacing={2}>
                  <HStack>
                    <Icon
                      as={getComplianceIcon(value.status)}
                      color={`${getComplianceColor(value.status)}.500`}
                    />
                    <Text fontWeight="medium" textTransform="capitalize">
                      {key.replace('_', ' ')}
                    </Text>
                  </HStack>
                  <Text fontSize="2xl" fontWeight="bold">
                    {value.score}%
                  </Text>
                  <Badge colorScheme={getComplianceColor(value.status)}>
                    {value.status.replace('_', ' ')}
                  </Badge>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </Grid>

        <Tabs variant="enclosed" w="full">
          <TabList>
            <Tab>Company Info</Tab>
            <Tab>VAT Settings</Tab>
            <Tab>Privacy & GDPR</Tab>
            <Tab>Terms & Conditions</Tab>
            <Tab>Cookie Policy</Tab>
          </TabList>

          <TabPanels>
            {/* Company Information */}
            <TabPanel>
              <Card bg={bgColor} border="1px solid" borderColor={borderColor}>
                <CardBody>
                  <VStack align="start" spacing={4}>
                    <HStack>
                      <Icon as={FiHome} boxSize={5} color="brand.500" />
                      <Heading size="md">Company Information</Heading>
                    </HStack>

                    <Grid
                      templateColumns="repeat(auto-fit, minmax(300px, 1fr))"
                      gap={4}
                      w="full"
                    >
                      <FormControl>
                        <FormLabel>Company Name</FormLabel>
                        <Input
                          value={settings.company.name}
                          onChange={e =>
                            updateSettings('company', { name: e.target.value })
                          }
                          placeholder="Enter company name"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Registration Number</FormLabel>
                        <Input
                          value={settings.company.registrationNumber}
                          onChange={e =>
                            updateSettings('company', {
                              registrationNumber: e.target.value,
                            })
                          }
                          placeholder="Enter registration number"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>VAT Number</FormLabel>
                        <Input
                          value={settings.company.vatNumber}
                          onChange={e =>
                            updateSettings('company', {
                              vatNumber: e.target.value,
                            })
                          }
                          placeholder="Enter VAT number"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Phone Number</FormLabel>
                        <Input
                          value={settings.company.phone}
                          onChange={e =>
                            updateSettings('company', { phone: e.target.value })
                          }
                          placeholder="Enter phone number"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Email Address</FormLabel>
                        <Input
                          type="email"
                          value={settings.company.email}
                          onChange={e =>
                            updateSettings('company', { email: e.target.value })
                          }
                          placeholder="Enter email address"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Website</FormLabel>
                        <Input
                          value={settings.company.website}
                          onChange={e =>
                            updateSettings('company', {
                              website: e.target.value,
                            })
                          }
                          placeholder="Enter website URL"
                        />
                      </FormControl>
                    </Grid>

                    <FormControl>
                      <FormLabel>Registered Address</FormLabel>
                      <Textarea
                        value={settings.company.address}
                        onChange={e =>
                          updateSettings('company', { address: e.target.value })
                        }
                        placeholder="Enter full registered address"
                        rows={3}
                      />
                    </FormControl>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>

            {/* VAT Settings */}
            <TabPanel>
              <Card bg={bgColor} border="1px solid" borderColor={borderColor}>
                <CardBody>
                  <VStack align="start" spacing={4}>
                    <HStack>
                      <Icon as={FiCreditCard} boxSize={5} color="brand.500" />
                      <Heading size="md">VAT Settings</Heading>
                    </HStack>

                    <FormControl>
                      <FormLabel>Enable VAT</FormLabel>
                      <Switch
                        isChecked={settings.vat.enabled}
                        onChange={e =>
                          updateSettings('vat', { enabled: e.target.checked })
                        }
                      />
                      <FormHelperText>
                        Enable VAT calculation and reporting
                      </FormHelperText>
                    </FormControl>

                    {settings.vat.enabled && (
                      <Grid
                        templateColumns="repeat(auto-fit, minmax(300px, 1fr))"
                        gap={4}
                        w="full"
                      >
                        <FormControl>
                          <FormLabel>VAT Rate (%)</FormLabel>
                          <Input
                            type="number"
                            value={settings.vat.rate}
                            onChange={e =>
                              updateSettings('vat', {
                                rate: parseFloat(e.target.value),
                              })
                            }
                            placeholder="20"
                          />
                          <FormHelperText>
                            Standard VAT rate for your region
                          </FormHelperText>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Country</FormLabel>
                          <Select
                            value={settings.vat.country}
                            onChange={e =>
                              updateSettings('vat', { country: e.target.value })
                            }
                          >
                            {countries.map(country => (
                              <option
                                key={country.reference}
                                value={country.reference}
                              >
                                {country.name}
                              </option>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl>
                          <FormLabel>VAT Registration Number</FormLabel>
                          <Input
                            value={settings.vat.registrationNumber}
                            onChange={e =>
                              updateSettings('vat', {
                                registrationNumber: e.target.value,
                              })
                            }
                            placeholder="Enter VAT registration number"
                          />
                        </FormControl>
                      </Grid>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>

            {/* Privacy & GDPR */}
            <TabPanel>
              <Card bg={bgColor} border="1px solid" borderColor={borderColor}>
                <CardBody>
                  <VStack align="start" spacing={4}>
                    <HStack>
                      <Icon as={FiShield} boxSize={5} color="brand.500" />
                      <Heading size="md">Privacy & GDPR</Heading>
                    </HStack>

                    <Grid
                      templateColumns="repeat(auto-fit, minmax(300px, 1fr))"
                      gap={4}
                      w="full"
                    >
                      <FormControl>
                        <FormLabel>Privacy Policy URL</FormLabel>
                        <Input
                          value={settings.privacy.policyUrl}
                          onChange={e =>
                            updateSettings('privacy', {
                              policyUrl: e.target.value,
                            })
                          }
                          placeholder="https://speedyvan.com/privacy"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Data Retention (days)</FormLabel>
                        <Input
                          type="number"
                          value={settings.privacy.dataRetentionDays}
                          onChange={e =>
                            updateSettings('privacy', {
                              dataRetentionDays: parseInt(e.target.value),
                            })
                          }
                          placeholder="2555"
                        />
                        <FormHelperText>
                          How long to keep customer data (7 years = 2555 days)
                        </FormHelperText>
                      </FormControl>
                    </Grid>

                    <VStack align="start" spacing={3} w="full">
                      <FormControl>
                        <FormLabel>GDPR Compliant</FormLabel>
                        <Switch
                          isChecked={settings.privacy.gdprCompliant}
                          onChange={e =>
                            updateSettings('privacy', {
                              gdprCompliant: e.target.checked,
                            })
                          }
                        />
                        <FormHelperText>
                          Ensure compliance with GDPR regulations
                        </FormHelperText>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Cookie Consent</FormLabel>
                        <Switch
                          isChecked={settings.privacy.cookieConsent}
                          onChange={e =>
                            updateSettings('privacy', {
                              cookieConsent: e.target.checked,
                            })
                          }
                        />
                        <FormHelperText>
                          Show cookie consent banner to users
                        </FormHelperText>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Marketing Emails</FormLabel>
                        <Switch
                          isChecked={settings.privacy.marketingEmails}
                          onChange={e =>
                            updateSettings('privacy', {
                              marketingEmails: e.target.checked,
                            })
                          }
                        />
                        <FormHelperText>
                          Allow marketing email communications
                        </FormHelperText>
                      </FormControl>
                    </VStack>

                    <HStack spacing={2}>
                      <Button
                        leftIcon={<FiEye />}
                        variant="outline"
                        onClick={() => previewDocument('privacy')}
                      >
                        Preview Policy
                      </Button>
                      <Button
                        leftIcon={<FiDownload />}
                        variant="outline"
                        onClick={exportLegalDocuments}
                      >
                        Export Documents
                      </Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>

            {/* Terms & Conditions */}
            <TabPanel>
              <Card bg={bgColor} border="1px solid" borderColor={borderColor}>
                <CardBody>
                  <VStack align="start" spacing={4}>
                    <HStack>
                      <Icon as={FiFileText} boxSize={5} color="brand.500" />
                      <Heading size="md">Terms & Conditions</Heading>
                    </HStack>

                    <Grid
                      templateColumns="repeat(auto-fit, minmax(300px, 1fr))"
                      gap={4}
                      w="full"
                    >
                      <FormControl>
                        <FormLabel>Terms URL</FormLabel>
                        <Input
                          value={settings.terms.termsUrl}
                          onChange={e =>
                            updateSettings('terms', {
                              termsUrl: e.target.value,
                            })
                          }
                          placeholder="https://speedyvan.com/terms"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Version</FormLabel>
                        <Input
                          value={settings.terms.version}
                          onChange={e =>
                            updateSettings('terms', { version: e.target.value })
                          }
                          placeholder="2.1"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Last Updated</FormLabel>
                        <Input
                          type="date"
                          value={settings.terms.lastUpdated}
                          onChange={e =>
                            updateSettings('terms', {
                              lastUpdated: e.target.value,
                            })
                          }
                        />
                      </FormControl>
                    </Grid>

                    <HStack spacing={2}>
                      <Button
                        leftIcon={<FiEye />}
                        variant="outline"
                        onClick={() => previewDocument('terms')}
                      >
                        Preview Terms
                      </Button>
                      <Button
                        leftIcon={<FiDownload />}
                        variant="outline"
                        onClick={exportLegalDocuments}
                      >
                        Export Terms
                      </Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>

            {/* Cookie Policy */}
            <TabPanel>
              <Card bg={bgColor} border="1px solid" borderColor={borderColor}>
                <CardBody>
                  <VStack align="start" spacing={4}>
                    <HStack>
                      <Icon as={FiSettings} boxSize={5} color="brand.500" />
                      <Heading size="md">Cookie Policy</Heading>
                    </HStack>

                    <VStack align="start" spacing={3} w="full">
                      <FormControl>
                        <FormLabel>Essential Cookies</FormLabel>
                        <Switch
                          isChecked={settings.cookies.essential}
                          onChange={e =>
                            updateSettings('cookies', {
                              essential: e.target.checked,
                            })
                          }
                        />
                        <FormHelperText>
                          Required for basic website functionality
                        </FormHelperText>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Analytics Cookies</FormLabel>
                        <Switch
                          isChecked={settings.cookies.analytics}
                          onChange={e =>
                            updateSettings('cookies', {
                              analytics: e.target.checked,
                            })
                          }
                        />
                        <FormHelperText>
                          Help us understand how visitors use our website
                        </FormHelperText>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Marketing Cookies</FormLabel>
                        <Switch
                          isChecked={settings.cookies.marketing}
                          onChange={e =>
                            updateSettings('cookies', {
                              marketing: e.target.checked,
                            })
                          }
                        />
                        <FormHelperText>
                          Used for targeted advertising and marketing
                        </FormHelperText>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Preference Cookies</FormLabel>
                        <Switch
                          isChecked={settings.cookies.preferences}
                          onChange={e =>
                            updateSettings('cookies', {
                              preferences: e.target.checked,
                            })
                          }
                        />
                        <FormHelperText>
                          Remember your preferences and settings
                        </FormHelperText>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Cookie Retention (days)</FormLabel>
                        <Input
                          type="number"
                          value={settings.cookies.retentionDays}
                          onChange={e =>
                            updateSettings('cookies', {
                              retentionDays: parseInt(e.target.value),
                            })
                          }
                          placeholder="365"
                        />
                        <FormHelperText>
                          How long to keep cookies before automatic deletion
                        </FormHelperText>
                      </FormControl>
                    </VStack>

                    <Alert status="info" borderRadius="md">
                      <AlertIcon />
                      <Box>
                        <Text fontWeight="medium">Cookie Notice</Text>
                        <Text fontSize="sm">
                          Users will be shown a cookie consent banner based on
                          these settings. Essential cookies are always enabled
                          and cannot be disabled.
                        </Text>
                      </Box>
                    </Alert>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Legal Documents Export */}
        <Card bg={bgColor} border="1px solid" borderColor={borderColor}>
          <CardBody>
            <VStack align="start" spacing={4}>
              <Heading size="md">Legal Documents</Heading>
              <Text color="gray.600">
                Export and manage your legal documents for compliance and
                record-keeping.
              </Text>

              <HStack spacing={2}>
                <Button
                  leftIcon={<FiDownload />}
                  colorScheme="brand"
                  onClick={exportLegalDocuments}
                >
                  Export All Documents
                </Button>
                <Button leftIcon={<FiUpload />} variant="outline">
                  Import Documents
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
}
