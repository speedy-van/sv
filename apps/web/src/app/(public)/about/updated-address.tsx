/**
 * Updated Business Address Component
 * 
 * Use this component to display the correct business address
 */

import { Box, Text, VStack, Link, Icon } from '@chakra-ui/react';
import { FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa';
import { BUSINESS_INFO } from '@/config/seo';

export function BusinessAddress() {
  const { address, contact } = BUSINESS_INFO;
  
  return (
    <VStack align="start" spacing={4}>
      {/* Address */}
      <Box>
        <Text fontWeight="bold" mb={2} display="flex" alignItems="center" gap={2}>
          <Icon as={FaMapMarkerAlt} color="neon.500" />
          Our Office
        </Text>
        <Text>{address.office}</Text>
        <Text>{address.street}</Text>
        <Text>{address.city}</Text>
        <Text>{address.postcode}</Text>
        <Text>{address.country}</Text>
      </Box>

      {/* Phone */}
      <Box>
        <Text fontWeight="bold" mb={2} display="flex" alignItems="center" gap={2}>
          <Icon as={FaPhone} color="neon.500" />
          Phone
        </Text>
        <Link href={`tel:${contact.phone}`} color="neon.500">
          {contact.phone}
        </Link>
      </Box>

      {/* Email */}
      <Box>
        <Text fontWeight="bold" mb={2} display="flex" alignItems="center" gap={2}>
          <Icon as={FaEnvelope} color="neon.500" />
          Email
        </Text>
        <Link href={`mailto:${contact.email}`} color="neon.500">
          {contact.email}
        </Link>
      </Box>
    </VStack>
  );
}

// Inline address text (for footer, etc.)
export function InlineAddress() {
  const { address } = BUSINESS_INFO;
  
  return (
    <Text fontSize="sm" color="text.secondary">
      {address.office}, {address.street}, {address.city}, {address.postcode}, {address.country}
    </Text>
  );
}

// Google Maps embed
export function GoogleMapsEmbed() {
  const { address, coordinates } = BUSINESS_INFO;
  const mapUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2237.5!2d${coordinates.longitude}!3d${coordinates.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTXCsDQ2JzQxLjkiTiA0wrAwMicxOS4zIlc!5e0!3m2!1sen!2suk!4v1234567890`;
  
  return (
    <Box
      as="iframe"
      src={mapUrl}
      width="100%"
      height="400px"
      style={{ border: 0 }}
      allowFullScreen
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      title={`Map showing ${address.office}, ${address.city}`}
    />
  );
}

export default {
  BusinessAddress,
  InlineAddress,
  GoogleMapsEmbed,
};

