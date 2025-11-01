'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Divider,
  Spinner,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Switch,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Badge,
  Icon,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Tooltip,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Progress,
} from '@chakra-ui/react';
import { 
  FaPoundSign, 
  FaChartLine, 
  FaUsers, 
  FaSave, 
  FaPlus, 
  FaMinus, 
  FaUndo, 
  FaExclamationTriangle, 
  FaInfoCircle, 
  FaPercentage,
  FaHistory,
  FaCopy,
  FaDownload,
  FaCalendar,
  FaClock,
  FaChartBar,
  FaLightbulb,
  FaCalculator,
  FaBolt,
  FaEye,
  FaEyeSlash,
} from 'react-icons/fa';
import Button from '@/components/common/Button';

interface PricingSettings {
  id: string;
  customerPriceAdjustment: number;
  driverRateMultiplier: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

interface PricingPreset {
  id: string;
  name: string;
  customerAdjustment: number;
  driverMultiplier: number;
  description: string;
  icon: any;
  color: string;
}

interface HistoryEntry {
  timestamp: Date;
  customerAdjustment: number;
  driverMultiplier: number;
  user: string;
  action: string;
}

export default function PricingSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<PricingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  // Form state
  const [customerAdjustment, setCustomerAdjustment] = useState(0);
  const [driverMultiplier, setDriverMultiplier] = useState(1);
  const [isActive, setIsActive] = useState(true);
  
  // Additional state for enhanced features
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<{ customer: number; driver: number } | null>(null);
  
  // New advanced features state
  const [showHistory, setShowHistory] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPresets, setShowPresets] = useState(true);
  const [scheduledChange, setScheduledChange] = useState<Date | null>(null);
  const [changeHistory, setChangeHistory] = useState<HistoryEntry[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customNote, setCustomNote] = useState('');
  const [simulationMode, setSimulationMode] = useState(false);

  // Pricing Presets
  const pricingPresets: PricingPreset[] = [
    {
      id: 'peak-season',
      name: 'Peak Season',
      customerAdjustment: 25,
      driverMultiplier: 1.2,
      description: 'High demand periods (Christmas, holidays)',
      icon: FaBolt,
      color: 'orange',
    },
    {
      id: 'low-season',
      name: 'Low Season',
      customerAdjustment: -15,
      driverMultiplier: 0.9,
      description: 'Attract customers during quiet periods',
      icon: FaChartLine,
      color: 'blue',
    },
    {
      id: 'driver-boost',
      name: 'Driver Boost',
      customerAdjustment: 0,
      driverMultiplier: 1.4,
      description: 'Incentivize drivers without raising prices',
      icon: FaUsers,
      color: 'green',
    },
    {
      id: 'competitive',
      name: 'Competitive',
      customerAdjustment: -10,
      driverMultiplier: 1.0,
      description: 'Beat competitor prices',
      icon: FaChartBar,
      color: 'purple',
    },
    {
      id: 'premium',
      name: 'Premium',
      customerAdjustment: 30,
      driverMultiplier: 1.3,
      description: 'Premium service with higher earnings',
      icon: FaPoundSign,
      color: 'yellow',
    },
    {
      id: 'balanced',
      name: 'Balanced',
      customerAdjustment: 0,
      driverMultiplier: 1.0,
      description: 'Default balanced pricing',
      icon: FaCalculator,
      color: 'gray',
    },
  ];

  // Check admin access
  useEffect(() => {
    if (status === 'loading') return;

    const role = (session?.user as any)?.role as string | undefined;
    if (!session?.user || role !== 'admin') {
      toast({
        title: 'Access Denied',
        description: 'You must be an admin to access pricing settings',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      router.push('/admin');
      return;
    }
  }, [session, status, router, toast]);

  useEffect(() => {
    if (((session?.user as any)?.role as string | undefined) === 'admin') {
      loadSettings();
    }
  }, [session]);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/pricing');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        const customerValue = data.customerPriceAdjustment * 100;
        const driverValue = data.driverRateMultiplier;
        setCustomerAdjustment(customerValue);
        setDriverMultiplier(driverValue);
        setIsActive(data.isActive);
        setOriginalSettings({ customer: customerValue, driver: driverValue });
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Failed to load pricing settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pricing settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    await saveSettingsWithHistory();
  };

  // Helper functions for quick adjustments
  const adjustCustomerPrice = (amount: number) => {
    const newValue = Math.max(-100, Math.min(100, customerAdjustment + amount));
    setCustomerAdjustment(newValue);
    setHasUnsavedChanges(true);
  };

  const adjustDriverRate = (amount: number) => {
    const newValue = Math.max(0.5, Math.min(2.0, driverMultiplier + amount));
    setDriverMultiplier(parseFloat(newValue.toFixed(1)));
    setHasUnsavedChanges(true);
  };

  const resetToDefaults = () => {
    setCustomerAdjustment(0);
    setDriverMultiplier(1);
    setIsActive(true);
    setHasUnsavedChanges(true);
    toast({
      title: 'Reset to Defaults',
      description: 'Settings reset to default values (not saved yet)',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const resetToOriginal = () => {
    if (originalSettings) {
      setCustomerAdjustment(originalSettings.customer);
      setDriverMultiplier(originalSettings.driver);
      setHasUnsavedChanges(false);
      toast({
        title: 'Changes Discarded',
        description: 'Reverted to last saved settings',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Warning levels
  const getCustomerWarningLevel = () => {
    const abs = Math.abs(customerAdjustment);
    if (abs >= 50) return { level: 'high', color: 'red' };
    if (abs >= 25) return { level: 'medium', color: 'orange' };
    return { level: 'safe', color: 'green' };
  };

  const getDriverWarningLevel = () => {
    if (driverMultiplier >= 1.5 || driverMultiplier <= 0.7) return { level: 'high', color: 'red' };
    if (driverMultiplier >= 1.3 || driverMultiplier <= 0.8) return { level: 'medium', color: 'orange' };
    return { level: 'safe', color: 'green' };
  };

  // Calculate impact on example booking
  const calculateExampleImpact = () => {
    const basePrice = 50; // £50 example booking
    const adjustedCustomerPrice = basePrice * (1 + customerAdjustment / 100);
    const baseDriverEarnings = 35; // £35 base driver earnings
    const adjustedDriverEarnings = baseDriverEarnings * driverMultiplier;
    
    return {
      originalPrice: basePrice,
      newPrice: adjustedCustomerPrice,
      priceDiff: adjustedCustomerPrice - basePrice,
      originalDriver: baseDriverEarnings,
      newDriver: adjustedDriverEarnings,
      driverDiff: adjustedDriverEarnings - baseDriverEarnings,
    };
  };

  const exampleImpact = calculateExampleImpact();
  const customerWarning = getCustomerWarningLevel();
  const driverWarning = getDriverWarningLevel();

  // Track changes
  useEffect(() => {
    if (originalSettings) {
      const changed = 
        Math.abs(customerAdjustment - originalSettings.customer) > 0.01 ||
        Math.abs(driverMultiplier - originalSettings.driver) > 0.01;
      setHasUnsavedChanges(changed);
    }
  }, [customerAdjustment, driverMultiplier, originalSettings]);

  // Load change history (simulate from localStorage)
  useEffect(() => {
    const savedHistory = localStorage.getItem('pricingHistory');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setChangeHistory(parsed.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        })));
      } catch (e) {
        console.error('Failed to load history:', e);
      }
    }
  }, []);

  // Apply preset
  const applyPreset = (preset: PricingPreset) => {
    setCustomerAdjustment(preset.customerAdjustment);
    setDriverMultiplier(preset.driverMultiplier);
    setSelectedPreset(preset.id);
    setHasUnsavedChanges(true);
    toast({
      title: `Applied ${preset.name}`,
      description: preset.description,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  // Copy current settings
  const copySettings = () => {
    const settings = {
      customerPriceAdjustment: customerAdjustment,
      driverRateMultiplier: driverMultiplier,
      timestamp: new Date().toISOString(),
    };
    navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
    toast({
      title: 'Settings Copied',
      description: 'Settings copied to clipboard',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // Export settings
  const exportSettings = () => {
    const data = {
      currentSettings: {
        customerPriceAdjustment: customerAdjustment,
        driverRateMultiplier: driverMultiplier,
        isActive,
      },
      history: changeHistory,
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pricing-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Settings Exported',
      description: 'Settings downloaded as JSON file',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  // Calculate revenue projection
  const calculateRevenueProjection = () => {
    const avgDailyBookings = 50; // Example
    const avgBookingValue = 50; // £50
    const currentRevenue = avgDailyBookings * avgBookingValue;
    const projectedRevenue = currentRevenue * (1 + customerAdjustment / 100);
    const monthlyIncrease = (projectedRevenue - currentRevenue) * 30;
    
    return {
      current: currentRevenue,
      projected: projectedRevenue,
      dailyDiff: projectedRevenue - currentRevenue,
      monthlyDiff: monthlyIncrease,
      percentageChange: ((projectedRevenue - currentRevenue) / currentRevenue) * 100,
    };
  };

  // Calculate driver cost projection
  const calculateDriverCostProjection = () => {
    const avgDailyDriverPayments = 1750; // £1750 example
    const currentCost = avgDailyDriverPayments;
    const projectedCost = currentCost * driverMultiplier;
    const monthlyCostChange = (projectedCost - currentCost) * 30;
    
    return {
      current: currentCost,
      projected: projectedCost,
      dailyDiff: projectedCost - currentCost,
      monthlyDiff: monthlyCostChange,
      percentageChange: ((projectedCost - currentCost) / currentCost) * 100,
    };
  };

  // Get smart recommendations
  const getSmartRecommendations = (): string[] => {
    const recommendations: string[] = [];
    
    // Check customer adjustment
    if (customerAdjustment > 30) {
      recommendations.push('⚠️ High price increase may reduce booking volume. Consider A/B testing.');
    } else if (customerAdjustment < -20) {
      recommendations.push('💡 Low prices may attract customers but hurt profitability. Monitor margins.');
    } else if (customerAdjustment === 0) {
      recommendations.push('✅ Neutral pricing. Consider seasonal adjustments for optimization.');
    }
    
    // Check driver multiplier
    if (driverMultiplier > 1.4) {
      recommendations.push('⚠️ High driver rates. Ensure platform remains profitable.');
    } else if (driverMultiplier < 0.8) {
      recommendations.push('⚠️ Low driver rates may affect driver retention and availability.');
    } else if (driverMultiplier === 1.0) {
      recommendations.push('✅ Standard driver rates. Consider incentives during peak times.');
    }
    
    // Combination checks
    if (customerAdjustment > 20 && driverMultiplier > 1.3) {
      recommendations.push('💰 High prices + High driver rates = Lower platform margin. Review carefully.');
    }
    
    if (customerAdjustment < 0 && driverMultiplier > 1.2) {
      recommendations.push('🔴 Discounted prices + High driver rates = Negative margins possible!');
    }
    
    // Optimal scenarios
    if (customerAdjustment >= 10 && customerAdjustment <= 20 && driverMultiplier >= 1.1 && driverMultiplier <= 1.2) {
      recommendations.push('🌟 Optimal balance: Good for revenue and driver satisfaction!');
    }

    // Time-based recommendations
    const hour = new Date().getHours();
    if (hour >= 17 && hour <= 20) {
      recommendations.push('🕐 Peak evening hours. Consider surge pricing (+15-25%).');
    }
    
    const day = new Date().getDay();
    if (day === 6 || day === 0) {
      recommendations.push('📅 Weekend detected. Higher demand expected - consider premium rates.');
    }

    return recommendations.length > 0 ? recommendations : ['✅ Current settings look reasonable.'];
  };

  // Save with history
  const saveSettingsWithHistory = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings/pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerPriceAdjustment: customerAdjustment / 100,
          driverRateMultiplier: driverMultiplier,
          isActive,
        }),
      });

      if (response.ok) {
        // Add to history
        const newEntry: HistoryEntry = {
          timestamp: new Date(),
          customerAdjustment,
          driverMultiplier,
          user: session?.user?.email || 'Admin',
          action: customNote || 'Settings updated',
        };
        
        const updatedHistory = [newEntry, ...changeHistory].slice(0, 20); // Keep last 20
        setChangeHistory(updatedHistory);
        localStorage.setItem('pricingHistory', JSON.stringify(updatedHistory));
        
        setCustomNote('');
        
        toast({
          title: 'Success',
          description: 'Pricing settings saved successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        await loadSettings();
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save pricing settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save pricing settings',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const revenueProjection = calculateRevenueProjection();
  const driverCostProjection = calculateDriverCostProjection();
  const smartRecommendations = getSmartRecommendations();

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <Box p={6}>
        <VStack spacing={6} align="center">
          <Spinner size="xl" />
          <Text>Loading...</Text>
        </VStack>
      </Box>
    );
  }

  // Show access denied if not admin
  const user = (session as any)?.user;
  const role = user?.role as string | undefined;
  if (!user || role !== 'admin') {
    return (
      <Box p={6}>
        <VStack spacing={6} align="center">
          <Alert status="error">
            <AlertIcon />
            <Box>
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>
                You must be an admin to access pricing settings. Redirecting...
              </AlertDescription>
            </Box>
          </Alert>
        </VStack>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box p={6}>
        <VStack spacing={6} align="center">
          <Spinner size="xl" />
          <Text>Loading pricing settings...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <HStack justify="space-between" align="start">
            <Box>
              <Heading size="lg" mb={2}>
                Pricing Settings
              </Heading>
              <Text color="text.secondary">
                Manage customer pricing adjustments and driver rate multipliers
              </Text>
            </Box>
            {hasUnsavedChanges && (
              <Badge colorScheme="yellow" fontSize="md" px={3} py={1}>
                Unsaved Changes
              </Badge>
            )}
          </HStack>
        </Box>

        <Divider />

        {/* Impact Statistics */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <Box
            p={4}
            bg="bg.surface"
            borderRadius="lg"
            border="1px solid"
            borderColor="border.primary"
          >
            <Stat>
              <StatLabel>Customer Price Impact</StatLabel>
              <StatNumber>
                {customerAdjustment > 0 ? '+' : ''}
                {customerAdjustment}%
              </StatNumber>
              <StatHelpText>
                {exampleImpact.priceDiff >= 0 && <StatArrow type="increase" />}
                {exampleImpact.priceDiff < 0 && <StatArrow type="decrease" />}
                £{Math.abs(exampleImpact.priceDiff).toFixed(2)} on £50 booking
              </StatHelpText>
            </Stat>
          </Box>

          <Box
            p={4}
            bg="bg.surface"
            borderRadius="lg"
            border="1px solid"
            borderColor="border.primary"
          >
            <Stat>
              <StatLabel>Driver Earnings Impact</StatLabel>
              <StatNumber>{driverMultiplier.toFixed(1)}x</StatNumber>
              <StatHelpText>
                {exampleImpact.driverDiff >= 0 && <StatArrow type="increase" />}
                {exampleImpact.driverDiff < 0 && <StatArrow type="decrease" />}
                £{Math.abs(exampleImpact.driverDiff).toFixed(2)} on £35 base
              </StatHelpText>
            </Stat>
          </Box>

          <Box
            p={4}
            bg="bg.surface"
            borderRadius="lg"
            border="1px solid"
            borderColor="border.primary"
          >
            <Stat>
              <StatLabel>System Status</StatLabel>
              <StatNumber>
                <Badge colorScheme={isActive ? 'green' : 'red'} fontSize="lg">
                  {isActive ? 'Active' : 'Inactive'}
                </Badge>
              </StatNumber>
              <StatHelpText>
                {isActive ? 'Settings applied to new bookings' : 'Settings not applied'}
              </StatHelpText>
            </Stat>
          </Box>
        </SimpleGrid>

        {/* Warning Alerts */}
        {customerWarning.level === 'high' && (
          <Alert status="error">
            <AlertIcon />
            <Box>
              <AlertTitle>High Customer Price Adjustment!</AlertTitle>
              <AlertDescription>
                You're adjusting prices by {customerAdjustment > 0 ? '+' : ''}{customerAdjustment}%. 
                This could significantly impact customer demand and revenue.
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {customerWarning.level === 'medium' && (
          <Alert status="warning">
            <AlertIcon />
            <Box>
              <AlertTitle>Moderate Price Adjustment</AlertTitle>
              <AlertDescription>
                Customer prices will change by {customerAdjustment > 0 ? '+' : ''}{customerAdjustment}%. 
                Monitor booking rates closely.
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {driverWarning.level === 'high' && (
          <Alert status="error">
            <AlertIcon />
            <Box>
              <AlertTitle>Extreme Driver Rate Change!</AlertTitle>
              <AlertDescription>
                Driver earnings multiplier is at {driverMultiplier}x. 
                This could affect driver satisfaction and platform profitability.
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {driverWarning.level === 'medium' && (
          <Alert status="warning">
            <AlertIcon />
            <Box>
              <AlertTitle>Significant Driver Rate Change</AlertTitle>
              <AlertDescription>
                Driver earnings are multiplied by {driverMultiplier}x. 
                Ensure this aligns with business objectives.
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Current Settings Display */}
        {settings && (
          <Box
            p={4}
            bg="bg.surface"
            borderRadius="lg"
            border="1px solid"
            borderColor="border.primary"
          >
            <VStack align="start" spacing={3}>
              <Text fontWeight="bold">Current Settings</Text>
              <HStack spacing={6}>
                <Text>
                  Customer Price Adjustment:{' '}
                  <Badge
                    colorScheme={
                      settings.customerPriceAdjustment > 0
                        ? 'green'
                        : settings.customerPriceAdjustment < 0
                          ? 'red'
                          : 'gray'
                    }
                  >
                    {settings.customerPriceAdjustment > 0 ? '+' : ''}
                    {Math.round(settings.customerPriceAdjustment * 100)}%
                  </Badge>
                </Text>
                <Text>
                  Driver Rate Multiplier:{' '}
                  <Badge colorScheme="blue">
                    {settings.driverRateMultiplier}x
                  </Badge>
                </Text>
                <Text>
                  Status:{' '}
                  <Badge colorScheme={settings.isActive ? 'green' : 'red'}>
                    {settings.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </Text>
              </HStack>
              <Text fontSize="sm" color="text.tertiary">
                Last updated: {new Date(settings.updatedAt).toLocaleString()}
              </Text>
            </VStack>
          </Box>
        )}

        {/* Settings Form */}
        <Box
          p={6}
          bg="bg.surface"
          borderRadius="lg"
          border="1px solid"
          borderColor="border.primary"
        >
          <VStack spacing={6} align="stretch">
            <HStack justify="space-between">
              <Heading size="md">Adjust Pricing</Heading>
              <HStack>
                <Tooltip label="Reset to default values (0%, 1.0x)">
                  <IconButton
                    aria-label="Reset to defaults"
                    icon={<FaUndo />}
                    onClick={resetToDefaults}
                    variant="ghost"
                    colorScheme="gray"
                    size="sm"
                  />
                </Tooltip>
                {hasUnsavedChanges && (
                  <Tooltip label="Discard unsaved changes">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={resetToOriginal}
                      colorScheme="red"
                    >
                      Discard Changes
                    </Button>
                  </Tooltip>
                )}
              </HStack>
            </HStack>

            {/* Customer Price Adjustment */}
            <Box>
              <HStack justify="space-between" mb={2}>
                <HStack>
                  <Text fontWeight="medium">Customer Price Adjustment</Text>
                  <Tooltip label="Adjust all customer prices by a percentage. Positive = increase, Negative = decrease">
                    <Box as="span" cursor="help">
                      <Icon as={FaInfoCircle} color="gray.400" boxSize={4} />
                    </Box>
                  </Tooltip>
                </HStack>
                <HStack spacing={2}>
                  <Badge
                    colorScheme={customerWarning.color}
                    fontSize="md"
                    px={2}
                  >
                    {customerAdjustment > 0 ? '+' : ''}
                    {customerAdjustment}%
                  </Badge>
                  {customerWarning.level !== 'safe' && (
                    <Icon as={FaExclamationTriangle} color={`${customerWarning.color}.500`} />
                  )}
                </HStack>
              </HStack>
              
              {/* Quick Adjustment Buttons */}
              <HStack spacing={2} mb={3}>
                <Button
                  size="sm"
                  leftIcon={<FaMinus />}
                  onClick={() => adjustCustomerPrice(-10)}
                  variant="outline"
                  colorScheme="red"
                >
                  -10%
                </Button>
                <Button
                  size="sm"
                  leftIcon={<FaMinus />}
                  onClick={() => adjustCustomerPrice(-5)}
                  variant="outline"
                  colorScheme="orange"
                >
                  -5%
                </Button>
                <Button
                  size="sm"
                  leftIcon={<FaMinus />}
                  onClick={() => adjustCustomerPrice(-1)}
                  variant="outline"
                >
                  -1%
                </Button>
                <Button
                  size="sm"
                  leftIcon={<FaPlus />}
                  onClick={() => adjustCustomerPrice(1)}
                  variant="outline"
                >
                  +1%
                </Button>
                <Button
                  size="sm"
                  leftIcon={<FaPlus />}
                  onClick={() => adjustCustomerPrice(5)}
                  variant="outline"
                  colorScheme="green"
                >
                  +5%
                </Button>
                <Button
                  size="sm"
                  leftIcon={<FaPlus />}
                  onClick={() => adjustCustomerPrice(10)}
                  variant="outline"
                  colorScheme="teal"
                >
                  +10%
                </Button>
              </HStack>

              <Text fontSize="sm" color="text.secondary" mb={3}>
                Adjust customer pricing by percentage (-100% to +100%)
              </Text>

              {/* Slider with markers */}
              <Box px={2}>
                <Slider
                  value={customerAdjustment}
                  onChange={(val) => {
                    setCustomerAdjustment(val);
                    setHasUnsavedChanges(true);
                  }}
                  min={-100}
                  max={100}
                  step={1}
                  colorScheme={customerWarning.color}
                >
                  <SliderTrack bg="gray.200">
                    <SliderFilledTrack />
                  </SliderTrack>
                  <Tooltip
                    label={`${customerAdjustment}%`}
                    placement="top"
                    isOpen
                    hasArrow
                  >
                    <SliderThumb boxSize={6}>
                      <Box color={`${customerWarning.color}.500`} as={FaPercentage} />
                    </SliderThumb>
                  </Tooltip>
                </Slider>
                
                {/* Slider markers */}
                <HStack justify="space-between" mt={2} fontSize="xs" color="gray.500">
                  <Text>-100%</Text>
                  <Text>-50%</Text>
                  <Text fontWeight="bold">0%</Text>
                  <Text>+50%</Text>
                  <Text>+100%</Text>
                </HStack>
              </Box>

              {/* Progress indicator */}
              <Box mt={3}>
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="xs" color="gray.500">Impact Level</Text>
                  <Text fontSize="xs" fontWeight="bold" color={`${customerWarning.color}.500`}>
                    {customerWarning.level.toUpperCase()}
                  </Text>
                </HStack>
                <Progress
                  value={Math.abs(customerAdjustment)}
                  max={100}
                  size="sm"
                  colorScheme={customerWarning.color}
                  borderRadius="full"
                />
              </Box>

              {/* Direct input */}
              <Box mt={3}>
                <InputGroup size="sm">
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FaPercentage} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    type="number"
                    value={customerAdjustment}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setCustomerAdjustment(Math.max(-100, Math.min(100, val)));
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Enter percentage"
                  />
                  <InputRightElement width="4rem">
                    <Text fontSize="xs" color="gray.500">%</Text>
                  </InputRightElement>
                </InputGroup>
              </Box>
            </Box>

            <Divider />

            {/* Driver Rate Multiplier */}
            <Box>
              <HStack justify="space-between" mb={2}>
                <HStack>
                  <Text fontWeight="medium">Driver Rate Multiplier</Text>
                  <Tooltip label="Multiply driver earnings by this factor. 1.0x = no change, 2.0x = double earnings">
                    <Box as="span" cursor="help">
                      <Icon as={FaInfoCircle} color="gray.400" boxSize={4} />
                    </Box>
                  </Tooltip>
                </HStack>
                <HStack spacing={2}>
                  <Badge colorScheme={driverWarning.color} fontSize="md" px={2}>
                    {driverMultiplier.toFixed(1)}x
                  </Badge>
                  {driverWarning.level !== 'safe' && (
                    <Icon as={FaExclamationTriangle} color={`${driverWarning.color}.500`} />
                  )}
                </HStack>
              </HStack>

              {/* Quick Adjustment Buttons */}
              <HStack spacing={2} mb={3}>
                <Button
                  size="sm"
                  leftIcon={<FaMinus />}
                  onClick={() => adjustDriverRate(-0.1)}
                  variant="outline"
                  colorScheme="red"
                >
                  -0.1x
                </Button>
                <Button
                  size="sm"
                  leftIcon={<FaMinus />}
                  onClick={() => adjustDriverRate(-0.05)}
                  variant="outline"
                  colorScheme="orange"
                >
                  -0.05x
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setDriverMultiplier(1.0);
                    setHasUnsavedChanges(true);
                  }}
                  variant="outline"
                  colorScheme="blue"
                >
                  Reset (1.0x)
                </Button>
                <Button
                  size="sm"
                  leftIcon={<FaPlus />}
                  onClick={() => adjustDriverRate(0.05)}
                  variant="outline"
                  colorScheme="green"
                >
                  +0.05x
                </Button>
                <Button
                  size="sm"
                  leftIcon={<FaPlus />}
                  onClick={() => adjustDriverRate(0.1)}
                  variant="outline"
                  colorScheme="teal"
                >
                  +0.1x
                </Button>
              </HStack>

              <Text fontSize="sm" color="text.secondary" mb={3}>
                Multiply driver earnings (0.5x to 2.0x)
              </Text>

              {/* Slider with markers */}
              <Box px={2}>
                <Slider
                  value={driverMultiplier}
                  onChange={(val) => {
                    setDriverMultiplier(parseFloat(val.toFixed(1)));
                    setHasUnsavedChanges(true);
                  }}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  colorScheme={driverWarning.color}
                >
                  <SliderTrack bg="gray.200">
                    <SliderFilledTrack />
                  </SliderTrack>
                  <Tooltip
                    label={`${driverMultiplier.toFixed(1)}x`}
                    placement="top"
                    isOpen
                    hasArrow
                  >
                    <SliderThumb boxSize={6}>
                      <Box color={`${driverWarning.color}.500`} fontSize="xs" fontWeight="bold">
                        x
                      </Box>
                    </SliderThumb>
                  </Tooltip>
                </Slider>

                {/* Slider markers */}
                <HStack justify="space-between" mt={2} fontSize="xs" color="gray.500">
                  <Text>0.5x</Text>
                  <Text>0.75x</Text>
                  <Text fontWeight="bold">1.0x</Text>
                  <Text>1.5x</Text>
                  <Text>2.0x</Text>
                </HStack>
              </Box>

              {/* Progress indicator */}
              <Box mt={3}>
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="xs" color="gray.500">Deviation from Base</Text>
                  <Text fontSize="xs" fontWeight="bold" color={`${driverWarning.color}.500`}>
                    {driverWarning.level.toUpperCase()}
                  </Text>
                </HStack>
                <Progress
                  value={Math.abs(driverMultiplier - 1) * 100}
                  max={100}
                  size="sm"
                  colorScheme={driverWarning.color}
                  borderRadius="full"
                />
              </Box>

              {/* Direct input */}
              <Box mt={3}>
                <InputGroup size="sm">
                  <Input
                    type="number"
                    step="0.1"
                    value={driverMultiplier}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 1;
                      setDriverMultiplier(Math.max(0.5, Math.min(2.0, val)));
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Enter multiplier"
                  />
                  <InputRightElement width="4rem">
                    <Text fontSize="xs" color="gray.500">x</Text>
                  </InputRightElement>
                </InputGroup>
              </Box>
            </Box>

            <Divider />

            {/* Platform Fee Percentage */}
            <Box>
              <HStack justify="space-between" mb={2}>
                <Text fontWeight="medium">Platform Fee Percentage</Text>
                <Badge colorScheme="orange">20%</Badge>
              </HStack>
              <Text fontSize="sm" color="text.secondary" mb={3}>
                Fee deducted from driver earnings (10% to 30%)
              </Text>
              <Text fontSize="sm" color="red.500" fontWeight="medium">
                ⚠️ Currently fixed at 20% in the Advanced Pricing Engine
              </Text>
            </Box>

            {/* Daily Earnings Cap */}
            <Box>
              <HStack justify="space-between" mb={2}>
                <Text fontWeight="medium">Daily Earnings Cap</Text>
                <Badge colorScheme="purple">£500</Badge>
              </HStack>
              <Text fontSize="sm" color="text.secondary" mb={3}>
                Maximum daily earnings per driver (requires admin approval above cap)
              </Text>
              <Text fontSize="sm" color="red.500" fontWeight="medium">
                ⚠️ Currently fixed at £500 in the Advanced Pricing Engine
              </Text>
            </Box>

            {/* Active Status */}
            <Box>
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Text fontWeight="medium">Active Status</Text>
                  <Text fontSize="sm" color="text.secondary">
                    Enable or disable these pricing settings
                  </Text>
                </VStack>
                <Switch
                  isChecked={isActive}
                  onChange={e => {
                    setIsActive(e.target.checked);
                    setHasUnsavedChanges(true);
                  }}
                  colorScheme="green"
                  size="lg"
                />
              </HStack>
              {!isActive && (
                <Alert status="warning" mt={3}>
                  <AlertIcon />
                  <Text fontSize="sm">
                    Settings are inactive. Changes won't affect bookings until activated.
                  </Text>
                </Alert>
              )}
            </Box>

            <Divider />

            {/* Save Button */}
            <HStack spacing={3}>
              <Button
                onClick={saveSettings}
                isLoading={saving}
                loadingText="Saving..."
                leftIcon={<FaSave />}
                colorScheme="blue"
                size="lg"
                flex={1}
                isDisabled={!hasUnsavedChanges}
              >
                {hasUnsavedChanges ? 'Save Pricing Settings' : 'No Changes to Save'}
              </Button>
              {hasUnsavedChanges && (
                <Button
                  onClick={resetToOriginal}
                  variant="outline"
                  colorScheme="red"
                  size="lg"
                >
                  Cancel
                </Button>
              )}
            </HStack>
          </VStack>
        </Box>

        {/* Example Impact Calculation */}
        <Box
          p={6}
          bg="blue.50"
          borderRadius="lg"
          border="1px solid"
          borderColor="blue.200"
        >
          <VStack align="stretch" spacing={4}>
            <HStack>
              <Icon as={FaChartLine} color="blue.600" boxSize={5} />
              <Heading size="sm" color="blue.900">
                Example Impact on £50 Booking
              </Heading>
            </HStack>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {/* Customer Side */}
              <Box p={4} bg="white" borderRadius="md" border="1px solid" borderColor="blue.200">
                <VStack align="stretch" spacing={2}>
                  <HStack justify="space-between">
                    <Text fontSize="sm" fontWeight="medium" color="gray.600">
                      Original Price:
                    </Text>
                    <Text fontSize="sm" fontWeight="bold">
                      £{exampleImpact.originalPrice.toFixed(2)}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="sm" fontWeight="medium" color="gray.600">
                      New Price:
                    </Text>
                    <Text 
                      fontSize="lg" 
                      fontWeight="bold" 
                      color={exampleImpact.priceDiff > 0 ? 'green.600' : exampleImpact.priceDiff < 0 ? 'red.600' : 'gray.700'}
                    >
                      £{exampleImpact.newPrice.toFixed(2)}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="sm" fontWeight="medium" color="gray.600">
                      Difference:
                    </Text>
                    <Badge 
                      colorScheme={exampleImpact.priceDiff > 0 ? 'green' : exampleImpact.priceDiff < 0 ? 'red' : 'gray'}
                      fontSize="sm"
                    >
                      {exampleImpact.priceDiff >= 0 ? '+' : ''}£{exampleImpact.priceDiff.toFixed(2)}
                    </Badge>
                  </HStack>
                </VStack>
              </Box>

              {/* Driver Side */}
              <Box p={4} bg="white" borderRadius="md" border="1px solid" borderColor="blue.200">
                <VStack align="stretch" spacing={2}>
                  <HStack justify="space-between">
                    <Text fontSize="sm" fontWeight="medium" color="gray.600">
                      Base Earnings:
                    </Text>
                    <Text fontSize="sm" fontWeight="bold">
                      £{exampleImpact.originalDriver.toFixed(2)}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="sm" fontWeight="medium" color="gray.600">
                      New Earnings:
                    </Text>
                    <Text 
                      fontSize="lg" 
                      fontWeight="bold" 
                      color={exampleImpact.driverDiff > 0 ? 'green.600' : exampleImpact.driverDiff < 0 ? 'red.600' : 'gray.700'}
                    >
                      £{exampleImpact.newDriver.toFixed(2)}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="sm" fontWeight="medium" color="gray.600">
                      Difference:
                    </Text>
                    <Badge 
                      colorScheme={exampleImpact.driverDiff > 0 ? 'green' : exampleImpact.driverDiff < 0 ? 'red' : 'gray'}
                      fontSize="sm"
                    >
                      {exampleImpact.driverDiff >= 0 ? '+' : ''}£{exampleImpact.driverDiff.toFixed(2)}
                    </Badge>
                  </HStack>
                </VStack>
              </Box>
            </SimpleGrid>
          </VStack>
        </Box>

        {/* Pricing Presets */}
        {showPresets && (
          <Box
            p={6}
            bg="purple.50"
            borderRadius="lg"
            border="1px solid"
            borderColor="purple.200"
          >
            <VStack align="stretch" spacing={4}>
              <HStack justify="space-between">
                <HStack>
                  <Icon as={FaLightbulb} color="purple.600" boxSize={5} />
                  <Heading size="sm" color="purple.900">
                    Quick Presets
                  </Heading>
                </HStack>
                <IconButton
                  aria-label="Toggle presets"
                  icon={showPresets ? <FaEyeSlash /> : <FaEye />}
                  onClick={() => setShowPresets(!showPresets)}
                  size="sm"
                  variant="ghost"
                />
              </HStack>

              <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={3}>
                {pricingPresets.map((preset) => (
                  <Tooltip key={preset.id} label={preset.description} placement="top">
                    <Box
                      p={3}
                      bg={selectedPreset === preset.id ? 'white' : 'white'}
                      borderRadius="md"
                      border="2px solid"
                      borderColor={selectedPreset === preset.id ? `${preset.color}.500` : 'gray.200'}
                      cursor="pointer"
                      onClick={() => applyPreset(preset)}
                      _hover={{
                        borderColor: `${preset.color}.400`,
                        transform: 'translateY(-2px)',
                        shadow: 'md',
                      }}
                      transition="all 0.2s"
                    >
                      <VStack spacing={2}>
                        <Icon as={preset.icon} color={`${preset.color}.500`} boxSize={6} />
                        <Text fontSize="xs" fontWeight="bold" textAlign="center" noOfLines={2}>
                          {preset.name}
                        </Text>
                        <HStack spacing={1} fontSize="2xs" color="gray.600">
                          <Text>{preset.customerAdjustment > 0 ? '+' : ''}{preset.customerAdjustment}%</Text>
                          <Text>|</Text>
                          <Text>{preset.driverMultiplier}x</Text>
                        </HStack>
                      </VStack>
                    </Box>
                  </Tooltip>
                ))}
              </SimpleGrid>
            </VStack>
          </Box>
        )}

        {/* Smart Recommendations */}
        <Box
          p={6}
          bg="green.50"
          borderRadius="lg"
          border="1px solid"
          borderColor="green.200"
        >
          <VStack align="stretch" spacing={4}>
            <HStack>
              <Icon as={FaLightbulb} color="green.600" boxSize={5} />
              <Heading size="sm" color="green.900">
                Smart Recommendations
              </Heading>
            </HStack>

            <VStack align="stretch" spacing={2}>
              {smartRecommendations.map((rec, idx) => (
                <HStack key={idx} align="start" spacing={3}>
                  <Text fontSize="sm" color="green.800">
                    {rec}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </VStack>
        </Box>

        {/* Revenue & Cost Projections */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Revenue Projection */}
          <Box
            p={6}
            bg="bg.surface"
            borderRadius="lg"
            border="1px solid"
            borderColor="border.primary"
          >
            <VStack align="stretch" spacing={4}>
              <HStack>
                <Icon as={FaPoundSign} color="green.600" boxSize={5} />
                <Heading size="sm">Revenue Projection</Heading>
              </HStack>

              <VStack align="stretch" spacing={3}>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.600">Current Daily Revenue:</Text>
                  <Text fontSize="md" fontWeight="bold">£{revenueProjection.current.toFixed(2)}</Text>
                </HStack>

                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.600">Projected Daily Revenue:</Text>
                  <Text 
                    fontSize="lg" 
                    fontWeight="bold"
                    color={revenueProjection.dailyDiff >= 0 ? 'green.600' : 'red.600'}
                  >
                    £{revenueProjection.projected.toFixed(2)}
                  </Text>
                </HStack>

                <Divider />

                <HStack justify="space-between">
                  <Text fontSize="sm" fontWeight="bold" color="gray.700">Daily Change:</Text>
                  <Badge 
                    colorScheme={revenueProjection.dailyDiff >= 0 ? 'green' : 'red'}
                    fontSize="md"
                  >
                    {revenueProjection.dailyDiff >= 0 ? '+' : ''}£{revenueProjection.dailyDiff.toFixed(2)}
                  </Badge>
                </HStack>

                <HStack justify="space-between">
                  <Text fontSize="sm" fontWeight="bold" color="gray.700">Monthly Impact:</Text>
                  <Badge 
                    colorScheme={revenueProjection.monthlyDiff >= 0 ? 'green' : 'red'}
                    fontSize="md"
                  >
                    {revenueProjection.monthlyDiff >= 0 ? '+' : ''}£{revenueProjection.monthlyDiff.toFixed(2)}
                  </Badge>
                </HStack>

                <Progress
                  value={Math.abs(revenueProjection.percentageChange)}
                  max={50}
                  colorScheme={revenueProjection.percentageChange >= 0 ? 'green' : 'red'}
                  size="sm"
                  borderRadius="full"
                />
              </VStack>
            </VStack>
          </Box>

          {/* Driver Cost Projection */}
          <Box
            p={6}
            bg="bg.surface"
            borderRadius="lg"
            border="1px solid"
            borderColor="border.primary"
          >
            <VStack align="stretch" spacing={4}>
              <HStack>
                <Icon as={FaUsers} color="blue.600" boxSize={5} />
                <Heading size="sm">Driver Cost Projection</Heading>
              </HStack>

              <VStack align="stretch" spacing={3}>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.600">Current Daily Cost:</Text>
                  <Text fontSize="md" fontWeight="bold">£{driverCostProjection.current.toFixed(2)}</Text>
                </HStack>

                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.600">Projected Daily Cost:</Text>
                  <Text 
                    fontSize="lg" 
                    fontWeight="bold"
                    color={driverCostProjection.dailyDiff >= 0 ? 'orange.600' : 'green.600'}
                  >
                    £{driverCostProjection.projected.toFixed(2)}
                  </Text>
                </HStack>

                <Divider />

                <HStack justify="space-between">
                  <Text fontSize="sm" fontWeight="bold" color="gray.700">Daily Change:</Text>
                  <Badge 
                    colorScheme={driverCostProjection.dailyDiff >= 0 ? 'orange' : 'green'}
                    fontSize="md"
                  >
                    {driverCostProjection.dailyDiff >= 0 ? '+' : ''}£{driverCostProjection.dailyDiff.toFixed(2)}
                  </Badge>
                </HStack>

                <HStack justify="space-between">
                  <Text fontSize="sm" fontWeight="bold" color="gray.700">Monthly Impact:</Text>
                  <Badge 
                    colorScheme={driverCostProjection.monthlyDiff >= 0 ? 'orange' : 'green'}
                    fontSize="md"
                  >
                    {driverCostProjection.monthlyDiff >= 0 ? '+' : ''}£{driverCostProjection.monthlyDiff.toFixed(2)}
                  </Badge>
                </HStack>

                <Progress
                  value={Math.abs(driverCostProjection.percentageChange)}
                  max={50}
                  colorScheme={driverCostProjection.percentageChange >= 0 ? 'orange' : 'green'}
                  size="sm"
                  borderRadius="full"
                />
              </VStack>
            </VStack>
          </Box>
        </SimpleGrid>

        {/* Change History */}
        {showHistory && changeHistory.length > 0 && (
          <Box
            p={6}
            bg="bg.surface"
            borderRadius="lg"
            border="1px solid"
            borderColor="border.primary"
          >
            <VStack align="stretch" spacing={4}>
              <HStack justify="space-between">
                <HStack>
                  <Icon as={FaHistory} color="purple.600" boxSize={5} />
                  <Heading size="sm">Change History</Heading>
                </HStack>
                <IconButton
                  aria-label="Hide history"
                  icon={<FaEyeSlash />}
                  onClick={() => setShowHistory(false)}
                  size="sm"
                  variant="ghost"
                />
              </HStack>

              <VStack align="stretch" spacing={2} maxH="300px" overflowY="auto">
                {changeHistory.map((entry, idx) => (
                  <Box
                    key={idx}
                    p={3}
                    bg="gray.50"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="gray.200"
                  >
                    <HStack justify="space-between" mb={2}>
                      <HStack>
                        <Icon as={FaClock} color="gray.500" boxSize={3} />
                        <Text fontSize="xs" color="gray.600">
                          {entry.timestamp.toLocaleString()}
                        </Text>
                      </HStack>
                      <Badge fontSize="xs">{entry.user}</Badge>
                    </HStack>
                    <HStack spacing={4}>
                      <Text fontSize="sm">
                        Customer: <strong>{entry.customerAdjustment > 0 ? '+' : ''}{entry.customerAdjustment}%</strong>
                      </Text>
                      <Text fontSize="sm">
                        Driver: <strong>{entry.driverMultiplier}x</strong>
                      </Text>
                    </HStack>
                    {entry.action && (
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        {entry.action}
                      </Text>
                    )}
                  </Box>
                ))}
              </VStack>
            </VStack>
          </Box>
        )}

        {/* Advanced Options */}
        {showAdvanced && (
          <Box
            p={6}
            bg="bg.surface"
            borderRadius="lg"
            border="1px solid"
            borderColor="border.primary"
          >
            <VStack align="stretch" spacing={4}>
              <HStack justify="space-between">
                <Heading size="sm">Advanced Options</Heading>
                <IconButton
                  aria-label="Hide advanced"
                  icon={<FaEyeSlash />}
                  onClick={() => setShowAdvanced(false)}
                  size="sm"
                  variant="ghost"
                />
              </HStack>

              <VStack align="stretch" spacing={4}>
                {/* Custom Note */}
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    Change Note (Optional)
                  </Text>
                  <Input
                    placeholder="e.g., Peak season adjustment for Christmas"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    size="sm"
                  />
                </Box>

                {/* Simulation Mode */}
                <HStack justify="space-between">
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" fontWeight="medium">
                      Simulation Mode
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Test settings without applying them
                    </Text>
                  </VStack>
                  <Switch
                    isChecked={simulationMode}
                    onChange={(e) => setSimulationMode(e.target.checked)}
                    colorScheme="purple"
                  />
                </HStack>

                {simulationMode && (
                  <Alert status="info" size="sm">
                    <AlertIcon />
                    <Text fontSize="xs">
                      Simulation mode active. Changes won't be saved.
                    </Text>
                  </Alert>
                )}
              </VStack>
            </VStack>
          </Box>
        )}

        {/* Action Buttons */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
          <Button
            leftIcon={<FaHistory />}
            onClick={() => setShowHistory(!showHistory)}
            variant="outline"
            size="sm"
          >
            {showHistory ? 'Hide' : 'Show'} History
          </Button>

          <Button
            leftIcon={<FaCopy />}
            onClick={copySettings}
            variant="outline"
            size="sm"
          >
            Copy Settings
          </Button>

          <Button
            leftIcon={<FaDownload />}
            onClick={exportSettings}
            variant="outline"
            size="sm"
          >
            Export JSON
          </Button>

          <Button
            leftIcon={<FaCalculator />}
            onClick={() => setShowAdvanced(!showAdvanced)}
            variant="outline"
            size="sm"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </Button>
        </SimpleGrid>

        {/* Information */}
        <Alert status="info">
          <AlertIcon />
          <Box>
            <AlertTitle>Pricing Impact</AlertTitle>
            <AlertDescription>
              Changes to pricing settings will affect all new bookings. Customer
              prices and driver earnings will be adjusted according to these
              settings.
            </AlertDescription>
          </Box>
        </Alert>
      </VStack>
    </Box>
  );
}
