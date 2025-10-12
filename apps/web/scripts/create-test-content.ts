import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestContent() {
  try {
    console.log('Creating test content data...');

    // Create sample service areas
    const serviceAreas = await Promise.all([
      prisma.serviceArea.create({
        data: {
          name: 'Central London',
          description:
            'Central London service area including Westminster, City of London, and surrounding areas',
          postcodes: [
            'SW1',
            'SW3',
            'SW5',
            'SW7',
            'W1',
            'W2',
            'W8',
            'W11',
            'WC1',
            'WC2',
          ],
          capacity: 50,
          status: 'active',
          blackoutDates: ['2024-12-25', '2024-12-26'],
          surgeMultiplier: 1.2,
          createdBy: 'system',
        },
      }),
      prisma.serviceArea.create({
        data: {
          name: 'Greater London',
          description: 'Greater London area covering all London boroughs',
          postcodes: [
            'SW',
            'W',
            'NW',
            'N',
            'E',
            'SE',
            'BR',
            'CR',
            'DA',
            'EN',
            'HA',
            'IG',
            'KT',
            'RM',
            'SM',
            'TW',
            'UB',
            'WD',
          ],
          capacity: 200,
          status: 'active',
          blackoutDates: [],
          surgeMultiplier: 1.0,
          createdBy: 'system',
        },
      }),
      prisma.serviceArea.create({
        data: {
          name: 'Manchester',
          description: 'Manchester city center and surrounding areas',
          postcodes: [
            'M1',
            'M2',
            'M3',
            'M4',
            'M5',
            'M6',
            'M7',
            'M8',
            'M9',
            'M10',
            'M11',
            'M12',
            'M13',
            'M14',
            'M15',
            'M16',
            'M17',
            'M18',
            'M19',
            'M20',
            'M21',
            'M22',
            'M23',
            'M24',
            'M25',
            'M26',
            'M27',
            'M28',
            'M29',
            'M30',
            'M31',
            'M32',
            'M33',
            'M34',
            'M35',
            'M38',
            'M40',
            'M41',
            'M43',
            'M44',
            'M45',
            'M46',
            'M50',
            'M90',
          ],
          capacity: 30,
          status: 'active',
          blackoutDates: [],
          surgeMultiplier: 1.1,
          createdBy: 'system',
        },
      }),
    ]);

    console.log(`Created ${serviceAreas.length} service areas`);

    // Create sample promotions
    const promotions = await Promise.all([
      prisma.promotion.create({
        data: {
          code: 'FIRST10',
          name: 'First Order Discount',
          description: '10% off your first order',
          type: 'percentage',
          value: 10,
          minSpend: 50,
          maxDiscount: 25,
          usageLimit: 1000,
          usedCount: 245,
          validFrom: new Date('2024-01-01'),
          validTo: new Date('2024-12-31'),
          status: 'active',
          applicableAreas: [serviceAreas[0].id, serviceAreas[1].id],
          applicableVans: ['small', 'medium', 'large'],
          firstTimeOnly: true,
          createdBy: 'system',
        },
      }),
      prisma.promotion.create({
        data: {
          code: 'WELCOME20',
          name: 'Welcome Discount',
          description: '£20 off orders over £100',
          type: 'fixed',
          value: 20,
          minSpend: 100,
          maxDiscount: 20,
          usageLimit: 500,
          usedCount: 89,
          validFrom: new Date('2024-01-15'),
          validTo: new Date('2024-06-30'),
          status: 'active',
          applicableAreas: [
            serviceAreas[0].id,
            serviceAreas[1].id,
            serviceAreas[2].id,
          ],
          applicableVans: ['small', 'medium', 'large'],
          firstTimeOnly: false,
          createdBy: 'system',
        },
      }),
      prisma.promotion.create({
        data: {
          code: 'SUMMER25',
          name: 'Summer Sale',
          description: '25% off during summer months',
          type: 'percentage',
          value: 25,
          minSpend: 75,
          maxDiscount: 50,
          usageLimit: 2000,
          usedCount: 0,
          validFrom: new Date('2024-06-01'),
          validTo: new Date('2024-08-31'),
          status: 'scheduled',
          applicableAreas: [serviceAreas[0].id, serviceAreas[1].id],
          applicableVans: ['small', 'medium', 'large'],
          firstTimeOnly: false,
          createdBy: 'system',
        },
      }),
    ]);

    console.log(`Created ${promotions.length} promotions`);

    // Create sample email templates
    const emailTemplates = await Promise.all([
      prisma.emailTemplate.create({
        data: {
          name: 'booking_confirmation',
          subject: 'Your booking has been confirmed - {bookingCode}',
          body: `
            <h2>Booking Confirmed!</h2>
            <p>Dear {customerName},</p>
            <p>Your booking has been confirmed with the following details:</p>
            <ul>
              <li><strong>Booking Code:</strong> {bookingCode}</li>
              <li><strong>Pickup Address:</strong> {pickupAddress}</li>
              <li><strong>Drop-off Address:</strong> {dropoffAddress}</li>
              <li><strong>Date:</strong> {bookingDate}</li>
              <li><strong>Time Slot:</strong> {timeSlot}</li>
              <li><strong>Total Amount:</strong> £{totalAmount}</li>
            </ul>
            <p>We'll send you updates as your booking progresses.</p>
            <p>Thank you for choosing our service!</p>
          `,
          variables: [
            'bookingCode',
            'customerName',
            'pickupAddress',
            'dropoffAddress',
            'bookingDate',
            'timeSlot',
            'totalAmount',
          ],
          category: 'booking',
          status: 'active',
          version: 1,
          createdBy: 'system',
        },
      }),
      prisma.emailTemplate.create({
        data: {
          name: 'driver_assigned',
          subject: 'Your driver has been assigned - {bookingCode}',
          body: `
            <h2>Driver Assigned!</h2>
            <p>Dear {customerName},</p>
            <p>A driver has been assigned to your booking {bookingCode}.</p>
            <p><strong>Driver:</strong> {driverName}</p>
            <p><strong>Vehicle:</strong> {vehicleType}</p>
            <p><strong>Estimated Arrival:</strong> {estimatedArrival}</p>
            <p>You can track your booking in real-time using the link below.</p>
            <p><a href="{trackingUrl}">Track Your Booking</a></p>
          `,
          variables: [
            'bookingCode',
            'customerName',
            'driverName',
            'vehicleType',
            'estimatedArrival',
            'trackingUrl',
          ],
          category: 'booking',
          status: 'active',
          version: 1,
          createdBy: 'system',
        },
      }),
    ]);

    console.log(`Created ${emailTemplates.length} email templates`);

    console.log('Test content data created successfully!');
  } catch (error) {
    console.error('Error creating test content:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestContent();
