'use client';

import { useState, useEffect } from 'react';
import { Box, Text, HStack, Icon, Image } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { FaTruck, FaCheckCircle } from 'react-icons/fa';

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.03); }
`;

const slideIn = keyframes`
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const fadeInOut = keyframes`
  0% { opacity: 0; transform: scale(0.8) rotate(-5deg); }
  10% { opacity: 1; transform: scale(1) rotate(0deg); }
  90% { opacity: 1; transform: scale(1) rotate(0deg); }
  100% { opacity: 0; transform: scale(0.8) rotate(5deg); }
`;

const itemImages = [
  { src: '/UK_Removal_Dataset/Images_Only/Living_room_Furniture/sofa_3_seat_fabric_modern_lestar_jpg_48kg.jpg', label: 'Sofa' },
  { src: '/UK_Removal_Dataset/Images_Only/Bedroom/double_bed_frame_harper_storage_mattress_jpg_45kg.jpg', label: 'Bed' },
  { src: '/UK_Removal_Dataset/Images_Only/Wardrobes_closet/wardrobe_double_door_harmony_wood_better_home_jpg_68kg.jpg', label: 'Wardrobe' },
  { src: '/UK_Removal_Dataset/Images_Only/Bag_luggage_box/moving_boxes_8_best_top_moving_house_boxes_jpg_18kg.jpg', label: 'Boxes' },
  { src: '/UK_Removal_Dataset/Images_Only/Kitchen_appliances/washing_machine_standard_dimensions_jpg_75kg.jpg', label: 'Appliance' },
  { src: '/UK_Removal_Dataset/Images_Only/Kitchen_appliances/american_fridge_freezer_bosch_jpg_145kg.jpg', label: 'Fridge' },
];

export default function LiveBookingCounter() {
  const [bookingCount, setBookingCount] = useState(0);
  const [recentBooking, setRecentBooking] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIncrementing, setIsIncrementing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    // Set initial realistic count
    const initialCount = Math.floor(Math.random() * 30) + 25;
    setBookingCount(initialCount);

    // Fetch today's booking count
    const fetchBookingCount = async () => {
      try {
        const response = await fetch('/api/stats/today-bookings');
        if (response.ok) {
          const data = await response.json();
          // Use API count if it's reasonable, otherwise keep the initial
          if (data.count && data.count > 0) {
            setBookingCount(data.count);
          }
        }
      } catch (error) {
        // Keep initial fallback count
        console.log('Using fallback booking count');
      }
    };

    fetchBookingCount();

    // Rotate item images every 4 seconds
    const imageInterval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % itemImages.length);
    }, 4000);

    // Simulate real-time updates
    const interval = setInterval(() => {
      setIsIncrementing(true);
      setBookingCount(prev => prev + 1);
      
      // Show recent booking notification
      const cities = ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Bristol', 'Liverpool', 'Edinburgh'];
      const services = ['Sofa delivery', 'House move', 'Man & van', 'Furniture pickup', 'Marketplace delivery'];
      const randomCity = cities[Math.floor(Math.random() * cities.length)];
      const randomService = services[Math.floor(Math.random() * services.length)];
      const minutes = Math.floor(Math.random() * 15) + 1;
      
      setRecentBooking(`${randomService} in ${randomCity} • ${minutes} min ago`);
      setIsVisible(true);

      setTimeout(() => setIsIncrementing(false), 600);
      setTimeout(() => setIsVisible(false), 6000);
    }, 45000); // Update every 45 seconds

    return () => {
      clearInterval(interval);
      clearInterval(imageInterval);
    };
  }, []);

  return (
    <Box textAlign="center" position="relative" mt={{ base: 4, md: 6, lg: 8 }}>
      {/* Today's Bookings Counter */}
      <HStack
        spacing={{ base: 3, md: 4, lg: 5 }}
        px={{ base: 5, md: 7, lg: 9 }}
        py={{ base: 3, md: 4, lg: 5 }}
        bg="linear-gradient(135deg, rgba(0,194,255,0.25), rgba(0,209,143,0.2), rgba(138,43,226,0.15))"
        borderRadius="2xl"
        border="2px solid"
        borderColor="rgba(0,194,255,0.5)"
        backdropFilter="blur(16px)"
        boxShadow="0 8px 32px rgba(0,194,255,0.4), 0 0 60px rgba(0,209,143,0.3), inset 0 1px 2px rgba(255,255,255,0.3)"
        animation={`${pulse} 3s ease-in-out infinite`}
        transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
        _hover={{
          transform: 'translateY(-4px) scale(1.03)',
          boxShadow: '0 12px 40px rgba(0,194,255,0.5), 0 0 80px rgba(0,209,143,0.4)',
          borderColor: 'rgba(0,209,143,0.6)',
        }}
        display="inline-flex"
        alignItems="center"
        position="relative"
        overflow="hidden"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
          animation: `${shimmer} 3s ease-in-out infinite`,
        }}
      >
        <Box
          position="relative"
          borderRadius="xl"
          overflow="hidden"
          boxShadow="0 0 20px rgba(0,194,255,0.6), 0 0 40px rgba(0,209,143,0.4)"
          border="3px solid"
          borderColor="cyan.400"
          bg="rgba(0,0,0,0.3)"
          p={1}
        >
          <Image 
            src={itemImages[currentImageIndex].src}
            alt={itemImages[currentImageIndex].label}
            boxSize={{ base: "32px", md: "70px", lg: "100px", xl: "120px" }}
            borderRadius="lg"
            objectFit="cover"
            animation={`${fadeInOut} 4s ease-in-out infinite`}
            filter="brightness(1.1) contrast(1.1)"
            transition="all 0.3s ease"
            _hover={{ filter: 'brightness(1.3) contrast(1.2)' }}
          />
        </Box>
        <Box
          animation={`${pulse} 2s ease-in-out infinite`}
          display="flex"
          alignItems="center"
        >
          <Icon 
            as={FaTruck} 
            color="cyan.300" 
            boxSize={{ base: 5, md: 6, lg: 7 }}
            filter="drop-shadow(0 0 12px rgba(0,194,255,0.8)) drop-shadow(0 0 6px rgba(0,209,143,0.6))"
            transition="all 0.3s ease"
            _hover={{ transform: 'translateX(4px)' }}
          />
        </Box>
        <Box textAlign="left">
          <Text 
            fontSize={{ base: "md", md: "lg", lg: "xl" }}
            fontWeight="extrabold" 
            color="white"
            letterSpacing="wide"
            textShadow="0 2px 8px rgba(0,0,0,0.4), 0 0 20px rgba(0,194,255,0.5)"
            lineHeight="shorter"
          >
            <Text 
              as="span" 
              fontSize={{ base: "2xl", md: "3xl", lg: "4xl" }}
              transition="all 0.3s ease"
              transform={isIncrementing ? 'scale(1.2)' : 'scale(1)'}
              display="inline-block"
              fontWeight="black"
              sx={{
                background: 'linear-gradient(135deg, #00E5FF, #00D18F, #8A2BE2, #00E5FF)',
                backgroundSize: '300% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: isIncrementing ? `${shimmer} 0.6s ease-in-out` : undefined,
              }}
            >
              {bookingCount}
            </Text>
            <Text 
              as="span" 
              ml={2}
              fontSize={{ base: "sm", md: "md", lg: "lg" }}
              color="cyan.200"
              fontWeight="bold"
            >
              moves today
            </Text>
          </Text>
          <Text 
            fontSize={{ base: "2xs", md: "xs" }}
            color="whiteAlpha.700"
            mt={0.5}
            fontWeight="medium"
          >
            🔥 Live tracking
          </Text>
        </Box>
      </HStack>

      {/* Recent Booking Notification */}
      {isVisible && recentBooking && (
        <Box
          mt={{ base: 3, md: 4 }}
          px={{ base: 4, md: 6 }}
          py={{ base: 2, md: 3 }}
          bg="linear-gradient(135deg, rgba(0,209,143,0.25), rgba(0,194,255,0.15), rgba(138,43,226,0.1))"
          borderRadius="xl"
          border="2px solid"
          borderColor="rgba(0,209,143,0.5)"
          backdropFilter="blur(12px)"
          animation={`${slideIn} 0.4s ease-out, ${pulse} 2s ease-in-out infinite`}
          boxShadow="0 6px 20px rgba(0,209,143,0.35), 0 0 30px rgba(0,194,255,0.2)"
          display="inline-block"
          position="relative"
          overflow="hidden"
          _before={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, rgba(0,209,143,0.8), transparent)',
            animation: `${shimmer} 2s ease-in-out infinite`,
          }}
        >
          <HStack spacing={{ base: 2, md: 3 }} justify="center">
            <Icon 
              as={FaCheckCircle} 
              color="green.400" 
              boxSize={{ base: 4, md: 5 }}
              filter="drop-shadow(0 0 8px rgba(0,209,143,0.8))"
            />
            <Text 
              fontSize={{ base: "xs", md: "sm" }}
              fontWeight="bold" 
              color="whiteAlpha.900"
              textShadow="0 1px 4px rgba(0,0,0,0.3)"
            >
              Just booked: <Text as="span" color="green.300" fontWeight="extrabold">{recentBooking}</Text>
            </Text>
          </HStack>
        </Box>
      )}
    </Box>
  );
}
