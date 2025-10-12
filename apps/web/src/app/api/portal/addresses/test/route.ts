import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Simple test endpoint to verify the API is working
export async function GET() {
  try {
    const addressCount = await prisma.address.count();
    const contactCount = await prisma.contact.count();

    return NextResponse.json({
      message: 'Addresses & Contacts API is working',
      stats: {
        addresses: addressCount,
        contacts: contactCount,
      },
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
}
