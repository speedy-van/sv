import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const testCustomers = [
  {
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+44 7700 900123',
    addresses: [
      {
        label: 'Home',
        line1: '123 High Street',
        line2: 'Flat 2A',
        city: 'London',
        postcode: 'SW1A 1AA',
        floor: '2nd',
        flat: '2A',
        lift: true,
        notes: 'Ring doorbell twice',
        isDefault: true,
      },
      {
        label: 'Work',
        line1: '456 Oxford Street',
        line2: 'Suite 10',
        city: 'London',
        postcode: 'W1C 1AP',
        floor: '3rd',
        flat: '10',
        lift: true,
        notes: 'Reception will sign',
        isDefault: false,
      },
    ],
    contacts: [
      {
        label: 'Myself',
        name: 'John Smith',
        phone: '+44 7700 900123',
        email: 'john.smith@example.com',
        notes: 'Primary contact',
        isDefault: true,
      },
      {
        label: 'Partner',
        name: 'Jane Smith',
        phone: '+44 7700 900124',
        email: 'jane.smith@example.com',
        notes: 'Alternative contact',
        isDefault: false,
      },
    ],
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    phone: '+44 7700 900456',
    addresses: [
      {
        label: 'Home',
        line1: '789 Park Lane',
        city: 'Manchester',
        postcode: 'M1 1AA',
        floor: '1st',
        lift: false,
        notes: 'Parking available',
        isDefault: true,
      },
    ],
    contacts: [
      {
        label: 'Myself',
        name: 'Sarah Johnson',
        phone: '+44 7700 900456',
        email: 'sarah.johnson@example.com',
        notes: 'Primary contact',
        isDefault: true,
      },
    ],
  },
  {
    name: 'Mike Wilson',
    email: 'mike.wilson@example.com',
    phone: '+44 7700 900789',
    addresses: [
      {
        label: 'Home',
        line1: '321 Baker Street',
        line2: 'Apartment 5',
        city: 'Birmingham',
        postcode: 'B1 1AA',
        floor: '5th',
        flat: '5',
        lift: true,
        notes: 'Building access code: 1234',
        isDefault: true,
      },
    ],
    contacts: [
      {
        label: 'Myself',
        name: 'Mike Wilson',
        phone: '+44 7700 900789',
        email: 'mike.wilson@example.com',
        notes: 'Primary contact',
        isDefault: true,
      },
    ],
  },
  {
    name: 'Emma Davis',
    email: 'emma.davis@example.com',
    phone: '+44 7700 900012',
    addresses: [
      {
        label: 'Home',
        line1: '654 Queen Street',
        city: 'Edinburgh',
        postcode: 'EH1 1AA',
        floor: '2nd',
        lift: true,
        notes: 'Historic building - narrow stairs',
        isDefault: true,
      },
      {
        label: 'Office',
        line1: '987 Princes Street',
        line2: 'Floor 4',
        city: 'Edinburgh',
        postcode: 'EH2 1AA',
        floor: '4th',
        lift: true,
        notes: 'Security badge required',
        isDefault: false,
      },
    ],
    contacts: [
      {
        label: 'Myself',
        name: 'Emma Davis',
        phone: '+44 7700 900012',
        email: 'emma.davis@example.com',
        notes: 'Primary contact',
        isDefault: true,
      },
      {
        label: 'Assistant',
        name: 'David Brown',
        phone: '+44 7700 900013',
        email: 'david.brown@example.com',
        notes: 'Work contact',
        isDefault: false,
      },
    ],
  },
  {
    name: 'Tom Brown',
    email: 'tom.brown@example.com',
    phone: '+44 7700 900345',
    addresses: [
      {
        label: 'Home',
        line1: '147 King Street',
        city: 'Liverpool',
        postcode: 'L1 1AA',
        floor: '3rd',
        lift: false,
        notes: 'No parking - street parking only',
        isDefault: true,
      },
    ],
    contacts: [
      {
        label: 'Myself',
        name: 'Tom Brown',
        phone: '+44 7700 900345',
        email: 'tom.brown@example.com',
        notes: 'Primary contact',
        isDefault: true,
      },
    ],
  },
];

async function createTestCustomers() {
  console.log('Creating test customers...');

  for (const customerData of testCustomers) {
    try {
      // Check if customer already exists
      const existingCustomer = await prisma.user.findUnique({
        where: { email: customerData.email },
      });

      if (existingCustomer) {
        console.log(
          `Customer ${customerData.email} already exists, skipping...`
        );
        continue;
      }

      // Create customer
      const customer = await prisma.user.create({
        data: {
          name: customerData.name,
          email: customerData.email,
          role: 'customer',
          password: await hash('password123', 12),
          emailVerified: true,
        },
      });

      console.log(`Created customer: ${customer.name} (${customer.email})`);

      // Create addresses
      for (const addressData of customerData.addresses) {
        await prisma.address.create({
          data: {
            userId: customer.id,
            ...addressData,
          },
        });
      }

      // Create contacts
      for (const contactData of customerData.contacts) {
        await prisma.contact.create({
          data: {
            userId: customer.id,
            ...contactData,
          },
        });
      }

      // Create some support tickets for some customers
      if (
        customerData.name === 'John Smith' ||
        customerData.name === 'Emma Davis'
      ) {
        await prisma.supportTicket.create({
          data: {
            customerId: customer.id,
            category: 'Booking Issues',
            description: 'Need to reschedule my delivery',
            email: customerData.email,
            phone: customerData.phone,
            status: 'OPEN',
            priority: 'NORMAL',
          },
        });
      }

      console.log(`Created addresses and contacts for ${customer.name}`);
    } catch (error) {
      console.error(`Error creating customer ${customerData.email}:`, error);
    }
  }

  console.log('Test customers creation completed!');
}

async function main() {
  try {
    await createTestCustomers();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
