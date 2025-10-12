/**
 * Test smart geographic clustering system using miles
 */

// Simulate data for five customers
const testBookings = [
  {
    id: 'booking_x',
    pickupAddress: {
      lat: 55.7790, // Hamilton approximate (Speedy Van HQ)
      lng: -4.0393,
      label: 'ML3 0DG, Hamilton'
    },
    dropoffAddress: {
      lat: 55.7790,
      lng: -4.0393
    }
  },
  {
    id: 'booking_y',
    pickupAddress: {
      lat: 55.8473, // Motherwell approximate
      lng: -3.9933,
      label: 'ML1 4FG, Motherwell'
    },
    dropoffAddress: {
      lat: 55.8473,
      lng: -3.9933
    }
  },
  {
    id: 'booking_z',
    pickupAddress: {
      lat: 57.4778, // Inverness approximate
      lng: -4.2247,
      label: 'IV1 0AA, Inverness'
    },
    dropoffAddress: {
      lat: 57.4778,
      lng: -4.2247
    }
  },
  {
    id: 'booking_c',
    pickupAddress: {
      lat: 53.4839, // Manchester approximate
      lng: -2.2441,
      label: 'M1 1AA, Manchester'
    },
    dropoffAddress: {
      lat: 53.4839,
      lng: -2.2441
    }
  },
  {
    id: 'booking_f',
    pickupAddress: {
      lat: 51.5074, // London approximate
      lng: -0.1278,
      label: 'London'
    },
    dropoffAddress: {
      lat: 51.5074,
      lng: -0.1278
    }
  }
];

// Function to calculate distance (approximate)
function calculateDistance(loc1, loc2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
  const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

// Smart clustering system function
function calculateSmartClusterRadius(totalBookings) {
  if (totalBookings > 50) return 25;
  if (totalBookings > 20) return 50;
  if (totalBookings > 10) return 75;
  if (totalBookings > 5) return 100;
  return 125;
}

// Geographic clustering simulation function
function simulateGeographicClustering(bookings) {
  const maxClusterRadiusMiles = calculateSmartClusterRadius(bookings.length);
  console.log(`🎯 Smart system: ${bookings.length} bookings → radius ${maxClusterRadiusMiles} miles`);

  const clusters = [];
  const processed = new Set();

  for (let i = 0; i < bookings.length; i++) {
    if (processed.has(bookings[i].id)) continue;

    const cluster = [bookings[i]];
    processed.add(bookings[i].id);

    // Search for nearby bookings
    for (let j = 0; j < bookings.length; j++) {
      if (processed.has(bookings[j].id)) continue;

      const distanceKm = calculateDistance(
        bookings[i].pickupAddress,
        bookings[j].pickupAddress
      );
      const distanceMiles = distanceKm * 0.621371;

      if (distanceMiles <= maxClusterRadiusMiles) {
        cluster.push(bookings[j]);
        processed.add(bookings[j].id);
      }
    }

    if (cluster.length > 0) {
      clusters.push(cluster);
    }
  }

  return clusters;
}

// Run the test
console.log('🚛 Testing smart geographic clustering system');
console.log('========================================\n');

const clusters = simulateGeographicClustering(testBookings);

console.log(`📊 Result: ${clusters.length} multi-routes`);
console.log('');

clusters.forEach((cluster, index) => {
  console.log(`Route ${index + 1}: ${cluster.length} bookings`);
  cluster.forEach(booking => {
    console.log(`  - ${booking.id}: ${booking.pickupAddress.label}`);
  });
  console.log('');
});

// Analysis of distances between areas
console.log('📏 Distance Analysis (in miles):');
console.log('-----------------------------');

const locations = [
  { id: 'Hamilton', coords: testBookings[0].pickupAddress },
  { id: 'Motherwell', coords: testBookings[1].pickupAddress },
  { id: 'Inverness', coords: testBookings[2].pickupAddress },
  { id: 'Manchester', coords: testBookings[3].pickupAddress },
  { id: 'London', coords: testBookings[4].pickupAddress }
];

for (let i = 0; i < locations.length; i++) {
  for (let j = i + 1; j < locations.length; j++) {
    const distanceKm = calculateDistance(locations[i].coords, locations[j].coords);
    const distanceMiles = distanceKm * 0.621371;
    console.log(`${locations[i].id} ↔ ${locations[j].id}: ${distanceMiles.toFixed(0)} miles`);
  }
}
