'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Switch,
  FormControl,
  FormLabel,
  Button,
  Divider,
  HStack,
  Badge,
  useBreakpointValue,
  Stack,
  Input,
  Select,
  Textarea,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Avatar,
  Icon,
  IconButton,
  Tooltip,
  Spinner,
  Alert,
  AlertIcon,
  AlertDescription,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
} from '@chakra-ui/react';
import { 
  FiSettings, 
  FiBell, 
  FiShield, 
  FiMail, 
  FiUser, 
  FiTruck, 
  FiPhone, 
  FiEdit3,
  FiSave,
  FiLock,
  FiEye,
  FiEyeOff,
  FiDownload,
  FiUpload,
  FiTrash2,
  FiRefreshCw
} from 'react-icons/fi';
import { DriverShell } from '@/components/driver';

export default function DriverSettings() {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const toast = useToast();
  
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  
  // Profile data
  const [profileData, setProfileData] = useState({
    name: 'Ahmed Mohammed',
    email: 'ahmed@speedyvan.com', 
    phone: '01202 129746',
    address: '123 Glasgow Street, Glasgow, UK',
    emergencyContact: '01202 129746',
    drivingLicense: 'GB123456789',
    vehicleReg: 'SV21 ABC'
  });
  
  // Notifications settings
  const [notifications, setNotifications] = useState({
    jobAlerts: true,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    marketingEmails: false,
    weeklyReports: true
  });
  
  
  // Vehicle settings
  const [vehicleSettings, setVehicleSettings] = useState({
    vehicleType: 'van',
    maxWeight: '1000',
    specialEquipment: ['trolley', 'straps'],
    insuranceExpiry: '2025-12-31',
    motExpiry: '2025-06-15'
  });
  
  // Modals
  const { isOpen: isPasswordOpen, onOpen: onPasswordOpen, onClose: onPasswordClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  
  // Password change
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Client-side only: Update time to avoid hydration mismatch
  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString());
  }, []);

  // Save functions
  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast({
        title: 'Notifications Updated',
        description: 'Your notification preferences have been saved.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update notifications.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new !== passwordData.confirm) {
      toast({
        title: 'Error',
        description: 'New passwords do not match.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      toast({
        title: 'Password Changed',
        description: 'Your password has been successfully updated.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      setPasswordData({ current: '', new: '', confirm: '' });
      onPasswordClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to change password.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DriverShell
      title="Driver Settings"
      subtitle="Manage your profile, notifications, and preferences"
      actions={
        <HStack spacing={2}>
          {lastUpdated && (
            <Text fontSize="sm" color="text.secondary">
              Last updated: {lastUpdated}
            </Text>
          )}
          <Tooltip label="Refresh settings">
            <IconButton
              size="sm"
              variant="outline"
              icon={<FiRefreshCw />}
              onClick={() => window.location.reload()}
              aria-label="Refresh"
            />
          </Tooltip>
        </HStack>
      }
    >
      <VStack spacing={{ base: 6, md: 8 }} align="stretch">

        {/* Account Status Overview */}
        <Card
          bg="bg.card"
          border="1px solid"
          borderColor="border.primary"
          borderRadius="xl"
          position="relative"
          overflow="hidden"
          boxShadow="0 0 30px rgba(59, 130, 246, 0.5), 0 0 60px rgba(59, 130, 246, 0.3)"
          transition="all 0.3s"
          animation="pulse-account 4s ease-in-out infinite"
          _hover={{
            boxShadow: "0 0 40px rgba(59, 130, 246, 0.7), 0 0 80px rgba(59, 130, 246, 0.4)",
            _before: {
              content: '""',
              position: "absolute",
              top: "0",
              left: "-100%",
              width: "100%",
              height: "100%",
              background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
              animation: "wave-settings 1s ease-out",
              zIndex: 1
            }
          }}
          sx={{
            "@keyframes pulse-account": {
              "0%, 100%": { boxShadow: "0 0 25px rgba(59, 130, 246, 0.4), 0 0 50px rgba(59, 130, 246, 0.2)" },
              "50%": { boxShadow: "0 0 35px rgba(59, 130, 246, 0.6), 0 0 70px rgba(59, 130, 246, 0.35)" }
            },
            "@keyframes wave-settings": {
              "0%": { left: "-100%" },
              "100%": { left: "100%" }
            }
          }}
          _after={{
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 'xl',
            padding: '1px',
            background: 'linear-gradient(135deg, rgba(0,194,255,0.2), rgba(0,209,143,0.2))',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            pointerEvents: 'none',
          }}
        >
          <CardBody p={{ base: 4, md: 6 }} position="relative" zIndex={2}>
            <VStack spacing={4}>
              <Flex align="center" justify="space-between" w="full" direction={{ base: "column", md: "row" }}>
                <HStack spacing={4}>
                  <Avatar 
                    size="lg" 
                    name={profileData.name}
                    boxShadow="0 0 20px rgba(59, 130, 246, 0.7), 0 0 40px rgba(59, 130, 246, 0.4)"
                  />
                  <VStack align="start" spacing={1}>
                    <Text 
                      fontSize="xl" 
                      fontWeight="bold" 
                      color="white"
                      textShadow="0 0 12px rgba(59, 130, 246, 0.8), 0 0 24px rgba(59, 130, 246, 0.4)"
                    >
                      {profileData.name}
                    </Text>
                    <Text 
                      color="white" 
                      opacity={0.9}
                      textShadow="0 0 6px rgba(255, 255, 255, 0.4)"
                    >
                      {profileData.email}
                    </Text>
                    <Badge 
                      colorScheme="brand"
                      boxShadow="0 0 10px rgba(34, 197, 94, 0.6)"
                    >
                      Active Driver
                    </Badge>
                  </VStack>
                </HStack>
                
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mt={{ base: 4, md: 0 }}>
                  <Stat textAlign="center">
                    <StatLabel color="white" opacity={0.7}>Status</StatLabel>
                    <StatNumber 
                      fontSize="md" 
                      color="white"
                      textShadow="0 0 10px rgba(34, 197, 94, 0.8)"
                    >
                      Active
                    </StatNumber>
                  </Stat>
                  <Stat textAlign="center">
                    <StatLabel color="white" opacity={0.7}>Rating</StatLabel>
                    <StatNumber 
                      fontSize="md" 
                      color="white"
                      textShadow="0 0 10px rgba(251, 191, 36, 0.8)"
                    >
                      4.8
                    </StatNumber>
                    <StatHelpText color="white" opacity={0.7}>
                      <HStack spacing={1} justify="center">
                        {[0, 1, 2, 3, 4].map((index) => (
                          <Box
                            key={index}
                            as="span"
                            animation={`flash-star 5s ease-in-out infinite`}
                            sx={{
                              animationDelay: `${index * 1}s`,
                              "@keyframes flash-star": {
                                "0%, 19%, 100%": { 
                                  opacity: 0.7,
                                  transform: "scale(1)",
                                  textShadow: "0 0 5px rgba(251, 191, 36, 0.5)"
                                },
                                "10%": { 
                                  opacity: 1,
                                  transform: "scale(1.3)",
                                  textShadow: "0 0 20px rgba(251, 191, 36, 1), 0 0 40px rgba(251, 191, 36, 0.8)"
                                }
                              }
                            }}
                          >
                            ⭐
                          </Box>
                        ))}
                      </HStack>
                    </StatHelpText>
                  </Stat>
                  <Stat textAlign="center">
                    <StatLabel color="white" opacity={0.7}>Completed</StatLabel>
                    <StatNumber 
                      fontSize="md" 
                      color="white"
                      textShadow="0 0 10px rgba(59, 130, 246, 0.8)"
                    >
                      247
                    </StatNumber>
                    <StatHelpText color="white" opacity={0.7}>Jobs</StatHelpText>
                  </Stat>
                  <Stat textAlign="center">
                    <StatLabel color="white" opacity={0.7}>Earnings</StatLabel>
                    <StatNumber 
                      fontSize="md" 
                      color="white"
                      textShadow="0 0 10px rgba(34, 197, 94, 0.8)"
                    >
                      £2,340
                    </StatNumber>
                    <StatHelpText color="white" opacity={0.7}>This month</StatHelpText>
                  </Stat>
                </SimpleGrid>
              </Flex>
            </VStack>
          </CardBody>
        </Card>

        {/* Settings Tabs */}
        <Card
          bg="bg.card"
          border="1px solid"
          borderColor="border.primary"
          borderRadius="xl"
          position="relative"
          overflow="hidden"
          boxShadow="0 0 25px rgba(34, 197, 94, 0.5), 0 0 50px rgba(34, 197, 94, 0.3)"
          transition="all 0.3s"
          _hover={{
            boxShadow: "0 0 35px rgba(34, 197, 94, 0.7), 0 0 70px rgba(34, 197, 94, 0.4)",
            _before: {
              content: '""',
              position: "absolute",
              top: "0",
              left: "-100%",
              width: "100%",
              height: "100%",
              background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
              animation: "wave-settings-main 1s ease-out",
              zIndex: 1
            }
          }}
          sx={{
            "@keyframes wave-settings-main": {
              "0%": { left: "-100%" },
              "100%": { left: "100%" }
            }
          }}
          _after={{
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 'xl',
            padding: '1px',
            background: 'linear-gradient(135deg, rgba(0,194,255,0.2), rgba(0,209,143,0.2))',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            pointerEvents: 'none',
          }}
        >
          <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed">
            <TabList position="relative" zIndex={2}>
              <Tab 
                color="white"
                _selected={{ 
                  color: "neon.500", 
                  bg: "bg.surface",
                  boxShadow: "0 0 15px rgba(59, 130, 246, 0.6)"
                }}
              >
                <Icon as={FiUser} mr={2} />Profile
              </Tab>
              <Tab 
                color="white"
                _selected={{ 
                  color: "neon.500", 
                  bg: "bg.surface",
                  boxShadow: "0 0 15px rgba(251, 191, 36, 0.6)"
                }}
              >
                <Icon as={FiBell} mr={2} />Notifications
              </Tab>
              <Tab 
                color="white"
                _selected={{ 
                  color: "neon.500", 
                  bg: "bg.surface",
                  boxShadow: "0 0 15px rgba(168, 85, 247, 0.6)"
                }}
              >
                <Icon as={FiTruck} mr={2} />Vehicle
              </Tab>
              <Tab 
                color="white"
                _selected={{ 
                  color: "neon.500", 
                  bg: "bg.surface",
                  boxShadow: "0 0 15px rgba(239, 68, 68, 0.6)"
                }}
              >
                <Icon as={FiShield} mr={2} />Security
              </Tab>
            </TabList>

            <TabPanels>
              {/* Profile Tab */}
              <TabPanel p={{ base: 4, md: 6 }}>
                <VStack spacing={6} align="stretch">
                  <Heading 
                    size="md" 
                    color="white"
                    textShadow="0 0 12px rgba(59, 130, 246, 0.8), 0 0 24px rgba(59, 130, 246, 0.4)"
                  >
                    Personal Information
                  </Heading>
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl>
                    <FormLabel color="white" opacity={0.9}>Full Name</FormLabel>
                      <Input 
                        value={profileData.name}
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel color="white" opacity={0.9}>Email Address</FormLabel>
                      <Input 
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel color="white" opacity={0.9}>Phone Number</FormLabel>
                      <Input 
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel color="white" opacity={0.9}>Emergency Contact</FormLabel>
                      <Input 
                        value={profileData.emergencyContact}
                        onChange={(e) => setProfileData({...profileData, emergencyContact: e.target.value})}
                      />
                    </FormControl>
                  </SimpleGrid>
                  
                  <FormControl>
                    <FormLabel color="white" opacity={0.9}>Address</FormLabel>
                    <Textarea 
                      value={profileData.address}
                      onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                    />
                  </FormControl>
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel color="white" opacity={0.9}>Driving License Number</FormLabel>
                      <Input 
                        value={profileData.drivingLicense}
                        onChange={(e) => setProfileData({...profileData, drivingLicense: e.target.value})}
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel color="white" opacity={0.9}>Vehicle Registration</FormLabel>
                      <Input 
                        value={profileData.vehicleReg}
                        onChange={(e) => setProfileData({...profileData, vehicleReg: e.target.value})}
                      />
                    </FormControl>
                  </SimpleGrid>
                  
                  <Button 
                    colorScheme="blue" 
                    onClick={handleSaveProfile}
                    isLoading={isSaving}
                    leftIcon={<FiSave />}
                    alignSelf="start"
                    position="relative"
                    overflow="hidden"
                    boxShadow="0 0 15px rgba(59, 130, 246, 0.6), 0 0 30px rgba(59, 130, 246, 0.3)"
                    _hover={{
                      boxShadow: "0 0 20px rgba(59, 130, 246, 0.8), 0 0 40px rgba(59, 130, 246, 0.4)",
                      transform: "scale(1.05)",
                      _before: {
                        content: '""',
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: "0",
                        height: "0",
                        borderRadius: "50%",
                        background: "rgba(255, 255, 255, 0.6)",
                        transform: "translate(-50%, -50%)",
                        animation: "ripple-save 0.6s ease-out"
                      }
                    }}
                    sx={{
                      "@keyframes ripple-save": {
                        "0%": { width: "0", height: "0", opacity: 1 },
                        "100%": { width: "200px", height: "200px", opacity: 0 }
                      }
                    }}
                  >
                    Save Profile
                  </Button>
                </VStack>
              </TabPanel>

              {/* Notifications Tab */}
              <TabPanel p={{ base: 4, md: 6 }}>
                <VStack spacing={6} align="stretch">
                  <Heading 
                    size="md" 
                    color="white"
                    textShadow="0 0 12px rgba(251, 191, 36, 0.8), 0 0 24px rgba(251, 191, 36, 0.4)"
                  >
                    Notification Preferences
                  </Heading>
                  
                  <VStack spacing={4} align="stretch">
                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                      <VStack align="start" spacing={1}>
                        <FormLabel mb="0" color="white" opacity={0.95}>Job Alerts</FormLabel>
                        <Text fontSize="sm" color="white" opacity={0.7}>Receive notifications for new job opportunities</Text>
                      </VStack>
                      <Switch 
                        colorScheme="blue" 
                        isChecked={notifications.jobAlerts}
                        onChange={(e) => setNotifications({...notifications, jobAlerts: e.target.checked})}
                      />
                    </FormControl>
                    
                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                      <VStack align="start" spacing={1}>
                        <FormLabel mb="0" color="white" opacity={0.95}>Push Notifications</FormLabel>
                        <Text fontSize="sm" color="white" opacity={0.7}>Instant notifications on your device</Text>
                      </VStack>
                      <Switch 
                        colorScheme="blue" 
                        isChecked={notifications.pushNotifications}
                        onChange={(e) => setNotifications({...notifications, pushNotifications: e.target.checked})}
                      />
                    </FormControl>
                    
                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                      <VStack align="start" spacing={1}>
                        <FormLabel mb="0">Email Notifications</FormLabel>
                        <Text fontSize="sm" color="gray.600">Job updates and important information via email</Text>
                      </VStack>
                      <Switch 
                        colorScheme="blue" 
                        isChecked={notifications.emailNotifications}
                        onChange={(e) => setNotifications({...notifications, emailNotifications: e.target.checked})}
                      />
                    </FormControl>
                    
                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                      <VStack align="start" spacing={1}>
                        <FormLabel mb="0">SMS Notifications</FormLabel>
                        <Text fontSize="sm" color="gray.600">Text messages for urgent job updates</Text>
                      </VStack>
                      <Switch 
                        colorScheme="blue" 
                        isChecked={notifications.smsNotifications}
                        onChange={(e) => setNotifications({...notifications, smsNotifications: e.target.checked})}
                      />
                    </FormControl>
                    
                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                      <VStack align="start" spacing={1}>
                        <FormLabel mb="0">Weekly Reports</FormLabel>
                        <Text fontSize="sm" color="gray.600">Summary of your weekly performance and earnings</Text>
                      </VStack>
                      <Switch 
                        colorScheme="blue" 
                        isChecked={notifications.weeklyReports}
                        onChange={(e) => setNotifications({...notifications, weeklyReports: e.target.checked})}
                      />
                    </FormControl>
                    
                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                      <VStack align="start" spacing={1}>
                        <FormLabel mb="0">Marketing Emails</FormLabel>
                        <Text fontSize="sm" color="gray.600">Promotional offers and updates</Text>
                      </VStack>
                      <Switch 
                        colorScheme="blue" 
                        isChecked={notifications.marketingEmails}
                        onChange={(e) => setNotifications({...notifications, marketingEmails: e.target.checked})}
                      />
                    </FormControl>
                  </VStack>
                  
                  <Button 
                    colorScheme="blue" 
                    onClick={handleSaveNotifications}
                    isLoading={isSaving}
                    leftIcon={<FiSave />}
                    alignSelf="start"
                  >
                    Save Preferences
                  </Button>
                </VStack>
              </TabPanel>

              {/* Vehicle Tab */}
              <TabPanel p={{ base: 4, md: 6 }}>
                <VStack spacing={6} align="stretch">
                  <Heading 
                    size="md" 
                    color="white"
                    textShadow="0 0 12px rgba(168, 85, 247, 0.8), 0 0 24px rgba(168, 85, 247, 0.4)"
                  >
                    Vehicle Information
                  </Heading>
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel>Vehicle Type</FormLabel>
                      <Select 
                        value={vehicleSettings.vehicleType}
                        onChange={(e) => setVehicleSettings({...vehicleSettings, vehicleType: e.target.value})}
                      >
                        <option value="van">Standard Van</option>
                        <option value="large-van">Large Van</option>
                        <option value="truck">Small Truck</option>
                      </Select>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Maximum Weight (kg)</FormLabel>
                      <Input 
                        type="number"
                        value={vehicleSettings.maxWeight}
                        onChange={(e) => setVehicleSettings({...vehicleSettings, maxWeight: e.target.value})}
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Insurance Expiry</FormLabel>
                      <Input 
                        type="date"
                        value={vehicleSettings.insuranceExpiry}
                        onChange={(e) => setVehicleSettings({...vehicleSettings, insuranceExpiry: e.target.value})}
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>MOT Expiry</FormLabel>
                      <Input 
                        type="date"
                        value={vehicleSettings.motExpiry}
                        onChange={(e) => setVehicleSettings({...vehicleSettings, motExpiry: e.target.value})}
                      />
                    </FormControl>
                  </SimpleGrid>
                  
                  <Alert status="info">
                    <AlertIcon />
                    <AlertDescription>
                      Keep your vehicle documents up to date to maintain your driver status and continue receiving jobs.
                    </AlertDescription>
                  </Alert>
                </VStack>
              </TabPanel>

              {/* Security Tab */}
              <TabPanel p={{ base: 4, md: 6 }}>
                <VStack spacing={6} align="stretch">
                  <Heading 
                    size="md" 
                    color="white"
                    textShadow="0 0 12px rgba(239, 68, 68, 0.8), 0 0 24px rgba(239, 68, 68, 0.4)"
                  >
                    Security & Privacy
                  </Heading>
                  
                  <VStack spacing={4} align="stretch">
                    <Card 
                      variant="outline"
                      position="relative"
                      overflow="hidden"
                      boxShadow="0 0 15px rgba(59, 130, 246, 0.5), 0 0 30px rgba(59, 130, 246, 0.3)"
                      transition="all 0.3s"
                      _hover={{
                        boxShadow: "0 0 20px rgba(59, 130, 246, 0.7), 0 0 40px rgba(59, 130, 246, 0.4)",
                        _before: {
                          content: '""',
                          position: "absolute",
                          top: "0",
                          left: "-100%",
                          width: "100%",
                          height: "100%",
                          background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
                          animation: "wave-sec 0.8s ease-out",
                          zIndex: 1
                        }
                      }}
                      sx={{
                        "@keyframes wave-sec": {
                          "0%": { left: "-100%" },
                          "100%": { left: "100%" }
                        }
                      }}
                    >
                      <CardBody position="relative" zIndex={2}>
                        <VStack spacing={3} align="stretch">
                          <Text fontWeight="semibold" color="white" textShadow="0 0 10px rgba(59, 130, 246, 0.8)">Password & Authentication</Text>
                          <Button 
                            variant="outline" 
                            leftIcon={<FiLock />}
                            onClick={onPasswordOpen}
                            size="lg"
                            color="white"
                            borderColor="neon.500"
                            _hover={{
                              boxShadow: "0 0 15px rgba(59, 130, 246, 0.6)",
                              bg: "rgba(59, 130, 246, 0.1)"
                            }}
                          >
                            Change Password
                          </Button>
                          <Text fontSize="sm" color="white" opacity={0.7}>
                            Last changed: Never (Please update your password)
                          </Text>
                        </VStack>
                      </CardBody>
                    </Card>
                    
                    <Card 
                      variant="outline"
                      position="relative"
                      overflow="hidden"
                      boxShadow="0 0 15px rgba(34, 197, 94, 0.5), 0 0 30px rgba(34, 197, 94, 0.3)"
                      transition="all 0.3s"
                      _hover={{
                        boxShadow: "0 0 20px rgba(34, 197, 94, 0.7), 0 0 40px rgba(34, 197, 94, 0.4)",
                        _before: {
                          content: '""',
                          position: "absolute",
                          top: "0",
                          left: "-100%",
                          width: "100%",
                          height: "100%",
                          background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
                          animation: "wave-privacy 0.8s ease-out",
                          zIndex: 1
                        }
                      }}
                      sx={{
                        "@keyframes wave-privacy": {
                          "0%": { left: "-100%" },
                          "100%": { left: "100%" }
                        }
                      }}
                    >
                      <CardBody position="relative" zIndex={2}>
                        <VStack spacing={3} align="stretch">
                          <Text fontWeight="semibold" color="white" textShadow="0 0 10px rgba(34, 197, 94, 0.8)">Data & Privacy</Text>
                          <HStack spacing={3}>
                            <Button 
                              variant="outline" 
                              leftIcon={<FiDownload />}
                              size="md"
                              color="white"
                              borderColor="neon.500"
                              _hover={{
                                boxShadow: "0 0 15px rgba(34, 197, 94, 0.6)",
                                bg: "rgba(34, 197, 94, 0.1)"
                              }}
                            >
                              Download My Data
                            </Button>
                            <Button 
                              variant="outline" 
                              leftIcon={<FiRefreshCw />}
                              size="md"
                              color="white"
                              borderColor="neon.500"
                              _hover={{
                                boxShadow: "0 0 15px rgba(34, 197, 94, 0.6)",
                                bg: "rgba(34, 197, 94, 0.1)"
                              }}
                            >
                              Privacy Settings
                            </Button>
                          </HStack>
                          <Text fontSize="sm" color="white" opacity={0.7}>
                            Manage your personal data and privacy preferences
                          </Text>
                        </VStack>
                      </CardBody>
                    </Card>
                    
                    <Card 
                      variant="outline" 
                      borderColor="red.200"
                      position="relative"
                      overflow="hidden"
                      boxShadow="0 0 15px rgba(239, 68, 68, 0.5), 0 0 30px rgba(239, 68, 68, 0.3)"
                      transition="all 0.3s"
                      animation="pulse-danger 3s ease-in-out infinite"
                      _hover={{
                        boxShadow: "0 0 25px rgba(239, 68, 68, 0.8), 0 0 50px rgba(239, 68, 68, 0.5)",
                        _before: {
                          content: '""',
                          position: "absolute",
                          top: "0",
                          left: "-100%",
                          width: "100%",
                          height: "100%",
                          background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
                          animation: "wave-danger 0.8s ease-out",
                          zIndex: 1
                        }
                      }}
                      sx={{
                        "@keyframes pulse-danger": {
                          "0%, 100%": { boxShadow: "0 0 10px rgba(239, 68, 68, 0.4), 0 0 20px rgba(239, 68, 68, 0.2)" },
                          "50%": { boxShadow: "0 0 20px rgba(239, 68, 68, 0.6), 0 0 40px rgba(239, 68, 68, 0.3)" }
                        },
                        "@keyframes wave-danger": {
                          "0%": { left: "-100%" },
                          "100%": { left: "100%" }
                        }
                      }}
                    >
                      <CardBody position="relative" zIndex={2}>
                        <VStack spacing={3} align="stretch">
                          <Text 
                            fontWeight="semibold" 
                            color="white"
                            textShadow="0 0 10px rgba(239, 68, 68, 0.9), 0 0 20px rgba(239, 68, 68, 0.6)"
                          >
                            Danger Zone
                          </Text>
                          <Button 
                            colorScheme="red" 
                            variant="outline"
                            leftIcon={<FiTrash2 />}
                            onClick={onDeleteOpen}
                            size="lg"
                            boxShadow="0 0 10px rgba(239, 68, 68, 0.5)"
                            _hover={{
                              boxShadow: "0 0 20px rgba(239, 68, 68, 0.8)",
                              transform: "scale(1.02)"
                            }}
                          >
                            Delete Account
                          </Button>
                          <Text 
                            fontSize="sm" 
                            color="white"
                            textShadow="0 0 6px rgba(239, 68, 68, 0.8)"
                          >
                            Permanently delete your account and all associated data
                          </Text>
                        </VStack>
                      </CardBody>
                    </Card>
                  </VStack>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Card>

        {/* Password Change Modal */}
        <Modal isOpen={isPasswordOpen} onClose={onPasswordClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Change Password</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Current Password</FormLabel>
                  <HStack>
                    <Input 
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.current}
                      onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                    />
                    <Button
                      size="sm"
                      onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                    >
                      {showPasswords.current ? <FiEyeOff /> : <FiEye />}
                    </Button>
                  </HStack>
                </FormControl>
                
                <FormControl>
                  <FormLabel>New Password</FormLabel>
                  <HStack>
                    <Input 
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.new}
                      onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                    />
                    <Button
                      size="sm"
                      onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                    >
                      {showPasswords.new ? <FiEyeOff /> : <FiEye />}
                    </Button>
                  </HStack>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Confirm New Password</FormLabel>
                  <HStack>
                    <Input 
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirm}
                      onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                    />
                    <Button
                      size="sm"
                      onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                    >
                      {showPasswords.confirm ? <FiEyeOff /> : <FiEye />}
                    </Button>
                  </HStack>
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onPasswordClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="blue" 
                onClick={handleChangePassword}
                isLoading={isSaving}
              >
                Change Password
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Delete Account Modal */}
        <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader color="red.600">Delete Account</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Alert status="warning">
                  <AlertIcon />
                  <AlertDescription>
                    This action cannot be undone. Your account and all data will be permanently deleted.
                  </AlertDescription>
                </Alert>
                <Text>
                  Are you sure you want to delete your account? This will:
                </Text>
                <VStack align="start" spacing={2} pl={4}>
                  <Text>• Delete all your personal information</Text>
                  <Text>• Remove your job history</Text>
                  <Text>• Cancel any pending jobs</Text>
                  <Text>• Permanently disable your driver account</Text>
                </VStack>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red">
                Yes, Delete My Account
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </DriverShell>
  );
}
