'use client';

import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  List,
  ListItem,
  ListIcon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Divider,
  Tooltip,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaStar,
  FaTruck,
  FaTools,
  FaCertificate,
  FaHardHat,
} from 'react-icons/fa';
import {
  EquipmentType,
  EQUIPMENT_DISPLAY_NAMES,
  formatCurrency,
  type RequiredEquipmentResult,
  type SpecializedEquipment,
} from '@/types/specialized-logistics';

interface EquipmentRequirementsDisplayProps {
  equipmentResult: RequiredEquipmentResult;
  category?: string;
  showCost?: boolean;
  showDetails?: boolean;
}

const EQUIPMENT_ICONS: Record<string, any> = {
  PIANO_DOLLY: '🎹',
  PIANO_BOARD: '📋',
  ART_CRATE: '🖼️',
  CLIMATE_CONTROLLED: '❄️',
  HYDRAULIC_LIFT: '🏗️',
  PROTECTIVE_BLANKETS: '🛡️',
  NON_MARKING_STRAPS: '🔗',
  SPECIALIZED_VEHICLE: '🚛',
  GLOVES_AND_PPE: '🧤',
  CUSTOM_PACKAGING: '📦',
};

const EQUIPMENT_DESCRIPTIONS: Record<string, string> = {
  PIANO_DOLLY: 'Heavy-duty dolly rated for 500kg+ pianos with rubberized contact points',
  PIANO_BOARD: 'Padded board for safe piano transport and stairway navigation',
  ART_CRATE: 'Custom-built wooden crate with foam inserts for fine art protection',
  CLIMATE_CONTROLLED: 'Temperature and humidity controlled environment (18-22°C, 45-55% RH)',
  HYDRAULIC_LIFT: 'Professional hydraulic tailgate lift for heavy items',
  PROTECTIVE_BLANKETS: 'Premium quilted blankets to prevent scratches and impacts',
  NON_MARKING_STRAPS: 'Soft, non-abrasive straps that won\'t damage delicate surfaces',
  SPECIALIZED_VEHICLE: 'Air-ride suspension vehicle with secure tie-down points',
  GLOVES_AND_PPE: 'Cotton gloves and protective equipment for handlers',
  CUSTOM_PACKAGING: 'Bespoke packaging materials tailored to item dimensions',
};

const REQUIRED_CERTIFICATIONS: Record<string, string[]> = {
  PIANO_DOLLY: ['Piano Moving Certification', 'Heavy Lifting Safety'],
  PIANO_BOARD: ['Piano Moving Certification'],
  ART_CRATE: ['Fine Art Handling', 'Crating Specialist'],
  CLIMATE_CONTROLLED: ['Temperature Monitoring Training'],
  HYDRAULIC_LIFT: ['Hydraulic Equipment Operation', 'Health & Safety Level 2'],
  PROTECTIVE_BLANKETS: [],
  NON_MARKING_STRAPS: ['Secure Load Training'],
  SPECIALIZED_VEHICLE: ['Category C1 Driving License', 'Air Suspension Training'],
  GLOVES_AND_PPE: [],
  CUSTOM_PACKAGING: ['Packaging Specialist Certification'],
};

export default function EquipmentRequirementsDisplay({
  equipmentResult,
  category,
  showCost = true,
  showDetails = true,
}: EquipmentRequirementsDisplayProps) {
  const { required, recommended, warnings, estimatedCost } = equipmentResult;

  const renderEquipmentItem = (equipmentType: string, isRequired: boolean) => {
    const displayName = EQUIPMENT_DISPLAY_NAMES[equipmentType as EquipmentType] || equipmentType;
    const icon = EQUIPMENT_ICONS[equipmentType] || '📦';
    const description = EQUIPMENT_DESCRIPTIONS[equipmentType];
    const certifications = REQUIRED_CERTIFICATIONS[equipmentType] || [];

    return (
      <AccordionItem key={equipmentType} border="none">
        <AccordionButton
          _expanded={{ bg: isRequired ? 'green.50' : 'blue.50' }}
          borderRadius="md"
          mb={2}
        >
          <HStack flex="1" spacing={3} align="center">
            <Text fontSize="2xl">{icon}</Text>
            <VStack align="start" spacing={0} flex="1">
              <HStack>
                <Text fontWeight="semibold" fontSize="sm">
                  {displayName}
                </Text>
                {isRequired && (
                  <Badge colorScheme="green" fontSize="xs">
                    Required
                  </Badge>
                )}
              </HStack>
              {showDetails && description && (
                <Text fontSize="xs" color="gray.600" noOfLines={1}>
                  {description}
                </Text>
              )}
            </VStack>
            {isRequired ? (
              <Icon as={FaCheckCircle} color="green.500" boxSize={4} />
            ) : (
              <Icon as={FaStar} color="blue.500" boxSize={4} />
            )}
          </HStack>
          <AccordionIcon />
        </AccordionButton>

        {showDetails && (
          <AccordionPanel pb={4} px={4} bg="gray.50" borderRadius="md">
            <VStack align="stretch" spacing={3}>
              <Box>
                <Text fontSize="xs" fontWeight="bold" mb={1} color="gray.700">
                  Description:
                </Text>
                <Text fontSize="xs" color="gray.600">
                  {description}
                </Text>
              </Box>

              {certifications.length > 0 && (
                <Box>
                  <HStack spacing={2} mb={2}>
                    <Icon as={FaCertificate} color="orange.500" boxSize={3} />
                    <Text fontSize="xs" fontWeight="bold" color="gray.700">
                      Required Certifications:
                    </Text>
                  </HStack>
                  <List spacing={1} fontSize="xs">
                    {certifications.map((cert, idx) => (
                      <ListItem key={idx}>
                        <ListIcon as={FaCheckCircle} color="orange.400" boxSize={2} />
                        {cert}
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              <Box>
                <Text fontSize="xs" color="gray.500" fontStyle="italic">
                  {isRequired
                    ? '✓ This equipment is mandatory for your move'
                    : '💡 Recommended for optimal safety and protection'}
                </Text>
              </Box>
            </VStack>
          </AccordionPanel>
        )}
      </AccordionItem>
    );
  };

  return (
    <VStack spacing={5} align="stretch" w="full">
      {/* Header */}
      <Box>
        <HStack spacing={2} mb={2}>
          <Icon as={FaTools} color="blue.600" boxSize={5} />
          <Text fontSize="lg" fontWeight="bold">
            Specialized Equipment Requirements
          </Text>
        </HStack>
        <Text fontSize="sm" color="gray.600">
          Our professional team will use the following specialized equipment for your move
        </Text>
      </Box>

      {/* Cost Summary */}
      {showCost && estimatedCost > 0 && (
        <Box bg="blue.50" p={4} borderRadius="md" borderWidth={1} borderColor="blue.200">
          <HStack justify="space-between">
            <VStack align="start" spacing={0}>
              <Text fontSize="sm" fontWeight="bold" color="blue.900">
                Equipment Cost
              </Text>
              <Text fontSize="xs" color="blue.700">
                Included in service price
              </Text>
            </VStack>
            <Text fontSize="2xl" fontWeight="bold" color="blue.600">
              {formatCurrency(estimatedCost)}
            </Text>
          </HStack>
        </Box>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert status="warning" borderRadius="md" variant="left-accent">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle fontSize="sm">Important Requirements</AlertTitle>
            <AlertDescription>
              <List spacing={2} mt={2} fontSize="sm">
                {warnings.map((warning, idx) => (
                  <ListItem key={idx}>
                    <ListIcon as={FaExclamationTriangle} color="orange.500" />
                    {warning}
                  </ListItem>
                ))}
              </List>
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Required Equipment Section */}
      {required.length > 0 && (
        <Box>
          <HStack spacing={2} mb={3}>
            <Icon as={FaCheckCircle} color="green.500" boxSize={4} />
            <Text fontSize="md" fontWeight="bold" color="green.700">
              Mandatory Equipment
            </Text>
            <Badge colorScheme="green" fontSize="xs">
              {required.length} {required.length === 1 ? 'Item' : 'Items'}
            </Badge>
          </HStack>

          <Accordion allowMultiple>
            {required.map((eq) => renderEquipmentItem(eq, true))}
          </Accordion>
        </Box>
      )}

      {/* Recommended Equipment Section */}
      {recommended.length > 0 && (
        <>
          <Divider />
          <Box>
            <HStack spacing={2} mb={3}>
              <Icon as={FaStar} color="blue.500" boxSize={4} />
              <Text fontSize="md" fontWeight="bold" color="blue.700">
                Recommended Equipment
              </Text>
              <Badge colorScheme="blue" fontSize="xs">
                Optional
              </Badge>
            </HStack>

            <Alert status="info" borderRadius="md" mb={3} size="sm">
              <AlertIcon />
              <Text fontSize="xs">
                These items provide additional protection and are highly recommended for this type of move
              </Text>
            </Alert>

            <Accordion allowMultiple>
              {recommended.map((eq) => renderEquipmentItem(eq, false))}
            </Accordion>
          </Box>
        </>
      )}

      {/* Driver Requirements Summary */}
      <Box bg="gray.50" p={4} borderRadius="md">
        <HStack spacing={2} mb={3}>
          <Icon as={FaHardHat} color="purple.500" boxSize={4} />
          <Text fontSize="sm" fontWeight="bold">
            Driver Requirements
          </Text>
        </HStack>

        <Grid templateColumns="repeat(2, 1fr)" gap={3} fontSize="xs">
          <GridItem>
            <HStack spacing={2}>
              <Icon as={FaCertificate} color="orange.400" boxSize={3} />
              <Text>Certified specialist</Text>
            </HStack>
          </GridItem>
          <GridItem>
            <HStack spacing={2}>
              <Icon as={FaTruck} color="blue.400" boxSize={3} />
              <Text>Equipped vehicle</Text>
            </HStack>
          </GridItem>
          <GridItem>
            <HStack spacing={2}>
              <Icon as={FaTools} color="green.400" boxSize={3} />
              <Text>All listed equipment</Text>
            </HStack>
          </GridItem>
          <GridItem>
            <HStack spacing={2}>
              <Icon as={FaCheckCircle} color="purple.400" boxSize={3} />
              <Text>Verified experience</Text>
            </HStack>
          </GridItem>
        </Grid>
      </Box>

      {/* Info Footer */}
      <Box p={3} bg="blue.50" borderRadius="md" borderLeftWidth={4} borderLeftColor="blue.400">
        <HStack spacing={2} align="start">
          <Icon as={FaInfoCircle} color="blue.500" boxSize={4} mt={0.5} />
          <Text fontSize="xs" color="gray.700">
            <strong>Quality Assurance:</strong> All equipment is inspected before each use and meets 
            industry safety standards. Your driver will verify all required items before departure.
          </Text>
        </HStack>
      </Box>
    </VStack>
  );
}
