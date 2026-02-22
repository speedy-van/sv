'use client';

import React from 'react';
import NextLink from 'next/link';
import { Box, Container, HStack, Link, SimpleGrid, Text, VStack } from '@chakra-ui/react';

const columns = [
  {
    title: 'Services',
    items: [
      { label: 'House Removals', href: '/house-removals' },
      { label: 'Office Removals', href: '/office-removals' },
      { label: 'Single Item Delivery', href: '/single-item-delivery' },
      { label: 'Student Moves', href: '/student-moves' },
    ],
  },
  {
    title: 'Company',
    items: [
      { label: 'About', href: '/about' },
      { label: 'How It Works', href: '/how-it-works' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Legal',
    items: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/legal/cookies' },
      { label: 'Cancellation Policy', href: '/cancellation' },
    ],
  },
];

const HomeFooter: React.FC = () => {
  return (
    <Box as="footer" bg="bg.footer" borderTop="1px solid" borderColor="border.primary" mt={12}>
      <Container maxW="container.xl" py={{ base: 10, md: 12 }}>
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={8}>
          <VStack align="start" spacing={3}>
            <Text color="text.primary" fontWeight="800" fontSize="lg">
              Speedy Van
            </Text>
            <Text color="text.secondary" fontSize="sm">
              Reliable moving and delivery across the UK with transparent pricing and fast support.
            </Text>
            <Text color="text.secondary" fontSize="sm">
              01202 129746
            </Text>
            <Text color="text.secondary" fontSize="sm">
              support@speedy-van.co.uk
            </Text>
          </VStack>

          {columns.map((col) => (
            <VStack key={col.title} align="start" spacing={2}>
              <Text color="text.primary" fontWeight="700">
                {col.title}
              </Text>
              {col.items.map((item) => (
                <Link
                  key={item.href}
                  as={NextLink}
                  href={item.href}
                  color="text.secondary"
                  _hover={{ color: 'text.primary', textDecoration: 'none' }}
                >
                  {item.label}
                </Link>
              ))}
            </VStack>
          ))}
        </SimpleGrid>

        <HStack
          mt={8}
          pt={5}
          borderTop="1px solid"
          borderColor="border.secondary"
          justify="space-between"
          flexWrap="wrap"
          rowGap={2}
        >
          <Text color="text.tertiary" fontSize="sm">
            Speedy Van. All rights reserved.
          </Text>
          <Text color="text.tertiary" fontSize="sm">
            Built for speed and clarity.
          </Text>
        </HStack>
      </Container>
    </Box>
  );
};

export default HomeFooter;

