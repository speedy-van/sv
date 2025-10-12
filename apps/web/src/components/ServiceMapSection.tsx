'use client';

import { Box, Container, VStack, Heading, Text } from '@chakra-ui/react';

const ServiceMapSection = () => {
  return (
    <Box py={{ base: 12, md: 16 }} bg="#f9fafb">
      <Container maxW="container.xl">
        <VStack spacing={8}>
          <Box textAlign="center" maxW="3xl" mx="auto">
            <Heading size={{ base: 'lg', md: 'xl' }} mb={4} color="#111827">
              🇬🇧 UK Service Coverage
            </Heading>
            <Text color="#6b7280" fontSize={{ base: 'md', md: 'lg' }}>
              Professional moving services across major UK cities
            </Text>
          </Box>
          
          <Box h="400px" bg="white" borderRadius="xl" p={8}>
            <Text textAlign="center" color="#6b7280">
              Interactive service map coming soon...
            </Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default ServiceMapSection;