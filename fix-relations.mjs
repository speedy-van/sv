import fs from 'fs';

const schemaPath = 'packages/shared/prisma/schema.prisma';
let content = fs.readFileSync(schemaPath, 'utf8');

// Rename relation fields to lowercase versions that match the code
const replacements = [
  // Booking model - already done manually
  
  // Assignment model
  ['Booking        Booking', 'booking        Booking'],
  ['Driver         Driver', 'driver         Driver'],
  
  // BookingAddress model
  ['Booking_Booking_dropoffAddressIdToBookingAddress          Booking[]', 'bookings_dropoff Booking[] '],
  ['Booking_Booking_pickupAddressIdToBookingAddress           Booking[]', 'bookings_pickup  Booking[] '],
  ['BookingSegment_BookingSegment_dropoffAddressIdToBookingAddress  BookingSegment[]', 'segments_dropoff BookingSegment[]'],
  ['BookingSegment_BookingSegment_pickupAddressIdToBookingAddress   BookingSegment[]', 'segments_pickup  BookingSegment[]'],
  
  // User model relations
  ['Driver   Driver?', 'driver   Driver?'],
  
  // Route model
  ['Driver   Driver?                 @relation(fields: [driverId]', 'driver   Driver?                 @relation(fields: [driverId]'],
  ['Vehicle  Vehicle?                @relation(fields: [vehicleId]', 'vehicle  Vehicle?                @relation(fields: [vehicleId]'],
  ['Drop     Drop[]', 'drops    Drop[]'],
  
  // PropertyDetails
  ['Booking_Booking_dropoffPropertyIdToPropertyDetails Booking[] @relation("Booking_dropoffPropertyIdToPropertyDetails")', 'bookings_dropoff Booking[] @relation("Booking_dropoffPropertyIdToPropertyDetails")'],
  ['Booking_Booking_pickupPropertyIdToPropertyDetails  Booking[] @relation("Booking_pickupPropertyIdToPropertyDetails")', 'bookings_pickup  Booking[] @relation("Booking_pickupPropertyIdToPropertyDetails")'],
];

for (const [oldStr, newStr] of replacements) {
  content = content.replace(oldStr, newStr);
}

fs.writeFileSync(schemaPath, content);
console.log('Relations renamed successfully!');
