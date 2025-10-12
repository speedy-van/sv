import { Metadata } from 'next';
import { Container, Heading, Text, SimpleGrid, Box, VStack, HStack, Badge, Progress, Stat, StatLabel, StatNumber, StatHelpText, StatArrow } from '@chakra-ui/react';

export const metadata: Metadata = {
  title: 'SEO Dashboard | Speedy Van Admin',
  description: 'Monitor SEO performance, rankings, and organic traffic for Speedy Van website.',
};

// Mock data - in production, this would come from Google Analytics, Search Console, etc.
const seoMetrics = {
  organicTraffic: {
    current: 15420,
    previous: 12850,
    change: 20.1
  },
  averagePosition: {
    current: 8.3,
    previous: 12.1,
    change: -31.4
  },
  clickThroughRate: {
    current: 4.2,
    previous: 3.1,
    change: 35.5
  },
  impressions: {
    current: 45680,
    previous: 38920,
    change: 17.4
  }
};

const topKeywords = [
  { keyword: 'man and van london', position: 3, traffic: 2340, change: 12 },
  { keyword: 'house removals london', position: 5, traffic: 1890, change: 8 },
  { keyword: 'furniture delivery london', position: 7, traffic: 1560, change: 15 },
  { keyword: 'van hire london', position: 9, traffic: 1230, change: -3 },
  { keyword: 'moving services london', position: 11, traffic: 980, change: 22 }
];

const coreWebVitals = {
  lcp: { score: 2.1, status: 'good' },
  fid: { score: 45, status: 'good' },
  cls: { score: 0.05, status: 'good' }
};

const seoIssues = [
  { type: 'warning', message: '3 images missing alt attributes', count: 3 },
  { type: 'info', message: 'Blog content updated this week', count: 1 },
  { type: 'success', message: 'All pages have meta descriptions', count: 0 }
];

export default function SEODashboard() {
  return (
    <Container maxW="7xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box>
          <Heading as="h1" size="2xl" mb={2}>
            SEO Performance Dashboard
          </Heading>
          <Text color="gray.600">
            Monitor your website's search engine optimization performance
          </Text>
        </Box>

        {/* Key Metrics */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <Box p={6} borderWidth={1} borderRadius="lg">
            <Stat>
              <StatLabel>Organic Traffic</StatLabel>
              <StatNumber>{seoMetrics.organicTraffic.current.toLocaleString()}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                {seoMetrics.organicTraffic.change}% from last month
              </StatHelpText>
            </Stat>
          </Box>

          <Box p={6} borderWidth={1} borderRadius="lg">
            <Stat>
              <StatLabel>Average Position</StatLabel>
              <StatNumber>{seoMetrics.averagePosition.current}</StatNumber>
              <StatHelpText>
                <StatArrow type="decrease" />
                {Math.abs(seoMetrics.averagePosition.change)}% improvement
              </StatHelpText>
            </Stat>
          </Box>

          <Box p={6} borderWidth={1} borderRadius="lg">
            <Stat>
              <StatLabel>Click-Through Rate</StatLabel>
              <StatNumber>{seoMetrics.clickThroughRate.current}%</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                {seoMetrics.clickThroughRate.change}% from last month
              </StatHelpText>
            </Stat>
          </Box>

          <Box p={6} borderWidth={1} borderRadius="lg">
            <Stat>
              <StatLabel>Impressions</StatLabel>
              <StatNumber>{seoMetrics.impressions.current.toLocaleString()}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                {seoMetrics.impressions.change}% from last month
              </StatHelpText>
            </Stat>
          </Box>
        </SimpleGrid>

        {/* Top Keywords */}
        <Box>
          <Heading as="h2" size="lg" mb={4}>
            Top Performing Keywords
          </Heading>
          <VStack spacing={4} align="stretch">
            {topKeywords.map((keyword, index) => (
              <Box key={index} p={4} borderWidth={1} borderRadius="md">
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold">{keyword.keyword}</Text>
                    <Text fontSize="sm" color="gray.600">
                      Position: {keyword.position} | Traffic: {keyword.traffic}
                    </Text>
                  </VStack>
                  <Badge 
                    colorScheme={keyword.change > 0 ? 'green' : 'red'}
                    variant="subtle"
                  >
                    {keyword.change > 0 ? '+' : ''}{keyword.change}
                  </Badge>
                </HStack>
              </Box>
            ))}
          </VStack>
        </Box>

        {/* Core Web Vitals */}
        <Box>
          <Heading as="h2" size="lg" mb={4}>
            Core Web Vitals
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <Box p={4} borderWidth={1} borderRadius="md">
              <VStack spacing={2}>
                <Text fontWeight="bold">Largest Contentful Paint</Text>
                <Text fontSize="2xl" color={coreWebVitals.lcp.status === 'good' ? 'green.500' : 'red.500'}>
                  {coreWebVitals.lcp.score}s
                </Text>
                <Badge colorScheme={coreWebVitals.lcp.status === 'good' ? 'green' : 'red'}>
                  {coreWebVitals.lcp.status}
                </Badge>
              </VStack>
            </Box>

            <Box p={4} borderWidth={1} borderRadius="md">
              <VStack spacing={2}>
                <Text fontWeight="bold">First Input Delay</Text>
                <Text fontSize="2xl" color={coreWebVitals.fid.status === 'good' ? 'green.500' : 'red.500'}>
                  {coreWebVitals.fid.score}ms
                </Text>
                <Badge colorScheme={coreWebVitals.fid.status === 'good' ? 'green' : 'red'}>
                  {coreWebVitals.fid.status}
                </Badge>
              </VStack>
            </Box>

            <Box p={4} borderWidth={1} borderRadius="md">
              <VStack spacing={2}>
                <Text fontWeight="bold">Cumulative Layout Shift</Text>
                <Text fontSize="2xl" color={coreWebVitals.cls.status === 'good' ? 'green.500' : 'red.500'}>
                  {coreWebVitals.cls.score}
                </Text>
                <Badge colorScheme={coreWebVitals.cls.status === 'good' ? 'green' : 'red'}>
                  {coreWebVitals.cls.status}
                </Badge>
              </VStack>
            </Box>
          </SimpleGrid>
        </Box>

        {/* SEO Issues */}
        <Box>
          <Heading as="h2" size="lg" mb={4}>
            SEO Health Check
          </Heading>
          <VStack spacing={3} align="stretch">
            {seoIssues.map((issue, index) => (
              <Box key={index} p={4} borderWidth={1} borderRadius="md">
                <HStack justify="space-between">
                  <HStack spacing={3}>
                    <Badge 
                      colorScheme={
                        issue.type === 'success' ? 'green' : 
                        issue.type === 'warning' ? 'yellow' : 'blue'
                      }
                    >
                      {issue.type}
                    </Badge>
                    <Text>{issue.message}</Text>
                  </HStack>
                  {issue.count > 0 && (
                    <Badge colorScheme="red" variant="solid">
                      {issue.count}
                    </Badge>
                  )}
                </HStack>
              </Box>
            ))}
          </VStack>
        </Box>

        {/* Action Items */}
        <Box bg="blue.50" p={6} borderRadius="lg">
          <Heading as="h2" size="lg" mb={4}>
            Recommended Actions
          </Heading>
          <VStack spacing={3} align="stretch">
            <Text>• Add alt attributes to remaining images</Text>
            <Text>• Create more location-specific content for London boroughs</Text>
            <Text>• Optimize page loading speed for mobile devices</Text>
            <Text>• Add more FAQ content to improve featured snippets</Text>
            <Text>• Create video content for moving tips and guides</Text>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}
