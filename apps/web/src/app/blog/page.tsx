import { Metadata } from 'next';
import { Container, Heading, Text, SimpleGrid, Box, VStack, HStack, Badge } from '@chakra-ui/react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Moving Tips & Guides | Speedy Van Blog',
  description: 'Expert moving tips, student guides, and furniture delivery advice from London\'s leading man and van service. Get the best moving experience with our comprehensive guides.',
  keywords: 'moving tips, student moving guide, furniture delivery tips, house removal advice, London moving, van hire guide',
  alternates: { canonical: 'https://speedy-van.co.uk/blog' },
  openGraph: {
    title: 'Moving Tips & Guides | Speedy Van Blog',
    description: 'Expert moving tips and guides from London\'s leading man and van service.',
    url: 'https://speedy-van.co.uk/blog',
    siteName: 'Speedy Van',
    type: 'website',
  },
};

const blogPosts = [
  {
    id: 'ultimate-london-moving-guide',
    title: 'The Ultimate Guide to Moving in London',
    excerpt: 'Everything you need to know about moving in London, from choosing the right area to understanding transport links.',
    category: 'Moving Tips',
    readTime: '8 min read',
    date: '2025-01-20',
    slug: 'ultimate-london-moving-guide'
  },
  {
    id: 'student-moving-checklist',
    title: 'Student Moving Checklist: From University to New Home',
    excerpt: 'A comprehensive checklist for students moving to London, including what to pack and how to prepare.',
    category: 'Student Guide',
    readTime: '6 min read',
    date: '2025-01-18',
    slug: 'student-moving-checklist'
  },
  {
    id: 'furniture-delivery-tips',
    title: '10 Essential Tips for Safe Furniture Delivery',
    excerpt: 'Learn how to protect your furniture during delivery and ensure everything arrives in perfect condition.',
    category: 'Furniture Delivery',
    readTime: '5 min read',
    date: '2025-01-15',
    slug: 'furniture-delivery-tips'
  },
  {
    id: 'luxury-moving-services',
    title: 'Luxury Moving Services: When You Need the Best',
    excerpt: 'Discover our premium moving services for high-value items and luxury furniture delivery.',
    category: 'Luxury Services',
    readTime: '7 min read',
    date: '2025-01-12',
    slug: 'luxury-moving-services'
  },
  {
    id: 'packing-tips-professionals',
    title: 'Professional Packing Tips from Moving Experts',
    excerpt: 'Expert advice on how to pack your belongings safely and efficiently for your next move.',
    category: 'Packing Tips',
    readTime: '9 min read',
    date: '2025-01-10',
    slug: 'packing-tips-professionals'
  },
  {
    id: 'van-hire-vs-removal-company',
    title: 'Van Hire vs Removal Company: Which is Right for You?',
    excerpt: 'Compare the benefits of hiring a van versus using a full removal service for your move.',
    category: 'Moving Guide',
    readTime: '6 min read',
    date: '2025-01-08',
    slug: 'van-hire-vs-removal-company'
  }
];

const categories = [
  'All', 'Moving Tips', 'Student Guide', 'Furniture Delivery', 
  'Luxury Services', 'Packing Tips', 'Moving Guide'
];

export default function BlogPage() {
  return (
    <Container maxW="7xl" py={16}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading as="h1" size="2xl" mb={4}>
            Moving Tips & Expert Guides
          </Heading>
          <Text fontSize="xl" color="gray.600" maxW="3xl" mx="auto">
            Get expert advice on moving, furniture delivery, and making your relocation as smooth as possible.
          </Text>
        </Box>

        {/* Categories */}
        <HStack spacing={4} justify="center" flexWrap="wrap">
          {categories.map((category) => (
            <Badge
              key={category}
              colorScheme="blue"
              variant="outline"
              px={4}
              py={2}
              borderRadius="full"
              cursor="pointer"
              _hover={{ bg: 'blue.50' }}
            >
              {category}
            </Badge>
          ))}
        </HStack>

        {/* Blog Posts Grid */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
          {blogPosts.map((post) => (
            <Box
              key={post.id}
              borderWidth={1}
              borderRadius="lg"
              overflow="hidden"
              _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }}
              transition="all 0.3s"
            >
              <Box p={6}>
                <VStack align="stretch" spacing={4}>
                  <HStack justify="space-between" align="start">
                    <Badge colorScheme="blue" variant="solid">
                      {post.category}
                    </Badge>
                    <Text fontSize="sm" color="gray.500">
                      {post.readTime}
                    </Text>
                  </HStack>
                  
                  <Heading as="h2" size="md">
                    <Link href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
                      {post.title}
                    </Link>
                  </Heading>
                  
                  <Text color="gray.600" noOfLines={3}>
                    {post.excerpt}
                  </Text>
                  
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.500">
                      {new Date(post.date).toLocaleDateString('en-GB', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                    <Link 
                      href={`/blog/${post.slug}`}
                      style={{ 
                        color: '#3182ce', 
                        fontWeight: 'bold',
                        textDecoration: 'none'
                      }}
                    >
                      Read More →
                    </Link>
                  </HStack>
                </VStack>
              </Box>
            </Box>
          ))}
        </SimpleGrid>

        {/* CTA Section */}
        <Box
          bg="blue.50"
          borderRadius="lg"
          p={8}
          textAlign="center"
          mt={12}
        >
          <Heading as="h2" size="lg" mb={4}>
            Ready to Move?
          </Heading>
          <Text mb={6} color="gray.600">
            Get a quote for your next move with London's most trusted man and van service.
          </Text>
          <Link
            href="/booking-luxury"
            style={{
              display: 'inline-block',
              backgroundColor: '#3182ce',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            Get Quote Now
          </Link>
        </Box>
      </VStack>
    </Container>
  );
}
