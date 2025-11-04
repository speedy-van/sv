'use client';
import React from 'react';
import {
  Box,
  Grid,
  Heading,
  Text,
  Card,
  CardBody,
  VStack,
  HStack,
  Icon,
  Badge,
  LinkBox,
  LinkOverlay,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import {
  FiUsers,
  FiSettings,
  FiShield,
  FiFileText,
  FiArrowRight,
  FiDollarSign,
  FiPackage,
  FiUserCheck,
  FiMessageSquare,
  FiActivity,
  FiBriefcase,
} from 'react-icons/fi';

interface SettingsCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

function SettingsCard({
  title,
  description,
  href,
  icon,
  badge,
}: SettingsCardProps) {
  // Use neon dark theme colors
  const cardBg = 'bg.surface';
  const borderColor = 'border.primary';
  const hoverBg = 'bg.surface.hover';

  return (
    <LinkBox>
      <Card
        bg={cardBg}
        border="1px solid"
        borderColor={borderColor}
        _hover={{
          bg: hoverBg,
          borderColor: 'neon.500',
          transform: 'translateY(-2px)',
        }}
        transition="all 0.2s"
        cursor="pointer"
        h="full"
      >
        <CardBody>
          <VStack align="start" spacing={4}>
            <HStack justify="space-between" w="full">
              <Icon as={icon} boxSize={6} color="neon.500" />
              {badge && (
                <Badge colorScheme="blue" variant="subtle">
                  {badge}
                </Badge>
              )}
            </HStack>
            <Box flex={1}>
              <LinkOverlay as={NextLink} href={href}>
                <Heading size="md" mb={2}>
                  {title}
                </Heading>
              </LinkOverlay>
              <Text color="text.secondary" fontSize="sm">
                {description}
              </Text>
            </Box>
            <HStack w="full" justify="end">
              <Icon as={FiArrowRight} boxSize={4} color="text.tertiary" />
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    </LinkBox>
  );
}

export default function AdminSettings() {
  const settingsCards: SettingsCardProps[] = [
    {
      title: 'Pricing Settings',
      description:
        'Adjust customer prices and driver earnings rates. Control pricing adjustments globally.',
      href: '/admin/settings/pricing',
      icon: FiDollarSign,
      badge: 'Dynamic',
    },
    {
      title: 'Team & Roles',
      description:
        'Manage admin users, roles, and permissions. Control who can access what features.',
      href: '/admin/settings/team',
      icon: FiUsers,
      badge: 'RBAC',
    },
    {
      title: 'Orders Management',
      description:
        'Create complex orders with multiple drops and route optimization for efficient delivery.',
      href: '/admin/settings/orders',
      icon: FiPackage,
      badge: 'Multi-Drop',
    },
    {
      title: 'Driver Applications',
      description:
        'Review and process driver applications, approve or reject candidates, manage onboarding.',
      href: '/admin/drivers/applications',
      icon: FiUserCheck,
      badge: 'Onboarding',
    },
    {
      title: 'Career Applications',
      description:
        'Review job applications for internal positions, approve candidates, and send employment contracts.',
      href: '/admin/careers',
      icon: FiBriefcase,
      badge: 'HR',
    },
    {
      title: 'Send SMS',
      description:
        'Send SMS notifications to drivers, customers, or admins. Manage messaging and delivery status.',
      href: '/admin/settings/sms',
      icon: FiMessageSquare,
      badge: 'Messaging',
    },
    {
      title: 'Story Management',
      description:
        'Create and manage daily stories for drivers. Share updates, safety notes, and motivational messages.',
      href: '/admin/settings/stories',
      icon: FiActivity,
      badge: 'Daily',
    },
    {
      title: 'Integrations',
      description:
        'Configure Stripe, Pusher, Maps API, email providers, and webhooks.',
      href: '/admin/settings/integrations',
      icon: FiSettings,
      badge: 'API Keys',
    },
    {
      title: 'Security',
      description:
        '2FA settings, SSO configuration, session timeouts, and IP allowlists.',
      href: '/admin/settings/security',
      icon: FiShield,
      badge: 'Critical',
    },
    {
      title: 'Legal & Compliance',
      description:
        'Company information, VAT settings, privacy policies, and cookie configuration.',
      href: '/admin/settings/legal',
      icon: FiFileText,
      badge: 'GDPR',
    },
    {
      title: 'Tax Management',
      description:
        'Comprehensive tax management system with VAT returns, Corporation Tax, compliance monitoring, and HMRC integration.',
      href: '/admin/settings/tax',
      icon: FiActivity,
      badge: 'UK Compliant',
    },
  ];

  return (
    <Box p={6}>
      <VStack align="start" spacing={6} w="full">
        <Box>
          <Heading size="lg" mb={2}>
            Settings
          </Heading>
          <Text color="text.secondary">
            Manage your admin team, integrations, security settings, and legal
            compliance.
          </Text>
        </Box>

        <Grid
          templateColumns={{
            base: '1fr',
            md: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
          }}
          gap={6}
          w="full"
        >
          {settingsCards.map(card => (
            <SettingsCard key={card.href} {...card} />
          ))}
        </Grid>
      </VStack>
    </Box>
  );
}
