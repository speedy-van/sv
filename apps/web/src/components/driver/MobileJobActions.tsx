import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Text,
  Card,
  CardBody,
  IconButton,
  useColorModeValue,
  Collapse,
  ScaleFade,
  Flex,
  Badge,
  useToast,
  Tooltip,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import {
  FaPhone,
  FaMap,
  FaDirections,
  FaChevronUp,
  FaChevronDown,
  FaLocationArrow,
  FaCopy,
  FaShare,
  FaExpandArrowsAlt,
  FaCompress,
} from 'react-icons/fa';

interface MobileJobActionsProps {
  jobDetails: {
    id: string;
    reference: string;
    customer: string;
    customerPhone: string;
    from: string;
    to: string;
    status: string;
    estimatedEarnings?: number;
  };
  onCallCustomer: () => void;
  onOpenMap: (address: string) => void;
  onGetDirections: (from: string, to: string) => void;
  isCompact?: boolean;
}

const MobileJobActions: React.FC<MobileJobActionsProps> = ({
  jobDetails,
  onCallCustomer,
  onOpenMap,
  onGetDirections,
  isCompact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(!isCompact);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();
  
  const toast = useToast();
  const cardRef = useRef<HTMLDivElement>(null);

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const actionBg = useColorModeValue('gray.50', 'gray.700');

  const handleCopyReference = useCallback(() => {
    navigator.clipboard.writeText(jobDetails.reference);
    toast({
      title: 'Copied!',
      description: 'Job reference copied to clipboard',
      status: 'success',
      duration: 2000,
    });
  }, [jobDetails.reference, toast]);

  const handleShare = useCallback(async () => {
    const shareData = {
      title: `Job ${jobDetails.reference}`,
      text: `Customer: ${jobDetails.customer}\nFrom: ${jobDetails.from}\nTo: ${jobDetails.to}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback for browsers without Web Share API
      navigator.clipboard.writeText(
        `Job ${jobDetails.reference}\nCustomer: ${jobDetails.customer}\nFrom: ${jobDetails.from}\nTo: ${jobDetails.to}\n${window.location.href}`
      );
      toast({
        title: 'Copied!',
        description: 'Job details copied to clipboard',
        status: 'success',
        duration: 2000,
      });
    }
  }, [jobDetails, toast]);

  const toggleFullScreen = useCallback(() => {
    setIsFullScreen(!isFullScreen);
    setIsExpanded(true);
  }, [isFullScreen]);

  const quickActions = (
    <VStack spacing={3} width="100%">
      <HStack spacing={2} width="100%">
        <Button
          flex="1"
          colorScheme="green"
          leftIcon={<FaPhone />}
          onClick={onCallCustomer}
          size="lg"
          fontSize="md"
          height="60px"
          borderRadius="xl"
          _active={{ transform: 'scale(0.98)' }}
        >
          Call
        </Button>
        <Button
          flex="1"
          colorScheme="blue"
          leftIcon={<FaLocationArrow />}
          onClick={() => onOpenMap(jobDetails.from)}
          size="lg"
          fontSize="md"
          height="60px"
          borderRadius="xl"
          _active={{ transform: 'scale(0.98)' }}
        >
          Pickup
        </Button>
        <Button
          flex="1"
          colorScheme="purple"
          leftIcon={<FaDirections />}
          onClick={() => onGetDirections(jobDetails.from, jobDetails.to)}
          size="lg"
          fontSize="md"
          height="60px"
          borderRadius="xl"
          _active={{ transform: 'scale(0.98)' }}
        >
          Navigate
        </Button>
      </HStack>
      
      <Collapse in={isExpanded} animateOpacity>
        <VStack spacing={3} width="100%">
          <Button
            width="100%"
            variant="outline"
            leftIcon={<FaMap />}
            onClick={() => onOpenMap(jobDetails.to)}
            size="lg"
            height="50px"
            borderRadius="xl"
            _active={{ transform: 'scale(0.98)' }}
          >
            View Dropoff Location
          </Button>
          
          <HStack spacing={2} width="100%">
            <Button
              flex="1"
              variant="ghost"
              leftIcon={<FaCopy />}
              onClick={handleCopyReference}
              size="md"
              _active={{ transform: 'scale(0.98)' }}
            >
              Copy Ref
            </Button>
            <Button
              flex="1"
              variant="ghost"
              leftIcon={<FaShare />}
              onClick={handleShare}
              size="md"
              _active={{ transform: 'scale(0.98)' }}
            >
              Share
            </Button>
            <Button
              flex="1"
              variant="ghost"
              leftIcon={<FaExpandArrowsAlt />}
              onClick={onDrawerOpen}
              size="md"
              _active={{ transform: 'scale(0.98)' }}
            >
              Details
            </Button>
          </HStack>
        </VStack>
      </Collapse>
    </VStack>
  );

  return (
    <>
      {/* Mobile Quick Actions Card */}
      <ScaleFade in={true} initialScale={0.95}>
        <Card
          ref={cardRef}
          borderRadius="2xl"
          boxShadow="xl"
          overflow="hidden"
          bg={bg}
          border="1px"
          borderColor={borderColor}
          position="sticky"
          bottom={4}
          zIndex={10}
          mx={4}
        >
          <CardBody p={4}>
            <VStack spacing={4}>
              {/* Job Header */}
              <HStack justify="space-between" align="center" width="100%">
                <VStack align="start" spacing={1} flex="1">
                  <HStack>
                    <Text fontSize="sm" fontWeight="bold" color="blue.600">
                      {jobDetails.reference}
                    </Text>
                    <Badge colorScheme="green" size="sm">
                      {jobDetails.status}
                    </Badge>
                  </HStack>
                  <Text fontSize="xs" color="gray.600" noOfLines={1}>
                    {jobDetails.customer}
                  </Text>
                </VStack>
                
                <VStack align="end" spacing={1}>
                  <Text fontSize="lg" fontWeight="bold" color="green.600">
                    £{jobDetails.estimatedEarnings?.toFixed(2) || '0.00'}
                  </Text>
                  <IconButton
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    icon={isExpanded ? <FaChevronDown /> : <FaChevronUp />}
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsExpanded(!isExpanded)}
                  />
                </VStack>
              </HStack>

              {/* Quick Actions */}
              {quickActions}
            </VStack>
          </CardBody>
        </Card>
      </ScaleFade>

      {/* Full Details Drawer */}
      <Drawer isOpen={isDrawerOpen} placement="bottom" onClose={onDrawerClose} size="full">
        <DrawerOverlay />
        <DrawerContent borderTopRadius="2xl">
          <DrawerCloseButton size="lg" />
          <DrawerHeader pb={2}>
            <VStack align="start" spacing={2}>
              <HStack>
                <Text fontSize="xl" fontWeight="bold">
                  Job {jobDetails.reference}
                </Text>
                <Badge colorScheme="green" size="lg">
                  {jobDetails.status}
                </Badge>
              </HStack>
              <Text fontSize="md" color="gray.600">
                {jobDetails.customer}
              </Text>
            </VStack>
          </DrawerHeader>

          <DrawerBody pb={8}>
            <VStack spacing={6} align="stretch">
              {/* Earnings */}
              <Card bg={actionBg} borderRadius="xl">
                <CardBody p={4} textAlign="center">
                  <Text fontSize="2xl" fontWeight="bold" color="green.600">
                    £{jobDetails.estimatedEarnings?.toFixed(2) || '0.00'}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Estimated Earnings
                  </Text>
                </CardBody>
              </Card>

              {/* Locations */}
              <VStack spacing={4}>
                <Card bg={actionBg} borderRadius="xl" width="100%">
                  <CardBody p={4}>
                    <VStack align="stretch" spacing={3}>
                      <Text fontWeight="bold" color="green.600">
                        📍 Pickup Location
                      </Text>
                      <Text fontSize="sm">{jobDetails.from}</Text>
                      <HStack spacing={2}>
                        <Button
                          size="sm"
                          colorScheme="green"
                          onClick={() => onOpenMap(jobDetails.from)}
                          flex="1"
                        >
                          View Map
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onGetDirections("Current Location", jobDetails.from)}
                          flex="1"
                        >
                          Directions
                        </Button>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>

                <Card bg={actionBg} borderRadius="xl" width="100%">
                  <CardBody p={4}>
                    <VStack align="stretch" spacing={3}>
                      <Text fontWeight="bold" color="red.600">
                        🚩 Dropoff Location
                      </Text>
                      <Text fontSize="sm">{jobDetails.to}</Text>
                      <HStack spacing={2}>
                        <Button
                          size="sm"
                          colorScheme="red"
                          onClick={() => onOpenMap(jobDetails.to)}
                          flex="1"
                        >
                          View Map
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onGetDirections(jobDetails.from, jobDetails.to)}
                          flex="1"
                        >
                          Full Route
                        </Button>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>

              {/* Action Buttons */}
              <VStack spacing={3}>
                <Button
                  width="100%"
                  colorScheme="green"
                  size="lg"
                  leftIcon={<FaPhone />}
                  onClick={onCallCustomer}
                  height="60px"
                  fontSize="lg"
                  borderRadius="xl"
                >
                  Call Customer
                </Button>
                
                <HStack spacing={3} width="100%">
                  <Button
                    flex="1"
                    variant="outline"
                    leftIcon={<FaCopy />}
                    onClick={handleCopyReference}
                    size="lg"
                  >
                    Copy Reference
                  </Button>
                  <Button
                    flex="1"
                    variant="outline"
                    leftIcon={<FaShare />}
                    onClick={handleShare}
                    size="lg"
                  >
                    Share Job
                  </Button>
                </HStack>
              </VStack>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default MobileJobActions;