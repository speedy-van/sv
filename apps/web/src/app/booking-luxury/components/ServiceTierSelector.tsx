'use client';

import React from 'react';
import {
  Box,
  SimpleGrid,
  VStack,
  HStack,
  Heading,
  Text,
  Card,
  CardBody,
  Badge,
  Icon,
  useColorModeValue,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import { FaTruck, FaStar, FaCrown, FaCheck } from 'react-icons/fa';

export type ServiceTier = 'economy' | 'standard' | 'premium';

interface ServiceTierInfo {
  tier: ServiceTier;
  name: string;
  nameAr: string;
  icon: any;
  color: string;
  basePrice: string;
  pricePerMile: string;
  features: string[];
  featuresAr: string[];
  badge?: string;
  badgeAr?: string;
}

const TIER_INFO: ServiceTierInfo[] = [
  {
    tier: 'economy',
    name: 'Economy',
    nameAr: 'اقتصادي',
    icon: FaTruck,
    color: 'blue',
    basePrice: '£15',
    pricePerMile: '£0.40/mile',
    badge: 'Most Popular',
    badgeAr: 'الأكثر شيوعاً',
    features: [
      'Base: £15',
      '£0.40 per mile',
      'Standard vehicle',
      'Basic insurance',
      'Single driver'
    ],
    featuresAr: [
      'سعر أساسي: £15',
      '£0.40 للميل',
      'مركبة قياسية',
      'تأمين أساسي',
      'سائق واحد'
    ]
  },
  {
    tier: 'standard',
    name: 'Standard',
    nameAr: 'قياسي',
    icon: FaStar,
    color: 'purple',
    basePrice: '£22',
    pricePerMile: '£0.65/mile',
    features: [
      'Base: £22',
      '£0.65 per mile',
      'Better vehicle',
      'Enhanced insurance',
      'Experienced driver'
    ],
    featuresAr: [
      'سعر أساسي: £22',
      '£0.65 للميل',
      'مركبة أفضل',
      'تأمين معزز',
      'سائق ذو خبرة'
    ]
  },
  {
    tier: 'premium',
    name: 'Premium',
    nameAr: 'فاخر',
    icon: FaCrown,
    color: 'gold',
    basePrice: '£45',
    pricePerMile: '£1.20/mile',
    features: [
      'Base: £45',
      '£1.20 per mile',
      'Luxury vehicle',
      'Full insurance',
      'Professional crew'
    ],
    featuresAr: [
      'سعر أساسي: £45',
      '£1.20 للميل',
      'مركبة فاخرة',
      'تأمين شامل',
      'طاقم محترف'
    ]
  }
];

interface ServiceTierSelectorProps {
  selectedTier: ServiceTier;
  onSelectTier: (tier: ServiceTier) => void;
  disabled?: boolean;
}

export default function ServiceTierSelector({ 
  selectedTier, 
  onSelectTier,
  disabled = false 
}: ServiceTierSelectorProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const selectedBg = useColorModeValue('blue.50', 'blue.900');
  const selectedBorder = useColorModeValue('blue.500', 'blue.300');

  return (
    <Box>
      <VStack spacing={4} align="stretch" mb={6}>
        <Heading size="md" color="gray.700">
          اختر مستوى الخدمة
        </Heading>
        <Text color="gray.600" fontSize="sm">
          السعر النهائي يعتمد على المسافة والعناصر المحددة
        </Text>
      </VStack>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        {TIER_INFO.map((tier) => {
          const isSelected = selectedTier === tier.tier;
          
          return (
            <Card
              key={tier.tier}
              bg={isSelected ? selectedBg : bgColor}
              borderWidth={2}
              borderColor={isSelected ? selectedBorder : borderColor}
              cursor={disabled ? 'not-allowed' : 'pointer'}
              onClick={() => !disabled && onSelectTier(tier.tier)}
              transition="all 0.2s"
              _hover={disabled ? {} : {
                transform: 'translateY(-4px)',
                shadow: 'xl',
                borderColor: tier.color === 'gold' ? 'yellow.400' : `${tier.color}.400`
              }}
              opacity={disabled ? 0.6 : 1}
              position="relative"
              overflow="hidden"
              h="full"
            >
              {/* Badge */}
              {tier.badge && (
                <Badge
                  position="absolute"
                  top={2}
                  right={2}
                  colorScheme="green"
                  fontSize="xs"
                  px={2}
                  py={1}
                  borderRadius="full"
                  zIndex={1}
                >
                  {tier.badgeAr}
                </Badge>
              )}

              <CardBody>
                <VStack spacing={4} align="stretch" h="full">
                  {/* Header */}
                  <HStack justify="space-between">
                    <HStack spacing={3}>
                      <Icon
                        as={tier.icon}
                        w={8}
                        h={8}
                        color={tier.color === 'gold' ? 'yellow.400' : `${tier.color}.500`}
                      />
                      <VStack align="start" spacing={0}>
                        <Heading size="sm" color="gray.800">
                          {tier.nameAr}
                        </Heading>
                        <Text fontSize="xs" color="gray.500">
                          {tier.name}
                        </Text>
                      </VStack>
                    </HStack>
                    {isSelected && (
                      <Icon as={FaCheck} color="green.500" w={5} h={5} />
                    )}
                  </HStack>

                  {/* Pricing */}
                  <Box textAlign="center" py={2}>
                    <Text fontSize="xs" color="gray.500" mb={1}>
                      من
                    </Text>
                    <Text 
                      fontSize="3xl" 
                      fontWeight="bold" 
                      color={tier.color === 'gold' ? 'yellow.600' : `${tier.color}.600`}
                    >
                      {tier.basePrice}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      + {tier.pricePerMile}
                    </Text>
                  </Box>

                  {/* Features */}
                  <List spacing={2} flex={1}>
                    {tier.featuresAr.map((feature, idx) => (
                      <ListItem key={idx} fontSize="sm" color="gray.600">
                        <HStack spacing={2} align="start">
                          <ListIcon 
                            as={FaCheck} 
                            color={tier.color === 'gold' ? 'yellow.500' : `${tier.color}.500`}
                            mt={0.5}
                          />
                          <Text>{feature}</Text>
                        </HStack>
                      </ListItem>
                    ))}
                  </List>
                </VStack>
              </CardBody>
            </Card>
          );
        })}
      </SimpleGrid>

      {/* Info Box */}
      <Box mt={6} p={4} bg={useColorModeValue('blue.50', 'blue.900')} borderRadius="lg">
        <VStack spacing={2} align="stretch">
          <HStack spacing={2}>
            <Icon as={FaCheck} color="blue.500" w={4} h={4} />
            <Text fontSize="sm" fontWeight="semibold" color="gray.700">
              كيف يتم حساب السعر؟
            </Text>
          </HStack>
          <Text fontSize="xs" color="gray.600">
            • السعر الأساسي + (المسافة بالأميال × السعر للميل) + تكلفة العناصر
          </Text>
          <Text fontSize="xs" color="gray.600">
            • مثال: Economy مع 10 أميال = £15 + (10 × £0.40) + تكلفة العناصر = ~£27
          </Text>
          <Text fontSize="xs" color="gray.600">
            • جميع الأسعار تشمل VAT والتأمين الأساسي
          </Text>
        </VStack>
      </Box>
    </Box>
  );
}
