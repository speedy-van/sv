import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestAddressesAndContacts() {
  try {
    // Find a test customer (or create one if needed)
    let customer = await prisma.user.findFirst({
      where: { role: 'customer' },
    });

    if (!customer) {
      console.log('No customer found. Creating a test customer...');
      customer = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test Customer',
          password: 'hashedpassword123',
          role: 'customer',
        },
      });
    }

    console.log(`Using customer: ${customer.email}`);

    // Create test addresses
    const addresses = [
      {
        userId: customer.id,
        label: 'Home',
        line1: '123 Main Street',
        line2: 'Apartment 4B',
        city: 'London',
        postcode: 'SW1A 1AA',
        floor: '4th',
        flat: '4B',
        lift: true,
        notes: 'Please call when arriving',
        isDefault: true,
      },
      {
        userId: customer.id,
        label: 'Office',
        line1: '456 Business Park',
        line2: 'Suite 200',
        city: 'Manchester',
        postcode: 'M1 1AA',
        floor: '2nd',
        flat: '200',
        lift: true,
        notes: 'Reception will sign for delivery',
        isDefault: false,
      },
      {
        userId: customer.id,
        label: "Mum's House",
        line1: '789 Oak Avenue',
        city: 'Birmingham',
        postcode: 'B1 1AA',
        floor: 'Ground',
        flat: '',
        lift: false,
        notes: 'Please be quiet, mum works from home',
        isDefault: false,
      },
    ];

    // Create test contacts
    const contacts = [
      {
        userId: customer.id,
        label: 'Myself',
        name: 'John Smith',
        phone: '+44 7700 900000',
        email: 'john.smith@example.com',
        notes: 'Primary contact for all deliveries',
        isDefault: true,
      },
      {
        userId: customer.id,
        label: 'Partner',
        name: 'Jane Smith',
        phone: '+44 7700 900001',
        email: 'jane.smith@example.com',
        notes: "Alternative contact when I'm not available",
        isDefault: false,
      },
      {
        userId: customer.id,
        label: 'Work Contact',
        name: 'Mike Johnson',
        phone: '+44 7700 900002',
        email: 'mike.johnson@company.com',
        notes: 'Office reception contact',
        isDefault: false,
      },
    ];

    // Clear existing addresses and contacts for this user
    await prisma.address.deleteMany({
      where: { userId: customer.id },
    });

    await prisma.contact.deleteMany({
      where: { userId: customer.id },
    });

    // Create addresses
    console.log('Creating test addresses...');
    for (const addressData of addresses) {
      const address = await prisma.address.create({
        data: addressData,
      });
      console.log(`Created address: ${address.label}`);
    }

    // Create contacts
    console.log('Creating test contacts...');
    for (const contactData of contacts) {
      const contact = await prisma.contact.create({
        data: contactData,
      });
      console.log(`Created contact: ${contact.label}`);
    }

    console.log('✅ Test addresses and contacts created successfully!');
    console.log(`Customer ID: ${customer.id}`);
    console.log(`Customer Email: ${customer.email}`);
  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestAddressesAndContacts();
