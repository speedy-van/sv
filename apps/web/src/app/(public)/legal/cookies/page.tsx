import {
  Box,
  Heading,
  Link as ChakraLink,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Text,
} from '@chakra-ui/react';
import NextLink from 'next/link';

export const metadata = { title: 'Cookies | Speedy Van' };

export default function CookiesPolicyPage() {
  return (
    <Box maxW="6xl" mx="auto" px={4} py={10}>
      <Heading as="h1" size="lg" mb={4}>
        Cookie Policy
      </Heading>
      <Text mb={6}>
        We use cookies to run the site and improve your experience. Functional,
        Analytics, and Marketing cookies are used only with your consent. You
        can change your preferences anytime via the Cookie settings link in the
        footer.
      </Text>

      <Heading as="h2" size="md" mt={8} mb={3}>
        Categories
      </Heading>
      <ul>
        <li>
          <b>Necessary</b>: required for core functionality (sessions,
          security).
        </li>
        <li>
          <b>Functional</b>: enhances features like saved addresses and maps.
        </li>
        <li>
          <b>Analytics</b>: helps us understand usage to improve the product.
        </li>
        <li>
          <b>Marketing</b>: used for ads measurement and personalization.
        </li>
      </ul>

      <Heading as="h2" size="md" mt={8} mb={3}>
        Cookies we use
      </Heading>
      <Table size="sm">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Purpose</Th>
            <Th>Category</Th>
            <Th>Expiry</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>__Host-next-auth.csrf-token</Td>
            <Td>CSRF protection for authentication</Td>
            <Td>Necessary</Td>
            <Td>Session</Td>
          </Tr>
          <Tr>
            <Td>__Secure-next-auth.session-token</Td>
            <Td>User session</Td>
            <Td>Necessary</Td>
            <Td>12 hours</Td>
          </Tr>
          <Tr>
            <Td>sv_consent</Td>
            <Td>Stores your cookie preferences</Td>
            <Td>Necessary</Td>
            <Td>6 months</Td>
          </Tr>
          <Tr>
            <Td>sv_pref_locale</Td>
            <Td>Preferred language</Td>
            <Td>Functional</Td>
            <Td>6 months</Td>
          </Tr>
          <Tr>
            <Td>sv_ab_bucket</Td>
            <Td>A/B testing bucket</Td>
            <Td>Analytics</Td>
            <Td>30 days</Td>
          </Tr>
        </Tbody>
      </Table>

      <Text mt={8}>
        For more information, see our{' '}
        <ChakraLink as={NextLink} href="/legal/privacy">
          Privacy Policy
        </ChakraLink>
        .
      </Text>
    </Box>
  );
}
