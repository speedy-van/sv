'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Radio,
  RadioGroup,
  Stack,
  Badge,
  Icon,
  List,
  ListItem,
  ListIcon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Divider,
  Input,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  Tooltip,
  useToast,
} from '@chakra-ui/react';
import { FaCheckCircle, FaShieldAlt, FaStar, FaCrown, FaInfoCircle } from 'react-icons/fa';
import {
  InsuranceTier,
  INSURANCE_TIER_DISPLAY,
  SpecializedItemCategory,
  formatCurrency,
  poundsToPence,
  penceToPounds,
  getRecommendedInsuranceTier,
  type InsuranceQuote,
  type InsuranceQuoteBreakdown,
} from '@/types/specialized-logistics';

interface InsuranceTierSelectorProps {
  category: SpecializedItemCategory;
  declaredValue: number; // in pence
  technicalSpecs: Record<string, any>;
  onSelect: (tier: InsuranceTier, quote: InsuranceQuote) => void;
  selectedTier?: InsuranceTier;
}

const TIER_COLORS = {
  STANDARD: 'blue',
  PREMIUM: 'purple',
  PLATINUM: 'orange',
  BESPOKE: 'pink',
};

const TIER_ICONS = {
  STANDARD: FaShieldAlt,
  PREMIUM: FaStar,
  PLATINUM: FaCrown,
  BESPOKE: FaCrown,
};

export default function InsuranceTierSelector({
  category,
  declaredValue,
  technicalSpecs,
  onSelect,
  selectedTier,
}: InsuranceTierSelectorProps) {
  const [selected, setSelected] = useState<InsuranceTier>(selectedTier || InsuranceTier.STANDARD);
  const [quotes, setQuotes] = useState<Record<InsuranceTier, InsuranceQuote | null>>({
    [InsuranceTier.STANDARD]: null,
    [InsuranceTier.PREMIUM]: null,
    [InsuranceTier.PLATINUM]: null,
    [InsuranceTier.BESPOKE]: null,
  });
  const [customValue, setCustomValue] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const recommendedTier = getRecommendedInsuranceTier(declaredValue);
  const declaredValuePounds = penceToPounds(declaredValue);

  // Fetch quotes for all tiers
  useEffect(() => {
    if (declaredValue > 0) {
      fetchQuotes();
    }
  }, [declaredValue, category, technicalSpecs]);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const tiers = [InsuranceTier.STANDARD, InsuranceTier.PREMIUM, InsuranceTier.PLATINUM];
      
      const quotePromises = tiers.map(async (tier) => {
        const response = await fetch('/api/insurance/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category,
            declaredValue,
            insuranceTier: tier,
            technicalSpecs,
          }),
        });

        const data = await response.json();
        return { tier, quote: data.success ? data.quote : null };
      });

      const results = await Promise.all(quotePromises);
      
      const newQuotes = { ...quotes };
      results.forEach(({ tier, quote }) => {
        if (quote) {
          newQuotes[tier] = quote;
        }
      });

      setQuotes(newQuotes);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      toast({
        title: 'Error',
        description: 'Failed to calculate insurance quotes',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBespokeQuote = async () => {
    if (!customValue || parseFloat(customValue) <= 0) {
      toast({
        title: 'Invalid Value',
        description: 'Please enter a valid coverage amount',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const customValuePence = poundsToPence(parseFloat(customValue));
      
      const response = await fetch('/api/insurance/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          declaredValue: customValuePence,
          insuranceTier: InsuranceTier.BESPOKE,
          technicalSpecs,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setQuotes(prev => ({
          ...prev,
          [InsuranceTier.BESPOKE]: data.quote,
        }));
        setSelected(InsuranceTier.BESPOKE);
        onSelect(InsuranceTier.BESPOKE, data.quote);
        toast({
          title: 'Quote Generated',
          description: 'Your custom insurance quote is ready',
          status: 'success',
          duration: 3000,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate bespoke quote',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTierSelect = (tier: InsuranceTier) => {
    setSelected(tier);
    const quote = quotes[tier];
    if (quote) {
      onSelect(tier, quote);
    }
  };

  const renderTierCard = (tier: InsuranceTier) => {
    const info = INSURANCE_TIER_DISPLAY[tier];
    const quote = quotes[tier];
    const isRecommended = tier === recommendedTier;
    const isSelected = selected === tier;
    const colorScheme = TIER_COLORS[tier];
    const IconComponent = TIER_ICONS[tier];

    // Skip bespoke tier in standard rendering
    if (tier === InsuranceTier.BESPOKE) {
      return null;
    }

    return (
      <Box
        key={tier}
        position="relative"
        borderWidth={isSelected ? 3 : 1}
        borderColor={isSelected ? `${colorScheme}.500` : 'gray.200'}
        borderRadius="lg"
        p={5}
        cursor="pointer"
        onClick={() => handleTierSelect(tier)}
        transition="all 0.2s"
        _hover={{
          borderColor: `${colorScheme}.400`,
          shadow: 'md',
          transform: 'translateY(-2px)',
        }}
        bg={isSelected ? `${colorScheme}.50` : 'white'}
      >
        {isRecommended && (
          <Badge
            position="absolute"
            top={-3}
            right={4}
            colorScheme="green"
            fontSize="sm"
            px={3}
            py={1}
            borderRadius="full"
          >
            ✨ Recommended
          </Badge>
        )}

        <VStack align="start" spacing={3}>
          <HStack spacing={3} w="full" justify="space-between">
            <HStack spacing={2}>
              <Icon as={IconComponent} color={`${colorScheme}.500`} boxSize={6} />
              <Text fontSize="xl" fontWeight="bold" color={`${colorScheme}.700`}>
                {tier}
              </Text>
            </HStack>
            
            {quote && (
              <VStack align="end" spacing={0}>
                <Text fontSize="2xl" fontWeight="bold" color={`${colorScheme}.600`}>
                  {formatCurrency(quote.finalPremium)}
                </Text>
                <Text fontSize="xs" color="gray.500">Insurance Premium</Text>
              </VStack>
            )}
          </HStack>

          <Text fontSize="sm" color="gray.600">
            {info.description}
          </Text>

          <Box w="full" py={2}>
            <HStack justify="space-between">
              <Text fontSize="sm" fontWeight="semibold">Coverage Limit:</Text>
              <Badge colorScheme={colorScheme} fontSize="md">
                {info.maxCoverage}
              </Badge>
            </HStack>
          </Box>

          <List spacing={2} w="full">
            {info.features.map((feature, idx) => (
              <ListItem key={idx} fontSize="sm">
                <ListIcon as={FaCheckCircle} color={`${colorScheme}.500`} />
                {feature}
              </ListItem>
            ))}
          </List>

          {quote && quote.breakdown && (
            <Box w="full" mt={2} p={3} bg="gray.50" borderRadius="md">
              <Text fontSize="xs" fontWeight="bold" mb={2}>Premium Breakdown:</Text>
              <VStack align="stretch" spacing={1} fontSize="xs">
                <HStack justify="space-between">
                  <Text>Base Premium:</Text>
                  <Text fontWeight="medium">{formatCurrency(quote.breakdown.basePremium)}</Text>
                </HStack>
                
                {quote.breakdown.riskModifiers > 0 && (
                  <HStack justify="space-between" color="orange.600">
                    <Text>Risk Modifiers:</Text>
                    <Text>+{formatCurrency(quote.breakdown.riskModifiers)}</Text>
                  </HStack>
                )}
                
                {quote.breakdown.discountsApplied > 0 && (
                  <HStack justify="space-between" color="green.600">
                    <Text>Discounts:</Text>
                    <Text>-{formatCurrency(quote.breakdown.discountsApplied)}</Text>
                  </HStack>
                )}
                
                <Divider />
                
                <HStack justify="space-between" fontWeight="bold">
                  <Text>Total:</Text>
                  <Text color={`${colorScheme}.600`}>{formatCurrency(quote.finalPremium)}</Text>
                </HStack>
              </VStack>
            </Box>
          )}

          {loading && !quote && (
            <Box w="full" textAlign="center" py={4}>
              <Spinner size="sm" />
              <Text fontSize="xs" mt={2}>Calculating...</Text>
            </Box>
          )}
        </VStack>
      </Box>
    );
  };

  const renderBespokeOption = () => {
    const quote = quotes[InsuranceTier.BESPOKE];
    const isSelected = selected === InsuranceTier.BESPOKE;

    return (
      <Box
        borderWidth={isSelected ? 3 : 1}
        borderColor={isSelected ? 'pink.500' : 'gray.200'}
        borderRadius="lg"
        p={5}
        bg={isSelected ? 'pink.50' : 'white'}
      >
        <VStack align="start" spacing={4}>
          <HStack spacing={3} w="full">
            <Icon as={FaCrown} color="pink.500" boxSize={6} />
            <Text fontSize="xl" fontWeight="bold" color="pink.700">
              BESPOKE COVERAGE
            </Text>
          </HStack>

          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertDescription fontSize="sm">
                For items valued over £100,000 or requiring custom coverage, 
                enter your desired coverage amount below.
              </AlertDescription>
            </Box>
          </Alert>

          <FormControl>
            <FormLabel fontSize="sm">Custom Coverage Amount (£)</FormLabel>
            <HStack>
              <NumberInput
                value={customValue}
                onChange={(value) => setCustomValue(value)}
                min={100000}
                precision={2}
              >
                <NumberInputField placeholder="e.g., 250000" />
              </NumberInput>
              <Button
                colorScheme="pink"
                onClick={handleBespokeQuote}
                isLoading={loading}
                size="md"
              >
                Get Quote
              </Button>
            </HStack>
          </FormControl>

          {quote && (
            <Box w="full" mt={3} p={4} bg="pink.50" borderRadius="md" borderWidth={1} borderColor="pink.200">
              <VStack align="stretch" spacing={3}>
                <HStack justify="space-between">
                  <Text fontWeight="bold">Custom Coverage:</Text>
                  <Text fontSize="lg" fontWeight="bold" color="pink.600">
                    £{customValue}
                  </Text>
                </HStack>
                
                <HStack justify="space-between">
                  <Text fontWeight="bold">Premium:</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="pink.700">
                    {formatCurrency(quote.finalPremium)}
                  </Text>
                </HStack>

                <List spacing={1} fontSize="sm">
                  <ListItem>
                    <ListIcon as={FaCheckCircle} color="pink.500" />
                    Dedicated claims handler
                  </ListItem>
                  <ListItem>
                    <ListIcon as={FaCheckCircle} color="pink.500" />
                    24/7 white-glove support
                  </ListItem>
                  <ListItem>
                    <ListIcon as={FaCheckCircle} color="pink.500" />
                    Bespoke risk assessment
                  </ListItem>
                  <ListItem>
                    <ListIcon as={FaCheckCircle} color="pink.500" />
                    Priority processing
                  </ListItem>
                </List>

                <Button
                  colorScheme="pink"
                  size="sm"
                  onClick={() => handleTierSelect(InsuranceTier.BESPOKE)}
                  isDisabled={isSelected}
                >
                  {isSelected ? 'Selected ✓' : 'Select This Coverage'}
                </Button>
              </VStack>
            </Box>
          )}
        </VStack>
      </Box>
    );
  };

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Text fontSize="xl" fontWeight="bold" mb={2}>
          Select Insurance Coverage
        </Text>
        <Text fontSize="sm" color="gray.600">
          Your item is valued at <strong>{formatCurrency(declaredValue)}</strong>. 
          Choose the insurance tier that best protects your valuable item.
        </Text>
      </Box>

      {declaredValuePounds > 100000 && (
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>High-Value Item</AlertTitle>
            <AlertDescription fontSize="sm">
              For items valued over £100,000, we recommend bespoke coverage for comprehensive protection.
            </AlertDescription>
          </Box>
        </Alert>
      )}

      <Stack spacing={4}>
        {[InsuranceTier.STANDARD, InsuranceTier.PREMIUM, InsuranceTier.PLATINUM].map(
          (tier) => renderTierCard(tier)
        )}
      </Stack>

      <Divider />

      {renderBespokeOption()}

      <Box p={4} bg="blue.50" borderRadius="md">
        <HStack spacing={2} mb={2}>
          <Icon as={FaInfoCircle} color="blue.500" />
          <Text fontSize="sm" fontWeight="bold">Insurance Coverage Details</Text>
        </HStack>
        <List spacing={1} fontSize="xs" color="gray.700">
          <ListItem>✓ Coverage includes damage, loss, and theft during transport</ListItem>
          <ListItem>✓ 24-hour claims processing for all tiers</ListItem>
          <ListItem>✓ No excess/deductible on Premium tier and above</ListItem>
          <ListItem>✓ Specialist restoration services included in Platinum</ListItem>
        </List>
      </Box>
    </VStack>
  );
}
