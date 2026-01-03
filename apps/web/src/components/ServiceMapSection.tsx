'use client';

import React from 'react';
import { Box, Container, VStack, Heading, Text, HStack, Badge, SimpleGrid } from '@chakra-ui/react';
import { UK_CITIES, UKCity } from '@/data/uk-cities';

const ServiceMapSection = () => {
  // Group cities by country for display
  const citiesByCountry = UK_CITIES.reduce((acc, city) => {
    if (!acc[city.country]) {
      acc[city.country] = [];
    }
    acc[city.country].push(city);
    return acc;
  }, {} as Record<string, UKCity[]>);

  return (
    <Box py={{ base: 12, md: 16 }} bg="transparent">
      <Container maxW="container.xl">
        <VStack spacing={8}>
          <Box 
            textAlign="center" 
            maxW="3xl" 
            mx="auto"
            p={{ base: 6, md: 8 }}
            borderRadius="2xl"
            borderWidth="1px"
            borderColor="#1f2937"
            bg="rgba(0,0,0,0.9)"
            boxShadow="0 10px 35px rgba(0,0,0,0.6)"
            position="relative"
            _before={{
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: '2xl',
              padding: '2px',
              background: 'linear-gradient(135deg, rgba(0,194,255,0.25), rgba(0,209,143,0.25))',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              pointerEvents: 'none',
            }}
          >
            <Heading 
              size={{ base: 'lg', md: 'xl' }} 
              mb={4} 
              color="neon.400"
              textShadow="0 0 10px rgba(0,194,255,0.6), 0 0 20px rgba(0,194,255,0.4)"
            >
              🇬🇧 UK Service Coverage
            </Heading>
            <Text 
              color="whiteAlpha.700" 
              fontSize={{ base: 'md', md: 'lg' }}
              fontWeight="medium"
            >
              Professional moving services across {UK_CITIES.length}+ major UK cities
            </Text>
          </Box>

          {/* Cities Grid */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} w="100%">
            {Object.entries(citiesByCountry).map(([country, cities]) => (
              <Box 
                key={country}
                p={6}
                borderRadius="xl"
                borderWidth="1px"
                borderColor="#1f2937"
                bg="rgba(0,0,0,0.9)"
                boxShadow="0 10px 35px rgba(0,0,0,0.6)"
                position="relative"
                overflow="visible"
                className="stat-card-neon"
                transition="all 0.3s ease"
                _hover={{
                  borderColor: 'neon.400',
                  boxShadow: '0 0 30px rgba(0,194,255,0.4)',
                  transform: 'translateY(-4px)',
                }}
                sx={{
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '-2px',
                    left: '-2px',
                    right: '-2px',
                    bottom: '-2px',
                    background: 'linear-gradient(90deg, #00C2FF, #00D18F, #00C2FF, #00D18F)',
                    backgroundSize: '300% 300%',
                    borderRadius: 'xl',
                    zIndex: -1,
                    filter: 'blur(8px)',
                    opacity: 0.6,
                    animation: 'neon-glow 3s ease-in-out infinite',
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    width: '12px',
                    height: '12px',
                    background: 'radial-gradient(circle, white 0%, rgba(255,255,255,0.8) 30%, transparent 70%)',
                    borderRadius: 'full',
                    boxShadow: '0 0 15px rgba(255,255,255,0.9), 0 0 30px rgba(0,194,255,0.6)',
                    zIndex: 10,
                    animation: 'light-point-move 3s linear infinite',
                  },
                }}
              >
                <Heading 
                  size="md" 
                  mb={4} 
                  color="neon.400"
                  textShadow="0 0 8px rgba(0,194,255,0.5)"
                >
                  {country === 'England' && '🏴󠁧󠁢󠁥󠁮󠁧󠁿'} {country}
                  {country === 'Scotland' && '🏴󠁧󠁢󠁳󠁣󠁴󠁿'}
                  {country === 'Wales' && '🏴󠁧󠁢󠁷󠁬󠁳󠁿'}
                  {country === 'Northern Ireland' && '🇬🇧'}
                </Heading>
                <VStack spacing={3} align="start">
                  {cities.slice(0, 6).map((city) => (
                    <HStack 
                      key={city.slug} 
                      spacing={2}
                      p={2}
                      borderRadius="md"
                      transition="all 0.2s ease"
                      _hover={{
                        bg: 'rgba(0,194,255,0.1)',
                        transform: 'translateX(4px)',
                      }}
                      w="full"
                    >
                      <Box
                        w={2}
                        h={2}
                        bg="linear-gradient(135deg, #00C2FF, #00D18F)"
                        borderRadius="50%"
                        border="1px solid rgba(255, 255, 255, 0.5)"
                        boxShadow="0 0 8px rgba(0, 194, 255, 0.7)"
                        css={{
                          animation: 'pulse 2s ease-in-out infinite',
                          '@keyframes pulse': {
                            '0%, 100%': {
                              opacity: 1,
                            },
                            '50%': {
                              opacity: 0.6,
                            },
                          },
                        }}
                      />
                      <Text fontSize="sm" color="neon.200" fontWeight="medium">
                        {city.name}
                      </Text>
                      <Badge 
                        size="sm" 
                        colorScheme="blue" 
                        variant="subtle" 
                        bg="rgba(0, 194, 255, 0.15)" 
                        color="neon.300"
                        borderWidth="1px"
                        borderColor="rgba(0, 194, 255, 0.3)"
                        fontWeight="semibold"
                      >
                        {city.postcode}
                      </Badge>
                    </HStack>
                  ))}
                  {cities.length > 6 && (
                    <Text 
                      fontSize="sm" 
                      color="neon.300" 
                      fontStyle="italic"
                      pl={2}
                    >
                      +{cities.length - 6} more cities
                    </Text>
                  )}
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
};

export default ServiceMapSection;
